# CI diversity gate failures (must fix)
CI rule (scripts/test_math_drills.mjs): for every unit NOT in g11, each level (basic/advanced/challenge) must show >= 3 distinct question structures in 200 samples (all the unit's modes mixed; structure = visible text with every number replaced by #), and challenge must contain at least one structure not present at basic. Check with: `cd /home/claude/tools && node divgate.mjs <file-prefix e.g. g8-drills>` — prints units still below 3 (prints nothing for passing units; add `all` as 2nd arg to print every unit).
Failing units (level counts now):
- g7 exponent/compare {basic:2,advanced:2,challenge:3}; g7 exponent/smart {3,2,4}; g7 symmetry/property {3,3,2}
- g8 quadapps/number {3,4,2}; quadapps/count {3,4,2}; quadapps/right {4,6,2}; congruence/apply {3,2,6}; congruence/rhs {3,7,2}; congruence/congmeasure {2,2,7}; bisectors/perpbis {6,2,3}; bisectors/isoangle {3,6,2}; bisectors/bisangle {3,2,2}; parallel/names {4,2,2}; parallel/judge {2,2,4}; parallel/zigzag {2,2,9}
- g9 parallelratio/judge {3,2,2}; righttri/shortest {4,4,2}; circle2/cyclic {3,3,2}
Fix by adding genuinely different wordings/forms of the SAME level's kind (e.g. ask for a different quantity, give a different pair of knowns, different figure labelling), not by moving kinds between levels — the ladder (basic<advanced<challenge in kind) must stay.
Other units divgate prints (g3 timestables/*, g6 gcd/*, g6 ratio/percent|base, g10 amgm/means) are already accepted by CI — ignore them.
