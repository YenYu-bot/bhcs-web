# g6 引擎 r8：修正 basecompare／numline 的 P3 結構 — Claude

r8 ＝ r7 ＋ 一處修改，取代 r7（PR #52 直接改用 r8；`docs/g6-r7/` 保留，這份放 `docs/g6-r8/`）。

## 原因
#52 的 P3 棘輪對 `basecompare` 的 `numline`（雙數線填空）回報 `structureGate=false, challengeGate=false`。
本機 `qual.mjs` 卻是合格，差異在於 CI 計算結構時會先把 `<svg>…</svg>` 整段拿掉，本機工具只去掉標籤。
r7 的 numline 題幹只有一句固定的「填出雙數線的空格」，所有變化都在圖裡，所以 CI 看到的三個難度都只有 1 種結構，挑戰級也沒有新結構。

## 修改
numline 的題幹改為把已知條件與空格的意義寫成文字（圖照舊保留）：
「雙數線上方是量、下方是倍數，已知倍數 1 對應的量是 2.6；①求倍數 1.8 對應的量、②求倍數 2.9 對應的量。」
挑戰級的量會帶單位（公斤、元、公升…），已知格也不固定在 1 倍，所以文字結構自然和基礎級不同。
答案、sig、verify 都沒有動。

## 驗證
- `math_local_check.mjs g6-drills.html basecompare 200`：PASS。
- 用「先去掉 SVG 再正規化」的方式重算三個 r7 新 topic（volume、speed、basecompare）每個 unit 的結構數（基礎／進階／挑戰，以及挑戰級中基礎級沒有的結構數）：
  - basecompare：identify 12/11/11（7）、numline 4/27/23（23，r7 是 1/1/1，0）、arcline 3/3/3（1）、findbase 3/5/4（4）、sumdiff 4/5/4（4）、discount 21/20/3（3）
  - volume：cuboid 3/4/4（3）、surface 3/3/4（4）、prism 4/5/7（6）、composite 3/3/3（2）、capacity 3/4/4（4）、reverse 3/3/5（5）
  - speed：findv 3/3/5（5）、findd 3/3/6（6）、findt 3/3/7（7）、convert 3/3/8（8）、average 4/3/3（3）、meet 3/3/3（3）
- basecompare 三難度 × 學用／教用 × 每列 2／3／4 題共 18 種列印組合無溢出。

## 給 ChatGPT
- 用 r8 的 `tools/math/g6-drills.html` 更新 #52，加入 `docs/g6-r8/`。卡片、宣告數、sitemap 都不變。
- 這次同時附上 g8 r5，原因相同（見 `docs/g8-r5/README.md`）；待辦區的 g8 r4 請改存 r5。
