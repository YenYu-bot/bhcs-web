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

  // 試聽預約表單：送出後在原地顯示結果，不跳頁
  var form = document.getElementById('trial-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var action = form.getAttribute('action') || '';
    if (action.indexOf('YOUR_FORM_ID') > -1) {
      status.textContent = '表單尚未接上收件信箱。請改用下方的 LINE 或電話與我們聯絡。';
      status.style.color = '#C8352B';
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
