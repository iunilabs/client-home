import * as THREE from 'three';

// Blend rigid joint transforms without the loss of volume caused by averaging
// rotation matrices. The CPU path is also used by exact fingertip contact.
export function transformDualQuaternion(point,indices,weights,real,dual){
  let rx=0,ry=0,rz=0,rw=0,dx=0,dy=0,dz=0,dw=0;
  const reference=real[indices[weights.findIndex(weight=>weight>0)]];
  for(let j=0;j<4;j++){
    if(!weights[j])continue;
    const r=real[indices[j]],d=dual[indices[j]],sign=reference.dot(r)<0?-1:1,w=weights[j]*sign;
    rx+=r.x*w;ry+=r.y*w;rz+=r.z*w;rw+=r.w*w;dx+=d.x*w;dy+=d.y*w;dz+=d.z*w;dw+=d.w*w;
  }
  const inverse=1/Math.hypot(rx,ry,rz,rw);rx*=inverse;ry*=inverse;rz*=inverse;rw*=inverse;dx*=inverse;dy*=inverse;dz*=inverse;dw*=inverse;
  const orthogonal=rx*dx+ry*dy+rz*dz+rw*dw;dx-=rx*orthogonal;dy-=ry*orthogonal;dz-=rz*orthogonal;dw-=rw*orthogonal;
  point.applyQuaternion(new THREE.Quaternion(rx,ry,rz,rw));
  point.x+=2*(rw*dx-dw*rx+ry*dz-rz*dy);point.y+=2*(rw*dy-dw*ry+rz*dx-rx*dz);point.z+=2*(rw*dz-dw*rz+rx*dy-ry*dx);
  return point;
}

export function preserveHandVolume(skin,attachments=[]){
  const count=skin.skeleton.bones.length,real=Array.from({length:count},()=>new THREE.Vector4(0,0,0,1)),dual=Array.from({length:count},()=>new THREE.Vector4());
  const uniforms={handDQReal:{value:real},handDQDual:{value:dual}},matrix=new THREE.Matrix4(),translation=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  function update(){
    for(let i=0;i<count;i++){
      matrix.copy(skin.bindMatrixInverse).multiply(skin.skeleton.bones[i].matrixWorld).multiply(skin.skeleton.boneInverses[i]).multiply(skin.bindMatrix);
      matrix.decompose(translation,rotation,scale);rotation.normalize();real[i].set(rotation.x,rotation.y,rotation.z,rotation.w);
      const{x,y,z}=translation,q=rotation;
      dual[i].set((x*q.w+y*q.z-z*q.y)*.5,(-x*q.z+y*q.w+z*q.x)*.5,(x*q.y-y*q.x+z*q.w)*.5,-(x*q.x+y*q.y+z*q.z)*.5);
    }
  }
  const declarations=/* glsl */`
    uniform vec4 handDQReal[${count}];uniform vec4 handDQDual[${count}];
    vec3 handRotate(vec4 q,vec3 p){return p+2.0*cross(q.xyz,cross(q.xyz,p)+q.w*p);}
  `;
  const blend=/* glsl */`
    vec4 reference=handDQReal[int(skinIndex.x)];
    if(skinWeight.x==0.0)reference=handDQReal[int(skinIndex.y)];
    vec4 handReal=vec4(0.0),handDual=vec4(0.0);
    for(int j=0;j<4;j++){
      int id=int(skinIndex[j]);float weight=skinWeight[j];
      float signDQ=dot(reference,handDQReal[id])<0.0?-1.0:1.0;
      handReal+=handDQReal[id]*weight*signDQ;handDual+=handDQDual[id]*weight*signDQ;
    }
    float inverseLength=inversesqrt(max(dot(handReal,handReal),.0000001));
    handReal*=inverseLength;handDual*=inverseLength;handDual-=handReal*dot(handReal,handDual);
  `;
  function patch(material){
    const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey.bind(material);
    const key=previousKey();
    material.onBeforeCompile=shader=>{
      previous.call(material,shader);Object.assign(shader.uniforms,uniforms);
      shader.vertexShader=declarations+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <skinbase_vertex>',blend);
      shader.vertexShader=shader.vertexShader.replace('#include <skinnormal_vertex>',`objectNormal=handRotate(handReal,objectNormal);
        #ifdef USE_TANGENT
        objectTangent=handRotate(handReal,objectTangent);
        #endif`);
      shader.vertexShader=shader.vertexShader.replace('#include <skinning_vertex>',`transformed=handRotate(handReal,transformed)+2.0*(handReal.w*handDual.xyz-handDual.w*handReal.xyz+cross(handReal.xyz,handDual.xyz));`);
    };
    material.customProgramCacheKey=()=>`${key}-hand-volume-${count}`;
  }
  for(const mesh of [skin,...attachments.filter(Boolean)]){
    patch(mesh.material);
    mesh.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});patch(mesh.customDepthMaterial);
    mesh.onBeforeRender=update;mesh.onBeforeShadow=update;
    mesh.applyBoneTransform=(index,point)=>{
      const indices=mesh.geometry.attributes.skinIndex.array.subarray(index*4,index*4+4),weights=mesh.geometry.attributes.skinWeight.array.subarray(index*4,index*4+4);
      return transformDualQuaternion(point,indices,weights,real,dual);
    };
  }
  update();return{update,kind:'dual-quaternion'};
}
