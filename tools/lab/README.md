# tools/lab/ 新版實驗桌（試用）

2026-11 起的新版自然實驗頁。共用規範：器材是主角、余老師一次說一句、直接操作器材、每一下都有反應、證據一鍵收下、全站一套余老師與樣式。

- `shared/lab.css`、`shared/lab.js`：共用顏色、元件（余老師泡泡、任務進度、證據卡、彈簧動畫、本機保存）。
- `lever/`：槓桿實驗桌試用版。科學計算直接匯入 `tools/lever-desk/model.mjs`，不另寫模型。紀錄存在 `bhcs.lab.lever.v1`，與舊版各站紀錄分開。

試用期間頁面設為 `noindex`，不列入研究站目錄、學習資源頁與 sitemap；原有各站不受影響。學生試用沒問題後，再把其他站改成同一套。

素材沿用 `assets/science/props/`（木板、支點、砝碼、實驗桌背景）與 `tools/mini-lab/img/doc-*.png`（余老師）。依專案原則不使用 `<img>`：場景圖用 SVG `<image>`，余老師用 CSS 背景。
