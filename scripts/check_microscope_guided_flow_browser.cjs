// B5 gate (real browser part): a learner walks the guided microscope lab from the welcome page to the finish, using only the
// page: buttons, the keyboard, mouse and touch drags on the stage, the compare radios, the notebook, the challenge buttons.
// No state is injected for the main walk (no test hook). Checks the teaching words (nothing formal before the concept), the
// evidence the learner produced, the compare cards, the notebook levels and buffering, the challenge attempts (a focus move or
// an arrow key is never an answer), the one live region, focus at every hand-over, layout at 1280 and 390, and axe at the main
// stages. The 1280 walk also reloads at eight checkpoints to prove saving and restore; further parts check forged saves, blocked
// storage and the exact analytics sequence.
// Needs Playwright (CI: NODE_PATH=/tmp/bhcs-composition/node_modules). Locally set PLAYWRIGHT_CHROMIUM_EXECUTABLE to reuse a browser.
// Review artifacts (a screenshot of each stage) go to microscope-flow-artifacts/.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {createServer,guardContext,axeScan,launchOptions,root}=require('./microscope_guided_test_support.cjs');
const PAGE='/tools/science/microscope-guided.html';
const OUT=path.join(root,'microscope-flow-artifacts');
const LAB='microscope-guided';
const SEQUENCE=['lab_start','trial_recorded','trial_recorded','compare_complete','trial_recorded','trial_recorded','compare_complete','notebook_complete','challenge_complete','challenge_complete','challenge_complete','lab_complete'];
const KEY='bhcs-microscope-guided:v1';
// wording that may only appear on the concept screen (options on the compare cards are the learner's choices, not statements)
const FORBIDDEN=['相反','顛倒','倒立','視野縮小','倍率越高','高倍視野較小'];
const COMPARE_OPTION_TEXT=['往相反方向移動'];

