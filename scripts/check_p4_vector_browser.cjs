// Capture all difficulty × worksheet versions for P4 vectorcauchy review.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.P4_VECTOR_OUTPUT || 'p4-vector-artifacts');
const url = 'file://' + path.join(root, 'tools/math/g11-drills.html') + '?topic=vectorcauchy';

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch();
  const results = [];
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    for (const level of ['basic', 'advanced', 'challenge']) {
      await page.locator(`button.level[data-level="${level}"]`).click();
      await page.evaluate(() => {
        for (const input of document.querySelectorAll('.unit-check')) {
          input.checked = input.dataset.unit === 'cauchy';
          document.querySelector(`[data-count="${input.dataset.unit}"]`).disabled = !input.checked;
        }
        document.querySelector('[data-count="cauchy"]').value = '12';
        for (const input of document.querySelectorAll('[data-mode]')) input.checked = input.dataset.mode === 'integer';
      });
      await page.locator('#generate').click();
      assert.equal(await page.locator('.prob').count(), 12, `${level}: 12 questions`);
      assert.match(await page.locator('#status').innerText(), /逐題驗證完成/);
      for (const version of ['student', 'teacher']) {
        await page.locator('#version').selectOption(version);
        assert.equal(await page.locator(`.sheet.${version}`).count(), 1);
        assert.equal(await page.locator('.prob .ans').count(), 12);
        const geometry = await page.evaluate(() => {
          const sheet = document.querySelector('.sheet'), box = sheet.getBoundingClientRect();
          return {sheetWidth: Math.round(box.width), viewport: innerWidth,
            bodyScrollWidth: document.documentElement.scrollWidth,
            sheetScrollWidth: sheet.scrollWidth, sheetClientWidth: sheet.clientWidth};
        });
        assert.ok(geometry.sheetWidth <= geometry.viewport, `${level}/${version}: screen sheet overflow`);
        assert.ok(geometry.sheetScrollWidth <= geometry.sheetClientWidth + 2,
          `${level}/${version}: worksheet content overflow`);
        await page.screenshot({path: path.join(out, `${level}-${version}-1280.png`), fullPage: true});
        await page.emulateMedia({media: 'print'});
        await page.pdf({path: path.join(out, `${level}-${version}-A4.pdf`),
          format: 'A4', printBackground: true});
        await page.emulateMedia({media: 'screen'});
        results.push({level, version, questions: 12, geometry});
      }
    }
    await page.setViewportSize({width: 390, height: 844});
    for (const version of ['student', 'teacher']) {
      await page.locator('#version').selectOption(version);
      await page.screenshot({path: path.join(out, `challenge-${version}-390.png`), fullPage: true});
    }
    assert.deepEqual(errors, [], 'browser runtime errors');
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({errors, results}, null, 2));
    console.log(JSON.stringify({screenshots: 8, pdfs: 6, results}));
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
