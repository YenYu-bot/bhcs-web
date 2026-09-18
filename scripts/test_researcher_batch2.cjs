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
const guide=fs.readFileSync(path.join(root,'assets/researcher-lab.js'),'utf8');
const mini=fs.readFileSync(path.join(root,'tools/mini-lab/index.html'),'utf8');
const micro=fs.readFileSync(path.join(root,'tools/microscope-lab.html'),'utf8');
for(const [name,text] of [['researcher shell',guide],['mini lab',mini],['microscope',micro]]){
 assert.ok(!text.includes('奇奇博士'),name+' still uses old guide name');
 assert.ok(text.includes('余老師'),name+' missing new guide name');
}
assert.ok(guide.includes('scienceStation()'),'generic science researcher station missing');
assert.ok(fs.readFileSync(path.join(root,'assets/researcher-lab.css'),'utf8').includes('Shared station layout for prediction-free batch-two labs'));
console.log('PASS researcher batch 2: five prediction-free stations, unified 余老師 naming and mini-lab shell');
