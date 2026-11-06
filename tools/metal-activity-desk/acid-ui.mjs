import {renderHydrogenChain} from './hydrogen-view.mjs';
import {renderElectronScene,ELECTRON_VIEWS} from './electron-view.mjs';
import {METALS} from './model.mjs';
import {outcome} from './inquiry.mjs';
import {ACID_METALS,ACID_CONDITIONS,acidOutcome,observeAcid,replaceAcid,connectAcid,hasAcidMetal,useHydrogenReference,hasHydrogenChain} from './acid.mjs';
export function mountAcid({getState,update,announce,goEvidence}){
 const root=document.querySelector('#acid-chapter'),$=s=>root.querySelector(s),motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';let selected=null,before=new Set(),electronTrack='both';
 const action=(a,v,label,disabled=false,extra='')=>`<button data-acid-action="${a}" data-value="${v}" ${disabled?'disabled':''} ${extra}>${label}</button>`;
 function vessel(m,done,pre){const metal=METALS[m],gas=done&&!pre&&m!=='Cu';return `<svg viewBox="0 0 210 220" role="img" aria-label="${metal.name}與稀鹽酸：${done&&!pre?acidOutcome(m).observation:'乾淨金屬片與無色新鮮稀鹽酸'}"><defs><linearGradient id="acid-glass-${m}"><stop stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#eaf5ed" stop-opacity=".24"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient></defs><ellipse cx="106" cy="199" rx="70" ry="8" fill="#7a674b" opacity=".12"/><path d="M40 48 L46 177 Q46 192 64 194 L149 194 Q168 192 169 176 L175 48 L182 41 L164 45 Q100 31 40 45Z" fill="url(#acid-glass-${m})" stroke="#8faaa4" stroke-width="2"/><path d="M47 103 L51 176 Q51 186 65 188 L148 188 Q164 186 164 176 L168 103Z" fill="#e2eeeb" fill-opacity=".5"/><ellipse cx="107" cy="103" rx="60" ry="8" fill="#e5efeb" opacity=".55"/><rect x="87" y="63" width="27" height="112" rx="3" fill="${metal.color}" stroke="${metal.edge}" stroke-width="1.4" transform="rotate(12 100 119)"/><path d="M57 64 L60 176" stroke="white" stroke-width="4" opacity=".6"/><ellipse cx="107" cy="47" rx="66" ry="9" fill="none" stroke="#91a9a1" stroke-width="1.5"/>${gas?'<g class="acid-bubbles" fill="#fff" stroke="#80a7a6" stroke-width="1.2">'+Array.from({length:7},(_,i)=>`<circle cx="${115+(i%3)*10}" cy="${155-i*11}" r="${3+i%2}" style="--bubble-delay:${i*.15}s"/>`).join('')+'</g>':''}<text x="105" y="216" text-anchor="middle" font-size="12" fill="#5f7267">${gas?'氫氣 H₂（模型解釋）':metal.name+' '+m}</text></svg>`;}
 function render(){
 const state=getState(),l=state.lesson,focus=document.activeElement,fa=focus?.dataset?.acidAction,fv=focus?.dataset?.value;
 document.querySelector('#next-chapter').disabled=!state.records.length;
 root.hidden=!l.open;root.classList.toggle('bubbles-paused',l.pauseAnimation);
 $('#acid-conditions').textContent=ACID_CONDITIONS;
 const all=ACID_METALS.every(m=>hasAcidMetal(l,m)),chain=hasHydrogenChain(state),znfe=state.records.some(r=>r.id===state.connections.ZnFe&&outcome(r.metal,r.solution)?.pair==='ZnFe');
 $('#acid-coach').textContent=chain?'你把前章證據、這次的產氫反應與參考知識接起來了。氫是比較基準，不是第四種金屬。':!all?'各用一片乾淨的鋅、鐵、銅試試新鮮稀鹽酸。注意「是否產氣」；氣泡多少、快慢不能幫你排鋅和鐵。':!znfe?'這三杯都觀察了，但鋅和鐵的先後仍要靠前章的置換證據。先確認「鋅＋硫酸亞鐵」已接到「鋅與鐵」。':!connectAcid(l,l.links.FeH,'FeH').ok?'把「鐵＋稀鹽酸」的紀錄接到「鐵與氫」。鋅也產氫，但兩杯都有氣泡不能排出鋅、鐵的先後。':'銅沒冒泡是一項對照，不能獨自證明氫與銅的先後。讀下方清楚標示的參考知識，再決定把它接入比較。';
 $('#acid-cups').innerHTML=ACID_METALS.map(m=>{const id=l.cups[m],done=!!id,o=acidOutcome(m),pre=before.has(m);return `<article class="acid-station" aria-label="${METALS[m].name}與稀鹽酸"><div class="cup-heading"><h3>${METALS[m].name} <small>${m}</small></h3><span class="cup-state ${done?'done':''}">${done?'已留存':'乾淨新片'}</span></div><div class="acid-vessel">${vessel(m,done,pre)}</div><p class="acid-observation">${done&&!pre?'看到：'+o.observation:'新鮮稀鹽酸 HCl · 無色'}</p>${done?`<p class="acid-interpretation">${pre?'這是反應前示意；已完成的紀錄仍保留。':'模型解釋：'+o.interpretation}</p><div class="acid-controls">${action('before',m,pre?'回到觀察之後':'比較剛放入時',false,`aria-pressed="${pre}"`)}${action('select',id,'選這杯當證據')}${action('fresh',m,'換乾淨新片，保留紀錄')}</div>`:`<p class="acid-interpretation">不沿用前章做過、表面已有析出物的金屬片。</p>${action('observe',m,'把'+METALS[m].name+'放入稀鹽酸',l.records.length>=1000,'class="primary"')}`}</article>`;}).join('');
 $('#acid-animation').innerHTML=action('pause','',l.pauseAnimation?'繼續氣泡示意':'暫停氣泡示意',false,`aria-pressed="${l.pauseAnimation}"`);
 $('#acid-record-count').textContent=`本段 ${l.records.length} 杯已留存`;
 $('#acid-records').innerHTML=l.records.length?l.records.map((r,i)=>`<article class="acid-record"><span>稀鹽酸紀錄 ${i+1}</span><h4>${METALS[r.metal].name}＋稀鹽酸</h4><p>${acidOutcome(r.metal).observation}</p>${action('select',r.id,selected===r.id?'已選這杯紀錄':'選這杯當證據',false,`aria-pressed="${selected===r.id}"`)}</article>`).join(''):'<p>完成後，這段的每一杯也會留下來。</p>';
 const chosen=l.records.find(r=>r.id===selected);$('#acid-selected').textContent=chosen?`已選：${METALS[chosen.metal].name}＋稀鹽酸。把它接到能支持的關係。`:'先選一杯已完成的稀鹽酸紀錄。';
 $('#acid-links').innerHTML=['ZnH','FeH'].map(p=>{const linked=connectAcid(l,l.links[p],p).ok;return `<section class="acid-pair"><h4>${p==='ZnH'?'鋅與氫':'鐵與氫'}</h4><span class="source-tag">本章實驗＋反應模型</span><p>${linked?`<strong>${p==='ZnH'?'Zn':'Fe'} ＞ H</strong>`:'尚未接上證據'}</p>${action('connect',p,linked?'換用所選紀錄':'把所選紀錄接到'+(p==='ZnH'?'鋅與氫':'鐵與氫'),!chosen)}${linked?action('unlink',p,'移除'+(p==='ZnH'?'鋅氫':'鐵氫')+'連線'):''}</section>`;}).join('');
 $('#prior-link').innerHTML=`<span class="source-tag">前章實驗證據</span><h4>鋅與鐵</h4><p>${znfe?'<strong>Zn ＞ Fe</strong> 已由前章連線支持':'還沒接上前章的鋅鐵證據'}</p>${action('prior','','查看前章證據 ↑')}`;
 $('#hydrogen-reference').innerHTML=`<span class="source-tag reference-tag">本課提供的參考知識</span><h4>氫與銅</h4><p>在本課的金屬活性序列中，氫排在銅之前：H ＞ Cu。這項關係不是只靠「銅沒冒泡」推得。</p>${action('reference','',l.links.HCu==='reference'?'已接入參考知識':'採用參考知識：H ＞ Cu',!hasAcidMetal(l,'Cu')||l.links.HCu==='reference')}${!hasAcidMetal(l,'Cu')?'<p class="tiny-note">先完成銅的稀鹽酸觀察，再讀這張資料。</p>':''}${l.links.HCu==='reference'?action('unlink','HCu','移除參考知識連線'):''}`;
 $('#hydrogen-chain').hidden=!chain;$('#hydrogen-chain').innerHTML=chain?renderHydrogenChain():'';
 const chosenOrigin=state.records.find(r=>r.id===state.review?.answers.origin.recordId&&r.metal==='Zn'&&r.solution==='CuSO4');
 const zincRecord=chosenOrigin||state.records.find(r=>r.metal==='Zn'&&r.solution==='CuSO4');
 $('#electron-open').disabled=!zincRecord;$('#electron-source').textContent=zincRecord?`回看前章紀錄 ${state.records.indexOf(zincRecord)+1}：鋅＋硫酸銅。把紅棕色析出物與電子轉移接起來。`:'先在前章完成一次鋅＋硫酸銅，才有自己的觀察可以對照。';
 $('#electron-work').hidden=!l.electronOpen||!zincRecord;
 $('#electron-tabs').innerHTML=ELECTRON_VIEWS.map((v,i)=>action('electron-step',String(i),`<span>0${i+1}</span>${v.tab}`,false,`aria-pressed="${l.electronStep===i}"`)).join('');
 $('#electron-scene').innerHTML=renderElectronScene(l.electronStep,electronTrack);
 if(fa)root.querySelector(`[data-acid-action="${fa}"][data-value="${fv}"]`)?.focus({preventScroll:true});
 }
 function commit(lesson){update({...getState(),lesson});}
 root.addEventListener('click',e=>{const b=e.target.closest('[data-acid-action]');if(!b)return;const {acidAction:a,value:v}=b.dataset,s=getState(),l=s.lesson;
 if(a==='observe'){const n=observeAcid(l,v);if(n){before.delete(v);commit(n);announce(`${METALS[v].name}與稀鹽酸已留存。${acidOutcome(v).observation}`);$(`[data-acid-action="before"][data-value="${v}"]`)?.focus({preventScroll:true});}return;}
 if(a==='fresh'){before.delete(v);commit(replaceAcid(l,v));$(`[data-acid-action="observe"][data-value="${v}"]`)?.focus({preventScroll:true});announce('已換乾淨新片與新鮮稀鹽酸，原紀錄與連線保留。');return;}
 if(a==='before'){before.has(v)?before.delete(v):before.add(v);render();return;}
 if(a==='pause'){commit({...l,pauseAnimation:!l.pauseAnimation});return;}
 if(a==='select'){selected=v;render();$('#acid-feedback').textContent='';$('#acid-board').scrollIntoView({behavior:motion,block:'start'});$('#acid-board').focus({preventScroll:true});return;}
 if(a==='connect'){const r=connectAcid(l,selected,v);if(r.ok){commit(r.lesson);$('#acid-feedback').textContent='接上了。依本課反應模型，產生氫氣支持這種金屬排在氫之前。';}else $('#acid-feedback').textContent=r.reason==='negative-only'?'這杯未見氣泡，保留作對照；不能單憑沒有變化排先後。氫與銅的關係要讀旁邊標示的參考知識。':'這杯不能支持所選的關係。鋅的產氫紀錄比較鋅與氫，鐵的產氫紀錄比較鐵與氫。';announce($('#acid-feedback').textContent);return;}
 if(a==='reference'){const n=useHydrogenReference(l);if(n){commit(n);$('#acid-feedback').textContent='已接入 H ＞ Cu。這條來自參考知識，和實驗觀察的來源不同。';}return;}
 if(a==='unlink'){const links={...l.links};delete links[v];commit({...l,links});$('#acid-feedback').textContent='已移除連線；紀錄仍保留。';$('#acid-board').focus({preventScroll:true});return;}
 if(a==='prior'){goEvidence();return;}
 if(a==='electron-track'){electronTrack=electronTrack===v?'both':v;render();announce(electronTrack==='both'?'同時查看鋅與銅。':ELECTRON_VIEWS[l.electronStep][electronTrack]);return;}
 if(a==='electron-step'){commit({...l,electronStep:+v});announce(ELECTRON_VIEWS[+v].title);}
 });
 document.querySelector('#next-chapter').addEventListener('click',()=>{commit({...getState().lesson,open:true});root.scrollIntoView({behavior:motion});root.focus({preventScroll:true});});
 $('#electron-open').addEventListener('click',()=>{commit({...getState().lesson,electronOpen:true});$('#electron-work').scrollIntoView({behavior:motion,block:'start'});$('#electron-work').focus({preventScroll:true});});
 return {render,resetView(){selected=null;before.clear();electronTrack='both';}};
}
