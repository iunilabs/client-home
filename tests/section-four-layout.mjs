import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {WORKFLOW} from '../src/section-four/workflow.js';

const origin = process.env.SECTION4_URL || 'http://127.0.0.1:4318/';
const output = process.env.SECTION4_OUTPUT || '/tmp/puntoes-section-four-review/';
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true, channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const reports = [];

function audit(cards, ordered) {
  assert.equal(cards.length, 47);
  for (const c of cards) {
    assert.equal(c.visible, true);
    assert.ok([...c.min, ...c.max].every(Number.isFinite), c.subject);
    assert.ok(c.min[2] >= c.depth - c.half - .001 && c.max[2] <= c.depth + c.half + .001, `depth lane: ${c.subject}`);
    if (ordered) {
      assert.ok(c.screen.left > -.96 && c.screen.right < .96, `horizontal bounds: ${c.subject}`);
      assert.ok(c.screen.bottom > -.77 && c.screen.top < .77, `vertical bounds: ${c.subject}`);
    }
  }
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    const a = cards[i], b = cards[j];
    const intersects = [0, 1, 2].every(axis => Math.min(a.max[axis], b.max[axis]) - Math.max(a.min[axis], b.min[axis]) > .0001);
    assert.ok(!intersects, `intersection: ${a.subject} / ${b.subject}`);
  }
}

