# Science Lab 2.0 Pilot #6 — 電路接線與量測 Guided Lab

版本：**Spec v1.0**  
狀態：**規格定案候選；尚未進 B1 production 實作**  
基準 main：`b4696e5c90826fd401610dc2d645ab7f3eb3bbb0`

---

## 0. 目的與邊界

Pilot #6 要把現有「選接法／選參數 → 按通電驗證 → 一次看到全部數值」的操作，改成真正的 Guided 實驗：

> **學生自己接線 → 自己操作開關 → 自己把電表接到想量的位置 → 直接看到電表讀值與燈泡狀態 → 記錄自己的量測 → 比較兩組證據 → 最後才命名串聯、並聯與規則。**

現有公開頁：

`tools/circuit-lab.html`

保持 **0 production diff**，繼續作為 Advanced Mode。它目前已被既有 Researcher / browser / integration tests 鎖住，不在 Pilot #6 修改範圍。

新 Guided Prototype：

`tools/science/circuit-guided.html`

在 rollout 前必須維持：

- `noindex`
- self canonical
- unlisted
- 不進 sitemap
- 不進 science index
- 不進 `ziyuan.html`
- 不加入 legacy ↔ Guided 連結

---

## 1. 唯一核心問題

Welcome 只問：

> **同一顆電池，多接一顆燈泡，電池送出的總電流一定會變小嗎？**

副句：

> 不先看公式。你會真的把導線接起來，再用電流表和電壓表找答案。

學生完成後至少能用自己的證據回答：

> **不一定。兩顆燈怎麼接，會改變整個電路的電流。只有一條完整路徑時，多一顆相同燈泡會讓總電流變小；兩顆燈各有自己的路徑時，總電流反而增加。**

並能修正常見迷思：

> **燈泡轉換的是電能，不是把同一路徑中的電流「用掉」。**

---

## 2. 固定實驗條件

Guided v1 不做自由參數探索。

固定：

- 理想電池：6 V
- 燈泡 1：固定電阻模型 6 Ω
- 燈泡 2：固定電阻模型 6 Ω
- 理想導線
- 理想開關
- 電流表 ×1
- 電壓表 ×1

學生能改的只有：

- 導線連接
- 開關開／關
- 電流表位置與方向
- 電壓表位置與方向

學生不能直接選：

- 串聯
- 並聯
- 等效電阻
- 總電流
- 支路電流
- 正確答案

串／並聯與所有讀值都必須由接線推導。

---

## 3. 固定零件與端點

固定零件：

- 電池
- 開關
- 燈泡 1
- 燈泡 2
- 電流表
- 電壓表

端點共 12 個：

```text
bat+
bat-

sw.a
sw.b

L1.a
L1.b

L2.a
L2.b

A.+
A.-

V.+
V.-
```

元件本身不拖曳；學生只新增／刪除：

```text
wire = { from, to }
```

---

## 4. Raw learner state

Model / engine 的 raw source state 只允許保存學生真的做過的操作：

```js
{
  wires,
  switchClosed
}
```

另由 engine 管理：

- phase
- compare learner answers
- notebook learner fields
- challenge learner choices / attempts / notes
- challenge learner wiring deltas

不得存：

- topology
- node graph
- equivalent resistance
- current
- voltage
- power
- brightness
- correct
- ready
- expected answer

所有 derived truth 都必須重算。

---

## 5. 接線操作

### 5.1 主要操作：點兩次

1. 點端點 A。
2. A 顯示「已選起點」。
3. 點端點 B。
4. 送出 `CONNECT(A, B)`。
5. 再點同一端點或按 Esc：取消。

### 5.2 Drag 是增強，不是唯一操作

可由端點拖到端點建立導線，但 mouse / touch / keyboard 都必須收斂到同一 engine action。

### 5.3 導線清單

實驗桌下方永遠提供可讀／可刪的導線清單：

> 電池正極 — 開關左端　[移除]

這同時是：

- 手機可靠刪線方式
- 鍵盤替代方式
- 螢幕閱讀器的電路文字描述

---

## 6. 開關是真實實驗操作，不是 CTA

**不得使用「閉合開關並觀察」主按鈕。**

