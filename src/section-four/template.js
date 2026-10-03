import {EXAMPLES} from './routing-model.js';

const icons = {
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6 8 7 8-7"/>',
  document: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>',
  ticket: '<rect x="8" y="6" width="8" height="14" rx="4"/><path d="m9 3 3 3 3-3M12 6v14M4 10h4m8 0h4M4 15h4m8 0h4M6 5l3 3m6 0 3-3M6 21l3-3m6 0 3 3"/>',
};
const icon = kind => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind]}</svg>`;

export function renderWorkflow() {
  return `<div class="routing-story" data-routing-story aria-hidden="true" inert>
    <div class="routing-story-heading"><p class="eyebrow"><span class="blue-dot" aria-hidden="true"></span>IA APLICADA A TU DÍA A DÍA</p><h2>Del pendiente<br class="routing-title-break"> <em>al siguiente paso.</em></h2></div>
    <ol class="routing-steps" aria-label="Tres ejemplos de aplicación">${EXAMPLES.map((item,i) => `<li data-example-step${i===0?' class="is-current" aria-current="step"':''}><button type="button" data-example-select="${i}" aria-label="Ver ejemplo de ${item.label.toLowerCase()}" aria-pressed="${i===0}"><span aria-hidden="true">0${i+1}</span>${item.label}</button></li>`).join('')}</ol>
    <div class="routing-examples">${EXAMPLES.map((item,i) => `<article class="routing-case" data-routing-case="${item.id}" aria-label="${item.label}: antes y con IA"${i?' hidden':''}>
      <div class="routing-card routing-before"><div class="routing-card-top"><span class="routing-type-icon routing-type-${item.icon}">${icon(item.icon)}</span><div><p class="routing-card-type">${item.type}</p><p class="routing-card-meta">Antes</p></div><span class="routing-card-state">Pendiente</span></div><h3>${item.beforeTitle}</h3><p class="routing-card-copy">${item.before}</p><p class="routing-card-footer">Trabajo manual · Tu equipo</p></div>
      <div class="routing-process" aria-hidden="true"><span class="routing-process-line"></span><span class="routing-process-core">IA</span><span class="routing-process-line"></span><span class="routing-process-action">${item.action}</span></div>
      <div class="routing-card routing-after"><div class="routing-card-top"><span class="routing-type-icon routing-result-icon">✓</span><div><p class="routing-card-type">CON IA</p><p class="routing-card-meta">Un siguiente paso claro</p></div><span class="routing-card-state routing-state-ready">Preparado</span></div><h3>${item.afterTitle}</h3><p class="routing-card-copy">${item.after}</p><ul>${item.details.map(text => `<li><span aria-hidden="true">✓</span>${text}</li>`).join('')}</ul><p class="routing-review">${item.review}</p></div>
    </article>`).join('')}</div>
    <p class="routing-story-note">Ejemplos de aplicación. Definimos el proceso contigo.</p>
  </div>
  <div class="paper-resolution-copy" aria-hidden="true" inert>
    <p class="eyebrow"><span class="blue-dot" aria-hidden="true"></span>MÁS ESPACIO PARA TU EQUIPO</p>
    <h2 id="resolution-title">Menos trabajo repetitivo.<br><em>Más tiempo para avanzar.</em></h2>
    <p class="routing-conclusion-copy">En Puntoes integramos la IA en tus procesos y formamos a tu equipo para que pueda aprovecharla.</p>
    <ul class="routing-benefits"><li><span aria-hidden="true">✓</span>Solicitudes con prioridad</li><li><span aria-hidden="true">✓</span>Información preparada</li><li><span aria-hidden="true">✓</span>Respuestas con contexto</li></ul>
    <a class="routing-cta" href="#contacto" data-workflow-cta>Hablemos de tus procesos <span aria-hidden="true">↗</span></a>
  </div>`;
}
