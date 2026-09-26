# G11 P4 PR-A｜本機驗收與新題型樣本

基準：PR #55 合併後 `a0bd8a91d7f38ce3e940fd02480c8fabba725930`。僅修改核可的五個 unit；commonlog/definition 留待 PR-B。

## 結構與卷內耗盡

結構數沿用 ratchet 的題幹正規化與每級 200 次固定種子取樣；這是格式結構數，並非語意題型數。本 PR 共新增 17 個語意分支。每個改動 unit 都另有回歸強制檢查：每級至少 3 個結構，挑戰級至少 1 個基礎級沒有的結構。

| unit | 修改前 基／進／挑 | 修改後 基／進／挑 | 挑戰新增結構 | 正式卷／壓測 |
|---|---|---|---:|---|
| expequations/quadratic | 3／3／3 | 6／6／8 | 2 | 40／40、80／80；各模式 × 各級 × 20 種子全通過 |
| expequations/application | 2／2／2 | 5／5／6 | 1 | 40／40、80／80；各模式 × 各級 × 20 種子全通過 |
| anglesum/known | 2／2／2 | 20／20／30 | 10 | 40／40、80／80；各模式 × 各級 × 20 種子全通過 |
| anglesum/triangle | 1／1／1 | 11／12／26 | 15 | 40／40、80／80；各模式 × 各級 × 20 種子全通過 |
| vectorcauchy/projection | 16／16／16 | 53／47／57 | 23 | 40／40、80／80；各模式 × 各級 × 20 種子全通過 |

- 720 份卷、43,200 題：0 耗盡、0 重複可見題幹；使用原引擎的 50 次重試上限。
- 原始生成器宣告逐位元組相同；固定種子重播原分支 3,000／3,000 相同（含題幹、答案、sig、verify 結果）。混合新題型後抽題序列會包含新分支；重播測試比較保留的原分支，不聲稱新版整份卷沿用舊版抽題序列。
- 舊 known 的 22 題、triangle 的 32 題完整集合仍由原枚舉測試驗證。總題庫已擴充，因此將原總庫量欄位改為 `legacyBankSize`；沒有縮小 UI 題數或放寬重試。
- 對 main/r3 基準，未修改的 586 個 unit 取樣指紋全部相同，沒有基準退步。
- 挑戰級 topic 門檻：expequations 2→4（要求 3）、anglesum 2→4（要求 3）、vectorcauchy 2→3（要求 3）。

## 三項檢查清單與完整驗收

1. 目錄／建置：四個 builder 成功；math brand 108 links／41 files；discovery 5 engines／72 topics。整合檢查 99 HTML、1,197 本機連結、93 sitemap URLs 通過。沒有新增 topic 或 canonical URL。
2. P2 報告：2,367／2,367 組通過，473,400／473,400 次獨立抽題；verify 失敗 0、例外 0。已重建並提交 `docs/p2-math-validation` 四份變動報告。全站剩下 2 筆既有宣告小題庫耗盡（G10 exponent/substitution、PR-B commonlog/definition）；本 PR 五個 unit 為 0。
3. 歷史頁面與列印：`check_math_brand.cjs`、`check_science_integration.cjs` 通過；worksheet markup／print rules 保留，沒有新增或修改 SVG、CSS、顏色。四個 builder 在暫存變更後重跑，`git diff --exit-code` 為乾淨。

- ratchet：failures 0、topicFailures 0、projectedTopicGateFailures 0。
- 回歸：20／20（含新增 P4-A 回歸）；最後新增的完整 unit 門檻亦單獨重跑通過。
- smoke：72／72 topic 通過（`math_local_check.mjs --all 40`）。
- researcher batch 5 與全站 station audit 通過。
- PR 建立會觸發兩個 pull_request workflow；本輪不查 CI。

## 教材與獨立 verify 路徑

