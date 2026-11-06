No wrong answers turned up in the g7 sample. The confirmed problems are ladder levels that are flat or inverted, ugly numbers, fraction/decimal modes that produce integer-only questions, and typography. I checked about 2,214 items. Pure arithmetic, linear expressions and equations, systems, inequalities, the ratio and function units and statistics were all recomputed with exact-fraction Python. Factors, scientific notation, exponents, number line, coordinates, line equations and symmetry were checked by hand. Answers that depend on a [圖] figure were skipped.

Some apparent problems are not real; they come from how the sample was flattened to text. The raw digits in the 短除法 (short division) answers are the division table. In the 繁分數 (complex fraction) items, the numerator and denominator run together. Two-line systems and piecewise functions are concatenated. `3^x ＋ 2＝729` looks wrong but is `<sup>x ＋ 2</sup>` in `g7-drills.html` (unknown, shiftX), so it renders correctly.

All findings are in `/home/claude/yenyu-bot/bhcs-web/tools/math/g7-drills.html`.

**A. Wrong answers:** none found.

**D1. Ill-posed or unrealistic**
1. views/minmax | challenge: "積木的總數可能有幾種不同的情形？（最少 5 個、最多 13 個）" gives the min and max inside the question, so the answer "9 種" is just 13−5+1. The same item also appears twice in a 3-item sample.
2. ratio/px | advanced: proportions with negative terms, such as `(−4x−3):7=(−2x−9):(−19)` and `2:(−9)=(1)/(3):(−3x)`. Likewise rv | challenge | decimal: `(−2.12):(−1.61)`. Ratios with negative terms are odd at g7 level.
3. scinot/unit | challenge: `9.978×10^−25m＝nm` is a physically meaningless length. `7.1×10^0 mm²` asks students to convert a number that has a ×10⁰ factor.
4. factors/euclid | challenge: a floor of 11484 cm × 11250 cm (about 115 m × 112 m) to be tiled is unrealistic.

**B. Flat or inverted ladder**
- signed
  - addsub | challenge | fraction: like-denominator sums such as `(1)/(3)＋(2)/(3)＋(−2(1)/(3))＋(1)/(3)` are easier than advanced, which mixes denominators.
  - sub | challenge | integer: same three-term pattern as advanced.
  - laws | challenge | integer: `30×1001＝` is trivial.
- exponent
  - compare: basic has `3^10 vs 27^5` (needs base conversion), while 2 of 3 advanced items are same-exponent ordering like `6^3、3^3、11^3`.
  - sum | advanced: repeats the basic item `5^2＋5^2`.
  - smart | challenge: `9788^2−9788×9688` uses the advanced template with bigger numbers.
- scinot
  - expand | advanced: `4.5×10^3＝` and `8.1×10^0＝` are easier than basic (萬 units, digit counts).
  - muldiv: advanced and challenge are both plain two-factor products. Only basic has division.
- linear
  - s1 | advanced | integer: `(−2)·4x` and `(−4)·3x` are no harder than basic.
  - mix | advanced | integer: `9x−7＝−6x−37` is basic-level.
- simultaneous/sub | challenge | integer: `{a−4b＝16, 8a−b＝66}` is the same as basic.
- ratio
  - rv | challenge | integer: `將 13:4 化為最簡整數比` (answer 13:4), `3:6` and `8:20` are the easiest items in the unit.
  - ch | challenge | integer: same as basic.
- function
  - nested: basic fraction and decimal use triple nesting (`f(f(f(−1)))` = −157/250, = −54.172), while advanced integer is `f(0) 與 f(f(0))`.
  - replaceFunction | challenge | fraction: `g(x)＝3f(x)＋4` is easier than advanced `g(x−4)＝f(2x＋3)`.
  - sumValues | challenge: `f(1)＋f(3)＋f(5)` is easier than advanced.
  - constantValue | challenge: `f(1)×f(86)` is trivial.
  - linearValue | challenge | integer: same template as advanced.
- numberline
  - absinv | challenge: integer `｜x｜＋4＝10` and decimal `｜x｜＋1＝1.8` are easier than advanced decimal `｜x−5.2｜＝5.7`.
  - absval | challenge | integer: `｜11−2｜` matches advanced.
  - absarith | advanced | decimal: plain sums are easier than basic products.
  - mark | challenge | integer: "向左移動 1" is trivial.
  - compare | challenge | integer: "寫出介於 4 與 6 之間的數" is trivial.
