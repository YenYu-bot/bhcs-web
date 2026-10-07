// I5 gate (real browser): the whole student path, welcome → mission → three trials → compare → naming → concept,
// at 390 and 1280. Verifies what the learner sees and hears (teaching script), that evidence comes from their own
// records (recorded at 14.5 / 29.5 on purpose), focus hand-off, quiet live regions, and that the formula and the word
// "虛像" are withheld until the right moment. Needs Playwright (CI: NODE_PATH=/tmp/bhcs-composition/node_modules).
const {chromium}=require('playwright');
const {guardContext,captureGtag,axeScan}=require('./optics_guided_test_support.cjs');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.OPTICS_FLOW_OUTPUT||'optics-flow-artifacts');
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return}
 const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
let base;const results=[];
const check=async(name,fn)=>{const row={name};try{await fn()}catch(e){row.error=e.message}row.pass=!row.error;results.push(row);console.log(JSON.stringify(row))};

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
 try{
  for(const [label,width,height,touch] of [['390',390,844,true],['1280',1280,800,false]]){
   await check(`flow ${label}: welcome → concept with the learner's own numbers`,async()=>{
    const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
    const external=[],calls=[];await guardContext(ctx,base,{hook:true,external});await captureGtag(ctx,calls);
    await ctx.addInitScript(()=>{if(!localStorage.getItem('bhcs-science-v2-optics'))localStorage.setItem('bhcs-science-v2-optics','LEGACY-OPTICS-RECORDS')});
    const page=await ctx.newPage(),errors=[],failed=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())});
    page.on('request',r=>requests.push({url:r.url(),body:r.postData()||''}));
    await page.goto(base+'/tools/science/optics-guided.html');await page.waitForLoadState('networkidle');
    const text=()=>page.evaluate(()=>document.body.innerText);
    const state=()=>page.evaluate(()=>window.__opticsGuided.getState());
    const coach=async()=>({main:await page.locator('#og-coach-main').innerText(),sub:await page.locator('#og-coach-sub').innerText()});
    const active=()=>page.evaluate(()=>document.activeElement&&(document.activeElement.id||document.activeElement.className));
    const press=async(key,n=1)=>{for(let i=0;i<n;i++)await page.keyboard.press(key);await settle(page)};
    const cta=()=>page.locator('#og-cta');
    const shot=name=>page.screenshot({path:path.join(output,`${label}-${name}.png`),fullPage:true});
    const noOverflow=async(where)=>assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=0,'no horizontal overflow at '+where);
    const focusHit=k=>page.evaluate(k=>document.querySelector('.og-hit-'+k).focus({preventScroll:true}),k);
    const reload=async()=>{await page.reload();await page.waitForLoadState('networkidle');await settle(page)};
    const hitState=k=>page.evaluate(k=>{const e=document.querySelector('.og-hit-'+k);return {locked:e.getAttribute('aria-disabled')==='true',tab:e.tabIndex}},k);

    // --- welcome
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'welcome');
    assert.equal(await page.locator('#og-welcome-title').innerText(),'為什麼投影機的屏幕放錯位置，畫面就會模糊？');
    assert.equal(await page.locator('#og-bench-card').isVisible(),false,'no equipment yet');assert.equal(await page.locator('#og-coach').isVisible(),false);
    assert.equal(await cta().innerText(),'開始實驗');assert.equal(await cta().isDisabled(),false);
    assert.equal(await page.locator('.og-nav button[aria-current="step"]').innerText().then(t=>t.replace(/\s+/g,'')),'01接任務');
    let t=await text();assert.ok(!/1\/f|公式|理論|虛像/.test(t),'welcome shows no formula or terms');await noOverflow('welcome');await shot('1-welcome');await axeScan(page,label+' welcome');
    // --- mission
    await cta().click();await settle(page);
    assert.deepEqual(await coach(),{main:'桌上有一支蠟燭、一片凸透鏡和一面屏幕。現在屏幕上的影像很模糊。',sub:'把屏幕移到影像最清楚的位置。'});
    assert.equal(await page.locator('#og-bench-card').isVisible(),true);assert.equal(await cta().innerText(),'動手試試看');
    assert.deepEqual([await hitState('screen'),await hitState('candle')].map(h=>h.locked),[true,true],'nothing moves before the learner starts');
    await shot('2-mission');await axeScan(page,label+' mission');
    // --- trial 1
    await cta().click();await settle(page);
    assert.match(await active(),/og-hit-screen/,'focus goes to the first movable object');
    assert.equal((await coach()).main,'把屏幕移到影像最清楚的位置。');
    assert.equal(await page.locator('.og-nav button[aria-current="step"]').innerText().then(t=>t.replace(/\s+/g,'')),'02動手做');
    // quiet live regions: a drag-length of key presses must not re-announce each step
    await page.evaluate(()=>{window.__mut=0;new MutationObserver(m=>{window.__mut+=m.length}).observe(document.getElementById('og-coach-text'),{subtree:true,childList:true,characterData:true});window.__statusMut=0;new MutationObserver(m=>{window.__statusMut+=m.length}).observe(document.getElementById('og-status'),{subtree:true,attributes:true,attributeFilter:['aria-live']})});
    await press('ArrowLeft');assert.equal((await coach()).main,'試試看哪個位置比較清楚。');
    await press('ArrowLeft',2);assert.equal((await coach()).main,'快找到了。');
    // desktop snaps to 0.5 cm: record off the round number on purpose (14.5); touch snaps to 1 cm (15)
    const O1=touch?15:14.5,O2=touch?30:29.5,f=x=>String(x);
    if(touch)await press('ArrowLeft',2);else{await press('ArrowLeft');await press('Shift+ArrowLeft')}
    assert.equal((await state()).phase,'trial1-complete');assert.equal((await coach()).main,'就是這裡。影像現在最清楚。');
    const muts=await page.evaluate(()=>window.__mut);assert.ok(muts<=8,'coach live region only changes on real message changes: '+muts);
    assert.equal(await page.locator('#og-status').getAttribute('aria-live'),null);
    if(!touch)await press('Shift+ArrowLeft',2);
    assert.equal((await state()).s,O1,'what the learner actually found');
    assert.equal(await cta().innerText(),'記錄第一次結果');assert.equal(await cta().isDisabled(),false);await shot('3-trial1-found');await axeScan(page,label+' trial 1 found');
    await cta().click();await settle(page);
    assert.deepEqual(await coach(),{main:'第一筆證據有了。接下來只改一個地方。',sub:'把蠟燭移到離透鏡 15 cm 的位置。'});
    assert.match(await active(),/og-hit-candle/,'the candle takes over: focus follows the task');assert.equal(await cta().isHidden(),true);
    assert.equal(await page.locator('#og-records li').first().innerText(),`第一次紀錄完成 ✓ 物距 30 cm，清楚像距 ${f(O1)} cm`);
    // --- reload right after the first record: progress is saved, the trial restarts cleanly with the learner's own position
    await reload();
    assert.equal((await state()).phase,'trial2-move-object');assert.equal((await state()).s,O1);assert.equal((await state()).u,30);
    assert.equal(await page.locator('#og-records li').first().innerText(),`第一次紀錄完成 ✓ 物距 30 cm，清楚像距 ${f(O1)} cm`);
    assert.ok((await page.locator('#og-save-note').innerText()).includes('已接續你上次做到的地方'));
    assert.equal((await coach()).main,'把蠟燭移到離透鏡 15 cm 的位置。');
    // --- trial 2
    await focusHit('candle');await press('PageUp',3);
    assert.equal((await state()).phase,'trial2-find-screen');
    let c=await coach();assert.equal(c.main,'好，這次只有物距改變。');assert.ok(c.sub.includes('原本清楚的影像現在模糊了')&&c.sub.includes('再找一次'));
    assert.match(await active(),/og-hit-screen/,'candle just locked → focus moves to the screen');
    assert.equal(await page.locator('#og-status-text').innerText(),'只有散開的光影，已看不出清楚的蠟燭形狀');assert.equal((await state()).s,O1,'the old position is kept, not reset');
    await shot('4-trial2-stale');await axeScan(page,label+' trial 2 stale');
    await press('PageUp',3);assert.equal((await state()).s,O2);assert.equal((await state()).phase,'trial2-complete');
    c=await coach();assert.equal(c.main,'影像又清楚了。');assert.equal(c.sub,'再看看影像的大小和方向，有什麼變化？');assert.ok(!c.sub.includes('倒立'),'the prompt does not hint at the answer');assert.equal(await cta().innerText(),'記錄第二次結果');
    await cta().click();await settle(page);
    // --- compare
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'compare');assert.equal(await page.locator('#og-bench-card').isVisible(),false);
    assert.match(await active(),/og-compare-title/,'focus lands on the card heading');
    const cells=await page.locator('#og-compare-rows tr').evaluateAll(rows=>rows.map(r=>[...r.children].map(c=>c.textContent.trim())));
    assert.deepEqual(cells,[['焦距','10 cm','10 cm'],['物距','30 cm','15 cm'],['清楚像距',`${f(O1)} cm`,`${f(O2)} cm`],['影像大小','較小','較大']]);
    assert.equal(await page.locator('#og-compare-notice').innerText(),'✅ 兩次只有物距不同，可以直接比較。');
    t=await text();assert.ok(!/1\/f|公式|理論|虛像/.test(t),'compare shows evidence, not formula or terms');
    assert.equal(await cta().isDisabled(),true);assert.equal((await coach()).main,'把兩次的證據放在一起看。');
    await noOverflow('compare');await shot('5-compare');await axeScan(page,label+' compare');
    await page.getByLabel('更靠近透鏡').check();await page.getByLabel('變大').check();await settle(page);
    assert.equal((await coach()).main,'剛才哪個結果變得更明顯？');assert.ok(!(await text()).includes('錯了'));assert.equal(await cta().isDisabled(),true);
    await reload();assert.equal(await page.locator('#main').getAttribute('data-screen'),'compare');
    assert.equal(await page.getByLabel('更靠近透鏡').isChecked(),true,'the answer given before the reload is still there');assert.equal(await page.getByLabel('變大').isChecked(),true);
    assert.deepEqual((await page.locator('#og-compare-rows tr').evaluateAll(rows=>rows.map(r=>r.children[1].textContent.trim())))[2],`${f(O1)} cm`);
    await page.getByLabel('更遠離透鏡').check();await settle(page);
    c=await coach();assert.equal(c.main,'你剛才已經找到一個規律了。');assert.ok(c.sub.startsWith('在屏幕還能接到清楚影像的情況下，物體往焦點靠近時'));
    assert.equal(await cta().isDisabled(),false);await shot('6-compare-done');
    await cta().click();await settle(page);
    // --- trial 3
    c=await coach();assert.equal(c.main,'如果再把蠟燭往透鏡靠近，會一直有清楚的屏幕位置嗎？');assert.equal(c.sub,'把蠟燭移到 5 cm。');
    assert.match(await active(),/og-hit-candle/);
    await press('PageUp',2);assert.equal((await state()).phase,'trial3-search-screen');assert.match(await active(),/og-hit-screen/);
    assert.equal(await cta().isDisabled(),true,'only after three zones');
    await press('PageDown');assert.equal((await coach()).main,'這次也試著找找看。');
    await press('PageDown',3);assert.equal((await coach()).main,'目前還沒有找到清楚的位置。');
    await press('PageUp',4);
    c=await coach();assert.equal(c.main,'你已經檢查過近、中、遠的位置了。');assert.equal(c.sub,'看起來問題可能不在你找得不夠仔細。這次可能真的沒有能接到清楚影像的位置。');
    assert.equal(await cta().innerText(),'我找不到清楚影像');assert.equal(await cta().isDisabled(),false);assert.equal((await state()).phase,'trial3-search-screen');
    await cta().click();await settle(page);
    c=await coach();assert.ok(c.main.startsWith('不是你找得不夠仔細')&&c.sub==='但是如果不用屏幕，而是直接透過透鏡看呢？');
    assert.equal(await cta().innerText(),'從透鏡後面看');await cta().click();await settle(page);
    c=await coach();assert.equal(c.main,'你現在看得到一個正立、放大的蠟燭。');assert.equal(c.sub,'可是剛才屏幕怎麼都接不到它。這和前兩次有什麼不同？');
    t=await text();assert.ok(!t.includes('虛像'),'the word is withheld until the learner has looked');
    assert.equal(await cta().innerText(),'我觀察到了');await shot('7-view-through');await axeScan(page,label+' view through');
    await cta().click();await settle(page);
    assert.equal((await coach()).main,'這種只能透過透鏡看到、卻不能直接接在屏幕上的像，叫做「虛像」。');assert.equal(await cta().innerText(),'看看這兩種像');
    assert.equal(await page.locator('.og-bench').getAttribute('data-view-through'),'true','still looking through the lens while it is named');
    await cta().click();await settle(page);
    // --- concept
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'concept');
    const cards=await page.locator('.og-concept-card').evaluateAll(cs=>cs.map(c=>c.innerText.replace(/\s+/g,' ').trim()));
    assert.equal(cards.length,2);
    assert.ok(cards[0].startsWith('實像 光線真的在某個位置會合。 可以投在屏幕上。')&&cards[0].includes(`${f(O1)} cm 和 ${f(O2)} cm`));
    assert.ok(cards[1].startsWith('虛像 光線沒有真的在看起來的影像位置會合。 眼睛能看到，但屏幕接不到。')&&cards[1].includes('蠟燭在 5 cm'));
    assert.equal(await page.locator('#og-formula h3').innerText(),'剛才找到的位置，其實可以用這個關係算出來。');
    assert.equal(await page.locator('.og-formula-expression').innerText(),'1/f = 1/u + 1/v');
    assert.equal(await page.locator('.og-formula-note').innerText(),'負的像距不是叫你把屏幕放到負的位置，而是表示這次形成的是虛像。');
    const lines=await page.locator('#og-formula li').evaluateAll(ls=>ls.map(l=>l.innerText.replace(/\s+/g,' ').trim()));
    assert.deepEqual(lines,[`第一次：f = 10 cm，u = 30 cm → v = 15 cm 你找到 ${f(O1)} cm`,`第二次：f = 10 cm，u = 15 cm → v = 30 cm 你找到 ${f(O2)} cm`,'第三次：f = 10 cm，u = 5 cm → v = −10 cm v 是負的：像在蠟燭這一側，屏幕接不到']);
    assert.equal((await coach()).main,'剛才三次實驗，其實分成兩種像。');assert.equal(await cta().innerText(),'進入研究手冊');
    await noOverflow('concept');await shot('8-concept');await axeScan(page,label+' concept');
    await cta().click();await settle(page);
    // --- notebook
    const step=()=>page.locator('.og-nav button[aria-current="step"]').innerText().then(t=>t.replace(/\s+/g,''));
    const NB=page.locator('#og-notebook');
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'notebook');assert.equal(await step(),'03研究手冊');
    assert.match(await active(),/og-notebook-title/);assert.equal((await coach()).main,'回頭看看你的兩筆證據，用自己的話寫下你發現了什麼。');
    assert.deepEqual(await page.locator('#og-nb-rows tr').evaluateAll(rows=>rows.map(r=>[...r.children].map(c=>c.textContent.trim()))),[['焦距','10 cm','10 cm'],['物距','30 cm','15 cm'],['清楚像距',`${f(O1)} cm`,`${f(O2)} cm`],['影像大小','較小','較大']]);
    assert.equal(await page.locator('input[name="og-level"]:checked').getAttribute('value'),'A','Level A is the default');
    assert.equal((await page.locator('.og-given').innerText()).replace(/\s+/g,' '),`我把物距從 30 cm 改成 15 cm。 清楚像距從 ${f(O1)} cm 變成 ${f(O2)} cm。`);
    assert.equal(await cta().innerText(),'進入挑戰題');assert.equal(await cta().isDisabled(),true);
    t=await text();assert.ok(!/理論像距/.test(t));await shot('9-notebook-A');await axeScan(page,label+' notebook A');
    await NB.getByLabel('離透鏡更近').check();await NB.getByLabel('變大').check();await settle(page);
    assert.equal(await page.locator('.og-nudge').isVisible(),true,'a gentle pointer back to the evidence');assert.ok(!(await page.locator('.og-nudge').innerText()).match(/錯|答案/));
    assert.equal(await cta().isDisabled(),true,'a Level A answer that contradicts the evidence does not unlock the challenges');assert.equal(await NB.getByLabel('離透鏡更近').isChecked(),true,'the learner\'s choice stays on screen');
    await NB.getByLabel('離透鏡更遠').check();await settle(page);assert.equal(await page.locator('.og-nudge').isVisible(),false);assert.equal(await cta().isDisabled(),false,'both choices now match the two records');
    // Level B: its own readiness; Level A's choices do not count
    await NB.getByLabel('B　自己說').check();await settle(page);
    assert.equal(await page.locator('#og-nb-free').isVisible(),true);assert.equal(await cta().isDisabled(),true);
    const TOKEN='TOKEN-'+Math.random().toString(36).slice(2,8);
    await page.locator('#og-nb-free').fill(`距離變小，像距變大 ${TOKEN}`);await page.waitForTimeout(450);assert.equal(await cta().isDisabled(),false);
    // Level C
    await NB.getByLabel('C　研究員挑戰').check();await settle(page);assert.equal(await cta().isDisabled(),true);
    await page.locator('#og-nb-evidence').fill('物距變小時，清楚像距變大，影像也變大。');await page.waitForTimeout(450);assert.equal(await cta().isDisabled(),true,'both answers are needed');
    assert.equal(await page.locator('.og-ideas').isHidden(),true);
    await page.locator('#og-nb-limit').fill('還不知道換別的焦距會不會一樣。');await page.waitForTimeout(450);assert.equal(await cta().isDisabled(),false);
    assert.equal(await page.locator('.og-ideas').isVisible(),true,'researcher ideas appear after writing, not before');
    await shot('10-notebook-C');await axeScan(page,label+' notebook C');
    // reload keeps everything the learner wrote, in the level they chose
    await reload();
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'notebook');assert.equal(await page.locator('input[name="og-level"]:checked').getAttribute('value'),'C');
    assert.equal(await page.locator('#og-nb-evidence').inputValue(),'物距變小時，清楚像距變大，影像也變大。');assert.equal(await page.locator('#og-nb-limit').inputValue(),'還不知道換別的焦距會不會一樣。');
    await NB.getByLabel('B　自己說').check();await settle(page);assert.equal(await page.locator('#og-nb-free').inputValue(),`距離變小，像距變大 ${TOKEN}`,'the other levels\' text is kept');
    await NB.getByLabel('C　研究員挑戰').check();await settle(page);
    assert.equal(await cta().isDisabled(),false);await cta().click();await settle(page);
    // --- challenges
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'challenge');assert.equal(await step(),'04挑戰題');assert.match(await active(),/og-challenge-title/);
    assert.equal(await page.locator('#og-challenge-title').innerText(),'挑戰 1／3　模糊投影');
    assert.equal(await page.locator('#og-ch-scenario').innerText(),'在這個實驗裝置裡，蠟燭和透鏡都沒有移動，但屏幕上的影像突然變得模糊。');
    assert.equal(await cta().innerText(),'下一題');assert.equal(await cta().isDisabled(),true);
    await page.getByLabel('蠟燭的位置').check();await settle(page);assert.equal((await coach()).main,'剛才哪個結果變得更明顯？');
    await page.getByLabel('換一片焦距不同的透鏡').check();await settle(page);assert.ok((await coach()).main.startsWith('蠟燭和透鏡都沒有動。'),'second try → a hint pointing at the learner\'s own first experiment');
    assert.ok(!(await text()).includes('錯了')&&!(await text()).includes('正確答案'));
    await page.getByLabel('屏幕的位置').check();await settle(page);
    assert.equal((await coach()).main,'因為在其他條件不變時，清楚實像只會出現在特定位置附近。');assert.equal(await page.locator('input[name="og-ch-1-adjust"]').first().isDisabled(),true,'a solved step stays solved');
    assert.equal(await cta().isDisabled(),false);await cta().click();await settle(page);
    assert.equal(await page.locator('#og-challenge-title').innerText(),'挑戰 2／3　焦距內');
    assert.equal(await page.locator('#og-ch-steps fieldset').nth(1).isHidden(),true,'the follow-up waits for the first answer');
    assert.ok(!(await text()).match(/1\/f|公式/),'no calculation asked');
    await page.getByLabel('可以',{exact:true}).check();await settle(page);assert.equal(await cta().isDisabled(),true);
    await page.getByLabel('不可以').check();await settle(page);assert.equal(await page.locator('#og-ch-steps fieldset').nth(1).isVisible(),true);
    // reload in the middle of challenge 2
    await reload();assert.equal(await page.locator('#og-challenge-title').innerText(),'挑戰 2／3　焦距內');
    assert.equal(await page.getByLabel('不可以').isChecked(),true);assert.equal(await page.getByLabel('不可以').isDisabled(),true);assert.equal(await page.locator('#og-ch-steps fieldset').nth(1).isVisible(),true);
    await page.getByLabel('倒立放大的實像').check();await page.getByLabel('正立放大的虛像').check();await settle(page);
    assert.equal((await coach()).main,'透過透鏡看，會看到正立、放大的虛像。');await cta().click();await settle(page);
    assert.equal(await page.locator('#og-challenge-title').innerText(),'挑戰 3／3　放大鏡');assert.equal(await cta().innerText(),'完成');
    assert.equal(await page.locator('#og-ch-note').isHidden(),true);
    await page.getByLabel('因為形成的是實像，只是白紙放得不夠遠。').check();await page.getByLabel('因為白紙會把光吸收掉，所以看不到影像。').check();await settle(page);
    await page.getByLabel('因為字在放大鏡的焦距以內，形成的是虛像。眼睛看得到，但不能直接投到紙上。').check();await settle(page);
    assert.equal(await page.locator('#og-ch-note').isVisible(),true);await page.locator('#og-ch-note-input').fill('我自己的說法');await page.waitForTimeout(450);
    assert.equal(await cta().isDisabled(),false);await shot('11-challenge-3');await axeScan(page,label+' challenge 3');await cta().click();await settle(page);
    // --- complete
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'complete');assert.equal(await page.locator('#og-complete-title').innerText(),'這一站完成了');
    assert.deepEqual(await page.locator('#og-complete-summary p').allInnerTexts(),['物距變小時，清楚像距變大，影像也變大。','還不知道換別的焦距會不會一樣。']);
    assert.equal(await page.locator('.og-link-button').getAttribute('href'),'./optics.html');assert.equal((await coach()).main,'這一站完成了。');
    assert.equal(await step(),'04挑戰題');await noOverflow('complete');await shot('12-complete');await axeScan(page,label+' complete');
    await reload();assert.equal(await page.locator('#main').getAttribute('data-screen'),'complete','finished stays finished');
    // --- privacy and isolation: nothing typed leaves the page; the legacy lab's key is untouched; one key of our own
    const leaked=requests.filter(r=>r.url.includes(TOKEN)||r.body.includes(TOKEN)||decodeURIComponent(r.url).includes('我自己的說法'));assert.deepEqual(leaked,[]);
    assert.deepEqual(external,[],'every request stays on this site (the analytics loader is not even asked for: gtag was already defined)');
    const keys=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
    assert.deepEqual(Object.keys(keys).sort(),['bhcs-lens-guided:v1','bhcs-science-v2-optics']);assert.equal(keys['bhcs-science-v2-optics'],'LEGACY-OPTICS-RECORDS');
    assert.ok(keys['bhcs-lens-guided:v1'].includes(TOKEN),'the learner\'s own words are kept, on this device only');
    // --- analytics: fixed milestones only, always (name, lab id); nothing the learner typed, chose or found
    const events=calls.filter(c=>c[0]==='event');
    assert.ok(events.every(c=>c.length===3&&c[2]&&Object.keys(c[2]).join()==='lab_id'&&c[2].lab_id==='optics-guided'),'event shape: name + lab_id only: '+JSON.stringify(events.slice(0,3)));
    assert.deepEqual(events.map(c=>c[1]).filter(n=>n!=='science_open'),['science_lab_start','science_trial_recorded','science_trial_recorded','science_compare_complete','science_trial_recorded','science_virtual_observed','science_notebook_complete','science_challenge_complete','science_challenge_complete','science_challenge_complete','science_lab_complete'],'each milestone once, in order, never again after a reload');
    const wire=JSON.stringify(calls);for(const secret of [TOKEN,'我自己的說法','物距變小','還不知道','14.5','29.5','larger','farther'])assert.ok(!wire.includes(secret),'analytics payload contains: '+secret);
    // --- start over
    page.once('dialog',d=>d.accept());await page.locator('#og-restart').click();await page.waitForLoadState('networkidle');await settle(page);
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'welcome');
    assert.equal(await page.evaluate(()=>localStorage.getItem('bhcs-lens-guided:v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('bhcs-science-v2-optics')),'LEGACY-OPTICS-RECORDS','the old lab is left alone');
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await ctx.close();
   });
  }
  await check('guided pair (only the object distance changed) is announced as directly comparable',async()=>{
   const ctx=await browser.newContext({viewport:{width:1280,height:800}});await guardContext(ctx,base,{hook:true});const page=await ctx.newPage();
   await page.goto(base+'/tools/science/optics-guided.html');await page.waitForLoadState('networkidle');
   // Reach compare through the engine hook; the two-variable warning is covered by the pure compareCard tests.
   await page.evaluate(()=>{const g=window.__opticsGuided;for(const type of ['START','BEGIN'])g.dispatch({type});g.dispatch({type:'MOVE_SCREEN',position:15});g.dispatch({type:'RECORD'});g.dispatch({type:'MOVE_CANDLE',position:15});g.dispatch({type:'MOVE_SCREEN',position:30});g.dispatch({type:'RECORD'})});
   assert.equal(await page.locator('#og-compare-notice').getAttribute('data-kind'),'ok');
   await ctx.close();
  });
  // ---- hostile storage and quick exits (debug hook only reaches phases fast; what is checked is what the learner sees)
  const jump=page=>page.evaluate(()=>{const g=window.__opticsGuided,run=a=>g.dispatch(a);
   for(const type of ['START','BEGIN'])run({type});run({type:'MOVE_SCREEN',position:15});run({type:'RECORD'});run({type:'MOVE_CANDLE',position:15});run({type:'MOVE_SCREEN',position:30});run({type:'RECORD'});
   run({type:'ANSWER_COMPARE',question:'position',answer:'farther'});run({type:'ANSWER_COMPARE',question:'size',answer:'larger'});run({type:'CONTINUE'});run({type:'MOVE_CANDLE',position:5});
   for(const p of [8,20,35]){run({type:'MOVE_SCREEN',position:p});run({type:'SETTLE_SCREEN'})}
   for(const type of ['CONFIRM_NO_REAL_IMAGE','VIEW_THROUGH_LENS','CONTINUE','CONTINUE'])run({type});return g.getState().phase});
  const fresh=async(init,opts={})=>{const ctx=await browser.newContext({viewport:{width:1280,height:800},...opts});await guardContext(ctx,base,{hook:true});if(init)await ctx.addInitScript(init);
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text())});
   await page.goto(base+'/tools/science/optics-guided.html');await page.waitForLoadState('networkidle');return {ctx,page,errors}};
  await check('storage that refuses to save: the lab still works and says so',async()=>{
   const {ctx,page,errors}=await fresh(()=>{Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError')}});
   assert.equal(await jump(page),'notebook');
   assert.ok((await page.locator('#og-save-note').innerText()).includes('無法保存'),'tells the learner progress will not be kept');
   assert.equal(await page.locator('#main').getAttribute('data-screen'),'notebook');assert.deepEqual(errors,[]);await ctx.close();
  });
  await check('blocked storage (no localStorage at all) does not break the page',async()=>{
   const {ctx,page,errors}=await fresh(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError')}})});
   assert.equal(await page.locator('#main').getAttribute('data-screen'),'welcome');assert.equal(await jump(page),'notebook');assert.deepEqual(errors,[]);await ctx.close();
  });
  for(const [name,value] of [['corrupted JSON','{not json'],['a save from a future version',JSON.stringify({version:9,phase:'notebook'})],['a forged record (not a sharp position)',JSON.stringify({version:1,phase:'concept',records:{1:{f:10,u:30,observed:22},2:null,3:null},compare:{},conclusion:{},challenges:{}})]]){
   await check(`unusable saved data (${name}) → a normal welcome screen`,async()=>{
    const c2=await browser.newContext({viewport:{width:1280,height:800}});await guardContext(c2,base);await c2.addInitScript(`localStorage.setItem('bhcs-lens-guided:v1',${JSON.stringify(value)})`);
    const p2=await c2.newPage(),errs=[];p2.on('pageerror',e=>errs.push(e.message));await p2.goto(base+'/tools/science/optics-guided.html');await p2.waitForLoadState('networkidle');
    assert.equal(await p2.locator('#main').getAttribute('data-screen'),'welcome');assert.equal(await p2.locator('#og-cta').innerText(),'開始實驗');assert.deepEqual(errs,[]);await c2.close();
   });
  }
  await check('typing and leaving within a moment keeps the text (saved on page hide)',async()=>{
   const {ctx,page}=await fresh();assert.equal(await jump(page),'notebook');
   await page.locator('#og-notebook').getByLabel('B　自己說').check();
   await page.locator('#og-nb-free').fill('走得很快也要留下來');
   await page.reload();await page.waitForLoadState('networkidle');
   assert.equal(await page.locator('#og-nb-free').inputValue(),'走得很快也要留下來');assert.equal(await page.locator('input[name="og-level"]:checked').getAttribute('value'),'B');await ctx.close();
  });
  await check('the notebook does not rewrite what is being typed (caret and text survive a state change)',async()=>{
   const {ctx,page}=await fresh();await jump(page);
   await page.locator('#og-notebook').getByLabel('B　自己說').check();
   const box=page.locator('#og-nb-free');await box.click();await box.pressSequentially('第一段',{delay:20});
   await page.evaluate(()=>window.__opticsGuided.dispatch({type:'SAVE_CONCLUSION',fields:{relationSize:'larger'}}));   // a re-render while the box has focus
   await box.pressSequentially('第二段',{delay:20});
   assert.equal(await box.inputValue(),'第一段第二段');assert.equal(await page.evaluate(()=>document.activeElement.id),'og-nb-free');await ctx.close();
  });
  await check('the production page exposes no test hook, and ?debug=1 does nothing',async()=>{
   const ctx=await browser.newContext({viewport:{width:1280,height:800}});await guardContext(ctx,base);const page=await ctx.newPage();
   await page.goto(base+'/tools/science/optics-guided.html?debug=1');await page.waitForLoadState('networkidle');
   assert.equal(await page.evaluate(()=>typeof window.__opticsGuided),'undefined');
   const src=await page.evaluate(async()=>(await fetch('/assets/optics-guided/main.js')).text());assert.ok(!/__opticsGuided|debug/.test(src),'main.js as served has no test controls');
   await ctx.close();
  });
  for(const [label,width,height,touch] of [['390',390,844,true],['1280',1280,800,false]]){
   await check(`site integration ${label}: with the real science-events.js (analytics loader answered by a stub) the page is clean`,async()=>{
    const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),external=[];await guardContext(ctx,base,{external});
    const page=await ctx.newPage(),errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())});
    await page.goto(base+'/tools/science/optics-guided.html');await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('script[src*="science-events.js"]').count(),1,'one analytics adapter');assert.equal(await page.locator('script[src*="site.js"]').count(),0,'science labs use science-events.js, not the marketing-site loader');
    assert.equal(await page.locator('script[src*="googletagmanager"]').count(),1,'the adapter adds the single Google loader');
    assert.deepEqual([...new Set(external.map(u=>new URL(u).origin))],['https://www.googletagmanager.com']);
    const sent=await page.evaluate(()=>window.dataLayer.map(a=>Array.from(a)).filter(a=>a[0]==='event'));assert.deepEqual(sent,[['event','science_open',{lab_id:'optics-guided'}]]);
    await page.locator('#og-cta').click();await page.locator('#og-cta').click();await settle(page);
    const after=await page.evaluate(()=>window.dataLayer.map(a=>Array.from(a)).filter(a=>a[0]==='event').map(a=>a[1]));assert.deepEqual(after,['science_open','science_lab_start']);
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=0);assert.equal(await page.locator('.og-bench').isVisible(),true);
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await ctx.close();
   });
  }
 }finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checked:results.length,failed:failed.length,output}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
