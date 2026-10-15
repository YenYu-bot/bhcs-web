// B3/B4 gate: teaching script and view-models of the guided acid–base lab (Pilot #4). Pure, no DOM.
// Every model is built from real engine states; the pre-concept leakage check walks every model a learner can meet
// in each phase before the concept (not the script source, where the concept words legitimately live).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createInitialState, reduce } from '../assets/acid-base-guided/engine.js';
import { SAMPLE_IDS, samplePh10, sampleKind } from '../assets/acid-base-guided/model.js';
import * as S from '../assets/acid-base-guided/script.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = fileURLToPath(new URL('..', import.meta.url));
const FORBIDDEN = /酸|鹼|中性|pH|小於\s*7|等於\s*7|大於\s*7|<\s*7|=\s*7|>\s*7/;
const BLUE = 'blue-litmus', RED = 'red-litmus';

const dip = (sampleId, indicatorId) => ({ type: 'DIP', sampleId, indicatorId });
const ans = (compare, question, answer) => ({ type: 'ANSWER_COMPARE', compare, question, answer });
const CONT = { type: 'CONTINUE' };
const save = (fields) => ({ type: 'SAVE_CONCLUSION', fields });
const pick = (id, step, choice) => ({ type: 'ANSWER_CHALLENGE', id, step, choice });
const RIGHT_A = { level: 'A', acidicSample: 'B', neutralSample: 'C', basicSample: 'A' };
/** Runs actions, collecting every accepted result with the action that made it (for the announcements). */
function play(actions, state = createInitialState()) {
  const log = [];
  for (const action of actions) {
    const result = reduce(state, action);
    assert.equal(result.accepted, true, `${JSON.stringify(action)} refused in ${state.phase}: ${result.reason}`);
    state = result.state;
    log.push({ result, state, action });
  }
  return { state, log };
}
const TO_TRIAL1 = [{ type: 'START' }, { type: 'BEGIN' }];
const TRIAL1 = SAMPLE_IDS.map((id) => dip(id, BLUE));
const C1 = [ans('c1', 'patternCount', 'two'), ans('c1', 'evidenceSufficiency', 'need-more-evidence')];
const TRIAL2 = SAMPLE_IDS.map((id) => dip(id, RED));
const C2 = [ans('c2', 'distinguishability', 'all-distinct'), ans('c2', 'unchangedSample', 'C')];
const at = {
  welcome: () => createInitialState(),
  mission: () => play([{ type: 'START' }]).state,
  trial1: () => play(TO_TRIAL1).state,
  trial1Done: () => play([...TO_TRIAL1, ...TRIAL1]).state,
  compare1: () => play([...TO_TRIAL1, ...TRIAL1, CONT]).state,
  trial2: () => play([...TO_TRIAL1, ...TRIAL1, CONT, ...C1, CONT]).state,
  compare2: () => play([...TO_TRIAL1, ...TRIAL1, CONT, ...C1, CONT, ...TRIAL2, CONT]).state,
  naming: () => play([...TO_TRIAL1, ...TRIAL1, CONT, ...C1, CONT, ...TRIAL2, CONT, ...C2, CONT]).state,
  ph: () => play([...TO_TRIAL1, ...TRIAL1, CONT, ...C1, CONT, ...TRIAL2, CONT, ...C2, CONT, { type: 'REVEAL_PH' }]).state,
  notebook: () => play([CONT, save({ level: 'A' })], at.ph()).state,
  'challenge-1': () => play([save(RIGHT_A), CONT], at.notebook()).state,
  'challenge-2': () => play([pick(1, 'c1-class', 'acidic'), CONT], at['challenge-1']()).state,
  'challenge-3': () => play([pick(2, 'c2-enough', 'not-enough'), pick(2, 'c2-next', 'red-litmus'), CONT], at['challenge-2']()).state,
  complete: () => play([pick(3, 'c3-claim', 'cannot-rule-out-basic'), pick(3, 'c3-next', 'litmus-pair'), CONT], at['challenge-3']()).state,
};
/** Every learner-facing model for one state, serialised. */
const allModels = (st) => JSON.stringify({
  title: S.stationTitleFor(st), steps: S.stepNavModel(st), welcome: S.welcomeModel(st), coach: S.coachModel(st), cta: S.ctaFor(st),
  status: S.statusModel(st), data: S.dataModel(st), evidence: S.evidenceModel(st), bench: S.benchModel(st),
  compareTitle: S.compareTitleFor(st), compareHeads: S.compareHeadsFor(st), compare: S.compareModel(st), concept: S.conceptModel(st),
  benchLabel: S.TEXT.benchLabel, prototype: S.TEXT.prototypeNote, privacy: S.TEXT.privacyNote, storage: S.TEXT.storage, restart: S.TEXT.restart,
  notebook: S.notebookModel(st), challenge: S.challengeModel(st), complete: S.completeModel(st),
});

