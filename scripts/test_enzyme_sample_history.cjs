const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/science-lab.js'),'utf8');
const html=fs.readFileSync(path.join(root,'tools/science/enzyme.html'),'utf8').replace(/<script[^>]*src=[^>]*><\/script>/g,'');
let passed=0;
function load(saved={},blocked=false){
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{url:'https://example.test/tools/science/enzyme.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);
 for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('storage denied')}});
 w.print=()=>{};w.confirm=()=>true;w.eval(source);
 return {w,d,$,errors,close(){assert.deepEqual(errors,[]);w.close()},set(k,v){$('ctl-'+k).value=v;$('ctl-'+k).dispatchEvent(new w.Event('input',{bubbles:true}))},run(){ $('run').click();return $('readouts').textContent},record(){ $('explanation-input').value='比較樣本活性數據';$('add-record').click()},rows(){return JSON.parse(w.localStorage.getItem('bhcs-science-v2-enzyme'))}};
}
function test(name,fn){fn();passed++;console.log('PASS '+name)}
test('same sample 80 -> 37 stays denatured; changing pH or concentration cannot repair it',()=>{
 const x=load();x.set('temp',80);assert.match(x.run(),/相對活性0%/);x.record();
 x.set('temp',37);assert.match(x.run(),/相對活性0%/);assert.match(x.$('result-explanation').textContent,/曾達 60°C/);x.record();
 const rows=x.rows();assert.equal(rows[0].settings.sampleId,rows[1].settings.sampleId);assert.equal(rows[1].settings.heatDenatured,true);assert.match(rows[1].conditions,/曾達 60°C/);assert.match(x.$('record-comparison').textContent,/同一份樣本/);
 x.set('ph',2);x.set('conc',5);assert.match(x.run(),/相對活性0%/);x.close();
});
test('explicit new sample recovers at defaults without deleting evidence; comparison distinguishes sample identity',()=>{
 const x=load();x.set('temp',80);x.run();x.record();x.$('reset').click();assert.match(x.$('reset').textContent,/換新樣本/);assert.match(x.run(),/相對活性100%/);x.record();
 assert.equal(x.rows().length,2);assert.notEqual(x.rows()[0].settings.sampleId,x.rows()[1].settings.sampleId);assert.match(x.$('record-comparison').textContent,/不同樣本/);x.close();
});
test('low temperature is reversible on same sample; exact heat boundary is 60',()=>{
 const x=load();x.set('temp',0);assert.match(x.run(),/相對活性5%/);x.record();x.set('temp',37);assert.match(x.run(),/相對活性100%/);x.record();assert.equal(x.rows()[0].settings.sampleId,x.rows()[1].settings.sampleId);
 x.set('temp',59);assert.match(x.run(),/沒有變性/);x.set('temp',60);assert.match(x.run(),/已變性/);x.set('temp',59);assert.match(x.run(),/相對活性0%/);x.close();
});
test('pH bounds preserve declared reversible teaching approximation and enzyme switch explicitly means fresh sample',()=>{
 const x=load();for(const ph of [1,13]){x.set('ph',ph);assert.match(x.run(),/沒有變性/);x.set('ph',7);assert.match(x.run(),/相對活性100%/)}
 x.set('temp',80);x.run();x.set('temp',37);x.set('enzyme','pepsin');assert.match(x.run(),/沒有變性/);x.set('ph',2);assert.match(x.run(),/相對活性100%/);assert.match(x.d.querySelector('label[for="ctl-enzyme"]').textContent,/新樣本/);x.close();
});
test('pre-run preview and free-observation paths both retain irreversible history',()=>{
 const x=load();x.set('temp',80);x.set('temp',37);assert.match(x.run(),/相對活性0%/);
 x.$('reset').click();x.run();x.$('lab-explore').checked=true;x.$('lab-explore').dispatchEvent(new x.w.Event('change'));x.set('temp',80);x.set('temp',37);assert.match(x.$('readouts').textContent,/相對活性0%/);assert.equal(x.$('add-record').disabled,true);
 x.$('lab-explore').checked=false;x.$('lab-explore').dispatchEvent(new x.w.Event('change'));assert.match(x.run(),/相對活性0%/);x.close();
});
test('task buttons explicitly request fresh samples; repeats preserve notebook',()=>{
 const x=load();x.set('temp',80);x.run();x.record();const b=x.d.querySelector('[data-mission="0"]');assert.match(b.textContent,/新樣本/);b.click();assert.match(x.run(),/相對活性100%/);assert.equal(x.rows().length,1);x.close();
});
test('reload restores evidence, not live sample; legacy rows retained honestly',()=>{
 const x=load();x.set('temp',80);x.run();x.record();const rows=x.rows();x.close();
 const y=load({'bhcs-science-v2-enzyme':JSON.stringify(rows),'bhcs-science-v2-enzyme-guide':'done'});assert.ok(y.d.querySelector('.guide-box.guide-done'),'returning user starts with completed guide');assert.equal(y.d.querySelector('.guide-box.guide-done .guide-replay').textContent,'重看引導（換新樣本）');assert.match(y.$('enzyme-sample-help').textContent,/重新載入頁面會換新樣本/);assert.match(y.run(),/相對活性100%/);y.record();assert.match(y.$('record-comparison').textContent,/不同樣本/);assert.equal(y.rows()[0].settings.heatDenatured,true);y.close();
 const z=load({'bhcs-science-v2-enzyme':JSON.stringify([{conditions:'溫度37',result:'100%',prediction:'',explanation:'舊記錄'}])});z.run();z.record();assert.match(z.$('record-comparison').textContent,/舊紀錄沒有樣本歷程/);z.close();
});
test('denied storage does not lose in-session sample history or printable record',()=>{
 const x=load({},true);x.set('temp',80);x.run();x.set('temp',37);assert.match(x.run(),/相對活性0%/);x.record();assert.match(x.$('storage-status').textContent,/不允許保存/);assert.match(x.$('print-records').textContent,/曾達 60°C/);x.close();
});
test('guide includes and completes same-sample cooling before changing enzyme; replay starts fresh',()=>{
 const x=load();const clickText=text=>{const b=[...x.d.querySelectorAll('.guide-box button')].find(b=>b.textContent===text);assert.ok(b,text);b.click()};
 x.run();clickText('活性高');clickText('下一步 →');x.set('temp',0);x.run();clickText('活性低（可恢復）');clickText('下一步 →');x.set('temp',70);x.run();clickText('已變性');clickText('下一步 →');
 assert.equal(x.$('ctl-temp').value,'37');assert.match(x.run(),/相對活性0%/);clickText('仍已變性');clickText('下一步 →');x.set('enzyme','pepsin');x.run();clickText('活性低');clickText('完成引導，開始自由練習 →');clickText('重看引導（換新樣本）');assert.match(x.run(),/相對活性100%/);x.close();
});
test('comparison distinguishes equal controls with changed sample or heat history, without rewriting legacy evidence',()=>{
 const x=load();x.run();x.record();x.set('temp',70);x.set('temp',37);x.run();x.record();
 assert.match(x.$('record-comparison').textContent,/目前控制值相同，但樣本／加熱歷程不同/);
 assert.doesNotMatch(x.$('record-comparison').textContent,/兩筆設定相同/);
 assert.equal(x.rows()[0].settings.sampleId,x.rows()[1].settings.sampleId);
 x.$('reset').click();x.run();x.record();assert.match(x.$('record-comparison').textContent,/目前控制值相同，但樣本／加熱歷程不同/);assert.match(x.$('record-comparison').textContent,/不同樣本/);
 assert.match(x.$('current-conditions').textContent,/酵素種類：唾液澱粉酶/);assert.doesNotMatch(x.$('current-conditions').textContent,/換酵素（新樣本）：/);
 assert.match(x.$('print-records').textContent,/酵素種類：/);assert.match(x.d.querySelector('label[for="ctl-enzyme"]').textContent,/換酵素（新樣本）/);
 x.run();x.record();assert.match(x.$('record-comparison').textContent,/兩筆設定相同/);x.close();
 const legacy={conditions:'舊樣本原始條件',result:'100%',prediction:'',explanation:'既有證據',settings:{temp:37,ph:7,enzyme:'amylase',conc:1}};
 const y=load({'bhcs-science-v2-enzyme':JSON.stringify([legacy])});y.run();y.record();assert.match(y.$('record-comparison').textContent,/舊紀錄沒有樣本歷程/);assert.equal(y.rows()[0].conditions,legacy.conditions);y.close();
});
test('low-temperature guide feedback never promises recovery of an already heat-denatured sample',()=>{
 const x=load();const clickText=text=>{const b=[...x.d.querySelectorAll('.guide-box button')].find(b=>b.textContent===text);assert.ok(b,text);b.click()};
 x.run();clickText('活性高');clickText('下一步 →');x.set('temp',70);x.set('temp',0);assert.match(x.run(),/已變性/);clickText('已變性');
 const feedback=x.d.querySelector('.guide-box').textContent;
 assert.match(feedback,/答對了/);assert.match(feedback,/未曾高溫變性的樣本/);assert.match(feedback,/已高溫變性的同一份樣本則不會恢復/);assert.match(feedback,/換新樣本/);
 x.$('reset').click();x.set('temp',0);assert.match(x.run(),/沒有變性/);clickText('活性低（可恢復）');assert.match(x.d.querySelector('.guide-box').textContent,/答對了/);x.close();
});
console.log(`${passed} enzyme sample-history scenarios passed.`);
