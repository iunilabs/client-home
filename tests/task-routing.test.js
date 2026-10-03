import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLES,applyRoutingAppearance} from '../src/section-four/routing-model.js';
import {workflowState,cardWorkflow} from '../src/section-four/workflow.js';

test('representative outcomes keep human review explicit',()=>{
  assert.equal(EXAMPLES.length,3);
  assert.deepEqual(EXAMPLES.map(example=>example.id),['correo','documento','incidencia']);
  for(const example of EXAMPLES){assert.ok(example.review.startsWith('Tu equipo'));assert.equal(example.details.length,3);}
});

test('a collective fade hides the original meshes without affecting early entrances',()=>{
  const material={opacity:1,transparent:false},piece={mesh:{visible:false},materials:()=>[material]};
  const at=p=>{const state=workflowState(p,47);applyRoutingAppearance(piece,cardWorkflow(state,12,47,390,844,true),state);};
  at(0);assert.equal(piece.mesh.visible,false);assert.equal(material.opacity,1);
  piece.mesh.visible=true;at(.12);assert.ok(material.opacity>0&&material.opacity<1);
  at(.24);assert.equal(piece.mesh.visible,false);assert.equal(material.opacity,0);assert.equal(piece.mesh.castShadow,false);
  // The original falling choreography owns visibility when returning to chaos.
  piece.mesh.visible=true;at(0);assert.equal(piece.mesh.visible,true);assert.equal(material.opacity,1);assert.equal(material.transparent,false);assert.equal(piece.mesh.castShadow,true);
});
