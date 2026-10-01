import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { subdivideSkin } from '../src/geometry.js';

test('subdivision welds a seam, keeps the surface closed and preserves valid bone weights',()=>{
  const source=new THREE.BufferGeometry();
  // A tetrahedron with a duplicate vertex, like a GLB UV seam.
  source.setAttribute('position',new THREE.Float32BufferAttribute([1,1,1,-1,-1,1,-1,1,-1,1,-1,-1,1,1,1],3));
  source.setAttribute('skinIndex',new THREE.Uint16BufferAttribute([0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0],4));
  source.setAttribute('skinWeight',new THREE.Float32BufferAttribute(Array.from({length:5},()=>[1,0,0,0]).flat(),4));
  source.setIndex([0,2,1,4,1,3,0,3,2,1,2,3]);
  const refined=subdivideSkin(source,2),edges=new Map();
  for(let i=0;i<refined.index.count;i+=3)for(let j=0;j<3;j++){
    const a=refined.index.array[i+j],b=refined.index.array[i+(j+1)%3],key=[a,b].sort((x,y)=>x-y).join(':');
    edges.set(key,(edges.get(key)??0)+1);
  }
  assert.equal(refined.index.count/3,64);
  assert.ok([...edges.values()].every(count=>count===2));
  assert.ok(Array.from(refined.attributes.position.array).every(Number.isFinite));
  assert.ok(Array.from(refined.attributes.normal.array).every(Number.isFinite));
  for(let i=0;i<refined.attributes.skinWeight.count;i++){
    const weights=Array.from(refined.attributes.skinWeight.array.slice(i*4,i*4+4));
    assert.ok(Math.abs(weights.reduce((a,b)=>a+b)-1)<1e-6);
    assert.ok(weights.every(w=>w>=0&&w<=1));
  }
  source.dispose();refined.dispose();
});
