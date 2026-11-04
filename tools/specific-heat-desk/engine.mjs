import {MODEL_VERSION,CONFIGS,sample,parseNumber} from './model.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
const KEYS=['q1','waterRise','ironRise','materialChoice','q2','heavyRise','massChoice'];
const METHODS=['play','step','jump'];
export const MAX_RECORDS=60;
const uid=()=>globalThis.crypto?.randomUUID?.()||`run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const fresh=()=>({phase:'ready',round:'material',slots:[null,null],run:null,records:[],comparisons:{material:[],mass:[]},answers:Object.fromEntries(KEYS.map(k=>[k,''])),checks:Object.fromEntries(KEYS.map(k=>[k,false])),checkProofs:{},complete:false});
function legalPair(records,ids,kind){
 if(!Array.isArray(ids)||ids.length!==2||ids[0]===ids[1])return false;
 const r=ids.map(id=>records.find(r=>r.id===id));if(r.some(x=>!x))return false;
 const types=r.map(x=>x.configId).sort().join(',');
 return kind==='material'?types==='iron100,water100'&&r[0].runId===r[1].runId:types==='iron100,iron200';
}
function validateRecord(r){
 if(!r||typeof r.configId!=='string'||!Object.hasOwn(CONFIGS,r.configId)||typeof r.id!=='string'||!r.id||r.id.length>180||typeof r.runId!=='string'||!r.runId||r.runId.length>128||r.modelVersion!==MODEL_VERSION)throw Error('封存資料格式不符');
 const c=CONFIGS[r.configId];
 if(r.mass!==c.mass||r.material!==c.material||r.initialTemperature!==20||r.power!==21||r.time!==60||r.temperature!==sample(c.id,60).temperature||r.displayPrecision!==1)throw Error('封存條件超出模型範圍');
 if(!Array.isArray(r.samples)||r.samples.length<2||r.samples.length>4||r.samples[0].time!==0||r.samples.at(-1).time!==60)throw Error('取樣資料不完整');
 let prev=-1;for(const p of r.samples){if(![0,20,40,60].includes(p.time)||p.time<=prev||p.configId!==c.id||p.temperature!==sample(c.id,p.time).temperature)throw Error('取樣資料不符');prev=p.time;}
 if(!Array.isArray(r.methods)||!r.methods.length||r.methods.some(m=>!METHODS.includes(m))||new Set(r.methods).size!==r.methods.length)throw Error('觀察方式不符');
 const times=r.samples.map(p=>p.time);
 const jumped=r.methods.includes('jump');
 // A jump terminates the run. Earlier observations must be an uninterrupted
 // prefix of checkpoints, never invented points from the skipped interval.
 if(jumped){
  if(r.methods.at(-1)!=='jump'||(r.methods.length===1&&times.length!==2)||times.slice(1,-1).some((t,i)=>t!==[20,40][i]))throw Error('觀察方式與取樣紀錄不符');
 }else if(times.join(',')!=='0,20,40,60')throw Error('完整播放或逐步紀錄缺少模型取樣');
 return freeze(clone(r));
}
/** Mutable session, immutable public state. Only sealed records/answers are durable.
 * place uses slot 0/1; round two uses slot 0. advance is accepted while running,
 * or paused for step/jump. UI must pause before confirmed new-round replacement.
 * checkAnswers returns {checks, feedback, complete}; numeric tolerance is 0.05°C.
 */
export function createEngine(snapshot){
 let s=fresh();
 if(snapshot!==undefined){
  if(!snapshot||snapshot.schema!==1||snapshot.modelVersion!==MODEL_VERSION||!Array.isArray(snapshot.records)||snapshot.records.length>MAX_RECORDS||JSON.stringify(snapshot).length>131072)throw Error('無法安全還原這份資料');
  s.records=snapshot.records.map(validateRecord);
  if(new Set(s.records.map(r=>r.id)).size!==s.records.length)throw Error('封存識別碼重複');
  for(const r of s.records.filter(r=>r.configId!=='iron200')){
   const pair=s.records.filter(x=>x.runId===r.runId);
   if(pair.length!==2||!legalPair(s.records,pair.map(x=>x.id),'material')||JSON.stringify(pair[0].samples.map(x=>x.time))!==JSON.stringify(pair[1].samples.map(x=>x.time))||JSON.stringify(pair[0].methods)!==JSON.stringify(pair[1].methods))throw Error('第一輪成對封存資料不符');
  }
  for(const r of s.records.filter(r=>r.configId==='iron200'))if(s.records.filter(x=>x.runId===r.runId).length!==1)throw Error('第二輪封存資料不符');
  if(!snapshot.comparisons||!snapshot.answers)throw Error('比較資料不完整');
  for(const kind of ['material','mass']){
   const ids=snapshot.comparisons[kind];if(!Array.isArray(ids)||ids.length>2||ids.some(id=>typeof id!=='string'||!s.records.some(r=>r.id===id)))throw Error('比較引用不存在');s.comparisons[kind]=[...ids];
  }
  for(const k of KEYS){if(typeof snapshot.answers[k]!=='string'||snapshot.answers[k].length>1000)throw Error('答案資料不符');s.answers[k]=snapshot.answers[k];}
  // Proofs bind raw answers and source evidence; stored boolean pass flags are ignored.
 }
 const proof=kind=>JSON.stringify({version:MODEL_VERSION,kind,records:s.comparisons[kind].map(id=>s.records.find(r=>r.id===id)),answers:Object.fromEntries((kind==='material'?KEYS.slice(0,4):KEYS.slice(4)).map(k=>[k,s.answers[k]]))});
 const invalidate=kind=>{delete s.checkProofs[kind];for(const k of kind==='material'?KEYS.slice(0,4):KEYS.slice(4))s.checks[k]=false;s.complete=false;};
 const api={
  get state(){return freeze(clone(s));},
  place(slot,id){if(![0,1].includes(slot)||typeof id!=='string'||!Object.hasOwn(CONFIGS,id))throw Error('請選擇有效樣本座與材料');if(s.run&&s.phase!=='sealed')throw Error('請先確認使用新樣本另開一輪');if(s.round==='material'&&id==='iron200')throw Error('第一輪先比較兩份 100 g 樣本');if(s.round==='mass'&&(slot!==0||id!=='iron200'))throw Error('本輪只使用新的 200 g 鐵');s.slots[slot]=id;s.phase='ready';s.run=null;return api.state;},
  start(){if(s.phase==='running'||s.phase==='finished'||s.phase==='sealed')return api.state;if(s.phase==='paused'){s.phase='running';return api.state;}const ids=s.round==='material'?[...s.slots]:[s.slots[0]];if(s.round==='material'&&ids.slice().sort().join(',')!=='iron100,water100')throw Error('請各放入水 100 g 和鐵 100 g');if(s.round==='mass'&&ids[0]!=='iron200')throw Error('請放入新的鐵 200 g');s.run={id:uid(),ids,time:0,samples:ids.map(id=>[sample(id,0)]),methods:[]};s.phase='running';return api.state;},
  pause(){if(s.phase==='running')s.phase='paused';return api.state;},
  advance(seconds,method='play'){if(!Number.isFinite(seconds)||seconds<0||!METHODS.includes(method))throw Error('時間或觀察方式不符');if(!s.run||!(s.phase==='running'||(s.phase==='paused'&&method!=='play')))return api.state;const old=s.run.time;const t=method==='jump'?60:Math.min(60,old+seconds);if(t===old)return api.state;s.run.time=t;if(!s.run.methods.includes(method))s.run.methods.push(method);for(let i=0;i<s.run.ids.length;i++)for(const cp of [20,40,60])if(cp>old&&cp<=t&&(method!=='jump'||cp===60))s.run.samples[i].push(sample(s.run.ids[i],cp));if(t===60)s.phase='finished';return api.state;},
  jump(){return api.advance(60,'jump');},
  seal(){if(s.phase==='sealed')return api.state;if(s.phase!=='finished')throw Error('請先完成 60 模型秒觀察');const run=s.run;if(s.records.length+run.ids.length>MAX_RECORDS)throw Error('封存卡已滿，請先匯出再刪除舊的比較組');const records=run.ids.map((id,i)=>{const c=CONFIGS[id];return freeze({id:`${run.id}:${id}`,runId:run.id,configId:id,material:c.material,mass:c.mass,initialTemperature:20,power:21,time:60,temperature:sample(id,60).temperature,samples:clone(run.samples[i]),methods:[...run.methods],displayPrecision:1,modelVersion:MODEL_VERSION});});s.records.push(...records);s.phase='sealed';if(s.round==='material'){s.comparisons.material=records.map(r=>r.id);invalidate('material');}else{const iron=s.records.find(r=>r.id===s.comparisons.material.find(id=>s.records.find(x=>x.id===id)?.configId==='iron100'));s.comparisons.mass=iron?[iron.id,records[0].id]:[records[0].id];invalidate('mass');}return api.state;},
  prepareMassRound(){if(!legalPair(s.records,s.comparisons.material,'material'))throw Error('請先收下第一組比較');s.round='mass';s.slots=[null,null];s.run=null;s.phase='ready';return api.state;},
  newMaterialRound(){s.round='material';s.slots=[null,null];s.run=null;s.phase='ready';return api.state;},
  setComparison(kind,ids){if(!['material','mass'].includes(kind)||!Array.isArray(ids)||ids.length>2||ids.some(id=>!s.records.some(r=>r.id===id)))throw Error('比較卡不存在');s.comparisons[kind]=[...ids];invalidate(kind);return api.state;},
  deleteRecord(id){const target=s.records.find(r=>r.id===id);if(!target)return api.state;const removed=s.records.filter(r=>r.runId===target.runId).map(r=>r.id);s.records=s.records.filter(r=>!removed.includes(r.id));for(const kind of ['material','mass'])if(s.comparisons[kind].some(id=>removed.includes(id))){s.comparisons[kind]=s.comparisons[kind].filter(id=>!removed.includes(id));invalidate(kind);}return api.state;},
  setAnswer(key,raw){if(!KEYS.includes(key)||String(raw).length>1000)throw Error('答案格式不符');s.answers[key]=String(raw);invalidate(KEYS.indexOf(key)<4?'material':'mass');return api.state;},
  checkAnswers(){const feedback={};const expected={q1:1260,waterRise:3,ironRise:28,q2:1260,heavyRise:14};for(const k of KEYS){const kind=KEYS.indexOf(k)<4?'material':'mass';const legal=legalPair(s.records,s.comparisons[kind],kind);const v=parseNumber(s.answers[k]);s.checks[k]=legal&&(k==='materialChoice'?s.answers[k]==='water':k==='massChoice'?s.answers[k]==='rise-half':Math.abs(v-expected[k])<.05);if(!s.checks[k])feedback[k]=!legal?'請選擇只改一項條件的兩張封存卡。':k.startsWith('q')?(v===2520?'2520 J 是兩份合計；這裡要算每一份。':v===21?'21 W 是每模型秒吸收 21 J，還要乘上 60 秒。':'每份熱量＝21 W × 60 模型秒，請填 J。'):k.includes('Rise')?(v===23||v===48||v===34?'這是終溫，溫升還要扣掉初溫 20°C。':'溫升＝終溫－初溫 20°C。'):k==='materialChoice'?'比較相同質量、功率和時間下的溫升。':'質量加倍後，減半的是溫升，不是終溫。';}s.complete=KEYS.every(k=>s.checks[k]);for(const kind of ['material','mass'])s.checkProofs[kind]=proof(kind);return freeze({checks:clone(s.checks),feedback,complete:s.complete});},
  replay(recordId,time){const r=s.records.find(r=>r.id===recordId);if(!r)throw Error('封存卡不存在');return freeze({recordId,reading:sample(r.configId,time),reconstructed:true});},
  snapshot(){return clone({schema:1,modelVersion:MODEL_VERSION,records:s.records,comparisons:s.comparisons,answers:s.answers,checkProofs:s.checkProofs});}
 };
 if(snapshot){const valid=Object.fromEntries(['material','mass'].map(kind=>[kind,typeof snapshot.checkProofs?.[kind]==='string'&&snapshot.checkProofs[kind]===proof(kind)]));api.checkAnswers();for(const kind of ['material','mass'])if(!valid[kind])invalidate(kind);s.complete=KEYS.every(k=>s.checks[k]);}
 return api;
}
