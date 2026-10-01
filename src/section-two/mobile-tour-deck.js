import {getCaseStudy, collaborationStory} from './case-studies.js';

// Reuse every case; only the current article is visible and focusable.
export function createMobileTourDeck(section, route, clients, {onStep, onReading} = {}) {
  const deck = document.createElement('div');
  deck.className = 'city-tour-deck';
  deck.setAttribute('role', 'region');
  deck.setAttribute('aria-label', 'Recorrido por nuestros clientes');
  const cards = clients.map(client => {
    const index = route.findIndex(stop => stop.id === client.id);
    const invitation = Boolean(client.invitation);
    const story = invitation ? collaborationStory : getCaseStudy(client.id);
    const card = document.createElement('article');
    card.className = 'city-tour-card';
    card.dataset.client = client.id;
    card.setAttribute('data-lenis-prevent', '');
    card.id = `tour-card-${client.id}`;
    card.setAttribute('aria-labelledby', `tour-client-${client.id}`);
    card.innerHTML = '<div class="tour-card-brand"><img alt="" /><span class="tour-card-count"></span></div><h3 class="tour-card-client"></h3><h4 class="tour-card-heading"></h4><p class="tour-card-intro"></p>';
    card.querySelector('.tour-card-client').id = `tour-client-${client.id}`;
    card.querySelector('.tour-card-client').textContent = client.name;
    card.querySelector('.tour-card-heading').textContent = story.title;
    card.querySelector('.tour-card-intro').textContent = story.intro;
    card.querySelector('.tour-card-count').textContent = index < 0 ? 'Cliente' : `${String(index + 1).padStart(2, '0')} / ${String(route.length).padStart(2, '0')}`;
    const logo = card.querySelector('img');
    if (invitation) logo.hidden = true;
    else {logo.dataset.src = client.image; logo.alt = client.name; logo.decoding = 'async';}
    if (invitation) {
      const contact = document.createElement('a');
      contact.className = 'tour-card-contact';
      contact.href = 'https://www.puntoes.es/contacto/';
      contact.target = '_blank'; contact.rel = 'noopener noreferrer';
      contact.textContent = 'Hablemos ↗';
      card.append(contact);
    } else {
      const details = document.createElement('details');
      details.className = 'tour-card-details';
      details.innerHTML = '<summary>Ver más <span aria-hidden="true">＋</span></summary><div class="tour-card-story" data-lenis-prevent></div>';
      for (const [field, label] of [['challenge', 'El punto de partida'], ['approach', 'El recorrido'], ['goal', 'Lo que queremos hacer posible']]) {
        const heading = document.createElement('h5'), paragraph = document.createElement('p');
        heading.textContent = label; paragraph.textContent = story[field];
        details.querySelector('.tour-card-story').append(heading, paragraph);
      }
      details.addEventListener('toggle', () => {if (card.classList.contains('is-current')) onReading?.(details.open)});
      card.append(details);
      const draft = document.createElement('p');
      draft.className = 'tour-card-draft'; draft.textContent = 'Caso ilustrativo · texto de muestra';
      card.append(draft);
    }
    deck.append(card);
    return card;
  });
  const controls = document.createElement('nav');
  controls.className = 'city-tour-controls';
  controls.setAttribute('aria-label', 'Navegar por el recorrido');
  const previous = document.createElement('button'), next = document.createElement('button');
  previous.type = next.type = 'button';
  previous.innerHTML = '<span>← Anterior</span><small></small>';
  next.innerHTML = '<span>Siguiente →</span><small></small>';
  previous.addEventListener('click', () => onStep?.(-1));
  next.addEventListener('click', () => onStep?.(1));
  const status = document.createElement('span');
  status.className = 'tour-status'; status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  controls.append(previous, status, next);
  section.querySelector('.trust-frame').append(deck, controls);
  let previousClient = null;
  const nameFor = id => id === 'puntoes' ? 'Puntoes' : id === 'section1' ? 'El encuentro' : id === 'section3' ? 'Lo que hacemos posible' : clients.find(c => c.id === id)?.name;
  return {
    load() {for (const logo of deck.querySelectorAll('img[data-src]')) if (!logo.src) logo.src = logo.dataset.src;},
    update(state, enabled, tour) {
      const {entry, active, currentId, nextId, previousId, moving} = tour;
      const showing = enabled && active;
      controls.hidden = !showing;
      controls.inert = !showing;
      // Keep keyboard focus stable while a repeated request is ignored.
      previous.setAttribute('aria-disabled', String(moving));
      next.setAttribute('aria-disabled', String(moving));
      previous.setAttribute('aria-label', `Anterior: ${nameFor(previousId)}`);
      next.setAttribute('aria-label', `Siguiente: ${nameFor(nextId)}`);
      previous.querySelector('small').textContent = nameFor(previousId);
      next.querySelector('small').textContent = nameFor(nextId);
      if (status.dataset.client !== currentId && !moving) {
        status.dataset.client = currentId; status.textContent = nameFor(currentId);
      }
      deck.inert = !showing || !entry;
      deck.setAttribute('aria-hidden', String(!showing || !entry));
      if (currentId !== previousClient) {
        const outgoing = cards.find(card => card.dataset.client === previousClient);
        // If an explicit logo changes a focused article, preserve focus on a
        // stable navigation control before that article becomes inert.
        if (outgoing?.contains(document.activeElement)) next.focus({preventScroll: true});
        for (const details of deck.querySelectorAll('details[open]')) details.open = false;
        const incoming = cards.find(card => card.dataset.client === currentId);
        if (incoming) incoming.scrollTop = 0;
        onReading?.(false);
        previousClient = currentId;
      }
      for (const card of cards) {
        const visible = showing && card.dataset.client === entry?.id;
        card.style.visibility = visible ? 'visible' : 'hidden';
        card.style.opacity = visible ? entry.progress : 0;
        card.style.transform = `translateY(${visible ? (1 - entry.progress) * 18 : 0}px)`;
        card.inert = !visible || entry.progress < .1;
        card.style.pointerEvents = card.inert ? 'none' : 'auto';
        card.setAttribute('aria-hidden', String(card.inert));
        card.classList.toggle('is-current', visible);
      }
    },
    hide() {deck.inert = true; deck.setAttribute('aria-hidden', 'true'); controls.hidden = true; controls.inert = true},
  };
}
