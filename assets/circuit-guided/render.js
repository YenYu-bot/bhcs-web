// Pilot #6 circuit bench renderer. Presentation only: no model/engine/state/storage/analytics imports.
// Layout rules (learner-facing):
//  * every terminal sits on the edge of its own instrument body;
//  * cables are routed around instruments, labels and other terminals, so a cable is never drawn
//    "through" a lamp or meter it is not plugged into;
//  * a bend or a crossing is never an electrical junction. Cables are drawn with a paper-coloured
//    halo so a crossing reads as one cable lying over another; only terminals join cables;
//  * lamp 2 lives in its own spare tray outside the main loop until a learner wires it.
const S='http://www.w3.org/2000/svg';
export const TERMINAL_IDS=Object.freeze(['bat+','bat-','sw.a','sw.b','L1.a','L1.b','L2.a','L2.b','A.+','A.-','V.+','V.-']);
const TS=new Set(TERMINAL_IDS);
const B=new Set(['off','very-low','low','reference','high']),ST=new Set(['normal','open','source-short','indeterminate']),
MS=new Set(['ok','floating','ambiguous','source-short','unavailable','indeterminate']);
export const CIRCUIT_TEXT=Object.freeze({
terminal:Object.freeze({'bat+':'電池正極','bat-':'電池負極','sw.a':'開關左端','sw.b':'開關右端','L1.a':'燈泡一左端','L1.b':'燈泡一右端','L2.a':'燈泡二左端','L2.b':'燈泡二右端','A.+':'電流表正端','A.-':'電流表負端','V.+':'電壓表正端','V.-':'電壓表負端'}),
component:Object.freeze({battery:'6 V 電池',switch:'開關',L1:'燈泡 1',L2:'燈泡 2',ammeter:'電流表',voltmeter:'電壓表'}),
body:Object.freeze({batteryName:'電池',batteryMark:'6 V',spare:'備用器材區',working:'實驗器材區',spareHint:'燈泡 2 尚未接入電路',workingHint:'燈泡 2 已接線'}),
brightness:Object.freeze({off:'熄滅','very-low':'很微弱',low:'較暗',reference:'基準亮度',high:'較亮'}),
meterState:Object.freeze({ok:'',floating:'未接妥',ambiguous:'讀值不唯一','source-short':'安全警示',unavailable:'尚無讀值',indeterminate:'無法讀取'}),
status:Object.freeze({normal:'電路已通電',open:'目前沒有完整通路','source-short':'安全警示：接法需調整',indeterminate:'目前接法無法取得穩定讀值'}),
hint:Object.freeze({
 idle:'接線方法：先點一個端點，再點另一個端點（也可以直接拖曳）。導線只在端點相連，畫面上交叉的導線並沒有接在一起。',
 selected:'已選「{t}」。再點另一個端點完成接線；再點一次同一個端點可取消。',
 locked:'這一步只觀察與記錄，接線暫時鎖定。'})
});

