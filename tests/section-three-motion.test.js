import test from 'node:test';
import assert from 'node:assert/strict';
import {flightTrack} from '../src/section-three/motion.js';

test('a fall accelerates downwards and ends at its composition anchor', () => {
  for (const seed of [97, 192, 297, 701, 1201]) {
    const sample = flightTrack(seed); let last = Infinity;
    for (let i = 0; i <= 100; i++) { const p = sample(i / 100); assert.ok(p.y <= last); assert.ok(Object.values(p).every(Number.isFinite)); last = p.y; }
    assert.equal(sample(0).y, 1); assert.deepEqual([sample(1).x, sample(1).y, sample(1).z], [0, 0, 0]);
    assert.ok((sample(.7).y - sample(.8).y) > (sample(0).y - sample(.1).y));
  }
});
test('scroll reversal samples exactly the same spatial and angular trajectory', () => {
  const sample = flightTrack(97); const positions = [.1, .32, .6, .9].map(sample);
  for (const t of [.98, .5, .04, .7]) sample(t);
  assert.deepEqual([.1, .32, .6, .9].map(sample), positions);
});
test('air motion changes bank direction smoothly instead of spinning at a constant rate', () => {
  const sample = flightTrack(701); let positive = 0, negative = 0;
  for (let i = 1; i <= 500; i++) {
    const a = sample((i - 1) / 500), b = sample(i / 500);
    assert.ok(Math.abs(b.roll - a.roll) < .04); assert.ok(Math.abs(b.pitch - a.pitch) < .04);
    if (b.roll > a.roll) positive++; else negative++;
  }
  assert.ok(positive > 50 && negative > 50);
});
