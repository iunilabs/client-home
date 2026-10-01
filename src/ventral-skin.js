import * as THREE from 'three';

// Replace painted nail colour on the finger pad with photographed skin from
// the same finger. The anatomical dorsal side and its fitted nail stay intact.
export function correctFingerPads(hand){
 if(hand.padCorrections)return hand.padCorrections;
 const g=hand.skin.geometry,{position,normal,uv,skinIndex,skinWeight}=g.attributes;
 const mask=new Float32Array(position.count),skinUv=new Float32Array(uv.array);
 const p=new THREE.Vector3(),n=new THREE.Vector3(),delta=new THREE.Vector3();
 hand.root.updateMatrixWorld(true);
 const corrections=[];
 for(const role of ['thumb','index','middle','ring','pinky']){
  const prefix=role==='thumb'?'thumb':`f_${role}`;
  const distalName=THREE.PropertyBinding.sanitizeNodeName(`DEF-${prefix}.03.L`);
  const middleName=THREE.PropertyBinding.sanitizeNodeName(`DEF-${prefix}.02.L`);
  const distal=hand.metadata?.bones[distalName],proximal=hand.metadata?.bones[middleName];
  const nail=hand.scene.getObjectByName(`${distalName}-nail`);
  if(!distal||!proximal||!nail)continue;
  const head=new THREE.Vector3(...distal.head),tail=new THREE.Vector3(...distal.tail),direction=tail.clone().sub(head).normalize(),length=head.distanceTo(tail);
  nail.geometry.computeBoundingBox();const centre=nail.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(nail.matrixWorld);hand.skin.worldToLocal(centre);
  const dorsal=centre.sub(head);dorsal.addScaledVector(direction,-dorsal.dot(direction)).normalize();
  const boneId=hand.skin.skeleton.bones.findIndex(b=>b.name===distalName),midId=hand.skin.skeleton.bones.findIndex(b=>b.name===middleName);
  const sources=[],dorsalSources=[];
  for(let i=0;i<position.count;i++){
   let weight=0;for(let j=0;j<4;j++)if(skinIndex.array[i*4+j]===midId)weight+=skinWeight.array[i*4+j];
   const facing=n.fromBufferAttribute(normal,i).dot(dorsal);
   if(weight>.6&&facing<-.35)sources.push(i);
   if(role==='thumb'&&weight>.6&&facing>.35)dorsalSources.push(i);
  }
  // Interpolate the proximal thumb's UV over its actual source triangles.
  // Copying a nearest vertex makes one flat colour patch per source vertex.
  const dorsalTriangles=[],sourceSet=new Set(dorsalSources);
  if(role==='thumb')for(let i=0;i<g.index.count;i+=3){
   const ids=[g.index.array[i],g.index.array[i+1],g.index.array[i+2]];
   if(!ids.every(id=>sourceSet.has(id)))continue;
   dorsalTriangles.push({ids,triangle:new THREE.Triangle(...ids.map(id=>new THREE.Vector3().fromBufferAttribute(position,id)))});
  }
  const sourceCentre=role==='thumb'?new THREE.Vector3(...proximal.head).lerp(new THREE.Vector3(...proximal.tail),.5).addScaledVector(dorsal,.005):null;
  const dorsalPatch=dorsalTriangles.reduce((best,source)=>!best||source.triangle.getMidpoint(new THREE.Vector3()).distanceToSquared(sourceCentre)<best.triangle.getMidpoint(new THREE.Vector3()).distanceToSquared(sourceCentre)?source:best,null);
  let corrected=0;
  for(let i=0;i<position.count;i++){
   let weight=0;for(let j=0;j<4;j++)if(skinIndex.array[i*4+j]===boneId)weight+=skinWeight.array[i*4+j];
   if(weight<.15)continue;
   p.fromBufferAttribute(position,i);const along=delta.copy(p).sub(head).dot(direction)/length;
   const facing=n.fromBufferAttribute(normal,i).dot(dorsal),ventral=1-THREE.MathUtils.smoothstep(facing,-.45,-.05);
   // The thumb's old grey painted plate must not remain visible beside its
   // fitted curved nail. Restore dorsal skin from the proximal thumb beneath
   // that separate plate; the pulp continues to use its ventral source.
   const dorsalThumb=role==='thumb'?THREE.MathUtils.smoothstep(facing,.05,.55)*THREE.MathUtils.smoothstep(along,.12,.35):0;
   const blend=Math.max(ventral*THREE.MathUtils.smoothstep(along,.05,.35),dorsalThumb)*THREE.MathUtils.smoothstep(weight,.15,.6),candidates=dorsalThumb>ventral?dorsalSources:sources;
   if(!blend||!candidates.length)continue;
   const target=p.clone().addScaledVector(direction,-length*.85);let best=-1,distance=Infinity;
   for(const id of candidates){const d=delta.fromBufferAttribute(position,id).distanceToSquared(target);if(d<distance){distance=d;best=id}}
   mask[i]=blend;
   if(candidates===dorsalSources&&dorsalPatch){
    // One affine patch keeps the sampling continuous across the destination
    // triangles, instead of interpolating UVs from different source islands.
    const barycentric=dorsalPatch.triangle.getBarycoord(target,new THREE.Vector3()),[a,b,c]=dorsalPatch.ids;
    skinUv[i*2]=uv.getX(a)*barycentric.x+uv.getX(b)*barycentric.y+uv.getX(c)*barycentric.z;skinUv[i*2+1]=uv.getY(a)*barycentric.x+uv.getY(b)*barycentric.y+uv.getY(c)*barycentric.z;
   }else{skinUv[i*2]=uv.getX(best);skinUv[i*2+1]=uv.getY(best)}
   corrected++;
  }
  corrections.push({role,corrected,dorsal:dorsal.toArray()});
 }
 g.setAttribute('fingerPadMask',new THREE.BufferAttribute(mask,1));g.setAttribute('fingerPadUv',new THREE.BufferAttribute(skinUv,2));
 const material=hand.material,previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 material.userData.uniforms.fingerPadFixEnabled={value:1};
 material.onBeforeCompile=(shader,renderer)=>{
  previous(shader,renderer);
  shader.vertexShader='attribute float fingerPadMask;\nattribute vec2 fingerPadUv;\nvarying float vFingerPadMask;\nvarying vec2 vFingerPadUv;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFingerPadMask=fingerPadMask;vFingerPadUv=(mapTransform*vec3(fingerPadUv,1.0)).xy;');
  shader.fragmentShader='uniform float fingerPadFixEnabled;\nvarying float vFingerPadMask;\nvarying vec2 vFingerPadUv;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('diffuseColor*=guidedSkinAlbedo(vMapUv);','diffuseColor*=guidedSkinAlbedo(vMapUv);\ndiffuseColor.rgb=mix(diffuseColor.rgb,guidedSkinAlbedo(vFingerPadUv).rgb,vFingerPadMask*fingerPadFixEnabled);');
 };
 material.customProgramCacheKey=()=>`${key}:anatomical-finger-pads-v3`;material.needsUpdate=true;
 hand.padCorrections=corrections;return corrections;
}
