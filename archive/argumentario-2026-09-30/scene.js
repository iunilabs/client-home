import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHand } from './hand.js';
import { createEnvironment } from './environment.js';
import { createRenderBudget } from './render-budget.js';
import { box,mesh,rod,materials,createStone,createCompass,createWrench,createMouse,createGear,createRocket,createDocument,createArc } from './objects.js';
import { clamp,mix,smooth,sampleFrames,handoff } from './timeline.js';
import { introPose, introState, livingFingers, handBreath } from './intro.js';
import { createIntroReveal } from './intro-reveal.js';

const frames=[
  {at:0,h:[.4,-.45,1],r:[-.25,-.35,.2],a:[10,-1,0],ar:[0,Math.PI,0],cam:[.3,1,13],look:[1,.2,0],curl:.6},
  {at:1,h:[.6,-.25,.8],r:[.12,-.3,.70],a:[10,-1,0],ar:[0,Math.PI,0],cam:[.7,1.8,12],look:[1,.1,0],curl:.9},
  {at:1.5,h:[.6,-.05,.8],r:[-.3,-.63,-.12],a:[10,-1,0],ar:[0,Math.PI,0],cam:[1.5,3.2,11.8],look:[1.2,-.15,0],curl:1.05},
  {at:2,h:[.5,-.15,1],r:[.05,-.12,-.22],a:[10,-1,0],ar:[0,Math.PI,0],cam:[.3,1.8,12.5],look:[1.1,0,0],curl:.8},
  {at:3,h:[.5,-.15,1],r:[-.1,.08,-.08],a:[10,-1,0],ar:[0,Math.PI,0],cam:[1,.7,12.5],look:[1,.1,0],curl:.7},
  {at:3.8,h:[.3,-.2,1],r:[-.1,-.2,.25],a:[10,-1,0],ar:[0,Math.PI,0],cam:[.6,1.2,15],look:[1,.4,0],curl:.7},
  {at:4,h:[.7,-1,1],r:[1.38,-.18,.02],a:[10,-1,0],ar:[0,Math.PI,0],cam:[.3,1.6,12.5],look:[1,.3,0],curl:.35},
  {at:4.5,h:[.7,-.85,1],r:[1.1,-.12,.07],a:[10,-1,0],ar:[0,Math.PI,0],cam:[.3,1.3,12.5],look:[1,.4,0],curl:.35},
  {at:4.8,h:[-.5,-.9,1],r:[.1,.03,.15],a:[7,-.5,.7],ar:[-.12,Math.PI-.08,-.08],cam:[0,.6,14],look:[0,.7,0],curl:.55},
  {at:5,h:[-3,-.65,.8],r:[-.06,.07,.06],a:[5,-.62,.7],ar:[-.05,Math.PI-.08,-.08],cam:[0,.3,13],look:[0,.5,0],curl:.4},
  {at:5.6,h:[-3.06,-.65,.8],r:[-.1,.06,.08],a:[3,-.6,.7],ar:[-.08,Math.PI-.08,-.06],cam:[0,.3,12],look:[0,.4,0],curl:.38},
  {at:6,h:[-.3,-.6,1.1],r:[-.65,-.22,-.08],a:[5,-.5,.8],ar:[-.65,Math.PI+.08,-.06],cam:[0,1.1,13],look:[1,.4,0],curl:.24},
  {at:6.5,h:[.2,-.65,1.1],r:[-.98,-.12,-.05],a:[5,-.63,1],ar:[-.85,Math.PI+.06,-.02],cam:[.6,1.6,12.5],look:[1,.1,0],curl:.22},
  {at:7,h:[.2,-.5,1.1],r:[-.92,-.2,-.14],a:[8,-.5,.8],ar:[-.8,Math.PI+.1,0],cam:[.5,1.2,12.5],look:[1,.3,0],curl:.32},
  {at:7.65,h:[-.1,-.4,1],r:[-.72,-.2,-.18],a:[6,-.4,.5],ar:[-.6,Math.PI,0],cam:[.4,1.5,13],look:[1,.5,0],curl:.22},
  {at:8,h:[-8,-1.1,0],r:[.1,-.2,0],a:[11,-1,0],ar:[0,Math.PI,0],cam:[0,1.5,13],look:[1,.1,0],curl:.12},
  {at:9,h:[-8,-1.1,0],r:[.1,-.2,0],a:[11,-1,0],ar:[0,Math.PI,0],cam:[.5,1.8,13],look:[1,.3,0],curl:.12},
  {at:10,h:[-8,-1.1,0],r:[.1,-.2,0],a:[11,-1,0],ar:[0,Math.PI,0],cam:[.5,1.2,13],look:[1,.3,0],curl:.12},
  {at:11,h:[-8,-1.1,0],r:[.1,-.2,0],a:[11,-1,0],ar:[0,Math.PI,0],cam:[0,1.2,15],look:[1,.3,0],curl:.12},
  {at:12,h:[.4,-.45,1],r:[-.95,-.2,-.1],a:[11,-1,0],ar:[0,Math.PI,0],cam:[.3,1,12],look:[1,.4,0],curl:.3},
  {at:13,h:[.4,-.45,1],r:[-.95,-.2,-.1],a:[11,-1,0],ar:[0,Math.PI,0],cam:[.3,1,12],look:[1,.4,0],curl:.3},
];

