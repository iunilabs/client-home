import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';

const base = process.env.CITY_CAROUSEL_URL || 'http://127.0.0.1:4305/?city=0.99';
const out = process.env.CITY_CAROUSEL_OUT || 'docs/city-carousel-motion';
const browser = await chromium.launch({headless: true,
  ...(process.platform === 'darwin' ? {executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const report = {url: base, passed: false, input: 'Chrome DevTools Protocol Input.dispatchTouchEvent', positions: []};
const stable = value => JSON.parse(JSON.stringify(value, (key, item) => typeof item === 'number' ? Math.round(item * 100) / 100 : item));
const ids = ['accenture', 'bbva', 'canal', 'cepsa', 'mapfre', 'mediaset', 'ree', 'siemens', 'naturgy', 'sabadell'];

try {
  await mkdir(out, {recursive: true});
  const context = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  let page = await context.newPage();
  await page.goto(base);
  await page.waitForFunction(() => window.__puntoes?.getState().city?.ready && !document.querySelector('.city-carousel').inert);
  await page.waitForTimeout(200);
  const strip = page.locator('.city-carousel');
  assert.equal(await strip.locator('.city-client').count(), 10);
  const initialIds = await strip.locator('.city-client').evaluateAll(nodes => nodes.map(node => node.dataset.client));
  assert.deepEqual([...initialIds].sort(), [...ids].sort(), 'the actual ten client buttons exist exactly once');
  assert.equal(new Set(initialIds).size, 10);
  const logoStyle = await strip.locator('.city-client img').first().evaluate(image => ({filter: getComputedStyle(image).filter, loaded: image.complete && image.naturalWidth > 0}));
  assert.match(logoStyle.filter, /invert\(1\)/);
  assert.equal(logoStyle.loaded, true);

  // Keyboard traversal must expose every real button, including items beyond
  // the viewport, while the native scroll viewport keeps focus visible.
  await page.evaluate(() => document.activeElement.blur());
  const keyboardReached = new Set();
  for (let index = 0; index < 90 && keyboardReached.size < 10; index++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.dataset?.client || null);
    if (focused) keyboardReached.add(focused);
  }
  assert.deepEqual([...keyboardReached].sort(), [...ids].sort(), 'Tab reaches all ten clients in the real document');
  await page.waitForFunction(() => document.querySelector('.city-carousel').dataset.paused === 'true');
  assert.equal(await strip.getAttribute('data-paused'), 'true', 'keyboard focus pauses motion');
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.activeElement.blur());
  await page.waitForTimeout(100);

  // Reset the track to a known scroll-independent starting session and use
  // native CDP touch input. Finger hold lasts longer than the autoplay delay.
  await page.reload();
  await page.waitForFunction(() => window.__puntoes?.getState().city?.ready && !document.querySelector('.city-carousel').inert);
  await page.waitForTimeout(100);
  const cdp = await context.newCDPSession(page);
  await page.evaluate(() => {
    const input = window.__carouselTouch = {x:null,count:0,paintedCount:0,trusted:false};
    const observe = event => {
      const point = event.touches[0];
      if (!point) return;
      input.x = point.clientX; input.trusted = event.isTrusted;
      const count = ++input.count;
      requestAnimationFrame(() => {input.paintedCount = Math.max(input.paintedCount,count)});
    };
    for (const type of ['touchstart','touchmove']) document.addEventListener(type,observe,{capture:true,passive:true});
  });
  const delivered = x => page.waitForFunction(expected => {
    const input = window.__carouselTouch;
    return input.trusted && Math.abs(input.x-expected)<.01 && input.paintedCount===input.count;
  },x,{timeout:2000});
  const position = () => page.evaluate(() => {
    const row = document.querySelector('.city-carousel');
    return {
      scrollY,
      phase: row.dataset.motion,
      paused: row.dataset.paused,
      transform: getComputedStyle(row.querySelector('.city-carousel-track')).transform,
      clients: [...row.querySelectorAll('.city-client')].map(button => {
        const rect = button.getBoundingClientRect();
        return {id: button.dataset.client, left: rect.left, right: rect.right, center: (rect.left + rect.right) / 2};
      })
    };
  });
  const swipe = async ({fromX, toX, hold = 0}) => {
    const y = await strip.evaluate(element => element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2);
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: fromX, y, id: 1}]});
    await delivered(fromX);
    await page.waitForTimeout(120);
    const before = await position();
    const frames = [];
    for (let index = 1; index <= 10; index++) {
      const x = fromX + (toX - fromX) * index / 10;
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y, id: 1}]});
      await page.waitForTimeout(25);
      // Under map paint load a CDP request can resolve before its trusted
      // TouchEvent arrives. Compare positions after that event's paint frame.
      await delivered(x);
      frames.push(await position());
    }
    if (hold) await page.waitForTimeout(hold);
    const held = await position();
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await page.waitForTimeout(300);
    const released = await position();
    await page.waitForTimeout(1800);
    const resumed = await position();
    const step = (toX - fromX) / 10;
    const continuity = frames.slice(1).flatMap((frame, index) => {
      const prior = frames[index], right = frame.clients.filter(client => client.left < 390 && client.right > 0);
      return right.filter(client => {
        const old = prior.clients.find(candidate => candidate.id === client.id);
        return old && old.left < 390 && old.right > 0;
      }).map(client => {
        const old = prior.clients.find(candidate => candidate.id === client.id);
        return {id: client.id, expected: step, actual: client.center - old.center};
      });
    });
    return {before, frames, held, released, resumed, continuity};
  };

  const baselineScroll = await page.evaluate(() => scrollY);
  const left = await swipe({fromX: 350, toX: 30, hold: 2200});
  assert.equal(left.held.paused, 'true', 'finger remains a hard pause beyond two seconds');
  assert.equal(left.held.transform, left.frames.at(-1).transform, 'track does not drift under a still finger');
  assert.equal(left.held.scrollY, baselineScroll, 'horizontal drag never moves the document');
  assert.ok(left.frames.some(frame => frame.transform !== left.before.transform), 'finger movement directly moves the logos');
  assert.ok(left.continuity.length > 5, 'long drag overlaps enough real logos to inspect the recycling boundary');
  assert.ok(left.continuity.every(sample => Math.abs(sample.actual - sample.expected) < 2), 'crossing multiple logos does not jump a visible logo');
  assert.ok(left.resumed.transform !== left.held.transform, 'autoplay resumes after release and its two second delay');
  assert.ok(['resuming', 'automatic'].includes(left.resumed.phase));
  assert.equal(left.resumed.scrollY, baselineScroll);
  report.positions.push({direction: 'finger-left', before: left.before, during: left.frames, held: left.held, released: left.released, afterIdle: left.resumed});
  await page.screenshot({path: `${out}/finger-left-resume.png`});

  const right = await swipe({fromX: 30, toX: 350, hold: 0});
  report.positions.push({direction: 'finger-right', before: right.before, during: right.frames, released: right.released, afterIdle: right.resumed});
  assert.ok(right.frames.some(frame => frame.transform !== right.before.transform), 'reverse finger movement also moves logos');
  assert.ok(right.continuity.length > 5, 'reverse drag crosses multiple real logos');
  assert.ok(right.continuity.every(sample => Math.abs(sample.actual - sample.expected) < 2), 'reverse recycling preserves visible identity and position');
  assert.equal(right.released.phase, 'inertia', 'fast release enters inertial motion before automatic movement');
  assert.equal(right.released.scrollY, baselineScroll, 'reverse horizontal drag never moves the document');
  assert.ok([...left.frames, ...right.frames].every(frame => frame.clients.length === 10 && new Set(frame.clients.map(client => client.id)).size === 10), 'recycling retains one accessible DOM button per client');
  const seen = new Set([...right.before.clients, ...right.frames.flatMap(frame => frame.clients)].map(client => client.id));
  assert.deepEqual([...seen].sort(), [...ids].sort(), 'real button nodes cover all ten IDs while recycling in either direction');
  await page.screenshot({path: `${out}/finger-right-inertia.png`});

  // Touch-generated focus/hover must not strand the carousel in keyboard mode.
  await page.waitForTimeout(2200);
  assert.notEqual(await strip.getAttribute('data-paused'), 'true');
  assert.equal(await strip.locator('.city-client').count(), 10);
  await context.close();

  const desktopContext = await browser.newContext({viewport: {width: 1440, height: 900}});
  page = await desktopContext.newPage();
  await page.goto(base);
  await page.waitForFunction(() => window.__puntoes?.getState().city?.active && !document.querySelector('.city-carousel').inert);
  const desktopStrip = page.locator('.city-carousel');
  await page.waitForTimeout(150);
  await page.mouse.move(120, 800);
  await page.waitForFunction(() => document.querySelector('.city-carousel').dataset.paused === 'true');
  const hoverTransform = await desktopStrip.locator('.city-carousel-track').evaluate(element => getComputedStyle(element).transform);
  await page.waitForTimeout(450);
  assert.equal(await desktopStrip.locator('.city-carousel-track').evaluate(element => getComputedStyle(element).transform), hoverTransform, 'desktop mouse hover pauses the original auto motion');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(300);
  assert.notEqual(await desktopStrip.locator('.city-carousel-track').evaluate(element => getComputedStyle(element).transform), hoverTransform, 'motion resumes smoothly after leaving desktop hover');

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable: true, value: true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable: true, value: false});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => !document.hidden);
  const visibleTransform = await desktopStrip.locator('.city-carousel-track').evaluate(element => getComputedStyle(element).transform);
  await page.waitForTimeout(300);
  assert.equal(await desktopStrip.locator('.city-carousel-track').evaluate(element => getComputedStyle(element).transform), visibleTransform, 'returning from a hidden tab has no elapsed-time jump');

  const selectableNode = await desktopStrip.locator('.city-client').evaluateAll(nodes => {
    const node = nodes.find(candidate => {
      const r = candidate.getBoundingClientRect(), v = candidate.closest('.city-carousel-viewport').getBoundingClientRect();
      return r.left >= v.left && r.right <= v.right;
    });
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return {id: node.dataset.client, x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2};
  });
  const selectable = selectableNode?.id;
  assert.ok(selectableNode, 'there is a fully visible client available for a manual tap');
  await page.mouse.move(selectableNode.x, selectableNode.y);
  await page.waitForFunction(() => document.querySelector('.city-carousel').dataset.paused === 'true');
  await page.mouse.click(selectableNode.x, selectableNode.y);
  await page.waitForFunction(() => Boolean(document.querySelector('#city-case[open]')));
  assert.equal(await desktopStrip.locator(`.city-client[data-client="${selectable}"]`).evaluate(node => node.classList.contains('is-selected')), true, 'a deliberate click still selects and opens its client');
  await page.keyboard.press('Escape');
  await desktopContext.close();

  const reducedContext = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, reducedMotion: 'reduce'});
  page = await reducedContext.newPage();
  await page.goto(base);
  await page.waitForFunction(() => window.__puntoes?.getState().city?.active && !document.querySelector('.city-carousel').inert);
  const reducedTrack = page.locator('.city-carousel-track');
  await page.waitForTimeout(700);
  const reducedTransform = await reducedTrack.evaluate(element => getComputedStyle(element).transform);
  assert.equal(await page.locator('.city-carousel').getAttribute('data-motion'), 'reduced-motion');
  await page.waitForTimeout(1800);
  assert.equal(await reducedTrack.evaluate(element => getComputedStyle(element).transform), reducedTransform, 'reduced motion never starts ornamental autoplay');
  const reducedCdp = await reducedContext.newCDPSession(page);
  const stripBox = await page.locator('.city-carousel').boundingBox();
  await reducedCdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 350, y: stripBox.y + stripBox.height / 2, id: 1}]});
  await reducedCdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 245, y: stripBox.y + stripBox.height / 2, id: 1}]});
  await page.waitForTimeout(60);
  const manuallyDragged = await reducedTrack.evaluate(element => getComputedStyle(element).transform);
  await reducedCdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await page.waitForTimeout(300);
  assert.notEqual(manuallyDragged, reducedTransform, 'reduced motion still permits deliberate direct dragging');
  assert.equal(await reducedTrack.evaluate(element => getComputedStyle(element).transform), manuallyDragged, 'reduced motion omits fling and automatic movement after the drag');
  await reducedContext.close();

  report.passed = true;
  report.keyboardReached = [...keyboardReached].sort();
  report.ids = ids;
  report.desktop = {hoverPaused: true, hiddenReturnNoJump: true, manualClientSelection: selectable};
  report.reducedMotion = {autoplay: false, directDrag: true, ornamentalInertia: false, transform: manuallyDragged};
  report.positionSamples = report.positions.map(entry => ({
    direction: entry.direction,
    before: stable(entry.before),
    during: entry.during.map(frame => stable({scrollY: frame.scrollY, transform: frame.transform, phase: frame.phase, clients: frame.clients})),
    held: entry.held && stable(entry.held),
    released: stable(entry.released),
    afterIdle: stable(entry.afterIdle)
  }));
  await writeFile(`${out}/REPORT.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS: 10 keyboard reachable; native touch both directions; no document scroll; held pause and delayed resume. Evidence: ${out}/REPORT.json`);
} catch (error) {
  report.error = error.stack;
  await mkdir(out, {recursive: true});
  await writeFile(`${out}/REPORT.json`, JSON.stringify(report, null, 2) + '\n');
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
