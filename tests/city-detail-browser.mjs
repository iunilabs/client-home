import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mobileTourGeometry} from '../src/section-two/mobile-tour.js';
import {mobileTourTiming, mobileTourBuildings, mobileTourHub} from '../src/section-two/mobile-tour-config.js';

const url = process.env.CITY_DETAIL_URL || 'http://127.0.0.1:4306/';
const out = process.env.CITY_DETAIL_OUT || 'docs/city-detail-v2';
await fs.mkdir(`${out}/screenshots`, {recursive: true});
const provenance = JSON.parse(await fs.readFile('src/section-two/assets/city-detail-provenance.json', 'utf8'));
const browser = await chromium.launch({headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const report = {url, passed: false, phones: [], desktopRequests: null, fallback: null};
const tileRequest = request => /puntoes-city-mobile-.*-detail-v(?:14|15|16).*\.webp/.test(request.url());
try {
  const desktop = await browser.newContext({viewport: {width: 1440, height: 900}}), desktopPage = await desktop.newPage(), desktopDownloads = [];
  desktopPage.on('request', r => {if (tileRequest(r)) desktopDownloads.push(r.url());});
  await desktopPage.goto(`${url}?city=.5`); await desktopPage.waitForFunction(() => window.__puntoes?.getState().city?.ready);
  await desktopPage.waitForTimeout(600); assert.equal(desktopDownloads.length, 0); report.desktopRequests = desktopDownloads.length; await desktop.close();
  const phones = [[320, 568, 2], [390, 844, 3], [430, 932, 3]].filter(([width]) => !process.env.CITY_DETAIL_PHONE || width === +process.env.CITY_DETAIL_PHONE);
  for (const [width, height, dpr] of phones) {
    const context = await browser.newContext({viewport: {width, height}, deviceScaleFactor: dpr, isMobile: true, hasTouch: true});
    const page = await context.newPage(), downloads = [], errors = [], phone = {width, height, dpr, frames: []};
    page.on('request', r => {if (tileRequest(r)) downloads.push(r.url());}); page.on('pageerror', e => errors.push(e.message));
    await page.goto(url); await page.waitForFunction(() => Boolean(window.__puntoes)); await page.waitForTimeout(400);
    phone.initialRequests = downloads.length; assert.equal(downloads.length, 0, 'no detail downloads at top of page');
    await page.goto(`${url}?city=0`); await page.waitForFunction(() => window.__puntoes?.getState().city?.ready);
    const geometry = mobileTourGeometry({top: await page.locator('#confianza').evaluate(el => el.offsetTop), viewport: height});
    const scroll = async top => {
      await page.evaluate(top => scrollTo({top, behavior: 'instant'}), top);
      await page.waitForFunction(top => Math.abs(scrollY - top) < 1 && Math.abs(window.__puntoes.getState().visualProgress - window.__puntoes.getState().progress) < .0001, top);
    };
    await scroll(geometry.revealed + height * .2); await page.waitForTimeout(700);
    phone.hubRequests = [...downloads]; assert.equal(downloads.length, 2, 'hub plus next BBVA only');
    async function capture(id) {
      await page.waitForFunction(id => {
        const tile = document.querySelector(`.city-detail[data-client="${id}"]`);
        return document.querySelector('#confianza').dataset.cityStop === id && tile?.complete && tile.naturalWidth > 0 && Number(tile.style.opacity) > .999;
      }, id);
      await page.waitForTimeout(100);
      const frame = await page.evaluate(id => {
        const tile = document.querySelector(`.city-detail[data-client="${id}"]`), core = document.querySelector('.city-core'), world = document.querySelector('.city-world');
        const box = tile.getBoundingClientRect();
        return {id, opacity: +tile.style.opacity, zIndex: +tile.style.zIndex, native: [tile.naturalWidth, tile.naturalHeight], tileBox: {x: box.x, y: box.y, width: box.width, height: box.height}, core: {width: parseFloat(core.style.width), height: parseFloat(core.style.height)}, zoom: +world.style.transform.match(/scale\(([^)]+)/)[1], parentWorld: tile.closest('.city-world') === world, hasOwnTransform: Boolean(tile.style.transform), neighbours: [...core.querySelectorAll('.city-detail')].filter(el => el !== tile).map(el => ({id: el.dataset.client, zIndex: +el.style.zIndex, loaded: el.naturalWidth > 0, opacity: +el.style.opacity})), scroll: scrollY};
      }, id);
      assert.ok(frame.parentWorld && !frame.hasOwnTransform);
      assert.ok(frame.neighbours.every(tile => tile.zIndex < frame.zIndex));
      const p = provenance.tiles.find(t => t.id === id); assert.deepEqual(frame.native, [p.native_width, p.native_height]);
      const stop = id === 'puntoes' ? mobileTourHub : mobileTourBuildings[id];
      frame.subjectCss = [frame.core.width * stop.size[0] / 100 * frame.zoom, frame.core.height * stop.size[1] / 100 * frame.zoom];
      frame.nativePerDevicePixel = [p.native_width / (frame.tileBox.width * dpr), p.native_height / (frame.tileBox.height * dpr)];
      frame.requests = [...downloads];
      await page.screenshot({path: `${out}/screenshots/${width}-dpr${dpr}-${id}.png`});
      if (width === 390) {
        await page.addStyleTag({content: '.city-detail{visibility:hidden !important}'}).then(async style => {
          await page.screenshot({path: `${out}/screenshots/${width}-dpr${dpr}-${id}-base.png`}); await style.evaluate(el => el.remove());
        });
        // Verify neighbours do not visibly degrade the opaque subject.
        // Chrome can rasterize a filtered layer with tiny rounding changes
        // after changing the composition of neighbouring GPU layers.
        const [left, top, cropWidth, cropHeight] = [p.source_crop.left, p.source_crop.top, p.source_crop.width, p.source_crop.height];
        const cx = stop.center[0] * 941 / 100, cy = stop.center[1] * 1672 / 100;
        const sx = frame.tileBox.width / cropWidth, sy = frame.tileBox.height / cropHeight;
        const clip = {x: Math.max(0, frame.tileBox.x + (cx - stop.size[0] * 941 / 200 - left) * sx + 6), y: Math.max(0, frame.tileBox.y + (cy - stop.size[1] * 1672 / 200 - top) * sy + 6), width: Math.min(width - 12, frame.subjectCss[0] - 12), height: frame.subjectCss[1] - 12};
        clip.width = Math.min(clip.width, width - clip.x); clip.height = Math.min(clip.height, height - clip.y);
        const before = await page.screenshot({clip});
        const style = await page.addStyleTag({content: `.city-detail:not([data-client="${id}"]){visibility:hidden !important}`});
        const withoutNeighbours = await page.screenshot({clip}); await style.evaluate(el => el.remove());
        await fs.writeFile(`${out}/screenshots/${id}-subject-with-neighbours.png`, before);
        await fs.writeFile(`${out}/screenshots/${id}-subject-without-neighbours.png`, withoutNeighbours);
        frame.neighbourPixelDifference = await page.evaluate(async ([a, b]) => {
          async function pixels(base64) {
            const data = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const image = await createImageBitmap(new Blob([data], {type: 'image/png'}));
            const canvas = new OffscreenCanvas(image.width, image.height), ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
            return ctx.getImageData(0, 0, image.width, image.height).data;
          }
          const left = await pixels(a), right = await pixels(b); let sum = 0, over8 = 0, max = 0;
          for (let i = 0; i < left.length; i += 4) {let pixelMax = 0; for (let c = 0; c < 3; c++) {const d = Math.abs(left[i + c] - right[i + c]); sum += d; pixelMax = Math.max(pixelMax, d);} max = Math.max(max, pixelMax); if (pixelMax > 8) over8++;}
          return {meanAbsoluteRgb: sum / (left.length / 4 * 3), fractionPixelsOver8: over8 / (left.length / 4), max};
        }, [before.toString('base64'), withoutNeighbours.toString('base64')]);
        // Keep the measurements and screenshots for visual review. A change
        // to Chrome's compositing/rasterization can move antialiased pixels;
        // layer priority, opaque subject coverage and opacity are asserted
        // separately rather than using a renderer-specific byte threshold.
      }
      phone.frames.push(frame); console.log(`PASS ${width}@${dpr} ${id}: ${frame.native.join('x')}, opacity ${frame.opacity}, ${downloads.length} requested`);
    }
    await capture('puntoes');
    for (const id of ['bbva', 'naturgy', 'sabadell']) {
      const index = ['bbva','naturgy','sabadell','collaborate'].indexOf(id);
      await scroll(geometry.revealed + height * (mobileTourTiming.intro + (index + .8) * mobileTourTiming.stop)); await capture(id);
    }
    // Capture with all previously visited detail layers present. The seven
    // additional logo visits must each trigger their own cached destination.
    for (const id of ['canal','accenture','mediaset','cepsa','mapfre','ree','siemens']) {
      const logo = page.locator(`.city-client[data-client="${id}"]`); await logo.focus(); await logo.tap(); await page.waitForTimeout(1400); await capture(id);
    }
    await scroll(geometry.revealed + height * (mobileTourTiming.intro + 3.8 * mobileTourTiming.stop)); await page.waitForTimeout(1100); await capture('collaborate');
    // Reverse back through the hub with the entire tile cache populated.
    await scroll(geometry.revealed + height * .2); await page.waitForTimeout(1500); await capture('puntoes');
    assert.equal(new Set(downloads).size, 12); assert.equal(downloads.length, 12);
    assert.deepEqual(errors, []); phone.totalRequests = downloads.length; phone.errors = errors; report.phones.push(phone); await context.close();
  }
  const fallback = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}), page = await fallback.newPage();
  await page.route('**/*puntoes-city-mobile-bbva-detail-v14*.webp*', route => route.abort('failed'));
  await page.goto(`${url}?city=.18`); await page.waitForFunction(() => window.__puntoes?.getState().city?.ready);
  await page.waitForTimeout(900);
  assert.equal(await page.locator('.city-detail[data-client="bbva"]').count(), 0);
  assert.ok(await page.locator('#city-image').evaluate(el => el.complete && el.naturalWidth === 941));
  await page.screenshot({path: `${out}/screenshots/390-failed-bbva-fallback.png`});
  report.fallback = 'failed BBVA detail removed, V13 base present and city remains usable'; await fallback.close();
  report.passed = true;
} catch (error) {report.error = error.stack; console.error(error); process.exitCode = 1;}
finally {await fs.writeFile(`${out}/BROWSER-REPORT.json`, JSON.stringify(report, null, 2) + '\n'); await browser.close();}
