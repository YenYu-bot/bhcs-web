// Pure models: numeric outputs are tested independently from the browser UI.
export function calculate(id,s){
 const rad=Math.PI/180, sign=x=>Math.abs(x)<1e-9?'zero':x>0?'positive':'negative';
 switch(id){
 case 'optics':{
  const f=s.kind==='concave'?-s.f:s.f,focus=Math.abs(s.u-f)<1e-9;
  const v=focus?null:f*s.u/(s.u-f),m=focus?null:-v/s.u;
  return {kind:focus?'focus':v>0?'real':'virtual',f,v,m};
 }
 case 'wave-sound':{
  const wavelength=s.v/s.f,base=s.v/(s.mode==='closed'?4*s.length:2*s.length);
  const n=s.mode==='closed'?Math.max(1,2*Math.round((s.f/base-1)/2)+1):Math.max(1,Math.round(s.f/base));
  const nearest=base*n,detuning=Math.abs(s.f-nearest)/nearest;
  return {kind:s.mode==='travel'?'travel':detuning<=0.03+1e-10?'resonant':'off',wavelength,base,n,nearest,detuning};
 }
 case 'electromagnetism':{
  const area=.01,length=.2,omega=s.rpm*2*Math.PI/60;
  const field=4*Math.PI*1e-7*s.turns*s.current/length;
  const torque=s.turns*s.field*s.current*area*Math.sin(s.angle*rad);
  const flux=s.turns*s.field*area*Math.cos(s.angle*rad);
  const emf=s.turns*s.field*area*omega*Math.sin(s.angle*rad);
  const output=s.mode==='magnet'?field:s.mode==='motor'?torque:emf;
  return {kind:sign(output),field,torque,flux,emf,omega,output};
 }
 case 'pressure-fluid':{
  const p0=101300,hydro=s.density*9.8*s.depth,gas=p0/s.volume,v2=s.speed/s.ratio,flow=p0+s.density*(s.speed*s.speed-v2*v2)/2;
  const absolute=s.mode==='water'?p0+hydro:s.mode==='gas'?gas:flow;
  return {kind:Math.abs(absolute-p0)<1e-6?'same':absolute>p0?'higher':'lower',absolute,gauge:absolute-p0,v2,gas,hydro};
 }
 case 'solubility':{
  const solubility=s.solute==='a'?20+.5*s.temperature:35+.025*s.temperature;
  const capacity=solubility*s.water/100,dissolved=Math.min(s.soluteMass,capacity),solid=Math.max(0,s.soluteMass-capacity),percent=100*dissolved/(s.water+dissolved);
  return {kind:solid>1e-9?'solid':Math.abs(s.soluteMass-capacity)<1e-9?'edge':'none',solubility,capacity,dissolved,solid,percent};
 }
 case 'energy':{
  const total=s.mass*9.8*s.height,dropped=total*s.progress/100,potential=total-dropped,thermal=dropped*s.loss/100,kinetic=dropped-thermal,speed=Math.sqrt(2*kinetic/s.mass);
  return {kind:kinetic>1e-9?'positive':'zero',total,potential,thermal,kinetic,speed};
 }
 case 'moon-eclipse':{
  const phase=((s.phase%360)+360)%360,lit=(1-Math.cos(phase*rad))/2;
  const latitude=Math.asin(Math.sin(s.inclination*rad)*Math.sin((phase-s.node)*rad))/rad;
  const newDistance=Math.min(phase,360-phase),fullDistance=Math.abs(phase-180),nearNode=Math.abs(latitude)<=1+1e-9;
  return {kind:nearNode&&newDistance<=5?'solar':nearNode&&fullDistance<=5?'lunar':'none',lit,latitude,phase};
 }
 case 'seasons':{
  const declination=Math.asin(Math.sin(s.tilt*rad)*Math.sin(s.season*rad))/rad;
  const altitude=90-Math.abs(s.latitude-declination);
  let hours,boundary=false;
  if(Math.abs(Math.abs(s.latitude)-90)<1e-9){
   if(Math.abs(declination)<1e-9){hours=null;boundary=true;}else hours=s.latitude*declination>0?24:0;
  }else{
   const q=-Math.tan(s.latitude*rad)*Math.tan(declination*rad);
   hours=q<=-1?24:q>=1?0:24*Math.acos(q)/Math.PI;
  }
  return {kind:boundary||Math.abs(hours-12)<1e-7?'equal':hours>12?'long':'short',declination,altitude,hours,boundary};
 }
 case 'plant-exchange':{
  const st=s.stomata/100,q=Math.pow(2,(s.temperature-25)/10);
  const photo=12*s.light/(s.light+30)*st*Math.exp(-(((s.temperature-25)/15)**2)),respiration=2*q,net=photo-respiration,transpiration=st*(1-s.humidity/100)*q;
  return {kind:Math.abs(net)<1e-8?'balanced':net>0?'release':'consume',photo,respiration,net,transpiration};
 }
 case 'ecosystem':{
  const efficiency=s.efficiency/100,energy=[s.energy,s.energy*efficiency,s.energy*efficiency**2];
  const population=s.capacity/(1+(s.capacity/s.initial-1)*Math.exp(-s.rate*s.time));
  return {kind:Math.abs(population-s.initial)<1e-8?'steady':population>s.initial?'grow':'decline',energy,population};
 }
 default:throw Error('Unknown model '+id);
 }
}

