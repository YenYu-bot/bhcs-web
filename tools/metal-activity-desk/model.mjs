export const METALS = Object.freeze({
  Zn: { name:'鋅', color:'#9ba6aa', edge:'#617077', result:'金屬表面出現紅棕色銅，溶液的藍色變淡。', evidence:'有銅析出・藍色變淡', conclusion:'鋅的活性比銅大', relation:'Zn > Cu', equation:'Zn + Cu²⁺ → Zn²⁺ + Cu' },
  Fe: { name:'鐵', color:'#718384', edge:'#455b60', result:'金屬表面出現紅棕色銅，溶液的藍色變淡，可能帶淺綠色。', evidence:'有銅析出・藍色變淡', conclusion:'鐵的活性比銅大', relation:'Fe > Cu', equation:'Fe + Cu²⁺ → Fe²⁺ + Cu' },
  Cu: { name:'銅', color:'#c97e4d', edge:'#8c512e', result:'未見新的銅析出；金屬外觀與溶液藍色沒有明顯變化。', evidence:'未見新析出・無明顯變化', conclusion:'銅與硫酸銅沒有淨置換反應', relation:'無淨置換', equation:'Cu + Cu²⁺：無淨置換反應' }
});
export const FRESH = () => Array.from({length:3},()=>({metal:null,phase:'fresh',progress:0}));
export function place(cups,index,metal) {
 if (!Number.isInteger(index)||index<0||index>2||typeof metal!=='string'||!Object.hasOwn(METALS,metal)||cups[index].phase!=='fresh') return cups;
 return cups.map((c,i)=>i===index?{metal,phase:'observing',progress:0}:{...c});
}
export function finish(cups,index) {
 if(!cups[index]||!['observing','paused'].includes(cups[index].phase)) return cups;
 return cups.map((c,i)=>i===index?{...c,phase:'done',progress:1}:{...c});
}
export function restore(raw) {
 try {
  const data=JSON.parse(raw);
  if(data?.version!==1||!Array.isArray(data.cups)||data.cups.length!==3) return null;
  if(!data.cups.every(c=>c&&['fresh','observing','paused','done'].includes(c.phase)&&((c.phase==='fresh'&&c.metal===null)||(c.phase!=='fresh'&&typeof c.metal==='string'&&Object.hasOwn(METALS,c.metal))))) return null;
  return data.cups.map(c=>({metal:c.metal,phase:c.phase==='observing'?'paused':c.phase,progress:c.phase==='done'?1:0}));
 } catch { return null; }
}
export function conclusions(cups) {
 const seen = new Set(cups.filter(c=>c.phase==='done').map(c=>c.metal));
 return [...seen].filter(m=>METALS[m]).map(m=>({metal:m,...METALS[m]}));
}
