// B4 gate (pure part): the visual parameters of the guided buoyancy bench (assets/buoyancy-guided/visual.js).
// Real views come from the engine; visual.js itself must not know about the engine or the model.
// Run on its own: node scripts/test_buoyancy_guided_visual.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createInitialState, reduce, deriveView } from '../assets/buoyancy-guided/engine.js';
import { VIEW_W, VIEW_H, TANK, TANK_CX, TABLE_Y, TABLE_X, BLOCK_PX, STAY_CLEAR_TOP, STAY_CLEAR_FLOOR, OBJECT_IDS, sizeForVolume, ballastCells, poseFor, visualParams } from '../assets/buoyancy-guided/visual.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const near = (a, b, label, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} vs ${b}`);
const ok = (s, a) => { const r = reduce(s, a); assert.equal(r.accepted, true, `${JSON.stringify(a)} (${r.reason})`); return r.state; };
const run = (s, ...actions) => actions.reduce(ok, s);
const ADD = { type: 'ADD_BALLAST' }, REMOVE = { type: 'REMOVE_BALLAST' }, PUT = { type: 'PUT_IN', objectId: 'block' }, OUT = { type: 'TAKE_OUT' };

const trial1 = run(createInitialState(), { type: 'START' }, { type: 'BEGIN' });                       // 1 slot = 60 g
const blockIn = (slots, liquidId = 'water') => {                                                      // the block in the tank, in the engine's own state
  let s = trial1;
  while (s.slots < slots) s = ok(s, ADD);
  while (s.slots > slots) s = ok(s, REMOVE);
  s = { ...structuredClone(s), liquidId };
  return ok(s, PUT);
};
const viewOf = (s) => deriveView(s);
const paramsOf = (s) => visualParams(viewOf(s));
const trial3 = (() => {
  const s = run(trial1, ADD, ADD, PUT, { type: 'RECORD_TRIAL', trial: 1 }, { type: 'SELECT_LIQUID', liquidId: 'brine' }, PUT, OUT, ADD, PUT, { type: 'RECORD_TRIAL', trial: 2 }, { type: 'CONTINUE' },
    { type: 'ANSWER_COMPARE', question: 'stayMass', answer: 'larger' }, { type: 'ANSWER_COMPARE', question: 'firstDrop', answer: 'float' }, { type: 'CONTINUE' });
  return s;
})();
const bodyBottom = (o) => o.y + o.h;

const finiteDeep = (o, path = 'params') => {
  if (typeof o === 'number') assert.ok(Number.isFinite(o), `${path} is not finite`);
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) finiteDeep(v, `${path}.${k}`);
};

test('the fixed viewBox and the tank geometry leave room for everything', () => {
  assert.equal(VIEW_W, 750);
  assert.equal(VIEW_H, 420);
  assert.ok(TANK.x > 0 && TANK.x + TANK.w < VIEW_W && TANK.y > 0 && TANK.y + TANK.h < VIEW_H, 'the tank is inside the view');
  assert.ok(TANK.y < TANK.waterY && TANK.waterY < TANK.floorY && TANK.floorY < TANK.y + TANK.h, 'rim, surface, floor, frame in order');
  assert.equal(TABLE_Y, TANK.floorY, 'the table and the tank floor are one line');
  const wood = sizeForVolume(500), stone = sizeForVolume(40);
  assert.ok(wood < TANK.w - 2 * TANK.wall, 'the widest object fits the tank');
  assert.ok(TANK.floorY - TANK.waterY > wood + STAY_CLEAR_TOP, 'the water is deep enough for the biggest object');
  assert.ok(stone > 0);
});

