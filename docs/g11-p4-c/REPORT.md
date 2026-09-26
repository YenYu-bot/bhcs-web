# G11 P4 PR-C｜七個 unit、19 種新增題型

#57 在 2026-09-26 台灣時間 13:48 的單輪查詢確認兩個 workflow 均 success；head 與預期 `616b21b4c84c30d50aba0d996442d81945efe97e` 相符。已轉正式並合併，PR-C 從新 main `7c98d30f4b95ce588d3f43804c962cd608dfcbe0` 建立。未輪詢 #57，也不查本次 PR-C CI。

## 逐 unit 結構與出題量

結構數依既有 ratchet 的數字正規化與固定種子，每級獨立抽 200 題。人名、符號及正負號可能各形成不同結構；這不是語意題型數。實際新增語意分支共 19 種。

| unit | 前 基／進／挑 | 後 基／進／挑 | 挑戰獨有結構 | 40／80 題 |
|---|---:|---:|---:|---|
| permutations/adjacent | 24／24／24 | 27／25／36 | 9 | 40／40、80／80，各級／模式 × 20 種子 |
| permutations/separated | 16／16／16 | 19／18／20 | 1 | 40／40、80／80，各級／模式 × 20 種子 |
| probability/dice | 3／3／3 | 5／5／6 | 1 | 40／40、80／80，各級／模式 × 20 種子 |
| probability/balls | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，各級／模式 × 20 種子 |
| radians/quadrant | 4／4／4 | 11／12／16 | 5 | 40／40、80／80，各級／模式 × 20 種子 |
| sector/cone | 3／3／3 | 14／14／18 | 4 | 40／40、80／80，各級／模式 × 20 種子 |
| trigtransform/intersections | 4／4／4 | 47／45／65 | 30 | 40／40、80／80，各級／模式 × 20 種子 |

五個 topic 的挑戰合格數：permutations 1→3、probability 1→3、radians 2→3、sector 2→3、trigtransform 2→3，全部達到 3／3。全站 G11 P4 backlog 已為 0。

- 本批 960 份卷、57,600 題；耗盡 0、重複 sig 0、重複可見題幹 0。
- 原生成器的 unit 呼叫以 parser 抽至配對括號結尾，原文逐位元組不變。4,200／4,200 次固定種子重播的題幹、答案、sig、verify 相同。新舊混合整卷的抽題序列會改變。
- 七個 unit 以外，全站 584 個 unit 的取樣指紋相同；另對 359 個 G11 unit 做三難度逐題對照。
- 不改 50 次重試上限、答案 10,000 上限、答案分母 ≤100、題幹分母 ≤12 及小數位數規則。沿用既有數型政策，PR-C 新題沒有小數。
- 數值：排列 5～7 人、計數答案 ≤10,000；骰子 4～10 面；抽球每色最多 10 顆（白球最多 6 顆）、抽 2～4 球，機率嚴格介於 0 與 1；圓錐半徑小於母線、展開角介於 0 與 2π；三角式振幅 1～8、頻率 1～6、平移 −8～8。
- 新題省略零項、係數 1 與一次方，負項使用減號；未新增 SVG、CSS、顏色。五個 config 函式以外，HTML 逐位元組相同。

## 教材與獨立 verify

本輪已讀取以下使用者教材的現行內容，不以搜尋摘要取代內容核對。新數值與題幹由本 PR 生成。

| unit | 教材依據 | 獨立 verify |
|---|---|---|
| permutations/adjacent | 《排列.docx》頁 9～11、120～121 第 129 題：綁組及兩組各自相鄰 | 完整列舉 n! 個帶標號排列，直接檢查各組位置是否連續；依 n、條件快取確切計數，不消耗亂數 |
| permutations/separated | 同教材頁 120 第 129 題插空、121～122 第 130 題兩對容斥 | 完整列舉排列，逐對檢查位置差；與插空／容斥生成公式走不同路徑 |
| probability/dice | 《機率.docx》頁 5 第 17 題補事件、頁 4 第 12 題恰一次、頁 5～6 第 20 題機率與點數成正比 | 公平骰子列舉兩次有序結果；非均勻骰子展開每個點數對應的等可能票券 |
| probability/balls | 同教材頁 1～2 第 5 題三色至少條件、頁 17 第 12 題同色 | 給每球唯一標號，列舉所有不放回子集合，直接數紅球與同色情形 |
| radians/quadrant | 《弳度量.html》genQuadrantAndCoterminal：實數弧度、正負大角與同界角 | 象限用 sin／cos 正負判定；代表角檢查區間與正餘弦同值 |
| sector/cone | 《扇形周長與面積.html》UNITS[3] 與 genConeSurface：側面積、弧長＝底周長、畢氏求斜高 | 反求半徑代回圓周＝弧長；側面積改用扇形面積重算；高與底半徑先 Math.hypot 求母線再代回 |
| trigtransform/intersections | 《三角函數平移.html》genPeriodExtremum、genTransformation、genIntersectionCount：極值、伸縮平移與水平線交點 | 由 asin／acos 解族列舉區間內不同根並代回；超出值域則核對歸一化水平值 |

