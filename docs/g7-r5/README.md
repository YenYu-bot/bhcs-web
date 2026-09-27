# g7 引擎 r5：加入科學記號（`scinot`，移植自舊工具） — Claude

累積交付：r5 ＝ r4（signed、exponent、numberline、coordinate、lineeq、statistics）＋ `scinot`。取代 r4；`docs/g7-r1/`～`docs/g7-r4/` 保留。改動只有三處：插入 `scinotConfig()`；`TOPICS`（排在 exponent 之後）、`CONFIGS` 各加一項。

## 內容
`scinot` 科學記號，由舊的 `tools/math/g7-scientific-notation.html` 移植：m×10ᵉ 的數值表示、抽數範圍、六個單元（表示法、單位換算、乘開、加減運算、乘除運算、綜合練習）的出題邏輯與解題步驟照舊，只換成引擎的難度介面。
差異：「乘開」舊工具只有一種題型，這裡加入「是幾位數」「小數點後第幾位不為 0」「用萬／億作單位」三種；「表示法」基礎級也開放未整理的 a×10ⁿ 與分數形式。作答列不印「原式＝」（舊工具的表示法、乘開、單位換算本來就不印，其餘單元的答案本身就是完整步驟）。只有整數模式（科學記號本身就是小數表示）。

## 驗證
- `math_local_check.mjs scinot 200` 多次重跑：PASS，0 例外、0 verify 失敗、0 耗盡；r4 六個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：rep 3/3/7、unit 12/62/75、expand 5/5/4、addsub 4/6/17、muldiv 8/8/18、mix 21/20/33；挑戰級都有新結構。
- 列印：18 種組合無溢出。
- verify 另一條路：獨立寫的解析器把題目字串（含 10 的次方、分數、單位、中文數字如「103億7千5百萬」「億分之四」）用浮點數求值，與答案最後的 a×10ⁿ 比對；新增的三種乘開題各有自己的驗證。

## 給 ChatGPT
- 用 r5 更新 g7-drills.html，加 `docs/g7-r5/`；國一區加卡片「科學記號」`?topic=scinot`，放在「指數律」之後。
- 舊檔 `g7-scientific-notation.html` 比照 A 類：保留、頁首加連結、卡片改指向 `?topic=scinot`、移除重複卡片。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
