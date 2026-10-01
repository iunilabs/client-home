import * as THREE from 'three';
import {bakedSkinSeams} from './skin-cache.js';
import {SKIN_ASSETS} from './skin-assets.js';

// Match both sides of the hand's UV boundaries in linear colour. Corrections
// travel over each island's surface, fading within 10 mm; palm creases keep
// their photographed detail. Geometry, UVs, rig and the source atlas stay intact.
export function matchHandSeams(hand){
 const geometry=hand.skin.geometry,{position,uv}=geometry.attributes,map=hand.material.map;
 const canvas=document.createElement('canvas');canvas.width=map.image.width;canvas.height=map.image.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(map.image,0,0);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
 const colour=new THREE.Color(),groups=new Map(),adjacency=Array.from({length:position.count},()=>new Map());
 const point=new THREE.Vector3(),other=new THREE.Vector3();
 function sampleUv(u,v){
  const x=THREE.MathUtils.clamp(Math.round(u*(canvas.width-1)),0,canvas.width-1),y=THREE.MathUtils.clamp(Math.round((1-v)*(canvas.height-1)),0,canvas.height-1),offset=(y*canvas.width+x)*4;
  if(pixels[offset]+pixels[offset+1]+pixels[offset+2]<48){
   // The adapted atlas has an unpadded black background. Match the skin
   // immediately inside an island, rather than matching against that void.
   let found=false;
   for(let radius=1;radius<=12&&!found;radius++)for(const[dx,dy]of [[radius,0],[-radius,0],[0,radius],[0,-radius]]){
    const px=THREE.MathUtils.clamp(x+dx,0,canvas.width-1),py=THREE.MathUtils.clamp(y+dy,0,canvas.height-1),at=(py*canvas.width+px)*4;
    if(pixels[at]+pixels[at+1]+pixels[at+2]<96)continue;
    colour.setRGB(pixels[at]/255,pixels[at+1]/255,pixels[at+2]/255,THREE.SRGBColorSpace);found=true;break;
   }
   if(found)return colour.toArray();
  }
  return colour.setRGB(pixels[offset]/255,pixels[offset+1]/255,pixels[offset+2]/255,THREE.SRGBColorSpace).toArray();
 }
 function sample(id){
  function finish(u,v){
   const value=sampleUv(u,v),fold=geometry.attributes.skinCreaseArea?.getX(id)??1;if(fold>=.8)return value;
   const local=[0,0,0];for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++){const nearby=sampleUv(u+x*13/canvas.width,v+y*13/canvas.height),weight=(x===0?2:1)*(y===0?2:1)/16;for(let c=0;c<3;c++)local[c]+=nearby[c]*weight}
   return value.map((x,c)=>THREE.MathUtils.lerp(local[c],x,.02+.98*fold*fold));
  }
  const value=finish(uv.getX(id),uv.getY(id)),blend=geometry.attributes.fingerPadMask?.getX(id)??0,pad=geometry.attributes.fingerPadUv;
  if(!blend||!pad)return value;
  const source=finish(pad.getX(id),pad.getY(id));return value.map((v,i)=>THREE.MathUtils.lerp(v,source[i],blend));
 }
 for(let i=0;i<position.count;i++){
  point.fromBufferAttribute(position,i);const key=point.toArray().map(v=>v.toFixed(6)).join(',');
  const group=groups.get(key)??[];group.push(i);groups.set(key,group);
 }
 const indices=geometry.index.array;
 for(let i=0;i<indices.length;i+=3)for(let edge=0;edge<3;edge++){
  const a=indices[i+edge],b=indices[i+(edge+1)%3],length=point.fromBufferAttribute(position,a).distanceTo(other.fromBufferAttribute(position,b));
  adjacency[a].set(b,length);adjacency[b].set(a,length);
 }
 const offsets=new Float32Array(position.count*3),distances=new Float32Array(position.count).fill(Infinity),sources=new Int32Array(position.count).fill(-1),pending=new Set();let seeds=0;
 for(const group of groups.values()){
  if(group.length<2||position.getX(group[0])<-.050)continue;
  if(!group.some(id=>Math.abs(uv.getX(id)-uv.getX(group[0]))+Math.abs(uv.getY(id)-uv.getY(group[0]))>.001))continue;
  const samples=group.map(sample),average=[0,0,0];for(const value of samples)for(let c=0;c<3;c++)average[c]+=value[c]/samples.length;
  group.forEach((id,i)=>{for(let c=0;c<3;c++)offsets[id*3+c]=average[c]-samples[i][c];distances[id]=0;sources[id]=id;pending.add(id);seeds++});
 }
 // Multi-source Dijkstra stays within each UV island, avoiding colour transfer
 // across the palm to the back of the hand or between adjacent bent fingers.
 const radius=.010;
 while(pending.size){
  let id=-1,shortest=Infinity;for(const candidate of pending)if(distances[candidate]<shortest){id=candidate;shortest=distances[candidate]}
  pending.delete(id);
  for(const [next,length]of adjacency[id]){
   const distance=shortest+length;if(distance>=radius||distance>=distances[next])continue;
   distances[next]=distance;sources[next]=sources[id];pending.add(next);
  }
 }
 const correction=new Float32Array(offsets.length);let blended=0;
 for(let i=0;i<position.count;i++)if(sources[i]>=0){
  const fade=1-THREE.MathUtils.smoothstep(distances[i],0,radius);for(let c=0;c<3;c++)correction[i*3+c]=offsets[sources[i]*3+c]*fade;blended++;
 }
 // Relax the interior field while retaining exact boundary colour matching.
 // Nearest-seed propagation alone creates abrupt patches between seeds with
 // different corrections, particularly around the finger bases.
 let current=correction,next=new Float32Array(correction.length);
 for(let step=0;step<40;step++){
  next.set(current);
  for(let i=0;i<position.count;i++){
   if(distances[i]===0||sources[i]<0)continue;
   let total=0;const sum=[0,0,0];
   for(const[id,length]of adjacency[i]){const weight=1/Math.max(length,.00001);total+=weight;for(let c=0;c<3;c++)sum[c]+=current[id*3+c]*weight}
   if(total)for(let c=0;c<3;c++)next[i*3+c]=sum[c]/total;
  }
  [current,next]=[next,current];
 }
 geometry.setAttribute('skinSeamCorrection',new THREE.BufferAttribute(current,3));
 return {seeds,blended,radius};
}

