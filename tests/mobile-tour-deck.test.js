import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createMobileTourNavigation} from '../src/section-two/mobile-tour-navigation.js';
import {mobileTourGeometry, mobileTourState} from '../src/section-two/mobile-tour.js';
import {mobileTourTiming} from '../src/section-two/mobile-tour-config.js';

// Execute the real deck controller; only Vite's base URL and DOM creation are
// substituted so navigation history can be tested independently of a browser.
const source = await fs.readFile(new URL('../src/section-two/mobile-tour-deck.js', import.meta.url), 'utf8');
const executable = source.replace('import.meta.env.BASE_URL', "'/'")
  .replace("'./case-studies.js'", JSON.stringify(new URL('../src/section-two/case-studies.js', import.meta.url).href))
  .replace("'./mobile-tour.js'", JSON.stringify(new URL('../src/section-two/mobile-tour.js', import.meta.url).href));
const {createMobileTourDeck} = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);

function element(tag) {
  const classes = new Set(), selectors = new Map();
  return {
    tag, children: [], style: {}, dataset: {}, attributes: {}, inert: false,
    classList: {toggle(name, enabled) {if (enabled) classes.add(name); else classes.delete(name);},
      remove: name => classes.delete(name), contains: name => classes.has(name)},
    setAttribute(name, value) {this.attributes[name] = value;},
    append(child) {this.children.push(child);},
    set innerHTML(value) {
      for (const selector of ['img', '.tour-card-count', '.tour-card-client', '.tour-card-heading', '.tour-card-intro']) {
        selectors.set(selector, element(selector));
      }
    },
    querySelector: selector => selectors.get(selector),
    querySelectorAll(selector) {
      return selector === 'img[data-src]' ? this.children.map(child => child.querySelector('img')).filter(logo => logo?.dataset.src) : [];
    },
  };
}

function setup() {
  const previousDocument = globalThis.document;
  globalThis.document = {createElement: element};
  try {
    const frame = element('div');
    const route = ['bbva', 'naturgy', 'sabadell', 'collaborate'].map(id => ({id}));
    const clients = [...route.map(({id}) => ({id, name: id, image: `${id}.svg`, invitation: id === 'collaborate'})),
      {id: 'cepsa', name: 'Cepsa', image: 'cepsa.svg'}];
    const controller = createMobileTourDeck({querySelector: () => frame}, route, clients);
    const deck = frame.children[0], cards = Object.fromEntries(deck.children.map(card => [card.dataset.client, card]));
    const update = (tour, enabled = true) => controller.update({active: true}, enabled, {order: [], entry: null, retreat: 0, ...tour});
    const visible = () => Object.values(cards).filter(card => card.style.visibility === 'visible').map(card => card.dataset.client);
    const current = () => Object.values(cards).filter(card => card.classList.contains('is-current')).map(card => card.dataset.client);
    return {controller, deck, cards, update, visible, current};
  } finally {globalThis.document = previousDocument;}
}

test('returning to Puntoes hides cached clients; a new first swipe displays only BBVA', () => {
  const {update, visible, current, cards} = setup();
  const order = ['bbva', 'naturgy'];
  update({order, entry: {id: 'bbva', progress: 1}, retreat: 1});
  update({order, entry: {id: 'naturgy', progress: .35}, outgoingId: 'bbva', moving: true, retreat: 1});
  assert.deepEqual(visible(), ['bbva', 'naturgy']);
  assert.deepEqual(current(), ['bbva']);
  assert.equal(cards.naturgy.inert, true);
  update({order, entry: {id: 'naturgy', progress: 1}, retreat: 1});
  assert.deepEqual(current(), ['naturgy']);
  update({order: ['naturgy', 'bbva'], entry: {id: 'bbva', progress: 1}, retreat: 1});
  update({order: ['naturgy', 'bbva'], entry: null, outgoingId: 'bbva', moving: true, retreat: .5});
  assert.deepEqual(visible(), ['bbva'], 'the real outgoing card alone retreats to the hub');
  update({order: ['naturgy', 'bbva'], entry: null, retreat: 0});
  assert.deepEqual(visible(), []);
  assert.deepEqual(current(), []);
  update({order: ['naturgy', 'bbva'], entry: {id: 'bbva', progress: .3, mode: 'fade'}, outgoingId: 'puntoes', moving: true, retreat: 1});
  assert.deepEqual(visible(), ['bbva'], 'Naturgy is cached but has not been presented after Puntoes');
  assert.equal(cards.naturgy.attributes['aria-hidden'], 'true');
  update({order: ['naturgy', 'bbva'], entry: {id: 'bbva', progress: 1}, retreat: 1});
  assert.deepEqual(visible(), ['bbva']);
  assert.deepEqual(current(), ['bbva']);
});

