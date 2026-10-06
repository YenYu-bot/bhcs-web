# Science Lab 2.0 Prototype
## 光學與透鏡成像 2.0｜Implementation-ready Spec

版本：**Spec v1.2**
日期：2026-10-06
狀態：**規格審核中，不進入實作**（v1.2 為整合版，取代 v1／v1.1 全文；不另附補充說明）

---

## 變更紀錄

### v1.1 → v1.2（交叉檢查後的邏輯一致性修正）

| # | 修正 | 併入章節 |
|---|---|---|
| A | Trial 1 初始屏幕 `s=22` 的 `e=7 > 7t=5.25`，實為 Lv4；不改 threshold，改為 **`s=20`**（`e=5`，Lv3） | §4.2、§7.4、§8.2、§17 |
| B | bench 溢出 clarity 兩套規則衝突：拆成 `rawClarityLevel` 與 `effectiveClarityLevel`（`imageType≠real` → Lv4；`real` 且 bench 內 → raw；`real` 但 bench 外 → `max(raw, 2)`，永不為 Lv1） | §6.4、§7.3、§14.2 |
| C | Trial 2 完成條件不可能成立（屏幕鎖在 15、理論 30）：拆成 move／find 兩個 state gate；Trial 3 search 無 sharp completion，改為三區搜尋完成 | §6.4、§8.1A、§8.2 |
| D | `observedScreenPosition` 不得硬編碼：Compare Card、Notebook、Trial 記錄一律由 record 模板產生；文中 15／30 僅為示例 | §7.5、§8.2、§9 |
| E | 搜尋區改為連續半開區間：`8 ≤ s < 17`、`17 ≤ s < 29`、`29 ≤ s ≤ 40`（0.5 cm snap 下無空隙） | §8.2、§10.3 |
| G | state machine 與 §8.1A 不一致：`*-complete` 為 sharp 自動進入、`*-recorded` 為 CTA 進入（寫 record）；Trial 3 三區完成只解鎖 CTA，按 CTA 才 transition | §8.1A、§8.2 |
| H | `trial2-move-object` 屏幕鎖定值、§7.4 Trial 2 的 `e` 皆改為 `trial1.observedScreenPosition`，不再硬編碼 15 | §6.2、§7.4 |
| I | 殘留文字：ARIA 範例改模板 `{s}`；§16 改為「清楚像距 `{observedScreenPosition}`」，theoreticalV 到 concept 階段才與 observed 比較 | §6.5、§16 |
| F | `PageUp/PageDown` 僅在 draggable 取得 focus 時攔截預設捲動，其他情況保留頁面行為 | §6.5 |

### v1 → v1.1（已併入）

下列七項已直接併入正文對應章節，正文即為唯一有效條文。

| # | 變更 | 併入章節 |
|---|---|---|
| 1 | 焦點穿越狀態正式納入：經過 `u=f` 不禁止，但回傳 `imageType=infinite`，畫面為無法聚焦的散開光影，無 NaN／Infinity UI／閃爍；完成條件只認指定目標 | §6.4、§9.3、§10 |
| 2 | Trial 2 蠟燭範圍收窄為 `12 ≤ u ≤ 35`；Trial 3 才解鎖 `5 ≤ u ≤ 35` | §6.2 |
| 3 | Trial 1 初始屏幕改為較遠的模糊位置（v1.2 定為 `s=20`）；開場台詞改為「很模糊」；明寫手機 1 cm snap 與 `t=0.75` 的交互結果 | §4.2、§7.4、§8.3 |
| 4 | 鍵盤新增 `PageUp/PageDown`＝5 cm；Home/End 不列必要項 | §6.5 |
| 5 | Touch：只有 draggable hit target 使用 `touch-action: none`，其餘桌面維持 `pan-y` | §6.6 |
| 6 | Hint 3 方向由 physics model 計算；`u ≤ f` 的 trial 停用方向型 Hint，改採近／中／遠搜尋進度提示 | §8.5 |
| 7 | 區分 `theoreticalV`（引擎真值）與 `observedScreenPosition`（學生證據）；完成條件 `projectionWithinBench ∧ abs(observed − theoreticalV) ≤ t`；Compare Card 顯示 observed | §7.5、§11、§12 |

v1.1 另補的三處（sharp gate 與 bench 邊界、bench 溢出狀態、搜尋區累計時機）已於 v1.2 審核通過並保留，其中 bench 溢出的 clarity 呈現依 v1.2-B 改寫。

---

## 1. Prototype 的任務

這一站不是把現有「凸透鏡成像」頁面做漂亮，而是驗證一套新的自然科教材方法：

> **學生先操作、看到差異、比較證據、說出規律，最後才接觸正式名詞與公式。**

本 Prototype 成功後，才考慮把這套結構正式命名為 **Lab Spec v2**，並作為酸鹼中和、神經與反應時間、天氣系統等下一批研究站的基礎。

## 2. 唯一核心學習成果

學生完成主流程後，至少必須能用自己的話表達：

> **凸透鏡前的物體位置改變時，能形成清楚實像的屏幕位置與影像大小也會跟著改變；當物體進入焦距內時，屏幕接不到清楚實像，但眼睛可以看到正立放大的虛像。**

不要求學生一開始會：背成像公式、背成像表格、背 2F／F 完整分類、手算像距、使用正式光學術語。這些都放在學生已建立實驗經驗之後。

