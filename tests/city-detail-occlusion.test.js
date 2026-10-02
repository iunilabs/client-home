import test from 'node:test';
import assert from 'node:assert/strict';
import {detailBackgroundClip, newLandmarkRegions} from '../src/section-two/city-detail-occlusion.js';
import {mobileTourBuildings, mobileTourHub} from '../src/section-two/mobile-tour-config.js';

test('new landmark exclusions never cut a previously calibrated client building', () => {
  for (const [id, site] of Object.entries({puntoes: mobileTourHub, ...mobileTourBuildings})) {
    if (id in newLandmarkRegions) continue;
    const [cx, cy] = [site.center[0] * 9.41, site.center[1] * 16.72];
    const [w, h] = [site.size[0] * 9.41, site.size[1] * 16.72];
    for (const regions of Object.values(newLandmarkRegions)) for (const [x, y, rw, rh] of regions) {
      assert.ok(cx + w / 2 <= x || cx - w / 2 >= x + rw || cy + h / 2 <= y || cy - h / 2 >= y + rh, `${id}: preserve approved architecture`);
    }
  }
});

test('old background is clipped locally; new tile and distant tiles stay whole', () => {
  assert.equal(detailBackgroundClip('telefonica', [290, 710, 180, 260]), '');
  assert.equal(detailBackgroundClip('bbva', [332, 70, 280, 496]), '');
  assert.match(detailBackgroundClip('naturgy', [297, 777, 280, 496]), /^polygon\(evenodd,/);
  assert.match(detailBackgroundClip('puntoes', [346, 418, 300, 532]), /^polygon\(evenodd,/);
});
