# 小車運動圖判讀實驗桌 v2：分層教學與實作前規格

日期：2026-11-01。狀態：規畫已通過獨立審查，等待parent私人實作指示；尚未改產品。

## 0. 授權、基準與這次真正要補的深度

使用者已接受私人 v1（來源基準 `7a40cede3f7e7400a95686612363977639a89706`，本次已唯讀核對private checkout HEAD；正式實作前仍重新核對runtime manifest），並於01:41:06 UTC提出：「如果只有這樣太簡單，加入XT圖，VT圖的判讀，包含靜止，等速度運動，等加速度運動（+、-），折返等」。因此v1「不做加速度/v–t」的範圍限制在**v2新課程**被這次明確需求取代；v1入門活動仍保留，不偷改其已驗收模型。

本文件只授權規畫。保留同一私人Site；未取得公開repo、Draft、合併或正式上線許可。先審查、再由parent決定私人實作。完整新課程不是把現成兩張圖放上去，也不是每情境再抄九個數字；學習深度來自學生**選證據、算變化量、分辨正負與快慢、框選帶符號面積、修訂解釋**。

## 1. 學生入口與課程層次

首頁兩個清楚選項：
1. **入門：先量測，再自己作圖**——保留原v1九筆人工讀尺／作圖流程，選做，不是新課程前置必做。
2. **進階：小車怎麼動？從兩種圖找證據**——本版主要新內容，約25–35分鐘，可中途保存續作。無強制預測、猜答案或限時作答。

進階分四層，必須有對應已觀測證據才能核對；可回看已完成層，不因回看清答案。

|層|重點|學生實際做的事|刻意延後|
|---|---|---|---|
|A 位置圖與方向|靜止、正負等速、位置不等於位移|看車／讀自動觀測帶；選兩時刻；算Δx、Δt與段速度；判斷x–t斜率|不顯a數值，不做面積|
|B 速度圖與加速度|v正負是方向，a正負是v的變化；同號變快、異號變慢|先看兩條等加速度案例的0–2s，再看2–4s；比較連續兩段Δv／Δt，配對方向與快慢|先不把完整折返曲線一次壓給學生；不做積分符號|
|C 過零與折返|瞬間v=0≠靜止區間；已到0≠已看見折返|把已觀測的前後半段合看，選t1、t2、t3證據，指出速度變號與x–t轉向；比較靜止案例|t=2仍有明確加速度，不要求學生用微分推導|
|D 面積與路程|v–t帶符號面積是位移，絕對面積和是路程|選取0–2、2–4兩區，讀底與高、算三角形面積與符號；和x終−x初交叉驗證|不教高階積分、受力／摩擦或曲線面積算法|

加速度不是只在「折返」時出現。層B先以同一條運動的**分段證據窗**學方向／快慢，層C才把已看過的窗合起來命名折返，避免一開始就堆全部概念。

## 2. 五個核心情境與精確oracle

所有新情境：同一條水平直線軌道，左方負、右方正，固定原點O，**車身中央同一觀測標記**。x0=1m刻意不等於0，防止把x/t當速度。時間T=4s；公式x=x0+v0t+at²/2、v=v0+at。理想運動模型、無受力求因、無摩擦、無車身旋轉參考點變換；等加速度案例在整段0–4內a不變。

|教師／工程ID（括號為核對後才顯示的概念名）|v0(m/s)|a(m/s²)|x在t=0,1,2,3,4(m)|v在t=0,1,2,3,4(m/s)|Δx全程(m)|路程(m)|
|---|---:|---:|---|---|---:|---:|
|R（原地等候）|0|0|1,1,1,1,1|0,0,0,0,0|0|0|
|U+（向右行駛）|2|0|1,3,5,7,9|2,2,2,2,2|8|8|
|U−（向左行駛）|−2|0|1,−1,−3,−5,−7|−2,−2,−2,−2,−2|−8|8|
|A−（速度逐漸減少）|4|−2|1,4,5,4,1|4,2,0,−2,−4|0|8|
|A+（速度逐漸增加）|−4|2|1,−2,−3,−2,1|−4,−2,0,2,4|0|8|

