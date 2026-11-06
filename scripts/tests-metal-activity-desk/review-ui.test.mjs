import test from 'node:test';
import assert from 'node:assert/strict';
import {mountReview} from '../../tools/metal-activity-desk/review-ui.mjs';
import {freshSession} from '../../tools/metal-activity-desk/session.mjs';
import {appendRecord} from '../../tools/metal-activity-desk/inquiry.mjs';
import {observeAcid,useHydrogenReference} from '../../tools/metal-activity-desk/acid.mjs';

function fixture(){
 let state=freshSession();
 for(const [m,s] of [['Zn','CuSO4'],['Zn','FeSO4'],['Fe','ZnSO4']])state=appendRecord(state,m,s,'extra').state;
 for(const m of ['Zn','Fe','Cu'])state.lesson=observeAcid(state.lesson,m);
 state.lesson=useHydrogenReference(state.lesson);
 return state;
}
function harness(initial=freshSession()){
 const saved={document:globalThis.document,matchMedia:globalThis.matchMedia};
 const elements=new Map();let state=initial,view,announcements=[],navigations=[],inspections=[];
 const el=id=>{if(!elements.has(id))elements.set(id,{id,hidden:false,innerHTML:'',textContent:'',handlers:{},addEventListener(t,fn){this.handlers[t]=fn;},contains(e){return !!e&&e.id?.startsWith('review-');},focus(){globalThis.document.activeElement=this;},scrollIntoView(){}});return elements.get(id);};
 globalThis.document={activeElement:null,querySelector:selector=>el(selector.slice(1)),getElementById:el};
 globalThis.matchMedia=()=>({matches:true});
 view=mountReview({getState:()=>state,update:s=>{state=s;view.render();},announce:t=>announcements.push(t),navigate:t=>navigations.push(t),inspect:t=>inspections.push(t)});view.render();
 return {el,view,get state(){return state;},announcements,navigations,inspections,
 change(s,f,v){el('review-chapter').handlers.change({target:{dataset:{reviewSection:s,reviewField:f},value:v}});},
 action(a,v){el('review-chapter').handlers.click({target:{closest:()=>({dataset:{reviewAction:a,value:v}})}});},
 open(){el('review-open').handlers.click();},
 cleanup(){for(const [k,v] of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
 };
}
function origin(h,id='r1') {h.change('origin','recordId',id);h.change('origin','donor','Zn');h.change('origin','acceptor','Cu2');h.change('origin','deposit','Cu');}

test('review UI opens blank without fabricating records or answers and routes missing work',()=>{
 const h=harness();try{
 assert.equal(h.el('review-chapter').hidden,true);h.open();assert.equal(h.state.review.open,true);
 assert.match(h.el('review-panel').innerHTML,/還沒有這組觀察/);assert.match(h.el('review-panel').innerHTML,/id="review-check-origin"[^>]+disabled/);
 assert.equal(h.state.records.length,0);assert.equal(h.state.review.answers.origin.recordId,null);
 h.action('navigate','base');assert.deepEqual(h.navigations,['base']);
 h.action('tab','acids');assert.match(h.el('review-panel').innerHTML,/先讓兩種金屬/);
 assert.match(h.el('review-panel').innerHTML,/id="review-check-acids"[^>]+disabled/);
 h.action('tab','source');assert.match(h.el('review-panel').innerHTML,/先留下銅/);
 }finally{h.cleanup();}
});
test('review UI requires an explicit check, clears it on source change and uses actual selected observation',()=>{
 let state=fixture();state=appendRecord(state,'Zn','CuSO4','extra').state;
 const h=harness(state);try{
 h.open();origin(h,'r4');assert.equal(h.el('review-progress').textContent,'0 / 3 項解釋已確認');
 assert.match(h.el('review-panel').innerHTML,/我選的實驗紀錄 4/);
 h.action('check','origin');assert.equal(h.el('review-progress').textContent,'1 / 3 項解釋已確認');
 assert.match(h.announcements.at(-1),/不是鋅變成銅/);
 h.change('origin','recordId','r1');assert.equal(h.state.review.answers.origin.checked,false);assert.equal(h.el('review-progress').textContent,'0 / 3 項解釋已確認');
 h.action('inspect','r1');assert.deepEqual(h.inspections,['r1']);
 h.action('check','origin');assert.equal(h.el('review-complete').hidden,true);
 }finally{h.cleanup();}
});
test('review UI surfaces wrong evidence and only shows closing summary for three checked explanations',()=>{
 const h=harness(fixture());try{
 origin(h);h.action('check','origin');h.action('tab','acids');
 for(const [f,v] of Object.entries({zincId:'a1',ironId:'a2',answer:'need-direct',evidenceId:'r3'}))h.change('acids',f,v);
 h.action('check','acids');assert.match(h.el('review-panel').innerHTML,/單靠未見變化不能證明/);
 h.change('acids','evidenceId','r2');h.action('check','acids');
 h.action('tab','source');h.change('source','copperId','a3');h.change('source','answer','reference');
 assert.equal(h.el('review-complete').hidden,true);h.action('check','source');
 assert.equal(h.el('review-progress').textContent,'3 / 3 項解釋已確認');assert.equal(h.el('review-complete').hidden,false);
 delete h.state.lesson.links.HCu;h.view.render();assert.equal(h.el('review-complete').hidden,true);assert.equal(h.el('review-progress').textContent,'2 / 3 項解釋已確認');
 assert.match(h.el('review-panel').innerHTML,/參考資料尚未採用/);
 }finally{h.cleanup();}
});
test('review UI retains focus across re-render and resets only transient active question',()=>{
 const h=harness(fixture());try{
 h.open();globalThis.document.activeElement=h.el('review-origin-donor-Zn');origin(h);assert.equal(globalThis.document.activeElement.id,'review-origin-donor-Zn');
 h.action('tab','source');h.change('source','copperId','a3');h.view.resetView();h.view.render();
 assert.match(h.el('review-panel').innerHTML,/紅棕色的銅，原本在哪裡/);assert.equal(h.state.review.answers.source.copperId,'a3');
 }finally{h.cleanup();}
});
