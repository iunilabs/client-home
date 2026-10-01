import { mix, smooth, sampleFrames } from './timeline.js';

// The reveal is entirely reversible. The initial frame contains no actors;
// the fingertips emerge from a light field before the palm and forearm.
const entrance=[
  {at:0,h:[1.35,-.45,.45],r:[1.05,.30,1.60],curl:.14,curls:[.08,.01,.15,.40,.35]},
  {at:.16,h:[1.35,-.45,.45],r:[1.05,.30,1.60],curl:.14,curls:[.08,.01,.15,.40,.35]},
  {at:.48,h:[1.35,-.45,.55],r:[1.05,.30,1.60],curl:.14,curls:[.08,.01,.15,.40,.35]},
  {at:.78,h:[1.35,-.45,.75],r:[1.05,.30,1.60],curl:.14,curls:[.08,.01,.15,.40,.35]},
  {at:1,h:[1.35,-.45,.80],r:[1.05,.30,1.60],curl:.14,curls:[.08,.01,.15,.40,.35]},
];

// Matched to the supplied entry silhouette: upright index, foreshortened
// middle finger, falling ring/little fingers and a low, open thumb.
export function introGesture(progress,time=0,reduced=false){
 const flexions=[[-.70,-.15,-.04],[.08,.11,.05],[.50,1.0,.60],[1.10,.55,.30]];
 if(!reduced)for(let finger=1;finger<4;finger++){
  const phase=(finger-1)*1.7,variation=Math.sin(time*(.67+(finger-1)*.09)+phase)*.020+Math.sin(time*.29+phase*.8)*.008;
  flexions[finger]=flexions[finger].map((angle,joint)=>angle+variation*[.6,.8,.5][joint]);
 }
 return {fingerFlexions:flexions,fingerSpreads:[-.04,.20,.16,.12],fingerGestureWeight:1-smooth(1,1.45,progress)};
}

export function introPose(progress){return sampleFrames(entrance,Math.min(progress,1))}

export function handBreath(progress,time,reduced){
  if(reduced)return 0;
  const envelope=smooth(.04,.20,progress)*(1-smooth(.92,1.15,progress));
  return (Math.sin(time*.8)*.14+Math.sin(time*1.6+.7)*.025)*envelope;
}

// Independent, slow rhythms prevent a mechanical wave. Only the three
// relaxed fingers breathe; a grip and the index-to-index contact keep their
// authored pose. Values are radians passed to the existing hand rig.
export function livingFingers(curls,progress,time,reduced){
  const result=[...curls];
  if(reduced)return result;
  const relaxed=(1-smooth(.96,1.14,progress))*(1-smooth(4.75,5,progress));
  const contact=progress>=5&&progress<6;
  const open=contact?.20:progress>=6?.35:relaxed;
  for(let i=2;i<5;i++){
    const phase=(i-2)*1.7;
    const variation=Math.sin(time*(.67+(i-2)*.09)+phase)*.020+
      Math.sin(time*.29+phase*.8)*.008;
    result[i]+=variation*open;
  }
  return result;
}

export function introState(progress){
  return {handVisible:progress>.015,toolReveal:smooth(.96,1.14,progress),
    titleLift:mix(0,-48,smooth(0,.24,progress)),
    lightOpacity:smooth(.015,.16,progress)*(1-smooth(.9,1.3,progress)),
    lightRadius:mix(80,510,smooth(.015,.72,progress)),
    perspective:mix(.18,.08,smooth(.75,1.15,progress))};
}
