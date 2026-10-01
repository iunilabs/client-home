import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const compiled=process.env.COMPASS_COMPILED==='1',base=process.env.COMPASS_URL||(compiled?'http://127.0.0.1:4177':'http://127.0.0.1:4180'),out=process.env.COMPASS_OUT||'docs/coordinacion-mano-2026-10-01/COMPAS-50/candidato',markers=(process.env.COMPASS_MARKERS||'440,490,500,515,550,580').split(',').map(Number),width=Number(process.env.COMPASS_WIDTH||1424),height=Number(process.env.COMPASS_HEIGHT||873);
await fs.mkdir(out,{recursive:true});const assets=await fs.readdir('dist-intro/assets');
const modules=compiled?{three:'/assets/'+assets.find(x=>/^hand-deformation-.*\.js$/.test(x)),hand:'/assets/'+assets.find(x=>/^reference-hand-.*\.js$/.test(x)),scene:'/assets/'+assets.find(x=>/^scene-.*\.js$/.test(x)),compiled}:{three:'/node_modules/.vite/deps/three.js',hand:'/src/reference-hand.js',scene:'/src/scene.js',compiled};
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await b.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
let html=compiled?await fs.readFile('dist-intro/index.html','utf8'):'<!doctype html><html><head></head><body></body></html>';
html=html.replace('</head>','<style>body{margin:0;overflow:hidden}body>*{display:none!important}#elbow-review{display:block!important;position:fixed;inset:0;background:radial-gradient(ellipse at 45% 30%,white 25%,#edf5f8 70%,#b5d0e1 100%)}#elbow-review canvas{display:block;opacity:1}</style></head>').replace('</body>','<div id="elbow-review"></div></body>');
const framingModule=(await fs.readFile('src/tool-framing.js','utf8')).replace("import * as THREE from 'three';",'const THREE=window.__compassMath;');if(compiled)await page.route('**/src/tool-framing.js',route=>route.fulfill({contentType:'text/javascript',body:framingModule}));
await page.route('**/__elbow_review__.html',route=>route.fulfill({contentType:'text/html',body:html}));
const report={date:new Date().toISOString(),base,modules,viewport:{width,height},frames:[],errors};
try{
 await page.goto(base+'/__elbow_review__.html');
 await page.evaluate(async modules=>{
  const math=await import(modules.three),T=modules.compiled?{Vector3:Object.values(math).find(v=>v?.prototype?.isVector3)}:math,handModule=await import(modules.hand),factory=modules.compiled?handModule.t:handModule.createReferenceHand,{createExperience}=await import(modules.scene);let hands,renderer,scene,camera;
  const experience=await createExperience(document.querySelector('#elbow-review'),{onReady(){},onFailure(e){throw e},async handFactory(r){renderer=r;hands=await Promise.all([factory(r,{detail:1}),factory(r,{detail:1,artificial:true})]);const original=r.render.bind(r);r.render=(s,c)=>{scene=s;camera=c;return original(s,c)};return hands}});
  renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
  const hand=hands[0],world=b=>b.getWorldPosition(new T.Vector3()),project=v=>{v=v.clone().project(camera);return [(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2]},bones=hand.skin.skeleton.bones;
  function silhouette(){
   const actors=scene.children.filter(o=>o.isGroup),saved=actors.map(o=>o.visible),gl=renderer.getContext(),w=renderer.domElement.width,h=renderer.domElement.height,step=2,cols=Math.ceil(w/step),rows=Math.ceil(h/step);
   function mask(id){actors.forEach(o=>{o.visible=o.name===id});renderer.render(scene,camera);const pixels=new Uint8Array(w*h*4),mask=new Uint8Array(cols*rows);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>20)mask[Math.floor((h-1-y)/step)*cols+Math.floor(x/step)]=1;return mask}
   const a=mask('human-hand'),b=mask('tool-compas');actors.forEach((o,i)=>o.visible=saved[i]);renderer.render(scene,camera);
   const edge=m=>{const out=[];for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const i=y*cols+x;if(m[i]&&(!m[i-1]||!m[i+1]||!m[i-cols]||!m[i+cols]))out.push([x,y])}return out},ea=edge(a),eb=edge(b);let overlaps=0,min=Infinity,pair=[];for(let i=0;i<a.length;i++)if(a[i]&&b[i])overlaps++;
   for(const from of ea)for(const to of eb){const distance=(from[0]-to[0])**2+(from[1]-to[1])**2;if(distance<min){min=distance;pair=[from,to]}}
   return {overlapSamples:overlaps,gapPixels:Math.sqrt(min)*step*innerWidth/w,nearestScreen:pair.map(v=>[v[0]*step*innerWidth/w,v[1]*step*innerHeight/h]),resolution:[w,h],sampleStep:step,method:'Separate alpha masks rendered with actual deformed skin, nails, hair and compass materials; sampled at2physical pixels.'};
  }
  window.__compassMath=T;const {measureToolFraming}=await import('/src/tool-framing.js');const group=scene.getObjectByName('tool-compas');group.updateMatrixWorld(true);const inv=group.matrixWorld.clone().invert(),spec={group,points:[],triangles:[]};group.traverse(o=>{if(!o.isMesh)return;const matrix=inv.clone().multiply(o.matrixWorld),a=o.geometry.attributes.position,indices=o.geometry.index?.array??Array.from({length:a.count},(_,i)=>i);for(let i=0;i<a.count;i++)spec.points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(matrix));for(let i=0;i<indices.length;i+=3)spec.triangles.push([0,1,2].map(j=>new T.Vector3().fromBufferAttribute(a,indices[i+j]).applyMatrix4(matrix)))});window.__elbowProbe={experience,hand,renderer,scene,get camera(){return camera},T,silhouette,frame(marker,pointer={x:0,y:0},time=0,framing=false){
   experience.render(marker/200,pointer,time,false,marker/1000,pointer);
   const state=experience.getState(),joints=Object.fromEntries(bones.map(b=>[b.name,{p:b.position.toArray(),q:b.quaternion.toArray(),world:world(b).toArray(),screen:project(world(b))}]));
   return {marker,pointer,time,state,joints,cameraQuaternion:camera.quaternion.toArray(),fov:camera.fov,framing:framing?group.visible?measureToolFraming(spec,camera,innerWidth,innerHeight):null:null};
  }};
 },modules);
 for(const marker of markers){const f=await page.evaluate(marker=>{const p=window.__elbowProbe,f=p.frame(marker,{x:0,y:0},0,true);if(f.framing)f.silhouette=p.silhouette();return f},marker);report.frames.push(f);await page.screenshot({path:`${out}/${width}-${marker}.png`});console.log(JSON.stringify({marker,framing:f.framing?.bounds,gap:f.silhouette?.gapPixels,overlap:f.silhouette?.overlapSamples,index:f.state.screenFingerTips.index}));}
 if(process.env.COMPASS_CORNERS==='1'){report.pointerExtremes=[];for(const marker of [490,500,515])for(const x of [-1,1])for(const y of [-1,1]){const f=await page.evaluate(({marker,x,y})=>{const p=window.__elbowProbe,f=p.frame(marker,{x,y},0,true);f.silhouette=p.silhouette();return f},{marker,x,y});report.pointerExtremes.push(f)}}
 if(process.env.COMPASS_CONTACT==='1'){report.physical=[];for(const marker of [450,490,500,515,550,570]){const f=await page.evaluate(marker=>{const p=window.__elbowProbe;p.frame(marker);return {marker,clearance:p.experience.measureClearances().compas}},marker);assert.equal(f.clearance.intersectingTriangles,0);report.physical.push(f)}}
 if(process.env.COMPASS_VALIDATE==='1'){
  for(const f of [...report.frames,...(report.pointerExtremes??[])])if(f.silhouette){assert.equal(f.silhouette.overlapSamples,0,`Projected crossing ${f.marker}/${JSON.stringify(f.pointer)}`);assert.ok(f.silhouette.gapPixels>=6,`Insufficient clearance ${f.marker}/${JSON.stringify(f.pointer)}: ${f.silhouette.gapPixels}`)}
  for(const f of report.frames.filter(f=>[490,500,515].includes(f.marker))){assert.deepEqual(f.framing.scale,[3.975,3.975,3.975]);assert.ok(f.framing.bounds.right>width*.95&&f.framing.bounds.right<width*1.02);assert.ok(f.framing.bounds.top>65&&f.framing.bounds.top<110);assert.ok(f.framing.silhouetteVisibleFraction>.98)}
  report.acceptanceValidated=true;
 }
 assert.deepEqual(errors,[]);report.passed=true;
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e)}finally{await fs.writeFile(out+'/ESTADOS.json',JSON.stringify(report,null,2));await Promise.race([b.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(process.exitCode||errors.length?1:0)}
