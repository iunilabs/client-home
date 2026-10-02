import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileTourRoute, mobileTourTiming, mobileTourHub, mobileTourBuildings} from '../src/section-two/mobile-tour-config.js';
import {mobileTourGeometry, mobileTourState, mobileTourCamera, mobileCardStack, tourEase} from '../src/section-two/mobile-tour.js';
import {createMobileTourNavigation, promoteMobileCard} from '../src/section-two/mobile-tour-navigation.js';

test('mobile entrance stays anchored to the accepted encounter, even with only three clients', () => {
  const input = {top: 5200, viewport: 844};
  const all = mobileTourGeometry(input), three = mobileTourGeometry({...input, route: mobileTourRoute.slice(0, 3)});
  assert.equal(all.start, three.start);
  assert.equal(all.revealed, three.revealed);
  assert.equal(all.revealed, input.top - input.viewport + 90 + input.viewport * 1.35);
  assert.ok(Math.abs(all.height - three.height - (mobileTourRoute.length - 3) * mobileTourTiming.stop * input.viewport) < 1e-8);
  assert.equal(mobileTourState({scroll: input.top - input.viewport + 90, geometry: all}).active, false);
});

test('scroll visits any configured selection and the card enters shortly after the camera starts', () => {
  const route = ['ree', 'bbva', 'mediaset'].map(id => ({id, ...mobileTourBuildings[id]}));
  const geometry = mobileTourGeometry({top:5200,viewport:844,route});
  const at = (i, phase) => geometry.revealed + geometry.viewport * (mobileTourTiming.intro + (i + phase) * mobileTourTiming.stop);
  for (const [i, stop] of route.entries()) {
    const arrival = mobileTourState({scroll: at(i, mobileTourTiming.travelUntil), geometry, route});
    assert.equal(arrival.current.id, stop.id);
    assert.ok(Math.abs(arrival.travel - 1) < 1e-12);
    assert.ok(arrival.cardProgress > .9);
    const departure = mobileTourState({scroll: at(i, .08), geometry, route});
    assert.ok(departure.travel > 0 && departure.travel < 1);
    assert.ok(departure.cardProgress > 0 && departure.cardProgress < 1);
    assert.equal(arrival.previous.id, i ? route[i - 1].id : mobileTourHub.id);
    const hold = mobileTourState({scroll: at(i,.9), geometry, route});
    assert.equal(hold.cardProgress, 1);
  }
  const rewind = mobileTourState({scroll: at(1,.9), geometry, route});
  assert.equal(rewind.current.id, route[1].id);
  assert.equal(rewind.cardProgress, 1);
});

test('logos recover a unique existing card with a fade while preserving the pile', () => {
  assert.deepEqual(promoteMobileCard(['bbva','cepsa','mediaset'], 'bbva'), ['cepsa','mediaset','bbva']);
  const geometry = mobileTourGeometry({top:5200,viewport:844});
  const width=844*941/1672*1.04, layout={width,height:width*1672/941,viewportWidth:390,viewportHeight:844};
  let scroll = geometry.revealed + 844 * (mobileTourTiming.intro + 2.8 * mobileTourTiming.stop), targetScroll;
  const navigation = createMobileTourNavigation({onNavigate:y => {targetScroll=y}});
  const frame = now => navigation.update(mobileTourState({scroll,geometry}),{scroll,now,layout});
  const before=frame(0);
  assert.deepEqual(before.order,['bbva','naturgy','sabadell']);
  assert.ok(navigation.select('bbva',{now:10,scroll,geometry}));
  scroll=targetScroll;
  const start=frame(10), middle=frame(350), end=frame(1400);
  assert.deepEqual(start.order,['naturgy','sabadell','bbva']);
  assert.equal(start.entry.mode,'fade'); assert.equal(start.entry.progress,0);
  assert.ok(middle.entry.progress > 0 && middle.entry.progress < 1);
  assert.equal(end.entry.progress,1); assert.equal(end.current.id,'bbva');
  assert.equal(start.camera.focusX,before.camera.focusX);
  assert.ok(Math.abs(end.camera.focusX-mobileTourBuildings.bbva.center[0]/100)<1e-9);
  assert.equal(new Set(end.order).size,end.order.length);
});

