import {chromium, webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';

const base = process.env.MOBILE_SECTION_TWO_URL || 'http://127.0.0.1:4318/';
const out = process.env.MOBILE_SECTION_TWO_OUT || '../qa-reviews/2026-10-02/mobile-section2-fixes/regression';
await mkdir(out, {recursive: true});
const report = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({headless: true,
    ...(name === 'chromium' ? {args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      ...(process.platform === 'darwin' ? {executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {})} :
      process.env.MOBILE_SECTION_TWO_WEBKIT ? {executablePath: process.env.MOBILE_SECTION_TWO_WEBKIT} : {})});
  const context = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const cdp = name === 'chromium' ? await context.newCDPSession(page) : null;
  const tour = () => page.evaluate(() => window.__puntoes.getState().tour);
  async function load() {
    await page.goto(`${base}?city=0`);
    await page.waitForFunction(() => window.__puntoes?.getState().city.ready && window.__puntoes.getState().tour.active);
  }
  async function swipe(direction = 1, samples = 6) {
    const x = 190, y = direction > 0 ? 350 : 200;
    if (cdp) {
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y, id: 1}]});
      for (let i = 1; i <= samples; i++) {
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y - direction * 120 * i / samples, id: 1}]});
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    } else {
      // Playwright does not expose native WebKit swipes. Exercise its real
      // touch handlers with simulated events; native arbitration is covered
      // by Chromium. WebKit does not provide a public Touch constructor here.
      await page.evaluate(({x, y, direction, samples}) => {
        const target = document.elementFromPoint(x, y);
        const dispatch = (type, pointY, ended = false) => {
          const touch = {identifier: 1, target, clientX: x, clientY: pointY, pageX: x, pageY: scrollY + pointY};
          const event = new Event(type, {bubbles: true, cancelable: true});
          Object.defineProperties(event, {touches: {value: ended ? [] : [touch]},
            targetTouches: {value: ended ? [] : [touch]}, changedTouches: {value: [touch]}});
          target.dispatchEvent(event);
        };
        dispatch('touchstart', y);
        for (let i = 1; i <= samples; i++) dispatch('touchmove', y - direction * 120 * i / samples);
        dispatch('touchend', y - direction * 120, true);
      }, {x, y, direction, samples});
    }
    await page.waitForTimeout(40);
  }
  const arrived = id => page.waitForFunction(id => {
    const tour = window.__puntoes.getState().tour;
    return tour.currentId === id && !tour.moving;
  }, id);
  try {
    await load();
    const anchor = await page.evaluate(() => scrollY);
    await swipe();
    assert.equal((await tour()).currentId, 'bbva');
    assert.equal((await tour()).moving, true);
    await swipe();
    assert.equal((await tour()).currentId, 'naturgy', 'a fresh touch while travelling advances immediately');
    await swipe();
    assert.equal((await tour()).currentId, 'sabadell');
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - anchor) < 2);
    await swipe(-1); await swipe(-1); await swipe(-1);
    await arrived('puntoes');
    assert.equal(await page.locator('.city-tour-card').evaluateAll(cards => cards.filter(card => getComputedStyle(card).visibility !== 'hidden' && Number(getComputedStyle(card).opacity) > .1).length), 0);
    await swipe();
    await page.waitForTimeout(200);
    const visible = await page.locator('.city-tour-card').evaluateAll(cards => cards.filter(card => getComputedStyle(card).visibility !== 'hidden' && Number(getComputedStyle(card).opacity) > .1).map(card => card.dataset.client));
    assert.deepEqual(visible, ['bbva'], 'leaving the hub does not resurrect Naturgy');
    await arrived('bbva');
    await page.screenshot({path: `${out}/${name}-bbva.png`});

    await load();
    for (const id of ['bbva', 'naturgy', 'sabadell', 'collaborate']) {await swipe(); await arrived(id)}
    assert.equal((await tour()).collaborationSeen, true);
    const logo = page.locator('.city-client[data-client="cepsa"]');
    await logo.focus(); await logo.tap();
    assert.equal((await tour()).currentId, 'cepsa');
    assert.equal((await tour()).nextId, null, 'Hablemos is not added again after a new logo selection');
    if (cdp) {
      await swipe();
      assert.equal((await tour()).active, false, 'fresh swipe exits even during the manual camera trip');
      assert.ok(await page.evaluate(() => scrollY) > anchor + 10, 'release gives the swipe to native scrolling');
    }
    assert.deepEqual(errors, []);
    report.push({engine: name, passed: true, input: cdp ? 'native CDP touch' : 'WebKit simulated touch-handler events and native tap', visibleAfterHub: visible});
    console.log(`PASS ${name}: rapid touch, reverse to hub, cards, invitation once${cdp ? ', native exit' : ''}`);
  } catch (error) {
    report.push({engine: name, passed: false, error: error.stack, errors});
    await page.screenshot({path: `${out}/${name}-failure.png`}).catch(() => {});
    throw error;
  } finally {
    await writeFile(`${out}/REPORT.json`, JSON.stringify(report, null, 2));
    await browser.close();
  }
}
