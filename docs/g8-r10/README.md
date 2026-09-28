# g8 引擎 r10：加入畢氏定理與兩點距離（`pythagoras`，依舊工具重做） — Claude

累積交付：r10 ＝ r9＋ `pythagoras`。取代 r9；`docs/g8-r1/`～`docs/g8-r9/` 保留。改動只有三處：插入 `pythagorasConfig()`；`TOPICS`（排在 sqrt 之後）、`CONFIGS` 各加一項。

## 內容
`pythagoras` 畢氏定理與兩點距離，依舊的 `tools/math/g8-pythagorean.html` 的十二個單元重做：求斜邊、求一股、根式邊長、斜邊上的高、矩形對角線、複合圖形與應用、數線距離、水平／垂直距離、兩點距離、根式座標距離、反求未知座標、周長面積應用。
舊工具每個單元只有一種句型，這裡每個單元五種問法，基礎取第 1～3 種、進階第 2～4 種、挑戰第 3～5 種，例如加入兩股比求兩股、兩股和與斜邊求面積、正三角形的高與面積、斜邊被高分成兩段、長方體對角線、梯子下滑、竹子折斷、數線分點、判斷直角三角形、x 軸上的等距點、周長與對角線求面積、菱形。
已知數量都寫在題幹文字裡；求斜邊、求一股、根式邊長、複合圖形各有一種附示意圖（GEO 既有樣式）。數型：整數、分數、小數。作答列前綴「答：」。舊工具中的數線、坐標系空白格圖沒有移植（題目不需要）。

## 驗證
- `math_local_check.mjs pythagoras 200` 多次重跑：PASS；r9 十二個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰，去 SVG 後）：hypotenuse 3/3/3、leg 3/3/3、radicalSide 3/3/3、altitude 3/3/3、rectangle 4/4/4、composite 3/3/3、numberLine 7/7/9、axisDistance 12/18/16、coordinateDistance 36/35/47、coordinateRadical 16/28/40、unknownCoordinate 13/9/9、shapeApplication 3/3/3；挑戰級都有新結構。
- 列印：18 種組合無溢出。
- verify 另一條路：用 Math.hypot、Math.sqrt 依題目條件直接重算（不用畢氏數組），反求題把答案代回距離條件，判斷直角題由三邊長重新判斷。

## 給 ChatGPT
- 用 r10 更新 g8-drills.html，加 `docs/g8-r10/`；國二區加卡片「畢氏定理與兩點距離」`?topic=pythagoras`，放在「平方根」之後。
- 舊檔 `g8-pythagorean.html` 比照 A 類：保留、頁首加連結、卡片改指向 `?topic=pythagoras`、移除重複卡片；整合守衛與 P1 快照清單同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
