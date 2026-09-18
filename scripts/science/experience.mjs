import fs from 'node:fs';
import path from 'node:path';
import {inquiry} from './inquiry.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const firstGuides={
 'microscope-lab':['高倍時，為什麼看見的細胞反而變少？','選一份標本，從 4× 物鏡開始，把影像調清楚。','拖動下方玻璃試片，觀察影像往哪裡移；再換 10×、40× 物鏡比較。','各記錄一筆低倍與高倍結果，說出視野直徑和比例尺的差異。','experiment'],
 'genetics-simulation-lab':['兩株高莖豌豆，能生出矮莖子代嗎？','保留「莖高」與兩個異合親代。Tt 表示一個 T、一個 t；每個配子只帶其中一個。','預測後完成雜交。點四格中的任一格，看兩個配子如何形成子代。','抽樣 4 個，再抽樣 1000 個：比較實際比例與理論比例，不只背 3：1。','crossLab'],
 'force-motion-lab':['相同的推力，為什麼加速程度可能不同？','先保留預設值，預測加速度方向，再按開始。注意「速度方向」不一定等於「加速度方向」。','上方看車的位置，下方看分開排列的施力、摩擦與合力；可暫停，再逐步前進。','第一筆記錄後，只改質量或接觸面，再比較合力與加速度。','experiment'],
 'circuit-lab':['增加一顆燈泡，總電流一定變小嗎？','先用單一燈泡，保留電壓與電阻，選預測後按「通電驗證」。','只改接法為串聯，再改並聯；每次重新預測，讀取總電流和各燈電壓。','保留三筆紀錄，指出串聯和並聯的電流路徑差在哪裡。','experiment'],
 'particle-reaction-lab':['化學反應後，原子有沒有變少？','選擇反應，先看兩種反應物的分子數，再預測哪一種會先用完。','開始反應，對照反應前後每種顏色代表的原子數與剩餘分子。','只增加一種反應物再比較，說明為何反應物增加卻不一定產生更多產物。','experiment'],
 'plate-earthquake-lab':['地震從哪裡開始，又如何找出位置？','先選一種板塊邊界，預測可能地形，再觀察兩側移動方向。','比較張裂、聚合、錯動；再到震央定位，用測站資料判斷距離。','找出多個距離圓的交會區，分清震源與地表上的震央。','experiment'],
 'heat-phase-lab':['一直加熱，溫度就會一直上升嗎？','先看目前物態，預測加熱後的變化，再開始觀察加熱曲線。','對照曲線斜段與水平段，同時讀取溫度、物態和吸收能量。','各記錄一次升溫與相變，說明能量增加時溫度是否一定改變。','experiment'],
 'buoyancy-density-lab':['物體很重，就一定會沉下去嗎？','選定物體與液體，預測浮沉，再放入液體觀察。','比較重力、浮力與排開液體；只改密度或體積，其他條件固定。','記錄兩組結果，用密度和受力解釋，不只用大小猜浮沉。','experiment'],
 'acid-base-indicator-lab':['兩杯液體混合，怎麼判斷最後酸鹼？','讀取酸與鹼的濃度和體積，選指示劑，先預測混合結果。','混合後對照 pH、顏色與剩餘酸鹼；不要只比較兩杯體積。','只改其中一個條件，重新預測並記錄，用莫耳數差異解釋。','experiment'],
 'photosynthesis-factor-lab':['燈越亮，植物的光合作用就一定越快嗎？','保留二氧化碳與溫度，只改光照，先預測速率變化。','開始觀察，記下速率，再只增加光照；注意是否已接近平台。','改變二氧化碳再比較，說明哪個因素限制了目前的速率。','experiment'],
};
function route(question,steps,links,predictionFree=false){const labels=predictionFree?['01　領取任務','02　操作與觀察','03　比較與解釋']:['01　先準備與預測','02　操作與觀察','03　比較與解釋'];return `<aside class="lesson-route" aria-labelledby="self-study-title"><h2 id="self-study-title">${predictionFree?'余老師任務卡':'自學起點'}：${escape(question)}</h2><p>${predictionFree?'第一次使用，照這三步做；直接操作並留下可以比較的觀察證據。':'第一次使用，照這三步做；預測猜錯沒關係，重點是能用觀察修正想法。'}</p><ol class="route-steps">${steps.map((s,i)=>`<li><b>${labels[i]}</b><p>${escape(s)}</p><a href="${links[i]}">${['前往操作','看觀察區','前往檢核'][i]} →</a></li>`).join('')}</ol></aside>`}
function block(html,key,content,anchor){const re=new RegExp(`<!-- ${key}:start -->[\\s\\S]*?<!-- ${key}:end -->\\n?`);html=html.replace(re,'');if(!html.includes(anchor))throw Error('Missing experience anchor '+anchor);return html.replace(anchor,`<!-- ${key}:start -->\n${content}\n<!-- ${key}:end -->\n`+anchor)}
export function enhanceLessons(root,firstBatch,batch2){
 const css=fs.readFileSync(path.join(root,'scripts/science/experience.css'),'utf8');
 const studyJS=fs.readFileSync(path.join(root,'scripts/science/study.js'),'utf8');
 for(const item of [...firstBatch.map(file=>({file,id:file.replace('.html','')})),...batch2.map(t=>({...t,file:'science/'+t.id+'.html'}))]){
  const file=path.join(root,'tools',item.file);let html=fs.readFileSync(file,'utf8');
  const predictionFree=["microscope-lab","genetics-simulation-lab","force-motion-lab","circuit-lab","particle-reaction-lab","heat-phase-lab"].includes(item.id)||item.noPrediction===true;
  const known=firstGuides[item.id];if(known){const actual=html.match(/<section id="([^"]+)" class="labgrid"/);if(actual)known[4]=actual[1];}
  let guide=known?route(known[0],known.slice(1,4),['#'+known[4],'#'+known[4],'#quiz'],predictionFree):route(item.goals[0]+'，從哪裡開始？',[
   `先選引導任務「${item.tasks[0].title}」，它會準備好第一組條件。${item.tasks[0].prompt}`,
   predictionFree?'按「開始觀察」。對照圖解、讀值與下方說明；不知道術語時，先讀本頁的常見迷思。':'選好預測，按「操作並觀察」。對照圖解、讀值與下方說明；不知道術語時，先讀本頁的常見迷思。',
   '在「你的解釋」填入：我只改了＿＿，讀值從＿＿變成＿＿，所以＿＿。保存兩筆，再做三題檢核。'
  ],['#task-list','#experiment','#quiz'],predictionFree);
  html=block(html,'science-experience-style',`<style>${css}</style>`,'</head>');
  const lesson=inquiry[item.id];if(!lesson)throw Error('Missing inquiry lesson '+item.id);
  const study=`<details class="inquiry-guide" id="inquiry-guide"><summary>本課比較任務：固定什麼、只改什麼？</summary><dl>${lesson.slice(0,4).map((s,i)=>`<div><dt>${['保持不變','只改一個條件','記錄證據','完成標準'][i]}</dt><dd>${escape(s)}</dd></div>`).join('')}</dl><label for="study-note">用自己的話解釋（可選填，勿填姓名）</label><textarea id="study-note" rows="3" maxlength="1000" placeholder="我固定了＿＿，只改＿＿；觀察到＿＿，我的解釋是＿＿。"></textarea><details class="teacher-plan"><summary>教師帶領：15 分鐘比較活動</summary><ol><li>3 分鐘：讀「保持不變」與「只改一個條件」，${predictionFree?'確認這次要比較什麼。':'讓學生先說預測理由。'}</li><li>7 分鐘：完成兩筆觀察。${escape(lesson[4])}</li><li>5 分鐘：同學交換證據，以「完成標準」檢查解釋，再做頁面檢核。</li></ol><p>若學生仍卡住：先請他指著畫面讀出一個數值，再說另一組如何不同，不必一次背出全部術語。</p></details></details><fieldset class="study-checks"><legend>我的自學進度（自己確認，不代表測驗成績）</legend>${(predictionFree?['已完成第一筆觀察或說出目前看到什麼','已完成兩組比較','能引用證據解釋差異']:['已寫下預測或說出理由','已完成兩組比較','能引用證據解釋差異']).map((s,i)=>`<label><input type="checkbox" data-study-step="${i}">${s}</label>`).join('')}<p id="study-progress" role="status" aria-live="polite">已確認 0／3 項</p></fieldset><div class="study-storage"><span id="study-save-status">進度與筆記只儲存在這台瀏覽器。</span><button type="button" id="study-clear">清除自學進度與筆記</button></div>`;
  guide=guide.replace('</aside>',study+'</aside>');
  html=block(html,'science-study-script',`<script>${studyJS}</script>`,'</body>');
  if(item.id==='genetics-simulation-lab'){
   html=block(html,'genetics-art','<figure class="science-art"><img src="../assets/science/pea-phenotypes.webp" width="1536" height="1024" alt="豌豆高莖與矮莖外觀插畫，左高右矮"><figcaption>高莖與矮莖的外觀示意。這張插畫用來認識性狀，不代表子代比例。</figcaption></figure>','<div class="hiddenStage"');
  }
  const art=item.id==='ecosystem'?['meadow-context.webp','草、兔、昆蟲、鳥與狐的草地情境插畫','先在情境圖找出生物，再用下方食物網追蹤能量方向。插畫不是族群數量或真實比例。']:['plant-exchange','photosynthesis-factor-lab'].includes(item.id)?['plant-context.webp','窗邊綠色植株與盆栽的情境插畫','先想一想：白天的植物也會呼吸嗎？插畫用來連結生活情境，實驗數值以模型讀值為準。']:null;
  if(art){const prefix=known?'../':'../../';const figure=`<details class="context-art"><summary>從生活情境開始觀察</summary><figure class="science-art"><img src="${prefix}assets/science/${art[0]}" width="1536" height="1024" loading="lazy" alt="${art[1]}"><figcaption>${art[2]}</figcaption></figure></details>`;if(known)guide=guide.replace('</aside>',figure+'</aside>');else html=block(html,'science-context-art',figure.replace('<details class="context-art"><summary>從生活情境開始觀察</summary>','<div class="context-preview">').replace('</details>','</div>'),'<div class="stage" id="diagram"');}
  html=html.replace(/<!-- science-self-study:start -->[\s\S]*?<!-- science-self-study:end -->\n?/,'');
  html=html.replace(/(<main\b[^>]*>)/,`$1\n<!-- science-self-study:start -->\n${guide}\n<!-- science-self-study:end -->`);
  if(!known)html=html.replace('<h2>引導任務</h2>','<h2 id="task-list">引導任務</h2>');
  fs.writeFileSync(file,html);
 }
}
