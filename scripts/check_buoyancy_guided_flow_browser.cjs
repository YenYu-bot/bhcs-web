// B5/B6 gate (real browser part): a learner walks the guided buoyancy lab from the welcome page to the finish and starts over,
// using only the page: buttons, the liquid choice, the compare answers, the notebook, the challenge buttons. No state is
// injected for the main walk. Checks the teaching words, the evidence, the compare card, the notebook levels, the challenge
// attempts (a focus move or an arrow key is never an answer), the one live region, focus, layout order at 1280 and 390, the
// pre-concept vocabulary and axe at every stage. A second part checks saving: reload at each checkpoint, notebook text
// flushed on blur / pagehide / hidden, forged saves, blocked storage, restart.
// Needs Playwright (CI: NODE_PATH=/tmp/bhcs-composition/node_modules). Locally set PLAYWRIGHT_CHROMIUM_EXECUTABLE to reuse a browser.
// Review artifacts (a screenshot of each stage) go to buoyancy-flow-artifacts/.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {guardContext,axeScan}=require('./buoyancy_guided_test_support.cjs');
const root=path.resolve(__dirname,'..');
const PAGE='/tools/science/buoyancy-guided.html';
const OUT=path.join(root,'buoyancy-flow-artifacts');

const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return}
 const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});

const FORMAL=['密度','漂浮','懸浮','下沉','浮力','受力','排開','阿基米德','相對密度','ρ'];
const NEVER=['浮力','受力','排開','阿基米德'];
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const click=async(p,name)=>{await p.getByRole('button',{name,exact:true}).click();await settle(p)};
const txt=(p,sel)=>p.locator(sel).innerText();
const info=p=>p.evaluate(()=>{const m=document.getElementById('main').dataset,a=document.activeElement;return {phase:m.phase,screen:m.screen,slots:Number(m.slots),liquid:m.liquid,tank:m.tankObject,
 active:a?{id:a.id,object:a.dataset.bgObject||null,action:a.dataset.bgAction||null,liquid:a.dataset.bgLiquid!==undefined?a.value:null,q:a.dataset.q||null,option:a.dataset.bgOption&&a.tagName==='BUTTON'&&a.classList.contains('bg-option')?a.dataset.bgOption:null,value:a.dataset.bgCompare!==undefined?a.value:null}:null,
 overflow:document.documentElement.scrollWidth-innerWidth,vw:innerWidth}});
// what the announcer says, once its short delay has passed
const said=async p=>{await p.waitForTimeout(120);return p.evaluate(()=>{const a=document.getElementById('bg-announcer');return {id:a.dataset.id||null,text:a.textContent,writes:Number(a.dataset.writes||0)}})};
const coach=p=>p.evaluate(()=>({main:document.getElementById('bg-coach-main').textContent,sub:document.getElementById('bg-coach-sub').hidden?'':document.getElementById('bg-coach-sub').textContent,tip:document.getElementById('bg-coach-tip').hidden?'':document.getElementById('bg-coach-tip').textContent,visible:!document.getElementById('bg-coach').hidden}));
const status=p=>p.evaluate(()=>{const s=document.getElementById('bg-status');return s.hidden?null:{kind:s.dataset.kind,text:s.querySelector('[data-bg-status-text]').textContent}});
const evidenceIds=p=>p.evaluate(()=>[...document.querySelectorAll('[data-bg-evidence-item]')].map(e=>e.dataset.bgEvidenceItem));
const cta=p=>p.evaluate(()=>{const b=document.getElementById('bg-cta');return b.hidden?null:{label:b.textContent,enabled:!b.disabled}});

/** Every word a learner could read or hear on the page: what is drawn, what is hidden but present, the labels, the title. */
const allText=p=>p.evaluate(()=>{const out=[document.title,document.body.innerText,document.body.textContent];
 for(const e of document.querySelectorAll('[aria-label],[title],[alt]'))out.push(e.getAttribute('aria-label'),e.getAttribute('title'),e.getAttribute('alt'));
 return out.filter(Boolean).join('\n')});
const noFormal=async(p,label)=>{const t=await allText(p);for(const w of FORMAL)assert.ok(!t.includes(w),`${label}: "${w}" is visible before the concept`)};
const noForce=async(p,label)=>{const t=await allText(p);for(const w of NEVER)assert.ok(!t.includes(w),`${label}: "${w}" must never appear`)};
const liveRegions=p=>p.evaluate(()=>({attr:[...document.querySelectorAll('[aria-live]')].map(e=>e.id),roles:[...document.querySelectorAll('[role=status],[role=alert],[role=log],output')].map(e=>e.tagName+'#'+e.id),
 inside:['bg-coach','bg-status','bg-hint','bg-data','bg-evidence','bg-compare','bg-concept','bg-notebook','bg-challenge','bg-complete'].filter(id=>document.getElementById(id).closest('[aria-live]')),
 announcer:{live:document.getElementById('bg-announcer').getAttribute('aria-live'),atomic:document.getElementById('bg-announcer').getAttribute('aria-atomic')}}));

const shot=async(p,name,tag)=>{fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,`${tag}-${name}.png`),fullPage:true})};
async function open(browser,{width,height,touch=false,adapter='spy'}){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
 const external=[];await guardContext(ctx,base,{hook:false,external,adapter});        // no test hook: the walk uses the page the learner has; the site adapter is a spy
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base+PAGE);await page.waitForSelector('#main[data-phase]');
 return {ctx,page,errors,external};
}
const clean=({errors,external})=>{assert.deepEqual(errors,[]);assert.deepEqual(external,[])};

const LAB='buoyancy-guided';
const SEQUENCE=['lab_start','trial_recorded','trial_recorded','compare_complete','trial_recorded','counterexample_observed','notebook_complete','challenge_complete','challenge_complete','challenge_complete','lab_complete'];
const track=p=>p.evaluate(()=>window.__testScienceEvents||null);      // what the page handed the (spy) site adapter

let base;const results=[];
const check=async(name,fn)=>{const row={name};try{await fn();row.pass=true}catch(e){row.pass=false;row.error=e.message}results.push(row);console.log(JSON.stringify(row));return row.pass};

/** Common to every stage: the vocabulary rule, one live region, nothing sideways, axe, a picture for review. */
async function stageOf(p,tag,label,{concept=false}={}){
 if(!concept){
  await noFormal(p,label);
  const c=await p.evaluate(()=>({hidden:document.getElementById('bg-concept').hidden,cards:document.querySelectorAll('[data-bg-concept-card],[data-bg-formula]').length,screen:document.getElementById('main').dataset.screen,heading:document.getElementById('bg-heading').textContent}));
  assert.deepEqual(c,{hidden:true,cards:0,screen:c.screen,heading:'浮沉實驗'},`${label}: the concept is on the page before its time`);
  assert.notEqual(c.screen,'concept',`${label}: the concept screen is showing before its time`);
 }
 await noForce(p,label);
 const live=await liveRegions(p);
 assert.deepEqual(live.attr,['bg-announcer'],`${label}: aria-live belongs to the announcer alone`);
 assert.deepEqual(live.roles,[],`${label}: no implicit live region`);
 assert.deepEqual(live.inside,[],`${label}: a card sits inside a live region`);
 assert.deepEqual(live.announcer,{live:'polite',atomic:'true'});
 assert.ok((await info(p)).overflow<=0,`${label}: the page scrolls sideways`);
 await axeScan(p,`${tag} ${label}`);
 await shot(p,label.replace(/[^a-z0-9]+/gi,'-'),tag);
}