test('welcome asks the core question and nothing else; mission gives the strategy and a safety line, no answer', () => {
  assert.deepEqual(S.welcomeModel(at.welcome()), { title: '三杯看起來一樣的透明液體，你能只靠實驗把它們分成不同類型嗎？', sub: '接下來你會親手測試，自己找出答案。' });
  const m = S.welcomeModel(at.mission());
  assert.equal(m.title, '先不要猜它們是什麼。');
  assert.match(m.sub, /用同一種試紙測三杯，留下每一次看到的結果，再判斷目前的證據夠不夠/);
  assert.match(m.sub, /不可以品嚐/);
  assert.doesNotMatch(JSON.stringify(m), /指示劑|試劑名稱/);
  assert.equal(S.coachModel(at.welcome()), null, 'no coach card on the welcome screen');
  assert.equal(S.stationTitleFor(at.welcome()), '未知液體辨識');
});

test('screens: every phase has a screen with arrival and focus targets; an unknown phase is refused', () => {
  const want = { welcome: 'welcome', mission: 'welcome', trial1: 'bench', compare1: 'compare', trial2: 'bench', compare2: 'compare', naming: 'concept', ph: 'concept',
    notebook: 'notebook', 'challenge-1': 'challenge', 'challenge-2': 'challenge', 'challenge-3': 'challenge', complete: 'complete' };
  for (const [k, id] of Object.entries(want)) {
    const s = S.screenFor(at[k]());
    assert.equal(s.id, id, k); assert.ok(s.arrival.length > 0 && s.focusTargets.length > 0, k);
  }
  assert.deepEqual(S.screenFor(at.trial1()).arrival, ['[data-dip-sample]'], 'trial arrival is the first usable sample button');
  assert.deepEqual(S.screenFor(at.notebook()).arrival, ['#abg-notebook-title']);
  assert.deepEqual(S.screenFor(at.notebook()).focusTargets, ['input[data-level]', '#abg-cta', '#abg-notebook-title']);
  assert.deepEqual(S.screenFor(at['challenge-2']()).arrival, ['#abg-challenge-title']);
  assert.deepEqual(S.screenFor(at.complete()).arrival, ['#abg-complete-title']);
  for (const p of ['challenge-4', 'finished', '']) assert.throws(() => S.screenFor({ ...createInitialState(), phase: p }), RangeError);
});

test('step nav: five steps, no sixth; concept → findings, notebook → notebook, challenges and the finish → challenge', () => {
  assert.deepEqual(S.STEPS.map((s) => `${s.number} ${s.label}`), ['01 接任務', '02 動手做', '03 整理發現', '04 研究手冊', '05 挑戰題']);
  assert.equal(S.stepFor(at.mission()), 'mission'); assert.equal(S.stepFor(at.compare2()), 'experiment'); assert.equal(S.stepFor(at.ph()), 'findings');
  assert.equal(S.stepFor(at.notebook()), 'notebook');
  for (const k of ['challenge-1', 'challenge-2', 'challenge-3', 'complete']) assert.equal(S.stepFor(at[k]()), 'challenge', k);
  assert.doesNotMatch(JSON.stringify(S.STEPS), FORBIDDEN);
});

test('CTA: label, action and gate for every phase; no button on the finish', () => {
  const c = (st) => S.ctaFor(st) && { label: S.ctaFor(st).label, type: S.ctaFor(st).action.type, enabled: S.ctaFor(st).enabled };
  assert.deepEqual(c(at.welcome()), { label: '開始', type: 'START', enabled: true });
  assert.deepEqual(c(at.mission()), { label: '開始第一輪', type: 'BEGIN', enabled: true });
  assert.deepEqual(c(at.trial1()), { label: '比較這一輪', type: 'CONTINUE', enabled: false });
  assert.deepEqual(c(play([...TO_TRIAL1, dip('A', BLUE), dip('B', BLUE)]).state), { label: '比較這一輪', type: 'CONTINUE', enabled: false });
  assert.deepEqual(c(at.trial1Done()), { label: '比較這一輪', type: 'CONTINUE', enabled: true });
  assert.deepEqual(c(at.compare1()), { label: '換另一種試紙', type: 'CONTINUE', enabled: false });
  assert.deepEqual(c(play(C1, at.compare1()).state), { label: '換另一種試紙', type: 'CONTINUE', enabled: true });
  assert.deepEqual(c(play([ans('c1', 'patternCount', 'two'), ans('c1', 'evidenceSufficiency', 'same-class')], at.compare1()).state).enabled, false);
  assert.deepEqual(c(at.trial2()), { label: '比較兩輪結果', type: 'CONTINUE', enabled: false });
  assert.deepEqual(c(at.compare2()), { label: '看看這代表什麼', type: 'CONTINUE', enabled: false });
  assert.deepEqual(c(play(C2, at.compare2()).state), { label: '看看這代表什麼', type: 'CONTINUE', enabled: true });
  assert.deepEqual(c(at.naming()), { label: '看看 pH', type: 'REVEAL_PH', enabled: true });
  assert.deepEqual(c(at.ph()), { label: '寫研究手冊', type: 'CONTINUE', enabled: true });
  assert.deepEqual(c(at.notebook()), { label: '進入挑戰', type: 'CONTINUE', enabled: false });
  assert.deepEqual(c(play([save({ acidicSample: 'A', neutralSample: 'A', basicSample: 'A' })], at.notebook()).state).enabled, false);
  assert.deepEqual(c(play([save(RIGHT_A)], at.notebook()).state), { label: '進入挑戰', type: 'CONTINUE', enabled: true });
  assert.deepEqual(c(at['challenge-1']()), { label: '下一題挑戰', type: 'CONTINUE', enabled: false });
  assert.deepEqual(c(play([pick(1, 'c1-class', 'acidic')], at['challenge-1']()).state), { label: '下一題挑戰', type: 'CONTINUE', enabled: true });
  assert.deepEqual(c(play([pick(2, 'c2-enough', 'not-enough')], at['challenge-2']()).state).enabled, false, 'half a challenge is not solved');
  assert.deepEqual(c(at['challenge-3']()), { label: '完成這一站', type: 'CONTINUE', enabled: false });
  assert.equal(S.ctaFor(at.complete()), null, 'no next button on the finish');
});

