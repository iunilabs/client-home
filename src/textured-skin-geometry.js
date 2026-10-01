import * as THREE from 'three';

function smoothSeams(geometry){
  geometry.computeVertexNormals();
  const position=geometry.attributes.position,normal=geometry.attributes.normal,groups=new Map();
  for(let i=0;i<position.count;i++){
    const key=[position.getX(i),position.getY(i),position.getZ(i)].map(v=>v.toFixed(6)).join(',');
    if(!groups.has(key))groups.set(key,{ids:[],normal:new THREE.Vector3()});
    const group=groups.get(key);group.ids.push(i);group.normal.add(new THREE.Vector3().fromBufferAttribute(normal,i));
  }
  for(const group of groups.values()){group.normal.normalize();for(const i of group.ids)normal.setXYZ(i,...group.normal)}
}

// Smooth the silhouette and joint weights while retaining separate UV vertices
// at atlas seams. Welding those vertices would corrupt the supplied texture.
export function refineTexturedSkin(source,iterations=1){
  let geometry=source;
  for(let iteration=0;iteration<iterations;iteration++){
    const p=geometry.attributes.position,canonical=[],vertices=[],weld=new Map(),faces=geometry.index.array,edges=new Map();
    const attributeNames=Object.keys(geometry.attributes).filter(name=>!['position','normal','skinIndex','skinWeight'].includes(name));
    for(let i=0;i<p.count;i++){
      const position=new THREE.Vector3().fromBufferAttribute(p,i),key=position.toArray().map(v=>v.toFixed(6)).join(',');
      if(!weld.has(key)){
        const influences=new Map();for(let j=0;j<4;j++){const bone=geometry.attributes.skinIndex.array[i*4+j],weight=geometry.attributes.skinWeight.array[i*4+j];influences.set(bone,(influences.get(bone)??0)+weight)}
        weld.set(key,vertices.length);vertices.push({position,influences,neighbors:new Set(),boundary:[]});
      }
      canonical.push(weld.get(key));
    }
    const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
    for(let i=0;i<faces.length;i+=3){
      const triangle=[canonical[faces[i]],canonical[faces[i+1]],canonical[faces[i+2]]];
      for(let j=0;j<3;j++){
        const a=triangle[j],b=triangle[(j+1)%3],opposite=triangle[(j+2)%3],key=edgeKey(a,b);vertices[a].neighbors.add(b);vertices[b].neighbors.add(a);
        if(!edges.has(key))edges.set(key,{a,b,opposite:[]});edges.get(key).opposite.push(opposite);
      }
    }
    for(const edge of edges.values())if(edge.opposite.length===1){vertices[edge.a].boundary.push(edge.b);vertices[edge.b].boundary.push(edge.a)}
    const blend=terms=>{const position=new THREE.Vector3(),influences=new Map();for(const[id,amount]of terms){position.addScaledVector(vertices[id].position,amount);for(const[bone,weight]of vertices[id].influences)influences.set(bone,(influences.get(bone)??0)+weight*amount)}return{position,influences}};
    const moved=vertices.map((vertex,i)=>{const boundary=vertex.boundary;if(boundary.length===2)return blend([[i,.75],...boundary.map(id=>[id,.125])]);if(boundary.length||!vertex.neighbors.size)return vertex;const count=vertex.neighbors.size,beta=count===3?3/16:3/(8*count);return blend([[i,1-count*beta],...[...vertex.neighbors].map(id=>[id,beta])])});
    const positions=[],skinIndices=[],skinWeights=[],attributes=Object.fromEntries(attributeNames.map(name=>[name,[]])),indices=[],midpoints=new Map();
    function addVertex(vertex,samples){
      const index=positions.length/3;positions.push(...vertex.position);
      const influences=[...vertex.influences].filter(([,weight])=>weight>0).sort((a,b)=>b[1]-a[1]).slice(0,4),total=influences.reduce((sum,[,weight])=>sum+weight,0);
      for(let j=0;j<4;j++){skinIndices.push(influences[j]?.[0]??0);skinWeights.push((influences[j]?.[1]??0)/total)}
      for(const name of attributeNames){const attribute=geometry.attributes[name];for(let j=0;j<attribute.itemSize;j++)attributes[name].push(samples.reduce((sum,[id,amount])=>sum+attribute.array[id*attribute.itemSize+j]*amount,0))}
      return index;
    }
    for(let i=0;i<p.count;i++)addVertex(moved[canonical[i]],[[i,1]]);
    function midpoint(a,b){
      const key=edgeKey(a,b);if(midpoints.has(key))return midpoints.get(key);
      const edge=edges.get(edgeKey(canonical[a],canonical[b])),terms=edge.opposite.length===2?[[edge.a,.375],[edge.b,.375],...edge.opposite.map(id=>[id,.125])]:[[edge.a,.5],[edge.b,.5]];
      const id=addVertex(blend(terms),[[a,.5],[b,.5]]);midpoints.set(key,id);return id;
    }
    for(let i=0;i<faces.length;i+=3){const[a,b,c]=faces.slice(i,i+3),ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);indices.push(a,ab,ca,b,bc,ab,c,ca,bc,ab,bc,ca)}
    const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));result.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
    for(const name of attributeNames)result.setAttribute(name,new THREE.BufferAttribute(new geometry.attributes[name].array.constructor(attributes[name]),geometry.attributes[name].itemSize));result.setIndex(indices);
    if(geometry!==source)geometry.dispose();geometry=result;
  }
  smoothSeams(geometry);geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
