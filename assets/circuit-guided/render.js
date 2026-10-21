// Pilot #6 B2 circuit bench renderer. Presentation only: no model/engine/state/storage/analytics imports.
const S='http://www.w3.org/2000/svg';
export const BENCH_VIEWBOX=Object.freeze({width:720,height:480});
export const TERMINAL_IDS=Object.freeze(['bat+','bat-','sw.a','sw.b','L1.a','L1.b','L2.a','L2.b','A.+','A.-','V.+','V.-']);
export const TERMINAL_POSITIONS=Object.freeze({
'bat+':{x:70,y:90},'bat-':{x:70,y:390},'sw.a':{x:180,y:90},'sw.b':{x:300,y:90},
'A.+':{x:180,y:240},'A.-':{x:300,y:240},'L1.a':{x:440,y:90},'L1.b':{x:590,y:90},
'L2.a':{x:440,y:240},'L2.b':{x:590,y:240},'V.+':{x:440,y:390},'V.-':{x:590,y:390}});
const B=new Set(['off','very-low','low','reference','high']), ST=new Set(['normal','open','source-short','indeterminate']),
MS=new Set(['ok','floating','ambiguous','source-short','unavailable','indeterminate']), TS=new Set(TERMINAL_IDS);
export const CIRCUIT_TEXT=Object.freeze({
terminal:Object.freeze({'bat+':'電池正極','bat-':'電池負極','sw.a':'開關左端','sw.b':'開關右端','L1.a':'燈泡一左端','L1.b':'燈泡一右端','L2.a':'燈泡二左端','L2.b':'燈泡二右端','A.+':'電流表正端','A.-':'電流表負端','V.+':'電壓表正端','V.-':'電壓表負端'}),
component:Object.freeze({battery:'6 V 電池',switch:'開關',L1:'燈泡 1',L2:'燈泡 2',ammeter:'電流表',voltmeter:'電壓表'}),
brightness:Object.freeze({off:'熄滅','very-low':'很微弱',low:'較暗',reference:'基準亮度',high:'較亮'}),
meterState:Object.freeze({ok:'',floating:'未接妥',ambiguous:'讀值不唯一','source-short':'安全警示',unavailable:'尚無讀值',indeterminate:'無法讀取'}),
status:Object.freeze({normal:'電路已通電',open:'目前沒有完整通路','source-short':'安全警示：接法需調整',indeterminate:'目前接法無法取得穩定讀值'})
});
let seq=0;
const key=(a,b)=>a<b?a+'|'+b:b+'|'+a;
function h(d,t,a={},p){const e=d.createElement(t);for(const [k,v] of Object.entries(a)){if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else e.setAttribute(k,String(v));}if(p)p.appendChild(e);return e}
function s(d,t,a={},p){const e=d.createElementNS(S,t);for(const [k,v] of Object.entries(a))e.setAttribute(k,String(v));if(p)p.appendChild(e);return e}
const txt=(e,v)=>{v=String(v);if(e.textContent!==v)e.textContent=v},attr=(e,k,v)=>{v=String(v);if(e.getAttribute(k)!==v)e.setAttribute(k,v)};
function wires(x){if(!Array.isArray(x))throw new TypeError('wires');const seen=new Set;return x.map((w,i)=>{if(!w||!TS.has(w.from)||!TS.has(w.to)||w.from===w.to)throw new RangeError('wire '+i);const k=key(w.from,w.to);if(seen.has(k))throw new RangeError('duplicate '+k);seen.add(k);return{from:w.from,to:w.to,key:k}})}
function model(m){if(!m||typeof m!=='object'||typeof m.locked!=='boolean'||typeof m.switchClosed!=='boolean'||!ST.has(m.status))throw new RangeError('bench');
const lamp=id=>{const x=m.lamps&&m.lamps[id];if(!x||!B.has(x.brightness))throw new RangeError(id);return{brightness:x.brightness,bypassed:x.bypassed===true}};
const meter=(x,n)=>{if(!x||!MS.has(x.state)||typeof x.text!=='string')throw new RangeError(n);return{state:x.state,text:x.text}};
return{locked:m.locked,switchClosed:m.switchClosed,status:m.status,wires:wires(m.wires),lamps:{L1:lamp('L1'),L2:lamp('L2')},ammeter:meter(m.ammeter,'A'),voltmeter:meter(m.voltmeter,'V')}}
function pct(e,p){e.style.left=(p.x/BENCH_VIEWBOX.width*100).toFixed(4)+'%';e.style.top=(p.y/BENCH_VIEWBOX.height*100).toFixed(4)+'%'}
// Visual routing is presentation-only. A bend is not an electrical junction.
// In particular, voltmeter-to-L1 wires must not pass through L2 terminals.
export function wirePath(a,b){
 const p=TERMINAL_POSITIONS[a],q=TERMINAL_POSITIONS[b];
 if(!p||!q)throw new RangeError('unknown terminal');
 const pair=[a,b].sort().join('|');
 const explicit={
  'L1.a|V.+':[['L1.a',365,90],[365,390],['V.+',440,390]],
  'L1.b|V.-':[['L1.b',590,90],[665,90],[665,390],['V.-',590,390]],
 };
 // The left voltmeter lead uses a separate outer corridor instead of cutting across L2.
 if(pair==='L1.a|V.+'){
   const pts=a==='L1.a'?[[440,90],[365,90],[365,390],[440,390]]:[[440,390],[365,390],[365,90],[440,90]];
   return 'M '+pts.map(v=>v.join(' ')).join(' L ');
 }
 if(pair==='L1.b|V.-'){
   const pts=a==='L1.b'?[[590,90],[665,90],[665,390],[590,390]]:[[590,390],[665,390],[665,90],[590,90]];
   return 'M '+pts.map(v=>v.join(' ')).join(' L ');
 }
 // Avoid diagonals passing across an unrelated lamp by taking an orthogonal route.
 if(Math.abs(p.x-q.x)>60&&Math.abs(p.y-q.y)>60){
   const midX=(p.x+q.x)/2;
   return 'M '+p.x+' '+p.y+' H '+midX+' V '+q.y+' H '+q.x;
 }
 return 'M '+p.x+' '+p.y+' L '+q.x+' '+q.y;
}
function path(a,b){return wirePath(a,b)}
export function createCircuitBench(root,{text=CIRCUIT_TEXT}={}){
if(!root||!root.ownerDocument)throw new TypeError('root');const d=root.ownerDocument,uid='cgg-'+(++seq),bench=h(d,'section',{class:'cgg-bench','data-role':'circuit-bench'}),stage=h(d,'div',{class:'cgg-stage','data-role':'stage',role:'group'},bench),art=s(d,'svg',{class:'cgg-art',viewBox:'0 0 720 480',preserveAspectRatio:'none','aria-hidden':'true',focusable:'false'},stage),wireLayer=s(d,'g',{class:'cgg-wire-layer'},art),preview=s(d,'path',{class:'cgg-wire-preview','data-role':'wire-preview',d:'',hidden:'hidden'},wireLayer),comp=s(d,'g',{class:'cgg-components'},art);
s(d,'line',{x1:70,y1:90,x2:70,y2:170,class:'cgg-component-line'},comp);s(d,'rect',{x:34,y:170,width:72,height:140,rx:16,class:'cgg-component cgg-battery'},comp);s(d,'line',{x1:70,y1:310,x2:70,y2:390,class:'cgg-component-line'},comp);s(d,'text',{x:70,y:232,class:'cgg-component-mark','text-anchor':'middle'},comp).textContent='6 V';s(d,'text',{x:70,y:264,class:'cgg-component-label','text-anchor':'middle'},comp).textContent=text.component.battery;
// Separate equipment bays help learners distinguish physical proximity from electrical connection.
s(d,'rect',{x:399,y:197,width:235,height:125,rx:18,class:'cgg-equipment-bay','data-bay':'L2'},comp);
s(d,'rect',{x:399,y:39,width:235,height:133,rx:18,class:'cgg-equipment-bay','data-bay':'L1'},comp);
const swLine=s(d,'line',{x1:180,y1:90,x2:280,y2:55,class:'cgg-component-line cgg-switch-line'},comp);
function meterArt(x,y,mark,label,cls){s(d,'line',{x1:x-60,y1:y,x2:x-42,y2:y,class:'cgg-component-line'},comp);s(d,'line',{x1:x+42,y1:y,x2:x+60,y2:y,class:'cgg-component-line'},comp);s(d,'circle',{cx:x,cy:y,r:42,class:'cgg-component '+cls},comp);s(d,'text',{x:x,y:y+9,class:'cgg-meter-mark','text-anchor':'middle'},comp).textContent=mark;s(d,'text',{x:x,y:y+68,class:'cgg-component-label','text-anchor':'middle'},comp).textContent=label}
meterArt(240,240,'A',text.component.ammeter,'cgg-ammeter');meterArt(515,390,'V',text.component.voltmeter,'cgg-voltmeter');
const lamps={};function lamp(id,x,y){const g=s(d,'g',{class:'cgg-lamp','data-lamp':id},comp);s(d,'line',{x1:x-75,y1:y,x2:x-34,y2:y,class:'cgg-component-line'},g);s(d,'line',{x1:x+34,y1:y,x2:x+75,y2:y,class:'cgg-component-line'},g);const rays=s(d,'g',{class:'cgg-lamp-rays'},g);for(let i=0;i<8;i++){const a=i*Math.PI/4;s(d,'line',{x1:x+Math.cos(a)*40,y1:y+Math.sin(a)*40,x2:x+Math.cos(a)*56,y2:y+Math.sin(a)*56},rays)}s(d,'circle',{cx:x,cy:y,r:34,class:'cgg-bulb'},g);s(d,'path',{d:'M '+(x-15)+' '+(y-15)+' L '+(x+15)+' '+(y+15)+' M '+(x-15)+' '+(y+15)+' L '+(x+15)+' '+(y-15),class:'cgg-filament'},g);s(d,'text',{x:x,y:y+72,class:'cgg-component-label','text-anchor':'middle'},g).textContent=text.component[id];const badge=s(d,'text',{x:x,y:y+94,class:'cgg-lamp-state','text-anchor':'middle','data-role':'lamp-state'},g);lamps[id]={g,badge}}
lamp('L1',515,90);lamp('L2',515,240);
const terminals=new Map;for(const id of TERMINAL_IDS){const b=h(d,'button',{type:'button',class:'cgg-terminal','data-terminal':id,'aria-label':text.terminal[id],'aria-pressed':'false'},stage);pct(b,TERMINAL_POSITIONS[id]);const dot=h(d,'span',{class:'cgg-terminal-dot','aria-hidden':'true'},b);dot.textContent=id.endsWith('+')?'+':id.endsWith('-')?'−':'';terminals.set(id,b)}
const sw=h(d,'button',{type:'button',class:'cgg-switch-button','data-switch-toggle':'true','aria-pressed':'false'},stage);sw.style.left='33.3333%';sw.style.top='32.2917%';
const reads=h(d,'div',{class:'cgg-readouts',role:'group','aria-label':'量測讀值'},bench);function card(role,title){const c=h(d,'div',{class:'cgg-meter-card','data-meter':role},reads);h(d,'span',{class:'cgg-meter-title',text:title},c);return{card:c,value:h(d,'strong',{class:'cgg-meter-value','data-role':role+'-value'},c),state:h(d,'span',{class:'cgg-meter-state','data-role':role+'-state'},c)}}const A=card('ammeter',text.component.ammeter),V=card('voltmeter',text.component.voltmeter),status=h(d,'p',{class:'cgg-status','data-role':'status',role:'status'},bench),box=h(d,'section',{class:'cgg-wire-box','aria-label':'目前導線'},bench);h(d,'div',{class:'cgg-wire-title',text:'目前導線'},box);const list=h(d,'ul',{class:'cgg-wire-list'},box),empty=h(d,'p',{class:'cgg-wire-empty',text:'尚未接上導線。'},box);root.appendChild(bench);
const wp=new Map,wr=new Map;function sync(ws,locked){const want=new Set(ws.map(w=>w.key));const attached=new Set(ws.flatMap(w=>[w.from,w.to]));for(const [id,button] of terminals)attr(button,'data-connected',attached.has(id));for(const [k,n]of [...wp])if(!want.has(k)){n.remove();wp.delete(k)}for(const [k,n]of [...wr])if(!want.has(k)){n.remove();wr.delete(k)}for(const w of ws){let p=wp.get(w.key);if(!p){p=s(d,'path',{class:'cgg-wire','data-wire':w.key,d:path(w.from,w.to)},wireLayer);wireLayer.insertBefore(p,preview);wp.set(w.key,p)}let r=wr.get(w.key);if(!r){r=h(d,'li',{class:'cgg-wire-row','data-wire-row':w.key},list);const l=h(d,'span',{class:'cgg-wire-label'},r),rm=h(d,'button',{type:'button',class:'cgg-wire-remove','data-remove-wire':w.key,text:'移除'},r);r._c={l,rm};wr.set(w.key,r)}txt(r._c.l,text.terminal[w.from]+' — '+text.terminal[w.to]);attr(r._c.rm,'aria-label','移除 '+text.terminal[w.from]+' 到 '+text.terminal[w.to]+' 的導線');attr(r._c.rm,'data-from',w.from);attr(r._c.rm,'data-to',w.to);r._c.rm.disabled=locked}empty.hidden=ws.length!==0}
function update(x){const m=model(x);attr(bench,'data-status',m.status);attr(bench,'data-locked',m.locked);for(const b of terminals.values())b.disabled=m.locked;sw.disabled=m.locked;attr(sw,'aria-pressed',m.switchClosed);txt(sw,m.switchClosed?'開關：閉合':'開關：斷開');attr(swLine,'x2',m.switchClosed?300:280);attr(swLine,'y2',m.switchClosed?90:55);sync(m.wires,m.locked);for(const id of ['L1','L2']){attr(lamps[id].g,'data-brightness',m.lamps[id].brightness);attr(lamps[id].g,'data-bypassed',m.lamps[id].bypassed);txt(lamps[id].badge,m.lamps[id].bypassed?'被導線繞過':(!m.wires.some(w=>w.from.startsWith(id+'.')||w.to.startsWith(id+'.'))?'未接線':text.brightness[m.lamps[id].brightness))}for(const [n,z]of[[A,m.ammeter],[V,m.voltmeter]]){txt(n.value,z.text||'—');txt(n.state,text.meterState[z.state]);attr(n.card,'data-state',z.state)}txt(status,text.status[m.status]);attr(status,'data-unsafe',m.status==='source-short');attr(stage,'aria-label','電路實驗桌，'+(m.switchClosed?'開關閉合':'開關斷開')+'，電流表 '+(m.ammeter.text||'—')+'，電壓表 '+(m.voltmeter.text||'—')+'，燈泡 1 '+text.brightness[m.lamps.L1.brightness]+'，燈泡 2 '+text.brightness[m.lamps.L2.brightness])}
return{update,destroy(){bench.remove()},element:bench,stage,uid}}
