(() => {
"use strict";
const key="bhcs-lab-neutralization-trial-v1", $=id=>document.getElementById(id), d=window.NeutralDiagram;
const steps=[
 {title:"先量酸液，不加鹼",guide:"先讀 pH 計，再看燒瓶顏色。把還沒加入鹼液的讀值留作基準。",req:["a0"],next:"開始加入鹼液"},
 {title:"加了鹼，還是酸嗎？",guide:"先加入 20 mL 鹼液。看液體顏色、讀 pH，兩個線索要分開記。",req:["a20"],next:"找 pH 7 的位置"},
 {title:"找出中和點",guide:"再加 5 mL。以 pH 計確認這一組是否中和，看看酚酞有沒有變色。",req:["a25"],next:"越過中和點"},
 {title:"再加一點，看變色",guide:"中和後再加 1 mL。把變色後的結果和剛才的中和點對照。",req:["a26"],next:"換杯，拉開濃度差"},
 {title:"只把鹼液濃度減半",guide:"換一杯相同的酸液。先加到同樣的 25 mL，再加到 50 mL，比較兩杯何時中和。",req:["b25","b50"],next:"用紀錄回答"},
 {title:"用讀值說出原因",guide:"先對照兩杯的 pH 紀錄，再回答三題，別只看顏色。",req:[],next:""}
];
const samples={
 a0:{strength:.1,volume:0},a20:{strength:.1,volume:20},a25:{strength:.1,volume:25},a26:{strength:.1,volume:26},
 b25:{strength:.05,volume:25},b50:{strength:.05,volume:50}
};
const question=[
 {q:"第一杯的鹼液加到多少，pH 是 7？",options:["20 mL","25 mL","26 mL"],ok:1,why:"第一杯加到 25 mL 時 pH 7.00；20 mL 還是酸性，26 mL 已變鹼性。"},
 {q:"換成濃度減半的鹼液，為什麼要加到 50 mL 才中和？",options:["體積一樣，就會中和","酚酞比較淡","每毫升的鹼比較少，要加兩倍體積才有同樣多的 OH⁻"],ok:2,why:"兩杯酸液相同。中和時 H⁺ 和 OH⁻ 的量相等，不是酸、鹼液的體積一定要相等。"},
 {q:"第一杯加到 25 mL 無色，加到 26 mL 時呈粉紅。從這兩筆可以知道什麼？",options:["粉紅表示已經偏鹼，並非恰好中和","無色一定表示是酸性","只看顏色就能讀出精確 pH"],ok:0,why:"在這個模擬裡，pH 7.00 的中和點無色，超過中和點後，26 mL 的讀值顯粉紅；無色不能區分酸性和中性。"}
];
const calcCards=[
 {title:"01｜先用實驗紀錄算一次",eq:"HCl + NaOH → NaCl + H₂O",desc:"25 mL、0.10 M 鹽酸。要用多少 0.10 M 氫氧化鈉完全中和？先對照你的第一杯紀錄。",correct:25,work:"1 × 0.10 × 25 ＝ 1 × 0.10 × V₂，V₂＝25 mL。兩杯比較時，若只把鹼液濃度減半，體積就要加倍。"},
 {title:"02｜同樣體積，換成硫酸",eq:"H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O",desc:"換成 25 mL、0.10 M 硫酸，鹼液仍是 0.10 M 氫氧化鈉。完全中和時，鹼液要多少？先看 1 莫耳硫酸要配幾莫耳氫氧化鈉。",correct:50,work:"2 × 0.10 × 25 ＝ 1 × 0.10 × V₂，V₂＝50 mL。同樣 25 mL、0.10 M 的酸，硫酸完全中和所需的鹼液是鹽酸的兩倍。"}
];
let calcOpen=false,calcError="";
function renderCalc(unlocked){
 const el=$("advanced");
 el.hidden=!unlocked;if(!unlocked){el.replaceChildren();return;}
 if(!calcOpen){el.innerHTML='<button id="open-calc" type="button" class="primary">試試進階：算出中和體積 →</button>';return;}
 const next=calcCards.findIndex((x,i)=>st.calc[i]!==x.correct);
 el.innerHTML='<div class="kicker">選做｜不影響基本任務完成</div><h3 id="calc-title" tabindex="-1">從反應比例算出體積</h3>'+
  calcCards.slice(0,next<0?2:next+1).map((x,i)=>'<section class="calc-card"><h4>'+x.title+'</h4><p class="equation">'+x.eq+'</p><p>'+x.desc+'</p>'+
  (st.calc[i]===x.correct?'<p class="summary-line">✓ '+x.work+'</p>':
   '<form data-calc="'+i+'"><label for="calc-volume-'+i+'">所需鹼液體積（mL）</label><div class="calc-entry"><input type="number" min="0" step="any" inputmode="decimal" id="calc-volume-'+i+'" name="volume" required><button type="submit" class="primary">核對答案</button></div><p role="status" class="calc-error">'+calcError+'</p></form>')+'</section>').join("")+
  (next<0?'<section class="calc-card"><h4>把兩題整理成同一個算式</h4><p class="equation">aM₁V₁ ＝ bM₂V₂</p><p>a、b：每莫耳酸、鹼在這個反應中可中和的 H⁺、OH⁻ 當量數。M₁、M₂ 是莫耳濃度，V₁、V₂ 是體積，兩邊用同一體積單位。</p><p class="explain">硫酸這題以完全中和為準，不計算 pH 或變色；當量點不是一律 pH 7，變色也不表示恰好中和。</p></section>':"");
}
const last=steps.length-1, fresh=()=>({version:1,rows:[],step:0,answers:question.map(()=>null),calc:[null,null]});
function model(strength,volume){
 const total=25+volume, balance=.10*25-strength*volume, mol=Math.abs(balance)/total;
 const kind=Math.abs(balance)<1e-9?"中性":balance>0?"酸性":"鹼性";
 const pH=kind==="中性"?7:kind==="酸性"?-Math.log10(mol):14+Math.log10(mol);
 return {strength,volume,kind,pH,pink:pH>8.2,equivalence:2.5/strength};
}
const result=id=>model(samples[id].strength,samples[id].volume);
const unlock=rows=>{const n=steps.findIndex(s=>s.req.some(id=>!rows.includes(id)));return n<0?last:n;};
function decode(raw){
 try{const saved=JSON.parse(raw);if(saved?.version!==1)return fresh();
 const rows=Object.keys(samples).filter(k=>Array.isArray(saved.rows)&&saved.rows.includes(k));
 return {version:1,rows,step:Number.isInteger(saved.step)?Math.max(0,Math.min(unlock(rows),saved.step)):0,
 answers:question.map((_,i)=>[0,1,2].includes(saved.answers?.[i])?saved.answers[i]:null),calc:[0,1].map(i=>[25,50].includes(saved.calc?.[i])?saved.calc[i]:null)};
 }catch{return fresh();}
}
let stamp=null,notice="";
try{stamp=localStorage.getItem(key);}catch{notice="目前無法讀取本機紀錄。";}
let st=decode(stamp), strength=.1, volume=0, setup=false, running=false, timer=0, replay=false, savedToast="";
const labelConc=s=>s.toFixed(2)+" M";
const mL=x=>x+" mL";
function persist(clear=false){
 try{
  const now=localStorage.getItem(key);
  if(now!==stamp){notice="另一個分頁更新了紀錄。為避免覆蓋，這次未儲存。";return false;}
  if(clear){localStorage.removeItem(key);stamp=null;}
  else{const raw=JSON.stringify(st);localStorage.setItem(key,raw);stamp=raw;}
  notice="";return true;
 }catch{notice="此瀏覽器無法儲存，畫面上的讀值可能在重新整理後消失。";return false;}
}
function enter(i, review=false){
 clearTimeout(timer);running=false;savedToast="";replay=review;setup=i!==4;strength=.1;volume=[0,0,20,25,0,0][i];
 if(!review&&i<last&&steps[i].req.every(k=>st.rows.includes(k))){
  const z=result(steps[i].req.at(-1));strength=z.strength;volume=z.volume;setup=true;
 }else if(!review&&i===4&&st.rows.includes("b25")){strength=.05;volume=25;setup=true;}
}
enter(st.step);
const draws={
  a20:["加入 20 mL",20],a25:["再加 5 mL（累計 25 mL）",25],a26:["再加 1 mL（累計 26 mL）",26],
  b25:["加入 25 mL",25],b50:["再加 25 mL（累計 50 mL）",50]
};
function cue(){
 const i=st.step, wanted=steps[i].req.find(id=>!st.rows.includes(id));
 const observation=[
  "記下起始讀值：酸液 pH 1.00，酚酞無色。",
  "20 mL 還不夠。pH 上升了，但溶液仍是酸性。",
  "pH 7.00，這組恰好中和。酚酞依然無色。",
  "再加 1 mL 後已變鹼性。粉紅不是中和點。",
  "同樣是 25 mL：第一杯 pH 7.00，第二杯 pH 1.60。第二杯要 50 mL 才中和。"
 ][i];
 if(running)return {status:"正在加液",text:"看滴定管與燒瓶。等鹼液加入完畢，再看 pH 和顏色。",label:"正在加液…",type:"waiting"};
 if(i===4&&!setup)return {status:"控制變因",text:"上一杯的紀錄保留。換一杯相同酸液，只把鹼液濃度從 0.10 M 改成 0.05 M。",label:"換新杯，鹼液改成 0.05 M",type:"setup"};
 const pick=replay?(i===4?(volume<25?"b25":"b50"):steps[i].req[0]):wanted;
 if(!pick)return {status:"本步完成",text:observation,label:steps[i].next+" →",type:"next"};
 const z=samples[pick];
 if(volume!==z.volume)return {status:"下一個動作",text:i===4&&pick==="b50"?"同樣加 25 mL，第一杯已中和，這杯還是酸。再加鹼液試試。":i===2?"現在累計 20 mL，只再加 5 mL。":i===3?"先看當前中和讀值，再只加 1 mL。":"轉開虛擬滴定管，觀察累計加入量。",label:draws[pick][0],type:"dose",limit:z.volume};
 if(replay){
  if(i===4&&volume===25)return {status:"重看第一筆",text:"25 mL 還沒中和，再加到 50 mL。",label:draws.b50[0],type:"dose",limit:50};
  return {status:"重看完畢",text:observation,label:steps[i].next+" →",type:"next"};
 }
 return {status:"觀察後記下",text:i===4&&pick==="b25"?"讀 pH 和顏色。先記下同樣加 25 mL 的結果，才往 50 mL 比較。":observation,label:"記下 "+mL(volume)+" 讀值",type:"record",id:pick};
}
const metric=(label,v)=>'<div class="metric"><span>'+label+'</span><strong>'+v+'</strong></div>';
const timeReduced=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
let pendingAction=null;
function render(){
 const i=st.step,s=steps[i],finished=i===last;
 $("progress").textContent="任務 "+(i+1)+" / "+steps.length;
 $("mission-title").textContent=s.title;$("guide").textContent=s.guide;
 $("steps").innerHTML=steps.map((k,n)=>'<button type="button" data-step="'+n+'" aria-label="任務 '+(n+1)+'：'+k.title+'"'+(n===i?' aria-current="step"':"")+(n>unlock(st.rows)?" disabled":"")+'>'+(n+1)+'</button>').join("");
 document.querySelector(".lab").hidden=finished;$("challenge").hidden=!finished;$("back-quiz").hidden=!finished;
 if(!finished){
  const r=model(strength,volume);pendingAction=cue();
  $("mode").textContent=(strength===.1?"第 1 杯":"第 2 杯")+"｜鹼液 "+labelConc(strength);
  $("diagram").innerHTML=d.apparatus({...r,running});
  $("rig-status").textContent=running?"滴定管開啟 · 加液示意":"滴定管關閉 · 當前累計 "+mL(volume);
  $("reading").innerHTML='<div class="values">'+metric("累計加入鹼液",mL(volume))+metric("pH｜"+r.kind,r.pH.toFixed(2))+metric("酚酞顏色",'<i class="indicator'+(r.pink?" pink":"")+'" aria-hidden="true"></i>'+(r.pink?"粉紅色":"無色"))+metric("鹼液濃度",labelConc(strength))+'</div>';
  $("coach").innerHTML='<b>'+pendingAction.status+'</b><span>'+pendingAction.text+'</span>';
  if(savedToast)$("coach").insertAdjacentHTML("beforeend",'<span class="saved">'+savedToast+'</span>');
  $("act").textContent=pendingAction.label;$("act").disabled=running;
  $("redo").hidden=!s.req.every(k=>st.rows.includes(k))||running||replay||i===0;
 }
 const rows=st.rows.map(result);
 $("plots").innerHTML=rows.length?'<figure><figcaption><b>累計加入量與 pH</b>每個點是你記錄的一次模擬讀值，不是連續量測。</figcaption>'+d.plot(rows)+'</figure>':'<p class="explain">記下第一個讀值，圖上就會出現第一個點。</p>';
 $("notebook").innerHTML=rows.length?'<table class="readings-table"><caption>已記下的讀值</caption><thead><tr><th scope="col">鹼液濃度</th><th scope="col">累計加入</th><th scope="col">pH</th><th scope="col">酚酞</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+labelConc(x.strength)+'</td><td>'+mL(x.volume)+'</td><td>'+x.pH.toFixed(2)+'</td><td>'+(x.pink?"粉紅色":"無色")+'</td></tr>').join("")+'</tbody></table>'+
 (st.rows.includes("a25")&&st.rows.includes("b50")?'<p class="summary-line">同樣一杯酸：0.10 M 鹼液加到 25 mL，0.05 M 鹼液加到 50 mL，都在 pH 7.00 中和。</p>':""):"";
 $("notice").innerHTML=notice+(notice.startsWith("另一個")?' <button type="button" id="resync">載入較新的紀錄</button>':"");
 if(finished){
  $("questions").innerHTML=question.map((q,n)=>'<fieldset><legend>'+(n+1)+'. '+q.q+'</legend>'+q.options.map((a,j)=>'<button type="button" data-answer="'+n+':'+j+'" aria-pressed="'+(st.answers[n]===j)+'">'+a+'</button>').join("")+
  (st.answers[n]==null?"":'<p class="explain">'+(st.answers[n]===q.ok?q.why:"再看一次手札的兩筆讀值。")+'</p>')+'</fieldset>').join("");
  const gotAll=question.every((q,n)=>st.answers[n]===q.ok);
  $("done").textContent=gotAll?"完成！你用 pH 找到中和點，也分辨了中和和變色。":"";
  renderCalc(gotAll);
 }else renderCalc(false);
}
function go(i){
 st.step=i;enter(i);persist();render();$(i===last?"quiz-title":"mission-title").focus();
}
$("act").onclick=()=>{
 if(running||!pendingAction)return;
 const a=pendingAction;savedToast="";
 if(a.type==="next"){go(st.step+1);return;}
 if(a.type==="setup"){setup=true;strength=.05;volume=0;render();$("act").focus({preventScroll:true});return;}
 if(a.type==="dose"){
  running=true;render();$("diagram").scrollIntoView?.({block:"nearest"});
  timer=setTimeout(()=>{running=false;volume=a.limit;render();$("act").focus({preventScroll:true});},timeReduced()?100:1150);return;
 }
 if(a.type==="record"){
  if(!st.rows.includes(a.id)){st.rows.push(a.id);savedToast=persist()?"這筆已記下。":"這筆只留在本頁，未存入瀏覽器。";}
  render();$("act").focus({preventScroll:true});
 }
};
$("redo").onclick=()=>{enter(st.step,true);render();$("act").focus({preventScroll:true});};
$("steps").onclick=e=>{const button=e.target.closest("[data-step]");if(button&&+button.dataset.step<=unlock(st.rows))go(+button.dataset.step);};
$("questions").onclick=e=>{const button=e.target.closest("[data-answer]");if(!button)return;const k=button.dataset.answer,[n,j]=k.split(":").map(Number);st.answers[n]=j;persist();render();$("questions").querySelector('[data-answer="'+k+'"]').focus({preventScroll:true});};
$("advanced").addEventListener("click",e=>{
 if(e.target.id!=="open-calc")return;
 calcOpen=true;calcError="";renderCalc(true);$("calc-title").focus();
});
$("advanced").addEventListener("submit",e=>{
 const form=e.target.closest("[data-calc]");if(!form)return;e.preventDefault();
 const i=Number(form.dataset.calc),input=form.querySelector("input"),data=calcCards[i];
 if(!data||input.value.trim()===""||!Number.isFinite(input.valueAsNumber))return;
 if(Math.abs(input.valueAsNumber-data.correct)>1e-8){
  calcError=i===0?"先看第一杯 pH 7 時，累計加入多少鹼液。":"反應式左邊是 1 份硫酸、2 份氫氧化鈉。用這個比例再算一次。";
  form.querySelector(".calc-error").textContent=calcError;input.focus();return;
 }
 st.calc[i]=data.correct;calcError="";persist();render();
 const follow=$("advanced").querySelector("input");if(follow)follow.focus();else $("calc-title").focus();
});
$("clear").onclick=()=>{$("clear-dialog").returnValue="";$("clear-dialog").showModal();};
$("clear-dialog").addEventListener("close",()=>{if($("clear-dialog").returnValue!=="clear")return;if(!persist(true)){render();return;}st=fresh();calcOpen=false;calcError="";enter(0);render();$("mission-title").focus();});
window.addEventListener("storage",e=>{if((e.key===key||e.key===null)&&e.newValue!==stamp){notice="另一個分頁更新了紀錄。先載入較新的紀錄才不會覆蓋。";render();}});
$("notice").addEventListener("click",e=>{if(e.target.id==="resync"){try{stamp=localStorage.getItem(key);st=decode(stamp);enter(st.step);notice="已載入較新的紀錄。";}catch{notice="目前無法載入。";}render();}});
render();
})();
