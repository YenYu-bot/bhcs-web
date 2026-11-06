I found no wrong answers in g10. The confirmed problems are a few degenerate or duplicated items, a lot of flat or inverted difficulty ladders, some number-size and simplest-form issues, and some minor typography.

**How I checked:** I recomputed every Q/A in `g10-drills.txt` (about 470 items, every unit, level and mode). Python spot-checks covered the log digit and leading-digit items, x^7 mod (x−1)(x−3), and the "at least how many periods" items. For the doubtful items I opened `/home/claude/yenyu-bot/bhcs-web/tools/math/g10-drills.html`, without changing anything. Three things in the sample only look broken because of how the dump flattens the page, so they are not bugs:
- **Nested fractions:** 繁分式 such as `(1)/(4)−(1)/(x)x−4` use `fr()` and render properly.
- **Log bases:** `log_3729` is a `<sub>` base.
- **Exponents:** `2^4x＋1` is a whole `<sup>` exponent.

**A. Wrong answers: none.**

**Ill-posed or degenerate items**
1. exponent / scientific | basic | integer: all three are "將 6 (9, 1) 寫成科學記號" → `6 × 10^0`. These are single digits, so there is nothing to convert.
2. logarithms / definition: advanced "求 log_7√49" → 1, and challenge "求 log_3√6561" → 4. The number under the root is a perfect square, so the root-to-fractional-exponent step never happens. Challenge "若 log_x2＝1，求 x" → 2 is trivial. The `kind==="root"` branch (line 785) allows the exponent to be divisible by q.
3. Identical items appear across levels:
   - quadratic / discriminant: challenge Q1 "y＝x²＋kx＋4 恰有一個交點" is the same as advanced Q1.
   - radicals / nested: challenge "√(5＋√24)" is the same as advanced Q2.
   - amgm / application: challenge "84 公尺…隔成兩塊" → 294 is the same as advanced Q2.
   - logarithms / growth: advanced integer "初值 6，2 倍，2 期" → 24 is the same as basic Q1.

**B. Flat or inverted ladders**
- **All three levels are the same kind:**
  - multiplication / chain: only challenge Q3 adds a fourth factor, giving x⁸−y⁸.
  - logarithms / ratio: every item is log A ± log B = k.
  - inequalities / rational: every item is (x−a)/(x−b) ⋛ 0. The tip's "移項通分" case never appears.
  - cubic / value: every item is plain substitution.
  - absolute / error: the challenge items "測得 13，絕對誤差 3" and "相對誤差不超過 2%" repeat the basic and advanced kinds.
- **Advanced is the same as basic, only with bigger numbers:**
  - quadratic / roots: two zeros plus a leading coefficient at both levels.
  - amgm / weightedmin, weightedmax and squarebound: e.g. basic xy＝200 vs advanced xy＝3000.
  - point / equal (integer) and point / ratio: both stay one-dimensional.
  - remainder / factor: one unknown k found by substitution at both levels.
  - multiplication / cubefactor: advanced "x³＋27" is basic level.
  - linecircle / minmax: point-to-circle at both levels.
  - logarithms / definition: log_7 343 vs log_3 729.
  - exponent / laws | advanced | integer: "4¹×4²÷4⁰" is easier than basic.
