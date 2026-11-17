(() => {
"use strict";
const $=id=>document.getElementById(id), draw=window.LightDiagram,key="bhcs-lab-light-path-trial-v1";
const mediums={air:"空氣",water:"水",glass:"玻璃"}, IOR={air:1,water:1.33,glass:1.5};
const degrees=180/Math.PI, exactCritical=Math.asin(1/1.5)*degrees;
const optics={
 m20:{scene:"mirror",angle:20,from:"air",to:"air",name:"平面鏡",action:"轉到 20°",note:"兩個角都從虛線法線量。先記下 20° 的結果。"},
 m40:{scene:"mirror",angle:40,from:"air",to:"air",name:"平面鏡",action:"轉到 40°",note:"入射角改了，反射角也跟著改。看看兩個角是否仍相等。"},
 g0:{scene:"refraction",angle:0,from:"air",to:"glass",name:"空氣 → 玻璃",action:"換成玻璃，讓光垂直射入",note:"光沿法線直進玻璃，方向沒彎。介面也會有反向的反射光。"},
 g30:{scene:"refraction",angle:30,from:"air",to:"glass",name:"空氣 → 玻璃",action:"把入射角改成 30°",note:"折射角變得比入射角小，光向法線靠近。"},
 w30:{scene:"refraction",angle:30,from:"air",to:"water",name:"空氣 → 水",action:"只把玻璃換成水",note:"入射角固定 30°。比較水和剛才玻璃的折射角。"},
 r30:{scene:"refraction",angle:30,from:"glass",to:"air",name:"玻璃 → 空氣",action:"改從玻璃射向空氣",note:"仍是 30° 入射，但折射角反而較大，光偏離法線。這是換入射介質，不是沿上一條光路倒走。"},
 crit:{scene:"refraction",angle:exactCritical,from:"glass",to:"air",name:"玻璃 → 空氣",action:"轉到臨界角（約 41.8°）",note:"在模型的精確臨界角，折射角是 90°，折射方向沿介面。"},
 tir:{scene:"refraction",angle:45,from:"glass",to:"air",name:"玻璃 → 空氣",action:"再轉到 45°",note:"已超過臨界角：沒有折射光線，只剩反射光，反射角仍是 45°。"}
};
const steps=[
 {name:"照平面鏡，從法線量角",intro:"轉動光束，比較反射角是否跟著變。圖中的虛線垂直於鏡面。",seed:"m20",keys:["m20","m40"],next:"試試垂直入射",summary:"20° 對 20°，40° 對 40°。反射角等於入射角，兩者都從法線量。"},
 {name:"空氣射入玻璃",intro:"先讓光垂直進入玻璃，再轉成斜射，觀察有沒有偏折。",seed:"m40",keys:["g0","g30"],next:"同角度換成水",summary:"垂直入射不偏折；斜射進玻璃時，折射角小於入射角。"},
 {name:"固定角度，只換介質",intro:"入射角保持 30°。只把下方的玻璃換成水，與上一筆並排比較。",seed:"g30",keys:["w30"],pair:["g30","w30"],next:"改從玻璃射向空氣",summary:"同是 30° 入射，玻璃約 19.47°，水約 22.08°；模型中，射入玻璃更靠近法線。"},
 {name:"換入射介質，看偏向哪一側",intro:"入射角仍是 30°，改讓光從玻璃進入空氣。只比較介質順序，不沿原光路倒走。",seed:"g30",keys:["r30"],pair:["g30","r30"],next:"找出全反射的界線",summary:"空氣射入玻璃時偏向法線；玻璃射入空氣時偏離法線。"},
 {name:"找出全反射",intro:"保持玻璃射向空氣。先設精確臨界角，再轉到 45°。",seed:"r30",keys:["crit","tir"],next:"用紀錄回答",summary:"臨界時折射方向沿介面；超過臨界角才全反射，只剩反射光。"},
 {name:"用紀錄說出光路規律",intro:"回頭比對光路和角度，再用證據回答。",seed:"tir",keys:[],next:"",summary:""}
];
const quiz=[
 {q:"讀入射角和反射角時，是從哪一條線開始量？",o:["從鏡面","從垂直於介面的法線","從桌面邊緣"],ok:1,why:"法線垂直於介面。20° 與 40° 的反射比較，都以法線為基準。"},
 {q:"入射角同是 30°，哪一組觀察正確？",o:["進玻璃和離開玻璃都偏向法線","折射角都是 30°","空氣進玻璃偏向法線，玻璃進空氣偏離法線"],ok:2,why:"在這兩組案例中，折射角分別約 19.47° 與 48.59°，和 30° 比較就能看出方向。"},
 {q:"從玻璃射向空氣，哪一個情況只剩反射光？",o:["45°，高於臨界角","恰好臨界角（約 41.8°）","30°，低於臨界角"],ok:0,why:"在這個模型中，臨界角的折射方向沿介面；45° 超過臨界角，沒有折射光線。"}
];
const finish=5, valid=Object.keys(optics), fresh=()=>({version:1,step:0,rows:[],answers:[null,null,null]});
const unlock=rows=>{const i=steps.findIndex(x=>x.keys.some(k=>!rows.includes(k)));return i<0?finish:i;};
function decode(raw){try{
 const v=JSON.parse(raw);if(v?.version!==1)return fresh();
 const rows=valid.filter(k=>Array.isArray(v.rows)&&v.rows.includes(k));
 return {version:1,step:Number.isInteger(v.step)?Math.max(0,Math.min(unlock(rows),v.step)):0,rows,answers:quiz.map((_,i)=>[0,1,2].includes(v.answers?.[i])?v.answers[i]:null)};
}catch{return fresh();}}
let stamp=null,notice="";
try{stamp=localStorage.getItem(key);}catch{notice="目前無法讀取本機紀錄。";}
let state=decode(stamp),active="",replay=-1,toast="",action=null,angleOverride=null;
const fmt=x=>Number.isInteger(x)?x+"°":x.toFixed(2)+"°";
const view=(k,angle=null)=>{
 const x=angle===null?optics[k]:{...optics[k],angle}, reflected=x.angle;
 const normal=x.angle===0;
 const s=IOR[x.from]*Math.sin(x.angle/degrees)/IOR[x.to];
 const outcome=x.scene==="mirror"?"mirror":s>1+1e-12?"tir":Math.abs(s-1)<1e-12?"critical":"refract";
 const refracted=outcome==="mirror"||outcome==="tir"?null:outcome==="critical"?90:Math.asin(s)*degrees;
 const note=outcome==="mirror"?"反射角等於入射角":outcome==="tir"?"全反射":outcome==="critical"?"折射方向沿介面":normal?"垂直入射，不偏折":refracted<x.angle?"偏向法線":"偏離法線";
 return {...x,reflected,refracted,outcome,readout:note};
};
function persist(clear=false){try{
 if(localStorage.getItem(key)!==stamp){notice="另一個分頁更新了紀錄。為避免覆蓋，這次未儲存。";return false;}
 if(clear){localStorage.removeItem(key);stamp=null;}else{const raw=JSON.stringify(state);localStorage.setItem(key,raw);stamp=raw;}
 notice="";return true;
}catch{notice="此瀏覽器無法儲存，畫面上的讀值可能在重新整理後消失。";return false;}}
function initial(){
 const s=steps[state.step];
 const captured=s.keys.filter(k=>state.rows.includes(k));
 active=captured.at(-1)||s.seed;replay=-1;toast="";angleOverride=null;
}
initial();
function chooseAction(){
 const s=steps[state.step], next=s.keys.find(k=>!state.rows.includes(k));
 if(replay>=0){
  const cas=s.keys[replay];
  if(cas===undefined)return {kind:"next",text:s.summary,label:s.next+" →",status:"重看完畢"};
  if(active!==cas||angleOverride!==null)return {kind:"set",key:cas,text:"跟著光線轉動，再讀一次角度。",label:optics[cas].action,status:"重看本步"};
  return {kind:"peek",text:optics[cas].note,label:"已觀察，繼續",status:"重看本步"};
 }
 if(!next)return {kind:"next",text:s.summary,label:s.next+" →",status:"本步完成"};
 if(active!==next||angleOverride!==null)return {kind:"set",key:next,text:angleOverride!==null?"這是你的自由調角。要記本任務，請對準指定角度或按下方按鈕。":"只改這一項，保留上一筆作對照。",label:optics[next].action,status:"下一個動作"};
 return {kind:"record",key:next,text:optics[next].note,label:"記下這次讀值",status:"觀察後記下"};
}
const metric=(label,value)=>'<div class="metric"><span>'+label+'</span><strong>'+value+'</strong></div>';
const incidence=v=>v.outcome==="critical"?"約 41.81°":fmt(v.angle);
const transmission=v=>v.outcome==="mirror"?"不適用":v.outcome==="tir"?"無折射光":fmt(v.refracted);
function paintDiagram(v){
 const markup=draw.apparatus(v), svg=panel.firstElementChild;
 if(drag===null||!svg){panel.innerHTML=markup;return;}
 const template=document.createElement("template");
 template.innerHTML=markup;
 const next=template.content.firstElementChild;
 const handles=node=>[...node.children].filter(el=>el.hasAttribute("data-angle-handle"));
 const existing=handles(svg), updated=handles(next);
 // A native touch sequence stays tied to its original target. Keep the SVG
 // and all three grip/hit nodes connected while updating their geometry.
 if(!existing.length||existing.length!==updated.length||existing.some((el,i)=>el.localName!==updated[i].localName))return;
 const syncAttrs=(target,source)=>{
  for(const attr of [...target.attributes])if(!source.hasAttribute(attr.name))target.removeAttribute(attr.name);
  for(const attr of source.attributes)if(target.getAttribute(attr.name)!==attr.value)target.setAttribute(attr.name,attr.value);
 };
 syncAttrs(svg,next);
 const layer=document.createDocumentFragment();
 for(const node of [...next.children])if(!node.hasAttribute("data-angle-handle"))layer.append(node);
 for(const node of [...svg.children])if(!node.hasAttribute("data-angle-handle"))node.remove();
 svg.insertBefore(layer,existing[0]);
 existing.forEach((node,i)=>syncAttrs(node,updated[i]));
}
function renderOptics(syncSlider=true){
 const v=view(active,angleOverride);action=chooseAction();
 $("mode").textContent=v.name;paintDiagram(v);
 if(syncSlider)$("angle").value=String(Math.round(v.angle*10)/10);
 $("angle").setAttribute("aria-valuetext",incidence(v));$("angle-value").textContent=incidence(v);
 $("reading").innerHTML='<div class="values">'+metric("入射角",incidence(v))+metric("反射角",fmt(v.reflected))+(v.scene==="mirror"?"":metric("折射角",transmission(v)))+'</div><p class="outcome">'+v.readout+'</p>';
 $("coach").innerHTML='<b>'+action.status+'</b><span>'+action.text+'</span>'+(toast?'<span>'+toast+'</span>':"");
 $("act").textContent=action.label;
}
function changeAngle(raw,viaSlider=false){
 if(state.step===finish||!Number.isFinite(raw))return;
 const a=Math.round(Math.max(0,Math.min(75,raw))*10)/10;
 const s=steps[state.step], target=replay>=0?s.keys[replay]:s.keys.find(k=>!state.rows.includes(k));
 const sameScene=(p,q)=>p.scene===q.scene&&p.from===q.from&&p.to===q.to;
 if(target&&sameScene(optics[active],optics[target])&&Math.abs(a-optics[target].angle)<1e-8){active=target;angleOverride=null;}
 else angleOverride=Math.abs(a-optics[active].angle)<1e-8?null:a;
 toast="";renderOptics(!viaSlider);
}
$("angle").addEventListener("input",e=>changeAngle(e.target.valueAsNumber,true));
let drag=null;
const panel=$("diagram");
let angleTouchId=null;
const affectsAngleTouch=e=>angleTouchId!==null&&Array.from(e.changedTouches).some(t=>t.identifier===angleTouchId);
// Chromium may take a native touch gesture for panning even with touch-action
// on an SVG hit node. Cancel default only for a single touch starting on a grip.
panel.addEventListener("touchstart",e=>{
 angleTouchId=null;
 if(e.touches.length!==1||e.changedTouches.length!==1)return;
 const touch=e.changedTouches[0];
 if(!touch.target.closest?.("[data-angle-handle]"))return;
 angleTouchId=touch.identifier;
 if(e.cancelable)e.preventDefault();
},{passive:false});
panel.addEventListener("touchmove",e=>{
 if(e.touches.length!==1){angleTouchId=null;return;}
 if(e.cancelable&&affectsAngleTouch(e))e.preventDefault();
},{passive:false});
for(const type of ["touchend","touchcancel"])panel.addEventListener(type,e=>{if(affectsAngleTouch(e))angleTouchId=null;},{passive:true});
panel.addEventListener("pointerdown",e=>{
 if(drag!==null||e.button!==0||!e.target.closest("[data-angle-handle]"))return;
 drag=e.pointerId;
 try{panel.setPointerCapture(drag);}catch{}
 e.preventDefault();
});
panel.addEventListener("pointermove",e=>{
 if(drag!==e.pointerId)return;
 const svg=panel.querySelector("svg"), ct=svg?.getScreenCTM?.();
 if(!ct)return;
 const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
 const hit=p.matrixTransform(ct.inverse());
 const angle=Math.atan2(Math.max(0,210-hit.x),Math.max(0.5,134-hit.y))*degrees;
 changeAngle(angle);
});
for(const ev of ["pointerup","pointercancel","lostpointercapture"])panel.addEventListener(ev,e=>{if(drag===e.pointerId)drag=null;});
function render(){
 const i=state.step,s=steps[i],finished=i===finish;
 $("progress").textContent="任務 "+(i+1)+" / "+steps.length;$("mission-title").textContent=s.name;$("guide").textContent=s.intro;
 $("steps").innerHTML=steps.map((x,n)=>'<button type="button" data-step="'+n+'" aria-label="任務 '+(n+1)+'：'+x.name+'"'+(n===i?' aria-current="step"':"")+(n>unlock(state.rows)?" disabled":"")+'>'+(n+1)+'</button>').join("");
 document.querySelector(".lab").hidden=finished;$("challenge").hidden=!finished;$("back-quiz").hidden=!finished;
 if(!finished){
  renderOptics();
  const paired=(s.pair||s.keys).filter(k=>state.rows.includes(k));
  $("compare").innerHTML=paired.map(k=>{const q=view(k);return '<article><b>'+q.name+'</b><span>入射 '+incidence(q)+'</span><span>'+(q.scene==="mirror"?"反射 "+fmt(q.reflected):q.outcome==="tir"?transmission(q):"折射 "+transmission(q))+'</span></article>';}).join("");
  $("redo").hidden=replay>=0||!s.keys.every(k=>state.rows.includes(k));
 }
 $("notebook").innerHTML=state.rows.length?'<table class="readings-table"><caption>已記下的光路讀值</caption><thead><tr><th scope="col">介面</th><th scope="col">入射</th><th scope="col">反射</th><th scope="col">折射</th></tr></thead><tbody>'+state.rows.map(k=>{const x=view(k);return '<tr data-record="'+k+'"><td>'+x.name+'</td><td>'+incidence(x)+'</td><td>'+fmt(x.reflected)+'</td><td>'+transmission(x)+'</td></tr>';}).join("")+'</tbody></table>':'<p class="explain">觀察後記下讀值，你會在這裡看到比較紀錄。</p>';
 $("notice").innerHTML=notice+(notice.startsWith("另一個")?' <button type="button" id="resync">載入較新的紀錄</button>':"");
 if(finished){
  $("questions").innerHTML=quiz.map((x,i)=>'<fieldset><legend>'+(i+1)+'. '+x.q+'</legend>'+x.o.map((v,j)=>'<button type="button" data-answer="'+i+':'+j+'" aria-pressed="'+(state.answers[i]===j)+'">'+v+'</button>').join("")+(state.answers[i]===null?"":'<p class="explain">'+(state.answers[i]===x.ok?x.why:"回到手札對照入射角和光路，再試一次。")+'</p>')+'</fieldset>').join("");
  $("done").textContent=quiz.every((x,i)=>x.ok===state.answers[i])?"完成！你能用法線、光路和讀值說明反射與折射。":"";
 }
}
function go(i){state.step=i;initial();persist();render();$(i===finish?"quiz-title":"mission-title").focus();}
$("act").onclick=()=>{
 if(state.step===finish)return;
 const a=action;toast="";
 if(a.kind==="next"){go(state.step+1);return;}
 if(a.kind==="set"){active=a.key;angleOverride=null;render();$("act").focus({preventScroll:true});return;}
 if(a.kind==="record"&&!state.rows.includes(a.key)){state.rows.push(a.key);toast=persist()?"這筆已記下。":"這筆只留在本頁，未存入瀏覽器。";}
 if(a.kind==="peek")replay++;
 render();$("act").focus({preventScroll:true});
};
$("redo").onclick=()=>{replay=0;active=steps[state.step].seed;angleOverride=null;toast="只重看光路，不清除或重複儲存。";render();$("act").focus();};
$("steps").onclick=e=>{const b=e.target.closest("[data-step]");if(b&&+b.dataset.step<=unlock(state.rows))go(+b.dataset.step);};
$("questions").onclick=e=>{const b=e.target.closest("[data-answer]");if(!b)return;const id=b.dataset.answer,[i,j]=id.split(":").map(Number);state.answers[i]=j;persist();render();$("questions").querySelector('[data-answer="'+id+'"]').focus({preventScroll:true});};
$("clear").onclick=()=>{$("clear-dialog").returnValue="";$("clear-dialog").showModal();};
$("clear-dialog").addEventListener("close",()=>{if($("clear-dialog").returnValue!=="clear")return;if(!persist(true)){render();return;}state=fresh();initial();render();$("mission-title").focus();});
window.addEventListener("storage",e=>{if((e.key===key||e.key===null)&&e.newValue!==stamp){notice="另一個分頁更新了紀錄。先載入較新的紀錄才不會覆蓋。";render();}});
$("notice").addEventListener("click",e=>{if(e.target.id==="resync"){try{stamp=localStorage.getItem(key);state=decode(stamp);initial();notice="已載入較新的紀錄。";}catch{notice="目前無法載入。";}render();}});
render();
})();
