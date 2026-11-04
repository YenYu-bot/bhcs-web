/** Instrument artwork and evidence plot. Pure renderers; no state, timing or physics. */
const INK = '#273f43';
const STYLES = {
  water100: { label: '水 100 g', color: '#177e9c', dash: '', marker: 'circle' },
  iron100: { label: '鐵 100 g', color: '#735a43', dash: '7 4', marker: 'square' },
  iron200: { label: '鐵 200 g', color: '#725289', dash: '2 4', marker: 'diamond' }
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const widthOf = width => Math.max(240, Number.isFinite(width) ? width : 300);
const validPoint = p => p && Number.isFinite(p.t) && p.t >= 0 && p.t <= 60 && Number.isFinite(p.temperature) && p.temperature >= 20 && p.temperature <= 50;
const num = n => Number(n.toFixed(3));
function marker(shape, x, y, color, size = 4) {
  if (shape === 'square') return `<rect x="${num(x-size)}" y="${num(y-size)}" width="${size*2}" height="${size*2}" rx="1" fill="${color}" stroke="white" stroke-width="1.5"/>`;
  if (shape === 'diamond') return `<path d="M${num(x)} ${num(y-size-1)}l${size+1} ${size+1}l-${size+1} ${size+1}l-${size+1} -${size+1}Z" fill="${color}" stroke="white" stroke-width="1.5"/>`;
  return `<circle cx="${num(x)}" cy="${num(y)}" r="${size}" fill="${color}" stroke="white" stroke-width="1.5"/>`;
}

function specimenBody(id, { icon = false } = {}) {
  const large = id === 'iron200';
  const bx = large ? 31 : 48, by = large ? 123 : 145, bw = large ? 117 : 86, bh = 211-by;
  if (id === 'water100') return `<g data-vessel="transparent-cup">
    <ellipse cx="95" cy="210" rx="66" ry="8" fill="#8baca2" opacity=".12"/>
    <path d="M30 102L36 197Q37 211 95 212Q153 211 154 197L160 102Z" fill="#f2fcfd" fill-opacity=".7" stroke="#81a9af" stroke-width="1.8"/>
    <path d="M34 137L39 196Q40 205 95 207Q150 205 151 196L156 137Z" fill="#99d5df" fill-opacity=".75"/>
    <path d="M38 177L39 196Q40 205 95 207Q150 205 151 196L152 177Q95 189 38 177Z" fill="#6cbacb" opacity=".18"/>
    <ellipse cx="95" cy="137" rx="61" ry="9" fill="#c9edf1" stroke="#6fb5c4" stroke-width="1.3"/>
    <path d="M37 139Q95 155 153 139" fill="none" stroke="#e7fafb" stroke-width="2"/>
    <ellipse cx="95" cy="102" rx="65" ry="11" fill="#f7fdfb" fill-opacity=".8" stroke="#81a9af" stroke-width="1.8"/>
    <ellipse cx="95" cy="102" rx="59" ry="7" fill="#dceef0" fill-opacity=".4" stroke="#b7d1d3"/>
    <path d="M41 116L45 186Q45 192 51 193" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" opacity=".85"/>
    <path d="M147 115L143 190" stroke="#f7ffff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
    <path d="M45 199Q95 214 145 199" fill="none" stroke="#eaf8f7" stroke-width="3"/>
    <path d="M57 157h11m-10 15h9m-8 15h8" stroke="#568f9a" opacity=".5" stroke-width="1.5"/>
    ${icon ? '' : `<g data-immersed-probe="true"><path d="M119 101V181" stroke="#69828a" stroke-width="5" stroke-linecap="round"/><path d="M118 109V179" stroke="#e8f1ef" stroke-width="2" stroke-linecap="round"/><rect x="114" y="86" width="10" height="25" rx="4" fill="#526f6a"/><path d="M117 90v15" stroke="#93aaa3" stroke-width="1.5"/></g>`}
  </g>`;
  return `<g data-vessel="single-metal-block" data-block-width="${bw}" data-block-height="${bh}">
    <ellipse cx="${bx+bw/2+8}" cy="212" rx="${bw/2+14}" ry="7" fill="#45636a" opacity=".13"/>
    <path d="M${bx} ${by}l18 -13h${bw}l-18 13Z" fill="#cbd8db" stroke="#7f969e" stroke-width="1.4"/>
    <path d="M${bx+bw} ${by}l18 -13v${bh}l-18 13Z" fill="#7b949f" stroke="#6a8590" stroke-width="1.4"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="#a4b9c1" stroke="#6a8590" stroke-width="1.4"/>
    <path d="M${bx+2} ${by+2}h${bw-4}v${bh-4}" fill="none" stroke="#cfdee0" stroke-width="1.6"/>
    <path d="M${bx+8} ${by+9}v${bh-18}" stroke="#dfebeb" stroke-width="3" stroke-linecap="round" opacity=".65"/>
    <path d="M${bx+17} ${by+15}h${bw-29}m-${bw-29} 7h${bw-29}m-${bw-29} 7h${bw-29}m-${bw-29} 7h${bw-29}" stroke="#e0e9e8" opacity=".16"/>
    <path d="M${bx+bw+5} ${by+3}v${bh-13}" stroke="#b2c8cd" opacity=".5"/>
    ${icon ? '' : `<ellipse cx="111" cy="${by-6}" rx="8" ry="3.7" fill="#5e7880" stroke="#dee8e7" stroke-width="1.5"/><path d="M111 ${by-22}V${by-5}" stroke="#d3e0e1" stroke-width="5"/><rect x="106" y="${by-35}" width="10" height="20" rx="4" fill="#526f6a"/><path d="M109 ${by-31}v11" stroke="#93aaa3" stroke-width="1.5"/><path data-embedded-probe="true" d="M111 ${by+3}V${by+30}" stroke="#eaf4f3" stroke-width="2.5" stroke-dasharray="3 4"/>`}
  </g>`;
}

export function renderMaterialIcon(id) {
  if (!STYLES[id]) throw new RangeError('Unknown specimen');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="12 80 174 143" aria-hidden="true" focusable="false" style="display:block;overflow:visible">${specimenBody(id,{icon:true})}</svg>`;
}

export function renderSpecimen({id = null, temperature = 20, heating = false, heatTime = 0, reducedMotion = false, width = 300} = {}) {
  if (id !== null && !STYLES[id]) throw new RangeError('Unknown specimen');
  if (!Number.isFinite(temperature) || temperature < 20 || temperature > 48) throw new RangeError('Temperature must be between 20 and 48 °C');
  const w = widthOf(width), font = num(14 * 300 / w), readingFont = num(20 * 300 / w);
  const occupied = id !== null, active = occupied && Boolean(heating);
  const supplyPhase = reducedMotion ? 0 : (Number.isFinite(heatTime) ? Math.max(0,heatTime)*16%24 : 0);
  const y = 192 - (temperature - 20) / 30 * 99;
  const probeX = id === 'water100' ? 119 : 111;
  const probeY = id === 'water100' ? 86 : id === 'iron200' ? 88 : 110;
  const thermometer = `<g data-instrument-support="fixed-to-base">
    <path d="M233 204v13" stroke="#a9b7a8" stroke-width="13"/>
    <path d="M223 216h22" stroke="#778f7c" stroke-width="5" stroke-linecap="round"/>
    <rect x="189" y="37" width="102" height="174" rx="15" fill="#8ca390" opacity=".14"/>
    <rect x="186" y="33" width="102" height="174" rx="15" fill="#fffdf3" stroke="#81977d" stroke-width="1.6"/>
    <path d="M196 42Q237 37 278 42" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <rect x="192" y="43" width="90" height="33" rx="7" fill="#e6efdf" stroke="#c1cfb5"/>
    ${occupied ? `<text data-temperature="${temperature.toFixed(1)}" x="237" y="67" text-anchor="middle" font-size="${readingFont}" font-weight="700" letter-spacing="-.7">${temperature.toFixed(1)}<tspan font-size="${font}" font-weight="500">°C</tspan></text>` : `<path d="M217 59h12m12 0h12" stroke="#a5b59e" stroke-width="2.5" stroke-linecap="round"/>`}
    <g data-scale-min="20" data-scale-max="50">
      <rect x="202" y="85" width="14" height="116" rx="7" fill="#e9eee5" stroke="#bdcbb8"/>
      ${occupied ? `<path data-thermometer-column="true" d="M209 195V${num(y)}" stroke="#d78257" stroke-width="6" stroke-linecap="round"/><circle cx="209" cy="196" r="6" fill="#d78257"/>` : ''}
      ${[20,30,40,50].map(t => { const ty=192-(t-20)/30*99; return `<path d="M222 ${ty}h7" stroke="#8d9d86" stroke-width="1.4"/><text x="237" y="${ty+5}" font-size="${font}" fill="#4b614f">${t}</text>`; }).join('')}
      ${[25,35,45].map(t=>`<path d="M222 ${192-(t-20)/30*99}h4" stroke="#b2bfa8"/>`).join('')}
    </g>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${num(w*270/300)}" viewBox="0 0 300 270" role="img" aria-label="${occupied ? `${STYLES[id].label}，${temperature.toFixed(1)} °C，${active?'供熱中':'未供熱'}` : '空樣本座，未供熱'}" style="display:block;max-width:100%;height:auto;font-family:system-ui,sans-serif;color:${INK}" fill="${INK}">
    <ellipse cx="150" cy="256" rx="140" ry="10" fill="#6e7958" opacity=".09"/>
    <path d="M31 247v9m239 -9v9" stroke="#71866c" stroke-width="10" stroke-linecap="round"/>
    <path d="M13 225Q13 216 24 211H278Q289 216 289 225V241Q289 250 278 250H24Q13 250 13 241Z" fill="#e6e6ce" stroke="#9ca78b" stroke-width="1.5"/>
    <rect x="13" y="220" width="276" height="27" rx="9" fill="#fbf8e9"/>
    <path d="M20 222H282" stroke="white" stroke-width="2"/>
    <rect x="25" y="208" width="145" height="12" rx="6" fill="#c8d1bb" stroke="#8fa184" stroke-width="1.4"/>
    <ellipse cx="97" cy="211" rx="65" ry="7" fill="#e2e7d9" stroke="#a8b99a" stroke-width="1.2"/>
    ${active ? `<g data-supply-indicator="active" data-reduced-motion="${Boolean(reducedMotion)}" aria-hidden="true"><rect x="25" y="208" width="145" height="12" rx="6" fill="#edc46d" fill-opacity=".7"/><text x="90" y="22" text-anchor="middle" font-size="${font}" fill="#93651e">供熱輸入示意</text>${[0,1,2].map(n=>`<path data-supply-arrow="true" d="M10 ${num(201-n*24-supplyPhase)}l7 -9l7 9" fill="none" stroke="#bd8525" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g>` : ''}
    ${thermometer}
    ${occupied ? `<path data-probe-connector="flexible-to-meter" d="M${probeX} ${probeY}C${probeX} ${probeY-34},167 ${probeY-25},169 ${probeY-1}S174 119,186 113" fill="none" stroke="#4f6f69" stroke-width="3" stroke-linecap="round"/><circle cx="187" cy="113" r="4" fill="#4f6f69"/>${specimenBody(id)}` : `<path d="M60 185h74m-37 -33v26m-9 -9l9 9l9 -9" fill="none" stroke="#98ae89" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 5"/>`}
    <circle data-heater-light="${active?'on':'off'}" cx="31" cy="234" r="5" fill="${active?'#e1a44c':'#b7c4ae'}" stroke="#96a589"/>
    ${active ? '<circle cx="30" cy="232.5" r="1.5" fill="#ffecb3"/>' : ''}
    <text x="44" y="239" font-size="${font}" fill="#4d6249">${active?'供熱中':'未供熱'}</text>
    <path d="M244 231h23m-23 5h23m-23 5h23" stroke="#c6ccb5" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

export function renderGraph({width = 600, series = [], samples = []} = {}) {
  const w = widthOf(width), h = 284 + series.length * 26;
  const left = 46, right = w-22, top = 31, bottom = 211;
  const x = t => left+t/60*(right-left), y = t => bottom-(t-20)/30*(bottom-top);
  const normalized = series.map((s,i) => ({...s, style: STYLES[s.id] || {label:s.label||'樣本',color:INK,dash:i?'5 4':'',marker:i?'square':'circle'}, points:(s.points||[]).filter(validPoint).sort((a,b)=>a.t-b.t)}));
  const grid = [20,30,40,50].map(t => `<path d="M${left} ${y(t)}H${right}" stroke="${t===20?'#879c93':'#e1e8df'}"/><text x="${left-9}" y="${y(t)+5}" text-anchor="end">${t}</text>`).join('');
  const ticks = [0,20,40,60].map(t=>`<path d="M${num(x(t))} ${bottom}v5" stroke="#879c93"/><text x="${num(x(t))}" y="${bottom+23}" text-anchor="middle">${t}</text>`).join('');
  const lines = normalized.map(s => {
    const pts = s.points, last = pts.at(-1), style = s.style;
    let selected = Array.isArray(samples) ? samples.filter(p => p.id===s.id || (!p.id && normalized.length===1)) : (samples?.[s.id] || []);
    if (Array.isArray(s.samples)) selected = s.samples;
    // Never manufacture observations or draw supplied samples past the visible curve.
    selected = selected.filter(validPoint).filter(p => last && p.t<=last.t);
    return `<g data-series="${esc(s.id||'sample')}" data-historical="${Boolean(s.historical)}" opacity="${s.historical?'.65':'1'}"><path data-curve="true" d="${pts.map((p,i)=>`${i?'L':'M'}${num(x(p.t))} ${num(y(p.temperature))}`).join(' ')}" fill="none" stroke="${style.color}" stroke-width="2.5" ${style.dash?`stroke-dasharray="${style.dash}"`:''}/>${selected.map(p=>`<g data-sample-time="${p.t}">${marker(style.marker,x(p.t),y(p.temperature),style.color)}</g>`).join('')}${last?`<g data-endpoint-time="${last.t}">${marker(style.marker,x(last.t),y(last.temperature),style.color,4.5)}</g>`:''}</g>`;
  }).join('');
  const legend = normalized.map((s,i)=>`<g transform="translate(0 ${280+i*26})"><path d="M${left} 0h25" stroke="${s.style.color}" stroke-width="2.5" ${s.style.dash?`stroke-dasharray="${s.style.dash}"`:''}/>${marker(s.style.marker,left+12,0,s.style.color,3.5)}<text x="${left+34}" y="5">${esc(s.label||s.style.label)}${s.historical?'（上輪）':''}</text></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="溫度與時間圖，時間 0 至 60 模型秒，溫度 20 至 50 °C" style="display:block;max-width:100%;height:auto;font:14px system-ui,sans-serif" fill="${INK}" data-time-min="0" data-time-max="60" data-temperature-min="20" data-temperature-max="50"><text x="${left}" y="17">溫度 °C</text>${grid}${ticks}${lines}<text x="${right}" y="253" text-anchor="end">時間（模型秒）</text>${legend}</svg>`;
}
