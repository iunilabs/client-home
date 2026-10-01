import * as THREE from 'three';

const INTENSITY=12;
const STANDOFF=1.4;
const RANGE=18;

// Call after camera framing and actor poses have been updated. Custom skinned
// actors must also have their CPU deformation cache current before this call.
export function createCursorSurfaceLight(light){
 const ndc=new THREE.Vector2(),raycaster=new THREE.Raycaster(),forward=new THREE.Vector3();
 const cameraPosition=new THREE.Vector3(),point=new THREE.Vector3(),projected=new THREE.Vector3();
 const box=new THREE.Box3(),corner=new THREE.Vector3(),clip=new THREE.Matrix4(),frustum=new THREE.Frustum();
 let state=null,lastTime=null;
 light.distance=RANGE;light.decay=2;light.intensity=0;

 function update(camera,pointer,actors,reduced=false,deltaSeconds){
  const now=performance.now()/1000;
  const dt=THREE.MathUtils.clamp(deltaSeconds??(lastTime===null?1/60:now-lastTime),0,.1);lastTime=now;
  const blend=1-Math.exp(-dt*12);
  ndc.set(reduced?0:THREE.MathUtils.clamp(pointer?.x??0,-1,1),reduced?0:THREE.MathUtils.clamp(pointer?.y??0,-1,1));
  camera.updateWorldMatrix(true,false);
  camera.getWorldPosition(cameraPosition);camera.getWorldDirection(forward);
  clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(clip);
  let frontDepth=Infinity,actorCount=0,meshCount=0;
  const seen=new Set();
  for(const actor of actors??[]){
   if(!actor?.visible)continue;
   actor.updateWorldMatrix(true,true);let present=false;
   actor.traverseVisible(mesh=>{
    if(!mesh.isMesh||!mesh.geometry||seen.has(mesh))return;
    seen.add(mesh);
    if([].concat(mesh.material??[]).every(material=>material.visible===false||(material.transparent&&material.opacity<=0)))return;
    // Recompute animated bounds; static geometry retains its cached box.
    // This includes the actual bent fingers rather than only a wrist anchor.
    if(mesh.isSkinnedMesh){mesh.computeBoundingBox();box.copy(mesh.boundingBox)}
    else{if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();box.copy(mesh.geometry.boundingBox)}
    box.applyMatrix4(mesh.matrixWorld);
    if(box.isEmpty()||!frustum.intersectsBox(box))return;
    let nearest=Infinity,farthest=-Infinity;
    for(let i=0;i<8;i++){
     corner.set(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z);
     const depth=corner.sub(cameraPosition).dot(forward);
     nearest=Math.min(nearest,depth);farthest=Math.max(farthest,depth);
    }
    if(farthest<=camera.near||nearest>=camera.far)return;
    frontDepth=Math.min(frontDepth,Math.max(camera.near,nearest));meshCount++;present=true;
   });
   if(present)actorCount++;
  }

  // A plane normal to the current camera keeps the single source in front of
  // every visible actor. Unprojection includes orbit and setViewOffset.
  const hasActors=Number.isFinite(frontDepth),minimumDepth=camera.near+.05;
  const targetDepth=hasActors?Math.max(minimumDepth,frontDepth-STANDOFF):Math.max(minimumDepth,6);
  const filteredDepth=state&&!reduced?THREE.MathUtils.lerp(state.planeDepth,targetDepth,blend):targetDepth;
  // Ease small depth changes from finger breathing and actor fades. A newly
  // approaching surface still bounds the source immediately on its front side.
  const planeDepth=hasActors?Math.max(minimumDepth,Math.min(filteredDepth,frontDepth-.15)):targetDepth;
  raycaster.setFromCamera(ndc,camera);
  const ray=raycaster.ray,denominator=ray.direction.dot(forward);
  const originDepth=point.copy(ray.origin).sub(cameraPosition).dot(forward);
  const distance=(planeDepth-originDepth)/Math.max(denominator,.000001);
  point.copy(ray.origin).addScaledVector(ray.direction,distance);
  light.position.copy(point);
  if(light.parent){light.parent.updateWorldMatrix(true,false);light.parent.worldToLocal(light.position)}
  light.updateWorldMatrix(false,false);

  // If a foreground actor leaves less than the normal clearance, lower the
  // power with inverse-square attenuation to avoid a very hot local highlight.
  const clearance=hasActors?Math.max(0,frontDepth-planeDepth):0;
  const safeIntensity=INTENSITY*Math.min(1,(clearance/STANDOFF)**2);
  const filteredIntensity=state?THREE.MathUtils.lerp(state.intensity,safeIntensity,blend):safeIntensity;
  light.intensity=reduced||!hasActors?0:Math.min(safeIntensity,filteredIntensity);
  projected.copy(point).project(camera);
  state={enabled:light.intensity>0,reduced,pointer:ndc.toArray(),position:point.toArray(),projection:projected.toArray(),projectionError:Math.hypot(projected.x-ndc.x,projected.y-ndc.y),frontDepth:hasActors?frontDepth:null,planeDepth,clearance,intensity:light.intensity,power:light.power,distance:light.distance,decay:light.decay,actorCount,meshCount};
  return getState();
 }
 function getState(){return state?{...state,pointer:[...state.pointer],position:[...state.position],projection:[...state.projection]}:null}
 return {update,getState};
}
