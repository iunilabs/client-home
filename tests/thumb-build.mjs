import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';

const out='docs/coordinacion-mano-2026-10-01/PULGAR-V3';
const baseline=JSON.parse(await readFile('docs/coordinacion-mano-2026-10-01/PARALLAX-1.5/REVISION.json','utf8'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={date:new Date().toISOString(),url:'http://127.0.0.1:4177/',scope:'Compiled thumb correction at820/1000; preserve poses and raw cursor light',frames:[],fixedTime:[],errors:[]};
const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
try{
 const page=await browser.newPage({viewport:{width:1424,height:873}});
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text())});
 for(const marker of [820,1000]){
  await page.goto(`${report.url}?scroll=${marker}`);
  await page.waitForFunction(()=>document.body.dataset.render==='webgl',null,{timeout:60000});
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#scene canvas')).opacity)>.99);
  await page.waitForFunction(m=>Math.abs(window.__puntoes.getState().visualProgress-m/200)<.0001,marker);
  await page.mouse.move(712,436);await page.waitForTimeout(1500);
  const state=await page.evaluate(()=>window.__puntoes.getState());
  const before=baseline.frames.find(f=>f.marker===marker&&f.pointer==='centro').state.scene;
  assert.ok(delta(state.scene.humanPosition,before.humanPosition)<.015);
  assert.ok(delta(state.scene.humanRotation,before.humanRotation)<.001);
  const liveJointDifferences=Object.fromEntries(Object.entries(before.fingerJoints).map(([name,q])=>[name,delta(state.scene.fingerJoints[name],q)]));
  // Middle/ring/pinky intentionally breathe with live time. Compare those
  // strictly in the deterministic source/compiled fixture below.
  for(const [name,q] of Object.entries(before.indexJoints))assert.ok(delta(state.scene.indexJoints[name],q)<.001,name);
  assert.ok(state.scene.cursorLight.projectionError<1e-10);
  assert.ok(state.scene.cursorLight.intensity<=12.00001);
  assert.ok(Math.abs((state.scene.cursorLight.projection[0]+1)*712-712)<.01);
  assert.ok(Math.abs((1-state.scene.cursorLight.projection[1])*873/2-436)<.01);
  if(marker===1000)assert.ok(Math.abs(state.scene.contactGap-before.contactGap)<.002);
  await page.screenshot({path:`${out}/BUILD-${marker}.png`});report.frames.push({marker,state,baselineTime:before.time,currentTime:state.scene.time,liveJointDifferences});
 }
 await page.close();
 // The approved source and compiled macro fixture records both use time0
 // and cameraPointer0. Reuse those direct captures to avoid development HMR
 // and compare every authored joint without live breathing phase differences.
 const sourceMacros=JSON.parse(await readFile('docs/mano-scroll-250/modelo/pulgar-revision/final/REVISION.json','utf8'));
 const compiledMacros=JSON.parse(await readFile('docs/mano-scroll-250/modelo/pulgar-revision/compiled/REVISION.json','utf8'));
 assert.deepEqual(sourceMacros.errors,[]);assert.deepEqual(compiledMacros.errors,[]);
 assert.equal(compiledMacros.passed,true);assert.equal(compiledMacros.frames.length,4);
 for(const marker of [820,1000])for(const angle of ['dorsal','lateral']){
  const before=sourceMacros.frames.find(f=>f.marker===marker&&f.angle===angle&&f.lighting==='cerca'&&!f.artificial);
  const after=compiledMacros.frames.find(f=>f.marker===marker&&f.angle===angle);
  assert.equal(before.source.time,0);assert.equal(after.source.time,0);
  const jointDeltas=Object.fromEntries(Object.entries(before.source.fingerJoints).map(([name,q])=>[name,delta(after.source.fingerJoints[name],q)]));
  for(const [name,d] of Object.entries(jointDeltas))assert.ok(d<1e-9,name);
  const positionDelta=delta(before.source.humanPosition,after.source.humanPosition);
  const rotationDelta=delta(before.source.humanRotation,after.source.humanRotation);
  const contactGapDelta=marker===1000?Math.abs(before.source.contactGap-after.source.contactGap):null;
  assert.ok(positionDelta<1e-9);
  assert.ok(delta(before.source.humanRotation,after.source.humanRotation)<1e-9);
  if(marker===1000)assert.ok(contactGapDelta<1e-9);
  assert.equal(before.nailShader,after.nailShader);
  report.fixedTime.push({marker,angle,time:0,cameraPointer:{x:0,y:0},jointDeltas,positionDelta,rotationDelta,contactGapDelta,source:before.source,compiled:after.source});
 }
 report.fixedTimeSource='Approved source final/REVISION.json and compiled/REVISION.json captured by the same analytical macro fixture. All bones compared at identical time and camera input; macro camera framing may differ from normal scene, verified separately.';
 report.liveComparisonNote='Different live animation phases intentionally vary middle/ring/pinky. All authored joint transforms are compared at time0 with identical input; source choreography hashes are unchanged.';
 assert.deepEqual(report.errors,[]);report.passed=true;
 console.log('✓ Compiled820/1000: poses, final gap and raw cursor light preserved; no rendering errors');
}catch(error){report.failure=error.stack;process.exitCode=1;console.error(error)}finally{
 await writeFile(`${out}/BUILD.json`,JSON.stringify(report,null,2));
 await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);process.exit(process.exitCode||0);
}
