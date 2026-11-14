import { derive } from '../../motion-graphs-desk/v2/model.mjs';
import { $ } from '../shared/lab.js';

const A='Aminus', B='Uplus', MAX=4, SWITCH=2;
const val = n => Number(n.toFixed(2)).toString().replace('-','−');
const signed = n => n > 0 ? '＋'+val(n) : val(n);
const v=(id,t)=>derive(id,t).v;
const x=(id,t)=>derive(id,t).x;
const delta=(a,b)=>x(A,b)-x(A,a);
const magnitude = n=>val(Math.abs(n));
const compareSpeed = () => `第 1 秒與第 3 秒的速度是 ${signed(v(A,1))}、${signed(v(A,3))} m/s，方向相反，但速率都是 ${magnitude(v(A,1))} m/s。X–T 看切線斜率的絕對值；V–T 看離零線多遠。`;
const compareAccel = () => {
  const a=derive(A,SWITCH).a, b=derive(B,SWITCH).a;
  return `A 車在 2 秒內由 ${val(v(A,0))} 變為 ${val(v(A,SWITCH))} m/s，V–T 斜率是 ${signed(a)} m/s²，大小 ${magnitude(a)}；B 車速度不變，加速度是 ${val(b)}。加速度大小看斜率，不看圖線有多高；A 車折返前變慢、折返後變快，兩段的加速度仍相同。`;
};
const reverse = () => `第 1、2、3 秒速度依序是 ${signed(v(A,1))}、${val(v(A,2))}、${signed(v(A,3))} m/s。因為速度由正變負，才知道第 2 秒折返；X–T 同時到達最高位置。只看到一瞬間 v＝0，還不能判定折返。`;
const meet = () => `第 1 秒兩車速度同為 ${signed(v(A,1))} m/s，位置卻是 ${val(x(A,1))} 和 ${val(x(B,1))} m。第 2 秒兩車位置同為 ${val(x(A,2))} m，即使速度不同也相遇。相遇要看 X–T 在同一時間同一位置；t＝0 是一起出發，不是出發後再相遇。`;
const area = () => `上方三角形 ${signed(delta(0,SWITCH))} m、下方三角形 ${signed(delta(SWITCH,MAX))} m：底都是 ${SWITCH} 秒，高的大小都是 ${magnitude(v(A,0))} m/s，面積＝底×高÷2。帶符號相加是位移 ${val(delta(0,MAX))} m；面積大小相加是路徑長 ${val(derive(A,MAX).path)} m。`;
const topics=[
  {name:'速率',title:'往左的車一定比較慢嗎？',prompt:'先看第 1 秒，再看第 3 秒。比較兩張圖的斜率和高度。',action:'標出兩秒的斜率與速度',start:1,end:3,explain:compareSpeed},
  {name:'加速度',title:'哪輛車的速度每秒改變得多？',prompt:'看 0～2 秒的速度變化，不要只看哪條線在上面。',action:'畫出 Δv 和 Δt',start:0,end:2,two:true,explain:compareAccel},
  {name:'折返',title:'速度等於零，就一定折返嗎？',prompt:'把游標移過第 2 秒，比較前後的速度符號。',action:'標出變號與折返點',start:1,end:2,explain:reverse},
  {name:'相遇',title:'兩條線交會，就代表兩車相遇？',prompt:'試看第 1 秒與第 2 秒：兩車是同速，還是同位置？',action:'標出兩車真正相遇的位置',start:1,end:2,two:true,explain:meet},
  {name:'面積',title:'圖上的兩塊面積，該相加還是相減？',prompt:'看 V–T 的零線：把時間拖到折返前後，比較兩塊區域。',action:'上色：正位移／負位移',start:2,end:4,explain:area}
];
let active=0, t=topics[0].start, revealed=false;
const SVG='http://www.w3.org/2000/svg', colorA='#225A95',colorB='#A24B24',colorCursor='#B53227';
const e=(tag,attr={},text)=>{const n=document.createElementNS(SVG,tag);for(const[k,v]of Object.entries(attr))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
const line=(x1,y1,x2,y2,style={})=>e('line',{x1,y1,x2,y2,...style});
const mark=(cx,cy,fill,r=5)=>e('circle',{cx,cy,r,fill,stroke:'#fff','stroke-width':2});
const txt=(x,y,s,attr={})=>e('text',{x,y,fill:'#344861','font-size':13,'font-weight':700,...attr},s);
const X=t=>41+t*70;
const guideSlider=$('#guide-slider'), dialog=$('#guide-dialog');
const tabs=topics.map((p,i)=>{
  const b=document.createElement('button');b.type='button';b.textContent=p.name;
  b.addEventListener('click',()=>select(i));return b;
});
$('#guide-tabs').append(...tabs);
function select(i){active=i;t=topics[i].start;revealed=false;render();}
function setTime(next){t=Math.max(0,Math.min(MAX,next));render();}
function track(){
  const svg=$('#guide-track'), scale=x=>35+x*40;
  const nodes=[e('rect',{x:14,y:12,width:412,height:49,rx:12,fill:'#E7DECD'}),line(scale(0),44,scale(9),44,{stroke:'#52647D','stroke-width':2})];
  for(let i=0;i<=9;i++)nodes.push(line(scale(i),43,scale(i),51,{stroke:'#52647D'}),txt(scale(i),68,i===9?'9 m':i,{'text-anchor':'middle','font-size':11}));
  const cars=topics[active].two?[[A,'A',23,colorA],[B,'B',40,colorB]]:[[A,'A',34,colorA]];
  for(const [id,label,y,color]of cars){
    const g=e('g',{transform:`translate(${scale(x(id,t))},${y})`});
    g.append(e('rect',{x:-13,y:-9,width:26,height:18,rx:5,fill:color,stroke:'#fff','stroke-width':1.5}),txt(0,4,label,{fill:'#fff','text-anchor':'middle','font-size':11}));nodes.push(g);
  }
  svg.replaceChildren(...nodes);
  svg.setAttribute('aria-label',`第 ${val(t)} 秒，A 車在 ${val(x(A,t))} 公尺${topics[active].two?'，B 車在 '+val(x(B,t))+' 公尺':''}`);
}
function chart(svg,speed){
  const p=topics[active], ymin=speed?-4:0,ymax=speed?4:p.two?10:6;
  const y=v=>139-((v-ymin)/(ymax-ymin))*108;
  const get=speed?v:x;
  const axis={stroke:'#647A91','stroke-width':1.5};
  const nodes=[txt(8,18,speed?'v (m/s)':'x (m)'),txt(339,169,'t (秒)',{'text-anchor':'end'})];
  for(let n=0;n<=MAX;n++)nodes.push(line(X(n),29,X(n),139,{stroke:'#E2EAF2'}),txt(X(n),157,n,{'text-anchor':'middle'}));
  const step=ymax===10?2:1;
  for(let n=ymin;n<=ymax;n+=step)nodes.push(line(X(0),y(n),X(MAX),y(n),{stroke:'#DDE7EF'}),txt(34,y(n)+4,val(n),{'text-anchor':'end','font-size':12}));
  nodes.push(line(X(0),27,X(0),139,axis),line(X(0),y(0),X(MAX),y(0),axis));
  const polygon=(pts,fill)=>e('polygon',{points:pts.map(([a,b])=>`${X(a)},${y(b)}`).join(' '),fill});
  if(revealed&&active===4&&speed){
    nodes.push(polygon([[0,0],[0,v(A,0)],[SWITCH,0]],'#98D2B1'),polygon([[SWITCH,0],[MAX,v(A,MAX)],[MAX,0]],'#F2B6A5'));
    nodes.push(txt(X(.65),y(1.6),signed(delta(0,SWITCH))+' m',{fill:'#154C36'}),txt(X(3.04),y(-2.35),signed(delta(SWITCH,MAX))+' m',{fill:'#7A251B'}));
  }
  for(const [id,color,dash] of [[A,colorA,null],...(p.two?[[B,colorB,'7 4']]:[])]){
    const points=Array.from({length:41},(_,i)=>i/10).map(t=>`${X(t)},${y(get(id,t))}`).join(' ');
    const style={points,fill:'none',stroke:color,'stroke-width':3.2,'stroke-linecap':'round'};if(dash)style['stroke-dasharray']=dash;
    nodes.push(e('polyline',style));
  }
  if(revealed&&active===0){
    for(const tt of [1,3]){
      const f=get(A,tt);
      if(!speed){const slope=v(A,tt), d=.48;nodes.push(line(X(tt-d),y(f-d*slope),X(tt+d),y(f+d*slope),{stroke:colorCursor,'stroke-width':2.4,'stroke-dasharray':'4 3'}));}
      else nodes.push(line(X(tt),y(0),X(tt),y(f),{stroke:colorCursor,'stroke-width':2.4,'stroke-dasharray':'3 2'}));
      nodes.push(mark(X(tt),y(f),colorCursor,4));
    }
  }
  if(revealed&&active===1&&speed){
    const v1=v(A,0),v2=v(A,SWITCH);
    nodes.push(line(X(0),y(v1),X(SWITCH),y(v1),{stroke:colorCursor,'stroke-width':2,'stroke-dasharray':'4 3'}),line(X(SWITCH),y(v1),X(SWITCH),y(v2),{stroke:colorCursor,'stroke-width':2,'stroke-dasharray':'4 3'}),txt(X(.62),y(v1)-4,'Δt',{fill:colorCursor}),txt(X(SWITCH)+5,y((v1+v2)/2)+3,'Δv',{fill:colorCursor}));
  }
  if(revealed&&active===2){
    nodes.push(mark(X(SWITCH),y(get(A,SWITCH)),colorCursor,7));
    if(speed)for(const tt of [1,3])nodes.push(mark(X(tt),y(v(A,tt)),colorCursor,4.5),txt(X(tt)+7,y(v(A,tt))-7,signed(v(A,tt)),{fill:colorCursor}));
  }
  if(revealed&&active===3){
    const same=speed?1:SWITCH;nodes.push(e('circle',{cx:X(same),cy:y(get(A,same)),r:9,fill:'none',stroke:colorCursor,'stroke-width':2}));
    nodes.push(txt(X(same)+10,y(get(A,same))-7,speed?'同速':'相遇',{fill:colorCursor}));
  }
  nodes.push(line(X(t),29,X(t),139,{stroke:colorCursor,'stroke-width':1.5,'stroke-dasharray':'3 3'}),mark(X(t),y(get(A,t)),colorA));
  if(p.two){const other=get(B,t), same=other===get(A,t);nodes.push(same?e('circle',{cx:X(t),cy:y(other),r:5,fill:'none',stroke:colorB,'stroke-width':2,'stroke-dasharray':'2 2'}):mark(X(t),y(other),colorB));}
  svg.replaceChildren(...nodes);
}
function render(){
  const p=topics[active], a=derive(A,t), b=derive(B,t);
  tabs.forEach((tab,i)=>tab.setAttribute('aria-pressed',String(active===i)));
  $('#guide-question').textContent=p.title;$('#guide-prompt').textContent=p.prompt;$('#guide-key-b').hidden=!p.two;
  $('#guide-time').textContent=val(t)+' 秒';guideSlider.value=t;guideSlider.setAttribute('aria-valuetext',val(t)+' 秒');
  $('#guide-prev').disabled=t<=0;$('#guide-next').disabled=t>=MAX;
  const readout=(n,l)=>`${l} 車：位置 ${val(n.x)} m · 速度 ${signed(n.v)} m/s`;
  $('#guide-readout').textContent=p.two?[readout(a,'A'),readout(b,'B')].join('\n'):readout(a,'A');
  $('#guide-action').textContent=revealed?'收起標記':p.action;
  $('#guide-action').setAttribute('aria-expanded',String(revealed));
  const insight=$('#guide-insight');insight.hidden=!revealed;
  if(revealed){const s=p.explain();if(insight.textContent!==s)insight.textContent=s;}
  track();chart($('#guide-x'),false);chart($('#guide-v'),true);
}
function open(){ if(!dialog.open){render();dialog.showModal();}}
$('#open-guide').addEventListener('click',open);
$('#finish-guide').addEventListener('click',()=>{$('#finish-dialog').close();open();});
guideSlider.addEventListener('input',()=>setTime(Number(guideSlider.value)));
$('#guide-prev').addEventListener('click',()=>setTime(t-1));$('#guide-next').addEventListener('click',()=>setTime(t+1));
$('#guide-action').addEventListener('click',()=>{revealed=!revealed;if(revealed)t=topics[active].end;render();});
