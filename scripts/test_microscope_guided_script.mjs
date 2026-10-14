// B3 gate: teaching script and view-models for the guided microscope lab. Pure functions, no DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as M from '../assets/microscope-guided/model.js';
import {reduce,createInitialState,deriveView} from '../assets/microscope-guided/engine.js';
import * as S from '../assets/microscope-guided/script.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const run=(state,...actions)=>actions.flat().reduce((s,a)=>reduce(s,a).state,state);
const set=(x,y)=>({type:'SET_STAGE',x,y}),REC={type:'RECORD'},CONT={type:'CONTINUE'};
const ans=(compare,question,answer)=>({type:'ANSWER_COMPARE',compare,question,answer});
const welcome=()=>createInitialState();
const mission=()=>run(welcome(),{type:'START'});
const h0=()=>run(mission(),{type:'BEGIN'});
const h1=(x=75)=>run(h0(),set(x,0));
const v0=(x=75)=>run(h1(x),REC);
const v1=(y=75,x=75)=>run(v0(x),set(0,y));
const c1=(x=75,y=75)=>run(v1(y,x),REC);
const low0=()=>run(c1(),ans('direction','relation','opposite'),CONT);
const low1=()=>run(low0(),set(0,0));
const hi0=()=>run(low1(),REC);
const hi40=()=>run(hi0(),{type:'SET_OBJECTIVE',objective:40});
const lost=()=>run(hi0(),set(60,0),{type:'SET_OBJECTIVE',objective:40});
const c2=()=>run(hi40(),REC);
const concept=(base=c2)=>run(base(),ans('magnification','field','smaller'),ans('magnification','count','fewer'),CONT);
const ctx=(state)=>({state,view:deriveView(state)});
const coachOf=(state,prev=null)=>S.reduceCoach(prev,ctx(state));

const FORBIDDEN=['相反','顛倒','倒立','視野縮小','倍率越高','高倍視野較小'];
const strings=(x,skip=()=>false,out=[])=>{
 if(typeof x==='string')out.push(x);
 else if(Array.isArray(x))x.forEach(v=>strings(v,skip,out));
 else if(x&&typeof x==='object')for(const [k,v] of Object.entries(x)){if(skip(k))continue;strings(v,skip,out)}
 return out;
};
const textOf=(state,coach=coachOf(state))=>{
 const view=deriveView(state),parts=[coach.main,coach.sub,coach.tip,S.stationTitleFor(state),S.welcomeModel(state),S.ctaFor(state)?.label,
  S.statusModel(state,view,coach),S.dataModel(state,view),S.evidenceModel(state),S.eyepieceLabel(state,view),S.stageLabel(state)];
 return strings(parts);
};

