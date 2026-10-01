import * as THREE from 'three';

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
      return {x: xa + (xb - xa) * (y - ya) / (yb - ya), slope: (xb - xa) / (yb - ya)};
    }
  }
  return {x: points.at(-1)[1], slope: 0};
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
  for (let y = 0; y < height; y++) {
    const coastLine = coastAt(y / height, outline);
    const edge = coastLine.x * width;
    const slope = coastLine.slope * width / height;
    for (let x = 0; x < width; x++) {
      const i = y * width + x, n = i * 4;
      const [r, g, b] = pixels.data.subarray(n, n + 3);
      // The coast boundary excludes all buildings. Colour further excludes
      // sand, rocks and boats, while admitting the blue and turquoise water.
      const sea = x >= edge && b - r > 12 && g - r > 5 && b > 70;
      // Shore distance follows the coast, rather than treating white boats
      // as islands and creating artificial rings around them.
      const distance = Math.max(0, (x - edge) / Math.hypot(1, slope));
      pixels.data[n] = sea ? Math.min(255, distance * 128) : 0;
      pixels.data[n + 1] = Math.min(255, distance / 18 * 255);
      pixels.data[n + 2] = 0;
      pixels.data[n + 3] = 255;
    }
  }
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
    uniforms: {uPhoto: {value: photo}, uMask: {value: mask}, uTime: {value: 0}},
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D uPhoto;
      uniform sampler2D uMask;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 guide = texture2D(uMask, vUv).rg;
        float alpha = smoothstep(0.1, 0.9, guide.r);
        if (alpha < 0.01) discard;
        vec2 flow = vec2(
          sin(vUv.y * 112.0 + uTime * 0.72) + sin(vUv.x * 73.0 - uTime * 0.48),
          cos(vUv.x * 96.0 + vUv.y * 42.0 + uTime * 0.62)
        ) * 0.0015 * alpha;
        vec3 colour = texture2D(uPhoto, vUv + flow).rgb;
        float phase = guide.g * 29.0 + uTime * 1.35 + sin(vUv.x * 48.0 + vUv.y * 37.0) * 0.55;
        float crest = pow(0.5 + 0.5 * cos(phase), 16.0);
        float shore = (1.0 - smoothstep(0.08, 0.72, guide.g)) * alpha;
        colour = mix(colour, vec3(0.82, 0.96, 1.0), crest * shore * 0.08);
        float glint = pow(0.5 + 0.5 * sin(vUv.x * 241.0 + vUv.y * 193.0 + uTime * 0.95), 22.0);
        colour += glint * 0.007 * (1.0 - shore);
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