## 3. 教材主流程

### 3.1 網站四步主導航（保留既有）

1. 接任務
2. 動手做
3. 研究手冊
4. 挑戰題

### 3.2 「動手做」內部六階段

1. 遇到問題
2. 第一輪實驗
3. 第二輪只改一個條件
4. 比較證據
5. 正式命名
6. 換情境挑戰

### 3.3 原則

- 主流程**不出現傳統 slider-first 介面**。
- Slider、select、精確數值輸入全部移到「自由探索／進階模式」。
- 內部狀態（`trial1 → trial2 → compare → concept`）由系統管理，不暴露給學生。

## 4. 教學情境

### 4.1 核心問題

> **為什麼投影機的屏幕必須放在某個位置，影像才會清楚？**

學生第一眼看到的不是公式或參數表，而是 **蠟燭 → 凸透鏡 → 屏幕**，屏幕上的影像很模糊。

### 4.2 余老師開場台詞

> 屏幕上的影像很模糊。
> 把屏幕移到最清楚的位置。

（v1 為「有點模糊」；因 Trial 1 初始 `s=20`、誤差 5 cm 落在 Lv3「明顯模糊」，措辭改為「很模糊」。）

## 5. 版面規格

### 5.1 桌機 1280px（12-column grid）

**左 8 欄（約 68～70%）：虛擬實驗桌**，內含蠟燭、凸透鏡、屏幕、光軸、成像、光線層、距離標示、可拖曳區域、即時清晰度回饋。實驗桌必須是頁面視覺主角；表單、select、數字面板、研究表格不得比實驗本身更搶眼。

**右 4 欄：余老師＋目前任務**
- 上：余老師插畫
- 中：當前一句主要任務
- 下：只顯示當下真正需要的資訊，如 `焦距 10 cm`、`物距 30 cm`；**不顯示**「理論像距 = 15 cm」（那是學生要找的結果）

**實驗桌下方只放三類內容**
- A. 這次實驗條件（焦距、物距）
- B. 已記錄的實驗（完成後才出現：「第一次紀錄完成 ✓」）
- C. 進階模式入口（折疊：「自由探索／精確數值」）

### 5.2 實驗桌視覺層級

1. **操作物件**：蠟燭、凸透鏡、屏幕（最高互動優先）
2. **影像結果**：屏幕上的倒立影像、大小、清晰程度
3. **光線**：第一輪預設不強調完整光線圖；可有「看光線」輔助功能；找到結果後才逐步顯示平行光線、經焦點折射光線、通過光心光線
4. **光軸與距離**：低對比，建立空間感，不搶主操作

### 5.3 手機 390px

**不採橫向捲動的大型實驗桌**（水平 scroll 與水平 drag 衝突、物件可能跑出 viewport、a11y 與 touch regression 複雜度高）。蠟燭、透鏡、屏幕同時出現在同一 viewport。

垂直順序固定：

1. 四步導航（compact stepper）
2. 余老師提示卡（人物靠左、文字靠右、只保留當前任務）
3. 實驗桌（約 `390 × 300～340 px` 主互動區）
4. 即時狀態（如「比剛才清楚」「快找到了」）
5. 主要操作鍵（如「記錄這次結果」）
6. 實驗資料卡（完成一次實驗後才顯示）

### 5.4 邏輯座標

不以畫面 pixel 作物理資料；內部使用獨立 logical coordinate：

```text
透鏡位置 = 0 cm
物體位置 = -u（左側）
屏幕位置 = +s（右側）
Guided Mode 可視範圍：左 -35 cm ～ 右 +40 cm（共 75 cm）
```

75 cm 壓入約 350 px，390px 手機約 4～5 px/cm，足以搭配 snapping。

### 5.5 Touch target

可見物件可只有 25～35 px，但實際 hit area **不得低於 44 × 44 CSS px**。蠟燭、屏幕皆使用 *visible object + invisible larger hit target*。

## 6. 互動規格

### 6.1 透鏡

**Guided Mode 固定透鏡於 `x = 0`**。拖透鏡不是 Prototype 必要功能（避免破壞控制變因）。自由探索模式未來才開放改變焦距、物距、屏幕位置。

### 6.2 可動範圍（依狀態）

可動範圍是**教材狀態控制**，不是物理模型限制。

| 狀態 | 蠟燭 `u` | 屏幕 `s` | 透鏡 |
|---|---|---|---|
| trial1-find-screen | 鎖定（30） | `8 ≤ s ≤ 40` | 鎖定 |
| trial2-move-object | `12 ≤ u ≤ 35` | 鎖定（`trial1.observedScreenPosition`） | 鎖定 |
| trial2-find-screen | 鎖定（15） | `8 ≤ s ≤ 40`（起點為 `trial1.observedScreenPosition`） | 鎖定 |
| trial3-move-object | `5 ≤ u ≤ 35` | 鎖定 | 鎖定 |
| trial3-search-screen | 鎖定（5） | `8 ≤ s ≤ 40` | 鎖定 |

- 蠟燭不得跨過透鏡；屏幕不得跨過透鏡。
- Trial 2 下限 12 cm 的目的：學生不會提前看到虛像，Trial 3 的揭示順序不被破壞。
- `u` 與 `s` 以 `a ≤ x ≤ b` 閉區間 clamp；超界時停在邊界，不 teleport。

