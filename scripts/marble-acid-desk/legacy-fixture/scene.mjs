import {calculate, quantity as modelQuantity} from './model.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n.toFixed(5));
const show=n=>Number(n.toFixed(2)).toLocaleString('zh-TW',{maximumFractionDigits:2});
const colors={A:'#147c78',B:'#cb542e'};
const text=(x,y,value,more='')=>`<text x="${x}" y="${y}" ${more}>${esc(value)}</text>`;
const nonnegative=(n,name)=>{if(!Number.isFinite(n)||n<0)throw new RangeError(name+' must be a finite nonnegative number');return n;};

/** Material areas are model illustrations, not molecule counts or real-volume measurements. */
export function renderVessel({settings,quantity=0,label='A 基準',time=0,finished=false}){
  calculate(settings);nonnegative(quantity,'quantity');nonnegative(time,'time');
  if(quantity>settings.amount)throw new RangeError('quantity exceeds initial amount');
  const remaining=settings.amount-quantity,fraction=remaining/settings.amount,productFraction=quantity/settings.amount;
  const max=Math.max(5,settings.amount),fillHeight=170*quantity/max;
  const materialName={lump:'塊狀甲',granule:'顆粒甲',powder:'粉末甲'}[settings.size];
  const id='rr-vessel-'+[...label].map(c=>c.codePointAt(0).toString(16)).join('-');
  let solid='';
  if(settings.size==='lump')solid='<path d="M-43 -9 -47 -35 -21 -67 17 -61 46 -35 35 -5 0 0Z" fill="url(#'+id+'-amber)" stroke="#a96320" stroke-width="2"/><path d="m-21-67 12 34 44 28m-44-28-34 24m34-24 55-2" fill="none" stroke="#bc7628" stroke-width="2"/><path d="m-43-35 22-32 12 34-32 12Z" fill="#ffe1a0" opacity=".65"/>';
  else if(settings.size==='granule')solid=Array.from({length:12},(_,i)=>{const row=Math.floor(i/4),x=-33+i%4*22,y=-10-row*19;return `<path d="m${x} ${y} -8 -7 2 -10 10 -3 8 9 -3 10Z" fill="${i%2?'#f2b45d':'#dc8d31'}" stroke="#a96320" stroke-width="1.5"/>`;}).join('');
  else solid='<path d="M-47 0Q-29-38-10-39Q12-54 46 0Z" fill="url(#'+id+'-amber)" stroke="#a96320" stroke-width="1.5"/>'+Array.from({length:28},(_,i)=>`<circle cx="${-32+i%7*10}" cy="${-10-Math.floor(i/7)*6}" r="1.5" fill="#ffe0a0"/>`).join('');
  const done=finished&&quantity===settings.amount;
  return `<svg class="reaction-vessel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 390" data-vessel-base="313" role="img" aria-label="${esc(label)}，${esc(materialName)}，此刻產物 ${show(quantity)} 模型單位，甲剩餘 ${show(remaining)} 模型單位；${done?'已完成；':''}${settings.cat==='yes'?'本槽有催化劑，不計入產量、非用量示意；':''}模型示意，非真實量筒；色塊面積表達比例，不代表分子數" style="width:100%;height:auto;display:block;font-family:inherit;font-size:21px;fill:#3f493e">
    <defs>
      <linearGradient id="${id}-glass" x1="0" x2="1"><stop stop-color="#c9e2e1" stop-opacity=".8"/><stop offset=".12" stop-color="#fff" stop-opacity=".8"/><stop offset=".3" stop-color="#f7ffff" stop-opacity=".16"/><stop offset=".73" stop-color="#fff" stop-opacity=".25"/><stop offset=".9" stop-color="#eefefe" stop-opacity=".8"/><stop offset="1" stop-color="#88a5a1" stop-opacity=".8"/></linearGradient>
      <linearGradient id="${id}-liquid" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dce9de" stop-opacity=".45"/><stop offset="1" stop-color="#a8c8be" stop-opacity=".5"/></linearGradient>
      <linearGradient id="${id}-amber" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd38c"/><stop offset=".5" stop-color="#eea13b"/><stop offset="1" stop-color="#bd6e1d"/></linearGradient>
      <linearGradient id="${id}-product" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a1ded2"/><stop offset=".5" stop-color="#54a99b"/><stop offset="1" stop-color="#28776e"/></linearGradient>
    </defs>
    <ellipse cx="172" cy="313" rx="129" ry="11" fill="#614d30" opacity=".15"/>
    <ellipse cx="172" cy="307" rx="112" ry="9" fill="#d3bd8d" opacity=".35"/>
    <path d="M136 53H208V106Q208 120 218 142L281 271Q294 302 266 306H78Q50 302 63 271L126 142Q136 120 136 106Z" fill="url(#${id}-glass)" stroke="#829e98" stroke-width="2.8"/>
    <path data-solvent="fixed" d="M124 151H220L276 273Q285 294 261 298H83Q59 294 68 273Z" fill="url(#${id}-liquid)"/>
    <ellipse cx="172" cy="151" rx="48" ry="7" fill="#e5f0e8" fill-opacity=".6" stroke="#92b7ae" stroke-width="1.8"/>
    <ellipse cx="172" cy="293" rx="99" ry="8" fill="#b4d5cc" opacity=".45"/>
    ${fraction>0?`<g data-solid-fraction="${fraction}" transform="translate(125 285) scale(${Math.sqrt(fraction)})">${solid}</g>`:''}
    <g data-product-height="${fillHeight}" data-product-fraction="${productFraction}" transform="translate(222 285) scale(${Math.sqrt(productFraction)})"><path d="M-42 -3Q-49-18-40-34L-20-62Q-5-73 13-61L40-39Q51-20 40-5L13 1Z" fill="url(#${id}-product)" stroke="#438f84" stroke-width="2"/><path d="m-20-62 13 32 47-9m-47 9-35 27m35-27 20 31" stroke="#acdcd2" stroke-width="2" fill="none"/></g>
    <path d="M146 65V108Q145 126 135 146L78 270" fill="none" stroke="#fffef0" stroke-width="7" stroke-linecap="round" opacity=".85"/>
    <path d="M199 70V108Q200 128 210 150L269 273" fill="none" stroke="#f8ffff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
    <path d="M78 291Q172 314 267 291" fill="none" stroke="#fafff3" stroke-width="5" opacity=".85"/>
    <ellipse cx="172" cy="53" rx="43" ry="9" fill="#d4e3dc" stroke="#829e98" stroke-width="2.5"/>
    <ellipse cx="172" cy="51" rx="34" ry="4" fill="#eaf0e5" stroke="#a8bbb1" stroke-width="1.5"/>
    <path d="M137 51Q172 42 207 51" fill="none" stroke="#fffdf0" stroke-width="3"/>
    <rect x="12" y="329" width="336" height="57" rx="11" fill="#fff7e5" fill-opacity=".9" stroke="#cfbd95" stroke-width="1.5"/>
    ${text(92,353,'甲剩餘 '+show(remaining),'text-anchor="middle" font-size="21" fill="#925b23"')}
    ${text(265,353,'產物 '+show(quantity),'text-anchor="middle" font-size="21" fill="#276f63" font-weight="700"')}
    ${text(180,378,'模型單位 · 色塊僅示意','text-anchor="middle" font-size="21" fill="#72664e"')}
  </svg>`;
}

