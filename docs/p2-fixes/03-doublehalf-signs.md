# P2 修正 03：倍角／半角象限符號

根因：fromsin 的 cosθ、half 的 sinθ 宣告為 const，遇到需負號的象限卻重新賦值，產生例外。只把兩個需依象限調整的局部變數改為 let，不改公式、範圍、題型或難度。

`node scripts/math-regressions/doublehalf-signs.mjs`：兩單元×三難度×200 次，共 1,200/1,200 無空值／無例外、verify 全過；涵蓋四象限與特殊半角。將實際答案的分數根式轉成數值，獨立由題目角度核算 sin/cos/tan。原版被相同測試以 const 賦值例外拒絕。

整體 P2 尚未通過，不合併部署。未改 UI／列印樣式。
