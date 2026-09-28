# g7 引擎 r8：加入二元一次聯立方程式（`simultaneous`，移植自舊工具） — Claude

累積交付：r8 ＝ r7＋ `simultaneous`。取代 r7；`docs/g7-r1/`～`docs/g7-r7/` 保留。改動只有三處：插入 `simultaneousConfig()`；`TOPICS`（排在 linear 之後）、`CONFIGS` 各加一項。

## 內容
`simultaneous` 二元一次聯立方程式，由舊的 `tools/math/g7-simultaneous-equations.html` 移植：先定解再造式、七個單元（代入消去法、加減消去法、分數型與小數型、特殊係數型、A式＝B式＝C式、替代法、綜合練習）的出題邏輯與解題提示照舊；大括號改用內嵌樣式，不新增 CSS。
差異：舊工具的「解可為分數」勾選框改成挑戰級三成五的題；「未知數符號」選項改成沿用舊工具的隨機（x、y／a、b／m、n）。數型：整數、分數、小數。作答列不印前綴。lineeq 的「兩直線的交點」是坐標幾何的用法，與本 topic 不重疊。

## 驗證
- `math_local_check.mjs simultaneous 200` 多次重跑：PASS；r7 九個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：sub 171/188/178、elim 187/156/154、fracdec 158/164/165、special 23/22/24、chain 200/200/200、subst 11/55/52、mix 158/174/177；挑戰級都有新結構。
- 列印：18 種組合無溢出。
- verify 另一條路：出題時記錄每個方程式兩邊的項，驗證時用浮點數把解代回兩邊比對（與有理數運算不同路徑）；A＝B＝C 檢查三式在解處相等，替代法檢查 x＋y、x−y（或 xy、y；x＋s、y＋t）與 a、b 的對應。

## 給 ChatGPT
- 用 r8 更新 g7-drills.html，加 `docs/g7-r8/`；國一區加卡片「二元一次聯立方程式」`?topic=simultaneous`，放在「一元一次式與方程式」之後。
- 舊檔 `g7-simultaneous-equations.html` 比照 A 類：保留、頁首加連結、卡片改指向 `?topic=simultaneous`、移除重複卡片；整合守衛與 P1 快照清單同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