// ---------- layouts (viewBox units) ----------
const N={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function layout(def){
 const t={};for(const [id,[x,y,...sides]] of Object.entries(def.terminals))t[id]=Object.freeze({x,y,n:N[sides[0]],side:sides[0],exits:Object.freeze(sides.map(k=>N[k]))});
 return Object.freeze({...def,terminals:Object.freeze(t)});
}
const LANDSCAPE=layout({
 name:'landscape',width:720,height:500,
 battery:{x:36,y:250,w:80,h:130,cap:{x:64,y:240,w:24,h:10}},
 switch:{x:160,y:212,w:92,h:36,label:[206,200],button:[206,292]},
 ammeter:{x:316,y:194,w:96,h:72},
 voltmeter:{x:488,y:360,w:96,h:72},
 L1:{x:480,y:206,w:112,h:48},
 L2:{x:524,y:46,w:112,h:48},
 tray:{x:456,y:12,w:250,h:150,label:[472,36]},
 terminals:{'bat+':[76,240,'up','right'],'bat-':[76,380,'down','right','left'],'sw.a':[160,230,'left','up'],'sw.b':[252,230,'right','up'],
  'A.+':[316,230,'left','up','down'],'A.-':[412,230,'right','up','down'],'L1.a':[480,230,'left','up','down'],'L1.b':[592,230,'right','up','down'],
  'L2.a':[524,70,'left','down'],'L2.b':[636,70,'right','down'],'V.+':[488,396,'left','down','up'],'V.-':[584,396,'right','down','up']}
});
const PORTRAIT=layout({
 name:'portrait',width:360,height:664,
 battery:{x:18,y:206,w:60,h:126,cap:{x:38,y:196,w:20,h:10}},
 switch:{x:84,y:50,w:80,h:36,label:[124,38],button:[96,130]},
 ammeter:{x:230,y:32,w:96,h:72},
 voltmeter:{x:192,y:304,w:96,h:72},
 L1:{x:190,y:176,w:100,h:48},
 L2:{x:130,y:520,w:100,h:48},
 tray:{x:16,y:452,w:328,h:198,label:[30,476]},
 terminals:{'bat+':[48,196,'up','right'],'bat-':[48,332,'down','right','left'],'sw.a':[84,68,'left','down'],'sw.b':[164,68,'right','down'],
  'A.+':[230,68,'left','down'],'A.-':[326,68,'right','down'],'L1.a':[190,200,'up','left','down'],'L1.b':[290,200,'right','up','down'],
  'L2.a':[130,544,'left','up'],'L2.b':[230,544,'right','up'],'V.+':[192,340,'left','down','up'],'V.-':[288,340,'right','down','up']}
});
export const BENCH_LAYOUTS=Object.freeze({landscape:LANDSCAPE,portrait:PORTRAIT});
export const BENCH_VIEWBOX=Object.freeze({width:LANDSCAPE.width,height:LANDSCAPE.height});
export const TERMINAL_POSITIONS=Object.freeze(Object.fromEntries(TERMINAL_IDS.map(id=>[id,Object.freeze({x:LANDSCAPE.terminals[id].x,y:LANDSCAPE.terminals[id].y})])));
// Narrow benches switch to the portrait bench instead of scrolling sideways.
export const PORTRAIT_BELOW=600;
const OWNER={bat:'battery',sw:'switch',A:'ammeter',V:'voltmeter',L1:'L1',L2:'L2'};
export const terminalOwner=id=>OWNER[id.split(/[.+-]/)[0]];
const lampCenter=r=>({x:r.x+r.w/2,y:r.y+r.h/2});
// Instrument bodies, labels and the spare tray that cables must route around.
export function benchObstacles(L){
 const bodies=['battery','switch','ammeter','voltmeter','L1','L2'].map(k=>({owner:k,kind:'body',x:L[k].x,y:L[k].y,w:L[k].w,h:L[k].h}));
 bodies.push({owner:'battery',kind:'body',...L.battery.cap});
 const labels=[];
 for(const k of['L1','L2']){const c=lampCenter(L[k]);labels.push({owner:k,kind:'label',x:c.x-46,y:c.y+24,w:92,h:58})}
 labels.push({owner:'switch',kind:'label',x:L.switch.label[0]-26,y:L.switch.label[1]-18,w:52,h:22});
 labels.push({owner:'switch',kind:'label',x:L.switch.button[0]-54,y:L.switch.button[1]-24,w:108,h:48});
 labels.push({owner:'L2',kind:'label',x:L.tray.label[0]-4,y:L.tray.label[1]-18,w:96,h:24});
 const tray={owner:'L2',kind:'tray',x:L.tray.x,y:L.tray.y,w:L.tray.w,h:L.tray.h};
 // The gap between lamp 1 and the voltmeter is reserved for the voltmeter's own leads,
 // so the main return cable never looks like it runs "through" the measurement.
 const x0=Math.min(L.L1.x,L.voltmeter.x)-34,x1=Math.max(L.L1.x+L.L1.w,L.voltmeter.x+L.voltmeter.w)+34;
 const measure={owner:'voltmeter',kind:'measure',x:x0,y:L.L1.y+L.L1.h,w:x1-x0,h:L.voltmeter.y-(L.L1.y+L.L1.h)};
 return{bodies,labels,tray,measure};
}

// ---------- cable routing (presentation only) ----------
const STUB=22,RADIUS=16,STEP=7;
function simplify(pts){const out=[];for(const p of pts){const q=out[out.length-1];if(q&&Math.abs(q[0]-p[0])<.01&&Math.abs(q[1]-p[1])<.01)continue;out.push(p)}
 for(let i=1;i<out.length-1;){const a=out[i-1],b=out[i],c=out[i+1];if((Math.abs(a[0]-b[0])<.01&&Math.abs(b[0]-c[0])<.01)||(Math.abs(a[1]-b[1])<.01&&Math.abs(b[1]-c[1])<.01))out.splice(i,1);else i++}return out}
function roundedSegments(pts){
 const seg=[];let cur=pts[0];
 for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(RADIUS,l1/2,l2/2);
  const p=[b[0]-(b[0]-a[0])/l1*r,b[1]-(b[1]-a[1])/l1*r],q=[b[0]+(c[0]-b[0])/l2*r,b[1]+(c[1]-b[1])/l2*r];
  seg.push({t:'L',a:cur,b:p});seg.push({t:'Q',a:p,c:b,b:q});cur=q}
 seg.push({t:'L',a:cur,b:pts[pts.length-1]});return seg;
}
const r1=v=>Math.round(v*10)/10;
function segD(seg){let d='M '+r1(seg[0].a[0])+' '+r1(seg[0].a[1]);for(const s of seg){if(s.t==='L')d+=' L '+r1(s.b[0])+' '+r1(s.b[1]);else if(s.t==='Q')d+=' Q '+r1(s.c[0])+' '+r1(s.c[1])+' '+r1(s.b[0])+' '+r1(s.b[1]);else d+=' C '+r1(s.c1[0])+' '+r1(s.c1[1])+' '+r1(s.c2[0])+' '+r1(s.c2[1])+' '+r1(s.b[0])+' '+r1(s.b[1])}return d}
function sample(seg){const out=[];let len=0;for(const s of seg){let n,f;if(s.t==='L'){const l=Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]);len+=l;n=Math.max(1,Math.ceil(l/STEP));f=t=>[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t]}
 else if(s.t==='Q'){const l=Math.hypot(s.c[0]-s.a[0],s.c[1]-s.a[1])+Math.hypot(s.b[0]-s.c[0],s.b[1]-s.c[1]);len+=l;n=Math.max(2,Math.ceil(l/STEP));f=t=>{const u=1-t;return[u*u*s.a[0]+2*u*t*s.c[0]+t*t*s.b[0],u*u*s.a[1]+2*u*t*s.c[1]+t*t*s.b[1]]}}
 else{const l=Math.hypot(s.c1[0]-s.a[0],s.c1[1]-s.a[1])+Math.hypot(s.c2[0]-s.c1[0],s.c2[1]-s.c1[1])+Math.hypot(s.b[0]-s.c2[0],s.b[1]-s.c2[1]);len+=l;n=Math.max(4,Math.ceil(l/STEP));f=t=>{const u=1-t;return[u*u*u*s.a[0]+3*u*u*t*s.c1[0]+3*u*t*t*s.c2[0]+t*t*t*s.b[0],u*u*u*s.a[1]+3*u*u*t*s.c1[1]+3*u*t*t*s.c2[1]+t*t*t*s.b[1]]}}
 for(let i=out.length?1:0;i<=n;i++)out.push(f(i/n))}return{pts:out,len}}