學生介面五張卡一律用中性「案例1…5」，順序對應R、U+、U−、A−、A+。不把靜止、方向、加速度正負或折返寫在未核對標題、縮圖alt、按鈕或ARIA裡；工程ID僅供規格/模型使用。各分類題通過後才可補概念副標；既有表徵不因後來修改答案而假裝沒見過，但標「需重新核對」。

### 2.1 固定座標，跨案例真正可比較
新課程所有案例與比較窗共用：t軸0–4s；x軸−8～10m；v軸−4～4m/s。刻度數字/單位明示，不因運動、答案、窗口或螢幕自動換range。x主刻度每2m、v主刻度每2m/s，選時刻整秒與半秒可用外部按鈕；取樣表整秒5筆。手機不得硬擠兩張圖：先x–t、再v–t，單張卡片切換或上下排列，選中時刻保持一致。曲線形狀比較只在同一種圖、同固定尺度內，不把x–t與v–t「看起來斜」當可直接相比。

折返距離從x1到5或−3為4m，佔位置軸18m的2/9，避免手機只剩微小來回。320px實際資料區至少220px時位移幅約49px；若實際小於此門檻，需調布局而非暗改軸域。字級≥14CSSpx、固定軸的畫布margin與44px操作點需用原生幾何驗證，不只放大SVG字後裁掉。

### 2.2 同號／異號與折返的必要錨點
- A−，t1：v=+2，a=−2，向右但變慢。t3：v=−2，a=−2，向左且變快。
- A+，t1：v=−2，a=+2，向左但變慢。t3：v=+2，a=+2，向右且變快。
- t2兩例v=0，位置為局部極值；t1與t3速度異號才有前後折返證據。僅觀察[0,2]時只能說「已到速度零，尚未觀察到之後是否返回」，不能把未來當已量到。
- R的v=0持續整段、x不變；A的v=0僅t2一瞬間，鄰近時刻位置在變。a不為0，即使那一刻v=0。
- U−在t0仍x=+1但v<0，反例證明正位置不代表向右；後來x<0也不能單憑位置判斷往左。
- A−與A+各全程Δx=0但路程8；與R同樣Δx0，路程與運動狀態不同。

## 3. 時鐘、觀測、播放與回放契約

### 3.1 沿用已驗基礎，但新課程不再人工逐筆抄寫
v1保持原有每秒人工「核對並收下」。v2使用**自動模型觀測帶**，欄位明說「模擬儀器讀值，不是實體感測器」。學生不用反覆輸入五個x值；必須在後續任務實際選取已收的時間點/區間，不能不看數據便按完成。

進階每次觀測run是不可變的scenario/version/參數集合：開始時建立t0一次；有效前景播放跨整秒時，依模型在該精確整秒擷取一次t與x。原始samples一律只存t/x與captureMode，不預填v或a。自動樣本只含已經到達的t；不得初始化就塞全部五筆到DOM、ARIA、匯出或儲存。
- 層A每個R/U±觀測窗為0–4；層B A±首次可觀測0–2，停住後完成第一組方向/快慢證據，再解鎖2–4。窗終點不自動改場景。
- 任何有效frame可能跨整秒時，只補**該有效前景時間確實跨過**的整秒，不取最後frame的位置代替每個樣本，也不跨lesson window end。t0/t2/t4邊界去重，唯一鍵runId+t。
- 連續軌跡可畫到當前observedThrough，而數據表以整秒點為準。所有future曲線/樣本都裁到已觀測範圍；不是CSS藏透明答案。
- 時基與v1相同：performance monotonic差量、有效elapsed毫秒，不按frame數、不逐幀加秒浮點、不按按鍵或拖曳速度。1×播放，直接到下一取樣整秒按鈕為非動畫替代，不叫物理時間被加速；該步只到當前窗口下一秒，並補該點。按鍵repeat不跨越尚未解鎖的窗口。
- gap>250ms／負值／非有限值、hidden、blur、pagehide、resize自動暫停在最後已呈現的模擬時間；不補背景wall-time，返回需明確繼續。pause/play重設anchor，舊runId/generation callback無效。
- 直接到下一整秒與播放所得同樣的模型樣本須標mode，不能冒稱學生親自逐尺量測。兩者教材均可用，不作學生成績差別。

