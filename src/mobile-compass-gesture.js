import * as THREE from 'three';
import {sampleFrames,smooth} from './timeline.js';

// Add elbow and wrist articulation to the authored mobile reach. Finger
// preparation now has one authority in human-pregrasp, shared with desktop.
// The 500 pose remains the arrival target; each deviation returns to zero
// before the existing elbow anchor at 630, including on reverse scroll.
const frames=[
 {at:.385,elbow:0,twist:0,wrist:0},
 {at:.440,elbow:-.16,twist:.025,wrist:.055},
 {at:.480,elbow:-.045,twist:.010,wrist:.018},
 {at:.500,elbow:0,twist:0,wrist:0},
 {at:.525,elbow:.025,twist:-.010,wrist:-.016},
 {at:.560,elbow:.070,twist:-.020,wrist:-.035},
 {at:.590,elbow:.028,twist:-.008,wrist:-.012},
 {at:.630,elbow:0,twist:0,wrist:0},
];
export function mobileCompassEnvelope(ratio){return smooth(.39,.48,ratio)*(1-smooth(.56,.63,ratio))}

export function createMobileCompassGesture(hand){
 const elbow=hand.scene.getObjectByName('DEF-forearmL'),twist=hand.scene.getObjectByName('DEF-forearmL001'),wrist=hand.scene.getObjectByName('DEF-handL');
 const x=new THREE.Vector3(1,0,0),y=new THREE.Vector3(0,1,0),q=new THREE.Quaternion();
 let last={active:false};
 return {apply(ratio){
  if(innerWidth>=700||ratio<=frames[0].at||ratio>=frames.at(-1).at){last={active:false};return}
  const pose=sampleFrames(frames,ratio);
  elbow.quaternion.multiply(q.setFromAxisAngle(x,pose.elbow));
  twist.quaternion.multiply(q.setFromAxisAngle(y,pose.twist));
  wrist.quaternion.multiply(q.setFromAxisAngle(x,pose.wrist));
  hand.root.updateMatrixWorld(true);
  last={active:true,...pose,elbow:elbow.getWorldPosition(new THREE.Vector3()).toArray(),wrist:wrist.getWorldPosition(new THREE.Vector3()).toArray()};
 },getState:()=>last};
}
