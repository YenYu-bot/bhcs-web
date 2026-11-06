import test from 'node:test';
import assert from 'node:assert/strict';
import { freshSession, migrateV1, migrateV2, migrateV3, restoreSession } from '../../tools/metal-activity-desk/session.mjs';
import { freshReview } from '../../tools/metal-activity-desk/review.mjs';
import { freshSession as freshV2, hasChain } from '../../tools/metal-activity-desk/inquiry.mjs';
import { freshAcid, observeAcid, connectAcid, useHydrogenReference, hasHydrogenChain } from '../../tools/metal-activity-desk/acid.mjs';

const encode = state => JSON.stringify(state);
const populatedV2 = () => ({ ...freshV2(),
  cups: [
    { metal: 'Zn', phase: 'done', progress: 1, recordId: 'r1' },
    { metal: 'Fe', phase: 'paused', progress: 0, recordId: null },
    { metal: null, phase: 'fresh', progress: 0 },
  ],
  extraCups: [
    { metal: 'Zn', solution: 'FeSO4', phase: 'done', progress: 1, recordId: 'r3' },
    { metal: 'Cu', solution: 'ZnSO4', phase: 'paused', progress: 0, recordId: null },
  ],
  records: [
    { id: 'r1', metal: 'Zn', solution: 'CuSO4', kind: 'base' },
    { id: 'r2', metal: 'Fe', solution: 'CuSO4', kind: 'base' },
    { id: 'r3', metal: 'Zn', solution: 'FeSO4', kind: 'extra' },
  ],
  connections: { ZnCu: 'r1', FeCu: 'r2', ZnFe: 'r3' }, journeyOpen: true, nextId: 4,
});
const populatedV4 = () => {
  const state = migrateV2(encode(populatedV2()));
  let lesson = ['Zn', 'Fe', 'Cu'].reduce((l, metal) => observeAcid(l, metal), freshAcid());
  lesson = connectAcid(lesson, 'a1', 'ZnH').lesson;
  lesson = connectAcid(lesson, 'a2', 'FeH').lesson;
  lesson = useHydrogenReference(lesson);
  state.lesson = { ...lesson, open: true, pauseAnimation: true, electronOpen: true, electronStep: 2 };
  return state;
};

test('fresh V4 starts with independent V2 investigation and fresh acid lesson state', () => {
  const state = freshSession();
  assert.deepEqual(state, { ...freshV2(), version: 4, lesson: freshAcid(), review: freshReview() });
  state.lesson.records.push({ id: 'a1', metal: 'Zn' }); state.lesson.cups.Zn = 'a1';
  state.records.push({ id: 'r1', metal: 'Zn', solution: 'CuSO4', kind: 'base' });
  assert.equal(freshSession().lesson.records.length, 0);
  assert.equal(freshSession().records.length, 0);
  state.review.answers.origin.checked = true;
  assert.deepEqual(freshSession().review, freshReview());
});

test('V1 migration preserves completed and interrupted base cups without inventing acid evidence', () => {
  const legacy = { version: 1, cups: [
    { metal: 'Zn', phase: 'done', progress: 1 },
    { metal: 'Fe', phase: 'done', progress: 1 },
    { metal: 'Cu', phase: 'observing', progress: 0.8 },
  ] };
  const migrated = migrateV1(encode(legacy));
  assert.equal(migrated.version, 4);
  assert.deepEqual(migrated.records, [
    { id: 'r1', metal: 'Zn', solution: 'CuSO4', kind: 'base' },
    { id: 'r2', metal: 'Fe', solution: 'CuSO4', kind: 'base' },
  ]);
  assert.deepEqual(migrated.cups[0], { metal: 'Zn', phase: 'done', progress: 1, recordId: 'r1' });
  assert.deepEqual(migrated.cups[1], { metal: 'Fe', phase: 'done', progress: 1, recordId: 'r2' });
  assert.equal(migrated.cups[2].metal, 'Cu'); assert.equal(migrated.cups[2].phase, 'paused'); assert.equal(migrated.cups[2].progress, 0);
  assert.deepEqual(migrated.connections, {});
  assert.deepEqual(migrated.lesson, freshAcid());
  assert.deepEqual(migrated.review, freshReview());
  assert.equal(hasHydrogenChain(migrated), false);
  const reloaded = restoreSession(encode(migrated));
  assert.ok(reloaded);
  assert.deepEqual(reloaded.records, migrated.records);
  assert.deepEqual(reloaded.lesson, freshAcid());
  assert.deepEqual(reloaded.review, freshReview());
});

