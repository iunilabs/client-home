import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {CHANNELS, paperGrain, backdrop} from './art.js';
import {createPaper} from './paper.js';
import {createSceneInput} from './input.js';
import {createCursorSurfaceLight} from '../cursor-surface-light.js';
import {clamp, mix, smooth, randomSource, flightTrack} from './motion.js';
import './style.css';

export async function createPaperSection(journey) {
  const canvas = journey.querySelector('[data-paper-canvas]');
  const errorElement = journey.querySelector('[data-paper-fallback]');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const capture = new URLSearchParams(location.search).has('capture');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'}); }
  catch { errorElement.hidden = false; journey.dataset.paperRender = 'fallback'; throw new Error('WebGL unavailable'); }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene(); scene.background = backdrop(); scene.backgroundIntensity = 1.5; scene.fog = new THREE.FogExp2('#e7f2fa', .018);
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, .1, 65); camera.position.set(0, 0, 18);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(), environment = pmrem.fromScene(room, .045);
  scene.environment = environment.texture; scene.environmentIntensity = .24; pmrem.dispose(); room.dispose();
  scene.add(new THREE.HemisphereLight('#f4f8ff', '#a8c4d8', .38));
  const key = new THREE.DirectionalLight('#fff8ed', 2.65); key.position.set(-6, 8, 12); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -15, right: 15, top: 13, bottom: -13, near: .1, far: 55});
  key.shadow.bias = -.00045; key.shadow.normalBias = .075; key.shadow.radius = 4; key.shadow.blurSamples = 8;
  const fill = new THREE.DirectionalLight('#d4eaff', .32); fill.position.set(7, 1, 8); scene.add(fill);
  const rim = new THREE.DirectionalLight('#d2edff', .9); rim.position.set(2, 6, -7); scene.add(rim);
  const cursorLight = new THREE.SpotLight('#fff4df', 0, 6, .65, .8, 2); scene.add(cursorLight, cursorLight.target);
  const cursorSurface = createCursorSurfaceLight(cursorLight);
  const renderTarget = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {type: THREE.HalfFloatType, samples: 4});
  const composer = new EffectComposer(renderer, renderTarget); composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());

  await Promise.all([document.fonts.load('400 40px Manrope'), document.fonts.load('400 80px "DM Serif"')]);
  const grain = paperGrain();
  const pieces = [], heroes = [], field = [], foreground = [];
  const variantCounts = new Map();
  const rand = randomSource(31415);
  function addPaper(kind, variant, width, height, seed, detailed = false) {
    variant = variantCounts.get(kind) ?? 0; variantCounts.set(kind, variant + 1);
    const paper = createPaper({kind, variant, width, height, grain, detailed});
    scene.add(paper.mesh); paper.mesh.visible = false;
    const piece = {...paper, flight: flightTrack(seed), seed, phase: seed % 100 / 100 * Math.PI * 2};
    pieces.push(piece); return piece;
  }
  const note = addPaper('note', 0, 3.25, 3.45, 97, true);
  const letter = addPaper('letter', 0, 3.85, 4.44, 192, true);
  for (let i = 0; i < 5; i++) heroes.push(addPaper(CHANNELS[i], i % 2, 3.65, 2.25, 297 + i * 117, true));
  for (let i = 0; i < 64; i++) {
    const kind = i < 13 ? 'note' : i % 9 === 0 ? 'letter' : CHANNELS[i % 5];
    const w = kind === 'note' ? 1.85 + rand() * .6 : kind === 'letter' ? 2.1 : 2.35 + rand() * .7;
    const h = kind === 'note' ? w * 1.06 : kind === 'letter' ? w * 1.15 : w * .62;
    const p = addPaper(kind, i % 3, w, h, 701 + i * 53);
    const a = i * 2.39996, layer = i % 4;
    p.start = i < 13 ? .16 + i * .007 : .27 + (i - 13) / 51 * .49 + rand() * .018; p.duration = .13 + rand() * .08;
    p.scatter = [Math.cos(a) * (.5 + rand() * .44), Math.sin(a) * (.45 + rand() * .5), -4 - rand() * 9];
    p.column = [.27 + Math.cos(a) * (.1 + rand() * .27), -.91 + (i % 13) / 12 * 1.82 + (rand() - .5) * .1, layer === 0 ? -1.9 + rand() : -4.2 - rand() * 7];
    p.rot = [(rand() - .5) * 1.5, (rand() - .5) * 2.15, (rand() - .5) * 1.4];
    field.push(p);
  }
  for (let i = 0; i < 4; i++) {
    const p = addPaper(CHANNELS[i], i, 4.1, 2.55, 4101 + i * 47);
    p.anchor = [[-.87, -.68, 7.3], [.89, .71, 6.8], [-.84, .62, 6.7], [.92, -.65, 7.5]][i]; p.start = .31 + i * .075; foreground.push(p);
  }
  let portrait = false, target = 0, progress = 0, height = 0, active = false, force = true, disposed = false, lastState = null;
  const point = new THREE.Vector3();
  const input = createSceneInput({capture, reducedQuery, button: journey.querySelector('[data-paper-motion]'), onChange: () => {force = true;}});
  let inputState = input.update(1 / 60, performance.now()), breezeClock = 0, frameDelta = 1 / 60;
  function atScreen(x, y, z, out = point) {
    const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
    return out.set(x * h * camera.aspect, y * h, z);
  }
  function updateTarget(y = scrollY) { height = Math.max(1, journey.offsetHeight - innerHeight); target = clamp((y - journey.offsetTop) / height); }
  function resize() {
    portrait = innerWidth / innerHeight < .85;
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    const ratio = Math.min(devicePixelRatio, 1.5, 2100 / Math.max(innerWidth, innerHeight));
    renderer.setPixelRatio(ratio); renderer.setSize(innerWidth, innerHeight);
    composer.setPixelRatio(ratio); composer.setSize(innerWidth, innerHeight);
    height = Math.max(1, journey.offsetHeight - innerHeight); updateTarget(); force = true;
  }
  function contextLost(event) {event.preventDefault(); errorElement.hidden = false; journey.dataset.paperRender = 'fallback'; active = false;}
  canvas.addEventListener('webglcontextlost', contextLost);
  resize();

  function pose(piece, x, y, z, rx, ry, rz, scale, curl, twist, flutter, phase) {
    const {mesh} = piece; atScreen(x, y, z, mesh.position); mesh.rotation.set(rx, ry, rz, 'YXZ'); mesh.scale.setScalar(scale);
    const slow = breezeClock;
    const cornerPhases = [piece.phase, piece.phase + 2.1, piece.phase + 4.3, piece.phase + 1.4];
    const corners = cornerPhases.map((a, i) => .023 * Math.sin(a * 1.2) + .05 * Math.sin(slow * (i % 2 ? .83 : 1.07) + a));
    const torsion = Math.sin(slow * .74 + piece.phase) * .22;
    piece.deform(curl + .10 * Math.sin(slow * .62 + piece.phase), twist + torsion, flutter, phase, corners);
  }
  function falling(piece, p, start, duration, anchor, rotation, scale, curl, idle, strength = 1) {
    piece.start = start; const t = clamp((p - start) / duration); piece.spawnProgress = t; piece.mesh.visible = p > start;
    if (!piece.mesh.visible) return;
    const f = piece.flight(t), settle = smooth(.7, 1, t), air = 1 - settle;
    pose(piece, anchor[0], anchor[1], anchor[2], rotation[0] + f.pitch * air * strength, rotation[1] + f.yaw * air * strength, rotation[2] + f.roll * air * strength, scale,
      curl + f.pitch * air * .35, f.roll * .3 + idle * .1, air * .7 + .08, t * 13 + piece.phase + idle);
    piece.mesh.position.x += f.x * 1.6 * scale + Math.sin(t * Math.PI) * Math.sin(piece.phase) * .7 * scale;
    const top = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - piece.mesh.position.z);
    const clearance = Math.max(piece.width, piece.height) * scale + 1.8;
    piece.mesh.position.y += f.y * (top + clearance - piece.mesh.position.y);
    piece.mesh.position.z += f.z * 1.7;
  }
  function draw(p, seconds) {
    breezeClock = capture || reducedQuery.matches ? 0 : seconds * .72;
    const idle = capture || reducedQuery.matches ? 0 : Math.sin(seconds * .45) * .035;
    const heroScale = portrait ? .51 : 1;
    const scatter = smooth(.45, .73, p), dense = smooth(.57, .98, p);
    const noteExit = smooth(.19, .36, p), noteCloud = smooth(.58, .8, p);
    const noteAnchor = [mix(.1, -.55, noteExit) + .45 * noteCloud, mix(-.02, .34, noteExit) - .76 * noteCloud, mix(3.4, -5.6, noteExit) + noteCloud * 3];
    falling(note, p, .012, .145, noteAnchor, [mix(-.08, .4, noteExit), mix(-.32, .9, noteExit), mix(-.13, -.46, noteExit)], (portrait ? .76 : 1) * mix(1, .75, noteExit), .64 + noteExit * .25, idle, 1.25);
    const letterExit = smooth(.37, .55, p);
    const letterAnchor = [mix(portrait ? .03 : .2, portrait ? -.2 : .08, letterExit), mix(.08, -.45, letterExit), mix(3.2, -3.2, letterExit)];
    falling(letter, p, .20, .135, letterAnchor, [mix(-.16, -.36, letterExit), mix(-.42, .62, letterExit), mix(.19, -.30, letterExit)], (portrait ? .74 : 1.16) * mix(1, .70, letterExit), 1.02 - letterExit * .45, idle, .95);
    const anchors = portrait ? [[-.24,.61,3.0],[.30,.29,3.6],[.05,-.35,3.9],[-.24,-.05,3.1],[.30,-.65,3.3]] : [[-.28,.51,3.0],[.47,.29,3.6],[.10,-.59,3.9],[-.32,-.17,3.1],[.49,-.24,3.3]];
    const endings = portrait ? [[-.28,.60,3.0],[.32,.25,3.6],[-.08,-.60,3.9],[-.26,-.10,3.1],[.31,-.25,3.3]] : [[.12,.59,3.0],[.50,.25,3.6],[.14,-.68,3.9],[-.05,-.10,3.1],[.50,-.27,3.3]];
    heroes.forEach((piece, i) => {
      const a = anchors[i], b = endings[i], rot = [[-.13,-.15,.11],[.06,.25,-.18],[-.08,-.29,.15],[.12,.19,-.15],[-.20,-.16,-.10]][i];
      const anchor = a.map((v, n) => mix(v, b[n], scatter)); anchor[1] += idle * Math.sin(piece.phase);
      falling(piece, p, .34 + i * .024, .125, anchor, rot, heroScale * mix(1, .88, dense), .14 + dense * .12, idle, .7);
    });
    field.forEach((piece, i) => {
      const t = clamp((p - piece.start) / piece.duration); piece.spawnProgress = t; piece.mesh.visible = p > piece.start;
      if (!piece.mesh.visible) return;
      const f = piece.flight(t), a = piece.scatter, b = piece.column;
      const x = mix(a[0], portrait ? (b[0] - .18) * 1.6 : b[0], dense);
      const y = mix(a[1], b[1], dense) + idle * Math.sin(piece.phase);
      const z = mix(a[2], b[2], dense), settle = smooth(.65, 1, t);
      pose(piece, x, y, z, mix(f.pitch, piece.rot[0], settle) + dense * .10, mix(f.yaw, piece.rot[1], settle) + (i % 9 === 0 ? Math.PI * 2 * smooth(0, .95, t) : 0) + dense * Math.sin(piece.phase) * .25, mix(f.roll, piece.rot[2], settle) - dense * .08,
        portrait ? .64 : 1, (piece.kind === 'note' || piece.kind === 'letter' ? .62 : .16) + f.pitch * .17, piece.rot[1] * .25, (1 - settle) * .75 + .12, t * 14 + piece.phase + idle);
      piece.mesh.position.x += f.x * (portrait ? .6 : 1.3);
      const top = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - piece.mesh.position.z);
      piece.mesh.position.y += f.y * (top + Math.max(piece.width, piece.height) * (portrait ? .64 : 1) + 1.8 - piece.mesh.position.y);
      piece.mesh.position.z += f.z;
    });
    foreground.forEach((piece, i) => {
      const [x,y,z] = piece.anchor;
      falling(piece, p, piece.start, .19, [x, y - smooth(.56, .95, p) * (1.5 + i * .1), z], [.25,-.35 + i*.22,(i%2 ? -1 : 1)*.38], portrait ? .42 : .85, .3, idle, 1.1);
      piece.mesh.castShadow = false;
    });
    camera.updateMatrixWorld();
    const lightState = cursorSurface.update(camera, inputState.pointer, pieces.map(piece => piece.mesh), !inputState.hovering, frameDelta);
    cursorLight.intensity *= .028;
    renderer.info.autoReset = false; renderer.info.reset(); renderer.shadowMap.needsUpdate = true; composer.render();
    lastState = {progress: p, visibleItems: pieces.filter(i => i.mesh.visible).length, glass: 0, drawCalls: renderer.info.render.calls, geometries: renderer.info.memory.geometries, reducedMotion: reducedQuery.matches,
      hero: {position: note.mesh.position.toArray(), rotation: note.mesh.rotation.toArray().slice(0,3), bend: note.mesh.geometry.attributes.position.array[2]}, letterCorners: [0,30,992,1022].map(i => letter.mesh.geometry.attributes.position.array[i*3+2]), version: 4, depthOfField: false, parallax: {x: inputState.x, y: inputState.y, gyro: inputState.orientation}, cursorLight: {...lightState, intensity: cursorLight.intensity}, contentCount: new Set(pieces.map(i => i.subject)).size, totalItems: pieces.length};
  }
  const review = {
    subjects: pieces.map(piece => piece.subject),
    starts: pieces.map(piece => piece.start).filter(Number.isFinite),
    incoming() {
      return pieces.filter(piece => piece.mesh.visible && piece.spawnProgress < .02).map(piece => {
        const box = piece.mesh.geometry.boundingBox;
        let minimum = Infinity;
        for (let i = 0; i < 8; i++) {
          const v = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
          v.applyMatrix4(piece.mesh.matrixWorld).project(camera); minimum = Math.min(minimum, v.y);
        }
        return {subject: piece.subject, minimumY: minimum};
      });
    },
  };
  let previous = performance.now(), elapsed = 0, frames = 0, totalFrameTime = 0;
  function visibilityChanged() {
    previous = performance.now(); force = true;
    if (document.hidden) {
      active = false; input.setActive(false); inputState = input.update(0, previous); cursorLight.intensity = 0;
    }
  }
  document.addEventListener('visibilitychange', visibilityChanged);
  journey.classList.add('paper-ready'); journey.dataset.paperRender = 'webgl';
  return {
    update(now, y, visible) {
      if (disposed) return;
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      active = visible && !document.hidden;
      input.setActive(active);
      inputState = input.update(dt, now);
      if (!active) {cursorLight.intensity = 0; return;}
      elapsed += dt; frameDelta = dt;
      updateTarget(y);
      camera.position.set(inputState.x * .50, inputState.y * .35, 18);
      camera.lookAt(inputState.x * .09, inputState.y * .055, 0);
      const next = reducedQuery.matches ? target : mix(progress, target, 1 - Math.exp(-dt * 9));
      const moving = Math.abs(next - progress) > .000015;
      progress = Math.abs(next - target) < .00001 ? target : next;
      if (force || moving || (!reducedQuery.matches && !capture && progress > .015)) {
        const before = performance.now(); draw(progress, elapsed); force = false;
        frames++; totalFrameTime += performance.now() - before;
        lastState.averageCpuMs = totalFrameTime / frames;
      }
    },
    resize,
    getState: () => ({...lastState, active, firstSubject: note.subject}),
    getReview: () => review,
    dispose() {
      if (disposed) return; disposed = true; input.dispose();
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', contextLost);
      const textures = new Set();
      for (const piece of pieces) {piece.mesh.geometry.dispose(); textures.add(piece.mesh.material.map); piece.mesh.material.dispose();}
      for (const texture of textures) texture.dispose();
      grain.dispose(); scene.background.dispose(); environment.dispose(); composer.dispose(); renderer.dispose();
    },
  };
}
