# g9 引擎 r1：國三上 1-1 連比、1-2 平行線截比例線段 — Claude

新檔 `tools/math/g9-drills.html`，由 g8 r5 的引擎複製（含 GEO 幾何繪圖函式庫與 `answerLabel` 機制），兩個 topic。這是 P5「國三 g9」的第一包，之後 similar、righttri、circle1、circle2、centers 逐包累積。

## 內容
| topic | 講義 | 單元（基礎／進階／挑戰的題型） |
|---|---|---|
| `ratio3` 連比與比例分配 | 國三上一段講義 1-1 | value 連比例式求比值（代入求比值、x/a＝y/b＝z/c／含係數的連比例式／pxy＝qyz＝rzx、px＝qy＝rz）・solve 連比求值（代入等式／含係數、最小公倍數、硬幣總額／最大公因數與最小公倍數）・share 比例分配（分三份、已知一份、內角比／周長與最短邊、各用 d 元後餘款比／合資分紅、食鹽水混合）・combine 求連比（兩個比併連比／含分數小數、等式型／幾倍等於幾倍、a：d 連鎖）・apply 連比的應用（三人共有錢數、得票數／年齡、三邊長／錢數移轉）・inverse 倒數比（1/a：1/b：1/c、等面積平行四邊形的高／三角形三邊上的高／由高的比反求邊、摺紙星星速率、月薪比） |
| `parallelratio` 平行線截比例線段 | 國三上一段講義 1-2 | areaRatio 等高三角形面積比（一組比、兩層比、兩邊分點／平行四邊形對角線／P、Q 兩層、△DBE 與 △ADC）・parallelSeg 三角形內平行線（求 EC、AE、DE／含 x 的線段、兩條平行線／周長、梯形內平行線）・twoStep 兩段式平行（AD∥BE、BD∥CE 的 OB²＝OA·OC、DE∥AB 與 EF∥AC／DE∥BF 與 DF∥BC）・threeLines 平行線截比例線段（求 EF、DF、BC／含 x、四條平行線／二次式）・judge 由比例判斷平行（數值判斷、使 DE∥BC 的 AE、AD：DB 與 AE：AC 判斷／哪一條平行／AD：AB＝DE：BC 不能判斷）・midsegment 中點連線（一半、中點三角形周長／兩次取中點、PQ＋DE／面積四分之一）・midpoint 中點與分點坐標（中點、直徑求圓心、由中點求端點／平行四邊形對角線交點、分點／OB＝kOA） |

數型：兩個 topic 都是整數＋分數（分數模式：連比的項含分數小數、線段或坐標為分數）。不做：證明題、作圖題、看圖判讀題。
圖：parallelratio 六個單元用 GEO 依真實比例畫（D、E 依題目比值取在邊上，平行記號用箭頭），已知條件全部寫在題幹文字裡，去掉 SVG 後每個 unit 各難度仍 ≥3 種結構。顏色只用 GEO 既有的四色。

## 驗證
- `math_local_check.mjs` 兩個 topic 各 200 題：全部 PASS，0 例外、0 verify 失敗、0 耗盡（`local-check.txt`）。
- 結構數（去 SVG 後，基礎／進階／挑戰，括號為挑戰級新結構）：ratio3 value 40/44/34（34）solve 44/31/12（12）share 5/9/5（5）combine 3/3/36（36）apply 4/4/3（3）inverse 3/4/3（3）；parallelratio areaRatio 3/3/3（3）parallelSeg 3/3/3（3）twoStep 4/5/5（1）threeLines 3/25/27（27）judge 3/3/3（2）midsegment 3/4/5（5）midpoint 63/81/67（67）。
- 列印：兩 topic × 三難度 × 學用／教用 × 每列 2／3／4 題共 36 種組合無溢出；390 px 無水平捲動；title、canonical 隨 topic 更新。
- verify 另一條路：面積比用實際頂點坐標算面積（鞋帶公式）；比例線段用「對應線段乘積相等」代回；連比題設 x＝ar、y＝br、z＝cr 代回原條件；坐標題用中點公式反算或向量比。

人工核對：
1. x：y：z＝7：8：7，(3x＋2y＋3z)：(3x＋2y＋z) → 29/22
2. 4xy＝3yz＝4zx → x：y：z＝3：4：4
3. 甲的 2 倍＝乙的 3 倍、乙的 4 倍＝丙的 2 倍 → 3：2：4
4. 月薪剩 1/2、5/6、4/5 → 月薪比 2：6：5
5. AD：DB＝CE：EB＝3：5 → △DBE：△ADC＝25：24
6. AD＝x−4、BD＝x−2、AE：EC＝4：5 → x＝12
7. AD∥BE、BD∥CE，OB＝12、OC＝36 → OA＝4
8. DE∥AB、EF∥AC，AD＝2、DC＝4、AF＝8 → BF＝4
9. AB＝x−1、AC＝x＋15、DE＝5、EF＝x−3 → x＝11
10. A(−6,−2)、B(7,−1)，AC：BC＝1：3 → C(−11/4, −7/4)

## 給 ChatGPT
1. 新引擎檔：`docs/g9-r1/`、國三區加兩張卡片（連比與比例分配 `?topic=ratio3`、平行線截比例線段 `?topic=parallelratio`，放在國三區最前面）、sitemap、builder 宣告數（預期 149）、P2 重產（預期 75 topic）、browser 檢查此檔為 new、discovery 應辨識 7 個引擎。
2. P3：兩個新 topic 走完整門檻，不豁免。
3. 舊的國三獨立工具（14 個幾何 ＋ g9b）先不動，等 g9 全部做完再統一處理。

## 整合驗收（2026-09-26）
- 國三上兩張卡片排在舊工具之前，資源頁國三列同序；舊國三獨立工具未改。數學總覽 111 卡、資源宣告 149，sitemap 95 URL，discovery 7 引擎／75 topics。
- `check_math_brand.cjs` 111 links／43 files；`check_science_integration.cjs` 101 HTML／1205 本機引用／95 sitemap URL。瀏覽器檢查依 `check_math_brand_browser.cjs` 的 `isNewFile` 自動將新檔標為 `new`，實際畫面與列印待 CI 驗證。
- P2 2445／2445 組、489000／489000 次取題、verify false 0、例外 0、單卷耗盡 0。效率警示 32 unit／74 組，維持非阻擋。P3 13 個新增 unit 全部通過完整結構與挑戰門檻，無豁免；ratchet 0 失敗。
- 40 題 smoke 75／75 topics，回歸檢查依 CI 清單逐項執行。
