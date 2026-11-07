# 數學題庫改版：交接狀態（2026-11-07）

## 已完成
- 第一階段：PR #210，已合併。
- 第二階段：PR #213，已合併（merge 2865280）。
  - 每個單元依等級分題型，加上數字上限，數字模式改成真的有作用。
  - 經過兩輪獨立複查，約 4,200 題重算過，沒有錯誤答案。
- 第三階段：PR #216，草稿、CI 全綠、等擁有者同意合併。分支 feat/math-phase3，單一 commit 47ed6c0。
  - 函數改列在國二，用選單跨檔連結，網址不變。
  - 高一下 11 主題列進 g10 高一頁選單（分高一上／高一下兩組）。
  - 超綱內容只放挑戰，並標「（補充）」。
  - g6 新增「國中先修寫法」開關，預設不勾。
- PR #215：修 main CI 的 ENOBUFS（g11 檔超過 1 MiB，git maxBuffer 不夠）。等同意。#216 已含同一修正。

## 已知未做（見 round3/ 與 PR #216 說明）
- g11 頁外框（選單分組、標題）沒改：g11-p4-* 回歸測試鎖住 config 以外的程式。
- ziyuan.html 的「函數」還在國一列：被 science desk 整合測試（public_desk_entry_contract.mjs、solubility、specific-heat）鎖住。
- 各複查回報、但不在修正清單上的少量跨級重複：
  - g9：二次函數、四分位、盒狀圖、立體。
  - g10：absolute、amgm、line、linecircle 等。
  - g11：約 88 個單元。
- g2「比大小」：挑戰（802 ○ 820）比基礎（三數排序）簡單。
- 下一步依規劃書：第四階段（補題型，問題 G）、第五階段（情境與用語，問題 I、J、P3）。

## 工具（路徑寫死 /home/claude/bhcs-web，換環境請改）
- tools/audit.mjs、tools/auditall2.mjs：CI 同款抽卷檢查，必須無輸出（auditall2 只印 "audit done"）。
- scripts/math_local_check.mjs --all 40：40 題卷不得耗盡。
- tools/divgate.mjs：CI 結構門檻。非 g11 的單元，每個等級在 200 題抽樣中至少 3 種結構，挑戰至少 1 種基礎沒有的結構。
- tools/pool.mjs：看題庫大小。
- tools/sample.mjs：抽題。
- tools/dump.mjs：全量抽樣。
- tools/review_sample.mjs：給擁有者看的抽樣表。
- tools/manifest.py：更新 scripts/approved-existing-tool-changes.json。只能放 tools/ 與 assets/ 下的檔案。
- tools/shims/：沒有網路時本機用的 jsdom 與 acorn 替代品。放到 scripts/node_modules/ 才能跑回歸測試，不要 commit。完整 jsdom 的測試以 CI 為準。
