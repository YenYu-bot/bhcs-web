import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceGuide, newExtraTrial } from '../../tools/metal-activity-desk/guidance.mjs';
import { freshSession, freshExtra, appendRecord, restoreSession, hasChain } from '../../tools/metal-activity-desk/inquiry.mjs';

const zincCopper = { id: 'r1', metal: 'Zn', solution: 'CuSO4', kind: 'base' };
const ironCopper = { id: 'r2', metal: 'Fe', solution: 'CuSO4', kind: 'base' };
const zincIron = { id: 'r3', metal: 'Zn', solution: 'FeSO4', kind: 'extra' };
const copperControl = { id: 'r4', metal: 'Cu', solution: 'CuSO4', kind: 'base' };
const reverseControl = { id: 'r5', metal: 'Fe', solution: 'ZnSO4', kind: 'extra' };
const session = (records = [], connections = {}) => ({ ...freshSession(), records: structuredClone(records), connections: { ...connections }, nextId: 6 });
const doneExtra = (record = zincIron) => ({ metal: record.metal, solution: record.solution, phase: 'done', progress: 1, recordId: record.id });
const completedSession = () => session([zincCopper, ironCopper, zincIron, copperControl, reverseControl], { ZnCu: 'r1', FeCu: 'r2', ZnFe: 'r3' });

test('fresh, Cu-only and negative-only evidence cannot imply a completed comparison', () => {
  for (const state of [freshSession(), session([copperControl]), session([reverseControl]), session([copperControl, reverseControl])]) {
    const guide = evidenceGuide(state);
    assert.equal(guide.stage, 'find-zinc-iron');
    assert.equal(hasChain(state), false);
    assert.match(guide.title, /還缺直接比較/);
    assert.doesNotMatch(guide.text, /關係已完成|證據都已接上/);
  }
});

test('two copper-displacement experiments alone still require direct Zn/Fe evidence', () => {
  for (const connections of [{}, { ZnCu: 'r1' }, { FeCu: 'r2' }, { ZnCu: 'r1', FeCu: 'r2' }]) {
    const guide = evidenceGuide(session([zincCopper, ironCopper], connections));
    assert.equal(guide.stage, 'find-zinc-iron');
    assert.match(guide.text, /不能比較鋅與鐵/);
    assert.match(guide.text, /鋅片.*硫酸亞鐵/);
  }
});

test('an existing positive Zn/Fe record prompts connecting it rather than repeating it', () => {
  for (const connections of [{}, { FeCu: 'r2' }, { ZnCu: 'r1', FeCu: 'r2' }]) {
    const guide = evidenceGuide(session([zincCopper, ironCopper, zincIron], connections));
    assert.equal(guide.stage, 'connect-zinc-iron');
    assert.match(guide.text, /紀錄保留著，不必重做/);
    assert.match(guide.text, /尚未接到「鋅與鐵」/);
  }
});

test('a valid Zn/Fe link asks for an existing Fe/Cu record when one is available', () => {
  const state = session([zincIron, ironCopper], { ZnFe: 'r3' });
  const guide = evidenceGuide(state);
  assert.equal(guide.stage, 'need-iron-copper');
  assert.match(guide.text, /從紀錄選「鐵＋硫酸銅」/);
  assert.doesNotMatch(guide.text, /還缺證據|補做/);
});

test('a valid Zn/Fe link asks for Fe/Cu investigation only when that evidence is missing', () => {
  const state = session([zincIron, zincCopper, copperControl, reverseControl], { ZnFe: 'r3', ZnCu: 'r1' });
  const guide = evidenceGuide(state);
  assert.equal(guide.stage, 'need-iron-copper');
  assert.match(guide.text, /鐵與銅還缺證據/);
  assert.match(guide.text, /乾淨鐵片＋新鮮硫酸銅補做/);
  assert.doesNotMatch(guide.text, /從紀錄選/);
});

test('completion requires both validated chain links, without requiring an extra Zn/Cu link', () => {
  const state = session([ironCopper, zincIron], { ZnFe: 'r3', FeCu: 'r2' });
  const guide = evidenceGuide(state);
  assert.equal(guide.stage, 'complete');
  assert.equal(hasChain(state), true);
  assert.match(guide.text, /關係已完成/);
  assert.match(guide.text, /不會讓原本的連線消失/);
});

test('completed guidance stays complete after every possible additional experiment', () => {
  for (const metal of ['Zn', 'Fe', 'Cu']) for (const solution of ['CuSO4', 'FeSO4', 'ZnSO4']) {
    const state = completedSession();
    const next = appendRecord(state, metal, solution).state;
    assert.equal(evidenceGuide(next).stage, 'complete', `${metal}/${solution} must not reset the completed guidance`);
    assert.deepEqual(next.connections, state.connections);
    assert.equal(next.records.length, state.records.length + 1);
  }
});

