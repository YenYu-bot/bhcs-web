// Independent spec oracle; no production imports.
export function expected(positions) {
  if (positions.length !== 6) throw Error('inventory');
  const counts = new Map(); let left=0,right=0;
  positions.forEach(x=> {
    if(x===null)return;
    if(!Number.isInteger(x)||x < -50||x>50||x%5!==0)throw Error('hook');
    counts.set(x,(counts.get(x)||0)+1);
    if(counts.get(x)>4)throw Error('capacity');
    if(x<0)left+=5*-x; else right+=5*x;
  });
  return {left,right,net:left-right,direction:left>right?'left':left<right?'right':'balanced'};
}
export const cases = [
 ['A',[-20,-20,40,null,null,null],200,200],
 ['B',[-20,-20,20,null,null,null],200,100],
 ['C',[-20,-20,20,20,null,null],200,200],
 ['right falls',[-20,30,30,null,null,null],100,300],
 ['pivot',[0,0,null,null,null,null],0,0],
 ['empty',[null,null,null,null,null,null],0,0],
 ['multi-hook',[-20,-30,null,null,null,null],250,0],
 ['close not equal',[-20,-20,35,null,null,null],200,175],
 ['fraction',[5,null,null,null,null,null],0,25],
 ['max hook',[50,50,50,50,null,null],0,1000],
 ['challenge',[-15,-15,30,null,null,null],150,150]
];
