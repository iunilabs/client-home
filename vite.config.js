import { defineConfig } from 'vite';
import {SKIN_ASSETS} from './src/skin-assets.js';
import {readFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

// If skin sources change, retain the original calculation until the baked
// field is regenerated; never use stale colour corrections in production.
let skinCacheValid=false;
try{const baked=JSON.parse(readFileSync(new URL('./public'+SKIN_ASSETS.seams,import.meta.url),'utf8'));skinCacheValid=Object.entries(baked.sourceHashes??{}).length>0&&Object.entries(baked.sourceHashes).every(([path,hash])=>createHash('sha256').update(readFileSync(new URL(path,import.meta.url))).digest('hex')===hash)}catch{}
if(!skinCacheValid)console.warn('Baked skin field unavailable or outdated; original seam calculation will be used.');

let outputDirectory;
export default defineConfig({
  define:{__SKIN_CACHE_VALID__:JSON.stringify(skinCacheValid)},
  plugins:[{name:'omit-original-asset-copies',apply:'build',configResolved(config){outputDirectory=resolve(config.root,config.build.outDir)},closeBundle(){
    // Keep originals in public for editing and regeneration, but do not ship
    // the superseded copies. Active models, texture versions and licences stay.
    for(const path of ['fonts/DMSerifDisplay-Regular.ttf','fonts/DMSerifDisplay-Italic.ttf','fonts/Manrope.ttf','models/zero/human_hand_1.glb','models/zero/fancy_hand_2.glb','textures/mano/skin-atlas-v2.png','textures/mano/skin-atlas-v3.png','textures/mano/zero-skin-albedo-v1.png','textures/mano/zero-skin-albedo-v2.png','textures/mano/zero-skin-albedo-v3.png','textures/mano/zero-skin-albedo-v4.png','textures/mano/forearm-albedo-v1.png','textures/mano/zero-skin-albedo-v4-lossless.webp','textures/mano/skin-seams-v1.json','textures/mano/zero-skin-albedo-v4-web-q90.webp','textures/mano/zero-skin-albedo-v4-web-q98.webp','textures/mano/forearm-albedo-v1-web-q90.webp','textures/mano/forearm-albedo-v1-web-q98.webp'])if(!Object.values(SKIN_ASSETS).includes('/'+path))rmSync(resolve(outputDirectory,path),{force:true});
  }}],
  build: { rolldownOptions: { input: ['index.html', 'modelos.html', 'mano.html'] } },
});