const plen=pts=>{let l=0;for(let i=1;i<pts.length;i++)l+=Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]);return l};
function candidates(L,p,q){
 const P=[p.x,p.y],Q=[q.x,q.y],out=[],d=Math.hypot(q.x-p.x,q.y-p.y);
 const xs=[],ys=[];for(let x=14;x<=L.width-14;x+=20)xs.push(x);for(let y=14;y<=L.height-14;y+=20)ys.push(y);
 p.exits.forEach((np,ip)=>q.exits.forEach((nq,iq)=>{
  const extra=(ip?4:0)+(iq?4:0),p1=[p.x+np[0]*STUB,p.y+np[1]*STUB],q1=[q.x+nq[0]*STUB,q.y+nq[1]*STUB];
  for(const f of[.35,.55,.8]){const k=Math.max(28,Math.min(170,d*f));out.push({bends:0,extra,lb:d*.12+extra,seg:[{t:'C',a:P,c1:[p.x+np[0]*k,p.y+np[1]*k],c2:[q.x+nq[0]*k,q.y+nq[1]*k],b:Q}]})}
  const add=pts=>{const s=simplify(pts);out.push({bends:s.length-2,extra,lb:plen(s)*.11+(s.length-2)*7+extra,pts:s})};
  const X=[...xs,(p1[0]+q1[0])/2,p1[0],q1[0]],Y=[...ys,(p1[1]+q1[1])/2,p1[1],q1[1]];
  for(const x of X)add([P,p1,[x,p1[1]],[x,q1[1]],q1,Q]);
  for(const y of Y)add([P,p1,[p1[0],y],[q1[0],y],q1,Q]);
  for(const x of X)for(const y of Y){add([P,p1,[x,p1[1]],[x,y],[q1[0],y],q1,Q]);add([P,p1,[p1[0],y],[x,y],[x,q1[1]],q1,Q])}
 }));
 return out.sort((a,b)=>a.lb-b.lb);
}
function grid(others){const g=new Map;for(const o of others)for(const [x,y] of o.pts){const k=Math.floor(x/10)+','+Math.floor(y/10);let a=g.get(k);if(!a)g.set(k,a=[]);a.push([x,y,o])}return g}
function nearOther(g,x,y,skip){const cx=Math.floor(x/10),cy=Math.floor(y/10);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=g.get((cx+i)+','+(cy+j));if(a)for(const [ox,oy,o] of a)if((ox-x)**2+(oy-y)**2<121&&!skip(o,x,y))return true}return false}
const inside=(r,x,y,m)=>x>r.x-m&&x<r.x+r.w+m&&y>r.y-m&&y<r.y+r.h+m;
// Returns the chosen cable route. `others` are earlier routes ({from,to,pts}) on the same bench.
export function routeWire(a,b,{layout:Lname='landscape',others=[]}={}){
 const L=typeof Lname==='string'?BENCH_LAYOUTS[Lname]:Lname;if(!L)throw new RangeError('unknown layout');
 const p=L.terminals[a],q=L.terminals[b];if(!p||!q||a===b)throw new RangeError('unknown terminal');
 const oa=terminalOwner(a),ob=terminalOwner(b),{bodies,labels,tray,measure}=benchObstacles(L),useMeasure=oa==='voltmeter'||ob==='voltmeter',useTray=oa==='L2'||ob==='L2';
 const foreign=TERMINAL_IDS.filter(id=>id!==a&&id!==b).map(id=>L.terminals[id]);
 const g=grid(others);let best=null;
 const nearShared=(o,x,y)=>[o.from,o.to].some(id=>(id===a||id===b)&&(L.terminals[id].x-x)**2+(L.terminals[id].y-y)**2<60*60);
 for(const c of candidates(L,p,q)){
  if(best&&c.lb>=best.score)break;
  if(!c.seg)c.seg=roundedSegments(c.pts);
  const {pts,len}=sample(c.seg);let score=len*.12+c.bends*7+c.extra;
  for(const [x,y] of pts){
   if(best&&score>=best.score)break;
   if(x<8||y<8||x>L.width-8||y>L.height-8)score+=120;
   for(const r of bodies){const own=r.owner===oa||r.owner===ob;if(own?inside(r,x,y,-1):inside(r,x,y,8))score+=60}
   for(const r of labels)if(inside(r,x,y,4))score+=25;
   if(!useTray&&inside(tray,x,y,10))score+=60;
   if(!useMeasure&&inside(measure,x,y,0))score+=45;
   if(x<L.battery.x)score+=14;
   for(const t of foreign)if((t.x-x)**2+(t.y-y)**2<32*32)score+=250;
   if(g.size&&nearOther(g,x,y,nearShared))score+=30;
  }
  if(!best||score<best.score)best={score,seg:c.seg,pts};
 }
 return{d:segD(best.seg),pts:best.pts,score:best.score};
}
export function wirePath(a,b,opts){return routeWire(a,b,opts).d}

