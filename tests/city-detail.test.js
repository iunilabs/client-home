import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mobileTourBuildings, mobileTourHub} from '../src/section-two/mobile-tour-config.js';
import {mobileBuildingView} from '../src/section-two/mobile-tour.js';

// Node cannot import bitmap URLs. Replace only those URL imports; execute
// the actual detail controller and its actual smooth function unchanged.
const source = await fs.readFile(new URL('../src/section-two/city-detail.js', import.meta.url), 'utf8');
const executable = source.replace(/import (\w+Url) from '(\.\/assets\/[^']+)';/g, (_, name, url) => `const ${name} = ${JSON.stringify(url)};`)
  .replace("'../timeline.js'", JSON.stringify(new URL('../src/timeline.js', import.meta.url).href));
const {cityDetails, createCityDetail} = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);
const approvedHashes = {
  puntoes: '946c07371ea8c665882d79d25644b2ade7aea44926fa3eb0a60d78bf1d574f58',
  bbva: 'e81e438fc65d667bcde4c2ffbcf8dde16aae2a8dbdd8931b7a3ed3f0305ace1b',
  naturgy: 'cc4babe7f7e85b17e3c0023c86c1907c4d1747569799fd991849ad1e9360f87a',
  sabadell: 'ec7b7d7b4a755ee041c862d66bb4ea12975cfcfe880f9b3fd8b2fa83359013f5',
  collaborate: 'efbe283915dbc13900e48eb915a2a3e6d87a54f860d85fcbe9b4f08bc8e802ce',
};

test('all ten customers, hub and invitation have matching source rectangles', async () => {
  assert.deepEqual(Object.keys(cityDetails).sort(), [...Object.keys(mobileTourBuildings), 'puntoes'].sort());
  const provenance = JSON.parse(await fs.readFile(new URL('../src/section-two/assets/city-detail-provenance.json', import.meta.url)));
  assert.equal(provenance.tiles.length, 12);
  for (const [id, {rect, feather = [14, 12]}] of Object.entries(cityDetails)) {
    const [x, y, w, h] = rect, stop = id === 'puntoes' ? mobileTourHub : mobileTourBuildings[id];
    assert.ok(x >= 0 && y >= 0 && x + w <= 941 && y + h <= 1672, `${id}: in V13 bounds`);
    const [cx, cy] = [stop.center[0] * 941 / 100, stop.center[1] * 1672 / 100];
    const [bw, bh] = [stop.size[0] * 941 / 100, stop.size[1] * 1672 / 100];
    // The complete calibrated building lies inside the opaque mask plateau.
    assert.ok(cx - bw / 2 >= x + w * feather[0] / 100 - 1 && cx + bw / 2 <= x + w * (1 - feather[0] / 100) + 1, `${id}: horizontal feather excludes building`);
    assert.ok(cy - bh / 2 >= y + h * feather[1] / 100 - 1 && cy + bh / 2 <= y + h * (1 - feather[1] / 100) + 1, `${id}: vertical feather excludes building`);
    const p = provenance.tiles.find(tile => tile.id === id);
    assert.deepEqual([p.source_crop.left, p.source_crop.top, p.source_crop.width, p.source_crop.height], rect);
    assert.ok(p.native_width > w && p.native_height > h);
    const file = await fs.readFile(new URL(`../src/section-two/assets/${cityDetails[id].url.split('/').at(-1)}`, import.meta.url));
    assert.equal(file.length, p.asset_bytes);
    const hash = createHash('sha256').update(file).digest('hex');
    assert.equal(hash, p.asset_sha256);
    if (approvedHashes[id]) assert.equal(hash, approvedHashes[id], `${id}: reviewed detail texture stays byte-for-byte intact`);
  }
});

