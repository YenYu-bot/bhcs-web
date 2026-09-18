// Geometry and measurements use the tested models; selected illustrative textures are external assets.
export function diagram(id,s,r){
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
  out+=text(30,360,'橘：平行入射光　藍：通過光心　虛線：反向延長',14);break;
 }
 case 'wave-sound':{
  const standing=r.kind==='resonant',n=r.n;
  let p='';for(let i=0;i<=200;i++){let u=i/200;const value=standing?(s.mode==='closed'?Math.sin(n*Math.PI*u/2):Math.cos(n*Math.PI*u)):Math.sin(2*Math.PI*s.length*u/r.wavelength);p+=(i?'L':'M')+(50+560*u)+','+(160-65*value)}
  out=line(50,160,610,160,'#aaa')+path(p)+text(35,35,standing?'最近共振模態：位移截面':'驅動波比較：位移截面',19)+text(48,270,`長度 ${s.length} m；λ=${num(r.wavelength,3)} m`,17);
  if(s.mode==='closed')out+=line(50,60,50,245,'#142f46')+text(40,305,'閉口：位移波節',16);
  else if(s.mode==='open')out+=text(40,305,'左開口：位移波腹',16);
  if(s.mode!=='travel')out+=text(370,305,'右開口：位移波腹',16);
  out+=text(40,350,'聲波為縱波，曲線不是空氣粒子的行走軌跡。',16);break;
 }
 case 'electromagnetism':{
  out=text(30,35,s.mode==='magnet'?'空心長線圈與有號磁場':'線圈法線與外加磁場',20);
  if(s.mode==='magnet'){
   for(let i=0;i<12;i++)out+=`<ellipse cx="${165+i*26}" cy="170" rx="13" ry="65" fill="none" stroke="#bf731a" stroke-width="3"/>`;
   out+=Math.abs(r.output)>1e-9?(r.output>0?arrow(100,170,545,170):arrow(545,170,100,170)):text(255,175,'電流0：無場',16);
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
  out+=text(390,45,`總能量 ${num(r.total,2)} J`,18);break;
 }
 case 'moon-eclipse':{
  return moonScene(s,r);
 }
 case 'seasons':{
  const alt=r.altitude*Math.PI/180,sunX=310+145*Math.cos(alt),sunY=210-145*Math.sin(alt);
  out=path('M70,210 A240,160 0 0 1 550,210','#bdcfd8',true)+line(60,210,610,210,'#436779')+text(450,237,'地平線',16)+circle(310,210,9,'#087b78')+line(310,210,sunX,sunY,'#d97b11')+circle(sunX,sunY,15,'#efb633')+text(45,35,'正午天空示意',20)+text(45,310,`高度 ${num(r.altitude,2)}°　赤緯 ${num(r.declination,2)}°`,20)+text(45,350,r.boundary?'極點春秋分：太陽中心貼地平線':`理想日長 ${num(r.hours,2)} 小時`,20);break;
 }
 case 'plant-exchange':{
  out=bars(['總光合作用','呼吸作用'],[r.photo,r.respiration],'相對值',Math.max(8,r.photo,r.respiration));
  const gap=s.stomata/100*40;
  out+=`<ellipse cx="${270-gap/2}" cy="235" rx="20" ry="45" fill="#70ae7c"/><ellipse cx="${310+gap/2}" cy="235" rx="20" ry="45" fill="#70ae7c"/>`+text(35,230,`氣孔開度 ${s.stomata}%`,17)+text(380,240,`蒸散 ${num(r.transpiration,3)}`,17)+text(45,325,`淨氧氣 ${num(r.net,2)}（P−R，相對值）`,20)+text(45,365,'氣孔、呼吸、蒸散不是同一個過程。',17);break;
 }
 case 'ecosystem':{
  out=text(35,32,'食物網關係（箭頭由食物指向取食者）',18)+text(40,93,'草')+text(240,73,'兔')+text(240,143,'昆蟲')+text(460,73,'狐')+text(460,143,'鳥')+arrow(80,85,220,67)+arrow(80,95,220,135)+arrow(275,68,440,68)+arrow(285,135,440,135)+arrow(480,122,480,90);
  let p='';for(let i=0;i<=100;i++){const time=i*.3,y=s.capacity/(1+(s.capacity/s.initial-1)*Math.exp(-s.rate*time)),max=Math.max(s.capacity,s.initial)*1.1;p+=(i?'L':'M')+(60+i*5.4)+','+(340-y/max*140)}
  const max=Math.max(s.capacity,s.initial)*1.1,ky=340-s.capacity/max*140;
  out+=line(60,185,60,340)+line(60,340,610,340)+line(60,ky,600,ky,'#bf8c48',true)+path(p)+circle(60+s.time/30*540,340-r.population/max*140,6,'#b54a5b')+text(65,180,`單一族群成長（非食物網動態） K=${s.capacity}`,16)+text(60,370,'0                         時間單位                         30',15);break;
 }
 }
 let extra='';
 if(id==='solubility'){
  const fn=temp=>s.solute==='a'?20+.5*temp:35+.025*temp;
  extra=`<svg viewBox="0 0 660 360" role="img" aria-label="教學溶解度曲線，橫軸溫度0到80°C，縱軸每100g水可溶的克數0到65g">${plot(fn,80,65,'溫度（°C）；縱軸：g／100g水')}${circle(60+s.temperature/80*540,270-r.solubility/65*190,6,'#b54a5b')}${text(100,35,'模型'+s.solute.toUpperCase()+' 溶解度曲線（非實測）',18)}</svg>`;
 }
 return `<svg viewBox="0 0 660 400" role="img" aria-labelledby="diagram-title diagram-desc"><title id="diagram-title">本次${esc(id)}模型圖解</title><desc id="diagram-desc">與下方數值同步，完整數據見觀察結果。圖形為教學示意，請閱讀模型限制。</desc><defs><clipPath id="scene-clip"><rect width="660" height="400"/></clipPath></defs><g clip-path="url(#scene-clip)">${out}</g></svg>`+extra;
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
