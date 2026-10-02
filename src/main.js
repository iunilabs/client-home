import './section-three/style.css';
import {turnState} from './section-two/turn.js';
import {createCity} from './section-two/city.js';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import {mix,smooth} from './timeline.js';
import {introState} from './intro.js';
import {editorialState} from './editorial.js';
import {populateClients} from './clients.js';
import {createScrollMeter} from './scroll-meter.js';
import {createPerspectiveInput} from './perspective-input.js';
populateClients();
const trustSection=document.querySelector('#confianza'),nextSection=document.querySelector('#posibilidades');
const city=createCity(trustSection,{readScrollTarget:()=>lenis.targetScroll,onExtentChange:()=>{scrollLimit=Math.max(0,document.documentElement.scrollHeight-innerHeight);lenis.resize()},onNavigate:top=>{lenis.reset();lenis.scrollTo(top,{immediate:true});renderProgress=readProgress(top)}});
const motionPreference={matches:false};
let handoffStart=0,turnDistance=0,sectionProgress=0,paperScene=null,paperLoading=false,paperModule=null;
function cityIsHeld(){return innerWidth<700?city.getTourState().active:city.getEndGuardState().held}
function paperIsVisible(y){return !cityIsHeld()&&y+innerHeight>nextSection.offsetTop&&y<nextSection.offsetTop+nextSection.offsetHeight}
function preparePaperSection(){return paperModule??=import('./section-three/scene.js')}
async function loadPaperSection(){
 if(paperScene||paperLoading||!paperIsVisible(lenis?.scroll??scrollY))return;paperLoading=true;
 try{const {createPaperSection}=await preparePaperSection();if(disposed)return;if(!paperIsVisible(lenis?.scroll??scrollY)){paperLoading=false;return}const scene=await createPaperSection(nextSection);if(disposed){scene.dispose();return}paperScene=scene}
 catch(error){console.warn('Paper scene unavailable:',error.message);nextSection.querySelector('[data-paper-fallback]').hidden=false}
}
// Warm the module only. Textures, meshes and WebGL start after the city releases
// the page and the paper stage reaches the viewport. Visible loading owns errors.
const paperObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){preparePaperSection().catch(()=>{});paperObserver.disconnect()}},{rootMargin:'150% 0px'});
paperObserver.observe(nextSection);
function readProgress(y){return y<=handoffStart?5*y/handoffStart:5+(y-handoffStart)/turnDistance}
const updateScrollMeter=createScrollMeter(document.querySelector('[data-scroll-meter]'));
const chapters=[...document.querySelectorAll('[data-scene]')],copies=chapters.map(c=>c.querySelector('.chapter-copy')),labels=['LA APARICIÓN','LA PIEDRA','EL COMPÁS','LA LLAVE','EL ENCUENTRO'];
const stateElement=document.querySelector('.render-state'),modal=document.querySelector('#clients-dialog');
const GYROSCOPE_PARALLAX_REDUCTION=1.5;
history.scrollRestoration='manual';if(!location.hash)window.scrollTo({top:0,behavior:'instant'});
const lenis=new Lenis({autoRaf:false,lerp:.075,smoothWheel:true,syncTouch:false,overscroll:false});
let experience=null,perspectiveInput=null,offsets=[],scrollLimit=0,pointer={x:0,y:0},smoothPointer={x:0,y:0},renderProgress=0,lastFrame=0,lastScroll=performance.now(),disposed=false,activeIndex=-1;
function updateOffsets(){city.resize();paperScene?.resize();scrollLimit=Math.max(0,document.documentElement.scrollHeight-innerHeight);handoffStart=trustSection.offsetTop-innerHeight+90;turnDistance=innerHeight*1.35;offsets=chapters.map(c=>c.offsetTop);offsets.push(Math.max(chapters.at(-1).offsetTop+1,scrollLimit));lenis?.resize()}
updateOffsets();window.addEventListener('resize',updateOffsets);
function navigateTo(target,immediate=false){city.prepareNavigation(target===trustSection);const index=target?.dataset?.scene;const top=index==='4'?handoffStart:target===trustSection?(city.entryScrollAt()??(innerWidth<700?city.scrollAt(0):handoffStart+turnDistance)):target?.offsetTop??0;if(lenis)lenis.scrollTo(top,{immediate,duration:1.2,lerp:0,easing:t=>1-(1-t)**3,onComplete:()=>city.finishNavigation()});else {city.finishNavigation();window.scrollTo({top,behavior:'instant'})}}
// Initial fragment scrolling can run after fonts.ready. Resolve it after the
// document load and layout, so the browser cannot overwrite the city anchor.
const initialLayout=Promise.all([document.fonts.ready,new Promise(resolve=>{if(document.readyState==='complete')resolve();else window.addEventListener('load',resolve,{once:true})})]);
initialLayout.then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{updateOffsets();const params=new URLSearchParams(location.search),cityMarker=params.get('city'),paperMarker=params.get('paper');if(!location.hash&&paperMarker!==null&&Number.isFinite(Number(paperMarker))){city.prepareNavigation(false);const top=nextSection.offsetTop+Math.max(0,Math.min(1,Number(paperMarker)))*(nextSection.offsetHeight-innerHeight);lenis.reset();lenis.scrollTo(top,{immediate:true,onComplete:()=>city.finishNavigation()});renderProgress=readProgress(top);loadPaperSection()}else if(!location.hash&&cityMarker!==null&&Number.isFinite(Number(cityMarker))){const top=city.scrollAt(Number(cityMarker));lenis.scrollTo(top,{immediate:true});renderProgress=readProgress(top);city.load()}else if(location.hash)navigateTo(document.querySelector(location.hash),true);else{const marker=params.get('scroll');if(marker!==null&&Number.isFinite(Number(marker))){const top=handoffStart*Math.max(0,Math.min(1000,Number(marker)))/1000;if(lenis)lenis.scrollTo(top,{immediate:true});else scrollTo({top,behavior:'instant'});renderProgress=readProgress(top)}}})));
perspectiveInput=createPerspectiveInput(window,{onChange(value){pointer=value;document.documentElement.style.setProperty('--mx',`${(value.x+1)*innerWidth/2}px`);document.documentElement.style.setProperty('--my',`${(1-value.y)*innerHeight/2}px`)}});
window.addEventListener('scroll',()=>{city.anchorScroll(scrollY);lastScroll=performance.now();document.querySelector('.scroll-cue').classList.remove('visible')},{passive:true});
window.addEventListener('keydown',e=>{if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey||modal.open||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key)&&lenis?.isScrolling==='smooth')lenis.scrollTo(lenis.actualScroll,{immediate:true})},{passive:true});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{const target=document.querySelector(link.getAttribute('href'));if(!target)return;e.preventDefault();history.pushState(null,'',link.getAttribute('href'));if(modal.open)modal.close();navigateTo(target);target.setAttribute('tabindex','-1');target.focus({preventScroll:true})}));
window.addEventListener('hashchange',()=>navigateTo(location.hash?document.querySelector(location.hash):null,true));
window.addEventListener('popstate',()=>{navigateTo(location.hash?document.querySelector(location.hash):null,true);renderProgress=readProgress(scrollY)});
document.querySelector('#open-clients').addEventListener('click',()=>{history.pushState(null,'','#confianza');navigateTo(trustSection)});modal.querySelector('.dialog-close').addEventListener('click',()=>modal.close());modal.addEventListener('close',()=>lenis?.start());modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}});
document.body.classList.add('enhanced');
let lastEditorial=null,lastCity=null;
function activate(progress){
 const editorial=editorialState(Math.min(progress,5)/5),{index}=editorial;
 const transition=turnState(Math.max(0,progress-5),0,motionPreference.matches);
 const visualScroll=progress<=5?progress/5*handoffStart:handoffStart+(progress-5)*turnDistance;
 lastCity=city.update(visualScroll,motionPreference.matches);
 document.body.classList.toggle('trust-active',progress>5);
 const entrance=introState(progress);
 document.documentElement.style.setProperty('--reveal-light',String(entrance.lightOpacity));document.documentElement.style.setProperty('--reveal-radius',`${entrance.lightRadius}px`);
 document.documentElement.style.setProperty('--replay-opacity',String(smooth(4.5,4.72,progress)*(1-smooth(5,5.15,progress))));
 document.body.classList.toggle('intro-active',progress<1);
 lastEditorial=editorial;
 editorial.beats.forEach((beat,i)=>{copies[i].style.setProperty('--copy-opacity',String(beat.opacity*transition.encounterOpacity));copies[i].style.setProperty('--copy-y',`${beat.y}px`);copies[i].style.setProperty('--copy-blur',`${beat.blur}px`)});
 if(index!==activeIndex){activeIndex=index;chapters.forEach((c,i)=>{c.classList.toggle('is-active',i===index);c.querySelector('.chapter-inner').inert=i!==index});document.querySelector('#chapter-label').textContent=labels[index];document.querySelector('#chapter-count').textContent=`${String(index+1).padStart(2,'0')} / 05`}
 chapters.at(-1).querySelector('.chapter-inner').inert=progress>5.22||index!==4;
 chapters.at(-1).querySelector('.chapter-inner').setAttribute('aria-hidden',String(progress>5.22||index!==4));
 document.querySelector('.replay').inert=progress<4.5||progress>5;
 const nextActive=!cityIsHeld()&&visualScroll>=nextSection.offsetTop-innerHeight*.5;
 document.body.classList.toggle('next-active',nextActive);
 if(nextActive){document.querySelector('#chapter-label').textContent='EL TRABAJO PENDIENTE';document.querySelector('#chapter-count').textContent='03 / 03'}else if(progress>5){document.querySelector('#chapter-label').textContent='UN PUNTO EN COMÚN';document.querySelector('#chapter-count').textContent='02 / 03'}else{document.querySelector('#chapter-label').textContent=labels[index];document.querySelector('#chapter-count').textContent=`${String(index+1).padStart(2,'0')} / 05`}
}
function fallback(error){console.warn('3D unavailable:',error.message);document.body.classList.add('webgl-fallback');stateElement.textContent='Vista sin 3D';document.body.dataset.render='fallback'}
import('./scene.js').then(({createExperience})=>createExperience(document.querySelector('#scene'),{onReady(){document.body.classList.add('scene-ready');document.body.dataset.render='webgl';stateElement.textContent=''},onFailure:fallback})).then(value=>{experience=value}).catch(fallback);
function frame(now){
 if(disposed)return;
 city.anchorScroll(scrollY);
 if(lenis&&!lenis.isStopped&&lenis.isScrolling!=='smooth'&&Math.abs(lenis.actualScroll-lenis.scroll)>1)lenis.scrollTo(lenis.actualScroll,{immediate:true});lenis?.raf(now);city.anchorScroll(scrollY);
 if(!document.hidden){const y=lenis?.scroll??scrollY,paperTop=nextSection.offsetTop;updateScrollMeter(y<paperTop?(y<=handoffStart?y:y-handoffStart):y-paperTop,y<paperTop?(y<=handoffStart?handoffStart:Math.max(1,paperTop-handoffStart)):Math.max(1,nextSection.offsetHeight-innerHeight))}
 if(!document.hidden){
  const dt=Math.min((now-lastFrame)/1000,.1),response=perspectiveInput.getResponseRate();lastFrame=now;smoothPointer.x=mix(smoothPointer.x,pointer.x,1-Math.exp(-dt*response));smoothPointer.y=mix(smoothPointer.y,pointer.y,1-Math.exp(-dt*response));
  const target=readProgress(lenis?.scroll??scrollY);renderProgress=mix(renderProgress,target,1-Math.exp(-dt/.09));if(Math.abs(target-renderProgress)<.0001)renderProgress=target;
  activate(renderProgress);const visual=Math.min(5,renderProgress);sectionProgress=Math.max(0,renderProgress-5);
  const paperY=lenis?.scroll??scrollY,paperVisible=paperIsVisible(paperY);
  document.body.classList.toggle('paper-active',paperVisible&&paperY>=nextSection.offsetTop);
  if(paperVisible&&!paperScene)loadPaperSection();paperScene?.update(now,paperY,paperVisible);
  const parallaxScale=perspectiveInput.getState().source==='orientation'?1/GYROSCOPE_PARALLAX_REDUCTION:1;
  // The city uses a rendered image: stop paying for the hidden hand scene.
  if(!lastCity?.ready||!lastCity.revealed)experience?.render(visual,{x:smoothPointer.x*parallaxScale,y:smoothPointer.y*parallaxScale},now/1000,motionPreference.matches,visual/5,pointer,sectionProgress);
  document.querySelector('.scroll-cue').classList.toggle('visible',now-lastScroll>2600&&renderProgress<4.5);
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);window.addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;perspectiveInput?.dispose();lenis?.destroy();experience?.dispose();city.dispose();paperObserver.disconnect();paperScene?.dispose()});
window.__puntoes={getPaperReview:()=>paperScene?.getReview().cards()??[],measureWrenchFraming:()=>experience?.measureWrenchFraming(),measureClearances:()=>experience?.measureClearances(),getState:()=>({render:document.body.dataset.render,progress:readProgress(scrollY),sectionProgress,handoffStart,turnDistance,visualProgress:renderProgress,editorial:lastEditorial,city:lastCity,paper:paperScene?.getState()??null,tour:city.getTourState(),endGuard:city.getEndGuardState(),scroll:{engine:lenis?'lenis':'native',current:lenis?.scroll??scrollY,target:lenis?.targetScroll??scrollY,moving:lenis?.isScrolling??false},reduced:motionPreference.matches,perspectiveInput:perspectiveInput?.getState(),pointer:{...smoothPointer},scene:experience?.getState()})};