### 6.3 Snapping

- 桌機：0.5 cm
- 手機：1 cm
- Guided 指定值刻意使用整數（30、15、5、10），touch 使用者不需像素級微調。

### 6.4 焦點穿越與 bench 溢出狀態（正式狀態）

蠟燭拖曳經過 `u = f` **不禁止**（如 Trial 3 從 15 拖到 5 必經 `u=10`）。此時：

- 模型回傳 `imageType = infinite`、`theoreticalV = null`、`imageOrientation = undefined`。
- 屏幕不得出現有限的清楚像；`effectiveClarityLevel` 恆為 Lv4，呈現為**無法聚焦的散開光影**（blur 最大、對比低，但 opacity 不降為 0）。
- UI 不得出現 NaN、Infinity、`∞ cm` 的數字、或畫面閃爍／抖動。
- 不得觸發任何完成事件，也不得計入搜尋區域；完成條件只認指定目標值，且各 state 的 gate 分開（見 §8.1A）。

同理，當 `f < u` 但 `v` 超出實驗桌（如 `u=12 → v=60`、`u=10.5 → v=210`）：

- `imageType = real`、`projectable = true`、`projectionWithinBench = false`。
- 屏幕任何位置都**永遠不得達到 sharp**（見 §7.3）。畫面依 `effectiveClarityLevel` 呈現：越接近桌面邊界越接近 Lv2（已經很接近但仍略模糊），距離足夠遠才進 Lv4 散開光影。
- 學生語言：「會形成實像，但清楚位置已經超出這張實驗桌的範圍。」

上述兩種中間狀態都不得被當成「虛像」，也不得導致資料層寫入錯誤分類。

### 6.5 鍵盤

每個 draggable object 本身必須可 focus。

| 按鍵 | 動作 |
|---|---|
| `←` / `→` | 向左／向右 1 cm |
| `Shift + ←/→` | 0.5 cm（桌機精調；**不得**為完成實驗的必要條件） |
| `PageDown` / `PageUp` | 向左／向右 5 cm（**必要項**；方向與 `←/→` 一致） |

- Trial 2 蠟燭 30 → 15：最少 3 次 `PageUp`。
- `Home` / `End` 不列必要項（一鍵跳界與「尋找清楚位置」目的關聯低）。
- 大步移動同樣受 §6.2 clamp 與 snap 約束。

首次 focus 可顯示：「可以拖動，也可以用左右方向鍵移動，PageUp／PageDown 可以一次移動較遠。」不要每次 focus 重複朗讀。`PageUp`／`PageDown` **只在 draggable 取得 focus 時**攔截（`preventDefault`）；focus 在其他位置時保留瀏覽器正常的頁面捲動行為。ARIA label 含目前狀態，例如：「屏幕，目前距離凸透鏡 {s} 公分，可用左右方向鍵移動。」

### 6.6 Pointer 與 Touch 手勢

- 只有 draggable 物件的 hit target 使用 `touch-action: none`。
- 實驗桌其餘空白區**維持垂直頁面捲動**（`touch-action: pan-y`）。**不鎖整個實驗桌，更不鎖整頁。**
- pointer down：進入 lifted state、顯示可移動軌道、pointer capture。
- dragging：即時更新位置與成像，不需放開才計算。
- pointer up／cancel：snap、更新當前紀錄、播放極短 settled feedback；cancel 必須正常 settle。
- 禁止：teleport、拖出實驗桌、拖出後消失、拖曳造成頁面水平 scroll。

## 7. 物理模型與清晰度

### 7.1 薄透鏡

```text
1/f = 1/u + 1/v      v = fu / (u - f)      m = -v/u
f > 0；u > 0；v > 0 為實像（右側）；v < 0 為虛像（物體側）
```

### 7.2 成像分類

| 條件 | imageType | 說明 |
|---|---|---|
| `u > f` | `real` | 倒立；`|m|<1` 縮小、`=1` 等大、`>1` 放大；理論上可投影 |
| `u = f` | `infinite` | `theoreticalV = null`；`imageOrientation = undefined`；學生語言：「光線離開透鏡後幾乎平行，在有限距離的屏幕上找不到清楚影像。」 |
| `u < f` | `virtual` | 正立、放大、無法投到右側屏幕。`f=10,u=5 → v=-10, m=+2` |

資料層**不得**回傳 `Infinity`、`NaN`、`0` 作為 `u=f` 的像距。

### 7.3 清晰度

單一真實來源是 physics／clarity model，**不得由 CSS 或畫面文字自行判定**。

```text
e = |s - theoreticalV|                       （僅在 imageType=real 時定義）
t = clamp(0.06 × f, 0.75, 1.25) cm            （f=10 → t=0.75）
```

**`rawClarityLevel`**（僅依 `e`，只在 `imageType=real` 時定義）：

| Level | 條件 | 文字 |
|---|---|---|
| 1 sharp | `e ≤ t` | ✓ 影像最清楚 |
| 2 | `t < e ≤ 3t` | 已經很接近了 |
| 3 | `3t < e ≤ 7t`（f=10：`2.25 < e ≤ 5.25`） | 影像還很模糊 |
| 4 | `e > 7t`（f=10：`e > 5.25`） | 只有散開的光影，已看不出清楚的蠟燭形狀 |