速度儀表是已觀測時刻上的模型投影：依case/scenarioVersion與t計算v，不回寫、不補改原始t/x samples。A1期間可見表、ARIA、匯出只含t/x，避免直接把段速度答案給出；取得foundation-observed後才顯示/匯出已取得t的v，欄位標「模擬速度儀表讀值」。之後修改A1仍可回看先前已合法解鎖的v，但全課完成須重新核對。a參數、Δv/Δt結果、面積及路程等衍生正解仍依對應題目通過才顯示。

### 3.2 保存與回放的界線
已跨過並收下的整秒樣本即保存；未滿下一整秒的觀測t不持久化。reload回最後封存整秒，paused恢復；UI常駐「未到整秒的播放進度不保存；重開後從上一個整秒繼續」。只有t0則可重播0→1。窗口完成/可見層級與記錄聯動推導，不儲存任意unlocked=true。

回放獨立display clock，不改observedThrough、samples或evidence version。回放上限只能是已觀測到的封存範圍（不因回放偷看未來）；退出回原觀測t與學習階段。要看新的後半段使用「繼續觀測」，不是回放。回放時禁自動收樣／seal，跨秒不寫入。回放pause/hidden/step/exit/reset沿用v1隔離與generation規則。

## 4. 完整教學腳本與非敷衍判讀任務

### A1 靜止與等速：先從位置的變化找速度
老師：「先看中央標記和原點。位置的數字告訴你在哪裡，不直接告訴你往哪走。」
1. 依次觀測R、U+、U−，自動觀測帶留下5筆。每次只解鎖當前已觀測曲線，不要求預測。
2. 各案例學生選**兩個不同的已觀測時刻**。必須包含至少一組非零起點區間，例如U+以t1與t3為指定檢核窗；外部時刻選單清楚顯示x與t。
3. 填Δx、Δt、Δx/Δt。R為0、U+為+2、U−為−2；系統由實際選的兩時刻算expected，不能只固定答案讓任意亂選也過。
4. 分類：「位置圖水平」「隨時間上升」「隨時間下降」；說明各對應靜止／正向等速／負向等速。圖上出現學生選的兩點與Δx/Δt直角輔助線，數值答案核對前不自填結果。
5. x/t陷阱：U+ t2時x5，問「5÷2能當這段速度嗎？」選否，並要求指出應減去的起點位置或選成正確兩點差值；不能只背「不要除」。

### A2 速度圖是新的表徵，不是另一條道路
A1含intercept通過、取得foundation-observed後開啟v–t儀器與圖（不必等A2通過）；仍只顯已觀測範圍。老師：「圖的高低現在代表速度，不再是車的位置。先看縱軸單位。」
- 同一U+的x–t斜線對v–t水平正值；U−對水平負值；R對零線。學生配對三組圖（案例名稱不直接充當答案），以自己選的段速度作證。
- 診斷「v–t水平就是靜止」：必須勾選R而不是所有水平線，指出速度0而不是斜率0。v–t斜率0表示a0，不一定v0。

