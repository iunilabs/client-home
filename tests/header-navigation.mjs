import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';

const base=process.env.HEADER_URL||'http://127.0.0.1:4392/client-home/';
const engines=[['Chrome',chromium,{channel:'chrome'}]];
if(process.env.HEADER_WEBKIT)engines.push(['WebKit',webkit,{}]);
for(const [name,engine,options] of engines){
 const browser=await engine.launch({headless:true,...options});
 try{
  for(const [source,target] of [['','consultoria/'],['formacion/','ia-automatizacion/']]){
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const sourceURL=new URL(source,base).href,targetURL=new URL(target,base).href;
   await page.goto(sourceURL);
   const menu=page.locator('#header-mobile-menu'),toggle=page.locator('.header-menu-toggle');
   await toggle.tap();await menu.waitFor({state:'visible'});
   const link=menu.locator(`a[href="${new URL(targetURL).pathname}"]`);
   // A cancelled click must not enter navigation state.
   await link.evaluate(node=>node.addEventListener('click',event=>event.preventDefault(),{once:true}));
   await link.click();assert.equal(await menu.evaluate(node=>node.open),true);assert.equal(await menu.getAttribute('aria-busy'),null);
   let release,arrived;
   const gate=new Promise(resolve=>{release=resolve}),request=new Promise(resolve=>{arrived=resolve});
   let capture;
   const selected=new Promise(resolve=>{capture=resolve});
   await page.exposeFunction('captureMenuSelection',capture);
   await page.evaluate(()=>document.addEventListener('click',()=>{const menu=document.querySelector('#header-mobile-menu');window.captureMenuSelection({open:menu.open,display:getComputedStyle(menu).display,closing:menu.classList.contains('is-closing'),busy:menu.getAttribute('aria-busy'),selected:menu.querySelectorAll('a.is-navigating').length})},{once:true}));
   await page.route(targetURL,async route=>{arrived();await gate;await route.continue()});
   const clicking=link.click();await request;
   // Capture after the menu handler, before native navigation pauses the old
   // document's JavaScript. The destination remains blocked until this check.
   const pending=await selected;
   assert.deepEqual(pending,{open:true,display:'flex',closing:false,busy:'true',selected:1},'old page stays covered while the next document loads');
   release();await clicking;await page.waitForURL(targetURL);await page.locator('h1').waitFor();
   assert.equal(await menu.evaluate(node=>node.open),false);assert.equal(await menu.getAttribute('aria-busy'),null);
   await page.unroute(targetURL);await page.goBack();await page.waitForURL(sourceURL);
   assert.equal(await menu.evaluate(node=>node.open),false);assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await menu.locator('a.is-navigating').count(),0);
   await toggle.tap();await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});
   if(!source){
    await toggle.tap();await menu.locator('a').first().evaluate(node=>{node.href=location.href.split('#')[0]+'#contacto'});
    await menu.locator('a').first().click();await menu.waitFor({state:'hidden'});await page.waitForURL(url=>url.hash==='#contacto');
    assert.equal(await menu.getAttribute('aria-busy'),null,'local anchors close normally');
   }
   assert.deepEqual(errors,[]);console.log(`PASS ${name} ${source||'home'}: delayed navigation stays covered, feedback, destination, back, close and local anchors`);
   await page.close();
  }
 }finally{await browser.close()}
}
