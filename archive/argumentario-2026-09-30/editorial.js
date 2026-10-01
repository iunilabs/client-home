import { clamp, smooth } from './timeline.js';

// Absolute progress follows the existing gestures in scene.js. This module
// owns only the editorial overlay; it never moves the objects or the camera.
// Each beat is [fade-in start, fade-in end, fade-out start, fade-out end].
const forever=Infinity;
export const editorialChapters=[
  {at:0,readAt:0,beats:{title:[-1,0,.08,.28],label:[-1,0,.05,.24],support:[-1,0,.05,.24],action:[-1,0,.05,.24]}},
  {at:1,readAt:1.40,beats:{prelude:[1.00,1.12,1.48,1.62],meaning:[1.28,1.40,1.68,1.82]}},
  {at:2,readAt:2.40,beats:{prelude:[2.00,2.12,2.52,2.66],meaning:[2.18,2.34,2.62,2.78]}},
  {at:3,readAt:3.58,beats:{prelude:[3.06,3.20,3.58,3.72],meaning:[3.36,3.54,3.76,3.94]}},
  {at:4,readAt:4.32,beats:{prelude:[4.02,4.14,4.46,4.60],meaning:[4.16,4.30,4.54,4.72]}},
  {at:5,readAt:5.74,beats:{prelude:[5.10,5.24,5.32,5.42],meaning:[5.58,5.70,5.84,5.98]}},
  {at:6,readAt:6.92,beats:{prelude:[6.12,6.26,6.48,6.62],meaning:[6.74,6.90,7.00,7.10]}},
  {at:7.12,readAt:7.54,beats:{prelude:[7.16,7.28,7.56,7.72],meaning:[7.32,7.50,7.74,7.90]}},
  {at:8,readAt:8.54,beats:{label:[8.02,8.12,8.80,8.96],title:[8.08,8.24,8.80,8.96],support:[8.28,8.42,8.80,8.96],action:[8.34,8.48,8.80,8.96]}},
  {at:9,readAt:9.50,beats:{label:[9.00,9.10,9.82,9.98],title:[9.08,9.24,9.82,9.98],support:[9.24,9.38,9.82,9.98],action:[9.30,9.44,9.82,9.98]}},
  {at:10,readAt:10.54,beats:{label:[10.00,10.10,10.82,10.98],title:[10.08,10.24,10.82,10.98],support:[10.28,10.42,10.82,10.98],action:[10.34,10.48,10.82,10.98]}},
  {at:11,readAt:11.38,beats:{prelude:[11.04,11.18,11.70,11.84],meaning:[11.22,11.36,11.78,11.96]}},
  {at:12,readAt:12.48,beats:{label:[12.02,12.14,12.88,13.00],title:[12.08,12.24,12.88,13.00],action:[12.22,12.36,12.88,13.00]}},
  {at:13,readAt:13.18,beats:{title:[13.00,13.12,forever,forever],action:[13.04,13.16,forever,forever]}}
];

export function editorialState(progress,stable=false){
  const p=clamp(progress,0,14);
  let index=0;
  for(let i=1;i<editorialChapters.length;i++)if(p>=editorialChapters[i].at)index=i;
  const chapter=editorialChapters[index],beats={};
  for(const [name,[start,entered,leaving,end]] of Object.entries(chapter.beats)){
    const entry=smooth(start,entered,p),exit=Number.isFinite(end)?smooth(leaving,end,p):0;
    beats[name]={opacity:stable?1:entry*(1-exit),y:stable?0:(1-entry)*12-exit*6};
  }
  return {index,beats};
}

export function editorialDestination(index,offsets){
  const i=clamp(index,0,editorialChapters.length-1);
  const phase=editorialChapters[i].readAt-i;
  return offsets[i]+(offsets[i+1]-offsets[i])*phase;
}