### B1 加速度是速度的變化，不是方向的別名
老師：「先只看前半段。車往哪裡走，看速度正負；越來越快還是慢，看速度大小。」
- A−、A+先各觀測0–2，不顯未來2–4曲線或結論。
- 學生選t0→1、t1→2兩個相鄰區間，填兩次Δv與Δt，核對−2/1、−2/1或+2/1、+2/1。數據支持這組模型的恆定加速度；模型假設全段恆定不靠兩筆數據就宣稱任意真車必然恆定。
- 分別在t1分類方向與快慢：A−向右變慢；A+向左變慢。老師提示「比較絕對值；負數往零靠近，大小會變小」，不自選答案。
- 兩例前半都核對後解鎖後半觀測2–4；各在t3分類A−向左變快、A+向右變快。x–t越陡代表速率更大，但下降且越陡仍是往負向。
- 最後學生完成四格(v正/負 × a正/負)配對，證據必指向本案t1或t3，並指出對應x–t局部斜率正負、該半段斜率絕對值正在變大或變小。不能只拖答案到文字格而無來源；不把曲線割線當端點瞬時切線。

### C 把兩半合起來看：什麼叫折返？
老師：「剛剛是分段看，現在把全程放在一起。不是線往下畫就叫返回。」
- 切到已取得的完整A±雙圖，選t1、t2、t3三個點，列出v的符號序列(+、0、−)或(−、0、+)；指出x–t極大/極小位置與t2。
- 答兩個獨立問題：『t2那一瞬間是否v=0？』是；『是否像R一樣整段靜止？』否。需選相鄰時刻不同位置作證。
- 只顯示同一case已保存[0,2]證據窗的遷移題：「到2秒為止，是否已觀察到返回？」答「還沒有，只看到速度到零」；問的是已觀測窗，不是要求預測後半。
- 反例U−全程v負、x下降但沒有變號，所以一直向左不是折返；a符號不變也能折返。不能以x穿過0或a改號當折返條件。

### D v–t面積：回到原處不等於沒走
老師：「現在把速度乘上經過時間。軸上、軸下對位移的方向不同；路程只問走過多少。」
- 先U+／U−的0–4長方形：學生選底4s、速度高度大小2m/s，輸入面積大小8m，再決定帶符號位移+8/−8；不是一開始同時帶入很多三角形。
- 再A−，可選/鍵盤勾選0–2與2–4兩區；分別輸入底2、高4、三角形面積4，選軸上+／軸下−。畫陰影但未核對前不印4或總和。
- 組合：Δx=+4+(−4)=0m；路程=|4|+|−4|=8m。A+順序相反（−4,+4），總量相同。學生須以首尾x1與x1交叉驗證Δx，而非只相信自動面積顏色。
- 最後三選比較R/A−/A+：「哪些位移0？哪些路程0？哪些曾折返？」三題各自核對，不能單一『完成』代替理解。
- 完成畫面提供個人已通過證據卡、可回看原數據與修改；不提供預先勾滿答案。可選短句反思，不以關鍵字假評理解。

## 5. 答案、圖上操作與解鎖的硬契約

