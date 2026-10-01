import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { finishMaterial } from './surfaces.js';

export const materials = {
  stone: finishMaterial(new THREE.MeshStandardMaterial({ color:'#696e65', roughness:.93 }), 'stone'),
  cream: finishMaterial(new THREE.MeshStandardMaterial({ color:'#ded9c8', roughness:.79 }), 'limestone'),
  ivory: new THREE.MeshPhysicalMaterial({ color:'#ece9de', roughness:.31, clearcoat:.28 }),
  metal: finishMaterial(new THREE.MeshStandardMaterial({ color:'#a6b2b7', metalness:1, roughness:.25 }), 'brushed'),
  bronze: finishMaterial(new THREE.MeshStandardMaterial({ color:'#ae8b53', metalness:.92, roughness:.32 }), 'brushed'),
  blue: new THREE.MeshPhysicalMaterial({ color:'#009DDB', roughness:.12, metalness:.32, clearcoat:1, clearcoatRoughness:.08, ior:1.5 }),
  ink: new THREE.MeshStandardMaterial({ color:'#416660', roughness:.7 }),
  rubber: finishMaterial(new THREE.MeshStandardMaterial({color:'#242e30',roughness:.84}), 'plastic'),
  polymer: finishMaterial(new THREE.MeshPhysicalMaterial({color:'#eeeae0',roughness:.32,clearcoat:.22,clearcoatRoughness:.35}), 'plastic'),
  graphite: new THREE.MeshStandardMaterial({color:'#252c29',roughness:.58,metalness:.15}),
  steelInset: new THREE.MeshStandardMaterial({color:'#7b898e',roughness:.34,metalness:1}),
};
export function mesh(geometry, material, x=0,y=0,z=0) {
  const object = new THREE.Mesh(geometry, material); object.position.set(x,y,z);
  object.castShadow = true; object.receiveShadow = true; return object;
}
export function box(w,h,d,material=materials.cream,r=.06) {
  return mesh(new RoundedBoxGeometry(w,h,d,3,r),material);
}
export function rod(a,b,r=.04,material=materials.metal) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
  const v=bv.clone().sub(av),object=mesh(new THREE.CylinderGeometry(r,r,v.length(),16),material);
  object.position.copy(av.add(bv).multiplyScalar(.5));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());
  return object;
}
export function createStone() {
  const object=mesh(new THREE.IcosahedronGeometry(.61,4),materials.stone);
  const p=object.geometry.attributes.position;
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=1+.1*Math.sin(x*8+y*5+z*3)+.045*Math.sin(x*23-y*17+z*11);
    // Flattened fracture planes and a chipped edge give the stone a worked
    // silhouette, while the shader supplies the much finer mineral grain.
    p.setXYZ(i,Math.min(x*n,.46),Math.max(y*n*.78,-.39),z*n);
  }
  object.geometry.deleteAttribute('normal');object.geometry.deleteAttribute('uv');
  const coarse=object.geometry;object.geometry=mergeVertices(coarse,1e-5);coarse.dispose();object.geometry.computeVertexNormals();return object;
}
export function createCompass() {
  const group=new THREE.Group();
  for(const end of [[-.45,-1.7,0],[.6,-1.7,0]]){
    const leg=box(.1,Math.hypot(end[0],end[1]),.09,materials.bronze,.018);
    leg.position.set(end[0]*.5,end[1]*.5,0);leg.rotation.z=Math.atan2(end[0],-end[1]);group.add(leg);
    const inset=box(.042,1.32,.014,materials.metal,.007);inset.position.z=.053;leg.add(inset);
  }
  const hinge=mesh(new THREE.CylinderGeometry(.14,.14,.15,48),materials.metal);hinge.rotation.x=Math.PI/2;group.add(hinge);
  const screw=mesh(new THREE.CylinderGeometry(.069,.069,.019,32),materials.bronze,0,0,.087);screw.rotation.x=Math.PI/2;group.add(screw);
  const slot=box(.077,.012,.003,materials.graphite,.003);slot.position.set(0,0,.099);group.add(slot);
  group.add(rod([0,.13,0],[0,.4,0],.048,materials.metal));
  const grip=mesh(new THREE.CylinderGeometry(.08,.08,.16,32),materials.bronze,0,.38,0);group.add(grip);
  addKnurling(grip,.082,.15,32);
  group.add(rod([-.26,-1,0],[.36,-1,0],.026,materials.metal));
  const adjust=mesh(new THREE.CylinderGeometry(.083,.083,.13,32),materials.bronze,.05,-1,0);adjust.rotation.z=Math.PI/2;group.add(adjust);addKnurling(adjust,.085,.12,28);
  const needle=mesh(new THREE.ConeGeometry(.034,.29,24),materials.metal,-.485,-1.83,0);needle.rotation.z=Math.PI;group.add(needle);
  const pencil=mesh(new THREE.CylinderGeometry(.047,.043,.35,24),materials.graphite,.625,-1.74,0);group.add(pencil);
  const lead=mesh(new THREE.ConeGeometry(.037,.13,24),materials.graphite,.635,-1.97,0);lead.rotation.z=Math.PI;group.add(lead);
  return group;
}
function addKnurling(parent,radius,height,count) {
  const ridges=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0025,.0025,height,5),materials.metal,count);
  const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2;dummy.position.set(Math.cos(a)*radius,0,Math.sin(a)*radius);dummy.updateMatrix();ridges.setMatrixAt(i,dummy.matrix)}
  parent.add(ridges);
}

