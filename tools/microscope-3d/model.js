export const initial=()=>({objective:4,coarse:-2,fine:0,light:75,stageX:0,stageY:0,specimen:'letter'});
export const clarity=(s,obj=s.objective)=>Math.max(0,Math.round(100-Math.abs(s.coarse+s.fine*.1)*(obj===4?18:obj===10?28:45)));
export const fov=obj=>18/obj;
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function chooseObjective(s,obj){if(![4,10,40].includes(obj))return false;if(obj===40&&clarity(s,4)<80){s.objective=4;return false;}s.objective=obj;return true;}
export function focus(s,key,value){if(!['coarse','fine'].includes(key))return false;if(key==='coarse'&&s.objective===40)return false;s[key]=Math.round(clamp(value,key==='coarse'?-5:-10,key==='coarse'?5:10));return true;}
export function move(s,x,y){s.stageX=clamp(x,-270,270);s.stageY=clamp(y,-270,270);}
export const featureScreen=(x,y,s)=>({x:300-s.objective/4*(x+s.stageX*1.6),y:300-s.objective/4*(y-s.stageY*1.6)});
