import {navigateByHash} from './navigate-by-hash.mjs';
// Fast focused regression checks for the final fragment/resize/reduced patch.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.MOBILE_SCROLL_URL || 'http://127.0.0.1:4314/client-home/';
const out=process.env.MOBILE_SCROLL_OUT || 'docs/mobile-snap-2026-10-02';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={url:base,passed:false,checks:[]};
try {
  for(const reducedMotion of ['no-preference','reduce']) {
    const context=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,isMobile:true,reducedMotion});
    const page=await context.newPage();
    await page.goto(base+'#confianza');await page.waitForFunction(()=>window.__puntoes?.getState().tour.active);
    await page.waitForTimeout(3300);
    assert.ok(await page.evaluate(()=>window.__puntoes.getState().tour.active));
    await page.locator('body').click({position:{x:160,y:180}});await page.keyboard.press('ArrowDown');
    await page.waitForFunction(()=>window.__puntoes.getState().tour.currentId==='bbva'&&!window.__puntoes.getState().tour.moving);
    assert.equal(await page.locator('.city-tour-card.is-current').getAttribute('data-client'),'bbva');
    assert.equal(await page.evaluate(()=>window.__puntoes.getState().tour.moving),false);
    const logo=page.locator('.city-client[data-client="cepsa"]');await logo.focus();await logo.tap();
    await page.waitForFunction(()=>window.__puntoes.getState().tour.currentId==='cepsa'&&!window.__puntoes.getState().tour.moving);
    assert.equal(await page.locator('.city-tour-card.is-current').getAttribute('data-client'),'cepsa');
    assert.equal(await page.evaluate(()=>window.__puntoes.getState().reduced),false);
    await page.setViewportSize({width:320,height:528});await page.waitForTimeout(200);
    await navigateByHash(page,'#confianza');await page.waitForTimeout(1400);
    assert.ok(await page.evaluate(()=>window.__puntoes.getState().tour.active));
    assert.equal(await page.evaluate(()=>window.__puntoes.getState().tour.currentId),'puntoes');
    await navigateByHash(page,'#encuentro');await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(()=>window.__puntoes.getState().tour.active),false);
    await page.goBack();await page.waitForFunction(()=>window.__puntoes.getState().tour.active);
    assert.equal(await page.evaluate(()=>window.__puntoes.getState().tour.active),true);
    await page.goForward();await page.waitForFunction(()=>!window.__puntoes.getState().tour.active);
    assert.equal(await page.evaluate(()=>window.__puntoes.getState().tour.active),false);
    report.checks.push({reducedMotion,coldFragment:true,swipeKeyboard:true,manualCepsa:true,smallHeightChapterAnchor:true,history:true,handsPreferencePreserved:true});
    await context.close();console.log(`PASS ${reducedMotion}: cold hash, city camera/card arrival, Cepsa, resized chapter link and history`);
  }
  report.passed=true;
}catch(error){report.error=error.stack;process.exitCode=1;console.error(error)}
finally{await fs.writeFile(`${out}/ACCESS-REPORT.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
