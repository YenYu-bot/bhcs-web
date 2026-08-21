# 百宏文教機構官網

11 頁靜態網站，零相依套件，可直接放上 GitHub Pages。

---

## 一、上線前一定要做的四件事

### 1. 決定網域，改掉三個地方

目前預設是 `https://www.bhcs.com.tw`。如果要用別的網址，這三處都要改：

| 檔案 | 位置 | 說明 |
|---|---|---|
| `CNAME` | 整行 | GitHub Pages 綁定的網域 |
| 每頁 `<link rel="canonical">` | `<head>` | 告訴 Google 正版網址是哪個 |
| `robots.txt` | Sitemap 那行 | sitemap 的絕對路徑 |
| `sitemap.xml` | 每個 `<loc>` | 同上 |

> **這一步不能省。** canonical 填錯，Google 會繼續把 jretc 當成正版，整個網站白做。

### 2. 接上預約表單

`lianluo.html` 的表單目前指向 `https://formspree.io/f/YOUR_FORM_ID`，不會真的送出。

到 [formspree.io](https://formspree.io) 註冊（免費版每月 50 封夠用），建立一個表單拿到 ID，把 `YOUR_FORM_ID` 換掉即可。收件信箱建議設成你的 Google Workspace 網域信箱，不要用 hotmail。

在接好之前，表單送出會顯示「請改用 LINE 或電話聯絡」，不會靜默失敗。

### 3. 填掉三頁的「待補」欄位

頁面上黃色虛線框標著「待補」的地方，全部要填。搜尋 `class="todo"` 可以一次找到。

| 頁面 | 要填什麼 |
|---|---|
| `shizi.html` | 四位老師的任教科目與簡介（各 60–100 字），並換上**真人照片** |
| `chengguo.html` | 近三年會考／學測榜單、段考進步案例 |
| `ziyuan.html` | 四個學習工具的實際網址 |

**兩個提醒：**

- 榜單與進步案例涉及個資，建議匿名呈現（「八年級 陳同學｜理化 58 → 87」），並事先取得家長同意。
- 師資照片請用真人。動漫頭像對補習班的信任度是負分，家長最在意的就是「誰在教我小孩」。

### 4. 補上圖片

目前全站沒有實景照片。建議至少補：教室、櫃檯、自習室、上課實況、講義特寫。這些照片跟 Google 商家可以共用，拍一次兩邊都能放。

圖片檔名請用有意義的英文，例如 `bhcs-beitun-guozhong-shuxue-jiaoshi.jpg`，並記得寫 `alt` 文字。

---

## 二、部署到 GitHub Pages

```bash
# 1. 建立新 repo（例如 bhcs-web），把這個資料夾的內容全部推上去
git init
git add .
git commit -m "百宏官網 v1"
git branch -M main
git remote add origin git@github.com:YenYu-bot/bhcs-web.git
git push -u origin main
```

2. repo → Settings → Pages → Source 選 `main` / `root`
3. Custom domain 填 `www.bhcs.com.tw`
4. 勾選 **Enforce HTTPS**（憑證約 10 分鐘內簽好）
5. 到網域商後台加一筆 DNS 記錄：

```
CNAME    www    yenyu-bot.github.io
```

---

## 三、上線後三件事

1. **Search Console 送出 sitemap**
   `bhcs.com.tw` 的網域資源 → 站點地圖 → 貼上 `https://www.bhcs.com.tw/sitemap.xml`

2. **Google 商家的「網站」欄位改成新網址**
   目前填的是 `http://bhcs.com.tw/`，換成 https 的新站。

3. **確認結構化資料通過**
   到 [search.google.com/test/rich-results](https://search.google.com/test/rich-results) 貼上首頁網址。應該要看到 `EducationalOrganization` 和 `FAQPage` 兩項。

---

## 四、檔案結構

```
index.html                首頁            → 北屯補習班
guozhong.html             國中部          → 北屯國中補習班
guozhong-shuxue.html      國中數學        → 北屯國中數學
guozhong-lihua.html       國中理化        → 北屯國中理化
guozhong-yingwen.html     國中英文        → 北屯國中英文
guoxiao.html              國小部          → 北屯安親班
gaozhong.html             高中部          → 北屯高中補習班
shizi.html                師資介紹
chengguo.html             教學成果
ziyuan.html               學習資源        → 國中數學練習題
lianluo.html              聯絡我們        → 北屯補習班 地址
404.html                  錯誤頁（noindex）
sitemap.xml / robots.txt / CNAME
assets/style.css          全站樣式
assets/site.js            選單與表單
assets/og.jpg             社群分享圖 1200×630
assets/favicon.png
```

每一頁鎖定右欄那一個關鍵字。**不要為了增加頁數而拆頁**——舊站 645 頁沒被收錄就是因為內容太薄。寧可十頁厚，不要一百頁薄。

---

## 五、之後要新增內容時

最有價值的是在 `ziyuan.html` 底下加實用文章，例如：

- 北屯區各國中的段考範圍與版本整理
- 小六升國一的暑假該準備什麼
- 會考落點怎麼看

每月一篇就夠。這類文章能吃到「不認識百宏、但正在找答案」的家長，是自然搜尋唯一真正的成長來源。

---

## 六、設計說明

- **視覺語彙**：方格紙底 + 紅筆批改。標題的紅圈／紅底線是 SVG 手繪路徑，載入時會有畫線動畫，已處理 `prefers-reduced-motion`。
- **字體**：Noto Serif TC 900（標題）／ Noto Sans TC（內文）／ IBM Plex Mono（數字、電話、時間）。
- **色票**：`--ink #16233A`、`--red #C8352B`、`--orange #E8620C`（沿用原品牌橘）、`--paper #FCFCFA`。
- 手機版有底部固定的「撥打電話 / 加 LINE」操作列，這是補習班網站轉換率最高的元件。
- 所有樣式集中在 `assets/style.css` 的 `:root`，要換色改那一區就好。
