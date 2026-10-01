import * as THREE from 'three';
import {smooth} from './timeline.js';

// Real elbow hinge, axial forearm twist and wrist articulation. The proximal
// transforms are captured once at630; no fingertip solver or scale produces reach.
export function createElbowReach(hand){
 const root={p:hand.root.position.clone(),q:hand.root.quaternion.clone(),s:hand.root.scale.clone()},names=['DEF-upper_armL','DEF-upper_armL001','DEF-forearmL','DEF-forearmL001'],bones=names.map(name=>hand.scene.getObjectByName(name)),rest=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()})),anchor=bones[2].getWorldPosition(new THREE.Vector3()),axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),wristBone=hand.scene.getObjectByName('DEF-handL');
 const mcp=name=>wristBone.worldToLocal(hand.scene.getObjectByName(name).getWorldPosition(new THREE.Vector3())),wristFlexAxis=mcp('DEF-f_index01L').sub(mcp('DEF-f_pinky01L')).normalize();
 let last={active:false};
 return {anchor,apply(ratio){
  const active=ratio>.63&&ratio<.9;if(!active){last={active:false};return 0}
  const reach=smooth(.63,.82,ratio)*(1-smooth(.835,.9,ratio)),pin=1-smooth(.835,.9,ratio);
  if(pin===1){hand.root.position.copy(root.p);hand.root.quaternion.copy(root.q)}else{hand.root.position.lerp(root.p,pin);hand.root.quaternion.slerp(root.q,pin)}hand.root.scale.copy(root.s);
  bones.forEach((bone,i)=>{const target=rest[i].q.clone();if(i===2)target.multiply(q.setFromAxisAngle(axisX,.30*reach));if(i===3)target.multiply(q.setFromAxisAngle(axisY,-.14*reach));bone.position.lerp(rest[i].p,pin);bone.quaternion.slerp(target,pin)});
  wristBone.quaternion.multiply(q.setFromAxisAngle(axisX,-.12*reach)).multiply(q.setFromAxisAngle(wristFlexAxis,.24*reach));
  hand.root.updateMatrixWorld(true);const elbow=bones[2].getWorldPosition(new THREE.Vector3()),wrist=hand.scene.getObjectByName('DEF-handL').getWorldPosition(new THREE.Vector3());
  last={active:true,pin,reach,anchor:anchor.toArray(),elbow:elbow.toArray(),wrist:wrist.toArray(),elbowDrift:elbow.distanceTo(anchor),forearmLength:elbow.distanceTo(wrist)};return pin;
 },getState:()=>last};
}

export function reachCamera(ratio,base,target,look,portrait=false){
 if(ratio<=.63||ratio>=.9)return 0;
 const pin=1-smooth(.835,.9,ratio),reach=smooth(.63,.82,ratio)*(1-smooth(.835,.9,ratio));
 target.lerp(base.position,pin);look.lerp(base.look,pin);
 target.x-=3.0*reach;target.z-=4.6*reach;if(portrait)target.y+=4.3*reach;
 return pin;
}
