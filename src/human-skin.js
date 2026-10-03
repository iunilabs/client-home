import * as THREE from 'three';
import {generateEpidermisPixels} from './epidermis-pixels.js';

let poreTexture;
function epidermisTexture(){
  if(poreTexture)return poreTexture;
  const size=1024,pixels=generateEpidermisPixels();
  poreTexture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
  poreTexture.wrapS=poreTexture.wrapT=THREE.RepeatWrapping;
  poreTexture.magFilter=THREE.LinearFilter;poreTexture.minFilter=THREE.LinearMipmapLinearFilter;poreTexture.generateMipmaps=true;poreTexture.needsUpdate=true;
  return poreTexture;
}

const detailGLSL=/* glsl */`
uniform sampler2D epidermisMap;
uniform sampler2D forearmMap;
uniform vec2 skinPhotoStep;
uniform float poreStrength;
uniform float forearmBlendEnabled;
uniform float skinReliefScale;
uniform float skinWorldScale;
uniform float skinCreaseGuidance;
uniform float skinNaturalStrength;
uniform vec3 skinNaturalTone;
varying vec3 vSkinPosition;
varying vec3 vSkinNormal;
varying float vNailMask;
varying float vSkinThinness;
varying float vSkinCreaseArea;
vec4 skinAlbedo(vec2 uv){
  vec4 colour=texture2D(map,uv);
  if(dot(colour.rgb,vec3(.2126,.7152,.0722))<.035){
    vec4 best=colour;
    for(int i=0;i<4;i++){
      vec2 direction=i==0?vec2(1.0,0.0):i==1?vec2(-1.0,0.0):i==2?vec2(0.0,1.0):vec2(0.0,-1.0);
      vec4 nearby=texture2D(map,uv+direction*skinPhotoStep*6.0);
      if(dot(nearby.rgb,vec3(.2126,.7152,.0722))>dot(best.rgb,vec3(.2126,.7152,.0722)))best=nearby;
    }
    colour=mix(colour,best,.8);
  }
  return colour;
}
vec4 guidedSkinAlbedo(vec2 uv){
  vec4 colour=skinAlbedo(uv);float fold=mix(1.0,vSkinCreaseArea,skinCreaseGuidance);
  if(fold<.8){
    // Reduce coarse printed corrugations between joints. Real fine pores use
    // the separate rest-space epidermal height field and remain unaffected.
    vec4 local=vec4(0.0);
    for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
      float weight=(x==0?2.0:1.0)*(y==0?2.0:1.0);
      local+=skinAlbedo(uv+skinPhotoStep*vec2(float(x),float(y))*13.0)*weight/16.0;
    }
    colour=mix(local,colour,.02+.98*fold*fold);
  }
  return colour;
}
float skinDetail(vec3 p,vec3 n){
  vec3 weights=pow(abs(n),vec3(6.0));weights/=max(weights.x+weights.y+weights.z,.0001);
  vec3 q=p*62.5;
  return texture2D(epidermisMap,q.yz).r*weights.x+texture2D(epidermisMap,q.xz).r*weights.y+texture2D(epidermisMap,q.xy).r*weights.z;
}
float photographedCrease(vec2 uv){
  vec2 stepUV=skinPhotoStep;
  vec3 luminance=vec3(.2126,.7152,.0722);
  float centre=dot(skinAlbedo(uv).rgb,luminance);
  float horizontal=(dot(skinAlbedo(uv-stepUV*vec2(2.0,0.0)).rgb,luminance)+dot(skinAlbedo(uv+stepUV*vec2(2.0,0.0)).rgb,luminance))*.5;
  float vertical=(dot(skinAlbedo(uv-stepUV*vec2(0.0,2.0)).rgb,luminance)+dot(skinAlbedo(uv+stepUV*vec2(0.0,2.0)).rgb,luminance))*.5;
  // A narrow crease is dark across one direction and continuous along the
  // other. Broad pigmentation stays in the photographed base colour.
  return -max(max(horizontal,vertical)-centre-.008,0.0);
}
vec3 armAlbedo(vec3 p,vec3 n){
  vec3 weights=pow(abs(n),vec3(6.0));weights/=max(weights.x+weights.y+weights.z,.0001);
  vec3 q=p*12.5;
  return texture2D(forearmMap,q.yz).rgb*weights.x+texture2D(forearmMap,q.xz).rgb*weights.y+texture2D(forearmMap,q.xy).rgb*weights.z;
}
float armCrease(vec3 p,vec3 n){
  vec2 uv=(abs(n.z)>abs(n.y)?p.xy:p.xz)*12.5;
  vec2 offset=vec2(2.0/1254.0,0.0);vec3 l=vec3(.2126,.7152,.0722);
  float centre=dot(texture2D(forearmMap,uv).rgb,l);
  float across=(dot(texture2D(forearmMap,uv-offset).rgb,l)+dot(texture2D(forearmMap,uv+offset).rgb,l))*.5;
  return -max(across-centre-.008,0.0);
}
vec3 dermalNormal(vec3 n,float h){
  vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
  vec3 r1=cross(dy,n),r2=cross(n,dx);float det=dot(dx,r1);
  return normalize(abs(det)*n-sign(det)*(dFdx(h)*r1+dFdy(h)*r2));
}
`;

