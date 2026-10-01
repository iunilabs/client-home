import test from 'node:test';
import assert from 'node:assert/strict';
import {cityExtent} from '../src/section-two/city-extent.js';

test('each new edge contains a full quarter of the accepted district', () => {
  for (const [width,height] of [[494,878],[1551,873]]) {
    const e=cityExtent({width,height,originX:.52,originY:.48});
    assert.equal(e.coreWidth,width);assert.equal(e.coreHeight,height);
    assert.equal(e.coreLeft,width*.25);assert.equal(e.width-e.coreLeft-width,width*.25);
    assert.equal(e.coreTop,height*.25);assert.equal(e.height-e.coreTop-height,height*.25);
  }
});

test('all roof points preserve screen position and scale through the zoom', () => {
  for(const [width,height,originX,originY] of [[494,878,.56,.43],[1551,873,.52,.48]]) {
    const e=cityExtent({width,height,originX,originY});
    for(const zoom of [1,1.08,1.3,1.5]) for(const [x,y] of [[.142,.144],[.494,.129],[.295,.312],[.304,.74],[.52,.323]]) {
      const beforeX=(x-originX)*width*zoom+(originX-.5)*width;
      const beforeY=(y-originY)*height*zoom+(originY-.5)*height;
      const afterX=(e.coreLeft+x*width-e.originX*e.width)*zoom+(e.originX-.5)*e.width;
      const afterY=(e.coreTop+y*height-e.originY*e.height)*zoom+(e.originY-.5)*e.height;
      assert.ok(Math.abs(afterX-beforeX)<1e-9);assert.ok(Math.abs(afterY-beforeY)<1e-9);
    }
  }
});
