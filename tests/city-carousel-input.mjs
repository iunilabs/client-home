import {chromium, webkit} from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.CITY_CAROUSEL_URL || 'http://127.0.0.1:4305';
const useApp = process.env.CITY_CAROUSEL_APP === '1';
const fixture = `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
<button id="before">Antes</button>
<section class="city-mobile-tour" style="height:240px;position:relative"><div class="city-carousel"><div class="city-carousel-viewport"><ul class="city-carousel-track"></ul></div></div></section>
<button id="after">Después</button>
<script type="module">
import '/src/section-two/style.css';
import {createCityCarousel} from '/src/section-two/city-carousel.js';
import {cityClients} from '/src/section-two/city-clients.js';
window.opens = [];
window.carousel = createCityCarousel(document.querySelector('section'), cityClients, {onSelect() {}, onOpen(client) {opens.push(client.id)}});
carousel.load();
function frame(now) {carousel.update(now, {mode:'tour', progress:1, opacity:1, ready:true, active:true}, false);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
</script></body></html>`;

for (const [engine, type] of [['chromium', chromium], ['webkit', webkit]].filter(([engine]) => !process.env.CITY_CAROUSEL_ENGINE || process.env.CITY_CAROUSEL_ENGINE === engine)) {
  const browser = await type.launch({headless:true,
    ...(engine === 'chromium' && process.platform === 'darwin' ? {executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {}),
    ...(engine === 'webkit' && process.env.CITY_CAROUSEL_WEBKIT_PATH ? {executablePath:process.env.CITY_CAROUSEL_WEBKIT_PATH} : {})});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
    const page = await context.newPage();
    if (!useApp) await page.route('**/__carousel-input', route => route.fulfill({contentType:'text/html', body:fixture}));
    await page.goto(useApp ? base : `${base}/__carousel-input`);
    const row = page.locator('.city-carousel'), viewport = row.locator('.city-carousel-viewport');
    await page.waitForFunction(() => document.querySelectorAll('.city-carousel .city-client').length > 0 && !document.querySelector('.city-carousel').inert);
    const clientCount = await row.locator('.city-client').count();
    if (useApp) await row.evaluate(el => {
      window.opens = [];
      el.addEventListener('click', event => {
        const button = event.target.closest('.city-client');
        if (button && !event.defaultPrevented) opens.push(button.dataset.client);
      });
    });
    // Vite's CSS module injection can settle after the first JS frame in
    // WebKit. Start input only after the real viewport layout is in place.
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.city-carousel-viewport')).overflowX === 'hidden');
    assert.equal(await viewport.evaluate(el => getComputedStyle(el).overflowX),'hidden',`${engine}: direct motion has a single horizontal owner`);
    const position = () => row.evaluate(el => ({transform:el.querySelector('ul').style.transform, paused:el.dataset.paused,
      phase:el.dataset.motion, focus:el.classList.contains('is-focused'), scroll:el.querySelector('.city-carousel-viewport').scrollLeft}));
    const box = await viewport.boundingBox(), y = box.y + box.height / 2;
    const session = engine === 'chromium' ? await context.newCDPSession(page) : null;
    const touch = async (type, x) => {
      if (session) return session.send('Input.dispatchTouchEvent', {type, touchPoints:type === 'touchEnd' || type === 'touchCancel' ? [] : [{x,y,id:1}]});
      // Playwright WebKit exposes native taps, but no native touch-move API.
      // These WebKit drags test event routing and DOM behavior; Chromium below
      // also exercises trusted browser touch input and compositor arbitration.
      await viewport.evaluate((el, {type,x,y}) => {
        const event = new Event(({touchStart:'touchstart',touchMove:'touchmove',touchEnd:'touchend',touchCancel:'touchcancel'})[type], {bubbles:true,cancelable:true});
        Object.defineProperty(event, 'touches', {value:type === 'touchEnd' || type === 'touchCancel' ? [] : [{clientX:x,clientY:y}]});
        el.dispatchEvent(event);
      }, {type,x,y});
    };
    const swipe = async ({hold=0,cancel=false}={}) => {
      await touch('touchStart',350);
      for (let i=1;i<=8;i++) {await touch('touchMove',350-i*31);await page.waitForTimeout(25)}
      if (hold) await page.waitForTimeout(hold);
      const held = await position();
      await touch(cancel ? 'touchCancel' : 'touchEnd');
      return held;
    };

    // Keyboard-origin focus must stay accessible, then a touch must immediately
    // switch back to direct dragging even while :focus-visible is still true.
    if (useApp) await page.evaluate(() => document.activeElement.blur());
    else await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    // The mobile WebKit runner does not move Tab focus to the logo. Keep the
    // native keyboard modality, then focus the logo explicitly.
    if (engine === 'webkit' || useApp) await row.locator('.city-client').first().focus();
    await page.waitForFunction(() => document.querySelector('.city-carousel').classList.contains('is-focused') && document.querySelector('.city-carousel').dataset.paused === 'true');
    const keyboard = await position();
    assert.equal(keyboard.paused,'true',`${engine}: keyboard browsing pauses motion`);
    assert.equal(await viewport.evaluate(el => getComputedStyle(el).overflowX),'auto',`${engine}: keyboard focus keeps native scrolling`);
    const held = await swipe({hold:250});
    assert.notEqual(held.transform,keyboard.transform,`${engine}: a touch drag works after keyboard focus`);
    assert.equal(held.focus,false,`${engine}: direct touch leaves the native keyboard scroller`);
    assert.equal(await viewport.evaluate(el => getComputedStyle(el).overflowX),'hidden',`${engine}: touch restores translated motion`);
    await page.waitForTimeout(2300);
    assert.equal((await position()).paused,'false',`${engine}: direct touch does not strand autoplay in keyboard focus`);

    // A real tap may focus a button after pointerup/touchend. It must still
    // select its client and let ornamental motion resume while focus remains.
    const tap = await row.locator('.city-client').evaluateAll(nodes => {
      const el = nodes.find(node => {const b=node.getBoundingClientRect();return b.left>=15&&b.right<=375});
      const b=el.getBoundingClientRect();return {x:(b.left+b.right)/2,y:(b.top+b.bottom)/2,id:el.dataset.client};
    });
    await page.touchscreen.tap(tap.x,tap.y);
    assert.equal(await page.evaluate(() => opens.at(-1)),tap.id,`${engine}: native tap still opens the client`);
    await page.waitForTimeout(2300);
    assert.equal((await position()).paused,'false',`${engine}: touch-created focus does not pause motion`);
    if (useApp) assert.equal(await page.evaluate(() => window.__puntoes.getState().tour.currentId),tap.id,`${engine}: native tap visits its actual client in the map`);

    const resting = await swipe({hold:1100});
    const opensBeforeReleaseClick = await page.evaluate(() => opens.length);
    await row.locator('.city-client').first().evaluate(el => el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1})));
    assert.equal(await page.evaluate(() => opens.length),opensBeforeReleaseClick,`${engine}: a delayed click after a held drag does not open a client`);
    await page.waitForTimeout(250);
    assert.equal((await position()).transform,resting.transform,`${engine}: lifting a stationary finger does not fling with stale velocity`);
    // A separate finger tap must not inherit the preceding drag's click guard.
    // This tap ends well inside the 800 ms guard for the drag's ghost click.
    const freshTap = await row.locator('.city-client').evaluateAll(nodes => {
      const el = nodes.find(node => {const b=node.getBoundingClientRect();return b.left>=15&&b.right<=375});
      const b=el.getBoundingClientRect();return {x:(b.left+b.right)/2,y:(b.top+b.bottom)/2,id:el.dataset.client};
    });
    await page.touchscreen.tap(freshTap.x,freshTap.y);
    assert.equal(await page.evaluate(() => opens.length),opensBeforeReleaseClick+1,`${engine}: first fresh tap after a drag opens exactly once`);
    assert.equal(await page.evaluate(() => opens.at(-1)),freshTap.id,`${engine}: first fresh tap opens the tapped client`);
    if (useApp) assert.equal(await page.evaluate(() => window.__puntoes.getState().tour.currentId),freshTap.id,`${engine}: fresh tap visits its client in the map`);
    const cancelled = await swipe({cancel:true});
    await page.waitForTimeout(250);
    const afterCancel = await position();
    assert.equal(afterCancel.transform,cancelled.transform,`${engine}: a canceled gesture does not fling (${JSON.stringify({cancelled,afterCancel})})`);
    assert.equal(await row.locator('.city-client').count(),clientCount);
    console.log(`PASS ${engine}: keyboard-to-touch drag, native tap focus, held release, immediate fresh tap, touch cancellation`);
    await context.close();
  } finally {await browser.close()}
}
