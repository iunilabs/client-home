import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { subdivideSkin } from './geometry.js';
import { handMaterial } from './surfaces.js';
import { createPhotographicHand } from './photographic-hand.js';

const fingers = ['thumb', 'index-finger', 'middle-finger', 'ring-finger', 'pinky-finger'];
const chains = ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'];

function extendForearm(mesh) {
  const geometry=mesh.geometry,position=geometry.attributes.position,index=geometry.index;
  const canonical=[],byPosition=new Map(),points=[];
  for(let i=0;i<position.count;i++){
    const key=[position.getX(i),position.getY(i),position.getZ(i)].map(v=>v.toFixed(6)).join(',');
    if(!byPosition.has(key)){byPosition.set(key,points.length);points.push(i)}canonical[i]=byPosition.get(key);
  }
  const kept=[],edges=new Map(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<index.count;i+=3){
    const face=[index.getX(i),index.getX(i+1),index.getX(i+2)];
    a.fromBufferAttribute(position,face[0]);b.fromBufferAttribute(position,face[1]);c.fromBufferAttribute(position,face[2]);
    const centroidY=(a.y+b.y+c.y)/3;
    const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if(centroidY>.064&&normal.y>.8)continue;
    kept.push(...face);
    for(let j=0;j<3;j++){
      const v=canonical[face[j]],w=canonical[face[(j+1)%3]],key=[v,w].sort((x,y)=>x-y).join(',');
      if(edges.has(key))edges.get(key).count++;else edges.set(key,{v,w,from:face[j],to:face[(j+1)%3],count:1});
    }
  }
  const boundary=[...edges.values()].filter(e=>e.count===1);
  if(boundary.length<8||boundary.length>40)throw new Error('Unexpected wrist topology');
  const attrs={};for(const [key,attribute] of Object.entries(geometry.attributes))attrs[key]=Array.from(attribute.array);
  const ringIDs=new Set(boundary.flatMap(e=>[e.v,e.w]));
  const center=new THREE.Vector3();for(const id of ringIDs)center.add(a.fromBufferAttribute(position,points[id]));center.multiplyScalar(1/ringIDs.size);
  const wrist=mesh.skeleton.bones.findIndex(bone=>bone.name==='wrist');
  let previous=new Map([...ringIDs].map(id=>[id,points[id]]));
  const ringCount=16;
  for(let ring=1;ring<=ringCount;ring++){
    const next=new Map(),t=ring/ringCount;
    for(const id of ringIDs){
      const original=a.fromBufferAttribute(position,points[id]);
      // A narrow wrist opens into the flexor/extensor mass, then tapers gently
      // towards the elbow. The last rings stay outside the narrative camera.
      const scale=1+.72*Math.sin(t*Math.PI*.64);
      const angle=Math.atan2(original.z-center.z,original.x-center.x);
      const tendon=Math.sin(angle*3+.7)*.0008*Math.sin(t*Math.PI)*Math.exp(-t*4);
      const x=center.x+(original.x-center.x)*(scale+Math.sin(t*Math.PI)*.1)+Math.cos(angle)*tendon;
      const z=center.z+(original.z-center.z)*scale+Math.sin(angle)*tendon;
      const y=original.y+.32*t;
      const n=new THREE.Vector3(x-center.x,-.03,z-center.z).normalize();
      const vertex=attrs.position.length/3;next.set(id,vertex);
      for(const [key,attribute] of Object.entries(geometry.attributes)){
        if(key==='position')attrs[key].push(x,y,z);
        else if(key==='normal')attrs[key].push(n.x,n.y,n.z);
        else if(key==='skinIndex')attrs[key].push(wrist,0,0,0);
        else if(key==='skinWeight')attrs[key].push(1,0,0,0);
        else if(key==='uv')attrs[key].push(t,id/ringIDs.size);
        else for(let j=0;j<attribute.itemSize;j++)attrs[key].push(attribute.array[points[id]*attribute.itemSize+j]);
      }
    }
    for(const edge of boundary){const v=previous.get(edge.v),w=previous.get(edge.w),nv=next.get(edge.v),nw=next.get(edge.w);kept.push(w,v,nv,w,nv,nw)}
    previous=next;
  }
  for(const [key,attribute] of Object.entries(geometry.attributes))geometry.setAttribute(key,new THREE.BufferAttribute(new attribute.array.constructor(attrs[key]),attribute.itemSize,attribute.normalized));
  geometry.setIndex(kept);geometry.computeBoundingBox();geometry.computeBoundingSphere();
}

