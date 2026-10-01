import * as THREE from 'three';
import {createFingerGesture} from './finger-gesture.js';
import {createThumbGesture,createWristGesture} from './wrist-gesture.js';
import {smooth} from './timeline.js';

// Capture authored joint transforms once. Runtime has a single absolute
// quaternion/position track per bone, followed only by tiny idle deviations.
export function createPoseTrack(hand,frames,section){
 const fingers=createFingerGesture(hand),thumb=createThumbGesture(hand),wrist=createWristGesture(hand);
 const capture=frame=>{
  hand.root.scale.y=frame.mirror??-1;hand.root.rotation.set(...frame.r);hand.root.position.set(...(frame.h??[0,0,0]));
  hand.pose(frame.curls);fingers.apply(frame.curls,frame.flexions,frame.spreads,frame.flexions?1:0);thumb.apply(frame.opposition??0);wrist.apply(frame.wrist??0);
  return {at:frame.at,index:new THREE.Vector3(...(frame.tip??hand.tipWorld().toArray())),joints:Object.fromEntries(hand.skin.skeleton.bones.map(b=>[b.name,{q:b.quaternion.clone(),p:b.position.clone()}]))};
 };
 const track=frames.map(capture);
 function sample(track,value){
  let i=track.findIndex((f,i)=>i<track.length-1&&value>=f.at&&value<=track[i+1].at);if(i<0)i=value<track[0].at?0:track.length-2;
  const a=track[i],b=track[i+1],t=smooth(a.at,b.at,value),joints={};
  for(const[name,from]of Object.entries(a.joints)){const to=b.joints[name];joints[name]={q:from.q.clone().slerp(to.q,t),p:from.p.clone().lerp(to.p,t)}}
  return {at:value,index:a.index.clone().lerp(b.index,t),joints};
 }
 // Capture original quaternions at both splice boundaries so900 stays exact.
 const sectionTrack=section?[sample(track,section.start),...section.frames.map(capture),sample(track,section.end)]:null;
 const active=value=>sectionTrack&&value>section.start&&value<section.end?sectionTrack:track;
 const q=new THREE.Quaternion(),p=new THREE.Vector3(),joints={};
 return {targetIndex(value){const track=active(value);let i=track.findIndex((f,i)=>i<track.length-1&&value>=f.at&&value<=track[i+1].at);if(i<0)i=value<track[0].at?0:track.length-2;const a=track[i],b=track[i+1];return a.index.clone().lerp(b.index,smooth(a.at,b.at,value))},apply(value,time=0,reduced=false){
  const track=active(value);
  let i=track.findIndex((f,i)=>i<track.length-1&&value>=f.at&&value<=track[i+1].at);if(i<0)i=value<track[0].at?0:track.length-2;
  const a=track[i],b=track[i+1],t=smooth(a.at,b.at,value);
  for(const[name,from]of Object.entries(a.joints)){const to=b.joints[name];joints[name]={q:q.copy(from.q).slerp(to.q,t).toArray(),p:p.copy(from.p).lerp(to.p,t).toArray()}}
  hand.applyJointPose(joints,1);
  if(!reduced)fingers.breathe(time,(1-smooth(.84,.97,value))*.65);
 }};
}