- coordinate/area: advanced uses the same triangle-on-x-axis template as basic.
- lineeq
  - cross | advanced: intersecting with x＝−4 or y＝3 is easier than basic, which solves a full 2×2 system.
  - online | challenge | fraction: a single "求 a" substitution is easier than advanced.
- symmetry
  - axes: basic has combined counts (e.g. 正五邊形＋箏形), while advanced has single shapes.
  - property: basic and advanced use the same template.
  - coord | challenge: same as advanced.
- statistics: mean advanced and challenge use the same "以 N 為基準" template; mode basic and advanced are the same.

**C. Numbers and modes**
- Ugly answers:
  - cx | challenge: `1100/581`, `573/575`, `175/2043`, `225/947`; advanced: `413/207`, `340/171`.
  - px | challenge: x = −13/29, 61/12, −88/25, 37/14, −54/13, −72/7; advanced fraction: 55/19.
  - ca: `448:240:135`, `245:1155:264`.
- function decimal mode returns 3-decimal values:
  - quadraticValue basic: −17.144, −12.335.
  - quadraticValue advanced: −32.392, −42.592, −13.687, −11.847.
  - quadraticValue challenge: −16.412, 10.504.
  - composite challenge: −180.457, 18.752.
  - nested decimal: −54.172, 4.488, −16.382.
  - quadraticValue advanced fraction: −397/600.
- signed/muldiv | challenge | decimal: `5.1×4.44×(−4)×(−6)＝543.456` and `−126.672`.
- numberline/mark | challenge | fraction: B＝−154/15, distance 254/15.
- simultaneous/elim | challenge | fraction: `…＝−(242)/(15)`.
- Integer-mode problems:
  - ratio/cp | advanced | integer gives non-integer answers: y＝77/3, x＝91/3, y＝49/3.
  - ratio/cp | challenge | integer puts decimals in the question: `1.6`, `19.25`.
- Fraction/decimal mode but all-integer questions:
  - coordinate/axisdist: basic decimal, advanced fraction, advanced decimal, challenge fraction and challenge decimal.
  - lineeq: online challenge fraction, hvline basic fraction, graph advanced fraction, and twopoint advanced fraction. The twopoint one repeats the advanced integer item word for word: `ax＋by＋1＝0 … (−3, −2)、(−5, −3)`.
- No mixed-number issue applies to g7.

**D2. Typography**
- ASCII operators:
  - ratio uses ASCII `=`, `:` and `+` throughout (e.g. `x:4=18:3`); the source has `EQ='…=…'` at line 2581.
  - inequality uses ASCII `+`, `<` and `>` in questions, and steps mix `+` with `＋`.
  - scinot/rep | basic: `n＝-5` uses an ASCII hyphen.
- A literal 1 where it should be dropped:
  - linear/e1 | challenge | fraction: `代入：1a−(1)/(2)…`.
  - Exponent 1 written out in questions: `8^6 × 8^6 × 8^1`, `x^1`, `(6^3)^2 × 6^1`, `(2^3 × 5^1)^3`, `2^1 × 5^4…`, `5^3 × 2^1`.
  - Exponent 1 in answers: `25^1 ×…`, `(5 × 2)^1＝…10^1`.
  - Factor 1: `6×(−1)×1×3`, `(−12)×1×(−11)`, and in scinot `…×1×10^−1`.
- Duplicate or garbled steps:
  - exponent/mixedOps | challenge: the answer ends `…＝2＝2`.
  - ratio/px | basic | fraction: the step reads `x=(7)/(8)，同乘以 8：8x=7，x=(7)/(8)`.
- Unsimplified constant: inequality/comb | challenge | decimal has `>−0.3x−13.28−1`.
- Decimals inside fraction-mode steps: inequality comb and sgraph challenge fraction show `0.5`, `−2.25`, `−0.4x`.
- Missing space: inequality/gdraw | challenge has `不小於 0且不大於 1`.
- Mixed bracket styles:
  - absolute value is fullwidth `｜` in numberline but ASCII `|` in inequality.
  - absarith questions have no trailing `＝`.

**Counts:** wrong answers 0; ill-posed/unrealistic 4; flat/inverted ladder 29 units; numbers/modes 10 issue groups; typography 8 issue groups.