**`effectiveClarityLevel`**（畫面、訊息、scoring、state transition 一律使用此值）：

| 條件 | effective level |
|---|---|
| `imageType ≠ real`（infinite／virtual） | 恆為 Lv4 |
| `imageType = real` 且 `projectionWithinBench = true` | `rawClarityLevel` |
| `imageType = real` 且 `projectionWithinBench = false` | `max(rawClarityLevel, 2)`，**永不為 Lv1** |

例（`s=40`）：`v=40.5, e=0.5` → raw Lv1 → effective Lv2；`v=42, e=2` → Lv2；`v=44, e=4` → Lv3；`v=60, e=20` → Lv4。bench 外且 effective 為 Lv2／Lv3 時，訊息使用 bench 溢出語言（「會形成實像，但清楚位置已經超出這張實驗桌的範圍」），不使用「已經很接近了」。

- Level 4 不得寫「沒有光」。
- `projectionWithinBench` 定義：`8 ≤ theoreticalV ≤ 40`；`virtual`／`infinite` 為 `false`。
- 視覺 blur／contrast／edge definition 依 `e` 與 effective level **連續變化**；四級只用於教學訊息、scoring、state transition。opacity 不得降成 0。
- 成功回饋不得只靠顏色，至少同時有文字、icon、視覺清晰度（如「✓ 影像最清楚」）。

**手機 snap 與 sharp 的交互（刻意設計，非容差 bug）：** 手機 1 cm snap 配 `t=0.75`，theoretical 為整數時只有**正確整數位置**會進 sharp（例：`v=15` 時 14、16 為 Lv2）。桌機 0.5 cm snap 時 `v±0.5` 亦會進 sharp。驗收須分別驗證。

### 7.4 三輪正式實驗

**Trial 1**（`f=10, u=30`）：`v=15, m=-0.5`，實像、倒立、縮小。屏幕初始位置 **`s=20`**（`e=5`，落在 Lv3 `2.25 < e ≤ 5.25` 明顯模糊；離答案仍有 5 cm，且與開場台詞一致。`s=22` 的 `e=7` 屬 Lv4，故不用）。學生必須主動找到約 15 cm。

**Trial 2**（`f=10`，蠟燭 30 → 15）：`u=15 → v=30, m=-2`。屏幕**仍停在 `trial1.observedScreenPosition`**；由於合法第一輪記錄為 14.5–15.5 cm，而第二輪理論像距為 30 cm（`e` 為 14.5–15.5），此時必為 Lv4。學生重新找到約 30 cm。形成「我只移動蠟燭，原本清楚的位置就失效了」的因果經驗。

**Trial 3**（`f=10, u=5`）：`v=-10, m=+2`。學生仍可移動屏幕，但右側所有位置都不會 sharp。

### 7.5 理論值 vs 觀察值

- `theoreticalV`：physics engine 真值，只供模型、驗證、清晰度計算與進階內容使用。
- `observedScreenPosition`：學生實際找到並**按下記錄**時的屏幕位置，是研究手冊與 Compare Card 的證據。
- 兩欄位**不得混用**。Guided Mode 介面不顯示 `theoreticalV`。
- **完成記錄的必要條件：** `projectionWithinBench ∧ abs(observedScreenPosition − theoreticalV) ≤ t`（即 `effectiveClarityLevel = 1`）。僅進入「稍微模糊」不算完成。
- 桌機 0.5 cm snap 配 `t=0.75`，合法記錄值不唯一（Trial 1：14.5／15／15.5；Trial 2：29.5／30／30.5）。因此**所有顯示學生證據的地方（Trial 記錄、Compare Card、研究手冊模板）一律讀 record 的 `observedScreenPosition`，不得 hard-code 15／30**；本規格中的 15／30 僅為示例值。

## 8. 狀態機與腳本

### 8.1 正式狀態

```text
welcome → mission
→ trial1-find-screen → trial1-complete → trial1-recorded
→ trial2-move-object → trial2-find-screen → trial2-complete → trial2-recorded
→ compare
→ trial3-move-object → trial3-search-screen → trial3-no-real-screen-image
→ trial3-view-through-lens
→ concept → notebook
→ challenge-1 → challenge-2 → challenge-3 → complete
```

### 8.1A State transition contract（互不混用）

「**自動 transition**」＝條件成立即進入下一 state；「**CTA transition**」＝條件只負責解鎖／啟用 CTA，學生按下 CTA 才 transition。同一個條件不得同時扮演兩種角色。

| Transition | 類型 | 條件 |
|---|---|---|
| `trial1-find-screen → trial1-complete` | 自動 | `effectiveClarityLevel === 1` |
| `trial1-complete → trial1-recorded` | CTA | 學生按「記錄第一次結果」，**且按下當下仍為 `effectiveClarityLevel === 1`**；此時才寫入 record（`observedScreenPosition` ＝ 當下屏幕位置） |
| `trial1-recorded → trial2-move-object` | 自動 | record 已寫入 |
| `trial2-move-object → trial2-find-screen` | 自動 | `u === 15`（此時屏幕鎖在 `trial1.observedScreenPosition`，必為 Lv4，**不是** sharp） |
| `trial2-find-screen → trial2-complete` | 自動 | `effectiveClarityLevel === 1` |
| `trial2-complete → trial2-recorded` | CTA | 學生按「記錄第二次結果」，**且當下仍為 sharp**；此時才寫入 record |
| `trial2-recorded → compare` | 自動 | record 已寫入 |
| `trial3-move-object → trial3-search-screen` | 自動 | `u === 5`（途中經過的 `u=10` 與 bench 溢出位置不觸發任何 transition） |
| `trial3-search-screen → trial3-no-real-screen-image` | CTA | 學生按「我找不到清楚實像」。CTA 的**解鎖條件**為 `searchedZones` 三區皆已探索；解鎖本身不 transition |

