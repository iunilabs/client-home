import test from 'node:test';
import assert from 'node:assert/strict';
import {cityGeometry, cityState} from '../src/section-two/city-state.js';

const desktop = cityGeometry({top:4034, height:2916, viewport:720});
const portrait = cityGeometry({top:4768, height:3418, viewport:844});

test('desktop copy follows the hands and leaves before the map', () => {
  const sectionStart = 4034 - 720 + 90;
  assert.equal(desktop.copyStart - sectionStart, 850);
  assert.equal(desktop.start - desktop.copyStart, 800);
  assert.equal(cityState(desktop.copyStart, desktop).copyOpacity, 0);
  assert.equal(cityState(desktop.copyStart + 200, desktop).copyOpacity, 1);
  assert.equal(cityState(desktop.start, desktop).copyOpacity, 0);
  assert.equal(cityState(desktop.start - 1, desktop).opacity, 0);
  assert.equal(cityState(desktop.start, desktop).opacity, 0);
  assert.ok(cityState(desktop.start + 1, desktop).opacity > 0);
  assert.equal(cityState(desktop.fadeEnd, desktop).opacity, 1);
});

test('scroll continuously pulls back on desktop and portrait, in both directions', () => {
  for (const geometry of [desktop, portrait]) {
    let previous = Infinity;
    for (let i=0; i<=100; i++) {
      const y=geometry.start+(geometry.end-geometry.start)*i/100;
      const state=cityState(y,geometry);
      assert.ok(state.zoom<=previous);
      assert.ok(Number.isFinite(state.zoom));
      previous=state.zoom;
      assert.deepEqual(state,cityState(y,geometry));
    }
    assert.equal(cityState(geometry.start,geometry).zoom,1.5);
    assert.equal(cityState(geometry.end,geometry).zoom,1);
    const early = cityState(geometry.start + 100, geometry).zoom;
    assert.ok(early < 1.5);
    assert.ok(Math.abs(early - (1.5 - .5 * 100 / (geometry.end - geometry.start))) < 1e-10);
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
