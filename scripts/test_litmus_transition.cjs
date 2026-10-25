const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const file=process.env.LITMUS_PAGE||path.join(root,'tools/acid-base-indicator-lab.html');
const html=fs.readFileSync(file,'utf8');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}
function load(enhanced=false,saved=[]){
 const images=[],errors=[],calls=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{url:'https://example.test/tools/acid-base-indicator-lab.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);
 const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];return (...args)=>{calls.push({method:k,args,fill:t.fillStyle});if(k==='measureText')return{width:String(args[0]).length*10}}},set(t,k,v){t[k]=v;return true}});
 w.HTMLCanvasElement.prototype.getContext=()=>ctx;w.matchMedia=()=>({matches:true,addEventListener(){}});w.Image=class{constructor(){images.push(this)}set src(v){}};w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.print=()=>{};w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.localStorage.setItem('bhcsAcidBaseRecords',JSON.stringify(saved));
 const script=[...d.scripts].find(s=>s.textContent.includes('function indicatorColor')).textContent;
 w.eval(script.replace(/\}\)\(\);\s*$/,'window.__LITMUS_TEST__={indicatorColor,experiment,indicatorName,renderTray,finish,drawLab,runTests};})();'));
 if(enhanced){w.eval(fs.readFileSync(path.join(root,'assets/researcher-lab.js'),'utf8'));d.dispatchEvent(new w.Event('DOMContentLoaded'));}
 return{w,d,$,calls,loadArt(){images.forEach(img=>img.onload?.())},a:w.__LITMUS_TEST__,select(id,value){const el=$(id);if(el.tagName==='SELECT'&&![...el.options].some(x=>x.value===String(value))){const o=d.createElement('option');o.value=String(value);o.textContent=String(value);el.append(o)}el.value=String(value);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}))},run(){ $('mix').click();w.__LITMUS_TEST__.finish();},close(){assert.deepEqual(errors,[]);w.close()}};
}
test('literal boundary contract: approximate transition inclusive, not pH7 colour switch',()=>{
 const x=load();assert.notEqual(x.a.indicatorColor('redLitmus',7.1).name,'變藍色','pH 7.1 must not immediately turn red litmus blue');for(const ph of [4.4,4.5,6.9,7,7.1,8.2,8.3,8.4])for(const type of ['redLitmus','blueLitmus']){const c=x.a.indicatorColor(type,ph);assert.equal(c.paper,true);assert.equal(c.transition,ph>=4.5&&ph<=8.3);if(ph<4.5)assert.equal(c.hex,'#d94949');else if(ph>8.3)assert.equal(c.hex,'#365fbd');else if(ph!==7){assert.equal(c.uncertain,true);assert.match(c.name,/過渡範圍/);assert.doesNotMatch(c.name,/變藍色|變紅色|維持/);assert.match(c.note,/不推定實際紙色/);}}
 assert.notEqual(x.a.indicatorColor('redLitmus',7.1).name,'變藍色');x.close();
});
test('neutral paper identity is retained, never both purple or proof of exact pH',()=>{
 const x=load();for(const [type,hex] of [['redLitmus','#d94949'],['blueLitmus','#365fbd']]){const c=x.a.indicatorColor(type,7);assert.equal(c.hex,hex);assert.equal(c.uncertain,false);assert.match(c.name,/中性示意/);assert.match(c.note,/不能只憑紙色推定恰好 pH 7/);}x.close();
});
test('comparison tray displays uncertainty, separate paper shape and accessible explanatory legend',()=>{
 const x=load();assert.match(x.$('litmus-note').textContent,/約 pH 4.5–8.3/);assert.match(x.$('litmus-note').textContent,/不是實際紙色或圖案/);assert.match(x.$('litmus-note').textContent,/pH 與酸鹼性仍由本模型計算/);
 for(const ph of [4.4,4.5,6.9,7,7.1,8.2,8.3,8.4]){x.select('trayPh',ph);for(const type of ['redLitmus','blueLitmus']){const c=x.a.indicatorColor(type,ph),card=x.d.querySelector(`[data-indicator="${type}"]`);assert.ok(card.querySelector('.litmus-strip'));assert.ok(card.textContent.includes(c.name));assert.ok(card.textContent.includes(c.note));assert.equal(card.querySelector('.litmus-strip').style.background.includes('repeating-linear-gradient'),c.uncertain);}}
 assert.equal(x.$('indicator').getAttribute('aria-describedby'),'litmus-note');x.close();
});
function setMixturePh(x,ph){
 // Test-only concentration options exercise output wiring at exact boundary inputs;
 // they do not imply the ordinary concentration menu offers these dilute samples.
 x.select('acidVolume',ph<7?50:ph===7?50:0);x.select('baseVolume',ph>7?50:ph===7?50:0);x.select('waterVolume',0);
 x.select('acidConcentration',ph<7?10**(-ph):.1);x.select('baseConcentration',ph>7?10**(ph-14):.1);
}
test('same helper drives mix readout, canvas and new printable records at boundary conditions',()=>{
 const x=load();for(const ph of [4.4,4.5,6.9,7,7.1,8.2,8.3,8.4])for(const type of ['redLitmus','blueLitmus']){setMixturePh(x,ph);x.select('indicator',type);x.calls.length=0;x.run();const r=x.a.experiment(),c=x.a.indicatorColor(type,r.ph);assert.ok(Math.abs(r.ph-ph)<1e-10);assert.ok(x.$('colorValue').textContent.includes(c.name));assert.ok(x.$('colorValue').textContent.includes(c.note));assert.ok(x.$('mixCanvas').getAttribute('aria-label').includes(c.name));assert.ok(x.calls.some(k=>k.method==='fillText'&&String(k.args[0]).includes(c.name)));assert.ok(x.calls.some(k=>k.method==='fillRect'&&k.args[0]===434&&k.args[1]===267&&k.fill===c.hex));assert.ok(x.calls.some(k=>k.method==='fill'&&k.fill==='#dfe8ed'),'paper must not dye liquid');const strip=x.calls.find(k=>k.method==='fillRect'&&k.args[0]===434);assert.ok(strip.args[0]>=348&&strip.args[0]+strip.args[2]<=452&&strip.args[1]+strip.args[3]<=384,'strip must enter the fallback liquid interior');const [sx,sy,sw,sh]=strip.args;for(const y of [sy,sy+sh]){const left=315+30*(y-150)/240,right=485-30*(y-150)/240;assert.ok(sx>=left&&sx+sw<=right,'both strip corners must stay within sloping cup walls');}assert.ok(sx>=0&&sy>=0&&sx+sw<=800&&sy+sh<=470,'strip must fit canvas');x.$('addRecord').click();const last=[...x.$('records').rows].at(-1).textContent;assert.ok(last.includes(c.name));assert.ok(last.includes(c.note));}
 x.close();
});
test('loaded illustration path keeps paper separate from neutral liquid',()=>{
 const x=load();x.loadArt();x.select('indicator','redLitmus');x.calls.length=0;x.run();assert.ok(x.calls.some(k=>k.method==='drawImage'));assert.ok(x.calls.some(k=>k.method==='fillRect'&&k.fill==='#dfe8ed'));const strip=x.calls.find(k=>k.method==='fillRect'&&k.args[0]===434);assert.ok(strip);assert.ok(strip.args[0]>=348&&strip.args[0]+strip.args[2]<=452);x.close();
});
test('phenolphthalein original thresholds unchanged across 141 points and exact endpoints',()=>{
 const x=load();for(const ph of [...Array.from({length:141},(_,i)=>i/10),8.2,10]){const c=x.a.indicatorColor('phenolphthalein',ph),expected=ph<8.2?['無色','#f8fbfd']:ph<=10?['淺粉紅色','#f6b6cf']:['桃紅色','#e54c91'];assert.equal(c.name,expected[0]);assert.equal(c.hex,expected[1]);assert.equal(c.paper,undefined);}x.select('indicator','phenolphthalein');x.select('baseVolume',60);x.run();assert.match(x.$('colorValue').textContent,/桃紅色/);assert.ok(!x.calls.some(k=>k.method==='fillRect'&&k.args[0]===434));x.close();
});
test('strong acid/base experiment and pH classification are unchanged',()=>{
 const x=load();assert.equal(x.a.runTests(),true);for(const [args,ph,kind] of [[[.1,50,.1,0,0],1,'acidic'],[[.1,50,.1,50,0],7,'neutral'],[[.1,0,.1,50,0],13,'basic'],[[.1,0,.1,0,100],7,'neutral']]){const r=x.a.experiment(...args);assert.equal(r.ph,ph);assert.equal(r.kind,kind);}x.close();
});
test('existing saved records retain historical wording rather than silent migration',()=>{
 const row={acid:'old acid',base:'old base',water:'0',nH:'0',nOH:'0',excess:'old',total:'100',ph:'7.1',kind:'鹼性',indicator:'紅色石蕊：變藍色'};const x=load(false,[row]);assert.match(x.$('records').textContent,/紅色石蕊：變藍色/);assert.deepEqual(JSON.parse(x.w.localStorage.getItem('bhcsAcidBaseRecords')),[row]);x.close();
});
test('enhanced researcher shell preserves tray, visible legend and litmus readout semantics',()=>{
 const x=load(true);assert.ok(x.d.body.classList.contains('legacy-researcher'));assert.ok(x.$('litmus-note'));x.select('trayPh',7.1);assert.match(x.d.querySelector('[data-indicator="redLitmus"]').textContent,/過渡範圍/);x.select('indicator','redLitmus');x.select('baseVolume',50);x.run();assert.match(x.$('colorValue').textContent,/中性示意/);x.close();
});
test('paper/liquid distinction, primary sources and test chain are retained',()=>{
 const x=load();assert.match(x.$('teacherBox').textContent,/石蕊試紙不是石蕊溶液/);assert.match(x.$('teacherBox').textContent,/不是所有產品共用的精確界線/);assert.ok(x.d.querySelector('a[href="https://www.merckmillipore.com/PG/en/product/mm/109489"]'));assert.ok(x.d.querySelector('a[href="https://www.merckmillipore.com/KR/en/product/mm/109486"]'));assert.match(fs.readFileSync(path.join(root,'scripts/package.json'),'utf8'),/test_litmus_transition\.cjs/);x.close();
});
console.log(`${passed} litmus transition checks passed`);
