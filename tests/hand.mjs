import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';

const base=process.env.PUNTOES_URL||'http://127.0.0.1:4174';
const output='docs/mano-realista';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PUNTOES_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={date:new Date().toISOString(),url:base,rendering:'Chrome / SwiftShader software',views:[],gestures:[],errors:[]};
function checkRig(validation){assert.ok(validation.finite&&validation.hairFinite&&validation.nailsFinite);assert.ok(validation.maxWeightError<1e-6&&validation.hairWeightError<1e-6&&validation.nailWeightError<1e-6);assert.equal(validation.hairAttached,true);assert.equal(validation.nailsAttached,true);assert.ok(validation.forearmStrands>100)}
function checkThumb(validation){for(const joint of validation.thumbMotion){assert.ok(joint.towardsPad>.001,`${joint.joint}: thumb must flex towards its pulp`);assert.ok(joint.lateralDeviation<1e-6,`${joint.joint}: thumb must stay in its own flexion plane`)}}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',error=>report.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text())});
  await page.goto(`${base}/mano.html`);await page.waitForFunction(()=>window.__handStudio?.getState().ready,{timeout:60000});
  report.initial=await page.evaluate(()=>window.__handStudio.getState());assert.equal(report.initial.hairStrands,2400);assert.equal(report.initial.nailBeds,5);assert.ok(report.initial.triangles>20000);assert.equal(report.initial.joints,24);assert.equal(report.initial.source,'Zero supplied reference');
  for(const view of ['reference','dorsum','palm','profile','knuckles','skin','vellus']){
    await page.locator(`[data-pose="${view==='reference'?'point':'open'}"]`).click();
    await page.locator(`button[data-view="${view}"]`).click();await page.waitForTimeout(200);
    const validation=await page.evaluate(()=>window.__handStudio.validate());checkRig(validation);
    assert.equal(await page.locator('button[data-view][aria-pressed=true]').count(),1);
    await page.screenshot({path:`${output}/final-${view}.png`});report.views.push({view,...validation});
  }
  await page.locator('[data-pose="fist"]').click();
  for(const view of ['dorsum','profile','palm']){
    await page.locator(`button[data-view="${view}"]`).click();assert.equal((await page.evaluate(()=>window.__handStudio.getState())).pose,'fist');
    checkRig(await page.evaluate(()=>window.__handStudio.validate()));await page.screenshot({path:`${output}/final-puno-${view}.png`});
  }
  report.closed=await page.evaluate(()=>window.__handStudio.validate());
  checkThumb(report.closed);
  await page.locator('[data-pose="open"]').click();report.open=await page.evaluate(()=>window.__handStudio.validate());
  for(const role of ['index','middle','ring','pinky']){assert.ok(report.closed.jointTips[role][0]<report.open.jointTips[role][0]-.035,`${role} must fold back towards the palm`);assert.ok(report.closed.jointTips[role][0]>.025)}
  await page.locator('[data-pose="fist"]').click();const repeated=await page.evaluate(()=>window.__handStudio.validate());assert.deepEqual(repeated.jointTips,report.closed.jointTips,'Closing after reopening must be independent of pose history');
  await page.locator('[data-pose="open"]').click();assert.equal((await page.evaluate(()=>window.__handStudio.getState())).pose,'open');
  await page.locator('button[data-view="dorsum"]').click();
  for(const value of [0,.55,.9]){
    await page.locator('#gesture').evaluate((element,value)=>{element.value=value;element.dispatchEvent(new Event('input',{bubbles:true}))},value);
    const validation=await page.evaluate(()=>window.__handStudio.validate());checkRig(validation);report.gestures.push({value,...validation});
    if(value>.4)checkThumb(validation);
  }
  assert.ok(Math.hypot(...report.gestures[0].tip.map((coordinate,i)=>coordinate-report.gestures[2].tip[i]))>.2,'The articulated tip must move with the finger');
  await page.locator('button[data-view="reference"]').click();await page.locator('#gesture').evaluate(element=>{element.value=.9;element.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal((await page.evaluate(()=>window.__handStudio.getState())).pose,'manual','Reference view must not lock the index when the user closes the hand');
  await page.locator('button[data-view="vellus"]').click();
  for(const light of ['neutral','raking','back']){
    await page.locator(`[data-light="${light}"]`).click();assert.equal((await page.evaluate(()=>window.__handStudio.getState())).light,light);
    await page.screenshot({path:`${output}/final-vello-${light}.png`});
  }
  await page.locator('#pores').uncheck();assert.equal((await page.evaluate(()=>window.__handStudio.getState())).pores,0);await page.locator('#pores').check();
  await page.locator('#vellus').uncheck();await page.screenshot({path:`${output}/final-sin-vello.png`});await page.locator('#vellus').check();
  await page.locator('button[data-view="dorsum"]').click();await page.locator('[data-pose="open"]').click();
  await page.locator('#source-texture').click();await page.waitForFunction(()=>window.__handStudio.getState().surface==='original');await page.screenshot({path:`${output}/final-zero-original.png`});
  await page.locator('#source-texture').click();await page.waitForFunction(()=>window.__handStudio.getState().surface==='adapted');
  await page.locator('[data-hand="porcelain"]').click();await page.waitForFunction(()=>window.__handStudio.getState().model==='porcelain');
  assert.equal((await page.evaluate(()=>window.__handStudio.getState())).joints,24);assert.equal((await page.evaluate(()=>window.__handStudio.getState())).hairStrands,0);
  assert.equal(await page.locator('#pores').isDisabled(),true);assert.equal(await page.locator('#vellus').isDisabled(),true);
  await page.screenshot({path:`${output}/final-porcelana-abierta.png`});await page.locator('[data-pose="fist"]').click();
  const porcelainClosed=await page.evaluate(()=>window.__handStudio.validate());assert.ok(porcelainClosed.finite);checkThumb(porcelainClosed);report.porcelainClosed=porcelainClosed;await page.screenshot({path:`${output}/final-porcelana-puno.png`});
  await page.locator('[data-hand="human"]').click();await page.waitForFunction(()=>window.__handStudio.getState().model==='human');
  await page.locator('#previous').click();await page.waitForFunction(()=>window.__handStudio.getState().comparison);await page.screenshot({path:`${output}/final-anterior.png`});
  await page.locator('#previous').click();await page.waitForFunction(()=>!window.__handStudio.getState().comparison);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  mobile.on('pageerror',error=>report.errors.push(error.message));await mobile.goto(`${base}/mano.html`);await mobile.waitForFunction(()=>window.__handStudio?.getState().ready,{timeout:60000});
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await mobile.screenshot({path:`${output}/final-movil.png`,fullPage:true});
  await mobile.locator('button[data-view="vellus"]').tap();await mobile.locator('[data-light="raking"]').tap();checkRig(await mobile.evaluate(()=>window.__handStudio.validate()));
  assert.deepEqual(report.errors,[]);console.log('✓ Mano y antebrazo: siete vistas, flexión del pulgar hacia la yema, uñas articuladas, luces y móvil');
}finally{await writeFile(`${output}/VALIDACION.json`,JSON.stringify(report,null,2));await browser.close()}
