import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PUNTOES_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
const report={date:new Date().toISOString(),condition:'Chrome / SwiftShader, 1440 × 900; narrow viewport 320 × 780',checks:[],errors:[]};
const output='docs/capturas-perspectiva';await mkdir(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(process.env.PUNTOES_URL||'http://127.0.0.1:4173/');await page.waitForFunction(()=>document.body.dataset.render==='webgl'&&Number(getComputedStyle(document.querySelector('#scene canvas')).opacity)>.99);
 async function jump(p){await page.evaluate(p=>{const sections=[...document.querySelectorAll('[data-scene]')],i=Math.floor(p),a=sections[i].offsetTop,b=sections[i+1]?.offsetTop??document.querySelector('footer').offsetTop;window.scrollTo({top:a+(b-a)*(p-i),behavior:'instant'})},p);await page.waitForFunction(p=>{const s=window.__puntoes.getState();return Math.abs(s.progress-p)<.002&&Math.abs(s.visualProgress-s.progress)<.001},p)}
 async function side(x,y){await page.mouse.move(x,y);try{await page.waitForFunction(([x,y])=>{const s=window.__puntoes.getState();return Math.abs(s.pointer.x-(x/innerWidth*2-1))<.01&&Math.abs(s.pointer.y-(1-y/innerHeight*2))<.01},[x,y],{timeout:10000})}catch(e){console.error('Pointer state:',await page.evaluate(()=>window.__puntoes.getState()));throw e}return page.evaluate(()=>window.__puntoes.getState())}
 for(const [p,label] of [[.68,'inicio'],[5.68,'encuentro'],[8.5,'servicios']]){
  await jump(p);const left=await side(100,200);await page.screenshot({path:`${output}/${label}-izquierda.png`});const right=await side(1340,700);await page.screenshot({path:`${output}/${label}-derecha.png`});
  const nearDx=right.scene.screenLandmarks.foreground[0]-left.scene.screenLandmarks.foreground[0];
  assert.ok(Math.abs(right.scene.camera[0]-left.scene.camera[0])>1.5,'Camera must change perspective visibly');assert.ok(right.scene.screenLandmarks.foreground.every(Number.isFinite),'Visible foreground must project correctly');assert.ok(Math.abs(right.progress-left.progress)<.001,'Pointer must not advance story');
  if(p===5.68)assert.ok(left.scene.contactGap<1e-6&&right.scene.contactGap<1e-6);
  report.checks.push({name:`Perspectiva de cámara en ${label}`,nearDx,passed:true});console.log('✓ Perspectiva de cámara en '+label);
 }
 // A browser forwarding only mouse events must still drive the perspective.
 await page.evaluate(()=>window.dispatchEvent(new MouseEvent('mousemove',{clientX:720,clientY:450,bubbles:true})));await page.waitForFunction(()=>Math.abs(window.__puntoes.getState().pointer.x)<.01);report.checks.push({name:'Respuesta al evento mousemove sin pointermove',passed:true});
 await page.setViewportSize({width:320,height:780});
 for(let i=0;i<14;i++){
  await jump(i===13?13.18:i+.35);const rect=await page.locator('.chapter.is-active h1,.chapter.is-active h2').boundingBox();assert.ok(rect.x>=-1&&rect.x+rect.width<=321,'Title must fit narrow viewport');assert.ok(rect.y>=65&&rect.y+rect.height<730,'Title must remain between header and controls');
 }
 report.checks.push({name:'Títulos de las 14 escenas dentro del encuadre a 320 px',passed:true});assert.deepEqual(report.errors,[]);
}catch(error){report.failure=error.stack;console.error(error);process.exitCode=1}finally{await writeFile('docs/PERSPECTIVA.json',JSON.stringify(report,null,2));await browser.close()}
