import {stereoClarity,stereoFov,stereoObservable,stereoIllumination} from './stereo-model.js?v=c92e0903f33e';
// A single upright surface image on a flat screen; two-eye stereopsis is NOT simulated.
export function makeStereoEyepiece(canvas,state){
 const ctx=canvas.getContext('2d'),layer=document.createElement('canvas'),blur=document.createElement('canvas');layer.width=layer.height=blur.width=blur.height=600;const ink=layer.getContext('2d'),soft=blur.getContext('2d');
 function surface(){
  ink.fillStyle='#E2C08F';ink.fillRect(0,0,600,600);ink.save();ink.translate(300,300);const z=state.total/20;ink.scale(z,z);ink.translate(state.stageX*1.6,-state.stageY*1.6);
  if(state.specimen==='leaf'){
   ink.beginPath();ink.moveTo(-170,35);ink.bezierCurveTo(-100,-115,75,-115,175,-45);ink.bezierCurveTo(120,100,-75,145,-170,35);ink.closePath();ink.fillStyle='#A8C77C';ink.fill();ink.strokeStyle='#486B43';ink.lineWidth=3/z;ink.stroke();
   ink.beginPath();ink.moveTo(-170,35);ink.lineTo(175,-45);ink.lineWidth=5/z;ink.stroke();
   for(let i=-3;i<=3;i++){const x=i*38,y=-x*.23;ink.beginPath();ink.moveTo(x,y);ink.lineTo(x-36,y-55);ink.moveTo(x,y);ink.lineTo(x+30,y+55);ink.lineWidth=2/z;ink.stroke();}
   // Centered upright direction marker on the model surface, not cellular anatomy.
   ink.fillStyle='#244F50';ink.beginPath();ink.moveTo(-16,-8);ink.lineTo(11,-8);ink.lineTo(11,-20);ink.lineTo(31,0);ink.lineTo(11,20);ink.lineTo(11,8);ink.lineTo(-16,8);ink.closePath();ink.fill();
  }else{
   // Procedural ridged demonstration token, NOT a real currency or microscope photo.
   ink.fillStyle='#9B7C53';ink.beginPath();ink.ellipse(7,9,170,170,0,0,Math.PI*2);ink.fill();
   ink.fillStyle='#FFD966';ink.strokeStyle='#6C5637';ink.lineWidth=3/z;ink.beginPath();ink.arc(0,0,170,0,Math.PI*2);ink.fill();ink.stroke();
   ink.beginPath();ink.arc(0,0,145,0,Math.PI*2);ink.stroke();for(let i=0;i<32;i++){const a=i*Math.PI/16;ink.beginPath();ink.moveTo(Math.cos(a)*150,Math.sin(a)*150);ink.lineTo(Math.cos(a)*165,Math.sin(a)*165);ink.lineWidth=2/z;ink.stroke();}
   ink.beginPath();ink.moveTo(-75,-15);ink.lineTo(28,-15);ink.lineTo(28,-48);ink.lineTo(83,0);ink.lineTo(28,48);ink.lineTo(28,15);ink.lineTo(-75,15);ink.closePath();ink.fillStyle='#244F50';ink.fill();
   ink.fillStyle='#FFF4DC';ink.beginPath();ink.arc(-72,-78,18,0,Math.PI*2);ink.fill();
  }
  ink.restore();
 }
 return function draw(){const css=canvas.getBoundingClientRect().width||600,backing=Math.round(css*Math.min(globalThis.devicePixelRatio||1,3));if(canvas.width!==backing||canvas.height!==backing)canvas.width=canvas.height=backing;ctx.setTransform(backing/600,0,0,backing/600,0,0);ctx.filter='none';ctx.clearRect(0,0,600,600);ctx.save();ctx.beginPath();ctx.arc(300,300,270,0,Math.PI*2);ctx.clip();
  ink.clearRect(0,0,600,600);surface();soft.clearRect(0,0,600,600);soft.filter=`blur(${(100-stereoClarity(state))/18}px)`;soft.drawImage(layer,0,0);soft.filter='none';ctx.drawImage(blur,0,0);const light=stereoIllumination(state);ctx.fillStyle=`rgba(0,0,0,${1-light.factor})`;ctx.fillRect(0,0,600,600);
  ctx.filter='none';ctx.fillStyle=light.factor<.4?'#FFF4DC':'#244F50';ctx.fillRect(220,500,540/stereoFov(state.total),4);ctx.font='18px system-ui';ctx.fillText('1 mm（模型）',220,530);ctx.restore();canvas.setAttribute('aria-label',`解剖顯微鏡正立模型示意，非照片或真實雙眼立體視覺。${state.specimen==='leaf'?'葉片表面':'刻紋示範圓片'}，總倍率${state.total}倍，視野${stereoFov(state.total)}毫米，清晰度${stereoClarity(state)}%，${light.label}。`);return{observable:stereoObservable(state),clarity:stereoClarity(state),illumination:light};};
}
