import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACID_METALS, ACID_CONDITIONS, ELECTRON_STEPS, acidOutcome, freshAcid,
  observeAcid, replaceAcid, connectAcid, hasAcidMetal, useHydrogenReference,
  hasHydrogenChain, restoreAcid,
} from '../../tools/metal-activity-desk/acid.mjs';
import { freshSession } from '../../tools/metal-activity-desk/session.mjs';

const observe = metals => metals.reduce((lesson, metal) => observeAcid(lesson, metal), freshAcid());
const allObserved = () => observe(['Zn', 'Fe', 'Cu']);
const linkedLesson = () => {
  let lesson = allObserved();
  lesson = connectAcid(lesson, 'a1', 'ZnH').lesson;
  lesson = connectAcid(lesson, 'a2', 'FeH').lesson;
  return useHydrogenReference(lesson);
};
const baseEvidence = () => ({ ...freshSession(), records: [
  { id: 'r1', metal: 'Zn', solution: 'FeSO4', kind: 'extra' },
  { id: 'r2', metal: 'Fe', solution: 'CuSO4', kind: 'base' },
  { id: 'r3', metal: 'Cu', solution: 'ZnSO4', kind: 'extra' },
], connections: { ZnFe: 'r1', FeCu: 'r2' }, nextId: 4, lesson: linkedLesson() });

test('acid conditions and all three outcomes use the stated dilute non-oxidizing acid model', () => {
  assert.deepEqual(ACID_METALS, ['Zn', 'Fe', 'Cu']);
  assert.match(ACID_CONDITIONS, /室溫/);
  assert.match(ACID_CONDITIONS, /乾淨金屬/);
  assert.match(ACID_CONDITIONS, /新鮮稀鹽酸（非氧化性酸）/);
  for (const metal of ['Zn', 'Fe']) {
    const result = acidOutcome(metal);
    assert.equal(result.reacts, true);
    assert.equal(result.gas, 'H2');
    assert.equal(result.pair, `${metal}H`);
    assert.equal(result.equation, `${metal} + 2H⁺ → ${metal}²⁺ + H₂`);
    assert.equal(result.observation, '金屬表面出現氣泡。');
    assert.match(result.interpretation, /依已知材料與本課反應模型/);
    assert.match(result.interpretation, /只看氣泡本身不能鑑定氣體/);
  }
  const copper = acidOutcome('Cu');
  assert.equal(copper.reacts, false);
  assert.equal(copper.gas, null);
  assert.equal(copper.pair, null);
  assert.equal(copper.observation, '未見明顯氣泡。');
  assert.match(copper.interpretation, /不能把「沒看見氣泡」單獨當作排序的證明/);
});

test('acid descriptions do not rank zinc versus iron by gas rate or quantity', () => {
  assert.equal(acidOutcome('Zn').observation, acidOutcome('Fe').observation);
  for (const metal of ACID_METALS) {
    const result = acidOutcome(metal);
    assert.doesNotMatch(JSON.stringify(result), /更快|較快|更慢|較慢|較多|更多|較少|更少|Zn\s*[>＞]\s*Fe|Fe\s*[>＞]\s*Zn/);
    for (const key of ['rate', 'speed', 'gasAmount', 'volume', 'duration', 'rank']) assert.equal(result[key], undefined);
  }
});

test('unknown, inherited and coerced metal identifiers cannot create acid outcomes', () => {
  for (const metal of ['Al', 'zn', '', '__proto__', 'constructor', ['Zn'], null, undefined, 1, {}, '<svg>']) {
    assert.equal(acidOutcome(metal), null);
  }
});

test('fresh acid state has independent clean cups, records and links', () => {
  const lesson = freshAcid();
  assert.deepEqual(lesson, { version: 1, open: false, cups: { Zn: null, Fe: null, Cu: null }, records: [], links: {}, nextId: 1, pauseAnimation: false, electronOpen: false, electronStep: 0 });
  const other = freshAcid();
  lesson.cups.Zn = 'a1'; lesson.records.push({ id: 'a1', metal: 'Zn' }); lesson.links.ZnH = 'a1';
  assert.deepEqual(other, freshAcid());
});

test('observations are immutable, retained separately and reject repeated completed cups', () => {
  let lesson = freshAcid();
  for (const [index, metal] of ACID_METALS.entries()) {
    const before = structuredClone(lesson);
    const next = observeAcid(lesson, metal);
    assert.deepEqual(lesson, before);
    assert.notEqual(next.cups, lesson.cups);
    assert.notEqual(next.records, lesson.records);
    assert.deepEqual(next.records.at(-1), { id: `a${index + 1}`, metal });
    assert.equal(next.cups[metal], `a${index + 1}`);
    assert.equal(next.nextId, index + 2);
    assert.equal(observeAcid(next, metal), null);
    lesson = next;
  }
  for (const metal of ACID_METALS) assert.equal(hasAcidMetal(lesson, metal), true);
  assert.equal(lesson.records.length, 3);
  for (const invalid of ['Ag', ['Cu'], null, '__proto__']) assert.equal(observeAcid(lesson, invalid), null);
});