- 觀測紀錄與學生annotations/answers分離；拖點只選已觀測時刻，不改物理模型或紀錄。新v2不是把現成點拖到正確曲線；有意義操作是選比較的兩點／三點、選區間／面積，再提出數量與解釋。
- 圖上可點/拖時間游標，量化到0.5s（資料表整秒，半秒值由已觀測連續模型範圍查詢並標「游標讀值」）；所有必答證據使用整秒0..4，避免需看不清細格。半秒游標不新增持久化sample。
- 點兩時刻必須tA<tB；同時刻Δt0禁除，顯示選不同時刻，不輸出NaN或Infinity。選區間方向固定由早到晚，不讓反向drag暗改符號。所有拖曳有具名下拉／分段按鈕替代；只讓當前游標44px可拖，不疊五個hit圈。
- 指標preview/upcommit/cancelrollback，up採最後move、偏心grab扣offset、框外／Esc／blur／hidden／resize取消；切case/圖/tab先取消operation。額外pointer、重複up、舊capture/generation不得提交。盤旋hover不能留active實心色。
- 每題有answerRevision、currentCheck與上游evidence fingerprint；任一數字input當下、choice change、選證據/區間改動即撤銷該題及依賴下游完成；改回仍需重核對。IME開始就撤pass、組字途中禁check。保留原答案但標需核對，不偷偷清空學生思考。
- 解鎖分兩類：已取得的觀測資料永久可回看；**教學完成**依當前答案有效性推導。改A1答案不能刪已收A±樣本，但不能讓整課仍顯完成；已觀測的後層可標「已看過，前置答案待重核對」，不能用重鎖藏資料造成假丟失。
- 關卡初次解鎖必須先前有效check＋對應已觀測樣本；反向修改後容許看已走過內容但標not-current。不得保存任意unlocked flag直接跳關；解鎖歷程以第6節的合法milestone歷史證書驗證；歷史可看過不等於目前答對。
- 數值全部用原始精度核對。本版答案整數/有限小數：接受等值十進位（可有前置+或−/ASCII-；Unicode負號正規化，最多2小數，≤16字），拒絕空字串、單位混填、NaN、Infinity、scientific notation。整數答案不放寬成±0.1；學生畫面顯四捨五入不得回灌oracle。幾何≤1CSSpx僅渲染容差，不是物理答案容差。
- 揭露界線：當前觀測的x/v可作證據顯示，並非提前洩答案；未觀測未來x/v、未核對的Δ量/a/帶符號面積/總路程不得以hidden DOM、reserve、tooltip、export預填。中性reserve不放完整解答。

## 6. 保存、舊版相容與重置

保留原v1已驗收資料key，不默默搬移或覆寫。建議v2新key `bhcs.motionGraphsDesk.v2`，同Site兩個活動清楚分開；舊 `bhcs.motionPositionDesk.v1` 只由入門活動既有driver管理。進階reset說『清除進階判讀課程』，不清入門紀錄；首頁列兩活動各自保存狀態。不要新增一鍵清整站所有key。

v2採單一courseRun、5個caseRun，最多25筆整秒樣本；每個case前綴t0..observedInteger，不可缺漏/重複/跨case。參數不可由學生或raw任意改動；scenarioVersion鎖五組數值。保留學生選證據、答案、題版本、currentChecks、必要milestone；診斷history上限100且compact，不在每筆複製完整大fingerprint；reflection≤500字。raw上限128KiB，滿容量測試用預設UUID、最大答案與中文反思，不靠提高上限解膨脹。

每筆auto樣本保存可排隊但寫入只在Web Locks鎖內重讀baseline/revision；不以舊『已存』回覆代表目前snapshot。保存失敗允許本頁繼續、顯示未持久化，提供重試/匯出；同snapshot重試不得重生sample。storage event立即撤舊saved標籤；stale分頁與reset epoch不得覆寫／復活資料。

無鎖memory-only、不自動寫入；已有raw可讀恢復為本頁副本但不能安全清除。read denied／corrupt／futureversion／oversize隔離不覆寫；提供本頁匯出與具名原始raw備份兩種（normal raw不說受保護）。兩階段reset、checkbox、stage1/2取消與Esc焦點回實際launcher、clear成功才fresh；clearfail保留資料/dialog。清後重開與第二輪不得出現舊答案。

匯出區分：scenarioID與版本（未核對前不含v0/a參數）、已觀測t/x samples、合法解鎖後的v儀表投影、學生annotations/answers、有效check/待重核對狀態。模型參數與衍生正解僅在對應核對通過後可輸出，並標成解說欄；不能匯出尚未取得future樣本／未核對衍生正解；輸入錯答案可匯出但不能冒充量測值。沒有匯入功能。原v1的匯出仍由原路徑處理，不替舊資料宣稱學完v2。

### 6.1 正式快照與歷史解鎖證書
`schemaVersion=2, scenarioVersion, courseRunId, storageRevision, cases, answers, certificates, history, reflection`為根白名單；不得帶任意completed/unlocked旗標。每個case只有固定caseId/runId/scenarioVersion、合法連續整秒samples（t,x,captureMode,sequence）、observedInteger及樣本指紋。觀測未開始是空samples/observedInteger=null；開始後0..n逐一，最多5筆。即使物理R數值重複，不去重不同t。

