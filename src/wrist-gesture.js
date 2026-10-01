import * as THREE from 'three';

// The photographic rig has a separate palm bone. Bend it at the wrist while
// leaving the forearm in place, rather than rotating the entire arm as one piece.
export function createWristGesture(hand){
 const wrist=hand.scene.getObjectByName('metacarpals')??hand.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName('DEF-hand.L'));
 if(!wrist)return {reset(){},apply(){}};
 const bind=wrist.quaternion.clone(),axis=new THREE.Vector3(),q=new THREE.Quaternion();
 return {
  reset(){wrist.quaternion.copy(bind)},
  apply(angle){
   if(!angle)return;
   axis.set(0,0,1).applyQuaternion(wrist.getWorldQuaternion(q).invert());
   wrist.quaternion.multiply(q.setFromAxisAngle(axis,angle));hand.root.updateMatrixWorld(true);hand.skin.onBeforeRender?.();
  },
 };
}

export function createThumbGesture(hand){
 const thumb=hand.scene.getObjectByName('thumb-metacarpal')??hand.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName('DEF-thumb.01.L')),axis=new THREE.Vector3(),q=new THREE.Quaternion();
 return {apply(angle){if(!thumb||!angle)return;axis.set(0,0,1).applyQuaternion(thumb.getWorldQuaternion(q).invert());thumb.quaternion.multiply(q.setFromAxisAngle(axis,angle));hand.root.updateMatrixWorld(true)}};
}
