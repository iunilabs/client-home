import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderBudget } from '../src/render-budget.js';

test('pixel budget responds to sustained slowness and recovers after stable fast frames',()=>{
  const ratios=[],budget=createRenderBudget({setPixelRatio:r=>ratios.push(r)},()=>1.5);
  let time=1;
  for(let i=0;i<40;i++){time+=.1;budget.update(time)}
  assert.equal(budget.scale,.65);assert.ok(ratios.every(r=>r>=.975&&r<=1.5));
  for(let i=0;i<600;i++){time+=1/60;budget.update(time)}
  assert.equal(budget.scale,1);assert.equal(ratios.at(-1),1.5);
});

test('reduced motion and returning from a hidden tab do not lower the pixel budget',()=>{
  const budget=createRenderBudget({setPixelRatio:()=>assert.fail('unexpected resolution change')},()=>1);
  for(let i=1;i<30;i++)budget.update(i*.08,true);
  for(let i=1;i<30;i++)budget.update(i*10);
  assert.equal(budget.scale,1);
});

test('a budget targeting smooth animation adapts to sustained 30fps',()=>{
  const budget=createRenderBudget({setPixelRatio:()=>{}},()=>2,{minScale:.6,slowInterval:.024,fastInterval:.018});
  let time=1;
  for(let i=0;i<30;i++){time+=1/30;budget.update(time)}
  assert.equal(budget.scale,.6);
  assert.equal(budget.pixelRatio,1.2);
  // Stopped rendering is not evidence that a busy animation can run faster.
  for(let i=0;i<300;i++){time+=1/60;budget.update(time,true)}
  assert.equal(budget.scale,.6);
  for(let i=0;i<800;i++){time+=1/60;budget.update(time)}
  assert.equal(budget.scale,1);
});
