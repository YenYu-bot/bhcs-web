/** Foreground elapsed-time clock. Hidden/blur/long gap always require explicit play.
 * onAdvance(seconds,'play') may return false to stop. step/jump are explicit UI
 * operations through engine, not this wall clock. A generation fences stale RAFs.
 */
export function createClock({onAdvance,onPause=()=>{},requestFrame=cb=>requestAnimationFrame(cb),cancelFrame=id=>cancelAnimationFrame(id),now=()=>performance.now(),maxGapMs=1000}={}){
 if(typeof onAdvance!=='function')throw Error('onAdvance required');
 let playing=false,speed=2,last=0,handle=null,generation=0,disposed=false,visible=true;
 function pause(reason='pause'){playing=false;generation++;if(handle!==null)cancelFrame(handle);handle=null;last=0;onPause(reason);}
 function schedule(g){handle=requestFrame(t=>{if(!playing||g!==generation||disposed)return;handle=null;const elapsed=t-last;if(!Number.isFinite(elapsed)||elapsed<0||elapsed>maxGapMs){pause('long-gap');return;}last=t;if(elapsed>0&&onAdvance(elapsed/1000*speed,'play')===false){pause('finished');return;}if(playing&&g===generation)schedule(g);});}
 return {get playing(){return playing;},get speed(){return speed;},play(){if(disposed||playing||!visible)return;playing=true;last=now();schedule(++generation);},pause,setSpeed(value){if(value!==1&&value!==2)throw Error('只支援 1× 或 2×');if(playing){pause('speed-change');speed=value;this.play();}else speed=value;},setVisible(value){visible=!!value;if(!visible)pause('hidden');},blur(){pause('blur');},dispose(){pause('dispose');disposed=true;}};
}
