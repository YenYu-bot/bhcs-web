// Pointer ergonomics only: CSS-pixel filtering, no change to optical-model units.
export const POINTER=Object.freeze({deadzone:6,coarsePixels:48,finePixels:20,slideGain:.45});
export const withoutJitter=value=>Math.sign(value)*Math.max(0,Math.abs(value)-POINTER.deadzone);
export const focusDelta=(key,dy)=>-withoutJitter(dy)/(key==='coarse'?POINTER.coarsePixels:POINTER.finePixels);
export function slidePixels(dx,dy){const length=Math.hypot(dx,dy),gain=length<=POINTER.deadzone?0:1-POINTER.deadzone/length;return{x:dx*gain,y:dy*gain};}
export const slideGain=objective=>POINTER.slideGain*4/objective;