## 三項檢查與完整驗收

1. **目錄／建置**：build_microscope、build_science、build_site、build_math_brand 通過；資源宣告＝掃描＝146；brand 108 links／41 files；整合檢查 99 HTML、1,197 本機連結、93 sitemap URLs；discovery 5 engines／72 topics。
2. **P2 報告更新**：2,367／2,367、473,400／473,400 次獨立抽題；candidate verify false 0、exceptions 0。已重建四份 docs/p2-math-validation 報告與既有對應 artifact。全站唯一 paperExhausted 仍是原有 G10 exponent/substitution 的宣告小題庫，本批七個 unit 為 0。
3. **既有版型／列印**：check_math_brand 與 check_science_integration 通過；parser 與字串對照確認共用 helpers、style、SVG、UI 與 print handlers 未變；四個 builder 重建後沒有額外差異。本輪未取得可用本機 Chromium，因此不宣稱完成新 PR 的真實瀏覽器視覺檢查；開 PR 的完整 Researcher CI 會執行既有瀏覽器與列印檢查。

- ratchet 0 失敗；topicFailures 0；projectedTopicGateFailures 0。
- 完整回歸 **22／22**（既有 21 項＋PR-C 1 項）；全站 smoke **72／72**。
- researcher batch5 與完整 20 stations＋directory＋余老師命名 audit 通過。

## 既有分支的已知問題

檢閱原碼發現：原 radians/quadrant 的角度池含 3π/2，但原答案把 270° 歸入第四象限，正確應為負 y 軸。依本批「不改既有題幹、答案、sig、verify」限制，原分支仍保留，尚未在本 PR 修正。新實數弧度分支用 sin／cos 獨立判定，沒有此問題。原碼重播相同與回歸通過不代表原有題目全部已完成語意校正。

## 19 種新增題型：完整樣本與教用答案

### permutations/adjacent/block｜指定多人綁成一段

題幹：編號 1～5 的 5 位同學排成一列，編號 1、2、5 的同學必須連成一段，段內順序不限，共有幾種排法？

教用答案：**36**。將三人視為一個單位，外部有 3! 種、內部有 3! 種，所以 3!×3!＝36。

### permutations/adjacent/twoBlocks｜兩組各自相鄰（挑戰）

題幹：編號 1～5 的 5 位同學排成一列，編號 2、3、5 必須連成一段，編號 1、4 也必須連成一段，兩段內順序均不限，共有幾種排法？

教用答案：**24**。兩段可互換位置，段內分別有 3! 與 2! 種，2!×3!×2!＝24。

### permutations/separated/gaps｜指定多人彼此不相鄰

題幹：編號 1～5 的 5 位同學排成一列，編號 1、2、5 的同學彼此都不得相鄰，共有幾種排法？

教用答案：**12**。先排另外兩人，有 2! 種；三個空隙各放一位指定同學，有 3! 種，共 12。

### permutations/separated/twoPairs｜兩對同時不得相鄰（挑戰）

題幹：編號 1～5 的 5 位同學排成一列，5 號與 2 號不得相鄰，且 1 號與 4 號也不得相鄰，共有幾種排法？

教用答案：**48**。用容斥：5!−2×(2×4!)＋4×3!＝48。

### probability/dice/exactOne｜兩次恰中一次

題幹：將點數為 1～4 的 4 面公平骰子獨立投擲兩次，求恰有一次出現 3 點的機率。

教用答案：**3/8**。兩種命中順序，各有 (1/4)(3/4)，所以 2×(1/4)×(3/4)＝3/8。

### probability/dice/atLeast｜兩次至少中一次

題幹：將點數為 1～4 的 4 面公平骰子獨立投擲兩次，求至少一次出現 4 點的機率。

教用答案：**7/16**。使用補事件：1−(3/4)²＝7/16。

### probability/dice/weighted｜非均勻骰子的比例機率（挑戰）

題幹：一顆 9 面骰子的點數為 1～9，各點數出現機率與點數成正比。擲一次，求出現 2 點或 6 點的機率。

教用答案：**8/45**。總權重 1＋⋯＋9＝45，有利權重 2＋6＝8，故 8/45。

