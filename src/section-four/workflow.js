import {clamp, smooth} from '../section-three/motion.js';

export const WORKFLOW = {orderStart: 0, ordered: .24, processStart: .24, finished: .92};

export function workflowState(progress, count) {
  const p = clamp(progress);
  const ordered = smooth(WORKFLOW.orderStart, WORKFLOW.ordered, p);
  const cursor = clamp((p - WORKFLOW.processStart) / (WORKFLOW.finished - WORKFLOW.processStart)) * count;
  const completed = Math.min(count, Math.floor(cursor + 1e-8));
  return {progress: p, ordered, cursor, completed, pending: count - completed,
    activeIndex: completed < count && cursor > completed ? completed : null,
    reveal: smooth(.04, .18, p), fraction: count ? completed / count : 1};
}

// One scroll interval owns one paper. Reversing scroll replays the same route.
export function cardWorkflow(state, index, count, width, height, portrait, aspect = 1) {
  const travel = clamp(state.cursor - index);
  const move = smooth(0, 1, travel);
  const spread = count > 1 ? index / (count - 1) : 0;
  const short = height <= 460;
  const x = -.48 + move * .96;
  const y = short ? -.24 + spread * .04 + Math.sin(move * Math.PI) * .015 : -.08 + spread * .10 + Math.sin(move * Math.PI) * .07;
  return {travel, move, x, y, rotation: (spread - .5) * .035,
    // Cap tall papers by height, including phone landscape.
    pixelWidth: Math.min(width * (portrait ? .38 : .28), height * (short ? .26 : .38) * aspect),
    done: travel >= .86, settled: travel >= 1};
}
