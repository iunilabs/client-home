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

// Cumulative displacement matters: a deliberate slow swipe may arrive in 3px
// samples. A gesture that starts while travelling is consumed until lift.
export function createSwipeIntent(x, y, consumed = false) {
  let axis = null, used = consumed;
  return {
    move(nextX, nextY) {
      const dx = x - nextX, dy = y - nextY;
      if (!axis && Math.hypot(dx, dy) >= 10) axis = Math.abs(dy) > Math.abs(dx) * 1.4 ? 'y' : 'other';
      const direction = axis === 'y' && !used && Math.abs(dy) >= 60 ? Math.sign(dy) : 0;
      if (direction) used = true;
      return {axis, direction, dy};
    },
    consume() {used = true},
  };
}

export function createMobileTourInput(frame, navigation) {
  const wheel = createWheelBurst();
  let touch = null, geometry, available = false;
  const excluded = target => target.closest('a,input,textarea,select,[contenteditable],dialog[open],[data-lenis-prevent]');
  const eligible = () => available && navigation.getState().active;
  const block = event => {if (event.cancelable) event.preventDefault(); event.stopImmediatePropagation()};
  const crossing = (from, delta) => available && geometry && (
    delta > 0 && from < geometry.revealed && from + delta >= geometry.revealed ||
    delta < 0 && from > geometry.revealed && from + delta <= geometry.revealed);
  function onWheel(event) {
    if (!available || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || excluded(event.target)) return;
    const now = performance.now(), active = eligible();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    const pending = wheel.isPending(now, delta);
    if (active && !pending && navigation.canRelease(Math.sign(delta))) {
      navigation.release(Math.sign(delta)); return;
    }
    if (!active && crossing(window.scrollY, delta)) {
      wheel.push(delta, now, true); block(event); navigation.enter(geometry, delta < 0); return;
    }
    const direction = wheel.push(delta, now, !active || navigation.getState().moving);
    if (active) {block(event); if (direction) navigation.step(direction, {now})}
  }
  function onStart(event) {
    touch = null;
    if (event.touches.length !== 1 || !available || excluded(event.target)) return;
    const p = event.touches[0];
    touch = {intent: createSwipeIntent(p.clientX, p.clientY, navigation.getState().moving),
      startScroll: window.scrollY, entered: eligible(), native: false,
      forward: navigation.canRelease(1), backward: navigation.canRelease(-1),
      carousel: Boolean(event.target.closest('.city-carousel'))};
  }
  function onMove(event) {
    if (!touch || event.touches.length !== 1) {touch = null; return}
    if (touch.native) return;
    const p = event.touches[0], result = touch.intent.move(p.clientX, p.clientY);
    // The carousel alone owns horizontal drags. Diagonal gestures never step.
    if (result.axis === 'other') {if (eligible() && !touch.carousel) block(event); return}
    if (result.axis !== 'y') return;
    if (!touch.entered) {
      if (!crossing(touch.startScroll, result.dy) && !eligible()) return;
      if (!eligible()) navigation.enter(geometry, result.dy < 0);
      touch.entered = true; touch.intent.consume(); block(event); return;
    }
    // Check the boundary before preventing any vertical move. Otherwise Chrome
    // cannot return this gesture to native scrolling after preventDefault.
    if ((result.dy > 0 ? touch.forward : touch.backward) && navigation.canRelease(Math.sign(result.dy))) {
      navigation.release(Math.sign(result.dy)); touch.native = true; return;
    }
    block(event);
    if (result.direction) navigation.step(result.direction, {now: performance.now()});
  }
  function onEnd() {touch = null}
  function onKey(event) {
    if (!available || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || excluded(event.target)) return;
    if (['Home', 'End'].includes(event.key)) {
      block(event); navigation.jump(event.key === 'Home' ? 0 : Math.max(0, document.documentElement.scrollHeight - innerHeight)); return;
    }
    if (!eligible() || event.target.closest('a,button')) return;
    const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
    if (!direction) return;
    const step = event.shiftKey && event.key === ' ' ? -1 : direction;
    if (!event.repeat && navigation.canRelease(step)) {navigation.release(step); return}
    block(event); if (!event.repeat) navigation.step(step);
  }
  const events = [['wheel', onWheel], ['touchstart', onStart], ['touchmove', onMove], ['touchend', onEnd], ['touchcancel', onEnd], ['keydown', onKey]];
  for (const [type, handler] of events) window.addEventListener(type, handler, {capture: true, passive: false});
  return {
    update(value, bounds) {
      geometry = bounds;
      if (value && !available) {wheel.consume(); if (touch) touch.intent.consume()}
      available = value;
    },
    dispose() {for (const [type, handler] of events) window.removeEventListener(type, handler, true)},
  };
}
