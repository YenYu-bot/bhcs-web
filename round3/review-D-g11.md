# Round-3 findings for g11 (independent check, 2026-11-07). No wrong answers. Fix every item.

## Earlier review items still present
- commonlog/scientific | adv & ch | int: `已知 log N＝1＋log 6，求 N，並寫出 log N 的首數。` at both levels; basic still prints `N＝6.9×10^1` (prefer 69).
- matrixops/power | adv | int: advanced easier than basic and repeats it (adv `A＝[[1,0],[0,2]]^2`, basic `[[1,1],[0,1]]^6`; `[[1,0],[0,−1]]^6` at both levels, 12/40).
- matrixops/determinant | ch | int: `det（AB）` from given numbers still in the pool (also at adv `det（AB） => 0`).
- combinations/atleast | ch: `選出 4 人，其中女生至少 2 位且至多 4 位 => 595` is just the advanced 「至少 2 位」 item (13/26).
- combinations/binomialsum | adv: basic kind still in advanced (`（2＋x）^11 … 偶次項係數和減奇次項係數和 => 1`); basic answer 1 in 9/24 items.
- sincosarea/ambiguous | adv: `∠A＝30°、a＝22、b＝44 => 1 個；∠B＝90°` same as basic.
- righttrig/comparison | ch: challenge = advanced kind (`cos75° □ sin5°` vs `cos50° □ sin50°`).
- anglesum/known | ch | frac: acute angles with tan only (`tanα＝7/3，tan（α＋β）＝−5/2，求 tanβ => 1`), easier than advanced (quadrant signs).
- doublehalf/fromtan | ch | frac: basic plus one subtraction (`270°＜θ＜360°，tanθ＝−2，求 sin2θ−cos2θ`).
- Ugly answers: spacecross/trianglearea ch `(√649)/(2)`; spacecross/height ch `(32√202)/(101)`; spaceinner/angle adv `cosθ＝−(√754)/(754)`; spaceinner/cauchymin ch `(71√42)/(42)`; standarddev/groupvariance ch `標準差 (√1585)/(5)`; planevector/lincomb basic frac `（23/11，−38/11）`.
- Integer mode prints fractions: sequences/arithmeticmean ch (33/40) `公差 (2)/(3)`; sequences/threshold ch (22/40) `公差為 −(4)/(3)`.
- ［ ］ (Gauss floor in Taiwan) used as grouping: loggraphs/equation ch `log_10［（x＋7）^2］＝2`; trigtransform/model `a cos［(π)/(12)（t−14）］` — use （ ） or nested （（ ））.
- Missing space: `求點數和為 10的條件機率` (conditionalprob/restricteddice adv).

## Ladder: exact repeats across levels (no level may repeat another level's item)
- series/oddeven b&a `求前 29 個正偶數的總和。`; standarddev/zproperties b&a `Σzᵢ 與 Σzᵢ²`; correlation/twoslopes b&a (equal slopes `3/4、3/4` in 7–8 of 40 per level); combinations/equalgroups all pairs; probability/cards b&a `1 到 6 … 和為 5`; righttrig/projection a&c `AD＝12、DB＝14`; generalpolar/quadrant a&c `90°＋θ`; spaceconcept/decideplane b&c, a&c; conditionalprob/fromunion b&c; conditionalprob/restricteddice a&c; conditionalprob/ordereddraws b&a; matrixapps/rotation b&a `逆時針旋轉 135°，連續施作 5 次`.
- Shared templates (identical items in 40-sample): permutations digits b/a [18], partial a/c [14], adjacent b/a [11], routes `向右 2 步、向上 3 步` all levels; counting/tree [12/5]; generalpolar quadrant a/c [12], cart2polar all pairs; anglesum/identity [8]; matrixapps/stationary [5/7]; doublehalf fromsin [7], sumdiff [7]; righttrig/fromone [7]; radians/convert; sector/clock; expfunctions/model a/c [6]; commonlog/change (`以 u、v 表示 log N` every level); conditionalprob/withoutreplacement [6].
- Flat (advanced = basic single template): conditionalprob/ordereddraws, exactlyone, withoutreplacement; probability/expectation die `出現 3 點得 30 元…` both levels; sincosarea/cosineangle adv & ch both Pythagorean `=> 90°`.

## Numbers / modes / context / typography
- Integer mode prints decimals/fractions: standarddev/reversetransform ch `a＝1.2，b＝20`; expfunctions/model adv `每 7 天減為原來的 (1)/(2) 倍 … => (31)/(8)`; sector/area adv `(323)/(2) 平方單位`.
- Unrealistic rates: bayes/factoryorigin adv `不良率為 30％、10％、40％`; conditionalprob/reliability `正常率 1/7、2/3`; conditionalprob/binomial `猜對每題選擇題的機率為 5/6`; matrixapps/multistate adv `每年有 3/4 的住在市區者改為住在郊區…` and 40–75% monthly churn in 訂閱 items; matrixapps/stationary `每年有 9/10 的鄉村人口移往城市`.
- Odd wording: counting/setops ch `C 為 U 中大於 7.5 …` for integer sets.
- Typography: `θ為` (32×) vs `θ 為` (149×) — unify to `θ 為`; `等差數列a_3＝…` missing space; `同時擲兩顆 公平骰子` stray space; ASCII `%` in series annuity/interest (48×) → `％`; full-width `－` in hints `n!／（n－r）!`, `［d－R，d＋R］` → `−`; symmetric line forms mix linear and stacked fractions (line3d/direction adv `(x−6)/(−2)＝(y＋3)/3` vs stacked at ch) — use the stacked form.