開關必須是實驗桌上的可操作元件：

- 點擊
- touch
- keyboard Enter / Space

開關一閉合，電路就立即重新求解：

- 燈泡狀態立即改變
- 電流表立即更新
- 電壓表立即更新
- 短路／開路警示立即更新

主 CTA 只負責：

> **記錄這次量測**

只有當該 phase 的 **結構條件 + 讀值條件 + 電表方向條件** 全部成立，而且開關已閉合時才能啟用。

因此：

> **觀察本身是實驗桌的即時反應；CTA 不負責產生答案。**

---

## 7. 接錯不是單純「答錯」

### 7.1 開路

若沒有完整 conductive path：

> **目前沒有完整的電流路徑。**

不自動補線、不顯示正確接法。

### 7.2 電源短路

如果電池正負端經：

- wire
- closed switch
- ideal ammeter

形成近零電阻路徑：

model 回：

```text
status: source-short
current: null
```

顯示安全警示：

> 真實電路可能產生很大的電流並損壞電池、導線或電表。本站不顯示假的「無限大電流」。

**任何合法 raw wiring 都不得產生 `Infinity` / `NaN`。**

### 7.3 燈泡被旁路

若某燈兩端落在同一 conductive node：

- 該燈熄滅
- 回 `lamp-bypassed`
- 不把它和 source-short 混為一談

### 7.4 電壓表串進唯一導電路徑

理想電壓表視為 open circuit：

- 主迴路電流 0
- 燈泡熄滅
- 若兩端電位可推導，電壓表可讀到約 6 V

Concept 前不直接說「電壓表要並聯」。

### 7.5 電流表直接跨電池

必須永遠判為：

`source-short`

不給電流數值。

### 7.6 電表反接

反接不是 engine error。

例如顯示：

`−1.0 A`

並提示：

> 負號表示電流方向和電表正負端的約定相反。交換電表兩端，再看看。

**但該 phase 不允許記錄負讀值。**

正式 record gate 要求目標電流表讀值 > 0；學生必須先修正極性。

---

## 8. Main flow

```text
welcome
→ mission

→ baseline-build
→ baseline-measure

→ trial1-build
→ trial1-measure
→ compare1

→ trial2-build
→ trial2-total
→ trial2-branch1
→ trial2-branch2
→ compare2

→ inference
→ concept

→ notebook

→ challenge-1
→ challenge-2
→ challenge-3

→ complete
```

---

## 9. Welcome

主問題：

> **同一顆電池，多接一顆燈泡，總電流一定會變小嗎？**

副句：

> 先不要猜。你會真的接兩種電路，再用自己的量測回答。

CTA：

> 開始接電路

Concept 前不得顯示：

- 串聯
- 並聯
- 等效電阻
- 歐姆定律
- `I = V/R`
- 總電阻變大／變小
- 串聯電阻／並聯電阻
- 支路電流總和

洩漏掃描比對**完整詞**，不得用「串」「並」單字掃描，避免誤傷「並排」「並且」。

---

## 10. Mission

余老師：

> 今天不是先選「串聯」或「並聯」。你只負責把電路真的接出來，再相信自己的量測。

工具說明只講操作事實：

### 電流表

> 要量某一條路上的電流，就要讓那股電流真的通過電流表。

### 電壓表

> 要量某個元件兩端的電壓，就把兩個測量端接到那個元件的兩端，不必切斷原本電路。

不先教正式串／並術語。

---

# PART A — 主實驗

## 11. Baseline：一顆燈

目標是建立一顆燈的量測基準。

任務條件：

- 開關能控制整個 conductive circuit
- L1 在 active path
- L2 不在任何 active conductive path
- 電流表量總電流
- 電壓表量 L1 兩端
- 開關開啟時所有電流 = 0
- 開關閉合時 L1 亮
- 電流表讀值 > 0

**不要求某一組固定 wire list。任何電氣等價接法都可過。**

### Baseline gate

結構：

- `L1 active = true`
- `L2 active = false`
- `ammeterPlacement = total-current`
- voltmeter nodes = L1 兩端節點
- switch controls all active current paths

讀值：

