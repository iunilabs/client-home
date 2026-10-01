import {getCaseStudy} from './case-studies.js';

export function createClientDialog({onOpen = () => {}, onClose = () => {}} = {}) {
  const dialog = document.querySelector('#city-case');
  const closeButton = dialog.querySelector('.case-close');
  const moreButton = dialog.querySelector('.case-more-button');
  const details = dialog.querySelector('#case-more');
  const title = dialog.querySelector('#case-title');
  const logo = dialog.querySelector('.case-logo');
  const brand = dialog.querySelector('.case-brand');
  const draft = dialog.querySelector('.case-draft');
  const contact = dialog.querySelector('.case-contact');
  let opener = null;

  function collapse() {
    details.hidden = true;
    moreButton.setAttribute('aria-expanded', 'false');
    moreButton.querySelector('span').textContent = 'Ver más';
  }

  function open(client, trigger, logoSource = client.image) {
    const story = getCaseStudy(client.id);
    if (!story) return;
    opener = trigger;
    dialog.dataset.client = client.id;
    brand.hidden = false;
    draft.hidden = false;
    contact.hidden = true;
    moreButton.hidden = false;
    logo.alt = client.name;
    // Reuse the same official vector/high-resolution file as the carousel.
    logo.src = logoSource;
    title.textContent = client.name;
    dialog.querySelector('.case-heading').textContent = story.title;
    dialog.querySelector('.case-intro').textContent = story.intro;
    for (const field of ['challenge', 'approach', 'goal']) {
      dialog.querySelector('[data-case="' + field + '"]').textContent = story[field];
    }
    collapse();
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    onOpen();
    closeButton.focus({preventScroll: true});
  }

  function openInvitation(trigger) {
    opener = trigger;
    dialog.dataset.client = 'collaborate';
    brand.hidden = true;
    draft.hidden = true;
    contact.hidden = false;
    moreButton.hidden = true;
    title.textContent = '¿Quieres colaborar?';
    dialog.querySelector('.case-heading').textContent = 'El próximo punto puede ser el tuyo.';
    dialog.querySelector('.case-intro').textContent = 'Hay un lugar para las ideas que merecen hacerse realidad. Cuéntanos qué quieres transformar y construyamos el siguiente proyecto juntos.';
    collapse();
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    onOpen();
    closeButton.focus({preventScroll: true});
  }

  function close() { if (dialog.open) dialog.close(); }

  closeButton.addEventListener('click', close);
  moreButton.addEventListener('click', () => {
    const expanded = moreButton.getAttribute('aria-expanded') !== 'true';
    details.hidden = !expanded;
    moreButton.setAttribute('aria-expanded', String(expanded));
    moreButton.querySelector('span').textContent = expanded ? 'Ver menos' : 'Ver más';
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  dialog.addEventListener('close', () => {
    opener?.setAttribute('aria-expanded', 'false');
    onClose();
    if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({preventScroll: true});
  });

  return {open, openInvitation, close, get isOpen() {return dialog.open}};
}
