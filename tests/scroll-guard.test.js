import {wheelEventTime,createWheelBurst,createMobileTourInput} from '../src/section-two/mobile-tour-input.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentScrollLock,createEndLatch,cityEntryPoint,cityMapPoint} from '../src/section-two/scroll-guard.js';

test('compositor lock is idempotent and restores the previous inline overflow and priority',()=>{
  const values=new Map([['overflow',{value:'auto',priority:'important'}]]);
  const root={style:{getPropertyValue:k=>values.get(k)?.value??'',getPropertyPriority:k=>values.get(k)?.priority??'',setProperty:(k,value,priority='')=>values.set(k,{value,priority}),removeProperty:k=>values.delete(k)}};
  const lock=createDocumentScrollLock(root);
  lock.set(true);lock.set(true);assert.ok(lock.locked);assert.equal(root.style.getPropertyValue('overflow'),'hidden');
  lock.set(false);assert.equal(root.style.getPropertyValue('overflow'),'auto');assert.equal(root.style.getPropertyPriority('overflow'),'important');
  root.style.removeProperty('overflow');lock.set(true);lock.set(false);assert.equal(root.style.getPropertyValue('overflow'),'');
});

test('desktop end captures once, releases for a new gesture, and rearms on inverse entry',()=>{
  const latch=createEndLatch();assert.ok(latch.capture());assert.equal(latch.capture(),false);
  latch.observe(1200,1000);assert.ok(latch.getState().held);
  latch.release();assert.equal(latch.getState().held,false);assert.equal(latch.capture(),false);
  latch.observe(1100,1000);latch.observe(990,1000);assert.ok(latch.capture());
  latch.release(-1);latch.observe(980,1000);assert.ok(latch.capture(),'fresh reverse gesture can return into the map');
});

test('explicit external navigation never captures its destination and later city entry rearms',()=>{
  const latch=createEndLatch();latch.capture();latch.reset();
  assert.equal(latch.getState().held,false);latch.observe(1800,1000);assert.equal(latch.capture(),false);
  latch.observe(900,1000);assert.ok(latch.capture());
});

test('chapter destination uses the owned copy interval rather than the old reveal clock',()=>{
  assert.equal(cityEntryPoint({start:5000,revealed:5600}),null);
  for(const viewport of [390,568,844,900]) {
    const handoff=4000-viewport+90;
    const geometry={copyStart:handoff+850,start:handoff+1650,revealed:handoff+2000};
    assert.equal(cityEntryPoint(geometry),handoff+1250);
    assert.equal(cityEntryPoint(geometry,true),null,'mobile shortcuts retain the Puntoes anchor');
    assert.ok(cityEntryPoint(geometry)>geometry.copyStart+160 && cityEntryPoint(geometry)<geometry.start-200);
  }
});

test('wheel grouping uses creation timestamps even when rendering delays delivery',()=>{
  const burst=createWheelBurst();
  assert.equal(burst.push(2000,wheelEventTime({timeStamp:100},700),true),0);
  assert.equal(burst.push(2000,wheelEventTime({timeStamp:140},1500)),0);
  assert.ok(burst.isPending(wheelEventTime({timeStamp:180},2100),2000));
  assert.equal(wheelEventTime({timeStamp:1e12},2300),2300);
  assert.equal(burst.isPending(wheelEventTime({timeStamp:1200},2300),110),false);
});

test('delayed wheel input groups its burst by creation time but starts the camera at delivery',t=>{
  const previousWindow=globalThis.window, handlers=new Map(), steps=[];
  let clock=2000;
  t.mock.method(performance,'now',()=>clock);
  globalThis.window={addEventListener:(name,handler)=>handlers.set(name,handler),removeEventListener(){},scrollY:1000};
  try {
    const navigation={getState:()=>({active:true,moving:false}),canRelease:()=>false,step:(direction,options)=>steps.push({direction,...options})};
    const input=createMobileTourInput(null,navigation);input.update(true,{revealed:1000});
    const event=timeStamp=>({timeStamp,deltaX:0,deltaY:2000,deltaMode:0,target:{closest:()=>null},cancelable:true,preventDefault(){},stopImmediatePropagation(){}});
    handlers.get('wheel')(event(100));clock=5000;handlers.get('wheel')(event(140));
    assert.deepEqual(steps,[{direction:1,now:2000}],'queued tail cannot start another journey or backdate the first');
    input.dispose();
  } finally {
    if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
  }
});

test('desktop debug map entry is fully faded and bounded even on a short viewport',()=>{
  const geometry={revealed:4998,start:5020,fadeEnd:5700,end:6100};
  assert.equal(cityMapPoint(geometry,0,false),5700);assert.equal(cityMapPoint(geometry,1,false),6100);
  assert.equal(cityMapPoint({...geometry,fadeEnd:6500},0,false),6100);
  assert.equal(cityMapPoint(geometry,0,true),4998);
});
