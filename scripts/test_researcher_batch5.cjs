const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const pages=[
 ['plate-earthquake-lab.html','begin','motionValue'],
 ['buoyancy-density-lab.html','drop','canvasCover'],
 ['acid-base-indicator-lab.html','mix','canvasCover'],
 ['photosynthesis-factor-lab.html','start','canvasCover']
];
function open(file){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'tools',file),'utf8'),{url:'https://www.bhcs.com.tw/tools/'+file+'?noga=1',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:s=>({width:String(s).length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.matchMedia=()=>({matches:true});w.confirm=()=>true;w.print=()=>{};
 }});
 return {dom,d:dom.window.document,errors};
}
for(const [file,action,resultId] of pages){
 const html=fs.readFileSync(path.join(root,'tools',file),'utf8'),staticDom=new JSDOM(html),sd=staticDom.window.document;
 assert.equal(sd.getElementById('prediction'),null,file+' prediction control must be removed');
 assert.ok(sd.querySelector('link[href^="../assets/researcher-lab.css?v="]'),file+' versioned researcher css missing');
 assert.ok(sd.querySelector('script[src^="../assets/researcher-lab.js?v="]'),file+' researcher js missing');
 const visible=sd.body.cloneNode(true);visible.querySelectorAll('script,style').forEach(n=>n.remove());
 assert.ok(!visible.textContent.includes('預測'),file+' visible UI still contains prediction wording');
 staticDom.window.close();
 const {dom,d,errors}=open(file);assert.equal(d.getElementById('prediction'),null,file+' runtime prediction element unexpectedly exists');
 const button=d.getElementById(action);assert.ok(button,file+' action button missing');button.click();
 if(file==='plate-earthquake-lab.html')assert.ok(d.getElementById(resultId).textContent&&!/^—/.test(d.getElementById(resultId).textContent),'plate direct action did not reveal results');
 else {assert.equal(d.getElementById(resultId).hidden,true,file+' direct action did not enter experiment state');assert.equal(d.getElementById('replay').disabled,false,file+' replay should enable after direct action')}
 assert.deepEqual(errors,[],file+' JS errors');dom.window.close();
}
const shell=fs.readFileSync(path.join(root,'assets/researcher-lab.js'),'utf8');
for(const key of ['plate-earthquake-lab.html','buoyancy-density-lab.html','acid-base-indicator-lab.html','photosynthesis-factor-lab.html'])assert.ok(shell.includes(key),'researcher shell missing '+key);
assert.ok(shell.includes('余老師'),'researcher shell missing 余老師');
const shellCss=fs.readFileSync(path.join(root,'assets/researcher-lab.css'),'utf8');
// Actual bounds, mouth alignment and tail size are checked in Chromium.
for(const scene of ['physics','chemistry','earth'])assert.doesNotMatch(shellCss,new RegExp('\\.room\\[src\\*="scene-'+scene+'"\\][^{]*\\{[^}]*scaleX\\(-1\\)'),scene+' scene must retain its scientifically meaningful orientation');
console.log('PASS researcher batch 5: final four legacy stations are prediction-free and directly operable');


