// Real browser flow for all 42 stations. No direct calls into model functions.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.OPERATIONS_OUTPUT||'operation-artifacts');
const legacy=[['microscope','begin'],['photosynthesis-factor','start'],['genetics-simulation','cross'],['force-motion','step'],['circuit','verify'],['particle-reaction','react'],['acid-base-indicator','mix'],['heat-phase','begin'],['buoyancy-density','drop'],['plate-earthquake','begin']].map(([id,run])=>({id,file:'tools/'+id+'-lab.html',run}));
const shared=['optics','wave-sound','electromagnetism','pressure-fluid','energy','solubility','moon-eclipse','seasons','plant-exchange','ecosystem','motion-graphs','lever-torque','pulley-incline','reaction-rate','reflection-refraction','atom-builder','stoichiometry','weather-systems','circulation','nerve-reflex','homeostasis','spring-friction','electric-power','electrostatics','equilibrium','metal-activity','cell-electrolysis','specific-heat','neutralization','cell-division','enzyme','tides'].map(id=>({id,file:'tools/science/'+id+'.html',run:'run',shared:true}));
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
   await page.goto(base+'/'+item.file+'?noga=1');await page.locator('[data-start]').click();
   if(item.id==='microscope'){
    assert.ok((await page.locator('#guide-box .guide-skip').boundingBox()).height>=44,'microscope intro skip target is touch-sized');
    const cards=page.locator('.researcher-taskbar .mission');assert.equal(await cards.count(),4,'all microscope task cards survive enhancement');
    assert.equal(await page.locator('.mission[aria-pressed="true"]').count(),0,'initial free observation does not falsely select an onion task');
    assert.ok(await cards.first().evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('#experiment'))&Node.DOCUMENT_POSITION_FOLLOWING)),'task cards precede experiment');
    for(const [id,specimen,mode,title] of [['onion','onion','basic','任務一'],['compare','cheek','basic','任務二'],['chloroplast','elodea','basic','任務三'],['direction','letter','advanced','任務四']]){
     const card=page.locator('[data-mission="'+id+'"]');assert.ok(await card.isVisible());await card.click();
     assert.equal(await page.locator('#specimen').inputValue(),specimen);assert.equal(await page.locator('#level').inputValue(),mode);assert.equal(await page.locator('#obj4').isChecked(),true);
     assert.equal(await page.locator('.mission[aria-pressed="true"]').count(),1);assert.equal(await card.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.mission.is-current').getAttribute('data-mission'),id);
     assert.match(await page.locator('#missionText').textContent(),new RegExp(title));assert.equal(await page.locator('#labControls').evaluate(el=>el.disabled),true,'task selection disables the fieldset');for(const ctl of await page.locator('#labControls input,#labControls button,#labControls select').all())assert.ok(await ctl.isDisabled(),'task controls inherit the disabled fieldset');assert.ok(await page.locator(save).isDisabled());
     const rect=await card.boundingBox();assert.ok(rect.height>=44&&rect.x>=0&&rect.x+rect.width<=width+2,'task card fits viewport and has a touch-sized target');
    }
    await screenshot('task-cards',page.locator('.researcher-taskbar').locator('..'));
    const reference=page.locator('details:has(#specimens)');assert.equal(await reference.getAttribute('open'),null);assert.ok((await reference.locator('summary').boundingBox()).height>=44,'specimen reference toggle is touch-sized');await reference.locator('summary').click();assert.ok(await page.locator('#specimens').isVisible());assert.equal(await page.locator('#specimens .fact').count(),3);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'expanded specimen reference fits viewport');await screenshot('specimen-reference',reference);await reference.locator('summary').click();
    await page.locator('#level').selectOption('basic');await page.locator('#begin').click();await page.locator('#guide-box .guide-options').waitFor();await page.locator('#guide-box .guide-options button').filter({hasText:/^40×$/}).click();
    assert.ok(await page.locator('#guide-box button').filter({hasText:'下一步'}).isVisible());await page.locator('#slide-pad').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#guide-box .guide-options').count(),0,'real slide keyboard movement invalidates guide evidence');assert.equal(await page.locator('#guide-box button').filter({hasText:'下一步'}).count(),0);
    await page.locator('#guide-box .guide-skip').click();await page.locator('#autofocus').click();await page.locator('#obj40').check();assert.equal(await page.locator('#totalValue').textContent(),'400×');await page.locator('#guide-box .guide-replay').click();assert.equal(await page.locator('#obj4').isChecked(),true,'replay restores actual low-power condition');
    await page.locator('#reset').click();await page.locator('#level').selectOption('basic');
   }
   await run();
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
   if(item.id==='microscope'){
    // Additive complete lesson, after every existing record/challenge assertion.
    await page.locator('[data-to="bench"]').click();
    const lesson=page.locator('#micro-learning'),action=text=>lesson.getByRole('button',{name:text,exact:true});
    const phase=async n=>assert.equal(await lesson.getAttribute('data-learning-phase'),String(n));
    const press=async text=>{const b=action(text);assert.equal(await b.isDisabled(),false);await b.focus();await page.keyboard.press('Enter');await settle(page);assert.equal(await lesson.locator('h2').evaluate(el=>document.activeElement===el),true,'explicit lesson action retains keyboard focus');};
    await press('開始完整操作教學');await phase(1);assert.equal(await page.locator('#guide-box').isVisible(),false,'legacy guide is not competing');
    await page.locator('#begin').click();await page.locator('#autofocus').click();await press('影像清楚，開始觀察方向');await phase(2);
    assert.ok(await action('玻片與影像方向相反').isDisabled(),'answer needs actual movement');
    await page.locator('#slide-center').click();assert.ok(await action('玻片與影像方向相反').isDisabled(),'centering is not direction evidence');
    await page.locator('#slide-pad').focus();await page.keyboard.press('ArrowRight');assert.ok(await action('玻片與影像方向相反').isDisabled(),'one axis is insufficient');await page.keyboard.press('ArrowUp');
    assert.equal(await page.locator('#slide-pad').evaluate(el=>document.activeElement===el),true,'passive progress does not steal focus');
    await press('玻片與影像方向相同');await phase(2);assert.match(await lesson.textContent(),/再看一次/);
    await press('玻片與影像方向相反');await press('準備洋蔥比較');await phase(3);
    await page.locator('#begin').click();await page.locator('#autofocus').click();await press('記錄低倍證據');await phase(4);
    assert.ok(await action('記錄高倍證據').isDisabled(),'student must choose high power');
    await page.locator('#obj40').check();await page.locator('#light').focus();await page.keyboard.press('ArrowLeft');assert.ok(await action('記錄高倍證據').isDisabled(),'changed light cannot form matched evidence');
    await press('恢復低倍紀錄的位置與照明');await press('記錄高倍證據');await phase(5);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('bhcsMicroscopeRecords')));
    assert.equal(stored.length,2);assert.notEqual(stored[0].observation.id,stored[1].observation.id);
    for(const row of stored){assert.equal(row.observation.assisted,true);assert.equal(row.observation.specimen,'onion');assert.ok(row.observation.clarity>=80)}
    for(const k of ['sample','session','lesson','stageX','stageY','light','coarse'])assert.equal(stored[0].observation[k],stored[1].observation[k],k+' matches in retained snapshots');assert.equal(stored[0].observation.objective,4);assert.equal(stored[1].observation.objective,40);
    assert.equal(await lesson.locator('.micro-learning-evidence article').count(),2);assert.match(await lesson.textContent(),/紀錄第 1 筆/);assert.match(await lesson.textContent(),/紀錄第 2 筆/);
    await screenshot('full-learning-evidence',lesson);
    await press('高倍看到的範圍較大');await phase(5);await press('高倍影像較大，看到的範圍較小');await phase(6);assert.match(await lesson.textContent(),/不代表已熟練真實顯微鏡/);
    for(const b of await lesson.locator('button').all())assert.ok((await b.boundingBox()).height>=44,'lesson actions are touch-sized');
    await screenshot('full-learning-complete',lesson);await press('離開教學，改自由練習');await phase('free');
    await page.locator('[data-to="notebook"]').click();await page.locator('#clearRecord').click();assert.equal(await count(),0);
    result.completeLearning=true;
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no page horizontal overflow');assert.deepEqual(errors,[]);result.pass=true;
  }catch(e){result.pass=false;result.failure=e.message;result.errors=errors;await screenshot('failure').catch(()=>{})}
  results.push(result);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(result));await page.close();
 }
 await context.close();
 }}finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checked:results.length,failed:failed.length}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

