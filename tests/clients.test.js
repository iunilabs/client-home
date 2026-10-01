import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clients} from '../src/clients.js';
test('las marcas tienen fuente y una alternativa HTML idéntica, sin clientes inventados',()=>{
 const source=JSON.parse(readFileSync(new URL('../docs/clientes/FUENTES.json',import.meta.url)));
 assert.equal(clients.length,9);assert.deepEqual(clients.map(c=>c.id),source.clients.map(c=>c.id));
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const c of clients)assert.ok(html.includes(`alt="${c.name}"`));
});
