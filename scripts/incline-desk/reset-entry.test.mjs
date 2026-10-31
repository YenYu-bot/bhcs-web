import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../../tools/incline-desk/app.mjs',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../../tools/incline-desk/index.html',import.meta.url),'utf8');
const resetSource=app.slice(app.indexOf('function closeReset()'),app.indexOf("window.addEventListener('beforeunload'"));
function harness(result={status:'saved',pending:false,snapshot:{records:[]}}){
 const nodes=new Map(),calls=[],saved={records:[{original:true}],answers:{original:true}};
 const get=id=>{if(!nodes.has(id))nodes.set(id,{id,checked:false,hidden:false,disabled:false,textContent:'',listeners:{},focus(opts){calls.push(['focus',id,opts]);},scrollIntoView(opts){calls.push(['scroll',id,opts]);},showModal(){this.open=true;},close(){this.open=false;},addEventListener(type,fn){this.listeners[type]=fn;}});return nodes.get(id);};
 const cancel=[get('cancel-one'),get('cancel-two')],oldEngine={snapshot:()=>saved};
 const ctx=vm.createContext({$:get,busyClear:false,resetStage:1,resetOperation:null,resetOpener:null,engine:oldEngine,recordSignature:'old',pairSignature:'old',revisionSignature:'old',lastChecked:true,explainDirty:true,reasonText:{},document:{querySelectorAll:()=>cancel},cancelGesture:()=>calls.push(['cancelGesture']),createEngine:()=>({snapshot:()=>({records:[]})}),uid:()=> 'reset-operation',render:()=>calls.push(['render']),announce:()=>calls.push(['announce']),storageUI:()=>calls.push(['storageUI']),exportCurrent:()=>calls.push(['export']),download:()=>calls.push(['raw-export']),driver:{getState:()=>({protected:false}),invalidatePending:()=>calls.push(['invalidate']),clear:async(...args)=>{calls.push(['clear',...args]);if(result instanceof Error)throw result;return result;}}});
 vm.runInContext(resetSource,ctx);return {get,calls,ctx,cancel,saved,oldEngine,open:id=>get(id).onclick({currentTarget:get(id)})};
}
test('top reset is outside collapsed management; completion action clearly describes clearing',()=>{
 const intro=html.slice(html.indexOf('<section class="intro">'),html.indexOf('<section class="teacher-card"'));
 assert.match(intro,/<button id="new-experiment"[^>]*aria-describedby="reset-entry-note"[^>]*>重置實驗<\/button>/);
 assert.match(intro,/id="reset-entry-note"[^>]*>確認重置將清除本站紀錄/);
 const completion=html.slice(html.indexOf('<section id="completion"'),html.indexOf('<section class="record-management"'));
 assert.match(completion,/id="completion-reset"[^>]*aria-describedby="completion-reset-note"/);
 assert.match(completion,/確認前不會清除/);
 assert.equal((html.match(/id="new-experiment"/g)||[]).length,1);
 assert(!html.slice(html.indexOf('<section class="record-management"')).includes('id="new-experiment"'));
});
test('both launchers and both cancel stages preserve engine/data and restore actual launcher focus',()=>{
 for(const id of ['new-experiment','completion-reset'])for(const stage of [1,2]){
  const h=harness();h.open(id);if(stage===2)h.get('reset-continue').onclick();h.cancel[stage-1].onclick();
  assert.equal(h.get('reset-dialog').open,false);assert.equal(h.ctx.engine,h.oldEngine);assert.equal(h.ctx.engine.snapshot(),h.saved);
  assert.equal(h.calls.filter(x=>x[0]==='clear').length,0);assert.deepEqual(h.calls.at(-1).slice(0,2),['focus',id]);
 }
});
test('Escape uses same protected close path; busy clear cannot close or open another dialog',()=>{
 const h=harness();h.open('completion-reset');let prevented=0;h.get('reset-dialog').listeners.cancel({preventDefault(){prevented++;}});assert.equal(prevented,1);assert.equal(h.get('reset-dialog').open,false);assert.deepEqual(h.calls.at(-1).slice(0,2),['focus','completion-reset']);
 h.open('new-experiment');h.ctx.busyClear=true;h.get('reset-dialog').listeners.cancel({preventDefault(){prevented++;}});assert.equal(h.get('reset-dialog').open,true);h.open('completion-reset');assert.equal(h.ctx.resetOpener,h.get('new-experiment'));
});
test('no write before stage two plus acknowledgement; export is not clear; reopening resets acknowledgement',async()=>{
 const h=harness();h.open('new-experiment');await h.get('reset-confirm').onclick();h.get('reset-export').onclick();h.get('reset-continue').onclick();await h.get('reset-confirm').onclick();assert.equal(h.calls.filter(x=>x[0]==='clear').length,0);assert(h.calls.some(x=>x[0]==='export'));
 h.get('reset-ack').checked=true;h.get('reset-ack').onchange();assert.equal(h.get('reset-confirm').disabled,false);h.cancel[1].onclick();h.open('completion-reset');assert.equal(h.get('reset-ack').checked,false);assert.equal(h.get('reset-confirm').disabled,true);assert.equal(h.ctx.resetStage,1);
});
test('only successful explicit final clear swaps engine and reveals/focuses fresh start after render',async()=>{
 const h=harness();h.open('completion-reset');h.get('reset-continue').onclick();h.get('reset-ack').checked=true;await h.get('reset-confirm').onclick();
 const clear=h.calls.find(x=>x[0]==='clear');assert(clear);assert.equal(clear[2].confirmed,true);assert.equal(clear[2].acknowledged,true);assert.equal(h.ctx.engine.snapshot().records.length,0);assert.notEqual(h.ctx.engine,h.oldEngine);assert.equal(h.get('reset-dialog').open,false);
 const kinds=h.calls.map(x=>x[0]);assert(kinds.indexOf('clear')<kinds.indexOf('render'));assert(kinds.indexOf('render')<kinds.indexOf('scroll'));assert.deepEqual(h.calls.find(x=>x[0]==='scroll').slice(0,2),['scroll','begin']);assert.deepEqual(h.calls.filter(x=>x[0]==='focus').at(-1).slice(0,2),['focus','begin']);
});
test('failed, pending or thrown clear retains original data/dialog and never navigates to fresh start',async()=>{
 for(const result of [{status:'failed',reason:'conflict'},{status:'saved',pending:true,snapshot:{records:[]}},new Error('storage failed')]){
  const h=harness(result);h.open('new-experiment');h.get('reset-continue').onclick();h.get('reset-ack').checked=true;await h.get('reset-confirm').onclick();assert.equal(h.ctx.engine,h.oldEngine);assert.equal(h.ctx.engine.snapshot(),h.saved);assert.equal(h.get('reset-dialog').open,true);assert(!h.calls.some(x=>['scroll','render'].includes(x[0])));assert.match(h.get('reset-error').textContent,/尚未清除/);
 }
});
