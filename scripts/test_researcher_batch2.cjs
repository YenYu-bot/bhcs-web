const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const ids=['optics','wave-sound','energy','pressure-fluid','solubility'];
for(const id of ids){
 const file=path.join(root,'tools/science',id+'.html'),html=fs.readFileSync(file,'utf8');
 const dom=new JSDOM(html),d=dom.window.document,conf=JSON.parse(d.getElementById('lab-config').textContent);
 assert.equal(conf.noPrediction,true,id+' must enable prediction-free mode');
 assert.equal(d.getElementById('prediction'),null,id+' must not render prediction control');
 assert.ok(d.querySelector('link[href="../../assets/researcher-lab.css"]'),id+' researcher css');
 assert.ok(d.querySelector('script[src="../../assets/researcher-lab.js"]'),id+' researcher js');
 const clone=d.body.cloneNode(true);clone.querySelectorAll('script,style').forEach(n=>n.remove());
 assert.ok(!clone.textContent.includes('預測'),id+' visible UI still contains prediction wording');
 assert.match(clone.textContent,/研究工具箱/,id+' researcher toolbox');
 assert.match(clone.textContent,/開始觀察/,id+' direct observe action');
 dom.window.close();
}
const runtime=fs.readFileSync(path.join(root,'scripts/science/runtime.js'),'utf8');
const diagrams=fs.readFileSync(path.join(root,'scripts/science/diagrams.mjs'),'utf8');
assert.ok(runtime.includes("settings:{...current.s}"),'structured record settings missing');
assert.ok(runtime.includes("draftKey=storageKey+'-draft'"),'explanation draft persistence missing');
assert.ok(runtime.includes("data-lab-drag"),'drag exploration runtime missing');
assert.ok(diagrams.includes('data-lab-drag="u"'),'optics drag handle missing');
assert.ok(diagrams.includes('data-lab-drag="progress"'),'energy drag handle missing');
assert.ok(diagrams.includes('前側導線電流方向'),'electromagnetism direction cue missing');
assert.ok(diagrams.includes('各處地軸保持平行'),'seasons parallel-axis diagram missing');
const guide=fs.readFileSync(path.join(root,'assets/researcher-lab.js'),'utf8');
{
 const html=fs.readFileSync(path.join(root,'tools/science/optics.html'),'utf8');
 const dom=new JSDOM(html,{url:'https://www.bhcs.com.tw/tools/science/optics.html?noga=1',runScripts:'outside-only'});
 const originalTitle=dom.window.document.title;dom.window.scrollTo=()=>{};dom.window.matchMedia=()=>({matches:true});dom.window.requestAnimationFrame=callback=>(callback(),1);dom.window.eval(guide);
 const tasks=[...dom.window.document.querySelectorAll('.researcher-promise span')];
 assert.equal(tasks.length,3,'welcome task list must render three spans');
 assert.deepEqual(tasks.map(x=>x.textContent.trim().charAt(0)),['①','②','③']);
 assert.ok(tasks.every(x=>!x.textContent.includes('<')),'welcome task text must not contain a broken tag');
 assert.equal(dom.window.document.title,originalTitle,'researcher shell must preserve the lesson title');
 assert.equal(dom.window.document.querySelectorAll('h1').length,1,'lesson must keep a single h1');
 const historyLength=dom.window.history.length;dom.window.document.querySelector('[data-start]').click();assert.equal(dom.window.history.length,historyLength+1,'entering the bench must add a history entry');assert.equal(dom.window.document.querySelector('.researcher-screen.is-active').dataset.screen,'bench');assert.ok(dom.window.document.activeElement.closest('[data-screen="bench"]'),'focus must move into the new screen');
 dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate',{state:{bhcsResearcher:true,screen:'prepare'}}));assert.equal(dom.window.document.querySelector('.researcher-screen.is-active').dataset.screen,'prepare','popstate must restore the previous screen');
 assert.ok(dom.window.document.querySelector('[data-return-second]'),'notebook return control missing');
 dom.window.close();
}
const mini=fs.readFileSync(path.join(root,'tools/mini-lab/index.html'),'utf8');
const micro=fs.readFileSync(path.join(root,'tools/microscope-lab.html'),'utf8');
for(const [name,text] of [['researcher shell',guide],['mini lab',mini],['microscope',micro]]){
 assert.ok(!text.includes('奇奇博士'),name+' still uses old guide name');
 assert.ok(text.includes('余老師'),name+' missing new guide name');
}
assert.ok(guide.includes('scienceStation()'),'generic science researcher station missing');
assert.ok(fs.readFileSync(path.join(root,'assets/researcher-lab.css'),'utf8').includes('Shared station layout for prediction-free batch-two labs'));
const css=fs.readFileSync(path.join(root,'assets/researcher-lab.css'),'utf8');
assert.match(css,/\[data-lab-drag\]\{touch-action:none/,'drag handles must reserve touch gestures');
assert.match(guide,/history\.pushState\(stateFor\(id\)/,'screen changes must enter browser history');
assert.ok(guide.includes('data-return-second'),'notebook must offer a route back for the second record');
assert.ok(!guide.includes('document.title='),'researcher shell must preserve each lesson title');
for(const id of ['optics','energy']){const html=fs.readFileSync(path.join(root,'tools/science',id+'.html'),'utf8');assert.match(html,/data-lab-drag="[^"]+"[^>]+r="25"/s,id+' drag target must be at least 48 px wide')}
console.log('PASS researcher batch 2: five prediction-free stations, unified 余老師 naming and mini-lab shell');
