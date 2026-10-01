import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clients,clientPresentation,worldProgress} from '../src/clients.js';
test('las marcas tienen fuente y una alternativa HTML idéntica, sin clientes inventados',()=>{
 const source=JSON.parse(readFileSync(new URL('../docs/clientes/FUENTES.json',import.meta.url)));
 assert.equal(clients.length,9);assert.deepEqual(clients.map(c=>c.id),source.clients.map(c=>c.id));
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const c of clients)assert.ok(html.includes(`alt="${c.name}"`));
});
test('en móvil se pueden ver todas las marcas con scroll reversible y sin esperar',()=>{
 const marks=new Set();for(const p of [12.26,12.50,12.77])for(const id of clientPresentation(p,true).shown)marks.add(id);
 assert.equal(marks.size,9);assert.equal(clientPresentation(12.48,true,true).shown.length,9);
 const before=clientPresentation(12.26,true);clientPresentation(13.1,true);assert.deepEqual(clientPresentation(12.26,true),before);
});
test('el capítulo añadido conserva las acciones anteriores y llega al cierre sin saltos',()=>{
 for(const p of [0,5.74,6.92,11.4])assert.equal(worldProgress(p),p);
 for(const boundary of [12,13])assert.ok(Math.abs(worldProgress(boundary+.00001)-worldProgress(boundary-.00001))<.00002);
 assert.equal(worldProgress(14),13);assert.equal(clientPresentation(13.2).visible,false);
});
