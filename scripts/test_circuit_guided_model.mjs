import assert from 'node:assert/strict';
import * as M from '../assets/circuit-guided/model.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const raw = (name, closed = true) => M.rawFromFixed(name, closed);
const eq = (reading, exact) => assert.equal(reading?.exact, String(exact));
const clone = (value) => structuredClone(value);
const finiteTree = (value) => {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object') for (const child of Object.values(value)) finiteTree(child);
};

test('wire validation rejects invalid and duplicate wires', () => {
  assert.throws(() => M.validateWires([{ from: 'wat', to: 'bat+' }]), /unknown terminal/);
  assert.throws(() => M.validateWires([{ from: 'bat+', to: 'bat+' }]), /itself/);
  assert.throws(() => M.validateWires([{ from: 'bat+', to: 'sw.a' }, { from: 'sw.a', to: 'bat+' }]), /duplicate/);
});

test('wire validation enforces the Guided wire limit', () => {
  const pairs = [];
  for (let i = 0; i < M.TERMINALS.length; i++) for (let j = i + 1; j < M.TERMINALS.length; j++) pairs.push({ from: M.TERMINALS[i], to: M.TERMINALS[j] });
  assert.throws(() => M.validateWires(pairs.slice(0, M.MAX_WIRES + 1)), /at most/);
});

test('baseline matches the legacy 6V 6ohm oracle', () => {
  const r = M.solveCircuit(raw('baseline'));
  assert.equal(r.status, 'normal'); eq(r.batteryCurrent, '1'); eq(r.equivalentResistance, '6');
  eq(r.lamps.L1.voltage, '6'); eq(r.lamps.L1.power, '6');
  assert.equal(r.topology, 'single-L1'); assert.equal(r.lamps.L1.brightness, 'reference');
});

test('one-path two-lamp circuit matches the legacy series oracle', () => {
  const r = M.solveCircuit(raw('trial1'));
  eq(r.batteryCurrent, '1/2'); eq(r.equivalentResistance, '12');
  eq(r.lamps.L1.voltage, '3'); eq(r.lamps.L2.voltage, '3'); eq(r.lamps.L1.power, '3/2');
  assert.equal(r.topology, 'one-path'); assert.equal(r.lamps.L1.brightness, 'low');
});

test('two-path two-lamp circuit matches the legacy parallel oracle', () => {
  const r = M.solveCircuit(raw('trial2Total'));
  eq(r.batteryCurrent, '2'); eq(r.equivalentResistance, '3');
  eq(r.lamps.L1.current, '1'); eq(r.lamps.L2.current, '1'); eq(r.lamps.L1.voltage, '6'); eq(r.lamps.L2.voltage, '6');
  assert.equal(r.topology, 'two-path');
  assert.equal(r.lamps.L1.brightness, 'reference'); assert.equal(r.lamps.L2.brightness, 'reference');
});

test('open switch produces zero current and zero lamp power', () => {
  for (const name of ['baseline', 'trial1', 'trial2Total']) {
    const r = M.solveCircuit(raw(name, false));
    assert.equal(r.status, 'open'); assert.equal(M.allCurrentsZero(r), true);
    eq(r.lamps.L1.power, '0'); eq(r.lamps.L2.power, '0');
  }
});

test('ammeter across the battery is source-short and exposes no fake finite current', () => {
  const r = M.solveCircuit({ switchClosed: true, wires: [{ from: 'bat+', to: 'A.+' }, { from: 'A.-', to: 'bat-' }] });
  assert.equal(r.status, 'source-short'); assert.equal(r.ammeter.placement, 'source-short');
  assert.equal(r.batteryCurrent, null); assert.equal(r.ammeter.reading, null); finiteTree(r);
});

test('wire-only source short is also fail-safe', () => {
  const r = M.solveCircuit({ switchClosed: true, wires: [{ from: 'bat+', to: 'bat-' }] });
  assert.equal(r.status, 'source-short'); finiteTree(r); assert.ok(!JSON.stringify(r).includes('Infinity'));
});

test('parallel ideal wire makes ammeter reading ambiguous', () => {
  const wires = clone(M.FIXED_CIRCUITS.baseline); wires.push({ from: 'A.+', to: 'A.-' });
  const r = M.solveCircuit({ wires, switchClosed: true });
  assert.equal(r.status, 'normal'); assert.equal(r.ammeter.state, 'ambiguous'); assert.equal(r.ammeter.placement, 'ambiguous');
  assert.equal(r.ammeter.reading, null); eq(r.batteryCurrent, '1');
});

test('reversed ammeter reports a negative reading while physics stays unchanged', () => {
  const wires = clone(M.FIXED_CIRCUITS.baseline).filter((w) => !['A.+|sw.b', 'A.-|L1.a'].includes([w.from, w.to].sort().join('|')));
  wires.push({ from: 'sw.b', to: 'A.-' }, { from: 'A.+', to: 'L1.a' });
  const r = M.solveCircuit({ wires, switchClosed: true });
  assert.equal(r.ammeter.placement, 'total-current'); eq(r.batteryCurrent, '1'); eq(r.ammeter.reading, '-1');
});

