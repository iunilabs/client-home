// Remove the published files' white margins, retaining the artwork and proportions.
export function cleanClientImage(image){
 image.addEventListener('load',()=>{
  const scale=Math.min(1,800/image.naturalWidth,400/image.naturalHeight);
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(image.naturalWidth*scale);canvas.height=Math.ceil(image.naturalHeight*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
  let left=canvas.width,right=0,top=canvas.height,bottom=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
   const n=(y*canvas.width+x)*4,white=Math.min(d[n],d[n+1],d[n+2]);
   if(white>235)d[n+3]=Math.round(d[n+3]*(255-white)/20);
   if(d[n+3]>60){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
  }
  if(right<=left||bottom<=top)return;
  ctx.putImageData(pixels,0,0);
  const cut=document.createElement('canvas');cut.width=right-left+1;cut.height=bottom-top+1;
  cut.getContext('2d').drawImage(canvas,left,top,cut.width,cut.height,0,0,cut.width,cut.height);
  image.src=cut.toDataURL('image/png');
 },{once:true});
}
