import {clamp, smooth, mix} from './timeline.js';

// Normalised scroll positions match the authored object and hand choreography.
// Leave a quiet interval between tools; the final message stays at the endpoint.
export const copyBeats = [
  {id:'intro', enter:[0,0], leave:[.080,.165]},
  {id:'stone', enter:[.185,.225], leave:[.315,.375]},
  {id:'compass', enter:[.405,.450], leave:[.540,.590]},
  {id:'wrench', enter:[.645,.695], leave:[.840,.890]},
  {id:'encounter', enter:[.940,.985], leave:null},
];
const chapterBoundaries = [.175,.390,.615,.915];

export function editorialState(ratio, reduced=false) {
  const p=clamp(ratio), index=chapterBoundaries.filter(at=>p>=at).length;
  const beats=copyBeats.map((beat,i)=>{
    const entrance=i===0?1:smooth(...beat.enter,p);
    const exit=beat.leave?smooth(...beat.leave,p):0;
    return {id:beat.id, opacity:reduced?Number(i===index):entrance*(1-exit),
      y:reduced?0:mix(24,0,entrance)-exit*20,
      blur:reduced?0:(1-entrance)*3+exit*3};
  });
  return {index,beats};
}
