import {clamp, mix, smooth} from '../timeline.js';

// Desktop entrance uses the same section-relative pixels as the scroll meter.
export function cityGeometry({top, height, viewport, footer = 90}) {
  const legacyLimit = Math.max(1, top + height + footer - viewport);
  const handoff = top - viewport + 90;
  const copyStart = handoff + 850;
  const start = copyStart + 800;
  return {
    start,
    copyStart,
    revealed: legacyLimit * .81,
    fadeEnd: start + legacyLimit * .11,
    end: top + height - viewport,
    viewport,
  };
}

export function cityState(scroll, geometry, reduced = false) {
  const {start, copyStart, revealed, fadeEnd, end, viewport} = geometry;
  const opacity = reduced ? Number(scroll >= start) : smooth(start, fadeEnd, scroll);
  const progress = clamp((scroll - revealed) / Math.max(1, end - revealed));
  // Start pulling back with the fade, with no stationary easing at the onset.
  const travel = clamp((scroll - start) / Math.max(1, end - start));
  const exit = clamp((scroll - end) / viewport);
  return {
    opacity: exit < 1 ? opacity : 0,
    progress,
    zoom: reduced ? 1 : mix(1.5, 1, travel),
    copyOpacity: reduced ? Number(scroll >= copyStart && scroll < start) :
      smooth(copyStart, copyStart + 160, scroll) * (1 - smooth(start - 200, start, scroll)),
    namesOpacity: reduced ? 1 : smooth(.08, .40, progress),
    exitY: exit * viewport,
    active: opacity > .01 && exit < 1,
    revealed: opacity >= .999,
  };
}
