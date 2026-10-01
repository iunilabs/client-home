import sharp from '../../reference-assets/prehistoric-stones/flint-core/tools/node_modules/sharp/dist/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const report=[];
for(const name of ['zero-skin-albedo-v4','forearm-albedo-v1']){
 const input=await readFile(`public/textures/mano/${name}.png`),original=await sharp(input).ensureAlpha().raw().toBuffer();
 for(const quality of [90,95,98]){
  const encoded=await sharp(input).webp({quality,effort:6,smartSubsample:true}).toBuffer(),decoded=await sharp(encoded).ensureAlpha().raw().toBuffer();let sum=0,n=0;for(let i=0;i<original.length;i+=4){if(original[i]+original[i+1]+original[i+2]<48)continue;for(let c=0;c<3;c++){sum+=(original[i+c]-decoded[i+c])**2;n++}}
  const output=`public/textures/mano/${name}-web-q${quality}.webp`;await writeFile(output,encoded);report.push({name,quality,bytes:encoded.length,psnr:10*Math.log10(255**2/(sum/n)),output});
 }
}
await mkdir('docs/performance-visual-2026-10-01',{recursive:true});await writeFile('docs/performance-visual-2026-10-01/texture-candidates.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
