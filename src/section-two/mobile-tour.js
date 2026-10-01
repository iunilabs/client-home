import {clamp, mix, smooth} from '../timeline.js';
import {mobileTourHub} from './mobile-tour-config.js';

// Zero velocity and acceleration at both ends: depart gently, accelerate,
// then brake into the building. Its card starts entering during the journey.
export function tourEase(value) {
  const t = clamp(value);
  return t * t * t * (t * (6 * t - 15) + 10);
}

export function mobileTourGeometry({top, viewport}) {
  const handoff = top - viewport + 90;
  const revealed = handoff + viewport * 1.35;
  // Scroll positions only delimit the chapter; visits use the explicit cursor.
  const span = viewport * .65;
  return {handoff, start: handoff + viewport * .55, fadeEnd: revealed, revealed,
    end: revealed + span, height: revealed + span + viewport - top, viewport};
}

export function mobileTourState({scroll, geometry}) {
  const {viewport, start, fadeEnd, revealed, end} = geometry;
  const exit = clamp((scroll - end) / viewport);
  const opacity = exit < 1 ? smooth(start, fadeEnd, scroll) : 0;
  return {stopIndex: -1, previous: mobileTourHub, current: mobileTourHub,
    entrance: tourEase((scroll - start) / (fadeEnd - start)),
    travel: 1, cardProgress: 0,
    progress: clamp((scroll - revealed) / (end - revealed)), opacity,
    copyOpacity: 1, namesOpacity: 0, exitY: exit * viewport,
    active: opacity > .01 && exit < 1, revealed: opacity >= .999, mode: 'tour'};
}

export function mobileBuildingView(stop, {width, height, viewportWidth, viewportHeight}, hub = false) {
  const fit = (stop, hub = false) => Math.max(1.5, Math.min(
    viewportWidth * (hub ? .98 : .9) / (width * stop.size[0] / 100),
    viewportHeight * (hub ? .68 : viewportHeight < 650 ? .28 : .34) / (height * stop.size[1] / 100)));
  return {zoom: fit(stop, hub), focusX: stop.center[0] / 100, focusY: stop.center[1] / 100,
    targetY: viewportHeight * (hub ? .48 : viewportHeight < 650 ? .23 : .26)};
}

export function mobileCameraAt(view, {width, height, viewportWidth, viewportHeight}) {
  const {zoom, focusX, focusY, targetY} = view;
  // Clamp the actual photo edges, including a little overlap for sensor tilt.
  const reserve = Math.min(viewportWidth, viewportHeight) * .025;
  const left = clamp(viewportWidth / 2 - focusX * width * zoom, viewportWidth - width * zoom + reserve, -reserve);
  const top = clamp(targetY - focusY * height * zoom, viewportHeight - height * zoom + reserve, -reserve);
  return {...view,
    x: left - viewportWidth / 2 + width * .5 + focusX * width * (zoom - 1),
    y: top - viewportHeight / 2 + height * .5 + focusY * height * (zoom - 1), left, top};
}

export function mobileTourCamera(state, layout) {
  const {viewportHeight} = layout;
  const hubZoom = mobileBuildingView(mobileTourHub, layout, true).zoom;
  const t = state.entrance;
  return mobileCameraAt({
    focusX: mix(.56, mobileTourHub.center[0] / 100, t),
    focusY: mix(.43, mobileTourHub.center[1] / 100, t),
    zoom: mix(1.5, hubZoom, t), targetY: viewportHeight * .48,
  }, layout);
}
