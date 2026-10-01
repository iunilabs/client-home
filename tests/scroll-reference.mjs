import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.PUNTOES_URL||'http://127.0.0.1:4174';
const sourceBase=process.env.PUNTOES_SOURCE_URL||base;
const output='docs/mano-scroll-250';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PUNTOES_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={errors:[],date:new Date().toISOString(),url:base};
const targets={thumb:[917,646],index:[1046,213],middle:[1219,275],ring:[1281,443],pinky:[1260,518]};
const state=page=>page.evaluate(()=>window.__puntoes.getState());
async function marker(page,value){
 await page.evaluate(value=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*value/1000,behavior:'instant'}),value);
 await page.waitForFunction(value=>Number(document.querySelector('[data-scroll-number]').textContent)===value,value);
 await page.waitForFunction(()=>Math.abs(window.__puntoes.getState().visualProgress-window.__puntoes.getState().progress)<.001);
}
async function ready(page){
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto(`${base}/?scroll=250`);
 await page.waitForFunction(()=>window.__puntoes?.getState().render==='webgl',null,{timeout:45000});
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#scene canvas')).opacity)>.99);
 await page.waitForFunction(()=>document.querySelector('[data-scroll-number]').textContent==='0250');
}
try{
 const page=await browser.newPage({viewport:{width:1647,height:840}});await ready(page);
 report.reference=await state(page);const hand=report.reference.scene.screenLandmarks.hand;
 assert.ok(report.reference.scene.referencePoseWeight>.999);
 for(const[role,target]of Object.entries(targets))assert.ok(Math.hypot(hand[role][0]-target[0],hand[role][1]-target[1])<50,`${role}: match the user's reference silhouette`);
 assert.ok(hand.index[1]<hand.middle[1]&&hand.middle[1]<hand.ring[1]&&hand.ring[1]<hand.pinky[1]);
 assert.ok(hand.thumb[0]<hand.index[0]&&hand.thumb[1]>hand.pinky[1]);
 await page.screenshot({path:`${output}/final-scroll-250.png`});
 report.neighbours=[];
 for(const value of [245,255]){await marker(page,value);const s=await state(page);report.neighbours.push({marker:value,state:s});for(const role of Object.keys(hand))assert.ok(Math.hypot(...s.scene.screenLandmarks.hand[role].map((v,i)=>v-hand[role][i]))<30,'The reference pose must blend continuously');}
 await marker(page,350);await marker(page,250);const returned=(await state(page)).scene.screenLandmarks.hand;
 for(const role of Object.keys(hand))assert.ok(Math.hypot(...returned[role].map((v,i)=>v-hand[role][i]))<.3,'Reverse scroll must restore the authored pose');
 await page.close();
 const study=await browser.newPage();await study.goto(`${sourceBase}/mano.html`);await study.waitForFunction(()=>window.__handStudio?.getState().ready);
 report.reset=await study.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js'),{createReferenceHand}=await import('/src/reference-hand.js'),{scroll250Joints}=await import('/src/hand-scroll-reference.js'),renderer=new T.WebGLRenderer(),hand=await createReferenceHand(renderer,{detail:1});
  hand.pose([.9,.9,.9,.9,.9]);const before=hand.jointTips();let finite=true;
  for(const blend of [.5,1]){hand.pose([.2,.2,.2,.2,.2]);hand.applyJointPose(scroll250Joints,blend);for(const mesh of [hand.skin,hand.hair,...hand.nails].filter(Boolean))for(let i=0;i<mesh.geometry.attributes.position.count;i++){const p=mesh.getVertexPosition(i,new T.Vector3());finite&&=[p.x,p.y,p.z].every(Number.isFinite)}}
  hand.pose([.9,.9,.9,.9,.9]);const after=hand.jointTips();renderer.dispose();return{before,after,finite};
 });assert.ok(report.reset.finite);assert.deepEqual(report.reset.before,report.reset.after);
 const phone=await browser.newPage({viewport:{width:390,height:844}});await ready(phone);report.mobile=await state(phone);
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await phone.screenshot({path:`${output}/final-scroll-250-movil.png`});
 for(const[role,tip]of Object.entries(report.mobile.scene.screenLandmarks.hand))assert.ok(tip[0]>0&&tip[0]<390&&tip[1]>0&&tip[1]<844,`${role}: keep the gesture in the mobile frame`);
 await phone.close();
 assert.deepEqual(report.errors,[]);console.log('✓ Scroll 250: referencia, transición, retorno, encuadre móvil y restauración del rig');
}finally{await writeFile(`${output}/VALIDACION.json`,JSON.stringify(report,null,2));await browser.close()}
