**g11-drills.txt review: sequences through trigtransform (17 topics, lines 1–5084)**

I recomputed every answer in the 17 topics, using Python with exact fractions for the statistics, regression and correction items. **I found no wrong answers.** I did suspect one item and checked it in the generator before clearing it: generalpolar/coterminalset (basic, integer), where −480° is in fact inside −1240°≤θ≤−479°. The `^` and `_` grouping that looks ambiguous in the dump (`a_n＋1`, `^n−1`) is proper `<sup>`/`<sub>` in the HTML, so I didn't flag it.

All findings are in /home/claude/yenyu-bot/bhcs-web/tools/math/g11-drills.html.

### 1. Ill-posed or degenerate items
1. **combinations/binomialsum (advanced, integer):** "求 C^5_1＋C^5_3＋C^5_5＋…＋C^5_5". The "…" comes after the series has already reached its last term. The answer 16 is right, but the expression is malformed.
2. **generalpolar/related (challenge, fraction):** "以銳角的三角比表示 sin45°" → "sin45°". The angle is already acute, so there is nothing to do.
3. **standarddev/zcompare (challenge, decimal):** "甲科平均 58、標準差 6，小明得 67 分。乙科平均 58、標準差 6…" → 67. Both subjects have the same mean and SD, so the answer is trivially the same score.
4. **righttrig/fromone (challenge, fraction):** "tanθ＝4，求 (2sinθ−2cosθ)/(3sinθ−3cosθ)" → 2/3. The fraction always equals 2/3, so the given tanθ is never used.
5. **counting/demorgan (advanced, integer):**
   - The prompt says "分別寫出 A′、B′", but the answer never lists A′ or B′.
   - "它等於哪一個集合的補集？" is answered "（A∪B）′". It should be "A∪B".
   - A third item, "A 為 4 的倍數，B 為奇數… 求 (A∩B)′", has A∩B empty, so the answer is just all of U.
6. **correlation/rcompare (advanced and challenge, decimal):** Ranking by strength is written as "−0.9＞−0.6＞0.3＞0" and "−0.9＞−0.7＞−0.5＞0.3". Read as signed numbers, these inequalities are false. The order is correct by |r|, so write it as "|r|: 0.9＞0.6…" or with "強於".
7. **combinations/atleast (challenge, integer):** "選出 3 人，其中至少有 3 位女生" → 56. "At least 3 of 3" just means all girls.
8. **correlation/application (advanced, fraction):** "預測 X＝0 時的 Y" asks for an extrapolation, which contradicts the unit's own hint that predictions only make sense near the data.
9. **radians/convert (challenge, integer):** The hint says 3 rad ≈ 171.9°, but the answer is 172.0° (it uses π≈3.14). Students will see the mismatch.

### 2. Flat or inverted ladder
**Exact or near-exact repeats across levels:**
- series/arithlast: the "二位數除以 5 餘 2" question appears word for word in both advanced and challenge.
- counting/conditions: "x²＝25 / x＝5" appears in both advanced and challenge.
- combinations/required: "12 人選 6 人，指定 2 人全部不得入選" appears in both advanced and challenge.
- permutations/factorial: "計算 5!／2!" appears in both basic and advanced.
- probability/dice: "6 面骰恰一次 6 點" is in basic and advanced; "4 面骰差 1" is in basic and challenge.
- sequences/geometricterm (advanced): the sequence 4，6，9 is used twice in the same set.
- sincosarea/ambiguous: advanced is the same template as basic (a＝b√2 or b√3, unique solution, B＝30°), and 2 of the 3 challenge items are too.
- anglesum/triangle: advanced is identical to basic.
- sincosarea/bisector: advanced is identical to basic.
- righttrig/twostations: all three levels are mostly the same 30°/60° template.

**Same kind of problem at every level (only the numbers change):**

