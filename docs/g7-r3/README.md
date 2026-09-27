# g7 引擎 r3：加入正負數四則運算（`signed`，移植自舊工具） — Claude

累積交付：r3 ＝ r2（numberline、coordinate、lineeq、statistics）＋ `signed`。取代 r2；`docs/g7-r1/`、`docs/g7-r2/` 保留。改動只有三處：插入 `signedConfig()`；`TOPICS`（排第一，國一上第 1 章）、`CONFIGS` 各加一項。

## 內容
`signed` 正負數四則運算，由舊的 `tools/math/g7-signed-numbers.html` 整個移植：運算式樹、抽數範圍、九個單元的出題邏輯與提示文字都照舊，只把難度、數型、帶分數改成引擎介面。
單元：加法、減法、加減混合、乘法、除法、乘除混合、四則混合（挑戰級三成五的題含 (−k)²、(−k)³）、去多重括號、計算定律。數型：整數、分數、小數；可用帶分數。
與舊工具的差異：舊工具的「含乘方」是勾選框，這裡改為只在挑戰級隨機出現；每列題數由引擎的 2／3／4 設定（舊工具有自動）。

## 驗證
- `math_local_check.mjs signed 200`：PASS，0 例外、0 verify 失敗、0 耗盡；r2 四個 topic 重跑 PASS。
- 結構數（基礎／進階／挑戰）：add 3/10/10、sub 3/10/10、addsub 28/98/156、mul 3/22/22、div 3/10/10、muldiv 21/59/63、four 41/71/91、brackets 44/117/111、laws 39/41/39；挑戰級都有新結構。
- 列印：三難度 × 學用／教用 × 每列 2／3／4 共 18 種組合無溢出。
- verify：整個運算式用浮點數重算（與有理數運算不同路徑）比對。

## 給 ChatGPT
- 用 r3 更新 g7-drills.html，加 `docs/g7-r3/`；國一區加卡片「正負數四則運算」`?topic=signed`，放在國一區最前面。
- 舊檔 `g7-signed-numbers.html` 的九個單元已全部移植，比照 g9 A 類處理：舊檔保留、頁首加「本頁內容已併入 →」連結、資源頁卡片改指向 `?topic=signed`（移除重複卡片）。可與本包同一個 PR。
- 宣告數與 P2 依 builder 重算；P3 新 topic 完整門檻。
