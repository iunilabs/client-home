import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const base = process.env.PUNTOES_URL || 'http://127.0.0.1:4303/client-home/';
const out = resolve(process.env.PUNTOES_EVIDENCE_DIR || 'test-results/mobile-motion');
await mkdir(out, {recursive: true});
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const report = {url: base, checks: [], errors: []};
const check = name => {report.checks.push(name); console.log('✓', name)};
const orientation = (page, beta, gamma) => page.evaluate(({beta, gamma}) =>
  dispatchEvent(new DeviceOrientationEvent('deviceorientation', {alpha: 0, beta, gamma})), {beta, gamma});
const geometry = page => page.evaluate(() => {
  const rect = selector => JSON.parse(JSON.stringify(document.querySelector(selector).getBoundingClientRect()));
  const matrix = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.city-world')).transform);
  return {x: matrix.m41, y: matrix.m42, copy: rect('.city-copy'), card: rect('.city-tour-card.is-current'),
    control: rect('.city-perspective-control'), client: window.__puntoes.getState().city.tour.currentId};
});
const fixed = (a, b) => {for (const key of ['copy', 'card', 'control', 'client']) assert.deepEqual(a[key], b[key])};
const disjoint = (a, b) => a.bottom <= b.top || b.bottom <= a.top || a.right <= b.left || b.right <= a.left;

try {
  for (const viewport of [{width: 320, height: 568}, {width: 390, height: 844}, {width: 430, height: 932}]) {
    const page = await browser.newPage({viewport, isMobile: true, hasTouch: true});
    page.on('pageerror', error => report.errors.push(error.message));
    await page.addInitScript(() => {
      window.__motionPermission = {mode: 'denied', trusted: []};
      Object.defineProperty(DeviceOrientationEvent, 'requestPermission', {configurable: true, value: async () => {
        window.__motionPermission.trusted.push(navigator.userActivation.isActive);
        return window.__motionPermission.mode;
      }});
    });
    await page.goto(base + '#confianza');
    await page.waitForFunction(() => window.__puntoes?.getState().city?.ready);
    await page.getByRole('button', {name: /^Siguiente:/}).tap();
    await page.waitForFunction(() => {const t = window.__puntoes.getState().city.tour; return t.currentId === 'bbva' && !t.transition});
    assert.equal(await page.locator('[data-scroll-meter]').isVisible(), false);
    await page.getByRole('button', {name: 'Activar movimiento', exact: true}).tap();
    await page.waitForFunction(() => document.querySelector('#confianza').dataset.cityPerspective === 'denied');
    assert.deepEqual(await page.evaluate(() => window.__motionPermission.trusted), [true]);
    const mutations = await page.evaluate(() => new Promise(resolve => {
      let count = 0;
      const observer = new MutationObserver(records => count += records.length);
      observer.observe(document.querySelector('.city-perspective-control'), {subtree: true, childList: true, characterData: true, attributes: true});
      setTimeout(() => {observer.disconnect(); resolve(count)}, 500);
    }));
    assert.equal(mutations, 0);
    await page.evaluate(() => window.__motionPermission.mode = 'granted');
    await page.getByRole('button', {name: 'Reintentar permiso', exact: true}).tap();
    await page.waitForTimeout(150);
    const layout = await page.evaluate(() => {
      const rect = selector => JSON.parse(JSON.stringify(document.querySelector(selector).getBoundingClientRect()));
      return {control: rect('.city-perspective-control'), header: rect('.header'), card: rect('.city-tour-card.is-current'), footer: rect('.city-carousel')};
    });
    assert.ok(layout.control.left >= 0 && layout.control.right <= viewport.width);
    for (const key of ['header', 'card', 'footer']) assert.ok(disjoint(layout.control, layout[key]), key);
    assert.equal(await page.getByRole('button', {name: 'Recentrar', exact: true}).isVisible(), true);
    await orientation(page, 30, 0); await page.waitForTimeout(300);
    const initial = await geometry(page);
    await orientation(page, 30, 20); await page.waitForTimeout(750);
    const horizontal = await geometry(page);
    assert.ok(horizontal.x - initial.x > 1);
    assert.ok(Math.abs(horizontal.y - initial.y) < .05); fixed(horizontal, initial);
    await page.getByRole('button', {name: 'Recentrar', exact: true}).tap();
    await orientation(page, 30, 0); await page.waitForTimeout(300);
    const neutral = await geometry(page);
    await orientation(page, 50, 0); await page.waitForTimeout(750);
    const vertical = await geometry(page);
    assert.ok(vertical.y - neutral.y < -1);
    assert.ok(Math.abs(vertical.x - neutral.x) < .05); fixed(vertical, neutral);
    assert.ok(Math.abs(vertical.y - neutral.y) <= Math.min(viewport.width, viewport.height) * .016 + .05);
    await page.screenshot({path: resolve(out, `${viewport.width}-sensor.png`)});
    await page.getByRole('button', {name: /^Siguiente:/}).tap();
    await page.waitForFunction(() => document.querySelector('#confianza').dataset.cityPerspective === 'paused');
    await orientation(page, 80, 40);
    await page.waitForFunction(() => !window.__puntoes.getState().city.tour.transition);
    await page.waitForFunction(() => document.querySelector('#confianza').dataset.cityPerspective === 'awaiting-sensor');
    await orientation(page, 80, 40); await page.waitForTimeout(200);
    await page.emulateMedia({reducedMotion: 'reduce'}); await page.waitForTimeout(150);
    assert.equal(await page.locator('.city-perspective-control').isVisible(), false);
    await page.getByRole('button', {name: /^Siguiente:/}).tap(); await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__puntoes.getState().city.tour.transition), false);
    check(`${viewport.width}: visible controls, stable denied state, trusted permission, gamma X / beta Y, fixed overlays, paused travel, reduced motion`);
    await page.close();
  }
  assert.deepEqual(report.errors, []);
} catch (error) {report.failure = error.stack; process.exitCode = 1}
finally {await writeFile(resolve(out, 'RESULTS.json'), JSON.stringify(report, null, 2)); await browser.close()}

process.exit(process.exitCode || 0);
