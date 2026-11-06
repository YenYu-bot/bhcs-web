I found one wrong answer in my 17 topics; every other answer checks out. The bigger problem is the difficulty ladder: in about 70 unit/mode blocks the three levels differ only in numbers, or a harder level is actually easier. I recomputed every answer in `g11-drills.txt` lines 5085–10518 by hand or with Python (exact fractions). For the matrix items, which are flattened in the dump, I tried all ways of splitting the digit strings and checked that at least one matches.

## A. Wrong answer (1)

- **plane3d · pointdistance · challenge · integer**
  - Q: 求與平面 2x＋2y＋z＋10＝0 平行且距離為 3 的平面方程式。
  - A given: 2x＋2y＋z＋13＝0 或 2x＋2y＋z＋7＝0. Those planes are only 1 away.
  - Correct: **2x＋2y＋z＋19＝0 或 2x＋2y＋z＋1＝0**.
  - Cause, in `/home/claude/yenyu-bot/bhcs-web/tools/math/g11-drills.html` line 2285: the question states distance `k*L`, but the code builds the planes with `e1=d+k*L` / `e2=d-k*L`. That moves the plane by only k. It should be `d±k*L*L`. The `verify()` line uses the same wrong premise, so it doesn't catch it. This is wrong whenever L≠1.

## B. Ill-posed items

None. Two units have titles that don't match their content:
- **expfunctions intersection** is titled 圖形與水平線交點, but the advanced and challenge items intersect two curves.
- **line3d parallelparameter** is titled 兩直線平行求參數, but advanced Q2–Q3 are perpendicularity and challenge Q2–Q3 are line ∥ plane.

## C. Flat or inverted ladder

**Duplicates and inversions:**
- **expfunctions:**
  - intersection: challenge Q2 is the same as advanced Q2 (y＝3^2x vs 6×3^x＋27).
  - reverse: advanced is the same kind as basic, and its Q2 (y＝a^x＋1 through (0,5) → a＝5) is easier than basic.
  - value and equation: challenge is the same one-step skill as advanced.
- **expequations:**
  - quadratic: challenge Q1 (4^2x−17×4^x＋16＝0) is the same as basic Q2.
  - application: every level is one step. Advanced integer (2×3³＝54; "1 小時後為 4" → 2) is easier than basic's compound interest.
- **commonlog:**
  - laws: challenge|integer Q3 (log₅7＋log₅15−log₅21) is the same as basic Q2, and advanced Q3 (log2＋log5) is trivial.
  - scientific: challenge|decimal Q1 is the same as advanced|decimal Q1 (logN＝−1＋log5), and challenge|decimal Q3 (N＝0.06) is basic-level.
- **planevector points:** challenge Q2–Q3 (find a vertex from the centroid) are basic Q1–Q3.
- **spaceconcept dihedral:** challenge Q2 (ACGE vs ACH, √6/3) is the same configuration as basic Q3. Challenge Q1 is a trivial 90°.
- **spacevector coorddistance:** challenge (distance to the xz plane, e.g. 15 or 8) is easier than advanced (distance to an axis and to the origin).
- **spaceinner cauchymax:** advanced (maximum only) is easier than basic (maximum plus the equality point).
- **line3d pointdistance:** challenge Q2–Q3 use axis-parallel lines, which is easier than advanced.
- **conditionalprob:**
  - multiplication: advanced is just "P(A)·P(B|A) given", which is easier than basic's ball-drawing items.
  - independentoperation: challenge Q1–Q2 are a single product P(A∩B), easier than advanced P(A∩B′).
- **bayes:**
  - factoryorigin: advanced Q3 is the same as basic Q2 (30/30/40, 3/6/4 → 乙 18/43).
  - bayestwo: basic Q2–Q3 condition on 良品 (the complement), which is harder than advanced's count-based items.
- **matrixapps:**
  - identify: all three challenge items are the same y＝−x reflection matrix used in advanced.
  - reversestate: challenge Q2 is the same as basic Q1, and 7 of 9 answers are X₀＝(1/2, 1/2).

