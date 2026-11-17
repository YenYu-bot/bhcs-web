'use strict';
// Real Chromium with mouse and emulated touch; no physical device or live data.
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert=require('node:assert/strict'), http=require('node:http'), fs=require('node:fs'), path=require('node:path');

const root=path.resolve(__dirname,'..');
const route='/tools/lab/pressure/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  try{
    let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
});
const closeServer=()=>new Promise(r=>server.close(r));

async function scenario(browser,origin,width){
  const mobile=width<600, height=720;
  const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
  const page=await context.newPage(), l=s=>page.locator(s), errors=[], failed=[], stages=[];
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
  const view=async mode=>{
    stages.push(mode);
    assert.equal(await l(`svg[data-pressure-diagram="${mode}"]`).count(),1,mode);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),`unexpected horizontal overflow at ${width}px/${mode}`);
  };
  const values=async(...expected)=>assert.deepEqual(await l('#readings strong').allTextContents(),expected);
  const click=async s=>l(s).click();
  const center=async selector=>{
    const b=await l(selector).boundingBox();
    assert.ok(b,selector);
    return {x:b.x+b.width/2,y:b.y+b.height/2};
  };
  const cd=mobile?await context.newCDPSession(page):null;
  const geom=async()=>l('#pressure-diagram svg').evaluate(svg=>{const r=svg.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const touchPoint=(x,y)=>({x:Math.round(x),y:Math.round(y)});
  const gesture=async ({x,y},dx,dy,cancel=false)=>{
    if(!mobile){
      await page.mouse.move(x,y);
      await page.mouse.down();
      await page.mouse.move(x+dx,y+dy,{steps:7});
      await page.mouse.up();
      return;
    }
    const send=(type,points)=>cd.send('Input.dispatchTouchEvent',{type,touchPoints:points});
    await send('touchStart',[touchPoint(x,y)]);
    for(let i=1;i<=7;i++)await send('touchMove',[touchPoint(x+dx*i/7,y+dy*i/7)]);
    await send(cancel?'touchCancel':'touchEnd',[]);
  };
  const blankScroll=async control=>{
    if(!mobile)return;
    await l('#pressure-diagram').scrollIntoViewIfNeeded();
    const {x,y,w,h}=await geom();
    const start={x:x+w*.035,y:Math.min(y+h*.83,height-35)};
    assert.ok(start.y>100,'scroll gesture must start in the visible apparatus');
    assert.equal(await page.evaluate(({x,y})=>Boolean(document.elementFromPoint(x,y)?.closest('[data-pressure-probe],[data-pressure-piston]')),start),false);
    assert.ok(await page.evaluate(({x,y})=>Boolean(document.elementFromPoint(x,y)?.closest('#pressure-diagram')),start),'scroll gesture must hit the apparatus');
    const y0=await page.evaluate(()=>window.scrollY),before=await l(control).inputValue();
    await gesture(start,0,-110);
    await page.waitForFunction(y=>window.scrollY>y+8,y0,{timeout:3500});
    assert.equal(await l(control).inputValue(),before,'scroll from empty apparatus should not alter apparatus');
  };
  const setRange=async (s,val)=>l(s).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},val);

  try{
    const response=await page.goto(origin+route,{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    await view('torricelli'); await values('101.3 kPa','76.0 cm');
    assert.equal(await l('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
    assert.ok((await l('.apparatus').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('bg-physics-bench.webp'));
    assert.ok((await l('.teacher-sprite').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('doc-point.png'));
    assert.ok(await l('#act').isDisabled());
    await setRange('#air-pressure',60); await values('60.0 kPa','45.0 cm');
    await setRange('#air-pressure',110); await values('110.0 kPa','82.5 cm');
    await click('[data-air="80"]'); await values('80.0 kPa','60.0 cm'); await click('#act');
    await view('water'); await values('0.0 kPa','101.3 kPa');
    assert.match(await l('#evidence-text').innerText(),/相對壓力是 0，但絕對壓力仍是大氣壓/);
    await click('[data-depth="1"]'); await values('9.8 kPa','111.1 kPa');
    const probe='[data-pressure-probe] rect[pointer-events=all]';
    await l('#pressure-diagram').scrollIntoViewIfNeeded();
    await gesture(await center(probe),0,30,mobile);
    const dragged=+await l('#depth').inputValue();
    assert.ok(dragged>1,`water probe unchanged after drag: ${dragged}`);
    assert.equal(await l('.pressure-figure.is-dragging').count(),0,'probe cancellation/release should clear drag state');
    await gesture(await center(probe),0,-27);
    assert.ok(+await l('#depth').inputValue()<dragged,'probe should be draggable again after cancellation/release');
    await blankScroll('#depth'); await click('[data-depth="2"]'); await values('19.6 kPa','120.9 kPa'); await click('#act');
    await view('gas'); await values('1.00 L','101.3 kPa');
    const grip='[data-pressure-piston-grip] rect:first-of-type';
    assert.equal(await l('[data-pressure-barrel-rear]').count(),1);
    assert.equal(await l('[data-pressure-sealed-nozzle]').count(),1);
    const particles='[data-pressure-particle]';
    assert.equal(await l(particles).count(),24);
    await l('#pressure-diagram').scrollIntoViewIfNeeded();
    await gesture(await center(grip),-31,0,mobile);
    const pushed=+await l('#volume').inputValue();
    assert.ok(pushed<1,`syringe volume unchanged after drag: ${pushed}`); assert.equal(await l(particles).count(),24);
    assert.equal(await l('.pressure-figure.is-dragging').count(),0,'grip cancellation/release should clear drag state');
    await gesture(await center(grip),25,0);
    assert.ok(+await l('#volume').inputValue()>pushed,'grip should be draggable again after cancellation/release');
    assert.equal(await l(particles).count(),24);
    await blankScroll('#volume'); await click('[data-volume="0.5"]'); await values('0.50 L','202.6 kPa'); await click('#act');
    stages.push('quiz');
    for(const [i,j] of [1,1,0,2].entries())await l('#questions fieldset').nth(i).locator('button').nth(j).click();
    assert.match(await l('#done').innerText(),/四題全對/);
    assert.match(await l('#questions fieldset').nth(2).innerText(),/水面絕對壓力仍為 101.3 kPa/);
    await page.reload({waitUntil:'networkidle'});
    assert.match(await l('#done').innerText(),/四題全對/);
    assert.match(await l('#notebook').innerText(),/120\.9 kPa/);
    await click('#clear'); await click('#clear-dialog button[value=cancel]');
    assert.match(await l('#done').innerText(),/四題全對/);
    await click('#clear'); await click('#clear-dialog button[value=clear]');
    await view('torricelli'); await values('101.3 kPa','76.0 cm');
    assert.deepEqual(errors,[]); assert.deepEqual(failed,[]);
    console.log(`PASS pressure story at ${width}px: ${mobile?'Chromium emulated touch, cancel/recover, empty-apparatus scroll':'desktop mouse'}, no overflow/errors, numerical checkpoints, quiz, reload and reset`);
  }catch(e){
    console.error('Pressure browser QA failure',JSON.stringify({width,stages,errors,failed}));
    throw e;
  }finally{await context.close();}
}

(async()=>{
  const external=process.env.PRESSURE_BROWSER_ORIGIN;
  if(!external)await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=external?new URL(external).origin:`http://127.0.0.1:${server.address().port}`;
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
    for(const width of [320,390,1280])await scenario(browser,origin,width);
  }finally{await browser?.close();if(!external)await closeServer();}
})().catch(e=>{console.error(e);process.exitCode=1;});
