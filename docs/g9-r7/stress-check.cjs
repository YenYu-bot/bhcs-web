// Run from the repository root: node docs/g9-r7/stress-check.cjs
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.cwd()+'/scripts/node_modules/jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
let seed=20260928;
const dom=new JSDOM(fs.readFileSync('tools/math/g9-drills.html','utf8'),{url:'https://www.bhcs.com.tw/tools/math/g9-drills.html?topic=quadfunc',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);w.print=()=>{};w.matchMedia=media=>({media,matches:false});}});
const w=dom.window,d=w.document,units=[...d.querySelectorAll('[data-unit]')].map(x=>x.dataset.unit);let papers40=0,papers80=0;
function generate(ids,count){for(const c of d.querySelectorAll('[data-unit]'))c.checked=ids.includes(c.dataset.unit);for(const n of d.querySelectorAll('[data-count]'))n.value=count;d.querySelector('#generate').click();assert.equal(d.querySelectorAll('.prob').length,ids.length*count);assert.match(d.querySelector('#status').textContent,new RegExp('已產生 '+ids.length*count+' 題'));assert.equal(new Set([...d.querySelectorAll('.expr')].map(e=>e.textContent)).size,ids.length*count);}
for(const level of ['basic','advanced','challenge'])for(const modes of [['integer'],['fraction'],['integer','fraction']]){
 d.querySelector(`[data-level="${level}"]`).click();for(const m of d.querySelectorAll('[data-mode]'))m.checked=modes.includes(m.dataset.mode);
 for(let repeat=0;repeat<5;repeat++)for(let i=0;i<units.length;i++){generate([units[i]],40);papers40++;generate([units[i],units[(i+1)%units.length]],40);papers80++;}
}
assert.deepEqual(errors,[]);console.log(JSON.stringify({topic:'quadfunc',papers40,papers80,questions:papers40*40+papers80*80,exhausted:0,duplicateQuestions:0,jsdomErrors:errors,scope:'DOM generation only; not browser layout/print acceptance'}));dom.window.close();
