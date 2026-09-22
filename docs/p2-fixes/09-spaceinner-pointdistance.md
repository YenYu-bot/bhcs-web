# P2 修正 09：spaceinner 點到直線距離

`spaceinner/pointdistance` 原先在方向 `d=(1,0,1)` 時可能生成 `w=(r,1,0)`，除非 `r=0`，否則 `w·d=r≠0`。程式卻把 `|w|` 當作點線距離，所以部分教用版答案錯誤。

本修正保留六種方向、自由整數的 `−8..8` 範圍、題型與輸出格式；只把 `d=(1,0,1)` 所在分支的偏移改為保證垂直的 `(1,r,−1)`。`verify()` 也改由投影係數求垂足，再檢查「垂足差向量垂直方向向量」與「距離平方等於答案平方」，不再只相信生成時的 `w`。

`node scripts/math-regressions/spaceinner-pointdistance.mjs` 對三難度共 600 題逐題做兩套獨立驗算：一是正射影參數法，二是 `|(P−A)×d|/|d|` 外積距離公式；兩者都必須與印出的答案相同，且六種方向全覆蓋。

修正前後五題與逐題雙重核算見 `docs/p2-math-validation/SAMPLES-SPACEINNER-POINTDISTANCE.md`；教用版影響範圍見 `docs/p2-math-validation/AFFECTED-TEACHER-ANSWERS.md`。
