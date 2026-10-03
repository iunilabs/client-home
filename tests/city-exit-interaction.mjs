import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.CITY_EXIT_URL||'http://127.0.0.1:4330/';
const out=process.env.CITY_EXIT_OUT||'docs/desktop-exit-interaction';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={passed:false,views:[],errors:[]};
try {
  for(const [width,height,exit] of [[1424,873,120],[900,600,80]]) {
    const page=await browser.newPage({viewport:{width,height}});
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(base+'?city=.85');
    await page.waitForFunction(()=>window.__puntoes?.getState().city?.ready&&!document.querySelector('.city-carousel').inert);
    const end=await page.locator('#posibilidades').evaluate(el=>el.offsetTop-innerHeight);
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),end+exit);
    await page.waitForTimeout(250);
    const before=await page.evaluate(()=>({y:scrollY,zoom:window.__puntoes.getState().city.focus.camera.zoom}));
    const logo=page.locator('.city-client[data-client="bbva"]');
    await logo.focus();await logo.click();
    await page.waitForFunction(()=>{const f=window.__puntoes.getState().city.focus;return f?.client==='bbva'&&!f.moving},{},{timeout:6000});
    await page.waitForTimeout(150);
    const card=page.locator('.city-tour-card.is-current');
    assert.equal(await card.getAttribute('data-client'),'bbva','logo opens a persistent card during exit');
    const after=await page.evaluate(()=>({y:scrollY,focus:window.__puntoes.getState().city.focus,held:window.__puntoes.getState().endGuard.held}));
    assert.ok(Math.abs(after.y-before.y)<2,'selection does not move or lock document scroll');
    assert.equal(after.focus.camera.zoom,before.zoom,'selection does not zoom');assert.equal(after.held,false);
    const close=card.locator('.tour-card-close');
    const closeBox=await close.boundingBox();assert.ok(closeBox.y>=82,'close control remains below the header');
    await close.click();await page.waitForFunction(()=>!document.querySelector('.city-tour-card.is-current'));
    // Use an actual visible roof point, not a programmatically dispatched click.
    const roof=await page.locator('.city-pin').evaluateAll(nodes=>nodes.find(el=>{
      const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return !el.inert&&hit?.closest('.city-pin')===el;
    })?.closest('.city-building').dataset.client);
    assert.ok(roof,'there is a clickable roof point in the remaining map');
    await page.locator(`.city-building[data-client="${roof}"] .city-pin`).click();
    await page.waitForFunction(id=>{const f=window.__puntoes.getState().city.focus;return f?.client===id&&!f.moving},roof,{timeout:6000});
    assert.equal(await card.getAttribute('data-client'),roof,'roof opens a persistent card during exit');
    await page.screenshot({path:`${out}/desktop-${width}-exit.png`});
    report.views.push({width,height,exit,roof,before,after});
    // Leaving the entire map closes the card and leaves the next section usable.
    await page.mouse.wheel(0,height+200);
    await page.waitForFunction(end=>scrollY>end+innerHeight,end);
    await page.waitForFunction(()=>!document.querySelector('.city-tour-card.is-current'));
    assert.equal(await page.evaluate(()=>window.__puntoes.getState().endGuard.held),false);
    await page.close();
  }
  assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report));
} catch(e){report.error=e.stack;console.error(e);process.exitCode=1}
finally {await fs.writeFile(`${out}/REPORT.json`,JSON.stringify(report,null,2));await browser.close()}