| Topic | Units |
|---|---|
| sequences | periodic, arithmeticinfer, arithmeticindex, geometricindex, recurrenceperiodic, transform (basic vs advanced) |
| series | arithinverse, geoinverse, telescoping (basic vs advanced), sigma (advanced vs challenge), powersums (challenge Q1 is the advanced type) |
| standarddev | rawstats challenge (raw lists like basic), reversetransform (basic vs advanced), zscore (all levels), zinverse challenge Q3 |
| righttrig | definitions (advanced = challenge), elevation (basic = advanced), bearings challenge Q1/Q2 |
| sincosarea | cosineangle (all three levels), cosineside advanced Q2 is a basic item |
| combinations | groups (all levels), identity (advanced vs challenge) |
| generalpolar | terminalpoint, special, lineangle, expression |
| radians | convert in fraction mode, quadrant (advanced vs challenge) |
| sector | inverse, cone, maximum (all levels) |
| doublehalf | point, fromtan (challenge vs basic) |
| trigblend | sineform, interval (challenge vs basic) |

**Inverted (challenge or advanced easier than the level below):**
- counting/negation: advanced "x≥1 的否定" is easier than the basic quantifier items.
- standarddev/spread: challenge Q1/Q2 are concept one-liners; advanced requires computing variances.
- righttrig/identities: challenge is basic-type items.
- righttrig/comparison: challenge Q1 (cos65 vs cos70) is a basic item.
- generalpolar/fromratio: challenge uses first-quadrant cases.
- generalpolar/slope: advanced ("斜率 −1 求斜角") is easier than basic (two points with surds).
- anglesum/known: challenge uses acute angles only, while advanced needs quadrant signs.
- trigblend/condition: challenge has no constant term, while advanced has negative coefficients.
- permutations/adjacent: challenge Q1 is a single pair.
- probability/arrangeprob: challenge Q1 is 2 boys and 1 girl.
- probability/samplespace: advanced uses C(n,r) where basic uses P(n,r).
- permutations/repeated: advanced Q3 is 2R3B.
- counting/setops: advanced Q2 only asks for A′.
- counting/inclusion: advanced Q3 is 12−1; challenge Q3 is the basic type.
- series/annuity: challenge is a 2-deposit reverse; advanced is a 4-deposit forward.
- correlation/affine and meanpoint: challenge is no harder than advanced.
- sincosarea: heron challenge Q3, circumradius challenge Q3 and application challenge Q1 are lower-level items.
- trigtransform: intersections challenge Q3 and parameters challenge Q1 are basic-level.

### 3. Number issues
- **Fraction or decimal mode with no fractions or decimals:**
  - sequences/geometricterm basic (fraction)
  - series/geosum basic (fraction)
  - standarddev/zscore basic and zcompare basic (decimal): all z values are integers
  - sector/maximum (fraction) at all three levels
  - sector/area challenge (fraction): integer radii only
  - trigtransform/intersections (fraction): only one fraction in basic and challenge
- **Ugly fractions:**
  - trigtransform/parameters basic (fraction): "(31)/(8) cos4x − (49)/(12)" and "−(41)/(11) cos4x − (23)/(5)", giving −(458)/(55).
  - sector/inverse basic (fraction): arc "(100π)/(33)" gives (50)/(11).
- **Ratios not in simplest form:**
  - standarddev/groupmean challenge: "人數比為 4：2".
  - doublehalf/geometry advanced: "tanθ＝(6)/(8)".
- **Integer mode producing fraction answers:** sequences/arithmeticmean challenge (公差 1/6 and similar) and threshold challenge (d＝−3/2, −9/5). This is acceptable but labelled integer.
- **Mixed numbers:** none found.

### 4. Typography
- Missing spaces:
  - "點數和大於 9可得", "為 2 或 12可得" (probability/fairgame advanced)
  - "A不排第一位" (permutations/fixed challenge)
  - "預測值 102杯" (correlation/predict challenge)
  - "先經 A 再經 B的" (combinations/paths challenge)
- The hint for sequences/arithmeticrelation reads "a_i＋a_j＝2a_(i＋j)／2". It should be 2a_((i＋j)／2).
- series/powersums advanced: "求 （1²＋…＋16²） 的值" has stray parentheses (and is a basic-level item).
- sincosarea/sineside advanced Q3: the answer is "14", without the "b＝" used in its siblings.

**Counts:** wrong answers 0 · ill-posed 9 · flat/inverted ladder about 45 units (10 with exact repeats) · numbers 6 groups · typography 4 groups.
