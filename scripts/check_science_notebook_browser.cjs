// Browser QA on a local origin and synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const MIME = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const stations = {
  lever:'bhcs.lab.lever.v1', pulley:'bhcs.lab.pulley.v2', incline:'bhcs.lab.incline.v2',
  buoyancy:'bhcs.lab.buoyancy.v1', heat:'bhcs.lab.heat.v1', solubility:'bhcs.lab.solubility.v1',
  metal:'bhcs.lab.metal.v1', motion:'bhcs.lab.motion.v1',
  'electric-power':'bhcs.lab.electric-power.v2',
  'reaction-rate':'bhcs.lab.reaction-rate.v2',
  'spring-friction':'bhcs.lab.spring-friction.v1', neutralization:'bhcs.lab.neutralization.v1',
  mirror:'bhcs.lab.mirror.v1', lens:'bhcs.lab.lens.v1',
  'reflection-refraction':'bhcs.lab.reflection-refraction.v1', pressure:'bhcs.lab.pressure.v1',
  'friction-efficiency':'bhcs.lab.friction-efficiency.v1'
};
const harness = '/__notebook_test__';
const ready = 'html[data-notebook-ready="ready"]';
const warning = '[data-notebook-warning]:not([hidden])';
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === harness) return res.writeHead(200, {'Content-Type':'text/html'}).end('<!doctype html><title>Isolated notebook QA</title>');
  try {
    let file = path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream'}).end(fs.readFileSync(file));
  } catch { res.writeHead(404).end(); }
});

