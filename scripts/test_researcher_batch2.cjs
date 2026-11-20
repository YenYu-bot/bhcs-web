const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const guide=fs.readFileSync(path.join(root,'assets/researcher-lab.js'),'utf8');
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
assert.ok(!guide.includes("if(recordCount())show('notebook')"),'saving a record must keep the learner on the experiment screen');
assert.ok(!guide.includes('document.title='),'researcher shell must preserve each lesson title');
console.log('PASS researcher batch 2: unified 余老師 naming, mini-lab shell and researcher history');
