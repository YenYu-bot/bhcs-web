## Phase 1 scope (read after common.md)

The design review reports are in /tmp/claude-0/-home-claude/af1370aa-2aeb-51e7-b9ee-b2165674ab80/scratchpad/design/reports/ (one per chunk; find the ones covering your file). Phase 1 = fix ONLY these kinds of items from those reports (mostly tagged P1, some P2/P3 that are plainly bugs):
- wrong answers / answer key that disagrees with the question;
- impossible or self-contradictory data (triangle inequality, angle sums, lengths that contradict given angles, areas that can't coexist, "長方形" with equal sides, ratios not reduced in an answer);
- multiple-choice items with more than one defensible correct option, or the correct option always in the same position (shuffle it);
- the same question printed twice on one sheet (sig must reflect the text);
- display/format bugs: coefficient 1 or 0 printed ("1x", "＋0", "x(x)"), ASCII "-" as a minus sign, missing brackets (fraction/negative base before exponent, negative operand after an operator), repeated factors written twice instead of squared, unsimplified radicals/fractions in answers that should be simplified, stray "−0", answer notation glitches ("x=7r÷1", "1r=9");
- questions that are pure tautologies (the answer is restated in the question) or never require the unit's named skill — fix so the skill is required (smallest sound redesign of that kind);
- dead or broken kinds (e.g. a shuffle whose result is discarded, a kind that renders identically to another);
- degenerate items (x＝−6 printed as the "equation", 10 − 7 ＋ 7, a = b in a ratio, 「有 6 元想買 72 元」 style nonsense).
Also decided by the owner: remove the g2 shapes.identify item 「正方形是不是長方形的一種」 (only that statement).

NOT in phase 1 (do not do these now): difficulty-ladder redesign, sliding-window kind selection, number-size caps, mode (integer/fraction/decimal) fixes, mixed-number policy, new question types, contexts variety, curriculum moves. If a fix would require one of these, skip and list it.

Report: a list of every item you fixed (unit, before → after sample) and every phase-1 item you skipped (why). Keep it concise.