test('replacing one acid cup preserves historical records, links and all other state', () => {
  const lesson = { ...linkedLesson(), open: true, pauseAnimation: true, electronOpen: true, electronStep: 2 };
  for (const metal of ACID_METALS) {
    const before = structuredClone(lesson);
    const replaced = replaceAcid(lesson, metal);
    assert.deepEqual(lesson, before);
    assert.equal(replaced.cups[metal], null);
    assert.equal(replaced.records, lesson.records);
    assert.equal(replaced.links, lesson.links);
    assert.equal(replaced.nextId, lesson.nextId);
    assert.equal(replaced.electronStep, 2);
    assert.equal(replaced.electronOpen, true);
    assert.equal(replaced.pauseAnimation, true);
    for (const other of ACID_METALS.filter(m => m !== metal)) assert.equal(replaced.cups[other], lesson.cups[other]);
    assert.equal(hasAcidMetal(replaced, metal), true, 'retained observations remain usable after replacing the current cup');
    const repeated = observeAcid(replaced, metal);
    assert.equal(repeated.records.length, 4);
    assert.equal(repeated.cups[metal], 'a4');
    assert.deepEqual(repeated.links, lesson.links);
    assert.ok(restoreAcid(repeated));
  }
  for (const invalid of ['Ag', ['Zn'], null, '__proto__']) assert.equal(replaceAcid(lesson, invalid), null);
});

test('acid links accept only the specific positive experiment supporting that pair', () => {
  const lesson = allObserved();
  for (const [id, pair] of [['a1', 'ZnH'], ['a2', 'FeH']]) {
    const result = connectAcid(lesson, id, pair);
    assert.equal(result.ok, true);
    assert.deepEqual(result.lesson.links, { [pair]: id });
    assert.deepEqual(lesson.links, {});
    assert.equal(result.lesson.records, lesson.records);
    assert.equal(connectAcid(result.lesson, id, pair).lesson.links[pair], id);
  }
  assert.equal(connectAcid(lesson, 'a1', 'FeH').reason, 'different-pair');
  assert.equal(connectAcid(lesson, 'a2', 'ZnH').reason, 'different-pair');
  for (const pair of ['ZnH', 'FeH', 'HCu', 'CuH', '__proto__', null]) {
    assert.equal(connectAcid(lesson, 'a3', pair).reason, 'negative-only', 'Cu no-bubble observation never establishes a directional link');
  }
  for (const pair of ['HCu', 'CuH', 'ZnFe', '__proto__', ['ZnH'], null]) assert.equal(connectAcid(lesson, 'a1', pair).ok, false);
  for (const id of ['missing', '__proto__', ['a1'], null, undefined]) assert.equal(connectAcid(lesson, id, 'ZnH').reason, 'missing');
});

test('H/Cu is an explicit supplied reference, not an automatic inference from no bubbles', () => {
  assert.equal(useHydrogenReference(observe(['Zn', 'Fe'])), null);
  const copperOnly = observe(['Cu']);
  assert.deepEqual(copperOnly.links, {});
  assert.equal(connectAcid(copperOnly, 'a1', 'HCu').ok, false);
  const referenced = useHydrogenReference(copperOnly);
  assert.deepEqual(referenced.links, { HCu: 'reference' });
  assert.deepEqual(copperOnly.links, {});
  assert.equal(referenced.records, copperOnly.records);
  assert.deepEqual(useHydrogenReference(referenced), referenced);
  assert.ok(useHydrogenReference(replaceAcid(copperOnly, 'Cu')), 'the explicit reference can use the preserved Cu observation');
});

test('final chain needs all three observations, valid Zn/Fe and Fe/H evidence, and H/Cu reference', () => {
  const state = baseEvidence();
  assert.equal(hasHydrogenChain(state), true);
  const withoutZnH = structuredClone(state); delete withoutZnH.lesson.links.ZnH;
  assert.equal(hasHydrogenChain(withoutZnH), true, 'Zn > Fe > H does not require a redundant Zn > H link');
  for (const metal of ACID_METALS) {
    const missingObservation = structuredClone(state);
    missingObservation.lesson.records = missingObservation.lesson.records.filter(r => r.metal !== metal);
    assert.equal(hasHydrogenChain(missingObservation), false, `missing ${metal} observation`);
  }
  for (const pair of ['FeH', 'HCu']) {
    const missingLink = structuredClone(state); delete missingLink.lesson.links[pair];
    assert.equal(hasHydrogenChain(missingLink), false, `missing ${pair} link`);
  }
  const withoutZnFe = structuredClone(state); delete withoutZnFe.connections.ZnFe;
  assert.equal(hasHydrogenChain(withoutZnFe), false, 'Zn/H and Fe/H alone cannot establish Zn/Fe');
});

