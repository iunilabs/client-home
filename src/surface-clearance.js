import * as THREE from 'three';

// Diagnostic only: a static triangle BVH for tools and deformed hand vertices.
// Distances are measured in 3D; camera parallax never changes clearance.
const cache=new WeakMap(),p=new THREE.Vector3(),closest=new THREE.Vector3();
// SAT also handles coplanar triangle pairs. This tests the actual surfaces,
// rather than treating overlapping arm/tool bounding boxes as contact.
const edgesA=Array.from({length:3},()=>new THREE.Vector3()),edgesB=Array.from({length:3},()=>new THREE.Vector3()),normalA=new THREE.Vector3(),normalB=new THREE.Vector3(),axis=new THREE.Vector3();
function trianglesCross(a,b){
 const av=[a.a,a.b,a.c],bv=[b.a,b.b,b.c];
 for(let i=0;i<3;i++){edgesA[i].subVectors(av[(i+1)%3],av[i]);edgesB[i].subVectors(bv[(i+1)%3],bv[i])}
 normalA.crossVectors(edgesA[0],edgesA[1]);normalB.crossVectors(edgesB[0],edgesB[1]);
 function separated(v){if(v.lengthSq()<1e-20)return false;v.normalize();const aa=av.map(p=>p.dot(v)),bb=bv.map(p=>p.dot(v));return Math.max(...aa)<Math.min(...bb)-1e-8||Math.max(...bb)<Math.min(...aa)-1e-8}
 if(separated(normalA)||separated(normalB))return false;
 for(const ea of edgesA)for(const eb of edgesB)if(separated(axis.crossVectors(ea,eb)))return false;
 for(const e of [...edgesA,...edgesB])if(separated(axis.crossVectors(normalA,e)))return false;
 return true;
}
function treeFor(group){
 if(cache.has(group))return cache.get(group);
 group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),triangles=[];
 group.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry,position=g.attributes.position,indices=g.index?.array??Array.from({length:position.count},(_,i)=>i),matrix=inverse.clone().multiply(mesh.matrixWorld);
  for(let i=0;i<indices.length;i+=3){const vertices=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(position,indices[i+j]).applyMatrix4(matrix)),triangle=new THREE.Triangle(...vertices),box=new THREE.Box3().setFromPoints(vertices);triangles.push({triangle,box,center:box.getCenter(new THREE.Vector3())})}
 });
 function build(items){const box=new THREE.Box3();for(const t of items)box.union(t.box);if(items.length<=12)return{box,items};const size=box.getSize(new THREE.Vector3()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';items.sort((a,b)=>a.center[axis]-b.center[axis]);const middle=Math.floor(items.length/2);return{box,left:build(items.slice(0,middle)),right:build(items.slice(middle))}}
 const tree=build(triangles);cache.set(group,tree);return tree;
}
export function measureClearance(hand,group){
 const tree=treeFor(group),inverse=group.matrixWorld.clone().invert(),handBox=new THREE.Box3(),toolBox=new THREE.Box3().setFromObject(group),skin=hand.skin,vertices=[];let best=Infinity,handPoint,toolPoint;
 function visit(node){if(node.box.distanceToPoint(p)**2>=best)return;if(node.items){for(const item of node.items){if(item.box.distanceToPoint(p)**2>=best)continue;item.triangle.closestPointToPoint(p,closest);const d=closest.distanceToSquared(p);if(d<best){best=d;handPoint=p.clone();toolPoint=closest.clone()}}}else{const a=node.left.box.distanceToPoint(p),b=node.right.box.distanceToPoint(p);visit(a<b?node.left:node.right);visit(a<b?node.right:node.left)}}
 hand.root.updateMatrixWorld(true);skin.onBeforeRender?.();
 // Every hand vertex contributes to the broad-phase bound. Three-way
 // sampling supplies the near-surface measurement without a render cost.
 for(let i=0;i<skin.geometry.attributes.position.count;i++){skin.getVertexPosition(i,p).applyMatrix4(skin.matrixWorld);handBox.expandByPoint(p);p.applyMatrix4(inverse);vertices.push(p.clone());if(i%3===0)visit(tree)}
 const indices=skin.geometry.index?.array??vertices.map((_,i)=>i),triangle=new THREE.Triangle(),box=new THREE.Box3();let intersectingTriangles=0;
 function crosses(node){if(!box.intersectsBox(node.box))return false;if(node.items)return node.items.some(t=>box.intersectsBox(t.box)&&trianglesCross(triangle,t.triangle));return crosses(node.left)||crosses(node.right)}
 for(let i=0;i<indices.length;i+=3){triangle.set(vertices[indices[i]],vertices[indices[i+1]],vertices[indices[i+2]]);box.setFromPoints([triangle.a,triangle.b,triangle.c]);if(crosses(tree))intersectingTriangles++}
 const boxGap=new THREE.Vector3(...['x','y','z'].map(axis=>Math.max(0,toolBox.min[axis]-handBox.max[axis],handBox.min[axis]-toolBox.max[axis]))).length(),scale=group.getWorldScale(new THREE.Vector3()).x,distance=Math.sqrt(best)*scale;
 return {sampledSurfaceDistanceWorld:distance,approximateCentimetres:distance/18*100,guaranteedBoxSeparationWorld:boxGap,intersectingTriangles,collisionTest:'All deformed skin triangles against all tool triangles, BVH and separating axes',handNearestWorld:handPoint?.applyMatrix4(group.matrixWorld).toArray(),toolNearestWorld:toolPoint?.applyMatrix4(group.matrixWorld).toArray(),sampling:'Every third deformed skin vertex against all tool triangles; box separation includes every skin vertex',metresToWorld:18};
}
