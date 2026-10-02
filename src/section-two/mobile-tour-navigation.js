import {clamp, mix} from '../timeline.js';
import {mobileTourRoute, mobileTourBuildings, mobileTourTiming} from './mobile-tour-config.js';
import {tourEase, mobileTourCamera, mobileBuildingView, mobileCameraAt} from './mobile-tour.js';

// One card per company. A repeated visit moves that same card to the top.
export function promoteMobileCard(order, id) {
  return [...order.filter(item => item !== id), id];
}

function blendCamera(from, to, t, layout) {
  return mobileCameraAt({focusX: mix(from.focusX, to.focusX, t), focusY: mix(from.focusY, to.focusY, t),
    zoom: mix(from.zoom, to.zoom, t) * (1 - .10 * Math.sin(Math.PI * t) ** 2),
    targetY: mix(from.targetY, to.targetY, t)}, layout);
}

export function createMobileTourNavigation({route = mobileTourRoute, onNavigate = () => {}} = {}) {
  let order = [], entry = null, manual = null, bridge = null, lastCamera = null;
  let lastGuide = null, visitedManually = false;
  let lastTime = null, lastScroll = null, lastScrollAt = 0, rejoiningBackwards = false, deckRetreat = 1;
  const stopFor = id => ({id, ...mobileTourBuildings[id]});

  function visit(id, mode, progress) {
    if (entry?.id !== id) {
      const repeated = order.includes(id);
      order = promoteMobileCard(order, id);
      entry = {id, mode: repeated ? 'fade' : mode, progress};
    } else entry.progress = progress;
  }

  return {
    select(id, {now, scroll, geometry}) {
      if (!mobileTourBuildings[id] || !lastCamera) return false;
      const index = route.findIndex(stop => stop.id === id);
      // Re-anchor the guided scroll without moving the fixed scene. The camera
      // travels separately from its current position; the next swipe follows
      // the selected stop. Companies outside the itinerary keep the page position.
      const anchor = index >= 0 ? geometry.revealed + geometry.viewport *
        (mobileTourTiming.intro + (index + .72) * mobileTourTiming.stop) : scroll;
      manual = {id, from: lastCamera, started: now, anchor, index, deckFrom: deckRetreat};
      bridge = null;
      rejoiningBackwards = false;
      visitedManually = true;
      const repeated = order.includes(id);
      order = promoteMobileCard(order, id);
      entry = {id, mode: repeated ? 'fade' : 'slide', progress: 0};
      onNavigate(anchor);
      return true;
    },
    update(state, {scroll, now, layout}) {
      const dt = lastTime === null ? 0 : Math.min(.05, Math.max(0, (now - lastTime) / 1000));
      const delta = lastScroll === null ? 0 : scroll - lastScroll;
      lastTime = now; lastScroll = scroll;
      if (Math.abs(delta) > .5) {
        lastScrollAt = now;
        if (delta > 0) rejoiningBackwards = false;
        else if (visitedManually && !manual) rejoiningBackwards = true;
      }
      const guided = mobileTourCamera(state, layout);
      const guide = `${state.stopIndex}:${state.current.id}`;
      let camera = guided, moving = state.stopIndex >= 0 && state.travel < 1;
      if (manual) {
        const elapsed = Math.max(0, now - manual.started);
        const t = tourEase(elapsed / mobileTourTiming.logoTravel);
        const target = mobileBuildingView(stopFor(manual.id), layout);
        camera = blendCamera(manual.from, target, t, layout);
        entry.progress = tourEase((elapsed - mobileTourTiming.logoCardFrom) /
          (mobileTourTiming.logoCardUntil - mobileTourTiming.logoCardFrom));
        deckRetreat = mix(manual.deckFrom, 1, tourEase(elapsed / mobileTourTiming.logoCardUntil));
        moving = t < 1;
        // A fresh vertical scroll takes control again. Blend from the visible
        // camera, so leaving a manually selected building cannot snap the map.
        if (Math.abs(scroll - manual.anchor) > 24) {
          bridge = {from: camera, started: now, scroll, guide, backwards: scroll < manual.anchor};
          rejoiningBackwards = bridge.backwards;
          manual = null;
          lastGuide = null;
        } else if (t === 1 && manual.index >= 0) {
          manual = null; lastGuide = guide;
        }
      }
      if (!manual) {
        const bridgeProgress = bridge ? tourEase(Math.max((now - bridge.started) / 850,
          Math.abs(scroll - bridge.scroll) / (layout.viewportHeight * .45))) : 1;
        if (state.stopIndex >= 0) {
          if (!visitedManually) {
            // Normal reverse scroll still removes unvisited future cards.
            order = route.slice(0, state.stopIndex).map(stop => stop.id);
            if (state.cardProgress > 0) order.push(state.current.id);
            entry = {id: state.current.id, mode: 'slide', progress: state.cardProgress};
          } else if (guide !== lastGuide && state.cardProgress > 0 &&
            (!rejoiningBackwards || (now - lastScrollAt > 200 && state.travel === 1 && state.cardProgress > .9))) {
            visit(state.current.id, 'slide', state.cardProgress);
          } else if (entry?.id === state.current.id && !bridge) entry.progress = state.cardProgress;
        }
        if (bridge) {
          const t = bridgeProgress;
          camera = blendCamera(bridge.from, guided, t, layout);
          moving = t < 1 || moving;
          if (entry?.id === state.current.id) entry.progress = clamp(t);
          if (t === 1) bridge = null;
        }
      }
      // Withdraw the pile through the introductory pause; never clear an
      // opaque set of cards merely because the route index crossed zero.
      const targetRetreat = visitedManually && state.stopIndex < 0 && !manual && rejoiningBackwards ?
        tourEase((state.introDistance - .2) / (mobileTourTiming.intro - .2)) : 1;
      if (!manual) deckRetreat = mix(deckRetreat, targetRetreat, 1 - Math.exp(-dt / .18));
      if (targetRetreat === 0 && deckRetreat < .003) deckRetreat = 0;
      const retreat = deckRetreat;
      if (state.stopIndex < 0 && !manual && !bridge && (!visitedManually || retreat === 0)) {
        order = []; entry = null; visitedManually = false; rejoiningBackwards = false; deckRetreat = 1;
      }
      if (!manual && state.cardProgress > 0 && entry?.id === state.current.id) lastGuide = guide;
      lastCamera = camera;
      return {camera, moving, order: [...order], entry: entry ? {...entry} : null, retreat,
        current: manual ? stopFor(manual.id) : state.stopIndex < 0 || bridge ? state.current : entry?.id && visitedManually ? stopFor(entry.id) : state.current};
    },
    reset() {order = []; entry = null; manual = null; bridge = null; lastCamera = null; lastGuide = null;
      visitedManually = false; lastTime = null; lastScroll = null; lastScrollAt = 0; rejoiningBackwards = false; deckRetreat = 1;},
  };
}