test('reversed voltmeter stays structurally across L1 but reads negative', () => {
  const wires = clone(M.FIXED_CIRCUITS.baseline).filter((w) => !w.from.startsWith('V.') && !w.to.startsWith('V.'));
  wires.push({ from: 'V.-', to: 'L1.a' }, { from: 'V.+', to: 'L1.b' });
  const r = M.solveCircuit({ wires, switchClosed: true });
  assert.equal(r.voltmeter.across, 'L1'); eq(r.voltmeter.reading, '-6');
});

test('series voltmeter opens the path but can read the source difference', () => {
  const r = M.solveCircuit({ switchClosed: true, wires: [
    { from: 'bat+', to: 'sw.a' }, { from: 'sw.b', to: 'L1.a' }, { from: 'L1.b', to: 'V.+' }, { from: 'V.-', to: 'bat-' },
  ] });
  assert.equal(r.status, 'open'); eq(r.batteryCurrent, '0'); eq(r.lamps.L1.current, '0'); eq(r.voltmeter.reading, '6');
});

test('fully floating voltmeter returns null, not false zero', () => {
  const r = M.solveCircuit({ switchClosed: false, wires: [] });
  assert.equal(r.voltmeter.state, 'floating'); assert.equal(r.voltmeter.reading, null);
});

test('ammeter parallel to L1 bypasses L1 without becoming a battery short', () => {
  const r = M.solveCircuit({ switchClosed: true, wires: [
    { from: 'bat+', to: 'sw.a' }, { from: 'sw.b', to: 'L1.a' }, { from: 'sw.b', to: 'A.+' },
    { from: 'L1.b', to: 'L2.a' }, { from: 'A.-', to: 'L2.a' }, { from: 'L2.b', to: 'bat-' },
  ] });
  assert.equal(r.status, 'normal'); assert.equal(r.ammeter.placement, 'parallel-to-L1');
  assert.equal(r.lamps.L1.bypassed, true); assert.equal(r.lamps.L1.active, false); eq(r.lamps.L2.current, '1');
});

test('Trial 2 meter placement distinguishes total, L1 and L2 despite equal branch readings', () => {
  const total = M.solveCircuit(raw('trial2Total')), l1 = M.solveCircuit(raw('trial2L1')), l2 = M.solveCircuit(raw('trial2L2'));
  assert.equal(total.ammeter.placement, 'total-current'); eq(total.ammeter.reading, '2');
  assert.equal(l1.ammeter.placement, 'L1-branch'); eq(l1.ammeter.reading, '1');
  assert.equal(l2.ammeter.placement, 'L2-branch'); eq(l2.ammeter.reading, '1');
});

test('removing one parallel branch leaves the other at 1A and lowers total to 1A', () => {
  const wires = clone(M.FIXED_CIRCUITS.trial2Total).filter((w) => !['A.-|L2.a', 'L2.b|bat-'].includes([w.from, w.to].sort().join('|')));
  const r = M.solveCircuit({ wires, switchClosed: true });
  eq(r.batteryCurrent, '1'); eq(r.lamps.L1.current, '1'); eq(r.lamps.L2.current, '0'); assert.equal(r.lamps.L1.brightness, 'reference');
});

test('electrically equivalent reversed L1 orientation keeps baseline truth', () => {
  const wires = [
    { from: 'bat+', to: 'sw.a' }, { from: 'sw.b', to: 'A.+' }, { from: 'A.-', to: 'L1.b' }, { from: 'L1.a', to: 'bat-' },
    { from: 'V.+', to: 'L1.b' }, { from: 'V.-', to: 'L1.a' },
  ];
  const r = M.solveCircuit({ wires, switchClosed: true });
  assert.equal(r.topology, 'single-L1'); assert.equal(r.ammeter.placement, 'total-current'); assert.equal(r.voltmeter.across, 'L1');
  eq(r.batteryCurrent, '1'); eq(r.ammeter.reading, '1'); eq(r.voltmeter.reading, '6');
});

test('challenge bases are immutable raw scenarios with no derived truth', () => {
  assert.ok(Object.isFrozen(M.CHALLENGE_BASES)); assert.ok(Object.isFrozen(M.CHALLENGE_BASES[2].wires));
  const json = JSON.stringify(M.CHALLENGE_BASES);
  for (const key of ['current', 'voltage', 'topology', 'correct', 'ready']) assert.ok(!json.includes(key), key);
});

test('fixed-seed property sample never throws or emits non-finite numbers', () => {
  let seed = 0x6c8e9cf5;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const pairs = [];
  for (let i = 0; i < M.TERMINALS.length; i++) for (let j = i + 1; j < M.TERMINALS.length; j++) pairs.push([M.TERMINALS[i], M.TERMINALS[j]]);
  for (let k = 0; k < 1200; k++) {
    const count = Math.floor(rnd() * (M.MAX_WIRES + 1)), used = new Set(), wires = [];
    while (wires.length < count) {
      const [a, b] = pairs[Math.floor(rnd() * pairs.length)], key = [a, b].sort().join('|');
      if (used.has(key)) continue; used.add(key); wires.push({ from: a, to: b });
    }
    const r = M.solveCircuit({ wires, switchClosed: rnd() < 0.5 });
    finiteTree(r); assert.ok(['normal', 'open', 'source-short'].includes(r.status));
  }
});

console.log('circuit-guided model: ' + tests + ' tests passed');