test('object sizes follow the volume scale: 70 px block, about 120 px wood, about 52 px stone', () => {
  assert.equal(BLOCK_PX, 70);
  assert.equal(sizeForVolume(100), 70);
  near(sizeForVolume(500), 119.7, 'wood', 0.2);
  near(sizeForVolume(40), 51.6, 'stone', 0.2);
  const p = paramsOf(trial3);
  near(p.objects.block.w, 70, 'block'); near(p.objects.wood.w, 119.7, 'wood', 0.2); near(p.objects.stone.w, 51.6, 'stone', 0.2);
  for (const id of OBJECT_IDS) assert.equal(p.objects[id].w, p.objects[id].h, `${id} is square`);
  assert.ok(p.objects.wood.w > p.objects.block.w && p.objects.block.w > p.objects.stone.w);
});

test('the number of filled ballast cells never changes the block\'s outline', () => {
  const outline = (slots) => { const o = paramsOf(blockIn(slots)).objects.block; return { x: o.x, y: o.y, w: o.w, h: o.h }; };
  const onTable = (slots) => { let s = trial1; while (s.slots < slots) s = ok(s, ADD); while (s.slots > slots) s = ok(s, REMOVE); const o = paramsOf(s).objects.block; return { x: o.x, y: o.y, w: o.w, h: o.h }; };
  assert.deepEqual(onTable(0), onTable(6));
  for (let s = 0; s <= 6; s++) assert.deepEqual(onTable(s), onTable(1));
  assert.deepEqual(outline(0), { ...outline(0) });
  const cells = (n) => paramsOf((() => { let s = trial1; while (s.slots < n) s = ok(s, ADD); while (s.slots > n) s = ok(s, REMOVE); return s; })()).ballast;
  for (let n = 0; n <= 6; n++) {
    const b = cells(n);
    assert.equal(b.cells.length, 6);
    assert.equal(b.cells.filter((c) => c.filled).length, n);
    assert.equal(b.filled, n);
    assert.ok(b.cells.every((c) => c.dx >= 0 && c.dy >= 0 && c.dx + c.w <= BLOCK_PX && c.dy + c.h <= BLOCK_PX), 'every cell is inside the block');
  }
  assert.deepEqual(cells(0).cells.map((c) => [c.dx, c.dy, c.w, c.h]), cells(6).cells.map((c) => [c.dx, c.dy, c.w, c.h]), 'the cells sit in the same places whatever is filled');
  assert.deepEqual(ballastCells(3).filter((c) => c.filled).map((c) => c.i), [0, 1, 2]);
});

test('a floating object is partly under the surface: top above it, bottom below it, never wholly in or out', () => {
  for (const [slots, liquid] of [[0, 'water'], [1, 'water'], [2, 'water'], [0, 'brine'], [1, 'brine'], [2, 'brine'], [3, 'brine']]) {
    const o = paramsOf(blockIn(slots, liquid)).objects.block;
    assert.equal(o.outcome, 'float', `${slots} ${liquid}`);
    assert.ok(o.y < TANK.waterY && bodyBottom(o) > TANK.waterY, `${slots} ${liquid}: crosses the surface`);
    assert.equal(o.waterlineY, TANK.waterY);
    near(o.waterlineLocalY, TANK.waterY - o.y, 'local waterline');
    near((bodyBottom(o) - TANK.waterY) / o.h, o.immersionFraction, `${slots} ${liquid} shown fraction`, 1e-9);
    assert.equal(o.contact, false);
    assert.equal(o.x + o.w / 2, TANK_CX);
  }
});

