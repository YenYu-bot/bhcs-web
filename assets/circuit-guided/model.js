// Pure circuit truth for Science Lab 2.0 Pilot #6 B1.
// No DOM, learner wording, persistence, analytics or phase transitions.

export const TERMINALS = Object.freeze([
  'bat+', 'bat-', 'sw.a', 'sw.b',
  'L1.a', 'L1.b', 'L2.a', 'L2.b',
  'A.+', 'A.-', 'V.+', 'V.-',
]);
export const LAMP_IDS = Object.freeze(['L1', 'L2']);
export const MAX_WIRES = 10;
export const BATTERY_VOLTAGE = 6;
export const LAMP_RESISTANCE = 6;

const TERM_SET = new Set(TERMINALS);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const absBI = (x) => x < 0n ? -x : x;
function gcd(a, b) { a = absBI(a); b = absBI(b); while (b) [a, b] = [b, a % b]; return a || 1n; }
function R(n, d = 1n) {
  n = typeof n === 'bigint' ? n : BigInt(n); d = typeof d === 'bigint' ? d : BigInt(d);
  if (d === 0n) throw new RangeError('zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d); return { n: n / g, d: d / g };
}
const ZERO = R(0), ONE = R(1), SIX = R(6);
const rAdd = (a,b) => R(a.n*b.d + b.n*a.d, a.d*b.d);
const rSub = (a,b) => R(a.n*b.d - b.n*a.d, a.d*b.d);
const rMul = (a,b) => R(a.n*b.n, a.d*b.d);
const rDiv = (a,b) => { if (b.n === 0n) throw new RangeError('divide by zero'); return R(a.n*b.d, a.d*b.n); };
const rNeg = (a) => R(-a.n, a.d);
const rZero = (a) => a.n === 0n;
const rPos = (a) => a.n > 0n;
const rAbs = (a) => a.n < 0n ? rNeg(a) : a;
const rExact = (a) => a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;
const rValue = (a) => Number(a.n) / Number(a.d);
const shown = (a) => a === null ? null : Object.freeze({ value: rValue(a), exact: rExact(a) });

export const exactEquals = (reading, exact) => reading !== null && reading?.exact === String(exact);
export const isTerminal = (v) => typeof v === 'string' && TERM_SET.has(v);
function wireKey(a, b) { return a < b ? `${a}|${b}` : `${b}|${a}`; }

export function validateWires(wires) {
  if (!Array.isArray(wires)) throw new TypeError('wires must be an array');
  if (wires.length > MAX_WIRES) throw new RangeError(`at most ${MAX_WIRES} wires`);
  const seen = new Set();
  return wires.map((w, i) => {
    if (!w || typeof w !== 'object' || Array.isArray(w)) throw new TypeError(`wire ${i} must be an object`);
    const from = own(w, 'from') ? w.from : undefined, to = own(w, 'to') ? w.to : undefined;
    if (!isTerminal(from) || !isTerminal(to)) throw new RangeError(`wire ${i} uses an unknown terminal`);
    if (from === to) throw new RangeError(`wire ${i} connects a terminal to itself`);
    const key = wireKey(from, to); if (seen.has(key)) throw new RangeError(`duplicate wire ${key}`);
    seen.add(key); return { from, to };
  });
}
export function normalizeRaw(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('raw circuit is required');
  return { wires: validateWires(raw.wires ?? []), switchClosed: raw.switchClosed === true };
}

class UF {
  constructor(items) { this.p = new Map(items.map((x) => [x, x])); }
  find(x) { const p = this.p.get(x); if (p === x) return x; const r = this.find(p); this.p.set(x, r); return r; }
  union(a,b) { a=this.find(a); b=this.find(b); if (a===b) return; const keep=a<b?a:b, lose=a<b?b:a; this.p.set(lose,keep); }
}
function nodeMap(raw, includeAmmeter = false) {
  const uf = new UF(TERMINALS);
  for (const w of raw.wires) uf.union(w.from, w.to);
  if (raw.switchClosed) uf.union('sw.a', 'sw.b');
  if (includeAmmeter) uf.union('A.+', 'A.-');
  const groups = new Map();
  for (const t of TERMINALS) { const r=uf.find(t); if(!groups.has(r)) groups.set(r,[]); groups.get(r).push(t); }
  const ordered=[...groups.values()].map((g)=>g.sort()).sort((a,b)=>a[0].localeCompare(b[0]));
  const id=new Map(); ordered.forEach((g,i)=>g.forEach((t)=>id.set(t,`n${i}`)));
  return Object.fromEntries(TERMINALS.map((t)=>[t,id.get(t)]));
}
function edgeGraph(nodes, edges) {
  const g=new Map(nodes.map((n)=>[n,new Set()]));
  for(const e of edges){ if(e.u===e.v)continue; if(!g.has(e.u))g.set(e.u,new Set()); if(!g.has(e.v))g.set(e.v,new Set()); g.get(e.u).add(e.v); g.get(e.v).add(e.u); }
  return g;
}
function reachableFrom(graph,seeds){const seen=new Set(),q=[...new Set(seeds)];while(q.length){const x=q.shift();if(seen.has(x))continue;seen.add(x);for(const y of graph.get(x)??[])if(!seen.has(y))q.push(y);}return seen;}
function solveLinear(A,b){
  const n=A.length;if(n===0)return[];const M=A.map((row,i)=>[...row.map((x)=>R(x.n,x.d)),R(b[i].n,b[i].d)]);
  for(let col=0;col<n;col++){let pivot=col;while(pivot<n&&rZero(M[pivot][col]))pivot++;if(pivot===n)return null;if(pivot!==col)[M[pivot],M[col]]=[M[col],M[pivot]];const p=M[col][col];for(let j=col;j<=n;j++)M[col][j]=rDiv(M[col][j],p);for(let i=0;i<n;i++){if(i===col||rZero(M[i][col]))continue;const f=M[i][col];for(let j=col;j<=n;j++)M[i][j]=rSub(M[i][j],rMul(f,M[col][j]));}}
  return M.map((row)=>row[n]);
}

function coreSolve(rawInput,{includeAmmeter=true,removeLamp=null}={}){
  const raw=normalizeRaw(rawInput),pre=nodeMap(raw,false),pNode=pre['bat+'],nNode=pre['bat-'],amP=pre['A.+'],amN=pre['A.-'];
  const amAmbiguous=includeAmmeter&&amP===amN;
  const zero=nodeMap(raw,includeAmmeter&&!amAmbiguous);
  if(zero['bat+']===zero['bat-'])return{raw,status:'source-short',pre,zero,potentials:{},battery:null,ammeter:{state:amAmbiguous?'ambiguous':'source-short',current:null},lamps:{L1:null,L2:null},connectedNodes:new Set()};
  const resistors=[];if(removeLamp!=='L1')resistors.push({id:'L1',u:pre['L1.a'],v:pre['L1.b'],R:R(LAMP_RESISTANCE)});if(removeLamp!=='L2')resistors.push({id:'L2',u:pre['L2.a'],v:pre['L2.b'],R:R(LAMP_RESISTANCE)});
  const amEdge=includeAmmeter&&!amAmbiguous?{id:'A',u:amP,v:amN}:null;
  const nodes=[...new Set(Object.values(pre))],conductiveEdges=[...resistors,...(amEdge?[amEdge]:[])],graph=edgeGraph(nodes,conductiveEdges),active=reachableFrom(graph,[pNode,nNode]);
  const known=new Map([[pNode,SIX],[nNode,ZERO]]),unknownNodes=[...active].filter((n)=>!known.has(n)).sort(),idx=new Map(unknownNodes.map((n,i)=>[n,i]));
  const amActive=amEdge&&active.has(amP)&&active.has(amN),aIndex=amActive?unknownNodes.length:null,size=unknownNodes.length+(amActive?1:0);
  const A=Array.from({length:size},()=>Array.from({length:size},()=>ZERO)),b=Array.from({length:size},()=>ZERO),addA=(i,j,x)=>{A[i][j]=rAdd(A[i][j],x);},addB=(i,x)=>{b[i]=rAdd(b[i],x);};
  for(const e of resistors){if(!active.has(e.u)||!active.has(e.v)||e.u===e.v)continue;const g=rDiv(ONE,e.R);for(const[u,v]of[[e.u,e.v],[e.v,e.u]]){if(!idx.has(u))continue;const i=idx.get(u);addA(i,i,g);if(idx.has(v))addA(i,idx.get(v),rNeg(g));else if(known.has(v))addB(i,rMul(g,known.get(v)));}}
  if(amActive){if(idx.has(amP))addA(idx.get(amP),aIndex,ONE);if(idx.has(amN))addA(idx.get(amN),aIndex,rNeg(ONE));let rhs=ZERO;if(idx.has(amP))addA(aIndex,idx.get(amP),ONE);else if(known.has(amP))rhs=rSub(rhs,known.get(amP));if(idx.has(amN))addA(aIndex,idx.get(amN),rNeg(ONE));else if(known.has(amN))rhs=rAdd(rhs,known.get(amN));b[aIndex]=rhs;}
  const x=solveLinear(A,b);if(x===null)return{raw,status:'indeterminate',pre,zero,potentials:{},battery:null,ammeter:{state:amAmbiguous?'ambiguous':'indeterminate',current:null},lamps:{L1:null,L2:null},connectedNodes:active};
  const nodeV=new Map(known);unknownNodes.forEach((n,i)=>nodeV.set(n,x[i]));const amCurrent=amAmbiguous?null:amActive?x[aIndex]:ZERO;
  const terminalVoltage=(t)=>{const n=pre[t];return active.has(n)&&nodeV.has(n)?nodeV.get(n):null;};
  function lampResult(id){if(removeLamp===id)return{id,current:ZERO,voltage:null,power:ZERO,active:false,inCircuit:false};const va=terminalVoltage(`${id}.a`),vb=terminalVoltage(`${id}.b`),inCircuit=va!==null&&vb!==null;if(!inCircuit)return{id,current:ZERO,voltage:null,power:ZERO,active:false,inCircuit:false};const voltage=rSub(va,vb),current=rDiv(voltage,R(LAMP_RESISTANCE)),power=rMul(rAbs(voltage),rAbs(current));return{id,current,voltage,power,active:!rZero(current),inCircuit:true};}
  const L1=lampResult('L1'),L2=lampResult('L2');let battery=ZERO;
  for(const e of resistors){if(!active.has(e.u)||!active.has(e.v)||e.u===e.v)continue;if(e.u===pNode||e.v===pNode){const other=e.u===pNode?e.v:e.u,vo=nodeV.get(other);if(vo!==undefined)battery=rAdd(battery,rDiv(rSub(SIX,vo),e.R));}}
  if(amActive&&amCurrent!==null){if(amP===pNode)battery=rAdd(battery,amCurrent);if(amN===pNode)battery=rSub(battery,amCurrent);}
  return{raw,status:rZero(battery)?'open':'normal',pre,zero,potentials:Object.fromEntries(TERMINALS.map((t)=>[t,terminalVoltage(t)])),battery,ammeter:{state:amAmbiguous?'ambiguous':'ok',current:amCurrent},lamps:{L1,L2},connectedNodes:active};
}

function unorderedPair(a,b){return a<b?`${a}|${b}`:`${b}|${a}`;}
function brightnessBand(power){if(power===null||rZero(power))return'off';const v=rValue(power);if(v<1)return'very-low';if(v<4)return'low';if(v<=7)return'reference';return'high';}
const readingOf=(r)=>shown(r),absReadingOf=(r)=>shown(r===null?null:rAbs(r));
function deriveTopology(raw,core){if(core.status==='source-short'||core.status==='indeterminate')return'other';const l1=core.lamps.L1,l2=core.lamps.L2;if(l1?.active&&!l2?.active)return'single-L1';if(l2?.active&&!l1?.active)return'single-L2';if(!l1?.active||!l2?.active)return'other';const z=core.zero,p1=unorderedPair(z['L1.a'],z['L1.b']),p2=unorderedPair(z['L2.a'],z['L2.b']);if(p1===p2&&z['L1.a']!==z['L1.b'])return'two-path';const no1=coreSolve(raw,{removeLamp:'L1'}),no2=coreSolve(raw,{removeLamp:'L2'}),l2After=no1.lamps.L2?.current,l1After=no2.lamps.L1?.current;if(l2After&&l1After&&rZero(l2After)&&rZero(l1After))return'one-path';return'other';}
function derivePlacement(raw,core,topology){if(core.status==='source-short')return'source-short';if(core.ammeter.state==='ambiguous')return'ambiguous';const pre=core.pre,z=core.zero,bypassByMeter=(id)=>pre[`${id}.a`]!==pre[`${id}.b`]&&z[`${id}.a`]===z[`${id}.b`];if(bypassByMeter('L1'))return'parallel-to-L1';if(bypassByMeter('L2'))return'parallel-to-L2';const noA=coreSolve(raw,{includeAmmeter:false}),b=core.battery,b0=noA.battery;if(b&&b0&&!rZero(b)&&rZero(b0))return'total-current';if(topology==='two-path'){const a1=core.lamps.L1.current,a2=core.lamps.L2.current,n1=noA.lamps.L1?.current,n2=noA.lamps.L2?.current;if(a1&&a2&&n1&&n2&&!rZero(a1)&&!rZero(a2)&&rZero(n1)&&!rZero(n2))return'L1-branch';if(a1&&a2&&n1&&n2&&!rZero(a1)&&!rZero(a2)&&!rZero(n1)&&rZero(n2))return'L2-branch';}return'other';}

export function solveCircuit(rawInput={}){
  const raw=normalizeRaw(rawInput),core=coreSolve(raw);
  const blank=(status,amState='unavailable',placement='other')=>Object.freeze({status,batteryCurrent:null,equivalentResistance:null,topology:'other',ammeter:Object.freeze({state:amState,placement,reading:null}),voltmeter:Object.freeze({state:'unavailable',reading:null,across:null}),lamps:Object.freeze({L1:Object.freeze({active:false,inCircuit:false,bypassed:false,current:null,voltage:null,power:null,brightness:'off'}),L2:Object.freeze({active:false,inCircuit:false,bypassed:false,current:null,voltage:null,power:null,brightness:'off'})}),switchClosed:raw.switchClosed});
  if(core.status==='source-short')return blank('source-short',core.ammeter.state,'source-short');if(core.status==='indeterminate')return blank('indeterminate',core.ammeter.state,'other');
  const topology=deriveTopology(raw,core),placement=derivePlacement(raw,core,topology),zero=core.zero,acrossLamp=(id)=>unorderedPair(zero['V.+'],zero['V.-'])===unorderedPair(zero[`${id}.a`],zero[`${id}.b`])&&zero[`${id}.a`]!==zero[`${id}.b`],vp=core.potentials['V.+'],vn=core.potentials['V.-'],vReading=vp!==null&&vn!==null?rSub(vp,vn):null,bypassed=(id)=>zero[`${id}.a`]===zero[`${id}.b`];
  const lampOut=(id)=>{const l=core.lamps[id];return Object.freeze({active:l.active,inCircuit:l.inCircuit,bypassed:bypassed(id),current:absReadingOf(l.current),signedCurrent:readingOf(l.current),voltage:l.voltage===null?null:absReadingOf(l.voltage),signedVoltage:readingOf(l.voltage),power:readingOf(l.power),brightness:brightnessBand(l.power)});};
  const eq=core.battery&&rPos(core.battery)?rDiv(SIX,core.battery):null;
  return Object.freeze({status:core.status,batteryCurrent:core.battery===null?null:readingOf(core.battery),equivalentResistance:readingOf(eq),topology,ammeter:Object.freeze({state:core.ammeter.state,placement,reading:core.ammeter.current===null?null:readingOf(core.ammeter.current)}),voltmeter:Object.freeze({state:vReading===null?'floating':'ok',reading:readingOf(vReading),across:acrossLamp('L1')?'L1':acrossLamp('L2')?'L2':null}),lamps:Object.freeze({L1:lampOut('L1'),L2:lampOut('L2')}),switchClosed:raw.switchClosed});
}
export function allCurrentsZero(result){if(!result||result.status==='source-short'||result.status==='indeterminate')return false;const vals=[result.batteryCurrent,result.lamps?.L1?.current,result.lamps?.L2?.current];return vals.every((x)=>x!==null&&x.exact==='0');}

const freezeWires=(w)=>Object.freeze(w.map((x)=>Object.freeze({...x}))),W=(...pairs)=>freezeWires(pairs.map(([from,to])=>({from,to})));
export const FIXED_CIRCUITS=Object.freeze({
  baseline:W(['bat+','sw.a'],['sw.b','A.+'],['A.-','L1.a'],['L1.b','bat-'],['V.+','L1.a'],['V.-','L1.b']),
  trial1:W(['bat+','sw.a'],['sw.b','A.+'],['A.-','L1.a'],['L1.b','L2.a'],['L2.b','bat-'],['V.+','L1.a'],['V.-','L1.b']),
  trial2Total:W(['bat+','sw.a'],['sw.b','A.+'],['A.-','L1.a'],['A.-','L2.a'],['L1.b','bat-'],['L2.b','bat-'],['V.+','L1.a'],['V.-','L1.b']),
  trial2L1:W(['bat+','sw.a'],['sw.b','A.+'],['sw.b','L2.a'],['A.-','L1.a'],['L1.b','bat-'],['L2.b','bat-'],['V.+','L1.a'],['V.-','L1.b']),
  trial2L2:W(['bat+','sw.a'],['sw.b','L1.a'],['sw.b','A.+'],['A.-','L2.a'],['L1.b','bat-'],['L2.b','bat-'],['V.+','L1.a'],['V.-','L1.b']),
});
export const CHALLENGE_BASES=Object.freeze({
  2:Object.freeze({switchClosed:false,wires:W(['bat+','sw.a'],['sw.b','L1.a'],['L1.b','L2.a'],['L2.b','bat-'])}),
  3:Object.freeze({switchClosed:false,wires:W(['bat+','sw.a'],['sw.b','L1.a'],['sw.b','L2.a'],['L1.b','bat-'],['L2.b','bat-'])}),
});
export function rawFromFixed(name,switchClosed=true){if(!Object.hasOwn(FIXED_CIRCUITS,name))throw new RangeError(`unknown fixed circuit ${name}`);return{wires:FIXED_CIRCUITS[name].map((w)=>({...w})),switchClosed};}
