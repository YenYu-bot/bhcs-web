const microCache=new Map();
const microLayer=document.createElement('canvas');microLayer.width=600;microLayer.height=600;
const microLayerContext=microLayer.getContext('2d');
function microPath(points,ctx){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
function drawMicroCells(kind,ctx=microLayerContext){
 const z=objective()/4,b=visibleBounds(z),u=MICRO_UM_TO_WORLD;
 if(kind==='letter'){
  ctx.save();ctx.scale(u,u);ctx.fillStyle='rgba(36,61,66,.92)';ctx.font='700 1200px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('e',420,-160);ctx.strokeStyle='rgba(190,72,55,.78)';ctx.lineWidth=4/(u*z);ctx.beginPath();ctx.moveTo(-350,0);ctx.lineTo(350,0);ctx.moveTo(0,-350);ctx.lineTo(0,350);ctx.stroke();ctx.restore();return;
 }
 const {w,h}=MICRO_SIZES[kind];
 const col0=Math.floor(b.minX/u/w)-2,col1=Math.ceil(b.maxX/u/w)+2,row0=Math.floor(b.minY/u/h)-2,row1=Math.ceil(b.maxY/u/h)+2;
 ctx.save();ctx.scale(u,u);ctx.lineJoin='round';
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
function drawOnion(){drawMicroCells('onion')}
function drawCheek(){drawMicroCells('cheek')}
function drawElodea(){drawMicroCells('elodea')}
function drawScope(){
 const canvas=$('scope'),obj=objective(),z=obj/4,light=+els.light.value/100,magDim=obj===4?1:obj===10?.94:.84,bright=Math.max(.24,light*magDim),c=clarity();
 ctx.clearRect(0,0,600,600);ctx.fillStyle='#1b2c38';ctx.fillRect(0,0,600,600);ctx.save();ctx.beginPath();ctx.arc(300,300,MICRO_FIELD_PX/2,0,Math.PI*2);ctx.clip();
 // Render sharply to a layer, then blur once. Per-cell blur is very slow at low power.
 const layer=microLayerContext;layer.clearRect(0,0,600,600);layer.fillStyle=baseBackground(bright);layer.fillRect(0,0,600,600);layer.save();layer.translate(300,300);layer.scale(-z,-z);layer.translate(+els.stageX.value,-(+els.stageY.value));drawMicroCells(els.specimen.value,layer);layer.restore();ctx.fillStyle=baseBackground(bright);ctx.fillRect(0,0,600,600);ctx.filter=`blur(${((100-c)/18).toFixed(2)}px)`;ctx.drawImage(microLayer,0,0);ctx.restore();ctx.filter='none';
 ctx.save();ctx.beginPath();ctx.arc(300,300,MICRO_FIELD_PX/2,0,Math.PI*2);ctx.strokeStyle='#f7fafc';ctx.lineWidth=3;ctx.stroke();ctx.clip();
 const bar=microScale(obj);ctx.fillStyle='rgba(20,38,40,.78)';ctx.fillRect(bar.x-12,bar.y-15,bar.pixels+24,57);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(bar.x,bar.y);ctx.lineTo(bar.x+bar.pixels,bar.y);ctx.stroke();ctx.fillStyle='#fff';ctx.font='700 18px system-ui, Microsoft JhengHei';ctx.fillText(bar.label,bar.x,bar.labelY);
 if(c<28){ctx.fillStyle='rgba(16,42,67,.7)';ctx.fillRect(185,270,230,58);ctx.fillStyle='#fff';ctx.font='800 22px Microsoft JhengHei';ctx.textAlign='center';ctx.fillText('影像離焦，請調整焦距',300,307);ctx.textAlign='start';}ctx.restore();
 canvas.setAttribute('aria-label',`程式繪製示意，非顯微照片。${specimens[els.specimen.value].name}，總倍率 ${10*obj} 倍，視野直徑 ${fmt(fov(obj))} 毫米，比例尺 ${bar.label}，清晰度 ${c}%`);updateReadouts();updateSlideBoard();
}
