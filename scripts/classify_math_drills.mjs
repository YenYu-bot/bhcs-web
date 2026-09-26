import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs/p2-math-validation');
const old = JSON.parse(fs.readFileSync(path.join(dir, 'legacy-observations.json')));
const revised = JSON.parse(fs.readFileSync(process.env.MATH_REPORT || path.join(root, 'math-validation-artifacts/results.json')));
const baseline = JSON.parse(fs.readFileSync(path.join(dir, 'baseline-failures.json')));
const key = r => [r.link, r.unit, r.level, r.mode].join('|');
const current = new Map(revised.combinations.map(r => [key(r), r]));
assert.equal(old.combinations.length, 431);
assert.equal(revised.schema, 3, 'run the safeQuestion math test before rebuilding this report');
assert.deepEqual(new Set(old.combinations.map(key)), new Set(baseline.map(key)));
assert.equal(current.size, revised.summary.combinations, 'classification must cover every current math combination');

function finiteEvidence(r) {
  if (r.link === 'g10-drills.html?topic=multiplication' && r.mode === 'integer') {
    if (r.unit === 'cubefactor') return {size: 8, proof: 'a,b 各 2 種，正負 2 種：2×2×2'};
    if (r.unit === 'chain') return {size: r.level === 'challenge' ? 10 : 9,
      proof: 'a,b 各 1～3；挑戰另有 1 個長式'};
  }
  if (r.link === 'g11-drills.html?topic=commonlog' && r.unit === 'definition' && r.mode === 'fraction')
    return {size: 30, proof: '5 種底數 × 6 種指數'};
  return null;
}

const labels = {1: '舊 200 題去重假失敗', 2: 'verify() 不過', 3: '曾回傳 null／單卷耗盡', 4: '例外'};
const rows = old.combinations.map(previous => {
  const now = current.get(key(previous));
  assert.ok(now, key(previous));
  const evidence = finiteEvidence(previous);
  const category = previous.exceptions ? 4 : previous.rejectedVerify ? 2 : previous.rejectedNull ? 3 :
    now.pass || evidence ? 1 : 3;
  return {previous, now, category, evidence};
});
const totals = Object.fromEntries([1, 2, 3, 4].map(c => [c, rows.filter(r => r.category === c).length]));
assert.equal(Object.values(totals).reduce((a, b) => a + b), 431);

const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const fields = ['category','link','unit','name','level','mode','legacySeed','legacyGenerated','legacyNulls',
  'legacyVerifyFalse','legacyExceptions','revisedPass','candidateCalls','candidateNulls','candidateVerifyFalse',
  'candidateExceptions','acceptedDistinct','candidateGuardRejected','rejectionRate','uiMax','declaredBankSize',
  'sourceProvenBankSize','paperProduced','paperRequested','paperExhaustedAt','revisedIssues'];
const csvRows = rows.map(({previous:p, now:n, category, evidence}) => [category,p.link,p.unit,p.name,p.level,p.mode,
  p.seed,p.generated,p.rejectedNull,p.rejectedVerify,p.exceptions,n.pass,n.raw.calls,n.raw.nulls,n.raw.verifyFalse,
  n.raw.exceptions,n.raw.distinct,n.raw.guardRejected,n.raw.rejectionRate,n.uiMax,n.bankSize,evidence?.size,
  n.paper.produced,n.paper.requested,n.paper.exhaustedAt,n.issues.map(i => i.code).join(';')]);
fs.writeFileSync(path.join(dir, 'classification-431.csv'),
  [fields.map(csv).join(','), ...csvRows.map(r => r.map(csv).join(','))].join('\n') + '\n');

