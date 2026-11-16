/* Plane-mirror side view. The scale is shared across object, image and both ruler halves. */
(function (global) {
  'use strict';
  const W=420,H=278,X=210,S=4.8,TOP=85,BASE=157;
  const unsigned=n=>Number(n.toFixed(1));
  const ink='#263448', gold='#975020', teal='#116763', blue='#3c6585';
  const fmt=n=>Number(n.toFixed(2));
  const xy=a=>a.map(fmt).join(' ');
  const path=(a,b,opts)=>'<path d="M '+xy(a)+' L '+xy(b)+'" '+opts+'/>';
  const text=(x,y,content,size=14,opts='')=>'<text x="'+fmt(x)+'" y="'+fmt(y)+'" '+(opts.includes('text-anchor=')?'':'text-anchor="middle" ')+'font-size="'+size+'" font-weight="750" '+opts+'>'+content+'</text>';
  const circle=(x,y,r,opts)=>'<circle cx="'+fmt(x)+'" cy="'+fmt(y)+'" r="'+r+'" '+opts+'/>';
  function tip(a,b,t,color){
    const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);
    if(L<8)return '';
    const ux=dx/L,uy=dy/L,x=a[0]+t*dx,y=a[1]+t*dy;
    return '<path d="M '+xy([x,y])+' L '+xy([x-8*ux+3.2*uy,y-8*uy-3.2*ux])+' L '+
      xy([x-8*ux-3.2*uy,y-8*uy+3.2*ux])+' Z" fill="'+color+'" stroke="#fff8ea" stroke-width=".4"/>';
  }
  function specimen(x,apparent){
    const d='M '+(x-10)+' '+(TOP+17)+' L '+x+' '+TOP+' L '+(x+10)+' '+(TOP+17)+
      ' H '+(x+4.5)+' V '+BASE+' H '+(x-4.5)+' V '+(TOP+17)+' Z';
    return '<g '+(apparent?'data-plane-image':'data-plane-object')+'="true" data-plane-x="'+fmt(x)+'">'+
      (apparent?'':'<rect x="'+(x-15)+'" y="'+(TOP-20)+'" width="30" height="'+(BASE-TOP+30)+'" rx="8" fill="#fff" fill-opacity="0" pointer-events="all"/>')+
      '<path d="'+d+'" fill="'+(apparent?'#d0e4de':'#f5bb55')+'" stroke="'+(apparent?teal:gold)+
      '" stroke-width="2.4" stroke-linejoin="round"'+(apparent?' stroke-dasharray="4 3" fill-opacity=".64"':'')+'/>'+
      '</g>';
  }
  function bracket(a,b,y,color,num){
    const attrs='stroke="'+color+'" stroke-width="1.4" opacity=".86"';
    return path([a,y],[b,y],attrs)+path([a,y-4],[a,y+4],attrs)+path([b,y-4],[b,y+4],attrs)+
      text((a+b)/2,y-10,num+' cm',13,'fill="'+color+'"');
  }
  function ruler(){
    const line='stroke="#715844" stroke-width="1.45"';
    let r='<rect x="20" y="209" width="380" height="39" rx="8" fill="#f3e6cc" stroke="#cab293"/>'+
      path([28,218],[392,218],line);
    for(let d=-35;d<=35;d+=5){
      const px=X+d*S;
      const big=!(d%10)||Math.abs(d)===35;
      r+=path([px,218],[px,big?229:224],line);
      if(big)r+=text(px,243,Math.abs(d),d===0?14:12,'fill="'+(d===0?ink:'#70523c')+'"');
    }
    return r;
  }
  function rayGroup(o,im){
    const colors=['#a34c37','#355e96'];
    const eyes=[[52,182],[52,194]];
    const projection=eyes.map(e=>[X,im[1]+(e[1]-im[1])*(im[0]-X)/(im[0]-e[0])]);
    let r='<g data-plane-ray-overlay="true">';
    // The two screen-space endpoints represent two points across one eye pupil, not two eyes.
    projection.forEach((p,i)=>{
      const col=colors[i], attrs='stroke="'+col+'" stroke-width="2.1" fill="none" stroke-linecap="round"';
      r+=path(o,p,attrs+' data-plane-ray="incident"')+tip(o,p,.54,col)+
        path(p,eyes[i],attrs+' data-plane-ray="reflected"')+tip(p,eyes[i],.63,col)+
        path(p,im,attrs+' stroke-dasharray="5 4" opacity=".87" data-plane-ray="extension"')+
        circle(p[0],p[1],2.55,'fill="'+col+'" stroke="#fff9f1" stroke-width=".5"');
    });
    return r+'<path d="M25 188 Q51 163 76 188 Q51 214 25 188Z" fill="#fff8eb" fill-opacity=".16" stroke="'+ink+
      '" stroke-width="1.8"/><ellipse cx="52" cy="188" rx="8" ry="11" fill="#316a78" fill-opacity=".2" stroke="'+ink+
      '" stroke-width="1.3"/>'+text(103,192,'眼睛',14,'fill="'+ink+'"')+'</g>';
  }
  function draw(c={}){
    const d=Math.max(10,Math.min(35,Number.isFinite(c.distance)?unsigned(c.distance):30));
    const a=X-d*S,b=X+d*S;
    const rays=Boolean(c.showRays);
    const desc='平面鏡側視圖，鏡面是 0。物體在鏡前 '+d+' 公分，像看起來在鏡後 '+d+
      ' 公分；兩者正立、等大而且等距。'+(rays?'實線沿鏡面反射後進入眼睛，虛線是往鏡後反向延長，不是實際光路。':'');
    let body='<rect x="1" y="1" width="418" height="276" rx="14" fill="#fffaef" stroke="#c2aa8a"/>'+
      '<path d="M13 66 Q13 60 19 60 H210 V203 H19 Q13 203 13 197 Z" fill="#f0e2cb"/>'+
      '<path d="M210 60 H401 Q407 60 407 66 V197 Q407 203 401 203 H210 Z" fill="#e6eeeb"/>'+
      text(110,22,'鏡前・物體側',15,'fill="'+ink+'"')+text(310,22,'鏡後',15,'fill="'+ink+'"')+
      bracket(a,X,55,gold,d)+bracket(X,b,55,teal,d)+
      path([21,BASE],[399,BASE],'stroke="#846e62" stroke-width="1" stroke-opacity=".48" stroke-dasharray="3 5"')+
      path([a,BASE],[a,211],'stroke="'+gold+'" stroke-width="1.2" stroke-opacity=".55" stroke-dasharray="4 4"')+
      path([b,BASE],[b,211],'stroke="'+teal+'" stroke-width="1.2" stroke-opacity=".55" stroke-dasharray="4 4"')+
      '<path d="M210 64V210" stroke="'+blue+'" stroke-width="4.5" stroke-linecap="round"/>'+
      '<path d="M209 65V204" stroke="#eaf1f3" stroke-width="1.3" stroke-linecap="round"/>'+
      text(X,78,'鏡面',11,'fill="'+ink+'" stroke="#fffaef" stroke-width="2.8" paint-order="stroke"')+
      (rays?rayGroup([a,TOP],[b,TOP]):'')+
      specimen(a,false)+specimen(b,true)+
      text(a,77,'物體',14,'fill="'+gold+'" stroke="#fffaef" stroke-width="2.2" paint-order="stroke"')+
      text(b,77,'像',14,'fill="'+teal+'" stroke="#fffaef" stroke-width="2.2" paint-order="stroke"')+
      ruler();
    if(rays){
      body+=path([21,263],[39,263],'stroke="'+gold+'" stroke-width="2.1"')+
        text(44,268,'實線：光走過的路',13,'text-anchor="start" fill="'+ink+'"')+
        path([209,263],[228,263],'stroke="'+blue+'" stroke-width="2.1" stroke-dasharray="4 3"')+
        text(233,268,'虛線：往回延長的線',13,'text-anchor="start" fill="'+ink+'"');
    }else{
      body+=text(X,268,'兩側刻度相同，從鏡面 0 往外量。',13,'fill="'+ink+'"');
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+desc+
      '" data-plane-strip="true" style="width:100%;height:auto;display:block" font-family="system-ui,sans-serif">'+body+'</svg>';
  }
  global.PlaneMirror=Object.freeze({draw});
})(window);
