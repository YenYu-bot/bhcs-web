// Offline Chromium regression. Dependencies: playwright 1.58.2, Chromium,
// python3, poppler-utils (pdftotext). No network or personal data is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.VOCABULARY_OUTPUT || 'vocabulary-practice-artifacts');
const source = process.env.VOCABULARY_HTML || path.join(root, 'tools/english-vocabulary-109-115.html');
const html = fs.readFileSync(source, 'utf8');
fs.mkdirSync(out, {recursive:true});
const bank = JSON.parse(html.match(/<script id="question-bank"[^>]*>([\s\S]*?)<\/script>/)[1]);
// Frozen digest of approved source: IDs, stems, segmentation, original A–D order,
// and independently audited answer key. Update only after explicit source review.
const approvedDigest = '69585560d3e2ef2d0c10e9c85d1f4d334126d9cc6fee999c50d035be8a9c0f11';
const digest = crypto.createHash('sha256').update(JSON.stringify(bank.map(q=>({id:q.id,year:q.year,number:q.number,text:q.text,segments:q.segments,options:q.options,answer:q.answer})))).digest('hex');
assert.equal(digest,approvedDigest,'All 80 questions and original choices must match approved data');
assert.equal(bank.length,80); assert.equal(new Set(bank.map(q=>q.id)).size,80);
const byId = new Map(bank.map(q=>[q.id,q]));
const report = {bankDigest:digest, sourceQuestions:bank.map(q=>q.id), screens:[],pdfs:[]};
const url = 'http://127.0.0.1:4173/tools/english-vocabulary-109-115.html';
async function settle(p){await p.evaluate(()=>document.fonts.ready);}
async function order(p){return p.locator('.question').evaluateAll(es=>es.map(e=>e.dataset.questionId));}
async function snapshot(p){return {code:await p.locator('#exam-code').textContent(),ids:await order(p)};}
async function choose(p, ids){for(const id of ids)await p.locator(`input[data-id="${id}"][value="${byId.get(id).answer}"]`).check();}
async function overflow(p){return p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.question,.q-text,.option,.paper-toolbar,.settings,.paper-head')].filter(e=>{const r=e.getBoundingClientRect();return r.width&& (r.left < -1 || r.right>innerWidth+1)}).map(e=>e.className)}));}
async function printPDF(p,n,mode){
 await p.click('#'+mode);await p.emulateMedia({media:'print'});await settle(p);
 const styles=await p.evaluate(()=>({radios:[...document.querySelectorAll('.option input')].every(e=>getComputedStyle(e).display==='none'),notes:[...document.querySelectorAll('.answer-note')].map(e=>({teacher:e.classList.contains('teacher-answer'),display:getComputedStyle(e).display})),marks:[...document.querySelectorAll('.option')].every(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)' && getComputedStyle(e).borderTopWidth==='0px'),tools:getComputedStyle(document.getElementById('practice-tools')).display}));
 assert(styles.radios&&styles.marks&&styles.tools==='none','Print must not show selections, grading marks, or controls');
 if(mode==='student')assert(styles.notes.every(x=>x.display==='none'),'Student answers must be hidden');
 else assert.equal(styles.notes.filter(x=>x.teacher&&x.display!=='none').length,n);
 const filename=`${n}-${mode}.pdf`, pdf=path.join(out,filename);
 await p.pdf({path:pdf,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});
 execFileSync('pdftotext',['-bbox-layout',pdf,path.join(out,filename+'.xml')]);
 const ids=await order(p);
 fs.writeFileSync(path.join(out,filename+'.questions.json'),JSON.stringify(ids.map(id=>byId.get(id))));
 const result=JSON.parse(execFileSync('python3',['-c',String.raw`
import sys,json,xml.etree.ElementTree as E,re,unicodedata
xml,questions,mode=sys.argv[1:]
root=E.parse(xml).getroot(); pages=root.findall('.//{*}page'); qs=json.load(open(questions))
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s)).replace('’',"'").replace('‘',"'")
texts=[]
for i,p in enumerate(pages):
 words=p.findall('.//{*}word');w=float(p.attrib['width']);h=float(p.attrib['height'])
 assert words, 'Blank PDF page'
 for e in words:
  a=e.attrib
  assert float(a['xMin'])>=8 and float(a['xMax'])<=w-8 and float(a['yMin'])>=8 and float(a['yMax'])<=h-8, ('Clipped text',i+1,e.text,a)
 # Poppler's flow/block order is not reading order: columns from the preceding
 # options row may otherwise be inserted between split portions of the next
 # stem. Preserve every extracted word, ordering physical lines by y then x.
 lines=sorted(p.findall('.//{*}line'),key=lambda line:(float(line.attrib['yMin']),float(line.attrib['xMin'])))
 ordered=[word for line in lines for word in sorted(line.findall('{*}word'),key=lambda word:float(word.attrib['xMin']))]
 assert len(ordered)==len(words), 'Line ordering must preserve every PDF word'
 texts.append(norm(' '.join(''.join(e.itertext()) for e in ordered)))
placements=[]
for q in qs:
 # A question is whole only if its entire stem and all four labeled options are
 # extracted on the SAME physical PDF page, including teacher answer if present.
 required=[norm(q['text'])]+[norm('('+chr(65+i)+') '+o) for i,o in enumerate(q['options'])]
 if mode=='teacher': required.append(norm('答案：('+q['answer']+') '+q['options'][ord(q['answer'])-65]))
 matching=[i+1 for i,t in enumerate(texts) if all(s in t for s in required)]
 assert len(matching)==1, ('Split, missing or repeated question',q['id'],matching)
 placements.append({'id':q['id'],'page':matching[0]})
assert set(p['page'] for p in placements)==set(range(1,len(pages)+1)), 'Unexpected extra PDF page'
assert [p['page'] for p in placements]==sorted(p['page'] for p in placements), 'PDF question order changed'
print(json.dumps({'pageCount':len(pages),'questions':placements,'noClippedText':True,'wholeQuestions':True}))
`,path.join(out,filename+'.xml'),path.join(out,filename+'.questions.json'),mode],{encoding:'utf8'}));
 report.pdfs.push({filename,count:n,mode,...result});
 await p.emulateMedia({media:'screen'});
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 try{
  for(const width of [1280,390,320]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   await context.route('**/*',r=>r.request().url().split('#')[0]===url?r.fulfill({contentType:'text/html; charset=utf-8',body:html}):r.abort());
   await context.addInitScript(()=>{let seed=109115;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);});
   const p=await context.newPage(), errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await settle(p);
   assert.equal((await order(p)).length,20);
   const initial=await snapshot(p);
   await choose(p,[initial.ids[0]]);
   const wrong=byId.get(initial.ids[1]).answer==='A'?'B':'A';
   await p.locator(`input[data-id="${initial.ids[1]}"][value="${wrong}"]`).check();
   await p.click('#check');assert.match(await p.locator('#score').textContent(),/1 \/ 20/);
   assert.equal(await p.locator('.option.wrong').count(),1);
   assert.match(await p.locator('#score').textContent(),/18 題未作答/);
   await choose(p,initial.ids);await p.click('#check');assert.match(await p.locator('#score').textContent(),/20 \/ 20/);
   await p.click('#teacher');assert.deepEqual(await snapshot(p),initial);assert.equal(await p.locator('.teacher-answer').count(),20);
   await p.click('#student');assert.deepEqual(await snapshot(p),initial);assert.equal(await p.locator('input:checked[data-id]').count(),20);
   if(width===1280){await printPDF(p,20,'student');await printPDF(p,20,'teacher');await p.click('#student');}
   await p.click('#generate');assert(await p.locator('#replace-dialog').isVisible());await p.click('#dialog-cancel');assert.deepEqual(await snapshot(p),initial);
   await p.click('#generate');await p.click('#dialog-confirm');assert.notEqual((await snapshot(p)).code,initial.code);assert.equal(await p.locator('input:checked[data-id]').count(),0);
   await p.locator('#code-panel').evaluate(e=>e.open=true);await p.fill('#import-code',initial.code);await p.click('#load-code');assert.deepEqual(await snapshot(p),initial);
   await choose(p,[initial.ids[0]]);await p.click('#reset');await p.click('#dialog-cancel');assert.equal(await p.locator('input:checked[data-id]').count(),1);await p.click('#reset');await p.click('#dialog-confirm');assert.deepEqual(await snapshot(p),initial);assert.equal(await p.locator('input:checked[data-id]').count(),0);
   await p.reload();assert.deepEqual(await snapshot(p),initial);
   await p.click('#clear-years');assert(await p.locator('#generate').isDisabled());await p.click('#all-years');await p.selectOption('#count','all');await p.click('#generate');
   const all=await snapshot(p);assert.equal(all.ids.length,80);assert.equal(new Set(all.ids).size,80);
   await choose(p,all.ids);await p.click('#check');assert.match(await p.locator('#score').textContent(),/80 \/ 80/);
   const bounds=await overflow(p);assert(bounds.scroll<=width+1 && !bounds.bad.length,JSON.stringify(bounds));
   await p.screenshot({path:path.join(out,`screen-${width}.png`),fullPage:false});
   await p.click('#teacher');assert.deepEqual(await snapshot(p),all);assert.equal(await p.locator('.teacher-answer').count(),80);assert(!(await overflow(p)).bad.length);
   if(width===1280){await printPDF(p,80,'student');await printPDF(p,80,'teacher');}
   assert.deepEqual(errors,[]);report.screens.push({width,all80:true,grading:true,modeIdentity:true,dialogs:true,codeRestore:true,bounds});await context.close();
  }
  const resourceContext=await browser.newContext({viewport:{width:1280,height:900}});
  await resourceContext.route('**/*',r=>{
   const u=new URL(r.request().url());
   if(u.origin!=='http://127.0.0.1:4173')return r.abort();
   const f=path.resolve(root,'.'+u.pathname);
   if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile())return r.abort();
   return r.fulfill({path:f});
  });
  const resourcePage=await resourceContext.newPage();await resourcePage.goto('http://127.0.0.1:4173/ziyuan.html');
  assert.equal(await resourcePage.locator('#res-hs-english').count(),1);
  await resourcePage.locator('.res-stages button[data-val="高中"]').click();
  await resourcePage.fill('#resource-search','單字');
  const link=resourcePage.locator('#res-hs-english a[href*="english-vocabulary-109-115.html"]');
  assert(await link.isVisible(),'Vocabulary resource visible after high-school filter and search');
  const target=await link.getAttribute('href');
  assert.equal(new URL(target,resourcePage.url()).href,url);
  // Follow in the same tab for a deterministic offline link check.
  await link.evaluate(e=>e.removeAttribute('target'));await link.click();await resourcePage.waitForURL(url);
  assert.equal(await resourcePage.locator('.question').count(),20);
  report.resourceEntry={category:true,highSchoolFilter:true,vocabularySearch:true,navigation:true};await resourceContext.close();
  report.pass=true;
 }finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