const legacyKeys = new Set(rows.map(r => key(r.previous)));
const rs = {topics: revised.summary.topics, combinations: revised.summary.combinations,
  passed: revised.summary.passed, failed: revised.summary.failed,
  safeQuestionCalls: revised.summary.safeQuestionCalls ?? revised.summary.samplingSafeQuestionCalls,
  samplingProduced: revised.summary.samplingProduced,
  candidateGenCalls: revised.summary.candidateGenCalls, candidateNulls: revised.summary.candidateNulls,
  candidateVerifyFalse: revised.summary.candidateVerifyFalse, candidateExceptions: revised.summary.candidateExceptions,
  efficiencyWarningUnits: revised.summary.efficiencyWarningUnits,
  efficiencyWarningCombinations: revised.summary.efficiencyWarningCombinations,
  declaredBankCombinations: revised.summary.declaredBankCombinations ?? 0,
  paperCompleted: revised.summary.paperCompleted, paperExhausted: revised.summary.paperExhausted};
const summary = {sourceCommit: old.commit, revisedSpecification: '2.4 safeQuestion revision 2026-09-22', legacyCount: 431,
  categories: totals, category1NowPassed: rows.filter(r => r.category === 1 && r.now.pass).length,
  category1UndeclaredFixedBank: rows.filter(r => r.category === 1 && !r.now.pass && r.evidence).length,
  legacyNowPassed: rows.filter(r => r.now.pass).length, legacyStillFailed: rows.filter(r => !r.now.pass).length,
  newFailuresOutsideLegacy: revised.combinations.filter(r => !r.pass && !legacyKeys.has(key(r))).length,
  revised: rs};
fs.writeFileSync(path.join(dir, 'revised-summary.json'), JSON.stringify(summary, null, 2) + '\n');