題目以穩定questionId管理，不以DOM序號決定語意：
- `A1.R/A1.Uplus/A1.Uminus`：選定tA/tB、deltaXRaw、deltaTRaw、velocityRaw、motionChoice；Uplus檢核指定t1/3，其他兩題可選任兩已觀測整秒。
- `A1.intercept`：否定x/t的選項＋引用初始x/t證據；`A2.match`三個圖對應＋`A2.zero`真正靜止案例。
- `B.first.Aminus/B.first.Aplus`：固定0→1與1→2證據、兩段deltaVRaw/deltaTRaw、accelerationRaw、t1direction/speedTrend。兩題都有效才可觀測後半。
- `B.signGrid`：四個(v符號,a符號)欄位各引用case+t（A±t1/t3）及direction/trend，四格必須各有獨立引用，不能重用一點填滿；每格另填xtSlopeSign（局部斜率正/負）與xtSteepnessTrend（此半段斜率絕對值變大/變小），必須同時讀x–t與v–t，不只填速度表。
- `C.reverse.Aminus/C.reverse.Aplus`：引用t1/2/3、符號序列、turnTimeRaw、極值類型；`C.zeroInstant`、`C.truncated`、`C.negativeUniform`三個帶證據選項題。
- `D.rectangle.Uplus/D.rectangle.Uminus`：0→4、baseRaw、heightMagnitudeRaw、areaMagnitudeRaw、signedDisplacementRaw。
- `D.triangle.Aminus/D.triangle.Aplus`：兩半區間各baseRaw/heightMagnitudeRaw/areaMagnitudeRaw/sign，合成displacementRaw/pathRaw與首尾位置引用。
- `D.compare`：R/A±的零位移、零路程、折返三組集合選擇；可選reflection非評分。

固定question dependency DAG：A1三案例→A1.intercept→A2.match→A2.zero→B.first兩案例→B.signGrid→C.reverse兩案例→C.zeroInstant→C.truncated→C.negativeUniform→D.rectangle兩案例→D.triangle兩案例→D.compare。同一組內兩案例可任意順序，跨組須全組目前有效。完成全部題才是進階完成；沒有v1前置依賴。

每question存`revision(0..1,000,000), response(白名單typedfields), currentCheck|null`。currentCheck綁questionId、answerRevision、該題selectedEvidence完整引用及其指紋、所有上游currentCheck指紋；passed由當前題目oracle重算，不信任raw passed。證據fingerprint只綁這題實際引用的不可變sample子集/明確前綴與caseRunId/scenarioVersion，不能綁會隨t3/4新增而變的整case全量hash；B.first的0..2核對在自然新增t3/4後仍有效。只有題目引用/答案/上游核對版本的實際改變才失效。任何上游改動，所有依賴currentCheck清null、答案保留；同值輸入no-op，改值再改回revision仍增加。滿revision上限停止編輯並提示匯出/重置，不wrap。

**歷史證書不是另一個完成旗標。**只為保留「當時合法解鎖了哪個觀測窗/表徵」：唯一ID最多4個，`foundation-observed`（A1全部有效）、`velocity-ready`（A2有效）、`accel-second-half`（兩B.first有效）、`area-ready`（B.signGrid及C全部有效）。certificate固定父鏈 foundation-observed→velocity-ready→accel-second-half→area-ready；除foundation外須有parentCertificateId且父證書合法，缺parent的孤兒證書一律拒絕。每個certificate包含當時所需題目的最小response、已驗currentCheck版本/依據引用及scenarioVersion；immutable，首次合法取得後不重複append。證書驗證以保存response重算答案和參照樣本、驗固定parent鏈，不依賴現在response；歷史父證書依首次合法版本保留，不強迫後來重新核對的題目版本等於父證書的舊版本。這個歷史驗證模式不替代currentCheck對目前上游版本的嚴格比對；過去已通過而現在修改是允許的，不會把歷史證書當成目前passed。