test('removing a link regresses to the exact remaining evidence state', () => {
  const complete = completedSession();
  for (const [removed, expected] of [['ZnCu', 'complete'], ['ZnFe', 'connect-zinc-iron'], ['FeCu', 'need-iron-copper']]) {
    const state = structuredClone(complete);
    delete state.connections[removed];
    assert.equal(evidenceGuide(state).stage, expected, `remove ${removed}`);
    assert.deepEqual(state.records, complete.records);
  }
  const noRequiredLinks = structuredClone(complete);
  delete noRequiredLinks.connections.ZnFe;
  delete noRequiredLinks.connections.FeCu;
  assert.equal(evidenceGuide(noRequiredLinks).stage, 'connect-zinc-iron');
});

test('wrong-pair, negative, missing and injected connection IDs never count as valid evidence', () => {
  for (const wrongId of ['r1', 'r2', 'r4', 'r5', 'missing', '__proto__', null, ['r3']]) {
    const state = session([zincCopper, ironCopper, zincIron, copperControl, reverseControl], { ZnFe: wrongId, FeCu: 'r2' });
    assert.equal(evidenceGuide(state).stage, 'connect-zinc-iron', `invalid ZnFe link ${JSON.stringify(wrongId)}`);
  }
  for (const wrongId of ['r1', 'r3', 'r4', 'r5', 'missing', '__proto__', null, ['r2']]) {
    const state = session([zincCopper, ironCopper, zincIron, copperControl, reverseControl], { ZnFe: 'r3', FeCu: wrongId });
    assert.equal(evidenceGuide(state).stage, 'need-iron-copper', `invalid FeCu link ${JSON.stringify(wrongId)}`);
  }
  const missingRecord = session([ironCopper, copperControl], { ZnFe: 'r3', FeCu: 'r2' });
  assert.equal(evidenceGuide(missingRecord).stage, 'find-zinc-iron');
});

test('unsupported record materials do not become available or linked evidence', () => {
  const state = session([
    { id: 'r1', metal: 'Ag', solution: 'FeSO4', kind: 'extra' },
    { id: 'r2', metal: ['Zn'], solution: 'FeSO4', kind: 'extra' },
    { id: 'r3', metal: 'Zn', solution: ['FeSO4'], kind: 'extra' },
  ], { ZnFe: 'r1', FeCu: 'r2' });
  assert.equal(evidenceGuide(state).stage, 'find-zinc-iron');
});

test('all evidence subsets and connection combinations agree with independent stage expectations', () => {
  const universe = [zincCopper, ironCopper, zincIron, copperControl];
  const linkOptions = [undefined, 'r1', 'r2', 'r3', 'r4', 'missing'];
  let checked = 0;
  for (let mask = 0; mask < 16; mask++) {
    const records = universe.filter((_, index) => mask & (1 << index));
    for (const ZnCu of linkOptions) for (const FeCu of linkOptions) for (const ZnFe of linkOptions) {
      const state = session(records, { ZnCu, FeCu, ZnFe });
      const hasZincIron = Boolean(mask & 4);
      const validZincIron = hasZincIron && ZnFe === 'r3';
      const validIronCopper = Boolean(mask & 2) && FeCu === 'r2';
      const expected = validZincIron && validIronCopper ? 'complete'
        : validZincIron ? 'need-iron-copper'
        : hasZincIron ? 'connect-zinc-iron' : 'find-zinc-iron';
      const guide = evidenceGuide(state);
      assert.equal(guide.stage, expected, `mask ${mask}, links ${JSON.stringify(state.connections)}`);
      assert.equal(guide.stage === 'complete', hasChain(state));
      assert.equal(typeof guide.title, 'string');
      assert.ok(guide.title.trim());
      assert.equal(typeof guide.text, 'string');
      assert.ok(guide.text.trim());
      checked++;
    }
  }
  assert.equal(checked, 3456);
});

