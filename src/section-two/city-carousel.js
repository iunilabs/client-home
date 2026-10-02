import {cleanClientImage} from './client-image.js';
import {smooth} from '../timeline.js';
import {createCarouselMotion} from './carousel-motion.js';
import './city-carousel.css';

const logoHeights = {accenture: 58, bbva: 40, canal: 66, cepsa: 50, mapfre: 50, mediaset: 36, ree: 36, siemens: 38, naturgy: 50, sabadell: 40};
const DRAG_THRESHOLD = 5;
const POINTER_FOCUS_DELAY = 1000;
const VELOCITY_SAMPLE_WINDOW = 120;

export function createCityCarousel(section, clients, {onSelect, onOpen}) {
  const carousel = section.querySelector('.city-carousel');
  const viewport = carousel.querySelector('.city-carousel-viewport');
  const track = carousel.querySelector('.city-carousel-track');
  const logos = new Map();
  const motion = createCarouselMotion();
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let focused = false, modal = false, openingClient = false, touchHeld = false, hovered = false, gestureEndedAt = -Infinity;
  let tourMode = null, pointerGesture = null, touchGesture = null;
  let pointerFocus = false, suppressClickUntil = 0, keyboardBrowsing = false;
  let lastPointerFocusAt = -Infinity;

  carousel.dataset.motion = 'paused';
  carousel.classList.add('city-carousel--interactive');

  for (const client of clients) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-client';
    button.dataset.client = client.id;
    button.style.setProperty('--logo-height', `${logoHeights[client.id]}px`);
    button.style.setProperty('--mobile-logo-height', `${Math.round(logoHeights[client.id] * .74)}px`);
    button.setAttribute('aria-label', `Ver caso de ${client.name}`);
    button.setAttribute('aria-controls', `tour-card-${client.id}`);
    button.setAttribute('aria-expanded', 'false');
    const logo = document.createElement('img');
    logo.alt = '';
    logo.decoding = 'async';
    logo.draggable = false;
    logo.dataset.src = client.image;
    if (!client.clean) cleanClientImage(logo);
    const fallback = document.createElement('span');
    fallback.textContent = client.name;
    fallback.hidden = true;
    logo.addEventListener('error', () => {logo.hidden = true; fallback.hidden = false}, {once: true});
    button.append(logo, fallback);
    button.addEventListener('pointerenter', event => {
      // Touch browsers can synthesize a sticky hover after a tap. It must not
      // select repeatedly or inhibit the carousel's inactivity timer.
      if (event.pointerType === 'touch') return;
      if (!carousel.classList.contains('is-focused')) onSelect(client.id);
    });
    button.addEventListener('pointermove', event => {
      if (event.pointerType !== 'touch' && (event.movementX || event.movementY)) onSelect(client.id);
    });
    button.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch') return;
      if (carousel.classList.contains('is-focused')) {
        onSelect(document.activeElement.closest('.city-client')?.dataset.client ?? null);
        return;
      }
      if (!modal && !openingClient && document.activeElement !== button) onSelect(null);
    });
    button.addEventListener('focus', () => onSelect(client.id));
    button.addEventListener('click', event => {
      if (event.detail && performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      openingClient = true;
      try {onOpen(client, button)} finally {openingClient = false}
      if (tourMode && !keyboardBrowsing) button.blur();
    });
    logos.set(client.id, logo);
    item.append(button);
    track.append(item);
  }

  function stepFor(item) {
    return item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0');
  }

  function setOffset(value) {
    // Rotate only the real, fully clipped item. Offset adjustments preserve
    // every visible pixel and each company's single DOM node.
    while (track.firstElementChild && value >= stepFor(track.firstElementChild)) {
      const first = track.firstElementChild;
      value -= stepFor(first);
      track.append(first);
    }
    while (value < 0) {
      const last = track.lastElementChild;
      if (!last) break;
      track.prepend(last);
      value += stepFor(last);
    }
    motion.setOffset(value);
    track.style.transform = `translate3d(${-value}px,0,0)`;
  }

  function enterKeyboardMode(button) {
    keyboardBrowsing = true;
    carousel.classList.add('is-focused');
    // Keep the visual position while switching from translated motion to the
    // native overflow viewport used for predictable keyboard focus scrolling.
    viewport.scrollLeft = motion.offset;
    track.style.transform = 'translate3d(0,0,0)';
    motion.setOffset(0);
    const b = button.getBoundingClientRect(), v = viewport.getBoundingClientRect();
    if (b.left < v.left) viewport.scrollLeft += b.left - v.left;
    else if (b.right > v.right) viewport.scrollLeft += b.right - v.right;
  }

  function leaveKeyboardMode() {
    const saved = viewport.scrollLeft;
    viewport.scrollLeft = 0;
    keyboardBrowsing = false;
    carousel.classList.remove('is-focused');
    setOffset(motion.offset + saved);
  }

  function beginDrag(x, now, kind) {
    if (keyboardBrowsing) {
      const saved = viewport.scrollLeft;
      viewport.scrollLeft = 0;
      keyboardBrowsing = false;
      carousel.classList.remove('is-focused');
      setOffset(motion.offset + saved);
    }
    if (tourMode) focused = false;
    pointerFocus = true;
    lastPointerFocusAt = now;
    motion.beginDrag();
    return {kind, startX: x, lastX: x, moved: false, travel: 0, samples: [{x: 0, time: now}]};
  }

  function dragTo(gesture, x, now) {
    const delta = gesture.lastX - x;
    if (!gesture.moved && Math.abs(x - gesture.startX) < DRAG_THRESHOLD) return;
    gesture.lastX = x;
    gesture.moved = true;
    gesture.travel += delta;
    suppressClickUntil = now + 800;
    setOffset(motion.offset + delta);
    gesture.samples.push({x: gesture.travel, time: now});
    while (gesture.samples.length > 2 && now - gesture.samples[0].time > VELOCITY_SAMPLE_WINDOW) gesture.samples.shift();
  }

  function finishDrag(gesture, now, cancelled = false) {
    if (!gesture) return;
    pointerFocus = false;
    lastPointerFocusAt = now;
    gestureEndedAt = now;
    if (tourMode && gesture.moved) suppressClickUntil = now + 800;
    let velocity = 0;
    const samples = gesture.samples;
    // Mobile drags use fresh release samples only, and system cancellation
    // ends the drag without turning old samples into a fling.
    if (gesture.moved && samples.length > 1 && (!tourMode || (!cancelled && now - samples.at(-1).time <= VELOCITY_SAMPLE_WINDOW))) {
      const first = samples[0], last = samples[samples.length - 1];
      const duration = (last.time - first.time) / 1000;
      if (duration > 0) velocity = (last.x - first.x) / duration;
    }
    motion.endDrag(now, velocity);
  }

  // Mouse and pen use pointer capture. Touch uses axis locking below so a
  // vertical swipe can continue scrolling the page while a horizontal one is
  // owned by the logo strip.
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') {touchHeld = true; lastPointerFocusAt = performance.now(); return}
    if (event.button !== 0 || focused || modal) return;
    pointerGesture = beginDrag(event.clientX, performance.now(), 'pointer');
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointerGesture || event.pointerType === 'touch') return;
    dragTo(pointerGesture, event.clientX, performance.now());
    if (pointerGesture.moved && !viewport.hasPointerCapture?.(event.pointerId)) viewport.setPointerCapture?.(event.pointerId);
  });
  const finishPointer = event => {
    // TouchEvents own the held-finger lifetime. Chromium may send pointercancel
    // as soon as pan-y arbitration rejects a horizontal gesture; that is not a
    // finger release and must not let automatic motion start underneath it.
    if (event.pointerType === 'touch') return;
    if (!pointerGesture) return;
    finishDrag(pointerGesture, performance.now(), event.type === 'pointercancel');
    pointerGesture = null;
  };
  viewport.addEventListener('pointerup', finishPointer);
  viewport.addEventListener('pointercancel', finishPointer);

  viewport.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || (!tourMode && focused) || modal) return;
    const point = event.touches[0];
    touchHeld = true;
    // Mobile touch takes over keyboard browsing immediately. A tap's focus
    // can arrive after pointerup, and :focus-visible alone does not tell
    // us whether that focus came from a keyboard or from a finger.
    const now = performance.now();
    touchGesture = tourMode ? {...beginDrag(point.clientX, now, 'touch'), startY: point.clientY, axis: null} :
      {startX: point.clientX, startY: point.clientY, lastX: point.clientX, axis: null, moved: false, travel: 0, samples: [{x: 0, time: now}]};
  }, {passive: true});
  viewport.addEventListener('touchmove', event => {
    const gesture = touchGesture;
    if (!gesture || event.touches.length !== 1) return;
    const point = event.touches[0], dx = gesture.startX - point.clientX, dy = gesture.startY - point.clientY;
    if (!gesture.axis && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      gesture.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
      if (gesture.axis === 'x' && !tourMode) motion.beginDrag();
    }
    if (gesture.axis !== 'x') return;
    if (event.cancelable) event.preventDefault();
    dragTo(gesture, point.clientX, performance.now());
  }, {passive: false});
  const finishTouch = event => {
    // Keep the pause until the last finger leaves, even if a second finger
    // briefly changes the gesture from one-contact to multi-contact.
    if (event.touches.length) return;
    touchHeld = false;
    if (tourMode) {pointerFocus = false; lastPointerFocusAt = performance.now()}
    if (!touchGesture) return;
    const gesture = touchGesture;
    touchGesture = null;
    if (gesture.axis === 'x') finishDrag(gesture, performance.now(), event.type === 'touchcancel');
    else motion.interrupt(performance.now());
  };
  for (const type of ['touchend', 'touchcancel']) viewport.addEventListener(type, finishTouch, {passive: true});
  // With two fingers, the last one may end outside the strip. Listening only
  // on the viewport would keep touchHeld/dragging set forever in that case.
  const finishMobileTouch = event => {if (tourMode && touchHeld) finishTouch(event)};
  for (const type of ['touchend', 'touchcancel']) window.addEventListener(type, finishMobileTouch, {capture: true, passive: true});

  carousel.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') {pointerFocus = true; lastPointerFocusAt = performance.now()}
  });
  carousel.addEventListener('pointerup', event => {if (event.pointerType === 'touch') pointerFocus = false});
  carousel.addEventListener('pointercancel', event => {if (event.pointerType === 'touch') pointerFocus = false});
  carousel.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    hovered = false;
    if (!focused && !modal && !openingClient) onSelect(null);
  });
  carousel.addEventListener('pointerenter', event => {if (event.pointerType !== 'touch') hovered = true});
  document.addEventListener('visibilitychange', () => {
    const now = performance.now();
    // The renderer stops its animation loop while hidden. Reset the frame
    // clock and gesture so the first visible frame cannot integrate a long gap.
    motion.interrupt(now);
    if (document.hidden) {
      pointerGesture = null;
      touchGesture = null;
      touchHeld = false;
      pointerFocus = false;
    }
  });
  // Preserve delayed touch-generated focus without treating it as keyboard
  // browsing. An explicit key immediately restores keyboard focus behavior.
  document.addEventListener('keydown', () => {if (tourMode) {pointerFocus = false; lastPointerFocusAt = -Infinity}}, {capture: true});
  carousel.addEventListener('focusin', event => {
    if (pointerFocus || (tourMode && performance.now() - lastPointerFocusAt < POINTER_FOCUS_DELAY) || !event.target.matches(':focus-visible')) return;
    focused = true;
    if (!keyboardBrowsing) enterKeyboardMode(event.target.closest('.city-client'));
    else {
      const b = event.target.getBoundingClientRect(), v = viewport.getBoundingClientRect();
      if (b.left < v.left) viewport.scrollLeft += b.left - v.left;
      else if (b.right > v.right) viewport.scrollLeft += b.right - v.right;
    }
  });
  carousel.addEventListener('focusout', event => {
    if (carousel.contains(event.relatedTarget)) return;
    focused = false;
    if (keyboardBrowsing) leaveKeyboardMode();
    if (!modal && !openingClient) onSelect(null);
  });

  function update(now, state, reduced) {
    const isTour = state.mode === 'tour';
    if (isTour !== tourMode) {
      tourMode = isTour;
      for (const button of track.querySelectorAll('button')) {
        button.setAttribute('aria-controls', `tour-card-${button.dataset.client}`);
        const name = clients.find(client => client.id === button.dataset.client).name;
        button.setAttribute('aria-label', isTour ? `Visitar ${name} en el mapa` : `Ver tarjeta de ${name}`);
        if (isTour) {button.removeAttribute('aria-haspopup'); button.removeAttribute('aria-expanded')}
        else {button.removeAttribute('aria-haspopup'); button.setAttribute('aria-expanded', 'false')}
      }
    }
    const opacity = isTour ? smooth(.72, 1, state.opacity) : reduced ? 1 : smooth(.24, .52, state.progress);
    carousel.style.opacity = opacity;
    carousel.inert = !state.ready || !state.active || state.opacity < .55 || opacity < .2;
    if (isTour) select(state.tourClient ?? null);
    const carouselReduced = reduced || reducedMotionQuery.matches;
    motion.setReduced(carouselReduced, {autoplay: isTour});
    const hoverPaused = hovered && !isTour && now - gestureEndedAt > 2000;
    const blocked = focused || touchHeld || modal || (carouselReduced && !isTour) || !state.active || document.hidden || keyboardBrowsing || opacity < .2 || hoverPaused;
    const result = motion.frame(now, blocked, isTour ? 22 : 34);
    carousel.dataset.paused = String(blocked || opacity < .2);
    carousel.dataset.motion = opacity < .2 ? 'hidden' : result.phase;
    if (opacity < .2 || keyboardBrowsing) return;
    if (isTour && viewport.scrollLeft) {
      setOffset(motion.offset + viewport.scrollLeft);
      viewport.scrollLeft = 0;
    }
    if (track.scrollWidth <= viewport.clientWidth) return;
    // motion.frame returns px accumulated using real elapsed time; recycling
    // maintains the same visible marks through drag, inertia and autoplay.
    setOffset(motion.offset + result.delta);
  }

  function select(id) {
    for (const button of track.querySelectorAll('button')) {
      button.classList.toggle('is-selected', button.dataset.client === id);
      if (tourMode && button.dataset.client === id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
  }

  return {
    update, select, setActiveClient: select,
    setModal(value) {
      if (modal !== value) motion.interrupt(performance.now());
      modal = value;
    },
    load() {for (const logo of logos.values()) logo.src = logo.dataset.src},
    logoFor(id) {return logos.get(id)?.src},
  };
}
