import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileTourRoute, mobileTourTiming, mobileTourHub} from '../src/section-two/mobile-tour-config.js';
import {mobileTourGeometry, mobileTourState, mobileTourCamera, mobileCardStack, tourEase} from '../src/section-two/mobile-tour.js';

test('mobile entrance stays anchored to the accepted encounter, even with only three clients', () => {
  const input = {top: 5200, viewport: 844};
  const all = mobileTourGeometry(input), three = mobileTourGeometry({...input, route: mobileTourRoute.slice(0, 3)});
  assert.equal(all.start, three.start);
  assert.equal(all.revealed, three.revealed);
  assert.equal(all.revealed, input.top - input.viewport + 90 + input.viewport * 1.35);
  assert.ok(Math.abs(all.height - three.height - (mobileTourRoute.length - 3) * mobileTourTiming.stop * input.viewport) < 1e-8);
  assert.equal(mobileTourState({scroll: input.top - input.viewport + 90, geometry: all}).active, false);
});

test('scroll visits the configured buildings in order and arrival precedes the card', () => {
  const route = [mobileTourRoute[4], mobileTourRoute[1], mobileTourRoute[8]];
  const geometry = mobileTourGeometry({top:5200,viewport:844,route});
  const at = (i, phase) => geometry.revealed + geometry.viewport * (mobileTourTiming.intro + (i + phase) * mobileTourTiming.stop);
  for (const [i, stop] of route.entries()) {
    const arrival = mobileTourState({scroll: at(i, mobileTourTiming.travelUntil), geometry, route});
    assert.equal(arrival.current.id, stop.id);
    assert.ok(Math.abs(arrival.travel - 1) < 1e-12);
    assert.equal(arrival.cardProgress, 0);
    assert.equal(arrival.previous.id, i ? route[i - 1].id : mobileTourHub.id);
    const hold = mobileTourState({scroll: at(i,.9), geometry, route});
    assert.equal(hold.cardProgress, 1);
  }
  const rewind = mobileTourState({scroll: at(1,.9), geometry, route});
  assert.equal(rewind.current.id, route[1].id);
  assert.equal(rewind.cardProgress, 1);
});

test('departures and arrivals accelerate and brake without an endpoint velocity jump', () => {
  const step = .00001;
  assert.equal(tourEase(-1),0); assert.equal(tourEase(2),1);
  assert.ok(tourEase(step) / step < 1e-7);
  assert.ok((1-tourEase(1-step)) / step < 1e-7);
  assert.ok(tourEase(.5)-tourEase(.49) > tourEase(.1)-tourEase(.09));
  assert.ok(tourEase(.5)-tourEase(.49) > tourEase(.9)-tourEase(.89));
});

test('a travelling camera never removes the previous card and the next accumulates above it', () => {
  const state = {stopIndex:3,cardProgress:0};
  assert.equal(mobileCardStack(2,state).incoming,1);
  assert.equal(mobileCardStack(3,state).incoming,0);
  assert.equal(mobileCardStack(4,state).incoming,0);
  const arrived = {...state,cardProgress:1};
  assert.equal(mobileCardStack(2,arrived).incoming,1);
  assert.equal(mobileCardStack(3,arrived).incoming,1);
  assert.deepEqual(mobileCardStack(2,state),mobileCardStack(2,{stopIndex:2,cardProgress:1}), 'the stack does not jump when the next journey starts');
  for (let index=0;index<=10;index++) {
    const card=mobileCardStack(index,{stopIndex:10,cardProgress:1});
    assert.equal(card.incoming,1);
    assert.ok(Math.abs(card.rotation)<1.2);
    assert.ok(card.offsetY>=-28);
  }
});

test('the original portrait covers the phone throughout every zoomed journey', () => {
  for (const [viewportWidth,viewportHeight] of [[320,568],[320,844],[390,844],[430,932],[699,844]]) {
    const width=Math.max(viewportWidth,viewportHeight*941/1672)*1.04,height=width*1672/941;
    const geometry=mobileTourGeometry({top:5200,viewport:viewportHeight});
    for (let sample=0;sample<=500;sample++) {
      const scroll=geometry.start+(geometry.end-geometry.start)*sample/500;
      const state=mobileTourState({scroll,geometry});
      const camera=mobileTourCamera(state,{width,height,viewportWidth,viewportHeight});
      assert.ok(camera.left<=0 && camera.top<=0);
      assert.ok(camera.left+width*camera.zoom>=viewportWidth);
      assert.ok(camera.top+height*camera.zoom>=viewportHeight);
    }
  }
});

test('available sensor tilt cannot uncover a corner during the guided tour', () => {
  for (const [viewportWidth,viewportHeight] of [[320,568],[390,844],[699,844]]) {
    const width=Math.max(viewportWidth,viewportHeight*941/1672)*1.04,height=width*1672/941;
    const geometry=mobileTourGeometry({top:5200,viewport:viewportHeight});
    for (let sample=0;sample<=120;sample++) {
      const state=mobileTourState({scroll:geometry.start+(geometry.end-geometry.start)*sample/120,geometry});
      const view=mobileTourCamera(state,{width,height,viewportWidth,viewportHeight});
      const depth=Math.max(width,height)*2.5;
      for(const rx of [-2,2])for(const ry of [-2,2]){
        const ax=rx*Math.PI/180,ay=ry*Math.PI/180;
        const polygon=[[0,0],[width,0],[width,height],[0,height]].map(([px,py])=>{
          const x=px-view.focusX*width,y=py-view.focusY*height;
          const yy=y*Math.cos(ax)+x*Math.sin(ay)*Math.sin(ax);
          const z=y*Math.sin(ax)-x*Math.sin(ay)*Math.cos(ax),scale=view.zoom*depth/(depth-z);
          return {x:view.left+view.focusX*width*view.zoom+x*Math.cos(ay)*scale,
            y:view.top+view.focusY*height*view.zoom+yy*scale};
        });
        for(const [x,y]of [[0,0],[viewportWidth,0],[viewportWidth,viewportHeight],[0,viewportHeight]]){
          assert.ok(polygon.every((a,i)=>{const b=polygon[(i+1)%4];return(b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x)>=-1e-6}),JSON.stringify({viewportWidth,viewportHeight,sample,rx,ry,x,y}));
        }
      }
    }
  }
});