/** The whole walk at one viewport. Each step is its own result; the first failure stops the walk (later steps would only repeat it). */
async function walk(browser,{width,height,touch,tag}){
 const s=await open(browser,{width,height,touch});const p=s.page;
 let broken=false;
 const step=async(name,fn)=>{if(broken)return;const ok=await check(`${tag} ${name}`,fn);if(!ok)broken=true};
 const stage=(label,opts)=>stageOf(p,tag,label,opts);

 await step('welcome: the question, the line under it, one button; no coach card, no side cards',async()=>{
  assert.equal(await txt(p,'#bg-welcome-title'),'物體很重，就一定會沉下去嗎？');
  assert.equal(await txt(p,'#bg-welcome-sub'),'接下來你會親手把東西放進水裡，自己找出答案。');
  assert.deepEqual(await cta(p),{label:'開始實驗',enabled:true});
  assert.equal(await p.locator('#bg-coach').isHidden(),true);assert.equal(await p.locator('#bg-side').isHidden(),true);
  assert.equal(await txt(p,'#bg-heading'),'浮沉實驗');
  assert.equal(await txt(p,'#bg-privacy-note'),'匿名使用事件不含研究手冊文字、作答內容或學生姓名。','the page says what is and is not sent');
  assert.deepEqual(await track(p),[],'opening the page is not a milestone');
  const steps=await p.evaluate(()=>({tag:document.getElementById('bg-steps').tagName,labels:[...document.querySelectorAll('#bg-steps li')].map(li=>li.textContent.replace(/\s+/g,' ').trim()),current:[...document.querySelectorAll('#bg-steps li')].map(li=>li.getAttribute('aria-current')),interactive:document.querySelectorAll('#bg-steps button,#bg-steps a,#bg-steps [tabindex]').length}));
  assert.deepEqual(steps,{tag:'OL',labels:['01 接任務','02 動手做','03 研究手冊','04 挑戰題'],current:['step',null,null,null],interactive:0});
  await stage('welcome');
 });
 await step('mission: the coach, the status, the conditions and one button; nothing moves by itself',async()=>{
  await click(p,'開始實驗');
  assert.equal((await info(p)).phase,'mission');
  assert.deepEqual(await coach(p),{main:'桌上有一個水槽和一個方塊。方塊裡面可以放配重。',sub:'現在方塊放進水裡會浮起來。想辦法讓它停在水中，不浮也不沉。',tip:'',visible:true});
  assert.deepEqual(await status(p),{kind:'neutral',text:'桌上有水槽、方塊和天平。'});
  assert.deepEqual(await cta(p),{label:'動手試試看',enabled:true});
  assert.equal(await txt(p,'#bg-coach-name'),'余老師');
  assert.ok((await txt(p,'#bg-data')).includes('60 g'));
  await settle(p);assert.equal((await info(p)).phase,'mission');
  await stage('mission');
 });
 await step('trial 1 starts: the button goes, focus goes to the block, the step moves to 02',async()=>{
  await click(p,'動手試試看');
  const r=await info(p);assert.equal(r.phase,'trial1-test');
  assert.equal(r.active.object,'block','focus handed to the first thing to do');
  assert.equal(await cta(p),null);
  const cur=await p.evaluate(()=>[...document.querySelectorAll('#bg-steps li')].map(li=>li.getAttribute('aria-current')));
  assert.deepEqual(cur,[null,'step',null,null]);
 });
 await step('trial 1: the first drop floats; coach, status and announcer say it in plain words',async()=>{
  await click(p,'放入水中');
  assert.deepEqual(await coach(p),{main:'方塊浮起來了。',sub:'想想看，要讓它停在水中，該怎麼調整？',tip:'',visible:true});
  assert.deepEqual(await status(p),{kind:'progress',text:'方塊浮起來了，約 60% 在水面下。'});
  const a=await said(p);assert.deepEqual([a.id,a.text,a.writes],['observation-1','方塊浮起來了，約 60% 在水面下。',1]);
  await stage('trial 1 float');
 });
 await step('trial 1: the learner finds the block that stays, by hand',async()=>{
  await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中');
  assert.equal((await status(p)).text,'方塊浮起來了，約 80% 在水面下。');
  assert.equal((await coach(p)).tip,'看看方塊在水裡的位置。','a second drop that did not stay brings the first hint');
  await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中');
  assert.equal((await info(p)).phase,'trial1-complete');
  assert.deepEqual(await status(p),{kind:'success',text:'方塊停在液體中了。'});
  assert.deepEqual(await coach(p),{main:'方塊停在水中了。',sub:'看看天平上的質量。',tip:'看看方塊在水裡的位置。',visible:true});
  assert.deepEqual(await cta(p),{label:'記錄第一次結果',enabled:true});
  await stage('trial 1 complete');
 });
 await step('trial 1 record: first evidence, coach, announcement; focus goes to the liquid choice',async()=>{
  await click(p,'記錄第一次結果');
  assert.equal((await info(p)).phase,'trial2-switch-liquid');
  assert.deepEqual(await coach(p),{main:'第一筆證據有了。接下來只先換一件事。',sub:'把液體換成濃鹽水。',tip:'',visible:true});
  assert.deepEqual(await evidenceIds(p),['record-1']);
  const rows=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-evidence-item=record-1] dl > *')].map(e=>e.textContent));
  assert.deepEqual(rows,['液體','水','方塊體積','100 cm³','停在液體中時的質量','100 g']);
  assert.ok((await txt(p,'[data-bg-evidence-item=record-1] h3')).startsWith('第一次紀錄完成'));
  const a=await said(p);assert.match(a.id,/^record-written-\d+$/);assert.equal(a.text,'第一筆結果已記錄。');
  const r=await info(p);assert.equal(r.active.liquid,'water','focus is on the one usable control');
  assert.equal(await p.locator('#bg-cta').isHidden(),true);
  await stage('trial 2 switch');
 });
 await step('trial 2: choosing the brine brings the "only the liquid" line; the data card marks it changed',async()=>{
  await p.locator('input[data-bg-liquid][value="brine"]').check();await settle(p);
  assert.deepEqual(await coach(p),{main:'好，這次我們先只換液體。',sub:'把同一個方塊放進去看看。',tip:'',visible:true});
  assert.equal(await p.locator('#bg-data dd[data-state="changed"]').count(),1);
  assert.equal(await p.locator('#bg-data dd[data-state="changed"]').innerText(),'濃鹽水（剛換）');
 });
 await step('trial 2 first drop: the same block floats, about 83%, and the learner is asked to find the new stay',async()=>{
  await click(p,'放入水中');
  assert.equal((await info(p)).phase,'trial2-test');
  assert.deepEqual(await coach(p),{main:'原本停在水中的方塊，現在浮起來了。',sub:'再找一次讓它停住的質量。',tip:'',visible:true});
  assert.deepEqual(await status(p),{kind:'progress',text:'方塊浮起來了，約 83% 在水面下。'});
  const a=await said(p);assert.match(a.text,/約 83% 在水面下/);
  assert.equal(await p.locator('input[data-bg-liquid]').first().isDisabled(),true,'the liquid is locked now');
  await stage('trial 2 first drop');
 });
 await step('trial 2: the learner finds the new stay, records it, and has two pieces of evidence',async()=>{
  await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中');
  assert.equal((await info(p)).phase,'trial2-complete');
  assert.deepEqual(await coach(p),{main:'又停住了。',sub:'看看天平和液體，有什麼不同？',tip:'',visible:true});
  assert.deepEqual(await cta(p),{label:'記錄第二次結果',enabled:true});
  await stage('trial 2 complete');
  await click(p,'記錄第二次結果');
  assert.equal((await info(p)).phase,'trial2-recorded');
  assert.deepEqual(await coach(p),{main:'兩筆證據都有了。',sub:'',tip:'',visible:true});
  assert.deepEqual(await evidenceIds(p),['record-1','record-2']);
  const rows=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-evidence-item=record-2] dl > *')].map(e=>e.textContent));
  assert.deepEqual(rows,['液體','濃鹽水','方塊體積','100 cm³','停在液體中時的質量','120 g','一開始放入的 100 g 方塊','浮起來（約 83% 在水面下）']);
  assert.deepEqual(await cta(p),{label:'比較兩次',enabled:true});
  assert.equal((await said(p)).text,'第二筆結果已記錄。');
  await stage('trial 2 recorded');
 });
 await step('compare: the evidence table is the learner\'s own, the questions are open, the next button waits; focus is on the heading',async()=>{
  await click(p,'比較兩次');
  const r=await info(p);assert.deepEqual([r.phase,r.screen,r.active.id],['compare','compare','bg-compare-title']);
  assert.deepEqual(await coach(p),{main:'把兩次的證據放在一起看。',sub:'',tip:'',visible:true});
  const table=await p.evaluate(()=>[...document.querySelectorAll('.bg-compare-table tbody tr')].map(tr=>[...tr.children].map(c=>c.textContent)));
  assert.deepEqual(table,[['液體（改變的）','水','濃鹽水'],['方塊體積（保持相同）','100 cm³'],['放入方式（保持相同）','相同'],['判定（保持相同）','停在液體中'],
   ['原本 100 g 的方塊','停在水中','浮起來（約 83% 在水面下）'],['讓方塊停住所需質量','100 g','120 g']]);
  assert.equal(await txt(p,'.bg-notice'),'這次改的是液體；其他條件保持相同。');
  assert.equal(await txt(p,'.bg-procedure'),'先只換液體，再用相同方法重新測量。');
  const qs=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-question]')].map(f=>({legend:f.querySelector('legend').textContent,options:[...f.querySelectorAll('label')].map(l=>l.textContent),checked:f.querySelectorAll('input:checked').length})));
  assert.deepEqual(qs,[{legend:'換成濃鹽水後，讓方塊停在液體中所需的質量怎麼變？',options:['變大','變小','差不多'],checked:0},{legend:'原本停在水中的方塊放進濃鹽水後，結果是？',options:['浮起來','停在液體中','沉到底'],checked:0}]);
  assert.deepEqual(await cta(p),{label:'繼續實驗',enabled:false});
  assert.equal(await status(p),null);
  assert.equal(await p.locator('#bg-bench-card').isHidden(),true);
  await stage('compare');
 });
 await step('compare: a first try that does not match the records gets a neutral nudge; the next button still waits',async()=>{
  await p.locator('input[data-bg-compare][data-q="stayMass"][value="smaller"]').check();await settle(p);
  const fb=await p.locator('[data-bg-feedback="stayMass"]').innerText();
  assert.equal(fb,'再看看兩次讓方塊停住的質量。');
  assert.ok(!/答錯|錯了|不對/.test(await allText(p)));
  assert.deepEqual(await cta(p),{label:'繼續實驗',enabled:false});
  const a=await said(p);assert.deepEqual([a.id,a.text],['compare-stayMass-smaller','再看看兩次讓方塊停住的質量。']);
  await stage('compare nudge');
 });
 await step('compare: the right choice is confirmed and settled; focus moves on to the next question, then to the button',async()=>{
  await p.locator('input[data-bg-compare][data-q="stayMass"][value="larger"]').check();await settle(p);
  assert.equal(await p.locator('[data-bg-feedback="stayMass"]').innerText(),'和你的紀錄一致。');
  assert.equal(await p.locator('input[data-q="stayMass"]:disabled').count(),3,'a settled question is locked');
  let r=await info(p);assert.deepEqual([r.active.q,r.active.value],['firstDrop','float'],'focus is not lost to the lock: it moves to the next open question');
  await p.locator('input[data-bg-compare][data-q="firstDrop"][value="float"]').check();await settle(p);
  assert.deepEqual(await coach(p),{main:'你剛才已經找到一個規律了。',sub:'換了液體，同一個方塊要改變質量，才能再次停在液體中。',tip:'',visible:true});
  assert.deepEqual(await cta(p),{label:'繼續實驗',enabled:true});
  r=await info(p);assert.equal(r.active.id,'bg-cta','focus lands on the button that just opened');
  const a=await said(p);assert.match(a.text,/你剛才已經找到一個規律了/);
  await stage('compare done');
 });
 await step('trial 3: wood and stone are put in by hand; the status and the evidence follow',async()=>{
  await click(p,'繼續實驗');
  const r=await info(p);assert.deepEqual([r.phase,r.screen],['trial3-drop','bench']);
  assert.deepEqual(await coach(p),{main:'如果換成別的東西呢？',sub:'這次也放放看。',tip:'',visible:true});
  assert.ok((await txt(p,'#bg-data')).includes('300 g、500 cm³')&&(await txt(p,'#bg-data')).includes('120 g、40 cm³'));
  await click(p,'把大木塊放入水中');
  assert.deepEqual(await status(p),{kind:'progress',text:'大木塊浮起來了，約 60% 在水面下。'});
  await click(p,'拿出來');
  assert.equal((await status(p)).text,'再把小石頭放進水裡看看。');
  await click(p,'把小石頭放入水中');
  assert.equal((await info(p)).phase,'trial3-observed');
  assert.deepEqual(await status(p),{kind:'progress',text:'小石頭沉到底了。'});
  assert.deepEqual(await coach(p),{main:'木塊比石頭重，卻浮著；石頭比較輕，卻沉了。',sub:'這和前兩次有什麼不同？',tip:'',visible:true});
  assert.deepEqual(await cta(p),{label:'我觀察到了',enabled:true});
  assert.deepEqual(await evidenceIds(p),['record-1','record-2','wood','stone']);
  assert.equal(await p.locator('#bg-bench-card').isVisible(),true,'the two objects are still on the bench to look at');
  assert.equal((await info(p)).screen,'bench');
  const rows=await p.evaluate(()=>['wood','stone'].map(id=>[...document.querySelectorAll(`[data-bg-evidence-item=${id}] dl > *`)].map(e=>e.textContent)));
  assert.deepEqual(rows,[['質量','300 g','體積','500 cm³','結果','浮起來（約 60% 在水面下）'],['質量','120 g','體積','40 cm³','結果','沉到底']]);
  const a=await said(p);assert.equal(a.text,'小石頭沉到底了。');
  await stage('trial 3 observed');
 });
 await step('concept: only now the names; the learner\'s own numbers, the formula, and nothing about forces',async()=>{
  await click(p,'我觀察到了');
  const r=await info(p);assert.deepEqual([r.phase,r.screen,r.active.id],['concept','concept','bg-cta'],'the same button, now leading on: focus stays on it');
  assert.deepEqual(await cta(p),{label:'進入研究手冊',enabled:true});
  assert.deepEqual(await coach(p),{main:'剛才幾次實驗，其實都在比較同一件事。',sub:'先看看是什麼。',tip:'',visible:true});
  assert.equal(await txt(p,'#bg-heading'),'浮沉與密度');
  assert.equal(await p.locator('#bg-bench-card').isHidden(),true);
  const lines=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-concept-card=density] [data-bg-line]')].map(l=>l.textContent));
  assert.deepEqual(lines,['停在水中的方塊：100 g ÷ 100 cm³ = 1.0 g/cm³','停在濃鹽水中的方塊：120 g ÷ 100 cm³ = 1.2 g/cm³','大木塊：300 g ÷ 500 cm³ = 0.6 g/cm³','小石頭：120 g ÷ 40 cm³ = 3.0 g/cm³']);
  assert.equal(await txt(p,'[data-bg-formula] .bg-formula'),'ρ = m / V');
  assert.ok((await txt(p,'[data-bg-formula]')).includes('密度 = 質量 ÷ 體積'));
  const results=await txt(p,'[data-bg-concept-card=results]');
  for(const w of ['漂浮','懸浮','下沉'])assert.ok(results.includes(w),w);
  assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('[data-bg-concept-card=results] [data-bg-line]')].map(l=>l.textContent)),
   ['大木塊的密度 0.6 < 水的密度 1.0 → 漂浮','停在水中的方塊的密度 1.0 = 水的密度 1.0 → 懸浮','小石頭的密度 3.0 > 水的密度 1.0 → 下沉']);
  assert.ok((await allText(p)).includes('密度'));
  await stage('concept',{concept:true});
 });
 await step('order: steps, coach, stage, side follow the fixed order in the page, and the layout puts them where the spec says',async()=>{
  const g=await p.evaluate(()=>{const b=id=>document.getElementById(id).getBoundingClientRect();const before=(a,c)=>Boolean(document.getElementById(a).compareDocumentPosition(document.getElementById(c))&Node.DOCUMENT_POSITION_FOLLOWING);
   return {dom:[before('bg-steps','bg-coach'),before('bg-coach','bg-stage'),before('bg-stage','bg-side'),before('bg-status','bg-cta')],coach:b('bg-coach'),stage:b('bg-stage'),side:b('bg-side'),steps:b('bg-steps'),vw:innerWidth}});
  assert.deepEqual(g.dom,[true,true,true,true],'DOM order is the same at every width');
  if(g.vw>=960){assert.ok(g.coach.left>g.stage.left+g.stage.width*0.9,'desktop: the coach is in the right column');assert.ok(g.side.top>=g.coach.bottom-1,'desktop: the evidence sits under the coach');
   const ratio=g.stage.width/(g.coach.width);assert.ok(ratio>1.6&&ratio<2.4,`desktop: columns are about 8:4 (${ratio.toFixed(2)})`)}
  else{assert.ok(g.coach.top>=g.steps.bottom-1&&g.stage.top>=g.coach.bottom-1&&g.side.top>=g.stage.bottom-1,'mobile: one column in reading order');assert.ok(g.stage.width>=g.vw-40)}
 });
 const KEY='bhcs-buoyancy-guided:v1';
 const attempts=id=>p.locator(`[data-bg-step="${id}"]`).getAttribute('data-attempts');
 const saved=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),KEY);
 const opt=v=>p.locator(`[data-bg-option="${v}"]`);
 const stepsNav=()=>p.evaluate(()=>[...document.querySelectorAll('#bg-steps li')].map(li=>li.getAttribute('aria-current')));
 const fbText=id=>p.locator(`[data-bg-step-feedback="${id}"]`).innerText();
 const tabTo=async(pred,limit=30)=>{for(let i=0;i<limit;i++){await p.keyboard.press('Tab');const a=(await info(p)).active;if(a&&pred(a))return a}throw new Error('focus never reached the target')};

 await step('notebook: the concept hands over to "我的研究手冊" with the learner\'s own two experiments and three ways to finish',async()=>{
  await click(p,'進入研究手冊');
  const r=await info(p);assert.deepEqual([r.phase,r.screen,r.active.id],['notebook','notebook','bg-notebook-title']);
  assert.equal(await txt(p,'#bg-notebook-title'),'我的研究手冊');
  assert.equal(await txt(p,'#bg-heading'),'浮沉與密度');
  assert.deepEqual(await stepsNav(),[null,null,'step',null]);
  assert.deepEqual(await coach(p),{main:'把你發現的整理成研究手冊。',sub:'選一種你喜歡的方式來完成。',tip:'',visible:true});
  const table=await p.evaluate(()=>[...document.querySelectorAll('.bg-nb-evidence tbody tr')].map(tr=>[...tr.children].map(c=>c.textContent)));
  assert.deepEqual(table.slice(-2),[['原本 100 g 的方塊','停在水中','浮起來（約 83% 在水面下）'],['讓方塊停住所需質量','100 g','120 g']]);
  const levels=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-levels] label')].map(l=>({text:l.textContent.replace(/\s+/g,' ').trim(),checked:l.querySelector('input').checked})));
  assert.deepEqual(levels.map(l=>[l.text.split(' ')[0],l.checked]),[['幫我整理',false],['我自己說',false],['我能提出證據',false]]);
  assert.equal(await p.locator('[data-bg-panel]:not([hidden])').count(),0);
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:false});
  assert.equal(await saved().then(x=>x.phase),'notebook','the save follows the learner');
  await stage('notebook start',{concept:true});
 });
 await step('notebook level A: a relation that does not fit the evidence keeps the button shut, with a nudge that gives nothing away',async()=>{
  await p.locator('input[data-bg-level][value="A"]').check();await settle(p);
  assert.deepEqual(await p.locator('[data-bg-stem] legend').allInnerTexts(),['換成密度較大的液體後，讓同一個方塊停在液體中，需要的質量會……','木塊比石頭重，卻浮著，是因為木塊的……比水小。']);
  assert.deepEqual(await p.locator('[data-bg-stem="relationWood"] label').allInnerTexts(),['質量','體積','密度']);
  await p.locator('input[data-bg-relation][data-q="relationLiquid"][value="smaller"]').check();await settle(p);
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:false});
  assert.equal(await p.locator('[data-bg-nudge]').isHidden(),true,'one sentence only: nothing to say yet');
  await p.locator('input[data-bg-relation][data-q="relationWood"][value="volume"]').check();await settle(p);
  assert.equal(await p.locator('[data-bg-nudge]').innerText(),'再對照一下你剛才的實驗證據。');
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:false});
  assert.ok(!/答錯|錯了|不對/.test(await allText(p)));
  assert.deepEqual([(await said(p)).id,(await said(p)).text],['notebook-smaller-volume','再對照一下你剛才的實驗證據。']);
  await stage('notebook A nudge',{concept:true});
  await p.locator('input[data-bg-relation][data-q="relationLiquid"][value="larger"]').check();
  await p.locator('input[data-bg-relation][data-q="relationWood"][value="density"]').check();await settle(p);
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:true});
  assert.equal(await p.locator('[data-bg-nudge]').isHidden(),true);
  assert.equal(await p.locator('[data-bg-ready]').innerText(),'整理好了，可以進入挑戰題。');
  assert.equal((await said(p)).id,'notebook-larger-density');
  await stage('notebook A ready',{concept:true});
 });
 await step('notebook level B: one character is not enough; the words count once the pause or a blur has passed them on',async()=>{
  await p.locator('input[data-bg-level][value="B"]').check();await settle(p);
  assert.equal(await p.locator('[data-bg-panel="B"]').isVisible(),true);assert.equal(await p.locator('[data-bg-panel="A"]').isHidden(),true);
  assert.equal(await p.locator('label[for="bg-nb-free"]').innerText(),'用你自己的話，說說物體什麼時候會浮、什麼時候會沉。');
  assert.equal(await p.locator('#bg-nb-free').getAttribute('maxlength'),'1000');
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:false},'level B is empty even though A was finished: the level chosen is the one that counts');
  await p.locator('#bg-nb-free').fill('重');await p.waitForTimeout(450);
  assert.equal((await cta(p)).enabled,false,'one character is not writing');
  await p.locator('#bg-nb-free').fill('重的不一定沉');
  assert.equal((await cta(p)).enabled,false,'typed but not yet passed on');
  assert.equal((await saved()).conclusion.freeText,'重','the pause has not passed: the save still has the old text');
  await p.waitForFunction(()=>!document.getElementById('bg-cta').disabled,null,{timeout:2000});
  assert.equal((await saved()).conclusion.freeText,'重的不一定沉');
  assert.equal(await p.evaluate(()=>document.activeElement.id),'bg-nb-free','typing is never interrupted by the redraw');
  assert.equal((await said(p)).id,'notebook-larger-density','and typing is never announced');
  await stage('notebook B',{concept:true});
 });
 await step('notebook level C: the ideas wait for the learner\'s own limitation; leaving the field passes the text on at once',async()=>{
  await p.locator('input[data-bg-level][value="C"]').check();await settle(p);
  assert.equal(await p.locator('label[for="bg-nb-evidence"]').innerText(),'你的哪一次實驗，讓你這樣想？');
  assert.equal(await p.locator('label[for="bg-nb-limit"]').innerText(),'這個實驗哪裡可能不夠完整？');
  assert.equal(await p.locator('[data-bg-ideas]').isHidden(),true);
  await p.locator('#bg-nb-evidence').fill('第二次實驗');await p.locator('#bg-nb-evidence').blur();await settle(p);
  assert.equal((await saved()).conclusion.evidenceText,'第二次實驗','a blur flushes at once');
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:false});
  assert.equal(await p.locator('[data-bg-ideas]').isHidden(),true,'still hidden: nothing written in the limitation');
  await p.locator('#bg-nb-limit').fill('只有兩種液體');await p.locator('#bg-nb-limit').blur();await settle(p);
  assert.equal(await p.locator('[data-bg-ideas]').isVisible(),true);
  assert.deepEqual(await p.locator('[data-bg-ideas] li').allInnerTexts(),['只測了水和濃鹽水。','配重一次增加 20 g，可能找不到更細的停住位置。','只用了少數幾種物體。']);
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:true});
  await stage('notebook C',{concept:true});
  await p.locator('input[data-bg-level][value="B"]').check();await settle(p);
  assert.equal(await p.locator('#bg-nb-free').inputValue(),'重的不一定沉','switching level keeps what was written');
  await p.locator('input[data-bg-level][value="A"]').check();await settle(p);
  assert.equal(await p.locator('input[data-q="relationWood"][value="density"]').isChecked(),true);
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:true});
 });
 await step('challenge 1: options are buttons; focus and arrow keys are never answers, one press is one try, a hint from the second try',async()=>{
  await click(p,'進入挑戰題');
  const r=await info(p);assert.deepEqual([r.phase,r.screen,r.active.id],['challenge-1','challenge','bg-challenge-title']);
  assert.equal(await txt(p,'#bg-challenge-title'),'挑戰 1／3');
  assert.deepEqual(await stepsNav(),[null,null,null,'step']);
  assert.deepEqual(await coach(p),{main:'來挑戰看看。',sub:'你剛學到的，在新的情況下也成立嗎？',tip:'',visible:true});
  assert.equal(await txt(p,'.bg-scenario'),'剛才在水中能停住的 100 g 方塊，現在放進食用油。');
  assert.deepEqual(await p.locator('[data-bg-option]').allInnerTexts(),['浮起來','停在液體中','沉到底']);
  assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('[data-bg-option]')].map(b=>b.tagName+':'+b.type)),['BUTTON:button','BUTTON:button','BUTTON:button']);
  assert.equal(await p.locator('#bg-challenge input[type=radio]').count(),0);
  assert.deepEqual(await cta(p),{label:'下一個挑戰',enabled:false});
  assert.equal(await attempts('c1-outcome'),'0');
  const first=await tabTo(a=>a.option);assert.equal(first.option,'float');
  for(const key of ['ArrowDown','ArrowDown','ArrowRight','ArrowUp'])await p.keyboard.press(key);
  await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');await settle(p);
  assert.equal(await attempts('c1-outcome'),'0','moving focus and arrows made no answer');
  assert.equal((await info(p)).active.option,'float');
  await p.keyboard.press('Enter');await settle(p);
  assert.equal(await attempts('c1-outcome'),'1','one Enter, one try');
  assert.equal(await fbText('c1-outcome'),'剛才哪個結果變得更明顯？');
  assert.equal((await info(p)).active.option,'float','focus stays on the button that was pressed');
  const said1=await said(p);assert.deepEqual([said1.id,said1.text],['challenge-1-c1-outcome-1','剛才哪個結果變得更明顯？']);
  for(const key of ['ArrowDown','ArrowRight','ArrowRight'])await p.keyboard.press(key);
  assert.equal(await attempts('c1-outcome'),'1','arrows after a try are still not tries');
  await p.keyboard.press('Tab');assert.equal((await info(p)).active.option,'stay');
  await p.keyboard.press('Space');await settle(p);
  assert.equal(await attempts('c1-outcome'),'2','one Space, one try');
  assert.equal(await fbText('c1-outcome'),'想想第二次實驗：液體的密度變大時，原本停在水中的方塊浮起來了。現在換成密度比水小的食用油，結果會怎樣？');
  assert.equal((await said(p)).id,'challenge-1-c1-outcome-2');
  await stage('challenge 1 hint',{concept:true});
  await opt('sink').click();await settle(p);
  assert.equal(await attempts('c1-outcome'),'3');
  assert.equal(await p.locator('[data-bg-step="c1-outcome"]').getAttribute('data-solved'),'true');
  assert.equal(await fbText('c1-outcome'),'這個方塊的密度比食用油大，所以會沉到底。');
  assert.equal(await p.locator('[data-bg-option]:not(:disabled)').count(),0,'a solved step locks');
  assert.deepEqual(await cta(p),{label:'下一個挑戰',enabled:true});
  assert.equal((await info(p)).active.id,'bg-cta','focus moves on to the button that just opened');
  assert.deepEqual(await coach(p),{main:'這題完成了。',sub:'可以往下走了。',tip:'',visible:true});
  const s1=await saved();assert.deepEqual(s1.challenges['1']['c1-outcome'],{choice:'sink',attempts:3},'the save has what was done, not whether it was right');
  await opt('float').click({force:true});await settle(p);assert.equal(await attempts('c1-outcome'),'3','a solved step ignores further presses');
  await stage('challenge 1 solved',{concept:true});
 });
 await step('challenge 2: the second step does not exist until the first is solved; then focus goes to it',async()=>{
  await click(p,'下一個挑戰');
  const r=await info(p);assert.deepEqual([r.phase,r.active.id],['challenge-2','bg-challenge-title']);
  assert.equal(await txt(p,'#bg-challenge-title'),'挑戰 2／3');
  assert.equal(await txt(p,'.bg-scenario'),'一個 80 g、100 cm³ 的方塊放進水裡。');
  assert.equal(await p.locator('[data-bg-step]').count(),1);
  assert.equal(await p.locator('[data-bg-step="c2-brine"]').count(),0);
  assert.deepEqual(await p.locator('[data-bg-step="c2-where"] [data-bg-option]').allInnerTexts(),['整顆在水面上','約 80% 在水面下','停在水中','沉到底']);
  await opt('all-out').click();await settle(p);
  assert.equal(await fbText('c2-where'),'剛才哪個結果變得更明顯？');
  assert.equal(await p.locator('[data-bg-step]').count(),1,'a try that does not settle it opens nothing');
  await stage('challenge 2 step 1',{concept:true});
  await opt('under-80').click();await settle(p);
  assert.equal(await p.locator('[data-bg-step]').count(),2);
  assert.equal(await fbText('c2-where'),'對，約 80% 在水面下，還有一部分露在水面上。');
  assert.equal((await info(p)).active.option,'more','focus goes to the step that just opened');
  assert.equal(await p.locator('[data-bg-step="c2-where"] [data-bg-option]:not(:disabled)').count(),0);
  assert.equal(await txt(p,'[data-bg-step="c2-brine"] .bg-step-question'),'如果換成濃鹽水，在液面下的比例會……');
  assert.deepEqual(await cta(p),{label:'下一個挑戰',enabled:false});
  await opt('less').click();await settle(p);
  assert.equal(await fbText('c2-brine'),'濃鹽水的密度比水大，方塊浸入的比例會變小。');
  assert.deepEqual(await cta(p),{label:'下一個挑戰',enabled:true});
  assert.equal((await info(p)).active.id,'bg-cta');
  await stage('challenge 2 step 2',{concept:true});
 });
 await step('challenge 3: the long options wrap inside the page; nothing about "排開"',async()=>{
  await click(p,'下一個挑戰');
  assert.equal(await txt(p,'#bg-challenge-title'),'挑戰 3／3');
  assert.equal(await txt(p,'.bg-scenario'),'同一張鋁箔，揉成小球會沉，折成小船卻能浮。');
  assert.equal(await txt(p,'.bg-step-question'),'哪個說法最合理？');
  const texts=await p.locator('[data-bg-option]').allInnerTexts();
  assert.deepEqual(texts,['鋁箔折成船以後質量變小了。','折成船後，鋁箔和裡面的空氣一起占了更大的整體體積，同樣的質量分布在更大的體積中，所以整體平均密度變小。','水只會托住船形的東西。','東西攤得越開就越會浮。']);
  const wrap=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-option]')].map(b=>({over:b.scrollWidth-b.clientWidth,right:b.getBoundingClientRect().right,vw:innerWidth})));
  for(const w of wrap){assert.ok(w.over<=1,`an option scrolls inside itself by ${w.over}`);assert.ok(w.right<=w.vw+0.5,'an option is wider than the screen')}
  assert.ok(!(await allText(p)).includes('排開'));
  await opt('boat-shape-only').click();await settle(p);
  assert.equal(await fbText('c3-reason'),'剛才哪個結果變得更明顯？');
  await stage('challenge 3',{concept:true});
  await opt('volume-spread').click();await settle(p);
  assert.equal(await fbText('c3-reason'),'折成船後，鋁箔和裡面的空氣一起占了更大的整體體積；同樣的質量分布在更大的體積中，所以整體平均密度變小。');
  assert.deepEqual(await cta(p),{label:'看看我完成了什麼',enabled:true});
 });
 await step('complete: the title, the three claims, two ways out; focus on the heading; the announcer says it once',async()=>{
  await click(p,'看看我完成了什麼');
  const r=await info(p);assert.deepEqual([r.phase,r.screen,r.active.id],['complete','complete','bg-complete-title']);
  assert.equal(await txt(p,'#bg-complete-title'),'這一站完成了');
  assert.equal(await txt(p,'.bg-complete-intro'),'你今天自己證明了：');
  assert.deepEqual((await p.locator('.bg-claims li').allInnerTexts()).map(t=>t.replace(/^✓\s*/,'')),[
   '同一個方塊換成濃鹽水後，要增加更多內部配重，才會停在液體中。',
   '300 g 的木塊比 120 g 的石頭重，卻是木塊浮起、石頭沉底，所以不能只看總質量判斷浮沉。',
   '當物體和液體的密度相同時，物體會停在液體中；要判斷浮沉，要比較物體和液體的密度。']);
  assert.equal(await p.locator('.bg-complete-link a').getAttribute('href'),'../buoyancy-density-lab.html');
  assert.equal(await p.locator('.bg-complete-link a').innerText(),'自由探索／精確數值');
  assert.deepEqual(await cta(p),{label:'再做一次',enabled:true});
  assert.deepEqual(await stepsNav(),[null,null,null,'step']);
  const a=await said(p);assert.deepEqual([a.id,a.text],['complete','這一站完成了。']);
  assert.equal((await saved()).phase,'complete');
  const sent=await track(p);
  assert.deepEqual(sent.map(c=>c[0]),SEQUENCE,'eleven milestones, in order, for one whole visit');
  assert.ok(sent.every(c=>c.length===2&&c[1]===LAB),'each call is (name, lab id) and nothing more');
  for(const secret of ['SECRET','重的不一定沉','第二次實驗','只有兩種液體','larger','density'])assert.ok(!JSON.stringify(sent).includes(secret),secret);
  await stage('complete',{concept:true});
 });
 await step('reload at the finish: still finished, and nothing is announced for a restore',async()=>{
  await p.reload();await p.waitForSelector('#main[data-phase]');
  const r=await info(p);assert.deepEqual([r.phase,r.screen],['complete','complete']);
  const a=await said(p);assert.deepEqual([a.id,a.text,a.writes],[null,'',0]);
  assert.deepEqual(await track(p),[],'restoring the finish sends no lab_complete, nor anything else');
  assert.equal(await p.locator('.bg-claims li').count(),3);
  assert.deepEqual(await stepsNav(),[null,null,null,'step']);
  assert.equal(await txt(p,'#bg-heading'),'浮沉與密度');
  const live=await liveRegions(p);assert.deepEqual(live.attr,['bg-announcer']);
 });
 await step('restart: back to the welcome page, the save is gone, and a reload stays there',async()=>{
  await click(p,'再做一次');
  const r=await info(p);assert.equal(r.phase,'welcome');
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),null,'the save is removed');
  assert.deepEqual(await cta(p),{label:'開始實驗',enabled:true});
  assert.equal(r.active.id,'bg-cta','focus stays on the one button');
  assert.equal(await txt(p,'#bg-heading'),'浮沉實驗');
  assert.equal(await p.locator('#bg-coach').isHidden(),true);
  await p.reload();await p.waitForSelector('#main[data-phase]');
  assert.equal((await info(p)).phase,'welcome');
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),null);
  await click(p,'開始實驗');await click(p,'動手試試看');
  assert.equal((await info(p)).phase,'trial1-test','and the lab can be done again');
  assert.deepEqual(await track(p),[['lab_start',LAB]],'a restart sends nothing; the next real start sends one lab_start');
  const live=await liveRegions(p);assert.deepEqual(live.attr,['bg-announcer']);
 });
 await step('console: no errors and no request left the site',async()=>{clean(s)});
 await s.ctx.close();
}

