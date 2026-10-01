import * as THREE from 'three';

let poreTexture;
function epidermisTexture(){
  if(poreTexture)return poreTexture;
  const size=1024,cells=24,height=new Float32Array(size*size),pixels=new Uint8Array(size*size*4);
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7+19.31)*43758.5453;return n-Math.floor(n)};
  // A physical 16 mm tile: irregular pores, their raised rims, and shallow
  // intersecting epidermal furrows. The photographic colour remains separate.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*cells,v=y/size*cells,cx=Math.floor(u),cy=Math.floor(v);
    let value=.56,nearest=Infinity,second=Infinity,cellTone=0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const px=cx+i,py=cy+j,wx=(px+cells)%cells,wy=(py+cells)%cells;
      const dx=u-(px+.18+hash(wx,wy)*.64),dy=v-(py+.18+hash(wx+71,wy+31)*.64);
      const distance=dx*dx+dy*dy;
      if(distance<nearest){second=nearest;nearest=distance;cellTone=hash(wx+211,wy+91)}else if(distance<second)second=distance;
      const radius=.09+hash(wx+17,wy+81)*.055,r=Math.hypot(dx,dy*.83)/radius;
      value-=Math.exp(-r*r*1.8)*(.16+hash(wx+29,wy)*.17);
      value+=Math.exp(-((r-1.4)**2)*5)*.022;
    }
    // Irregular polygonal plateaus, separated by shallow epidermal grooves.
    // Periodic signals keep the physical tile continuous at its edges.
    value-=Math.exp(-Math.max(0,Math.sqrt(second)-Math.sqrt(nearest))*12)*.1;
    value+=(cellTone-.5)*.07;
    const phase=Math.PI*2/cells,waviness=Math.sin(v*phase*8+Math.sin(u*phase*4)*1.1);
    const furrows=Math.pow(.5+.5*Math.sin(u*phase*50+waviness),24)+Math.pow(.5+.5*Math.sin(v*phase*57+Math.sin(u*phase*6)),28);
    value-=furrows*.018;
    height[y*size+x]=value;
  }
  for(let i=0;i<height.length;i++){
    pixels[i*4]=Math.round(THREE.MathUtils.clamp(height[i],0,1)*255);
    pixels[i*4+1]=Math.round((.45+(height[i]-.5)*.35)*255);
    pixels[i*4+2]=0;pixels[i*4+3]=255;
  }
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

export function createHumanSkin(map,{worldScale=18,forearmMap=map,blendForearm=true,reliefScale=1,guidedCreases=false}={}){
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  forearmMap.colorSpace=THREE.SRGBColorSpace;forearmMap.wrapS=forearmMap.wrapT=THREE.RepeatWrapping;forearmMap.anisotropy=8;
  const material=new THREE.MeshPhysicalMaterial({map,color:'#ffffff',roughness:.48,metalness:0,ior:1.4,specularIntensity:.65,clearcoat:0,sheen:0,envMapIntensity:.65});
  const uniforms={epidermisMap:{value:epidermisTexture()},forearmMap:{value:forearmMap},skinPhotoStep:{value:new THREE.Vector2(1/map.image.width,1/map.image.height)},poreStrength:{value:1},forearmBlendEnabled:{value:blendForearm?1:0},skinReliefScale:{value:reliefScale},skinWorldScale:{value:worldScale},skinCreaseGuidance:{value:guidedCreases?1:0}};
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
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      float epidermis=skinDetail(vSkinPosition,normalize(vSkinNormal));
      roughnessFactor=mix(clamp(.48+(epidermis-.5)*.3,.36,.60),.3,vNailMask);
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
  material.customProgramCacheKey=()=> 'puntoes-photographic-skin-6';
  material.userData={finish:'photographic-skin',uniforms,textureOrigin:'LibHand UV atlas, detailed with imagegen; forearm generated from the user reference'};
  return material;
}
