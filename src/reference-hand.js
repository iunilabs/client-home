import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { createHumanSkin } from './human-skin.js';
import { createHandHair } from './hand-hair.js';
import { preserveHandVolume } from './hand-deformation.js';
import { refineTexturedSkin } from './textured-skin-geometry.js';
import { addFittedNails } from './hand-nails.js';
import {correctFingerPads} from './ventral-skin.js';
import {createSkinContinuity} from './skin-continuity.js';

const roles=['thumb','index','middle','ring','pinky'];
const boneName=(role,joint)=>THREE.PropertyBinding.sanitizeNodeName(`DEF-${role==='thumb'?'thumb':`f_${role}`}.${String(joint).padStart(2,'0')}.L`);

// Rebind the supplied mesh in wrist-centred metres. Its original scene has
// animated arm placement and a mirrored rig, which are unsuitable for the
// shared hand controls. Preserve UVs and weights through refinement, including
// all 24 joints.
export async function createReferenceHand(renderer,{artificial=false,detail=2,surface='adapted'}={}){
  const draco=new DRACOLoader().setDecoderPath('/decoders/draco/');
  const loader=new GLTFLoader().setDRACOLoader(draco);
  const atlasLoader=new KTX2Loader().setTranscoderPath('/decoders/basis/').detectSupport(renderer);
  let gltf,atlas;
  try{[gltf,atlas]=await Promise.all([loader.loadAsync(`/models/zero/${artificial?'fancy_hand_2':'human_hand_1'}.glb`),artificial?Promise.resolve(null):surface==='original'?atlasLoader.loadAsync('/models/zero/human_hands.ktx2'):new THREE.TextureLoader().loadAsync('/textures/mano/zero-skin-albedo-v4.png')])}
  finally{draco.dispose();atlasLoader.dispose()}
  gltf.scene.updateMatrixWorld(true);
  let original;gltf.scene.traverse(object=>{if(object.isSkinnedMesh)original=object});
  const originals=original.skeleton.bones,wrist=gltf.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName('DEF-hand.L'));
  const wristPosition=wrist.getWorldPosition(new THREE.Vector3());
  const index=gltf.scene.getObjectByName(boneName('index',1)).getWorldPosition(new THREE.Vector3());
  const pinky=gltf.scene.getObjectByName(boneName('pinky',1)).getWorldPosition(new THREE.Vector3());
  const direction=gltf.scene.getObjectByName(boneName('middle',2)).getWorldPosition(new THREE.Vector3()).sub(gltf.scene.getObjectByName(boneName('middle',1)).getWorldPosition(new THREE.Vector3())).normalize();
  const across=pinky.clone().sub(index);across.addScaledVector(direction,-across.dot(direction)).normalize();
  const palm=new THREE.Vector3().crossVectors(direction,across).normalize();
  const thumbPosition=gltf.scene.getObjectByName(boneName('thumb',1)).getWorldPosition(new THREE.Vector3()).sub(wristPosition);
  if(palm.dot(thumbPosition)<0)palm.negate();
  const transform=new THREE.Matrix4().makeBasis(direction,across,palm).invert().multiply(new THREE.Matrix4().makeTranslation(...wristPosition.clone().negate())).premultiply(new THREE.Matrix4().makeScale(.8,.8,.8));
  let geometry=original.geometry.clone();const meshTransform=transform.clone().multiply(original.matrixWorld);
  original.skeleton.update();
  const bakedPoint=new THREE.Vector3();
  for(let i=0;i<geometry.attributes.position.count;i++){
    original.getVertexPosition(i,bakedPoint).applyMatrix4(meshTransform);
    geometry.attributes.position.setXYZ(i,bakedPoint.x,bakedPoint.y,bakedPoint.z);
  }
  geometry.attributes.position.needsUpdate=true;
  if(meshTransform.determinant()<0){const indices=geometry.index.array;for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]]}
  const coarse=geometry;geometry=refineTexturedSkin(coarse,detail>1?1:0);if(coarse!==geometry)coarse.dispose();
  const scene=new THREE.Group(),root=new THREE.Group(),orientation=new THREE.Group();orientation.scale.setScalar(18);orientation.add(scene);root.add(orientation);
  const restWorld=originals.map(bone=>{const matrix=transform.clone().multiply(bone.matrixWorld),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();matrix.decompose(position,rotation,scale);return new THREE.Matrix4().compose(position,rotation,new THREE.Vector3(1,1,1))});
  const bones=originals.map(bone=>{const copy=new THREE.Bone();copy.name=bone.name;return copy});
  for(let i=0;i<bones.length;i++){
    const parent=originals.indexOf(originals[i].parent),local=parent<0?restWorld[i]:restWorld[parent].clone().invert().multiply(restWorld[i]);local.decompose(bones[i].position,bones[i].quaternion,bones[i].scale);
    (parent<0?scene:bones[parent]).add(bones[i]);
  }
  scene.updateMatrixWorld(true);
  const skeleton=new THREE.Skeleton(bones),skin=new THREE.SkinnedMesh(geometry);skin.name=artificial?'porcelain-reference-hand':'human-reference-hand';scene.add(skin);skin.bind(skeleton);skin.normalizeSkinWeights();skin.frustumCulled=false;skin.castShadow=skin.receiveShadow=true;
  const metadata={source:'Zero supplied reference',units:'metres',bones:{},fingerRoles:Object.fromEntries(roles.map((role,i)=>[role,i]))},segments=[],nailBeds=[];
  let tipVertex=0;
  for(const [finger,role]of roles.entries())for(let joint=1;joint<=3;joint++){
    const bone=bones.find(bone=>bone.name===boneName(role,joint)),id=bones.indexOf(bone),head=new THREE.Vector3().setFromMatrixPosition(restWorld[id]);
    let tail;
    if(joint<3)tail=new THREE.Vector3().setFromMatrixPosition(restWorld[bones.indexOf(bones.find(bone=>bone.name===boneName(role,joint+1)))]);
    else{
      const axis=new THREE.Vector3(0,1,0).transformDirection(restWorld[id]);let furthest=-Infinity;
      for(let i=0;i<geometry.attributes.position.count;i++){
        let weight=0;for(let j=0;j<4;j++)if(geometry.attributes.skinIndex.array[i*4+j]===id)weight+=geometry.attributes.skinWeight.array[i*4+j];if(weight<.5)continue;
        const p=new THREE.Vector3().fromBufferAttribute(geometry.attributes.position,i),distance=p.clone().sub(head).dot(axis);
        if(distance>furthest){furthest=distance;tail=p;if(role==='index')tipVertex=i}
      }
    }
    metadata.bones[bone.name]={head:head.toArray(),tail:tail.toArray()};
    const direction=tail.clone().sub(head).normalize(),inverse=new THREE.Quaternion().setFromRotationMatrix(restWorld[id]).invert();
    const palmBend=direction.clone().cross(new THREE.Vector3(0,0,1)).normalize().applyQuaternion(inverse);
    Object.assign(metadata.bones[bone.name],{bindQuaternion:bone.quaternion.toArray(),bindPosition:bone.position.toArray(),flexionAxisLocal:(finger===0?new THREE.Vector3(1,0,0):palmBend).toArray(),abductionAxisLocal:new THREE.Vector3(0,0,1).applyQuaternion(inverse).toArray()});
    // The imported thumb has its own flexion plane: local X is the hinge,
    // local +Z faces the pulp. Using the fingers' palm-normal axis here makes
    // its phalanges bend sideways. Opposition belongs to the CMC joint.
    segments.push({bone,bind:bone.quaternion.clone(),bindPosition:bone.position.clone(),finger,joint,bend:finger===0?new THREE.Vector3(1,0,0):palmBend,lift:palmBend,yaw:new THREE.Vector3(0,0,1).applyQuaternion(inverse),roll:direction.clone().applyQuaternion(inverse),tipLocal:tail.clone().applyMatrix4(restWorld[id].clone().invert())});
    if(joint===3){const dorsal=role==='thumb'?new THREE.Vector3(0,0,-1).transformDirection(restWorld[id]):new THREE.Vector3(0,0,-1);dorsal.addScaledVector(direction,-dorsal.dot(direction)).normalize();const side=new THREE.Vector3().crossVectors(direction,dorsal).normalize();nailBeds.push({bone,boneIndex:id,center:head.clone().lerp(tail,.58),direction,dorsal,side,length:head.distanceTo(tail)*.56,width:role==='thumb'?.011:.008})}
  }
  const nailMask=new Float32Array(geometry.attributes.position.count),thinness=new Float32Array(nailMask.length),creaseArea=new Float32Array(nailMask.length),point=new THREE.Vector3(),normal=new THREE.Vector3();
  const jointBands=segments.map(segment=>{const rest=metadata.bones[segment.bone.name];return{id:bones.indexOf(segment.bone),head:new THREE.Vector3(...rest.head),axis:new THREE.Vector3(...rest.tail).sub(new THREE.Vector3(...rest.head)).normalize()}});
  for(let i=0;i<nailMask.length;i++){
    point.fromBufferAttribute(geometry.attributes.position,i);normal.fromBufferAttribute(geometry.attributes.normal,i);thinness[i]=THREE.MathUtils.smoothstep(point.x,.07,.13);
    let fingerWeight=0,fold=0;
    for(const band of jointBands){let weight=0;for(let j=0;j<4;j++)if(geometry.attributes.skinIndex.array[i*4+j]===band.id)weight+=geometry.attributes.skinWeight.array[i*4+j];fingerWeight+=weight;if(weight>.1)fold=Math.max(fold,1-THREE.MathUtils.smoothstep(Math.abs(point.clone().sub(band.head).dot(band.axis)),.0015,.006))}
    creaseArea[i]=fingerWeight>.35?THREE.MathUtils.lerp(.15,1,fold):1;
    for(const bed of nailBeds){
      // A nail's planar projection must not paint the wrist or another finger.
      let weight=0;for(let j=0;j<4;j++)if(geometry.attributes.skinIndex.array[i*4+j]===bed.boneIndex)weight+=geometry.attributes.skinWeight.array[i*4+j];
      if(weight<.25)continue;
      const delta=point.clone().sub(bed.center);if(Math.abs(delta.dot(bed.dorsal))>.012)continue;
      const u=delta.dot(bed.direction)/(bed.length*.5),v=delta.dot(bed.side)/(bed.width*.5);nailMask[i]=Math.max(nailMask[i],(1-THREE.MathUtils.smoothstep(u*u+v*v,.6,1.2))*THREE.MathUtils.smoothstep(normal.dot(bed.dorsal),.2,.8));
    }
  }
  geometry.setAttribute('nailMask',new THREE.BufferAttribute(nailMask,1));geometry.setAttribute('skinThinness',new THREE.BufferAttribute(thinness,1));geometry.setAttribute('skinCreaseArea',new THREE.BufferAttribute(creaseArea,1));
  // The supplied atlas contains four baked lighting versions of the same UV
  // layout. Use its first tile; the green matcap is replaced with porcelain.
  if(atlas){atlas.colorSpace=THREE.SRGBColorSpace;if(surface==='original'){atlas.offset.set(0,1);atlas.repeat.set(.25,-.25);atlas.updateMatrix()}atlas.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())}
  const material=artificial?new THREE.MeshPhysicalMaterial({color:'#f2eee4',roughness:.23,metalness:0,ior:1.5,clearcoat:.55,clearcoatRoughness:.18,envMapIntensity:.8}):createHumanSkin(atlas,{blendForearm:false,reliefScale:.3,guidedCreases:true});skin.material=material;
  if(!artificial)material.userData.textureOrigin='Zero supplied UV atlas; AI-adapted neutral skin available alongside the original KTX2 texture';
  const hair=artificial?null:createHandHair(skin,{count:detail>1?2400:900});if(hair)scene.add(hair);
  const nails=addFittedNails(skin,nailBeds,{artificial});
  const deformation=preserveHandVolume(skin,[hair,...nails]),quaternion=new THREE.Quaternion(),position=new THREE.Vector3();
  const bindings=bones.map(bone=>({bone,q:bone.quaternion.clone(),p:bone.position.clone()}));
  function pose(curls=[.12,.12,.15,.2,.25]){
    // A transferred palm/forearm pose must leave no residue on reverse scroll.
    for(const binding of bindings){binding.bone.quaternion.copy(binding.q);binding.bone.position.copy(binding.p)}
    const thumb=THREE.MathUtils.smoothstep(curls[0],.08,.9);
    for(const segment of segments){const{bone,finger,joint,bend,lift,yaw,roll}=segment,curl=THREE.MathUtils.clamp(curls[finger],0,1);
      if(finger===0){if(joint===1){bone.quaternion.multiply(quaternion.setFromAxisAngle(yaw,-.15+thumb*.5));bone.quaternion.multiply(quaternion.setFromAxisAngle(lift,thumb*.12));bone.quaternion.multiply(quaternion.setFromAxisAngle(roll,-thumb*1.15))}else bone.quaternion.multiply(quaternion.setFromAxisAngle(bend,thumb*(joint===2?.6:.65)))}
      else bone.quaternion.multiply(quaternion.setFromAxisAngle(bend,curl*[0,1.3,1.45,.85][joint]));
    }
    root.updateMatrixWorld(true);deformation.update();
  }
  const toolAnchor=new THREE.Group();root.add(toolAnchor);
  function applyJointPose(joints,blend=1){
    if(!joints)return;const amount=THREE.MathUtils.clamp(blend,0,1);
    for(const{bone}of bindings){const target=joints[bone.name];if(!target)continue;bone.quaternion.slerp(quaternion.fromArray(target.q),amount);bone.position.lerp(position.fromArray(target.p),amount)}
    root.updateMatrixWorld(true);deformation.update();
  }
  function jointTips(){root.updateMatrixWorld(true);return Object.fromEntries(segments.filter(segment=>segment.joint===3).map(segment=>[roles[segment.finger],orientation.worldToLocal(segment.bone.localToWorld(segment.tipLocal.clone())).toArray()]))}
  function tipWorld(){root.updateMatrixWorld(true);return skin.getVertexPosition(tipVertex,new THREE.Vector3()).applyMatrix4(skin.matrixWorld)}
  function thumbMotion(){
    root.updateMatrixWorld(true);const scale=scene.getWorldScale(new THREE.Vector3()).x;
    return segments.filter(segment=>segment.finger===0&&segment.joint>1).map(segment=>{
      const extended=segment.bone.parent.matrixWorld.clone().multiply(new THREE.Matrix4().compose(segment.bindPosition,segment.bind,new THREE.Vector3(1,1,1))),delta=segment.bone.localToWorld(segment.tipLocal.clone()).sub(segment.tipLocal.clone().applyMatrix4(extended)).divideScalar(scale);
      return{joint:segment.joint===2?'MCP':'IP',towardsPad:delta.dot(new THREE.Vector3(0,0,1).transformDirection(extended)),lateralDeviation:Math.abs(delta.dot(new THREE.Vector3(1,0,0).transformDirection(extended)))};
    });
  }
  let surfaceMode=surface,originalAtlas=surface==='original'?atlas:null,adaptedAtlas=surface==='adapted'?atlas:null;
  async function setSurface(kind){
    if(artificial)return;
    if(kind==='original'&&!originalAtlas){
      const decoder=new KTX2Loader().setTranscoderPath('/decoders/basis/').detectSupport(renderer);
      try{originalAtlas=await decoder.loadAsync('/models/zero/human_hands.ktx2')}finally{decoder.dispose()}
      originalAtlas.colorSpace=THREE.SRGBColorSpace;originalAtlas.offset.set(0,1);originalAtlas.repeat.set(.25,-.25);originalAtlas.updateMatrix();
    }
    if(kind==='adapted'&&!adaptedAtlas)adaptedAtlas=await new THREE.TextureLoader().loadAsync('/textures/mano/zero-skin-albedo-v4.png');
    const map=kind==='original'?originalAtlas:adaptedAtlas;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    material.map=map;const uniforms=material.userData.uniforms;
    if(kind==='adapted'&&!hand.skinContinuity){correctFingerPads(hand);await createSkinContinuity(hand,renderer)}
    uniforms.forearmMap.value=kind==='adapted'&&hand.skinContinuity?hand.skinContinuity.texture:map;
    uniforms.forearmBlendEnabled.value=kind==='adapted'?1:0;
    if(uniforms.fingerPadFixEnabled)uniforms.fingerPadFixEnabled.value=kind==='adapted'?1:0;
    if(uniforms.skinContinuityEnabled)uniforms.skinContinuityEnabled.value=kind==='adapted'?1:0;
    uniforms.skinCreaseGuidance.value=kind==='adapted'?1:0;
    uniforms.skinPhotoStep.value.set(1/map.image.width,1/map.image.height);material.needsUpdate=true;surfaceMode=kind;
  }
  pose([0,0,0,0,0]);
  const hand={root,scene,skin,material,hair,toolAnchor,pose,applyJointPose,tipWorld,jointTips,thumbMotion,setSurface,get surface(){return surfaceMode},detail,metadata,nails,nailCount:nails.length,deformation:deformation.kind,source:'Zero supplied reference',originalAnimation:gltf.animations[0]?.name,textureSize:atlas?[atlas.image.width,atlas.image.height]:null,setDetails({pores=true,vellus=true}={}){if(!artificial)material.userData.uniforms.poreStrength.value=pores?1:0;if(hair)hair.visible=vellus}};
  // The studio and experience use the same finish. Their existing explicit
  // correction calls are idempotent, so no second shader layer is added.
  if(!artificial&&surface==='adapted'){correctFingerPads(hand);await createSkinContinuity(hand,renderer)}
  return hand;
}
