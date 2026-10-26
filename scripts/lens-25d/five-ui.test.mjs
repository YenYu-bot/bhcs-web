import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(new URL('../../tools/lens-25d/index.html',import.meta.url),'utf8'),{url:'https://example.test/',pretendToBeVisual:true});globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.KeyboardEvent=dom.window.KeyboardEvent;dom.window.HTMLElement.prototype.scrollIntoView=function(){};
// Deterministic user-visible dwell checks: no real wall-clock sleeps or timer races.
let clock=0,nextTimer=1;const timers=new Map();
const schedule=(fn,delay=0,...args)=>{const id=nextTimer++;timers.set(id,{at:clock+Number(delay),fn:()=>fn(...args)});return id;};
const cancel=id=>timers.delete(id);
globalThis.setTimeout=dom.window.setTimeout=schedule;globalThis.clearTimeout=dom.window.clearTimeout=cancel;
const advance=ms=>{const end=clock+ms;for(;;){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;const[id,t]=next;timers.delete(id);clock=t.at;t.fn();}clock=end;};
let confirmAnswer=true,confirmCalls=0;dom.window.confirm=()=>{confirmCalls++;return confirmAnswer;};
await import('../../tools/lens-25d/assets/pilot.js');
const $=id=>document.getElementById(id),select=id=>document.querySelector(`[data-case="${id}"]`).click(),keyEvent=(id,type,k,extra={})=>$(id).dispatchEvent(new KeyboardEvent(type,{key:k,bubbles:true,cancelable:true,...extra})),key=(id,k,shiftKey=false)=>{keyEvent(id,'keydown',k,{shiftKey});keyEvent(id,'keyup',k,{shiftKey});};let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS',name)};
test('five canonical controls and frozen modules',()=>{assert.equal(document.querySelectorAll('[data-case]').length,5);for(const f of ['model','engine','input','visual','challenges','persist'])assert.equal(createHash('sha256').update(fs.readFileSync(new URL(`../../tools/lens-25d/assets/optics-guided/${f}.js`,import.meta.url))).digest('hex'),JSON.parse(fs.readFileSync(new URL('../lens-25d-runtime.json',import.meta.url),'utf8')).files.find(entry=>entry.path===`assets/optics-guided/${f}.js`).sha256);});
test('real first actual14.5 and equal-size instantclear; oldrecord remains',()=>{for(let i=0;i<5;i++)$('left').click();key('screen-hit','ArrowLeft',true);$('record').click();assert.match($('evidence-cards').textContent,/14.5 cm/);select('at2f');assert.equal($('record').disabled,false);assert.equal($('guide').dataset.step,'3');$('record').click();assert.match($('evidence-cards').textContent,/等大/);assert.match($('evidence-cards').textContent,/14.5 cm/);});
test('between actual29.5 and movedoffsharp invalidation',()=>{select('between');for(let i=0;i<9;i++)$('right').click();key('screen-hit','ArrowRight',true);assert.equal($('position').textContent,'29.5');assert.equal($('record').disabled,false);$('right').click();$('right').click();assert.equal($('record').disabled,true);$('left').click();$('left').click();$('record').click();assert.match($('evidence-cards').textContent,/29.5 cm/);});
test('actualobjectclass/offbench warning and reclicksamepreset',()=>{select('between');for(let i=0;i<4;i++)$('object-near').click();assert.equal($('object-position').textContent,'11');assert.equal($('bench').dataset.currentCase,'between');assert.match($('clarity').textContent,/實像.*超出/);assert.equal($('record').disabled,true);select('between');assert.equal($('object-position').textContent,'15');});
const search=()=>{key('screen-hit','PageDown');advance(400);key('screen-hit','PageUp');advance(400);key('screen-hit','PageUp');key('screen-hit','PageUp');advance(400);};
const zones=()=>[...document.querySelectorAll('#search-zones .visited')].map(el=>el.textContent);
const zoneCount=()=>zones().length;
test('focal changed settles threezones and distinct focal evidence',()=>{select('focal');assert.equal($('special-action').disabled,true);assert.equal($('record').hidden,true);search();assert.equal($('special-action').disabled,false);assert.match($('physics-note').textContent,/平行.*不是虛像/);$('special-action').click();assert.match($('evidence-cards').textContent,/三區都未找到清楚屏幕像/);assert.match($('model-comparison').textContent,/出射光線平行/);assert.equal($('special-action').disabled,true);});
test('virtual separate observation, no virtual image on screen, staleactions reset',()=>{select('inside');assert.equal($('special-action').disabled,true);search();$('special-action').click();assert.equal($('through-view').hidden,false);assert.equal($('result').hidden,true);assert.equal($('image-art').getAttribute('transform'),'scale(0)');assert.match($('observation-title').textContent,/透鏡後/);assert.match($('through-art').textContent,/正立.*放大/);$('special-action').click();assert.match($('evidence-cards').textContent,/從透鏡後觀察/);select('focal');assert.equal($('through-view').hidden,true);assert.equal($('special-action').disabled,true);assert.match($('evidence-cards').textContent,/14.5 cm/);$('restart').click();assert.equal($('object-position').textContent,'30');assert.equal(document.querySelectorAll('.case-badge').length,5);assert(!$('evidence-cards').textContent.includes('14.5'));});
test('mobile explicit grid retained; controls avoid narrowed paragraphs',()=>{const css=fs.readFileSync(new URL('../../tools/lens-25d/assets/pilot.css',import.meta.url),'utf8');assert(css.includes('.mission{display:grid;grid-template-columns:34px minmax(0,1fr)'));assert(css.includes('.mission .conditions{grid-column:1 / -1;grid-row:2;margin:0;'));assert(css.includes('.bench-controls{display:grid;grid-template-columns:minmax(0,1fr)'));assert(css.includes('.case-cards{grid-template-columns:repeat(2,minmax(0,1fr))}'));for(const width of[320,390])assert(width-32-3.4-24-34-10>216);});
test('large virtual image uses shared fit, return resets search, append history survives updates',()=>{
 select('inside');for(let i=0;i<4;i++)$('object-far').click();assert.equal($('object-position').textContent,'9');search();$('special-action').click();const svg=$('through-art').querySelector('svg');assert.equal(svg.getAttribute('viewBox'),'0 0 1000 1000');assert.equal(svg.querySelectorAll('g[transform]').length,2);assert.match($('through-art').textContent,/10.00 倍.*同一比例/);assert.equal(svg.querySelector('text'),null);
 $('move-from-result').click();assert.equal($('through-view').hidden,true);assert.equal($('special-action').disabled,true);assert.equal(document.activeElement,$('screen-hit'));
 select('outside2f');for(let i=0;i<5;i++)$('left').click();key('screen-hit','ArrowLeft',true);$('record').click();const first=$('evidence-history').textContent;assert.match(first,/14.5 cm/);key('screen-hit','ArrowRight',true);$('record').click();assert.equal($('evidence-history').children.length,2);assert.match($('evidence-history').textContent,/14.5 cm/);assert.match($('evidence-history').textContent,/光屏 15 cm/);$('record').click();assert.equal($('evidence-history').children.length,2);
});
test('revisited identical real/focal/virtual snapshots never offer silent rejected capture',()=>{
 $('restart').click();select('at2f');$('record').click();select('at2f');assert.equal($('record').disabled,true);assert.match($('record').textContent,/已有紀錄/);assert.match($('guide-cue').textContent,/不會重複/);
 select('focal');search();$('special-action').click();select('focal');search();assert.equal($('special-action').disabled,true);assert.match($('special-action').textContent,/已有紀錄/);
 select('inside');search();$('special-action').click();$('special-action').click();select('inside');search();assert.equal($('special-action').disabled,false);$('special-action').click();assert.equal($('through-view').hidden,false);assert.equal($('special-action').disabled,true);assert.match($('special-action').textContent,/已有紀錄/);assert.equal($('evidence-history').children.length,3);
});

