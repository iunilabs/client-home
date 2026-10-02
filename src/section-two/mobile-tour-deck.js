import {getCaseStudy, collaborationStory} from './case-studies.js';
import {mobileCardStack} from './mobile-tour.js';

// One bounded summary per client. Case pages are future destinations; links
// keep normal browser navigation and never expand or open a mobile dialog.
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
    card.classList.toggle('is-invitation', invitation);
    card.dataset.client = client.id;
    card.id = `tour-card-${client.id}`;
    card.setAttribute('aria-labelledby', `tour-client-${client.id}`);
    card.innerHTML = '<div class="tour-card-brand"><img alt="" /><span class="tour-card-count"></span></div><h3 class="tour-card-client"></h3><h4 class="tour-card-heading"></h4><p class="tour-card-intro"></p>';
    card.querySelector('.tour-card-client').id = `tour-client-${client.id}`;
    card.querySelector('.tour-card-client').textContent = client.name;
    card.querySelector('.tour-card-heading').textContent = story.cardTitle ?? story.title;
    card.querySelector('.tour-card-intro').textContent = story.cardIntro ?? story.intro;
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
      const link = document.createElement('a');
      link.className = 'tour-card-more';
      link.href = `${import.meta.env.BASE_URL}clientes/${client.id}/`;
      link.textContent = 'Ver el caso ↗';
      card.append(link);
      const draft = document.createElement('p');
      draft.className = 'tour-card-draft'; draft.textContent = 'Caso ilustrativo · texto de muestra';
      card.append(draft);
    }
    deck.append(card);
    return card;
  });
  section.querySelector('.trust-frame').append(deck);
  let displayedCountKey = null;
  // Navigation keeps a cache of all visits. The visible pile belongs only to
  // the current pass from Puntoes, so returning to the hub cannot reveal a
  // cached client that has not appeared in this pass.
  let presented = [];
  return {
    load() {for (const logo of deck.querySelectorAll('img[data-src]')) if (!logo.src) logo.src = logo.dataset.src;},
    update(state, enabled, {order, entry, outgoingId = null, moving = false, retreat = 1, manualId = null, routeLength = route.length}) {
      presented = presented.filter(id => order.includes(id));
      if (outgoingId === 'puntoes' || !entry && retreat <= .03) presented = [];
      if (entry?.progress > .9 && order.includes(entry.id)) {
        presented = [...presented.filter(id => id !== entry.id), entry.id];
      }
      // Only the real outgoing card may sit behind an unfinished entrance.
      // A rapid new swipe must not bring an interrupted/future card fully in.
      const renderOrder = !entry ? presented.filter(id => id === outgoingId) :
        moving || entry.progress < 1 ? [...presented.filter(id => id === outgoingId && id !== entry.id), entry.id] : presented;
      const showing = enabled && state.active && renderOrder.length > 0 && retreat > .03;
      deck.style.opacity = retreat;
      deck.style.visibility = showing ? 'visible' : 'hidden';
      deck.style.transform = `translateY(${(1 - retreat) * 36}px)`;
      deck.inert = !showing;
      deck.setAttribute('aria-hidden', String(!showing));
      const incomingIndex = renderOrder.indexOf(entry?.id);
      const readable = entry?.progress > .9 ? entry.id : renderOrder.includes(outgoingId) ? outgoingId : null;
      const countKey = `${manualId ?? ''}:${routeLength}`;
      for (const card of cards) {
        if (countKey !== displayedCountKey) {
          const routeIndex = route.findIndex(stop => stop.id === card.dataset.client);
          const invitationCard = card.dataset.client === 'collaborate';
          const manualCard = manualId && (card.dataset.client === manualId || invitationCard);
          card.querySelector('.tour-card-count').textContent = manualCard ?
            `${card.dataset.client === manualId ? '01' : '02'} / ${String(invitationCard ? Math.max(2, routeLength) : routeLength).padStart(2, '0')}` : routeIndex < 0 ? 'Cliente' :
            `${String(routeIndex + 1).padStart(2, '0')} / ${String(manualId ? route.length : Math.max(routeLength, routeIndex + 1)).padStart(2, '0')}`;
        }
        const index = renderOrder.indexOf(card.dataset.client);
        const stack = mobileCardStack(index, {stopIndex: incomingIndex < 0 ? renderOrder.length : incomingIndex, cardProgress: entry?.progress ?? 0});
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
        card.classList.toggle('is-current', visible && card.dataset.client === readable);
      }
      displayedCountKey = countKey;
    },
    hide() {
      presented = [];
      deck.style.visibility = 'hidden';
      deck.inert = true; deck.setAttribute('aria-hidden', 'true');
      for (const card of cards) {
        card.style.visibility = 'hidden'; card.inert = true;
        card.setAttribute('aria-hidden', 'true'); card.classList.remove('is-current');
      }
    },
  };
}
