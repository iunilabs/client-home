import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileTourRoute, mobileTourHub, mobileTourBuildings, mobileTourTiming} from '../src/section-two/mobile-tour-config.js';
import {mobileTourGeometry, mobileTourState, mobileTourCamera, mobileCardStack, tourEase, mobileTravelProfile, mobileBuildingView, mobileCameraAt} from '../src/section-two/mobile-tour.js';
import {createMobileTourNavigation, promoteMobileCard} from '../src/section-two/mobile-tour-navigation.js';

import {createSwipeIntent, createWheelBurst} from '../src/section-two/mobile-tour-input.js';

const geometry = mobileTourGeometry({top:5200,viewport:844});
const width=844*941/1672*1.04, layout={width,height:width*1672/941,viewportWidth:390,viewportHeight:844};
const leg = mobileTourTiming.maxTravel + 100;
const state = scroll => mobileTourState({scroll,geometry});
function setup(route = mobileTourRoute) {
  const writes = [];
  const nav=createMobileTourNavigation({route,onNavigate:y=>writes.push(y)});
  const frame=(now,scroll=geometry.revealed)=>nav.update(state(scroll),{scroll,now,layout,geometry});
  frame(0); return {nav,frame,writes};
}

test('one anchor preserves the hand entrance and removes empty itinerary scroll', () => {
  const short=mobileTourGeometry({top:5200,viewport:844,route:[]});
  assert.deepEqual(short,geometry);
  assert.equal(geometry.revealed,5200-844+90+850+800+844*.8);
  assert.equal(geometry.end,geometry.revealed);
  assert.equal(geometry.height,geometry.revealed+844-5200);
  assert.equal(state(geometry.handoff).active,false);
  assert.equal(geometry.copyStart - geometry.handoff, 850);
  assert.equal(state(geometry.copyStart).copyOpacity, 0);
  assert.equal(state(geometry.copyStart + 200).copyOpacity, 1);
  assert.equal(state(geometry.start).copyOpacity, 0);
  assert.equal(state(geometry.start).opacity, 0);
  assert.ok(state(geometry.start + 100).opacity > 0);
  assert.equal(state(geometry.revealed+422).exitY,422);
});

test('slow cumulative 3px samples step once; taps, diagonals and horizontals do not', () => {
  const slow=createSwipeIntent(150,400), requests=[];
  for(let y=397;y>=190;y-=3) requests.push(slow.move(150,y).direction);
  assert.equal(requests.filter(Boolean).length,1); assert.equal(requests.find(Boolean),1);
  for(const [x,y] of [[147,397],[70,400],[50,300]]) assert.equal(createSwipeIntent(150,400).move(x,y).direction,0);
  assert.equal(createSwipeIntent(150,400,true).move(150,200).direction,0);
});

test('a wheel burst and its decaying delayed tail produce only one request', () => {
  const wheel=createWheelBurst();
  assert.equal(wheel.push(30,0),0); assert.equal(wheel.push(30,20),1);
  assert.equal(wheel.push(15,300),0); assert.equal(wheel.push(5,700),0);
  assert.equal(wheel.push(80,1700),1);
  assert.equal(wheel.push(-80,2000),-1);
});

test('camera is smooth while document stays at one anchor', () => {
  const {nav,frame,writes}=setup();
  const hub=frame(0); assert.equal(hub.current.id,'puntoes');
  assert.ok(nav.step(1,{now:10}));
  const first=frame(10),middle=frame(1100),last=frame(10+leg);
  assert.equal(first.camera.focusX,hub.camera.focusX);
  assert.ok(middle.camera.focusX!==hub.camera.focusX);
  assert.equal(last.current.id,'bbva'); assert.equal(last.entry.progress,1);
  const count=writes.length;
  assert.equal(nav.anchorScroll(geometry.revealed+300),geometry.revealed);
  assert.deepEqual(writes.slice(count),[geometry.revealed]);
  assert.equal(nav.canRelease(1),false);
});

test('fresh swipes retarget an unfinished trip from its visible camera in either direction', () => {
  const {nav,frame}=setup();
  nav.step(1,{now:10});
  const visible=frame(350);
  assert.equal(visible.moving,true);
  assert.ok(nav.step(1,{now:350}));
  const retargeted=frame(350);
  assert.equal(retargeted.current.id,'naturgy');
  assert.deepEqual(retargeted.camera,visible.camera);
  const reverseFrom=frame(500);
  assert.ok(nav.step(-1,{now:500}));
  assert.deepEqual(frame(500).camera,reverseFrom.camera);
  assert.equal(nav.getState().currentId,'bbva');
  assert.equal(frame(500+leg).current.id,'bbva');
});

