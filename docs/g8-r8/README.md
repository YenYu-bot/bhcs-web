# g8 引擎 r8：加入因式分解（`factor`，移植自舊工具） — Claude

累積交付：r8 ＝ r7＋ `factor`。取代 r7；`docs/g8-r1/`～`docs/g8-r7/` 保留。改動只有三處：插入 `factorConfig()`；`TOPICS`（排在 polyops 之後）、`CONFIGS` 各加一項。

## 內容
`factor` 因式分解，由舊的 `tools/math/g8-factorization.html` 移植：二元多項式、因式乘積展開、「先定因式再展開」的造題法與十四個單元（因式／倍式判定、提出單項公因式、提出共同括號、分組分解、和的完全平方、差的完全平方、平方差公式、首一與非首一二次三項式、先提公因式再分解、代換型、配方法、分項拆項、二元雙十字交乘）照舊，只換成引擎的難度／數型介面。
引擎版加的問法（舊工具的公式題只有一種寫法，結構數不足）：同一式子也會把各項倒過來排列；挑戰級加「已知其中一個因式，求另一個因式」；因式判定加「是否為倍式」與「若 L 是 P＋m 的因式，求 m」。數型：整數、分數、小數（分數、小數模式的式子前面有分數或小數的公因數）。作答列前綴「答：」。

## 驗證
- `math_local_check.mjs factor 200` 多次重跑：PASS；r7 十個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：factorCheck 26/33/53、commonMonomial 16/27/25、commonBracket 48/43/62、grouping 14/9/29、squareSum 4/4/13、squareDiff 4/4/12、differenceSquares 4/4/11、monicTrinomial 20/20/54、nonmonicTrinomial 11/11/35、gcfThen 40/37/62、substitution 24/24/57、completing 16/16/39、splitTerms 16/12/36、multivariable 74/59/122；挑戰級都有新結構。
- 列印：18 種組合無溢出。
- verify 另一條路：在 (1.37, −0.61)、(−2.13, 0.83) 把答案的每個因式分別用浮點數求值再相乘，與題目多項式的值比對；判定題用餘式定理代入求值。

## 給 ChatGPT
- 用 r8 更新 g8-drills.html，加 `docs/g8-r8/`；國二區加卡片「因式分解」`?topic=factor`，放在「多項式四則」之後。
- 舊檔 `g8-factorization.html` 比照 A 類：保留、頁首加連結、卡片改指向 `?topic=factor`、移除重複卡片；整合守衛與 P1 快照清單同步。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