test('wrong, stale, negative and coerced chain references do not unlock final order', () => {
  for (const bad of ['r2', 'r3', 'missing', '__proto__', ['r1'], null]) {
    const state = baseEvidence(); state.connections.ZnFe = bad;
    assert.equal(hasHydrogenChain(state), false);
  }
  for (const bad of ['a1', 'a3', 'missing', '__proto__', ['a2'], null]) {
    const state = baseEvidence(); state.lesson.links.FeH = bad;
    assert.equal(hasHydrogenChain(state), false);
  }
  for (const bad of ['a3', true, ['reference'], 'Reference', null]) {
    const state = baseEvidence(); state.lesson.links.HCu = bad;
    assert.equal(hasHydrogenChain(state), false);
  }
  const missingPriorRecord = baseEvidence(); missingPriorRecord.records = [];
  assert.equal(hasHydrogenChain(missingPriorRecord), false);
  const missingLesson = baseEvidence(); missingLesson.lesson = null;
  assert.equal(hasHydrogenChain(missingLesson), false);
});

test('all 64 observation-and-required-link combinations enforce every final-chain prerequisite', () => {
  let checked = 0;
  for (let observations = 0; observations < 8; observations++) for (let links = 0; links < 8; links++) {
    const state = baseEvidence();
    state.lesson.records = state.lesson.records.filter(r => observations & (1 << ACID_METALS.indexOf(r.metal)));
    state.connections.ZnFe = links & 1 ? 'r1' : 'missing';
    state.lesson.links.FeH = links & 2 ? 'a2' : 'missing';
    state.lesson.links.HCu = links & 4 ? 'reference' : 'missing';
    assert.equal(hasHydrogenChain(state), observations === 7 && links === 7, `observations ${observations}, links ${links}`);
    checked++;
  }
  assert.equal(checked, 64);
});

test('new acid trials do not erase an already supported final chain', () => {
  for (const metal of ACID_METALS) {
    const state = baseEvidence();
    state.lesson = replaceAcid(state.lesson, metal);
    assert.equal(hasHydrogenChain(state), true);
    state.lesson = observeAcid(state.lesson, metal);
    assert.equal(hasHydrogenChain(state), true);
    assert.equal(state.lesson.records.length, 4);
  }
});

test('acid record IDs remain unique and restorable after bad or exhausted counters', () => {
  for (const nextId of [0, -1, 1.5, NaN, Infinity, '2', null, 1, 3, 1000000]) {
    const lesson = freshAcid(); lesson.records = [{ id: 'a1', metal: 'Zn' }, { id: 'a3', metal: 'Fe' }]; lesson.nextId = nextId;
    const next = observeAcid(lesson, 'Cu');
    assert.equal(next.cups.Cu, 'a2');
    assert.equal(new Set(next.records.map(r => r.id)).size, 3);
    assert.ok(restoreAcid(next));
    assert.equal(lesson.records.length, 2);
  }
  const high = freshAcid(); high.records = [{ id: 'a999999', metal: 'Zn' }];
  const restored = restoreAcid(high);
  assert.equal(restored.nextId, 1000000);
  const next = observeAcid(restored, 'Cu');
  assert.equal(next.cups.Cu, 'a1');
  assert.ok(restoreAcid(next));
});

test('acid capacity preserves the 1000th observation and blocks overflow without mutation', () => {
  const lesson = freshAcid();
  lesson.records = Array.from({ length: 999 }, (_, i) => ({ id: `a${i + 1}`, metal: 'Zn' })); lesson.nextId = 1000;
  const final = observeAcid(lesson, 'Cu');
  assert.equal(final.cups.Cu, 'a1000');
  assert.equal(final.records.length, 1000);
  assert.equal(lesson.records.length, 999);
  const before = structuredClone(final);
  assert.ok(observeAcid(final, 'Fe') === null);
  assert.deepEqual(final, before);
  assert.ok(restoreAcid(final));
  assert.equal(restoreAcid({ ...final, records: [...final.records, { id: 'a1001', metal: 'Fe' }] }), null);
});

test('acid restore retains valid observations, links and lesson controls', () => {
  const lesson = { ...linkedLesson(), open: true, pauseAnimation: true, electronOpen: true, electronStep: 2 };
  assert.deepEqual(restoreAcid(structuredClone(lesson)), lesson);
  assert.deepEqual(restoreAcid(freshAcid()), freshAcid());
  const replaced = replaceAcid(lesson, 'Fe');
  assert.deepEqual(restoreAcid(replaced), replaced);
});

