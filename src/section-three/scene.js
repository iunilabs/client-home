import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {CHANNELS, paperGrain, backdrop} from './art.js';
import {createPaper} from './paper.js';
import {createSceneInput} from './input.js';
import {createCursorSurfaceLight} from '../cursor-surface-light.js';
import {createRenderBudget} from '../render-budget.js';
import {clamp, mix, smooth, randomSource, flightTrack} from './motion.js';
import {paperTiming} from './timing.js';
import {assignPaperLanes} from './separation.js';
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
  renderer.toneMappingExposure = .98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene(); scene.background = backdrop(); scene.backgroundIntensity = 1.5; scene.fog = new THREE.FogExp2('#e7f2fa', .003);
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, .1, 220); camera.position.set(0, 0, 18);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(), environment = pmrem.fromScene(room, .045);
  scene.environment = environment.texture; scene.environmentIntensity = .24; pmrem.dispose(); room.dispose();
  scene.add(new THREE.HemisphereLight('#f4f8ff', '#a8c4d8', .38));
  const key = new THREE.DirectionalLight('#fff8ed', 2.15); key.position.set(-6, 8, 12); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -60, right: 60, top: 60, bottom: -60, near: .1, far: 220});
  key.shadow.bias = -.00015; key.shadow.normalBias = .015; key.shadow.radius = 2; key.shadow.blurSamples = 8;
  const fill = new THREE.DirectionalLight('#d4eaff', .32); fill.position.set(7, 1, 8); scene.add(fill);
  const rim = new THREE.DirectionalLight('#d2edff', .9); rim.position.set(2, 6, -7); scene.add(rim);
  const cursorLight = new THREE.SpotLight('#fff4df', 0, 6, .65, .8, 2); scene.add(cursorLight, cursorLight.target);
  const cursorSurface = createCursorSurfaceLight(cursorLight);
  const renderTarget = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {type: THREE.HalfFloatType, samples: devicePixelRatio > 1 ? 2 : 4});
  const composer = new EffectComposer(renderer, renderTarget); composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());
  const pixelBudget = createRenderBudget({setPixelRatio(ratio) {
    renderer.setPixelRatio(ratio); composer.setPixelRatio(ratio);
  }}, () => Math.min(devicePixelRatio, innerWidth < 700 ? 3 : 2,
    Math.sqrt(5_200_000 / (innerWidth * innerHeight))), {minScale: .8});

  await Promise.all([document.fonts.load('400 40px Manrope'), document.fonts.load('400 80px "Paper Hand"')]);
  const grain = paperGrain();
  const closeTextureSize = innerWidth < 700 ? 1536 : 2048;
  const pieces = [], heroes = [], field = [], foreground = [];
  const variantCounts = new Map([['note', 1]]);
  const rand = randomSource(31415);
  function addPaper(kind, variant, width, height, seed, detailed = false, content = null) {
    if (!content) {variant = variantCounts.get(kind) ?? 0; variantCounts.set(kind, variant + 1);}
    const paper = createPaper({kind, variant, width, height, grain, detailed, content, textureResolution: detailed ? closeTextureSize : 512});
    scene.add(paper.mesh); paper.mesh.visible = false;
    const piece = {...paper, flight: flightTrack(seed), seed, phase: seed % 100 / 100 * Math.PI * 2};
    pieces.push(piece); return piece;
  }
  const note = addPaper('chat', 0, 3.65, 2.25, 97, true, {message: 'Oye, ¿has conseguido automatizar eso? Lo necesitábamos ayer.', status: 'Pendiente'});
  const letter = addPaper('letter', 0, 3.85, 4.44, 192, true);
  for (let i = 0; i < 5; i++) heroes.push(addPaper(CHANNELS[i], i % 2, 3.65, 2.25, 297 + i * 117, true));
  for (let i = 0; i < 36; i++) {
    const kind = i < 8 ? 'note' : i % 9 === 0 ? 'letter' : CHANNELS[i % CHANNELS.length];
    const w = kind === 'note' ? 1.85 + rand() * .6 : kind === 'letter' ? 2.1 : 2.35 + rand() * .7;
    const h = kind === 'note' ? w * 1.06 : kind === 'letter' ? w * 1.15 : w * .62;
    const p = addPaper(kind, i % 3, w, h, 701 + i * 53);
    const a = i * 2.39996;
    p.waveOffset = i < 8 ? i / 8 : (i - 8) / 27;
    p.scatter = [Math.cos(a) * (.5 + rand() * .44), Math.sin(a) * (.45 + rand() * .5), -4 - rand() * 9];
    p.rot = [(rand() - .5) * 1.5, (rand() - .5) * 2.15, (rand() - .5) * 1.4];
    field.push(p);
  }
  const foregroundKinds = ['qa', 'test', 'deploy', 'summary'];
  for (let i = 0; i < foregroundKinds.length; i++) {
    const p = addPaper(foregroundKinds[i], i, 4.1, 2.55, 4101 + i * 47, true);
    p.anchor = [[-.87, -.68, 7.3], [.89, .71, 6.8], [-.84, .62, 6.7], [.92, -.65, 7.5]][i]; foreground.push(p);
  }
  let portrait = false, target = 0, progress = 0, height = 0, active = false, force = true, disposed = false, lost = false, lastState = null;
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
    for (const piece of pieces) {
      piece.tilt = field.includes(piece) ? .10 : .18;
      piece.maxCurl = piece.kind === 'letter' ? .30 : piece.kind === 'note' ? .20 : .14;
      piece.maxScale = piece === note ? (portrait ? 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (18 - 3.4) * camera.aspect * .9 / note.width : 1.3) : piece === letter ? (portrait ? .74 : 1.16) : foreground.includes(piece) ? (portrait ? .42 : .85) : field.includes(piece) ? (portrait ? .64 : 1) : (portrait ? .51 : 1);
    }
    assignPaperLanes([note, letter, ...heroes, ...foreground, ...field]);
    // Resolve Retina text without oversizing the multisampled render targets.
    pixelBudget.resize(); renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    height = Math.max(1, journey.offsetHeight - innerHeight); updateTarget(); force = true;
  }
  function contextLost(event) {
    event.preventDefault(); lost = true; active = false;
    input.setActive(false); inputState = input.update(0, performance.now()); cursorLight.intensity = 0;
    errorElement.hidden = false; journey.dataset.paperRender = 'fallback';
  }
  function contextRestored() {
    if (disposed) return;
    lost = false; previous = performance.now(); force = true;
    errorElement.hidden = true; journey.dataset.paperRender = 'webgl'; resize();
  }
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  resize();

  function pose(piece, x, y, rx, ry, rz, scale, curl, twist, flutter, phase) {
    const {mesh} = piece; atScreen(x, y, piece.depth, mesh.position);
    mesh.rotation.set(clamp(rx, -piece.tilt, piece.tilt), clamp(ry, -piece.tilt, piece.tilt), clamp(rz, -.35, .35), 'YXZ');
    mesh.scale.setScalar(Math.min(scale, piece.maxScale));
    const corners = [0, 2.1, 4.3, 1.4].map((a, i) => .018 * Math.sin(piece.phase + a) + .016 * Math.sin(breezeClock * (i % 2 ? .83 : 1.07) + piece.phase + a));
    piece.deform(clamp(curl + .025 * Math.sin(breezeClock * .62 + piece.phase), -piece.maxCurl, piece.maxCurl),
      clamp(twist + .03 * Math.sin(breezeClock * .74 + piece.phase), -.08, .08), Math.min(flutter, .26), phase, corners);
  }
  function falling(piece, p, start, duration, anchor, rotation, scale, curl, idle, strength = 1) {
    piece.start = start; const t = clamp((p - start) / duration); piece.spawnProgress = t; piece.mesh.visible = p > start;
    if (!piece.mesh.visible) return;
    const f = piece.flight(t), settle = smooth(.7, 1, t), air = 1 - settle;
    pose(piece, anchor[0], anchor[1], rotation[0] + f.pitch * air * strength * .22,
      rotation[1] + f.yaw * air * strength * .22, rotation[2] + f.roll * air * strength * .35, scale,
      curl + f.pitch * air * .025, f.roll * .035, air * .22 + .04, t * 13 + piece.phase + idle);
    piece.mesh.position.x += (f.x * .35 + Math.sin(t * Math.PI) * Math.sin(piece.phase) * .15) * scale;
    const box = piece.mesh.geometry.boundingBox, offset = new THREE.Vector3();
    let entryY = -Infinity;
    for (let i = 0; i < 8; i++) {
      offset.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
        .applyQuaternion(piece.mesh.quaternion).multiplyScalar(scale);
      const edge = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - piece.depth - offset.z);
      entryY = Math.max(entryY, edge - offset.y + .01);
    }
    piece.mesh.position.y += f.y * (entryY - piece.mesh.position.y);
  }
  function draw(p, seconds) {
    breezeClock = capture || reducedQuery.matches ? 0 : seconds * .72;
    const idle = capture || reducedQuery.matches ? 0 : Math.sin(seconds * .45) * .035;
    const timing = paperTiming(height), dense = smooth(timing.group, timing.grouped, p);
    const noteExit = smooth(timing.several, timing.many + timing.manySpread, p);
    const letterExit = smooth(timing.many, timing.group, p);
    const anchors = portrait ? [[-.24,.61],[.30,.29],[.05,-.35],[-.24,-.05],[.30,-.65]] : [[-.28,.51],[.47,.29],[.10,-.59],[-.32,-.17],[.49,-.24]];
    const schedule = [
      {piece: note, start: timing.first, duration: timing.firstDuration, anchor: [mix(portrait ? 0 : .1, -.5, noteExit), mix(-.02, .34, noteExit)], rotation: [-.05,-.08,-.13], scale: note.maxScale * mix(1, .75, noteExit), curl: .09, strength: 1.25},
      {piece: letter, start: timing.several, duration: timing.severalDuration, anchor: [mix(portrait ? .03 : .2, -.08, letterExit), mix(.08, -.35, letterExit)], rotation: [-.08,-.10,.19], scale: letter.maxScale * mix(1, .75, letterExit), curl: .23},
      ...heroes.map((piece, i) => ({piece, start: timing.several + timing.severalSpread * (i + 1) / 5, duration: timing.severalDuration, anchor: anchors[i], rotation: [[-.08,-.10,.11],[.06,.12,-.18],[-.08,-.12,.15],[.10,.10,-.15],[-.10,-.08,-.10]][i], scale: piece.maxScale, curl: .08})),
      ...field.map((piece, i) => ({piece, start: (i < 8 ? timing.several : timing.many) + piece.waveOffset * (i < 8 ? timing.severalSpread : timing.manySpread), duration: i < 8 ? timing.severalDuration : timing.manyDuration, anchor: piece.scatter, rotation: [piece.rot[0] * .10, piece.rot[1] * .10, piece.rot[2] * .35], scale: piece.maxScale, curl: piece.kind === 'letter' ? .23 : piece.kind === 'note' ? .12 : .07})),
      ...foreground.map((piece, i) => ({piece, start: timing.many + timing.manySpread * i / 3, duration: timing.manyDuration, anchor: piece.anchor, rotation: [.10,-.12 + i * .07,(i % 2 ? -1 : 1) * .25], scale: piece.maxScale, curl: .08})),
    ];
    for (const {piece, start, duration, anchor, rotation, scale, curl, strength = .8} of schedule) {
      // Every paper joins the same right-hand volume; none is left at its old anchor.
      const isMessage = piece === note, isLetter = piece === letter;
      const x = isMessage ? (portrait ? .58 : .47) : isLetter ? (portrait ? .55 : .66) : .56 + Math.sin(piece.phase * 2.3) * (portrait ? .12 : .18);
      const y = isMessage ? -.08 : isLetter ? .18 : Math.sin(piece.phase * 3.7) * .40;
      const finalScale = piece.maxScale * (isMessage ? (portrait ? .32 : .45) : isLetter ? (portrait ? .52 : .66) : field.includes(piece) ? .85 : (portrait ? .78 : .90));
      const position = [mix(anchor[0], x, dense), mix(anchor[1], y, dense) + idle * (1 - dense) * Math.sin(piece.phase)];
      falling(piece, p, start, duration, position, rotation.map((r, i) => mix(r, i === 2 ? Math.sin(piece.phase) * .25 : r * .55, dense)), mix(scale, finalScale, dense), curl, idle, strength);
    }
    camera.updateMatrixWorld();
    const lightState = cursorSurface.update(camera, inputState.pointer, pieces.map(piece => piece.mesh), !inputState.hovering, frameDelta);
    cursorLight.intensity *= .028;
    renderer.info.autoReset = false; renderer.info.reset(); renderer.shadowMap.needsUpdate = true; composer.render();
    lastState = {progress: p, visibleItems: pieces.filter(i => i.mesh.visible).length, groupProgress: dense, secondEntryPixels: timing.several * height, lastEntryPixels: (timing.many + timing.manySpread) * height, lastFallEndPixels: (timing.many + timing.manySpread + timing.manyDuration) * height, groupingPixels: timing.group * height, scrollRange: height, glass: 0, drawCalls: renderer.info.render.calls, geometries: renderer.info.memory.geometries, reducedMotion: reducedQuery.matches,
      hero: {position: note.mesh.position.toArray(), rotation: note.mesh.rotation.toArray().slice(0,3), bend: note.mesh.geometry.attributes.position.array[2]}, letterCorners: [0,30,992,1022].map(i => letter.mesh.geometry.attributes.position.array[i*3+2]), version: 4, depthOfField: false, parallax: {x: inputState.x, y: inputState.y, gyro: inputState.orientation}, cursorLight: {...lightState, intensity: cursorLight.intensity}, contentCount: new Set(pieces.map(i => i.subject)).size, totalItems: pieces.length};
  }
  const review = {
    subjects: pieces.map(piece => piece.subject),
    get starts() {return pieces.map(piece => piece.start).filter(Number.isFinite);},
    cards() {
      return pieces.map(piece => {
        if (!piece.mesh.geometry.boundingBox) piece.mesh.geometry.computeBoundingBox();
        const box = new THREE.Box3().copy(piece.mesh.geometry.boundingBox).applyMatrix4(piece.mesh.matrixWorld);
        const screen = {left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity};
        for (let i = 0; i < 8; i++) {
          const v = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
          screen.left = Math.min(screen.left, v.x); screen.right = Math.max(screen.right, v.x); screen.bottom = Math.min(screen.bottom, v.y); screen.top = Math.max(screen.top, v.y);
        }
        return {subject: piece.subject, visible: piece.mesh.visible, depth: piece.depth, half: piece.depthHalf, min: box.min.toArray(), max: box.max.toArray(), screen};
      });
    },
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
      if (disposed || lost) return;
      // A queued RAF can predate initialization or context recovery.
      const dt = Math.max(0, Math.min((now - previous) / 1000, .05)); previous = now;
      active = visible && !document.hidden;
      input.setActive(active);
      inputState = input.update(dt, now);
      if (!active) {cursorLight.intensity = 0; return;}
      if (!capture) pixelBudget.update(now / 1000, reducedQuery.matches);
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
    getState: () => ({...lastState, active, firstSubject: note.subject, firstKind: note.kind, firstEntryPixels: note.start * height}),
    getReview: () => review,
    dispose() {
      if (disposed) return; disposed = true; input.dispose();
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      const textures = new Set();
      for (const piece of pieces) {piece.mesh.geometry.dispose(); textures.add(piece.mesh.material.map); piece.mesh.material.dispose();}
      for (const texture of textures) texture.dispose();
      grain.dispose(); scene.background.dispose(); environment.dispose(); composer.dispose(); renderer.dispose();
    },
  };
}
