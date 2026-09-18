// Sizes below are explicit teaching-model settings, not measurements of a slide.
export const MICRO_FIELD_PX=540;
export const MICRO_UM_TO_WORLD=MICRO_FIELD_PX/4500;
export const MICRO_SIZES={onion:{w:260,h:85},elodea:{w:90,h:45},cheek:{w:125,h:110}};
export function microHash(row,col,salt=0){let v=Math.imul(row+17011,374761393)^Math.imul(col+8107,668265263)^Math.imul(salt+1,1274126177);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296;}
export function microCell(kind,row,col){
 const rnd=s=>microHash(row,col,s),{w,h}=MICRO_SIZES[kind];
 if(kind==='cheek'){
  if(rnd(0)<.28)return null;
  const x=col*w+(rnd(1)-.5)*w*.85,y=row*h+(rnd(2)-.5)*h*.85,rx=23+rnd(3)*12,ry=18+rnd(4)*10,angle=rnd(5)*Math.PI;
  const points=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,rad=1+.07*Math.sin(3*a+rnd(6)*6)+.05*Math.cos(5*a);return{x:x+rad*(rx*Math.cos(a)*Math.cos(angle)-ry*Math.sin(a)*Math.sin(angle)),y:y+rad*(rx*Math.cos(a)*Math.sin(angle)+ry*Math.sin(a)*Math.cos(angle))}});
  return {kind,row,col,points,nucleus:{x:x+(rnd(7)-.5)*8,y:y+(rnd(8)-.5)*7,rx:4+rnd(9),ry:3.4+rnd(10),angle},organelles:[],tone:rnd(11)};
 }
 const rowY=r=>r*h+(microHash(r,0,40)-.5)*h*.22;
 const edge=c=>c*w+(microHash(row,c,41)-.5)*w*.30+(microHash(row,0,42)-.5)*w*.75;
 const bend=c=>(microHash(row,c,43)-.5)*w*.07;
 const y0=rowY(row),y1=rowY(row+1),left=edge(col),right=edge(col+1);
 const points=[{x:left,y:y0},{x:right,y:y0},{x:right+bend(col+1),y:y1},{x:left+bend(col),y:y1}];
 const at=(u,v)=>({x:(1-v)*(left+(right-left)*u)+v*(left+bend(col)+(right+bend(col+1)-left-bend(col))*u),y:y0+(y1-y0)*v});
 const organelles=[];
 if(kind==='elodea'){
  const count=18+Math.floor(rnd(50)*15);
  for(let k=0;k<count;k++){
   // Most lie in peripheral cytoplasm; some project over the cell face.
   let u=.1+.8*rnd(70+k*5),v=.14+.72*rnd(71+k*5);
   if(k%5!==0){const side=Math.floor(rnd(72+k*5)*4);if(side===0)u=.065+.04*rnd(73+k*5);if(side===1)u=.895+.04*rnd(73+k*5);if(side===2)v=.12+.05*rnd(73+k*5);if(side===3)v=.83+.05*rnd(73+k*5);}
   const p=at(u,v);organelles.push({...p,rx:2.5+rnd(74+k*5),ry:1.5+rnd(75+k*5)*.6,angle:rnd(76+k*5)*Math.PI,tone:rnd(77+k*5)});
  }
 }
 const n=at(.13+.12*rnd(9),.25+.5*rnd(10));
 return {kind,row,col,points,nucleus:kind==='onion'?{...n,rx:6,ry:4.5,angle:rnd(11)}:null,organelles,tone:rnd(12)};
}
export function microScale(obj){const value=obj===4?1:obj===10?.5:.1;return{value,label:obj===4?'1 mm':obj===10?'500 µm':'100 µm',pixels:value/(18/obj)*MICRO_FIELD_PX,x:220,y:500,labelY:527};}
