// Smoke-test the compiled production scene at the scales where the hand ships.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.PUNTOES_URL||'http://127.0.0.1:4195';
const output=process.env.PUNTOES_PAGE_REPORT||'docs/nail-refinement-2026-10-01/page';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PUNTOES_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={date:new Date().toISOString(),base,frames:[],errors:[]};
try{
 for(const [name,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
  await page.goto(base+'/?scroll=250');
  await page.waitForFunction(()=>document.body.dataset.render==='webgl',null,{timeout:60000});
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#scene canvas')).opacity)>.99);
  for(const marker of [180,250,500,820,1000]){
   await page.evaluate(m=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*m/1000,behavior:'instant'}),marker);
   await page.waitForFunction(m=>Math.abs(window.__puntoes.getState().visualProgress-m/200)<.002,marker);
   const state=await page.evaluate(()=>window.__puntoes.getState());
   assert.equal(state.scene.handTriangles,5850);assert.equal(state.scene.poseAuthority,'absolute joint quaternion track');
   assert.ok(state.scene.humanVisible);assert.ok(state.scene.skinAtlas.endsWith('zero-skin-albedo-v4-lossless.webp'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`${output}/${name}-${marker}.png`});report.frames.push({name,viewport,marker,state});
  }
  await page.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;console.log('✓ Production hand: five scene landmarks on desktop and mobile; no shader errors or overflow');
}finally{await writeFile(`${output}/review.json`,JSON.stringify(report,null,2));await browser.close()}