test('bench model: blue in Trial 1, red in Trial 2, none elsewhere; tested follows the active strip', () => {
  assert.equal(S.benchModel(at.trial1()).activeIndicatorId, BLUE);
  assert.equal(S.benchModel(at.trial2()).activeIndicatorId, RED);
  for (const k of ['welcome', 'mission', 'compare1', 'compare2', 'naming', 'ph']) assert.equal(S.benchModel(at[k]()), null, k);
  const partial = S.benchModel(play([...TO_TRIAL1, dip('B', BLUE)]).state);
  assert.deepEqual(partial.samples.map((s) => [s.sampleId, s.tested]), [['A', false], ['B', true], ['C', false]]);
  const t2 = S.benchModel(at.trial2());
  assert.ok(t2.samples.every((s) => s.tested === false && s.observations.length === 1 && s.observations[0].indicatorId === BLUE), 'Trial 1 strips carried into Trial 2');
});

test('bench model strips the hidden pH and kind: the renderer gets observations only', () => {
  const json = JSON.stringify(S.benchModel(at.trial2()));
  for (const k of ['ph10', 'kind', 'acidic', 'neutral', 'basic']) assert.ok(!json.includes(k), `bench model carries ${k}`);
  for (const s of S.benchModel(at.trial2()).samples) for (const o of s.observations) assert.deepEqual(Object.keys(o).sort(), ['changed', 'indicatorId', 'result', 'resultColor', 'sampleId', 'startColor']);
});

test('data and evidence are observations from the records, in cup order', () => {
  const st = play([...TO_TRIAL1, dip('B', BLUE), dip('A', BLUE)]).state;
  assert.deepEqual(S.dataModel(st).conditions.map((c) => `${c.label}=${c.value}`), ['試紙=藍色石蕊（原本藍色）', '已測=2／3', '最近結果=液體 A → 維持藍色']);
  assert.deepEqual(S.evidenceModel(st).items.map((i) => [i.id, i.title, i.rows.map((r) => `${r.label}:${r.value}`)]),
    [['A', '液體 A', ['藍色石蕊:維持藍色']], ['B', '液體 B', ['藍色石蕊:變紅色']]]);
  assert.equal(S.dataModel(at.compare1()), null, 'data only beside the bench');
  const both = S.evidenceModel(at.compare2());
  assert.equal(both.items.length, 3);
  assert.ok(both.items.every((i) => i.rows.length === 2), 'two strips per cup, at most three items');
  assert.equal(S.evidenceModel(at.mission()), null);
});

test('status: latest result while testing, done when the trial is complete, the stage note on the pH part', () => {
  assert.equal(S.statusModel(at.trial1()).text, '還沒有測任何一杯');
  assert.equal(S.statusModel(play([...TO_TRIAL1, dip('B', BLUE)]).state).text, '液體 B：藍色石蕊變紅色');
  assert.deepEqual(S.statusModel(at.trial1Done()), { kind: 'success', icon: '✓', text: '三杯都測完了，可以比較結果' });
  assert.equal(S.statusModel(at.compare1()), null);
  assert.equal(S.statusModel(at.naming()), null);
  assert.equal(S.statusModel(at.ph()).text, '這一階段的觀察與整理已完成。');
  assert.doesNotMatch(S.statusModel(at.ph()).text, /整個實驗完成/);
});

