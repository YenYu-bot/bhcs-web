# G11 P4 PR-B｜15 個 unit 驗收與 40 種新增題型

PR-A #56 的 Researcher lab batch check 已於台灣時間 2026-09-26 09:26:54 成功完成（PR-B 初次開 PR 的回合僅查一次）；連同上一輪已通過的 Math fix regressions，已轉正式並合併。PR-B 基準為合併 commit `8082004dc7843b7da3b481e72a0f77e11748679d`。

本報告已更新為格式與參數限制修正版；詳見 [REVISION-2.md](REVISION-2.md)，本輪沒有查 CI。

## 逐 unit 結果

結構數依 ratchet 原本的正規化方式，每級固定種子抽 200 次。結構數與語意題型數分列；本 PR 共新增 40 個分支。每個改動 unit 另有強制回歸：每級結構 ≥3，挑戰級含基礎級沒有的結構，不以放大數字代替。

| unit | 修改前 基／進／挑 | 修改後 基／進／挑 | 挑戰新增結構 | 40／80 題卷 |
|---|---|---|---:|---|
| bayes/bayestwo | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| bayes/medicalpositive | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| bayes/repeatedtest | 2／2／2 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| combinations/required | 3／3／3 | 5／5／6 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| combinations/atleast | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| combinations/groups | 2／2／2 | 3／3／5 | 2 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| commonlog/definition | 2／2／2 | 10／9／11 | 2 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| commonlog/laws | 8／8／8 | 9／9／10 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| commonlog/change | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/definition | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/withoutreplacement | 4／4／4 | 4／4／6 | 2 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/solveunion | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/equation | 8／8／8 | 15／16／15 | 4 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/combined | 3／3／3 | 8／8／11 | 3 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/inverse | 9／8／8 | 16／16／24 | 8 | 40／40、80／80，所有模式與難度 × 20 種子通過 |

五個 topic 的挑戰級合格 unit 均由 **0／3 → 3／3**，且剛好是上表核可的三個 unit。

- 2,040 份卷、122,400 題；0 耗盡、0 重複 sig、0 重複可見題幹。原本 50 次重試、答案 10,000 上限、分母 ≤100、題幹分母與小數位數規則均未放寬。
- Bayes 三個 unit 的舊分支正常出題也套用新範圍；不符即退回重抽。下列原題重播是直接驗證保留的 legacyGen，不代表超界舊題仍會發給學生。
- 原生成器透過 parser 抽至配對括號末端，逐位元組不變；原分支固定種子重播 **9,000／9,000** 題相同，包含題幹、答案、sig 與 verify 結果。新增分支會改變整卷抽題序列；不聲稱新版整卷沿用舊版序列。
- commonlog/definition 的原分數模式 30 題完整集合仍保留並驗證；總題庫擴大後將原欄位改為 `legacyBankSize`。整數與分數兩模式都通過各級 40／80 題壓測。
- 相對 PR-A 合併基準，未修改的 **576 個 unit** 取樣指紋完全相同。
- 舊 P4-A 回歸的變動 topic 斷言改為只檢查自身範圍，使後續批次可以合法新增其他 topic；原題重播、完整 unit 門檻與 40／80 題壓測全保留。原反函數樣本測試改驗保留的原分支，新分支由 PR-B 測試涵蓋。

## 三項檢查與本機結果

1. **目錄與建置**：四個 builder 成功；資源宣告＝實際掃描＝146；math brand 108 links／41 files；discovery 5 engines／72 topics。整合檢查 99 HTML、1,197 本機連結、93 sitemap URLs 通過。
2. **P2 報告**：2,367／2,367 組、473,400／473,400 次獨立抽題；原始 verify 失敗 0、例外 0。已重建並提交四份 `docs/p2-math-validation` 變動報告。全站只剩 G10 exponent/substitution 一筆原有宣告小題庫耗盡；PR-B 的 15 個 unit 為 0。
3. **歷史版型與列印規則**：`check_math_brand.cjs` 與 `check_science_integration.cjs` 通過；沒有改 SVG、CSS、顏色。四個 builder 在暫存變更後重跑，`git diff --exit-code` 乾淨。

