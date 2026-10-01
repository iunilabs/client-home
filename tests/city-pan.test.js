import test from 'node:test';
import assert from 'node:assert/strict';
import {cityPanBounds, createCityTouchGesture, createCityPanMotion} from '../src/section-two/city-pan.js';
import {cityExtent} from '../src/section-two/city-extent.js';

const finger = (x, y, id = 1) => ({x, y, id});

test('logo travel is gradual, bounded and identical at different frame rates', () => {
  const regular = createCityPanMotion(), sparse = createCityPanMotion();
  regular.reveal(400, -200, 1000); sparse.reveal(400, -200, 1000);
  assert.deepEqual(regular.position, {x: 0, y: 0});
  let prior = 0;
  for (let now = 1000; now <= 1600; now += 10) {
    const p = regular.update(now);
    assert.ok(p.x >= prior && p.x < 400 && p.y > -200 && p.y <= 0);
    prior = p.x;
  }
  assert.deepEqual(sparse.update(1600), regular.position);
  assert.ok(regular.position.x > 0 && regular.position.x < 400);
  assert.deepEqual(regular.update(2300), {x: 400, y: -200});
});

test('repeated hover does not restart travel and changing logos starts from the visible position', () => {
  const motion = createCityPanMotion();
  motion.reveal(400, 200, 1000);
  motion.update(1400);
  const visible = {...motion.position};
  motion.reveal(400, 200, 1400);
  assert.deepEqual(motion.update(2300), {x: 400, y: 200});
  motion.moveTo(visible.x, visible.y);
  motion.reveal(-100, -80, 2500);
  assert.deepEqual(motion.update(2500), visible);
  assert.deepEqual(motion.update(3800), {x: -100, y: -80});
});

test('manual drag interrupts logo travel and limits never expose artwork edges', () => {
  const motion = createCityPanMotion();
  motion.reveal(800, -400, 0);
  motion.constrain({minX: -150, maxX: 150, minY: -100, maxY: 100});
  assert.deepEqual(motion.update(1300), {x: 150, y: -100});
  motion.reveal(-150, 100, 1500);
  motion.update(1700);
  motion.moveTo(40, 25);
  assert.deepEqual(motion.update(3000), {x: 40, y: 25});
});

test('a horizontal start can continue in both axes and reverse without scrolling', () => {
  const gesture = createCityTouchGesture(), position = {x: 12, y: -8};
  assert.equal(gesture.start([finger(100,100)], position), false);
  assert.equal(gesture.move([finger(102,101)], position).mode, 'pending');
  assert.deepEqual(gesture.move([finger(110,101)], position), {mode:'map',x:22,y:-7});
  assert.deepEqual(gesture.move([finger(107,150)], position), {mode:'map',x:19,y:42});
  assert.deepEqual(gesture.move([finger(60,90)], position), {mode:'map',x:-28,y:-18});
  assert.equal(gesture.end([], position), true);
  assert.equal(gesture.mode, 'idle');
});

test('a vertical start stays with the page for the rest of that gesture', () => {
  const gesture = createCityTouchGesture(), position = {x:0,y:0};
  gesture.start([finger(100,100)], position);
  assert.deepEqual(gesture.move([finger(101,110)], position), {mode:'scroll'});
  assert.deepEqual(gesture.move([finger(160,114)], position), {mode:'scroll'});
  assert.equal(gesture.start([finger(160,114),finger(200,120,2)], position), false);
  assert.deepEqual(gesture.move([finger(170,124),finger(210,130,2)], position), {mode:'scroll'});
  gesture.end([], position);
  assert.equal(gesture.start([finger(100,100),finger(200,100,2)], position), true);
});

test('two fingers pan by their centre and adding or lifting a finger never jumps', () => {
  const gesture = createCityTouchGesture(), position = {x:0,y:0};
  gesture.start([finger(100,100),finger(200,100,2)], position);
  assert.deepEqual(gesture.move([finger(110,130),finger(210,130,2)], position), {mode:'map',x:10,y:30});
  const clamped = {x:5,y:20};
  gesture.end([finger(210,130,2)], clamped);
  assert.deepEqual(gesture.move([finger(210,130,2)], clamped), {mode:'map',x:5,y:20});
  assert.deepEqual(gesture.move([finger(220,150,2)], clamped), {mode:'map',x:15,y:40});
  gesture.start([finger(220,150,2),finger(50,50,3)], clamped);
  assert.deepEqual(gesture.move([finger(220,150,2),finger(50,50,3)], clamped), {mode:'map',x:5,y:20});
  gesture.reset();
  assert.equal(gesture.mode, 'idle');
});

test('a clamped map drag can reverse immediately without traversing the overshoot', () => {
  const gesture=createCityTouchGesture();
  gesture.start([finger(100,100)],{x:0,y:0});
  assert.equal(gesture.move([finger(180,100)],{x:0,y:0}).x,80);
  // The adapter clamps to the artwork edge and rebases from this contact.
  gesture.start([finger(180,100)],{x:10,y:0});
  assert.equal(gesture.move([finger(175,100)],{x:10,y:0}).x,5);
});

// Project the four corners with the same CSS order: rotateY, rotateX,
// perspective, scale, translation. Test the polygon, not its bounding box.
function projected(g, panX, panY, rx, ry) {
  const sinX=Math.sin(rx*Math.PI/180), cosX=Math.cos(rx*Math.PI/180);
  const sinY=Math.sin(ry*Math.PI/180), cosY=Math.cos(ry*Math.PI/180);
  const depth=Math.max(g.width,g.height)*2.5;
  return [[0,0],[g.width,0],[g.width,g.height],[0,g.height]].map(([px,py])=>{
    const x=px-g.width*g.originX, y=py-g.height*g.originY;
    const yy=y*cosX+x*sinY*sinX, z=y*sinX-x*sinY*cosX;
    const scale=g.zoom*depth/(depth-z);
    return {x:g.viewportWidth/2+panX+(g.originX-.5)*g.width+x*cosY*scale,
      y:g.viewportHeight/2+panY+(g.originY-.5)*g.height+yy*scale};
  });
}
function contains(polygon, x, y) {
  return polygon.every((a,i)=>{
    const b=polygon[(i+1)%polygon.length];
    return (b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x)>=-1e-6;
  });
}

test('real artwork covers every viewport corner at both pan limits and maximum tilt', () => {
  for (const [viewportWidth,viewportHeight] of [[320,568],[320,844],[390,844],[768,1024],[1280,720],[2560,1080]]) {
    const portrait=viewportWidth<700, aspect=portrait?941/1672:1672/941;
    const width=Math.max(viewportWidth,viewportHeight*aspect)*1.04;
    for (const zoom of [1,1.08,1.25,1.5]) for (const angle of [0,1,2]) {
      const extent=cityExtent({width,height:width/aspect,originX:portrait?.56:.52,originY:portrait?.43:.48});
      const g={...extent,viewportWidth,viewportHeight,zoom,reserve:angle*.0085};
      const b=cityPanBounds(g);
      for (const panX of [b.minX,b.maxX]) for (const panY of [b.minY,b.maxY])
        for (const rx of [-angle,angle]) for (const ry of [-angle,angle]) {
          const polygon=projected(g,panX,panY,rx,ry);
          for (const [x,y] of [[0,0],[viewportWidth,0],[viewportWidth,viewportHeight],[0,viewportHeight]])
            assert.ok(contains(polygon,x,y), JSON.stringify({viewportWidth,viewportHeight,zoom,angle,panX,panY,rx,ry,x,y}));
        }
    }
  }
});
