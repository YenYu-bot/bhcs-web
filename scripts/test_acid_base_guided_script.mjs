// B3 gate: teaching script and view-models of the guided acid–base lab (Pilot #4). Pure, no DOM.
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
};
/** Every learner-facing model for one state, serialised. */
const allModels = (st) => JSON.stringify({
  title: S.stationTitleFor(st), steps: S.stepNavModel(st), welcome: S.welcomeModel(st), coach: S.coachModel(st), cta: S.ctaFor(st),
  status: S.statusModel(st), data: S.dataModel(st), evidence: S.evidenceModel(st), bench: S.benchModel(st),
  compareTitle: S.compareTitleFor(st), compareHeads: S.compareHeadsFor(st), compare: S.compareModel(st), concept: S.conceptModel(st),
  benchLabel: S.TEXT.benchLabel, prototype: S.TEXT.prototypeNote,
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

test('screens: every B3 phase has a screen with arrival and focus targets; later phases are refused', () => {
  const want = { welcome: 'welcome', mission: 'welcome', trial1: 'bench', compare1: 'compare', trial2: 'bench', compare2: 'compare', naming: 'concept', ph: 'concept' };
  for (const [k, id] of Object.entries(want)) {
    const s = S.screenFor(at[k]());
    assert.equal(s.id, id, k); assert.ok(s.arrival.length > 0 && s.focusTargets.length > 0, k);
  }
  assert.deepEqual(S.screenFor(at.trial1()).arrival, ['[data-dip-sample]'], 'trial arrival is the first usable sample button');
  for (const p of ['notebook', 'challenge-1', 'complete']) assert.throws(() => S.screenFor({ ...createInitialState(), phase: p }), RangeError);
});

test('step nav: five steps fixed for later stages; B3 reaches step 03; no step name names a class or pH', () => {
  assert.deepEqual(S.STEPS.map((s) => `${s.number} ${s.label}`), ['01 接任務', '02 動手做', '03 整理發現', '04 研究手冊', '05 挑戰題']);
  assert.equal(S.stepFor(at.mission()), 'mission'); assert.equal(S.stepFor(at.compare2()), 'experiment'); assert.equal(S.stepFor(at.ph()), 'findings');
  assert.doesNotMatch(JSON.stringify(S.STEPS), FORBIDDEN);
});

test('CTA: label, action and gate for every phase; nothing after the pH part', () => {
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
  assert.equal(S.ctaFor(at.ph()), null, 'B3 ends on the pH part: no notebook, challenge or finish button');
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

test('B3 holds no notebook, challenge or finish wording, and no storage or analytics', () => {
  const src = fs.readFileSync(`${root}assets/acid-base-guided/script.js`, 'utf8') + fs.readFileSync(`${root}assets/acid-base-guided/main.js`, 'utf8');
  for (const w of ['notebookModel', 'challengeModel', 'completeModel', 'localStorage', 'sessionStorage', 'bhcsScienceTrack', 'fetch(', 'XMLHttpRequest', 'sendBeacon']) assert.ok(!src.includes(w), w);
  const words = JSON.stringify({ T: S.TEXT, C: S.CONCEPT_TEXT });
  for (const w of ['研究手冊', '挑戰', '完成實驗']) assert.ok(!words.includes(w), `${w} in B3 wording`);
  assert.ok(!fs.existsSync(`${root}assets/acid-base-guided/persist.js`) && !fs.existsSync(`${root}assets/acid-base-guided/analytics.js`) && !fs.existsSync(`${root}assets/acid-base-guided/challenges.js`));
});

console.log(`acid-base-guided script: ${tests} tests passed`);
