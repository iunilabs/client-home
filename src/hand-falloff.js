import * as THREE from 'three';

// The arm fades back into the field instead of exposing a cut model end.
// Applied to these two scene instances only; the model studio is unchanged.
export function createHandFalloff(hand){
 const materials=new Set();
 hand.root.traverse(o=>{for(const m of [].concat(o.material??[]))if(m?.isMeshStandardMaterial)materials.add(m)});
 for(const material of materials){
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();material.transparent=true;
  material.onBeforeCompile=(shader,renderer)=>{
   previous(shader,renderer);
   // Fade along the anatomical length even when the forearm bends towards
   // the camera. Deformed world X can expose the cut end of a bent arm.
   shader.vertexShader='varying float vArmRestX;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','vArmRestX=position.x;\n#include <project_vertex>');
   shader.fragmentShader='varying float vArmRestX;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','float armPresence=smoothstep(-4.4/18.0,-2.7/18.0,vArmRestX);\ndiffuseColor.a*=armPresence;\nif(diffuseColor.a<.003)discard;\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=()=>`${key}:puntoes-arm-falloff-v2`;material.needsUpdate=true;
 }
 return {update(){}};
}
