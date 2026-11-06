import {outcome} from './inquiry.mjs';
export const ACID_METALS=['Zn','Fe','Cu'];
export const ACID_CONDITIONS='室溫、乾淨金屬、新鮮稀鹽酸（非氧化性酸）；忽略溶氧與雜質等副反應。';
export function acidOutcome(m){
 if(!ACID_METALS.includes(m))return null;
 const reacts=m!=='Cu';
 return {reacts,gas:reacts?'H2':null,pair:reacts?m+'H':null,observation:reacts?'金屬表面出現氣泡。':'未見明顯氣泡。',interpretation:reacts?'依已知材料與本課反應模型，產生的氣體是氫氣 H₂；只看氣泡本身不能鑑定氣體。':'本課簡化條件下不產生氫氣；不能把「沒看見氣泡」單獨當作排序的證明。',equation:reacts?`${m} + 2H⁺ → ${m}²⁺ + H₂`:'本課條件下，不以 H⁺ 置換出 H₂。'};
}
export const freshAcid=()=>({version:1,open:false,cups:{Zn:null,Fe:null,Cu:null},records:[],links:{},nextId:1,pauseAnimation:false,electronOpen:false,electronStep:0});
export function observeAcid(lesson,metal){
 if(!ACID_METALS.includes(metal)||lesson.cups[metal]!==null||lesson.records.length>=1000)return null;
 const used=new Set(lesson.records.map(r=>r.id));let n=lesson.nextId;if(!Number.isSafeInteger(n)||n<1||n>999999||used.has('a'+n))n=1;while(used.has('a'+n))n++;
 const record={id:'a'+n,metal};return {...lesson,records:[...lesson.records,record],cups:{...lesson.cups,[metal]:record.id},nextId:n+1};
}
export function replaceAcid(lesson,metal){return ACID_METALS.includes(metal)?{...lesson,cups:{...lesson.cups,[metal]:null}}:null;}
export function connectAcid(lesson,id,pair){
 const r=lesson.records.find(r=>r.id===id);if(!r)return {ok:false,reason:'missing'};
 const o=acidOutcome(r.metal);if(!o.reacts)return {ok:false,reason:'negative-only'};
 if(o.pair!==pair)return {ok:false,reason:'different-pair'};
 return {ok:true,lesson:{...lesson,links:{...lesson.links,[pair]:id}}};
}
export const hasAcidMetal=(lesson,m)=>lesson.records.some(r=>r.metal===m);
export function useHydrogenReference(lesson){if(!hasAcidMetal(lesson,'Cu'))return null;return {...lesson,links:{...lesson.links,HCu:'reference'}};}
export function hasHydrogenChain(state){
 const l=state.lesson,r=state.records.find(r=>r.id===state.connections.ZnFe);
 return !!(r&&outcome(r.metal,r.solution)?.pair==='ZnFe'&&l&&ACID_METALS.every(m=>hasAcidMetal(l,m))&&connectAcid(l,l.links.FeH,'FeH').ok&&l.links.HCu==='reference');
}
export function restoreAcid(d){
 if(!d||d.version!==1||!Array.isArray(d.records)||d.records.length>1000||!d.cups||typeof d.cups!=='object')return null;
 const l=freshAcid(),ids=new Set();
 for(const r of d.records){if(!r||typeof r.id!=='string'||!/^a[1-9]\d{0,5}$/.test(r.id)||ids.has(r.id)||!ACID_METALS.includes(r.metal))return null;ids.add(r.id);l.records.push({id:r.id,metal:r.metal});}
 for(const m of ACID_METALS){const id=d.cups[m];if(id!==null&&!l.records.some(r=>r.id===id&&r.metal===m))return null;l.cups[m]=id;}
 for(const p of ['ZnH','FeH'])if(connectAcid(l,d.links?.[p],p).ok)l.links[p]=d.links[p];
 if(d.links?.HCu==='reference'&&hasAcidMetal(l,'Cu'))l.links.HCu='reference';
 l.open=d.open===true;l.pauseAnimation=d.pauseAnimation===true;l.electronOpen=d.electronOpen===true;l.electronStep=Number.isInteger(d.electronStep)&&d.electronStep>=0&&d.electronStep<=2?d.electronStep:0;
 l.nextId=Math.max(0,...l.records.map(r=>+r.id.slice(1)))+1;return l;
}
export const ELECTRON_STEPS=[
 {title:'放大鋅與硫酸銅的接觸表面',zinc:'Zn',copper:'Cu²⁺',text:'紅棕色銅從哪裡來？從溶液中的 Cu²⁺ 得到電子，成為金屬 Cu。點下一步看成對的電子轉移。',oxidation:'Zn → Zn²⁺ + 2e⁻',reduction:'Cu²⁺ + 2e⁻ → Cu'},
 {title:'同一次反應，一失一得',zinc:'Zn → Zn²⁺',copper:'Cu²⁺ → Cu',text:'鋅失去 2 個電子（氧化），Cu²⁺ 同時得到 2 個電子（還原）。半反應拆開寫，是為了記帳；不是電子先在溶液中存起來。',oxidation:'Zn → Zn²⁺ + 2e⁻',reduction:'Cu²⁺ + 2e⁻ → Cu'},
 {title:'把電子消去，回到整體反應',zinc:'Zn²⁺ 進入溶液',copper:'Cu 成為析出物',text:'Zn + Cu²⁺ → Zn²⁺ + Cu。2e⁻ 在兩個半反應相消；硫酸根 SO₄²⁻ 是旁觀離子。這解釋鋅消耗、銅析出，以及 Cu²⁺ 減少時藍色變淡。',oxidation:'失去：2e⁻',reduction:'得到：2e⁻'}
];
