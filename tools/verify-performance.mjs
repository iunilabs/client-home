import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from '../../reference-assets/prehistoric-stones/flint-core/tools/node_modules/sharp/dist/index.mjs';
const out='docs/performance-2026-10-01',browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={errors:[],comparisons:[],timings:[]};
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto('http://127.0.0.1:4182/');await page.waitForFunction(()=>window.__puntoes?.getState().scene?.tools.every(t=>t.loaded),null,{timeout:60000});await page.waitForTimeout(500);
 const before=JSON.parse(await readFile(`${out}/before-states.json`,'utf8'));
 for(const marker of [0,250,500,820,1000]){await page.evaluate(m=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*m/1000),marker);await page.waitForTimeout(600);await page.screenshot({path:`${out}/after-${marker}.png`});const state=await page.evaluate(()=>window.__puntoes.getState());const old=before.find(s=>s.marker===marker).state;for(const key of ['humanPosition','humanRotation','aiPosition','aiRotation','handTriangles','contactGap','screenLandmarks'])assert.deepEqual(state.scene[key],old.scene[key],`${marker} ${key}`);
  const a=await sharp(`${out}/before-${marker}.png`).raw().toBuffer(),b=await sharp(`${out}/after-${marker}.png`).raw().toBuffer();let changed=0,total=0,max=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d)changed++;total+=d;max=Math.max(max,d)}report.comparisons.push({marker,changedChannels:changed,meanDifference:total/a.length,maxDifference:max});
 }
 // Validate the baked field against the original data and the live geometry.
 const cache=await page.evaluate(async()=>{const THREE=await import('http://127.0.0.1:4180/node_modules/.vite/deps/three.js');const {createReferenceHand}=await import('http://127.0.0.1:4180/src/reference-hand.js');const {skinGeometryKey}=await import('http://127.0.0.1:4180/src/skin-cache.js');const renderer=new THREE.WebGLRenderer();const hand=await createReferenceHand(renderer,{detail:1});return {key:skinGeometryKey(hand.skin.geometry),correction:Array.from(hand.skin.geometry.attributes.skinSeamCorrection.array)}});
 const baked=JSON.parse(await readFile('public/textures/mano/skin-seams-v1.json','utf8'));assert.equal(cache.key,baked.key);assert.deepEqual(cache.correction,baked.correction);report.bakedCorrectionsExact=true;
 assert.deepEqual(report.errors,[]);
 // A slow later object must no longer hold the initial scene hostage.
 const delayed=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let release;const gate=new Promise(r=>release=r);await delayed.route('**/models/adjustable-wrench/**',async route=>{await gate;await route.continue()});await delayed.goto('http://127.0.0.1:4182/');await delayed.waitForFunction(()=>window.__puntoes?.getState().scene,null,{timeout:30000});const s=await delayed.evaluate(()=>window.__puntoes.getState());assert.equal(s.render,'webgl');assert.equal(s.scene.tools.find(t=>t.id==='llave').loaded,false);release();await delayed.waitForFunction(()=>window.__puntoes.getState().scene.tools.every(t=>t.loaded));report.initialSceneIndependentOfWrench=true;await delayed.close();
 console.log(JSON.stringify(report,null,2));
}finally{await writeFile(`${out}/verification.json`,JSON.stringify(report,null,2));await browser.close()}
