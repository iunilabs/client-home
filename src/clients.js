import * as THREE from 'three';

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

