import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ELECTRON_VIEWS, electronViewState, renderElectronScene } from '../../tools/metal-activity-desk/electron-view.mjs';
import { freshSession, restoreSession } from '../../tools/metal-activity-desk/session.mjs';

const scenes = [0, 1, 2].map(step => renderElectronScene(step));
const mapOf = scene => scene.match(/<svg class="electron-map"[\s\S]*?<\/svg>/)?.[0];
const plain = text => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const particlesOf = scene => [...mapOf(scene).matchAll(/<g class="ep ([^"]+)" transform="translate\(([-\d.]+) ([-\d.]+)\)"><circle r="([\d.]+)"\/><text[^>]*>([^<]+)<\/text>/g)]
  .map(([, kind, x, y, r, species]) => ({ kind, x: +x, y: +y, r: +r, species }));
const tracked = (scene, prefix) => particlesOf(scene).filter(p => p.kind.startsWith(prefix));
const boundaryOf = scene => {
  const match = mapOf(scene).match(/<path d="M0 ([\d.]+) H([\d.]+) V([\d.]+) H0Z" fill="url\(#et-metal\)"/);
  assert.ok(match, 'the illustration must define a metal region with a visible contact boundary');
  return { top: +match[1], right: +match[2], bottom: +match[3] };
};

test('electron view has three nonempty, distinct, freely addressable stages', () => {
  assert.equal(ELECTRON_VIEWS.length, 3);
  for (const [index, view] of ELECTRON_VIEWS.entries()) {
    assert.equal(electronViewState(index).index, index);
    for (const field of ['tab', 'title', 'summary', 'alt', 'zinc', 'copper']) {
      assert.equal(typeof view[field], 'string');
      assert.ok(view[field].trim(), `${index}.${field} needs meaningful content`);
    }
    assert.match(scenes[index], new RegExp(`et-step-${index} track-both`));
  }
  for (const field of ['tab', 'title', 'alt']) assert.equal(new Set(ELECTRON_VIEWS.map(v => v[field])).size, 3);
});

test('invalid view parameters normalize without coercion or markup injection', () => {
  const refusesCoercion = { toString() { throw new Error('must not coerce input'); } };
  const invalid = [-1, 3, 0.1, NaN, Infinity, '2', null, {}, [], ['1'], Symbol('step'), refusesCoercion, '<img src=x onerror=alert(1)>'];
  for (const step of invalid) {
    assert.equal(electronViewState(step).index, 0);
    assert.equal(renderElectronScene(step), scenes[0]);
  }
  for (const track of invalid.concat(['both', 'Zn', 'Copper', '__proto__'])) {
    assert.equal(electronViewState(1, track).track, 'both');
    assert.equal(renderElectronScene(1, track), scenes[1]);
  }
  assert.equal(renderElectronScene(), scenes[0]);
});

