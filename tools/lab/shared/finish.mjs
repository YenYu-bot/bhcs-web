// 完成對話框：與其他實驗桌的 #finish-dialog 同一個樣子（星星、規律、證據清單）。
// 給沒有寫在 HTML 裡的站用；樣式沿用 lab.css／station.css 的 .stars、.finish-* 類別。
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const text = (tag, cls, s) => { const n = document.createElement(tag); if (cls) n.className = cls; n.textContent = s; return n; };

export function showFinish({ kicker, title, rule, items = [], done = 6, total = 6, next = null }) {
  let d = document.getElementById('finish-dialog');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'finish-dialog';
    d.setAttribute('aria-labelledby', 'finish-title');
    document.body.append(d);
  }
  const h = text('h2', '', title); h.id = 'finish-title';
  const stars = document.createElement('div');
  stars.className = 'stars'; stars.id = 'stars';
  stars.setAttribute('aria-label', `完成 ${total} 個任務中的 ${done} 個`);
  stars.innerHTML = Array.from({ length: total }, (_, i) => i < done ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  const list = document.createElement('ul'); list.className = 'finish-list'; list.id = 'finish-list';
  list.append(...items.map(s => text('li', '', s)));
  const actions = document.createElement('div'); actions.className = 'dialog-actions';
  const close = text('button', 'btn btn-soft btn-ghost', '回到實驗桌'); close.type = 'button';
  close.addEventListener('click', () => d.close());
  actions.append(close);
  if (next) { const a = text('a', 'btn btn-main', next.label); a.href = next.href; actions.append(a); }
  d.replaceChildren(text('p', 'finish-kicker', kicker), h, stars, text('div', 'finish-rule', rule), list, actions);
  if (!d.open) d.showModal();
  close.focus();
  return d;
}
