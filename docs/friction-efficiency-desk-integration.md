# 摩擦與機械效率實驗桌整合紀錄

本次是獨立教材的加法整合，不替換既有斜面、能量、摩擦或其他自然／數學教材。Draft 與 CI 不代表已授權合併或正式發布。

## 來源與不變性

- 官網基準 main：`74b84c9536fac9ac26724de1909535bfc2d4ffdd`，含已發布的斜面實驗桌。
- 桌機及手機驗收來源：`bf36ecfff5eaa2942813a057d4e8e05da86871f5`。使用者回報驗收通過，但未提供裝置型號／OS／逐案紀錄；不等於所有手機平台認證。
- 原始9個runtime檔案與4個測試檔的 SHA256 位於 `scripts/friction-efficiency-desk-runtime.json`，不可偷偷重設基準。
- 官網metadata把index的私有noindex標籤換成官方canonical；另有下述使用者單獨授權的alignment修正例外。整合guard先逆轉alignment delta，再逆轉metadata，逐byte比對原接受來源。
- 原始73項測試完整保留；僅相對import/base路徑改寫。geometry/style測試的HTML讀取明確反向還原metadata，維持原始private測試本體；另由官方整合guard確認正式頁沒有noindex。
- 639個既有tools/assets檔案逐Git blob保護，唯一容許變動為生成的自然教材目錄。此涵蓋已發布斜面所有runtime；不因其schema與本站相似而共用儲存或程式。
- canonical余老師PNG與provenance原檔保留；SHA256 `2851a4bdd0a6523fad5db15c8a197c17ac191bd70000c051513b5e317589f23b`。

## 教學與模型契約

固定同一10 N箱子、沿坡100 cm、垂直60 cm、水平80 cm；只換理想無摩擦與指定粗面。拉力平行坡面，模型是準靜態上移，ΔK=0，不由pointer速度推導物理速度或力。不模擬靜摩擦起動、自由下降或溫度。

| 項目 | 理想 | 指定粗面 |
|---|---:|---:|
| 上移拉力 | 6 N | 8 N |
| 沿坡距離 | 1 m | 1 m |
| 垂直升高 | 0.6 m | 0.6 m |
| 輸入功 | 6 J | 8 J |
| 有效功即重力位能增加 | 6 J | 6 J |
| 箱子與坡道內能增加 | 0 J | 2 J |
| 機械效率 | 100% | 75% |

N=8 N；粗面μk=0.25、fk=2 N是教師技術模型，不是25%損耗的一般定律。獨立測試以μ=.5→效率60%、損耗40%及改幾何反例防止混淆。重力對箱子做功為−Gh，不能把它與正的有效功混稱。

先完成兩輪並封存F、s、h，再開距離判斷、八欄計算與三項結論。沒有強制預測。答案修改撤銷目前版本相關通過標記；查看解說會記錄揭示，不冒稱獨立答對。正確模型答案只有對應欄通過或明確揭示才進匯出，量測與學生自己的輸入則可隨時匯出。

## 輸入與資料契約

本站採實箱即時單向reachedS，不是前站的取消rollback。沿坡投影floor後取max，反拉不倒退、不藉抖動累加。放手、pointercancel、失去capture、Escape、失焦或resize都停止並保持已達位置；端點停止後可封存，未停止不能封存。重新抓取rebase，同手勢不可反覆重設起點刷位移。滑鼠、觸控、鍵盤與前進按鈕共用同一進度規則。

獨立key為`bhcs.frictionEfficiencyDesk.v1`。合法snapshot只容許0筆、1筆ideal、2筆ideal+rough及唯一pair；不儲存半輪進度。Web Locks內重讀raw後再寫／清除；無鎖是memory-only，不假稱安全自動持久化。讀取失敗、壞JSON、未來版本或無效筆保留原文；跨頁衝突停止寫入。保存完成文字須對應最新snapshot，不可沿用舊成功文字。

