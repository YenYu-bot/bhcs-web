// I6 gate (pure part): saving and restoring progress (assets/optics-guided/persist.js). No DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {reduce,createInitialState,deriveView,PHASES} from '../assets/optics-guided/engine.js';
import {serialize,restore,createStore,STORAGE_KEY,SCHEMA_VERSION} from '../assets/optics-guided/persist.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const mS=position=>({type:'MOVE_SCREEN',position}),mC=position=>({type:'MOVE_CANDLE',position}),settle={type:'SETTLE_SCREEN'};
const run=(state,...actions)=>{for(const a of actions.flat())state=reduce(state,a).state;return state};
const at=p=>[mS(p),settle];
const T1=[{type:'START'},{type:'BEGIN'},mS(14.5),{type:'RECORD'}];
const T2=[mC(15),mS(29.5),{type:'RECORD'}];
const CMP=[{type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'}];
const T3=[{type:'CONTINUE'},mC(5),...at(8),...at(20),...at(35),{type:'CONFIRM_NO_REAL_IMAGE'}];
const NB=[{type:'VIEW_THROUGH_LENS'},{type:'CONTINUE'},{type:'CONTINUE'}];
const ready=[{type:'SAVE_CONCLUSION',fields:{level:'A',relationPosition:'farther',relationSize:'larger',freeText:'我的話'}}];
const roundTrip=state=>restore(JSON.parse(JSON.stringify(serialize(state))));
const phases={};
const stage=(name,...actions)=>{phases[name]=run(createInitialState(),...actions);return phases[name]};
stage('fresh');stage('trial1',{type:'START'},{type:'BEGIN'},mS(16));stage('t1done',...T1);stage('t2find',...T1,mC(15));stage('compare',...T1,...T2);stage('compareOk',...T1,...T2,...CMP);
stage('t3move',...T1,...T2,...CMP,{type:'CONTINUE'});stage('t3search',...T1,...T2,...CMP,{type:'CONTINUE'},mC(5),...at(8));stage('t3reveal',...T1,...T2,...CMP,...T3);
stage('concept',...T1,...T2,...CMP,...T3,{type:'VIEW_THROUGH_LENS'},{type:'CONTINUE'});stage('notebook',...T1,...T2,...CMP,...T3,...NB);stage('notebookReady',...T1,...T2,...CMP,...T3,...NB,...ready);

test('serialize keeps progress only: no positions, hints or zone tracking; JSON-safe',()=>{
 const saved=serialize(phases.notebookReady);
 assert.deepEqual(Object.keys(saved).sort(),['challenges','compare','conclusion','phase','records','version']);
 assert.equal(saved.version,SCHEMA_VERSION);assert.equal(STORAGE_KEY,'bhcs-lens-guided:v1');
 assert.deepEqual(saved.records[1],{f:10,u:30,observed:14.5,zones:undefined});
 assert.equal(JSON.stringify(saved).includes('hints'),false);assert.ok(!/NaN|Infinity/.test(JSON.stringify(saved)));
 assert.deepEqual(saved.records[3].zones,['near','middle','far']);
});

test('resume points: a trial restarts cleanly, finished work is never lost',()=>{
 const table=[['fresh',null],['trial1',null],['t1done','trial2-move-object'],['t2find','trial2-move-object'],['compare','compare'],['compareOk','compare'],['t3move','trial3-move-object'],['t3search','trial3-move-object'],
  ['t3reveal','trial3-no-real-screen-image'],['concept','concept'],['notebook','notebook'],['notebookReady','notebook']];
 for(const [name,expected] of table){
  const r=roundTrip(phases[name]);
  if(expected===null){assert.equal(r,null,name);continue}
  assert.equal(r.phase,expected,name);
  assert.deepEqual(r.records[1],phases[name].records[1],name+': record 1 identical (rebuilt from the model)');
  if(phases[name].records[2])assert.deepEqual(r.records[2],phases[name].records[2]);
  if(phases[name].records[3])assert.deepEqual(r.records[3],phases[name].records[3]);
  assert.ok(PHASES.includes(r.phase));assert.ok(!/NaN|Infinity/.test(JSON.stringify(r)));
  // the restored state is playable: the engine accepts the next legitimate action
  assert.ok(deriveView(r));
 }
 // exact resume geometry
 const r2=roundTrip(phases.t1done);assert.deepEqual([r2.u,r2.s],[30,14.5],'Trial 2 starts with the screen where the learner left it');
 const r3=roundTrip(phases.t3search);assert.deepEqual([r3.u,r3.s],[15,29.5]);assert.deepEqual(r3.search,{zones:[],ctaUnlocked:false});
 const rc=roundTrip(phases.compareOk);assert.deepEqual(rc.compare,{position:'farther',size:'larger'},'compare answers survive');
 const rn=roundTrip(phases.notebookReady);assert.deepEqual(rn.conclusion,phases.notebookReady.conclusion);
 assert.equal(run(r2,mC(15)).phase,'trial2-find-screen','resumed Trial 2 works');
 assert.equal(run(roundTrip(phases.compareOk),{type:'CONTINUE'}).phase,'trial3-move-object');
});

test('challenge progress resumes at the first open challenge; completion survives',()=>{
 const ch1=run(phases.notebookReady,{type:'CONTINUE'});
 const open2=run(ch1,{type:'ANSWER_CHALLENGE',id:1,step:'adjust',choice:'candle'},{type:'ANSWER_CHALLENGE',id:1,step:'adjust',choice:'screen'},{type:'CONTINUE'},{type:'ANSWER_CHALLENGE',id:2,step:'project',choice:'no'});
 const r=roundTrip(open2);assert.equal(r.phase,'challenge-2');
 assert.deepEqual(r.challenges[1].steps.adjust,{choice:'screen',correct:true,attempts:2});assert.deepEqual(r.challenges[2].steps.project,{choice:'no',correct:true,attempts:1});
 const all=run(open2,{type:'ANSWER_CHALLENGE',id:2,step:'kind',choice:'virtual'},{type:'CONTINUE'},{type:'ANSWER_CHALLENGE',id:3,step:'why',choice:'virtual'},{type:'SAVE_CHALLENGE_NOTE',id:3,text:'我的說法'},{type:'CONTINUE'});
 assert.equal(all.phase,'complete');const done=roundTrip(all);assert.equal(done.phase,'complete');assert.equal(done.challenges[3].note,'我的說法');
 // saved at a later phase than the data supports → fall back to the first open place
 const forged=serialize(all);forged.challenges[2].steps.kind.choice='real-small';assert.equal(restore(forged).phase,'challenge-2','correctness is re-judged, a forged flag changes nothing');
 const noNotebook=serialize(open2);noNotebook.conclusion={level:'A',relationPosition:null,relationSize:null,freeText:'',evidenceText:'',limitationText:''};assert.equal(restore(noNotebook).phase,'notebook');
});

test('untrusted data: tampered, malformed or foreign saves never produce a broken state',()=>{
 const good=serialize(phases.notebookReady);
 const mut=f=>{const c=structuredClone(good);f(c);return c};
 for(const bad of [null,undefined,'x',42,[],{},{version:2,phase:'notebook'},{...good,version:'1'},{...good,phase:'nowhere'},{...good,records:null},
  mut(c=>{c.records[1].observed=NaN}),mut(c=>{c.records[1].observed='14.5'}),mut(c=>{c.records[1].f=-3}),mut(c=>{c.records[1].u=0}),
  mut(c=>{c.records[1].observed=22}),    // not a sharp position for f=10, u=30: this was never a real record
  mut(c=>{c.records[1]=null})]){assert.equal(restore(bad),null,JSON.stringify(bad)?.slice(0,60))}
 // damaged later pieces are dropped, earlier ones kept
 const noR2=mut(c=>{c.records[2]=null;c.records[3]=null});assert.equal(restore(noR2).phase,'trial2-move-object');
 const badR2=mut(c=>{c.records[2].observed=5});assert.equal(restore(badR2).phase,'trial2-move-object','record 2 off the bench is discarded');
 // numbers are recomputed from f/u, never taken from the save
 const lie=mut(c=>{c.records[1].theoreticalV=99;c.records[1].magnification=9;c.records[1].clarity=7});const r=restore(lie);assert.equal(r.records[1].theoreticalV,15);assert.equal(r.records[1].clarity,1);
 // text and enums
 const loud=mut(c=>{c.conclusion.freeText='z'.repeat(9000);c.conclusion.level='X';c.conclusion.relationPosition='sideways';c.challenges[3]={note:'n'.repeat(9999),steps:{why:{choice:'virtual',correct:false,attempts:-5}}}});
 const rl=restore(loud);assert.ok(rl);assert.equal(rl.conclusion.freeText.length,1000,'text capped');assert.equal(rl.conclusion.level,null,'bad level dropped');assert.equal(rl.conclusion.relationPosition,null);
 assert.equal(rl.challenges[3].note.length,1000);assert.deepEqual(rl.challenges[3].steps.why,{choice:'virtual',correct:true,attempts:1});
 const junk=mut(c=>{c.conclusion={level:'A',__proto__:{x:1},evil:'<script>',freeText:{a:1}};c.compare={position:'up',size:7}});
 const rj=restore(junk);assert.ok(rj);assert.equal('evil' in rj.conclusion,false);assert.equal(rj.conclusion.freeText,'');assert.deepEqual(rj.compare,{position:null,size:null});
 assert.equal(({}).x,undefined,'no prototype pollution');
});

test('guided identity: a record the flow can never produce is rejected, even if it is physically sharp (f / u / zones / image type)',()=>{
 const good=serialize(phases.notebookReady);
 const mut=f=>{const c=structuredClone(good);f(c);return c};
 // 1. Trial 1 sharp but a different experiment → no progress at all
 for(const [f,u,observed] of [[5,10,10],[10,20,20],[10,30.5,15.25],[20,40,40]]){
  const forged=mut(c=>{c.records[1]={f,u,observed}});assert.equal(restore(forged),null,`trial 1 f=${f} u=${u}`);
 }
 // the same numbers really are sharp for their own lens, so only the identity check can reject them
 assert.equal(deriveView(run(createInitialState(),{type:'START'},{type:'BEGIN'})).clarity.effectiveClarityLevel,3);
 // 2. Trial 2 sharp but u != 15 → record 2 (and 3) dropped, back to Trial 2
 for(const u of [20,12,14.5,30]){const r=restore(mut(c=>{c.records[2]={f:10,u,observed:u===12?60:u}}));assert.ok(r,'u='+u);assert.equal(r.phase,'trial2-move-object','u='+u);assert.equal(r.records[2],null);assert.equal(r.records[3],null)}
 assert.equal(restore(mut(c=>{c.records[2].f=12})).phase,'trial2-move-object','wrong focal length');
 // 3. Trial 3: wrong object distance, or a search that is not finished
 for(const [name,f] of [['u = 7',c=>{c.records[3].u=7}],['u = 10 (focus)',c=>{c.records[3].u=10}],['u = 4',c=>{c.records[3].u=4}],['zones missing far',c=>{c.records[3].zones=['near','middle']}],['no zones',c=>{c.records[3].zones=[]}],['zones absent',c=>{delete c.records[3].zones}],['zones junk',c=>{c.records[3].zones=['x','y','z']}],['wrong f',c=>{c.records[3].f=15}]]){
  const r=restore(mut(f));assert.ok(r,name);assert.equal(r.records[3],null,name);assert.ok(['trial3-move-object','compare'].includes(r.phase),name+' → '+r.phase);
  assert.ok(!['trial3-no-real-screen-image','concept','notebook','challenge-1','complete'].includes(r.phase),name);
 }
 // 4. a Trial 3 that is a real image, or that claims an observed screen position
 for(const [name,f] of [['real image u=15',c=>{c.records[3].u=15}],['real image u=25',c=>{c.records[3].u=25}],['observed position present',c=>{c.records[3].observed=30}],['observed 0',c=>{c.records[3].observed=0}]]){
  const r=restore(mut(f));assert.equal(r.records[3],null,name);assert.ok(!['concept','notebook','complete'].includes(r.phase),name+' → '+r.phase);
 }
 // the genuine record still restores, and the constants come from the engine (not retyped in persist.js)
 const ok=restore(good);assert.equal(ok.records[3].u,5);assert.deepEqual(ok.records[3].search.searchedZones,['near','middle','far']);assert.equal(ok.phase,'notebook');
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/optics-guided/persist.js',import.meta.url)),'utf8').replace(/\/\/.*$/gm,'');
 assert.deepEqual([...src.matchAll(/(?<![\w.'"-])(?:5|10|15|30)(?![\w'"])/g)].map(m=>m[0]),[],'no retyped 10/30/15/5: the guided identity comes from the engine constants');
});

test('Level A progress is not trusted either: a saved wrong relation resumes at the notebook, not in the challenges',()=>{
 const forged=serialize(run(phases.notebookReady,{type:'CONTINUE'}));      // saved in challenge-1 with a valid conclusion
 assert.equal(restore(forged).phase,'challenge-1');
 forged.conclusion.relationPosition='closer';
 assert.equal(restore(forged).phase,'notebook','Level A that contradicts the records sends the learner back to fix it');
 forged.conclusion={...forged.conclusion,level:'B',freeText:'我的話'};assert.equal(restore(forged).phase,'challenge-1','free-text levels are unaffected');
});

test('store: guarded storage calls, own key only, no legacy keys',()=>{
 const log=[];const mem=new Map();
 const storage={getItem:k=>{log.push(['get',k]);return mem.get(k)??null},setItem:(k,v)=>{log.push(['set',k]);mem.set(k,v)},removeItem:k=>{log.push(['remove',k]);mem.delete(k)}};
 mem.set('bhcs-science-v2-optics','LEGACY');mem.set('bhcs-science-v2-optics-draft','DRAFT');
 const store=createStore({storage});
 assert.equal(store.load(),null);assert.equal(store.save(phases.t1done),true);
 const set=log.filter(l=>l[0]==='set');assert.deepEqual(set,[['set',STORAGE_KEY]]);
 assert.equal(restore(store.load()).phase,'trial2-move-object');
 const n=log.length;store.save(phases.t1done);assert.equal(log.length,n,'an unchanged save writes nothing');
 store.clear();assert.equal(mem.has(STORAGE_KEY),false);
 assert.equal(mem.get('bhcs-science-v2-optics'),'LEGACY');assert.equal(mem.get('bhcs-science-v2-optics-draft'),'DRAFT');
 assert.ok(log.every(l=>l[1]===STORAGE_KEY),'never touches another key: '+JSON.stringify(log));
 // hostile environments
 const full=createStore({storage:{getItem(){return null},setItem(){throw new DOMException('quota','QuotaExceededError')},removeItem(){throw new Error('x')}}});
 assert.equal(full.save(phases.t1done),false);assert.equal(full.failed,true);assert.equal(full.clear(),false);
 const blocked=createStore({storage:null});assert.equal(blocked.load(),null);assert.equal(blocked.save(phases.t1done),false);
 const corrupt=createStore({storage:{getItem(){return '{not json'},setItem(){},removeItem(){}}});assert.equal(corrupt.load(),null);
 const throwingGet=createStore({storage:{getItem(){throw new Error('denied')},setItem(){},removeItem(){}}});assert.equal(throwingGet.load(),null);
});

console.log(`PASS optics guided persist: ${tests} tests`);
