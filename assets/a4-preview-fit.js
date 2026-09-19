(()=>{'use strict';
const selector='.sheet,.page';
const printQuery=window.matchMedia?.('print');
let frame=0;
function fit(){
 if(printQuery?.matches)return;
 document.querySelectorAll(selector).forEach(sheet=>{
  sheet.classList.add('bhcs-a4-fit');
  sheet.style.zoom='1';
  const natural=Math.max(sheet.offsetWidth,sheet.scrollWidth,1);
  const available=Math.max(280,document.documentElement.clientWidth-16);
  sheet.style.zoom=String(Math.min(1,Math.max(.35,available/natural)));
 });
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(fit)}
const style=document.createElement('style');style.textContent='@media print{.bhcs-a4-fit{zoom:1!important}}';document.head.append(style);
addEventListener('resize',schedule,{passive:true});
addEventListener('beforeprint',()=>document.querySelectorAll(selector).forEach(sheet=>{sheet.style.zoom='1'}));
addEventListener('afterprint',schedule);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
