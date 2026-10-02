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

// Use input creation time, not delayed JS delivery, when grouping wheel events.
export function wheelEventTime(event, now = performance.now()) {
  return Number.isFinite(event.timeStamp) && event.timeStamp >= 0 && event.timeStamp <= now + 1000 ? event.timeStamp : now;
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

export function createMobileTourInput(frame, navigation, {lock = {set() {}}, boundary = {set() {}}, readTarget = () => scrollY, onInterrupt = () => {}} = {}) {
  const wheel = createWheelBurst();
  let touch = null, geometry, available = false, lastScroll = null, skipEntry = false, navigating = false;
  const excluded = target => target.closest('input,textarea,select,[contenteditable],dialog[open],[data-lenis-prevent]') ||
    target.closest('a') && !target.closest('.city-tour-card');
  const eligible = () => available && navigation.getState().active;
  const block = event => {if (event.cancelable) event.preventDefault(); event.stopImmediatePropagation()};
  function interruptNavigation() {
    if (!navigating) return;
    navigating = false; skipEntry = false; lastScroll = window.scrollY; onInterrupt();
  }
  const crossing = (from, delta) => {
    if (!available || !geometry) return false;
    // A native exit can cross the fractional anchor again after scrollY rounds
    // to an integer. Only motion back against that release can re-enter.
    const released = navigation.getState().released;
    if (released && Math.sign(delta) === released) return false;
    const boundary = geometry.revealed + (delta < 0 ? .5 : -.5);
    return delta > 0 && from < boundary && from + delta >= boundary ||
      delta < 0 && from > boundary && from + delta <= boundary;
  };
  function onWheel(event) {
    if (!available || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || excluded(event.target)) return;
    const now = wheelEventTime(event);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    const pending = wheel.isPending(now, delta);
    if (navigating && pending) {wheel.push(delta, now, true); block(event); return}
    interruptNavigation();
    const active = eligible();
    if (active && !pending && navigation.canRelease(Math.sign(delta))) {
      if (delta > 0) boundary.set(false);
      navigation.release(Math.sign(delta)); lock.set(false); return;
    }
    if (!active && crossing(delta > 0 ? Math.max(window.scrollY, readTarget()) : Math.min(window.scrollY, readTarget()), delta)) {
      wheel.push(delta, now, true); block(event); lock.set(true); navigation.enter(geometry, delta < 0); return;
    }
    const direction = wheel.push(delta, now, !active || navigation.getState().moving);
    if (active) {block(event); if (direction) navigation.step(direction, {now: performance.now()})}
  }
  function onStart(event) {
    touch = null;
    if (event.touches.length !== 1 || !available || excluded(event.target)) return;
    interruptNavigation();
    const p = event.touches[0];
    if (eligible() && navigation.canRelease(1)) boundary.set(false);
    if (eligible() && (navigation.canRelease(1) || navigation.canRelease(-1))) lock.set(false);
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
      if (!eligible()) {lock.set(true); navigation.enter(geometry, result.dy < 0)}
      touch.entered = true; touch.intent.consume(); block(event); return;
    }
    // Check the boundary before preventing any vertical move. Otherwise Chrome
    // cannot return this gesture to native scrolling after preventDefault.
    if ((result.dy > 0 ? touch.forward : touch.backward) && navigation.canRelease(Math.sign(result.dy))) {
      navigation.release(Math.sign(result.dy)); lock.set(false); touch.native = true; return;
    }
    lock.set(true); block(event);
    if (result.direction) navigation.step(result.direction, {now: performance.now()});
  }
  function onEnd() {touch = null; if (eligible()) lock.set(true)}
  function onKey(event) {
    if (!available || event.defaultPrevented || event.target.closest('input,textarea,select,[contenteditable],dialog[open],[data-lenis-prevent]')) return;
    const topKey = event.key === 'Home' || event.metaKey && event.key === 'ArrowUp';
    const endKey = event.key === 'End' || event.metaKey && event.key === 'ArrowDown';
    if (topKey || endKey) {
      // During an explicit trip, update() has held its entry-check position at
      // the chapter start. Drop that history before jumping outside, otherwise
      // the next update can mistake the jump for a fresh forward entrance.
      if (navigating) navigation.reset({suspend: true});
      interruptNavigation();
      if (endKey) boundary.set(false);
      skipEntry = true; lastScroll = null; lock.set(false); block(event);
      navigation.jump(topKey ? 0 : Math.max(0, document.documentElement.scrollHeight - innerHeight));
      if (topKey) boundary.set(true); return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey || excluded(event.target)) return;
    if (event.target.closest('a,button')) return;
    const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
    if (!direction) return;
    if (!event.repeat) interruptNavigation();
    if (!eligible()) return;
    const step = event.shiftKey && event.key === ' ' ? -1 : direction;
    if (!event.repeat && navigation.canRelease(step)) {navigation.release(step); lock.set(false); return}
    block(event); if (!event.repeat) navigation.step(step);
  }
  const events = [['wheel', onWheel], ['touchstart', onStart], ['touchmove', onMove], ['touchend', onEnd], ['touchcancel', onEnd], ['keydown', onKey]];
  for (const [type, handler] of events) window.addEventListener(type, handler, {capture: true, passive: false});
  return {
    update(value, bounds) {
      geometry = bounds;
      if (!value && available) {lock.set(false); touch = null; lastScroll = null; navigating = false}
      if (value && !available) {wheel.consume(); if (touch) touch.intent.consume()}
      available = value;
    },
    reconcile(scroll) {
      if (!available || !geometry) return scroll;
      if (navigating) return scroll;
      if (skipEntry && (scroll < geometry.start || scroll >= geometry.revealed + geometry.viewport)) skipEntry = false;
      if (!skipEntry && !navigation.getState().active && lastScroll !== null && crossing(lastScroll, scroll - lastScroll)) {
        lock.set(true);navigation.enter(geometry, scroll < lastScroll);
        if (touch) {touch.entered = true; touch.intent.consume(); touch.forward = false; touch.backward = false}
        wheel.consume();
      }
      lastScroll = scroll;
      if (navigation.getState().active) {
        skipEntry = false;
        // Boundary gestures need a scrollable root at touchStart. No move has
        // been canceled yet; onMove decides whether to release or lock again.
        if (!touch || touch.entered && !touch.forward && !touch.backward) lock.set(true);
        return navigation.anchorScroll(scroll, geometry);
      }
      lock.set(false);return scroll;
    },
    prepareNavigation() {navigating = true;skipEntry = true;lastScroll = null;touch = null;boundary.set(false);lock.set(false)},
    finishNavigation() {
      if (!navigating) return false;
      navigating = false;skipEntry = false;lastScroll = null;return true;
    },
    // Only the navigation controller's implicit-entry checks use this held
    // position. City rendering keeps the actual scroll state throughout.
    navigationScroll: scroll => navigating ? geometry.start : scroll,
    isNavigating: () => navigating,
    lock() {lock.set(true)},
    dispose() {for (const [type, handler] of events) window.removeEventListener(type, handler, true)},
  };
}
