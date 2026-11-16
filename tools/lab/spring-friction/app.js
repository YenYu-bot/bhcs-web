(() => {
"use strict";
const key="bhcs-lab-spring-friction-trial-v1";
const d=window.SpringDiagrams,$=id=>document.getElementById(id);
const titles=["先量彈簧原長","只改砝碼質量","試到模型範圍外","拉了，木塊卻沒動","找到開始滑動的一刻","加重後，比較正向力","翻面後，比較接觸面積","從紀錄找證據"];
const guides=["看空彈簧的下端。這條原長基準線，接下來都不變。","只換砝碼。用同一條基準線，比較兩次伸長。","如果超出刻度的模型範圍，公式還能當成讀值嗎？","兩次都先從靜止開始。木塊沒動時，看看拉力與摩擦力怎麼變。","臨界時木塊還停著嗎？再加一點力，注意木塊和箭頭的變化。","接觸面不變，只在同一塊木塊上加重。看看臨界拉力怎麼變。","只翻動同一塊木塊，質量、材質和表面狀況都不變。","你已做完兩種實驗。從圖和紀錄找證據，再回答五題。"];
const forwardLabels=["比較 1.0 kg","試試模型範圍","換到木塊實驗","找開始滑動的臨界","比較加重","比較翻面","用紀錄回答"];
const recordLabels={"m0":"記下原長","m0.5":"記下 0.5 kg 讀值","m1":"記下 1.0 kg 讀值","m1.6":"記下超限結果","p2":"記下 2 N 讀值","p5":"記下 5 N 讀值","p5.88":"記下臨界 5.88 N","p6":"記下滑動讀值","n0":"記下未加重讀值","n1":"記下加重讀值","a0":"記下寬面兩個讀值","a1":"記下窄面兩個讀值"};
const switchActions={"m0":"看原長","m0.5":"掛上 0.5 kg","m1":"換成 1.0 kg","m1.6":"換成 1.6 kg","p2":"先拉 2 N","p5":"再拉 5 N","p5.88":"拉到臨界 5.88 N","p6":"加到 6.00 N，看木塊滑動","n0":"換回未加重","n1":"加上 2 kg","a0":"翻回寬面","a1":"翻成窄面"};
const required=[["m0","m0.5"],["m1"],["m1.6"],["p2","p5"],["p5.88","p6"],["n0","n1"],["a0","a1"],[]];
const valid=required.flat(), last=titles.length-1;
const compared=i=>i===5||i===6;
const trialCase=(name,mass,A)=>{const N=mass*9.8;return {name,N,A,F:N*.30,K:N*.20};};
const cases={n0:trialCase("未加砝碼",2,60),n1:trialCase("加 2 kg",4,60),a0:trialCase("寬面朝下",2,60),a1:trialCase("窄面朝下",2,30)};
const compareId=(i,v)=>(i===5?"n":"a")+v;
const quiz=[
{q:"只把砝碼由 0.5 kg 換成 1.0 kg，這兩筆彈簧伸長怎麼變？",o:["加倍：9.8 → 19.6 cm","維持 9.8 cm","變成四倍"],ok:0,why:"在這個模型的直線適用範圍，拉力與伸長成正比：F＝kx。超過 30 cm 則不能用它判定實際伸長。"},
{q:"木塊一直靜止時，拉力由 2 N 增至 5 N，摩擦力怎麼變？",o:["仍是 2 N","升為 5 N，方向與拉力相反","先變成零"],ok:1,why:"在尚未滑動時，靜摩擦力會配合拉力大小改變，方向相反，不是固定一個值。"},
{q:"從臨界的 5.88 N 再增加至 6.00 N，摩擦力發生什麼變化？",o:["一路增至 6 N","仍是 5.88 N","開始滑動，降至 3.92 N"],ok:2,why:"看圖上的實心點和空心點：靜摩擦最大 5.88 N，開始滑動後這個模型的動摩擦力是 3.92 N。"},
{q:"木塊加重後，正向力加倍。最大靜摩擦力怎麼變？",o:["減半","不變","加倍：5.88 → 11.76 N"],ok:2,why:"表面條件不變時，最大靜摩擦力和正向力成正比。正向力是桌面垂直向上支撐木塊的力；本實驗只水平拉，沒有額外的垂直拉力。"},
{q:"質量與表面條件不變，木塊改用窄面接觸時，最大靜摩擦力怎麼變？",o:["在本模型中不變","跟接觸面積一起減半","增加兩倍"],ok:0,why:"只改變表觀接觸面積，在此乾摩擦近似模型中，最大靜摩擦力與滑動後的動摩擦力都不變。"}
];
const fresh=()=>({version:1,rows:[],step:0,answers:quiz.map(()=>null)});
const decode=raw=>{try{const z=JSON.parse(raw);if(z?.version!==1)return fresh();const rows=[...new Set((Array.isArray(z.rows)?z.rows:[]).filter(x=>valid.includes(x)))];const first=required.findIndex((xs,i)=>i<last&&!xs.every(x=>rows.includes(x)));const max=first<0?last:first;return {version:1,rows,step:Number.isInteger(z.step)?Math.max(0,Math.min(max,z.step)):0,answers:quiz.map((_,i)=>[0,1,2].includes(z.answers?.[i])?z.answers[i]:null)};}catch{return fresh();}};
let stamp=null,storeReadable=true;
try{stamp=localStorage.getItem(key);}catch{storeReadable=false;}
let shownDiagram="",playSlide=false,variant=0,scan="idle",scanTimer=0;
let st=decode(stamp),mass=0,pull=0,feedback="",notice=storeReadable?"":"目前無法讀取本機紀錄；可以繼續操作。";
const fmt=(n,dp=2)=>Number(n).toFixed(dp).replace(/\.?(?:0+)$/u,m=>m.startsWith(".")?"":m).replace(/(\.\d*?[1-9])0+$/u,"$1");
const massName=x=>x===0?"原長":x.toFixed(1)+" kg";
const curr=()=>st.step<3?"m"+mass:compared(st.step)?compareId(st.step,variant):"p"+pull;
const unlocked=()=>{const i=required.findIndex((xs,n)=>n<last&&!xs.every(x=>st.rows.includes(x)));return i<0?last:i;};
function persist(clear=false){
 try{
  const now=localStorage.getItem(key);
  if(now!==stamp){
   notice='另一個分頁已更新紀錄。為避免覆蓋，這次未儲存。';
   return false;
  }
  if(clear){localStorage.removeItem(key);stamp=null;}else{const raw=JSON.stringify(st);localStorage.setItem(key,raw);stamp=raw;}
  notice="";return true;
 }catch{notice="此瀏覽器無法儲存。畫面上的變更在重新整理後可能消失。";return false;}
}
const metric=(label,value)=>'<div class="metric"><span>'+label+'</span><strong>'+value+'</strong></div>';
function choice(v,label,on=false,attrs=""){
 return '<button type="button" data-choice="'+v+'" aria-pressed="'+on+'" '+attrs+'>'+label+'</button>';
}
function checkComparison(){
 const result=cases[curr()], measured=scan==="done"||scan==="slide", area=st.step===6;
 return '<div class="values">'+metric("正向力（桌面向上）",fmt(result.N)+" N")+metric("表觀接觸面積",result.A+" cm²")+metric("最大靜摩擦力",measured?fmt(result.F)+" N":"尚未量到")+(area?metric("滑動時的動摩擦力",scan==="slide"?fmt(result.K)+" N":"尚未滑動"):"")+'</div>'+
  (scan==="running"?'<p class="scan-label">水平拉力正在增加…</p><div class="pull-gauge" aria-hidden="true"><span></span></div>':
  scan==="slide"?'<p class="explain">拉到 6.00 N，木塊開始滑動。把臨界和滑動讀值一起記下。</p>':
  scan==="done"?'<p class="explain">已拉到臨界，木塊仍可靜止。'+(area?"再加一點力，觀察滑動時的讀值。":"記下這次的臨界拉力。")+'</p>':'<p class="explain">按「緩慢拉到臨界」再讀值。每次從靜止開始，拉力方向保持水平。</p>');
}
function reading(){
 if(compared(st.step))return checkComparison();
 if(st.step<3){
  if(mass===1.6)return '<div class="values">'+metric("砝碼的拉力","15.68 N")+metric("刻度讀值","超過模型範圍")+'</div><p class="explain warn">這個模型只適用於伸長 30 cm 以內。31.36 cm 是按直線外推，不是實際讀值，也不表示已發生永久變形。</p>';
  const x=mass*19.6;
  let hint=mass===0?"觀察空彈簧下端的原長基準線。": "伸長是從原長位置量起，不是彈簧的總長。";
  if(mass===1&&st.rows.includes("m1"))hint+=" 和 0.5 kg 相比，拉力與伸長都加倍。";
  return '<div class="values">'+metric("砝碼的拉力",fmt(mass*9.8)+" N")+metric("相對原長的伸長",fmt(x)+" cm")+'</div><p class="explain">'+hint+'</p>';
 }
 const sliding=pull>5.88, friction=sliding?3.92:pull;
 return '<div class="values">'+metric("水平拉力",fmt(pull)+" N")+metric(sliding?"動摩擦力":"靜摩擦力",fmt(friction)+" N")+'</div><p class="explain">'+(sliding?"拉力超過最大靜摩擦力，木塊向右滑動；左向摩擦力從 5.88 N 降到 3.92 N。":pull===5.88?"在臨界點仍靜止，靜摩擦已達最大。":pull===0?"木塊從靜止開始，尚未施加拉力。":"木塊仍靜止；靜摩擦與拉力等大反向。")+'</p>';
}
let actionKey="";
function coach(){
 const i=st.step,id=curr(),pending=required[i].filter(x=>!st.rows.includes(x));
 const count=required[i].length-pending.length,total=required[i].length;
 const hint=(text,key="",label="")=>({text,key,label,count,total});
 if(!pending.length){
  const wrap=[
   "原長與 0.5 kg 都記好了。下一步換成更重的砝碼。",
   "同一條彈簧：砝碼加倍，拉力和伸長也加倍（9.8 → 19.6 cm）。",
   "31.36 cm 是公式外推，不是刻度讀值。接下來換到木塊實驗。",
   "木塊一直沒動，摩擦力卻從 2 N 跟著增加到 5 N。接下來找臨界。",
   "從 5.88 N 到 6.00 N，木塊開始滑，摩擦力反而降到 3.92 N。",
   "接觸面不變：正向力加倍（19.6 → 39.2 N），臨界拉力也加倍（5.88 → 11.76 N）。",
   "接觸面積減半（60 → 30 cm²），兩面仍量到相同的臨界值 5.88 N 和動摩擦力 3.92 N。"
  ];
  return hint(wrap[i]||"這一步的讀值已記好。");
 }
 if(id!==pending[0]){
  const target=pending[0], targetButton=compared(i)?"v"+target.at(-1):target;
  return hint(count?"上一個條件已記下。現在換下一個條件。":"先選這次要比較的條件。",targetButton,switchActions[target]);
 }
 if(compared(i)){
  if(scan==="running")return hint("拉力正在增加，等讀值停在臨界。");
  if(scan==="idle")return hint("條件已選好。從靜止開始，水平加力。","pull-test","緩慢拉到臨界");
  if(i===6&&scan==="done")return hint("臨界值已量到，先別記。再加一點力，量滑動時的摩擦力。","slide-test","再加力：6.00 N");
  return hint(i===6?(id==="a0"?"兩個摩擦讀值都量到了，記下來再翻面。":"把窄面的兩個讀值記下，就能直接比較。"):"臨界讀值已出現，記下來才能比較。");
 }
 const guidance={"m0":"先記下原長，才知道之後要從哪裡量。","m0.5":"看刻度的 9.8 cm，並記下這組讀值。","m1":"看刻度，和剛才的 9.8 cm 比一比，再記下。","m1.6":"把「超出模型範圍」記下，不把外推當成讀值。","p2":"木塊沒動。先記下這組等大反向的力。","p5":"再看一次木塊有沒有動，記下摩擦力。","p5.88":"木塊仍靜止。記下臨界值，下一次就能加到 6.00 N。","p6":"看木塊移動與摩擦力箭頭縮短，再記下滑動讀值。"};
 return hint(guidance[id]||"觀察後記下讀值。");
}
function render(){
 const focused=document.activeElement?.getAttribute("data-choice");
 const i=st.step,row=required[i],done=row.every(x=>st.rows.includes(x)),expanded=i===last;
 $("progress").textContent="任務 "+(i+1)+" / "+titles.length;$("mission-title").textContent=titles[i];$("guide").textContent=guides[i];
 $("steps").innerHTML=titles.map((t,n)=>'<button type="button" data-step="'+n+'" aria-label="任務 '+(n+1)+'：'+t+'"'+(n===i?' aria-current="step"':"")+(n>unlocked()?" disabled":"")+'>'+(n+1)+'</button>').join("");
 document.querySelector(".lab").hidden=expanded;
 $("challenge").hidden=!expanded;$("back-quiz").hidden=!expanded;
 if(!expanded){
  const spring=i<3,compare=compared(i);
  const type=i===5?"normal":"area";
  $("scene-title").textContent=spring?"A｜彈簧與砝碼":compare?(i===5?"C｜改變正向力":"D｜改變接觸面積"):"B｜木塊與水平拉力";
  $("mode").textContent=spring?"同一條彈簧":compare?(i===5?"接觸面不變":"材質與正向力不變"):"同一塊有摩擦的水平木板";
  const diagramKey=compare?curr()+scan:(spring?"m"+mass:"p"+pull);
  if(diagramKey!==shownDiagram||playSlide){
   $("diagram").innerHTML=spring?d.spring(mass):compare?window.SpringCompare.diagram(type,variant,scan==="slide"?"slide":scan==="done"):d.friction(pull);
   if(playSlide&&!spring&&pull>5.88)$("diagram").querySelector("svg")?.classList.add("sf-animate-slide");
   shownDiagram=diagramKey;playSlide=false;
  }
  $("controls").innerHTML=compare?(
   choice("v0",cases[compareId(i,0)].name,variant===0)+choice("v1",cases[compareId(i,1)].name,variant===1)+
   '<button type="button" data-choice="pull-test" class="primary"'+(scan==="running"?" disabled":"")+'>緩慢拉到臨界</button>'+ (i===6&&(scan==="done"||scan==="slide")?'<button type="button" data-choice="slide-test">'+(scan==="slide"?"重播滑動":"再加力：6.00 N")+'</button>':"")):spring?[0,.5,...(i>=1?[1]:[]),...(i>=2?[1.6]:[])].map(x=>choice("m"+x,massName(x),x===mass,x===.5&&!st.rows.includes("m0")?"disabled":"")).join(""):(pull>5.88?(choice("replay","↻ 重播滑動")+choice("restart","重置木塊，從靜止重做")): [2,5,...(i===4?[5.88,6]:[])].map(x=>choice("p"+x,x.toFixed(x>=5.88?2:0)+" N",x===pull,(x===5&&!st.rows.includes("p2")||x===6&&!st.rows.includes("p5.88"))?"disabled":"")).join(""));
  $("reading").innerHTML=reading();$("record").disabled=!row.includes(curr())||st.rows.includes(curr())||(compare&&scan!==(i===6?"slide":"done"));
  $("next").disabled=!done;
  const cue=coach(),guided=$("guided");
  if(cue.key)$("record").disabled=true;
  actionKey=cue.key;guided.hidden=!cue.key;guided.textContent=cue.label;
  $("coach").innerHTML='<b>本步紀錄 '+cue.count+'／'+cue.total+'</b><span>'+cue.text+'</span>';
  $("record").hidden=$("record").disabled;
  $("record").textContent=recordLabels[curr()]||"記下這次讀值";
  $("next").hidden=!done;$("next").classList.toggle("primary",done);$("next").textContent=(forwardLabels[i]||"下一步")+" →";
  $("controls").querySelector('[data-choice="'+cue.key+'"]')?.classList.add("cue-target");
 }
 $("feedback").textContent=feedback;
 $("notice").innerHTML=notice?(notice+(notice.startsWith("另一個")?' <button type="button" id="resync">載入其他分頁的紀錄</button>':"")):"";
 $("notebook").innerHTML=st.rows.length?st.rows.map(x=>{
  if(cases[x])return "";
  const n=+x.slice(1);let t=x[0]==="m"? n===0?"原長基準已記下":n===1.6?"1.6 kg：超過範圍（公式外推 31.36 cm）":massName(n)+"｜"+fmt(n*19.6)+" cm":fmt(n)+" N 拉力｜"+fmt(n>5.88?3.92:n)+" N 摩擦｜"+(n>5.88?"滑動":"靜止");
  return '<span class="chip">'+t+'</span>';
 }).join(""):'<span class="chip">記下讀值後，會顯示在這裡。</span>';
 const ms=st.rows.filter(x=>x[0]==="m").map(x=>+x.slice(1));
 $("plots").innerHTML='<figure><figcaption><b>彈簧：拉力和伸長</b>這個模型的直線適用範圍：伸長 30 cm 以內。</figcaption>'+(ms.length>=2?d.springPlot(ms):'<p class="explain">先記下原長與砝碼讀值，再看圖。</p>')+'</figure>';
 $("notebook").innerHTML+=Object.keys(cases).some(x=>st.rows.includes(x))?
  '<div class="compare-log"><table><caption>兩組控制變因比較（模擬讀值）</caption><thead><tr><th scope="col">條件</th><th scope="col">正向力</th><th scope="col">接觸面積</th><th scope="col">最大靜摩擦力</th><th scope="col">動摩擦力</th></tr></thead><tbody>'+
  Object.entries(cases).filter(([id])=>st.rows.includes(id)).map(([id,v])=>'<tr><th scope="row">'+(id[0]==="n"?"加重":"翻面")+'｜'+v.name+'</th><td>'+fmt(v.N)+' N</td><td>'+v.A+' cm²</td><td>' +fmt(v.F)+' N</td><td>'+(id[0]==="a"?fmt(v.K)+' N':'—')+'</td></tr>' ).join("")+'</tbody></table>'+
  (st.rows.includes("a0")&&st.rows.includes("a1")?'<p class="explain">乾摩擦近似模型：只把接觸面積由 60 cm² 改成 30 cm²，最大靜摩擦力同為 5.88 N；滑動後的動摩擦力也同為 3.92 N（模型值）。</p>':'')+'</div>':"";
 if(i>=3||st.rows.some(x=>x[0]==="p")){
  const complete=st.rows.includes("p6");
  $("plots").innerHTML+='<figure><figcaption><b>摩擦力：從靜止開始，逐步增加水平拉力</b>'+(complete?'拉 5.88 N：仍靜止，摩擦力 5.88 N。拉 6.00 N：開始滑動，摩擦力 3.92 N。':'先記錄木塊何時滑動，再看完整圖。')+'</figcaption>'+(complete?d.frictionPlot(i===3||i===4?pull:6):'')+'</figure>';
 }
 if(expanded){
  $("questions").innerHTML=quiz.map((q,n)=>'<fieldset><legend>'+(n+1)+'. '+q.q+'</legend>'+q.o.map((o,k)=>'<button type="button" data-answer="'+n+':'+k+'" aria-pressed="'+(st.answers[n]===k)+'">'+o+'</button>').join("")+(st.answers[n]==null?"":'<p class="explain">'+(st.answers[n]===q.ok?q.why:"再看圖和紀錄，換一個答案試試。")+'</p>')+'</fieldset>').join("");
  $("done").textContent=quiz.every((q,n)=>st.answers[n]===q.ok)?"完成！你已用刻度、讀值與圖，解釋兩種力。":"";
 }
 if(focused){const el=[...$("controls").querySelectorAll("button")].find(b=>b.dataset.choice===focused);if(el&&!el.disabled)el.focus({preventScroll:true});}
}
function advance(i){
 st.step=i; mass=i===1?.5:i===2?1:0;pull=0; feedback="";resetComparison();
 persist();render(); $(i===last?"quiz-title":"mission-title").focus();
}
function resetComparison(){clearTimeout(scanTimer);scan="idle";variant=0;}
$("controls").addEventListener("click",e=>{
 const b=e.target.closest("[data-choice]");if(!b)return;
 const val=b.dataset.choice;
 if(val==="v0"||val==="v1"){resetComparison();variant=+val.slice(1);feedback="";render();return;}
 if(val==="slide-test"){
  scan="slide";shownDiagram="";feedback="";render();
  if(!$("record").disabled)$("record").focus({preventScroll:true});
  else $("controls").querySelector('[data-choice="slide-test"]')?.focus({preventScroll:true});
  return;
 }
 if(val==="pull-test"){
  clearTimeout(scanTimer);scan="running";feedback="";render();
  scanTimer=setTimeout(()=>{scan="done";render();if(!$("guided").hidden)$("guided").focus({preventScroll:true});else if(!$("record").disabled)$("record").focus({preventScroll:true});},window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?120:1050);
  return;
 }
 if(val==="replay"){playSlide=true;feedback="重播開始滑動的瞬間；不新增或清除紀錄。";}
 else if(val==="restart"){pull=0;feedback="木塊已回到靜止。之前記下的觀察仍保留。";}
 else{if(val[0]==="m")mass=+val.slice(1);else{pull=+val.slice(1);if(pull>5.88)playSlide=true;}feedback="";}
 render();
 if(val==="restart")$("controls").querySelector("button")?.focus({preventScroll:true});
 else if(val==="p6")$("record").focus({preventScroll:true});
});
$("guided").onclick=()=>{
 const target=$("controls").querySelector('[data-choice="'+actionKey+'"]');
 if(!target||target.disabled)return;
 const animate=actionKey==="p6"||actionKey==="slide-test";
 target.click();
 if(animate)$("diagram").scrollIntoView?.({block:"nearest"});
 if(!$("guided").hidden)$("guided").focus({preventScroll:true});
 else if(!$("record").hidden)$("record").focus({preventScroll:true});
};
$("record").onclick=()=>{
 if(st.step===last||$("record").disabled)return;
 st.rows.push(curr()); const saved=persist();
 const lab=curr()==="m0"?"原長基準": "這筆觀察";
 feedback=lab+(saved?"已記下。":"暫留在本頁，未存入瀏覽器。");
 render();
 if(!$("next").disabled)$("next").focus({preventScroll:true});else if(!$("guided").hidden)$("guided").focus({preventScroll:true});else $("controls").querySelector("button:not(:disabled):not([aria-pressed=true])")?.focus({preventScroll:true});
};
$("next").onclick=()=>{if(st.step<last&&required[st.step].every(x=>st.rows.includes(x)))advance(st.step+1);};
$("steps").onclick=e=>{const x=e.target.closest("[data-step]");if(x&&+x.dataset.step<=unlocked())advance(+x.dataset.step);};
$("questions").onclick=e=>{const x=e.target.closest("[data-answer]");if(!x)return;const v=x.dataset.answer,[n,j]=v.split(":").map(Number);st.answers[n]=j;persist();render();$("questions").querySelector('[data-answer="'+v+'"]')?.focus({preventScroll:true});};
$("clear").onclick=()=>{$("clear-dialog").returnValue="";$("clear-dialog").showModal();};
$("clear-dialog").addEventListener("close",()=>{
 if($("clear-dialog").returnValue!=="clear")return;
 if(!persist(true)){render();return;}
 st=fresh();mass=pull=0;resetComparison();feedback="已清空本實驗，從原長重新開始。";render();$("mission-title").focus();
});
window.addEventListener("storage",e=>{if((e.key===key||e.key===null)&&e.newValue!==stamp){notice="另一個分頁已更新紀錄。為避免覆蓋，請先載入較新的紀錄。";render();}});
$("notice").addEventListener("click",e=>{if(e.target.id==="resync"){try{stamp=localStorage.getItem(key);st=decode(stamp);mass=pull=0;resetComparison();notice="已載入較新的紀錄。";feedback="";}catch{notice="目前無法載入。";}render();}});
if(st.step===1)mass=.5;if(st.step===2)mass=1;
render();
})();