test('60% shows more above the surface than 83%, and the waterline is monotonic from 33% to 83%', () => {
  const at = (slots, liquid) => paramsOf(blockIn(slots, liquid)).objects.block;
  const b60 = at(1, 'water'), b83 = at(3, 'brine');
  near(b60.immersionFraction, 0.6, '60'); near(b83.immersionFraction, 5 / 6, '83');
  const above = (o) => TANK.waterY - o.y;
  assert.ok(above(b83) < above(b60), `83% shows ${above(b83)}, 60% shows ${above(b60)}`);
  near(above(b60), 28, '60% exposed', 1e-9);
  near(above(b83), 70 / 6, '83% exposed', 1e-9);
  const ladder = [at(0, 'brine'), at(1, 'brine'), at(2, 'brine'), at(3, 'brine')];       // 33, 50, 67, 83
  for (let i = 1; i < ladder.length; i++) {
    assert.ok(ladder[i].immersionFraction > ladder[i - 1].immersionFraction);
    assert.ok(ladder[i].y > ladder[i - 1].y, 'deeper in the water means the top is lower');
    assert.ok(ladder[i].waterlineLocalY < ladder[i - 1].waterlineLocalY, 'and the surface cuts the object nearer its top');
    assert.ok(above(ladder[i]) < above(ladder[i - 1]));
  }
  const water = [0, 1, 2].map((s) => at(s, 'water'));                                       // 40, 60, 80
  assert.ok(water[0].y < water[1].y && water[1].y < water[2].y);
});

test('a staying object is wholly under the surface and clearly off the floor', () => {
  for (const [slots, liquid] of [[3, 'water'], [4, 'brine']]) {
    const o = paramsOf(blockIn(slots, liquid)).objects.block;
    assert.equal(o.outcome, 'stay');
    assert.equal(o.waterlineY, null);
    assert.equal(o.immersionFraction, null);
    assert.ok(o.y >= TANK.waterY + STAY_CLEAR_TOP, `top ${o.y} is at least ${STAY_CLEAR_TOP} under the surface`);
    assert.ok(bodyBottom(o) <= TANK.floorY - STAY_CLEAR_FLOOR, `bottom ${bodyBottom(o)} is at least ${STAY_CLEAR_FLOOR} above the floor`);
    assert.equal(o.contact, false);
    assert.deepEqual(o.submerged, { y: 0, h: o.h });
  }
  const stay = paramsOf(blockIn(3, 'water')).objects.block, sink = paramsOf(blockIn(4, 'water')).objects.block;
  assert.ok(sink.y - stay.y > 20, 'staying and sinking are far enough apart to tell at a glance');
});

test('a sinking object touches the floor exactly', () => {
  for (const [slots, liquid] of [[4, 'water'], [5, 'water'], [6, 'water'], [5, 'brine']]) {
    const o = paramsOf(blockIn(slots, liquid)).objects.block;
    assert.equal(o.outcome, 'sink');
    assert.equal(bodyBottom(o), TANK.floorY);
    assert.equal(o.contact, true);
    assert.equal(o.waterlineY, null);
  }
});

test('Trial 3: wood floats at 60%, stone sinks onto the floor, and the shelf holds both side by side', () => {
  const shelf = paramsOf(trial3);
  for (const id of ['wood', 'stone']) assert.equal(shelf.objects[id].where, 'table');
  assert.equal(shelf.objects.block.visible, false);
  assert.equal(shelf.objects.wood.visible && shelf.objects.stone.visible, true);
  const w = shelf.objects.wood, s = shelf.objects.stone;
  assert.ok(w.x + w.w < s.x, 'wood and stone do not overlap');
  for (const o of [w, s]) { assert.equal(bodyBottom(o), TABLE_Y); assert.ok(o.x >= 0 && o.x + o.w <= TANK.x, 'on the table, left of the tank'); }
  const wood = paramsOf(run(trial3, { type: 'PUT_IN', objectId: 'wood' })).objects.wood;
  assert.equal(wood.outcome, 'float'); near(wood.immersionFraction, 0.6, 'wood');
  near(TANK.waterY - wood.y, wood.h * 0.4, 'wood exposed', 1e-9);
  const stone = paramsOf(run(trial3, { type: 'PUT_IN', objectId: 'stone' })).objects.stone;
  assert.equal(stone.outcome, 'sink'); assert.equal(bodyBottom(stone), TANK.floorY); assert.equal(stone.contact, true);
});