- switch open → all currents = 0
- switch closed → battery current = 1.0 A
- ammeter = +1.0 A
- L1 voltage = 6.0 V
- L1 power = 6 W

CTA：

> 記錄這次量測

Record 1 只存 raw wiring snapshot + switch source state；derived values 重算。

Evidence 顯示：

- 總電流 1.0 A
- L1 電壓 6.0 V
- L1：基準亮度

---

## 12. Trial 1：兩顆燈，只有一條完整路徑

Concept 前不要寫「串聯」。

任務：

> 保留同一顆 6 V 電池，把第二顆燈也接進去，而且從電池出發再回到電池之間，只能有一條完整的電流路徑。

### Trial 1 gate

結構條件：

- L1 / L2 都在 active conductive path
- L1 current = L2 current ≠ 0
- 兩燈位在同一條 single-path chain
- 拿掉 L1 → L2 current = 0
- 拿掉 L2 → L1 current = 0
- switch open → all currents = 0
- ammeter = battery total current
- voltmeter nodes = L1 兩端節點

讀值：

- total current = +0.5 A
- L1 current = 0.5 A
- L2 current = 0.5 A
- L1 voltage = 3.0 V
- L2 voltage = 3.0 V

燈泡：

- 兩顆同為較暗

CTA：

> 記錄這次量測

Record 2。

---

## 13. Compare 1

Evidence：

| | 一顆燈 | 兩顆燈、只有一條路 |
|---|---:|---:|
| 電池 | 6 V | 6 V |
| 總電流 | 1.0 A | 0.5 A |
| L1 電壓 | 6.0 V | 3.0 V |
| 燈泡狀態 | 基準亮度 | 較暗 |

Q1：

> 多接一顆相同燈泡後，這一次總電流怎麼變？

正解：減少。

Q2：

> 這組資料最多能支持哪一句？

A. 任何接法，多一顆燈一定讓總電流減少。  
B. **在這種只有一條完整路徑的接法中，多一顆相同燈泡後，總電流變小。**  
C. 第二顆燈把第一顆燈的電流用掉。

正解 B。

選 A：

> 目前只有這一種接法的證據，還不能推到所有接法。

仍不顯示「串聯」。

---

## 14. Trial 2：讓兩顆燈各有自己的路

任務：

> 重新接線，讓電流通過開關後，有兩條不同的路可以回到電池：
>
> - 一條經過 L1
> - 一條經過 L2

仍不寫「並聯」。

### Trial 2 基本 topology gate

- L1 / L2 兩端各連到同一對 electrical nodes
- 兩燈都 active
- switch open → L1 / L2 current 都 = 0
- 因此開關必須能在分岔前控制兩條 active branches
- switch closed → L1 current = 1.0 A、L2 current = 1.0 A
- battery total current = 2.0 A
- L1 voltage = 6.0 V、L2 voltage = 6.0 V

亮度：

> **L1、L2 與 Baseline 完全相同的 brightness band。**

本站是理想 6 V source，不能為了「接近參考」文字而故意畫暗。若學生文字需要留真實世界空間，寫：

> 與基準相同（本站理想模型）。

---

## 15. Trial 2A：量總電流

學生自行把電流表放在分岔前／匯合後的 total-current path。

Gate：

- Trial 2 基本 topology 成立
- ammeter current = battery current
- ammeter reading = +2.0 A

CTA：

> 記錄總電流

Record 3。

---

## 16. Trial 2B：量 L1 那一條路

學生自行移除／重接電流表。

**不能用「讀到 1.0 A」判斷是不是 L1，因為兩支路都同為 1.0 A。**

Gate 必須同時看結構與讀值：

- Trial 2 基本 topology 成立
- ammeter edge 位於 L1 所在 active branch
- ammeter 不位於 L2 branch
- ammeter current = L1 current
- ammeter current ≠ battery total current
- ammeter reading = +1.0 A

如果電流表放在 L2：

> 讀值雖然也是 1.0 A，但 **Trial 2B 不得通過**。

CTA：

> 記錄第一條路

Record 4。

---

## 17. Trial 2C：量 L2 那一條路

Gate：