test('rapid distinct keyboard presses count only the final endpoint after 400ms',()=>{
 select('focal');for(const k of ['PageDown','PageUp','PageUp','PageUp'])key('screen-hit',k);
 assert.equal($('position').textContent,'30');assert.equal(zoneCount(),0);assert.equal($('special-action').disabled,true);
 advance(399);assert.equal(zoneCount(),0);advance(1);assert.equal(zoneCount(),1);assert.match(zones()[0],/遠區/);assert.equal($('special-action').disabled,true);
});
test('held keys and repeat remain movement until release plus idle',()=>{
 select('inside');keyEvent('screen-hit','keydown','PageDown');advance(1000);assert.equal(zoneCount(),0);
 keyEvent('screen-hit','keydown','PageDown',{repeat:true});advance(1000);assert.equal(zoneCount(),0);
 keyEvent('screen-hit','keyup','PageDown');advance(399);assert.equal(zoneCount(),0);advance(1);assert.equal(zoneCount(),1);assert.match(zones()[0],/近區/);
});
test('native arrow-button Enter activation stays pending while held and repeating',()=>{
 select('focal');$('right').focus();keyEvent('right','keydown','Enter');$('right').click();advance(1000);assert.equal(zoneCount(),0);
 // JSDOM does not synthesize native default clicks, so dispatch each activation explicitly.
 keyEvent('right','keydown','Enter',{repeat:true});$('right').click();advance(1000);assert.equal(zoneCount(),0);assert.equal($('position').textContent,'22');
 keyEvent('right','keyup','Enter');advance(399);assert.equal(zoneCount(),0);advance(1);assert.equal(zoneCount(),1);assert.match(zones()[0],/中區/);
});
test('native arrow-button Space release before default click starts the final dwell',()=>{
 select('inside');$('left').focus();keyEvent('left','keydown',' ');advance(1000);assert.equal(zoneCount(),0);assert.equal($('position').textContent,'20');
 keyEvent('left','keyup',' ');$('left').click();assert.equal($('position').textContent,'19');advance(399);assert.equal(zoneCount(),0);advance(1);assert.equal(zoneCount(),1);assert.match(zones()[0],/中區/);
});
test('button and keyboard steps share a burst; returning to its origin earns no credit',()=>{
 select('focal');key('screen-hit','PageDown');advance(200);for(let i=0;i<5;i++)$('right').click();
 assert.equal($('position').textContent,'20');advance(400);assert.equal(zoneCount(),0);
 // A separate rapid button-only traversal may cross zones, but only its endpoint counts.
 for(let i=0;i<4;i++)$('left').click();for(let i=0;i<14;i++)$('right').click();
 assert.equal($('position').textContent,'30');assert.equal(zoneCount(),0);advance(400);assert.equal(zoneCount(),1);assert.match(zones()[0],/遠區/);
});
test('case/object changes and reset discard pending settlement, including identical reselection',()=>{
 select('focal');key('screen-hit','PageDown');advance(200);select('focal');key('screen-hit','PageDown');
 advance(200);assert.equal(zoneCount(),0);advance(199);assert.equal(zoneCount(),0);advance(1);assert.equal(zoneCount(),1);
 select('inside');key('screen-hit','PageDown');$('object-far').click();advance(1000);assert.equal(zoneCount(),0);assert.equal($('object-position').textContent,'6');
 select('focal');key('screen-hit','PageDown');$('restart').click();select('focal');advance(1000);assert.equal(zoneCount(),0);
});
test('pointer takeover cancels a keyboard burst and begins a fresh changed-position operation',()=>{
 select('focal');$('bench').getBoundingClientRect=()=>({left:0,width:880});
 const pointer=(type,x)=>{const e=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:7,pointerType:'mouse',button:0,clientX:x});$('screen-hit').dispatchEvent(e);};
 key('screen-hit','PageDown');pointer('pointerdown',550);advance(1000);assert.equal(zoneCount(),0);
 // Return to the old keyboard origin: this is now a genuine pointer move from 15 to 20.
 pointer('pointermove',600);assert.equal(zoneCount(),0);pointer('pointerup',600);assert.equal(zoneCount(),1);assert.match(zones()[0],/中區/);
 advance(1000);assert.equal(zoneCount(),1);
 select('focal');key('screen-hit','PageDown');pointer('pointerdown',550);pointer('pointerup',550);advance(1000);assert.equal(zoneCount(),0,'takeover tap does not salvage a discarded burst');
 select('focal');pointer('pointerdown',600);pointer('pointermove',480);pointer('pointercancel',999);pointer('lostpointercapture',999);assert.equal(zoneCount(),1);assert.match(zones()[0],/近區/);
});
test('blur and hidden-page interruption discard unobserved endpoints',()=>{
 select('focal');key('screen-hit','PageDown');dom.window.dispatchEvent(new dom.window.Event('blur'));advance(1000);assert.equal(zoneCount(),0);
 select('focal');key('screen-hit','PageDown');Object.defineProperty(document,'hidden',{configurable:true,value:true});Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new dom.window.Event('visibilitychange'));advance(1000);assert.equal(zoneCount(),0);
 Object.defineProperty(document,'hidden',{configurable:true,value:false});Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});
});
test('reset confirmation cancel preserves observations and acceptance clears them',()=>{
 $('restart').click();select('at2f');$('record').click();select('focal');search();$('special-action').click();
 const evidence=$('evidence-cards').textContent,history=$('evidence-history').textContent,learning=$('learning-questions').innerHTML,beforeCalls=confirmCalls;
 confirmAnswer=false;$('restart').click();assert.equal(confirmCalls,beforeCalls+1);assert.equal($('object-position').textContent,'10');assert.equal($('evidence-cards').textContent,evidence);assert.equal($('evidence-history').textContent,history);assert.equal($('learning-questions').innerHTML,learning);assert.equal(zoneCount(),3);
 confirmAnswer=true;$('restart').click();assert.equal(confirmCalls,beforeCalls+2);assert.equal($('object-position').textContent,'30');assert.equal($('evidence-history').children.length,0);assert.equal(zoneCount(),0);assert.equal(document.activeElement,$('look'));
});
test('canceling reset also preserves a pending observation burst',()=>{
 select('focal');key('screen-hit','PageDown');advance(200);confirmAnswer=false;$('restart').click();assert.equal($('position').textContent,'15');advance(199);assert.equal(zoneCount(),0);advance(1);assert.equal(zoneCount(),1);assert.match(zones()[0],/近區/);confirmAnswer=true;
});
console.log(`${n} five-case UI checks passed; DOM/static geometry only, not browser screenshot QA.`);