test('acid restore rejects malformed shapes, invalid identities and duplicate IDs', () => {
  for (const bad of [null, undefined, [], {}, 'bad', { ...freshAcid(), version: 2 }, { ...freshAcid(), records: null }, { ...freshAcid(), cups: null }, { ...freshAcid(), cups: {} }, { ...freshAcid(), cups: [] }]) assert.equal(restoreAcid(bad), null);
  for (const id of ['', 'a0', 'a01', 'a1000000', 'r1', 1, ['a1'], '__proto__', '<svg>']) {
    assert.equal(restoreAcid({ ...freshAcid(), records: [{ id, metal: 'Zn' }] }), null);
  }
  for (const metal of ['', 'Ag', 'zn', ['Zn'], {}, null, '__proto__', '<script>']) {
    assert.equal(restoreAcid({ ...freshAcid(), records: [{ id: 'a1', metal }] }), null);
  }
  assert.equal(restoreAcid({ ...freshAcid(), records: [{ id: 'a1', metal: 'Zn' }, { id: 'a1', metal: 'Fe' }] }), null);
});

test('acid restore validates each cup against a retained record of the same metal', () => {
  for (const metal of ACID_METALS) {
    for (const invalid of [undefined, 'missing', '<img>', [allObserved().cups[metal]], ...ACID_METALS.filter(m => m !== metal).map(m => allObserved().cups[m])]) {
      const lesson = allObserved(); lesson.cups[metal] = invalid;
      assert.equal(restoreAcid(lesson), null, `${metal} cannot attach ${JSON.stringify(invalid)}`);
    }
  }
});

test('acid restore strips unsupported evidence links without inventing hydrogen ordering', () => {
  const lesson = allObserved();
  lesson.links = { ZnH: 'a2', FeH: 'a3', HCu: 'a3', CuH: 'a3', '<script>': 'a1' };
  assert.deepEqual(restoreAcid(lesson).links, {});
  lesson.links = { ZnH: 'a1', FeH: 'a2', HCu: 'reference' };
  assert.deepEqual(restoreAcid(lesson).links, lesson.links);
  const noCopper = observe(['Zn', 'Fe']); noCopper.links.HCu = 'reference';
  assert.deepEqual(restoreAcid(noCopper).links, {});
  for (const links of [null, undefined, false, [], 'bad']) assert.deepEqual(restoreAcid({ ...allObserved(), links }).links, {});
});

test('acid restore normalizes controls and strips untrusted metadata', () => {
  const lesson = linkedLesson();
  lesson.records[0].gas = '<svg onload=alert(1)>';
  lesson.title = '<script>bad()</script>';
  lesson.nextId = 'not-a-number'; lesson.open = 'true'; lesson.pauseAnimation = 1; lesson.electronOpen = {};
  lesson.links = JSON.parse('{"__proto__":{"polluted":true},"ZnH":"a1","FeH":"a2","HCu":"reference"}');
  for (const electronStep of [-1, 3, 0.5, '2', null, NaN, Infinity]) {
    const restored = restoreAcid({ ...lesson, electronStep });
    assert.equal(restored.electronStep, 0);
    assert.equal(restored.nextId, 4);
    assert.equal(restored.title, undefined);
    assert.deepEqual(restored.records[0], { id: 'a1', metal: 'Zn' });
    assert.equal(restored.open, false); assert.equal(restored.pauseAnimation, false); assert.equal(restored.electronOpen, false);
    assert.deepEqual(restored.links, { ZnH: 'a1', FeH: 'a2', HCu: 'reference' });
  }
  assert.equal({}.polluted, undefined);
});

test('electron explanation pairs oxidation/reduction and cancels electrons in the net reaction', () => {
  assert.equal(ELECTRON_STEPS.length, 3);
  for (const step of ELECTRON_STEPS) {
    assert.match(step.oxidation, /2e⁻/);
    assert.match(step.reduction, /2e⁻/);
    assert.ok(step.title && step.text && step.zinc && step.copper);
  }
  for (const step of ELECTRON_STEPS.slice(0, 2)) {
    assert.equal(step.oxidation, 'Zn → Zn²⁺ + 2e⁻');
    assert.equal(step.reduction, 'Cu²⁺ + 2e⁻ → Cu');
  }
  assert.match(ELECTRON_STEPS[1].text, /同時得到/);
  assert.match(ELECTRON_STEPS[1].text, /不是電子先在溶液中存起來/);
  assert.match(ELECTRON_STEPS[2].text, /Zn \+ Cu²⁺ → Zn²⁺ \+ Cu/);
  assert.match(ELECTRON_STEPS[2].text, /半反應相消/);
  assert.match(ELECTRON_STEPS[2].text, /硫酸根 SO₄²⁻ 是旁觀離子/);
});
