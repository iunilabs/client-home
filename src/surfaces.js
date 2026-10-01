import * as THREE from 'three';

const noise = /* glsl */`
float surfaceHash(vec3 p) {
  p = fract(p * .3183099 + vec3(.11, .37, .73));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float surfaceNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(surfaceHash(i), surfaceHash(i + vec3(1,0,0)), f.x),
                 mix(surfaceHash(i + vec3(0,1,0)), surfaceHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(surfaceHash(i + vec3(0,0,1)), surfaceHash(i + vec3(1,0,1)), f.x),
                 mix(surfaceHash(i + vec3(0,1,1)), surfaceHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float surfaceFbm(vec3 p) {
  return surfaceNoise(p) * .57 + surfaceNoise(p * 2.03) * .28 + surfaceNoise(p * 4.07) * .15;
}
vec3 surfaceNormal(vec3 n, float height) {
  vec3 dx = dFdx(-vViewPosition), dy = dFdy(-vViewPosition);
  vec3 r1 = cross(dy, n), r2 = cross(n, dx);
  float det = dot(dx, r1);
  vec3 gradient = sign(det) * (dFdx(height) * r1 + dFdy(height) * r2);
  return normalize(abs(det) * n - gradient);
}
`;

const finishes = {
  skin: {
    color: `
      float mottling = surfaceFbm(vSurfacePosition * 85.0);
      float freckles = smoothstep(.76, .86, surfaceNoise(vSurfacePosition * 1700.0));
      diffuseColor.rgb *= .89 + .21 * mottling;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.78,.57,.46), freckles * .17);
      diffuseColor.rgb += vec3(.034,.005,.002) * surfaceNoise(vSurfacePosition * 230.0);
    `,
    height: `
      float microFilter = 1.0 - smoothstep(.5, 1.8, max(length(dFdx(vSurfacePosition * 8200.0)), length(dFdy(vSurfacePosition * 8200.0))));
      float surfaceHeight = 0.0;
      if(microFilter > .001){
        float pores = surfaceNoise(vSurfacePosition * 8200.0);
        float fineLines = pow(.5 + .5 * sin(vSurfacePosition.y * 4400.0 + surfaceNoise(vSurfacePosition * 1800.0) * 6.0), 12.0);
        surfaceHeight = (pores * .000045 - fineLines * .000018) * microFilter;
      }
    `,
    roughness: `roughnessFactor = clamp(roughnessFactor + (surfaceNoise(vSurfacePosition * 2200.0) - .5) * .15, .3, .72);`,
    light: `
      float softRim = pow(1.0 - max(dot(normal, geometryViewDir), 0.0), 3.0);
      reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(.16,.045,.022) * softRim;
    `,
  },
  porcelain: {
    color: `diffuseColor.rgb *= .97 + .04 * surfaceFbm(vSurfacePosition * 480.0);`,
    height: `float microFilter = 1.0 - smoothstep(.5, 1.8, max(length(dFdx(vSurfacePosition * 12000.0)), length(dFdy(vSurfacePosition * 12000.0))));
      float surfaceHeight = 0.0;
      if(microFilter > .001) surfaceHeight = surfaceNoise(vSurfacePosition * 12000.0) * .000007 * microFilter;`,
    roughness: `roughnessFactor += (surfaceNoise(vSurfacePosition * 3500.0) - .5) * .04;`,
  },
  stone: {
    color: `
      float grain = surfaceFbm(vSurfacePosition * 7.0);
      float strata = surfaceNoise(vec3(vSurfacePosition.x * 3.0, vSurfacePosition.y * 27.0, vSurfacePosition.z * 3.0));
      diffuseColor.rgb *= .67 + .57 * grain;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.82,.86,.92), smoothstep(.54,.65,strata) * .35);
    `,
    height: `float surfaceHeight = surfaceFbm(vSurfacePosition * 65.0) * .004 + surfaceNoise(vSurfacePosition * 340.0) * .0012;`,
    roughness: `roughnessFactor = .78 + surfaceNoise(vSurfacePosition * 29.0) * .18;`,
  },
  limestone: {
    color: `diffuseColor.rgb *= .88 + .17 * surfaceFbm(vSurfacePosition * 9.0);`,
    height: `float surfaceHeight = surfaceNoise(vSurfacePosition * 90.0) * .002;`,
    roughness: `roughnessFactor += (surfaceNoise(vSurfacePosition * 50.0) - .5) * .1;`,
  },
  brushed: {
    color: `diffuseColor.rgb *= .93 + .1 * surfaceNoise(vSurfacePosition * 35.0);`,
    height: `float microFilter = 1.0 - smoothstep(.5, 1.8, max(length(dFdx(vSurfacePosition * 950.0)), length(dFdy(vSurfacePosition * 950.0))));
      float surfaceHeight = 0.0;
      if(microFilter > .001) surfaceHeight = surfaceNoise(vSurfacePosition * vec3(950.0, 6.0, 950.0)) * .00008 * microFilter;`,
    roughness: `roughnessFactor += (surfaceNoise(vSurfacePosition * vec3(650.0, 3.0, 650.0)) - .5) * .12;`,
  },
  plastic: {
    color: '',
    height: `float surfaceHeight = surfaceNoise(vSurfacePosition * 1200.0) * .0001;`,
    roughness: `roughnessFactor += (surfaceNoise(vSurfacePosition * 650.0) - .5) * .05;`,
  },
};

// Detail stays in bind/object space, including while the hand deforms. There
// are no UV seams, image downloads or random changes between frames.
export function finishMaterial(material, finish) {
  const recipe = finishes[finish];
  material.onBeforeCompile = shader => {
    shader.vertexShader = `varying vec3 vSurfacePosition;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfacePosition = position;');
    shader.fragmentShader = `varying vec3 vSurfacePosition;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + noise);
    if(material.userData.creases){
      shader.vertexShader='attribute float skinCrease;\nvarying float vSkinCrease;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('vSurfacePosition = position;','vSurfacePosition = position;\nvSkinCrease = skinCrease;');
      shader.fragmentShader='varying float vSkinCrease;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float creaseMask = vSkinCrease;
        diffuseColor.rgb *= 1.0 - creaseMask * ${finish==='skin'?'.075':'.015'};
      `);
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + recipe.color);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + recipe.roughness);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + recipe.height + (material.userData.creases?'\nsurfaceHeight -= creaseMask * .00012;':'') + '\nnormal = surfaceNormal(normal, surfaceHeight);');
    if (recipe.light) shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + recipe.light);
  };
  material.customProgramCacheKey = () => `puntoes-surface-${finish}-1`;
  material.userData.finish = finish;
  return material;
}

export function handMaterial(artificial) {
  return finishMaterial(new THREE.MeshPhysicalMaterial(artificial ? {
    color: '#e9e9e4', roughness: .2, metalness: 0, clearcoat: .72,
    clearcoatRoughness: .14, ior: 1.48, envMapIntensity: .85,
  } : {
    color: '#a97156', roughness: .5, metalness: 0, clearcoat: .045,
    clearcoatRoughness: .52, ior: 1.4, sheen: .08, sheenColor: '#cf937e',
    sheenRoughness: .78, envMapIntensity: .65,
  }), artificial ? 'porcelain' : 'skin');
}
