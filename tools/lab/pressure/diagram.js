/* Interactive pressure apparatus. Units: m, L and kPa. */
(function (global) {
  'use strict';
  const W=420, WATER_H=279, GAS_H=247, surface=63, depthScale=79, gasZero=40, gasScale=220;
  const C={ink:'#253548',sub:'#67533f',paper:'#fff8ea',wood:'#c7ad8c',teal:'#146d6d',blue:'#2b6483',
    gold:'#a55b25',rust:'#a53b31',pale:'#e7f0ed'};
  const round=x=>Math.round(x*100)/100, pos=p=>p.map(round).join(' ');
  const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
  const val=(x,fallback)=>Number.isFinite(x)?x:fallback;
  const t=(x,y,words,{size=14,color=C.ink,anchor='middle',weight=760}={})=>'<text x="'+round(x)+'" y="'+round(y)+
    '" font-size="'+size+'" font-weight="'+weight+'" text-anchor="'+anchor+'" fill="'+color+'">'+words+'</text>';
  const line=(a,b,attrs)=>'<path d="M '+pos(a)+' L '+pos(b)+'" '+attrs+'/>';
  const box=(x,y,w,h,r,fill,stroke='',attr='')=>'<rect x="'+round(x)+'" y="'+round(y)+'" width="'+round(w)+
    '" height="'+round(h)+'" rx="'+r+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'"':'')+' '+attr+'/>';
  const dot=(x,y,r,fill,attr='')=>'<circle cx="'+round(x)+'" cy="'+round(y)+'" r="'+r+'" fill="'+fill+'" '+attr+'/>';
  const defsAttrs='stroke-linecap="round" stroke-linejoin="round"';
  let serial=0;
  function svg(h,desc,body,name,mapping){
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+h+'" role="img" aria-label="'+desc+
      '" data-pressure-diagram="'+name+'" '+mapping+
      ' style="display:block;width:100%;height:auto" font-family="system-ui,sans-serif">'+body+'</svg>';
  }
  function dial(x,y,relative,id){
    const r=49,start=-136,end=136;
    const point=(a,l)=>[x+l*Math.sin(a*Math.PI/180),y-l*Math.cos(a*Math.PI/180)];
    const face=dot(x,y,59,'#f8f3e6','stroke="#826b55" stroke-width="2"')+
      dot(x,y,55,'url(#'+id+'-face)','stroke="#d1ba9d" stroke-width="1"');
    const tick='stroke="#706763" stroke-width="1.3" '+defsAttrs;
    let marks='',labels='';
    for(let i=0;i<=20;i++){
      const large=i%5===0,a=start+(end-start)*i/20;
      marks+=line(point(a,r),point(a,large?r-7:r-4),tick);
      if(large){const p=point(a,r-16);labels+=t(p[0],p[1]+3.7,i,{size:9.5});}
    }
    const deg=start+(end-start)*clamp(relative,0,20)/20;
    const arc=(a,b,color,wide)=>{
      if(a===b)return '';
      return '<path d="M '+pos(point(a,r+1))+' A '+(r+1)+' '+(r+1)+' 0 '+(Math.abs(b-a)>180?'1':'0')+
        ' 1 '+pos(point(b,r+1))+'" stroke="'+color+'" stroke-width="'+wide+'" fill="none" stroke-linecap="round"/>';
    };
    const needle='<g transform="rotate('+round(deg)+' '+x+' '+y+')" data-pressure-needle="'+round(deg)+'">'+
      '<path d="M '+(x-2.8)+' '+(y+5)+' L '+x+' '+(y-r+8)+' L '+(x+2.8)+' '+(y+5)+' Z" fill="'+C.rust+'"/>'+
      '<path d="M '+x+' '+(y-24)+'V'+(y-4)+'" stroke="#cf7465" stroke-width=".7"/></g>'+
      dot(x,y,4.5,'#705542','stroke="#fff7e5" stroke-width=".75"');
    const numeric=relative.toFixed(1);
    return '<g data-pressure-gauge="true" data-gauge-kpa="'+round(relative)+'">'+
      box(264,49,141,188,14,'#efe1c6','#c7ad8c')+t(x,69,'水造成的表壓',{size:15})+
      face+arc(start,end,'#ddd1bb',3)+arc(start,deg,'#318284',3)+marks+labels+needle+
      box(283,185,102,30,8,'#193b42','#c7d5c6')+
      t(x,206,numeric+' kPa',{size:16,color:'#f1f8e8',weight:800})+
      t(x,229,'不含大氣壓',{size:12,color:C.sub})+'</g>';
  }
  function water(c={}){
    const depth=clamp(val(c.depth,0),0,2),relative=val(c.relative,9.8*depth),y=surface+depth*depthScale;
    const id='pressure-water-'+(++serial);
    const style='stroke="#5c7380" stroke-width="1.05" '+defsAttrs;
    let ruler=line([44,surface],[44,surface+2*depthScale],'stroke="#637888" stroke-width="1.2"');
    for(let i=0;i<=20;i++){
      const py=surface+i*depthScale/10;
      ruler+=line([44,py],[i%5===0?58:51,py],style);
      if(i%5===0)ruler+=t(40,py+4,i*10,{size:11,anchor:'end',color:'#415661',weight:700});
    }
    const plateY=clamp(y-12,surface+3,211);
    const sensor='<g data-pressure-probe="true" data-pressure-probe-y="'+round(y)+'" style="cursor:ns-resize">'+
      '<path d="M188 51 H165 Q157 51 157 60 V'+round(y)+'" fill="none" stroke="#496570" stroke-width="2.8" '+defsAttrs+'/>'+
      '<path d="M188 51 H165 Q157 51 157 60 V'+round(y)+'" fill="none" stroke="#b4c6c7" stroke-width="1" '+defsAttrs+'/>'+
      box(143,y-10,28,20,6,'#405e68','#2a4652')+box(149,y-7,17,14,4,'#bce0d8','#244c57')+
      dot(157,y,3.2,'#237681','stroke="#eaf6ea" stroke-width=".8"')+
      box(137,y-19,44,38,9,'#fff','','fill-opacity="0" pointer-events="all"')+'</g>';
    const track=depth>.045?line([63,y],[144,y],'stroke="#236c80" stroke-width="1.25" stroke-dasharray="4 3"'):'';
    const backdrop='<defs>'+
      '<linearGradient id="'+id+'-water" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">'+
      '<stop offset="0" stop-color="#98d3d5"/><stop offset="1" stop-color="#73a9c0"/></linearGradient>'+
      '<linearGradient id="'+id+'-face" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">'+
      '<stop offset="0" stop-color="#fffcf3"/><stop offset="1" stop-color="#eadcc4"/></linearGradient>'+
      '<clipPath id="'+id+'-glass"><rect x="69" y="49" width="175" height="181" rx="8"/></clipPath></defs>';
    const body=backdrop+box(1,1,418,277,15,C.paper,C.wood)+
      t(76,32,'淡水槽',{size:16,anchor:'start'})+t(43,48,'cm',{size:11,anchor:'end',color:C.sub})+ruler+
      '<g clip-path="url(#'+id+'-glass)">'+box(69,49,175,181,8,'#e0edeb')+
      box(69,surface,175,168,0,'url(#'+id+'-water)','','data-pressure-water-fill="true"')+
      '<path d="M69 63 Q91 59 113 63 T157 63 T201 63 T245 63" fill="none" stroke="#276f91" stroke-width="1.7" data-water-surface="'+surface+'"/>'+
      '<path d="M77 55 V225 M80 55 V218 M236 53 V224" fill="none" stroke="#fcffff" stroke-opacity=".64" stroke-width="2"/>'+
      '<path d="M76 218 H237" fill="none" stroke="#b9e0e7" stroke-opacity=".61" stroke-width="2"/>'+
      '</g>'+
      '<path d="M69 49 V218 Q69 230 80 230 H234 Q244 230 244 220 V49" fill="none" stroke="#4b8291" stroke-width="2" '+defsAttrs+'/>'+
      '<path d="M65 50 H248" fill="none" stroke="#7296a0" stroke-width="2.3" '+defsAttrs+'/>'+
      t(239,57,'水面 0 m',{size:11,color:'#375f70',anchor:'end'})+track+sensor+
      box(184,plateY,56,23,6,'#f0f7ec','#64939d')+t(212,plateY+16,depth.toFixed(2)+' m',{size:12,color:'#214f61'})+
      dial(334,128,relative,id)+
      t(210,263,'從水面向下量深度，把探頭移高或移低。',{size:14,color:C.teal});
    return svg(WATER_H,'淡水水槽；探頭深度 '+depth.toFixed(2)+' 公尺，水造成的表壓 '+relative.toFixed(1)+
      ' 千帕，不含大氣壓。',body,'water','data-depth-origin="'+surface+'" data-depth-scale="'+depthScale+'"');
  }
  const particles=Array.from({length:24},(_,i)=>{
    const col=i%6,row=Math.floor(i/6),noiseK=((i*23+13)%19)/19,noiseY=((i*31+7)%21)/21;
    return [(.58+col+(noiseK-.5)*.50)/6,(.52+row+(noiseY-.5)*.55)/4,i%7];
  });
  const emitMotion=()=>typeof global.matchMedia==='function'&&!global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function gas(c={}){
    const volume=clamp(val(c.volume,1),.5,1),x=gasZero+gasScale*volume;
    const absolute=val(c.absolute,101.325/volume);
    const id='pressure-gas-'+(++serial);
    const top=85,bottom=166,rear=278,inLeft=43,inRight=x-6,mid=(top+bottom)/2,grip=x+136;
    const stroke='stroke="#637883" stroke-width="1.45" '+defsAttrs;
    let ticks=line([gasZero+.5*gasScale,62],[gasZero+gasScale,62],stroke);
    for(let i=0;i<=10;i++){
      const tx=gasZero+(.5+i*.05)*gasScale;
      ticks+=line([tx,62],[tx,i%2===0?72:67],stroke);
      if(i%2===0)ticks+=t(tx,56,(.5+.05*i).toFixed(1),{size:10.5,color:'#415661',weight:720});
    }
    const animate=emitMotion();
    const particleMarkup=particles.map(([u,v,j],i)=>{
      const px=inLeft+8+(inRight-inLeft-16)*u,py=top+8+(bottom-top-16)*v;
      const dx=(i%3-1)*2.4,dy=(i%2?1:-1)*2.2,contrast=i%4===0?'#497d9a':'#206e79';
      // Same motion and timing at every volume. Only particle positions and domain change.
      const animation=animate?'<animateTransform attributeName="transform" type="translate" values="0 0; '+dx+' '+dy+
        '; 0 0; '+(-dx)+' '+(-dy)+'; 0 0" dur="3.2s" begin="-'+(j*.31).toFixed(2)+'s" repeatCount="indefinite"/>':'';
      return '<g data-pressure-particle="'+i+'">'+animation+
        dot(px,py,i%5===0?3.35:2.95,contrast,'stroke="#c4e5e2" stroke-width=".52"')+
        dot(px-.68,py-.72,.82,'#eff9ee','opacity=".66"')+'</g>';
    }).join('');
    const backdrop='<defs><linearGradient id="'+id+'-gas" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">'+
      '<stop offset="0" stop-color="#d6ece7"/><stop offset=".56" stop-color="#cee9e5"/>'+
      '<stop offset="1" stop-color="#b4d6d7"/></linearGradient>'+
      '<clipPath id="'+id+'-chamber"><rect x="'+inLeft+'" y="'+top+'" width="'+(inRight-inLeft)+'" height="'+(bottom-top)+'" rx="4"/></clipPath></defs>';
    const rod='<g data-pressure-piston="true" data-pressure-piston-x="'+round(x)+'" style="cursor:ew-resize">'+
      // The back of the barrel is open: the rod passes through it; the entire grip stays outside it.
      box(x-6,top-4,12,bottom-top+8,5,'#425b64','#314a54')+
      '<path d="M'+round(x-3)+' '+(top+4)+' V'+(bottom-4)+'" stroke="#a3bcbd" stroke-width="1.1"/>'+
      box(x+5,mid-5,grip-x-10,10,3,'#a2b8bc','#4a6975')+
      '<path d="M'+round(x+9)+' '+(mid-2)+' H'+round(grip-6)+'" stroke="#e7eeea" stroke-width="1.15"/>'+
      '<g data-pressure-piston-grip="'+round(grip)+'">'+
      box(grip-7,mid-33,14,66,6,'#335d70','#244756')+
      box(grip-4,mid-25,8,50,3,'#aec4c4')+
      [-11,0,11].map(d=>line([grip-3,mid+d],[grip+3,mid+d],'stroke="#365d72" stroke-width="1.35"')).join('')+'</g>'+
      box(x-14,top-6,28,bottom-top+12,7,'#fff','','fill-opacity="0" pointer-events="all"')+
      box(grip-14,mid-36,28,72,7,'#fff','','fill-opacity="0" pointer-events="all"')+'</g>';
    const panel=box(1,1,418,245,15,C.paper,C.wood)+t(49,29,'密閉針筒',{size:16,anchor:'start'})+
      box(257,20,148,24,7,'#e9ece0','#a5b2a5')+t(331,36,'絕對壓力 '+absolute.toFixed(1)+' kPa',{size:13,color:'#214f59'})+
      t(272,58,'L',{size:11,color:C.sub})+ticks;
    const chamber='<path d="M278 81 H49 Q40 81 40 90 V161 Q40 170 49 170 H278" fill="none" stroke="#538392" stroke-width="2" '+defsAttrs+'/>'+
      '<g data-pressure-gas-chamber="true" data-pressure-gas-volume="'+volume.toFixed(3)+'" clip-path="url(#'+id+'-chamber)">'+
      box(inLeft,top,inRight-inLeft,bottom-top,4,'url(#'+id+'-gas)')+particleMarkup+'</g>'+
      '<path d="M48 87 H274 M48 163 H274" fill="none" stroke="#a1b7b9" stroke-opacity=".50" stroke-width="1.05"/>'+
      '<g data-pressure-barrel-rear="'+rear+'"><path d="M272 80 H278 V89 M272 171 H278 V162" fill="none" stroke="#557c89" stroke-width="2" '+defsAttrs+'/></g>'+
      box(27,mid-8,13,16,4,'#b0c2c2','#567983')+box(21,mid-13,9,26,3,'#386371','#2d5269','data-pressure-sealed-nozzle="true"')+
      box(13,174,89,23,7,'#e8efe3','#95aa9f')+t(57,190,'前端封閉',{size:12,color:'#2f5f5b'})+
      line([45,172],[24,mid+13],'stroke="#5f7d7d" stroke-width="1.05" '+defsAttrs);
    const labelX=x;
    const body=backdrop+panel+chamber+rod+
      box(labelX-30,181,60,23,7,'#e8efe3','#95aa9f')+t(labelX,197,volume.toFixed(2)+' L',{size:13,color:'#255a64'})+
      line([302,184],[282,162],'stroke="#7e8580" stroke-width="1.05" '+defsAttrs)+
      t(331,196,'尾端開口',{size:12,color:'#516e72'})+
      t(210,232,'推拉外側握把；粒子數與溫度保持不變。',{size:14,color:C.teal});
    return svg(GAS_H,'針筒前端封閉，尾端開口外有握把。氣體體積 '+volume.toFixed(2)+' 公升，絕對壓力 '+absolute.toFixed(1)+
      ' 千帕。粒子數與溫度固定。',body,'gas','data-volume-origin="'+gasZero+'" data-volume-scale="'+gasScale+'"');
  }
  function torricelli(c={}){
    const hView=303, base=229,hScale=2.06;
    const atmospheric=clamp(val(c.atmospheric,101.3),60,110);
    const height=val(c.height,100000*atmospheric/(13600*9.8));
    const ty=base-hScale*height;
    const id='pressure-mercury-'+(++serial);
    const metal='url(#'+id+'-silver)';
    const column='<g data-pressure-mercury-column="true" data-mercury-column-height-cm="'+round(height)+'">'+
      box(207,ty,25,252-ty,0,metal)+
      '<path d="M207 '+round(ty)+' Q219.5 '+round(ty-4)+' 232 '+round(ty)+
      '" fill="none" stroke="#46596a" stroke-width="1.7" data-mercury-column-top="'+round(ty)+'"/>'+
      '<path d="M212 '+round(ty+4)+' V246" fill="none" stroke="#eef3f5" stroke-opacity=".70" stroke-width="1.4"/></g>';
    const vacuum=box(207,43,25,ty-43,0,'#e4e9f2','','data-mercury-vacuum="true"');
    const vessel='<path d="M70 221 V249 Q70 263 84 263 H335 Q349 263 349 249 V221" fill="none" stroke="#638092" stroke-width="2.1" '+defsAttrs+'/>'+
      '<path d="M72 229 H347 V249 Q347 261 334 261 H85 Q72 261 72 249Z" fill="'+metal+'" stroke="#738290" stroke-width=".5"/>'+
      '<path d="M72 229 H347" stroke="#536a79" stroke-width="1.7" data-mercury-reservoir-surface="'+base+'"/>'+
      '<path d="M79 255 H340" stroke="#dbe3e7" stroke-opacity=".70" stroke-width="1.4"/>';
    const tube='<path d="M202 248 V47 Q202 35 214 35 H225 Q237 35 237 47 V248" fill="none" stroke="#577a90" stroke-width="2.2" '+defsAttrs+'/>'+
      '<path d="M202 248 V47 Q202 35 214 35 H225 Q237 35 237 47 V248" fill="none" stroke="#9fc1d3" stroke-width=".9" stroke-opacity=".76"/>'+
      '<path d="M204 51 V245" fill="none" stroke="#fcffff" stroke-width="1.15" stroke-opacity=".68"/>'+
      '<g data-mercury-submerged-opening="248">'+dot(202,248,2.15,'#7593a4')+dot(237,248,2.15,'#7593a4')+'</g>'+
      line([245,251],[239,248],'stroke="#5b7380" stroke-width="1.05" '+defsAttrs)+
      t(284,257,'下端開口浸在汞裡',{size:11,color:'#374f5d'});
    const airArrow=(x)=>'<g data-pressure-air-arrow="down">'+
      line([x,181],[x,219],'stroke="#345f7e" stroke-width="2.6" '+defsAttrs)+
      '<path d="M '+(x-4.5)+' 215 L '+x+' 225 L '+(x+4.5)+' 215 Z" fill="#345f7e"/></g>';
    const levelBracket='<g data-mercury-height-bracket="true">'+
      line([239,ty],[276,ty],'stroke="#755e4b" stroke-width="1" stroke-dasharray="4 3"')+
      line([243,base],[276,base],'stroke="#755e4b" stroke-width="1" stroke-dasharray="4 3"')+
      line([270,ty],[270,base],'stroke="#755e4b" stroke-width="1.45"')+
      line([264,ty],[276,ty],'stroke="#755e4b" stroke-width="1.4"')+
      line([264,base],[276,base],'stroke="#755e4b" stroke-width="1.4"')+
      box(280,clamp(ty+9,70,145),107,29,6,'#fbf2e2','#b89e7d')+
      t(333.5,clamp(ty+9,70,145)+19,'h ≈ '+height.toFixed(1)+' cm',{size:13,color:'#593f31'})+'</g>';
    const vacuumLabel=t(312,44,'頂端近真空',{size:13,color:'#635379'})+
      line([259,42],[232,49],'stroke="#746d85" stroke-width="1.05" '+defsAttrs);
    const body='<defs><linearGradient id="'+id+'-silver" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0" stop-color="#bbc4cc"/><stop offset=".42" stop-color="#a3aeb9"/>'+
      '<stop offset="1" stop-color="#818e9c"/></linearGradient></defs>'+
      box(1,1,418,301,15,C.paper,C.wood)+t(63,30,'托里切利氣壓計',{size:16,anchor:'start'})+
      box(43,43,125,27,6,'#e8edf0','#a5b3be')+t(105.5,61,atmospheric.toFixed(1)+' kPa',{size:15,color:'#345f7e'})+
      vessel+vacuum+column+tube+levelBracket+vacuumLabel+
      airArrow(120)+airArrow(320)+t(116,172,'外界空氣向下壓汞面',{size:12,color:'#345f7e'})+
      t(65,233,'0',{size:11,anchor:'end'})+t(61,248,'槽外汞面',{size:11,anchor:'end'})+
      t(210,285,'以槽外汞面為 0，量到管內汞面；忽略微小的汞蒸氣壓。',{size:13,color:C.teal});
    return svg(hView,'托里切利氣壓計。兩個向下箭頭指出外界空氣壓著露出的汞面。封閉管頂接近真空，管的下端開口浸沒在汞裡。以外槽汞面為零，管內汞柱高 '+height.toFixed(1)+
      ' 公分。外界氣壓 '+atmospheric.toFixed(1)+' 千帕。',body,'torricelli','data-mercury-reference-y="'+base+'" data-mercury-scale="'+hScale+'"');
  }
  const readable=(svg,name,fallback)=>{
    const s=svg?.getAttribute?.(name);
    return s!==null&&s!==undefined&&Number.isFinite(Number(s))?Number(s):fallback;
  };
  function depthAt(svg,y){
    return (y-readable(svg,'data-depth-origin',surface))/readable(svg,'data-depth-scale',depthScale);
  }
  function volumeAt(svg,x){
    return (x-readable(svg,'data-volume-origin',gasZero))/readable(svg,'data-volume-scale',gasScale);
  }
  global.PressureDiagram=Object.freeze({water,gas,torricelli,depthAt,volumeAt});
})(window);
