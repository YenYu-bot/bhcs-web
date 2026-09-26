// Public pages and contact behavior. External requests are blocked; no test message is sent.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.SITE_OUTPUT||'site-artifacts');
const files=[...new Set(cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split('\n'))];
const allPages=files.filter(f=>f.endsWith('.html')&&!f.startsWith('scripts/'));
const pages=process.env.SITE_PAGES?process.env.SITE_PAGES.split(','):allPages;
const capture=new Set(['index.html','lianluo.html','ziyuan.html','wenzhang/index.html','wenzhang/duoding.html','wenzhang/chengji-pinxing.html']);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))}catch{res.writeHead(404).end()}});
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function measureLayout(p,width){
 const measure=async()=>{
  await p.evaluate(()=>document.fonts.ready);await settle(p);
  return p.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,badImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src')),h1:document.querySelectorAll('h1').length}));
 };
 const first=await measure();
 if(width===390&&first.overflow>0&&first.overflow<=2){
  const second=await measure();return {...second,initialOverflow:first.overflow,remeasured:true};
 }
 return first;
}

(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch(),results=[];
 try{
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:width===390?844:800},reducedMotion:'reduce'});
   await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   for(const file of pages){
    const p=await ctx.newPage(),errors=[],httpErrors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)httpErrors.push(r.status()+' '+r.url())});
    const row={file,width};
    try{
     await p.goto(base+'/'+file+'?noga=1',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
     await p.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));
     await p.waitForFunction(()=>[...document.images].every(i=>i.complete),null,{timeout:15000});await settle(p);
     const layout=await measureLayout(p,width);
     Object.assign(row,layout);assert.ok(layout.overflow<=2,'horizontal overflow');assert.deepEqual(layout.badImages,[],'broken images');
     if(file==='tools/science/index.html')assert.equal(layout.h1,1,'one directory h1');
     if(file==='index.html'){
      assert.equal(await p.locator('.hero').first().locator('.hero-actions a:visible').count(),width===390?1:3);
      assert.equal(await p.locator('.card-more').count(),3);
      if(width===390){await p.locator('.burger').click();assert.equal(await p.locator('.burger').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('.burger').getAttribute('aria-expanded'),'false');assert.ok(await p.locator('.burger').evaluate(el=>el===document.activeElement));}
     }
     if(file==='ziyuan.html'){
      const clipped=await p.locator('.res-stages').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(clipped,false,'all stage choices fit');
      await p.locator('.res-stages [data-val="升學"]').click();assert.ok(await p.locator('#res-exam').isVisible());assert.equal(await p.locator('#res-hs-math').isVisible(),false);
      await p.locator('.res-stages [data-val="全部"]').click();await p.locator('#resource-search').fill('透鏡');assert.ok(await p.locator('#res-science').isVisible());
      await p.locator('#resource-search').fill('不存在的教材測試');assert.match(await p.locator('#resource-filter-status').textContent(),/找不到/);
      await p.locator('#resource-search').fill('');await p.locator('#resource-search').blur();await p.evaluate(()=>scrollTo(0,0));
     }
     if(file.startsWith('wenzhang/')){assert.equal(await p.locator('.masthead .brand img').count(),1);assert.equal(await p.locator('main#main').count(),1);assert.equal(await p.locator('.foot a[href="tel:+886422320448"]').count(),1);assert.equal(await p.locator('.dock').isVisible(),width===390);}
     if(capture.has(file)){await p.evaluate(()=>scrollTo(0,0));await settle(p);await p.screenshot({path:path.join(out,width+'-'+file.replaceAll('/','-')+'.png')});}
     if(width===390&&await p.locator('.foot .legal').count()){
      await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await settle(p);
      const gap=await p.locator('.foot').evaluate(el=>document.documentElement.scrollHeight-(el.getBoundingClientRect().bottom+scrollY));assert.ok(gap<=2,'no white gap below footer');
      assert.match(await p.locator('.foot .legal').textContent(),/週二 13:30 起/);
      if(capture.has(file))await p.screenshot({path:path.join(out,width+'-'+file.replaceAll('/','-')+'-footer.png')});
     }
     assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);row.pass=true;
    }catch(e){row.pass=false;row.error=e.message;row.errors=errors;row.httpErrors=httpErrors;await p.screenshot({path:path.join(out,width+'-'+file.replaceAll('/','-')+'-failure.png')}).catch(()=>{})}
    results.push(row);await p.close();
   }
   await ctx.close();
  }
  for(const storageDenied of [false,true]){
   const ctx=await browser.newContext({viewport:{width:390,height:844}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await ctx.addInitScript(denied=>{window.__opened=[];window.open=(url,target,features)=>{window.__opened.push({url,target,features});return null};Object.defineProperty(navigator,'clipboard',{value:{writeText:async v=>{window.__copied=v}},configurable:true});if(denied)Object.defineProperty(window,'sessionStorage',{get(){throw Error('Storage blocked')}})},storageDenied);
   const p=await ctx.newPage(),errors=[],row={flow:'trial form',storageDenied};p.on('pageerror',e=>errors.push(e.message));
   try{
    await p.goto(base+'/lianluo.html?noga=1');await p.locator('button[type=submit]').click();assert.equal(await p.evaluate(()=>__opened.length),0,'invalid form stays local');
    await p.locator('#pname').fill('驗收家長');await p.locator('#phone').fill('0900000000');await p.locator('#grade').selectOption({label:'國中八年級'});await p.locator('#note').fill('理化 & 數學\n想了解費用 <測試>');
    assert.equal(await p.locator('.dock').isVisible(),false,'dock hides while typing');await p.locator('#note').blur();assert.ok(await p.locator('.dock').isVisible());
    if(!storageDenied){await p.reload();assert.equal(await p.locator('#pname').inputValue(),'驗收家長');assert.match(await p.locator('#note').inputValue(),/& 數學/)}else assert.match(await p.locator('#trial-draft-note').textContent(),/無法暫存/);
    await p.locator('button[type=submit]').click();assert.match(p.url(),/lianluo.html/);assert.ok(await p.locator('#trial-preview').isVisible());assert.match(await p.locator('#form-status').textContent(),/尚未送出/);
    const opened=await p.evaluate(()=>__opened);assert.equal(opened.length,1);assert.equal(opened[0].target,'_blank');assert.match(opened[0].features,/noopener/);assert.ok(opened[0].url.startsWith('https://line.me/R/oaMessage/%40bhcs/?'));assert.match(decodeURIComponent(new URL(opened[0].url).search.slice(1)),/理化 & 數學\n想了解費用 <測試>/);
    await p.locator('#note').fill('更新後的內容');await p.locator('#copy-trial').click();await p.waitForFunction(()=>window.__copied?.includes('更新後的內容'));assert.match(await p.evaluate(()=>__copied),/更新後的內容/);
    await p.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('Clipboard blocked')}});await p.locator('#copy-trial').click();assert.match(await p.locator('#form-status').textContent(),/已選取/);
    await p.screenshot({path:path.join(out,'trial-preview-'+storageDenied+'.png')});
    await p.locator('#clear-trial').click();await p.reload();assert.equal(await p.locator('#pname').inputValue(),'');assert.equal(await p.locator('#trial-preview').isVisible(),false);
    if(!storageDenied){for(const value of [JSON.stringify({savedAt:Date.now()-3*60*60*1000,values:{家長姓名:'過期'}}),'{broken']){await p.evaluate(v=>sessionStorage.setItem('bhcs_trial_draft_v1',v),value);await p.reload();assert.equal(await p.locator('#pname').inputValue(),'')}}
    assert.deepEqual(errors,[]);row.pass=true;
   }catch(e){row.pass=false;row.error=e.message;row.errors=errors}
   results.push(row);await ctx.close();
  }
 }finally{await browser.close();server.close()}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checked:results.length,failed:failed.length,failures:failed},null,2));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
