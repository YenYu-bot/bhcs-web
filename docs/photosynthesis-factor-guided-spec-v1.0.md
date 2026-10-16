# Science Lab 2.0 Pilot #5 — 光合作用限制因子 Guided Prototype

版本：**Spec v1.0**  
狀態：**規格階段；不進公開實作**  
基準 main：`bbb030ecb184cff399484c68bc2fe6b33d76912a`

---

## 1. 為什麼選這一站

既有 `tools/photosynthesis-factor-lab.html` 已有完整的光照、CO₂、溫度概念模型、曲線、紀錄與題目，但學習流程仍偏向「先看到參數、因子百分比與限制因子，再調數值」。

Pilot #5 要改成 Science Lab 2.0 的順序：

> **先看到現象 → 只改一個條件 → 比較兩次結果 → 發現同樣把光變強，結果不一定相同 → 自己說出原因 → 最後才命名「限制因子」。**

既有頁保留為 Advanced Mode，不修改；Guided Prototype 另開新頁，維持 noindex / unlisted。

---

## 2. 唯一核心問題

> **把光變強，水草的產氧速度就一定會一直增加嗎？**

學生完成主流程後，至少要能用自己的話說：

> **不一定。當光不是最不足的條件時，再增加光照，速率可能不再增加；此時另一個條件在限制光合作用。**

v1 不要求一開始背：
- 光合作用反應式；
- 光飽和曲線；
- Michaelis–Menten；
- 酵素動力學；
- 真實氣泡數與氧氣體積換算；
- 任何「限制因子」公式。

---

## 3. 科學模型

Guided v1 沿用既有 legacy 概念模型的數學關係，抽成純 model 並用 parity test 鎖定。

### 3.1 光照因子

```text
F_light(x) =
(1 - exp(-x/35)) / (1 - exp(-100/35))
clamp to 0...1
```

### 3.2 CO₂ 因子

```text
raw = CO2 / (CO2 + 300)
F_CO2 = raw / (1200/1500)
clamp to 0...1
CO2 <= 0 -> 0
```

### 3.3 溫度因子

```text
T <= 5 or T >= 45 -> 0
5 < T <= 25       -> (T - 5) / 20
25 < T < 45       -> (45 - T) / 20
```

### 3.4 相對速率

```text
R = 20 × min(F_light, F_CO2, F_temperature)
```

若最低兩項相差 <= 0.025，模型可標記為 tie。

### 3.5 教材邊界

這是 **Liebig-style 概念模型**，不是植物生理的精密預測公式。

學生頁必須清楚說：
- 「相對速率」只用來比較本站條件；
- 水草氣泡是產氧快慢的**相對線索**，不是精密氧氣體積；
- 真實植物還受水分、葉面積、光質、植物種類、呼吸作用、養分與適應時間等影響；
- v1 不把模型的 20 單位／分當成真實生物量或真實氣泡數。

**在 Concept 以前不得顯示**：
- `F_light / F_CO2 / F_temperature` 百分比；
- `min(...)` 公式；
- 「限制因子」正式名詞；
- 哪個條件是模型判定的 limit。

---

## 4. Guided v1 的兩組主實驗

### Trial 1 — 光變強，產氧明顯增加

固定：
- CO₂ = 1000 ppm
- 溫度 = 25°C

只改光照：
- A：15%
- B：60%

legacy model 預期：
- 15% → 約 7.4 相對單位／分
- 60% → 約 17.4 相對單位／分

學生看到：
- 同一株水草；
- 同一水體條件；
- 同一溫度；
- 只有光照變強；
- B 的相對產氧明顯高於 A。

此時不說「光照是限制因子」。

### Trial 2 — 光再變強，產氧卻幾乎不變

固定：
- CO₂ = 150 ppm
- 溫度 = 25°C

只改光照：
- C：60%
- D：100%

legacy model 預期：
- 60% → 約 8.3
- 100% → 約 8.3

學生看到：
- 同樣是把光變強；
- 但這次相對產氧幾乎沒有增加。

此時仍不先說「CO₂ 限制」。

---

## 5. 實驗桌設計

### 5.1 不做 slider-first

Guided 主流程不出現三條傳統 range slider。

實驗桌固定有：
- 水草與透明水槽；
- 光源；
- CO₂ 條件標示；
- 水溫標示；
- 產氧泡泡／計數區；
- 「目前只改變：光照」的控制變因提示。

### 5.2 光照操作

光源使用三段可操作狀態：
- 弱光 15%
- 中光 60%
- 強光 100%

視覺可用：
- 實體旋鈕三段；
- 或燈具上的三個可按位置。

手機與鍵盤均使用相同離散值，不要求像素級拖曳。

### 5.3 CO₂ 條件

