/* Scripted instrument graphics. Values are model quantities, not physical measurements. */
(() => {
  'use strict';
  const C = {
    ink: '#23324c', muted: '#465771', line: '#b8c5d0', grid: '#dedfe4',
    paper: '#fffdf8', cream: '#fff2dc', peach: '#f5c590', wood: '#c87a49',
    woodDark: '#764224', teal: '#146b64', tealLight: '#e6f4eb',
    orange: '#a13b33', orangeLight: '#fce9df', steel: '#c6dbe6'
  };
  const g = 9.8;
  const k = 50;
  const maxStatic = 5.88;
  const kinetic = 3.92;
  const num = (v) => Number.isFinite(v) ? v : 0;
  const fmt = (v) => String(Math.round(v * 100) / 100);
  const springForce = (m) => m * g;
  const length = (m) => springForce(m) / k * 100;
  const outOfRange = (m) => length(m) > 30 + 1e-9;
  const t = (x, y, s, opts = '') => `<text x="${x}" y="${y}" ${opts}>${s}</text>`;
  const svg = (name, h, body, extra = '') => `<svg class="sf-diagram ${name}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 ${h}" width="420" height="${h}" role="img" ${extra} style="display:block;width:100%;height:auto;font-family:system-ui,'Noto Sans TC',sans-serif;color:${C.ink};fill:${C.ink};font-size:16px">${body}</svg>`;
  const L = (x1, y1, x2, y2, color, w = 1, extras = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${extras}/>`;
  const rect = (x, y, w, h, fill, rx = 0, stroke = 'none', sw = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const circle = (x, y, r, fill, stroke = 'none', sw = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const weight = 'font-weight="750"';
  const small = 'font-size="14"';
  const end = 'text-anchor="end"';
  const mid = 'text-anchor="middle"';
  const back = h => rect(1, 1, 418, h - 2, C.paper, 18, '#e8d7c5', 2);
  const tech = (x, y, s, color, bg) =>
    rect(x, y - 19, 99, 27, bg, 13) + t(x + 49.5, y, s, `${mid} ${weight} ${small} fill="${color}"`);

  function spring(value) {
    const m = Math.max(0, num(value));
    const over = outOfRange(m);
    const cm = length(m);
    const y = (ext) => 88 + ext * 4.75;
    const springX = 163;
    const ticks = Array.from({length:31}, (_, i) => {
      const py = y(i);
      return L(298, py, i % 5 ? 306 : 313, py, C.ink, i % 5 ? 1 : 2) +
        (i % 5 ? '' : t(324, py + 5, i, `${weight} ${small}`));
    }).join('');
    function coil(to) {
      const start = 43;
      const segments = 26;
      const last = to - 8;
      const offsets = [0, 12, 0, -12];
      const points = Array.from({length:segments + 1}, (_,i) =>
        `${springX + (i === segments ? 0 : offsets[i % 4])} ${(start + ((last - start) / segments) * i).toFixed(2)}`
      ).join(' L ');
      const line = `M ${springX} 34 L ${points} L ${springX} ${to}`;
      return `<path d="${line}" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="${line}" fill="none" stroke="#a8d5db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const py = y(cm);
    const guide = `stroke-dasharray="5 5"`;
    const apparatus = [
      rect(21, 29, 378, 229, '#faebd6', 16),
      rect(28, 239, 363, 23, '#f5d9b5', 12),
      rect(76, 234, 118, 15, C.wood, 6, C.ink, 3),
      rect(105, 22, 14, 216, C.steel, 6, C.ink, 3),
      rect(103, 21, 104, 16, C.steel, 6, C.ink, 3),
      circle(113, 29, 4, C.paper, C.ink, 2),
      rect(287, 59, 68, 182, '#fff8db', 8, C.ink, 2),
      t(323, 79, 'cm', `${mid} ${weight} ${small}`),
      ticks,
      L(springX - 25, y(0), 298, y(0), C.teal, 2, guide),
      t(275, 80, '原長基準', `${end} ${weight} ${small} fill="${C.teal}"`),
    ].join('');
    const suspended = over ? [
      rect(124, 112, 149, 56, C.orangeLight, 10, C.orange, 1.5),
      t(198.5, 136, '超過模型範圍', `${mid} ${weight} fill="${C.orange}"`),
      t(198.5, 156, '不顯示伸長讀值', `${mid} ${small} fill="${C.orange}"`),
    ].join('') : [
      coil(py),
      m > 0 ? [
        L(springX, py, 293, py, C.orange, 2, guide),
        circle(springX, py, 5, C.paper, C.orange, 2.5),
        L(springX, py, springX, py + 10, C.ink, 3),
        rect(springX - 28, py + 10, 56, 27, C.peach, 7, C.ink, 2.5),
        t(springX, py + 29, `${m.toFixed(1)} kg`, `${mid} ${weight} ${small}`),
        t(276, py - 8, `${fmt(cm)} cm`, `${end} ${weight} fill="${C.orange}"`)
      ].join('') : circle(springX, py, 5, C.paper, C.teal, 2.5)
    ].join('');
    const label = over
      ? `掛上 ${fmt(m)} 公斤：超過模型範圍，不顯示伸長讀值。`
      : `彈簧尺從未加掛時的原長基準算起。伸長 ${fmt(cm)} 公分。`;
    return svg('sf-spring', 274, back(274) + apparatus + suspended, `aria-label="${label}"`);
  }

  function arrow(x, tip, y, color) {
    const distance = Math.abs(tip - x);
    if (distance < 1) return '';
    const side = Math.sign(tip - x);
    const head = Math.min(10, Math.max(1, distance * 0.45));
    return L(x, y, tip - side * head * 0.55, y, color, 5, 'stroke-linecap="round"') +
      `<path d="M${tip} ${y} L${tip - side * head} ${y - 7} v14 Z" fill="${color}"/>`;
  }

  function friction(value) {
    const pull = Math.min(8, Math.max(0, num(value)));
    const moving = pull - maxStatic > 1e-9;
    const f = moving ? kinetic : pull;
    const boxX = moving ? 184 : 141;
    const center = boxX + 36;
    const pullL = pull * 16;
    const fricL = f * 16;
    const yBoard = 128;
    const visual = [
      back(233),
      rect(21, 26, 378, 143, '#faebd6', 16),
      rect(27, yBoard, 366, 26, C.peach, 6, C.ink, 2.5),
      L(29, yBoard + 5, 391, yBoard + 5, '#fff8dc', 2),
      L(38, yBoard + 17, 97, yBoard + 17, '#c98152', 2, 'stroke-linecap="round"'),
      L(117, yBoard + 17, 152, yBoard + 17, '#c98152', 2, 'stroke-linecap="round"'),
      L(285, yBoard + 17, 380, yBoard + 17, '#c98152', 2, 'stroke-linecap="round"'),
      L(141, yBoard + 5, 141, yBoard + 22, C.teal, 1.5, 'stroke-dasharray="3 3"'),
      moving ? [
        '<g class="sf-motion-trails">',
        L(107, 98, 157, 98, C.orange, 3, 'stroke-linecap="round" opacity=".60"'),
        L(124, 113, 171, 113, C.orange, 3, 'stroke-linecap="round" opacity=".52"'),
        '</g>',
        t(243, 193, '虛線標出起點', `${small} fill="${C.muted}"`)
      ].join('') : '',
      L(boxX + 70, 107, 365, 107, C.ink, 2, 'class="sf-pull-string" stroke-linecap="round"'),
      circle(367, 107, 5, C.paper, C.ink, 2),
      '<g class="sf-moving-block">',
      `<path d="M${boxX} 90 l11 -10 h70 l-10 10Z" fill="${C.peach}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
      `<path d="M${boxX + 71} 90 l10 -10 v36 l-10 11Z" fill="${C.wood}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
      rect(boxX, 90, 71, 37, '#e9a56f', 4, C.ink, 2.5),
      t(center, 114, '2 kg', `${mid} ${weight} ${small}`),
      arrow(center, center + pullL, 68, C.orange),
      `<g class="sf-friction-arrow" style="transform-origin:${center}px 68px">`,
      arrow(center, center - fricL, 68, C.teal),
      '</g></g>',
      t(36, 49, `摩擦力  ${fmt(f)} N`, `${weight} fill="${C.teal}"`),
      t(385, 49, `拉力  ${fmt(pull)} N`, `${end} ${weight} fill="${C.orange}"`),
      tech(31, 195, moving ? '開始滑動' : pull >= maxStatic - 1e-9 ? '臨界・靜止' : '木塊靜止',
        moving ? C.orange : C.teal, moving ? C.orangeLight : C.tealLight),
      t(31, 220, '同一塊有摩擦的水平木板', `${small} fill="${C.muted}"`)
    ].join('');
    return svg('sf-friction', 233, visual,
      `data-sliding="${moving}" aria-label="水平向右拉力 ${fmt(pull)} 牛頓，反向摩擦力 ${fmt(f)} 牛頓，木塊${moving ? '開始滑動' : '保持靜止'}。"`);
  }

  function grid(o) {
    const { X, Y, xTicks, yTicks, endX, endY, titleY } = o;
    return [
      t(23, 28, titleY, `${weight}`),
      ...xTicks.map(v => L(X(v), Y(0), X(v), endY, C.grid) +
        t(X(v), Y(0) + 22, v, `${mid} ${small}`)),
      ...yTicks.map(v => L(X(0), Y(v), endX, Y(v), C.grid) +
        t(X(0) - 11, Y(v) + 5, v, `${end} ${small}`)),
      L(X(0), Y(0), endX, Y(0), C.ink, 2),
      L(X(0), Y(0), X(0), endY, C.ink, 2),
    ].join('');
  }

  function springPlot(records) {
    const xs = Array.isArray(records) ? records : [];
    const masses = Array.from(new Set(xs.filter(m => Number.isFinite(m) && m >= 0 && !outOfRange(m))))
      .sort((a,b) => a - b);
    const X = v => 53 + v * 21.8;
    const Y = v => 159 - v * 3.65;
    const marks = masses.map(m => {
      const x = X(springForce(m)), y = Y(length(m));
      return circle(x, y, 5, C.teal, C.paper, 2) + (m === 0 ? '' :
        t(x + 8, y - 8, `${fmt(length(m))} cm`, `${small} ${weight} fill="${C.teal}"`));
    }).join('');
    const trace = masses.length > 1 ? `<polyline fill="none" stroke="${C.teal}" stroke-width="2.5" points="${masses.map(m => `${X(springForce(m))},${Y(length(m))}`).join(' ')}"/>` : '';
    const hasOver = xs.some(m => Number.isFinite(m) && outOfRange(m));
    const footer = hasOver ? '超限組不列入伸長讀值' : masses.length ? '圖上只放已記錄的模型讀值' : '記錄後，圖上會出現對應的讀值';
    return svg('sf-spring-plot', 230, back(230) +
      grid({X, Y, xTicks:[0, 5, 10, 15], yTicks:[10,20,30], endX:382, endY:49, titleY:'伸長量（cm）'}) +
      trace + marks + t(390, 201, '拉力（N）', `${end} ${weight} ${small}`) +
      t(24, 216, footer, `${small} fill="${hasOver ? C.orange : C.muted}"`),
    'aria-label="彈簧拉力與伸長量的關係圖，只顯示模型範圍內的紀錄。"');
  }

  function frictionPlot(value) {
    const pull = Math.min(8, Math.max(0, num(value)));
    const X = v => 59 + v * 41;
    const Y = v => 160 - v * 17;
    const closeToEndpoint = Math.abs(X(pull) - X(maxStatic)) < 13;
    const f = pull - maxStatic > 1e-9 ? kinetic : pull;
    const liveHeader = pull > 0
      ? t(388, 27, `當前拉力 ${fmt(pull)} N`, `${end} ${weight} ${small} fill="${C.orange}"`)
      : '';
    const current = pull > 0 ? [
      L(X(pull), Y(0), X(pull), closeToEndpoint ? Y(kinetic) + 11 : Y(f), C.orange, 1.5, 'stroke-dasharray="3 4"'),
      `<path d="M${X(pull)} 158 l-5 6 h10 Z" fill="${C.orange}"/>`,
      !closeToEndpoint ? circle(X(pull), Y(f), 4, C.orange, C.paper, 1.5) : ''
    ].join('') : '';
    const graph = [
      back(245),
      grid({X, Y, xTicks:[0,2,4,6,8], yTicks:[2,4,6], endX:387, endY:48, titleY:'摩擦力（N）'}),
      L(X(0), Y(0), X(maxStatic), Y(maxStatic), C.teal, 3.5, 'stroke-linecap="round"'),
      L(X(maxStatic), Y(kinetic), X(8), Y(kinetic), C.orange, 3.5),
      current,
      circle(X(maxStatic), Y(maxStatic), 5.5, C.teal, C.paper, 1.5),
      circle(X(maxStatic), Y(kinetic), 5.5, C.paper, C.orange, 2.5),
      t(X(maxStatic) - 11, Y(maxStatic) - 6, '5.88', `${end} ${weight} ${small} fill="${C.teal}"`),
      t(X(maxStatic) - 11, Y(kinetic) + 9, '3.92', `${end} ${weight} ${small} fill="${C.orange}"`),
      liveHeader,
      t(390, 204, '水平拉力（N）', `${end} ${weight} ${small}`),
      circle(30, 200, 4, C.teal, C.teal, 2),
      t(43, 205, '仍靜止', `${weight} ${small} fill="${C.teal}"`),
      circle(108, 200, 4, C.paper, C.orange, 2),
      t(121, 205, '滑動後', `${weight} ${small} fill="${C.orange}"`),
      t(24, 229, '從靜止開始，逐步增加水平拉力', `${small} fill="${C.muted}"`)
    ].join('');
    return svg('sf-friction-plot', 245, graph,
      'aria-label="從靜止開始增加水平拉力。臨界拉力 5.88 牛頓仍靜止，摩擦力 5.88 牛頓；超過臨界開始滑動，摩擦力降為 3.92 牛頓。"');
  }

  window.SpringDiagrams = Object.freeze({spring, friction, springPlot, frictionPlot});
})();
