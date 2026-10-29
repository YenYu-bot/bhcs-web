import {calculate} from './model.mjs';
export const HEIGHT=530,K=5;
const ink='#4b3a2e';
export function sceneGeometry(device,h,width=400){
 calculate(device,h);const cx=width/2,r=device==='fixed'?32:30;
 const g={width,height:HEIGHT,k:K,cx,r,anchorY:30,groundY:505,handleX:cx+r,loadX:device==='fixed'?cx-r:cx};
 if(device==='fixed')Object.assign(g,{wheelY:80,hookY:390-K*h,handleY:210+K*h,sensorY:158+K*h,loadY:403-K*h,leftSegment:310-K*h,rightSegment:130+K*h});
 else Object.assign(g,{wheelY:380-K*h,hookY:410-K*h,handleY:270-2*K*h,sensorY:320-2*K*h,loadY:423-K*h,leftSegment:350-K*h,rightSegment:110+K*h});
 g.ropeLength=g.leftSegment+g.rightSegment+Math.PI*r;return g;
}
const text=(x,y,value,size=12,color=ink,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${color}" font-family="Noto Sans TC,Noto Sans CJK TC,sans-serif">${value}</text>`;
function ruler(x,y0,max,sign,h,label,color){let s=`<path d="M${x} ${y0}v${sign*max*K}" stroke="${ink}" stroke-width="1.5"/>`;
 for(let i=0;i<=max;i++){const y=y0+sign*i*K;const long=i%5===0;s+=`<path d="M${x} ${y}h${long?9:4}" stroke="${ink}" stroke-width="1"/>`;if(long)s+=text(x-5,y+4,i,10,'#79664a','end');}
 s+=`<path d="M${x+12} ${y0+sign*h*K}h12l-5-4m5 4-5 4" fill="none" stroke="${color}" stroke-width="2.5"/>`;
 s+=text(x+5,Math.max(y0,y0+sign*max*K)+25,label,10);return s;}
export function drawBench(svg,handle,device,h,{active=false,enabled=false,width}={}){
 const w=width||svg.parentElement.clientWidth||400,g=sceneGeometry(device,h,w),{cx,r,wheelY,handleY,sensorY,loadY}=g;
 svg.setAttribute('viewBox',`0 0 ${w} ${HEIGHT}`);svg.setAttribute('data-device',device);svg.setAttribute('data-height',h);svg.setAttribute('data-rope-length',g.ropeLength);
 const frame=`<path d="M30 20Q${cx} 17 ${w-30} 20" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/><path d="M30 19Q${cx} 16 ${w-30} 19" fill="none" stroke="#e2c08f" stroke-width="4"/><path d="M15 505Q${cx} 500 ${w-15} 505" fill="none" stroke="#ba9563" stroke-width="2"/>`;
 let rope=device==='fixed'?`<path d="M${cx-r} ${g.hookY}V${wheelY}A${r} ${r} 0 0 1 ${cx+r} ${wheelY}V${sensorY-20}"/>`:`<path d="M${cx-r} 30V${wheelY}A${r} ${r} 0 0 0 ${cx+r} ${wheelY}V${sensorY+20}"/>`;
 rope=`<g fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round">${rope}</g><g fill="none" stroke="#e8c57a" stroke-width="2">${rope}</g>`;
 const wheel=`<circle cx="${cx}" cy="${wheelY}" r="${r-2}" fill="#bfe3d6" stroke="${ink}" stroke-width="2"/><circle cx="${cx}" cy="${wheelY}" r="${r-9}" fill="#dff0de" stroke="${ink}" stroke-width="1.3"/><path d="M${cx-r+9} ${wheelY}h${2*r-18}M${cx} ${wheelY-r+9}v${2*r-18}" stroke="#8cb6a0" stroke-width="2"/><circle cx="${cx}" cy="${wheelY}" r="5" fill="#e8c57a" stroke="${ink}" stroke-width="1.5"/>`;
 const support=device==='fixed'?`<path d="M${cx} 24V${wheelY}" stroke="${ink}" stroke-width="5"/><path d="M${cx} 24V${wheelY}" stroke="#d9b98c" stroke-width="2"/>`:`<circle cx="${cx-r}" cy="30" r="5" fill="#e8c57a" stroke="${ink}" stroke-width="2"/><path d="M${cx} ${wheelY}V${loadY}" stroke="${ink}" stroke-width="3"/>`;
 const hook=device==='fixed'?`<path d="M${g.loadX} ${g.hookY}v13" stroke="${ink}" stroke-width="3"/>`:'';
 const box=`<rect x="${g.loadX-32}" y="${loadY}" width="64" height="52" rx="8" fill="#d9b98c" stroke="${ink}" stroke-width="2"/><path d="M${g.loadX-29} ${loadY+8}h57M${g.loadX-16} ${loadY+3}v46M${g.loadX+16} ${loadY+3}v46" stroke="#bd965f" stroke-width="1.3"/><rect x="${g.loadX-23}" y="${loadY+14}" width="46" height="23" rx="4" fill="#fff4dc" stroke="#95734c"/>${text(g.loadX,loadY+30,'10 N',14)}`;
 const sensor=`<path d="M${g.handleX} ${sensorY+(device==='fixed'?20:-20)}V${handleY}" stroke="${ink}" stroke-width="3"/><rect x="${g.handleX-13}" y="${sensorY-20}" width="26" height="40" rx="5" fill="#fff4dc" stroke="${ink}" stroke-width="2"/><path d="M${g.handleX} ${sensorY-16}l-5 5 10 5-10 5 10 5-5 6" fill="none" stroke="#bd725c" stroke-width="1.5"/>${text(g.handleX+23,sensorY+4,device==='fixed'?'10 N':'5 N',12,'#244f50','start')}`;
 const clamp=`<path d="M${g.handleX+27} ${handleY-10}h13v20h-13" fill="none" stroke="${active?'#c0c6aa':'#467260'}" stroke-width="4"/><circle cx="${g.handleX+42}" cy="${handleY}" r="4" fill="${active?'#fff4dc':'#bfe3d6'}" stroke="${ink}"/>`;
 const y0=device==='fixed'?390:423;const hRuler=ruler(35,y0,20,-1,h,'升高 cm','#c77955');
 const ropeRuler=ruler(w-35,device==='fixed'?210:270,device==='fixed'?20:40,device==='fixed'?1:-1,(device==='fixed'?1:2)*h,'繩端 cm','#4e8b78');
 svg.innerHTML=frame+rope+wheel+support+hook+box+sensor+clamp+hRuler+ropeRuler+text(cx,493,'懸空的 0 cm 起點，不由桌面承托',10,'#8c7b60');
 handle.style.left=`${g.handleX}px`;handle.style.top=`${handleY}px`;handle.disabled=!enabled;handle.classList.toggle('is-dragging',active);
 return g;
}
