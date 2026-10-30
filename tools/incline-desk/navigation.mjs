// Only explicit next-ramp / redo actions call this after render().
// Keep motion/paint/resize paths free of scrolling and focus changes.
export function showApparatusAfterTransition(result,bench,handle){
 if(!result?.changed)return false;
 bench.scrollIntoView({behavior:'auto',block:'center',inline:'nearest'});
 handle.focus({preventScroll:true});
 return true;
}
