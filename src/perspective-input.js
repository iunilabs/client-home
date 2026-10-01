const clamp=value=>Math.max(-2.8,Math.min(2.8,value));
const angleDelta=(value,origin)=>(value-origin+540)%360-180;
function tilt(value){return Math.abs(value)<=.5?0:clamp((value-Math.sign(value)*.5)/6)}

// Listening never requests permission. Browsers that withhold sensor data
// simply leave the existing mouse interaction available.
export function createPerspectiveInput(win,{onChange,isReduced=()=>false}){
 const doc=win.document,orientation=win.screen?.orientation,listeners=[];
 let origin=null,source='none',pointer={x:0,y:0},disposed=false;
 function listen(target,type,handler){if(!target?.addEventListener)return;target.addEventListener(type,handler,{passive:true});listeners.push(()=>target.removeEventListener(type,handler))}
 function update(x,y,nextSource){pointer={x,y};source=nextSource;onChange({...pointer})}
 function reset(){origin=null;update(0,0,'none')}
 function mouse(event){
  if(disposed||doc.hidden||isReduced()||event.pointerType==='touch'||event.sourceCapabilities?.firesTouchEvents)return;
  if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return;
  update(Math.max(-1,Math.min(1,event.clientX/win.innerWidth*2-1)),Math.max(-1,Math.min(1,1-event.clientY/win.innerHeight*2)),'mouse');
 }
 function sensor(event){
  if(disposed||doc.hidden||isReduced()||!Number.isFinite(event.beta)||!Number.isFinite(event.gamma))return;
  const angle=orientation?.angle??win.orientation??0;
  if(!origin||origin.angle!==angle){origin={beta:event.beta,gamma:event.gamma,angle};update(0,0,'orientation');return}
  const x=tilt(angleDelta(event.gamma,origin.gamma)),y=-tilt(angleDelta(event.beta,origin.beta)),radians=angle*Math.PI/180;
  update(clamp(x*Math.cos(radians)-y*Math.sin(radians)),clamp(x*Math.sin(radians)+y*Math.cos(radians)),'orientation');
 }
 listen(win,'PointerEvent' in win?'pointermove':'mousemove',mouse);
 listen(win,'pointerout',event=>{if(event.pointerType!=='touch'&&source==='mouse'&&!event.relatedTarget)reset()});
 listen(win,'blur',reset);listen(doc,'visibilitychange',reset);
 listen(win,'orientationchange',reset);listen(orientation,'change',reset);
 const sensorAvailable=win.isSecureContext&&'DeviceOrientationEvent' in win&&
  (win.navigator?.maxTouchPoints>0||win.matchMedia?.('(any-pointer: coarse)').matches);
 if(sensorAvailable)listen(win,'deviceorientation',sensor);
 return {reset,getResponseRate:()=>source==='orientation'?16:5,getState:()=>({source,listeningForOrientation:Boolean(sensorAvailable),pointer:{...pointer}}),dispose(){disposed=true;listeners.forEach(remove=>remove());reset()}};
}
