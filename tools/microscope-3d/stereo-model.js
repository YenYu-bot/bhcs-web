// Declared teaching model, not universal instrument calibration or stereopsis.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const stereoInitial=()=>({instrument:'stereo',total:20,focus:-2,stageX:0,stageY:0,lamp:75,specimen:'token'});
export const stereoClarity=s=>Math.max(0,Math.round(100-Math.abs(s.focus)*20));
export const stereoFov=total=>20/(total/10); // FN20 / objective2× or4× =>10 or5mm.
export function stereoSetPower(s,total){if(![20,40].includes(total))return false;s.total=total;return true;}
export function stereoFocus(s,value){if(!Number.isFinite(value))return false;s.focus=Math.round(clamp(value,-5,5));return true;}
export function stereoMove(s,x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return false;s.stageX=clamp(x,-270,270);s.stageY=clamp(y,-270,270);return true;}
export function stereoSetLamp(s,value){if(!Number.isFinite(value))return false;s.lamp=Math.round(clamp(value,0,100));return true;}
export const stereoPoint=(x,y,s)=>({x:300+s.total/20*(x+s.stageX*1.6),y:300+s.total/20*(y-s.stageY*1.6)});
// Arrow center/token and central leaf vein are the tracked actual drawing references.
export function stereoObservable(s){const p=stereoPoint(0,0,s);return ['token','leaf'].includes(s.specimen)&&[20,40].includes(s.total)&&Math.hypot(p.x-300,p.y-300)<=210&&stereoClarity(s)>=80&&s.lamp>=25;}
export function stereoIllumination(s){return {factor:clamp(s.lamp/100,0,1),ready:s.lamp>=25,label:s.lamp===0?'照明關閉':s.lamp<25?'照明偏暗':'照明適合'};}
