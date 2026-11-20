import assert from 'node:assert/strict';
import {test} from 'node:test';
import {answersOf,buildSheet,buildMixSheet,decodeCode,decodeMixCode,requiredGrammarCue} from '../assets/english-grammar/core.js';
import {gradeItem} from '../assets/english-grammar/grading.js';
import {TOPICS} from '../assets/english-grammar/topics.js';
const t = id => TOPICS.find(t => t.id === id);
function sheet(code) {
  const d = (code.startsWith('MIX-') ? decodeMixCode : decodeCode)(code, TOPICS);
  assert.ok(d,code);
  const s = d.topics ? buildMixSheet(d.topics.map(t),d.opts) : buildSheet(t(d.topic),d.opts);
  assert.equal(s.code,code);
  return s;
}
test('R1 round trips alone and with translation/C2/C3 without touching legacy codes',()=>{
  for (const base of ['CAN-2P-F-F0-20-99542-T5-C2','CAN-2P-F-F0-20-99542-T5-C3','MIX-2P-BE.CAN-F0-40-99542-T5-C3','CNJ-3P-1-F0-20-48213','MIX-2P-CNJ-F0-20-99542']) {
    assert.equal(sheet(base).opts.auditFix,undefined);
    const fresh=sheet(base+'-R1');
    assert.equal(fresh.opts.auditFix,true);
    assert.deepEqual(fresh,sheet(fresh.code));
  }
  assert.equal(decodeCode('CAN-2P-F-F0-20-99542-R1-C3',TOPICS),null);
});
test('necessary Mandarin clue appears independently of optional translation only on revised sheets',()=>{
  for(const base of ['CNJ-3P-1-F0-20-48213','MIX-2P-CNJ-F0-20-99542']){
    const old=sheet(base), fresh=sheet(base+'-R1');
    for(const sec of fresh.sections){
      const allowed=['abo','sb'].includes(sec.mode);
      assert.equal(requiredGrammarCue(sec.items[0],'conj',sec.mode,fresh.opts),allowed);
    }
    assert.ok(old.sections.every(s=>!requiredGrammarCue(s.items[0],'conj',s.mode,old.opts)));
  }
});
test('only known alternative spellings and answers are accepted without changing canonical keys',()=>{
  const cases=[
    ['ART-2P-2-F1-10-10014',1,['×'],['a']],
    ['IMP-3P-1-F0-20-48213',3,['Shut'],['Open']],
    ['IMP-3P-2-F0-20-48213',2,["Don't",'yell'],['Do','yell']],
    ['SIM-3P-1-F0-30-48213',2,['go'],['went']],
    ['PRG-3D-1-F0-30-48213',2,['were watching'],['are watching']],
    ['BE-3M-1-F0-30-99542',10,['were'],['am']],
  ];
  for(const [base,i,alternate,wrong] of cases){
    const d=decodeCode(base,TOPICS),old=sheet(base).sections[0], revised=sheet(base+'-R1').sections[0];
    const g=(sec,vals)=>gradeItem(sec.items[i],vals,{topicId:d.topic,modeId:sec.mode}).status;
    const canonical=answersOf(old.items[i]).map(v=>v.split('／')[0]);
    assert.deepEqual(answersOf(revised.items[i]),answersOf(old.items[i]));
    assert.equal(g(old,alternate),'incorrect',base);
    assert.equal(g(revised,canonical),'correct',base);
    assert.equal(g(revised,alternate),'correct',base);
    assert.equal(g(revised,wrong),'incorrect',base);
  }
});

test('grade 9 fixes preserve exact old keys and scope needed cues and alternative spelling',()=>{
  for(const [base,i,topic,mode] of [
    ['WTV-1P-1-F0-10-1',0,'whto','fill'],
    ['PAD-1P-1-F0-10-1',5,'partadj','pick'],
  ]){
    const old=sheet(base),fresh=sheet(base+'-R1'),previous=old.sections[0].items[i],revised=fresh.sections[0].items[i];
    assert.equal(requiredGrammarCue(previous,topic,mode,old.opts),false);
    assert.equal(requiredGrammarCue(revised,topic,mode,fresh.opts),true);
    assert.deepEqual(answersOf(previous),answersOf(revised));
    assert.ok(revised.zh);
  }
  const rel=sheet('REL-2P-4-F1-10-10000-R1').sections[0];
  assert.match(rel.title,/現在簡單式/);
  const sense=sheet('SNS-2P-2-F1-10-11-R1').sections[0];
  assert.deepEqual(answersOf(sense.items[7]),['smelled']);
  assert.equal(gradeItem(sense.items[7],['smelt'],{topicId:'sense',modeId:'linkverb'}).status,'correct');
  assert.equal(gradeItem(sense.items[7],['smells'],{topicId:'sense',modeId:'linkverb'}).status,'incorrect');
  const used=sheet('UST-3P-4-F1-10-13-R1').sections[0].items[2];
  assert.match(used.lines[0].join(''),/You and Tom.*but you don't now/);
});
