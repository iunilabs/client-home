import * as THREE from 'three';
import { mesh,box,materials,rod } from './objects.js';
import { finishMaterial } from './surfaces.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export function createEnvironment(scene) {
  scene.background=new THREE.Color('#e8eee5');scene.fog=new THREE.FogExp2('#e8eee5',.012);
  const hemi=new THREE.HemisphereLight('#edf4ff','#7d897a',.45);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff0d9',2.4);sun.position.set(-5,9,5);sun.castShadow=true;
  const shadowSize=innerWidth<700?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-7;sun.shadow.camera.near=.1;sun.shadow.camera.far=45;sun.shadow.bias=-.00012;sun.shadow.normalBias=.012;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight('#c0e4f0',.5);fill.position.set(6,3,8);scene.add(fill);
  const rim=new THREE.DirectionalLight('#d6edff',1.65);rim.position.set(4,6,-7);scene.add(rim);
  const waterMaterial=new THREE.MeshPhysicalMaterial({color:'#477e82',roughness:.16,metalness:.45,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.9});
  const waterUniforms={time:{value:0}};
  waterMaterial.onBeforeCompile=shader=>{
    shader.uniforms.time=waterUniforms.time;
    shader.vertexShader='uniform float time;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float a=position.x*.48+time*.34;
      float b=position.y*.82-time*.19;
      transformed.z+=sin(a)*.07+sin(b)*.04;
    `);
    shader.fragmentShader='uniform float time;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float ripples=sin(vViewPosition.x*6.0+time*.6)*sin(vViewPosition.z*7.0-time*.5);
      diffuseColor.rgb*=.92+(.08*ripples);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec3 waveNormal=vec3(cos(vViewPosition.x*3.0+time*.34)*.055,0.0,sin(vViewPosition.z*3.6-time*.19)*.04);
      normal=normalize(normal+waveNormal);
    `);
  };
  const ocean=mesh(new THREE.PlaneGeometry(160,160,80,80),waterMaterial,0,-3.25,-30);ocean.rotation.x=-Math.PI/2;scene.add(ocean);
  const platform=box(19,.55,9,materials.cream,.17);platform.position.set(2,-2.6,-.5);scene.add(platform);
  const ledge=box(6,.24,2.7,materials.ivory,.07);ledge.position.set(3.3,-1.92,.8);scene.add(ledge);
  const cliffMaterial=finishMaterial(new THREE.MeshStandardMaterial({color:'#b5b09b',roughness:.93}), 'limestone');
  const rockGeometry=new THREE.IcosahedronGeometry(1,3),rockPositions=rockGeometry.attributes.position;
  for(let i=0;i<rockPositions.count;i++){const x=rockPositions.getX(i),y=rockPositions.getY(i),z=rockPositions.getZ(i);const n=1+.15*Math.sin(x*6+y*3-z*2)+.045*Math.sin(z*17+x*13);rockPositions.setXYZ(i,x*n,y*n,z*n)}rockGeometry.computeVertexNormals();
  rockGeometry.deleteAttribute('normal');rockGeometry.deleteAttribute('uv');const smoothRock=mergeVertices(rockGeometry,1e-5);rockGeometry.dispose();smoothRock.computeVertexNormals();
  const rocks=new THREE.InstancedMesh(smoothRock,cliffMaterial,24),dummy=new THREE.Object3D();
  for(let i=0;i<24;i++){const a=i*.618*Math.PI*2,s=.8+(i%4)*.3;dummy.position.set(Math.cos(a)*(7+i%3),-3.2,Math.sin(a)*4-1);dummy.scale.set(1.4*s,.7*s,1.4*s);dummy.rotation.set(i*.3,i*.7,.2);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
  const classical=new THREE.Group();
  for(const x of [-11,-7,7,11]) {
    const group=new THREE.Group();group.position.set(x,-2.7,-12);
    const column=mesh(new THREE.CylinderGeometry(.34,.42,5,32,1),materials.cream,0,2.8,0);group.add(column);
    const flutes=new THREE.InstancedMesh(new THREE.CylinderGeometry(.018,.018,4.65,8),materials.ivory,16);
    for(let j=0;j<16;j++){let a=j/16*Math.PI*2;dummy.position.set(Math.cos(a)*.34,2.72,Math.sin(a)*.34);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();flutes.setMatrixAt(j,dummy.matrix)}group.add(flutes);
    for(const y of [.2,.38,5.3,5.5]){const cap=box(1,.2,1,materials.ivory,.015);cap.position.y=y;group.add(cap)}
    classical.add(group);
  }
  const arch=mesh(new THREE.TorusGeometry(2,.28,12,60,Math.PI),materials.cream,9,2.82,-12);classical.add(arch);
  const arch2=arch.clone();arch2.position.x=-9;classical.add(arch2);scene.add(classical);
  const modern=new THREE.Group();
  const glass=new THREE.MeshPhysicalMaterial({color:'#c6e0d6',transparent:true,opacity:.14,roughness:.08,metalness:.1,side:THREE.DoubleSide,depthWrite:false});
  for(const x of [-9,6,11]){const pane=mesh(new THREE.PlaneGeometry(4.1,6),glass,x,.5,-9);modern.add(pane);modern.add(rod([x-2,-2.5,-9],[x-2,3.5,-9],.027,materials.metal));modern.add(rod([x+2,-2.5,-9],[x+2,3.5,-9],.027,materials.metal))}scene.add(modern);
  const grassMaterial=new THREE.MeshStandardMaterial({color:'#6d8b69',roughness:1,side:THREE.DoubleSide});
  const grasses=new THREE.InstancedMesh(new THREE.ConeGeometry(.045,1,3),grassMaterial,55);scene.add(grasses);
  const moon=mesh(new THREE.SphereGeometry(.6,32,24),new THREE.MeshStandardMaterial({color:'#faf8e8',roughness:1}),6.2,4.1,-16);scene.add(moon);
  return { ledge, platform, classical, modern, waterUniforms, grasses, moon, update(p,time,reduced) {
    waterUniforms.time.value=reduced?0:time;
    modern.visible=p>3.7;classical.visible=p>1.85&&p<4.1;
    moon.visible=p>3.2&&p<4;
    ledge.visible=p<8||p>11.6;
    for(let i=0;i<55;i++){dummy.position.set(7.2+(i%9)*.18,-2.25,-2.5+Math.floor(i/9)*.2);dummy.scale.set(1,.7+(i%3)*.2,1);dummy.rotation.set(0,0,Math.sin(i*7)*.28+(reduced?0:Math.sin(time*.7+i)*.045));dummy.updateMatrix();grasses.setMatrixAt(i,dummy.matrix)}grasses.instanceMatrix.needsUpdate=true;
  } };
}