補充規則：
- `trial1-complete`／`trial2-complete` 內屏幕仍可微調；若學生移出 sharp，「記錄」CTA 停用（並提示「再回到最清楚的位置」），回到 sharp 後重新啟用。移出 sharp **不會**退回 `*-find-screen`。
- `trial3-search-screen` **沒有 sharp completion**，沒有任何以 `effectiveClarityLevel` 觸發的 transition。
- 每個條件只在其 state 內檢查；離開該 state 後再次滿足不得重複觸發（§8.3）。

### 8.2 各狀態

**welcome**：「為什麼投影機的屏幕放錯位置，畫面就會模糊？」 CTA「開始實驗」。不顯示公式。

**mission**：「桌上有一支蠟燭、一片凸透鏡和一面屏幕。現在屏幕上的影像很模糊。」→「把屏幕移到影像最清楚的位置。」 CTA「動手試試看」。

**trial1-find-screen**：僅屏幕可操作；`f=10, u=30`；屏幕自 20 cm 開始（Lv3，見 §7.4）。
- 首次拖動：「試試看哪個位置比較清楚。」
- 接近 sharp band：「快找到了。」
- 進入 sharp（自動進入 `trial1-complete`）：「就是這裡。影像現在最清楚。」顯示 CTA「記錄第一次結果」。

**錯誤方向提示**：不因單次 1 cm 判斷。僅當**連續遠離**理論像距方向且**累積 ≥ 3 cm** 時觸發；方向以 `theoreticalV − s` 由 model 計算；每個 trial 最多自動出現一次：「剛才影像變得更模糊了。試試另一個方向。」只適用於有限目標像距的 trial（見 §8.5）。

**trial1-complete**（影像最清楚，等待學生記錄）：顯示 CTA「記錄第一次結果」。按下後進入 `trial1-recorded`，寫入 `焦距 10 cm／物距 30 cm／清楚像距＝{observedScreenPosition}／倒立、較小`（像距為按下記錄當下的屏幕位置，不是 15 的硬編碼）。`trial1-recorded` 時余老師：「第一筆證據有了。接下來只改一個地方。」

**trial2-move-object**：屏幕與透鏡鎖定，蠟燭可拖（`12–35`）。「把蠟燭移到離透鏡 15 cm 的位置。」完成：「好，這次只有物距改變。」強化「只改一個條件」。

**trial2-find-screen**：屏幕仍在 Trial 1 記錄的 `observedScreenPosition`（示例 15 cm），理論 30 cm（此時 `e ≥ 14.5`，Lv4）。畫面立即顯示「原本清楚的影像現在模糊了。」余老師：「蠟燭的位置改了，原本的屏幕位置也不再清楚。再找一次。」進入 sharp（示例 `s≈30`，實際為 29.5–30.5 內的 snapped 位置）：「影像又清楚了。」並讓學生看出像變大、仍倒立。CTA「記錄第二次結果」。

**compare**：畫面中央 Evidence Compare Card，**資料取自實際記錄**（`f`、`u`、`observedScreenPosition`、`imageSize`），不得 hard-code。下表的 15／30 **僅為示例值**，正式 UI 必須讀 record（學生若記錄 14.5，就顯示 14.5）：

| | 第一次 | 第二次 |
|---|---:|---:|
| 焦距 | 10 cm | 10 cm |
| 物距 | 30 cm | 15 cm |
| 清楚像距（示例） | {t1.observed}＝15 cm | {t2.observed}＝30 cm |
| 影像大小 | 較小 | 較大 |

下方：「✅ 兩次只有物距不同，可以直接比較。」
問題一：蠟燭靠近凸透鏡後，清楚影像的位置怎麼變？（更靠近透鏡／**更遠離透鏡**／沒有改變）
問題二：影像大小呢？（變小／**變大**／一樣）
腳本：「你剛才已經找到一個規律了。」→「在還能形成實像的情況下，物體往焦點靠近時，清楚影像的位置會往更遠處移，而且影像會變大。」**「在還能形成實像的情況下」不得省略。**

**trial3-move-object**：「如果再把蠟燭往透鏡靠近，會一直有清楚的屏幕位置嗎？」→「把蠟燭移到 5 cm。」（範圍解鎖為 `5–35`；途中穿越行為依 §6.4。）

**trial3-search-screen**：蠟燭到達 5 cm 後才開始搜尋追蹤。
- 區域（連續半開區間，以屏幕 snapped 位置歸屬，0.5 cm snap 下無空隙）：近 `8 ≤ s < 17`、中 `17 ≤ s < 29`、遠 `29 ≤ s ≤ 40`。
- 首次移動：「這次也試著找找看。」
- 探索兩區仍未找到：「目前還沒有找到清楚的位置。」
- 三區皆探索：「你已經檢查過近、中、遠的位置了。看起來問題可能不在你找得不夠仔細。」→「這次可能真的沒有能接到清楚影像的位置。」
- CTA「我找不到清楚實像」**僅在三區都探索後解鎖**；解鎖不自動換 state，須學生按下才進入 `trial3-no-real-screen-image`；不得提前公布「沒有實像」。

