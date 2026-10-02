import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.MOBILE_SCROLL_URL || 'http://127.0.0.1:4304/';
const out = process.env.MOBILE_SCROLL_OUT || 'docs/mobile-snap-2026-10-02';
await fs.mkdir(out, {recursive: true});
const browser = await chromium.launch({headless: true,
  ...(process.platform === 'darwin' ? {executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const report = {url: base, passed: false, phones: []};
async function waitForTourArrival(page, id) {
  await page.waitForFunction(expected => {
    const tour = window.__puntoes.getState().tour;
    const card = document.querySelector('.city-tour-card.is-current');
    return tour.active && tour.currentId === expected && !tour.moving &&
      (expected === 'puntoes' || card?.dataset.client === expected && !card.inert);
  }, id, {timeout: 6000});
}
try {
  for (const [width, height] of [[320,568],[390,844],[430,932]].filter(([w])=>!process.env.MOBILE_SCROLL_WIDTH || w===Number(process.env.MOBILE_SCROLL_WIDTH))) {
    const context = await browser.newContext({viewport: {width,height}, isMobile: true, hasTouch: true});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    const state = () => page.evaluate(() => ({y: scrollY, ...window.__puntoes.getState().tour}));
    async function swipe({x = width / 2, y = height * .38, dx = 0, distance = 120, samples = 40, delay = 16, rest = 120, arrival, settle = arrival ? 0 : 1400} = {}) {
      await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x,y,id:1}]});
      const frames = [];
      for (let i=1;i<=samples;i++) {
        await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:x+dx*i/samples,y:y-distance*i/samples,id:1}]});
        await page.waitForTimeout(delay);
        frames.push(await page.evaluate(() => ({y:scrollY, id:document.querySelector('#confianza').dataset.cityStop, transform:document.querySelector('.city-world').style.transform})));
      }
      await page.waitForTimeout(rest);
      await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(settle);
      if (arrival) await waitForTourArrival(page, arrival);
      return frames;
    }
    async function browseLogos(direction) {
      const viewport = page.locator('.city-carousel-viewport');
      const box = await viewport.boundingBox();
      const fromX = direction === 'left' ? box.x + box.width - 30 : box.x + 30;
      const toX = direction === 'left' ? box.x + 30 : box.x + box.width - 30;
      const y = box.y + box.height / 2;
      await page.evaluate(() => {
        const touch = window.__mobileCarouselTouch = {x: null, count: 0, paintedCount: 0, trusted: false};
        const observe = event => {
          if (!event.touches[0]) return;
          touch.x = event.touches[0].clientX; touch.trusted = event.isTrusted;
          const count = ++touch.count;
          requestAnimationFrame(() => {touch.paintedCount = Math.max(touch.paintedCount, count)});
        };
        for (const type of ['touchstart', 'touchmove']) document.addEventListener(type, observe, {capture: true, passive: true});
        touch.cleanup = () => {
          for (const type of ['touchstart', 'touchmove']) document.removeEventListener(type, observe, true);
        };
      });
      const delivered = x => page.waitForFunction(expected => {
        const touch = window.__mobileCarouselTouch;
        return touch.trusted && Math.abs(touch.x - expected) < .01 && touch.paintedCount === touch.count;
      }, x, {timeout: 1500});
      const position = () => viewport.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const touch = window.__mobileCarouselTouch;
        return {y: scrollY, currentId: window.__puntoes.getState().tour.currentId,
          touch: {x: touch.x, count: touch.count, paintedCount: touch.paintedCount, trusted: touch.trusted},
          viewport: {left: rect.left, right: rect.right},
          logos: [...el.querySelectorAll('.city-client')].map(button => {
            const logo = button.querySelector('img');
            const bounds = (logo.hidden ? button.querySelector('span') : logo).getBoundingClientRect();
            return {id: button.dataset.client, left: bounds.left, right: bounds.right,
              center: (bounds.left + bounds.right) / 2};
          })};
      });
      await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x:fromX,y,id:1}]});
      await delivered(fromX);
      await page.waitForTimeout(120);
      const before = await position(), frames = [], continuity = [];
      let prior = before, visibleTravel = 0;
      for (let i = 1; i <= 10; i++) {
        const x = fromX + (toX - fromX) * i / 10;
        await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x,y,id:1}]});
        await page.waitForTimeout(25);
        // CDP can deliver a move after its request resolves under paint load.
        // Inspect the trusted TouchEvent after its RAF, not an undelivered request.
        await delivered(x);
        const frame = await position();
        // A recycled, fully clipped logo can wrap by the whole track width.
        // Compare identities visible in both frames, using their real widths.
        const visible = (logo, snapshot) => logo.left < snapshot.viewport.right && logo.right > snapshot.viewport.left;
        const samples = frame.logos.flatMap(logo => {
          const old = prior.logos.find(candidate => candidate.id === logo.id);
          return old && visible(old, prior) && visible(logo, frame)
            ? [{id: logo.id, expected: frame.touch.x - prior.touch.x, actual: logo.center - old.center}] : [];
        });
        assert.ok(samples.length, `${direction}: consecutive native moves share a visible logo`);
        assert.ok(samples.every(sample => Math.abs(sample.actual - sample.expected) < 2),
          `${direction}: visible logos follow the finger through recycling: ${JSON.stringify(samples)}`);
        visibleTravel += samples.reduce((sum, sample) => sum + sample.actual, 0) / samples.length;
        continuity.push(...samples);
        frames.push({x, ...frame});
        prior = frame;
      }
      assert.ok(Math.abs(visibleTravel - (toX - fromX)) < 4, `${direction}: the strip follows the full native drag`);
      assert.ok(Math.abs(visibleTravel) > 100, `${direction}: logos visibly travel across multiple items`);
      assert.ok(frames.some(frame => frame.logos[0].id !== before.logos[0].id), `${direction}: drag crosses a recycling boundary`);
      await page.waitForTimeout(120);
      const held = await position();
      assert.deepEqual(held.logos, frames.at(-1).logos, `${direction}: logos stay still under the held finger`);
      await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(200);
      const released = await position();
      await page.evaluate(() => window.__mobileCarouselTouch.cleanup());
      for (const frame of [before, ...frames, held, released]) {
        assert.equal(frame.currentId, 'bbva', `${direction}: horizontal browsing does not visit a building`);
        assert.ok(Math.abs(frame.y - anchor) < 2, `${direction}: horizontal browsing keeps the document pinned`);
        assert.equal(frame.logos.length, 10);
        assert.equal(new Set(frame.logos.map(logo => logo.id)).size, 10, `${direction}: recycling retains ten unique client buttons`);
      }
      return {direction, fromX, toX, y, before, frames, held, released, continuity, visibleTravel};
    }
    async function load() {
      await page.goto(base+'?city=0');
      await page.waitForFunction(() => window.__puntoes?.getState().city?.ready && window.__puntoes.getState().tour.active);
      await page.waitForTimeout(300);
    }
    await load();
    const anchor=(await state()).y;
    assert.equal((await state()).currentId,'puntoes');
    assert.equal(await page.locator('.city-client').count(),10);
    assert.equal(await page.locator('.city-tour-card').count(),11);
    assert.equal(await page.locator('.city-tour-controls,.city-perspective-control, .city-tour-card details').count(),0);
    assert.equal(await page.locator('.city-carousel').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
    // Taps and ambiguous or horizontal movement never advance the tour.
    await swipe({distance:3,samples:1,settle:100});
    await swipe({distance:100,dx:120,samples:20,settle:100});
    await swipe({distance:0,dx:80,samples:20,settle:100});
    assert.equal((await state()).currentId,'puntoes');
    assert.ok(Math.abs((await state()).y-anchor)<2);
    const slow=await swipe({arrival:'bbva'}); // every native move is only 3px
    assert.equal((await state()).currentId,'bbva');
    assert.ok(slow.every(f=>Math.abs(f.y-anchor)<2),'document is pinned throughout slow swipe');
    assert.ok(new Set(slow.map(f=>f.transform)).size>5,'camera animates independently');
    await page.waitForTimeout(1400);
    assert.equal((await state()).currentId,'bbva','no idle inertia steps');
    const bbva=page.locator('.city-tour-card.is-current');
    const metrics=await bbva.evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),client:el.clientHeight,scroll:el.scrollHeight,intro:getComputedStyle(el.querySelector('.tour-card-intro')).webkitLineClamp,overflow:getComputedStyle(el).overflowY}));
    const footer=await page.locator('.city-carousel').boundingBox();
    assert.ok(metrics.rect.y>100 && metrics.rect.bottom < footer.y,'whole card fits above logos');
    assert.ok(metrics.scroll<=metrics.client+1,'card has no hidden overflowing contents');
    assert.equal(metrics.intro,'3'); assert.equal(metrics.overflow,'hidden');
    assert.ok((await bbva.locator('a').getAttribute('href')).endsWith('/clientes/bbva/'));
    await page.screenshot({path:`${out}/${width}-bbva.png`});
    // A swipe that outlasts the entire trip still owns only one stop.
    await swipe({distance:180,samples:60,delay:30,settle:500,arrival:'naturgy'});
    assert.equal((await state()).currentId,'naturgy');
    await page.mouse.wheel(0,100); await page.waitForTimeout(100);
    await page.mouse.wheel(0,30); await waitForTourArrival(page,'sabadell');
    assert.equal((await state()).currentId,'sabadell');
    await page.mouse.wheel(0,12); await page.waitForTimeout(100);
    await page.mouse.wheel(0,5); await page.waitForTimeout(1000);
    assert.equal((await state()).currentId,'sabadell','decaying wheel residual stays consumed');
    assert.ok((await state()).active);
    // A card is a swipe surface, not a text scroller.
    const cardBox=await page.locator('.city-tour-card.is-current').boundingBox();
    await swipe({y:cardBox.y+80,distance:120,arrival:'collaborate'});
    assert.equal((await state()).currentId,'collaborate');
    assert.equal(await page.locator('.city-tour-card.is-current a').textContent(),'Hablemos ↗');
    const exitBefore=(await state()).y;
    const exit=await swipe({distance:height*.22,samples:30,settle:400});
    const exitAfter=(await state()).y;
    assert.ok(exitAfter>exitBefore+60,'new final gesture leaves natively');
    assert.ok(exitAfter-exitBefore<height*.22+50,'native exit follows finger distance');
    const translation=await page.locator('.trust-frame').evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
    assert.ok(Math.abs(translation+(exitAfter-anchor))<3);
    await page.screenshot({path:`${out}/${width}-exit.png`});
    await swipe({distance:-height*.4,y:height*.3,samples:35,arrival:'collaborate'});
    assert.equal((await state()).currentId,'collaborate'); assert.ok((await state()).active);
    assert.ok(Math.abs((await state()).y-anchor)<2,'reverse captures last stop');
    await swipe({distance:-120,y:height*.3,arrival:'sabadell'});
    assert.equal((await state()).currentId,'sabadell');
    // Selecting Cepsa cancels other companies and leaves only collaboration.
    const cepsa=page.locator('.city-client[data-client="cepsa"]');
    await cepsa.focus(); await cepsa.tap(); await waitForTourArrival(page,'cepsa');
    assert.equal((await state()).currentId,'cepsa');
    assert.equal(await page.locator('.city-tour-card.is-current').getAttribute('data-client'),'cepsa');
    const cepsaCamera=await page.locator('.city-world').getAttribute('style');
    await page.waitForTimeout(600); assert.equal(await page.locator('.city-world').getAttribute('style'),cepsaCamera);
    await swipe({arrival:'collaborate'}); assert.equal((await state()).currentId,'collaborate');
    // All 11 cards remain unique, including recovered manual clients.
    for (const id of ['accenture','bbva','canal','cepsa','mapfre','mediaset','ree','siemens','naturgy','sabadell']) {
      const logo=page.locator(`.city-client[data-client="${id}"]`);
      await logo.focus(); await logo.tap(); await waitForTourArrival(page,id);
      assert.equal((await state()).currentId,id);
      assert.equal(await page.locator('.city-tour-card.is-current').count(),1);
      const bounds=await page.locator('.city-tour-card.is-current').evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),overflow:el.scrollHeight-el.clientHeight}));
      assert.ok(bounds.rect.bottom<footer.y && bounds.rect.y>100,`fits ${id}`);
      assert.ok(bounds.overflow<=1,`no clipped content ${id}`);
    }
    assert.equal(new Set(await page.locator('.city-tour-card').evaluateAll(els=>els.map(e=>e.dataset.client))).size,11);
    // Verify real link navigation without creating the future destination.
    let destination;
    await page.route('**/clientes/sabadell/',async route=>{destination=route.request().url();await route.fulfill({contentType:'text/html',body:'Future case destination'});});
    await page.locator('.city-tour-card.is-current .tour-card-more').tap();
    await page.waitForURL('**/clientes/sabadell/'); assert.ok(destination.endsWith('/clientes/sabadell/'));
    await load();
    // Long approach from section 1 must land at the hub, consume the same swipe.
    // Use a chapter link to reset, then approach normally from the preceding area.
    const before=anchor-160;
    let preparationStep='load';
    try {
      await page.goto(base+'?scroll=970');
      await page.waitForFunction(()=>window.__puntoes?.getState().city);
      preparationStep='initial scroll marker';
      // The query scroll runs after fonts/load and two RAFs. Observe its result
      // before positioning the approach, so it cannot overwrite that position.
      await page.waitForFunction(()=>{
        const state=window.__puntoes.getState(), expected=state.handoffStart*.97;
        return expected>0 && Math.abs(scrollY-expected)<2 &&
          Math.abs(state.scroll.current-expected)<2 && Math.abs(state.scroll.target-expected)<2;
      });
      preparationStep='position approach';
      await page.evaluate(top=>scrollTo({top,behavior:'instant'}),before);
      preparationStep='city ready';
      await page.waitForFunction(()=>window.__puntoes.getState().city.ready);
    } catch(error) {
      const diagnostic={width,height,anchor,before,step:preparationStep,pageErrors:[...errors]};
      diagnostic.state=await page.evaluate(()=>{
        const state=window.__puntoes?.getState(), section=document.querySelector('#confianza'), third=document.querySelector('#posibilidades');
        return {time:performance.now(),url:location.href,readyState:document.readyState,fonts:document.fonts.status,y:scrollY,
          expectedQueryPoint:state?.handoffStart*.97,handoff:state?.handoffStart,visualProgress:state?.visualProgress,
          scroll:state?.scroll,city:state?.city,tour:state?.tour,sectionTop:section?.offsetTop,
          thirdDocTop:third?third.getBoundingClientRect().top+scrollY:null,limit:document.documentElement.scrollHeight-innerHeight,
          images:[...document.querySelectorAll('#city-image,#city-extension-image')].map(image=>({id:image.id,src:image.src,currentSrc:image.currentSrc,
            complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight}))};
      }).catch(snapshotError=>({snapshotError:String(snapshotError)}));
      diagnostic.screenshot=`${width}-preparation-failure.png`;
      await page.screenshot({path:`${out}/${diagnostic.screenshot}`}).catch(screenshotError=>{diagnostic.screenshotError=String(screenshotError)});
      report.preparationFailure=diagnostic;
      throw error;
    }
    await page.waitForTimeout(200);
    await swipe({distance:350,y:height*.75,samples:70,delay:20,arrival:'puntoes'});
    assert.equal((await state()).currentId,'puntoes'); assert.ok((await state()).active,JSON.stringify({before,anchor,state:await state()}));
    await swipe({arrival:'bbva'}); assert.equal((await state()).currentId,'bbva');
    // Horizontal carousel browsing stays local and does not visit a building.
    const carousel = [];
    carousel.push(await browseLogos('left'));
    carousel.push(await browseLogos('right'));
    assert.equal((await state()).currentId,'bbva');
    await page.locator('body').click({position:{x:width/2,y:180}});
    await page.keyboard.press('ArrowDown');await waitForTourArrival(page,'naturgy');
    assert.equal((await state()).currentId,'naturgy');
    // Active anchor follows a height resize; crossing 700px restores desktop.
    await page.setViewportSize({width,height:height+80});await page.waitForTimeout(300);
    assert.ok((await state()).active);assert.equal((await state()).currentId,'naturgy');
    await page.setViewportSize({width:900,height:600});await page.waitForTimeout(300);
    assert.equal(await page.locator('#confianza').evaluate(el=>el.classList.contains('city-mobile-tour')),false);
    await page.setViewportSize({width,height});await page.waitForTimeout(300);
    await page.locator('#open-clients').click();await page.waitForTimeout(1700);
    assert.equal((await state()).currentId,'puntoes');assert.ok((await state()).active);
    await page.locator('body').click({position:{x:width/2,y:180}});
    await page.keyboard.press('End');await page.waitForTimeout(300);
    assert.ok(!(await state()).active);
    assert.ok(await page.evaluate(()=>Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<2));
    await page.keyboard.press('Home');await page.waitForTimeout(300);
    assert.equal((await state()).y,0);
    await page.locator('#open-clients').click();await page.waitForTimeout(1700);
    assert.equal((await state()).currentId,'puntoes');
    // Reverse release from the hub also gives the next gesture to the page.
    await swipe({distance:-100,y:height*.3,settle:300});
    assert.ok((await state()).y<anchor-40);
    assert.deepEqual(errors,[]);
    report.phones.push({width,height,metrics,anchor,exitBefore,exitAfter,translation,slow,exit,carousel,errors});
    await context.close(); console.log(`PASS ${width}x${height}: native snap, slow/long swipe, wheel tail, cards, logos, link, native exit/reverse, long entrance`);
  }
  const cold=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
  const hashPage=await cold.newPage();
  await hashPage.goto(base+'#confianza');
  await hashPage.waitForFunction(()=>window.__puntoes?.getState().tour.active);
  await hashPage.waitForTimeout(3300);
  assert.ok(await hashPage.evaluate(()=>window.__puntoes.getState().tour.active),'cold fragment stays at hub');
  await hashPage.getByRole('link',{name:'El encuentro',exact:false}).click();await hashPage.waitForTimeout(1500);
  assert.ok(await hashPage.evaluate(()=>!window.__puntoes.getState().tour.active));
  await hashPage.goBack();await hashPage.waitForTimeout(1500);
  assert.ok(await hashPage.evaluate(()=>window.__puntoes.getState().tour.active),'history back enters city');
  await hashPage.goForward();await hashPage.waitForTimeout(1500);
  assert.ok(await hashPage.evaluate(()=>!window.__puntoes.getState().tour.active),'history forward leaves city');
  report.fragmentAndHistory=true;await cold.close();
  const reduce=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const reducePage=await reduce.newPage();await reducePage.goto(base+'?city=0');
  await reducePage.waitForFunction(()=>window.__puntoes?.getState().tour.active);
  await reducePage.locator('body').click({position:{x:190,y:180}});await reducePage.keyboard.press('ArrowDown');
  await waitForTourArrival(reducePage,'bbva');
  assert.equal(await reducePage.locator('.city-tour-card.is-current').getAttribute('data-client'),'bbva');
  assert.equal(await reducePage.evaluate(()=>window.__puntoes.getState().tour.moving),false);
  const reduceLogo=reducePage.locator('.city-client[data-client="cepsa"]');await reduceLogo.focus();await reduceLogo.tap();await waitForTourArrival(reducePage,'cepsa');
  assert.equal(await reducePage.locator('.city-tour-card.is-current').getAttribute('data-client'),'cepsa');
  assert.equal(await reducePage.evaluate(()=>window.__puntoes.getState().reduced),false,'hands preference preserved');
  report.reducedCity=true;await reduce.close();
  const desktop=await browser.newPage({viewport:{width:1424,height:873}});
  await desktop.goto(base+'?scroll=500');
  await desktop.waitForFunction(()=>window.__puntoes?.getState().scene);
  const hand=await desktop.evaluate(()=>({s:window.__puntoes.getState().scene,handoff:window.__puntoes.getState().handoffStart}));
  assert.equal(hand.s.poseAuthority,'absolute joint quaternion track');
  assert.equal(hand.s.humanMirror,-1);
  assert.equal(await desktop.locator('#confianza').evaluate(el=>el.classList.contains('city-mobile-tour')),false);
  await desktop.goto(base+'?city=.5');
  await desktop.waitForFunction(()=>window.__puntoes?.getState().city?.ready);
  const desktopY=await desktop.evaluate(()=>scrollY);
  await desktop.mouse.wheel(0,100);await desktop.waitForTimeout(1000);
  assert.ok(await desktop.evaluate(()=>scrollY)>desktopY+30,'desktop keeps continuous scroll');
  const logo=desktop.locator('.city-client[data-client="bbva"]');
  await logo.focus();await logo.click();
  assert.ok(await desktop.locator('#city-case').evaluate(el=>el.open),'desktop case dialog retained');
  await desktop.keyboard.press('Escape');
  await desktop.close();
  report.desktop={handPoseAuthority:hand.s.poseAuthority,continuousScroll:true,caseDialog:true};
  report.passed=true;
} catch(error) {report.error=error.stack;process.exitCode=1;console.error(error)}
finally {await fs.writeFile(`${out}/REPORT.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
