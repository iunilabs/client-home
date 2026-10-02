import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mobileTourGeometry} from '../src/section-two/mobile-tour.js';
const base=process.env.SCROLL_GUARD_URL||'http://127.0.0.1:4311/client-home/';
const out=process.env.SCROLL_GUARD_OUT||'docs/scroll-guard-v3';
const baseline=process.env.SCROLL_GUARD_BASELINE==='1';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const desktopOnly=process.env.SCROLL_GUARD_PART==='desktop';
const prior=desktopOnly?await fs.readFile(`${out}/REPORT.json`,'utf8').then(JSON.parse).catch(()=>null):null;
const report={base,baseline,passed:false,mobile:prior?.mobile??[],mobileExtra:prior?.mobileExtra,desktop:[],retainedMobile:desktopOnly};
const sample=()=>({y:scrollY,tour:window.__puntoes.getState().tour,frameY:new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.trust-frame')).transform).m42,nextTop:document.querySelector('#posibilidades').getBoundingClientRect().top});
try{
  for(const [width,height] of (desktopOnly?[]:[[390,844],[320,568]])) {
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
    const page=await context.newPage(),cdp=await context.newCDPSession(page);
    for(const samples of [2,5,16]) {
      await page.goto(base+'?scroll=970');await page.waitForFunction(()=>window.__puntoes?.getState().city?.ready);
      const anchor=mobileTourGeometry({top:await page.locator('#confianza').evaluate(el=>el.offsetTop),viewport:height}).revealed;
      const from=anchor-height*.72;
      await page.evaluate(top=>scrollTo({top,behavior:'instant'}),from);await page.waitForTimeout(300);
      await page.evaluate(()=>{window.__guardTrace=[];const take=()=>{const s=window.__puntoes.getState();window.__guardTrace.push({y:scrollY,active:s.tour.active,id:s.tour.currentId,released:s.tour.released,frameY:new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.trust-frame')).transform).m42,nextTop:document.querySelector('#posibilidades').getBoundingClientRect().top})};window.addEventListener('scroll',take,{passive:true});});
      const x=width/2,y=height*.9,distance=height*.85;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      for(let i=1;i<=samples;i++) {
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-distance*i/samples,id:1}]});
        if(samples===16)await page.waitForTimeout(2);
      }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(1600);
      const after=await page.evaluate(sample);
      const trace=await page.evaluate(()=>window.__guardTrace);
      const record={width,height,samples,anchor,from,after,trace,maxY:Math.max(...trace.map(s=>s.y)),minNextTop:Math.min(...trace.map(s=>s.nextTop))};
      report.mobile.push(record);console.log(JSON.stringify({mode:'mobile',width,samples,anchor,after,maxY:record.maxY,minNextTop:record.minNextTop}));
      await page.screenshot({path:`${out}/${baseline?'base':'fixed'}-${width}-${samples}-entry.png`});
      if(!baseline){assert.ok(after.tour.active);assert.equal(after.tour.currentId,'puntoes');assert.ok(Math.abs(after.y-anchor)<1);assert.equal(after.frameY,0);assert.ok(record.maxY<=anchor+1,'entry inertia cannot outrun the anchor');assert.ok(record.minNextTop>=height-1,'section3 never enters the viewport during entry');}
    }
    // Native compositor fling: displacement does not reach the city, but its
    // inertial tail does. Sample every RAF, not just the eventual settled state.
    await page.goto(base+'?scroll=500');await page.waitForFunction(()=>window.__puntoes?.getState().scene);
    const farAnchor=mobileTourGeometry({top:await page.locator('#confianza').evaluate(el=>el.offsetTop),viewport:height}).revealed;
    await page.evaluate(top=>scrollTo({top,behavior:'instant'}),farAnchor-height*1.8);await page.waitForTimeout(300);
    await page.evaluate(()=>{window.__guardRAF=[];window.__guardRecording=true;const take=()=>{window.__guardRAF.push({y:scrollY,active:window.__puntoes.getState().tour.active,nextTop:document.querySelector('#posibilidades').getBoundingClientRect().top});if(window.__guardRecording)requestAnimationFrame(take)};requestAnimationFrame(take)});
    await cdp.send('Input.synthesizeScrollGesture',{gestureSourceType:'touch',preventFling:false,yDistance:-height*.88,speed:6000,x:width*.53,y:height*.06});
    await page.waitForTimeout(2100);
    const farAfter=await page.evaluate(sample),raf=await page.evaluate(()=>{window.__guardRecording=false;return window.__guardRAF});
    report.mobile.push({width,height,kind:'far-inertial',anchor:farAnchor,after:farAfter,raf});
    if(!baseline){assert.equal(farAfter.tour.currentId,'puntoes');assert.ok(farAfter.tour.active);assert.ok(raf.every(f=>f.y<=farAnchor+1 && f.nextTop>=height-1),'compositor inertial fling never exposes section3');}
    await context.close();
  }
  if (!baseline && !desktopOnly) {
    const context=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
    const page=await context.newPage(),cdp=await context.newCDPSession(page);
    await page.goto(base+'?city=0');await page.waitForFunction(()=>window.__puntoes?.getState().city?.ready && window.__puntoes.getState().tour.active);
    const wait=id=>page.waitForFunction(id=>{const t=window.__puntoes.getState().tour;return t.currentId===id && !t.moving},id);
    async function swipe(distance=108,y=200){const x=160;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=36;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-distance*i/36,id:1}]});await page.waitForTimeout(8)}await page.waitForTimeout(100);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100)}
    await swipe();await wait('bbva');
    const link=page.locator('.city-tour-card.is-current .tour-card-more');const box=await link.boundingBox();
    // The start coordinate is deliberately on the link, rather than the map.
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+30,y:box.y+box.height/2,id:1}]});
    for(let i=1;i<=36;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+30,y:box.y+box.height/2-i*3,id:1}]});await page.waitForTimeout(8)}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('naturgy');
    await page.setViewportSize({width:320,height:648});await page.waitForTimeout(300);
    const taller=await page.evaluate(sample);assert.ok(taller.nextTop>=648-1,'toolbar height growth reserves the whole viewport');assert.equal(taller.frameY,0);
    await swipe();await wait('sabadell');await swipe();await wait('collaborate');
    const before=await page.evaluate(()=>scrollY);await swipe(140);await page.waitForTimeout(300);const after=await page.evaluate(sample);
    assert.ok(after.y-before>60 && after.y-before<190,'fresh final swipe remains native after overflow unlock');assert.equal(after.tour.active,false);
    await swipe(-240);await wait('collaborate');assert.ok(await page.evaluate(()=>window.__puntoes.getState().tour.active));
    await page.keyboard.press('Home');await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>scrollY),0);
    await page.locator('#open-clients').click();await page.waitForFunction(()=>window.__puntoes.getState().tour.active);
    await swipe();await wait('bbva');
    let navigated=false;await page.route('**/clientes/bbva/',async route=>{navigated=true;await route.fulfill({body:'Future case',contentType:'text/html'})});
    await page.locator('.city-tour-card.is-current .tour-card-more').tap();await page.waitForURL('**/clientes/bbva/');assert.ok(navigated,'tap link still navigates normally');
    // Asset readiness must not decide whether a long entering gesture is owned.
    await page.route('**/puntoes-city-mobile-v13-tour-*.webp',async route=>{await new Promise(resolve=>setTimeout(resolve,1600));await route.continue()});
    await page.goto(base+'?scroll=970');await page.waitForFunction(()=>window.__puntoes?.getState().progress>4.7);
    const lateAnchor=mobileTourGeometry({top:await page.locator('#confianza').evaluate(el=>el.offsetTop),viewport:648}).revealed;
    await page.waitForFunction(()=>window.__puntoes.getState().scroll.moving!=='smooth');
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),lateAnchor-200);await page.waitForTimeout(100);
    const wasReady=await page.evaluate(()=>window.__puntoes.getState().city.ready);
    await swipe(320,580);await page.waitForFunction(()=>window.__puntoes.getState().city.ready);
    const lateAfter=await page.evaluate(sample);
    assert.equal(lateAfter.tour.currentId,'puntoes');assert.ok(lateAfter.tour.active);assert.equal(lateAfter.frameY,0);
    assert.ok(lateAfter.nextTop>=648-1);
    await page.unroute('**/puntoes-city-mobile-v13-tour-*.webp');
    report.mobileExtra={linkSwipe:true,linkTap:true,toolbar:taller,nativeExit:{before,after},reverse:true,home:true,lateAssets:{wasReady,lateAfter}};
    await context.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.addInitScript(()=>{window.__wheelTimes=[];window.addEventListener('wheel',e=>window.__wheelTimes.push({time:e.timeStamp,trusted:e.isTrusted}),{capture:true,passive:true})});
  await page.goto(base+'?city=.85');await page.waitForFunction(()=>window.__puntoes?.getState().city?.ready);
  const end=await page.locator('#confianza').evaluate(el=>el.offsetTop+el.offsetHeight-innerHeight);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),end-160);await page.waitForTimeout(300);
  for(const delta of [500,220,90,35,12]){await page.mouse.wheel(0,delta);await page.waitForTimeout(40)}
  await page.waitForTimeout(1300);
  const first=await page.evaluate(sample);
  await page.screenshot({path:`${out}/${baseline?'base':'fixed'}-desktop-end.png`});
  await page.mouse.wheel(0,110);await page.waitForTimeout(650);
  const released=await page.evaluate(sample);
  report.desktop.push({end,first,released});console.log(JSON.stringify({mode:'desktop',end,first,released}));
  if(!baseline){assert.ok(Math.abs(first.y-end)<1,'desktop arriving burst stops at chapter end');assert.equal(first.frameY,0);assert.ok(released.y>end+30 && released.y<end+150,'fresh burst releases proportionally');}
  if(!baseline){
    // Runtime CSS emulates the separately owned 405svh layout; the source
    // stylesheet remains untouched. Resizing causes the guard to read bounds.
    await page.addStyleTag({content:'#confianza{height:405svh}'});
    await page.setViewportSize({width:1440,height:901});await page.waitForTimeout(200);
    const dynamicEnd=await page.locator('#posibilidades').evaluate(el=>el.offsetTop-innerHeight);
    await page.waitForFunction(()=>window.__puntoes.getState().scroll.moving!=='smooth');
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),dynamicEnd-250);await page.waitForTimeout(200);
    await page.evaluate(()=>{window.__desktopRAF=[];window.__desktopRecording=true;const take=()=>{window.__desktopRAF.push({y:scrollY,nextTop:document.querySelector('#posibilidades').getBoundingClientRect().top});if(window.__desktopRecording)requestAnimationFrame(take)};requestAnimationFrame(take)});
        const desktopCDP=await page.context().newCDPSession(page);
    await page.evaluate(()=>{window.__wheelTimes=[]});
    const stamp=Date.now()/1000;
    await Promise.all(Array.from({length:6},(_,i)=>desktopCDP.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:720,y:400,deltaX:0,deltaY:2000,timestamp:stamp+i*.04})));
    await page.waitForTimeout(900);
    const wheelTimes=await page.evaluate(()=>window.__wheelTimes);assert.ok(wheelTimes.every(t=>t.trusted));assert.ok(wheelTimes.at(-1).time-wheelTimes[0].time<=240,'verified native burst cadence');
    const held=await page.evaluate(sample),frames=await page.evaluate(()=>{window.__desktopRecording=false;return window.__desktopRAF});
    assert.ok(Math.abs(held.y-dynamicEnd)<1);assert.ok(frames.every(f=>f.y<=dynamicEnd+1 && f.nextTop>=900),'large arriving burst never exposes section3');
    // Exploring the map and opening/closing a case do not release or trap it.
    const point=await page.evaluate(()=>{for(let y=200;y<600;y+=100)for(let x=300;x<1000;x+=100)if(document.elementFromPoint(x,y)?.closest('.city-drag-surface'))return{x,y}});assert.ok(point);
    const mapBefore=await page.locator('.city-world').getAttribute('style');
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+100,point.y+40,{steps:8});await page.mouse.up();await page.waitForTimeout(200);
    assert.notEqual(await page.locator('.city-world').getAttribute('style'),mapBefore,'desktop map drag remains interactive');
    assert.equal(await page.evaluate(()=>scrollY),Math.round(dynamicEnd));
    const logo=page.locator('.city-client[data-client="bbva"]');await page.keyboard.press('Tab');await logo.focus();await logo.click();await page.waitForFunction(()=>window.__puntoes.getState().city.focus?.client==='bbva');assert.equal(await page.locator('.city-tour-card.is-current').getAttribute('data-client'),'bbva');
    assert.equal(await page.evaluate(()=>scrollY),Math.round(dynamicEnd));await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!window.__puntoes.getState().city.focus?.moving);await page.mouse.wheel(0,110);await page.waitForTimeout(700);
    const native=await page.evaluate(sample);assert.ok(native.y>dynamicEnd+30 && native.y<dynamicEnd+160);
    await page.mouse.wheel(0,-500);await page.waitForTimeout(700);assert.ok(await page.evaluate(()=>scrollY)<dynamicEnd-100);
    await page.mouse.wheel(0,600);await page.waitForTimeout(500);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-dynamicEnd)<1,'inverse entry rearms next finish');
    await page.evaluate(()=>{document.activeElement.blur();document.body.tabIndex=-1;document.body.focus()});
    await page.keyboard.press('Meta+ArrowDown');await page.waitForFunction(end=>scrollY>end+200,dynamicEnd);assert.ok(await page.evaluate(()=>scrollY)>dynamicEnd+200,'Cmd+Down is an external exit');
    await page.keyboard.press('Meta+ArrowUp');await page.waitForFunction(()=>scrollY<1);
    await page.locator('a[href="#inicio"]').first().click();await page.waitForFunction(()=>scrollY<1);
    report.desktop.push({dynamicEnd,height:'405svh',held,native,frames,wheelTimes,mapDrag:true,inlineCard:true,reverse:true,commandKeys:true,chapter:true});
  }
  await page.close();report.passed=true;
}catch(error){report.error=error.stack;process.exitCode=1;console.error(error)}
finally{await fs.writeFile(`${out}/${baseline?'BASELINE':'REPORT'}.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
