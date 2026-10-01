import * as THREE from 'three';

// Remove the atlas's painted nails from distal skin. A continuous photographic
// patch supplies skin colour; the fitted nail meshes provide the actual plates.
export function correctFingerPads(hand){
 if(hand.padCorrections)return hand.padCorrections;
 const g=hand.skin.geometry,{position,uv,skinIndex,skinWeight}=g.attributes;
 const mask=new Float32Array(position.count),skinUv=new Float32Array(uv.array);
 const p=new THREE.Vector3(),delta=new THREE.Vector3();
 hand.root.updateMatrixWorld(true);
 const corrections=[];
 for(const role of ['thumb','index','middle','ring','pinky']){
  const prefix=role==='thumb'?'thumb':`f_${role}`;
  const distalName=THREE.PropertyBinding.sanitizeNodeName(`DEF-${prefix}.03.L`);
  const distal=hand.metadata?.bones[distalName];
  const nail=hand.scene.getObjectByName(`${distalName}-nail`);
  if(!distal||!nail)continue;
  const head=new THREE.Vector3(...distal.head),tail=new THREE.Vector3(...distal.tail),direction=tail.clone().sub(head).normalize(),length=head.distanceTo(tail);
  nail.geometry.computeBoundingBox();const centre=nail.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(nail.matrixWorld);hand.skin.worldToLocal(centre);
  const dorsal=centre.sub(head);dorsal.addScaledVector(direction,-dorsal.dot(direction)).normalize();
  const boneId=hand.skin.skeleton.bones.findIndex(b=>b.name===distalName),side=new THREE.Vector3().crossVectors(direction,dorsal).normalize();
  // This clear metacarpal patch is fully inside the existing atlas. Mapping
  // it in each finger's rest frame avoids interpolating across unrelated UV
  // islands, black borders, and the original oversized painted nail edges.
  const sourceU=.52,sourceV=.77,photoScale=2.5;
  let corrected=0;const region=new Set();
  for(let i=0;i<position.count;i++){
   let weight=0;for(let j=0;j<4;j++)if(skinIndex.array[i*4+j]===boneId)weight+=skinWeight.array[i*4+j];
   if(weight<.15)continue;
   p.fromBufferAttribute(position,i);const along=delta.copy(p).sub(head).dot(direction)/length;
   // Keep the real joint folds, then repair the entire distal circumference
   // so the side walls cannot expose a triangular remainder of a painted nail.
   const blend=THREE.MathUtils.smoothstep(along,.02,.36)*THREE.MathUtils.smoothstep(weight,.15,.6);
   if(!blend)continue;
   mask[i]=blend;region.add(i);corrected++;
  }
  // A zero-mask vertex still participates in UV interpolation. Extend the
  // same projection over every boundary triangle so fade bands never sample
  // the atlas between the clean source patch and an unrelated original UV.
  const projected=new Set(region);
  for(let i=0;i<g.index.count;i+=3){
   const a=g.index.array[i],b=g.index.array[i+1],c=g.index.array[i+2];
   if(region.has(a)||region.has(b)||region.has(c)){projected.add(a);projected.add(b);projected.add(c)}
  }
  for(const i of projected){
   delta.fromBufferAttribute(position,i).sub(head);
   skinUv[i*2]=sourceU+delta.dot(side)*photoScale;
   skinUv[i*2+1]=sourceV+(delta.dot(direction)-length*.55)*photoScale;
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
  shader.fragmentShader=shader.fragmentShader.replace('photographedCrease(vMapUv)*mix(.04,1.0,fold*fold)','(fingerPadBlend<.999?photographedCrease(vMapUv)*(1.0-fingerPadBlend):0.0)*mix(.04,1.0,fold*fold)');
  shader.fragmentShader=shader.fragmentShader.replace('diffuseColor*=guidedSkinAlbedo(vMapUv);',`float fingerPadBlend=vFingerPadMask*fingerPadFixEnabled;
vec4 correctedSkinAlbedo;
if(fingerPadBlend>.999)correctedSkinAlbedo=guidedSkinAlbedo(vFingerPadUv);
else{
 correctedSkinAlbedo=guidedSkinAlbedo(vMapUv);
 if(fingerPadBlend>.001)correctedSkinAlbedo=mix(correctedSkinAlbedo,guidedSkinAlbedo(vFingerPadUv),fingerPadBlend);
}
diffuseColor*=correctedSkinAlbedo;`);
 };
 material.customProgramCacheKey=()=>`${key}:anatomical-finger-pads-v4`;material.needsUpdate=true;
 hand.padCorrections=corrections;return corrections;
}
