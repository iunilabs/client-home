import bbvaUrl from './assets/puntoes-city-mobile-bbva-detail-v14.webp';
import puntoesUrl from './assets/puntoes-city-mobile-puntoes-detail-v14.webp';
import naturgyUrl from './assets/puntoes-city-mobile-naturgy-detail-v14.webp';
import sabadellUrl from './assets/puntoes-city-mobile-sabadell-detail-v14.webp';
import constructionUrl from './assets/puntoes-city-mobile-collaborate-detail-v14.webp';
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
    const tile = {image, detail, ready: false, requested: false, loadedAt: 0};
    image.addEventListener('load', () => {tile.ready = true; tile.loadedAt = performance.now()});
    image.addEventListener('error', () => {image.remove()});
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
        tile.image.style.opacity = active && tile.ready ? smooth(1.7, 2.8, camera.zoom) * smooth(0, 500, now - tile.loadedAt) : 0;
      }
    },
  };
}
