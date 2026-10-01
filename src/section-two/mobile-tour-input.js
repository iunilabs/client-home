// One wheel burst can request at most one step. Every tail event extends the
// quiet period, even if the camera has already arrived or the chapter was left.
export function createWheelBurst({quiet = 240, threshold = 60, tailQuiet = 900} = {}) {
  let last = -Infinity, total = 0, consumed = false, previousDelta = 0, peak = 0, direction = 0;
  // Heavy paint can delay a decaying tail beyond the normal quiet period.
  // Keep that tail attached; a fresh rise, direction or longer release starts
  // another burst. Equal full wheel notches remain independent after quiet.
  const tail = (delta, now) => consumed && now - last <= tailQuiet &&
    Math.sign(delta) === direction &&
    (Math.abs(delta) < Math.abs(previousDelta) || Math.abs(delta) <= Math.abs(previousDelta) && Math.abs(delta) < peak * .2);
  return {
    push(delta, now, blocked = false) {
      if (now - last > quiet && !tail(delta, now)) {total = 0; consumed = false; peak = 0; direction = 0}
      last = now; if (!direction) direction = Math.sign(delta); previousDelta = delta; peak = Math.max(peak, Math.abs(delta));
      if (blocked) consumed = true;
      if (consumed) return 0;
      if (total && Math.sign(total) !== Math.sign(delta)) total = 0;
      total += delta; direction = Math.sign(total);
      if (Math.abs(total) < threshold) return 0;
      consumed = true;
      return Math.sign(total);
    },
    consume() {consumed = true},
    isPending(now, delta) {return delta === undefined ? now - last <= tailQuiet : now - last <= quiet || tail(delta, now)},
  };
}

export function createMobileTourInput(frame, navigation) {
  const wheel = createWheelBurst();
  let enabled = false, touch = null, drain = false, geometry, available = false;
  const ignored = target => target.closest('a,button,summary,input,textarea,select,[contenteditable],.city-carousel,[data-lenis-prevent]');
  const readingTarget = target => navigation.getState().reading && frame.contains(target);
  const eligible = () => available && navigation.getState().active;
  const block = event => {if (event.cancelable) event.preventDefault(); event.stopImmediatePropagation()};
  const crossing = (from, delta) => available && geometry && (
    delta > 0 && from < geometry.revealed && from + delta >= geometry.revealed ||
    delta < 0 && from >= geometry.end && from + delta < geometry.end);
  function onWheel(event) {
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const now = performance.now(), active = eligible();
    const reading = readingTarget(event.target), excluded = event.target.closest('input,textarea,select,[contenteditable],[data-lenis-prevent]');
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (!wheel.isPending(now, delta)) drain = false;
    if (!active && !excluded && !drain && crossing(window.scrollY, delta)) {
      wheel.push(delta, now, true);
      block(event); navigation.enter(geometry, delta < 0); return;
    }
    const direction = wheel.push(delta, now, !active || reading || Boolean(excluded) || navigation.getState().moving);
    if (active && reading) {event.stopImmediatePropagation(); if (!excluded) block(event); return}
    if (active && !excluded || drain && wheel.isPending(now)) {
      block(event);
      if (direction && navigation.step(direction, {now})) drain = !navigation.getState().active;
    }
  }
  function onStart(event) {
    touch = null;
    if (event.touches.length !== 1 || !available || event.target.closest('input,textarea,select,[contenteditable],[data-lenis-prevent]')) return;
    const p = event.touches[0];
    // Reserve the edges for browser/system gestures.
    if (p.clientX < 24 || p.clientX > innerWidth - 24) return;
    touch = {x: p.clientX, y: p.clientY, startScroll: window.scrollY, entered: eligible(), consumed: navigation.getState().moving || navigation.getState().reading, axis: null};
  }
  function onMove(event) {
    if (!touch || event.touches.length !== 1) {touch = null; return}
    const p = event.touches[0], dx = touch.x - p.clientX, dy = touch.y - p.clientY;
    if (!touch.axis && Math.hypot(dx, dy) > 10) touch.axis = Math.abs(dy) > Math.abs(dx) * 1.4 ? 'y' : 'x';
    if (touch.axis !== 'y') return;
    if (!touch.entered) {
      if (!crossing(touch.startScroll, dy)) return;
      navigation.enter(geometry, dy < 0); touch.entered = true; touch.consumed = true;
    }
    block(event);
    if (!touch.consumed && Math.abs(dy) >= 60) {
      touch.consumed = true;
      navigation.step(Math.sign(dy), {now: performance.now()});
    }
  }
  function onEnd() {touch = null}
  function onKey(event) {
    if (!available || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable],dialog[open]')) return;
    // Native Home/End can scroll a focused fixed article instead of the page.
    // Synchronize the document through Lenis so these remain reliable exits.
    if (['Home', 'End'].includes(event.key)) {
      block(event); navigation.jump(event.key === 'Home' ? 0 : Math.max(0, document.documentElement.scrollHeight - innerHeight)); return;
    }
    if (!eligible() || ignored(event.target) || navigation.getState().reading) return;
    const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
    if (!direction) return; // Tab keeps native focus navigation.
    block(event);
    if (!event.repeat) navigation.step(event.shiftKey && event.key === ' ' ? -1 : direction);
  }
  const events = [['wheel', onWheel], ['touchstart', onStart], ['touchmove', onMove], ['touchend', onEnd], ['touchcancel', onEnd], ['keydown', onKey]];
  for (const [type, handler] of events) window.addEventListener(type, handler, {capture: true, passive: false});
  return {
    update(value, bounds, ready = value) {
      geometry = bounds; available = ready;
      if (value && !enabled) {wheel.consume(); if (touch) touch.consumed = true}
      enabled = value;
      if (!value && !wheel.isPending(performance.now())) drain = false;
    },
    dispose() {for (const [type, handler] of events) window.removeEventListener(type, handler, true)},
  };
}