**trial3-no-real-screen-image**：「不是你找得不夠仔細。這一次，屏幕本來就接不到清楚實像。」→「但是如果不用屏幕，而是直接透過透鏡看呢？」CTA「從透鏡後面看」。

**trial3-view-through-lens**：屏幕淡化、右側出現眼睛／觀察位置提示、顯示進入眼睛的光線、折射光線向後延伸以虛線、透鏡左側呈現正立放大的虛像。「你現在看得到一個正立、放大的蠟燭。」→「可是剛才屏幕怎麼都接不到它。這和前兩次有什麼不同？」學生先觀察，之後才說：「這種只能透過透鏡看到、卻不能直接接在屏幕上的像，叫做『虛像』。」

**concept**：此刻才正式出現兩詞，並搭配三輪實驗：
- 實像：光線真的在某個位置會合，可以投在屏幕上。
- 虛像：光線沒有真的在看起來的影像位置會合；眼睛能看到，但屏幕接不到。

之後才出現公式，標題為「**剛才找到的位置，其實可以用這個關係算出來。**」（不寫「請記住公式」），並代入學生 record 的 `f`、`u`（Trial 1：`f=10, u=30 → v=15`；Trial 2：`f=10, u=15 → v=30`，此為公式計算值），再與學生自己找到的 `observedScreenPosition` 並列（如「你找到 14.5 cm，公式算出 15 cm，在誤差範圍內」），讓公式成為解釋實驗結果的工具，而不是取代學生的證據。

### 8.3 重複操作

Trial 已正式記錄後，若學生把器材移回同一結果：「這筆結果已經記好了。接下來看看只改變蠟燭位置後會發生什麼。」禁止再次加分、新增重複紀錄、重播大型成功動畫。

### 8.4 語氣規則

- 尚未操作：「試試看。」
- 已操作但無結論：「你看到什麼變化？」
- 第二輪：「這次只改一個地方。」
- 做錯：不說「錯了」，改「剛才哪個結果變得更明顯？」
- 找到結果：不說「正確答案是……」，改「你剛才找到的是……」

### 8.5 停滯提示（依「無有效進展」，不以計時催促）

- **Hint 1**：「看看屏幕上的影像是變清楚，還是變模糊。」
- **Hint 2**：「如果越移越模糊，可以試試另一個方向。」
- **Hint 3**（僅適用存在**有限目標像距**的 trial，即 `imageType = real` 且 `projectionWithinBench`）：「清楚的位置就在你目前位置的左邊／右邊。」方向**必須**由 `theoreticalV − screenPosition` 計算，不得 hard-code；不得直接給「15 cm」。
- **Trial 3（`u < f`）完全停用方向型 Hint 3**，改採搜尋進度提示：近區 → 中區 → 遠區（例如「你還沒檢查過遠一點的位置。」）。
- **`u = f`（含穿越途中）以及 `projectionWithinBench=false` 的狀態同樣不得產生左右方向提示**，也不得觸發 §8.2 的錯誤方向提示。

## 9. 研究手冊 2.0

完成前兩次實驗後進入，先讓學生看到**自己的真實資料**，不得重置成假範例。Compare Card 與手冊皆讀取 `observedScreenPosition`。

- **Level A｜幫我整理**：系統以模板帶入「我把物距從 **{trial1.u} cm** 改成 **{trial2.u} cm**。清楚像距從 **{trial1.observedScreenPosition} cm** 變成 **{trial2.observedScreenPosition} cm**。」（示例為 30→15、15→30；實際顯示學生記錄值，如 14.5，不得 hard-code。）學生完成：「所以當物體往凸透鏡靠近時，在仍能形成實像的範圍內，清楚影像會＿＿＿＿。」（離透鏡更遠）；影像大小會＿＿＿＿。（變大）
- **Level B｜自己說**：請用第一次和第二次的數據說明你發現的規律。自由輸入，Evidence Card 保留在旁，不需靠記憶抄數據。
- **Level C｜研究員挑戰**：這兩筆資料支持了什麼結論？哪些事情還不能只靠這兩筆資料判斷？可接受概念：尚不能知道所有物距都如此；尚不能知道不同焦距是否相同；尚不能由兩筆資料直接證明完整公式。

## 10. 資料 Schema

### 10.1 每筆 trial

```text
trial                    1 | 2 | 3
f                        cm
u                        cm，正數
theoreticalV             number | null    （u = f → null；不得存 Infinity）
observedScreenPosition   number | null    （Trial 3 為 null）
magnification
absoluteMagnification
imageType                real | virtual | infinite
imageOrientation         upright | inverted | undefined   （u = f → undefined）
imageSize
projectable              true ⇔ u > f（理論上可成屏幕實像）
projectionWithinBench    boolean（8 ≤ theoreticalV ≤ 40；virtual／infinite 為 false）
clarity                  記錄當下的 effectiveClarityLevel（完成記錄必為 1／sharp）
rawClarityLevel          1–4 | null（imageType≠real 時為 null）
changedVariables
```