test('every stage conserves particle identities instead of turning copper into zinc', () => {
  const inventory = scene => particlesOf(scene).reduce((counts, p) => {
    const element = p.species.replace(/[²⁺]/g, '');
    counts[element] = (counts[element] || 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(inventory(scenes[0]), { Zn: 8, Cu: 1 });
  for (const scene of scenes) {
    assert.deepEqual(inventory(scene), inventory(scenes[0]));
    assert.equal(tracked(scene, 'ep-zinc').length, 1);
    assert.equal(tracked(scene, 'ep-copper').length, 1);
    assert.deepEqual(particlesOf(scene).filter(p => p.kind === 'ep-lattice'), particlesOf(scenes[0]).filter(p => p.kind === 'ep-lattice'));
    assert.equal((mapOf(scene).match(/class="ep-index"/g) || []).length, 2);
  }
  assert.deepEqual(scenes.map(scene => tracked(scene, 'ep-zinc')[0].species), ['Zn', 'Zn', 'Zn²⁺']);
  assert.deepEqual(scenes.map(scene => tracked(scene, 'ep-copper')[0].species), ['Cu²⁺', 'Cu²⁺', 'Cu']);
});

test('Cu ion and deposit share one surface contact while Zn ion enters solution separately', () => {
  const boundary = boundaryOf(scenes[0]);
  const copperBefore = tracked(scenes[0], 'ep-copper')[0];
  const zincBefore = tracked(scenes[0], 'ep-zinc')[0];
  for (const scene of scenes) {
    assert.deepEqual(boundaryOf(scene), boundary, 'the contact surface must not jump between stages');
    const copper = tracked(scene, 'ep-copper')[0];
    assert.deepEqual([copper.x, copper.y, copper.r], [copperBefore.x, copperBefore.y, copperBefore.r]);
    assert.equal(copper.y + copper.r, boundary.top, 'Cu must touch the metal, not float in bulk solution');
    assert.ok(copper.x - copper.r >= 0 && copper.x + copper.r <= boundary.right);
  }
  const zincDuring = tracked(scenes[1], 'ep-zinc')[0];
  assert.deepEqual([zincDuring.x, zincDuring.y], [zincBefore.x, zincBefore.y]);
  assert.ok(zincBefore.y >= boundary.top && zincBefore.y < boundary.bottom);
  assert.ok(zincBefore.x > 0 && zincBefore.x < boundary.right);
  const zincAfter = tracked(scenes[2], 'ep-zinc')[0];
  assert.equal(zincAfter.x, zincBefore.x, 'the departed Zn retains a traceable source position');
  assert.ok(zincAfter.y + zincAfter.r < boundary.top, 'Zn²⁺ belongs in solution');
  assert.notEqual(zincAfter.x, copperBefore.x, 'the two element tracks must not be swapped');
  const vacancy = mapOf(scenes[2]).match(/<circle class="vacancy" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/);
  assert.ok(vacancy);
  assert.deepEqual(vacancy.slice(1).map(Number), [zincBefore.x, zincBefore.y, zincBefore.r]);
  for (const scene of scenes.slice(0, 2)) assert.doesNotMatch(mapOf(scene), /class="vacancy"/);
});

test('only the transfer stage has exactly two electrons and its arrow stays inside metal', () => {
  for (const scene of [scenes[0], scenes[2]]) assert.doesNotMatch(mapOf(scene), /class="electron-route"|class="electron-pair"/);
  const map = mapOf(scenes[1]);
  const pair = map.match(/<g class="electron-pair">([\s\S]*?)<\/g>/);
  assert.ok(pair);
  const electronCircles = [...pair[1].matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map(m => m.slice(1).map(Number));
  assert.equal(electronCircles.length, 2);
  assert.equal((pair[1].match(/>−<\/text>/g) || []).length, 2);
  assert.match(map, /class="map-transfer"[^>]*>2e⁻<\/text>/);
  const boundary = boundaryOf(scenes[1]);
  const insideMetal = (x, y) => x >= 0 && x <= boundary.right && y >= boundary.top && y <= boundary.bottom;
  for (const [x, y, r] of electronCircles) {
    assert.ok(insideMetal(x - r, y - r));
    assert.ok(insideMetal(x + r, y + r));
  }
  const route = map.match(/<g class="electron-route"><path d="M([\d.]+) ([\d.]+) H([\d.]+) Q([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"[^>]*marker-end="url\(#et-arrow\)"/);
  assert.ok(route, 'a short directed route must connect metal to the contact');
  const [x0, y0, x1, cx, cy, x2, y2] = route.slice(1).map(Number);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, u = 1 - t;
    assert.ok(insideMetal(x0 + (x1 - x0) * t, y0), 'straight section cannot enter bulk solution');
    assert.ok(insideMetal(u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y0 + 2 * u * t * cy + t * t * y2), 'curved section cannot enter bulk solution');
  }
  const zinc = tracked(scenes[1], 'ep-zinc')[0], copper = tracked(scenes[1], 'ep-copper')[0];
  assert.ok(Math.abs(x0 - (zinc.x + zinc.r)) <= 10 && Math.abs(y0 - zinc.y) <= 5, 'route starts beside surface Zn');
  assert.ok(Math.hypot(x2 - copper.x, y2 - (copper.y + copper.r)) <= 5, 'route ends at contacting Cu²⁺');
  assert.ok(x2 - x0 < boundary.right / 2, 'the electron route stays local');
});

test('paired balanced half-equations remain together and final net reaction contains no electrons', () => {
  for (const scene of scenes) {
    const equations = [...scene.matchAll(/<(?:button|div) class="electron-track [^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>/g)].map(m => plain(m[1]));
    assert.deepEqual(equations, ['Zn → Zn²⁺ + 2e⁻', 'Cu²⁺ + 2e⁻ → Cu']);
    assert.match(scene, /氧化/);
    assert.match(scene, /還原/);
  }
  for (const scene of scenes.slice(0, 2)) assert.doesNotMatch(scene, /class="electron-net"/);
  const net = scenes[2].match(/<div class="electron-net">[\s\S]*?<strong>([^<]+)<\/strong>/)?.[1];
  assert.equal(net, 'Zn + Cu²⁺ → Zn²⁺ + Cu');
  assert.doesNotMatch(net, /e[⁻-]/);
  assert.match(scenes[2], /兩邊各有 2e⁻，相消後不寫進總反應式/);
  assert.match(scenes[2], /Cu²⁺ 減少時，溶液藍色變淡/);
});

test('qualitative-model boundaries explicitly omit water and spectator sulfate', () => {
  for (const scene of scenes) {
    assert.match(scene, /硫酸根 SO₄²⁻ 是旁觀離子/);
    assert.match(scene, /水分子也未畫出/);
    assert.match(scene, /不代表實際比例、數量、速度或逐格反應機制/);
    assert.match(scene, /氧化與還原相伴發生/);
    assert.match(scene, /沒有外接導線/);
    assert.match(scene, /沒有把自由電子存進整杯溶液中/);
    assert.match(scene, /<details class="electron-boundary"><summary>這張圖省略了什麼？<\/summary>/);
  }
  assert.match(scenes[1], /不是電子在溶液中的實際路徑/);
  assert.match(scenes[1], /不是游動路徑/);
  assert.match(scenes[2], /銅元素沒有變成鋅，鋅元素也沒有變成銅/);
});

test('each stage has an accessible named diagram and native toggle buttons with correct state', () => {
  for (let step = 0; step < 3; step++) for (const track of ['both', 'zinc', 'copper']) {
    const scene = renderElectronScene(step, track), map = mapOf(scene);
    assert.match(map, /role="img"/);
    assert.equal(map.match(/aria-label="([^"]+)"/)?.[1], ELECTRON_VIEWS[step].alt);
    assert.match(scene, /<svg viewBox="0 0 160 162" aria-hidden="true">/, 'decorative beaker must not duplicate the main accessible image');
    assert.match(scene, /role="group" aria-label="追蹤電子轉移中的元素"/);
    assert.match(scene, /<figcaption role="status">/);
    const buttons = [...scene.matchAll(/<button ([^>]*data-acid-action="electron-track"[^>]*)>([\s\S]*?)<\/button>/g)];
    assert.equal(buttons.length, 2);
    for (const [i, element] of ['zinc', 'copper'].entries()) {
      const attributes = buttons[i][1];
      assert.match(attributes, /data-acid-action="electron-track"/);
      assert.match(attributes, new RegExp(`data-value="${element}"`));
      assert.match(attributes, new RegExp(`aria-pressed="${track === element}"`));
      assert.match(plain(buttons[i][2]), i === 0 ? /鋅/ : /銅/, 'button needs an element name, not only color');
      assert.doesNotMatch(attributes, /\bdisabled\b|tabindex="-1"/);
    }
  }
});

test('element highlighting is view-only and never changes geometry or reaction species', () => {
  for (let step = 0; step < 3; step++) {
    const base = renderElectronScene(step);
    for (const track of ['zinc', 'copper']) {
      const scene = renderElectronScene(step, track);
      assert.match(scene, new RegExp(`track-${track}`));
      assert.equal(mapOf(scene), mapOf(base));
      const note = scene.match(/<figcaption role="status">([^<]+)<\/figcaption>/)?.[1];
      assert.equal(note, `${track === 'zinc' ? 1 : 2} ${ELECTRON_VIEWS[step][track]}`);
    }
  }
});

test('rendering remains pure and deterministic across arbitrary stage and track order', () => {
  const viewsBefore = structuredClone(ELECTRON_VIEWS);
  const state = freshSession(), before = structuredClone(state);
  for (const step of [0, 2, 1, 0, 2, 2, 1]) for (const track of ['copper', 'both', 'zinc', 'both']) {
    assert.equal(renderElectronScene(step, track), renderElectronScene(step, track));
    assert.deepEqual(ELECTRON_VIEWS, viewsBefore);
    assert.deepEqual(state, before);
    const view = electronViewState(step, track);
    view.title = 'caller-local change';
    assert.deepEqual(ELECTRON_VIEWS, viewsBefore, 'returned view state must not expose a mutable shared object');
  }
});

test('renderer integration preserves existing lesson storage schema and local-only tracking', async () => {
  const ui = await readFile(new URL('../../tools/metal-activity-desk/acid-ui.mjs', import.meta.url), 'utf8');
  const html = await readFile(new URL('../../tools/metal-activity-desk/index.html', import.meta.url), 'utf8');
  assert.match(ui, /import \{renderElectronScene,ELECTRON_VIEWS\} from '\.\/electron-view\.mjs'/);
  assert.match(ui, /renderElectronScene\(l\.electronStep,electronTrack\)/);
  assert.match(html, /href="electron\.css"/);
  const handler = ui.match(/if\(a==='electron-track'\)\{([^}]+)\}/)?.[1];
  assert.ok(handler);
  assert.match(handler, /electronTrack===v\?'both':v/);
  assert.match(handler, /render\(\)/);
  assert.doesNotMatch(handler, /commit|update|localStorage|records|connections/);
  assert.match(ui, /resetView\(\)[\s\S]*electronTrack='both'/);
  for (const electronStep of [0, 2, 1, 0]) {
    const state = freshSession();
    state.lesson.electronOpen = true;
    state.lesson.electronStep = electronStep;
    const restored = restoreSession(JSON.stringify(state));
    assert.ok(restored);
    assert.equal(restored.lesson.electronStep, electronStep);
    assert.equal(restored.lesson.electronOpen, true);
    assert.equal(restored.lesson.electronTrack, undefined);
    assert.deepEqual(restored.records, state.records);
    assert.deepEqual(restored.connections, state.connections);
  }
});
