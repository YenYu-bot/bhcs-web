# 溶解度與濃度實驗桌：獨立新頁 Draft

## 範圍

新增 `tools/solubility-desk/`；保留舊版 `tools/science/solubility.html` 與全部教材目錄、資源入口、生成器和舊資料。新頁設 self-canonical 與 `noindex,nofollow`，不加入 sitemap。未列目錄及 noindex 不是私人存取控制。

本次已獲准上傳公開程式、圖片與測試、建立 Draft PR 和執行 CI。沒有 Ready、合併或部署授權。GitHub Pages 從 main 發佈，合併要另外決定。

接受的來源版本：`7fde9da751162134f103c8a68f7987ca0585b41f`。
整合基準：`61eebcb86b43e1423c3bd1f7831502902fed124b`。
`scripts/solubility-desk-runtime.json` 記錄九個正式執行檔與三個原始測試的 SHA-256。執行碼與視覺保留；HTML 僅新增公開新頁 metadata、資料來源說明並修正私人試作字樣。測試只調整 import 路徑。另增官網整合與瀏覽器回歸。

## 科學與學生流程

使用虛構教學溶質 A，不能當作真實鹽或糖的數據。這是理想平衡狀態，不模擬速率、蒸發或過飽和。S = 20 + 0.5T g／100 g 水；容量為 S × 水／100，已溶解量是容量與 A 總量的較小者。杯底固體不計入溶液質量與濃度分母。

五步沿用同一份 50 g A：
- 20°C、100 g 水：已溶 30 g、固體 20 g、23.1%。
- 60°C：已溶 50 g、固體 0 g、33.3%，恰好飽和。
- 冷卻至 20°C：回到 30／20 g 與 23.1%。
- 加 20 g 水：已溶 36 g、固體 14 g、23.1%。
- 再加 80 g 水：已溶 50 g、固體 0 g、20%，未飽和。

可自由調整、復原、記錄八杯。舊版仍有 A/B、筆記、50 筆記錄、列印與測驗，所以本次不是等功能替換。

## 保存與舊站隔離

新頁只使用 `baihong-solubility-lab-v1`。私人 Site 與官網 origin 不同，紀錄不會自動移入。新頁不讀寫舊版 localStorage 鍵 `bhcs-science-v2-solubility`、`bhcs-science-v2-solubility-draft`、`bhcs-science-v2-solubility-guide` 或研究員 sessionStorage 鍵 `bhcs-researcher-screen:/tools/science/solubility.html`。

可讀有效資料保留；損毀、未知版本或未知欄位保持原始 bytes 並只讀保護。拒絕讀寫、額度不足與衝突會如實告知。重設預設保留記錄，必須另勾選才清除本頁記錄。localStorage 比對及 storage 事件是盡力避免過期快照覆蓋，不是原子交易保證。

## 圖片來源

直接使用此 repo 既有 `tools/specific-heat-desk/assets/` 的三個檔案，SHA-256 完全相同，沒有重新生成角色：
- `teacher-body-v3.png`：2851a4bdd0a6523fad5db15c8a197c17ac191bd70000c051513b5e317589f23b
- `lab-room.png`：668301e8733e21ac2e4e50bf6de2a33c09536d242ee683519ddf0cb06ca5eb22
- `wood-table.png`：890a533828d0d0cee223b66f403e22f2a0f3da58127274182d8

余老師原始來源與尺寸可查 `tools/specific-heat-desk/assets/teacher-body-v3.provenance.json`。新頁維持圖片比例，杯子與儀器為頁內 SVG。

## 驗證方式

- `npm run test:solubility-desk --prefix scripts`：接受來源 hash、舊工具／資產隔離、metadata、模型 3,069,981 組整數控制值、保存與格式回歸。
- README 的完整建置鏈及 sitemap 後，產出應無差異；新頁不應出現在目錄／資源頁／sitemap。
- `npm test --prefix scripts`、資源檢查、研究站整合及 batches 1–5。
- CI 的 `solubility` job 執行 `scripts/check_solubility_desk_browser.cjs`。產生桌面、手機視窗及故障情境結果／截圖，儲存在 `solubility-desk-review` artifact。
- 新增 job 被納入 CI Gate；原有九類工作不移除、不略過。

原型先前已實際測過桌面與縮放窄視窗、鍵盤、主線、重設、儲存故障及跨分頁。CI 的 Playwright 手機 viewport／觸控仍是 Chromium 模擬，不代表 iOS Safari／Android 真機或螢幕閱讀器驗收。以 PR 最新 head 的實際 CI 結果為準，不以舊版結果代替。
