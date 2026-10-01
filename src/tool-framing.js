import * as THREE from 'three';

// On-demand diagnostic of the GLB's projected silhouette, including cropped
// geometry outside the viewport. Union rasterisation avoids counting empty
// bounding-box space and overlapping front/back triangles twice.
export function measureToolFraming(spec,camera,width,height,resolution=384,probePoints={}){
 const toScreen=p=>{const v=p.clone().applyMatrix4(spec.group.matrixWorld).project(camera);return[(v.x+1)*width/2,(1-v.y)*height/2]};
 const points=spec.points.map(toScreen),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),step=Math.max(right-left,bottom-top)/resolution;
 const cols=Math.ceil((right-left)/step)+1,rows=Math.ceil((bottom-top)/step)+1,mask=new Uint8Array(cols*rows),edge=(a,b,x,y)=>(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
 for(const tri of spec.triangles){const [a,b,c]=tri.map(toScreen).map(p=>[(p[0]-left)/step,(p[1]-top)/step]),orientation=edge(a,b,c[0],c[1]);if(Math.abs(orientation)<1e-8)continue;
  const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(cols-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(rows-1,Math.ceil(Math.max(a[1],b[1],c[1]))),sign=Math.sign(orientation);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const i=y*cols+x;if(mask[i])continue;if(sign*edge(a,b,x+.5,y+.5)>=0&&sign*edge(b,c,x+.5,y+.5)>=0&&sign*edge(c,a,x+.5,y+.5)>=0)mask[i]=1}
 }
 const screenClearance=Object.fromEntries(Object.keys(probePoints).map(role=>[role,{distancePixels:Infinity,insideToolSilhouette:false}]));let total=0,visible=0;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(mask[y*cols+x]){total++;const px=left+(x+.5)*step,py=top+(y+.5)*step;if(px>=0&&px<=width&&py>=0&&py<=height){visible++;for(const [role,point]of Object.entries(probePoints)){const distance=Math.hypot(point[0]-px,point[1]-py);screenClearance[role].distancePixels=Math.min(screenClearance[role].distancePixels,distance);if(distance<step*.75)screenClearance[role].insideToolSilhouette=true}}}
 const axis=[new THREE.Vector3(0,-.5,0),new THREE.Vector3(0,.5,0)].map(toScreen),delta=axis[1].map((v,i)=>v-axis[0][i]);let first=0,last=1;
 for(let i=0;i<2;i++){const max=i===0?width:height;if(Math.abs(delta[i])<1e-8){if(axis[0][i]<0||axis[0][i]>max)last=-1}else{const a=-axis[0][i]/delta[i],b=(max-axis[0][i])/delta[i];first=Math.max(first,Math.min(a,b));last=Math.min(last,Math.max(a,b))}}
 const grip=new THREE.Vector3(0,.15,.06).applyMatrix4(spec.group.matrixWorld),head=new THREE.Vector3(-.03,.30,.04).applyMatrix4(spec.group.matrixWorld);
 return {screenClearance,silhouetteVisibleFraction:total?visible/total:0,axisVisibleFraction:Math.max(0,last-first),silhouetteMethod:'Union of all projected GLB triangles;384 samples over longest bounding dimension;opacity-independent',bounds:{left,right,top,bottom},axisScreen:axis,gripWorld:grip.toArray(),gripScreen:(()=>{const v=grip.clone().project(camera);return[(v.x+1)*width/2,(1-v.y)*height/2]})(),headWorld:head.toArray(),scale:spec.group.scale.toArray(),cameraDepth:camera.position.distanceTo(spec.group.position)};
}