test('compare 1: each cup before / after, the strip and procedure held, the two questions with their semantic values', () => {
  const m = S.compareModel(at.compare1());
  assert.equal(m.independentVariable, undefined, 'no grouping is done for the learner');
  assert.deepEqual(m.controlledVariables, [{ label: '試紙', value: '都用藍色石蕊' }, { label: '做法', value: '每杯都換一張新試紙' }]);
  assert.deepEqual(m.observedResponse.map((r) => [r.label, r.first, r.second]), [['液體 A', '藍色', '維持藍色'], ['液體 B', '藍色', '變紅色'], ['液體 C', '藍色', '維持藍色']]);
  assert.deepEqual(m.questions.map((q) => [q.id, q.options.map((o) => o.value)]), [['patternCount', ['one', 'two', 'three']], ['evidenceSufficiency', ['same-class', 'need-more-evidence', 'different-class']]]);
  assert.equal(m.questions[1].text, '只看這一次試紙結果，能確定結果相同的兩杯屬於同一類嗎？');
  assert.doesNotMatch(JSON.stringify(m), /同一種液體/);
  assert.deepEqual(S.compareHeadsFor(at.compare1()), { item: '液體', first: '測試前', second: '測試後', changed: '改變', same: '不變' });
});

test('compare 1 feedback: wrong answers get a nudge, never the answer; right answers confirm the observation', () => {
  const wrong = S.compareModel(play([ans('c1', 'patternCount', 'three'), ans('c1', 'evidenceSufficiency', 'same-class')], at.compare1()).state);
  assert.deepEqual(wrong.questions.map((q) => q.feedback), [
    { kind: 'hint', text: '把三杯的實際結果排在一起，數一數出現了幾種不同結果。' },
    { kind: 'hint', text: '兩杯得到相同結果，只代表這張試紙目前沒有把它們分開。' },
  ]);
  assert.ok(wrong.questions.every((q) => q.disabled === false));
  const right = S.compareModel(play(C1, at.compare1()).state);
  assert.ok(right.questions.every((q) => q.feedback.kind === 'success' && q.disabled === true));
});