**Same single computation at every level (only the numbers change):**
- **loggraphs:** equation (challenge Q2–Q3), inverse (advanced the same as basic), application in decimal mode (pH at all three levels).
- **planevector:** unitvector (advanced the same as basic).
- **vectorcauchy:** projection, cauchy (advanced the same as basic).
- **determinant:** evaluate.
- **spaceconcept:**
  - threeperpendicular (challenge Q1–Q2).
  - nestedlength: basic and advanced are both a single PB＝√(PA²＋AB²), and BC is only a distractor.
  - commonperp: basic and advanced are both edge-to-edge distance equal to the side length.
- **spacevector:** magnitude, motion (challenge Q1–Q2).
- **spaceinner:** perpendicular (advanced the same as basic), normcombo, pointdistance, scalarprojection, vectorprojection.
- **spacecross:** det2 (challenge the same as advanced Q1), cross.
- **plane3d:** pointnormal, parallel, bisector, parallelparameter, perpparameter, paralleldistance, foot, reflection.
- **line3d:** pointonline, lineplane (challenge Q2–Q3 are basic).
- **conditionalprob:** atleastone, reliability (challenge the same as advanced).
- **bayes:** totalthree, medicalnegative, reverselikelihood, reverseprior, predictive, reversefactory, treatmenttype.
- **matrixops:** singular (challenge Q1–Q2 are basic), determinant, productsize.
- **matrixapps:** pointimage, inversepoint, lineimage, trianglearea, transitioncomplete, transitionbuild, nextstate, population, composition (challenge Q1–Q2 are basic).

## D. Number problems

**Oversized or ugly answers:**
- **vectorcauchy perpendicular · challenge · fraction:** x＝1229/28, −950/81, 431/42, from inputs like −25/6 and 50/9.
- **planevector lincomb:**
  - challenge|fraction: 3m＋n＝−203/4 (m＝−57/4).
  - advanced|fraction: (−49/9, 26/9).
  - basic|fraction: (−13, −44/5).
- **spacecross:**
  - crossmagnitude: √1713, √5198, √2129, 2√705.
  - parallelogramarea: √4197.
  - trianglearea: √2173/2, √698/2.
- **line3d skewdistance:** 81√382/382, 53√61/61.
- **spaceinner scalarprojection:** −335/17, 548/17, −381/13.
- **loggraphs equation · advanced:** log₁₀(5x − 349/10)＝−1 has an ugly constant.

**Fraction mode that doesn't produce fractions:**
- **commonlog definition:** basic|fraction answers are 0, 0, −1 and challenge|fraction answers are 12, 5, 17.
- **commonlog laws:** every fraction-mode level has integer answers (2,1,1 / 1,3,2 / 1,3,2), so the mode is effectively the same as integer.

There are no mixed numbers anywhere in these topics.

## E. Typography

- Exponent "^1" is shown where the plain number would do: （1/2）^1 (expfunctions compare basic), 16^x×2^1 (expequations convert basic Q3), 5^3x−8 ≥ 5^1 (expequations inequality basic Q2).
- matrixops singular: basic answers say "x＝−2", but advanced and challenge Q1–Q2 give a bare "4" or "−6".
- spaceinner angle advanced writes "(−3√65)/(65)", while every other answer puts the minus outside as "−(n)/(d)".
- No ASCII minus, "1x" or "＋0" found.

## Counts
| Category | Count |
|---|---|
| A. Wrong answer | 1 |
| B. Ill-posed | 0 (2 title mismatches) |
| C. Flat or inverted ladder | about 70 unit/mode blocks, 16 of them duplicates or inversions |
| D. Numbers | 9 units (7 with oversized or ugly answers, 2 where fraction mode gives integers) |
| E. Typography | 3 issue types (5 instances) |

I checked the source code only for the wrong answer, the convert nested-fraction rendering and the bayes "最可能來自" generator. The convert item (line 1240) uses `fr()` with `<sup>`, so its garbled look in the dump isn't a page bug.