const grouped = list => {
  const map = new Map();
  for (const r of list) {
    const p = r.previous || r;
    const [engine, query] = p.link.split('?');
    const k = `${engine}|${new URLSearchParams(query).get('topic')}`;
    const group = map.get(k) || {engine: engine.replace('-drills.html', ''), topic: new URLSearchParams(query).get('topic'), rows: []};
    group.rows.push(p); map.set(k, group);
  }
  return [...map.values()];
};
const pct = n => `${(n * 100).toFixed(1)}%`;
let md = `# P2｜原 431 組分類與 safeQuestion 基準（2026-09-22 第二次修訂）\n\n`;
md += `第一版「200 題全部不重複」、第二版「gen() 200 次不得 null」都是規格誤寫。引擎以 safeQuestion() 對 null 候選重試；null 是正常拒絕訊號，只有 50 次重試耗盡、verify 失敗或例外才阻擋。\n\n`;
md += `| 原 431 組分類 | 組數 | 新測試通過 | 仍失敗 |\n|---|---:|---:|---:|\n`;
for (const c of [1,2,3,4]) md += `| ${c} ${labels[c]} | ${totals[c]} | ${rows.filter(r => r.category === c && r.now.pass).length} | ${rows.filter(r => r.category === c && !r.now.pass).length} |\n`;
md += `\n四類互斥且合計 431。完整難度、mode、拒絕率與失敗碼見 [classification-431.csv](classification-431.csv)。\n\n`;
md += `## 每類完整 topic／unit 清單\n\n`;
for (const category of [1,2,3,4]) {
  md += `### ${category} ${labels[category]}（${totals[category]} 組）\n\n| 引擎 | topic | unit | 組數 |\n|---|---|---|---:|\n`;
  for (const group of grouped(rows.filter(r => r.category === category))) {
    const units = [...new Set(group.rows.map(r => r.unit))].sort();
    md += `| ${group.engine} | ${group.topic} | ${units.map(x => `\`${x}\``).join('、')} | ${group.rows.length} |\n`;
  }
  md += '\n';
}

const failureKind = r => r.issues.some(i => i.code.includes('exception')) ? '例外' :
  r.issues.some(i => i.code.includes('verify')) ? 'verify' : finiteEvidence(r) ? '固定小題庫' : '其他單卷耗盡';
const failedGroups = new Map();
const failedKindTotals = new Map();
for (const r of revised.combinations.filter(r => !r.pass)) {
  const kind = failureKind(r);
  const k = `${r.topic}/${r.unit}/${kind}`;
  const group = failedGroups.get(k) || {topic:r.topic, unit:r.unit, kind, count:0};
  group.count++; failedGroups.set(k, group);
  failedKindTotals.set(kind, (failedKindTotals.get(kind) || 0) + 1);
}
md += `## 真正待修基準\n\n| 項目 | 結果 |\n|---|---:|\n| topic / 組合 | ${rs.topics} / ${rs.combinations} |\n| safeQuestion 抽樣 / 成功取題 | ${rs.safeQuestionCalls} / ${rs.samplingProduced} |\n| 通過 / 失敗 | ${rs.passed} / ${rs.failed} |\n| 候選 gen / null | ${rs.candidateGenCalls} / ${rs.candidateNulls} |\n| 候選 verify false / 例外 | ${rs.candidateVerifyFalse} / ${rs.candidateExceptions} |\n| 完成單卷 / 單卷耗盡 | ${rs.paperCompleted} / ${rs.paperExhausted} |\n| 高拒絕率 unit（非阻擋） | ${rs.efficiencyWarningUnits} |\n\n`;
md += `| 類型 | topic / unit | 組數 |\n|---|---|---:|\n`;
for (const g of failedGroups.values()) md += `| ${g.kind} | ${g.topic} / \`${g.unit}\` | ${g.count} |\n`;
md += `\n共 ${rs.failed} 組：例外 ${failedKindTotals.get('例外') || 0}、verify ${failedKindTotals.get('verify') || 0}、固定小題庫 ${failedKindTotals.get('固定小題庫') || 0}、其他單卷耗盡 ${failedKindTotals.get('其他單卷耗盡') || 0}；原本通過的組合新增失敗為 ${summary.newFailuresOutsideLegacy}。\n\n`;
md += `## 效率警示（不阻擋）\n\n| topic / unit | 最高 null 拒絕率 | 超過 50% 的難度×mode 組數 |\n|---|---:|---:|\n`;
for (const w of revised.efficiencyWarnings) md += `| ${w.topic} / \`${w.unit}\` | ${pct(w.maximumRejectionRate)} | ${w.combinations.length} |\n`;
md += `\n全部組合的實際拒絕率留在 JSON 與 CSV。警示只供後續調範圍參考，不阻擋合併。\n\n`;
md += rs.failed===0
  ? `## 判讀與順序\n\n- P2 阻擋項已歸零：例外、verify false、未宣告固定小題庫及未解釋的單卷耗盡均為 0。\n- ${rs.paperExhausted===0?'本次所有單卷均達目標題數':'已宣告有限題庫在卷末偶發漏抽最後一題仍列為非阻擋警示'}；容量另由加強覆蓋檢查驗證。\n- 下一階段依既定順序進入 P3 題型多樣性報表模式，先產 baseline JSON，不立即阻擋 CI。\n- 本報告由當前分支的正式出題程式重跑產生；各根因修改另見對應 PR 紀錄。\n`
  : `## 判讀與順序\n\n- 標準差超過 10,000 的候選應在 gen 階段回傳 null；保留 verify、withinLimits、n 與 sd 範圍。\n- SSA 與反函數目前答案正確，屬驗證方式；三個空間 unit 需先檢查候選題面與答案。\n- 依決定先清完剩餘例外，再處理 verify、其他單卷耗盡、最後補固定題庫 bankSize。\n- 本報告由當前分支的正式出題程式重跑產生；各根因修改另見對應 PR 紀錄。\n`;
fs.writeFileSync(path.join(dir, 'CLASSIFICATION.md'), md);
fs.writeFileSync(path.join(dir, 'SAFEQUESTION-BASELINE.md'), md);

const artifacts = path.join(root, 'math-validation-artifacts');
for (const file of ['CLASSIFICATION.md','SAFEQUESTION-BASELINE.md','VERIFY-SAMPLES.md','classification-431.csv','revised-summary.json'])
  fs.copyFileSync(path.join(dir, file), path.join(artifacts, file));
console.log(JSON.stringify(summary));
