# g6-drills.html design review (all 15 topics)

Source reviewed: `/home/claude/yenyu-bot/bhcs-web/tools/math/g6-drills.html` on branch `fix/math-answer-errors` (read-only). Samples: `scratchpad/design/chunks/02-g6-all.txt`.

## Summary

1. The page splits cleanly into two halves. The **word-problem topics** (speed, basecompare, volume, scale, pattern, charts, circle, most of area) are genuinely good: several question kinds per unit, real level ladders, textbook-style phrasing. The **computation topics** (arithmetic, simplify, unknown, time, gcd, ratio, units) are weak: almost every unit is a single template with number swaps, and "challenge" mostly means "bigger/uglier numbers".
2. **Biggest structural problem — `numberFor()` drives difficulty by magnitude only.** It yields 7-digit dividends (`4028412 ÷ 211 ÷ 172`), 9-decimal divisors (`99.125788608 ÷ 7.776 ÷ 9.499`), 5-digit proportions (`16119：x＝15721：8058`) and 3-decimal × 3-decimal products. No Taiwanese 參考書 prints these. Every unit built on `numberFor` needs a per-level cap on digits/decimal places (recommend: integer ≤ 3 digits at challenge, decimal ≤ 2 places, fraction denominators ≤ 12, answers must be "nice").
3. **簡化計算 topic does not exercise 簡化.** `連加` numbers at challenge are trivial (`2 ＋ 100 ＋ 8`), `連減`/`去括號`/`分配律` numbers never 湊整, `order` never contains brackets although the unit is named 「…與括號」, and `連乘與連除` only produces `a ÷ b ÷ c` with absurd dividends (`1376320 ÷ 92 ÷ 187`). P1 rewrite.
4. **解未知數 is one template per unit** (`x ＋ a＝b`, `ax＝b`, `x − a ＋ b＝c`, `ax ＋ b＝c`, `a(x ＋ b)＝c`, `ax ＋ b` eval). No `x − a`, `a − x`, `x ÷ a`, `ax − b`, `(x ＋ b) ÷ a`, no 列式應用題, and the `3x` implicit-product notation is 國中 notation (國小 writes `x × 3`).
5. **Level ladder is flat or inverted in several units**: time add/sub/mul/div (`rand(180,15000)` ignores level), arithmetic muldiv (integer branch ignores level; challenge is easier than basic), gcd lcm2/lcm3 (ignores level; basic lcm3 answers reach 16632), ratio convert (basic `0.68→68%`, challenge `0.81→81%`), simplify add (challenge easier than basic), area composite (challenge "two rectangles side by side" is easier than basic L-shape).
6. **Modes are decorative in many units**: time (4 of 6 units identical in all modes), area/volume composite, ratio percent/base, arithmetic muldiv decimal (always `× 0.2/0.25/0.5 ÷ 0.2/0.25/0.5`).
7. **Curriculum/notation mismatches for 國小**: gcd uses 指數 (`2^3 × 3`) and `(a，b)`/`[a，b]` notation (both 國一); circle/prism "fraction" mode answers in `π` (國一); unknown uses `11x` (國一); trapezoid asks for 中線 (國中). Time topic is 3–5年級 material; rectangle/parallelogram/triangle/trapezoid are 5年級 (fine as review but basic must be easy).
8. **Missing standard 6年級 question types**: 應用題 everywhere in the computation topics; 求比率（48 是 240 的百分之幾）in ratio; 打折 in discount; 扇形 by 圓心角 in circle; 互質/短除法/分裝應用 in gcd; 時刻計算 in time; 等比/圖形規律 in pattern; 一步驟 word-problem 列式 in unknown.
9. Concrete bugs: spinner questions where 「其餘 N 格是白色」 while 白色 is also one of the two painted colours (charts/compare); duplicate questions inside one sampled set (simplify add basic `1 ＋ 15 ＋ 9` twice); `四則混合` prints improper fractions while every other unit prints mixed numbers.
10. The answer format `1(2)/(5)（即 (7)/(5)）` is printed on every fraction answer; keep it for 比值, drop the 「即」 duplicate for lengths/areas/money (it doubles the answer-key width).

Priority legend: P1 = wrong/confusing/clearly too easy or hard; P2 = noticeably better; P3 = polish.

---

## Topic: arithmetic — 分數與小數四則運算
- Levels promised: 「基礎：正數兩項、數值較小」「進階：二至三項，加入異分母與不同小數位」「挑戰：三至四項，含括號與跨數型四則」
- Overall: Pure computation drills, one template per unit. Challenge never has brackets and never mixes 分數 with 小數 (「跨數型」 is promised but not delivered). Integer mode is grade-2/3 material (`7 ＋ 9`, `22 − 11`) and should not appear on a 6年級 page except as a warm-up.

### Unit add 加法
- Variety: 1 kind (`a ＋ b`, 3 terms at challenge). No 應用題, no 填空 (`□ ＋ 2(1)/(3)＝5`), no 比較大小.
- Difficulty: integer basic `6 ＋ 9`, advanced `78 ＋ 39`, challenge `215 ＋ 158 ＋ 145` — all below grade. Decimal challenge is 3 terms with 3 decimal places (`3.023 + 4.03 + 7.75`), tedious not harder. Fraction ladder OK.
- Plausibility/tip/mode: tip is fine. Integer mode pointless.
- Proposed changes:
  1. [P1] Integer mode: replace with 「整數＋分數」/「整數＋小數」 mixing, e.g. `3 ＋ 1(2)/(5)＝？`, `12 ＋ 0.85＝？`; or hide integer mode for add/sub/mul/div.
  2. [P1] Challenge: deliver what `levels` promises — 跨數型: `1(1)/(2) ＋ 0.75＝？`（答 2.25 或 2(1)/(4)）and bracketed `（2(1)/(3) ＋ 1(1)/(6)）＋ (1)/(2)`.
  3. [P2] Add 應用題 kind at advanced: `一瓶果汁 1(1)/(4) 公升，再倒入 (3)/(5) 公升，共多少公升？`
  4. [P3] Cap decimals at 2 places; 3 terms × 3 places is noise.

### Unit sub 減法
- Variety: 1 kind. Same gaps as add.
- Difficulty: fraction basic already needs 借位 (`3(1)/(6) − 1(1)/(2)`) — fine; challenge `3(38)/(45) − 1(7)/(10) − 1(4)/(9)` has unnatural minuend. Integer below grade.
- Proposed changes:
  1. [P1] Same integer/跨數型 fix as add.
  2. [P2] Challenge minuends should be whole numbers or simple (`5 − 1(2)/(3) − (3)/(4)`), not `7(19)/(60)`; generate `total` from a nice answer instead of random pieces.
  3. [P2] Add 反求: `□ − 1(2)/(5)＝2(1)/(2)`.

