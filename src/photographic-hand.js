import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHumanSkin } from './human-skin.js';
import { createHandHair } from './hand-hair.js';
import { preserveHandVolume } from './hand-deformation.js';

export async function createPhotographicHand({detail=2,hair=true}={}){
  const [gltf,metadata,armMap]=await Promise.all([new GLTFLoader().loadAsync(detail>1?'/models/human-photo.glb':'/models/human-photo-web.glb'),fetch('/models/human-photo-rig.json').then(response=>{if(!response.ok)throw new Error('Hand rig metadata unavailable');return response.json()}),new THREE.TextureLoader().loadAsync('/textures/mano/forearm-albedo-v1-lossless.webp')]);
  const scene=gltf.scene,root=new THREE.Group(),orientation=new THREE.Group();orientation.scale.setScalar(18);orientation.add(scene);root.add(orientation);scene.updateMatrixWorld(true);
  const meshes=[];scene.traverse(object=>{if(object.isSkinnedMesh)meshes.push(object)});const skin=meshes.sort((a,b)=>b.geometry.attributes.position.count-a.geometry.attributes.position.count)[0];
  const bones=skin.skeleton.bones,segments=[];
  const fingerOrder=['thumb','index','middle','ring','pinky'];
  const roles=metadata.fingerRoles;
  if(!roles||roles.thumb!==5||roles.index!==4)throw new Error('Hand anatomy metadata is missing or incompatible');
  const poseIndices=new Map(fingerOrder.map((role,index)=>[roles[role],index]));
  for(let finger=1;finger<=5;finger++)for(let joint=1;joint<=3;joint++){
    const name=`finger${finger}joint${joint}`,bone=scene.getObjectByName(name),definition=metadata.bones[name];
    if(bone){
      const direction=new THREE.Vector3(...definition.tail).sub(new THREE.Vector3(...definition.head)).normalize(),inverse=bone.getWorldQuaternion(new THREE.Quaternion()).invert();
      segments.push({bone,bind:bone.quaternion.clone(),finger:poseIndices.get(finger),joint,bendAxis:direction.clone().cross(new THREE.Vector3(0,0,1)).normalize().applyQuaternion(inverse),yawAxis:new THREE.Vector3(0,0,1).applyQuaternion(inverse),rollAxis:direction.applyQuaternion(inverse)});
    }
  }
  const geometry=skin.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal,nailMask=new Float32Array(position.count),thinness=new Float32Array(position.count);
  const nailBeds=[];
  for(let finger=1;finger<=5;finger++){
    const definition=metadata.bones[`finger${finger}joint3`];
    const a=new THREE.Vector3(...definition.head),b=new THREE.Vector3(...definition.tail),direction=b.clone().sub(a).normalize(),center=a.clone().lerp(b,.62);
    const dorsal=new THREE.Vector3(0,0,-1).addScaledVector(direction,direction.z).normalize(),side=new THREE.Vector3().crossVectors(direction,dorsal).normalize();
    nailBeds.push({a,b,direction,center,dorsal,side,length:a.distanceTo(b)*.72,width:finger===roles.thumb?.009:.007});
  }
  const indexBoneIDs=new Set(bones.map((bone,i)=>bone.name.startsWith(`finger${roles.index}joint`)?i:-1));
  const indexDefinition=metadata.bones[`finger${roles.index}joint3`];
  const indexDirection=new THREE.Vector3(...indexDefinition.tail).sub(new THREE.Vector3(...indexDefinition.head)).normalize();
  let tipVertex=0,furthest=-Infinity;const point=new THREE.Vector3(),surfaceNormal=new THREE.Vector3();
  for(let i=0;i<position.count;i++){
    point.fromBufferAttribute(position,i);surfaceNormal.fromBufferAttribute(normal,i);
    let mask=0;
    for(const bed of nailBeds){
      const delta=point.clone().sub(bed.center),u=delta.dot(bed.direction)/(bed.length*.5),v=delta.dot(bed.side)/(bed.width*.5);
      const ellipse=u*u+v*v,dorsal=THREE.MathUtils.smoothstep(surfaceNormal.dot(bed.dorsal),.2,.8);
      mask=Math.max(mask,(1-THREE.MathUtils.smoothstep(ellipse,.6,1.2))*dorsal);
    }
    nailMask[i]=mask;thinness[i]=THREE.MathUtils.smoothstep(point.x,.055,.13);
    let weight=0;for(let j=0;j<4;j++)if(indexBoneIDs.has(geometry.attributes.skinIndex.array[i*4+j]))weight+=geometry.attributes.skinWeight.array[i*4+j];
    if(weight>.5){const distance=point.dot(indexDirection);if(distance>furthest){furthest=distance;tipVertex=i}}
  }
  geometry.setAttribute('nailMask',new THREE.BufferAttribute(nailMask,1));geometry.setAttribute('skinThinness',new THREE.BufferAttribute(thinness,1));
  const material=createHumanSkin(skin.material.map,{forearmMap:armMap});skin.material=material;skin.castShadow=skin.receiveShadow=true;skin.frustumCulled=false;
  const vellus=hair?createHandHair(skin,{count:detail>1?2400:900}):null;
  if(vellus)skin.parent.add(vellus);
  const deformation=preserveHandVolume(skin,[vellus]);
  const toolAnchor=new THREE.Group();root.add(toolAnchor);
  const quaternion=new THREE.Quaternion();
  function pose(curls=[.12,.12,.15,.2,.25]){
    for(const segment of segments)segment.bone.quaternion.copy(segment.bind);
    const thumb=THREE.MathUtils.smoothstep(curls[0],.08,.9);
    for(const segment of segments){
      const curl=THREE.MathUtils.clamp(curls[segment.finger],0,1.1);
      if(segment.finger===0){
        if(segment.joint===1){
          segment.bone.quaternion.multiply(quaternion.setFromAxisAngle(segment.yawAxis,-.3+thumb*1.4));
          segment.bone.quaternion.multiply(quaternion.setFromAxisAngle(segment.bendAxis,-thumb*.15));
          segment.bone.quaternion.multiply(quaternion.setFromAxisAngle(segment.rollAxis,thumb*.65));
        }else segment.bone.quaternion.multiply(quaternion.setFromAxisAngle(segment.bendAxis,thumb*(segment.joint===2?.9:.5)));
      }else{
        const angle=Math.min(curl*[0,1.65,1.95,1.15][segment.joint],[0,1.5,1.8,1.05][segment.joint]);
        segment.bone.quaternion.multiply(quaternion.setFromAxisAngle(segment.bendAxis,angle));
      }
    }
    root.updateMatrixWorld(true);deformation.update();
  }
  function tipWorld(){root.updateMatrixWorld(true);return skin.getVertexPosition(tipVertex,new THREE.Vector3()).applyMatrix4(skin.matrixWorld)}
  return {root,scene,skin,material,toolAnchor,pose,tipWorld,detail,hair:vellus,nailCount:5,deformation:deformation.kind,source:'LibHand photographic texture',metadata,
    setDetails({pores=true,vellus:showHair=true}={}){material.userData.uniforms.poreStrength.value=pores?1:0;if(vellus)vellus.visible=showHair}};
}
