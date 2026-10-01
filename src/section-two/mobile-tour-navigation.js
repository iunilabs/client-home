import {mix} from '../timeline.js';
import {mobileTourRoute, mobileTourBuildings, mobileTourHub, mobileTourTiming} from './mobile-tour-config.js';
import {tourEase, mobileTourCamera, mobileBuildingView, mobileCameraAt} from './mobile-tour.js';

// The cursor is the last confirmed itinerary stop. External clients are detours:
// they change the view, but preserve both pending directions of that cursor.
export function promoteMobileCard(order, id) {
  return [...order.filter(item => item !== id), id];
}

function blendCamera(from, to, t, layout) {
  return mobileCameraAt({focusX: mix(from.focusX, to.focusX, t), focusY: mix(from.focusY, to.focusY, t),
    zoom: mix(from.zoom, to.zoom, t) * (1 - .10 * Math.sin(Math.PI * t) ** 2),
    targetY: mix(from.targetY, to.targetY, t)}, layout);
}

export function createMobileTourNavigation({route = mobileTourRoute, onNavigate = () => {}} = {}) {
  let suspended = false;
  let active = false, cursor = -1, current = mobileTourHub, transition = null;
  let camera = null, visited = [], reading = false, geometry, lastScroll = null, reduced = false;
  const stopFor = id => id === 'puntoes' ? mobileTourHub : {id, ...mobileTourBuildings[id]};
  const snapshot = () => ({active, currentId: current.id, guidedCursor: cursor,
    nextId: route[cursor + 1]?.id ?? 'section3', previousId: cursor <= 0 ? (cursor < 0 ? 'section1' : 'puntoes') : route[cursor - 1].id,
    moving: Boolean(transition), reading, visitedIds: [...visited]});

  function travel(id, now) {
    const previous = current.id;
    current = stopFor(id);
    reading = false;
    if (id !== 'puntoes') visited = promoteMobileCard(visited, id);
    transition = {from: camera, started: now, previous, duration: reduced ? 100 : mobileTourTiming.logoTravel};
  }

  function enter(bounds, backwards = false) {
    geometry = bounds;
    cursor = backwards ? route.length - 1 : -1;
    current = cursor < 0 ? mobileTourHub : route[cursor];
    active = true; transition = null; reading = false;
    if (cursor >= 0) visited = promoteMobileCard(visited, current.id);
    onNavigate(geometry.revealed);
  }

  return {
    getState: snapshot,
    enter,
    anchorScroll(scroll, bounds = geometry) {
      // Native touch scrolling can already be running when a gesture crosses
      // the chapter entrance. The captured cursor owns this anchor until an
      // explicit exit/reset; reconcile compositor deltas before testing bounds.
      if (!active || !bounds) return scroll;
      if (Math.abs(scroll - bounds.revealed) > .5) onNavigate(bounds.revealed);
      return bounds.revealed;
    },
    jump(top) {active = false; transition = null; reading = false; suspended = true; onNavigate(top)},
    setReading(value) {reading = value},
    select(id, {now = performance.now()} = {}) {
      if (!active || !mobileTourBuildings[id] || !camera) return false;
      if (current.id === id) return true;
      const index = route.findIndex(stop => stop.id === id);
      if (index >= 0) cursor = index;
      travel(id, now);
      return true;
    },
    step(direction, {now = performance.now(), explicit = false} = {}) {
      if (!active || transition || (reading && !explicit)) return false;
      const index = cursor + (direction > 0 ? 1 : -1);
      if (index < -1 || index >= route.length) {
        active = false; reading = false;
        onNavigate(direction > 0 ? geometry.end + geometry.viewport : geometry.handoff);
        return true;
      }
      cursor = index;
      travel(index < 0 ? 'puntoes' : route[index].id, now);
      return true;
    },
    update(state, {scroll, now, layout, geometry: bounds, reduced: preference = false}) {
      geometry = bounds; reduced = preference;
      const inside = state.active && scroll >= geometry.revealed - 1 && scroll < geometry.end;
      if (suspended && !inside) suspended = false;
      if (!active && inside && !suspended) {
        // A new entry from section 3 starts at the last stop; chapter links reset
        // explicitly and enter at Puntoes. Scroll has no authority once entered.
        enter(geometry, lastScroll !== null && lastScroll >= geometry.end);
      } else if (active && (!state.active || scroll < geometry.start || scroll >= geometry.end)) {active = false; transition = null; reading = false}
      lastScroll = scroll;
      let progress = 1, outgoingId = null;
      if (!active) camera = mobileTourCamera({...state, entrance: reduced ? 1 : state.entrance}, layout);
      else {
        const view = mobileBuildingView(current, layout, current.id === 'puntoes');
        if (transition) {
          const elapsed = Math.max(0, now - transition.started);
          const t = reduced ? 1 : tourEase(elapsed / transition.duration);
          camera = blendCamera(transition.from, view, t, layout);
          progress = tourEase(elapsed / (reduced ? 100 : mobileTourTiming.logoCardUntil));
          outgoingId = transition.previous;
          if (elapsed >= (reduced ? 100 : transition.duration)) transition = null;
        } else camera = mobileCameraAt(view, layout);
      }
      return {...snapshot(), camera, current, outgoingId,
        order: [...visited], retreat: 1, entry: current.id === 'puntoes' ? null : {id: current.id, progress, mode: 'fade'},
        copyOpacity: active ? current.id === 'puntoes' ? (outgoingId !== null ? progress : 1) : 0 : state.copyOpacity};
    },
    reset({suspend = false} = {}) {suspended = suspend; active = false; cursor = -1; current = mobileTourHub; transition = null; camera = null;
      visited = []; reading = false; lastScroll = null},
  };
}
