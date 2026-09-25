import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const DRILL_FILE_RE=/^g[^/]*-drills\.html$/;

function cardHrefs(indexHtml){
 const out=[];
 for(const match of indexHtml.matchAll(/<a\b([^>]*)>/gi)){
  const attrs=match[1],cls=attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1]||'';
  if(!cls.split(/\s+/).includes('card'))continue;
  const href=attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];if(href)out.push(href);
 }
 return out;
}

function engineTopics(root,file){
 const full=path.join(root,'tools/math',file),html=fs.readFileSync(full,'utf8');
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
 if(!script)throw Error(file+': missing __BHCS_TEST__ hook');
 const configsRe=/\b(const|let|var)\s+CONFIGS\s*=/,topicsRe=/\b(const|let|var)\s+TOPICS\s*=/;
 if(!configsRe.test(script))throw Error(file+': missing CONFIGS declaration');
 if(!topicsRe.test(script))throw Error(file+': missing TOPICS declaration');
 const instrumented=script
  .replace(topicsRe,'$1 TOPICS=globalThis.__BHCS_TOPICS__=')
  .replace(configsRe,'$1 CONFIGS=globalThis.__BHCS_CONFIGS__=');
 let seed=1;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const context={URLSearchParams,location:{search:''},Math:math,console:{warn(){},log(){}},setTimeout};context.globalThis=context;vm.createContext(context);
 new vm.Script(instrumented,{filename:full}).runInContext(context,{timeout:10000});
 const configs=context.__BHCS_CONFIGS__,topics=context.__BHCS_TOPICS__;
 if(!configs||typeof configs!=='object')throw Error(file+': CONFIGS was not exposed');
 if(!Array.isArray(topics))throw Error(file+': TOPICS was not exposed as an array');
 const configKeys=Object.keys(configs).sort();
 const topicKeys=topics.map(row=>Array.isArray(row)?String(row[0]):String(row));
 if(!configKeys.length)throw Error(file+': CONFIGS has no topics');
 if(!topicKeys.length)throw Error(file+': TOPICS has no topics');
 const duplicateTopics=topicKeys.filter((key,i)=>topicKeys.indexOf(key)!==i);
 if(duplicateTopics.length)throw Error(file+': duplicate TOPICS keys: '+[...new Set(duplicateTopics)].join(', '));
 const configSet=new Set(configKeys),errors=[],warnings=[];
 for(const key of topicKeys)if(!configSet.has(key))errors.push(file+': TOPICS key missing from CONFIGS: '+key);
 const topicSet=new Set(topicKeys);
 for(const key of configKeys)if(!topicSet.has(key))warnings.push(file+': CONFIGS-only key is not user-openable and does not require a card: '+key);
 const openTopics=topicKeys.filter(key=>configSet.has(key));
 return{configKeys,topicKeys,openTopics,errors,warnings};
}

export function discoverMathDrills(root){
 const mathDir=path.join(root,'tools/math'),engineFiles=fs.readdirSync(mathDir).filter(n=>DRILL_FILE_RE.test(n)).sort();
 const detailsByFile=new Map(engineFiles.map(file=>[file,engineTopics(root,file)]));
 const topicsByFile=new Map([...detailsByFile].map(([file,d])=>[file,d.openTopics]));
 const indexHtml=fs.readFileSync(path.join(mathDir,'index.html'),'utf8'),cards=[];
 for(const href of cardHrefs(indexHtml)){
  const url=new URL(href,'https://www.bhcs.com.tw/tools/math/'),file=url.pathname.startsWith('/tools/math/')?url.pathname.slice('/tools/math/'.length):'';
  if(!DRILL_FILE_RE.test(file))continue;
  cards.push({href,file,topic:url.searchParams.get('topic')||''});
 }
 const errors=[],warnings=[],cardsByFile=new Map(),seen=new Set();
 for(const [file,d] of detailsByFile){errors.push(...d.errors);warnings.push(...d.warnings);}
 for(const card of cards){
  if(!cardsByFile.has(card.file))cardsByFile.set(card.file,[]);
  cardsByFile.get(card.file).push(card);
  const key=card.file+'?topic='+card.topic;
  if(seen.has(key))errors.push('duplicate drill card: '+key);
  seen.add(key);
  if(!topicsByFile.has(card.file)){errors.push('card points to missing engine: '+card.href);continue;}
  if(!card.topic)errors.push('card missing ?topic=: '+card.href);
  else if(!topicsByFile.get(card.file).includes(card.topic))errors.push('card points to non-openable/missing topic: '+key);
 }
 for(const [file,topics] of topicsByFile){
  const linked=new Set((cardsByFile.get(file)||[]).map(c=>c.topic));
  for(const topic of topics)if(!linked.has(topic))errors.push('open engine topic has no card: '+file+'?topic='+topic);
 }
 return{
  engineFiles,detailsByFile,topicsByFile,cards,
  links:cards.map(c=>c.file+'?topic='+c.topic),
  errors,warnings
 };
}

export function assertMathDrillCoverage(root){
 const result=discoverMathDrills(root);
 for(const warning of result.warnings)console.warn('WARN '+warning);
 if(result.errors.length)throw Error('math drill discovery failed:\n- '+result.errors.join('\n- '));
 return result;
}