async function row(page, key) {
  return page.evaluate(key => new Promise((resolve, reject) => {
    const opening = indexedDB.open('bhcs.lab.notebooks.v1', 1);
    opening.onerror = () => reject(opening.error);
    opening.onsuccess = () => {
      const db = opening.result;
      const tx = db.transaction('notebooks', 'readonly');
      const get = tx.objectStore('notebooks').get(key);
      tx.oncomplete = () => { db.close(); resolve(get.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }), key);
}

async function clearDesk(page, station) {
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#clear-records').click();
}

async function waitForRow(page, key, matches, label, timeoutMs = 2500) {
  const until = Date.now() + timeoutMs;
  do {
    const actual = await row(page,key);
    if (matches(actual?.value)) return actual;
    await new Promise(resolve => setTimeout(resolve, 30));
  } while (Date.now() < until);
  throw Error(label + ': ' + key);
}

(async () => {
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    browser = await chromium.launch({headless: true,
      ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {})});
    const context = await browser.newContext({viewport:{width:390,height:840}});
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + harness);
    await page.evaluate(stations => {
      for (const key of Object.values(stations)) localStorage.setItem(key, JSON.stringify({qa: key}));
    }, stations);
    for (const [station, key] of Object.entries(stations)) {
      await page.goto(`${origin}/tools/lab/${station}/`);
      await page.locator(ready).waitFor({state:'attached'});
      await page.waitForFunction(() => document.readyState === 'complete');
      assert.deepEqual((await row(page,key)).value, {qa:key}, station + ' imports the legacy key');
      await clearDesk(page, station);
      await waitForRow(page, key, value => value === null, 'No durable reset');
      await page.reload();
      await page.locator(ready).waitFor({state:'attached'});
      assert.equal((await row(page,key)).value, null, station + ' stays cleared after reload');
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key), {qa:key}, station + ' keeps historical source intact');
    }
    assert.deepEqual(errors, []);

    // Two real browser tabs concurrently use the shared transaction adapter.
    const other = await context.newPage();
    const legacy = await context.newPage();
    for (const p of [page, other, legacy]) await p.goto(origin + harness);
    const key = stations['reaction-rate'];
    // Old release behavior: close/navigation writes its local snapshot unconditionally.
    await legacy.evaluate(key => window.addEventListener('pagehide',
      () => localStorage.setItem(key, JSON.stringify({step:1, legacyWriter:true}))), key);
    for (const p of [page, other]) {
      await p.evaluate(async key => {
        const { openNotebook } = await import('/tools/lab/shared/notebook.mjs');
        window.qaNotebook = await openNotebook(key);
      }, key);
    }
    const simultaneous = await Promise.all([page, other].map((p, i) =>
      p.evaluate(i => window.qaNotebook.save({step:2, writer:i}), i)));
    assert.equal(simultaneous.filter(Boolean).length, 1, 'only one simultaneous snapshot commits');
    const winner = simultaneous.indexOf(true), loser = 1 - winner;
    await [page,other][loser].locator(warning).waitFor({state:'visible'});
    assert.deepEqual((await row(page,key)).value, {step:2,writer:winner});
    await legacy.goto(origin + harness + '?away');
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).legacyWriter, true, 'old writer must actually run');
    assert.deepEqual((await row(page,key)).value, {step:2,writer:winner}, 'old writer cannot undo protected progress');
    // Refresh the losing client before exercising a fresh reset on the winning client.
    await [page, other][loser].evaluate(async key => {
      const { openNotebook } = await import('/tools/lab/shared/notebook.mjs');
      window.qaNotebook = await openNotebook(key);
    }, key);
    assert.equal(await [page,other][winner].evaluate(() => window.qaNotebook.clear()), true);
    assert.equal(await [page,other][loser].evaluate(() => window.qaNotebook.save({step:2,stale:true})), false);
    assert.equal((await row(page,key)).value,null,'stale save cannot revive reset');
    await legacy.evaluate(key => window.addEventListener('pagehide',
      () => localStorage.setItem(key, JSON.stringify({step:1, afterReset:true}))), key);
    await legacy.goto(origin + harness + '?again');
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).afterReset, true);
    assert.equal((await row(page,key)).value,null,'old writer cannot revive reset');

    // Real controls save progress on the public desks, including the prior regression.
    for (const p of [page, other]) {
      await p.goto(origin + '/tools/lab/motion/');
      await p.locator(ready).waitFor({state:'attached'});
      await p.waitForFunction(() => document.getElementById('task-title').textContent.trim().length > 0);
    }
    await other.locator('#time-slider').press('End');
    const motion = await waitForRow(other, stations.motion, value => value?.reached?.[0] === true, 'motion seek did not persist');
    await page.locator('#time-slider').press('ArrowRight');
    await page.locator(warning).waitFor({state:'visible'});
    assert.equal((await row(other, stations.motion)).value.t,motion.value.t,'stale motion page did not overwrite seek');
    await page.reload();
    await page.locator(ready).waitFor({state:'attached'});
    assert.equal(Number(await page.locator('#time-slider').inputValue()),motion.value.t);

    // Shared-engine desks: a tap in the scene saves state; reload restores it.
    await page.goto(origin + '/tools/lab/reaction-rate/');
    await page.locator(ready).waitFor({state:'attached'});
    await page.locator('#rig [data-drag=flask]').click();
    await waitForRow(page,key,value => value?.s?.t === 10,'reaction 10-second state did not persist',5000);
    await page.reload();
    await page.locator(ready).waitFor({state:'attached'});
    await page.waitForFunction(() => document.getElementById('r-1').textContent.trim() === '10');

    // Read existing data but simulate a denied write after the actual page boot.
    await page.goto(origin + '/tools/lab/electric-power/');
    await page.locator(ready).waitFor({state:'attached'});
    await page.locator('#rig [data-drag=timer]').click();
    await waitForRow(page, stations['electric-power'], value => value?.s?.time === 35, 'electric state did not persist', 5000);
    await page.reload();
    await page.locator(ready).waitFor({state:'attached'});
    await page.waitForFunction(() => /電能 210 J/.test(document.getElementById('n-3').textContent));
    await page.evaluate(() => { IDBObjectStore.prototype.put = () => { throw Error('test write denied'); }; });
    const before = await row(page, stations['electric-power']);
    await clearDesk(page, 'electric-power');
    await page.locator(warning).waitFor({state:'visible'});
    assert.equal(await page.locator(warning).getAttribute('role'), 'alert');
    assert.match(await page.locator(warning).innerText(), /無法清空|沒有重設/);
    assert.deepEqual(await row(page, stations['electric-power']), before, 'denied reset did not commit a new revision');
    assert.deepEqual(errors, []);
    // No supported protected store: never display or rewrite a legacy backup as current.
    await context.addInitScript(() => {
      Object.defineProperty(globalThis, 'indexedDB', {get(){throw Error('test database access denied');}});
      Object.defineProperty(navigator, 'locks', {value:undefined});
    });
    await page.goto(origin + '/tools/lab/reaction-rate/');
    await page.locator('html[data-notebook-ready="unavailable"]').waitFor({state:'attached'});
    await page.locator(warning).waitFor({state:'visible'});
    assert.match(await page.locator(warning).innerText(), /無法讀寫/);
    assert.match(await page.locator('#task-kicker').innerText(), /任務 1 \/ 5/);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).afterReset, key), true);
    assert.deepEqual(errors, []);
    await context.close();
    console.log('Notebook browser: ten resets, legacy isolation, tab race, live controls and denied write passed.');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode=1; });
