// Pure models: numeric outputs are tested independently from the browser UI.
// 前 20 號元素：[符號, 名稱, 族（主族欄 1–8）, 常見同位素的中子數（第一個為最常見）]
export const ATOM_ELEMENTS=[['H','氫',1,[0,1,2]],['He','氦',8,[2,1]],['Li','鋰',1,[4,3]],['Be','鈹',2,[5]],['B','硼',3,[6,5]],['C','碳',4,[6,7,8]],['N','氮',5,[7,8]],['O','氧',6,[8,9,10]],['F','氟',7,[10]],['Ne','氖',8,[10,12,11]],['Na','鈉',1,[12]],['Mg','鎂',2,[12,14,13]],['Al','鋁',3,[14]],['Si','矽',4,[14,15,16]],['P','磷',5,[16]],['S','硫',6,[16,18,17,20]],['Cl','氯',7,[18,20]],['Ar','氬',8,[22,18,20]],['K','鉀',1,[20,22,21]],['Ca','鈣',2,[20,24,22,23,26,28]]];
const ATOM_SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
export const ionCharge=c=>c===0?'':(Math.abs(c)===1?'':String(Math.abs(c)).split('').map(d=>ATOM_SUP[d]).join(''))+(c>0?'⁺':'⁻');
// 化學計量：式量以 0.1 為單位的整數（HCl 36.5 → 365），[化學式, 式量×10, 係數]；main 為主要產物索引。
export const STOICH={h2o:{A:['H₂',20,2],B:['O₂',320,1],P:[['H₂O',180,2]],main:0},mgo:{A:['Mg',240,2],B:['O₂',320,1],P:[['MgO',400,2]],main:0},caco3:{A:['CaCO₃',1000,1],B:['HCl',365,2],P:[['CaCl₂',1110,1],['H₂O',180,1],['CO₂',440,1]],main:2},nh3:{A:['N₂',280,1],B:['H₂',20,3],P:[['NH₃',170,2]],main:0}};
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
 case 'motion-graphs':{
  const {v0,a,t}=s,eps=1e-9,x=v0*t+a*t*t/2,v=v0+a*t;
  const turn=Math.abs(a)>eps&&Math.abs(v0)>eps&&v0*a<0?-v0/a:null,reversed=turn!==null&&turn<t-eps;
  const x1=reversed?v0*turn+a*turn*turn/2:x,x2=reversed?x-x1:0;
  const pos=Math.max(x1,0)+Math.max(x2,0),neg=Math.max(-x1,0)+Math.max(-x2,0);
  const kind=Math.abs(a)<eps?(Math.abs(v0)<eps?'rest':'uniform'):Math.abs(v0)<eps||v0*a>0?'speeding':reversed?'reversing':'slowing';
  return {kind,v,x,path:pos+neg,pos,neg,a,turn:reversed?turn:null};
 }
 case 'lever-torque':{
  const eps=1e-9,rad=Math.PI/180,effective=s.d2*Math.sin(s.angle*rad),left=s.w1*s.d1/100,right=s.f2*effective/100,net=left-right;
  return {kind:Math.abs(net)<eps?'balanced':net>0?'left':'right',left,right,net,effective};
 }
 case 'pulley-incline':{
  const W=s.load,eta=1-s.loss/100,clamped=s.mode==='incline'&&s.len<s.h,L=clamped?s.h:s.len;
  const ideal=s.mode==='fixed'?W:s.mode==='movable'?W/2:s.mode==='block'?W/s.n:W*s.h/L;
  const distance=s.mode==='fixed'?s.h:s.mode==='movable'?2*s.h:s.mode==='block'?s.n*s.h:L;
  const force=ideal/eta,input=force*distance,output=W*s.h;
  return {kind:s.loss===0?'ideal':'lossy',ideal,force,distance,input,output,eta,clamped,L};
 }
 case 'reaction-rate':{
  const sizeF={lump:1,granule:3,powder:9}[s.size],catF=s.cat==='yes'?4:1,tempF=Math.pow(2,(s.temp-25)/10);
  const rate=s.conc*tempF*sizeF*catF,time=s.amount*60/rate,baseTime=s.amount*60,product=s.amount;
  return {kind:Math.abs(rate-1)<1e-9?'same':rate>1?'faster':'slower',rate,time,baseTime,product,tempF,sizeF,catF};
 }
 case 'reflection-refraction':{
  const n={'air-water':[1,1.33],'air-glass':[1,1.5],'water-air':[1.33,1],'glass-air':[1.5,1]}[s.media],[n1,n2]=n,deg=Math.PI/180;
  const reflection=s.incident;
  if(s.mode==='mirror')return {kind:'mirror',reflection,image:s.dist,refraction:null,critical:null,n1,n2};
  const q=n1*Math.sin(s.incident*deg)/n2,critical=n1>n2?Math.asin(n2/n1)/deg:null;
  if(q>1+1e-12)return {kind:'tir',reflection,refraction:null,critical,image:null,n1,n2};
  const refraction=Math.asin(Math.min(1,q))/deg;
  return {kind:s.incident===0?'normal':refraction<s.incident?'toward':'away',reflection,refraction,critical,image:null,n1,n2};
 }
 case 'atom-builder':{
  const E=ATOM_ELEMENTS[s.p-1],A=s.p+s.n,charge=s.p-s.e,shells=[];let left=s.e;for(const cap of [2,8,8,2]){if(left<=0)break;const k=Math.min(cap,left);shells.push(k);left-=k}
  const common=E[3],isotope=s.n===common[0]?'most':common.includes(s.n)?'common':'unusual';
  return {kind:charge===0?'neutral':charge>0?'cation':'anion',symbol:E[0],name:E[1],A,charge,ion:E[0]+ionCharge(charge),shells,isotope,commonN:common[0],table:ATOM_ELEMENTS.map(x=>[x[0],x[2]])};
 }
 case 'stoichiometry':{
  const R=STOICH[s.reaction],a10=Math.round(s.massA*10),b10=Math.round(s.massB*10);
  const molA=a10/R.A[1],molB=b10/R.B[1];
  if(!a10||!b10)return {kind:'none',R,molA,molB,extent:0,products:R.P.map(p=>[p[0],0]),leftA:s.massA,leftB:s.massB,before:s.massA+s.massB,after:s.massA+s.massB,limiting:null};
  // 整數比較 (a10/MA/cA) 與 (b10/MB/cB)：交叉相乘
  const lhs=a10*R.B[1]*R.B[2],rhs=b10*R.A[1]*R.A[2],kind=lhs===rhs?'exact':lhs<rhs?'limitA':'limitB';
  const extent=kind==='limitB'?molB/R.B[2]:molA/R.A[2];
  const leftA=kind==='limitA'||kind==='exact'?0:s.massA-extent*R.A[2]*R.A[1]/10,leftB=kind==='limitB'||kind==='exact'?0:s.massB-extent*R.B[2]*R.B[1]/10;
  const products=R.P.map(p=>[p[0],extent*p[2]*p[1]/10]),after=products.reduce((t,p)=>t+p[1],0)+leftA+leftB;
  return {kind,R,molA,molB,extent,products,leftA,leftB,before:s.massA+s.massB,after,limiting:kind==='limitA'?R.A[0]:kind==='limitB'?R.B[0]:null};
 }
 case 'weather-systems':{
  if(s.mode==='front'){
   const F={cold:{cloud:'積雨雲（高聳）',rain:'雨勢急而短，常有雷陣雨',after:'down',now:{before:'暖氣團控制，天氣較穩定',during:'積雨雲通過，雷陣雨、雨勢急',after:'冷氣團控制，氣溫下降、氣壓上升，天氣轉晴'}},
    warm:{cloud:'層狀雲（範圍廣）',rain:'雨勢緩而久',after:'up',now:{before:'雲層逐漸增厚，開始連續性降雨',during:'連續性降雨',after:'暖氣團控制，氣溫上升，雨停'}},
    stationary:{cloud:'層狀雲為主，持續不散',rain:'長時間降雨（臺灣梅雨）',after:'flat',now:{before:'鋒面附近長時間降雨',during:'鋒面附近長時間降雨',after:'冷暖氣團勢力相當，鋒面滯留，天氣變化不明顯'}}}[s.front];
   return {kind:s.front,cloud:F.cloud,rain:F.rain,now:F.now[s.phase],afterTemp:F.after,rotation:null};
  }
  const low=s.system!=='high',rotation=(s.hemi==='north')===low?'ccw':'cw';
  return {kind:s.system,rotation,flow:low?'in':'out',vertical:low?'up':'down',weather:s.system==='high'?'晴朗、穩定':s.system==='low'?'容易成雲致雨':'強風豪雨'};
 }
 case 'circulation':{
  const hr=70+1.1*s.intensity,sv=70+0.4*s.intensity,co=hr*sv/1000;
  const V={pa:['肺動脈',false,'lung','右心室','肺臟'],pv:['肺靜脈',true,'lung','肺臟','左心房'],aorta:['主動脈',true,'body','左心室','全身組織'],vc:['大靜脈',false,'body','全身組織','右心房']}[s.site];
  return {kind:V[1]?'oxygenated':'deoxygenated',hr,sv,co,vessel:V[0],circuit:V[2],from:V[3],to:V[4],coRatio:co/4.9,hrRatio:hr/70};
 }
 case 'nerve-reflex':{
  const P={knee:[['受器','大腿肌肉內的肌梭'],['感覺神經',''],['脊髓','反射中樞'],['運動神經',''],['動器','大腿前側肌肉']],withdraw:[['受器','手指皮膚'],['感覺神經',''],['脊髓','反射中樞'],['運動神經',''],['動器','手臂肌肉']],catch:[['受器','眼睛'],['感覺神經',''],['大腦','判斷'],['脊髓','傳遞'],['運動神經',''],['動器','手部肌肉']]}[s.action];
  const time=Math.sqrt(2*(s.drop/100)/9.8);
  return {kind:s.action==='catch'?'voluntary':'reflex',center:s.action==='catch'?'大腦':'脊髓',viaBrain:s.action==='catch',painLater:s.action==='withdraw',path:P,steps:P.length,time};
 }
 case 'homeostasis':{
  if(s.mode==='temp'){const kind=s.env<20?'cold':s.env>30?'hot':'neutral';return {kind,core:37,vessel:{cold:'收縮',neutral:'無明顯變化',hot:'舒張'}[kind],method:{cold:'顫抖產熱、減少散熱',neutral:'無明顯調節',hot:'流汗散熱、增加散熱'}[kind]}}
  const peak=90+(s.insulin==='low'?1.6:0.8)*s.carb,min=90-0.5*s.exercise,recovery=s.carb>0?(s.insulin==='low'?5:2):0,hormones=[];
  if(peak>110)hormones.push('胰島素');if(min<80)hormones.push('升糖素');
  return {kind:peak>110?'high':min<80?'low':'steady',peak,min,recovery,hormones};
 }
 case 'spring-friction':{
  const g=9.8;
  if(s.mode==='spring'){const F=s.hang*g,x=F/s.k;return {kind:x>s.limit+1e-12?'over':'within',F,x,limit:s.limit}}
  const mu={smooth:[0.3,0.2],rough:[0.6,0.4],rubber:[0.9,0.7]}[s.surface],N=s.mass*g,fs=mu[0]*N,fk=mu[1]*N;
  const edge=Math.abs(s.pull-fs)<1e-6,moving=!edge&&s.pull>fs,friction=moving?fk:s.pull,a=moving?(s.pull-fk)/s.mass:0;
  return {kind:edge?'edge':moving?'moving':'rest',N,fs,fk,friction,a,mu};
 }
 default:throw Error('Unknown model '+id);
 }
}