恢復時先驗所有case樣本公式與前綴，再驗certificate內容與取得條件，再驗目前answers/checks；相互引用不得循環。A±可有t0..2需velocity-ready，t3/4需accel-second-half；D已填答案需area-ready。缺證書卻有後層樣本/答案、偽造證書、跨courseRun引用、參數不符、未知欄位、非有限值、out-of-range或重複case均quarantine，不默默裁剪。入門v1快照不當作v2schema解析。

證書的固定總payload要在128KiB滿容量測試一起計入；只存所需response和精簡evidence引用，不能每筆診斷history複製完整certificate。當前完成由**所有必答題currentCheck有效＋五案例所需觀測完整**推導；歷史證書僅允許回看/繼續已取得路徑，不取代重新核對。

## 7. 手機、無障礙與視覺資產

- 保留老師canonicalPNG/provenance；新增精確SVG車/軌道/x–t/v–t格網與選取區。圖中文字動態補償縮放≥14CSSpx，預留標題/負數/單位/面積區標籤空間；不能把原v1小字問題重演。
- x–t/v–t的縱軸單位必突出且不同配色只輔助，不以顏色代替x/v、正負符號及區間名。負號不能因字型或裁切消失。曲線不是道路，車在軌道上，圖在儀表上。
- 手機採單圖切換，固定顯示案例、已觀測窗、游標t、x/v當前讀值；切圖不改t/答案。桌機可並排，圖域映射仍各自驗證。比較案例使用明確選項與疊圖legend，不默認疊全部五條。
- 真正停車R、觀察pause與回放pause用不同文字。動畫可關、直接步進等價；reduced-motion不影響數據與題目。聲音非必要，不以音效作唯一提示。
- 全鍵盤Tab流程可完成樣本觀測、選兩點、選面積、作答、重置；native select不攔初始Arrow造成不能選值。44px目標與外部換行選擇器，無九點擠小圖。
- 保持選中target在拖曳期間不因guide/錯誤/新增sample表reflow跳動，scoped overflow-anchor與中性intrinsic reserve。只有有效下一階段轉換可一次捲動＋focus preventScroll。
- ARIA讀當前已觀測t/x/v、學生所選區間與答案狀態；不逐frame轟炸live region。讀屏器可用表格及按鈕得到同樣概念證據，不假稱完成視覺讀尺能力測驗。

## 8. 開工前與交付前驗收矩陣

### 8.1 物理與數值獨立oracle
每case至少t=0..4步0.01的401點，共2005點，另外t2左右ε、整秒25點、半秒45點；x連續、v導數/斜率與a符號、零點與正負面積用獨立Fraction/解析分段驗證。A−正區4/負區−4、A+反之，路程8、Δx0；U−面積−8但路程8。R整段零vsA瞬時零必分開。
對照學生選任意兩個已觀測整秒：x–t割線是該區間平均速度，**等加速度曲線不能把任意兩點割線冒稱某一端的瞬時速度**。層A才以等速樣本做Δx/Δt；層B瞬時v由儀器/模型顯示，若要切線只作明示瞬時方向的輔助，不另外讓學生以割線作錯算法。

### 8.2 時鐘／證據／解鎖
100×10ms、10×100ms、4×250ms同有效時間同target；pause/resume/hidden1小時不補跑；跨整秒樣本正確且唯一，窗口t2不可直接step到3；舊callback/run切換/replay無寫入；reload從已封存整秒恢復paused；case切換保留原case但不得把A−資料寫到A+。
檢查所有initial DOM/ARIA/export/快照沒有future答案，窗口擴展只在合法gate。改選證據、改數字、改回、IME、重載rawflags、缺樣本帶完成、非法milestone均failclosed；保留已觀測資料不被答題撤銷刪掉。必測：改A1→舊certificate/後段samples仍可看，但全課complete=false；依DAG重新核對後才恢復；B.first完成後append t3/4不自毀其pass；孤兒velocity/area證書拒絕。

