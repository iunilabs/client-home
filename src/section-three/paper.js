import * as THREE from 'three';
import {surfaceTexture} from './art.js';

// A closed paper shell: separate front/back faces plus the thin perimeter.
// Every vertex bends with the sheet, including its back and cut edges.
function shell(width, height, nx, ny, radius, thickness) {
  const positions = [], uvs = [], faces = [], indices = [], base = [];
  const row = nx + 1, count = row * (ny + 1);
  for (let side = 0; side < 2; side++) {
    for (let iy = 0; iy <= ny; iy++) for (let ix = 0; ix <= nx; ix++) {
      const y = (iy / ny - .5) * height;
      const cornerY = Math.max(0, Math.abs(y) - (height / 2 - radius));
      const inset = radius - Math.sqrt(Math.max(0, radius * radius - cornerY * cornerY));
      const x = (ix / nx - .5) * (width - 2 * inset), z = (side === 0 ? 1 : -1) * thickness / 2;
      positions.push(x, y, z); base.push(x, y, z); uvs.push(ix / nx, iy / ny); faces.push(side);
    }
    const offset = side * count;
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const a = offset + y * row + x, b = a + 1, c = a + row, d = c + 1;
      if (side === 0) indices.push(a, b, d, a, d, c); else indices.push(a, d, b, a, c, d);
    }
  }
  const perimeter = [];
  for (let x = 0; x <= nx; x++) perimeter.push(x);
  for (let y = 1; y <= ny; y++) perimeter.push(y * row + nx);
  for (let x = nx - 1; x >= 0; x--) perimeter.push(ny * row + x);
  for (let y = ny - 1; y > 0; y--) perimeter.push(y * row);
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i], b = perimeter[(i + 1) % perimeter.length]; indices.push(a, a + count, b + count, a, b + count, b);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setAttribute('paperSide', new THREE.Float32BufferAttribute(faces, 1)); geo.setIndex(indices); geo.computeVertexNormals();
  return {geo, base: new Float32Array(base)};
}
export function createPaper({kind, variant, width, height, grain, detailed = false, content = null, textureResolution = detailed ? 2048 : 512}) {
  const {geo, base} = shell(width, height, detailed ? 30 : 14, detailed ? 32 : 14, kind === 'note' ? .015 : Math.min(width, height) * .07, kind === 'note' || kind === 'letter' ? .0028 : .004);
  const material = new THREE.MeshPhysicalMaterial({
    map: surfaceTexture(kind, variant, textureResolution, content), color: '#ffffff', roughness: .86, metalness: 0,
    bumpMap: grain, bumpScale: .00065, sheen: .08, sheenRoughness: .95, sheenColor: new THREE.Color('#fff9ed'), specularIntensity: .18,
    clearcoat: 0, clearcoatRoughness: .9, side: THREE.FrontSide,
  });
  // The reverse is unprinted paper, not a mirrored software interface.
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float paperSide; varying float vPaperSide;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaperSide = paperSide;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPaperSide;').replace('#include <map_fragment>', '#include <map_fragment>\nif (vPaperSide > 0.5) diffuseColor.rgb = vec3(0.94, 0.95, 0.96);');
  };
  material.customProgramCacheKey = () => 'paper-shell-v2';
  const mesh = new THREE.Mesh(geo, material); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  let last = '';
  function deform(curl, twist, flutter, phase, corners = [0, 0, 0, 0]) {
    const key = [curl, twist, flutter, phase, ...corners].map(v => v.toFixed(4)).join(','); if (key === last) return; last = key;
    const a = geo.attributes.position.array;
    for (let i = 0; i < base.length; i += 3) {
      const x = base[i], y = base[i + 1], u = x / width, v = y / height;
      const freeEdge = (.5 - v), corner = Math.pow(Math.max(0, Math.abs(u) * 2 - .5), 2);
      const bow = curl * (u * u * width * .68 + Math.pow(freeEdge, 2) * height * .19);
      const torsion = twist * u * v * width * .48;
      const left = Math.pow(Math.max(0, -u * 2), 2.4), right = Math.pow(Math.max(0, u * 2), 2.4);
      const top = Math.pow(Math.max(0, v * 2), 2.4), bottom = Math.pow(Math.max(0, -v * 2), 2.4);
      const cornerLift = (corners[0] * left * top + corners[1] * right * top + corners[2] * left * bottom + corners[3] * right * bottom) * Math.min(width, height);
      const ripple = flutter * Math.sin(v * 5.4 + phase) * (freeEdge * .8 + corner) * height * .048;
      a[i] = x - curl * curl * x * u * u * .065;
      a[i + 1] = y + Math.abs(curl) * Math.pow(freeEdge, 3) * height * .012;
      a[i + 2] = base[i + 2] + bow + torsion + ripple + cornerLift;
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox();
  }
  return {mesh, deform, width, height, kind, subject: material.map.userData.subject};
}