/** Graph geometry is in actual responsive viewBox CSS-equivalent units. */
export function graphGeometry({width=320,xMax=300,yMax=5}={}){
  if(!Number.isFinite(width)||width<250||width>2000)throw new RangeError('graph width must be 250..2000');
  if(!Number.isFinite(xMax)||xMax<=0||!Number.isFinite(yMax)||yMax<=0)throw new RangeError('axis maxima must be positive');
  const g={width,height:315,left:43,right:width-20,top:62,bottom:230,xMax,yMax};
  return {...g,x:t=>g.left+(g.right-g.left)*t/xMax,y:q=>g.bottom-(g.bottom-g.top)*q/yMax};
}
function unpack(entry){if(!entry)return null;return entry.settings?entry:{settings:entry};}
/** Only acquired/current time is drawn; explicit archived data are distinctly labelled. Free axes are user-selected, never automatically fitted to the answer. */
export function renderGraph({a,b,time=0,mode='guided',width=320,xMax=300,yMax=10,highlightTime=null}={}){
  nonnegative(time,'time');
  const g=graphGeometry({width,xMax:mode==='guided'?300:xMax,yMax:mode==='guided'?5:yMax});
  const rows=[['A',unpack(a)],['B',unpack(b)]].filter(([,v])=>v);
  let output=`<svg class="reaction-graph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.width} ${g.height}" role="img" aria-label="產物對模型時間圖，時間零至${g.xMax}模型秒，產物零至${g.yMax}模型單位；只畫已觀察範圍" style="width:100%;height:auto;display:block;font-family:inherit;font-size:18px;fill:#273c43">`;
  output+=text(g.left,22,'產物（模型單位）','font-size="18" font-weight="700"');
  output+=text(g.right,43,mode==='guided'?'共用固定刻度':'自由模式 · 共用刻度','text-anchor="end" font-size="18" fill="#627775"');
  const yTicks=Array.from({length:6},(_,i)=>g.yMax*i/5);
  for(const q of yTicks){const y=g.y(q);output+=`<path d="M${g.left} ${y}H${g.right}" stroke="#e0e5df"/>`+text(g.left-8,y+5,show(q),'text-anchor="end"');}
  for(let i=0;i<=3;i++){const t=g.xMax*i/3,x=g.x(t);output+=`<path d="M${x} ${g.top}V${g.bottom}" stroke="#edf0ea"/>`+text(x,254,show(t),'text-anchor="'+(i===3?'end':'middle')+'"');}
  output+=`<path d="M${g.left} ${g.top}V${g.bottom}H${g.right}" fill="none" stroke="#607c7c" stroke-width="2"/>`;
  for(const [id,item] of rows){
    const r=calculate(item.settings);
    const available=item.observedThrough===undefined?time:nonnegative(item.observedThrough,'observedThrough');
    const end=Math.min(g.xMax,item.archived?available:Math.min(time,available));
    const plateau=Math.min(end,r.time),q=modelQuantity(item.settings,plateau);
    // Data outside the chosen y domain are clipped geometrically, not with ambiguous path spilling.
    const yLimitTime=r.product<=g.yMax?Infinity:g.yMax*60/r.rate,visibleEnd=Math.min(end,yLimitTime),firstEnd=Math.min(plateau,visibleEnd);
    const points=[[0,0],[firstEnd,modelQuantity(item.settings,firstEnd)]];
    if(visibleEnd>firstEnd)points.push([visibleEnd,Math.min(q,g.yMax)]);
    output+=`<path data-series="${id}" data-observed-end="${end}" data-model-end="${visibleEnd}" d="${points.map(([t,v],i)=>(i?'L':'M')+num(g.x(t))+' '+num(g.y(v))).join(' ')}" fill="none" stroke="${colors[id]}" stroke-width="3.5" ${id==='B'?'stroke-dasharray="8 4"':''} stroke-linejoin="round"/>`;
    const labelX=g.left+(id==='A'?0:Math.min(140,(g.right-g.left)/2));
    output+=`<path d="M${labelX} 280h18" stroke="${colors[id]}" stroke-width="3" ${id==='B'?'stroke-dasharray="6 3"':''}/>`+text(labelX+24,285,id+(item.archived?' 已封存':id==='A'?' 基準':' 試驗'),'fill="'+colors[id]+'" font-size="18"');
    if(highlightTime!==null){nonnegative(highlightTime,'highlightTime');if(highlightTime<=end&&highlightTime<=g.xMax){const v=modelQuantity(item.settings,highlightTime);if(v<=g.yMax)output+=`<circle data-highlight="${id}" cx="${num(g.x(highlightTime))}" cy="${num(g.y(v))}" r="5" fill="${colors[id]}" stroke="white" stroke-width="2"/>`;}}
  }
  output+=text(g.right,309,'時間（模型秒）','text-anchor="end" font-size="18"');
  return output+'</svg>';
}