### probability/balls/sameColor｜抽出兩球同色

題幹：袋中有紅球 6 顆、藍球 7 顆，每球等可能被抽到。同時抽兩球且不放回，求兩球同色的機率。

教用答案：**6/13**。[C(6,2)＋C(7,2)]／C(13,2)＝(15＋21)/78＝6/13。

### probability/balls/atLeast｜至少指定紅球數

題幹：袋中有紅球 4 顆、藍球 2 顆，每球等可能被抽到。同時抽 3 球且不放回，求至少 3 顆紅球的機率。

教用答案：**1/5**。本題至少 3 顆就是三顆全紅：C(4,3)／C(6,3)＝4/20＝1/5。

### probability/balls/threeColors｜三色抽球至少條件（挑戰）

題幹：袋中有紅球 4 顆、藍球 2 顆、白球 1 顆，每球等可能被抽到。同時抽 4 球且不放回，求至少 2 顆紅球的機率。

教用答案：**31/35**。依紅球數分成 2、3、4 顆：[C(4,2)C(3,2)＋C(4,3)C(3,1)＋C(4,4)]／C(7,4)＝31/35。

### radians/quadrant/realAngle｜實數弧度的象限

題幹：角 θ＝67/6 弧度(不含 π 因子)，判斷其終邊位於第幾象限。

教用答案：**第 4 象限**。67/6−2π≈4.8834，介於 3π/2 與 2π，故在第四象限。

### radians/quadrant/positive｜實數弧度的最小正同界角

題幹：求 -38 弧度的最小正同界角，以 π 的精確式表示。

教用答案：**-38+14π**。−38＋12π＜0；再加 2π 得 −38＋14π≈5.9823，落在 (0,2π)。

### radians/quadrant/negative｜負區間同界角與象限（挑戰）

題幹：角 θ＝-38 弧度，求區間 [-2π，0) 內的同界角，並判斷其終邊象限。

教用答案：**-38+12π；第 4 象限**。−38＋12π≈−0.3009，位於 [−2π,0)；終邊在第四象限。

### sector/cone/baseRadius｜由展開角反求底面半徑

題幹：圓錐側面展開扇形的半徑為 4，圓心角為 π/3。求圓錐底面半徑。

教用答案：**2/3**。展開弧長為 4×π/3＝4π/3，等於底面圓周 2πr，得 r＝2/3。

### sector/cone/lateralArea｜底面半徑與母線求側面積

題幹：直圓錐底面半徑 4 又 2/3、母線長 7，求側面積(保留 π)。

教用答案：**98π/3**。底面半徑 4 又 2/3＝14/3，側面積 πrL＝π×(14/3)×7＝98π/3。

### sector/cone/heightAngle｜由底面半徑與高求展開角（挑戰）

題幹：直圓錐底面半徑 84、高 35，將側面沿母線剪開，求展開扇形的圓心角(弧度)。

教用答案：**24π/13**。母線 L＝√(84²＋35²)＝91，θ＝2π×84/91＝24π/13。

### trigtransform/intersections/tangent｜水平線切於極值

題幹：在 0≤x＜2π 內，水平線 y＝3 與函數 y＝8cos(4x)-5 相切，共有幾個相異交點？

教用答案：**4 個**。最大值為 8−5＝3，每週期有一個最高點；[0,2π) 有 4 個完整週期，故 4 個。

### trigtransform/intersections/outside｜水平線超出值域

題幹：在 0≤x＜2π 內，判斷直線 y＝2 與函數 y＝3sin(4x)-3 的相異交點個數。

教用答案：**0 個**。函數值域為 [−6,0]，2 在值域外，故 0 個交點。

### trigtransform/intersections/shifted｜伸縮與平移後的中心線交點（挑戰）

題幹：在 0≤x＜2π 內，解含水平及鉛直平移的方程式 7sin(3x-π/4)-8＝-8，共有幾個相異實根？

教用答案：**6 個**。消去鉛直平移後得 sin(3x−π/4)＝0；[0,2π) 含 3 個完整週期，每週期 2 根，共 6 根。

## 重現指令

```sh
P4_C_REPORT=docs/g11-p4-c/results.json node scripts/math-regressions/g11-p4-c.mjs
for test in scripts/math-regressions/*.mjs; do
  [ "$(basename "$test")" = helper.mjs ] || node "$test" || exit 1
done
node scripts/math_local_check.mjs --all 40
MATH_DIVERSITY_REPORT=math-validation-artifacts/diversity-current.json node scripts/test_math_drills.mjs
node scripts/enforce_math_diversity.mjs
node scripts/classify_math_drills.mjs
```
