import test from 'node:test';
import assert from 'node:assert/strict';
import {pregraspCorridors,sampleGestureCurve} from '../src/human-pregrasp.js';

const curves=pregraspCorridors.flatMap(c=>[...c.flex.flat(),c.opposition,c.wrist]);

test('pregrasp curves return to the locked pose and never exceed authored ranges',()=>{
 for(const curve of curves){
  assert.equal(sampleGestureCurve(curve,curve[0][0]-1),0);
  assert.equal(sampleGestureCurve(curve,curve[0][0]),0);
  assert.equal(sampleGestureCurve(curve,curve.at(-1)[0]),0);
  assert.equal(sampleGestureCurve(curve,1),0);
  for(let i=0;i<curve.length-1;i++){
   const [a,y0]=curve[i],[b,y1]=curve[i+1];
   for(let j=0;j<=100;j++){
    const y=sampleGestureCurve(curve,a+(b-a)*j/100);
    assert.ok(Number.isFinite(y));
    assert.ok(y>=Math.min(y0,y1)-1e-12&&y<=Math.max(y0,y1)+1e-12);
   }
  }
 }
});

test('pregrasp velocity is continuous through keys and at the return to each lock',()=>{
 const epsilon=1e-7;
 for(const curve of curves)for(const [at,y] of curve){
  const left=(y-sampleGestureCurve(curve,at-epsilon))/epsilon;
  const right=(sampleGestureCurve(curve,at+epsilon)-y)/epsilon;
  assert.ok(Math.abs(left-right)<.003,`velocity jump at ${at}: ${left} / ${right}`);
 }
});
