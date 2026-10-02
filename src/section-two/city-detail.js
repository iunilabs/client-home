import bbvaUrl from './assets/puntoes-city-mobile-bbva-detail-v14.webp';
import puntoesUrl from './assets/puntoes-city-mobile-puntoes-detail-v14.webp';
import naturgyUrl from './assets/puntoes-city-mobile-naturgy-detail-v14.webp';
import sabadellUrl from './assets/puntoes-city-mobile-sabadell-detail-v14.webp';
import constructionUrl from './assets/puntoes-city-mobile-collaborate-detail-v14.webp';
import accentureUrl from './assets/puntoes-city-mobile-accenture-detail-v14.webp';
import canalUrl from './assets/puntoes-city-mobile-canal-detail-v14.webp';
import cepsaUrl from './assets/puntoes-city-mobile-cepsa-detail-v14.webp';
import mapfreUrl from './assets/puntoes-city-mobile-mapfre-detail-v14.webp';
import mediasetUrl from './assets/puntoes-city-mobile-mediaset-detail-v14.webp';
import reeUrl from './assets/puntoes-city-mobile-ree-detail-v14.webp';
import siemensUrl from './assets/puntoes-city-mobile-siemens-detail-v14.webp';
import {smooth} from '../timeline.js';

// Each native detail image reconstructs a precise V13 source rectangle.
// The base portrait remains visible; soft boundaries prevent rectangular seams.
// Only visited/next stops download a tile. Desktop never requests these images.
export const cityDetails = {
  puntoes: {url: puntoesUrl, rect: [346, 418, 300, 532]},
  bbva: {url: bbvaUrl, rect: [332, 70, 280, 496]},
  naturgy: {url: naturgyUrl, rect: [297, 777, 280, 496]},
  sabadell: {url: sabadellUrl, rect: [72, 962, 280, 496]},
  collaborate: {url: constructionUrl, rect: [0, 0, 252, 448]},
  accenture: {url: accentureUrl, rect: [45, 410, 290, 280], feather: [10, 12]},
  canal: {url: canalUrl, rect: [155, 257, 140, 240]},
  cepsa: {url: cepsaUrl, rect: [654, 218, 140, 240]},
  mapfre: {url: mapfreUrl, rect: [711, 437, 220, 200], feather: [8, 8]},
  mediaset: {url: mediasetUrl, rect: [73, 652, 280, 380]},
  ree: {url: reeUrl, rect: [637, 700, 280, 280]},
  siemens: {url: siemensUrl, rect: [568, 937, 360, 320], feather: [8, 12]},
};

export function createCityDetail(core) {
  const tiles = new Map();
  for (const [id, detail] of Object.entries(cityDetails)) {
    const image = document.createElement('img');
    image.className = 'city-detail'; image.alt = ''; image.decoding = 'async';
    image.dataset.client = id;
    const [x, y, width, height] = detail.rect;
    image.style.left = `${x / 941 * 100}%`; image.style.top = `${y / 1672 * 100}%`;
    image.style.width = `${width / 941 * 100}%`; image.style.height = `${height / 1672 * 100}%`;
    // Compact crops give their subject more native pixels. Keep the whole
    // building inside the opaque part; soften only the surrounding context.
    if (detail.feather) {
      const [horizontal, vertical] = detail.feather;
      image.style.maskImage = `linear-gradient(90deg,transparent,#000 ${horizontal}%,#000 ${100 - horizontal}%,transparent),linear-gradient(180deg,transparent,#000 ${vertical}%,#000 ${100 - vertical}%,transparent)`;
    }
    const tile = {id, image, detail, ready: false, requested: false, failed: false, loadedAt: 0};
    image.addEventListener('load', () => {tile.ready = true; tile.loadedAt = performance.now()});
    image.addEventListener('error', () => {tile.failed = true; tile.ready = false; image.remove()});
    core.prepend(image); tiles.set(id, tile);
  }
  function load(id) {
    const tile = tiles.get(id);
    if (tile && !tile.requested) {tile.requested = true; tile.image.src = tile.detail.url}
  }
  return {
    update({active, camera, current, next, now = performance.now()}) {
      if (active) {load(current); load(next)}
      for (const tile of tiles.values()) {
        // The detail follows the same world transform throughout the journey.
        // No swap at arrival: contrast/detail increases gradually with zoom.
        // The broad Siemens campus fits at ~2.4x on tall phones; it needs
        // full detail there too. A loaded neighbour must never cover the
        // current building with its lower-detail surrounding scenery.
        tile.image.style.zIndex = tile.id === current ? '2' : '1';
        tile.image.style.opacity = active && tile.ready && !tile.failed ? smooth(1.7, 2.3, camera.zoom) * smooth(0, 500, now - tile.loadedAt) : 0;
      }
    },
  };
}
