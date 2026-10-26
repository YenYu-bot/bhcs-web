import * as T from './vendor/three.module.js';
import {PALETTE,shadowPaint} from './paper-render.js?v=3b846e380251';
// Separate binocular, two-channel dissecting instrument. Units are scene units, not mm.
export function createStereoInstrument(parentLab){
 const art=parentLab.art,root=new T.Group();root.position.copy(parentLab.scope.position);root.rotation.copy(parentLab.scope.rotation);root.userData.instrument=true;root.visible=false;parentLab.root.add(root);const picks=[];let serial=7001;
 function mesh(g,c,p=root,x=0,y=0,z=0){const m=new T.Mesh(g,art.material(c,serial));m.position.set(x,y,z);p.add(m);art.decorate(m,serial++);return m;}
 const cyl=(r,h,c,p=root,x=0,y=0,z=0,n=24)=>mesh(new T.CylinderGeometry(r,r,h,n),c,p,x,y,z);
 function rounded(w,h,d,c,p=root,x=0,y=0,z=0){const r=Math.min(.14,w*.14,h*.25),s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,curveSegments:4});g.translate(0,0,-d/2);return mesh(g,c,p,x,y,z);}
 function tag(o,a){o.userData.action=a;picks.push(o);return o;}
 function line(points,p=root,c=PALETTE.ink){const g=new T.BufferGeometry().setFromPoints(points.map(a=>new T.Vector3(...a))),m=new T.Line(g,new T.LineBasicMaterial({color:c}));m.userData.artOnly=true;m.raycast=()=>{};p.add(m);return m;}
 const base=rounded(2.45,.30,2.10,'mint',root,0,.20,.12);const stage=cyl(.86,.045,'paper',root,0,.39,.36,40);base.renderOrder=1;stage.renderOrder=3;stage.userData.mechanism='stereo-stage';const stageRim=cyl(.91,.035,'deepMint',root,0,.35,.36,40);stageRim.renderOrder=2;
 const stand=rounded(.35,2.85,.38,'mint',root,0,1.77,-.65);rounded(.13,2.40,.055,'deepMint',root,0,1.80,-.42);rounded(.68,.32,.50,'mint',root,0,.52,-.65);
 const head=new T.Group();head.position.set(0,2.55,.25);root.add(head);rounded(1.12,.64,.78,'mint',head,0,.10,0);rounded(.45,.30,.72,'mint',head,0,.06,-.61);
 const eyeTubes=[],opticalChannels=[];
 for(const side of [-1,1]){
  const tube=new T.Group();tube.position.set(side*.29,.38,.02);tube.rotation.x=.42;head.add(tube);cyl(.155,.68,'mint',tube,0,.30,0);cyl(.205,.12,'deepMint',tube,0,.66,0);cyl(.145,.014,'ink',tube,0,.73,0);eyeTubes.push(tube);
  const channel=new T.Group();channel.position.set(side*.22,-.24,.10);head.add(channel);cyl(.14,.28,'deepMint',channel,0,-.13,0);cyl(.10,.018,'blue',channel,0,-.275,0);opticalChannels.push(channel);
 }
 const focusMount=new T.Group();focusMount.position.set(-.68,2.55,-.60);focusMount.rotation.z=Math.PI/2;root.add(focusMount);const focusKnob=new T.Group();focusMount.add(focusKnob);tag(cyl(.28,.17,'mint',focusKnob),'stereo-focus');tag(cyl(.285,.035,'coral',focusKnob),'stereo-focus');for(let i=0;i<16;i++){const a=i*Math.PI/8;line([[Math.cos(a)*.23,-.087,Math.sin(a)*.23],[Math.cos(a)*.26,-.087,Math.sin(a)*.26]],focusKnob);}
 const axle=cyl(.055,1.25,'deepMint',root,0,2.55,-.60);axle.rotation.z=Math.PI/2;
 const zoomMount=new T.Group();zoomMount.position.set(.29,.10,.47);zoomMount.rotation.x=Math.PI/2;head.add(zoomMount);const zoomKnob=new T.Group();zoomMount.add(zoomKnob);tag(cyl(.19,.13,'gold',zoomKnob),'stereo-zoom');line([[0,-.067,0],[0,-.067,.14]],zoomKnob);
 const lampArm=rounded(.09,1.05,.09,'mint',root,.83,1.32,-.15);lampArm.rotation.z=-.20;const lamp=new T.Group();lamp.position.set(.69,1.78,.02);lamp.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),new T.Vector3(0,.43,.36).sub(lamp.position).normalize());root.add(lamp);tag(cyl(.22,.24,'mint',lamp),'stereo-lamp');const lampFace=tag(cyl(.18,.014,'gold',lamp,0,-.13,0),'stereo-lamp');
 const specimenGroup=new T.Group();specimenGroup.position.set(0,.43,.36);root.add(specimenGroup);specimenGroup.userData.action='stereo-move';
 const token=new T.Group();specimenGroup.add(token);const tokenBody=tag(cyl(.51,.06,'gold',token,0,.035,0,40),'stereo-move');tokenBody.renderOrder=4;for(let i=0;i<24;i++){const a=i*Math.PI/12;line([[Math.cos(a)*.44,.067,Math.sin(a)*.44],[Math.cos(a)*.49,.067,Math.sin(a)*.49]],token);}
 const arrow=new T.Shape();arrow.moveTo(-.25,-.055);arrow.lineTo(.09,-.055);arrow.lineTo(.09,-.15);arrow.lineTo(.29,0);arrow.lineTo(.09,.15);arrow.lineTo(.09,.055);arrow.lineTo(-.25,.055);arrow.closePath();const arrowGeo=new T.ShapeGeometry(arrow);arrowGeo.rotateX(-Math.PI/2);const arrowMesh=new T.Mesh(arrowGeo,new T.MeshBasicMaterial({color:PALETTE.text,side:T.DoubleSide}));arrowMesh.position.y=.068;arrowMesh.renderOrder=5;arrowMesh.userData.action='stereo-move';token.add(arrowMesh);picks.push(arrowMesh);
 const leaf=new T.Group();specimenGroup.add(leaf);const leafShape=new T.Shape();leafShape.moveTo(-.62,.08);leafShape.bezierCurveTo(-.38,-.30,.32,-.30,.63,-.08);leafShape.bezierCurveTo(.38,.34,-.30,.37,-.62,.08);leafShape.closePath();const leafGeo=new T.ExtrudeGeometry(leafShape,{depth:.025,bevelEnabled:false,curveSegments:10});leafGeo.rotateX(-Math.PI/2);tag(mesh(leafGeo,'deepMint',leaf,0,.015,0),'stereo-move');line([[-.62,.046,-.08],[.63,.046,.08]],leaf);for(let i=-2;i<=2;i++){const x=i*.16;line([[x,.047,x*.13],[x-.12,.047,-.18]],leaf);line([[x,.047,x*.13],[x+.12,.047,.19]],leaf);}
 const targets={focus:focusKnob,zoom:zoomKnob,move:specimenGroup,lamp};
 function updatePose(s){head.position.y=2.55+s.focus*.045;focusKnob.rotation.y=s.focus*.36;zoomKnob.rotation.y=s.total===40?Math.PI/2:0;specimenGroup.position.x=s.stageX/800;specimenGroup.position.z=.36-s.stageY/800;token.visible=s.specimen!=='leaf';leaf.visible=s.specimen==='leaf';
  for(const channel of opticalChannels){const localTarget=new T.Vector3(0,.43,.36);head.worldToLocal(root.localToWorld(localTarget));const direction=localTarget.sub(channel.position).normalize();channel.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),direction);}
  const color=new T.Color(s.lamp===0?PALETTE.deepMint:PALETTE.gold);lampFace.material.color.copy(color);lampFace.material.userData.original.copy(color);lampFace.material.userData.paperDark.copy(shadowPaint(color));root.updateMatrixWorld(true);
 }
 updatePose({focus:-2,total:20,stageX:0,stageY:0,lamp:75,specimen:'token'});
 return {root,head,focusKnob,focusMount,zoomKnob,stage,specimenGroup,token,leaf,lamp,lampFace,picks,targets,eyeTubes,opticalChannels,stand,base,updatePose,mechanics:{stageTop:.43,focusTravelPerUnit:.045,}};
}
export function cameraForStereo(width,height,view='table'){
 const camera=new T.PerspectiveCamera(35,width/height,.1,100);let target,azimuth,elevation,distance;
 if(view==='focus'){target=new T.Vector3(1.75,2.25,-.1);azimuth=-63;elevation=18;distance=5.9;}else if(view==='stage'){target=new T.Vector3(2,.61,.35);azimuth=-8;elevation=62;distance=4.8;}else{target=new T.Vector3(.65+(width<=600?Math.max(0,height/width-1.2)*.8:0),1.60,.05);azimuth=-30;elevation=24;distance=10.8;}
 const az=azimuth*Math.PI/180,el=elevation*Math.PI/180;camera.position.copy(target).add(new T.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).multiplyScalar(distance));camera.lookAt(target);camera.updateMatrixWorld();camera.userData.spec={view,azimuth,elevation,fov:35,distance,target:target.toArray()};return camera;
}
