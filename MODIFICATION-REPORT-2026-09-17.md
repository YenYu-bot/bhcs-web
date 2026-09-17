# 百宏官網修改報告（2026-09-17）

## 本次已完成

### 1. 招生轉換

- 首頁 Hero 下方新增「2010 年至今、全職專任、依各校進度、每月主動回報、免費程度確認」信任標籤。
- 首頁與成果頁不再寫死 Google 評分，改為「查看評論」連結，避免分數變動後資訊過期。
- 修正首頁「多寫幾本」語意不完整，以及「補習班最常見的偷懶」較具攻擊性的文字。
- 聯絡頁預約表單改為整理資料後開啟百宏官方 LINE，並自動帶入家長填寫的內容。
- 移除全站頁尾的舊 HTTP 網站入口。

### 2. 內容與證據

- 教學成果頁將「在哪裡補都會上」改為較嚴謹的說法。
- 教學成果頁加入已知的匿名實際案例：國中數學 40 分提升至 80 分，並標示個別成效不代表保證。
- 師資頁補上游焜翔老師、羅振傑老師的學歷與教學年資。
- 高中頁加入第 1 冊與第 3 冊計算力工具入口，並將升學、檢定採計文字改為以當年度簡章與校系規定為準。
- 國中數學、理化、英文頁加入相對應免費工具，形成「課程內容 → 免費練習 → 程度確認」動線。
- 學習系統頁修正「會考與學測命題方向」過度概括的說法。

### 3. 教育文章

- 修正〈我不重視成績，只重視品行〉的 Breadcrumb 結構。
- 文章頁補上完整主站導覽、可見的發布／更新日期、延伸閱讀、免費資源與課程入口。

### 4. SEO 與網址整理

- 修正 `tools/math/g7-signed-numbers.html` 返回學習資源的錯誤路徑。
- 修正 `tools/factors.html` 指向 GitHub Pages 的 canonical。
- 為舊版互動工具補上 description、canonical 與 Open Graph 基礎資料。
- 重複頁面改為 `noindex` 並導向正式版本：
  - `/color-primaries.html` → `/tools/color-primaries.html`
  - `/tools/frog-dissection/frog-index.html` → `/tools/frog-dissection/`
  - `/tools/signed-numbers.html` → `/tools/math/g7-signed-numbers.html`
- Sitemap 改由 `scripts/build_sitemap.py` 依 canonical 與 noindex 規則產生，目前收錄 70 個正式網址。
- 數學工具總覽 canonical 統一為目錄網址 `/tools/math/`；Sitemap 的 `lastmod` 優先採用 Git 最後提交日，未提交變更使用當日，無 Git 紀錄時才退回檔案時間。
- 移除 Sitemap 中 Google 不採用的 `priority` 與 `changefreq`，保留實際 `lastmod`。

## 驗證結果

- 內部斷鏈：0
- 重複 HTML ID：0
- 非單一 H1 頁面：0
- 可索引頁缺少 description／canonical：0
- 重複可索引 canonical：0
- Sitemap 正式網址：70
- 舊 HTTP 連結與表單 placeholder：0

## 後續仍需要真實素材

以下項目不能靠程式合理補造，本次未假裝完成：

1. 再增加 3～5 個匿名教學案例，最好包含起點、處理方式、時間與結果。
2. 在學習系統頁加入 1～2 張去識別化的診斷報告截圖。
3. 若希望家長不經 LINE、直接由網站送出並寄到信箱，仍需提供 Formspree、Google Apps Script 或其他正式收件端。
4. 其他老師若要補齊學歷、年資、擅長問題與案例，需要再提供可公開資料。

## 負責人確認事項

- 游焜翔、羅振傑老師的新增資料與匿名「數學 40 分提升至 80 分」案例確認保留公開。
- Google 評價不顯示固定分數，改以外部評論連結呈現。
- jretc 舊網站入口維持移除。