export async function createExperience(container,{onReady,onFailure,extendScene}) {
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch(error){onFailure(error);return null}
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  const gl=renderer.getContext(),debugRenderer=gl.getExtension('WEBGL_debug_renderer_info');
  const software=debugRenderer&&/SwiftShader|llvmpipe|Software Rasterizer/i.test(gl.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL));
  // Software WebGL needs a smaller initial raster budget. Keep normal GPU
  // detail and adjust only canvas pixels; HTML stays at native resolution.
  const renderBudget=createRenderBudget(renderer,()=>Math.min(devicePixelRatio,innerWidth<700?1.25:1.5),software?{initialScale:.45,minScale:.35,maxScale:.7}:undefined);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;container.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();onFailure(new Error('WebGL context lost'))});
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,180);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environmentMap=pmrem.fromScene(room,.04);scene.environment=environmentMap.texture;scene.environmentIntensity=.62;room.dispose();pmrem.dispose();
  const sceneryStart=scene.children.length;
  const environment=createEnvironment(scene);
  const scenery=scene.children.slice(sceneryStart).filter(object=>!object.isLight);
  scene.background=null;scene.fog=null;
  let human,ai;
  let loadTimeout;
  // At narrative camera distance one subdivision retains the silhouette.
  // The dedicated studio uses two levels for close inspection.
  const handDetail=1;
  try{[human,ai]=await Promise.race([Promise.all([createHand('/models/human-right.glb',false,{detail:handDetail}),createHand('/models/ai-left.glb',true,{detail:handDetail})]),new Promise((_,reject)=>{loadTimeout=setTimeout(()=>reject(new Error('Model loading timed out')),15000)})])}catch(error){renderer.dispose();onFailure(error);return null}finally{clearTimeout(loadTimeout)}
  scene.add(human.root,ai.root);
  const reveal=createIntroReveal(human);
  const stone=createStone();stone.position.set(1.55,-.2,.6);human.toolAnchor.add(stone);
  const compass=createCompass();compass.position.set(1.55,.2,.55);human.toolAnchor.add(compass);
  const wrench=createWrench();wrench.position.set(1.55,.18,.55);wrench.rotation.z=-Math.PI/2;human.toolAnchor.add(wrench);
  const mouse=createMouse();mouse.position.set(1.55,-.05,.5);mouse.rotation.z=-.65;human.toolAnchor.add(mouse);
  const restMouse=createMouse();restMouse.position.set(1,-1.72,1.4);restMouse.rotation.x=-Math.PI/2;scene.add(restMouse);
  const core=createStone();core.scale.set(1.2,.55,1.2);core.position.set(2.75,-1.63,1.45);scene.add(core);
  const flake=createStone();flake.scale.set(.28,.1,.44);scene.add(flake);
  const trace=createArc(.88,materials.ink);trace.rotation.x=-Math.PI/2;trace.position.set(2.8,-1.785,1);scene.add(trace);
  const gear=createGear(1);gear.position.set(3.2,-.7,.15);gear.rotation.x=.12;scene.add(gear);
  const gear2=createGear(.65);gear2.position.set(4.73,-1.2,-.1);scene.add(gear2);
  const rocket=createRocket();rocket.position.set(5.8,-.9,-5);scene.add(rocket);
  const ball=mesh(new THREE.SphereGeometry(.55,64,48),materials.blue);scene.add(ball);
  const documents=new THREE.Group();scene.add(documents);
  const source=createDocument('DATOS','source');documents.add(source);
  const reports=['DETALLE','COMPARACIÓN','SÍNTESIS'].map(title=>{const d=createDocument(title);documents.add(d);return d});
  const selectionOutline=box(1.2,1.48,.025,materials.blue,.025);selectionOutline.position.z=-.035;reports[2].add(selectionOutline);
  const copyDots=new THREE.Group();for(let i=0;i<7;i++)copyDots.add(mesh(new THREE.SphereGeometry(.028,12,8),materials.blue));scene.add(copyDots);
  const services=new THREE.Group();scene.add(services);
  const servicePieces=[];
  for(let i=0;i<6;i++){
    const object=createDocument(['OBJETIVO','TAREA','EQUIPO','DATOS','CRITERIO','PRUEBA'][i],i===3?'source':'report');object.scale.setScalar(.68);services.add(object);servicePieces.push(object);
  }
  const links=[];
  for(let i=0;i<5;i++){const object=rod([0,0,0],[1,0,0],.022,materials.bronze);services.add(object);links.push(object)}
  const serviceRing=createArc(1.25,materials.bronze);services.add(serviceRing);
  const rail=new THREE.CatmullRomCurve3([new THREE.Vector3(1,-.8,.5),new THREE.Vector3(2,-.6,0),new THREE.Vector3(3,.4,.1),new THREE.Vector3(4,.6,.4),new THREE.Vector3(5,-.2,0)]);
  const railMesh=mesh(new THREE.TubeGeometry(rail,80,.018,8,false),materials.blue);services.add(railMesh);
  const extension=extendScene?.({scene,camera,human,ball});
  const look=new THREE.Vector3(), target=new THREE.Vector3(),viewOffset=new THREE.Vector3(),worldUp=new THREE.Vector3(0,1,0),viewRight=new THREE.Vector3();
  let disposed=false,lastProgress=0,lastTime=0,lastReduced=false,handContactGap=null,lastCurls=[],lastIntro=null;
  function render(progress,pointer,time,reduced=false) {
    if(disposed)return;
    renderBudget.update(time,reduced);
    const p=clamp(progress,0,13),f=sampleFrames(frames,p),mobile=innerWidth<700;
    lastProgress=p;lastTime=time;lastReduced=reduced;
    // Each gesture derives from absolute scroll progress. No elapsed-time
    // animation can advance the story or desynchronise a reverse scroll.
    human.root.position.set(...f.h);human.root.rotation.set(...f.r);
    human.root.visible=p<7.92||p>11.5;
    const intro=introState(p);lastIntro=intro;
    if(p<1){const entry=introPose(p);human.root.position.set(...entry.h);human.root.rotation.set(...entry.r);human.root.visible=intro.handVisible}
    const breath=handBreath(p,time,reduced);human.root.position.z+=breath;lastIntro.breath=breath;
    if(p>=4&&p<4.5)human.root.position.x+=Math.sin((p-4)*Math.PI*6)*.08;
    if(p>=7&&p<7.85){const choose=smooth(7.1,7.5,p)*(1-smooth(7.65,7.85,p));human.root.position.y+=choose*.7;human.root.position.x+=choose*.8}
    ai.root.position.set(...f.a);ai.root.rotation.set(...f.ar);
    const cursorAmount=reduced?0:1;
    // Gestures belong to the world. Pointer perspective comes from the camera,
    // keeping tools, joints and scenery in one coherent space.
    let gesture=0;
    if(p>=1&&p<1.8){gesture=Math.sin(clamp((p-1)/.7)*Math.PI*2)*.14;human.root.position.y-=smooth(1.12,1.35,p)*.58*(1-smooth(1.4,1.75,p))}
    if(p>=2&&p<2.8)gesture=(p-2)*.35;
    if(p>=3&&p<3.7)gesture=-Math.sin((p-3)/.7*Math.PI)*.3;
    human.root.rotation.z+=gesture;
    if(p>=2.94&&p<3.94){
      // The wrench's jaw stays around the nut while the wrist turns. A camera
      // parallax or reverse scroll cannot detach the working end.
      human.root.updateMatrixWorld(true);
      const jaw=wrench.localToWorld(new THREE.Vector3(0,.5,0));
      human.root.position.add(new THREE.Vector3(3.2,-.7,.45).sub(jaw));
    }
    const contact=p>=5&&p<6;
    const curl=p<1?introPose(p).curl:p<1.14?mix(.32,f.curl,smooth(1,1.14,p)):f.curl;
    const curls=[curl*.8,curl,curl*.9,curl,curl*1.1];
    if(contact){curls[0]=.6;curls[1]=.025;curls[2]=.95;curls[3]=1.05;curls[4]=1.1}
    lastCurls=livingFingers(curls,p,time,reduced);
    human.pose(lastCurls);ai.pose(contact?[.6,.025,.95,1.05,1.1]:[.15,.22,.26,.3,.35]);
    lastIntro.reveal=reveal.update(p);
    ai.root.visible=p>4.6&&p<7.9;
    if(contact){
      const ht=human.tipWorld(),at=ai.tipWorld();
      const gap=mix(2.1,0,smooth(5,5.58,p));
      ai.root.position.add(ht.clone().add(new THREE.Vector3(gap,0,0)).sub(at));
      handContactGap=human.tipWorld().distanceTo(ai.tipWorld());
    }else handContactGap=null;
    stone.visible=p>.96&&p<1.92;stone.scale.setScalar(intro.toolReveal);compass.visible=p>=1.92&&p<2.94;wrench.visible=p>=2.94&&p<3.94;mouse.visible=p>=3.94&&p<6.06;
    mouse.rotation.z=mix(-Math.PI/2,-.65,smooth(4.5,4.95,p));
    core.visible=p>=1&&p<1.9;flake.visible=p>1.35&&p<1.9;
    flake.position.set(3.08+smooth(1.35,1.55,p)*.5,-1.78,1.95);
    trace.visible=p>=2&&p<2.95;trace.geometry.setDrawRange(0,Math.floor(clamp((p-2)/.7)*trace.geometry.index.count));
    gear.visible=p>2.75&&p<4;gear2.visible=gear.visible;gear.rotation.z=(p-3)*1.2;gear2.rotation.z=-(p-3)*1.8;
    rocket.visible=p>3.25&&p<4;rocket.position.y=-.9+smooth(3.55,3.92,p)*2.1;
    restMouse.visible=p>=6.06&&p<7.8;
    if(p>=6.06&&p<6.3){
      restMouse.position.copy(mouse.getWorldPosition(new THREE.Vector3())).lerp(new THREE.Vector3(1,-1.72,1.4),smooth(6.06,6.3,p));
      restMouse.quaternion.copy(mouse.getWorldQuaternion(new THREE.Quaternion())).slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0)),smooth(6.06,6.3,p));
    }else{restMouse.position.set(1,-1.72,1.4);restMouse.rotation.set(-Math.PI/2,0,0)}
    ball.visible=p>4.8;
    const transfer=handoff(p);
    if(p<6){ball.position.copy(ai.root.localToWorld(new THREE.Vector3(1.7,-.45,.63)))}
    else if(p<7){
      const offered=ai.root.localToWorld(new THREE.Vector3(1.7,-.3,.68));
      const owned=human.root.localToWorld(new THREE.Vector3(1.65,-.2,.72));
      ball.position.copy(offered.lerp(owned,smooth(6.05,6.68,p)));
      // During the shared hold, align the artificial palm with the sphere.
      if(p>6.3&&p<6.95){
        const palm=ai.root.localToWorld(new THREE.Vector3(1.1,-.1,.4));
        const support=ball.position.clone().add(new THREE.Vector3(1,.02,-.35));
        ai.root.position.add(support.sub(palm).multiplyScalar(smooth(6.3,6.46,p)*(1-smooth(6.64,6.95,p))));
      }
    }else if(p<7.85||p>11.5){ball.position.copy(human.root.localToWorld(new THREE.Vector3(1.65,-.2,.72)))}
    else{ball.position.set(3.3+.85*Math.sin((p-8)*2.7),.2+.55*Math.sin((p-8)*Math.PI),.7+.22*Math.cos(p*2))}
    ball.rotation.y=p*1.8;ball.scale.setScalar(p>11.6?1.15:1);
    documents.visible=(p>3.9&&p<4.82)||(p>=7&&p<7.85);copyDots.visible=p>=4&&p<4.75;
    selectionOutline.visible=p>7.3&&p<7.85;
    source.position.set(2.0,1.25,-.2);source.rotation.set(-.06,.12,-.08);
    for(let i=0;i<reports.length;i++){
      const item=reports[i];const selected=p>=7&&i===2?smooth(7.15,7.65,p):0;
      item.position.set(mix(3.6+i*.58,3.1,selected),mix(1.7-i*.55,1.15,selected),mix(-.5+i*.13,1,selected));
      item.rotation.set(.02,reduced?-.1:-.1+Math.sin(time*.5+i)*.018,-.04+i*.05);
      item.scale.setScalar(mix(.8,1.18,selected));
    }
    for(let i=0;i<copyDots.children.length;i++){const t=((p-4)*4+i*.11)%1;copyDots.children[i].position.set(mix(2.5,3.6,t),mix(1.35,.65,t),.08)}
    services.visible=p>=7.85&&p<11.45;
    const servicePhase=clamp(p-8,0,3);
    for(let i=0;i<6;i++){
      const x=2.7+(i%3)*1.1,y=1.15-Math.floor(i/3)*1.4;
      const settle=smooth(8,8.75,p);
      const item=servicePieces[i];
      item.position.set(x+Math.sin(i*3)*.7*(1-settle),y+Math.cos(i*7)*.6*(1-settle),-.2+(i%2)*.3);
      item.rotation.set(.05,Math.sin(i)*.15*(1-settle),Math.cos(i)*.35*(1-settle));
      if(p>9&&p<10){item.position.y+=smooth(9.1,9.7,p)*((i%2)*.35)}
      if(p>10){item.rotation.z=smooth(10,10.65,p)*(i===4?-.3:0)*(1-smooth(10.65,10.92,p));}
    }
    for(let i=0;i<5;i++){
      const a=servicePieces[i].position,b=servicePieces[i+1].position,link=links[i];
      const delta=b.clone().sub(a);link.position.copy(a.clone().add(b).multiplyScalar(.5));
      link.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());link.scale.y=delta.length();
      link.visible=p>8.3&&p<9;
    }
    railMesh.visible=p>=9&&p<11.2;
    serviceRing.visible=p>=10.6;serviceRing.position.set(4,-.1,0);serviceRing.rotation.y=.2;
    if(p>=9&&p<11.2){const t=clamp(p-9,0,2)/2;ball.position.copy(rail.getPoint(t));ball.position.y+=.56}
    if(mobile){
      // Keep objects below the reading area. Increase the field of view to fit
      // the contact, rather than clipping hands on a narrow viewport.
      camera.fov=contact?58:50;
      target.set(f.cam[0]+2.05,f.cam[1]+.8,f.cam[2]+4.5);
      look.set(f.look[0]+1.3,f.look[1]+2.3,f.look[2]);
      if(contact){target.x=0;look.x=0;target.z=17;look.y=2.6}
      if(p<1.65){
        const reveal=1-smooth(1,1.65,p);
        camera.fov=mix(camera.fov,42,reveal);
        target.lerp(new THREE.Vector3(f.cam[0]+1.1,f.cam[1]+.6,f.cam[2]+1.5),reveal);
        look.lerp(new THREE.Vector3(f.look[0]+.45,f.look[1]+.7,f.look[2]),reveal);
      }
    }else{
      camera.fov=mix(26,38,smooth(1.65,2,p));target.set(...f.cam);look.set(...f.look);
      const entranceFraming=.75*(1-smooth(1.65,2,p));target.x+=entranceFraming;look.x+=entranceFraming;
    }
    const px=pointer.x*cursorAmount,py=pointer.y*cursorAmount;
    viewOffset.copy(target).sub(look).applyAxisAngle(worldUp,px*intro.perspective);
    viewRight.set(viewOffset.z,0,-viewOffset.x).normalize();
    viewOffset.applyAxisAngle(viewRight,-py*(p<1?.075:.035));
    target.copy(look).add(viewOffset);
    // A small shared lateral move complements the orbit. Near and far objects
    // then have different screen displacement, rather than a flat layer shift.
    target.x+=px*.2;look.x+=px*.2;target.y+=py*.1;look.y+=py*.1;
    camera.position.copy(target);camera.lookAt(look);camera.updateProjectionMatrix();
    environment.update(p,time,reduced);
    // A continuous white/mint field replaces the coastal set. Retain only
    // the small working surface when a tool needs a physical counterpart.
    for(const object of scenery)object.visible=false;
    environment.ledge.visible=(p>=1&&p<3.95)||(p>=6.06&&p<7.85);
    environment.moon.visible=p>3.2&&p<4;
    extension?.render({progress:p,time,reduced});
    renderer.render(scene,camera);
    return {progress:p,contactGap:handContactGap,transfer,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls};
  }
  const resize=()=>{renderBudget.resize();renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()};
  window.addEventListener('resize',resize);resize();
  // Prepare skin, hair and reveal programs while the initial HTML is already
  // readable, rather than compiling them on the first scrolling gesture.
  for(const object of scenery)object.visible=false;
  await renderer.compileAsync(scene,camera);
  render(0,{x:0,y:0},0);onReady();
  function project(point){const screen=point.clone().project(camera);return [(screen.x+1)*innerWidth/2,(1-screen.y)*innerHeight/2]}
  return {
    render,
    getState:()=>({progress:lastProgress,time:lastTime,reduced:lastReduced,intro:lastIntro,humanVisible:human.root.visible,humanPosition:human.root.position.toArray(),fingerCurls:lastCurls,contactGap:handContactGap,camera:camera.position.toArray(),humanRotation:human.root.rotation.toArray().slice(0,3),ball:ball.position.toArray(),handDetail,handTriangles:human.skin.geometry.index.count/3,renderScale:renderBudget.scale,pixelRatio:renderer.getPixelRatio(),screenLandmarks:{foreground:project(human.root.visible?human.tipWorld():ball.position),middle:environment.ledge.visible?project(environment.ledge.position):null,background:environment.moon.visible?project(environment.moon.position):null},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),
    dispose(){
      disposed=true;window.removeEventListener('resize',resize);
      const geometries=new Set(),mats=new Set(),textures=new Set();
      scene.traverse(object=>{
        if(object.geometry)geometries.add(object.geometry);
        for(const material of [].concat(object.material??[])){
          mats.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
        }
        if(object.isSkinnedMesh)object.skeleton.dispose();
      });
      for(const geometry of geometries)geometry.dispose();for(const material of mats)material.dispose();for(const texture of textures)texture.dispose();
      environmentMap.dispose();renderer.dispose();
    },
  };
}