Trial 1 顯示「CO₂ 較充足」；
Trial 2 由系統引導換成「CO₂ 較少」。

學生不需自行輸入 ppm 才能完成 Guided；精確 ppm 放在已記錄資料或 Concept / Advanced 中。

### 5.4 觀察時間

不真的等待 30 秒。

Guided 使用短動畫（約 3–4 秒；reduced motion 更短）代表「同一段觀察時間」，最後記錄：
- 相對產氧：低 / 中 / 高；
- 或保留一位小數的相對速率作為證據。

動畫速度不影響模型結果。

---

## 6. 主流程

```text
welcome
→ mission
→ trial1-low-light
→ trial1-higher-light
→ compare1
→ trial2-low-co2-setup
→ trial2-medium-light
→ trial2-high-light
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

## 7. 完整教學腳本

### welcome

主問題：

> **把光變強，水草的產氧速度就一定會一直增加嗎？**

副句：

> 先不要猜。你會做兩組只改光照的實驗，再比較結果。

CTA：「開始」

### mission

余老師：

> 每一組實驗都只改光照，其他條件先固定。  
> 先看水草產氧快慢，再把兩次結果放在一起。

不出現「限制因子」。

### Trial 1A

條件卡：
- 光照：15%
- CO₂：1000 ppm
- 溫度：25°C
- 這次只改：光照

余老師：

> 先在弱光下觀察。注意同一段時間裡，水草的產氧快慢。

CTA：「開始觀察」

完成後記錄 A。

### Trial 1B

余老師：

> 其他條件都不動，只把光照從 15% 調到 60%。

學生操作光源到 60%。

CTA：「開始第二次觀察」

完成後記錄 B。

### Compare 1

Evidence Compare：

| | 第一次 | 第二次 |
|---|---:|---:|
| 光照 | 15% | 60% |
| CO₂ | 1000 ppm | 1000 ppm |
| 溫度 | 25°C | 25°C |
| 相對速率 | 約 7.4 | 約 17.4 |

下方：
> ✅ 這兩次只有光照不同，可以直接比較。

Q1：
> 光照變強後，這一組的相對產氧怎麼變？

選項：增加 / 幾乎不變 / 降低

Q2：
> 這組資料能支持哪一句？

選項：
- 在這組條件下，把光變強會提高相對產氧。
- 任何情況下，光越強速率一定越高。
- 光照和速率完全無關。

只允許第一句。

### Trial 2 setup

余老師：

> 再做一組。這次換成 CO₂ 較少的條件，但比較時仍然只改光照。

顯示：
- CO₂ = 150 ppm
- 溫度 = 25°C

### Trial 2C

光照 60%，記錄約 8.3。

### Trial 2D

余老師：

> 其他條件都不動，只把光照從 60% 再提高到 100%。

記錄約 8.3。

### Compare 2

Evidence Compare：

| | 第三次 | 第四次 |
|---|---:|---:|
| 光照 | 60% | 100% |
| CO₂ | 150 ppm | 150 ppm |
| 溫度 | 25°C | 25°C |
| 相對速率 | 約 8.3 | 約 8.3 |

Q1：
> 這次把光再變強，速率有明顯增加嗎？

正解：沒有，幾乎不變。

Q2：
> 同樣是把光變強，為什麼 Trial 1 和 Trial 2 的結果不同？

選項：
- 因為 Trial 2 還有另一個條件比較不足。
- 因為光照在 Trial 2 完全沒有作用。
- 因為水草每次都隨機決定速率。

正解第一句，但仍不顯示「限制因子」。

### inference

余老師：

> 你已經找到重點了。  
> 光不是唯一會影響速率的條件。當另一個條件更不足時，繼續增加光照可能幾乎沒有幫助。

CTA：「看看這個現象叫什麼」

### concept

此刻第一次出現正式名詞：

> **限制因子**

文字：

> 在多個必要條件中，當某一項最不足、最先把反應速度卡住時，我們把它叫做「限制因子」。

再用學生自己的兩組證據：
- Trial 1：低光時，提高光照有效；
- Trial 2：CO₂ 很少時，提高光照幾乎無效。

然後才顯示：
> 本站概念模型用「三項因子中最低的一項決定目前速率」來模擬這個概念。

最後才出現簡化公式與模型範圍，不要求背。

---

## 8. 研究手冊

沿用 shared Notebook A/B/C。

### Level A｜幫我整理

填空／選擇：
1. Trial 1：光照 15 → 60，速率 ______。
2. Trial 2：光照 60 → 100，速率 ______。
3. 所以「把光變強」是否永遠都能提高速率？ ______。

### Level B｜我自己說

> 用自己的話說：為什麼 Trial 2 把光照從 60% 提高到 100%，相對速率幾乎沒有增加？

### Level C｜我能提出證據

Q1：
> 引用 Trial 1 與 Trial 2 的數據，說明「增加光照不一定永遠有效」。

Q2：
> 這個模型不能直接告訴我們真實植物的哪一些事情？

Ideas 只能在學生寫下 limitation 後出現：
- 氣泡不是精密氧氣體積；
- 真實植物還受其他條件影響；
- 模型是相對速率；
- 未納入呼吸作用與適應時間。

---

## 9. Challenges

### Challenge 1 — 下一步改什麼？

情境：
> 光照已經很強，但 CO₂ 很少，速率不再增加。

問題：
> 如果只允許改一個條件，下一步最值得先測哪一項？

正解：提高 CO₂。

### Challenge 2 — 公平比較

問題：
> 想研究 CO₂ 對光合作用速率的影響，哪一種做法最公平？

正解：
> 只改 CO₂，光照與溫度保持相同。

### Challenge 3 — 溫度不是越高越好

情境：
- 光照與 CO₂ 充足；
- 25°C 約 19.2；
- 40°C 約 5.0。

問題：
> 能不能說「溫度越高，光合作用一定越快」？

正解：不能。

Concept after answer:
> 參與光合作用的酵素有適合的溫度範圍；本站模型以 25°C 為最高點。這是概念模型，不是所有植物的固定最適溫度。

---

## 10. 必須避免的答案洩漏

Concept 前不得顯示：
- 「限制因子」；
- 「光照因子／CO₂ 因子／溫度因子」百分比；
- 「最低因子決定速率」；
- 哪個條件目前最低；
- 公式；
- Trial 2 的答案提示。

只顯示學生真正量到／看到的條件與相對結果。

---

## 11. Accessibility

- 所有光照離散控制至少 44×44 CSS px。
- mouse / touch / keyboard 收斂到同一 action。
- Arrow keys 或按鈕均可切換弱 / 中 / 強。
- 不把拖曳作為唯一操作。
- 產氧快慢不得只靠動畫速度；要有文字／數字證據。
- 成功／限制狀態不得只靠顏色。
- 一個 live region。
- reduced motion 可直接跳到 settled observation。
- 390px 無水平捲動。

---

## 12. Persistence

只存：
- phase；
- 四筆 trial record 的原始條件；
- compare learner answers；
- notebook learner fields；
- challenge choice / attempts / note。

不存：
- derived rate；
- limit；
- factor percentages；
- correct / ready flags。

Restore 時全部重算。

---

## 13. Analytics

沿用匿名 milestone 原則。

只允許：
- lab_start
- trial_recorded ×4
- compare_complete ×2
- notebook_complete
- challenge_complete ×3
- lab_complete

不送：
- trial 數值；
- CO₂ / light / temperature；
- 選項；
- learner text；
- notebook content；
- derived limit。

---

## 14. 頁面與公開狀態

新頁：

`tools/science/photosynthesis-factor-guided.html`

舊頁：

`tools/photosynthesis-factor-lab.html`

保持 untouched Advanced Mode。

Prototype：
- noindex；
- self canonical；
- unlisted；
- 不進 sitemap；
- 不進 science index；
- 不進 ziyuan；
- 不加 legacy ↔ guided link；
- rollout 另案。

---

## 15. 實作切分

### P5-B1 — model + engine through Concept
- 抽純 model；
- parity test 對 legacy；
- fixed Trial 1 / Trial 2；
- Compare 1 / Compare 2；
- Concept gate；
- 不做 UI。

### P5-B2 — bench renderer + input
- 水草水槽；
- 光源三段；
- CO₂ / 溫度條件；
- 產氧相對動畫；
- pointer / touch / keyboard；
- renderer 不接觸 answer key。

### P5-B3 — production prototype through Concept
- noindex / unlisted page；
- shared Guided shell；
- Welcome → Concept；
- pre-concept leakage gate；
- 1280 / 390 screenshots。

### P5-B4 — Notebook / Challenges / persistence / analytics
- shared Notebook；
- 3 challenges；
- restore；
- anonymous milestones；
- completion。

### P5-B5 — CI / final engineering gate
- input / view / full-flow browser gates；
- artifacts；
- exact-head CI；
- CI screenshot review。

---

## 16. Acceptance

Engineering Pilot Gate 必須同時通過：
- model parity；
- deterministic fixed-trial results；
- no pre-concept answer leakage；
- control-variable comparison correct；
- four trial records derived from model；
- 390 / 1280 layout；
- mouse / keyboard / touch；
- reduced motion；
- axe；
- no horizontal overflow；
- restore does not replay analytics；
- no production public listing；
- legacy untouched；
- exact-head Math + Researcher CI green。

之後才做 owner/student smoke test；公開 rollout 仍需另外決策。
