// Qualitative teaching model: finite room-lamp beam + five-hole disc throughput.
// Not a condenser-NA/contrast/diffraction model or a measured lux calculation.
export const APERTURE_RADII=Object.freeze([.12,.095,.075,.055,.035]);
export const illuminationDefaults=()=>({apertureIndex:0,mirrorAngle:45});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function illuminationSettings(s){return {apertureIndex:Math.round(clamp(Number.isFinite(s.apertureIndex)?s.apertureIndex:0,0,4)),mirrorAngle:clamp(Number.isFinite(s.mirrorAngle)?s.mirrorAngle:45,5,85)};}
export function overlapArea(r,R,d){if(d>=r+R)return 0;if(d<=Math.abs(R-r))return Math.PI*Math.min(r,R)**2;const a=Math.acos(clamp((d*d+r*r-R*R)/(2*d*r),-1,1)),b=Math.acos(clamp((d*d+R*R-r*r)/(2*d*R),-1,1));return r*r*a+R*R*b-.5*Math.sqrt(Math.max(0,(-d+r+R)*(d+r-R)*(d-r+R)*(d+r+R)));}
export function compoundIllumination(s){const settings=illuminationSettings(s),a=settings.mirrorAngle*Math.PI/180,normal={x:0,y:Math.cos(a),z:Math.sin(a)},incoming={x:0,y:0,z:-1},dot=-normal.z,reflected={x:0,y:-2*dot*normal.y,z:-1-2*dot*normal.z};const mirrorY=.51+.23+.035*Math.SQRT1_2,apertureY=1.77+(s.coarse||0)*.025+(s.fine||0)*.0025-.28,height=apertureY-mirrorY,offset=reflected.y>0?Math.abs(height*reflected.z/reflected.y):Infinity,radius=APERTURE_RADII[settings.apertureIndex],area=overlapArea(radius,.16,offset),alignment=clamp(area/(Math.PI*radius*radius),0,1),factor=clamp(area/(Math.PI*APERTURE_RADII[0]**2),0,1);return {...settings,normal,incoming,reflected,offset,alignment,factor,readable:factor>=.18,status:alignment<.1?'未對準':factor<.18?'偏暗':'照明適合'};}
export const illuminationReady=s=>compoundIllumination(s).readable;
export const sameIllumination=(a,b)=>{const x=illuminationSettings(a),y=illuminationSettings(b);return x.apertureIndex===y.apertureIndex&&x.mirrorAngle===y.mirrorAngle;};
