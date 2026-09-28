// Geometry and measurements use the tested models; selected illustrative textures are external assets.
export function diagram(id,s,r){
 if(["wave-sound","plant-exchange","ecosystem"].includes(id))return educationalScene(id,s,r);
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=(n,d=1)=>Number(n.toFixed(d));
 const line=(x1,y1,x2,y2,color='#436779',dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="7 5"':''}/>`;
 const text=(x,y,t,size=16)=>`<text x="${x}" y="${y}" font-size="${size}">${esc(t)}</text>`;
 const circle=(x,y,rad,color)=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${color}"/>`;
 const rect=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" rx="5" fill="${color}"/>`;
 const path=(d,color='#087b78',dash=false)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="6 4"':''}/>`;
 const arrow=(x1,y1,x2,y2,color='#087b78')=>line(x1,y1,x2,y2,color)+`<path d="M${x2},${y2} l-7,-7 m7,7 l-7,7" fill="none" stroke="${color}" stroke-width="2" transform="rotate(${Math.atan2(y2-y1,x2-x1)*180/Math.PI},${x2},${y2})"/>`;
 const bars=(labels,values,unit,max=null)=>{max=max||Math.max(1,...values.map(Math.abs));return values.map((v,i)=>text(35,65+i*65,labels[i],16)+rect(230,43+i*65,Math.abs(v)/max*300,24,['#087b78','#d97b11','#9364a1'][i%3])+text(240,90+i*65,`${num(v,3)} ${unit}`,14)).join('')};
 const plot=(fn,xmax,ymax,label)=>{let p='';for(let i=0;i<=100;i++){const x=xmax*i/100,y=fn(x);p+=(i?' L':'M')+(60+i*5.4)+','+(270-190*Math.max(0,Math.min(ymax,y))/ymax)}return line(60,40,60,270)+line(60,270,600,270)+path(p)+text(20,42,num(ymax,2),13)+text(40,290,'0',13)+text(550,290,num(xmax,2),13)+text(62,325,label,15)};
 let out='';
 switch(id){
 case 'optics':{
  const extent=Math.max(s.u,Math.abs(r.f)*2,Math.abs(r.v||0),20)*1.15,scale=280/extent,cx=330,axis=190;
  const h=45/Math.max(1,Math.abs(r.m||1)),ox=cx-s.u*scale,oy=axis-h;
  out=line(25,axis,635,axis,'#9aaeb9')+line(cx,45,cx,325,'#087b78')+text(cx-22,35,s.kind==='convex'?'凸透鏡':'凹透鏡',15);
  for(const a of [-2,-1,1,2])out+=circle(cx+a*s.f*scale,axis,3,'#142f46')+text(cx+a*s.f*scale-8,axis+24,Math.abs(a)===2?'2F':'F',12);
  out+=line(ox,axis,ox,oy,'#d97b11')+circle(ox,oy,4,'#d97b11')+text(ox-10,axis+48,'物',16);
  // Parallel incident ray and undeviated central ray.
  const end=625,rayY=oy+h*(end-cx)/(r.f*scale);
  out+=line(ox,oy,cx,oy,'#d97b11')+line(cx,oy,end,rayY,'#d97b11');
  const centralY=axis+h*(end-cx)/(s.u*scale);
  out+=line(ox,oy,end,centralY,'#466fa3');
  if(r.v!==null){const ix=cx+r.v*scale,iy=axis-r.m*h;out+=line(ix,axis,ix,iy,'#b54a5b')+circle(ix,iy,4,'#b54a5b')+text(ix-10,axis+70,'像',16);if(r.v<0)out+=line(cx,oy,ix,iy,'#d97b11',true)+line(cx,axis,ix,iy,'#466fa3',true)}
 out+=`<circle data-lab-drag="u" data-units-per-px="${-1/scale}" cx="${ox}" cy="${oy}" r="25" fill="#d97b11" fill-opacity=".12" stroke="#d97b11" stroke-width="2" stroke-dasharray="4 3" tabindex="0" role="button" aria-label="拖移物體改變物距，或按左右方向鍵"/>`;
  out+=text(30,360,'橘：平行入射光　藍：通過光心　虛線：反向延長',14);break;
 }
 case 'electromagnetism':{
  out=text(30,35,s.mode==='magnet'?'空心長線圈與有號磁場':'線圈法線與外加磁場',20);
  if(s.mode==='magnet'){
   for(let i=0;i<12;i++){
    const x=165+i*26;
    out+=`<path d="M${x},105 A13,65 0 0 0 ${x},235" fill="none" stroke="#e6b979" stroke-width="2" opacity=".58"/>`;
    out+=`<path d="M${x},105 A13,65 0 0 1 ${x},235" fill="none" stroke="#bf731a" stroke-width="4"/>`;
   }
   const fieldRight=r.output>0;
   out+=Math.abs(r.output)>1e-9?(fieldRight?`<g data-field-arrow data-x1="100" data-x2="545">${arrow(100,170,545,170)}</g>`:`<g data-field-arrow data-x1="545" data-x2="100">${arrow(545,170,100,170)}</g>`):text(255,175,'電流0：無場',16);
   if(s.current!==0){
    const frontUp=s.current<0,frontY1=frontUp?225:115,frontY2=frontUp?115:225;
    const north=fieldRight?'右':'左';
    out+=`<g data-front-current data-y1="${frontY1}" data-y2="${frontY2}" aria-label="前側電流向${frontUp?'上':'下'}，N 極在${north}">`;
    out+=text(105,92,fieldRight?'S 極':'N 極',18)+text(505,92,fieldRight?'N 極':'S 極',18)+arrow(320,frontY1,320,frontY2,'#ad452f')+text(350,255,'前側導線電流方向')+'</g>';
    out+=text(420,120,'粗實線：前半圈',14)+text(420,142,'淡線：後半圈',14);
   }
   out+=text(50,295,`N=${s.turns} 匝；I=${s.current} A；B=${num(r.field*1000,4)} mT`,18);
  }else{
   if(s.field!==0){for(let y=85;y<=245;y+=80)out+=s.field>0?arrow(90,y,550,y,'#8eabc1'):arrow(550,y,90,y,'#8eabc1')}else out+=text(90,80,'B=0：沒有外加磁場',18);
   out+=line(330,165,430,165,'#9aaeb9',true)+text(445,195,'向右基準軸',14);
   const th=s.angle*Math.PI/180,nx=Math.cos(th),ny=-Math.sin(th);
   out+=line(330-70*ny,165+70*nx,330+70*ny,165-70*nx,'#bf731a')+arrow(330,165,330+85*nx,165+85*ny,'#b54a5b')+text(420,290,`θ=${s.angle}°`,18)+text(50,290,'橘：線圈剖面　紅：法線',17);
   out+=text(50,325,s.mode==='motor'?`τ=${num(r.torque,4)} N·m（當下值）`:`ε=${num(r.emf,4)} V；轉速=${s.rpm} rpm`,18);
  }
  out+=text(40,365,'正負代表本頁固定方向約定；大小請讀數值。',15);break;
 }
 case 'pressure-fluid':{
  if(s.mode==='water'){out=rect(110,60,250,235,'#d4edf4')+line(100,60,370,60,'#14708d')+circle(235,60+s.depth/10*220,9,'#d97b11')+text(400,110,`深度 ${s.depth} m`,20)+text(400,150,`${num(r.absolute/1000)} kPa`,19)+text(400,190,'絕對壓力',17)+text(90,340,'同一液體，深度越大，液壓越大。',18)}
  else if(s.mode==='gas'){const w=s.volume/2*420;out=rect(75,75,w,150,'#dcf0e5')+line(75+w,55,75+w,245,'#b36e21')+text(90,290,`V=${s.volume} L；P=${num(r.absolute/1000)} kPa`,22)+text(90,330,'氣體量與溫度維持不變。',17);for(let i=0;i<18;i++)out+=circle(82+(i%6+.4)*Math.max(10,w-20)/6,95+Math.floor(i/6)*50,4,'#087b78')}
  else {const hh=50*Math.sqrt(s.ratio);out=path(`M50,110 H260 L370,${160-hh} H610 M50,210 H260 L370,${160+hh} H610`)+arrow(95,160,230,160)+arrow(415,160,560,160)+text(60,70,`入口 ${s.speed} m/s`,18)+text(360,70,`出口 ${num(r.v2)} m/s`,18)+text(50,285,`A₂/A₁=${s.ratio}；出口壓力 ${num(r.absolute/1000)} kPa`,20)+text(50,330,'同高、穩定流、不可壓縮、無黏性。',17)}break;
 }
 case 'solubility':{
  out=rect(85,75,220,205,'#d6eff5')+rect(85,280-r.solid/150*85,220,r.solid/150*85,'#b9b9bc')+path('M80,55 V285 H310 V55','#435f6e')+text(90,35,'溶液與剩餘固體（示意）',18)+text(350,95,`容量 ${num(r.capacity)} g`,20)+text(350,145,`已溶 ${num(r.dissolved)} g`,20)+text(350,195,`固體 ${num(r.solid)} g`,20)+text(90,330,`濃度 ${num(r.percent,2)}%（只計入溶液）`,20)+text(90,365,'A、B均為虛構教學溶質，不是實測曲線。',16);break;
 }
 case 'energy':{
  const p=s.progress/100;
  out=line(60,90,345,260,'#607e8d')+circle(60+285*p,75+170*p,14,'#d97b11')+text(45,320,`下降 ${s.progress}%`,18)+text(35,350,`速度 ${num(r.speed,2)} m/s`,18);
  const vals=[r.potential,r.kinetic,r.thermal],labels=['位能','動能','內能'];vals.forEach((v,i)=>{out+=rect(395+i*76,280-v/r.total*210,45,v/r.total*210,['#087b78','#d97b11','#9364a1'][i])+text(390+i*76,305,labels[i],15)+text(390+i*76,333,num(v,1)+' J',13)});
 out+=`<circle data-lab-drag="progress" data-units-per-px="${100/285}" cx="${60+285*p}" cy="${75+170*p}" r="25" fill="transparent" stroke="#d97b11" stroke-width="2" stroke-dasharray="4 3" tabindex="0" role="button" aria-label="拖移小球比較坡道位置，或按左右方向鍵"/>`;
  out+=text(390,45,`總能量 ${num(r.total,2)} J`,18);break;
 }
 case 'motion-graphs':{
  // 上：x-t；下：v-t（共用時間軸）。面積依時間軸上下分色，折返時刻以紅色虛線貫穿兩圖。
  const T=s.t,X0=78,X1=622,tx=u=>num(X0+(X1-X0)*u/T,1),xs=[],vs=[];
  for(let i=0;i<=120;i++){const u=T*i/120;xs.push([u,s.v0*u+s.a*u*u/2]);vs.push([u,s.v0+s.a*u])}
  const span=(arr,pad=1)=>{let lo=Math.min(0,...arr),hi=Math.max(0,...arr);if(hi-lo<pad){hi+=pad/2;lo-=pad/2}return [lo,hi]};
  const [xlo,xhi]=span(xs.map(p=>p[1])),[vlo,vhi]=span(vs.map(p=>p[1]));
  const top=[46,166],bot=[226,346],yX=v=>num(top[1]-(top[1]-top[0])*(v-xlo)/(xhi-xlo),1),yV=v=>num(bot[1]-(bot[1]-bot[0])*(v-vlo)/(vhi-vlo),1);
  const fmt=n=>{const v=Number(n.toFixed(1));return (v<0?'−':'')+Math.abs(v)};
  // v-t 面積：時間軸上方淡藍、下方淡紅（以折返時刻分段）
  const cut=r.turn,seg=(a,b)=>{const p=[[a,s.v0+s.a*a],[b,s.v0+s.a*b]];return `M${tx(a)},${yV(0)} L${tx(a)},${yV(p[0][1])} L${tx(b)},${yV(p[1][1])} L${tx(b)},${yV(0)} Z`};
  const parts=cut===null?[[0,T]]:[[0,cut],[cut,T]];
  for(const [a,b] of parts){const mid=s.v0+s.a*(a+b)/2;if(Math.abs(mid)<1e-9)continue;out+=`<path d="${seg(a,b)}" fill="${mid>0?'#cfe3f3':'#f3d2d6'}" stroke="none"/>`;
   const area=Math.abs((s.v0+s.a*a+s.v0+s.a*b)/2*(b-a));out+=text(num((tx(a)+tx(b))/2-26,1),num(mid>0?yV(0)-10:yV(0)+22,1),(mid>0?'+':'−')+fmt(area)+' m',14)}
  // 座標軸
  out+=line(X0,top[0],X0,top[1],'#436779')+line(X0,yX(0),X1,yX(0),'#436779')+line(X0,bot[0],X0,bot[1],'#436779')+line(X0,yV(0),X1,yV(0),'#436779');
  const tick=(y,t)=>`<text x="${X0-8}" y="${num(y+5,1)}" font-size="13" text-anchor="end">${esc(t)}</text>`;
  out+=text(X0+8,top[0]-12,'位置 x（m）',14)+text(X0+8,bot[0]-10,'速度 v（m/s）',14)+text(X1-78,bot[1]+18,'t（s）',14);
  out+=tick(yX(xhi),fmt(xhi))+tick(yX(xlo),fmt(xlo))+tick(yV(vhi),fmt(vhi))+tick(yV(vlo),fmt(vlo));
  out+=text(X0-4,bot[1]+18,'0',13)+text(X1-10,bot[1]+18,String(T),13);
  // 曲線
  out+=path('M'+xs.map(p=>tx(p[0])+','+yX(p[1])).join(' L'),'#087b78')+path('M'+vs.map(p=>tx(p[0])+','+yV(p[1])).join(' L'),'#d97b11');
  out+=circle(tx(T),yX(r.x),5,'#087b78')+circle(tx(T),yV(r.v),5,'#d97b11');
  if(cut!==null){out+=`<line data-turn x1="${tx(cut)}" y1="${top[0]-6}" x2="${tx(cut)}" y2="${bot[1]+4}" stroke="#b54a5b" stroke-width="2" stroke-dasharray="7 5"/>`+text(num(tx(cut)+6,1),bot[0]-10,'折返 t＝'+fmt(cut)+' s',14)}
  out+=text(20,390,'上：位置－時間（x-t）　下：速度－時間（v-t）；淡藍＝軸上方面積，淡紅＝軸下方面積',14);break;
 }
 case 'lever-torque':{
  // 槓桿依轉動方向固定傾斜 8°；有效力臂＝支點到力的作用線的垂線（紅色虛線）。
  const F=[330,196],sc=5.4,phi=(r.kind==='left'?-8:r.kind==='right'?8:0)*Math.PI/180,u=[Math.cos(phi),Math.sin(phi)];
  const at=d=>[num(F[0]+d*sc*u[0],1),num(F[1]+d*sc*u[1],1)],L=at(-52),R=at(52),W=at(-s.d1),A=at(s.d2);
  const th=s.angle*Math.PI/180,dir=[u[0]*Math.cos(th)-u[1]*Math.sin(th),u[0]*Math.sin(th)+u[1]*Math.cos(th)];
  const len=30+s.f2*4,tip=[num(A[0]+dir[0]*len,1),num(A[1]+dir[1]*len,1)];
  const k=(F[0]-A[0])*dir[0]+(F[1]-A[1])*dir[1],foot=[num(A[0]+dir[0]*k,1),num(A[1]+dir[1]*k,1)];
  out+=`<path d="M${F[0]},${F[1]} L${F[0]-26},${F[1]+48} L${F[0]+26},${F[1]+48} Z" fill="#9aaeb9"/>`+line(F[0]-60,F[1]+48,F[0]+60,F[1]+48,'#607e8d');
  out+=`<line x1="${L[0]}" y1="${L[1]}" x2="${R[0]}" y2="${R[1]}" stroke="#8a5a2b" stroke-width="10" stroke-linecap="round"/>`;
  for(let d=-50;d<=50;d+=10){const p=at(d);out+=`<line x1="${p[0]}" y1="${num(p[1]-5,1)}" x2="${p[0]}" y2="${num(p[1]+5,1)}" stroke="#f3e2c7" stroke-width="2"/>`}
  // 左側重物（鉛直向下）
  const box=18+s.w1*1.4;out+=line(W[0],W[1],W[0],num(W[1]+46,1),'#436779')+rect(num(W[0]-box/2,1),num(W[1]+46,1),num(box,1),num(box,1),'#607e8d')+text(num(W[0]-22,1),num(W[1]+box+68,1),s.w1+' N',16)+text(num(W[0]-26,1),num(W[1]-14,1),s.d1+' cm',14);
  // 右側施力：作用線（灰虛線）、力箭頭（橘）、有效力臂（紅虛線）與直角記號
  const ext=520;out+=`<line x1="${num(A[0]-dir[0]*ext,1)}" y1="${num(A[1]-dir[1]*ext,1)}" x2="${num(A[0]+dir[0]*ext,1)}" y2="${num(A[1]+dir[1]*ext,1)}" stroke="#9aaeb9" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  out+=arrow(A[0],A[1],tip[0],tip[1],'#d97b11')+text(num(tip[0]+8,1),num(tip[1]+6,1),s.f2+' N',16)+text(num(A[0]-20,1),num(A[1]-14,1),s.d2+' cm',14);
  out+=`<line data-arm x1="${F[0]}" y1="${F[1]}" x2="${foot[0]}" y2="${foot[1]}" stroke="#b54a5b" stroke-width="5" stroke-dasharray="9 5"/>`;
  if(Math.hypot(foot[0]-A[0],foot[1]-A[1])>12){const b=[foot[0]-dir[0]*10,foot[1]-dir[1]*10],n=[F[0]-foot[0],F[1]-foot[1]],nl=Math.hypot(n[0],n[1])||1,c=[b[0]+n[0]/nl*10,b[1]+n[1]/nl*10],e=[foot[0]+n[0]/nl*10,foot[1]+n[1]/nl*10];out+=`<path d="M${num(b[0],1)},${num(b[1],1)} L${num(c[0],1)},${num(c[1],1)} L${num(e[0],1)},${num(e[1],1)}" fill="none" stroke="#b54a5b" stroke-width="1.5"/>`}
  out+=circle(F[0],F[1],5,'#142f46')+text(20,36,'左側力矩 '+num(r.left,2)+' N·m　右側力矩 '+num(r.right,2)+' N·m',18);
  out+=text(20,382,'紅色虛線：有效力臂 '+num(r.effective,1)+' cm（支點到力的作用線的垂直距離）',15);break;
 }
 case 'pulley-incline':{
  // 裝置畫在左側 x<440；右下角長條比較輸入功與輸出功。
  const ink='#436779',rope='#8a5a2b',F=num(r.force,1),D=num(r.distance,2);
  const crate=(x,y,w=70,h=46)=>rect(x-w/2,y,w,h,'#c8955a')+text(x-26,y+29,s.load+' N',15);
  const pulley=(x,y,rad=24)=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="#e4edf2" stroke="${ink}" stroke-width="3"/>`+circle(x,y,4,ink);
  const seg=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${rope}" stroke-width="3"/>`;
  const label=(x,y,n)=>`<circle cx="${x}" cy="${y}" r="10" fill="#fff" stroke="#b54a5b" stroke-width="2"/><text x="${x}" y="${y+5}" font-size="13" text-anchor="middle">${n}</text>`;
  const ceiling=(x1,x2)=>line(x1,52,x2,52,ink)+Array.from({length:Math.floor((x2-x1)/16)},(_,i)=>line(x1+8+i*16,52,x1+i*16,44,'#9aaeb9')).join('');
  if(s.mode==='fixed'){
   out+=ceiling(170,330)+line(250,52,250,76,ink)+pulley(250,100)+seg(226,100,226,250)+seg(274,100,274,230)+crate(226,250)+arrow(274,230,274,300,'#d97b11')+text(284,300,'F＝'+F+' N',16)+arrow(150,300,150,250,'#087b78')+text(70,285,'上升 '+s.h+' m',14)+text(284,326,'向下拉 '+D+' m',14)+label(212,170,1);
  }else if(s.mode==='movable'){
   out+=ceiling(150,330)+seg(210,52,210,230)+seg(270,230,270,90)+pulley(240,230,30)+crate(240,262)+arrow(270,140,270,80,'#d97b11')+text(280,90,'F＝'+F+' N',16)+label(196,150,1)+label(284,180,2)+text(280,120,'向上拉 '+D+' m',14)+arrow(150,320,150,270,'#087b78')+text(62,305,'上升 '+s.h+' m',14);
  }else if(s.mode==='block'){
   const n=s.n,x0=250-(n-1)*14,xs=Array.from({length:n},(_,i)=>x0+i*28);
   out+=ceiling(150,350)+line(250,52,250,72,ink)+rect(x0-24,72,(n-1)*28+48,26,'#e4edf2')+rect(x0-24,210,(n-1)*28+48,26,'#e4edf2');
   xs.forEach((x,i)=>{out+=seg(x,98,x,210)+label(x,154,i+1)});out+=crate(250,236);
   const fx=x0+(n-1)*28+40;
   if(n%2===0)out+=seg(fx-16,85,fx,85)+seg(fx,85,fx,200)+arrow(fx,200,fx,270,'#d97b11')+text(fx+10,270,'F＝'+F+' N',16)+text(fx+10,294,'向下拉 '+D+' m',14);
   else out+=seg(fx-16,223,fx,223)+seg(fx,223,fx,130)+arrow(fx,130,fx,70,'#d97b11')+text(fx+10,82,'F＝'+F+' N',16)+text(fx+10,106,'向上拉 '+D+' m',14);
   out+=arrow(110,330,110,280,'#087b78')+text(40,316,'上升 '+s.h+' m',14)+text(40,360,'承重繩段 '+n+' 段（紅圈編號）',14);
  }else{
   const L=r.L,base=Math.sqrt(Math.max(0,L*L-s.h*s.h)),k=Math.min(360/Math.max(base,0.001),230/s.h,360/L),x0=60,y0=320,x1=num(x0+base*k,1),y1=num(y0-s.h*k,1);
   out+=`<path d="M${x0},${y0} L${x1},${y0} L${x1},${y1} Z" fill="#e8dcc6" stroke="${ink}" stroke-width="3"/>`;
   const ang=Math.atan2(y1-y0,x1-x0),mx=x0+(x1-x0)*.45,my=y0+(y1-y0)*.45,c=Math.cos(ang),sn=Math.sin(ang);
   out+=`<g transform="translate(${num(mx,1)},${num(my,1)}) rotate(${num(ang*180/Math.PI,1)})"><rect x="-26" y="-40" width="52" height="40" rx="4" fill="#c8955a"/><text x="-20" y="-15" font-size="13">${s.load} N</text></g>`;
   out+=arrow(num(mx+c*30,1),num(my+sn*30-20,1),num(mx+c*100,1),num(my+sn*100-20,1),'#d97b11')+text(num(mx+c*100+6,1),num(my+sn*100-26,1),'F＝'+F+' N',16);
   out+=text(num(x1+8,1),num((y0+y1)/2,1),'h＝'+s.h+' m',15)+text(num(x0+(x1-x0)*.12-10,1),num(y0+(y1-y0)*.12-22,1),'L＝'+num(L,2)+' m',15);
   if(r.clamped)out+=text(60,360,'斜面長不能短於高度：以 L＝h 計算',14);
  }
  // 功的比較
  const mx2=Math.max(r.input,r.output),bw=v=>num(150*v/mx2,1);
  out+=text(470,236,'功的比較（J）',15)+rect(470,248,bw(r.input),22,'#d97b11')+text(470,292,'輸入功 '+num(r.input,1),14)+rect(470,300,bw(r.output),22,'#087b78')+text(470,344,'輸出功 '+num(r.output,1),14);
  out+=text(20,32,'施力 '+F+' N × 移動 '+D+' m ＝ 輸入功 '+num(r.input,1)+' J',18);break;
 }
 case 'reaction-rate':{
  // 左：燒杯粒子示意（數量隨濃度、短線長度隨溫度）；右：產物—時間，實線為本次、虛線為基準條件，終點高度相同。
  let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
  out+=`<path d="M40,110 L40,330 Q40,350 60,350 L240,350 Q260,350 260,330 L260,110" fill="#e3f1f6" stroke="#436779" stroke-width="3"/>`;
  const nP=Math.round(s.conc*14),tail=6+10*Math.min(4,r.tempF);
  for(let i=0;i<nP;i++){const x=num(62+rnd()*176,1),y=num(140+rnd()*190,1),a=rnd()*Math.PI*2;out+=`<line x1="${x}" y1="${y}" x2="${num(x-Math.cos(a)*tail,1)}" y2="${num(y-Math.sin(a)*tail,1)}" stroke="#9aaeb9" stroke-width="2"/>`+circle(x,y,5,'#087b78')}
  const piece=s.size==='lump'?[[150,316,38]]:s.size==='granule'?[[118,322,20],[150,318,22],[184,322,20]]:Array.from({length:12},(_,i)=>[74+i*14,330-(i%3)*6,7]);
  piece.forEach(([x,y,w])=>out+=rect(x-w/2,y-w/2,w,w,'#b9b9bc'));
  if(s.cat==='yes')out+=`<path d="M226,134 l10,-16 l10,16 Z" fill="#d97b11"/>`+text(178,132,'催化劑',13);
  out+=text(40,96,'反應物溶液（示意）',16)+text(40,380,'點數≈濃度　短線≈粒子運動快慢',13);
  const X0=320,X1=630,Y0=320,Y1=100,tMax=Math.max(r.time,r.baseTime)*1.1,px=t=>num(X0+(X1-X0)*Math.min(t,tMax)/tMax,1),top=Y1;
  out+=line(X0,Y0,X1,Y0,'#436779')+line(X0,Y0,X0,Y1-10,'#436779')+text(X0,Y1-30,'產物量',15)+text(num((X0+X1)/2-30,1),Y0+22,'時間（s）',14)+text(X0-4,Y0+22,'0',13)+`<text x="${X1}" y="${Y0+22}" font-size="13" text-anchor="end">${num(tMax,0)} s</text>`;
  out+=`<path d="M${X0},${Y0} L${px(r.baseTime)},${top} L${X1},${top}" fill="none" stroke="#7c879b" stroke-width="3" stroke-dasharray="7 5"/>`;
  out+=`<path data-product-curve d="M${X0},${Y0} L${px(r.time)},${top} L${X1},${top}" fill="none" stroke="#d97b11" stroke-width="4"/>`;
  out+=line(px(r.time),top,px(r.time),Y0,'#d97b11',true)+`<text x="${Math.min(px(r.time)+6,X1-4)}" y="${Y0-8}" font-size="13" text-anchor="${px(r.time)>X1-80?'end':'start'}">完成 ${num(r.time,1)} s</text>`;
  out+=text(X0+8,top+20,'產物總量 '+r.product+' 單位',14)+text(X0,356,'實線：本次　虛線：基準條件',13)+text(X0,376,'（1 M、25°C、塊狀、無催化劑）',13);
  out+=text(20,36,'相對速率 '+num(r.rate,3)+'　完成時間 '+num(r.time,1)+' s',18);break;
 }
 case 'reflection-refraction':{
  // 所有角度都標在光線與法線（灰色虛線）之間。
  const D=Math.PI/180,sn=a=>Math.sin(a*D),cs=a=>Math.cos(a*D);
  const ray=(x1,y1,x2,y2,c,w=4,dash='')=>`<line x1="${num(x1,1)}" y1="${num(y1,1)}" x2="${num(x2,1)}" y2="${num(y2,1)}" stroke="${c}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
  const normal=(x1,y1,x2,y2)=>`<line data-normal x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7c879b" stroke-width="2" stroke-dasharray="6 5"/>`;
  // 角弧：頂點 O，從方向角 a0 到 a1（度，數學方向、y 向上），半徑 rr
  const tag=(x,y,t,c,anchor='start')=>`<text x="${x}" y="${y}" font-size="15" text-anchor="${anchor}" fill="${c}">${esc(t)}</text>`;
  const arc=(O,a0,a1,rr,c)=>{const p=a=>[num(O[0]+rr*Math.cos(a*D),1),num(O[1]-rr*Math.sin(a*D),1)],P0=p(a0),P1=p(a1),sweep=a1>a0?0:1;return Math.abs(a1-a0)<0.5?'':`<path d="M${P0[0]},${P0[1]} A${rr},${rr} 0 0 ${sweep} ${P1[0]},${P1[1]}" fill="none" stroke="${c}" stroke-width="2"/>`};
  if(s.mode==='refraction'){
   const O=[330,200],names={'air-water':['空氣','水'],'air-glass':['空氣','玻璃'],'water-air':['水','空氣'],'glass-air':['玻璃','空氣']}[s.media],fill=n=>n==='水'?'#d6ebf5':n==='玻璃'?'#e3e8f0':'#ffffff';
   out+=rect(20,60,620,140,fill(names[0]))+rect(20,200,620,150,fill(names[1]))+line(20,200,640,200,'#436779')+normal(330,60,330,350);
   out+=text(34,86,names[0]+'　n＝'+r.n1,16)+text(34,340,names[1]+'　n＝'+r.n2,16);
   const th=s.incident,L=170;out+=ray(O[0]-L*sn(th),O[1]-L*cs(th),O[0],O[1],'#d97b11');
   out+=arrow(num(O[0]-L*sn(th)*.55,1),num(O[1]-L*cs(th)*.55,1),num(O[0]-L*sn(th)*.45,1),num(O[1]-L*cs(th)*.45,1),'#d97b11');
   out+=ray(O[0],O[1],O[0]+150*sn(th),O[1]-150*cs(th),'#d97b11',r.kind==='tir'?4:2,r.kind==='tir'?'':'8 5');
   if(r.kind!=='tir'){const t2=r.refraction;out+=ray(O[0],O[1],O[0]+L*sn(t2),O[1]+L*cs(t2),'#b54a5b')+arc(O,270,270+t2,62,'#b54a5b')+tag(626,300,'折射角 '+num(t2,1)+'°','#b54a5b','end')}
   else out+=text(360,280,'沒有折射光：全反射',17);
   out+=arc(O,90,90+th,54,'#d97b11')+arc(O,90,90-th,78,'#087b78')+tag(34,130,'入射角 '+th+'°','#d97b11')+tag(626,110,'反射角 '+th+'°','#087b78','end');
   out+=text(20,36,r.kind==='tir'?'全反射（進階）：入射角 '+th+'° ＞ 臨界角 '+num(r.critical,2)+'°':'n₁ sinθ₁ ＝ n₂ sinθ₂',18)+text(20,384,'灰色虛線是法線；角度都從法線量起。細虛線是部分反射光。',14);
  }else{
   // 上：一條光線在鏡面反射（法線水平）；下：物與像
   const MX=380,H=[MX,120],th=s.incident,L=150;
   out+=line(MX,56,MX,356,'#436779');for(let y=60;y<=350;y+=14)out+=line(MX,y,MX+10,y-8,'#9aaeb9');
   out+=normal(MX-190,120,MX,120)+ray(H[0]-L*cs(th),H[1]-L*sn(th),H[0],H[1],'#d97b11')+ray(H[0],H[1],H[0]-L*cs(th),H[1]+L*sn(th),'#087b78');
   out+=arc(H,180,180-th,50,'#d97b11')+arc(H,180,180+th,74,'#087b78')+tag(34,100,'入射角 '+th+'°','#d97b11')+tag(34,196,'反射角 '+th+'°','#087b78');
   const sc=5,base=330,top=260,ox=MX-s.dist*sc,ix=MX+s.dist*sc,flag=(x,dir,dash)=>`<path d="M${x},${base} L${x},${top} L${x+dir*22},${top} M${x},${top+22} L${x+dir*15},${top+22}" fill="none" stroke="${dash?'#7c879b':'#142f46'}" stroke-width="4"${dash?' stroke-dasharray="6 4"':''}/>`;
   out+=flag(ox,1,false)+flag(ix,-1,true)+text(ox-8,base+22,'物',15)+text(ix-8,base+22,'像',15);
   const M2=[MX,300];out+=ray(ox,top,MX,top,'#b54a5b',2)+ray(MX,top,ox-40,top,'#b54a5b',2)+ray(MX,top,ix,top,'#b54a5b',2,'5 4');
   const k=(M2[1]-top)/(MX-ox);out+=ray(ox,top,M2[0],M2[1],'#b54a5b',2)+ray(M2[0],M2[1],M2[0]-160,M2[1]+160*k,'#b54a5b',2)+ray(M2[0],M2[1],ix,top,'#b54a5b',2,'5 4');
   out+=line(ox,base,ix,base,'#9aaeb9')+text(num((ox+MX)/2-20,1),base+44,s.dist+' cm',14)+text(num((MX+ix)/2-20,1),base+44,s.dist+' cm',14);
   out+=text(20,36,'反射角＝入射角；像距＝物距',18)+text(430,90,'虛線：反向延長線',14);
  }
  break;
 }
 case 'atom-builder':{
  // 左：波耳同心圓模型（簡化）；右上：前 20 號的迷你週期表，目前元素紅框。
  const C=[200,204],R=[54,90,126,160];out+=`<circle cx="${C[0]}" cy="${C[1]}" r="32" fill="#f3d2d6" stroke="#b54a5b" stroke-width="2"/>`;
  out+=`<text x="${C[0]}" y="${C[1]-3}" font-size="14" text-anchor="middle">${s.p} p⁺</text><text x="${C[0]}" y="${C[1]+15}" font-size="14" text-anchor="middle">${s.n} n</text>`;
  r.shells.forEach((k,i)=>{out+=`<circle data-shell="${i+1}" cx="${C[0]}" cy="${C[1]}" r="${R[i]}" fill="none" stroke="#9aaeb9" stroke-width="2"/>`;for(let j=0;j<k;j++){const a=-Math.PI/2+j*2*Math.PI/k+i*0.3;out+=`<circle data-electron cx="${num(C[0]+R[i]*Math.cos(a),1)}" cy="${num(C[1]+R[i]*Math.sin(a),1)}" r="7" fill="#2f6fb2"/>`}});
  if(!r.shells.length)out+=text(C[0]-40,C[1]+70,'沒有電子',14);
  const x0=402,y0=46,w=30,h=30,pos=(z,E)=>{const period=z<=2?1:z<=10?2:z<=18?3:4;return [x0+(E[1]-1)*w,y0+(period-1)*h]};
  r.table.forEach((E,i)=>{const [x,y]=pos(i+1,E),cur=i+1===s.p;out+=`<rect x="${x}" y="${y}" width="${w-2}" height="${h-2}" fill="${cur?'#fff':'#f2f4f7'}" stroke="${cur?'#b54a5b':'#c9d2de'}" stroke-width="${cur?3:1}"${cur?' data-current':''}/>`+`<text x="${x+(w-2)/2}" y="${y+19}" font-size="13" text-anchor="middle">${E[0]}</text>`});
  out+=text(x0,y0+4*h+22,'前 20 號元素（主族）',13);
  out+=`<text x="${x0}" y="${y0+4*h+64}" font-size="30" font-weight="700">${esc(r.ion||r.symbol)}</text>`+text(x0,y0+4*h+92,r.name+'　A＝'+r.A+'　'+(r.charge===0?'電中性':'電荷 '+(r.charge>0?'+':'−')+Math.abs(r.charge)),15);
  out+=text(x0,y0+4*h+118,'電子層：'+(r.shells.length?r.shells.join('、'):'無'),15);
  out+=text(20,392,'紅＝原子核（質子、中子）　藍＝電子　同心圓只是簡化模型',13);break;
 }
 case 'moon-eclipse':{
  return moonScene(s,r);
 }
 case 'seasons':{
  const alt=r.altitude*Math.PI/180,sunX=310+145*Math.cos(alt),sunY=210-145*Math.sin(alt);
  out=path('M70,210 A240,160 0 0 1 550,210','#bdcfd8',true)+line(60,210,610,210,'#436779')+text(450,237,'地平線',16)+circle(310,210,9,'#087b78')+line(310,210,sunX,sunY,'#d97b11')+circle(sunX,sunY,15,'#efb633')+text(45,35,'正午天空示意',20)+text(45,310,`高度 ${num(r.altitude,2)}°　赤緯 ${num(r.declination,2)}°`,20)+text(45,350,r.boundary?'極點春秋分：太陽中心貼地平線':`理想日長 ${num(r.hours,2)} 小時`,20);break;
 }

 }
 let extra='';
 if(id==='seasons'){
  const a=s.season*Math.PI/180,tilt=s.tilt*Math.PI/180,axisX=20*Math.sin(tilt),axisY=-20*Math.cos(tilt);
  const earth=(x,y,active=false)=>`<circle cx="${x}" cy="${y}" r="16" fill="${active?'#248273':'#77a8bc'}"/><line x1="${x-axisX}" y1="${y-axisY}" x2="${x+axisX}" y2="${y+axisY}" stroke="#30374a" stroke-width="3"/><text x="${x+axisX+4}" y="${y+axisY-4}" font-size="12">北</text>`;
  extra=`<svg viewBox="0 0 660 310" role="img" aria-label="地球公轉位置與平行地軸示意；北端固定朝畫面右上方。公轉角 ${s.season} 度，地軸傾角 ${s.tilt} 度。"><text x="25" y="30" font-size="20">為什麼有四季？比較地軸朝向</text><ellipse cx="330" cy="155" rx="150" ry="85" fill="none" stroke="#acbcbc" stroke-dasharray="5 5"/><circle cx="330" cy="155" r="28" fill="#f0b946"/><text x="310" y="204" font-size="16">太陽</text>${[[330,70],[180,155],[330,240],[480,155]].map(([x,y])=>earth(x,y)).join('')}${earth(330-150*Math.sin(a),155-85*Math.cos(a),true)}<circle cx="${330-150*Math.sin(a)}" cy="${155-85*Math.cos(a)}" r="25" fill="none" stroke="#b95215" stroke-width="3"/><text x="25" y="288" font-size="16">橘圈：目前位置；各處地軸保持平行。尺寸與距離未按比例。</text></svg>`;
 }
 if(id==='solubility'){
  const fn=temp=>s.solute==='a'?20+.5*temp:35+.025*temp;
  extra=`<svg viewBox="0 0 660 360" role="img" aria-label="教學溶解度曲線，橫軸溫度0到80°C，縱軸每100g水可溶的克數0到65g">${plot(fn,80,65,'溫度（°C）；縱軸：g／100g水')}${circle(60+s.temperature/80*540,270-r.solubility/65*190,6,'#b54a5b')}${text(100,35,'模型'+s.solute.toUpperCase()+' 溶解度曲線（非實測）',18)}</svg>`;
 }
 // 含可拖曳／可聚焦把手的圖不能用 role="img"：img 的子孫對輔助科技是隱藏的，裡面再放 role="button" 會觸發 axe nested-interactive。
 return `<svg viewBox="0 0 660 400" role="${out.includes('data-lab-drag')?'group':'img'}" aria-labelledby="diagram-title diagram-desc"><title id="diagram-title">本次${esc(id)}模型圖解</title><desc id="diagram-desc">與下方數值同步，完整數據見觀察結果。圖形為教學示意，請閱讀模型限制。</desc><defs><clipPath id="scene-clip"><rect width="660" height="400"/></clipPath></defs><g clip-path="url(#scene-clip)">${out}</g></svg>`+extra;
}

// Orthographic phase boundary. Its lit area is pi*R²*(1-cos(phase))/2.
export function moonLitPath(phase,R=100,cx=200,cy=160){
 const a=phase*Math.PI/180,waxing=Math.sin(a)>=0,left=[],right=[];
 for(let y=-R;y<=R;y++){const edge=Math.sqrt(Math.max(0,R*R-y*y)),bound=Math.cos(a)*edge;left.push([cx+(waxing?bound:-edge),cy+y]);right.push([cx+(waxing?edge:-bound),cy+y]);}
 return 'M'+left.concat(right.reverse()).map(p=>p.map(n=>Number(n.toFixed(3))).join(',')).join(' L')+' Z';
}
function moonScene(s,r){
 const a=r.phase*Math.PI/180,x=175+105*Math.cos(a),y=165-95*Math.sin(a),n=s.node*Math.PI/180;
 const phaseName=r.phase===0?'朔（新月）':r.phase===90?'上弦月':r.phase===180?'望（滿月）':r.phase===270?'下弦月':r.phase<90?'眉月':r.phase<180?'盈凸月':r.phase<270?'虧凸月':'殘月';
 const img='<image href="../../assets/science/moon-texture.webp" x="89" y="49" width="222" height="222"/>';
 return `<div class="moon-panels"><section class="moon-panel"><h3>① 從地球看月亮</h3><svg viewBox="0 0 400 330" role="img" aria-label="${phaseName}，可見亮面 ${(r.lit*100).toFixed(1)}%，北向朝上示意"><defs><clipPath id="moonDisk"><circle cx="200" cy="160" r="100"/></clipPath><clipPath id="moonLit"><path d="${moonLitPath(r.phase)}"/></clipPath></defs><circle cx="200" cy="160" r="101" fill="#233750"/><g clip-path="url(#moonDisk)">${img}<circle cx="200" cy="160" r="100" fill="#081629" opacity=".95"/><g clip-path="url(#moonLit)"><circle cx="200" cy="160" r="100" fill="#d6d9db"/>${img}</g></g><text x="200" y="295" text-anchor="middle" font-size="23">${phaseName} · 亮面 ${(r.lit*100).toFixed(0)}%</text></svg><p>北向朝上示意。月面紋理為插畫；亮暗邊界依角度計算。</p></section><section class="moon-panel"><h3>② 從太空看相對位置</h3><svg viewBox="0 0 400 330" role="img" aria-label="軌道俯視圖，太陽在右側；月球相位角 ${r.phase} 度，黃緯 ${r.latitude.toFixed(2)} 度"><defs><radialGradient id="earthShade" cx="80%" cy="40%"><stop stop-color="#79d4e8"/><stop offset=".55" stop-color="#227db0"/><stop offset="1" stop-color="#16334c"/></radialGradient><radialGradient id="sunShade"><stop stop-color="#fff0bb"/><stop offset="1" stop-color="#efad30"/></radialGradient><clipPath id="earthDisk"><circle cx="175" cy="165" r="24"/></clipPath></defs><ellipse cx="175" cy="165" rx="105" ry="95" fill="none" stroke="#55718e" stroke-width="1.5"/><line x1="${175-120*Math.cos(n)}" y1="${165+108*Math.sin(n)}" x2="${175+120*Math.cos(n)}" y2="${165-108*Math.sin(n)}" stroke="#9fb4c9" stroke-dasharray="5 5"/><circle cx="175" cy="165" r="24" fill="url(#earthShade)"/><g clip-path="url(#earthDisk)" fill="#67af9b"><path d="M171 146 l13 2 -6 9 8 7 -8 10 -8 -7 -5 -12 Z"/><path d="M184 178 l9 -3 2 10 -8 3 Z"/></g><text x="150" y="209" font-size="18">地球</text><circle cx="350" cy="165" r="25" fill="url(#sunShade)"/><text x="327" y="209" font-size="18">太陽</text><line x1="350" y1="60" x2="245" y2="60" stroke="#f3ca71" stroke-width="2"/><path d="M255 53 L245 60 L255 67" fill="none" stroke="#f3ca71" stroke-width="2"/><text x="260" y="42" font-size="16">太陽光</text><circle cx="${x}" cy="${y}" r="12" fill="#415168"/><path d="M${x} ${y-12} A12 12 0 0 1 ${x} ${y+12} Z" fill="#f5e4b6"/><text x="${x}" y="${y-21}" text-anchor="middle" font-size="17">月球</text><text x="200" y="301" text-anchor="middle" font-size="18">軌道黃緯 ${r.latitude.toFixed(2)}°</text></svg><p>虛線是交點方向；圖中尺寸與距離經縮放，垂直偏離請讀黃緯。</p></section></div><div class="moon-explanation"><p><strong>先比較兩個視角：</strong>太陽一直照亮月球約一半；從地球能看見多少亮面，取決於相對位置。</p><p>月相不是地球影子。要研究日月食，再打開「進階：軌道與交點」，比較黃緯與對齊條件。</p></div>`;
}

function learningCard(title,body,note){return `<section class="diagram-card"><h3>${title}</h3>${body}<p>${note}</p></section>`}
function educationalScene(id,s,r){
 const n=v=>Number(v.toFixed(3));
 const svg=(label,body,h=300)=>`<svg viewBox="0 0 660 ${h}" role="img" aria-label="${label}">${body}</svg>`;
 if(id==='wave-sound'){
  const standing=r.kind==='resonant';let d='';
  for(let i=0;i<=240;i++){const u=i/240,y=standing?(s.mode==='closed'?Math.sin(r.n*Math.PI*u/2):Math.cos(r.n*Math.PI*u)):Math.sin(2*Math.PI*s.length*u/r.wavelength);d+=(i?'L':'M')+(45+570*u)+','+(130-55*y)}
  let marks='';for(let i=0;i<=4;i++)marks+=`<line x1="${45+i*142.5}" y1="190" x2="${45+i*142.5}" y2="196" stroke="#7893a5"/><text x="${45+i*142.5}" y="219" text-anchor="middle" font-size="16">${n(s.length*i/4)}</text>`;
  const wave=svg('位移對位置截面；長度 '+s.length+' 公尺，波長 '+n(r.wavelength)+' 公尺',`<rect x="20" y="20" width="620" height="220" rx="14" fill="#edf6fa"/><text x="35" y="48" font-size="18">${standing?'最近共振模態':'驅動波'}：位移截面</text><line x1="45" y1="130" x2="615" y2="130" stroke="#abc4d1" stroke-dasharray="5 5"/><path d="${d}" stroke="#087b78" stroke-width="4" fill="none"/><line x1="45" y1="190" x2="615" y2="190" stroke="#7893a5"/>${marks}<text x="330" y="266" text-anchor="middle" font-size="18">位置（m）｜λ = ${n(r.wavelength)} m</text>`);
  let particle='';for(let i=0;i<=56;i++){const x=55+i*9.8,dx=7*Math.sin(2*Math.PI*s.length*i/56/r.wavelength);particle+=`<circle cx="${x+dx}" cy="80" r="${i===28?6:3.4}" fill="${i===28?'#bf6b13':'#4b8294'}"/>`}
  const longitudinal=s.mode==='travel'?learningCard('② 空氣粒子沿傳播方向前後位移',svg('縱波粒子位置示意；橙點為一個標記粒子',`<rect x="20" y="30" width="620" height="100" rx="15" fill="#f2f8f6"/><line x1="329.4" y1="48" x2="329.4" y2="112" stroke="#bf6b13" stroke-dasharray="4 4"/>${particle}<text x="330" y="160" text-anchor="middle" font-size="17">虛線：標記粒子的平衡位置</text>`,190),'這是單一時刻的示意；粒子位移刻意放大，疏密不能當實測壓力。上方曲線不是粒子的行走路線。'):learningCard('② 端點要看「位移」',`<p><strong>${s.mode==='closed'?'左閉口：位移波節；右開口：位移波腹。':'左右開口：位移波腹。'}</strong></p>`,'只有接近共振時，上圖才顯示最近共振模態。偏離時顯示驅動波比較，不代表符合端點條件；壓力波節、波腹與位移相反。');
  return learningCard('① 先讀波長與位置',wave,'固定聲速，只改頻率，再比較完整波段數；振幅是繪圖設定，不用來推算音量。')+longitudinal;
 }
 if(id==='plant-exchange'){
  const max=Math.max(8,r.photo,r.respiration),gap=s.stomata/100*28,cx=330,cy=110;
  const bars=[['總光合 P',r.photo,'#237957'],['呼吸 R',r.respiration,'#ae6b22']].map(([label,v,color],i)=>`<text x="30" y="${55+i*65}" font-size="20">${label}</text><rect x="180" y="${33+i*65}" width="${v/max*300}" height="28" rx="6" fill="${color}"/><text x="505" y="${55+i*65}" font-size="20">${n(v)}</text>`).join('');
  const gas=svg('總光合 '+n(r.photo)+'、呼吸 '+n(r.respiration)+'、淨氧 '+n(r.net)+'，均為相對指標',bars+`<rect x="25" y="165" width="610" height="70" rx="12" fill="#e7f3ee"/><text x="45" y="195" font-size="20">淨氧 P − R = ${n(r.net)}</text><text x="45" y="223" font-size="17">${r.kind==='release'?'淨釋出氧氣':r.kind==='consume'?'淨消耗氧氣':'淨交換接近零'}</text>`,255);
  const left=`M${cx-gap},${cy-62} C${cx-62},${cy-85} ${cx-145},${cy-62} ${cx-145},${cy} C${cx-145},${cy+62} ${cx-62},${cy+85} ${cx-gap},${cy+62} C${cx-gap-28},${cy+35} ${cx-gap-28},${cy-35} ${cx-gap},${cy-62} Z`;
  const right=`M${cx+gap},${cy-62} C${cx+62},${cy-85} ${cx+145},${cy-62} ${cx+145},${cy} C${cx+145},${cy+62} ${cx+62},${cy+85} ${cx+gap},${cy+62} C${cx+gap+28},${cy+35} ${cx+gap+28},${cy-35} ${cx+gap},${cy-62} Z`;
  const poreLine=gap===0?`<line x1="${cx}" y1="${cy-48}" x2="${cx}" y2="${cy+48}" stroke="#24593b" stroke-width="2"/>`:`<path d="M${cx-gap},${cy-48} Q${cx},${cy-58} ${cx+gap},${cy-48} M${cx-gap},${cy+48} Q${cx},${cy+58} ${cx+gap},${cy+48}" fill="none" stroke="#24593b" stroke-width="2"/>`;
  const pore=svg('氣孔開度 '+s.stomata+'%；兩個保衛細胞左右相鄰且凹面相對；蒸散指標 '+n(r.transpiration),`<rect x="20" y="15" width="620" height="195" rx="16" fill="#eff7eb"/><g fill="#8cc190" stroke="#37794c" stroke-width="3"><path class="guard-cell guard-cell-left" d="${left}"/><path class="guard-cell guard-cell-right" d="${right}"/></g>${poreLine}<text x="45" y="47" font-size="18">保衛細胞外形示意</text><text x="330" y="245" text-anchor="middle" font-size="20">開度 ${s.stomata}%｜蒸散 ${n(r.transpiration)}</text>`,270);
  return learningCard('① 氣體交換：先比較 P 與 R',gas,'數值為無單位教學指標。P 是總光合作用；扣除呼吸 R 後才是淨交換。')+learningCard('② 水分散失：另外觀察氣孔',pore,'開度是學生設定，圖形不按真實尺寸；濕度、氣孔開度與溫度共同影響本模型蒸散指標。');
 }
 if(id==='ecosystem'){
  const arrow=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#4b7d7c" stroke-width="3" fill="none" marker-end="url(#food-tip)"/>`;
  const node=(x,y,w,label,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="48" rx="14" fill="${fill}" stroke="#9cbcb7"/><text x="${x+w/2}" y="${y+31}" text-anchor="middle" font-size="20">${label}</text>`;
  const food=svg('能量由食物指向取食者：草到兔及昆蟲，兔到狐，昆蟲到鳥，鳥到狐',`<defs><marker id="food-tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#4b7d7c"/></marker></defs>${arrow(142,105,266,65)}${arrow(142,126,266,173)}${arrow(368,55,500,55)}${arrow(368,182,500,182)}${arrow(552,156,552,87)}${node(40,92,100,'草','#e0eedc')}${node(270,30,96,'兔','#f5e8d0')}${node(270,158,96,'昆蟲','#f5e8d0')}${node(505,30,96,'狐','#f3d9c7')}${node(505,158,96,'鳥','#e4edf7')}`,240);
  const max=Math.max(s.capacity,s.initial)*1.1,x=t=>65+t/30*525,y=v=>240-v/max*185;
  let d='';for(let i=0;i<=100;i++){const t=i*.3,v=s.capacity/(1+(s.capacity/s.initial-1)*Math.exp(-s.rate*t));d+=(i?'L':'M')+x(t)+','+y(v)}
  const graph=svg('單一族群成長；時間 '+s.time+'、族群數量 '+n(r.population)+'、承載量 '+s.capacity,`<rect x="30" y="15" width="600" height="265" rx="12" fill="#f2f7fb"/><text x="45" y="39" font-size="17">族群數量（連續期望值）</text><path d="M65 52 V240 H602" stroke="#7792a7" fill="none"/><line x1="65" y1="${y(s.capacity)}" x2="600" y2="${y(s.capacity)}" stroke="#af7734" stroke-dasharray="6 5"/><text x="465" y="${y(s.capacity)-9}" font-size="16">K=${s.capacity}</text><path d="${d}" fill="none" stroke="#087b78" stroke-width="4"/><circle cx="${x(s.time)}" cy="${y(r.population)}" r="6" fill="#b74c57"/><text x="65" y="263" font-size="16">0</text><text x="305" y="263" font-size="16">15</text><text x="580" y="263" font-size="16">30</text><text x="330" y="300" text-anchor="middle" font-size="18">時間｜目前 N = ${n(r.population)}</text>`,325);
  return learningCard('① 食物網：箭頭表示能量方向',food,'從被吃者指向取食者；這張關係圖不會依下方單一族群曲線改變。')+learningCard('② 單一族群：比較 N 與承載量 K',graph,'紅點是目前時間，虛線是承載量。固定 K、r 的模型不包含多物種掠食或季節變化。');
 }
}
