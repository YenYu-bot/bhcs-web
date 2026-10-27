import test from 'node:test';import assert from 'node:assert/strict';import {createHold} from '../../tools/buoyancy-lab/hold.mjs';
function fixture(){let calls=0,id=0;const timers=new Map();const h=createHold({step:()=>calls++,setTimer:f=>{timers.set(++id,f);return id},clearTimer:i=>timers.delete(i)});return {h,get calls(){return calls},timers,tick(){const [i,f]=timers.entries().next().value;timers.delete(i);f()}}}
test('hold starts one 10% step and repeats on timer',()=>{const x=fixture();x.h.start();assert.equal(x.calls,1);x.tick();assert.equal(x.calls,2);x.h.stop()});
test('release stops and deduplicates synthetic click',()=>{const x=fixture();x.h.start();x.h.stop();assert.equal(x.timers.size,0);x.h.click();assert.equal(x.calls,1)});
test('cancel/blur/hidden stop is idempotent',()=>{const x=fixture();x.h.start();x.h.stop();x.h.stop();assert.equal(x.h.active,false);assert.equal(x.timers.size,0)});
test('duplicate pointerdown does not add step or timer',()=>{const x=fixture();x.h.start();x.h.start();assert.equal(x.calls,1);assert.equal(x.timers.size,1)});
test('keyboard click works without pointerdown',()=>{const x=fixture();x.h.click();assert.equal(x.calls,1);assert.equal(x.timers.size,0)});
test('keyboard works after cancelled pointer via clearSuppression',()=>{const x=fixture();x.h.start();x.h.stop();x.h.clearSuppression();x.h.click();assert.equal(x.calls,2)});
test('stopping from first step does not enqueue timer at 100 percent',()=>{let scheduled=0;let h;h=createHold({step:()=>h.stop(),setTimer:()=>++scheduled});h.start();assert.equal(scheduled,0);assert.equal(h.active,false)});
