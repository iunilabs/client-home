import {cityPanBounds} from './city-pan.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function cityFocusTarget({point, width, height, viewportWidth, viewportHeight,
  originX, originY, zoom, cardRight, exitY = 0}) {
  const screenX = (cardRight + 24 + viewportWidth - 32) / 2;
  // The frame scrolls upward during the handoff. Centre in its remaining
  // visible area, expressed in the frame's local coordinates.
  const screenY = exitY + Math.max(0, viewportHeight - exitY) * .44;
  const bounds = cityPanBounds({width, height, zoom, viewportWidth, viewportHeight, originX, originY});
  return {
    x: clamp(screenX - viewportWidth / 2 + (.5 - point.x) * width * zoom +
      (originX - .5) * width * (zoom - 1), bounds.minX, bounds.maxX),
    y: clamp(screenY - viewportHeight / 2 + (.5 - point.y) * height * zoom +
      (originY - .5) * height * (zoom - 1), bounds.minY, bounds.maxY),
    zoom,
  };
}

export function createCityFocusMotion() {
  let camera = null, trip = null;
  return {
    travel(from, to, now, reduced = false) {
      camera = {...from};
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      if (reduced || distance < .5 && Math.abs(to.zoom - from.zoom) < .001) {camera = {...to}; trip = null; return;}
      trip = {from: {...from}, to: {...to}, start: now,
        duration: Math.min(1800, 950 + distance * .3 + Math.abs(to.zoom - from.zoom) * 180)};
    },
    update(now) {
      if (!trip) return camera;
      const t = clamp((now - trip.start) / trip.duration, 0, 1);
      const eased = t * t * t * (10 + t * (-15 + 6 * t));
      for (const axis of ['x', 'y', 'zoom']) camera[axis] = trip.from[axis] + (trip.to[axis] - trip.from[axis]) * eased;
      if (t === 1) {camera = {...trip.to}; trip = null;}
      return camera;
    },
    reset() {camera = null; trip = null;},
    get moving() {return Boolean(trip);},
  };
}