### Unit mul 乘法
- Variety: 1 kind.
- Difficulty: **challenge integer `177 × 183 × 121＝3919311` and decimal `9.63 × 7.84 × 5.1＝385.04592` are absurd** (P1). Advanced decimal `5.29 × 9.89＝52.3181` 4-place products.
- Proposed changes:
  1. [P1] Cap: integer factors ≤ 2 digits at challenge (3 terms `25 × 12 × 4`), decimals ≤ 1 place each at advanced, product ≤ 3 places.
  2. [P2] Fraction challenge should showcase 約分: `2(2)/(5) × 1(1)/(4) × (5)/(6)`（答 2(1)/(2)）instead of `(451)/(120)`.
  3. [P2] Add 分數×整數 and 應用題 (`一條繩子每段 (3)/(4) 公尺，8 段共長？`).

### Unit div 除法
- Variety: 1 kind.
- Difficulty: **challenge integer `1350000 ÷ 60 ÷ 250`, decimal `99.125788608 ÷ 7.776 ÷ 9.499` — unusable** (P1). Advanced decimal `46.004 ÷ 8.68` also too heavy.
- Proposed changes:
  1. [P1] Cap dividend ≤ 4 digits, divisor ≤ 2 digits; decimal dividend ≤ 3 places, divisor ≤ 1 place (`6.72 ÷ 4.8` is the right level for advanced).
  2. [P2] Add 整數÷分數 word form: `3 公升果汁每杯 (1)/(4) 公升，可倒幾杯？`; add 商取概數 at challenge (`2.5 ÷ 0.7，商到小數第一位`).

### Unit muldiv 乘除連算
- Variety: 1 kind `a × b ÷ c`. Decimal mode is always `× {0.2,0.25,0.5} ÷ {0.2,0.25,0.5}` (`8.6 × 0.5 ÷ 0.25`), same at every level.
- Difficulty: **integer branch ignores level** (`rand(2,15)*rand(1,30)`); sampled challenge `33 × 8 ÷ 11` is easier than basic `435 × 12 ÷ 15` (P1 inverted). Fraction advanced yields `(220)/(513)`, `(25)/(68)` — no cancellation, ugly.
- Proposed changes:
  1. [P1] Make level matter: basic `24 × 3 ÷ 6`; advanced `1(1)/(2) × (4)/(5) ÷ (3)/(10)` designed to cancel; challenge `a ÷ b × c` and `a ÷ b ÷ c` ordering traps (`36 ÷ 4 × 3`).
  2. [P1] Decimal mode: real decimals `4.8 × 2.5 ÷ 0.6`, not the fixed 0.2/0.25/0.5 set.
  3. [P2] Fraction: build from the answer backwards so answers are simple (`v` nice, then pick b,c with shared factors).

### Unit addsub 加減混合
- Variety: 1 kind `a ＋ b − c`. Missing `a − b ＋ c`, `a − b − c`.
- Difficulty: ladder = bigger numbers only.
- Proposed changes:
  1. [P2] Random op order (`a − b ＋ c`), 4 terms at challenge, one 跨數型 (`2.5 ＋ 1(1)/(4) − 0.75`).

### Unit four 四則混合
- Variety: **1 kind only: `（a ＋ b）× c`** at all levels. Tip says 先括號再乘除後加減 but there is never a case where order matters without brackets.
- Difficulty: challenge integer `（106 ＋ 112）× 97` is just a 3-digit multiplication.
- Plausibility: fraction mode prints improper fractions `(3)/(2)` here while the rest of the page prints mixed numbers (`numHTML(a,mode)` called without `mixed`) — inconsistent (P1). Challenge fraction answers like `(1469)/(150)`.
- Proposed changes:
  1. [P1] Add forms: `a ＋ b × c`, `a − b ÷ c`, `a × b ＋ c ÷ d`, `（a − b）÷ c`, `a −（b ＋ c）× d` (level-gated: basic 2 ops, advanced 3 ops with one bracket, challenge nested/2 brackets). E.g. challenge: `12 −（2(1)/(2) － 0.5）× 4＝？`.
  2. [P1] Pass `{mixed:ctx.mixed}` so operands print as 帶分數.
  3. [P2] Design numbers so the answer is clean (≤ 2 decimals / denominator ≤ 12).

### Unit convert 分數小數互換
- Variety: 2 kinds (小數→分數, 分數→小數). Missing 帶分數 with 3 decimals, 除不盡 四捨五入 (`(2)/(3)≒0.67`), 比較大小 (`0.6 ○ (5)/(8)`), 填空 on a number line.
- Difficulty: **flat** — basic `0.58→(29)/(50)`, challenge `0.5→(1)/(2)`. Denominator pool is the same at all levels.
- Proposed changes:
  1. [P1] Gate denominators: basic {2,4,5,10}, advanced {8,20,25,50}, challenge {40,125,1000} plus 除不盡 rounding and 3-way 比較 (`(3)/(8)、0.4、(2)/(5) 由小到大`).
  2. [P2] Add 「小數化分數後約分」 with 帶分數 `2.375`.

---

## Topic: simplify — 四則簡化計算
- Levels promised: 「基礎：兩至三項、整數與單一簡化方法」「進階：加入分數、小數及括號」「挑戰：多項連算並靈活運用運算律」
- Overall: The whole topic fails its own purpose: numbers are random, so nothing 湊整 and no 運算律 is ever needed. Each unit is one fixed template; 「多項連算」 never happens (always 3 terms). Fraction mode prints improper fractions (`(37)/(12)`), unlike the rest of the page. This topic needs a design rewrite more than any other.

### Unit order 四則運算順序與括號
- Variety: 1 kind `a ＋ b × c`. **No brackets at any level** despite the unit name.
- Difficulty: challenge `223 ＋ 196 × 190` = big multiplication, not harder reasoning. Decimal advanced `3.61 ＋ 3.74 × 7.46＝31.5104` — 4-place product.
- Proposed changes:
  1. [P1] Kinds: basic `a ＋ b × c`, `a − b ÷ c`; advanced `（a ＋ b）× c`, `a ×（b − c）`, `a ＋ b × c − d`; challenge `a −（b ＋ c × d）`, `［a −（b ＋ c）］× d`, `a ÷ b × c` left-to-right trap. Keep numbers ≤ 2 digits; decimals ≤ 1 place.
  2. [P2] Add 判斷題 kind: 「下列算式先算哪一步？」 with 4 options — standard textbook item.

### Unit add 連加法簡化
- Variety: 1 kind `first ＋ b ＋ (10 − first)`; good idea (湊整) but numbers tiny.
- Difficulty: **inverted** — basic `1 ＋ 11 ＋ 9`, challenge `2 ＋ 100 ＋ 8` (easier). Sample set had a duplicate (`1 ＋ 15 ＋ 9` twice) — dedupe by `sig` seems not to catch it.
- Proposed changes:
  1. [P1] Level numbers: basic `27 ＋ 48 ＋ 73`（27＋73）, advanced `3.7 ＋ 2.85 ＋ 6.3`, `1(3)/(4) ＋ 2(2)/(5) ＋ 3(1)/(4)`; challenge 4 terms with two pairs `1.25 ＋ 3(1)/(3) ＋ 0.75 ＋ 2(2)/(3)` and 「用簡便方法計算並寫出用了哪個運算律」.
  2. [P2] Also place the pair non-adjacently in the middle (`48 ＋ 27 ＋ 52`) so 交換律 is actually needed.

