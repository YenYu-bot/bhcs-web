// 共用實驗桌引擎：任務卡、余老師、控制列、要收的證據、算一算、說說看、研究手冊、完成對話框。
// 各站只寫設定（步驟、目標證據、題目）和場景畫法；科學計算用 scripts/science/models.mjs 或站內 model。
//
// config = {
//   key, title, finish:{rule, next:{label,href}}, why:{title, html}, chip?:{main, sub},
//   initial:{...設定}, model(s) → r, readouts(s, r) → [[標籤, 數值, 單位, 註記], …],
//   scene(api), viewBox:{desk, phone} 或 (step) => {desk, phone},
//   steps:[{ id, label, title, goal, intro, kind:'observe'|'calc'|'quiz', enter:{…}, controls:[…],
//            targets:[{ sig, label, set:{需要的設定}, aim, title(s,r), body(s,r) }], react?(s,r), found:[一句話, 式子],
//            rows:[{ id, name, eq, answer, unit, tol?, hint?(v) }] }],
//   quiz:[{ q, options:[{ text, ok?, why? }] }]
// }
import { $, Teacher, renderSteps, fly, bump, reduceMotion } from './lab.js';
import { openNotebook } from './notebook.mjs';

const NS = 'http://www.w3.org/2000/svg';
export const PROPS = '../../../assets/science/props/';
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const svgEl = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) if (a[k] !== undefined && a[k] !== null) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
export const svgText = (parent, x, y, s, a = {}) => { const t = svgEl('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

function shell(c) {
  const first = c.steps[0];
  document.body.className = 'lab';
  document.body.innerHTML = `
<header class="lab-bar">
  <a class="lab-brand" href="../../science/">百宏 · 小小研究員</a>
  <h1 class="lab-title">${esc(c.title)}</h1>
  <ol class="lab-steps" id="steps" aria-label="任務進度"></ol>
  <div class="lab-bar-actions">
    <button type="button" class="btn-ghost" id="why">${esc(c.why.button || c.why.title)}</button>
    <button type="button" class="btn-dark" id="open-notes">研究手冊 <span class="badge" id="note-count">0</span></button>
  </div>
</header>
<main class="stage" id="stage">
  <div class="scene-area">
    <div class="readouts p-readouts" id="readouts" aria-label="讀值"></div>
    <div class="scene-wrap">
      ${c.chip ? `<p class="unit-chip"><span>換算</span><b>${esc(c.chip.main)}</b>${c.chip.sub ? `<span>${esc(c.chip.sub)}</span>` : ''}</p>` : ''}
      <svg id="scene" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${esc(c.sceneLabel || c.title)}">
        <image href="${PROPS}${c.background || 'bg-physics-bench'}.webp" x="-200" y="-120" width="1400" height="848" preserveAspectRatio="none" aria-hidden="true"/>
        <g id="rig"></g>
      </svg>
    </div>
  </div>
  <aside class="panel" aria-label="任務、余老師與操作">
    <section class="task" id="task" aria-live="polite">
      <span class="task-kicker" id="task-kicker"></span>
      <h2 class="task-title" id="task-title">${esc(first.title)}</h2>
      <p class="task-goal" id="task-goal"></p>
      <div class="task-row"><button type="button" id="task-reset">重來這一步</button><button type="button" class="go" id="task-go" hidden></button><button type="button" class="clear" id="clear-records">清空紀錄</button></div>
    </section>
    <div class="teacher" id="teacher">
      <div class="teacher-pic" id="teacher-pic" data-pose="point" role="img" aria-label="余老師"></div>
      <div class="bubble" id="bubble"></div>
    </div>
    <section class="dock" id="dock-observe" aria-label="操作">
      <div id="controls"></div>
      <span class="dock-label">要收的證據</span>
      <ul class="todo" id="todo"></ul>
      <button type="button" class="btn-main" id="save">收下這次觀察</button>
    </section>
    <section class="dock" id="dock-calc" aria-label="算一算" hidden>
      <span class="dock-label" id="calc-head"></span>
      <div id="calc-rows"></div>
      <button type="button" class="btn-main" id="check">核對我的答案</button>
    </section>
    <section class="dock" id="dock-quiz" aria-label="說說看" hidden>
      <span class="dock-label" id="quiz-q"></span>
      <div class="quiz" id="quiz"></div>
    </section>
    <section class="evidence" id="evidence" aria-labelledby="evidence-title">
      <div class="evidence-head"><h2 id="evidence-title">我的證據</h2><span><span id="ev-count">0</span> 張</span></div>
      <p class="evidence-empty" id="ev-empty">照著「要收的證據」操作，按「收下這次觀察」，卡片會飛到這裡。</p>
      <ol class="chips" id="chips"></ol>
    </section>
  </aside>
</main>
<p class="sr-only" id="live" role="status" aria-live="polite"></p>
<dialog id="why-dialog" aria-labelledby="why-title">
  <h2 id="why-title">${esc(c.why.title)}</h2>
  <div class="why-body">${c.why.html}</div>
  <div class="dialog-actions"><button type="button" class="btn-main" data-close>知道了</button></div>
</dialog>
<dialog id="notes-dialog" aria-labelledby="notes-title">
  <h2 id="notes-title">研究手冊</h2>
  <p class="notes-tip">每一步收下的證據都記在這裡。</p>
  <div class="notes-scroll"><table class="notes-table"><thead><tr><th>#</th><th>任務</th><th>觀察</th><th>結果</th></tr></thead><tbody id="notes-body"></tbody></table></div>
  <div class="dialog-actions"><button type="button" class="btn-soft" id="reset-all">清除紀錄重新開始</button><button type="button" class="btn-main" data-close>關閉</button></div>
</dialog>
<dialog id="finish-dialog" aria-labelledby="finish-title">
  <p class="finish-kicker">${esc(c.title)} · 全部完成</p>
  <h2 id="finish-title">${esc(c.finish.title || '全部完成了！')}</h2>
  <div class="stars" id="stars"></div>
  <div class="finish-rule">${esc(c.finish.rule)}</div>
  <ul class="finish-list" id="finish-list"></ul>
  <div class="dialog-actions"><button type="button" class="btn-soft" data-close>再玩一次</button>${c.finish.next ? `<a class="btn-main" href="${esc(c.finish.next.href)}">${esc(c.finish.next.label)}</a>` : ''}</div>
</dialog>`;
}

export async function runDesk(c) {
  shell(c);
  const db = await openNotebook(c.key);
  const STEPS = c.steps, byId = id => STEPS.find(x => x.id === id), idx = id => STEPS.findIndex(x => x.id === id);
  const keys = Object.keys(c.initial);
  // 目標證據用 set 寫出需要的設定，when 預設就是「設定都符合」
  for (const st of STEPS) for (const t of st.targets || []) if (!t.when) t.when = s => Object.entries(t.set).every(([k, v]) => s[k] === v);
  const fresh = () => ({ v: 1, step: STEPS[0].id, s: { ...c.initial, ...(STEPS[0].enter || {}) }, records: [], done: [], calc: {}, quiz: { i: 0, pick: null } });
  function loadState() {
    const s = db.load();
    try {
      if (!s || s.v !== 1 || !byId(s.step) || !s.s || !keys.every(k => k in s.s)) throw 0;
      if (!Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc || !s.quiz || !Number.isInteger(s.quiz.i)) throw 0;
      if (!s.records.every(r => r && byId(r.step) && typeof r.sig === 'string')) throw 0;
      c.model(s.s);
      return s;
    } catch { return fresh(); }
  }
  let S = loadState(), foundShown = null, lastNote = null;
  const save = () => db.save(S);
  const svg = $('#scene'), rig = $('#rig');
  const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
  const narrow = matchMedia('(max-width: 860px)');
  const step = () => byId(S.step);
  const got = (stepId, sig) => S.records.some(r => r.step === stepId && r.sig === sig);
  const result = () => c.model(S.s);
  const matchTarget = (st, s, r) => (st.targets || []).find(t => t.when(s, r));
  const nextTarget = st => (st.targets || []).find(t => !got(st.id, t.sig));

  /* ---------- 設定與控制 ---------- */
  function set(patch, { quiet = false } = {}) {
    if (!step().kind || step().kind === 'observe') {
      const next = { ...S.s, ...patch };
      try { c.model(next); } catch { return; }
      S.s = next; lastNote = null; save(); render();
    } else if (!quiet) oops('這一步不用操作器材，看任務卡要做的事。');
  }
  function renderControls() {
    const box = $('#controls'), st = step();
    const list = st.controls || [];
    const sig = st.id + '|' + list.map(x => x.key).join(',');
    if (box.dataset.sig !== sig) {
      box.dataset.sig = sig;
      box.replaceChildren(...list.map(ct => {
        const wrap = document.createElement('div'); wrap.className = 'ctl'; wrap.dataset.key = ct.key;
        const lab = document.createElement('span'); lab.className = 'dock-label'; lab.textContent = ct.label; wrap.append(lab);
        if (ct.type === 'seg') {
          const seg = document.createElement('div'); seg.className = 'seg'; seg.style.setProperty('--n', ct.cols || Math.min(ct.options.length, 4));
          seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', ct.label);
          for (const [v, text] of ct.options) {
            const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.dataset.v = JSON.stringify(v);
            b.addEventListener('click', () => set({ [ct.key]: v }));
            seg.append(b);
          }
          wrap.append(seg);
        } else {
          const row = document.createElement('div'); row.className = 'stepper';
          const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', ct.label + '減少');
          const out = document.createElement('output'); out.setAttribute('aria-live', 'polite');
          const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '＋'; plus.setAttribute('aria-label', ct.label + '增加');
          const bump2 = d => { const v = Math.round((S.s[ct.key] + d * ct.step) * 1e6) / 1e6; if (v >= ct.min - 1e-9 && v <= ct.max + 1e-9) set({ [ct.key]: v }); };
          minus.addEventListener('click', () => bump2(-1)); plus.addEventListener('click', () => bump2(1));
          row.append(minus, out, plus); wrap.append(row);
        }
        return wrap;
      }));
    }
    for (const ct of list) {
      const wrap = box.querySelector(`[data-key="${ct.key}"]`);
      if (ct.type === 'seg') for (const b of wrap.querySelectorAll('button')) {
        const v = JSON.parse(b.dataset.v); b.setAttribute('aria-pressed', String(v === S.s[ct.key]));
        b.disabled = ct.enabled ? !ct.enabled(v, S.s) : false;
      } else {
        const [minus, out, plus] = wrap.querySelector('.stepper').children, v = S.s[ct.key];
        out.innerHTML = `${esc(ct.fmt ? ct.fmt(v) : v)}${ct.unit ? `<small>${esc(ct.unit)}</small>` : ''}`;
        minus.disabled = v - ct.step < ct.min - 1e-9; plus.disabled = v + ct.step > ct.max + 1e-9;
      }
    }
  }

  /* ---------- 場景 ---------- */
  function tool(g, label, onPick) {
    g.classList.add('scene-tool'); g.setAttribute('role', 'button'); g.setAttribute('tabindex', 0); g.setAttribute('aria-label', label);
    g.addEventListener('click', onPick);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } });
    return g;
  }
  /* ---------- 直接操作：拖、轉、點 ---------- */
  // 把指標位置換成場景座標
  const svgPt = e => { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; return q.matrixTransform(svg.getScreenCTM().inverse()); };
  // begin(p0) 回傳 { move(p, p0), end(p, p0), cancel() }。拖的時候只改畫面，放開才 set()，因為 set() 會重畫整個場景。
  // 移動不到 6 px 算點一下，呼叫 tap()；有 label 就能用鍵盤 Enter／空白鍵觸發 tap()。
  function drag(node, begin, { label, tap } = {}) {
    node.classList.add('scene-drag'); node.style.touchAction = 'none';
    if (label) { node.setAttribute('role', 'button'); node.setAttribute('tabindex', 0); node.setAttribute('aria-label', label); }
    if (tap) node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });
    node.addEventListener('pointerdown', e => {
      if (e.button) return; e.preventDefault(); e.stopPropagation();
      const x0 = e.clientX, y0 = e.clientY, p0 = svgPt(e), h = begin ? begin(p0) || {} : {}; let moved = false;
      node.classList.add('dragging');
      const mv = ev => { if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) moved = true; if (moved) h.move?.(svgPt(ev), p0); };
      const stop = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel); node.classList.remove('dragging'); };
      const up = ev => { stop(); if (moved || !tap) { const p = svgPt(ev); if (moved) h.move?.(p, p0); h.end?.(p, p0); } else { h.cancel?.(); tap(); } };
      const cancel = () => { stop(); h.cancel?.(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', cancel);
    });
    return node;
  }
  // 操作提示：虛線綠框小字，不擋點擊
  function hint(x, y, str, k = 1) {
    const g = svgEl('g', { class: 'scene-hint', 'pointer-events': 'none' }, rig), w = str.length * 15 * k + 28;
    svgEl('rect', { x: x - w / 2, y: y - 14 - 6 * k, width: w, height: 18 + 10 * k, rx: 14, fill: '#FFFDF2', stroke: '#2E8B66', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, g);
    svgText(g, x, y, str, { 'font-size': Math.round(14 * k), fill: '#1F6E50' });
    return g;
  }
  function draw() {
    const st = step(), r = result();
    const focusLabel = document.activeElement && rig.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
    rig.replaceChildren();
    const k = narrow.matches ? (c.phoneText || 1.5) : 1;
    const txt = (parent, x, y, str, a = {}) => svgText(parent, x, y, str, { ...a, 'font-size': Math.round((a['font-size'] || 16) * k) });
    c.scene({ rig, el: svgEl, txt, k, P: PROPS, s: S.s, r, set, step: st.id, kind: st.kind || 'observe', tool, drag, hint: (x, y, str) => (st.kind || 'observe') === 'observe' ? hint(x, y, str, k) : null, narrow: narrow.matches, has: sig => got(st.id, sig), records: S.records, reduce: reduceMotion() });
    if (focusLabel) [...rig.querySelectorAll('[aria-label]')].find(n => n.getAttribute('aria-label') === focusLabel)?.focus({ preventScroll: true });
    const vb = typeof c.viewBox === 'function' ? c.viewBox(st.id, S.s) : c.viewBox;
    svg.setAttribute('viewBox', (narrow.matches ? vb.phone : vb.desk) || '0 0 1000 620');
  }
  let prev = {};
  function renderReadouts() {
    const rows = c.readouts(S.s, result()), box = $('#readouts');
    if (box.children.length !== rows.length) {
      box.replaceChildren(...rows.map((_, i) => { const d = document.createElement('div'); d.className = 'reading'; d.innerHTML = `<span class="reading-label" id="l-${i + 1}"></span><span class="reading-num num" id="r-${i + 1}"></span><span class="reading-unit" id="u-${i + 1}"></span><span class="reading-formula" id="n-${i + 1}"></span>`; return d; }));
    }
    rows.forEach(([label, value, unit, note], i) => {
      const n = i + 1, num = $('#r-' + n), v = String(value);
      $('#l-' + n).textContent = label; $('#u-' + n).textContent = unit || ''; $('#n-' + n).textContent = note || '';
      if (prev[n] !== undefined && prev[n] !== v) { num.classList.remove('tick'); void num.offsetWidth; num.classList.add('tick'); }
      prev[n] = v; num.textContent = v;
    });
  }

  /* ---------- 余老師 ---------- */
  function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
  function talk() {
    if (lastNote) return;
    const st = step(), done = S.done.includes(st.id);
    if (foundShown) {
      const f = byId(foundShown).found, last = idx(foundShown) === STEPS.length - 1;
      teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action: last ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(STEPS[idx(foundShown) + 1].id) } });
      return;
    }
    const kind = st.kind || 'observe';
    if (kind === 'observe') {
      const r = result(), t = matchTarget(st, S.s, r), next = nextTarget(st);
      if (done) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。也可以再多試幾種。', { pose: 'thumb' }); return; }
      if (t && !got(st.id, t.sig)) { teacher.say(t.ready ? t.ready(S.s, r) : `${t.title(S.s, r)}：${t.body(S.s, r)}。收下這次觀察！`, { pose: 'wow' }); return; }
      const react = st.react ? st.react(S.s, r) : '';
      if (t && got(st.id, t.sig)) { teacher.say(`這個已經收過了。${next ? next.aim : ''}`, { pose: 'point' }); return; }
      teacher.say([react, next ? next.aim : ''].filter(Boolean).join(' ') || st.intro, { pose: 'point' });
      return;
    }
    if (kind === 'calc') { teacher.say(done ? '算對了！按任務卡的「下一步」繼續。' : st.intro, { pose: done ? 'thumb' : 'notebook' }); return; }
    teacher.say(done ? '全部完成了！可以按「看成果」。' : st.intro, { pose: done ? 'thumb' : 'think' });
  }

  /* ---------- 任務卡與面板 ---------- */
  function renderTask() {
    const st = step(), i = idx(st.id), done = S.done.includes(st.id), kind = st.kind || 'observe';
    $('#task-kicker').textContent = `任務 ${i + 1} / ${STEPS.length}${done ? '　✓ 已完成' : ''}`;
    $('#task-title').textContent = st.title; $('#task-goal').textContent = st.goal;
    const go = $('#task-go'), last = i === STEPS.length - 1;
    go.hidden = !done; go.textContent = last ? '看成果 →' : '下一步 →'; go.onclick = last ? openFinish : () => goStep(STEPS[i + 1].id);
    $('#dock-observe').hidden = kind !== 'observe'; $('#dock-calc').hidden = kind !== 'calc'; $('#dock-quiz').hidden = kind !== 'quiz';
    if (kind === 'observe') {
      renderControls();
      const r = result(), t = matchTarget(st, S.s, r);
      $('#todo').replaceChildren(...(st.targets || []).map(x => { const li = document.createElement('li'); li.textContent = x.label; if (got(st.id, x.sig)) li.className = 'got'; else if (t === x) li.className = 'now'; return li; }));
      $('#save').classList.toggle('cue', !!t && !got(st.id, t.sig));
    }
    if (kind === 'calc') renderCalc();
    if (kind === 'quiz') renderQuiz();
  }

  /* ---------- 算一算 ---------- */
  let calcBuilt = null;
  const num = v => { const t = String(v).trim().replace(/[A-Za-zΩ°℃%％\s]/g, '').replace('，', '.').replace('．', '.').replace('－', '-').replace('−', '-'); return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; };
  function renderCalc() {
    const st = step(); $('#calc-head').textContent = st.head || '算一算';
    const box = $('#calc-rows');
    if (calcBuilt !== st.id) {
      calcBuilt = st.id;
      box.replaceChildren(...st.rows.map(r => {
        const lab = document.createElement('label'); lab.className = 'calc-row'; lab.htmlFor = 'calc-' + r.id;
        lab.innerHTML = `<span class="calc-name"><b>${esc(r.name)}</b><span class="calc-eq">${esc(r.eq)}</span></span><input id="calc-${r.id}" inputmode="decimal" autocomplete="off"><span>${esc(r.unit)}</span>`;
        lab.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
        return lab;
      }));
    }
    for (const r of st.rows) { const inp = $('#calc-' + r.id); if (document.activeElement !== inp) inp.value = S.calc[st.id + '.' + r.id] || ''; }
  }
  function check() {
    const st = step(), res = {};
    for (const r of st.rows) {
      const inp = $('#calc-' + r.id); S.calc[st.id + '.' + r.id] = inp.value;
      res[r.id] = Math.abs(num(inp.value) - r.answer) <= (r.tol ?? 1e-6);
      inp.classList.toggle('ok', res[r.id]); inp.classList.toggle('bad', !res[r.id] && inp.value.trim() !== '');
    }
    save();
    if (st.rows.every(r => res[r.id])) { markDone(st.id); render(); return; }
    const w = st.rows.find(r => !res[r.id]), v = num($('#calc-' + w.id).value);
    oops(Number.isNaN(v) ? `先在「${w.name}」那一格填數字。` : (w.hint && w.hint(v)) || `${w.name}：${w.eq} ＝ ？再算一次。`);
  }

  /* ---------- 說說看 ---------- */
  function renderQuiz() {
    const qi = Math.min(S.quiz.i, c.quiz.length - 1), item = c.quiz[qi];
    $('#quiz-q').textContent = `第 ${qi + 1} / ${c.quiz.length} 題　${item.q}`;
    $('#quiz').replaceChildren(...item.options.map((o, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = o.text;
      if (S.quiz.pick === k) b.classList.add(o.ok ? 'ok' : 'bad');
      b.addEventListener('click', () => {
        S.quiz.pick = k; lastNote = null;
        if (!o.ok) { save(); render(); oops(o.why); return; }
        if (qi < c.quiz.length - 1) {
          save(); render(); teacher.last = '';
          teacher.say('答對了！', { pose: 'thumb', action: { label: '下一題 →', run: () => { S.quiz = { i: qi + 1, pick: null }; lastNote = null; save(); teacher.last = ''; render(); } } });
          lastNote = 'quiz-ok';
        } else { markDone(step().id); render(); }
      });
      return b;
    }));
  }

  /* ---------- 證據 ---------- */
  function markDone(id) { if (!S.done.includes(id)) S.done.push(id); foundShown = id; lastNote = null; save(); }
  function renderEvidence() {
    const n = S.records.length;
    $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
    const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
    if (chips.dataset.key === key) return; chips.dataset.key = key;
    chips.replaceChildren(...want.map(r => { const li = document.createElement('li'); li.className = 'chip'; li.innerHTML = `<small>#${r.n} ${esc(byId(r.step).label)}</small><b>${esc(r.title)}</b><span class="res ok">${esc(r.body)}</span>`; return li; }));
  }
  function keep() {
    const st = step();
    if ((st.kind || 'observe') !== 'observe') return;
    const r = result(), t = matchTarget(st, S.s, r), next = nextTarget(st);
    if (!t) { oops(`現在的狀態不是這一步要找的證據。${next ? next.aim : '這一步的證據都收齊了。'}`); return; }
    if (got(st.id, t.sig)) { oops(`這張已經收過了。${next ? next.aim : ''}`); return; }
    if (S.records.length >= 80) { oops('手冊滿了，清空紀錄才能再收。'); return; }
    const rec = { n: S.records.length + 1, step: st.id, sig: t.sig, title: t.title(S.s, r), body: t.body(S.s, r), at: new Date().toISOString() };
    S.records.push(rec); lastNote = null;
    if (st.targets.every(x => got(st.id, x.sig))) markDone(st.id); else save();
    const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
    fly($('#save'), target, rec.title).then(() => { renderEvidence(); bump($('#note-count')); });
    render();
  }
  const isVisible = n => { const b = n.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0; };

  /* ---------- 步驟 ---------- */
  function goStep(id) {
    const st = byId(id);
    S.step = id; foundShown = null; lastNote = null;
    if (st.enter) S.s = { ...S.s, ...st.enter };
    if ((st.kind) === 'quiz' && !S.done.includes(id)) S.quiz = { i: 0, pick: null };
    calcBuilt = null; save(); teacher.last = ''; render();
    if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
  function resetStep() {
    const st = step();
    S.records = S.records.filter(r => r.step !== st.id).map((r, i) => ({ ...r, n: i + 1 }));
    S.done = S.done.filter(d => d !== st.id);
    for (const k of Object.keys(S.calc)) if (k.startsWith(st.id + '.')) delete S.calc[k];
    if (st.kind === 'quiz') S.quiz = { i: 0, pick: null };
    $('#chips').dataset.key = '';
    goStep(st.id);
  }

  /* ---------- 對話框 ---------- */
  function openNotes() {
    const body = $('#notes-body'); body.replaceChildren();
    if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="4" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
    for (const r of S.records) { const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.n}</td><td>${esc(byId(r.step).label)}</td><td><b>${esc(r.title)}</b></td><td>${esc(r.body)}</td>`; body.append(tr); }
    $('#notes-dialog').showModal();
  }
  function openFinish() {
    const gotN = STEPS.filter(s => S.done.includes(s.id)).length;
    $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
    $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${gotN} 個`);
    const items = c.finish.items ? c.finish.items(S.records) : S.records.slice(0, 8).map(r => `${r.title}：${r.body}`);
    $('#finish-list').innerHTML = items.map(t => `<li>${esc(t)}</li>`).join('');
    $('#finish-dialog').showModal();
  }
  let clearing = false;
  async function clearAll() {
    if (clearing) return;
    if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
    clearing = true;
    let ok; try { ok = await db.clear(); } finally { clearing = false; }
    if (!ok) return;
    S = fresh(); foundShown = null; lastNote = null; teacher.last = ''; calcBuilt = null; $('#chips').dataset.key = '';
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    render(); if (narrow.matches) scrollTo({ top: 0 });
  }

  function render() {
    renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
    draw(); renderReadouts(); renderEvidence(); renderTask(); talk();
  }
  narrow.addEventListener?.('change', () => render());
  $('#save').addEventListener('click', keep);
  $('#check').addEventListener('click', check);
  $('#task-reset').addEventListener('click', resetStep);
  $('#clear-records').addEventListener('click', clearAll);
  $('#reset-all').addEventListener('click', clearAll);
  $('#why').addEventListener('click', () => $('#why-dialog').showModal());
  $('#open-notes').addEventListener('click', openNotes);
  document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  render();
  // 給瀏覽器檢查用的唯讀介面：目前步驟的目標設定與控制列（不能用來改進度）
  globalThis.__labDesk = Object.freeze({
    targets: () => (step().targets || []).map(t => ({ sig: t.sig, set: { ...t.set } })),
    controls: () => (step().controls || []).map(x => ({ key: x.key, type: x.type, options: x.options ? x.options.map(o => o[0]) : null })),
    value: k => S.s[k]
  });
  return { get state() { return S; }, set, goStep };
}
