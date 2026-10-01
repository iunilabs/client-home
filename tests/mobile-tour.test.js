import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileTourRoute, mobileTourHub, mobileTourBuildings} from '../src/section-two/mobile-tour-config.js';
import {mobileTourGeometry, mobileTourState, mobileTourCamera, tourEase} from '../src/section-two/mobile-tour.js';
import {createMobileTourNavigation, promoteMobileCard} from '../src/section-two/mobile-tour-navigation.js';
import {createWheelBurst} from '../src/section-two/mobile-tour-input.js';

function harness({reduced = false, route = mobileTourRoute} = {}) {
  const geometry = mobileTourGeometry({top: 5200, viewport: 844});
  const width = 844 * 941 / 1672 * 1.04;
  const layout = {width, height: width * 1672 / 941, viewportWidth: 390, viewportHeight: 844};
  let scroll = geometry.revealed, now = 0;
  const navigation = createMobileTourNavigation({route, onNavigate: y => {scroll = y}});
  const frame = (elapsed = 1100) => {now += elapsed; return navigation.update(mobileTourState({scroll, geometry}), {scroll, now, layout, geometry, reduced})};
  frame(0);
  return {navigation, frame, geometry, layout, get scroll() {return scroll}, set scroll(y) {scroll = y},
    step: (direction, explicit = false) => navigation.step(direction, {now, explicit}),
    select: id => navigation.select(id, {now})};
}

test('chapter anchors preserve the hand encounter and do not depend on itinerary length', () => {
  const input = {top: 5200, viewport: 844};
  const all = mobileTourGeometry(input), three = mobileTourGeometry({...input, route: mobileTourRoute.slice(0, 3)});
  assert.deepEqual(all, three);
  assert.equal(all.revealed, input.top - input.viewport + 90 + input.viewport * 1.35);
  assert.equal(mobileTourState({scroll: input.top - input.viewport + 90, geometry: all}).active, false);
});

test('captured touch entry retains its document anchor even beyond the chapter, and explicit exits release it', () => {
  const h = harness();
  for (const y of [h.geometry.revealed + 179, h.geometry.end + 500, h.geometry.start - 400]) {
    h.scroll = y;
    assert.equal(h.navigation.anchorScroll(y), h.geometry.revealed);
    assert.equal(h.scroll, h.geometry.revealed);
    assert.equal(h.frame().currentId, 'puntoes');
  }
  h.step(-1);
  assert.equal(h.navigation.anchorScroll(h.scroll), h.geometry.handoff);
  assert.equal(h.frame().active, false);
  h.navigation.enter(h.geometry);
  h.navigation.jump(0);
  assert.equal(h.navigation.anchorScroll(0), 0);
});

test('one accepted request visits exactly one stop and rejects another during travel', () => {
  const h = harness();
  assert.equal(h.navigation.getState().currentId, 'puntoes');
  for (const id of ['bbva', 'naturgy', 'sabadell', 'collaborate']) {
    const from = h.frame(0).camera;
    assert.equal(h.step(1), true);
    assert.equal(h.step(1), false);
    assert.equal(h.frame(0).camera.focusX, from.focusX);
    const middle = h.frame(300);
    assert.ok(middle.entry.progress > 0 && middle.entry.progress < 1);
    assert.equal(h.frame().currentId, id);
    assert.equal(h.scroll, h.geometry.revealed);
  }
  assert.equal(h.navigation.getState().nextId, 'section3');
  h.step(1); assert.equal(h.navigation.getState().active, false);
  assert.equal(h.scroll, h.geometry.end + h.geometry.viewport);
});

test('external visits preserve the pending itinerary step and ignore coordinate jitter', () => {
  const h = harness(); h.step(1); h.frame(); h.select('cepsa'); h.frame();
  assert.equal(h.navigation.getState().guidedCursor, 0);
  assert.equal(h.navigation.getState().nextId, 'naturgy');
  for (const delta of [30, -60, 300]) {
    h.scroll += delta;
    assert.equal(h.frame().currentId, 'cepsa');
  }
  h.step(1); assert.equal(h.frame().currentId, 'naturgy');
  h.select('collaborate'); h.frame(); h.select('cepsa'); h.frame();
  assert.equal(h.navigation.getState().nextId, 'section3');
  assert.equal(h.step(1), true);
  assert.equal(h.navigation.getState().currentId, 'cepsa');
  assert.equal(h.navigation.getState().active, false);
});

test('manual itinerary selection sets the cursor; repeated visits reuse one case', () => {
  const h = harness(); h.select('sabadell'); h.frame();
  h.select('bbva'); h.frame(); h.select('cepsa'); h.frame(); h.select('bbva');
  const end = h.frame();
  assert.equal(end.nextId, 'naturgy');
  assert.equal(end.previousId, 'puntoes');
  assert.equal(new Set(end.order).size, end.order.length);
  assert.deepEqual(promoteMobileCard(['bbva', 'cepsa'], 'bbva'), ['cepsa', 'bbva']);
  assert.equal(h.select('unknown'), false);
});

test('reading blocks gestures until an explicit navigation request; reverse leaves via Puntoes', () => {
  const h = harness(); h.step(1); h.frame(); h.navigation.setReading(true);
  assert.equal(h.step(1), false); assert.equal(h.navigation.getState().reading, true);
  assert.equal(h.step(-1, true), true); assert.equal(h.navigation.getState().reading, false);
  assert.equal(h.frame().currentId, 'puntoes');
  assert.equal(h.step(-1), true); assert.equal(h.scroll, h.geometry.handoff);
});