### Unit sub 連減法簡化
- Variety: 1 kind `total − a − b`; `a ＋ b` never rounds, so the tip (連減等於減去和) is irrelevant to the numbers (`23 − 13 − 8`).
- Difficulty: flat (bigger numbers). Fraction mode uses improper `(307)/(120)`.
- Proposed changes:
  1. [P1] Force `a ＋ b` to be a round number or same-denominator pair: `8.3 − 2.6 − 1.4`, `5(1)/(6) − 1(2)/(7) − 2(5)/(7)`, `365 − 88 − 112`.
  2. [P2] Add the reverse form `a − (b ＋ c)` → 「拆括號」 and 4-term `a − b − c − d` at challenge.

### Unit bracket 加減混合與去括號
- Variety: 1 kind `a −（b − c）`. Missing `a −（b ＋ c）`, `a ＋（b − c）`, `（a ＋ b）−（c ＋ d）`.
- Difficulty: `23 −（10 − 7）` — easier to compute inside first, so 去括號 is never the smart move; flat ladder.
- Proposed changes:
  1. [P1] Pick numbers where 去括號 helps: `8.6 −（3.6 − 1.9）`（8.6−3.6 先算）, `5(2)/(9) −（2(2)/(9) − 1(1)/(3)）`, `12(1)/(5) −（4(3)/(5) ＋ 2(1)/(2)）`.
  2. [P1] Add `a −（b ＋ c）` as the primary form (that is the textbook 去括號 case) and a 「是非」 kind: `a −（b − c）＝a − b − c 對嗎？`.

### Unit muldiv 連乘與連除簡化
- Variety: 1 kind `total ÷ a ÷ b`. **No 連乘 at all** (`25 × 7 × 4`, `125 × 8 × 13` are the classic items); tip mentions both.
- Difficulty: **absurd numbers** — basic decimal `101.99 ÷ 6.2 ÷ 4.7`, advanced integer `181425 ÷ 75 ÷ 59`, challenge `1376320 ÷ 92 ÷ 187`, `4.3904286 ÷ 2.3 ÷ 5.517` (P1).
- Proposed changes:
  1. [P1] Rebuild: 連乘 with 湊整 pairs (`25 × 13 × 4`, `0.125 × 7 × 8`, `2(1)/(2) × 7 × (2)/(5)`); 連除 where `a × b` is nice (`720 ÷ 8 ÷ 9`, `9.6 ÷ 0.4 ÷ 0.6`), i.e. `a ÷ b ÷ c ＝ a ÷（b × c）`; challenge mixed `a × b ÷ c × d`.
  2. [P2] Cap totals at 4 digits / 2 decimals.

### Unit dist 乘法分配律
- Variety: 1 kind `a × c ＋ b × c`; `a ＋ b` random (`17 × 5 ＋ 8 × 5` fine, `4.13 × 5.41 ＋ 1.71 × 5.41` useless). Missing `a × c − b × c`, `c × (a ＋ b)` expand, `99 × 37 ＋ 37`, `101 × 25`, `25 × 99＝25 ×（100 − 1）`.
- Difficulty: challenge `175 × 127 ＋ 87 × 127` = big multiply.
- Proposed changes:
  1. [P1] Force `a ＋ b` (or `a − b`) to be 10/100/整數: `3.6 × 2.5 ＋ 6.4 × 2.5`, `(3)/(7) × 15 ＋ (4)/(7) × 15`, `48 × 1.3 − 38 × 1.3`.
  2. [P1] Add 「a × 99＋a」 / 「a × 101」 / 「a × 1.1 ＋ a × 0.9」 kinds at advanced/challenge.
  3. [P2] Fraction mode: `(2)/(5) × 1(1)/(7) ＋ (3)/(5) × 1(1)/(7)` type only.

---

## Topic: unknown — 解未知數
- Levels promised: 「基礎：一步驟、整數與較小數值」「進階：兩步驟並加入分數、小數」「挑戰：括號、混合運算與較複雜係數」
- Overall: Six fixed templates. 108課綱 6年級 「未知數」 is centred on 列式 from word problems (「x 表示…」) and on both directions of each operation; neither is here. Implicit-multiplication `11x` / `(4)/(3)x` is 國一 notation; 國小 textbooks write `x × 11` or `11 × x` and `x × (4)/(3)`. Challenge = larger numbers only (`162（x ＋ 64）＝36126`, `3.199（x ＋ 0.943）＝40.221027`).

### Unit add 一步驟加減運算
- Variety: 1 kind `x ＋ a＝b`. Missing `x − a＝b`, `a − x＝b`, `a ＋ x＝b`.
- Difficulty: challenge `x ＋ 118＝372` same skill as basic.
- Proposed changes:
  1. [P1] Four forms, level-gated: basic `x ＋ a`, `x − a`; advanced `a ＋ x`, `a − x`; challenge word form 「小明有 x 元，花了 2(1)/(2) 元後剩 4(3)/(4) 元，列式並求 x」.
  2. [P2] Cap integers at 3 digits; decimal ≤ 2 places.

### Unit mul 一步驟乘除運算
- Variety: 1 kind `ax＝b`. Missing `x ÷ a＝b`, `a ÷ x＝b`, `x × a＝b`.
- Difficulty: `155x＝29760` (challenge) is a 5-digit long division; fraction coefficient `(7)/(3)x＝(245)/(36)` unnatural.
- Proposed changes:
  1. [P1] Notation `x × 11＝121` / `11 × x＝121`; add `x ÷ 4＝2.5`, `36 ÷ x＝4`, `x × (3)/(4)＝1(1)/(2)`.
  2. [P1] Keep coefficients ≤ 12, products ≤ 3 digits; fraction answers simple.

### Unit same 同級兩步驟運算
- Variety: 1 kind `x − a ＋ b＝c`. Unit name says 同級 but 乘除同級 (`x × a ÷ b＝c`) absent; `x ＋ a − b`, `a − x ＋ b` absent.
- Proposed changes:
  1. [P1] Add `x ＋ a − b＝c`, `x × a ÷ b＝c`, `x ÷ a × b＝c`.
  2. [P2] Decimal challenge `x − 1.909 ＋ 3.49＝13.081` → cap at 2 places.

### Unit mixed 兩步驟四則逆算
- Variety: 1 kind `ax ＋ b＝c`. Missing `ax − b＝c`, `x ÷ a ＋ b＝c`, `a − bx＝c` (challenge), `x × a − b＝c`.
- Difficulty: challenge `177x ＋ 68＝36530` absurd.
- Proposed changes:
  1. [P1] Forms above with `x × a` notation; coefficients ≤ 12; answers integer/簡單分數/1–2位小數.
  2. [P2] Challenge: 應用題 「一枝筆 x 元，買 5 枝再加 12 元運費共 87 元」.

