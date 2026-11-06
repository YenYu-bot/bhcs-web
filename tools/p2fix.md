## Phase 2, round 2 (independent review findings)

An independent reviewer sampled your file(s) after phase 2 and found that the ladder is still flat or inverted in many units, plus ill-posed items, numbers and mode problems. The review is in the file named in your message (it may cover other files too — handle only yours). Fix EVERY item listed for your file(s):
1. Wrong answers / ill-posed / unrealistic items: fix at the generator.
2. Flat or inverted ladder: each listed unit must end up with basic < advanced < challenge in KIND or steps (not just number size), and no level may repeat an item from another level. Where challenge just reuses basic/advanced kinds, give it a genuinely harder kind of the same skill (multi-step, reverse, combined, applied). Don't make basic harder than the grade allows.
3. Numbers: oversized/ugly answers at basic/advanced → build answers first; challenge may be harder but answers stay clean (denominators ≤ 20, ≤ 2 decimal places unless the unit is about decimals).
4. Modes: wherever fraction/decimal mode yields integer-only questions, either make the mode change the numbers in the question or restrict that unit's modes (UNIT_POLICIES or the unit's own modes list, inside configs for g11).
5. Typography items listed (exponent ^1, coefficient 1, ASCII operators where the rest of the page uses full-width, stray spaces, duplicate steps).

Then verify:
- `cd /tmp/claude-0/-home-claude/af1370aa-2aeb-51e7-b9ee-b2165674ab80/scratchpad && node audit.mjs <file-without-.html> <topic>` must print NOTHING for every topic of your file(s) (CI-equivalent: 40-question papers per unit/level/mode, CI seeds), and each topic run must finish in well under 15 s;
- recompute answers of changed kinds;
- for every unit you touched, show one sample per level proving the ladder.
Rules as before (common.md + phase2.md): Edit tool only, your file(s) only, g11 changes only inside your config bodies. Reply with a concise list of what you changed per unit and the audit result.
