export const SCHEMA=1, MODEL='lever-horizontal-v1', G=10;
export const IDS=Object.freeze(['w1','w2','w3','w4','w5','w6']);
export const clone=x=>JSON.parse(JSON.stringify(x));
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const initialLayout=()=>({w1:-20,w2:-20,w3:40,w4:null,w5:null,w6:null});
export function validateLayout(l){
 if(!l||typeof l!=='object'||Array.isArray(l)||Object.keys(l).length!==6||!IDS.every(id=>Object.hasOwn(l,id)))throw Error('砝碼識別碼不完整或重複');
 const counts={};for(const x of Object.values(l)){if(x===null)continue;if(!Number.isInteger(x)||x< -50||x>50||x%5)throw Error('掛點須為 −50～50 cm，每格 5 cm');counts[x]=(counts[x]||0)+1;if(counts[x]>4)throw Error('同一掛架最多 4 片；原位置不變');}return true;
}
export function calculate(l){validateLayout(l);let left=0,right=0;for(const x of Object.values(l)){if(x<0)left+=5*-x;if(x>0)right+=5*x;}return {left,right,net:left-right};}
export const direction=t=>t.net>0?'左側初始向下':t.net<0?'右側初始向下':'合力矩為零，從靜止放開沒有開始轉動';
export function racks(l){validateLayout(l);const out=[];for(const x of [...new Set(Object.values(l).filter(x=>x!==null))].sort((a,b)=>a-b)){const ids=IDS.filter(id=>l[id]===x);out.push({x,ids,force:5*ids.length,massKg:0.5*ids.length,torqueNcm:5*ids.length*Math.abs(x)});}return out;}
export const signature=l=>{validateLayout(l);return IDS.map(id=>`${id}:${l[id]}`).join('|');};
export const arrangement=l=>racks(l).map(r=>`${r.x}:${r.ids.length}`).join('|');
export function qualifies(l){const a=arrangement(l);return a==='-20:2|40:1'?'A':a==='-20:2|20:1'?'B':a==='-20:2|20:2'?'C':a==='-15:2|30:1'?'challenge':null;}
export const place=x=>x===null?'砝碼盤':x===0?'支點 0 cm':`${x<0?'左側':'右側'} ${Math.abs(x)} cm`;
export const fmt=n=>(n/100).toFixed(2);
export function evidence(l){return {layout:clone(l),signature:signature(l),arrangement:arrangement(l),weights:IDS.filter(id=>l[id]!==null).map(id=>({id,forceN:5,massKg:0.5,massG:500,xCm:l[id]})),tray:IDS.filter(id=>l[id]===null),racks:racks(l),torque:calculate(l),units:{force:'N',mass:'kg',distance:'cm',torque:'N·m',integerTorque:'N·cm'},direction:direction(calculate(l))};}
export function validateRecord(r){if(!r||r.schemaVersion!==SCHEMA||r.modelVersion!==MODEL||r.g!==G||typeof r.recordId!=='string'||typeof r.experimentId!=='string'||!Number.isInteger(r.revision)||r.revision<0||!Number.isInteger(r.sequence)||r.sequence<1||typeof r.createdAt!=='string'||!Number.isFinite(Date.parse(r.createdAt))||r.horizontalLocked!==true||r.angle!==0||r.angularVelocity!==0)throw Error('證據版本或來源缺失');const e=evidence(r.layout);for(const k of Object.keys(e))if(JSON.stringify(e[k])!==JSON.stringify(r[k]))throw Error('證據內容與原始佈置不一致');if(r.qualification!==qualifies(r.layout))throw Error('證據分類不一致');return true;}