### Unit bracket 含括號的未知數算式
- Variety: 1 kind `a（x ＋ b）＝c`. Missing `（x − b）× a`, `（x ＋ b）÷ a＝c`, `a ×（b − x）`.
- Difficulty: `196（x ＋ 124）＝73304` absurd; `3.199（x ＋ 0.943）＝40.221027` absurd.
- Proposed changes:
  1. [P1] `（x ＋ 3）× 4＝36`, `（x − 1.5）÷ 2＝4.25`, `（x ＋ (1)/(2)）× (2)/(3)＝2`; `a ≤ 12`, `c ≤ 3 digits`.

### Unit eval 代數式求值
- Variety: 1 kind `ax ＋ b` with x given. Missing `a − bx`, `(x ＋ a) × b`, `x ÷ a ＋ b`, and the 國小 staple 「用 x 的式子表示」 then evaluate (e.g. 「每本 x 元，買 6 本的錢 → 6 × x；當 x＝45 時…」).
- Difficulty: challenge `191x ＋ 141, x＝124` is a 5-digit product.
- Proposed changes:
  1. [P1] Add 列式 kind: 「一個長方形長 x cm、寬 5 cm，周長用 x 表示；x＝7.5 時周長？」.
  2. [P2] Coefficients ≤ 12; fraction x paired with coefficient that cancels.

---

## Topic: time — 時間的計算與化聚
- Levels promised: 「基礎：單一時間單位與兩階化聚」「進階：複名數、進位退位與分數小數時間」「挑戰：三階單位與較大的時間乘除」
- Overall: Curriculum: 時間化聚/加減 is 3–4年級, 乘除 is 5年級; usable as review only. **add/sub/mul/div ignore `level` entirely** (`rand(180,15000)` / `rand(60,8000)`), and mode is irrelevant for 4 of 6 units. Everything is 時/分/秒 in seconds; no 時刻 problems, no 日/週, no 應用題. Promised features (進位退位 by level, 三階單位) are not delivered.

### Unit convert 整數時間化聚
- Variety: 2 kinds (秒→複名數, 複名數→秒). Only 秒 as small unit; no 分↔時, 時↔日 at lower levels.
- Difficulty: basic `10456 秒化成複名數` is 3-step division — too hard for basic; challenge adds 日 (ok).
- Plausibility: numbers unrealistic (`17735 秒`). Textbook sizes: `150 秒＝2 分 30 秒`, `2 時 30 分＝150 分`.
- Proposed changes:
  1. [P1] Level-gate units: basic 分↔秒 and 時↔分 two-level (`185 秒`, `3 時 20 分＝? 分`); advanced 時分秒 (`2 時 5 分 40 秒＝? 秒`, `7500 秒`); challenge 日時分 (`1 日 3 時＝? 分`, `100000 秒`).
  2. [P2] Modes: drop fraction/decimal from this unit (they do nothing).

### Unit fracdec 分數與小數時間化聚
- Variety: 1 kind `x 時化成分` with x up to 30 時 (`28(1)/(4) 時` unrealistic).
- Difficulty: flat.
- Proposed changes:
  1. [P1] Kinds: `1(2)/(3) 時＝? 時 ? 分`, `2.4 時＝? 分`, `90 分＝? 時（分數與小數）`, `(3)/(4) 分＝? 秒`, `45 秒＝? 分（化成分數）`; whole part ≤ 5.
  2. [P2] Challenge: `1 時 15 分＝? 時（小數）` then use it in 速率-style multiplication.

### Unit add 時間的加法
- Variety: 1 kind. Flat ladder (basic `3時15分40秒 ＋ 1時22分37秒`, challenge `59分26秒 ＋ 2分5秒`).
- Proposed changes:
  1. [P1] Level-gate: basic no carry (`1 時 20 分 ＋ 2 時 15 分`), advanced one carry, challenge 時刻 「上午 9 時 45 分開始，經過 2 時 30 分是幾時幾分？」 and 跨中午/跨日 with 24 小時制.
  2. [P2] Drop fraction/decimal modes or make them 「1.5 時 ＋ 40 分」.

### Unit sub 時間的減法
- Variety: 1 kind; silly items `2時2分30秒 − 2時2分29秒＝1 秒`.
- Proposed changes:
  1. [P1] Same gating as add; challenge 「從上午 8 時 50 分到下午 1 時 20 分經過多久」, 「電影 9:40 結束，片長 1 時 55 分，幾點開始？」.
  2. [P2] Reject answers < 1 分.

### Unit mul 時間的乘法
- Variety: 1 kind `t × k`. Flat.
- Proposed changes:
  1. [P2] Basic `25 分 × 4`, advanced `1 時 15 分 × 6`, challenge 應用 「每節課 45 分，一天 7 節共幾時幾分？」, `× 12`.

### Unit div 時間的除法
- Variety: 1 kind. Flat.
- Proposed changes:
  1. [P2] Basic `1 時 30 分 ÷ 3`, advanced `5 時 15 分 ÷ 7`, challenge 「3 小時 36 分跑 8 圈，平均每圈？」; also `÷` with answer in 秒 fraction.
  2. [P3] Print `2 時 0 分 18 秒` as `2 時 18 秒` is OK, but be consistent with textbooks (they write 2 時 18 秒).

---

## Topic: gcd — 最大公因數與最小公倍數
- Levels promised: 「基礎：兩數與較小整數」「進階：加入三數與較大的合成數」「挑戰：較大數值及乘積式綜合題」
- Overall: Pure computation, all with 國中 notation. 國小 6年級 (108課綱) teaches 質數、質因數分解 written as `36＝2×2×3×3`, 短除法, 互質, and above all 應用題 (分裝、排隊、同時出發、最大正方形磚). `(60，40)` / `[12，36]` / `2^3 × 3` / 「取較小指數」 are 國一 (`factored` unit is entirely 國一). Keep them behind a 「國中先修」 flag or reword.

### Unit factor 質因數分解
- Variety: 1 kind.
- Difficulty: **inverted** — basic range 12–350 includes `326＝2 × 163`, `253＝11 × 23` (needs primality test of 163); advanced sample had `120`, `135`.
- Proposed changes:
  1. [P1] Basic: largest prime factor ≤ 7 and n ≤ 100 (`48`, `72`, `90`); advanced ≤ 13, n ≤ 300; challenge n ≤ 1000 with primes ≤ 19. Reject n with a prime factor > 19.
  2. [P1] Answer format for 國小: `48＝2×2×2×2×3`（指數式另列為補充）; add 短除法 fill-in kind and 「判斷 91 是不是質數」 kind.

### Unit gcd2 兩數的最大公因數
- Variety: 1 kind. Missing 互質判斷, 「列出所有公因數」, 應用題.
- Difficulty: ladder OK by `g`/`cmax`, but challenge `（40，70）` slips through (g=10,cmax small). Fine otherwise.
- Proposed changes:
  1. [P1] Wording: 「求 60 和 40 的最大公因數」; keep `(60，40)` only in a 國中 option.
  2. [P1] Add 應用題 kind at advanced/challenge: 「48 顆蘋果和 60 顆梨分裝成禮盒，每盒內容相同且不剩，最多幾盒？每盒各幾顆？」; 「長 36 cm、寬 24 cm 的紙剪成最大的正方形」.
  3. [P2] Add 互質 kind: 「8 和 15 互質嗎？」.

