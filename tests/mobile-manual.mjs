// Native Chrome touch regression for the manual itinerary override.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.MOBILE_SCROLL_URL || 'http://127.0.0.1:4314/client-home/';
const out=process.env.MOBILE_SCROLL_OUT || 'docs/mobile-manual-2026-10-02';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,
  ...(process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{}),
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const clients=['accenture','bbva','canal','cepsa','mapfre','mediaset','ree','siemens','naturgy','sabadell'];
const normalOnly=process.env.MOBILE_MANUAL_PART==='normal';
const prior=normalOnly?JSON.parse(await fs.readFile(`${out}/MANUAL-REPORT.json`,'utf8')):null;
const report={url:base,passed:false,matrix:prior?.matrix ?? [],normal:[],matrixRetained:normalOnly};
async function session(width,height,reducedMotion='no-preference') {
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion});
  const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const state=()=>page.evaluate(()=>({y:scrollY,...window.__puntoes.getState().tour}));
  async function settled(id) {
    await page.waitForFunction(id=>{const tour=window.__puntoes.getState().tour;return tour.currentId===id && !tour.moving},id);
    if(id!=='puntoes')await page.waitForFunction(id=>document.querySelector('.city-tour-card.is-current')?.dataset.client===id,id);
  }
  async function swipe(distance=108,{y=height*.36,settle=true}={}) {
    const x=width/2,samples=Math.ceil(Math.abs(distance)/3),frames=[];
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    for(let i=1;i<=samples;i++) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-distance*i/samples,id:1}]});
      await page.waitForTimeout(8);
      frames.push(await page.evaluate(()=>({y:scrollY,id:window.__puntoes.getState().tour.currentId,transform:document.querySelector('.city-world').style.transform})));
    }
    await page.waitForTimeout(100);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    if(settle)await page.waitForFunction(()=>!window.__puntoes.getState().tour.moving);
    await page.waitForTimeout(100);return frames;
  }
  async function select(id) {
    const logo=page.locator(`.city-client[data-client="${id}"]`);
    const beforeFocus=(await state()).manualId;
    await page.keyboard.press('Tab');await logo.focus();
    assert.equal((await state()).manualId,beforeFocus,'focus alone cannot cancel the itinerary');
    await logo.tap();await settled(id);
    assert.equal((await state()).manualId,id);assert.equal((await state()).nextId,'collaborate');
    await page.waitForFunction(()=>document.querySelector('.city-tour-card.is-current .tour-card-count')?.textContent==='01 / 02');
    assert.equal(await page.locator('.city-tour-card.is-current .tour-card-count').textContent(),'01 / 02');
  }
  async function reset() {
    await page.locator('#open-clients').tap();await page.waitForFunction(()=>window.__puntoes.getState().tour.active);await settled('puntoes');
    assert.equal((await state()).manualId,null);assert.equal((await state()).nextId,'bbva');
  }
  await page.goto(base+'?city=0');
  await page.waitForFunction(()=>window.__puntoes?.getState().tour.active && window.__puntoes.getState().city?.ready);
  await settled('puntoes');
  return {context,page,errors,state,settled,swipe,select,reset};
}
try {
  // All actual logo callbacks are exercised at the hub, mid-route and final
  // default stop. Reduced city motion keeps this exhaustive matrix quick.
  if (!normalOnly) {
  const matrix=await session(390,844,'reduce');
  for(const stage of ['hub','naturgy','collaborate'])for(const id of clients) {
    await matrix.reset();
    for(const stop of stage==='hub'?[]:stage==='naturgy'?['bbva','naturgy']:['bbva','naturgy','sabadell','collaborate']) {
      await matrix.swipe();await matrix.settled(stop);assert.equal((await matrix.state()).manualId,null);
    }
    await matrix.select(id);
    const frames=await matrix.swipe();await matrix.settled('collaborate');
    assert.ok(frames.every(frame=>frame.id===id || frame.id==='collaborate'),'no other company appears after choice');
    assert.equal((await matrix.state()).previousId,id);
    assert.equal(await matrix.page.locator('.city-tour-card.is-current .tour-card-count').textContent(),'02 / 02');
    await matrix.swipe(-108);await matrix.settled(id);
    assert.equal((await matrix.state()).nextId,'collaborate');
    report.matrix.push({stage,id,forward:'collaborate',reverse:id});
    console.log(`PASS touch ${stage} → ${id} → collaboration → ${id}`);
  }
  assert.deepEqual(matrix.errors,[]);await matrix.context.close();
  }
  for(const [width,height] of [[320,568],[390,844],[430,932]]) {
    const {context,page,errors,state,settled,swipe,select,reset}=await session(width,height);
    const anchor=(await state()).y;
    // No taps retains the original three companies plus construction.
    for(const id of ['bbva','naturgy','sabadell','collaborate']){await swipe();await settled(id);assert.equal((await state()).manualId,null)}
    await reset();await swipe();await settled('bbva');
    const beforeTap=await page.locator('.city-world').getAttribute('style');
    await select('bbva');assert.equal(await page.locator('.city-world').getAttribute('style'),beforeTap);
    await swipe();await settled('collaborate');
    await swipe(-108);await settled('bbva');
    await select('cepsa');await select('naturgy');
    const cameraBefore=await page.locator('.city-world').getAttribute('style');
    const travel=await swipe();await settled('collaborate');
    assert.ok(new Set(travel.map(frame=>frame.transform)).size>=4,'normal camera stays animated');
    assert.notEqual(await page.locator('.city-world').getAttribute('style'),cameraBefore);
    assert.ok(travel.every(frame=>Math.abs(frame.y-anchor)<2),'manual travel pins document');
    await swipe(-108);await settled('naturgy');
    await swipe(-108);await settled('puntoes');
    await swipe();await settled('naturgy');await swipe();await settled('collaborate');
    const exitBefore=(await state()).y;
    const exit=await swipe(height*.22,{settle:false});
    const exitAfter=(await state()).y;
    assert.ok(exitAfter-exitBefore>60 && exitAfter-exitBefore<height*.22+50,'new gesture exits with native finger distance');
    assert.equal((await state()).active,false);
    await swipe(-height*.4,{y:height*.3});await settled('collaborate');
    assert.equal((await state()).manualId,'naturgy');
    await swipe(-108);await settled('naturgy');
    // Choosing a new logo after native reverse entry still cancels all others.
    await select('mapfre');await swipe();await settled('collaborate');
    assert.equal((await state()).previousId,'mapfre');
    assert.equal(await page.locator('.city-tour-card').count(),11);
    assert.equal(await page.locator('.city-tour-card.is-current').count(),1);
    await page.screenshot({path:`${out}/${width}-manual-work.png`});
    await reset();assert.equal((await state()).nextId,'bbva');
    assert.deepEqual(errors,[]);
    report.normal.push({width,height,anchor,exitBefore,exitAfter,travel,exit,sameLogoCancels:true,changeChoice:true,reversePreservesChoice:true,explicitReset:true,errors});
    await context.close();console.log(`PASS normal ${width}x${height}: default 3+work, same-logo cancel, replace choice, native exit/reverse/reset`);
  }
  assert.equal(report.matrix.length,30);assert.equal(report.normal.length,3);
  report.passed=true;
}catch(error){report.error=error.stack;process.exitCode=1;console.error(error)}
finally{await fs.writeFile(`${out}/MANUAL-REPORT.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
