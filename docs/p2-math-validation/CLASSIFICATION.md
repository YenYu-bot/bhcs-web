# P2｜原 431 組分類與 safeQuestion 基準（2026-09-22 第二次修訂）

第一版「200 題全部不重複」、第二版「gen() 200 次不得 null」都是規格誤寫。引擎以 safeQuestion() 對 null 候選重試；null 是正常拒絕訊號，只有 50 次重試耗盡、verify 失敗或例外才阻擋。

| 原 431 組分類 | 組數 | 新測試通過 | 仍失敗 |
|---|---:|---:|---:|
| 1 舊 200 題去重假失敗 | 278 | 278 | 0 |
| 2 verify() 不過 | 16 | 16 | 0 |
| 3 曾回傳 null／單卷耗盡 | 118 | 118 | 0 |
| 4 例外 | 19 | 19 | 0 |

四類互斥且合計 431。完整難度、mode、拒絕率與失敗碼見 [classification-431.csv](classification-431.csv)。

## 每類完整 topic／unit 清單

### 1 舊 200 題去重假失敗（278 組）

| 引擎 | topic | unit | 組數 |
|---|---|---|---:|
| g6 | arithmetic | `convert`、`div` | 7 |
| g6 | ratio | `convert` | 9 |
| g10 | multiplication | `chain`、`conjugate`、`cube`、`cubefactor`、`squareminus`、`squareplus`、`trinomial` | 20 |
| g10 | rationalexp | `cube`、`telescope` | 4 |
| g10 | radicals | `telescope` | 3 |
| g10 | exponent | `application`、`equation`、`scientific`、`substitution` | 7 |
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
| g11 | anglesum | `triangle` | 3 |
| g11 | doublehalf | `point`、`sumdiff` | 6 |
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

### 3 曾回傳 null／單卷耗盡（118 組）

| 引擎 | topic | unit | 組數 |
|---|---|---|---:|
| g10 | multiplication | `powervalue` | 1 |
| g10 | radicals | `simplify` | 2 |
| g10 | exponent | `fractional` | 1 |
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
| g11 | anglesum | `known` | 3 |
| g11 | doublehalf | `fromtan` | 3 |
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
| topic / 組合 | 128 / 4101 |
| safeQuestion 抽樣 / 成功取題 | 820200 / 820200 |
| 通過 / 失敗 | 4101 / 0 |
| 候選 gen / null | 966621 / 135583 |
| 候選 verify false / 例外 | 0 / 0 |
| 完成單卷 / 單卷耗盡 | 4101 / 0 |
| 高拒絕率 unit（非阻擋） | 101 |

| 類型 | topic / unit | 組數 |
|---|---|---:|

共 0 組：例外 0、verify 0、固定小題庫 0、其他單卷耗盡 0；原本通過的組合新增失敗為 0。

## 效率警示（不阻擋）

