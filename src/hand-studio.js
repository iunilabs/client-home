import {installAssetBase} from './asset-loading.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createPhotographicHand } from './photographic-hand.js';
import { createReferenceHand } from './reference-hand.js';
installAssetBase();

const viewport=document.querySelector('#hand-viewport'),main=document.querySelector('main');
let renderer,scene,camera,controls,human,previousHand,key,fill,rim,ready=false,disposed=false,comparison=false,currentView='dorsum',currentLight='neutral',poseMode='open',referenceHuman,porcelain,currentModel='human';
const descriptions={reference:'Encuadre inspirado en tu referencia.',dorsum:'Dorso, nudillos y uñas bajo luz neutra.',palm:'Pliegues, líneas y volumen de la palma.',profile:'Perfil del pulgar y su contacto con los dedos.',knuckles:'Primer plano de los nudillos y las uñas.',skin:'Acercamiento a la superficie de la piel.',vellus:'Vello del antebrazo en primer plano.'};
function showView(view){
  if(!ready)return;currentView=view;
  main.dataset.view=view;
  human.root.rotation.set(.03,Math.PI,0);human.root.position.set(2.6,0,0);
  if(view==='reference'){human.root.rotation.set(.04,0,.06);human.root.position.set(-2.2,0,0)}
  if(previousHand){previousHand.root.rotation.copy(human.root.rotation);previousHand.root.position.copy(human.root.position)}
  const narrow=viewport.clientWidth<650;
  const views={reference:{camera:[-.3,-2,narrow?-9.8:-6.5],target:[-.3,-.08,0]},dorsum:{camera:[.7,1.1,narrow?9.8:6.9],target:[.7,-.04,0]},palm:{camera:[.7,1.4,narrow?-9.8:-6.9],target:[.7,-.05,0]},profile:{camera:[.7,narrow?-9.4:-6.5,narrow?-3.5:-2.4],target:[.7,-.05,.02]},knuckles:{camera:[.24,.65,3.1],target:[.24,-.07,-.02]},skin:{camera:[1.85,.36,1.35],target:[1.85,-.04,-.08]},vellus:{camera:[3.75,.6,1.5],target:[3.75,.02,0]}};
  pose();
  const chosen=views[view];camera.position.set(...chosen.camera);controls.target.set(...chosen.target);controls.update();controls.saveState();
  document.querySelectorAll('button[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
  document.querySelector('#view-description').textContent=descriptions[view];updateModelUI();render();
}
function render(){if(!ready||disposed)return;controls.update();renderer.render(scene,camera)}
function pose(){const value=Number(document.querySelector('#gesture').value),pointing=poseMode==='point',closure=value/.9,curls=[pointing?value*.6:closure,pointing?.035:closure,closure,closure,closure];human.pose(curls);previousHand?.pose(curls);render();document.querySelectorAll('[data-pose]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pose===poseMode)))}
function setPoseMode(mode){poseMode=mode;document.querySelector('#gesture').value=mode==='open'?0:mode==='fist'?.9:.75;pose()}
function detail(){human.setDetails({pores:document.querySelector('#pores').checked,vellus:document.querySelector('#vellus').checked});render()}
function light(kind){
  if(!ready)return;currentLight=kind;
  if(kind==='neutral'){key.position.set(-3,6,5);key.intensity=1.7;fill.intensity=.4;rim.intensity=.9;scene.environmentIntensity=.4}
  if(kind==='raking'){key.position.set(-5,.5,1.8);key.intensity=2.65;fill.intensity=.2;rim.intensity=.45;scene.environmentIntensity=.25}
  if(kind==='back'){key.position.set(-3,5,-5);key.intensity=3.7;fill.intensity=.55;rim.intensity=.9;scene.environmentIntensity=.4}
  document.querySelectorAll('[data-light]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.light===kind)));render();
}
function updateModelUI(){
  document.querySelectorAll('[data-hand]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.hand===currentModel)));
  const artificial=currentModel==='porcelain'&&!comparison;
  for(const id of ['pores','vellus'])document.querySelector('#'+id).disabled=artificial;
  document.querySelector('#source-texture').disabled=artificial||comparison;document.querySelector('#source-texture').setAttribute('aria-pressed',String(human.surface==='original'));
  viewport.setAttribute('aria-label',`Mano ${artificial?'de porcelana':'humana'} en 3D. Arrastra para girar y desplaza para acercarte.`);
  document.querySelector('#hand-credit').innerHTML=comparison?'Geometría y UV: <a href="https://libhand.org/" target="_blank" rel="noreferrer">LibHand</a> · Marin Saric / Rizzle Studios · CC BY 3.0 · Texturas adaptadas con IA':`Base 3D: modelos de Zero aportados al proyecto · ${human.surface==='original'?'Textura original':artificial?'Material de porcelana':'Piel adaptada con IA para luz neutra'} · Estudio local`;
}
async function showModel(kind){
  if(!ready||disposed)return;
  const buttons=[...document.querySelectorAll('[data-hand]')];buttons.forEach(button=>button.disabled=true);
  try{
    if(kind==='porcelain'&&!porcelain){porcelain=await createReferenceHand(renderer,{artificial:true,detail:2});porcelain.root.visible=false;scene.add(porcelain.root)}
    human.root.visible=false;previousHand&&(previousHand.root.visible=false);comparison=false;
    human=kind==='porcelain'?porcelain:referenceHuman;currentModel=kind;human.root.visible=true;
    document.querySelector('#previous').setAttribute('aria-pressed','false');document.querySelector('#previous').textContent='Comparar con la mano anterior';
    detail();showView(currentView);
  }catch(error){console.error(error);document.querySelector('#view-description').textContent='No se ha podido cargar esta mano.'}
  finally{buttons.forEach(button=>button.disabled=false)}
}
document.querySelectorAll('[data-hand]').forEach(button=>button.addEventListener('click',()=>showModel(button.dataset.hand)));
document.querySelector('#source-texture').addEventListener('click',async()=>{if(!ready||comparison||currentModel==='porcelain')return;const button=document.querySelector('#source-texture');button.disabled=true;try{await human.setSurface(human.surface==='original'?'adapted':'original');updateModelUI();render()}catch(error){console.error(error)}finally{button.disabled=false}});

document.querySelectorAll('button[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
document.querySelectorAll('[data-light]').forEach(button=>button.addEventListener('click',()=>light(button.dataset.light)));
document.querySelector('#gesture').addEventListener('input',()=>{if(ready){poseMode='manual';pose()}});
document.querySelectorAll('[data-pose]').forEach(button=>button.addEventListener('click',()=>{if(ready)setPoseMode(button.dataset.pose)}));
for(const id of ['pores','vellus'])document.querySelector('#'+id).addEventListener('change',()=>{if(ready)detail()});
document.querySelector('#hand-reset').addEventListener('click',()=>showView(currentView));
document.querySelector('#previous').addEventListener('click',async()=>{
  if(!ready)return;
  const button=document.querySelector('#previous');button.disabled=true;
  try{if(!previousHand){previousHand=await createPhotographicHand({detail:2});scene.add(previousHand.root)}comparison=!comparison;human.root.visible=!comparison;previousHand.root.visible=comparison;button.setAttribute('aria-pressed',String(comparison));button.textContent=comparison?'Volver a la mano actual':'Comparar con la mano anterior';pose();showView(currentView)}finally{button.disabled=false}
});

async function start(){
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;viewport.append(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#e5e3dc');camera=new THREE.PerspectiveCamera(33,1,.01,80);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=.18;controls.maxDistance=15;controls.enablePan=true;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  key=new THREE.DirectionalLight('#fff4e7',2.1);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-10,right:10,top:5,bottom:-5,near:.1,far:30});key.shadow.normalBias=.0005;key.shadow.bias=-.00001;key.shadow.radius=3;
  fill=new THREE.DirectionalLight('#d8e6ee',.55);fill.position.set(4,2,7);rim=new THREE.DirectionalLight('#fff9ef',1.25);rim.position.set(3,5,-6);scene.add(key,fill,rim,new THREE.HemisphereLight('#f5f4ed','#9b9d8b',.25));
  human=await createReferenceHand(renderer,{detail:2});referenceHuman=human;scene.add(human.root);
  const resize=()=>{const width=viewport.clientWidth,height=viewport.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render()};const observer=new ResizeObserver(resize);observer.observe(viewport);resize();ready=true;main.classList.add('ready');pose();showView('dorsum');light('neutral');
  let changed=true,last=0;controls.addEventListener('change',()=>{changed=true});
  function frame(now){if(disposed)return;if(!document.hidden){const moved=controls.update();if(moved||changed||now-last>300){last=now;renderer.render(scene,camera);changed=false}}requestAnimationFrame(frame)}requestAnimationFrame(frame);
  window.__handStudio={showView,showModel,light,getState:()=>({ready,model:currentModel,source:human.source,surface:human.surface??'adapted',joints:human.skin.skeleton.bones.length,view:currentView,light:currentLight,pose:poseMode,deformation:human.deformation,comparison,hairStrands:human.hair?.userData.strandCount??0,triangles:human.skin.geometry.index.count/3,nailBeds:human.nailCount,pores:human.material.userData.uniforms?.poreStrength.value??0,drawCalls:renderer.info.render.calls,camera:camera.position.toArray()}),validate:()=>{
    human.root.updateMatrixWorld(true);const geometry=human.skin.geometry;let maxWeightError=0,finite=true;const point=new THREE.Vector3();
    for(let i=0;i<geometry.attributes.position.count;i+=17){let total=0;for(let j=0;j<4;j++)total+=geometry.attributes.skinWeight.array[i*4+j];maxWeightError=Math.max(maxWeightError,Math.abs(total-1));human.skin.getVertexPosition(i,point);finite&&=point.toArray().every(Number.isFinite)}
    const hairGeometry=human.hair?.geometry;let hairFinite=true,hairWeightError=0,forearmStrands=0;
    for(let i=0;i<(hairGeometry?.attributes.position.count??0);i+=15){
      let weight=0;for(let j=0;j<4;j++)weight+=hairGeometry.attributes.skinWeight.array[i*4+j];hairWeightError=Math.max(hairWeightError,Math.abs(weight-1));
      human.hair.getVertexPosition(i,point);hairFinite&&=point.toArray().every(Number.isFinite);
      if(hairGeometry.attributes.position.getX(i)<-.025)forearmStrands++;
    }
    let nailsFinite=true,nailWeightError=0;for(const nail of human.nails??[])for(let i=0;i<nail.geometry.attributes.position.count;i++){let weight=0;for(let j=0;j<4;j++)weight+=nail.geometry.attributes.skinWeight.array[i*4+j];nailWeightError=Math.max(nailWeightError,Math.abs(weight-1));nail.getVertexPosition(i,point);nailsFinite&&=point.toArray().every(Number.isFinite)}
    return{finite,maxWeightError,jointTips:human.jointTips?.()??null,thumbMotion:human.thumbMotion?.()??null,nailsFinite,nailWeightError,nailsAttached:(human.nails??[]).every(nail=>nail.skeleton===human.skin.skeleton),textureSize:human.material.map?[human.material.map.image.width,human.material.map.image.height]:null,hairAttached:!human.hair||human.hair.skeleton===human.skin.skeleton,hairFinite,hairWeightError,forearmStrands,tip:human.tipWorld().toArray()};
  }};
  window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;observer.disconnect();controls.dispose();environment.dispose();renderer.dispose()});
}
start().catch(error=>{console.error(error);document.querySelector('#hand-loading').textContent='No se ha podido preparar la mano.'});