- ratchet **0 失敗**，topicFailures **0**、projectedTopicGateFailures **0**。
- 完整回歸 **21／21**，包含 PR-A 與 PR-B；全站 smoke **72／72 topic**。
- researcher batch 5、20 個 station 與目錄 audit 在本 PR 初版已通過；本次重跑 math brand／integration、全站數學驗證及全部回歸。
- 首輪完整取樣抓到新冪底數題的浮點驗證誤差；已改以 BigInt 整數冪代回，沒有放寬容差。最後版本已重跑完整取樣，verify 失敗為 0。
- push 依 pull_request synchronize 事件觸發 CI，本輪不查 CI。

## 教材與獨立 verify

| topic／unit | 教材對應 | 新題 verify 的另一條路 |
|---|---|---|
| bayes/bayestwo | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| bayes/medicalpositive | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| bayes/repeatedtest | 2／2／2 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| combinations/required | 3／3／3 | 5／5／6 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| combinations/atleast | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| combinations/groups | 2／2／2 | 3／3／5 | 2 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| commonlog/definition | 2／2／2 | 10／9／11 | 2 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| commonlog/laws | 8／8／8 | 9／9／10 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| commonlog/change | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/definition | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/withoutreplacement | 4／4／4 | 4／4／6 | 2 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/solveunion | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/equation | 8／8／8 | 15／16／15 | 4 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/combined | 3／3／3 | 8／8／11 | 3 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/inverse | 9／8／8 | 16／16／24 | 8 | 40／40、80／80，所有模式與難度 × 20 種子通過 |

補充原始教材連結：

