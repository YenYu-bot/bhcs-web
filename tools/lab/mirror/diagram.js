/* Independent front observation, side model and projection screen for mirror trial. */
(function (global) {
  'use strict';
  const W=420, IX=210, IY=124, HEIGHT=266, PALETTE={
    ink:'#29374a',sub:'#5b5961',paper:'#fff8ed',warm:'#ecdcc7',wood:'#b79b7f',
    axis:'#756c69',object:'#a85036',image:'#146a64',red:'#a14131',blue:'#2c5996',
    silver:'#5d7a89',silverStroke:'#416171',light:'#e1eff3',focus:'#6b517f'
  };
  const labels={plane:'平面鏡','convex-mirror':'凸面鏡','concave-mirror':'凹面鏡'};
  let serial=0;
  const n=x=>Math.round(x*100)/100;
  const vec=pts=>pts.map(n).join(' ');
  const path=(a,b,attrs)=>'<path d="M '+vec(a)+' L '+vec(b)+'" '+attrs+'/>';
  const txt=(x,y,val,opts={})=>'<text x="'+n(x)+'" y="'+n(y)+'" font-size="'+
    (opts.size||15)+'" font-weight="'+(opts.weight||700)+'" text-anchor="'+(opts.anchor||'middle')+
    '" fill="'+(opts.color||PALETTE.ink)+'">'+val+'</text>';
  const box=(x,y,w,h,r,fill,stroke)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+
    '" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'"':'')+'/>';
  const point=(x,y,r,fill,attr='')=>'<circle cx="'+n(x)+'" cy="'+n(y)+'" r="'+r+'" fill="'+fill+'" '+attr+'/>';
  const svg=(h,desc,body,hook)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+h+
    '" role="img" aria-label="'+desc+'" data-mirror-visual="'+hook+
    '" style="width:100%;height:auto;display:block" font-family="system-ui,sans-serif">'+body+'</svg>';
  function arrow(a,b,t,color,size=8){
    const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);
    if(L<10)return '';
    const u=dx/L,v=dy/L,x=a[0]+dx*t,y=a[1]+dy*t;
    return '<path d="M '+vec([x,y])+' L '+vec([x-size*u+size*.44*v,y-size*v-size*.44*u])+
      ' L '+vec([x-size*u-size*.44*v,y-size*v+size*.44*u])+' Z" fill="'+color+
      '" stroke="#fff9f1" stroke-width=".58" stroke-linejoin="round"/>';
  }
  const fmt=x=>String(n(x));
  function model(c){
    const kind=Object.hasOwn(labels,c.kind)?c.kind:'plane';
    const u=Number.isFinite(c.u)&&c.u>0?c.u:30;
    const fallback=kind==='convex-mirror'?-10:10;
    const f=kind==='plane'?Infinity:Number.isFinite(c.f)&&c.f!==0?c.f:
      Number.isFinite(c.v)&&c.v!==0&&Math.abs(1/u+1/c.v)>1e-10?1/(1/u+1/c.v):fallback;
    const v=c.v===Infinity||c.v===-Infinity?c.v:Number.isFinite(c.v)?c.v:
      kind==='plane'?-u:Math.abs(u-f)<1e-9?Infinity:1/(1/f-1/u);
    const m=Number.isFinite(c.m)?c.m:Number.isFinite(v)?-v/u:null;
    const candidate=typeof c.screen==='number'&&Number.isFinite(c.screen)?c.screen:null;
    const screen=candidate===0?null:candidate;
    return {kind,u,f,v,m,screen,found:Boolean(c.found)&&Number.isFinite(v)&&v>0&&screen!==null&&screen<0&&Math.abs(screen+v)<=.5000001,
      showRays:Boolean(c.showRays),finite:Number.isFinite(v)&&Number.isFinite(m),real:Number.isFinite(v)&&v>0};
  }
  function motif(x,y,scale,id,extra=''){
    // An asymmetric, high-contrast arrow flag allows reading scale and inversion; size is proportional until clipped by aperture.
    return '<g transform="translate('+n(x)+' '+n(y)+') scale('+n(scale)+')" data-mirror-specimen="'+id+'" '+extra+'>'+
      '<path d="M0 -34 L22 -10 H10 V33 H-10 V-10 H-22 Z" fill="#edaa49" stroke="#813d32" stroke-width="2.5" stroke-linejoin="round"/>'+
      '<path d="M0 -23 L11 -11 H-11Z" fill="#fff0bf"/><path d="M-10 11 H10" stroke="#a85036" stroke-width="3"/>'+
      '<circle cx="0" cy="22" r="3.6" fill="#1c746b"/></g>';
  }
  function appearance(c){
    const desc=c.finite?((c.m<0?'倒立':'正立')+'、'+(Math.abs(Math.abs(c.m)-1)<1e-8?'等大':Math.abs(c.m)>1?'放大':'縮小')):'有限距離無清楚的像';
    const look=c.real?'示意指定視角；移動光屏可驗證實像。':c.finite?
      '鏡框示意眼睛所見；像不是畫在鏡上。':'物體在焦點：反射光平行，有限距離不成像。';
    const id='mirror-aperture-'+(++serial);
    const base=c.finite?Math.min(1.10,1.86/Math.max(1,Math.abs(c.m))):1.10;
    let body=box(1,1,418,225,14,PALETTE.paper,PALETTE.wood)+
      '<defs><clipPath id="'+id+'"><rect x="207" y="42" width="190" height="145" rx="42"/></clipPath></defs>'+
      box(13,42,170,145,17,'#f1e6d3','#d1bda4')+
      path([195,48],[195,182],'stroke="#c4ae95" stroke-dasharray="4 5"')+
      '<path d="M29 162H167 M29 150H167 M29 138H167" stroke="#b6a188" opacity=".4"/>'+
      box(204,39,196,151,46,PALETTE.silver,PALETTE.silverStroke)+
      '<g clip-path="url(#'+id+')">'+box(207,42,190,145,42,'#d9e9eb')+
      '<path d="M205 151 L247 181 L397 163 V190 H205Z" fill="#c2dbdb"/>'+
      '<path d="M208 62 Q308 34 399 70 M215 79 Q267 58 321 64 M357 166 L394 151" fill="none" stroke="#f4fcfb" stroke-width="3" stroke-linecap="round" opacity=".85"/>'+
      (c.finite?motif(302,114,c.m*base,'impression'):'')+'</g>'+
      txt(98,28,'物體參考')+txt(302,28,'在鏡前看見的像')+motif(98,114,base,'object')+
      txt(210,212,look,{size:14,color:PALETTE.sub,weight:650});
    return svg(227,labels[c.kind]+'，左為物體參考，右為鏡中視野示意：'+desc+'。'+look,body,'front');
  }
  function projection(c){
    const msg=c.found?'光屏上出現清晰的倒立實像':c.screen===null?'把光屏移到鏡前或鏡後試一試':'光屏上沒有清楚的像';
    let body=box(1,1,418,156,13,PALETTE.paper,PALETTE.wood)+
      '<path d="M111 20H309L324 126H96Z" fill="#d7e0df" opacity=".55"/>'+
      box(124,13,172,109,8,'#fffefb','#7392a1')+
      '<path d="M198 125 H222 L231 133 H189 Z" fill="#7392a1"/>'+
      (c.found?motif(210,68,-Math.min(1.32,Math.abs(c.m)*1.10),'projection'):'')+
      txt(210,148,msg,{size:15,color:c.found?PALETTE.image:PALETTE.sub});
    return svg(158,'光屏示意。'+msg,body,'screen');
  }
  function side(c){
    const h=8;
    const fit=Math.min(60,Math.max(35,c.u+4,c.finite?Math.abs(c.v)+4:0,Math.abs(c.screen||0)+4,
      Number.isFinite(c.f)?Math.abs(c.f)+5:0));
    const dx=180/fit,dy=3.65;
    const XY=(x,y)=>[IX+x*dx,IY-y*dy];
    const xIm=c.finite?-c.v:null,yIm=c.finite?c.m*h:null;
    const showIm=c.finite&&Math.abs(xIm)<=fit&&Math.abs(yIm)<=20;
    const clip='mirror-side-'+(++serial);
    const line=(a,b,attrs)=>path(XY(...a),XY(...b),attrs);
    const mark=(a,b,t,color,size)=>arrow(XY(...a),XY(...b),t,color,size);
    const hasBoard=c.screen!==null&&Math.abs(c.screen)<=fit;
    let light='';
    if(c.showRays){
      const starts=c.kind==='plane'?[h*.34,h*.76]:[h,0];
      starts.forEach((at,i)=>{
        const a=[-c.u,h],b=[0,at];
        const slope=c.kind==='plane'?(h-at)/c.u:
          i===0?h/c.f:h/c.u;
        // Show the mirror's unobstructed predicted ray paths in the side model. The movable
        // screen is a positional overlay; the independent screen preview shows whether it is clear.
        const endX=-fit;
        const end=[endX,at+slope*endX], color=i?PALETTE.blue:PALETTE.red;
        const aStyle='fill="none" stroke="'+color+'" stroke-width="2.05" stroke-linecap="round"';
        light+=line(a,b,aStyle+' data-ray="incident"')+mark(a,b,.57,color,8)+
          line(b,end,aStyle+' data-ray="reflected"')+mark(b,end,.26,color,8);
        if(c.finite&&!c.real)light+=line(b,[xIm,yIm],aStyle+' stroke-dasharray="6 4" opacity=".8" data-ray="extension"');
      });
    }
    const bind=c.kind==='plane'?0:c.kind==='concave-mirror'?-14:14;
    const surface='<path d="M '+(IX+bind)+' 43 Q '+(IX-bind)+' '+IY+' '+(IX+bind)+' 205" fill="none" stroke="'+
      PALETTE.silverStroke+'" stroke-width="4.8" stroke-linecap="round"/>'+
      '<path d="M '+(IX+bind-1.5)+' 44 Q '+(IX-bind-1.5)+' '+IY+' '+(IX+bind-1.5)+' 204" fill="none" stroke="'+
      PALETTE.light+'" stroke-width="1.25" stroke-linecap="round"/>';
    let board='';
    if(hasBoard){
      const bx=XY(c.screen,0)[0];
      board=path([bx,49],[bx,201],'stroke="#fffdf8" stroke-width="6" opacity=".9"')+
        path([bx,49],[bx,201],'stroke="'+(c.found?PALETTE.image:PALETTE.silver)+'" stroke-width="1.7" stroke-dasharray="5 3" data-optics-screen="true"')+
        txt(bx,215,c.found?'光屏｜清晰':'光屏位置',{size:12,color:c.found?PALETTE.image:PALETTE.silverStroke});
    }
    let fmark='';
    if(Number.isFinite(c.f)){
      const fx=XY(-c.f,0)[0];
      fmark=point(fx,IY,3.3,PALETTE.focus,'stroke="#fff8ed" stroke-width="1"')+
        txt(fx,IY+17,'F',{size:13,color:PALETTE.focus});
    }
    const labelArrow=(x,y,col,text,side,role)=>{
      const a=[x,0],b=[x,y],end=XY(...b);
      return '<g data-mirror-side-specimen="'+role+'">'+line(a,b,'stroke="'+col+'" stroke-width="3.2" stroke-linecap="round"')+
        mark(a,b,1,col,10)+txt(end[0]+(side||0),Math.min(204,Math.max(44,end[1]+(y>0?-12:18))),text,{size:13,color:col})+'</g>';
    };
    const image=showIm&&(c.real?c.found:c.showRays)?
      labelArrow(xIm,yIm,PALETTE.image,c.real?'實像':'虛像',Math.abs(c.u+c.v)<4?31:0,'image'):'';
    const read=!c.showRays?'開啟光線，可追蹤反射後的方向。':c.real?
      (c.found?'光屏在反射光交會處，接到實像。':'依不放光屏的光路找交會點，再移動光屏。'):c.finite?
      '虛線只是往回追，不是光真的走過。':'反射光平行，移動光屏也找不到有限距離的像。';
    const caption=txt(210,253,read,{size:14,color:PALETTE.image});
    let defs='<defs><clipPath id="'+clip+'"><rect x="13" y="31" width="394" height="184" rx="10"/></clipPath></defs>';
    let bg=box(1,1,418,264,14,PALETTE.paper,PALETTE.wood)+box(13,31,394,184,10,'#f0e6d4');
    bg+='<path d="M210 31 H397 Q407 31 407 41 V205 Q407 215 397 215 H210Z" fill="#ebedf0" opacity=".85"/>'+
      path([20,IY],[400,IY],'stroke="'+PALETTE.axis+'" stroke-width="1" stroke-dasharray="3 4"')+
      txt(108,24,'鏡前 · 物體側',{size:14})+txt(312,24,'鏡後',{size:14});
    const legend=c.showRays?
      path([33,229],[59,229],'stroke="'+PALETTE.red+'" stroke-width="2"')+
      txt(65,233,'實際光路',{anchor:'start',size:12})+
      (!c.real&&c.finite?path([172,229],[198,229],'stroke="'+PALETTE.blue+'" stroke-width="2" stroke-dasharray="5 3"')+
      txt(204,233,'反向延長線',{anchor:'start',size:12}):'')+
      txt(390,233,'灰虛線：主軸',{anchor:'end',size:12}):'';
    return svg(HEIGHT,labels[c.kind]+'側視示意，左邊鏡前，右邊鏡後。'+read,defs+bg+
      '<g clip-path="url(#'+clip+')">'+surface+board+light+fmark+
      labelArrow(-c.u,h,PALETTE.object,'物體',0,'object')+image+'</g>'+legend+caption,'side');
  }
  function guidedConcave(c){
    // Keep the same ruler, optical axis, F and mirror position when changing distance.
    const H=271,Y=126,SX=4.8,SY=3.1,h=8;
    const xy=(x,y)=>[IX+SX*x,Y-SY*y], img=c.finite?[-c.v,c.m*h]:null;
    const guide=(x)=>xy(x,0)[0];
    const eye=[-29,-6], eyeEnds=[[eye[0],eye[1]+1.9],[eye[0],eye[1]-1.9]];
    const id='guided-concave-'+(++serial);
    const object=[-c.u,h];
    const stage=txt(107,24,'鏡前 · 物體側',{size:15})+txt(313,24,'鏡後',{size:15});
    let ruler=path([guide(-35),220],[guide(35),220],'stroke="#8d725e" stroke-width="1.4"');
    for(let d=-35;d<=35;d+=5){
      const labeled=d%10===0||Math.abs(d)===35;
      ruler+=path([guide(d),220],[guide(d),labeled?230:226],'stroke="#8d725e" stroke-width="1.15"');
      if(labeled)ruler+=txt(guide(d),244,Math.abs(d),{size:13,color:PALETTE.ink});
    }
    ruler+=txt(399,244,'cm',{size:11,anchor:'start',color:PALETTE.sub});
    const sym=(x,y,color,role,words)=>{
      const a=xy(x,0), b=xy(x,y), direction=y>0?-1:1;
      const nameX=role==='image'&&c.real?b[0]+10:b[0];
      const anchor=role==='image'&&c.real?'start':'middle';
      const labelY=y>0?b[1]-10:b[1]+18;
      const dashed=role==='image'&&!c.real;
      return '<g data-mirror-side-specimen="'+role+'" data-concave-world-x="'+n(x)+'">'+
        path(a,b,'stroke="'+color+'" stroke-width="'+(dashed?'2.7':'3.2')+'" stroke-linecap="round"'+(dashed?' stroke-dasharray="4 3"':''))+
        (dashed?'<path d="M '+vec([b[0]-5,b[1]-direction*8])+' L '+vec(b)+' L '+vec([b[0]+5,b[1]-direction*8])+
          '" fill="none" stroke="'+color+'" stroke-width="2.25" stroke-dasharray="3 2"/>':arrow(a,b,1,color,10))+
        '<text x="'+n(nameX)+'" y="'+n(labelY)+'" font-size="14" text-anchor="'+anchor+'" font-weight="800" fill="'+color+
        '" stroke="#fff7e9" stroke-width="2.4" paint-order="stroke">'+words+'</text></g>';
    };
    const focal=!c.finite, hasScreen=c.screen!==null&&c.screen<0;
    // A screen sits below the axis so it can receive the inverted image without
    // interrupting the incident rays from the upper object. Keep the y bounds
    // used for collision identical to the y bounds of the drawn screen.
    const screenY1=Y+1,screenY2=199;
    let light='', crossVisible=false, eyeVisible=!c.real&&!focal&&c.showRays, eyeBeamCount=0;
    if(c.showRays){
      let bundles=[];
      if(c.real||focal){
        bundles=[h,0].map(at=>{
          // At u = f, rays from the same off-axis tip emerge parallel to
          // one another, but not parallel to the main optical axis.
          const slope=focal?h/c.u:(img[1]-at)/img[0];
          const floor=(Y-202)/SY;
          const endX=slope>0?Math.max(-35,(floor-at)/slope):-35;
          return [[0,at],[endX,at+slope*endX]];
        });
      }else if(img){
        // Both rays are aimed at points in the same small pupil. Back extensions
        // meet at the virtual tip; real reflected light never travels behind the mirror.
        bundles=eyeEnds.map(p=>[[0,img[1]+(p[1]-img[1])*img[0]/(img[0]-p[0])],p]);
      }
      let canReachReal=Boolean(img)&&c.real;
      bundles.forEach(([hit,unobstructed],i)=>{
        const slope=(unobstructed[1]-hit[1])/unobstructed[0];
        const testY=hasScreen?xy(c.screen,hit[1]+slope*c.screen)[1]:null;
        const stops=hasScreen&&c.screen>=unobstructed[0]&&testY>=screenY1-1e-8&&testY<=screenY2+1e-8;
        const end=stops?[c.screen,hit[1]+slope*c.screen]:unobstructed;
        if(!stops)eyeBeamCount++;
        if(c.real&&end[0]>img[0]+1e-8)canReachReal=false;
        const col=i?PALETTE.blue:PALETTE.red;
        const style='stroke="'+col+'" stroke-width="2.25" stroke-linecap="round" fill="none"';
        const a=xy(...object),b=xy(...hit),e=xy(...end);
        light+=path(a,b,style+' data-ray="incident"')+arrow(a,b,.43,col)+
          path(b,e,style+' data-ray="reflected" data-ray-stopped-at-screen="'+stops+'"')+arrow(b,e,.58,col);
        if(!c.real&&img)light+=path(b,xy(...img),style+' stroke-dasharray="6 4" data-ray="extension"');
      });
      crossVisible=canReachReal||Boolean(img&&!c.real);
    }
    let observer='';
    if(eyeVisible){
      const [x,y]=xy(...eye);
      observer='<g data-concave-eye="true" data-eye-x="'+n(x)+'">'+
        '<path d="M '+vec([x-22,y])+' Q '+vec([x,y-22])+' '+vec([x+22,y])+
        ' Q '+vec([x,y+22])+' '+vec([x-22,y])+' Z" fill="#eff5ef" fill-opacity=".37" stroke="'+PALETTE.ink+'" stroke-width="1.6"/>'+
        '<ellipse cx="'+n(x)+'" cy="'+n(y)+'" rx="6.7" ry="8.7" fill="#377b79" fill-opacity=".24" stroke="'+PALETTE.ink+
        '" stroke-width="1.4"/>'+txt(x,y+28,'眼睛',{size:14})+'</g>';
    }
    const showPrediction=Boolean(img&&c.real&&c.showRays&&hasScreen&&!crossVisible&&Math.abs(c.u-30)<1e-8);
    const crossing=img&&crossVisible?point(...xy(...img),3.3,c.real?PALETTE.red:PALETTE.image,
      'stroke="#fffcf1" stroke-width="1.4" data-concave-crossing="'+(c.real?'real':'virtual')+'"'):
      showPrediction?point(...xy(...img),4,'#fff8eb','stroke="'+PALETTE.red+
      '" stroke-width="1.65" data-concave-prediction="true"'):'';
    const screen=hasScreen?(()=>{
      const x=guide(c.screen);
      return '<g data-concave-screen-x="'+n(c.screen)+'">'+
        path([x,screenY1],[x,screenY2],'stroke="#fffdf7" stroke-width="7" opacity=".88"')+
        path([x,screenY1],[x,screenY2],'stroke="'+(c.found?PALETTE.image:PALETTE.silverStroke)+
        '" stroke-width="2" stroke-dasharray="5 3" data-optics-screen="true"')+'</g>';
    })():'';
    const screenLabel=hasScreen?txt(guide(c.screen),213,c.found?'光屏・清晰':'光屏',
      {size:12,color:c.found?PALETTE.image:PALETTE.silverStroke}):'';
    const caption=focal?(c.showRays?'反射光彼此平行，有限距離內無清楚的像。':'開啟光線，可比較兩條反射光的方向。'):
      c.real?(c.found?'光屏在成像處，接到倒立實像。':!c.showRays?'開啟光線，可找反射光會合的位置。':
      showPrediction?'空心點：未被光屏擋住時，反射光會合的位置。':
      hasScreen&&!crossVisible?'光屏擋在會合前。試著往外移，或先移開。':'反射光在鏡前會合；把光屏放在交會處。'):
      c.showRays?(hasScreen&&eyeBeamCount<2?'反射光沒有會聚；光屏接不到虛像。':'鏡前反射光分開；鏡後只有回推的虛線。'):'開啟光線，可看出虛像的位置。';
    const mx=IX,fx=guide(-c.f);
    const device='<path d="M196 59 Q210 81 210 103 V151 Q210 170 196 193" fill="none" stroke="'+
      PALETTE.silverStroke+'" stroke-width="4.4" stroke-linecap="round"/>'+
      '<path d="M194 60 Q208 83 208 103 V151 Q208 170 194 192" fill="none" stroke="#ebf3f3" stroke-width="1.25" stroke-linecap="round"/>'+
      txt(mx+10,46,'凹面鏡',{size:13,color:PALETTE.silverStroke});
    const defs='<defs><clipPath id="'+id+'"><rect x="12" y="31" width="396" height="175" rx="9"/></clipPath></defs>';
    const background=box(1,1,418,269,14,PALETTE.paper,PALETTE.wood)+box(12,31,396,175,9,'#efe4d1')+
      '<path d="M210 31 H399 Q408 31 408 40 V197 Q408 206 399 206 H210Z" fill="#e7eff0"/>';
    const focus=point(fx,Y,3.5,PALETTE.focus,'stroke="#fffdf5" stroke-width="1.1" data-concave-focus="true"')+
      '<text x="'+n(fx)+'" y="'+(Y+17)+'" font-size="13" text-anchor="middle" font-weight="750" fill="'+PALETTE.focus+
      '" stroke="#fff7e9" stroke-width="2" paint-order="stroke">焦點 F</text>';
    const content='<g data-concave-guided="true" data-concave-case="'+(focal?'focus':c.real?'real':'virtual')+
      '" data-mirror-vertex-x="'+mx+'">'+screen+device+
      path([20,Y],[400,Y],'stroke="'+PALETTE.axis+'" stroke-width="1" stroke-dasharray="3 5"')+
      light+crossing+observer+sym(-c.u,h,PALETTE.object,'object','物體')+
      (img&&((c.real&&c.found)||(!c.real&&c.showRays))?
        sym(...img,PALETTE.image,'image',c.real?'倒立實像':'正立虛像'):'')+focus+'</g>';
    return svg(H,labels[c.kind]+'側視示意，兩次比較使用相同刻度。'+caption,defs+background+stage+
      '<g clip-path="url(#'+id+')">'+content+'</g>'+screenLabel+ruler+txt(210,262,caption,{size:14,color:PALETTE.image}),'side');
  }
  function guidedProjection(c){
    if(c.real&&c.screen!==null)return projection(c);
    const why=!c.finite?'反射光彼此平行。':c.real?'可先找反射光在鏡前的交會處。':'反射光沒有會聚。';
    const msg=!c.finite?'反射光平行，光屏接不到像':c.real?'光屏已移開':'光屏接不到虛像';
    const body=box(1,1,418,156,13,PALETTE.paper,PALETTE.wood)+
      '<path d="M111 20H309L324 126H96Z" fill="#d7e0df" opacity=".55"/>'+
      box(124,13,172,109,8,'#fffefb','#7392a1')+
      '<path d="M198 125 H222 L231 133 H189 Z" fill="#7392a1"/>'+
      txt(210,148,msg,{size:15,color:PALETTE.sub});
    return svg(158,'光屏示意。'+msg+'。'+why,body,'screen');
  }
  function draw(c){
    const cfg=model(c||{}), guided=c?.guidedConcave===true&&cfg.kind==='concave-mirror';
    return {view:appearance(cfg),rays:guided?guidedConcave(cfg):side(cfg),screen:guided?guidedProjection(cfg):projection(cfg)};
  }
  global.MirrorDiagram=Object.freeze({draw});
})(window);
