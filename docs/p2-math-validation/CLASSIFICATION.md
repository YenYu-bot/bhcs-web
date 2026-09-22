# P2｜原 431 組分類（2026-09-22 修訂）

**先分類，本輪不修出題。** 原交接包 2.4「200 題全部不重複」是規格誤寫；2.2 一直要求「同一份卷內不重複」。只有 8 題的題庫合理，不是缺陷。

| 分類 | 原 431 組中的組數 | 新測試下的情況 |
|---|---:|---|
| 1 舊 200 題去重假失敗 | 272 | 263 組本輪通過；9 組仍有驗收未滿足項目 |
| 2 verify() 不過 | 16 | 0 組本輪通過；16 組仍有驗收未滿足項目 |
| 3 回傳 null／50 次重試耗盡 | 124 | 1 組本輪通過；123 組仍有驗收未滿足項目 |
| 4 例外 | 19 | 0 組本輪通過；19 組仍有驗收未滿足項目 |

四類合計 431，互斥計數。分類優先順序為例外 → verify 失敗 → 原 gen null → 新版仍無法完成單卷 → 其餘為舊規格假失敗；有來源可證明的固定小題庫仍歸①，另列未宣告 bankSize 的驗收問題。每組的全部現象保留於 [classification-431.csv](classification-431.csv)，不因主分類隱藏其他錯誤。

①共 272 組：263 組已因更正規格而直接通過；另 9 組是下表來源可證明的固定題庫。它們的「無法產生 200 題相異題目」是假的缺陷，但目前未宣告 bankSize，新條款的單卷驗收仍然標紅。並未把這 9 組跳過或標成通過。

| topic / unit | 可證明的題庫大小 | 原始程式的依據 |
|---|---|---|
| g10 multiplication / cubefactor | 各難度 8 | 兩係數各 1、2；正負兩種，2×2×2 |
| g10 multiplication / chain | 基礎 9、進階 9、挑戰 10 | a,b 各 1～3 的短式 9 種；挑戰多一種 a=b=1 的長式 |
| g11 commonlog / definition，fraction | 各難度 30 | 5 種底數 × 6 種指數 |

以上只是報告的容量證據，**沒有寫入正式程式，也未用來放寬任何測試**。本輪這 9 組各 200 次直接抽樣的相異 sig 已達上述大小；仍因正式 unit 沒有 bankSize、介面上限仍為 40 而保留失敗。另 commonlog/definition 進階在第 30 題時耗盡 50 次重試，僅產生 29 題；因此只補容量宣告也不保證該次抽樣能完成，需另檢查有限池抽題策略。

## 每類完整 topic／unit 清單

同一 unit 的不同難度／數型可能落在不同類別；完整難度與數型見 CSV。這裡按 topic 彙整，並未漏掉任何一組。

### 1 舊 200 題去重假失敗（272 組）

| 引擎 | topic | unit | 組數 |
|---|---|---|---:|
| g6 | arithmetic | `convert`、`div` | 7 |
| g6 | ratio | `convert` | 9 |
| g10 | multiplication | `chain`、`conjugate`、`cube`、`cubefactor`、`squareminus`、`squareplus`、`trinomial` | 20 |
| g10 | rationalexp | `cube`、`telescope` | 4 |
| g10 | radicals | `telescope` | 3 |
| g10 | exponent | `application`、`equation`、`scientific`、`substitution` | 5 |
| g10 | logarithms | `definition`、`digits`、`growth` | 8 |
| g10 | inequalities | `always` | 3 |
| g10 | amgm | `application`、`fixedproduct`、`fixedsum`、`means` | 13 |
| g10 | quadratic | `application` | 3 |
| g10 | cubic | `graph` | 3 |
| g10 | point | `endpoint`、`innerouter`、`internal`、`midpoint`、`motion`、`ratio` | 8 |
| g11 | sequences | `geometricmean` | 2 |
| g11 | series | `oddeven` | 3 |
| g11 | standarddev | `standardlist`、`zproperties` | 4 |
| g11 | correlation | `scatter` | 2 |
| g11 | counting | `conditions`、`negation`、`subsets` | 8 |
| g11 | permutations | `adjacent`、`separated` | 6 |
| g11 | combinations | `identity`、`required` | 5 |
| g11 | probability | `cards`、`complement`、`dice` | 8 |
| g11 | righttrig | `algebra`、`bearings`、`definitions`、`elevation`、`identities`、`solveside`、`special`、`twostations` | 10 |
| g11 | generalpolar | `fromratio`、`quadrant` | 4 |
| g11 | sincosarea | `bisector`、`circumradius`、`classification`、`cosineangle`、`cosineside`、`heron`、`median`、`sineside` | 21 |
| g11 | radians | `quadrant` | 3 |
| g11 | sector | `arc`、`area`、`clock`、`cone`、`inverse`、`maximum` | 21 |
| g11 | doublehalf | `point`、`sumdiff` | 5 |
| g11 | trigblend | `condition`、`cosineform`、`identity`、`range`、`reverse`、`sineform` | 10 |
| g11 | trigtransform | `intersections` | 1 |
| g11 | expfunctions | `graph`、`transform` | 2 |
| g11 | expequations | `application`、`quadratic` | 6 |
| g11 | commonlog | `change`、`definition`、`digits`、`scientific` | 14 |
| g11 | vectorcauchy | `angle`、`cauchy`、`triangle` | 9 |
| g11 | spaceconcept | `decideplane`、`dihedral`、`lineplane`、`linerelations`、`nestedlength`、`planeplanes`、`threeperpendicular` | 21 |
| g11 | spacevector | `unitvector` | 3 |
| g11 | conditionalprob | `atleastone`、`binomial` | 6 |
| g11 | bayes | `factoryorigin`、`repeatedtest` | 6 |
| g11 | matrixops | `power` | 3 |
| g11 | matrixapps | `trianglearea` | 3 |

