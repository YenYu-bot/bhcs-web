# Round-3 findings for g7, g8 (independent check, 2026-11-07). No wrong answers except one ill-posed item. Fix every item.

## Ill-posed (must fix)
- g7 simultaneous/mix | challenge | fraction: `(5a−5b−45)/(10)＝(3b＋21)/(3)＝(4b＋28)/(4)` => `a＝−4，b＝−9`. 2nd and 3rd fractions are both b＋7 → dependent system, infinitely many solutions. Cause: in g7-drills.html chain generator (~line 1970) `indep(...)` checks A, B, C before dividing by ds[]; run the check on A/d1 − B/d2 and B/d2 − C/d3. Same path serves the chain unit's fraction mode.

## g7 items still present / ladder
- numberline/compare | challenge int: 3 of 8 trivial (`寫出一個介於 −5 與 −4 之間的數`).
- lineeq/cross: challenge now 5 of 8 `過 A(5, 0) 作 y 軸的平行線，交直線 2x−y＝14 於 B` => `B(5, −4)；AB＝4`, easier than advanced 2×2 intersections.
- ratio/rv | challenge: half are the advanced kind (`已知 y：4＝6：7，求 y`).
- linear/mix advanced int: `20−4(x−1)＝−8`, `16−4(6x−12)＝−80` easier than basic `−3(−6x＋6)＝−2(−9x＋7)−4`.
- quadraticValue challenge: `f(1)−f(0)` is the advanced kind.
- statistics/mean challenge: `每一筆資料都加上 1` is one-step.
- lineeq/hvline advanced fraction: 3 of 3 are basic's two-points item.
## g7 numbers / modes
- Denominators over limit: ratio pv/ev/re `(55)/(31)`, `(−47)/(122)`, `28/97`; rv `87cm：2.36m => (87)/(236)`; cp challenge decimal `x：y：7(7)/(30)＝2.3：0.6：3.1 => (161)/(30)`; composite challenge `f(g(k))＝−(46)/(75)`; signed add/sub advanced frac /24, challenge /36; linear e5 `461/24`; inequality `883/60`.
- Decimal mode giving fraction answers: px basic `3.9x：0.3＝9：1 => (9)/(13)`; rv challenge `y：3.8＝5：9 => 2(1)/(9)`; cp advanced `x＝(96)/(5)` (should print 19.2).
- Context: px `(−x＋2)：8＝6：6` (6:6 ratio).

## g8 items still present
- arithseq judge | basic | frac: `判斷 −1，−1，−1，−1 是否為等差數列` (constant sequence — drop); decimal mode item `判斷 2，1，(2)/(3)，(1)/(2)` shows fractions.
- redundant brackets: `(x^3)^3 ÷ (x)^2`, `(3x)^2 × (x)^3` → `(x)^2` should be `x^2`.
- mulformula nearProduct | ch: `511 × 489 − 500^2` same kind as advanced `69 × 51 − 60^2`; 5 identical items adv/ch.
- geoseq/apply | ch: reverse items (`…4 小時後共有 112 個，一開始有幾個？`, `社團…2 年後有 100 人`) easier than advanced find-n; fraction mode integer-only (30/40).
- geoseq judge / twoterms: identical items across levels (`a₃＝12、a₄＝24` at basic & advanced).
- quadapps/right: 7 items identical basic/advanced (`斜邊長為 26 公分，兩股的差為 14`); quadapps/road uses the road-strip kind at all three levels.
- Fraction/decimal modes integer-only in 40–90%: arithseq term (basic & challenge, frac & dec), mid (challenge frac), sum (challenge frac & dec), fill (advanced frac, challenge dec); sqrt simplify (advanced & challenge dec), divideRadicals (basic frac `√63 ÷ √7`).
## g8 ladder: identical items across levels (worst; fix so no level repeats another level's item)
- bisectors/isosceles 23 basic=advanced, 7 advanced=challenge; factor/differenceSquares 17 basic=advanced (`4x^2 − 9y^2`); parallel/parbis 13 b=a; sqrt/telescoping 13 b=a, 12 a=c; angles/regular 11 b=a, 10 a=c (basic picks "both"; advanced "both, fromExt, fromInt"; challenge "fromInt…" — make lists disjoint); quadrilateral/rhombus 10 & 10; quadrilateral/parasplit 10 b=a; comprehensive 9 b=a.
- Same kind every level, numbers only: triineq/form (88% of advanced uses basic templates), parallel/samebase (92%), paraarea (80%), quadjudge (82% of challenge).
## g8 ugly numbers
- hypotenuse ch `斜邊上的高 (1260)/(53)`, `(1848)/(65)`; altitude ch `(784)/(159)`, `(1089)/(65)`; coordinateRadical ch `((31)/(22)，0)`; numberLine ch `(153)/(28)`. (Challenge denominators ≤ 20.)
