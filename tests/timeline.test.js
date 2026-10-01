import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneProgress,sampleFrames } from '../src/timeline.js';

test('progreso continuo en capítulos de distinta longitud, con límites y retorno',()=>{
  const offsets=[0,920,1540,3140];
  assert.equal(sceneProgress(offsets,-50),0);
  assert.equal(sceneProgress(offsets,1230),1.5);
  assert.equal(sceneProgress(offsets,4000),3);
  const journey=[2000,3100,1000,0].map(y=>sceneProgress(offsets,y));
  assert.ok(journey[2]<journey[0]);assert.equal(journey.at(-1),0);
});
test('interpolación reproducible y sin saltos en el límite entre poses',()=>{
  const frames=[{at:0,camera:[0,1,10],curl:0},{at:1,camera:[3,4,12],curl:.7},{at:2,camera:[-1,1,8],curl:.2}];
  const initial=sampleFrames(frames,.6);sampleFrames(frames,1.8);
  assert.deepEqual(sampleFrames(frames,.6),initial);
  for(const p of [.99999,1,1.00001]){
    const state=sampleFrames(frames,p);assert.ok(Math.abs(state.camera[0]-3)<1e-6);assert.ok(Math.abs(state.curl-.7)<1e-6);
  }
});
