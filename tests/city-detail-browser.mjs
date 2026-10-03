import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=(process.env.CITY_DETAIL_URL||'http://127.0.0.1:4392/client-home/').replace(/\/?$/,'/');
const out=process.env.CITY_DETAIL_OUT||'/tmp/puntoes-city-details';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const report={passed:false,views:[]};
const detailRequest=request=>/puntoes-city-mobile-.*-detail-v\d+.*\.webp/.test(request.url());
try{
 const desktop=await browser.newPage({viewport:{width:1440,height:900}}),desktopRequests=[];
 desktop.on('request',r=>{if(detailRequest(r))desktopRequests.push(r.url());});
 await desktop.goto(base+'?city=.5');
 await desktop.waitForFunction(()=>window.__puntoes?.getState().city?.ready);
 await desktop.waitForTimeout(300);
 assert.deepEqual(desktopRequests,[],'desktop never downloads mobile detail tiles');
 await desktop.close();
 for(const [width,height] of [[320,568],[390,844],[430,932]].filter(([w])=>!process.env.CITY_DETAIL_PHONE||w===Number(process.env.CITY_DETAIL_PHONE))){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[],failed=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))failed.push(r.url());});
  page.on('request',r=>{if(detailRequest(r))requests.push(r.url());});
  await page.goto(base+'?city=0');
  await page.waitForFunction(()=>window.__puntoes?.getState().city?.ready&&window.__puntoes.getState().tour.active);
  const ids=await page.locator('.city-client').evaluateAll(nodes=>nodes.map(n=>n.dataset.client));
  assert.equal(ids.length,13);
  const tiles=[];
  for(const id of ['puntoes',...ids]){
   if(id!=='puntoes'){
    const button=page.locator(`.city-client[data-client="${id}"]`);
    await button.focus();await button.tap({noWaitAfter:true});
   }
   await page.waitForFunction(id=>{const s=window.__puntoes.getState().tour;return s.currentId===id&&!s.moving;},id);
   await page.waitForFunction(id=>{const t=document.querySelector(`.city-detail[data-client="${id}"]`);return t?.complete&&t.naturalWidth>0&&Number(t.style.opacity)>.99;},id);
   const tile=await page.locator(`.city-detail[data-client="${id}"]`).evaluate(t=>({id:t.dataset.client,width:t.naturalWidth,height:t.naturalHeight}));
   assert.ok(tile.width>500&&tile.height>500,'native high resolution details remain available');tiles.push(tile);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  const before=requests.length;
  const bbva=page.locator('.city-client[data-client="bbva"]');await bbva.focus();await bbva.tap({noWaitAfter:true});
  await page.waitForFunction(()=>window.__puntoes.getState().tour.currentId==='bbva'&&!window.__puntoes.getState().tour.moving);
  assert.equal(requests.length,before,'revisiting a loaded client reuses its detail');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  report.views.push({width,height,tiles,requests:requests.length});
  console.log(`${width}: 14 hub/client details, reuse, no missing resources or JavaScript errors`);
  await context.close();
 }
 report.passed=true;
}finally{await writeFile(`${out}/REPORT.json`,JSON.stringify(report,null,2));await browser.close();}
