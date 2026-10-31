// g9-1-4-trig-ratio topic 1: question text, figure labels and answer key must
// describe the same triangle. Runs the page's own generator functions in a VM
// (no DOM) with a seeded Math.random, then checks every generated question.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../../tools/math/g9-1-4-trig-ratio.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const pick=name=>{
 const start=script.indexOf(`function ${name}(`);assert.ok(start>=0,name+' missing');
 let depth=0,i=script.indexOf('{',start);
 for(;i<script.length;i++){if(script[i]==='{')depth++;else if(script[i]==='}'&&--depth===0)break;}
 return script.slice(start,i+1);
};
let seed=20261031;const math=Object.create(Math);
math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const context=vm.createContext({Math:math});
new vm.Script(['gcd','formatFraction','randInt','randPick','renderSvgRightTriangle','genTopic1Question'].map(pick).join('\n')).runInContext(context,{timeout:10000});

const plain=s=>s.replace(/<[^>]+>/g,'');
const cases=new Map();
for(let i=0;i<2000;i++){
 const q=context.genTopic1Question('basic','fraction'),text=plain(q.qText);
 const right=text.match(/∠([AC]) ＝ 90°/)[1],target=text.match(/以 sin ([ABC])/)[1];
 const side=n=>Number(text.match(new RegExp(n+' ＝ (\\d+)'))[1]);
 const AB=side('AB'),BC=side('BC'),AC=side('AC');
 const hyp=right==='C'?AB:BC,legs=right==='C'?[AC,BC]:[AB,AC];
 assert.equal(legs[0]**2+legs[1]**2,hyp**2,`text is not a right triangle: ${text}`);
 // Opposite/adjacent sides of the target angle according to the question text.
 const opp={A:BC,B:AC,C:AB}[target],adj=right==='C'?(target==='A'?AC:BC):(target==='B'?AB:AC);
 const [sin,cos,tan]=q.ansRaw.split(', ').map(f=>f.split('/').map(Number));
 assert.deepEqual([sin,cos,tan],[[opp,hyp],[adj,hyp],[opp,adj]],`answer key contradicts text: ${text} / ${q.ansRaw}`);
 // Leg labels sit at fixed SVG positions next to fixed vertices.
 const label=(x,y)=>Number(q.svg.match(new RegExp(`<text x="${x}" y="${y}"[^>]*>(\\d+)</text>`))[1]);
 const figure=right==='C'?{AC:label(22,70),BC:label(115,130)}:{AB:label(56,112),AC:label(122,48)};
 for(const [name,value] of Object.entries(figure))assert.equal(value,{AB,BC,AC}[name],`figure ${name} differs from text: ${text}`);
 const key=`right${right}-target${target}`;cases.set(key,(cases.get(key)||0)+1);
}
assert.equal(cases.size,4,'all four vertex/target arrangements are exercised');
console.log(JSON.stringify({test:'trig-ratio-side-labels',questions:2000,cases:Object.fromEntries(cases),passed:true}));
