import * as THREE from 'three';

function randomStream(seed){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}}

export function createHandHair(skin,{count=900}={}){
  const random=randomStream(9302026),geometry=skin.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal,index=geometry.index.array;
  const candidates=[],cumulative=[];
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();let area=0;
  for(let i=0;i<index.length;i+=3){
    const ids=[index[i],index[i+1],index[i+2]];a.fromBufferAttribute(position,ids[0]);b.fromBufferAttribute(position,ids[1]);c.fromBufferAttribute(position,ids[2]);
    const center=a.clone().add(b).add(c).multiplyScalar(1/3);
    n.fromBufferAttribute(normal,ids[0]).add(new THREE.Vector3().fromBufferAttribute(normal,ids[1])).add(new THREE.Vector3().fromBufferAttribute(normal,ids[2])).normalize();
    if((center.x>-.025&&n.z>-.45)||center.x>.123||center.x<-.29)continue;
    const nail=(geometry.attributes.nailMask?.getX(ids[0])??0)+(geometry.attributes.nailMask?.getX(ids[1])??0)+(geometry.attributes.nailMask?.getX(ids[2])??0);
    if(nail>.1)continue;
    const triangleArea=b.clone().sub(a).cross(c.clone().sub(a)).length()*.5;
    const density=center.x>.075?.12:center.x>-.022?1.1:.35;
    area+=triangleArea*density;candidates.push(ids);cumulative.push(area);
  }
  const positions=[],normals=[],colors=[],skinIndices=[],skinWeights=[],indices=[];
  const baseColor=new THREE.Color('#a17d55'),lightColor=new THREE.Color('#d2bd93');
  for(let strand=0;strand<count&&candidates.length;strand++){
    const pick=random()*area;let low=0,high=cumulative.length-1;while(low<high){const middle=(low+high)>>1;if(cumulative[middle]<pick)low=middle+1;else high=middle}
    const ids=candidates[low],r=Math.sqrt(random()),t=random(),weights=[1-r,r*(1-t),r*t],root=new THREE.Vector3(),surfaceNormal=new THREE.Vector3();
    const influenceMap=new Map();
    for(let j=0;j<3;j++){
      root.addScaledVector(a.fromBufferAttribute(position,ids[j]),weights[j]);surfaceNormal.addScaledVector(n.fromBufferAttribute(normal,ids[j]),weights[j]);
      for(let k=0;k<4;k++){
        const bone=geometry.attributes.skinIndex.array[ids[j]*4+k],weight=geometry.attributes.skinWeight.array[ids[j]*4+k]*weights[j];
        influenceMap.set(bone,(influenceMap.get(bone)??0)+weight);
      }
    }
    surfaceNormal.normalize();root.addScaledVector(surfaceNormal,.000008);
    const influences=[...influenceMap].sort((a,b)=>b[1]-a[1]).slice(0,4),total=influences.reduce((sum,[,w])=>sum+w,0);
    const isArm=root.x<-.022,length=(isArm?.003:.001)+random()*(isArm?.006:.0025);
    const comb=new THREE.Vector3(-.7,(random()-.5)*1.2,-.15);comb.addScaledVector(surfaceNormal,-comb.dot(surfaceNormal)).normalize();
    const side=new THREE.Vector3().crossVectors(comb,surfaceNormal).normalize(),coarse=random()<.3,radius=(coarse?.000017:.000009)+random()*.000008;
    const color=coarse?new THREE.Color('#76553c'):baseColor.clone().lerp(lightColor,random()),start=positions.length/3;
    // Five tapered rings follow a curved centreline. The roots and every
    // ring share interpolated skin weights, so strands travel with the skin.
    for(let ring=0;ring<5;ring++){
      const u=ring/4,center=root.clone().addScaledVector(comb,length*u*.84).addScaledVector(surfaceNormal,length*(Math.sin(u*Math.PI*.65)*.26+u*.045));
      const taper=radius*(1-u*.92);
      for(let k=0;k<3;k++){
        const angle=k/3*Math.PI*2,offset=side.clone().multiplyScalar(Math.cos(angle)).addScaledVector(surfaceNormal,Math.sin(angle));
        const point=center.clone().addScaledVector(offset,taper);positions.push(...point);normals.push(...offset);colors.push(color.r,color.g,color.b);
        for(let w=0;w<4;w++){skinIndices.push(influences[w]?.[0]??0);skinWeights.push((influences[w]?.[1]??0)/total)}
        if(ring<4){const v=start+ring*3+k,next=start+ring*3+(k+1)%3;indices.push(v,next,v+3,next,next+3,v+3)}
      }
    }
  }
  const hairGeometry=new THREE.BufferGeometry();hairGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));hairGeometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));hairGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));hairGeometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));hairGeometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));hairGeometry.setIndex(indices);
  const hair=new THREE.SkinnedMesh(hairGeometry,new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.48,metalness:0,side:THREE.DoubleSide,envMapIntensity:.65,sheen:.25,sheenColor:'#e0c397',sheenRoughness:.4}));
  hair.name='human-vellus-hair';hair.frustumCulled=false;hair.castShadow=false;hair.receiveShadow=true;hair.position.copy(skin.position);hair.quaternion.copy(skin.quaternion);hair.scale.copy(skin.scale);hair.bind(skin.skeleton,skin.bindMatrix.clone());
  hair.userData={strandCount:positions.length/45,distribution:'dorsum and forearm; palms and nails excluded',seed:9302026};return hair;
}
