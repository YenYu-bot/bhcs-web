// Real Chromium evidence for every welcome composition; screenshots need human review.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.env.COMPOSITION_OUTPUT||'composition-artifacts');
const legacy=['microscope','photosynthesis-factor','genetics-simulation','force-motion','circuit','particle-reaction','acid-base-indicator','heat-phase','buoyancy-density','plate-earthquake'].map(x=>'tools/'+x+'-lab.html');
const shared=['optics','wave-sound','electromagnetism','pressure-fluid','energy','solubility','moon-eclipse','seasons','plant-exchange','ecosystem'].map(x=>'tools/science/'+x+'.html');
const pages=[...legacy,...shared,'tools/science/index.html'];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch();
 const results=[];
 fs.writeFileSync(path.join(output,'environment.json'),JSON.stringify({browser:await browser.version(),node:process.version,viewports:process.env.COMPOSITION_WIDTHS||'390,768,1280'},null,2));
 try{
  for(const width of (process.env.COMPOSITION_WIDTHS||'390,768,1280').split(',').map(Number)){
   const context=await browser.newContext({viewport:{width,height:width===390?844:800},deviceScaleFactor:1,reducedMotion:'reduce'});
   // Keep this static-site check deterministic and offline.
   await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   for(const file of pages){
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/'+file+'?noga=1',{waitUntil:'networkidle'});
    await page.locator('.researcher-scene').waitFor();
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.researcher-bubble.is-aligned').waitFor();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const checks=await page.evaluate(()=>{
     const scene=document.querySelector('.researcher-scene'),doc=scene.querySelector('.doc'),bubble=scene.querySelector('.researcher-bubble');
     const s=scene.getBoundingClientRect(),d=doc.getBoundingClientRect(),b=bubble.getBoundingClientRect();
     // object-fit:contain may leave unpainted space in the image element.
     const scale=Math.min(d.width/doc.naturalWidth,d.height/doc.naturalHeight);
     const w=doc.naturalWidth*scale,h=doc.naturalHeight*scale,x=d.x+(d.width-w)/2,y=d.y+(d.height-h)/2;
     const face={left:x+w*.2,right:x+w*.68,top:y+h*.05,bottom:y+h*.33};
     const faceCovered=b.left<face.right&&b.right>face.left&&b.top<face.bottom&&b.bottom>face.top;
     const microscope=doc.src.includes('doc-microscope'),wave=doc.src.includes('doc-wave');
     const mouth={x:x+w*(microscope?.49:wave?.5:.42),y:y+h*(microscope?.32:wave?.28:.30)};
     const tail=getComputedStyle(bubble,'::before');
     const tailY=b.top+parseFloat(getComputedStyle(bubble).borderTopWidth)+parseFloat(tail.top)+parseFloat(tail.height)/2;
     const tailX=b.left+parseFloat(tail.left);
     const tailAligned=Math.abs(tailY-mouth.y)<=4&&tailX>mouth.x;
     const shortTail=parseFloat(tail.width)<=16&&parseFloat(tail.height)<=20;
     const room=scene.querySelector('.room'),transform=getComputedStyle(room).transform;
     const scienceOrientation=!(room.src.match(/scene-(physics|chemistry|earth)/)&&transform.startsWith('matrix(-1'));
     return {tailAligned,shortTail,scienceOrientation,tailOffset:Math.round((tailY-mouth.y)*100)/100,character:{x:x-s.x,y:y-s.y,width:w,height:h},loaded:[...scene.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),overflow:document.documentElement.scrollWidth-innerWidth,bubbleInside:b.left>=s.left&&b.right<=s.right&&b.top>=s.top&&b.bottom<=s.bottom,textFits:bubble.scrollWidth<=bubble.clientWidth+2&&bubble.scrollHeight<=bubble.clientHeight+2,characterInside:x>=s.left-5&&x+w<=s.right+5&&y>=s.top&&y+h<=s.bottom+3,faceCovered,scene:{width:s.width,height:s.height},bubble:{left:b.left-s.left,top:b.top-s.top,width:b.width,height:b.height}};
    });
    const id=width+'-'+file.replace(/^tools\//,'').replaceAll('/','-').replace('.html','');
    await page.locator('.researcher-welcome').screenshot({path:path.join(output,id+'.png')});
    await page.locator('.researcher-scene').screenshot({path:path.join(output,id+'-scene.png')});
    results.push({file,width,...checks,errors,pass:checks.tailAligned&&checks.shortTail&&checks.scienceOrientation&&checks.loaded&&checks.overflow<=2&&checks.bubbleInside&&checks.textFits&&checks.characterInside&&!checks.faceCovered&&!errors.length});
    await page.close();
   }
   await context.close();
  }
 }finally{await browser.close();server.close()}
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
 const failures=results.filter(r=>!r.pass);
 console.log(JSON.stringify({checked:results.length,failed:failures.length,failures},null,2));
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