### 2 verify() 不過（16 組）

| 引擎 | topic | unit | 組數 |
|---|---|---|---:|
| g11 | standarddev | `deviationsum` | 1 |
| g11 | sincosarea | `ambiguous` | 3 |
| g11 | loggraphs | `inverse` | 3 |
| g11 | spaceinner | `pointdistance` | 3 |
| g11 | spacecross | `height` | 3 |
| g11 | line3d | `pointprojection` | 3 |

### 3 回傳 null／50 次重試耗盡（124 組）

| 引擎 | topic | unit | 組數 |
|---|---|---|---:|
| g10 | multiplication | `powervalue` | 1 |
| g10 | radicals | `simplify` | 2 |
| g10 | exponent | `fractional`、`substitution` | 3 |
| g10 | logarithms | `laws` | 3 |
| g10 | absolute | `error` | 3 |
| g10 | amgm | `squarebound`、`weightedmax`、`weightedmin` | 6 |
| g11 | series | `geoinverse`、`geolast`、`powersums` | 9 |
| g11 | correlation | `twoslopes` | 3 |
| g11 | counting | `conditions`、`digits`、`multiplication`、`tree` | 8 |
| g11 | permutations | `digits`、`distribution`、`factorial`、`repeated` | 10 |
| g11 | combinations | `atleast`、`basic`、`binomialterm`、`equalgroups`、`groups`、`identity` | 15 |
| g11 | probability | `arrangeprob`、`balls`、`coins`、`complement`、`samplespace` | 13 |
| g11 | radians | `convert` | 3 |
| g11 | anglesum | `known`、`triangle` | 6 |
| g11 | doublehalf | `fromtan`、`point` | 4 |
| g11 | commonlog | `laws` | 3 |
| g11 | loggraphs | `application` | 3 |
| g11 | conditionalprob | `solveunion` | 3 |
| g11 | bayes | `medicalnegative`、`reverseprior`、`treatmenttype`、`witness` | 12 |
| g11 | matrixapps | `multistate`、`reversestate`、`rotation`、`stationary`、`transitionbuild` | 14 |

### 4 例外（19 組）

| 引擎 | topic | unit | 組數 |
|---|---|---|---:|
| g10 | exponent | `algebra`、`fractional`、`laws` | 7 |
| g10 | cubic | `global` | 2 |
| g11 | righttrig | `comparison` | 2 |
| g11 | doublehalf | `fromsin`、`half` | 6 |
| g11 | expfunctions | `equation` | 2 |

## ②不能全部解讀成算錯

