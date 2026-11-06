import {FRESH,restore as restoreV1} from './model.mjs';
export const SOLUTIONS=Object.freeze({
 CuSO4:{name:'硫酸銅',formula:'CuSO₄',ion:'Cu',color:'#8ed3e6',colorName:'藍色'},
 FeSO4:{name:'硫酸亞鐵',formula:'FeSO₄',ion:'Fe',color:'#dbe8ce',colorName:'很淡的綠色'},
 ZnSO4:{name:'硫酸鋅',formula:'ZnSO₄',ion:'Zn',color:'#edf4ee',colorName:'無色'}
});
const positive={ZnCuSO4:['Cu','ZnCu','Zn > Cu','Zn + Cu²⁺ → Zn²⁺ + Cu'],FeCuSO4:['Cu','FeCu','Fe > Cu','Fe + Cu²⁺ → Fe²⁺ + Cu'],ZnFeSO4:['Fe','ZnFe','Zn > Fe','Zn + Fe²⁺ → Zn²⁺ + Fe']};
export const PAIRS=Object.freeze({ZnCu:{label:'鋅與銅',metals:['Zn','Cu']},FeCu:{label:'鐵與銅',metals:['Fe','Cu']},ZnFe:{label:'鋅與鐵',metals:['Zn','Fe']}});
export function outcome(m,s){
 if(typeof m!=='string'||!['Zn','Fe','Cu'].includes(m)||typeof s!=='string'||!Object.hasOwn(SOLUTIONS,s))return null;
 const rule=positive[m+s];
 if(!rule)return {reacts:false,deposit:null,pair:null,relation:null,equation:'在此模型條件下，無淨置換反應',surface:'未見新的固體析出',liquid:`溶液仍呈${SOLUTIONS[s].colorName}，沒有明顯變化。`,observation:'在這次觀察條件下，未見明顯置換現象。',interpretation:'未見變化是一項紀錄，但單靠這杯不能確定兩種不同金屬的活性先後。'};
 const [deposit,pair,relation,equation]=rule;
 return {reacts:true,deposit,pair,relation,equation,surface:deposit==='Fe'?'表面出現灰色至灰黑色固體':'表面出現紅棕色固體',liquid:s==='FeSO4'?'原本很淡的綠色可能變淡，肉眼不一定容易分辨。':m==='Fe'?'溶液的藍色變淡，可能帶淺綠色。':'溶液的藍色變淡。',observation:deposit==='Fe'?'鋅表面有灰黑色析出物；淡綠色可能變淡。':'金屬表面有紅棕色析出物；溶液藍色變淡。',interpretation:deposit==='Fe'?'依已知材料與置換模型，灰黑色析出物是鐵。':'依已知材料與置換模型，紅棕色析出物是銅。'};
}
export const freshExtra=()=>({metal:null,solution:null,phase:'fresh',progress:0,recordId:null});
export function freshSession(){return {version:2,cups:FRESH(),extraCups:[freshExtra(),freshExtra()],records:[],connections:{},journeyOpen:false,nextId:1};}
export function appendRecord(state,metal,solution,kind='extra'){
 if(!outcome(metal,solution)||state.records.length>=1000)return null;
 const used=new Set(state.records.map(r=>r.id));let id=state.nextId;if(!Number.isSafeInteger(id)||id<1||id>999999||used.has(`r${id}`))id=1;while(used.has(`r${id}`))id++;
 const record={id:`r${id}`,metal,solution,kind:kind==='base'?'base':'extra'};
 return {record,state:{...state,records:[...state.records,record],nextId:id+1}};
}
export function connectEvidence(state,recordId,pair){
 if(!Object.hasOwn(PAIRS,pair))return {ok:false,reason:'unknown-pair',state};
 const record=state.records.find(r=>r.id===recordId);if(!record)return {ok:false,reason:'select-evidence',state};
 const result=outcome(record.metal,record.solution);
 if(!result.reacts)return {ok:false,reason:'negative-only',record,result,state};
 if(result.pair!==pair)return {ok:false,reason:'different-pair',record,result,state};
 return {ok:true,record,result,state:{...state,connections:{...state.connections,[pair]:record.id}}};
}
export function hasChain(state){return ['ZnFe','FeCu'].every(pair=>{const r=state.records.find(r=>r.id===state.connections[pair]);return r&&outcome(r.metal,r.solution)?.pair===pair;});}
export function migrateV1(raw){
 const cups=restoreV1(raw);if(!cups)return null;
 let state=freshSession();state.cups=cups;
 cups.forEach((c,i)=>{if(c.phase==='done'){const next=appendRecord(state,c.metal,'CuSO4','base');state=next.state;state.cups[i]={...c,recordId:next.record.id};}});
 return state;
}
export function restoreSession(raw){
 try{
 const d=JSON.parse(raw);if(d?.version!==2||!Array.isArray(d.records)||d.records.length>1000||!Array.isArray(d.cups)||d.cups.length!==3||!Array.isArray(d.extraCups)||d.extraCups.length!==2)return null;
 const ids=new Set();const records=[];
 for(const r of d.records){if(!r||typeof r.id!=='string'||!/^r[1-9]\d{0,5}$/.test(r.id)||ids.has(r.id)||!outcome(r.metal,r.solution))return null;ids.add(r.id);records.push({id:r.id,metal:r.metal,solution:r.solution,kind:r.kind==='base'?'base':'extra'});}
 function cleanCup(c,extra){
  if(!c||!['fresh','observing','paused','done'].includes(c.phase))throw Error();
  if(c.phase==='fresh'){if(c.metal!==null||(extra&&c.solution!==null))throw Error();return extra?freshExtra():{metal:null,phase:'fresh',progress:0};}
  const solution=extra?c.solution:'CuSO4';if(!outcome(c.metal,solution))throw Error();
  let recordId=null;if(c.phase==='done'){const r=records.find(r=>r.id===c.recordId);if(!r||r.metal!==c.metal||r.solution!==solution)throw Error();recordId=r.id;}
  return {metal:c.metal,...(extra?{solution}:{}),phase:c.phase==='observing'?'paused':c.phase,progress:c.phase==='done'?1:0,recordId};
 }
 const state={version:2,cups:d.cups.map(c=>cleanCup(c,false)),extraCups:d.extraCups.map(c=>cleanCup(c,true)),records,connections:{},journeyOpen:d.journeyOpen===true,nextId:Math.max(0,...records.map(r=>+r.id.slice(1)))+1};
 if(d.connections&&typeof d.connections==='object')for(const pair of Object.keys(PAIRS)){const id=d.connections[pair];if(typeof id==='string'&&connectEvidence(state,id,pair).ok)state.connections[pair]=id;}
 return state;
 }catch{return null;}
}