test('V1 migration retains Cu negative records and keeps every migrated ID distinct', () => {
  const migrated = migrateV1(encode({ version: 1, cups: ['Zn', 'Fe', 'Cu'].map(metal => ({ metal, phase: 'done', progress: 1 })) }));
  assert.deepEqual(migrated.records.map(r => r.metal), ['Zn', 'Fe', 'Cu']);
  assert.deepEqual(migrated.cups.map(c => c.recordId), ['r1', 'r2', 'r3']);
  assert.deepEqual(migrated.lesson, freshAcid());
  assert.deepEqual(migrated.review, freshReview());
  assert.equal(migrated.nextId, 4);
});

test('V2 migration retains all records, current cups and supported links with a fresh acid chapter', () => {
  const original = populatedV2();
  const migrated = migrateV2(encode(original));
  assert.deepEqual(migrated, { ...original, version: 4, lesson: freshAcid(), review: freshReview() });
  assert.equal(hasChain(migrated), true);
  assert.equal(hasHydrogenChain(migrated), false);
  assert.deepEqual(restoreSession(encode(migrated)), migrated);
});

test('V2 migration pauses in-flight cups and ignores any embedded unapproved acid state', () => {
  const original = populatedV2();
  original.cups[1].phase = 'observing'; original.cups[1].progress = 0.6;
  original.extraCups[1].phase = 'observing'; original.extraCups[1].progress = 0.9;
  original.lesson = populatedV4().lesson;
  const migrated = migrateV2(encode(original));
  assert.equal(migrated.cups[1].phase, 'paused'); assert.equal(migrated.cups[1].progress, 0);
  assert.equal(migrated.extraCups[1].phase, 'paused'); assert.equal(migrated.extraCups[1].progress, 0);
  assert.deepEqual(migrated.records, original.records);
  assert.deepEqual(migrated.connections, original.connections);
  assert.deepEqual(migrated.lesson, freshAcid());
  assert.deepEqual(migrated.review, freshReview());
});

test('migration rejects wrong versions and corrupt prior-state identities', () => {
  for (const raw of [null, '', '{', 'null', '{}', encode(freshSession())]) {
    assert.equal(migrateV1(raw), null);
    assert.equal(migrateV2(raw), null);
    assert.equal(migrateV3(raw), null);
  }
  assert.equal(migrateV1(encode(freshV2())), null);
  assert.equal(migrateV2(encode({ version: 1, cups: [] })), null);
  const corrupt = populatedV2(); corrupt.records[0].metal = ['Zn'];
  assert.equal(migrateV2(encode(corrupt)), null);
  assert.equal(migrateV1(encode({ version: 1, cups: [{ metal: ['Cu'], phase: 'done' }, ...freshV2().cups.slice(1)] })), null);
});

test('V4 roundtrip preserves both evidence graphs and every valid electron step', () => {
  assert.deepEqual(restoreSession(encode(freshSession())), freshSession());
  for (const electronStep of [0, 1, 2]) {
    const original = populatedV4(); original.lesson.electronStep = electronStep;
    const restored = restoreSession(encode(original));
    assert.deepEqual(restored, original);
    assert.equal(hasChain(restored), true);
    assert.equal(hasHydrogenChain(restored), true);
    assert.equal(restored.lesson.pauseAnimation, true);
    assert.equal(restored.lesson.electronOpen, true);
    assert.equal(restored.lesson.electronStep, electronStep);
    assert.deepEqual(restoreSession(encode(restored)), restored);
  }
});

test('V4 restoration pauses interrupted original experiments without dropping acid progress', () => {
  const state = populatedV4();
  state.cups[1].phase = 'observing'; state.cups[1].progress = 0.8;
  state.extraCups[1].phase = 'observing'; state.extraCups[1].progress = 0.3;
  const restored = restoreSession(encode(state));
  assert.equal(restored.cups[1].phase, 'paused'); assert.equal(restored.cups[1].progress, 0);
  assert.equal(restored.extraCups[1].phase, 'paused'); assert.equal(restored.extraCups[1].progress, 0);
  assert.deepEqual(restored.records, state.records);
  assert.deepEqual(restored.connections, state.connections);
  assert.deepEqual(restored.lesson, state.lesson);
  assert.equal(hasHydrogenChain(restored), true);
});

