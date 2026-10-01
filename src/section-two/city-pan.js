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

export function createCityPan(section) {
  const surface = section.querySelector('.city-drag-surface');
  const frame = section.querySelector('.trust-frame');
  const position = {x: 0, y: 0};
  const touch = createCityTouchGesture();
  const listeners = new AbortController();
  let drag = null, enabled = false, suppressClickUntil = 0;
  let bounds = {minX: 0, maxX: 0, minY: 0, maxY: 0};
  let dimensions = '', originX = .52, originY = .48;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function moveTo(x, y) {
    position.x = clamp(x, bounds.minX, bounds.maxX);
    position.y = clamp(y, bounds.minY, bounds.maxY);
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
  on(window, 'blur', release);
  on(window, 'resize', release);
  on(document, 'visibilitychange', () => {if (document.hidden) release()});

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
      if (reduced) {position.x = 0; position.y = 0}
      else moveTo(position.x, position.y);
      return position;
    },
    reveal(rect) {
      if (!enabled) return;
      const right = document.documentElement.clientWidth - 28, bottom = innerHeight - 128;
      const dx = rect.left < 28 ? 28 - rect.left : rect.right > right ? right - rect.right : 0;
      const dy = rect.top < 90 ? 90 - rect.top : rect.bottom > bottom ? bottom - rect.bottom : 0;
      moveTo(position.x + dx, position.y + dy);
    },
    dispose() {release(); listeners.abort()},
    get isDragging() {return Boolean(drag) || touch.mode === 'map'},
  };
}
