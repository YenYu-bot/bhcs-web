import * as T from './vendor/three.module.js';
// Predeclared, transparent hit surfaces. The SVG root never receives blank hits.
// Front-facing triangles of active physical parts are painted; raycast resolves overlapping controls.
export function mountBodyTouch(host,scene){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('body-touch');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');host.append(svg);const ray=new T.Raycaster(),paths=new Map();let previous='';
 const action=o=>{while(o){if(o.userData.action)return o.userData.action;o=o.parent;}return null;};
 const visible=o=>{while(o){if(!o.visible)return false;o=o.parent;}return true;};
 function update(camera,w,h){scene.updateMatrixWorld(true);camera.updateMatrixWorld();const physical=[];scene.traverse(o=>{if(o.isMesh&&!o.userData.artOnly&&visible(o)&&o.geometry?.attributes?.position)physical.push(o);});const targets=physical.filter(o=>action(o));const signature=[w,h,...camera.matrixWorld.elements,...camera.projectionMatrix.elements,...targets.flatMap(o=>[o.id,...o.matrixWorld.elements])].join(',');if(signature===previous)return;previous=signature;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('width',w);svg.setAttribute('height',h);const shapes=new Map(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),center=new T.Vector3(),normal=new T.Vector3(),edge=new T.Vector3(),eye=new T.Vector3();camera.getWorldPosition(eye);
  for(const mesh of targets){const pos=mesh.geometry.attributes.position,idx=mesh.geometry.index,count=idx?idx.count:pos.count,key=action(mesh),triangles=[];for(let i=0;i<count;i+=3){a.fromBufferAttribute(pos,idx?idx.getX(i):i).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(pos,idx?idx.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(pos,idx?idx.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);center.copy(a).add(b).add(c).multiplyScalar(1/3);normal.subVectors(b,a).cross(edge.subVectors(c,a));if(normal.dot(edge.subVectors(eye,center))<=0&&mesh.material.side!==T.DoubleSide)continue;const p=[a.clone().project(camera),b.clone().project(camera),c.clone().project(camera)];if(p.some(v=>v.z < -1||v.z>1))continue;const q=p.map(v=>[(v.x*.5+.5)*w,(-v.y*.5+.5)*h]);if(Math.abs((q[1][0]-q[0][0])*(q[2][1]-q[0][1])-(q[1][1]-q[0][1])*(q[2][0]-q[0][0]))<.3)continue;if((q[1][0]-q[0][0])*(q[2][1]-q[0][1])-(q[1][1]-q[0][1])*(q[2][0]-q[0][0])<0)[q[1],q[2]]=[q[2],q[1]];triangles.push({q,center:center.clone()});}
   // Do not discard partially exposed controls using sparse visibility samples.
   // The proxy stays inside projected physical-part triangles; pointerdown resolves occlusion.
   if(triangles.length){let d=shapes.get(key)||'';for(const t of triangles)d+=`M${t.q.map(v=>v.map(x=>x.toFixed(2)).join(' ')).join('L')}Z`;shapes.set(key,d);}
  }
  for(const[key,path]of paths)if(!shapes.has(key)){path.remove();paths.delete(key);}for(const[key,d]of shapes){let path=paths.get(key);if(!path){path=document.createElementNS(ns,'path');path.dataset.bodyHit=key;path.setAttribute('fill','transparent');path.setAttribute('fill-rule','nonzero');path.setAttribute('aria-label',`直接拖動模型：${key}`);svg.append(path);paths.set(key,path);}path.setAttribute('d',d);}
 }
 return{update,element:svg};
}
