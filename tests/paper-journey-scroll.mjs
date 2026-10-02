import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const origin=process.env.SECTION3_URL || 'http://127.0.0.1:4318/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'?paper=.99&capture=1');
  await page.waitForFunction(()=>window.__puntoes?.getState().paper?.progress>.989);
  assert.equal(await page.locator('section[data-paper-journey]').count(),1);
  assert.equal(await page.locator('[data-paper-journey] section,.paper-chapters,section#resolucion').count(),0);
  assert.equal(await page.evaluate(()=>window.__puntoes.getState().paper.journey.chaosRange),1900,'ordering starts at 1900px');
  assert.equal(await page.evaluate(()=>window.__puntoes.getState().paper.groupProgress),0,'no right-hand grouping phase');
  const before=await page.evaluate(()=>{
    window.__journeyCanvas=document.querySelector('[data-paper-canvas]');
    return {y:scrollY,meter:Number(document.querySelector('[data-scroll-number]').textContent),subjects:window.__puntoes.getPaperReview().map(card=>card.subject)};
  });
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.synthesizeScrollGesture',{gestureSourceType:'touch',x:195,y:650,yDistance:-450,speed:1400,preventFling:true});
  await page.waitForFunction(y=>scrollY>y+400,before.y);
  await page.waitForFunction(()=>window.__puntoes.getState().paper.resolution.ordered>.1);
  const after=await page.evaluate(()=>({meter:Number(document.querySelector('[data-scroll-number]').textContent),subjects:window.__puntoes.getPaperReview().map(card=>card.subject),sameCanvas:document.querySelector('[data-paper-canvas]')===window.__journeyCanvas}));
  assert.ok(after.meter>before.meter,'the meter continues instead of resetting at the seam');
  assert.deepEqual(after.subjects,before.subjects); assert.equal(after.sameCanvas,true);
  assert.equal(await page.evaluate(()=>window.__puntoes.getState().paper.groupProgress),0);
  assert.equal(await page.locator('#chapter-count').textContent(),'03 / 03');
  await cdp.send('Input.synthesizeScrollGesture',{gestureSourceType:'touch',x:195,y:230,yDistance:550,speed:1400,preventFling:true});
  await page.waitForFunction(()=>window.__puntoes.getState().paper.resolution.progress===0);
  assert.ok(await page.evaluate(()=>window.__puntoes.getState().paper.progress<1));
  // Old resolution links still point into the same section, rather than a
  // second scroll container or a reinitialised scene.
  await page.goto(origin+'#resolucion');
  await page.waitForFunction(()=>window.__puntoes?.getState().paper?.active);
  assert.ok(await page.evaluate(()=>{
    const j=window.__puntoes.getState().paper.journey;
    return Math.abs(scrollY-j.start-j.chaosRange)<2&&!window.__puntoes.getState().tour.active;
  }));
  assert.deepEqual(errors,[]);
  console.log('One native swipe crosses chaos→ordering; reverse, continuous meter, same 47 papers and legacy anchor passed');
}catch(error){console.error(error);process.exitCode=1;}
finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);process.exit(process.exitCode||0);}
