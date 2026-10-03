import {clamp, smooth} from '../section-three/motion.js';

// Three representative examples replace the former 47-item processing queue.
export const WORKFLOW = {orderStart: 0, ordered: .18, processStart: .18, finished: .78, conclusion: .82, examples: 3};

export function workflowState(progress, count = WORKFLOW.examples) {
  const p = clamp(progress), exampleCount = Math.min(WORKFLOW.examples, Math.max(0, count));
  const cursor = clamp((p - WORKFLOW.processStart) / (WORKFLOW.finished - WORKFLOW.processStart)) * exampleCount;
  const completed = Math.min(exampleCount, Math.floor(cursor + 1e-8));
  const exampleIndex = exampleCount ? Math.min(exampleCount - 1, Math.floor(cursor + 1e-8)) : null;
  const exampleProgress = exampleIndex === null ? 0 : clamp(cursor - exampleIndex);
  return {progress: p, ordered: smooth(WORKFLOW.orderStart, WORKFLOW.ordered, p), cursor,
    completed, pending: exampleCount - completed, exampleCount, exampleIndex, exampleProgress,
    activeIndex: completed < exampleCount && cursor > completed ? completed : null,
    reveal: smooth(.08, .18, p), fraction: exampleCount ? completed / exampleCount : 1,
    backgroundOpacity: 1 - smooth(.06, .22, p), resultReveal: smooth(.12, .48, exampleProgress),
    conclusion: p >= WORKFLOW.conclusion};
}

// The original papers keep their permanent depth lanes and briefly settle
// together. They never form another one-by-one queue or turn "completed".
export function cardWorkflow(state, index, count, width, height, portrait, aspect = 1) {
  const spread = count > 1 ? index / (count - 1) : 0, short = height <= 460;
  return {travel: 0, move: 0, x: -.48, y: short ? -.24 + spread * .04 : -.08 + spread * .10,
    rotation: (spread - .5) * .035, opacity: state.backgroundOpacity,
    pixelWidth: Math.min(width * (portrait ? .38 : .28), height * (short ? .26 : .38) * aspect),
    done: false, settled: state.ordered === 1};
}
