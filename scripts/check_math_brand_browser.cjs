// P1 equivalence checks in a real browser. No external requests or real print dialog.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {root,baseline,links}=require('./check_math_brand.cjs');
const out=path.resolve(process.env.MATH_BRAND_OUTPUT||'math-brand-artifacts');
const selected=process.env.MATH_BRAND_LINKS?process.env.MATH_BRAND_LINKS.split(','):links;
const cache=new Map(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),parts=decodeURIComponent(u.pathname).split('/').filter(Boolean),version=parts.shift(),file=parts.join('/');
 try{let body;if(version==='before'){if(!cache.has(file))cache.set(file,cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,maxBuffer:4e6}));body=cache.get(file)}else body=fs.readFileSync(path.join(root,file));res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(body)}catch{res.writeHead(404).end()}
});
const hash=s=>crypto.createHash('sha256').update(typeof s==='string'?s:JSON.stringify(s)).digest('hex');
// Playwright temporarily hides carets for screenshots and leaves empty style attributes.
const hashDOM=s=>hash(s.replace(/ style=""/g,''));
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
function geometry(){
 return [...document.body.querySelectorAll('*')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{
  const r=e.getBoundingClientRect(),s=getComputedStyle(e);return[e.tagName,e.id,...[r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100),s.fontFamily,s.fontSize,s.lineHeight,s.padding,s.margin,s.borderTopWidth,s.borderBottomWidth,s.breakAfter,s.breakInside];
 });
}
function colors(){
 const allowed=new Set(['rgb(22, 35, 58)','rgb(13, 22, 38)','rgb(67, 81, 107)','rgb(201, 210, 222)','rgb(242, 244, 247)','rgb(252, 252, 250)']);const bad=[];
 for(const e of document.body.querySelectorAll('*')){
  if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')continue;
  const s=getComputedStyle(e);
  for(const prop of ['color','backgroundColor','borderTopColor','fill','stroke']){
   const v=s[prop];if(!v||allowed.has(v))continue;const m=v.match(/^rgba?\((\d+), (\d+), (\d+)(?:, ([.\d]+))?\)$/);if(!m||m[4]==='0')continue;
   const[r,g,b]=m.slice(1,4).map(Number);if(allowed.has(`rgb(${r}, ${g}, ${b})`))continue;const max=Math.max(r,g,b),min=Math.min(r,g,b);
   if(max-min>25&&(g>r*1.12||b>r*1.12))bad.push({tag:e.tagName,id:e.id,class:e.getAttribute('class')?.slice(0,70),prop,color:v});
  }
 }
 return bad.slice(0,30);
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch(),results=[],printed=new Set();
 try{for(const link of selected){
  const id=link.replace(/^tools\//,'').replaceAll('/','-').replace('?topic=','-').replace('.html',''),file=link.split('?')[0],row={link},records={};
  const contexts=[];
  try{
   for(const version of ['before','after']){
    const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});contexts.push(ctx);
    await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
    await ctx.addInitScript(()=>{
     let seed=20260921;window.__seed=v=>seed=v;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
     const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:[1789977600000]))}static now(){return 1789977600000}};
     window.__prints=[];window.print=()=>{window.__prints.push({html:document.documentElement.outerHTML,body:document.body.innerHTML,geometry:window.__geometry()})};
    });
    const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/'+version+'/'+link+(link.includes('?')?'&':'?')+'noga=1',{waitUntil:'load'});
    // Freeze decorative transitions in both versions so print measurements are not taken mid-animation.
    await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});await settle(p);
    await p.evaluate(source=>window.__geometry=eval('('+source+')'),geometry.toString());
    const gen=p.locator('#generate,#gen,#btn-regenerate,button[onclick="generateExam()"]');assert.ok(await gen.count(),link+' generator button');
    await p.evaluate(()=>{window.__seed(772109);document.querySelector('#generate,#gen,#btn-regenerate,button[onclick="generateExam()"]')?.click()});await settle(p);
    const data={dom:hashDOM(await p.locator('body').innerHTML()),screen:await p.evaluate(geometry),errors};records[version]=data;
    if(version==='after'){
     assert.deepEqual(await p.evaluate(colors),[],'old screen colors remain');
     assert.equal(await gen.first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(232, 98, 12)','orange generate button');
     for(const vp of [{width:390,height:844},{width:1280,height:800},{width:1366,height:650}]){await p.setViewportSize(vp);await settle(p);await p.screenshot({path:path.join(out,id+'-'+vp.width+'x'+vp.height+'.png')})}
     await p.setViewportSize({width:1280,height:800});await settle(p);
     if(link==='tools/math/g6-drills.html?topic=time')fs.writeFileSync(path.join(out,'manual-ten.json'),JSON.stringify(await p.locator('.prob').evaluateAll(es=>es.slice(0,10).map(e=>({question:e.querySelector('.q')?.textContent,answer:e.querySelector('.ans')?.textContent}))),null,2));
    }
    if(!printed.has(file)){
     data.print={};
     for(const mode of ['student','teacher']){
      await p.emulateMedia({media:'print'});await settle(p);
      await p.evaluate(mode=>{
       const sel=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value===mode)&&[...s.options].some(o=>o.value===(mode==='student'?'teacher':'student')));
       if(sel){sel.value=mode;sel.dispatchEvent(new Event('change',{bubbles:true}))}
       const buttons=[...document.querySelectorAll('button')];const b=buttons.find(b=>/列印/.test(b.textContent)&&b.textContent.includes(mode==='teacher'?'教用':'學用'))||buttons.find(b=>b.id==='print');if(!b)throw Error('No print control');b.click();
      },mode);
      await p.waitForFunction(n=>window.__prints.length>=n,mode==='student'?1:2);
      const snap=await p.evaluate(()=>window.__prints.at(-1));data.print[mode]={dom:hashDOM(snap.body),geometry:snap.geometry};
      if(process.env.MATH_BRAND_DEBUG==='1')fs.writeFileSync(path.join(out,id+'-'+version+'-'+mode+'.html'),snap.body);
      if(process.env.MATH_BRAND_PDF==='1'&&['tools/math/g6-drills.html','tools/math/g7-factors-multiples.html','tools/math/g8-pythagorean.html','tools/math/g9-1-4-trig-ratio.html','tools/math/g9-1-2-parallel-proportional.html','tools/estimation.html'].includes(file)){
       const printPage=await ctx.newPage();await printPage.setJavaScriptEnabled?.(false);
       await printPage.route('**/*',r=>r.abort());await printPage.setContent(snap.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''));await printPage.emulateMedia({media:'print'});
       await printPage.pdf({path:path.join(out,id+'-'+version+'-'+mode+'.pdf'),preferCSSPageSize:true,printBackground:true});await printPage.close();
      }
      await p.emulateMedia({media:'screen'});await settle(p);
     }
    }
   }
   assert.equal(records.after.dom,records.before.dom,'generated worksheet DOM differs');
   assert.deepEqual(records.after.screen,records.before.screen,'screen geometry changed');
   assert.deepEqual(records.after.errors,[]);assert.deepEqual(records.before.errors,[]);
   if(!printed.has(file)){assert.deepEqual(records.after.print,records.before.print,'student/teacher print DOM or geometry changed');printed.add(file)}
   row.pass=true;row.identicalDOM=records.after.dom;row.printChecked=!!records.after.print;
  }catch(e){row.pass=false;row.error=e.message.slice(0,3500)}finally{for(const ctx of contexts)await ctx.close()}
  results.push(row);if(!row.pass)console.log(JSON.stringify(row));
 }}finally{await browser.close();server.close()}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));const failures=results.filter(r=>!r.pass);console.log(JSON.stringify({checked:results.length,printed:printed.size,failed:failures.length,failures},null,2));if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
