import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {SKIN_ASSETS} from '../src/skin-assets.js';

const root=resolve(import.meta.dirname,'..');
const {files}=JSON.parse(readFileSync(resolve(root,'production-assets.json'),'utf8'));

test('the production inventory covers local resources used by the landing',()=>{
  const approved=new Set(files);
  assert.equal(approved.size,files.length);
  for(const path of files){assert.ok(!path.startsWith('/')&&!path.split('/').includes('..'));assert.ok(existsSync(resolve(root,'public',path)),path);}
  const html=readFileSync(resolve(root,'index.html'),'utf8');
  const pending=[{path:resolve(root,'index.html'),text:html}],seen=new Set();
  while(pending.length){
    const {path,text}=pending.pop();if(seen.has(path))continue;seen.add(path);
    for(const match of text.matchAll(/["\'`(]\/(?:fonts|images|clients|textures|models|licenses|decoders)\/[\w./-]+\.[\w]+/g))
      assert.ok(approved.has(match[0].slice(2)),`${path}: ${match[0]}`);
    const imports=[...text.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)["']([^"']+)["']/g)].map(m=>m[1]);
    if(path.endsWith('.html'))imports.push(...[...text.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)].map(m=>m[1]));
    for(const source of imports){
      if(!source.startsWith('.')&&!source.startsWith('/src/'))continue;
      const next=source.startsWith('/')?resolve(root,source.slice(1)):resolve(dirname(path),source);
      if(existsSync(next))pending.push({path:next,text:readFileSync(next,'utf8')});
    }
  }
  for(const path of Object.values(SKIN_ASSETS))assert.ok(approved.has(path.slice(1)),path);
  // The shared hand loader also chooses these paths dynamically.
  for(const file of ['human_hand_1-web.glb','fancy_hand_2-web.glb'])assert.ok(approved.has(`models/zero/${file}`));
});
