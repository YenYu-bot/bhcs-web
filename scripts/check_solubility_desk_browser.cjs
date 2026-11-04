'use strict';
// CI-only Chromium acceptance against the real deployed HTML/modules.
// No application imports/setters, synthetic UI events, forced clicks, or mock UI.
// addInitScript is restricted to storage fixtures/faults and read-only telemetry.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const VERSION = require('playwright/package.json').version;
const ROOT = path.resolve(__dirname, '..');
const ROUTE = '/tools/solubility-desk/';
const KEY = 'baihong-solubility-lab-v1';
const LEGACY = ['bhcs-science-v2-solubility', 'bhcs-science-v2-solubility-draft', 'bhcs-science-v2-solubility-guide'];
const SESSION_KEY = 'bhcs-researcher-screen:/tools/science/solubility.html';
const sentinel = key => 'untouched 原文\n' + key + ' {"value":null,"space":"  "}';
const OUT = path.resolve(process.env.SOLUBILITY_OUTPUT || 'solubility-desk-artifacts');
const results = [];
let browser, server, origin, nativeFixture;
fs.mkdirSync(OUT, {recursive: true});
const report = () => fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
const initial = {temperature: 20, water: 100, solute: 50};
// Independent classroom examples, not values imported from the application.
const lessons = [
  {state: initial, dissolved: '30', solid: '20', solution: '130', capacity: '30', concentration: '23.1', saturated: true},
  {state: {temperature: 60, water: 100, solute: 50}, dissolved: '50', solid: '0', solution: '150', capacity: '50', concentration: '33.3', saturated: true},
  {state: initial, dissolved: '30', solid: '20', solution: '130', capacity: '30', concentration: '23.1', saturated: true},
  {state: {temperature: 20, water: 120, solute: 50}, dissolved: '36', solid: '14', solution: '156', capacity: '36', concentration: '23.1', saturated: true},
  {state: {temperature: 20, water: 200, solute: 50}, dissolved: '50', solid: '0', solution: '250', capacity: '60', concentration: '20', saturated: false}
];