test('V4 restore rejects invalid format and corruption in either chapter atomically', () => {
  for (const raw of [null, undefined, '', '{', 'null', '[]', '{}', encode(freshV2()), encode({ ...freshSession(), version: 5 })]) assert.equal(restoreSession(raw), null);
  for (const mutate of [
    state => { delete state.lesson; },
    state => { state.lesson = null; },
    state => { state.lesson.version = 2; },
    state => { state.lesson.records[0].metal = ['Zn']; },
    state => { state.lesson.records[0].id = '<script>'; },
    state => { state.lesson.cups.Zn = 'a2'; },
    state => { state.lesson.records[1].id = 'a1'; },
    state => { state.records[0].metal = ['Zn']; },
    state => { state.cups[0].recordId = 'r2'; },
    state => { state.extraCups = []; },
  ]) {
    const state = populatedV4(); mutate(state);
    assert.equal(restoreSession(encode(state)), null);
  }
});

test('V4 restore cleans unsupported links in both chapters without accepting a forged final chain', () => {
  const state = populatedV4();
  state.connections.ZnFe = 'r2';
  state.lesson.links = { ZnH: 'a2', FeH: 'a3', HCu: 'a3', CuH: 'a3' };
  state.complete = true;
  const restored = restoreSession(encode(state));
  assert.deepEqual(restored.connections, { ZnCu: 'r1', FeCu: 'r2' });
  assert.deepEqual(restored.lesson.links, {});
  assert.equal(restored.complete, undefined);
  assert.equal(hasHydrogenChain(restored), false);
  assert.deepEqual(restored.records, state.records);
  assert.deepEqual(restored.lesson.records, state.lesson.records);
});

test('V4 restore normalizes electron controls and strips injected metadata', () => {
  const state = populatedV4();
  state.lesson.electronStep = '<img>'; state.lesson.electronOpen = 'true'; state.lesson.pauseAnimation = 1;
  state.lesson.records[0].observation = '<svg onload=alert(1)>';
  state.lesson.nextId = '<script>'; state.nextId = '<script>';
  state.lesson.title = '<script>'; state.extraField = '<script>';
  const restored = restoreSession(encode(state));
  assert.equal(restored.lesson.electronStep, 0);
  assert.equal(restored.lesson.electronOpen, false);
  assert.equal(restored.lesson.pauseAnimation, false);
  assert.equal(restored.nextId, 4); assert.equal(restored.lesson.nextId, 4);
  assert.equal(restored.extraField, undefined); assert.equal(restored.lesson.title, undefined);
  assert.deepEqual(restored.lesson.records[0], { id: 'a1', metal: 'Zn' });
});

test('V4 roundtrip supports cleared current acid cups while retaining observations and references', () => {
  const state = populatedV4(); state.lesson.cups = { Zn: null, Fe: null, Cu: null };
  const restored = restoreSession(encode(state));
  assert.deepEqual(restored, state);
  assert.equal(hasHydrogenChain(restored), true);
});

const populatedV3 = () => {
  const { review, ...science } = populatedV4();
  return { ...science, version: 3 };
};
const submittedReview = () => ({
  version: 1, open: true,
  answers: {
    origin: { recordId: 'r1', donor: 'Zn', acceptor: 'Cu2', deposit: 'Cu', checked: true },
    acids: { zincId: 'a1', ironId: 'a2', answer: 'need-direct', evidenceId: 'r3', checked: true },
    source: { copperId: 'a3', answer: 'reference', checked: true },
  },
});

test('V3 migration preserves both experiments, evidence links, motion and every electron stage', () => {
  for (const electronStep of [0, 1, 2]) {
    const original = populatedV3(); original.lesson.electronStep = electronStep;
    const before = structuredClone(original);
    const migrated = migrateV3(encode(original));
    assert.deepEqual(migrated, { ...original, version: 4, review: freshReview() });
    assert.deepEqual(original, before);
    assert.equal(hasChain(migrated), true);
    assert.equal(hasHydrogenChain(migrated), true);
    assert.deepEqual(restoreSession(encode(migrated)), migrated);
  }
});