test('Welcome and Mission carry the question and the task without naming the pattern',()=>{
 const w=S.welcomeModel(welcome()),m=S.welcomeModel(mission());
 assert.equal(w.title,'為什麼我明明把玻片往右推，視野裡的東西卻跑到別的方向？');
 assert.equal(m.title,'先別猜答案。把玻片上的目標移回中央，看看它真的怎麼動。');
 assert.deepEqual(S.screenFor(welcome()).id,'welcome');assert.equal(S.screenFor(mission()).id,'welcome');
 assert.deepEqual([S.ctaFor(welcome()).label,S.ctaFor(welcome()).action],['開始',{type:'START'}]);
 assert.deepEqual([S.ctaFor(mission()).label,S.ctaFor(mission()).action],['開始實驗',{type:'BEGIN'}]);
});
test('Trial 1 coach asks for the centre and never says which way to push',()=>{
 const c=coachOf(h0());assert.equal(c.main,'把 e 移到視野中央。');assert.equal(c.key,'trial1-horizontal');
 assert.ok(!/應該|往右|往左|向右|向左/.test(c.main+c.sub));
 assert.equal(coachOf(v0()).key,'trial1-vertical');
});
test('Trial 1 coach hints: first a question, then the learner\'s own last move, never the pattern',()=>{
 let coach=coachOf(h0());assert.equal(coach.tip,null);
 let s=run(h0(),set(-50,0));coach=S.reduceCoach(coach,ctx(s));assert.equal(coach.tip,'剛才移動玻片後，e 往哪裡跑了？');
 s=run(s,set(-100,0));coach=S.reduceCoach(coach,ctx(s));
 assert.match(coach.tip,/你剛才把玻片往左移，e 現在在視野右側/);assert.ok(!FORBIDDEN.some(w=>coach.tip.includes(w)));assert.ok(!/應該/.test(coach.tip));
 s=run(s,set(60,0));coach=S.reduceCoach(coach,ctx(s));assert.equal(coach.tip,null,'the nudge goes away when the e is closer again');
});
test('Trial 1 status states only what can be seen',()=>{
 const st=(state,coach)=>S.statusModel(state,deriveView(state),coach);
 assert.equal(st(h0(),coachOf(h0())).text,'e 在視野右側');
 let coach=coachOf(h0()),s=run(h0(),set(20,0));coach=S.reduceCoach(coach,ctx(s));
 assert.match(st(s,coach).text,/^e 更靠近中央了/);
 s=run(s,set(-10,0));coach=S.reduceCoach(coach,ctx(s));assert.match(st(s,coach).text,/^e 離中央更遠了/);
 s=run(h0(),set(-150,0));assert.equal(st(s,coachOf(s)).text,'e 離開視野了');
 assert.equal(st(h1(),coachOf(h1())).text,'e 已在視野中央');assert.equal(st(h1(),coachOf(h1())).kind,'success');
 assert.equal(st(v0(),coachOf(v0())).text,'e 在視野上方');
 assert.equal(S.statusModel(welcome(),deriveView(welcome())),null);assert.equal(S.statusModel(c1(),deriveView(c1())),null);
});
test('Trial 1 evidence shows the learner\'s own movement as facts',()=>{
 const m=S.evidenceModel(c1());assert.deepEqual(m.items.map(i=>i.id),['horizontal','vertical']);
 assert.deepEqual(m.items[0].rows,[{label:'玻片位移',value:'向右 1.0 mm'},{label:'視野中的 e',value:'向左 120 px'}]);
 assert.deepEqual(m.items[1].rows,[{label:'玻片位移',value:'向上 1.0 mm'},{label:'視野中的 e',value:'向下 120 px'}]);
 assert.equal(S.evidenceModel(h1()),null,'nothing is evidence before RECORD');
 const other=S.evidenceModel(c1(60,60));assert.equal(other.items[0].rows[0].value,'向右 0.8 mm');assert.equal(other.items[0].rows[1].value,'向左 96 px');
 assert.ok(strings(m).every(t=>!/規律|因此|所以|總是/.test(t)),'evidence carries no conclusion');
});
test('Trial 1 DataCard shows conditions in mm taken from the stage',()=>{
 const m=S.dataModel(h1(),deriveView(h1()));
 assert.deepEqual(m.conditions.map(c=>[c.label,c.value]),[['物鏡','4×'],['玻片位置（左右）','向右 1.0 mm'],['玻片位置（上下）','向上 0.0 mm']]);
 assert.equal(S.dataModel(c1(),deriveView(c1())),null);
});
test('Compare 1 model: one changed variable, two controls, two observed rows, one question',()=>{
 const m=S.compareModel(c1());
 assert.deepEqual(m.independentVariable,{label:'移動方向',from:'水平',to:'垂直'});
 assert.deepEqual(m.controlledVariables.map(c=>c.value),['都是 4×','都是字母 e']);
 assert.deepEqual(m.observedResponse.map(r=>[r.label,r.first,r.second]),[['玻片位移','向右 1.0 mm','向上 1.0 mm'],['視野中的 e','向左 120 px','向下 120 px']]);
 assert.equal(m.questions.length,1);assert.equal(m.questions[0].id,'relation');
 assert.equal(m.questions[0].text,'兩次紀錄中，玻片和視野中的影像移動方向有什麼共同關係？');
 assert.equal(S.compareModel(h1()),null);assert.deepEqual(S.compareHeadsFor(c1()),S.TEXT.compareHeads1);
});
test('Compare 1 options are {value,label} and the model carries no answer key',()=>{
 const q=S.compareModel(c1()).questions[0];
 assert.deepEqual(q.options,[{value:'opposite',label:'往相反方向移動'},{value:'same',label:'往相同方向移動'},{value:'unrelated',label:'看不出固定關係'}]);
 assert.ok(!/correctAnswer|answerKey|expected/i.test(JSON.stringify(S.compareModel(c1()))));
 assert.equal(q.feedback,undefined);assert.equal(q.disabled,false);assert.equal(q.selectedValue,null);
});
test('Compare 1 feedback nudges toward the table and confirms a right answer without an answer key',()=>{
 const wrong=run(c1(),ans('direction','relation','same')),q=S.compareModel(wrong).questions[0];
 assert.equal(q.feedback.kind,'hint');assert.match(q.feedback.text,/再對照一次表格/);assert.equal(q.disabled,false);
 assert.ok(!q.feedback.text.includes('相反'),'a wrong answer never reveals the right one');
 const right=run(c1(),ans('direction','relation','opposite')),r=S.compareModel(right).questions[0];
 assert.equal(r.feedback.kind,'success');assert.equal(r.disabled,true);
 assert.equal(S.ctaFor(c1()).enabled,false);assert.equal(S.ctaFor(right).enabled,true);assert.deepEqual(S.ctaFor(right).action,{type:'CONTINUE'});assert.equal(S.ctaFor(right).label,'繼續倍率實驗');
 assert.equal(coachOf(right).key,'compare-direction-done');
});
test('Trial 2 low: coach, status, evidence-free data, record button',()=>{
 const s=low0(),c=coachOf(s);assert.equal(c.key,'trial2-low');assert.match(c.main,/把 B 移到視野正中央/);
 const st=S.statusModel(s,deriveView(s),c);assert.match(st.text,/^B 還沒在視野中央，目前看得到/);
 assert.equal(S.statusModel(low1(),deriveView(low1()),coachOf(low1())).text,'B 在視野中央，目前看得到 A、B、C');
 assert.equal(S.ctaFor(s).enabled,false);assert.equal(S.ctaFor(low1()).enabled,true);assert.equal(S.ctaFor(low1()).label,'記錄低倍結果');
 const d=S.dataModel(low1(),deriveView(low1()));assert.deepEqual(d.conditions.map(x=>[x.label,x.value]),[['物鏡','4×'],['視野直徑','4.5 mm'],['玻片位置（左右）','向右 0.0 mm'],['玻片位置（上下）','向上 0.0 mm']]);
});
test('Trial 2 high: 40× shows B only; a lost B gets a calm prompt; the record button follows completion',()=>{
 assert.equal(coachOf(hi0()).key,'trial2-high');
 const s=hi40(),c=coachOf(s);assert.equal(c.key,'trial2-high-complete');assert.equal(c.main,'剛才還看得到的 A、C 呢？');
 assert.equal(S.statusModel(s,deriveView(s),c).text,'目前看得到 B；A、C 已不在視野中');
 assert.equal(S.ctaFor(s).label,'記錄高倍結果');assert.equal(S.ctaFor(s).enabled,true);
 const l=lost(),lc=coachOf(l);assert.equal(lc.key,'trial2-high-lost');assert.equal(S.ctaFor(l).enabled,false);
 assert.ok(!/縮小|變小|因為/.test(lc.main+lc.sub));
 assert.equal(S.dataModel(s,deriveView(s)).conditions[0].state,'changed');
});
test('Trial 2 evidence records objective, field and visible marks',()=>{
 const m=S.evidenceModel(c2());assert.deepEqual(m.items.map(i=>i.id),['horizontal','vertical','low','high']);
 assert.deepEqual(m.items[2].rows,[{label:'物鏡',value:'4×'},{label:'視野直徑',value:'4.5 mm'},{label:'看得到的記號',value:'3 個：A、B、C'}]);
 assert.deepEqual(m.items[3].rows,[{label:'物鏡',value:'40×'},{label:'視野直徑',value:'0.45 mm'},{label:'看得到的記號',value:'1 個：B'}]);
 assert.ok(strings(m).every(t=>!/規律|因此|越高|越小/.test(t)));
});
test('Compare 2 model: objective changed, slide and position kept, three observed rows, two questions',()=>{
 const m=S.compareModel(c2());
 assert.deepEqual(m.independentVariable,{label:'物鏡倍率',from:'4×',to:'40×'});
 assert.deepEqual(m.controlledVariables.map(c=>c.label),['玻片','位置']);
 assert.deepEqual(m.observedResponse.map(r=>[r.label,r.first,r.second]),[
  ['視野直徑','4.5 mm','0.45 mm'],['看得到的記號','3 個（A、B、C）','1 個（B）'],['B 的大小','1 倍（相對 4×）','10 倍（相對 4×）']]);
 assert.deepEqual(m.questions.map(q=>q.id),['field','count']);
 assert.deepEqual(m.questions[0].options.map(o=>o.value),['smaller','same','larger']);assert.deepEqual(m.questions[1].options.map(o=>o.value),['fewer','same','more']);
 assert.deepEqual(S.compareHeadsFor(c2()),S.TEXT.compareHeads2);
 const part=run(c2(),ans('magnification','field','smaller')),q=S.compareModel(part).questions;
 assert.equal(q[0].feedback.kind,'success');assert.equal(q[1].feedback,undefined);assert.equal(S.ctaFor(part).enabled,false);
 const wrong=S.compareModel(run(c2(),ans('magnification','count','more'))).questions[1];assert.equal(wrong.feedback.kind,'hint');
});
test('Compare 2 finishing enables the way to the concept',()=>{
 const done=run(c2(),ans('magnification','field','smaller'),ans('magnification','count','fewer'));
 assert.equal(S.ctaFor(done).enabled,true);assert.equal(S.ctaFor(done).label,'看看這代表什麼');assert.equal(coachOf(done).key,'compare-magnification-done');
});
test('Concept: two cards, each next to the learner\'s own evidence',()=>{
 const m=S.conceptModel(concept());assert.deepEqual(m.cards.map(c=>c.id),['direction','field']);
 assert.equal(m.cards[0].title,'影像方向');
 assert.equal(m.cards[0].body[0],'複式顯微鏡形成的影像上下、左右都顛倒，相當於旋轉 180°。因此玻片往一個方向移時，視野中的影像會往相反方向移。');
 assert.deepEqual(m.cards[0].evidence,[{label:'橫向',text:'玻片向右 1.0 mm，視野中的 e 向左 120 px'},{label:'縱向',text:'玻片向上 1.0 mm，視野中的 e 向下 120 px'}]);
 assert.equal(m.cards[1].title,'倍率與視野');assert.equal(m.cards[1].body[0],'物鏡倍率提高時，影像看起來更大，但一次能看到的範圍會變小。');
 assert.deepEqual(m.cards[1].evidence,[{label:'4×',text:'看到 3 個記號，視野直徑 4.5 mm'},{label:'40×',text:'看到 1 個記號，視野直徑 0.45 mm'}]);
});
test('Concept evidence quotes the learner\'s own numbers, not fixed sentences',()=>{
 const other=concept(()=>run(c1(60,60),ans('direction','relation','opposite'),CONT,set(0,0),REC,{type:'SET_OBJECTIVE',objective:40},REC));
 const m=S.conceptModel(other);assert.equal(m.cards[0].evidence[0].text,'玻片向右 0.8 mm，視野中的 e 向左 96 px');
 assert.equal(m.cards[0].evidence[1].text,'玻片向上 0.8 mm，視野中的 e 向下 96 px');
});
test('Formula: FN = 18 mm is the simulation\'s setting and every line comes from the model',()=>{
 const f=S.conceptModel(concept()).formula;
 assert.equal(f.heading,'這台模擬顯微鏡的視野設定');assert.equal(f.expression,'視野直徑 = FN ÷ 物鏡倍率');
 assert.equal(f.note,'本站使用 FN = 18 mm 作為模擬設定；不同顯微鏡的目鏡視野數可能不同。');
 assert.deepEqual(f.lines.map(l=>l.text),M.OBJECTIVES.map(o=>`${o}× → ${Number(M.fieldDiameterMm(o).toFixed(2))} mm`));
 assert.deepEqual(f.lines.map(l=>l.text),['4× → 4.5 mm','10× → 1.8 mm','40× → 0.45 mm']);
 assert.ok(f.note.includes(String(M.FIELD_NUMBER_MM)));assert.ok(!/所有顯微鏡|固定為/.test(f.note));
});
test('Concept is refused before its phase and when the evidence is missing',()=>{
 for(const s of [welcome(),h0(),c1(),low0(),c2()])assert.equal(S.conceptModel(s),null);
 assert.equal(S.conceptModel({...concept(),records:{...concept().records,high:null}}),null);
 assert.equal(S.compareModel(concept()),null);
 assert.deepEqual(S.ctaFor(concept()),{label:'整理我的研究手冊',action:{type:'CONTINUE'},enabled:true});
});
test('Screens, steps and focus targets',()=>{
 const id=(s)=>S.screenFor(s).id;
 assert.deepEqual([welcome(),mission(),h0(),h1(),v0(),c1(),low0(),hi0(),c2(),concept()].map(id),['welcome','welcome','bench','bench','bench','compare','bench','bench','compare','concept']);
 assert.deepEqual(S.screenFor(h0()).arrival,['[data-role="stage-surface"]']);assert.deepEqual(S.screenFor(c1()).arrival,['#mg-compare-title']);assert.deepEqual(S.screenFor(concept()).arrival,['#mg-concept-title']);
 assert.deepEqual([welcome(),h0(),concept()].map(S.stepFor),['mission','experiment','experiment']);
 assert.deepEqual(S.stepNavModel(h0()).steps.map(s=>s.label),['接任務','動手做','研究手冊','挑戰題']);
 assert.equal(S.stationTitleFor(h0()),'顯微鏡實驗');assert.equal(S.stationTitleFor(concept()),'顯微鏡的影像與視野');
 assert.equal(S.ctaFor(h0()).label,'記錄橫向結果');assert.equal(S.ctaFor(v0()).label,'記錄縱向結果');
});
test('preconcept leakage: no formal pattern wording before the compare screens finish',()=>{
 const phases={welcome:welcome(),mission:mission(),h0:h0(),h1:h1(),v0:v0(),v1:v1(),low0:low0(),low1:low1(),hi0:hi0(),hi40:hi40(),lost:lost()};
 let checked=0;
 for(const [name,s] of Object.entries(phases)){
  const texts=textOf(s);
  for(const t of texts)for(const w of FORBIDDEN){assert.ok(!t.includes(w),`${name}: "${t}" contains ${w}`)}
  checked+=texts.length;
 }
 // every hint the coach can show
 let coach=coachOf(h0());for(const x of [-50,-100]){coach=S.reduceCoach(coach,ctx(run(h0(),set(x,0))));for(const w of FORBIDDEN)assert.ok(!(coach.tip??'').includes(w))}
 assert.ok(checked>40);
});
test('compare screens: the pattern words appear only as the learner\'s answer options',()=>{
 for(const [name,s] of [['compare1',c1()],['compare1-wrong',run(c1(),ans('direction','relation','same'))],['compare2',c2()],['compare2-wrong',run(c2(),ans('magnification','field','larger'),ans('magnification','count','more'))]]){
  const m=S.compareModel(s),texts=strings(m,k=>k==='options').concat(textOf(s));
  for(const t of texts)for(const w of FORBIDDEN)assert.ok(!t.includes(w),`${name}: "${t}" contains ${w}`);
 }
 assert.ok(S.compareModel(c1()).questions[0].options.some(o=>o.label.includes('相反')),'the option is allowed here');
 const done=run(c1(),ans('direction','relation','opposite'));
 for(const t of strings(S.compareModel(done),k=>k==='options'))assert.ok(!t.includes('相反'),'a right answer does not spell the rule out either');
});
test('the concept is the only place with the formal wording',()=>{
 const t=strings(S.conceptModel(concept())).join('');
 for(const w of ['顛倒','相反','變小']){assert.ok(t.includes(w),w)}
 assert.match(t,/旋轉 180°/);
});
test('accessible labels describe the state, never the rule',()=>{
 assert.equal(S.stageLabel(h1()),'玻片移動台，目前向右 1.0 毫米、向上 0.0 毫米');
 assert.equal(S.eyepieceLabel(h0(),deriveView(h0())),'顯微鏡視野，目前 e 位在右側');
 assert.equal(S.eyepieceLabel(h1(),deriveView(h1())),'顯微鏡視野，目前 e 在中央');
 assert.equal(S.eyepieceLabel(low1(),deriveView(low1())),'顯微鏡視野，目前可見 A、B、C');
 assert.equal(S.eyepieceLabel(hi40(),deriveView(hi40())),'顯微鏡視野，目前可見 B');
 assert.ok(!/影像會|e 會|相反/.test(S.stageLabel(h0())));
});
test('announcements: event-level ids, key events only',()=>{
 const step=(s,a,seq)=>{const prev=s,pv=deriveView(prev),r=reduce(prev,a);return {r,msg:S.announcementFor({result:r,prevState:prev,prevView:pv,state:r.state,view:deriveView(r.state),action:a,seq}),state:r.state}};
 let x=step(h0(),set(10,0),1);assert.equal(x.msg,null,'an ordinary move is silent');
 x=step(h0(),set(75,0),2);assert.deepEqual(x.msg,{id:'centered-2',text:'e 已到視野中央'});
 x=step(x.state,REC,3);assert.deepEqual(x.msg,{id:'record-3',text:'已記錄橫向結果'});
 x=step(h0(),set(-150,0),4);assert.deepEqual(x.msg,{id:'visible-4',text:'e 離開視野了'});
 const back=step(x.state,set(0,0),5);assert.deepEqual(back.msg,{id:'visible-5',text:'e 回到視野了'});
 x=step(low1(),REC,6);assert.equal(x.msg.text,'已記錄低倍結果');
 x=step(hi0(),{type:'SET_OBJECTIVE',objective:40},7);assert.equal(x.msg.text,'40× 下看得到 B');
 x=step(hi0(),set(60,0),8);assert.equal(x.msg,null);
 const lostNow=step(run(hi0(),set(60,0)),{type:'SET_OBJECTIVE',objective:40},9);assert.deepEqual(lostNow.msg,{id:'visible-9',text:'B 離開視野了'},'B was in the field at 4× and left it when the objective changed');
 x=step(c1(),ans('direction','relation','same'),10);assert.match(x.msg.text,/再對照一次表格/);assert.equal(x.msg.id,'compare-10');
 x=step(c1(),ans('direction','relation','opposite'),11);assert.match(x.msg.text,/這一題答對了，兩題都完成了/);
 x=step(run(c2(),ans('magnification','field','smaller'),ans('magnification','count','fewer')),CONT,12);assert.deepEqual(x.msg,{id:'concept-12',text:'概念整理'});
 assert.equal(S.announcementFor({result:{accepted:false},state:h0(),view:deriveView(h0())}),null);
});

