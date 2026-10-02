import {clamp, mix, smooth} from '../timeline.js';
import {mobileTourHub, mobileTourTiming} from './mobile-tour-config.js';

// Zero velocity and acceleration at both ends: depart gently, accelerate,
// then brake into the building. Its card starts entering during the journey.
export function tourEase(value) {
  const t = clamp(value);
  return t * t * t * (t * (6 * t - 15) + 10);
}

// Longer trips need time to read the intervening streets. Pull back during
// the journey, then return to the exact existing building framing on arrival.
export function mobileTravelProfile(from, to, {width, height, viewportWidth, viewportHeight}) {
  const screens = Math.hypot((to.focusX - from.focusX) * width, (to.focusY - from.focusY) * height) *
    Math.sqrt(from.zoom * to.zoom) / Math.hypot(viewportWidth, viewportHeight);
  const pullback = Math.min(mobileTourTiming.maxPullback,
    mobileTourTiming.cruisePullback + screens * mobileTourTiming.pullbackPerScreen);
  return {
    duration: Math.min(mobileTourTiming.maxTravel,
      mobileTourTiming.logoTravel + screens * mobileTourTiming.travelPerScreen),
    cruiseZoom: Math.max(1.5, Math.min(from.zoom, to.zoom) * (1 - pullback)),
  };
}

// The itinerary owns a single document anchor. Only entrance and native exit
// take document space; adding stops does not add empty screens to scroll past.
export function mobileTourGeometry({top, viewport}) {
  const handoff = top - viewport + 90;
  const copyStart = handoff + 850;
  const start = copyStart + 800;
  const revealed = start + viewport * .8;
  return {handoff, copyStart, start, fadeEnd: revealed, revealed,
    end: revealed, height: revealed + viewport - top, viewport};
}

export function mobileTourState({scroll, geometry}) {
  const {viewport, copyStart, start, fadeEnd, revealed} = geometry;
  const exit = clamp((scroll - revealed) / viewport);
  const opacity = exit < 1 ? smooth(start, fadeEnd, scroll) : 0;
  return {stopIndex: -1, phase: 0, previous: mobileTourHub, current: mobileTourHub,
    entrance: tourEase((scroll - start) / (fadeEnd - start)), travel: 1, cardProgress: 0,
    progress: clamp((scroll - start) / (revealed + viewport - start)), opacity,
    copyOpacity: smooth(copyStart, copyStart + 160, scroll) * (1 - smooth(start - 200, start, scroll)),
    namesOpacity: 0, exitY: exit * viewport,
    active: opacity > .01 && exit < 1, revealed: opacity >= .999, mode: 'tour'};
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
