import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createReferenceHand} from './reference-hand.js';
import {createRenderBudget} from './render-budget.js';
import {createIntroReveal} from './intro-reveal.js';
import {introState} from './intro.js';
import {choreography,humanFrames,aiFrames,wrenchHandFrames} from './choreography.js';
import {createPoseTrack} from './hand-poses.js';
import {createToolSequence} from './tool-sequence.js';
import {measureClearance} from './surface-clearance.js';
import {createHandFalloff} from './hand-falloff.js';
import {createCursorSurfaceLight} from './cursor-surface-light.js';
import {correctFingerPads} from './ventral-skin.js';
import {createSkinContinuity} from './skin-continuity.js';
import {smooth,mix} from './timeline.js';
import {createFingerGesture} from './finger-gesture.js';
import {createThumbGesture,createWristGesture} from './wrist-gesture.js';

export async function createExperience(container,{onReady,onFailure,poseOverride,handFactory}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch(error){onFailure(error);return null}
 renderer.setClearColor(0,0);renderer.setSize(innerWidth,innerHeight);
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
 const software=debug&&/SwiftShader|llvmpipe|Software Rasterizer/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
 const budget=createRenderBudget(renderer,()=>Math.min(devicePixelRatio,innerWidth<700?1.25:1.5),software?{initialScale:.55,minScale:.4,maxScale:.8}:undefined);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 container.appendChild(renderer.domElement);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();onFailure(new Error('WebGL context lost'))});
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(26,innerWidth/innerHeight,.1,100),neutralCamera=new THREE.PerspectiveCamera(26,innerWidth/innerHeight,.1,100);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);
 scene.environment=env.texture;scene.environmentIntensity=.62;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight('#edf4ff','#7d897a',.45));
 for(const [color,power,position] of [['#fff0d9',2.4,[-5,9,5]],['#c0e4f0',.5,[6,3,8]],['#d6edff',1.65,[4,6,-7]]]){const light=new THREE.DirectionalLight(color,power);light.position.set(...position);scene.add(light)}
 const cursorLight=new THREE.PointLight('#f5fff9',0,18,2);scene.add(cursorLight);const cursorSurfaceLight=createCursorSurfaceLight(cursorLight),coarsePointer=matchMedia('(hover: none), (pointer: coarse)');
 let human,ai,timeout;
 try{[human,ai]=await Promise.race([handFactory?handFactory(renderer):Promise.all([createReferenceHand(renderer,{detail:1}),createReferenceHand(renderer,{artificial:true,detail:1})]),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Model loading timed out')),15000)})])}catch(error){renderer.dispose();onFailure(error);return null}finally{clearTimeout(timeout)}
 scene.add(human.root,ai.root);human.root.name='human-hand';ai.root.name='ai-hand';
 const padCorrections=human.source==='Zero supplied reference'?correctFingerPads(human):[];
 const skinContinuity=human.source==='Zero supplied reference'?await createSkinContinuity(human,renderer):null;
 const previewFingers=poseOverride?createFingerGesture(human):null,previewThumb=poseOverride?createThumbGesture(human):null,previewWrist=poseOverride?createWristGesture(human):null;
 const humanTrack=createPoseTrack(human,humanFrames,{start:.75,end:.9,frames:wrenchHandFrames}),aiTrack=createPoseTrack(ai,aiFrames);
 const tools=await createToolSequence(scene),reveal=createIntroReveal(human),humanFalloff=createHandFalloff(human),aiFalloff=createHandFalloff(ai);
 const target=new THREE.Vector3(),look=new THREE.Vector3(),view=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),zAxis=new THREE.Vector3(0,0,1),tiltQuaternion=new THREE.Quaternion();
 function portraitFraming(){return innerWidth<700||innerWidth/innerHeight<1}
 function portraitFov(){return innerWidth<360?54:innerWidth<700?50:42}
 let portraitWrenchCenters=[0,0],wrenchViewportShift=new THREE.Vector3();
 function calibrateTools(){
  const c=new THREE.PerspectiveCamera(),layouts=[['piedra',.25,[.72,-.59],6],['compas',.5,[.65,.26],11],['llave',.75,[.91,-.87],6]];
  for(const[id,ratio,ndc,distance]of layouts){const pose=choreography(ratio*5,0,true,ratio);human.root.position.set(...pose.h);human.root.rotation.set(...pose.r);human.root.scale.y=-1;humanTrack.apply(ratio,0,true);human.root.position.add(humanTrack.targetIndex(ratio).sub(human.tipWorld()));
   const from=new THREE.Vector3(...pose.cam),to=new THREE.Vector3(...pose.look);let fov=pose.fov;
   if((id==='piedra'||id==='llave')&&portraitFraming()){const spread=smooth(2.6,3.45,ratio*5);fov=mix(portraitFov(),56,spread);from.z+=mix(2,5,spread);const xs=Object.values(human.jointTips()).map(v=>human.scene.localToWorld(new THREE.Vector3(...v)).x),focus=(Math.min(...xs)+Math.max(...xs))/2,center=(focus-to.x)*(1-smooth(.82,.95,ratio));from.x+=center;to.x+=center;from.y+=.6;to.y+=mix(.7,-.15,spread)}
   // Compass keeps its canonical3D relationship. Foreground stone/wrench
   // use peripheral viewport placement; wrench is intentionally cropped.
   c.fov=fov;c.aspect=id!=='compas'?innerWidth/innerHeight:1424/873;c.position.copy(from);c.lookAt(to);c.updateProjectionMatrix();c.updateMatrixWorld();
   const screen=portraitFraming()?(id==='piedra'?[.55,-.65]:id==='llave'?[.90,-.67]:ndc):ndc;
   const forward=to.clone().sub(from).normalize(),ray=new THREE.Vector3(screen[0],screen[1],.5).unproject(c).sub(from).normalize();const anchor=from.clone().addScaledVector(ray,distance/(ray.dot(forward)));tools.setAnchor(id,anchor);
   if(id==='llave'){const canonical=new THREE.PerspectiveCamera(32,1424/873,.1,100);canonical.position.set(.5,.55,14.5);canonical.lookAt(.2,.5,0);canonical.updateProjectionMatrix();canonical.updateMatrixWorld();const forward=canonical.getWorldDirection(new THREE.Vector3()),ray=new THREE.Vector3(.91,-.87,.5).unproject(canonical).sub(canonical.position).normalize(),reference=canonical.position.clone().addScaledVector(ray,6/ray.dot(forward));wrenchViewportShift.copy(anchor).sub(reference);if(portraitFraming())wrenchViewportShift.add(new THREE.Vector3(-.33,.12,0))}
  }
  portraitWrenchCenters=[.75,.9].map(ratio=>{const pose=choreography(ratio*5,0,true,ratio);human.root.position.set(...pose.h);human.root.rotation.set(...pose.r);human.root.scale.y=-1;humanTrack.apply(ratio,0,true);human.root.position.add(humanTrack.targetIndex(ratio).sub(human.tipWorld()));const xs=Object.values(human.jointTips()).map(v=>human.scene.localToWorld(new THREE.Vector3(...v)).x),focus=(Math.min(...xs)+Math.max(...xs))/2;return(focus-pose.look[0])*(1-smooth(.82,.95,ratio))});
 }
 calibrateTools();
 let disposed=false,last=null;
 function project(point){const v=point.clone().project(camera);return [(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2]}
 function render(progress,pointer,time,reduced=false,scrollRatio,lightPointer=pointer){
  if(disposed)return;
  budget.update(time,reduced);
  const pose=choreography(progress,time,reduced,scrollRatio);Object.assign(pose,poseOverride?.(pose)??{});const p=pose.progress,mobile=portraitFraming();
  human.root.scale.y=pose.humanMirror??1;ai.root.scale.y=pose.aiMirror??1;
  human.root.position.set(...pose.h);human.root.rotation.set(...pose.r);human.root.visible=pose.visible;
  if(poseOverride){human.pose(pose.curls);previewFingers.apply(pose.curls,pose.fingerFlexions,pose.fingerSpreads,pose.fingerGestureWeight??1);previewThumb.apply(pose.humanThumbOpposition??0);previewWrist.apply(pose.wristFlex??0)}else humanTrack.apply(pose.ratio,time,reduced);
  const desiredIndex=poseOverride?new THREE.Vector3(...pose.humanTip):humanTrack.targetIndex(pose.ratio);desiredIndex.z+=pose.depthBreath??0;const shift=desiredIndex.sub(human.tipWorld()).multiplyScalar(poseOverride?pose.reach:1);human.root.position.add(shift);human.root.position.addScaledVector(wrenchViewportShift,smooth(.75,.82,pose.ratio)*(1-smooth(.835,.9,pose.ratio)));
  const intro={...introState(p),breath:pose.breathing,reveal:reveal.update(p)};
  ai.root.rotation.set(...pose.aiRotation);ai.root.quaternion.premultiply(tiltQuaternion.setFromAxisAngle(zAxis,pose.aiTilt??0));ai.root.position.set(0,0,0);aiTrack.apply(pose.ratio,time,reduced);ai.root.visible=pose.aiVisible;
  ai.root.position.add(new THREE.Vector3(...pose.aiTip).sub(ai.tipWorld()));
  target.set(...pose.cam);look.set(...pose.look);camera.fov=pose.fov;
  if(mobile){
   const spread=smooth(2.6,3.45,p);
   camera.fov=mix(portraitFov(),56,spread);target.z+=mix(2,5,spread);
   const tips=Object.values(human.jointTips()).map(v=>human.scene.localToWorld(new THREE.Vector3(...v)));const xs=tips.map(v=>v.x),focus=(Math.min(...xs)+Math.max(...xs))/2;const center=pose.ratio>.75&&pose.ratio<.9?mix(...portraitWrenchCenters,smooth(.85,.9,pose.ratio)):(focus-look.x)*(1-smooth(.82,.95,pose.ratio));target.x+=center;look.x+=center;
   target.y+=.6;look.y+=mix(.7,-.15,spread);
  }
  neutralCamera.fov=camera.fov;neutralCamera.aspect=camera.aspect;neutralCamera.position.copy(target);neutralCamera.lookAt(look);neutralCamera.updateProjectionMatrix();neutralCamera.updateMatrixWorld();
  const px=reduced?0:pointer.x,py=reduced?0:pointer.y;
  view.copy(target).sub(look).applyAxisAngle(up,px*pose.perspective);right.set(view.z,0,-view.x).normalize();view.applyAxisAngle(right,-py*.075*(1-.82*smooth(.75,.80,pose.ratio)*(1-smooth(.85,.9,pose.ratio))));
  target.copy(look).add(view);target.x+=px*.2;look.x+=px*.2;target.y+=py*.1;look.y+=py*.1;
  camera.position.copy(target);camera.lookAt(look);
  const framing=[...(pose.cameraShift??[0,0])];if(mobile){const compassFrame=smooth(.39,.48,pose.ratio)*(1-smooth(.56,.64,pose.ratio));framing[0]+=.11*compassFrame;framing[1]-=.18*compassFrame}camera.setViewOffset(innerWidth,innerHeight,-framing[0]*innerWidth,-framing[1]*innerHeight,innerWidth,innerHeight);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  humanFalloff.update();aiFalloff.update();tools.render(pose.ratio,time,reduced,camera,neutralCamera);
  // The source projects to the raw cursor, even while the camera orbit eases.
  // Refresh only custom hand skin caches after their final root placements.
  human.root.updateMatrixWorld(true);ai.root.updateMatrixWorld(true);human.skin.onBeforeRender?.();ai.skin.onBeforeRender?.();
  cursorSurfaceLight.update(camera,lightPointer,[human.root,ai.root,...tools.objects.map(s=>s.group)],reduced||coarsePointer.matches);
  renderer.render(scene,camera);
  const ht=human.tipWorld(),at=ai.tipWorld();
  last={cursorLight:cursorSurfaceLight.getState(),progress:p,time,reduced,intro,humanVisible:human.root.visible,aiVisible:ai.root.visible,humanPosition:human.root.position.toArray(),humanRotation:human.root.rotation.toArray().slice(0,3),humanScale:human.root.scale.toArray(),humanViewDepth:human.root.position.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3())),fingerCurls:pose.curls,fingerFlexions:pose.fingerFlexions,fingerGestureWeight:pose.fingerGestureWeight,humanMirror:pose.humanMirror,humanThumbOpposition:pose.humanThumbOpposition,
   camera:camera.position.toArray(),aiPosition:ai.root.position.toArray(),aiRotation:ai.root.quaternion.toArray(),aiCurls:pose.aiCurls,contactGap:pose.aiVisible?ht.distanceTo(at):null,
   handDetail:1,handSource:human.source,skinContinuity:skinContinuity?{kind:skinContinuity.kind,wristBlend:skinContinuity.wristBlend,seams:skinContinuity.seams}:null,handTriangles:human.skin.geometry.index.count/3,renderScale:budget.scale,pixelRatio:renderer.getPixelRatio(),padCorrections,
   referencePoseWeight:pose.handPoseWeight,screenLandmarks:{foreground:project(ht),second:ai.root.visible?project(at):null,hand:Object.fromEntries(Object.entries(human.jointTips()).map(([role,tip])=>[role,project(human.scene.parent.localToWorld(new THREE.Vector3(...tip)))]))},tools:tools.getState(),poseAuthority:'absolute joint quaternion track',normalisedScroll:pose.ratio,
   actors:scene.children.filter(o=>o.isGroup&&o.visible).map(o=>o.name),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
 }
 const resize=()=>{calibrateTools();budget.resize();renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()};window.addEventListener('resize',resize);resize();
 await renderer.compileAsync(scene,camera);render(0,{x:0,y:0},0);onReady();
 return {render,measureWrenchFraming:()=>tools.measureFraming('llave',camera,innerWidth,innerHeight,Object.fromEntries(Object.entries(human.jointTips()).map(([role,point])=>[role,project(human.scene.parent.localToWorld(new THREE.Vector3(...point)))]))),measureClearances:()=>Object.fromEntries(tools.objects.filter(s=>s.group.visible).map(s=>[s.id,measureClearance(human,s.group)])),getState:()=>({...last,worldFingerTips:Object.fromEntries(Object.entries(human.jointTips()).map(([role,point])=>[role,human.scene.parent.localToWorld(new THREE.Vector3(...point)).toArray()])),skinAtlas:human.material.map?.image?.currentSrc??human.material.map?.image?.src,fingerJoints:Object.fromEntries(human.skin.skeleton.bones.filter(b=>/DEF-f_|DEF-thumb/.test(b.name)).map(b=>[b.name,b.quaternion.toArray()])),indexJoints:Object.fromEntries(human.skin.skeleton.bones.filter(b=>b.name.startsWith('DEF-f_index')).map(b=>[b.name,b.quaternion.toArray()])),toolFrames:tools.projectFrames(camera,innerWidth,innerHeight).map(s=>({...s,indexDepth:camera.position.distanceTo(human.tipWorld())})),screenFingerTips:human.jointTips?Object.fromEntries(Object.entries(human.jointTips()).map(([role,point])=>[role,project(human.scene.parent.localToWorld(new THREE.Vector3(...point)))])):null}),dispose(){disposed=true;window.removeEventListener('resize',resize);const geometry=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of [].concat(o.material??[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v)}if(o.isSkinnedMesh)o.skeleton.dispose()});for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();skinContinuity?.texture.dispose();env.dispose();renderer.dispose()}};
}
