import assert from 'node:assert/strict';
import {load,mathText,value,rational} from './helper.mjs';

const api=load('g10','exponent');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const pow=(base,exponent)=>base**exponent;
const frac=(n,d)=>d===1?String(n):`<span class="fr"><span class="n">${n}</span><span class="d">${d}</span></span>`;
const monomial=(coefficient,x,y)=>{
 const has=x||y;
 const coefficientText=has&&coefficient.n===coefficient.d?'':frac(coefficient.n,coefficient.d);
 const term=(name,exponent)=>!exponent?'':exponent===1?name:`${name}<sup>${String(exponent).replace('-','−')}</sup>`;
 return coefficientText+term('x',x)+term('y',y)||'1';
};
let produced=0;
const coverage=new Set();
for(const id of ['fractional','laws','algebra']){
 const unit=api.CFG.units.find(candidate=>candidate.id===id);
 for(const level of ['basic','advanced','challenge'])for(const mode of unit.modes)for(let i=0;i<400;i++){
  const q=unit.gen({level,modes:[mode],mixed:false});
  if(!q)continue;
  assert.equal(q.verify(),true);
  produced++;
  const parts=q.sig.split(':');
  coverage.add(`${id}:${parts[1]}`);
  if(id==='fractional'&&parts[1]==='d'){
   const root=rational(parts[3]),p=Number(parts[4]);
   close(value(mathText(q.answer)),pow(root,p));
  }
  if(id==='laws'){
   const style=parts[1];
   let expected;
   if(style==='s')expected=pow(rational(parts[3]),Number(parts[4])+Number(parts[5])-Number(parts[6]));
   else if(style==='p')expected=pow(rational(parts[3]),Number(parts[4])*Number(parts[5])-Number(parts[6]));
   else expected=pow(rational(parts[4]),Number(parts[5]));
   const rendered=mathText(q.answer).split('＝').at(-1);
   close(value(rendered),expected);
  }
  if(id==='algebra'){
   const c=parts[2].split('/').map(Number),a=Number(parts[3]),b=Number(parts[4]),p=Number(parts[5]),qExp=Number(parts[6]),rExp=Number(parts[7]);
   const coefficient={n:c[0]**(p-1),d:c[1]**(p-1)};
   const divisor=(x,y)=>{while(y){[x,y]=[y,x%y]}return Math.abs(x)||1};
   const g=divisor(coefficient.n,coefficient.d);coefficient.n/=g;coefficient.d/=g;
   assert.equal(q.answer,monomial(coefficient,a*p-qExp,b*p-rExp));
  }
 }
}
for(const key of ['fractional:d','fractional:c','fractional:n','laws:s','laws:p','laws:m','algebra:integer','algebra:fraction'])assert.ok(coverage.has(key),`missing ${key}`);
console.log(JSON.stringify({test:'exponent-safe-verification',produced,coverage:[...coverage].sort(),passed:true}));
