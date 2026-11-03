# 大理石與鹽酸：取代原反應速率頁（Draft）

## 範圍與版本

原網址 `https://www.bhcs.com.tw/tools/science/reaction-rate.html` 直接呈現新版，不轉址、不新增第二教材卡。目錄仍60項自然教材，獨立站名單8項不變。

- 初始整合／歷史fixture基準：77adcbba9a7473477c0b04c2f5a64bf9b94fa552。
- 發布前主線更新：57080d3d7568b452c6dfed3226051d5206464588（PR #207），再保留98a61df53396ddca2c7bf8ba401a8fd5450a9cd0（PR #208）的同頁題型多樣化；完整保留新版g6圖形題、原精確blob核准及sitemap日期。原型來源與歷史fixture不重新定基準。
- 私人原型來源：071894387020793ca010ff99ad361c7d6ed9396f，共17檔。
- 本輪使用者要求繼續下一階段並直接取代舊版。此提交為Draft審查，非Ready、合併或正式部署許可。
- 使用者尚未完成真實手機驗收。窄視窗、CDP觸控與真實手機分開列證據。

## 可重現入口

`scripts/build_science.mjs` 仍完整生成原共享課程，再由 `build_marble_replacement.mjs` 明確取代此一頁及其教學規格。其他共享模型、runtime、樣式和站點保持基準bytes。

接受來源的HTML原文保存在 `scripts/marble-acid-desk/accepted-index.html`；`entry-replacements.json` 逐項列出13個可逆差異：公開metadata、官網導航、私人字樣、原網址相對資源路徑，以及舊官網資料備份區與module。其他16個來源檔保持原bytes，位於 `tools/science/reaction-rate-desk/`，該目錄沒有index頁。

目錄原共享script有一行過時的催化劑任務。builder生成目錄專用副本 `assets/researcher-marble-directory.js`，加入來源SHA註記，僅替換唯一反應速率任務字串。來源不唯一即失敗；副本hash隨生成內容變動。只有自然目錄引用副本，其他頁引用原共享script，不靠DOM ready覆蓋或閃現舊文字。

來源manifest與guard檢查完整17檔逆轉、額外唯讀adapter、builder、唯一舊頁精確blob許可、680個其他既有tools/assets blobs、單一入口、HTTP bytes及MIME。原英文/數學新增或修正均保留。

## 原資料保護

新資料鍵 `bhcs.marbleAcidDesk.v1` 和格式不變。舊私人虛構課程 `bhcs.reactionRateDesk.v1` 繼續只讀匯出。

額外官網adapter僅讀四個明確鍵：

- `bhcs-science-v2-reaction-rate`
- `bhcs-science-v2-reaction-rate-draft`
- `bhcs-science-v2-reaction-rate-guide`
- `bhcs-inquiry-v1:/tools/science/reaction-rate.html`

第四鍵是此網址專屬學習筆記，不是跨站資料集合。所有原文字串包成具名備份，從不解析成新模型，也不覆寫或刪除。讀取失敗標示未知，不假稱空白；下載失敗保留資料。新reset只動新鍵。另測舊session畫面位置和其他站鍵不變。

私人Site與官網不同origin，原型紀錄不會自動移入官網。未新增資料匯入功能。

## 科學與互動

科學模型、clock、engine、原存檔driver及動畫與來源一致。0.20g純CaCO₃、50mL 1.0M過量HCl，理想乾氣25°C/101.3kPa終量約48.94mL。縮核時間180/90/18秒為未校準教學參數。氣泡定性，注射筒及V–t圖定量，不數泡換算mL。主線只比較同質量粒徑，無催化劑或100秒任務。

插畫是原型的產生式美術，僅作場景/器材素材，不當作量測證據；數據和動態由模型生成。未帶入使用者截圖、私人紀錄、Sites hosting身份或憑證。

## 測試證據與限制

- 43項新課程原測試完整可逆移植。
- 84項私人舊虛構課程fixture測試保留，明確不是新課程驗收。
- 原官網舊殼另由main原blob59885a1364806e808c2a008c1b28dab368c49397保留為測試fixture。舊共享殼斷言仍實際跑，明確標歷史；一般readSciencePage始終讀當前產品。browser歷史路由只存在測試server的明確query，不是產品後門或第二公開站。
- 新原生checker規劃20案例，涵蓋mouse/keyboard/CDP touch、兩輪、重置/恢復、獨立數值與畫面幾何、泡/石/活塞/曲線同步、舊原文匯出、損壞/儲存失敗/無Web Locks/分頁衝突，以及真正trusted hidden/visible。
- 背景測試沿用版本固定Playwright1.58.2的原session解除focus capture、同窗原生頁籤切換，Xvfb headed；不合成visibility事件。
- 新checker本地僅syntax/helper測試；實際原生結果以本PR相同head的CI artifacts為準。未把尚未執行列為通過。
- 200%純文字壓力測試不同於真瀏覽器zoom，CDP touch不同於實體手機；Safari、Firefox及讀屏器尚未驗。

執行：`npm test --prefix scripts`；生成：`node scripts/build_science.mjs`、`python scripts/build_resources.py`、`python scripts/build_sitemap.py`。完整CI保留原8組工作及CI Gate，只在science-stations追加新必跑checker和14日artifacts。