async function focused(browser){
 // the lab on a keyboard: Enter on the buttons walks the opening, and focus is never left on something that has gone
 await check('1280 keyboard: the opening and the first drop can be done with Enter and Space alone',async()=>{
  const s=await open(browser,{width:1280,height:900});const p=s.page;
  await p.keyboard.press('Tab');await p.keyboard.press('Tab');                                           // skip link, then the start button
  assert.equal((await info(p)).active.id,'bg-cta');await p.keyboard.press('Enter');await settle(p);
  assert.equal((await info(p)).phase,'mission');assert.equal((await info(p)).active.id,'bg-cta','the same button keeps focus: its words changed, it did not go');
  await p.keyboard.press('Enter');await settle(p);
  const r=await info(p);assert.equal(r.phase,'trial1-test');assert.equal(r.active.object,'block');
  await p.keyboard.press('Enter');await settle(p);assert.equal((await info(p)).tank,'block');
  await p.keyboard.press('Space');await settle(p);assert.equal((await info(p)).tank,'');
  clean(s);await s.ctx.close();
 });
 // the same sentence heard twice is two announcements; a redraw alone is none
 await check('1280 announcer: a new event id is spoken again even with the same words; a redraw with no event is not',async()=>{
  const s=await open(browser,{width:1280,height:900});const p=s.page;
  await click(p,'開始實驗');await click(p,'動手試試看');
  const seen=[];
  for(let i=0;i<4;i++){await click(p,'放入水中');seen.push(await said(p));await click(p,'拿出來')}
  assert.deepEqual(seen.map(a=>a.id),['observation-1','observation-2','observation-3','observation-4']);
  assert.equal(seen[0].text,seen[3].text,'drop 1 and drop 4 read the same');
  assert.ok(seen[1].text!==seen[0].text&&seen[2].text!==seen[0].text,'drops 2 and 3 bring a hint with them');
  assert.deepEqual(seen.map(a=>a.writes),[1,2,3,4]);
  const box=await p.locator('[data-bg-tank]').boundingBox(),blk=await p.locator('[data-bg-object=block]').boundingBox();
  await p.mouse.move(blk.x+blk.width/2,blk.y+blk.height/2);await p.mouse.down();await p.mouse.move(20,20,{steps:6});await p.mouse.up();await settle(p);    // a drag that ends outside: the page redraws, nothing happened
  assert.equal((await said(p)).writes,4,'a redraw is not an announcement');
  assert.ok(box.width>0);
  clean(s);await s.ctx.close();
 });
 await check('1280 reload before the first record starts from the welcome page and keeps nothing',async()=>{
  const s=await open(browser,{width:1280,height:900});const p=s.page;
  await click(p,'開始實驗');await click(p,'動手試試看');await click(p,'放入水中');
  await p.reload();await p.waitForSelector('#main[data-phase]');
  assert.equal((await info(p)).phase,'welcome');
  assert.equal(await p.evaluate(()=>localStorage.length+sessionStorage.length),0);
  clean(s);await s.ctx.close();
 });
}

