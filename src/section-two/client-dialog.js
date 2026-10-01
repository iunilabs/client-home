import {getCaseStudy} from './case-studies.js';

export function createClientDialog({onOpen = () => {}, onClose = () => {}} = {}) {
  const dialog = document.querySelector('#city-case');
  const closeButton = dialog.querySelector('.case-close');
  const moreButton = dialog.querySelector('.case-more-button');
  const details = dialog.querySelector('#case-more');
  const title = dialog.querySelector('#case-title');
  const logo = dialog.querySelector('.case-logo');
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
    logo.alt = client.name;
    // Logos are already cleaned and loaded by the city; reuse that exact image.
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

  return {open, close, get isOpen() {return dialog.open}};
}
