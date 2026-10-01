import * as THREE from 'three';
import {cityOceanGuide} from './city-shore.js';

// Ocean animation is an independent layer. Buildings and the underlying artwork
// remain stationary; only sea pixels inside the coast boundary are displaced.
const coast = {
  desktop: [[0,.685],[.1,.77],[.2,.845],[.3,.875],[.48,.892],[.65,.947],[.75,.956],[.79,.84],[.82,.71],[.87,.607],[.94,.585],[1,.558]],
  portrait: [[0,.59],[.05,.72],[.1,.82],[.15,.93],[.2,1.02],[.7,1.02],[.76,.88],[.8,.72],[.84,.57],[.88,.42],[.92,.33],[.96,.37],[1,.34]]
};

function coastAt(y, points) {
  for (let i = 1; i < points.length; i++) {
    if (y <= points[i][0]) {
      const [ya, xa] = points[i - 1], [yb, xb] = points[i];
      const slope = index => {
        const before = Math.max(0, index - 1), after = Math.min(points.length - 1, index + 1);
        const left = (points[index][1] - points[before][1]) / (points[index][0] - points[before][0]);
        const right = (points[after][1] - points[index][1]) / (points[after][0] - points[index][0]);
        if (!index) return right;
        if (index === points.length - 1) return left;
        return left * right <= 0 ? 0 : 2 / (1 / left + 1 / right);
      };
      const t = Math.max(0, (y - ya) / (yb - ya)), span = yb - ya;
      const a = slope(i - 1) * span, b = slope(i) * span;
      return {x: (2*t**3 - 3*t*t + 1)*xa + (t**3 - 2*t*t + t)*a +
        (-2*t**3 + 3*t*t)*xb + (t**3 - t*t)*b};
    }
  }
  return {x: points.at(-1)[1]};
}

function oceanMask(image) {
  const portrait = image.naturalHeight > image.naturalWidth;
  const width = 512, height = Math.round(width * image.naturalHeight / image.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  const outline = coast[portrait ? 'portrait' : 'desktop'];
  const shoreX = Array.from({length: height}, (_, y) => coastAt(y / height, outline).x * width);
  pixels.data.set(cityOceanGuide(pixels, shoreX));
  context.putImageData(pixels, 0, 0);
  return canvas;
}

export function createCityWater(world, image) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: false, powerPreference: 'low-power'});
  } catch { return null; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'city-water';
  canvas.setAttribute('aria-hidden', 'true');
  world.insertBefore(canvas, world.querySelector('.city-light'));
  const photo = new THREE.Texture(image);
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.minFilter = THREE.LinearFilter;
  photo.magFilter = THREE.LinearFilter;
  photo.generateMipmaps = false;
  photo.needsUpdate = true;
  const mask = new THREE.CanvasTexture(oceanMask(image));
  mask.minFilter = THREE.LinearFilter;
  mask.magFilter = THREE.LinearFilter;
  mask.generateMipmaps = false;
  const material = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {uPhoto: {value: photo}, uMask: {value: mask}, uTime: {value: 0},
      uMaskStep: {value: new THREE.Vector2(1 / mask.image.width, 1 / mask.image.height)}},
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D uPhoto;
      uniform sampler2D uMask;
      uniform float uTime;
      uniform vec2 uMaskStep;
      varying vec2 vUv;
      void main() {
        vec3 guide = texture2D(uMask, vUv).rgb;
        float alpha = smoothstep(0.1, 0.9, guide.r);
        if (alpha < 0.01) discard;
        vec2 shoreNormal = normalize(vec2(
          texture2D(uMask, vUv + vec2(uMaskStep.x, 0.0)).g - guide.g,
          texture2D(uMask, vUv + vec2(0.0, uMaskStep.y)).g - guide.g
        ) + vec2(0.00001, 0.0));
        float phase = guide.g * 23.0 + uTime * 1.6 + sin(vUv.x * 48.0 + vUv.y * 37.0) * 0.8;
        // Breaking waves belong to sand beaches, not rocks or promenades.
        float shore = (1.0 - smoothstep(0.08, 0.9, guide.g)) * alpha * guide.b;
        float waterLife = mix(smoothstep(0.55, 1.0, guide.g), 1.0, guide.b);
        vec2 flow = vec2(
          sin(vUv.y * 112.0 + uTime * 0.72) + sin(vUv.x * 73.0 - uTime * 0.48),
          cos(vUv.x * 96.0 + vUv.y * 42.0 + uTime * 0.62)
        ) * 0.0028 * alpha + shoreNormal * sin(phase) * shore * 0.0035;
        flow *= waterLife;
        // Do not pull a boat or a patch of land into the animated water.
        flow *= smoothstep(0.7, 1.0, texture2D(uMask, vUv + flow).r);
        vec3 colour = texture2D(uPhoto, vUv + flow).rgb;
        // Advancing crests follow the shore guide. A broken second wave keeps
        // the visible surf irregular instead of making uniform glowing lines.
        float crest = pow(0.5 + 0.5 * cos(phase), 8.0);
        float broken = 0.65 + 0.35 * sin(vUv.x * 147.0 + vUv.y * 111.0 - uTime * 0.45);
        float foam = crest * shore * broken;
        colour *= 1.0 + (crest - 0.2) * shore * 0.045;
        colour = mix(colour, vec3(0.90, 0.97, 1.0), foam * 0.43);
        float glint = pow(0.5 + 0.5 * sin(vUv.x * 241.0 + vUv.y * 193.0 + uTime * 1.15), 22.0);
        colour += glint * 0.022 * (1.0 - shore) * waterLife;
        gl_FragColor = vec4(colour, alpha);
        #include <colorspace_fragment>
      }
    `
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();
  let width = 0, height = 0, lastRender = -Infinity, frames = 0;
  let lost = false;
  canvas.addEventListener('webglcontextlost', () => {lost = true});
  canvas.addEventListener('webglcontextrestored', () => {lost = false; photo.needsUpdate = true; mask.needsUpdate = true});
  function resize() {
    const nextWidth = Math.min(1600, Math.round(parseFloat(world.style.width)));
    const nextHeight = Math.round(nextWidth * image.naturalHeight / image.naturalWidth);
    if (nextWidth !== width || nextHeight !== height) {
      width = nextWidth; height = nextHeight;
      renderer.setSize(width, height, false);
    }
  }
  function update(now, active, reduced) {
    canvas.hidden = reduced;
    if (lost || !active || reduced || document.hidden || now - lastRender < 1000 / 24) return;
    resize();
    material.uniforms.uTime.value = now / 1000;
    renderer.render(scene, camera);
    lastRender = now;
    canvas.dataset.frames = String(++frames);
  }
  function dispose() {
    photo.dispose(); mask.dispose(); geometry.dispose(); material.dispose();
    renderer.dispose(); canvas.remove();
  }
  resize();
  return {update, resize, dispose};
}
