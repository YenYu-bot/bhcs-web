# g9 引擎 r11：加入樹狀圖與機率（`treediagram`） — Claude

累積交付：r11 ＝ r10＋`treediagram`。取代 r10；`docs/g9-r1/`～`docs/g9-r10/` 保留。
改動：插入 `treediagramConfig()`；`TOPICS`（排在 probability 之後）、`CONFIGS` 各加一項。其餘十一個 topic 未動。

## ⚠ 表格邊框色（請 ChatGPT 處理）
PR #77（r8）已修正 quartile 表格邊框的品牌色；本包是從 Claude 本機的 r10 疊上來的，**還沒有那個修正**。
boxplot（r9 起）的 `tbl()` 是從 quartile 複製的同一段，也用了同樣的舊色。整合 r9／r10／r11 時，請把 #77 的同一修正套用到 `quartileConfig()` 與 `boxplotConfig()` 兩處的 `tbl()`。treediagram 沒有 HTML 表格，不受影響。
請把修正後的 `g9-drills.html`（或該修正的 diff）回傳給 Claude，r12 以它為基底。

## 內容（B 類：引擎只做計算）
依舊工具 `tools/math/g9b-2-2-tree-diagram.html` 重做計算部分。要求「畫出樹狀圖」與 6×6 樣本空間圖的題型留在舊頁；引擎不附圖，條件全在題幹。
舊頁「雙袋編號球」「卡牌比大小」應有 3×3＝9 種結果、圖卻只畫 6 種，引擎以正確的 9 種計算（舊檔不動）。
每個單元五種問法，基礎取第 1～3 種、進階第 2～4 種、挑戰第 3～5 種：
- `coins` 硬幣、生小孩與兩袋取球：兩次、三次（恰好、至少）、兩袋取色球、兩袋編號球（共幾種、和、大小）、同一袋放回與不放回。
- `games` 排數字、猜拳與比大小：三張卡排二位數、兩人猜拳、甲乙卡片比大小（9 種）、含 0 的四張卡排二位數、三人猜拳（27 種）。
- `sumdiff` 兩次擲骰子的點數和與差：和、和的範圍與倍數、差、和為質數與積的奇偶、「和為 k 或差為 d」。
- `order` 兩次擲骰子的大小關係與奇偶：x 與 y 的大小、奇偶與「且／或」、倍數與互質、相差 m 以上、坐標點在直線上、組成二位數的倍數。
答案一律最簡分數（數型標示為「最簡分數作答」）。

## 驗證（見 local-check.txt、samples.txt）
- `math_local_check.mjs`：4 unit × 3 難度，各 200 題、多次重跑：verify 失敗 0、例外 0。
- 結構數（去 SVG 後，基礎／進階／挑戰）：coins 35/34/83、games 23/22/14、sumdiff 8/10/8、order 15/22/25；挑戰級新結構皆 >0。
- 壓測：每單元 40 題、三難度 × 5 次，滿額、耗盡 0（order 初版題庫不足 40 題，已擴充）。
- 列印（Playwright，print media）：2／3／4 欄 × 學用／教用 × 三難度，各 2 次，無溢出、無 page error。
- 回歸：其餘十一個 topic 重跑 PASS。
- verify 另一條路：答案用乘法原理與分類計數（和為 k 有 6－|k－7| 種、差為 d 有 2(6－d) 種、排容等）；驗證時用樣本空間的直積把所有結果逐一列出來實際計數（不放回時排除同一顆球）。

## 給 ChatGPT
- 先處理上方的表格邊框色，再用本包覆蓋 `tools/math/g9-drills.html`，加 `docs/g9-r11/`（依 PR 順序，r11 可取代 r9、r10）。
- 國三區加卡片「樹狀圖與機率」`g9-drills.html?topic=treediagram`。
- 舊檔 `g9b-2-2-tree-diagram.html`（**B 類**）：保留檔案與兩處舊卡片；頁首加「計算題已併入 → 樹狀圖與機率」（`color:inherit`）；P1 容器 `#questions-container`，頁首連結排除規則與守衛同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