test('a logo outside the itinerary is visitable and scrolling resumes without a camera jump', () => {
  const geometry=mobileTourGeometry({top:5200,viewport:844});
  const width=844*941/1672*1.04,layout={width,height:width*1672/941,viewportWidth:390,viewportHeight:844};
  let scroll=geometry.revealed+844*(mobileTourTiming.intro+.8*mobileTourTiming.stop),target;
  const navigation=createMobileTourNavigation({onNavigate:y=>{target=y}});
  const frame=now=>navigation.update(mobileTourState({scroll,geometry}),{scroll,now,layout});
  frame(0); navigation.select('cepsa',{now:10,scroll,geometry});
  assert.equal(target,scroll,'outside clients leave the document position unchanged');
  const arrived=frame(1400);
  assert.equal(arrived.current.id,'cepsa');assert.deepEqual(arrived.order,['bbva','cepsa']);
  scroll+=30;
  const resumed=frame(1410);
  assert.equal(resumed.camera.focusX,arrived.camera.focusX);
  assert.equal(resumed.camera.focusY,arrived.camera.focusY);
  const end=frame(2500);
  assert.equal(end.current.id,'bbva');assert.deepEqual(end.order,['cepsa','bbva']);
  assert.equal(end.entry.mode,'fade');
});

test('returning from an outside client to Puntoes withdraws the pile before clearing it', () => {
  const geometry=mobileTourGeometry({top:5200,viewport:844});
  const width=844*941/1672*1.04,layout={width,height:width*1672/941,viewportWidth:390,viewportHeight:844};
  let scroll=geometry.revealed+844*(mobileTourTiming.intro+.8*mobileTourTiming.stop);
  const navigation=createMobileTourNavigation();
  const frame=now=>navigation.update(mobileTourState({scroll,geometry}),{scroll,now,layout});
  frame(0);navigation.select('cepsa',{now:10,scroll,geometry});frame(1400);
  scroll=geometry.revealed+844*.6;
  const first=frame(1410);assert.equal(first.entry.id,'cepsa');assert.equal(first.current.id,'puntoes');
  assert.ok(first.retreat>0&&first.retreat<1);assert.deepEqual(first.order,['bbva','cepsa']);
  scroll=geometry.revealed+844*.4;
  const middle=frame(1600);assert.ok(middle.retreat>0&&middle.retreat<first.retreat);
  assert.deepEqual(middle.order,first.order);
  frame(2600);
  scroll=geometry.revealed+844*.1;
  let gone;
  for(let now=2700;now<=4200;now+=16)gone=frame(now);
  assert.deepEqual(gone.order,[]);
});

test('an external logo from either introductory position survives a small forward scroll', () => {
  for(const distance of [.1,.4]) {
    const geometry=mobileTourGeometry({top:5200,viewport:844});
    const width=844*941/1672*1.04,layout={width,height:width*1672/941,viewportWidth:390,viewportHeight:844};
    let scroll=geometry.revealed+844*distance;
    const navigation=createMobileTourNavigation();
    const frame=now=>navigation.update(mobileTourState({scroll,geometry}),{scroll,now,layout});
    frame(0);navigation.select('cepsa',{now:10,scroll,geometry});frame(1400);
    scroll+=30;
    const resumed=frame(1416);
    assert.equal(resumed.retreat,1);assert.equal(resumed.entry.id,'cepsa');
    assert.deepEqual(resumed.order,['cepsa']);
    for(let now=1432;now<=2600;now+=16){const s=frame(now);assert.equal(s.retreat,1);assert.deepEqual(s.order,['cepsa']);}
  }
});

test('a fast backward trip keeps the manual card instead of flashing an intermediate guided client', () => {
  const geometry=mobileTourGeometry({top:5200,viewport:844});
  const width=844*941/1672*1.04,layout={width,height:width*1672/941,viewportWidth:390,viewportHeight:844};
  const start=geometry.revealed+844*(mobileTourTiming.intro+.8*mobileTourTiming.stop);
  let scroll=start;
  const navigation=createMobileTourNavigation();
  const frame=now=>navigation.update(mobileTourState({scroll,geometry}),{scroll,now,layout});
  frame(0);navigation.select('cepsa',{now:10,scroll,geometry});frame(1400);
  for(let sample=1;sample<=20;sample++){
    scroll=start+(geometry.revealed+844*.1-start)*sample/20;
    const s=frame(1400+sample*16);
    assert.equal(s.entry.id,'cepsa');
    assert.equal(s.order.at(-1),'cepsa');
  }
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
