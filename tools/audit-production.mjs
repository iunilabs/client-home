// Same browser, viewports and conditions for before/after production checks.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';

const base = (process.argv[2] || process.env.PUNTOES_URL || 'http://127.0.0.1:4392/client-home/').replace(/\/?$/, '/');
const output = process.argv[3] || process.env.PUNTOES_AUDIT_OUT || '/tmp/puntoes-production-audit';
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true, channel: 'chrome'});
const report = {base, conditions: 'Chrome, cold cache, CPU x4, 5 Mbps / 60 ms; emulation, not physical phones', runs: []};

async function idleMutations(page) {
  return page.evaluate(() => new Promise(resolve => {
    let mutations = 0, frames = 0;
    const observer = new MutationObserver(records => {mutations += records.length;});
    for (const element of document.querySelectorAll('.chapter-copy,.chapter-inner,.chapter-progress,.paper-workflow,.paper-copy'))
      observer.observe(element, {attributes: true, childList: true, characterData: true, subtree: true});
    const start = performance.now();
    function tick() {
      frames++;
      if (performance.now() - start < 1000) requestAnimationFrame(tick);
      else {observer.disconnect(); resolve({mutations, frames});}
    }
    requestAnimationFrame(tick);
  }));
}

try {
  for (const [name, width, height] of [['mobile',390,844], ['desktop',1440,900]]) {
    const context = await browser.newContext({viewport: {width,height}, isMobile: name === 'mobile', hasTouch: name === 'mobile', deviceScaleFactor: name === 'mobile' ? 3 : 1});
    const page = await context.newPage(), errors = [], failed = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {if (response.status() >= 400 && response.url().startsWith(base)) failed.push({url: response.url(), status: response.status()});});
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
    await cdp.send('Network.emulateNetworkConditions', {offline:false,latency:60,downloadThroughput:625000,uploadThroughput:625000});
    await cdp.send('Emulation.setCPUThrottlingRate', {rate:4});
    let bytes = 0;
    cdp.on('Network.loadingFinished', event => {bytes += event.encodedDataLength;});
    const started = Date.now();
    await page.goto(base, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.body.dataset.render === 'webgl', null, {timeout:60000});
    const readyMs = Date.now() - started, initialBytes = bytes;
    await page.waitForTimeout(1500);
    const run = {name, readyMs, initialBytes, initialIdle:await idleMutations(page), scenes:[]};
    // Visual checks use fixed poses and reduced motion; performance stays live.
    await cdp.send('Network.emulateNetworkConditions', {offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await cdp.send('Network.setCacheDisabled', {cacheDisabled:false});
    for (const [scene, query] of [['intro','scroll=0'],['stone','scroll=250'],['hands','scroll=500'],['wrench','scroll=820'],['encounter','scroll=1000'], ['city','city=.6'], ['pain','paper=.9'], ['ordered','resolution=.24'], ['done','resolution=1']]) {
      await page.emulateMedia({reducedMotion:'reduce'});
      const paperScene=['pain','ordered','done'].includes(scene);
      // Read the settled document position rather than trusting a stale
      // navigation marker in the historical build being compared.
      await page.goto(base+'?'+(paperScene?'paper=0':query)+'&capture=1');
      await page.waitForFunction(() => window.__puntoes?.getState().render === 'webgl', null, {timeout:60000});
      if (scene === 'city') await page.waitForFunction(() => window.__puntoes.getState().city?.ready);
      if(query.startsWith('scroll=')){
        await page.waitForFunction(()=>window.__puntoes.getState().scene?.tools.every(t=>t.loaded));
        const hand=await page.evaluate(()=>{const s=window.__puntoes.getState().scene;return {mirror:s.humanMirror,authority:s.poseAuthority,actors:s.actors,tips:Object.values(s.worldFingerTips).flat()};});
        assert.equal(hand.mirror,-1);assert.equal(hand.authority,'absolute joint quaternion track');
        assert.ok(hand.actors.every(id=>['human-hand','ai-hand','tool-piedra','tool-compas','tool-llave'].includes(id)));
        assert.ok(hand.tips.every(Number.isFinite));
      }
      if(paperScene){
        await page.waitForFunction(()=>window.__puntoes.getState().paper?.active);
        const params=new URLSearchParams(query),workflow=params.has('resolution'),progress=Number(params.get(workflow?'resolution':'paper'));
        await page.evaluate(({workflow,progress})=>{const j=window.__puntoes.getState().paper.journey;scrollTo(0,document.querySelector('[data-paper-journey]').offsetTop+(workflow?j.chaosRange+j.workflowRange*progress:j.chaosRange*progress));},{workflow,progress});
        await page.waitForFunction(({workflow,progress})=>Math.abs((workflow?window.__puntoes.getState().paper.resolution.progress:window.__puntoes.getState().paper.progress)-progress)<.001,{workflow,progress});
      }
      await page.waitForTimeout(1200);
      await page.screenshot({path:`${output}/${name}-${scene}.png`});
      const state = await page.evaluate(() => {
        const p = window.__puntoes.getState().paper;
        return {width:innerWidth, pageWidth:document.documentElement.scrollWidth, total:p?.totalItems, completed:p?.resolution?.completed, chaosRange:p?.journey.chaosRange};
      });
      assert.ok(state.pageWidth <= width + 1, 'no horizontal overflow');
      if (scene === 'done') {assert.equal(state.total,47);assert.equal(state.completed,3);assert.equal(state.chaosRange,1900);}
      run.scenes.push({scene,...state,idle:await idleMutations(page)});
    }
    await page.goto(base + '#contacto');
    await page.waitForFunction(() => document.body.classList.contains('contact-active'));
    assert.equal(await page.locator('[data-contact-form]').count(),1);
    await page.screenshot({path:`${output}/${name}-contact.png`});
    // Never send real email during verification.
    await page.route('https://www.puntoes.es/wp-json/contact-form-7/**', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'mail_sent'})}));
    await page.locator('[name="your-name"]').fill('Prueba local');
    await page.locator('[name="your-email"]').fill('prueba@example.com');
    await page.locator('[name="your-subject"]').selectOption({index:1});
    await page.locator('[name="your-message"]').fill('Comprobación interceptada: no se envía ningún correo.');
    await page.locator('[data-contact-button]').click();
    await page.waitForFunction(() => document.querySelector('[data-contact-status]').dataset.state === 'success');
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    report.runs.push({...run,errors,failed});
    console.log(JSON.stringify({name,readyMs,initialBytes,idle:run.initialIdle,scenes:run.scenes.map(s=>({scene:s.scene,idle:s.idle}))}));
    await context.close();
  }
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report,null,2));
  await browser.close();
}
