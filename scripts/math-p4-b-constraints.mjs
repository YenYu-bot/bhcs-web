import assert from 'node:assert/strict';
// Read displayed conditions, independently of generator metadata and formulae.
export function checkP4BQuestion(topic,q,text,answer){
 const isNew=q.sig.startsWith('p4b:'),kind=isNew?q.sig.split(':')[2]:q.sig.split(':')[0];
 if(isNew){
  for(const t of [text,answer]){
   assert.doesNotMatch(t,/[+-]0(?![\d.])/,`zero term: ${t}`);
   assert.doesNotMatch(t,/\^\(1\)/,`exponent one: ${t}`);
   assert.doesNotMatch(t,/(?<![\d.])1(?=[xuv]|log)/,`coefficient one: ${t}`);
  }
 }
 const numbers=t=>[...t.replace(/\(\((\d+)\)\/\((\d+)\)\)/g,(_,n,d)=>String(+n/+d)).matchAll(/\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));
 const between=(v,a,b)=>assert.ok(Number.isFinite(v)&&v>=a-1e-12&&v<=b+1e-12,`${topic}/${kind}: ${v} outside [${a},${b}]: ${text}`);
 if(topic==='bayes'){
  const v=numbers(text),ans=numbers(answer)[0],unit=isNew?q.sig.split(':')[1]:kind==='b2'?'bayestwo':kind==='mp'?'medicalpositive':kind==='rt'?'repeatedtest':'';
  if(unit==='bayestwo'){
   if(kind==='counts'){between(v[2]/v[0],.05,.4);between(v[3]/v[1],.05,.4);}
   else if(kind==='prior'){between(v[0],5,40);between(v[1],5,40);between(ans,.05,.25);}
   else{between(v[1],5,40);between(v[2],5,40);}
  }else if(unit==='medicalpositive'){
   if(kind==='counts'){between(v[0]/(v[0]+v[2]),.05,.25);between(v[1]/v[0],.6,.95);between(v[3]/v[2],.05,.4);}
   else{between(v[0],kind==='mp'?5:.05,kind==='mp'?25:.25);between(v[1],60,95);between(kind==='specificity'?100-v[2]:kind==='falsePositive'?ans:v[2],5,40);}
  }else if(unit==='repeatedtest'){
   const negative=kind==='rt'&&text.includes('呈陰性');between(v[0],.05,.25);between(negative?1-v[1]:v[1],.6,.95);between(negative?1-v[2]:v[2],.05,.4);
  }
 }
 if(topic==='commonlog'&&isNew&&['threeTerms','weighted'].includes(kind)){
  const args=[...q.expr.matchAll(/log<sub>\d+<\/sub>(\d+)/g)].map(m=>Number(m[1]));
  assert.equal(args.length,3);assert.equal(new Set(args).size,3,`repeated log arguments: ${text}`);assert.ok(args.every(x=>x>1),`unit log argument: ${text}`);
 }
}
