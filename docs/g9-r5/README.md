# g9 引擎 r5：加入 2-2 圓心角、圓周角與內接四邊形（`circle2`） — Claude

累積交付：r5 ＝ r4（ratio3、parallelratio、similar、righttri、circle1）＋ `circle2`。取代 r4；`docs/g9-r1/`～`docs/g9-r4/` 保留。改動只有三處：插入 `circle2Config()`；`TOPICS`、`CONFIGS` 各加一項。

## 內容
`circle2` 圓心角、圓周角與內接四邊形，依國三上二段講義 2-2，6 個單元（基礎／進階／挑戰）：
- centralArc 弧的度數與圓心角：優劣弧比、大弧是小弧幾倍多幾度、等分弧／三條直徑含 x／直角三角形上的圓弧、由圓心角比求弧長。
- inscribed 圓周角：由弧求圓周角、圓周角與圓心角互求／內接三角形三個圓心角、兩弦相交的角、五角星角和／由三角求弧長、n 等分半圓的角、由弧長求弦長（60°、90°、120°）。
- semicircle 半圓的圓周角：直徑上的餘角、∠ACD 求 ∠DOB、直徑垂直弦平分弧／直徑上的兩個直角三角形（同斜邊的畢氏數）／內接長方形的兩正方形面積和。
- cyclic 圓內接四邊形：對角互補、外角、兩切線與優劣弧上的圓周角／由弧求角／兩外角求內角。
- parallelChords 平行弦與切線：平行弦截等弧、半圓內 AD∥OC、直徑與平行弦／切線四點共圓的外接圓／∠APB＝60° 的面積、切線與圓周角。
- tangentAngles 弦切角、圓內角、圓外角：弦切角、圓內角、圓外角／切線與 OA 求 ∠APB／三等弧與弦切角、弧比求圓內角、直徑與圓外角。

只有整數模式；角度皆為整數（弧取偶數）。圖上各點依真實弧度數放在圓上（弦相交時標出交點），已知條件寫在題幹文字裡。不做：看圖判讀選擇題、作圖、證明。

## 驗證
- `math_local_check.mjs` 200 題多次重跑：PASS，0 例外、0 verify 失敗、0 耗盡（`local-check.txt`）。r4 的五個 topic 重跑 PASS。
- 去 SVG 後結構數（基礎／進階／挑戰）：centralArc 5/12/47、inscribed 3/3/20、semicircle 3/3/3、cyclic 3/3/3、parallelChords 3/3/3、tangentAngles 3/3/3；挑戰級都有基礎級沒有的結構。
- 列印：三難度 × 學用／教用 × 每列 2／3／4 共 18 種組合無溢出。
- verify 另一條路：角度用「弧度數和 360°」與「圓周角＝弧的一半」以另一組弧重算；長度題用畢氏定理與弧長公式數值比對；直徑與平行弦的角用圖上各點的實際角度計算。

人工核對：
1. 優劣弧比 11：7 → ∠AOB＝140°
2. 三條直徑，弧 AC＝x、CE＝x、EB＝2x → x＝45、∠COE＝45°
3. P、Q 三等分半圓 → ∠APQ＝120°；五點六等分 → ∠AQT＝105°
4. 兩弦相交 ∠ABD＝42°、∠BAC＝30° → ∠ACD＝42°、∠BDC＝30°、∠AEC＝108°
5. 直徑 AB，AC＝39、BC＝52、AD＝33 → BD＝56
6. 內接四邊形 ∠A＝81°、弧 AD＝77°、弧 BC＝35° → ∠C＝99°、∠D＝78°、弧 AB＝121°
7. 兩切線 ∠P＝118° → 優弧上 31°、劣弧上 149°
8. 半圓 AD∥OC，弧 CD＝70° → 弧 AD＝40°
9. 弧 AB：BD：DC：CA＝2：6：3：4，AD、BC 交於 P → ∠APB＝60°
10. 切線 AP，OA 交圓於 B，∠A＝38° → ∠APB＝26°

## 給 ChatGPT
- 同前包：更新未合併的 g9 PR 或開新 PR；國三區加卡片「圓心角、圓周角與內接四邊形」`?topic=circle2`，放在「圓：扇形、切線與弦心距」之後；宣告數與 P2 依 builder 重算；P3 完整門檻。

## 整合驗收（2026-09-27）
- 更新未合併的 G9 PR，保留 r1–r4 累積主題與文件；`circle2` 卡片接在 `circle1` 後，既有國三獨立工具未改。數學總覽 115 卡、資源宣告 153，discovery 7 引擎／79 topics；sitemap 仍為 95 URL。
- 四個 builder、`check_math_brand.cjs` 115 links／43 files、`check_science_integration.cjs` 101 HTML／1213 本機引用／95 sitemap URL 通過。Researcher CI 執行站點與數學版型／列印瀏覽器檢查；本機未做實際瀏覽器量測。
- P2 2535／2535 組、507000／507000 次取題，candidate verify false 0、例外 0、單卷耗盡 0；分類報告已更新。效率警示 37 unit／82 組，維持非阻擋。
- P3 `circle2` 六個 unit 完整門檻通過，沒有豁免；ratchet 0 失敗。40 題 smoke 79／79 topics。
