import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {turnState,trustCopyOpacity} from '../src/section-two/turn.js';

test('the encounter is preserved exactly before the new chapter starts',()=>{
  const s=turnState(0,10);
  assert.equal(Math.abs(s.yaw),0);assert.equal(s.retreat,0);
  assert.equal(s.handScale,1);assert.equal(s.depthTurn,0);
  assert.equal(s.humanSpin,0);assert.equal(Math.abs(s.porcelainSpin),0);
  assert.equal(s.humanRoll,0);assert.equal(Math.abs(s.porcelainRoll),0);
  assert.equal(s.encounterOpacity,1);assert.equal(trustCopyOpacity(0),0);
});

test('a rightward quarter turn sends the original wall to the left',()=>{
  const camera=new THREE.PerspectiveCamera(34,1440/900,.1,100);
  camera.position.set(0,.4,13.8);
  const forward=new THREE.Vector3(0,.1,-13.8);
  const s=turnState(.25);
  camera.lookAt(camera.position.clone().add(forward.clone().applyAxisAngle(new THREE.Vector3(0,1,0),s.yaw)));
  camera.updateMatrixWorld();
  assert.ok(new THREE.Vector3(0,.5,0).project(camera).x<0);
  const final=forward.clone().applyAxisAngle(new THREE.Vector3(0,1,0),turnState(1).yaw).normalize();
  assert.ok(final.x>.999);assert.ok(Math.abs(final.z)<1e-10);
  assert.equal(turnState(1).yaw,-Math.PI/2);
});

test('retreat is subtle and rotation has smooth boundaries in both directions',()=>{
  assert.ok(turnState(1).retreat/13.8<.041);
  assert.ok(Math.abs(turnState(.0001).yaw)<1e-6);
  assert.ok(Math.abs(turnState(.9999).yaw-turnState(1).yaw)<1e-6);
  assert.ok(turnState(.2,12).humanRoll!==turnState(.2,13).humanRoll);
  assert.equal(turnState(.64).handScale,.5);
  assert.equal(turnState(1).handScale,.5);
  assert.ok(turnState(.2).handScale<1&&turnState(.2).handScale>.5);
  assert.ok(turnState(.42).depthTurn>.25);
});

test('camera stays below twenty degrees halfway through so hand rotation is visible',()=>{
  assert.ok(Math.abs(turnState(.5).yaw)<20*Math.PI/180);
  assert.ok(turnState(1).humanSpin<40*Math.PI/180);
  assert.ok(turnState(.65).porcelainSpin<-Math.PI/3);
});

test('the new message arrives after the encounter leaves and reduced motion skips the turn',()=>{
  assert.equal(turnState(.3).encounterOpacity,0);
  assert.equal(trustCopyOpacity(.77),0);
  assert.ok(trustCopyOpacity(.78)>0);
  assert.equal(trustCopyOpacity(.81),1);
  assert.equal(trustCopyOpacity(.77,true),1);
  assert.equal(turnState(1).handsVisible,false);
  const reduced=turnState(.6,10,true);
  assert.equal(reduced.yaw,-Math.PI/2);assert.equal(reduced.humanRoll,0);
  assert.equal(Math.abs(reduced.porcelainRoll),0);assert.equal(reduced.retreat,0);
  assert.equal(reduced.handScale,1);assert.equal(reduced.depthTurn,0);
  assert.equal(reduced.humanSpin,0);assert.equal(Math.abs(reduced.porcelainSpin),0);
});

test('depth rotation and each hand keep turning after the former stop until they leave',()=>{
  for(const p of [.42,.5,.65,.8,.86]){
    const a=turnState(p,10),b=turnState(p+.01,10);
    assert.ok(b.depthTurn>a.depthTurn);
    assert.ok(b.humanSpin>a.humanSpin);
    assert.ok(b.porcelainSpin<a.porcelainSpin);
    assert.ok(a.handTilt>0);
  }
});
