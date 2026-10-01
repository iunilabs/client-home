import * as THREE from 'three';

// Clip the footprint against actual dorsal skin triangles. No guessed height
// or rectangular fallback can leave a floating corner on the thumb.
export function addFittedNails(skin,beds,{artificial=false}={}){
 const g=skin.geometry,{position,normal,skinIndex,skinWeight}=g.attributes;
 // Reject unrelated faces before creating vectors or influence maps. Only a
 // small part of the source mesh belongs to the five distal phalanges.
 const distalBones=new Set(beds.map(bed=>skin.skeleton.bones.indexOf(bed.bone))),faces=new Map([...distalBones].map(id=>[id,[]]));
 for(let i=0;i<g.index.count;i+=3){const owners=new Set();for(let j=0;j<3;j++){const id=g.index.array[i+j];for(let k=0;k<4;k++){const bone=skinIndex.array[id*4+k];if(skinWeight.array[id*4+k]>.25&&distalBones.has(bone))owners.add(bone)}}for(const id of owners)faces.get(id).push(i)}
 const material=new THREE.MeshPhysicalMaterial({color:'#ffffff',vertexColors:true,roughness:artificial?.23:.33,ior:1.46,specularIntensity:.45,clearcoat:artificial?.5:.16,clearcoatRoughness:.35,envMapIntensity:.55,transparent:true,opacity:artificial?1:.86,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 material.onBeforeCompile=function(shader){
  shader.vertexShader='attribute float nailCoverage;\nattribute vec2 nailUV;\nvarying float vNailCoverage;\nvarying vec2 vNailUV;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvNailCoverage=nailCoverage; vNailUV=nailUV;');
  shader.fragmentShader='varying float vNailCoverage;\nvarying vec2 vNailUV;\n'+shader.fragmentShader;
  if(!artificial){
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    // Keratin follows the finger axis. Screen-space filtering removes it when
    // the plate is only a few pixels wide instead of letting the ridges shimmer.
    float ridgeFilter=1.0-smoothstep(.45,1.8,fwidth(vNailUV.y)*110.0);
    float keratin=sin(vNailUV.y*110.0+sin(vNailUV.x*3.0)*.35)*ridgeFilter;
    float distalCurve=pow(max(0.0,1.0-pow(abs(vNailUV.y),3.2)),1.0/3.2);
    float freeEdge=smoothstep(.015,.085,vNailUV.x-distalCurve+.12)*smoothstep(.48,.72,vNailUV.x);
    float lunula=(1.0-smoothstep(.15,.25,length(vec2((vNailUV.x+.91)*.72,vNailUV.y*.4))))*.10;
    diffuseColor.rgb*=1.0+keratin*.005;
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.66,.59,.47),freeEdge*.50);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.69,.58,.51),lunula);
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+keratin*.018,.25,.44);');
  }
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','float nailRadius=pow(pow(abs(vNailUV.x),3.2)+pow(abs(vNailUV.y),3.2),1.0/3.2);\ndiffuseColor.a*=vNailCoverage*smoothstep(0.0,mix(.10,.045,smoothstep(-.9,-.35,vNailUV.x)),1.0-nailRadius);\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=> 'puntoes-surface-nails-v6-'+artificial;
 const nails=[];
 for(const bed of beds){
  const thumb=bed.bone.name.startsWith('DEF-thumb'),boneId=skin.skeleton.bones.indexOf(bed.bone),halfLength=bed.length*(thumb?.43:.46),halfWidth=bed.width*(thumb?.42:.46),outline=[];
  let footprintScale=1,continuous=false,clearanceCorrection=0;
  const widthAt=u=>THREE.MathUtils.lerp(thumb?.90:.88,1,THREE.MathUtils.smoothstep(u/halfLength,-1,.7));
  // Rounded corners and a slightly narrower cuticle than free edge.
  for(let i=0;i<48;i++){const t=i/48*Math.PI*2,s=Math.sin(t),c=Math.cos(t),u=Math.sign(s)*Math.pow(Math.abs(s),.625)*halfLength,v=Math.sign(c)*Math.pow(Math.abs(c),.625)*halfWidth;outline.push({u,v:v*widthAt(u)})}
  const area=outline.reduce((sum,a,i)=>{const b=outline[(i+1)%outline.length];return sum+a.u*b.v-a.v*b.u},0),sign=Math.sign(area);
  const vertexCache=new Map();
  function original(id){
   if(vertexCache.has(id))return vertexCache.get(id);
   const p=new THREE.Vector3().fromBufferAttribute(position,id),d=p.clone().sub(bed.center),weights=new Map();
   for(let j=0;j<4;j++){const weight=skinWeight.array[id*4+j];if(weight)weights.set(skinIndex.array[id*4+j],weight)}
   const value={p,n:new THREE.Vector3().fromBufferAttribute(normal,id),u:d.dot(bed.direction),v:d.dot(bed.side),weights};vertexCache.set(id,value);return value;
  }
  function interpolate(a,b,t){const weights=new Map();for(const[id,w]of a.weights)weights.set(id,w*(1-t));for(const[id,w]of b.weights)weights.set(id,(weights.get(id)??0)+w*t);return{p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),u:THREE.MathUtils.lerp(a.u,b.u,t),v:THREE.MathUtils.lerp(a.v,b.v,t),weights}}
  function clip(polygon,a,b){
   const distance=p=>sign*((b.u-a.u)*(p.v-a.v)-(b.v-a.v)*(p.u-a.u)),result=[];
   for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],dp=distance(p),dq=distance(q),inside=dp>=-1e-12,nextInside=dq>=-1e-12;if(inside)result.push(p);if(inside!==nextInside)result.push(interpolate(p,q,dp/(dp-dq)))}
   return result;
  }
  const positions=[],normals=[],indices=[],weights=[],colours=[],coverage=[],coordinates=[],triangles=[],surfaceTriangles=[];
  function plateHeight(u,v){const edge=THREE.MathUtils.clamp(1-Math.pow(Math.pow(Math.abs(u),3.2)+Math.pow(Math.abs(v),3.2),1/3.2),0,1);return .000035+(thumb?.00016:.00012)*THREE.MathUtils.smoothstep(edge,0,.35)+.000035*Math.max(0,1-v*v)*THREE.MathUtils.smoothstep(edge,0,.40)}
  function vertex(p){
   const u=p.u/(halfLength*footprintScale),v=p.v/(halfWidth*footprintScale*widthAt(p.u)),radial=Math.pow(Math.pow(Math.abs(u),3.2)+Math.pow(Math.abs(v),3.2),1/3.2),edge=THREE.MathUtils.clamp(1-radial,0,1);
   const alpha=1,height=plateHeight(u,v),plateNormal=p.n.clone();
   if(!artificial){const step=.002,du=(plateHeight(u+step,v)-plateHeight(u-step,v))/(2*step*halfLength*footprintScale),dv=(plateHeight(u,v+step)-plateHeight(u,v-step))/(2*step*halfWidth*footprintScale*widthAt(p.u));plateNormal.addScaledVector(bed.direction,-du).addScaledVector(bed.side,-dv).normalize()}
   positions.push(...p.p.clone().addScaledVector(p.n,height).toArray());normals.push(...plateNormal.toArray());coverage.push(alpha);coordinates.push(u,v);
   const colour=new THREE.Color(artificial?'#f2eee4':thumb?'#c68d80':'#cc9c8d');
   if(!artificial)colour.lerp(new THREE.Color('#b7796e'),(1-THREE.MathUtils.smoothstep(u,-.9,.1))*(thumb?.13:.09));
   colours.push(...colour.toArray());const influences=[...p.weights].sort((a,b)=>b[1]-a[1]).slice(0,4),total=influences.reduce((sum,[,w])=>sum+w,0);
   for(let j=0;j<4;j++){indices.push(influences[j]?.[0]??0);weights.push((influences[j]?.[1]??0)/total)}
   return positions.length/3-1;
  }
  for(const i of faces.get(boneId)){
   let polygon=[original(g.index.array[i]),original(g.index.array[i+1]),original(g.index.array[i+2])];
   if(!polygon.some(p=>(p.weights.get(boneId)??0)>.25)||polygon.reduce((sum,p)=>sum+p.p.clone().sub(bed.center).dot(bed.dorsal),0)<=0)continue;
   if(polygon.every(p=>p.u>halfLength)||polygon.every(p=>p.u<-halfLength)||polygon.every(p=>p.v>halfWidth)||polygon.every(p=>p.v<-halfWidth))continue;
   surfaceTriangles.push(polygon);
   for(let j=0;j<outline.length&&polygon.length;j++)polygon=clip(polygon,outline[j],outline[(j+1)%outline.length]);
   if(polygon.length<3)continue;
   // A centroid provides an interior sample even on the coarse model.
   const center={p:new THREE.Vector3(),n:new THREE.Vector3(),u:0,v:0,weights:new Map()};
   for(const p of polygon){center.p.addScaledVector(p.p,1/polygon.length);center.n.addScaledVector(p.n,1/polygon.length);center.u+=p.u/polygon.length;center.v+=p.v/polygon.length;for(const[id,w]of p.weights)center.weights.set(id,(center.weights.get(id)??0)+w/polygon.length)}center.n.normalize();
   const c=vertex(center),ring=polygon.map(vertex);for(let j=0;j<ring.length;j++)triangles.push(c,ring[j],ring[(j+1)%ring.length]);
  }
  {
   // A continuous radial patch follows the dorsal skin but has its own smooth
   // outline. Clipping separate source faces exposes their stepped perimeter
   // on the flexed thumb, even when every vertex is close to its nail bed.
   function project(u,v){
    let best=null,height=-Infinity;
    for(const[a,b,c]of surfaceTriangles){
     const det=(b.v-c.v)*(a.u-c.u)+(c.u-b.u)*(a.v-c.v);if(Math.abs(det)<1e-12)continue;
     const wa=((b.v-c.v)*(u-c.u)+(c.u-b.u)*(v-c.v))/det,wb=((c.v-a.v)*(u-c.u)+(a.u-c.u)*(v-c.v))/det,wc=1-wa-wb;
     if(Math.min(wa,wb,wc)<-1e-7)continue;
     const p=new THREE.Vector3(),n=new THREE.Vector3(),weights=new Map();
     for(const[value,w]of [[a,wa],[b,wb],[c,wc]]){p.addScaledVector(value.p,w);n.addScaledVector(value.n,w);for(const[id,weight]of value.weights)weights.set(id,(weights.get(id)??0)+weight*w)}
     const h=p.clone().sub(bed.center).dot(bed.dorsal);if(h>height){height=h;best={p,n:n.normalize(),u,v,weights}}
    }
    return best;
   }
   const rings=thumb?7:5,sides=thumb?48:40;let samples=null,total=0,shiftU=0,shiftV=0;
   // Keep the fitted footprint's centre independent of its visible edge fade.
   for(let i=0;i<coverage.length;i++){const u=coordinates[i*2],v=coordinates[i*2+1],edge=1-Math.pow(Math.pow(Math.abs(u),3.2)+Math.pow(Math.abs(v),3.2),1/3.2),w=THREE.MathUtils.smoothstep(edge,0,.075);total+=w;shiftU+=u*halfLength*w;shiftV+=v*halfWidth*w}
   shiftU=thumb?shiftU/Math.max(total,1):0;shiftV=thumb?shiftV/Math.max(total,1):0;
   function shifted(u,v){const p=project(u+shiftU,v+shiftV);if(p){p.u=u;p.v=v}return p}
   for(const shrink of [1,.96,.92,.88,.84,.80,.75,.70,.65,.60]){
    const candidate=[shifted(0,0)],perimeter=[];let fits=Boolean(candidate[0]);
    // Test the edge first: rejected scales need no interior projection work.
    for(let i=0;i<sides&&fits;i++){const t=i/sides*Math.PI*2,u=Math.sign(Math.sin(t))*Math.pow(Math.abs(Math.sin(t)),.625)*halfLength*shrink,v=Math.sign(Math.cos(t))*Math.pow(Math.abs(Math.cos(t)),.625)*halfWidth*shrink,p=shifted(u,v*widthAt(u));fits=Boolean(p);perimeter.push(p)}
    if(!fits)continue;
    for(let ring=1;ring<rings;ring++)for(let i=0;i<sides;i++){const t=i/sides*Math.PI*2,u=Math.sign(Math.sin(t))*Math.pow(Math.abs(Math.sin(t)),.625)*halfLength*ring/rings*shrink,v=Math.sign(Math.cos(t))*Math.pow(Math.abs(Math.cos(t)),.625)*halfWidth*ring/rings*shrink;candidate.push(shifted(u,v*widthAt(u)))}
    candidate.push(...perimeter);
    if(candidate.every(Boolean)){samples=candidate;footprintScale=shrink;break;}
   }
   if(samples){
    continuous=true;
    for(const list of [positions,normals,indices,weights,colours,coverage,coordinates,triangles])list.length=0;
    samples.forEach(vertex);
    const add=(a,b,c)=>{const pa=new THREE.Vector3().fromArray(positions,a*3),pb=new THREE.Vector3().fromArray(positions,b*3),pc=new THREE.Vector3().fromArray(positions,c*3),n=pb.sub(pa).cross(pc.sub(pa));if(n.dot(bed.dorsal)>0)triangles.push(a,b,c);else triangles.push(a,c,b)};
    for(let i=0;i<sides;i++)add(0,1+i,1+(i+1)%sides);
    for(let ring=1;ring<rings;ring++)for(let i=0;i<sides;i++){const a=1+(ring-1)*sides+i,b=1+(ring-1)*sides+(i+1)%sides,c=1+ring*sides+i,d=1+ring*sides+(i+1)%sides;add(a,c,d);add(a,d,b)}
    // A radial triangle can cross a ridge between two source skin faces even
    // when all three corners are above skin. Sample its interior and shared
    // edges, then lift its corners only by the missing microscopic clearance.
    const barycentrics=[[1/3,1/3,1/3],[.5,.5,0],[0,.5,.5],[.5,0,.5]],point=new THREE.Vector3(),delta=new THREE.Vector3();
    const planes=surfaceTriangles.map(([a,b,c])=>({a,b,c,det:(b.v-c.v)*(a.u-c.u)+(c.u-b.u)*(a.v-c.v),heights:[a,b,c].map(p=>p.p.clone().sub(bed.center).dot(bed.dorsal))})).filter(p=>Math.abs(p.det)>1e-12);
    function surfaceHeight(u,v){let height=-Infinity;for(const{a,b,c,det,heights}of planes){const wa=((b.v-c.v)*(u-c.u)+(c.u-b.u)*(v-c.v))/det,wb=((c.v-a.v)*(u-c.u)+(a.u-c.u)*(v-c.v))/det,wc=1-wa-wb;if(Math.min(wa,wb,wc)>=-1e-7)height=Math.max(height,wa*heights[0]+wb*heights[1]+wc*heights[2])}return height}

    for(let pass=0;pass<2;pass++){
     const lifts=new Float32Array(positions.length/3);
     for(let i=0;i<triangles.length;i+=3){const ids=triangles.slice(i,i+3);let lift=0;
      for(const bary of barycentrics){point.set(0,0,0);for(let j=0;j<3;j++)point.addScaledVector(delta.fromArray(positions,ids[j]*3),bary[j]);delta.copy(point).sub(bed.center);const height=surfaceHeight(delta.dot(bed.direction),delta.dot(bed.side));lift=Math.max(lift,height-delta.dot(bed.dorsal)+.000045)}
      if(lift>0)for(const id of ids)lifts[id]=Math.max(lifts[id],lift);
     }
     for(let i=0;i<lifts.length;i++)if(lifts[i]>0){delta.fromArray(positions,i*3).addScaledVector(bed.dorsal,lifts[i]).toArray(positions,i*3);clearanceCorrection=Math.max(clearanceCorrection,lifts[i])}
    }

   }
  }
  // Fade every actual perimeter, including a curved fingertip's clipped
  // surface boundary. This avoids exposing the outline of a source triangle.
  if(!continuous){
  const edgeMap=new Map(),key=id=>positions.slice(id*3,id*3+3).map(v=>v.toFixed(7)).join(',');
  for(let i=0;i<triangles.length;i+=3)for(let j=0;j<3;j++){const a=triangles[i+j],b=triangles[i+(j+1)%3],pair=[key(a),key(b)].sort().join('|'),edge=edgeMap.get(pair);if(edge)edge.count++;else edgeMap.set(pair,{a,b,count:1})}
  const boundary=[...edgeMap.values()].filter(edge=>edge.count===1).map(({a,b})=>new THREE.Line3(new THREE.Vector3(...positions.slice(a*3,a*3+3)),new THREE.Vector3(...positions.slice(b*3,b*3+3)))),sample=new THREE.Vector3(),closest=new THREE.Vector3();
  for(let i=0;i<coverage.length;i++){sample.fromArray(positions,i*3);let distance=Infinity;for(const edge of boundary)distance=Math.min(distance,sample.distanceTo(edge.closestPointToPoint(sample,true,closest)));coverage[i]*=THREE.MathUtils.smoothstep(distance,0,thumb&&!artificial?.00012:.00035)}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));geometry.setAttribute('nailCoverage',new THREE.Float32BufferAttribute(coverage,1));geometry.setAttribute('nailUV',new THREE.Float32BufferAttribute(coordinates,2));geometry.setIndex(triangles);
  const nailMaterial=material.clone();nailMaterial.onBeforeCompile=material.onBeforeCompile;nailMaterial.customProgramCacheKey=material.customProgramCacheKey;
  if(thumb&&!artificial){nailMaterial.opacity=.86;nailMaterial.roughness=.33;nailMaterial.clearcoat=.18;nailMaterial.clearcoatRoughness=.26;nailMaterial.envMapIntensity=.65;}
  const nail=new THREE.SkinnedMesh(geometry,nailMaterial);nail.name=bed.bone.name+'-nail';nail.userData.fit={continuous,scale:footprintScale,sourceTriangles:surfaceTriangles.length,clearanceCorrection};nail.bind(skin.skeleton,skin.bindMatrix.clone());nail.frustumCulled=false;nail.renderOrder=1;nail.receiveShadow=true;skin.parent.add(nail);nails.push(nail);
 }
 material.dispose();
 return nails;
}
