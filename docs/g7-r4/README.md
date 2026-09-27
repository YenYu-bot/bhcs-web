# g7 引擎 r4：加入指數律（`exponent`，重做自舊工具） — Claude

累積交付：r4 ＝ r3（signed、numberline、coordinate、lineeq、statistics）＋ `exponent`。取代 r3；`docs/g7-r1/`～`docs/g7-r3/` 保留。
改動：插入 `exponentConfig()`；`TOPICS`（排在 signed 之後）、`CONFIGS` 各加一項；作答列前綴改成 `${CFG.answerLabel??"原式＝"}`（與 g8 r5、g3 r1 同機制，其他 topic 輸出不變；exponent 用「答：」）。

## 內容
`exponent` 指數律，依舊工具 `g7-exponent-laws.html` 的十二個單元重做：指數記法與求值、同底數乘除、同指數乘除、乘方的乘方、零次方、混合運算、底數轉換、未知指數、指數大小比較、負數與分數的乘方比較、巧算與綜合應用、乘方的加減。
舊工具有多個單元的數字是固定的（如 4ᵐ×8ⁿ、10ᵃ×100ᵇ×1000ᶜ、三組固定的大小比較、四個固定的巧算數），這裡全部改成參數化，並在每個單元每個難度至少有三種題型；答案寫成 aⁿ 形式並附數值（不超過一千萬時）。數型：整數、分數（分數只用於指數求值、同指數乘除、負分數比較）。
與舊工具的差異：舊工具有「綜合」難度（各單元平均取題），引擎只有三種難度，老師可自行勾單元；舊工具答案一律是數值，這裡大數只給指數形式。

## 驗證
- `math_local_check.mjs exponent 200` 多次重跑：PASS，0 例外、0 verify 失敗、0 耗盡；r3 五個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：power 6/6/9、sameBase 3/3/3、sameExp 5/5/6、powerPower 3/3/3、zero 3/3/3、mixedOps 3/3/3、convert 3/3/3、unknown 3/3/3、compare 3/3/3、negative 5/5/6、smart 3/3/3、sum 3/4/6；挑戰級都有新結構。
- 列印：signed、exponent 兩 topic 共 36 種組合無溢出。
- verify：用 BigInt 直接算原式數值比對（分數題用浮點數）。

## 給 ChatGPT
- 用 r4 更新 g7-drills.html，加 `docs/g7-r4/`；國一區加卡片「指數律」`?topic=exponent`，放在「正負數四則運算」之後。
- 舊檔 `g7-exponent-laws.html` 比照 A 類：保留、頁首加連結、卡片改指向 `?topic=exponent`、移除重複卡片。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
