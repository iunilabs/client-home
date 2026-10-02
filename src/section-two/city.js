import desktopUrl from './assets/puntoes-city-v16-architecture.webp';
import portraitUrl from './assets/puntoes-city-mobile-v16-architecture.webp';
import extendedDesktopUrl from './assets/puntoes-city-v16-expanded-architecture.webp';
import {cityClients} from './city-clients.js';
import {cityGeometry, cityState} from './city-state.js';
import {createClientDialog} from './client-dialog.js';
import {createCityWater} from './city-water.js';
import {createCityCarousel} from './city-carousel.js';
import {createCityPan} from './city-pan.js';
import {createCityPerspective} from './city-perspective.js';
import {cityExtent} from './city-extent.js';
import {mobileTourRoute, mobileTourBuildings} from './mobile-tour-config.js';
import {mobileTourGeometry, mobileTourState} from './mobile-tour.js';
import {createMobileTourDeck} from './mobile-tour-deck.js';
import {createMobileTourNavigation} from './mobile-tour-navigation.js';
import {createMobileTourInput} from './mobile-tour-input.js';
import {createDocumentScrollLock, createDesktopEndGuard, createMobileScrollBoundary, cityEntryPoint, cityMapPoint} from './scroll-guard.js';
import {createCityDetail} from './city-detail.js';

// Architecture is interpreted from photos; the city layout is imaginary.
// Roof points are calibrated separately for the two artwork compositions.
const sites = {
  collaborate: {pinDesktop: [16.2, 16.2]},
  accenture: {pinDesktop: [29.5, 31.2]},
  bbva: {pinDesktop: [49.4, 12.9]},
  canal: {pinDesktop: [39.4, 16]},
  cepsa: {pinDesktop: [64, 12.8]},
  mapfre: {pinDesktop: [75.7, 27.1]},
  mediaset: {pinDesktop: [20.5, 54.3]},
  ree: {pinDesktop: [74, 43.2]},
  siemens: {pinDesktop: [69, 60.5]},
  naturgy: {pinDesktop: [51.4, 59.8]},
  sabadell: {pinDesktop: [30.4, 74]},
};