// ---------- DOM helpers ----------
let seq=0;
const key=(a,b)=>a<b?a+'|'+b:b+'|'+a;
function h(d,t,a={},p){const e=d.createElement(t);for(const [k,v] of Object.entries(a)){if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else e.setAttribute(k,String(v));}if(p)p.appendChild(e);return e}
function s(d,t,a={},p){const e=d.createElementNS(S,t);for(const [k,v] of Object.entries(a)){if(k==='text')e.textContent=v;else e.setAttribute(k,String(v))}if(p)p.appendChild(e);return e}
const txt=(e,v)=>{v=String(v);if(e.textContent!==v)e.textContent=v},attr=(e,k,v)=>{v=String(v);if(e.getAttribute(k)!==v)e.setAttribute(k,v)};
function wires(x){if(!Array.isArray(x))throw new TypeError('wires');const seen=new Set;return x.map((w,i)=>{if(!w||!TS.has(w.from)||!TS.has(w.to)||w.from===w.to)throw new RangeError('wire '+i);const k=key(w.from,w.to);if(seen.has(k))throw new RangeError('duplicate '+k);seen.add(k);return{from:w.from,to:w.to,key:k}})}
function model(m){if(!m||typeof m!=='object'||typeof m.locked!=='boolean'||typeof m.switchClosed!=='boolean'||!ST.has(m.status))throw new RangeError('bench');
const lamp=id=>{const x=m.lamps&&m.lamps[id];if(!x||!B.has(x.brightness))throw new RangeError(id);return{brightness:x.brightness,bypassed:x.bypassed===true}};
const meter=(x,n)=>{if(!x||!MS.has(x.state)||typeof x.text!=='string')throw new RangeError(n);return{state:x.state,text:x.text}};
return{locked:m.locked,switchClosed:m.switchClosed,status:m.status,wires:wires(m.wires),lamps:{L1:lamp('L1'),L2:lamp('L2')},ammeter:meter(m.ammeter,'A'),voltmeter:meter(m.voltmeter,'V')}}
// Cable colours only help match a cable to its row in the wire list; meaning is always in words.
export const CABLE_COLOURS=Object.freeze(['#1f5f99','#7b3fa0','#0f7468','#a14a12','#3d4756','#8a6a00','#b0245e','#4f7a12','#2b6cb0','#8b3a3a']);

