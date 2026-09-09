# 小小研究員虛擬實驗室

純靜態網頁：`index.html` + `img/`。整個資料夾原封不動上傳即可。

- `img/lab-room.jpg`：實驗室背景；`img/doc-*.png`：奇奇博士五個姿勢（wave 打招呼、point 指引、wow 驚訝、thumb 比讚、safety 安全）。
- 圖片缺檔時程式自動退回向量繪圖。
- 進度存在瀏覽器 localStorage；新增關卡在 `EXPERIMENTS` 陣列加物件即可。
- 2026-09-09：加入動態回饋（博士換姿勢淡入、拖曳時目標框亮起、拖對閃綠＋飄分、拖錯抖紅＋卡片飛回、徽章彈出動畫、分數跳動）。特效全在 `fx*` 函式與 `showRewards()`，新增關卡自動套用。
- 2026-09-09：「認識實驗器材」10 → 15 種（新增試管架、玻棒、蒸發皿、鑷子、護目鏡），15 張 `tool-*.png` 換成與 lab-safety 共用的新版貼紙圖。
- 2026-09-09：合併「進入實驗室」國中版為 `lab-safety.html`（與 `index.html` 共用 `img/`，41 張 `tool-*.png`）。入口：右上角「🎓 進階教室」按鈕、實驗室地板右下角門牌；研究手冊會顯示進階教室進度（讀 localStorage `labsafety`）。lab-safety 的 hero 右上與頁尾有「回小小研究員實驗室」。
