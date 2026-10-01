import {getCaseStudy, collaborationStory} from './case-studies.js';
import {mobileCardStack} from './mobile-tour.js';

// Non-modal cards: the page keeps scrolling while the next building is framed.
// Each client's full existing story stays available under its explicit Ver más.
export function createMobileTourDeck(section, route, clients) {
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
      card.append(details);
      const draft = document.createElement('p');
      draft.className = 'tour-card-draft'; draft.textContent = 'Caso ilustrativo · texto de muestra';
      card.append(draft);
    }
    deck.append(card);
    return card;
  });
  section.querySelector('.trust-frame').append(deck);
  let previousClient = null;
  return {
    load() {for (const logo of deck.querySelectorAll('img[data-src]')) if (!logo.src) logo.src = logo.dataset.src;},
    update(state, enabled, {order, entry, retreat = 1}) {
      const showing = enabled && state.active && order.length > 0 && retreat > .03;
      deck.style.opacity = retreat;
      deck.style.transform = `translateY(${(1 - retreat) * 36}px)`;
      deck.inert = !showing;
      deck.setAttribute('aria-hidden', String(!showing));
      if (entry?.id !== previousClient) {
        for (const details of deck.querySelectorAll('details[open]')) details.open = false;
        previousClient = entry?.id;
      }
      const incomingIndex = order.indexOf(entry?.id);
      const readable = entry?.progress > .9 ? entry.id : order.at(incomingIndex < 0 ? -1 : -2);
      for (const card of cards) {
        const index = order.indexOf(card.dataset.client);
        const stack = mobileCardStack(index, {stopIndex: incomingIndex < 0 ? order.length : incomingIndex, cardProgress: entry?.progress ?? 0});
        const visible = showing && index >= 0 && stack.incoming > 0 && !stack.buried;
        const fade = card.dataset.client === entry?.id && entry.mode === 'fade';
        card.style.zIndex = index + 1;
        card.style.visibility = visible ? 'visible' : 'hidden';
        card.style.opacity = fade ? stack.incoming : 1;
        card.dataset.entrance = fade ? 'fade' : 'slide';
        card.style.transform = fade ? `translate3d(${stack.offsetX}px,${(1 - stack.incoming) * 4 + stack.offsetY}px,0) rotate(${stack.rotation}deg) scale(${stack.scale})` :
          `translate3d(${stack.offsetX}px,calc(${(1 - stack.incoming) * 100}% + ${(1 - stack.incoming) * 64 + stack.offsetY}px),0) rotate(${stack.rotation}deg) scale(${stack.scale})`;
        card.inert = !visible || card.dataset.client !== readable;
        card.setAttribute('aria-hidden', String(card.inert));
        card.classList.toggle('is-current', card.dataset.client === readable);
      }
    },
    hide() {deck.inert = true; deck.setAttribute('aria-hidden', 'true');},
  };
}
