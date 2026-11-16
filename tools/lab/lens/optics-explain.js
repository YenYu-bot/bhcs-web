/* Three optional teaching frames. Timelines/controls live in app.js. */
(function (global) {
  'use strict';
  const W=420,H=245,ink='#273648',teal='#176460',navy='#315b91',red='#a14234',gold='#955121';
  const round=x=>Math.round(x*100)/100,pos=p=>p.map(round).join(' ');
  const line=(p,q,a)=>'<path d="M '+pos(p)+' L '+pos(q)+'" '+(a.includes('data-explain-ray=')?'pathLength="1" ':'')+a+'/>';
  const text=(x,y,t,size=14,color=ink,anchor='middle')=>'<text x="'+round(x)+'" y="'+round(y)+
    '" text-anchor="'+anchor+'" font-size="'+size+'" font-weight="760" fill="'+color+'">'+t+'</text>';
  function dot([x,y],r,color,attrs=''){
    return '<circle cx="'+round(x)+'" cy="'+round(y)+'" r="'+r+'" fill="'+color+'" '+attrs+'/>';
  }
  function dir(a,b,at,color){
    const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);
    if(l<10)return '';
    const ux=dx/l,uy=dy/l,x=a[0]+dx*at,y=a[1]+dy*at;
    return '<path d="M '+pos([x,y])+' L '+pos([x-8*ux+3.4*uy,y-8*uy-3.4*ux])+' L '+
      pos([x-8*ux-3.4*uy,y-8*uy+3.4*ux])+' Z" fill="'+color+'" stroke="#fff9ee" stroke-width=".56"/>';
  }
  const bench='<rect x="1" y="1" width="418" height="243" rx="14" fill="#fff8eb" stroke="#c6ab88"/>'+
    '<rect x="12" y="13" width="396" height="196" rx="11" fill="#eee2ce"/>'+
    line([20,118],[400,118],'stroke="#8a766d" stroke-opacity=".53" stroke-width="1" stroke-dasharray="4 5"');
  const svg=(desc,body,frame,stage)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+
    '" role="img" aria-label="'+desc+'" data-lens-explainer-svg="'+frame+'" data-lens-explainer-stage="'+stage+
    '" style="display:block;width:100%;height:auto" font-family="system-ui,sans-serif">'+bench+body+'</svg>';
  function normalized(x,y){
    const l=Math.hypot(x,y);return [x/l,y/l];
  }
  function snell(d,N,from,to){
    const theta=Math.atan2(N[0]*d[1]-N[1]*d[0],N[0]*d[0]+N[1]*d[1]);
    const beta=Math.asin(from/to*Math.sin(theta)),c=Math.cos(beta),s=Math.sin(beta);
    return [N[0]*c-N[1]*s,N[0]*s+N[1]*c];
  }
  function refraction(){
    // The glass is the intersection of two circles. Use exact surface normals and Snell
    // at both interfaces; this frame deliberately shows a thick, exaggerated outline.
    const X=210,Y=118,R=101,dx=58,front=X+dx,back=X-dx;
    const h=Math.sqrt(R*R-dx*dx), source=[30,80], first=[front-Math.sqrt(R*R-(source[1]-Y)**2),source[1]];
    const N1=normalized(front-first[0],Y-first[1]), D1=snell([1,0],N1,1,1.52);
    const f=[first[0]-back,first[1]-Y],dot1=f[0]*D1[0]+f[1]*D1[1];
    const travel=-dot1+Math.sqrt(dot1*dot1-f[0]*f[0]-f[1]*f[1]+R*R);
    const second=[first[0]+travel*D1[0],first[1]+travel*D1[1]];
    const N2=normalized(second[0]-back,second[1]-Y),D2=snell(D1,N2,1.52,1);
    const end=[390,second[1]+(390-second[0])*D2[1]/D2[0]];
    const norm=(p,v)=>line([p[0]-23*v[0],p[1]-23*v[1]],[p[0]+23*v[0],p[1]+23*v[1]],
      'stroke="#567782" stroke-width="1" stroke-dasharray="3 3"');
    const body='<path d="M '+pos([X,Y-h])+' A '+R+' '+R+' 0 0 1 '+pos([X,Y+h])+' A '+R+
      ' '+R+' 0 0 1 '+pos([X,Y-h])+' Z" fill="#acd8d9" fill-opacity=".79" stroke="#396f78" stroke-width="1.7"/>'+
      text(210,58,'玻璃',15,teal)+text(59,43,'空氣',14)+text(359,43,'空氣',14)+
      norm(first,N1)+norm(second,N2)+
      [[source,first,'incoming'],[first,second,'in-glass'],[second,end,'outgoing']].map(([p,q,k])=>
        line(p,q,'stroke="'+red+'" stroke-width="2.5" stroke-linecap="round" data-explain-ray="'+k+'"')+dir(p,q,.65,red)).join('')+
      dot(first,3.1,red,'stroke="#fff8eb" stroke-width="1" data-refraction-surface="entry"')+
      dot(second,3.1,red,'stroke="#fff8eb" stroke-width="1" data-refraction-surface="exit"')+
      line([112,146],[first[0]-2,first[1]+6],'stroke="#70574f" stroke-width="1.07"')+
      line([295,145],[second[0]+2,second[1]+7],'stroke="#70574f" stroke-width="1.07"')+
      text(89,168,'① 進入玻璃',15)+text(317,168,'② 離開玻璃',15)+
      text(210,231,'凸透鏡的輪廓與角度是放大示意。',14,teal);
    return svg('同一道光先在空氣進入玻璃時折射，再在離開玻璃時折射。此圖刻意放大透鏡厚度與轉折，不是薄透鏡光線圖。',body,0,0);
  }
  function imageSteps(frame,stage){
    const X=202,axis=118,objX=57,screen=341,ratio=(screen-X)/(X-objX);
    const points=[['tip',58,red],['mid',88,navy],['base',118,teal]];
    const stageNum=frame===1?0:stage;
    const glass='<path d="M202 34 Q228 117 202 202 Q176 117 202 34Z" fill="#abd9d9" fill-opacity=".76" stroke="#386e77" stroke-width="1.7"/>'+
      text(202,32,'凸透鏡',13,teal);
    const projection=line([screen,40],[screen,200],'stroke="#fffdf5" stroke-width="7"')+
      line([screen,40],[screen,200],'stroke="#426880" stroke-width="1.5" data-explain-screen="true"')+
      text(screen,32,'光屏',14);
    const object=global.LensSpecimen?.draw(objX,77,82,'lesson-object')||'';
    let body=glass+projection+object+text(objX,29,'物體',14,gold);
    points.slice(0,Math.min(3,stageNum+1)).forEach(([key,sourceY,color])=>{
      const a=[objX,sourceY],q=[screen,axis+(axis-sourceY)*ratio];
      const anchors=key==='base'?[axis-19,axis+17]:[sourceY,axis];
      body+='<g data-explain-object-point="'+key+'" data-explain-image-y="'+round(q[1])+'">';
      anchors.forEach((y,i)=>{
        const b=[X,y],col=key==='tip'?(i?navy:red):color;
        const attrs='stroke="'+col+'" stroke-width="'+(key==='tip'?2.15:1.65)+'" opacity="'+(stageNum===3?'.31':key==='tip'?'.86':'.67')+
          '" fill="none" stroke-linecap="round"';
        body+=line(a,b,attrs+' data-explain-ray="incident"')+dir(a,b,.61,col)+
          line(b,q,attrs+' data-explain-ray="transmitted"')+dir(b,q,.55,col);
      });
      body+=dot(a,3.2,color,'stroke="#fff9ee" stroke-width=".8"')+
        dot(q,3.7,color,'stroke="#fff9ee" stroke-width="1.1" data-explain-screen-point="'+key+'"')+'</g>';
    });
    if(frame===2&&stageNum===3){
      const top=axis+(axis-points[0][1])*ratio;
      const image=global.LensSpecimen?.draw(screen,(axis+top)/2,top-axis,'lesson-projection',{inverted:true})||'';
      body+='<g data-explain-assembled="true">'+image+text(screen,195,'倒立實像',14,teal)+'</g>';
    }
    const caption=frame===1?'物體的同一個標記，對應光屏的同一個像點。':
      ['先看上方標記：光線在光屏下方會合。','再看中段：光線在靠近主軸的位置會合。',
        '最後看底部標記：這個像點落在主軸上。','對應所有標記，就看出倒立實像。'][stageNum];
    return svg(caption,body+text(210,231,caption,14,teal),frame,stage);
  }
  function draw(c={}){
    const frame=[0,1,2].includes(c.frame)?c.frame:0;
    const stage=Number.isInteger(c.stage)?Math.max(0,Math.min(3,c.stage)):0;
    return frame===0?refraction():imageSteps(frame,stage);
  }
  global.LensExplainer=Object.freeze({draw});
})(window);
