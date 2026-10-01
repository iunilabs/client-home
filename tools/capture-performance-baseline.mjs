import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const out='docs/performance-2026-10-01',browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4180/');await page.waitForFunction(()=>window.__puntoes?.getState().scene,{timeout:60000});
 const states=[];for(const marker of [0,250,500,820,1000]){await page.evaluate(m=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*m/1000),marker);await page.waitForTimeout(600);await page.screenshot({path:`${out}/before-${marker}.png`});states.push({marker,state:await page.evaluate(()=>window.__puntoes.getState())})}
 await writeFile(`${out}/before-states.json`,JSON.stringify(states,null,2));
 const seams=await page.evaluate(async()=>{const THREE=await import('/node_modules/.vite/deps/three.js');const {createReferenceHand}=await import('/src/reference-hand.js');const renderer=new THREE.WebGLRenderer();const hand=await createReferenceHand(renderer,{detail:1});const attributes={};for(const name of ['position','uv','skinCreaseArea','fingerPadMask','fingerPadUv']){const a=hand.skin.geometry.attributes[name];if(a)attributes[name]=Array.from(a.array)};return {attributes,correction:Array.from(hand.skin.geometry.attributes.skinSeamCorrection.array),seams:hand.skinContinuity.seams}});
 await writeFile(`${out}/seam-source.json`,JSON.stringify(seams));console.log('Baseline móvil y correcciones de piel capturados');
}finally{await browser.close()}