### Unit gcd3 三數的最大公因數
- Variety: 1 kind. Challenge `（962，444，481）` ok as stretch.
- Proposed changes:
  1. [P2] Same wording fix; one 應用題 (三種水果分裝).

### Unit lcm2 兩數的最小公倍數
- Variety: 1 kind.
- Difficulty: **level ignored** (`rand(2,12)*(i+2)*rand(1,3)`); challenge sample `［12，36］＝36`, `［6，9］＝18` is easier than basic `［44，18］＝396`.
- Proposed changes:
  1. [P1] Gate by level: basic one divides the other or small coprime (`[6,8]`), advanced shared factor (`[12,18]`, `[20,48]`), challenge `[24,36]`-type plus 應用題 「紅燈每 12 秒、綠燈每 18 秒同時亮，下次同時亮？」, 「每 6 天/每 8 天去圖書館」.
  2. [P2] Add 「兩數的積＝GCD×LCM」 and 「最小公倍數是 36 的兩數」 reverse kind at challenge.

### Unit lcm3 三數的最小公倍數
- Difficulty: **basic answers 5940, 11880, 16632** — unacceptable for basic (P1). `v>200000` is the only cap.
- Proposed changes:
  1. [P1] Cap LCM ≤ 200 at basic, ≤ 600 advanced, ≤ 2000 challenge; choose numbers ≤ 30 sharing factors.

### Unit factored 乘積式的GCD與LCM
- Variety: 1 kind; A,B random so half the samples are coprime (`（A，B）＝1`) — pointless.
- Curriculum: 國一.
- Proposed changes:
  1. [P2] Force a common factor; show as 「A＝2×2×3×5，B＝2×3×3×7」 for 國小 mode; label unit 「國中先修」.

---

## Topic: ratio — 比、比例式與百分率
- Levels promised: 「基礎：整數小數值與單一步驟」「進階：加入分數、小數與百分率互換」「挑戰：混合數型與生活應用題」
- Overall: No 生活應用題 anywhere although challenge promises them. `percent` and `base` are near-duplicates (`percent` = the 求比較量 half of `base`). Numbers in `value`/`proportion` explode at advanced/challenge.

### Unit simplify 化為最簡整數比
- Variety: 1 kind `a：b＝？`. Missing 混合型 (`0.5：(3)/(4)`), 填空 (`3：4＝9：□`), 相等的比判斷, 應用 「男生 18 人、女生 24 人，男女人數比？」.
- Difficulty: ok; challenge decimal `49.743：38.689` too heavy; integer challenge `70：490` too easy.
- Proposed changes:
  1. [P2] Add 混合型 and 應用 kinds at challenge; cap decimals at 2 places; require both terms ≥ 2-digit at challenge integer.

### Unit value 求比值
- Variety: 1 kind.
- Difficulty: **advanced/challenge = coprime big numbers** (`123：65→(123)/(65)`, `12.667：11.45→(12667)/(11450)`) — no reduction, meaningless (P1).
- Plausibility: 比值 for decimals should come out as a terminating decimal or simple fraction.
- Proposed changes:
  1. [P1] Generate from answer: pick `v` nice (`(3)/(4)`, `1.5`, `2(1)/(2)`), scale to make `a：b`; decimal mode `0.3：1.2`（比值 0.25）; challenge 「比值是 (2)/(3)，前項 8，後項？」.
  2. [P2] Add 「比值相等的比」 selection kind.

### Unit proportion 比例式求未知數
- Variety: 1 kind (x in any of 4 slots — good).
- Difficulty: basic integer is right (`70：110＝14：x`), but **advanced `1392：3480＝x：1080`, challenge `16119：x＝15721：8058`, decimal `14.0832：14.9688＝31.296：x`, `x：28.0329＝13.578964：23.8826` — absurd** (P1). Fraction basic already hard (`2(3)/(4)：2(2)/(5)＝x：(2)/(5)`).
- Proposed changes:
  1. [P1] Cap `m,n ≤ 12`, `k,t ≤ 12`; decimals ≤ 1 place; fraction denominators ≤ 10, one fraction per side.
  2. [P1] Add 正比應用 kind at advanced/challenge: 「3 瓶果汁 120 元，7 瓶？」「地圖 2 cm 代表 5 km，7 cm？」「果汁和水 2：5，果汁 300 mL 要加水多少？」.

### Unit convert 百分率與分數小數互換
- Variety: 3 kinds mapped to modes (小數→%, %→分數, %→小數). Missing 分數→% (`(3)/(8)＝37.5%`), 3-place decimals (`0.125＝12.5%`), 成數 (`七成＝70%`), 比較.
- Difficulty: **flat** (same `rand(1,175)` / `rand(1,99)` at every level).
- Proposed changes:
  1. [P1] Gate: basic %↔小數 with whole %, advanced 分數↔% including `(5)/(8)`, `(1)/(3)≒33.3%`, challenge `0.6%`, `125%`, 成數 and 3-way 比較 (`45%、(2)/(5)、0.44`).

### Unit percent 百分率運算
- Variety: 1 kind `N 的 p% 是多少` — duplicate of `base`'s first branch.
- Proposed changes:
  1. [P1] Repurpose as 百分率應用題: 「全班 40 人，及格 32 人，及格率？」「原價 500 元打 8 折？」「含糖 12% 的飲料 250 g 有糖幾 g？」「成長率：去年 200 人今年 230 人，增加百分之幾？」 — level-gated.

### Unit base 基準量與比較量
- Variety: 2 kinds (求比較量, 求基準量). **Missing 求比率** (`48 是 240 的百分之幾`), the third leg of the triad (P1). Overlaps the `basecompare` topic.
- Proposed changes:
  1. [P1] Add 求比率 branch; wrap all three in short contexts (「某班 25% 是 10 人，全班？」).
  2. [P3] `110 的 25%＝27.5` in integer mode — fine, but keep integer answers at basic.

---

## Topic: units — 單位換算
- Levels promised: 「基礎：相鄰單位、整數」「進階：跨兩級、含小數與簡單分數」「挑戰：面積與體積的 100／10000 進率、三段複名數、換算後排序」
- Overall: Solid review tool. Fraction/decimal modes are the actual 6年級 content (`1(1)/(4) km＝1250 m`) and work well. Integer mode is flat (`9 km`, `31 km`, `156000 m` are the same skill). Numbers get silly at decimal challenge (`380.45 m＝380450 mm`, `350.981 公秉`). No 應用題.

### Unit length 長度
- Variety: 1 kind. Challenge fraction includes 跨兩級 (`1(3)/(4) km＝175000 cm`) — good.
- Proposed changes:
  1. [P2] Integer challenge → 跨兩級 and 複名數 (`3 km 250 m＝? m`, `0.35 km＝? cm`); cap values to 3 significant digits.
  2. [P3] Add one 應用 (`繞操場 400 m 跑 5 圈是幾 km`).