// The supplied arm atlas has separate islands with different baked tones.
// A continuous photographic projection in rest space removes these seams and
// follows the rig without texture sliding. Mirrored wrapping avoids tile jumps.
export async function createSkinContinuity(hand,renderer,preloadedTexture){
 if(hand.skinContinuity)return hand.skinContinuity;
 const material=hand.material,uniforms=material.userData.uniforms;
 if(!uniforms?.forearmBlendEnabled)return null;
 const texture=preloadedTexture??await new THREE.TextureLoader().loadAsync(SKIN_ASSETS.forearm);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;
 texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 uniforms.forearmMap.value=texture;uniforms.forearmBlendEnabled.value=1;
 uniforms.skinContinuityEnabled={value:1};
 const baked=hand.surface==='adapted'?await bakedSkinSeams(hand.skin.geometry):null;
 if(baked)hand.skin.geometry.setAttribute('skinSeamCorrection',new THREE.BufferAttribute(new Float32Array(baked.correction),3));
 const seams=baked?baked.seams:matchHandSeams(hand),previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  previous(shader,renderer);
  shader.vertexShader='attribute vec3 skinSeamCorrection;\nvarying vec3 vSkinSeamCorrection;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSkinSeamCorrection=skinSeamCorrection;');
  shader.fragmentShader='uniform float skinContinuityEnabled;\nvarying vec3 vSkinSeamCorrection;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace(
   'float armBlend=(1.0-smoothstep(-.065,-.023,vSkinPosition.x))*forearmBlendEnabled;',
   'diffuseColor.rgb=max(vec3(0.0),diffuseColor.rgb+vSkinSeamCorrection*skinContinuityEnabled);\nfloat armBlend=(1.0-smoothstep(-.045,.030,vSkinPosition.x))*forearmBlendEnabled;'
  );
 };
 material.customProgramCacheKey=()=>`${key}:continuous-arm-and-hand-v3`;material.needsUpdate=true;
 hand.skinContinuity={texture,kind:'continuous photographic arm projection with hand UV colour matching',wristBlend:[-.045,.030],seams};
 return hand.skinContinuity;
}
