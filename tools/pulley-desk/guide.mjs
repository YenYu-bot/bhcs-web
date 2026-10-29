// Presentation-only journey. It never mutates experiment state or grants evidence.
export function guideState(run,records,pair){
 const fixed=records.some(r=>r.device==='fixed'),movable=records.some(r=>r.device==='movable');
 const correct=pair&&Object.values(pair.work).length===4&&Object.values(pair.work).every(v=>v===200);
 if(run&&run.phase!=='recorded'){
  const d=run.device==='fixed',title=d?'定滑輪':'動滑輪',number=d?1:2;
  if(run.phase==='atTarget')return {number,key:'save',title:`收下${title}這一輪`,action:'看下方三格讀值，再按「收下觀察」。',where:'操作區下方的薄荷色「收下觀察」按鈕',goal:'升高20cm已提交；按下收下才成為比較證據。',target:'save-record',cta:`收下${title}觀察`,activate:true};
  return {number,key:'lift',title:`${title}：把重物升到20cm`,action:`抓住圖中黃色「拉繩」把手，${d?'向下 ↓':'向上 ↑'}拖，放手提交；也可按下方「提升重物5cm」。`,where:'圖中黃色把手；鍵盤可用'+(d?'↓':'↑')+'，Shift一次5cm',goal:'重物升高到20cm後，收下這輪觀察。可分次拉，不必一次完成。',target:'rope-handle',cta:'找到黃色拉繩把手',activate:false};
 }
 if(!fixed||!movable){const device=!fixed?'fixed':'movable',title=device==='fixed'?'定滑輪':'動滑輪';return {number:device==='fixed'?1:2,key:'start',device,title:`${fixed||movable?'接著做':'先開始'}${title}`,action:`按下「開始${title}」，再把同一個10N重物升高20cm。`,where:'下面這顆主要按鈕會開啟新一輪，不改已收下的觀察。',goal:`${fixed||movable?'第一種裝置已有證據，還需要另一種。':'先定滑輪，再動滑輪；各收下一筆才進入比較。'}`,target:run?'switch-device':`start-${device}`,cta:`${fixed||movable?'下一步：':''}開始${title}`,activate:true};}
 if(!correct)return {number:3,key:'calculate',title:'用兩筆觀察，自己算四格功',action:'到比較區，先讀兩張證據卡。把cm換成m，再填定、動滑輪的輸入功與輸出功，按「核對我的計算」。',where:'頁面下方「換你算算看」的四個輸入框',goal:'四格核對正確，才開啟文字解釋；需要時再自行開啟算式提示。',target:'fixed-input',cta:'下一步：前往四格計算',activate:false};
 if(!pair.revisions.length)return {number:4,key:'explain',title:'最後，用數字寫下你的解釋',action:'說明哪種較省力、拉繩距離如何改變，以及兩者功的關係，再按「另存這次解釋」。',where:'比較區下方「我的解釋」文字框',goal:'至少寫下一段自己的說明；不以關鍵字自動評分。',target:'explanation-text',cta:'下一步：寫下我的解釋',activate:false};
 return {number:4,key:'done',title:'本次四步都完成了',action:'你已留下兩筆觀察、四格計算與解釋。可以回看手札，或繼續開新輪探索。',where:'完成區與原始觀察手札',goal:'完成本次模擬比較，不代表已熟練真實滑輪操作。',target:'completion',cta:'查看本次完成與解釋',activate:false};
}
