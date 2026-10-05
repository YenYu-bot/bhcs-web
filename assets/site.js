// 百宏文教機構 — 介面腳本（無相依套件）
(function () {
  // ---------- 網站分析（GA4）：全站唯一 loader ----------
  // 事件只送固定分類的匿名參數；任何表單欄位、自由文字或 LINE 訊息內容都不會進入分析。
  var GA_ID = 'G-GHN2GDS2RQ';
  var EVENT_NAMES = { cta_trial: 1, cta_line: 1, cta_phone: 1, cta_map: 1, trial_form_start: 1, trial_line_open: 1, trial_copy: 1 };
  var PARAM_NAMES = { page_group: 1, cta_location: 1 };
  var PAGE_GROUPS = {
    '': 'home', 'index.html': 'home',
    'guoxiao.html': 'elementary', 'guozhong.html': 'junior_high', 'gaozhong.html': 'senior_high',
    'guozhong-shuxue.html': 'junior_math', 'guozhong-lihua.html': 'junior_science', 'guozhong-yingwen.html': 'junior_english',
    'shizi.html': 'teachers', 'xuexi-xitong.html': 'learning_system', 'chengguo.html': 'results',
    'ziyuan.html': 'resources', 'lianluo.html': 'contact', 'app.html': 'app'
  };
  function analyticsAllowed() {
    // 自己人排除：任何主站頁面網址加 ?noga=1 開啟一次，這台瀏覽器從此不計入統計（localStorage bhcs_noga=1）。
    var allowed = true;
    try {
      if (new URLSearchParams(location.search).get('noga') === '1') localStorage.setItem('bhcs_noga', '1');
      allowed = localStorage.getItem('bhcs_noga') !== '1';
    } catch (_) { allowed = false; }
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) allowed = false;
    return allowed;
  }
  var analyticsOn = analyticsAllowed();
  if (analyticsOn && typeof window.gtag !== 'function') {
    // 若頁面已有 gtag（例如自然研究站的 science-events.js），不再插入第二支 Google script。
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
  }
  function pageGroup() {
    var path = location.pathname || '';
    if (path.indexOf('/wenzhang/') > -1) return 'articles';
    var file = path.split('/').pop();
    return PAGE_GROUPS[file] || 'other';
  }
  function ctaLocation(el) {
    if (el.closest('.dock')) return 'dock';
    if (el.closest('.masthead')) return 'header';
    if (el.closest('.foot')) return 'footer';
    if (el.closest('#trial-form')) return 'form';
    if (el.closest('.direct-contact')) return 'direct';
    if (el.closest('.hero')) return 'hero';
    return 'mid';
  }
  function track(name, params) {
    if (!analyticsOn || !EVENT_NAMES[name] || typeof window.gtag !== 'function') return;
    var safe = {};
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (PARAM_NAMES[key] && typeof value === 'string' && /^[a-z_]{1,32}$/.test(value)) safe[key] = value;
    });
    window.gtag('event', name, safe);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var group = pageGroup();
    if (/^tel:/i.test(href)) { track('cta_phone', { page_group: group, cta_location: ctaLocation(a) }); return; }
    if (/line\.me\/R\/oaMessage\//.test(href)) return; // 預約表單送出由 trial_line_open 記錄
    if (/line\.me\//.test(href)) { track('cta_line', { page_group: group, cta_location: ctaLocation(a) }); return; }
    if (/google\.com\/maps\/dir/.test(href)) { track('cta_map', { page_group: group }); return; }
    if (/(^|\/)lianluo\.html(#|$)/.test(href) && a.classList.contains('btn')) track('cta_trial', { page_group: group, cta_location: ctaLocation(a) });
  });

  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    var closeMenu = function (restoreFocus) {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) burger.focus();
    };
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
    });
  }

  var form = document.getElementById('trial-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var preview = document.getElementById('trial-preview');
  var message = document.getElementById('trial-message');
  var fields = ['家長姓名', '聯絡電話', '孩子年級', '就讀學校', '想了解的科目', '目前遇到的狀況'];
  var draftKey = 'bhcs_trial_draft_v1';
  var ttl = 2 * 60 * 60 * 1000;
  function draftUnavailable() { var note = document.getElementById('trial-draft-note'); if (note) note.textContent = '此瀏覽器無法暫存資料，請保留本頁，或複製預約內容。'; }
  function clearDraft() { try { sessionStorage.removeItem(draftKey); } catch (_) {} }
  function text() {
    var lines = ['您好，我想預約免費試聽／程度確認：'];
    fields.forEach(function (key) {
      var value = form.elements.namedItem(key).value.trim();
      if (value) lines.push(key + '：' + value);
    });
    lines.push('方便聯絡時段：＿＿＿＿');
    return lines.join('\n');
  }
  function saveDraft() {
    var values = {};
    fields.forEach(function (key) { values[key] = form.elements.namedItem(key).value; });
    try { sessionStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), values: values })); } catch (_) { draftUnavailable(); }
    if (preview && !preview.hidden) message.value = text();
  }
  var rawDraft = null;
  try { rawDraft = sessionStorage.getItem(draftKey); } catch (_) { draftUnavailable(); }
  try {
    var draft = JSON.parse(rawDraft);
    if (draft && Number.isFinite(draft.savedAt) && Date.now() >= draft.savedAt && Date.now() - draft.savedAt < ttl && draft.values) {
      fields.forEach(function (key) {
        if (typeof draft.values[key] === 'string' && draft.values[key].length <= 10000) form.elements.namedItem(key).value = draft.values[key];
      });
    } else clearDraft();
  } catch (_) { clearDraft(); }
  var formStarted = false;
  function formStart() { if (formStarted) return; formStarted = true; track('trial_form_start', { page_group: pageGroup() }); }
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
  form.addEventListener('input', formStart);
  form.addEventListener('change', formStart);
  var clear = document.getElementById('clear-trial');
  if (clear) clear.addEventListener('click', function () {
    form.reset(); clearDraft();
    if (preview) preview.hidden = true;
    if (message) message.value = '';
    status.textContent = '已清除填寫內容。';
  });
  var copy = document.getElementById('copy-trial');
  if (copy) copy.addEventListener('click', async function () {
    track('trial_copy', { page_group: pageGroup() });
    message.value = text();
    try {
      await navigator.clipboard.writeText(message.value);
      status.textContent = '已複製。請貼到百宏官方 LINE，確認後按「傳送」。';
    } catch (_) {
      message.focus(); message.select();
      status.textContent = '請複製已選取的預約內容，再貼到百宏官方 LINE。';
    }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var action = form.getAttribute('action') || '';
    if (form.getAttribute('data-submit-mode') === 'line') {
      saveDraft();
      var content = text();
      if (preview) { preview.hidden = false; message.value = content; }
      status.textContent = '資料尚未送出。請在 LINE 確認並按「傳送」；若沒有開啟，請複製頁面中的預約內容。';
      status.style.color = '#16233A';
      track('trial_line_open', { page_group: pageGroup() });
      // Keep this page and draft available. A button action avoids putting personal data in tracked outbound links.
      window.open(action.replace(/\/$/, '') + '/?' + encodeURIComponent(content), '_blank', 'noopener,noreferrer');
      return;
    }
    var btn = form.querySelector('button[type=submit]');
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = '傳送中…';
    fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error();
        form.reset(); clearDraft();
        status.textContent = '已收到您的預約。我們會在一個工作天內回電確認時段。';
        status.style.color = '#16233A';
      })
      .catch(function () {
        status.textContent = '傳送沒有成功。請改用 LINE 或電話與我們聯絡。';
        status.style.color = '#C8352B';
      })
      .finally(function () { btn.disabled = false; btn.textContent = label; });
  });
})();
