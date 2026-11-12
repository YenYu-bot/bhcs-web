// 百宏小小研究員・新版實驗桌共用元件（試用版）
export const $ = (sel, root = document) => root.querySelector(sel);
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 只存在本機瀏覽器；讀寫失敗時不讓教材停擺。 */
export function store(key) {
  return {
    load() { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } },
    save(data) { try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch { return false; } },
    clear() { try { localStorage.removeItem(key); } catch { /* 無法存取時忽略 */ } }
  };
}

/** 余老師：換表情、說一句話。tone: 'say' | 'found' | 'oops' */
export class Teacher {
  constructor(pic, bubble, live) { this.pic = pic; this.bubble = bubble; this.live = live; this.last = ''; }
  say(text, { pose = 'point', tone = 'say', tag = '', eq = '', action = null } = {}) {
    const key = [text, pose, tone, tag, eq, action && action.label].join('|');
    this.pic.dataset.pose = pose;
    if (key === this.last) return;
    this.last = key;
    const b = this.bubble;
    b.className = 'bubble' + (tone === 'say' ? '' : ' ' + tone);
    b.replaceChildren();
    if (tag) { const t = document.createElement('span'); t.className = 'tag'; t.textContent = tag; b.append(t); }
    b.append(document.createTextNode(text));
    if (eq) { const e = document.createElement('span'); e.className = 'eq'; e.textContent = eq; b.append(e); }
    if (action) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'next'; btn.textContent = action.label;
      btn.addEventListener('click', action.run);
      b.append(btn);
    }
    void b.offsetWidth; b.classList.add('say-in');
    if (this.live) this.live.textContent = [tag, text, eq].filter(Boolean).join(' ');
  }
}

/** 任務進度膠囊；給 onPick 時每一步都可以點來切換 */
export function renderSteps(list, steps, nowId, doneIds, onPick) {
  list.replaceChildren(...steps.map((s, i) => {
    const li = document.createElement('li');
    const done = doneIds.has(s.id);
    li.className = done ? 'done' : (s.id === nowId ? 'now' : '');
    if (s.id === nowId) li.classList.add('now');
    const label = (done ? '✓ ' : (i + 1) + ' ') + s.label;
    if (onPick) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.setAttribute('aria-label', `第 ${i + 1} 步：${s.label}${done ? '（已完成）' : ''}`);
      if (s.id === nowId) b.setAttribute('aria-current', 'step');
      b.addEventListener('click', () => onPick(s.id));
      li.append(b);
    } else {
      li.textContent = label;
      if (s.id === nowId) li.setAttribute('aria-current', 'step');
    }
    return li;
  }));
}

/** 證據卡飛進手冊 */
export function fly(fromEl, toEl, text) {
  if (reduceMotion() || !fromEl || !toEl) return Promise.resolve();
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  const chip = document.createElement('div');
  chip.className = 'fly'; chip.textContent = text;
  document.body.append(chip);
  chip.style.left = a.left + a.width / 2 - 60 + 'px';
  chip.style.top = a.top - 10 + 'px';
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top - a.top;
  const anim = chip.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 80}px) scale(1.1) rotate(-6deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0.2 }
  ], { duration: 650, easing: 'cubic-bezier(.5,0,.3,1)' });
  return anim.finished.then(() => chip.remove(), () => chip.remove());
}

export function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

/** 彈簧動畫：把數值帶有回彈地推向目標 */
export class Spring {
  constructor(onFrame, { k = 120, c = 9 } = {}) { this.v = 0; this.x = 0; this.target = 0; this.k = k; this.c = c; this.onFrame = onFrame; this.raf = 0; }
  set(target, instant = false) {
    this.target = target;
    if (instant || reduceMotion()) { this.x = target; this.v = 0; this.onFrame(this.x); return; }
    if (!this.raf) { this.t = performance.now(); this.raf = requestAnimationFrame(this.tick); }
  }
  kick(v) { if (reduceMotion()) return; this.v += v; if (!this.raf) { this.t = performance.now(); this.raf = requestAnimationFrame(this.tick); } }
  tick = (now) => {
    const dt = Math.min(0.033, (now - this.t) / 1000); this.t = now;
    const a = -this.k * (this.x - this.target) - this.c * this.v;
    this.v += a * dt; this.x += this.v * dt;
    this.onFrame(this.x);
    if (Math.abs(this.v) < 0.01 && Math.abs(this.x - this.target) < 0.01) { this.x = this.target; this.onFrame(this.x); this.raf = 0; return; }
    this.raf = requestAnimationFrame(this.tick);
  };
}
