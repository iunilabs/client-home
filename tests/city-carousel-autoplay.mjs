import {chromium, webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

const url = process.env.CITY_CAROUSEL_URL || 'http://127.0.0.1:4392/client-home/?city=0.99';
const out = process.env.CITY_CAROUSEL_AUTOPLAY_OUT || '/tmp/puntoes-carousel-autoplay.json';
const expectFixed = process.env.CITY_CAROUSEL_EXPECT_FIXED !== '0';
const report = {url, engines:[]};
const types = [['chromium',chromium],['webkit',webkit]].filter(([engine]) => !process.env.CITY_CAROUSEL_ENGINE || process.env.CITY_CAROUSEL_ENGINE === engine);

for (const [engine,type] of types) {
  const browser = await type.launch({headless:true,
    ...(engine==='chromium' && process.platform==='darwin' ? {executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {}),
    ...(engine==='webkit' && process.env.CITY_CAROUSEL_WEBKIT_PATH ? {executablePath:process.env.CITY_CAROUSEL_WEBKIT_PATH} : {})});
  const results = {engine, cases:[]};
  report.engines.push(results);
  try {
    for (const reducedMotion of ['no-preference','reduce']) {
      const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion});
      const page = await context.newPage();
      const load = async () => {
        await page.goto(url);
        await page.waitForFunction(() => window.__puntoes?.getState().city?.ready && !document.querySelector('.city-carousel').inert);
        await page.waitForTimeout(500);
      };
      await load();
      const snapshot = () => page.evaluate(() => {
        const row=document.querySelector('.city-carousel'), viewport=row.querySelector('.city-carousel-viewport'), state=window.__puntoes.getState();
        return {phase:row.dataset.motion,paused:row.dataset.paused,transform:row.querySelector('ul').style.transform,
          bundle:[...document.scripts].map(script=>script.src).filter(Boolean),
          order:[...row.querySelectorAll('.city-client')].map(el=>el.dataset.client),scrollLeft:viewport.scrollLeft,
          focused:row.classList.contains('is-focused'),reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,
          city:{active:state.city.active,opacity:state.city.opacity,mode:state.city.mode,stop:state.tour.currentId,moving:state.tour.moving},
          nativeScroll:scrollY,overflow:document.documentElement.style.overflow};
      });
      const changed = (before,after) => before.transform!==after.transform || before.order.join()!==after.order.join();
      const before=await snapshot();await page.waitForTimeout(3200);const after=await snapshot();
      results.cases.push({name:`idle-${reducedMotion}`,moving:changed(before,after),before,after});
      if (expectFixed) assert.equal(changed(before,after),true,`${engine}: idle autoplay moves with ${reducedMotion}`);
      if (reducedMotion==='reduce') {
        // Observe the OS preference separately from the visible map trip.
        // This is a diagnostic, so it records the freeze rather than assuming
        // whether the product intends to override that preference.
        const strip=page.locator('.city-carousel-viewport'), box=await strip.boundingBox();
        await strip.evaluate((el,{x,y}) => {
          const event=new Event('touchstart',{bubbles:true,cancelable:true});
          Object.defineProperty(event,'touches',{value:[{clientX:x,clientY:y}]});el.dispatchEvent(event);
        },{x:180,y:box.y+box.height/2});
        await strip.evaluate(el => {const event=new Event('touchend',{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:[]});el.dispatchEvent(event)});
        const released=await snapshot();await page.waitForTimeout(2600);const rested=await snapshot();
        results.cases.push({name:'reduced-after-release',moving:changed(released,rested),before:released,after:rested});
        if(expectFixed) assert.equal(changed(released,rested),true,`${engine}: reduced-motion autoplay resumes after release`);
        await page.emulateMedia({reducedMotion:'no-preference'});
        const preferenceBefore=await snapshot();await page.waitForTimeout(1600);const preferenceAfter=await snapshot();
        results.cases.push({name:'reduce-preference-removed',moving:changed(preferenceBefore,preferenceAfter),before:preferenceBefore,after:preferenceAfter});
      } else {
        assert.equal(changed(before,after),true,`${engine}: ordinary idle autoplay moves`);
        const strip=page.locator('.city-carousel-viewport'),box=await strip.boundingBox(),y=box.y+box.height/2;
        const session=engine==='chromium' ? await context.newCDPSession(page) : null;
        await page.evaluate(() => {
          window.touchTrace=[];
          for(const type of ['touchstart','touchend','touchcancel']) document.addEventListener(type,event=>touchTrace.push({type,target:event.target.className,carousel:Boolean(event.target.closest('.city-carousel')),trusted:event.isTrusted,touches:event.touches.length}),{capture:true,passive:true});
        });
        const touch=async (type,x,nextY=y,target='.city-carousel-viewport') => {
          if(session) return session.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd' ? [] : [{x,y:nextY,id:1}]});
          await page.locator(target).evaluate((el,{type,x,y}) => {
            const event=new Event(type==='touchStart'?'touchstart':type==='touchMove'?'touchmove':'touchend',{bubbles:true,cancelable:true});
            Object.defineProperty(event,'touches',{value:type==='touchEnd'?[]:[{clientX:x,clientY:y}]});el.dispatchEvent(event);
          },{type,x,y:nextY});
        };
        await touch('touchStart',350);
        for(let i=1;i<=8;i++){await touch('touchMove',350-i*35);await page.waitForTimeout(35)}
        await touch('touchMove',70,y-180);await page.waitForTimeout(180);
        await touch('touchEnd');
        const outsideBefore=await snapshot();await page.waitForTimeout(3000);const outsideAfter=await snapshot();
        results.cases.push({name:'release-outside-viewport',input:session?'trusted CDP touch':'synthetic WebKit touch',moving:changed(outsideBefore,outsideAfter),before:outsideBefore,after:outsideAfter,trace:await page.evaluate(()=>touchTrace)});
        assert.equal(changed(outsideBefore,outsideAfter),true,`${engine}: finger released outside the strip resumes autoplay`);

        // Model a lost/retargeted end: the held finger starts on the viewport,
        // but its release reaches only the window/body rather than that node.
        await strip.evaluate((el,{x,y}) => {const event=new Event('touchstart',{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:[{clientX:x,clientY:y}]});el.dispatchEvent(event)},{x:180,y});
        await page.evaluate(() => {const event=new Event('touchend',{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:[]});document.body.dispatchEvent(event)});
        const retargetBefore=await snapshot();await page.waitForTimeout(3000);const retargetAfter=await snapshot();
        results.cases.push({name:'synthetic-retargeted-end',moving:changed(retargetBefore,retargetAfter),before:retargetBefore,after:retargetAfter});
        if(expectFixed) assert.equal(changed(retargetBefore,retargetAfter),true,`${engine}: a retargeted end does not leave the strip held`);

        await page.evaluate(() => {Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
        await page.waitForTimeout(300);
        await page.evaluate(() => {Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
        const foregroundBefore=await snapshot();await page.waitForTimeout(3000);const foregroundAfter=await snapshot();
        results.cases.push({name:'foreground-after-lost-end',moving:changed(foregroundBefore,foregroundAfter),before:foregroundBefore,after:foregroundAfter});
        assert.equal(changed(foregroundBefore,foregroundAfter),true,`${engine}: foreground return clears stale held state`);

        // Two real touch contacts: the first starts on a logo, the second on
        // the map. The logo's finger lifts first, so its touchend still reports
        // one touch. The last touchend targets the map rather than the strip.
        const first={x:180,y,id:1}, second={x:210,y:y-220,id:2};
        if(session) {
          await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
          await page.waitForTimeout(80);
          await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});
          await page.waitForTimeout(80);
          await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[first]});
          await page.waitForTimeout(80);
          await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        } else {
          for(const [selector,type,points] of [['.city-carousel-viewport','touchstart',[first]],['body','touchstart',[first,second]],['.city-carousel-viewport','touchend',[second]],['body','touchend',[]]]) {
            await page.locator(selector).evaluate((el,{type,points}) => {
              const event=new Event(type,{bubbles:true,cancelable:true});
              Object.defineProperty(event,'touches',{value:points.map(point=>({clientX:point.x,clientY:point.y,identifier:point.id}))});el.dispatchEvent(event);
            },{type,points});
            await page.waitForTimeout(80);
          }
        }
        const multiBefore=await snapshot();await page.waitForTimeout(3000);const multiAfter=await snapshot();
        const multiTrace=await page.evaluate(()=>touchTrace);
        const ends=multiTrace.filter(event=>event.type==='touchend' && event.trusted===Boolean(session)).slice(-2);
        assert.deepEqual(ends.map(event=>({carousel:event.carousel,touches:event.touches})),[{carousel:true,touches:1},{carousel:false,touches:0}],`${engine}: the last physical contact ends outside the strip`);
        results.cases.push({name:'multitouch-last-finger-on-map',input:session?'trusted CDP two touch IDs':'synthetic WebKit two-contact TouchEvents',moving:changed(multiBefore,multiAfter),before:multiBefore,after:multiAfter,trace:multiTrace});
        if(expectFixed) assert.equal(changed(multiBefore,multiAfter),true,`${engine}: the last finger on the map releases held autoplay`);
      }
      await context.close();
    }
    console.log(`${engine}: ${results.cases.map(item=>`${item.name}=${item.moving?'moving':'stationary'}`).join(', ')}`);
  } finally {await browser.close();await writeFile(out,JSON.stringify(report,null,2)+'\n')}
}
console.log(`Evidence: ${out}`);
