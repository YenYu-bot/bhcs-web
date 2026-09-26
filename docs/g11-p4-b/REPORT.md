# G11 P4 PR-B｜15 個 unit 驗收與 40 種新增題型

PR-A #56 的 Researcher lab batch check 已於台灣時間 2026-09-26 09:26:54 成功完成（本輪僅查一次）；連同上一輪已通過的 Math fix regressions，已轉正式並合併。PR-B 基準為合併 commit `8082004dc7843b7da3b481e72a0f77e11748679d`。

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
| commonlog/definition | 2／2／2 | 5／5／6 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| commonlog/laws | 8／8／8 | 9／9／10 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| commonlog/change | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/definition | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/withoutreplacement | 4／4／4 | 4／4／6 | 2 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| conditionalprob/solveunion | 1／1／1 | 3／3／4 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/equation | 8／8／8 | 10／11／13 | 3 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/combined | 3／3／3 | 6／6／7 | 1 | 40／40、80／80，所有模式與難度 × 20 種子通過 |
| loggraphs/inverse | 9／8／8 | 12／12／16 | 4 | 40／40、80／80，所有模式與難度 × 20 種子通過 |

五個 topic 的挑戰級合格 unit 均由 **0／3 → 3／3**，且剛好是上表核可的三個 unit。

- 2,040 份卷、122,400 題；0 耗盡、0 重複 sig、0 重複可見題幹。原本 50 次重試、答案 10,000 上限、分母 ≤100、題幹分母與小數位數規則均未放寬。
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
- researcher batch 5、20 個 station 與目錄 audit 通過。
- 首輪完整取樣抓到新冪底數題的浮點驗證誤差；已改以 BigInt 整數冪代回，沒有放寬容差。最後版本已重跑完整取樣，verify 失敗為 0。
- PR 建立後依 pull_request 事件觸發 CI，本輪不查 CI。

## 教材與獨立 verify

| topic／unit | 教材對應 | 新題 verify 的另一條路 |
|---|---|---|
| bayes/bayestwo | 《貝氏定理.docx》來源反推、玩偶／工廠／事故來源與未知先驗 | 生成採貝氏公式；驗證以整數票券或產品逐件列舉，對符合條件者重新計數 |
| bayes/medicalpositive | 同講義第 7 頁癌症檢驗、第 12–13 頁感染檢驗與條件機率；既有反求先驗／條件率題型 | 從檢驗人數或等可能票券取條件子集合；反向率代入原條件驗證 |
| bayes/repeatedtest | 同講義第 2 頁第 4 題與重複檢驗，配合條件獨立及補事件；台中女中補充講義「至少一次陽性」 | 生成採冪與補事件；驗證列舉全部 2ⁿ 個檢驗序列，逐次乘權重後條件化 |
| combinations/required | 《組合.docx》指定人物入選／不入選、多人限制選取 | 生成採組合式；驗證逐一列舉相異人員子集合並檢查條件 |
| combinations/atleast | 同講義第 5–6 頁男、女生各至少一定人數的委員會 | 生成分類相加；驗證列舉所有人員子集合再按實際人數篩選 |
| combinations/groups | 同講義第 41 題、分組與指定兩人同組 | 生成採組合計數；驗證逐人指派到有名稱的組別並檢查容量、同組／不同組 |
| commonlog/definition | 《常用對數與對數律.html》genLogDefinition 的定義與線性真數；《對數.html》genLogDefinition 的指數互換 | 原式數值代回；冪底數使用 BigInt 整數冪交叉驗證，避免浮點誤差 |
| commonlog/laws | 前述 HTML 的 genLogAdditionSubtraction、genLogArithmetic | 先合併成實際正真數乘積／商，再以數值對數驗算 |
| commonlog/change | genChangeOfBase 的 chain_rule／base_conversion、換底公式 | 以自然對數或常用對數實算原表達式，比對化簡答案 |
| conditionalprob/definition | 《條件機率與獨立事件.docx》的條件樣本空間、交聯與補事件 | 建立逐人 A、B 標記，篩條件事件後再計數 |
| conditionalprob/withoutreplacement | 同講義不放回抽球／抽籤、已知前次或後次結果 | 列舉有標號球的二次／三次不放回有序抽法後篩條件 |
| conditionalprob/solveunion | 同講義獨立事件、交聯／補事件、恰一個發生 | 建立兩事件獨立的等可能格點，逐點判斷條件或事件 |
| loggraphs/equation | 《對數方程與圖形.html》genLogEquation 的真數條件；《對數.html》指數與對數方程式 | 將每個 x 代入題幹，數值計算兩側對數並確認真數 >0 |
| loggraphs/combined | 前述 genLogEquation 的合併與定義域；《對數.html》genLogEquations 的 quadratic_log | 回代原對數差或二次式，逐解確認真數正、解相異 |
| loggraphs/inverse | 既有反函數 unit、原教材圖形平移；中華科技大學反函數合成講義 | 以多個合法值做 f(g(x))、g(f(x)) 的數值合成回驗 |

