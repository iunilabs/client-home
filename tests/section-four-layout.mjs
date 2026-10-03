import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.SECTION4_URL||'http://127.0.0.1:4392/client-home/';
const output=process.env.SECTION4_OUTPUT||'/tmp/puntoes-workflow-ux';
await mkdir(output,{recursive:true});
const report=[];
const engines=[['Chrome',chromium,{channel:'chrome'},[[1440,900],[390,844],[320,568],[844,390]]]];
if(process.env.WORKFLOW_WEBKIT)engines.push(['WebKit',webkit,{},[[390,844]]]);
for(const [name,engine,options,sizes] of engines){
 const browser=await engine.launch({headless:true,...options});
 try{
  for(const [width,height] of sizes){
   const page=await browser.newPage({viewport:{width,height},isMobile:width<1100,hasTouch:width<1100}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'?resolution=.34&capture=1');
   await page.waitForFunction(()=>window.__puntoes?.getState().paper?.prepared,null,{timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   const at=async progress=>{
    await page.evaluate(p=>{const j=window.__puntoes.getState().paper.journey;scrollTo(0,j.start+j.chaosRange+j.workflowRange*p)},progress);
    await page.waitForFunction(p=>Math.abs(window.__puntoes.getState().paper.resolution.progress-p)<.001,progress);
    await page.waitForTimeout(350);
   };
   const state=()=>page.evaluate(()=>window.__puntoes.getState().paper);
   await at(.08);
   const ordered=await state();assert.equal(ordered.totalItems,47);assert.equal(ordered.resolution.exampleCount,3);assert.equal(ordered.preparation.completedTextures,0);
   const cards=await page.evaluate(()=>window.__puntoes.getPaperReview().filter(card=>card.visible));
   for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){
    const overlaps=[0,1,2].every(axis=>Math.min(cards[i].max[axis],cards[j].max[axis])-Math.max(cards[i].min[axis],cards[j].min[axis])>.001);
    assert.equal(overlaps,false,'original papers keep their separate physical lanes while fading');
   }
   const snapshots=[];
   for(const [progress,id] of [[.34,'correo'],[.54,'documento'],[.74,'incidencia']]){
    await at(progress);assert.equal(await page.locator('[data-routing-case]:visible').getAttribute('data-routing-case'),id);
    assert.equal((await state()).visibleItems,0,'the 47 papers leave together, without a processing queue');
    assert.equal(await page.locator('[data-pending-count],[data-workflow-total],[data-route-count]').count(),0);
    assert.equal(await page.locator('.routing-case:visible .routing-after').evaluate(n=>Number(getComputedStyle(n).opacity)),1);
    const layout=await page.evaluate(()=>{
     const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
     const panel=document.querySelector('.routing-case:not([hidden])');
     return {viewport:{width:innerWidth,height:innerHeight},steps:rect(document.querySelector('.routing-steps')),before:rect(panel.querySelector('.routing-before')),after:rect(panel.querySelector('.routing-after')),overflow:[...panel.querySelectorAll('h3,p,li')].filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.textContent)};
    });
    assert.deepEqual(layout.overflow,[],'card copy fits');
    for(const box of [layout.before,layout.after]){assert.ok(box.left>=10&&box.right<=width-10,'card stays inside viewport');assert.ok(box.top>=layout.steps.bottom+4,'cards clear the heading and steps');assert.ok(box.bottom<=height-10,'cards remain above the bottom edge');}
    if(width<700)assert.ok(layout.after.top>=layout.before.bottom+10,'stacked cards do not intersect');
    else assert.ok(layout.after.left>layout.before.right,'side-by-side cards do not intersect');
    snapshots.push(layout);await page.screenshot({path:`${output}/${name}-${width}-${id}.png`});
   }
   await page.locator('[data-example-select="0"]').click();await page.waitForFunction(()=>window.__puntoes.getState().paper.resolution.exampleIndex===0);await page.locator('[data-example-select="1"]').click();await page.waitForFunction(()=>window.__puntoes.getState().paper.resolution.exampleIndex===1);assert.equal(await page.locator('[data-example-select="1"]').getAttribute('aria-pressed'),'true');
   await at(.54);assert.equal(await page.locator('[data-routing-case]:visible').getAttribute('data-routing-case'),'documento');
   await at(.95);assert.equal((await state()).resolution.completed,3);assert.equal(await page.locator('.routing-story').isVisible(),false);
   const cta=page.locator('[data-workflow-cta]');assert.equal(await cta.isVisible(),true);assert.equal(await cta.evaluate(n=>n.closest('[inert]')),null);
   const box=await cta.boundingBox();assert.ok(box.y+box.height<height-10,'contact action stays visible');
   await page.screenshot({path:`${output}/${name}-${width}-conclusion.png`});
   const journey=(await state()).journey;assert.ok(Math.abs(journey.workflowRange-height*1.25)<4,'shorter continuous range');
   await cta.click();await page.waitForFunction(()=>Math.abs(scrollY-Math.min(document.querySelector('#contacto').offsetTop,document.documentElement.scrollHeight-innerHeight))<5);assert.equal(new URL(page.url()).hash,'#contacto');assert.equal(await page.locator('[data-contact-form]').isVisible(),true);await page.waitForFunction(()=>!window.__puntoes.getState().scroll.moving);
   await page.evaluate(()=>{const j=window.__puntoes.getState().paper.journey;scrollTo(0,j.start+j.chaosRange*.1)});
   await page.waitForFunction(()=>Math.abs(window.__puntoes.getState().paper.progress-.1)<.001);
   assert.equal((await state()).visibleItems,1,'returning restores the first paper');
   assert.equal(await cta.isVisible(),false);
   assert.deepEqual(errors,[]);report.push({name,width,height,snapshots,passed:true});
   console.log(`PASS ${name} ${width}×${height}: three readable/selectable cases, collective fade, physical separation, reverse, conclusion, contact, continuous shorter scroll`);
   await page.close();
  }
 }finally{await browser.close()}
}
await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));

// The message and contact action remain usable with reduced motion or without WebGL.
const accessibleBrowser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const reduced=await accessibleBrowser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await reduced.goto(base+'?resolution=.34&capture=1');
 await reduced.waitForFunction(()=>window.__puntoes?.getState().paper?.prepared,null,{timeout:60000});
 assert.deepEqual(await reduced.locator('.routing-case:visible .routing-after').evaluate(n=>({opacity:getComputedStyle(n).opacity,translate:getComputedStyle(n).translate})),{opacity:'1',translate:'none'});
 await reduced.locator('[data-example-select="2"]').click();
 await reduced.waitForFunction(()=>window.__puntoes.getState().paper.resolution.exampleIndex===2);
 await reduced.close();
 const fallback=await accessibleBrowser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl/.test(type)?null:original.call(this,type,...args)}});
 await fallback.goto(base+'?resolution=.95&capture=1');
 await fallback.waitForFunction(()=>document.querySelector('.paper-journey')?.dataset.paperRender==='fallback'&&document.body.classList.contains('resolution-active'));
 const contact=fallback.locator('[data-workflow-cta]');
 assert.equal(await contact.isVisible(),true);assert.equal(await contact.evaluate(n=>n.closest('[inert]')),null);
 await contact.click();
 await fallback.waitForFunction(()=>Math.abs(scrollY-Math.min(document.querySelector('#contacto').offsetTop,document.documentElement.scrollHeight-innerHeight))<5);
 assert.equal(new URL(fallback.url()).hash,'#contacto');
 await fallback.close();
 console.log('PASS reduced motion and WebGL fallback: readable results, selectable examples and usable contact');
}finally{await accessibleBrowser.close()}
