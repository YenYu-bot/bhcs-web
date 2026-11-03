import {calculate, quantity as modelQuantity, radiusFraction, remainingMass, instantRate} from './model.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n.toFixed(6));
const show=n=>Number(n.toFixed(2)).toLocaleString('zh-TW',{maximumFractionDigits:2});
const colors={A:'#147c78',B:'#cb542e'};
const text=(x,y,value,more='')=>`<text x="${x}" y="${y}" ${more}>${esc(value)}</text>`;
const nonnegative=(n,name)=>{if(!Number.isFinite(n)||n<0)throw new RangeError(name+' must be a finite nonnegative number');return n;};

/** Fixed acid level; stone linear dimensions follow the shrinking-core radius.
 * Powder dots and bubbles are qualitative illustrations, never gas measurements. */
export function renderVessel({settings,quantity=0,label='A 基準',time=0,finished=false}){
 const r=calculate(settings);nonnegative(time,'time');nonnegative(quantity,'quantity');
 if(quantity>r.product+1e-9)throw new RangeError('quantity exceeds maximum gas');
 const radius=radiusFraction(settings,time),mass=remainingMass(settings,time),height=quantity*1.5,piston=260-height;
 const sizeName={lump:'塊狀',granule:'顆粒',powder:'粉末'}[settings.size];
 const id='marble-'+[...label].map(c=>c.codePointAt(0).toString(16)).join('-');
 const stones=settings.size==='lump'?[[117,274,31]]:settings.size==='granule'?Array.from({length:8},(_,i)=>[73+i%4*29,279-Math.floor(i/4)*26,15.5]):Array.from({length:80},(_,i)=>[67+i%16*6.5,282-Math.floor(i/16)*5.4,3.1]);
 const solids=stones.map(([x,y,rad])=>`<g transform="translate(${x} ${y}) scale(${radius})"><path d="M${-rad} 0 L${-.9*rad} ${-.75*rad} ${-.25*rad} ${-1.1*rad} ${.6*rad} ${-rad} ${rad} ${-.3*rad} ${.7*rad} ${.1*rad}Z" fill="url(#${id}-stone)" stroke="#92948c" stroke-width="1"/><path d="M${-.65*rad} ${-.6*rad}L${.1*rad} ${-.8*rad} ${.55*rad} ${-.25*rad}" fill="none" stroke="#fffdf0" stroke-width="1.3"/></g>`).join('');
 // One shared qualitative rate scale across sizes; these circles are not fixed-volume packets.
 const bubbleCount=Math.min(16,Math.ceil(instantRate(settings,time)/.15));
 const bubbles=time>0&&time<r.time?Array.from({length:bubbleCount},(_,i)=>{
  const stoneIndex=Math.floor(i*stones.length/bubbleCount),[sx,sy,rad]=stones[stoneIndex];
  // Select different points on the actual upper polygon edges, including a single large stone.
  const u=-.7+(i%5)*.325,v=u<=-.25?-.75+(u+.9)*(-.35/.65):-1.1+(u+.25)*(.1/.85);
  const originX=sx+u*rad*radius,originY=sy+v*rad*radius;
  const phase=(modelQuantity(settings,time)*.8+i*.381966)%1;
  const x=originX+(118-originX)*phase*.8+Math.sin(phase*Math.PI*2+i)*phase*2;
  const y=originY-(originY-158)*phase,bubbleRadius=4.5+phase*2;
  return `<g data-bubble-phase="${num(phase)}" data-stone-index="${stoneIndex}" data-surface-u="${u}" data-origin-x="${num(originX)}" data-origin-y="${num(originY)}" transform="translate(${num(x)} ${num(y)})"><circle r="${num(bubbleRadius)}" fill="#f4ffff" fill-opacity=".55" stroke="#5f918e" stroke-width="1.7"/><path d="M${num(-bubbleRadius*.52)} ${num(-bubbleRadius*.12)}Q${num(-bubbleRadius*.5)} ${num(-bubbleRadius*.6)} ${num(bubbleRadius*.08)} ${num(-bubbleRadius*.63)}" fill="none" stroke="#fffef4" stroke-width="1.8" stroke-linecap="round"/></g>`;
 }).join(''):'';
 return `<svg class="reaction-vessel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 390" data-vessel-base="304" role="img" aria-label="${esc(label)}，${sizeName}大理石，剩餘 ${show(mass)} g，此刻產物 ${show(quantity)} mL 二氧化碳；${finished?'已完成；':''}縮核模型示意，非實測。石與氣泡顆數非按比例，氣泡不代表氣體體積。導管連接可移動活塞的100 mL氣體注射筒" style="width:100%;height:auto;display:block;font-family:inherit;font-size:21px;fill:#3f493e">
 <defs><linearGradient id="${id}-glass"><stop stop-color="#a8c6c0" stop-opacity=".7"/><stop offset=".17" stop-color="#fff" stop-opacity=".8"/><stop offset=".5" stop-color="#faffff" stop-opacity=".18"/><stop offset=".84" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#8baba2" stop-opacity=".7"/></linearGradient><linearGradient id="${id}-stone" x2="1" y2="1"><stop stop-color="#fffff6"/><stop offset=".55" stop-color="#d5d6ca"/><stop offset="1" stop-color="#a6aca1"/></linearGradient></defs>
 <ellipse cx="118" cy="304" rx="103" ry="9" fill="#594c33" opacity=".15"/>
 <path d="M91 54H145V114L209 271Q220 297 194 299H42Q18 297 28 271L91 114Z" fill="url(#${id}-glass)" stroke="#849e95" stroke-width="2.5"/>
 <path data-solvent="fixed" d="M76 151H160L203 274Q211 290 190 292H46Q25 290 34 274Z" fill="#dcece2" fill-opacity=".35"/>
 <ellipse cx="118" cy="151" rx="42" ry="5" fill="#edf8ee" fill-opacity=".5" stroke="#a5c2b5" stroke-width="1.5"/>
 <g data-radius-fraction="${radius}" data-remaining-mass="${mass}">${solids}</g>${bubbles}
 <path d="M100 67V114L40 271" stroke="#fffff3" stroke-width="6" opacity=".8" stroke-linecap="round" fill="none"/>
 <path d="M138 118L199 274M44 290Q118 307 192 290" stroke="#fafff4" stroke-width="4" opacity=".85" fill="none"/>
 <rect x="87" y="46" width="62" height="15" rx="4" fill="#ab9777" stroke="#786b57" stroke-width="2"/>
 <path data-gas-tube="connected" d="M118 77V35Q118 25 132 25H221Q233 25 233 39V277Q233 287 246 287H285V266" fill="none" stroke="#839c91" stroke-width="8" stroke-linecap="round"/>
 <path d="M118 77V35Q118 25 132 25H221Q233 25 233 39V277Q233 287 246 287H285V266" fill="none" stroke="#e7f2e8" stroke-width="4" stroke-linecap="round"/>
 <rect x="263" y="100" width="44" height="165" rx="5" fill="url(#${id}-glass)" stroke="#819b93" stroke-width="2"/>
 <rect data-product-height="${height}" x="267" y="${num(piston)}" width="36" height="${num(height)}" fill="#d8e9df" fill-opacity=".65"/>
 <path data-piston="${num(piston)}" d="M266 ${num(piston)}H304" stroke="#66786e" stroke-width="6"/>
 <path d="M285 ${num(piston-180)}V${num(piston-3)}M271 ${num(piston-180)}H299" stroke="#89988c" stroke-width="5" fill="none" stroke-linecap="round"/>
 ${[0,50,100].map(v=>`<path d="M307 ${260-v*1.5}h6" stroke="#65776a"/>`+text(355,266-v*1.5,v,'text-anchor="end" font-size="21"')).join('')}
 ${text(355,61,'mL','text-anchor="end" font-size="21"')}${text(355,87,'容量','text-anchor="end" font-size="21"')}
 ${text(118,330,sizeName+'大理石','text-anchor="middle" font-size="21" font-weight="700"')}${text(118,355,'剩餘 '+show(mass)+' g','text-anchor="middle" font-size="21"')}
 ${text(285,330,show(quantity)+' mL','text-anchor="middle" font-size="21" font-weight="700"')}${text(285,355,'CO₂ 讀值','text-anchor="middle" font-size="21"')}
 ${text(180,382,'縮核模型示意，非實測','text-anchor="middle" font-size="21" fill="#72664e"')}
 </svg>`;
}
export function graphGeometry({width=320}={}){
 if(!Number.isFinite(width)||width<250||width>2000)throw new RangeError('graph width must be 250..2000');
 const g={width,height:315,left:48,right:width-20,top:62,bottom:230,xMax:180,yMax:100};
 return {...g,x:t=>g.left+(g.right-g.left)*t/180,y:q=>g.bottom-(g.bottom-g.top)*q/100};
}
const unpack=entry=>!entry?null:entry.settings?entry:{settings:entry};
/** Dense analytic presentation samples never extend beyond observedEnd. */
export function renderGraph({a,b,time=0,width=320,highlightTime=null}={}){
 nonnegative(time,'time');const g=graphGeometry({width});
 let out=`<svg class="reaction-graph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 315" role="img" aria-label="二氧化碳體積對模型時間圖，固定時間零至180秒，體積零至100 mL；只畫已觀察範圍" style="width:100%;height:auto;display:block;font-family:inherit;font-size:18px;fill:#273c43">`;
 out+=text(48,22,'CO₂ 體積（mL）','font-size="18" font-weight="700"')+text(g.right,43,'共用固定刻度','text-anchor="end" font-size="18"');
 for(const v of [0,20,40,60,80,100])out+=`<path d="M48 ${g.y(v)}H${g.right}" stroke="#e0e5df"/>`+text(40,g.y(v)+5,v,'text-anchor="end"');
 for(const t of [0,60,120,180])out+=`<path d="M${g.x(t)} 62V230" stroke="#edf0ea"/>`+text(g.x(t),254,t,`text-anchor="${t===180?'end':'middle'}"`);
 out+='<path d="M48 62V230H'+g.right+'" fill="none" stroke="#607c7c" stroke-width="2"/>';
 for(const [id,entry] of [['A',a],['B',b]]){const item=unpack(entry);if(!item)continue;calculate(item.settings);
  const available=item.observedThrough===undefined?time:nonnegative(item.observedThrough,'observedThrough');
  const end=Math.min(180,item.archived?available:Math.min(time,available)),times=[0];
  for(let i=1;i/4<end;i++)times.push(i/4);
  if(end>0)times.push(end);
  const path=times.map((t,i)=>(i?'L':'M')+num(g.x(t))+' '+num(g.y(modelQuantity(item.settings,t)))).join(' ');
  out+=`<path data-series="${id}" data-observed-end="${end}" data-model-end="${end}" data-sample-last="${times.at(-1)}" d="${path}" fill="none" stroke="${colors[id]}" stroke-width="3.5" ${id==='B'?'stroke-dasharray="8 4"':''}/>`;
  const x=48+(id==='A'?0:Math.min(140,(g.right-48)/2));out+=text(x,285,id+(item.archived?' 已封存':id==='A'?' 基準':' 試驗'),`font-size="18" fill="${colors[id]}"`);
  if(highlightTime!==null){nonnegative(highlightTime,'highlightTime');if(highlightTime<=end)out+=`<circle data-highlight="${id}" cx="${num(g.x(highlightTime))}" cy="${num(g.y(modelQuantity(item.settings,highlightTime)))}" r="5" fill="${colors[id]}" stroke="white" stroke-width="2"/>`;}
 }
 return out+text(g.right,309,'時間（模型秒）','text-anchor="end" font-size="18"')+'</svg>';
}