test('an interrupted entrance cannot turn an unseen card into a complete outgoing card', () => {
  const {update, visible, current} = setup();
  update({order: ['bbva'], entry: {id: 'bbva', progress: .25}, outgoingId: 'puntoes', moving: true, retreat: 1});
  assert.deepEqual(visible(), ['bbva']);
  update({order: ['bbva', 'naturgy'], entry: {id: 'naturgy', progress: 0}, outgoingId: 'bbva', moving: true, retreat: 1});
  assert.deepEqual(visible(), []);
  update({order: ['bbva', 'naturgy'], entry: {id: 'naturgy', progress: .3}, outgoingId: 'bbva', moving: true, retreat: 1});
  assert.deepEqual(visible(), ['naturgy']);
  assert.deepEqual(current(), []);
  update({order: ['bbva', 'naturgy'], entry: {id: 'naturgy', progress: 1}, retreat: 1});
  assert.deepEqual(visible(), ['naturgy']);
  assert.deepEqual(current(), ['naturgy']);
});

test('a settled pass retains its bounded pile but travel exposes only the actual outgoing client', () => {
  const {update, visible, current} = setup();
  const order = ['bbva', 'naturgy', 'sabadell'];
  for (const id of order) update({order, entry: {id, progress: 1}, retreat: 1});
  assert.deepEqual(visible(), order);
  update({order: [...order, 'cepsa'], entry: {id: 'cepsa', progress: .3}, outgoingId: 'sabadell', moving: true, retreat: 1});
  assert.deepEqual(visible(), ['sabadell', 'cepsa']);
  assert.deepEqual(current(), ['sabadell']);
});

test('manual counters follow the remaining itinerary and hidden layers cannot receive focus', () => {
  const {controller, update, deck, cards, visible, current} = setup();
  const tour = {order: ['cepsa'], entry: {id: 'cepsa', progress: 1}, manualId: 'cepsa', routeLength: 1, retreat: 1};
  update(tour);
  assert.equal(cards.cepsa.querySelector('.tour-card-count').textContent, '01 / 01');
  update({...tour, routeLength: 2});
  assert.equal(cards.cepsa.querySelector('.tour-card-count').textContent, '01 / 02');
  update(tour, false);
  assert.deepEqual(visible(), []);
  assert.deepEqual(current(), []);
  assert.equal(deck.style.visibility, 'hidden');
  assert.ok(Object.values(cards).every(card => card.inert && card.attributes['aria-hidden'] === 'true'));
  update(tour);
  controller.hide();
  assert.deepEqual(visible(), []);
  assert.deepEqual(current(), []);
  assert.ok(Object.values(cards).every(card => card.inert));
});

test('navigation and deck agree after reverse to Puntoes and two quick new swipes', () => {
  const {controller, visible, current} = setup();
  const navigation = createMobileTourNavigation();
  const geometry = mobileTourGeometry({top: 5200, viewport: 844});
  const layout = {width: 844 * 941 / 1672 * 1.04, height: 844 * 1.04, viewportWidth: 390, viewportHeight: 844};
  const state = mobileTourState({scroll: geometry.revealed, geometry});
  const frame = now => {
    const tour = navigation.update(state, {scroll: geometry.revealed, now, layout, geometry});
    controller.update(state, true, tour);
    return tour;
  };
  let now = 0;
  frame(now);
  for (const direction of [1, 1, -1, -1]) {
    assert.ok(navigation.step(direction, {now}));
    now += mobileTourTiming.maxTravel + 10;
    frame(now);
  }
  assert.equal(navigation.getState().currentId, 'puntoes');
  assert.deepEqual(visible(), []);
  assert.ok(navigation.step(1, {now}));
  now += 200;
  frame(now);
  assert.deepEqual(visible(), ['bbva']);
  assert.ok(navigation.step(1, {now}), 'a fresh gesture can interrupt BBVA');
  frame(now + 200);
  assert.deepEqual(visible(), ['naturgy']);
  frame(now + mobileTourTiming.maxTravel + 10);
  assert.deepEqual(current(), ['naturgy']);
  assert.deepEqual(visible(), ['naturgy'], 'interrupted BBVA does not return as a settled historical layer');
});

test('historical invitation counters stay valid when the remaining route shrinks', () => {
  const {update, cards} = setup();
  const count = id => cards[id].querySelector('.tour-card-count').textContent;
  update({order: ['bbva', 'naturgy', 'collaborate'], entry: {id: 'collaborate', progress: 1}, routeLength: 4, retreat: 1});
  assert.equal(count('collaborate'), '04 / 04');
  update({order: ['bbva', 'collaborate', 'naturgy'], entry: {id: 'naturgy', progress: 1}, routeLength: 3, retreat: 1});
  assert.equal(count('naturgy'), '02 / 03');
  assert.equal(count('collaborate'), '04 / 04', 'the previous invitation cannot become 04 / 03');
  update({order: ['cepsa', 'collaborate'], entry: {id: 'collaborate', progress: 1}, manualId: 'cepsa', routeLength: 2, retreat: 1});
  assert.equal(count('collaborate'), '02 / 02');
  update({order: ['collaborate', 'cepsa'], entry: {id: 'cepsa', progress: 1}, manualId: 'cepsa', routeLength: 1, retreat: 1});
  assert.equal(count('cepsa'), '01 / 01');
  assert.equal(count('collaborate'), '02 / 02');
});
