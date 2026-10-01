import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';

const base=process.env.PUNTOES_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({executablePath:process.env.PUNTOES_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const output='docs/modelos-3d';await mkdir(output,{recursive:true});
const results={date:new Date().toISOString(),url:base,rendering:'Chromium headless / SwiftShader software',models:[],errors:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',error=>results.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')results.errors.push(message.text())});
  await page.goto(`${base}/modelos.html`);await page.waitForFunction(()=>window.__modelStudio?.getState().ready,{timeout:30000});
  results.hands=await page.evaluate(()=>window.__modelStudio.validateHands());
  for(const hand of results.hands){assert.ok(hand.finitePositions);assert.ok(hand.maxWeightError<1e-6);assert.ok(hand.triangles>40000)}
  assert.equal((await page.evaluate(()=>window.__modelStudio.getState())).nails,5);
  for(const id of ['human','ai','stone','compass','wrench','mouse','gear','point']){
    await page.locator(`[data-model="${id}"]`).click();await page.waitForFunction(id=>window.__modelStudio.getState().active===id,id);
    await page.screenshot({path:`${output}/estudio-${id}.png`});const state=await page.evaluate(()=>window.__modelStudio.getState());
    assert.ok(state.triangles>0);assert.equal(await page.locator('#model-list [aria-pressed=true]').count(),1);results.models.push(state);
  }
  await page.locator('[data-model="human"]').click();
  for(const value of [0,1.05,.18]){await page.locator('#pose').evaluate((element,value)=>{element.value=value;element.dispatchEvent(new Event('input',{bubbles:true}))},value);assert.ok((await page.evaluate(()=>window.__modelStudio.validateHands())).every(hand=>hand.finitePositions&&hand.finiteDeformed))}
  for(const light of ['warm','rim','studio']){await page.locator(`[data-light="${light}"]`).click();assert.equal(await page.locator(`[data-light="${light}"]`).getAttribute('aria-pressed'),'true')}
  await page.locator('#rotate').click();assert.equal(await page.locator('#rotate').getAttribute('aria-pressed'),'true');await page.locator('#rotate').click();
  await page.locator('#reset').click();await page.screenshot({path:`${output}/estudio-piel.png`});
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  phone.on('pageerror',error=>results.errors.push(error.message));await phone.goto(`${base}/modelos.html`);await phone.waitForFunction(()=>window.__modelStudio?.getState().ready);
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await phone.locator('[data-model="mouse"]').tap();await phone.screenshot({path:`${output}/estudio-movil.png`,fullPage:true});
  await phone.goto(base);await phone.waitForFunction(()=>document.body.dataset.render==='webgl');
  // The intro deliberately hides the hand; inspect a chapter where it is visible.
  await phone.evaluate(()=>window.scrollTo({top:document.querySelectorAll('[data-scene]')[1].offsetTop,behavior:'instant'}));
  await phone.waitForFunction(()=>window.__puntoes.getState().scene.humanVisible&&window.__puntoes.getState().scene.triangles>0);
  results.mobileScene=await phone.evaluate(()=>window.__puntoes.getState().scene);assert.ok(results.mobileScene.handTriangles>30000);assert.ok(results.mobileScene.triangles>0);
  assert.deepEqual(results.errors,[]);console.log('✓ Ocho modelos, uñas, pesos de articulación, luces, gestos y visor móvil');
}finally{await writeFile(`${output}/VALIDACION.json`,JSON.stringify(results,null,2));await browser.close()}