export function createHumanSkin(map,{worldScale=18,forearmMap=map,blendForearm=true,reliefScale=1,guidedCreases=false,epidermisMap,natural=false}={}){
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  forearmMap.colorSpace=THREE.SRGBColorSpace;forearmMap.wrapS=forearmMap.wrapT=THREE.RepeatWrapping;forearmMap.anisotropy=8;
  const material=new THREE.MeshPhysicalMaterial({map,color:'#ffffff',roughness:.48,metalness:0,ior:1.4,specularIntensity:.65,clearcoat:0,sheen:0,envMapIntensity:.65});
  const uniforms={epidermisMap:{value:epidermisMap??epidermisTexture()},forearmMap:{value:forearmMap},skinPhotoStep:{value:new THREE.Vector2(1/map.image.width,1/map.image.height)},poreStrength:{value:1},forearmBlendEnabled:{value:blendForearm?1:0},skinReliefScale:{value:reliefScale},skinWorldScale:{value:worldScale},skinCreaseGuidance:{value:guidedCreases?1:0}};
  uniforms.skinNaturalStrength={value:natural?1:0};
  uniforms.skinNaturalTone={value:new THREE.Color('#d4aa93')};
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=`attribute float nailMask;\nattribute float skinThinness;\nattribute float skinCreaseArea;\nvarying vec3 vSkinPosition;\nvarying vec3 vSkinNormal;\nvarying float vNailMask;\nvarying float vSkinThinness;\nvarying float vSkinCreaseArea;\n`+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vSkinPosition=position;vSkinNormal=normal;vNailMask=nailMask;vSkinThinness=skinThinness;vSkinCreaseArea=skinCreaseArea;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_pars_fragment>','#include <map_pars_fragment>\n'+detailGLSL);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`diffuseColor*=guidedSkinAlbedo(vMapUv);
      float armBlend=(1.0-smoothstep(-.065,-.023,vSkinPosition.x))*forearmBlendEnabled;
      diffuseColor.rgb=mix(diffuseColor.rgb,armAlbedo(vSkinPosition,normalize(vSkinNormal)),armBlend);
      // Keep subtle photographed detail, with a consistent, softly warm tone
      // instead of magnifying the source atlas's stains across the forearm.
      float toneBlend=mix(.55,.88,armBlend)*skinNaturalStrength;
      diffuseColor.rgb=mix(diffuseColor.rgb,skinNaturalTone,toneBlend);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      float epidermis=skinDetail(vSkinPosition,normalize(vSkinNormal));
      roughnessFactor=mix(clamp(.48+(epidermis-.5)*.3,.36,.60),.3,vNailMask);
      roughnessFactor=mix(roughnessFactor,.48,skinNaturalStrength*.65*(1.0-vNailMask));
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float fold=mix(1.0,vSkinCreaseArea,skinCreaseGuidance);
      float crease=mix(photographedCrease(vMapUv)*mix(.04,1.0,fold*fold),armCrease(vSkinPosition,normalize(vSkinNormal)),armBlend)*.0005;
      float relief=((epidermis-.5)*.00012+crease)*skinWorldScale*poreStrength*skinReliefScale*(1.0-vNailMask);
      normal=dermalNormal(normal,relief);
    `);
    // A restrained warm wrap term on thin tissue. This is an approximation
    // for realtime WebGL, not a claim of path-traced subsurface transport.
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      float edge=pow(1.0-max(dot(normal,geometryViewDir),0.0),3.0);
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.075,.022,.01)*edge*vSkinThinness;
    `);
  };
  material.customProgramCacheKey=()=> 'puntoes-photographic-skin-7';
  material.userData={finish:'photographic-skin',uniforms,textureOrigin:'LibHand UV atlas, detailed with imagegen; forearm generated from the user reference'};
  return material;
}