try {
  for (const [name, width, height] of [['desktop',1440,900], ['mobile',390,844], ['small-mobile',320,568], ['landscape',844,390]].filter(([name]) => !process.env.SECTION4_VIEWPORT || name === process.env.SECTION4_VIEWPORT)) {
    const context = await browser.newContext({viewport: {width,height}, isMobile: name !== 'desktop', hasTouch: name !== 'desktop', reducedMotion: 'reduce'});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '?paper=1&capture=1');
    await page.waitForFunction(() => window.__puntoes?.getState().paper?.progress === 1);
    const original = await page.evaluate(() => window.__puntoes.getPaperReview());
    audit(original, false);
    async function progress(p) {
      await page.evaluate(p => {const el = document.querySelector('#resolucion'); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * p);}, p);
      await page.waitForFunction(p => Math.abs(window.__puntoes.getState().paper.resolution.progress - p) < .001, p);
      const cards = await page.evaluate(() => window.__puntoes.getPaperReview());
      const state = await page.evaluate(() => window.__puntoes.getState().paper);
      audit(cards, state.resolution.ordered === 1);
      assert.deepEqual(cards.map(c => c.subject), original.map(c => c.subject), 'same papers across sections');
      assert.equal(await page.locator('[data-paper-canvas]').count(), 1);
      assert.ok(Math.abs(await page.locator('.paper-stage').evaluate(el => el.getBoundingClientRect().top)) < 1, 'shared stage stays pinned');
      if (state.resolution.ordered === 1) {
        assert.equal(await page.locator('[data-paper-copy]').evaluate(el => Number(getComputedStyle(el).opacity)), 0);
        const overlaps = await page.evaluate(() => {
          const cards = window.__puntoes.getPaperReview();
          const labels = [...document.querySelectorAll('.paper-column-label,.paper-workflow-progress')].map(el => el.getBoundingClientRect());
          return cards.filter(c => labels.some(r => {
            const b = {left:(c.screen.left+1)*innerWidth/2,right:(c.screen.right+1)*innerWidth/2,top:(1-c.screen.top)*innerHeight/2,bottom:(1-c.screen.bottom)*innerHeight/2};
            return Math.min(b.right,r.right)-Math.max(b.left,r.left)>1 && Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>1;
          })).map(c => c.subject);
        });
        assert.deepEqual(overlaps, [], 'cards leave labels and progress unobstructed');
      }
      return {cards, state};
    }
    const seam = await progress(0);
    for (let i = 0; i < original.length; i++) for (const edge of ['min','max']) for (let axis = 0; axis < 3; axis++)
      assert.ok(Math.abs(original[i][edge][axis] - seam.cards[i][edge][axis]) < .001, 'continuous section seam');
    for (const p of [.08,.16,.24,.30]) await progress(p);
    await page.screenshot({path: output + name + '-ordered.png'});
    // Inspect the only moving card halfway through each of the 47 transfers.
    for (let i = 0; i < 47; i++) {
      const p = WORKFLOW.processStart + (WORKFLOW.finished - WORKFLOW.processStart) * (i + .5) / 47;
      const {cards, state} = await progress(p);
      assert.equal(state.resolution.completed, i);
      assert.equal(cards.filter(c => c.travel > 0 && c.travel < 1).length, 1);
      assert.equal(cards.find(c => c.travel > 0 && c.travel < 1).index, i);
      if ([0,23,46].includes(i)) await page.screenshot({path: output + name + '-transfer-' + i + '.png'});
    }
    const final = await progress(1);
    assert.equal(final.state.resolution.completed, 47); assert.equal(final.cards.filter(c => c.completed).length, 47);
    assert.ok(final.cards.every(c => c.screen.left > 0), 'all completed papers are on the right');
    assert.equal(await page.locator('[data-pending-count]').textContent(), '0');
    assert.equal(await page.locator('[data-done-count]').textContent(), '47');
    await page.screenshot({path: output + name + '-completed.png'});
    await progress(.3); assert.ok((await page.evaluate(() => window.__puntoes.getPaperReview())).every(c => !c.completed));
    await page.evaluate(() => {const el=document.querySelector('#posibilidades');scrollTo(0,el.offsetTop+(el.offsetHeight-innerHeight));});
    await page.waitForFunction(() => window.__puntoes.getState().paper.resolution.progress === 0);
    assert.equal(await page.locator('[data-paper-copy]').evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    if (name === 'mobile') {
      await page.goto(origin + '?resolution=.6&capture=1');
      await page.waitForFunction(() => Math.abs(window.__puntoes?.getState().paper?.resolution.progress - .6) < .001);
      for (const viewport of [{width:844,height:390},{width:390,height:844}]) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(300);
        await page.waitForFunction(() => Math.abs(window.__puntoes.getState().paper.resolution.progress - .6) < .002);
        audit(await page.evaluate(() => window.__puntoes.getPaperReview()), true);
        assert.equal(await page.locator('[data-done-count]').textContent(), '19');
      }
    }
    // The live camera and native gestures must not reintroduce intersections or locks.
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto(origin + '?resolution=.6');
    await page.waitForFunction(() => Math.abs(window.__puntoes?.getState().paper?.resolution.progress - .6) < .001);
    for (let i = 0; i < 4; i++) {
      if (name === 'desktop') await page.mouse.move(i % 2 ? width - 1 : 1, i % 2 ? height - 1 : 1);
      else await page.evaluate(i => dispatchEvent(new DeviceOrientationEvent('deviceorientation', {beta: 20 + i * 5, gamma: i % 2 ? 10 : -10})), i);
      await page.waitForTimeout(200);
      audit(await page.evaluate(() => window.__puntoes.getPaperReview()), true);
    }
    if (width < 700) {
      const cdp = await context.newCDPSession(page);
      const before = await page.evaluate(() => scrollY);
      for (let i = 0; i < 2; i++) await cdp.send('Input.synthesizeScrollGesture', {gestureSourceType:'touch',x:width/2,y:height*.72,yDistance:-height*.35,speed:1600,preventFling:true});
      await page.waitForFunction(before => scrollY > before + innerHeight * .5, before);
      assert.equal(await page.evaluate(() => window.__puntoes.getState().tour.active), false);
    }
    await page.evaluate(() => document.querySelector('[data-paper-canvas]').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(() => document.querySelector('[data-paper-journey]').dataset.paperRender === 'fallback');
    assert.equal(await page.locator('.paper-fallback-done').isVisible(), true);
    assert.equal(await page.locator('.paper-fallback-pain').isVisible(), false);
    assert.equal(await page.locator('[data-paper-copy]').evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.deepEqual(errors, []);
    reports.push({name, samples: 54, completed: 47, noIntersections: true, continuousSeam: true, reverse: true, liveInput: true, fallback: true});
    console.log(`${name}: all 47 transfers, physical separation, seam, reverse, live input and fallback passed`);
    await context.close();
  }
  await writeFile(output + 'report.json', JSON.stringify(reports,null,2));
} catch(error) {console.error(error);process.exitCode=1;}
finally {await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);process.exit(process.exitCode||0);}
