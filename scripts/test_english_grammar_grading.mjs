import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gradeItem, isPilotTopic } from '../assets/english-grammar/grading.js';
import { answersOf, buildSheet, decodeCode } from '../assets/english-grammar/core.js';
import { TOPICS } from '../assets/english-grammar/topics.js';

const blank = (a) => ({ blank: true, a });
const item = (...answers) => ({ lines: [['→ ', ...answers.map(blank)]] });

test('pilot boundary and opt-in review for unvalidated or no-word items', () => {
  assert.deepEqual(TOPICS.filter(t => isPilotTopic(t.id)).map(t => t.id).sort(), ['be', 'past', 'simple']);
  assert.equal(gradeItem(item('is'), ['is'], {topicId:'passive'}).status, 'review');
  assert.equal(gradeItem(item('is'), ['is'], {topicId:'be',modeId:'translation'}).status, 'review');
  assert.equal(gradeItem({...item('is'), grading:'review'}, ['is']).status, 'review');
  assert.equal(gradeItem(item('×'), ['']).status, 'review');
  assert.equal(gradeItem({lines:[['reference only']]}, []).status, 'review');
});

test('unanswered, partially filled and incorrect are separate', () => {
  const x = {lines: [['First ', blank('Did')], ['then ', blank('did'), blank('not')]]};
  assert.equal(gradeItem(x, ['  ', null]).status, 'unanswered');
  const partial = gradeItem(x, ['Does', 'did', '']);
  assert.equal(partial.status, 'partial');
  assert.deepEqual(partial.blanks.map(b => b.status), ['incorrect', 'correct', 'unanswered']);
  assert.equal(gradeItem(x, ['Did','does','not']).status, 'incorrect');
  assert.equal(gradeItem(x, ['did','did','not']).status, 'correct');
});

test('strict contraction instructions with keyboard formatting tolerance', () => {
  const c = {topicId:'past', modeId:'neg', abbr:'C'};
  assert.equal(gradeItem(item("didn't", 'go'), [' ＤＩＤＮ’Ｔ ', 'go'], c).status, 'correct');
  assert.equal(gradeItem(item("didn't", 'go'), ['did not', 'go'], c).status, 'incorrect');
  assert.equal(gradeItem(item("didn't", 'go'), ['didnt', 'go'], c).status, 'incorrect');
  assert.equal(gradeItem(item('did', 'not', 'go'), ["didn't", 'not', 'go'], {...c, abbr:'F'}).status, 'incorrect');
  assert.equal(gradeItem(item('I','do'), ['i','do']).status, 'incorrect');
});

test('print alternatives, dialect spellings, and paired answers', () => {
  assert.equal(gradeItem(item('we／you','are'), ['you','are']).status, 'correct');
  assert.equal(gradeItem(item('we／you','are'), ['we／you','are']).status, 'incorrect');
  for (const [canonical, variant] of [['learned','learnt'],['traveled','travelled'],['practiced','practised'],['practices','practises']]) {
    assert.equal(gradeItem(item(canonical), [variant]).status, 'correct');
  }
  assert.equal(gradeItem(item('learn'), ['learnt']).status, 'incorrect');
  const paired = {...item('she','is'),gradingAlternatives:[['she','is'],['they','are']]};
  assert.equal(gradeItem(paired, ['they','are']).status, 'correct');
  const mismatch = gradeItem(paired, ['they','is']);
  assert.equal(mismatch.status, 'incorrect');
  assert.deepEqual(mismatch.blanks.map(b=>b.status), ['review','review']);
  assert.equal(gradeItem(item('Did','she','did'), ['Did','they','did'], {topicId:'past',modeId:'short'}).status, 'review');
  assert.equal(gradeItem(item('Did','she','did'), ['Did','dog','did'], {topicId:'past',modeId:'short'}).status, 'incorrect');
});

