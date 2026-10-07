// I5 gate (pure part): teaching script, evidence card and concept content (assets/optics-guided/script.js). No DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {reduce,createInitialState,deriveView} from '../assets/optics-guided/engine.js';
import {MESSAGES,reduceCoach,screenFor,stepFor,ctaFor,evidenceList,compareCard,conceptModel,formatCm,searchProgress} from '../assets/optics-guided/script.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const mS=position=>({type:'MOVE_SCREEN',position}),mC=position=>({type:'MOVE_CANDLE',position}),settle={type:'SETTLE_SCREEN'};
// Drives the engine and the coach the way main.js does; returns every coach message in order.
function play(actions,{from}={}){
 let state=from?.state??createInitialState(),coach=from?.coach??null,ui=from?.ui??{naming:false};const log=[];
 if(!coach)coach=reduceCoach(null,{state,view:deriveView(state),ui});
 for(const a of actions.flat()){
  let result={events:[],transitions:[]};
  if(a.type==='UI_NAMING')ui={naming:true};else{result=reduce(state,a);state=result.state;if(result.transitions.length)ui={naming:false}}
  const next=reduceCoach(coach,{state,view:deriveView(state),events:result.events,transitions:result.transitions,ui});
  if(next!==coach)log.push(next.id);coach=next;
 }
 return {state,coach,ui,log};
}
const to=(...a)=>play(a);
const start=()=>play([{type:'START'},{type:'BEGIN'}]);
const trial1=obs=>play([mS(obs)],{from:start()});

test('every spec line is present verbatim (Spec §33–§47)',()=>{
 const lines=['為什麼投影機的屏幕放錯位置，畫面就會模糊？','桌上有一支蠟燭、一片凸透鏡和一面屏幕。現在屏幕上的影像很模糊。','把屏幕移到影像最清楚的位置。','試試看哪個位置比較清楚。','快找到了。',
  '就是這裡。影像現在最清楚。','第一筆證據有了。接下來只改一個地方。','把蠟燭移到離透鏡 15 cm 的位置。','好，這次只有物距改變。','蠟燭的位置改了，原本的屏幕位置也不再清楚。再找一次。',
  '剛才影像變得更模糊了。','試試另一個方向。','看看屏幕上的影像是變清楚，還是變模糊。','如果越移越模糊，可以試試另一個方向。','這筆結果已經記好了。','接下來看看只改變蠟燭位置後會發生什麼。',
  '你剛才已經找到一個規律了。','在還能形成實像的情況下，物體往焦點靠近時，清楚影像的位置會往更遠處移，而且影像會變大。','如果再把蠟燭往透鏡靠近，會一直有清楚的屏幕位置嗎？','把蠟燭移到 5 cm。',
  '這次也試著找找看。','目前還沒有找到清楚的位置。','你已經檢查過近、中、遠的位置了。','這次可能真的沒有能接到清楚影像的位置。','不是你找得不夠仔細。這一次，屏幕本來就接不到清楚實像。','但是如果不用屏幕，而是直接透過透鏡看呢？',
  '你現在看得到一個正立、放大的蠟燭。','可是剛才屏幕怎麼都接不到它。這和前兩次有什麼不同？','這種只能透過透鏡看到、卻不能直接接在屏幕上的像，叫做「虛像」。','剛才哪個結果變得更明顯？'];
 const all=Object.values(MESSAGES).flatMap(m=>[m.main,m.sub]).filter(Boolean).join('\n');
 for(const l of lines)assert.ok(all.includes(l),'missing: '+l);
 assert.ok(MESSAGES.compareDone.sub.startsWith('在還能形成實像的情況下'),'the qualifier is never dropped');
 assert.equal(MESSAGES.hint3Left.main,'清楚的位置就在你目前位置的左邊。');assert.equal(MESSAGES.hint3Right.main,'清楚的位置就在你目前位置的右邊。');
});

test('tone rules (Spec §8.4): no judging words, no leaked answer numbers',()=>{
 const texts=[...Object.values(MESSAGES).flatMap(m=>[m.main,m.sub]).filter(Boolean),searchProgress(['near','far']).main];
 for(const t of texts){for(const bad of ['錯了','錯誤','答錯','不對','正確答案是','答案是','wrong'])assert.ok(!t.includes(bad),`"${bad}" in: ${t}`);}
 const hints=[MESSAGES.hint1,MESSAGES.hint2,MESSAGES.hint3Left,MESSAGES.hint3Right].map(m=>m.main).join('');
 assert.ok(!/\d/.test(hints),'hints never give a distance');
 assert.equal(MESSAGES.compareRetry.main,'剛才哪個結果變得更明顯？');
 assert.ok(!/理論像距|1\/f|公式/.test(texts.join('')),'no formula talk in the coach lines before the concept stage');
});

