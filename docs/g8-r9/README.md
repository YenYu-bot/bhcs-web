# g8 引擎 r9：加入平方根（`sqrt`，依舊工具重做） — Claude

累積交付：r9 ＝ r8＋ `sqrt`。取代 r8；`docs/g8-r1/`～`docs/g8-r8/` 保留。改動只有三處：插入 `sqrtConfig()`；`TOPICS`（排在 factor 之後）、`CONFIGS` 各加一項。

## 內容
`sqrt` 平方根，依舊的 `tools/math/g8-square-roots.html` 的十四個單元重做：平方根的意義、正平方根、根號與絕對值、最簡根式、根號估算、根式簡記、根式乘法、根式除法、分母有理化、同類方根加減、共軛根式與根式平方、雙根號分母有理化、根式綜合、連鎖有理化。
舊工具每個單元只有一種句型，這裡每個單元五種問法，基礎取第 1～3 種、進階第 2～4 種、挑戰第 3～5 種，例如加入兩個平方根的和與積、代入求 √((x−c)²) 與化簡 √((x−c)²)、根號內分數、整數與小數部分、比大小、係數移進根號、三個根式相乘、有理數＋根號的分母、(a＋b)²−(a−b)²、a²＋b² 與 ab、奇數項連鎖與反求 n。
根式以「有理係數×√無平方因數」的和表示，乘法與有理化用這個表示計算並化簡。根號用內嵌樣式（頂線），不新增 CSS。數型：整數、分數、小數。意義、估算類不印前綴，其餘印「原式＝」。

## 驗證
- `math_local_check.mjs sqrt 200` 多次重跑：PASS；r8 十一個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：rootMeaning 3/3/3、principalRoot 3/3/3、absoluteRoot 7/7/7、simplify 3/3/3、estimate 3/3/3、notation 29/30/24、multiplyRadicals 47/52/48、divideRadicals 8/47/36、rationalize 3/6/6、addRadicals 86/99/84、conjugate 11/9/9、binomialDenominator 6/5/4、mixed 16/14/15、telescoping 5/3/3；挑戰級都有新結構。
- 列印：18 種組合無溢出。
- verify 另一條路：用 Math.sqrt 依題目的原式直接算出浮點數，與答案的值比對；估算題檢查夾擠與四捨五入，比大小題直接比較浮點數。

## 給 ChatGPT
- 用 r9 更新 g8-drills.html，加 `docs/g8-r9/`；國二區加卡片「平方根」`?topic=sqrt`，放在「因式分解」之後。
- 舊檔 `g8-square-roots.html` 比照 A 類：保留、頁首加連結、卡片改指向 `?topic=sqrt`、移除重複卡片；整合守衛與 P1 快照清單同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