test('generated keys pass in all six approved modes across level, tense and contraction options', () => {
  let checked = 0, alternatives = 0;
  for (const topic of TOPICS.filter(t => isPilotTopic(t.id))) {
    for (const mode of topic.modes) for (const level of [1,2,3]) {
      for(const tense of topic.past ? ['P','M','D'] : ['P']) for(const abbr of ['F','C','B']) {
        for (const seed of [12, 1024]) {
          const sheet = buildSheet(topic, {level, tense, abbr, seed, modes:[mode.id], count:10, zh:false, tr:0});
          for (const section of sheet.sections) for (const generated of section.items) {
            const context = {topicId:topic.id, modeId:mode.id, abbr};
            const key = answersOf(generated).map(str => str.split('／')[0]);
            assert.equal(gradeItem(generated, key, context).status, 'correct', JSON.stringify({context, key, seed}));
            const alternateKey = answersOf(generated).map(str => str.split('／').at(-1));
            if (alternateKey.some((v,i)=>v!==key[i])) {
              alternatives++;
              assert.equal(gradeItem(generated, alternateKey, context).status, 'correct');
            }
            checked++;
          }
        }
      }
    }
  }
  assert.ok(checked >= 3000);
  assert.ok(alternatives > 0);
});

test('Be negative short reply accepts either coherent contraction, not mixed or uncontracted forms', () => {
  const opts={topicId:'be',modeId:'short'};
  const reported={lines:[[blank('Am'),' I ready now? — No, ',blank('you'),' ',blank("aren't"),'.']]};
  for (const inputs of [['Am','you',"aren't"],['Am','you’re','not']]) {
    assert.equal(gradeItem(reported,inputs,opts).status,'correct');
  }
  for (const inputs of [['Am',"you're","aren't"],['Am','you','not']]) {
    const grade=gradeItem(reported,inputs,opts);
    assert.equal(grade.status,'incorrect');
    assert.match(grade.combinationHint,/you \+ aren't.*you're \+ not/);
  }
  for (const inputs of [['Am','you','are not'],['Is',"you're",'not'],['Am','youre','not']]) {
    assert.equal(gradeItem(reported,inputs,opts).status,'incorrect');
  }
  assert.equal(gradeItem(reported,['Am',"you're",''],opts).status,'partial');
  const plural={lines:[[blank('Are'),' you and Tom ready? — No, ',blank('we／you'),' ',blank("aren't"),'.']]};
  for (const subject of ["we're","you're"]) assert.equal(gradeItem(plural,['Are',subject,'not'],opts).status,'correct');
  const full={lines:[['Is Mary there?'],['— No, ',blank('she'),' ',blank("isn't"),'. ',blank('She'),' ',blank('is'),' here.']]};
  assert.equal(gradeItem(full,["she's",'not','She','is'],{...opts,modeId:'full'}).status,'correct');
  const past={lines:[[blank('Was'),' she there? — No, ',blank('she'),' ',blank("wasn't"),'.']]};
  assert.equal(gradeItem(past,['Was',"she's",'not'],opts).status,'incorrect');
  assert.equal(gradeItem(past,['Was','she',"wasn't"],opts).status,'correct');
  const yes={lines:[[blank('Am'),' I ready? — Yes, ',blank('you'),' ',blank('are'),'.']]};
  assert.equal(gradeItem(yes,['Am',"you're",''],opts).status,'partial');
});


test('reported can worksheet keeps two slots for present uncontracted can + not', () => {
  const code = 'CAN-2P-F-F0-20-99542-C2';
  const { topic, opts } = decodeCode(code, TOPICS);
  const sheet = buildSheet(TOPICS.find(t => t.id === topic), opts);
  const first = sheet.sections[0].items[0];
  const context = {topicId:'can', modeId:'fill'};
  assert.match(first.lines[0].join(''), /The dog .* jump high/);
  assert.deepEqual(answersOf(first), ['can','not']);
  assert.equal(gradeItem(first,['can','not'],context).status, 'correct');
  assert.equal(gradeItem(first,['cannot','not'],context).status, 'incorrect');
  assert.equal(gradeItem(first,['can',''],context).status, 'partial');
  assert.deepEqual(answersOf(sheet.sections[0].items[1]), ['can','dance']);
});
