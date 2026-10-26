// Canonical slide controls, not a perspective-plane physical calibration.
// 60% of scene CSS width (after the deadzone) spans the full 540-unit range at4×.
// Screen right moves slide +X; screen down moves slide -Y. Optics remain unchanged.
import {withoutJitter} from './pointer.js?v=a94c29ca420d';
export function compoundSlideDelta(dx,dy,width,objective){
 if(!Number.isFinite(width)||width<=0||![4,10,40].includes(objective))return{x:0,y:0};
 const gain=540/(.6*width)*4/objective;
 return{x:withoutJitter(dx)*gain,y:-withoutJitter(dy)*gain};
}
