// Retain geometry and materials on slower GPUs, adjusting the pixel budget.
// Reduced-motion intervals and long background-tab gaps are not GPU samples.
export function createRenderBudget(renderer, pixelRatio, {initialScale=1,minScale=.65,maxScale=1}={}) {
  let scale=initialScale,previous=null,slow=0,fast=0;
  function resize(){renderer.setPixelRatio(pixelRatio()*scale)}
  return {
    resize,
    get scale(){return scale},
    update(time,reduced=false){
      if(reduced||time<=0){previous=null;return}
      const interval=previous===null?0:time-previous;previous=time;
      if(interval<=0||interval>.7)return;
      if(interval>.045){slow++;fast=0}else if(interval<.025){fast++;slow=0}else{slow=0;fast=0}
      if(slow>=6&&scale>minScale){scale=Math.max(minScale,scale*.85);slow=0;resize()}
      if(fast>=180&&scale<maxScale){scale=Math.min(maxScale,scale/.85);fast=0;resize()}
    },
  };
}
