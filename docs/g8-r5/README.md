# g8 引擎 r5：修正 parallel／zigzag 的 P3 結構 — Claude

r5 ＝ r4（quadapps、triineq 及 r3 的六個 topic）＋ 一處修改，取代 r4。`docs/g8-r1/`～`docs/g8-r4/` 保留（r4 的 README 仍是 quadapps 與 triineq 的說明）。

## 原因
#52（g6 r7）的 P3 棘輪顯示 CI 計算結構時會先移除 `<svg>…</svg>`，只看文字。用同樣方式預先檢查 g8 全部八個 topic，只有 `parallel` 的 `zigzag`（折線與平行線）不過：基礎／進階／挑戰各只有 1／2／3 種結構，因為 one、findA、find 三種題型的題幹都只有一句「L₁∥L₂，求 x」，差別全在圖裡。

## 修改
三種題型的題幹改為把已知角寫成文字（圖照舊）：
- 「L₁∥L₂，折線與 L₁ 的夾角為 40°、與 L₂ 的夾角為 35°，求轉折處的 x。」
- 「L₁∥L₂，轉折處的角為 75°、折線與 L₂ 的夾角為 35°，求折線與 L₁ 的夾角 x。」
- 「L₁∥L₂，折線與 L₁ 的夾角為 40°、轉折處的角為 75°，求折線與 L₂ 的夾角 x。」
答案、sig、verify 都沒有動。

## 驗證
- 八個 topic 各跑 200 題 `math_local_check.mjs`：全部 PASS。
- 先去掉 SVG 再算結構（基礎／進階／挑戰，括號為挑戰級新增結構數）：zigzag 由 1/2/3（2）變成 3/3/3（2）；其他七個 topic 每個 unit 都 ≥3，挑戰級都有新結構，數字列在 r4 README 之外的附錄：
  quadapps area 4/4/3（2）number 3/4/4（4）road 3/3/3（2）count 3/3/3（2）money 3/4/5（5）right 4/3/3（3）；
  triineq form 3/10/10（9）range 3/6/5（5）intsides 3/3/52（51）sideangle 4/11/10（10）hinge 3/3/4（4）；
  geoseq、angles、congruence、bisectors、quadrilateral 各 unit 最低 3/3/3（≥2）。
- parallel、triineq、quadapps 三個 topic 的 54 種列印組合無溢出。

## 給 ChatGPT
待辦區的 claude-g8-r4.zip 改存 claude-g8-r5.zip；開 G8 PR 時用 r5，其餘（卡片、宣告數 +8、舊檔互連）照 r4 的指示不變。