邊界例：`f=10, u=10.5 → v=210`：`imageType=real, projectable=true, projectionWithinBench=false`。

### 10.2 studentConclusion

```text
studentConclusion: { level, relationPosition, relationSize, freeText, evidenceText, limitationText }
```

### 10.3 Trial 3 額外資料

```text
searchedZones: ["near", "middle", "far"]    （僅 trial3-search-screen 狀態內累計；區間為 `8 ≤ s < 17`／`17 ≤ s < 29`／`29 ≤ s ≤ 40`）
screenImageFound: false
```

## 11. 挑戰題

1. **模糊投影**：蠟燭和透鏡都沒動，屏幕影像突然變模糊，先調整哪個？核心：屏幕位置；「因為在其他條件不變時，清楚實像只會出現在特定位置附近。」
2. **焦距內**：`f=10, u=8`，可以把清楚影像接在屏幕上嗎？不可以；比較可能看到正立放大的虛像。**不得要求先算公式才能答。**
3. **放大鏡**：用放大鏡看字可見正立放大的字，白紙放後面接不到。為什麼？核心：物體在焦距內形成虛像，眼睛看得到，但不能直接投到紙上。（最重要的 transfer test）

## 12. 進階／自由探索模式

主流程完成後才強調入口。可控制 `f`、`u`、`s`，顯示理論像距、放大率、成像類型、光線圖、公式計算；此處才允許 slider／select／number input 成為主要控制。

Guided Mode 是**做實驗**，Advanced Mode 是**研究模型**；Advanced 的參數面板不得塞回第一幕。

**Controlled-variable 規則：** 若兩筆資料同時改變 `u` 與 `f`，Evidence Card 不得顯示「✅ 可以直接比較」，必須顯示「⚠ 這兩次同時改變了兩個條件，還不能知道是哪個因素造成結果。」

## 13. Accessibility

所有互動走同一個 physics／state engine，不得出現 mouse 一套、keyboard 另一套結果。必要支援：Mouse drag、Touch drag、Keyboard arrows（含 PageUp／PageDown）、Enter／Space、visible focus、screen reader label、reduced motion。

**Reduced motion**（`prefers-reduced-motion: reduce`）：不做大型 bounce、快速光線動畫、角色滑入、連續 pulsing；物件位置與物理結果必須完全相同。

## 14. 驗收

### 14.1 數學單元測試（不得出現 NaN、Infinity serialization、sign error、虛實像分類錯誤）

| 輸入 | 期望 |
|---|---|
| `f=10,u=30` | `v=15, m=-0.5`，real／inverted |
| `f=10,u=20` | `v=20, m=-1` |
| `f=10,u=15` | `v=30, m=-2` |
| `f=10,u=10` | `imageType=infinite, theoreticalV=null` |
| `f=10,u=8` | `v=-40, m=+5`，virtual／upright |
| `f=10,u=5` | `v=-10, m=+2` |
| `f=10,u=10.5` | `v=210`，real，`projectionWithinBench=false` |
| `f=10,u=12` | `v=60`，real，`projectionWithinBench=false`（Trial 2 下限） |

### 14.2 Clarity Gate

以 `f=10,u=30,v=15` 測 `s = 15 / 15.5 / 16 / 18 / 20 / 22 / 30`，期望依序為 Lv1／Lv1／Lv2／Lv3／**Lv3**／**Lv4**／Lv4（`t=0.75`，邊界 `0.75 / 2.25 / 5.25`；`s=20` 為 Trial 1 初始值，`e=5` 必須是 Lv3；`s=22` 是 Lv4）。

bench 外 effective level（`s=40`，直接以 `theoreticalV` 測 clarity 函式）：

| theoreticalV | e | raw | effective |
|---|---|---|---|
| 40.5 | 0.5 | 1 | **2**（不得 1） |
| 42 | 2 | 2 | 2 |
| 44 | 4 | 3 | 3 |
| 60 | 20 | 4 | 4 |
| 210（`u=10.5`） | 170 | 4 | 4 |

另需測：`u=10`（infinite）、`u=5`（virtual）恆為 effective Lv4；`u=12`（real、bench 外）在**任何** `s` 皆不得為 effective Lv1。Trial 3 搜尋區邊界：`16.5`、`28.5` 必須各有且只有一個區域歸屬。

### 14.3 Pointer／Touch／Keyboard

- Pointer：Trial 1（30/10→15）、Trial 2（15/10→30）可完成；Trial 3（5/10）任何 `s` 皆非 sharp。
- Touch：不得只用模擬 click；驗證 pointerdown／move／up、pointer capture、drag cancel、viewport scroll interaction；手指離開物件後狀態正常 settle。
- **器材外實驗桌區域上下滑，頁面仍能正常 `pan-y`**（新增）。
- 拖蠟燭／屏幕時不觸發頁面滑動。
- Keyboard：不用滑鼠完成 Trial 1／2／3，含 focus screen、移動、記錄、focus candle、移動、探索 Trial 3、進入虛像觀察、完成研究手冊、進入挑戰題；Trial 2 蠟燭 30→15 以 `PageUp` 3 次可到位。
- Trial 3 自 15 拖到 5 途中經 `u=10`：無 NaN／Infinity UI、無閃爍、不觸發完成。
- Trial 2 蠟燭不可低於 12 cm。

### 14.4 Research Record

