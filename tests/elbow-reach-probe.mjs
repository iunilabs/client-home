import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const compiled=process.env.ELBOW_COMPILED==='1',base=process.env.ELBOW_URL||(compiled?'http://127.0.0.1:4177':'http://127.0.0.1:4180'),out=process.env.ELBOW_OUT||'docs/coordinacion-mano-2026-10-01/CODO-630/candidato',markers=(process.env.ELBOW_MARKERS||'630,650,750,820,835,850,880,900,1000').split(',').map(Number),width=Number(process.env.ELBOW_WIDTH||1424),height=Number(process.env.ELBOW_HEIGHT||873);
await fs.mkdir(out,{recursive:true});const assets=await fs.readdir('dist-intro/assets');
const modules=compiled?{three:'/assets/'+assets.find(x=>/^hand-deformation-.*\.js$/.test(x)),hand:'/assets/'+assets.find(x=>/^reference-hand-.*\.js$/.test(x)),scene:'/assets/'+assets.find(x=>/^scene-.*\.js$/.test(x)),compiled}:{three:'/node_modules/.vite/deps/three.js',hand:'/src/reference-hand.js',scene:'/src/scene.js',compiled};
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await b.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
let html=compiled?await fs.readFile('dist-intro/index.html','utf8'):'<!doctype html><html><head></head><body></body></html>';
html=html.replace('</head>','<style>body{margin:0;overflow:hidden}body>*{display:none!important}#elbow-review{display:block!important;position:fixed;inset:0;background:radial-gradient(ellipse at 45% 30%,white 25%,#edf5f8 70%,#b5d0e1 100%)}#elbow-review canvas{display:block;opacity:1}</style></head>').replace('</body>','<div id="elbow-review"></div></body>');
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
   const a=mask('human-hand'),b=mask('tool-llave');actors.forEach((o,i)=>o.visible=saved[i]);renderer.render(scene,camera);
   const edge=m=>{const out=[];for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const i=y*cols+x;if(m[i]&&(!m[i-1]||!m[i+1]||!m[i-cols]||!m[i+cols]))out.push([x,y])}return out},ea=edge(a),eb=edge(b);let overlaps=0,min=Infinity,pair=[];for(let i=0;i<a.length;i++)if(a[i]&&b[i])overlaps++;
   for(const from of ea)for(const to of eb){const distance=(from[0]-to[0])**2+(from[1]-to[1])**2;if(distance<min){min=distance;pair=[from,to]}}
   return {overlapSamples:overlaps,gapPixels:Math.sqrt(min)*step*innerWidth/w,nearestScreen:pair.map(v=>[v[0]*step*innerWidth/w,v[1]*step*innerHeight/h]),resolution:[w,h],sampleStep:step,method:'Separate alpha masks rendered with actual deformed skin, nails, hair and wrench materials; sampled at2physical pixels.'};
  }
  window.__elbowProbe={experience,hand,renderer,scene,get camera(){return camera},T,silhouette,frame(marker,pointer={x:0,y:0},time=0,framing=false){
   experience.render(marker/200,pointer,time,false,marker/1000,pointer);
   const state=experience.getState(),joints=Object.fromEntries(bones.map(b=>[b.name,{p:b.position.toArray(),q:b.quaternion.toArray(),world:world(b).toArray(),screen:project(world(b))}]));
   return {marker,pointer,time,state,joints,cameraQuaternion:camera.quaternion.toArray(),fov:camera.fov,framing:framing?experience.measureWrenchFraming():null};
  }};
 },modules);
 for(const marker of markers){const frame=await page.evaluate(marker=>window.__elbowProbe.frame(marker,{x:0,y:0},0,true),marker);await page.screenshot({path:`${out}/${width}-${marker}.png`});report.frames.push(frame);console.log(JSON.stringify({marker,elbow:frame.joints['DEF-forearmL'].world,wrist:frame.joints['DEF-handL'].world,index:frame.state.screenFingerTips.index,framing:frame.framing?.silhouetteVisibleFraction}));}
 if(process.env.ELBOW_VALIDATE==='1'){
  const [start,end,step]=(process.env.ELBOW_RANGE||'630,900,5').split(',').map(Number);report.continuous=[];for(let marker=start;marker<=end;marker+=step){const f=await page.evaluate(marker=>{const probe=window.__elbowProbe,frame=probe.frame(marker);if(marker>=695&&marker<=880)frame.silhouette=probe.silhouette();return frame},marker);report.continuous.push(f)}
  report.pointerExtremes=[];for(const marker of [750,820,835,850])for(const x of [-1,1])for(const y of [-1,1]){const f=await page.evaluate(({marker,x,y})=>{const probe=window.__elbowProbe,frame=probe.frame(marker,{x,y});frame.silhouette=probe.silhouette();return frame},{marker,x,y});report.pointerExtremes.push(f)}
  report.reverse=[];for(const marker of [900,850,835,820,750,650,630])report.reverse.push(await page.evaluate(marker=>window.__elbowProbe.frame(marker),marker));
  for(const marker of [630,820]){await page.evaluate(marker=>{const f=window.__elbowProbe.frame(marker),p=f.joints['DEF-forearmL'].screen,el=document.createElement('div');el.id='anchor-label';el.style.cssText=`position:absolute;left:${p[0]-10}px;top:${p[1]-10}px;border:2px solid #0076be;border-radius:50%;width:20px;height:20px;color:#005489;font:14px Arial;white-space:nowrap;z-index:100`;el.textContent=`Codo · ${p.map(v=>v.toFixed(1)).join(', ')} px`;document.querySelector('#elbow-review').append(el)},marker);await page.screenshot({path:`${out}/${width}-${marker}-ancla.png`});await page.evaluate(()=>document.querySelector('#anchor-label').remove())}
 }
 if(process.env.ELBOW_VARIANTS==='1'){
  report.variants=[];
  for(const axis of ['x','y','z'])for(const angle of [-.3,.3]){const result=await page.evaluate(({axis,angle})=>{const f=window.__elbowProbe;f.frame(820);const wrist=f.hand.scene.getObjectByName('DEF-handL');wrist.quaternion.multiply(new f.T.Quaternion().setFromAxisAngle(new f.T.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0),angle));f.hand.root.updateMatrixWorld(true);f.hand.skin.onBeforeRender?.();f.renderer.render(f.scene,f.camera);const tips=Object.fromEntries(Object.entries(f.hand.jointTips()).map(([role,v])=>{const p=f.hand.scene.parent.localToWorld(new f.T.Vector3(...v)).project(f.camera);return[role,[(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2]]}));return{axis,angle,tips}}, {axis,angle});await page.screenshot({path:`${out}/wrist-${axis}-${angle}.png`});report.variants.push(result);}
 }
 if(process.env.ELBOW_CONTACT==='1'){report.physical=[];for(const marker of [750,820,835,850,880]){const f=await page.evaluate(marker=>{const p=window.__elbowProbe;p.frame(marker);return {marker,clearance:p.experience.measureClearances().llave}},marker);assert.equal(f.clearance.intersectingTriangles,0);report.physical.push(f)}}
 if(process.env.ELBOW_VALIDATE==='1'){
  const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i]))),reference=report.frames.find(f=>f.marker===630),pinned=report.continuous.filter(f=>f.marker>630&&f.marker<=835);
  for(const f of pinned){assert.ok(delta(f.joints['DEF-forearmL'].world,reference.joints['DEF-forearmL'].world)<1e-7);assert.ok(delta(f.joints['DEF-forearmL'].screen,reference.joints['DEF-forearmL'].screen)<1e-5);assert.deepEqual(f.state.humanScale,[1,-1,1])}
  for(const f of [...report.continuous,...report.pointerExtremes]){if(f.silhouette){assert.equal(f.silhouette.overlapSamples,0,`Overlap ${width}/${f.marker}/${JSON.stringify(f.pointer)}`);assert.ok(f.silhouette.gapPixels>4)}if(f.marker>=750&&f.marker<=850)for(const [role,xy]of Object.entries(f.state.screenFingerTips)){assert.ok(xy[0]>1&&xy[0]<width-1&&xy[1]>75&&xy[1]<height-1,`${width}/${f.marker}/${role} cropped ${xy}`)}}
  for(const f of report.reverse){const forward=report.frames.find(v=>v.marker===f.marker);if(forward)for(const name of Object.keys(f.joints))for(const k of ['p','q','world'])assert.ok(delta(f.joints[name][k],forward.joints[name][k])<1e-7)}
  report.passed=true;
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/ESTADOS.json',JSON.stringify(report,null,2));
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e)}finally{await fs.writeFile(out+'/ESTADOS.json',JSON.stringify(report,null,2));await Promise.race([b.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(process.exitCode||errors.length?1:0)}
