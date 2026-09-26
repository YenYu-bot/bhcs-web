# g9 引擎 r6：加入 3-2 三角形的外心、內心、重心（`centers`） — g9 完成 — Claude

累積交付：r6 ＝ r5（ratio3、parallelratio、similar、righttri、circle1、circle2）＋ `centers`。取代 r5；`docs/g9-r1/`～`docs/g9-r5/` 保留。改動只有三處：插入 `centersConfig()`；`TOPICS`、`CONFIGS` 各加一項。
**這是 g9 的最後一包**：國三上三段講義的 1-1、1-2、1-3、1-4、2-1、2-2、3-2 全部做完，3-1（幾何證明與代數證明）依規劃不做。g9 共 7 個 topic。

## 內容
`centers` 三角形的外心、內心、重心，依國三上三段講義 3-2(I)(II)(III)，6 個單元（基礎／進階／挑戰）：
- circumcenter 外心：直角三角形外心在斜邊中點、∠AOB、∠BOC、∠COA（含鈍角）、外心到三頂點距離和／角比求圓心角、∠OAB 求 ∠C、三邊成等差的外接圓／∠AOB 對應 ∠C 的兩組解、正三角形的 R、坐標外心。
- incenter 內心：面積＝rs、∠BIC＝90°＋A／2、△AIB：△BIC：△CIA／由面積與 r 求周長、∠CAI、等腰三角形的 r／由 ∠BIC 反求 ∠A、內心與外心（中點）的角、5-6-7 三角形的 r。
- rightTri 直角三角形的 R 與 r：R＝c／2、r＝(a＋b−c)／2、三角形內圓外面積、切點分段／OB＝r√2／等腰直角的 R 與 r、內心到外心的距離、△AOB 面積。
- centroid 重心與中線：由中線求 AG、由 AG＋BG＋CG 求中線和、重心坐標／GD＋GE＋GF 反求、由 AG、GE、CG 求中線和、等腰三角形的 AG／中線平方和、重心到邊的距離、等腰三角形的中線與 AG＋BG＋CG。
- centroidArea 重心與面積：中線與重心分面積（½、⅓）、六等分、由 △GMC 反求／三等分點／L∥BC 的 4：5、平行四邊形 BDCG、△BGD。
- special 直角與正三角形的三心：OG＝c／6、正三角形的 AG、由面積求 R 與 r／由 OG 反求邊、由 AG 求邊與面積／正三角形中線分出的小三角形、長方形 MBNG、GD。

只有整數模式（答案可為分數或根式）。圖：直角三角形的外心與 R、r 題用 GEO 畫。不做：證明、作圖、判讀選擇題。

## 驗證
- `math_local_check.mjs` 200 題多次重跑：PASS，0 例外、0 verify 失敗、0 耗盡（`local-check.txt`）。r5 的六個 topic 重跑 PASS。
- 去 SVG 後結構數（基礎／進階／挑戰）：circumcenter 3/5/54、incenter 3/3/3、rightTri 3/3/3、centroid 42/53/4、centroidArea 3/3/3、special 4/4/3；挑戰級都有基礎級沒有的結構。
- 列印：三難度 × 學用／教用 × 每列 2／3／4 共 18 種組合無溢出；390 px 無水平捲動。
- verify 另一條路：長度與面積用坐標實算（外心用到三頂點距離、重心用中線公式）；角度用另一組關係重算；含根式與 π 的答案用數值比對。

人工核對：
1. 三邊 9、40、41 → 外心到三頂點距離和 123／2
2. ∠A：∠B：∠C＝1：7：4 → ∠AOB＝2∠C＝120°
3. 周長 180、面積 720 → r＝8；等腰 5、5、6 → 面積 12、r＝3／2
4. 5-6-7 三角形，面積 6√6 → r＝2√6／3
5. ∠A＝90°、AB＝AC＝5 → R＝5√2／2、r＝5−5√2／2
6. AB＝AC＝17、BC＝16 → AG＝10
7. ∠C＝90°、AB＝14 → AD²＋BE²＝245
8. CB＝16、CA＝63 → 重心到斜邊距離 336／65
9. 正三角形面積 81√3 → R＝6√3、r＝3√3
10. 正三角形邊長 6 → △AFG＝3√3／2、△DFG＝3√3／4

## 給 ChatGPT
- 同前包：更新未合併的 g9 PR 或開新 PR；國三區加卡片「三角形的外心、內心、重心」`?topic=centers`，放在「圓心角、圓周角與內接四邊形」之後；宣告數與 P2 依 builder 重算；P3 完整門檻。
- g9 完成後，舊的國三獨立工具（14 個幾何＋g9b 統計）的去留由使用者決定，這包不動。

## 整合驗收（2026-09-27）
- 更新未合併的 G9 PR，保留 r1–r5 累積主題與文件；`centers` 卡片接在 `circle2` 後，舊國三獨立工具未改。數學總覽 116 卡、資源宣告 154，discovery 7 引擎／80 topics；sitemap 仍為 95 URL。
- 四個 builder、`check_math_brand.cjs` 116 links／43 files、`check_science_integration.cjs` 101 HTML／1215 本機引用／95 sitemap URL 通過。Researcher CI 執行站點與數學版型／列印瀏覽器檢查；本機未做實際瀏覽器量測。
- P2 2553／2553 組、510600／510600 次取題，candidate verify false 0、例外 0、單卷耗盡 0；分類報告已更新。效率警示 37 unit／82 組，維持非阻擋。
- P3 `centers` 六個 unit 完整門檻通過，沒有豁免；ratchet 0 失敗。40 題 smoke 80／80 topics。