function addNails(scene, skin, artificial) {
  const nailMaterial=new THREE.MeshPhysicalMaterial({color:artificial?'#eeede8':'#bf907c',roughness:artificial?.19:.36,clearcoat:.4,clearcoatRoughness:.3,ior:1.48});
  const edgeMaterial=new THREE.MeshPhysicalMaterial({color:artificial?'#eeede8':'#e2c4ac',roughness:.4});
  const up=new THREE.Vector3(artificial?1:-1,0,0),p=new THREE.Vector3();
  for(const finger of fingers){
    const distal=scene.getObjectByName(`${finger}-phalanx-distal`),tip=scene.getObjectByName(`${finger}-tip`);
    const a=distal.getWorldPosition(new THREE.Vector3()),b=tip.getWorldPosition(new THREE.Vector3());
    const direction=b.clone().sub(a).normalize(),center=a.clone().lerp(b,.55);
    const normal=up.clone().addScaledVector(direction,-up.dot(direction)).normalize();
    // Fit the nail to the dorsal surface of the original finger, in bind space.
    let radius=.005;
    const position=skin.geometry.attributes.position;
    let closest=Infinity;
    for(let i=0;i<position.count;i++){
      p.fromBufferAttribute(position,i).applyMatrix4(skin.matrixWorld);
      const delta=p.clone().sub(center),axial=delta.dot(direction),height=delta.dot(normal);
      const lateral=delta.clone().addScaledVector(direction,-axial).addScaledVector(normal,-height).length();
      const score=Math.abs(axial)+lateral;
      if(height>0&&score<closest){closest=score;radius=height}
    }
    const width=finger==='thumb'?.0085:finger==='pinky-finger'?.0053:.0068;
    const length=a.distanceTo(b)*.96;
    const nail=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),nailMaterial);
    nail.name=`${finger}-nail`;nail.scale.set(width*.5,length*.5,.00065);
    nail.position.copy(center).addScaledVector(normal,radius-.00028);
    const side=new THREE.Vector3().crossVectors(direction,normal).normalize();
    nail.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,direction,normal));
    nail.castShadow=true;nail.receiveShadow=true;scene.add(nail);distal.attach(nail);
    if(!artificial){
      const edge=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),edgeMaterial);
      edge.name=`${finger}-nail-edge`;edge.scale.set(width*.42,.00045,.00055);
      edge.position.copy(center).addScaledVector(direction,length*.42).addScaledVector(normal,radius+.00005);
      edge.quaternion.copy(nail.getWorldQuaternion(new THREE.Quaternion()));scene.add(edge);distal.attach(edge);
    }
  }
}

