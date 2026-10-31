import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {showApparatusAfterTransition} from '../../tools/incline-desk/navigation.mjs';

test('explicit successful transition centers apparatus before focusing without another scroll',()=>{
 const calls=[];
 const bench={scrollIntoView:opts=>calls.push(['scroll',opts])};
 const handle={focus:opts=>calls.push(['focus',opts])};
 assert.equal(showApparatusAfterTransition({changed:true},bench,handle),true);
 assert.deepEqual(calls,[['scroll',{behavior:'auto',block:'center',inline:'nearest'}],['focus',{preventScroll:true}]]);
});
test('ignored/repeated action does not navigate or steal focus',()=>{
 const fail=()=>assert.fail('navigation is forbidden for an ignored action');
 for(const result of [undefined,null,{changed:false}])assert.equal(showApparatusAfterTransition(result,{scrollIntoView:fail},{focus:fail}),false);
});
test('only next-ramp and redo handlers invoke apparatus navigation; pointer and painting paths do not',()=>{
 const app=readFileSync(new URL('../../tools/incline-desk/app.mjs',import.meta.url),'utf8');
 const calls=[...app.matchAll(/showApparatusAfterTransition\(result,\$\('bench'\),\$\('handle'\)\)/g)];
 assert.equal(calls.length,2);
 for(const id of ['redo','next']){
  const start=app.indexOf(`$('${id}').onclick=`),end=app.indexOf('\n',start);
  assert(start>=0);
  const handler=app.slice(start,end);
  assert.match(handler,/const result=act/);
  assert.match(handler,/showApparatusAfterTransition\(result/);
 }
 const pointerStart=app.indexOf("$('handle').addEventListener('pointerdown'");
 const pointerEnd=app.indexOf("$('begin').onclick=");
 assert(!app.slice(pointerStart,pointerEnd).includes('scrollIntoView'));
 assert(!app.slice(pointerStart,pointerEnd).includes('showApparatusAfterTransition'));
});
