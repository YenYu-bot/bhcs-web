// node p3/g11q.mjs topic... -> qualifying units (challenge new structure vs basic, or median ratio>=2) and topic structure counts
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root='/home/claude/bhcs-web';const {seedFor}=await import(root+'/scripts/math_test_harness.mjs');
const src=fs.readFileSync(root+'/scripts/test_math_drills.mjs','utf8').split('\n').slice(29,37).join('\n');
const {visibleMath,structureOf}=new Function(src+';return {visibleMath,structureOf}')();
const nums=h=>[...visibleMath(h).matchAll(/\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));const med=v=>{if(!v.length)return null;const s=[...v].sort((a,b)=>a-b),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const html=fs.readFileSync(root+'/tools/math/g11-drills.html','utf8');const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
for(const topic of process.argv.slice(2)){const link=`g11-drills.html?topic=${topic}`;let seed=1;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const c=vm.createContext({URLSearchParams,location:{search:'?topic='+topic},Math:math,console:{warn(){},log(){}}});new vm.Script(script).runInContext(c);const api=c.__BHCS_TEST__,cfg=api.CFG;
 const T={basic:new Set(),advanced:new Set(),challenge:new Set()};const q=[];
 for(const unit of cfg.units){const S={},M={};for(const level of ['basic','advanced','challenge']){seed=seedFor(`${link}/${unit.id}/${level}/diversity`);const ctx={level,modes:cfg.modes.filter(m=>unit.modes.includes(m)),mixed:cfg.mixed===true};S[level]=new Set();const v=[];
  for(let i=0;i<200;i++){const r=api.safeQuestion(unit,ctx,new Set());if(r){const s=structureOf(r.expr);S[level].add(s);T[level].add(s);v.push(...nums(r.expr))}}M[level]=med(v)}
  const nw=[...S.challenge].filter(s=>!S.basic.has(s)).length,ratio=M.basic>0&&M.challenge!==null?M.challenge/M.basic:null;if(nw>=1||ratio>=2)q.push(unit.id);
  console.log(topic,unit.id,unit.name,`b${S.basic.size} a${S.advanced.size} c${S.challenge.size} new=${nw}`)}
 console.log(`TOPIC ${topic}: qualifying=${q.length} [${q}] topicStructures b${T.basic.size} a${T.advanced.size} c${T.challenge.size}`)}
