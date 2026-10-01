import * as THREE from 'three';
import {clients,logoTexture} from './clients.js';

export function createHandOrbits(scene,human){
 const root=new THREE.Group();root.name='puntoes-orbits';scene.add(root);
 const circle=new THREE.CircleGeometry(1,48),body=new THREE.CylinderGeometry(1,1,.075,48);body.rotateX(Math.PI/2);
 const discs=clients.map((client,i)=>{
  const group=new THREE.Group();root.add(group);group.name=client.id;
  const edge=new THREE.Mesh(body,new THREE.MeshStandardMaterial({color:'#e3ebe7',roughness:.38,transparent:true}));
  const front=new THREE.Mesh(circle,new THREE.MeshBasicMaterial({map:logoTexture(client),transparent:true,toneMapped:false,side:THREE.DoubleSide}));front.position.z=.039;
  const back=front.clone();back.material=front.material;back.position.z=-.039;back.rotation.y=Math.PI;group.add(edge,front,back);
  return {group,front,edge,i,client};
 });
 let last={visible:false,discs:[]};
 return {
  render(pose,time,reduced,camera){
   root.visible=pose.orbit>.001;if(!root.visible){last={visible:false,discs:[]};return}
   const mobile=innerWidth<700;
   for(const {group,front,edge,i} of discs){
    const phase=i*Math.PI*2/discs.length+pose.orbitAngle+(reduced?0:time*.14);
    // A helix around the wrist, with alternating near/far depth. Unlike a
    // screen-aligned crown it shares the hand's rotation and camera parallax.
    const radius=mobile?1.25:1.7;
    const local=new THREE.Vector3(.35+(i%3-1)*.6,Math.cos(phase)*radius,Math.sin(phase)*radius);
    const location=human.root.localToWorld(local);group.position.copy(location);
    group.quaternion.copy(human.root.quaternion);group.rotateY(phase*.72);group.rotateX(.25*Math.sin(phase));
    group.scale.setScalar((mobile?.28:.40)*pose.orbit);
    front.material.opacity=pose.orbit;edge.material.opacity=pose.orbit;
   }
   camera.updateMatrixWorld();last={visible:true,discs:discs.map(d=>{const v=d.group.position.clone().project(camera);return {id:d.client.id,x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,z:d.group.position.z,opacity:d.front.material.opacity}})};
  },getState:()=>last,
 };
}