const legacyAll=['circuit-lab.html','force-motion-lab.html','particle-reaction-lab.html','microscope-lab.html','plate-earthquake-lab.html','heat-phase-lab.html','buoyancy-density-lab.html','acid-base-indicator-lab.html','photosynthesis-factor-lab.html','genetics-simulation-lab.html'];
const sharedAll=['optics','wave-sound','electromagnetism','pressure-fluid','solubility','energy','moon-eclipse','seasons','plant-exchange','ecosystem'];
for(const file of legacyAll){
 const html=fs.readFileSync(path.join(root,'tools',file),'utf8'),d=new JSDOM(html).window.document;
 assert.equal(d.getElementById('prediction'),null,file+' final audit: prediction control exists');
 assert.ok(d.querySelector('link[href^="../assets/researcher-lab.css?v="]'),file+' final audit: versioned researcher css missing');
 assert.ok(d.querySelector('script[src^="../assets/researcher-lab.js?v="]'),file+' final audit: researcher js missing');
 const visible=d.body.cloneNode(true);visible.querySelectorAll('script,style').forEach(n=>n.remove());
 assert.ok(!visible.textContent.includes('預測'),file+' final audit: visible prediction wording remains');
}
for(const id of sharedAll){
 const file='tools/science/'+id+'.html',html=fs.readFileSync(path.join(root,file),'utf8'),d=new JSDOM(html).window.document,conf=JSON.parse(d.getElementById('lab-config').textContent);
 assert.equal(conf.noPrediction,true,id+' final audit: noPrediction flag missing');
 assert.equal(d.getElementById('prediction'),null,id+' final audit: prediction control exists');
 assert.ok(d.querySelector('link[href^="../../assets/researcher-lab.css?v="]'),id+' final audit: versioned researcher css missing');
 assert.ok(d.querySelector('script[src^="../../assets/researcher-lab.js?v="]'),id+' final audit: researcher js missing');
 const visible=d.body.cloneNode(true);visible.querySelectorAll('script,style').forEach(n=>n.remove());
 assert.ok(!visible.textContent.includes('預測'),id+' final audit: visible prediction wording remains');
 assert.ok(!html.includes('預測'),id+' final audit: inactive prediction program strings remain');
}
const directory=fs.readFileSync(path.join(root,'tools/science/index.html'),'utf8'),dirDom=new JSDOM(directory).window.document;
assert.ok(dirDom.querySelector('link[href^="../../assets/researcher-lab.css?v="]'),'directory final audit: versioned researcher css missing');
assert.ok(dirDom.querySelector('script[src^="../../assets/researcher-lab.js?v="]'),'directory final audit: researcher js missing');
const dirVisible=dirDom.body.cloneNode(true);dirVisible.querySelectorAll('script,style').forEach(n=>n.remove());
assert.ok(!dirVisible.textContent.includes('預測'),'directory final audit: visible prediction wording remains');
const mini=fs.readFileSync(path.join(root,'tools/mini-lab/index.html'),'utf8');
assert.ok(mini.includes('余老師'),'mini-lab final audit: 余老師 missing');
assert.ok(!mini.includes('奇奇博士'),'mini-lab final audit: old guide name remains');
for(const file of legacyAll.filter(file=>file!=='microscope-lab.html')){const html=fs.readFileSync(path.join(root,'tools',file),'utf8');assert.match(html,/function loadRecords\(\)\{try\{const saved=JSON\.parse[\s\S]*?Array\.isArray\(saved\)\?saved:\[\]/,file+' loadRecords must reject non-array storage')}
const resourceHtml=fs.readFileSync(path.join(root,'ziyuan.html'),'utf8'),resourceDom=new JSDOM(resourceHtml,{runScripts:'dangerously'}),resourceDoc=resourceDom.window.document,resourceInput=resourceDoc.getElementById('resource-search');
assert.ok(resourceInput,'resource search missing');const resourceLinks=resourceDoc.querySelectorAll('.res-sec .tpills>a,.science-category li>a'),declaredResourceTotal=Number(resourceDoc.querySelector('section.resource-finder p.lead')?.textContent.match(/目前共\s*(\d+)\s*項/)?.[1]);assert.ok(Number.isSafeInteger(declaredResourceTotal),'resource total declaration missing');assert.equal(resourceLinks.length,declaredResourceTotal,'resource total changed');assert.equal(resourceDoc.querySelectorAll('#res-hs-math .trow').length,4,'high-school four-book grouping changed');
resourceInput.value='分數';resourceInput.dispatchEvent(new resourceDom.window.Event('input',{bubbles:true}));assert.ok(![...resourceDoc.querySelectorAll('.res-sec .tpills>a,.science-category li>a')].find(a=>a.textContent.includes('分數練習單')).classList.contains('resource-hidden'),'fraction search failed');
resourceInput.value='透鏡';resourceInput.dispatchEvent(new resourceDom.window.Event('input',{bubbles:true}));assert.ok([...resourceDoc.querySelectorAll('.science-category li>a')].some(a=>a.textContent.includes('透鏡')&&!a.closest('li').classList.contains('resource-hidden')),'lens search failed');resourceDom.window.close();
console.log('PASS full researcher audit: 20 stations + directory + 余老師 naming');
