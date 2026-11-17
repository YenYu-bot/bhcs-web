// Exercise the nested official route with native Chromium keyboard and emulated touch, not physical-phone QA.
'use strict';
const A = require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const artifacts=process.env.REFLECTION_BROWSER_ARTIFACTS;
if(artifacts)fs.mkdirSync(artifacts,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const raw=new URL(req.url,'http://local.test').pathname;
  if(raw==='/favicon.ico'){res.writeHead(204).end();return;}
  let name=path.resolve(root,'.'+raw);if(raw.endsWith('/'))name=path.join(name,'index.html');
  if(!name.startsWith(root+'/')||!fs.existsSync(name)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream'});fs.createReadStream(name).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  const url='http://127.0.0.1:'+server.address().port+'/tools/lab/reflection-refraction/';
  for(const width of [320,390,1280]){
   const mobile=width<800;
   const ctx=await browser.newContext({viewport:{width,height:mobile?720:900},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
   const origin=new URL(url).origin;
   await ctx.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
   const page=await ctx.newPage(),errors=[],assets=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(/doc-point\.png|bg-physics-bench\.webp/.test(r.url()))assets.push([r.url(),r.status()]);if(r.status()>=400)errors.push(r.status()+' '+r.url());});
   A.equal((await page.goto(url)).status(),200);
   A.equal(await page.title(),'光的反射與折射｜百宏自然實驗桌');
   await page.getByRole('heading',{name:'照平面鏡，從法線量角'}).waitFor();
   await page.waitForLoadState('networkidle');
   A.equal(assets.length,2);A.ok(assets.every(([url,s])=>s===200),JSON.stringify(assets));
   const within=()=>page.evaluate(expected=>innerWidth===expected&&document.documentElement.scrollWidth<=expected+1,width);
   const measure=()=>page.locator('#reading .metric strong').allTextContents();
   const click=()=>page.locator('#act').click();
   const notebook=()=>page.locator('#notebook [data-record]').count();
   A.ok(await within());A.deepEqual(await measure(),['20°','20°']);
   const slider=page.locator('#angle');
   await slider.press('ArrowRight');
   A.deepEqual((await measure()).map(parseFloat),[20.1,20.1]);
   A.equal(await notebook(),0);
   await slider.press('ArrowLeft');
   if(mobile){
    const sess=await ctx.newCDPSession(page);
    const touch=(type,xy)=>sess.send('Input.dispatchTouchEvent',{type,touchPoints:xy?[{x:xy.x,y:xy.y,id:7}]:[]});
    const point=(deg, radius=70)=>page.locator('#diagram svg').evaluate((svg,{deg,radius})=>{
      const r=deg*Math.PI/180,p=svg.createSVGPoint();p.x=210-radius*Math.sin(r);p.y=134-radius*Math.cos(r);
      const x=p.matrixTransform(svg.getScreenCTM());return {x:x.x,y:x.y};
    },{deg,radius});
    const start=()=>page.locator('#diagram circle[data-angle-handle]').last().evaluate(el=>{const b=el.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};});
    const moveAndObserve=async angle=>{
      await touch('touchMove',await point(angle));
      // CDP acknowledges the input before a frame can deliver its pointermove.
      // Await both live readings before sending the next move or ending the touch.
      await page.waitForFunction(expected=>{
        const labels=[...document.querySelectorAll('#reading .metric strong')];
        return labels.length===2&&labels.every(label=>Math.abs(parseFloat(label.textContent)-expected)<=.35);
      },angle,{timeout:3500});
    };
    await page.locator('#diagram').scrollIntoViewIfNeeded();
    const before=await page.evaluate(()=>scrollY);
    await touch('touchStart',await start());
    await moveAndObserve(31);
    await moveAndObserve(48);
    await touch('touchCancel');
    A.ok((await measure()).every(x=>Math.abs(parseFloat(x)-48)<=.35),String(await measure()));
    A.equal(await page.evaluate(()=>scrollY),before,'drag must not scroll');
    await touch('touchStart',await start());
    await moveAndObserve(37);
    await moveAndObserve(29);
    await touch('touchEnd');
    A.ok((await measure()).every(x=>Math.abs(parseFloat(x)-29)<=.35),String(await measure()));
    const swipeStart=await page.locator('#diagram svg').evaluate(s=>{const p=s.createSVGPoint();p.x=385;p.y=210;const q=p.matrixTransform(s.getScreenCTM());return{x:q.x,y:q.y};});
    const capturedValue=await measure();
    await touch('touchStart',swipeStart);
    for(const dy of [20,45,75,110,145,185]){await touch('touchMove',{x:swipeStart.x,y:swipeStart.y-dy});await new Promise(r=>setTimeout(r,24));}
    await touch('touchEnd');
    await page.waitForFunction(prev=>scrollY>prev+25,before);
    A.deepEqual(await measure(),capturedValue,'empty bench swipe should scroll only');
    A.equal(await notebook(),0);
    await click();A.deepEqual(await measure(),['20°','20°']);
   }
   const observed=[];
   for(let n=0;n<28&&!/^任務 6/.test(await page.locator('#progress').innerText());n++){
     if((await page.locator('#act').innerText()).includes('記下')){
       observed.push(await measure());
       if(observed.length===7){
         A.equal(await page.locator('#diagram svg').getAttribute('aria-label').then(s=>s.includes('沿介面')),true);
         if(artifacts)await page.screenshot({path:path.join(artifacts,'critical-'+width+'.png'),fullPage:true});
       }
     }
     await click();
   }
   A.equal(observed.length,8);
   A.deepEqual(observed[0].map(parseFloat),[20,20]);A.deepEqual(observed[1].map(parseFloat),[40,40]);
   A.deepEqual(observed[2].map(parseFloat),[0,0,0]);A.deepEqual(observed[3].map(parseFloat),[30,30,19.47]);
   A.deepEqual(observed[4].map(parseFloat),[30,30,22.08]);A.deepEqual(observed[5].map(parseFloat),[30,30,48.59]);
   A.deepEqual(observed[6].map(parseFloat),[41.81,41.81,90]);A.deepEqual(observed[7].map(parseFloat).slice(0,2),[45,45]);
   A.equal(observed[7][2],'無折射光');
   A.ok(await within());A.equal(await notebook(),8);
   await page.reload();
   A.equal(await notebook(),8);A.equal(errors.length,0,JSON.stringify(errors));
   console.log('PASS Chromium width',width,mobile?'CDP touch drag, cancel/retry, blank scroll;':'desktop;', 'all 6 steps incl. critical tangent + TIR, 8 saved readings, no horizontal overflow, correct local assets, no errors.');
   await ctx.close();
  }
 } finally {if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1;});
