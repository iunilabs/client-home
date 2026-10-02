import {mix} from '../timeline.js';
import {mobileTourRoute, mobileTourBuildings, mobileTourHub, mobileTourTiming} from './mobile-tour-config.js';
import {tourEase, mobileTourCamera, mobileBuildingView, mobileCameraAt} from './mobile-tour.js';

export function promoteMobileCard(order, id) {
  return [...order.filter(item => item !== id), id];
}

function blendCamera(from, to, t, layout) {
  return mobileCameraAt({focusX: mix(from.focusX, to.focusX, t), focusY: mix(from.focusY, to.focusY, t),
    zoom: mix(from.zoom, to.zoom, t) * (1 - .10 * Math.sin(Math.PI * t) ** 2),
    targetY: mix(from.targetY, to.targetY, t)}, layout);
}

export function createMobileTourNavigation({route = mobileTourRoute, onNavigate = () => {}} = {}) {
  let manualId = null;
  let active = false, cursor = -1, current = mobileTourHub, transition = null;
  let camera = null, visited = [], geometry, suspended = false, released = 0, lastScroll = null, reduced = false;
  const stopFor = id => id === 'puntoes' ? mobileTourHub : {id, ...mobileTourBuildings[id]};
  const itinerary = () => manualId ? [stopFor(manualId), stopFor('collaborate')] : route;
  const snapshot = () => ({active, currentId: current.id, guidedCursor: cursor, manualId,
    nextId: itinerary()[cursor + 1]?.id ?? null, previousId: cursor < 0 ? null : cursor === 0 ? 'puntoes' : itinerary()[cursor - 1].id,
    moving: Boolean(transition), visitedIds: [...visited], released});

  function enter(bounds, backwards = false) {
    geometry = bounds;
    // Reverse entry from the native exit preserves the selected client. A new
    // forward entrance from section 1 starts the default itinerary again.
    if (!backwards) manualId = null;
    const stops = itinerary();
    cursor = backwards ? stops.length - 1 : -1;
    current = cursor < 0 ? mobileTourHub : stops[cursor];
    active = true; released = 0; suspended = false; transition = null;
    if (cursor >= 0) visited = promoteMobileCard(visited, current.id);
    onNavigate(bounds.revealed);
  }
  function travel(id, now) {
    const previous = current.id;
    current = stopFor(id);
    const repeated = visited.includes(id);
    if (id !== 'puntoes') visited = promoteMobileCard(visited, id);
    transition = {from: camera, started: now, previous, mode: repeated ? 'fade' : 'slide', duration: reduced ? 100 : mobileTourTiming.logoTravel};
  }
  function canRelease(direction) {
    return active && !transition && (direction > 0 ? cursor === itinerary().length - 1 : cursor < 0);
  }
  return {
    getState: snapshot, enter, canRelease,
    release(direction) {
      if (!canRelease(direction)) return false;
      // Do not write scroll here: this fresh gesture belongs to the browser.
      active = false; released = Math.sign(direction); return true;
    },
    anchorScroll(scroll, bounds = geometry) {
      if (!active || !bounds) return scroll;
      if (Math.abs(scroll - bounds.revealed) > .5) onNavigate(bounds.revealed);
      return bounds.revealed;
    },
    jump(top) {active = false; transition = null; released = 0; suspended = true; onNavigate(top)},
    select(id, {now = performance.now()} = {}) {
      if (!active || !mobileTourBuildings[id] || !camera) return false;
      if (id !== 'collaborate') {
        // Even tapping the already focused logo cancels the remaining default
        // companies. Another logo replaces that choice, keeping only the work.
        manualId = id;
        cursor = 0;
      } else cursor = itinerary().length - 1;
      if (current.id === id) return true;
      travel(id, now); return true;
    },
    step(direction, {now = performance.now()} = {}) {
      if (!active || transition) return false;
      if (canRelease(direction)) return this.release(direction);
      cursor += direction > 0 ? 1 : -1;
      travel(cursor < 0 ? 'puntoes' : itinerary()[cursor].id, now); return true;
    },
    update(state, {scroll, now, layout, geometry: bounds, reduced: preference = false}) {
      geometry = bounds; reduced = preference;
      if (suspended && (scroll < bounds.start || scroll >= bounds.revealed + bounds.viewport)) suspended = false;
      // Arrival from outside can already have compositor inertia. Capture it
      // before that same gesture gets permission to visit a building.
      if (!active && !suspended && !released && (scroll >= bounds.revealed - .75 && scroll < bounds.revealed + bounds.viewport || lastScroll !== null && lastScroll < bounds.revealed && scroll >= bounds.revealed)) {
        enter(bounds, lastScroll !== null && lastScroll > bounds.revealed);
      } else if (!active && released && lastScroll !== null &&
        (released > 0 ? lastScroll > bounds.revealed && scroll <= bounds.revealed : lastScroll < bounds.revealed && scroll >= bounds.revealed)) {
        enter(bounds, released > 0);
      }
      lastScroll = scroll;
      let progress = 1, outgoingId = null, mode = transition?.mode ?? 'slide';
      const ownedView = active || released;
      if (!ownedView) camera = mobileTourCamera({...state, entrance: reduced ? 1 : state.entrance}, layout);
      else {
        const view = mobileBuildingView(current, layout, current.id === 'puntoes');
        if (transition && transition.from) {
          const elapsed = Math.max(0, now - transition.started);
          const t = tourEase(elapsed / transition.duration);
          camera = blendCamera(transition.from, view, t, layout);
          progress = reduced ? tourEase(elapsed / 100) : tourEase((elapsed - mobileTourTiming.logoCardFrom) /
            (mobileTourTiming.logoCardUntil - mobileTourTiming.logoCardFrom));
          outgoingId = transition.previous;
          if (elapsed >= transition.duration) transition = null;
        } else {camera = mobileCameraAt(view, layout); transition = null}
      }
      const retreat = current.id === 'puntoes' ? 1 - progress : 1;
      return {...snapshot(), camera, current, outgoingId, order: [...visited], retreat,
        entry: current.id === 'puntoes' ? null : {id: current.id, progress, mode},
        copyOpacity: ownedView ? current.id === 'puntoes' ? progress : 0 : state.copyOpacity};
    },
    reset({suspend = false} = {}) {manualId = null; suspended = suspend; active = false; released = 0; cursor = -1;
      current = mobileTourHub; transition = null; camera = null; visited = []; lastScroll = null},
  };
}
