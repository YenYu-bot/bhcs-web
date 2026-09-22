import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs/p2-math-validation');
const old = JSON.parse(fs.readFileSync(path.join(dir, 'legacy-observations.json')));
const revised = JSON.parse(fs.readFileSync(process.env.MATH_REPORT || path.join(root, 'math-validation-artifacts/results.json')));
const key = r => [r.link, r.unit, r.level, r.mode].join('|');
const current = new Map(revised.combinations.map(r => [key(r), r]));
const baseline = JSON.parse(fs.readFileSync(path.join(dir, 'baseline-failures.json')));
assert.equal(old.combinations.length, 431);
assert.deepEqual(new Set(old.combinations.map(key)), new Set(baseline.map(key)));
assert.equal(current.size, 1740);

// Report-only source evidence. Never imported by test_math_drills or used to exempt a test.
function finiteEvidence(r) {
  if (r.link === 'g10-drills.html?topic=multiplication' && r.mode === 'integer') {
    if (r.unit === 'cubefactor') return {size: 8, proof: 'a,b ∈ {1,2}; plus ∈ {false,true}: 2×2×2=8'};
    if (r.unit === 'chain') return {size: r.level === 'challenge' ? 10 : 9,
      proof: 'short: a,b ∈ {1,2,3}, 9; challenge adds exactly a=b=1,long=true, 1'};
  }
  if (r.link === 'g11-drills.html?topic=commonlog' && r.unit === 'definition' && r.mode === 'fraction')
    return {size: 30, proof: 'base ∈ {2,3,5,7,10}; e ∈ {-1,0,1,2,3,4}: 5×6=30'};
  return null;
}
const labels = {1: '舊 200 題去重假失敗', 2: 'verify() 不過', 3: '回傳 null／50 次重試耗盡', 4: '例外'};
const rows = old.combinations.map(previous => {
  const now = current.get(key(previous)); assert.ok(now, key(previous));
  const evidence = finiteEvidence(previous);
  // Precedence removes double counting; all underlying counters remain in the CSV/evidence.
  const category = previous.exceptions ? 4 : previous.rejectedVerify ? 2 : previous.rejectedNull ? 3 :
    now.pass || evidence ? 1 : 3;
  return {previous, now, category, evidence};
});
const totals = Object.fromEntries([1,2,3,4].map(c => [c, rows.filter(r => r.category === c).length]));
assert.equal(Object.values(totals).reduce((a,b) => a+b), 431);
const csv = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const fields = ['category','link','unit','name','level','mode','legacySeed','legacyGenerated','legacyNulls','legacyVerifyFalse','legacyExceptions','revisedPass','rawCalls','rawNulls','rawVerifyFalse','rawExceptions','rawDistinct','rawGuardRejected','uiMax','declaredBankSize','sourceProvenBankSize','paperProduced','paperRequested','paperExhaustedAt','revisedIssues'];
const csvRows = rows.map(({previous:p,now:n,category,evidence}) => [category,p.link,p.unit,p.name,p.level,p.mode,p.seed,p.generated,p.rejectedNull,p.rejectedVerify,p.exceptions,n.pass,n.raw.calls,n.raw.nulls,n.raw.verifyFalse,n.raw.exceptions,n.raw.distinct,n.raw.guardRejected,n.uiMax,n.bankSize,evidence?.size,n.paper.produced,n.paper.requested,n.paper.exhaustedAt,n.issues.map(i=>i.code).join(';')]);
fs.writeFileSync(path.join(dir, 'classification-431.csv'), [fields.map(csv).join(','),...csvRows.map(r=>r.map(csv).join(','))].join('\n')+'\n');
const summary = {sourceCommit: old.commit, revisedSpecification: revised.specification, legacyCount:431, categories:totals,
  category1NowPassed: rows.filter(r=>r.category===1&&r.now.pass).length,
  category1UndeclaredFixedBank: rows.filter(r=>r.category===1&&!r.now.pass&&r.evidence).length,
  legacyNowPassed:rows.filter(r=>r.now.pass).length, legacyStillFailed:rows.filter(r=>!r.now.pass).length,
  newFailuresOutsideLegacy: revised.combinations.filter(r=>!r.pass&&!rows.some(o=>key(o.previous)===key(r))).length,
  revised:revised.summary};