test('welcome and mission screens come first; nothing about the formula',()=>{
 const s0=createInitialState();assert.equal(screenFor(s0),'welcome');assert.deepEqual(ctaFor(s0,deriveView(s0)),{label:'開始實驗',action:'START',enabled:true});
 const m=to({type:'START'});assert.equal(m.state.phase,'mission');assert.equal(screenFor(m.state),'bench');assert.equal(m.coach.id,'mission');
 assert.deepEqual(ctaFor(m.state,deriveView(m.state)),{label:'動手試試看',action:'BEGIN',enabled:true});
 assert.equal(stepFor('welcome'),'mission');assert.equal(stepFor('mission'),'mission');assert.equal(stepFor('trial1-find-screen'),'bench');assert.equal(stepFor('concept'),'bench');assert.equal(stepFor('notebook'),'notebook');assert.equal(stepFor('challenge-2'),'challenge');
 assert.equal(start().coach.id,'find1');
});

test('Trial 1 script: first move, almost there, found, hints, wrong direction',()=>{
 let r=start();
 r=play([mS(19)],{from:r});assert.equal(r.coach.id,'findStart');
 r=play([mS(18)],{from:r});assert.equal(r.coach.id,'findStart','still far: no new message');
 r=play([mS(16.5)],{from:r});assert.equal(r.coach.id,'near');assert.equal(r.coach.main,'快找到了。');
 const n=r.log.length;r=play([mS(16)],{from:r});assert.equal(r.log.length,0,'staying "near" does not rewrite the message');
 r=play([mS(18)],{from:r});assert.equal(r.coach.id,'findStart','leaving the near band returns to the neutral prompt');
 r=play([mS(15)],{from:r});assert.equal(r.coach.id,'complete1');assert.equal(r.coach.main,'就是這裡。影像現在最清楚。');
 void n;
 // wrong direction and hint ladder
 let w=play([mS(21),mS(22),mS(23)],{from:start()});assert.ok(w.log.includes('wrongDirection'));
 let h=start();const ids=[];for(let i=0;i<31;i++){h=play([mS(i%2?20:21)],{from:h});ids.push(...h.log)}
 assert.ok(ids.includes('hint1')&&ids.includes('hint2')&&ids.includes('hint3Left'),ids.join());
 assert.ok(ids.indexOf('hint1')<ids.indexOf('hint2')&&ids.indexOf('hint2')<ids.indexOf('hint3Left'));
 let r2=play([{type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'},mC(15)]);
 const t2=[];let hh=r2;for(let i=0;i<31;i++){hh=play([mS(i%2?15:14)],{from:hh});t2.push(...hh.log)}
 assert.ok(t2.includes('hint3Right'),'Trial 2 target is to the right of the old position');
});

test('Trial 1 → 2 script: record-written leads with the evidence line, then only-one-change',()=>{
 const rec=play([{type:'RECORD'}],{from:trial1(15)});
 assert.equal(rec.state.phase,'trial2-move-object');assert.equal(rec.coach.id,'moveCandle');
 assert.equal(rec.coach.main,'第一筆證據有了。接下來只改一個地方。');assert.equal(rec.coach.sub,'把蠟燭移到離透鏡 15 cm 的位置。');
 const find=play([mC(15)],{from:rec});assert.equal(find.coach.id,'find2');assert.equal(find.coach.main,'好，這次只有物距改變。');
 assert.ok(find.coach.sub.includes('原本清楚的影像現在模糊了')&&find.coach.sub.includes('再找一次'));
 const done=play([mS(30)],{from:find});assert.equal(done.coach.id,'complete2');assert.equal(done.coach.main,'影像又清楚了。');
 // already-recorded notice when the old result is rebuilt
 const back=play([mC(25),mC(30)],{from:rec});assert.ok(back.log.includes('alreadyRecorded'));
 const ar=back.coach;assert.ok(ar.main==='這筆結果已經記好了。');
});

test('compare: card built from the learner\'s own records; wrong answers get a question, not a verdict',()=>{
 for(const [o1,o2] of [[14.5,29.5],[15,30],[15.5,30.5]]){
  const st=play([{type:'START'},{type:'BEGIN'},mS(o1),{type:'RECORD'},mC(15),mS(o2),{type:'RECORD'}]);
  assert.equal(st.state.phase,'compare');assert.equal(st.coach.id,'compare');
  const card=compareCard(st.state.records),row=k=>card.rows.find(r=>r.key===k);
  assert.deepEqual([row('observedScreenPosition').first,row('observedScreenPosition').second],[`${formatCm(o1)} cm`,`${formatCm(o2)} cm`],'shows what was recorded, not 15/30');
  assert.deepEqual([row('f').first,row('u').first,row('u').second,row('imageSize').first,row('imageSize').second],['10 cm','30 cm','15 cm','較小','較大']);
  assert.equal(card.notice.text,'✅ 兩次只有物距不同，可以直接比較。');assert.equal(card.directComparable,true);
  assert.ok(!JSON.stringify(card).includes('theoretical'),'no theoreticalV in the card');
  let r=play([{type:'ANSWER_COMPARE',question:'position',answer:'closer'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'}],{from:st});
  assert.equal(r.coach.id,'compareRetry');assert.equal(r.coach.main,'剛才哪個結果變得更明顯？');assert.equal(ctaFor(r.state,deriveView(r.state)).enabled,false);
  r=play([{type:'ANSWER_COMPARE',question:'position',answer:'farther'}],{from:r});
  assert.equal(r.coach.id,'compareDone');assert.equal(r.coach.main,'你剛才已經找到一個規律了。');assert.equal(ctaFor(r.state,deriveView(r.state)).enabled,true);
  assert.equal(play([{type:'CONTINUE'}],{from:r}).coach.id,'moveCandle3');
 }
 assert.equal(compareCard({1:null,2:null,3:null}),null);
 const rec=(f,u,obs)=>({f,u,observedScreenPosition:obs,imageSize:'larger',absoluteMagnification:2});
 const multi=compareCard({1:rec(10,30,15),2:rec(12,15,60),3:null});assert.equal(multi.notice.kind,'warn');assert.equal(multi.notice.text,'⚠ 這兩次同時改變了兩個條件，還不能知道是哪個因素造成結果。');assert.equal(multi.directComparable,false);
 const onlyF=compareCard({1:rec(10,30,15),2:rec(12,30,15),3:null});assert.equal(onlyF.notice.text,'✅ 兩次只有焦距不同，可以直接比較。');
});

test('Trial 3 script: move → search → three zones → reveal → view through → naming',()=>{
 const base=play([{type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'},mC(15),mS(30),{type:'RECORD'},{type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'}]);
 assert.equal(base.coach.id,'moveCandle3');assert.equal(base.coach.main,'如果再把蠟燭往透鏡靠近，會一直有清楚的屏幕位置嗎？');assert.equal(base.coach.sub,'把蠟燭移到 5 cm。');
 let r=play([mC(10),mC(5)],{from:base});assert.equal(r.coach.id,'search');
 r=play([mS(25),settle],{from:r});assert.ok(r.log.includes('findStart')===false);
 r=play([mS(10),settle],{from:r});assert.equal(r.coach.id,'searchTwo');assert.equal(r.coach.main,'目前還沒有找到清楚的位置。');
 r=play([mS(35),settle],{from:r});assert.equal(r.coach.id,'searchDone');assert.equal(r.coach.sub,'這次可能真的沒有能接到清楚影像的位置。');
 assert.deepEqual(ctaFor(r.state,deriveView(r.state)),{label:'我找不到清楚實像',action:'CONFIRM_NO_REAL_IMAGE',enabled:true});
 r=play([{type:'CONFIRM_NO_REAL_IMAGE'}],{from:r});assert.equal(r.coach.id,'noReal');assert.ok(r.coach.main.startsWith('不是你找得不夠仔細'));assert.equal(ctaFor(r.state,deriveView(r.state)).label,'從透鏡後面看');
 r=play([{type:'VIEW_THROUGH_LENS'}],{from:r});assert.equal(r.coach.id,'viewThrough');assert.equal(ctaFor(r.state,deriveView(r.state),r.ui).label,'我觀察到了');
 assert.ok(!r.coach.main.includes('虛像')&&!r.coach.sub.includes('虛像'),'the word is withheld until the learner has observed');
 r=play([{type:'UI_NAMING'}],{from:r});assert.equal(r.coach.id,'naming');assert.ok(r.coach.main.includes('叫做「虛像」'));assert.equal(ctaFor(r.state,deriveView(r.state),r.ui).label,'看看這兩種像');
 r=play([{type:'CONTINUE'}],{from:r});assert.equal(r.state.phase,'concept');assert.equal(r.coach.id,'concept');assert.equal(screenFor(r.state),'concept');
 // hint ladder in Trial 3 uses search progress, never a direction, and names the zones not yet checked
 let h=play([mC(10),mC(5)],{from:base});const seen=[];for(let i=0;i<40;i++){h=play([mS(i%2?31:40)],{from:h});seen.push(h.coach)}
 assert.ok(seen.some(c=>c.id==='searchProgress'&&c.main.includes('近處')&&c.main.includes('中間')));assert.ok(!seen.some(c=>/左邊|右邊/.test(c.main)));
});

test('records list and concept model use the learner\'s numbers; the formula result appears only here',()=>{
 const flow=play([{type:'START'},{type:'BEGIN'},mS(14.5),{type:'RECORD'},mC(15),mS(29.5),{type:'RECORD'},{type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'},mC(5),...[mS(8),settle,mS(20),settle,mS(35),settle],{type:'CONFIRM_NO_REAL_IMAGE'}]);
 const list=evidenceList(flow.state.records);
 assert.deepEqual(list.map(x=>x.text),['第一次紀錄完成 ✓','第二次紀錄完成 ✓','第三次紀錄完成 ✓']);
 assert.ok(list[0].detail.includes('14.5 cm')&&list[1].detail.includes('29.5 cm')&&list[2].detail.includes('找不到'));
 assert.ok(!JSON.stringify(list).includes('theoretical'));
 const c=conceptModel(flow.state.records);
 assert.deepEqual(c.cards.map(x=>x.id),['real','virtual']);
 assert.deepEqual(c.cards[0].body,['光線真的在某個位置會合。','可以投在屏幕上。']);assert.deepEqual(c.cards[1].body,['光線沒有真的在看起來的影像位置會合。','眼睛能看到，但屏幕接不到。']);
 assert.ok(c.cards[0].evidence.includes('14.5')&&c.cards[0].evidence.includes('29.5'));
 assert.equal(c.formula.heading,'剛才找到的位置，其實可以用這個關係算出來。');assert.equal(c.formula.expression,'1/f = 1/u + 1/v');
 assert.deepEqual(c.formula.lines.map(l=>l.text),['第一次：f = 10 cm，u = 30 cm → v = 15 cm','第二次：f = 10 cm，u = 15 cm → v = 30 cm','第三次：f = 10 cm，u = 5 cm → v = −10 cm']);
 assert.equal(c.formula.lines[0].found,'你找到 14.5 cm');assert.equal(c.formula.lines[1].found,'你找到 29.5 cm');
 assert.equal(conceptModel({1:null,2:null,3:null}),null);
 assert.equal(formatCm(15),'15');assert.equal(formatCm(14.5),'14.5');assert.equal(formatCm(14.25),'14.3');
});

test('CTA table covers every guided moment and never offers a dead button',()=>{
 const flow=[];let st=createInitialState(),ui={naming:false};const seen=new Map();
 const acts=[{type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'},mC(15),mS(30),{type:'RECORD'},{type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'},mC(5),mS(8),settle,mS(20),settle,mS(35),settle,{type:'CONFIRM_NO_REAL_IMAGE'},{type:'VIEW_THROUGH_LENS'},{type:'CONTINUE'},{type:'CONTINUE'}];
 for(const a of acts){const r=reduce(st,a);st=r.state;const c=ctaFor(st,deriveView(st));seen.set(st.phase,c);void flow}
 for(const phase of ['trial2-move-object','trial3-move-object'])assert.equal(seen.get(phase),null,phase+' has no button: the next move is with the equipment');
 assert.equal(seen.get('trial1-complete').label,'記錄第一次結果');assert.equal(seen.get('trial2-complete').label,'記錄第二次結果');
 assert.equal(seen.get('notebook'),null);void ui;
});

test('script.js builds content from records and events only',()=>{
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/optics-guided/script.js',import.meta.url)),'utf8').replace(/\/\/.*$/gm,'');
 assert.ok(!/from '\.\/model\.js'/.test(src),'no model import: values come from records');
 assert.ok(!/\bu\s*-\s*f\b|\bf\s*\*\s*u\b|1\s*\/\s*f\s*[-+=]|-\s*v\s*\/\s*u/.test(src.replace(/1\/f = 1\/u \+ 1\/v/g,'')),'no formulas computed here');
 assert.ok(!/document|window/.test(src),'no DOM');
});

console.log(`PASS optics guided script: ${tests} tests`);
