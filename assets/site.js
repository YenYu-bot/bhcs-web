// 百宏文教機構 — 介面腳本（無相依套件）
(function () {
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 試聽預約表單：將欄位整理成訊息後開啟官方 LINE
  var form = document.getElementById('trial-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var action = form.getAttribute('action') || '';
    if (form.getAttribute('data-submit-mode') === 'line') {
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var lines = ['您好，我想預約免費試聽／程度確認：'];
      ['家長姓名', '聯絡電話', '孩子年級', '就讀學校', '想了解的科目', '目前遇到的狀況'].forEach(function (key) {
        var value = String(data.get(key) || '').trim();
        if (value) lines.push(key + '：' + value);
      });
      lines.push('方便聯絡時段：＿＿＿＿');
      status.textContent = '正在開啟百宏官方 LINE，請在 LINE 中確認並送出訊息。';
      status.style.color = '#16233A';
      var lineUrl = action.replace(/\/$/, '') + '/?' + encodeURIComponent(lines.join('\n'));
      window.location.href = lineUrl;
      return;
    }
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = '傳送中…';
    fetch(action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (r) {
        if (!r.ok) throw new Error();
        form.reset();
        status.textContent = '已收到您的預約。我們會在一個工作天內回電確認時段。';
        status.style.color = '#16233A';
      })
      .catch(function () {
        status.textContent = '傳送沒有成功。請改用下方的 LINE 或電話與我們聯絡。';
        status.style.color = '#C8352B';
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = '送出預約';
      });
  });
})();
