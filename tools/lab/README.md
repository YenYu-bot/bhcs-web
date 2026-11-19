# tools/lab/ 新版實驗桌（試用）

2026-11 起的新版自然實驗頁。共用規範：器材是主角、余老師一次說一句、直接操作器材、每一下都有反應、證據一鍵收下、全站一套余老師與樣式。

- `shared/lab.css`、`shared/lab.js`：共用顏色、元件（余老師泡泡、任務進度、證據卡、彈簧動畫）。
- `lever/`、`pulley/`、`incline/`、`buoyancy/`、`heat/`、`solubility/`、`metal/`：各實驗桌。heat 的溫度直接用 `tools/specific-heat-desk/model.mjs`；solubility 用 `tools/solubility-desk/model.mjs`；metal 用 `tools/metal-activity-desk/inquiry.mjs`、`acid.mjs`。
- `lever/`：槓桿實驗桌試用版。科學計算直接匯入 `tools/lever-desk/model.mjs`，不另寫模型。紀錄存在 `bhcs.lab.lever.v1`，與舊版各站紀錄分開。

- `motion/`：小車運動圖實驗桌。主流程匯入 `tools/motion-graphs-desk/model.mjs`，讀圖挑戰匯入 `tools/motion-graphs-desk/v2/model.mjs`。紀錄使用新版專用的 `bhcs.lab.motion.v1`。

- `reaction-rate/`：反應速率實驗桌。同質量塊狀、顆粒與粉末只改顆粒大小，沿用 `tools/science/reaction-rate-desk/model.mjs`，時間與體積都是模擬值。新版紀錄使用獨立的 `bhcs-lab-reaction-rate-trial-v1`。

- `electric-power/`：電流熱效應實驗桌。與 `scripts/science/models.mjs` 的電功率、電能與水溫模型交叉驗證；固定電壓／固定電流的電壓、電流、功率與溫升對照，另有獨立電表。試用版使用獨立紀錄。

- `spring-friction/`：彈簧與摩擦實驗桌（2026-11-18 改為新版實驗桌設計）。七步：掛砝碼、掛太多、拉不動、開始滑、加重、翻面、說說看。`model.mjs` 的算式同 `scripts/science/models.mjs`，只把 g 改成 10（1 公斤重 ＝ 10 N）；`scripts/lab_spring_friction_model.test.mjs` 逐一比對。紀錄用 `shared/notebook.mjs` 的 `bhcs.lab.spring-friction.v1`，不匯入舊試用版紀錄。

- `neutralization/`：酸鹼中和實驗桌（2026-11-18 改為新版實驗桌設計）。六步：量酸液、加鹼液、中和點、濃度減半、算一算（aM₁V₁＝bM₂V₂，鹽酸與硫酸）、說說看。pH、過量離子與酚酞顏色直接用 `scripts/science/models.mjs` 的 `calculate('neutralization')`。紀錄用 `shared/notebook.mjs` 的 `bhcs.lab.neutralization.v1`。

- `mirror/`：面鏡成像實驗桌（2026-11-18 改為新版實驗桌設計）。五步：平面鏡（30→20 cm）、凸面鏡、凹面鏡用光屏接實像、凹面鏡物距（20／15／10／6 cm）、說說看。像距與倍率用 `scripts/science/models.mjs` 的 `calculate('optics')`（理想公式與透鏡相同；凹面鏡 f>0、凸面鏡 f<0）。紀錄用 `shared/notebook.mjs` 的 `bhcs.lab.mirror.v1`。

- `lens/`：透鏡成像實驗桌（2026-11-18 改為新版實驗桌設計）。六步：光屏找像（30 cm）、物體靠近（15 cm）、焦點上、焦點內（5 cm，用眼睛看）、凹透鏡、說說看。像距與倍率用 `scripts/science/models.mjs` 的 `calculate('optics')`。紀錄用 `shared/notebook.mjs` 的 `bhcs.lab.lens.v1`。

- `pressure/`：水壓與氣壓實驗桌。三個任務：托里切利氣壓計（平地 101.3 kPa／高山 80 kPa）、拖動水下探頭比較 0／1／2 m 水壓、推針筒把密閉空氣壓縮到 0.75／0.50 L。g ＝ 10，1 大氣壓 ＝ 76 cm 水銀柱 ≈ 101.3 kPa；數字在 `model.mjs`，由 `scripts/lab_pressure_model.test.mjs` 驗證。

- `reflection-refraction/`：光的反射與折射實驗桌。點雷射筆開燈並拖動入射角，從法線量角，依序完成平面鏡反射、空氣→玻璃／水折射、玻璃→空氣與全反射（臨界角 ≈ 41.8°）；角度由 `scripts/science/models.mjs` 計算。

小車運動圖、反應速率、電流熱效應、彈簧與摩擦、酸鹼中和、面鏡、透鏡、水壓與氣壓、光的反射與折射已列入研究站目錄與學習資源頁。舊版自由探究與紀錄仍從原網址存取；不自動移轉紀錄。其他試用實驗桌維持原樣。這些實驗桌維持 `noindex`，不新增進 sitemap。

素材沿用 `assets/science/props/`（木板、支點、砝碼、實驗桌背景）與 `tools/mini-lab/img/doc-*.png`（余老師）。依專案原則不使用 `<img>`：場景圖用 SVG `<image>`，余老師用 CSS 背景。

## 研究紀錄：更新與保全

槓桿、滑輪、斜面、浮力、比熱、溶解度、金屬活動性、小車運動圖、反應速率、電流熱效應和彈簧與摩擦使用 `shared/notebook.mjs`。首次從原本各站的本機紀錄讀入，不刪除或改寫該舊資料；新版紀錄仍只在目前瀏覽器，用各站獨立的鍵值存於 IndexedDB，不會上傳。新版的「清空紀錄」重設該站在新版的進度，不清除其他實驗，也不移除舊程式的備份；已重設的新版不會再匯入備份。

同時開兩個新版分頁時，較舊分頁不覆蓋更新的紀錄。若無法儲存、研究紀錄已在別頁更新，或清空失敗，頁面顯示警示；先記下這個分頁的觀察再重新整理。這不是分頁同步合併。換版時請先完成舊分頁的操作並記下重要觀察，再關閉舊分頁、重新開啟新版；第一次匯入之後，舊程式新增的紀錄不會自動同步到新版。
