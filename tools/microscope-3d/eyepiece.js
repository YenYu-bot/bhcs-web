// Drawing geometry preserved from the BHCS microscope teaching model (PR177).
export function makeEyepiece(canvas,state,illumination=()=>1){
const ctx=canvas.getContext('2d');
const objective=()=>state.objective;
const els={};for(const k of ['stageX','stageY'])Object.defineProperty(els,k,{get:()=>({value:state[k]})});
function visibleBounds(z){const sx=state.stageX*1.6,sy=state.stageY*1.6,r=310/z;return{minX:-sx-r,maxX:-sx+r,minY:sy-r,maxY:sy+r};}
const MICRO_FIELD_PX=540;
const MICRO_UM_TO_WORLD=MICRO_FIELD_PX/4500;
const MICRO_STAGE_GAIN=1.6;
const MICRO_SIZES={onion:{w:260,h:85},elodea:{w:90,h:45},cheek:{w:125,h:110}};
const MICRO_SPECIMEN_BOUNDS={letter:{halfX:90,halfY:90},onion:{halfX:145,halfY:115},cheek:{halfX:135,halfY:115},elodea:{halfX:150,halfY:120}};
function microSpecimenInView(kind,obj,stageX=0,stageY=0){
 const bounds=MICRO_SPECIMEN_BOUNDS[kind],z=obj/4,r=MICRO_FIELD_PX/2/z,cx=-stageX*MICRO_STAGE_GAIN,cy=stageY*MICRO_STAGE_GAIN;
 if(!bounds)return false;
 const dx=Math.max(Math.abs(cx)-bounds.halfX,0),dy=Math.max(Math.abs(cy)-bounds.halfY,0);
 return Math.hypot(dx,dy)<=r;
}
function microHash(row,col,salt=0){let v=Math.imul(row+17011,374761393)^Math.imul(col+8107,668265263)^Math.imul(salt+1,1274126177);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296;}
function microCell(kind,row,col){
 const rnd=s=>microHash(row,col,s),{w,h}=MICRO_SIZES[kind];
 if(kind==='cheek'){
  if(rnd(0)<.28)return null;
  const x=col*w+(rnd(1)-.5)*w*.85,y=row*h+(rnd(2)-.5)*h*.85,rx=23+rnd(3)*12,ry=18+rnd(4)*10,angle=rnd(5)*Math.PI;
  const points=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,rad=1+.07*Math.sin(3*a+rnd(6)*6)+.05*Math.cos(5*a);return{x:x+rad*(rx*Math.cos(a)*Math.cos(angle)-ry*Math.sin(a)*Math.sin(angle)),y:y+rad*(rx*Math.cos(a)*Math.sin(angle)+ry*Math.sin(a)*Math.cos(angle))}});
  return {kind,row,col,points,nucleus:{x:x+(rnd(7)-.5)*8,y:y+(rnd(8)-.5)*7,rx:4+rnd(9),ry:3.4+rnd(10),angle},organelles:[],tone:rnd(11)};
 }
 const rowY=r=>r*h+(microHash(r,0,40)-.5)*h*.22;
 const edge=c=>c*w+(microHash(row,c,41)-.5)*w*.30+(microHash(row,0,42)-.5)*w*.75;
 const bend=c=>(microHash(row,c,43)-.5)*w*.07;
 const y0=rowY(row),y1=rowY(row+1),left=edge(col),right=edge(col+1);
 const points=[{x:left,y:y0},{x:right,y:y0},{x:right+bend(col+1),y:y1},{x:left+bend(col),y:y1}];
 const at=(u,v)=>({x:(1-v)*(left+(right-left)*u)+v*(left+bend(col)+(right+bend(col+1)-left-bend(col))*u),y:y0+(y1-y0)*v});
 const organelles=[];
 if(kind==='elodea'){
  const count=18+Math.floor(rnd(50)*15);
  for(let k=0;k<count;k++){
   // Most lie in peripheral cytoplasm; some project over the cell face.
   let u=.1+.8*rnd(70+k*5),v=.14+.72*rnd(71+k*5);
   if(k%5!==0){const side=Math.floor(rnd(72+k*5)*4);if(side===0)u=.065+.04*rnd(73+k*5);if(side===1)u=.895+.04*rnd(73+k*5);if(side===2)v=.12+.05*rnd(73+k*5);if(side===3)v=.83+.05*rnd(73+k*5);}
   const p=at(u,v);organelles.push({...p,rx:2.5+rnd(74+k*5),ry:1.5+rnd(75+k*5)*.6,angle:rnd(76+k*5)*Math.PI,tone:rnd(77+k*5)});
  }
 }
 const n=at(.13+.12*rnd(9),.25+.5*rnd(10));
 return {kind,row,col,points,nucleus:kind==='onion'?{...n,rx:6,ry:4.5,angle:rnd(11)}:null,organelles,tone:rnd(12)};
}
function microScale(obj){const value=obj===4?1:obj===10?.5:.1;return{value,label:obj===4?'1 mm':obj===10?'500 µm':'100 µm',pixels:value/(18/obj)*MICRO_FIELD_PX,x:220,y:500,labelY:527};}

