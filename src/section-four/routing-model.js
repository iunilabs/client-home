import {smooth,mix} from '../section-three/motion.js';

// Repetitive work can be prepared automatically; approvals still go to people.
export function routeFor(kind){
  if(['note','task','email'].includes(kind))return 0;
  if(['document','summary','test'].includes(kind))return 1;
  return 2;
}
export function routingPose(card,kind,width,height){
  const mobile=width<700, short=height<=460;
  const through=smooth(0,.6,card.travel), outgoing=smooth(.6,1,card.travel);
  const lane=routeFor(kind);
  const startY=mobile ? .18 : short ? -.24 : card.y;
  const hubY=mobile?-.08:short?-.24:-.1;
  const destinationY=mobile?-.34:(short?[.15,-.14,-.43]:[.29,0,-.29])[lane];
  return {...card,
    x:mobile?mix(0,[-.6,0,.6][lane],outgoing):mix(mix(-.48,0,through),.5,outgoing),
    y:mix(mix(startY,hubY,through),destinationY,outgoing),
    pixelWidth:card.pixelWidth*mix(1,.3,through),
    done:false, opacity:1-smooth(.6,.94,card.travel)};
}

export function applyRoutingAppearance(piece,card,state){
  const opacity=mix(1,card.opacity,state.ordered);
  for(const material of piece.materials()){
    const transparent=opacity<1;
    if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true;}
    material.opacity=opacity;
  }
  // Until ordering finishes, visibility belongs to the original fall choreography.
  if(state.ordered===1)piece.mesh.visible=card.opacity>.001;
  piece.mesh.castShadow=card.opacity>.5;
}
