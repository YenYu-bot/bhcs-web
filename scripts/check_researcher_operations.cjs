// Real browser flow for all 20 stations. No direct calls into model functions.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.OPERATIONS_OUTPUT||'operation-artifacts');
const legacy=[['microscope','begin'],['photosynthesis-factor','start'],['genetics-simulation','cross'],['force-motion','step'],['circuit','verify'],['particle-reaction','react'],['acid-base-indicator','mix'],['heat-phase','begin'],['buoyancy-density','drop'],['plate-earthquake','begin']].map(([id,run])=>({id,file:'tools/'+id+'-lab.html',run}));
const shared=['optics','wave-sound','electromagnetism','pressure-fluid','energy','solubility','moon-eclipse','seasons','plant-exchange','ecosystem'].map(id=>({id,file:'tools/science/'+id+'.html',run:'run',shared:true}));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
(async()=>{
 fs.mkdirSync(output,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch(),results=[];
 fs.writeFileSync(path.join(output,'environment.json'),JSON.stringify({browser:browser.version(),node:process.version},null,2));
 try{for(const width of (process.env.OPERATIONS_WIDTHS||'390,1280').split(',').map(Number)){
 const context=await browser.newContext({viewport:{width,height:800},reducedMotion:'reduce'});
 await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 for(const item of [...legacy,...shared]){
  const page=await context.newPage(),errors=[],result={id:item.id,width};page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const screenshot=async(name,locator)=>{await settle(page);if(locator)await locator.screenshot({path:path.join(output,`${width}-${item.id}-${name}.png`)});else await page.screenshot({path:path.join(output,`${width}-${item.id}-${name}.png`)})};
  const count=()=>page.locator('#records tr:not(:has([colspan]))').count();
  const source=item.shared?'#add-record':'#addRecord',save=item.shared?'#add-record':'.researcher-bench-record';
  const run=async()=>{await page.locator('#'+item.run).click();if(item.id==='genetics-simulation')await page.locator('#sample').click();if(item.id==='microscope')await page.locator('#autofocus').click();await page.waitForFunction(sel=>!document.querySelector(sel).disabled,source);await settle(page)};
  try{
   await page.goto(base+'/'+item.file+'?noga=1');await page.locator('[data-start]').click();await run();
   assert.ok(await page.locator(save).isVisible(),'save action is present in the bench');assert.equal(await page.locator(save).isDisabled(),false);
   if(item.shared){const stage=page.locator('#diagram');result.diagram=await stage.evaluate(el=>({height:el.clientHeight,scrollHeight:el.scrollHeight}));assert.ok(result.diagram.scrollHeight<=result.diagram.height+3,'complete diagram has no nested vertical scroll');await stage.evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-86));await screenshot('diagram',stage);if(result.diagram.height>600){await stage.evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().bottom-innerHeight+24));await screenshot('diagram-end')}await page.locator('#explanation-input').fill('第一筆：依據圖像與數值記錄。')}
   else await screenshot('save',page.locator('.researcher-save'));
   await page.locator(save).click();assert.equal(await count(),1);assert.equal(await page.locator('.researcher-screen.is-active').getAttribute('data-screen'),'bench','saving stays in the bench');
   await page.locator('[data-to="notebook"]').click();assert.ok(await page.locator('[data-return-second]').isVisible());
   await page.locator('[data-return-second]').click();await settle(page);
   const control=page.locator(item.shared?'#control-fields :is(select,input[type="range"]):visible:not(:disabled)':'.labgrid > .panel :is(select:not(#level),input[type="range"]):visible:not(:disabled)').first();
   result.changedControl=await control.getAttribute('id');
   if(await control.evaluate(el=>el.tagName)==='SELECT'){const value=await control.evaluate(el=>[...el.options].find(o=>o.value!==el.value).value);await control.selectOption(value)}
   else {await control.focus();const key=await control.evaluate(el=>Number(el.value)<Number(el.max)?'ArrowRight':'ArrowLeft');await page.keyboard.press(key)}
   await settle(page);if(item.id==='microscope'){assert.match(await page.locator('#scope').getAttribute('aria-label'),/洋蔥/,'live microscope reflects the new specimen')}else{assert.ok(await page.locator(source).isDisabled(),'condition change invalidates save');assert.ok(await page.locator(save).isDisabled(),'bench proxy follows disabled state')}
   await run();if(item.shared)await page.locator('#explanation-input').fill('第二筆：只改一個條件後比較變化。');await page.locator(save).click();assert.equal(await count(),2);const rows=await page.locator('#records tr').evaluateAll(rows=>rows.map(row=>[...row.cells].slice(1).map(c=>c.textContent).join('|')));assert.notEqual(rows[0],rows[1],'second record reflects the changed condition');
   await page.locator('[data-to="notebook"]').click();await settle(page);assert.equal(await page.locator('.researcher-return').isVisible(),false,'entire second-record reminder hides after two records');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'notebook has no page horizontal overflow');await screenshot('notebook');
   await page.reload();await page.locator('[data-to="notebook"]').click();assert.equal(await count(),2,'records survive reload');
   await page.locator(item.shared?'#clear-records':'#clearRecord').click();await settle(page);assert.equal(await count(),0);assert.ok(await page.locator('[data-return-second]').isVisible(),'clear restores next-observation prompt');
   await page.locator('[data-to="check"]').click();const check=page.locator(item.shared?'#check-quiz':'#checkQuiz'),score=page.locator(item.shared?'#quiz-score':'#quizScore');
   await check.click();assert.match(await score.textContent(),/未答|已答/);const blank=await page.locator('#quiz .feedback').allTextContents();assert.ok(blank.every(t=>!t.includes('再想一想')),'blank answers are not marked wrong');
   const answers=await page.evaluate(shared=>shared?JSON.parse(document.querySelector('#lab-config').textContent).quiz.map(q=>String(q.answer)):[...document.querySelectorAll('.quizItem fieldset')].map(f=>f.dataset.answer),!!item.shared);
   const fields=page.locator(item.shared?'#quiz fieldset':'.quizItem fieldset');
   for(let i=0;i<answers.length;i++)await fields.nth(i).locator('input[value="'+answers[i]+'"]').check();
   await check.click();assert.match(await score.textContent(),/3[／/]3|3／3 題/,'correct answers are scored');
   const wrong=fields.first().locator('input:not([value="'+answers[0]+'"])').first();await wrong.check();assert.match(await score.textContent(),/重新檢查/);assert.equal(await page.locator('#quiz .feedback').first().textContent(),'','edited question drops stale feedback');
   await check.click();assert.match(await score.textContent(),/2[／/]3|2／3 題/);await screenshot('challenge');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no page horizontal overflow');assert.deepEqual(errors,[]);result.pass=true;
  }catch(e){result.pass=false;result.failure=e.message;result.errors=errors;await screenshot('failure').catch(()=>{})}
  results.push(result);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(result));await page.close();
 }
 await context.close();
 }}finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checked:results.length,failed:failed.length}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
