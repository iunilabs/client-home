import {wheelEventTime,createWheelBurst,createMobileTourInput} from '../src/section-two/mobile-tour-input.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentScrollLock,createEndLatch,cityEntryPoint,cityMapPoint} from '../src/section-two/scroll-guard.js';
import {createMobileTourNavigation} from '../src/section-two/mobile-tour-navigation.js';
import {mobileTourGeometry,mobileTourState} from '../src/section-two/mobile-tour.js';

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

for(const mode of ['scroll','wheel']) test(`fractional anchor preserves native release and selected reverse entry via ${mode}`,()=>{
  const previousWindow=globalThis.window,handlers=new Map();
  const geometry={...mobileTourGeometry({top:5200,viewport:932}),revealed:5542.17};
  const layout={width:550,height:977,viewportWidth:430,viewportHeight:932};
  const nav=createMobileTourNavigation();
  const frame=(scroll,now)=>nav.update(mobileTourState({scroll,geometry}),{scroll,now,layout,geometry});
  frame(geometry.revealed,0);nav.select('sabadell',{now:10});frame(geometry.revealed,4000);
  nav.select('collaborate',{now:4010});frame(geometry.revealed,8000);assert.ok(nav.release(1));
  globalThis.window={scrollY:5542,addEventListener:(name,handler)=>handlers.set(name,handler),removeEventListener(){}};
  const input=createMobileTourInput(null,nav,{readTarget:()=>window.scrollY});input.update(true,geometry);
  const scroll=y=>{window.scrollY=y;frame(input.reconcile(y),9000)};
  const wheel=deltaY=>handlers.get('wheel')({timeStamp:1000,deltaX:0,deltaY,deltaMode:0,target:{closest:()=>null},cancelable:true,preventDefault(){},stopImmediatePropagation(){}});
  try {
    scroll(5542);
    // Subpixel rounding back at the anchor is not a deliberate inverse entry.
    input.reconcile(5542.4);input.reconcile(5542);assert.equal(nav.getState().active,false);
    if(mode==='wheel')wheel(80);else scroll(5543);
    assert.equal(nav.getState().active,false,'first forward pixel across the fractional anchor stays native');
    assert.equal(nav.getState().released,1);assert.equal(nav.getState().currentId,'collaborate');
    scroll(geometry.revealed+180);
    if(mode==='wheel')wheel(-200);else scroll(5542);
    assert.equal(nav.getState().active,true);assert.equal(nav.getState().currentId,'collaborate');
    assert.equal(nav.getState().manualId,'sabadell','inverse capture preserves the human selection');
    nav.enter(geometry);assert.ok(nav.release(-1));scroll(5542);scroll(geometry.revealed-100);
    if(mode==='wheel')wheel(-80);else scroll(geometry.revealed-180);
    assert.equal(nav.getState().active,false,'native exit toward section 1 remains free');
    if(mode==='wheel')wheel(300);else scroll(5543);
    assert.equal(nav.getState().active,true);assert.equal(nav.getState().currentId,'puntoes');
    assert.equal(nav.getState().manualId,null,'a new forward entrance starts the default route');
  } finally {
    input.dispose();if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
  }
});
