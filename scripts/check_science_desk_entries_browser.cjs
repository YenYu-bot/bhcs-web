// Public entry/navigation smoke test. No external traffic or student data.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'science-desk-entries-artifacts');
const topics=[['specific-heat','比熱'],['solubility','溶解度'],['metal-activity','金屬']];
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 try{
  let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
  if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');
  res.end(fs.readFileSync(f));
 }catch{res.writeHead(404).end();}
});

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 fs.mkdirSync(out,{recursive:true});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
   await context.addInitScript(()=>localStorage.setItem('bhcs_noga','1'));
   const errors=[],events=[];let stage='initialization',topic='none';
   context.on('page',p=>{
    events.push({event:'page-created',url:p.url()});
    p.on('pageerror',e=>errors.push({url:p.url(),error:e.message}));
    p.on('popup',popup=>events.push({event:'popup',opener:p.url(),url:popup.url()}));
    p.on('framenavigated',frame=>{if(frame===p.mainFrame())events.push({event:'navigation',url:frame.url()});});
    p.on('console',msg=>{if(msg.type()==='error')events.push({event:'console-error',url:p.url(),text:msg.text()});});
   });
   await context.exposeBinding('__entryClickDiagnostic',({page:p},detail)=>events.push({event:'actual-click',url:p.url(),...detail}));
   await context.addInitScript(()=>document.addEventListener('click',event=>{
    const a=event.target.closest?.('a');
    const detail={tag:event.target.tagName,text:event.target.textContent?.trim().slice(0,100),href:a?.href||null,target:a?.target||null,x:event.clientX,y:event.clientY};
    queueMicrotask(()=>window.__entryClickDiagnostic({...detail,defaultPrevented:event.defaultPrevented}));
   },true));
   const page=await context.newPage();
   // Assert the link's exact destination before clicking, then observe its real target.
   // Resource entries currently use the same tab; a deliberate _blank entry must be checked in its popup.
   async function follow(from,link,pathname){
    const expected=origin+pathname;
    const info=await link.evaluate(a=>({href:a.href,target:a.getAttribute('target')||a.ownerDocument.querySelector('base')?.getAttribute('target')||'_self',html:a.outerHTML}));
    events.push({event:'click-intent',stage,from:from.url(),...info,expected});
    assert.equal(info.href,expected,'entry href must resolve to the exact intended URL');
    assert(['_self','_blank'].includes(info.target),'unexpected named link target: '+info.target);
    if(info.target==='_blank'){
     const [popup]=await Promise.all([from.waitForEvent('popup'),link.click()]);
     await popup.waitForURL(expected);
     assert.equal(popup.url(),expected);
     return popup;
    }
    const pagesBefore=context.pages().length;
    await Promise.all([from.waitForURL(expected),link.click()]);
    assert.equal(from.url(),expected);
    assert.equal(context.pages().length,pagesBefore,'same-tab link must not spawn a popup');
    return from;
   }
   try{
    for(const [id,term] of topics){
     topic=id;stage='directory search';
     await page.goto(origin+'/tools/science/');
     await page.locator('#search').fill(term);
     const old=page.locator(`.resource:not([hidden]) a[href="../science/${id}.html"]`);
     const fresh=page.locator(`.resource:not([hidden]) a[href="../${id}-desk/"]`);
     assert.equal(await old.count(),1);assert.equal(await fresh.count(),1);
     stage='directory to new desk';
     await follow(page,fresh,`/tools/${id}-desk/`);
     stage='new desk to legacy';
     await follow(page,page.locator(`a[href="../science/${id}.html"]`),`/tools/science/${id}.html`);
     for(const screen of ['prepare','bench','notebook','check']){
      stage='legacy screen '+screen;
      await page.locator(`.researcher-nav button[data-to="${screen}"]`).click();
      await page.locator(`.researcher-screen[data-screen="${screen}"].is-active`).waitFor({state:'visible'});
      const returnLink=page.locator(`a[href="../${id}-desk/"]`);
      await returnLink.waitFor({state:'visible'});
      assert(await returnLink.isVisible(),`${id} ${screen}: visible return link`);
      await returnLink.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,`${id}-legacy-${screen}-${width}.png`),fullPage:true});
     }
     await page.locator('.researcher-nav button[data-to="prepare"]').click();
     stage='legacy to new desk';
     await follow(page,page.locator(`a[href="../${id}-desk/"]`),`/tools/${id}-desk/`);
     stage='back and forward';
     await page.goBack();await page.goForward();
     assert.equal(page.url(),origin+`/tools/${id}-desk/`);
     await page.screenshot({path:path.join(out,`${id}-${width}.png`),fullPage:true});
     stage='desk to resources';
     await follow(page,page.locator('a[href="../../ziyuan.html#res-science"]'),'/ziyuan.html#res-science');
     stage='resource search';
     await page.locator('#resource-search').fill(term);
     const resource=page.locator(`#res-science a[href="tools/${id}-desk/"]`);
     await resource.waitFor({state:'visible'});
     await resource.scrollIntoViewIfNeeded();
     await page.screenshot({path:path.join(out,`${id}-resource-before-click-${width}.png`),fullPage:true});
     stage='resource entry to new desk';
     const destination=await follow(page,resource,`/tools/${id}-desk/`);
     await destination.locator('h1').waitFor({state:'visible'});
     await destination.screenshot({path:path.join(out,`${id}-resource-destination-${width}.png`),fullPage:true});
     if(destination!==page)await destination.close();
    }
    assert.deepEqual(errors,[]);
   }catch(error){
    const diagnostics={width,topic,stage,error:String(error),pages:context.pages().map(p=>({url:p.url(),closed:p.isClosed()})),errors,events};
    console.error('ENTRY FAILURE',JSON.stringify(diagnostics,null,2));
    fs.writeFileSync(path.join(out,`failure-${topic}-${width}.json`),JSON.stringify(diagnostics,null,2));
    for(const [index,p] of context.pages().entries()){
     try{await p.screenshot({path:path.join(out,`failure-${topic}-${width}-tab${index}.png`),fullPage:true,timeout:5000});}catch(e){console.error('Failure screenshot unavailable:',String(e));}
    }
    throw error;
   }finally{
    fs.writeFileSync(path.join(out,`navigation-${width}.json`),JSON.stringify(events,null,2));
    await context.close();
   }
  }
  console.log('PASS public desktop/mobile search, entries, reciprocal navigation and browser history');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
