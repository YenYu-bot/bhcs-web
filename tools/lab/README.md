# tools/lab/ 新版實驗桌（試用）

2026-11 起的新版自然實驗頁。共用規範：器材是主角、余老師一次說一句、直接操作器材、每一下都有反應、證據一鍵收下、全站一套余老師與樣式。

- `shared/lab.css`、`shared/lab.js`：共用顏色、元件（余老師泡泡、任務進度、證據卡、彈簧動畫、本機保存）。
- `lever/`、`pulley/`、`incline/`、`buoyancy/`、`heat/`、`solubility/`、`metal/`：各實驗桌。heat 的溫度直接用 `tools/specific-heat-desk/model.mjs`；solubility 用 `tools/solubility-desk/model.mjs`；metal 用 `tools/metal-activity-desk/inquiry.mjs`、`acid.mjs`。
- `lever/`：槓桿實驗桌試用版。科學計算直接匯入 `tools/lever-desk/model.mjs`，不另寫模型。紀錄存在 `bhcs.lab.lever.v1`，與舊版各站紀錄分開。

- `motion/`：小車運動圖實驗桌。主流程匯入 `tools/motion-graphs-desk/model.mjs`，讀圖挑戰匯入 `tools/motion-graphs-desk/v2/model.mjs`。紀錄使用新版專用的 `bhcs.lab.motion.v1`。

- `reaction-rate/`：反應速率實驗桌。同質量塊狀、顆粒與粉末只改顆粒大小，沿用 `tools/science/reaction-rate-desk/model.mjs`，時間與體積都是模擬值。新版紀錄使用獨立的 `bhcs-lab-reaction-rate-trial-v1`。

- `electric-power/`：電流熱效應實驗桌。與 `scripts/science/models.mjs` 的電功率、電能與水溫模型交叉驗證；固定電壓／固定電流的電壓、電流、功率與溫升對照，另有獨立電表。試用版使用獨立紀錄。

- `spring-friction/`：彈簧與摩擦實驗桌。循序掛砝碼、找靜動摩擦臨界，再固定表面比較正向力，或固定正向力翻面比較接觸面積。以 `scripts/science/models.mjs` 的彈簧和乾摩擦條件交叉驗算；試用版紀錄獨立。

- `neutralization/`：酸鹼中和實驗桌。用虛擬滴定管比較中和點與酚酞變色，再只改鹼液濃度；進階用配平反應式比較 1：1 與 1：2 的完全中和體積。

- `mirror/`：面鏡成像實驗桌。比較平面鏡、凸面鏡及凹面鏡，並以五個物距與光屏觀察焦點內外的成像。

- `lens/`：透鏡成像實驗桌。移動物體與光屏，比較凸透鏡與凹透鏡成像，並觀察漸進對焦與成像倍率。

試用期間頁面設為 `noindex`，不列入研究站目錄、學習資源頁與 sitemap；原有各站不受影響。學生試用沒問題後，再把其他站改成同一套。

素材沿用 `assets/science/props/`（木板、支點、砝碼、實驗桌背景）與 `tools/mini-lab/img/doc-*.png`（余老師）。依專案原則不使用 `<img>`：場景圖用 SVG `<image>`，余老師用 CSS 背景。