fs.writeFileSync(path.join(dir,'revised-summary.json'),JSON.stringify(summary,null,2)+'\n');
let md = `# P2｜原 431 組分類（2026-09-22 修訂）\n\n**先分類，本輪不修出題。** 原交接包 2.4「200 題全部不重複」是規格誤寫；2.2 一直要求「同一份卷內不重複」。只有 8 題的題庫合理，不是缺陷。\n\n`;
md += `| 分類 | 原 431 組中的組數 | 新測試下的情況 |\n|---|---:|---|\n`;
for(const c of [1,2,3,4]) md += `| ${c} ${labels[c]} | ${totals[c]} | ${rows.filter(r=>r.category===c&&r.now.pass).length} 組本輪通過；${rows.filter(r=>r.category===c&&!r.now.pass).length} 組仍有驗收未滿足項目 |\n`;
md += `\n四類合計 431，互斥計數。分類優先順序為例外 → verify 失敗 → 原 gen null → 新版仍無法完成單卷 → 其餘為舊規格假失敗；有來源可證明的固定小題庫仍歸①，另列未宣告 bankSize 的驗收問題。每組的全部現象保留於 [classification-431.csv](classification-431.csv)，不因主分類隱藏其他錯誤。\n\n`;
md += `①共 272 組：263 組已因更正規格而直接通過；另 9 組是下表來源可證明的固定題庫。它們的「無法產生 200 題相異題目」是假的缺陷，但目前未宣告 bankSize，新條款的單卷驗收仍然標紅。並未把這 9 組跳過或標成通過。\n\n`;
md += `| topic / unit | 可證明的題庫大小 | 原始程式的依據 |\n|---|---|---|\n| g10 multiplication / cubefactor | 各難度 8 | 兩係數各 1、2；正負两種，2×2×2 |\n| g10 multiplication / chain | 基礎 9、進階 9、挑戰 10 | a,b 各 1～3 的短式 9 種；挑戰多一種 a=b=1 的長式 |\n| g11 commonlog / definition，fraction | 各難度 30 | 5 種底數 × 6 種指數 |\n\n以上只是報告的容量證據，**沒有寫入正式程式，也未用來放寬任何測試**。本輪這 9 組各 200 次直接抽樣的相異 sig 已達上述大小；仍因正式 unit 沒有 bankSize、介面上限仍為 40 而保留失敗。另 commonlog/definition 進階在第 30 題時耗盡 50 次重試，僅產生 29 題；因此只補容量宣告也不保證該次抽樣能完成，需另檢查有限池抽題策略。\n\n`;
md += `## 每類完整 topic／unit 清單\n\n同一 unit 的不同難度／數型可能落在不同類別；完整難度與數型見 CSV。這裡按 topic 彙整，並未漏掉任何一組。\n\n`;
for(const category of [1,2,3,4]) {
  md += `### ${category} ${labels[category]}（${totals[category]} 組）\n\n| 引擎 | topic | unit | 組數 |\n|---|---|---|---:|\n`;
  const groups = new Map();
  for(const row of rows.filter(r=>r.category===category)) {
    const p=row.previous; if(!groups.has(p.link))groups.set(p.link,[]);groups.get(p.link).push(p);
  }
  for(const [link,group] of groups) {
    const [engine,query]=link.split('?'); const units=[...new Set(group.map(r=>r.unit))].sort();
    md += `| ${engine.replace('-drills.html','')} | ${new URLSearchParams(query).get('topic')} | ${units.map(x=>'\x60'+x+'\x60').join('、')} | ${group.length} |\n`;
  }
  md+='\n';
}
md += `## ②不能全部解讀成算錯\n\n| topic / unit | 原失敗組 | 根因與實際例子 | 改題面風險（尚未修） |\n|---|---:|---|---|\n| standarddev / deviationsum | 1 | 59×14²=11,564 算式正確；verify 額外要求答案≤10,000，生成範圍與檢查條件不一致 | 需保留原範圍，釐清限制；不可直接放寬上限 |\n| sincosarea / ambiguous | 3 | A=30°、a=47、b=94，B=90° 正確；浮點數在 sinB≈1 的邊界導致判斷失敗 | 應處理驗證方式，題面可保留 |\n| loggraphs / inverse | 3 | 反函數代數式正確，但浮點數先加 k 再減 k 會丟失很小的值 | 應處理驗證方式，題面可保留 |\n| spaceinner / pointdistance | 3 | 候選垂直向量實際不垂直，候選答案可錯；下方有獨立核算 | 修生成構造可能改個別座標，題型與範圍不能改 |\n| spacecross / height | 3 | 可生成體積 0 的退化圖形，verify 要求 vol>0 | 修非退化構造可能改個別向量，題型與範圍不能改 |\n| line3d / pointprojection | 3 | 同類垂直向量構造錯誤，候選垂足可錯 | 修生成構造可能改個別座標，題型與範圍不能改 |\n\n空間幾何的根因屬生成程式，但目前函式回傳的是帶答案的非 null 物件，再被 verify 攔下；所以按觀察值列②，並非強行列成③④。這些候選被安全層攔下，不代表已印給學生。\n\n獨立核算：\n\n- spaceinner/pointdistance：A=(4,−3,−6)、d=(1,0,1)、P=(0,−2,−14)。t=((P−A)·d)/(d·d)=−12/2=−6，垂足 (−2,−3,−12)，距離 √(2²+1²+(−2)²)=3，候選 √17 錯。\n- line3d/pointprojection：A=(−8,−1,0)、d=(1,0,1)、P=(2,0,4)。t=14/2=7，垂足 (−1,−1,7)，候選 (−4,−1,4) 錯。\n\n`;
md += `## ③與④的解讀\n\n③的 118 組在舊測試中曾直接 gen null。許多是程式有意拒絕不適合的候選，不等於整個單元完全卡死；但依新版「200 次 gen 無 null」仍需標紅。另 6 組為 exponent/substitution（基礎、進階整數）、anglesum/triangle（三難度分數）、doublehalf/point（挑戰整數）：直接抽样沒有 null 或 verify 錯，但內容篩選讓 safeQuestion 在 40 題以前耗盡 50 次，不能算規格假失敗。原先粗分的 278 組因而重分成 272 組①與 6 組③。\n\n③有 1 組本輪 200 次未再抽到 null（見 CSV），只能說本次抽樣未重現；舊種子的 null 證據仍在，不能宣稱已修好。\n\n④包含三個明確 JavaScript 根因：cubic/global 的 localAt 未定義；righttrig/comparison 在 b 初始化前使用 b；doublehalf/fromsin、half 對 const 重新賦值。另外 exponent 的三個 unit 及 expfunctions/equation 發生「無效分數」，需區分負指數建構與安全整數範圍；目前只分類，未修改。\n\n`;
md += `## 修訂測試結果（全部 1,740 組，並非只測舊 431 組）\n\n| 項目 | 結果 |\n|---|---:|\n| topic | ${revised.summary.topics} |\n| 組合 | ${revised.summary.combinations} |\n| 直接 gen 呼叫 | ${revised.summary.directGenCalls} |\n| 通過 / 失敗 | ${revised.summary.passed} / ${revised.summary.failed} |\n| raw null 次數 | ${revised.summary.directNulls} |\n| raw verify false 次數 | ${revised.summary.directVerifyFalse} |\n| raw 例外次數 | ${revised.summary.directExceptions} |\n| unit bankSize 宣告組數 | ${revised.summary.declaredBankCombinations} |\n| 完成單卷 / 50 次耗盡組数 | ${revised.summary.paperCompleted} / ${revised.summary.paperExhausted} |\n\n原 431 組中 ${summary.legacyNowPassed} 組本次通過、${summary.legacyStillFailed} 組仍失敗；原本通過的組合另外有 ${summary.newFailuresOutsideLegacy} 組在直接 gen 條款下失敗。因舊測試使用 safeQuestion 過濾，而新條款直接檢查 gen，兩者嚴格程度不同；不能把總失敗數增加解讀成改壞網站。本輪網站原始碼完全沒有改。\n\n固定種子、所有組合與候選例子寫在 CI 的 p2-math-validation artifact。CI 保持紅燈，不設 skip、xfail、預期失敗白名單或 continue-on-error。bankSize 宣告尚未進入正式程式，所以不能宣稱已完成正式題庫全題覆蓋。\n\n## 本輪範圍與待辦\n\n- [修訂驗收條款](specification-20260922.md)。\n- P2 PR 只含測試、分類及文件；沒有修改題目、答案、數字範圍、難度或版面。\n- 未執行修正版視覺驗收，因本輪沒有修正版；不把 JSDOM 的 max 屬性檢查說成真實畫面驗收。\n- [逐根因 PR 與 UX 待辦](BACKLOG.md)：先讓使用者審閱本表；後續一個根本原因一個 PR。UX 題數上限列為 P1 之後的獨立項目，等 bankSize 宣告完成，本輪不修。\n`;
fs.writeFileSync(path.join(dir,'CLASSIFICATION.md'),md.replaceAll('两種','兩種').replaceAll('抽样','抽樣').replaceAll('組数','組數'));
const artifacts = path.join(root, 'math-validation-artifacts');
for (const file of ['CLASSIFICATION.md', 'classification-431.csv', 'revised-summary.json'])
  fs.copyFileSync(path.join(dir, file), path.join(artifacts, file));
console.log(JSON.stringify(summary));
