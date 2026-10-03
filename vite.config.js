import { defineConfig } from 'vite';
import {SKIN_ASSETS} from './src/skin-assets.js';
import {readFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {pages,siteHeader,siteFooter} from './src/site/templates.js';

// If skin sources change, retain the original calculation until the baked
// field is regenerated; never use stale colour corrections in production.
let skinCacheValid=false;
try{const baked=JSON.parse(readFileSync(new URL('./public'+SKIN_ASSETS.seams,import.meta.url),'utf8'));skinCacheValid=Object.entries(baked.sourceHashes??{}).length>0&&Object.entries(baked.sourceHashes).every(([path,hash])=>createHash('sha256').update(readFileSync(new URL(path,import.meta.url))).digest('hex')===hash)}catch{}
if(!skinCacheValid)console.warn('Baked skin field unavailable or outdated; original seam calculation will be used.');

export default defineConfig(({mode})=>{
const studies=mode==='studies';
let outputDirectory;
let siteBase='/';
const commercialEntries=['index.html',...pages.map(([slug])=>`${slug}/index.html`)];
return {
  define:{__SKIN_CACHE_VALID__:JSON.stringify(skinCacheValid)},
  plugins:[{name:'shared-site-navigation',configResolved(config){siteBase=config.base},transformIndexHtml:{order:'pre',handler(html,ctx){
    const current=pages.find(([slug])=>ctx.filename.endsWith(`/${slug}/index.html`))?.[0]??'';
    return html.replace('<!--site-header-->',siteHeader(current,siteBase)).replace('<!--site-footer-->',siteFooter(siteBase));
  }}},...(studies?[]:[{name:'commercial-public-assets',apply:'build',configResolved(config){outputDirectory=resolve(config.root,config.build.outDir)},closeBundle(){
    // Fail the build if an approved resource is missing; never publish a
    // partially copied set. The development server still serves all studies.
    const {files}=JSON.parse(readFileSync(new URL('./production-assets.json',import.meta.url),'utf8'));
    for(const path of files){const target=resolve(outputDirectory,path);mkdirSync(dirname(target),{recursive:true});copyFileSync(new URL('./public/'+path,import.meta.url),target)}
  }}])],
  build: { manifest:true,copyPublicDir:studies,rolldownOptions: { input: studies?[...commercialEntries,'modelos.html','mano.html']:commercialEntries } },
};
});
