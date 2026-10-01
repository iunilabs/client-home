import {SKIN_ASSETS} from './skin-assets.js';
import {assetUrl} from './asset-url.js';
// Include every attribute sampled by seam matching. A changed mesh falls back
// to the original calculation rather than applying stale baked corrections.
export function skinGeometryKey(geometry){
 let hash=2166136261;
 for(const name of ['position','uv','skinCreaseArea','fingerPadMask','fingerPadUv']){
  const attribute=geometry.attributes[name];if(!attribute)continue;
  const bytes=new Uint8Array(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength);
  for(const byte of bytes){hash^=byte;hash=Math.imul(hash,16777619)}
 }
 return (hash>>>0).toString(16).padStart(8,'0');
}
let baked;
export async function bakedSkinSeams(geometry){
 if(typeof __SKIN_CACHE_VALID__!=='undefined'&&!__SKIN_CACHE_VALID__)return null;
 baked??=fetch(assetUrl(SKIN_ASSETS.seams)).then(r=>{if(!r.ok)throw new Error('No baked seam data');return r.json()}).catch(()=>null);
 const data=await baked;if(!data||data.key!==skinGeometryKey(geometry)||data.correction.length!==geometry.attributes.position.count*3)return null;
 return data;
}
