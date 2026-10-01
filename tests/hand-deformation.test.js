import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { transformDualQuaternion } from '../src/hand-deformation.js';

test('a blended bend preserves a finger cross-section instead of collapsing it',()=>{
  const real=[new THREE.Vector4(0,0,0,1),new THREE.Vector4(0,0,Math.sin(Math.PI/4),Math.cos(Math.PI/4))],dual=[new THREE.Vector4(),new THREE.Vector4()];
  const a=new THREE.Vector3(0,.01,0),b=new THREE.Vector3(0,-.01,0);
  for(const point of [a,b])transformDualQuaternion(point,[0,1,0,0],[.5,.5,0,0],real,dual);
  assert.ok(Math.abs(a.distanceTo(b)-.02)<1e-10);
  assert.ok(Math.abs(a.x+.01/Math.sqrt(2))<1e-10);
});

test('antipodal quaternion encodings produce the same translated surface point',()=>{
  const q=new THREE.Vector4(0,0,0,1),d=new THREE.Vector4(.05,.1,.15,0),p=new THREE.Vector3(.01,.02,.03);
  transformDualQuaternion(p,[0,1,0,0],[.5,.5,0,0],[q,q.clone().multiplyScalar(-1)],[d,d.clone().multiplyScalar(-1)]);
  assert.ok(p.distanceTo(new THREE.Vector3(.11,.22,.33))<1e-10);
});