test('V3 migration retains completed cups and pauses only in-flight cups without losing evidence', () => {
  const original = populatedV3();
  original.cups[1].phase = 'observing'; original.cups[1].progress = 0.6;
  original.extraCups[1].phase = 'observing'; original.extraCups[1].progress = 0.8;
  const migrated = migrateV3(encode(original));
  assert.deepEqual(migrated.cups[0], original.cups[0]);
  assert.deepEqual(migrated.extraCups[0], original.extraCups[0]);
  for (const cup of [migrated.cups[1], migrated.extraCups[1]]) {
    assert.equal(cup.phase, 'paused'); assert.equal(cup.progress, 0);
  }
  for (const field of ['records', 'connections', 'lesson', 'journeyOpen', 'nextId']) assert.deepEqual(migrated[field], original[field]);
  assert.deepEqual(migrated.review, freshReview());
});

test('legacy versions cannot inject completed review or unsupported newer-chapter evidence', () => {
  for (const [version, migrate, state] of [
    [1, migrateV1, { version: 1, cups: freshV2().cups }],
    [2, migrateV2, populatedV2()],
    [3, migrateV3, populatedV3()],
  ]) {
    state.review = submittedReview(); state.complete = true;
    const migrated = migrate(encode(state));
    assert.equal(migrated.version, 4);
    assert.deepEqual(migrated.review, freshReview());
    assert.equal(migrated.complete, undefined);
    if (version < 3) assert.deepEqual(migrated.lesson, freshAcid());
  }
});

test('V3 migration retains strict original scientific corruption checks', () => {
  for (const mutate of [
    state => { delete state.lesson; },
    state => { state.lesson.version = 2; },
    state => { state.lesson.records[0].metal = ['Zn']; },
    state => { state.lesson.cups.Zn = 'a2'; },
    state => { state.records[0].metal = ['Zn']; },
    state => { state.cups[0].recordId = 'r2'; },
    state => { state.extraCups = []; },
  ]) {
    const state = populatedV3(); mutate(state);
    assert.equal(migrateV3(encode(state)), null);
  }
  for (const state of [freshV2(), freshSession(), { version: 1, cups: freshV2().cups }]) assert.equal(migrateV3(encode(state)), null);
  assert.equal(restoreSession(encode(populatedV3())), null, 'V3 uses its explicit migration, never a silent V4 restore');
});

test('V4 roundtrip retains submitted review record IDs, choices and checked flags', () => {
  const state = populatedV4(); state.review = submittedReview();
  assert.deepEqual(restoreSession(encode(state)), state);
  // Existing wrong records and incomplete attempts remain available for feedback.
  state.review.answers.origin.recordId = 'r2';
  state.review.answers.acids.zincId = 'a3';
  state.review.answers.source.copperId = 'a2';
  assert.deepEqual(restoreSession(encode(state)), state);
  state.review.answers.origin.checked = false;
  state.review.answers.acids.checked = false;
  state.review.answers.source.checked = false;
  assert.deepEqual(restoreSession(encode(state)), state);
});

test('missing or malformed V4 review resets only review, retaining all experimental evidence', () => {
  for (const review of [undefined, null, false, true, 0, 'invalid', [], {}, { version: 2 }, { version: 1, answers: null }]) {
    const state = populatedV4(); state.review = review;
    const restored = restoreSession(encode(state));
    assert.ok(restored, 'review corruption cannot invalidate valid experiments');
    assert.deepEqual(restored, { ...state, review: freshReview() });
    assert.equal(hasChain(restored), true);
    assert.equal(hasHydrogenChain(restored), true);
  }
});

test('V4 review strips forged metadata and revokes checked claims for missing record IDs', () => {
  const state = populatedV4(); state.review = submittedReview();
  state.review.complete = true;
  state.review.answers.origin.recordId = 'r999';
  state.review.answers.acids.ironId = 'a999';
  state.review.answers.source.copperId = '<script>';
  for (const answer of Object.values(state.review.answers)) answer.passed = true;
  const restored = restoreSession(encode(state));
  assert.ok(restored);
  assert.equal(restored.review.complete, undefined);
  for (const answer of Object.values(restored.review.answers)) {
    assert.equal(answer.checked, false);
    assert.equal(answer.passed, undefined);
  }
  assert.equal(restored.review.answers.origin.recordId, null);
  assert.equal(restored.review.answers.acids.ironId, null);
  assert.equal(restored.review.answers.source.copperId, null);
  for (const field of ['cups', 'extraCups', 'records', 'connections', 'lesson']) assert.deepEqual(restored[field], state[field]);
});
