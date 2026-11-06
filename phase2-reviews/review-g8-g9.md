I checked all 1,035 sections (about 3,100 Q/A pairs) in both files and found one wrong answer, in g9 games (listed under A). The other main problems are three ill-posed items in g9, a weak difficulty ladder in many units, and fraction/decimal modes that often produce integer-only questions. Algebra items were checked by machine (expansions, factorisations, equation roots, division identities, evaluating both sides at random values). I recomputed the word problems, geometry, statistics and probability by hand or in Python, with quartiles using the Taiwan textbook convention (Q1 is item ⌈n/4⌉, or the average of items n/4 and n/4+1 when n/4 is a whole number). Only `[圖]` items whose answer depends on reading the figure were skipped. Nothing in the repo was modified.

## A. Wrong answers
1. **g9 games | challenge | integer** — `甲、乙兩人玩遊戲：將一顆骰子連擲兩次，第一次點數較大甲得分，第二次點數較大乙得分（相同重擲）。這個遊戲公平嗎？分別求甲、乙得分的機率並說明。 => 公平；甲 (5)/(12)、乙 (5)/(12)`. Because ties are re-thrown, each player scores with probability **1/2**, not 5/12. 5/12 is the chance for a single throw before re-throwing. The verdict "公平" is correct.

Every other answer I could check is correct and in simplest form.

## D1. Ill-posed items (worst first)
1. **g9 threeLines | advanced | integer** — `AD∥BE∥CF，AB＝2、BC＝4、DE＝x−1、EF＝2x−2，求 x。 => x＝9`. Since 2/4 = (x−1)/(2x−2) for every x > 1, the equation gives no information and x cannot be found.
2. **g9 tangentLen | advanced | integer** — `AP＝8、BQ＝8、CR＝2 … 若 ∠A＝30°，求 ∠POR => AB＝16、BC＝10、AC＝10；∠POR＝150°`. Those sides force ∠A ≈ 36.9°, not 30°, so the data contradicts itself.
3. Same unit and level: `AP＝4、BQ＝4、CR＝7 … 若 ∠A＝83°`. The sides 8, 11, 11 force ∠A ≈ 68.7°, not 83°.
4. Degenerate items (minor):
   - g8 combine | challenge | fraction: `化簡 5x^2 − 7x − 5x^2 ＋ 2 − 5 ＋ 7x，再求 x＝−(1)/(2) 時的值 => −3；值為 −3`. The expression simplifies to a constant, so substituting x does nothing.
   - g8 polyDivideMono | basic | decimal: `(−0.9x^2 − 3.3x ＋ 0.7) ÷ 1`. Dividing by 1 is trivial.
   - g9 value | basic | fraction: `(2x＋2y＋2z)：(x＋y＋z) => 2`. The answer is 2 whatever the given ratio is.
   - g9 sides | advanced | integer: the similar quadrilateral's shortest side is 11, the same as the original's, so the two shapes are congruent.
   - g9 games | challenge: digit cards 4, 6, 8 → `(1) 1 (2) 1`. Both answers are trivially certain.
   - g8 rectangle | advanced: `對角線長 (26)/(3)，寬 8 => 長 (10)/(3)` and `對角線長 12.3，寬 12 => 長 2.7` (fraction and decimal). The "length" comes out shorter than the "width".
   - g8 judge (arithmetic sequences) | basic | fraction and decimal: three of six items are constant sequences (−25/3 repeated; 2.8 repeated; 8.1 repeated).
   - g8 differenceNumber (差平方速算) | challenge | integer: `49^2 ＋ 2 × 49 × 1 ＋ 1^2` and `999^2 ＋ 2×999×1 ＋ 1^2` are sum-of-squares items in the difference-of-squares unit.

## B. Flat or inverted ladder
**Inverted (the higher level is easier):**
- g8 commonBracket | challenge, all modes: `已知 (x − 3) 是 (x − 4)(x − 3) − 12(x − 3) 的因式，求另一個因式 => (x − 16)` and five similar items. These only ask you to read off the bracket, which is easier than the full factorising at basic level.
- g8 hypotenuse | challenge | integer: `兩股長為 4、3，求它的周長與面積`. Advanced asks for legs from a ratio, which is harder.
- g8 sol | challenge: `用公式解解方程式：x^2 − 3＝0`.
- g8 criterion | challenge: `若兩個三角形「三邊對應相等」，它們一定全等嗎？`
- g8 monoMultiply | challenge | integer: `(x)^3 × (4x^3)`.
- g9 combine | challenge | integer: `若 4x＝8y、y＝2z => 4：2：1` and `8x＝3y、y＝8z`.

**The same item appears at two levels:**
- g8 intsides: the "perimeter 16" item is identical at advanced and challenge.
- g8 bisangle: `∠A＝66°，求 ∠BQC => 57°` is identical at advanced and challenge.
- g8 names, judge (parallel lines) and basis: one challenge item each is identical to an advanced item.
- g8 geoseq apply: the `社團…1/2 倍，100 人` item appears at advanced·fraction and again at challenge·integer.
- g9 judge (parallel ratio): `AD：DB＝5：3，AE：AC＝5：8` is identical at advanced and challenge.
- g9 coins: `投擲一枚均勻硬幣 3 次…` is identical at basic and advanced, and the challenge "balls 1–4" item repeats the advanced one.
- g9 sumdiff | challenge: the two "sum 5 or difference 1" items within the same section are mathematically the same.

