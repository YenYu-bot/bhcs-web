// Pure presentation/mapping only: no motion model, future samples or answer oracle.
export const TRACK=Object.freeze({width:700,height:280,left:70,right:630,axisY:166,minPosition:0,maxPosition:6});
export const PLOT=Object.freeze({width:700,height:670,left:104,right:640,top:120,bottom:480,minTime:0,maxTime:8,minPosition:0,maxPosition:6});
function finite(n,name){if(typeof n!=='number'||!Number.isFinite(n))throw new TypeError(`${name} must be finite`);return n;}
function range(n,min,max,name){finite(n,name);if(n<min||n>max)throw new RangeError(`${name} outside fixed axis`);return n;}
function integer(n,min,max,name){range(n,min,max,name);if(!Number.isInteger(n))throw new TypeError(`${name} must be integer`);return n;}
const clean=n=>Object.is(n,-0)?0:n;
export function trackPoint(position){range(position,0,6,'position');return {x:70+position*560/6,y:166};}
export function plotPoint(t,position){range(t,0,8,'time');range(position,0,6,'position');return {x:104+t*67,y:480-position*60};}
// The SVG uses preserveAspectRatio=xMidYMid meet. A DOM rect can include letterbox
// space, so independent x/y stretch factors would misalign an HTML hit target.
function transform(rect,view){if(!rect||typeof rect!=='object')throw new TypeError('SVG rect required');for(const k of ['left','top','width','height'])finite(rect[k],`rect.${k}`);if(rect.width<=0||rect.height<=0)throw new RangeError('SVG rect must have positive dimensions');const scale=Math.min(rect.width/view.width,rect.height/view.height);return {scale,left:rect.left+(rect.width-view.width*scale)/2,top:rect.top+(rect.height-view.height*scale)/2};}
function toClient(point,rect,view){const a=transform(rect,view);return {x:a.left+point.x*a.scale,y:a.top+point.y*a.scale};}
export function trackPointClient(position,rect){return toClient(trackPoint(position),rect,TRACK);}
export function plotPointClient(t,position,rect){return toClient(plotPoint(t,position),rect,PLOT);}
export function pointerToPlot(clientX,clientY,rect,grabOffset={x:0,y:0}){
 finite(clientX,'clientX');finite(clientY,'clientY');finite(grabOffset.x,'grabOffset.x');finite(grabOffset.y,'grabOffset.y');const a=transform(rect,PLOT);
 const pointer={x:(clientX-a.left)/a.scale,y:(clientY-a.top)/a.scale},point={x:(clientX-grabOffset.x-a.left)/a.scale,y:(clientY-grabOffset.y-a.top)/a.scale};
 // Floating point roundoff at an exact transformed border is not an answer tolerance.
 const insidePoint=p=>p.x>=104-1e-10&&p.x<=640+1e-10&&p.y>=120-1e-10&&p.y<=480+1e-10;
 const inside=insidePoint(pointer)&&insidePoint(point),t=(point.x-104)/67,rawPositionM=(480-point.y)/60;
 return {inside,t:clean(t),rawPositionM:clean(rawPositionM),positionM:inside?Math.max(0,Math.min(6,Math.floor(rawPositionM+.5+1e-12))):null};
}
const svgStart=(view,title,desc)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view.width} ${view.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${title}"><title>${title}</title><desc>${desc}</desc>`;
export function renderTrack(position){const p=trackPoint(position),ticks=Array.from({length:7},(_,i)=>{const x=trackPoint(i).x;return `<g class="track-tick" data-position="${i}"><path d="M${x} 158v17" stroke="#685748" stroke-width="2"/><text x="${x}" y="198" text-anchor="middle" fill="#493e30" font-size="19">${i}</text></g>`;}).join('');
 return svgStart(TRACK,'水平軌道：以車身中央標記讀取位置',`固定原點在左側0公尺，向右為正。只讀中央紅色垂直觀測標記，不讀車頭或車尾。目前位置${position}公尺。`)+`<rect x="20" y="20" width="660" height="246" rx="20" fill="#f4efdf"/><path d="M45 142H655" stroke="#b5b7a0" stroke-width="9" stroke-linecap="round"/><path d="M70 166H630" stroke="#685748" stroke-width="2"/>${ticks}<text x="24" y="168" fill="#493e30" font-size="18">O</text><text x="650" y="198" fill="#493e30" font-size="17">m</text><path d="M505 45h113m-9-6 9 6-9 6" fill="none" stroke="#61785b" stroke-width="2"/><text x="500" y="42" fill="#52694d" font-size="15">正方向</text><g class="car" transform="translate(${p.x} 0)"><path d="M-39 115v-20q0-9 10-9h12l10-17h29l14 22h8v24Z" fill="#aec9a2" stroke="#41664d" stroke-width="2.5"/><path d="M-10 86l7-11h20l7 11Z" fill="#f9fcf2"/><circle cx="-25" cy="120" r="13" fill="#595449"/><circle cx="26" cy="120" r="13" fill="#595449"/><circle cx="-25" cy="120" r="5" fill="#e3ddca"/><circle cx="26" cy="120" r="5" fill="#e3ddca"/><path class="observation-marker" d="M0 63V166" stroke="#a64135" stroke-width="3"/><circle class="observation-center" cx="0" cy="166" r="4" fill="#a64135"/></g><text x="350" y="260" text-anchor="middle" fill="#6d5c4a" font-size="15">車身中央紅線是觀測標記</text></svg>`;
}
export function renderPlot(slots,selected=null,preview=null,linked=false){
 if(!Array.isArray(slots)||slots.length!==9||Array.from({length:9},(_,i)=>i).some(i=>!Object.hasOwn(slots,i)))throw new TypeError('Exactly nine explicit slots required');if(selected!==null)integer(selected,0,8,'selected time');if(typeof linked!=='boolean')throw new TypeError('linked must be boolean');if(preview!==null){integer(preview,0,6,'preview position');if(selected===null)throw new TypeError('Preview requires selected time');}
 slots.forEach((s,i)=>{if(s===null)return;if(!s||s.tSeconds!==i)throw new TypeError('Slot time must match fixed index');integer(s.positionM,0,6,'slot position');});
 // A temporary preview never changes the submitted polyline or the supplied slots.
 const submitted=slots.map(s=>s===null?null:plotPoint(s.tSeconds,s.positionM));
 if(linked&&submitted.some(p=>p===null))throw new TypeError('Cannot connect incomplete slots');
 const grid=[];for(let t=0;t<=8;t++){const x=104+t*67;grid.push(`<path d="M${x} 120V480" stroke="#d9ddcd"/><text x="${x}" y="576" text-anchor="middle" fill="#493e30" font-size="18">${t}</text>`);}for(let x=0;x<=6;x++){const y=480-x*60;grid.push(`<path d="M104 ${y}H640" stroke="#d9ddcd"/><text x="48" y="${y+6}" text-anchor="end" fill="#493e30" font-size="18">${x}</text>`);}
 const line=linked?`<polyline class="student-line" points="${submitted.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="#4d775d" stroke-width="3"/>`:'';
 const dots=slots.map((s,i)=>{const value=i===selected&&preview!==null?preview:s?.positionM;if(value===undefined)return '';const p=plotPoint(i,value),temporary=i===selected&&preview!==null;return `<circle class="${temporary?'preview-point':'student-point'}${i===selected?' selected-point':''}" data-time="${i}" cx="${p.x}" cy="${p.y}" r="${i===selected?7:5}" fill="${temporary?'#b88731':'#42694e'}" stroke="#fff9ed" stroke-width="2"><title>${i}秒，學生${temporary?'預覽':'作圖'}位置${value}公尺</title></circle>`;}).join('');
 return svgStart(PLOT,'學生位置—時間圖','橫軸時間0至8秒，縱軸位置0至6公尺。圖點只顯示學生已放置的位置；選擇時刻不會自動產生答案。')+`<rect x="18" y="12" width="664" height="646" rx="18" fill="#fffdf5"/>${grid.join('')}<path d="M104 110V480H650" fill="none" stroke="#655b4b" stroke-width="2"/><text x="104" y="44" fill="#493e30" font-size="17">位置（m）</text><text x="375" y="640" text-anchor="middle" fill="#493e30" font-size="18">時間（s）</text>${line}${dots}</svg>`;
}

// Presentation only: consumers apply this size to SVG text after measuring the
// actual SVG rect. Axis positions and physical mappings are intentionally unchanged.
export function minimumLabelFont(baseSVGFont,rect,view,minCssPx=14){
 finite(baseSVGFont,'baseSVGFont');finite(minCssPx,'minCssPx');if(baseSVGFont<=0||minCssPx<=0)throw new RangeError('Font sizes must be positive');
 if(!view||typeof view!=='object')throw new TypeError('View dimensions required');finite(view.width,'view.width');finite(view.height,'view.height');if(view.width<=0||view.height<=0)throw new RangeError('View dimensions must be positive');
 return Math.max(baseSVGFont,minCssPx/transform(rect,view).scale);
}