export function describe(id,s,r){
 const f=(x,d=2)=>{if(x==null)return '無有限值';const rounded=Number(x.toFixed(d));return (Object.is(rounded,-0)?0:rounded).toLocaleString('zh-TW')};
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
 case 'motion-graphs':return {metrics:[['末速度',f(r.v)+' m/s'],['位移',f(r.x)+' m'],['路徑長',f(r.path)+' m'],['v-t 圖斜率',f(r.a)+' m/s²']],explanation:r.kind==='reversing'?`物體在第 ${f(r.turn)} 秒速度減到 0 後折返。v-t 圖在時間軸上方的面積 ${f(r.pos)} m、下方 ${f(r.neg)} m：位移是兩者相減＝${f(r.x)} m，路徑長是兩者相加＝${f(r.path)} m。`:r.kind==='rest'?'速度和加速度都是 0：x-t 圖是水平線，v-t 圖貼著時間軸，位移與路徑長都是 0。':r.kind==='uniform'?`加速度為 0：v-t 圖是水平線，x-t 圖是斜直線，斜率等於速度 ${f(s.v0)} m/s。位移＝v-t 圖下的長方形面積＝${f(r.x)} m。`:`沒有折返，位移大小等於路徑長 ${f(r.path)} m。v-t 圖的斜率就是加速度 ${f(r.a)} m/s²；${r.kind==='slowing'?'速度與加速度方向相反，速度大小變小。':'速度與加速度方向相同，速度大小變大。'}`};
 case 'lever-torque':return {metrics:[['左側力矩',f(r.left)+' N·m'],['右側力矩',f(r.right)+' N·m'],['右側有效力臂',f(r.effective,1)+' cm'],['槓桿狀態',r.kind==='balanced'?'平衡':r.kind==='left'?'左側下沉':'右側下沉']],explanation:`左側 ${s.w1} N×${s.d1} cm＝${f(r.left)} N·m；右側 ${s.f2} N×有效力臂 ${f(r.effective,1)} cm＝${f(r.right)} N·m。${r.kind==='balanced'?'兩側力矩相等，所以平衡；力比較小的一側，靠較長的力臂補回來。':'兩側力矩不相等，力矩較大的一側會下沉。'}${s.angle!==90?`施力斜著拉（夾角 ${s.angle}°），有效力臂比施力點距離 ${s.d2} cm 短。`:''}`};
 case 'pulley-incline':{const name={fixed:'定滑輪',movable:'動滑輪',block:'滑輪組',incline:'斜面'}[s.mode];return {metrics:[['施力',f(r.force)+' N'],['施力移動距離',f(r.distance)+' m'],['輸入功',f(r.input)+' J'],['輸出功',f(r.output)+' J']],explanation:`${name}：物重 ${s.load} N 上升 ${s.h} m，輸出功＝${s.load}×${s.h}＝${f(r.output)} J。施力 ${f(r.force)} N 移動 ${f(r.distance)} m，輸入功＝${f(r.input)} J。${r.kind==='ideal'?(s.mode==='fixed'?'定滑輪不省力，只改變施力方向。':'施力變小，移動距離就變長，兩者相乘的功不變：省力不省功。'):`有 ${s.loss}% 損耗，輸入功比輸出功多 ${f(r.input-r.output)} J，這部分轉成熱。`}${r.clamped?'（斜面長不能短於高度，已用斜面長＝'+s.h+' m 計算。）':''}`}}
 case 'reaction-rate':return {metrics:[['相對速率',f(r.rate,3)],['完成時間',f(r.time,1)+' s'],['產物總量',f(r.product)+' 單位'],['和基準相比',r.kind==='same'?'一樣快':f(r.rate,3)+' 倍']],explanation:`相對速率＝${f(s.conc,1)}（濃度）×${f(r.tempF,3)}（溫度）×${r.sizeF}（顆粒）×${r.catF}（催化劑）＝${f(r.rate,3)}。完成時間 ${f(r.time,1)} s，基準條件要 ${f(r.baseTime,1)} s；產物總量仍是 ${f(r.product)} 單位，只由固體反應物的量決定。數值來自虛構教學模型。`};
 case 'reflection-refraction':return s.mode==='mirror'?{metrics:[['反射角',f(r.reflection,1)+'°'],['像距',f(r.image)+' cm'],['像的性質','正立、等大、虛像'],['左右','左右相反']],explanation:`反射角＝入射角＝${f(r.reflection,1)}°，兩個角都從法線量起。物體離鏡面 ${s.dist} cm，像在鏡子後方 ${f(r.image)} cm，是反射光反向延長線的交點，所以是虛像，無法投影在屏幕上。`}:{metrics:[['反射角',f(r.reflection,1)+'°'],['折射角',r.kind==='tir'?'沒有折射光':f(r.refraction,2)+'°'],['偏折方向',{normal:'垂直入射，不偏折',toward:'偏向法線',away:'偏離法線',tir:'全反射'}[r.kind]],['臨界角',r.critical===null?'不適用（進入較密介質）':f(r.critical,2)+'°']],explanation:r.kind==='tir'?`入射角 ${s.incident}° 大於臨界角 ${f(r.critical,2)}°，n₁ sinθ₁ 超過 n₂，沒有折射光，光線全部反射回原介質（進階）。`:r.kind==='normal'?'入射角 0°：光沿法線前進，不偏折；仍有一部分光被反射回來。':`n₁ sinθ₁＝${f(r.n1*Math.sin(s.incident*Math.PI/180),4)}＝n₂ sinθ₂，折射角 ${f(r.refraction,2)}°。${r.kind==='toward'?'進入折射率較大的介質，光偏向法線。':'進入折射率較小的介質，光偏離法線。'}`};
 case 'atom-builder':return {metrics:[['元素',r.symbol+' '+r.name],['質量數 A',String(r.A)],['電荷',r.charge===0?'0（電中性）':(r.charge>0?'+':'−')+Math.abs(r.charge)+'（'+r.ion+'）'],['電子層',r.shells.length?r.shells.join('、'):'沒有電子']],explanation:`質子數 ${s.p} 決定這是${r.name}（${r.symbol}）。質量數＝${s.p}＋${s.n}＝${r.A}。電荷＝${s.p}－${s.e}＝${r.charge>0?'+':''}${r.charge}，${r.kind==='neutral'?'質子與電子一樣多，是電中性的原子':r.kind==='cation'?'電子比質子少，是陽離子 '+r.ion:'電子比質子多，是陰離子 '+r.ion}。${r.isotope==='most'?'中子數 '+s.n+' 是最常見的組合。':r.isotope==='common'?'中子數和最常見的 '+r.commonN+' 不同：這是'+r.name+'的同位素（'+r.symbol+'-'+r.A+'）。':'中子數 '+s.n+' 不在常見同位素表內：非常見組合，本頁不判斷是否穩定。'}${Math.abs(r.charge)>3?'電荷超過 ±3 的離子在國中不會出現，這裡只作數字練習。':''}`};
 case 'stoichiometry':{const P=r.products[r.R.main];return {metrics:[['莫耳數',r.R.A[0]+' '+f(r.molA,3)+' mol、'+r.R.B[0]+' '+f(r.molB,3)+' mol'],['限量試劑',r.kind==='none'?'—（缺少反應物）':r.kind==='exact'?'無（恰好完全反應）':r.limiting],['主要產物',P[0]+' '+f(P[1],2)+' g'],['剩餘反應物',r.leftA>1e-9?r.R.A[0]+' '+f(r.leftA,2)+' g':r.leftB>1e-9?r.R.B[0]+' '+f(r.leftB,2)+' g':'無']],explanation:r.kind==='none'?'有一種反應物的質量是 0，反應無法進行。':`${r.R.A[0]} ${f(r.molA,3)} mol÷${r.R.A[2]}＝${f(r.molA/r.R.A[2],3)}，${r.R.B[0]} ${f(r.molB,3)} mol÷${r.R.B[2]}＝${f(r.molB/r.R.B[2],3)}；${r.kind==='exact'?'兩者相等，恰好完全反應。':'較小的 '+r.limiting+' 是限量試劑，先用完。'}反應前總質量 ${f(r.before,2)} g＝反應後總質量 ${f(r.after,2)} g。`}}
 case 'weather-systems':return s.mode==='front'?{metrics:[['雲',r.cloud],['降雨',r.rain],['目前天氣',r.now],['過境後氣溫',{down:'下降',up:'上升',flat:'變化不大'}[r.afterTemp]]],explanation:{cold:'冷鋒：較重的冷氣團從後方推進、把暖空氣快速抬升，形成高聳的積雨雲；過境後由冷氣團控制，氣溫下降。',warm:'暖鋒：較輕的暖氣團沿著冷氣團緩緩爬升，形成範圍廣的層狀雲；過境後由暖氣團控制，氣溫上升。',stationary:'滯留鋒：冷暖氣團勢力相當，鋒面幾乎不移動，同一地區會長時間下雨，例如臺灣的梅雨。'}[s.front]}:{metrics:[['近地面風向',(r.rotation==='cw'?'順時針':'逆時針')+'、'+(r.flow==='in'?'向中心吹入':'向外吹出')],['中心氣流',r.vertical==='up'?'上升':'下沉'],['天氣',r.weather],['半球',s.hemi==='north'?'北半球':'南半球']],explanation:`${s.hemi==='north'?'北':'南'}半球的${{high:'高氣壓',low:'低氣壓',typhoon:'颱風'}[s.system]}：近地面的風${r.rotation==='cw'?'順時針':'逆時針'}旋轉並${r.flow==='in'?'向中心吹入，空氣在中心堆積後上升，上升冷卻容易成雲致雨':'向外吹出，中心由上空的空氣下沉補充，下沉增溫不易成雲'}。${s.system==='typhoon'?'颱風是強烈的熱帶低氣壓，旋轉方向與低氣壓相同。':''}換到另一個半球，旋轉方向相反，往內或往外不變。`};
 case 'circulation':return {metrics:[['心跳',f(r.hr)+' 次／分'],['每分鐘心輸出量',f(r.co,2)+' L／分'],['所選血管',r.vessel+'：'+(r.kind==='oxygenated'?'充氧血':'缺氧血')],['所屬循環',r.circuit==='lung'?'肺循環':'體循環']],explanation:`${r.vessel}屬於${r.circuit==='lung'?'肺循環':'體循環'}，血液從${r.from}流向${r.to}，裡面是${r.kind==='oxygenated'?'充氧血':'缺氧血'}。${s.site==='pa'?'它叫動脈，是因為血液離開心臟，不是因為含氧多。':s.site==='pv'?'它叫靜脈，是因為血液流回心臟，裡面卻是充氧血。':''}心跳 ${f(r.hr)} 次／分×每搏 ${f(r.sv)} mL＝每分鐘 ${f(r.co,2)} L，是靜止時的 ${f(r.coRatio,2)} 倍（心跳是 ${f(r.hrRatio,2)} 倍）。數值來自教學模型。`};
 case 'nerve-reflex':return {metrics:[['中樞',r.center],['是否經大腦判斷',r.viaBrain?'是':r.painLater?'否（痛覺之後才傳到大腦）':'否'],['路徑步驟數',r.steps+' 步'],['接尺反應時間',f(r.time,3)+' s']],explanation:`路徑：${r.path.map(p=>p[0]+(p[1]?'（'+p[1]+'）':'')).join(' → ')}。${r.kind==='reflex'?'中樞在脊髓，不必等大腦判斷，所以很快。'+(r.painLater?'訊息另外往上傳到大腦產生痛覺，但那是縮手之後的事。':''):'要先由大腦判斷球在哪裡，再下指令給手，所以比反射慢。'}接尺：尺落下 ${s.drop} cm，t＝√(2×${f(s.drop/100,2)}÷9.8)＝${f(r.time,3)} s。`};
 case 'homeostasis':return s.mode==='temp'?{metrics:[['核心體溫','37 °C（維持恆定）'],['皮膚血管',r.vessel],['調節方式',r.method],['環境',s.env+' °C（'+{cold:'偏冷',neutral:'適中',hot:'偏熱'}[r.kind]+'）']],explanation:r.kind==='cold'?`環境 ${s.env}°C 比較冷：皮膚血管收縮，流到皮膚的血變少、散熱變少；肌肉顫抖產生熱。核心體溫維持在 37°C。`:r.kind==='hot'?`環境 ${s.env}°C 比較熱：皮膚血管舒張，流到皮膚的血變多、散熱變多；流汗，汗水蒸發帶走熱。核心體溫維持在 37°C。`:`環境 ${s.env}°C 適中：不需要明顯調節，核心體溫維持在 37°C。`}:{metrics:[['血糖峰值',f(r.peak)+' mg/dL'],['血糖最低值',f(r.min)+' mg/dL'],['回穩時間',r.recovery?r.recovery+' 小時':'不需要（沒有升高）'],['主要作用的激素',r.hormones.length?r.hormones.join('、')+' 增加':'無明顯變化']],explanation:`${s.carb?'進食 '+s.carb+' g 醣類後血糖升到 '+f(r.peak)+'，':''}${r.peak>110?'超過 110，胰臟分泌胰島素增加，讓血糖回到 90'+(s.insulin==='low'?'；胰島素不足時峰值較高、要 '+r.recovery+' 小時才回穩。':'，約 '+r.recovery+' 小時。'):''}${r.min<80?'運動使血糖降到 '+f(r.min)+'，低於 80，升糖素增加，把血糖拉回來。':''}${r.kind==='steady'?'血糖維持在正常範圍，沒有明顯的激素調節。':''}數值是虛構的教學模型，不能用於健康判斷。`};
 case 'spring-friction':return s.mode==='spring'?{metrics:[['彈力',f(r.F,2)+' N'],['伸長量',f(r.x,3)+' m（'+f(r.x*100,1)+' cm）'],['彈性限度',f(r.limit,2)+' m'],['狀態',r.kind==='over'?'已超過彈性限度':'在彈性限度內']],explanation:r.kind==='over'?`伸長量 ${f(r.x,3)} m 超過彈性限度 ${f(r.limit,2)} m：F＝kx 的計算值僅供參考，虎克定律已不適用，真實彈簧可能無法恢復原長。`:`彈力＝mg＝${f(s.hang,1)}×9.8＝${f(r.F,2)} N；伸長量 x＝F÷k＝${f(r.F,2)}÷${s.k}＝${f(r.x,3)} m。在彈性限度內，伸長量和外力成正比。`}:{metrics:[['正向力',f(r.N,2)+' N'],['摩擦力',f(r.friction,2)+' N（'+(r.kind==='moving'?'動摩擦':'靜摩擦')+'）'],['最大靜摩擦',f(r.fs,2)+' N'],['加速度',f(r.a,2)+' m/s²']],explanation:r.kind==='moving'?`拉力 ${f(s.pull,2)} N 超過最大靜摩擦 ${f(r.fs,2)} N，木塊滑動，摩擦力變成動摩擦 ${f(r.fk,2)} N，比最大靜摩擦小；加速度＝(${f(s.pull,2)}－${f(r.fk,2)})÷${s.mass}＝${f(r.a,2)} m/s²。`:r.kind==='edge'?`拉力恰好等於最大靜摩擦 ${f(r.fs,2)} N，這是臨界情況；再加一點點拉力，木塊就會開始滑動。`:`木塊不動：靜摩擦力等於拉力 ${f(s.pull,2)} N，還沒到最大靜摩擦 ${f(r.fs,2)} N。摩擦係數為教學值。`};
 }
}
