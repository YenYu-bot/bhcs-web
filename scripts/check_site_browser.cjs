// Public pages and contact behavior. External requests are blocked; no test message is sent.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.SITE_OUTPUT||'site-artifacts');
const files=[...new Set(cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split('\n'))];
const allPages=files.filter(f=>f.endsWith('.html')&&!f.startsWith('scripts/'));
const pages=process.env.SITE_PAGES?process.env.SITE_PAGES.split(','):allPages;
// Analytics ownership and privacy guards (static): the GA loader lives only in assets/site.js and assets/science-events.js,
// and the analytics code never reads form fields or free text into gtag/dataLayer/track.
for(const f of allPages.filter(f=>fs.readFileSync(path.join(root,f),'utf8').includes('assets/site.js'))){const html=fs.readFileSync(path.join(root,f),'utf8');assert.ok(!html.includes('googletagmanager.com')&&!html.includes('G-GHN2GDS2RQ'),f+' must not embed its own GA loader');}
{const src=fs.readFileSync(path.join(root,'assets/site.js'),'utf8');assert.ok(src.includes("'G-GHN2GDS2RQ'"),'site.js owns the GA id');for(const line of src.split('\n'))if(/\b(gtag|track)\s*\(|dataLayer\.push/.test(line))assert.doesNotMatch(line,/家長姓名|聯絡電話|就讀學校|想了解的科目|目前遇到的狀況|trial-message|content|message\.value|form\.elements/,'analytics call must not touch form data: '+line.trim());}
// Legacy tool pages use site.js for privacy-aware GA page views only: no inline loader, no science-events adapter.
const legacyToolPages=['tools/lenses.html','tools/waves.html','tools/eye-lesson.html','tools/dc-motor.html','tools/color-primaries.html','tools/moon-phases/index.html','tools/frog-dissection/index.html','tools/vertical.html','tools/convex-lens-imaging.html'];
for(const f of legacyToolPages){const html=fs.readFileSync(path.join(root,f),'utf8');assert.ok(!html.includes('G-GHN2GDS2RQ')&&!html.includes('googletagmanager.com/gtag/js'),f+' must not embed GA');assert.equal((html.match(/assets\/site\.js/g)||[]).length,1,f+' loads site.js exactly once');assert.ok(!html.includes('science-events.js'),f+' must not load science-events.js');}
for(const f of allPages)assert.ok(!fs.readFileSync(path.join(root,f),'utf8').includes('G-GHN2GDS2RQ'),f+' must not contain the GA id; loaders live in assets/site.js and assets/science-events.js');
// Moon-phase images are deferred: no eager preload loop, lazy loader present.
{const moon=fs.readFileSync(path.join(root,'tools/moon-phases/index.html'),'utf8');assert.doesNotMatch(moon,/Object\.entries\(IMG\)\.forEach/,'moon-phases must not preload all images');assert.ok(moon.includes('IMAGE_STATE')&&moon.includes('function ensurePageImages'),'moon-phases lazy image loader present');}
const gtagStub=()=>{window.__events=[];window.gtag=function(){window.__events.push([].slice.call(arguments))}};
const eventsOf=p=>p.evaluate(()=>window.__events.filter(e=>e[0]==='event').map(e=>[e[1],e[2]]));
const stopNavigation=p=>p.evaluate(()=>{window.__events.length=0;document.addEventListener('click',e=>e.preventDefault(),true)});
const capture=new Set(['index.html','lianluo.html','ziyuan.html','xuexi-xitong.html','chengguo.html','app.html','guozhong-shuxue.html','guozhong-lihua.html','guozhong-yingwen.html','wenzhang/index.html','wenzhang/duoding.html','wenzhang/chengji-pinxing.html']);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');const body=fs.readFileSync(f);if(!f.endsWith('.html')){servedAssets.push(path.relative(root,f).split(path.sep).join('/'));res.setHeader('Cache-Control','public, max-age=600');}res.end(body)}catch{res.writeHead(404).end()}});
const servedAssets=[];// network fetches actually served by the test server (memory-cache hits never reach it)
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
async function overflowingElements(p){
 return p.evaluate(()=>[...document.querySelectorAll('*')]
  .filter(e=>e.getBoundingClientRect().right>window.innerWidth+1)
  .slice(0,30).map(e=>{
   const rect=e.getBoundingClientRect();
   const selector=e.id?'#'+CSS.escape(e.id):(()=>{
    const parts=[];let node=e;
    while(node&&node.nodeType===1){
     let part=node.localName;
     if(node.classList.length)part+='.'+[...node.classList].slice(0,2).map(CSS.escape).join('.');
     if(node.parentElement){const siblings=[...node.parentElement.children].filter(s=>s.localName===node.localName);if(siblings.length>1)part+=`:nth-of-type(${siblings.indexOf(node)+1})`}
     parts.unshift(part);node=node.parentElement;
    }
    return parts.join(' > ');
   })();
   return{selector,width:Math.round(rect.width*100)/100,right:Math.round(rect.right*100)/100,content:(e.innerText||e.textContent||'').trim().replace(/\s+/g,' ').slice(0,100)};
  }));
}

(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch(),results=[];
 try{
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:width===390?844:800},reducedMotion:'reduce'});
   await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());await ctx.addInitScript(gtagStub);
   for(const file of pages){
    const p=await ctx.newPage(),errors=[],httpErrors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)httpErrors.push(r.status()+' '+r.url())});
    const row={file,width};
    try{
     await p.goto(base+'/'+file,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
     await p.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));
     await p.waitForFunction(()=>[...document.images].every(i=>i.complete),null,{timeout:15000});await settle(p);
     const layout=await measureLayout(p,width);
     Object.assign(row,layout);assert.ok(layout.overflow<=2,'horizontal overflow');assert.deepEqual(layout.badImages,[],'broken images');
     if(file==='tools/science/index.html')assert.equal(layout.h1,1,'one directory h1');
     if(file==='index.html'){
      assert.equal(await p.locator('.hero').first().locator('.hero-actions a:visible').count(),2);
      assert.equal(await p.locator('.card-more').count(),3);
      if(width===390){await p.locator('.burger').click();assert.equal(await p.locator('.burger').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('.burger').getAttribute('aria-expanded'),'false');assert.ok(await p.locator('.burger').evaluate(el=>el===document.activeElement));}

      await stopNavigation(p);await p.locator('.hero .hero-actions a[href*="line.me"]').first().click();await p.locator('.hero .hero-actions a[href*="lianluo.html"]').first().click();if(width===390)await p.locator('.dock a[href^="tel:"]').click();
      const ev=await eventsOf(p);assert.deepEqual(ev[0],['cta_line',{page_group:'home',cta_location:'hero'}]);assert.deepEqual(ev[1],['cta_trial',{page_group:'home',cta_location:'hero'}]);if(width===390)assert.deepEqual(ev[2],['cta_phone',{page_group:'home',cta_location:'dock'}]);assert.equal(ev.length,width===390?3:2,'no extra events');
     }
     if(file==='guozhong-shuxue.html'){await stopNavigation(p);await p.locator('.subject-cta a[href*="lianluo.html"]').click();assert.deepEqual(await eventsOf(p),[['cta_trial',{page_group:'junior_math',cta_location:'mid'}]]);}
     if(await p.locator('script[src*="assets/site.js"]').count())assert.equal(await p.locator('script[src*="googletagmanager"]').count(),0,'page must not insert a second GA loader when gtag exists');
     if(file==='ziyuan.html'){
      const clipped=await p.locator('.res-stages').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(clipped,false,'all stage choices fit');
      await p.locator('.res-stages [data-val="升學"]').click();assert.ok(await p.locator('#res-exam').isVisible());assert.equal(await p.locator('#res-hs-math').isVisible(),false);
      await p.locator('.res-stages [data-val="全部"]').click();await p.locator('#resource-search').fill('透鏡');assert.ok(await p.locator('#res-science').isVisible());
      await p.locator('#resource-search').fill('不存在的教材測試');assert.match(await p.locator('#resource-filter-status').textContent(),/找不到/);
      await p.locator('#resource-search').fill('');await p.locator('#resource-search').blur();await p.evaluate(()=>scrollTo(0,0));
     }
     if(/^guozhong-(shuxue|lihua|yingwen)\.html$/.test(file)){assert.doesNotMatch(await p.locator('main').innerText(),/八成不是不會算|有一半是數學的問題|兩週後剩不到三成|真正的原因只有那一個單元/,'unsupported claims removed');assert.equal(await p.locator('.subject-jump a').count(),4,'subject jump nav');}
     if(file==='app.html'){const text=await p.locator('main').innerText();assert.match(await p.locator('#auto').textContent(),/選擇/,'desktop detect note');assert.equal(await p.locator('a[href^="https://apps.apple.com/"]').count(),1,'App Store link');assert.equal(await p.locator('a[href^="https://play.google.com/"]').count(),1,'Google Play link');assert.doesNotMatch(text,/QR code|認明開發者|開發者為百宏/,'no stale store claims');}
     if(file.startsWith('wenzhang/')){assert.equal(await p.locator('.masthead .brand img').count(),1);assert.equal(await p.locator('main#main').count(),1);assert.equal(await p.locator('.foot a[href="tel:+886422320448"]').count(),1);assert.equal(await p.locator('.dock').isVisible(),width===390);}
     if(capture.has(file)){await p.evaluate(()=>scrollTo(0,0));await settle(p);await p.screenshot({path:path.join(out,width+'-'+file.replaceAll('/','-')+'.png')});}
     if(width===390&&await p.locator('.foot .legal').count()){
      await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await settle(p);
      const gap=await p.locator('.foot').evaluate(el=>document.documentElement.scrollHeight-(el.getBoundingClientRect().bottom+scrollY));assert.ok(gap<=2,'no white gap below footer');
      assert.match(await p.locator('.foot .legal').textContent(),/週二 13:30 起/);
      if(capture.has(file))await p.screenshot({path:path.join(out,width+'-'+file.replaceAll('/','-')+'-footer.png')});
     }
     assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);row.pass=true;
    }catch(e){row.pass=false;row.error=e.message;row.errors=errors;row.httpErrors=httpErrors;if(e.message==='horizontal overflow')row.overflowElements=await overflowingElements(p).catch(()=>[]);await p.screenshot({path:path.join(out,width+'-'+file.replaceAll('/','-')+'-failure.png')}).catch(()=>{})}
    results.push(row);await p.close();
   }
   await ctx.close();
  }
  for(const [label,userAgent,expected] of [['iPhone','Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',/App Store/],['Android','Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',/Google Play/]]){
   const ctx=await browser.newContext({viewport:{width:390,height:844},userAgent});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   const p=await ctx.newPage(),errors=[],row={flow:'app detect',userAgent:label};p.on('pageerror',e=>errors.push(e.message));
   try{await p.goto(base+'/app.html?noga=1',{waitUntil:'domcontentloaded'});assert.match(await p.locator('#auto').textContent(),expected,label+' detect note');assert.deepEqual(errors,[]);row.pass=true}
   catch(e){row.pass=false;row.error=e.message}
   results.push(row);await ctx.close();
  }
  {const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const p=await ctx.newPage(),row={flow:'analytics loader'};
   try{await p.goto(base+'/index.html',{waitUntil:'networkidle'});assert.equal(await p.locator('script[src*="googletagmanager.com/gtag/js?id=G-GHN2GDS2RQ"]').count(),1,'single GA loader');assert.ok(await p.evaluate(()=>window.dataLayer.some(a=>a[0]==='config'&&a[1]==='G-GHN2GDS2RQ')),'config pushed');row.pass=true}catch(e){row.pass=false;row.error=e.message}
   results.push(row);await ctx.close();}
  {const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const p=await ctx.newPage(),row={flow:'analytics opt-out noga'};
   try{await p.goto(base+'/index.html?noga=1',{waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>typeof window.gtag),'undefined','noga: no gtag');assert.equal(await p.locator('script[src*="googletagmanager"]').count(),0,'noga: no loader');
    await p.goto(base+'/index.html',{waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>typeof window.gtag+'|'+localStorage.getItem('bhcs_noga')),'undefined|1','exclusion persists');assert.equal(await p.locator('script[src*="googletagmanager"]').count(),0,'still no loader');row.pass=true}catch(e){row.pass=false;row.error=e.message}
   results.push(row);await ctx.close();}
  {const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());await ctx.addInitScript(()=>{Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true,configurable:true})});const p=await ctx.newPage(),row={flow:'analytics opt-out gpc'};
   try{await p.goto(base+'/lianluo.html',{waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>typeof window.gtag),'undefined','gpc: no gtag');assert.equal(await p.locator('script[src*="googletagmanager"]').count(),0,'gpc: no loader');await p.locator('#pname').fill('x');assert.equal(await p.evaluate(()=>(window.dataLayer||[]).length),0,'gpc: no events');row.pass=true}catch(e){row.pass=false;row.error=e.message}
   results.push(row);await ctx.close();}
  for(const [file,smoke] of [
   ['tools/lenses.html',async p=>{await p.locator('.tab[data-page="focus"]').click();assert.equal(await p.locator('.tab[data-page="focus"]').getAttribute('aria-selected'),'true','lenses tab switches');const range=p.locator('input[type=range]').first();if(await range.count()){await range.evaluate(el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}))});}}],
   ['tools/moon-phases/index.html',async p=>{await p.locator('.tab[data-page="sim"]').click();assert.equal(await p.locator('.tab[data-page="sim"]').getAttribute('aria-selected'),'true','moon tab switches');}],
   ['tools/vertical.html',async p=>{await p.locator('#gen').click();assert.ok(await p.locator('#out').evaluate(el=>el.children.length>0||el.textContent.trim().length>0),'vertical generates problems');}]
  ]){
   const row={flow:'legacy tool analytics',file};
   try{
    {const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/net::ERR_FAILED|Failed to load resource/.test(m.text()))errors.push(m.text())});
     await p.goto(base+'/'+file,{waitUntil:'networkidle'});assert.equal(await p.locator('script[src*="googletagmanager.com/gtag/js?id=G-GHN2GDS2RQ"]').count(),1,'single GA loader');assert.ok(await p.evaluate(()=>typeof window.gtag==='function'&&window.dataLayer.some(a=>a[0]==='config'&&a[1]==='G-GHN2GDS2RQ')),'config pushed');
     await smoke(p);assert.deepEqual(errors,[],'tool runs without errors');await ctx.close();}
    {const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const p=await ctx.newPage();
     await p.goto(base+'/'+file+'?noga=1',{waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>typeof window.gtag+'|'+localStorage.getItem('bhcs_noga')),'undefined|1','noga stored, no gtag');assert.equal(await p.locator('script[src*="googletagmanager"]').count(),0,'noga: no loader');
     await p.goto(base+'/'+file,{waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>typeof window.gtag),'undefined','exclusion persists');assert.equal(await p.locator('script[src*="googletagmanager"]').count(),0,'still no loader');await ctx.close();}
    {const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());await ctx.addInitScript(()=>{Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true,configurable:true})});const p=await ctx.newPage();
     await p.goto(base+'/'+file,{waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>typeof window.gtag),'undefined','gpc: no gtag');assert.equal(await p.locator('script[src*="googletagmanager"]').count(),0,'gpc: no loader');await ctx.close();}
    row.pass=true;
   }catch(e){row.pass=false;row.error=e.message}
   results.push(row);
  }
  {const row={flow:'moon-phase lazy images'};
   // Route interception disables Chromium's HTTP cache, which would turn every re-rendered SVG <image> into a new fetch; so these contexts use no route (the page has no external requests with ?noga=1) except the deliberate image-failure case.
   const openMoon=async(route)=>{const ctx=await browser.newContext({viewport:{width:1280,height:900}});if(route)await ctx.route('**/*',r=>{const u=r.request().url();if(!u.startsWith(base)||route(u))return r.abort();return r.continue()});servedAssets.length=0;const p=await ctx.newPage(),errors=[];p.on('request',r=>{if(!r.url().startsWith(base))errors.push('external request '+r.url())});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/net::ERR_FAILED|Failed to load resource/.test(m.text()))errors.push(m.text())});const reqs={get list(){return servedAssets.filter(u=>u.startsWith('tools/moon-phases/img/')).map(u=>u.split('/').pop())}};await p.goto(base+'/tools/moon-phases/index.html?noga=1',{waitUntil:'networkidle'});await settle(p);return{ctx,p,errors,reqs}};
   const uniq=a=>[...new Set(a)].sort();const boxes=p=>p.evaluate(()=>({orbit:document.getElementById('orbit').getBoundingClientRect().toJSON(),sky:document.getElementById('sky')?document.getElementById('sky').getBoundingClientRect().toJSON():null,height:document.documentElement.scrollHeight}));
   try{
    // A: initial load requests no bitmap; vector fallback renders
    {const {ctx,p,errors,reqs}=await openMoon();assert.deepEqual(reqs.list,[],'initial load requests no moon-phase images');assert.equal(await p.locator('h1').count(),1);assert.ok(await p.locator('#orbit circle, #orbit path').count()>0,'vector orbit rendered');assert.deepEqual(errors,[]);
     // B: lock tab loads only earth + moon
     const before=await boxes(p);await p.locator('.tab[data-page="lock"]').click();await p.waitForLoadState('networkidle');await p.waitForTimeout(300);
     assert.deepEqual(uniq(reqs.list),['earth.png','moon.png'],'lock loads earth and moon only');assert.equal(reqs.list.length,2,'no duplicate requests');assert.equal(await p.locator('.tab[data-page="lock"]').getAttribute('aria-selected'),'true');assert.ok(await p.locator('#lockDemo image, #lockDemo circle').count()>0,'lock scene renders');assert.deepEqual(errors,[]);
     // C: sky page completes the set, each image once
     await p.locator('.tab[data-page="sim"]').click();await p.waitForLoadState('networkidle');await p.waitForTimeout(300);
     assert.deepEqual(uniq(reqs.list),['earth.png','horizon.png','moon.png','sky-day.jpg','sky-night.jpg','sun.png'],'sim loads the remaining images');assert.equal(reqs.list.length,6,'each image requested once');assert.ok(await p.evaluate(()=>HAS.earth&&HAS.moon&&HAS.sun&&HAS.skyDay&&HAS.skyNight&&HAS.horizon),'all images marked loaded');assert.ok(await p.locator('#orbit image').count()>0,'bitmap enhancement rendered');
     // back on the same page as the initial measurement, now with bitmaps: no layout shift
     await p.locator('.tab[data-page="cause"]').click();await settle(p);const after=await boxes(p);assert.deepEqual(after.orbit,before.orbit,'orbit box unchanged');assert.deepEqual(after.sky,before.sky,'sky box unchanged');assert.equal(after.height,before.height,'page height unchanged');assert.equal(reqs.list.length,6,'no refetch on re-render');assert.deepEqual(errors,[]);await ctx.close();}
    // D: first drag on cause loads the core group only
    {const {ctx,p,errors,reqs}=await openMoon();const m0=await p.evaluate(()=>S.moon);const box=await p.locator('#moon').boundingBox();const cx=box.x+box.width/2,cy=box.y+box.height/2;await p.mouse.move(cx,cy);await p.mouse.down();await p.mouse.move(cx+40,cy+25,{steps:4});await p.mouse.up();await p.waitForLoadState('networkidle');await p.waitForTimeout(300);
     assert.deepEqual(uniq(reqs.list),['earth.png','moon.png','sun.png'],'first drag loads core images only');assert.equal(reqs.list.length,3,'core requested once each');assert.notEqual(await p.evaluate(()=>S.moon),m0,'moon drag still works');assert.deepEqual(errors,[]);await ctx.close();}
    // E: failed image keeps the vector fallback and the tool usable
    {const {ctx,p,errors,reqs}=await openMoon(u=>u.endsWith('/img/moon.png'));await p.locator('.tab[data-page="lock"]').click();await p.waitForLoadState('networkidle');await p.waitForTimeout(400);
     assert.equal(await p.evaluate(()=>HAS.moon!==true&&IMAGE_STATE.moon==='failed'),true,'failed image marked failed');assert.ok(await p.locator('#lockDemo circle[r="34"]').count()>0,'vector moon fallback in lock scene');await p.locator('.tab[data-page="cause"]').click();await settle(p);assert.ok(await p.locator('#orbit circle, #orbit path').count()>0,'tool still renders after image failure');assert.deepEqual(errors,[]);await ctx.close();}
    row.pass=true;
   }catch(e){row.pass=false;row.error=e.message}
   results.push(row);
  }
  for(const storageDenied of [false,true]){
   const ctx=await browser.newContext({viewport:{width:390,height:844}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await ctx.addInitScript(gtagStub);await ctx.addInitScript(denied=>{window.__opened=[];window.open=(url,target,features)=>{window.__opened.push({url,target,features});return null};Object.defineProperty(navigator,'clipboard',{value:{writeText:async v=>{window.__copied=v}},configurable:true});if(denied)Object.defineProperty(window,'sessionStorage',{get(){throw Error('Storage blocked')}})},storageDenied);
   const p=await ctx.newPage(),errors=[],row={flow:'trial form',storageDenied};p.on('pageerror',e=>errors.push(e.message));
   try{
    await p.goto(base+'/lianluo.html');await p.locator('button[type=submit]').click();assert.equal(await p.evaluate(()=>__opened.length),0,'invalid form stays local');assert.deepEqual(await eventsOf(p),[],'invalid submit sends no event');
    assert.equal(await p.locator('.booking-steps li').count(),3,'three booking steps');assert.match(await p.locator('button[type=submit]').textContent(),/LINE/,'submit names LINE');assert.equal(await p.locator('#trial-draft-note').count(),1,'draft note present');
    await p.locator('#pname').fill('驗收家長');await p.locator('#phone').fill('0900000000');await p.locator('#grade').selectOption({label:'國中八年級'});await p.locator('#note').fill('理化 & 數學\n想了解費用 <測試>');
    assert.deepEqual(await eventsOf(p),[['trial_form_start',{page_group:'contact'}]],'form start once per load');
    assert.equal(await p.locator('.dock').isVisible(),false,'dock hides while typing');await p.locator('#note').blur();assert.ok(await p.locator('.dock').isVisible());
    if(!storageDenied){await p.reload();assert.equal(await p.locator('#pname').inputValue(),'驗收家長');assert.match(await p.locator('#note').inputValue(),/& 數學/)}else assert.match(await p.locator('#trial-draft-note').textContent(),/無法暫存/);
    await p.locator('button[type=submit]').click();assert.match(p.url(),/lianluo.html/);assert.ok(await p.locator('#trial-preview').isVisible());assert.match(await p.locator('#form-status').textContent(),/尚未送出/);
    assert.deepEqual((await eventsOf(p)).filter(e=>e[0]==='trial_line_open'),[['trial_line_open',{page_group:'contact'}]],'line open event once');
    const opened=await p.evaluate(()=>__opened);assert.equal(opened.length,1);assert.equal(opened[0].target,'_blank');assert.match(opened[0].features,/noopener/);assert.ok(opened[0].url.startsWith('https://line.me/R/oaMessage/%40bhcs/?'));assert.match(decodeURIComponent(new URL(opened[0].url).search.slice(1)),/理化 & 數學\n想了解費用 <測試>/);
    await p.locator('#note').fill('更新後的內容');await p.locator('#copy-trial').click();await p.waitForFunction(()=>window.__copied?.includes('更新後的內容'));assert.match(await p.evaluate(()=>__copied),/更新後的內容/);
    await p.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('Clipboard blocked')}});await p.locator('#copy-trial').click();assert.match(await p.locator('#form-status').textContent(),/已選取/);
    assert.equal((await eventsOf(p)).filter(e=>e[0]==='trial_copy').length,2,'copy event per click');assert.doesNotMatch(JSON.stringify(await p.evaluate(()=>window.__events)),/驗收家長|0900000000|理化 & 數學|更新後的內容|<測試>/,'no form data in analytics events');
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
