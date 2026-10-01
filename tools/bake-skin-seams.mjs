import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SKIN_ASSETS} from '../src/skin-assets.js';
import {skinGeometryKey} from '../src/skin-cache.js';
const source=JSON.parse(await readFile(process.argv[2]??'docs/performance-2026-10-01/seam-source.json','utf8'));
const geometry={attributes:Object.fromEntries(Object.entries(source.attributes).map(([name,array])=>[name,{array:new Float32Array(array)}]))};
const sourceHashes={};for(const path of ['src/skin-continuity.js','src/reference-hand.js','src/human-skin.js','src/ventral-skin.js','src/textured-skin-geometry.js','src/skin-assets.js','src/hand-nails.js','public'+SKIN_ASSETS.albedo,'public'+SKIN_ASSETS.forearm])sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await writeFile('public'+SKIN_ASSETS.seams,JSON.stringify({sourceHashes,key:skinGeometryKey(geometry),seams:source.seams,correction:source.correction}));
console.log('Skin seams baked',skinGeometryKey(geometry));
