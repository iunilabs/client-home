const AUTO_DELAY = 2000;
const AUTO_SPEED = 34;
const AUTO_RAMP_SECONDS = .9;
const INERTIA_DECAY = 4.6;
const MIN_INERTIA_SPEED = 8;

// Pixel-based motion so drag distance, inertia and autoplay do not depend on
// display refresh rate. The caller owns the offset and applies returned deltas.
export function createCarouselMotion() {
  let offset = 0;
  let velocity = 0;
  let lastTime = null;
  let lastGesture = -Infinity;
  let dragging = false;
  let reduced = false;
  let ramp = 0;

  return {
    get offset() { return offset },
    get velocity() { return velocity },
    get dragging() { return dragging },
    setOffset(value) { offset = value },
    setReduced(value) {
      reduced = value;
      if (reduced) { velocity = 0; ramp = 0 }
    },
    beginDrag() {
      dragging = true;
      velocity = 0;
      ramp = 0;
      lastTime = null;
    },
    dragTo(value) { offset = value },
    endDrag(now, measuredVelocity) {
      dragging = false;
      lastGesture = now;
      velocity = reduced ? 0 : measuredVelocity;
      lastTime = now;
    },
    interrupt(now) {
      dragging = false;
      velocity = 0;
      ramp = 0;
      lastGesture = now;
      lastTime = now;
    },
    frame(now, blocked = false, autoSpeed = AUTO_SPEED) {
      const elapsed = lastTime === null ? 0 : Math.max(0, (now - lastTime) / 1000);
      lastTime = now;
      if (!elapsed || blocked || dragging || reduced) {
        if (blocked || reduced) { velocity = 0; ramp = 0 }
        return {delta: 0, phase: reduced ? 'reduced-motion' : dragging ? 'dragging' : blocked ? 'paused' : 'idle'};
      }

      // Integrate exponential friction exactly over elapsed time, then blend
      // smoothly into the forward autoplay speed after the inactivity delay.
      let delta = 0;
      const friction = INERTIA_DECAY;
      if (Math.abs(velocity) >= MIN_INERTIA_SPEED) {
        const decay = Math.exp(-friction * elapsed);
        delta += velocity * (1 - decay) / friction;
        velocity *= decay;
      } else velocity = 0;

      const idle = now - lastGesture;
      if (idle >= AUTO_DELAY) {
        ramp = Math.min(1, ramp + elapsed / AUTO_RAMP_SECONDS);
        const target = autoSpeed * ramp;
        delta += target * elapsed;
        return {delta, phase: ramp < 1 ? 'resuming' : 'automatic'};
      }
      ramp = 0;
      return {delta, phase: Math.abs(velocity) >= MIN_INERTIA_SPEED ? 'inertia' : 'waiting'};
    }
  };
}
