# P2 修正 03：倍角／半角象限符號

根因：`fromsin` 的 `cosθ`、`half` 的 `sinθ` 宣告為 `const`，遇到需負號的象限卻重新賦值，產生例外。只把兩個需依象限調整的局部變數改為 `let`；不改公式、取樣範圍、題型或輸出模板。

`node scripts/math-regressions/doublehalf-signs.mjs`：兩單元 × 三難度 × 200 次，共 1,200/1,200 無 null、無例外、`verify()` 全過；涵蓋四象限與特殊半角，並將實際答案的分數根式轉成數值，獨立由題目角度核算 sin／cos／tan。

## 修正前後固定種子樣本

前兩列是正常候選，題面與答案逐字相同；後三列分別重現 `fromsin` 與 `half` 的 `const` 重賦值，修正後沿用原本模板完成候選。

| unit／呼叫 | 修正前題面 → 答案 | 修正後題面 → 答案 | 比對 |
|---|---|---|---|
| fromsin / 5 | θ為第一象限角，且 sinθ＝1/7，求 sin2θ、cos2θ、tan2θ。 → 8√3/49；47/49；8√3/47 | θ為第一象限角，且 sinθ＝1/7，求 sin2θ、cos2θ、tan2θ。 → 8√3/49；47/49；8√3/47 | 逐字相同 |
| half / 2 | 利用半角公式求 sin112.5°、cos112.5°、tan112.5°。 → √(2＋√2)/2；−√(2−√2)/2；−(√2＋1) | 利用半角公式求 sin112.5°、cos112.5°、tan112.5°。 → √(2＋√2)/2；−√(2−√2)/2；−(√2＋1) | 逐字相同 |
| fromsin / 1 | `TypeError: Assignment to constant variable.`（未產題） | θ為第三象限角，且 sinθ＝−1/10，求 sin2θ、cos2θ、tan2θ。 → 3√11/50；49/50；3√11/49 | 原候選成功產出 |
| fromsin / 4 | `TypeError: Assignment to constant variable.`（未產題） | θ為第二象限角，且 sinθ＝1/2，求 sin2θ、cos2θ、tan2θ。 → −√3/2；1/2；−√3 | 原候選成功產出 |
| half / 1 | `TypeError: Assignment to constant variable.`（未產題） | 180°＜θ＜270°，且 cosθ＝−1/3，求 sin(θ/2)、cos(θ/2)、tan(θ/2)。 → √6/3；−√3/3；−√2 | 原候選成功產出 |

未修改 UI 或列印樣式。