test('final release does not write scroll; the next inverse crossing captures the last stop', () => {
  const {nav,frame,writes}=setup(); let time=0;
  for(let i=0;i<mobileTourRoute.length;i++) {assert.ok(nav.step(1,{now:time}));time+=leg;frame(time)}
  const before=writes.length;
  assert.ok(nav.canRelease(1));assert.ok(nav.release(1));assert.equal(writes.length,before);
  assert.equal(nav.anchorScroll(geometry.revealed+100),geometry.revealed+100);
  const exiting=frame(time+10,geometry.revealed+100);assert.equal(exiting.current.id,'collaborate');assert.equal(exiting.active,false);
  const back=frame(time+20,geometry.revealed-10);assert.ok(back.active);assert.equal(back.current.id,'collaborate');
});

test('manual Cepsa retains its camera and leaves only collaboration; recovery never duplicates a card', () => {
  const {nav,frame}=setup(); nav.step(1,{now:0});frame(leg);
  assert.ok(nav.select('cepsa',{now:leg+100})); const selected=frame(2*leg+100),held=frame(3*leg);
  assert.equal(selected.current.id,'cepsa');assert.deepEqual(held.camera,selected.camera);
  assert.equal(nav.getState().nextId,'collaborate');
  nav.step(1,{now:4*leg}); const departure=frame(4*leg);
  assert.equal(departure.camera.focusX,selected.camera.focusX);
  assert.equal(frame(5*leg).current.id,'collaborate');
  nav.select('bbva',{now:6*leg});const repeated=frame(6*leg);
  assert.equal(repeated.entry.mode,'fade');
  const order=frame(7*leg).order;assert.deepEqual(order,['cepsa','collaborate','bbva']);
  assert.equal(new Set(order).size,order.length);
  assert.deepEqual(promoteMobileCard(order,'cepsa'),['collaborate','bbva','cepsa']);
});

test('each logo cancels all pending companies at the hub, any default stop and reverse reentry', () => {
  for (const id of Object.keys(mobileTourBuildings).filter(id=>id!=='collaborate')) {
    for (const stage of [-1,0,1,2,3]) {
      const {nav,frame,writes}=setup();let now=0;
      for (let i=0;i<=stage;i++) {nav.step(1,{now});now+=leg;frame(now)}
      assert.ok(nav.select(id,{now}));now+=leg;frame(now);
      assert.equal(nav.getState().currentId,id);
      if (stage===3) {
        assert.equal(nav.getState().nextId,null);
        assert.equal(nav.canRelease(1),true);
        continue;
      }
      assert.equal(nav.getState().nextId,'collaborate');
      nav.step(1,{now});now+=leg;frame(now);
      assert.equal(nav.getState().currentId,'collaborate');assert.equal(nav.getState().previousId,id);
      // Reverse cannot revive any of the canceled default companies.
      nav.step(-1,{now});now+=leg;frame(now);assert.equal(nav.getState().currentId,id);
      nav.step(-1,{now});now+=leg;frame(now);assert.equal(nav.getState().currentId,'puntoes');
      nav.step(1,{now});now+=leg;frame(now);assert.equal(nav.getState().currentId,id);
      assert.equal(nav.getState().nextId,null,'reverse to the chosen client does not reoffer the invitation');
      const writesBefore=writes.length;
      assert.ok(nav.release(1));assert.equal(writes.length,writesBefore);
      frame(now+10,geometry.revealed+100);frame(now+20,geometry.revealed-10);
      assert.equal(nav.getState().manualId,id);assert.equal(nav.getState().currentId,id);
      assert.equal(nav.getState().previousId,'puntoes');
      // Once the invitation was read, another client goes straight to exit.
      assert.ok(nav.select(id,{now:now+30}));now+=leg;frame(now);
      assert.equal(nav.getState().currentId,id);assert.equal(nav.getState().nextId,null);
      assert.ok(nav.canRelease(1));
    }
  }
});

