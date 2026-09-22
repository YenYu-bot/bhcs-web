# P2 修正 11：排除退化平行六面體

`spacecross/height` 保留原 `u、v、w、k` 的所有生成範圍與構造方式；在算出純量三重積絕對值 `vol` 後新增 `if(!vol)return null`。體積為 0 的三向量共面，不能形成題面所稱的非退化平行六面體，因此交回 `safeQuestion()` 按既有機制重試，不重建向量、不調整範圍。

`node scripts/math-regressions/spacecross-height.mjs` 對每個難度直接呼叫 5,000 次，確認所有保留候選的體積、底面積與答案相符，並逐難度計算拒絕率。任何難度達 50% 會使回歸失敗，必須先回報再討論範圍。

修正前後五題保留樣本及五個退化拒絕樣本見 `docs/p2-math-validation/SAMPLES-SPACECROSS-HEIGHT.md`。本修正不改 `withinLimits()`、題面模板或合法題目的答案。
