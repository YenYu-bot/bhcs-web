# g3 引擎 r1：M8 九九乘法與乘除心算 — Claude

新檔 `tools/math/g3-drills.html`，由 g6 r8 的引擎複製而來，只有一個 topic：`timestables`（九九乘法與乘除心算）。依交接包 M8 規格製作。

## 內容
六個單元，只有整數模式：
| unit | 基礎／進階／挑戰 |
|---|---|
| `tables` 九九乘法 | 2～5 段／2～9 段／同上並常交換順序 |
| `fill` 乘法填空 7×□＝56 | 空格在後為主／空格前後各半／另有 56＝7×□ 形式 |
| `div` 除法（整除） | 除數為指定段／除數也可為另一因數／反求除數或被除數 |
| `rem` 有餘數的除法 | 除數 2～5、商 1～9／除數 2～9／商可到二位數，被除數 ≤ 99 |
| `mixed` 乘除混合連算 | a×b÷c（c 為 a 或 b）／加入 a÷b×c／數值較大，結果 ≤ 99 |
| `twodigit` 二位數×一位數 | 無進位／個位進位／個位與十位都進位 |

verify 全部走另一條路：乘法用連加，除法用連加回推被除數，有餘數除法另檢查「再多一個除數就超過」，二位數乘法用拆十位與個位分別相乘再相加。

## 速度練習頁的版面差異（引擎改動，只在 g3 檔）
- 每列題數多一個「5 題」且為預設；作答空間預設「小」；`fill`、`rem`、`mixed`、`twodigit` 每單元題數上限 60；`tables`、`div` 為 40。預設卷 60～70 題。
- 卷首的「作答時間」改成「用時：___分___秒　答對：___題」（`CFG.header`）。
- 作答列不印「原式＝」，答案直接接在等號後（`CFG.answerLabel`，與 g8 r5 同一個機制）。
- 控制面板多一組「指定乘數」2～9 複選（`CFG.extraControl`），預設全勾；基礎級未指定時只出 2～5 段，指定了就以指定為準。
- **sig 規則放寬**：`generate()` 傳 Map 給 `safeQuestion`，同一 sig 最多出現 `CFG.sigRepeat`＝2 次；健檢與 CI 傳的是 Set，仍是嚴格不重複。程式內有註解。實測只勾 7 段、九九乘法 40 題時產生 34 題（18 種算式，每種最多 2 次），狀態列會顯示實際題數。
- CSS 只加一條 `.grid.c5`，放在既有 `.grid.c4` 旁，不在品牌區塊內；沒有 SVG、沒有新顏色。

## 驗證
- `math_local_check.mjs g3-drills.html timestables 200`：PASS，6 個 unit × 3 難度全部 200 題 ok、0 耗盡、0 verify 失敗（`local-check.txt`）。
- Chromium：三難度 × 學用／教用 × 每列 4／5 題共 12 種組合，列印模式無溢出；390 px 無水平捲動；title、canonical 正確；無 console 錯誤。

## 要請 ChatGPT 處理的
1. 新引擎檔：`docs/g3-r1/`、國小區加一張卡片「九九乘法與乘除心算」`tools/math/g3-drills.html?topic=timestables`（放在國小區最前面，因為年段最低）、sitemap 加檔、builder 跑宣告數、P2 重產（+1 topic）、browser 檢查此檔為 new。
2. **P3 需要豁免**：這一頁是速度練習，每題就是「a × b＝」「a ÷ b＝」，數字換成 # 之後每個 unit 的結構數本來就是 1～4，也不可能讓挑戰級「多一種結構」。請把 `timestables` 六個 unit 列入豁免（和 standarddev 當初的豁免同一個機制），豁免理由寫「速度練習頁，題型即運算式版型」。棘輪的其他檢查（verify、耗盡、回歸）照跑。
3. discovery：g3 用 `const TOPICS=[…]`，與 g6 相同格式。

## 沒有做的
- 只有 M8 這一個 topic。三年級其他單元（三位數加減、時間與長度、分數初步、周長）沒有講義，尚未做。

## 整合備註

P2 首次以 60 題檢查全部 unit 時，基礎級 `tables` 在第 55/60 題、`div` 在第 49/60 題耗盡；將這兩個 unit 的輸入與選題上限同步調為 40，保持 50 次重試及測試用 Set 嚴格去重。
P3 豁免設於 `scripts/math-diversity-policy.mjs` 的 `singleFormExemptions`，六個 unit 理由皆為「速度練習頁，題型即運算式版型」；`scripts/math-diversity-ratchet.mjs` 只准這六個新 unit 使用豁免，其他新 unit 仍須符合原完整門檻。

整合後：discovery 6 個引擎／73 個 topic，資源宣告 147、數學總覽 109 張卡，sitemap 94 URL。P2 2,385／2,385 組通過、477,000／477,000 次取題、單卷耗盡 0；原效率警示仍是 26 個 unit／61 組。P3 ratchet 0 失敗，新增六個 unit 的結構豁免沒有放寬其他新 unit。
瀏覽器 CI 的 `check_site_browser.cjs` 會遍歷追蹤的 HTML；`check_math_brand_browser.cjs` 因基準 commit 不含此檔而將它標成 `new`，並檢查學用／教用列印。ZIP 的 Chromium 驗證屬提供者紀錄；整合環境的真實瀏覽器驗收待 PR CI。