test('on the table an object is outside the tank, on its own spot, with no outcome', () => {
  const o = paramsOf(trial1).objects.block;
  assert.equal(o.where, 'table');
  assert.ok(o.x + o.w <= TANK.x, 'left of the tank');
  assert.equal(bodyBottom(o), TABLE_Y);
  assert.deepEqual([o.outcome, o.immersionFraction, o.waterlineY, o.submerged, o.contact], [null, null, null, null, false]);
  near(o.x + o.w / 2, TABLE_X.block, 'block spot');
  assert.equal(paramsOf(trial1).objects.wood.visible, false);
  assert.equal(paramsOf(trial1).objects.stone.visible, false);
});

test('who is on the bench: the block from the mission on, wood and stone in Trial 3 and after, nothing touchable is not the same as nothing there', () => {
  const mission = run(createInitialState(), { type: 'START' });
  const m = paramsOf(mission).objects;
  assert.equal(m.block.visible, true);
  assert.equal(m.block.where, 'table');
  assert.equal(m.block.operable, false, 'at the mission it can be looked at, not touched');
  assert.equal(m.wood.visible || m.stone.visible, false);
  const t1 = paramsOf(trial1).objects;
  assert.deepEqual(OBJECT_IDS.map((id) => t1[id].visible), [true, false, false]);
  const t3 = paramsOf(trial3).objects;
  assert.deepEqual(OBJECT_IDS.map((id) => t3[id].visible), [false, true, true]);
  const observed = run(trial3, { type: 'PUT_IN', objectId: 'wood' }, OUT, { type: 'PUT_IN', objectId: 'stone' });
  assert.equal(observed.phase, 'trial3-observed');
  const o = paramsOf(observed).objects;
  assert.deepEqual(OBJECT_IDS.map((id) => o[id].visible), [false, true, true], 'both are still there once observed');
  assert.equal(o.stone.where, 'tank'); assert.equal(o.stone.outcome, 'sink');
  assert.equal(o.wood.where, 'table'); assert.ok(o.wood.x + o.wood.w < TANK.x);
  assert.equal(o.wood.operable || o.stone.operable, false, 'and nothing can be touched');
  const wood = paramsOf(run(trial3, { type: 'PUT_IN', objectId: 'wood' })).objects;
  assert.equal(wood.stone.visible, true, 'the stone stays on the shelf while the wood is in the tank');
});

test('water and brine share one tank; only the liquid id differs', () => {
  const w = paramsOf(trial1), b = paramsOf({ ...structuredClone(trial1), liquidId: 'brine' });
  assert.deepEqual(w.tank, b.tank);
  assert.deepEqual(w.table, b.table);
  assert.equal(w.liquid.surfaceY, b.liquid.surfaceY);
  assert.equal(w.liquid.id, 'water'); assert.equal(b.liquid.id, 'brine');
  const bw = paramsOf(blockIn(3, 'water')).objects.block, bb = paramsOf(blockIn(3, 'brine')).objects.block;
  assert.equal(bw.w, bb.w); assert.equal(bw.h, bb.h);
  assert.notEqual(bw.outcome, bb.outcome, 'the same block, a different outcome: that comes from the engine');
});

test('operable follows the engine\'s controls, and each object has a hit box centred on it', () => {
  const t = paramsOf(trial1).objects.block;
  assert.equal(t.operable, true);
  near(t.hit.cx, t.x + t.w / 2, 'hit cx'); near(t.hit.cy, t.y + t.h / 2, 'hit cy');
  const inTank = paramsOf(blockIn(1)).objects.block;
  assert.equal(inTank.operable, true, 'in the tank it can be taken out');
  const switching = run(trial1, ADD, ADD, PUT, { type: 'RECORD_TRIAL', trial: 1 });
  assert.equal(paramsOf(switching).objects.block.operable, false, 'trial 2 waits for the liquid');
  assert.equal(paramsOf(run(switching, { type: 'SELECT_LIQUID', liquidId: 'brine' })).objects.block.operable, true);
});

