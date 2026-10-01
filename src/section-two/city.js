import desktopUrl from './assets/puntoes-city-v10.webp';
import portraitUrl from './assets/puntoes-city-mobile-v10.webp';
import {cityClients} from './city-clients.js';
import {cityGeometry, cityState} from './city-state.js';
import {createClientDialog} from './client-dialog.js';
import {createCityWater} from './city-water.js';
import {createCityCarousel} from './city-carousel.js';
import {createCityPan} from './city-pan.js';
import {createCityPerspective} from './city-perspective.js';

// Architecture is interpreted from photos; the city layout is imaginary.
// Roof points are calibrated separately for the two artwork compositions.
const sites = {
  collaborate: {pinDesktop: [16.2, 16.2], pinPortrait: [14.2, 14.4]},
  accenture: {pinDesktop: [29.5, 31.2], pinPortrait: [23.6, 29.4]},
  bbva: {pinDesktop: [49.4, 12.9], pinPortrait: [49.5, 14.2]},
  canal: {pinDesktop: [39.4, 16], pinPortrait: [32, 19.4]},
  cepsa: {pinDesktop: [64, 12.8], pinPortrait: [72.4, 15]},
  mapfre: {pinDesktop: [75.7, 27.1], pinPortrait: [83.2, 25.4]},
  mediaset: {pinDesktop: [21.2, 47.5], pinPortrait: [26.5, 41.2]},
  ree: {pinDesktop: [74, 43.2], pinPortrait: [82.8, 42.8]},
  siemens: {pinDesktop: [69, 60.5], pinPortrait: [75, 54]},
  naturgy: {pinDesktop: [51.4, 59.8], pinPortrait: [48.3, 53]},
  sabadell: {pinDesktop: [30.4, 74], pinPortrait: [24.6, 62.9]},
};

export function createCity(section, options = {}) {
  const frame = section.querySelector('.trust-frame');
  const world = section.querySelector('.city-world');
  const image = section.querySelector('#city-image');
  const source = section.querySelector('source');
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
  let loading = false, ready = false, geometry, lastWidth = 0, lastHeight = 0, water = null;

  const invitation = {id: 'collaborate', name: '¿Quieres colaborar?', invitation: true};
  for (const client of [...cityClients, invitation]) {
    const site = sites[client.id];
    const item = document.createElement('li');
    item.className = 'city-building';
    item.style.setProperty('--pin-x', `${site.pinDesktop[0]}%`);
    item.style.setProperty('--pin-y', `${site.pinDesktop[1]}%`);
    item.style.setProperty('--portrait-pin-x', `${site.pinPortrait[0]}%`);
    item.style.setProperty('--portrait-pin-y', `${site.pinPortrait[1]}%`);
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
    if (marker) pan.reveal(marker.getBoundingClientRect());
  }, onOpen: open});
  function select(id) {
    list.classList.toggle('has-selection', Boolean(id));
    for (const button of markers) button.classList.toggle('is-selected', button.parentElement.dataset.client === id);
    carousel.select(id);
  }
  function open(client, trigger) {
    select(client.id);
    if (client.invitation) dialog.openInvitation(trigger);
    else dialog.open(client, trigger, carousel.logoFor(client.id));
  }

  function resize() {
    const viewport = innerHeight;
    geometry = cityGeometry({top: section.offsetTop, height: section.offsetHeight, viewport, footer: document.querySelector('footer').offsetHeight});
    // Separate portrait artwork keeps the entire district legible on a phone.
    const portrait = innerWidth < 700;
    const aspect = portrait ? 941 / 1672 : 1672 / 941;
    const available = document.documentElement.clientWidth;
    // Cover both axes with real artwork, including a small exploration margin.
    const width = Math.max(available, viewport * aspect) * 1.04;
    world.style.width = `${width}px`;
    world.style.height = `${width / aspect}px`;
    lastWidth = innerWidth; lastHeight = viewport;
    water?.resize();
  }

  function load() {
    if (loading) return;
    loading = true;
    source.srcset = portraitUrl;
    image.addEventListener('load', () => {
      ready = true;
      frame.classList.add('city-ready');
      // The softened backing also covers differences in viewport aspect ratio.
      backdrop.style.backgroundImage = `url("${image.currentSrc}")`;
      resize();
      water?.dispose();
      water = createCityWater(world, image);
    });
    image.addEventListener('error', () => {
      frame.classList.add('city-ready', 'city-unavailable');
      // Keep the organizations and copy available if the artwork cannot load.
      ready = true;
    });
    image.src = desktopUrl;
    carousel.load();
  }

  function update(scroll, reduced, now = performance.now()) {
    if (!geometry || lastWidth !== innerWidth || lastHeight !== innerHeight) resize();
    if (scroll > geometry.start - innerHeight * 2) load();
    const state = cityState(scroll, geometry, reduced);
    frame.style.opacity = ready ? state.opacity : 0;
    frame.style.visibility = state.active ? 'visible' : 'hidden';
    frame.style.transform = `translate3d(0,${-state.exitY}px,0)`;
    const interactive = ready && state.active && state.opacity > .55;
    const mobile = innerWidth < 700 || matchMedia('(pointer: coarse)').matches;
    const view = perspective.update(now, {active: interactive && mobile, reduced, paused: dialog.isOpen || pan.isDragging});
    const reserve = Math.max(Math.abs(view.x), Math.abs(view.y)) * .0085;
    const position = pan.update(world, state.zoom, reduced, interactive && !dialog.isOpen, reserve);
    const depth = Math.max(parseFloat(world.style.width), parseFloat(world.style.height)) * 2.5;
    const tilt = view.hasReading ? ` perspective(${depth}px) rotateX(${view.x}deg) rotateY(${view.y}deg)` : '';
    world.style.transform = `translate3d(calc(-50% + ${position.x}px),calc(-50% + ${position.y}px),0) scale(${state.zoom})${tilt}`;
    section.dataset.cityPerspective = view.state;
    copy.style.opacity = state.copyOpacity;
    copy.setAttribute('aria-hidden', String(state.copyOpacity < .1));
    list.style.opacity = state.namesOpacity;
    // Do not focus an invisible/offscreen point while the city enters or leaves.
    const readable = ready && state.active && state.opacity > .55 && state.namesOpacity > .2;
    const bounds = markers.map(button => button.getBoundingClientRect());
    markers.forEach((button, index) => {
      const rect = bounds[index];
      button.inert = !readable || rect.bottom < 82 || rect.top > innerHeight - 12 ||
        rect.right < 12 || rect.left > document.documentElement.clientWidth - 12;
    });
    frame.inert = !state.active;
    frame.setAttribute('aria-hidden', String(!state.active));
    document.body.classList.toggle('city-active', state.active);
    section.dataset.cityProgress = state.progress.toFixed(3);
    water?.update(now, state.active && !dialog.isOpen, reduced);
    carousel.update(now, {...state, ready}, reduced);
    return {...state, ready};
  }

  resize();
  return {update, resize, load, dialog, dispose() {water?.dispose(); pan.dispose(); perspective.dispose()}, scrollAt: progress => geometry.revealed + Math.max(0, Math.min(1, progress)) * (geometry.end - geometry.revealed)};
}