export function createCircuitBench(root,{text=CIRCUIT_TEXT,layout:forced=null}={}){
if(!root||!root.ownerDocument)throw new TypeError('root');
const d=root.ownerDocument,win=d.defaultView,uid='cgg-'+(++seq);
const bench=h(d,'section',{class:'cgg-bench','data-role':'circuit-bench',role:'region','aria-label':'電路接線板：先選一個端點，再選另一個端點就能接線；可用方向鍵在端點之間移動'});
const stage=h(d,'div',{class:'cgg-stage','data-role':'stage',role:'group'},bench);
const art=s(d,'svg',{class:'cgg-art',viewBox:'0 0 720 480',preserveAspectRatio:'none','aria-hidden':'true',focusable:'false'},stage);
const zoneLayer=s(d,'g',{class:'cgg-zones'},art),comp=s(d,'g',{class:'cgg-components'},art),wireLayer=s(d,'g',{class:'cgg-wire-layer'},art);
const preview=s(d,'path',{class:'cgg-wire-preview','data-role':'wire-preview',d:'',hidden:'hidden'},wireLayer);
const hint=h(d,'p',{class:'cgg-hint','data-role':'wire-hint','aria-live':'polite'},bench);
const terminals=new Map;for(const id of TERMINAL_IDS){const b=h(d,'button',{type:'button',class:'cgg-terminal','data-terminal':id,'data-polarity':id.endsWith('+')?'plus':id.endsWith('-')?'minus':'none','aria-label':text.terminal[id],'aria-pressed':'false'},stage);const dot=h(d,'span',{class:'cgg-terminal-dot','aria-hidden':'true'},b);dot.textContent=id.endsWith('+')?'+':id.endsWith('-')?'−':'';terminals.set(id,b)}
const sw=h(d,'button',{type:'button',class:'cgg-switch-button','data-switch-toggle':'true','aria-pressed':'false'},stage);
const reads=h(d,'div',{class:'cgg-readouts',role:'group','aria-label':'量測讀值'},bench);
function card(role,title){const c=h(d,'div',{class:'cgg-meter-card','data-meter':role},reads);h(d,'span',{class:'cgg-meter-title',text:title},c);return{card:c,value:h(d,'strong',{class:'cgg-meter-value','data-role':role+'-value'},c),state:h(d,'span',{class:'cgg-meter-state','data-role':role+'-state'},c)}}
const A=card('ammeter',text.component.ammeter),V=card('voltmeter',text.component.voltmeter);
const status=h(d,'p',{class:'cgg-status','data-role':'status',role:'status'},bench);
const box=h(d,'section',{class:'cgg-wire-box','aria-label':'目前導線'},bench);h(d,'div',{class:'cgg-wire-title',text:'目前導線'},box);
const list=h(d,'ul',{class:'cgg-wire-list'},box),empty=h(d,'p',{class:'cgg-wire-empty',text:'尚未接上導線。'},box);
root.appendChild(bench);

// ---- instrument art (rebuilt when the layout changes) ----
let L=null,parts=null,last=null;
function drawArt(){
 zoneLayer.replaceChildren();comp.replaceChildren();
 attr(art,'viewBox','0 0 '+L.width+' '+L.height);stage.style.aspectRatio=L.width+' / '+L.height;attr(bench,'data-layout',L.name);
 const P={};
 // spare tray for lamp 2
 const t=L.tray,spareBay=s(d,'g',{'data-role':'spare-lamp-bay','data-state':'spare'},zoneLayer);
 s(d,'rect',{x:t.x,y:t.y,width:t.w,height:t.h,rx:16,class:'cgg-equipment-bay','data-bay':'L2'},spareBay);
 P.spareLabel=s(d,'text',{x:t.label[0],y:t.label[1],class:'cgg-bay-label',text:text.body.spare},spareBay);
 P.spareHint=s(d,'title',{text:text.body.spareHint},spareBay);P.spareBay=spareBay;
 // battery: a cell standing upright, + cap on top, − base at the bottom
 const bt=L.battery;
 s(d,'rect',{x:bt.cap.x,y:bt.cap.y,width:bt.cap.w,height:bt.cap.h+4,rx:3,class:'cgg-component cgg-battery-cap'},comp);
 s(d,'rect',{x:bt.x,y:bt.y,width:bt.w,height:bt.h,rx:12,class:'cgg-component cgg-battery'},comp);
 s(d,'rect',{x:bt.x+4,y:bt.y+4,width:bt.w-8,height:Math.round(bt.h*.18),rx:8,class:'cgg-battery-band'},comp);
 s(d,'text',{x:bt.x+bt.w/2,y:bt.y+bt.h*.55,class:'cgg-component-mark','text-anchor':'middle',text:text.body.batteryMark},comp);
 s(d,'text',{x:bt.x+bt.w/2,y:bt.y+bt.h*.55+24,class:'cgg-component-label','text-anchor':'middle',text:text.body.batteryName},comp);
 // knife switch on a base board; terminals are the board ends
 const w=L.switch,ta=L.terminals['sw.a'],tb=L.terminals['sw.b'],pv=[ta.x+16,ta.y],ct=[tb.x-16,tb.y];
 s(d,'rect',{x:w.x,y:w.y,width:w.w,height:w.h,rx:8,class:'cgg-component cgg-switch-body'},comp);
 s(d,'line',{x1:ta.x,y1:ta.y,x2:pv[0],y2:pv[1],class:'cgg-metal'},comp);s(d,'line',{x1:ct[0],y1:ct[1],x2:tb.x,y2:tb.y,class:'cgg-metal'},comp);
 s(d,'circle',{cx:ct[0],cy:ct[1],r:5,class:'cgg-contact'},comp);
 P.lever=s(d,'line',{x1:pv[0],y1:pv[1],x2:ct[0],y2:ct[1]-24,class:'cgg-component-line cgg-switch-line'},comp);P.leverOpen=[ct[0]-4,ct[1]-26];P.leverClosed=ct;
 s(d,'circle',{cx:pv[0],cy:pv[1],r:5,class:'cgg-contact'},comp);
 s(d,'text',{x:w.label[0],y:w.label[1],class:'cgg-component-label','text-anchor':'middle',text:text.component.switch},comp);
 // meters: named box with a reading window; + on the left edge, − on the right edge
 const meter=(r,name,role,cls)=>{s(d,'rect',{x:r.x,y:r.y,width:r.w,height:r.h,rx:12,class:'cgg-component cgg-meter-body '+cls},comp);
  s(d,'text',{x:r.x+r.w/2,y:r.y+22,class:'cgg-meter-name','text-anchor':'middle',text:name},comp);
  s(d,'rect',{x:r.x+12,y:r.y+32,width:r.w-24,height:28,rx:6,class:'cgg-lcd'},comp);
  return s(d,'text',{x:r.x+r.w/2,y:r.y+52,class:'cgg-lcd-text','text-anchor':'middle','data-role':role+'-display'},comp)};
 P.aDisplay=meter(L.ammeter,text.component.ammeter,'ammeter','cgg-ammeter');P.vDisplay=meter(L.voltmeter,text.component.voltmeter,'voltmeter','cgg-voltmeter');
 // lamps on holders; terminals are the holder ends
 P.lamps={};
 for(const id of['L1','L2']){const r=L[id],c=lampCenter(r),g=s(d,'g',{class:'cgg-lamp','data-lamp':id},comp),ra=L.terminals[id+'.a'],rb=L.terminals[id+'.b'];
  s(d,'rect',{x:r.x,y:r.y,width:r.w,height:r.h,rx:12,class:'cgg-lamp-base',...(id==='L1'?{'data-bay':'L1'}:{})},g);
  s(d,'line',{x1:ra.x,y1:ra.y,x2:c.x-22,y2:c.y,class:'cgg-metal'},g);s(d,'line',{x1:c.x+22,y1:c.y,x2:rb.x,y2:rb.y,class:'cgg-metal'},g);
  const rays=s(d,'g',{class:'cgg-lamp-rays'},g);for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;s(d,'line',{x1:c.x+Math.cos(a)*27,y1:c.y+Math.sin(a)*27,x2:c.x+Math.cos(a)*38,y2:c.y+Math.sin(a)*38},rays)}
  s(d,'circle',{cx:c.x,cy:c.y,r:21,class:'cgg-bulb'},g);
  s(d,'path',{d:'M '+(c.x-10)+' '+(c.y+4)+' q 5 -12 10 0 q 5 12 10 0',class:'cgg-filament'},g);
  s(d,'text',{x:c.x,y:c.y+52,class:'cgg-component-label','text-anchor':'middle',text:text.component[id]},g);
  P.lamps[id]={g,badge:s(d,'text',{x:c.x,y:c.y+74,class:'cgg-lamp-state','text-anchor':'middle','data-role':'lamp-state'},g)}}
 parts=P;
 for(const [id,b] of terminals){const p=L.terminals[id];b.style.left=(p.x/L.width*100).toFixed(4)+'%';b.style.top=(p.y/L.height*100).toFixed(4)+'%'}
 sw.style.left=(w.button[0]/L.width*100).toFixed(4)+'%';sw.style.top=(w.button[1]/L.height*100).toFixed(4)+'%';
}
function setLayout(name){const next=BENCH_LAYOUTS[name];if(!next||next===L)return;L=next;drawArt();for(const n of wp.values())n.remove();wp.clear();if(last)update(last,true)}

