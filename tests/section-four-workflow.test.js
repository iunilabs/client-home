import test from 'node:test';
import assert from 'node:assert/strict';
import {workflowState, cardWorkflow, WORKFLOW} from '../src/section-four/workflow.js';

test('all papers are ordered before the first one starts moving', () => {
  for (const p of [0, .08, .16, .23, WORKFLOW.processStart]) {
    const state = workflowState(p, 47);
    assert.equal(state.completed, 0);
    assert.equal(state.cursor, 0);
    assert.equal(state.activeIndex, null);
  }
  assert.equal(workflowState(WORKFLOW.ordered, 47).ordered, 1);
});

test('each of the 47 papers moves alone and only turns green near arrival', () => {
  for (let i = 0; i < 47; i++) {
    const progress = cursor => WORKFLOW.processStart + (WORKFLOW.finished - WORKFLOW.processStart) * cursor / 47;
    const state = workflowState(progress(i + .5), 47);
    const cards = Array.from({length: 47}, (_, index) => cardWorkflow(state, index, 47, 390, 844, true));
    assert.equal(state.completed, i);
    assert.equal(state.activeIndex, i);
    assert.equal(cards.filter(c => c.travel > 0 && c.travel < 1).length, 1);
    assert.equal(cards.filter(c => c.done).length, i);
    assert.equal(cardWorkflow(workflowState(progress(i + .9), 47), i, 47, 390, 844, true).done, true);
  }
});

test('completion settles before the end and reverse scroll restores pending papers', () => {
  const final = workflowState(1, 47);
  assert.equal(final.completed, 47); assert.equal(final.pending, 0); assert.equal(final.fraction, 1);
  assert.equal(final.activeIndex, null);
  const before = workflowState(.5, 47);
  workflowState(.8, 47);
  assert.deepEqual(workflowState(.5, 47), before);
  assert.equal(cardWorkflow(workflowState(WORKFLOW.ordered, 47), 0, 47, 1440, 900, false).done, false);
});

test('tall papers fit mobile and landscape while retaining their aspect ratio', () => {
  for (const [width, height, portrait] of [[1440,900,false],[390,844,true],[320,568,true],[844,390,false]]) {
    for (const aspect of [.86, .95, 1.62]) {
      const card = cardWorkflow(workflowState(.7, 47), 27, 47, width, height, portrait, aspect);
      assert.ok(card.pixelWidth <= width * (portrait ? .38 : .28));
      assert.ok(card.pixelWidth / aspect <= height * (height <= 460 ? .26 : .38) + .001);
    }
  }
});
