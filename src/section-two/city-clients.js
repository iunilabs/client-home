import {clients} from '../clients.js';
import {assetUrl} from '../asset-url.js';
import sabadellLogo from './assets/sabadell.svg';

// Original nine organizations plus Banco Sabadell, added at David's request.
export const cityClients = [
  ...clients.map(client => ({...client, image: assetUrl(client.image)})),
  {id: 'sabadell', name: 'Banco Sabadell', image: sabadellLogo}
];
