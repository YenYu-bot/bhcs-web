I found no wrong answers in g2, g3, g4 or g6. The confirmed problems are 4 ill-posed or unrealistic items, about 26 units with a flat or inverted ladder, a number-mode problem in g6 that is mostly fraction/decimal modes showing whole numbers, and some minor typography.

I checked all 582 g6 blocks plus every g2, g3 and g4 item. Every pure expression was recomputed with Python Fractions, every `x＝` answer (135 equations) was put back into its equation, and ratio items were cross-multiplied. The rest (word problems, geometry, time, speed, percent, GCD/LCM, money, rounding) I recomputed by hand or in Python. I skipped `[圖]` items. Ladder judgments come from the 3-item samples; where I say "generator", I confirmed it in the source. Nothing in the repo was modified.

## A. Wrong answers
None found.

## B. Ill-posed or unrealistic (most severe first)
1. **g6 unknown / eval, challenge, all modes: 長 is shorter than 寬.** This happens in 4 of the 6 perimeter items:
   - 「長方形的長是 x 公分、寬是 43 公分 … 當 x＝9 時」
   - 長 1(7)/(12) vs 寬 2(3)/(4); 長 1(1)/(5) vs 寬 1(3)/(4)
   - 長 0.31 vs 寬 9.22; 長 28.7 vs 寬 29.6
2. **g6 volume / composite, kind `stack`, integer and decimal: the top block is bigger than the block it sits on.** The generator (line 574) draws all six dimensions independently. Examples:
   - 「長 2、寬 4、高 5 的長方體上面，疊放一個長 10、寬 5、高 3」
   - 「長 9、寬 2、高 2 … 疊放 長 10、寬 6、高 1.2」
   - 「長 4、寬 2、高 8 … 疊放 長 4、寬 7、高 4」
3. **g6 area: shapes with near-zero sizes.**
   - rectangle advanced decimal: 「長 0.2 cm、寬 0.1 cm，求周長」
   - triangle challenge decimal: 「底 5.3 cm、高 0.1 cm」
   - trapezoid advanced integer: 「面積 19，上底 14、下底 24」 gives 高 = 1
4. **g4 bignum / write, basic:** 「把 8,005,906 寫成『□億□萬□』這種形式」. The number has no 億 part, so the form doesn't fit; the answer given is 800萬5906.

## C. Flat or inverted ladder
**g2**
- **add, challenge:** 「400 ＋ 400」 and 「500 ＋ 40」 are easier than advanced's 「70 ＋ 24」.
- **sub, challenge:** 「700 − 600」 and 「320 − 10」.
- **groups, challenge:** 2 of 3 are plain basic items (「每袋 2 片，4 袋」, 「9 張 × 4 包」).
- **calendar:** challenge 「4 月有幾天？大月小月」 is easier than advanced 「星期六再過 12 天」.
- **units (時間):** basic 「3 小時 20 分是幾分」 is harder than advanced 「2 小時是幾分」.
- **edgesum, challenge:** 2 of 3 repeat advanced's 「正方形 4 邊合起來 36，一邊長」.

**g3**
- **tables:** every level is a single multiplication fact. In the generator, advanced only widens the tables from 2–5 to 2–9, and 75% of challenge items are still single facts.
- **mixed:** challenge 「5 × 4 ÷ 2」 and 「3 × 4 ÷ 6」 are easier than advanced 「72 ÷ 9 × 7」. The generator's only difference is that c can go up to 12.
- **twodigit:** advanced already allows a carry in both digits (「98 × 3」, 「95 × 8」). The generator's L===1 check never excludes a tens carry, so advanced overlaps challenge.

**g4**
- **place, challenge:** 「9,000,961,117,508 的個位數字」 is easier than basic.
- **mul:** basic 「□ ÷ 6 ＝ 3,739」 and 「3,064 的 4 倍」 are harder than advanced's 「180 × 30」 and 「900 × 60」.
- **sqm:** basic 「129,525 平方公分＝（ ）平方公尺（ ）平方公分」 is harder than advanced 「8 平方公尺＝」.
- **est:** challenge is the same 3-term add/subtract rounding as basic.
- **life:** challenge repeats advanced's three item types.