test('lazy requests, active layer priority, full campus detail and failed-image fallback', () => {
  const oldDocument = globalThis.document;
  const images = [], requests = [];
  globalThis.document = {createElement: () => {
    const listeners = {};
    const image = {style: {}, dataset: {}, addEventListener: (name, fn) => {listeners[name] = fn;}, fire: name => listeners[name](), remove() {this.removed = true;}, set src(url) {requests.push(url);}};
    images.push(image); return image;
  }};
  try {
    const core = {prepend: image => {image.parent = core;}};
    const controller = createCityDetail(core), find = id => images.find(image => image.dataset.client === id);
    assert.equal(requests.length, 0);
    controller.update({active: false, camera: {zoom: 4}, current: 'bbva', next: 'naturgy'});
    assert.equal(requests.length, 0, 'desktop/inactive never downloads detail');
    controller.update({active: true, camera: {zoom: 1.5}, current: 'puntoes', next: 'bbva'});
    assert.equal(requests.length, 2);
    find('puntoes').fire('load'); find('bbva').fire('load');
    controller.update({active: true, camera: {zoom: 3}, current: 'puntoes', next: 'bbva', now: performance.now() + 250});
    assert.equal(find('puntoes').style.opacity, 1, 'the office uses one opaque source from its first frame');
    assert.ok(find('bbva').style.opacity > .4 && find('bbva').style.opacity < .6, 'other detail still fades in over 500ms');
    controller.update({active: true, camera: {zoom: 3}, current: 'puntoes', next: 'bbva', now: performance.now() + 600});
    assert.equal(find('puntoes').style.opacity, 1);
    assert.ok(+find('puntoes').style.zIndex > +find('bbva').style.zIndex);
    controller.update({active: true, camera: {zoom: 3}, current: 'bbva', next: 'naturgy', now: performance.now() + 600});
    assert.equal(requests.length, 3);
    assert.ok(+find('bbva').style.zIndex > +find('puntoes').style.zIndex, 'loaded overlapping neighbour cannot cover current building');
    find('naturgy').fire('error');
    controller.update({active: true, camera: {zoom: 3}, current: 'naturgy', next: 'siemens'});
    assert.equal(find('naturgy').removed, true); assert.equal(find('naturgy').style.opacity, 0);
    find('siemens').fire('load');
    for (const [viewportWidth, viewportHeight] of [[320, 568], [390, 844], [430, 932]]) {
      const width = Math.max(viewportWidth, viewportHeight * 941 / 1672) * 1.04;
      const zoom = mobileBuildingView(mobileTourBuildings.siemens, {width, height: width * 1672 / 941, viewportWidth, viewportHeight}).zoom;
      controller.update({active: true, camera: {zoom}, current: 'siemens', now: performance.now() + 600});
      assert.equal(find('siemens').style.opacity, 1, 'campus needs full detail at its wider final framing');
    }
    assert.equal(requests.length, 4, 'repeat visits are cached; failed tile is not retried every frame');
    assert.ok(images.every(image => image.parent === core && !image.style.transform), 'all layers inherit the single world transform');
    controller.update({active: false, camera: {zoom: 1}});
    assert.ok(images.every(image => image.style.opacity === 0));
  } finally {globalThis.document = oldDocument;}
});

test('Puntoes is prepared once, decoded before reveal, and stays identical throughout zoom', async () => {
  const oldDocument = globalThis.document;
  const images = [], requests = [];
  let finishDecode;
  globalThis.document = {createElement: () => {
    const listeners = {};
    const image = {style: {}, dataset: {}, addEventListener: (name, fn) => {listeners[name] = fn;},
      fire: name => listeners[name](), remove() {this.removed = true;},
      set src(url) {this.url = url; requests.push(url);}};
    images.push(image); return image;
  }};
  try {
    const controller = createCityDetail({prepend() {}});
    const office = images.find(image => image.dataset.client === 'puntoes');
    office.decode = () => new Promise(resolve => {finishDecode = resolve});
    assert.equal(requests.length, 0, 'construction/desktop alone requests no tiles');
    const preparation = controller.preparePuntoes();
    assert.equal(controller.preparePuntoes(), preparation, 'preparation is cached');
    assert.equal(requests.length, 1, 'approaching the mobile map prepares only Puntoes');
    office.fire('load');
    assert.equal(controller.isPuntoesSettled(), false, 'load alone does not expose an undecoded office');
    finishDecode();
    assert.equal(await preparation, true);
    assert.equal(controller.isPuntoesSettled(), true);
    const url = office.url;
    for (const zoom of [1.5, 1.7, 2, 2.3, 4, 1.5]) {
      controller.update({active: false, visible: true, camera: {zoom}, current: 'puntoes', now: performance.now()});
      assert.equal(office.style.opacity, 1, 'intro opacity and zoom never blend a second office');
      assert.equal(office.url, url, 'the same texture follows the whole camera journey');
    }
    assert.equal(requests.length, 1, 'a visible intro does not preload every other client');
    controller.update({active: false, camera: {zoom: 1.5}});
    assert.equal(office.style.opacity, 0, 'desktop still hides mobile-only art');
  } finally {globalThis.document = oldDocument;}
});

test('failed Puntoes preparation settles to the static fallback without retries', async () => {
  const oldDocument = globalThis.document;
  const images = [], requests = [];
  globalThis.document = {createElement: () => {
    const listeners = {};
    const image = {style: {}, dataset: {}, addEventListener: (name, fn) => {listeners[name] = fn;},
      fire: name => listeners[name](), remove() {this.removed = true;},
      decode: () => Promise.reject(new Error('decode failed')),
      set src(url) {requests.push(url);}};
    images.push(image); return image;
  }};
  try {
    const controller = createCityDetail({prepend() {}});
    const office = images.find(image => image.dataset.client === 'puntoes');
    const preparation = controller.preparePuntoes();
    office.fire('load');
    assert.equal(await preparation, false);
    assert.equal(controller.isPuntoesSettled(), true, 'failure releases map readiness');
    assert.equal(office.removed, true);
    controller.update({active: true, visible: true, camera: {zoom: 3}, current: 'puntoes'});
    assert.equal(office.style.opacity, 0);
    assert.equal(controller.preparePuntoes(), preparation);
    assert.equal(requests.length, 1, 'failed source is not requested again on every frame');
  } finally {globalThis.document = oldDocument;}
});