test('tapping BBVA already focused cancels default route, and changing logo replaces the choice', () => {
  const {nav,frame}=setup();nav.step(1,{now:0});const before=frame(leg);
  assert.ok(nav.select('bbva',{now:leg+100}));const same=frame(leg+100);
  assert.deepEqual(same.camera,before.camera);assert.equal(same.moving,false);
  assert.equal(nav.getState().nextId,'collaborate');
  nav.select('cepsa',{now:2*leg});frame(3*leg);
  nav.select('naturgy',{now:3*leg+100});frame(4*leg+100);
  assert.equal(nav.getState().manualId,'naturgy');assert.equal(nav.getState().nextId,'collaborate');
  nav.step(1,{now:5*leg});frame(6*leg);assert.equal(nav.getState().currentId,'collaborate');
  nav.step(-1,{now:7*leg});frame(8*leg);assert.equal(nav.getState().currentId,'naturgy');
  nav.reset();frame(9*leg);assert.equal(nav.getState().manualId,null);assert.equal(nav.getState().nextId,'bbva');
  nav.step(1,{now:10*leg});frame(11*leg);assert.equal(nav.getState().nextId,'naturgy');
});

test('same-logo choice during travel still cancels companies, and a new forward entry resets the override', () => {
  const {nav,frame}=setup();nav.step(1,{now:0});frame(300);
  assert.ok(nav.select('bbva',{now:350}));assert.equal(nav.getState().manualId,'bbva');
  assert.equal(nav.getState().nextId,'collaborate');assert.ok(nav.step(1,{now:400}));
  frame(leg);assert.equal(nav.getState().currentId,'collaborate');
  nav.step(-1,{now:3*leg});frame(4*leg);nav.step(-1,{now:5*leg});frame(6*leg);
  assert.ok(nav.release(-1));frame(7*leg,geometry.revealed-100);
  frame(8*leg,geometry.revealed+10);
  assert.equal(nav.getState().manualId,null);assert.equal(nav.getState().nextId,'bbva');
});

test('the invitation counts after its CTA is presented, survives reentry, and never blocks a fresh exit', () => {
  const {nav,frame,writes}=setup();
  nav.select('cepsa',{now:0});frame(leg);
  nav.step(1,{now:leg});frame(leg+100);
  assert.equal(nav.getState().collaborationSeen,false,'a fleeting construction destination is not yet seen');
  nav.select('bbva',{now:leg+100});frame(2*leg);
  assert.equal(nav.getState().nextId,'collaborate');
  nav.step(1,{now:2*leg});frame(2*leg+mobileTourTiming.logoCardUntil);
  assert.equal(nav.getState().collaborationSeen,false,'CTA alone before the building arrives does not count');
  frame(3*leg);
  assert.equal(nav.getState().collaborationSeen,true);
  nav.select('naturgy',{now:3*leg});frame(3*leg+100);
  assert.equal(nav.getState().nextId,null);
  const before=writes.length;
  assert.ok(nav.release(1),'new gesture can exit before the camera animation ends');
  assert.equal(writes.length,before,'exit belongs to native scrolling');
  nav.reset();frame(4*leg);
  assert.equal(nav.getState().collaborationSeen,true);
  for (let i=0;i<mobileTourRoute.length-1;i++) {nav.step(1,{now:5*leg+i*leg});frame(6*leg+i*leg)}
  assert.equal(nav.getState().currentId,'sabadell');
  assert.equal(nav.getState().nextId,null,'fresh guided entrance also omits the invitation already seen');
});

test('returning by swipe from Hablemos to a guided client also exits without repeating construction', () => {
  const {nav,frame,writes}=setup();
  let now=0;
  for (const stop of mobileTourRoute) {nav.step(1,{now});now+=leg;frame(now)}
  assert.equal(nav.getState().collaborationSeen,true);
  nav.step(-1,{now});now+=leg;frame(now);
  assert.equal(nav.getState().currentId,'sabadell');
  assert.equal(nav.getState().nextId,null);
  assert.equal(nav.getState().routeLength,3);
  const before=writes.length;
  assert.ok(nav.step(1,{now}));
  assert.equal(nav.getState().active,false);
  assert.equal(nav.getState().currentId,'sabadell');
  assert.equal(writes.length,before);
  frame(now+10,geometry.revealed+100);
  frame(now+20,geometry.revealed-10);
  assert.equal(nav.getState().active,true);
  assert.equal(nav.getState().currentId,'sabadell','native reverse recovers the actual departure instead of the old construction stop');
});