async function install(context, fault = {}) {
  await context.addInitScript(({key, legacy, sessionKey, fault}) => {
    if (location.protocol !== 'http:') return;
    const local = window.localStorage, session = window.sessionStorage;
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    const originals = {getItem: get, setItem: set, removeItem: Storage.prototype.removeItem, clear: Storage.prototype.clear};
    const value = k => 'untouched 原文\n' + k + ' {"value":null,"space":"  "}';
    // The fixture marker survives reload; a peer never rewrites existing sentinels.
    if (!get.call(session, 'solubility-browser-fixture')) {
      for (const k of legacy) if (get.call(local, k) === null) set.call(local, k, value(k));
      if (Object.hasOwn(fault, 'raw')) set.call(local, key, fault.raw);
      if (get.call(session, sessionKey) === null) set.call(session, sessionKey, value(sessionKey));
      set.call(session, 'solubility-browser-fixture', '1');
    }
    const qa = window.__solubilityQA = {access: [], input: [], storage: []};
    // Original reads inspect storage bytes without defeating faults in app reads.
    window.__solubilityRead = k => get.call(local, k);
    window.__solubilitySessionRead = k => get.call(session, k);
    for (const [name, original] of Object.entries(originals)) {
      Storage.prototype[name] = function (...args) {
        const area = this === local ? 'local' : this === session ? 'session' : null;
        const entry = {area, name, key: args[0], completed: false};
        if (area) qa.access.push(entry);
        if (this === local && args[0] === key) {
          if (name === 'getItem' && fault.read) throw new DOMException('Controlled QA read failure', 'SecurityError');
          if (name === 'setItem' && fault.write) throw new DOMException('Controlled QA write failure', fault.write);
        }
        const result = original.apply(this, args);
        entry.completed = true;
        return result;
      };
    }
    if (fault.property) Object.defineProperty(window, 'localStorage', {configurable: true, get() { throw new DOMException('Controlled QA property failure', 'SecurityError'); }});
    for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'click', 'keydown', 'input', 'change']) {
      document.addEventListener(type, event => {
        const node = event.target.closest?.('button,input,[role="tab"],summary');
        qa.input.push({type, trusted: event.isTrusted, pointer: event.pointerType, key: event.key, target: node?.id || node?.getAttribute('data-adjust') || node?.getAttribute('data-step') || node?.getAttribute('value') || node?.tagName, value: node?.value});
      }, true);
    }
    window.addEventListener('storage', event => qa.storage.push({key: event.key, trusted: event.isTrusted, newValue: event.newValue}));
  }, {key: KEY, legacy: LEGACY, sessionKey: SESSION_KEY, fault});
}
async function raw(page) { return page.evaluate(key => window.__solubilityRead(key), KEY); }
async function saved(page) { const value = await raw(page); assert.notEqual(value, null); return JSON.parse(value); }
async function text(page, selector) { return (await page.locator(selector).textContent()).replace(/\s+/g, ' ').trim(); }
async function tabTo(page, selector) {
  const target = page.locator(selector);
  for (let i = 0; i < 110; i++) {
    if (await target.evaluate(node => node === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Native Tab did not reach ' + selector);
}
async function action(page, selector, mode) {
  const target = page.locator(selector);
  assert.equal(await target.isVisible(), true, selector + ' is visible');
  assert.equal(await target.isEnabled(), true, selector + ' is enabled');
  const floor = await page.evaluate(() => window.__solubilityQA.input.length);
  if (mode === 'keyboard') { await tabTo(page, selector); await page.keyboard.press('Enter'); }
  else if (mode === 'touch') await target.tap();
  else await target.click();
  const events = await page.evaluate(n => window.__solubilityQA.input.slice(n), floor);
  assert.ok(events.some(e => e.type === 'click' && e.trusted), selector + ' received native activation');
  if (mode !== 'keyboard') assert.ok(events.some(e => e.type === 'pointerdown' && e.trusted && e.pointer === mode), selector + ' received ' + mode + ' pointer input');
}
async function free(page, mode) {
  if (await page.locator('#free-tab').getAttribute('aria-selected') === 'true') return;
  if (mode === 'keyboard') { await tabTo(page, '#guided-tab'); await page.keyboard.press('End'); }
  else await action(page, '#free-tab', mode);
  assert.equal(await page.locator('#free-panel').isVisible(), true);
  assert.equal(await page.locator('#free-tab').getAttribute('aria-selected'), 'true');
}
async function number(page, key, value, mode = 'mouse') {
  const selector = '#' + key + '-number';
  if (mode === 'keyboard') await tabTo(page, selector);
  else if (mode === 'touch') await page.locator(selector).tap();
  else await page.locator(selector).click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(String(value));
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(selector).inputValue(), String(value));
  assert.equal(await page.locator('#' + key).inputValue(), String(value));
}
async function stateIs(page, state) {
  for (const [key, value] of Object.entries(state)) {
    assert.equal(await page.locator('#' + key).inputValue(), String(value));
    assert.equal(await page.locator('#' + key + '-number').inputValue(), String(value));
  }
  assert.equal(await text(page, '#recipe-water'), state.water + ' g');
  assert.equal(await text(page, '#recipe-solute'), state.solute + ' g');
  assert.equal(await text(page, '#recipe-temperature'), state.temperature + '°C');
}
async function readings(page, row) {
  await stateIs(page, row.state);
  for (const field of ['dissolved', 'solid', 'solution']) assert.equal(await text(page, '#' + field + '-value'), row[field] + ' g');
  assert.equal(await text(page, '#water-value'), row.state.water + ' g');
  assert.equal(await text(page, '#svg-dissolved'), row.dissolved + ' g');
  assert.equal(await text(page, '#svg-solid'), row.solid + ' g');
  assert.equal(await text(page, '#mobile-dissolved'), row.dissolved + ' g');
  assert.equal(await text(page, '#mobile-solid'), row.solid + ' g');
  assert.equal(await text(page, '#mobile-concentration'), row.concentration + '%');
  assert.equal(await text(page, '#concentration'), row.concentration + '%');
  assert.equal(await text(page, '#capacity-value'), row.capacity + ' g');
  assert.equal(await text(page, '#fraction-top'), row.dissolved + ' g 已溶解的 A');
  assert.equal(await text(page, '#fraction-bottom'), row.state.water + ' g 水 ＋ ' + row.dissolved + ' g 已溶解的 A');
  assert.equal(await text(page, '#status'), row.saturated ? '飽和溶液' : '未飽和溶液');
  const visibleCrystals = await page.locator('#crystals > *').evaluateAll(nodes => nodes.filter(n => Number(n.getAttribute('opacity')) > 0).length);
  assert.equal(visibleCrystals > 0, Number(row.solid) > 0, 'visible solids agree with numerical solids');
}
async function geometry(page) {
  const g = await page.evaluate(() => ({
    width: innerWidth, root: document.documentElement.scrollWidth, body: document.body.scrollWidth,
    outliers: [...document.querySelectorAll('main button, main input, .workspace, .station, .controls-card, .insights, .record-card')].filter(node => {
      if (!node.getClientRects().length) return false;
      const r = node.getBoundingClientRect();
      return r.left < -1 || r.right > innerWidth + 1;
    }).map(node => ({id: node.id, className: node.className, rect: node.getBoundingClientRect().toJSON()}))
  }));
  assert.ok(g.root <= g.width + 1 && g.body <= g.width + 1, 'no horizontal page overflow: ' + JSON.stringify(g));
  assert.deepEqual(g.outliers, [], 'controls and cards fit the viewport');
  return g;
}
async function audit(page) {
  const a = await page.evaluate(() => window.__solubilityQA);
  for (const op of a.access) assert.ok(op.area === 'local' && op.key === KEY && ['getItem', 'setItem'].includes(op.name), 'only the new experiment key may be accessed: ' + JSON.stringify(op));
  assert.deepEqual(await page.evaluate(keys => keys.map(k => window.__solubilityRead(k)), LEGACY), LEGACY.map(sentinel));
  assert.equal(await page.evaluate(k => window.__solubilitySessionRead(k), SESSION_KEY), sentinel(SESSION_KEY));
  // The app intentionally forwards its native top-reset click to #reset.
  // All test actions themselves require a trusted activation in action().
  assert.ok(a.input.filter(e => !e.trusted).every(e => e.type === 'click' && e.target === 'reset'), 'only the app-owned top-reset forwarding click may be untrusted');
  return a;
}
async function shot(page, name) { await page.screenshot({path: path.join(OUT, name + '.png'), fullPage: true}); }
async function guided(page, run) {
  for (let i = 0; i < lessons.length; i++) {
    if (i) await action(page, '#next-step', run.mode);
    await readings(page, lessons[i]);
    assert.equal(await page.locator(`[data-step="${i}"]`).getAttribute('aria-current'), 'step');
    run.geometry = await geometry(page);
    await shot(page, run.name + '-step-' + (i + 1));
  }
  await action(page, '#prev-step', run.mode);
  await readings(page, lessons[3]);
  await action(page, '[data-step="1"]', run.mode);
  await readings(page, lessons[1]);
  await action(page, '#hint-toggle', run.mode);
  assert.equal(await page.locator('#hint-copy').isVisible(), true);
  await action(page, '#hint-toggle', run.mode);
  assert.equal(await page.locator('#hint-copy').isVisible(), false);
  await action(page, '#record', run.mode);
  assert.equal(await page.locator('.record-card').count(), 1);
  const before = await raw(page);
  nativeFixture = before;
  await page.reload({waitUntil: 'networkidle'});
  assert.equal(await raw(page), before, 'reload never changes stored bytes');
  await readings(page, lessons[1]);
  assert.equal(await page.locator('.record-card').count(), 1);
  assert.match(await text(page, '.record-card'), /33\.3%/);
}
async function dialogOpen(page, mode) {
  await action(page, '#reset-top', mode);
  assert.equal(await page.locator('#reset-dialog').isVisible(), true);
  assert.equal(await page.locator('#clear-records').isChecked(), false);
}
async function dialogClose(page) { await page.waitForFunction(() => !document.querySelector('#reset-dialog').open); }
async function resets(page, run) {
  await action(page, '#next-step', run.mode);
  await action(page, '#record', run.mode);
  const before = await raw(page);
  await dialogOpen(page, run.mode);
  await action(page, '#reset-dialog [value="cancel"]', run.mode);
  await dialogClose(page);
  assert.equal(await raw(page), before);
  await readings(page, lessons[1]);
  await dialogOpen(page, run.mode);
  await page.keyboard.press('Escape');
  await dialogClose(page);
  assert.equal(await raw(page), before);
  await readings(page, lessons[1]);
  await dialogOpen(page, run.mode);
  await action(page, '#confirm-reset', run.mode);
  await dialogClose(page);
  await readings(page, lessons[0]);
  assert.equal(await page.locator('.record-card').count(), 1);
  assert.equal((await saved(page)).records.length, 1);
  assert.equal(await page.locator('#undo').isDisabled(), true);
  await dialogOpen(page, run.mode);
  if (run.mode === 'keyboard') { await tabTo(page, '#clear-records'); await page.keyboard.press('Space'); }
  else if (run.mode === 'touch') await page.locator('#clear-records').tap();
  else await page.locator('#clear-records').click();
  assert.equal(await page.locator('#clear-records').isChecked(), true);
  await action(page, '#confirm-reset', run.mode);
  await dialogClose(page);
  await readings(page, lessons[0]);
  assert.equal(await page.locator('.record-card').count(), 0);
  assert.deepEqual((await saved(page)).records, []);
  await audit(page); // Old site local and session bytes survive confirmed clearing.
  await page.reload({waitUntil: 'networkidle'});
  await readings(page, lessons[0]);
  assert.equal(await page.locator('.record-card').count(), 0);
}
async function rangeNoChange(page) {
  const range = page.locator('#temperature');
  await range.scrollIntoViewIfNeeded();
  const box = await range.boundingBox();
  assert.ok(box);
  const floor = await page.evaluate(() => window.__solubilityQA.input.length);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  assert.equal(await range.inputValue(), '40', 'native pointerdown/up on midpoint leaves 40°C unchanged');
  const events = await page.evaluate(n => window.__solubilityQA.input.slice(n), floor);
  assert.ok(events.some(e => e.type === 'pointerdown' && e.target === 'temperature' && e.trusted));
  assert.ok(events.some(e => e.type === 'pointerup' && e.target === 'temperature' && e.trusted));
}
async function regression(page, run) {
  await free(page, run.mode);
  for (const method of ['numeric', 'plus']) {
    await number(page, 'temperature', 40);
    await rangeNoChange(page);
    if (method === 'numeric') await number(page, 'temperature', 50);
    else await action(page, '[data-adjust="temperature:10"]', 'mouse');
    assert.equal(await page.locator('#temperature').inputValue(), '50');
    await tabTo(page, '#temperature');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#temperature-number').inputValue(), '51');
    await action(page, '#undo', 'keyboard');
    assert.equal(await page.locator('#temperature-number').inputValue(), '50', method + ': 40 → no-change pointer → 50 → keyboard 51 → undo 50');
    assert.equal((await saved(page)).state.temperature, 50);
  }
}
async function protectedData(page, run, expectedRaw) {
  const recoveredCount = await page.locator('.record-card').count();
  assert.equal(await raw(page), expectedRaw);
  assert.match(await text(page, '#storage-note'), /損壞|不同版本|安全讀取/);
  await action(page, '#next-step', run.mode);
  await action(page, '#record', run.mode);
  assert.equal(await page.locator('.record-card').count(), recoveredCount + 1);
  assert.equal(await raw(page), expectedRaw);
  await dialogOpen(page, run.mode);
  assert.equal(await page.locator('#clear-records').isDisabled(), true);
  assert.equal(await page.locator('#reset-protection-note').isVisible(), true);
  await action(page, '#confirm-reset', run.mode);
  await dialogClose(page);
  await readings(page, lessons[0]);
  assert.equal(await page.locator('.record-card').count(), recoveredCount + 1);
  assert.equal(await raw(page), expectedRaw, 'reset cannot overwrite protected raw bytes');
  assert.equal((await audit(page)).access.filter(e => e.name === 'setItem').length, 0);
  await page.reload({waitUntil: 'networkidle'});
  assert.equal(await page.locator('.record-card').count(), recoveredCount, 'only originally recoverable records return on reload');
  assert.equal(await raw(page), expectedRaw);
}
async function run(name, width, height, mode, task, fault = {}) {
  const r = {name, width, height, mode, status: 'running', limits: {execution: 'authorized CI only',touch: 'Chromium trusted emulated touchscreen, not physical phone',storage: 'controlled API exceptions; native storage events for cross-tab synchronization'}};
  results.push(r); report();
  const context = await browser.newContext({viewport: {width, height}, isMobile: mode === 'touch', hasTouch: mode === 'touch', deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block'});
  await install(context, fault);
  const errors = [], external = [], httpErrors = [];
  const watch = p => {
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    p.on('response', response => {if (response.status() >= 400) httpErrors.push({url: response.url(), status: response.status()});});
    p.on('dialog', dialog => {errors.push('Unexpected dialog: ' + dialog.type()); void dialog.dismiss();});
  };
  context.on('page', watch);
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin !== origin) {external.push(route.request().url()); return route.abort();}
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    const response = await page.goto(origin + ROUTE, {waitUntil: 'networkidle'});
    assert.equal(response.status(), 200);
    assert.equal(response.url(), origin + ROUTE, 'direct dedicated URL, no redirect/fallback');
    await page.waitForFunction(() => document.querySelector('#observation strong'));
    await task(page, r);
    r.geometry = await geometry(page);
    r.audit = await audit(page);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, [], 'no third-party resource requests');
    assert.deepEqual(httpErrors, []);
    await shot(page, name);
    r.status = 'passed';
  } catch (error) {
    r.status = 'failed'; r.error = error.stack || String(error);
    r.evidence = await page.evaluate(() => ({url: location.href, active: document.activeElement?.outerHTML, storageNote: document.querySelector('#storage-note')?.textContent, qa: window.__solubilityQA})).catch(e => ({error: String(e)}));
    await shot(page, name + '-failure').catch(() => {});
  } finally {
    r.errors = errors; r.external = external; r.httpErrors = httpErrors;
    report(); await context.close();
  }
}

(async () => {
  assert.equal(process.env.CI, 'true', 'browser acceptance may run in authorized CI only');
  // Serve only this experiment. Decode before resolving, reject dot segments,
  // verify real paths against symlink escape, and bind exclusively to loopback.
  const appRoot = fs.realpathSync(path.join(ROOT, ROUTE));
  server = http.createServer((req, res) => {
    const finish = status => {res.writeHead(status, {'Cache-Control': 'no-store'}); res.end();};
    try {
      if (!['GET', 'HEAD'].includes(req.method)) return finish(405);
      const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (name === '/favicon.ico') return finish(204);
      if (!name.startsWith(ROUTE) || name.includes('\0') || name.includes('\\')) return finish(403);
      const relative = name.slice(ROUTE.length);
      if (relative.split('/').some(part => part === '..' || part === '.')) return finish(403);
      let file = path.resolve(appRoot, relative || 'index.html');
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      file = fs.realpathSync(file);
      if (!file.startsWith(appRoot + path.sep)) return finish(403);
      if (!fs.statSync(file).isFile()) return finish(404);
      const type = {'.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp'}[path.extname(file)];
      if (!type) return finish(403);
      res.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
    } catch {finish(404);}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({headless: true});
  fs.writeFileSync(path.join(OUT, 'environment.json'), JSON.stringify({node: process.version, playwright: VERSION, chromium: browser.version(), route: ROUTE, mode: 'headless real Chromium'}, null, 2));
  for (const [width, height, mode] of [[1280,900,'mouse'],[1280,900,'keyboard'],[390,844,'touch'],[320,740,'touch']]) await run(`guided-${width}-${mode}`, width, height, mode, guided);
  for (const [width, height, mode] of [[1280,900,'keyboard'],[390,844,'touch'],[320,740,'touch']]) await run(`reset-${width}-${mode}`, width, height, mode, resets);
  await run('free-keyboard-tabs-inputs-undo', 1280, 900, 'keyboard', async (p, r) => {
    await free(p, r.mode);
    await p.keyboard.press('ArrowLeft');
    assert.equal(await p.locator('#guided-tab').getAttribute('aria-selected'), 'true');
    await p.keyboard.press('ArrowRight');
    assert.equal(await p.locator('#free-tab').getAttribute('aria-selected'), 'true');
    await number(p, 'temperature', 40, r.mode);
    await action(p, '[data-adjust="temperature:10"]', r.mode);
    assert.equal(await p.locator('#temperature').inputValue(), '50');
    await action(p, '#undo', r.mode);
    assert.equal(await p.locator('#temperature').inputValue(), '40');
    await tabTo(p, '#temperature'); await p.keyboard.press('ArrowRight');
    assert.equal(await p.locator('#temperature-number').inputValue(), '41');
    await action(p, '#undo', r.mode);
    assert.equal(await p.locator('#temperature-number').inputValue(), '40');
    await number(p, 'water', 161, r.mode); await number(p, 'solute', 33, r.mode);
    await stateIs(p, {temperature: 40, water: 161, solute: 33});
  });
  await run('no-change-range-numeric-plus-key-undo', 1280, 900, 'mouse', regression);
  for (const [width, height] of [[390,844],[320,740]]) await run(`boundary-touch-${width}`, width, height, 'touch', async (p, r) => {
    await free(p, r.mode);
    await number(p, 'temperature', 1, r.mode); await number(p, 'water', 161, r.mode); await number(p, 'solute', 33, r.mode);
    await readings(p, {state: {temperature: 1, water: 161, solute: 33}, dissolved: '33', solid: '0', solution: '194', capacity: '33.005', concentration: '17', saturated: false});
    assert.equal(await text(p, '#capacity-answer'), '還有 0.005 g 的溶解空間，是未飽和。');
    assert.match(await text(p, '#observation'), /還能再溶解 0\.005 g/);
    await action(p, '[data-adjust="temperature:10"]', r.mode);
    assert.equal(await p.locator('#temperature').inputValue(), '11');
    await action(p, '[data-adjust="temperature:-10"]', r.mode);
    assert.equal(await p.locator('#temperature').inputValue(), '1');
    await action(p, '[data-adjust="temperature:10"]', r.mode);
    await action(p, '#undo', r.mode);
    assert.equal(await p.locator('#temperature').inputValue(), '1', 'mobile undo is visible and restores the last change');
    await action(p, '#record', r.mode);
    assert.match(await text(p, '.record-card'), /17%.*未飽和/s);
  });
  await run('empty-null-storage', 390, 844, 'touch', async (p, r) => {
    assert.equal(await raw(p), null); await readings(p, lessons[0]);
    await action(p, '#record', r.mode); assert.equal((await saved(p)).records.length, 1);
  });
  assert.ok(nativeFixture, 'valid-v1 fixture must come from native UI recording');
  await run('valid-v1-restoration', 390, 844, 'touch', async p => {
    assert.equal(await raw(p), nativeFixture); await readings(p, lessons[1]);
    assert.equal(await p.locator('.record-card').count(), 1);
  }, {raw: nativeFixture});
  for (const [label, value] of [['json-null','null'],['malformed','{broken 原文\n  '],['future', JSON.stringify({version: 999, state: initial, retain: 'future 原文'})]]) {
    await run('protected-' + label, 390, 844, 'touch', (p, r) => protectedData(p, r, value), {raw: value});
  }
  const partialRecords = JSON.stringify({version: 1, state: initial, step: 0, mode: 'guided', records: [{state: initial, number: 1}, null, {state: lessons[4].state, number: 3}]});
  await run('protected-partial-records-with-null', 390, 844, 'touch', async (p, r) => {
    assert.equal(await p.locator('.record-card').count(), 2, 'recover valid records on both sides of null');
    assert.match(await text(p, '.record-card:first-child'), /23\.1%/);
    assert.match(await text(p, '.record-card:last-child'), /20%/);
    await protectedData(p, r, partialRecords);
  }, {raw: partialRecords});
  const unknownField = JSON.stringify({...JSON.parse(nativeFixture), unknownField: {retain: 'unknown 原文', version: 2}});
  await run('protected-v1-unknown-field', 390, 844, 'touch', (p, r) => protectedData(p, r, unknownField), {raw: unknownField});
  await run('eight-record-limit-delete-and-refill', 320, 740, 'touch', async (p, r) => {
    for (let i = 1; i <= 8; i++) {
      await action(p, '#record', r.mode);
      assert.equal(await p.locator('.record-card').count(), i);
    }
    assert.equal(await p.locator('#record').isDisabled(), true);
    assert.equal((await saved(p)).records.length, 8);
    await action(p, '.record-card:first-child button', r.mode);
    assert.equal(await p.locator('.record-card').count(), 7);
    assert.equal(await p.locator('#record').isEnabled(), true);
    await action(p, '#record', r.mode);
    assert.equal(await p.locator('.record-card').count(), 8);
    assert.equal(await p.locator('#record').isDisabled(), true);
    await p.reload({waitUntil: 'networkidle'});
    assert.equal(await p.locator('.record-card').count(), 8);
    assert.equal(await p.locator('#record').isDisabled(), true);
  });
  await run('numeric-boundaries-and-empty-blur', 1280, 900, 'keyboard', async (p, r) => {
    await free(p, r.mode);
    for (const [key, input, expected] of [['temperature','999','80'],['water','1','50'],['solute','999','150']]) {
      await tabTo(p, '#' + key + '-number');
      await p.keyboard.press('ControlOrMeta+A'); await p.keyboard.type(input); await p.keyboard.press('Tab');
      assert.equal(await p.locator('#' + key + '-number').inputValue(), expected, key + ' clamps on blur');
      assert.equal(await p.locator('#' + key).inputValue(), expected);
    }
    await stateIs(p, {temperature: 80, water: 50, solute: 150});
    for (const key of ['temperature','water','solute']) {
      const before = await raw(p), value = await p.locator('#' + key + '-number').inputValue();
      await tabTo(p, '#' + key + '-number'); await p.keyboard.press('ControlOrMeta+A'); await p.keyboard.press('Backspace');
      assert.equal(await p.locator('#' + key + '-number').inputValue(), '');
      await p.keyboard.press('Tab');
      assert.equal(await p.locator('#' + key + '-number').inputValue(), value, key + ' empty input restores its previous value');
      assert.equal(await raw(p), before, 'empty input does not persist an invalid or zero state');
    }
  });
  for (const exception of ['QuotaExceededError','SecurityError']) await run('write-' + exception, 390, 844, 'touch', async (p, r) => {
    const before = await raw(p); await action(p, '#next-step', r.mode); await action(p, '#record', r.mode);
    await readings(p, lessons[2]);
    assert.equal(await p.locator('.record-card').count(), 2);
    assert.equal(await raw(p), before);
    assert.match(await text(p, '#storage-note'), /未能儲存/);
    await dialogOpen(p, r.mode); assert.equal(await p.locator('#clear-records').isDisabled(), true);
    await action(p, '#confirm-reset', r.mode); await dialogClose(p);
    assert.equal(await raw(p), before);
    await p.reload({waitUntil: 'networkidle'}); await readings(p, lessons[1]);
    assert.equal(await p.locator('.record-card').count(), 1);
  }, {raw: nativeFixture, write: exception});
  for (const fault of [{read: true}, {property: true}]) await run(fault.read ? 'read-security-error' : 'storage-property-security-error', 320, 740, 'touch', async (p, r) => {
    const before = await raw(p); await readings(p, lessons[0]);
    assert.match(await text(p, '#storage-note'), /不允許讀取/);
    await action(p, '#next-step', r.mode); await action(p, '#record', r.mode);
    await readings(p, lessons[1]); assert.equal(await raw(p), before);
    assert.equal((await audit(p)).access.filter(e => e.name === 'setItem').length, 0);
  }, {raw: nativeFixture, ...fault});
  await run('cross-tab-native-record-sync', 1280, 900, 'mouse', async (p, r) => {
    await action(p, '#next-step', r.mode); await action(p, '#record', r.mode);
    const peer = await p.context().newPage(); peer.setDefaultTimeout(10000);
    await peer.goto(origin + ROUTE, {waitUntil: 'networkidle'});
    assert.equal(await peer.locator('.record-card').count(), 1);
    await action(peer, '[data-step="4"]', 'mouse');
    await action(peer, '#record', 'mouse');
    await p.waitForFunction(() => document.querySelectorAll('.record-card').length === 2);
    await readings(p, lessons[1]); // Incoming records must not replace this cup.
    assert.match(await text(p, '#live-status'), /紀錄已同步/);
    assert.ok((await p.evaluate(() => window.__solubilityQA.storage)).some(e => e.key === KEY && e.trusted), 'native cross-tab storage event observed');
    await action(p, '#record', 'mouse');
    await peer.waitForFunction(() => document.querySelectorAll('.record-card').length === 3);
    await readings(peer, lessons[4]);
    assert.deepEqual((await saved(p)).records.map(x => x.state.temperature), [60,20,60]);
    await action(peer, '.record-card:first-child button', 'mouse');
    await p.waitForFunction(() => document.querySelectorAll('.record-card').length === 2);
    r.peerAudit = await audit(peer); await peer.close();
  });
  assert.equal(results.length, 25, 'all expected scenarios execute without silent skips');
  assert.ok(results.every(r => r.status === 'passed'), results.filter(r => r.status !== 'passed').map(r => r.name + ': ' + r.error).join('\n'));
})().catch(error => {
  fs.writeFileSync(path.join(OUT, 'fatal-error.txt'), error.stack || String(error));
  console.error(error); process.exitCode = 1;
}).finally(async () => {
  report(); await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