// ---- cables ----
const wp=new Map,wr=new Map,colour=new Map;
function colourFor(k){if(!colour.has(k)){const used=new Set(colour.values());let i=0;while(used.has(i)&&i<CABLE_COLOURS.length)i++;colour.set(k,i%CABLE_COLOURS.length)}return CABLE_COLOURS[colour.get(k)]}
function highlight(k,on){const g=wp.get(k);if(g){if(on)g.setAttribute('data-highlight','true');else g.removeAttribute('data-highlight')}}
function sync(ws,locked){const want=new Set(ws.map(w=>w.key)),attached=new Set(ws.flatMap(w=>[w.from,w.to]));
 for(const [id,button] of terminals)attr(button,'data-connected',attached.has(id));
 for(const [k,n] of [...wp])if(!want.has(k)){n.remove();wp.delete(k)}
 for(const [k,n] of [...wr])if(!want.has(k)){n.remove();wr.delete(k)}
 for(const k of [...colour.keys()])if(!want.has(k))colour.delete(k);
 const routed=[];for(const w of ws){const g=wp.get(w.key);if(g)routed.push({from:w.from,to:w.to,pts:g._pts})}
 for(const w of ws){let g=wp.get(w.key);const c=colourFor(w.key);
  if(!g){const r=routeWire(w.from,w.to,{layout:L,others:routed});g=s(d,'g',{class:'cgg-cable','data-cable':w.key});
   s(d,'path',{class:'cgg-wire-halo',d:r.d},g);s(d,'path',{class:'cgg-wire','data-wire':w.key,'data-colour':c,d:r.d,style:'stroke:'+c},g);g._pts=r.pts;
   wireLayer.insertBefore(g,preview);wp.set(w.key,g);routed.push({from:w.from,to:w.to,pts:r.pts})}
  let row=wr.get(w.key);
  if(!row){row=h(d,'li',{class:'cgg-wire-row','data-wire-row':w.key},list);const sv=h(d,'span',{class:'cgg-wire-swatch','aria-hidden':'true'},row),l=h(d,'span',{class:'cgg-wire-label'},row),rm=h(d,'button',{type:'button',class:'cgg-wire-remove','data-remove-wire':w.key,text:'移除'},row);row._c={sv,l,rm};wr.set(w.key,row);
   const k=w.key;for(const [ev,on] of [['mouseenter',true],['mouseleave',false],['focusin',true],['focusout',false]])row.addEventListener(ev,()=>highlight(k,on))}
  else list.appendChild(row);
  row._c.sv.style.background=c;attr(row._c.sv,'data-colour',c);txt(row._c.l,text.terminal[w.from]+' — '+text.terminal[w.to]);attr(row._c.rm,'aria-label','移除 '+text.terminal[w.from]+' 到 '+text.terminal[w.to]+' 的導線');attr(row._c.rm,'data-from',w.from);attr(row._c.rm,'data-to',w.to);row._c.rm.disabled=locked}
 empty.hidden=ws.length!==0}

