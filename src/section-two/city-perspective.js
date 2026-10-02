const clamp = value => Math.max(-2, Math.min(2, value));
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
  const compatible = target.isSecureContext && Boolean(target.DeviceOrientationEvent);
  let origin = null, listening = false, hasReading = false, lastTime = null;
  let desired = {x: 0, y: 0}, value = {x: 0, y: 0}, state = compatible ? 'inactive' : 'unavailable';
  const screenAngle = () => target.screen?.orientation?.angle ?? target.orientation ?? 0;
  function receive(event) {
    const result = cityOrientation(event, origin, screenAngle());
    if (!result) return;
    origin = result.origin;
    desired = {x: result.x, y: result.y};
    hasReading = true;
    state = 'active';
  }
  function recalibrate() {origin = null; desired = {x: 0, y: 0}}
  function listen(enabled) {
    if (enabled === listening) return;
    listening = enabled;
    const method = enabled ? 'addEventListener' : 'removeEventListener';
    target[method]('deviceorientation', receive);
    target[method]('orientationchange', recalibrate);
    target.screen?.orientation?.[method]('change', recalibrate);
    recalibrate();
  }
  return {
    update(now, {active, reduced, paused}) {
      if (!compatible) return {x: 0, y: 0, hasReading: false, state};
      listen(active && !reduced && !paused);
      if (!active || reduced) {
        origin = null; hasReading = false;
        desired = value = {x: 0, y: 0};
        state = 'inactive'; lastTime = now;
      } else if (paused) {state = hasReading ? 'paused' : 'awaiting-sensor'; lastTime = now}
      else {
        state = hasReading && origin ? 'active' : 'awaiting-sensor';
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
