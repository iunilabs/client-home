import {applyRoutingAppearance} from './routing-model.js';
import {WORKFLOW} from './workflow.js';
import './task-routing.css';

export function createTaskRouting(journey, {onSelect = () => {}} = {}) {
  if (!journey.hasAttribute('data-task-routing')) return null;
  const stage = journey.querySelector('.paper-stage'), story = journey.querySelector('[data-routing-story]');
  const cases = [...story.querySelectorAll('[data-routing-case]')], steps = [...story.querySelectorAll('[data-example-step]')];
  const conclusion = journey.querySelector('.paper-resolution-copy');
  const select = event => {
    const button = event.target.closest('[data-example-select]'); if (!button) return;
    const index = Number(button.dataset.exampleSelect);
    onSelect(WORKFLOW.processStart + (WORKFLOW.finished - WORKFLOW.processStart) * (index + .8) / WORKFLOW.examples);
  };
  story.addEventListener('click', select);
  let current = -1, concluding = null, exposed = null;
  return {
    update(state) {
      const visible = state.progress >= .18;
      if (exposed !== visible) {
        exposed = visible; stage.style.setProperty('--routing-reveal', visible ? 1 : 0);
        story.inert = !visible || state.conclusion; story.setAttribute('aria-hidden', String(!visible || state.conclusion));
      }
      if (concluding !== state.conclusion) {
        concluding = state.conclusion; stage.classList.toggle('routing-conclusion', concluding);
        conclusion.inert = !concluding; conclusion.setAttribute('aria-hidden', String(!concluding));
        story.inert = !visible || concluding; story.setAttribute('aria-hidden', String(!visible || concluding));
      }
      if (current !== state.exampleIndex) {
        current = state.exampleIndex;
        cases.forEach((element, index) => {element.hidden = index !== current;});
        steps.forEach((step, index) => {
          step.classList.toggle('is-current', index === current);
          step.querySelector('button').setAttribute('aria-pressed', String(index === current));
          if (index === current) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
        });
      }
      story.style.setProperty('--result-reveal', state.resultReveal.toFixed(4));
    },
    fallback() {exposed = null; concluding = null; current = -1; stage.classList.remove('routing-conclusion'); story.inert = true; story.setAttribute('aria-hidden', 'true'); conclusion.inert = false; conclusion.setAttribute('aria-hidden', 'false');},
    dispose() {story.removeEventListener('click', select);},
    pose: card => card,
    appearance: applyRoutingAppearance,
  };
}