- Trial 2 基本 topology 成立
- ammeter edge 位於 L2 active branch
- ammeter 不位於 L1 branch
- ammeter current = L2 current
- ammeter current ≠ total current
- ammeter reading = +1.0 A

CTA：

> 記錄第二條路

Record 5。

---

## 18. Compare 2

Evidence：

| | 一顆燈 | 兩顆燈、各有自己的路 |
|---|---:|---:|
| 電池 | 6 V | 6 V |
| 總電流 | 1.0 A | 2.0 A |
| L1 電壓 | 6.0 V | 6.0 V |
| 每顆燈亮度 | 基準 | 與基準相同（本站理想模型） |

另顯示學生實測：

```text
總電流 2.0 A
第一條路 1.0 A
第二條路 1.0 A
```

Q1：

> 這次多接一顆燈，總電流怎麼變？

正解：增加。

Q2：

> 2.0 A 和兩條路的 1.0 A、1.0 A 有什麼關係？

正解：

> **總電流等於兩條路的電流加起來。**

Concept 前不用「支路電流總和」等正式詞。

---

## 19. Inference

並排兩組證據：

第一組：

```text
一顆燈 1.0 A
→ 兩顆燈、只有一條路 0.5 A
```

第二組：

```text
一顆燈 1.0 A
→ 兩顆燈、各有自己的路 2.0 A
```

余老師：

> 同樣都是多接一顆燈，結果卻相反。

Q：

> 真正重要的只是燈泡數量嗎？

正解：

> 不是，接線方式也很重要。

CTA：

> 看看這兩種接法叫什麼

---

## 20. Concept：第一次正式命名

此刻第一次顯示：

# 串聯與並聯

### 串聯

> 元件接在同一條電流路徑中，叫做串聯。

用學生 Trial 1：

- 6 V
- 6 Ω + 6 Ω
- total current 0.5 A

再顯示：

`R_eq = 6 Ω + 6 Ω = 12 Ω`

### 並聯

> 元件各自形成不同路徑，而且兩端接在同一對節點上，叫做並聯。

用學生 Trial 2：

- 每燈 6 V
- 每 branch 1.0 A
- total 2.0 A

再顯示：

兩個 6 Ω 並聯 → `R_eq = 3 Ω`

最後才正式使用：

`I = V / R`

Baseline：

`6 / 6 = 1.0 A`

串聯：

`6 / 12 = 0.5 A`

並聯：

`6 / 3 = 2.0 A`

收斂：

> 多接一顆燈到底讓總電流增加還是減少，不是只看燈泡數量，而要看它怎麼接。

---

## 21. 電流不是被燈泡「用掉」

Concept 明確說：

> 燈泡把電能轉成光與熱；在同一條穩定直流路徑中，流進燈泡與流出燈泡的電流相同。

但不能只靠文字；Challenge 2 必須讓學生重新實測。

---

## 22. 模型邊界

本站是理想化模型：

- 電池固定 6 V
- 導線電阻忽略
- 閉合開關近似 0 Ω
- 燈泡固定 6 Ω
- 電流表近似 0 Ω
- 電壓表近似 ∞ Ω

真實世界：

- 電池有內阻
- 導線有電阻
- 燈絲升溫後電阻會改變
- 電表也有內阻
- 真實短路不是「無限大」，而是可能非常大

---

# PART B — Notebook

## 23. Level A

由 records 重算：

1. Baseline total current = 1.0 A
2. one-path two-lamp：總電流「減少」
3. two-path two-lamp：總電流「增加」
4. 「多接一顆燈一定讓總電流變小」→ 不對

不得信任 persisted `correct`。

## 24. Level B

> 為什麼同樣增加第二顆燈泡，一次總電流從 1.0 A 降到 0.5 A，另一次卻從 1.0 A 增加到 2.0 A？

只要求實質 learner text，不用 keyword 判科學真值。

## 25. Level C

Q1：

> 用至少兩筆自己的量測反駁「多接燈泡一定讓總電流變小」。

Q2：

> 本站模型和真實電路相比有什麼限制？

學生寫過 limitation 後才顯示 Ideas：

