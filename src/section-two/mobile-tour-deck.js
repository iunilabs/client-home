import {getCaseStudy, collaborationStory} from './case-studies.js';
import {mobileCardStack} from './mobile-tour.js';

// Non-modal cards: the page keeps scrolling while the next building is framed.
// Each client's full existing story stays available under its explicit Ver más.
export function createMobileTourDeck(section, route, clients) {
  const deck = document.createElement('div');
  deck.className = 'city-tour-deck';
  deck.setAttribute('role', 'region');
  deck.setAttribute('aria-label', 'Recorrido por nuestros clientes');
  const cards = route.map((stop, index) => {
    const client = clients.find(item => item.id === stop.id);
    if (!client) throw new Error(`Unknown mobile tour client: ${stop.id}`);
    const invitation = Boolean(client.invitation);
    const story = invitation ? collaborationStory : getCaseStudy(stop.id);
    const card = document.createElement('article');
    card.className = 'city-tour-card';
    card.dataset.client = stop.id;
    card.style.zIndex = index + 1;
    card.setAttribute('aria-labelledby', `tour-client-${stop.id}`);
    card.innerHTML = '<div class="tour-card-brand"><img alt="" /><span class="tour-card-count"></span></div><h3 class="tour-card-client"></h3><h4 class="tour-card-heading"></h4><p class="tour-card-intro"></p>';
    card.querySelector('.tour-card-client').id = `tour-client-${stop.id}`;
    card.querySelector('.tour-card-client').textContent = client.name;
    card.querySelector('.tour-card-heading').textContent = story.title;
    card.querySelector('.tour-card-intro').textContent = story.intro;
    card.querySelector('.tour-card-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(route.length).padStart(2, '0')}`;
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
      card.append(details);
      const draft = document.createElement('p');
      draft.className = 'tour-card-draft'; draft.textContent = 'Caso ilustrativo · texto de muestra';
      card.append(draft);
    }
    deck.append(card);
    return card;
  });
  section.querySelector('.trust-frame').append(deck);
  let previousIndex = -1;
  return {
    load() {for (const logo of deck.querySelectorAll('img[data-src]')) if (!logo.src) logo.src = logo.dataset.src;},
    update(state, enabled) {
      const showing = enabled && state.active && state.stopIndex >= 0;
      deck.inert = !showing;
      deck.setAttribute('aria-hidden', String(!showing));
      if (state.stopIndex !== previousIndex) {
        for (const details of deck.querySelectorAll('details[open]')) details.open = false;
        previousIndex = state.stopIndex;
      }
      const readable = state.cardProgress > .9 ? state.stopIndex : state.stopIndex - 1;
      for (const [index, card] of cards.entries()) {
        const stack = mobileCardStack(index, state);
        const visible = showing && stack.incoming > 0 && !stack.buried;
        card.style.visibility = visible ? 'visible' : 'hidden';
        card.style.transform = `translate3d(${stack.offsetX}px,calc(${(1 - stack.incoming) * 100}% + ${(1 - stack.incoming) * 64 + stack.offsetY}px),0) rotate(${stack.rotation}deg) scale(${stack.scale})`;
        card.inert = !visible || index !== readable;
        card.setAttribute('aria-hidden', String(card.inert));
        card.classList.toggle('is-current', index === readable);
      }
    },
    hide() {deck.inert = true; deck.setAttribute('aria-hidden', 'true');},
  };
}
