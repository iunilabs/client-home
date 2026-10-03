import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pages} from '../src/site/templates.js';

const base=process.env.SITE_URL||'http://127.0.0.1:4392/client-home/';
const out=process.env.SITE_OUT||'/tmp/puntoes-site-pages';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),report=[];
const routes=new Set(['',...pages.map(([slug])=>slug+'/')].map(route=>new URL(route,base).pathname));
try{
  for(const width of [320,390,1440]){
    const context=await browser.newContext({viewport:{width,height:900},isMobile:width<1100,hasTouch:width<1100});
    const page=await context.newPage();
    for(const [slug,label] of pages){
      const errors=[],failed=[],requests=[];
      const onError=error=>errors.push(error.message),onResponse=response=>{if(response.status()>=400)failed.push(`${response.status()} ${response.url()}`)},onRequest=request=>requests.push(request.url());
      page.on('pageerror',onError);page.on('response',onResponse);page.on('request',onRequest);
      assert.equal((await page.goto(new URL(slug+'/',base).href)).status(),200);
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.locator('h1').count(),1);
      assert.ok((await page.title()).includes('Puntoes'));
      assert.equal(await page.locator('.header-desktop-nav [aria-current="page"]').textContent().then(t=>t.replace('↗','').trim()),label);
      assert.equal(await page.locator('.site-footer nav a').count(),6);
      const links=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(node=>node.href));
      for(const href of links){const url=new URL(href);if(url.origin!==new URL(base).origin)continue;assert.ok(routes.has(url.pathname),href);if(url.pathname===new URL(slug+'/',base).pathname&&url.hash)assert.equal(await page.evaluate(id=>Boolean(document.getElementById(id)),decodeURIComponent(url.hash.slice(1))),true,href);}
      // Exercise lazy logos and every reveal rather than merely testing the first screen.
      await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=650){scrollTo(0,y);await new Promise(requestAnimationFrame)}scrollTo(0,0)});
      await page.waitForTimeout(750);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
      assert.deepEqual(await page.locator('img').evaluateAll(nodes=>nodes.filter(n=>!n.complete||!n.naturalWidth).map(n=>n.src)),[],'broken image');
      assert.deepEqual(await page.locator('h1,h2,h3,.lead,.card,.contact-field input,.contact-field select,.contact-field textarea').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.textContent.slice(0,60))),[],'content does not fit');
      assert.ok(!requests.some(url=>/\/(models|textures|decoders)\/|puntoes-city|\/assets\/index-[^/]+\.js/.test(url)),'interior pages load no 3D runtime or assets');
      if(width!==320)await page.screenshot({path:`${out}/${slug}-${width}.png`,fullPage:true});
      if(width<1100){await page.getByRole('button',{name:'Abrir menú'}).tap();assert.equal(await page.locator('#header-mobile-menu [aria-current="page"]').textContent().then(t=>t.replace(/^\s*\d{2}/,'').replace('↗','').trim()),label);await page.keyboard.press('Escape');await page.locator('#header-mobile-menu').waitFor({state:'hidden'});}
      const next=pages[(pages.findIndex(([id])=>id===slug)+1)%pages.length][0];
      if(width<1100)await page.getByRole('button',{name:'Abrir menú'}).tap();
      await page.locator(width<1100?'#header-mobile-menu':'.header-desktop-nav').locator(`a[href$="/${next}/"]`).click();
      await page.waitForURL(new URL(next+'/',base).href);
      await page.goBack();await page.waitForURL(new URL(slug+'/',base).href);
      if(width<1100){await page.getByRole('button',{name:'Abrir menú'}).tap();await page.getByRole('button',{name:'Cerrar menú',exact:true}).tap();await page.locator('#header-mobile-menu').waitFor({state:'hidden'});}
      assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
      report.push({page:slug,width,passed:true});console.log(`PASS ${slug} ${width}px: direct route, layout, links, images, navigation/back, light assets`);
      page.off('pageerror',onError);page.off('response',onResponse);page.off('request',onRequest);
    }
    await context.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(new URL('formacion/',base).href);
  for(const [area,count] of [['desarrollo',3],['datos',2],['agile',2],['office',2],['proyectos',1],['todos',10]]){
    await page.locator(`[data-filter="${area}"]`).click();
    assert.equal(await page.locator('[data-course-area]:visible').count(),count);
    assert.equal(await page.locator('[data-course-filters] [aria-pressed=true]').count(),1);
  }
  await page.goto(new URL('hablemos/?tema=ia',base).href);
  assert.equal(await page.locator('[name="your-subject"]').inputValue(),'IA y automatización');
  let result='error',sent=0;
  // Never send test messages to the actual company.
  await page.route('https://www.puntoes.es/wp-json/contact-form-7/v1/contact-forms/119/feedback',async route=>{
    sent++;const body=route.request().postData();assert.ok(body.includes('IA y automatización'));assert.ok(body.includes('Prueba de formulario'));
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result==='error'?{status:'mail_failed'}:result==='invalid'?{status:'validation_failed',invalid_fields:[{field:'your-email'}]}:{status:'mail_sent'})});
  });
  await page.getByRole('button',{name:'Hablemos',exact:true}).click();assert.equal(sent,0,'empty fields cannot submit');
  await page.locator('[name="your-name"]').fill('Prueba de formulario');await page.locator('[name="your-email"]').fill('qa@example.com');await page.locator('[name="your-message"]').fill('Mensaje de prueba interceptado.');
  await page.getByRole('button',{name:'Hablemos',exact:true}).click();await page.locator('[data-contact-status][data-state=error]').waitFor();assert.equal(await page.locator('[name="your-message"]').inputValue(),'Mensaje de prueba interceptado.');
  result='invalid';await page.getByRole('button',{name:'Hablemos',exact:true}).click();await page.locator('[name="your-email"][aria-invalid=true]').waitFor();
  await page.locator('[name="your-email"]').fill('qa2@example.com');result='success';await page.getByRole('button',{name:'Hablemos',exact:true}).click();await page.locator('[data-contact-status][data-state=success]').waitFor();assert.equal(await page.locator('[name="your-message"]').inputValue(),'');assert.equal(sent,3);
  console.log('PASS course filters, contact topic, native validation, error preservation, server validation and confirmed success (requests intercepted)');
  await page.close();
  const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  for(const [slug] of pages){await noJS.goto(new URL(slug+'/',base).href);assert.equal(await noJS.locator('h1').isVisible(),true);assert.equal(await noJS.locator('.site-footer nav a').count(),6);}
  console.log('PASS all six pages: content and footer navigation remain available without JS');
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
}finally{await browser.close();}
