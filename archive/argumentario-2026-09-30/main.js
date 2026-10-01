import './style.css';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { sceneProgress,mix } from './timeline.js';
import { editorialState,editorialDestination } from './editorial.js';
import { populateClients,createClientScene,worldProgress } from './clients.js';
import { introState } from './intro.js';
populateClients();

const chapters=[...document.querySelectorAll('[data-scene]')];
const labels=['EL ORIGEN','DAR FORMA','LA IDEA','EL ALCANCE','EL PRESENTE','EL ENCUENTRO','EN TUS MANOS','EL CRITERIO','FORMACIÓN','CONSULTORÍA','ACOMPAÑAMIENTO','EL PROPÓSITO','LOS CLIENTES','TU PROYECTO'];
const media=matchMedia('(prefers-reduced-motion: reduce)');
history.scrollRestoration='manual';
if(!location.hash)window.scrollTo({top:0,behavior:'instant'});
let reduced=media.matches,experience=null,lenis=null,offsets=[],pointer={x:0,y:0},smoothPointer={x:0,y:0},lastScroll=performance.now(),lastFrame=0,disposed=false,renderProgress=0;
const stateElement=document.querySelector('.render-state'),motionButton=document.querySelector('#motion-toggle');
const copyBeats=chapters.map(chapter=>[...chapter.querySelectorAll('[data-copy-beat]')]);
function updateOffsets(){offsets=chapters.map(c=>c.offsetTop);offsets.push(document.querySelector('footer').offsetTop);lenis?.resize()}
function setReduced(value){
  reduced=value;lenis?.destroy();lenis=null;
  if(!value){
    lenis=new Lenis({autoRaf:false,lerp:.075,smoothWheel:true,syncTouch:false,overscroll:false});
    if(document.querySelector('dialog[open]'))lenis.stop();
  }
  renderProgress=offsets.length?sceneProgress(offsets,scrollY):0;
  document.body.classList.toggle('reduced-motion',value);
  motionButton.setAttribute('aria-pressed',String(value));motionButton.textContent=value?'Movimiento reducido':'Reducir movimiento';
}
setReduced(reduced);updateOffsets();
motionButton.addEventListener('click',()=>setReduced(!reduced));media.addEventListener('change',e=>setReduced(e.matches));
window.addEventListener('resize',updateOffsets);document.fonts.ready.then(()=>{updateOffsets();if(location.hash){const target=document.querySelector(location.hash);if(target)navigateTo(target,true)}});
function trackPointer(event){
  if(event.pointerType==='touch')return;
  pointer.x=Math.max(-1,Math.min(1,event.clientX/innerWidth*2-1));pointer.y=Math.max(-1,Math.min(1,1-event.clientY/innerHeight*2));
  document.documentElement.style.setProperty('--mx',`${event.clientX}px`);document.documentElement.style.setProperty('--my',`${event.clientY}px`);
}
window.addEventListener('pointermove',trackPointer,{passive:true});
// Keep the same response in browser surfaces that forward mouse events only.
window.addEventListener('mousemove',trackPointer,{passive:true});
window.addEventListener('blur',()=>{pointer={x:0,y:0}});
window.addEventListener('pointerout',event=>{
  if(!event.relatedTarget&&(event.clientX<=0||event.clientX>=innerWidth||event.clientY<=0||event.clientY>=innerHeight))pointer={x:0,y:0};
});
window.addEventListener('scroll',()=>{lastScroll=performance.now();document.querySelector('.scroll-cue').classList.remove('visible')},{passive:true});
window.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||document.querySelector('dialog[open]'))return;
  if(event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)&&lenis?.isScrolling==='smooth')lenis.scrollTo(lenis.actualScroll,{immediate:true});
},{passive:true});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const target=document.querySelector(link.getAttribute('href'));if(!target)return;
  event.preventDefault();history.pushState(null,'',link.getAttribute('href'));
  document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
  // Direct navigation skips the long narrative, using a short eased journey.
  // Wheel scrolling remains fully reversible and interruptible.
  navigateTo(target);
  target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
}));
function navigateTo(target,immediate=false){
  const index=target?.dataset?.scene;
  const top=index!==undefined?editorialDestination(Number(index),offsets):target?.offsetTop??0;
  if(lenis)lenis.scrollTo(top,{immediate,duration:1.2,lerp:0,easing:t=>1-(1-t)**3});
  else window.scrollTo({top,behavior:'instant'});
}
window.addEventListener('popstate',()=>{navigateTo(location.hash?document.querySelector(location.hash):null,true);renderProgress=sceneProgress(offsets,scrollY)});
document.body.classList.add('enhanced');
let activeIndex=-1,lastEditorial=null,clientScene=null;
function activateChapter(progress){
  const editorial=editorialState(progress,reduced||document.body.classList.contains('webgl-fallback'));
  const index=editorial.index;lastEditorial=editorial;
  document.body.classList.toggle('intro-active',progress<1);
  const entrance=introState(progress);
  document.documentElement.style.setProperty('--intro-lift',`${reduced?0:entrance.titleLift}px`);
  document.documentElement.style.setProperty('--reveal-light',String(reduced?0:entrance.lightOpacity));
  document.documentElement.style.setProperty('--reveal-radius',`${entrance.lightRadius}px`);
  if(index!==activeIndex){
    activeIndex=index;
    for(let i=0;i<chapters.length;i++){
      chapters[i].classList.toggle('is-active',i===index);
      const inner=chapters[i].querySelector('.chapter-inner');inner.inert=i!==index;
      chapters[i].querySelectorAll('a,button,summary').forEach(el=>{if(i===index)el.removeAttribute('tabindex');else el.setAttribute('tabindex','-1')});
    }
    document.querySelector('#chapter-label').textContent=labels[index];document.querySelector('#chapter-count').textContent=`${String(index+1).padStart(2,'0')} / ${chapters.length}`;
    document.body.dataset.mode=index===5?'encounter':index>0&&index<8?'narrative':'standard';document.body.classList.toggle('method-active',index===11);document.body.classList.toggle('clients-active',index===12);
  }
  const inner=chapters[index].querySelector('.chapter-inner');
  inner.style.opacity='1';
  for(const element of copyBeats[index]){
    const beat=editorial.beats[element.dataset.copyBeat];
    element.style.setProperty('--beat-opacity',String(beat.opacity));
    element.style.setProperty('--beat-y',`${beat.y}px`);
    // Fade-out must not leave invisible controls in the tab sequence. A focused
    // control keeps its information legible until focus moves away.
    const focused=element.matches(':focus-within');
    element.classList.toggle('beat-focused',focused);
    if(element.matches('a,button,details')||element.querySelector('a,button,summary'))element.inert=beat.opacity<.05&&!focused;
  }
}
function fallback(error){console.warn('3D unavailable:',error.message);document.body.classList.add('webgl-fallback');stateElement.textContent='Vista sin 3D';document.body.dataset.render='fallback'}
import('./scene.js').then(({createExperience})=>createExperience(document.querySelector('#scene'),{extendScene(context){clientScene=createClientScene(context);return {render({time,reduced}){clientScene.render(reduced&&activeIndex===12?12.48:renderProgress,time,reduced)}}},onReady(){document.body.classList.add('scene-ready');stateElement.textContent='';document.body.dataset.render='webgl'},onFailure:fallback})).then(value=>{experience=value}).catch(fallback);
function frame(now){
  if(disposed)return;
  // Scrollbar drags and native keyboard/API jumps may arrive just after Lenis
  // suppresses its own final scroll event. Reconcile once inertia has stopped.
  if(lenis&&!lenis.isStopped&&lenis.isScrolling!=='smooth'&&Math.abs(lenis.actualScroll-lenis.scroll)>1)lenis.scrollTo(lenis.actualScroll,{immediate:true});
  lenis?.raf(now);
  if(!document.hidden&&(!reduced||now-lastFrame>=80)){
    const dt=Math.min((now-lastFrame)/1000,.1);lastFrame=now;
    smoothPointer.x=mix(smoothPointer.x,pointer.x,1-Math.exp(-dt*5));smoothPointer.y=mix(smoothPointer.y,pointer.y,1-Math.exp(-dt*5));
    const target=sceneProgress(offsets,lenis?.scroll??scrollY);
    // A short, frame-rate-independent follow softens native touch/keyboard
    // steps too. Copy, objects and camera share this one narrative clock.
    renderProgress=reduced?target:mix(renderProgress,target,1-Math.exp(-dt/0.09));
    if(Math.abs(target-renderProgress)<.0001)renderProgress=target;
    const progress=renderProgress;
    activateChapter(progress);
    const visualProgress=reduced?(activeIndex===0?0:activeIndex===5?5.65:activeIndex===6?6.95:activeIndex+.35):progress;
    if(experience)experience.render(worldProgress(visualProgress),smoothPointer,reduced?0:now/1000,reduced);
    document.querySelector('.scroll-cue').classList.toggle('visible',now-lastScroll>2600&&progress<12.9);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;lenis?.destroy();experience?.dispose()});
