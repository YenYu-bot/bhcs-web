'use strict';
// 新版 tools/lab 實驗桌共用瀏覽器檢查：真 Chromium，桌機滑鼠＋手機觸控，本機靜態伺服器。
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert=require('node:assert/strict'), http=require('node:http'), fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};

async function runDesk(route,flow){
  const server=http.createServer((req,res)=>{
    try{
      let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
      if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
      res.end(fs.readFileSync(file));
    }catch{res.writeHead(404).end();}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [1280,390]){
      const mobile=width<600;
      const ctx=await browser.newContext({viewport:{width,height:mobile?844:800},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
      const p=await ctx.newPage(), errors=[], failed=[];
      p.on('pageerror',e=>errors.push(e.message));
      p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))failed.push([r.status(),r.url()]);});
      p.on('dialog',d=>d.accept());
      await p.goto(origin+route);
      await p.waitForSelector('html[data-notebook-ready]');
      const t={
        p,width,mobile,
        wait:ms=>p.waitForTimeout(ms),
        text:async s=>(await p.textContent(s)).replace(/\s+/g,' ').trim(),
        readouts:async()=>Promise.all(['#r-1','#r-2','#r-3'].map(s=>p.textContent(s).then(x=>x.trim()))),
        kicker:async()=>(await p.textContent('#task-kicker')).trim(),
        save:async()=>{await p.click('#save');await p.waitForTimeout(900);},
        next:async()=>{await p.click('#task-go');await p.waitForTimeout(300);},
        btn:async k=>{await p.locator('#ctl-btns button').nth(k).click();await p.waitForTimeout(120);},
        // 場景工具：手機用觸控點按
        tool:async(k=0)=>{const l=p.locator('#rig .tool').nth(k);if(mobile)await l.tap({force:true});else await l.click({force:true});await p.waitForTimeout(150);},
        noOverflow:async label=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`horizontal overflow ${width}px ${label}`),
        quiz:async picks=>{
          for(const k of picks){
            await p.locator('#quiz button').nth(k).click();await p.waitForTimeout(150);
            if(await p.evaluate(()=>document.querySelector('#finish-dialog').open))break;
            const a=p.locator('#bubble button');if(await a.count()){await a.first().click();await p.waitForTimeout(150);}
          }
          if(!await p.evaluate(()=>document.querySelector('#finish-dialog').open)){const f=p.locator('#bubble button');if(await f.count())await f.first().click();await p.waitForTimeout(200);}
          assert.ok(await p.evaluate(()=>document.querySelector('#finish-dialog').open),`finish dialog at ${width}px`);
        }
      };
      await flow(t);
      await p.reload();await p.waitForSelector('html[data-notebook-ready]');
      const done=await p.locator('#steps .done, #steps [aria-current], #steps button').allTextContents();
      assert.ok(done.length>0,`steps after reload ${width}px`);
      await t.noOverflow('after reload');
      assert.deepEqual(errors,[],`page errors ${width}px`);
      assert.deepEqual(failed,[],`failed requests ${width}px`);
      await p.evaluate(()=>new Promise(r=>{const q=indexedDB.deleteDatabase('bhcs.lab.notebooks.v1');q.onsuccess=q.onerror=q.onblocked=()=>r();}));
      await ctx.close();
      console.log(`PASS ${route} ${width}px`);
    }
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
module.exports={runDesk,assert};
