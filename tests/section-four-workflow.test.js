import test from 'node:test';
import assert from 'node:assert/strict';
import {workflowState, cardWorkflow, WORKFLOW} from '../src/section-four/workflow.js';

test('ordering flows directly into the three representative cases', () => {
  assert.equal(WORKFLOW.ordered, WORKFLOW.processStart);
  for (const p of [0, .08, .16, WORKFLOW.processStart]) {
    const state = workflowState(p, 47);
    assert.equal(state.completed, 0); assert.equal(state.cursor, 0);
    assert.equal(state.exampleIndex, 0); assert.equal(state.activeIndex, null);
  }
  assert.equal(workflowState(WORKFLOW.ordered, 47).ordered, 1);
});

test('47 incoming papers produce three readable cases, not a processing queue', () => {
  for (let i = 0; i < 3; i++) {
    const p = WORKFLOW.processStart + (WORKFLOW.finished - WORKFLOW.processStart) * (i + .8) / 3;
    const state = workflowState(p, 47);
    assert.equal(state.exampleCount, 3); assert.equal(state.exampleIndex, i);
    assert.equal(state.completed, i); assert.equal(state.resultReveal, 1);
    const cards = Array.from({length:47}, (_, index) => cardWorkflow(state,index,47,390,844,true));
    assert.equal(cards.filter(card => card.travel > 0 || card.done).length, 0);
  }
});

test('conclusion follows the last case and reverse scroll restores every phase', () => {
  const final = workflowState(1,47);
  assert.equal(final.completed,3); assert.equal(final.pending,0); assert.equal(final.conclusion,true);
  assert.equal(final.backgroundOpacity,0); assert.equal(final.activeIndex,null);
  for (const p of [.06,.34,.54,.74]) {
    const before = workflowState(p,47); workflowState(1,47);
    assert.deepEqual(workflowState(p,47),before); assert.equal(before.conclusion,false);
  }
});

test('the field fades together and stays invisible throughout the demonstration', () => {
  let previous=1;
  for (let i=0;i<=1000;i++) {
    const state=workflowState(i/1000,47);
    assert.ok(state.backgroundOpacity<=previous); previous=state.backgroundOpacity;
    if(i/1000>=.22)assert.equal(state.backgroundOpacity,0);
  }
});

test('the ordering pose preserves aspect ratio in phone and landscape viewports', () => {
  for(const [width,height,portrait] of [[1440,900,false],[390,844,true],[320,568,true],[844,390,false]])for(const aspect of [.86,.95,1.62]) {
    const card=cardWorkflow(workflowState(.08,47),27,47,width,height,portrait,aspect);
    assert.ok(card.pixelWidth<=width*(portrait?.38:.28));
    assert.ok(card.pixelWidth/aspect<=height*(height<=460?.26:.38)+.001);
  }
});
