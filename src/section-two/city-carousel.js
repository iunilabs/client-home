import {cleanClientImage} from './client-image.js';
import {smooth} from '../timeline.js';

// Optical heights compensate for tall symbols, secondary lines and wide names.
// The original proportions stay intact; a shared width cap prevents overflow.
const logoHeights = {accenture: 62, bbva: 38, canal: 62, cepsa: 50, mapfre: 38, mediaset: 68, ree: 68, siemens: 38, naturgy: 58, sabadell: 40};

export function createCityCarousel(section, clients, {onSelect, onOpen}) {
  const carousel = section.querySelector('.city-carousel');
  const viewport = carousel.querySelector('.city-carousel-viewport');
  const track = carousel.querySelector('.city-carousel-track');
  const logos = new Map();
  let offset = 0, lastTime = null, hovered = false, focused = false, modal = false, pointerFocus = false;

  for (const client of clients) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-client';
    button.dataset.client = client.id;
    button.style.setProperty('--logo-height', `${logoHeights[client.id]}px`);
    button.style.setProperty('--mobile-logo-height', `${Math.round(logoHeights[client.id] * .74)}px`);
    button.setAttribute('aria-label', `Ver caso de ${client.name}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'city-case');
    button.setAttribute('aria-expanded', 'false');
    const logo = document.createElement('img');
    logo.alt = '';
    logo.decoding = 'async';
    logo.draggable = false;
    logo.dataset.src = client.image;
    cleanClientImage(logo);
    const fallback = document.createElement('span');
    fallback.textContent = client.name;
    fallback.hidden = true;
    logo.addEventListener('error', () => {logo.hidden = true; fallback.hidden = false}, {once: true});
    button.append(logo, fallback);
    button.addEventListener('pointerenter', () => {
      if (!carousel.classList.contains('is-focused')) onSelect(client.id);
    });
    button.addEventListener('pointermove', event => {
      if (event.movementX || event.movementY) onSelect(client.id);
    });
    button.addEventListener('pointerleave', () => {
      if (carousel.classList.contains('is-focused')) {
        onSelect(document.activeElement.closest('.city-client')?.dataset.client ?? null);
        return;
      }
      if (!modal && document.activeElement !== button) onSelect(null);
    });
    button.addEventListener('focus', () => {
      onSelect(client.id);
    });
    button.addEventListener('click', () => onOpen(client, button));
    logos.set(client.id, logo);
    item.append(button);
    track.append(item);
  }

  carousel.addEventListener('pointerenter', () => {hovered = true});
  carousel.addEventListener('pointerdown', () => {pointerFocus = true});
  carousel.addEventListener('pointerup', () => {pointerFocus = false});
  carousel.addEventListener('pointercancel', () => {pointerFocus = false});
  carousel.addEventListener('pointerleave', () => {
    hovered = false;
    if (!focused && !modal) onSelect(null);
  });
  carousel.addEventListener('focusin', event => {
    focused = true;
    // Moving the row between pointerdown and click would move the target out
    // from under the pointer. Only keyboard focus switches to manual browsing.
    if (pointerFocus || !event.target.matches(':focus-visible')) return;
    carousel.classList.add('is-focused');
    offset = 0;
    track.style.transform = 'translate3d(0,0,0)';
    event.target.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
  });
  carousel.addEventListener('focusout', event => {
    if (carousel.contains(event.relatedTarget)) return;
    focused = false;
    carousel.classList.remove('is-focused');
    viewport.scrollLeft = 0;
    if (!hovered && !modal) onSelect(null);
  });

  function update(now, state, reduced) {
    const elapsed = lastTime === null ? 0 : Math.min(.08, (now - lastTime) / 1000);
    lastTime = now;
    const opacity = reduced ? 1 : smooth(.24, .52, state.progress);
    carousel.style.opacity = opacity;
    carousel.inert = !state.ready || !state.active || state.opacity < .55 || opacity < .2;
    const paused = hovered || focused || modal || reduced || !state.active || document.hidden;
    carousel.dataset.paused = String(paused);
    if (paused || opacity < .2) return;
    const first = track.firstElementChild;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    if (track.scrollWidth <= viewport.clientWidth || !step) return;
    offset += elapsed * (innerWidth < 700 ? 30 : 34);
    // Recycle the fully clipped item: one real button per company, no copies
    // or duplicate links in the accessibility tree.
    while (offset >= step) {track.append(track.firstElementChild); offset -= step}
    track.style.transform = `translate3d(${-offset}px,0,0)`;
  }

  function select(id) {
    for (const button of track.querySelectorAll('button')) {
      button.classList.toggle('is-selected', button.dataset.client === id);
    }
  }

  return {
    update, select,
    setModal(value) {modal = value},
    load() {for (const logo of logos.values()) logo.src = logo.dataset.src},
    logoFor(id) {return logos.get(id)?.src},
  };
}
