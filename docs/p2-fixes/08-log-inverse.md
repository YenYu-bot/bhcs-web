# P2 修正 08：反函數驗證的浮點消去

`loggraphs/inverse` 的題面、答案與 `gen()` 完全不動，只改 `verify()` 的探針位置。原驗證固定代入 `t=0.2、0.7、1.3`；當水平平移 `h` 很大時，`base^(t-h)` 可能遠小於垂直平移 `k`，先加 `k` 再減 `k` 會丟失有效位數，正確反函數因浮點消去而被拒絕。

新驗證改在 `t=h+offset` 取樣，`offset` 仍是原本的 `0.2、0.7、1.3`，所以被測的指數核心固定在 `base^offset` 的穩定尺度。`H.near` 的絕對容差維持 `1e-9`：這個尺度下運算值約在 1 到 20 之間，雙精度捨入誤差遠小於 `1e-9`；無須放寬到 `1e-6`。題目範圍與答案格式均未改。

`node scripts/math-regressions/log-inverse.mjs`：三難度共 600 次全過，涵蓋五種底數與全部 19 種 `h`，從實際答案核對平移符號，並在定義域內以另一組整數指數點做雙向複合驗算。

完整 P2 基準由 `node scripts/test_math_drills.mjs` 與 `node scripts/classify_math_drills.mjs` 產生；修正前後五題逐字比對另見 `docs/p2-math-validation/SAMPLES-LOG-INVERSE.md`。
