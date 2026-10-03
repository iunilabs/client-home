import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {cityPanBounds} from '../src/section-two/city-pan.js';

const base = process.env.CITY_FOCUS_URL || 'http://127.0.0.1:5188/';
const out = process.env.CITY_FOCUS_OUT || 'docs/desktop-map-navigation';
await fs.mkdir(out, {recursive: true});
const browser = await chromium.launch({channel: 'chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const expectedZooms = new WeakMap();
const report = {passed: false, views: [], errors: []};
async function ready(page) {
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(base + '?city=.5');
  await page.waitForFunction(() => window.__puntoes?.getState().city?.ready && !document.querySelector('.city-carousel').inert);
}
async function select(page, id) {
  const logo = page.locator(`.city-client[data-client="${id}"]`);
  await page.keyboard.press('Tab'); await logo.focus();
  const zoom = await page.evaluate(() => window.__puntoes.getState().city.focus?.camera.zoom);
  await logo.click({timeout: 6000});
  if (zoom !== undefined) expectedZooms.set(page,zoom);
}
async function arrival(page, id) {
  await page.waitForFunction(id => {
    const focus = window.__puntoes.getState().city.focus;
    return focus?.client === id && !focus.moving;
  }, id);
}
async function check(page, id) {
  await arrival(page, id);
  const measured = await page.evaluate(id => {
    const card = document.querySelector('.city-tour-card.is-current'), r = card.getBoundingClientRect();
    const deck = card.parentElement.getBoundingClientRect();
    const world = document.querySelector('.city-world');
    const origin = world.style.transformOrigin.split(' ').map(parseFloat);
    const layout = {width:parseFloat(world.style.width),height:parseFloat(world.style.height),originX:origin[0]/100,originY:origin[1]/100,viewportWidth:document.documentElement.clientWidth,viewportHeight:innerHeight};
    const pin = document.querySelector(`.city-building[data-client="${id}"] .city-pin`).getBoundingClientRect();
    return {id, layout, width: innerWidth, height: innerHeight, camera: window.__puntoes.getState().city.focus.camera,
      current: card.dataset.client, card: {left: r.left, top: r.top, right: r.right, bottom: r.bottom},
      pin: {x: (pin.left + pin.right) / 2, y: (pin.top + pin.bottom) / 2},
      target: {x: (deck.right + 24 + document.documentElement.clientWidth - 32) / 2, y: innerHeight * .44},
      body: getComputedStyle(card.querySelector('.tour-card-intro')).fontSize,
      buttonHeight: card.querySelector('a').getBoundingClientRect().height,
      popup: Boolean(document.querySelector('#city-case'))};
  }, id);
  if (expectedZooms.has(page)) assert.ok(Math.abs(measured.camera.zoom-expectedZooms.get(page))<.001, 'selecting a client must not zoom');
  assert.equal(measured.current, id); assert.equal(measured.popup, false);
  assert.ok(measured.camera.zoom >= 1 && measured.camera.zoom <= 1.5); assert.equal(measured.body, '16px');
  assert.ok(measured.buttonHeight >= 47.9);
  const bounds = cityPanBounds({...measured.layout, zoom:measured.camera.zoom});
  for (const [axis,min,max] of [['x',bounds.minX,bounds.maxX],['y',bounds.minY,bounds.maxY]]) {
    const distance = measured.target[axis] - measured.pin[axis];
    assert.ok(Math.abs(distance)<2 || Math.abs(measured.camera[axis]-(distance>0?max:min))<2, 'building is centred as far as artwork coverage permits: '+JSON.stringify(measured));
  }
  assert.ok(measured.card.top > 80 && measured.card.bottom < measured.height - 150);
  report.views.push(measured);
}
try {
  const page = await browser.newPage({viewport: {width: 1424, height: 873}});
  await ready(page); const overview = await page.evaluate(() => window.__puntoes.getState().city.focus.camera);
  await select(page, 'bbva'); await check(page, 'bbva');
  await page.screenshot({path: `${out}/desktop-inline-bbva.png`});
  await select(page, 'cepsa'); await page.waitForTimeout(180);
  const moving = await page.evaluate(() => window.__puntoes.getState().city.focus);
  assert.equal(moving.moving, true);
  await select(page, 'mapfre'); await check(page, 'mapfre');
  await page.keyboard.press('Escape'); await arrival(page, null);
  // The invitation is a roof marker; clients use both roofs and the logo strip.
  await page.mouse.move(600, 300); await page.mouse.down();
  await page.mouse.move(1200, 550, {steps: 15}); await page.mouse.up();
  const invitationOverview = await page.evaluate(() => window.__puntoes.getState().city.focus.camera);
  await page.locator('.city-building[data-client="collaborate"] .city-pin').click();
  await check(page, 'collaborate');
  await page.screenshot({path: `${out}/desktop-inline-collaborate.png`});
  await page.locator('.city-tour-card.is-current .tour-card-close').click();
  await arrival(page, null);
  const restored = await page.evaluate(() => ({camera: window.__puntoes.getState().city.focus.camera,
    current: document.querySelector('.city-tour-card.is-current'), opener: document.activeElement.matches('.city-pin,.city-client')}));
  assert.equal(restored.current, null); assert.equal(restored.opener, true);
  assert.ok(Math.abs(restored.camera.zoom - overview.zoom) < .01);
  assert.equal(restored.camera.x, invitationOverview.x); assert.equal(restored.camera.y, invitationOverview.y);
  await select(page, 'sabadell'); await check(page, 'sabadell');
  expectedZooms.delete(page);
  await page.setViewportSize({width: 900, height: 600});
  await page.waitForFunction(() => window.__puntoes.getState().city.focus?.moving);
  await check(page, 'sabadell');
  await page.screenshot({path: `${out}/desktop-inline-900.png`});
  const point = await page.evaluate(() => {
    for (let y = 150; y < 450; y += 60) for (let x = 480; x < 850; x += 60)
      if (document.elementFromPoint(x, y)?.closest('.city-drag-surface')) return {x, y};
  });
  assert.ok(point);
  const before = await page.evaluate(() => window.__puntoes.getState().city.focus.camera);
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x + 50, point.y + 30, {steps: 8}); await page.mouse.up();
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => window.__puntoes.getState().city.focus.camera);
  assert.ok(Math.abs(after.x - before.x) > 30, 'focused map remains draggable');
  await page.keyboard.press('Escape'); await arrival(page, null);
  assert.equal(await page.locator('.city-tour-card.is-current').count(), 0);
  await page.close();
  const reduced = await browser.newPage({viewport: {width: 1424, height: 873}, reducedMotion: 'reduce'});
  await ready(reduced); await select(reduced, 'mediaset'); await check(reduced, 'mediaset');
  await reduced.keyboard.press('Escape'); await arrival(reduced, null); await reduced.close();
  const mobile = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  await ready(mobile); await select(mobile, 'bbva');
  await mobile.waitForFunction(() => {
    const tour = window.__puntoes.getState().tour;
    return tour.currentId === 'bbva' && !tour.moving && document.querySelector('.city-tour-card.is-current')?.dataset.client === 'bbva';
  });
  assert.equal(await mobile.locator('.city-tour-card.is-current .tour-card-close').isVisible(), false);
  assert.equal(await mobile.locator('.city-tour-card.is-current .tour-card-intro').evaluate(el => getComputedStyle(el).fontSize), '16px');
  await mobile.screenshot({path: `${out}/mobile-shared-bbva.png`});
  await mobile.close();
  assert.deepEqual(report.errors, []); report.passed = true;
  console.log(JSON.stringify({passed: true, views: report.views.map(({id, width, height, camera}) => ({id, width, height, zoom: camera.zoom})), errors: report.errors}));
} catch (error) {report.error = error.stack; process.exitCode = 1; console.error(error)}
finally {await fs.writeFile(`${out}/desktop-inline-report.json`, JSON.stringify(report, null, 2)); await browser.close()}
