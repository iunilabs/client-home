const LIMIT = 2;
const clamp = value => Math.max(-LIMIT, Math.min(LIMIT, value));
const delta = (value, origin) => ((value - origin + 540) % 360) - 180;

export function cityOrientation(event, origin, screenAngle = 0) {
  if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return null;
  if (!origin || origin.screenAngle !== screenAngle) return {origin: {beta: event.beta, gamma: event.gamma, screenAngle}, x: 0, y: 0};
  const angle = screenAngle * Math.PI / 180;
  const beta = delta(event.beta, origin.beta), gamma = delta(event.gamma, origin.gamma);
  return {origin, x: clamp(-(beta * Math.cos(angle) - gamma * Math.sin(angle)) / 10),
    y: clamp((gamma * Math.cos(angle) + beta * Math.sin(angle)) / 10)};
}

export function createCityPerspective(target = window) {
  const compatible = Boolean(target.isSecureContext && target.DeviceOrientationEvent);
  const needsPermission = typeof target.DeviceOrientationEvent?.requestPermission === 'function';
  const prefersReducedMotion = () => Boolean(target.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  let origin = null, listening = false, enabled = false, hasReading = false, lastTime = null, pending = null;
  let desired = {x: 0, y: 0}, value = {x: 0, y: 0};
  let state = compatible ? 'inactive' : 'unavailable';
  const screenAngle = () => target.screen?.orientation?.angle ?? target.orientation ?? 0;
  function receive(event) {
    const result = cityOrientation(event, origin, screenAngle());
    if (!result) {recalibrate(); state = 'awaiting-sensor'; return}
    origin = result.origin;
    desired = {x: result.x, y: result.y};
    hasReading = true;
    state = 'active';
  }
  function recalibrate() {origin = null; desired = {x: 0, y: 0}; hasReading = false}
  function listen(wanted) {
    if (wanted === listening) return;
    listening = wanted;
    const method = wanted ? 'addEventListener' : 'removeEventListener';
    target[method]('deviceorientation', receive);
    target[method]('orientationchange', recalibrate);
    target.screen?.orientation?.[method]('change', recalibrate);
    if (wanted) recalibrate();
  }
  function deactivate() {
    enabled = false; listen(false); recalibrate();
    desired = value = {x: 0, y: 0}; state = compatible ? 'inactive' : 'unavailable';
  }
  function activate() {
    if (!compatible) return Promise.resolve(state = 'unavailable');
    if (prefersReducedMotion()) return Promise.resolve(state = 'reduced-motion');
    if (enabled) {deactivate(); return Promise.resolve(state)}
    if (pending) return pending;
    state = 'requesting-permission';
    try {
      // Call permission synchronously from the activation tap; Safari rejects
      // calls made later from an animation frame or effect.
      const permission = needsPermission ? target.DeviceOrientationEvent.requestPermission() : 'granted';
      pending = Promise.resolve(permission).then(result => {
        if (result !== 'granted') return state = 'denied';
        enabled = true;
        return state = 'awaiting-sensor';
      }).catch(() => {
        enabled = false;
        return state = 'error';
      }).finally(() => {pending = null});
      return pending;
    } catch {
      enabled = false;
      return Promise.resolve(state = 'error');
    }
  }
  function recenter() {recalibrate(); value = {x: 0, y: 0}; if (enabled) state = 'awaiting-sensor'}
  return {
    activate,
    recenter,
    get enabled() {return enabled},
    get available() {return compatible},
    get requiresPermission() {return needsPermission},
    update(now, {active, reduced, paused}) {
      if (!compatible) return {x: 0, y: 0, hasReading: false, state};
      const motionReduced = reduced || prefersReducedMotion();
      const suspended = !active || motionReduced || paused || target.document?.hidden;
      listen(enabled && !suspended);
      if (!enabled || !active || motionReduced) {
        hasReading = false; desired = value = {x: 0, y: 0};
        if (!enabled && !['requesting-permission', 'denied', 'error'].includes(state)) state = compatible ? 'inactive' : 'unavailable';
        else if (motionReduced) state = 'reduced-motion';
        lastTime = now;
      } else if (paused || target.document?.hidden) {
        state = 'paused'; lastTime = now;
      } else {
        if (!hasReading) state = 'awaiting-sensor';
        const elapsed = Math.min(.08, Math.max(0, (now - (lastTime ?? now)) / 1000));
        const response = 1 - Math.exp(-elapsed * 5);
        value = {x: value.x + (desired.x - value.x) * response, y: value.y + (desired.y - value.y) * response};
        lastTime = now;
      }
      return {...value, hasReading, state};
    },
    dispose() {listen(false)},
  };
}
