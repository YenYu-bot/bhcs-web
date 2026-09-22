# P2｜原 431 組分類與 safeQuestion 基準（2026-09-22 第二次修訂）

第一版「200 題全部不重複」、第二版「gen() 200 次不得 null」都是規格誤寫。引擎以 safeQuestion() 對 null 候選重試；null 是正常拒絕訊號，只有 50 次重試耗盡、verify 失敗或例外才阻擋。

| 原 431 組分類 | 組數 | 新測試通過 | 仍失敗 |
|---|---:|---:|---:|
| 1 舊 200 題去重假失敗 | 272 | 272 | 0 |
| 2 verify() 不過 | 16 | 16 | 0 |
| 3 曾回傳 null／單卷耗盡 | 124 | 115 | 9 |
| 4 例外 | 19 | 19 | 0 |

四類互斥且合計 431。完整難度、mode、拒絕率與失敗碼見 [classification-431.csv](classification-431.csv)。

## 每類完整 topic／unit 清單

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

### 3 曾回傳 null／單卷耗盡（124 組）

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

## 真正待修基準

| 項目 | 結果 |
|---|---:|
| topic / 組合 | 52 / 1740 |
| safeQuestion 抽樣 / 成功取題 | 348000 / 348000 |
| 通過 / 失敗 | 1731 / 9 |
| 候選 gen / null | 405958 / 27319 |
| 候選 verify false / 例外 | 0 / 0 |
| 完成單卷 / 單卷耗盡 | 1730 / 10 |
| 高拒絕率 unit（非阻擋） | 12 |

| 類型 | topic / unit | 組數 |
|---|---|---:|
| 其他單卷耗盡 | exponent / `substitution` | 2 |
| 其他單卷耗盡 | anglesum / `known` | 3 |
| 其他單卷耗盡 | anglesum / `triangle` | 3 |
| 其他單卷耗盡 | doublehalf / `point` | 1 |

共 9 組：例外 0、verify 0、固定小題庫 0、其他單卷耗盡 9；原本通過的組合新增失敗為 0。

## 效率警示（不阻擋）

| topic / unit | 最高 null 拒絕率 | 超過 50% 的難度×mode 組數 |
|---|---:|---:|
| arithmetic / `mul` | 54.9% | 1 |
| simplify / `bracket` | 52.6% | 3 |
| unknown / `same` | 51.0% | 1 |
| series / `powersums` | 62.7% | 1 |
| series / `interest` | 59.9% | 1 |
| standarddev / `spread` | 58.4% | 2 |
| correlation / `twoslopes` | 57.7% | 3 |
| correlation / `application` | 55.6% | 3 |
| trigtransform / `model` | 51.5% | 2 |
| bayes / `medicalnegative` | 51.7% | 2 |
| matrixapps / `multistate` | 75.2% | 3 |
| matrixapps / `population` | 58.8% | 1 |

全部組合的實際拒絕率留在 JSON 與 CSV。警示只供後續調範圍參考，不阻擋合併。

## 判讀與順序

- 標準差超過 10,000 的候選應在 gen 階段回傳 null；保留 verify、withinLimits、n 與 sd 範圍。
- SSA 與反函數目前答案正確，屬驗證方式；三個空間 unit 需先檢查候選題面與答案。
- 依決定先清完剩餘例外，再處理 verify、其他單卷耗盡、最後補固定題庫 bankSize。
- 本報告由當前分支的正式出題程式重跑產生；各根因修改另見對應 PR 紀錄。
