// 顯微鏡實驗桌：倍率、視野與像的位置來自 ./model.mjs。
import { scope, KIND, SPECIMEN } from './model.mjs';
import { addDefs, compound, stereo, stageTop, fieldView, printedLetter, tissue, filmCard, stageLift, LEVER, AXIS } from './art.mjs';
import { runDesk } from '../shared/desk.mjs';

const DIR = { center: '不移動', left: '往左移', right: '往右移', up: '往上移', down: '往下移' }, POS = (p) => p[0] === 0 && p[1] === 0 ? '視野正中央' : `視野${p[1] < 0 ? '上' : p[1] > 0 ? '下' : ''}${p[0] < 0 ? '左' : p[0] > 0 ? '右' : ''}${Math.abs(p[0]) > 1 || Math.abs(p[1]) > 1 ? '外面（看不到）' : '邊'}`;
const f = x => String(Math.round(x * 100) / 100);
const OFF = { center: [0, 0], left: [-34, 0], right: [34, 0], up: [0, -26], down: [0, 26] }, SLIDES = ['center', 'left', 'right'];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), near = (list, v, of) => list.reduce((m, k) => Math.abs(of(k) - v) < Math.abs(of(m) - v) ? k : m);
// 直接拖動場景裡的器材：拖的時候只改畫面，放開才寫回設定（面板上的按鈕仍然可以用）
function drag(node, begin) {
  node.style.touchAction = 'none'; node.style.cursor = 'grab';
  node.addEventListener('pointerdown', e => {
    if (e.button) return; e.preventDefault(); const h = begin(e);
    const mv = ev => h.move(ev), up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); h.end(); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
}
function scene({ rig, el, txt, k, s, r, step, set, tool, kind }) {
  const CX = 610, CY = 300, R = 200, defs = addDefs(el, rig), svg = rig.ownerSVGElement, can = kind === 'observe';
  const scale = () => svg.getScreenCTM().a;
  if (step === 'kind') {
    // 兩種顯微鏡並排：同一片透明片（會透光，複式顯微鏡才看得到），各自的成像同時看得到
    txt(rig, 480, 50, '同一片印著 F 的透明片，放到兩種顯微鏡下看', { 'font-size': 15 });
    Object.keys(KIND).forEach((key, i) => { const x = 88 + i * 396, on = key === s.kind, K = KIND[key], g = el('g', {}, rig), cx = x + 262, cy = 262;
      el('rect', { x, y: 70, width: 388, height: 480, rx: 18, fill: '#FFFDF2', stroke: on ? '#2E8B66' : '#8A93A6', 'stroke-width': on ? 5 : 2, 'stroke-dasharray': on ? '' : '7 5' }, g);
      txt(g, x + 72, 112, K.name, { 'font-size': 15, fill: on ? '#1F6E50' : '#23304A' });
      const m = el('g', { transform: `translate(${x + 10 - 55} 150) scale(.5)` }, g); if (key === 'stereo') stereo(el, m); else compound(el, m, {});
      const W = fieldView(el, g, defs, { CX: cx, CY: cy, R: 108, bg: '#FFFDF2', id: '-' + key });
      if (K.solid) filmCard(el, txt, W.content, { CX: cx, CY: cy, scale: .52 }); else printedLetter(el, txt, W.content, { x: cx, y: cy, size: 104 });
      txt(g, cx, 112, '從目鏡看到的像', { 'font-size': 13, fill: '#5A6478' });
      txt(g, x + 194, 440, K.upright ? '像是正立的，看得出立體的高低' : '像上下、左右都相反，是平面的', { 'font-size': 15, fill: '#C8372D' });
      txt(g, x + 194, 470, `倍率：${K.range}`, { 'font-size': 14 }); txt(g, x + 194, 498, `適合看${K.use}`, { 'font-size': 13, fill: '#5A6478' });
      if (on) { el('rect', { x: x + 144, y: 512, width: 100, height: 26, rx: 13, fill: '#2E8B66' }, g); txt(g, x + 194, 530, '記錄這一台', { 'font-size': 13, fill: '#fff' }); }
      else if (can) { el('rect', { x: x + 134, y: 512, width: 120, height: 26, rx: 13, fill: '#FFFDF2', stroke: '#2E8B66', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, g); txt(g, x + 194, 530, '點這裡換這台', { 'font-size': 13, fill: '#1F6E50' }); tool(g, `換成${K.name}`, () => set({ kind: key })); } });
    return;
  }
  const cells = ['mag', 'light', 'spec'].includes(step) || !can, spec = step === 'spec' ? s.spec : 'onion';
  const hint = (x, y, str) => { if (!can) return; const w = str.length * 15 * k + 28; el('rect', { x: x - w / 2, y: y - 14 - 6 * k, width: w, height: 18 + 10 * k, rx: 14, fill: '#FFFDF2', stroke: '#2E8B66', 'stroke-width': 2, 'stroke-dasharray': '5 4', 'pointer-events': 'none' }, rig); txt(rig, x, y, str, { 'font-size': 14, fill: '#1F6E50', 'pointer-events': 'none' }); };
  // 右：目鏡視野
  const V = fieldView(el, rig, defs, { CX, CY, R, bg: cells ? (SPECIMEN[spec].chloroplast ? '#F1F8DC' : '#FBF6DC') : '#FFFDF2', clarity: r.clarity, light: r.light });
  const moving = el('g', {}, V.content);
  if (cells) tissue(el, moving, { CX, CY, R, px: 2 * R / r.field, kind: spec });
  else printedLetter(el, txt, moving, { x: CX + r.pos[0] * 150, y: CY + r.pos[1] * 150, size: s.obj === 4 ? 86 : 120 });
  txt(rig, CX, CY - R - 28, '從目鏡看到的視野', { 'font-size': 14, fill: '#5A6478' });
  el('rect', { x: CX - 262, y: CY + R + 24, width: 524, height: 30, rx: 15, fill: '#FFFDF2', opacity: .95 }, rig);
  const cap = txt(rig, CX, CY + R + 44, '', { 'font-size': 15 }), say = (str, good) => { cap.textContent = str; cap.setAttribute('fill', good === undefined ? '#23304A' : good ? '#2E8B66' : '#C8372D'); };
  const focusWord = c => say(c >= 100 ? '非常清楚' : c >= 80 ? '看得到了，還有一點模糊' : '很模糊', c >= 100);
  if (step === 'focus') focusWord(r.clarity);
  else if (step === 'spec') say(r.S.chloroplast ? '水蘊草：細胞裡有許多綠色的葉綠體' : '洋蔥表皮（碘液染色）：看得到細胞核，沒有葉綠體');
  else if (step === 'light') say(`光線${r.lightState}${r.lightState === '太亮' ? '，細胞的輪廓淡到看不清' : r.lightState === '太暗' ? '，視野太黑' : '，看得清楚'}`, r.lightState === '適中');
  else if (cells) say(`視野直徑 ${f(r.field)} mm，一排約 ${r.cells} 個細胞，亮度：${r.bright}`);
  else { el('path', { d: `M${CX - 14} ${CY}H${CX + 14}M${CX} ${CY - 14}V${CY + 14}`, stroke: '#C8372D', 'stroke-width': 2 }, rig); say(`像在${POS(r.pos)}`, r.centered); }

  // 左：器材
  if (step === 'image' || step === 'center') {
    const o = OFF[s.slide], xs = SLIDES.map(a => OFF[a][0]);
    txt(rig, 240, 196, '載物台（從上面看）', { 'font-size': 14, fill: '#5A6478' });
    const sl = stageTop(el, txt, rig, { dx: o[0], dy: o[1], label: '字母' }); sl.setAttribute('data-drag', 'slide');
    hint(240, 484, '拖動玻片');
    if (can) drag(sl, e => { const sc = scale(), x0 = e.clientX; let x = o[0];
      return { move(ev) { x = clamp(o[0] + (ev.clientX - x0) / sc, Math.min(...xs), Math.max(...xs)); sl.setAttribute('transform', `translate(${x} ${o[1]})`); moving.setAttribute('transform', `translate(${-(x - o[0]) / 34 * 150} 0)`); },
        end() { const to = near(SLIDES, x, a => OFF[a][0]); if (to !== s.slide) set({ slide: to }); else { sl.setAttribute('transform', `translate(${o[0]} ${o[1]})`); moving.removeAttribute('transform'); } } }; });
  } else if (step === 'spec') {
    txt(rig, 240, 196, '載物台（從上面看）', { 'font-size': 14, fill: '#5A6478' });
    const tint = c => c ? '#9CCB7A' : '#EBDD98';
    stageTop(el, txt, rig, { mark: '', tint: tint(r.S.chloroplast), label: r.S.chloroplast ? '水蘊草' : '洋蔥' });
    Object.keys(SPECIMEN).forEach((key, i) => { const x = 118 + i * 128, on = key === s.spec, g = el('g', { opacity: on ? .45 : 1 }, rig);
      el('rect', { x, y: 478, width: 116, height: 38, rx: 3, fill: 'url(#ms-glass)', stroke: '#6E97BB', 'stroke-width': 2 }, g); el('rect', { x: x + 4, y: 482, width: 62, height: 30, rx: 2, fill: '#FFFDF5', stroke: '#B9B2A2', 'stroke-width': 1 }, g);
      txt(g, x + 35, 502, key === 'onion' ? '洋蔥表皮' : '水蘊草', { 'font-size': 11, fill: '#5A6478' }); el('rect', { x: x + 76, y: 484, width: 28, height: 26, rx: 2, fill: tint(SPECIMEN[key].chloroplast), opacity: .8, stroke: '#8FB4D4', 'stroke-width': 1 }, g);
      if (can && !on) tool(g, `換成${SPECIMEN[key].name}`, () => set({ spec: key })); });
    hint(240, 548, '點玻片換標本');
  } else {
    const M = compound(el, rig, s), mark = (n, col) => el('circle', { cx: n.cx, cy: n.cy, r: n.hit.r.baseVal.value + 3, fill: 'none', stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': '6 5', 'pointer-events': 'none' }, rig);
    txt(rig, 148, 182, `使用中 ${s.obj}×`, { 'font-size': 13, fill: '#C8372D' });
    if (step === 'focus' && can) {
      const paint = (c, fi) => { M.coarse.rot.setAttribute('transform', `rotate(${c * 60} 313 384)`); M.fine.rot.setAttribute('transform', `rotate(${fi * 60} 313 452)`); M.stage.setAttribute('transform', `translate(0 ${-stageLift(c, fi)})`);
        const cl = Math.max(10, 100 - 20 * Math.abs((c - 2) * 3 + (fi - 1))); V.blur(cl); focusWord(cl); };
      const turn = (n, key, max) => { mark(n, '#2E8B66'); drag(n.hit, e => { const b = n.hit.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2; let prev = Math.atan2(e.clientY - cy, e.clientX - cx), v = s[key];
        return { move(ev) { const a = Math.atan2(ev.clientY - cy, ev.clientX - cx); let d = a - prev; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; prev = a; v = clamp(v + d * 180 / Math.PI / 60, 0, max); paint(key === 'coarse' ? v : s.coarse, key === 'fine' ? v : s.fine); },
          end() { const to = Math.round(v); if (to !== s[key]) set({ [key]: to }); else paint(s.coarse, s.fine); } }; }); };
      M.coarse.hit.setAttribute('data-drag', 'coarse'); M.fine.hit.setAttribute('data-drag', 'fine'); turn(M.coarse, 'coarse', 4); turn(M.fine, 'fine', 2);
      txt(rig, 362, 389, '粗', { 'font-size': 13 }); txt(rig, 352, 457, '細', { 'font-size': 13 });
      hint(AXIS, 42, '拖著轉調節輪');
    }
    if ((step === 'mag' || step === 'light') && can) {
      for (const o of step === 'mag' ? [4, 10, 40] : [4, 40]) { const ob = M.objs[o]; if (ob.active) continue;
        el('circle', { cx: ob.tip[0], cy: ob.tip[1] - 2, r: 15, fill: '#FFFDF2', stroke: '#2E8B66', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, ob.g.parentNode).setAttribute('pointer-events', 'none');
        txt(rig, ob.tip[0], ob.tip[1] + 3, `${o}×`, { 'font-size': 12, fill: '#1F6E50', 'pointer-events': 'none' }); tool(ob.g, `換成 ${o}× 物鏡`, () => set({ obj: o })); }
      hint(AXIS, 42, step === 'mag' ? '點物鏡換倍率' : '點物鏡、拖光圈拉桿');
    }
    if (step === 'light') {
      const open = { 1: 20, 3: 12, 5: 5 }[s.aperture];
      el('circle', { cx: 138, cy: 430, r: 31, fill: 'url(#ms-black)', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
      for (let i = 0; i < 8; i++) el('path', { d: `M138 430L${138 + 30 * Math.cos(i * Math.PI / 4)} ${430 + 30 * Math.sin(i * Math.PI / 4)}`, stroke: '#6B7892', 'stroke-width': 1.2 }, rig);
      el('circle', { cx: 138, cy: 430, r: open, fill: 'url(#ms-glow)', stroke: '#23304A', 'stroke-width': 2 }, rig);
      txt(rig, 138, 480, `光圈：${{ 1: '大', 3: '中', 5: '小' }[s.aperture]}`, { 'font-size': 13 });
      M.leverHit.setAttribute('data-drag', 'lever'); if (can) drag(M.leverHit, e => { const sc = scale(), x0 = e.clientX, o = LEVER[s.aperture]; let x = o, moved = false;
        return { move(ev) { x = clamp(o + (ev.clientX - x0) / sc, -36, 0); moved = moved || Math.abs(x - o) > 2; M.lever.setAttribute('transform', `translate(${x} 0)`); },
          end() { const to = moved ? near([1, 3, 5], x, a => LEVER[a]) : { 1: 3, 3: 5, 5: 1 }[s.aperture]; if (to !== s.aperture) set({ aperture: to }); else M.lever.setAttribute('transform', `translate(${o} 0)`); } }; });
    }
  }
}

const tgt = (sig, label, set, aim, body, title) => ({ sig, label, set, aim, title: title || (s => `物鏡 ${s.obj}×，玻片${DIR[s.slide]}`), body });
const base = { slide: 'center', target: 'center', coarse: 2, fine: 1, aperture: 3, spec: 'onion', kind: 'compound' };
const slideCtl = list => ({ key: 'slide', label: '移動玻片', type: 'seg', cols: 3, options: list.map(k => [k, DIR[k]]) });

runDesk({
  key: 'bhcs.lab.microscope.v1', title: '顯微鏡實驗桌', background: 'bg-chem-bench',
  sceneLabel: '顯微鏡實驗桌：左邊是可以拖動、點選的顯微鏡和玻片，右邊的圓形是從目鏡看到的視野',
  initial: { obj: 4, ...base },
  model: scope, scene, viewBox: { desk: '80 20 800 600', phone: '80 20 800 600' }, phoneText: 1.4,
  readouts: (s, r) => [['放大倍率', String(r.total), '倍', `${s.obj} × 10`], ['視野直徑', f(r.field), 'mm', `一排約 ${r.cells} 個細胞`], ['清晰度', String(r.clarity), '%', `光線${r.lightState}`]],
  why: { title: '複式顯微鏡', button: '顯微鏡怎麼看', html: `
    <p class="fn-tip"><b>放大倍率 ＝ 目鏡倍率 × 物鏡倍率。</b>這裡目鏡固定 10×。</p>
    <p class="fn-tip"><b>像是上下、左右都相反的。</b>玻片上的「F」，在視野裡是轉了 180 度的樣子。所以像偏向哪一邊，就把玻片往那一邊移，像才會回到中央。</p>
    <p class="fn-tip"><b>倍率越高：</b>看到的細胞越大、越少，視野範圍越小，也越暗。</p>
    <p class="fn-tip"><b>操作順序：</b>先用低倍物鏡找到目標、移到正中央，再換高倍物鏡，然後只用細調節輪對焦。高倍物鏡離玻片很近，轉粗調節輪容易壓破玻片。</p>
    <p class="fn-tip"><b>調光：</b>光線太強或太弱都看不清楚。換高倍後視野變暗，要把光圈調大或調整反光鏡。這裡的通光量是示意數值。</p>
    <p class="fn-tip"><b>解剖顯微鏡：</b>倍率比較低，像是正立的、有立體感，適合看不透光的立體標本；複式顯微鏡倍率高，看薄而透光的標本。</p>` },
  steps: [
    { id: 'image', label: '方向', title: '顯微鏡下的「F」長什麼樣子？', goal: '玻片上寫著 F。先收下不移動時的像，再把玻片往右移，看像往哪邊跑，收下結果。',
      intro: '比比看，左邊的玻片和右邊的視野，F 一樣嗎？', enter: { obj: 4, ...base }, controls: [slideCtl(['center', 'left', 'right'])],
      react: (s, r) => s.slide === 'center' ? '像是上下、左右都顛倒的 F。' : `玻片${DIR[s.slide]}，像跑到${POS(r.pos)}。`,
      targets: [tgt('c', '不移動', { obj: 4, target: 'center', slide: 'center' }, '先看不移動的樣子。', () => '像和玻片上的 F 上下、左右都相反'), tgt('r', '玻片往右移', { obj: 4, target: 'center', slide: 'right' }, '把玻片往右移。', (s, r) => `像往左跑，到${POS(r.pos)}`)],
      found: ['顯微鏡的像上下、左右都相反；玻片往右移，像往左跑。', '像的移動方向和玻片相反'] },
    { id: 'center', label: '置中', title: '目標偏在左邊，玻片要往哪裡移？', goal: '像現在偏在視野左邊。移動玻片，讓像回到正中央再收下。',
      intro: '換高倍之前，要先把目標移到正中央。往哪邊移？', enter: { obj: 10, ...base, target: 'left' }, controls: [slideCtl(['center', 'left', 'right'])],
      react: (s, r) => r.centered ? '回到正中央了！' : !r.inView ? '像跑出視野了，方向反了。' : `像在${POS(r.pos)}。`,
      targets: [tgt('ok', '像回到中央', { obj: 10, target: 'left', slide: 'left' }, '像偏左，就把玻片往左移。', () => '像偏左時把玻片往左移，像回到正中央')],
      found: ['像偏向哪一邊，玻片就往那一邊移。', '偏左 → 往左移；偏右上 → 往右上移'] },
    { id: 'focus', label: '對焦', title: '模糊的像，要怎麼調清楚？', goal: '用 4× 物鏡。先轉粗調節輪找到影像（清晰度到 80%）收下，再轉細調節輪調到 100% 收下。',
      intro: '現在一片模糊。先轉大的粗調節輪。', enter: { obj: 4, ...base, coarse: 0, fine: 0 },
      controls: [{ key: 'coarse', label: '粗調節輪', type: 'num', min: 0, max: 4, step: 1 }, { key: 'fine', label: '細調節輪', type: 'num', min: 0, max: 2, step: 1 }],
      react: (s, r) => `清晰度 ${r.clarity}%。`,
      targets: [tgt('c', '粗調節輪找到影像', { obj: 4, coarse: 2, fine: 0 }, '粗調節輪轉到第 2 格。', (s, r) => `清晰度 ${r.clarity}%，看得到影像了`, s => `粗調節輪第 ${s.coarse} 格、細調節輪第 ${s.fine} 格`), tgt('f', '細調節輪調清楚', { obj: 4, coarse: 2, fine: 1 }, '再把細調節輪轉到第 1 格。', (s, r) => `清晰度 ${r.clarity}%，非常清楚`, s => `粗調節輪第 ${s.coarse} 格、細調節輪第 ${s.fine} 格`)],
      found: ['粗調節輪動得多，用來找到影像；細調節輪動得少，用來把影像調清楚。', '先粗後細；高倍時只用細調節輪'] },
    { id: 'mag', label: '倍率', title: '倍率變高，看到的變多還是變少？', goal: '轉換物鏡。收下 4×、10×、40× 三種倍率的結果。',
      intro: '這是洋蔥表皮細胞。換高倍物鏡看看。', enter: { obj: 4, ...base }, controls: [{ key: 'obj', label: '物鏡', type: 'seg', options: [[4, '4×'], [10, '10×'], [40, '40×']] }],
      react: (s, r) => `${r.total} 倍：一排約 ${r.cells} 個細胞，亮度${r.bright}。`,
      targets: [4, 10, 40].map(o => tgt('o' + o, `物鏡 ${o}×`, { obj: o, slide: 'center', target: 'center' }, `換成 ${o}× 物鏡。`, (s, r) => `${r.total} 倍，視野直徑 ${f(r.field)} mm，一排約 ${r.cells} 個細胞，亮度${r.bright}`)),
      found: ['倍率越高，細胞看起來越大，但看到的數目越少、視野越小、越暗。', '倍率變 10 倍，視野直徑變 1/10'] },
    { id: 'light', label: '調光', title: '視野太亮或太暗，怎麼辦？', goal: '收下四種情況：4× 配大光圈、4× 配中光圈、40× 配中光圈、40× 配大光圈。',
      intro: '光圈開到最大，細胞看得清楚嗎？', enter: { obj: 4, ...base, aperture: 1 },
      controls: [{ key: 'obj', label: '物鏡', type: 'seg', options: [[4, '4×'], [40, '40×']] }, { key: 'aperture', label: '光圈', type: 'seg', options: [[1, '大'], [3, '中'], [5, '小']] }],
      react: (s, r) => `光線${r.lightState}。`,
      targets: [[4, 1], [4, 3], [40, 3], [40, 1]].map(([o, a]) => tgt(`l${o}${a}`, `${o}×、光圈${{ 1: '大', 3: '中' }[a]}`, { obj: o, aperture: a }, `物鏡 ${o}×、光圈${{ 1: '大', 3: '中' }[a]}。`, (s, r) => `進入眼睛的光${r.lightState}`, s => `物鏡 ${s.obj}×、光圈${{ 1: '大', 3: '中', 5: '小' }[s.aperture]}`)),
      found: ['低倍時光圈太大會太亮，細胞輪廓反而看不清；換高倍後變暗，要把光圈調大。', '光線適中才看得清楚'] },
    { id: 'spec', label: '標本', title: '洋蔥表皮和水蘊草，細胞哪裡不一樣？', goal: '用 10× 物鏡。收下洋蔥鱗莖表皮和水蘊草葉片兩種標本。',
      intro: '兩種都是植物細胞。找找看有沒有綠色的小顆粒。', enter: { obj: 10, ...base },
      controls: [{ key: 'spec', label: '標本', type: 'seg', options: Object.entries(SPECIMEN).map(([k, v]) => [k, v.name]) }],
      react: (s, r) => r.S.chloroplast ? '細胞裡有許多綠色的葉綠體。' : '看得到細胞壁和細胞核，沒有葉綠體。',
      targets: Object.keys(SPECIMEN).map(k => tgt(k, SPECIMEN[k].name, { obj: 10, spec: k }, `換成${SPECIMEN[k].name}。`, (s, r) => r.S.chloroplast ? '細胞排列整齊，有細胞壁，細胞裡有綠色的葉綠體' : '細胞排列整齊，有細胞壁和細胞核，沒有葉綠體', s => `${SPECIMEN[s.spec].name}，物鏡 ${s.obj}×`)),
      found: ['兩種都有細胞壁；水蘊草葉片照得到光，有葉綠體，洋蔥鱗莖長在土裡，表皮細胞沒有葉綠體。', '不是所有植物細胞都有葉綠體'] },
    { id: 'kind', label: '兩種鏡', title: '複式顯微鏡和解剖顯微鏡，差在哪裡？', goal: '同一片印著 F 的透明片，兩種顯微鏡的像並排比較。點選顯微鏡，兩台都收下。',
      intro: '解剖顯微鏡看到的 F，方向一樣嗎？', enter: { obj: 4, ...base },
      controls: [{ key: 'kind', label: '顯微鏡', type: 'seg', options: Object.entries(KIND).map(([k, v]) => [k, v.name]) }],
      react: (s, r) => r.K.upright ? '像是正立的，還看得出立體感。' : '像上下、左右都相反。',
      targets: Object.keys(KIND).map(k => tgt(k, KIND[k].name, { kind: k }, `換成${KIND[k].name}。`, (s, r) => `${r.K.upright ? '像正立、有立體感' : '像上下左右相反、平面'}；倍率${r.K.range}；適合看${r.K.use}`, s => KIND[s.kind].name)),
      found: ['複式顯微鏡倍率高、像相反，看薄而透光的標本；解剖顯微鏡倍率低、像正立有立體感，看不透光的立體標本。', '看細胞用複式；看昆蟲、花用解剖'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：倍率與視野', goal: '目鏡 10×。4× 物鏡時視野直徑 4 mm，一排看到 10 個細胞。', intro: '倍率 ＝ 目鏡 × 物鏡。', head: '放大倍率 ＝ 目鏡倍率 × 物鏡倍率',
      rows: [
        { id: 't', name: '目鏡 10×、物鏡 40×，放大倍率', eq: '10 × 40', answer: 400, unit: '倍' },
        { id: 'd', name: '物鏡從 4× 換成 40×，視野直徑變成', eq: '4 mm × 4 ÷ 40', answer: 0.4, unit: 'mm' },
        { id: 'n', name: '4× 時一排 10 個細胞，換成 40× 一排看到', eq: '10 × 4 ÷ 40', answer: 1, unit: '個', hint: v => v === 100 ? '倍率變大，看到的個數是變少。' : '' }],
      found: ['算對了！', '倍率變幾倍，視野直徑和一排的細胞數就變幾分之一'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '四題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後四題！想想視野裡的 F 和洋蔥細胞。',
      found: ['你會用顯微鏡了！', '像相反；高倍看得大、看得少、比較暗'] }
  ],
  quiz: [
    { q: '玻片上寫著「p」，在顯微鏡視野裡看起來像？', options: [
      { text: 'p', why: '顯微鏡的像上下、左右都相反，不會和原來一樣。' },
      { text: 'q', why: '只有左右相反才是 q。顯微鏡是上下也相反。' },
      { text: 'd', ok: true }] },
    { q: '在視野右上方發現一隻草履蟲，想把牠移到正中央，玻片要往哪裡移？', options: [
      { text: '右上方。', ok: true },
      { text: '左下方。', why: '像和玻片的移動方向相反：想讓像往左下回到中央，玻片要往右上移。你的證據：像偏左時是把玻片往左移。' },
      { text: '不用移，換高倍就會在中央。', why: '換高倍後視野更小，偏在旁邊的目標反而會跑出視野。' }] },
    { q: '從低倍換成高倍物鏡後，視野會？', options: [
      { text: '變亮、看到的細胞變多。', why: '相反。你的證據：40× 時一排只剩 1 個細胞，而且比較暗。' },
      { text: '變暗、看到的細胞變少但變大。', ok: true },
      { text: '完全沒有變化。', why: '倍率改變，視野大小、亮度和看到的細胞數都會變。' }] },
    { q: '換成高倍物鏡後影像有點模糊，應該轉哪一個？', options: [
      { text: '粗調節輪，一次調到位。', why: '高倍物鏡離玻片很近，轉粗調節輪容易壓破玻片。' },
      { text: '細調節輪。', ok: true },
      { text: '把光圈關小。', why: '光圈調的是亮度，不是清晰度。' }] },
  ],
  finish: { title: '你會用顯微鏡了！', rule: '放大倍率 ＝ 目鏡 × 物鏡。像上下、左右相反，像偏哪邊玻片就往哪邊移。對焦先粗後細，高倍只用細調節輪。倍率越高，視野越小、越暗，要把光調亮。', next: { label: '去細胞分裂實驗桌', href: '../cell-division/' } }
});