test('every coordinate is a finite number, in every state of a whole run', () => {
  let s = createInitialState();
  const steps = [{ type: 'START' }, { type: 'BEGIN' }, ADD, PUT, OUT, ADD, PUT, OUT, ADD, PUT, OUT, ADD, PUT, { type: 'TAKE_OUT' }];
  for (const a of steps) { s = ok(s, a); finiteDeep(paramsOf(s)); }
  finiteDeep(paramsOf(trial3));
  finiteDeep(paramsOf(run(trial3, { type: 'PUT_IN', objectId: 'wood' })));
  finiteDeep(paramsOf(run(trial3, { type: 'PUT_IN', objectId: 'stone' })));
  for (let n = 0; n <= 6; n++) finiteDeep(ballastCells(n));
});

test('fail fast on an impossible request', () => {
  assert.throws(() => poseFor({ id: 'block', size: 70, where: 'tank', outcome: 'float', immersionFraction: 1 }), RangeError);
  assert.throws(() => poseFor({ id: 'block', size: 70, where: 'tank', outcome: 'float', immersionFraction: 0 }), RangeError);
  assert.throws(() => poseFor({ id: 'block', size: 70, where: 'tank', outcome: null }), RangeError);
  assert.throws(() => poseFor({ id: 'block', size: 70, where: 'tank', outcome: 'maybe' }), RangeError);
  const v = viewOf(blockIn(1));
  const broken = { ...v, facts: { ...v.facts, currentBlock: null } };
  assert.throws(() => visualParams(broken));
});

test('static guards: visual.js knows nothing of the engine or the model and decides nothing', () => {
  const code = fs.readFileSync(fileURLToPath(new URL('../assets/buoyancy-guided/visual.js', import.meta.url)), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  assert.ok(!/^\s*import\s/m.test(code), 'visual.js imports nothing');
  assert.ok(!/model\.js|engine\.js/.test(code));
  assert.ok(!/\bmassG\b|\bdensity\b|Density|\brelation\b|outcomeIn|blockOutcome|objectOutcome/.test(code), 'no mass, no density comparison, no physics call');
  const volumeLines = code.split('\n').filter((l) => /volumeCm3/.test(l));
  assert.equal(volumeLines.length, 1, 'volumeCm3 is read in exactly one place');
  assert.ok(/const volumeOf = /.test(volumeLines[0]));
  assert.ok(!/liquidId\s*[=!]==|liquid\.id\s*[=!]==|\.liquidId\s*\?|brine|water/.test(code.replace(/waterY|waterline|Waterline/g, '')), 'the liquid never decides an outcome');
  assert.ok(!/\bdocument\b|\bwindow\b|localStorage|innerHTML|createElement/.test(code), 'visual.js is not the DOM');
  assert.ok(!/[㐀-鿿]/.test(code), 'no wording');
  assert.ok(!/immersionFraction\s*[<>]=?\s*0\.\d|outcome\s*=\s*'(float|stay|sink)'\s*[;,]/.test(code), 'no outcome is assigned here');
});

test('static guards: render.js depends on visual.js only and never on physics, state or storage', () => {
  const src = fs.readFileSync(fileURLToPath(new URL('../assets/buoyancy-guided/render.js', import.meta.url)), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  const imports = [...src.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(imports, ['./visual.js']);
  assert.ok(!/localStorage|sessionStorage|reduce\(|deriveView|bhcsScienceTrack|gtag/.test(src));
  assert.ok(!/outcomeIn|\bdensity\b|massG|immersionFraction\s*[<>]/.test(src), 'render.js decides no physics');
  assert.ok(!/animationend|transitionend/.test(src), 'no phase waits for an animation');
});

console.log(`\nbuoyancy-guided visual: ${tests} tests passed`);