- 電池有內阻
- 導線有電阻
- 燈絲電阻會隨溫度改變
- 電表有內阻
- 真實電路還有保護元件
- 本站是低電壓理想模型

---

# PART C — Challenges

## 26. Challenge 1：電壓表接錯了（文字題）

情境：

> 小明為了量燈泡電壓，把原本通往燈泡的導線拔掉，再把電壓表接進缺口。

結果：

- 燈不亮
- 電流表 0 A

正解：

> 恢復原本電流路徑，再把電壓表兩端接到燈泡兩端。

Challenge 1 不要求 bench wiring。

---

## 27. Challenge 2：電流真的被燈泡用掉了嗎？（互動 bench）

這題刻意使用：

> **兩顆相同燈、只有一條路的電路。**

原因：主實驗已得到 0.5 A，可直接把電流表移到三個位置，形成更強的迷思反證。

Engine 提供 challenge 固定起始 circuit（不是學生前一題的 wires）：

```text
battery → switch → L1 → L2 → battery
```

學生依序把電流表量在：

1. L1 前
2. L1 與 L2 中間
3. L2 後

每次要求正極性再記錄。

正確結果全部：

`+0.5 A`

Evidence：

```text
前：0.5 A
中：0.5 A
後：0.5 A
```

問題：

> 哪一句最符合你的量測？

正解：

> **同一條穩定電流路徑中，燈泡前、中、後的電流相同。**

成功文字：

> 燈泡轉換的是電能，不是把電流消耗掉。

### Challenge 2 persistence

Challenge base circuit 由 `challengeId` 的 immutable scenario 產生。

Persist：

- 不保存自動生成的 base circuit
- 只保存學生在 base 上做的 raw wiring / meter change actions、三筆 raw record snapshots、answer / attempts / note

Restore：

1. rebuild challenge base circuit
2. replay learner deltas/actions
3. derive all readings again

---

## 28. Challenge 3：拿掉一條路（互動 bench）

Engine 提供固定起始 circuit：

- 兩顆相同燈各有自己的路
- total = 2.0 A
- L1 branch = 1.0 A
- L2 branch = 1.0 A

學生實際移除 L2 那條 branch 的必要 wire。

重新量：

- L1 ≈ 1.0 A
- total ≈ 1.0 A

正解：

> **L1 維持本站相同亮度／約 1.0 A，總電流降為約 1.0 A。**

這補上舊 `docs/circuit-lab-spec.md` 有規格但 legacy page 沒有學生操作的案例。

### Challenge 3 persistence

同 Challenge 2：

- immutable engine-provided base
- persist only learner deltas / raw records / answer metadata
- restore = base + reducer replay

---

## 29. Complete

只收斂四句：

1. 多接一顆燈，總電流不一定變小。
2. 串聯只有一條路；增加相同負載時，總電流可能下降。
3. 並聯增加路徑後，總電流可能增加；總電流等於各路徑電流加起來。
4. 燈泡轉換電能，不會把同一路徑中的電流「用掉」。

最後提醒：

> 你使用的是理想模型；真實電池、燈泡、導線與電表還有額外因素。

---

# PART D — Model contract

## 30. Wire graph

Model 順序先只把：

- wires
- closed switch

做 union-find。

**不能先把 ammeter 身分抹掉。**

必須保留：

- ammeter positive terminal 原 wire-node
- ammeter negative terminal 原 wire-node
- ammeter edge identity

---

## 31. Ammeter

理想電流表 ≈ 0 Ω。

流程：

1. wires + closed switch 先建 wire-nodes
2. 找出 A+ / A− 所在 nodes
3. 如果 A+ / A− 已經透過另一條 0 Ω 路徑相連：
   - `ammeterReading = null`
   - `ammeterState = ambiguous`
4. 否則把 ammeter 作為 0 Ω connection 加入 conductive graph
5. **加入 ammeter 後再檢查 source-short**
6. 若不是 short，再求解
7. 用電流表一側的 KCL residual 還原 ammeter current

因此：

- 正常 total path → 唯一讀值
- 正常 branch → 唯一讀值
- parallel-to-lamp → bypass lamp，可有讀值
- across battery → source-short
- ammeter 和另一條理想 wire 完全平行 → ambiguous，不假裝唯一

