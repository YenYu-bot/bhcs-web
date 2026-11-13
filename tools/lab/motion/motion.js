import { derive, positionAt, distanceAt, SAMPLE_TIMES, parseNumeric } from '../../motion-graphs-desk/model.mjs';
import { $, store, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';

const times = [SAMPLE_TIMES[0], SAMPLE_TIMES[2], SAMPLE_TIMES[4], SAMPLE_TIMES.at(-1)];
const samples = [SAMPLE_TIMES[1], SAMPLE_TIMES[3], SAMPLE_TIMES[6]];
const segments = times.slice(0,-1).map((a,i) => {
  const b=times[i+1], x1=positionAt(a), x2=positionAt(b);
  return {a,b,x1,x2,v:(x2-x1)/(b-a),d:distanceAt(b)-distanceAt(a)};
});
const [right, rest, left] = segments;
const atEnd = derive(times.at(-1));
const plus = n => n > 0 ? '＋'+n : n < 0 ? '−'+Math.abs(n) : '0';
const range = ({a,b}) => `${a}～${b} 秒`;
const STEPS = [
  {id:'right',label:'往右',title:'讓小車往右走',goal:`點小車或按播放。觀察 ${range(right)} 的位置變化，再收下證據。`,intro:'點小車，我們看它怎麼離開起點。',found:[`小車往右走了 ${right.d} m，位置線往上。`,`${right.x1} m → ${right.x2} m，共 ${right.b-right.a} 秒`]},
  {id:'rest',label:'停住',title:'時間在走，小車呢？',goal:`播放 ${range(rest)}。看車的位置和時間游標有什麼不同。`,intro:'時間還會繼續走，先盯著小車。',found:['車沒移動，位置圖變成水平線。',`過了 ${rest.b-rest.a} 秒，小車仍在 ${rest.x1} m。`]},
  {id:'left',label:'往左',title:'小車往左回來了',goal:`播放 ${range(left)}。看回程的線跟去程哪裡不一樣。`,intro:'再播放一次，看小車怎麼回到起點。',found:['回程的線往下，而且比去程平緩。',`同樣 ${left.d} m，去程 ${right.b-right.a} 秒，回程 ${left.b-left.a} 秒。`]},
  {id:'compare',label:'兩張圖',title:'同一秒，看兩張圖',goal:`按下 ${samples.join('、')} 秒，或拖游標到各段中間，比對位置與速度。`,intro:'兩張圖用的是同一個時間。先點一個秒數。',found:['速度的正負告訴我們方向，不是快慢。',segments.map(s=>`${plus(s.v)} m/s`).join('、')]},
  {id:'calc',label:'算一算',title:'回到起點，真的沒走路嗎？',goal:'從你看到的去程與回程，算出整趟的路徑長與位移。',intro:'路徑長要把實際走過的每一段加起來。',found:['回到起點，位移為零；路徑長不為零。',`路徑長 ${right.d}＋${left.d}＝${atEnd.distanceM} m；位移 ${atEnd.positionM}−${right.x1}＝${atEnd.displacementM} m。`]},
  {id:'quiz',label:'說說看',title:'用你看到的圖說說看',goal:'三題小挑戰。可以回看，不計時、不扣分。',intro:'讀圖時，先看清楚它的縱軸是什麼。',found:['你已經能用圖說明小車怎麼動了！','位置、速度、路徑長和位移，各回答不同的問題。']},
];
const QUIZ = [
  {q:'哪一段小車真的停住了？',a:[range(right),range(rest),range(left)],correct:1,h:[`${range(right)} 位置從 ${right.x1} m 增加到 ${right.x2} m，小車在往右。`,'',`${range(left)} 的位置圖往下，小車正在往左。`],ok:'位置圖的水平段，代表位置沒變。'},
  {q:'同樣走一段路，哪個方向比較快？',a:['往右的去程','往左的回程','兩段一樣快'],correct:0,h:['',`回程花 ${left.b-left.a} 秒，去程只花 ${right.b-right.a} 秒；同樣長，時間越短越快。`,'看位置圖哪一段比較陡；同樣的路徑長，不代表用時一樣。'],ok:'去程的位置圖比較陡，速率比較大。'},
  {q:'回到起點時，哪個說法正確？',a:['路徑長和位移都為 0','路徑長是 0，位移不是 0','位移是 0，路徑長不是 0'],correct:2,h:[`回到原處不代表沒走過，去程和回程各走了 ${right.d} m。`,'位移只看終點減起點，這次兩者位置一樣。',''],ok:'位移只看起點與終點；路徑長要算每一段。'},
];
const storage = store('bhcs.lab.motion.v1');
const fresh = () => ({step:0, t:times[0], reached:[false,false,false], visited:[], done:[], quiz:0, answers:['','']});
function loadState(){
  const v = storage.load();
  if(!v || !Number.isInteger(v.step) || v.step<0 || v.step>=STEPS.length || !Number.isFinite(v.t) || v.t<times[0] || v.t>times.at(-1) ||
      !Array.isArray(v.reached) || v.reached.length!==segments.length || !v.reached.every(a=>typeof a==='boolean') ||
      !Array.isArray(v.visited) || !v.visited.every(i=>Number.isInteger(i)&&i>=0&&i<segments.length) ||
      !Array.isArray(v.done) || !v.done.every(i=>Number.isInteger(i)&&i>=0&&i<STEPS.length) ||
      !Number.isInteger(v.quiz) || v.quiz<0 || v.quiz>QUIZ.length ||
      !Array.isArray(v.answers) || v.answers.length!==2 || !v.answers.every(a=>typeof a==='string'&&a.length<=12)) return fresh();
  v.done=[...new Set(v.done)]; v.visited=[...new Set(v.visited)];
  if(v.step<segments.length && (v.t<segments[v.step].a||v.t>segments[v.step].b)) return fresh();
  if(v.done.includes(5) !== (v.quiz===QUIZ.length)) return fresh();
  return v;
}
let S = loadState(), raf=0, running=false, note='', goodNote=false, transientTime=null;
const teacher = new Teacher($('#teacher-pic'),$('#bubble'),$('#live'));
const slider = $('#time-slider');
const mq=matchMedia('(max-width: 860px)');
const xCoord = x => 115 + x * (770/6);
const ns='http://www.w3.org/2000/svg';
const el = (tag, attrs={}, content='') => {
  const e=document.createElementNS(ns,tag); for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
  if(content) e.textContent=content;
  return e;
};
for(let i=0;i<=6;i++) {
  const x=xCoord(i);
  $('#ticks').append(el('path',{d:`M${x} 250 v13`,stroke:'#23304A','stroke-width':3}),el('text',{x,y:284,'text-anchor':'middle','font-size':22,'font-weight':900,fill:'#23304A'},i===6?'6 m':String(i)));
}

const graphX = t => 42 + (t/times.at(-1))*299;
function makeGraph(sel, speed) {
  const svg=$(sel); const lo=speed?-2:0, hi=speed?3:6;
  const y=n => 127 - (n-lo)/(hi-lo)*100;
  const x=graphX;
  const line=(x1,y1,x2,y2,attrs={})=>el('line',{x1,y1,x2,y2,...attrs});
  const label=(xx,yy,s,attrs={})=>el('text',{x:xx,y:yy,fill:'#40536B','font-size':12,...attrs},String(s));
  const x0=x(times[0]), xEnd=x(times.at(-1));
  svg.append(label(10,15,speed?'v (m/s)':'x (m)',{'font-weight':800}),label(354,156,'t (秒)',{'font-weight':800,'text-anchor':'end'}));
  for(const t of SAMPLE_TIMES){
    svg.append(line(x(t),27,x(t),127,{stroke:'#E2EAF2'}),label(x(t),143,t,{'text-anchor':'middle'}));
  }
  for(let n=lo;n<=hi;n++){
    svg.append(line(x0,y(n),xEnd,y(n),{stroke:'#D7E3ED'}),label(36,y(n)+4,n,{'text-anchor':'end'}));
  }
  svg.append(line(x0,24,x0,127,{stroke:'#7186A0','stroke-width':1.5}),line(x0,y(0),xEnd,y(0),{stroke:'#7186A0','stroke-width':1.5}));
  const data=el('g',{fill:'none','stroke-width':3.3,'stroke-linecap':'round','stroke-linejoin':'round',stroke:speed?'#267559':'#2F6FB0'});
  const cursor=line(x0,27,x0,127,{stroke:'#C8372D','stroke-width':2,'stroke-dasharray':'4 3'});
  const dot=el('circle',{cx:x0,cy:y(speed?right.v:right.x1),r:5,fill:'#C8372D',stroke:'#FFF','stroke-width':2});
  svg.append(data,cursor,dot);
  return {svg,x,y,data,cursor,dot,speed,cache:null};
}
const graphs=[makeGraph('#position-graph',false),makeGraph('#speed-graph',true)];
const viewBounds=()=>S.step<segments.length ? segments[S.step] : {a:times[0],b:times.at(-1)};
function phase(t){return segments.findIndex(s=>s.a<t&&t<s.b)}
function drawGraph(g,t,seen){
  const seg=phase(t), v=seg<0?null:segments[seg].v;
  if(g.cache!==seen){
    g.cache=seen;
    if(g.speed){
      const paths=segments.map(({a,b,v})=>el('g',{}));
      segments.forEach(({a,b,v},i)=>{
        if(seen<=a)return;
        const end=Math.min(b,seen);
        paths[i].append(el('line',{x1:g.x(a),y1:g.y(v),x2:g.x(end),y2:g.y(v)}));
        for(const edge of [a,...(seen>=b?[b]:[])])paths[i].append(el('circle',{cx:g.x(edge),cy:g.y(v),r:3.5,fill:'#F5F8FB','stroke-width':1.8}));
      });
      g.data.replaceChildren(...paths);
    } else {
      const pts=[...times.filter(v=>v<seen),seen];
      g.data.replaceChildren(el('polyline',{points:pts.map(v=>`${g.x(v)},${g.y(positionAt(v))}`).join(' ')}));
    }
  }
  const x=g.x(t);
  g.cursor.setAttribute('x1',x);g.cursor.setAttribute('x2',x);
  g.dot.setAttribute('cx',x);g.dot.setAttribute('visibility',g.speed&&v===null?'hidden':'visible');
  g.dot.setAttribute('cy',g.y(g.speed?(v??0):positionAt(t)));
}
function updateTime(t){
  const {a,b}=viewBounds(), seg=phase(t), p=derive(t);
  $('#r-1').textContent=t.toFixed(1).replace(/\.0$/,'');
  $('#r-2').textContent=p.positionM.toFixed(1).replace(/\.0$/,'');
  $('#r-3').textContent=seg<0?'—':plus(segments[seg].v);
  slider.min=a;slider.max=b;slider.value=t;slider.setAttribute('aria-valuetext',`${$('#r-1').textContent} 秒，位置 ${$('#r-2').textContent} 公尺`);
  $('#car-position').setAttribute('transform',`translate(${xCoord(p.positionM)} 0)`);
  const facing=t>left.a?-1:1;
  $('#car-shape').setAttribute('transform',`scale(${facing} 1)`);
  const show=t>times[0] || S.step>0 || S.done.includes(0);
  $('#graph-board').hidden=!show;
  const seen=S.step>=3 ? times.at(-1) : Math.max(t,...segments.filter((_,i)=>S.done.includes(i)||S.reached[i]).map(s=>s.b),times[0]);
  graphs.forEach(g=>drawGraph(g,t,seen));
  $('#position-graph').setAttribute('aria-label',`位置時間圖：目前 ${$('#r-1').textContent} 秒，位置 ${$('#r-2').textContent} 公尺`);
  $('#speed-graph').setAttribute('aria-label',seg<0?'速度時間圖：游標位在分段端點':'速度時間圖：目前速度 '+plus(segments[seg].v)+' 公尺每秒');
  $('#prev-sec').disabled=t<=a; $('#next-sec').disabled=t>=b;
}
function setViewBox(){ $('#scene').setAttribute('viewBox',mq.matches?'24 52 952 296':'0 34 1000 318'); }
mq.addEventListener('change',setViewBox);
function persist(){storage.save(S)}
function stop(){
  if(raf)cancelAnimationFrame(raf);
  raf=0;running=false;transientTime=null;
}
function seek(t){
  stop(); const {a,b}=viewBounds(); S.t=Math.round(Math.max(a,Math.min(b,t))*10)/10;
  if(S.step<3&&S.t===b)S.reached[S.step]=true;
  if(S.step===3){const i=phase(S.t);if(i>=0&&!S.visited.includes(i))S.visited.push(i);}
  note='';goodNote=false; persist(); render();
}
function play(){
  if(running){const t=transientTime??S.t;seek(t);return;}
  const {a,b}=viewBounds();
  if(reduceMotion()){seek(b);return;}
  const start=S.t>=b?a:S.t;
  S.t=start; transientTime=start; running=true; note='';goodNote=false;render();
  const when=performance.now();
  function frame(now){
    const t=Math.min(b,start+(now-when)/1000);
    transientTime=t;updateTime(t);
    if(t>=b)seek(b);else raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
}
function ready(){return S.step<3?S.reached[S.step]:S.step===3&&S.visited.length===segments.length}
function goStep(i,focus=true){
  stop();S.step=i;S.t=i<3?segments[i].a:i===3?times[0]:times.at(-1); note='';goodNote=false;persist(); render(true);
  $('.scene-area').scrollTop=0;
  if(focus)$('#task-title').focus({preventScroll:true});
}
function mark(i){
  if(!S.done.includes(i))S.done.push(i);
  persist();
}
function keep(){
  if(!ready()||running||S.done.includes(S.step))return;
  const from=$('#save');fly(from,$('#evidence'),STEPS[S.step].label);
  mark(S.step);render(true);bump($('#note-count'));$('#scene-next').focus({preventScroll:true});
}
function resetStep(){
  S.done=S.done.filter(i=>i!==S.step);
  if(S.step<3)S.reached[S.step]=false;
  if(S.step===3)S.visited=[];
  if(S.step===4)S.answers=['',''];
  if(S.step===5)S.quiz=0;
  goStep(S.step,false);
}
function clearAll(){
  if(!confirm('要清空這個實驗桌的全部觀察和答案嗎？'))return;
  stop(); S=fresh(); note='';goodNote=false;storage.clear(); document.querySelectorAll('dialog[open]').forEach(d=>d.close());render(true);
  $('#play').focus({preventScroll:true});
}
function check(e){
  e.preventDefault();
  const [d,x]=S.answers.map(a=>parseNumeric(a.replace('−','-').normalize('NFKC'),true));
  if(d.status!=='valid'||x.status!=='valid'){
    note='請在兩格都填入數字，單位已經標好了。';goodNote=false;
  } else if(d.value!==atEnd.distanceM) {
    note=d.value===0?'回到原處不等於沒走路。去程和回程各走了幾公尺？':`路徑長不看方向：去程 ${right.d} m，回程 ${left.d} m，要加起來。`;goodNote=false;
  } else if(x.value!==atEnd.displacementM){
    note=`位移只看終點減起點。這次兩個位置都在 ${right.x1} m。`;goodNote=false;
  } else {
    mark(S.step);note='';render(true);$('#task-go').focus({preventScroll:true});return;
  }
  talk();
}
function answer(idx){
  if(S.done.includes(5)||S.quiz>=QUIZ.length)return;
  const q=QUIZ[S.quiz];
  if(idx!==q.correct){note=q.h[idx];goodNote=false;talk();return;}
  note=q.ok;goodNote=true;S.quiz++;
  if(S.quiz===QUIZ.length)mark(5);
  persist();render(true);
  if(S.done.length===STEPS.length)finish();
  else if(S.quiz<QUIZ.length)$('#quiz button').focus({preventScroll:true});
  else $('#task-go').focus({preventScroll:true});
}
function talk(){
  const step=STEPS[S.step];
  if(S.done.includes(S.step)){
    const action={label:S.step===5?(S.done.length===STEPS.length?'看成果':'補齊任務'):'下一步 →',run:advance};
    teacher.say(step.found[0],{pose:'cheer',tone:'found',tag:'發現時刻',eq:step.found[1],action});return;
  }
  if(note){teacher.say(note,{pose:goodNote?'wow':'think',tone:goodNote?'say':'oops'});return;}
  if(S.step<3 && ready()&&!running){teacher.say('這段看完了，收下你看到的變化。',{pose:'wow'});return;}
  if(S.step===3 && ready()&&!running){teacher.say('三段都對照過了，收下這次比較。',{pose:'wow'});return;}
  if(S.step===3 && phase(S.t)>=0) {
    const i=phase(S.t),s=segments[i];
    teacher.say(`這段是 ${plus(s.v)} m/s。`,{pose:'point',eq:`(${s.x2}−${s.x1}) ÷ (${s.b}−${s.a})＝${plus(s.v)} m/s`});return;
  }
  teacher.say(step.intro,{pose:'point'});
}
function advance(){
  if(S.step<5){goStep(S.step+1);if(mq.matches){if(S.step<4){window.scrollTo(0,0);$('#play').focus({preventScroll:true});}else $('#task').scrollIntoView({block:'start'});}}
  else if(S.done.length===STEPS.length)finish();
  else goStep(STEPS.findIndex((_,i)=>!S.done.includes(i)));
}
function finish(){
  $('#finish-list').replaceChildren(...S.done.filter(i=>i!==5).sort((a,b)=>a-b).map(i=>{
    const e=document.createElement('li');e.textContent=STEPS[i].found[1];return e;
  }));
  $('#stars').replaceChildren(...STEPS.map(()=>{
    const svg=el('svg',{viewBox:'0 0 50 50','aria-hidden':true});
    svg.append(el('path',{d:'M25 3 31 18 47 19 35 30 39 46 25 37 11 46 15 30 3 19 19 18Z',fill:'#F2BF51',stroke:'#A6642D','stroke-width':2,'stroke-linejoin':'round'}));
    return svg;
  }));
  $('#finish-dialog').showModal();
}
function renderEvidence(){
  for(const sel of ['#note-count','#ev-count'])$(sel).textContent=S.done.length;
  $('#ev-empty').hidden=S.done.length>0;
  $('#chips').replaceChildren(...S.done.slice(-4).reverse().map(i=>{
    const li=document.createElement('li'), b=document.createElement('b'), small=document.createElement('small');
    li.className='chip';b.textContent=STEPS[i].label;small.textContent=STEPS[i].found[1];li.append(b,small);return li;
  }));
  $('#notes-body').replaceChildren(...S.done.map(i=>{
    const tr=document.createElement('tr'),a=document.createElement('th'),b=document.createElement('td');
    a.scope='row';a.textContent=STEPS[i].label;b.textContent=STEPS[i].found[1];tr.append(a,b);return tr;
  }));
  if(!S.done.length){
    const tr=document.createElement('tr'), td=document.createElement('td');
    td.colSpan=2;td.textContent='還沒有證據。';tr.append(td);$('#notes-body').append(tr);
  }
}
const compareBtns=samples.map(t=>{
  const b=document.createElement('button');b.type='button';b.className='btn-soft';b.textContent=`${t} 秒`;b.addEventListener('click',()=>seek(t));return b;
});
$('#compare').append(...compareBtns);
let lastQuiz=-1;
function renderQuiz(){
  if(lastQuiz===S.quiz)return;
  lastQuiz=S.quiz;
  const q=QUIZ[S.quiz];
  $('#quiz-q').textContent=q?`第 ${S.quiz+1}／${QUIZ.length} 題　${q.q}`:'三題都完成了！';
  $('#quiz').replaceChildren(...(q?q.a.map((opt,i)=>{
    const b=document.createElement('button');b.type='button';b.className='btn-soft';b.textContent=opt;b.addEventListener('click',()=>answer(i));return b;
  }):[]));
}
function render(full=false){
  const step=STEPS[S.step], done=S.done.includes(S.step), isReady=ready();
  $('#task-kicker').textContent=`任務 ${S.step+1} / ${STEPS.length}`;
  $('#task-title').textContent=step.title;$('#task-goal').textContent=step.goal;
  $('#task-go').hidden=!done;
  $('#task-go').textContent=S.step===5?(S.done.length===STEPS.length?'看成果':'補齊任務'):'下一步 →';
  $('#dock-pull').hidden=S.step>=4||(!isReady&&!done);$('#compare-box').hidden=S.step!==3;
  $('#scene-next').hidden=!done;
  $('#dock-calc').hidden=S.step!==4;$('#dock-quiz').hidden=S.step!==5;
  $('#speed-panel').hidden=S.step<3;$('#speed-reading').hidden=S.step<3;
  $('#graph-hint').textContent=S.step<3?'紅色游標跟著小車一起走':'紅色游標連起同一秒；空心點是區間端點';
  compareBtns.forEach((b,i)=>b.setAttribute('aria-pressed',String(S.visited.includes(i))));
  $('#save').disabled=!isReady||running||done;$('#save').textContent=done?'已收下這次觀察':'收下這次觀察';
  $('#save').classList.toggle('cue',isReady&&!running&&!done);
  $('#car').classList.toggle('cue',S.step<3&&!running&&!isReady);
  $('#play-label').textContent=running?'暫停':'播放小車';$('#car').setAttribute('aria-label',running?'暫停小車':'播放小車');
  $('#stage-cue').textContent=running?'看小車，也看時間游標':S.step<3?(isReady?'看完這段，收下觀察':'點小車或按播放'):'拖游標，對照同一秒的兩張圖';
  $('#distance').readOnly=done&&S.step===4;$('#displacement').readOnly=done&&S.step===4;$('#check').disabled=done&&S.step===4;
  if(full){renderSteps($('#steps'),STEPS,step.id,new Set(S.done.map(i=>STEPS[i].id)),id=>goStep(STEPS.findIndex(s=>s.id===id)));
    renderEvidence();
    $('#distance').value=S.answers[0];$('#displacement').value=S.answers[1];
  }
  if(S.step===5)renderQuiz();
  updateTime(transientTime??S.t);talk();
}

$('#play').addEventListener('click',play);
$('#car').addEventListener('click',play);
$('#car').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)play();}});
$('#prev-sec').addEventListener('click',()=>seek((transientTime??S.t)-1));
$('#next-sec').addEventListener('click',()=>seek((transientTime??S.t)+1));
slider.addEventListener('input',()=>seek(Number(slider.value)));
$('#save').addEventListener('click',keep);
$('#task-go').addEventListener('click',advance);
$('#scene-next').addEventListener('click',advance);
$('#task-reset').addEventListener('click',resetStep);
$('#clear-records').addEventListener('click',clearAll);
$('#reset-all').addEventListener('click',clearAll);
$('#open-notes').addEventListener('click',()=>$('#notes-dialog').showModal());
$('#why').addEventListener('click',()=>$('#why-dialog').showModal());
$('#finish-notes').addEventListener('click',()=>{$('#finish-dialog').close();$('#notes-dialog').showModal();});
document.querySelectorAll('dialog [data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#calc-form').addEventListener('submit',check);
['#distance','#displacement'].forEach((sel,i)=>$(sel).addEventListener('input',()=>{S.answers[i]=$(sel).value;persist();}));
setViewBox();render(true);
