# g9 引擎 r12：加入立體圖形（`solid`） — 國三下完成 — Claude

累積交付：r12 ＝ ChatGPT 預驗收的 r11（`claude-g9-r11-checked.zip`，含表格品牌色 CSS 修正）＋`solid`。取代 r11；`docs/g9-r1/`～`docs/g9-r11/` 保留。
改動：插入 `solidConfig()`；`TOPICS`（排在 treediagram 之後）、`CONFIGS` 各加一項。已程式比對：去掉這三處新增後與 r11-checked 逐字相同。
**國三下六個舊工具至此全部併入 g9 引擎**，g9 共 13 個 topic：ratio3、parallelratio、similar、righttri、circle1、circle2、centers、quadfunc、quartile、boxplot、probability、treediagram、solid。

## 內容（A 類）
依舊工具 `tools/math/g9b-3-1-solids.html` 的六個單元重做。舊工具③的底面尺寸只標在圖上，引擎全部寫進題幹；不附圖。依課綱不出角錐、圓錐的體積。含 π 的答案保留 π，根式化為最簡。每個單元五種問法，基礎取第 1～3 種、進階第 2～4 種、挑戰第 3～5 種：
- `count` 柱體與錐體的頂點、面、邊：角柱、角錐、由一種個數反求幾角柱（錐）、由總和反求、角柱與角錐邊數相同。
- `diagonal` 空間對角線：長方體、正方體（含反求邊長）、由對角線與兩邊求第三邊（物品斜放）、底面與空間對角線、由邊長比與對角線求體積。
- `prism` 角柱的體積與表面積：長方體、直角三角柱、直角梯形柱、由體積反求高、由表面積反求高。
- `cylinder` 圓柱與中空容器：體積與表面積、直徑與側面積、無蓋容器、中空水管、無蓋中空容器（舊工具④）。
- `pyramid` 角錐的表面積：正四角錐（斜高）、正四面體、由高求斜高、由側稜求斜高、由表面積反求斜高或邊長。
- `cone` 圓錐的展開圖與表面積：由圓心角求母線、由母線求圓心角、側面積與表面積、由扇形求底圓半徑、由半徑與高求母線、表面積與圓心角。
數型只有一種（標示為「整數邊長」）。沒有 HTML 表格。

## 驗證（見 local-check.txt、samples.txt）
- `math_local_check.mjs`：6 unit × 3 難度，各 200 題、兩次：verify 失敗 0、例外 0、null 0。
- 結構數（去 SVG 後，基礎／進階／挑戰）：count 26/18/11、diagonal 15/15/14、prism 21/15/9、cylinder 15/9/7、pyramid 9/9/10、cone 9/9/9；挑戰級新結構皆 >0。（初版四個單元剛好 3，已加入物件與問法的同義變化拉高。）
- 壓測：每單元 40 題、三難度 × 5 次，滿額、耗盡 0。
- 列印（Playwright，print media）：2／3／4 欄 × 學用／教用 × 三難度，各 2 次，無溢出、無 page error。
- 回歸：其餘十二個 topic 重跑 PASS。
- verify 另一條路：頂點面邊數用尤拉公式 V−E＋F＝2 與另一種數法，反求題在 3～40 逐一代入確認唯一；長度用空間坐標兩點距離；表面積把每個面分開算再相加；中空容器分成外底、外側、頂端環形、內側、內底五塊相加；圓錐用「扇形弧長＝底圓周長」與「扇形面積＝πrl」兩條關係。

## 給 ChatGPT
- 用本包覆蓋 `tools/math/g9-drills.html`，加 `docs/g9-r12/`（依 PR 順序，r12 可取代 r9～r11）。
- 國三區加卡片「立體圖形」`g9-drills.html?topic=solid`。
- 舊檔 `g9b-3-1-solids.html`（A 類）：檔案保留、頁首「本頁內容已併入 → 立體圖形」（`color:inherit`）、兩處舊卡片改指向新 topic、P1 容器 `#questions-container` 並列入快照清單、守衛同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