export async function createHand(url, artificial = false, {detail=2,photographic=true}={}) {
  if(!artificial&&photographic)return createPhotographicHand({detail});
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = new THREE.Group();
  const orientation = new THREE.Group();
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);
  const wrist = scene.getObjectByName('wrist');
  const wristPosition = wrist.getWorldPosition(new THREE.Vector3());
  let skin;
  scene.traverse(object=>{if(object.isSkinnedMesh)skin=object});
  const indexDistal=scene.getObjectByName('index-finger-phalanx-distal');
  const indexA=indexDistal.getWorldPosition(new THREE.Vector3());
  const indexDirection=scene.getObjectByName('index-finger-tip').getWorldPosition(new THREE.Vector3()).sub(indexA).normalize();
  const indexBones=new Set(skin.skeleton.bones.map((bone,index)=>bone.name.startsWith('index-finger')?index:-1));
  let tipVertex=0,farthest=-Infinity;
  const knuckles=fingers.slice(1).map(finger=>scene.getObjectByName(`${finger}-phalanx-proximal`).getWorldPosition(new THREE.Vector3()));
  const creases=[];
  for(const finger of fingers)for(const joint of ['phalanx-proximal','phalanx-intermediate','phalanx-distal']){
    const bone=scene.getObjectByName(`${finger}-${joint}`);
    if(bone)creases.push(bone.getWorldPosition(new THREE.Vector3()));
  }
  addNails(scene,skin,artificial);
  const segments = [];
  // WebXR assets have independent joints. Rebuild anatomical chains while
  // preserving each joint's bind transform, so gestures can bend at knuckles.
  for (const finger of fingers) {
    let parent = wrist;
    for (const joint of chains) {
      const bone = scene.getObjectByName(`${finger}-${joint}`);
      if (!bone) continue;
      parent.attach(bone);
      segments.push({ bone, bind: bone.quaternion.clone(), finger, joint });
      parent = bone;
    }
  }
  scene.position.sub(wristPosition);
  const basis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, -1, 0)
  );
  orientation.quaternion.setFromRotationMatrix(basis);
  orientation.scale.setScalar(18);
  orientation.add(scene);
  root.add(orientation);
  if (artificial) root.rotation.y = Math.PI;

  const material = handMaterial(artificial);
  material.userData.creases=true;
  scene.traverse(object => {
    if (object.isSkinnedMesh) {
      object.material = material; object.castShadow = true; object.receiveShadow = true;
      object.frustumCulled = false;
      extendForearm(object);
      const coarse=object.geometry;
      const coarsePosition=coarse.attributes.position,coarseNormal=coarse.attributes.normal;
      const dorsalSign=artificial?1:-1;
      // Small volumes over joints and extensor tendons survive subdivision;
      // they give raking light a physical surface to describe.
      for(let i=0;i<coarsePosition.count;i++){
        const x=coarsePosition.getX(i),y=coarsePosition.getY(i),z=coarsePosition.getZ(i);
        const dorsal=THREE.MathUtils.smoothstep(coarseNormal.getX(i)*dorsalSign,.2,.8);
        if(!dorsal)continue;
        let relief=0;
        for(const knuckle of knuckles){
          const distance=Math.hypot(y-knuckle.y,z-knuckle.z);
          relief+=Math.exp(-((distance/.008)**2))*.00085;
          const length=THREE.MathUtils.smoothstep(y,knuckle.y-.015,knuckle.y+.008)*(1-THREE.MathUtils.smoothstep(y,.055,.095));
          const tendonZ=knuckle.z*(1-THREE.MathUtils.smoothstep(y,-.03,.09)*.32);
          relief+=Math.exp(-(((z-tendonZ)/.0028)**2))*length*.00048;
        }
        coarsePosition.setX(i,x+dorsalSign*relief*dorsal);
      }
      object.geometry=subdivideSkin(coarse,detail);coarse.dispose();
      const position=object.geometry.attributes.position,creaseValues=new Float32Array(position.count),point=new THREE.Vector3();
      for(let i=0;i<position.count;i++){
        point.fromBufferAttribute(position,i);
        let value=0;
        for(const crease of creases){
          const distance=point.distanceTo(crease),mask=1-THREE.MathUtils.smoothstep(distance,.007,.014);
          value=Math.max(value,Math.exp(-(((point.y-crease.y+.0015)/.0012)**2))*mask);
        }
        creaseValues[i]=value;
        let weight=0;for(let j=0;j<4;j++)if(indexBones.has(object.geometry.attributes.skinIndex.array[i*4+j]))weight+=object.geometry.attributes.skinWeight.array[i*4+j];
        if(weight>.5){const distance=point.clone().sub(indexA).dot(indexDirection);if(distance>farthest){farthest=distance;tipVertex=i}}
      }
      object.geometry.setAttribute('skinCrease',new THREE.BufferAttribute(creaseValues,1));
    }
  });

  const toolAnchor = new THREE.Group();
  root.add(toolAnchor);
  const scratchQ = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  function pose(curls = [.15, .12, .15, .2, .25]) {
    for (const segment of segments) {
      const amount = curls[fingers.indexOf(segment.finger)];
      segment.bone.quaternion.copy(segment.bind);
      if (segment.joint.includes('phalanx')) {
        const weight = segment.joint === 'phalanx-proximal' ? 1 : .72;
        // Convert an anatomical bend axis into each bone's local bind space.
        // Original asset fingers point along -Y; bend toward the palm (+/-X).
        axis.set(0, 0, artificial ? -1 : 1);
        axis.applyQuaternion(orientation.getWorldQuaternion(new THREE.Quaternion()));
        const worldBind = segment.bone.getWorldQuaternion(new THREE.Quaternion());
        axis.applyQuaternion(worldBind.invert()).normalize();
        scratchQ.setFromAxisAngle(axis, amount * weight);
        segment.bone.quaternion.multiply(scratchQ);
      }
    }
    scene.updateMatrixWorld(true);
  }
  function tipWorld() {
    root.updateMatrixWorld(true);
    // Use the actual subdivided, skinned surface. A bone or a bind-space
    // estimate cannot account for interpolation at the finger tip.
    return skin.getVertexPosition(tipVertex,new THREE.Vector3()).applyMatrix4(skin.matrixWorld);
  }
  return { root, scene, material, toolAnchor, pose, tipWorld, detail, skin };
}
