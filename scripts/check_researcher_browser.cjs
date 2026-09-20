// Focused browser regressions: the reported empty-field bug and live welcome resizing.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.COMPOSITION_OUTPUT||'composition-artifacts');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
const results=[];
(async()=>{
 fs.mkdirSync(output,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch();
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:844},hasTouch:width===390,reducedMotion:'reduce'});
   await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/tools/microscope-lab.html?noga=1');
   await page.locator('[data-start]').click();await page.locator('#begin').click();
   for(const specimen of ['letter','onion','cheek','elodea']){
    await page.locator('#specimen').selectOption(specimen);await page.locator('#autofocus').click();
    const pad=page.locator('#slide-pad');await pad.focus();await page.keyboard.press('Home');
    await page.waitForFunction(()=>!document.querySelector('#featureLine').textContent.includes('試片已移出視野'));
    await page.locator('.scopeStage').evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-100));
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await page.locator('.scopeStage').screenshot({path:path.join(output,`${width}-${specimen}-center.png`)});
    // Real pointer input; continue outside the pad while pointer capture is active.
    await pad.scrollIntoViewIfNeeded();const box=await pad.boundingBox();
    if(width===390){
     const cdp=await context.newCDPSession(page),x=box.x+box.width*.15,y=box.y+box.height/2;
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+box.width*.70,y}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    }else{
     await page.mouse.move(box.x+box.width*.15,box.y+box.height/2);await page.mouse.down();
     await page.mouse.move(box.x+box.width*.85,box.y+box.height/2,{steps:8});await page.mouse.up();
    }
    await page.waitForFunction(()=>document.querySelector('#featureLine').textContent.includes('試片已移出視野'));
    assert.match(await page.locator('#scope').getAttribute('aria-label'),/試片已移出視野/);
    assert.match(await page.locator('#status').textContent(),/試片已移出視野/);
    await page.locator('.scopeStage').evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-100));
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await page.locator('.scopeStage').screenshot({path:path.join(output,`${width}-${specimen}-outside.png`)});
    await page.locator('.researcher-bench-record').click();
    assert.match(await page.locator('#records tr').last().textContent(),/試片已移出視野/);
    assert.equal(await page.locator('.researcher-screen.is-active').getAttribute('data-screen'),'bench');
    await pad.focus();await page.keyboard.press('Home');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已重新找到試片'));
    results.push({width,specimen,drag:width===390?'CDP touch':'mouse',outsideField:true,emptyRecord:true,recovered:true});
   }
   await page.locator('[data-to="notebook"]').click();assert.equal(await page.locator('#records tr').count(),4);
   await page.locator('[data-to="check"]').click();assert.ok(await page.locator('#checkQuiz').isVisible());
   await page.goBack();assert.equal(await page.locator('.researcher-screen.is-active').getAttribute('data-screen'),'notebook');
   await page.locator('[data-to="prepare"]').click();
   // Resize the same loaded page, rather than testing fresh loads only.
   for(const resized of [320,768,1280,390]){
    await page.setViewportSize({width:resized,height:844});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.ok(await page.locator('.researcher-bubble.is-aligned').isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
    const overlap=await page.locator('.researcher-bubble').evaluate(b=>{const r=b.getBoundingClientRect(),s=b.closest('.researcher-scene').getBoundingClientRect();return r.left<s.left||r.right>s.right||r.top<s.top||r.bottom>s.bottom});
    assert.equal(overlap,false,'resized bubble stays inside scene');
   }
   assert.deepEqual(errors,[]);await context.close();
  }
 }finally{await browser.close();server.close();fs.writeFileSync(path.join(output,'browser-regressions.json'),JSON.stringify(results,null,2))}
 console.log(`PASS ${results.length} microscope specimen/viewport cases: real pointer drag, empty view and record, Home recovery; notebook/challenge/history and live resize`);
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
