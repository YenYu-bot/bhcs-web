import {OPTIONS,updateReview,assessReview} from './review.mjs';
import {METALS} from './model.mjs';
import {SOLUTIONS,outcome} from './inquiry.mjs';
import {acidOutcome} from './acid.mjs';
const TITLES={origin:'銅的來歷',acids:'兩杯都冒泡',source:'對照與參考知識'};
const HEADINGS={origin:'紅棕色的銅，原本在哪裡？',acids:'兩杯都有氣泡，就能排鋅和鐵嗎？',source:'銅沒冒泡，這筆紀錄能說到哪裡？'};
const INTRO={origin:'選一筆你做過的鋅＋硫酸銅紀錄，把看到的固體與電子轉移接起來。',acids:'把你做過的兩杯稀鹽酸紀錄並排，再找一筆真正比較鋅與鐵的證據。',source:'用銅的對照紀錄，分清楚「沒有看見變化」和「已經證明先後」。'};
const STATUS={missing:'待補紀錄或選擇',ready:'尚未確認',revise:'再看一次證據',verified:'解釋已確認'};
export function mountReview({getState,update,announce,navigate,inspect}){
 const root=document.querySelector('#review-chapter');let active='origin';
 const option=(v,t,selected)=>`<option value="${v}" ${selected===v?'selected':''}>${t}</option>`;
 const saltName=r=>`${METALS[r.metal].name}＋${SOLUTIONS[r.solution].name}`;
 const selector=(section,field,label,records,value,acid=false)=>`<label class="review-select-label" for="review-${section}-${field}">${label}</label><select id="review-${section}-${field}" data-review-section="${section}" data-review-field="${field}"><option value="">請選一筆自己的紀錄</option>${records.map(r=>option(r.id,`${acid?'稀鹽酸':'實驗'}紀錄 ${(acid?getState().lesson.records:getState().records).findIndex(x=>x.id===r.id)+1} · ${acid?METALS[r.metal].name+'＋稀鹽酸':saltName(r)}`,value)).join('')}</select>`;
 function citation(id,acid=false){const state=getState(),records=acid?state.lesson.records:state.records,r=records.find(x=>x.id===id);if(!r)return '';const o=acid?acidOutcome(r.metal):outcome(r.metal,r.solution);return `<aside class="review-citation"><span>我選的${acid?'稀鹽酸':'實驗'}紀錄 ${records.indexOf(r)+1}</span><strong>${acid?METALS[r.metal].name+'＋稀鹽酸':saltName(r)}</strong><p>看到：${o.observation}</p>${acid?'<small>氣體身分仍要依材料與反應模型判斷。</small>':`<button type="button" id="review-inspect-${active}-${r.id}" class="review-link" data-review-action="inspect" data-value="${r.id}">近看這筆紀錄</button>`}</aside>`;}
 function choices(section,field,legend,value){return `<fieldset class="review-choices"><legend>${legend}</legend>${OPTIONS[section][field].map(o=>`<label class="review-choice ${value===o.value?'is-selected':''}" for="review-${section}-${field}-${o.value}"><input type="radio" id="review-${section}-${field}-${o.value}" name="review-${section}-${field}" value="${o.value}" data-review-section="${section}" data-review-field="${field}" ${value===o.value?'checked':''}><span>${o.label}</span></label>`).join('')}</fieldset>`;}
 const nav=(target,label)=>`<button type="button" class="review-link" data-review-action="navigate" data-value="${target}">${label}</button>`;
 function body(section,a){const state=getState();if(section==='origin'){
 const available=state.records.filter(r=>r.metal==='Zn'&&r.solution==='CuSO4');
 return `${selector(section,'recordId','1 選我的鋅＋硫酸銅紀錄',available,a.recordId)}${!available.length?'<p class="review-missing">還沒有這組觀察。先做一杯，再用自己的紀錄解釋。</p>'+nav('base','回原三杯，做鋅＋硫酸銅 ↑'):''}${citation(a.recordId)}<p class="review-question-note">觀察能告訴你表面出現了什麼；以下用已知材料與本課電子轉移模型來解釋。</p>${choices(section,'donor','2 誰提供電子？',a.donor)}${choices(section,'acceptor','3 誰得到電子？',a.acceptor)}${choices(section,'deposit','4 紅棕色析出物是什麼？',a.deposit)}${nav('electrons','回看電子轉移示意 ↑')}`;
 }if(section==='acids'){
 const zn=state.lesson.records.filter(r=>r.metal==='Zn'),fe=state.lesson.records.filter(r=>r.metal==='Fe');
 return `<div class="review-source-pair"><div>${selector(section,'zincId','1 選鋅的稀鹽酸紀錄',zn,a.zincId,true)}${citation(a.zincId,true)}</div><div>${selector(section,'ironId','2 選鐵的稀鹽酸紀錄',fe,a.ironId,true)}${citation(a.ironId,true)}</div></div>${!zn.length||!fe.length?'<p class="review-missing">先讓兩種金屬都留下自己的稀鹽酸觀察。</p>'+nav('acid','回稀鹽酸實驗桌 ↑'):''}${choices(section,'answer','3 只用這兩筆產氣紀錄，能怎麼比較？',a.answer)}${selector(section,'evidenceId','4 若要排鋅與鐵，哪筆紀錄能補足？',state.records,a.evidenceId)}${citation(a.evidenceId)}<p class="review-question-note">可以選任何已留存的鹽溶液紀錄，再檢查它是否真的比較鋅與鐵。沒有適合的證據時，可以回去補做。</p>${nav('inquiry','回自選實驗，補一筆證據 ↑')}`;
 }
 const cu=state.lesson.records.filter(r=>r.metal==='Cu');return `${selector(section,'copperId','1 選銅的稀鹽酸紀錄',cu,a.copperId,true)}${citation(a.copperId,true)}${!cu.length?'<p class="review-missing">先留下銅的稀鹽酸對照紀錄。</p>'+nav('acid','回稀鹽酸實驗桌 ↑'):''}${choices(section,'answer','2 H ＞ Cu 這條關係，依據是什麼？',a.answer)}<div class="review-reference-state"><span class="source-tag reference-tag">參考知識的使用狀態</span><p>${state.lesson.links.HCu==='reference'?'你已在證據桌明確採用 H ＞ Cu 的參考資料。':'尚未在證據桌採用參考資料。先閱讀它，再決定是否接入。'}</p>${nav('reference','回看氫與銅的參考資料 ↑')}</div>`;
 }
 function render(){const state=getState(),review=state.review,assessment=assessReview(state),focused=root.contains(document.activeElement)?document.activeElement.id:null;
 root.hidden=!review.open;
 document.querySelector('#review-progress').textContent=`${assessment.verifiedCount} / 3 項解釋已確認`;
 document.querySelector('#review-tabs').innerHTML=Object.keys(TITLES).map((s,i)=>`<button type="button" id="review-tab-${s}" data-review-action="tab" data-value="${s}" aria-pressed="${active===s}"><span class="review-tab-number">${i+1}</span><b>${TITLES[s]}</b><small>${STATUS[assessment[s].status]}</small></button>`).join('');
 const result=assessment[active];document.querySelector('#review-panel').innerHTML=`<div class="review-panel-heading"><span class="notebook-label">用證據說明 · ${Object.keys(TITLES).indexOf(active)+1}</span><h3>${HEADINGS[active]}</h3><p>${INTRO[active]}</p></div>${body(active,review.answers[active])}<div class="review-check-row"><button type="button" id="review-check-${active}" class="primary" data-review-action="check" data-value="${active}" ${result.canCheck?'':'disabled'}>檢查這項解釋</button><span>選擇可以修改；換紀錄或改答案後，需要重新確認。</span></div><div id="review-feedback" class="review-feedback ${result.status}" role="status"><strong>${STATUS[result.status]}</strong><p>${result.feedback}</p></div>`;
 const completed=document.querySelector('#review-complete');completed.hidden=!assessment.complete;completed.innerHTML=assessment.complete?'<strong>三項解釋都已用你的紀錄確認</strong><p>你分開說清楚了：看到的現象、依模型作的解釋，以及需要另外引用的參考知識。紀錄仍留著，可以回去補做或重新檢查。</p>':'';
 if(focused)document.getElementById(focused)?.focus({preventScroll:true});
 }
 function commit(next){update({...getState(),review:next});}
 root.addEventListener('change',e=>{const t=e.target,{reviewSection:s,reviewField:f}=t.dataset;if(!s||!f)return;commit(updateReview(getState().review,s,f,t.value||null));});
 root.addEventListener('click',e=>{const b=e.target.closest('[data-review-action]');if(!b)return;const {reviewAction:a,value:v}=b.dataset;if(a==='tab'){active=v;render();return;}if(a==='check'){commit(updateReview(getState().review,v,'checked',true));announce(assessReview(getState())[v].feedback);return;}if(a==='inspect'){inspect(v);return;}if(a==='navigate')navigate(v);});
 document.querySelector('#review-open').addEventListener('click',()=>{commit({...getState().review,open:true});root.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});root.focus({preventScroll:true});});
 return {render,resetView(){active='origin';}};
}
