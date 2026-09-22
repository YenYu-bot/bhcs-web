const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'math-fix-artifacts');
const cases=[['g10','cubic',['global']],['g11','righttrig',['comparison']],['g11','doublehalf',['fromsin','half']],['g11','spaceinner',['pointdistance']],['g11','line3d',['pointprojection','pointdistance']],['g11','sincosarea',['ambiguous']],['g11','loggraphs',['inverse']]];
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');try{const file=path.join(root,decodeURIComponent(u.pathname));res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch(),results=[],samples=[];
 try{
  for(const [grade,topic,units] of cases){
   const context=await browser.newContext();const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
   await page.addInitScript(()=>{let seed=20260922;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/math/${grade}-drills.html?topic=${topic}`);
   await page.locator('[data-level="challenge"]').click();await page.locator('[data-each="0"]').click();
   for(const unit of units){await page.locator(`[data-unit="${unit}"]`).check();await page.locator(`[data-count="${unit}"]`).fill(String(10/units.length));}
   await page.locator('#generate').click();assert.equal(await page.locator('.prob').count(),10,topic);
   await page.locator('#version').selectOption('teacher');
   samples.push({topic,questions:await page.locator('.prob').evaluateAll(es=>es.map(e=>({question:e.querySelector('.expr').innerHTML,answer:e.querySelector('.ans').innerHTML})))});
   for(const [width,height] of [[390,844],[1280,800],[1366,650]]){
    await page.setViewportSize({width,height});await page.screenshot({path:path.join(out,`${topic}-${width}.png`),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${topic}/${width} horizontal overflow`);
    results.push({topic,width,height,questions:10,errors:[...errors]});
   }
   await page.setViewportSize({width:794,height:1123});await page.emulateMedia({media:'print'});
   await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
   for(const version of ['student','teacher']){
    await page.locator('#version').selectOption(version,{force:true});
    await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    await page.screenshot({path:path.join(out,`${topic}-print-${version}.png`),fullPage:true});
    const visible=await page.locator('.ans').first().evaluate(e=>getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none');
    assert.equal(visible,version==='teacher',`${topic}/${version} answer visibility`);
   }
   assert.deepEqual(errors,[],topic);await context.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,samples},null,2));
  console.log(JSON.stringify({screenChecks:results.length,printViews:cases.length*2,questionsReviewed:samples.length*10,passed:true}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
