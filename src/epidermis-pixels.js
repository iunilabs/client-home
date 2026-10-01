// Deterministic original pore field; generated offline for the website.
export function generateEpidermisPixels(){
  const size=1024,cells=24,height=new Float32Array(size*size),pixels=new Uint8Array(size*size*4);
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7+19.31)*43758.5453;return n-Math.floor(n)};
  // A physical 16 mm tile: irregular pores, their raised rims, and shallow
  // intersecting epidermal furrows. The photographic colour remains separate.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*cells,v=y/size*cells,cx=Math.floor(u),cy=Math.floor(v);
    let value=.56,nearest=Infinity,second=Infinity,cellTone=0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const px=cx+i,py=cy+j,wx=(px+cells)%cells,wy=(py+cells)%cells;
      const dx=u-(px+.18+hash(wx,wy)*.64),dy=v-(py+.18+hash(wx+71,wy+31)*.64);
      const distance=dx*dx+dy*dy;
      if(distance<nearest){second=nearest;nearest=distance;cellTone=hash(wx+211,wy+91)}else if(distance<second)second=distance;
      const radius=.09+hash(wx+17,wy+81)*.055,r=Math.hypot(dx,dy*.83)/radius;
      value-=Math.exp(-r*r*1.8)*(.16+hash(wx+29,wy)*.17);
      value+=Math.exp(-((r-1.4)**2)*5)*.022;
    }
    // Irregular polygonal plateaus, separated by shallow epidermal grooves.
    // Periodic signals keep the physical tile continuous at its edges.
    value-=Math.exp(-Math.max(0,Math.sqrt(second)-Math.sqrt(nearest))*12)*.1;
    value+=(cellTone-.5)*.07;
    const phase=Math.PI*2/cells,waviness=Math.sin(v*phase*8+Math.sin(u*phase*4)*1.1);
    const furrows=Math.pow(.5+.5*Math.sin(u*phase*50+waviness),24)+Math.pow(.5+.5*Math.sin(v*phase*57+Math.sin(u*phase*6)),28);
    value-=furrows*.018;
    height[y*size+x]=value;
  }
  for(let i=0;i<height.length;i++){
    pixels[i*4]=Math.round(Math.min(1,Math.max(0,height[i]))*255);
    pixels[i*4+1]=Math.round((.45+(height[i]-.5)*.35)*255);
    pixels[i*4+2]=0;pixels[i*4+3]=255;
  }
  return pixels;
}
