// Finite question banks: the count input must not offer more questions than the
// declared bank at the current level, the limit must be visible next to the input,
// and any unit that still comes up short must be reported in the on-page status.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM, VirtualConsole} from 'jsdom';
import {load} from './helper.mjs';

const html=fs.readFileSync(new URL('../../tools/math/g10-drills.html',import.meta.url),'utf8');
const levels=['basic','advanced','challenge'];
let checked=0;
for(const topic of ['multiplication','exponent']){
 const api=load('g10',topic),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:`https://www.bhcs.com.tw/tools/math/g10-drills.html?topic=${topic}`,runScripts:'dangerously',virtualConsole:vc,
  beforeParse(w){w.print=()=>{};w.matchMedia=media=>({media,matches:false,addEventListener(){},removeEventListener(){}});}});
 assert.deepEqual(errors,[],`${topic}: interface failed to initialize`);
 const d=dom.window.document,input=id=>d.querySelector(`input[data-count="${id}"]`),note=id=>d.querySelector(`[data-bank="${id}"]`);
 for(const level of levels){
  d.querySelector(`button[data-level="${level}"]`).click();
  const modes=[...d.querySelectorAll('input[data-mode]:checked')].map(x=>x.dataset.mode);
  for(const unit of api.CFG.units){
   const cap=unit.maxCount||40,declared=Object.hasOwn(unit,'bankSize')?(typeof unit.bankSize==='function'?unit.bankSize({level,modes,mixed:api.CFG.mixed===true}):unit.bankSize):null;
   const expected=Number.isSafeInteger(declared)&&declared>0?Math.min(cap,declared):cap;
   assert.equal(Number(input(unit.id).max),expected,`${topic}/${unit.id}/${level}: input max`);
   assert.ok(Number(input(unit.id).value)<=expected,`${topic}/${unit.id}/${level}: preset within limit`);
   assert.equal(note(unit.id).textContent.includes(`${expected} 題`),expected<cap,`${topic}/${unit.id}/${level}: visible limit note`);
   checked++;
  }
 }
 if(topic==='multiplication'){
  d.querySelector('button[data-level="advanced"]').click();
  const box=d.querySelector('#unit-cubefactor');if(!box.checked){box.checked=true;box.dispatchEvent(new dom.window.Event('change',{bubbles:true}));}
  const n=input('cubefactor');n.value='40';n.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert.equal(n.value,'8','typing above the bank clamps to the bank size');
  d.querySelector('#generate').click();
  assert.doesNotMatch(d.querySelector('#status').textContent,/題目不足/,'a capped request is fully produced');
  // Bypass the cap to prove a shortfall is reported on the page, not only in the console.
  n.max='40';n.value='12';d.querySelector('#generate').click();
  assert.match(d.querySelector('#status').textContent,/題目不足（已出／要求）：立方和差因式分解 8／12/);
 }
 dom.window.close();
}
console.log(JSON.stringify({test:'bank-size-ui-cap',checked,passed:true}));
