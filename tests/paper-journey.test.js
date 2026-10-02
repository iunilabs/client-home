import test from 'node:test';
import assert from 'node:assert/strict';
import {paperJourneyState,paperJourneyScrollAt} from '../src/section-three/journey.js';
import {workflowState,WORKFLOW} from '../src/section-four/workflow.js';

test('chaos and resolution occupy adjacent parts of one scroll range',()=>{
  for(const [chaosRange,workflowRange] of [[1900,780],[1900,1688],[1900,2000]]){
    const layout={start:9000,chaosRange,workflowRange,totalRange:chaosRange+workflowRange};
    const seam=paperJourneyState(chaosRange,layout);
    assert.equal(seam.chaos,1); assert.equal(seam.workflow,0);
    const next=paperJourneyState(chaosRange+10,layout);
    assert.ok(workflowState(next.workflow,47).ordered>0, 'the next scroll pixels advance ordering immediately');
    assert.equal(WORKFLOW.ordered,WORKFLOW.processStart, 'processing follows ordering without another idle range');
    assert.equal(paperJourneyScrollAt(layout,'chaos',1),paperJourneyScrollAt(layout,'workflow',0));
    const sample=paperJourneyState(chaosRange+workflowRange*.6,layout);
    paperJourneyState(0,layout); paperJourneyState(layout.totalRange,layout);
    assert.deepEqual(paperJourneyState(chaosRange+workflowRange*.6,layout),sample);
    assert.equal(paperJourneyState(layout.totalRange,layout).progress,1);
  }
});