| topic / unit | 最高 null 拒絕率 | 超過 50% 的難度×mode 組數 |
|---|---:|---:|
| add / `carry` | 78.4% | 1 |
| sub / `sub` | 77.2% | 1 |
| sub / `borrow` | 69.3% | 2 |
| money / `count` | 58.1% | 1 |
| money / `enough` | 70.9% | 2 |
| timestables / `tables` | 57.8% | 1 |
| estimate / `est` | 51.5% | 1 |
| measure / `elapsed` | 60.0% | 3 |
| gcd / `factored` | 59.0% | 1 |
| units / `length` | 59.3% | 1 |
| units / `weight` | 63.2% | 1 |
| units / `capacity` | 58.5% | 1 |
| units / `volume` | 58.1% | 1 |
| units / `compare` | 78.8% | 4 |
| area / `parallelogram` | 53.9% | 2 |
| area / `triangle` | 59.0% | 2 |
| circle / `sector` | 60.1% | 1 |
| speed / `findt` | 66.6% | 1 |
| speed / `average` | 86.3% | 4 |
| speed / `meet` | 73.0% | 1 |
| pattern / `average` | 62.2% | 1 |
| factors / `sd` | 60.1% | 1 |
| function / `composite` | 78.9% | 3 |
| function / `nested` | 76.8% | 1 |
| numberline / `mark` | 83.4% | 5 |
| lineeq / `online` | 84.0% | 1 |
| lineeq / `hvline` | 69.7% | 3 |
| lineeq / `graph` | 77.4% | 2 |
| lineeq / `twopoint` | 50.7% | 1 |
| statistics / `mean` | 67.8% | 3 |
| statistics / `mode` | 79.0% | 1 |
| statistics / `change` | 71.4% | 3 |
| statistics / `missing` | 61.6% | 1 |
| polyops / `monoDivide` | 71.1% | 1 |
| sqrt / `divideRadicals` | 65.0% | 1 |
| pythagoras / `hypotenuse` | 61.1% | 3 |
| geoseq / `gmean` | 70.0% | 3 |
| angles / `equation` | 60.0% | 1 |
| parallelratio / `parallelSeg` | 77.4% | 2 |
| parallelratio / `twoStep` | 57.0% | 2 |
| parallelratio / `threeLines` | 69.2% | 1 |
| parallelratio / `judge` | 81.1% | 1 |
| parallelratio / `midsegment` | 57.1% | 1 |
| parallelratio / `midpoint` | 53.2% | 1 |
| similar / `sides` | 55.5% | 1 |
| similar / `aa` | 80.6% | 4 |
| similar / `area` | 51.0% | 1 |
| similar / `measure` | 62.0% | 2 |
| righttri / `ladder` | 59.4% | 1 |
| circle1 / `sector` | 65.1% | 2 |
| circle2 / `cyclic` | 58.8% | 1 |
| quartile / `meanmed` | 67.5% | 2 |
| quartile / `weighted` | 53.2% | 1 |
| remainder / `factor` | 60.9% | 2 |
| remainder / `two` | 50.5% | 1 |
| radicals / `simplify` | 54.9% | 1 |
| radicals / `nested` | 72.3% | 2 |
| exponent / `fractional` | 51.0% | 1 |
| exponent / `algebra` | 50.8% | 1 |
| exponent / `equation` | 82.2% | 1 |
| logarithms / `laws` | 64.8% | 1 |
| absolute / `error` | 74.8% | 3 |
| amgm / `means` | 68.7% | 1 |
| point / `motion` | 57.6% | 1 |
| linecircle / `tangent` | 66.9% | 1 |
| sequences / `geometricterm` | 52.5% | 1 |
| series / `arithinverse` | 60.6% | 1 |
| standarddev / `spread` | 66.9% | 2 |
| standarddev / `rawstats` | 59.3% | 1 |
| standarddev / `zcompare` | 56.4% | 1 |
| standarddev / `correctmean` | 51.3% | 1 |
| standarddev / `groupmean` | 68.3% | 3 |
| correlation / `line` | 54.6% | 1 |
| correlation / `application` | 76.5% | 3 |
| probability / `linearity` | 76.8% | 2 |
| righttrig / `projection` | 77.0% | 1 |
| generalpolar / `cart2polar` | 71.9% | 1 |
| generalpolar / `polarapplication` | 52.7% | 1 |
| sincosarea / `heron` | 75.5% | 1 |
| sincosarea / `median` | 85.8% | 3 |
| sincosarea / `bisector` | 70.5% | 1 |
| sector / `cone` | 67.2% | 1 |
| trigtransform / `shift` | 76.8% | 2 |
| expfunctions / `equation` | 69.6% | 1 |
| expequations / `linear` | 56.5% | 2 |
| expequations / `quadratic` | 61.4% | 2 |
| commonlog / `laws` | 84.7% | 2 |
| loggraphs / `graph` | 58.2% | 1 |
| vectorcauchy / `perpendicular` | 86.5% | 4 |
| spacecross / `det2` | 57.3% | 1 |
| spacecross / `commonnormal` | 53.8% | 2 |
| plane3d / `perpparameter` | 72.3% | 2 |
| plane3d / `foot` | 58.1% | 1 |
| plane3d / `reflection` | 72.0% | 1 |
| line3d / `lineplane` | 67.1% | 1 |
| conditionalprob / `solveunion` | 60.7% | 2 |
| conditionalprob / `missingtable` | 58.0% | 1 |
| conditionalprob / `binomial` | 64.2% | 1 |
| bayes / `bayestwo` | 65.1% | 1 |
| bayes / `predictive` | 77.7% | 1 |
| matrixops / `singular` | 64.0% | 1 |

全部組合的實際拒絕率留在 JSON 與 CSV。警示只供後續調範圍參考，不阻擋合併。

## 判讀與順序

- P2 阻擋項已歸零：例外、verify false、未宣告固定小題庫及未解釋的單卷耗盡均為 0。
- 本次所有單卷均達目標題數；容量另由加強覆蓋檢查驗證。
- 下一階段依既定順序進入 P3 題型多樣性報表模式，先產 baseline JSON，不立即阻擋 CI。
- 本報告由當前分支的正式出題程式重跑產生；各根因修改另見對應 PR 紀錄。
