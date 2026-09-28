# g8 引擎 r11：加入等差數列與等差級數（`arithseq`）、解一元二次方程式（`quadsolve`） — 國二完成 — Claude

累積交付：r11 ＝ r10＋ `arithseq`＋ `quadsolve`。取代 r10；`docs/g8-r1/`～`docs/g8-r10/` 保留。改動：插入 `arithseqConfig()`、`quadsolveConfig()`；`TOPICS`（排在 pythagoras 之後、quadapps 之前）、`CONFIGS` 各加兩項。
**國二的六個舊獨立工具至此全部併入 g8 引擎**：mulformula、polyops、factor、sqrt、pythagoras、arithseq、quadsolve，加上原有的 quadapps、geoseq、angles、congruence、bisectors、triineq、parallel、quadrilateral，g8 共 15 個 topic。

## 內容
舊的 `tools/math/g8-quadratic-arithmetic-sequence.html` 是兩個工作台合在一頁，這裡拆成兩個 topic，依它的十二個單元重做：
- `arithseq` 等差數列與等差級數：規律填空、公差判斷、指定項與一般項、等差中項、等差級數求和、級數巧算。數型：整數、分數、小數。
- `quadsolve` 解一元二次方程式：解的檢驗、提公因式與分組、乘法公式、十字交乘、開平方法與配方法、判別式・公式解・根與係數。整數係數；無理根化為最簡根式 (−b±√D)／2a 並約分。
舊工具每個單元只有一到三種句型，這裡每個單元五種問法，基礎取第 1～3 種、進階第 2～4 種、挑戰第 3～5 種，例如由一般項判斷等差、從第幾項開始為負、三式成等差求 x、由和反求項數、倍數和、正負相間；由一解求 k 與另一解、以兩數為解寫方程式、(ax＋b)²＝(cx＋d)²、(x＋p)(x＋q)＝k、配方法、重根求 k、α²＋β²。作答列前綴「答：」。
舊工具的線上作答評分、計時、匯出單元 HTML 等互動功能不在引擎範圍，沒有移植。`quadapps`（應用題）與這兩個 topic 不重疊。

## 驗證
- `math_local_check.mjs` 兩個 topic 各 200 題多次重跑：PASS；r10 十三個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：arithseq fill 18/17/14、judge 22/23/15、term 12/16/12、mid 12/60/66、sum 16/9/6、trick 12/11/5；quadsolve check 54/27/25、factor 30/20/20、formula 6/16/16、cross 15/14/15、square 4/10/9、sol 44/30/29；挑戰級都有新結構。
- 列印：兩個 topic 共 36 種組合無溢出。
- verify 另一條路：數列題用浮點數逐項產生或逐項相加重算（不用公式），反求題代回條件；方程式題把每個根用浮點數代回原方程式，判別式與根與係數題另算 b²−4ac、兩根和積。

## 給 ChatGPT
- 用 r11 更新 g8-drills.html，加 `docs/g8-r11/`；國二區加兩張卡片：「等差數列與等差級數」`?topic=arithseq`、「解一元二次方程式」`?topic=quadsolve`，放在「畢氏定理與兩點距離」之後。
- 舊檔 `g8-quadratic-arithmetic-sequence.html`：之前是 B 類（保留卡片，頁首連到 quadapps），現在它的兩個工作台都已併入，改為 A 類：檔案保留、頁首連結改成「本頁內容已併入 → 等差數列與等差級數／解一元二次方程式」兩個連結（原本連到 quadapps 的那行可以保留）、移除舊卡片（兩張新卡片取代）；整合守衛與 P1 快照清單同步。
- 宣告數與 P2 依 builder 重算（新增兩張、移除一張）；P3 兩個新 topic 完整門檻。
