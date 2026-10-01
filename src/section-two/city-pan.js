// CSS scales around the art's focus, so the margin is asymmetric.
// Keep a pixel of overlap: panning never uncovers the image's edges.
export function cityPanBounds({width, height, zoom, viewportWidth, viewportHeight, reserve = 0, originX = .52, originY = .48}) {
  const x = Math.max(0, (width * zoom - viewportWidth) / 2 - width * zoom * reserve - 1);
  const y = Math.max(0, (height * zoom - viewportHeight) / 2 - height * zoom * reserve - 1);
  const shiftX = (.5 - originX) * width * (zoom - 1);
  const shiftY = (.5 - originY) * height * (zoom - 1);
  return {minX: -x - shiftX, maxX: x - shiftX, minY: -y - shiftY, maxY: y - shiftY};
}

const centre = points => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
});

// Decide once per gesture. A vertical start stays native even if it later
// turns sideways; a horizontal start or two fingers can explore both axes.
export function createCityTouchGesture() {
  let gesture = null;
  function rebase(points, position, mode) {
    gesture = {mode, origin: centre(points), start: {...position}, ids: points.map(point => point.id).sort().join(',')};
  }
  function start(points, position) {
    if (!points.length || gesture?.mode === 'scroll') return false;
    rebase(points, position, points.length > 1 || gesture?.mode === 'map' ? 'map' : 'pending');
    return gesture.mode === 'map';
  }
  function move(points, position) {
    if (!gesture || !points.length) return {mode: 'idle'};
    if (points.map(point => point.id).sort().join(',') !== gesture.ids) start(points, position);
    const point = centre(points), dx = point.x - gesture.origin.x, dy = point.y - gesture.origin.y;
    if (gesture.mode === 'pending' && Math.hypot(dx, dy) >= 4) {
      gesture.mode = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'map' : 'scroll';
    }
    return gesture.mode === 'map' ? {mode: 'map', x: gesture.start.x + dx, y: gesture.start.y + dy} : {mode: gesture.mode};
  }
  function end(points, position) {
    const wasMap = gesture?.mode === 'map';
    if (!points.length) gesture = null;
    else if (gesture?.mode !== 'scroll') rebase(points, position, wasMap ? 'map' : 'pending');
    return wasMap;
  }
  return {start, move, end, reset() {gesture = null}, get mode() {return gesture?.mode ?? 'idle'}};
}

// Logo navigation uses elapsed time, not a per-frame lerp. Start and arrival
// have zero velocity/acceleration, and even a long trip finishes promptly.
export function createCityPanMotion() {
  const position = {x: 0, y: 0};
  let trip = null;
  return {
    position,
    moveTo(x, y) {trip = null; position.x = x; position.y = y},
    reveal(x, y, now) {
      if (trip && Math.hypot(x - trip.to.x, y - trip.to.y) < .5) return;
      const distance = Math.hypot(x - position.x, y - position.y);
      if (distance < .5) {this.moveTo(x, y); return}
      trip = {from: {...position}, to: {x, y}, start: now,
        duration: Math.min(1200, 650 + distance * .6)};
    },
    update(now) {
      if (!trip) return position;
      const t = Math.max(0, Math.min(1, (now - trip.start) / trip.duration));
      const eased = t * t * t * (10 + t * (-15 + 6 * t));
      position.x = trip.from.x + (trip.to.x - trip.from.x) * eased;
      position.y = trip.from.y + (trip.to.y - trip.from.y) * eased;
      if (t === 1) {position.x = trip.to.x; position.y = trip.to.y; trip = null}
      return position;
    },
    constrain(bounds) {
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      for (const point of [position, ...(trip ? [trip.to] : [])]) {
        point.x = clamp(point.x, bounds.minX, bounds.maxX);
        point.y = clamp(point.y, bounds.minY, bounds.maxY);
      }
    },
    stop() {trip = null},
  };
}

