import {clamp, mix, smooth} from '../timeline.js';

// Keep the accepted hand-to-city entrance independent of any later chapters.
export function cityGeometry({top, height, viewport, footer = 90}) {
  const legacyLimit = Math.max(1, top + height + footer - viewport);
  return {
    start: legacyLimit * .77,
    revealed: legacyLimit * .81,
    fadeEnd: legacyLimit * .88,
    end: top + height - viewport,
    viewport,
  };
}

export function cityState(scroll, geometry, reduced = false) {
  const {start, revealed, fadeEnd, end, viewport} = geometry;
  const opacity = reduced ? Number(scroll >= start) : smooth(start, fadeEnd, scroll);
  const progress = clamp((scroll - revealed) / Math.max(1, end - revealed));
  const travel = smooth(0, 1, progress);
  const exit = clamp((scroll - end) / viewport);
  return {
    opacity: exit < 1 ? opacity : 0,
    progress,
    zoom: reduced ? 1 : mix(1.5, 1, travel),
    copyOpacity: reduced ? 1 : 1 - smooth(.18, .57, progress),
    namesOpacity: reduced ? 1 : smooth(.08, .40, progress),
    exitY: exit * viewport,
    active: opacity > .01 && exit < 1,
    revealed: opacity >= .999,
  };
}
