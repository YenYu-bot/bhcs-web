import assert from 'node:assert/strict';
export const normalizeSig = s => String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, '').normalize('NFKC');
export function seedFor(text) {let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function auditCombination({unit,ctx,uiMax,safeQuestion,contentGuard=()=>true,resetRandom,seed}) {
 const result={seed,uiMax,bankSize:null,bankDeclared:Object.hasOwn(unit,'bankSize'),
  raw:{calls:0,returned:0,nulls:0,verifyFalse:0,exceptions:0,invalid:0,distinct:0,guardRejected:0,examples:[]},
  sampling:{requested:200,produced:0,exhaustedAt:[],examples:[]},
  paper:{requested:0,produced:0,attempts:0,candidateNulls:0,candidateVerifyFalse:0,candidateExceptions:0,candidateGuardRejected:0,exhaustedAt:null,duplicates:0,examples:[]},issues:[],warnings:[],samples:[],pass:false};
 const issue=(code,detail)=>{if(!result.issues.some(x=>x.code===code))result.issues.push({code,detail});};
 const example=(target,code,q,detail)=>{if(target.examples.filter(x=>x.code===code).length<3)target.examples.push({code,...(q?{expr:q.expr,answer:q.answer,sig:q.sig}:{}),detail});};
 if(!Number.isInteger(uiMax)||uiMax<1)throw Error('UI maximum is missing or invalid');
 if(result.bankDeclared)try{const n=typeof unit.bankSize==='function'?unit.bankSize(ctx):unit.bankSize;if(n==null)result.bankDeclared=false;else if(!Number.isSafeInteger(n)||n<1)issue('invalid_bank_size','bankSize must resolve to a positive safe integer or null when the combination is not finite');else result.bankSize=n;}catch(e){issue('bank_size_exception',e.message);}
 // Instrument candidates inside the engine's real 50-attempt safeQuestion loop.
 // Null is diagnostic only. Exceptions and failed verifications remain visible even when retried.
 function observer(target,paper=false){return {...unit,gen(c){
  target[paper?'attempts':'calls']++;
  try{const q=unit.gen(c);
   if(q==null){target[paper?'candidateNulls':'nulls']++;return q;}
   if(!paper)target.returned++;
   if(typeof q.sig!=='string'||!q.sig.trim()||typeof q.expr!=='string'||!q.expr||typeof q.answer!=='string'||!q.answer||/\b(?:NaN|undefined|Infinity)\b/.test(q.expr+q.answer)){
    if(!paper)target.invalid++;issue(paper?'paper_candidate_invalid':'raw_invalid_question','Invalid non-null candidate');example(target,'invalid_question',q);
   }
   if(typeof q.verify!=='function'||q.verify()!==true){target[paper?'candidateVerifyFalse':'verifyFalse']++;example(target,'verify_false',q);}
   else if(!contentGuard(q,ctx.level)){target[paper?'candidateGuardRejected':'guardRejected']++;example(target,'content_guard_rejected',q);}
   return q;
  }catch(e){target[paper?'candidateExceptions':'exceptions']++;example(target,'exception',null,e.message);throw e;}
 }};}
 const distinct=new Set();resetRandom(seed);const observed=observer(result.raw);
 for(let i=0;i<200;i++){
  let q;try{q=safeQuestion(observed,ctx,new Set());}catch(e){issue('sampling_exception',e.message);continue;}
  if(q==null){result.sampling.exhaustedAt.push(i+1);issue('sampling_generation_exhausted',`50-attempt limit at independent sample ${i+1}`);continue;}
  result.sampling.produced++;
  if(typeof q.sig!=='string'||!q.sig.trim())issue('sampling_missing_sig',`sample ${i+1}`);else distinct.add(normalizeSig(q.sig));
  try{if(typeof q.verify!=='function'||q.verify()!==true)issue('sampling_accepted_verify_false',`sample ${i+1}`);}catch(e){issue('sampling_accepted_verify_exception',e.message);}
  if(!contentGuard(q,ctx.level))issue('sampling_accepted_guard_failure',`sample ${i+1}`);
  if(result.samples.length<3)result.samples.push({expr:q.expr,answer:q.answer,sig:q.sig});
 }
 result.raw.distinct=distinct.size;
 result.raw.rejectionRate=result.raw.calls?result.raw.nulls/result.raw.calls:0;
 if(result.raw.rejectionRate>0.5)result.warnings.push({code:'high_null_rejection_rate',rate:result.raw.rejectionRate,detail:'Non-blocking: gen nulls / all gen calls during 200 independent safeQuestion samples'});
 if(result.raw.exceptions)issue('raw_exception',`${result.raw.exceptions} exceptions inside safeQuestion retries`);
 if(result.raw.verifyFalse)issue('raw_verify_false',`${result.raw.verifyFalse} failed candidate verifications inside safeQuestion retries`);
 if(result.bankSize!==null&&distinct.size!==result.bankSize)issue('bank_coverage',`${distinct.size} accepted distinct sig values sampled; declared ${result.bankSize}`);
 result.paper.requested=result.bankSize===null?uiMax:Math.min(uiMax,result.bankSize);
 resetRandom(seedFor(`${seed}/paper`));const seen=new Set(),returned=new Set(),paperUnit=observer(result.paper,true);
 for(let i=0;i<result.paper.requested;i++){
  let q;try{q=safeQuestion(paperUnit,ctx,seen);}catch(e){issue('paper_exception',e.message);break;}
  if(q==null){result.paper.exhaustedAt=i+1;const detail=`safeQuestion returned null at ${i+1}/${result.paper.requested} after 50 attempts`;if(result.bankSize===null)issue('undeclared_bank_or_generation_exhausted',detail);else result.warnings.push({code:'declared_bank_generation_exhausted',detail});break;}
  if(typeof q.sig!=='string'||!q.sig.trim()){issue('paper_missing_sig',`question ${i+1}`);break;}
  const sig=normalizeSig(q.sig);if(returned.has(sig)){result.paper.duplicates++;issue('paper_duplicate',sig);}returned.add(sig);
  try{if(typeof q.verify!=='function'||q.verify()!==true)issue('paper_accepted_verify_false',sig);}catch(e){issue('paper_accepted_verify_exception',e.message);}
  if(!contentGuard(q,ctx.level))issue('paper_accepted_guard_failure',sig);
  result.paper.produced++;
 }
 if(result.paper.candidateExceptions)issue('paper_candidate_exception',`${result.paper.candidateExceptions} exceptions filtered by safeQuestion`);
 if(result.paper.candidateVerifyFalse)issue('paper_candidate_verify_false',`${result.paper.candidateVerifyFalse} verify failures filtered by safeQuestion`);
 result.pass=result.issues.length===0;return result;
}
export function checkHarnessContract(){
 const safeQuestion=(u,ctx,seen)=>{for(let i=0;i<50;i++)try{const q=u.gen(ctx);if(!q||!q.verify())continue;const key=normalizeSig(q.sig);if(seen.has(key))continue;seen.add(key);return q;}catch{}return null;};
 function run({declared,actual=1000,fault}){let i=0,n=0;const unit={gen(){i++;if(fault==='null'||fault==='high-null'&&i%4!==0)return null;if(fault==='throw')throw Error('fixture exception');n++;return{expr:`q${n%actual}`,answer:'1',sig:`q${n%actual}`,verify:()=>fault!=='verify'};}};if(declared!==undefined)unit.bankSize=declared;return auditCombination({unit,ctx:{},uiMax:40,safeQuestion,seed:1,resetRandom(){i=0;n=0;}});}
 const small=run({declared:8,actual:8});assert.equal(small.pass,true);assert.equal(small.sampling.produced,200);assert.equal(small.paper.produced,8);assert.equal(small.raw.distinct,8);
 const conditional=run({declared:()=>null});assert.equal(conditional.pass,true);assert.equal(conditional.bankDeclared,false);assert.equal(conditional.bankSize,null);assert.equal(conditional.paper.requested,40);
 assert.equal(run({actual:8}).pass,false,'undeclared finite pool must fail');assert.equal(run({declared:8,actual:4}).pass,false,'bank coverage cannot be skipped');
 const high=run({fault:'high-null'});assert.equal(high.pass,true);assert.equal(high.paper.produced,40);assert.equal(high.raw.rejectionRate,.75);assert.equal(high.warnings.length,1);
 for(const fault of ['null','throw','verify'])assert.equal(run({fault}).pass,false,fault);
 return 'PASS safeQuestion sampling, non-blocking null efficiency, finite-bank coverage, and exception/verification failure contracts';
}
