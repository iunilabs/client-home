import {sampleFrames,smooth,clamp,mix} from './timeline.js';
import {handBreath} from './intro.js';

const entry={curls:[.08,.01,.15,.40,.35],flexions:[[-.70,-.15,-.04],[.08,.11,.05],[.50,1,.60],[1.10,.55,.30]],spreads:[-.04,.20,.16,.12],opposition:-.55,wrist:0};
const waking={...entry,curls:[.12,.02,.22,.5,.5],flexions:[[-.30,.15,.08],[.25,.32,.16],[.70,1.2,.75],[1.15,.85,.45]],opposition:-.60};
const reaching={...entry,flexions:[[-.50,.05,.04],[-.10,.10,.05],[.18,.65,.30],[.50,.75,.35]],opposition:-.40};
const open={curls:[.08,0,0,.05,.08],flexions:[[-.68,-.10,-.02],[-.48,.08,.04],[-.22,.18,.08],[-.10,.25,.10]],spreads:[-.04,.15,.20,.24],opposition:-.48,wrist:0};
const precise={curls:[.25,.08,.16,.35,.40],flexions:[[-.10,.40,.12],[.25,.60,.25],[.30,.70,.30],[.45,.85,.35]],spreads:[-.03,.10,.13,.16],opposition:-.20,wrist:0};
const react={curls:[.40,.12,.20,.38,.44],flexions:[[.10,.62,.22],[.38,.72,.32],[.36,.78,.34],[.50,.90,.40]],spreads:[-.03,.08,.12,.16],opposition:.12,wrist:-.015};
export const finalHuman={curls:[.3,.02,.30,.36,.40],opposition:0,wrist:.15};
// Meter values are normalised 0–1000, independent of viewport and page height.
// A fixed chirality is retained throughout; no scale interpolation crosses 0.
export const humanFrames=[
 {at:0,h:[1.35,-.45,.45],r:[1.05,.30,1.60],cam:[0,.8,13],look:[0,.2,0],fov:26,...waking},
 {at:.07,h:[1.35,-.45,.55],r:[1.05,.30,1.60],cam:[0,.8,13],look:[0,.2,0],fov:26,...entry,flexions:[[-.50,.05,.02],[.08,.11,.05],[.50,1,.60],[1.10,.55,.30]],wrist:-.01},
 {at:.12,h:[1.35,-.45,.70],r:[1.05,.30,1.58],cam:[0,.8,13],look:[0,.2,0],fov:26,...entry,flexions:[[-.65,-.08,-.02],[.02,.15,.08],[.35,.85,.42],[.72,.78,.38]],opposition:-.48},
 {at:.18,h:[1.35,-.45,.8],r:[1.05,.30,1.55],cam:[0,.8,13],look:[0,.2,0],fov:26,...reaching},
 {at:.25,tip:[1.0,.3,-2],h:[-.65,-1.0,1.1],r:[1.05,.30,.4],cam:[0,.8,13.5],look:[0,.2,0],fov:28,...open},
 {at:.30,h:[.0,-.3,1],r:[.65,.10,.50],cam:[.35,.7,14],look:[.4,.2,0],fov:28,...open,flexions:[[-.45,.15,.24],[-.20,.24,.28],[-.05,.32,.30],[.10,.45,.34]]},
 {at:.312,h:[.06,-.25,1.05],r:[.68,.12,.48],cam:[.35,.7,14],look:[.4,.2,0],fov:28,...open,flexions:[[-.45,.15,.24],[-.20,.24,.28],[-.05,.32,.30],[.10,.45,.34]]},
 {at:.345,h:[.10,-.25,1.05],r:[.70,.12,.46],cam:[.35,.7,14],look:[.4,.2,0],fov:28,...open,curls:[.18,.06,.12,.20,.25],flexions:[[-.25,.30,.30],[.02,.40,.34],[.16,.52,.38],[.28,.62,.42]],opposition:-.25,wrist:-.035},
 {at:.39,h:[.26,.08,1.20],r:[.82,.22,.43],cam:[.28,.75,14],look:[.45,.35,0],fov:28.5,...precise,flexions:[[-.20,.30,.20],[.15,.45,.26],[.22,.58,.32],[.36,.70,.36]],opposition:-.25,wrist:-.015},
 {at:.50,tip:[2.85,1.70,2.59],h:[.4,.5,.9],r:[1.05,.30,.40],cam:[.15,.8,14],look:[.5,.6,0],fov:29,...precise},
 {at:.525,tip:[2.86,1.69,2.58],h:[.3,.54,.9],r:[1.065,.285,.40],cam:[.125,.78,14],look:[.5,.6,0],fov:29,...precise},
 {at:.57,tip:[2.90,1.63,2.54],h:[.2,.6,.9],r:[1.10,.25,.40],cam:[.05,.75,14],look:[.5,.6,0],fov:29,...react},
 {at:.64,h:[-.7,.2,.9],r:[1.25,-.10,.60],cam:[.2,.65,14.5],look:[.3,.5,0],fov:30,...precise},
 {at:.75,h:[-1.8,.65,.8],r:[1.42,-.14,.30],cam:[.5,.55,14.5],look:[.2,.5,0],fov:32,...precise},
 {at:.84,tip:[-.7,1.1,.75],h:[-2.5,.85,.75],r:[1.40,-.12,.03],cam:[.2,.5,14.2],look:[0,.5,0],fov:33,...finalHuman,curls:[.22,.035,.26,.30,.34],wrist:.06},
 {at:1,tip:[-.1,.97,.75],h:[-3,1.2,.75],r:[1.4,-.12,0],cam:[0,.4,13.8],look:[0,.5,0],fov:34,...finalHuman},
];
// Local excursion from the lateral750 pose. Original track is authoritative
// outside750–900. Reach toward a graspable wrench neck; actual depth travel, no scaling. PIP/DIP retain
// a soft curve as MCP opens, with restrained ring/pinky extension.
export const wrenchHandFrames=[
 {at:.78,tip:[1.32,.13,4.72],h:[-1.25,-.20,2.8],r:[1.26,-.035,.34],cam:[.43,.55,14.5],look:[.15,.5,0],fov:32.2,curls:[.27,.13,.18,.33,.38],flexions:[[-.08,.42,.23],[.20,.62,.29],[.27,.70,.33],[.39,.80,.36]],spreads:[-.025,.09,.13,.16],opposition:-.17,wrist:-.02},
 {at:.80,tip:[1.76,.03,6.86],h:[-.65,-.80,4.7],r:[1.01,.12,.37],cam:[.37,.54,14.45],look:[.1,.5,0],fov:32.4,curls:[.31,.15,.20,.34,.39],flexions:[[-.055,.45,.25],[.18,.64,.30],[.27,.72,.34],[.40,.81,.37]],spreads:[-.025,.085,.125,.155],opposition:-.10,wrist:-.04},
 {at:.82,tip:[1.92,-.13,8.00],h:[-.06,-1.05,5.85],r:[.90,.18,.35],cam:[.32,.53,14.4],look:[.06,.5,0],fov:32.6,curls:[.34,.16,.21,.34,.39],flexions:[[-.04,.47,.26],[.17,.65,.31],[.27,.72,.34],[.40,.81,.37]],spreads:[-.025,.08,.12,.15],opposition:-.055,wrist:-.05},
 {at:.835,tip:[1.94,-.12,7.99],h:[-.04,-1.03,5.84],r:[.91,.18,.35],cam:[.26,.515,14.3],look:[.03,.5,0],fov:32.8,curls:[.35,.17,.22,.35,.40],flexions:[[-.03,.49,.27],[.18,.67,.32],[.28,.74,.35],[.41,.83,.38]],spreads:[-.025,.08,.12,.15],opposition:-.045,wrist:-.05},
 {at:.85,tip:[1.68,.02,6.75],h:[-.65,-.60,4.75],r:[1.04,.07,.33],cam:[.2,.5,14.2],look:[0,.5,0],fov:33,curls:[.31,.13,.21,.34,.39],flexions:[[-.07,.41,.22],[.20,.64,.30],[.28,.72,.33],[.40,.81,.36]],spreads:[-.025,.09,.13,.16],opposition:-.15,wrist:-.025},
 {at:.88,tip:[-.1,.73,2.20],h:[-2.75,.78,.75],r:[1.36,-.11,.08],cam:[.13,.48,14.1],look:[0,.5,0],fov:33.35,curls:[.28,.07,.27,.35,.39],flexions:[[-.01,.21,.12],[.29,.55,.27],[.32,.65,.31],[.41,.75,.34]],spreads:[-.025,.09,.12,.15],opposition:-.06,wrist:.08},
];
export const aiFrames=[
 {at:0,r:[3.65,Math.PI-.30,.20],tilt:.15,mirror:1,curls:[.12,.015,.18,.26,.29],opposition:.30,wrist:-.08},
 {at:.90,r:[3.65,Math.PI-.30,.20],tilt:.15,mirror:1,curls:[.12,.015,.18,.26,.29],opposition:.30,wrist:-.08},
 {at:.935,r:[3.72,Math.PI-.20,.14],tilt:.28,mirror:1,curls:[.15,.015,.20,.30,.32],opposition:.35,wrist:-.23},
 {at:.97,r:[3.79,Math.PI-.10,.10],tilt:.38,mirror:1,curls:[.19,.015,.30,.40,.44],opposition:.42,wrist:-.39},
 {at:1,r:[3.8,Math.PI-.08,.10],tilt:.42,mirror:1,curls:[.20,.015,.32,.42,.46],opposition:.45,wrist:-.43},
];
export function choreography(progress,time=0,reduced=false,scrollRatio){
 const ratio=clamp(scrollRatio??progress/5),p=ratio*5;
 // Only spatial fields interpolate here; joints are authored by the one pose track.
 const spatial=humanFrames.map(({at,h,r,cam,look,fov,curls})=>({at,h,r,cam,look,fov,curls}));
 const excursion=[sampleFrames(spatial,.75),...wrenchHandFrames.map(({at,h,r,cam,look,fov,curls})=>({at,h,r,cam,look,fov,curls})),sampleFrames(spatial,.9)];
 const pose=sampleFrames(ratio>.75&&ratio<.9?excursion:spatial,ratio);
 const final=smooth(.80,1,ratio),aiApproach=smooth(.90,1,ratio),aiPose=sampleFrames(aiFrames.map(({at,r,tilt,curls})=>({at,r,tilt,curls})),ratio);
 const humanTip=[mix(-.75,-.10,final),mix(1.1,.97,final),.75];
 const depthBreath=handBreath(p,time,reduced)*(1-smooth(.16,.20,ratio));pose.h[2]+=depthBreath;
 return {...pose,depthBreath,ratio,progress:p,humanMirror:-1,visible:ratio>.003,aiVisible:ratio>.9,
  humanTip,reach:final,aiTip:[mix(6,.10,aiApproach),mix(-1.6,1,aiApproach),.75],
  aiRotation:aiPose.r,aiCurls:aiPose.curls,aiTilt:aiPose.tilt,
  perspective:mix(.18,.12,smooth(.7,1,ratio))*(1-.90*smooth(.75,.80,ratio)*(1-smooth(.85,.9,ratio))),breathing:reduced?0:Math.sin(time*.72)*.035,
  orbit:0,handPoseWeight:0};
}
