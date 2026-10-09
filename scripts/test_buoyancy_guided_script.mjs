// B5 gate (jsdom part): the teaching script and the cards that draw it (assets/buoyancy-guided/script.js, cards.js).
// The real-browser walk from the welcome page to the concept is check_buoyancy_guided_flow_browser.cjs.
// Run on its own: node scripts/test_buoyancy_guided_script.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createInitialState, reduce, deriveView, PHASES } from '../assets/buoyancy-guided/engine.js';
import * as S from '../assets/buoyancy-guided/script.js';
import * as cards from '../assets/buoyancy-guided/cards.js';

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const read = (rel) => fs.readFileSync(here(rel), 'utf8');
let tests = 0;
const test = async (name, fn) => { await fn(); tests++; console.log('PASS', name); };

// ---- a way to play the real engine and look at every step -------------------------------------------------------------
const A = {
  start: { type: 'START' }, begin: { type: 'BEGIN' }, add: { type: 'ADD_BALLAST' }, putBlock: { type: 'PUT_IN', objectId: 'block' }, out: { type: 'TAKE_OUT' },
  brine: { type: 'SELECT_LIQUID', liquidId: 'brine' }, water: { type: 'SELECT_LIQUID', liquidId: 'water' },
  rec1: { type: 'RECORD_TRIAL', trial: 1 }, rec2: { type: 'RECORD_TRIAL', trial: 2 }, next: { type: 'CONTINUE' },
  q: (question, answer) => ({ type: 'ANSWER_COMPARE', question, answer }),
  putWood: { type: 'PUT_IN', objectId: 'wood' }, putStone: { type: 'PUT_IN', objectId: 'stone' },
};
class Run {
  constructor() { this.state = createInitialState(); this.coach = S.reduceCoach(null, null, this.state, deriveView(this.state)); this.snaps = []; this.snap(null, null); }
  snap(action, result) { this.snaps.push({ action, result, state: this.state, view: deriveView(this.state), coach: this.coach }); }
  do(...actions) {
    for (const action of actions) {
      const result = reduce(this.state, action);
      assert.equal(result.accepted, true, `${JSON.stringify(action)} (${result.reason})`);
      this.state = result.state;
      this.coach = S.reduceCoach(this.coach, result, this.state, deriveView(this.state));
      this.snap(action, result);
    }
    return this;
  }
  get last() { return this.snaps.at(-1); }
  get view() { return this.last.view; }
}
const TRIAL1 = [A.start, A.begin, A.putBlock, A.out, A.add, A.putBlock, A.out, A.add, A.putBlock];                  // 60 g, 80 g, then 100 g stays
const TO_SWITCH = [...TRIAL1, A.rec1];
const TO_TRIAL2_DONE = [...TO_SWITCH, A.brine, A.putBlock, A.out, A.add, A.putBlock, A.rec2];
const TO_COMPARE = [...TO_TRIAL2_DONE, A.next];
const TO_TRIAL3 = [...TO_COMPARE, A.q('stayMass', 'smaller'), A.q('stayMass', 'larger'), A.q('firstDrop', 'float'), A.next];
const TO_OBSERVED = [...TO_TRIAL3, A.putWood, A.out, A.putStone];
const TO_CONCEPT = [...TO_OBSERVED, A.next];
const run = (...actions) => new Run().do(...actions);

