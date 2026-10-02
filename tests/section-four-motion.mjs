import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

// Compare continuous motion, not merely time to load the section. SOFTWARE=1
// provides a repeatable slow GPU; timings remain diagnostic rather than a CI SLA.
const origin = process.env.MOTION_URL || process.env.SECTION4_URL || 'http://127.0.0.1:4318/';
const browser = await chromium.launch({headless: true, channel: 'chrome',
  args: process.env.SOFTWARE ? ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] : []});
try {
  const context = await browser.newContext({viewport: {width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:3});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  await page.goto(origin + '?resolution=.31');
  await page.waitForFunction(() => window.__puntoes?.getState().paper?.resolution.ordered === 1 && window.__puntoes.getState().render === 'webgl', null, {timeout:60000});
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:4});
  const report = await page.evaluate(async () => {
    const gaps = [], cpus = [], states = [];
    let previous = performance.now();
    for (let i=0; i<150; i++) {
      await new Promise(requestAnimationFrame);
      const now = performance.now(); gaps.push(now-previous); previous=now;
      const j=window.__puntoes.getState().paper.journey, p=.31+.61*i/149;
      scrollTo(0,j.start+j.chaosRange+j.workflowRange*p);
      const state=window.__puntoes.getState().paper;
      cpus.push(state.averageCpuMs);
      states.push({progress:state.resolution.progress,calls:state.drawCalls,performance:state.performance});
    }
    const sorted=gaps.slice(10).sort((a,b)=>a-b);
    return {median:Math.round(sorted[Math.floor(sorted.length/2)]),p95:Math.round(sorted[Math.floor(sorted.length*.95)]),
      max:Math.round(Math.max(...sorted)),meanCpu:Math.round(cpus.at(-1)*100)/100,
      states:[states[0],states[70],states.at(-1)],fps:Math.round(1000/(sorted.reduce((a,b)=>a+b,0)/sorted.length))};
  });
  assert.deepEqual(errors,[]);
  for (const state of report.states) {
    assert.ok(state.performance.flatCards>=46, 'only the moving card needs flexible geometry');
    assert.ok(state.performance.triangles<18000, 'the stacks keep a bounded GPU cost');
    assert.ok(state.performance.pixelRatio<=2); assert.ok(state.performance.shadowSize<=1024);
  }
  // Camera movement changes lighting, but does not move the papers or key light.
  await page.evaluate(() => {const j=window.__puntoes.getState().paper.journey; scrollTo(0,j.start+j.chaosRange+j.workflowRange*.95);});
  await page.waitForFunction(() => Math.abs(window.__puntoes.getState().paper.resolution.progress - .95) < .001);
  await page.evaluate(() => dispatchEvent(new DeviceOrientationEvent('deviceorientation',{beta:25,gamma:10})));
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.__puntoes.getState().paper.performance.shadowsUpdated),false, 'gyro does not rebuild stationary shadows');
  await writeFile(`/tmp/puntoes-four-motion-${process.env.LABEL||'current'}.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} catch (error) {console.error(error); process.exitCode=1;}
finally {await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]); process.exit(process.exitCode||0);}
