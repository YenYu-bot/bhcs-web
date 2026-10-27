// A held pointer is one interaction. Stop on release, cancellation, lost capture,
// window blur or document hiding. Click is the keyboard/assistive fallback only.
export function createHold({step,setTimer=setTimeout,clearTimer=clearTimeout,delay=420}){
 let active=false,timer=null,suppress=false;
 const tick=()=>{if(!active)return;step();if(active)timer=setTimer(tick,delay)};
 return {start(){if(active)return;active=true;suppress=true;step();if(active)timer=setTimer(tick,delay)},stop(){active=false;if(timer!==null)clearTimer(timer);timer=null},click(){if(suppress){suppress=false;return}step()},clearSuppression(){suppress=false},get active(){return active}};
}