export function createCityPan(section) {
  const surface = section.querySelector('.city-drag-surface');
  const frame = section.querySelector('.trust-frame');
  const motion = createCityPanMotion(), position = motion.position;
  const touch = createCityTouchGesture();
  const listeners = new AbortController();
  let drag = null, enabled = false, suppressClickUntil = 0;
  let bounds = {minX: 0, maxX: 0, minY: 0, maxY: 0};
  let dimensions = '', originX = .52, originY = .48;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function moveTo(x, y) {
    motion.moveTo(clamp(x, bounds.minX, bounds.maxX), clamp(y, bounds.minY, bounds.maxY));
  }
  function release() {
    const id = drag?.id;
    drag = null;
    touch.reset();
    frame.classList.remove('is-dragging');
    if (id !== undefined && surface.hasPointerCapture(id)) surface.releasePointerCapture(id);
  }
  const on = (element, type, handler, options = {}) => element.addEventListener(type, handler, {...options, signal: listeners.signal});

  on(surface, 'pointerdown', event => {
    if (!enabled || event.button !== 0 || event.pointerType === 'touch') return;
    motion.stop();
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, start: {...position}};
    surface.setPointerCapture(event.pointerId);
    frame.classList.add('is-dragging');
    event.preventDefault();
  });
  on(surface, 'pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const x = drag.start.x + event.clientX - drag.x, y = drag.start.y + event.clientY - drag.y;
    moveTo(x, y);
    if (position.x !== x || position.y !== y) {
      drag.start = {...position}; drag.x = event.clientX; drag.y = event.clientY;
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(surface, type, event => {
    if (drag?.id === event.pointerId) release();
  });

  // Non-passive Touch Events also support two-finger panning on Safari.
  // Only cancel a claimed map gesture; vertical page scrolling stays native.
  const points = event => Array.from(event.touches)
    .filter(point => point.target.closest?.('.city-drag-surface, .city-pin'))
    .map(point => ({id: point.identifier, x: point.clientX, y: point.clientY}));
  on(frame, 'touchstart', event => {
    if (!enabled || !event.target.closest('.city-drag-surface, .city-pin')) return;
    motion.stop();
    if (touch.mode === 'idle') suppressClickUntil = 0;
    if (touch.start(points(event), position)) {
      event.preventDefault();
      frame.classList.add('is-dragging');
    }
  }, {passive: false});
  on(frame, 'touchmove', event => {
    if (!enabled || touch.mode === 'idle') return;
    const contacts = points(event), result = touch.move(contacts, position);
    if (result.mode !== 'map') return;
    if (!event.cancelable) {release(); return}
    event.preventDefault();
    moveTo(result.x, result.y);
    if (position.x !== result.x || position.y !== result.y) touch.start(contacts, position);
    frame.classList.add('is-dragging');
    suppressClickUntil = performance.now() + 500;
  }, {passive: false});
  on(frame, 'touchend', event => {
    if (touch.end(points(event), position)) suppressClickUntil = performance.now() + 500;
    if (touch.mode === 'idle') frame.classList.remove('is-dragging');
  }, {passive: true});
  on(frame, 'touchcancel', release, {passive: true});
  on(frame, 'click', event => {
    if (event.detail !== 0 && performance.now() < suppressClickUntil && event.target.closest('.city-pin')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, {capture: true});
  const interrupt = () => {motion.stop(); release()};
  on(window, 'blur', interrupt);
  on(window, 'resize', interrupt);
  on(document, 'visibilitychange', () => {if (document.hidden) interrupt()});

  return {
    update(world, zoom, reduced, active = true, reserve = 0) {
      const width = parseFloat(world.style.width), height = parseFloat(world.style.height);
      if (dimensions !== `${width},${height}`) {
        const origin = getComputedStyle(world).transformOrigin.split(' ').map(parseFloat);
        originX = origin[0] / width; originY = origin[1] / height;
        dimensions = `${width},${height}`;
      }
      bounds = cityPanBounds({width, height, zoom, originX, originY,
        viewportWidth: document.documentElement.clientWidth, viewportHeight: innerHeight, reserve});
      enabled = active && !reduced;
      surface.inert = !enabled;
      if (!enabled) release();
      if (reduced) motion.moveTo(0, 0);
      else {
        // A case dialog disables dragging but does not interrupt the trip
        // already requested by its logo. No independent RAF/timer is needed.
        motion.update(performance.now());
        motion.constrain(bounds);
      }
      return position;
    },
    reveal(rect) {
      if (!enabled) return;
      const right = document.documentElement.clientWidth - 28, bottom = innerHeight - 128;
      const dx = rect.left < 28 ? 28 - rect.left : rect.right > right ? right - rect.right : 0;
      const dy = rect.top < 90 ? 90 - rect.top : rect.bottom > bottom ? bottom - rect.bottom : 0;
      motion.reveal(clamp(position.x + dx, bounds.minX, bounds.maxX),
        clamp(position.y + dy, bounds.minY, bounds.maxY), performance.now());
    },
    dispose() {interrupt(); listeners.abort()},
    get isDragging() {return Boolean(drag) || touch.mode === 'map'},
  };
}