test('reverse re-entry starts at collaboration and chapter reset starts at Puntoes', () => {
  const h = harness(); h.scroll = h.geometry.end + h.geometry.viewport; h.frame();
  h.scroll = h.geometry.end - 1;
  assert.equal(h.frame().currentId, 'collaborate');
  h.navigation.reset(); h.scroll = h.geometry.revealed;
  assert.equal(h.frame().currentId, 'puntoes');
});

test('reduced motion reaches the selected camera immediately and settles the card in 100ms', () => {
  const h = harness({reduced: true}); h.select('cepsa');
  const start = h.frame(0);
  assert.equal(start.camera.focusX, mobileTourBuildings.cepsa.center[0] / 100);
  const end = h.frame(100); assert.equal(end.moving, false); assert.equal(end.entry.progress, 1);
});

test('one wheel burst survives transition duration and long decaying inertia until quiet', () => {
  const burst = createWheelBurst();
  assert.equal(burst.push(35, 0), 0); assert.equal(burst.push(35, 40), 1);
  for (let time = 80; time < 2400; time += 80) assert.equal(burst.push(1000 / (time + 1), time), 0);
  assert.equal(burst.push(100, 2500), 0);
  assert.equal(burst.push(100, 2800), 1);
  assert.equal(burst.push(-1000, 2850), 0);
  assert.equal(burst.push(-65, 3200), -1);
});

test('input that began outside the chapter or during reading/movement cannot become a fresh gesture', () => {
  const burst = createWheelBurst();
  assert.equal(burst.push(100, 0, true), 0);
  assert.equal(burst.push(100, 100), 0);
  assert.equal(burst.push(100, 400), 1);
  assert.equal(burst.push(100, 800, true), 0);
  assert.equal(burst.push(100, 900), 0);
});

test('departures and arrivals accelerate and brake without an endpoint velocity jump', () => {
  const step = .00001;
  assert.equal(tourEase(-1),0); assert.equal(tourEase(2),1);
  assert.ok(tourEase(step) / step < 1e-7);
  assert.ok((1-tourEase(1-step)) / step < 1e-7);
  assert.ok(tourEase(.5)-tourEase(.49) > tourEase(.1)-tourEase(.09));
  assert.ok(tourEase(.5)-tourEase(.49) > tourEase(.9)-tourEase(.89));
});

test('the original portrait covers the phone throughout the camera-led entrance', () => {
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

test('available sensor tilt cannot uncover a corner during the entrance', () => {
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

test('every discrete itinerary and manual journey keeps the artwork covering the viewport', () => {
  for (const [viewportWidth, viewportHeight] of [[320,568], [390,844], [430,932]]) {
    const geometry = mobileTourGeometry({top:5200, viewport:viewportHeight});
    const width = Math.max(viewportWidth, viewportHeight * 941 / 1672) * 1.04;
    const layout = {width, height:width * 1672 / 941, viewportWidth, viewportHeight};
    const navigation = createMobileTourNavigation();
    let now = 0;
    const frame = () => navigation.update(mobileTourState({scroll:geometry.revealed,geometry}), {scroll:geometry.revealed, now, layout, geometry});
    frame();
    for (const id of Object.keys(mobileTourBuildings)) {
      navigation.select(id, {now});
      for (let i = 0; i <= 70; i++) {
        const {camera} = frame();
        assert.ok(camera.left <= 0 && camera.top <= 0);
        assert.ok(camera.left + width * camera.zoom >= viewportWidth);
        assert.ok(camera.top + layout.height * camera.zoom >= viewportHeight);
        now += 16;
      }
    }
  }
});

test('delayed decaying inertia cannot exit an endpoint after the camera arrives', () => {
  const burst = createWheelBurst();
  assert.equal(burst.push(160, 0), 1);
  for (const [delta, time] of [[80,320], [76,640], [72,960], [68,1424], [64,1888], [20,2288], [20,2600]]) {
    assert.equal(burst.push(delta, time), 0);
  }
  assert.equal(burst.push(100, 3000), 1, 'fresh strong gesture after release');
  assert.equal(burst.push(100, 3400), 1, 'independent mouse notch after release');
});

test('an explicit chapter link can leave without automatic cursor re-entry during smooth scroll', () => {
  const h = harness(); h.step(1); h.frame();
  h.navigation.reset({suspend:true});
  assert.equal(h.frame().active, false);
  h.scroll = h.geometry.start - 1; assert.equal(h.frame().active, false);
  h.scroll = h.geometry.revealed; assert.equal(h.frame().currentId, 'puntoes');
});

test('a fresh deliberate rise after a large entry wheel is not mistaken for its residual tail', () => {
  const burst = createWheelBurst();
  assert.equal(burst.push(1800, 0, true), 0);
  assert.equal(burst.push(10, 400), 0);
  assert.equal(burst.push(10, 800), 0);
  assert.equal(burst.push(80, 1200), 1);
});

test('reduced motion also suppresses the entrance camera displacement without changing hand anchors', () => {
  const h = harness({reduced:true});
  h.scroll = h.geometry.start + 10; const early = h.frame().camera;
  h.scroll += 150; const later = h.frame().camera;
  assert.equal(early.zoom, later.zoom);
  assert.equal(early.focusX, later.focusX);
  assert.equal(early.focusY, later.focusY);
});

test('Home/End style document jumps release reading and do not recapture the chapter mid-exit', () => {
  const h = harness(); h.step(1); h.frame(); h.navigation.setReading(true);
  h.navigation.jump(0);
  assert.equal(h.navigation.getState().active, false);
  assert.equal(h.navigation.getState().reading, false);
  assert.equal(h.scroll, 0);
  h.frame(); h.scroll = h.geometry.revealed;
  assert.equal(h.frame().currentId, 'puntoes');
});