- **Challenge is no harder than advanced, or is easier:**
  - radicals / nested: challenge "√(8−2√15)" is basic level.
  - radicals / rationalize: all three levels are a single conjugate.
  - radicals / equality: challenge "(4＋3√2)(3＋2√2)" and "(2−√6)(1＋√6)" are basic products.
  - radicals / simplify: advanced uses larger radicands (√1539＋√684) than challenge does.
  - rationalexp / muldiv: challenge Q1 "(x²−14x＋48)/(x²＋x−42)" is one fraction, easier than advanced.
  - rationalexp / symmetric: challenge "x²−11x＋1＝0, x³＋1/x³" is the same kind as advanced "x²＋4x＋1＝0".
  - rationalexp / telescope: basic already contains the full sum Σ1/[k(k＋1)] to 50/51.
  - exponent / integerpowers | challenge | integer: "4^−3 化成正指數" is the same as advanced.
  - exponent / equation: challenge "125^(2x−4)＝125^6" and "9^(4x＋1)＝9^29" use a base that already matches, same as advanced.
  - exponent / application: advanced decimal is growth again (the same as basic decimal), and challenge integer "32 克剩一半 2 期" is advanced level.
  - logarithms / equation: challenge "log_x36＝2" and "log_x81＝4" are easier than advanced (which has rejected roots).
  - absolute / equation: 2 of the 3 challenge items are "|…|＝負數 → 無解".
  - inequalities / linear: challenge "−7x−6＜3x−36" is basic.
  - inequalities / always: challenge "ax²＋14x±5" is the same as advanced.
  - amgm / application: challenge "4 公尺籬笆沿河" is basic, and challenge decimal is the same as advanced decimal.
  - quadratic / application: challenge "和為 38 求積最大" is basic.
  - quadratic / vertex | challenge | integer: "（x＋2）²＋5 展開" is basic.
  - cubic / roots, symmetry and graph: each has a basic-level challenge item, e.g. "x³＋5x 走向" and "O（0，6），P（−1，10）".
  - cubic / global: basic and advanced are mostly "寫出大域特徵 y＝x³".
  - point / internal | challenge | fraction: a centroid average is easier than advanced fraction's 3:2 division.
  - linecircle / position: advanced and challenge are the same distance-vs-radius check.

**C. Numbers**
1. logarithms / laws | challenge | integer: "以 a、b 表示 log √16" → `(4a)/(2)` is not in simplest form; it should be 2a. Cause: `abForm` with `den` never reduces by the gcd (line 791).
2. remainder / two | advanced: "x⁷−4x−1 除以 x²−4x＋3" → `1089x−1093`. The answer is correct but oversized.
3. exponent / application | challenge | decimal: "每期 4 倍，7 期後為 78970.88" → 4.82 is an ugly number.
4. line / intersect | challenge: "6x−7y−11＝0 與 5x＋5y＋18＝0" → (−71/65, −163/65) is an ugly number.
5. Oversized: squarebound "16u²＋25v²＝20000", weightedmin "xy＝3000" and "xy＝1470", and exponent equation "4^(4x−3)＝4^61".
6. Mode label does not change the questions:
   - amgm / application | basic | decimal: all three questions and answers are integers (180 m, 52 m, area 2).
   - quadratic / vertex | basic | fraction, Q1 "2x²＋4x".
   - remainder / remainder | basic | fraction, Q2 "2x²−1".
   - point / motion | basic | fraction, Q2 "2 公里, 1 與 1".
7. absolute / error: the measurement ranges are given as [198/25, 202/25] and [147/25, 153/25]. Decimals (7.92–8.08) would be more natural.
8. No mixed numbers appear anywhere in g10.

**D. Typography**
1. exponent / integerpowers: exponent 1 is shown, e.g. "（5^1）^3 ÷ 5^0", "（（−1/2）^1）^1 ÷ （−1/2）^1", "6^1 × 6^4 ÷ 6^4". This is the same kind of problem as "1x".
2. radicals / rationalize | challenge: `(−8＋8√6)/(5)` should be (8√6−8)/5. In the same block, `(2（√11−√6）)/(5)` uses a different style.
3. remainder / factor: basic answers are a bare "3", while advanced answers are "k＝−1".
4. linecircle / standard: the spacing is uneven, e.g. "x^2＋y^2− 16x− 6y ＋ 48＝0" and "x^2＋y^2＋ 12x− 14y ＋ 76＝0".
5. point / motion | basic: "速率分別為每小時 1 公里與 1 公里" reads awkwardly when both speeds are equal.

**Counts**

| Category | Count |
|---|---|
| Wrong answers | 0 |
| Ill-posed or degenerate | 3 groups (8 items, 4 of them duplicates) |
| Flat or inverted ladder | about 40 unit/mode cases |
| Numbers | 8 issues (1 not in simplest form, 4 ugly or oversized, 4 decimal/fraction-mode blocks of integers, 1 fraction-vs-decimal format; mixed numbers 0) |
| Typography | 5 |