---

## 32. Voltmeter

理想電壓表永遠不進 conductive graph。

最後讀：

`V(node+) - V(node-)`

如果某端真正完全 floating：

`reading = null`

不能顯示成 0 V。

零電流元件鏈的節點電位可在 conductive solve 後做 potential propagation。

---

## 33. Correct solver order

```text
validate raw wires
↓
union wires + closed switch
↓
capture ammeter endpoint nodes / detect zero-ohm ambiguity
↓
apply ammeter zero-ohm connection
↓
detect source-short  ← 包含 ammeter across battery
↓
detect bypassed lamps
↓
find active conductive subgraph
↓
detect open circuit
↓
exact rational nodal solve
↓
derive lamp currents / voltage / power
↓
derive ammeter current
↓
propagate zero-current potentials
↓
derive voltmeter reading
↓
derive topology / placement / presentation state
```

source-short 可以有 wire-only / switch-only / ammeter 造成的情況；**統一在 ammeter connection 已套用之後判斷**。

---

## 34. Exact arithmetic

核心 solver 採 exact rational：

```text
BigInt numerator / denominator
```

避免：

`0.499999999`

UI 最後格式化：

- 0.5 A
- 1.0 A
- 2.0 A
- 3.0 V
- 6.0 V

---

## 35. Topology / placement derived facts

### Parallel two-lamp

L1 / L2 兩端映射到同一對 conductive nodes。

### One-path two-lamp

兩燈都 active、在同一 single path，且：

- remove L1 → L2 current 0
- remove L2 → L1 current 0

### Ammeter placement

不得只用讀值分類。

至少要能 derivation：

- `total-current`
- `L1-branch`
- `L2-branch`
- `parallel-to-L1`
- `parallel-to-L2`
- `source-short`
- `ambiguous`
- `other`

每個 phase 的 gate 都同時看：

> **結構 + derived readings**

而不是比對固定 wire list。

---

## 36. Brightness

不沿用 legacy 的過早飽和視覺公式。

用離散 band：

- off
- very-low
- low
- reference
- high

每個 band：

- 有文字
- 有圖形／pattern
- 不只靠色相

主流程固定情況：

- baseline L1 = reference
- Trial 1 L1/L2 = low
- Trial 2 L1/L2 = **reference，與 baseline 相同**

---

# PART E — Leakage

## 37. Pre-concept forbidden full terms

Concept 前掃完整詞：

- 串聯
- 並聯
- 等效電阻
- 歐姆定律
- `I = V/R`
- 總電阻變大
- 總電阻變小
- 串聯電阻
- 並聯電阻
- 支路電流總和

不掃「串」「並」單字。

掃描：

- visible text
- hidden instructional DOM
- title
- meta description
- aria-label
- aria-description
- live region
- static HTML
- page-accessible script wording

Pre-concept renderer 不得收到：

- expected topology name
- correct answer
- expected choice

它只收到 derived visual state：

- raw wire geometry
- lamp visual state
- meter readings
- switch state
- open / unsafe state
- allowed interactions

---

# PART F — Persistence / Analytics / Accessibility

## 38. Persistence

Key：

`bhcs-circuit-guided:v1`

存：

- phase
- current raw wires
- switch state
- 5 主實驗 raw record snapshots
- compare answers
- notebook learner fields
- challenge choices / attempts / notes
- Challenge 2/3 learner deltas + raw records

不存任何 derived science。

Restore 必須由 reducer replay 重建。

不得重播：

- announcement
- analytics

---

## 39. Analytics

只允許：

- `lab_start`
- `trial_recorded` ×5
- `compare_complete` ×2
- `notebook_complete`
- `challenge_complete` ×3
- `lab_complete`

Payload：

```js
(milestone, 'circuit-guided')
```

不得送：

- wires
- meter position
- short occurrence
- current
- voltage
- topology
- learner answer
- learner text

---

## 40. Accessibility

必須：