### Unit weight 重量
- Same pattern; `357.47 公噸＝357470 kg` pointless.
- Proposed changes: 1. [P2] Same caps; add `1 公噸 250 kg＝? kg`, `0.75 kg＝? g`.

### Unit capacity 容量
- `(7)/(10) 公秉＝700000 mL` fine as challenge. 公秉 is rarely used in 6年級 textbooks (康軒 does use it); keep.
- Proposed changes: 1. [P3] Same caps; add 複名數.

### Unit area 面積
- Good coverage of 公畝/公頃/km². Decimal challenge `57.756 公頃＝577560 m²` ok.
- Proposed changes: 1. [P3] Add `m² ↔ cm²` with decimals (`2.5 m²＝? cm²`) at advanced; keep.

### Unit volume 體積與容積
- Covers `cm³＝mL`, `m³＝1000 L`. 公秉 overlaps capacity.
- Proposed changes: 1. [P2] Challenge: 複名數 `1 L 250 mL＝? cm³`, `2 m³ 500 L`.

### Unit compound 複名數化聚
- Good (`8124 mm＝8 m 12 cm 4 mm`). Integer only — fine.
- Proposed changes: Good; no change.

### Unit compare 換算後比大小
- Good (`○` and 排列). Some comparisons trivial (`23 cm ○ 20 m`).
- Proposed changes: 1. [P3] Require the two values to be within a factor of 10 after conversion so students must actually convert.

---

## Topic: area — 周長與面積
- Levels promised: 「基礎：整數，直接代公式」「進階：小數；分辨斜邊與高、鈍角三角形的高；反求高」「挑戰：含分數；反求底或邊；複合圖形；同一三角形另一組底高」
- Overall: Good variety and figures; this is 5年級 content (6年級 adds only circle/複合). Problems: fraction mode produces grotesque numbers (`正方形邊長 9(2)/(5) cm → 88(9)/(25) cm²`, `正方形周長 119 cm → 885(1)/(16)`), the trapezoid 中線 kind is non-standard, and composite's text-only kinds lack figures and are easier at challenge than at basic.

### Unit rectangle 長方形與正方形
- Variety: 5 kinds (周長, 面積, 周長與面積, 正方形周長→面積, 面積反求寬). Good.
- Difficulty: fine in integer/decimal.
- Plausibility: fraction operands should be halves/quarters/fifths with small whole parts; answers like `406(1)/(16)` should be rejected.
- Proposed changes:
  1. [P2] Fraction mode: one fractional side only, denominators {2,4,5}; reject answers with denominator > 10.
  2. [P2] Add 應用: 「用 48 cm 鐵絲圍成長 14 cm 的長方形，面積？」; 「邊長加倍面積變幾倍」 at challenge.

### Unit parallelogram 平行四邊形
- Variety: 4 kinds incl. 斜邊 distractor and 另一組底高 — good.
- Plausibility: impossible/ugly shapes `底 1 cm、斜邊 13 cm、高 9 cm`, `底 2 cm、斜邊 11 cm、高 8 cm`, `面積 0.4 cm²、底 4 cm`; 另一組底高 answers `10(2)/(35)`, `11(53)/(98)`.
- Proposed changes:
  1. [P1] Constraints: `高 < 斜邊 ≤ 2×高`, `底 ≥ 高/2`, 底 ≥ 3; area ≥ 5.
  2. [P2] 另一組底高: choose numbers so the second height is an integer or `.5` (`底 8、高 6；另一底 12 → 高 4`).

### Unit triangle 三角形
- Variety: 直角/一般/鈍角 面積, 反求高, 另一邊上的高 — good.
- Plausibility: `面積 1 cm²、底 1 cm → 高 2`, `面積 5 cm²、底 10 cm → 高 1`, `52.5 cm²` in integer mode; `(15)/(68) cm` answer.
- Proposed changes:
  1. [P2] Minimum sides 3, area ≥ 6; integer mode must keep area integer (make `底×高` even).
  2. [P2] 另一邊上的高 with clean numbers (`底 6 高 8，另一邊 10 → 4.8`).
  3. [P3] Round decimal areas to 2 places (`21.165` → choose operands so product has ≤ 2 places).

### Unit trapezoid 梯形
- Variety: 面積, 反求高, 反求下底, **中線**. The 中線 kind (「求上下底的平均長（中線長）；面積是中線長的幾倍」) is 國中 content and reads as a trick question; it is 1/3 of every level (P1).
- Proposed changes:
  1. [P1] Replace `median` with: basic 「等腰梯形周長」 or 面積 with figure; advanced 「反求上底」; challenge 「梯形分成三角形＋平行四邊形」 or 「上底加 2 cm 面積多多少」.
  2. [P2] Fraction/decimal number caps as rectangle.

### Unit composite 複合圖形
- Variety: L形[圖], 切角三角形 (text), 挖空長方形 (text), 兩長方形並排 (text; challenge only).
- Difficulty: **inverted** — challenge 「兩長方形並排，總面積及相差」 is a plain sum/difference, easier than basic L形.
- Plausibility: mode is ignored (fraction mode prints integers) — fine but then hide mode selector for this unit.
- Proposed changes:
  1. [P1] Give every kind a figure (切角, 挖空) — text-only composite is not a 複合圖形 question.
  2. [P1] Challenge kinds: 「長方形內的三角形陰影」, 「平行四邊形＋三角形」, 「梯形中挖去三角形」, 「十字形/凹形 with 3 cuts」, 「等高三角形面積關係」; drop 並排.
  3. [P3] Hide fraction/decimal for this unit or feed decimal lengths at challenge only.

---

## Topic: circle — 圓周長與圓面積
- Levels promised: 「基礎：由半徑或直徑求…半圓與四分之一圓、正方形內接圓與環形」「進階：反求半徑…弧長與周長分開問、跑道形；半徑可為 x.5」「挑戰：反求直徑、半徑倍數與面積倍數、四分之三圓、正方形內四分之一圓的陰影」
- Overall: The best-designed geometry topic; matches its `levels` text. Two issues: **fraction mode = answers in π** (國一 notation; 國小 uses 3 or 3.14 only) — label it 「國中先修」 or replace with 「圓周率取 22/7」; and 扇形 with 圓心角 (a 6年級 108課綱 item) is missing. Text-only kinds (跑道, 正方形內四分之一圓, 兩半圓) need figures.

### Unit circumference 圓周長
- Variety: 求周長(半徑/直徑), 半圓弧, 反求半徑/直徑. Good.
- Proposed changes:
  1. [P2] Add 應用: 「車輪直徑 60 cm，轉 50 圈前進幾公尺？」; 「半徑加 1 cm 周長增加多少？」 at challenge.

