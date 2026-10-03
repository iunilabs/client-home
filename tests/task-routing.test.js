import test from 'node:test';
import assert from 'node:assert/strict';
import {routeFor,routingPose,applyRoutingAppearance} from '../src/section-four/routing-model.js';
import {cardWorkflow,workflowState} from '../src/section-four/workflow.js';

test('approvals and release decisions are routed to a team, while documents can be prepared',()=>{
  for(const kind of ['approval','qa','deploy','ticket','chat','call'])assert.equal(routeFor(kind),2);
  for(const kind of ['document','summary','test'])assert.equal(routeFor(kind),1);
  for(const kind of ['email','task','note'])assert.equal(routeFor(kind),0);
});

test('each task reaches the IA hub before taking its route, on desktop and phone',()=>{
  for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
    const destinations=[];
    for(const kind of ['email','document','approval']){
      const base=cardWorkflow(workflowState(.5,47),20,47,width,height,width<700);
      const at=travel=>routingPose({...base,travel},kind,width,height);
      assert.equal(at(0).opacity,1);
      assert.equal(at(.6).x,0);
      assert.equal(at(1).opacity,0);
      destinations.push([at(1).x,at(1).y]);
      let previous=at(0);
      for(let i=1;i<=1000;i++){
        const next=at(i/1000);
        assert.ok(Math.hypot(next.x-previous.x,next.y-previous.y)<.02,'no teleport at the IA hub or destination');
        assert.ok(next.opacity<=previous.opacity);
        previous=next;
      }
    }
    assert.equal(new Set(destinations.map(p=>p.join('/'))).size,3);
  }
});

test('reversing scroll restores the same route and paper appearance',()=>{
  const at=progress=>{
    const state=workflowState(progress,47);
    return routingPose(cardWorkflow(state,12,47,390,844,true),'approval',390,844);
  };
  const before=at(.425);
  at(.9);
  assert.deepEqual(at(.425),before);
  assert.equal(at(.24).opacity,1);
});

test('routing preserves hidden, not-yet-entered papers during the initial falls',()=>{
  const material={opacity:1,transparent:false},piece={mesh:{visible:false},materials:()=>[material]};
  applyRoutingAppearance(piece,{opacity:1},{ordered:0});
  assert.equal(piece.mesh.visible,false);
  assert.equal(material.transparent,false);
  piece.mesh.visible=true;
  applyRoutingAppearance(piece,{opacity:0},{ordered:1});
  assert.equal(piece.mesh.visible,false);
  assert.equal(material.opacity,0);
  // The fall scene restores visibility itself when scroll returns to the first paper.
  piece.mesh.visible=true;
  applyRoutingAppearance(piece,{opacity:1},{ordered:0});
  assert.equal(piece.mesh.visible,true);
  assert.equal(material.transparent,false);
  assert.equal(material.opacity,1);
});
