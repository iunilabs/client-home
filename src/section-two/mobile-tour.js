import {clamp, mix, smooth} from '../timeline.js';
import {mobileTourRoute, mobileTourHub, mobileTourTiming} from './mobile-tour-config.js';

// Zero velocity and acceleration at both ends: depart gently, accelerate,
// then brake into the building. Its card starts entering during the journey.
export function tourEase(value) {
  const t = clamp(value);
  return t * t * t * (t * (6 * t - 15) + 10);
}

export function mobileTourGeometry({top, viewport, route = mobileTourRoute}) {
  const handoff = top - viewport + 90;
  const revealed = handoff + viewport * 1.35;
  const span = (mobileTourTiming.intro + route.length * mobileTourTiming.stop + mobileTourTiming.outro) * viewport;
  return {start: handoff + viewport * .55, fadeEnd: revealed, revealed,
    end: revealed + span, height: revealed + span + viewport - top, viewport};
}

export function mobileTourState({scroll, geometry, route = mobileTourRoute}) {
  const {viewport, start, fadeEnd, revealed, end} = geometry;
  const distance = Math.max(0, (scroll - revealed) / viewport);
  const travelDistance = Math.max(0, distance - mobileTourTiming.intro);
  const rawIndex = Math.floor(travelDistance / mobileTourTiming.stop);
  const stopIndex = distance < mobileTourTiming.intro || !route.length ? -1 : Math.min(route.length - 1, rawIndex);
  const phase = stopIndex < 0 ? 0 : clamp(travelDistance / mobileTourTiming.stop - stopIndex);
  const exit = clamp((scroll - end) / viewport);
  const opacity = exit < 1 ? smooth(start, fadeEnd, scroll) : 0;
  return {stopIndex, phase, introDistance: distance, previous: stopIndex <= 0 ? mobileTourHub : route[stopIndex - 1],
    current: stopIndex < 0 ? mobileTourHub : route[stopIndex],
    entrance: tourEase((scroll - start) / (fadeEnd - start)),
    travel: tourEase(phase / mobileTourTiming.travelUntil),
    cardProgress: tourEase((phase - mobileTourTiming.cardFrom) / (mobileTourTiming.cardUntil - mobileTourTiming.cardFrom)),
    progress: clamp((scroll - revealed) / (end - revealed)), opacity,
    copyOpacity: 1 - smooth(.2, mobileTourTiming.intro, distance),
    namesOpacity: 0, exitY: exit * viewport, active: opacity > .01 && exit < 1,
    revealed: opacity >= .999, mode: 'tour'};
}

export function mobileBuildingView(stop, {width, height, viewportWidth, viewportHeight}, hub = false) {
  const fit = (stop, hub = false) => Math.max(1.5, Math.min(
    viewportWidth * (hub ? .98 : .9) / (width * stop.size[0] / 100),
    viewportHeight * (hub ? .68 : .34) / (height * stop.size[1] / 100)));
  return {zoom: fit(stop, hub), focusX: stop.center[0] / 100, focusY: stop.center[1] / 100,
    targetY: viewportHeight * (hub ? .48 : .26)};
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
  const intro = state.stopIndex < 0;
  const from = state.previous, to = state.current;
  const t = intro ? state.entrance : state.travel;
  const focusX = intro ? mix(.56, mobileTourHub.center[0] / 100, t) : mix(from.center[0], to.center[0], t) / 100;
  const focusY = intro ? mix(.43, mobileTourHub.center[1] / 100, t) : mix(from.center[1], to.center[1], t) / 100;
  const zoom = intro ? mix(1.5, hubZoom, t) :
    mix(mobileBuildingView(from, layout, state.stopIndex === 0).zoom, mobileBuildingView(to, layout).zoom, t) * (1 - .16 * Math.sin(Math.PI * t) ** 2);
  const targetY = viewportHeight * (intro ? .48 : mix(state.stopIndex === 0 ? .48 : .26, .26, t));
  return mobileCameraAt({zoom, focusX, focusY, targetY}, layout);
}

export function mobileCardStack(index, state) {
  const age = Math.max(0, state.stopIndex - index);
  const incoming = index === state.stopIndex ? state.cardProgress : index < state.stopIndex ? 1 : 0;
  // Old cards remain underneath. Limit the visible stagger so eleven cards
  // do not climb into the building; none are removed from the logical stack.
  const visualAge = index < state.stopIndex ? age - 1 + state.cardProgress : 0;
  const stagger = Math.min(visualAge, 4);
  return {incoming, buried: visualAge > 4, offsetX: (index % 2 ? -1 : 1) * stagger * 2,
    offsetY: -stagger * 7, scale: 1 - stagger * .012,
    rotation: (index % 2 ? -.38 : .38) + (index % 2 ? -1 : 1) * stagger * .18};
}
