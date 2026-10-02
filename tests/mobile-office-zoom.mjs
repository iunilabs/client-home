import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.MOBILE_OFFICE_URL || 'http://127.0.0.1:4392/client-home/';
const out=process.env.MOBILE_OFFICE_OUT || '/tmp/puntoes-mobile-office-zoom';
const width=Number(process.env.MOBILE_OFFICE_WIDTH || 390),height=width===320?568:width===430?932:844;
const startUrl=new URL(base);startUrl.searchParams.delete('city');startUrl.searchParams.set('scroll','1000');
const engines=[['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.MOBILE_OFFICE_ENGINE || process.env.MOBILE_OFFICE_ENGINE===name);
const report={url:base,viewport:{width,height},passed:false,engines:[]};
await mkdir(out,{recursive:true});
const ease=t=>t*t*t*(t*(6*t-15)+10);

for(const [engine,type] of engines) {
  const browser=await type.launch({headless:true,
    ...(engine==='chromium'&&process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{}),
    ...(engine==='webkit'&&process.env.MOBILE_OFFICE_WEBKIT_PATH?{executablePath:process.env.MOBILE_OFFICE_WEBKIT_PATH}:{})});
  const entry={engine,preferences:[],failedTile:null};report.engines.push(entry);
  try {
    for(const preference of ['no-preference','reduce']) {
      const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:preference});
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      let releaseOffice,officeRequests=0;
      const heldOffice=new Promise(resolve=>{releaseOffice=resolve});
      await page.route(/puntoes-city-mobile-puntoes-detail-v14.*\.webp/,async route=>{
        if(route.request().resourceType()!=='image')return route.continue();
        officeRequests++;await heldOffice;await route.continue();
      });
      await page.goto(startUrl.href,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__puntoes&&Math.abs(scrollY-window.__puntoes.getState().handoffStart)<2);
      const geometry=await page.evaluate(()=>{const state=window.__puntoes.getState(),start=state.handoffStart+1650;return{start,revealed:start+innerHeight*.8,height:innerHeight}});
      const scrollFraction=async fraction=>{
        const target=geometry.start+(geometry.revealed-geometry.start)*fraction;
        await page.evaluate(top=>scrollTo({top,behavior:'instant'}),target);
        await page.waitForFunction(({top,entrance})=>Math.abs(scrollY-top)<2&&Math.abs(window.__puntoes.getState().city.entrance-entrance)<.003,{top:target,entrance:ease(fraction)});
      };
      const snapshot=()=>page.evaluate(()=>{
        const state=window.__puntoes.getState(),tile=document.querySelector('.city-detail[data-client="puntoes"]'),world=document.querySelector('.city-world'),frame=document.querySelector('.trust-frame');
        return{zoom:state.city.zoom,entrance:state.city.entrance,ready:state.city.ready,active:state.tour.active,current:state.tour.currentId,moving:state.tour.moving,
          frameOpacity:+getComputedStyle(frame).opacity,office:tile?{source:tile.currentSrc||tile.src,opacity:+getComputedStyle(tile).opacity,width:tile.naturalWidth,loaded:tile.complete&&tile.naturalWidth>0,
            transform:getComputedStyle(tile).transform,parent:tile.parentElement.className}:null,
          layout:{width:parseFloat(world.style.width),height:parseFloat(world.style.height),viewportWidth:document.documentElement.clientWidth,viewportHeight:innerHeight},
          bundle:[...document.scripts].map(script=>script.src).filter(Boolean),scroll:scrollY};
      });
      await scrollFraction(.8);
      await page.waitForFunction(()=>document.querySelector('.city-detail[data-client="puntoes"]')?.src.includes('puntoes-detail-v14'));
      await page.waitForTimeout(150);
      const pending=await snapshot();assert.equal(pending.ready,false,`${engine}/${preference}: an undecoded office delays the map`);assert.equal(pending.frameOpacity,0);
      releaseOffice();
      await page.waitForFunction(()=>window.__puntoes.getState().city.ready);
      const decoded=await snapshot();assert.equal(decoded.office.opacity,1);assert.equal(decoded.office.loaded,true);assert.ok(decoded.frameOpacity>0);
      assert.ok(Math.abs(decoded.zoom-1.5)<.08,`${engine}/${preference}: late office decode starts the first visible frame at the open map zoom`);
      await page.screenshot({path:`${out}/${engine}-${preference}-first-visible.png`});
      const partialLayout=decoded.layout;
      const partialHubZoom=Math.max(1.5,Math.min(partialLayout.viewportWidth*.98/(partialLayout.width*.19235),partialLayout.viewportHeight*.68/(partialLayout.height*.06758)));
      const partialTarget=1.5+(partialHubZoom-1.5)*ease(.8);
      await page.waitForFunction(expected=>Math.abs(window.__puntoes.getState().city.zoom-expected)<.035,partialTarget);
      await page.waitForTimeout(150);
      const partialArrival=await snapshot();assert.ok(partialArrival.zoom>decoded.zoom+.5);assert.ok(Math.abs(partialArrival.scroll-decoded.scroll)<2,`${engine}/${preference}: the remaining approach is shown without further scrolling`);
      const stableSource=decoded.office.source;
      const samples=[];
      for(const fraction of [.15,.5,.85]) {
        await scrollFraction(fraction);const sample=await snapshot(),layout=sample.layout;
        const hubZoom=Math.max(1.5,Math.min(layout.viewportWidth*.98/(layout.width*.19235),layout.viewportHeight*.68/(layout.height*.06758)));
        const expected=1.5+(hubZoom-1.5)*ease(fraction);
        assert.ok(Math.abs(sample.zoom-expected)<.035,`${engine}/${preference}: entrance ${fraction} zoom ${sample.zoom} follows scroll, expected ${expected}`);
        assert.equal(sample.office.source,stableSource);assert.equal(sample.office.opacity,1);assert.equal(sample.office.transform,'none');assert.equal(sample.office.parent,'city-core');
        samples.push({fraction,expected,...sample});
        if(fraction===.5) await page.screenshot({path:`${out}/${engine}-${preference}-map.png`});
      }
      await scrollFraction(.2);const beforeCapture=await snapshot();
      await page.evaluate(()=>{
        window.officeZoomFrames=[];let count=0;
        function frame(){const state=window.__puntoes.getState();officeZoomFrames.push({zoom:state.city.zoom,moving:state.tour.moving,current:state.tour.currentId,scroll:scrollY});if(++count<90)requestAnimationFrame(frame)}
        requestAnimationFrame(frame);
      });
      await page.evaluate(top=>scrollTo({top,behavior:'instant'}),geometry.revealed+80);
      await page.waitForFunction(()=>window.__puntoes.getState().tour.active);
      await page.waitForFunction(()=>!window.__puntoes.getState().tour.moving);
      await page.waitForTimeout(100);
      const hub=await snapshot(),captureFrames=await page.evaluate(()=>officeZoomFrames);
      const firstCaptured=captureFrames.find(frame=>Math.abs(frame.scroll-geometry.revealed)<2);
      assert.ok(firstCaptured&&Math.abs(firstCaptured.zoom-beforeCapture.zoom)<.55,`${engine}/${preference}: entering the anchor preserves the visible camera`);
      assert.ok(hub.zoom>beforeCapture.zoom+.5);assert.equal(hub.current,'puntoes');assert.equal(hub.office.source,stableSource);assert.equal(hub.office.opacity,1);
      await page.screenshot({path:`${out}/${engine}-${preference}-hub.png`});

      const session=engine==='chromium'?await context.newCDPSession(page):null;
      const touch=async(type,y)=>{
        if(session)return session.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:width/2,y,id:1}]});
        await page.locator('.trust-frame').evaluate((el,{type,y,x})=>{const event=new Event(type==='touchStart'?'touchstart':type==='touchMove'?'touchmove':'touchend',{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:type==='touchEnd'?[]:[{clientX:x,clientY:y}]});el.dispatchEvent(event)},{type,y,x:width/2});
      };
      await touch('touchStart',height*.38);
      for(let step=1;step<=10;step++){await touch('touchMove',height*.38-step*12);await page.waitForTimeout(25)}
      await touch('touchEnd');
      await page.waitForFunction(()=>window.__puntoes.getState().tour.currentId==='bbva'&&!window.__puntoes.getState().tour.moving);
      const bbva=await snapshot();assert.equal(bbva.office.source,stableSource);assert.equal(bbva.office.opacity,1);
      assert.equal(officeRequests,1,`${engine}/${preference}: the same office is prepared once`);assert.deepEqual(errors,[]);
      entry.preferences.push({preference,pending,decoded,partialArrival,samples,beforeCapture,captureFrames,hub,bbva,officeRequests});
      await context.close();
    }
    const normal=entry.preferences[0].samples,reduced=entry.preferences[1].samples;
    for(let index=0;index<normal.length;index++)assert.ok(Math.abs(normal[index].zoom-reduced[index].zoom)<.035,`${engine}: reduced preference retains the scroll-controlled approach`);

    const failureContext=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),failurePage=await failureContext.newPage();
    let failedRequests=0;
    await failurePage.route(/puntoes-city-mobile-puntoes-detail-v14.*\.webp/,route=>{
      if(route.request().resourceType()!=='image')return route.continue();
      failedRequests++;return route.fulfill({status:404,contentType:'text/plain',body:'Intentional office tile failure'});
    });
    const failureUrl=new URL(base);failureUrl.searchParams.set('city','0');
    await failurePage.goto(failureUrl.href);
    await failurePage.waitForFunction(()=>window.__puntoes?.getState().city.ready&&window.__puntoes.getState().tour.active&&!window.__puntoes.getState().tour.moving);
    const failed=await failurePage.evaluate(()=>({ready:window.__puntoes.getState().city.ready,officePresent:Boolean(document.querySelector('.city-detail[data-client="puntoes"]')),
      base:document.querySelector('#city-image').currentSrc,baseLoaded:document.querySelector('#city-image').naturalWidth>0,frameOpacity:+getComputedStyle(document.querySelector('.trust-frame')).opacity,
      carouselInert:document.querySelector('.city-carousel').inert}));
    assert.equal(failed.ready,true);assert.equal(failed.officePresent,false);assert.equal(failed.baseLoaded,true);assert.equal(failed.frameOpacity,1);assert.equal(failed.carouselInert,false);
    await failurePage.waitForTimeout(600);assert.equal(failedRequests,1,'failed office is not retried every frame');
    entry.failedTile={...failed,requests:failedRequests};await failureContext.close();
    console.log(`PASS ${engine}: one decoded office at every zoom; delayed/error tile handling; normal/reduced scroll approach and capture continuity`);
  } finally {await browser.close();await writeFile(`${out}/REPORT.json`,JSON.stringify(report,null,2)+'\n')}
}
report.passed=true;await writeFile(`${out}/REPORT.json`,JSON.stringify(report,null,2)+'\n');
console.log(`Evidence: ${out}`);
