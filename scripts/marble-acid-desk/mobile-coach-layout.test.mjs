import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Static guard for the layout contract; real text wrapping is verified in browser QA.
const css=readFileSync(new URL('../../tools/science/reaction-rate-desk/style.css',import.meta.url),'utf8');
const mobile=css.slice(css.lastIndexOf('/* Let enlarged coach text'));
const rule=selector=>{
  const start=mobile.indexOf(`${selector}{`);
  assert.notEqual(start,-1,`missing responsive rule: ${selector}`);
  return mobile.slice(start+selector.length+1,mobile.indexOf('}',start));
};
test('mobile coach expands in flow while the fixed bench and tabletop share the next row',()=>{
  assert.match(mobile,/@media\(max-width:700px\)/);
  assert.match(rule('.stage-area'),/height:auto/);
  assert.match(rule('.stage-area'),/grid-template-rows:minmax\(100px,auto\) 415px/);
  assert.match(rule('.coach'),/height:auto/);
  assert.match(rule('.coach'),/grid-template-rows:1fr auto/);
  for(const selector of ['.coach>div:not(.coach-name):not(#baseline-keepsake)','.coach button']){
    assert.match(rule(selector),/position:static/);
  }
  assert.match(rule('.coach button'),/grid-row:2/);
  assert.match(rule('.bench'),/position:relative/);
  assert.match(rule('.bench'),/grid-area:2 \/ 1/);
  assert.match(rule('.stage-area:before'),/grid-area:2 \/ 1/);
  assert.match(rule('.stage-area:before'),/margin-top:110px/);
  assert.match(rule('.coach #baseline-keepsake'),/grid-area:auto;top:100%/);
  assert.doesNotMatch(mobile,/font-size|max-height|overflow:hidden/);
});
