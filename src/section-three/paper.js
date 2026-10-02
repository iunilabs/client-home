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
// A settled sheet keeps its rounded outline and physical thickness, but no
// longer needs the interior grid used for curl and flutter.
function flatShell(width, height, radius, thickness) {
  const outline = [];
  for (const [x, y, start] of [[width/2-radius,height/2-radius,0],[-width/2+radius,height/2-radius,Math.PI/2],[-width/2+radius,-height/2+radius,Math.PI],[width/2-radius,-height/2+radius,Math.PI*1.5]]) {
    for (let i = 0; i <= 4; i++) {const angle = start + i * Math.PI/8; outline.push([x + Math.cos(angle)*radius, y + Math.sin(angle)*radius]);}
  }
  const positions = [], uvs = [], faces = [], indices = [], count = outline.length + 1;
  for (let side = 0; side < 2; side++) {
    const z = (side === 0 ? 1 : -1) * thickness/2, offset = side*count;
    for (const [x,y] of [[0,0], ...outline]) {positions.push(x,y,z); uvs.push(x/width+.5,y/height+.5); faces.push(side);}
    for (let i = 0; i < outline.length; i++) {const a = offset+1+i, b = offset+1+(i+1)%outline.length; indices.push(...(side === 0 ? [offset,a,b] : [offset,b,a]));}
  }
  for (let i = 0; i < outline.length; i++) {const a = 1+i, b = 1+(i+1)%outline.length; indices.push(a,a+count,b+count,a,b+count,b);}
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('paperSide', new THREE.Float32BufferAttribute(faces,1));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  return geometry;
}
export function createPaper({kind, variant, width, height, grain, detailed = false, content = null, textureResolution = detailed ? 2048 : 512}) {
  const radius = kind === 'note' ? .015 : Math.min(width, height) * .07, thickness = kind === 'note' || kind === 'letter' ? .0028 : .004;
  const {geo, base} = shell(width, height, detailed ? 30 : 14, detailed ? 32 : 14, radius, thickness);
  const flat = flatShell(width, height, radius, thickness);
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
  // Ordered paper is matte: diffuse lighting retains the grain, real shadows
  // and depth without evaluating sheen/specular reflections on every layer.
  const workflowMaterial = new THREE.MeshLambertMaterial({map: material.map, color: material.color,
    bumpMap: grain, bumpScale: material.bumpScale, side: THREE.FrontSide});
  workflowMaterial.onBeforeCompile = material.onBeforeCompile;
  workflowMaterial.customProgramCacheKey = material.customProgramCacheKey;
  const mesh = new THREE.Mesh(geo, material); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  const pendingMap = material.map;
  let completedMap = null;
  function prepareCompleted() {
    // Completed cards are smaller on screen; 1024px still exceeds their Retina footprint.
    return completedMap ??= surfaceTexture(kind, variant, Math.min(textureResolution, 1024), content, true);
  }
  function setCompleted(completed) {
    material.map = completed ? prepareCompleted() : pendingMap;
    workflowMaterial.map = material.map;
  }
  const coefficients = new Float64Array(base.length / 3 * 10);
  for (let i = 0, j = 0; i < base.length; i += 3, j += 10) {
    const x = base[i], y = base[i + 1], u = x / width, v = y / height, freeEdge = .5 - v;
    const corner = Math.pow(Math.max(0, Math.abs(u) * 2 - .5), 2);
    const left = Math.pow(Math.max(0, -u * 2), 2.4), right = Math.pow(Math.max(0, u * 2), 2.4);
    const top = Math.pow(Math.max(0, v * 2), 2.4), bottom = Math.pow(Math.max(0, -v * 2), 2.4);
    coefficients.set([x * u * u * .065, Math.pow(freeEdge, 3) * height * .012,
      u * u * width * .68 + freeEdge * freeEdge * height * .19, u * v * width * .48,
      left * top * Math.min(width, height), right * top * Math.min(width, height),
      left * bottom * Math.min(width, height), right * bottom * Math.min(width, height),
      v * 5.4, (freeEdge * .8 + corner) * height * .048], j);
  }
  let last = '';
  function deform(curl, twist, flutter, phase, corners = [0, 0, 0, 0]) {
    const key = [curl, twist, flutter, phase, ...corners].map(v => v.toFixed(4)).join(','); if (key === last) return; last = key;
    const a = geo.attributes.position.array;
    for (let i = 0, j = 0; i < base.length; i += 3, j += 10) {
      const c = coefficients;
      a[i] = base[i] - curl * curl * c[j];
      a[i + 1] = base[i + 1] + Math.abs(curl) * c[j + 1];
      a[i + 2] = base[i + 2] + curl * c[j + 2] + twist * c[j + 3]
        + corners[0] * c[j + 4] + corners[1] * c[j + 5] + corners[2] * c[j + 6] + corners[3] * c[j + 7]
        + flutter * Math.sin(c[j + 8] + phase) * c[j + 9];
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox();
  }
  return {mesh, deform, prepareCompleted, setCompleted, setFlat: value => {mesh.geometry = value ? flat : geo;},
    setWorkflowMaterial: value => {mesh.material = value ? workflowMaterial : material;}, materials: () => [material, workflowMaterial],
    deformedGeometry: geo, geometries: () => [geo, flat], textures: () => [pendingMap, completedMap].filter(Boolean), width, height, kind, subject: pendingMap.userData.subject};
}