test('guidance derives from restored V2 evidence without needing a saved guidance field', () => {
  const examples = [
    [session([copperControl]), 'find-zinc-iron'],
    [session([zincIron, ironCopper]), 'connect-zinc-iron'],
    [session([zincIron, ironCopper], { ZnFe: 'r3' }), 'need-iron-copper'],
    [completedSession(), 'complete'],
  ];
  for (const [state, expected] of examples) {
    state.extraCups[0] = state.records.some(r => r.id === 'r3') ? doneExtra() : freshExtra();
    state.extraCups[1] = { metal: 'Cu', solution: 'ZnSO4', phase: 'observing', progress: 0.6, recordId: null };
    const restored = restoreSession(JSON.stringify(state));
    assert.ok(restored);
    assert.equal(restored.version, 2);
    assert.equal(restored.extraCups[1].phase, 'paused');
    assert.equal(evidenceGuide(restored).stage, expected);
    assert.deepEqual(restored.records, state.records);
  }
});

test('restoration discards unsupported links and guidance reflects the cleaned V2 state', () => {
  const state = completedSession();
  state.connections = { ZnCu: 'r1', ZnFe: 'r4', FeCu: 'r2', title: '<script>' };
  state.guidance = { stage: 'complete', text: 'forged completion' };
  const restored = restoreSession(JSON.stringify(state));
  assert.deepEqual(restored.connections, { ZnCu: 'r1', FeCu: 'r2' });
  assert.equal(restored.guidance, undefined);
  assert.equal(evidenceGuide(restored).stage, 'connect-zinc-iron');
});

test('reading guidance never mutates cups, retained records or connections', () => {
  const state = completedSession();
  state.extraCups[0] = doneExtra();
  const before = structuredClone(state);
  for (let i = 0; i < 3; i++) evidenceGuide(state);
  assert.deepEqual(state, before);
});

test('newExtraTrial clears only the requested completed cup and both material selections', () => {
  for (const index of [0, 1]) {
    const state = completedSession();
    state.extraCups = [doneExtra(zincIron), doneExtra(reverseControl)];
    state.journeyOpen = true;
    const before = structuredClone(state);
    const next = newExtraTrial(state, index);
    assert.deepEqual(state, before, 'the input state must not be mutated');
    assert.notEqual(next.state, state);
    assert.notEqual(next.state.extraCups, state.extraCups);
    assert.deepEqual(next.state.extraCups[index], freshExtra());
    assert.notEqual(next.state.extraCups[index], state.extraCups[index]);
    assert.equal(next.state.extraCups[1 - index], state.extraCups[1 - index]);
    assert.equal(next.state.records, state.records);
    assert.equal(next.state.connections, state.connections);
    assert.equal(next.state.cups, state.cups);
    assert.equal(next.state.nextId, state.nextId);
    assert.equal(next.state.journeyOpen, true);
    assert.equal(next.metal, null);
    assert.equal(next.solution, null);
    assert.equal(evidenceGuide(next.state).stage, 'complete');
    assert.ok(restoreSession(JSON.stringify(next.state)));
  }
});

test('newExtraTrial preserves other paused or active cups and all accumulated records', () => {
  for (const phase of ['paused', 'observing']) {
    const state = completedSession();
    state.extraCups[0] = doneExtra(zincIron);
    state.extraCups[1] = { metal: 'Cu', solution: 'ZnSO4', phase, progress: 0.4, recordId: null };
    const next = newExtraTrial(state, 0);
    assert.deepEqual(next.state.extraCups[1], state.extraCups[1]);
    assert.equal(next.state.extraCups[1].phase, phase);
    assert.equal(next.state.records.length, 5);
    assert.deepEqual(next.state.connections, state.connections);
  }
});

test('newExtraTrial rejects invalid indexes and cups that are not completed', () => {
  const state = completedSession();
  state.extraCups = [doneExtra(), doneExtra(reverseControl)];
  const before = structuredClone(state);
  for (const index of [-1, 2, 100, 0.5, NaN, Infinity, -Infinity, '0', null, undefined]) {
    assert.equal(newExtraTrial(state, index), null, `invalid index ${String(index)}`);
  }
  assert.deepEqual(state, before);
  for (const phase of ['fresh', 'observing', 'paused']) {
    const notDone = completedSession();
    notDone.extraCups[0] = phase === 'fresh' ? freshExtra() : { metal: 'Zn', solution: 'FeSO4', phase, progress: 0.5, recordId: null };
    const snapshot = structuredClone(notDone);
    assert.equal(newExtraTrial(notDone, 0), null);
    assert.deepEqual(notDone, snapshot);
  }
});

test('repeated new-cup requests cannot silently replace a newly prepared cup', () => {
  const state = completedSession();
  state.extraCups[0] = doneExtra();
  const next = newExtraTrial(state, 0);
  const snapshot = structuredClone(next.state);
  assert.equal(newExtraTrial(next.state, 0), null);
  assert.deepEqual(next.state, snapshot);
  assert.deepEqual(next.state.records, state.records);
});
