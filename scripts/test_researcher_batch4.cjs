const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const pages=[
 ['genetics-simulation-lab.html','cross','punnettBody'],
 ['force-motion-lab.html','step','timeValue'],
 ['circuit-lab.html','verify','iValue'],
 ['particle-reaction-lab.html','react','limitValue'],
 ['heat-phase-lab.html','begin','tempValue']
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
 assert.ok(sd.querySelector('link[href="../assets/researcher-lab.css"]'),file+' researcher css missing');
 assert.ok(sd.querySelector('script[src="../assets/researcher-lab.js"]'),file+' researcher js missing');
 const visible=sd.body.cloneNode(true);visible.querySelectorAll('script,style').forEach(n=>n.remove());
 assert.ok(!visible.textContent.includes('預測'),file+' visible UI still contains prediction wording');
 staticDom.window.close();
 const {dom,d,errors}=open(file);
 assert.equal(d.getElementById('prediction'),null,file+' runtime prediction element unexpectedly exists');
 const button=d.getElementById(action);assert.ok(button,file+' action button missing');button.click();
 if(file==='genetics-simulation-lab.html')assert.ok(d.querySelectorAll('.punnettChoice').length===4,'genetics must reveal Punnett cells directly');
 else if(file==='force-motion-lab.html')assert.equal(d.getElementById(resultId).textContent,'0.5 s','force step should work directly');
 else assert.ok(d.getElementById(resultId).textContent&&!/^—/.test(d.getElementById(resultId).textContent),file+' direct action did not reveal result');
 assert.deepEqual(errors,[],file+' JS errors');
 dom.window.close();
}
const shell=fs.readFileSync(path.join(root,'assets/researcher-lab.js'),'utf8');
for(const key of ['genetics-simulation-lab.html','force-motion-lab.html','circuit-lab.html','particle-reaction-lab.html','heat-phase-lab.html'])assert.ok(shell.includes(key),'researcher shell missing '+key);
assert.ok(shell.includes('余老師'),'researcher shell missing 余老師');
console.log('PASS researcher batch 4: five legacy stations are prediction-free and directly operable');