### 8.3 UI／儲存／原生矩陣
- 桌機完整五case四層，至少一次錯答→證據修訂→重新核對；reload續作、匯出、兩階段取消與reset後第二次課程。
- 320/360/390/412、desktop、短橫向、實際browser200%與guide文字200%分開；符號/刻度/曲線頂底/軸上下面積不裁切、不錯位（VT±4雖在資料邊界，SVG外margin仍須容納44px圈與標籤，不能直接貼viewBox邊）；real touch、mouse、全Tab keyboard分別報告。
- 游標SVGscreenCTM與44px命中圈中心≤1CSSpx；x/v兩圖不同viewBox/letterbox、負位置/負速度、0/2/4時刻均覆蓋。抓圈邊不跳，tap/drag不同transaction，框外/cancel/lostcapture/resize/secondpointer/heldkeyrepeat不亂提交。
- drag事件capture/bubble/rAF連續viewport幾何≤1CSSpx、零程式scroll；包括中間跳又回原位的負例。字級實際CSSpx、文字boundingrect與圖框margin獨立檢查，不以sourcefont數字代替畫面。
- 真WebLocks雙頁、讀/寫/quota/clearfault、未知版/oversize、無鎖、有raw、queuedwrite→reset、正常/異常rawbackup、111類前站教訓測項逐項重用或重新驗證，不宣稱沿用程式即通過。
- 不誇大：未跑的真touch、Safari/Firefox、讀屏器、所有原生中斷一律『未測』。已接受v1不等於v2已接受；新私人版需要重新桌機／手機驗收。

## 9. 分階段實作與發布界線

1. 審查本規格、五case oracle、教學順序與正式schema/milestone；先排除洩漏與相依矛盾。
2. 開工後先唯讀保存accepted v1完整source SHA/runtime manifest；在同Site新增v2模組及入口，v1 route/module獨立，不拿新model替換舊key。parent先開既有Site source，保留identity。
3. model/clock sampling/courseEngine/storage四層先單元與獨立測試；固定API後UI接線。舊v1的取消、保存、字級、重置回歸仍跑，不能只測新頁。
4. 先完成A+B教學可走流程再C+D；每層需真實學生操作與錯答回饋，不留placeholder。不以分階段內測對外宣稱v2全完。
5. Managed QA及獨立audit修正後freeze，parent私人封裝/部署，再讓使用者重新驗收。公開整合、Draft CI、Ready/merge與正式部署另行取得當時許可。

## 10. 依據與狀態

- 已有 docs/science-motion-graphs-spec.md、scripts/science/models.mjs/motion-graphs 與 diagrams.mjs 的教學概念，但不直接沿用其預畫全部圖／答案的呈現。
- OpenStax College Physics 2e §2.8：https://openstax.org/books/college-physics-2e/pages/2-8-graphical-analysis-of-one-dimensional-motion ，位置圖與速度圖斜率的概念；數值情境由本站自行設計。
- 面積另據 OpenStax Physics 第2章Summary §2.4：https://openstax.org/books/physics/pages/2-section-summary ，明列v–t曲線面積對應位移（2026-11-01已核對）；本版以正負分區三角形/長方形自行推算路程。未轉載原書圖或題目。
- 獨立審查已執行5×401=2005點Fraction oracle及每案7個區間signed/absolute area，數值符合本規格；證據 `/workspace/shared/motion-graphs-v2-audit/numeric-oracle.json`。這是規畫模型驗證，不是已完成產品或真手機測試。2026-11-01 01:50 UTC 全文一致性審查通過，無開工前blocker；報告 `/workspace/shared/motion-graphs-v2-audit/plan-audit.md`。
