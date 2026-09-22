import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
export function load(grade,topic,initialSeed=20260922){
 const file=new URL(`../../tools/math/${grade}-drills.html`,import.meta.url);
 const html=fs.readFileSync(file,'utf8');
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
 let seed=initialSeed;const math=Object.create(Math);
 math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const context=vm.createContext({Math:math,URLSearchParams,location:{search:`?topic=${topic}`},console:{warn(){},log(){}}});
 new vm.Script(script).runInContext(context,{timeout:10000});
 return context.__BHCS_TEST__;
}
export function mathText(html){
 const d=JSDOM.fragment(html);
 const walk=n=>{
  if(n.nodeType===3)return n.textContent;
  if(n.classList?.contains('note-answer'))return '';
  if(n.classList?.contains('fr'))return `((${walk(n.querySelector(':scope > .n'))})/(${walk(n.querySelector(':scope > .d'))}))`;
  if(n.tagName==='SUP')return `^(${n.textContent})`;
  return [...n.childNodes].map(walk).join('');
 };
 return walk(d).replaceAll('−','-').replaceAll('＋','+').replaceAll('×','*').replaceAll('÷','/').replaceAll('（','(').replaceAll('）',')');
}
// Evaluate only the arithmetic grammar used in the returned worksheet markup.
export function value(text,x=0){
 const tokens=text.replace(/\s/g,'').match(/\d+(?:\.\d+)?|[x()+\-*/^√]/g)||[];
 let i=0;
 function atom(){let t=tokens[i++];if(t==='-')return -atom();if(t==='+')return atom();if(t==='√')return Math.sqrt(atom());if(t==='('){const v=sum();if(tokens[i++]!==')')throw Error('Missing )');return v;}if(t==='x')return x;if(!t||!/^\d/.test(t))throw Error('Unexpected '+t);return Number(t);}
 function power(){let v=atom();if(tokens[i]==='^'){i++;v=v**power();}return v;}
 function product(){let v=power();while(i<tokens.length&&!['+','-',')'].includes(tokens[i])){if(tokens[i]==='*'){i++;v*=power();}else if(tokens[i]==='/'){i++;v/=power();}else v*=power();}return v;}
 function sum(){let v=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],b=product();v=op==='+'?v+b:v-b;}return v;}
 const v=sum();if(i!==tokens.length)throw Error('Trailing math tokens');return v;
}
export const rational=s=>{const[n,d]=s.split('/').map(Number);return n/d;};
