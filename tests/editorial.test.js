import {test} from 'node:test';
import assert from 'node:assert/strict';
import {editorialState} from '../src/editorial.js';

test('each historical reach has one legible message and the closing message remains',()=>{
  for(const [ratio,index] of [[0,0],[.25,1],[.5,2],[.82,3],[1,4]]){
    const state=editorialState(ratio);
    assert.equal(state.index,index);
    assert.equal(state.beats[index].opacity,1);
    assert.equal(state.beats.filter(beat=>beat.opacity>0).length,1);
  }
});
test('messages never overlap and rewind restores the same appearance',()=>{
  for(let step=0;step<=1000;step++){
    const state=editorialState(step/1000);
    assert.ok(state.beats.filter(beat=>beat.opacity>0).length<=1);
    for(const beat of state.beats)assert.ok(beat.opacity>=0&&beat.opacity<=1);
  }
  const before=editorialState(.21);
  editorialState(1);
  assert.deepEqual(editorialState(.21),before);
  assert.ok(before.beats[1].opacity>0&&before.beats[1].opacity<1);
});
test('reduced motion keeps one complete message and removes displacement and blur',()=>{
  for(const ratio of [0,.175,.39,.615,.915,1]){
    const {index,beats}=editorialState(ratio,true);
    assert.equal(beats[index].opacity,1);
    assert.equal(beats.filter(beat=>beat.opacity>0).length,1);
    assert.ok(beats.every(beat=>beat.y===0&&beat.blur===0));
  }
});