- endpoint hit target ≥44×44 CSS px
- 390 px 目標 ≥56 px
- endpoint 是 real button
- Enter / Space 選端點
- Esc 取消
- wire list 可刪
- drag 非唯一操作
- endpoint 外正常 page scroll
- pointercancel 清乾淨
- switch real button
- 一個 live region
- focus handoff
- reduced motion
- forced colors
- grayscale
- no horizontal overflow
- meter text ≥13 px
- unsafe / brightness 不能只靠顏色

---

# PART G — B1–B5

## 41. P6-B1 — Model + Engine through Concept

新增：

```text
assets/circuit-guided/model.js
assets/circuit-guided/engine.js

scripts/test_circuit_guided_model.mjs
scripts/test_circuit_guided_engine.mjs
```

不做 production page。

### B1 model

完成：

- terminal schema
- wire validation
- exact rational helper
- union-find
- ammeter identity / ambiguity
- ammeter zero-ohm connection
- post-ammeter source-short
- lamp bypass
- active subgraph / open
- nodal solver
- potential propagation
- voltmeter
- ammeter KCL readback
- topology facts
- ammeter placement facts
- brightness band
- fixed main trial definitions
- fixed Challenge 2/3 base scenario definitions（純資料／truth，不做 UI）

### B1 engine

完成：

- Welcome → Concept phases
- `CONNECT`
- `DISCONNECT`
- `TOGGLE_SWITCH`
- `RECORD_MEASUREMENT`
- compare answers
- phase structural gates
- records store raw wiring only
- rejected action returns same state object
- no derived science in state persistence shape

### B1 必測：canonical truth

重現 legacy math oracle：

- single 6 V / 6 Ω = 1 A
- two 6 Ω one-path = 0.5 A
- two 6 Ω same-node-pair = 2 A total / 1 A each
- open = 0
- legacy spec canonical cases

### B1 必測：meter

- normal total ammeter
- L1 branch
- L2 branch
- reversed polarity
- parallel-to-lamp
- **ammeter across battery → source-short**
- another ideal parallel zero-ohm path → ambiguous
- voltmeter across lamp
- voltmeter in series
- floating voltmeter → null

### B1 必測：stage gates 正例／反例

#### Baseline

正例：

- any electrically equivalent L1-only circuit
- total ammeter
- voltmeter across L1
- switch controls all current
- positive meter

反例：

- L2 active
- voltmeter across L2
- ammeter in non-total location
- reversed ammeter
- open switch
- bypass

#### Trial 1

正例：

- multiple electrically equivalent one-path wirings
- equal nonzero L1/L2 current
- remove either lamp breaks the other
- total ammeter
- voltmeter across L1
- positive meter

反例：

- parallel
- bypass one lamp
- ammeter branch/ambiguous
- voltmeter across L2
- reversed meter
- open

#### Trial 2A

正例：

- electrically equivalent same-node-pair lamp topology
- switch controls both branches before split
- total ammeter = 2 A

反例：

- switch controls only one branch
- ammeter in L1 / L2
- reversed
- one lamp dangling

#### Trial 2B

正例：

- ammeter structurally on L1 branch
- reading = L1 current
- reading != total

反例：

- **ammeter on L2 branch even though reading also 1.0 A**
- total position
- reversed
- ambiguous

#### Trial 2C

mirror Trial 2B for L2.

### B1 mutation/property

不做全部 66-pair choose-N 窮舉。

做：

1. canonical V/R cross-check
2. finite exhaustive meter placements around canonical circuits
3. systematic mutations：
   - remove wire
   - add wire
   - swap endpoint
   - reverse meter
   - open switch
   - bypass lamp
   - source short
   - dangling component
4. deterministic fixed-seed property/random wiring tests

對所有 valid raw input：

- no throw
- no NaN
- no Infinity
- classification mutually consistent

---

## 42. P6-B2 — Renderer + Input

新增：

- `render.js`
- `input.js`
- `circuit-guided.css`
- 必要插畫

Bench：

- 固定元件位置
- endpoint hit areas
- SVG wires
- lamp brightness
- ammeter / voltmeter
- real switch
- wire list
- unsafe/open feedback

Input：

- click pair
- touch
- drag enhancement
- keyboard
- Esc
- wire delete
- switch
- pointercancel
- getLocked / canConnect

Local browser gates：

- input
- view

