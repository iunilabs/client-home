import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { refineTexturedSkin } from '../src/textured-skin-geometry.js';

test('textured refinement keeps UV seams apart while smoothing a shared physical surface',()=>{
  const source=new THREE.BufferGeometry();
  source.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,1,1,0,0,0,0,1,1,0,0,1,0],3));
  source.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,.2,.2,.8,.8,.2,.8],2));
  source.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(Array.from({length:6},(_,i)=>[i%2,0,0,0]).flat(),4));
  source.setAttribute('skinWeight',new THREE.Float32BufferAttribute(Array.from({length:6},()=>[1,0,0,0]).flat(),4));source.setIndex([0,1,2,3,4,5]);
  const refined=refineTexturedSkin(source),position=refined.attributes.position,uv=refined.attributes.uv;
  assert.deepEqual(new THREE.Vector3().fromBufferAttribute(position,0).toArray(),new THREE.Vector3().fromBufferAttribute(position,3).toArray());
  assert.deepEqual(new THREE.Vector3().fromBufferAttribute(position,2).toArray(),new THREE.Vector3().fromBufferAttribute(position,4).toArray());
  assert.notEqual(uv.getX(0),uv.getX(3));assert.notEqual(uv.getY(0),uv.getY(3));
  for(let i=0;i<position.count;i++){let weight=0;for(let j=0;j<4;j++)weight+=refined.attributes.skinWeight.array[i*4+j];assert.ok(Math.abs(weight-1)<1e-6);assert.ok(new THREE.Vector3().fromBufferAttribute(position,i).toArray().every(Number.isFinite))}
  assert.equal(refined.index.count,24);assert.equal(source.index.count,6);
});
