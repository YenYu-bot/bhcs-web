# g9 引擎 r3：加入直角三角形（`righttri`） — Claude

累積交付：r3 ＝ r2（ratio3、parallelratio、similar）＋ `righttri`。取代 r2；`docs/g9-r1/`、`docs/g9-r2/` 保留。改動只有三處：插入 `righttriConfig()`；`TOPICS`、`CONFIGS` 各加一項。

## 內容
`righttri` 直角三角形，依國三上二段講義 1-4(I)(IV)(V) 與三段講義 3-1(II)，4 個單元（基礎／進階／挑戰）：
- altitude 母子相似：AB、BD 求 CD、AC；BD、CD 求 AD、AB、AC；AD、BD 求 CD、BC／挑戰加 AB、AC 求 BC、AD、BD。整數模式用 3-4-5、5-12-13、8-15-17 放大 r 倍使分段為整數；分數模式用一般畢氏數（分段為分數）。
- pythagoras 畢氏定理的應用：畢氏數求第三邊、根式第三邊／三邊成等差（3：4：5）、m²−n²、2mn、m²＋n²／一股為質數的整數邊三角形求面積。
- special 特殊直角三角形：30°-60°-90°（三種已知邊）、45°-45°-90°、37°-53°-90°／等腰三角形（頂角 30°、60°、120°、150°）面積、兩次仰角（30°→60°、15°→30°）／∠B＝45°、∠C＝30° 的三角形求 BC 與面積（a＋b√3 形式）。
- trig 三角比（講義 1-4(V)，獨立單元，老師可不勾）：分數模式：由三邊寫六個三角比、由 sin 或 tan 求其他三角比與面積、特別角求值（含平方項與根式合併）、四邊形中的三角比、由比值反求；小數模式：題目給三角函數值的測量（仰角測塔高、面積公式 ½bc·sinB、兩次仰角、吹折的樹）。

數型：整數、分數、小數（小數只用在 trig 的測量題）。圖：母子相似、畢氏、特殊三角形用 GEO 畫，直角記號與角度標示與題目一致。

## 驗證
- `math_local_check.mjs` 200 題多次重跑：PASS，0 例外、0 verify 失敗、0 耗盡（`local-check.txt`）。r2 的三個 topic 重跑 PASS。
- 去 SVG 後結構數（基礎／進階／挑戰，挑戰新結構）：altitude 3/3/3（1）pythagoras 4/5/4（4）special 9/7/4（4）trig 4/29/37（37）。
- 列印：三難度 × 學用／教用 × 每列 2／3／4 共 18 種組合無溢出。
- verify 另一條路：母子相似同時用畢氏定理與三條比例中項式檢查；根式與特殊角用 Math.sqrt、Math.tan 數值比對；測量題以 tan 值重算。

人工核對：
1. AB＝15、BD＝75/13 → CD＝432/13、AC＝36
2. BD＝27、CD＝48 → AD＝36、AB＝45、AC＝60
3. 一股 11 的整數邊直角三角形 → 60、61，面積 330
4. c−b＝b−a＝2 → 6、8、10，(c−a)/(c＋a)＝1/4
5. 30°→60° 走 80 m → 40√3 m；15°→30° 走 110 m → 55 m
6. ∠B＝45°、∠C＝30°、AC＝4 → BC＝2＋2√3，面積 2＋2√3
7. tan A＝7/24、AC＝48 → AB＝50、cos A＝24/25
8. cos60°−tan30°＋tan²60° → 7/2−√3/3
9. 離塔 250 m 仰角 23°（tan＝0.4245）→ 106.13 m
10. 前進 60 m 仰角 θ→45°（tan θ＝0.3）→ 25.71 m

## 給 ChatGPT
- 依前包的方式：更新未合併的 g9 PR 或開新 PR；國三區加卡片「直角三角形」`?topic=righttri`，放在「相似形」之後；宣告數與 P2 依 builder 重算（+1）；P3 新 topic 完整門檻。

## 整合驗收（2026-09-26）
- 接在未合併的 G9 r2 PR 後更新累積版；`righttri` 卡片位於 `similar` 之後，既有國三獨立工具未改。數學總覽 113 卡，資源宣告 151，discovery 7 引擎／77 topics；sitemap 仍為 95 URL。
- 四個 builder、`check_math_brand.cjs` 113 links／43 files、`check_science_integration.cjs` 101 HTML／1209 本機引用／95 sitemap URL 通過。CI 的 Researcher workflow 執行站點與數學版型／列印瀏覽器檢查；本機未做實際瀏覽器量測。
- P2 2496／2496 組、499200／499200 次取題，candidate verify false 0、例外 0、單卷耗盡 0；分類報告已更新。效率警示 36 unit／81 組，維持非阻擋。
- P3 `righttri` 四個 unit 完整門檻通過，沒有豁免；ratchet 0 失敗。40 題 smoke 77／77 topics。