export function createCity(section, options = {}) {
  const cityMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const frame = section.querySelector('.trust-frame');
  const world = section.querySelector('.city-world');
  const image = section.querySelector('#city-image');
  const source = section.querySelector('.city-core-picture source');
  const extension = section.querySelector('#city-extension-image');
  const extensionSource = section.querySelector('.city-extension-picture source');
  const corePicture = section.querySelector('.city-core-picture');
  const core = section.querySelector('.city-core');
  const copy = section.querySelector('.city-copy');
  const backdrop = section.querySelector('.city-backdrop');
  const list = section.querySelector('.city-buildings');
  const markers = [];
  const dialog = createClientDialog({
    onOpen() {carousel.setModal(true); options.onOpen?.()},
    onClose() {carousel.setModal(false); options.onClose?.()},
  });
  const pan = createCityPan(section);
  const perspective = createCityPerspective();
  let loading = false, ready = false, geometry, lastWidth = 0, lastHeight = 0, water = null, waterSources = '', tourViewport = innerHeight, mobileEntryPending = false;

  const documentLock = createDocumentScrollLock(document.documentElement);
  let boundaryInitialized = false;
  const boundary = createMobileScrollBoundary(document.querySelector('main'), document.querySelector('#posibilidades'), document.querySelector('footer'), document.documentElement,
    () => {if (boundaryInitialized) options.onExtentChange?.()});
  const navigate = top => {if (options.onNavigate) options.onNavigate(top);else window.scrollTo({top, behavior: 'instant'})};
  const invitation = {id: 'collaborate', name: '¿Quieres colaborar?', invitation: true};
  const deck = createMobileTourDeck(section, mobileTourRoute, [...cityClients, invitation]);
  const navigation = createMobileTourNavigation({onNavigate: top => {
    if (innerWidth < 700 && navigation.getState().active) input.lock();
    navigate(top);
  }});
  const input = createMobileTourInput(frame, navigation, {lock: documentLock, boundary, readTarget: options.readScrollTarget,
    onInterrupt: () => {mobileEntryPending = false; navigate(window.scrollY)}});
  const endGuard = createDesktopEndGuard({lock: documentLock, navigate, readTarget: options.readScrollTarget,
    blocked: () => dialog.isOpen || Boolean(document.querySelector('dialog[open]'))});
  const detail = createCityDetail(core);
  for (const client of [...cityClients, invitation]) {
    const site = sites[client.id];
    const portraitPin = mobileTourBuildings[client.id].pin;
    const item = document.createElement('li');
    item.className = 'city-building';
    item.style.setProperty('--pin-x', `${site.pinDesktop[0]}%`);
    item.style.setProperty('--pin-y', `${site.pinDesktop[1]}%`);
    item.style.setProperty('--portrait-pin-x', `${portraitPin[0]}%`);
    item.style.setProperty('--portrait-pin-y', `${portraitPin[1]}%`);
    item.dataset.client = client.id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-pin';
    button.setAttribute('aria-label', client.invitation ? client.name : `Ver caso de ${client.name}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'city-case');
    button.setAttribute('aria-expanded', 'false');
    const dot = document.createElement('span');
    dot.className = 'city-pin-dot';
    dot.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'city-pin-label';
    label.textContent = client.name;
    label.setAttribute('aria-hidden', 'true');
    button.append(dot, label);
    button.addEventListener('pointerenter', () => select(client.id));
    button.addEventListener('pointerleave', () => {if (!dialog.isOpen && document.activeElement !== button) select(null)});
    button.addEventListener('focus', () => select(client.id));
    button.addEventListener('blur', () => {if (!dialog.isOpen) select(null)});
    button.addEventListener('click', () => open(client, button));
    item.append(button);
    markers.push(button);
    list.append(item);
  }

  const carousel = createCityCarousel(section, cityClients, {onSelect(id) {
    select(id);
    const marker = markers.find(button => button.parentElement.dataset.client === id);
    if (innerWidth >= 700 && marker) pan.reveal(marker.getBoundingClientRect());
  }, onOpen: open});
  function select(id) {
    list.classList.toggle('has-selection', Boolean(id));
    for (const button of markers) button.classList.toggle('is-selected', button.parentElement.dataset.client === id);
    carousel.select(id);
  }
  function open(client, trigger) {
    select(client.id);
    if (innerWidth < 700) {
      navigation.select(client.id, {now: performance.now(), scroll: window.scrollY, geometry});
      return;
    }
    if (client.invitation) dialog.openInvitation(trigger);
    else dialog.open(client, trigger, carousel.logoFor(client.id));
  }

  function resize() {
    const viewport = innerHeight;
    const portrait = innerWidth < 700;
    const initialOutsideTarget = !geometry && location.hash === '#posibilidades';
    const wasPortrait = section.classList.contains('city-mobile-tour');
    if (!portrait) boundary.set(false);
    if (wasPortrait !== portrait) navigation.reset();
    section.classList.toggle('city-mobile-tour', portrait);
    // Copy has its own beat before the map on both layouts.
    section.append(copy);
    if (portrait && loading) {detail.preparePuntoes(); deck.load()}
    if (portrait) {
      // Keep the itinerary stable when Safari retracts its address bar.
      if (lastWidth !== innerWidth || Math.abs(viewport - tourViewport) > tourViewport * .2) tourViewport = viewport;
      geometry = mobileTourGeometry({top: section.offsetTop, viewport: tourViewport});
      // Keep the entrance anchor stable when browser chrome changes height,
      // but reserve a whole *current* viewport below it for the native exit.
      geometry = {...geometry, viewport, height: geometry.revealed + viewport - section.offsetTop};
      section.style.height = `${geometry.height}px`;
      boundary.set(boundary.closed || !wasPortrait && !initialOutsideTarget && window.scrollY <= geometry.revealed + .5, geometry);
      navigation.anchorScroll(window.scrollY, geometry);
    } else {
      section.style.removeProperty('height');
      geometry = cityGeometry({top: section.offsetTop, height: section.offsetHeight, viewport,
        footer: document.querySelector('footer').offsetHeight});
      geometry.end = document.querySelector('#posibilidades').offsetTop - viewport;
    }
    input.update(portrait, geometry);
    endGuard.update(!portrait, geometry);
    const aspect = image.naturalWidth && (image.naturalHeight > image.naturalWidth) === portrait ?
      image.naturalWidth / image.naturalHeight : portrait ? 941 / 1672 : 1672 / 941;
    const available = document.documentElement.clientWidth;
    // Cover both axes with real artwork, including a small exploration margin.
    const width = Math.max(available, viewport * aspect) * 1.04;
    const extent = portrait ? {width, height: width / aspect, coreWidth: width, coreHeight: width / aspect,
      coreLeft: 0, coreTop: 0, originX: .56, originY: .43} :
      cityExtent({width, height: width / aspect, originX: .52, originY: .48});
    world.style.width = `${extent.width}px`;
    world.style.height = `${extent.height}px`;
    world.style.transformOrigin = `${extent.originX * 100}% ${extent.originY * 100}%`;
    for (const layer of [core, corePicture]) {
      layer.style.width = `${extent.coreWidth}px`; layer.style.height = `${extent.coreHeight}px`;
      layer.style.left = `${extent.coreLeft}px`; layer.style.top = `${extent.coreTop}px`;
    }
    lastWidth = innerWidth; lastHeight = viewport;
    water?.resize();
  }

  function load() {
    if (loading) return;
    loading = true;
    source.srcset = portraitUrl;
    // A phone never downloads the expanded desktop artwork.
    extensionSource.srcset = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    function imagesReady() {
      const portrait = innerWidth < 700;
      if (!(portrait ? [image] : [image, extension]).every(img => img.complete && img.naturalWidth &&
        (img.naturalHeight > img.naturalWidth) === portrait)) return;
      ready = true;
      frame.classList.add('city-ready');
      // The softened backing also covers differences in viewport aspect ratio.
      backdrop.style.backgroundImage = `url("${portrait ? image.currentSrc : extension.currentSrc}")`;
      resize();
      const key = `${image.currentSrc}|${portrait ? 'tour' : extension.currentSrc}`;
      if (key === waterSources) return;
      waterSources = key;
      water?.dispose();
      water = createCityWater(world, image, {extension: portrait ? null : extension});
      if (portrait) deck.load();
      else carousel.load();
    }
    image.addEventListener('load', imagesReady);
    extension.addEventListener('load', imagesReady);
    function unavailable() {
      frame.classList.add('city-ready', 'city-unavailable');
      // Keep the organizations and copy available if the artwork cannot load.
      ready = true;
    }
    image.addEventListener('error', unavailable);
    extension.addEventListener('error', unavailable);
    image.src = desktopUrl;
    extension.src = extendedDesktopUrl;
    if (innerWidth < 700) {detail.preparePuntoes(); deck.load()}
    carousel.load();
  }

  function update(scroll, reduced, now = performance.now()) {
    reduced = reduced || cityMotion.matches;
    if (!geometry || lastWidth !== innerWidth || lastHeight !== innerHeight) resize();
    if (scroll > geometry.start - innerHeight * 2) load();
    const portrait = innerWidth < 700;
    // Do not reveal the thicker base-map office while its single mobile
    // texture is loading/decoding. A failed tile settles to the static base.
    const mapReady = ready && (!portrait || detail.isPuntoesSettled());
    input.update(portrait, geometry);
    if (portrait) scroll = input.reconcile(window.scrollY);
    else scroll = Math.min(scroll, endGuard.reconcile(window.scrollY));
    const state = portrait ? mobileTourState({scroll, geometry}) : cityState(scroll, geometry, reduced);
    frame.style.opacity = mapReady ? state.opacity : 0;
    frame.style.visibility = state.active ? 'visible' : 'hidden';
    frame.style.transform = `translate3d(0,${-state.exitY}px,0)`;
    const interactive = mapReady && state.active && state.opacity > .55;
    const mobile = innerWidth < 700 || matchMedia('(pointer: coarse)').matches;
    let position, tour;
    if (portrait) {
      tour = navigation.update(state, {scroll: input.navigationScroll(scroll), now, layout: {width: parseFloat(world.style.width), height: parseFloat(world.style.height),
        viewportWidth: document.documentElement.clientWidth, viewportHeight: innerHeight}, geometry, reduced, ready: mapReady});
      if (!input.isNavigating()) {
        if (tour.active) boundary.set(!navigation.canRelease(1), geometry);
        else if (scroll < geometry.start && tour.released <= 0) boundary.set(true, geometry);
      }
      // The introduction finishes before the mobile itinerary begins.
      if (tour.active) {state.opacity = 1; state.active = true; state.exitY = 0; state.revealed = true}
      state.stopIndex = tour.guidedCursor;
      state.current = tour.current;
      frame.style.opacity = mapReady ? state.opacity : 0;
      frame.style.visibility = state.active ? 'visible' : 'hidden';
      frame.style.transform = `translate3d(0,${-state.exitY}px,0)`;
      position = tour.camera;
      state.zoom = position.zoom;
      pan.update(world, state.zoom, reduced, false);
      world.style.transformOrigin = `${position.focusX * 100}% ${position.focusY * 100}%`;
      deck.update(state, mapReady && interactive, tour);
      section.dataset.cityStop = tour.current.id;
      section.dataset.cityCard = String(state.stopIndex);
      detail.update({active: interactive, visible: true, camera: position, current: tour.current.id,
        next: tour.nextId});
    }
    const view = perspective.update(now, {active: interactive && mobile, reduced,
      paused: dialog.isOpen || pan.isDragging || (portrait && tour.moving)});
    const reserve = Math.max(Math.abs(view.x), Math.abs(view.y)) * .0085;
    if (!portrait) {
      position = pan.update(world, state.zoom, reduced, interactive && !dialog.isOpen, reserve);
      deck.hide();
      delete section.dataset.cityStop;
      delete section.dataset.cityCard;
      navigation.reset();
      detail.update({active: false, camera: {zoom: 1}});
    }
    const depth = Math.max(parseFloat(world.style.width), parseFloat(world.style.height)) * 2.5;
    const tilt = view.hasReading ? ` perspective(${depth}px) rotateX(${view.x}deg) rotateY(${view.y}deg)` : '';
    world.style.transform = `translate3d(calc(-50% + ${position.x}px),calc(-50% + ${position.y}px),0) scale(${state.zoom})${tilt}`;
    section.dataset.cityPerspective = view.state;
    copy.style.opacity = state.copyOpacity;
    copy.setAttribute('aria-hidden', String(state.copyOpacity < .1));
    list.style.opacity = state.namesOpacity;
    // Do not focus an invisible/offscreen point while the city enters or leaves.
    const readable = mapReady && state.active && state.opacity > .55 && state.namesOpacity > .2;
    if (portrait) for (const button of markers) button.inert = true;
    else {
      const bounds = markers.map(button => button.getBoundingClientRect());
      markers.forEach((button, index) => {
        const rect = bounds[index];
        button.inert = !readable || rect.bottom < 82 || rect.top > innerHeight - 12 ||
          rect.right < 12 || rect.left > document.documentElement.clientWidth - 12;
      });
    }
    frame.inert = !state.active;
    frame.setAttribute('aria-hidden', String(!state.active));
    document.body.classList.toggle('city-active', state.active);
    section.dataset.cityProgress = state.progress.toFixed(3);
    water?.update(now, state.active && !dialog.isOpen, reduced);
    carousel.update(now, {...state, ready: mapReady, tourClient: tour?.entry?.id}, reduced);
    return {...state, ready: mapReady};
  }

  resize();
  boundaryInitialized = true;
  return {update, resize, load, dialog,
    anchorScroll: scroll => innerWidth < 700 ? input.reconcile(scroll) : endGuard.reconcile(scroll),
    prepareNavigation: enter => {mobileEntryPending = enter; input.prepareNavigation(); endGuard.prepareNavigation(); navigation.reset({suspend: innerWidth < 700 || !enter || cityEntryPoint(geometry, false) !== null})},
    getEndGuardState: endGuard.getState,
    finishNavigation() {
      const completed = input.finishNavigation(); endGuard.finishNavigation();
      if (completed && innerWidth < 700) {
        navigation.reset({suspend: true});
        if (mobileEntryPending) navigation.enter(geometry);
        if (mobileEntryPending || window.scrollY < geometry.start) boundary.set(true, geometry);
      }
      mobileEntryPending = false;
    },
    entryScrollAt: () => cityEntryPoint(geometry, innerWidth < 700),
    getTourState: navigation.getState,
    dispose() {input.dispose(); endGuard.dispose(); documentLock.set(false); boundary.dispose(); water?.dispose(); pan.dispose(); perspective.dispose()}, scrollAt: progress => cityMapPoint(geometry, progress, innerWidth < 700)};
}
