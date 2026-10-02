import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';

const origin = process.env.SECTION3_URL || 'http://127.0.0.1:4318/';
const output = process.env.SECTION3_OUTPUT || '/tmp/puntoes-paper-separation/';
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true, channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const reports = [];
function audit(cards, grouped) {
  const visible = cards.filter(card => card.visible);
  for (const card of visible) {
    assert.ok([...card.min, ...card.max].every(Number.isFinite), card.subject);
    assert.ok(card.min[2] >= card.depth - card.half - .001 && card.max[2] <= card.depth + card.half + .001, `depth envelope: ${card.subject}`);
    if (grouped) {
      assert.ok(card.screen.left >= .05 && card.screen.right <= .98, `right-hand group: ${card.subject} ${JSON.stringify(card.screen)}`);
      assert.ok(card.screen.bottom >= -.86 && card.screen.top <= .86, `stray paper: ${card.subject}`);
    }
  }
  for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
    const a = visible[i], b = visible[j];
    const intersects = [0, 1, 2].every(axis => Math.min(a.max[axis], b.max[axis]) - Math.max(a.min[axis], b.min[axis]) > .0001);
    assert.ok(!intersects, `intersection: ${a.subject} / ${b.subject}`);
  }
  return visible.length;
}
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844], ['landscape', 844, 390]]) {
    const context = await browser.newContext({viewport: {width, height}, isMobile: name !== 'desktop', hasTouch: name !== 'desktop', reducedMotion: 'reduce'});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '?paper=0&capture=1');
    await page.waitForFunction(() => !!window.__puntoes?.getState().paper);
    let finalCards;
    for (let step = 0; step <= 100; step++) {
      const p = step / 100;
      await page.evaluate(p => {const j = window.__puntoes.getState().paper.journey; scrollTo(0, j.start + j.chaosRange * p);}, p);
      await page.waitForFunction(p => Math.abs(window.__puntoes.getState().paper.progress - p) < .001, p);
      const cards = await page.evaluate(() => window.__puntoes.getPaperReview());
      const count = audit(cards, step === 100);
      if (step === 100) {assert.equal(count, 47); finalCards = cards;}
      if ([12, 28, 48, 72, 100].includes(step)) await page.screenshot({path: `${output}${name}-${step}.png`});
    }
    // Repeat the final volume with live flex and camera parallax enabled.
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto(origin + '?paper=1');
    await page.waitForFunction(() => window.__puntoes?.getState().paper?.progress > .999);
    for (let step = 0; step < 8; step++) {
      await page.mouse.move(step % 2 ? width - 1 : 1, step % 2 ? height - 1 : 1);
      await page.waitForTimeout(250);
      audit(await page.evaluate(() => window.__puntoes.getPaperReview()), true);
    }
    assert.deepEqual(errors, []);
    reports.push({name, scrollSamples: 101, liveSamples: 8, cards: finalCards});
    console.log(`${name}: 47 cards individually checked, no intersecting volumes or stray final cards`);
    await context.close();
  }
  await writeFile(`${output}report.json`, JSON.stringify(reports, null, 2));
} catch (error) {
  console.error(error); process.exitCode = 1;
} finally {
  await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 3000))]);
  process.exit(process.exitCode || 0);
}
