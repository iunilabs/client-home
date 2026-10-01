import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';

const out='docs/coordinacion-mano-2026-10-01/PULGAR-V3';
const baseline=JSON.parse(await readFile('docs/coordinacion-mano-2026-10-01/PARALLAX-1.5/REVISION.json','utf8'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={date:new Date().toISOString(),url:'http://127.0.0.1:4177/',scope:'Compiled thumb correction at820/1000; preserve poses and raw cursor light',frames:[],errors:[]};
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
  for(const [name,q] of Object.entries(before.fingerJoints))assert.ok(delta(state.scene.fingerJoints[name],q)<.001,name);
  assert.ok(state.scene.cursorLight.projectionError<1e-10);
  assert.ok(state.scene.cursorLight.intensity<=12.00001);
  assert.ok(Math.abs((state.scene.cursorLight.projection[0]+1)*712-712)<.01);
  assert.ok(Math.abs((1-state.scene.cursorLight.projection[1])*873/2-436)<.01);
  if(marker===1000)assert.ok(Math.abs(state.scene.contactGap-before.contactGap)<.002);
  await page.screenshot({path:`${out}/BUILD-${marker}.png`});report.frames.push({marker,state});
 }
 await page.close();assert.deepEqual(report.errors,[]);report.passed=true;
 console.log('✓ Compiled820/1000: poses, final gap and raw cursor light preserved; no rendering errors');
}catch(error){report.failure=error.stack;process.exitCode=1;console.error(error)}finally{
 await writeFile(`${out}/BUILD.json`,JSON.stringify(report,null,2));
 await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);process.exit(process.exitCode||0);
}
