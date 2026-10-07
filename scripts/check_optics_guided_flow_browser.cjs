// I5 gate (real browser): the whole student path, welcome → mission → three trials → compare → naming → concept,
// at 390 and 1280. Verifies what the learner sees and hears (teaching script), that evidence comes from their own
// records (recorded at 14.5 / 29.5 on purpose), focus hand-off, quiet live regions, and that the formula and the word
// "虛像" are withheld until the right moment. Needs Playwright (CI: NODE_PATH=/tmp/bhcs-composition/node_modules).
const {chromium}=require('playwright');
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
    const page=await ctx.newPage(),errors=[],failed=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())});
    await page.goto(base+'/tools/science/optics-guided.html?debug=1');await page.waitForLoadState('networkidle');
    const text=()=>page.evaluate(()=>document.body.innerText);
    const state=()=>page.evaluate(()=>window.__opticsGuided.getState());
    const coach=async()=>({main:await page.locator('#og-coach-main').innerText(),sub:await page.locator('#og-coach-sub').innerText()});
    const active=()=>page.evaluate(()=>document.activeElement&&(document.activeElement.id||document.activeElement.className));
    const press=async(key,n=1)=>{for(let i=0;i<n;i++)await page.keyboard.press(key);await settle(page)};
    const cta=()=>page.locator('#og-cta');
    const shot=name=>page.screenshot({path:path.join(output,`${label}-${name}.png`),fullPage:true});
    const noOverflow=async(where)=>assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=0,'no horizontal overflow at '+where);
    const hitState=k=>page.evaluate(k=>{const e=document.querySelector('.og-hit-'+k);return {locked:e.getAttribute('aria-disabled')==='true',tab:e.tabIndex}},k);

    // --- welcome
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'welcome');
    assert.equal(await page.locator('#og-welcome-title').innerText(),'為什麼投影機的屏幕放錯位置，畫面就會模糊？');
    assert.equal(await page.locator('#og-bench-card').isVisible(),false,'no equipment yet');assert.equal(await page.locator('#og-coach').isVisible(),false);
    assert.equal(await cta().innerText(),'開始實驗');assert.equal(await cta().isDisabled(),false);
    assert.equal(await page.locator('.og-nav button[aria-current="step"]').innerText().then(t=>t.replace(/\s+/g,'')),'01接任務');
    let t=await text();assert.ok(!/1\/f|公式|理論|虛像/.test(t),'welcome shows no formula or terms');await noOverflow('welcome');await shot('1-welcome');
    // --- mission
    await cta().click();await settle(page);
    assert.deepEqual(await coach(),{main:'桌上有一支蠟燭、一片凸透鏡和一面屏幕。現在屏幕上的影像很模糊。',sub:'把屏幕移到影像最清楚的位置。'});
    assert.equal(await page.locator('#og-bench-card').isVisible(),true);assert.equal(await cta().innerText(),'動手試試看');
    assert.deepEqual([await hitState('screen'),await hitState('candle')].map(h=>h.locked),[true,true],'nothing moves before the learner starts');
    await shot('2-mission');
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
    assert.equal(await cta().innerText(),'記錄第一次結果');assert.equal(await cta().isDisabled(),false);await shot('3-trial1-found');
    await cta().click();await settle(page);
    assert.deepEqual(await coach(),{main:'第一筆證據有了。接下來只改一個地方。',sub:'把蠟燭移到離透鏡 15 cm 的位置。'});
    assert.match(await active(),/og-hit-candle/,'the candle takes over: focus follows the task');assert.equal(await cta().isHidden(),true);
    assert.equal(await page.locator('#og-records li').first().innerText(),`第一次紀錄完成 ✓ 物距 30 cm，清楚像距 ${f(O1)} cm`);
    // --- trial 2
    await press('PageUp',3);
    assert.equal((await state()).phase,'trial2-find-screen');
    let c=await coach();assert.equal(c.main,'好，這次只有物距改變。');assert.ok(c.sub.includes('原本清楚的影像現在模糊了')&&c.sub.includes('再找一次'));
    assert.match(await active(),/og-hit-screen/,'candle just locked → focus moves to the screen');
    assert.equal(await page.locator('#og-status-text').innerText(),'只有散開的光影，已看不出清楚的蠟燭形狀');assert.equal((await state()).s,O1,'the old position is kept, not reset');
    await shot('4-trial2-stale');
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
    await noOverflow('compare');await shot('5-compare');
    await page.getByLabel('更靠近透鏡').check();await page.getByLabel('變大').check();await settle(page);
    assert.equal((await coach()).main,'剛才哪個結果變得更明顯？');assert.ok(!(await text()).includes('錯了'));assert.equal(await cta().isDisabled(),true);
    await page.getByLabel('更遠離透鏡').check();await settle(page);
    c=await coach();assert.equal(c.main,'你剛才已經找到一個規律了。');assert.ok(c.sub.startsWith('在還能形成實像的情況下，物體往焦點靠近時'));
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
    assert.equal(await cta().innerText(),'我找不到清楚實像');assert.equal(await cta().isDisabled(),false);assert.equal((await state()).phase,'trial3-search-screen');
    await cta().click();await settle(page);
    c=await coach();assert.ok(c.main.startsWith('不是你找得不夠仔細')&&c.sub==='但是如果不用屏幕，而是直接透過透鏡看呢？');
    assert.equal(await cta().innerText(),'從透鏡後面看');await cta().click();await settle(page);
    c=await coach();assert.equal(c.main,'你現在看得到一個正立、放大的蠟燭。');assert.equal(c.sub,'可是剛才屏幕怎麼都接不到它。這和前兩次有什麼不同？');
    t=await text();assert.ok(!t.includes('虛像'),'the word is withheld until the learner has looked');
    assert.equal(await cta().innerText(),'我觀察到了');await shot('7-view-through');
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
    const lines=await page.locator('#og-formula li').evaluateAll(ls=>ls.map(l=>l.innerText.replace(/\s+/g,' ').trim()));
    assert.deepEqual(lines,[`第一次：f = 10 cm，u = 30 cm → v = 15 cm 你找到 ${f(O1)} cm`,`第二次：f = 10 cm，u = 15 cm → v = 30 cm 你找到 ${f(O2)} cm`,'第三次：f = 10 cm，u = 5 cm → v = −10 cm v 是負的：像在蠟燭這一側，屏幕接不到']);
    assert.equal((await coach()).main,'剛才三次實驗，其實分成兩種像。');assert.equal(await cta().innerText(),'進入研究手冊');
    await noOverflow('concept');await shot('8-concept');
    await cta().click();await settle(page);
    assert.equal(await page.locator('#main').getAttribute('data-screen'),'placeholder');
    assert.equal(await page.locator('.og-nav button[aria-current="step"]').innerText().then(t=>t.replace(/\s+/g,'')),'03研究手冊');
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await ctx.close();
   });
  }
  await check('guided pair (only the object distance changed) is announced as directly comparable',async()=>{
   const ctx=await browser.newContext({viewport:{width:1280,height:800}}),page=await ctx.newPage();
   await page.goto(base+'/tools/science/optics-guided.html?debug=1');await page.waitForLoadState('networkidle');
   // Reach compare through the engine hook; the two-variable warning is covered by the pure compareCard tests.
   await page.evaluate(()=>{const g=window.__opticsGuided;for(const type of ['START','BEGIN'])g.dispatch({type});g.dispatch({type:'MOVE_SCREEN',position:15});g.dispatch({type:'RECORD'});g.dispatch({type:'MOVE_CANDLE',position:15});g.dispatch({type:'MOVE_SCREEN',position:30});g.dispatch({type:'RECORD'})});
   assert.equal(await page.locator('#og-compare-notice').getAttribute('data-kind'),'ok');
   await ctx.close();
  });
 }finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checked:results.length,failed:failed.length,output}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