// ---- B4: notebook, challenges, finish ------------------------------------------------------------------------------------
const nb=(base=c2)=>run(concept(base),CONT);
const SAVE=(fields)=>({type:'SAVE_CONCLUSION',fields});
const nbA=()=>run(nb(),SAVE({level:'A',relationDirection:'left',relationRange:'smaller'}));
const chA=(id,step,choice)=>({type:'ANSWER_CHALLENGE',id,step,choice});
const ch1=()=>run(nbA(),CONT);
const ch2=()=>run(ch1(),chA(1,'c1-direction','left-up'),CONT);
const ch3=()=>run(ch2(),chA(2,'c2-view','only-b-larger'),chA(2,'c2-claim','smaller-field'),CONT);
const fin=(note)=>run(ch3(),chA(3,'c3-strategy','low-recentre'),...(note?[{type:'SAVE_CHALLENGE_NOTE',id:3,text:note}]:[]),CONT);
const mdl=(state)=>S.challengeModel(state,deriveView(state));

test('B4 screens, steps and buttons: notebook is step 3, challenges and finish are step 4',()=>{
 assert.deepEqual([nb(),ch1(),ch2(),ch3(),fin()].map(s=>S.screenFor(s).id),['notebook','challenge','challenge','challenge','complete']);
 assert.deepEqual([concept(),nb(),ch1(),fin()].map(S.stepFor),['experiment','notebook','challenge','challenge']);
 assert.deepEqual([nb(),ch1(),fin()].map(s=>S.screenFor(s).arrival[0]),['#mg-notebook-title','#mg-challenge-title','#mg-complete-title']);
 assert.equal(S.ctaFor(nb()).label,'進入挑戰題');assert.equal(S.ctaFor(nb()).enabled,false);assert.equal(S.ctaFor(nbA()).enabled,true);
 assert.deepEqual([ch1(),ch2(),ch3()].map(s=>S.ctaFor(s).label),['下一個挑戰','下一個挑戰','看看我完成了什麼']);
 assert.equal(S.ctaFor(ch1()).enabled,false);assert.equal(S.ctaFor(run(ch1(),chA(1,'c1-direction','left-up'))).enabled,true);
 assert.equal(S.ctaFor(fin()),null);
 assert.deepEqual([nb(),ch1(),ch2(),ch3(),fin()].map(s=>coachOf(s).key),['notebook','challenge-1','challenge-2','challenge-3','complete']);
});
test('Notebook model: the evidence table is the direction comparison; the stems and given lines are the learner\'s own',()=>{
 const m=S.notebookModel(nb());
 assert.equal(m.heading,'我的研究手冊');assert.deepEqual(m.levels.map(l=>l.id),['A','B','C']);assert.equal(m.selectedLevel,null);
 assert.deepEqual(m.evidenceSummary.independentVariable,{label:'移動方向',from:'水平',to:'垂直'});
 assert.deepEqual(m.evidenceSummary.observedResponse.map(r=>[r.first,r.second]),[['向右 1.0 mm','向上 1.0 mm'],['向左 120 px','向下 120 px']]);
 assert.deepEqual(m.levelA.given,['橫向實驗中，我把玻片向右 1.0 mm，視野中的 e 向左 120 px。','4× 時看到 3 個記號；40× 時看到 1 個記號。']);
 assert.equal(m.levelA.stems[0].legend,'我把玻片往右移時，視野中的影像往……');assert.equal(m.levelA.stems[1].legend,'換成較高倍率後，看到的範圍變……');
 assert.deepEqual(m.levelA.stems[0].options,[{value:'left',label:'左邊'},{value:'right',label:'右邊'},{value:'still',label:'不會動'}]);
 assert.deepEqual(m.levelA.stems[1].options,[{value:'smaller',label:'變小'},{value:'larger',label:'變大'},{value:'same',label:'一樣'}]);
 assert.equal(S.notebookModel(c2()),null);assert.equal(S.notebookModel(ch1()),null);
});
test('Notebook given lines and stem follow what the learner actually did (slide left -> a different stem and numbers)',()=>{
 const base=()=>run(createInitialState(),{type:'START'},{type:'BEGIN'},set(75,0),REC,set(0,75),REC);
 const left=run(base(),ans('direction','relation','opposite'),CONT,set(0,0),REC,{type:'SET_OBJECTIVE',objective:40},REC,ans('magnification','field','smaller'),ans('magnification','count','fewer'),CONT,CONT);
 const tampered=structuredClone(left);tampered.records.horizontal.stageEnd={x:60,y:0};
 const m=S.notebookModel(tampered);assert.equal(m.levelA.given[0],'橫向實驗中，我把玻片向右 0.8 mm，視野中的 e 向左 96 px。');
 const leftward=structuredClone(left);leftward.records.horizontal.stageStart={x:0,y:0};leftward.records.horizontal.stageEnd={x:-60,y:0};
 const l=S.notebookModel(leftward);assert.equal(l.levelA.stems[0].legend,'我把玻片往左移時，視野中的影像往……');assert.match(l.levelA.given[0],/玻片向左 0\.8 mm，視野中的 e 向右 96 px/);
});
test('Notebook: nudge only when both relations are chosen and wrong; ready note only when ready; ideas after a limitation is written',()=>{
 assert.equal(S.notebookModel(nb()).levelA.nudge,null);
 const half=S.notebookModel(run(nb(),SAVE({level:'A',relationDirection:'left'})));assert.equal(half.levelA.nudge,null);
 const wrong=S.notebookModel(run(nb(),SAVE({level:'A',relationDirection:'right',relationRange:'smaller'})));
 assert.equal(wrong.levelA.nudge,'再對照一下你的實驗紀錄。');assert.equal(wrong.readyNote,null);assert.equal(wrong.ready,false);
 const ok=S.notebookModel(nbA());assert.equal(ok.levelA.nudge,null);assert.equal(ok.readyNote,'你的研究手冊已經整理好了。');assert.equal(ok.ready,true);
 assert.equal(S.notebookModel(nb()).levelC.showIdeas,false);
 const c=S.notebookModel(run(nb(),SAVE({level:'C',evidenceText:'我的觀察很多',limitationText:'還不夠多'})));assert.equal(c.levelC.showIdeas,true);assert.equal(c.ready,true);
 assert.deepEqual(c.levelC.ideas,['只測過水平與垂直各一次。','倍率只比較 4× 和 40×。','使用的是教學記號，不是真實細胞。']);
});
test('Notebook B and C carry prompts and placeholders that do not hand over the answer',()=>{
 const m=S.notebookModel(nb());
 assert.equal(m.levelB.prompt,'用你的實驗紀錄，說明你發現的兩個規律。');assert.equal(m.levelB.placeholder,'我移動玻片時……；換成較高倍率後……');
 assert.equal(m.levelC.q1.label,'你用哪些觀察支持這兩個結論？');assert.equal(m.levelC.q2.label,'這次實驗還有哪些事情不能只靠這些資料判斷？');
 for(const t of [m.levelB.placeholder,m.levelB.help,m.levelC.help])for(const w of ['相反','顛倒','變小','變大'])assert.ok(!t.includes(w),`${t} / ${w}`);
 const typed=S.notebookModel(run(nb(),SAVE({level:'B',freeText:'我的想法'})));assert.equal(typed.levelB.value,'我的想法');assert.equal(typed.selectedLevel,'B');
});
test('Challenge 1: scenario, one step, four options, no answer in the model',()=>{
 const m=mdl(ch1());
 assert.equal(m.id,1);assert.equal(m.title,'挑戰 1／3：把左上角的目標帶回中央');assert.equal(m.scenario,'視野中的目標現在在左上角。');assert.equal(m.count,3);
 assert.equal(m.steps.length,1);assert.equal(m.steps[0].question,'要讓影像往右下回到中央，玻片應該往哪裡移？');
 assert.deepEqual(m.steps[0].options.map(o=>o.label),['往右上','往左上','往右下','往左下']);
 assert.ok(!/correct\w*[:"]\s*"?(left-up|true)|answerKey/i.test(JSON.stringify({...m,steps:m.steps.map(({correct,...x})=>x)})),'the model has no answer key (only the learner\'s solved flag)');
 assert.equal(m.note,undefined);assert.equal(S.challengeModel(nb(),deriveView(nb())),null);
});
test('Challenge feedback: nothing, then a generic nudge, then from the second try the step\'s hint; a right answer says why',()=>{
 const fb=(state)=>mdl(state).steps[0].feedback;
 assert.equal(fb(ch1()),null);
 const w1=run(ch1(),chA(1,'c1-direction','right-down'));assert.deepEqual(fb(w1),{kind:'nudge',text:'先想想你在方向實驗中，玻片和影像各往哪邊移。'});
 const w2=run(w1,chA(1,'c1-direction','right-up'));assert.equal(fb(w2).kind,'hint');assert.match(fb(w2).text,/橫向和縱向紀錄/);
 assert.ok(!fb(w2).text.includes('往左上'),'the hint never names the right button');
 const ok=run(w2,chA(1,'c1-direction','left-up'));assert.deepEqual(fb(ok),{kind:'success',text:'玻片往左上移，影像就往右下移，目標回到中央。'});
 assert.equal(mdl(ok).steps[0].correct,true);assert.equal(mdl(ok).allCorrect,true);assert.equal(mdl(ok).steps[0].attempts,3);
});
test('Challenge 2: two steps, the second unlocked by the first; no bench to operate',()=>{
 const m=mdl(ch2());assert.equal(m.title,'挑戰 2／3：高倍下少了誰？');assert.equal(m.scenario,'4× 時你看得到 A、B、C，而且 B 在中央。現在換成 40×。');
 assert.deepEqual(m.steps.map(s=>[s.id,s.unlocked]),[['c2-view',true],['c2-claim',false]]);
 assert.equal(m.steps[0].question,'最可能看到什麼？');assert.equal(m.steps[1].question,'這個結果最支持哪個說法？');
 assert.deepEqual(m.steps[0].options.map(o=>o.value),['all-larger','only-b-larger','all-smaller','more-marks']);
 assert.deepEqual(m.steps[1].options.map(o=>o.value),['slide-moved','marks-shrunk','smaller-field','brighter']);
 const opened=mdl(run(ch2(),chA(2,'c2-view','only-b-larger')));assert.deepEqual(opened.steps.map(s=>s.unlocked),[true,true]);assert.equal(opened.allCorrect,false);
 assert.equal(S.ctaFor(run(ch2(),chA(2,'c2-view','only-b-larger'))).enabled,false);
});
test('Challenge 3: one required step; the optional note appears after it is solved and never gates the way on',()=>{
 const m=mdl(ch3());assert.equal(m.title,'挑戰 3／3：高倍找不到目標怎麼辦？');assert.equal(m.scenario,'你在低倍看到目標，但換成高倍後，目標不見了。');
 assert.equal(m.steps.length,1);assert.equal(m.steps[0].question,'下一步最合理怎麼做？');assert.equal(m.note,undefined);
 assert.deepEqual(m.steps[0].options.map(o=>o.label),['留在高倍隨意大幅移動玻片','繼續提高倍率','回低倍找到目標並重新置中，再換高倍','只把照明調到最亮']);
 const solved=run(ch3(),chA(3,'c3-strategy','low-recentre')),n=mdl(solved);
 assert.deepEqual(n.note,{label:'用自己的話說說看：為什麼先回低倍並置中比較好？（可以不寫）',placeholder:'因為低倍時……',text:''});
 assert.equal(S.ctaFor(solved).enabled,true,'a blank note does not block');
 assert.equal(mdl(run(solved,{type:'SAVE_CHALLENGE_NOTE',id:3,text:'因為範圍小'})).note.text,'因為範圍小');
 for(const t of strings(S.LATE_TEXT?.challenge?.items?.[3]??mdl(ch3())))assert.ok(!/微動|粗動/.test(t),'nothing about the focus wheels, which this lab never taught');
});
test('Completion: three claims of what the learner did, and the learner\'s own conclusion for the level they chose',()=>{
 const a=S.completeModel(fin());assert.equal(a.heading,'這一站完成了');assert.equal(a.claims.length,3);
 assert.deepEqual(a.claims,['我用橫向和縱向移動紀錄比較了玻片與影像的方向。','我比較了 4× 和 40× 的視野與可見記號。','我能用低倍先定位、置中，再進入高倍觀察。']);
 assert.equal(a.conclusionIntro,'我的結論：');
 assert.deepEqual(a.conclusion,['玻片往右移時，視野中的影像往左移；換成較高倍率後，看到的範圍變小。']);
 assert.deepEqual(a.link,{href:'../microscope-lab.html',label:'自由探索／完整顯微鏡'});
 const toFinish=(conclusionActions)=>run(concept(),CONT,...conclusionActions,CONT,chA(1,'c1-direction','left-up'),CONT,chA(2,'c2-view','only-b-larger'),chA(2,'c2-claim','smaller-field'),CONT,chA(3,'c3-strategy','low-recentre'),CONT);
 assert.deepEqual(S.completeModel(toFinish([SAVE({level:'B',freeText:'我發現了兩件事'})])).conclusion,['我發現了兩件事']);
 assert.deepEqual(S.completeModel(toFinish([SAVE({level:'C',evidenceText:'我的證據',limitationText:'我的限制'})])).conclusion,['我的證據','我的限制']);
 assert.equal(S.completeModel(ch3()),null);
});
test('B4 announcements: relations, challenge feedback, transitions and the finish; typing says nothing',()=>{
 const step=(s,a,seq)=>{const pv=deriveView(s),r=reduce(s,a);return {msg:S.announcementFor({result:r,prevState:s,prevView:pv,state:r.state,view:deriveView(r.state),action:a,seq}),state:r.state}};
 assert.equal(step(nb(),SAVE({level:'B',freeText:'abcd'}),1).msg,null,'typing is silent');
 assert.equal(step(nb(),SAVE({level:'A',relationDirection:'left'}),2).msg,null,'half-chosen is silent');
 assert.deepEqual(step(run(nb(),SAVE({level:'A',relationDirection:'left'})),SAVE({relationRange:'smaller'}),3).msg,{id:'notebook-relations-3',text:'你的研究手冊已經整理好了。'});
 assert.deepEqual(step(run(nb(),SAVE({level:'A',relationDirection:'right'})),SAVE({relationRange:'smaller'}),4).msg,{id:'notebook-relations-4',text:'再對照一下你的實驗紀錄。'});
 assert.deepEqual(step(ch1(),chA(1,'c1-direction','right-up'),5).msg,{id:'challenge-answer-5',text:'先想想你在方向實驗中，玻片和影像各往哪邊移。'});
 assert.match(step(ch1(),chA(1,'c1-direction','left-up'),6).msg.text,/玻片往左上移/);
 assert.deepEqual(step(concept(),CONT,7).msg,{id:'notebook-7',text:'研究手冊'});
 assert.deepEqual(step(nbA(),CONT,8).msg,{id:'challenge-8',text:'挑戰 1'});
 assert.deepEqual(step(run(ch3(),chA(3,'c3-strategy','low-recentre')),CONT,9).msg,{id:'complete-9',text:'這一站完成了。'});
 assert.equal(step(run(ch3(),chA(3,'c3-strategy','low-recentre')),{type:'SAVE_CHALLENGE_NOTE',id:3,text:'abc'},10).msg,null);
});
test('B4 leakage guard: the notebook placeholder and challenge hints never hand over the pattern, and Challenge 3 stays out of focus wheels',()=>{
 const m=mdl(ch3());
 for(const t of strings(S.notebookModel(nb()),k=>['levelA','evidenceSummary'].includes(k)).concat(strings(m)))assert.ok(!/微動|粗動/.test(t));
});
test('the script is a pure module: no DOM, storage, analytics or pointer code',()=>{
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/microscope-guided/script.js',import.meta.url)),'utf8');
 for(const w of ['document.','window.','localStorage','sessionStorage','fetch(','bhcsScienceTrack','addEventListener','pointer','innerHTML'])assert.ok(!src.includes(w),`script.js must not contain "${w}"`);
});
console.log(`${tests} microscope script tests passed`);
