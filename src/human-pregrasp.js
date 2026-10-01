import * as THREE from 'three';
import {humanFrames} from './choreography.js';
import {smooth} from './timeline.js';

// Small, anatomical deviations from the locked absolute pose track. They are
// applied after framing so an articulated index never drags the whole arm.
// Each corridor ends at zero; the original 385, 630 and 900–1000 poses survive.
export function sampleGestureCurve(points, value) {
  if (value <= points[0][0] || value >= points.at(-1)[0]) return 0;
  let i = points.findIndex((p, i) => i < points.length - 1 && value < points[i + 1][0]);
  const tangent = j => {
    if (j === 0 || j === points.length - 1) return 0;
    const h0 = points[j][0] - points[j - 1][0], h1 = points[j + 1][0] - points[j][0];
    const d0 = (points[j][1] - points[j - 1][1]) / h0, d1 = (points[j + 1][1] - points[j][1]) / h1;
    if (d0 * d1 <= 0) return 0;
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  const [a, y0] = points[i], [b, y1] = points[i + 1], h = b - a, t = (value - a) / h;
  return (2*t*t*t-3*t*t+1)*y0 + (t*t*t-2*t*t+t)*h*tangent(i)
    + (-2*t*t*t+3*t*t)*y1 + (t*t*t-t*t)*h*tangent(i+1);
}

const stoneTimes = [.015,.04,.12,.18,.22,.25,.30,.312,.345,.385];
const compassTimes = [.385,.43,.48,.50,.525,.555,.58,.63];
const wrenchTimes = [.63,.70,.75,.78,.80,.82,.835,.855,.88,.90];
const curve = (times, values) => times.map((at, i) => [at, values[i]]);
const fingers = (times, values) => values.map(joints => joints.map(v => curve(times, v)));

export const pregraspCorridors = [
  {
    name:'stone', start:.015, end:.385, lag:[-.007,0,.008,.016,.023],
    // Thumb then index/middle make room; the ulnar fingers retain a soft cup.
    flex:fingers(stoneTimes,[
      [[0,.025,.035,.04,.05,.06,.065,.07,.05,0],[0,.025,.03,.04,.05,.055,.07,.075,.05,0],[0,.025,.035,.04,.045,.05,.065,.07,.045,0]],
      [[0,.12,.14,.16,.28,.34,.20,.19,.10,0],[0,.17,.18,.13,.18,.20,.13,.14,.09,0],[0,.09,.10,.09,.11,.12,.08,.09,.055,0]],
      [[0,.015,.025,.04,.14,.20,.10,.10,.06,0],[0,.02,.035,.04,.13,.18,.085,.09,.06,0],[0,.015,.02,.035,.08,.11,.06,.065,.04,0]],
      [[0,0,.015,.025,.12,.16,.085,.08,.04,0],[0,.015,.025,.035,.16,.22,.11,.10,.055,0],[0,.01,.02,.025,.09,.13,.08,.075,.04,0]],
      [[0,0,.01,.02,.085,.12,.075,.065,.035,0],[0,.01,.02,.03,.13,.18,.095,.09,.05,0],[0,.01,.015,.025,.075,.115,.07,.065,.035,0]],
    ]),
    opposition:curve(stoneTimes,[0,.02,.025,.03,.05,.065,.075,.06,.025,0]),
    wrist:curve(stoneTimes,[0,0,.002,.007,.012,.014,.008,.004,-.012,0]),
  },
  {
    name:'compass',start:.385,end:.63,lag:[-.009,0,.008,.015,.020],
    // An open precision grasp, never a pinch closing on the compass tips.
    flex:fingers(compassTimes,[
      [[0,.025,.035,.04,.045,.06,.04,0],[0,.02,.035,.04,.045,.055,.035,0],[0,.015,.02,.025,.03,.04,.025,0]],
      [[0,.02,.03,.03,.045,.08,.055,0],[0,.015,.025,.025,.05,.085,.055,0],[0,.02,.035,.04,.05,.065,.04,0]],
      [[0,-.025,-.07,-.08,-.035,.035,.025,0],[0,-.025,-.055,-.065,-.025,.035,.025,0],[0,0,.01,.015,.025,.035,.025,0]],
      [[0,-.015,-.045,-.06,-.025,.025,.02,0],[0,-.01,-.025,-.035,-.01,.025,.02,0],[0,.005,.01,.02,.025,.035,.025,0]],
      [[0,-.015,-.04,-.055,-.025,.02,.015,0],[0,-.01,-.025,-.035,-.015,.02,.015,0],[0,.005,.01,.02,.025,.03,.02,0]],
    ]),
    opposition:curve(compassTimes,[0,.02,.04,.05,.035,.025,.02,0]),
    wrist:curve(compassTimes,[0,.008,.010,.006,0,-.008,-.004,0]),
  },
  {
    name:'wrench',start:.63,end:.90,lag:[-.007,0,.006,.011,.016],
    // Make a broad C rather than flattening the hand or making a fist.
    flex:fingers(wrenchTimes,[
      [[0,.01,.02,.025,.035,.04,.045,.025,.005,0],[0,.01,.025,.035,.045,.05,.05,.035,.005,0],[0,.005,.015,.025,.035,.04,.04,.025,.005,0]],
      [[0,.01,.04,.065,.08,.085,.09,.065,.01,0],[0,-.005,-.025,-.045,-.055,-.06,-.04,-.01,0,0],[0,.005,.015,.025,.03,.035,.04,.03,.005,0]],
      [[0,-.01,-.025,-.045,-.055,-.06,-.03,.025,.01,0],[0,-.04,-.085,-.11,-.12,-.12,-.05,.03,.01,0],[0,-.015,-.035,-.045,-.045,-.04,.015,.03,.01,0]],
      [[0,-.005,-.02,-.035,-.045,-.05,-.025,.02,.01,0],[0,-.025,-.07,-.10,-.115,-.12,-.045,.025,.01,0],[0,-.01,-.025,-.035,-.035,-.03,.015,.025,.01,0]],
      [[0,0,-.01,-.02,-.03,-.035,-.015,.015,.005,0],[0,-.015,-.03,-.045,-.055,-.065,-.03,.015,.005,0],[0,-.005,-.015,-.02,-.025,-.025,.01,.02,.005,0]],
    ]),
    opposition:curve(wrenchTimes,[0,.01,.015,.0225,.0275,.0325,.0325,.025,.005,0]),
    wrist:curve(wrenchTimes,[0,.003,.007,.006,0,-.006,-.008,-.003,0,0]),
  },
];

// Lag is bounded inside the corridor; all joints meet the same exact locks.
function phase(value, corridor, delay) {
  const t = (value-corridor.start)/(corridor.end-corridor.start);
  return value-delay*4*t*(1-t);
}

// The compass has its own absolute joint excursion. A scalar correction of
// the old track would inherit its reaction/closure at570. These local targets
// instead extend from the accepted440 articulation, then rejoin at630.
export const compassExtension = {
  blendStart:.43,start:.44,peak:.58,end:.63,
  // Keep the MCP arc contained: PIP/DIP unfurl without sending the long
  // middle finger into the compass arc under the extreme camera orbit.
  flex:[[-.012,-.055,-.045],[-.03,-.24,-.095],[.06,-.30,-.085],[0,-.38,-.20],[-.10,-.43,-.20]],
  opposition:.02,
  middleKnuckle:curve([.44,.465,.48,.515,.525,.54,.56,.63],[0,.18,.22,.22,.19,.10,0,0]),
};

export function createHumanPregrasp(hand,thumbReference,jointQuaternion) {
  const roles=['thumb','index','middle','ring','pinky'],q=new THREE.Quaternion();
  const entries=roles.flatMap((role,finger)=>[1,2,3].map(joint=>{
    const name=THREE.PropertyBinding.sanitizeNodeName(`DEF-${role==='thumb'?'thumb':`f_${role}`}.${String(joint).padStart(2,'0')}.L`);
    return {bone:hand.scene.getObjectByName(name),axis:new THREE.Vector3(...hand.metadata.bones[name].flexionAxisLocal),finger,joint};
  }));
  const thumb=entries[0],oppositionAxis=new THREE.Vector3(...hand.metadata.bones[thumb.bone.name].abductionAxisLocal);
  // Hold the accepted CMC at 250 in bone-local coordinates. Repeated curl /
  // opposition settings must not acquire a new CMC rotation as the arm turns.
  // Its long axis comes from the complete imported bind, including ancestors.
  const thumbRest=hand.metadata.bones[thumb.bone.name],thumbId=hand.skin.skeleton.bones.indexOf(thumb.bone);
  const bindQ=new THREE.Quaternion();
  hand.skin.skeleton.boneInverses[thumbId].clone().invert().decompose(new THREE.Vector3(),bindQ,new THREE.Vector3());
  const longAxis=new THREE.Vector3(...thumbRest.tail).sub(new THREE.Vector3(...thumbRest.head)).normalize().applyQuaternion(bindQ.invert());
  const thumbCurl=value=>{
    const t=THREE.MathUtils.smoothstep(value,.08,.9),r=new THREE.Quaternion();
    return r.multiply(q.setFromAxisAngle(oppositionAxis,-.15+t*.5))
      .multiply(q.setFromAxisAngle(thumb.axis,t*.12))
      .multiply(q.setFromAxisAngle(longAxis,-t*1.15));
  };
  const referenceCurlInverse=thumbCurl(.08).invert();
  const localThumbFrames=humanFrames.map(f=>({at:f.at,q:thumbReference.clone()
    .multiply(referenceCurlInverse).multiply(thumbCurl(f.curls[0]))
    .multiply(q.setFromAxisAngle(oppositionAxis,(f.opposition??0)+.48))}));
  const localThumbAt=value=>{
    let i=localThumbFrames.findIndex((f,i)=>i<localThumbFrames.length-1&&value<localThumbFrames[i+1].at);
    if(i<0)i=localThumbFrames.length-2;
    const a=localThumbFrames[i],b=localThumbFrames[i+1];
    return a.q.clone().slerp(b.q,smooth(a.at,b.at,value));
  };
  const wrist=hand.scene.getObjectByName('DEF-handL');
  // MCP heads do not move with finger flexion. Their transverse line defines
  // an anatomical wrist axis without depending on the world camera or mirror.
  hand.root.updateMatrixWorld(true);
  const mcp=finger=>wrist.worldToLocal(entries.find(e=>e.finger===finger&&e.joint===1).bone.getWorldPosition(new THREE.Vector3()));
  const wristAxis=mcp(1).sub(mcp(4)).normalize();
  const compass=pregraspCorridors.find(c=>c.name==='compass');
  function publishedJoint(value,{bone,axis,finger,joint}){
    const result=jointQuaternion(value,bone.name);
    const delay=compass.lag[finger]+(joint-1)*.0025;
    result.multiply(q.setFromAxisAngle(axis,sampleGestureCurve(compass.flex[finger][joint-1],phase(value,compass,delay))));
    if(finger===0&&joint===1)result.multiply(q.setFromAxisAngle(oppositionAxis,sampleGestureCurve(compass.opposition,phase(value,compass,compass.lag[0]))));
    return result;
  }
  const compassAnchors=entries.map(entry=>publishedJoint(compassExtension.start,entry));
  let last={active:false};
  return {apply(ratio){
    const c=pregraspCorridors.find(c=>ratio>c.start&&ratio<c.end);
    if(!c){last={active:false};return}
    const cmcWeight=c.name==='stone'?smooth(.18,.235,ratio)*(1-smooth(.312,c.end,ratio)):0;
    if(cmcWeight)thumb.bone.quaternion.slerp(localThumbAt(ratio),cmcWeight);
    const angles={};
    for(const {bone,axis,finger,joint}of entries){
      const delay=c.lag[finger]+(joint-1)*.0025;
      const angle=sampleGestureCurve(c.flex[finger][joint-1],phase(ratio,c,delay));
      bone.quaternion.multiply(q.setFromAxisAngle(axis,angle));angles[bone.name]=angle;
    }
    const opposition=sampleGestureCurve(c.opposition,phase(ratio,c,c.lag[0]));
    thumb.bone.quaternion.multiply(q.setFromAxisAngle(oppositionAxis,opposition));
    const wristAngle=sampleGestureCurve(c.wrist,phase(ratio,c,-.010));
    wrist.quaternion.multiply(q.setFromAxisAngle(wristAxis,wristAngle));
    let extension=null;
    if(c.name==='compass'&&ratio>compassExtension.blendStart){
      const amount=smooth(compassExtension.start,compassExtension.peak,ratio);
      const weight=smooth(compassExtension.blendStart,compassExtension.start,ratio)*(1-smooth(compassExtension.peak,compassExtension.end,ratio));
      const flex={};
      entries.forEach((entry,i)=>{
        const {bone,axis,finger,joint}=entry;
        // Small joint-specific timing differences still reach the same end.
        const timing=amount+Math.sin(Math.PI*amount)*([.025,.015,0,-.025,-.04][finger]-(joint-1)*.015);
        // The middle MCP retains a small cup while its PIP/DIP unfold. The
        // cup releases as the compass leaves; it never closes the distal arc.
        const angle=compassExtension.flex[finger][joint-1]*timing+(finger===2&&joint===1?sampleGestureCurve(compassExtension.middleKnuckle,ratio):0);
        const target=compassAnchors[i].clone().multiply(q.setFromAxisAngle(axis,angle));
        if(finger===0&&joint===1)target.multiply(q.setFromAxisAngle(oppositionAxis,compassExtension.opposition*amount));
        // Retain the existing tiny idle articulation around the authored pose.
        const idle=publishedJoint(ratio,entry).invert().multiply(bone.quaternion);
        bone.quaternion.slerp(target.multiply(idle),weight);flex[bone.name]=angle;
      });
      extension={amount,weight,flex};
    }
    hand.root.updateMatrixWorld(true);
    last={active:true,corridor:c.name,angles,opposition,wrist:wristAngle,cmcWeight,extension,thumbAxes:{opposition:oppositionAxis.toArray(),long:longAxis.toArray(),flexion:thumb.axis.toArray()}};
  },getState:()=>last};
}