### Unit area 圓面積
- Variety: 面積, 反求半徑, 倍數. Good.
- Proposed changes:
  1. [P3] Advanced decimal `半徑 10.5 → 346.185`: restrict `.5` radii so area ends in ≤ 2 places (e.g. only with π≈3) or accept 3 places.

### Unit sector 半圓、四分之一圓與扇形
- Variety: 半圓/四分之一/四分之三 周長・弧長・面積. Good.
- Proposed changes:
  1. [P1] Add 圓心角 kind (advanced/challenge): 「半徑 6 cm、圓心角 120° 的扇形，求弧長與面積」; 「扇形面積是圓的 (1)/(6)，圓心角幾度？」.
  2. [P3] Fraction-mode answers `(9)/(2)π＋18` are 國中 form; see topic note.

### Unit composite 圓的複合圖形
- Variety: 環形, 正方形−內接圓, 兩半圓, 跑道, 正方形內四分之一圓. Good.
- Proposed changes:
  1. [P2] Figures for 跑道 / 四分之一圓 / 兩半圓 (currently text).
  2. [P2] Add classic shaded shapes: 「正方形內兩個四分之一圓重疊的葉形」, 「正方形減 4 個四分之一圓」, 「半圓＋直角三角形」.
  3. [P3] Reject tiny cases (`邊長 2 cm → 1 cm²`).

---

## Topic: volume — 體積與表面積
- Levels promised: long and specific (小正方體堆疊…連比求長寬高、圓柱反求高).
- Overall: Excellent variety; the units deliver what `levels` promises. Issues are only number hygiene in fraction mode and missing figures for text kinds.

### Unit cuboid 長方體與正方體的體積
- Variety: 6 kinds. Good.
- Plausibility: fraction basic `正方體邊長 3(3)/(4) → 52(47)/(64) cm³`, challenge `36 × 21(1)/(2) × 35(3)/(4)` — absurd (P1 for fraction mode).
- Proposed changes:
  1. [P1] Fraction mode: at most one fractional dimension with denominator {2,3,4}; 正方體 fractional edge only `x(1)/(2)`; answer denominator ≤ 8.
  2. [P3] Cap integer volumes at 5 digits at challenge.

### Unit surface 長方體與正方體的表面積
- Variety: 6 kinds (表面積, 最大面, 無蓋盒, 切割增加, 黏合, 反求邊長). Good; no change beyond fraction caps.
- Proposed changes: 1. [P2] Same fraction caps. 2. [P3] Add 展開圖 figure kind if SVG budget allows.

### Unit prism 柱體的體積
- Variety: 三角柱, 梯形柱, 圓柱, 底面積×高, 水管, 半圓柱. Good.
- Proposed changes: 1. [P3] Fraction challenge `梯形柱 … 4266(1)/(2)` cap; 2. [P3] Add 「平行四邊形柱」 and 「水位上升 (排水法)」 cross-link is already in capacity — fine.

### Unit composite 複合形體的體積
- Variety: 疊放 (text), L形 [圖], 挖角 (text), 通道 (text), 階梯 (text). 
- Proposed changes:
  1. [P2] Figures for 疊放/挖角/通道/階梯; 階梯 wording 「階梯左右長 1(1)/(2) cm」 is unrealistic — make 階梯 integer-only.
  2. [P3] Hide fraction mode for this unit.

### Unit capacity 容積與體積換算
- Variety: 水量, 倒水求水深, 容積→L, 石頭排水, 木箱厚度, 甲乙缸, 鐵塊上升. Excellent.
- Proposed changes: 1. [P3] `41173.6 cm³＝41.1736 L` → keep dimensions so L has ≤ 3 decimals. Otherwise good; no change.

### Unit reverse 已知體積反求邊長或高
- Variety: 5 kinds incl. 比 and 圓柱. Good.
- Proposed changes: 1. [P3] Fraction cube roots only `(8)/(27)`, `(1)/(8)` type (not `18(26)/(27)`). Otherwise good.

---

## Topic: speed — 速率
- Levels promised: 「基礎：單一步驟…」「進階：先換單位…中途休息；相遇地點、先出發後追」「挑戰：兩段路程、時刻計算、三種單位比快慢；來回平均速率；環形跑道」
- Overall: Best topic on the page; ladder and kinds match the promise. Only number hygiene and context variety to fix.

### Unit findv 求速率
- Variety: 3 contexts basic, unit-change advanced, 比較 and 複名數 challenge. Good.
- Proposed changes: 1. [P3] Fraction mode ≈ integer mode (one fractional item in 8); either add `2(1)/(2) 小時` consistently or hide. 2. [P3] Vary subjects (捷運、腳踏車、高鐵) and realistic speeds (遙控車 90 km/h is odd).

### Unit findd 求距離
- Good; challenge 分段 and 起訖時刻 are textbook-standard.
- Proposed changes: 1. [P3] Fraction challenge answer `193(7)/(15) 公里` → design for integer km.

### Unit findt 求時間
- Good (答案 幾小時幾分, 最晚出發, 耽擱).
- Proposed changes: Good; no change.

### Unit convert 速率單位換算
- Good, including 3-way ordering at challenge.
- Proposed changes: 1. [P3] Challenge answers quoting `24(4)/(5) 公尺/秒` — compare in 分速 instead to keep integers.

### Unit average 平均速率
- Good; challenge 來回平均 with the 「不是 27」 note is exactly right.
- Plausibility: basic fraction `甲地到乙地 6 公里，去程 2(1)/(2) 小時 → 2(26)/(47) 公里/時`, advanced `15(9)/(41)` — ugly and unrealistic (P2).
- Proposed changes: 1. [P2] Build 來回 items from total time dividing distance×2 evenly; fraction hours only `.5/.25` with distances that divide.

### Unit meet 相遇與追趕
- Variety: 相向相遇, 反向相距, 同向追趕, 相遇時各行, 尚未相遇, 先出發追趕, 環形同向/反向. Excellent; 環形 is 資優/國中-level but fine for challenge.
- Proposed changes: 1. [P2] Reject non-terminating answers (`771(3)/(7) 公尺`, `1(7)/(43) 分鐘`) — require integer or `.5` minutes. 2. [P3] `乙先出發 18 分鐘… 甲出發後 180 分鐘 19800 公尺` — cap walking distances at 5 km.

---

## Topic: basecompare — 基準量與比較量
- Levels promised: 「基礎：指出基準量…雙數線…和倍差倍…加成與折扣」「進階：還剩幾分之幾、男生女生、竹竿…」「挑戰：某數加減後的倍數、年齡…由原價與售價求加幾成」
- Overall: Strong, textbook-faithful (康軒 style 「6 公尺當作 1」). Overlaps `ratio/base`. Main gap: 打折 wording is absent from `discount`, and contexts repeat (水桶/雨量/繩/蘋果梨).

### Unit identify 基準量、比較量與比值
- Variety: 5 kinds. Good.
- Proposed changes: 1. [P3] Rotate more contexts (身高、票價、閱讀時間) and avoid 8 near-identical 「甲數是 4，乙數是 16」 in one set.

