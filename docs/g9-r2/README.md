# g9 引擎 r2：加入 1-3／1-4 相似形（`similar`） — Claude

累積交付：r2 ＝ r1（ratio3、parallelratio）＋ `similar`。取代 r1；`docs/g9-r1/` 保留。
對 r1 的改動只有三處：插入 `similarConfig()`；`TOPICS`、`CONFIGS` 各加一項。r1 的兩個 topic 程式碼不變。

## 內容
`similar` 相似形，依國三上一段講義 1-3 與二段講義 1-4(II)(III)，7 個單元（基礎／進階／挑戰的題型）：
- scale 縮放與比例尺：縮放後的邊、角、周長；影印百分比；地圖比例尺求實際距離／兩次縮放與面積；倍率還原；反求比例尺／以 O 為中心 OA：AA′ 放大；光源投影距離；由 OA、OA′ 求倍率與周長。
- sides 對應邊：三角形對應邊求另兩邊；多邊形一邊對應求周長／含 x 的對應邊；最短邊對應求周長／四邊比與周長求邊；兩周長求邊。
- angles 對應角：三角形對應角；四邊形角比／係數化的角比；五邊形角比與已知角／由三角求對應第四角。
- judge 相似判別：AA、SSS、長方形／SSS 反求邊、找出不相似的紙板／SAS。
- aa AA 相似求邊長：AB∥CD 交於 E（對頂角）、∠BCD＝∠A（公共角，BC²＝BD·BA）、EF∥BC 反求 EA／EB／角平分線與垂線、平行四邊形對角線交點／同前。
- area 面積比：邊長比求面積比、面積比求周長／DE∥BC 與高求 DE、梯形對角線四個三角形、中心縮放面積／梯形求 BD、面積二等分的距離（根式）、面積三等分求 FG（根式）。
- measure 簡易測量：影長、河寬（兩直角三角形）、鏡子／旗桿影子重合／燈牆影長、兩根標竿測燈塔高。

數型：整數＋分數。圖：aa 與 area 的六種題型用 GEO 畫（公共角題依 BC²＝BD·BA 算出真實坐標，角弧標示與題目一致），已知條件同時寫在題幹文字裡。不做：作圖題、看圖判讀的選擇題、拼相似形。

## 驗證
- `math_local_check.mjs` 200 題多次重跑：PASS，0 例外、0 verify 失敗、0 耗盡（`local-check.txt`）。r1 的兩個 topic 重跑 PASS。
- 去 SVG 後結構數（基礎／進階／挑戰，挑戰新結構）：scale 5/4/4（4）sides 3/7/6（6）angles 18/17/6（6）judge 3/3/3（3）aa 3/3/3（2）area 3/4/4（4）measure 3/3/3（3）。
- 列印：三 topic × 三難度 × 學用／教用 × 每列 2／3／4 共 54 種組合無溢出。
- verify 另一條路：邊長題用對應邊乘積相等代回；角度題用內角和；面積題用實際坐標算面積；測量題以相似比另一條式子重算；根式答案用數值比對。

人工核對：
1. △ABC∼△DEF，AB＝x＋4、DE＝2x＋1、AC＝5x、DF＝39 → x＝6、AB＝10
2. ∠BCD＝∠A，AD＝9、BD＝3、AC＝8 → BC＝6、CD＝4
3. ▱ABCD，AE：ED＝3：5，AC＝12 → AF：FC＝3：8，AF＝9/2
4. 梯形 △ADP＝18、△BPC＝50 → △ABP＝30，梯形 128
5. △ADP＝3、△BPC＝27，BP＝6 → BD＝8
6. 面積二等分，A 到 BC 距離 46 → 23√2
7. 兩相似三角形 4、8、7 與 16、x、y → x＝32、y＝28
8. 影印 200％ → 還原 50％；甲縮放 2 倍→乙→2 倍→丙：4 倍，丙面積 16 → 甲 1
9. 旗桿影 12 m，身高 1.7 m 走 7 m 影端重合 → 旗桿 102/25 m
10. 鏡子：離鏡 3 m、樹離鏡 6 m、眼高 1.71 m → 樹高 171/50 m

## 給 ChatGPT
- 若 #61（g9 r1）還沒合併：用 r2 的 `tools/math/g9-drills.html` 更新 #61，加入 `docs/g9-r2/`，國三區再加一張卡片「相似形」`?topic=similar`（放在平行線截比例線段之後）；宣告數與 P2 依 builder 重算（+1）。
- 若 #61 已合併：開新 PR 做同樣的事。
- P3：新 topic 走完整門檻，不豁免。

## 整合驗收（2026-09-26）
- 新卡片接在 `parallelratio` 後；國三舊獨立工具未改。數學總覽 112 卡，資源宣告 150，discovery 7 引擎／76 topics。`similar` 只有 query topic，sitemap 仍為 95 URL。
- 四個 builder、`check_math_brand.cjs` 112 links／43 files、`check_science_integration.cjs` 101 HTML／1207 本機引用／95 sitemap URL 通過。`check_math_brand_browser.cjs` 對既有 g9 HTML 走既有檔檢查，實際畫面與列印交由 CI 驗證。
- P2 2478／2478 組、495600／495600 次取題，candidate verify false 0、例外 0、單卷耗盡 0；分類報告已重建。效率警示 36 unit／81 組，維持非阻擋。
- P3 `similar` 七個 unit 均通過完整結構與挑戰門檻，沒有豁免；ratchet 0 失敗。40 題 smoke 76／76 topics。