export function describe(id,s,r){
 const f=(x,d=2)=>x==null?'無有限值':Number(x.toFixed(d)).toLocaleString('zh-TW');
 switch(id){
 case 'optics':return {metrics:[['像距',r.v==null?'無有限像距':f(r.v)+' cm'],['放大率',r.m==null?'不定義':f(r.m)+' 倍'],['像的性質',r.kind==='real'?'倒立實像':r.kind==='virtual'?'正立虛像':'出射光線平行'],['焦距（含正負）',f(r.f)+' cm']],explanation:r.kind==='focus'?'物體位於焦點，理想近軸光線出射後平行。請勿把像距記為0。':`像距${r.v>0?'為正，實際光線在透鏡另一側會聚':'為負，光線反向延長線在物體同側交會'}；|m|=${f(Math.abs(r.m))}。`};
 case 'wave-sound':return {metrics:[['波長',f(r.wavelength,3)+' m'],['最近模態頻率',s.mode==='travel'?'不適用':f(r.nearest)+' Hz'],['與模態差距',s.mode==='travel'?'不適用':f(r.detuning*100)+' %'],['觀察狀態',r.kind==='travel'?'行進聲波':r.kind==='resonant'?'接近共振':'偏離共振']],explanation:s.mode==='travel'?'固定聲速，增加頻率會縮短波長。曲線只是一個時間截面，空氣質點沿傳播方向往復。':`理想基頻為${f(r.base)}Hz，最近符合端點條件的頻率為${f(r.nearest)}Hz。${r.kind==='resonant'?'圖中顯示該理想模態的位移形狀。':'圖中仍只顯示驅動波的比較截面，不假裝已形成駐波。'}`};
 case 'electromagnetism':return {metrics:s.mode==='magnet'?[['線圈內磁場',f(r.field*1000,4)+' mT'],['固定線圈長度','0.20 m'],['電流',f(s.current)+' A'],['方向',r.kind==='zero'?'無場':r.kind==='positive'?'正向':'反向']]:s.mode==='motor'?[['當下轉矩',f(r.torque,4)+' N·m'],['線圈面積','0.01 m²'],['法線相對基準軸',s.angle+'°'],['轉速','未由模型求解']]:[['當下感應電壓',f(r.emf,4)+' V'],['匝數×磁通量',f(r.flux,4)+' Wb·匝'],['角速度',f(r.omega)+' rad/s'],['旋轉頻率',f(s.rpm/60)+' Hz']],explanation:s.mode!=='magnet'&&s.field===0?'外加磁場為零，磁通量、當下轉矩與感應電壓皆為零；圖中只保留法線和角度基準。':s.mode==='magnet'?'固定線圈長度下，磁場與匝數、電流成正比；負電流把方向反轉。':s.mode==='motor'?'當下轉矩與sinθ相關。本圖不模擬直流換向器；完整換向說明可看相關馬達教材。':'法線平行或反平行非零磁場時，磁通量絕對值最大，但這一瞬間變化率為零；法線垂直磁場時磁通量為零，持續旋轉下的變化率絕對值最大。'};
 case 'pressure-fluid':return {metrics:[['觀察位置絕對壓力',f(r.absolute/1000)+' kPa'],['相對參考壓力',f(r.gauge/1000)+' kPa'],['參考壓力','101.3 kPa'],[s.mode==='flow'?'出口流速':s.mode==='gas'?'體積':'液深',s.mode==='flow'?f(r.v2)+' m/s':s.mode==='gas'?f(s.volume)+' L':f(s.depth)+' m']],explanation:s.mode==='water'?'同一液體中，水壓差隨深度線性增加；液面仍承受外界大氣壓。':s.mode==='gas'?'定溫與定量前提下，壓力與體積乘積維持101.3kPa·L。':'在同高、同一流線且無黏性條件下，窄處流速較大，靜壓較低。'};
 case 'solubility':return {metrics:[['最多可溶解',f(r.capacity)+' g'],['已溶解',f(r.dissolved)+' g'],['未溶固體',f(r.solid)+' g'],['質量百分濃度',f(r.percent)+' %']],explanation:`模型${s.solute.toUpperCase()}在${s.temperature}°C的溶解度是${f(r.solubility)}g／100g水。濃度只計入已溶解的${f(r.dissolved)}g，不把${f(r.solid)}g固體加進分母。`};
 case 'energy':return {metrics:[['重力位能',f(r.potential)+' J'],['動能',f(r.kinetic)+' J'],['轉成內能',f(r.thermal)+' J'],['速度',f(r.speed)+' m/s']],explanation:`三項相加為${f(r.potential+r.kinetic+r.thermal)}J，與起始${f(r.total)}J相同。${s.loss===100?'100%損耗是準靜態能量極限，位置由滑桿指定，不是自行運動模擬。':'位置滑桿表示不同位置的能量帳，不表示經過的時間。'}`};
 case 'moon-eclipse':return {metrics:[['可見亮面',f(r.lit*100)+' %'],['月球黃緯',f(r.latitude)+'°'],['相位角',f(r.phase)+'°'],['對齊判斷',r.kind==='solar'?'日食候選':r.kind==='lunar'?'月食候選':'不符合食門檻']],explanation:'月相由觀測方向相對受光半球決定；日月食還需要接近軌道交點。候選狀態只表示符合本頁簡化門檻，不能當作日食或月食預報。'};
 case 'seasons':return {metrics:[['太陽赤緯',f(r.declination)+'°'],['正午太陽高度',f(r.altitude)+'°'],['理想日長',r.boundary?'地平線邊界':f(r.hours)+' h'],['晝夜狀態',r.boundary?'中心貼地平線':r.hours===24?'極晝':r.hours===0?'極夜':'一般晝夜']],explanation:r.boundary?'在極點且赤緯為0的理想情況，太陽中心在地平線上，不能套用一般日長公式。':'北、南半球在同一軌道位置受到的日照不同；改變緯度即可比較。正午高度若為負，代表太陽中心在地平線下。'};
 case 'plant-exchange':return {metrics:[['總光合作用',f(r.photo)+' 相對值'],['呼吸作用',f(r.respiration)+' 相對值'],['淨氧氣交換',f(r.net)+' 相對值'],['蒸散指標',f(r.transpiration,3)]],explanation:`本模型的淨氧氣交換=光合作用−呼吸作用=${f(r.net)}；${r.net>0?'呈淨釋出':'呈淨消耗或平衡'}。蒸散另受濕度和氣孔開度影響，不能把蒸散指標當氧氣量。`};
 case 'ecosystem':return {metrics:[['生產者能量',f(r.energy[0])+' kJ'],['初級消費者能量',f(r.energy[1])+' kJ'],['次級消費者能量',f(r.energy[2])+' kJ'],['模型族群數',f(r.population)+' 隻（期望值）']],explanation:`族群以固定K=${s.capacity}、r=${s.rate}的單物種模型計算；不等同食物網各物種一起變動。每階層傳遞${s.efficiency}%是本次設定，不是普遍常數。`};
 }
}
