# Round-3 findings for g9, g10 (independent check, 2026-11-07). No wrong answers. Fix every item.

## Items still present / degenerate
- g9 games | basic | int: `有 2、6、8 三張數字卡…(1) 排出的數是偶數的機率` => `1`; `…5 的倍數的機率` => `0`. Advanced `甲有 6、7、10…乙有 2、4、6` => `(2) 0`. Every asked probability must be strictly between 0 and 1.
- g9 similar/measure: river-width kind at both basic (two right triangles) and advanced (`河寬 AB…BD＝14 公尺`).
- g9 righttri/special | adv: `…走 10 公尺到 D 點…求大廈的高` => `5√3 公尺` (≈8.7 m building; make heights realistic ≥ 10 m).
- g9 centers/special | ch: `GD＝(924)/(85)` (ugly).
- g10 logarithms/laws | ch: `log （(1)/(9)）` => `−2b` is basic level; 8 items identical adv/ch (`log （(1)/(3)）`).
- g10 point/innerouter: 1-D at both basic and advanced (same template), adv `A（−15）、B（15）…3：2` — advanced should be planar or reverse per the phase-2 plan.
- g10 digits | basic: `比較 3^26 與 2^25` needs no logarithms (pick pairs where the comparison is not obvious).
- g10 powervalue | adv: `m＋n＝0，mn＝−81，求 m^3＋n^3` => `0` (degenerate, reject s=0). powervalue challenge `1/m＋1/n` easier than advanced.
- g10 scientific | ch: `（1 × 10^1）×（1 × 10^2）` (degenerate mantissa 1).
- g10 exponent/substitution | ch: 19 of 40 distinct items have the same answer `(a)/(a^2＋1)`; 15 items identical adv/ch; ugly `(1098)/(91)`, `(665)/(66)`.
## Ladder: identical items across levels (fix so no level repeats another level's item)
- g9 order 14 b=a, 6 a=c; trig 14 & 7; midsegment 13 b=a; altitude 13 a=c (`AB＝12、AC＝5，求 BC、AD、BD`); solid/count 10 & 5; fold 8 & 9; letters 7 & 5; pythagoras 7 a=c.
- g10 radicals/telescope 5 & 7; exponent/equation 6 b=a; quadratic/symmetry 5 a=c.
- Same kind every level: g9 sumdiff (95% of advanced = basic templates); g9 games card-compare `甲有…乙有…比大小` at basic & advanced; g9 ratio3/combine advanced `x：z＝1：5，y：z＝3：2` = basic kind; g9 threeLines advanced `AB：BC＝1：3，DE＝9，求 DF` basic kind; g10 exponent/algebra `(mono)^n ÷ mono` all levels; g10 quadratic/interval advanced = basic (vertex inside); g10 cubic/center challenge `x^3＋5x＋d…` easier than advanced; g10 radicals/rationalize advanced = basic; g10 logarithms/digits challenge = basic/advanced kinds.
## Numbers / modes
- Ugly: g9 ratio3/value adv `(706)/(225)`; parallelSeg adv frac `PQ＝(81)/(14)`; threeLines adv frac `DG＝(25)/(13)` (den 13 at advanced); tangent ch `(336)/(31)`; semicircle ch `(625)/(48)`; cylinder ch `水面上升 (81π)/(644) 公分`; g10 line distance `(61√113)/(113)`, `(196√221)/(221)`.
- g9 fold: `AB＝4、AD＝16…求 DE` appears at basic as `DE＝8.5` (decimal in integer mode) and at advanced as `(17)/(2)`.
- Modes without effect: g10 logarithms/growth | ch | dec (32/40 integer-only, `初值 768，每期減為一半`); g10 scientific | basic | dec (28/40).
