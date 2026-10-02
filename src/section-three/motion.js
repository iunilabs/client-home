import {MathUtils} from 'three';
export const clamp = (v, a = 0, b = 1) => MathUtils.clamp(v, a, b);
export const mix = MathUtils.lerp;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export function randomSource(seed) { return () => {seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296;}; }

// Offline aerodynamic approximation: gravity, quadratic drag, lateral air,
// damped angular inertia. Scroll samples the recorded fall, so reversing it
// never changes the path or makes a new random cloud.
export function flightTrack(seed) {
  const rand = randomSource(seed), phase = rand() * Math.PI * 2;
  const dt = 1 / 90, duration = 5.6, path = [];
  let x = 0, y = 0, z = 0, vx = .25, vy = -.08, vz = 0;
  let pitch = -.45 + rand() * .9, roll = -.25, yaw = -.6 + rand() * 1.2;
  let ap = 0, ar = .5, ay = 0;
  for (let i = 0; i <= duration / dt; i++) {
    const t = i * dt;
    const pitchTarget = Math.sin(t * 2.1 + phase) * .68 + Math.sin(t * .82) * .25;
    const rollTarget = Math.sin(t * 1.55 + phase + 1) * .48;
    ap += ((pitchTarget - pitch) * 7 - ap * 1.7) * dt;
    ar += ((rollTarget - roll) * 5 - ar * 1.5) * dt;
    ay += ((Math.sin(t * .9 + phase) * .72 - yaw) * 2.4 - ay * 1.1) * dt;
    pitch += ap * dt; roll += ar * dt; yaw += ay * dt;
    const air = Math.sin(t * 1.6 + phase) * .45 + Math.sin(t * .7) * .3;
    const broadside = .35 + .65 * Math.abs(Math.cos(pitch));
    vy += (-2.0 - .48 * broadside * vy * Math.abs(vy)) * dt;
    vx += ((air + Math.sin(roll) * .7) - vx * .65) * dt;
    vz += ((Math.sin(pitch) * .22) - vz * .8) * dt;
    x += vx * dt; y += vy * dt; z += vz * dt;
    path.push({x, y, z, pitch, roll, yaw});
  }
  const end = path.at(-1), drop = path[0].y - end.y;
  return t => {
    const index = clamp(t) * (path.length - 1), a = path[Math.floor(index)], b = path[Math.min(Math.floor(index) + 1, path.length - 1)], f = index % 1;
    return {
      x: mix(a.x, b.x, f) - end.x, y: (mix(a.y, b.y, f) - end.y) / drop,
      z: mix(a.z, b.z, f) - end.z,
      pitch: mix(a.pitch, b.pitch, f), roll: mix(a.roll, b.roll, f), yaw: mix(a.yaw, b.yaw, f),
    };
  };
}
