/* SVG ray diagram for the reflection and refraction trial. */
(function (global) {
  'use strict';
  const W = 420, H = 278, X = 210, Y = 134, FOOT = 43;
  const media = {
    air: { label: '空氣', fill: '#f8f1e4' },
    water: { label: '水', fill: '#e1f0ef' },
    glass: { label: '玻璃', fill: '#e6eaf5' }
  };
  const colors = { incoming: '#943226', reflected: '#754286', transmitted: '#126b68' };
  const fmt = x => Number(x).toFixed(2);
  const angleText = x => Number.isInteger(x) ? x + '°' : x.toFixed(1) + '°';
  const rad = x => x * Math.PI / 180;
  const point = (deg, radius) => [X + radius * Math.sin(rad(deg)), Y - radius * Math.cos(rad(deg))];
  const xy = p => p.map(fmt).join(' ');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const line = (a, b, attrs) => '<path d="M ' + xy(a) + ' L ' + xy(b) + '" ' + attrs + '/>';

  function extent(deg) {
    const dx = Math.sin(rad(deg)), dy = -Math.cos(rad(deg));
    const edgeX = dx < 0 ? 80 : W - 16;
    const edgeY = dy < 0 ? 16 : H - 18;
    const length = Math.min(Math.abs(dx) < 1e-10 ? Infinity : (edgeX - X) / dx,
      Math.abs(dy) < 1e-10 ? Infinity : (edgeY - Y) / dy);
    return point(deg, length);
  }

  function arrow(a, b, t, color, halo, size) {
    const head = mix(a, b, t), length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / length, uy = (b[1] - a[1]) / length;
    const base = [head[0] - ux * size, head[1] - uy * size];
    const left = [base[0] - uy * size * 0.43, base[1] + ux * size * 0.43];
    const right = [base[0] + uy * size * 0.43, base[1] - ux * size * 0.43];
    return '<path d="M ' + xy(head) + ' L ' + xy(left) + ' L ' + xy(right) +
      ' Z" fill="' + color + '" stroke="' + halo + '" stroke-width="1.1" stroke-linejoin="round"/>';
  }

  function arc(a, b, r, color, dashed) {
    if (Math.abs(a - b) < 0.05) return '';
    return '<path d="M ' + xy(point(a, r)) + ' A ' + r + ' ' + r + ' 0 0 ' +
      (b >= a ? 1 : 0) + ' ' + xy(point(b, r)) +
      '" fill="none" stroke="' + color + '" stroke-width="1.65"' +
      (dashed ? ' stroke-dasharray="3 2"' : '') + '/>';
  }

  function label(x, y, value, anchor, opt) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor +
      '" font-size="' + (opt && opt.size || 14) + '" font-weight="' + (opt && opt.weight || 700) +
      '" fill="' + (opt && opt.color || '#47392e') + '">' + value + '</text>';
  }

  function panelLabel(x, y, value, width) {
    return '<rect x="' + x + '" y="' + (y - 20) + '" width="' + width +
      '" height="28" rx="8" fill="#fffdf7" fill-opacity=".94" stroke="#a3927f" stroke-opacity=".65"/>' +
      label(x + 10, y, value, 'start');
  }

  function badge(x, y, value, color) {
    const width = Math.max(69, 17 + value.length * 12);
    return '<rect x="' + x + '" y="' + (y - 20) + '" width="' + width +
      '" height="28" rx="8" fill="#fffdf7" fill-opacity=".95" stroke="' + color + '" stroke-opacity=".55"/>' +
      label(x + 8, y, value, 'start', {color, size: 13});
  }

  function apparatus(config) {
    const mirror = config.scene === 'mirror';
    const top = media[config.from] || media.air;
    const bot = media[config.to] || media.water;
    const i = Math.max(0, Math.min(89.9, Number(config.angle) || 0));
    const r = Math.max(0, Math.min(89.9, Number(config.reflected) || 0));
    const critical = config.outcome === 'critical';
    const transmit = !mirror && config.outcome !== 'tir' && typeof config.refracted === 'number' && Number.isFinite(config.refracted);
    const t = critical ? 90 : Number(config.refracted);
    const o = [X, Y], inEnd = extent(-i), refEnd = extent(r), txEnd = transmit ? extent(180 - t) : o;
    const coincident = Math.abs(i) < 1e-9 && Math.abs(r) < 1e-9;
    const txText = transmit ? '折射角 ' + angleText(t) : '';
    const iText = '入射角 ' + angleText(i), rText = '反射角 ' + angleText(r);
    const desc = mirror ? '平面鏡：入射光與反射光都在鏡面上方。' :
      '光從' + top.label + '射向' + bot.label + '，' + (transmit ?
      (critical ? '折射光沿介面前進。' : '另有穿過介面的折射光。') : '發生全反射，沒有折射光。');
    let svg = '<svg viewBox="0 0 ' + W + ' ' + (H + FOOT) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      desc + iText + '、' + rText + (transmit ? '、' + txText : '') +
      '。角度從法線量起。" style="display:block;width:100%;height:auto;border-radius:14px" font-family="system-ui,sans-serif">';
    svg += '<path d="M0 0H420V134H0Z" fill="' + (mirror ? media.air.fill : top.fill) + '"/>' +
      '<path d="M0 134H420V278H0Z" fill="' + (mirror ? '#e9dcc8' : bot.fill) + '"/>';
    for (let x = 20; x < W; x += 20) svg += line([x, 0], [x, H], 'stroke="#745d45" stroke-opacity=".095" stroke-width=".7"');
    for (let y = 20; y < H; y += 20) svg += line([0, y], [W, y], 'stroke="#745d45" stroke-opacity=".095" stroke-width=".7"');
    if (mirror) {
      svg += '<path d="M28 134H392V145H28Z" fill="#b3c4c9" stroke="#526771" stroke-width="1"/>' +
        '<path d="M28 135H392" stroke="#f9fdff" stroke-width="2"/>';
      for (let x = 33; x < 386; x += 11) svg += line([x, 144], [x + 7, 137], 'stroke="#526771" stroke-opacity=".68" stroke-width="1"');
    } else {
      svg += line([0, Y], [W, Y], 'stroke="#76634b" stroke-width="1.4"');
    }
    svg += line([X, 12], [X, H - 15], 'stroke="#4b4b45" stroke-width="1.6" stroke-dasharray="5 5"');
    svg += arc(0, -i, 33, colors.incoming, false) + arc(0, r, 33, colors.reflected, true);
    if (transmit) svg += arc(180, 180 - t, 33, colors.transmitted, false);

    svg += line(inEnd, o, 'stroke="' + colors.incoming + '" stroke-width="' + (coincident ? 6 : 3.5) + '" stroke-linecap="round"');
    svg += line(o, refEnd, 'stroke="' + (coincident ? '#fff9ee' : colors.reflected) +
      '" stroke-width="' + (coincident ? 2.6 : 3.5) + '" stroke-dasharray="7 5" stroke-linecap="round"');
    if (transmit) svg += line(o, txEnd, 'stroke="' + colors.transmitted + '" stroke-width="3.5" stroke-linecap="round"');
    svg += arrow(inEnd, o, coincident ? .76 : .45, colors.incoming, '#fff5e8', 12);
    svg += arrow(o, refEnd, coincident ? .72 : .55, colors.reflected, '#fff5e8', 12);
    if (transmit) svg += arrow(o, txEnd, .59, colors.transmitted, '#f4fcf9', 12);
    svg += '<circle cx="210" cy="134" r="4.3" fill="#29251f" stroke="#fff9ee" stroke-width="1.3"/>';
    svg += panelLabel(151, 239, '法線', 50);
    svg += panelLabel(12, 30, mirror ? '空氣' : top.label, 58);
    svg += panelLabel(12, 166, mirror ? '平面鏡' : bot.label, mirror ? 68 : 58);
    if (coincident) svg += label(12, H - 8, '入射光與反射光共線、方向相反', 'start', {size: 12, color: '#483e35'});
    svg += '<path d="M0 278H420V321H0Z" fill="#eee2d2"/>' +
      line([0, H], [W, H], 'stroke="#9e896e" stroke-opacity=".48"');
    svg += badge(12, 305, iText, colors.incoming) + badge(151, 305, rText, colors.reflected);
    if (transmit) svg += badge(290, 305, txText, colors.transmitted);
    if (!mirror && !transmit && config.outcome === 'tir') svg += panelLabel(290, 305, '無折射光', 93);
    const handle = mix(inEnd, o, .18);
    svg += line(inEnd, o, 'data-angle-handle="" stroke="transparent" stroke-width="28" pointer-events="stroke"') +
      '<circle data-angle-handle="" cx="' + fmt(handle[0]) + '" cy="' + fmt(handle[1]) +
      '" r="15" fill="#fff6e8" stroke="' + colors.incoming + '" stroke-width="2.2"/>' +
      '<circle data-angle-handle="" cx="' + fmt(handle[0]) + '" cy="' + fmt(handle[1]) +
      '" r="6.5" fill="' + colors.incoming + '"/>';
    return svg + '</svg>';
  }

  global.LightDiagram = Object.freeze({ apparatus });
})(window);
