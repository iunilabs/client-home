import {clamp} from './motion.js';

export function getPaperJourneyLayout(journey, viewport = innerHeight) {
  const chaosRange = Math.max(1, journey.querySelector('[data-paper-resolution-anchor]').offsetTop);
  const totalRange = Math.max(chaosRange + 1, journey.offsetHeight - viewport);
  return {start: journey.offsetTop, chaosRange, workflowRange: totalRange - chaosRange, totalRange};
}

export function paperJourneyState(localScroll, layout) {
  const local = Math.max(0, Math.min(layout.totalRange, localScroll));
  return {local, progress: local / layout.totalRange, chaos: clamp(local / layout.chaosRange),
    workflow: clamp((local - layout.chaosRange) / layout.workflowRange)};
}

export function paperJourneyScrollAt(layout, phase, progress) {
  return layout.start + (phase === 'workflow' ? layout.chaosRange + clamp(progress) * layout.workflowRange : clamp(progress) * layout.chaosRange);
}