test('chapter jumps suspend capture, resets and resized anchors remain coherent', () => {
  const {nav,frame}=setup();nav.jump(0);assert.equal(frame(100).active,false);
  frame(150,0);assert.ok(frame(160).active,'normal scrolling can reenter after Home');
  nav.reset();frame(200);assert.ok(nav.getState().active);
  const resized=mobileTourGeometry({top:5200,viewport:568});
  assert.equal(nav.anchorScroll(geometry.revealed,resized),resized.revealed);
  nav.reset({suspend:true});assert.equal(nav.getState().active,false);
});

test('guided travel and cards keep the same smooth motion with either system preference', () => {
  const normal=setup(), reduced=setup();
  const frame=(subject,now,preference)=>subject.nav.update(state(geometry.revealed),
    {scroll:geometry.revealed,now,layout,geometry,reduced:preference});
  frame(reduced,0,true);
  let now=10;
  function compareTrip(request) {
    assert.ok(request(normal.nav,now)); assert.ok(request(reduced.nav,now));
    for (const elapsed of [0,110,500,1100,leg]) {
      const a=frame(normal,now+elapsed,false), b=frame(reduced,now+elapsed,true);
      assert.deepEqual(b.camera,a.camera);
      assert.deepEqual(b.entry,a.entry);
      assert.equal(b.moving,a.moving);
      if (elapsed<=1100) assert.equal(b.moving,true);
      else {
        assert.equal(b.moving,false);
        assert.deepEqual(b.camera,mobileCameraAt(mobileBuildingView(b.current,layout,b.current.id==='puntoes'),layout));
      }
    }
    now+=leg+10;
  }
  for (const stop of mobileTourRoute) compareTrip((nav,time)=>nav.step(1,{now:time}));
  for (const stop of mobileTourRoute) compareTrip((nav,time)=>nav.step(-1,{now:time}));
  compareTrip((nav,time)=>nav.select('cepsa',{now:time}));
});

test('departures and arrivals accelerate and brake without an endpoint velocity jump', () => {
  const step = .00001;
  assert.equal(tourEase(-1),0); assert.equal(tourEase(2),1);
  assert.ok(tourEase(step) / step < 1e-7);
  assert.ok((1-tourEase(1-step)) / step < 1e-7);
  assert.ok(tourEase(.5)-tourEase(.49) > tourEase(.1)-tourEase(.09));
  assert.ok(tourEase(.5)-tourEase(.49) > tourEase(.9)-tourEase(.89));
});

test('longer trips take more time and open up the city, with bounded travel and zoom', () => {
  const hub = mobileBuildingView(mobileTourHub, layout, true);
  const close = mobileTravelProfile(hub, {...hub, focusX: hub.focusX + .01}, layout);
  const far = mobileTravelProfile(hub, {...hub, focusY: hub.focusY + .6}, layout);
  assert.ok(close.duration >= mobileTourTiming.logoTravel);
  assert.ok(far.duration > close.duration);
  assert.ok(far.duration <= mobileTourTiming.maxTravel);
  assert.ok(far.cruiseZoom < close.cruiseZoom);
  assert.ok(far.cruiseZoom >= 1.5);
});

test('every destination retains its accepted framing after the longer trip', () => {
  for (const [viewportWidth, viewportHeight] of [[320,568],[390,844],[430,932]]) {
    const width = Math.max(viewportWidth, viewportHeight * 941 / 1672) * 1.04;
    const size = {width, height: width * 1672 / 941, viewportWidth, viewportHeight};
    const bounds = mobileTourGeometry({top:5200, viewport:viewportHeight});
    const nav = createMobileTourNavigation();
    const frame = now => nav.update(mobileTourState({scroll:bounds.revealed, geometry:bounds}),
      {scroll:bounds.revealed, now, layout:size, geometry:bounds});
    frame(0);
    let now = 0;
    for (const id of [...Object.keys(mobileTourBuildings), 'puntoes']) {
      if (id === 'puntoes') {nav.reset();frame(now);}
      else nav.select(id, {now});
      now += leg;
      const arrived = frame(now);
      const stop = id === 'puntoes' ? mobileTourHub : mobileTourBuildings[id];
      assert.equal(arrived.moving, false);
      assert.deepEqual(arrived.camera, mobileCameraAt(mobileBuildingView(stop,size,id==='puntoes'),size));
    }
  }
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
      const i=Math.min(mobileTourRoute.length-1,Math.floor(sample/125));
      const phase=(sample%125)/124;
      const state={stopIndex:i, previous:i ? mobileTourRoute[i-1] : mobileTourHub,current:mobileTourRoute[i],travel:tourEase(phase)};
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
