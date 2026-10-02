import {mix} from '../timeline.js';
import {mobileTourRoute, mobileTourBuildings, mobileTourHub, mobileTourTiming} from './mobile-tour-config.js';
import {tourEase, mobileTourCamera, mobileBuildingView, mobileCameraAt, mobileTravelProfile, mobileEntranceDuration} from './mobile-tour.js';

export function promoteMobileCard(order, id) {
  return [...order.filter(item => item !== id), id];
}

function blendCamera(from, to, t, layout, cruiseZoom) {
  const zoom = mix(from.zoom, to.zoom, t);
  return mobileCameraAt({focusX: mix(from.focusX, to.focusX, t), focusY: mix(from.focusY, to.focusY, t),
    zoom: Number.isFinite(cruiseZoom) ? mix(zoom, cruiseZoom, Math.sin(Math.PI * t) ** 2) : zoom,
    targetY: mix(from.targetY, to.targetY, t)}, layout);
}

export function createMobileTourNavigation({route = mobileTourRoute, onNavigate = () => {}} = {}) {
  let manualId = null;
  let active = false, cursor = -1, current = mobileTourHub, transition = null;
  let camera = null, visited = [], geometry, cameraLayout, suspended = false, released = 0, lastScroll = null;
  let introPending = false;
  let reveal = null, lastReady = false;
  let collaborationSeen = false, skipCollaboration = false;
  const stopFor = id => id === 'puntoes' ? mobileTourHub : {id, ...mobileTourBuildings[id]};
  const itinerary = () => (manualId ? [stopFor(manualId), stopFor('collaborate')] : route)
    .filter(stop => !skipCollaboration || stop.id !== 'collaborate');
  const nextCursor = () => {
    const stops = itinerary();
    let next = cursor + 1;
    while (collaborationSeen && stops[next]?.id === 'collaborate') next++;
    return next;
  };
  const snapshot = () => ({active, currentId: current.id, guidedCursor: cursor, manualId,
    routeLength: itinerary().filter(stop => stop.id !== 'collaborate' || !collaborationSeen || current.id === 'collaborate').length,
    nextId: itinerary()[nextCursor()]?.id ?? null, previousId: cursor < 0 ? null : cursor === 0 ? 'puntoes' : itinerary()[cursor - 1].id,
    moving: introPending || Boolean(transition) || Boolean(reveal), visitedIds: [...visited], collaborationSeen, released});

  function enter(bounds, backwards = false) {
    geometry = bounds;
    // Reverse entry from the native exit preserves the selected client. A new
    // forward entrance from section 1 starts the default itinerary again.
    if (!backwards) {manualId = null; visited = []; skipCollaboration = collaborationSeen}
    const stops = itinerary();
    // An exit can now come from the last client after the invitation was seen.
    // Native reverse entry must recover that actual departure, not the old
    // itinerary's construction stop.
    cursor = backwards ? released > 0 ? cursor : stops.length - 1 : -1;
    current = cursor < 0 ? mobileTourHub : stops[cursor];
    active = true; released = 0; suspended = false; transition = null;
    reveal = null;
    introPending = !backwards;
    if (cursor >= 0) visited = promoteMobileCard(visited, current.id);
    onNavigate(bounds.revealed);
  }
  function travel(id, now) {
    introPending = false;
    reveal = null;
    // Sample the interrupted trip at the input time. A fresh gesture can
    // retarget immediately without jumping back to a building or losing it.
    if (transition?.from && cameraLayout) {
      const view = mobileBuildingView(current, cameraLayout, current.id === 'puntoes');
      camera = blendCamera(transition.from, view,
        tourEase(((transition.pausedAt ?? now) - transition.started) / transition.duration), cameraLayout, transition.cruiseZoom);
    }
    const previous = current.id;
    current = stopFor(id);
    const repeated = visited.includes(id);
    if (id !== 'puntoes') visited = promoteMobileCard(visited, id);
    const destination = cameraLayout && mobileBuildingView(current, cameraLayout, current.id === 'puntoes');
    const profile = camera && destination ? mobileTravelProfile(camera, destination, cameraLayout) :
      {duration: mobileTourTiming.logoTravel, cruiseZoom: 1.5};
    transition = {from: camera, started: now, previous, mode: repeated ? 'fade' : 'slide', ...profile};
  }
  function canRelease(direction) {
    return active && (direction > 0 ? nextCursor() >= itinerary().length : cursor < 0);
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
    jump(top) {active = false; introPending = false; reveal = null; transition = null; released = 0; suspended = true; onNavigate(top)},
    select(id, {now = performance.now()} = {}) {
      if (!active || !mobileTourBuildings[id] || !camera) return false;
      if (id !== 'collaborate') {
        // Even tapping the already focused logo cancels the remaining default
        // companies. Another logo keeps only an invitation not yet seen.
        manualId = id;
        skipCollaboration = collaborationSeen;
        cursor = 0;
      } else {skipCollaboration = false; cursor = itinerary().length - 1}
      if (current.id === id) return true;
      travel(id, now); return true;
    },
    step(direction, {now = performance.now()} = {}) {
      if (!active || !direction) return false;
      if (canRelease(direction)) return this.release(direction);
      cursor = direction > 0 ? nextCursor() : cursor - 1;
      travel(cursor < 0 ? 'puntoes' : itinerary()[cursor].id, now); return true;
    },
    update(state, {scroll, now, layout, geometry: bounds, ready = true}) {
      geometry = bounds; cameraLayout = layout;
      // After leaving above the map, its next approach owns a fresh entrance
      // instead of retaining the old, fully zoomed Puntoes camera.
      if (!active && released < 0 && scroll < bounds.start) {released = 0; introPending = false; transition = null}
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
      if (!ownedView) {
        const view = mobileTourCamera(state, layout);
        if (!state.active) reveal = null;
        if (!ready) {
          if (reveal) reveal.pausedAt ??= reveal.lastFrame;
          else camera = mobileTourCamera({...state, entrance: 0}, layout);
        } else {
          // A slow image may become visible before reaching the anchor. Show
          // its unconsumed approach without taking ownership of page scroll.
          if (!lastReady && state.active && !reveal) {
            camera ??= mobileTourCamera({...state, entrance: 0}, layout);
            const duration = mobileEntranceDuration(camera, view);
            if (duration > 1) reveal = {from: camera, started: now, lastFrame: now, duration};
          }
          if (reveal) {
            if (reveal.pausedAt !== undefined) {reveal.started += now - reveal.pausedAt;delete reveal.pausedAt}
            const elapsed = Math.max(0, now - reveal.started);
            camera = blendCamera(reveal.from, view, tourEase(elapsed / reveal.duration), layout);
            reveal.lastFrame = now;
            if (elapsed >= reveal.duration) {camera = view;reveal = null}
          } else camera = view;
        }
      }
      else {
        const view = mobileBuildingView(current, layout, current.id === 'puntoes');
        if (introPending) {
          camera ??= mobileTourCamera({stopIndex: -1, entrance: 0, previous: mobileTourHub, current: mobileTourHub}, layout);
          progress = 0;
          // Cold/hash entry can reach the anchor before the portrait decodes.
          // Start the remaining zoom on its first visible frame, not in hiding.
          if (ready) {
            const duration = mobileEntranceDuration(camera, view);
            if (duration > 1) transition = {from: camera, started: now, previous: 'puntoes', mode: 'intro', duration};
            introPending = false;
          }
        }
        if (transition && transition.from) {
          if (transition.mode === 'intro' && !ready) transition.pausedAt ??= now;
          else if (transition.pausedAt !== undefined) {transition.started += now - transition.pausedAt;delete transition.pausedAt}
          const elapsed = Math.max(0, (transition.pausedAt ?? now) - transition.started);
          const t = tourEase(elapsed / transition.duration);
          camera = blendCamera(transition.from, view, t, layout, transition.cruiseZoom);
          progress = transition.mode === 'intro' ? t : tourEase((elapsed - mobileTourTiming.logoCardFrom) /
            (mobileTourTiming.logoCardUntil - mobileTourTiming.logoCardFrom));
          outgoingId = transition.previous;
          if (elapsed >= transition.duration) {camera = mobileCameraAt(view, layout); transition = null}
        } else if (!introPending) {camera = mobileCameraAt(view, layout); transition = null}
      }
      const retreat = current.id === 'puntoes' ? 1 - progress : 1;
      // Count the invitation only after both the building and its CTA arrive.
      // Passing through or leaving mid-flight does not count as seeing it.
      if (active && current.id === 'collaborate' && !transition && progress >= 1) collaborationSeen = true;
      lastReady = ready;
      return {...snapshot(), camera, current, outgoingId, order: [...visited], retreat,
        entry: current.id === 'puntoes' ? null : {id: current.id, progress, mode},
        copyOpacity: ownedView ? current.id === 'puntoes' ? progress : 0 : state.copyOpacity};
    },
    reset({suspend = false} = {}) {manualId = null; skipCollaboration = collaborationSeen; suspended = suspend; active = false; released = 0; cursor = -1;
      current = mobileTourHub; introPending = false; reveal = null; lastReady = false; transition = null; camera = null; visited = []; lastScroll = null},
  };
}