- [台中女中補充講義](https://webapps.tcfsh.tc.edu.tw/jflai/rab/RA6100ans1.pdf)，第 1 頁：重複檢驗、至少一次陽性。
- [中華科技大學〈例題－與反函數合成〉](https://aca.cust.edu.tw/online/custcalculusi/02/01_04_09.html)。

以下 40 種樣本均重新從修正版的本機壓測實際抽出；各題附完整題幹與教用答案，取代初版樣本。

## bayes/bayestwo 的新增題型與完整樣本

**由良品反推來源**（`bayes/bayestwo/good`）

題幹：某批產品有 (3/4) 來自甲廠，其餘來自乙廠；兩廠不良率分別為 25％、40％。已知抽到良品，求來自甲廠的機率。

教用答案：(15/19)。

**由實際件數反推來源**（`bayes/bayestwo/counts`）

題幹：甲、乙廠各有 16、6 件產品，其中不良品各有 1、2 件。合併後等可能抽一件，已知是不良品，求來自甲廠的機率。

教用答案：(1/3)。

**由來源後驗反求供貨比例（挑戰）**（`bayes/bayestwo/prior`）

題幹：甲、乙廠的不良率分別為 15％、5％。已知一件不良品來自甲廠的機率為 (1/4)，求甲廠原本的供貨比例。

教用答案：(1/10)。

## bayes/medicalpositive 的新增題型與完整樣本

**由特異度求陽性後驗**（`bayes/medicalpositive/specificity`）

題幹：教學模型中患病率為 (2/9)，檢驗靈敏度為 80％，特異度為 60％。已知檢驗陽性，求患病的機率。

教用答案：(4/11)。

**由檢驗人數求陽性後驗**（`bayes/medicalpositive/counts`）

題幹：教學用檢驗資料中，患者 19 人有 12 人呈陽性，健康者 67 人有 23 人呈陽性。從所有陽性者等可能抽一人，求此人患病的機率。

教用答案：(12/35)。

**由陽性後驗反求偽陽性率（挑戰）**（`bayes/medicalpositive/falsePositive`）

題幹：教學模型中患病率為 (1/7)，患者呈陽性的機率為 60％。已知陽性者患病的機率為 (2/3)，求健康者被誤判陽性的機率（以百分率作答）。

教用答案：5％。

## bayes/repeatedtest 的新增題型與完整樣本

**指定混合陽性／陰性序列**（`bayes/repeatedtest/mixed`）

題幹：教學模型中患病率為 (1/5)；患者、健康者每次呈陽性的機率分別為 (2/3)、(1/6)，各次檢驗在健康狀態固定下互相獨立。已知 2 次檢驗第一次陽性，其餘陰性，求患病的機率。

教用答案：(2/7)。

**至少一次陽性的後驗（挑戰）**（`bayes/repeatedtest/atLeast`）

題幹：教學模型中患病率為 (1/10)；患者、健康者每次呈陽性的機率分別為 (3/5)、(1/4)，各次檢驗在健康狀態固定下互相獨立。已知 2 次檢驗至少一次陽性，求患病的機率。

教用答案：(16/91)。

## combinations/required 的新增題型與完整樣本

**多人必選**（`combinations/required/includeMany`）

題幹：從 10 人中選 5 人，指定 3 人全部必選，共有幾種選法？

教用答案：21。

**多人禁選**（`combinations/required/excludeMany`）

題幹：從 8 人中選 3 人，指定 2 人全部不得入選，共有幾種選法？

教用答案：20。

**必選與禁選同時限制（挑戰）**（`combinations/required/bothRules`）

題幹：從 8 人中選 3 人，指定 2 人全部必選，另有 2 人全部不得入選，共有幾種選法？

教用答案：4。

## combinations/atleast 的新增題型與完整樣本

**至多選取**（`combinations/atleast/atMost`）

題幹：有男生 5 人、女生 5 人，選出 6 人，其中至多 1 位女生，共有幾種選法？

教用答案：5。

**恰有指定人數**（`combinations/atleast/exact`）

題幹：有男生 4 人、女生 6 人，選出 6 人，其中恰有 3 位女生，共有幾種選法？

教用答案：80。

**上下限同時限制（挑戰）**（`combinations/atleast/between`）

題幹：有男生 6 人、女生 6 人，選出 3 人，其中女生至少 2 位且至多 3 位，共有幾種選法？

教用答案：110。

## combinations/groups 的新增題型與完整樣本

**指定人進指定組**（`combinations/groups/fixed`）

題幹：將含小明、小華的 8 人分入有名稱的甲、乙、丙三組，人數為 3、2、3。小明必須在甲組，共有幾種分法？

教用答案：210。

**指定兩人不同組（挑戰）**（`combinations/groups/apart`）

題幹：將含小明、小華的 4 人分入有名稱的甲、乙、丙三組，人數為 2、1、1。小明、小華必須不同組，共有幾種分法？

教用答案：10。

**指定兩人同組（挑戰）**（`combinations/groups/together`）

題幹：將含小明、小華的 8 人分入有名稱的甲、乙、丙三組，人數為 4、2、2。小明、小華必須同組，共有幾種分法？

教用答案：120。

## commonlog/definition 的新增題型與完整樣本

**冪底數與冪真數求值**（`commonlog/definition/powerBase`）

題幹：求 log<sub>5<sup>4</sup></sub>（5<sup>8</sup>）的值。

教用答案：2。

**由對數定義反求線性真數中的 x**（`commonlog/definition/argument`）

題幹：已知 log<sub>10</sub>（4x）＝4，求 x。

教用答案：2500。

**已知對數值代入乘冪真數（挑戰）**（`commonlog/definition/substitute`）

題幹：已知 x＞0 且 log<sub>3</sub>x＝2，求 log<sub>3</sub>（3x<sup>4</sup>）。

教用答案：9。

## commonlog/laws 的新增題型與完整樣本

**三項對數加減**（`commonlog/laws/threeTerms`）

題幹：計算 log<sub>5</sub>125＋log<sub>5</sub>625−log<sub>5</sub>5。

教用答案：6。

**加減與係數法則合用（挑戰）**（`commonlog/laws/weighted`）

題幹：計算 4log<sub>5</sub>625＋log<sub>5</sub>5−log<sub>5</sub>125。

教用答案：14。

## commonlog/change 的新增題型與完整樣本

**同底對數比值換底**（`commonlog/change/ratio`）

題幹：計算 ((log<sub>11</sub>25)/(log<sub>11</sub>5))。

教用答案：2。

**開放連乘求值**（`commonlog/change/openChain`）

題幹：計算 log<sub>5</sub>3 × log<sub>3</sub>11 × log<sub>11</sub>625。

教用答案：4。

**以已知對數符號表示真數乘積**（`commonlog/change/symbolic`）

題幹：已知 u＝log 2、v＝log 3，以 u、v 表示 log 18。

教用答案：u＋2v。

**冪底數連乘換底（挑戰）**（`commonlog/change/poweredChain`）

題幹：計算 log<sub>11<sup>2</sup></sub>2 × log<sub>2<sup>3</sup></sub>5 × log<sub>5<sup>2</sup></sub>（11<sup>24</sup>）。

教用答案：2。

## conditionalprob/definition 的新增題型與完整樣本

**補事件的條件機率**（`conditionalprob/conditionalDefinition/complement`）

題幹：調查 35 人，同時屬 A、B 的有 9 人，只屬 A 的有 9 人，只屬 B 的有 14 人，兩者皆非有 3 人。求 P（A′｜B）。

教用答案：(14/23)。

**交換條件事件**（`conditionalprob/conditionalDefinition/reverse`）

題幹：調查 42 人，同時屬 A、B 的有 5 人，只屬 A 的有 13 人，只屬 B 的有 15 人，兩者皆非有 9 人。求 P（B｜A）。

教用答案：(5/18)。

**以聯集為條件的機率（挑戰）**（`conditionalprob/conditionalDefinition/unionGiven`）

題幹：調查 37 人，同時屬 A、B 的有 12 人，只屬 A 的有 13 人，只屬 B 的有 3 人，兩者皆非有 9 人。求 P（A｜A∪B）。

教用答案：(25/28)。

## conditionalprob/withoutreplacement 的新增題型與完整樣本

**已知後次結果反求前次（挑戰）**（`conditionalprob/withoutreplacement/reverseLast`）

題幹：袋中紅球 4 顆、藍球 7 顆，依序抽兩球且不放回。已知第二球為紅球，求第一球為藍球的機率。

教用答案：(7/10)。

**已知前兩球組成求第三球（挑戰）**（`conditionalprob/withoutreplacement/twoKnown`）

題幹：袋中紅球 5 顆、藍球 4 顆，連抽三球且不放回。已知前兩球恰一紅一藍，求第三球為紅球的機率。

教用答案：(4/7)。

## conditionalprob/solveunion 的新增題型與完整樣本

**由皆不發生反求機率**（`conditionalprob/solveunion/neither`）

題幹：A、B 為獨立事件，P（A）＝(1/6)，P（A′∩B′）＝(5/7)，求 P（B）。

教用答案：(1/7)。

**由聯集條件機率反求**（`conditionalprob/solveunion/conditionalUnion`）

題幹：A、B 為獨立事件，P（A）＝(3/5)，P（A｜A∪B）＝(6/7)，求 P（B）。

教用答案：(1/4)。

**由恰一個發生反求（挑戰）**（`conditionalprob/solveunion/exactlyOne`）

題幹：A、B 為獨立事件，P（A）＝(1/6)，恰有一個事件發生的機率＝(3/4)，求 P（B）。

教用答案：(7/8)。

## loggraphs/equation 的新增題型與完整樣本

**同底對數等式**（`loggraphs/equation/equalLogs`）

題幹：解方程式 log<sub>2</sub>（4x−22）＝log<sub>2</sub>（2x−8）。

教用答案：x＝7。

**平方整體為真數的雙解（挑戰）**（`loggraphs/equation/squareArgument`）

題幹：解方程式 log<sub>2</sub>［（x−2）<sup>2</sup>］＝2。

教用答案：x＝0 或 4。

## loggraphs/combined 的新增題型與完整樣本

**對數差合併成商**（`loggraphs/combined/difference`）

題幹：解方程式 log<sub>2</sub>（x＋20）−log<sub>2</sub>（x−4）＝log<sub>2</sub>5。

教用答案：x＝10。

**以對數換元的二次方程（挑戰）**（`loggraphs/combined/quadraticLog`）

題幹：解方程式（log<sub>2</sub>x）<sup>2</sup>−6log<sub>2</sub>x＋8＝0。

教用答案：x＝4 或 16。

## loggraphs/inverse 的新增題型與完整樣本

**對數函數反解為指數函數**（`loggraphs/inverse/fromLog`）

題幹：求 f（x）＝log<sub>2</sub>（x−1）＋1 的反函數。

教用答案：f<sup>−1</sup>（x）＝2<sup>x−1</sup>＋1。

**伸縮、平移指數函數的反函數（挑戰）**（`loggraphs/inverse/scaledExponential`）

題幹：求 f（x）＝5×5<sup>x＋3</sup>＋6 的反函數。

教用答案：f<sup>−1</sup>（x）＝log<sub>5</sub>（((x−6)/5)）−3。

## 重現指令

```sh
P4_B_REPORT=/tmp/p4-b-results.json node scripts/math-regressions/g11-p4-b.mjs
for test in scripts/math-regressions/*.mjs; do
  [ "$(basename "$test")" = helper.mjs ] || node "$test" || exit 1
done
node scripts/math_local_check.mjs --all 40
MATH_DIVERSITY_REPORT=math-validation-artifacts/diversity-current.json node scripts/test_math_drills.mjs
node scripts/enforce_math_diversity.mjs
node scripts/classify_math_drills.mjs
```
