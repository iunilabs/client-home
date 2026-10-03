import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.HEADER_URL||'http://127.0.0.1:4392/client-home/';
const out=process.env.HEADER_OUT||'/tmp/puntoes-header-motion';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(()=>document.body.dataset.render==='webgl',null,{timeout:60000});
  await page.evaluate(()=>document.fonts.ready);
  const cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const toggle=page.locator('.header-menu-toggle'),menu=page.locator('#header-mobile-menu');
  await toggle.tap();
  const samples=await page.evaluate(async()=>{
    const menu=document.querySelector('#header-mobile-menu'),labels=[...menu.querySelectorAll('.header-menu-label')];
    const samples=[],start=performance.now();let previous=start;
    for(let i=0;i<64;i++){
      await new Promise(requestAnimationFrame);const now=performance.now();
      samples.push({ms:now-start,gap:now-previous,clip:getComputedStyle(menu).clipPath,opacity:labels.map(label=>Number(getComputedStyle(label).opacity))});previous=now;
    }
    return samples;
  });
  assert.ok(samples.some(s=>s.clip.startsWith('circle(')),'the reveal visibly expands from the menu button');
  assert.ok(samples.some(s=>s.opacity[0]>.2&&s.opacity[5]<.1),'entries actually appear in sequence');
  assert.ok(samples.at(-1).opacity.every(value=>value>.99),'all entries finish readable');
  assert.equal(samples.at(-1).clip,'none','the reveal leaves no permanent clipping');
  await page.screenshot({path:`${out}/mobile-open.png`});
  await page.waitForTimeout(1300);
  assert.equal(await menu.evaluate(element=>element.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0,'decorative animation settles instead of running forever');
  await page.keyboard.press('Escape');
  assert.equal(await menu.evaluate(element=>element.open),true,'closing remains visible during its animation');
  await menu.waitFor({state:'hidden'});
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  // Interrupt the entrance repeatedly without waiting for it to finish.
  for(let i=0;i<3;i++){
    await toggle.tap();await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    await menu.waitFor({state:'hidden'});
    assert.equal(await toggle.evaluate(element=>document.activeElement===element),true);
  }
  await toggle.tap();await page.setViewportSize({width:1280,height:800});
  await menu.waitFor({state:'hidden'});
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert.deepEqual(errors,[]);
  const sorted=samples.map(s=>s.gap).sort((a,b)=>a-b);
  const report={conditions:'Chrome mobile emulation, DPR 3, CPU ×4',medianFrameMs:sorted[Math.floor(sorted.length/2)],p95FrameMs:sorted[Math.floor(sorted.length*.95)],samples,errors};
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
  await context.close();

  const reduced=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await reduced.goto(base);await reduced.waitForFunction(()=>window.__puntoes);
  await reduced.locator('.header-menu-toggle').tap();
  const reducedMenu=reduced.locator('#header-mobile-menu');
  assert.equal(await reducedMenu.evaluate(element=>getComputedStyle(element).clipPath),'none');
  assert.equal(await reducedMenu.evaluate(element=>element.getAnimations({subtree:true}).length),0);
  await reduced.keyboard.press('Escape');
  assert.equal(await reducedMenu.evaluate(element=>element.open),false,'reduced motion closes immediately');
  console.log(JSON.stringify({passed:true,medianFrameMs:Math.round(report.medianFrameMs),p95FrameMs:Math.round(report.p95FrameMs),checks:'reveal, stagger, settled CPU, animated close, rapid reversal, desktop resize, reduced motion'}));
}finally{await browser.close();}
