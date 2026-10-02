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
const matrixOnly=process.env.MOBILE_MANUAL_PART==='matrix';
const selectedClients=process.env.MOBILE_MANUAL_CLIENTS?clients.filter(id=>process.env.MOBILE_MANUAL_CLIENTS.split(',').includes(id)):clients;
const profiles=[[320,568],[390,844],[430,932]].filter(([width])=>!process.env.MOBILE_MANUAL_WIDTH || width===Number(process.env.MOBILE_MANUAL_WIDTH));
assert.ok(selectedClients.length && profiles.length,'the requested smoke scope must contain clients and a viewport');
const expectedMatrixCases=normalOnly?0:selectedClients.length*3,expectedNormalCases=matrixOnly?0:profiles.length;
const report={url:base,passed:false,completeSuite:false,matrix:[],normal:[],scope:{clients:selectedClients,profiles,expectedMatrixCases,expectedNormalCases}};
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
    const chosen=await state(),count=chosen.collaborationSeen?'01 / 01':'01 / 02';
    assert.equal(chosen.manualId,id);assert.equal(chosen.nextId,chosen.collaborationSeen?null:'collaborate');
    await page.waitForFunction(expected=>document.querySelector('.city-tour-card.is-current .tour-card-count')?.textContent===expected,count);
    assert.equal(await page.locator('.city-tour-card.is-current .tour-card-count').textContent(),count);
  }
  async function reset({reload=false}={}) {
    const seen=(await state()).collaborationSeen;
    if(reload)await page.reload();else await page.locator('#open-clients').tap();
    await page.waitForFunction(()=>window.__puntoes?.getState().tour.active && window.__puntoes.getState().city?.ready);await settled('puntoes');
    assert.equal((await state()).manualId,null);assert.equal((await state()).nextId,'bbva');
    assert.equal((await state()).collaborationSeen,reload?false:seen,'only a page reload clears the invitation visit');
  }
  await page.goto(base+'?city=0');
  await page.waitForFunction(()=>window.__puntoes?.getState().tour.active && window.__puntoes.getState().city?.ready);
  await settled('puntoes');
  return {context,page,errors,state,settled,swipe,select,reset};
}
try {
  // All actual logo callbacks are exercised at the hub, mid-route and final
  // default stop. A cold route per case keeps the invitation history explicit.
  if (!normalOnly) {
  const matrix=await session(390,844,'reduce');
  for(const stage of ['hub','naturgy','collaborate'])for(const id of selectedClients) {
    await matrix.reset({reload:true});
    for(const stop of stage==='hub'?[]:stage==='naturgy'?['bbva','naturgy']:['bbva','naturgy','sabadell','collaborate']) {
      await matrix.swipe();await matrix.settled(stop);assert.equal((await matrix.state()).manualId,null);
    }
    await matrix.select(id);
    const seen=(await matrix.state()).collaborationSeen;
    const frames=await matrix.swipe();
    if(seen) {
      assert.equal((await matrix.state()).active,false,'a client selected after the invitation exits directly');
      assert.ok(frames.every(frame=>frame.id===id),'no repeated construction destination');
      await matrix.swipe(-844*.4,{y:844*.3});await matrix.settled(id);
      assert.equal((await matrix.state()).nextId,null);
    } else {
      await matrix.settled('collaborate');
      assert.ok(frames.every(frame=>frame.id===id || frame.id==='collaborate'),'no other company appears after choice');
      assert.equal((await matrix.state()).previousId,id);
      assert.equal(await matrix.page.locator('.city-tour-card.is-current .tour-card-count').textContent(),'02 / 02');
      await matrix.swipe(-108);await matrix.settled(id);
      assert.equal((await matrix.state()).nextId,null,'a reverse swipe cannot queue an invitation already seen');
    }
    report.matrix.push({stage,id,invitationAlreadySeen:seen,forward:seen?'native exit':'collaborate',reverse:id});
    console.log(`PASS touch ${stage} → ${id} → ${seen?'native exit':'collaboration'} → ${id}`);
  }
  assert.deepEqual(matrix.errors,[]);await matrix.context.close();
  }
  if(!matrixOnly)for(const [width,height] of profiles) {
    const {context,page,errors,state,settled,swipe,select,reset}=await session(width,height);
    const anchor=(await state()).y;
    // The first default route retains three companies plus construction.
    for(const id of ['bbva','naturgy','sabadell','collaborate']){await swipe();await settled(id);assert.equal((await state()).manualId,null)}
    assert.equal((await state()).collaborationSeen,true);
    await reset();await swipe();await settled('bbva');
    const beforeTap=await page.locator('.city-world').getAttribute('style');
    await select('bbva');assert.equal(await page.locator('.city-world').getAttribute('style'),beforeTap);
    await swipe(height*.22,{settle:false});assert.equal((await state()).active,false);
    await swipe(-height*.4,{y:height*.3});await settled('bbva');
    await select('cepsa');await select('naturgy');
    const exitBefore=(await state()).y;
    const exit=await swipe(height*.22,{settle:false});
    const exitAfter=(await state()).y;
    assert.ok(exitAfter-exitBefore>60 && exitAfter-exitBefore<height*.22+50,'a previously seen invitation exits with native finger distance');
    assert.equal((await state()).active,false);assert.equal((await state()).currentId,'naturgy');
    await swipe(-height*.4,{y:height*.3});await settled('naturgy');
    assert.equal((await state()).manualId,'naturgy');assert.equal((await state()).nextId,null);
    await reset();assert.equal((await state()).routeLength,3);
    // Reload starts a fresh page session: a manual choice can show the work.
    await reset({reload:true});
    await select('cepsa');await select('naturgy');
    const cameraBefore=await page.locator('.city-world').getAttribute('style');
    const travel=await swipe();await settled('collaborate');
    assert.ok(new Set(travel.map(frame=>frame.transform)).size>=4,'normal camera stays animated');
    assert.notEqual(await page.locator('.city-world').getAttribute('style'),cameraBefore);
    assert.ok(travel.every(frame=>Math.abs(frame.y-anchor)<2),'manual travel pins document');
    await swipe(-108);await settled('naturgy');
    await swipe(-108);await settled('puntoes');
    // Changing the logo after seeing the work does not resurrect it.
    await select('mapfre');await swipe(height*.22,{settle:false});
    assert.equal((await state()).active,false);assert.equal((await state()).currentId,'mapfre');
    await swipe(-height*.4,{y:height*.3});await settled('mapfre');
    assert.equal((await state()).nextId,null);
    assert.equal(await page.locator('.city-tour-card').count(),11);
    assert.equal(await page.locator('.city-tour-card.is-current').count(),1);
    await page.screenshot({path:`${out}/${width}-manual-seen-work.png`});
    await reset();assert.equal((await state()).nextId,'bbva');
    assert.deepEqual(errors,[]);
    report.normal.push({width,height,anchor,exitBefore,exitAfter,travel,exit,sameLogoCancels:true,changeChoice:true,reversePreservesChoice:true,explicitReset:true,invitationOncePerPage:true,reloadRestoresInvitation:true,errors});
    await context.close();console.log(`PASS normal ${width}x${height}: default 3+work, same-logo cancel, direct exit after seen work, reverse/reset/reload`);
  }
  assert.equal(report.matrix.length,expectedMatrixCases);assert.equal(report.normal.length,expectedNormalCases);
  report.completeSuite=expectedMatrixCases===30 && expectedNormalCases===3;
  report.passed=true;
}catch(error){report.error=error.stack;process.exitCode=1;console.error(error)}
finally{await fs.writeFile(`${out}/MANUAL-REPORT.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
