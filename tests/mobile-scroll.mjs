import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mobileTourGeometry} from '../src/section-two/mobile-tour.js';
import {mobileTourRoute, mobileTourTiming} from '../src/section-two/mobile-tour-config.js';

const base = process.env.MOBILE_SCROLL_URL || 'http://127.0.0.1:4180/';
const out = process.env.MOBILE_SCROLL_OUT || 'docs/mobile-scroll-2026-10-02';
await fs.mkdir(out, {recursive: true});
const browser = await chromium.launch({headless: true,
  ...(process.platform === 'darwin' ? {executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const report = {url: base, passed: false, phones: []};

try {
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    const context = await browser.newContext({viewport: {width, height}, isMobile: true, hasTouch: true});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '?city=0');
    await page.waitForFunction(() => window.__puntoes?.getState().city?.ready);
    const geometry = mobileTourGeometry({top: await page.locator('#confianza').evaluate(el => el.offsetTop), viewport: height});
    const at = (index, phase) => geometry.revealed + height * (mobileTourTiming.intro + (index + phase) * mobileTourTiming.stop);
    async function scrollAt(top) {
      await page.evaluate(top => scrollTo({top, behavior: 'instant'}), top);
      await page.waitForFunction(top => Math.abs(scrollY - top) < 1 &&
        Math.abs(window.__puntoes.getState().visualProgress - window.__puntoes.getState().progress) < .0001, top);
    }
    const cdp = await context.newCDPSession(page);
    async function swipe({x = width / 2, y = height * .4, distance = height * .22} = {}) {
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y, id: 1}]});
      const frames = [];
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y - distance * i / 12, id: 1}]});
        await page.waitForTimeout(25);
        frames.push(await page.evaluate(() => ({scroll: scrollY, transform: document.querySelector('.city-world').style.transform})));
      }
      // Let the finger rest before lifting: measure the swipe, without a fling.
      await page.waitForTimeout(150);
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
      await page.waitForTimeout(600);
      return frames;
    }
    assert.equal(await page.locator('.city-tour-controls,.city-perspective-control').count(), 0);
    assert.equal(await page.locator('.city-client').count(), 10);
    assert.equal(await page.locator('.city-carousel').evaluate(el => getComputedStyle(el).backgroundImage), 'none');
    await scrollAt(at(0, .02));
    const before = await page.locator('.city-world').getAttribute('style');
    const movement = await swipe();
    assert.ok(new Set(movement.map(frame => frame.transform)).size >= 4, 'the map visibly travels during the gesture');
    assert.notEqual(await page.locator('.city-world').getAttribute('style'), before);
    assert.ok(movement.at(-1).scroll > movement[0].scroll + 50, 'the document scroll is not pinned');
    assert.equal(await page.locator('.city-tour-card[data-client="bbva"]').isVisible(), true, 'the card enters while travelling');
    for (let index = 0; index < mobileTourRoute.length; index++) {
      await scrollAt(at(index, .8));
      assert.equal(await page.locator('.city-tour-card.is-current').getAttribute('data-client'), mobileTourRoute[index].id);
    }
    assert.equal(await page.locator('.city-tour-card:visible').count(), 4, 'previous cards accumulate beneath the current one');
    async function select(id) {
      const logo = page.locator(`.city-client[data-client="${id}"]`);
      await logo.focus(); await logo.tap(); await page.waitForTimeout(1400);
    }
    await select('bbva');
    assert.equal(await page.locator('.city-tour-card[data-client="bbva"]').getAttribute('data-entrance'), 'fade');
    assert.equal(await page.locator('.city-tour-card[data-client="sabadell"]').isVisible(), true);
    await scrollAt(at(3, .8)); await page.waitForTimeout(1100);
    await select('cepsa');
    const card = page.locator('.city-tour-card[data-client="cepsa"]');
    await card.locator('summary').click();
    await page.waitForFunction(() => document.querySelector('.city-tour-card[data-client="cepsa"]').classList.contains('is-reading'));
    const readingBefore = await page.evaluate(() => scrollY), box = await card.boundingBox();
    const readingFrames = await swipe({y: box.y + 60, distance: 100});
    assert.equal(await page.locator('.city-tour-card.is-current').getAttribute('data-client'), 'cepsa');
    assert.equal(await card.locator('details').evaluate(el => el.open), true);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - readingBefore) < 2, 'swiping the expanded article reads it without changing buildings');
    const reading = await card.evaluate(el => ({top: el.scrollTop, range: el.scrollHeight - el.clientHeight}));
    assert.ok(reading.top >= Math.min(20, reading.range), 'the expanded article scrolls when its full text exceeds the available space');
    await page.screenshot({path: `${out}/${width}-reading.png`});

    // A fresh final stop, then an ordinary short swipe across the chapter end.
    await page.goto(base + '?city=0.99');
    await page.waitForFunction(() => window.__puntoes?.getState().city?.ready);
    await scrollAt(geometry.end - 50);
    const exitBefore = await page.evaluate(() => scrollY);
    const exitFrames = await swipe();
    const exitAfter = await page.evaluate(() => scrollY);
    assert.ok(exitAfter > geometry.end, 'the final gesture can leave the city');
    assert.ok(exitAfter - exitBefore < height * .22 + 70, 'the final gesture keeps its natural distance, without jumping to section 3');
    assert.ok(exitAfter < geometry.end + height * .45, 'the next section enters gradually');
    const exitTranslation = await page.locator('.trust-frame').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
    assert.ok(exitTranslation < -10 && exitTranslation > -height * .45, 'the city slides out proportionally to page scroll');
    await page.screenshot({path: `${out}/${width}-ordinary-exit.png`});
    await swipe({distance: -height * .3});
    assert.ok(await page.evaluate(() => scrollY) < exitAfter - 60, 'reverse gesture moves the document in its natural direction');
    assert.ok(await page.evaluate(() => scrollY) < geometry.end, 'reverse scroll returns naturally to the city');
    assert.deepEqual(errors, []);
    report.phones.push({width, height, errors, movement, reading, readingFrames, exitFrames, exitBefore, exitAfter, exitTranslation});
    await context.close();
    console.log(`PASS ${width} × ${height}: continuous map, stack, reading, native exit and reverse`);
  }
  report.passed = true;
} catch (error) {
  report.error = error.stack; process.exitCode = 1; console.error(error);
} finally {
  await fs.writeFile(`${out}/REPORT.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
