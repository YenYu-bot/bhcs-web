# P2 修正 10：line3d 點到直線的正射影

`line3d/pointprojection` 原先在方向 `d=(1,0,1)` 時可能生成不垂直的偏移，卻仍把預先選定的 `Q` 印成垂足，因此部分教用版答案錯誤。

本修正保留六種方向、自由整數的 `−7..7` 範圍、參數 `t` 的 `−8..8` 範圍、題型與輸出格式；只把該分支偏移改成保證垂直的 `(1,r,−1)`。`verify()` 由印出的 `P、A、d` 重新算投影參數與垂足，再核對答案 `Q`，並另外檢查 `PQ·d=0`。

`node scripts/math-regressions/line3d-pointprojection.mjs` 對三難度共 600 題逐題做兩套獨立驗算：一是數值代回「Q 在直線上」和「PQ 垂直 d」兩個幾何條件；二是以 `((P−A)·d)/(d·d)` 重新計算投影點。兩者都必須與印出的答案相同，且六種方向全覆蓋。

修正前後五題與逐題雙重核算見 `docs/p2-math-validation/SAMPLES-LINE3D-POINTPROJECTION.md`；教用版影響範圍已更新於 `docs/p2-math-validation/AFFECTED-TEACHER-ANSWERS.md`。
