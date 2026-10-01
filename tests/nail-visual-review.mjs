// Anatomical macro review using the production hand and its actual joint track.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.PUNTOES_URL||'http://127.0.0.1:4180';
const output=process.env.PUNTOES_NAIL_REPORT||'docs/nail-refinement-2026-10-01/final';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PUNTOES_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={date:new Date().toISOString(),base,frames:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1000,height:800}});
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.route('**/__nail_review__.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0;background:#edf3f8}canvas{display:block}</style>'}));
 await page.goto(base+'/__nail_review__.html');
 await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js');
  const {RoomEnvironment}=await import('/node_modules/three/examples/jsm/environments/RoomEnvironment.js');
  const {createReferenceHand}=await import('/src/reference-hand.js');
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1000,800);renderer.setPixelRatio(1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;document.body.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#edf3f8');const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(new RoomEnvironment(),.06);scene.environment=env.texture;
  const key=new T.DirectionalLight('#fff7f0',2.6);scene.add(key,key.target);scene.add(new T.HemisphereLight('#eff7ff','#8b6a57',1.4));
  const hand=await createReferenceHand(renderer,{detail:1});scene.add(hand.root);
  const camera=new T.PerspectiveCamera(32,1000/800,.001,50);
  window.__nailReview={frame(role,angle,curl){
   hand.pose(Array(5).fill(curl));hand.root.updateMatrixWorld(true);hand.skin.onBeforeRender();
   const nail=hand.nails.find(n=>role==='thumb'?n.name.startsWith('DEF-thumb'):n.name.startsWith('DEF-f_'+role)),g=nail.geometry,world=[],center=new T.Vector3(),normal=new T.Vector3();
   for(let i=0;i<g.attributes.position.count;i++){const p=nail.getVertexPosition(i,new T.Vector3()).applyMatrix4(nail.matrixWorld);world.push(p);center.add(p)}center.divideScalar(world.length);
   for(let i=0;i<g.index.count;i+=3){const[a,b,c]=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)];normal.add(world[b].clone().sub(world[a]).cross(world[c].clone().sub(world[a])))}normal.normalize();
   const bone=nail.skeleton.bones.find(b=>nail.name===b.name+'-nail'),along=new T.Vector3(0,1,0).transformDirection(bone.matrixWorld),side=new T.Vector3().crossVectors(along,normal).normalize();
   const direction=angle==='dorsal'?normal.clone().addScaledVector(along,.1):normal.clone().multiplyScalar(.4).addScaledVector(side,.92);
   camera.up.copy(along);camera.position.copy(center).addScaledVector(direction.normalize(),role==='thumb'?.9:.7);camera.lookAt(center);camera.updateMatrixWorld();
   key.position.copy(center).addScaledVector(normal,1.8).addScaledVector(side,-1.2).addScaledVector(along,.6);key.target.position.copy(center);key.target.updateMatrixWorld();renderer.render(scene,camera);
   return{role,angle,curl,vertices:g.attributes.position.count,triangles:g.index.count/3,drawCalls:renderer.info.render.calls,renderTriangles:renderer.info.render.triangles,center:center.toArray(),material:{roughness:nail.material.roughness,opacity:nail.material.opacity},fit:nail.userData.fit??null};
  }};
 });
 for(const curl of [0,.7])for(const role of ['thumb','index','middle','ring','pinky'])for(const angle of ['dorsal','lateral']){
  report.frames.push(await page.evaluate(({role,angle,curl})=>window.__nailReview.frame(role,angle,curl),{role,angle,curl}));
  await page.screenshot({path:`${output}/${role}-${angle}-${curl}.png`});
 }
 if(report.errors.length)throw new Error(report.errors.join('\n'));
 console.log(JSON.stringify({frames:report.frames.length,errors:report.errors}));
}finally{await writeFile(`${output}/review.json`,JSON.stringify(report,null,2));await browser.close()}