export function createWrench() {
  const g=new THREE.Group();
  const shaft=box(.22,1.64,.11,materials.metal,.045);shaft.position.y=-.66;g.add(shaft);
  const inset=box(.1,1.19,.006,materials.steelInset,.03);inset.position.set(0,-.64,.059);g.add(inset);
  // Forged open jaw with flat working faces, rather than a round torus.
  const jaw=new THREE.Shape();jaw.moveTo(-.12,-.12);jaw.bezierCurveTo(-.32,-.02,-.4,.11,-.38,.34);jaw.bezierCurveTo(-.37,.5,-.3,.62,-.19,.69);jaw.lineTo(-.19,.3);jaw.quadraticCurveTo(0,.23,.19,.3);jaw.lineTo(.19,.69);jaw.bezierCurveTo(.3,.62,.37,.5,.38,.34);jaw.bezierCurveTo(.4,.11,.32,-.02,.12,-.12);jaw.closePath();
  const headGeometry=new THREE.ExtrudeGeometry(jaw,{depth:.12,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.02,bevelThickness:.02,curveSegments:24});headGeometry.translate(0,0,-.06);
  const head=mesh(headGeometry,materials.metal,0,.04,0);g.add(head);
  const ring=new THREE.Shape();ring.absarc(0,0,.23,0,Math.PI*2,false);
  const hole=new THREE.Path();
  for(let i=0;i<12;i++){const a=-i/12*Math.PI*2,r=i%2?.125:.15;if(i===0)hole.moveTo(Math.cos(a)*r,Math.sin(a)*r);else hole.lineTo(Math.cos(a)*r,Math.sin(a)*r)}hole.closePath();ring.holes.push(hole);
  const end=mesh(new THREE.ExtrudeGeometry(ring,{depth:.09,bevelEnabled:true,bevelSegments:3,bevelSize:.014,bevelThickness:.014,steps:1,curveSegments:48}),materials.metal,0,-1.53,-.045);g.add(end);
  const stamp=mesh(new THREE.PlaneGeometry(.14,.19),new THREE.MeshStandardMaterial({map:stampTexture('12'),roughness:.45,metalness:.6}),0,-1.02,.063);g.add(stamp);
  return g;
}
function stampTexture(text) {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const context=canvas.getContext('2d');context.fillStyle='#9aa5a9';context.fillRect(0,0,128,128);context.fillStyle='#414b4e';context.font='600 72px Arial';context.textAlign='center';context.textBaseline='middle';context.fillText(text,64,67);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function createMouse() {
  const g=new THREE.Group();
  const shell=mesh(new THREE.SphereGeometry(1,64,40),materials.polymer);shell.scale.set(.52,.75,.28);g.add(shell);
  const base=mesh(new THREE.SphereGeometry(1,48,24),materials.rubber,0,0,-.11);base.scale.set(.498,.72,.18);g.add(base);
  const seam=new THREE.CatmullRomCurve3(Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return new THREE.Vector3(Math.cos(a)*.507,Math.sin(a)*.731,-.044)}),true);
  g.add(mesh(new THREE.TubeGeometry(seam,100,.008,6,true),materials.graphite));
  const split=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.09,.282),new THREE.Vector3(0,.4,.241),new THREE.Vector3(0,.65,.146),new THREE.Vector3(0,.728,.055)]);
  g.add(mesh(new THREE.TubeGeometry(split,32,.006,6,false),materials.graphite));
  const wheelBed=box(.12,.25,.025,materials.graphite,.035);wheelBed.position.set(0,.27,.269);wheelBed.rotation.x=-.16;g.add(wheelBed);
  const wheel=mesh(new THREE.CylinderGeometry(.097,.097,.075,40),materials.rubber,0,.27,.292);wheel.rotation.z=Math.PI/2;g.add(wheel);addKnurling(wheel,.099,.071,32);
  for(const y of [-.42,.46]){const foot=box(.24,.14,.012,materials.graphite,.05);foot.position.set(0,y,-.244);g.add(foot)}
  const sensor=mesh(new THREE.CircleGeometry(.043,24),materials.graphite,0,-.07,-.295);sensor.rotation.y=Math.PI;g.add(sensor);
  const status=mesh(new THREE.SphereGeometry(.013,16,8),materials.blue,0,-.37,.244);g.add(status);
  return g;
}
export function createGear(radius=1) {
  const g=new THREE.Group(),shape=new THREE.Shape(),count=32;
  const profile=[[-.5,.92],[-.32,.92],[-.18,1.065],[.18,1.065],[.32,.92]];
  for(let i=0;i<count;i++)for(const [offset,r] of profile){const a=(i+offset)/count*Math.PI*2,x=Math.cos(a)*radius*r,y=Math.sin(a)*radius*r;if(i===0&&offset===-.5)shape.moveTo(x,y);else shape.lineTo(x,y)}shape.closePath();
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,hole=new THREE.Path();hole.absellipse(Math.cos(a)*radius*.59,Math.sin(a)*radius*.59,radius*.19,radius*.19,0,Math.PI*2,true,0);shape.holes.push(hole)}
  const center=new THREE.Path();center.absarc(0,0,.15*radius,0,Math.PI*2,true);shape.holes.push(center);
  const body=mesh(new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:20}),materials.bronze,0,0,-.08);g.add(body);
  const rim=mesh(new THREE.TorusGeometry(radius*.81,.021,8,96),materials.metal,0,0,.093);g.add(rim);
  const hub=mesh(new THREE.CylinderGeometry(.21*radius,.21*radius,.26,6),materials.metal);hub.rotation.x=Math.PI/2;g.add(hub);
  const collar=mesh(new THREE.TorusGeometry(.155*radius,.025,10,40),materials.metal,0,0,.14);g.add(collar);
  const slot=box(.19*radius,.026*radius,.008,materials.graphite,.008);slot.position.z=.139;g.add(slot);
  return g;
}
export function createRocket() {
  const g=new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(.18,.22,2.2,24),materials.ivory));
  g.add(mesh(new THREE.ConeGeometry(.18,.55,24),materials.ivory,0,1.36,0));
  g.add(mesh(new THREE.CylinderGeometry(.235,.235,.11,24),materials.ink,0,.45,0));
  for(let i=0;i<4;i++){const a=i*Math.PI/2;const booster=mesh(new THREE.CylinderGeometry(.07,.07,1.3,12),materials.ivory,Math.cos(a)*.22,-.6,Math.sin(a)*.22);g.add(booster)}
  return g;
}
function labelTexture(title,type='report') {
  const c=document.createElement('canvas');c.width=512;c.height=640;const ctx=c.getContext('2d');
  ctx.fillStyle='#f2f2e9';ctx.fillRect(0,0,512,640);
  ctx.fillStyle='#335f58';ctx.font='500 29px Arial';ctx.fillText(title,45,75);
  ctx.fillStyle='#009DDB';ctx.beginPath();ctx.arc(454,66,12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#72958e';
  if(type==='source')for(let r=0;r<7;r++)for(let col=0;col<4;col++){ctx.fillRect(45+col*105,145+r*56,75,14)}
  else {for(let i=0;i<6;i++)ctx.fillRect(45,143+i*45,i===5?230:360,8);ctx.strokeStyle='#0088bf';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(45,520);ctx.lineTo(140,485);ctx.lineTo(240,512);ctx.lineTo(340,412);ctx.lineTo(456,392);ctx.stroke()}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
export function createDocument(title,type='report') {
  const g=new THREE.Group();const front=mesh(new THREE.PlaneGeometry(1.1,1.38),new THREE.MeshStandardMaterial({map:labelTexture(title,type),roughness:.8,side:THREE.DoubleSide}),0,0,.025);
  g.add(box(1.1,1.38,.04,materials.ivory,.015),front);return g;
}
export function createArc(radius,material=materials.blue,portion=1) {
  const curve=new THREE.EllipseCurve(0,0,radius,radius,0,Math.PI*2*portion,false,0);
  const points=curve.getPoints(100).map(p=>new THREE.Vector3(p.x,p.y,0));
  const path=new THREE.CatmullRomCurve3(points);return mesh(new THREE.TubeGeometry(path,100,.018,6,false),material);
}