const microCache=new Map();
const microLayer=document.createElement('canvas');microLayer.width=600;microLayer.height=600;
const microLayerContext=microLayer.getContext('2d');
// Preserve the original600px specimen blur, then upscale only that raster; overlays draw at output DPR.
const blurredLayer=document.createElement('canvas');blurredLayer.width=600;blurredLayer.height=600;const blurredContext=blurredLayer.getContext('2d');
function microPath(points,ctx){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
function drawMicroCells(kind,ctx=microLayerContext){
 const z=objective()/4,b=visibleBounds(z),u=MICRO_UM_TO_WORLD;
 if(kind==='letter'){
  const limits=MICRO_SPECIMEN_BOUNDS.letter;ctx.save();ctx.beginPath();ctx.rect(-limits.halfX,-limits.halfY,limits.halfX*2,limits.halfY*2);ctx.clip();ctx.scale(u,u);ctx.fillStyle='rgba(36,61,66,.92)';ctx.font='700 1200px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('e',420,-160);ctx.restore();return;
 }
 const {w,h}=MICRO_SIZES[kind],limits=MICRO_SPECIMEN_BOUNDS[kind];
 const col0=Math.floor(b.minX/u/w)-2,col1=Math.ceil(b.maxX/u/w)+2,row0=Math.floor(b.minY/u/h)-2,row1=Math.ceil(b.maxY/u/h)+2;
 ctx.save();ctx.beginPath();ctx.rect(-limits.halfX,-limits.halfY,limits.halfX*2,limits.halfY*2);ctx.clip();ctx.scale(u,u);ctx.lineJoin='round';
 for(let row=row0;row<=row1;row++)for(let col=col0;col<=col1;col++){
  const key=kind+':'+row+':'+col;if(!microCache.has(key))microCache.set(key,microCell(kind,row,col));const cell=microCache.get(key);if(!cell)continue;
  microPath(cell.points,ctx);ctx.fillStyle=kind==='onion'?`rgba(217,171,70,${.09+cell.tone*.07})`:kind==='cheek'?`rgba(109,153,207,${.08+cell.tone*.10})`:`rgba(126,169,72,${.07+cell.tone*.08})`;ctx.fill();
  ctx.strokeStyle=kind==='onion'?'rgba(141,116,56,.56)':kind==='cheek'?'rgba(64,107,158,.50)':'rgba(77,113,63,.53)';ctx.lineWidth=(kind==='cheek'?.65:.85)/(u*z);ctx.stroke();
  // Do not enlarge organelles at low power just to make them visible.
  if(cell.nucleus&&z>=2.5){const n=cell.nucleus;ctx.beginPath();ctx.ellipse(n.x,n.y,n.rx,n.ry,n.angle,0,Math.PI*2);ctx.fillStyle=kind==='onion'?'rgba(130,97,44,.58)':'rgba(50,71,144,.65)';ctx.fill();}
  if(kind==='elodea'&&z>=2.5){ctx.save();microPath(cell.points,ctx);ctx.clip();for(const p of cell.organelles){ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx,p.ry,p.angle,0,Math.PI*2);ctx.fillStyle=`rgba(${55+Math.round(p.tone*22)},${110+Math.round(p.tone*32)},47,${.55+p.tone*.30})`;ctx.fill();}ctx.restore();}
 }
 ctx.restore();if(microCache.size>16000)microCache.clear();
}

