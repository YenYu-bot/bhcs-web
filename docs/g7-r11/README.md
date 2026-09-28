# g7 引擎 r11：加入函數（`function`，依舊工具重做） — 國一完成 — Claude

累積交付：r11 ＝ r10＋ `function`。取代 r10；`docs/g7-r1/`～`docs/g7-r10/` 保留。改動只有三處：插入 `functionConfig()`；`TOPICS`（排在 ratio 之後）、`CONFIGS` 各加一項。
**國一的九個舊獨立工具至此全部併入 g7 引擎**：signed、exponent、scinot、factors、linear、simultaneous、inequality、ratio、function，加上原有的 numberline、coordinate、lineeq、statistics，g7 共 13 個 topic。

## 內容
`function` 函數，依舊的 `tools/math/g7-function.html` 的十二個單元重做：一次函數值、二次函數值、常數函數、函數值綜合運算、分段函數、由函數值反求輸入、反求一次函數係數、反求二次函數係數、函數替換、複合函數、連續函數值總和、巢狀函數值。
舊工具每個單元只有一種固定句型（難度只影響題數），這裡每個單元做五種問法：基礎取第 1～3 種、進階取第 2～4 種、挑戰取第 3～5 種（挑戰有基礎沒有的兩種），例如一次函數值加入「x 增加 d 時 f(x) 增加多少」、分段函數加入分界點不在 0 與 f(f(x))、反求係數加入和差條件、總和加入對稱區間與奇數項。數型：整數、分數、一位小數（小數模式的除法題只留有限小數）。作答列前綴「答：」。
與舊工具的差異：舊工具的「綜合」難度（各單元平均取題）不另設，老師可自行勾單元。

## 驗證
- `math_local_check.mjs function 200` 多次重跑：PASS；r10 十二個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：linearValue 63/62/54、quadraticValue 118/123/134、constantValue 44/46/52、combinedValue 33/50/61、piecewise 119/144/111、solveInput 75/73/77、linearCoeff 28/25/16、quadraticCoeff 40/21/24、replaceFunction 75/80/91、composite 157/168/155、sumValues 46/52/35、nested 62/98/94；挑戰級都有新結構。
- 列印：18 種組合無溢出。
- verify 另一條路：每題依題目定義用浮點數重新計算（與有理數運算不同路徑），反求類把解代回條件，分段函數依 x 的範圍重新選段。

## 給 ChatGPT
- 用 r11 更新 g7-drills.html，加 `docs/g7-r11/`；國一區加卡片「函數」`?topic=function`，放在「比例」之後。
- 舊檔 `g7-function.html` 比照 A 類：保留、頁首加連結、卡片改指向 `?topic=function`、移除重複卡片；整合守衛與 P1 快照清單同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
