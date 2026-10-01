import {cleanClientImage} from './client-image.js';
import {smooth} from '../timeline.js';

// Optical heights compensate for tall symbols, secondary lines and wide names.
// The original proportions stay intact; a shared width cap prevents overflow.
const logoHeights = {accenture: 58, bbva: 40, canal: 66, cepsa: 50, mapfre: 50, mediaset: 36, ree: 36, siemens: 38, naturgy: 50, sabadell: 40};

export function createCityCarousel(section, clients, {onSelect, onOpen}) {
  const carousel = section.querySelector('.city-carousel');
  const viewport = carousel.querySelector('.city-carousel-viewport');
  const track = carousel.querySelector('.city-carousel-track');
  const logos = new Map();
  let offset = 0, lastTime = null, hovered = false, focused = false, modal = false, pointerFocus = false;
  let tourMode = null, browsingUntil = 0, touching = false;
  let touchScroll = null, suppressClickUntil = 0;

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
    // Published vector assets stay vector all the way to the rendered image.
    if (!client.clean) cleanClientImage(logo);
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
    button.addEventListener('click', event => {
      if (event.detail && performance.now() < suppressClickUntil) return;
      onOpen(client, button);
      if (tourMode && !button.matches(':focus-visible')) button.blur();
    });
    logos.set(client.id, logo);
    item.append(button);
    track.append(item);
  }

  carousel.addEventListener('pointerenter', () => {hovered = true});
  carousel.addEventListener('pointerdown', event => {
    pointerFocus = true;
    if (tourMode && event.pointerType === 'touch') {
      touching = true; browsingUntil = performance.now() + 3000;
      viewport.scrollLeft += offset;
      offset = 0; track.style.transform = 'translate3d(0,0,0)';
    }
  });
  const releaseTouch = () => {pointerFocus = false; touching = false; if (tourMode) browsingUntil = performance.now() + 3000};
  carousel.addEventListener('pointerup', releaseTouch);
  carousel.addEventListener('pointercancel', releaseTouch);
  viewport.addEventListener('scroll', () => {if (tourMode) browsingUntil = performance.now() + 3000}, {passive: true});
  viewport.addEventListener('touchstart', event => {
    if (!tourMode || event.touches.length !== 1) return;
    const point = event.touches[0];
    touchScroll = {x: point.clientX, y: point.clientY, left: viewport.scrollLeft, axis: null};
  }, {passive: true});
  viewport.addEventListener('touchmove', event => {
    if (!touchScroll || event.touches.length !== 1) return;
    const point = event.touches[0], dx = touchScroll.x - point.clientX, dy = touchScroll.y - point.clientY;
    if (!touchScroll.axis && Math.hypot(dx, dy) > 5) touchScroll.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
    if (touchScroll.axis !== 'x') return;
    if (event.cancelable) event.preventDefault();
    viewport.scrollLeft = touchScroll.left + dx;
    browsingUntil = performance.now() + 3000;
    suppressClickUntil = performance.now() + 600;
  }, {passive: false});
  for (const type of ['touchend', 'touchcancel']) viewport.addEventListener(type, () => {touchScroll = null}, {passive: true});
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
    // Scroll only the logo viewport. scrollIntoView would also scroll the
    // fixed scene's clipped ancestors and displace the whole city vertically.
    const buttonBounds = event.target.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    if (buttonBounds.left < viewportBounds.left) viewport.scrollLeft += buttonBounds.left - viewportBounds.left;
    else if (buttonBounds.right > viewportBounds.right) viewport.scrollLeft += buttonBounds.right - viewportBounds.right;
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
    const isTour = state.mode === 'tour';
    if (isTour !== tourMode) {
      tourMode = isTour;
      for (const button of track.querySelectorAll('button')) {
        button.setAttribute('aria-controls', isTour ? `tour-card-${button.dataset.client}` : 'city-case');
        const name = clients.find(client => client.id === button.dataset.client).name;
        button.setAttribute('aria-label', isTour ? `Visitar ${name} en el mapa` : `Ver caso de ${name}`);
        if (isTour) {button.removeAttribute('aria-haspopup'); button.removeAttribute('aria-expanded')}
        else {button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'false')}
      }
    }
    const opacity = isTour ? smooth(.72, 1, state.opacity) : reduced ? 1 : smooth(.24, .52, state.progress);
    carousel.style.opacity = opacity;
    carousel.inert = !state.ready || !state.active || state.opacity < .55 || opacity < .2;
    if (isTour) select(state.tourClient ?? null);
    const paused = (hovered && !isTour) || focused || touching || now < browsingUntil || modal || reduced || !state.active || document.hidden;
    carousel.dataset.paused = String(paused);
    if (paused || opacity < .2) return;
    if (isTour && viewport.scrollLeft) {
      offset += viewport.scrollLeft; viewport.scrollLeft = 0;
    }
    const first = track.firstElementChild;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    if (track.scrollWidth <= viewport.clientWidth || !step) return;
    offset += elapsed * (isTour ? 22 : 34);
    // Recycle the fully clipped item: one real button per company, no copies
    // or duplicate links in the accessibility tree.
    while (offset >= step) {track.append(track.firstElementChild); offset -= step}
    track.style.transform = `translate3d(${-offset}px,0,0)`;
  }

  function select(id) {
    for (const button of track.querySelectorAll('button')) {
      button.classList.toggle('is-selected', button.dataset.client === id);
      if (tourMode && button.dataset.client === id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
  }

  return {
    update, select,
    setModal(value) {modal = value},
    load() {for (const logo of logos.values()) logo.src = logo.dataset.src},
    logoFor(id) {return logos.get(id)?.src},
  };
}