return function draw(){
const cssWidth=canvas.getBoundingClientRect().width||600,backing=Math.round(cssWidth*Math.min(globalThis.devicePixelRatio||1,3));if(canvas.width!==backing||canvas.height!==backing){canvas.width=backing;canvas.height=backing;}ctx.setTransform(backing/600,0,0,backing/600,0,0);ctx.filter='none';
const obj=state.objective,z=obj/4,c=Math.max(0,Math.round(100-Math.abs(state.coarse+state.fine*.1)*(obj===4?18:obj===10?28:45)));
ctx.clearRect(0,0,600,600);ctx.save();ctx.beginPath();ctx.arc(300,300,270,0,Math.PI*2);ctx.clip();
const layer=microLayerContext,bright=Math.max(.24,state.light/100*(obj===4?1:obj===10?.94:.84));
const bg=`rgb(${Math.round(245*(.62+.38*bright))},${Math.round(246*(.62+.38*bright))},${Math.round(232*(.62+.38*bright))})`;
layer.clearRect(0,0,600,600);layer.fillStyle=bg;layer.fillRect(0,0,600,600);layer.save();layer.translate(300,300);layer.scale(-z,-z);layer.translate(state.stageX*1.6,-state.stageY*1.6);drawMicroCells(state.specimen,layer);layer.restore();ctx.fillStyle=bg;ctx.fillRect(0,0,600,600);blurredContext.clearRect(0,0,600,600);blurredContext.filter=`blur(${(100-c)/18}px)`;blurredContext.drawImage(microLayer,0,0);blurredContext.filter='none';ctx.drawImage(blurredLayer,0,0);const lightFactor=Math.max(0,Math.min(1,illumination()));if(lightFactor<1){ctx.save();ctx.fillStyle=`rgba(0,0,0,${1-lightFactor})`;ctx.fillRect(0,0,600,600);ctx.restore();}ctx.filter='none';
// Measurement/reference overlay stays crisp; specimen defocus remains unchanged.
if(state.specimen==='letter'){const limits=MICRO_SPECIMEN_BOUNDS.letter,u=MICRO_UM_TO_WORLD;ctx.save();ctx.translate(300,300);ctx.scale(-z,-z);ctx.translate(state.stageX*1.6,-state.stageY*1.6);ctx.beginPath();ctx.rect(-limits.halfX,-limits.halfY,limits.halfX*2,limits.halfY*2);ctx.clip();ctx.scale(u,u);ctx.strokeStyle='#FF8A7A';ctx.lineWidth=4/(u*z);ctx.beginPath();ctx.moveTo(-350,0);ctx.lineTo(350,0);ctx.moveTo(0,-350);ctx.lineTo(0,350);ctx.stroke();ctx.restore();}
const bar=microScale(obj);ctx.fillStyle=lightFactor<.3?'#FFF4DC':'#344e47';ctx.fillRect(220,500,bar.pixels,4);ctx.font='18px system-ui';ctx.fillText(bar.label,220,530);
if(!microSpecimenInView(state.specimen,obj,state.stageX,state.stageY)){ctx.fillStyle='#fffdf2e8';ctx.fillRect(110,250,380,85);ctx.fillStyle='#344e47';ctx.font='24px system-ui';ctx.textAlign='center';ctx.fillText('試片已移出視野',300,288);ctx.font='18px system-ui';ctx.fillText('請將玻片移回中央',300,319);ctx.textAlign='start';}
ctx.restore();canvas.setAttribute('aria-label',`程式繪製示意，非顯微照片。總倍率${obj*10}倍，視野${18/obj}毫米，清晰度${c}%。${lightFactor<1?`照明通光示意${Math.round(lightFactor*100)}%，不是對焦分數。`:""}`);
};}
