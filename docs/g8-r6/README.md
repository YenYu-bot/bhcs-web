# g8 引擎 r6：加入乘法公式（`mulformula`，依舊工具重做） — Claude

累積交付：r6 ＝ r5（quadapps、geoseq、angles、congruence、bisectors、triineq、parallel、quadrilateral）＋ `mulformula`。取代 r5；`docs/g8-r1/`～`docs/g8-r5/` 保留。
改動：插入 `mulformulaConfig()`；`TOPICS`（排第一，國二上第 1 章）、`CONFIGS` 各加一項；作答列前綴改成 `${g.unit.answerLabel??CFG.answerLabel??"原式＝"}`（加入單元層級覆寫，與 g7 相同；其他 topic 輸出不變）。

## 內容
`mulformula` 乘法公式，依舊的 `tools/math/g8-multiplication-formulas.html` 的十二個單元重做：中心數乘積、平方差求值、和平方速算、差平方速算、平方差展開、和平方展開、差平方展開、三項式平方、和平方辨識、差平方辨識、公式連鎖化簡、綜合計算。
舊工具每個單元只有一種句型（難度只影響題數與數的大小），這裡每個單元做五種問法，基礎取第 1～3 種、進階第 2～4 種、挑戰第 3～5 種，例如加入 (c＋d)(c−d)(c²＋d²)、u²−v²−(u−v)²、交換順序與負號在前的展開、(A＋B)²−(A−B)²、(A＋B＋C)²−(A＋B)²、a＋b 與 ab 求 a²＋b² 或 (a−b)²、(x±b)(x²＋b²)(x⁴＋b⁴) 連鎖。數型：整數、分數、小數。
展開題的答案由多項式乘法算出並依次數排序；「和平方辨識」「差平方辨識」作答列不印前綴，其餘印「原式＝」。

## 驗證
- `math_local_check.mjs mulformula 200` 多次重跑：PASS；r5 八個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：nearProduct 3/3/3、differenceValue 3/3/3、sumNumber 3/3/3、differenceNumber 3/3/3、conjugateExpand 6/8/9、sumExpand 10/12/12、differenceExpand 10/12/12、threeTerm 13/20/18、sumRecognize 3/3/3、differenceRecognize 3/4/5、formulaChain 6/7/9、comprehensive 3/3/3；挑戰級都有新結構。
- 列印：18 種組合無溢出。
- verify 另一條路：展開題在 x＝1.3、y＝−0.7、z＝2.1 下把題目的每個因式分別用浮點數求值再相乘相加，與答案多項式的值比對；數值題用浮點數依原式重算。

## 給 ChatGPT
- 用 r6 更新 g8-drills.html，加 `docs/g8-r6/`；國二區最前面加卡片「乘法公式」`?topic=mulformula`。
- 舊檔 `g8-multiplication-formulas.html` 比照 A 類：保留、頁首加連結（繼承頁面文字色）、卡片改指向 `?topic=mulformula`、移除重複卡片；整合守衛與 P1 快照清單同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
