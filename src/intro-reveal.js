import * as THREE from 'three';
import { smooth, sampleFrames } from './timeline.js';

// Extend the existing skin/hair materials without changing their geometry,
// texture, rig or lighting. Deformed world positions make the fingertips
// appear before the palm, and the palm before the forearm.
export function createIntroReveal(human){
  const depth={value:100},enabled={value:1};
  const materials=new Set();
  human.root.traverse(object=>{for(const material of [].concat(object.material??[]))if(material?.isMeshStandardMaterial)materials.add(material)});
  for(const material of materials){
    const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
    material.transparent=true;
    material.onBeforeCompile=(shader,renderer)=>{
      previous(shader,renderer);
      shader.uniforms.introDepth=depth;shader.uniforms.introEnabled=enabled;
      shader.vertexShader='varying vec3 vIntroWorld;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vIntroWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\n#include <project_vertex>`);
      shader.fragmentShader='uniform float introDepth;\nuniform float introEnabled;\nvarying vec3 vIntroWorld;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float emerging=smoothstep(introDepth-.28,introDepth+.28,vIntroWorld.z);\noutgoingLight=mix(outgoingLight,vec3(2.0),(1.0-emerging)*introEnabled*.75);\ndiffuseColor.a*=mix(1.0,emerging,introEnabled);\nif(diffuseColor.a<.003)discard;\n#include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=>`${key}:puntoes-intro-light-v1`;
    material.needsUpdate=true;
  }
  let range=null;
  return {
    update(progress){
      if(!range){human.root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(human.root,true);range={min:bounds.min.z,max:bounds.max.z}}
      const stages=[{at:0,z:range.max+.4},{at:.015,z:range.max+.4},{at:.08,z:range.max-.10},{at:.18,z:range.max-.7},{at:.35,z:range.max-1.7},{at:.52,z:range.max-2.4},{at:.72,z:range.max-2.8},{at:1,z:range.min-.4}];
      depth.value=sampleFrames(stages,Math.min(progress,1)).z;
      enabled.value=1-smooth(.9,1,progress);
      return {depth:depth.value,enabled:enabled.value,range};
    }
  };
}