**g6**
- **units (length, weight, capacity, area, volume):** every level is a single one-step conversion. Challenge integer only has bigger numbers (「170 公噸＝？kg」). Challenge fraction is easier: 「(4)/(5) km＝？m」, 「(1)/(2) L＝？mL」. compare is the same kind at every level.
- **time / sub:** challenge (two clock times, hours and minutes) is easier than advanced (hours-minutes-seconds with borrowing).
- **gcd / factored:** basic already asks for GCD, LCM and the check; advanced and challenge ask the same.
- **area / parallelogram:** the same base–slant–height question at every level.
- **area / composite:** the basic decimal "hole" item is the challenge item.
- **circle / circumference, integer:** advanced (from the diameter) is easier than basic (from the radius).
- **volume / prism, advanced integer:** 「底面積 35、高 9」 is easier than basic's trapezoid prism.
- **simplify / order, challenge integer:** 「144 ÷ 8 × 2 ÷ 3」 is no harder than advanced.
- **scale:** tomap challenge 「4 公尺 × 1：100」 is trivial; notation challenge repeats advanced items.
- **basecompare / identify, challenge integer:** 「20 元當作 1，100 元」 is a basic item.
- **speed / findv, challenge fraction:** the same remote-car item type as advanced.

## D. Numbers
1. **Fraction/decimal modes showing whole numbers (g6).**
   - **volume / cuboid, basic decimal:** all 3 items are whole numbers (9 cm cube, 6 × 4 × 5 count). In the generator, the cube type gets no decimals in decimal mode, and the count and scale types ignore the mode.
   - **volume:** cuboid challenge fraction 「邊長由 3 cm 變成 3 倍」; capacity basic fraction has no fractions, one of its items uses 23.275 L, and reverse advanced fraction uses 22.8 L and 5.8 L (decimals in a fraction mode); reverse challenge fraction is all whole numbers.
   - **speed:** findv challenge fraction, findd basic fraction, findt challenge fraction and decimal, and average challenge decimal are all whole numbers; meet challenge fraction has 2 of 3.
   - **Other units:** simplify/order challenge decimal 「72 ÷ 3 × 9 ÷ 4」; basecompare identify advanced decimal and challenge fraction.
   - **circle fraction mode:** this means "answer in π" with whole-number radii.
2. **Ugly or oversized answers (g6):**
   - **Basic level:** cuboid basic fraction cube volumes 254(1)/(27) and 20(51)/(64); trapezoid basic fraction with sides 10(3)/(20) and 7(19)/(20), answers 58(5)/(16) and 27(19)/(40).
   - **Advanced:** average advanced fraction 38(34)/(37) and 26(11)/(14); capacity advanced fraction 「23766(2)/(3) cm³＝(713)/(30) L」 and 「＝34.8975 L」 (a decimal answer in fraction mode); circle composite advanced decimal 5597.065.
   - **Challenge:** triangle challenge fraction height 3(18)/(85); simplify/order challenge fraction 142(11)/(12) and 136(3)/(4); findd challenge fraction 168(7)/(12).
3. **g4 fractions not reduced:** (6)/(8), 1(2)/(4), 2(6)/(9), 5(2)/(6), (2)/(4), (8)/(10). This is probably deliberate, since 約分 isn't taught until grade 5. Listed for your call only.

## E. Typography
- **g6 charts:** a stray space after 、 in 「2 顆藍球、 2 顆白球」 (5 occurrences).
- **g6 scale / enlarge:** 「縮小為原來的 5 分之 1後」 is missing a space before 後.
- **g4 tenfold:** 「7億 的 1000 倍」 has an odd space; 「50萬 ÷ 100」 gives the answer 5000 without the thousands comma used elsewhere (18,000).
- **g6 numline and time:** units are glued to numbers (「25公尺」, 「18m²」 where other pages write m^2), and the time page writes 「5時41分」 where other pages write 「2 時」. Some numline answers drop their units.

## Counts
| Category | Count |
|---|---|
| Wrong answers | 0 |
| Ill-posed / unrealistic | 4 |
| Flat or inverted ladder | 26 units |
| Numbers | 2 issue groups (≈17 unit/mode spots on whole numbers, ≈11 ugly answers) + 1 optional g4 note |
| Typography | 4 |

My checker scripts are in `/tmp/claude-0/-home-claude/af1370aa-2aeb-51e7-b9ee-b2165674ab80/scratchpad/p2s-check/` (`chk.py` for expressions, `eq.py` for equations).
