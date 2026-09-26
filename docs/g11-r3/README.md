# g11 引擎 r3：加入 M22 平面向量、M23 二階行列式與克拉瑪公式 — Claude

累積交付：r3 ＝ r2（standarddev、correlation、matrixapps 的修改）＋ 兩個新 topic。取代 r2；`docs/g11-r1/`、`docs/g11-r2/` 保留。
改動只有四處，全是新增：`vectorCauchyConfig()` 之後插入 `planeVectorConfig()`、`determinantConfig()`；`CONFIGS` 與 `TOPIC_ORDER` 各加兩項；`UNIT_POLICIES` 加兩項。其他 32 個 topic 的程式碼沒有動（diff 只有 `CONFIGS…TOPIC_ORDER` 那一行被替換）。
**g11 是共用檔**：ChatGPT 若已開始 g11 P4，請用三方合併套上這四處；有衝突貼給使用者。

## 新 topic
TOPIC_ORDER 依課本章序：`planevector` 放在 `vectorcauchy` 前，`determinant` 放在 `vectorcauchy` 後。

| topic | 來源 | units（難度內的題型） |
|---|---|---|
| `planevector` 平面向量的基本運算與線性組合（M22） | 學校題庫「平面向量的運算」前半；內積以後已由 `vectorcauchy` 涵蓋 | components 坐標與長度（兩點求向量與長度、由向量與一端點反求；四點 AB＝CD 求未知坐標；挑戰：長度與方向角寫坐標〔特殊角，根式〕、由長度反求參數兩解）・arithmetic 加減與係數積（a±b、ma＋nb；三向量、長度；挑戰：向量方程、向量聯立）・unitvector 單位向量（畢氏數同／反向；指定長度；挑戰：根式單位向量、平行單位向量兩解）・parallel 平行（判斷同反向、平行求 k；一次式參數、a∥(b−c)；挑戰：二次式參數兩解、指定同向或反向）・lincomb 線性組合（求 (r，s)；寫成線性組合、求 pm＋qn；挑戰：不平行向量係數為 0 的聯立）・section 分點（中點、內分點；外分點、反求 AP：PB；挑戰：直線上兩解、由 A、P 反求 B）・points 重心與平行四邊形（重心、由重心反求頂點；ABCD 第四頂點、以 AB、AC 為鄰邊；挑戰：第四頂點全部三解、由對角線交點求 C、D）・collinear 三點共線（判斷、共線求 k；OP＝(px＋q)OA＋(rx＋s)OB 係數和為 1、OP＝(a/b)OA＋tOB；挑戰：三點坐標都含 k 的共線）・combopoint 以向量表示分點（分點、重心；角平分線、分點再分點；挑戰：兩中線式交點、平行四邊形 AE 與 BD 交點） |
| `determinant` 二階行列式與克拉瑪公式（M23） | 學校題庫「行列式與克拉瑪」 | evaluate 求值（整數／分數；大數〔如 2043、2065…〕、含根式；挑戰：行列式方程兩解）・properties 性質（列互換、行互換、轉置、單列單行倍乘；兩行各乘、列加倍數、行加倍數、全變號、互換並倍乘；挑戰：行組合、列組合、分項相加 p·D₁＋q·D₂、列行同時倍乘）・cramer 克拉瑪（寫出 Δ、Δx、Δy 與解、由三個行列式值求解；只求 Δx 或 Δy、倍乘與互換代換；挑戰：一般代換如 2b₁x＋(2a₁−b₁)y＋3c₁＝0）・solutions 解的情形（判斷一解／無解／無限多解；參數使無解或無限多解、齊次除 (0,0) 外有解；挑戰：就 a 完整討論、平行或重合求 a）・area 面積（兩向量張成平行四邊形或三角形、坐標求三角形面積；由面積反求坐標兩解、由 |a|、|b|、a·b 求面積、線性組合後的面積；挑戰：OP＝xOA＋yOB 範圍區域面積、由三個面積反求線性組合係數） |

數型：`unitvector`、`combopoint` 只有分數；`lincomb`、`section`、`evaluate`、`cramer` 整數＋分數；其餘整數。兩個 topic 都設 `allowMixed:false`（坐標與數對不用帶分數）。未做 M22 後半（內積等，已有 `vectorcauchy`）；`matrixops` 已有的 `determinant`／`singular`／`linearsystem` 三個單元是矩陣角度，本 topic 以題庫的行列式性質、克拉瑪與幾何意義為主，兩者不重疊。
記憶中另有舊檔 `g10-vector-linear-combination.html`（向量線性組合與分點）；本包沒有動它，是否下架或改連到 `?topic=planevector` 由使用者決定。

## 本機健檢（`math_local_check.mjs <file> <topic> 200`，多次重跑）
兩個 topic 全部 PASS：原始例外 0、原始 verify 失敗 0、卷內耗盡 0、verify 失敗 0。完整輸出在 `local-check.txt`。
回歸：其餘 32 個 topic 以 80 題重跑，結果與 r2 相同；`expequations`、`commonlog`、`anglesum` 在 r2 就有卷內耗盡（題庫太小的單元），不是本包造成，屬 g11 P4 範圍。

### 結構數（各 unit × 難度 × 數型；5 份卷 × 40 題，數字換成 # 後去重）
planevector
| unit | 數型 | 基礎 | 進階 | 挑戰 |
|---|---|---|---|---|
| `components` | 整數 | 42 | 69 | 58 |
| `arithmetic` | 整數 | 106 | 177 | 179 |
| `unitvector` | 分數 | 8 | 12 | 12 |
| `parallel` | 整數 | 29 | 84 | 94 |
| `lincomb` | 整數 | 60 | 133 | 157 |
| `lincomb` | 分數 | 60 | 143 | 165 |
| `section` | 整數 | 32 | 56 | 65 |
| `section` | 分數 | 31 | 58 | 65 |
| `points` | 整數 | 102 | 120 | 116 |
| `collinear` | 整數 | 62 | 68 | 130 |
| `combopoint` | 分數 | 6 | 5 | 3 |

