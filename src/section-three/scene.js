import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {CHANNELS, paperGrain, backdrop} from './art.js';
import {createPaper} from './paper.js';
import {createSceneInput} from './input.js';
import {createCursorSurfaceLight} from '../cursor-surface-light.js';
import {createRenderBudget} from '../render-budget.js';
import {clamp, mix, smooth, randomSource, flightTrack} from './motion.js';
import {paperTiming, paperMotionPixels, paperScrollPixels} from './timing.js';
import {assignPaperLanes, paperDepthHalf} from './separation.js';
import {workflowState, cardWorkflow} from '../section-four/workflow.js';
import {createPreparationQueue} from './preparation.js';
import './style.css';

let fontsReady;
export function preparePaperFonts() {
  return fontsReady ??= Promise.all([document.fonts.load('400 40px Manrope'), document.fonts.load('400 80px "Paper Hand"')]);
}

export async function createPaperSection(journey, {graphics = null} = {}) {
  const preparationStart = performance.now(), preparation = createPreparationQueue();
  const fonts = preparePaperFonts();
  await preparation.yield();
  const painSection = journey.querySelector('#posibilidades');
  const resolutionSection = journey.querySelector('#resolucion');
  const placeholder = journey.querySelector('[data-paper-canvas]');
  const canvas = graphics?.renderer.domElement ?? placeholder;
  const originalParent = graphics ? canvas.parentElement : null;
  let attached = false;
  function attachCanvas(visible) {
    if (!graphics || attached === visible) return;
    attached = visible;
    if (visible) {placeholder.replaceWith(canvas); placeholder.removeAttribute('data-paper-canvas'); canvas.setAttribute('data-paper-canvas', '');}
    else {canvas.replaceWith(placeholder); canvas.removeAttribute('data-paper-canvas'); placeholder.setAttribute('data-paper-canvas', ''); originalParent.appendChild(canvas);}
  }
  const errorElement = journey.querySelector('[data-paper-fallback]');
  const stageElement = journey.querySelector('.paper-stage');
  const workflowElement = journey.querySelector('[data-paper-workflow]');
  const pendingCount = journey.querySelector('[data-pending-count]');
  const doneCount = journey.querySelector('[data-done-count]');
  const workflowStatus = journey.querySelector('[data-workflow-status]');
  const workflowTotal = journey.querySelector('[data-workflow-total]');
  const workflowFill = journey.querySelector('[data-workflow-fill]');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const capture = new URLSearchParams(location.search).has('capture');
  let renderer;
  let phaseStart = performance.now();
  try { renderer = graphics?.renderer ?? new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'}); }
  catch { errorElement.hidden = false; journey.dataset.paperRender = 'fallback'; throw new Error('WebGL unavailable'); }
  const rendererMs = performance.now() - phaseStart;
  function configureRenderer() {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .98;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    const budget = workflowProgress > 0 ? workflowBudget : pixelBudget;
    if (renderer.getPixelRatio() !== budget.pixelRatio) budget.resize();
  }
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#e7f2fa', .003);
  const backgroundTexture = backdrop();
  // Keep the original tone-mapped gradient in the direct render. Three's
  // built-in sRGB background bypasses tone mapping outside a compositor.
  const backgroundMaterial = new THREE.ShaderMaterial({
    uniforms: {map: {value: backgroundTexture}, intensity: {value: 1.5}},
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,1.0,1.0);}',
    fragmentShader: `uniform sampler2D map; uniform float intensity; varying vec2 vUv;
      void main(){gl_FragColor=vec4(texture2D(map,vUv).rgb*intensity,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  const background = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backgroundMaterial);
  background.frustumCulled = false; background.renderOrder = -Infinity; scene.add(background);
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, .1, 220); camera.position.set(0, 0, 18);
  phaseStart = performance.now();
  let environment = graphics?.environment;
  if (!environment) {
    const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
    environment = pmrem.fromScene(room, .045); pmrem.dispose(); room.dispose();
  }
  scene.environment = environment.texture; scene.environmentIntensity = .24;
  const environmentMs = performance.now() - phaseStart;
  scene.add(new THREE.HemisphereLight('#f4f8ff', '#a8c4d8', .38));
  const key = new THREE.DirectionalLight('#fff8ed', 2.15); key.position.set(-6, 8, 12); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -60, right: 60, top: 60, bottom: -60, near: .1, far: 220});
  key.shadow.bias = -.00015; key.shadow.normalBias = .015; key.shadow.radius = 2; key.shadow.blurSamples = 8;
  const fill = new THREE.DirectionalLight('#d4eaff', .32); fill.position.set(7, 1, 8); scene.add(fill);
  const rim = new THREE.DirectionalLight('#d2edff', .9); rim.position.set(2, 6, -7); scene.add(rim);
  const cursorLight = new THREE.SpotLight('#fff4df', 0, 6, .65, .8, 2); scene.add(cursorLight, cursorLight.target);
  const cursorSurface = createCursorSurfaceLight(cursorLight);
  const pixelBudget = createRenderBudget({setPixelRatio(ratio) {
    renderer.setPixelRatio(ratio);
  }}, () => Math.min(devicePixelRatio, innerWidth < 700 ? 3 : 2,
    Math.sqrt(5_200_000 / (innerWidth * innerHeight))), {minScale: .8});
  const workflowBudget = createRenderBudget(renderer, () => Math.min(devicePixelRatio, 2,
    Math.sqrt(2_000_000 / (innerWidth * innerHeight))), {minScale: .6, slowInterval: .024, fastInterval: .018});

  await fonts; await preparation.yield();
  const grain = paperGrain();
  const closeTextureSize = innerWidth < 700 ? 1536 : 2048;
  const pieces = [], heroes = [], field = [], foreground = [];
  const variantCounts = new Map([['note', 1]]);
  const rand = randomSource(31415);
  async function addPaper(kind, variant, width, height, seed, detailed = false, content = null) {
    if (!content) {variant = variantCounts.get(kind) ?? 0; variantCounts.set(kind, variant + 1);}
    const textureResolution = detailed ? (pieces.length < 2 ? closeTextureSize : 1024) : 512;
    const paper = await preparation.run(() => createPaper({kind, variant, width, height, grain, detailed, content, textureResolution}));
    await preparation.run(() => paper.prepareCompleted());
    for (const texture of paper.textures()) await preparation.run(() => renderer.initTexture(texture));
    scene.add(paper.mesh); paper.mesh.visible = false;
    const piece = {...paper, flight: flightTrack(seed), seed, phase: seed % 100 / 100 * Math.PI * 2};
    pieces.push(piece); return piece;
  }
  const note = await addPaper('chat', 0, 3.65, 2.25, 97, true, {message: 'Oye, ¿has conseguido automatizar eso? Lo necesitábamos ayer.', status: 'Pendiente'});
  const letter = await addPaper('letter', 0, 3.85, 4.44, 192, true);
  for (let i = 0; i < 5; i++) heroes.push(await addPaper(CHANNELS[i], i % 2, 3.65, 2.25, 297 + i * 117, true));
  for (let i = 0; i < 36; i++) {
    const kind = i < 8 ? 'note' : i % 9 === 0 ? 'letter' : CHANNELS[i % CHANNELS.length];
    const w = kind === 'note' ? 1.85 + rand() * .6 : kind === 'letter' ? 2.1 : 2.35 + rand() * .7;
    const h = kind === 'note' ? w * 1.06 : kind === 'letter' ? w * 1.15 : w * .62;
    const p = await addPaper(kind, i % 3, w, h, 701 + i * 53);
    const a = i * 2.39996;
    p.waveOffset = i < 8 ? i / 8 : (i - 8) / 27;
    p.scatter = [Math.cos(a) * (.5 + rand() * .44), Math.sin(a) * (.45 + rand() * .5), -4 - rand() * 9];
    p.rot = [(rand() - .5) * 1.5, (rand() - .5) * 2.15, (rand() - .5) * 1.4];
    field.push(p);
  }
  const foregroundKinds = ['qa', 'test', 'deploy', 'summary'];
  for (let i = 0; i < foregroundKinds.length; i++) {
    const p = await addPaper(foregroundKinds[i], i, 4.1, 2.55, 4101 + i * 47, true);
    p.anchor = [[-.87, -.68, 7.3], [.89, .71, 6.8], [-.84, .62, 6.7], [.92, -.65, 7.5]][i]; foreground.push(p);
  }
  [note, letter, ...heroes, ...foreground, ...field].forEach((piece, i) => {piece.workflowIndex = i;});
  let layoutVersion = 0;
  let portrait = false, target = 0, progress = 0, workflowTarget = 0, workflowProgress = 0, height = 0, active = false, force = true, shadowsInvalid = true, disposed = false, lost = false, lastState = null;
  const point = new THREE.Vector3();
  const input = createSceneInput({capture, reducedQuery, button: journey.querySelector('[data-paper-motion]'), onChange: () => {force = true;}});
  let inputState = input.update(1 / 60, performance.now()), breezeClock = 0, frameDelta = 1 / 60;
  function atScreen(x, y, z, out = point) {
    const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
    return out.set(x * h * camera.aspect, y * h, z);
  }
  function updateTarget(y = scrollY) {
    height = Math.max(1, painSection.offsetHeight - innerHeight);
    target = clamp((y - journey.offsetTop) / height);
    workflowTarget = clamp((y - journey.offsetTop - painSection.offsetHeight) / Math.max(1, resolutionSection.offsetHeight - innerHeight));
  }
  function resize() {
    layoutVersion++; shadowsInvalid = true;
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
    updateTarget(); force = true;
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

  function pose(piece, x, y, rx, ry, rz, scale, curl, twist, flutter, phase, deferDeformation = false) {
    piece.setFlat(false); piece.setWorkflowMaterial(false); piece.workflowPoseKey = null;
    const {mesh} = piece; atScreen(x, y, piece.depth, mesh.position);
    mesh.rotation.set(clamp(rx, -piece.tilt, piece.tilt), clamp(ry, -piece.tilt, piece.tilt), clamp(rz, -.35, .35), 'YXZ');
    mesh.scale.setScalar(Math.min(scale, piece.maxScale));
    const corners = [0, 2.1, 4.3, 1.4].map((a, i) => .018 * Math.sin(piece.phase + a) + .016 * Math.sin(breezeClock * (i % 2 ? .83 : 1.07) + piece.phase + a));
    piece.pose = {curl: clamp(curl + .025 * Math.sin(breezeClock * .62 + piece.phase), -piece.maxCurl, piece.maxCurl),
      twist: clamp(twist + .03 * Math.sin(breezeClock * .74 + piece.phase), -.08, .08), flutter: Math.min(flutter, .26), phase, corners};
    const pose = piece.pose;
    if (!deferDeformation) piece.deform(pose.curl, pose.twist, pose.flutter, pose.phase, pose.corners);
  }
  function orderedPose(piece, workflow, card) {
    piece.setWorkflowMaterial(workflow.ordered === 1);
    const flat = workflow.ordered === 1 && (card.travel === 0 || card.travel === 1);
    const stableKey = flat ? `${layoutVersion}/${card.travel}` : null;
    if (stableKey && piece.workflowPoseKey === stableKey) return;
    piece.workflowPoseKey = stableKey; piece.setFlat(flat);
    const {mesh} = piece, initial = piece.pose ?? {curl:0, twist:0, flutter:0, phase:0, corners:[0,0,0,0]}, order = workflow.ordered, air = 1 - order;
    const rx = mesh.rotation.x * air, ry = mesh.rotation.y * air;
    const curl = initial.curl * air + Math.sin(card.move * Math.PI) * .015;
    const twist = initial.twist * air, flutter = initial.flutter * air;
    const corners = initial.corners.map(c => c * air);
    const frustumWidth = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (18 - piece.depth) * camera.aspect;
    const wantedScale = frustumWidth * card.pixelWidth / innerWidth / piece.width;
    // A larger, flatter card must still fit its permanent physical depth lane.
    const unitHalf = paperDepthHalf({width: piece.width, height: piece.height, maxScale: 1,
      tilt: Math.max(Math.abs(rx), Math.abs(ry)), maxCurl: Math.abs(curl), maxTwist: Math.abs(twist),
      maxCorner: Math.max(...corners.map(Math.abs)), maxFlutter: flutter});
    mesh.scale.setScalar(Math.min(mix(mesh.scale.x, wantedScale, order), piece.depthHalf / unitHalf));
    atScreen(card.x, card.y, piece.depth);
    mesh.position.x = mix(mesh.position.x, point.x, order);
    mesh.position.y = mix(mesh.position.y, point.y, order);
    mesh.position.z = piece.depth;
    mesh.rotation.set(rx, ry, mix(mesh.rotation.z, card.rotation, order), 'YXZ');
    if (!flat) piece.deform(curl, twist, flutter, initial.phase, corners);
  }
  function falling(piece, p, start, duration, anchor, rotation, scale, curl, idle, strength = 1, deferDeformation = false) {
    piece.start = start; const t = clamp((p - start) / duration); piece.spawnProgress = t; piece.mesh.visible = p > start;
    if (!piece.mesh.visible) return;
    const f = piece.flight(t), settle = smooth(.7, 1, t), air = 1 - settle;
    pose(piece, anchor[0], anchor[1], rotation[0] + f.pitch * air * strength * .22,
      rotation[1] + f.yaw * air * strength * .22, rotation[2] + f.roll * air * strength * .35, scale,
      curl + f.pitch * air * .025, f.roll * .035, air * .22 + .04, t * 13 + piece.phase + idle, deferDeformation && t === 1);
    piece.mesh.position.x += (f.x * .35 + Math.sin(t * Math.PI) * Math.sin(piece.phase) * .15) * scale;
    if (f.y === 0) return;
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
  function draw(scrollProgress, seconds, resolutionProgress) {
    configureRenderer();
    breezeClock = capture || reducedQuery.matches ? 0 : seconds * .72;
    const idle = capture || reducedQuery.matches ? 0 : Math.sin(seconds * .45) * .035;
    const copyScroll = scrollProgress * height, motionHeight = paperMotionPixels(height);
    const p = paperMotionPixels(copyScroll) / motionHeight;
    const timing = paperTiming(motionHeight), dense = smooth(timing.group, timing.grouped, p);
    const workflow = workflowState(resolutionProgress, pieces.length);
    key.shadow.normalBias = mix(.015, .08, workflow.ordered);
    const shadowSize = workflow.ordered > 0 ? (workflowBudget.scale < .8 ? 512 : 1024) : 2048;
    if (key.shadow.mapSize.x !== shadowSize) shadowsInvalid = true;
    key.shadow.mapSize.setScalar(shadowSize);
    // Local pixels keep the editorial entrance consistent across viewports.
    stageElement.style.setProperty('--paper-copy-reveal', (smooth(920, 1420, copyScroll) * (1 - smooth(2000, 2240, copyScroll)) * (1 - smooth(0, .12, resolutionProgress))).toFixed(4));
    workflowElement.style.setProperty('--workflow-reveal', workflow.reveal.toFixed(4));
    pendingCount.textContent = workflow.pending;
    doneCount.textContent = workflow.completed;
    workflowTotal.textContent = `${workflow.completed} / ${pieces.length}`;
    workflowStatus.textContent = workflow.ordered < 1 ? 'Ordenando el trabajo' : workflow.pending ? 'Resolviendo uno a uno' : 'Todo completado';
    workflowFill.style.width = `${workflow.fraction * 100}%`;
    function applyWorkflow(piece) {
      const card = cardWorkflow(workflow, piece.workflowIndex, pieces.length, innerWidth, innerHeight, portrait, piece.width / piece.height);
      if (workflow.ordered > 0) orderedPose(piece, workflow, card);
      piece.setCompleted(card.done); piece.completed = card.done; piece.travel = card.travel;
    }
    if (workflow.ordered === 1) {
      for (const piece of pieces) {piece.mesh.visible = true; piece.spawnProgress = 1; applyWorkflow(piece);}
    } else {
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
        falling(piece, p, start, duration, position, rotation.map((r, i) => mix(r, i === 2 ? Math.sin(piece.phase) * .25 : r * .55, dense)), mix(scale, finalScale, dense), curl, idle, strength, workflow.ordered > 0);
        applyWorkflow(piece);
      }
    }

    camera.updateMatrixWorld();
    const lightState = cursorSurface.update(camera, inputState.pointer, pieces.map(piece => piece.mesh), !inputState.hovering, frameDelta);
    cursorLight.intensity *= .028;
    renderer.info.autoReset = false; renderer.info.reset();
    const shadowsChanged = shadowsInvalid || !lastState || workflow.ordered < 1 || lastState.resolution.ordered < 1 || Math.abs(lastState.resolution.cursor - workflow.cursor) > .00001;
    renderer.shadowMap.needsUpdate = shadowsChanged; renderer.render(scene, camera); shadowsInvalid = false;
    lastState = {progress: scrollProgress, resolution: workflow, visibleItems: pieces.filter(i => i.mesh.visible).length, groupProgress: dense, secondEntryPixels: paperScrollPixels(timing.several * motionHeight), lastEntryPixels: paperScrollPixels((timing.many + timing.manySpread) * motionHeight), lastFallEndPixels: paperScrollPixels((timing.many + timing.manySpread + timing.manyDuration) * motionHeight), groupingPixels: paperScrollPixels(timing.group * motionHeight), scrollRange: height, glass: 0, drawCalls: renderer.info.render.calls, geometries: renderer.info.memory.geometries, reducedMotion: reducedQuery.matches,
      hero: {position: note.mesh.position.toArray(), rotation: note.mesh.rotation.toArray().slice(0,3), bend: note.mesh.geometry.attributes.position.array[2]}, letterCorners: [0,30,992,1022].map(i => letter.deformedGeometry.attributes.position.array[i*3+2]), version: 4, depthOfField: false, parallax: {x: inputState.x, y: inputState.y, gyro: inputState.orientation}, cursorLight: {...lightState, intensity: cursorLight.intensity}, contentCount: new Set(pieces.map(i => i.subject)).size, totalItems: pieces.length, performance: {pixelRatio: renderer.getPixelRatio(), shadowSize: key.shadow.mapSize.x, shadowsUpdated: shadowsChanged,
        flatCards: pieces.filter(piece => piece.mesh.geometry !== piece.deformedGeometry).length, triangles: renderer.info.render.triangles}};
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
        return {subject: piece.subject, visible: piece.mesh.visible, completed: piece.completed, travel: piece.travel, index: piece.workflowIndex, depth: piece.depth, half: piece.depthHalf, min: box.min.toArray(), max: box.max.toArray(), screen};
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
  // Compile and upload before visibility. The tiny viewport also warms shadow
  // programs and vertex buffers without drawing cards into the user's viewport.
  await preparation.yield();
  renderer.initTexture(grain); renderer.initTexture(backgroundTexture);
  phaseStart = performance.now();
  configureRenderer();
  await renderer.compileAsync(scene, camera);
  const compileMs = performance.now() - phaseStart;
  configureRenderer();
  for (const piece of pieces) piece.mesh.visible = true;
  renderer.setViewport(0, 0, 1, 1); renderer.setScissor(0, 0, 1, 1); renderer.setScissorTest(true);
  phaseStart = performance.now();
  renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera);
  // Upload the settled shells too, so switching detail during section four is immediate.
  for (const piece of pieces) {piece.setFlat(true); piece.setWorkflowMaterial(true);}
  await renderer.compileAsync(scene, camera); configureRenderer();
  renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera);
  // Warm the flexible/diffuse combination used by the travelling card as well.
  for (const piece of pieces) piece.setFlat(false);
  renderer.shadowMap.needsUpdate = false; renderer.render(scene, camera);
  const warmRenderMs = performance.now() - phaseStart;
  for (const piece of pieces) {piece.setFlat(false); piece.setWorkflowMaterial(false); piece.mesh.visible = false;}
  renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight);
  const preparationState = {...preparation.getState(), durationMs: performance.now() - preparationStart,
    sharedRenderer: Boolean(graphics), rendererMs, environmentMs, compileMs, warmRenderMs, pendingTextures: pieces.length, completedTextures: pieces.length, shadersReady: true};
  function visibilityChanged() {
    previous = performance.now(); force = true;
    if (document.hidden) {
      active = false; attachCanvas(false); input.setActive(false); inputState = input.update(0, previous); cursorLight.intensity = 0;
    }
  }
  document.addEventListener('visibilitychange', visibilityChanged);
  journey.classList.add('paper-ready'); journey.dataset.paperRender = 'webgl';
  return {
    update(now, y, visible) {
      if (disposed || lost) return;
      // A queued RAF can predate initialization or context recovery.
      const dt = Math.max(0, Math.min((now - previous) / 1000, .05)); previous = now;
      const nextActive = visible && !document.hidden;
      if (nextActive !== active) force = true;
      active = nextActive; attachCanvas(active);
      input.setActive(active);
      inputState = input.update(dt, now);
      if (!active) {cursorLight.intensity = 0; pixelBudget.update(now / 1000, true); workflowBudget.update(now / 1000, true); return;}

      elapsed += dt; frameDelta = dt;
      updateTarget(y);
      camera.position.set(inputState.x * .50, inputState.y * .35, 18);
      camera.lookAt(inputState.x * .09, inputState.y * .055, 0);
      const next = reducedQuery.matches ? target : mix(progress, target, 1 - Math.exp(-dt * 9));
      const nextWorkflow = reducedQuery.matches ? workflowTarget : mix(workflowProgress, workflowTarget, 1 - Math.exp(-dt * 9));
      const moving = Math.abs(next - progress) > .000015 || Math.abs(nextWorkflow - workflowProgress) > .000015;
      progress = Math.abs(next - target) < .00001 ? target : next;
      workflowProgress = Math.abs(nextWorkflow - workflowTarget) < .00001 ? workflowTarget : nextWorkflow;
      const cameraMoving = lastState && (Math.abs(lastState.parallax.x - inputState.x) > .0005 || Math.abs(lastState.parallax.y - inputState.y) > .0005);
      if (force || moving || cameraMoving || (!reducedQuery.matches && !capture && progress > .015 && workflowProgress < .30)) {
        if (!capture) (workflowProgress > 0 ? workflowBudget : pixelBudget).update(now / 1000, reducedQuery.matches);
        const before = performance.now(); draw(progress, elapsed, workflowProgress); force = false;
        frames++; totalFrameTime += performance.now() - before;
        lastState.averageCpuMs = totalFrameTime / frames;
      } else {pixelBudget.update(now / 1000, true); workflowBudget.update(now / 1000, true);}
    },
    resize,
    getState: () => ({...lastState, active, prepared: true, preparation: preparationState, targetProgress: target, resolutionTarget: workflowTarget, firstSubject: note.subject, firstKind: note.kind, firstEntryPixels: 80}),
    getReview: () => review,
    dispose() {
      if (disposed) return; disposed = true; attachCanvas(false); input.dispose();
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      const textures = new Set();
      for (const piece of pieces) {piece.geometries().forEach(geometry => geometry.dispose()); piece.textures().forEach(texture => textures.add(texture)); piece.materials().forEach(material => material.dispose());}
      for (const texture of textures) texture.dispose();
      grain.dispose(); backgroundTexture.dispose(); background.geometry.dispose(); backgroundMaterial.dispose(); key.shadow.dispose();
      if (!graphics) {environment.dispose(); renderer.dispose();}
    },
  };
}
