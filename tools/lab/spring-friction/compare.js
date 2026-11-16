/* Diagrams for controlled comparisons, using illustrative model dimensions. */
(() => {
  'use strict';
  const C = {ink:'#23324c', paper:'#fffdf8', sand:'#faebd6', board:'#f5c590',
    wood:'#e9a56f', edge:'#c87a49', top:'#ffcf9b', teal:'#146b64',
    soft:'#e6f4eb', rust:'#a13b33', grey:'#465771', steel:'#c6dbe6'};
  const rect=(x,y,w,h,fill,rx=0,stroke='none',sw=1)=>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const line=(x1,y1,x2,y2,color,w=1,ext='')=>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" ${ext}/>`;
  const txt=(x,y,value,ext='')=>`<text x="${x}" y="${y}" ${ext}>${value}</text>`;
  const atMid='text-anchor="middle"';
  const bold='font-weight="750"';
  const path=(d,fill)=>`<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="2.3" stroke-linejoin="round"/>`;
  const tip=(d,fill)=>`<path d="${d}" fill="${fill}"/>`;
  const fmt=v=>String(Math.round(v*100)/100);

  function diagram(kind,variant,pulling=false){
    const area=kind==='area';
    const alt=variant===1||variant==='1';
    const load=!area&&alt;
    const narrow=area&&alt;
    const mass=load?4:2, normal=mass*9.8, threshold=normal*.3;
    const footprint=narrow?30:60;
    const floor=142, mid=125, w=narrow?54:108, h=narrow?80:40;
    const x=mid-w/2, y=floor-h, rise=10, depth=12, front=x+w;
    const endY=floor-(load?66:33);
    const pullX=front+depth+7, pullLength=load?60:30, pullY=y+h/2+1;
    const sliding=pulling==='slide';
    const measured=pulling===true||sliding;
    const label=area?(narrow?'窄面朝下':'寬面朝下'):(load?'加上 2 kg 砝碼':'只放木塊');
    const detail=sliding?'拉力 6 N｜滑動中，摩擦力 3.92 N':measured?`臨界拉力 ${fmt(threshold)} N`:'逐步增加拉力，找出臨界';
    const body=[
      rect(1,1,418,218,C.paper,18,'#e8d7c5',2),
      rect(18,18,384,168,C.sand,15),
      rect(25,floor,370,23,C.board,6,C.ink,2.4),
      line(28,floor+6,392,floor+6,'#fff6dc',2),
      line(36,floor+15,73,floor+15,'#c98152',2),
      line(205,floor+14,277,floor+14,'#c98152',2),
      sliding?'<g class="sf-area-slide">':'<g>',
      path(`M${x} ${y} l${depth} -${rise} h${w} l-${depth} ${rise} Z`,C.top),
      path(`M${front} ${y} l${depth} -${rise} v${h} l-${depth} ${rise} Z`,C.edge),
      rect(x,y,w,h,C.wood,3,C.ink,2.4),
      txt(mid,y+h/2+5,'2 kg',`${atMid} ${bold}`),
      load ? [
        rect(mid-19,y-rise-31,51,29,C.steel,5,C.ink,2.3),
        txt(mid+6,y-rise-12,'+2 kg',`${atMid} ${bold} font-size="13"`),
      ].join(''):'',
      line(x,floor,front,floor,C.teal,4),
      area?txt(mid,floor+26,`${footprint} cm²`,`${atMid} ${bold} fill="${C.teal}"`):'',
      measured?[
        line(pullX,pullY,pullX+pullLength,pullY,C.rust,3),
        tip(`M${pullX+pullLength+1} ${pullY}l-10 -6v12Z`,C.rust),
        line(x-5,pullY,x-5-(sliding?20:pullLength),pullY,C.teal,3),
        tip(`M${x-6-(sliding?20:pullLength)} ${pullY}l10 -6v12Z`,C.teal),
      ].join(''):'',
      '</g>',
      // Upward normal arrow offset from apparatus for legibility; dashed line ties it to support.
      line(front+depth+6,floor,319,floor,C.teal,1.2,'stroke-dasharray="4 4" opacity=".55"'),
      line(322,floor,322,endY,C.teal,4,'data-normal-arrow=""'),
      tip(`M322 ${endY-3}l-7 12h14Z`,C.teal),
      txt(323,42,`正向力 ${fmt(normal)} N`,`${atMid} ${bold} font-size="15" fill="${C.teal}"`),
      txt(30,44,label,`${bold} font-size="16"`),
      rect(22,189,376,23,C.soft,11),
      txt(210,206,detail,`${atMid} ${bold} fill="${measured?C.rust:C.grey}" font-size="15"`),
    ].join('');
    return `<svg class="sf-diagram sf-compare" xmlns="http://www.w3.org/2000/svg" width="420" height="220" viewBox="0 0 420 220" role="img" aria-label="${label}，總質量 ${mass} 公斤，接觸面積 ${footprint} 平方公分，正向力 ${fmt(normal)} 牛頓。${detail}" style="display:block;width:100%;height:auto;font-family:system-ui,'Noto Sans TC',sans-serif;fill:${C.ink};font-size:16px">${body}</svg>`;
  }

  window.SpringCompare=Object.freeze({diagram});
})();
