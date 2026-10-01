import * as THREE from 'three';
import {sampleFrames,smooth} from './timeline.js';

// Add elbow, wrist and finger articulation to the authored mobile reach.
// The 500 pose remains the arrival target; each deviation returns to zero
// before the existing elbow anchor at 630, including on reverse scroll.
const frames=[
 {at:.385,elbow:0,twist:0,wrist:0,fingers:0},
 {at:.440,elbow:-.16,twist:.025,wrist:.055,fingers:-.06},
 {at:.480,elbow:-.045,twist:.010,wrist:.018,fingers:-.025},
 {at:.500,elbow:0,twist:0,wrist:0,fingers:0},
 {at:.525,elbow:.025,twist:-.010,wrist:-.016,fingers:.035},
 {at:.560,elbow:.070,twist:-.020,wrist:-.035,fingers:.065},
 {at:.590,elbow:.028,twist:-.008,wrist:-.012,fingers:.024},
 {at:.630,elbow:0,twist:0,wrist:0,fingers:0},
];
export function mobileCompassEnvelope(ratio){return smooth(.39,.48,ratio)*(1-smooth(.56,.63,ratio))}

export function createMobileCompassGesture(hand){
 const elbow=hand.scene.getObjectByName('DEF-forearmL'),twist=hand.scene.getObjectByName('DEF-forearmL001'),wrist=hand.scene.getObjectByName('DEF-handL');
 const x=new THREE.Vector3(1,0,0),y=new THREE.Vector3(0,1,0),q=new THREE.Quaternion();
 const fingers=['thumb','index','middle','ring','pinky'].flatMap((role,finger)=>[1,2,3].map(joint=>{
  const name=THREE.PropertyBinding.sanitizeNodeName(`DEF-${role==='thumb'?'thumb':`f_${role}`}.${String(joint).padStart(2,'0')}.L`);
  return {bone:hand.scene.getObjectByName(name),axis:new THREE.Vector3(...hand.metadata.bones[name].flexionAxisLocal),finger,joint};
 }));
 let last={active:false};
 return {apply(ratio,time=0,reduced=false){
  if(innerWidth>=700||ratio<=frames[0].at||ratio>=frames.at(-1).at){last={active:false};return}
  const pose=sampleFrames(frames,ratio),idle=reduced?0:mobileCompassEnvelope(ratio);
  elbow.quaternion.multiply(q.setFromAxisAngle(x,pose.elbow));
  twist.quaternion.multiply(q.setFromAxisAngle(y,pose.twist));
  wrist.quaternion.multiply(q.setFromAxisAngle(x,pose.wrist));
  for(const {bone,axis,finger,joint}of fingers){
   const lead=[.6,1,.85,.30,.22][finger],bend=[0,.45,.75,.40][joint];
   const breath=Math.sin(time*(.73+finger*.07))*.009*idle;
   bone.quaternion.multiply(q.setFromAxisAngle(axis,(pose.fingers*lead+breath)*bend));
  }
  hand.root.updateMatrixWorld(true);
  last={active:true,...pose,elbow:elbow.getWorldPosition(new THREE.Vector3()).toArray(),wrist:wrist.getWorldPosition(new THREE.Vector3()).toArray()};
 },getState:()=>last};
}
