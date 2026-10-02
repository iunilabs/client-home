import test from 'node:test';
import assert from 'node:assert/strict';
import {cityExtent} from '../src/section-two/city-extent.js';
import {cityPanBounds} from '../src/section-two/city-pan.js';
import {cityFocusTarget, createCityFocusMotion} from '../src/section-two/city-focus.js';

test('selected roof stays centred beside the card while every viewport corner remains covered', () => {
  for (const [viewportWidth, viewportHeight, cardRight] of [[1424,873,423],[900,600,327],[700,600,321]]) {
    const coreWidth = Math.max(viewportWidth, viewportHeight * 1672 / 941) * 1.04;
    const extent = cityExtent({width:coreWidth, height:coreWidth * 941 / 1672, originX:.52, originY:.48});
    for (const [x,y] of [[.162,.162],[.494,.129],[.757,.271],[.514,.598],[.304,.74]]) {
      const point = {x:(extent.coreLeft + coreWidth * x) / extent.width,
        y:(extent.coreTop + extent.coreHeight * y) / extent.height};
      const layout = {...extent, viewportWidth, viewportHeight, point, zoom:2.6, cardRight};
      const view = cityFocusTarget(layout), bounds = cityPanBounds(layout);
      const project = (axis, size, origin, viewport) => viewport / 2 + view[axis] +
        view.zoom * (point[axis] - .5) * size + (1 - view.zoom) * (origin - .5) * size;
      assert.ok(Math.abs(project('x', extent.width, extent.originX, viewportWidth) - (cardRight + 24 + viewportWidth - 32) / 2) < 1);
      assert.ok(Math.abs(project('y', extent.height, extent.originY, viewportHeight) - viewportHeight * .44) < 1);
      assert.ok(view.x >= bounds.minX && view.x <= bounds.maxX && view.y >= bounds.minY && view.y <= bounds.maxY);
    }
  }
});

test('pan and zoom arrive together regardless of frame cadence, and changing client starts at the visible camera', () => {
  const from = {x:0,y:0,zoom:1.1}, to = {x:880,y:640,zoom:2.6};
  const frequent = createCityFocusMotion(), sparse = createCityFocusMotion();
  frequent.travel(from,to,1000); sparse.travel(from,to,1000);
  assert.deepEqual(sparse.update(800),from, 'a queued frame before the click cannot extrapolate');
  for (let now = 1000; now <= 1600; now += 10) frequent.update(now);
  assert.deepEqual(sparse.update(1600),frequent.update(1600));
  const visible = {...frequent.update(1700)};
  assert.ok(Math.abs(visible.x / to.x - (visible.zoom - from.zoom) / (to.zoom - from.zoom)) < 1e-10);
  const next = {x:-400,y:300,zoom:2.1};
  frequent.travel(visible,next,1700);
  assert.deepEqual(frequent.update(1700),visible);
  assert.deepEqual(frequent.update(4000),next); assert.equal(frequent.moving,false);
});

test('reduced motion frames the requested building immediately and closing clears the camera', () => {
  const motion = createCityFocusMotion(), to = {x:120,y:250,zoom:2.6};
  motion.travel({x:0,y:0,zoom:1},to,1000,true);
  assert.deepEqual(motion.update(1000),to); assert.equal(motion.moving,false);
  motion.reset(); assert.equal(motion.update(1100),null); assert.equal(motion.moving,false);
});
