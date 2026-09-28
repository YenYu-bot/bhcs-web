# g9 引擎 r7：加入二次函數的圖形與最大值、最小值（`quadfunc`） — Claude

累積交付：r7 ＝ r6＋`quadfunc`。取代 r6；`docs/g9-r1/`～`docs/g9-r6/` 保留。基準：main `2ec9581`（預檢包 g9-drills.html r6）。
改動：插入 `quadfuncConfig()`；`TOPICS`（排在 centers 之後）、`CONFIGS` 各加一項。其餘七個 topic 未動。

## 內容
依舊工具 `tools/math/g9b-1-1-quadratic-function.html` 的五個單元重做。舊工具每單元是固定題庫且只用頂點式；這裡全部參數化，每個單元五種問法，基礎取第 1～3 種、進階第 2～4 種、挑戰第 3～5 種：
- `vertex` 頂點坐標與對稱軸：頂點式求頂點、y＝ax²＋k 與 y＝a(x−h)²、開口方向、一般式配方、由頂點反求 b、c。
- `xaxis` 與 x 軸的交點：頂點式判斷個數、加問 y 軸交點、一般式判斷、求 x 軸交點坐標、由交點個數求 k 的值或範圍。
- `extreme` 最大值與最小值：頂點式、y＝k＋a(x−h)² 寫法、一般式配方、由最值反求 c、限定範圍的最大值與最小值。
- `findfn` 求二次函數：頂點與一點、頂點在坐標軸上、頂點與 y 截距、對稱軸與兩點、兩個 x 截距與最值。
- `shift` 圖形的平移：y＝ax² 平移、反推平移方式、舊工具的「對稱軸＋一點求頂點」、頂點式再平移、一般式平移後寫成頂點式。
數型：整數、分數（分數模式時 a 為分數）。作答前綴「答：」。所有已知條件都在題幹文字，本 topic 不用 SVG（舊工具的拋物線圖會直接顯示頂點，等於洩題）。
舊工具的線上作答評分、計時、匯出 HTML 不在引擎範圍，沒有移植。分類：A 類。

## 驗證（見 local-check.txt、samples.txt）
- `math_local_check.mjs`：5 unit × 3 難度 × 2 數型，各 200 題（每 40 題重置去重）：verify 失敗 0、例外 0。findfn 分數模式 null 率約 28%（y 截距須為整數才出題），低於效率警示線。
- 結構數（去 SVG 後，基礎／進階／挑戰）：vertex 62/50/53、xaxis 66/63/63、extreme 60/53/67、findfn 40/49/40、shift 73/92/132；挑戰級新結構皆 >0。
- 壓測：每單元 40 題、三難度 × 三種數型組合 × 5 次，滿額、耗盡 0。
- 列印（Playwright，print media、718px）：2／3／4 欄 × 學用／教用 × 三難度，各 2 次，無溢出、無 page error。
- 回歸：其餘七個 topic 重跑 PASS。
- verify 另一條路：答案展開成一般式後用浮點數代點——頂點處的值、左右對稱、往外一步與 a 同號；交點個數用 b²−4ac 或頂點值的正負（兩種都有用）；交點代回為 0；最值在範圍內 4000 點掃描；求函數題代回所有已知點；平移題比對 f_new(x)＝f_old(x−m)＋n。

## 給 ChatGPT
- 用本包覆蓋 `tools/math/g9-drills.html`，加 `docs/g9-r7/`。
- 國三區加卡片「二次函數的圖形與最大值、最小值」`g9-drills.html?topic=quadfunc`。
- 舊檔 `g9b-1-1-quadratic-function.html`（A 類）：檔案保留，頁首加「本頁內容已併入 → 二次函數的圖形與最大值、最小值」（`color:inherit`），`ziyuan.html` 與 `tools/math/index.html`「國三下」的舊卡片改指向新 topic；P1 比較容器設 `#questions-container`，舊頁明列入快照清單；整合守衛同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