/** Saving, restoring and the notebook's text buffering, each from a real page. Saves are built with the engine and persist.js themselves. */
async function persistence(browser){
 const {pathToFileURL}=require('node:url');
 const load=f=>import(pathToFileURL(path.join(root,'assets/buoyancy-guided',f)).href);
 const [{createInitialState,reduce},{serialize}]=await Promise.all([load('engine.js'),load('persist.js')]);
 const KEY='bhcs-buoyancy-guided:v1';
 const A={start:{type:'START'},begin:{type:'BEGIN'},add:{type:'ADD_BALLAST'},put:{type:'PUT_IN',objectId:'block'},out:{type:'TAKE_OUT'},brine:{type:'SELECT_LIQUID',liquidId:'brine'},rec1:{type:'RECORD_TRIAL',trial:1},rec2:{type:'RECORD_TRIAL',trial:2},next:{type:'CONTINUE'},
  q:(question,answer)=>({type:'ANSWER_COMPARE',question,answer}),wood:{type:'PUT_IN',objectId:'wood'},stone:{type:'PUT_IN',objectId:'stone'},save:fields=>({type:'SAVE_CONCLUSION',fields}),ch:(id,step,choice)=>({type:'ANSWER_CHALLENGE',id,step,choice})};
 const play=(...actions)=>{let st=createInitialState();for(const a of actions){const r=reduce(st,a);if(!r.accepted)throw new Error(`${JSON.stringify(a)} ${r.reason}`);st=r.state}return st};
 const T1=[A.start,A.begin,A.put,A.out,A.add,A.put,A.out,A.add,A.put],R1=[...T1,A.rec1],R2=[...R1,A.brine,A.put,A.out,A.add,A.put,A.rec2],CMP=[...R2,A.next],CMPD=[...CMP,A.q('stayMass','larger'),A.q('firstDrop','float')],
  T3=[...CMPD,A.next],OBS=[...T3,A.wood,A.out,A.stone],CON=[...OBS,A.next],NB=[...CON,A.next],C1=[...NB,A.save({level:'A',relationLiquid:'larger',relationWood:'density'}),A.next],
  C2=[...C1,A.ch(1,'c1-outcome','sink'),A.next],C2S1=[...C2,A.ch(2,'c2-where','under-80')];
 const saved=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),KEY);
 const reload=async p=>{await p.reload();await p.waitForSelector('#main[data-phase]')};
 const inject=async(p,value)=>{await p.evaluate(([k,v])=>localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v)),[KEY,value]);await reload(p)};
 const silent=async p=>{const a=await said(p);assert.deepEqual([a.id,a.text,a.writes],[null,'',0],'a restore announces nothing')};
 const ui=async(p,n)=>{                       // the real clicks, to the named point
  await click(p,'開始實驗');await click(p,'動手試試看');
  await click(p,'放入水中');await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中');await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中');
  await click(p,'記錄第一次結果');if(n==='record1')return;
  await p.locator('input[data-bg-liquid][value="brine"]').check();await click(p,'放入水中');await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中');
  await click(p,'記錄第二次結果');await click(p,'比較兩次');
  await p.locator('input[data-q="stayMass"][value="larger"]').check();await p.locator('input[data-q="firstDrop"][value="float"]').check();await settle(p);
 };
 const sizes=[{width:1280,height:900,touch:false,tag:'1280'},{width:390,height:844,touch:true,tag:'390'}];

 await check('save A: after the first record a reload puts the learner at the start of trial 2, without announcing anything',async()=>{
  const s=await open(browser,sizes[0]);const p=s.page;
  await ui(p,'record1');
  assert.equal((await saved(p)).records['1'].slots,3);
  await reload(p);
  const r=await info(p);assert.deepEqual([r.phase,r.slots,r.liquid,r.tank],['trial2-switch-liquid',3,'water','']);
  assert.deepEqual(await evidenceIds(p),['record-1']);
  assert.equal(await p.locator('input[data-bg-liquid][value="brine"]').isEnabled(),true);
  assert.equal((await coach(p)).main,'第一筆證據有了。接下來只先換一件事。');
  await silent(p);
  await p.locator('input[data-bg-liquid][value="brine"]').check();await click(p,'放入水中');
  assert.equal((await info(p)).phase,'trial2-test','and the lab carries on from there');
  clean(s);await s.ctx.close();
 });
 await check('save B: with the compare answered, a reload shows the compare with the same answers and the button open',async()=>{
  const s=await open(browser,sizes[0]);const p=s.page;
  await ui(p,'compare');
  await reload(p);
  const r=await info(p);assert.deepEqual([r.phase,r.screen],['compare','compare']);
  assert.equal(await p.locator('input[data-q="stayMass"][value="larger"]').isChecked(),true);
  assert.equal(await p.locator('input[data-q="firstDrop"][value="float"]').isChecked(),true);
  assert.deepEqual(await cta(p),{label:'繼續實驗',enabled:true});
  assert.equal(await p.locator('input[data-q]:disabled').count(),6,'what was settled stays settled');
  await silent(p);
  clean(s);await s.ctx.close();
 });
 await check('save C: notebook text typed and left alone for the pause is there after a reload',async()=>{
  const s=await open(browser,sizes[0]);const p=s.page;
  await p.goto(base+PAGE);await inject(p,serialize(play(...NB)));
  assert.equal((await info(p)).phase,'notebook');
  await p.locator('input[data-bg-level][value="B"]').check();
  await p.locator('#bg-nb-free').fill('重的東西不一定沉');await p.waitForTimeout(500);
  await reload(p);
  const r=await info(p);assert.equal(r.phase,'notebook');
  assert.equal(await p.locator('input[data-bg-level][value="B"]').isChecked(),true);
  assert.equal(await p.locator('#bg-nb-free').inputValue(),'重的東西不一定沉');
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:true});
  await silent(p);
  clean(s);await s.ctx.close();
 });
 for(const [way,fire] of [
  ['the field loses focus',p=>p.locator('#bg-nb-free').blur()],
  ['the page is hidden',p=>p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))})],
  ['the page is being left (pagehide)',p=>p.evaluate(()=>window.dispatchEvent(new Event('pagehide')))],
  ['the main button is pressed',async p=>{await p.locator('#bg-nb-free').fill('重的東西不一定沉');await p.locator('input[data-bg-level][value="A"]').check({force:true});await settle(p)}],
 ]){
  await check(`save D: text typed and not yet past the pause is kept when ${way}`,async()=>{
   const s=await open(browser,sizes[0]);const p=s.page;
   await p.goto(base+PAGE);await inject(p,serialize(play(...NB)));
   await p.locator('input[data-bg-level][value="B"]').check();
   await p.locator('#bg-nb-free').fill('重的東西不一定沉');
   await fire(p);
   assert.equal((await saved(p)).conclusion.freeText,'重的東西不一定沉','saved right away, before the 300 ms pause could have passed');
   await reload(p);
   assert.equal(await p.locator('#bg-nb-free').inputValue(),'重的東西不一定沉');
   clean(s);await s.ctx.close();
  });
 }
 await check('save D: pressing the main button right after typing counts the new words (the button is judged after the text is passed on)',async()=>{
  const s=await open(browser,sizes[0]);const p=s.page;
  await p.goto(base+PAGE);await inject(p,serialize(play(...NB)));
  await p.locator('input[data-bg-level][value="B"]').check();
  await p.locator('#bg-nb-free').fill('重的東西不一定沉');
  await p.getByRole('button',{name:'進入挑戰題',exact:true}).click();await settle(p);
  assert.equal((await info(p)).phase,'challenge-1','the click came after the text was passed on');
  clean(s);await s.ctx.close();
 });
 await check('save D: the main button is judged after the text is passed on, even when it is pressed without the field losing focus',async()=>{
  const s=await open(browser,sizes[0]);const p=s.page;
  await p.goto(base+PAGE);await inject(p,serialize(play(...NB,A.save({level:'B',freeText:'重的東西不一定沉'}))));
  assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:true});
  await p.locator('#bg-nb-free').fill('');                                       // the words are being deleted; the page has not heard yet
  assert.equal((await cta(p)).enabled,true,'the page has not heard yet');
  await p.evaluate(()=>document.getElementById('bg-cta').click());await settle(p);   // pressed with no blur (a switch device, an access key)
  assert.equal((await info(p)).phase,'notebook','the empty notebook is not let through');
  assert.equal((await cta(p)).enabled,false);
  clean(s);await s.ctx.close();
 });
 await check('save E: a half-finished challenge comes back with its solved step locked, judged again, not trusted',async()=>{
  const s=await open(browser,sizes[0]);const p=s.page;
  await p.goto(base+PAGE);await inject(p,serialize(play(...C2S1)));
  let r=await info(p);assert.equal(r.phase,'challenge-2');
  assert.equal(await p.locator('[data-bg-step="c2-where"]').getAttribute('data-solved'),'true');
  assert.equal(await p.locator('[data-bg-step="c2-where"] [data-bg-option]:not(:disabled)').count(),0);
  assert.equal(await p.locator('[data-bg-step="c2-brine"] [data-bg-option]:not(:disabled)').count(),3);
  assert.equal(await p.locator('[data-bg-step="c2-where"] [aria-pressed="true"]').getAttribute('data-bg-option'),'under-80');
  await silent(p);
  const forged=JSON.parse(serialize(play(...C2S1)));
  forged.challenges['2']['c2-where']={choice:'all-out',attempts:1,correct:true,allCorrect:true};forged.phase='challenge-2';
  await inject(p,forged);
  assert.equal(await p.locator('[data-bg-step="c2-where"]').getAttribute('data-solved'),'false','"correct" in the save is not believed');
  assert.equal(await p.locator('[data-bg-step]').count(),1,'and the second step stays shut');
  assert.equal(await p.locator('[data-bg-step="c2-where"]').getAttribute('data-attempts'),'1');
  clean(s);await s.ctx.close();
 });
 await check('save H: a save that claims the finish but whose compare is wrong lands on the compare, with nothing downstream',async()=>{
  const s=await open(browser,sizes[0]);const p=s.page;
  await p.goto(base+PAGE);
  const forged=JSON.parse(serialize(play(...CON,A.next,A.save({level:'A',relationLiquid:'larger',relationWood:'density'}))));
  forged.phase='complete';forged.compare.stayMass='smaller';
  await inject(p,forged);
  const r=await info(p);assert.deepEqual([r.phase,r.screen],['compare','compare']);
  assert.equal(await p.locator('input[data-q="stayMass"][value="smaller"]').isChecked(),true);
  assert.deepEqual(await cta(p),{label:'繼續實驗',enabled:false});
  assert.ok(!(await allText(p)).includes('我的研究手冊'));
  await silent(p);
  await inject(p,'{"v":2}');assert.equal((await info(p)).phase,'welcome');
  await inject(p,'not json at all');assert.equal((await info(p)).phase,'welcome');
  await inject(p,{v:1,records:{1:{liquidId:'water',slots:5,dropCount:1}},phase:'complete'});assert.equal((await info(p)).phase,'welcome');
  clean(s);await s.ctx.close();
 });
 await check('save I: storage that refuses everything cannot stop the lab; a quiet note says progress is not kept',async()=>{
  const ctx=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  const external=[];await guardContext(ctx,base,{hook:false,external});
  await ctx.addInitScript(()=>{const boom=()=>{throw new DOMException('blocked','SecurityError')};for(const m of ['getItem','setItem','removeItem','clear'])Storage.prototype[m]=boom});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.goto(base+PAGE);await p.waitForSelector('#main[data-phase]');
  assert.equal((await info(p)).phase,'welcome');
  assert.equal(await p.locator('#bg-storage-note').innerText(),'這台裝置不能儲存進度。');
  assert.equal(await p.locator('[role=dialog],[role=alertdialog],dialog').count(),0,'a note, not a dialog');
  await ui(p,'record1');
  assert.equal((await info(p)).phase,'trial2-switch-liquid','the lab goes on');
  assert.equal(await p.locator('#bg-storage-note').isVisible(),true);
  await p.locator('input[data-bg-liquid][value="brine"]').check();await click(p,'放入水中');
  assert.equal((await info(p)).phase,'trial2-test');
  await noFormal(p,'blocked storage');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await ctx.close();
 });
 await check('save J: a restore sends no milestone; the first real step after it sends exactly its own',async()=>{
  const s=await open(browser,sizes[0]);const p=s.page;
  await p.goto(base+PAGE);
  await inject(p,serialize(play(...CMPD)));
  assert.equal((await info(p)).phase,'compare');assert.deepEqual(await track(p),[],'restoring the compare sends nothing');
  await click(p,'繼續實驗');
  assert.deepEqual(await track(p),[['compare_complete',LAB]],'the first real step brings its own milestone');
  await inject(p,serialize(play(...NB,A.save({level:'B',freeText:'重的東西不一定沉'}))));
  assert.equal((await info(p)).phase,'notebook');assert.deepEqual(await track(p),[],'restoring the notebook sends nothing');
  await p.getByRole('button',{name:'進入挑戰題',exact:true}).click();await settle(p);
  assert.deepEqual(await track(p),[['notebook_complete',LAB]]);
  await inject(p,serialize(play(...C2S1)));
  assert.equal((await info(p)).phase,'challenge-2');assert.deepEqual(await track(p),[],'restoring a challenge sends nothing');
  await p.locator('[data-bg-option="less"]').click();await settle(p);
  assert.deepEqual(await track(p),[],'an answer is not a milestone');
  await click(p,'下一個挑戰');
  assert.deepEqual(await track(p),[['challenge_complete',LAB]]);
  await inject(p,serialize(play(...C2,A.ch(2,'c2-where','under-80'),A.ch(2,'c2-brine','less'),A.next,A.ch(3,'c3-reason','volume-spread'))));
  assert.equal((await info(p)).phase,'challenge-3');assert.deepEqual(await track(p),[]);
  await click(p,'看看我完成了什麼');
  assert.deepEqual(await track(p),[['challenge_complete',LAB],['lab_complete',LAB]],'the finish sends its two, once');
  assert.equal((await said(p)).id,'complete');
  clean(s);await s.ctx.close();
 });
 for(const adapter of ['absent','throw']){
  await check(`adapter ${adapter}: the lab runs on, with no error on the page`,async()=>{
   const s=await open(browser,{...sizes[0],adapter});const p=s.page;
   await ui(p,'record1');
   assert.equal((await info(p)).phase,'trial2-switch-liquid');
   await p.locator('input[data-bg-liquid][value="brine"]').check();await click(p,'放入水中');
   assert.equal((await info(p)).phase,'trial2-test','and the lab carries on');
   const events=await track(p);
   if(adapter==='throw')assert.deepEqual(events.map(c=>c[0]),['lab_start','trial_recorded'],'the adapter was called, failed, and nothing else noticed');
   else assert.equal(events,null,'there was no adapter to call');
   assert.equal((await saved(p)).records['1'].slots,3,'and saving is not affected either');
   clean(s);await s.ctx.close();
  });
 }
 for(const size of sizes){
  await check(`${size.tag} restore: notebook levels B and C come back as written, with the button, and pass axe`,async()=>{
   const s=await open(browser,size);const p=s.page;
   await p.goto(base+PAGE);
   await inject(p,serialize(play(...NB,A.save({level:'B',freeText:'重的東西不一定沉'}))));
   assert.equal(await p.locator('#bg-nb-free').inputValue(),'重的東西不一定沉');
   assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:true});
   await silent(p);
   await stageOf(p,size.tag,'restored notebook B',{concept:true});
   await inject(p,serialize(play(...NB,A.save({level:'C',evidenceText:'第二次實驗',limitationText:'只有兩種液體'}))));
   assert.equal(await p.locator('#bg-nb-evidence').inputValue(),'第二次實驗');
   assert.equal(await p.locator('#bg-nb-limit').inputValue(),'只有兩種液體');
   assert.equal(await p.locator('[data-bg-ideas]').isVisible(),true);
   assert.deepEqual(await cta(p),{label:'進入挑戰題',enabled:true});
   await stageOf(p,size.tag,'restored notebook C',{concept:true});
   clean(s);await s.ctx.close();
  });
 }
}

(async()=>{
 await new Promise(r=>server.listen(0,r));base=`http://localhost:${server.address().port}`;
 const exe=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
 const browser=await chromium.launch(exe?{executablePath:exe}:{});
 try{
  await walk(browser,{width:1280,height:900,touch:false,tag:'1280'});
  await walk(browser,{width:390,height:844,touch:true,tag:'390'});
  await focused(browser);
  await persistence(browser);
 }finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);
 console.log(JSON.stringify({checked:results.length,failed:failed.length,output:OUT}));
 process.exit(failed.length?1:0);
})();
