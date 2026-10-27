/** Display-only geometry. Model hook coordinates and forces are never changed.
 * All racks stay vertically below their exact hook. Local rectangle conflicts
 * move only the later rack down; no control is removed, shrunk, or offset sideways. */
import {racks} from './model.mjs';
export const CONTROL=44, RACK_WIDTH=44;
export function beamSpan(width){if(!Number.isFinite(width)||width<120)throw Error('實驗桌寬度不足');return Math.min(width*.44,width/2-26);}
export function hookPosition(x,width,angle=0){const rad=angle*Math.PI/180,span=beamSpan(width);return {x:width/2+x/50*span*Math.cos(rad),y:100+x/50*span*Math.sin(rad)};}
export function intersects(a,b,gap=0){return a.left<b.right+gap&&a.right+gap>b.left&&a.top<b.bottom+gap&&a.bottom+gap>b.top;}
export function layoutRacks(layout,width,angle=0){
 if(!Number.isFinite(angle)||Math.abs(angle)>8)throw Error('方向示意角度須在 ±8° 內');
 beamSpan(width);const placed=[],groups=[];
 for(const rack of racks(layout)){const item={...rack,anchor:hookPosition(rack.x,width,angle)},group=groups.at(-1);if(group&&item.anchor.x-group.at(-1).anchor.x<RACK_WIDTH+4)group.push(item);else groups.push([item]);}
 for(const group of groups)for(const rack of group){
  const anchor=rack.anchor,height=rack.ids.length*48+32,baseline=Math.max(...group.map(r=>r.anchor.y))+22;
  let top=baseline;const rect=()=>({left:anchor.x-RACK_WIDTH/2,right:anchor.x+RACK_WIDTH/2,top,bottom:top+height});
  // Acyclic greedy placement terminates: every conflict advances below a prior rack.
  while(true){const conflict=placed.find(p=>intersects(rect(),p.bounds,4));if(!conflict)break;top=conflict.bounds.bottom+4;}
  const bounds=rect(),controls=rack.ids.map((id,i)=>({id,x:anchor.x,y:top+i*48,left:anchor.x-22,right:anchor.x+22,top:top+i*48,bottom:top+i*48+44,width:44,height:44}));
  const label={left:bounds.left,right:bounds.right,top:top+rack.ids.length*48,bottom:bounds.bottom,width:RACK_WIDTH,height:32};
  placed.push({...rack,anchor,bounds,controls,label,staggered:top>anchor.y+22+.01});
 }
 return {width,angle,racks:placed,controls:placed.flatMap(r=>r.controls),height:Math.ceil(Math.max(350,...placed.map(p=>p.bounds.bottom+43)))};
}
