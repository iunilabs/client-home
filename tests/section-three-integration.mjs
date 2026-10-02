import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const origin = process.env.SECTION3_URL || 'http://127.0.0.1:5185/';
const output = process.env.SECTION3_OUTPUT || fileURLToPath(new URL('../docs/section-three-integration/', import.meta.url));
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true, channel: 'chrome'});
const errors = [], report = {origin};
const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
const page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
const state = () => page.evaluate(() => window.__puntoes.getState());
async function paperProgress(p) {
  await page.evaluate(p => {
    const section = document.querySelector('#posibilidades');
    scrollTo(0, section.offsetTop + (section.offsetHeight - innerHeight) * p);
  }, p);
  await page.waitForFunction(p => Math.abs(window.__puntoes.getState().paper?.progress - p) < .001, p);
}
try {
  await page.goto(origin + '?scroll=500');
  await page.waitForFunction(() => window.__puntoes?.getState().render === 'webgl', null, {timeout: 60000});
  assert.equal((await state()).paper, null, 'paper scene stays unloaded at section one');
  assert.equal(await page.locator('.header').count(), 1);
  assert.equal(await page.locator('#confianza + .paper-journey #posibilidades.paper-section').count(), 1);
  await page.screenshot({path: output + '01-hands.png'});
  console.log('Section one unchanged; paper scene loaded only near its section');

  await page.goto(origin + '?paper=.10&capture=1');
  await page.waitForFunction(() => window.__puntoes?.getState().paper?.visibleItems === 1, null, {timeout: 60000});
  await page.waitForFunction(() => Math.abs(window.__puntoes.getState().paper.progress - .10) < .001);
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('[data-paper-canvas]')).opacity) > .99);
  assert.equal((await state()).paper.firstSubject, 'Oye, ¿has conseguido automatizar eso? Lo necesitábamos ayer.');
  assert.equal((await state()).paper.firstEntryPixels, 80);
  await page.screenshot({path: output + '02-first-paper-desktop.png'});
  for (const [pixels, count] of [[79, 0], [81, 1], [499, 1], [501, 3]]) {
    const range = (await state()).paper.scrollRange;
    await paperProgress(pixels / range);
    await page.waitForTimeout(900);
    assert.equal((await state()).paper.visibleItems, count, `entrance at ${pixels} local pixels`);
  }
  await paperProgress(.60);
  const density = (await state()).paper;
  assert.equal(density.contentCount, 47); assert.equal(density.totalItems, 47);
  assert.equal(density.glass, 0); assert.equal(density.depthOfField, false);
  assert.equal(density.secondEntryPixels, 500);
  assert.ok(density.lastFallEndPixels < density.groupingPixels, 'all falls finish before grouping');
  assert.equal(density.visibleItems, 47);
  await paperProgress(.95); const grouped = (await state()).paper;
  assert.equal(grouped.visibleItems, density.visibleItems, 'no fourth wave during grouping');
  assert.ok(grouped.groupProgress > density.groupProgress);
  await page.screenshot({path: output + '07-grouped-papers.png'});
  await paperProgress(.60);
  await page.screenshot({path: output + '03-papers-desktop.png'});
  await paperProgress(.33); const forward = (await state()).paper.hero;
  await paperProgress(.9); await paperProgress(.33); const reverse = (await state()).paper.hero;
  for (const axis of ['position', 'rotation']) for (let i = 0; i < 3; i++) assert.ok(Math.abs(forward[axis][i] - reverse[axis][i]) < .02);
  console.log('New pain copy, 47 distinct subjects, reverse scroll and crisp rendering: passed');

  await page.goto(origin + '?paper=.33');
  await page.waitForFunction(() => window.__puntoes?.getState().paper?.progress > .329);
  await page.mouse.move(1120, 280); await page.waitForTimeout(700);
  const light = (await state()).paper;
  assert.ok(light.parallax.x > .3 && light.parallax.y > .2);
  assert.ok(light.cursorLight.intensity > 0);
  const corners = light.letterCorners; await page.waitForTimeout(1000);
  assert.ok((await state()).paper.letterCorners.some((v, i) => Math.abs(v - corners[i]) > .01));
  await page.evaluate(() => {
    dispatchEvent(new DeviceOrientationEvent('deviceorientation', {beta:20, gamma:0}));
    dispatchEvent(new DeviceOrientationEvent('deviceorientation', {beta:35, gamma:12}));
  });
  await page.waitForTimeout(700); assert.equal((await state()).paper.parallax.gyro.hasReading, true);
  console.log('Mouse light, parallax, idle paper flex and simulated gyro: passed');

  // Crossing the city exit must not create a gap or another fixed header.
  await page.evaluate(() => scrollTo(0, document.querySelector('#posibilidades').offsetTop - innerHeight * .5));
  await page.waitForTimeout(700);
  const seam = await page.evaluate(() => ({city: document.querySelector('.trust-frame').getBoundingClientRect().toJSON(), paper: document.querySelector('.paper-stage').getBoundingClientRect().toJSON()}));
  assert.ok(Math.abs(seam.city.bottom - seam.paper.top) < 3, JSON.stringify(seam));
  await page.screenshot({path: output + '04-city-to-papers.png'});
  await page.evaluate(() => scrollTo(0, document.querySelector('#posibilidades').offsetTop - innerHeight * 2));
  await page.waitForFunction(() => window.__puntoes.getState().paper.active === false);
  report.desktop = {firstSubject: density.firstSubject, items: density.totalItems, contiguousBoundary: seam};

  const mobileContext = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', e => errors.push(e.message));
  await mobile.goto(origin + '?paper=.10&capture=1');
  await mobile.waitForFunction(() => window.__puntoes?.getState().paper?.visibleItems === 1);
  // Native scroll positions round to whole pixels rather than exact fractions.
  await mobile.waitForFunction(() => Math.abs(window.__puntoes.getState().paper.progress - .10) < .001);
  await mobile.waitForFunction(() => Number(getComputedStyle(document.querySelector('[data-paper-canvas]')).opacity) > .99);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await mobile.evaluate(() => window.__puntoes.getState().paper.firstEntryPixels), 80);
  assert.equal(await mobile.locator('#posibilidades').evaluate(el => getComputedStyle(el).position), 'relative', 'direct paper query restores the complete native range');
  await mobile.screenshot({path: output + '05-first-paper-mobile.png'});
  await mobile.goto(origin + '?city=0');
  await mobile.waitForFunction(() => window.__puntoes?.getState().city?.ready && window.__puntoes.getState().tour.active);
  const cdp = await mobileContext.newCDPSession(mobile);
  async function waitForTourArrival(id) {
    await mobile.waitForFunction(expected => {
      const tour = window.__puntoes.getState().tour;
      const card = document.querySelector('.city-tour-card.is-current');
      return tour.active && tour.currentId === expected && !tour.moving &&
        (expected === 'puntoes' || card?.dataset.client === expected && !card.inert);
    }, id, {timeout: 6000});
    assert.ok(await mobile.evaluate(() => !window.__puntoes.getState().paper?.active), 'paper render is suspended during the guided city tour');
  }
  async function swipe(distance = 160, arrival = null) {
    const x = 195, y = 440;
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x, y, id:1}]});
    for (let i = 1; i <= 20; i++) {
      await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x, y:y-distance*i/20, id:1}]});
      await mobile.waitForTimeout(20);
    }
    await mobile.waitForTimeout(100);
    await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
    if (arrival) await waitForTourArrival(arrival);
    else await mobile.waitForTimeout(1150);
  }
  const tour = () => mobile.evaluate(() => ({y:scrollY, ...window.__puntoes.getState().tour}));
  await waitForTourArrival('puntoes');
  for (const id of ['bbva', 'naturgy', 'sabadell', 'collaborate']) await swipe(160, id);
  const before = (await tour()).y; await swipe(220);
  assert.ok((await tour()).y > before + 70, 'a new gesture leaves the city tour');
  await swipe(-250, 'collaborate'); assert.equal((await tour()).active, true);
  await swipe(); await swipe(600); await swipe(600);
  await mobile.waitForFunction(() => window.__puntoes.getState().paper?.active);
  await mobile.screenshot({path: output + '06-mobile-city-exit.png'});
  // Explicit destinations must restore the document extent before the jump.
  await mobile.goto(origin + '#posibilidades');
  await mobile.waitForFunction(() => window.__puntoes?.getState().paper?.active && Math.abs(scrollY - document.querySelector('#posibilidades').offsetTop) < 2);
  assert.equal(await mobile.locator('#posibilidades').evaluate(el => getComputedStyle(el).position), 'relative');
  assert.equal((await tour()).active, false);
  await mobile.goto(origin + '?city=0');
  await mobile.waitForFunction(() => window.__puntoes?.getState().city?.ready && window.__puntoes.getState().tour.active);
  await waitForTourArrival('puntoes');
  await mobile.locator('body').click({position:{x:195,y:180}});
  await mobile.keyboard.press('End');
  await mobile.waitForFunction(() => !window.__puntoes.getState().tour.active && window.__puntoes.getState().paper?.active && Math.abs(scrollY - (document.documentElement.scrollHeight - innerHeight)) < 2);
  report.mobile = {cityTourSequence:true, nativeExit:true, reverseReentry:true, noHorizontalOverflow:true, explicitPaperQuery:true, explicitPaperFragment:true, nativeEnd:true, hiddenPaperSuspended:true};
  console.log('Mobile: client itinerary, native exit into paper section and reverse reentry: passed');
  await mobileContext.close();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(origin + '?paper=.33');
  await page.waitForFunction(() => Math.abs(window.__puntoes?.getState().paper?.progress - .33) < .001);
  const reduced = (await state()).paper.letterCorners;
  await page.mouse.move(500, 200); await page.waitForTimeout(700);
  assert.deepEqual((await state()).paper.letterCorners, reduced);
  assert.equal((await state()).paper.cursorLight.intensity, 0);
  assert.deepEqual(errors, []); report.errors = errors; report.passed = true;
  await writeFile(output + 'report.json', JSON.stringify(report, null, 2) + '\n');
  console.log('Integration passed; reduced motion respected and no JS errors');
} catch(error) {console.error(error);process.exitCode=1;} finally {await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);process.exit(process.exitCode||0);}
