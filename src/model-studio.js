import './model-studio.css';
import {installAssetBase} from './asset-loading.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHand } from './hand.js';
import { createRenderBudget } from './render-budget.js';
import { createStone,createCompass,createWrench,createMouse,createGear,mesh,materials } from './objects.js';
installAssetBase();

const entries=[
  {id:'human',name:'Piel humana',finish:'PIEL · MATERIA VIVA',description:'Pliegues, pigmentación, poros y vello sobre una anatomía articulada.'},
  {id:'ai',name:'Porcelana',finish:'PORCELANA · LUZ SOBRE ESMALTE',description:'Una superficie delicada y un esmalte que recoge la luz del entorno.'},
  {id:'stone',name:'Piedra',finish:'MINERAL · GRANO Y FRACTURA',description:'Una silueta irregular, aristas trabajadas y pequeñas variaciones minerales.'},
  {id:'compass',name:'Compás',finish:'LATÓN Y ACERO · PRECISIÓN',description:'Bisagra, tornillos, ajuste moleteado y dos extremos de trabajo.'},
  {id:'wrench',name:'Llave',finish:'ACERO · OFICIO',description:'Boca abierta, caras de apoyo planas, cuerpo forjado y medida grabada.'},
  {id:'mouse',name:'Ratón',finish:'POLÍMERO Y GOMA · EL PRESENTE',description:'Carcasa, juntas, rueda estriada y detalles de la base.'},
  {id:'gear',name:'Engranaje',finish:'LATÓN MECANIZADO · MOVIMIENTO',description:'Dientes continuos, cuerpo aligerado, aro pulido y tuerca de acero.'},
  {id:'point',name:'Punto',finish:'AZUL PUNTOES · POSIBILIDAD',description:'El azul de la identidad, con profundidad y reflejos de luz.'},
];
const list=document.querySelector('#model-list'),viewport=document.querySelector('#viewport'),stage=document.querySelector('.stage');
entries.forEach((entry,index)=>{const button=document.createElement('button');button.type='button';button.dataset.model=entry.id;button.setAttribute('aria-pressed','false');const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');button.append(number,document.createTextNode(entry.name));button.addEventListener('click',()=>select(index));list.append(button)});

let renderer,scene,camera,controls,renderBudget,objects=[],active=-1,lights,autoRotate=false,gesture=.18,disposed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let ready=false;
function select(index){
  if(!ready)return;
  active=index;
  objects.forEach((object,i)=>object.visible=i===index);
  list.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  const entry=entries[index];document.querySelector('#model-number').textContent=`${String(index+1).padStart(2,'0')} / 08`;
  document.querySelector('#finish-label').textContent=entry.finish;document.querySelector('#model-title').textContent=entry.name;document.querySelector('#model-description').textContent=entry.description;
  viewport.setAttribute('aria-label',`${entry.name}. Arrastra para girar y desplaza para acercarte.`);
  document.querySelector('#pose-control').hidden=index>1;
  document.querySelector('#human-study').hidden=index!==0;
  const mobile=viewport.clientWidth<500;
  if(index<2){camera.position.set(1.2,2.8,mobile?10.6:8);controls.target.set(.5,0,0)}
  else{const object=objects[index],bounds=new THREE.Box3().setFromObject(object),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const distance=Math.max(size.x,size.y,size.z)*2.2;camera.position.copy(center).add(new THREE.Vector3(distance*.45,distance*.28,distance));controls.target.copy(center)}
  controls.update();controls.saveState();render();
}
function render(){if(!renderer||disposed||!ready)return;controls.update();renderer.render(scene,camera)}
document.querySelector('#reset').addEventListener('click',()=>{controls?.reset();render()});
document.querySelector('#rotate').addEventListener('click',()=>{autoRotate=!autoRotate;controls.autoRotate=autoRotate;document.querySelector('#rotate').setAttribute('aria-pressed',String(autoRotate));render()});
document.querySelector('#pose').addEventListener('input',event=>{gesture=Number(event.target.value);for(const hand of hands)hand.pose([gesture*.65,gesture,gesture*.94,gesture*1.04,gesture*1.13]);render()});
document.querySelectorAll('[data-light]').forEach(button=>button.addEventListener('click',()=>{
  if(!ready)return;
  document.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const kind=button.dataset.light;
  lights.key.color.set(kind==='warm'?'#ffd7a6':'#fff1df');lights.key.intensity=kind==='rim'?.8:2.4;
  lights.fill.intensity=kind==='rim'?.3:.7;lights.rim.intensity=kind==='rim'?4:1.65;
  scene.environmentIntensity=kind==='rim'?.4:.62;render();
}));
const hands=[];
async function start(){
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;viewport.append(renderer.domElement);
  renderBudget=createRenderBudget(renderer,()=>Math.min(devicePixelRatio,viewport.clientWidth<500?1.25:1.5));
  scene=new THREE.Scene();scene.background=new THREE.Color('#e5e9e0');
  camera=new THREE.PerspectiveCamera(35,1,.05,80);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=.8;controls.maxDistance=20;controls.maxPolarAngle=Math.PI*.82;controls.autoRotateSpeed=.6;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.62;room.dispose();pmrem.dispose();
  const key=new THREE.DirectionalLight('#fff1df',2.4);key.position.set(-3,6,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.camera.near=.1;key.shadow.camera.far=30;key.shadow.normalBias=.008;key.shadow.bias=-.0001;
  const fill=new THREE.DirectionalLight('#c2dff6',.7);fill.position.set(5,2,5);
  const rim=new THREE.DirectionalLight('#e2f4ff',1.65);rim.position.set(2,5,-4);scene.add(key,fill,rim,new THREE.HemisphereLight('#f5f5ec','#7d8a78',.35));lights={key,fill,rim};
  const floor=mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#e5e4d9',roughness:.86}),0,-1.45,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;scene.add(floor);
  const [human,ai]=await Promise.all([createHand('/models/human-right.glb',false),createHand('/models/ai-left.glb',true)]);hands.push(human,ai);
  human.root.rotation.set(.15,Math.PI-.2,.05);human.root.position.x=2.5;ai.root.rotation.set(.15,.2,.05);
  for(const hand of hands)hand.pose([.12,.18,.22,.3,.36]);
  objects=[human.root,ai.root,createStone(),createCompass(),createWrench(),createMouse(),createGear(),mesh(new THREE.SphereGeometry(.65,64,48),materials.blue)];
  objects[2].position.y=-.5;objects[3].position.y=.6;objects[4].position.y=.5;objects[5].rotation.x=-.35;objects[6].position.y=-.3;
  for(const object of objects)scene.add(object);
  const resize=()=>{const width=viewport.clientWidth,height=viewport.clientHeight;renderBudget.resize();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render()};
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();ready=true;stage.classList.add('ready');select(0);
  let lastTime=0;
  function frame(now){if(disposed)return;if(!document.hidden&&now-lastTime>(reduced.matches?80:0)){lastTime=now;renderBudget.update(now/1000,reduced.matches);render()}requestAnimationFrame(frame)}requestAnimationFrame(frame);
  reduced.addEventListener('change',()=>{if(reduced.matches&&autoRotate)document.querySelector('#rotate').click()});
  window.__modelStudio={
    select,
    getState:()=>({active:entries[active]?.id,ready,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,handTriangles:human.skin.geometry.index.count/3,nails:human.nailCount??human.scene.getObjectsByProperty('isMesh',true).filter(m=>m.name.endsWith('-nail')).length}),
    validateHands:()=>hands.map(hand=>{
      const geometry=hand.skin.geometry;let maxWeightError=0,finiteDeformed=true;
      for(let i=0;i<geometry.attributes.skinWeight.count;i++){
        let sum=0;for(let j=0;j<4;j++)sum+=geometry.attributes.skinWeight.array[i*4+j];maxWeightError=Math.max(maxWeightError,Math.abs(sum-1));
      }
      hand.root.updateMatrixWorld(true);hand.skin.skeleton.update();
      const point=new THREE.Vector3();
      for(let i=0;i<geometry.attributes.position.count;i+=97){hand.skin.getVertexPosition(i,point);if(!point.toArray().every(Number.isFinite))finiteDeformed=false}
      return{vertices:geometry.attributes.position.count,triangles:geometry.index.count/3,maxWeightError,finitePositions:Array.from(geometry.attributes.position.array).every(Number.isFinite),finiteDeformed};
    }),
  };
  window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;resizeObserver.disconnect();controls.dispose();environment.dispose();renderer.dispose()});
}
start().catch(error=>{document.querySelector('#loading').textContent='No se ha podido cargar el visor 3D. Puedes volver a la experiencia.';console.error(error)});
