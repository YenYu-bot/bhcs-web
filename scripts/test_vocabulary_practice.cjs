// Original vocabulary and additive-resource integration contract.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),file='tools/english-vocabulary-109-115.html';
const html=fs.readFileSync(path.join(root,file),'utf8'),resources=fs.readFileSync(path.join(root,'ziyuan.html'),'utf8');
const bank=JSON.parse(html.match(/<script id="question-bank" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const approved='69585560d3e2ef2d0c10e9c85d1f4d334126d9cc6fee999c50d035be8a9c0f11';
assert.equal(hash(JSON.stringify(bank.map(({id,year,number,text,segments,options,answer})=>({id,year,number,text,segments,options,answer})))),approved,'All 80 approved source texts, underlines, options and answers are unchanged');
assert.equal(bank.length,80);assert.equal(new Set(bank.map(q=>q.id)).size,80);assert.equal(new Set(bank.map(q=>q.text.replace(/\s+/g,' '))).size,80);
const keys={115:'BCBADACBCD',114:'CAACCDDABA',113:'BABBDCDCAB',112:'ACCBDDBAAD',111:'BACAACBDDB',110:'CCAADDBDACBAACB',109:'BBDDBACDCCAADAB'};
for(const [year,answers] of Object.entries(keys)){const qs=bank.filter(q=>q.year===+year);assert.equal(qs.length,answers.length);assert.equal(qs.map(q=>q.answer).join(''),answers);for(let i=0;i<qs.length;i++)assert.equal(qs[i].number,i+1);}
for(const q of bank){assert.equal(q.options.length,4);assert.ok(q.options.every(o=>o.length));assert.equal(q.segments.map(s=>s.text).join(''),q.text);}
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(m=>!m[0].includes('type="application/json"')).map(m=>m[1]);for(const src of scripts)new vm.Script(src);
const sandbox={module:{exports:{}}};vm.runInNewContext(scripts.find(s=>s.includes("const VERSION='BHV1'")),sandbox);const core=sandbox.module.exports;
const years=[109,110,111,112,113,114,115];for(let mask=1;mask<128;mask++){const selected=years.filter((_,i)=>mask&(1<<i));for(const count of [10,20,30,50,'all']){const exam=core.createExam(bank,selected,count),pool=bank.filter(q=>selected.includes(q.year));assert.equal(exam.length,count==='all'?pool.length:Math.min(count,pool.length));assert.equal(new Set(exam.map(q=>q.id)).size,exam.length);assert.ok(exam.every(q=>selected.includes(q.year)));assert.equal(JSON.stringify(core.decodeExam(bank,core.encodeExam(bank,exam))),JSON.stringify(exam));}}
for(let i=0;i<1000;i++){const e=core.createExam(bank,years,20);assert.equal(e.length,20);assert.equal(new Set(e.map(q=>q.id)).size,20);}
for(const c of ['BHV1-0.0','BHV1-zz','BHV2-0','BHV1-','BHV1--1','<script>'])assert.throws(()=>core.decodeExam(bank,c));assert.throws(()=>core.createExam(bank,[],10));assert.equal(core.grade(bank,Object.fromEntries(bank.map(q=>[q.id,q.answer]))).correct,80);assert.equal(core.grade(bank,{}).answered,0);
const legacy={"res-math":"0b274abf9d6a074ecd669cbd7f70d0d4003082866f48152f980d41eb9e45f34b","res-elem-science":"6024cb5618f0d2b612e2c0f4ea662ae65e7ffbe4db4d1850fe0b8f9fcf5de167","res-jh-math":"02fb4ff4772b2ba71bb90719d6abc1379aef19a88bf108d5556aa32f70d4e9d9","res-science":"61179bce668434a3d30189aae4b15994a9f5ed4540b4d0ad3f1f1947581b9284","res-english":"5b25d713848a1339cb8db06fa5310d68c9f3d65831ef89545b639dc006b236e6","res-hs-math":"083d10af0239d5e196db09976f2a4585e74c6c47a043acebbc975a1796f5df8f","res-exam":"bc3a2d15ac93b7535364528ce1bb4a8f2e868b3205ebe8f7a76f03c16967178f"};for(const [id,expected] of Object.entries(legacy)){const match=[...resources.matchAll(/<section class="res-sec" id="([^"]+)">[\s\S]*?<\/section>/g)].find(m=>m[1]===id);assert.ok(match,id+' retained');if(id==='res-science'){
 // The authorized catalog cutovers change only this one legacy category.
 assert.equal(expected,'61179bce668434a3d30189aae4b15994a9f5ed4540b4d0ad3f1f1947581b9284');
 assert.equal(hash(match[0]),'221f266aa32865efba36e15b555676eab511a8362a9e1282102fa21abba21b78','exact catalog after pressure, reflection, seven-desk, friction-desk and physics lab-desk cutovers');
 }else if(id==='res-jh-math'){
 // Only move the existing function link from 國一 to 國二; all other links remain frozen.
 const link='<a href="tools/math/g7-drills.html?topic=function">函數</a>';
 const row='國二<small>17 個</small>';
 assert.equal(match[0].split(link).length-1,1);
 assert.match(match[0],/國二<small>17 個<\/small>[^\n]*>函數<\/a>/);
 const ratio='<a href="tools/math/g7-drills.html?topic=ratio">比例</a>';
 const restored=match[0].replace(link,'').replace(ratio,ratio+link)
   .replace('國一<small>14 個</small>','國一<small>15 個</small>').replace(row,'國二<small>16 個</small>');
 assert.equal(hash(restored),expected,'legacy junior-high math unchanged apart from the function grade and derived counts');
 }else if(id==='res-english'){
 // Reverse only the reviewed English finder additions before checking the pre-existing catalog hash.
 const capRow="        <div class=\"trow\"><div class=\"tlabel\">會考專練</div><div class=\"tpills\"><a href=\"tools/english-cap-grammar.html\">會考情境文法</a><a href=\"tools/english-cap-reading.html\">歷屆會考閱讀測驗</a></div></div>\n";
 const countTitle='<h3>國中英文<span class="count">51 項</span></h3>';
 const lead='        <p class="lead">文法與會考專練可線上作答，也可列印 A4。文法線上練習的計分題可訂正，部分題型需自行核對。單字習寫請選列印練習卷；英檢與 VocabMaster 另有入口說明。</p>\n';
 assert.equal(match[0].split(lead).length-1,1,'English finder lead appears once');
 const restored=match[0].replace(lead,'').replace(/(<a href="tools\/english-[^"]+") data-resource-types="(?:print quiz|print)"(?: data-resource-search="(?:線上練習 錯題訂正|線上練習)")?/g,'$1');
 assert.equal(restored.split(capRow).length-1,1,'exact CAP links appear once');
 assert.equal(match[0].split(countTitle).length-1,1,'derived English count appears once');
 assert.equal(hash(restored.replace(capRow,'').replace(countTitle,countTitle.replace('51 項','49 項'))),expected,'legacy junior-high English unchanged apart from the CAP entries and finder metadata');
 }else assert.equal(hash(match[0]),expected,id+' unchanged');}
assert.equal((resources.match(/href="tools\/english-vocabulary-109-115.html"/g)||[]).length,1);assert.match(resources,/'res-hs-english':\['高中','quiz'\]/);assert.match(resources,/目前共 266 項/);assert.match(resources,/id="vocabulary-practice-note"/);
assert.match(html,/<link rel="canonical" href="https:\/\/www.bhcs.com.tw\/tools\/english-vocabulary-109-115.html">/);assert.ok(!html.includes('noindex'));assert.ok(!html.includes('隔離驗收版'));assert.ok(!html.includes('libfile_'));assert.ok(!html.includes('appgprj_'));assert.ok(!html.includes('several74727'));assert.ok(!html.includes('localStorage'));assert.ok(!html.includes('fetch('));assert.ok(!/\b(?:src|href)=["']https?:/.test(html.replace(/<a\b[^>]*>/g,'').replace(/<link rel="canonical"[^>]*>/,'')),'No external resource dependencies');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8');assert.match(workflow,/run: node scripts\/check_vocabulary_practice_browser.cjs/);assert.match(workflow,/name: vocabulary-practice-review/);assert.match(workflow,/poppler-utils/);
console.log('PASS: original 80-question bank and answers; 127 year subsets x 5 counts; 1000 shuffles; same-paper restore; source privacy; additive resource links; unchanged legacy categories; required browser/PDF CI.');
