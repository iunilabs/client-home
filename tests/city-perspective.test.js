import test from 'node:test';
import assert from 'node:assert/strict';
import {cityOrientation,createCityPerspective} from '../src/section-two/city-perspective.js';

function browser({secure=true, supported=true, permission=false}={}) {
  const target=new EventTarget();
  target.isSecureContext=secure;
  target.screen={orientation:Object.assign(new EventTarget(),{angle:0})};
  let requests=0, subscriptions=0;
  if(supported) target.DeviceOrientationEvent=permission?{requestPermission(){requests++;return Promise.resolve('granted')}}:{};
  const add=target.addEventListener.bind(target), remove=target.removeEventListener.bind(target);
  target.addEventListener=(type,handler)=>{if(type==='deviceorientation')subscriptions++;add(type,handler)};
  target.removeEventListener=(type,handler)=>{if(type==='deviceorientation')subscriptions--;remove(type,handler)};
  target.read=(beta,gamma)=>{const event=new Event('deviceorientation');Object.assign(event,{beta,gamma});target.dispatchEvent(event)};
  return {target,get requests(){return requests},get subscriptions(){return subscriptions}};
}
const active={active:true,reduced:false,paused:false};

test('first valid reading calibrates to zero, invalid data cannot move the map', () => {
  assert.equal(cityOrientation({beta:null,gamma:0},null),null);
  const first=cityOrientation({beta:70,gamma:12},null);
  assert.equal(first.x,0);assert.equal(first.y,0);
  const rotated=cityOrientation({beta:65,gamma:17},first.origin);
  assert.equal(rotated.x,.5);assert.equal(rotated.y,.5);
  const limit=cityOrientation({beta:-170,gamma:-75},first.origin);
  assert.equal(Math.abs(limit.x),2);assert.equal(Math.abs(limit.y),2);
});

test('screen rotation recalibrates and the beta wrap stays continuous', () => {
  const first=cityOrientation({beta:179,gamma:1},null);
  assert.ok(Math.abs(cityOrientation({beta:-179,gamma:1},first.origin).x+.2)<1e-8);
  const landscape=cityOrientation({beta:70,gamma:0},first.origin,90);
  assert.equal(landscape.x,0);assert.equal(landscape.y,0);
  const next=cityOrientation({beta:75,gamma:5},landscape.origin,90);
  assert.ok(Math.abs(next.x-.5)<1e-8);assert.ok(Math.abs(next.y-.5)<1e-8);
});

test('sensors are subscribed only during the city and freeze during interaction', () => {
  const fake=browser(), effect=createCityPerspective(fake.target);
  effect.update(0,{...active,active:false});assert.equal(fake.subscriptions,0);
  effect.update(1,active);assert.equal(fake.subscriptions,1);
  fake.target.read(60,0);effect.update(10,active);
  fake.target.read(40,20);
  const moving=effect.update(30,active);
  assert.ok(moving.x>0&&moving.x<2);assert.ok(moving.y>0&&moving.y<2);
  assert.equal(moving.state,'active');
  const paused=effect.update(50,{...active,paused:true});assert.equal(fake.subscriptions,0);
  assert.equal(paused.x,moving.x);assert.equal(paused.y,moving.y);assert.equal(paused.state,'paused');
  fake.target.read(-60,-50);
  assert.equal(effect.update(90,{...active,paused:true}).x,moving.x);
  effect.update(110,active);assert.equal(fake.subscriptions,1);
  fake.target.read(-60,-50);
  const resumed=effect.update(130,active);
  assert.ok(resumed.x<moving.x&&resumed.x>0);
  const hidden=effect.update(160,{...active,active:false});
  assert.equal(hidden.x,0);assert.equal(hidden.y,0);assert.equal(fake.subscriptions,0);
  effect.dispose();assert.equal(fake.subscriptions,0);
});

test('missing support and insecure contexts retain the normal city', () => {
  for(const options of [{secure:false},{supported:false}]) {
    const fake=browser(options),effect=createCityPerspective(fake.target);
    assert.deepEqual(effect.update(10,active),{x:0,y:0,hasReading:false,state:'unavailable'});
    assert.equal(fake.subscriptions,0);effect.dispose();
  }
});

test('automatic availability never invokes an iOS permission prompt', () => {
  const fake=browser({permission:true}),effect=createCityPerspective(fake.target);
  assert.equal(effect.update(0,active).state,'awaiting-sensor');
  assert.equal(fake.requests,0);
  // Events also work when permission was already granted outside this module.
  fake.target.read(50,0);assert.equal(effect.update(20,active).state,'active');
  effect.update(30,{...active,reduced:true});assert.equal(fake.subscriptions,0);
  assert.equal(fake.requests,0);effect.dispose();
});