| topic / unit | 原失敗組 | 根因與實際例子 | 改題面風險（尚未修） |
|---|---:|---|---|
| standarddev / deviationsum | 1 | 59×14²=11,564 算式正確；verify 額外要求答案≤10,000，生成範圍與檢查條件不一致 | 需保留原範圍，釐清限制；不可直接放寬上限 |
| sincosarea / ambiguous | 3 | A=30°、a=47、b=94，B=90° 正確；浮點數在 sinB≈1 的邊界導致判斷失敗 | 應處理驗證方式，題面可保留 |
| loggraphs / inverse | 3 | 反函數代數式正確，但浮點數先加 k 再減 k 會丟失很小的值 | 應處理驗證方式，題面可保留 |
| spaceinner / pointdistance | 3 | 候選垂直向量實際不垂直，候選答案可錯；下方有獨立核算 | 修生成構造可能改個別座標，題型與範圍不能改 |
| spacecross / height | 3 | 可生成體積 0 的退化圖形，verify 要求 vol>0 | 修非退化構造可能改個別向量，題型與範圍不能改 |
| line3d / pointprojection | 3 | 同類垂直向量構造錯誤，候選垂足可錯 | 修生成構造可能改個別座標，題型與範圍不能改 |

空間幾何的根因屬生成程式，但目前函式回傳的是帶答案的非 null 物件，再被 verify 攔下；所以按觀察值列②，並非強行列成③④。這些候選被安全層攔下，不代表已印給學生。

獨立核算：

- spaceinner/pointdistance：A=(4,−3,−6)、d=(1,0,1)、P=(0,−2,−14)。t=((P−A)·d)/(d·d)=−12/2=−6，垂足 (−2,−3,−12)，距離 √(2²+1²+(−2)²)=3，候選 √17 錯。
- line3d/pointprojection：A=(−8,−1,0)、d=(1,0,1)、P=(2,0,4)。t=14/2=7，垂足 (−1,−1,7)，候選 (−4,−1,4) 錯。

## ③與④的解讀

③的 118 組在舊測試中曾直接 gen null。許多是程式有意拒絕不適合的候選，不等於整個單元完全卡死；但依新版「200 次 gen 無 null」仍需標紅。另 6 組為 exponent/substitution（基礎、進階整數）、anglesum/triangle（三難度分數）、doublehalf/point（挑戰整數）：直接抽樣沒有 null 或 verify 錯，但內容篩選讓 safeQuestion 在 40 題以前耗盡 50 次，不能算規格假失敗。原先粗分的 278 組因而重分成 272 組①與 6 組③。

③有 1 組本輪 200 次未再抽到 null（見 CSV），只能說本次抽樣未重現；舊種子的 null 證據仍在，不能宣稱已修好。

④包含三個明確 JavaScript 根因：cubic/global 的 localAt 未定義；righttrig/comparison 在 b 初始化前使用 b；doublehalf/fromsin、half 對 const 重新賦值。另外 exponent 的三個 unit 及 expfunctions/equation 發生「無效分數」，需區分負指數建構與安全整數範圍；目前只分類，未修改。

## 修訂測試結果（全部 1,740 組，並非只測舊 431 組）

| 項目 | 結果 |
|---|---:|
| topic | 52 |
| 組合 | 1740 |
| 直接 gen 呼叫 | 348000 |
| 通過 / 失敗 | 1148 / 592 |
| raw null 次數 | 17582 |
| raw verify false 次數 | 398 |
| raw 例外次數 | 980 |
| unit bankSize 宣告組數 | 0 |
| 完成單卷 / 50 次耗盡組數 | 1722 / 18 |

原 431 組中 264 組本次通過、167 組仍失敗；原本通過的組合另外有 425 組在直接 gen 條款下失敗。因舊測試使用 safeQuestion 過濾，而新條款直接檢查 gen，兩者嚴格程度不同；不能把總失敗數增加解讀成改壞網站。本輪網站原始碼完全沒有改。

固定種子、所有組合與候選例子寫在 CI 的 p2-math-validation artifact。CI 保持紅燈，不設 skip、xfail、預期失敗白名單或 continue-on-error。bankSize 宣告尚未進入正式程式，所以不能宣稱已完成正式題庫全題覆蓋。

## 本輪範圍與待辦

- [修訂驗收條款](specification-20260922.md)。
- P2 PR 只含測試、分類及文件；沒有修改題目、答案、數字範圍、難度或版面。
- 未執行修正版視覺驗收，因本輪沒有修正版；不把 JSDOM 的 max 屬性檢查說成真實畫面驗收。
- [逐根因 PR 與 UX 待辦](BACKLOG.md)：先讓使用者審閱本表；後續一個根本原因一個 PR。UX 題數上限列為 P1 之後的獨立項目，等 bankSize 宣告完成，本輪不修。
