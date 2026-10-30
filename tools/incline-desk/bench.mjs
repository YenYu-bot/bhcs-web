import {derive,RAMPS} from './model.mjs';
const ink='#51402f';
const tx=(x,y,s,size=12,color=ink,anchor='middle')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-family="Noto Sans TC,Noto Sans CJK TC,sans-serif">${s}</text>`;
export function geometry(rampId,s,width=500,height=330){
 const L=rampId==='long'?80:40,H=20,k=Math.min(5.2,(width-70)/110),ex=Math.sqrt(L*L-H*H)/L,ey=-H/L;
 const start={x:34+7*k,y:height-65},point={x:start.x+ex*s*k,y:start.y+ey*s*k};
 const handle={x:point.x+ex*19*k+ey*4.5*k,y:point.y+ey*19*k-ex*4.5*k};
 return {L,H,k,ex,ey,start,point,handle,width,height,angle:Math.atan2(ey,ex)*180/Math.PI,ray:(s,n=0)=>({x:start.x+ex*s*k-ey*n*k,y:start.y+ey*s*k+ex*n*k})};
}
export function drawBench(svg,handle,rampId,s,{active=false,enabled=false,width,height}={}){
 const g=geometry(rampId,s,width||svg.parentElement.clientWidth,height||svg.parentElement.clientHeight),{L,k,start,point,angle,ray}=g;
 svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);svg.dataset.ramp=rampId;svg.dataset.position=s;svg.dataset.scale=k;
 const a=ray(-7),b=ray(L+26),base=g.height-38,end=ray(L),r0=ray(0,8),r1=ray(L,8);
 let html=`<defs><pattern id="wood" width="75" height="22" patternUnits="userSpaceOnUse"><rect width="75" height="22" fill="#e1bc85"/><path d="M0 7Q30 3 75 8M0 18Q45 22 75 15" fill="none" stroke="#b48d5a" stroke-opacity=".3"/></pattern></defs><path d="M16 ${base}Q${g.width/2} ${base+3} ${g.width-15} ${base}" stroke="#cdbb95" stroke-width="2" fill="none"/><path d="M${a.x} ${a.y}L${b.x} ${b.y}L${b.x} ${base}L${a.x} ${base}Z" fill="url(#wood)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="#95734f" stroke-width="4"/>`;
 const railA=ray(-6,3),railB=ray(L+25,3);html+=`<path d="M${railA.x} ${railA.y}L${railB.x} ${railB.y}" stroke="#6b8063" stroke-width="2"/>`;
 // Two fixed flags follow the same box reference point, not the outer device ends.
 for(const [p,label] of [[start,'起點'],[end,'終點']]){html+=`<path d="M${p.x} ${p.y}v18l12 -5-12 -5" stroke="${ink}" stroke-width="1.4" fill="#edc87e"/>${tx(p.x-3,g.width<400&&label==='起點'?base+18:p.y+31,label,11)}`;}
 html+=`<path d="M${r0.x} ${r0.y}L${r1.x} ${r1.y}" stroke="#4d6f65" stroke-width="1.2"/>`;
 for(let i=0;i<=L;i+=10){const p=ray(i,8),q=ray(i,10);html+=`<path d="M${p.x} ${p.y}L${q.x} ${q.y}" stroke="#4d6f65"/>`;}
 const middle=g.width<400?{x:g.width/2,y:base+18}:ray(L/2,17);html+=tx(middle.x,middle.y,`沿坡量測段 ${L} cm`,12,'#31594e');
 const hrx=Math.min(g.width-17,end.x+27);html+=`<path d="M${hrx} ${start.y}V${end.y}m-4 0h8M${hrx-4} ${start.y}h8" fill="none" stroke="#bb6a47" stroke-width="1.5"/><path d="M${end.x+4} ${end.y}H${hrx}M${start.x} ${start.y}H${hrx}" stroke="#bb6a47" stroke-dasharray="3 4" stroke-opacity=".4"/>`;
 // A raised figure label keeps the small mobile ramp clear.
 html+=tx(g.width-15,35,'垂直升高 20 cm',12,'#9b583c','end');
 html+=`<g transform="translate(${point.x} ${point.y}) rotate(${angle})"><rect x="${-6*k}" y="${-9*k}" width="${12*k}" height="${9*k}" rx="${1.1*k}" fill="#d9b482" stroke="${ink}" stroke-width="1.8"/><path d="M${-5*k} ${-7*k}H${5*k}M${-3*k} ${-8*k}V${-1*k}M${3*k} ${-8*k}V${-1*k}" stroke="#ab8355" stroke-width="1"/><circle cx="0" cy="0" r="3.5" fill="#bc624c" stroke="#fff7df" stroke-width="1"/><path d="M${6*k} ${-4.5*k}H${8*k}M${15*k} ${-4.5*k}H${19*k}" stroke="${ink}" stroke-width="2"/><rect x="${8*k}" y="${-6*k}" width="${7*k}" height="${3*k}" rx="${k}" fill="#fff8dc" stroke="${ink}" stroke-width="1.5"/><path d="M${8.7*k} ${-4.5*k}l${k} ${-k} ${k} ${2*k} ${k} ${-2*k} ${k} ${2*k} ${k} ${-k}" stroke="#b87555" stroke-width="1" fill="none"/><path d="M${21*k} ${-4.5*k}V${3*k}h${-3*k}" stroke="${active?'#b2b699':'#54725a'}" stroke-width="3" fill="none"/><rect x="${18*k}" y="${2*k}" width="${5*k}" height="${2*k}" rx="${.6*k}" fill="${active?'#e4dec1':'#a8c29b'}" stroke="${ink}" stroke-width="1"/><circle cx="${19*k}" cy="${-4.5*k}" r="${2.3*k}" fill="#c1d8b1" stroke="${ink}" stroke-width="1.6"/><path d="M${-3*k} ${-12*k}h${10*k}l${-2*k} ${-1.5*k}m${2*k} ${1.5*k}l${-2*k} ${1.5*k}" stroke="#356b5a" stroke-width="2" fill="none"/></g>`;
 const fp={x:point.x+g.ex*2*k+g.ey*15*k,y:point.y+g.ey*2*k-g.ex*15*k};html+=tx(fp.x,fp.y,'拉力沿坡',11,'#31594e');
 const gx=point.x-6*k-12,gy=point.y-8*k;html+=`<path d="M${gx} ${gy}v26l-4-5m4 5 4-5" fill="none" stroke="#ad5a45" stroke-width="1.7"/>`+tx(Math.max(29,gx-5),gy+13,'重力',10,'#9b503d','end');
 html+=tx(18,35,'物重 10 N',12,ink,'start');
 html+=tx(18,56,'紅點＝位移參考點',11,'#85765b','start');
 svg.innerHTML=html;handle.style.left=`${g.handle.x}px`;handle.style.top=`${g.handle.y}px`;handle.disabled=!enabled;handle.classList.toggle('is-dragging',active);return g;
}
