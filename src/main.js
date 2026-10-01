import './style.css';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import {mix,smooth} from './timeline.js';
import {introState} from './intro.js';
import {editorialState} from './editorial.js';
import {populateClients} from './clients.js';
import {createScrollMeter} from './scroll-meter.js';
import {createPerspectiveInput} from './perspective-input.js';
populateClients();
const updateScrollMeter=createScrollMeter(document.querySelector('[data-scroll-meter]'));
const chapters=[...document.querySelectorAll('[data-scene]')],copies=chapters.map(c=>c.querySelector('.chapter-copy')),labels=['LA APARICIÓN','LA PIEDRA','EL COMPÁS','LA LLAVE','EL ENCUENTRO'];
const stateElement=document.querySelector('.render-state'),modal=document.querySelector('#clients-dialog');
const GYROSCOPE_PARALLAX_REDUCTION=1.5;
history.scrollRestoration='manual';if(!location.hash)window.scrollTo({top:0,behavior:'instant'});
const lenis=new Lenis({autoRaf:false,lerp:.075,smoothWheel:true,syncTouch:false,overscroll:false});
let experience=null,perspectiveInput=null,offsets=[],scrollLimit=0,pointer={x:0,y:0},smoothPointer={x:0,y:0},renderProgress=0,lastFrame=0,lastScroll=performance.now(),disposed=false,activeIndex=-1;
function updateOffsets(){scrollLimit=Math.max(0,document.documentElement.scrollHeight-innerHeight);offsets=chapters.map(c=>c.offsetTop);offsets.push(Math.max(chapters.at(-1).offsetTop+1,scrollLimit));lenis?.resize()}
updateOffsets();window.addEventListener('resize',updateOffsets);
function navigateTo(target,immediate=false){const index=target?.dataset?.scene;const top=index==='4'?scrollLimit:target?.offsetTop??0;if(lenis)lenis.scrollTo(top,{immediate,duration:1.2,lerp:0,easing:t=>1-(1-t)**3});else window.scrollTo({top,behavior:'instant'})}
document.fonts.ready.then(()=>{updateOffsets();if(location.hash)navigateTo(document.querySelector(location.hash),true);else{const marker=new URLSearchParams(location.search).get('scroll');if(marker!==null&&Number.isFinite(Number(marker))){const top=scrollLimit*Math.max(0,Math.min(1000,Number(marker)))/1000;if(lenis)lenis.scrollTo(top,{immediate:true});else scrollTo({top,behavior:'instant'});renderProgress=scrollLimit?top/scrollLimit*5:0}}});
perspectiveInput=createPerspectiveInput(window,{onChange(value){pointer=value;document.documentElement.style.setProperty('--mx',`${(value.x+1)*innerWidth/2}px`);document.documentElement.style.setProperty('--my',`${(1-value.y)*innerHeight/2}px`)}});
window.addEventListener('scroll',()=>{lastScroll=performance.now();document.querySelector('.scroll-cue').classList.remove('visible')},{passive:true});
window.addEventListener('keydown',e=>{if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey||modal.open||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key)&&lenis?.isScrolling==='smooth')lenis.scrollTo(lenis.actualScroll,{immediate:true})},{passive:true});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{const target=document.querySelector(link.getAttribute('href'));if(!target)return;e.preventDefault();history.pushState(null,'',link.getAttribute('href'));if(modal.open)modal.close();navigateTo(target);target.setAttribute('tabindex','-1');target.focus({preventScroll:true})}));
window.addEventListener('popstate',()=>{navigateTo(location.hash?document.querySelector(location.hash):null,true);renderProgress=scrollLimit?scrollY/scrollLimit*5:0});
document.querySelector('#open-clients').addEventListener('click',()=>{modal.showModal();lenis?.stop()});modal.querySelector('.dialog-close').addEventListener('click',()=>modal.close());modal.addEventListener('close',()=>lenis?.start());modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}});
document.body.classList.add('enhanced');
let lastEditorial=null;
function activate(progress){
 const editorial=editorialState(progress/5),{index}=editorial;
 const entrance=introState(progress);
 document.documentElement.style.setProperty('--reveal-light',String(entrance.lightOpacity));document.documentElement.style.setProperty('--reveal-radius',`${entrance.lightRadius}px`);
 document.documentElement.style.setProperty('--replay-opacity',String(smooth(4.5,4.72,progress)));
 document.body.classList.toggle('intro-active',progress<1);
 lastEditorial=editorial;
 editorial.beats.forEach((beat,i)=>{copies[i].style.setProperty('--copy-opacity',String(beat.opacity));copies[i].style.setProperty('--copy-y',`${beat.y}px`);copies[i].style.setProperty('--copy-blur',`${beat.blur}px`)});
 if(index!==activeIndex){activeIndex=index;chapters.forEach((c,i)=>{c.classList.toggle('is-active',i===index);c.querySelector('.chapter-inner').inert=i!==index});document.querySelector('#chapter-label').textContent=labels[index];document.querySelector('#chapter-count').textContent=`${String(index+1).padStart(2,'0')} / 05`}
 document.querySelector('.replay').inert=progress<4.5;
}
function fallback(error){console.warn('3D unavailable:',error.message);document.body.classList.add('webgl-fallback');stateElement.textContent='Vista sin 3D';document.body.dataset.render='fallback'}
import('./scene.js').then(({createExperience})=>createExperience(document.querySelector('#scene'),{onReady(){document.body.classList.add('scene-ready');document.body.dataset.render='webgl';stateElement.textContent=''},onFailure:fallback})).then(value=>{experience=value}).catch(fallback);
function frame(now){
 if(disposed)return;
 if(lenis&&!lenis.isStopped&&lenis.isScrolling!=='smooth'&&Math.abs(lenis.actualScroll-lenis.scroll)>1)lenis.scrollTo(lenis.actualScroll,{immediate:true});lenis?.raf(now);
 if(!document.hidden)updateScrollMeter(lenis?.scroll??scrollY,scrollLimit);
 if(!document.hidden){
  const dt=Math.min((now-lastFrame)/1000,.1),response=perspectiveInput.getResponseRate();lastFrame=now;smoothPointer.x=mix(smoothPointer.x,pointer.x,1-Math.exp(-dt*response));smoothPointer.y=mix(smoothPointer.y,pointer.y,1-Math.exp(-dt*response));
  const target=scrollLimit?5*(lenis?.scroll??scrollY)/scrollLimit:0;renderProgress=mix(renderProgress,target,1-Math.exp(-dt/.09));if(Math.abs(target-renderProgress)<.0001)renderProgress=target;
  activate(renderProgress);const visual=renderProgress;
  const parallaxScale=perspectiveInput.getState().source==='orientation'?1/GYROSCOPE_PARALLAX_REDUCTION:1;
  experience?.render(visual,{x:smoothPointer.x*parallaxScale,y:smoothPointer.y*parallaxScale},now/1000,false,visual/5,pointer);
  document.querySelector('.scroll-cue').classList.toggle('visible',now-lastScroll>2600&&renderProgress<4.5);
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);window.addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;perspectiveInput?.dispose();lenis?.destroy();experience?.dispose()});
window.__puntoes={measureWrenchFraming:()=>experience?.measureWrenchFraming(),measureClearances:()=>experience?.measureClearances(),getState:()=>({render:document.body.dataset.render,progress:scrollLimit?scrollY/scrollLimit*5:0,visualProgress:renderProgress,editorial:lastEditorial,scroll:{engine:lenis?'lenis':'native',current:lenis?.scroll??scrollY,target:lenis?.targetScroll??scrollY,moving:lenis?.isScrolling??false},reduced:false,perspectiveInput:perspectiveInput?.getState(),pointer:{...smoothPointer},scene:experience?.getState()})};