| unit | 教材對應 | 新分支 verify |
|---|---|---|
| expequations/quadratic | 使用者教材《指數方程與應用.html》`genQuadraticTypeExponent` 的 At²+Bt+C 換元；正根篩選另見南崁高中下列習作第 32、35 頁 | 從展開係數用判別式求根、篩正根及取對數，比對解集合，再將 x 代回原指數方程 |
| expequations/application | 同教材 `genExponentialApplication` 的 bacteria／half_life（已知時刻、起始量、固定週期） | 逐期乘法／折半數值重算；反求時間另列舉期數檢查唯一性 |
| anglesum/known | 使用者教材《和插角公式.html》`genValues` 的 tan／tanSolve | 由 atan 還原角後直接算 Math.tan；反向題再以角差回驗 |
| anglesum/triangle | 同教材 `genTriangle` 的 tanC／sinC／cosC，配合 `genValues` 的 tanSolve | asin／acos／atan 還原角，使用 C＝π−A−B 數值重算；反求 B 另以角差回驗 |
| vectorcauchy/projection | 使用者教材《向量內積、柯西.html》`genProj` 的 pts／decomp／angle | 平行行列式為 0、殘差與方向垂直、兩分量重建原向量；反向坐標列舉 −8…8 的唯一解 |

外部補充教材：[南崁高中《高中數學（3）A‧習作》第 2 章](https://www.nksh.tyc.edu.tw/ischool/wr/file/1/12649/eeee4caf999618530f45ba0b2f019d2d.pdf)。題目數值與下面樣本由本 PR 新生成器產生。

所有新分支繼續使用既有 `contentGuard`、`answerWithinLimits`、`UNIT_POLICIES`：答案範圍／分母上限／小數位數均未放寬。新題幹分數最多分母 12；triangle 原有教材三角比的 topic 特例照留。二次型仍為整數模式、應用仍為整數／小數模式，其餘三個 unit 仍為分數模式。

## 每個新增題型的完整樣本

以下為壓測實際抽出的題目；分數以 `a/b`、帶分數以「又」轉寫，內容與教用答案不變。

### expequations/quadratic

**換元後排除負根**（`p4qu:positiveRoot`）

題幹：解方程式 2×4^(2x)−14×4^(x)−288＝0。

教用答案：x＝2。令 t＝4^x＞0，2(t−16)(t＋9)＝0，排除 t＝−9，故 x＝2。

**換元後的重根**（`p4qu:doubleRoot`）

題幹：解方程式 6×3^(2x)−36×3^(x)＋54＝0。

教用答案：x＝1。令 t＝3^x，6(t−3)²＝0，故 x＝1（只有一個解）。

**平移指數的雙根（挑戰限定）**（`p4qu:shiftedRoots`）

題幹：解方程式 6×3^(2(x＋1))−504×3^(x＋1)＋1458＝0。

教用答案：x＝0 或 3。令 t＝3^(x＋1)，6(t−3)(t−81)＝0，故 x＋1＝1 或 4。

### expequations/application

**由已知時刻推另一時刻**（`p4ap:later`）

題幹：某菌群每小時變為原來的 3 倍，第 4 小時數量為 7，求第 5 小時的數量。

教用答案：21。7×3＝21。

**由末值反求初值**（`p4ap:initial`）

題幹：某菌群每小時變為原來的 3 倍，4 小時後數量為 729，求起初的數量。

教用答案：9。729÷3⁴＝9。

**半衰期與經過時間**（`p4ap:halfLife`）

題幹：某物質的半衰期為 10 天，起初有 4 公克，求 10 天後剩餘的質量。

教用答案：2 公克。經過一個半衰期，4÷2＝2 公克。

**反求經過時間（挑戰限定）**（`p4ap:elapsed`）

題幹：某菌群每 10 小時變為原來的 2 倍，數量從 2 增加到 4 共需幾小時？

教用答案：10 小時。4÷2＝2，需一個週期，即 10 小時。

### anglesum/known

**已知正切求和角**（`p4kn:tanSum`）

題幹：α、β為銳角，tanα＝1、tanβ＝4，求 tan(α＋β)。

教用答案：−(1又2/3)。(1＋4)/(1−4)＝−5/3。

**已知正切求差角**（`p4kn:tanDiff`）

題幹：α、β為銳角，tanα＝1又1/7、tanβ＝2/5，求 tan(α−β)。

教用答案：26/51。(8/7−2/5)/(1＋(8/7)(2/5))＝26/51。

**由和角正切反求另一角（挑戰限定）**（`p4kn:inverseTan`）

題幹：α、β為銳角，tanα＝1又1/3，tan(α＋β)＝3又5/7，求 tanβ。

教用答案：2/5。設 tanβ＝t，(4/3＋t)/(1−4t/3)＝26/7，解得 t＝2/5。

### anglesum/triangle

**兩內角正切求第三角正切**（`p4tr:tanC`）

題幹：△ABC 中 A、B 均為銳角，tanA＝1、tanB＝4，求 tanC。

教用答案：1又2/3。C＝π−(A＋B)，tanC＝−tan(A＋B)＝5/3。

**已知兩內角三角比求 sinC**（`p4tr:sinC`）

題幹：△ABC 中 A、B 均為銳角，sinA＝4/5、cosB＝5/13，求 sinC。

教用答案：56/65。cosA＝3/5、sinB＝12/13，sinC＝sin(A＋B)＝56/65。

**已知兩內角三角比求 cosC**（`p4tr:cosC`）

題幹：△ABC 中 A、B 均為銳角，cosA＝3/5、cosB＝12/13，求 cosC。

教用答案：−16/65。sinA＝4/5、sinB＝5/13，cosC＝−cos(A＋B)＝−16/65。

**由 tanA 與 tan(A+B) 反求 tanB（挑戰限定）**（`p4tr:recoverTanB`）

題幹：△ABC 中 A、B 均為銳角，tanA＝1又1/2、tan(A＋B)＝3又2/3，求 tanB。

教用答案：1/3。設 tanB＝t，(3/2＋t)/(1−3t/2)＝11/3，解得 t＝1/3。

### vectorcauchy/projection

**三點坐標求正射影**（`p4pr:points`）

題幹：已知 A(−3，3)、B(3，−1)、C(−7，0)，求向量 AB 在 AC 方向上的正射影向量。

教用答案：(1又23/25，1又11/25)。AB＝(6,−4)、AC＝(−4,−3)，投影係數 −12/25，投影＝(48/25,36/25)。

**平行／垂直向量分解**（`p4pr:decompose`）

題幹：a＝(−3，2)、b＝(4，4)。將 b 分解為平行 a 的 u 與垂直 a 的 v，求 u、v。

教用答案：u＝(12/13，−8/13)；v＝(3又1/13，4又8/13)。u＝(12/13,−8/13)，v＝(40/13,60/13)；u＋v＝b，且 v·a＝0。

**由正射影反求坐標（挑戰限定）**（`p4pr:inverse`）

題幹：a＝(2，4)、b＝(x，6)，已知 b 在 a 方向上的正射影向量為 2a，求 x。

教用答案：x＝8。正射影為 (4,8)，故 (x−4,−2)·(2,4)＝0，得到 x＝8。

## 重現指令

```sh
P4_A_REPORT=/tmp/p4-a-results.json node scripts/math-regressions/g11-p4-a.mjs
for test in scripts/math-regressions/*.mjs; do
  [ "$(basename "$test")" = helper.mjs ] || node "$test" || exit 1
done
node scripts/math_local_check.mjs --all 40
MATH_DIVERSITY_REPORT=math-validation-artifacts/diversity-current.json node scripts/test_math_drills.mjs
node scripts/enforce_math_diversity.mjs
node scripts/classify_math_drills.mjs
```
