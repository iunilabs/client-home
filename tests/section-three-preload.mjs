import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const origin = process.env.SECTION3_URL || 'http://127.0.0.1:4318/';
const browser = await chromium.launch({headless: true, channel: 'chrome'});
try {
  const context = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce'});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext, canvases = new Set();
    window.__webglContexts = () => canvases.size;
    HTMLCanvasElement.prototype.getContext = function(type, options) {
      const result = original.call(this, type, options);
      if (result && /^(webgl|webgl2|experimental-webgl)$/.test(type)) canvases.add(this);
      return result;
    };
  });
  await page.goto(origin + '?city=.1&capture=1');
  await page.waitForFunction(() => window.__puntoes?.getState().city?.ready && window.__puntoes.getState().paper?.prepared && window.__puntoes.getState().render === 'webgl', null, {timeout: 60000});
  const contexts = await page.evaluate(() => window.__webglContexts());
  const preparation = await page.evaluate(() => {
    window.__original3DCanvas = document.querySelector('#scene canvas');
    return window.__puntoes.getState().paper;
  });
  assert.equal(preparation.active, false, 'preparation happens during the city, before papers become visible');
  assert.equal(preparation.preparation.sharedRenderer, true);
  assert.equal(preparation.preparation.pendingTextures, 47);
  assert.equal(preparation.preparation.completedTextures, 47);
  assert.equal(preparation.preparation.shadersReady, true);
  assert.ok(preparation.preparation.yields > 0, 'construction yields to gestures and rendering');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  await page.evaluate(() => {
    window.__entryStart = performance.now();
    location.hash = '#posibilidades';
  });
  await page.waitForFunction(() => window.__puntoes.getState().paper.active);
  const entryMs = await page.evaluate(() => {
    const elapsed = performance.now() - window.__entryStart;
    if (document.querySelector('[data-paper-canvas]') !== window.__original3DCanvas) throw new Error('3D canvas was recreated');
    const {start,chaosRange} = window.__puntoes.getState().paper.journey;
    scrollTo(0, start + chaosRange * .1);
    return Math.round(elapsed);
  });
  await page.waitForFunction(() => window.__puntoes.getState().paper.visibleItems === 1);
  await page.evaluate(() => {
    window.__resolutionStart = performance.now();
    const {start,chaosRange,workflowRange} = window.__puntoes.getState().paper.journey;
    scrollTo(0, start + chaosRange + workflowRange * .97);
  });
  await page.waitForFunction(() => window.__puntoes.getState().paper.resolution.completed === 47);
  const resolutionMs = await page.evaluate(() => Math.round(performance.now() - window.__resolutionStart));
  if (process.env.SECTION3_PRELOAD_SCREENSHOT) await page.screenshot({path: process.env.SECTION3_PRELOAD_SCREENSHOT});
  assert.equal(await page.evaluate(() => window.__webglContexts()), contexts, 'sections three/four do not create another WebGL context');
  assert.deepEqual(await page.evaluate(() => window.__puntoes.getState().paper.preparation), preparation.preparation, 'section four creates no additional paper textures or models');
  await page.evaluate(() => {location.hash = '#inicio';});
  await page.waitForFunction(() => !window.__puntoes.getState().paper.active);
  assert.equal(await page.evaluate(() => document.querySelector('#scene canvas') === window.__original3DCanvas), true, 'returning to the intro restores its original canvas');
  await page.waitForFunction(() => window.__puntoes.getState().render === 'webgl');
  await page.evaluate(() => {location.hash = '#posibilidades';});
  await page.waitForFunction(() => window.__puntoes.getState().paper.active);
  assert.equal(await page.evaluate(() => document.querySelector('[data-paper-canvas]') === window.__original3DCanvas), true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({entryMs, resolutionMs, contexts, preparation: preparation.preparation, checks: 'preload, completed textures, CPU×4 entry, canvas handoff and reverse passed'}));
} catch (error) {console.error(error); process.exitCode = 1;}
finally {await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 3000))]); process.exit(process.exitCode || 0);}