頁首及完成區均有重置入口，兩階段確認加勾選才清除本站資料。取消零寫入、返回真正launcher焦點。異常原文備份與本頁量測匯出明確分開；清除失敗保留資料。成功後fresh開始，重載與第二完整流程不得復活舊答案。

## 官網加法整合

Standalone路由：`tools/friction-efficiency-desk/`。不加legacy research shell、iframe或共用site runtime；只從catalog進入自然目錄、資源頁與sitemap。描述揭露資料只存目前瀏覽器與網站，私人來源不同origin，不會自動搬移紀錄。

生成後自然教材59項、國中自然58項、理化40項、資源總數218、sitemap128 URL。既有pulley/incline測試只更新精確加法計數，原保護及CI gates不刪除。

新增`test:friction-efficiency-desk`到原npm aggregate，原有test序列仍保留。新增native checker到`science-stations`並獨立上傳14天artifact；8項前置job的Gate與fail-closed語義不變。

## 驗證與限制

原始73項模型／狀態／儲存／DOM／樣式測試，不等於native touch或視覺驗收。整合另檢查全部source inverse metadata、所有既有runtime、HTTP正確MIME與相對資源、catalog、workflow與Gate契約。

新native checker負責真實mouse/touch/keyboard流程、停止保持、端點取消、重置／重載、computed色彩、連續viewport幾何、SVG圈心與HTML操作圈獨立對齊、受控儲存異常與分頁衝突。使用受控QA資料；不直接呼叫app reducer或state hook來冒充操作。

首次整合審查發現接受版ray的normal x符號與SVG旋轉不一致，HTML操作圈中心偏離可見SVG圈心約9–18 px。這是新發現的產品幾何問題；原接受基準保持不變，新增真實對齊斷言不得放寬。使用者已於2026-10-31同意限定座標修正：只把ray的normal x從+.6*n改成−.6*n，其他runtime不變。精確可逆delta位於`scripts/friction-efficiency-desk-alignment-repair.json`，原接受manifest保持不變。新增兩項數值回歸：法向垂直性，以及505個位置直接從已畫出的SVG circle和transform推算中心，與HTML把手比對；不以geometry.handle自我證明。native checker另使用getScreenCTM核對實際渲染。修正版私人來源為`fa2467ed3c3f41d52cde8a0bd2560c4543d44579`；原bf36ecf接受基準仍保留。獨立managed browser以五種width及0/50/100 cm量測中心，最大差約0.01335 CSS px；此mouse/幾何證據不冒稱native touch通過。

本文件不預先宣稱exact-head CI成功。任何未執行的native touch、強制lostcapture、實體手機、Safari／Firefox、讀屏器或故障測項，需在CI／review結果中分別列出，不以模型／DOM通過替代。

### 新native檢查器的可執行範圍

候選包含15個獨立場景：桌機mouse與360/390/412原生CDP touch完整流程、純Tab／鍵盤完整流程、320窄版及390/320 guide字級200%壓力測試、壞JSON／未來版、讀取／寫入失敗、無鎖空資料／已有資料，以及兩分頁原生storage事件衝突。每案獨立收集結果，不因第一案失敗跳過後續診斷；總Gate仍要求全部成功。五個完整流程亦在完成後將輸入功6→5→6，要求完成標記保持撤銷直到四個計算步驟與結論重新檢查，原始量測與說明歷程不變。

觸控為Chromium CDP原生輸入路徑，不是實體手機認證。正常release與cancel會核對trusted且同pointerId的自然lostpointercapture；這不代表獨立強制capture-loss已測。單元／DOM另覆蓋失capture、blur、resize、第二指與舊事件。

尚未在此native候選實跑或未納入的範圍須分列：獨立forced-loss、操作中resize／實體旋轉、多指native操作、原生長按repeat、真瀏覽器200%zoom、Safari／Firefox、讀屏器及實體裝置矩陣。guide字級200%不冒稱browser zoom；既有私人managed QA的真browser zoom是另外一份證據。新native script在本機尚未執行，exact-head CI是必要的後續證據，不能以語法／helper tests稱15案已通過。