// ---- hint follows the input layer's selected terminal (data-wire-start) ----
let lockedNow=false;
function paintHint(){const sel=bench.getAttribute('data-wire-start');txt(hint,lockedNow?text.hint.locked:sel&&text.terminal[sel]?text.hint.selected.replace('{t}',text.terminal[sel]):text.hint.idle);attr(hint,'data-mode',lockedNow?'locked':sel?'selected':'idle')}
let mo=null;if(win&&win.MutationObserver){mo=new win.MutationObserver(paintHint);mo.observe(bench,{attributes:true,attributeFilter:['data-wire-start']})}

function update(x,relayout=false){const m=model(x);last=x;lockedNow=m.locked;attr(bench,'data-status',m.status);attr(bench,'data-locked',m.locked);
 for(const b of terminals.values())b.disabled=m.locked;sw.disabled=m.locked;attr(sw,'aria-pressed',m.switchClosed);txt(sw,m.switchClosed?'開關：閉合':'開關：斷開');
 const lv=m.switchClosed?parts.leverClosed:parts.leverOpen;attr(parts.lever,'x2',lv[0]);attr(parts.lever,'y2',lv[1]);
 sync(m.wires,m.locked);
 const used=id=>m.wires.some(w=>w.from.startsWith(id+'.')||w.to.startsWith(id+'.')),l2=used('L2');
 attr(parts.spareBay,'data-state',l2?'working':'spare');txt(parts.spareLabel,l2?text.body.working:text.body.spare);txt(parts.spareHint,l2?text.body.workingHint:text.body.spareHint);
 for(const id of['L1','L2']){const P=parts.lamps[id];attr(P.g,'data-brightness',m.lamps[id].brightness);attr(P.g,'data-bypassed',m.lamps[id].bypassed);attr(P.g,'data-wired',used(id));txt(P.badge,m.lamps[id].bypassed?'被導線繞過':(!used(id)?'未接線':text.brightness[m.lamps[id].brightness]))}
 for(const [n,z,disp] of[[A,m.ammeter,parts.aDisplay],[V,m.voltmeter,parts.vDisplay]]){txt(n.value,z.text||'—');txt(n.state,text.meterState[z.state]);attr(n.card,'data-state',z.state);txt(disp,z.text||'—')}
 txt(status,m.status==='normal'&&/^-\s*/.test(m.ammeter.text)?'電流表正負極接反：請交換電流表兩端再記錄。':text.status[m.status]);attr(status,'data-unsafe',m.status==='source-short');
 attr(stage,'aria-label','電路實驗桌，'+(m.switchClosed?'開關閉合':'開關斷開')+'，電流表 '+(m.ammeter.text||'—')+'，電壓表 '+(m.voltmeter.text||'—')+'，燈泡 1 '+text.brightness[m.lamps.L1.brightness]+'，燈泡 2 '+(l2?text.brightness[m.lamps.L2.brightness]:'未接線'));
 paintHint();
}
const pick=()=>{if(forced)return forced;const w=bench.getBoundingClientRect().width;return w>0&&w<PORTRAIT_BELOW?'portrait':'landscape'};
L=null;setLayout(pick());
let ro=null;if(!forced&&win&&win.ResizeObserver){ro=new win.ResizeObserver(()=>setLayout(pick()));ro.observe(bench)}
paintHint();
return{update:x=>update(x),destroy(){if(ro)ro.disconnect();if(mo)mo.disconnect();bench.remove()},element:bench,stage,uid,layout:()=>L.name}}
