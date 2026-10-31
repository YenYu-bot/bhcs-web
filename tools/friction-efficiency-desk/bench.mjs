const ink='#51402f';
const label=(x,y,text,anchor='middle')=>`<text x="${x}" y="${y}" fill="${ink}" font-size="12" text-anchor="${anchor}" font-family="sans-serif">${text}</text>`;
export function geometry(s,width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<100||height<100)return null;
 const k=Math.min((width-64)/130,(height-86)/94),angle=-Math.atan2(3,4)*180/Math.PI;
 if(k<=0)return null;
 const start={x:24+12*k,y:height-45};
 const ray=(t,n=0)=>({x:start.x+(.8*t-.6*n)*k,y:start.y+(-.6*t-.8*n)*k});
 return {width,height,k,angle,start,ray,point:ray(s),handle:ray(s+18,5),ex:.8,ey:-.6};
}
export function drawBench(svg,handle,surface,s,{active=false,enabled=false,width,height}={}){
 const g=geometry(s,width,height);if(!g)return null;
 const {k,ray,point,angle,start}=g,a=ray(-9),b=ray(126),end=ray(100),base=height-20;
 const path=(a,b)=>`M${a.x} ${a.y}L${b.x} ${b.y}`;
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.dataset.surface=surface;svg.dataset.position=s;svg.dataset.scale=k;
 let html=`<defs><pattern id="wood" width="64" height="18" patternUnits="userSpaceOnUse"><rect width="64" height="18" fill="#dfbd8c"/><path d="M0 5Q24 0 64 7M0 14Q35 19 64 12" stroke="#aa8158" opacity=".3" fill="none"/></pattern></defs><path d="M14 ${base}H${width-14}" stroke="#ccb998"/><path d="M${a.x} ${a.y}L${b.x} ${b.y}L${b.x} ${base}L${a.x} ${base}Z" fill="url(#wood)" stroke="${ink}" stroke-width="2"/><path d="${path(a,b)}" stroke="${surface==='rough'?'#8b7057':'#70958e'}" stroke-width="4" ${surface==='rough'?'stroke-dasharray="3 2"':''}/>`;
 const r0=ray(0,-10),r1=ray(100,-10);
 html+=`<path d="${path(r0,r1)}" stroke="#416e60" stroke-width="1.5"/>`;
 for(let t=0;t<=100;t+=10){html+=`<path d="${path(ray(t,-10),ray(t,-13))}" stroke="#416e60"/>`;}
 // Fixed label is outside the entire 44px handle sweep, including mobile.
 html+=label(width/2,height-4,'沿坡量測段 100 cm');
 for(const [p,t] of [[start,'起點'],[end,'終點']])html+=`<circle cx="${p.x}" cy="${p.y}" r="3" fill="#a95a42"/>${label(p.x,p.y+25,t)}`;
 const vx=end.x+24;html+=`<path d="M${vx} ${start.y}V${end.y}m-4 0h8M${vx-4} ${start.y}h8" stroke="#a36348" fill="none"/><path d="M${start.x} ${start.y}H${vx}M${end.x} ${end.y}H${vx}" stroke="#b08f6a" stroke-dasharray="3 4" opacity=".5"/>`;
 html+=label(14,23,'箱子重力 10 N','start')+label(width-14,23,'垂直升高 60 cm','end');
 html+=`<g transform="translate(${point.x} ${point.y}) rotate(${angle})"><rect x="${-6*k}" y="${-9*k}" width="${12*k}" height="${9*k}" rx="${k}" fill="#d7ad76" stroke="${ink}" stroke-width="1.7"/><path d="M${-5*k} ${-7*k}H${5*k}M${-3*k} ${-8*k}V${-k}M${3*k} ${-8*k}V${-k}" stroke="#aa7e4c"/><circle r="3" fill="#b95843" stroke="#fff8e5"/><path d="M${6*k} ${-5*k}H${8*k}M${15*k} ${-5*k}H${18*k}" stroke="${ink}" stroke-width="2"/><rect x="${8*k}" y="${-7*k}" width="${7*k}" height="${4*k}" rx="${k}" fill="#fff4ce" stroke="${ink}"/><path d="M${8.8*k} ${-5*k}l${k} ${-k} ${k} ${2*k} ${k} ${-2*k} ${k} ${2*k} ${k} ${-k}" stroke="#aa6d4f" fill="none"/><circle cx="${18*k}" cy="${-5*k}" r="${2.4*k}" fill="#b9d4ad" stroke="#456c51" stroke-width="1.6"/><path d="M${20*k} ${-5*k}V${2*k}h${-3*k}" stroke="${active?'#a7a379':'#527a60'}" stroke-width="3" fill="none"/><rect x="${17*k}" y="${k}" width="${5*k}" height="${2*k}" fill="${active?'#e5d6a0':'#9ebd92'}" stroke="${ink}"/></g>`;
 svg.innerHTML=html;handle.style.left=`${g.handle.x}px`;handle.style.top=`${g.handle.y}px`;handle.disabled=!enabled;handle.classList.toggle('is-dragging',active);return g;
}
