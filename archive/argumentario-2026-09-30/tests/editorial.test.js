import {test} from 'node:test';
import assert from 'node:assert/strict';
import {editorialState,editorialDestination} from '../src/editorial.js';

test('el acercamiento queda sin texto y juntos aparece después del contacto',()=>{
  const approach=editorialState(5.50),contact=editorialState(5.74);
  assert.equal(approach.beats.prelude.opacity,0);
  assert.equal(approach.beats.meaning.opacity,0);
  assert.equal(contact.beats.meaning.opacity,1);
});
test('la entrega conserva el mensaje durante el cambio de capítulo y se deshace',()=>{
  assert.equal(editorialState(6.62).beats.meaning.opacity,0);
  const owned=editorialState(6.92);
  assert.equal(owned.beats.meaning.opacity,1);
  assert.equal(editorialState(7.04).index,6);
  assert.equal(editorialState(7.12).index,7);
  editorialState(8.6);assert.deepEqual(editorialState(6.92),owned);
});
test('los accesos directos a servicios llegan con explicación y acción legibles',()=>{
  const offsets=Array.from({length:15},(_,i)=>i*1000);
  for(const i of [8,9,10,12,13]){
    const progress=editorialDestination(i,offsets)/1000,state=editorialState(progress);
    assert.equal(state.index,i);assert.equal(state.beats.title.opacity,1);
    assert.equal(state.beats.action.opacity,1);
    if(state.beats.support)assert.equal(state.beats.support.opacity,1);
  }
});
test('el modo estable elimina las pausas tipográficas y el cierre permanece legible',()=>{
  for(const p of [1.02,5.5,6.2,8.03,12,13]){
    const state=editorialState(p,true);
    for(const beat of Object.values(state.beats)){assert.equal(beat.opacity,1);assert.equal(beat.y,0)}
  }
  for(const p of [13.18,13.6,14])for(const beat of Object.values(editorialState(p).beats))assert.equal(beat.opacity,1);
});
