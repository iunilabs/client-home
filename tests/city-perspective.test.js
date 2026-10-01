import test from 'node:test';
import assert from 'node:assert/strict';
import {cityOrientation,createCityPerspective} from '../src/section-two/city-perspective.js';

function browser({secure=true, supported=true, requestPermission}={}) {
  const target=new EventTarget();
  target.isSecureContext=secure;
  target.document={hidden:false};
  target.screen={orientation:Object.assign(new EventTarget(),{angle:0})};
  let requests=0, subscriptions=0, reduced=false;
  target.matchMedia=()=>({matches:reduced});
  if(supported) target.DeviceOrientationEvent=requestPermission === undefined ? {} : {
    requestPermission(){requests++;return typeof requestPermission === 'function' ? requestPermission() : Promise.resolve(requestPermission)}
  };
  const add=target.addEventListener.bind(target), remove=target.removeEventListener.bind(target);
  target.addEventListener=(type,handler)=>{if(type==='deviceorientation')subscriptions++;add(type,handler)};
  target.removeEventListener=(type,handler)=>{if(type==='deviceorientation')subscriptions--;remove(type,handler)};
  target.read=(beta,gamma)=>{const event=new Event('deviceorientation');Object.assign(event,{beta,gamma});target.dispatchEvent(event)};
  return {target,get requests(){return requests},get subscriptions(){return subscriptions},set reduced(value){reduced=value}};
}
const active={active:true,reduced:false,paused:false};

test('first valid reading calibrates to zero; null data and wraparound are safe', () => {
  assert.equal(cityOrientation({beta:null,gamma:0},null),null);
  const first=cityOrientation({beta:179,gamma:1},null);
  assert.equal(first.x,0);assert.equal(first.y,0);
  assert.ok(Math.abs(cityOrientation({beta:-179,gamma:1},first.origin).x+.2)<1e-8);
  const limit=cityOrientation({beta:-100,gamma:-100},first.origin);
  assert.equal(Math.abs(limit.x),2);assert.equal(Math.abs(limit.y),2);
});

test('permission is requested only by explicit activation and handles grant/deny/reject', async () => {
  const granted=browser({requestPermission:'granted'}), effect=createCityPerspective(granted.target);
  effect.update(0,active);assert.equal(granted.requests,0);assert.equal(granted.subscriptions,0);
  const pending=effect.activate();assert.equal(granted.requests,1); // request starts synchronously in the tap handler
  assert.equal(await pending,'awaiting-sensor');
  effect.update(20,active);assert.equal(granted.subscriptions,1);
  granted.target.read(55,5);assert.equal(effect.update(40,active).hasReading,true);
  assert.equal(await effect.activate(),'inactive');effect.update(60,active);assert.equal(granted.subscriptions,0);

  for (const requestPermission of ['denied',()=>Promise.reject(new Error('blocked'))]) {
    const fake=browser({requestPermission}), controller=createCityPerspective(fake.target);
    assert.equal(await controller.activate(),requestPermission==='denied'?'denied':'error');
    assert.equal(fake.subscriptions,0);
    for(let i=0;i<4;i++)controller.update(10+i,active);
    assert.equal(controller.update(15,active).state,requestPermission==='denied'?'denied':'error');
    assert.equal(fake.requests,1); // never prompts automatically; feedback survives rendering
    controller.dispose();
  }
  let finish;const slow=browser({requestPermission:()=>new Promise(resolve=>{finish=resolve})}),waiting=createCityPerspective(slow.target);
  const first=waiting.activate(),second=waiting.activate();assert.equal(slow.requests,1);
  finish('granted');assert.equal(await first,'awaiting-sensor');assert.equal(await second,'awaiting-sensor');
});

test('permissionless browsers activate on tap, recalibrate on rotation and ignore null readings', async () => {
  const fake=browser(), effect=createCityPerspective(fake.target);
  assert.equal(await effect.activate(),'awaiting-sensor');effect.update(0,active);
  fake.target.read(60,0);effect.update(20,active);fake.target.read(50,15);
  const moving=effect.update(30,active);assert.ok(Math.abs(moving.x)>0);
  fake.target.read(null,null);const missing=effect.update(40,active);assert.equal(missing.hasReading,false);
  assert.ok(Math.abs(missing.x)<Math.abs(moving.x));
  fake.target.screen.orientation.angle=90;
  fake.target.screen.orientation.dispatchEvent(new Event('change'));
  fake.target.read(45,3);const rotated=effect.update(40,active);
  assert.equal(rotated.x,missing.x);assert.equal(rotated.y,missing.y); // no camera jump at recalibration
  fake.target.read(50,8);const shifted=effect.update(60,active);
  assert.ok(Number.isFinite(shifted.x)&&Number.isFinite(shifted.y));
  assert.equal(fake.requests,0);effect.dispose();
});

test('pause, background, reduced motion, insecure and missing sensors stay bounded and silent', async () => {
  const fake=browser(), effect=createCityPerspective(fake.target);await effect.activate();
  effect.update(0,active);fake.target.read(50,0);effect.update(30,active);
  const paused=effect.update(50,{...active,paused:true});assert.equal(fake.subscriptions,0);assert.equal(paused.state,'paused');
  fake.target.document.hidden=true;effect.update(60,active);fake.target.document.hidden=false;
  effect.update(70,active);assert.equal(fake.subscriptions,1);
  fake.reduced=true;const reduced=effect.update(80,active);assert.equal(fake.subscriptions,0);assert.equal(reduced.state,'reduced-motion');
  assert.equal(await effect.activate(),'reduced-motion');assert.equal(fake.requests,0);
  fake.reduced=false;effect.update(90,active);assert.equal(fake.subscriptions,1);
  effect.recenter();assert.equal(effect.update(100,active).hasReading,false);
  effect.dispose();
  for(const options of [{secure:false},{supported:false}]) {
    const unavailable=browser(options),controller=createCityPerspective(unavailable.target);
    assert.equal(controller.available,false);assert.equal(controller.update(1,active).state,'unavailable');
    assert.equal(await controller.activate(),'unavailable');assert.equal(unavailable.subscriptions,0);
  }
});