**Same kind of question with only the numbers changed:**
- g8 algebra:
  - nearProduct: basic and advanced in fraction and decimal modes are both plain a×b products.
  - differenceValue: basic and advanced in fraction mode are both `(n½)²−(m½)²`.
  - sumNumber: basic and advanced.
  - formulaChain | fraction: basic and advanced.
- g8 quadapps: area, number, count and right challenge levels reuse the basic or advanced templates; for example `(x+4)(x+2)=6x²` at challenge has the same form as basic `(x+4)(x+8)=15x²`.
- g8 geoseq nth and gmean: basic and advanced are the same kind.
- g8 geometry (angles, congruence, bisectors, triineq, parallel, quadrilateral, construction): in most units at least one higher level just re-draws a lower-level template. Examples:
  - angles equation | challenge: `外角 (4x−10)° …` is the same as basic.
  - zigzag | challenge is the same as basic.
  - perpbis advanced is the same as basic.
  - apply, rhs and congmeasure: advanced is the same as basic.
- g9:
  - cyclic: challenge is identical in type to advanced.
  - parallelChords: advanced (arc CD 70°/68°) is the same as basic (arc CD 26°/72°).
  - Also flat: shortest, ladder, segment, special (tall-building elevation item), incenter (challenge), pyramid (advanced), meanmed, dice, poker, experiment, shift.

## C. Number sizes and modes
**Ugly or oversized numbers:**
- g8 addRadicals | advanced | fraction: answer `(−45 − 932√3)/(60)`. A stray constant term (−3/4) inflates the answer; a cleaner form is −(233/15)√3 − 3/4.
- g8 divideRadicals | challenge | fraction: `√19 ÷ √5 × √13 => (√1235)/(5)`.
- g8 longDivision | basic | fraction: remainders `−(149)/(4)` and `−(51)/(8)` at basic level.
- g8 fill | advanced | fraction: `−(185)/(12)…`.
- g8 right | challenge: hypotenuse 287, sum 343, constant term 17640.
- g9 altitude | advanced: BD 64, CD 225 → AB 136, AC 255; also BD 1152/25 in fraction mode.
- g9 fold:
  - advanced: 389/34.
  - challenge: 595/72.
  - advanced: AD = 123.
- g9 centroid | challenge: 924/85.
- g9 sides | challenge | fraction: 76/11.
- g9 aa | advanced: 42/11.
- g8 monoDivide | integer mode: answers like (10/3)x⁴, (16/3)x⁵ and −(27/4)x⁵.
- g8 altitude | advanced | integer: the given altitude is `13.44`.

**Fraction or decimal mode with integer-only questions:**
- g8 commonBracket, substitution and gcfThen: only a constant prefactor (`(2)/(3)[…]`, `0.4[…]`) is wrapped around an integer problem.
- g8 sqrt units:
  - rootMeaning challenge (fraction and decimal).
  - simplify basic fraction (√54, √24).
  - mixed advanced and challenge fraction.
- g8 numberLine | challenge (fraction and decimal).
- g8 arithseq units:
  - fill challenge (fraction and decimal).
  - judge challenge (fraction and decimal).
  - term advanced fraction.
  - mid advanced decimal.
  - sum advanced fraction and decimal.
- g8 gmean, all fraction levels.
- g9:
  - parallelSeg and twoStep, challenge fraction.
  - sides advanced fraction.
  - area challenge fraction.
  - altitude challenge fraction.
  - fivenum challenge decimal.
  - measure fraction mode produces decimals (8.4, 7.65).

**Mixed numbers on g10/g11:** not applicable to g8 or g9.

## D2. Typography
- g8 definedOps, all items: comma missing before 求, e.g. `B＝−2x^2 ＋ 5x − 1求 A − B`.
- g8 redundant brackets: `(x)^3`, `(x ＋ 5y)^2 − (x)^2`.
- g9 games: missing space in `排出5 的倍數` and `排出3 的倍數`.
- g9 experiment: stray spaces in `出現 6 點 。` and `6 點 的機率`.
- g9 dice: awkward phrasing `的 1 倍`.
- g9 value | advanced | fraction: `（x²）：xz`.

## Counts
| Category | Count |
|---|---|
| A. Wrong answers | 1 |
| D1. Ill-posed | 3 serious, 8 minor or degenerate |
| B. Ladder | about 6 inverted, 10 exact duplicates across levels, about 35 flat units |
| C. Numbers | about 14 ugly or oversized items, about 22 sections whose mode does not change the numbers |
| D2. Typography | 6 patterns |

My checking scripts are in `/tmp/claude-0/-home-claude/af1370aa-2aeb-51e7-b9ee-b2165674ab80/scratchpad/chk/`.
