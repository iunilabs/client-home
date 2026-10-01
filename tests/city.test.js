import test from 'node:test';
import assert from 'node:assert/strict';
import {cityGeometry, cityState} from '../src/section-two/city-state.js';

const desktop = cityGeometry({top:4034, height:1764, viewport:720});
const portrait = cityGeometry({top:4768, height:2068, viewport:844});

test('adding the following chapter does not delay the accepted city entrance', () => {
  assert.equal(desktop.start, 5168 * .77);
  assert.equal(desktop.revealed, 5168 * .81);
  assert.equal(cityState(desktop.start - 1, desktop).opacity, 0);
  // The onset and zoom clock stay fixed, while the reveal has a slower pace.
  assert.ok(cityState(desktop.revealed, desktop).opacity > 0);
  assert.ok(cityState(desktop.revealed, desktop).opacity < .5);
  assert.equal(cityState(desktop.fadeEnd, desktop).opacity, 1);
  assert.ok((desktop.fadeEnd - desktop.start) / (desktop.revealed - desktop.start) > 2.5);
});

test('scroll continuously pulls back on desktop and portrait, in both directions', () => {
  for (const geometry of [desktop, portrait]) {
    let previous = Infinity;
    for (let i=0; i<=100; i++) {
      const y=geometry.revealed+(geometry.end-geometry.revealed)*i/100;
      const state=cityState(y,geometry);
      assert.ok(state.zoom<=previous);
      assert.ok(Number.isFinite(state.zoom));
      previous=state.zoom;
      assert.deepEqual(state,cityState(y,geometry));
    }
    assert.equal(cityState(geometry.revealed,geometry).zoom,1.2);
    assert.equal(cityState(geometry.end,geometry).zoom,1);
  }
});

test('the map leaves at the same rate that the following section enters', () => {
  for (const geometry of [desktop,portrait]) {
    const y=geometry.end+geometry.viewport*.4;
    assert.ok(Math.abs(cityState(y,geometry).exitY-geometry.viewport*.4)<1e-8);
    assert.equal(cityState(geometry.end+geometry.viewport,geometry).active,false);
    assert.equal(cityState(geometry.end+geometry.viewport,geometry).opacity,0);
    assert.equal(cityState(geometry.end,geometry).namesOpacity,1);
    assert.equal(cityState(geometry.end,geometry).copyOpacity,0);
  }
});

test('reduced motion removes the animated zoom and gradual reveal', () => {
  assert.equal(cityState(desktop.start-1,desktop,true).opacity,0);
  assert.equal(cityState(desktop.start,desktop,true).opacity,1);
  for (const y of [desktop.start,desktop.revealed,desktop.end]) {
    assert.equal(cityState(y,desktop,true).zoom,1);
  }
});
