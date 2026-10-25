const fs=require('fs'),path=require('path'),assert=require('assert');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
async function check(enhanced){
 const requests=[],errors=[];
 class Local extends ResourceLoader{fetch(url){requests.push(url);const u=new URL(url);assert.equal(u.origin,'https://www.bhcs.com.tw');if(!enhanced&&u.pathname.endsWith('/researcher-lab.js'))return null;const p=path.join(root,u.pathname);assert(fs.existsSync(p));return Promise.resolve(fs.readFileSync(p))}}
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Could not parse CSS'))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync(root+'/tools/science/enzyme.html','utf8'),{url:'https://www.bhcs.com.tw/tools/science/enzyme.html?noga=1&nofonts=1',runScripts:'dangerously',resources:new Local(),virtualConsole:vc,pretendToBeVisual:true});
 await new Promise(r=>setTimeout(r,500));const w=dom.window,d=w.document;
 assert.equal(d.body.classList.contains('researcher-station'),enhanced);
 assert.equal(d.querySelectorAll('.cute-concepts').length,1);assert.equal(d.querySelectorAll('.cute-concept').length,3);
 assert.equal(d.querySelectorAll('.cute-key-lesson').length,1);assert.equal(d.querySelectorAll('.cute-check').length,1);
 assert.equal(d.querySelectorAll('.cute-start').length,enhanced?0:1);
 assert.equal(d.querySelectorAll('.cute-scene-label').length,0,'remove obscured decorative label rather than covering teacher');
 const state=JSON.stringify(w.history.state),len=w.history.length,local=JSON.stringify({...w.localStorage}),session=JSON.stringify({...w.sessionStorage}),controls=[...d.querySelectorAll('input,select,textarea')].map(x=>[x.id,x.value,x.checked]);
 w.eval(fs.readFileSync(root+'/assets/enzyme-cute.js','utf8'));w.eval(fs.readFileSync(root+'/assets/enzyme-cute.js','utf8'));
 assert.equal(JSON.stringify(w.history.state),state);assert.equal(w.history.length,len);assert.equal(JSON.stringify({...w.localStorage}),local);assert.equal(JSON.stringify({...w.sessionStorage}),session);
 assert.deepEqual([...d.querySelectorAll('input,select,textarea')].map(x=>[x.id,x.value,x.checked]),controls);
 assert.equal(d.querySelectorAll('.cute-concepts').length,1);const ids=[...d.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,'duplicate ids');
 for(const im of d.querySelectorAll('.cute-guide img,.cute-concepts img')){assert(im.alt);const u=new URL(im.src);assert.equal(u.origin,'https://www.bhcs.com.tw');assert(fs.existsSync(root+u.pathname))}
 assert(d.querySelector('.cute-caption').textContent.includes('因酵素而異'));assert.equal(d.querySelector('meta[name="color-scheme"]').content,'only light');
 assert.equal(d.querySelector('#lab-explore').parentElement.tagName,'LABEL');assert.equal(w.getComputedStyle(d.querySelector('#lab-explore').parentElement).display,'flex');
 const zoom=d.querySelector('.enzyme-diagram-zoom'),stage=d.querySelector('#diagram');
 assert.equal(d.querySelectorAll('.researcher-zoom,.enzyme-diagram-zoom').length,1,'one zoom after repeated script evaluation');
 assert.equal(zoom.getAttribute('aria-controls'),'diagram');
 const initialZoomLabel=zoom.textContent;assert.equal(initialZoomLabel,enhanced?'🔍 放大圖解':'放大圖解（可左右滑動）');
 assert.equal(w.getComputedStyle(d.querySelector('#lab-explore').parentElement).whiteSpace,'normal');
 assert.equal(w.getComputedStyle(d.querySelector('#lab-explore')).minHeight,'0');
 const beforeZoom=[...d.querySelectorAll('input,select,textarea')].map(x=>[x.id,x.value,x.checked]);
 for(let i=0;i<3;i++){
  zoom.click();assert(stage.classList.contains('is-zoomed'));assert.equal(zoom.getAttribute('aria-pressed'),'true');
  zoom.click();assert(!stage.classList.contains('is-zoomed'));assert.equal(zoom.getAttribute('aria-pressed'),'false');assert.equal(zoom.textContent,initialZoomLabel,'zoom label returns consistently to its owner-provided initial text');
 }
 assert.deepEqual([...d.querySelectorAll('input,select,textarea')].map(x=>[x.id,x.value,x.checked]),beforeZoom);
 assert(d.querySelector('script[src*="science-events.js"]'),'retain official analytics adapter');
 assert(!d.querySelector('.sandbox-banner'),'do not publish private sandbox chrome');
 const css=fs.readFileSync(root+'/assets/enzyme-cute.css','utf8');
 assert.match(css,/@media\(max-width:700px\)/);assert.match(css,/width:660px;min-width:660px;max-width:none/);
 assert.match(css,/@media print/);assert.match(css,/\.cute-guide,\.cute-concepts,\.cute-scene,\.cute-icon\{display:none!important/);
 assert.match(css,/color-scheme:only light/);assert(!css.includes('cute-landing'));
 for(const file of fs.readdirSync(root+'/tools/science').filter(f=>f.endsWith('.html')&&f!=='enzyme.html'))assert(!fs.readFileSync(root+'/tools/science/'+file,'utf8').includes('enzyme-cute.'),'presentation must remain enzyme-only: '+file);
 const set=(id,value)=>{d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('input',{bubbles:true}))};
 set('ctl-temp',70);d.querySelector('#run').click();set('ctl-temp',37);d.querySelector('#run').click();assert(d.querySelector('#readouts').textContent.includes('相對活性0%'));
 d.querySelector('#reset').click();d.querySelector('#run').click();assert(d.querySelector('#readouts').textContent.includes('相對活性100%'));
 assert.equal(d.querySelectorAll('#diagram rect[fill="#b54a5b"][opacity="0.08"]').length,0,'remove unexplained temperature band');
 const spec=fs.readFileSync(root+'/docs/science-enzyme-spec.md','utf8');assert(spec.includes('test_enzyme_sample_history.cjs'));assert(spec.includes('test_enzyme_presentation.cjs'));
 for(const f of fs.readdirSync(root+'/docs').filter(f=>/^science-.*-spec\.md$/.test(f)&&f!=='science-enzyme-spec.md'))assert(!fs.readFileSync(root+'/docs/'+f,'utf8').includes('test_enzyme_sample_history.cjs'),'enzyme tests apply only to enzyme spec');
 assert.deepEqual(errors,[]);console.log('PASS '+(enhanced?'enhanced':'fallback')+': illustrated lesson/teacher placement, 3 concepts, local assets, unique IDs, idempotence, no history/storage/control mutation, retained irreversible sample model, wrapping mobile control and single idempotent zoom');w.close();
}
(async()=>{await check(true);await check(false)})().catch(e=>{console.error(e);process.exitCode=1});