Compare Card 必須讀取真實記錄並顯示 `observedScreenPosition`；修改初始條件後仍須由紀錄產生；`theoreticalV` 不得出現在 Guided Mode UI。須以桌機 snap 下的非整數記錄（如 Trial 1 記 14.5、Trial 2 記 29.5）測試：Compare Card、研究手冊 Level A、Trial 記錄皆顯示 14.5／29.5，而非 15／30。記錄完成條件須測 `abs(observed − theoreticalV) ≤ t` 與 `projectionWithinBench`。

### 14.5 版面

- **390 × 844**：無水平 overflow；三件器材同時可理解；不需水平 scroll；touch target ≥ 44px；余老師提示不遮器材；CTA 不遮操作區；Evidence Card 可完整閱讀。
- **1280 × 800**：實驗桌為第一視覺焦點；余老師與指示在右側；無巨大空白；數值控制不搶注意力；器材距離保持關聯感。

### 14.6 Console Gate

完整流程 `welcome → trial1 → trial2 → compare → trial3 → virtual → notebook → challenges`：console error = 0、uncaught exception = 0、failed resource = 0。

### 14.7 Student-flow Gate

技術全綠不代表成功。第一次使用者驗收，觀察者不得教，只說「請照畫面完成這個實驗」，然後問：
1. 學生是否知道下一步要做什麼？
2. 是否真的直接操作蠟燭、屏幕，而不是先找參數面板？
3. 完成後是否能自己說出「物體靠近焦點時，清楚實像會往更遠處移，而且變大」與「焦距內的虛像不能直接接在屏幕上」？

升級門檻：至少 5 名第一次操作者；≥ 4/5 能獨立完成主流程；≥ 4/5 能用自己的話表達至少一個正確光學關係。若大量學生不知道拖什麼、一直找 slider、Trial 3 以為網站壞掉、無法理解比較卡、做完只記得數字，則**不得複製到其他實驗站**，應先修改本 Prototype。

### 14.8 視覺驗收重點（非 SVG 精美度）

1. 第一眼能看懂三器材關係；2. 可拖物件一眼可辨；3. 模糊與清楚真的看得出差異；4. 第二次實驗明顯感受到「原來的屏幕位置失效」；5. 虛像情境明顯不同於前兩輪；6. 余老師在引導觀察，而非洩漏答案。

## 15. 範圍與素材

**第一版刻意不做**：凹透鏡、多種焦距任務、2F 完整分類表、相機、眼球、投影機內部結構、多透鏡、屈光度、光學作圖考試模式、大量計算題、成就系統、排行榜。

**素材角色**（先定角色，不立即生圖）：蠟燭、凸透鏡＋支架、屏幕＋支架、蠟燭實像、蠟燭虛像、余老師、簡化觀察眼睛 icon。影像最好共用同一蠟燭來源做 transform。

## 16. 設計原則

- 若須在「數值控制更方便」與「學生更像在操作真實實驗」之間選擇，Guided Mode 優先選後者；Advanced Mode 才服務前者。
- 學生第一次看到「物距 30 cm」與「清楚像距 {observedScreenPosition} cm」時，後者必須代表**「我剛才自己找到的結果」**，而不是網站先告訴我的理論答案。到 concept 階段才把 `theoreticalV = 15` 拿來和 `observedScreenPosition`（14.5／15／15.5）比較（這是 Science Lab 2.0 與一般參數模擬器最大的差異）。

### 最終驗收三問

1. 沒有老師陪，我知道下一步做什麼嗎？
2. 我感覺自己在做實驗，還是在調參數？
3. 做完之後，我能不能用自己的話說出從兩次實驗發現的規律？

三題都「可以」，才有資格成為 Science Lab 2.0 / Lab Spec v2 Prototype。

## 17. 鎖定決策（進實作前須確認）

1. Guided Mode 透鏡固定。
2. 手機不採水平捲動實驗桌。
3. 主流程只直接操作蠟燭與屏幕。
4. Slider／Select 降到自由探索模式。
5. Trial 1：`f10 / u30 / v15`，屏幕初始 20 cm（Lv3）。
6. Trial 2：`f10 / u15 / v30`，蠟燭範圍 `12–35`。
7. Trial 3：`f10 / u5 / v-10`，蠟燭範圍解鎖為 `5–35`。
8. Trial 3 必須先實際搜尋近、中、遠位置，不能直接公布「沒有實像」。
9. 焦點穿越與 bench 溢出為正式狀態，不得有 NaN／Infinity UI／閃爍。
10. 理論值（`theoreticalV`）與學生觀察值（`observedScreenPosition`）分離；Guided UI 與 Compare Card 只顯示後者。
11. 方向型 Hint 由 model 計算，且 `u ≤ f` 與 bench 外狀態完全停用。
12. 公式在實驗與比較完成後才出現。
13. Prototype 通過第一次使用者測試後，才正式推廣到其他 Science Lab 2.0 研究站。

## 18. 流程順序

```text
A：Spec v1.2 → 使用者審核
B：repo／舊頁重用盤點與 implementation task breakdown（含新頁覆蓋或並存的 migration strategy）
C：physics／clarity model 與單元測試，再決定是否進入正式實作
```

新頁覆蓋舊頁或並存，暫不在本規格決定，待 B 階段讀完現有凸透鏡頁、入口、builder、測試與連結關係後再定。
