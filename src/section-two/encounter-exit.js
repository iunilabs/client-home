import * as THREE from 'three';

const up = new THREE.Vector3(0, 1, 0);

export function turnEncounterCamera(position, look, transition) {
  const direction = look.clone().sub(position);
  position.addScaledVector(direction.clone().normalize(), -transition.retreat);
  look.copy(position).add(direction.applyAxisAngle(up, transition.yaw));
}

// The accepted meeting pose remains the starting point on every frame.
// Transform only the composition after the new section has started.
export function turnEncounterHands(human, porcelain, transition) {
  const meeting = human.tipWorld().add(porcelain.tipWorld()).multiplyScalar(.5);
  const depthRotation = new THREE.Quaternion().setFromAxisAngle(up, transition.depthTurn);
  for (const hand of [human, porcelain]) {
    hand.root.position.sub(meeting).multiplyScalar(transition.handScale).applyQuaternion(depthRotation).add(meeting);
    hand.root.scale.multiplyScalar(transition.handScale);
    hand.root.quaternion.premultiply(depthRotation);
  }
  for (const [hand, roll, tilt, spin] of [
    [human, transition.humanRoll, transition.handTilt, transition.humanSpin],
    [porcelain, transition.porcelainRoll, -transition.handTilt, transition.porcelainSpin],
  ]) {
    const pivot = hand.tipWorld();
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, tilt, roll));
    hand.root.position.sub(pivot).applyQuaternion(rotation).add(pivot);
    hand.root.quaternion.premultiply(rotation);
    const axis = hand.tipWorld().sub(hand.root.position).normalize();
    hand.root.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, spin));
    hand.root.visible = transition.handsVisible;
  }
}
