/** Foreground observation clock. The first frame anchors time; long gaps pause, never catch up. */
export class Clock {
 constructor({now=()=>performance.now(),requestFrame=cb=>requestAnimationFrame(cb),cancelFrame=id=>cancelAnimationFrame(id),onFrame=()=>{},onTarget=()=>{},onPause=()=>{}}={}){
  this.now=now;this.requestFrame=requestFrame;this.cancelFrame=cancelFrame;this.onFrame=onFrame;this.onTarget=onTarget;this.onPause=onPause;this.generation=0;this.running=false;this.handle=null;this.anchor=null;this.t=0;this.token=null;
 }
 play(token){
  if(this.running)return false;
  if(!token||!Number.isFinite(token.from)||!Number.isFinite(token.target)||token.from<0||token.target>8||token.from>=token.target||!['observation','replay'].includes(token.mode))return false;
  this.generation++;const generation=this.generation;this.token=Object.freeze({...token});this.t=token.from;this.elapsedMs=0;this.anchor=null;this.running=true;
  const frame=()=>{
   if(!this.running||generation!==this.generation)return;
   this.handle=null;const current=this.now();
   if(!Number.isFinite(current)){this.fail('invalid-time');return;}
   if(this.anchor===null){this.anchor=current;this.schedule(frame);return;}
   const dt=current-this.anchor;
   if(!Number.isFinite(dt)||dt<0||dt>250){this.fail('clock-gap');return;}
   this.anchor=current;this.elapsedMs+=dt;this.t=Math.min(this.token.target,this.token.from+this.elapsedMs/1000);
   const activeToken=this.token;this.onFrame(this.t,activeToken);
   if(!this.running||generation!==this.generation)return;
   if(this.t>=activeToken.target){this.running=false;this.anchor=null;this.generation++;this.onTarget(this.t,activeToken);return;}
   this.schedule(frame);
  };
  this.schedule(frame);return true;
 }
 schedule(frame){if(this.running)this.handle=this.requestFrame(frame);}
 pause(){const wasRunning=this.running;this.generation++;this.running=false;this.anchor=null;if(this.handle!==null)this.cancelFrame(this.handle);this.handle=null;return wasRunning;}
 fail(reason){const token=this.token;this.pause();this.onPause(reason,token);}
 destroy(){this.pause();this.token=null;}
}