const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const near=(a,b,tol,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg}: expected ${b} ±${tol}, got ${a}`);
const $=(p,sel)=>p.locator(sel);
const text=async(p,sel)=>(await $(p,sel).innerText()).trim();
const main=p=>p.evaluate(()=>{const m=document.getElementById('main').dataset;return {phase:m.phase,screen:m.screen}});
const active=p=>p.evaluate(()=>{const a=document.activeElement;return a?{tag:a.tagName,id:a.id,role:a.dataset.role||null,option:a.dataset.option||null,level:a.dataset.level||null,compare:a.dataset.compare!==undefined,mgMove:a.dataset.mgMove||null}:null});
const ctaState=p=>p.evaluate(()=>{const b=document.getElementById('mg-cta');return b.hidden?null:{label:b.textContent,enabled:!b.disabled}});
const coach=p=>p.evaluate(()=>({main:document.getElementById('mg-coach-main').textContent,sub:document.getElementById('mg-coach-sub').textContent,tip:document.getElementById('mg-coach-tip').hidden?'':document.getElementById('mg-coach-tip').textContent}));
const status=p=>p.evaluate(()=>{const s=document.getElementById('mg-status');return s.hidden?null:{kind:s.dataset.kind,text:s.querySelector('[data-mg-status-text]').textContent}});
const said=async p=>{await p.waitForTimeout(120);return p.evaluate(()=>{const a=document.getElementById('mg-announcer');return {id:a.dataset.id||null,text:a.textContent,writes:Number(a.dataset.writes||0)}})};
const events=p=>p.evaluate(()=>window.__testScienceEvents.map(e=>[...e]));
// Every word a learner could read or hear on the page right now: what is drawn, the labels, the title. Content that is hidden is not read.
const allText=p=>p.evaluate(()=>{const out=[document.title,document.body.innerText];
 for(const e of document.querySelectorAll('[aria-label],[title],[alt]'))if(!e.closest('[hidden]')&&getComputedStyle(e).display!=='none')out.push(e.getAttribute('aria-label'),e.getAttribute('title'),e.getAttribute('alt'));
 return out.filter(Boolean).join('\n')});
const overflow=p=>p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
const live=p=>p.evaluate(()=>({attr:[...document.querySelectorAll('[aria-live]')].map(e=>e.id),roles:document.querySelectorAll('[role=status],[role=alert],[role=log],output').length,
 inside:['mg-coach','mg-status','mg-data','mg-evidence','mg-compare','mg-concept','mg-notebook','mg-challenge','mg-complete'].filter(id=>document.getElementById(id).closest('[aria-live]'))}));
const marker=(p,id)=>p.evaluate(id=>{
 const eye=document.querySelector('.mg-eyepiece'),r=eye.getBoundingClientRect(),k=r.width/600,g=eye.querySelector(`[data-role="clipped-layer"] > [data-feature="${id}"]`);
 if(!g)return null;const m=g.getScreenCTM(),t=g.getAttribute('transform')||'';
 return {x:(m.e-r.left)/k,y:(m.f-r.top)/k,shown:getComputedStyle(g).display!=='none',visible:g.getAttribute('data-visible'),scale:Number((/scale\(([-\d.]+)\)/.exec(t)||[])[1])};
},id);
const ringR=p=>p.evaluate(()=>{const ov=document.querySelector('.mg-overview'),k=ov.getBoundingClientRect().width/340;return document.querySelector('[data-role="fov-ring"]').getBoundingClientRect().width/2/k});
const slideLeft=p=>p.evaluate(()=>document.querySelector('.mg-slide-glass').getBoundingClientRect().left);
const dist=m=>Math.hypot(m.x-300,m.y-300);
const stored=p=>p.evaluate(k=>{const t=localStorage.getItem(k);return t===null?null:JSON.parse(t)},KEY);
const evidenceRows=(p,id)=>p.evaluate(id=>{const it=document.querySelector(`[data-evidence-item="${id}"]`);return it?[...it.querySelectorAll('dd')].map(d=>d.textContent):null},id);
const evidenceIds=p=>p.evaluate(()=>[...document.querySelectorAll('[data-evidence-item]')].map(e=>e.dataset.evidenceItem));
const dataValues=p=>p.evaluate(()=>[...document.querySelectorAll('#mg-data dd')].map(d=>d.textContent.replace(/（剛換）/,'')));
const press=async(p,key,n=1)=>{for(let i=0;i<n;i++)await p.keyboard.press(key);await settle(p)};
const clickName=async(p,name)=>{await p.getByRole('button',{name,exact:true}).click();await settle(p)};
const shot=async(p,name,tag)=>{fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,`${tag}-${name}.png`),fullPage:true})};
const stageBox=async p=>{const s=$(p,'[data-role="stage-surface"]');await s.scrollIntoViewIfNeeded();return s.boundingBox()};

async function touchDrag(page,from,to,steps=8){
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from.x,y:from.y}]});
 for(let i=1;i<=steps;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await settle(page);
}
const noFormal=async(p,label,allowOptions=false)=>{
 let t=await allText(p);if(allowOptions)for(const o of COMPARE_OPTION_TEXT)t=t.split(o).join('');
 for(const w of FORBIDDEN)assert.ok(!t.includes(w),`${label}: "${w}" is visible before the concept`);
};
const lines=s=>s.split('\n').map(x=>x.trim()).filter(Boolean);

let base;
async function open(browser,{width,height,touch=false,adapter='spy',init=null}){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
 if(init)await ctx.addInitScript(init.fn,init.arg);
 const external=[];await guardContext(ctx,base,{hook:false,external,adapter});        // no test hook: the walk uses the page the learner has; the site adapter is a spy
 const page=await ctx.newPage(),errors=[],dialogs=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('dialog',d=>{dialogs.push(d.message());d.dismiss()});
 await page.goto(base+PAGE);await page.waitForSelector('#main[data-phase]');
 return {ctx,page,errors,external,dialogs};
}
const clean=({errors,external,dialogs})=>{assert.deepEqual(errors,[],'no console or page errors');assert.deepEqual(external,[],'no external requests');assert.deepEqual(dialogs,[],'no dialogs')};

// ===================================================================================================================
// the main walk
// ===================================================================================================================
async function walk(browser,{width,height,touch,matrix}){
 const tag=String(width),desktop=!touch;
 const env=await open(browser,{width,height,touch});const {page:p}=env;
 const all=[];                                  // analytics calls, collected across reloads
 const harvest=async()=>{all.push(...await events(p))};
 const reload=async(label)=>{await harvest();await p.reload();await p.waitForSelector('#main[data-phase]');await settle(p);
  assert.deepEqual(await events(p),[],`${label}: restoring sends no usage event`);
  const s=await said(p);assert.equal(s.id,null,`${label}: restoring announces nothing`);assert.equal(s.text,'');};
 const axe=async label=>{await axeScan(p,`${tag} ${label}`)};
 const checkLayout=async label=>{assert.equal(await overflow(p),0,`${tag} ${label}: no horizontal overflow`);const l=await live(p);assert.deepEqual(l.attr,['mg-announcer'],`${tag} ${label}: one live region`);assert.equal(l.roles,0);assert.deepEqual(l.inside,[]);};
 let n;

 // ---- welcome / mission -------------------------------------------------------------------------------------------------
 assert.deepEqual(await main(p),{phase:'welcome',screen:'welcome'});
 assert.equal(await text(p,'#mg-welcome-title'),'為什麼我明明把玻片往右推，視野裡的東西卻跑到別的方向？');
 assert.deepEqual(await ctaState(p),{label:'開始',enabled:true});
 await noFormal(p,'welcome');await checkLayout('welcome');await shot(p,'welcome',tag);await axe('welcome');
 await clickName(p,'開始');
 assert.equal(await text(p,'#mg-welcome-title'),'先別猜答案。把玻片上的目標移回中央，看看它真的怎麼動。');
 assert.deepEqual((await active(p)).id,'mg-cta','the main button keeps focus while it only changes its words');
 await clickName(p,'開始實驗');
 assert.equal((await main(p)).phase,'trial1-horizontal');
 assert.equal((await active(p)).role,'stage-surface','focus lands on the stage');

 // ---- Trial 1 horizontal --------------------------------------------------------------------------------------------------
 assert.equal((await coach(p)).main,'把 e 移到視野中央。');
 let e=await marker(p,'e');near(e.x,420,0.2,`${tag} e starts on the right`);near(e.y,300,0.2,'and level with the centre');
 assert.equal((await status(p)).text,'e 在視野右側');
 near(await ringR(p),75,0.8,`${tag} 4× ring`);
 await noFormal(p,'trial 1 start');await checkLayout('trial 1');await shot(p,'trial1',tag);await axe('trial 1');
 const left0=await slideLeft(p);
 // the wrong way first: the slide goes left, so the e goes further to the right and the overview slide moves left
 const move=async(dir,times)=>{ // direction buttons on a phone (taps), the keyboard on a desktop
  if(desktop)await press(p,`Arrow${dir}`,times);
  else{for(let i=0;i<times;i++)await p.getByRole('button',{name:`玻片向${{Left:'左',Right:'右',Up:'上',Down:'下'}[dir]}`,exact:true}).tap();await settle(p)}};
 await move('Left',1);
 let e1=await marker(p,'e');assert.ok(e1.x>e.x+50,`${tag}: slide left -> the e moves further right`);near(e1.x-e.x,54,0.5,'one key press is 54 units');
 assert.ok(dist(e1)>dist(e),'further from the centre');assert.match((await status(p)).text,/^e 離中央更遠了/);
 assert.ok(await slideLeft(p)<left0,'the overview slide moved left with the stage');
 assert.equal((await said(p)).id,null,'ordinary moves are silent');
 assert.equal((await coach(p)).tip,'','one step away is not yet a nudge');
 await move('Left',1);
 assert.equal((await coach(p)).tip,'剛才移動玻片後，e 往哪裡跑了？','the first nudge is a question');
 await move('Left',2);                                                               // out of the field (a marker that only overlaps the rim still counts as in view)
 assert.equal((await marker(p,'e')).visible,'false');assert.equal((await status(p)).text,'e 離開視野了');
 assert.equal((await said(p)).text,'e 離開視野了','leaving the field is announced once');
 const w1=await said(p);
 await move('Right',1);
 assert.equal((await marker(p,'e')).visible,'true');assert.equal((await said(p)).text,'e 回到視野了','and so is coming back');
 assert.notEqual((await said(p)).id,w1.id);
 assert.match((await coach(p)).tip,/^你剛才把玻片往右移，e 現在在視野右側。再試試別的移動方向/,'the second nudge quotes the learner\'s own last move, without the pattern');
 await noFormal(p,'trial 1 after wrong moves');
 const dataBefore=await dataValues(p);
 n=0;while((await main(p)).phase==='trial1-horizontal'&&n++<12)await move('Right',1);
 assert.equal((await main(p)).phase,'trial1-horizontal-complete',`${tag}: the e reaches the centre`);
 assert.ok(dist(await marker(p,'e'))<=40+0.5);
 assert.equal((await said(p)).text,'e 已到視野中央');
 assert.equal((await active(p)).id,'mg-cta','the stage locks and focus moves to the record button');
 assert.deepEqual(await ctaState(p),{label:'記錄橫向結果',enabled:true});
 assert.equal(await $(p,'[data-role="stage-surface"]').getAttribute('data-locked'),'true');
 const frozen=await marker(p,'e');await press(p,'ArrowRight',2);assert.deepEqual(await marker(p,'e'),frozen,'a locked stage does not move');
 const hDataLabels=await dataValues(p);
 await clickName(p,'記錄橫向結果');
 assert.equal((await main(p)).phase,'trial1-vertical');assert.equal((await said(p)).text,'已記錄橫向結果');
 assert.equal((await active(p)).role,'stage-surface','focus goes to the next trial\'s stage');
 const h=await evidenceRows(p,'horizontal');
 assert.ok(h&&h.length===2);const hm=/^向(右|左) (\d+\.\d) mm$/.exec(h[0]),hi=/^向(右|左) (\d+) px$/.exec(h[1]);
 assert.ok(hm&&hi,`horizontal evidence reads as numbers: ${h}`);
 assert.equal(hm[1],'右','the slide really went right');assert.equal(hi[1],'左','and the e went left');
 near(Number(hi[2]),Number(hm[2])*120,7,'px and mm agree (4×: 1 mm = 120 px)');
 assert.ok(hDataLabels.some(v=>v.includes(hm[2])),'the evidence is the number the DataCard showed just before recording');
 await noFormal(p,'trial 1 vertical start');
 if(matrix){assert.deepEqual(await stored(p).then(s=>s&&Object.keys(s.records.horizontal).sort()),['objective','stageEnd','stageStart','trial']);}
 if(matrix){await reload('checkpoint A (after the horizontal record)');
  assert.equal((await main(p)).phase,'trial1-vertical');assert.deepEqual(await evidenceIds(p),['horizontal']);
  assert.equal(await text(p,'#mg-storage-note'),'已接續你上次做到的地方。進度只儲存在這台瀏覽器。');assert.equal(await $(p,'#mg-restart').isVisible(),true);}

 // ---- Trial 1 vertical ----------------------------------------------------------------------------------------------------
 e=await marker(p,'e');near(e.x,300,0.2,`${tag} vertical e is level with the centre`);near(e.y,180,0.2,'and above it');
 assert.equal((await coach(p)).main,'這次 e 跑到視野上方了。把它也移到中央。');assert.equal((await status(p)).text,'e 在視野上方');
 const box=await stageBox(p),k=box.width/340,cx=box.x+box.width/2,cy=box.y+box.height/2;
 if(desktop){
  await p.mouse.move(cx,cy);await p.mouse.down();
  await p.mouse.move(cx,cy+22*k,{steps:5});                                           // the slide goes down: the e goes further up
  const up=await marker(p,'e');assert.ok(up.y<e.y-20,'slide down -> the e goes up');assert.ok(dist(up)>dist(e));
  await p.mouse.move(cx,cy-34*k,{steps:12});await p.mouse.up();await settle(p);      // the slide goes up: the e comes down
 }else{
  await touchDrag(p,{x:cx,y:cy},{x:cx,y:cy+22*k});
  const up=await marker(p,'e');assert.ok(up.y<e.y-20,'slide down -> the e goes up');
  const b2=await stageBox(p);await touchDrag(p,{x:b2.x+b2.width/2,y:b2.y+b2.height/2},{x:b2.x+b2.width/2,y:b2.y+b2.height/2-56*k});
 }
 if((await main(p)).phase==='trial1-vertical'){await move('Up',2)}                      // top up with the keys if the drag stopped just short
 assert.equal((await main(p)).phase,'trial1-vertical-complete');assert.equal((await active(p)).id,'mg-cta');
 assert.ok(dist(await marker(p,'e'))<=40+0.5);
 await clickName(p,'記錄縱向結果');
 const v=await evidenceRows(p,'vertical');const vm=/^向(上|下) (\d+\.\d) mm$/.exec(v[0]),vi=/^向(上|下) (\d+) px$/.exec(v[1]);
 assert.ok(vm&&vi,`vertical evidence reads as numbers: ${v}`);assert.equal(vm[1],'上');assert.equal(vi[1],'下');near(Number(vi[2]),Number(vm[2])*120,7,'vertical px and mm agree');
 assert.deepEqual(await evidenceIds(p),['horizontal','vertical']);

 // ---- Compare 1 -----------------------------------------------------------------------------------------------------------
 assert.deepEqual(await main(p),{phase:'compare-direction',screen:'compare'});
 assert.equal((await active(p)).id,'mg-compare-title','focus goes to the compare heading');
 const rows=await $(p,'#mg-compare .sg-compare-table tbody tr').allInnerTexts();
 assert.ok(rows.join('|').includes(hm[2])&&rows.join('|').includes(vm[2]),'the table holds this learner\'s own two records');
 assert.deepEqual(await $(p,'#mg-compare input[data-compare]').evaluateAll(a=>a.map(x=>x.value)),['opposite','same','unrelated']);
 assert.equal((await ctaState(p)).enabled,false);
 await $(p,'#mg-compare input[value="same"]').check();await settle(p);
 const fbw=await text(p,'#mg-compare .sg-feedback:not([hidden])');assert.match(fbw,/再對照一次表格/);assert.ok(!fbw.includes('相反'),'a wrong answer never reveals the right one');
 assert.equal((await ctaState(p)).enabled,false);assert.match((await said(p)).text,/再對照一次表格/);
 await noFormal(p,'compare 1 (wrong answer)',true);await checkLayout('compare 1');await shot(p,'compare1',tag);await axe('compare 1');
 await $(p,'#mg-compare input[value="opposite"]').check();await settle(p);
 assert.equal((await ctaState(p)).enabled,true);assert.match((await said(p)).text,/這一題答對了，兩題都完成了/);
 if(matrix){await reload('checkpoint B (compare 1 answered)');
  assert.equal((await main(p)).phase,'compare-direction');assert.equal(await $(p,'#mg-compare input[value="opposite"]').isChecked(),true);assert.equal((await ctaState(p)).enabled,true);}
 await clickName(p,'繼續倍率實驗');
 assert.equal((await main(p)).phase,'trial2-low');assert.equal((await active(p)).role,'stage-surface');

 // ---- Trial 2 low ---------------------------------------------------------------------------------------------------------
 for(const id of ['A','B','C'])assert.equal((await marker(p,id)).visible,'true',`${tag}: 4× ${id} visible`);
 assert.ok(dist(await marker(p,'B'))>100,'B starts off-centre');assert.match((await status(p)).text,/B 還沒在視野中央/);
 near(await ringR(p),75,0.8,`${tag} 4× ring in trial 2`);near((await marker(p,'B')).scale,20,0.01,'B is 20 units at 4×');
 assert.deepEqual((await dataValues(p)).slice(0,2),['4×','4.5 mm']);
 await noFormal(p,'trial 2 low');
 n=0;while((await main(p)).phase==='trial2-low'&&n++<8)await move('Left',1);
 assert.equal((await main(p)).phase,'trial2-low-complete');assert.ok(dist(await marker(p,'B'))<=20+0.5);
 assert.equal((await active(p)).id,'mg-cta');assert.equal((await ctaState(p)).label,'記錄低倍結果');
 await clickName(p,'記錄低倍結果');
 assert.deepEqual(await evidenceRows(p,'low'),['4×','4.5 mm','3 個：A、B、C'],'the low record is read from the page');
 if(matrix){await reload('checkpoint C (after the low record)');assert.equal((await main(p)).phase,'trial2-high');assert.deepEqual(await evidenceIds(p),['horizontal','vertical','low']);}

 // ---- Trial 2 high --------------------------------------------------------------------------------------------------------
 assert.equal((await main(p)).phase,'trial2-high');assert.equal(await $(p,'#mg-objectives').isVisible(),true);
 assert.equal(await p.getByRole('button',{name:'4× 物鏡'}).getAttribute('aria-pressed'),'true');
 if(desktop){                                                                          // a negative path: lose B at 40×, then recover
  await $(p,'[data-role="stage-surface"]').focus();await press(p,'ArrowLeft',3);
  await clickName(p,'40× 物鏡');
  assert.equal((await main(p)).phase,'trial2-high','B is out of the field at 40×, so the trial does not complete');
  assert.equal((await coach(p)).main,'現在看不到 B 了。');assert.equal((await ctaState(p)).enabled,false);
  assert.equal((await marker(p,'B')).visible,'false');assert.equal((await said(p)).text,'B 離開視野了');
  await noFormal(p,'trial 2 high (B lost)');
  await clickName(p,'4× 物鏡');assert.equal(await p.getByRole('button',{name:'4× 物鏡'}).getAttribute('aria-pressed'),'true');
  await $(p,'[data-role="stage-surface"]').focus();await press(p,'ArrowRight',3);
  assert.equal((await marker(p,'B')).visible,'true');assert.equal((await main(p)).phase,'trial2-high');
 }
 near((await marker(p,'B')).scale,20,0.01,'B before the switch');
 await clickName(p,'40× 物鏡');
 assert.equal((await main(p)).phase,'trial2-high-complete',`${tag}: B stays in the field at 40×`);
 const B=await marker(p,'B'),A=await marker(p,'A'),Cm=await marker(p,'C');
 assert.equal(B.visible,'true');assert.equal(A.shown,false,'A is not drawn at 40×');assert.equal(Cm.shown,false);
 near(B.scale,200,0.05,'B is ten times larger');near(await ringR(p),7.5,0.4,`${tag} 40× ring`);
 assert.equal((await coach(p)).main,'剛才還看得到的 A、C 呢？');assert.equal((await status(p)).text,'目前看得到 B；A、C 已不在視野中');
 await noFormal(p,'trial 2 high');await shot(p,'high',tag);await axe('trial 2 high');await checkLayout('trial 2 high');
 assert.equal((await active(p)).id,'mg-cta');assert.equal((await said(p)).text,'40× 下看得到 B');
 await clickName(p,'記錄高倍結果');
 assert.equal((await main(p)).phase,'compare-magnification');assert.equal((await active(p)).id,'mg-compare-title');
 assert.deepEqual(await evidenceRows(p,'high'),['40×','0.45 mm','1 個：B']);

 // ---- Compare 2 -----------------------------------------------------------------------------------------------------------
 const t2=(await $(p,'#mg-compare .sg-compare-table tbody tr').allInnerTexts()).join('|').replace(/\s+/g,' ');
 for(const part of ['4.5 mm','0.45 mm','3 個（A、B、C）','1 個（B）','10 倍'])assert.ok(t2.includes(part),`the table shows ${part}`);
 assert.deepEqual(await $(p,'#mg-compare fieldset[data-question]').evaluateAll(a=>a.map(x=>x.dataset.question)),['field','count']);
 await $(p,'#mg-compare fieldset[data-question="field"] input[value="larger"]').check();await settle(p);
 assert.match(await text(p,'#mg-compare fieldset[data-question="field"] .sg-feedback:not([hidden])'),/視野直徑/);assert.equal((await ctaState(p)).enabled,false);
 await $(p,'#mg-compare fieldset[data-question="field"] input[value="smaller"]').check();await settle(p);
 assert.equal((await ctaState(p)).enabled,false,'one question of two is not enough');
 await $(p,'#mg-compare fieldset[data-question="count"] input[value="fewer"]').check();await settle(p);
 assert.equal((await ctaState(p)).enabled,true);assert.equal((await ctaState(p)).label,'看看這代表什麼');
 await noFormal(p,'compare 2',true);await checkLayout('compare 2');await shot(p,'compare2',tag);await axe('compare 2');
 if(matrix){await reload('checkpoint D (after the high record and compare 2)');
  assert.equal((await main(p)).phase,'compare-magnification');assert.equal(await $(p,'#mg-compare fieldset[data-question="count"] input[value="fewer"]').isChecked(),true);assert.equal((await ctaState(p)).enabled,true);}
 await clickName(p,'看看這代表什麼');

 // ---- Concept -------------------------------------------------------------------------------------------------------------
 assert.equal((await main(p)).phase,'concept');assert.equal((await active(p)).id,'mg-concept-title');assert.equal((await said(p)).text,'概念整理');
 const concept=await allText(p);
 for(const w of ['影像方向','顛倒','180°','相反方向','倍率與視野','變小','FN = 18 mm','模擬設定','4× → 4.5 mm','10× → 1.8 mm','40× → 0.45 mm'])assert.ok(concept.includes(w),`the concept shows ${w}`);
 const cev=(await $(p,'#mg-concept .sg-concept-evidence li').allInnerTexts()).join('|');
 assert.ok(cev.includes(`玻片向右 ${hm[2]} mm`)&&cev.includes(`e 向左 ${hi[2]} px`),'the concept quotes this learner\'s horizontal numbers');
 assert.ok(cev.includes(`玻片向上 ${vm[2]} mm`)&&cev.includes(`e 向下 ${vi[2]} px`),'and the vertical ones');
 assert.ok(cev.includes('看到 3 個記號，視野直徑 4.5 mm')&&cev.includes('看到 1 個記號，視野直徑 0.45 mm'));
 await checkLayout('concept');await shot(p,'concept',tag);await axe('concept');
 assert.deepEqual(await ctaState(p),{label:'整理我的研究手冊',enabled:true});
 await clickName(p,'整理我的研究手冊');

 // ---- Notebook ------------------------------------------------------------------------------------------------------------
 assert.equal((await main(p)).phase,'notebook');assert.equal((await active(p)).id,'mg-notebook-title');
 assert.equal(await $(p,'input[data-level][value="A"]').isChecked(),true,'level A is open by default');
 assert.equal((await said(p)).text,'研究手冊');
 const given=lines(await $(p,'[data-panel="A"] .sg-given').innerText());
 assert.deepEqual(given,[`橫向實驗中，我把玻片向右 ${hm[2]} mm，視野中的 e 向左 ${hi[2]} px。`,'4× 時看到 3 個記號；40× 時看到 1 個記號。']);
 assert.equal(await text(p,'[data-stem="relationDirection"] legend'),'我把玻片往右移時，視野中的影像往……');
 assert.ok((await $(p,'#mg-notebook .sg-compare-table tbody').innerText()).includes(hm[2]),'the evidence table sits in the notebook');
 assert.equal((await ctaState(p)).enabled,false);
 await $(p,'[data-stem="relationDirection"] input[value="right"]').check();await $(p,'[data-stem="relationRange"] input[value="smaller"]').check();await settle(p);
 assert.equal(await text(p,'[data-nudge]'),'再對照一下你的實驗紀錄。');assert.equal((await ctaState(p)).enabled,false);assert.equal((await said(p)).text,'再對照一下你的實驗紀錄。');
 await $(p,'[data-stem="relationDirection"] input[value="left"]').check();await settle(p);
 assert.equal(await text(p,'[data-ready]'),'你的研究手冊已經整理好了。');assert.equal((await ctaState(p)).enabled,true);assert.match((await said(p)).text,/整理好了/);
 await checkLayout('notebook A');await shot(p,'notebook',tag);await axe('notebook');

 // level B: typing, debounce and the flush paths
 await $(p,'input[data-level][value="B"]').check();await settle(p);
 assert.equal((await ctaState(p)).enabled,false,'level B is not ready until something is written');
 const TEXT_B='我移動玻片時，影像往另一邊；高倍看到的範圍比較小。';
 const ta=$(p,'#mg-nb-free');
 await ta.focus();await ta.fill(TEXT_B);
 await p.waitForTimeout(450);assert.equal((await stored(p)).conclusion.freeText,TEXT_B,'the draft is saved after the debounce');
 assert.equal(await ta.inputValue(),TEXT_B,'and typing is never overwritten while the textarea is focused');assert.equal((await active(p)).tag,'TEXTAREA');
 assert.equal((await ctaState(p)).enabled,true);assert.equal((await said(p)).id!==null,true);
 await ta.fill(TEXT_B+'再加一句');await ta.blur();assert.equal((await stored(p)).conclusion.freeText,TEXT_B+'再加一句','blur flushes at once');
 await ta.fill(TEXT_B+'再加兩句');await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal((await stored(p)).conclusion.freeText,TEXT_B+'再加兩句','a page that becomes hidden flushes');
 await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=>'visible',configurable:true})});
 await ta.fill(TEXT_B+'再加三句');await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 assert.equal((await stored(p)).conclusion.freeText,TEXT_B+'再加三句','pagehide flushes');
 await ta.fill(TEXT_B);await ta.blur();await p.waitForTimeout(50);
 if(matrix){await reload('checkpoint E (notebook text)');
  assert.equal((await main(p)).phase,'notebook');assert.equal(await $(p,'input[data-level][value="B"]').isChecked(),true);assert.equal(await $(p,'#mg-nb-free').inputValue(),TEXT_B);assert.equal((await ctaState(p)).enabled,true);}
 // level C through the page: ideas stay hidden until a limitation is written
 await $(p,'input[data-level][value="C"]').check();await settle(p);
 assert.equal(await $(p,'[data-ideas]').isVisible(),false);assert.equal((await ctaState(p)).enabled,false);
 await $(p,'#mg-nb-evidence').fill('我的玻片記錄和高倍記錄');await $(p,'#mg-nb-limit').focus();
 assert.equal(await $(p,'[data-ideas]').isVisible(),false,'no ideas before a limitation is written');
 await $(p,'#mg-nb-limit').fill('只做了兩次');await p.waitForTimeout(450);
 assert.equal(await $(p,'[data-ideas]').isVisible(),true,'ideas appear once a limitation is written');
 assert.equal(await $(p,'#mg-nb-limit').inputValue(),'只做了兩次');assert.equal((await active(p)).id,'mg-nb-limit','typing keeps the focus');
 assert.equal((await ctaState(p)).enabled,true);
 const tw=await $(p,'#mg-nb-evidence').evaluate(e=>({w:e.getBoundingClientRect().width,card:e.closest('.mg-card').getBoundingClientRect().width,h:e.getBoundingClientRect().height}));
 assert.ok(tw.w>=tw.card*0.7&&tw.h>=60,`${tag}: notebook textareas are not tiny (${tw.w} of ${tw.card}, ${tw.h} high)`);
 await checkLayout('notebook C');await axe('notebook C');await shot(p,'notebook-C',tag);
 // back to B, then press the main button before the debounce has run and without a blur
 await $(p,'input[data-level][value="B"]').check();await settle(p);
 await p.evaluate(t=>{const ta=document.getElementById('mg-nb-free');ta.value=t;ta.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('mg-cta').click()},TEXT_B+'（按鈕前沒有失焦）');
 await settle(p);
 assert.equal((await main(p)).phase,'challenge-1','the main button flushed the text first, then judged the notebook');
 assert.equal((await stored(p)).conclusion.freeText,TEXT_B+'（按鈕前沒有失焦）');

 // ---- Challenge 1 ---------------------------------------------------------------------------------------------------------
 assert.equal((await active(p)).id,'mg-challenge-title');assert.equal((await said(p)).text,'挑戰 1');
 assert.equal(await text(p,'#mg-challenge-title'),'挑戰 1／3：把左上角的目標帶回中央');
 assert.equal(await $(p,'#mg-challenge input[type="radio"]').count(),0,'no radios: every option is a real button');
 const stepEl=await $(p,'[data-challenge-step="c1-direction"]').elementHandle();
 await p.evaluate(el=>{el.__mark='kept'},stepEl);
 const attempts=()=>$(p,'[data-challenge-step="c1-direction"]').getAttribute('data-attempts');
 await $(p,'button[data-option="right-up"]').focus();await p.keyboard.press('Tab');await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowRight');await $(p,'button[data-option="left-down"]').hover();
 assert.equal(await attempts(),'0','focus, Tab, arrows and hover are never an attempt');
 await $(p,'button[data-option="right-up"]').click();await settle(p);
 assert.equal(await attempts(),'1');assert.equal(await text(p,'[data-step-feedback="c1-direction"]'),'先想想你在方向實驗中，玻片和影像各往哪邊移。');
 assert.equal(await $(p,'[data-challenge-step="c1-direction"]').evaluate(el=>el.__mark),'kept','the step node is not rebuilt');
 assert.equal((await active(p)).option,'right-up','focus stays on the button that was pressed');
 await $(p,'button[data-option="right-down"]').focus();await p.keyboard.press('Enter');await settle(p);
 assert.equal(await attempts(),'2','Enter is one activation');assert.match(await text(p,'[data-step-feedback="c1-direction"]'),/橫向和縱向紀錄/);
 assert.ok(!(await text(p,'[data-step-feedback="c1-direction"]')).includes('往左上'),'the hint never names the right button');
 assert.equal((await ctaState(p)).enabled,false);
 await shot(p,'challenge1',tag);await axe('challenge 1');await checkLayout('challenge 1');
 await $(p,'button[data-option="left-up"]').focus();await p.keyboard.press('Space');await settle(p);
 assert.equal(await attempts(),'3','Space is one activation');
 assert.equal(await $(p,'[data-challenge-step="c1-direction"]').getAttribute('data-solved'),'true');
 assert.equal(await $(p,'button[data-option]').evaluateAll(b=>b.every(x=>x.disabled)),true,'a solved step takes no more tries');
 assert.equal(await $(p,'button[data-option="left-up"]').getAttribute('aria-pressed'),'true');
 assert.equal((await ctaState(p)).enabled,true);assert.match((await said(p)).text,/玻片往左上移/);
 assert.equal((await active(p)).id,'mg-cta','focus left the button that became disabled');
 await clickName(p,'下一個挑戰');

 // ---- Challenge 2 ---------------------------------------------------------------------------------------------------------
 assert.equal((await active(p)).id,'mg-challenge-title');assert.equal(await text(p,'#mg-challenge-title'),'挑戰 2／3：高倍下少了誰？');
 assert.equal(await $(p,'[data-challenge-step="c2-claim"]').count(),0,'step 2 does not exist before step 1 is solved');
 const s1=await $(p,'[data-challenge-step="c2-view"]').elementHandle();await p.evaluate(el=>{el.__mark='kept'},s1);
 await $(p,'button[data-option="all-larger"]').click();await settle(p);
 assert.equal(await $(p,'[data-challenge-step="c2-claim"]').count(),0);
 await $(p,'button[data-option="only-b-larger"]').click();await settle(p);
 assert.equal(await $(p,'[data-challenge-step="c2-claim"]').count(),1,'step 2 appears once step 1 is solved');
 assert.equal(await $(p,'[data-challenge-step="c2-view"]').evaluate(el=>el.__mark),'kept','step 1 is not rebuilt when step 2 opens');
 assert.equal((await ctaState(p)).enabled,false);
 if(matrix){await reload('checkpoint F (challenge 2 half done)');
  assert.equal((await main(p)).phase,'challenge-2');assert.equal(await $(p,'[data-challenge-step="c2-view"]').getAttribute('data-solved'),'true');assert.equal(await $(p,'[data-challenge-step="c2-claim"]').count(),1);assert.equal((await ctaState(p)).enabled,false);}
 await $(p,'button[data-option="brighter"]').click();await settle(p);
 assert.equal(await $(p,'[data-challenge-step="c2-claim"]').getAttribute('data-attempts'),'1');
 await $(p,'button[data-option="smaller-field"]').click();await settle(p);
 assert.equal((await ctaState(p)).enabled,true);await shot(p,'challenge2',tag);
 await clickName(p,'下一個挑戰');

 // ---- Challenge 3 ---------------------------------------------------------------------------------------------------------
 assert.equal((await active(p)).id,'mg-challenge-title');assert.equal(await text(p,'#mg-challenge-title'),'挑戰 3／3：高倍找不到目標怎麼辦？');
 assert.equal(await $(p,'#mg-bench-card').isVisible(),false,'there is no bench in the last challenge');
 assert.equal(await $(p,'[data-role="stage-surface"]').isVisible(),false);assert.equal(await $(p,'[data-mg-objective]').first().isVisible(),false);assert.equal(await $(p,'[data-mg-move]').first().isVisible(),false);
 assert.equal(await $(p,'#mg-challenge input[type="radio"]').count(),0);
 assert.equal(await $(p,'.sg-challenge-note').isVisible(),false,'no note before the step is solved');
 await $(p,'button[data-option="higher-mag"]').click();await settle(p);
 assert.equal(await $(p,'[data-challenge-step="c3-strategy"]').getAttribute('data-attempts'),'1');
 await $(p,'button[data-option="low-recentre"]').click();await settle(p);
 assert.equal(await $(p,'.sg-challenge-note').isVisible(),true,'the optional note opens after the answer');
 assert.equal((await ctaState(p)).enabled,true,'a blank note does not block the finish');assert.equal((await ctaState(p)).label,'看看我完成了什麼');
 const NOTE='因為低倍範圍大，比較容易找到目標';
 const note=$(p,'#mg-ch-note-input');
 await note.focus();await note.fill(NOTE);await p.waitForTimeout(450);
 assert.equal((await stored(p)).challenges[3].note,NOTE,'the note is saved after the debounce');assert.equal(await note.inputValue(),NOTE);assert.equal((await active(p)).id,'mg-ch-note-input');
 await note.fill(NOTE+'！');await note.blur();assert.equal((await stored(p)).challenges[3].note,NOTE+'！','blur flushes the note');
 const nw=await note.evaluate(e=>({w:e.getBoundingClientRect().width,card:e.closest('.mg-card').getBoundingClientRect().width}));
 assert.ok(nw.w>=nw.card*0.7,`${tag}: the note textarea is full width (${nw.w} of ${nw.card})`);
 await shot(p,'challenge3',tag);await axe('challenge 3');await checkLayout('challenge 3');
 if(matrix){await reload('checkpoint G (challenge 3 note)');
  assert.equal((await main(p)).phase,'challenge-3');assert.equal(await $(p,'#mg-ch-note-input').inputValue(),NOTE+'！');assert.equal((await ctaState(p)).enabled,true);}
 // press the main button with the note still unsaved (typing in the note, then a click that does not move focus)
 await $(p,'#mg-ch-note-input').focus();
 await p.evaluate(t=>{const n=document.getElementById('mg-ch-note-input');n.value=t;n.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('mg-cta').click()},NOTE+'（按鈕前沒有失焦）');
 await settle(p);
 assert.equal((await main(p)).phase,'complete');assert.equal((await stored(p)).challenges[3].note,NOTE+'（按鈕前沒有失焦）','the main button flushed the note first');

 // ---- Completion ----------------------------------------------------------------------------------------------------------
 assert.equal((await active(p)).id,'mg-complete-title');assert.equal(await text(p,'#mg-complete-title'),'這一站完成了');
 assert.equal(await $(p,'.sg-claim').count(),3);
 assert.ok((await $(p,'.sg-complete-conclusion').allInnerTexts()).join('').includes(TEXT_B),'the learner\'s own conclusion is shown');
 assert.equal(await $(p,'.sg-link').getAttribute('href'),'../microscope-lab.html');
 const done=await said(p);assert.deepEqual([done.text],['這一站完成了。']);assert.ok(done.id.startsWith('complete-'));
 const again=await said(p);assert.equal(again.writes,done.writes,'the finish is announced once');
 assert.equal(await ctaState(p),null);
 await checkLayout('complete');await shot(p,'complete',tag);await axe('complete');
 if(matrix){await reload('checkpoint H (the finish)');
  assert.equal((await main(p)).phase,'complete');assert.equal(await $(p,'.sg-claim').count(),3);assert.equal(await text(p,'#mg-storage-note'),'已接續你上次做到的地方。進度只儲存在這台瀏覽器。');}

 if(!desktop){ // phone layout, measured at the stages that matter
  assert.equal(await $(p,'.sg-claim').first().evaluate(e=>e.getBoundingClientRect().width>=e.closest('.mg-card').getBoundingClientRect().width*0.8),true,'completion claims are readable');
 }
 await harvest();
 assert.deepEqual(all.map(e=>e[0]),SEQUENCE,`${tag}: the usage events, in order`);
 for(const call of all){assert.equal(call.length,2,'(action, labId) and nothing else');assert.equal(call[1],LAB);}
 const flat=JSON.stringify(all);for(const secret of [TEXT_B,NOTE,'left-up','smaller','opposite'])assert.ok(!flat.includes(secret),`no learner content in usage events (${secret})`);
 clean(env);await env.ctx.close();
 return all;
}

// ===================================================================================================================
// phone layout: measured along the walk's stages (a second, lighter pass over the stages that can break on a small screen)
// ===================================================================================================================
async function phoneLayout(browser){
 const env=await open(browser,{width:390,height:844,touch:true});const {page:p}=env;
 const sized=async(sel,min,label)=>{const bad=await p.evaluate(({sel,min})=>[...document.querySelectorAll(sel)].filter(b=>!b.closest('[hidden]')&&getComputedStyle(b).display!=='none').map(b=>{const r=b.getBoundingClientRect();return [r.width,r.height]}).filter(([w,h])=>w<min-0.5||h<min-0.5),{sel,min});assert.deepEqual(bad,[],`${label} are at least ${min} px`)};
 await clickName(p,'開始');await clickName(p,'開始實驗');
 await sized('[data-mg-move],[data-mg-home]',64,'direction buttons');
 const cta=await $(p,'#mg-cta').boundingBox();assert.ok(cta.height>=63.5,'the main button is at least 64 px');
 await $(p,'#mg-cta').scrollIntoViewIfNeeded();assert.equal(await $(p,'#mg-cta').isVisible(),true,'the main button can be reached');
 const eye=await $(p,'.mg-eyepiece').boundingBox(),ov=await $(p,'.mg-overview').boundingBox();
 assert.ok(eye.width>=300&&ov.width>=300,`both views are readable on a phone (${eye.width}, ${ov.width})`);assert.ok(eye.y+eye.height<=ov.y+1,'eyepiece above the stage');
 assert.equal(await overflow(p),0);clean(env);await env.ctx.close();
}

// ===================================================================================================================
// forged saves: what the page restores is decided by the model, never by what the save claims
// ===================================================================================================================
async function forgedSaves(browser){
 const E=await import(pathToFileURL(path.join(root,'assets/microscope-guided/engine.js')).href),P=await import(pathToFileURL(path.join(root,'assets/microscope-guided/persist.js')).href);
 const set=(x,y)=>({type:'SET_STAGE',x,y}),REC={type:'RECORD'},CONT={type:'CONTINUE'};
 const ans=(c,q,a)=>({type:'ANSWER_COMPARE',compare:c,question:q,answer:a}),ch=(id,step,choice)=>({type:'ANSWER_CHALLENGE',id,step,choice});
 const FLOW=[{type:'START'},{type:'BEGIN'},set(75,0),REC,set(0,75),REC,ans('direction','relation','opposite'),CONT,set(0,0),REC,{type:'SET_OBJECTIVE',objective:40},REC,
  ans('magnification','field','smaller'),ans('magnification','count','fewer'),CONT,CONT,{type:'SAVE_CONCLUSION',fields:{level:'A',relationDirection:'left',relationRange:'smaller'}},CONT,
  ch(1,'c1-direction','left-up'),CONT,ch(2,'c2-view','only-b-larger'),ch(2,'c2-claim','smaller-field'),CONT,ch(3,'c3-strategy','low-recentre'),CONT];
 const save=(n,mutate)=>{let s=E.createInitialState();for(const a of FLOW.slice(0,n))s=E.reduce(s,a).state;const o=JSON.parse(P.serialize(s));mutate?.(o);return JSON.stringify(o)};
 const seeded=async(value,fn)=>{
  const env=await open(browser,{width:1280,height:900,init:{fn:({k,v})=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem(k,v)}},arg:{k:KEY,v:value}}});
  const {page:p}=env;await settle(p);
  assert.deepEqual(await events(p),[],'a restore sends no usage event');assert.equal((await said(p)).id,null,'and announces nothing');
  await fn(p);clean(env);await env.ctx.close();
 };
 const phase=async(p)=>(await main(p)).phase;
 // A: forged Trial 1 derived fields never touch the verdict
 await seeded(save(25,o=>{for(const k of ['horizontal','vertical'])Object.assign(o.records[k],{imageDelta:{x:999,y:999},stageDelta:{x:-9,y:-9},relation:'same',imageStart:{x:1,y:1}})}),async p=>{
  assert.equal(await phase(p),'complete');assert.deepEqual(await evidenceRows(p,'horizontal'),['向右 1.0 mm','向左 120 px'],'the evidence is recomputed, not read');});
 // B: forged visibleIds / field size
 await seeded(save(25,o=>{Object.assign(o.records.high,{visibleIds:['A','B','C'],fieldDiameter:9,count:99});Object.assign(o.records.low,{visibleIds:['B'],fieldDiameter:1})}),async p=>{
  assert.equal(await phase(p),'complete');assert.deepEqual(await evidenceRows(p,'high'),['40×','0.45 mm','1 個：B']);assert.deepEqual(await evidenceRows(p,'low'),['4×','4.5 mm','3 個：A、B、C']);});
 // C: forged compare correctness and ready flags
 await seeded(save(25,o=>{o.compare.relation='same';o.compare.count='more';o.ready=true;o.allCorrect=true;o.phase='concept'}),async p=>{
  assert.equal(await phase(p),'compare-direction');assert.equal((await main(p)).screen,'compare');assert.equal((await ctaState(p)).enabled,false);});
 // D: forged notebook relation
 await seeded(save(25,o=>{o.conclusion={level:'A',relationDirection:'right',relationRange:'smaller',freeText:'',evidenceText:'',limitationText:''};o.phase='challenge-2';o.challenges={1:{steps:{}},2:{steps:{}},3:{steps:{}}}}),async p=>{
  assert.equal(await phase(p),'notebook');assert.equal(await $(p,'[data-stem="relationDirection"] input[value="right"]').isChecked(),false,'the forged relation was cleared');assert.equal((await ctaState(p)).enabled,false);});
 // E: forged challenge correct:true
 await seeded(save(25,o=>{o.challenges[1].steps['c1-direction']={choice:'right-up',attempts:3,correct:true};o.phase='complete'}),async p=>{
  assert.equal(await phase(p),'challenge-1');assert.equal(await $(p,'[data-challenge-step="c1-direction"]').getAttribute('data-solved'),'false');
  assert.equal(await $(p,'button[data-option]').evaluateAll(b=>b.some(x=>x.disabled)),false);assert.equal((await ctaState(p)).enabled,false);});
 // F: later challenges answered while the earlier one is not
 await seeded(save(25,o=>{o.challenges[1]={steps:{}};o.phase='challenge-3'}),async p=>{
  assert.equal(await phase(p),'challenge-1');assert.equal(await $(p,'[data-challenge-step="c1-direction"]').getAttribute('data-attempts'),'0');});
 // G: claims the finish with too little data
 await seeded(save(4,o=>{o.phase='complete'}),async p=>{assert.equal(await phase(p),'trial1-vertical');assert.deepEqual(await evidenceIds(p),['horizontal']);});
 // H: invalid objective and stage
 await seeded(save(10,o=>{o.phase='trial2-high';o.objective=7;o.stage={x:'x',y:null}}),async p=>{
  assert.equal(await phase(p),'trial2-high');assert.equal(await p.getByRole('button',{name:'4× 物鏡'}).getAttribute('aria-pressed'),'true');assert.equal(await $(p,'[data-role="stage-surface"]').getAttribute('aria-label'),'玻片移動台，目前向右 0.0 毫米、向上 0.0 毫米');});
 await seeded(save(10,o=>{o.phase='trial2-high';o.objective=40;o.stage={x:-9999,y:9999}}),async p=>{
  assert.equal(await phase(p),'trial2-high','B cannot be in the field at the clamped stage, so the trial is not complete');assert.equal(await p.getByRole('button',{name:'40× 物鏡'}).getAttribute('aria-pressed'),'true');
  assert.match(await $(p,'[data-role="stage-surface"]').getAttribute('aria-label'),/向左 2\.\d 毫米、向上 2\.\d 毫米/,'clamped to ±150');});
 // corrupt and foreign saves start fresh
 for(const raw of ['{not json',JSON.stringify({v:2,phase:'complete'}),JSON.stringify([1,2])])await seeded(raw,async p=>{assert.equal(await phase(p),'welcome')});
}

// ===================================================================================================================
// blocked storage
// ===================================================================================================================
async function storageBlocked(browser){
 const env=await open(browser,{width:1280,height:900,init:{fn:()=>{const boom=function(){throw new DOMException('blocked','SecurityError')};Storage.prototype.getItem=boom;Storage.prototype.setItem=boom;Storage.prototype.removeItem=boom}}});
 const {page:p}=env;
 assert.equal((await main(p)).phase,'welcome','the lab starts although storage is blocked');
 await clickName(p,'開始');await clickName(p,'開始實驗');
 await $(p,'[data-role="stage-surface"]').focus();let n=0;while((await main(p)).phase==='trial1-horizontal'&&n++<10)await press(p,'ArrowRight');
 assert.equal((await main(p)).phase,'trial1-horizontal-complete');await clickName(p,'記錄橫向結果');
 assert.equal((await main(p)).phase,'trial1-vertical');
 assert.equal(await text(p,'#mg-storage-note'),'這台裝置不能儲存進度。','a quiet note, not a dialog');assert.equal(await $(p,'#mg-storage-note').isVisible(),true);
 assert.deepEqual((await events(p)).map(e=>e[0]),['lab_start','trial_recorded'],'usage events are not affected');
 clean(env);await env.ctx.close();
}

// the analytics adapter may be missing or may throw: the lab goes on
async function adapterFailures(browser){
 for(const adapter of ['absent','throw']){
  const env=await open(browser,{width:1280,height:900,adapter});const {page:p}=env;
  await clickName(p,'開始');await clickName(p,'開始實驗');await $(p,'[data-role="stage-surface"]').focus();
  let n=0;while((await main(p)).phase==='trial1-horizontal'&&n++<10)await press(p,'ArrowRight');
  await clickName(p,'記錄橫向結果');assert.equal((await main(p)).phase,'trial1-vertical',`the lab goes on with a ${adapter} adapter`);
  const uncaught=env.errors.filter(m=>!/adapter down/.test(m));assert.deepEqual(uncaught,[],'only the adapter\'s own error may appear');
  assert.deepEqual(env.external,[]);await env.ctx.close();
 }
}

(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,r));base=`http://localhost:${server.address().port}`;
 fs.rmSync(OUT,{recursive:true,force:true});
 const browser=await chromium.launch(launchOptions());let checks=0;const ok=m=>{checks++;console.log('PASS',m)};
 try{
  await walk(browser,{width:1280,height:900,touch:false,matrix:true});ok('1280: the whole lab by keyboard and mouse, welcome to the finish, with eight reload checkpoints');
  await walk(browser,{width:390,height:844,touch:true,matrix:false});ok('390: the whole lab by taps and touch drags, welcome to the finish');
  await phoneLayout(browser);ok('390: touch targets, reach and ordering');
  await forgedSaves(browser);ok('forged saves: derived fields, compare, notebook, challenges, phase and stage are all re-derived');
  await storageBlocked(browser);ok('blocked storage: a quiet note, the lab goes on, usage events unaffected');
  await adapterFailures(browser);ok('a missing or throwing analytics adapter never stops the lab');
  console.log(`microscope-guided flow browser: ${checks} parts passed`);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