補充原始教材連結：

- [台中女中補充講義](https://webapps.tcfsh.tc.edu.tw/jflai/rab/RA6100ans1.pdf)，第 1 頁：重複檢驗、至少一次陽性。
- [中華科技大學〈例題－與反函數合成〉](https://aca.cust.edu.tw/online/custcalculusi/02/01_04_09.html)。

以下 40 種樣本均從本機壓測實際抽出，保留題幹與教用答案；分數以分子／分母轉寫，底數與指數保留上下標。每項加註解題步驟方便教師複核。

## bayes/bayestwo 的新增題型與完整樣本

**由良品反推來源**（`bayes/bayestwo/good`）

題幹：某批產品有 (3/4) 來自甲廠，其餘來自乙廠；兩廠不良率分別為 60％、90％。已知抽到良品，求來自甲廠的機率。

教用答案：(12/13)。(3/4×40/100) ÷ (3/4×40/100＋1/4×10/100)＝12/13。

**由實際件數反推來源**（`bayes/bayestwo/counts`）

題幹：甲、乙廠各有 11、5 件產品，其中不良品各有 2、4 件。合併後等可能抽一件，已知是不良品，求來自甲廠的機率。

教用答案：(1/3)。條件範圍只剩 2＋4 件不良品，故為 2/(2＋4)＝1/3。

**由來源後驗反求供貨比例（挑戰）**（`bayes/bayestwo/prior`）

題幹：甲、乙廠的不良率分別為 10％、20％。已知一件不良品來自甲廠的機率為 (1/2)，求甲廠原本的供貨比例。

教用答案：(2/3)。設供貨比例 p，p×10/100 ÷ [p×10/100＋(1−p)×20/100]＝1/2，解得 p＝2/3。

## bayes/medicalpositive 的新增題型與完整樣本

**由特異度求陽性後驗**（`bayes/medicalpositive/specificity`）

題幹：教學模型中患病率為 (3/4)，檢驗靈敏度為 75％，特異度為 70％。已知檢驗陽性，求患病的機率。

教用答案：(15/17)。健康者陽性率為 30％；(3/4×75/100) ÷ (3/4×75/100＋1/4×30/100)＝15/17。

**由檢驗人數求陽性後驗**（`bayes/medicalpositive/counts`）

題幹：教學用檢驗資料中，患者 19 人有 4 人呈陽性，健康者 21 人有 11 人呈陽性。從所有陽性者等可能抽一人，求此人患病的機率。

教用答案：(4/15)。陽性者共 4＋11＝15 人，其中 4 人患病，故為 4/15。

**由陽性後驗反求偽陽性率（挑戰）**（`bayes/medicalpositive/falsePositive`）

題幹：教學模型中患病率為 (1/4)，患者呈陽性的機率為 75％。已知陽性者患病的機率為 (1/2)，求健康者被誤判陽性的機率（以百分率作答）。

教用答案：25％。設偽陽性率為 q，(1/4×3/4) ÷ (1/4×3/4＋3/4×q)＝1/2，得到 q＝1/4＝25％。

## bayes/repeatedtest 的新增題型與完整樣本

**指定混合陽性／陰性序列**（`bayes/repeatedtest/mixed`）

題幹：教學模型中患病率為 (1/3)；患者、健康者每次呈陽性的機率分別為 (1/2)、(1/5)，各次檢驗在健康狀態固定下互相獨立。已知 2 次檢驗第一次陽性，其餘陰性，求患病的機率。

教用答案：(25/57)。患者該序列機率為 1/4，健康者為 4/25；後驗為 (1/3×1/4) ÷ (1/3×1/4＋2/3×4/25)＝25/57。

**至少一次陽性的後驗（挑戰）**（`bayes/repeatedtest/atLeast`）

題幹：教學模型中患病率為 (1/5)；患者、健康者每次呈陽性的機率分別為 (4/5)、(1/5)，各次檢驗在健康狀態固定下互相獨立。已知 3 次檢驗至少一次陽性，求患病的機率。

教用答案：(31/92)。患者至少一次陽性率 124/125，健康者 61/125；後驗＝124/(124＋4×61)＝31/92。

## combinations/required 的新增題型與完整樣本

**多人必選**（`combinations/required/includeMany`）

題幹：從 10 人中選 5 人，指定 3 人全部必選，共有幾種選法？

教用答案：21。先選入指定 3 人，再從其餘 7 人選 2 人：C(7,2)＝21。

**多人禁選**（`combinations/required/excludeMany`）

題幹：從 8 人中選 3 人，指定 2 人全部不得入選，共有幾種選法？

教用答案：20。刪除指定 2 人，C(6,3)＝20。

**必選與禁選同時限制（挑戰）**（`combinations/required/bothRules`）

題幹：從 8 人中選 3 人，指定 2 人全部必選，另有 2 人全部不得入選，共有幾種選法？

教用答案：4。先放入指定 2 人、刪除禁選 2 人，再從其餘 4 人選 1 人，共 4 種。

## combinations/atleast 的新增題型與完整樣本

**至多選取**（`combinations/atleast/atMost`）

題幹：有男生 5 人、女生 5 人，選出 6 人，其中至多 1 位女生，共有幾種選法？

教用答案：5。只能選 5 男 1 女，C(5,5)C(5,1)＝5。

**恰有指定人數**（`combinations/atleast/exact`）

題幹：有男生 4 人、女生 6 人，選出 6 人，其中恰有 3 位女生，共有幾種選法？

教用答案：80。C(6,3)C(4,3)＝20×4＝80。

**上下限同時限制（挑戰）**（`combinations/atleast/between`）

題幹：有男生 6 人、女生 6 人，選出 3 人，其中女生至少 2 位且至多 3 位，共有幾種選法？

教用答案：110。C(6,2)C(6,1)＋C(6,3)C(6,0)＝90＋20＝110。

## combinations/groups 的新增題型與完整樣本

**指定人進指定組**（`combinations/groups/fixed`）

題幹：將含小明、小華的 8 人分入有名稱的甲、乙、丙三組，人數為 3、2、3。小明必須在甲組，共有幾種分法？

教用答案：210。固定小明在甲組，C(7,2)C(5,2)＝210。

**指定兩人不同組（挑戰）**（`combinations/groups/apart`）

題幹：將含小明、小華的 4 人分入有名稱的甲、乙、丙三組，人數為 2、1、1。小明、小華必須不同組，共有幾種分法？

教用答案：10。全部分法 12 種，扣除兩人同在甲組的 2 種，得 10。

**指定兩人同組（挑戰）**（`combinations/groups/together`）

題幹：將含小明、小華的 8 人分入有名稱的甲、乙、丙三組，人數為 4、2、2。小明、小華必須同組，共有幾種分法？

教用答案：120。同在甲、乙、丙組分別為 90、15、15 種，合計 120。

## commonlog/definition 的新增題型與完整樣本

**冪底數與冪真數求值**（`commonlog/definition/powerBase`）

題幹：求 log<sub>5<sup>4</sup></sub>（5<sup>8</sup>）的值。

教用答案：2。5⁸＝(5⁴)²，因此對數值為 2。

**由對數定義反求線性真數中的 x**（`commonlog/definition/argument`）

題幹：已知 log<sub>10</sub>（4x＋0）＝4，求 x。

教用答案：2500。4x＝10⁴＝10000，故 x＝2500。

**已知對數值代入乘冪真數（挑戰）**（`commonlog/definition/substitute`）

題幹：已知 x＞0 且 log<sub>3</sub>x＝2，求 log<sub>3</sub>（3<sup>1</sup>x<sup>4</sup>）。

教用答案：9。log₃(3x⁴)＝1＋4log₃x＝1＋4×2＝9。

## commonlog/laws 的新增題型與完整樣本

**三項對數加減**（`commonlog/laws/threeTerms`）

題幹：計算 log<sub>5</sub>25＋log<sub>5</sub>125−log<sub>5</sub>1。

教用答案：5。log₅(25×125/1)＝log₅5⁵＝5。

**加減與係數法則合用（挑戰）**（`commonlog/laws/weighted`）

題幹：計算 4log<sub>5</sub>125＋log<sub>5</sub>1−log<sub>5</sub>125。

教用答案：9。4×3＋0−3＝9。

## commonlog/change 的新增題型與完整樣本

**同底對數比值換底**（`commonlog/change/ratio`）

題幹：計算 ((log<sub>11</sub>25)/(log<sub>11</sub>5))。

教用答案：2。(log₁₁25)/(log₁₁5)＝log₅25＝2。

**開放連乘求值**（`commonlog/change/openChain`）

題幹：計算 log<sub>5</sub>3 × log<sub>3</sub>11 × log<sub>11</sub>625。

教用答案：4。連乘約消為 log₅625＝4。

**以已知對數符號表示真數乘積**（`commonlog/change/symbolic`）

題幹：已知 u＝log 2、v＝log 3，以 u、v 表示 log 18。

教用答案：1u＋2v。18＝2×3²，故 log18＝u＋2v。

**冪底數連乘換底（挑戰）**（`commonlog/change/poweredChain`）

題幹：計算 log<sub>11<sup>2</sup></sub>2 × log<sub>2<sup>3</sup></sub>5 × log<sub>5<sup>2</sup></sub>（11<sup>24</sup>）。

教用答案：2。依換底公式約消，值為 24/(2×3×2)＝2。

## conditionalprob/definition 的新增題型與完整樣本

**補事件的條件機率**（`conditionalprob/conditionalDefinition/complement`）

題幹：調查 35 人，同時屬 A、B 的有 9 人，只屬 A 的有 9 人，只屬 B 的有 14 人，兩者皆非有 3 人。求 P（A′｜B）。

教用答案：(14/23)。B 共有 9＋14＝23 人，其中 14 人不屬 A，得 14/23。

**交換條件事件**（`conditionalprob/conditionalDefinition/reverse`）

題幹：調查 42 人，同時屬 A、B 的有 5 人，只屬 A 的有 13 人，只屬 B 的有 15 人，兩者皆非有 9 人。求 P（B｜A）。

教用答案：(5/18)。A 共有 5＋13＝18 人，其中 5 人屬 B，得 5/18。

**以聯集為條件的機率（挑戰）**（`conditionalprob/conditionalDefinition/unionGiven`）

題幹：調查 37 人，同時屬 A、B 的有 12 人，只屬 A 的有 13 人，只屬 B 的有 3 人，兩者皆非有 9 人。求 P（A｜A∪B）。

教用答案：(25/28)。A∪B 共 12＋13＋3＝28 人，其中屬 A 有 25 人，得 25/28。

## conditionalprob/withoutreplacement 的新增題型與完整樣本

**已知後次結果反求前次（挑戰）**（`conditionalprob/withoutreplacement/reverseLast`）

題幹：袋中紅球 4 顆、藍球 7 顆，依序抽兩球且不放回。已知第二球為紅球，求第一球為藍球的機率。

教用答案：(7/10)。已知第二球紅球，第一球可能是其餘 10 球的任一球，其中藍球 7 球，得 7/10。

**已知前兩球組成求第三球（挑戰）**（`conditionalprob/withoutreplacement/twoKnown`）

題幹：袋中紅球 5 顆、藍球 4 顆，連抽三球且不放回。已知前兩球恰一紅一藍，求第三球為紅球的機率。

教用答案：(4/7)。移除一紅一藍後剩紅 4、藍 3，得 4/7。

## conditionalprob/solveunion 的新增題型與完整樣本

**由皆不發生反求機率**（`conditionalprob/solveunion/neither`）

題幹：A、B 為獨立事件，P（A）＝(1/6)，P（A′∩B′）＝(5/7)，求 P（B）。

教用答案：(1/7)。(5/6)(1−P(B))＝5/7，故 P(B)＝1/7。

**由聯集條件機率反求**（`conditionalprob/solveunion/conditionalUnion`）

題幹：A、B 為獨立事件，P（A）＝(3/5)，P（A｜A∪B）＝(6/7)，求 P（B）。

教用答案：(1/4)。(3/5)/(3/5＋(2/5)P(B))＝6/7，故 P(B)＝1/4。

**由恰一個發生反求（挑戰）**（`conditionalprob/solveunion/exactlyOne`）

題幹：A、B 為獨立事件，P（A）＝(1/6)，恰有一個事件發生的機率＝(3/4)，求 P（B）。

教用答案：(7/8)。1/6＋(2/3)P(B)＝3/4，故 P(B)＝7/8。

## loggraphs/equation 的新增題型與完整樣本

**同底對數等式**（`loggraphs/equation/equalLogs`）

題幹：解方程式 log<sub>2</sub>（4x−22）＝log<sub>2</sub>（2x−8）。

教用答案：x＝7。4x−22＝2x−8，得 x＝7；兩真數均為 6＞0。

**平方整體為真數的雙解（挑戰）**（`loggraphs/equation/squareArgument`）

題幹：解方程式 log<sub>2</sub>［（x−2）<sup>2</sup>］＝2。

教用答案：x＝0 或 4。(x−2)²＝4，故 x＝0 或 4；兩個解的真數均為 4。

## loggraphs/combined 的新增題型與完整樣本

**對數差合併成商**（`loggraphs/combined/difference`）

題幹：解方程式 log<sub>2</sub>（x＋20）−log<sub>2</sub>（x−4）＝log<sub>2</sub>5。

教用答案：x＝10。(x＋20)/(x−4)＝5，解得 x＝10；真數 30、6 皆正。

**以對數換元的二次方程（挑戰）**（`loggraphs/combined/quadraticLog`）

題幹：解方程式（log<sub>2</sub>x）<sup>2</sup>−6log<sub>2</sub>x＋8＝0。

教用答案：x＝4 或 16。令 t＝log₂x，t²−6t＋8＝(t−2)(t−4)＝0，故 x＝4 或 16。

## loggraphs/inverse 的新增題型與完整樣本

**對數函數反解為指數函數**（`loggraphs/inverse/fromLog`）

題幹：求 f（x）＝log<sub>2</sub>（x−1）＋1 的反函數。

教用答案：f<sup>−1</sup>（x）＝2<sup>x−1</sup>＋1。交換 x、y，x＝log₂(y−1)＋1，解得 y＝2^(x−1)＋1。

**伸縮、平移指數函數的反函數（挑戰）**（`loggraphs/inverse/scaledExponential`）

題幹：求 f（x）＝5×5<sup>x＋3</sup>＋6 的反函數。

教用答案：f<sup>−1</sup>（x）＝log<sub>5</sub>（((x−6)/5)）−3。交換 x、y，(x−6)/5＝5^(y＋3)，故 y＝log₅((x−6)/5)−3，定義域 x＞6。

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
