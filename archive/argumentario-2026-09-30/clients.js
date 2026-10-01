import * as THREE from 'three';
import { clamp,mix,smooth } from './timeline.js';

// Names and original artwork as published in Puntoes' own client section.
// This data makes no claim about current contracts or AI engagements.
export const clients=[
  {id:'accenture',name:'Accenture',image:'/clients/accenture.jpg'},
  {id:'bbva',name:'BBVA',image:'/clients/bbva.png'},
  {id:'canal',name:'Canal de Isabel II',image:'/clients/canal.jpg'},
  {id:'cepsa',name:'Cepsa',image:'/clients/cepsa.jpg'},
  {id:'mapfre',name:'MAPFRE',image:'/clients/mapfre.jpg'},
  {id:'mediaset',name:'Mediaset España',image:'/clients/mediaset.jpg'},
  {id:'ree',name:'Red Eléctrica',image:'/clients/ree.jpg'},
  {id:'siemens',name:'Siemens',image:'/clients/siemens.jpg'},
  {id:'naturgy',name:'Naturgy',image:'/clients/naturgy.png'}
];

// The added editorial chapter does not alter the timing of the existing rigs.
export function worldProgress(progress){
  if(progress<12)return progress;
  if(progress<13)return 12+(progress-12)*.65;
  return Math.min(13,12.65+(progress-13)*.35);
}
export function clientPresentation(p,mobile=false,reduced=false){
  const enter=reduced?1:smooth(12.02,12.20,p),leave=reduced?0:smooth(12.88,13.08,p);
  const group=clamp(Math.floor((p-12.08)/.27),0,2);
  const start=12.08+group*.27,end=start+.27;
  const groupOpacity=mobile&&!reduced?(group===0?1:smooth(start,start+.035,p))*(group===2?1:1-smooth(end-.035,end,p)):1;
  return {visible:p>=12&&p<13.08,opacity:enter*(1-leave)*groupOpacity,group,shown:mobile&&!reduced?clients.slice(group*3,group*3+3).map(c=>c.id):clients.map(c=>c.id)};
}

export function populateClients(){
  for(const list of document.querySelectorAll('[data-client-list]')){
    if(list.children.length)continue;
    for(const client of clients){
      const item=document.createElement('li'),image=document.createElement('img');
      image.src=client.image;image.alt=client.name;image.width=160;image.height=80;image.loading='lazy';image.decoding='async';
      item.append(image);list.append(item);
    }
  }
}

export function logoTexture(client){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,512);
  // A readable name remains if an individual image fails to load.
  ctx.fillStyle='#213a37';ctx.font='600 32px Arial';ctx.textAlign='center';ctx.fillText(client.name,256,267,370);
  const image=new Image();image.onload=()=>{
    const scan=document.createElement('canvas');scan.width=image.naturalWidth;scan.height=image.naturalHeight;
    const sx=scan.getContext('2d',{willReadFrequently:true});sx.drawImage(image,0,0);
    const {data}=sx.getImageData(0,0,scan.width,scan.height);
    let left=scan.width,right=0,top=scan.height,bottom=0;
    // Remove only the source's blank white/transparent margin. The logo's
    // colour, proportions and artwork remain intact, including historical marks.
    for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++){
      const i=(y*scan.width+x)*4;
      if(data[i+3]>80&&Math.min(data[i],data[i+1],data[i+2])<220){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
    }
    ctx.fillStyle='#fff';ctx.fillRect(0,0,512,512);
    if(right>left&&bottom>top){
      const w=right-left+1,h=bottom-top+1,scale=Math.min(358/w,200/h);
      ctx.drawImage(image,left,top,w,h,(512-w*scale)/2,(512-h*scale)/2,w*scale,h*scale);
    }
    texture.needsUpdate=true;
  };image.src=client.image;
  return texture;
}

