import {clamp, smooth} from '../timeline.js';

export function trustCopyOpacity(scrollRatio, reduced = false) {
  return reduced ? Number(scrollRatio >= .77) : smooth(.77, .81, scrollRatio);
}

// Turn in place, as if looking from one wall to the next. No orbit around the hands.
export function turnState(progress, time = 0, reduced = false) {
  const p = clamp(progress);
  // Hold the outgoing composition in view long enough to read its 3D rotation.
  const turn = reduced ? Number(p >= .5) : smooth(0, 1, p ** 1.8);
  const life = reduced ? 0 : smooth(0, .13, p) * (1 - smooth(.88, 1, p));
  const ownTurn = reduced ? 0 : smooth(0, .95, p);
  return {
    progress: p,
    yaw: -Math.PI / 2 * turn,
    retreat: reduced ? 0 : .55 * smooth(0, .4, p),
    handScale: reduced ? 1 : 1 - .5 * smooth(0, .64, p),
    depthTurn: reduced ? 0 : 1.35 * smooth(0, 1, p),
    humanSpin: ownTurn * .65,
    porcelainSpin: ownTurn * -1.85,
    humanRoll: life * (.045 + Math.sin(time * .65) * .018),
    porcelainRoll: life * (-.04 + Math.sin(time * .58 + .8) * .015),
    handTilt: life * .035,
    handsVisible: p < (reduced ? .5 : .95),
    encounterOpacity: 1 - smooth(0, .22, p),
  };
}