// A diagnostic readout enables repeatable browser checks, without changing
// narrative progress or persisting it in cookies/sessionStorage.
window.__puntoes={getState:()=>({render:document.body.dataset.render,progress:sceneProgress(offsets,scrollY),visualProgress:renderProgress,editorial:lastEditorial,scroll:{engine:lenis?'lenis':'native',current:lenis?.scroll??scrollY,target:lenis?.targetScroll??scrollY,moving:lenis?.isScrolling??false},reduced,pointer:{...smoothPointer},clients:clientScene?.getState(),scene:experience?.getState()})};

const dialog=document.querySelector('#contact-dialog'),form=document.querySelector('#contact-form');
document.querySelector('#open-contact').addEventListener('click',()=>dialog.showModal());
const serviceDialog=document.querySelector('#service-dialog'),clientsDialog=document.querySelector('#clients-dialog');
for(const modal of [dialog,serviceDialog,clientsDialog]){
  modal.querySelector('.dialog-close').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}});
  modal.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))lenis?.start()});
}
// Opening a native dialog must freeze the background, including its inertia.
new MutationObserver(()=>{if(document.querySelector('dialog[open]'))lenis?.stop();else lenis?.start()}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
document.querySelectorAll('.service-detail summary').forEach(summary=>summary.addEventListener('click',event=>{
  event.preventDefault();const detail=summary.closest('details');
  document.querySelector('#service-dialog-title').textContent=detail.dataset.interest;
  document.querySelector('#service-dialog-content').replaceChildren(detail.querySelector('.service-detail-content').cloneNode(true));
  form.elements.interest.value=detail.dataset.interest;
  serviceDialog.showModal();
}));
document.querySelectorAll('[data-interest]').forEach(a=>a.addEventListener('click',()=>{form.elements.interest.value=a.dataset.interest}));
form.addEventListener('submit',event=>{
  event.preventDefault();const data=new FormData(form);
  const text=`Consulta para Puntoes\n\nNombre: ${data.get('name')}\nEmpresa: ${data.get('company')}\nInterés: ${data.get('interest')}\n\n${data.get('message')}\n\nBorrador generado localmente. No se ha enviado a nadie.\n`;
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='consulta-puntoes.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  document.querySelector('#form-status').textContent='Borrador preparado. Se ha guardado como archivo; no se ha enviado.';
});

document.querySelector('#open-clients').addEventListener('click',()=>clientsDialog.showModal());
