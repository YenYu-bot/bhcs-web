const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const ids=['electromagnetism','moon-eclipse','seasons','plant-exchange','ecosystem'];
for(const id of ids){
 const file=path.join(root,'tools/science',id+'.html'),html=fs.readFileSync(file,'utf8');
 const dom=new JSDOM(html),d=dom.window.document,conf=JSON.parse(d.getElementById('lab-config').textContent);
 assert.equal(conf.noPrediction,true,id+' must enable prediction-free mode');
 assert.equal(d.getElementById('prediction'),null,id+' must not render prediction control');
 assert.ok(d.querySelector('link[href^="../../assets/researcher-lab.css?v="]'),id+' versioned researcher css');
 assert.ok(d.querySelector('script[src="../../assets/researcher-lab.js"]'),id+' researcher js');
 const clone=d.body.cloneNode(true);clone.querySelectorAll('script,style').forEach(n=>n.remove());
 assert.ok(!clone.textContent.includes('預測'),id+' visible UI still contains prediction wording');
 assert.match(clone.textContent,/研究工具箱/,id+' researcher toolbox');
 assert.match(clone.textContent,/開始觀察/,id+' direct observe action');
 dom.window.close();
}
const runtime=fs.readFileSync(path.join(root,'scripts/science/runtime.js'),'utf8');
assert.ok(runtime.includes("if($('prediction'))$('prediction').value=''"),'moon preview prediction guard missing');
assert.ok(runtime.includes("noPrediction?'自由觀察：拖曳滑桿即時預覽（先完成一次正式觀察）'"),'moon prediction-free free-explore label missing');
assert.ok(runtime.includes("noPrediction?'自由觀察中：拖動滑桿"),'moon prediction-free free-explore status missing');
console.log('PASS researcher batch 3: electromagnetism, moon/eclipses, seasons, plant exchange and ecosystem');
