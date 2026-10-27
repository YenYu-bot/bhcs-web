import {beamSpan} from './layout.mjs';
/** Shared pointer-to-hook adapter. Exact model validation happens at transaction commit.
 * undefined = invalid/cancel; null = tray; integer = hook coordinate in cm. */
export function resolveDrop({x,y},bench,tray){
 if(x>=tray.left&&x<=tray.right&&y>=tray.top&&y<=tray.bottom)return null;
 if(x<bench.left+bench.width*.035||x>bench.right-bench.width*.035||y<bench.top+45||y>bench.top+190)return undefined;
 return Math.max(-50,Math.min(50,Math.round(((x-bench.left-bench.width/2)/beamSpan(bench.width)*50)/5)*5));
}