test('compare 2: a 3 × 2 matrix from the records; the unchanged cup is not written into the script', () => {
  const m = S.compareModel(at.compare2());
  assert.deepEqual(m.independentVariable, { label: '試紙', from: '藍色石蕊', to: '紅色石蕊' });
  assert.deepEqual(m.observedResponse.map((r) => [r.label, r.first, r.second]), [['液體 A', '維持藍色', '變藍色'], ['液體 B', '變紅色', '維持紅色'], ['液體 C', '維持藍色', '維持紅色']]);
  assert.deepEqual(m.questions.map((q) => [q.id, q.options.map((o) => o.value)]), [['distinguishability', ['all-distinct', 'two-still-same', 'all-same']], ['unchangedSample', ['A', 'B', 'C']]]);
  const wrong = S.compareModel(play([ans('c2', 'distinguishability', 'two-still-same'), ans('c2', 'unchangedSample', 'A')], at.compare2()).state);
  assert.deepEqual(wrong.questions.map((q) => q.feedback.text), ['把每杯的兩個結果當成一組，再比較 A、B、C 三組。', '找一杯在兩輪中都沒有讓試紙換成另一種顏色。']);
  const src = fs.readFileSync(`${root}assets/acid-base-guided/script.js`, 'utf8');
  assert.doesNotMatch(src, /unchangedSample[^\n]*['"]C['"]/, 'the script never names the unchanged cup');
  assert.doesNotMatch(src, /(acidic|neutral|basic)\s*:\s*['"][ABC]['"]/, 'the script never maps a class to a cup');
});

test('concept: null before the concept phase; naming has the three formal names with the learner\'s own cups, and no pH', () => {
  for (const k of ['welcome', 'mission', 'trial1', 'compare1', 'trial2', 'compare2']) assert.equal(S.conceptModel(at[k]()), null, k);
  const m = S.conceptModel(at.naming());
  assert.deepEqual(m.cards.map((c) => c.id), ['acidic', 'neutral', 'basic', 'samples']);
  assert.deepEqual(m.cards.slice(0, 3).map((c) => c.title), ['酸性', '中性', '鹼性']);
  for (const card of m.cards.slice(0, 3)) {
    const cup = SAMPLE_IDS.find((id) => sampleKind(0, id) === card.id);
    assert.deepEqual(card.evidence.map((e) => e.label), [`你的液體 ${cup}`], `${card.id} carries cup ${cup}, found from the layout`);
  }
  assert.equal(m.cards.find((c) => c.id === 'acidic').evidence[0].text, '藍色石蕊變紅色、紅色石蕊維持紅色');
  assert.equal(m.cards.find((c) => c.id === 'neutral').evidence[0].text, '藍色石蕊維持藍色、紅色石蕊維持紅色');
  assert.equal(m.cards.find((c) => c.id === 'basic').evidence[0].text, '藍色石蕊維持藍色、紅色石蕊變藍色');
  assert.doesNotMatch(JSON.stringify(m), /pH/, 'no pH in the naming part');
  assert.match(m.cards.find((c) => c.id === 'samples').body.join(''), /真實石蕊有一段逐漸變色的範圍/);
});

test('pH part: the 25 °C classification, the line kept apart from litmus, every cup\'s pH from the model, indicators are not pH meters', () => {
  const m = S.conceptModel(at.ph());
  assert.deepEqual(m.cards.map((c) => c.id), ['acidic', 'neutral', 'basic', 'samples', 'ph', 'indicator']);
  const ph = m.cards.find((c) => c.id === 'ph');
  assert.match(ph.body.join(''), /在 25°C 的教學分類中：pH 小於 7 為酸性，pH 等於 7 為中性，pH 大於 7 為鹼性。/);
  assert.match(ph.body.join(''), /pH 7 是本站在 25°C 下用來整理酸性、中性、鹼性的分類界線；這不代表真實石蕊只在 pH 7 才變色。/);
  assert.deepEqual(ph.evidence.map((e) => [e.label, e.text]), SAMPLE_IDS.map((id) => [`液體 ${id}`, `pH ${samplePh10(0, id) / 10}（${{ acidic: '酸性', neutral: '中性', basic: '鹼性' }[sampleKind(0, id)]}）`]));
  const ind = m.cards.find((c) => c.id === 'indicator').body.join('');
  assert.match(ind, /不同指示劑有不同的變色範圍。看到顏色只能提供有限的範圍資訊，不能直接當成精密 pH 讀值。/);
  assert.match(ind, /酚酞在部分弱鹼性的範圍仍可能保持無色/);
  const all = JSON.stringify(S.CONCEPT_TEXT) + JSON.stringify(m);
  assert.doesNotMatch(all, /酚酞無色[^，。]*(代表|表示|就是|一定)/, 'colourless phenolphthalein never stands for "acidic or neutral"');
  assert.doesNotMatch(all, /石蕊[^。]*在 ?pH ?7 ?(變色|切換|換色)(?!。)/, 'litmus is never said to switch at pH 7');
  assert.doesNotMatch(all, /紫甘藍/);
  const src = fs.readFileSync(`${root}assets/acid-base-guided/script.js`, 'utf8');
  assert.doesNotMatch(src, /pH (3|7|11)（/, 'the cup pH values are not written into the script');
});

test('pre-concept leakage: no model a learner can meet before the concept names a class or pH', () => {
  const states = [at.welcome(), at.mission(), at.trial1(), play([...TO_TRIAL1, dip('B', BLUE)]).state, at.trial1Done(), at.compare1(),
    play([ans('c1', 'patternCount', 'three'), ans('c1', 'evidenceSufficiency', 'same-class')], at.compare1()).state, play(C1, at.compare1()).state,
    at.trial2(), play([dip('A', RED)], at.trial2()).state, at.compare2(),
    play([ans('c2', 'distinguishability', 'all-same'), ans('c2', 'unchangedSample', 'B')], at.compare2()).state, play(C2, at.compare2()).state];
  for (const st of states) {
    assert.ok(S.isPreConcept(st));
    const json = allModels(st);
    assert.doesNotMatch(json, FORBIDDEN, `${st.phase}: ${json.match(FORBIDDEN)?.[0]}`);
  }
  // the static pre-concept text tables too
  assert.doesNotMatch(JSON.stringify(S.TEXT), FORBIDDEN);
  // and the concept does open them up
  assert.match(allModels(at.naming()), /酸性/);
  assert.match(allModels(at.ph()), /pH/);
});

test('announcements: records, arrivals, compare feedback and the pH reveal; nothing named before the concept', () => {
  const { log } = play([...TO_TRIAL1, ...TRIAL1, CONT, ans('c1', 'patternCount', 'three'), ...C1, CONT, ...TRIAL2, CONT, ...C2, CONT, { type: 'REVEAL_PH' }]);
  const said = log.map(({ result, state, action }, i) => ({ phase: state.phase, a: S.announcementFor({ result, state, action, seq: i }) }));
  const texts = said.map((x) => x.a?.text ?? null);
  assert.equal(texts[0], null, 'START says nothing');
  assert.equal(texts[1], '已進入第一輪：藍色石蕊。');
  assert.equal(texts[2], '液體 A：藍色石蕊維持藍色。');
  assert.equal(texts[4], '液體 C：藍色石蕊維持藍色。 三杯都測完了，可以比較結果。');
  assert.equal(texts[5], '比較結果。');
  assert.equal(texts[6], '把三杯的實際結果排在一起，數一數出現了幾種不同結果。');
  assert.equal(texts[8], '對，結果相同只代表這張試紙還沒有把它們分開。 兩題都完成了。');
  assert.equal(texts[9], '已進入第二輪：紅色石蕊。');
  assert.equal(texts.at(-2), '概念整理：三種反應模式的正式名稱。');
  assert.equal(texts.at(-1), '已顯示 pH。');
  for (const x of said.filter((s) => s.phase !== 'concept')) assert.doesNotMatch(x.a?.text ?? '', FORBIDDEN);
  const ids = said.map((x) => x.a?.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, 'every announcement has its own id');
  assert.equal(S.announcementFor({ result: { accepted: false }, state: at.trial1() }), null);
});

// ---- B4: notebook, challenges, finish ---------------------------------------------------------------------------------

test('notebook: the learner\'s six results as a table with no class name; three levels; Level A stems over A/B/C', () => {
  assert.equal(S.notebookModel(at.ph()), null, 'no notebook before the notebook phase');
  const m = S.notebookModel(at.notebook());
  assert.equal(m.heading, '我的研究手冊');
  assert.deepEqual(m.evidenceSummary.observedResponse, [
    { label: '液體 A', first: '維持藍色', second: '變藍色' },
    { label: '液體 B', first: '變紅色', second: '維持紅色' },
    { label: '液體 C', first: '維持藍色', second: '維持紅色' },
  ]);
  assert.doesNotMatch(JSON.stringify(m.evidenceSummary), /酸|鹼|中性|pH/, 'the evidence table names no class');
  assert.deepEqual(S.notebookHeads(), { item: '液體', first: '藍色石蕊', second: '紅色石蕊', changed: '改變', same: '不變' });
  assert.deepEqual(m.levels.map((l) => l.id), ['A', 'B', 'C']);
  assert.equal(m.selectedLevel, 'A');
  assert.deepEqual(m.levelA.stems.map((x) => [x.id, x.legend]), [
    ['acidicSample', '哪一杯符合酸性的反應模式？'], ['neutralSample', '哪一杯符合中性的反應模式？'], ['basicSample', '哪一杯符合鹼性的反應模式？'],
  ]);
  for (const stem of m.levelA.stems) {
    assert.deepEqual(stem.options, [{ value: 'A', label: '液體 A' }, { value: 'B', label: '液體 B' }, { value: 'C', label: '液體 C' }]);
    assert.equal(stem.selectedValue, null);
  }
  assert.equal(m.levelA.nudge, null); assert.equal(m.readyNote, null); assert.equal(m.ready, false);
});

test('notebook Level A: a nudge only once all three are chosen and wrong; the ready note when they match the records', () => {
  const partial = S.notebookModel(play([save({ acidicSample: 'A', neutralSample: 'C' })], at.notebook()).state);
  assert.equal(partial.levelA.nudge, null, 'no nudge while a choice is still missing');
  const wrong = S.notebookModel(play([save({ acidicSample: 'A', neutralSample: 'C', basicSample: 'B' })], at.notebook()).state);
  assert.equal(wrong.levelA.nudge, '再對照兩張試紙的結果組合，不要只看其中一張。');
  assert.equal(wrong.ready, false); assert.equal(wrong.readyNote, null);
  assert.deepEqual(wrong.levelA.stems.map((x) => x.selectedValue), ['A', 'C', 'B']);
  const right = S.notebookModel(play([save(RIGHT_A)], at.notebook()).state);
  assert.equal(right.levelA.nudge, null);
  assert.equal(right.readyNote, '這份整理和你的六次測試紀錄一致。');
  // the nudge never names the answer
  assert.doesNotMatch(wrong.levelA.nudge, /液體 [ABC]|[ABC] 杯/);
});

test('notebook Levels B and C: prompts, placeholder, help, and the ideas only after a limitation is written', () => {
  const b = S.notebookModel(play([save({ level: 'B', freeText: '我發現' })], at.notebook()).state);
  assert.equal(b.levelB.prompt, '用自己的話說：為什麼只用一種試紙還不夠，而兩種試紙一起比較後比較能把這三杯分開？');
  assert.equal(b.levelB.placeholder, '我發現第一種試紙……');
  assert.equal(b.levelB.value, '我發現');
  const c0 = S.notebookModel(play([save({ level: 'C' })], at.notebook()).state);
  assert.equal(c0.levelC.q1.label, '選一杯，用兩次試紙的結果當證據，說明你怎麼判斷它屬於哪一類。');
  assert.equal(c0.levelC.q2.label, '這個實驗不能直接告訴你什麼？寫下一個限制。');
  assert.equal(c0.levelC.help, '例如想想：指示劑顏色能不能直接當成精密的 pH 數值？');
  assert.equal(c0.levelC.showIdeas, false);
  assert.equal(c0.levelC.ideas.length, 5);
  assert.doesNotMatch(JSON.stringify(c0.levelC.ideas), /紫甘藍/);
  assert.match(c0.levelC.ideas.join(), /範圍/); assert.match(c0.levelC.ideas.join(), /酚酞/); assert.match(c0.levelC.ideas.join(), /精密/);
  assert.equal(S.notebookModel(play([save({ level: 'C', limitationText: '  不 ' })], at.notebook()).state).levelC.showIdeas, false);
  assert.equal(S.notebookModel(play([save({ level: 'C', limitationText: '不是精密讀值' })], at.notebook()).state).levelC.showIdeas, true);
  assert.equal(S.notebookModel(play([save({ level: 'C', evidenceText: '液體B兩張都紅', limitationText: '不是精密讀值' })], at.notebook()).state).ready, true);
});

test('challenge wording: scenarios, questions and option labels; the correct option is never first', () => {
  const m1 = S.challengeModel(at['challenge-1']());
  assert.equal(m1.title, '挑戰 1／3：一杯新的液體');
  assert.equal(m1.scenario, '未知液體 X：藍色石蕊變紅色，紅色石蕊維持紅色。');
  assert.equal(m1.steps[0].question, '最合理的分類是？');
  assert.deepEqual(m1.steps[0].options.map((o) => o.label), ['中性', '酸性', '目前證據仍不足', '鹼性']);
  const m2 = S.challengeModel(at['challenge-2']());
  assert.equal(m2.scenario, '未知液體 Y 只做了一次測試：藍色石蕊維持藍色。');
  assert.deepEqual(m2.steps.map((x) => [x.question, x.unlocked]), [['現在能確定它是哪一類嗎？', true], ['下一步最能直接補足這個分類問題的是？', false]]);
  assert.deepEqual(m2.steps[1].options.map((o) => o.label), ['再重複一次藍色石蕊', '再用紅色石蕊測試', '看它是不是透明', '直接猜一類']);
  const m3 = S.challengeModel(at['challenge-3']());
  assert.equal(m3.scenario, '未知液體 Z 加入酚酞後仍然無色。有人說：「所以它一定不是鹼性。」');
  assert.deepEqual(m3.steps.map((x) => x.question), ['這個結論合理嗎？', '如果仍要判斷它屬於哪一類，下一步比較合理的是？']);
  assert.deepEqual(m3.steps[0].options.map((o) => o.label), ['一定不是鹼性', '還不能排除鹼性', '一定是酸性', '一定是中性']);
  assert.deepEqual(m3.steps[1].options.map((o) => o.label), ['品嚐看看', '只看原本液體的顏色', '再用紅、藍石蕊取得另一組證據', '不需要再測']);
  assert.equal(m3.note, undefined, 'no note before Challenge 3 is solved');
  for (const m of [m1, m2, m3]) assert.ok(!JSON.stringify(m).includes('"correct":true'));
  assert.equal(S.challengeModel(at.notebook()), null);
});

test('challenge feedback: nothing first, then the generic nudge, then from the second try the step\'s hint, and success once solved', () => {
  let st = at['challenge-1']();
  assert.equal(S.challengeModel(st).steps[0].feedback, null);
  st = play([pick(1, 'c1-class', 'neutral')], st).state;
  assert.deepEqual(S.challengeModel(st).steps[0].feedback, { kind: 'nudge', text: '把兩張試紙的結果當成一組，對照你剛才整理的三種模式。' });
  st = play([pick(1, 'c1-class', 'basic')], st).state;
  assert.deepEqual(S.challengeModel(st).steps[0].feedback, { kind: 'hint', text: '哪一類會讓藍色石蕊變紅，而紅色石蕊仍維持紅色？' });
  st = play([pick(1, 'c1-class', 'acidic')], st).state;
  const solved = S.challengeModel(st).steps[0];
  assert.equal(solved.feedback.kind, 'success'); assert.equal(solved.correct, true); assert.equal(solved.attempts, 3);
  // Challenge 2 and 3 hints and the phenolphthalein success
  let c2 = play([pick(2, 'c2-enough', 'acidic'), pick(2, 'c2-enough', 'basic')], at['challenge-2']()).state;
  assert.equal(S.challengeModel(c2).steps[0].feedback.text, '在你自己的第一輪裡，不只一杯會讓藍色石蕊維持藍色。');
  c2 = play([pick(2, 'c2-enough', 'not-enough'), pick(2, 'c2-next', 'guess'), pick(2, 'c2-next', 'look-clear')], c2).state;
  assert.equal(S.challengeModel(c2).steps[1].feedback.text, '你缺的是另一種反應模式的資訊，不是再得到同一種資訊。');
  const c3 = play([pick(3, 'c3-claim', 'cannot-rule-out-basic')], at['challenge-3']()).state;
  assert.equal(S.challengeModel(c3).steps[0].feedback.text, '對。不同指示劑有自己的變色範圍，酚酞無色不能排除所有鹼性液體。');
  assert.match(S.LATE_TEXT.challenge.items[3].steps['c3-next'].hint, /不可以品嚐/);
  // the generic nudge and the hints never quote a correct option label
  for (const item of Object.values(S.LATE_TEXT.challenge.items)) {
    for (const st2 of Object.values(item.steps)) {
      const correctLabel = st2.options.find(([v]) => ['acidic', 'not-enough', 'red-litmus', 'cannot-rule-out-basic', 'litmus-pair'].includes(v))[1];
      assert.ok(!item.generic.includes(correctLabel) && !st2.hint.includes(correctLabel), correctLabel);
    }
  }
});

test('the Challenge 3 note appears once solved, optional, with its label and placeholder', () => {
  const st = play([pick(3, 'c3-claim', 'cannot-rule-out-basic'), pick(3, 'c3-next', 'litmus-pair'), { type: 'SAVE_CHALLENGE_NOTE', id: 3, text: '因為' }], at['challenge-3']()).state;
  assert.deepEqual(S.challengeModel(st).note, { label: '用自己的話說說看：為什麼酚酞無色還不能排除鹼性？（可以不寫）', placeholder: '因為酚酞……', text: '因為' });
  assert.equal(S.challengeModel(at['challenge-1']()).note, undefined);
});

test('complete: heading, three claims, the Level A sentence from the records, or the learner\'s own words; no link', () => {
  assert.equal(S.completeModel(at['challenge-3']()), null);
  const a = S.completeModel(at.complete());
  assert.equal(a.heading, '這一站完成了');
  assert.deepEqual(a.claims, ['我用兩種石蕊比較了三杯未知液體的反應模式。', '我能根據兩次觀察，把代表樣品整理成酸性、中性、鹼性。', '我知道指示劑顏色提供的是範圍線索，不等於精密的 pH 讀值。']);
  const m = { acidic: 'B', neutral: 'C', basic: 'A' };
  for (const [kind, id] of Object.entries(m)) assert.equal(sampleKind(createInitialState().layout, id), kind, 'the expected letters are the layout\'s own');
  assert.deepEqual(a.conclusion, ['我的紀錄中：液體 B 對應酸性，液體 C 對應中性，液體 A 對應鹼性。']);
  assert.ok(!('link' in a));
  const toEnd = [CONT, pick(1, 'c1-class', 'acidic'), CONT, pick(2, 'c2-enough', 'not-enough'), pick(2, 'c2-next', 'red-litmus'), CONT,
    pick(3, 'c3-claim', 'cannot-rule-out-basic'), pick(3, 'c3-next', 'litmus-pair'), CONT];
  const b = play([save({ level: 'B', freeText: '兩種試紙一起看才分得開' }), ...toEnd], at.notebook()).state;
  assert.deepEqual(S.completeModel(b).conclusion, ['我在研究手冊裡寫下：', '兩種試紙一起看才分得開']);
  const c = play([save({ level: 'C', evidenceText: '液體B兩張都紅', limitationText: '不是精密讀值' }), ...toEnd], at.notebook()).state;
  assert.deepEqual(S.completeModel(c).conclusion, ['我在研究手冊裡寫下：', '液體B兩張都紅', '不是精密讀值']);
  const src = fs.readFileSync(`${root}assets/acid-base-guided/script.js`, 'utf8');
  assert.doesNotMatch(src, /acid-base-indicator-lab|自由探索|到完整版/, 'no legacy link wording');
});

test('privacy, storage and restart wording', () => {
  assert.equal(S.TEXT.privacyNote, '研究手冊與作答只儲存在這台瀏覽器。匿名使用事件不包含研究手冊文字、作答內容或學生姓名。');
  assert.deepEqual({ ...S.TEXT.storage }, { saved: '進度已儲存在這台瀏覽器。', restored: '已接續這台瀏覽器先前的進度。', failed: '瀏覽器無法儲存進度；這次仍可繼續操作。' });
  assert.deepEqual({ ...S.TEXT.restart }, { label: '重新開始', confirm: '要清除這一站儲存在本機的進度，從頭開始嗎？' });
  assert.doesNotMatch(S.TEXT.prototypeNote, /不會儲存/, 'the old "nothing is saved" note is gone');
});

test('late announcements: the notebook, each challenge, challenge feedback and the finish; nothing for typing or the note', () => {
  const { log } = play([CONT, save({ level: 'A' }), save(RIGHT_A), save({ freeText: '打字中' }), CONT, pick(1, 'c1-class', 'neutral'), pick(1, 'c1-class', 'acidic'), CONT,
    pick(2, 'c2-enough', 'not-enough'), pick(2, 'c2-next', 'red-litmus'), CONT,
    pick(3, 'c3-claim', 'cannot-rule-out-basic'), pick(3, 'c3-next', 'litmus-pair'), { type: 'SAVE_CHALLENGE_NOTE', id: 3, text: '筆記內容' }, CONT], at.ph());
  const texts = log.map(({ result, state, action }, i) => S.announcementFor({ result, state, action, seq: i })?.text ?? null);
  assert.deepEqual(texts, [
    '研究手冊。', null, null, null, '挑戰 1。',
    '把兩張試紙的結果當成一組，對照你剛才整理的三種模式。', '對。藍色石蕊變紅、紅色石蕊維持紅色，和你紀錄中的酸性反應模式一致。', '挑戰 2。',
    S.LATE_TEXT.challenge.items[2].steps['c2-enough'].success, S.LATE_TEXT.challenge.items[2].steps['c2-next'].success, '挑戰 3。',
    '對。不同指示劑有自己的變色範圍，酚酞無色不能排除所有鹼性液體。', S.LATE_TEXT.challenge.items[3].steps['c3-next'].success, null, '這一站完成了。',
  ]);
  assert.ok(!texts.some((t) => t?.includes('筆記內容') || t?.includes('打字中')));
});

test('the script holds no storage, analytics or network code', () => {
  const src = fs.readFileSync(`${root}assets/acid-base-guided/script.js`, 'utf8');
  for (const w of ['localStorage', 'sessionStorage', 'bhcsScienceTrack', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'document.', 'window.']) assert.ok(!src.includes(w), w);
});

console.log(`acid-base-guided script: ${tests} tests passed`);
