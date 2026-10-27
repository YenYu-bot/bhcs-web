// Original vector artwork. Scientific state is supplied by the application; drawing never mutates it.
const ink = '#5C4436';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Approved microscope teacher; exact original PNG bytes, clipped to a head/shoulder portrait.
export const teacherSVG = `<svg viewBox="0 0 680 850" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="微笑的余老師，沿用顯微鏡教材的角色形象" overflow="hidden"><image href="img/teacher-body-v3.png" x="0" y="0" width="948" height="1659" preserveAspectRatio="xMinYMin meet"/></svg>`;
function cup(x,y,kind,volume=0){
 const waste=kind==='waste', level=Math.min(46,Math.max(0,volume)/50*46);
 return `<g transform="translate(${x} ${y})" ${!waste?'data-drag="cup"':''} class="bench-cup"><ellipse cx="0" cy="75" rx="38" ry="8" fill="#94775c" opacity=".12"/><path d="M-29 0L-24 68Q0 77 24 68L29 0" fill="#fffdf6" fill-opacity=".85"/><path d="M-26 ${66-level}Q0 ${72-level} 26 ${66-level}L24 67Q0 74 -24 67Z" fill="${waste?'#c2dfcb':'#9ddbdc'}" stroke="none"/><path d="M-29 0L-24 68Q0 77 24 68L29 0" fill="none"/><ellipse cy="0" rx="29" ry="7" fill="#fffdf6" fill-opacity=".35"/><path d="M17 15h8m-7 12h6m-6 12h5m-5 12h4" stroke-width="1.6"/><rect x="-23" y="31" width="46" height="22" rx="5" fill="${waste?'#ffe6b7':'#fce5df'}" stroke-width="1.3"/><text x="0" y="46" text-anchor="middle" font-size="10" font-weight="700" stroke="none">${waste?'廢液杯':'收集杯 A'}</text></g>`;
}
export function renderBench(s={}){
 const f=Math.max(0,Math.min(1,Number(s.f)||0)), hung=Boolean(s.hung), filled=Boolean(s.filled||s.tankReady||s.filling), brine=s.fluid==='brine'||s.fluidId==='brine';
 const oy=hung?(f>0?196+64*f:176):291, ox=hung?366:180;
 const collected=Number(s.collected??s.cupVolume??s.collectedVolume??0)||0;
 const drips=Boolean(s.dripping||Number(s.pending??s.pendingVolume)>0);
 const outlet=s.outlet??(s.wasteAtOutlet?'waste':s.cupLocation==='outlet'?'collector':null), cupPlace=s.cupLocation;
 const force=esc(s.forceText??'— N'), mass=esc(s.massText??'— g');
 const object=`<g transform="translate(${ox} ${oy})" data-drag="object" class="bench-object"><path d="M-22 0L-10 -8L34 -8L22 0Z" fill="#e2e8e2"/><path d="M22 0L34 -8V56L22 64Z" fill="#9dafb4"/><rect x="-22" width="44" height="64" rx="2" fill="#cedbdc"/><path d="M-14 9v45" stroke="#f7fffc" stroke-width="3"/><text x="1" y="36" text-anchor="middle" stroke="none" font-size="18" font-weight="700">Al</text></g>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" role="img" aria-labelledby="bench-title bench-desc" class="science-bench"><title id="bench-title">浮力量測實驗桌</title><desc id="bench-desc">${hung?'鋁塊已懸掛':'鋁塊在桌上'}，${filled?'槽內液體已到溢流口':'溢流槽尚未加滿'}，目前浸入 ${Math.round(f*100)}%。拖曳器材，或使用下方操作按鈕。</desc><defs><linearGradient id="wood" x2="0" y2="1"><stop stop-color="#edcfa6"/><stop offset="1" stop-color="#dfb98b"/></linearGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="${brine?'#b4ddd3':'#b1e1e5'}"/><stop offset="1" stop-color="${brine?'#8fc7bd':'#8ecedc'}"/></linearGradient><pattern id="tiny-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#d7c9b2" stroke-width=".7" opacity=".35"/></pattern></defs>
 <rect x="10" y="8" width="780" height="414" rx="25" fill="#fcf6e8"/>
 <rect x="10" y="8" width="780" height="350" rx="25" fill="url(#tiny-grid)"/>
 <g stroke="${ink}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="${ink}" font-family="ui-rounded,system-ui,sans-serif">
 <path d="M25 357L61 332H742L778 357V405Q778 415 768 415H35Q25 415 25 405Z" fill="url(#wood)"/>
 <path d="M25 358H778M57 380q79-9 165 0m336 18q100-6 176-1M322 372q90 7 163 0" stroke="#b88d66" stroke-width="1.5" opacity=".5"/>
 <path d="M249 346V37Q249 27 260 27H366" fill="none" stroke="#9aab9d" stroke-width="12"/>
 <path d="M249 346V37Q249 27 260 27H366" fill="none" stroke-width="2"/>
 <path d="M208 349L225 338H273L290 349V359H208Z" fill="#b5c2ad"/>
 <path d="M366 28V43" fill="none"/>
 <rect x="335" y="43" width="62" height="104" rx="17" fill="#fffdf7"/>
 <rect x="343" y="56" width="46" height="55" rx="8" fill="#fff0bd" stroke-width="1.5"/>
 <path d="M354 63l24 5-24 6 24 6-24 6 24 6-24 6" fill="none" stroke="#bb9271" stroke-width="2"/>
 <path d="M344 66h4m-4 12h4m-4 12h4m-4 12h4" stroke-width="1"/>
 <text x="366" y="132" text-anchor="middle" font-size="11" stroke="none" font-weight="750">${force}</text>
 <path d="M366 147v9q0 10 8 3" fill="none"/>
 <rect x="406" y="59" width="98" height="27" rx="8" fill="#fffaf1" stroke="#dac7aa" stroke-width="1.3"/><text x="455" y="77" text-anchor="middle" font-size="12" stroke="none">彈簧秤 · N</text>
 <path d="M294 230Q382 217 470 230L466 352Q382 369 298 352Z" fill="#f7fcf5" fill-opacity=".88"/>
 ${filled?`<path d="M296 252Q383 241 469 252L465 351Q382 367 299 351Z" fill="url(#water)" stroke="none" opacity=".7"/>`:''}
 ${hung?`<path d="M366 157V${oy-7}" fill="none" stroke-width="1.7"/>`:''}${object}
 ${filled?`<path d="M296 252Q383 265 469 252L465 351Q382 368 299 351Z" fill="url(#water)" opacity=".46" stroke="none"/><path d="M296 252Q383 266 469 252" stroke="#6daeb7" stroke-width="1.6" fill="none"/>`:''}
 <path d="M294 230L298 352Q382 369 466 352L470 230" fill="none"/><ellipse cx="382" cy="230" rx="88" ry="13" fill="none"/>
 <path d="M470 252h53q15 0 15 15v6" fill="none" stroke="#f8fcf5" stroke-width="14"/><path d="M470 245h53q22 0 22 22v6m-14 0v-6q0-8-8-8h-53" fill="none" stroke-width="2"/>
 <path d="M313 273v55" stroke="#fffdf5" stroke-width="5" opacity=".8"/><path d="M451 272h9m-9 17h8m-8 17h8m-8 17h7" stroke="#7d9f9e" stroke-width="1.5"/>
 <rect x="332" y="320" width="101" height="25" rx="7" fill="#fff9e9" stroke-width="1.2"/><text x="382" y="337" text-anchor="middle" font-size="12" stroke="none">${brine?'濃鹽水':'清水'} · 溢流槽</text>
 ${drips?`<g fill="#74bfc9" stroke="#5b9fa6" stroke-width="1"><path class="drop drop-one" d="M538 276q-8 11 0 12q8-1 0-12Z"/><path class="drop drop-two" d="M538 292q-5 7 0 8q5-1 0-8Z"/></g>`:''}
 ${outlet==='waste'?cup(538,286,'waste',filled?18:0):outlet==='collector'?cup(538,286,'collector',collected):''}
 <g><ellipse cx="676" cy="380" rx="78" ry="10" fill="#9b7653" opacity=".12" stroke="none"/><path d="M610 347h132l9 19v18q-74 11-150 0v-18Z" fill="#b9d6c0"/><path d="M610 347h132l9 19H601Z" fill="#e3ecda"/><rect x="623" y="367" width="106" height="22" rx="5" fill="#fff9d7" stroke-width="1.5"/><text x="676" y="383" text-anchor="middle" stroke="none" font-size="15" font-weight="750">${mass}</text><path d="M627 342h98" stroke="#a3aa94" stroke-width="7"/><text x="676" y="410" text-anchor="middle" font-size="12" stroke="none">電子天平 · g</text></g>
 ${outlet!=='collector'?cup(cupPlace==='scale'?676:103,cupPlace==='scale'?269:284,'collector',collected):''}
 ${outlet!=='waste'?`<g opacity=".85">${cup(72,166,'waste',filled?18:0)}</g>`:''}
 <rect x="41" y="120" width="133" height="29" rx="8" fill="#fff0c3" stroke="#c6ac79" stroke-width="1.3" transform="rotate(-3 41 120)"/><text x="106" y="137" text-anchor="middle" stroke="none" font-size="12" transform="rotate(-3 41 120)">先準備，再收集！</text>
 <path d="M178 69l4-12 4 12 12 4-12 4-4 12-4-12-12-4Z" fill="#ffe08e" stroke="none"/>
 <circle cx="732" cy="89" r="24" fill="#e8eac9" stroke="none"/><path d="M720 91q12-27 22-5q-8 20-22 5Zm11-11v22" fill="#b3cfaa" stroke="#718d62" stroke-width="1.5"/>
 <text x="106" y="406" text-anchor="middle" stroke="none" font-size="11">同一只收集杯 A</text>
 </g></svg>`;
}
