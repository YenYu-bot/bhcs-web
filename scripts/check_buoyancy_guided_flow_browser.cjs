// B5 gate (real browser part): a learner walks the guided buoyancy lab from the welcome page to the concept screen,
// using only the page: buttons, the liquid choice, the compare answers. No state is injected for the main walk.
// Checks the teaching words, the evidence, the compare card, the one live region, focus, layout order at 1280 and 390,
// the pre-concept vocabulary and axe at every stage. Notebook, challenges and completion belong to the next increment.
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
 active:a?{id:a.id,object:a.dataset.bgObject||null,action:a.dataset.bgAction||null,liquid:a.dataset.bgLiquid!==undefined?a.value:null,q:a.dataset.q||null,value:a.dataset.bgCompare!==undefined?a.value:null}:null,
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
 inside:['bg-coach','bg-status','bg-hint','bg-data','bg-evidence','bg-compare','bg-concept'].filter(id=>document.getElementById(id).closest('[aria-live]')),
 announcer:{live:document.getElementById('bg-announcer').getAttribute('aria-live'),atomic:document.getElementById('bg-announcer').getAttribute('aria-atomic')}}));

const shot=async(p,name,tag)=>{fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,`${tag}-${name}.png`),fullPage:true})};
async function open(browser,{width,height,touch=false}){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
 const external=[];await guardContext(ctx,base,{hook:false,external});        // no test hook: the walk uses the page the learner has
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base+PAGE);await page.waitForSelector('#main[data-phase]');
 return {ctx,page,errors,external};
}
const clean=({errors,external})=>{assert.deepEqual(errors,[]);assert.deepEqual(external,[])};

let base;const results=[];
const check=async(name,fn)=>{const row={name};try{await fn();row.pass=true}catch(e){row.pass=false;row.error=e.message}results.push(row);console.log(JSON.stringify(row));return row.pass};

/** The whole walk at one viewport. Each step is its own result; the first failure stops the walk (later steps would only repeat it). */
async function walk(browser,{width,height,touch,tag}){
 const s=await open(browser,{width,height,touch});const p=s.page;
 let broken=false;
 const step=async(name,fn)=>{if(broken)return;const ok=await check(`${tag} ${name}`,fn);if(!ok)broken=true};
 // common to every stage: the vocabulary rule, one live region, nothing sideways, axe
 const stage=async(label,{concept=false}={})=>{
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
 };

 await step('welcome: the question, the line under it, one button; no coach card, no side cards',async()=>{
  assert.equal(await txt(p,'#bg-welcome-title'),'物體很重，就一定會沉下去嗎？');
  assert.equal(await txt(p,'#bg-welcome-sub'),'接下來你會親手把東西放進水裡，自己找出答案。');
  assert.deepEqual(await cta(p),{label:'開始實驗',enabled:true});
  assert.equal(await p.locator('#bg-coach').isHidden(),true);assert.equal(await p.locator('#bg-side').isHidden(),true);
  assert.equal(await txt(p,'#bg-heading'),'浮沉實驗');
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
  const r=await info(p);assert.deepEqual([r.phase,r.screen,r.active.id],['concept','concept','bg-concept-title']);
  assert.equal(await cta(p),null,'this stage ends here');
  assert.deepEqual(await coach(p),{main:'剛才幾次實驗，其實都在比較同一件事。',sub:'先看看是什麼。',tip:'',visible:true});
  assert.equal(await txt(p,'#bg-heading'),'浮沉與密度');
  assert.equal(await p.locator('#bg-bench-card').isHidden(),true);
  const lines=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-concept-card=density] [data-bg-line]')].map(l=>l.textContent));
  assert.deepEqual(lines,['停在水中的方塊：100 g ÷ 100 cm³ = 1.0 g/cm³','停在濃鹽水中的方塊：120 g ÷ 100 cm³ = 1.2 g/cm³','大木塊：300 g ÷ 500 cm³ = 0.6 g/cm³','小石頭：120 g ÷ 40 cm³ = 3.0 g/cm³']);
  assert.equal(await txt(p,'[data-bg-formula] .bg-formula'),'ρ = m ÷ V');
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
 await check('1280 reload starts the lab again from the welcome page (nothing is stored in this stage)',async()=>{
  const s=await open(browser,{width:1280,height:900});const p=s.page;
  await click(p,'開始實驗');await click(p,'動手試試看');await click(p,'放入水中');
  await p.reload();await p.waitForSelector('#main[data-phase]');
  assert.equal((await info(p)).phase,'welcome');
  assert.equal(await p.evaluate(()=>localStorage.length+sessionStorage.length),0);
  clean(s);await s.ctx.close();
 });
}

(async()=>{
 await new Promise(r=>server.listen(0,r));base=`http://localhost:${server.address().port}`;
 const exe=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
 const browser=await chromium.launch(exe?{executablePath:exe}:{});
 try{
  await walk(browser,{width:1280,height:900,touch:false,tag:'1280'});
  await walk(browser,{width:390,height:844,touch:true,tag:'390'});
  await focused(browser);
 }finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);
 console.log(JSON.stringify({checked:results.length,failed:failed.length,output:OUT}));
 process.exit(failed.length?1:0);
})();
