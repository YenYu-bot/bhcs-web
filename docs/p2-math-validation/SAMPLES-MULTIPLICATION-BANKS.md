# multiplication 固定題庫：修正前後樣本

本 PR 只新增 `bankSize` 屬性，兩個 `gen()` 一行都不改。固定種子比對的原始 HTML 題面、答案與 `sig` 前後逐字相同。

## cubefactor（五題）

| 呼叫／難度 | 題面 | 答案 | 前後 |
|---|---|---|---|
| 1 / basic | 因式分解 8x³＋y³ | (2x＋y)(4x²−2xy＋y²) | 逐字相同 |
| 2 / advanced | 因式分解 x³＋y³ | (x＋y)(x²−xy＋y²) | 逐字相同 |
| 3 / challenge | 因式分解 8x³＋y³ | (2x＋y)(4x²−2xy＋y²) | 逐字相同 |
| 4 / basic | 因式分解 8x³−8y³ | (2x−2y)(4x²＋4xy＋4y²) | 逐字相同 |
| 5 / advanced | 因式分解 8x³＋y³ | (2x＋y)(4x²−2xy＋y²) | 逐字相同 |

## chain（五題）

| 呼叫／難度 | 題面 | 答案 | 前後 |
|---|---|---|---|
| 1 / basic | (x−3y)(x＋3y)(x²＋9y²) | x⁴−81y⁴ | 逐字相同 |
| 2 / advanced | (x−y)(x＋y)(x²＋y²) | x⁴−y⁴ | 逐字相同 |
| 3 / challenge | (x−y)(x＋y)(x²＋y²)(x⁴＋y⁴) | x⁸−y⁸ | 逐字相同 |
| 4 / basic | (x−3y)(x＋3y)(x²＋9y²) | x⁴−81y⁴ | 逐字相同 |
| 5 / advanced | (3x−2y)(3x＋2y)(9x²＋4y²) | 81x⁴−16y⁴ | 逐字相同 |

容量另以每組 5,000 次直接生成完整覆蓋驗證：`cubefactor=8`；`chain=9/9/10`。
