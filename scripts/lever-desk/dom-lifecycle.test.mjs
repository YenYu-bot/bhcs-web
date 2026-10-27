import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {setTimeout as sleep} from 'node:timers/promises';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
test('supplemental lifecycle: live fixture timers execute; only closing owner cancels pending callbacks',async()=>{
 const first=new JSDOM('<p>first</p>'),second=new JSDOM('<p>second</p>');
 globalThis.window=first.window;let fired=0;
 setTimeout(()=>{assert.equal(first.window.document.querySelector('p').textContent,'first');fired++;},0);
 await sleep(20);assert.equal(fired,1,'no timer canceled before live assertions');
 let closedCallback=false,otherCallback=false;
 setTimeout(()=>{closedCallback=true;},25);
 globalThis.window=second.window;setTimeout(()=>{otherCallback=true;},25);
 first.window.close();await sleep(60);
 assert.equal(closedCallback,false,'destroyed window callback canceled at close');
 assert.equal(otherCallback,true,'another live fixture is never canceled');
 second.window.close();
});
