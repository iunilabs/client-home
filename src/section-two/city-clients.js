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

const logos = {accenture: accentureLogo, bbva: bbvaLogo, canal: canalLogo,
  cepsa: cepsaLogo, mapfre: mapfreLogo, mediaset: mediasetLogo,
  ree: reeLogo, siemens: siemensLogo, naturgy: naturgyLogo};

// Original nine organizations plus Banco Sabadell, added at David's request.
export const cityClients = [
  ...clients.map(client => ({...client, image: logos[client.id], clean: true})),
  {id: 'sabadell', name: 'Banco Sabadell', image: sabadellLogo, clean: true}
];
