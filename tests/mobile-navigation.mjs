import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const base = process.env.PUNTOES_URL || 'http://127.0.0.1:4301/';
const out = resolve(process.env.PUNTOES_EVIDENCE_DIR || 'test-results/mobile-navigation');
await mkdir(out, {recursive: true});
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const report = {url: base, checks: [], captures: [], errors: []};
const check = message => {report.checks.push(message); console.log('✓', message)};
const tour = page => page.evaluate(() => window.__puntoes.getState().city.tour);
async function settled(page, id) {
  await page.waitForFunction(id => {
    const state = window.__puntoes?.getState().city?.tour;
    return state?.active && state.currentId === id && !state.transition;
  }, id, {timeout: 15000});
}
async function ready(page, hash = true) {
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(`${base}${hash ? '#confianza' : '?city=0.2'}`);
  await page.waitForFunction(() => window.__puntoes?.getState().city?.ready);
  await settled(page, 'puntoes');
  const copy = await page.locator('.city-copy').boundingBox();
  const controls = await page.locator('.city-tour-controls').boundingBox();
  assert.ok(copy.y + copy.height < controls.y, 'Puntoes introduction stays above navigation');
}
async function capture(page, name) {
  await page.screenshot({path: `${out}/${name}.png`});
  report.captures.push({name, viewport: page.viewportSize(), state: await page.evaluate(() => window.__puntoes.getState().city)});
}
async function swipe(page, {x = page.viewportSize().width / 2, y = 200, dx = 0, dy = 110, steps = 12, delay = 15} = {}) {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
  for (let i = 1; i <= steps; i++) {
    await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x - dx * i / steps, y: y - dy * i / steps}]});
    await page.waitForTimeout(delay);
  }
  await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await session.detach();
}
async function next(page, id) {
  await page.locator('.city-tour-controls button').last().click(); await settled(page, id);
}
async function visit(page, id) {
  const logo = page.locator(`.city-client[data-client="${id}"]`);
  await logo.focus(); await logo.click(); await settled(page, id);
}
async function oneCard(page, id) {
  const cards = await page.locator('.city-tour-card').evaluateAll(cards => cards.filter(card => getComputedStyle(card).visibility === 'visible').map(card => ({id: card.dataset.client, inert: card.inert, rect: card.getBoundingClientRect().toJSON()})));
  assert.equal(cards.length, 1); assert.equal(cards[0].id, id); assert.equal(cards[0].inert, false);
  assert.ok(cards[0].rect.top >= page.viewportSize().height * .37);
  const controls = await page.locator('.city-tour-controls').boundingBox();
  assert.ok(cards[0].rect.bottom < controls.y);
  if (id === 'collaborate') {
    const contact = await page.locator('.city-tour-card.is-current .tour-card-contact').boundingBox();
    assert.ok(contact.y + contact.height <= cards[0].rect.bottom);
  }
}
try {
  for (const viewport of [{width: 320, height: 568}, {width: 390, height: 844}, {width: 430, height: 932}]) {
    const page = await browser.newPage({viewport, isMobile: true, hasTouch: true});
    await ready(page);
    assert.equal(await page.locator('.city-client').count(), 10);
    assert.equal(await page.locator('.city-tour-card').count(), 11);
    const anchor = await page.evaluate(() => scrollY);
    // A deliberately slow gesture with 3px samples must still work without
    // yielding to native page scroll before the axis/threshold is established.
    await swipe(page, {dy: 90, steps: 30, delay: 18}); await settled(page, 'bbva');
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - anchor) < 2);
    await oneCard(page, 'bbva'); await capture(page, `${viewport.width}-bbva`);
    await swipe(page, {dy: 35}); await page.waitForTimeout(300);
    assert.equal((await tour(page)).currentId, 'bbva');
    await swipe(page, {dy: 20, dx: 100}); await page.waitForTimeout(300);
    assert.equal((await tour(page)).currentId, 'bbva');
    await swipe(page); await settled(page, 'naturgy');
    await oneCard(page, 'naturgy'); await capture(page, `${viewport.width}-naturgy`);
    await next(page, 'sabadell'); await oneCard(page, 'sabadell');
    await capture(page, `${viewport.width}-sabadell`);
    // Actual wheel events and a long decaying tail, beyond the camera duration.
    await page.mouse.move(viewport.width / 2, 160);
    await page.mouse.wheel(0, 160);
    for (let i = 0; i < 24; i++) {await page.waitForTimeout(60); await page.mouse.wheel(0, Math.max(1, 80 - i * 4))}
    await settled(page, 'collaborate');
    assert.equal((await tour(page)).active, true);
    await oneCard(page, 'collaborate'); await capture(page, `${viewport.width}-collaborate`);
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, 100);
    await page.waitForFunction(() => !window.__puntoes.getState().city.tour.active);
    assert.ok(await page.evaluate(() => document.body.classList.contains('next-active')));
    // Native re-entry from below retains a deterministic last guided stop.
    await page.evaluate(() => {const top = document.querySelector('#confianza').offsetTop; scrollTo({top: top + innerHeight * .6 + 90, behavior: 'instant'})});
    await settled(page, 'collaborate');
    await page.locator('.city-tour-controls button').first().click(); await settled(page, 'sabadell');
    await page.locator('.city-tour-controls button').first().click(); await settled(page, 'naturgy');
    await page.locator('.city-tour-controls button').first().click(); await settled(page, 'bbva');
    await visit(page, 'cepsa');
    assert.equal((await tour(page)).nextId, 'naturgy');
    const current = page.locator('.city-tour-card.is-current');
    await current.locator('summary').click();
    await page.waitForFunction(() => window.__puntoes.getState().city.tour.reading);
    const rect = await current.boundingBox();
    // Reading starts on the header, not only in the story text.
    await swipe(page, {x: rect.x + rect.width / 2, y: rect.y + 55, dy: 80});
    await page.waitForTimeout(350);
    assert.equal((await tour(page)).currentId, 'cepsa');
    assert.equal((await tour(page)).reading, true);
    assert.equal(await current.locator('details').getAttribute('open'), '');
    assert.ok(await current.evaluate(card => card.scrollTop > 0));
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height - 30);
    await page.mouse.wheel(0, 1000);
    await page.waitForFunction(() => {const card = document.querySelector('.city-tour-card.is-current'); return card.scrollTop + card.clientHeight >= card.scrollHeight - 2});
    await swipe(page, {x: rect.x + rect.width / 2, y: rect.y + rect.height - 30, dy: 80});
    assert.equal((await tour(page)).currentId, 'cepsa');
    assert.equal((await tour(page)).reading, true);
    await page.mouse.move(viewport.width / 2, 160); await page.mouse.wheel(0, 300);
    await page.waitForTimeout(350); assert.equal((await tour(page)).currentId, 'cepsa');
    await capture(page, `${viewport.width}-cepsa-reading`);
    await next(page, 'naturgy');
    assert.equal((await tour(page)).reading, false);
    await visit(page, 'sabadell'); assert.equal((await tour(page)).nextId, 'collaborate');
    await next(page, 'collaborate'); await visit(page, 'cepsa');
    assert.equal(await page.locator('.city-tour-card.is-current').evaluate(card => card.scrollTop), 0, 'a new visit starts at the case heading');
    assert.equal((await tour(page)).nextId, 'section3');
    await page.locator('.city-tour-controls button').last().click();
    await page.waitForFunction(() => !window.__puntoes.getState().city.tour.active);
    assert.equal((await tour(page)).currentId, 'cepsa');
    check(`${viewport.width}×${viewport.height}: slow/short/horizontal touch, wheel inertia, 4 stops, unique readable card, reading, manual continuation and both chapter directions`);
    await page.close();
  }
  const page = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  await ready(page);
  const carousel = page.locator('.city-carousel-viewport');
  await carousel.evaluate(element => {element.scrollLeft = 0});
  const before = await carousel.evaluate(element => element.scrollLeft);
  await swipe(page, {x: 300, y: 810, dx: 180, dy: 10});
  assert.ok(await carousel.evaluate(element => element.scrollLeft) > before + 100);
  assert.equal((await tour(page)).currentId, 'puntoes');
  await page.waitForTimeout(650); // Existing carousel suppresses accidental taps after a swipe.
  for (const id of ['bbva', 'canal', 'cepsa', 'mapfre', 'ree', 'siemens', 'naturgy', 'sabadell', 'mediaset', 'accenture', 'bbva']) {
    await visit(page, id); await oneCard(page, id);
  }
  assert.equal(await page.locator('.city-client').count(), 10);
  assert.equal(await page.locator('.city-tour-card').count(), 11);
  await page.locator('.city-tour-controls button').first().focus();
  await page.keyboard.press('Enter'); await settled(page, 'puntoes');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !window.__puntoes.getState().city.tour.active);
  await capture(page, '390-return-hands');
  // Links, direct hash and history reset the chapter cursor explicitly.
  await page.getByRole('button', {name: 'Clientes', exact: true}).click(); await settled(page, 'puntoes');
  await next(page, 'bbva');
  await page.getByRole('link', {name: 'El encuentro', exact: false}).click();
  await page.waitForFunction(() => !window.__puntoes.getState().city.tour.active);
  await page.goBack(); await settled(page, 'puntoes');
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.body.classList.contains('next-active'));
  await page.keyboard.press('Home'); await page.waitForFunction(() => scrollY === 0);
  await page.waitForFunction(() => !window.__puntoes.getState().city.tour.active);
  const entryAnchor = await page.evaluate(() => document.querySelector('#confianza').offsetTop + innerHeight * .35 + 90);
  await page.evaluate(y => scrollTo({top: y - 150, behavior: 'instant'}), entryAnchor);
  await page.waitForTimeout(500);
  await page.mouse.move(195, 200); await page.mouse.wheel(0, 1800);
  for (let i = 0; i < 20; i++) {await page.waitForTimeout(60); await page.mouse.wheel(0, 10)}
  await settled(page, 'puntoes');
  await page.keyboard.press('Home'); await page.waitForFunction(() => scrollY === 0);
  await page.waitForFunction(() => !window.__puntoes.getState().city.tour.active);
  await page.evaluate(y => scrollTo({top: y - 140, behavior: 'instant'}), entryAnchor);
  await page.waitForTimeout(500);
  await swipe(page, {y: 500, dy: 336, steps: 28, delay: 16});
  await settled(page, 'puntoes');
  check('Long wheel and native touch entry finish at Puntoes, with the remaining gesture consumed');
  check('Ten manually visitable logos, single case per client, horizontal carousel, keyboard, return to hands, fragment links and browser history');
  await page.close();

  const reduced = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, reducedMotion: 'reduce'});
  await ready(reduced); await visit(reduced, 'bbva');
  await reduced.locator('.city-tour-controls button').last().click();
  // Wait for a rendered frame after the 100ms fade; a fixed sleep can read
  // the preceding frame when software rendering is busy.
  await reduced.waitForFunction(() => {const t = window.__puntoes.getState().city.tour; return t.currentId === 'naturgy' && !t.transition}, null, {timeout: 600});
  assert.equal((await tour(reduced)).currentId, 'naturgy');
  assert.equal((await tour(reduced)).transition, false);
  await capture(reduced, '390-reduced-motion'); await reduced.close();
  check('Reduced motion: no camera flight, card settles in 100ms');

  const desktop = await browser.newPage({viewport: {width: 1440, height: 900}});
  desktop.on('pageerror', error => report.errors.push(error.message));
  await desktop.goto(`${base}?city=0.5`);
  await desktop.waitForFunction(() => window.__puntoes?.getState().city?.ready && document.querySelector('.city-carousel').inert === false);
  assert.equal(await desktop.locator('.city-client').count(), 10);
  const logo = desktop.locator('.city-client[data-client="bbva"]');
  await logo.focus(); await logo.click();
  assert.equal(await desktop.locator('#city-case').evaluate(dialog => dialog.open), true);
  await desktop.keyboard.press('Escape');
  assert.equal(await desktop.locator('#city-case').evaluate(dialog => dialog.open), false);
  assert.equal(await desktop.locator('.city-tour-controls').isVisible(), false);
  await capture(desktop, 'desktop-city'); await desktop.close();
  check('Desktop city: ten logos, original case dialog, no mobile controls');
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) {
  report.failure = error.stack; console.error(error); process.exitCode = 1;
  for (const context of browser.contexts()) for (const page of context.pages()) {
    report.failedState = await page.evaluate(() => window.__puntoes?.getState()).catch(() => null);
    await page.screenshot({path: `${out}/failure.png`}).catch(() => {});
    console.error('Failed state', JSON.stringify(report.failedState?.city));
  }
} finally {
  await writeFile(`${out}/RESULTS.json`, JSON.stringify(report, null, 2));
  // Bound Chrome teardown after persisting the assertion report.
  await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 3000))]);
}

process.exit(process.exitCode || 0);