先不接正式 CI。

---

## 43. P6-B3 — Production Prototype through Concept

新增：

- `tools/science/circuit-guided.html`
- `script.js`
- `main.js`

完成：

Welcome → Mission → Baseline → Trial 1 → Compare 1 → Trial 2A/B/C → Compare 2 → Inference → Concept

Shared Guided components：

- StepNav
- CoachCard
- StatusBar
- DataCard
- EvidenceCard
- CompareCard
- ConceptReveal
- Announcer
- ActionBar

Hard gates：

- noindex / self canonical / unlisted
- no legacy link
- no CDN
- 390 / 1280
- pre-concept full-term leakage scan
- screenshots

---

## 44. P6-B4 — Notebook / Challenges / Persistence / Analytics

B4 比前幾站大，因為 Challenge 2/3 是 interactive bench。

新增：

- `challenges.js`
- `persist.js`
- `analytics.js`

完成：

- Notebook A/B/C
- Challenge 1 text-only
- Challenge 2 interactive bench + engine base scenario + 3 meter records
- Challenge 3 interactive bench + branch removal + measurement
- challenge base circuit immutable generation
- persist learner deltas only
- restore base + replay deltas
- completion
- restart
- privacy/storage status
- anonymous milestones

B4 tests 必須特別覆蓋：

- challenge base 不寫入 storage
- learner delta replay deterministic
- challenge restore 不重播 analytics
- Challenge 2 前/中/後 = 0.5 A
- Challenge 3 remove L2 → L1 1.0 A / total 1.0 A
- Challenge 1 不要求 bench interaction

---

## 45. P6-B5 — Permanent engineering gate

正式接進現有 CI job：

`science-guided`

新增：

- `check_circuit_guided_input_browser.cjs`
- `check_circuit_guided_view_browser.cjs`
- `check_circuit_guided_flow_browser.cjs`

順序：

```text
Chromium
→ circuit input
→ circuit view
→ circuit flow
```

Artifacts：

- `circuit-view-review`
- `circuit-flow-review`

保留 14 days。

CI contract 必須驗：

- gate each exactly once
- Chromium before gates
- input → view → flow
- shared NODE_PATH
- artifacts once
- `CI Gate` still needs `science-guided`
- browser gates not inside npm test

---

## 46. Engineering acceptance

### Science

- baseline = 1.0 A
- one-path two-lamp = 0.5 A
- same-node-pair two-lamp total = 2.0 A
- each branch = 1.0 A
- Trial 2B vs 2C distinguished structurally
- ammeter across battery always source-short
- no NaN / Infinity
- reversed meter is negative and record-blocked
- parallel lamp brightness exactly same band as baseline in ideal model

### Pedagogy

- student creates wires
- student operates real switch
- meter values update live
- CTA records; CTA does not create observation
- topology never selected by name
- evidence before terminology
- preconcept full terms absent
- current-not-consumed misconception measured at three positions
- incorrect meter placement has physical model consequence

### UX

- 1280 / 390
- mouse / touch / keyboard
- endpoints accessible
- wire removal accessible
- page scroll outside endpoints
- axe
- no overflow
- reduced motion
- forced colors
- grayscale

### Persistence / privacy

- raw learner source only
- reducer replay restore
- no derived truth persisted
- no challenge base circuit persisted
- anonymous milestone only

### Rollout

- Guided noindex / unlisted
- legacy page untouched
- no cross-link yet

---

## 47. 階段邊界

### B1

只做 truth：model + engine + tests。無 UI。

### B2

只做操作／呈現。不得偷寫完整教學答案。

### B3

完成到 Concept。無 Notebook / Challenge / persistence / analytics。

### B4

完成學習閉環，包含互動式 Challenge 2/3。仍不永久接 CI。

### B5

只做永久 browser engineering gate；不再修改核心教材內容。

---

## 48. 成功定義

Pilot #6 不是「更漂亮的串並聯模擬器」。

成功標準是：

> **學生沒有先被告知串聯／並聯，而是自己把電路接出來、自己操作開關、自己把電表放到正確位置、親手量到兩種相反結果，最後才用串聯與並聯的正式概念整理自己的證據。**
