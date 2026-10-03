import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

// A slow module graph must never expose the browser's default HTML layout.
const base=process.env.PUNTOES_URL||'http://127.0.0.1:4180/';
const pages=[['',base]];
if(process.env.PUNTOES_STUDIES_URL)for(const path of ['mano.html','modelos.html'])pages.push([path,process.env.PUNTOES_STUDIES_URL]);
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
 for(const width of [390,1424])for(const [path,pageBase] of pages){
  const page=await browser.newPage({viewport:{width,height:873}});
  await page.addInitScript(()=>{
   window.firstPaintStyles=[];
   new PerformanceObserver(list=>{
    for(const entry of list.getEntries()){
     const heading=document.querySelector('h1');
     if(heading)window.firstPaintStyles.push({paint:entry.name,margin:getComputedStyle(document.body).margin,font:getComputedStyle(heading).fontFamily});
    }
   }).observe({type:'paint',buffered:true});
  });
  // CSS is also slow: the browser must wait for it before painting content.
  await page.route(/\.css(?:\?|$)/,async route=>{await new Promise(resolve=>setTimeout(resolve,300));await route.continue().catch(()=>{});});
  await page.route(/\.js(?:\?|$)/,async route=>{await new Promise(resolve=>setTimeout(resolve,3000));await route.abort().catch(()=>{});});
  await page.goto(new URL(path,pageBase).href,{waitUntil:'commit'});
  await page.waitForFunction(()=>window.firstPaintStyles.length>0);
  const paints=await page.evaluate(()=>window.firstPaintStyles);
  for(const paint of paints){assert.equal(paint.margin,'0px');assert.doesNotMatch(paint.font,/^Times/);}
  assert.ok(await page.locator('h1').isVisible());
  assert.equal(await page.locator('head link[rel="stylesheet"]').count(),1);
  console.log(`✓ Styled first paint before JavaScript: ${width}px /${path}`,paints);
  await page.close();
 }
 const noJS=await browser.newPage({javaScriptEnabled:false});
 await noJS.goto(base);
 assert.ok(await noJS.locator('h1').isVisible());
 assert.equal(await noJS.evaluate(()=>getComputedStyle(document.body).margin),'0px');
 console.log('✓ Styles and readable content without JavaScript');
}finally{await browser.close();}