determinant
| unit | 數型 | 基礎 | 進階 | 挑戰 |
|---|---|---|---|---|
| `evaluate` | 整數 | 8 | 35 | 47 |
| `evaluate` | 分數 | 8 | 8 | 8 |
| `properties` | 整數 | 14 | 26 | 135 |
| `cramer` | 整數 | 88 | 169 | 142 |
| `cramer` | 分數 | 70 | 170 | 128 |
| `solutions` | 整數 | 82 | 141 | 154 |
| `area` | 整數 | 79 | 110 | 116 |

結構數偏高是因為字母、正負號組合不同也算不同結構；實際題型見上表「units」欄。`combopoint` 挑戰 3 ＝三種題型（兩線交點、平行四邊形交點、角平分線），數字不同但句型固定。`evaluate` 分數只出一般求值（大數、根式、方程式沒有分數版）。

### P3（g11 topic 層級）
`qual.mjs`：planevector qualifying 9／9、determinant 5／5（每個 unit 的挑戰級都有基礎級沒有的結構）；topic 結構數 basic 433／challenge 962、basic 317／challenge 705，都遠超 10。新 topic 無豁免。

## 正確性（verify 走另一條路）
- 分點：不用分點公式驗，改驗「P 與 A、B 共線」＋「n²|AP|²＝m²|PB|²」＋「內分時 PA·PB＜0、外分時＞0」。
- 平行、共線：外積為 0；同反向另用內積正負。參數共線題對所有整數根代回，並確認多項式根數與次數一致。
- 單位向量：驗長度平方＝L²、與 a 平行、與 a 內積的正負。方向角寫坐標另用 Math.cos／sin 數值比對。
- 線性組合、向量方程：把答案代回原式。兩線交點：驗「共線係數和為 1」兩條件。
- 行列式性質、克拉瑪代換、面積變換：隨機取三組數值 a、b、c、d（必要時 e、f）實際計算，比對公式倍數。
- 解的情形：答案用 Δ、Δx、Δy 分類，verify 改用「兩列是否成比例（含常數）」分類，兩者要一致。
- 面積：坐標三角形用鞋帶公式；|a|、|b|、a·b 型驗 |a|²|b|²−(a·b)²＝(外積)²；區域面積用四個頂點鞋帶公式。

人工核對（皆代回確認）：
1. a＝(k＋4，6)、b＝(−5，k−9) 平行且反向 → k＝−1 或 6（兩根皆反向）
2. △ABC 中 AD：DB＝2：1、AE：EC＝1：2，BE 與 CD 交於 P → AP＝(4/7)AB＋(1/7)AC
3. 平行四邊形 BE：EC＝1：5，AE 與 BD 交於 P → (6/7，1/7)
4. A(6，−5)、B(6，13)，AP：PB＝5：4 在直線 AB 上 → P(6，5) 或 (6，85)
5. |v|＝5、方向角 240° → (−5/2，−5√3/2)
6. 已知 |a b；c d|＝−4，|−3a＋b −2a＋b；−3c＋d −2c＋d| → 4
7. a₁x＋b₁y＝c₁… 解為 (3，−6)，−2b₁x＋(2a₁−2b₁)y＝−2c₁… → (−3，−3)
8. (a＋4)x−2y＝6、−4x＋(a＋2)y＝1：a≠−6、0 恰一解；a＝−6、0 皆無解
9. |a|＝17、|b|＝5、a·b＝40，張成三角形面積 → 75/2
10. |x−5 6；−4 x＋4|＝16 → x＝−3 或 4

更多樣本（每 unit × 難度 × 數型 3 題，含答案）在 `samples.txt`。

## 版面與顏色
兩個 topic × 三難度 × 學用／教用 × 每列 2／3／4 題共 36 種列印組合（每份 20–36 題）：題內元素無溢出；390 px 與 1280 px 螢幕無水平捲動；title、canonical 隨 topic 更新正確。
行列式用直線框（inline 樣式，沿用 `.mx-row`）、聯立方程式用左大括號、向量字母上加箭頭，都是 inline style，**沒有新增 CSS 規則、沒有 SVG、沒有任何顏色字面值**；inline 樣式數值避開小數點寫法，不會觸發 `contentGuard` 的小數判定。

## ChatGPT 套用時要做的
- r3 取代 r2：`tools/math/g11-drills.html`；加入 `docs/g11-r3/`（r1、r2 資料夾保留）。r2 若還沒合併，就用 r3 更新同一個 PR；#50 的 g11 棘輪以 r3 為準。
- 高二區卡片加兩張：平面向量的基本運算與線性組合 `?topic=planevector`（放在「向量內積、正射影與柯西不等式」前）、二階行列式與克拉瑪公式 `?topic=determinant`（放在其後）。`ziyuan.html` 同步；若 #48 仍檢查總數宣告，跟著更新。
- topic 與連結數：相對 r2 合併後各 +2。P3：兩個新 topic，無豁免。

## 沒有驗證到的
- 真實印表機輸出（只用 Chromium print media 檢查版面）。
- 題庫原始 docx 的公式是 MathType 物件，專案裡的版本公式已遺失；題型依題目文字與解析判讀，數字與記號沒辦法逐題對照原卷。

## 需要使用者決定的
- 舊檔 `g10-vector-linear-combination.html` 是否下架或導向新 topic。
- 下一包：M21（缺國二上講義）、M8 國小三年級（g3 新引擎）、或 g8 `triineq`。
