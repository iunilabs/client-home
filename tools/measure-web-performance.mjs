import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={environment:'Mac / Chromium headless / SwiftShader; 5 Mbps effective, 60 ms latency, CPU slowdown x4; cold caches. Not physical phone timings.',runs:[]};
try{
 for(const [name,url]of [['before','http://127.0.0.1:4182/'],['after','http://127.0.0.1:4183/'],['before','http://127.0.0.1:4182/'],['after','http://127.0.0.1:4183/']]){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:60,downloadThroughput:625000,uploadThroughput:625000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  let transferred=0;cdp.on('Network.loadingFinished',event=>transferred+=event.encodedDataLength);const t=Date.now();await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.body.dataset.render==='webgl',null,{timeout:120000});const ready=Date.now()-t,bytesAtReady=transferred;
  await page.waitForFunction(()=>window.__puntoes?.getState().scene,null,{timeout:120000});if(name==='after')await page.waitForFunction(()=>window.__puntoes.getState().scene.tools.every(t=>t.loaded));await page.waitForTimeout(1000);report.runs.push({name,readyMs:ready,bytesAtReady,bytesFull:transferred,scene:await page.evaluate(()=>{const s=window.__puntoes.getState().scene;return {handTriangles:s.handTriangles,renderScale:s.renderScale}})});console.log(name,ready,bytesAtReady,transferred);await context.close();
 }
}finally{await writeFile('docs/performance-visual-2026-10-01/load-measurement.json',JSON.stringify(report,null,2));await browser.close()}
