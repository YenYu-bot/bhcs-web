import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../../tools/incline-desk/style.css',import.meta.url),'utf8');
const rules=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({selector:m[1].trim(),body:m[2]}));
const last=selector=>rules.filter(r=>r.selector===selector).at(-1)?.body;
test('generic button hover explicitly excludes the handle on mouse, touch and hybrid devices',()=>{
 const hover=rules.filter(r=>r.selector.includes(':hover'));
 assert.equal(hover.length,1,'no separate hover selector can leave the handle highlighted');
 assert.equal(hover[0].selector,'button:hover:not(:disabled):not(.drag-handle)');
 assert.match(hover[0].body,/background:#e8f0dc/,'other buttons retain existing hover feedback');
});
test('idle handle remains translucent and only the authoritative dragging class gets the distinct drag colour',()=>{
 assert.match(last('.drag-handle'),/background:#cde2bf22/);
 assert.match(last('.drag-handle.is-dragging'),/background:#e8d99b44/);
 assert.match(last('.drag-handle'),/border:1px dashed #618064/);
 assert.match(last('.drag-handle span'),/opacity:0/);
});
test('keyboard focus and touch gesture CSS remain available independently of hover',()=>{
 const focus=rules.find(r=>r.selector.includes('button:focus-visible'));
 assert(focus);assert.match(focus.body,/outline:3px solid #be683c/);assert.match(focus.body,/outline-offset:4px/);
 assert(rules.filter(r=>r.selector==='.drag-handle').some(r=>/touch-action:none/.test(r.body)));
});

test('native active pseudo-state cannot independently retain drag fill or cursor after release',()=>{
 const handleRules=rules.filter(r=>r.selector.includes('.drag-handle'));
 assert(handleRules.every(r=>!r.selector.includes(':active')));
 assert.equal(handleRules.filter(r=>r.selector==='.drag-handle.is-dragging').length,2);
 assert.match(handleRules.find(r=>r.selector==='.drag-handle.is-dragging').body,/cursor:grabbing/);
});
