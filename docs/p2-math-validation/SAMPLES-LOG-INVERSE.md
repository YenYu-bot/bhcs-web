# loggraphs / inverse：修正前後五題

固定種子直接呼叫同一個 `gen()`；修正前後的題面、答案與 `sig` 均逐字相同。唯一差異是 `verify()` 由 `false` 變成 `true`。

| 難度／種子 | 修正前後題面（逐字相同） | 修正前後答案（逐字相同） | verify 前 → 後 |
|---|---|---|---|
| basic / 28 | 求 f（x）＝10^(x−9)＋3 的反函數。 | f⁻¹（x）＝log₁₀（x−3）＋9 | false → true |
| basic / 63 | 求 f（x）＝10^(x−9)＋8 的反函數。 | f⁻¹（x）＝log₁₀（x−8）＋9 | false → true |
| basic / 117 | 求 f（x）＝10^(x−8)＋8 的反函數。 | f⁻¹（x）＝log₁₀（x−8）＋8 | false → true |
| basic / 139 | 求 f（x）＝10^(x−9)＋5 的反函數。 | f⁻¹（x）＝log₁₀（x−5）＋9 | false → true |
| basic / 193 | 求 f（x）＝7^(x−9)＋5 的反函數。 | f⁻¹（x）＝log₇（x−5）＋9 | false → true |

表格用一般數學字形顯示；自動比對使用原始 HTML 的 `expr === expr` 與 `answer === answer`，也核對 `sig` 不變。正式 `verify()` 繼續使用既有 `H.near(..., 1e-9)`，只把探針移到不會發生 `+k−k` 消去的位置，理由見 `docs/p2-fixes/08-log-inverse.md`。
