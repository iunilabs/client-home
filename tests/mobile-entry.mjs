import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const base = process.env.PUNTOES_URL || 'http://127.0.0.1:4303/client-home/';
const out = resolve(process.env.PUNTOES_EVIDENCE_DIR || 'test-results/mobile-entry');
await mkdir(out, {recursive: true});
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const report = {url: base, checks: [], errors: []};
async function swipe(page, {y, dy, steps, delay}) {
  const session = await page.context().newCDPSession(page), x = page.viewportSize().width / 2;
  await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
  for (let n = 1; n <= steps; n++) {
    await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y - dy * n / steps}]});
    await page.waitForTimeout(delay);
  }
  await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await session.detach();
}
async function home(page) {
  await page.keyboard.press('Home');
  await page.waitForFunction(() => scrollY === 0 && !window.__puntoes.getState().city.tour.active);
}
try {
  for (const viewport of [{width: 320, height: 568}, {width: 390, height: 844}, {width: 430, height: 932}]) {
    const page = await browser.newPage({viewport, isMobile: true, hasTouch: true});
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(base + '#confianza');
    await page.waitForFunction(() => window.__puntoes?.getState().city?.ready && window.__puntoes.getState().city.tour.active);
    await page.waitForTimeout(200);
    const anchor = await page.evaluate(() => scrollY);
    const cases = [
      {name: 'slow-native-entry', distance: 145, y: Math.min(500, viewport.height - 30), dy: 335, steps: 28, delay: 16},
      {name: 'long-fast-entry', distance: 40, y: viewport.height - 30, dy: viewport.height - 100, steps: 28, delay: 5},
      {name: 'long-faster-entry', distance: 40, y: viewport.height - 30, dy: viewport.height - 100, steps: 8, delay: 1},
      {name: 'short-crossing-entry', distance: 40, y: viewport.height - 30, dy: 170, steps: 16, delay: 12},
    ];
    for (const gesture of cases) {
      await home(page);
      await page.evaluate(({anchor, distance}) => scrollTo({top: anchor - distance, behavior: 'instant'}), {anchor, distance: gesture.distance});
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => window.__puntoes.getState().city.tour.active), false);
      await swipe(page, gesture);
      await page.waitForTimeout(800);
      const samples = [];
      for (let n = 0; n < 6; n++) {
        const sample = await page.evaluate(() => ({scrollY, tour: window.__puntoes.getState().city.tour}));
        samples.push(sample);
        assert.ok(Math.abs(sample.scrollY - anchor) < 2, JSON.stringify({gesture, anchor, sample}));
        assert.equal(sample.tour.active, true); assert.equal(sample.tour.currentId, 'puntoes');
        await page.waitForTimeout(100);
      }
      report.checks.push({width: viewport.width, name: gesture.name, anchor, samples});
      console.log(`✓ ${viewport.width}: ${gesture.name} retains scroll anchor ${anchor} and Puntoes`);
    }
    // Capturing the city must not interfere with the hands or explicit exits.
    await home(page); await swipe(page, {y: viewport.height / 2, dy: 100, steps: 12, delay: 15});
    await page.waitForTimeout(400);
    assert.ok(await page.evaluate(() => scrollY > 30 && !window.__puntoes.getState().city.tour.active));
    await page.getByRole('button', {name: 'Clientes', exact: true}).tap();
    await page.waitForFunction(() => window.__puntoes.getState().city.tour.active);
    await page.getByRole('button', {name: /^Anterior:/}).tap();
    await page.waitForFunction(() => !window.__puntoes.getState().city.tour.active);
    const handoff = await page.evaluate(() => window.__puntoes.getState().handoffStart);
    assert.ok(Math.abs((await page.evaluate(() => scrollY)) - handoff) < 2);
    await page.getByRole('button', {name: 'Clientes', exact: true}).tap();
    await page.waitForFunction(() => window.__puntoes.getState().city.tour.active);
    await page.getByRole('link', {name: 'El encuentro', exact: false}).tap();
    await page.waitForFunction(() => !window.__puntoes.getState().city.tour.active);
    await page.waitForTimeout(1400);
    assert.ok(Math.abs((await page.evaluate(() => scrollY)) - handoff) < 2);
    report.checks.push({width: viewport.width, name: 'native-hands-and-explicit-exits'});
    await page.close();
  }
  assert.deepEqual(report.errors, []);
} catch (error) {report.failure = error.stack; process.exitCode = 1; console.error(error)}
finally {
  await writeFile(resolve(out, 'RESULTS.json'), JSON.stringify(report, null, 2));
  await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 3000))]);
}
process.exit(process.exitCode || 0);
