# 比熱實驗桌：獨立、未列入目錄的 Draft

## 範圍與版本
- 本次只新增 `tools/specific-heat-desk/` 與測試/CI。未改舊 `tools/science/specific-heat.html`、自然目錄、學習資源入口或 sitemap；不是舊站替代授權。
- 私人基準 `bd9ebea7806624dde160edc87346fbc475aea838`，12檔精確清單見 `scripts/specific-heat-desk-runtime.json`。整合基準 main `f7fbb9ec89df02148cae3b077c937a1bedf1952f`。
- 新頁仍保留 `noindex,nofollow`，沒有目錄連結。待使用者決定入口及另行批准合併/正式部署。
- 可逆整合差異僅 canonical、網站儲存來源說明、下述短螢幕定位修正。物理模型、engine、clock、storage及插畫資產沒有變。

## 短螢幕修正
原200g準備後把主按鈕置中，可能讓其上方供熱觀察窗被裁。改為將 `heat-watch` 頂部對齊視窗，再以 `preventScroll` 聚焦主按鈕。不縮字、不改44px操作、不強迫一整桌塞進短高視窗。極短螢幕仍允許自然垂直捲動；不宣稱所有物件同屏。

## 科學與學習契約
第一輪100g水和100g鐵，均20°C，各吸收21W、60模型秒，終23/48°C。第二輪新的200g鐵終34°C，歷史100g鐵只作封存紙卡、不再供熱。均溫、無散熱及容器熱容量；不呈現沸騰、紅熱或已模擬內部傳熱場。
供熱箭頭只在自然加熱時依模型時計位移，暫停、完成、回放與歷史卡不供熱。減少動態偏好下箭頭固定，數值仍更新。跳終點不補造未呈現20/40秒取樣。每份Q核對前不顯示1260J答案；改答案撤銷依賴完成狀態。

## 紀錄與權限
新key `bhcs.specificHeatDesk.v1`；不讀寫舊共享比熱站資料。私人origin與官網origin各自保存，不自動搬運/混合，也不清除舊站資料。保留Web Locks、衝突保護、原文備份、失敗不假稱已存及只清本站key。未封存輪不持久化。

## 驗證
- 5份私人原測試原意不變，只調整import路徑；原58案例。
- integration guard逐byte逆回12檔基準，保護main全部700既有tools/assets、舊入口與目錄/sitemap。
- 新原生瀏覽器checker將納入既有必須通過的science-stations及CI Gate；mouse、keyboard、CDP touch、可信背景事件和儲存故障證據需以exact-head CI結果為準，不能由Node通過推稱真手機驗收。
- 私人版歷史受管QA：320/390/412及360目標實359、短高590×228，兩輪/7判讀/reload/reset已實測；工具為桌面鼠鍵/頁面縮放，不是真手機觸控、軟鍵盤或純文字200%。
- 此Draft尚未合併或正式部署；正式新route URL只能描述預定路徑，不能稱已上線。

### 本機候選檢查
已執行完整生成鏈與sitemap，133個URL及254資源連結不變；沒有新增目錄入口。原58案例加8個瀏覽器驗收幫手負例共66測試通過，CI結構16測試通過。瀏覽器checker列28案例，包含320×378短高、原生可信背景與正常/減少動態；瀏覽器本身尚需exact-head CI執行，不把靜態審查當已跑。
