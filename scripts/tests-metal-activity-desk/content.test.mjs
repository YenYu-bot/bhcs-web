import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../../tools/metal-activity-desk/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../../tools/metal-activity-desk/app.mjs', import.meta.url), 'utf8');

test('the visible model disclaimer rejects quantitative timing and amount interpretations', () => {
  assert.match(html, /動畫與顏色是定性示意/);
  assert.match(html, /不代表實際反應時間、快慢或析出量/);
  assert.match(html, /比例、時間與析出量不作比較/);
  assert.match(app, /定性示意・非計時/);
  assert.match(app, /動畫不代表反應速度/);
});

test('the teaching content explicitly limits conclusions to what these experiments test', () => {
  assert.match(html, /收集足夠證據後才連出/);
  assert.match(html, /先選一張紀錄，再點它能支持的關係/);
  assert.match(html, /未見變化本身不足以單獨確定兩種金屬的先後/);
  assert.match(html, /灰色至灰黑色析出物/);
  assert.match(html, /不能只憑顏色判斷/);
  assert.match(html, /完成的杯子會收進紀錄，不會被下一杯蓋掉/);
});

test('the private prototype explains browser-only persistence and supervised waste handling', () => {
  assert.match(html, /紀錄只保存在目前裝置的瀏覽器，不上傳/);
  assert.match(html, /未播完的動畫會暫停/);
  assert.match(html, /老師指導下戴好護目鏡/);
  assert.match(html, /不接觸或飲用溶液/);
  assert.match(html, /回收含金屬離子的廢液/);
});
