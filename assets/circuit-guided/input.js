// Pilot #6 B2 input layer. Gestures only: no model/engine/science/storage/analytics imports.
const IDS=Object.freeze(['bat+','bat-','sw.a','sw.b','L1.a','L1.b','L2.a','L2.b','A.+','A.-','V.+','V.-']),SET=new Set(IDS),MOVE=6;
const term=b=>{const x=b&&b.getAttribute&&b.getAttribute('data-terminal');return SET.has(x)?x:null};
const buttons=r=>[...r.querySelectorAll('[data-terminal]')].filter(b=>term(b)!==null&&!b.hidden);
const inside=(q,x,y)=>q&&x>=q.left&&x<=q.right&&y>=q.top&&y<=q.bottom;
export function bindCircuitInput({root,getLocked=()=>false,getSwitchClosed=()=>false,canConnect=()=>true,canDisconnect=()=>true,canToggleSwitch=()=>true,onConnect,onDisconnect,onToggleSwitch}){
if(!root||!root.addEventListener)throw new TypeError('root');if(typeof onConnect!=='function'||typeof onDisconnect!=='function'||typeof onToggleSwitch!=='function')throw new TypeError('callbacks');
let alive=true,selected=null,drag=null,suppress=null; // suppress: the click a finished drag may still fire on its start terminal; any new press clears it
const bench=()=>root.querySelector('[data-role="circuit-bench"]')||root,preview=()=>root.querySelector('[data-role="wire-preview"]'),stage=()=>root.querySelector('[data-role="stage"]');
function paint(){for(const b of buttons(root)){const on=term(b)===selected;b.setAttribute('aria-pressed',on?'true':'false');if(on)b.setAttribute('data-selected','true');else b.removeAttribute('data-selected')}const x=bench();if(selected)x.setAttribute('data-wire-start',selected);else x.removeAttribute('data-wire-start')}
function cancelSelection(){selected=null;paint()}
const hit=(x,y)=>buttons(root).find(b=>!b.disabled&&inside(b.getBoundingClientRect(),x,y))||null;
function connect(a,b){if(!alive||getLocked()===true||!SET.has(a)||!SET.has(b)||a===b||canConnect(a,b)!==true)return false;onConnect(a,b);return true}
function disconnect(a,b){if(!alive||getLocked()===true||!SET.has(a)||!SET.has(b)||a===b||canDisconnect(a,b)!==true)return false;onDisconnect(a,b);return true}
function toggle(){if(!alive||getLocked()===true||canToggleSwitch()!==true)return false;onToggleSwitch(getSwitchClosed()!==true);return true}
function choose(id){if(!alive||getLocked()===true||!SET.has(id))return false;if(selected===null){selected=id;paint();return true}if(selected===id){cancelSelection();return true}const a=selected;if(connect(a,id))cancelSelection();return true}
function point(x,y){const st=stage(),p=preview();if(!st||!p)return null;const r=st.getBoundingClientRect(),v=(p.ownerSVGElement&&p.ownerSVGElement.getAttribute('viewBox')||'').trim().split(/\s+/).map(Number);if(!r.width||!r.height||v.length!==4||v.some(n=>!Number.isFinite(n)))return null;return{x:v[0]+(x-r.left)/r.width*v[2],y:v[1]+(y-r.top)/r.height*v[3]}}
function center(b){const r=b.getBoundingClientRect();return point(r.left+r.width/2,r.top+r.height/2)}
function draw(x,y){const p=preview(),a=drag&&center(drag.el),b=point(x,y);if(!p||!a||!b)return;p.removeAttribute('hidden');p.setAttribute('d','M '+a.x+' '+a.y+' L '+b.x+' '+b.y)}
function hide(){const p=preview();if(p){p.setAttribute('hidden','hidden');p.setAttribute('d','')}}
function clean(){if(!drag){hide();return}const d=drag;drag=null;try{if(d.el.hasPointerCapture&&d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id)}catch{}d.el.removeAttribute('data-dragging');bench().removeAttribute('data-dragging');hide()}
function click(e){const b=e.target&&e.target.closest&&e.target.closest('[data-terminal]');if(b&&root.contains(b)){const id=term(b);if(!id||b.disabled)return;if(suppress===id){suppress=null;e.preventDefault&&e.preventDefault();return}choose(id);return}const rm=e.target&&e.target.closest&&e.target.closest('[data-remove-wire]');if(rm&&root.contains(rm)&&!rm.disabled){if(disconnect(rm.getAttribute('data-from'),rm.getAttribute('data-to')))cancelSelection();return}const sw=e.target&&e.target.closest&&e.target.closest('[data-switch-toggle]');if(sw&&root.contains(sw)&&!sw.disabled&&toggle())cancelSelection()}
function key(e){if(e.key==='Escape'&&selected!==null){e.preventDefault();cancelSelection();return}const b=e.target&&e.target.closest&&e.target.closest('[data-terminal]');if(!b||!root.contains(b)||b.disabled||b.hidden)return;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;const a=buttons(root).filter(x=>!x.disabled);if(!a.length)return;const i=Math.max(0,a.indexOf(b));let t;if(e.key==='Home')t=a[0];else if(e.key==='End')t=a[a.length-1];else if(e.key==='ArrowLeft'||e.key==='ArrowUp')t=a[Math.max(0,i-1)];else t=a[Math.min(a.length-1,i+1)];e.preventDefault();t.focus()}
function down(e){suppress=null;const b=e.target&&e.target.closest&&e.target.closest('[data-terminal]');if(!b||!root.contains(b)||b.disabled||getLocked()===true||(e.button!==undefined&&e.button!==0))return;clean();drag={el:b,terminal:term(b),id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};try{b.setPointerCapture&&b.setPointerCapture(e.pointerId)}catch{}b.setAttribute('data-dragging','true');bench().setAttribute('data-dragging','true')}
const mine=e=>drag&&e.pointerId===drag.id;
function move(e){if(!mine(e))return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>=MOVE)drag.moved=true;if(drag.moved){draw(e.clientX,e.clientY);e.preventDefault&&e.preventDefault()}}
function up(e){if(!mine(e))return;const d=drag,t=d.moved?hit(e.clientX,e.clientY):null;clean();if(!d.moved)return;suppress=d.terminal;if(t){const id=term(t);if(id&&id!==d.terminal&&connect(d.terminal,id))cancelSelection()}e.preventDefault&&e.preventDefault()}
const cancel=e=>{if(mine(e))clean()},handlers={click,keydown:key,pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,lostpointercapture:cancel};
for(const [n,f]of Object.entries(handlers))root.addEventListener(n,f);
return{cancelSelection,selectedTerminal:()=>selected,destroy(){if(!alive)return;clean();cancelSelection();alive=false;for(const [n,f]of Object.entries(handlers))root.removeEventListener(n,f)}}}
export const INPUT_TERMINALS=IDS;
