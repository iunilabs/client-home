import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base=process.env.PUNTOES_URL||'http://127.0.0.1:4174';
const output=process.env.PUNTOES_SURFACE_REPORT||'docs/mano-scroll-250/modelo/SUPERFICIES.json';
const browser=await chromium.launch({executablePath:process.env.PUNTOES_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage();await page.goto(`${base}/mano.html`);
 await page.waitForFunction(()=>window.__handStudio?.getState().ready,null,{timeout:60000});
 const report=await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js'),{createReferenceHand}=await import('/src/reference-hand.js'),{correctFingerPads}=await import('/src/ventral-skin.js'),{createSkinContinuity}=await import('/src/skin-continuity.js'),{createPoseTrack}=await import('/src/hand-poses.js'),{humanFrames,aiFrames,wrenchHandFrames}=await import('/src/choreography.js');
  const renderer=new T.WebGLRenderer(),report={date:new Date().toISOString(),models:[]};
  for(const detail of [1,2])for(const artificial of [false,true]){
   const hand=await createReferenceHand(renderer,{artificial,detail}),g=hand.skin.geometry,bones=hand.skin.skeleton.bones,groups=new Map();
   for(let i=0;i<g.attributes.position.count;i++){const key=new T.Vector3().fromBufferAttribute(g.attributes.position,i).toArray().map(v=>v.toFixed(6)).join(','),ids=groups.get(key)??[];ids.push(i);groups.set(key,ids)}
   const seams=[...groups.values()].filter(ids=>ids.length>1&&ids.some(i=>Math.abs(g.attributes.uv.getX(i)-g.attributes.uv.getX(ids[0]))+Math.abs(g.attributes.uv.getY(i)-g.attributes.uv.getY(ids[0]))>.001));
   const shaderKey=hand.material.customProgramCacheKey(),padding=artificial?null:correctFingerPads(hand),continuity=artificial?null:await createSkinContinuity(hand,renderer);
   const r={artificial,detail,nails:hand.nails.length,atlas:hand.material.map?.image?{width:hand.material.map.image.width,height:hand.material.map.image.height}:null,idempotent:hand.material.customProgramCacheKey()===shaderKey,skinCorrections:continuity?.seams,pads:padding?.map(p=>({role:p.role,vertices:p.corrected})),poses:[]};
   if(!artificial){
    const mask=g.attributes.fingerPadMask,uv=g.attributes.fingerPadUv;
    r.correctedUv={finite:Array.from(uv.array).every(Number.isFinite),seamPairs:0,maximumSeamDelta:0};
    for(const ids of seams){const corrected=ids.filter(id=>mask.getX(id)>.99);for(const id of corrected.slice(1)){const first=corrected[0];r.correctedUv.seamPairs++;r.correctedUv.maximumSeamDelta=Math.max(r.correctedUv.maximumSeamDelta,Math.hypot(uv.getX(id)-uv.getX(first),uv.getY(id)-uv.getY(first)))}}
   }
   const track=createPoseTrack(hand,artificial?aiFrames:humanFrames,!artificial&&wrenchHandFrames?{start:.75,end:.9,frames:wrenchHandFrames}:undefined),markers=artificial?[.9,.92,.935,.95,.97,.985,1]:[.18,.25,.50,.75,.78,.80,.82,.835,.85,.88,.9,1],cases=[{type:'curl',value:0},{type:'curl',value:.5},{type:'curl',value:1},...markers.map(value=>({type:'track',value}))];
   if(artificial){
    const names=bones.filter(b=>b.name.startsWith('DEF-f_index')).map(b=>b.name);
    r.indexDuringApproach=[];
    for(let step=0;step<=50;step++){
     const value=.9+step*.002;track.apply(value,0,true);
     r.indexDuringApproach.push({value,joints:names.map(name=>({name,extensionDeviation:new T.Quaternion(...hand.metadata.bones[name].bindQuaternion).angleTo(bones.find(b=>b.name===name).quaternion)}))});
    }
    track.apply(.935,0,true);const once=bones.map(b=>b.quaternion.toArray());track.apply(1,0,true);track.apply(.935,0,true);
    r.reverseDrift=Math.max(...bones.flatMap((b,i)=>b.quaternion.toArray().map((v,j)=>Math.abs(v-once[i][j]))));
   }
   for(const pose of cases){
    if(pose.type==='curl')hand.pose(Array(5).fill(pose.value));else track.apply(pose.value,0,true);
    hand.skin.onBeforeRender();let seamGap=0;
    for(const ids of seams){const first=hand.skin.getVertexPosition(ids[0],new T.Vector3());for(const id of ids.slice(1))seamGap=Math.max(seamGap,first.distanceTo(hand.skin.getVertexPosition(id,new T.Vector3())))}
    const nails=[];
    for(const nail of hand.nails){
     const boneId=bones.findIndex(b=>nail.name===b.name+'-nail'),triangles=[];
     for(let i=0;i<g.index.count;i+=3){const ids=[g.index.array[i],g.index.array[i+1],g.index.array[i+2]];if(!ids.some(i=>{let weight=0;for(let j=0;j<4;j++)if(g.attributes.skinIndex.array[i*4+j]===boneId)weight+=g.attributes.skinWeight.array[i*4+j];return weight>.25}))continue;triangles.push(new T.Triangle(...ids.map(id=>hand.skin.getVertexPosition(id,new T.Vector3()))))}
     let minimum=Infinity,maximum=-Infinity,distance=0,finite=true,interiorMinimum=Infinity,interiorMaxDistance=0,interiorSamples=0;
     const p=new T.Vector3(),closest=new T.Vector3(),n=new T.Vector3(),vertices=[];
     function measure(point){let best=Infinity,signed=0;for(const tri of triangles){tri.closestPointToPoint(point,closest);const d=point.distanceToSquared(closest);if(d<best){best=d;signed=p.copy(point).sub(closest).dot(tri.getNormal(n))}}return{signed,distance:Math.sqrt(best)}}
     for(let i=0;i<nail.geometry.attributes.position.count;i++){
      const point=nail.getVertexPosition(i,new T.Vector3());vertices.push(point);finite&&=point.toArray().every(Number.isFinite);const sample=measure(point);
      minimum=Math.min(minimum,sample.signed);maximum=Math.max(maximum,sample.signed);distance=Math.max(distance,sample.distance);
     }
     // Corner-only tests miss skin ridges breaking through the middle of a
     // fitted plate. Check every face centre and each shared perimeter edge.
     const meshIndex=nail.geometry.index.array,uv=nail.geometry.attributes.nailUV,edges=new Set(),samplePoint=new T.Vector3();
     function interior(point){const sample=measure(point);interiorMinimum=Math.min(interiorMinimum,sample.signed);interiorMaxDistance=Math.max(interiorMaxDistance,sample.distance);interiorSamples++}
     for(let i=0;i<meshIndex.length;i+=3){const ids=[meshIndex[i],meshIndex[i+1],meshIndex[i+2]];samplePoint.copy(vertices[ids[0]]).add(vertices[ids[1]]).add(vertices[ids[2]]).multiplyScalar(1/3);interior(samplePoint);
      for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;if(edges.has(key))continue;edges.add(key);if(uv&&Math.max(Math.abs(uv.getX(a)),Math.abs(uv.getY(a)),Math.abs(uv.getX(b)),Math.abs(uv.getY(b)))<.65)continue;samplePoint.copy(vertices[a]).lerp(vertices[b],.5);interior(samplePoint)}
     }
     nails.push({name:nail.name,vertices:nail.geometry.attributes.position.count,minimum,maximum,maxDistance:distance,finite,interiorMinimum,interiorMaxDistance,interiorSamples,fit:nail.userData.fit});
    }
    // Measure articulation in an unmirrored hand frame. Three's signed world
    // scale otherwise reverses the diagnostic's towards-pulp sign when the
    // scene mirrors the whole hand, although the anatomical bend is unchanged.
    const mirror=hand.root.scale.y;hand.root.scale.y=Math.abs(mirror);
    const thumbMotion=hand.thumbMotion();hand.root.scale.y=mirror;hand.root.updateMatrixWorld(true);
    r.poses.push({...pose,seamGap,nails,thumbMotion});
   }
   hand.pose(Array(5).fill(0));const before=hand.jointTips();track.apply(.5,0,true);hand.pose(Array(5).fill(0));r.returnDrift=Math.max(...Object.keys(before).flatMap(k=>before[k].map((v,i)=>Math.abs(v-hand.jointTips()[k][i]))));
   report.models.push(r);
  }
  renderer.dispose();return report;
 });
 await writeFile(output,JSON.stringify(report,null,2));
 for(const model of report.models){
  assert.equal(model.nails,5);assert.equal(model.returnDrift,0);assert.ok(model.idempotent);
  if(model.artificial){assert.equal(model.reverseDrift,0);assert.equal(model.indexDuringApproach.length,51);for(const sample of model.indexDuringApproach)for(const joint of sample.joints)assert.ok(joint.extensionDeviation<.035,`${joint.name}: porcelain index must stay extended at ${sample.value}`)}
  if(!model.artificial){assert.ok(model.skinCorrections.seeds>100);assert.equal(model.pads.length,5);assert.ok(model.correctedUv.finite);assert.ok(model.correctedUv.seamPairs>10);assert.ok(model.correctedUv.maximumSeamDelta<1e-5,`Corrected fingertip UVs must join across atlas islands: ${model.correctedUv.maximumSeamDelta}`)}
  for(const pose of model.poses){assert.ok(pose.seamGap<.00002,`UV boundaries must remain physically joined: ${pose.seamGap}`);for(const nail of pose.nails){assert.ok(nail.vertices>10&&nail.finite);assert.ok(nail.fit.continuous,`${nail.name}: continuous outline required`);assert.ok(nail.interiorSamples>nail.vertices);assert.ok(nail.interiorMinimum>0,`${nail.name}: skin must not break through the plate interior: ${nail.interiorMinimum}`);assert.ok(nail.interiorMaxDistance<.0004,`${nail.name}: plate interior must remain attached`);assert.ok(nail.minimum>-.00008,`${nail.name}: plate must not enter its skin bed`);assert.ok(nail.maxDistance<.0004,`${nail.name}: plate must remain attached to its curved bed`)}if(!model.artificial)for(const joint of pose.thumbMotion){assert.ok(joint.towardsPad>-.0000001,`${joint.joint}: thumb must not flex away from its pulp at ${pose.value}`);assert.ok(joint.lateralDeviation<.000001,`${joint.joint}: thumb must stay in its anatomical flexion plane at ${pose.value}`)}}
 }
 console.log('✓ Ambos niveles: interiores y bordes de uñas sin penetración, UV continuas en los dedos, costuras cerradas, retorno reproducible e índice porcelana extendido');
}finally{await browser.close()}
