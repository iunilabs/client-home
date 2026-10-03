import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.HEADER_URL||'http://127.0.0.1:4392/client-home/';
const out=process.env.HEADER_OUT||'/tmp/puntoes-header';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const labels=['Consultoría','IA y automatización','Formación','Clientes','Nosotros','Hablemos'];
try{
  for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[844,390],[1100,800],[1440,900]]){
    const mobile=width<1100;
    const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(()=>window.__puntoes);
    await page.evaluate(()=>document.fonts.ready);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const nav=page.locator(mobile?'#header-mobile-menu nav':'.header-desktop-nav');
    const toggle=page.locator('.header-menu-toggle');
    const dialog=page.getByRole('dialog',{name:'Menú de Puntoes'});
    assert.equal(await toggle.isVisible(),mobile);
    if(mobile){
      await toggle.tap();
      await dialog.waitFor({state:'visible'});
      await page.waitForTimeout(250);
      assert.equal(await toggle.getAttribute('aria-expanded'),'true');
      assert.equal(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');
      assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Cerrar menú');
      await page.keyboard.press('Shift+Tab');
      assert.ok(await page.evaluate(()=>document.activeElement.closest('#header-mobile-menu')));
    }
    assert.deepEqual(await nav.locator('a').evaluateAll(nodes=>nodes.map(n=>n.textContent.replace(/^\s*\d{2}/,'').replace('↗','').trim())),labels);
    const paths=['consultoria','ia-automatizacion','formacion','clientes','nosotros','hablemos'];
    assert.deepEqual(await nav.locator('a').evaluateAll(nodes=>nodes.map(n=>new URL(n.href).pathname)),paths.map(path=>new URL(base).pathname+path+'/'));
    for(const link of await nav.locator('a').all())assert.equal(await link.getAttribute('aria-disabled'),null);
    if([390,1440].includes(width)){
      if(mobile)await dialog.evaluate(element=>{element.scrollTop=0});
      await page.screenshot({path:`${out}/${width}-${mobile?'open':'desktop'}.png`});
    }
    if(mobile){
      await page.keyboard.press('Escape');
      await dialog.waitFor({state:'hidden'});
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      assert.equal(await toggle.evaluate(element=>document.activeElement===element),true);
      await page.mouse.wheel(0,300);
      await page.waitForFunction(()=>scrollY>50);
      await toggle.tap();
      await page.getByRole('button',{name:'Cerrar menú',exact:true}).tap();
      await dialog.waitFor({state:'hidden'});
      await toggle.tap();
      await page.setViewportSize({width:1280,height:800});
      await dialog.waitFor({state:'hidden'});
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      assert.equal(await page.locator('.header-desktop-nav').isVisible(),true);
      assert.ok(await page.evaluate(()=>getComputedStyle(document.body).overflow!=='hidden'));
    }
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}×${height}: layout, real navigation${mobile?', touch, focus, Escape, scroll recovery and resize':''}`);
    await context.close();
  }
  // The map remains held while its menu is open; closing restores its input.
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(base+'?city=0');
  await page.waitForFunction(()=>window.__puntoes?.getState().tour.active&&window.__puntoes.getState().city?.ready);
  await page.getByRole('button',{name:'Abrir menú'}).tap();
  await page.keyboard.press('ArrowDown');
  await page.mouse.wheel(0,300);
  assert.equal(await page.evaluate(()=>window.__puntoes.getState().tour.currentId),'puntoes');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog',{name:'Menú de Puntoes'}).waitFor({state:'hidden'});
  await page.touchscreen.tap(190,180);
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(()=>window.__puntoes.getState().tour.currentId==='bbva'&&!window.__puntoes.getState().tour.moving);
  console.log('PASS map: modal pauses background input and closing restores client navigation');
  await page.evaluate(()=>{window.__headerTestInstance=window.__puntoes});
  await page.locator('.header>.brand').tap();
  await page.waitForFunction(()=>scrollY<2&&!window.__puntoes.getState().tour.active);
  assert.equal(await page.evaluate(()=>window.__headerTestInstance===window.__puntoes),true,'the homepage logo returns through its existing scroll controller without reloading');
  console.log('PASS homepage logo: returns to intro without reloading the scene');
}finally{await browser.close();}