// every string a function hands to the page, wherever it sits in the object
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}
const keysDeep = (value, out = new Set()) => {
  if (Array.isArray(value)) value.forEach((v) => keysDeep(v, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) { out.add(k); keysDeep(v, out); }
  return out;
};
const FORMAL = ['密度', '漂浮', '懸浮', '下沉', '浮力', '受力', '排開', '阿基米德', '相對密度', 'ρ'];
const NEVER = ['浮力', '受力', '排開', '阿基米德'];
const everything = ({ state, view, result, action }) => [
  S.screenFor(state), S.stepNavModel(state), S.ctaFor(state, view), S.hintFor(view), S.statusModel(state, view), S.dataModel(state, view),
  S.evidenceModel(state, view), S.compareModel(state, view), S.announcementFor(result, state, view, action),
];

await test('welcome: the question, the line under it, and one button', () => {
  const r = run();
  assert.equal(r.coach.name, '余老師');
  assert.equal(r.coach.main, '物體很重，就一定會沉下去嗎？');
  assert.equal(r.coach.sub, '接下來你會親手把東西放進水裡，自己找出答案。');
  assert.deepEqual(S.ctaFor(r.state, r.view), { label: '開始實驗', action: { type: 'START' }, enabled: true });
  assert.equal(S.statusModel(r.state, r.view), null, 'no bench yet, so no status');
});

await test('mission: the two coach lines, a button, and nothing happens by itself', () => {
  const r = run(A.start);
  assert.equal(r.coach.main, '桌上有一個水槽和一個方塊。方塊裡面可以放配重。');
  assert.equal(r.coach.sub, '現在方塊放進水裡會浮起來。想辦法讓它停在水中，不浮也不沉。');
  assert.deepEqual(S.ctaFor(r.state, r.view), { label: '動手試試看', action: { type: 'BEGIN' }, enabled: true });
  assert.equal(r.state.phase, 'mission');
  assert.equal(S.stepFor(r.state), 'mission');
  assert.equal(S.statusModel(r.state, r.view).text, '桌上有水槽、方塊和天平。');
});

await test('buttons: one per phase, with the engine action they send; none while a trial is being tested', () => {
  const at = (actions) => { const r = run(...actions); return S.ctaFor(r.state, r.view); };
  assert.equal(at([A.start, A.begin]), null, 'trial1-test: the button waits for a block that stays');
  const rec1 = at(TRIAL1);
  assert.deepEqual(rec1, { label: '記錄第一次結果', action: { type: 'RECORD_TRIAL', trial: 1 }, enabled: true });
  assert.equal(at([...TRIAL1, A.out]).enabled, false, 'taken out again: still shown, not usable');
  assert.deepEqual(at([...TO_TRIAL2_DONE.slice(0, -1)]), { label: '記錄第二次結果', action: { type: 'RECORD_TRIAL', trial: 2 }, enabled: true });
  assert.deepEqual(at(TO_TRIAL2_DONE), { label: '比較兩次', action: { type: 'CONTINUE' }, enabled: true });
  assert.deepEqual(at(TO_COMPARE), { label: '繼續實驗', action: { type: 'CONTINUE' }, enabled: false });
  assert.equal(at([...TO_COMPARE, A.q('stayMass', 'larger'), A.q('firstDrop', 'float')]).enabled, true);
  assert.equal(at(TO_TRIAL3), null, 'trial3-drop moves on by itself');
  assert.deepEqual(at(TO_OBSERVED), { label: '我觀察到了', action: { type: 'CONTINUE' }, enabled: true });
  assert.equal(at(TO_CONCEPT), null, 'the concept is where this stage ends');
});

await test('trial 1: the coach and the status describe what was seen, in plain words', () => {
  const r = run(A.start, A.begin);
  assert.equal(r.coach.main, '桌上有一個水槽和一個方塊。方塊裡面可以放配重。', 'before the first drop the mission still stands');
  r.do(A.putBlock);
  assert.equal(r.coach.main, '方塊浮起來了。');
  assert.equal(r.coach.sub, '想想看，要讓它停在水中，該怎麼調整？');
  assert.deepEqual(S.statusModel(r.state, r.view), { kind: 'progress', icon: '↑', text: '方塊浮起來了，約 60% 在水面下。' });
  r.do(A.out);
  assert.equal(r.coach.main, '方塊浮起來了。', 'taking the block out says nothing new, so the coach keeps its words');
  assert.equal(S.statusModel(r.state, r.view).text, '方塊在桌上，槽裡是水。');
  r.do(A.add, A.add, A.add, A.putBlock);                                                                   // 120 g: sinks
  assert.equal(r.coach.main, '方塊沉到底了。');
  assert.equal(S.statusModel(r.state, r.view).text, '方塊沉到底了。');
  const stay = run(...TRIAL1);
  assert.equal(stay.coach.main, '方塊停在水中了。');
  assert.equal(stay.coach.sub, '看看天平上的質量。');
  assert.deepEqual(S.statusModel(stay.state, stay.view), { kind: 'success', icon: '✓', text: '方塊停在液體中了。' });
});

await test('hints: the engine says the level, the script gives the words, and never the answer', () => {
  const r = run(A.start, A.begin);
  const levels = [];
  for (let i = 0; i < 5; i++) { r.do(A.putBlock); levels.push(S.hintFor(r.view)); r.do(A.out); }
  assert.deepEqual(levels, [
    null,
    '看看方塊在水裡的位置。',
    '浮起來時，可以試試增加質量；沉到底時，可以試試減少質量。',
    '浮起來時，可以試試增加質量；沉到底時，可以試試減少質量。',
    '每次只改一格，再放進去看看。',
  ]);
  for (const text of Object.values(S.TEXT.hints)) assert.ok(!/100|120|3 格|三格|正確答案/.test(text), text);
  const fresh = run(A.start, A.begin);
  assert.equal(S.hintFor(fresh.view), null);
  assert.equal(S.hintFor(run(A.start).view), null, 'no trial, no hint');
});

await test('trial 1 record: the first piece of evidence, from the engine\'s facts', () => {
  const r = run(...TO_SWITCH);
  assert.equal(r.snaps.find((s) => s.action === A.rec1).coach.main, '第一筆證據有了。接下來只先換一件事。');
  assert.equal(r.snaps.find((s) => s.action === A.rec1).coach.sub, '把液體換成濃鹽水。');
  const ev = S.evidenceModel(r.state, r.view);
  assert.deepEqual(ev, { items: [{
    id: 'record-1', title: '第一次紀錄完成 ✓', note: '方塊停在液體中。',
    rows: [{ label: '液體', value: '水' }, { label: '方塊體積', value: '100 cm³' }, { label: '停在液體中時的質量', value: '100 g' }],
  }] });
  assert.equal(S.evidenceModel(run(...TRIAL1).state, run(...TRIAL1).view).items.length, 0, 'nothing is evidence until it is recorded');
});

await test('trial 2: choosing the liquid brings the coach\'s "only the liquid" line; choosing water again takes it back', () => {
  const r = run(...TO_SWITCH);
  assert.equal(r.coach.main, '第一筆證據有了。接下來只先換一件事。');
  r.do(A.brine);
  assert.equal(r.coach.main, '好，這次我們先只換液體。');
  assert.equal(r.coach.sub, '把同一個方塊放進去看看。');
  r.do(A.water);
  assert.equal(r.coach.main, '第一筆證據有了。接下來只先換一件事。');
  const d = S.dataModel(r.state, r.view);
  assert.deepEqual(d.conditions.map((c) => c.state), ['normal', 'locked', 'locked'], 'the liquid can still be chosen; the block and the mass cannot');
});

await test('trial 2 first drop: the 83% is read from the engine\'s facts, never worked out here', () => {
  const r = run(...TO_SWITCH, A.brine, A.putBlock);
  assert.equal(r.coach.main, '原本停在水中的方塊，現在浮起來了。');
  assert.equal(r.coach.sub, '再找一次讓它停住的質量。');
  assert.equal(S.statusModel(r.state, r.view).text, '方塊浮起來了，約 83% 在水面下。');
  const tampered = structuredClone(r.view);
  tampered.facts.currentBlock.immersionPercent = 77;
  tampered.facts.trial2FirstDrop.immersionPercent = 77;
  assert.equal(S.statusModel(r.state, tampered).text, '方塊浮起來了，約 77% 在水面下。');
  r.state.records[2] = { liquidId: 'brine' };
  const ann = S.announcementFor({ accepted: true, events: [{ type: 'observation', id: 'observation-9', objectId: 'block', outcome: 'float', immersionPercent: 41 }] }, r.state, r.view);
  assert.equal(ann.text, '方塊浮起來了，約 41% 在水面下。', 'the announcement quotes the engine event');
});

await test('trial 2 complete and record: the second piece of evidence, with the first drop beside it', () => {
  const r = run(...TO_SWITCH, A.brine, A.putBlock, A.out, A.add, A.putBlock);
  assert.equal(r.coach.main, '又停住了。');
  assert.equal(r.coach.sub, '看看天平和液體，有什麼不同？');
  r.do(A.rec2);
  assert.equal(r.coach.main, '兩筆證據都有了。');
  assert.equal(r.coach.sub, undefined);
  const items = S.evidenceModel(r.state, r.view).items;
  assert.deepEqual(items.map((i) => i.id), ['record-1', 'record-2']);
  assert.deepEqual(items[1].rows, [
    { label: '液體', value: '濃鹽水' }, { label: '方塊體積', value: '100 cm³' }, { label: '停在液體中時的質量', value: '120 g' },
    { label: '一開始放入的 100 g 方塊', value: '浮起來（約 83% 在水面下）' },
  ]);
  assert.equal(items[1].title, '第二次紀錄完成 ✓');
  assert.equal(S.statusModel(r.state, r.view).text, '兩筆結果都記錄好了。');
});

await test('data card: liquid, volume and mass in trial 1 and 2; the two objects in trial 3; nothing on later screens', () => {
  const t1 = run(A.start, A.begin);
  assert.deepEqual(S.dataModel(t1.state, t1.view), { conditions: [
    { label: '液體', value: '水', state: 'locked' }, { label: '方塊體積', value: '100 cm³', state: 'locked' }, { label: '目前質量', value: '60 g', state: 'normal' },
  ], footerSlots: [] });
  const t2 = run(...TO_SWITCH, A.brine, A.putBlock);
  assert.deepEqual(S.dataModel(t2.state, t2.view).conditions, [
    { label: '液體', value: '濃鹽水', state: 'changed' }, { label: '方塊體積', value: '100 cm³', state: 'locked' }, { label: '目前質量', value: '100 g', state: 'locked' },
  ]);
  const t3 = run(...TO_TRIAL3);
  assert.deepEqual(S.dataModel(t3.state, t3.view).conditions, [
    { label: '液體', value: '水', state: 'locked' }, { label: '大木塊', value: '300 g、500 cm³', state: 'locked' }, { label: '小石頭', value: '120 g、40 cm³', state: 'locked' },
  ]);
  assert.equal(S.dataModel(run(...TO_COMPARE).state, run(...TO_COMPARE).view), null);
  assert.equal(S.dataModel(run().state, run().view), null);
});

await test('compare: the shared contract is all there, with the learner\'s own numbers', () => {
  const r = run(...TO_COMPARE);
  const m = S.compareModel(r.state, r.view);
  assert.deepEqual(m.independentVariable, { label: '液體', from: '水', to: '濃鹽水' });
  assert.deepEqual(m.controlledVariables, [{ label: '方塊體積', value: '100 cm³' }, { label: '放入方式', value: '相同' }, { label: '判定', value: '停在液體中' }]);
  assert.deepEqual(m.observedResponse, [
    { label: '原本 100 g 的方塊', first: '停在水中', second: '浮起來（約 83% 在水面下）' },
    { label: '讓方塊停住所需質量', first: '100 g', second: '120 g' },
  ]);
  assert.equal(m.procedureNote, '先只換液體，再用相同方法重新測量。');
  assert.deepEqual(m.notice, { kind: 'info', text: '這次改的是液體；其他條件保持相同。' });
  assert.deepEqual(m.questions.map((q) => [q.id, q.text, q.options.map((o) => o.label)]), [
    ['stayMass', '換成濃鹽水後，讓方塊停在液體中所需的質量怎麼變？', ['變大', '變小', '差不多']],
    ['firstDrop', '原本停在水中的方塊放進濃鹽水後，結果是？', ['浮起來', '停在液體中', '沉到底']],
  ]);
  for (const q of m.questions) {
    assert.deepEqual(Object.keys(q).sort(), ['disabled', 'feedback', 'id', 'options', 'selectedValue', 'text']);
    assert.ok(q.options.every((o) => Object.keys(o).sort().join() === 'label,value'), 'options are { value, label }');
    assert.equal(q.selectedValue, null);
    assert.equal(q.disabled, false);
    assert.equal(q.feedback, null);
  }
  assert.equal(r.coach.main, '把兩次的證據放在一起看。');
  assert.equal(S.compareModel(run(...TRIAL1).state, run(...TRIAL1).view), null, 'no compare before there are two records');
});

await test('compare: the view-model carries no answer, however the learner has answered', () => {
  const steps = [[], [A.q('stayMass', 'smaller')], [A.q('stayMass', 'larger')], [A.q('stayMass', 'larger'), A.q('firstDrop', 'sink')], [A.q('stayMass', 'larger'), A.q('firstDrop', 'float')]];
  for (const more of steps) {
    const r = run(...TO_COMPARE, ...more);
    const m = S.compareModel(r.state, r.view);
    const keys = [...keysDeep(m)].map((k) => k.toLowerCase());
    assert.ok(!keys.some((k) => /correct|answer|expected|solution/.test(k)), `keys: ${keys.join()}`);
    const text = JSON.stringify(m);
    assert.ok(!/correctAnswer|isCorrect|"status"/.test(text));
  }
});

await test('compare: feedback is a nudge or a confirmation, and never says the learner was wrong', () => {
  const r = run(...TO_COMPARE, A.q('stayMass', 'smaller'), A.q('firstDrop', 'sink'));
  let m = S.compareModel(r.state, r.view);
  assert.deepEqual(m.questions[0].feedback, { kind: 'nudge', text: '再看看兩次讓方塊停住的質量。' });
  assert.deepEqual(m.questions[1].feedback, { kind: 'nudge', text: '回想你把方塊放進濃鹽水時看到了什麼。' });
  assert.deepEqual(m.questions.map((q) => q.selectedValue), ['smaller', 'sink']);
  assert.deepEqual(m.questions.map((q) => q.disabled), [false, false]);
  r.do(A.q('stayMass', 'larger'));
  m = S.compareModel(r.state, r.view);
  assert.deepEqual(m.questions[0].feedback, { kind: 'success', text: '和你的紀錄一致。' });
  assert.equal(m.questions[0].disabled, true, 'a confirmed question is settled');
  assert.equal(r.coach.main, '把兩次的證據放在一起看。');
  r.do(A.q('firstDrop', 'float'));
  assert.equal(r.coach.main, '你剛才已經找到一個規律了。');
  assert.equal(r.coach.sub, '換了液體，同一個方塊要改變質量，才能再次停在液體中。');
  for (const s of strings(S.TEXT.compare)) assert.ok(!/答錯|錯了|不對|失敗/.test(s), s);
  assert.ok(!/答錯|錯了/.test(JSON.stringify(m)));
});

await test('trial 3: the coach, the status and the two pieces of evidence', () => {
  const r = run(...TO_TRIAL3);
  assert.equal(r.coach.main, '如果換成別的東西呢？');
  assert.equal(r.coach.sub, '這次也放放看。');
  assert.equal(S.statusModel(r.state, r.view).text, '大木塊和小石頭都在桌上。');
  r.do(A.putWood);
  assert.deepEqual(S.statusModel(r.state, r.view), { kind: 'progress', icon: '↑', text: '大木塊浮起來了，約 60% 在水面下。' });
  r.do(A.out);
  assert.equal(S.statusModel(r.state, r.view).text, '再把小石頭放進水裡看看。');
  r.do(A.putStone);
  assert.deepEqual(S.statusModel(r.state, r.view), { kind: 'progress', icon: '↓', text: '小石頭沉到底了。' });
  assert.equal(r.coach.main, '木塊比石頭重，卻浮著；石頭比較輕，卻沉了。');
  assert.equal(r.coach.sub, '這和前兩次有什麼不同？');
  const items = S.evidenceModel(r.state, r.view).items;
  assert.deepEqual(items.slice(-2), [
    { id: 'wood', title: '大木塊', rows: [{ label: '質量', value: '300 g' }, { label: '體積', value: '500 cm³' }, { label: '結果', value: '浮起來（約 60% 在水面下）' }] },
    { id: 'stone', title: '小石頭', rows: [{ label: '質量', value: '120 g' }, { label: '體積', value: '40 cm³' }, { label: '結果', value: '沉到底' }] },
  ]);
  assert.equal(S.evidenceModel(run(...TO_TRIAL3, A.putWood).state, run(...TO_TRIAL3, A.putWood).view).items.length, 3, 'the wood shows as soon as it was tried');
});

await test('concept: refused before the concept phase, even when every record already exists', () => {
  for (const actions of [[], TO_COMPARE, TO_TRIAL3, TO_OBSERVED]) {
    const r = run(...actions);
    assert.equal(S.conceptModel(r.state, r.view), null, r.state.phase);
  }
  const observed = run(...TO_OBSERVED);
  assert.ok(observed.view.facts.concept, 'the facts are there, which is exactly why the script must hold back');
  assert.notEqual(run(...TO_CONCEPT).state.phase, 'trial3-observed');
  assert.ok(S.conceptModel(run(...TO_CONCEPT).state, run(...TO_CONCEPT).view));
});

await test('concept: the learner\'s numbers come straight from the engine\'s facts', () => {
  const r = run(...TO_CONCEPT);
  assert.equal(r.coach.main, '剛才幾次實驗，其實都在比較同一件事。');
  assert.equal(r.coach.sub, '先看看是什麼。');
  const m = S.conceptModel(r.state, r.view);
  const [density, results] = m.cards;
  assert.equal(density.title, '密度');
  assert.deepEqual(density.body, ['同樣大小裡裝了多少質量，我們用『密度』來描述。']);
  assert.deepEqual(density.evidence.map((e) => `${e.label}：${e.text}`), [
    '停在水中的方塊：100 g ÷ 100 cm³ = 1.0 g/cm³',
    '停在濃鹽水中的方塊：120 g ÷ 100 cm³ = 1.2 g/cm³',
    '大木塊：300 g ÷ 500 cm³ = 0.6 g/cm³',
    '小石頭：120 g ÷ 40 cm³ = 3.0 g/cm³',
  ]);
  const tampered = structuredClone(r.view);
  Object.assign(tampered.facts.concept[2], { massG: 250, volumeCm3: 500, density: 0.5 });
  assert.equal(S.conceptModel(r.state, tampered).cards[0].evidence[2].text, '250 g ÷ 500 cm³ = 0.5 g/cm³', 'nothing is hard-wired');
  assert.equal(results.title, '三種浮沉結果');
});

await test('concept: the formula sits on the learner\'s own lines', () => {
  const m = S.conceptModel(run(...TO_CONCEPT).state, run(...TO_CONCEPT).view);
  assert.equal(m.formula.expression, 'ρ = m ÷ V');
  assert.equal(m.formula.lines[0].text, '密度 = 質量 ÷ 體積');
  const found = m.formula.lines.filter((l) => l.found).map((l) => l.text);
  assert.equal(found.length, 4);
  assert.ok(found[0].includes('100 g ÷ 100 cm³ = 1.0 g/cm³'));
  assert.ok(found[3].includes('120 g ÷ 40 cm³ = 3.0 g/cm³'));
  assert.equal(m.formula.note, '上面每一行，都是用你自己的質量和體積算出來的。');
});

await test('concept: the three names, each tied to something the learner watched', () => {
  const m = S.conceptModel(run(...TO_CONCEPT).state, run(...TO_CONCEPT).view);
  const results = m.cards[1];
  const body = results.body.join('');
  for (const word of ['漂浮', '懸浮', '下沉']) assert.ok(body.includes(word), word);
  assert.deepEqual(results.evidence.map((e) => e.text), [
    '大木塊的密度 0.6 < 水的密度 1.0 → 漂浮',
    '停在水中的方塊的密度 1.0 = 水的密度 1.0 → 懸浮',
    '小石頭的密度 3.0 > 水的密度 1.0 → 下沉',
  ]);
  const tampered = structuredClone(run(...TO_CONCEPT).view);
  tampered.facts.wood.outcome = 'sink';
  assert.ok(S.conceptModel(run(...TO_CONCEPT).state, tampered).cards[1].evidence[0].text.endsWith('下沉'), 'the verdict is the engine\'s, not the script\'s');
  const r = run(...TO_CONCEPT);
  for (const text of strings(S.conceptModel(r.state, r.view))) assert.ok(!NEVER.some((w) => text.includes(w)), text);
});

await test('no formal word reaches the learner before the concept: messages, hints, labels, every model at every step', () => {
  const run1 = run(...TO_OBSERVED);                                                                          // through trial3-observed
  const pool = [...strings(S.MESSAGES), ...strings(S.TEXT), ...strings(S.LABELS), ...strings(S.STEPS), S.COACH_NAME, ...strings(run1.snaps.map((s) => s.coach))];
  for (const snap of run1.snaps) pool.push(...strings(everything(snap)));
  for (const word of FORMAL) for (const text of pool) assert.ok(!text.includes(word), `"${word}" in "${text}"`);
  assert.ok(pool.length > 400, `only ${pool.length} strings looked at`);
  const html = new JSDOM(read('../tools/science/buoyancy-guided.html')).window.document;
  const shell = [html.body.textContent, ...[...html.querySelectorAll('[aria-label],[title],[alt]')].flatMap((e) => [e.getAttribute('aria-label'), e.getAttribute('title'), e.getAttribute('alt')])].filter(Boolean).join('\n');
  for (const word of FORMAL) assert.ok(!shell.includes(word), `"${word}" in the page shell`);
  const concept = strings(S.CONCEPT_TEXT).join('\n');
  for (const word of ['密度', '漂浮', '懸浮', '下沉']) assert.ok(concept.includes(word), `${word} belongs to the concept text`);
});

await test('no force vocabulary anywhere in the guided lab, concept included', () => {
  const r = run(...TO_CONCEPT);
  const pool = [...strings(S.MESSAGES), ...strings(S.CONCEPT_MESSAGES), ...strings(S.TEXT), ...strings(S.CONCEPT_TEXT), ...strings(S.conceptModel(r.state, r.view))];
  for (const snap of r.snaps) pool.push(...strings(everything(snap)));
  for (const word of NEVER) for (const text of pool) assert.ok(!text.includes(word), `"${word}" in "${text}"`);
  const page = read('../tools/science/buoyancy-guided.html');
  for (const word of NEVER) assert.ok(!page.includes(word), word);
});

// ---- strip comments and the text of strings, to look only at the code that is left ------------------------------------
function codeOnly(src) {
  let out = '', i = 0;
  const n = src.length;
  const skipString = (quote) => {
    out += quote; i++;
    while (i < n && src[i] !== quote) {
      if (src[i] === '\\') { i += 2; continue; }
      if (quote === '`' && src[i] === '$' && src[i + 1] === '{') {
        out += '${'; i += 2;
        let depth = 1;
        while (i < n && depth > 0) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; if (depth > 0) out += src[i]; i++; }
        out += '}';
        continue;
      }
      i++;
    }
    out += quote; i++;
  };
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
    if (c === '"' || c === "'" || c === '`') { skipString(c); continue; }
    out += c; i++;
  }
  return out;
}

