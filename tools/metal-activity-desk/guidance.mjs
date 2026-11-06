import {hasChain,outcome,freshExtra} from './inquiry.mjs';

// Completion and next steps come from evidence, never from the latest cup alone.
export function evidenceGuide(state){
 const linked=pair=>state.records.some(r=>r.id===state.connections[pair]&&outcome(r.metal,r.solution)?.pair===pair);
 const available=pair=>state.records.some(r=>outcome(r.metal,r.solution)?.pair===pair);
 if(hasChain(state))return {stage:'complete',title:'證據已接成關係，繼續核對',text:'鋅與鐵、鐵與銅的證據都已接上，三種金屬的關係已完成。再做新杯只是補充或核對，不會讓原本的連線消失。'};
 if(linked('ZnFe'))return {stage:'need-iron-copper',title:'鋅與鐵已接上，再看鐵與銅',text:available('FeCu')?'鋅與鐵的比較已接上。請從紀錄選「鐵＋硫酸銅」，接到「鐵與銅」，把兩條直接證據連起來。':'鋅與鐵的比較已接上；鐵與銅還缺證據。可用乾淨鐵片＋新鮮硫酸銅補做，再把紀錄接到「鐵與銅」。'};
 if(available('ZnFe'))return {stage:'connect-zinc-iron',title:'鋅與鐵的紀錄已有，接上證據',text:'你已做過「鋅＋硫酸亞鐵」，但尚未接到「鋅與鐵」。選那杯的「拿這杯當證據 ↓」，或在紀錄按「選這張證據」，再接到「鋅與鐵」。紀錄保留著，不必重做。'};
 return {stage:'find-zinc-iron',title:'鋅和鐵，還缺直接比較的證據',text:'「鋅＋硫酸銅」和「鐵＋硫酸銅」各自比較的是金屬與銅，不能比較鋅與鐵。要補這條線，可選乾淨鋅片＋新鮮硫酸亞鐵 FeSO₄；也可以自由做其他組合作對照。'};
}

export function newExtraTrial(state,index){
 if(!Number.isInteger(index)||index<0||index>=state.extraCups.length||state.extraCups[index].phase!=='done')return null;
 return {state:{...state,extraCups:state.extraCups.map((cup,i)=>i===index?freshExtra():cup)},metal:null,solution:null};
}
