// 百宏文教機構 — 介面腳本（無相依套件）
(function () {
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
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
  var clear = document.getElementById('clear-trial');
  if (clear) clear.addEventListener('click', function () {
    form.reset(); clearDraft();
    if (preview) preview.hidden = true;
    if (message) message.value = '';
    status.textContent = '已清除填寫內容。';
  });
  var copy = document.getElementById('copy-trial');
  if (copy) copy.addEventListener('click', async function () {
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
