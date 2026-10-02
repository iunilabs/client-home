import test from 'node:test';
import assert from 'node:assert/strict';
import {createCarouselMotion} from '../src/section-two/carousel-motion.js';

test('drag stays under the finger, release carries measured momentum, and auto waits two seconds', () => {
  const motion = createCarouselMotion();
  motion.frame(0);
  motion.beginDrag();
  motion.dragTo(240);
  assert.equal(motion.frame(500).delta, 0, 'a held finger never starts automatic motion');
  motion.endDrag(1000, 720);
  const early = motion.frame(1100);
  assert.equal(early.phase, 'inertia');
  assert.ok(early.delta > 45 && early.delta < 75, 'release begins with the measured fast fling');
  const later = motion.frame(1500);
  assert.ok(later.delta > 0 && later.delta < early.delta * 2, 'inertia decelerates over time');
  assert.equal(motion.frame(2999).phase, 'waiting');
  const resumed = motion.frame(3000);
  assert.equal(resumed.phase, 'resuming');
  assert.ok(resumed.delta > 0 && resumed.delta < 2, 'automatic motion starts gently after the idle deadline');
});

test('same elapsed time produces nearly the same automatic distance at 60 and 120 Hz', () => {
  function distance(frameMs) {
    const motion = createCarouselMotion();
    motion.frame(0);
    motion.interrupt(0);
    let distance = 0;
    for (let now = frameMs; now <= 3400; now += frameMs) distance += motion.frame(now).delta;
    return distance;
  }
  const sixty = distance(1000 / 60), oneTwenty = distance(1000 / 120);
  assert.ok(sixty > 30, 'the automatic phase has started and accelerated');
  assert.ok(Math.abs(sixty - oneTwenty) < 1.2, `${sixty}px vs ${oneTwenty}px`);
});

test('a slow release coasts briefly and brakes before the automatic deadline', () => {
  const motion = createCarouselMotion();
  motion.frame(0);
  motion.beginDrag();
  motion.dragTo(160);
  motion.endDrag(1000, 110);
  const coast = motion.frame(1150);
  assert.equal(coast.phase, 'inertia');
  assert.ok(coast.delta > 10 && coast.delta < 18, 'slow release keeps its measured low speed');
  const brake = motion.frame(1550);
  assert.ok(brake.delta > 0 && brake.delta < coast.delta, 'low-speed inertia falls toward rest');
  assert.equal(motion.frame(2999).phase, 'waiting');
  assert.equal(motion.frame(3000).phase, 'resuming');
});

test('reduced motion cancels fling and ornamental auto movement while preserving direct drag', () => {
  const motion = createCarouselMotion();
  motion.frame(0);
  motion.beginDrag();
  motion.dragTo(85);
  motion.endDrag(100, 600);
  motion.setReduced(true);
  assert.equal(motion.frame(600).delta, 0);
  assert.equal(motion.frame(3000).phase, 'reduced-motion');
  assert.equal(motion.offset, 85);
});

test('mobile reduced motion keeps gentle autoplay, omits flings and resumes after the finger releases', () => {
  const motion = createCarouselMotion();
  motion.frame(0);
  motion.beginDrag();
  motion.dragTo(85);
  motion.setReduced(true, {autoplay: true});
  assert.equal(motion.frame(200, true, 22).delta, 0, 'a held finger pauses even with mobile autoplay enabled');
  motion.endDrag(300, 600);
  assert.equal(motion.velocity, 0, 'reduced motion still suppresses the fling');
  assert.equal(motion.frame(400, false, 22).delta, 0);
  let distance = 0;
  for (let now = 500; now <= 4300; now += 100) {
    motion.setReduced(true, {autoplay: true});
    distance += motion.frame(now, false, 22).delta;
  }
  assert.ok(distance > 25, 'reapplying the preference every frame does not reset the automatic ramp');
  assert.equal(motion.frame(4400, false, 22).phase, 'automatic');
  motion.setReduced(true);
  assert.equal(motion.frame(4500).phase, 'reduced-motion', 'the default desktop contract still pauses reduced motion');
});

test('pausing for a modal clears momentum and restarts the two second idle clock', () => {
  const motion = createCarouselMotion();
  motion.frame(0);
  motion.beginDrag();
  motion.dragTo(60);
  motion.endDrag(100, 500);
  motion.frame(180);
  motion.interrupt(180);
  assert.equal(motion.frame(2179, true).delta, 0);
  assert.equal(motion.frame(2180).phase, 'resuming');
});
