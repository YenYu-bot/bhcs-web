import fs from 'node:fs';
import path from 'node:path';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const firstGuides={
 'microscope-lab':['高倍時，為什麼看見的細胞反而變少？','選一份標本，預測高倍視野。開始後先用 4× 物鏡，把影像調清楚。','拖動下方玻璃試片，觀察影像往哪裡移；再換 10×、40× 物鏡比較。','各記錄一筆低倍與高倍結果，說出視野直徑和比例尺的差異。','experiment'],
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
function route(question,steps,links){return `<aside class="lesson-route" aria-labelledby="self-study-title"><h2 id="self-study-title">自學起點：${escape(question)}</h2><p>第一次使用，照這三步做；預測猜錯沒關係，重點是能用觀察修正想法。</p><ol class="route-steps">${steps.map((s,i)=>`<li><b>${['01　先準備與預測','02　操作與觀察','03　比較與解釋'][i]}</b><p>${escape(s)}</p><a href="${links[i]}">${['前往操作','看觀察區','前往檢核'][i]} →</a></li>`).join('')}</ol></aside>`}
function block(html,key,content,anchor){const re=new RegExp(`<!-- ${key}:start -->[\\s\\S]*?<!-- ${key}:end -->\\n?`);html=html.replace(re,'');if(!html.includes(anchor))throw Error('Missing experience anchor '+anchor);return html.replace(anchor,`<!-- ${key}:start -->\n${content}\n<!-- ${key}:end -->\n`+anchor)}
export function enhanceLessons(root,firstBatch,batch2){
 const css=fs.readFileSync(path.join(root,'scripts/science/experience.css'),'utf8');
 for(const item of [...firstBatch.map(file=>({file,id:file.replace('.html','')})),...batch2.map(t=>({...t,file:'science/'+t.id+'.html'}))]){
  const file=path.join(root,'tools',item.file);let html=fs.readFileSync(file,'utf8');
  const known=firstGuides[item.id];if(known){const actual=html.match(/<section id="([^"]+)" class="labgrid"/);if(actual)known[4]=actual[1];}
  let guide=known?route(known[0],known.slice(1,4),['#'+known[4],'#'+known[4],'#quiz']):route(item.goals[0]+'，從哪裡開始？',[
   `先選引導任務「${item.tasks[0].title}」，它會準備好第一組條件。${item.tasks[0].prompt}`,
   '選好預測，按「操作並觀察」。對照圖解、讀值與下方說明；不知道術語時，先讀本頁的常見迷思。',
   '在「你的解釋」填入：我只改了＿＿，讀值從＿＿變成＿＿，所以＿＿。保存兩筆，再做三題檢核。'
  ],['#task-list','#experiment','#quiz']);
  html=block(html,'science-experience-style',`<style>${css}</style>`,'</head>');
  if(item.id==='genetics-simulation-lab'){
   html=block(html,'genetics-art','<figure class="science-art"><img src="../assets/science/pea-phenotypes.webp" width="1536" height="1024" alt="豌豆高莖與矮莖外觀插畫，左高右矮"><figcaption>高莖與矮莖的外觀示意。這張插畫用來認識性狀，不代表子代比例。</figcaption></figure>','<div class="hiddenStage"');
  }
  html=html.replace(/<!-- science-self-study:start -->[\s\S]*?<!-- science-self-study:end -->\n?/,'');
  html=html.replace(/(<main\b[^>]*>)/,`$1\n<!-- science-self-study:start -->\n${guide}\n<!-- science-self-study:end -->`);
  if(!known)html=html.replace('<h2>引導任務</h2>','<h2 id="task-list">引導任務</h2>');
  fs.writeFileSync(file,html);
 }
}
