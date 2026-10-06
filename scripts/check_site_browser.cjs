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
// Mini-lab keyboard accessibility: labelled name field, native safety buttons with aria-pressed, keyboard-operable SVG stations.
{const mini=fs.readFileSync(path.join(root,'tools/mini-lab/index.html'),'utf8');assert.ok(mini.includes('<label class="sr-only" for="name">'),'mini-lab name field needs a label');assert.equal((mini.match(/<button type="button" class="rule" data-r="[a-z]+" aria-pressed="false">/g)||[]).length,3,'mini-lab safety rules are buttons with aria-pressed');assert.ok(!mini.includes('<div class="rule"'),'mini-lab rules must not be divs');assert.equal((mini.match(/class:'station',role:'button',tabindex:'0','aria-label':/g)||[]).length,2,'mini-lab stations are keyboard buttons');assert.ok(mini.includes('<a class="skip" href="#main">')&&mini.includes('<main id="main" tabindex="-1">'),'mini-lab skip link and main landmark');
 // Experiment keyboard alternatives: one shared drop path for pointer and keyboard, SVG actions bound through one helper, pointer drag kept.
 assert.ok(mini.includes('function completeDrop(')&&mini.includes('function renderDragAlternative(')&&mini.includes('function bindSvgAction('),'mini-lab shared drop path and svg action helper present');
 assert.equal((mini.match(/\.onDrop\(/g)||[]).length,1,'onDrop is called from completeDrop only');assert.ok(!/gg\.onclick/.test(mini),'no click-only SVG groups (toolGrid, hazards, sbtn)');
 assert.equal((mini.match(/bindSvgAction\(gg,/g)||[]).length,4,'toolGrid, both hazard renderers and sbtn use bindSvgAction');
 for(const ev of ['pointerdown','pointermove','pointerup'])assert.ok(mini.includes(`scene.addEventListener('${ev}'`),'pointer drag kept: '+ev);
 assert.ok(mini.includes("'data-item':it.id,'data-label':it.name"),'shelf draggables carry data-label');assert.ok(mini.includes('<div class="say" id="say" tabindex="-1">'),'#say is focusable for keyboard focus handoff');}
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
  for(const width of [390,1280]){
   const row={flow:'mini-lab keyboard accessibility',width};
   const ctx=await browser.newContext({viewport:{width,height:width<700?844:900}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/net::ERR_FAILED|Failed to load resource/.test(m.text()))errors.push(m.text())});
   const active=()=>p.evaluate(()=>({tag:document.activeElement.tagName,id:document.activeElement.id,cls:document.activeElement.getAttribute('class')||'',text:(document.activeElement.textContent||'').trim(),label:document.activeElement.getAttribute('aria-label')}));
   const tabToStation=async()=>{for(let i=0;i<12;i++){await p.keyboard.press('Tab');const a=await active();if(/\bstation\b/.test(a.cls))return a;}throw new Error('no station reachable by Tab')};
   try{
    await p.goto(base+'/tools/mini-lab/',{waitUntil:'networkidle'});await settle(p);
    assert.equal(await p.locator('h1').count(),1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0,'no overflow');
    // A: accessible name
    assert.equal(await p.getByLabel('你的名字').count(),1,'name field labelled');assert.equal(await p.locator('#name').getAttribute('placeholder'),'輸入你的名字');
    // B: skip link is first in tab order and focuses main
    await p.keyboard.press('Tab');assert.deepEqual((await active()).text,'跳到主要內容','skip link first');await p.keyboard.press('Enter');await settle(p);assert.equal(await p.evaluate(()=>location.hash),'#main');assert.equal((await active()).id,'main','main landmark focused');
    // C: safety rules by keyboard
    await p.locator('#name').focus();await p.keyboard.type('鍵盤測試');const rules=p.locator('.rule');assert.equal(await rules.count(),3);
    for(const [i,key] of [[0,'Space'],[1,'Enter'],[2,'Space']]){assert.equal(await rules.nth(i).getAttribute('aria-pressed'),'false');await rules.nth(i).focus();await p.keyboard.press(key);assert.equal(await rules.nth(i).getAttribute('aria-pressed'),'true','rule '+i+' pressed via '+key);assert.ok(await rules.nth(i).evaluate(el=>el.classList.contains('on')&&el.tagName==='BUTTON'));}
    assert.equal(await p.locator('#enter').isDisabled(),false,'enter enabled after three rules');
    // D: enter the lab by keyboard; stations are keyboard buttons
    await p.locator('#enter').focus();await p.keyboard.press('Enter');await settle(p);assert.ok(await p.locator('#lab.screen.active').count()===1,'lab shown');
    const stations=await p.evaluate(()=>[...document.querySelectorAll('#room .station')].map(s=>({role:s.getAttribute('role'),tab:s.getAttribute('tabindex'),label:s.getAttribute('aria-label'),hit:!!s.querySelector('.station-hit')})));const expected=await p.evaluate(()=>EXPERIMENTS.length+1);
    assert.equal(stations.length,expected,'experiments plus advanced door');assert.ok(stations.every(s=>s.role==='button'&&s.tab==='0'&&s.label&&s.hit),'station semantics');assert.ok(stations.some(s=>s.label==='進階教室'),'advanced door labelled');
    // E: Tab reaches a station with a visible focus ring; Enter opens it
    const focused=await tabToStation();assert.ok(await p.evaluate(()=>{const s=document.activeElement;return s.matches(':focus-visible')&&getComputedStyle(s.querySelector('.station-hit')).strokeWidth==='5px'}),'station focus ring visible');
    await p.keyboard.press('Enter');await settle(p);assert.equal(await p.locator('#expScreen.screen.active').count(),1,'Enter opens experiment');assert.equal(await p.locator('#expTitle').textContent(),focused.label,'experiment title matches station');
    await p.locator('#quitExp').click();await settle(p);assert.equal(await p.locator('#lab.screen.active').count(),1);
    await tabToStation();await p.keyboard.press('Space');await settle(p);assert.equal(await p.locator('#expScreen.screen.active').count(),1,'Space opens experiment');
    // F: pointer regression on a fresh load
    await p.evaluate(()=>localStorage.removeItem('minilab'));await p.goto(base+'/tools/mini-lab/',{waitUntil:'networkidle'});await settle(p);
    for(let i=0;i<3;i++)await p.locator('.rule').nth(i).click();assert.deepEqual(await p.locator('.rule').evaluateAll(els=>els.map(e=>e.getAttribute('aria-pressed'))),['true','true','true'],'pointer toggles rules');await p.locator('#name').fill('滑鼠測試');await p.locator('#enter').click();await settle(p);
    await p.locator('#room .station').first().click();await settle(p);assert.equal(await p.locator('#expScreen.screen.active').count(),1,'click opens experiment');
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0,'no overflow in experiment');assert.deepEqual(errors,[]);row.pass=true;
   }catch(e){row.pass=false;row.error=e.message}
   results.push(row);await ctx.close();
  }
  for(const width of [390,1280]){
   const row={flow:'mini-lab experiment keyboard alternatives',width};
   const ctx=await browser.newContext({viewport:{width,height:width<700?844:900}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await ctx.addInitScript(()=>{try{localStorage.setItem('minilab',JSON.stringify({name:'鍵盤測試',pts:0,badges:{safety:true},notes:[]}))}catch{}});
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/net::ERR_FAILED|Failed to load resource/.test(m.text()))errors.push(m.text())});
   const open=(id,n)=>p.evaluate(([id,n])=>{startExp(EXPERIMENTS.find(e=>e.id===id));while(si<n)advance();return si},[id,n]).then(()=>settle(p));
   const state=()=>p.evaluate(()=>({si,st:JSON.parse(JSON.stringify(st)),pts:P.pts,say:document.getElementById('say').textContent,sayCls:document.getElementById('say').className}));
   const active=()=>p.evaluate(()=>({tag:document.activeElement.tagName,id:document.activeElement.id,cls:document.activeElement.getAttribute('class')||'',alt:document.activeElement.dataset?document.activeElement.dataset.alt:undefined,label:document.activeElement.getAttribute('aria-label')}));
   const noOverflow=async msg=>assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0,msg);
   const tabToSvgAction=async()=>{await p.evaluate(()=>document.querySelector('.skip').focus());for(let i=0;i<12;i++){await p.keyboard.press('Tab');const a=await active();if(/\bsvg-action\b/.test(a.cls))return a;}throw new Error('no svg-action reachable by Tab')};
   const focusRing=()=>p.evaluate(()=>{const n=document.activeElement;const h=n.querySelector('.svg-action-hit');const t=document.createElement('i');t.style.color='var(--accent)';document.body.appendChild(t);const accent=getComputedStyle(t).color;t.remove();return n.matches(':focus-visible')&&!!h&&getComputedStyle(h).strokeWidth==='5px'&&getComputedStyle(h).stroke===accent});
   const altButtons=()=>p.evaluate(()=>[...document.querySelectorAll('#opts .drag-alt button[data-alt]')].map(b=>({alt:b.dataset.alt,text:b.textContent})));
   const sceneItems=()=>p.evaluate(()=>[...document.querySelectorAll('#scene [data-item]')].map(n=>({alt:n.dataset.item,text:`放入「${n.dataset.label}」`})));
   const keyDrop=async(alt,key)=>{await p.locator(`#opts [data-alt="${alt}"]`).focus();await p.keyboard.press(key);await settle(p);};
   const svgCenter=sel=>p.locator(sel).first().boundingBox().then(b=>({x:b.x+b.width/2,y:b.y+b.height/2}));
   const zoneCenter=()=>p.evaluate(()=>{const z=step().zone,q=scene.createSVGPoint();q.x=z.x+z.w/2;q.y=z.y+z.h/2;const c=q.matrixTransform(scene.getScreenCTM());return {x:c.x,y:c.y}});
   const dragItem=async item=>{const from=await svgCenter(`#scene [data-item="${item}"]`),to=await zoneCenter();await p.mouse.move(from.x,from.y);await p.mouse.down();await p.mouse.move((from.x+to.x)/2,(from.y+to.y)/2,{steps:3});await p.mouse.move(to.x,to.y,{steps:3});const over=await p.locator('#scene .zone.over').count();await p.mouse.up();await settle(p);return over};
   try{
    await p.goto(base+'/tools/mini-lab/',{waitUntil:'networkidle'});await settle(p);assert.equal(await p.locator('#lab.screen.active').count(),1,'saved name opens the lab');
    // A: generic single-zone drag (water, ordered layers) by keyboard only
    await open('water',2);let s0=await state();assert.equal(s0.si,2);assert.deepEqual(s0.st.layers,[]);
    assert.equal(await p.locator('#opts .drag-alt[role="group"][aria-label="拖曳替代操作"]').count(),1,'drag alternative panel present');assert.match(await p.locator('#opts .drag-alt p').textContent(),/不方便拖曳/);
    assert.deepEqual(await altButtons(),await sceneItems(),'panel mirrors the draggables in the scene');assert.equal((await altButtons()).length,4);await noOverflow('no overflow with drag panel');
    await keyDrop('gravel','Enter');let s1=await state();assert.deepEqual(s1.st.layers,[],'wrong order does not advance state');assert.equal(s1.pts,s0.pts,'wrong drop scores nothing');assert.match(s1.say,/現在還不能放碎石，先放棉花/);assert.match(s1.sayCls,/flash-no/);
    assert.equal((await active()).alt,'gravel','focus stays on the attempted item after the panel rebuilds');
    const order=['cotton','charcoal','sand','gravel'],names={cotton:'棉花',charcoal:'活性碳',sand:'細沙',gravel:'碎石'};
    for(const [i,item] of order.entries()){await keyDrop(item,i%2?'Space':'Enter');const s=await state();assert.deepEqual(s.st.layers,order.slice(0,i+1),'layer '+item);assert.equal(s.pts,s0.pts+10*(i+1),'score after '+item);assert.match(s.say,new RegExp('✔ 放好'+names[item]));assert.match(s.sayCls,/flash-ok/);
     if(i<3){const a=await active();assert.ok(a.alt&&a.tag==='BUTTON','focus moves to a remaining drag-alt button');}else assert.equal((await active()).id,'say','focus handed to the dialogue when the step completes');}
    await p.waitForTimeout(1400);assert.equal((await state()).si,3,'completed drag step auto-advances');const keyboardScore=(await state()).pts-s0.pts;assert.equal(keyboardScore,40);
    // B: single-item drag (photo lamp)
    await open('photo',1);assert.deepEqual((await altButtons()).map(b=>b.alt),['lamp','stone']);await keyDrop('stone','Enter');let sb=await state();assert.equal(sb.st.lamp,false);assert.match(sb.say,/要拖的是檯燈/);
    await keyDrop('lamp','Space');sb=await state();assert.equal(sb.st.lamp,true);assert.equal(sb.st.dist,'mid');assert.match(sb.say,/燈亮了/);await p.waitForTimeout(1400);assert.equal((await state()).si,2,'lamp step advances');
    // C: tool matching alternative (names vs. use descriptions, no tool names in targets)
    await open('tools',3);assert.equal(await p.locator('#opts .drag-alt #altName').count(),1);assert.equal(await p.locator('#opts .drag-alt #altTarget').count(),1);assert.equal(await p.locator('#opts .drag-alt label[for="altName"]').count(),1);assert.equal(await p.locator('#opts .drag-alt label[for="altTarget"]').count(),1);
    const opts=await p.evaluate(()=>({names:[...altName.options].filter(o=>o.value).map(o=>[o.value,o.text]),targets:[...altTarget.options].filter(o=>o.value).map(o=>[o.value,o.text]),tools:TOOLS.map(t=>[t.id,t.name,t.use.split('。')[0]])}));
    assert.equal(opts.names.length,15);assert.equal(opts.targets.length,15);assert.deepEqual(opts.names,opts.tools.map(t=>[t[0],t[1]]),'name options are the tool names');assert.deepEqual(opts.targets,opts.tools.map(t=>[t[0],t[2]]),'target options are the use descriptions');
    assert.ok(opts.targets.every(([,text])=>!opts.tools.some(t=>t[1]===text)),'target text never equals a tool name');assert.equal(await p.locator('#altMatch').isDisabled(),true,'match disabled until both chosen');await noOverflow('no overflow with match panel');
    await p.selectOption('#altName','beaker');await p.selectOption('#altTarget','tube');assert.equal(await p.locator('#altMatch').isDisabled(),false);const c0=await state();
    await p.locator('#altMatch').focus();await p.keyboard.press('Enter');await settle(p);let sc=await state();assert.deepEqual(sc.st.matched,[],'wrong target does not match');assert.equal(sc.pts,c0.pts);assert.match(sc.say,/那是試管，再找找/);
    assert.equal(await p.locator('#altName').inputValue(),'beaker','name selection kept after a wrong match');assert.equal(await p.locator('#altTarget').inputValue(),'tube','target selection kept after a wrong match');
    await p.selectOption('#altTarget','beaker');await p.locator('#altMatch').focus();await p.keyboard.press('Space');await settle(p);sc=await state();assert.deepEqual(sc.st.matched,['beaker'],'correct target matches');assert.equal(sc.pts,c0.pts+10);assert.match(sc.say,/燒杯配對成功/);
    assert.equal(await p.evaluate(()=>[...altName.options].filter(o=>o.value).length),14,'matched name removed');assert.equal(await p.evaluate(()=>[...altTarget.options].filter(o=>o.value).length),14,'matched target removed');assert.equal((await active()).id,'altName','focus returns to the panel');
    // D: toolGrid cards are keyboard buttons
    await open('tools',0);const cards=await p.evaluate(()=>[...document.querySelectorAll('#scene .svg-action')].map(n=>({role:n.getAttribute('role'),tab:n.getAttribute('tabindex'),label:n.getAttribute('aria-label'),hit:!!n.querySelector('.svg-action-hit')})));
    assert.equal(cards.length,15);assert.ok(cards.every((c,i)=>c.role==='button'&&c.tab==='0'&&c.hit&&c.label.startsWith(opts.tools[i][1]+'：')),'tool card semantics');
    const first=await tabToSvgAction();assert.ok(await focusRing(),'tool card focus ring visible');await p.keyboard.press('Enter');await settle(p);let sd=await state();assert.equal(sd.st.seen.length,1);assert.equal(sd.st.sel,'beaker');assert.match(sd.say,/燒杯/);
    assert.equal((await active()).label,first.label,'focus restored to the same card after redraw');await p.keyboard.press('Tab');await p.keyboard.press('Space');await settle(p);sd=await state();assert.equal(sd.st.seen.length,2);assert.equal(sd.st.sel,'tube');
    // E: safety hazards
    await open('rules',1);const haz=await p.evaluate(()=>[...document.querySelectorAll('#scene .svg-action')].map(n=>n.getAttribute('aria-label')));assert.equal(haz.length,6);assert.ok(haz.every(l=>l.startsWith('危險行為：')),'hazard labels');
    const h0=await state();await tabToSvgAction();assert.ok(await focusRing(),'hazard focus ring visible');await p.keyboard.press('Enter');await settle(p);const se=await state();assert.equal(se.st.found.length,1);assert.equal(se.pts,h0.pts+10);assert.match(se.say,/還有 5 個/);
    assert.equal(await p.locator('#scene .svg-action').count(),5,'found hazard no longer interactive');assert.match((await active()).cls,/svg-action/,'focus moves to a remaining hazard');
    // F: sbtn scene buttons
    await open('photo',2);await p.evaluate(()=>{st.lamp=true;st.dist='mid';draw()});const labels=await p.evaluate(()=>[...document.querySelectorAll('#scene .svg-action')].map(n=>n.getAttribute('aria-label')));assert.deepEqual(labels,['拉近','中等','拉遠']);
    await tabToSvgAction();assert.equal((await active()).label,'拉近');assert.ok(await focusRing(),'scene button focus ring');await p.keyboard.press('Space');await settle(p);assert.equal(await p.evaluate(()=>st.dist),'near');assert.equal((await active()).label,'拉近','focus restored after redraw');
    await open('solar',1);assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('#scene .svg-action')].map(n=>n.getAttribute('aria-label'))),['0°','20°','45°','70°','90°']);
    // G: pointer regression and score parity on the same water step
    await open('water',2);const g0=await state();const overWrong=await dragItem('gravel');assert.equal(overWrong,1,'zone highlights while dragging');let sg=await state();assert.deepEqual(sg.st.layers,[]);assert.equal(sg.pts,g0.pts);assert.match(sg.say,/先放棉花/);
    assert.ok(await p.evaluate(()=>!!document.querySelector('#scene [data-item="gravel"] animateTransform')),'wrong drop bounces back');
    for(const [i,item] of order.entries()){await dragItem(item);sg=await state();assert.deepEqual(sg.st.layers,order.slice(0,i+1));assert.equal(sg.pts,g0.pts+10*(i+1));if(i===0)assert.ok(await p.evaluate(()=>document.querySelectorAll('#fx *').length>0),'correct drop plays fx');}
    assert.equal(sg.pts-g0.pts,keyboardScore,'pointer and keyboard paths score the same');await p.waitForTimeout(1400);assert.equal((await state()).si,3);
    await open('tools',0);await p.locator('#scene .svg-action').nth(2).click();await settle(p);assert.equal(await p.evaluate(()=>st.sel),'flask','mouse click still selects a tool card');
    await open('photo',2);await p.locator('#scene .svg-action[aria-label="拉遠"]').click();await settle(p);assert.equal(await p.evaluate(()=>st.dist),'far','mouse click still drives scene buttons');
    await noOverflow('no overflow at end');assert.deepEqual(errors,[]);row.pass=true;
   }catch(e){row.pass=false;row.error=e.message}
   results.push(row);await ctx.close();
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
