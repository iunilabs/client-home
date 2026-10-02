import {clients} from '../clients.js';
import sabadellLogo from './assets/sabadell.svg';
import accentureLogo from './assets/logos/accenture.svg';
import bbvaLogo from './assets/logos/bbva.svg';
import canalLogo from './assets/logos/canal.svg';
import cepsaLogo from './assets/logos/cepsa.svg';
import mapfreLogo from './assets/logos/mapfre.svg';
import mediasetLogo from './assets/logos/mediaset.png';
import reeLogo from './assets/logos/ree.svg';
import siemensLogo from './assets/logos/siemens.svg';
import naturgyLogo from './assets/logos/naturgy.svg';
import telefonicaLogo from './assets/logos/telefonica.svg';
import indraLogo from './assets/logos/indra.svg';
import allianzLogo from './assets/logos/allianz.svg';

const logos = {accenture: accentureLogo, bbva: bbvaLogo, canal: canalLogo,
  cepsa: cepsaLogo, mapfre: mapfreLogo, mediaset: mediasetLogo,
  ree: reeLogo, siemens: siemensLogo, naturgy: naturgyLogo};

// Additional organizations published in Puntoes' client list. Map-only additions
// keep the accepted section-one logo composition and mobile itinerary intact.
export const additionalCityClients = [
  {id: 'telefonica', name: 'Telefónica', image: telefonicaLogo, clean: true},
  {id: 'indra', name: 'Indra', image: indraLogo, clean: true},
  {id: 'allianz', name: 'Allianz', image: allianzLogo, clean: true}
];

export const cityClients = [
  ...clients.map(client => ({...client, image: logos[client.id], clean: true})),
  {id: 'sabadell', name: 'Banco Sabadell', image: sabadellLogo, clean: true},
  ...additionalCityClients
];
