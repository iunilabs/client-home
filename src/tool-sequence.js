import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {smooth,mix} from './timeline.js';
import {measureToolFraming} from './tool-framing.js';

export async function createToolSequence(scene,{deferred=false}={}){
 const draco=new DRACOLoader().setDecoderPath('/decoders/draco/'),loader=new GLTFLoader().setDRACOLoader(draco);
 const specs=[{id:'piedra',source:'/models/flint-core/flint-core-web.glb',start:.205,peak:.245,endStart:.26,end:.385,scale:.80,rotation:[.15,.30,.20]},
  {id:'compas',source:'/models/drafting-compass/drafting-compass-web.glb',start:.44,peak:.49,endStart:.515,end:.58,scale:3.975,rotation:[.08,.30,-.18]},
  {id:'llave',source:'/models/adjustable-wrench/adjustable-wrench-web.glb',start:.68,peak:.735,endStart:.835,end:.885,scale:4.2,rotation:[.14,.36,.60]}];
 for(const spec of specs){const group=new THREE.Group();group.name='tool-'+spec.id;scene.add(group);spec.group=group;group.scale.setScalar(spec.scale);group.visible=false;spec.materials=new Set()}
 // Keep the hundreds of thousands of diagnostic vectors out of visitor startup.
 function diagnostics(spec,triangles=false){
  if(spec.points&&(!triangles||spec.triangles))return;
  spec.group.updateMatrixWorld(true);const inverse=spec.group.matrixWorld.clone().invert();
  spec.points??=[];if(triangles)spec.triangles=[];
  const needPoints=spec.points.length===0;
  spec.object.traverse(o=>{if(!o.isMesh)return;const matrix=inverse.clone().multiply(o.matrixWorld),p=o.geometry.attributes.position;
   if(needPoints)for(let i=0;i<p.count;i++)spec.points.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix));
   if(triangles){const indices=o.geometry.index?.array??Array.from({length:p.count},(_,i)=>i);for(let i=0;i<indices.length;i+=3)spec.triangles.push([0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,indices[i+j]).applyMatrix4(matrix)))}
  });
 }
 let loading,disposed=false;
 function load(){return loading??=Promise.all(specs.map(async spec=>{
  const gltf=await loader.loadAsync(spec.source);if(disposed){gltf.scene.traverse(o=>{o.geometry?.dispose();for(const m of [].concat(o.material??[])){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose()}});return}spec.object=gltf.scene;spec.group.add(spec.object);
  const unique=new Map();spec.object.traverse(o=>{if(!o.isMesh)return;o.material=[].concat(o.material).map(m=>{if(!unique.has(m)){const clone=m.clone();clone.transparent=true;unique.set(m,clone);spec.materials.add(clone)}return unique.get(m)});if(o.material.length===1)o.material=o.material[0]});spec.loaded=true;
 })).finally(()=>draco.dispose())}
 if(!deferred)await load();
 let last=[];const anchors={};
 return {load,dispose(){disposed=true;if(!loading)draco.dispose()},get ready(){return specs.every(s=>s.loaded)},measureFraming(id,camera,width,height,probePoints){const spec=specs.find(s=>s.id===id);if(!spec?.loaded||!spec.group.visible)return null;diagnostics(spec,true);return measureToolFraming(spec,camera,width,height,384,probePoints)},projectFrames(camera,width,height){return specs.filter(s=>s.group.visible).map(s=>{diagnostics(s);let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;const v=new THREE.Vector3();for(const p of s.points){v.copy(p).applyMatrix4(s.group.matrixWorld).project(camera);const x=(v.x+1)*width/2,y=(1-v.y)*height/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}return{id:s.id,bounds:{left,right,top,bottom},cameraDepth:camera.position.distanceTo(s.group.position)}})},setAnchor(id,anchor){anchors[id]=anchor.clone()},objects:specs,render(ratio,time=0,reduced=false,camera,neutralCamera,wrenchReferenceCamera){last=specs.map(spec=>{
  const alpha=smooth(spec.start,spec.peak,ratio)*(1-smooth(spec.endStart,spec.end,ratio));spec.group.visible=!!spec.loaded&&alpha>.003;
  if(spec.group.visible){const enter=smooth(spec.start,spec.peak,ratio),exit=smooth(spec.endStart,spec.end,ratio),anchor=anchors[spec.id];spec.group.position.copy(anchor).add(new THREE.Vector3(mix(.30,0,enter)+exit*(spec.id==='llave'?.10:.48),mix(-.18,0,enter)+exit*(spec.id==='llave'?-.10:.18),mix(-.25,0,enter)-exit*.10));spec.group.rotation.set(spec.rotation[0]+.10*enter-.08*exit,spec.rotation[1]+.12*enter+(spec.id==='piedra'&&!reduced?time*(2*Math.PI/24):0),spec.rotation[2]+.08*enter-.09*exit);
   if(spec.id==='llave'&&wrenchReferenceCamera)spec.group.quaternion.premultiply(neutralCamera.quaternion.clone().multiply(wrenchReferenceCamera.quaternion.clone().invert()));
   if((spec.id==='piedra'||spec.id==='llave')&&camera&&neutralCamera){const position=spec.group.position,reference=position.clone().project(neutralCamera),actual=position.clone().project(camera),weight=spec.id==='piedra'?.95:(.90-.72*smooth(.75,.80,ratio)*(1-smooth(.85,.9,ratio))),x=mix(actual.x,reference.x,weight),y=mix(actual.y,reference.y,weight),forward=camera.getWorldDirection(new THREE.Vector3()),depth=position.clone().sub(camera.position).dot(forward),ray=new THREE.Vector3(x,y,.5).unproject(camera).sub(camera.position).normalize();position.copy(camera.position).addScaledVector(ray,depth/ray.dot(forward));const correction=camera.quaternion.clone().multiply(neutralCamera.quaternion.clone().invert());correction.slerp(new THREE.Quaternion(),spec.id==='piedra'?.10:.20);spec.group.quaternion.premultiply(correction)}for(const m of spec.materials){m.opacity=alpha;m.depthWrite=alpha>.98}}
  return{id:spec.id,source:spec.source,loaded:!!spec.loaded,visible:spec.group.visible,opacity:alpha,position:spec.group.position.toArray(),rotation:spec.group.rotation.toArray().slice(0,3)};
 })},getState:()=>last};
}
