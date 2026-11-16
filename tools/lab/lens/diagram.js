/* Lens trial: independent side diagram, screen evidence and optional eye view. */
(function (global) {
  'use strict';
  const W=420,H=276,X=210,Y=126,SX=4.8,SY=3.1,HOBJ=8;
  const C={ink:'#273648',sub:'#5d5759',paper:'#fff9ed',outline:'#c7ad8d',
    gold:'#955121',teal:'#146863',red:'#a34435',blue:'#305b95',axis:'#786c64',lav:'#694d82',slate:'#41677e'};
  const labels={'convex-lens':'凸透鏡','concave-lens':'凹透鏡'};
  let serial=0;
  const n=x=>Math.round(x*100)/100;
  const LONG_SX=(402-X)/220;
  const pos=p=>p.map(n).join(' ');
  const path=(a,b,attrs)=>'<path d="M '+pos(a)+' L '+pos(b)+'" '+attrs+'/>';
  const box=(x,y,w,h,r,fill,stroke)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+
    '"'+(stroke?' stroke="'+stroke+'"':'')+'/>';
  const point=(p,r,attrs)=>'<circle cx="'+n(p[0])+'" cy="'+n(p[1])+'" r="'+r+'" '+attrs+'/>';
  function text(x,y,words,opt={}){
    return '<text x="'+n(x)+'" y="'+n(y)+'" text-anchor="'+(opt.anchor||'middle')+'" font-weight="'+(opt.weight||760)+
      '" font-size="'+(opt.size||14)+'" fill="'+(opt.color||C.ink)+'"'+(opt.halo?' stroke="#fff8ea" stroke-width="2.4" paint-order="stroke"':'')+
      '>'+words+'</text>';
  }
  function svg(h,desc,body,name,attrs=''){
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+h+'" role="img" aria-label="'+desc+
      '" data-lens-visual="'+name+'" '+attrs+' style="display:block;width:100%;height:auto" font-family="system-ui,sans-serif">'+body+'</svg>';
  }
  function arrow(a,b,t,color,size=8){
    const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    if(len<10)return '';
    const u=dx/len,v=dy/len,x=a[0]+dx*t,y=a[1]+dy*t;
    return '<path d="M '+pos([x,y])+' L '+pos([x-size*u+size*.44*v,y-size*v-size*.44*u])+ ' L '+
      pos([x-size*u-size*.44*v,y-size*v+size*.44*u])+' Z" fill="'+color+
      '" stroke="#fffaf0" stroke-width=".54" stroke-linejoin="round"/>';
  }
  function normalize(c){
    const kind=c.kind==='concave-lens'?c.kind:'convex-lens';
    const u=Number.isFinite(c.u)&&c.u>0?c.u:30;
    const f=Number.isFinite(c.f)&&c.f!==0?c.f:kind==='concave-lens'?-10:10;
    const atFocus=Math.abs(u-f)<1e-9;
    const v=atFocus?Infinity:Number.isFinite(c.v)?c.v:1/(1/f-1/u);
    const m=atFocus?null:Number.isFinite(c.m)?c.m:-v/u;
    const screen=Number.isFinite(c.screen)&&c.screen>0?c.screen:null;
    const real=Number.isFinite(v)&&v>0;
    const found=Boolean(c.found)&&real&&screen!==null&&Math.abs(screen-v)<=.5000001;
    return {kind,u,v,m,f,atFocus,real,screen,found,eye:Boolean(c.eye),
      explorer:c.explorer===true,extended:c.explorer===true&&c.extended===true,rays:c.showRays!==false};
  }
  function lensShape(c){
    const shape=c.kind==='convex-lens'?
      'M210 43 Q238 126 210 207 Q182 126 210 43Z':
      'M193 43 H227 Q215 126 227 207 H193 Q205 126 193 43Z';
    return '<path d="'+shape+'" fill="#abd9dc" fill-opacity=".76" stroke="#386e77" stroke-width="1.8"/>'+
      path([210,46],[210,207],'stroke="#487582" stroke-width="1" stroke-dasharray="3 4" opacity=".65"')+
      text(210,32,labels[c.kind],{size:13,color:'#2f6065'});
  }
  function ruler(map,c,screenMax){
    let r=path([map(-35,0)[0],222],[map(screenMax,0)[0],222],'stroke="#856953" stroke-width="1.35"');
    const tick=(i,label)=>{
      const px=map(i,0)[0];
      return path([px,222],[px,label?232:227],'stroke="#856953" stroke-width="1.25"')+
        (label?text(px,246,Math.abs(i),{size:12}):'');
    };
    for(let i=-35;i<=0;i+=5)r+=tick(i,i%10===0||i===-35);
    if(c.extended){
      for(let i=20;i<=220;i+=20)r+=tick(i,i===220||(i%40===0&&i!==200));
      r+=text(310,258,'右側長尺；橫直尺度不同',{size:11,color:C.sub});
    }else for(let i=5;i<=40;i+=5)r+=tick(i,i%10===0);
    return r+text(19,246,'cm',{size:11,color:C.sub});
  }
  function benchOutline(){
    return box(1,1,418,H-2,14,C.paper,C.outline)+
      '<path d="M12 46 Q12 38 20 38 H210 V211 H20 Q12 211 12 203 Z" fill="#efe3ce"/>'+
      '<path d="M210 38 H400 Q408 38 408 46 V203 Q408 211 400 211 H210Z" fill="#e8efec"/>'+
      text(107,25,'透鏡前 · 物體側',{size:15})+text(313,25,'透鏡後 · 光前進方向',{size:15});
  }
  function teacher(x,y,height,key,{inverted=false,opacity=1}={}){
    const h=Math.max(.01,height),w=h*343/600,r=Math.min(h*.20,Math.max(3,Math.min(8,h*.078)));
    const dx=w/2+r*.55,by=-h*.15;
    const star=Array.from({length:10},(_,i)=>{
      const a=-Math.PI/2+Math.PI*i/5,k=r*(i%2?.32:.71);
      return pos([-dx+Math.cos(a)*k,by+Math.sin(a)*k]);
    }).join(' ');
    return '<g data-lens-teacher="true" data-lens-specimen="'+key+'" data-lens-orientation="'+
      (inverted?'inverted':'upright')+'" transform="translate('+n(x)+' '+n(y)+')'+(inverted?' rotate(180)':'')+
      '" opacity="'+opacity+'">'+
      '<image href="../../mini-lab/img/doc-point.png" x="'+n(-w/2)+'" y="'+n(-h/2)+'" width="'+n(w)+'" height="'+n(h)+'"/>'+
      '<g data-lens-marker="star">'+point([-dx,by],r,'fill="#a02838" stroke="#fff8ea" stroke-width="1.1"')+
      '<polygon points="'+star+'" fill="#fff7de"/></g>'+
      '<g data-lens-marker="dot">'+point([dx,by],r,'fill="#245896" stroke="#fff8ea" stroke-width="1.1"')+
      point([dx,by],r*.42,'fill="#fff7de"')+'</g></g>';
  }
  function specimen(c,map,x,y,isImage){
    const virtual=isImage&&!c.real,a=map(x,0),b=map(x,y),col=isImage?C.teal:C.gold;
    const h=Math.min(43,Math.max(isImage?31:40,Math.abs(b[1]-a[1])));
    let group='<g '+(isImage?'data-lens-image':'data-lens-object')+'="true" data-lens-world-x="'+n(x)+'">';
    if(virtual){
      group+=path([92,153],b,'stroke="'+col+'" stroke-width="1.05" stroke-dasharray="3 4" opacity=".82"')+
        teacher(74,149,43,'side-virtual',{opacity:.81})+
        text(74,185,'正立虛像',{size:14,color:col,halo:true});
    }else{
      const displayX=Math.max(37,Math.min(377,a[0])),displayY=a[1]+(isImage?h/2:-h/2);
      if(displayX!==a[0])group+=path([displayX,displayY],b,'stroke="'+col+'" stroke-width="1.05" stroke-dasharray="3 4"');
      group+=teacher(displayX,displayY,h,isImage?'side-real':'side-object',{inverted:isImage})+
        (c.explorer&&!isImage?'':isImage&&a[0]>375?
          text(displayX-18,displayY+3,'倒立實像',{size:13,color:col,halo:true,anchor:'end'}):
          text(displayX,isImage?Math.min(198,displayY+h/2+14):displayY-h/2-5,
            isImage?'倒立實像':'物體',{size:13,color:col,halo:true}));
      if(!isImage&&c.explorer)group+=
        '<rect x="'+n(displayX-17)+'" y="'+n(displayY-h/2-3)+'" width="34" height="'+n(h+5)+
        '" fill="#fff" fill-opacity="0" pointer-events="all" data-lens-object-drag="true" style="cursor:grab"/>';
    }
    group+=point(b,1.9,'fill="'+col+'" stroke="#fff8ed" stroke-width=".8" pointer-events="none"');
    return group+'</g>';
  }
  function drawSide(c){
    const img=c.atFocus?null:[c.v,c.m*HOBJ], source=[-c.u,HOBJ],eye=[29,-5.5];
    const screenMax=c.extended?220:40,rightScale=c.extended?LONG_SX:SX;
    const yScale=c.extended&&img&&img[0]>0&&img[0]<=screenMax?Math.min(SY,65/Math.max(HOBJ,Math.abs(img[1]))):SY;
    const xy=(x,y)=>[X+(x>=0?rightScale:SX)*x,Y-yScale*y];
    const imgPx=img?xy(...img):null;
    const offRuler=Boolean(img&&(img[0]<-35||img[0]>screenMax));
    const offHeight=Boolean(imgPx&&(imgPx[1]<47||imgPx[1]>200));
    const inFrame=Boolean(img&&!offRuler&&!offHeight);
    const imageBounds=c.atFocus?'focus':offRuler?'outside-distance':offHeight?'outside-height':'inside';
    function clipBack(start,end){
      const dx=end[0]-start[0],dy=end[1]-start[1];
      const side=dx<0?(xy(-35,0)[0]-start[0])/dx:1;
      const vert=dy<0?(45-start[1])/dy:dy>0?(205-start[1])/dy:1;
      const t=Math.max(0,Math.min(1,side,vert));
      return [start[0]+t*dx,start[1]+t*dy];
    }
    const onEye=c.eye&&!c.atFocus&&!c.real, eyeTargets=[[eye[0],eye[1]+1.7],[eye[0],eye[1]-1.7]];
    const screenTop=47,screenBottom=200;
    const clip='lens-trial-bench-'+(++serial);
    let light='',reaching=0,eyeHits=0,screenHits=0;
    if(c.rays){
      const bundles=onEye?
        eyeTargets.map(e=>[[0,img[1]+(e[1]-img[1])*(-img[0])/(e[0]-img[0])],e]):
        [HOBJ,0].map(h=>{
          const slope=c.atFocus?-HOBJ/c.u:(img[1]-h)/img[0];
          const boardMax=(Y-205)/yScale,boardMin=(Y-45)/yScale;
          let ex=screenMax;
          if(slope<0)ex=Math.min(ex,(boardMax-h)/slope);
          if(slope>0)ex=Math.min(ex,(boardMin-h)/slope);
          return [[0,h],[ex,h+slope*ex]];
        });
      bundles.forEach(([hit,unblocked],i)=>{
        const col=i?C.blue:C.red;
        const slope=(unblocked[1]-hit[1])/unblocked[0];
        const boardY=c.screen!==null?xy(c.screen,hit[1]+slope*c.screen)[1]:null;
        const stop=c.screen!==null&&c.screen<=unblocked[0]+1e-8&&boardY>=screenTop-1e-8&&boardY<=screenBottom+1e-8;
        const out=stop?[c.screen,hit[1]+slope*c.screen]:unblocked;
        if(stop)screenHits++;
        if(c.real&&out[0]+1e-8>=img[0])reaching++;
        if(onEye&&!stop)eyeHits++;
        const a=xy(...source),b=xy(...hit),z=xy(...out);
        const attr='stroke="'+col+'" stroke-width="2.2" fill="none" stroke-linecap="round"';
        light+=path(a,b,attr+' data-ray="incident"')+arrow(a,b,.51,col)+
          path(b,z,attr+' data-ray="transmitted" data-ray-stopped-at-screen="'+stop+'"')+arrow(b,z,.56,col);
        if(img&&!c.real)light+=path(b,clipBack(b,imgPx),attr+' opacity=".85" stroke-dasharray="5 4" data-ray="extension"');
      });
    }
    let board='',boardLabel='';
    if(c.screen!==null){
      const x=xy(c.screen,0)[0];
      board='<g data-lens-screen-x="'+n(c.screen)+'">'+
        path([x,screenTop],[x,screenBottom],'stroke="#fffdf5" stroke-width="7" opacity=".88"')+
        path([x,screenTop],[x,screenBottom],'stroke="'+(c.found?C.teal:C.slate)+'" stroke-width="1.8" data-optics-screen="true"')+
        '</g>';
      const gx=Math.min(x,400),gy=57;
      board+=path([x,gy],[gx,gy],'stroke="'+C.slate+'" stroke-width="2.1"');
      boardLabel+=
        '<g data-lens-screen-drag="true" style="cursor:ew-resize">'+
        box(n(gx-10),gy-9,20,18,6,'#e6f1f1',C.slate)+
        [gx-4,gx,gx+4].map(k=>path([k,gy-4],[k,gy+4],'stroke="'+C.slate+'" stroke-width="1.2" pointer-events="none"')).join('')+
        '<rect x="'+n(gx-16)+'" y="'+(gy-16)+'" width="32" height="32" fill="#fff" fill-opacity="0" pointer-events="all"/></g>';
      boardLabel+=text(Math.min(x,c.found?380:396),216,c.found?'光屏・清晰':'光屏',{size:12,color:c.found?C.teal:C.slate});
    }
    let eyeArt='';
    if(onEye){
      const [x,y]=xy(...eye);
      eyeArt='<g data-lens-eye="true" data-lens-eye-x="'+n(x)+'" data-lens-eye-hits="'+eyeHits+'">'+
        '<path d="M '+pos([x-22,y])+' Q '+pos([x,y-22])+' '+pos([x+22,y])+
        ' Q '+pos([x,y+22])+' '+pos([x-22,y])+' Z" fill="#ecf4f2" fill-opacity=".37" stroke="'+C.ink+'" stroke-width="1.7"/>'+
        '<ellipse cx="'+n(x)+'" cy="'+n(y)+'" rx="7" ry="8" fill="#377b79" fill-opacity=".27" stroke="'+C.ink+'" stroke-width="1.3"/>'+
        text(x,y+30,'眼睛',{size:14,halo:true})+'</g>';
    }
    const focuses=[[-Math.abs(c.f),'left'],[Math.abs(c.f),'right']];
    if(c.explorer)focuses.push([-2*Math.abs(c.f),'left-2f'],[2*Math.abs(c.f),'right-2f']);
    const focus=focuses.map(([x,k])=>{
      const p=xy(x,0),two=k.endsWith('-2f');
      return point(p,two?2.75:3.45,'fill="'+C.lav+'" stroke="#fff9ed" stroke-width="1" data-lens-focus="'+k+'"')+
        text(p[0],Y+(c.extended&&x>0&&two?31:17),two?'2F':'F',{size:13,color:C.lav,halo:true});
    }).join('');
    const intersection=inFrame&&c.rays&&(c.real?reaching===2:true)?
      point(imgPx,3.35,'fill="'+(c.real?C.red:C.teal)+'" stroke="#fff9ed" stroke-width="1.4" data-lens-crossing="'+
        (c.real?'real':'virtual')+'"'):'';
    const ghost=inFrame&&((c.real&&c.found)||(!c.real&&c.rays))?specimen(c,xy,...img,true):'';
    const caption=!c.rays?'開啟光線，看光穿過透鏡後怎麼走。':
      c.atFocus?'折射光彼此平行，有限距離內找不到清楚的像。':
      offRuler?(c.real?'像在右邊，已超出光具座可以量到的範圍。':'虛像在左邊，已超出光具座的刻度範圍。'):
      offHeight?(c.real?'倒立實像超出圖框下緣。':'正立虛像超出圖框上緣。'):
      c.real?(c.found?'實線會聚在光屏上，接到倒立實像。':c.screen!==null&&reaching<2&&screenHits?
      '光屏還在會聚前，往外移找清楚的位置。':'實線在右側會聚，光屏放在那裡才清楚。'):
      onEye&&eyeHits===2?'眼睛接到右側的光；虛線往回推，不是光路。':'實線在右側分開，左側虛線只表示反向延長。';
    const bg=benchOutline()+path([21,Y],[402,Y],'stroke="'+C.axis+'" stroke-dasharray="3 4" stroke-width="1"');
    const content='<g data-lens-case="'+(c.atFocus?'focus':c.real?'real':'virtual')+'" data-lens-zero="210" data-lens-image-bounds="'+
      imageBounds+'"'+(c.explorer?' data-lens-explorer="true"':'')+'>'+
      lensShape(c)+board+light+specimen(c,xy,...source,false)+ghost+intersection+focus+eyeArt+'</g>';
    return svg(H,labels[c.kind]+'側面示意：光從左穿過透鏡往右。'+caption,
      '<defs><clipPath id="'+clip+'"><rect x="12" y="14" width="396" height="198" rx="8"/></clipPath></defs>'+
      bg+'<g clip-path="url(#'+clip+')">'+content+'</g>'+boardLabel+ruler(xy,c,screenMax)+
      text(210,272,caption,{size:14,color:C.teal}),'side','data-lens-zero-x="'+X+
      '" data-lens-object-px-per-cm="'+SX+'" data-lens-screen-px-per-cm="'+rightScale+
      '" data-lens-vertical-px-per-unit="'+yScale+'" data-lens-screen-max="'+screenMax+'"');
  }
  function screenPreview(c){
    const state=c.screen===null?'removed':c.found?'sharp':c.real?'blur':'empty';
    const hasPortrait=state==='sharp'||state==='blur';
    const referenceHeight=54, screenWidth=174, screenHeight=121;
    const x=223,y=35, cx=x+screenWidth/2, cy=y+screenHeight/2;
    const magnitude=hasPortrait?Math.abs(c.m):null;
    const projectedHeight=hasPortrait?referenceHeight*magnitude:null;
    const projectedWidth=hasPortrait?projectedHeight*343/600:0;
    const badgeRadius=hasPortrait?Math.min(projectedHeight*.20,Math.max(3,Math.min(8,projectedHeight*.078))):0;
    const cropped=hasPortrait&&(projectedHeight>screenHeight+1e-8||projectedWidth+3.1*badgeRadius>screenWidth+1e-8);
    // Keep the ideal image size while dragging. Lateral magnification here is that
    // of the ideal image plane, and normalized defocus softens the same outline.
    const relativeDefocus=hasPortrait?Math.abs(1-c.screen/c.v):null;
    const blurRadius=hasPortrait?Math.min(6,Math.max(1.6,projectedHeight*.075)):0;
    const sigma=hasPortrait?blurRadius*(-Math.expm1(-4.8*relativeDefocus)):0;
    const filterSigma=Math.max(0,Number(sigma.toFixed(4)));
    const id='lens-projection-'+(++serial), clipId=id+'-clip', blurId=id+'-blur';
    const labels={
      removed:'光屏已移開',
      sharp:'對焦清楚：實像上下、左右都倒轉。',
      blur:'移動光屏，越接近成像位置，輪廓越清楚。',
      empty:c.atFocus?'折射光平行，光屏沒有清楚的像。':'折射光不會聚，光屏接不到虛像。'
    };
    const scale=hasPortrait?new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(magnitude):'';
    const detail=hasPortrait?(cropped?'理論倍率 ×'+scale+'；像大於光屏，只看得到一部分。':'理論倍率 ×'+scale+'（拖動時使用成像處的尺寸）'):'';
    const defs=hasPortrait?'<defs><clipPath id="'+clipId+'" clipPathUnits="userSpaceOnUse">'+
      box(x,y,screenWidth,screenHeight,10,'#fff')+'</clipPath>'+
      (filterSigma>0?'<filter id="'+blurId+'" filterUnits="userSpaceOnUse" x="'+(x-28)+'" y="'+(y-28)+
      '" width="'+(screenWidth+56)+'" height="'+(screenHeight+56)+'" color-interpolation-filters="sRGB">'+
      '<feGaussianBlur stdDeviation="'+filterSigma+'"/></filter>':'')+'</defs>':'';
    const portrait=hasPortrait?'<g clip-path="url(#'+clipId+')" data-lens-screen-aperture="true">'+
      (filterSigma>0?'<g filter="url(#'+blurId+')">':'')+
      teacher(cx,cy,projectedHeight,'projection',{inverted:true})+
      (filterSigma>0?'</g>':'')+'</g>':'';
    const body=defs+box(1,1,418,199,13,C.paper,C.outline)+'<g data-lens-projection="'+state+
      '" data-lens-reference-height="'+referenceHeight+'" data-lens-screen-cropped="'+cropped+
      '" data-lens-blur-sigma="'+filterSigma+'"'+(hasPortrait?' data-lens-projected-height="'+
        Number(projectedHeight.toFixed(6))+'" data-lens-relative-defocus="'+Number(relativeDefocus.toFixed(8))+'"':'')+'>'+
      box(14,35,176,121,11,'#f5ead6','#d6bd9b')+
      '<path d="M216 38H404L412 156H207Z" fill="#d4dfde" opacity=".56"/>'+
      box(x,y,screenWidth,screenHeight,10,'#fffefb','#7392a1')+
      text(102,24,'原物參考（正立）',{size:14})+text(cx,24,hasPortrait?'光屏上的倒立實像':'光屏',{size:14})+
      teacher(102,cy,referenceHeight,'object')+portrait+
      text(210,175,labels[state],{size:14,color:state==='sharp'?C.teal:C.sub})+
      (detail?text(210,192,detail,{size:12,color:cropped?C.gold:C.sub}):'')+'</g>';
    const desc='光屏示意。'+labels[state]+(hasPortrait?'原物紅星在左、藍點在右；倒立實像旋轉半圈，紅星到右、藍點到左。'+detail:'');
    return svg(201,desc,body,'screen');
  }
  function eyePreview(c){
    const canSee=c.eye&&!c.real&&!c.atFocus&&c.screen===null;
    const desc=canSee?'從透鏡右側看見正立虛像；紅星和藍點左右方向不變。':'沒有開啟虛像的觀察視角。';
    if(!canSee)return svg(68,desc,box(1,1,418,66,13,C.paper,C.outline)+text(210,40,desc,{size:14}),'eye');
    const x=196,y=35,width=212,height=122,cy=y+height/2,cx=x+width/2;
    const ref=54,m=Math.abs(c.m),preview=ref*m,w=preview*343/600;
    const radius=Math.min(preview*.20,Math.max(3,Math.min(8,preview*.078)));
    const cropped=preview>height+1e-8||w+3.1*radius>width+1e-8;
    const id='lens-eye-clip-'+(++serial);
    const scale=new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(m);
    const detail=cropped?'理論倍率 ×'+scale+'；像超出示意視窗，只看到一部分。':'理論倍率 ×'+scale+'；這是眼睛看到的樣子，不是透鏡表面。';
    const body='<defs><clipPath id="'+id+'" clipPathUnits="userSpaceOnUse">'+box(x,y,width,height,30,'#fff')+
      '</clipPath></defs>'+box(1,1,418,199,13,C.paper,C.outline)+'<g data-lens-reference-height="'+ref+
      '" data-lens-eye-cropped="'+cropped+'" data-lens-projected-height="'+Number(preview.toFixed(6))+'">'+
      box(12,35,175,122,12,'#eee3cf','#cfb99c')+box(x,y,width,height,30,'#deeceb','#7aa9ad')+
      '<path d="M204 64 Q302 32 398 62" fill="none" stroke="#f5fbfa" stroke-width="2.5"/>'+
      text(99,25,'原物參考（正立）',{size:14})+text(cx,25,'從透鏡右側看到的像',{size:14})+
      teacher(99,cy,ref,'object')+'<g clip-path="url(#'+id+')">'+teacher(cx,cy,preview,'virtual')+'</g>'+
      text(210,175,'正立虛像：紅星和藍點左右不變。',{size:14,color:C.sub})+
      text(210,192,detail,{size:12,color:cropped?C.gold:C.sub})+'</g>';
    return svg(201,desc+detail,body,'eye');
  }
  function draw(input={}){
    const c=normalize(input);
    return {rays:drawSide(c),screen:screenPreview(c),view:eyePreview(c)};
  }
  function toDistance(svgNode,localX,side){
    const zero=Number(svgNode?.getAttribute?.('data-lens-zero-x'))||X;
    const scale=Number(svgNode?.getAttribute?.(side==='screen'?'data-lens-screen-px-per-cm':'data-lens-object-px-per-cm'))||SX;
    return (side==='screen'?localX-zero:zero-localX)/scale;
  }
  global.LensSpecimen=Object.freeze({draw:teacher});
  global.LensDiagram=Object.freeze({draw,toDistance});
})(window);