await test('script.js is not a place for physics: no model import, no arithmetic, no rounding, no density judgement', () => {
  const raw = read('../assets/buoyancy-guided/script.js');
  const code = codeOnly(raw);
  assert.ok(!/^\s*import\s/m.test(code) && !/\bimport\s*\(/.test(code) && !/require\(/.test(code), 'script.js imports nothing');
  assert.ok(!/model\.js/.test(raw.replace(/\/\/.*$/gm, (m) => (/does not import model\.js/.test(m) ? '' : m))), 'no reference to model.js outside the sentence that says it is not used');
  assert.ok(!/[*/%]/.test(code.replace(/\$\{[^}]*\}/g, (m) => m)), `an operator that does arithmetic is in the code: ${(code.match(/.{20}[*/%].{20}/) || [''])[0]}`);
  assert.ok(!/\bMath\b/.test(code), 'no Math');
  assert.equal((code.match(/\.toFixed\(/g) ?? []).length, 1, 'one formatter, for densities, is the only rounding');
  const plain = code.replace(/=>/g, '  ');
  assert.ok(!/outcomeIn|blockOutcome|objectOutcome|relation\(/.test(plain), 'no asking the model');
  assert.ok(!/\b(density|objectDensity|liquidDensity|immersionFraction)\b\s*(<=?|>=?|===?|!==?)/.test(plain) && !/(<=?|>=?|===?|!==?)\s*[\w.]*\b(density|objectDensity|liquidDensity|immersionFraction)\b/.test(plain), 'densities and fractions are never compared');
  assert.ok(!/\b(massG|volumeCm3)\b\s*(<=?|>=?|[-+])|(<=?|>=?)\s*[\w.]*\b(massG|volumeCm3)\b/.test(plain), 'masses and volumes are only placed into sentences');
  assert.ok(!/localStorage|sessionStorage|indexedDB|document\.|window\.|fetch\(|gtag|dataLayer/.test(code), 'no page, storage or analytics access');
});

await test('announcements: the engine\'s event id decides; same words with another id are spoken again', async () => {
  const r = run(A.start, A.begin, A.putBlock, A.out, A.putBlock);
  const events = r.snaps.filter((s) => s.action === A.putBlock);
  const [a, second] = events.map((s) => S.announcementFor(s.result, s.state, s.view, s.action));
  assert.ok(second.text.startsWith(a.text), 'the second sighting reads the same, with the hint that came with it');
  assert.notEqual(a.id, second.id);
  assert.match(a.id, /^observation-\d+$/);
  const b = { ...a, id: second.id };                                                                       // the same words under the next event id
  const el = { dataset: {}, textContent: '' };
  const speaker = cards.createAnnouncer(el, { delayMs: 0 });
  const wait = () => new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(speaker.say(a), true); await wait();
  assert.equal(el.textContent, a.text); assert.equal(el.dataset.writes, '1');
  assert.equal(speaker.say({ ...a }), false, 'the same id is not spoken again'); await wait();
  assert.equal(el.dataset.writes, '1');
  assert.equal(speaker.say(b), true); await wait();
  assert.equal(el.dataset.writes, '2', 'another id with the same words is');
  assert.equal(speaker.say(null), false);
});

await test('announcements: records, observations with a hint, the second object of trial 3, and compare answers', () => {
  const r = run(...TRIAL1);
  const ann = (action) => { const s = r.snaps.find((x) => x.action === action); return S.announcementFor(s.result, s.state, s.view, s.action); };
  assert.equal(S.announcementFor(null, r.state, r.view), null);
  assert.equal(S.announcementFor({ accepted: false, events: [] }, r.state, r.view), null);
  const rec = run(...TO_SWITCH);
  const rs = rec.snaps.find((s) => s.action === A.rec1);
  const recAnn = S.announcementFor(rs.result, rs.state, rs.view, rs.action);
  assert.deepEqual([recAnn.text, /^record-written-\d+$/.test(recAnn.id)], ['第一筆結果已記錄。', true]);
  const rec2 = run(...TO_TRIAL2_DONE);
  const r2 = rec2.snaps.find((s) => s.action === A.rec2);
  assert.equal(S.announcementFor(r2.result, r2.state, r2.view, r2.action).text, '第二筆結果已記錄。');
  const hinted = run(A.start, A.begin, A.putBlock, A.out, A.putBlock);
  const h = hinted.last;
  assert.equal(S.announcementFor(h.result, h.state, h.view, h.action).text, '方塊浮起來了，約 60% 在水面下。 看看方塊在水裡的位置。');
  const obs = run(...TO_OBSERVED);
  const stoneStep = obs.last;
  assert.ok(stoneStep.result.events.some((e) => e.type === 'record-written'), 'the engine wrote the third record in the same step');
  const stoneAnn = S.announcementFor(stoneStep.result, stoneStep.state, stoneStep.view, stoneStep.action);
  assert.equal(stoneAnn.text, '小石頭沉到底了。');
  assert.match(stoneAnn.id, /^observation-/);
  const c = run(...TO_COMPARE, A.q('stayMass', 'smaller'));
  const cs = c.last;
  assert.deepEqual(S.announcementFor(cs.result, cs.state, cs.view, cs.action), { id: 'compare-stayMass-smaller', text: '再看看兩次讓方塊停住的質量。' });
  const done = run(...TO_COMPARE, A.q('stayMass', 'larger'), A.q('firstDrop', 'float')).last;
  assert.equal(S.announcementFor(done.result, done.state, done.view, done.action).text, '和你的紀錄一致。 你剛才已經找到一個規律了。換了液體，同一個方塊要改變質量，才能再次停在液體中。');
  const startStep = run(A.start).last;
  assert.equal(S.announcementFor(startStep.result, startStep.state, startStep.view, startStep.action), null, 'a screen change speaks through focus, not the announcer');
});

await test('screens and steps: every phase has a screen, and the step list moves only where it should', () => {
  const expected = {
    welcome: ['welcome', 'mission'], mission: ['bench', 'mission'], 'trial1-test': ['bench', 'experiment'], 'trial1-complete': ['bench', 'experiment'],
    'trial1-recorded': ['bench', 'experiment'], 'trial2-switch-liquid': ['bench', 'experiment'], 'trial2-test': ['bench', 'experiment'],
    'trial2-complete': ['bench', 'experiment'], 'trial2-recorded': ['bench', 'experiment'], compare: ['compare', 'experiment'],
    'trial3-drop': ['bench', 'experiment'], 'trial3-observed': ['bench', 'experiment'], concept: ['concept', 'experiment'],
    notebook: ['later', 'notebook'], 'challenge-1': ['later', 'challenge'], 'challenge-2': ['later', 'challenge'], 'challenge-3': ['later', 'challenge'], complete: ['later', 'challenge'],
  };
  assert.deepEqual(Object.keys(expected), [...PHASES]);
  for (const phase of PHASES) {
    const state = { ...createInitialState(), phase };
    const screen = S.screenFor(state);
    assert.deepEqual([screen.id, S.stepFor(state)], expected[phase], phase);
    assert.equal(screen.stepId, S.stepFor(state));
    assert.match(screen.headingId, /^bg-/);
    assert.ok(screen.focusTargets.length >= 2 && screen.focusTargets.every((t) => typeof t === 'string'));
  }
  const nav = S.stepNavModel(createInitialState());
  assert.deepEqual(nav.steps.map((s) => `${s.number} ${s.label}`), ['01 接任務', '02 動手做', '03 研究手冊', '04 挑戰題']);
  assert.equal(nav.currentStep, 'mission');
});

await test('shapes: data and evidence follow the component contract and hold no theory values', () => {
  const r = run(...TO_OBSERVED);
  const data = S.dataModel(r.state, r.view);
  assert.deepEqual(Object.keys(data).sort(), ['conditions', 'footerSlots']);
  assert.ok(data.conditions.every((c) => Object.keys(c).sort().join() === 'label,state,value' && ['normal', 'locked', 'hidden', 'changed'].includes(c.state)));
  const ev = S.evidenceModel(r.state, r.view);
  assert.deepEqual(Object.keys(ev), ['items']);
  for (const item of ev.items) {
    assert.ok(['id', 'title', 'rows', 'note'].every((k) => k in item || k === 'note'));
    assert.ok(item.rows.every((row) => Object.keys(row).sort().join() === 'label,value'));
  }
  const keys = [...keysDeep(ev)].map((k) => k.toLowerCase());
  assert.ok(!keys.some((k) => /density|relation|outcome|fraction|theory/.test(k)), keys.join());
  assert.ok(!/\d\.\d/.test(strings(ev).join(' ')), 'no density-looking number');
  for (const status of [S.statusModel(r.state, r.view)]) assert.deepEqual(Object.keys(status).sort(), ['icon', 'kind', 'text']);
});

await test('coach: it follows accepted actions only, and a restart starts over', () => {
  const r = run(A.start, A.begin, A.putBlock);
  const before = r.coach;
  const refused = reduce(r.state, A.add);                                                               // the block is in the tank
  assert.equal(refused.accepted, false);
  assert.deepEqual(S.reduceCoach(before, refused, r.state, r.view), before);
  const again = reduce(r.state, { type: 'RESTART' });
  assert.equal(S.reduceCoach(before, again, again.state, deriveView(again.state)).main, S.MESSAGES.welcome.main);
  assert.equal(S.reduceCoach(null, null, createInitialState(), deriveView(createInitialState())).key, 'welcome');
  for (const message of Object.values(S.MESSAGES)) assert.ok(message.main.length > 0);
  assert.ok(Object.isFrozen(S.MESSAGES) && Object.isFrozen(S.TEXT) && Object.isFrozen(S.LABELS));
});

await test('control messages: the two things the bench says when a move cannot happen', () => {
  assert.equal(S.invalidDropMessage('outside-tank'), '要放進水槽裡才有結果。');
  assert.equal(S.invalidDropMessage('locked'), '');
  assert.equal(S.blockedMessage('add-ballast'), '先把方塊拿出來，再調整配重。');
  assert.equal(S.blockedMessage('remove-ballast'), '先把方塊拿出來，再調整配重。');
  assert.equal(S.blockedMessage('take-out'), '');
  assert.equal(S.massLabel(80), '質量 80 g');
});

// ---- cards.js, drawn into a page --------------------------------------------------------------------------------------
function page() {
  const dom = new JSDOM(read('../tools/science/buoyancy-guided.html'), { pretendToBeVisual: true });
  globalThis.document = dom.window.document;
  return dom;
}

await test('cards: the step list is an <ol> that marks the current step; nothing in it is a button', () => {
  const dom = page();
  const ol = dom.window.document.getElementById('bg-steps');
  assert.equal(ol.tagName, 'OL');
  cards.renderSteps(ol, S.stepNavModel({ ...createInitialState(), phase: 'trial1-test' }));
  assert.equal(ol.children.length, 4);
  assert.deepEqual([...ol.children].map((li) => li.getAttribute('aria-current')), [null, 'step', null, null]);
  assert.equal(ol.querySelectorAll('button, a, [tabindex]').length, 0);
  assert.ok(ol.children[0].classList.contains('is-done'));
});

await test('cards: compare is drawn from the model, updated in place, and locks what is settled', () => {
  const dom = page();
  const doc = dom.window.document;
  const root = doc.getElementById('bg-compare');
  const answers = [];
  const r = run(...TO_COMPARE);
  const draw = () => cards.renderCompare(root, S.compareModel(r.state, deriveView(r.state)), S.TEXT, (q, a) => answers.push([q, a]));
  draw();
  const radios = [...root.querySelectorAll('input[type=radio][data-bg-compare]')];
  assert.equal(radios.length, 6);
  assert.equal(root.querySelectorAll('table').length, 1);
  assert.equal(root.querySelector('tbody tr:first-child th').textContent, '液體（改變的）');
  radios[1].checked = true;
  radios[1].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.deepEqual(answers, [['stayMass', 'smaller']]);
  r.do(A.q('stayMass', 'smaller'));
  draw();
  assert.equal(root.querySelector('[data-bg-feedback="stayMass"]').hidden, false);
  assert.equal(root.querySelector('[data-bg-feedback="stayMass"]').textContent, '再看看兩次讓方塊停住的質量。');
  assert.deepEqual(root.querySelectorAll('input[data-bg-compare]').length, 6);
  r.do(A.q('stayMass', 'larger'));
  draw();
  const after = [...root.querySelectorAll('input[type=radio][data-bg-compare]')];
  assert.ok(after.every((el, i) => el === radios[i]), 'the same controls, so focus is never lost to a rebuild');
  assert.deepEqual(after.map((el) => el.disabled), [true, true, true, false, false, false]);
  assert.equal(after[0].checked, true);
  assert.equal(root.querySelector('[data-bg-feedback="stayMass"]').dataset.kind, 'success');
  assert.equal(root.querySelectorAll('[aria-live]').length, 0);
});

await test('cards: concept, evidence, data, status and coach draw without a live region', () => {
  const dom = page();
  const doc = dom.window.document;
  const r = run(...TO_CONCEPT);
  cards.renderConcept(doc.getElementById('bg-concept'), S.conceptModel(r.state, r.view));
  const concept = doc.getElementById('bg-concept');
  assert.equal(concept.querySelectorAll('[data-bg-concept-card]').length, 2);
  assert.equal(concept.querySelector('[data-bg-formula] .bg-formula').textContent, 'ρ = m ÷ V');
  assert.equal(concept.querySelectorAll('[data-bg-formula] li[data-found="true"]').length, 4);
  cards.renderEvidence(doc.getElementById('bg-evidence'), S.evidenceModel(r.state, r.view), S.TEXT.evidenceTitle);
  assert.equal(doc.querySelectorAll('[data-bg-evidence-item]').length, 4);
  assert.equal(doc.getElementById('bg-evidence').hidden, false);
  cards.renderEvidence(doc.getElementById('bg-evidence'), { items: [] }, 'x');
  assert.equal(doc.getElementById('bg-evidence').hidden, true);
  const t1 = run(A.start, A.begin);
  cards.renderData(doc.getElementById('bg-data'), S.dataModel(t1.state, t1.view), S.TEXT.dataTitle, S.TEXT.dataStates);
  assert.equal(doc.querySelectorAll('#bg-data dt').length, 3);
  cards.renderStatus(doc.getElementById('bg-status'), S.statusModel(t1.state, t1.view));
  assert.equal(doc.getElementById('bg-status').hidden, false);
  cards.renderStatus(doc.getElementById('bg-status'), null);
  assert.equal(doc.getElementById('bg-status').hidden, true);
  cards.renderCoach({ root: doc.getElementById('bg-coach'), name: doc.getElementById('bg-coach-name'), main: doc.getElementById('bg-coach-main'), sub: doc.getElementById('bg-coach-sub'), tip: doc.getElementById('bg-coach-tip') }, t1.coach, '提示');
  assert.equal(doc.getElementById('bg-coach-tip').hidden, false);
  assert.equal(doc.getElementById('bg-coach-name').textContent, '余老師');
  const live = [...doc.querySelectorAll('[aria-live], [role=status], [role=alert], output')];
  assert.deepEqual(live.map((e) => e.id), ['bg-announcer'], 'the announcer is the only live region the page has');
  assert.equal(doc.getElementById('bg-announcer').getAttribute('aria-atomic'), 'true');
  assert.equal(doc.getElementById('bg-announcer').getAttribute('aria-live'), 'polite');
});

await test('static guards: cards.js and main.js hold no wording; neither reaches storage, a debug hook or the model', () => {
  const strip = (rel) => codeOnly(read(rel));
  for (const rel of ['../assets/buoyancy-guided/cards.js', '../assets/buoyancy-guided/main.js']) {
    const code = strip(rel);
    const raw = read(rel).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/[㐀-鿿]/.test(raw.replace(/（|）/g, '')), `${rel} holds learner wording`);
    assert.ok(!/localStorage|sessionStorage|indexedDB|gtag|dataLayer|__buoyancyGuided|\?debug|location\.search/.test(code), rel);
    assert.ok(!/model\.js|blockOutcome|objectOutcome|outcomeIn|\bdensity\b/.test(code), rel);
  }
  const main = strip('../assets/buoyancy-guided/main.js');
  assert.ok(!/window\.__/.test(main), 'main.js ships no test hook');
  assert.ok(!/immersionPercent|immersionFraction|massG|volumeCm3/.test(main.replace(/view\.facts\.currentBlock\.massG/g, '')), 'main.js reads no facts but the mass readout');
});

console.log(`\nbuoyancy-guided script: ${tests} tests passed`);
