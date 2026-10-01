import * as THREE from 'three';

// Independent MCP/PIP/DIP articulation on the experience's rig instance.
// Other hand poses still use the model's existing proportional curl control.
export function createFingerGesture(hand){
 const entries=[],q=new THREE.Quaternion();
 for(const [finger,role]of ['index','middle','ring','pinky'].entries())for(let joint=1;joint<=3;joint++){
  const name=THREE.PropertyBinding.sanitizeNodeName(`DEF-f_${role}.${String(joint).padStart(2,'0')}.L`),bone=hand.scene.getObjectByName(name),rest=hand.metadata?.bones[name];
  if(!bone||!rest)continue;
  // Rig axes are canonical bone-local values. Root reflection, camera and
  // previously sampled poses must never change the flexion plane.
  if(!rest.flexionAxisLocal||!rest.abductionAxisLocal)throw new Error(`Missing canonical articulation axes: ${name}`);
  entries.push({bone,finger:finger+1,joint,bend:new THREE.Vector3(...rest.flexionAxisLocal),spread:new THREE.Vector3(...rest.abductionAxisLocal)});
 }
 function update(){hand.root.updateMatrixWorld(true);hand.skin.onBeforeRender?.()}
 return {breathe(time,weight=1){
  if(!weight)return;
  for(const {bone,finger,joint,bend}of entries){if(finger<2)continue;
   const phase=(finger-2)*1.7,variation=Math.sin(time*(.67+(finger-2)*.09)+phase)*.020+Math.sin(time*.29+phase*.8)*.008;
   bone.quaternion.multiply(q.setFromAxisAngle(bend,variation*[0,.6,.8,.5][joint]*weight));
  }
  update();
 },apply(curls,flexions,spreads,weight=1){
  if(!flexions||!weight)return;
  for(const {bone,finger,joint,bend,spread}of entries){
   const base=THREE.MathUtils.clamp(curls[finger],0,1)*[0,1.3,1.45,.85][joint],angle=flexions[finger-1]?.[joint-1]??base;
   bone.quaternion.multiply(q.setFromAxisAngle(bend,(angle-base)*weight));
   if(joint===1)bone.quaternion.multiply(q.setFromAxisAngle(spread,(spreads?.[finger-1]??0)*weight));
  }
  update();
 }};
}
