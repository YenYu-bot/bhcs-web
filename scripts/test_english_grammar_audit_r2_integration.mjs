import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {decodeCode,decodeMixCode,buildSheet,buildMixSheet,answersOf} from '../assets/english-grammar/core.js';
import {gradeItem} from '../assets/english-grammar/grading.js';
import {TOPICS} from '../assets/english-grammar/topics.js';
const t = id => TOPICS.find(x=>x.id===id);
function restore(code){
  const m=code.startsWith('MIX-'), d=(m?decodeMixCode:decodeCode)(code,TOPICS);
  assert.ok(d,code);
  const s=m?buildMixSheet(d.topics.map(t),d.opts):buildSheet(t(d.topic),d.opts);
  assert.equal(s.code,code);return s;
}
test('R1 and published layouts remain exact for affected single and mixed codes',()=>{
  const old = {
    'PST-2P-8-C0-20-99542-R1':'4e81cb50b0e32594c167545a6d1034c5de7691a12998af61356858925985f01f',
    'THR-2P-20-F0-10-99542-R1':'9acdde81ea89ca4fd3ea7eae2d7e0ed4762e9c4295dcb4d66d8e9955424140b5',
    'MIX-3P-THR.PST-F0-50-99542-T5-R1':'3071b2ebeda148f1710033c039b989dfc8c65abfa78f269113325b30bab12ca6',
    'MIX-3P-THR.PST-F0-50-99542-T5':'a1a7f0b70a39cbe0a37cfaf6b03a904de0084f21bdbe41b678969130b9d8b042',
  };
  for(const [code,hash] of Object.entries(old)){
    assert.equal(createHash('sha256').update(JSON.stringify(restore(code))).digest('hex'),hash,code);
  }
});
test('mixed use includes the two revised formats and inherits first-batch fixes',()=>{
  const base='MIX-3P-THR.PST-F0-50-99542-T5';
  const s=restore(base+'-R2');
  assert.deepEqual(s,restore(s.code));
  assert.equal(s.opts.auditFix,true);
  assert.equal(s.opts.auditR2,true);
  const there=s.sections.find(x=>x.topic==='there' && x.mode==='wh');
  assert.deepEqual(new Set(there.items.map(x=>answersOf(x).join('/'))),new Set(['many/are','much/is']));
  assert.ok(s.sections.find(x=>x.topic==='past' && x.mode==='short').items.every(x=>x.lines[0][0]==='Did'));
  const unrelated='CAN-2P-F-F0-20-99542-T5-C3';
  assert.deepEqual(restore(unrelated+'-R1').sections,restore(unrelated+'-R2').sections);
  assert.match(restore('FUT-3P-2-C0-30-8-R2').sections[0].title,/I'm not/);
  assert.equal(decodeCode('CAN-2P-F-F0-20-99542-R2-C3',TOPICS),null);
});
test('two-field Past reply keeps normal scoring and only accepts grammatical they for review',()=>{
  const item=restore('PST-2P-8-C0-20-99542-R2').sections[0].items[1];
  const grade=answers=>gradeItem(item,answers,{topicId:'past',modeId:'short'}).status;
  assert.equal(grade(['he',"didn't"]),'correct');
  assert.equal(grade(['they',"didn't"]),'review');
  assert.equal(grade(['they','did']),'incorrect');
  assert.equal(grade(['they','']),'partial');
});