### Unit numline 雙數線填空
- Variety: figure-based, 含 1 / 不含 1 / 單位. Good.
- Proposed changes: 1. [P2] Fraction challenge numbers (`倍數 2(3)/(4) 對應 10(5)/(16) 公尺`) → keep 1 倍量 integer or `.5`, multiples with denominator ≤ 4.

### Unit arcline 線段圖求全部或部分
- Figure-dependent; question text alone is uniform (「求整條線段上方括號的量」). Cannot judge figure from text; answers are clean integers/decimals.
- Proposed changes: 1. [P3] Add a one-line context to each (「小明有 ___ 元，小華是他的 2(1)/(2) 倍」) so the item is self-explanatory when the figure is small.

### Unit findbase 已知比較量求基準量
- Variety: 大小二數, 牛奶, 布還剩, 竹竿, 男生女生, 某數加減, 年齡. Good; no integer mode (correct).
- Proposed changes: Good; no change (P3: `某數加上 612，和是某數的 2.7` → smaller numbers).

### Unit sumdiff 和倍、差倍與應用
- Variety: 和倍/差倍/周長/價錢/雞鴨/各減同數/給錢. Good.
- Proposed changes: 1. [P3] Decimal basic `牧場有牛 2600 頭，羊是牛的 2.9 倍` unrealistic — cap at 500 and use ratios like 1.5/2.5.

### Unit discount 加成與折扣
- Variety: 求售價, 求原價, 多多少, 求加幾成/少百分之幾, 便宜多少. Good.
- Missing: **「打八折」/「打幾折」** — the dominant Taiwanese phrasing (P1); also 「降價 20%」 and 「原價 → 先加成再打折」 at challenge.
- Proposed changes:
  1. [P1] Add 打折 kind at every level: 「原價 800 元打八折，售價？」「原價 1200 元特價 900 元，是打幾折？」「打七五折後 450 元，原價？」.
  2. [P2] Challenge: 「加二成後再打九折，比原價多幾 %？」.

---

## Topic: scale — 放大、縮小與比例尺
- Levels promised: matches content (放大縮小、1：N 互換、求比例尺、面積、比較地圖、走路時間).
- Overall: Good, realistic contexts. Notation `5 分之 1` (text) should render as a fraction. Missing 格子圖 drawing items (inherent to print; skip) and 面積倍數 after enlargement.

### Unit enlarge 放大與縮小
- Variety: 邊長, 角度不變, 縮小, 倍數反求, 先放後縮, 周長. Good.
- Proposed changes: 1. [P2] Add 面積 kind at challenge: 「放大 3 倍後面積是原來幾倍？」(9 倍). 2. [P3] Render `原來的 (1)/(5)` as fraction.

### Unit notation 比例尺的表示
- Good. 1. [P2] Add 分數形式 (`(1)/(1000)`) and 線段比例尺 (「0—1—2 km 每段 1 cm」) conversions.

### Unit toreal / tomap / findscale
- Good; numbers realistic (`1：250000`, `8.75 公里`). No change (P3: `findscale` basic `12.5 公尺 模型 25 公分 → 1：50` is a 放大 scale, fine but label it).

### Unit scalemix 比例尺綜合應用
- Good (面積, 兩張地圖互換, 走路時間, 由面積反求). No change.

---

## Topic: pattern — 規律與怎樣解題
- Levels promised: detailed and matched.
- Overall: Good. `sequence` only covers 等差; 108課綱 6年級 規律 also uses 圖形點數規律 and 乘法規律. `sticks`/`trees`/`cycle`/`sumdiff`/`average` are well-built.

### Unit sequence 數列規律
- Variety: 第 n 個, 填空, 第幾個, 相差, 第幾個超過. All 等差.
- Proposed changes: 1. [P2] Add 等比 (`1、2、4、8…` 第 8 個), 平方數/三角形數 (`1、4、9、16`), 交錯兩規律 (`2、5、4、7、6、9…`), and 圖形規律 with [圖] (「第 n 個圖形有幾個點」).

### Unit sticks 圖形排列
- Good (火柴棒, 方桌/長桌 併排, 反求). No change.

### Unit trees 植樹問題
- Good (四種情況, 反求間隔/長度, 兩邊). 1. [P3] Add 「路燈之間種樹」 (promised in levels text, not seen in samples).

### Unit cycle 週期問題
- Good. 1. [P3] Add 「2025 年 1 月 1 日星期三，3 月 1 日星期幾」 (month lengths) at challenge.

### Unit sumdiff 和差問題
- Good (incl. 三人, 給錢後相等, 倍數加餘數). No change.

### Unit average 平均數問題
- Good. 1. [P3] Add 「兩組合併平均」 (promised in levels, not sampled).

---

## Topic: charts — 統計圖與可能性
- Levels promised: matched.
- Overall: Good. Pie units are text-only (no pie [圖]) — acceptable but a small pie SVG at basic would help. Line chart kinds are fine. One generator bug in `compare`.

### Unit pieangle 圓形圖的百分率與圓心角
- Good variety (互換, 其他, 合計, 相差). 1. [P3] Render `4 分之 1` as fraction.

### Unit piecount 由圓形圖求數量
- Good (求部分, 求全部, 求百分率, 由圓心角求人數, 其他). No change.

### Unit linechart 折線圖報讀
- Good (讀值, 相差, 變化最大, 合計). 1. [P3] Unit 「百元」 on an axis is awkward; use 「元」 with values ×100 or 「千元」.

### Unit certainty 一定、可能、不可能
- Good. 1. [P3] Samples never produce 「一定」 (all 可能/不可能 in 24 items) — ensure each set has ≥ 1 「一定」 (e.g. 「抽到的數小於 10」 with 1～9).

### Unit compare 比較可能性的大小
- **Bug**: spinner kind picks two colours from `COLORS` which includes 白, then says 「其餘 N 格是白色」 → 「1 格塗白色、6 格塗藍色，其餘 3 格是白色」 (P1). Fix: exclude 白 from the two painted colours (or say 其餘沒有塗色).
- Otherwise good (骰子兩事件, 補球).
- Proposed changes: 1. [P1] Fix the colour collision. 2. [P3] Add 「兩個轉盤哪一個比較容易停在紅色」 (different total sectors) at challenge.

---

## Cross-cutting implementation notes
1. `numberFor(mode,level,max)`: add hard caps per level (integer digits, decimal places, fraction denominators) and a `niceAnswer(v)` filter (denominator ≤ 12, ≤ 2 decimal places) used by every computation unit.
2. Pass `{mixed:ctx.mixed}` in `four`, `simplify.*`, `unknown.*` operand rendering so 帶分數 is consistent page-wide.
3. Units whose generator ignores `ctx.level` (time add/sub/mul/div, arithmetic muldiv integer, gcd lcm, ratio convert) should read the level; units whose generator ignores `mode` (time convert/add/sub/mul/div, area composite, volume composite) should hide the mode selector.
4. Add a 「國中先修」 flag for: gcd 指數/括號 notation, circle/prism π answers, unknown `3x` notation; default off for 6年級 print.