// One additional group in the existing world and renderer. The reference
// camera places the composition once; the real pointer-driven camera provides
// depth and occlusion, instead of moving a flat overlay with the mouse.
export function createClientScene({scene,camera,ball}){
  const root=new THREE.Group();root.name='puntoes-clients';scene.add(root);
  const reference=new THREE.PerspectiveCamera(),point=new THREE.Vector3();
  const faceGeometry=new THREE.CircleGeometry(1,64),bodyGeometry=new THREE.CylinderGeometry(1,1,.065,64);
  bodyGeometry.rotateX(Math.PI/2);
  const discs=clients.map((client,i)=>{
    const group=new THREE.Group();group.name=client.id;root.add(group);
    const body=new THREE.Mesh(bodyGeometry,new THREE.MeshStandardMaterial({color:'#dce5df',roughness:.37,metalness:.12,transparent:true}));
    const face=new THREE.Mesh(faceGeometry,new THREE.MeshBasicMaterial({map:logoTexture(client),transparent:true,toneMapped:false}));face.position.z=.035;
    group.add(body,face);return {client,group,body,face,index:i};
  });
  let last={visible:false,shown:[],discs:[]};
  function screenPoint(x,y,distance){
    point.set(x*2-1,1-y*2,.5).unproject(reference).sub(reference.position).normalize();
    return reference.position.clone().addScaledVector(point,distance);
  }
  function render(p,time,reduced){
    const mobile=innerWidth<700,presentation=clientPresentation(p,mobile,reduced);
    // The final approach is scroll-derived and reversible. A reduced mobile
    // composition reserves clear space below the complete logo list.
    if(p>=12){
      if(!mobile&&camera.aspect<1.15){camera.fov=48;camera.updateProjectionMatrix()}
      camera.position.lerp(ball.position,.025*smooth(12.82,13.18,p));
      if(mobile&&reduced&&p<13)camera.position.y+=innerHeight<700?2:.85;
      camera.updateMatrixWorld(true);
    }
    root.visible=presentation.visible&&!document.body.classList.contains('webgl-fallback');
    if(!root.visible){last={visible:false,shown:[],discs:[]};return}
    reference.fov=camera.fov;reference.aspect=camera.aspect;
    reference.position.set(mobile?2.35:.3,mobile?1.8:1,mobile?16.5:12);
    reference.lookAt(new THREE.Vector3(mobile?2.3:1,mobile?2.7:.4,0));reference.updateProjectionMatrix();reference.updateMatrixWorld(true);
    const settle=smooth(12.18,12.40,p),exit=smooth(12.88,13.08,p);
    for(const disc of discs){
      const i=disc.index,inGroup=presentation.shown.includes(disc.client.id);
      disc.group.visible=inGroup&&!(mobile&&reduced);
      if(!disc.group.visible)continue;
      const slot=i%3;
      const slots=[[.50,.28],[.65,.19],[.80,.24],[.85,.39],[.85,.59],[.79,.73],[.64,.75],[.51,.65],[.47,.46]];
      const diameter=mobile?Math.min(104,innerWidth*.26):Math.min(132,innerWidth*.095);
      const distance=mobile?14.5:(slots[i][1]>.55?6.2+(i%3)*.5:10.4+(i%3)*.8);
      let x=mobile?.19+slot*.31:slots[i][0];
      let y=mobile?.44:slots[i][1];
      // Scroll unfurls a shallow arc and settles all marks face-on. No full
      // orbit can hide an essential name, and reversing restores the entrance.
      if(!reduced){x+=Math.sin(i*2.4)*.045*(1-settle);y+=.12*(1-presentation.opacity);x+=(x-.5)*exit*.7}
      const position=screenPoint(x,y,distance);
      const radius=diameter/innerHeight*distance*Math.tan(reference.fov*Math.PI/360);
      disc.group.position.copy(position);
      if(!reduced){disc.group.position.y+=Math.sin(time*.45+i)*.035;disc.group.position.z+=Math.sin(time*.3+i)*.055}
      disc.group.quaternion.copy(reference.quaternion);
      disc.group.rotateY(reduced?0:Math.sin(i*2.1)*(1-settle)*.35+Math.sin(time*.4+i)*.018);
      disc.group.scale.setScalar(radius*(reduced?1:mix(.75,1,presentation.opacity)));
      disc.face.material.opacity=presentation.opacity;disc.body.material.opacity=presentation.opacity;
    }
    last={...presentation,discs:discs.filter(d=>d.group.visible).map(d=>{
      const s=d.group.position.clone().project(camera);
      return {id:d.client.id,x:(s.x+1)*innerWidth/2,y:(1-s.y)*innerHeight/2,z:d.group.position.z,opacity:d.face.material.opacity};
    })};
  }
  return {render,getState:()=>last};
}
