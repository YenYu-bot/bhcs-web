/* Standalone vector drawings for the virtual neutralization experiment. */
(() => {
  "use strict";
  const ink='#20334c', muted='#526277', paper='#fffdf8', warm='#f7e6cb', teal='#17695e', red='#a53e56', violet='#5d4d91';
  const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
  const finite=(x,fallback=0)=>Number.isFinite(Number(x))?Number(x):fallback;
  const txt=(x,y,value,attrs='')=>'<text x="'+x+'" y="'+y+'" '+attrs+'>'+value+'</text>';
  const line=(x1,y1,x2,y2,attrs='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" '+attrs+'/>';
  const rect=(x,y,w,h,fill,r=0,attrs='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'" '+attrs+'/>';
  const start=(height,label,style='')=>'<svg class="neutral-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 '+height+'" width="420" height="'+height+'" role="img" aria-label="'+label+'" style="display:block;width:100%;height:auto;font:14px system-ui,Noto Sans TC,sans-serif;fill:'+ink+'">'+style;
  const end='</svg>';
  const outline='stroke="'+ink+'" stroke-width="2.5" stroke-linejoin="round"';
  const mid='text-anchor="middle"', bold='font-weight="750"';
  const flask='M154 155H200V183L233 246Q240 263 224 267H130Q114 263 121 246L154 183Z';

  function apparatus({volume=0,pH=1,pink=false,running=false}={}) {
    const vol=Math.max(0,finite(volume)), ph=clamp(finite(pH,1),0,14);
    const shown=vol.toFixed(1), reading=ph.toFixed(2);
    const reservoirTop=38+55*clamp(vol/50,0,1), liquidY=240-32*clamp(vol/50,0,1);
    const status=pink?'粉紅':'無色';
    const label='虛擬滴定管已加入 '+shown+' 毫升鹼液，pH '+reading+'，酚酞'+status+(running?'，加液中':'');
    const motion='<style>@keyframes nd-drip{0%{opacity:0;transform:translateY(0)}15%{opacity:1}82%{opacity:1}100%{opacity:0;transform:translateY(33px)}}.nd-drop{animation:nd-drip .65s linear infinite}.nd-drop.later{animation-delay:.32s}@media(prefers-reduced-motion:reduce){.nd-drop{animation:none}}</style>';
    const parts=[
      rect(1,1,418,282,paper,15,'stroke="#dfc7a9" stroke-width="2"'),
      rect(14,14,392,254,warm,13),
      rect(16,249,388,19,'#e4b88a',7),
      line(19,253,401,253,'stroke="#fff1d6" stroke-width="2"'),
      // Clamp stand.
      rect(39,22,8,229,'#8aa6bc',3,outline),
      rect(25,242,76,14,'#9ab1c5',4,outline),
      rect(43,58,118,8,'#7893ab',3,outline),
      rect(48,52,20,20,'#f9e9d0',4,outline),
      // Burette glass, water level, and scale marker.
      '<defs><clipPath id="nd-flask-liquid"><path d="'+flask+'"/></clipPath><clipPath id="nd-burette-glass">'+rect(164,29,26,76,'#fff',8)+'</clipPath></defs>',
      rect(164,29,26,76,'#fbffff',8,outline),
      '<g clip-path="url(#nd-burette-glass)">'+rect(165,reservoirTop,24,105-reservoirTop,'#dcecf5')+line(165,reservoirTop,189,reservoirTop,'stroke="#6b95b3" stroke-width="1.3"')+'</g>',
      line(171,35,171,93,'stroke="#fff" stroke-width="3" opacity=".85"'),
      '<path d="M173 103H181V122L179 124V139H175V124L173 122Z" fill="#f9ffff" '+outline+'/>',
      rect(158,111,37,8,running?teal:'#b57647',4,outline),
      rect(189,109,11,12,'#f2c085',3,outline),
      ...[0,10,20,30,40,50].map((v,i)=>line(193,38+i*11,200+(i%5===0?4:0),38+i*11,'stroke="'+ink+'" stroke-width="1.2"')+(i%5===0?txt(210,42+i*11,v,'font-size="10" fill="'+muted+'"'):'')).join(''),
      txt(231,53,'虛擬滴定管',bold),
      txt(231,72,'累計加入 '+shown+' mL','font-size="12" fill="'+muted+'"'),
      // Flask and its volume-dependent, colorless or pink solution. The probe is immersed.
      '<path d="'+flask+'" fill="#fffefa" '+outline+'/>',
      '<g clip-path="url(#nd-flask-liquid)">'+rect(113,liquidY,128,270-liquidY,pink?'#f6b4c3':'#f7fafc')+
        '<path d="M120 '+liquidY+' Q177 '+(liquidY+5)+' 234 '+liquidY+'" fill="none" stroke="'+(pink?'#b85574':'#9bb7c9')+'" stroke-width="1.5"/>'+
        '<path d="M161 174H165V191L141 240" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="4" opacity=".75"/></g>',
      '<path d="'+flask+'" fill="none" '+outline+'/>',
      rect(151,154,52,5,'#ecf5fb',2,outline),
      // Display probe and instrument.
      '<path d="M327 161 C327 102 201 102 193 178 L190 248" fill="none" stroke="'+ink+'" stroke-width="2.3" stroke-linecap="round"/>',
      '<path d="M193 177L190 248" fill="none" stroke="#6c879a" stroke-width="6" stroke-linecap="round"/>',
      '<path d="M191 240L190 249" fill="none" stroke="'+teal+'" stroke-width="4" stroke-linecap="round"/>',
      rect(267,152,120,88,'#397b74',11,outline),
      txt(327,173,'pH 計',mid+' '+bold+' fill="#fff"'),
      rect(278,180,98,30,'#edf8e9',5,'stroke="#11433c" stroke-width="1.5"'),
      txt(327,202,reading,mid+' font-size="22" font-weight="850" style="font-variant-numeric:tabular-nums"'),
      txt(327,229,'酚酞：'+status,mid+' font-size="13" font-weight="700" fill="#fff"'),
      // A visible moving drop is paired with a text state elsewhere; no bubbles or fumes.
      running?'<g fill="#4a8aaf" aria-hidden="true"><path class="nd-drop" d="M177 141q-5 6-2 9q2 2 4 0q3-3-2-9Z"/><path class="nd-drop later" d="M177 141q-4 5-2 8q2 2 4 0q2-3-2-8Z"/></g>':''
    ];
    return start(284,label,running?motion:'')+parts.join('')+end;
  }

  function plot(records=[]) {
    const points=(Array.isArray(records)?records:[]).filter(r=>r&&[.1,.05].includes(Number(r.strength))&&
      r.volume!==null&&r.pH!==null&&Number.isFinite(Number(r.volume))&&Number.isFinite(Number(r.pH))&&Number(r.volume)>=0&&Number(r.pH)>=0&&Number(r.pH)<=14);
    const xMax=Math.max(50,Math.ceil(Math.max(0,...points.map(r=>Number(r.volume)))/10)*10);
    const X=v=>50+v/xMax*336, Y=v=>203-v/14*158;
    const grid='stroke="#e4e7e7" stroke-width="1"';
    const axis='stroke="'+ink+'" stroke-width="1.5"';
    const label='pH 對累計加入鹼液體積散點圖；每個符號只代表一筆已記下的模擬觀察，pH 7 為中性參考線。';
    const a=points.filter(r=>Number(r.strength)===.1), b=points.filter(r=>Number(r.strength)===.05);
    const pointTitle=(r,c)=>'<title>'+c+' mol/L、加入 '+Number(r.volume)+' mL、pH '+Number(r.pH).toFixed(2)+'</title>';
    const circle=(x,y,c,r=5)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'" stroke="#fff" stroke-width="1.5"/>';
    const diamond=(x,y,c,r=6)=>'<path d="M'+x+' '+(y-r)+'L'+(x+r)+' '+y+'L'+x+' '+(y+r)+'L'+(x-r)+' '+y+'Z" fill="'+c+'" stroke="#fff" stroke-width="1.5"/>';
    const near=(x,y)=>a.some(r=>Math.abs(X(Number(r.volume))-x)<10&&Math.abs(Y(Number(r.pH))-y)<10);
    const marks=[
      ...a.map(r=>'<g>'+pointTitle(r,'0.10')+circle(X(Number(r.volume)),Y(Number(r.pH)),teal)+'</g>'),
      ...b.map(r=>{const x=X(Number(r.volume)),y=Y(Number(r.pH));return '<g>'+pointTitle(r,'0.05')+
        (near(x,y)?'<circle cx="'+x+'" cy="'+y+'" r="8" fill="none" stroke="'+violet+'" stroke-width="2"/>':diamond(x,y,violet))+'</g>';})
    ].join('');
    const html=[
      rect(1,1,418,277,paper,14,'stroke="#dfc7a9" stroke-width="2"'),
      txt(24,26,'pH',bold),
      ...[0,2,4,6,8,10,12,14].map(v=>line(50,Y(v),386,Y(v),grid)+txt(43,Y(v)+4,v,'text-anchor="end" font-size="11"')),
      ...[0,.2,.4,.6,.8,1].map(f=>line(X(f*xMax),45,X(f*xMax),203,grid)+txt(X(f*xMax),220,Math.round(f*xMax),mid+' font-size="11"')),
      line(50,203,386,203,axis),line(50,45,50,203,axis),
      line(50,Y(7),386,Y(7),'stroke="#785d31" stroke-width="1.3" stroke-dasharray="5 5"'),
      txt(383,Y(7)-6,'pH 7','text-anchor="end" font-size="10" fill="#785d31"'),
      marks,
      txt(386,238,'累計加入鹼液（mL）','text-anchor="end" font-size="12" '+bold),
      circle(57,257,teal),txt(68,261,'0.10 mol/L','font-size="12"'),
      diamond(163,257,violet),txt(175,261,'0.05 mol/L','font-size="12"'),
      txt(388,261,'只畫已記下的點','font-size="11" text-anchor="end" fill="'+muted+'"')
    ].join('');
    return start(279,label)+html+end;
  }
  window.NeutralDiagram=Object.freeze({apparatus,plot});
})();
