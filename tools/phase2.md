## Phase 2 scope (read after common.md)

Repo branch is now `feat/math-phase2` (main after PR #210 merged). Design-review reports with per-unit proposals: /tmp/claude-0/-home-claude/af1370aa-2aeb-51e7-b9ee-b2165674ab80/scratchpad/design/reports/ (find yours). The owner's plan, phase 2 = make the three levels real, numbers sane and modes meaningful. Concretely, for EVERY unit in your file(s):

A. **Real difficulty ladder inside the unit.** When a teacher picks a single unit and switches 基礎/進階/挑戰, the questions must change in kind, not only in number size:
   - 基礎 = the skill applied directly once (textbook 例題 level), small friendly numbers;
   - 進階 = reverse problems (反求), two steps, or a less obvious form of the same skill;
   - 挑戰 = combined/multi-step or 應用 forms of the same skill (會考／學測 style for 國中／高中), still within the grade's curriculum.
   Use explicit per-level kind lists (e.g. `const kinds={basic:[...],advanced:[...],challenge:[...]}[level]`), never a sliding window over one array. Kinds may repeat across adjacent levels only if numbers/steps differ meaningfully. Where a report proposes a specific harder/easier form for a level, implement it. Adding a reverse or two-step kind of the SAME skill to fill a level is in scope; brand-new topics/units or new skills are NOT (phase 4).
B. **Number caps per level and "nice" answers.** No 7-digit dividends, 9-decimal divisors, denominators like 2700, answers like x≦−465/76. Guidelines (adapt to grade): integers ≤ 2–3 digits at 國小 basic; decimals ≤ 2 places (≤ 1 at basic); fraction denominators ≤ 12 (≤ 20 at challenge when unavoidable); build answers first and derive the question (backward construction) so answers come out clean.
C. **Modes mean something.** If a unit offers integer/fraction/decimal, each mode must actually change the numbers in the question. If a mode cannot apply to a unit, restrict that unit's modes (the unit's own mode list or the page's UNIT_POLICIES mechanism, whichever this file uses) instead of silently producing integer questions. Fix engine bugs that ignore modes (e.g. g8 reading `ctx.modes[0]` so 分數/小數 never appear with the default ticks — use `pick(ctx.modes)` like geoseq does).
D. **High-school pages (g10, g11): no mixed numbers** anywhere in questions or answers — improper fractions only; one answer form (no 「1(2)/(3)（即 5/3）」 duplicates). Default the 可用帶分數 option off/hidden for these pages (inside configs for g11 — see g11 rule).
E. Update each topic's `levels` text / tips so they describe what the levels now really contain, and make sure presets per level still make sense (presets pick units; the in-unit ladder is the main fix).

Out of scope now: moving topics between pages, 補充 labelling (phase 3); new question types/units the reports list as "missing" (phase 4); context-variety/wording polish (phase 5). If you're unsure whether something is phase 2, prefer doing A–D well.

Verification you must do and report:
- sampler: no new `!!` lines (exceptions or null exhaustion) at N≥12 for every unit; any unit with declared bankSize still exact (tell me if a bank must change and why);
- for each unit, a one-line ladder statement with one sample per level showing basic < advanced < challenge;
- recompute answers of every changed kind (Python/fractions for non-trivial);
- diversity: compare distinct question structures (digits→#, 200 samples/unit/level) vs `git show HEAD:<file>`; list any unit/level that went down and why (acceptable when the drop is removed junk; avoid otherwise).

Edit with the Edit tool only (no scripts that rewrite the whole file) because another agent may be editing a different part of the same file.
