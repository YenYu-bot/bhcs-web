# 自然六站包整合與圖解修正

基準 main：`d981db0abfbdc6dc96eced9c51e34d1c2dbf5c85`（S1 #79、G9 r10 #80 的兩個 workflow 全綠後合併）。
來源：`claude-science-6-stations-s11.zip`；S1 已在 main，本次新增 S2、S3、S7、S13、S11，共五站。

第一個 commit：11 個來源檔與原包逐位元組相同；正式四個 builder 與 build_sitemap.py 產出 HTML／教案／目錄，沒有手改 HTML。目錄 35 資源，研究站 26 站，sitemap 101 URLs。
第二個獨立 commit：修復兩個新增站的圖解邊界與平面鏡近距離標籤。只改 diagrams.mjs、新增模型測試，並由 builder 重建所有內嵌圖解的生成頁；models.mjs、runtime.js 與教案／題目均未改。

## 可重現缺陷

共同 SVG viewBox 為 0 0 660 400，且 scene-clip 固定裁切此範圍。

- 槓桿：w1=10、d1=20、f2=20、d2=50、angle=30。橘色力箭頭末端 (684.1,301.3) 超過右界，箭頭與數值消失。現在按可用空間縮短示意箭頭，數值標籤留在圖內；力矩、有效力臂與箭頭方向不變。
- 平面鏡：mode=mirror、incident=85、dist=5。上方入射線端點 (366.9,-29.4)，下方反射線端點 (220,556)，分別超出上下邊界。現在只縮短射線畫出的長度，保留方向、反射角、像距與延長線交點。
- dist=5 時兩個距離標籤中心僅相距 25，文字重疊。現在使用置中錨點及至少 64 的間距。

## 驗證

- 原包正式 npm test 全通過：35 模型組、16 生成站核心操作／axe、illustrations、experience、inquiry；數學 P2 3924/3924，784800 樣本，verify 失敗／例外／耗盡 0。
- integration：107 HTML、1377 local references、101 sitemap URLs；P1 舊頁保護通過。
- batch1–5：26 站＋目錄全通過。
- 修正後：36 模型組通過，新增 36 組槓桿＋12 組鏡面控制極值驗證主要光線／力箭頭端點在圖內及距離標籤間距；完整 science UI／axe 再次通過，integration 再次通過；最終四個 builder SHA-256 冪等。
- 6 個 OpenStax 來源頁均已開啟，章節／標題對應。
- 本機 Chromium 下載回傳無效 ZIP，未取得真正瀏覽器驗收。composition、operations、列印與 P1 快照仍由 CI。新 PR 本轮不查 CI、不合併。
- before/after SVG 幾何圖已另行檢視；不冒稱瀏覽器截圖。原包 review 未提交。

## 供 Claude 審閱的來源 diff

```diff
diff --git a/scripts/science/diagrams.mjs b/scripts/science/diagrams.mjs
index 03ebba4..ff2e92e 100644
--- a/scripts/science/diagrams.mjs
+++ b/scripts/science/diagrams.mjs
@@ -100,7 +100,10 @@ export function diagram(id,s,r){
   const F=[330,196],sc=5.4,phi=(r.kind==='left'?-8:r.kind==='right'?8:0)*Math.PI/180,u=[Math.cos(phi),Math.sin(phi)];
   const at=d=>[num(F[0]+d*sc*u[0],1),num(F[1]+d*sc*u[1],1)],L=at(-52),R=at(52),W=at(-s.d1),A=at(s.d2);
   const th=s.angle*Math.PI/180,dir=[u[0]*Math.cos(th)-u[1]*Math.sin(th),u[0]*Math.sin(th)+u[1]*Math.cos(th)];
-  const len=30+s.f2*4,tip=[num(A[0]+dir[0]*len,1),num(A[1]+dir[1]*len,1)];
+  // Keep the force arrow inside the scene at every supported angle and arm length.
+  const xRoom=Math.abs(dir[0])<1e-9?Infinity:(dir[0]>0?620-A[0]:A[0]-40)/Math.abs(dir[0]);
+  const yRoom=Math.abs(dir[1])<1e-9?Infinity:(dir[1]>0?350-A[1]:A[1]-50)/Math.abs(dir[1]);
+  const len=Math.min(30+s.f2*4,xRoom,yRoom),tip=[num(A[0]+dir[0]*len,1),num(A[1]+dir[1]*len,1)];
   const k=(F[0]-A[0])*dir[0]+(F[1]-A[1])*dir[1],foot=[num(A[0]+dir[0]*k,1),num(A[1]+dir[1]*k,1)];
   out+=`<path d="M${F[0]},${F[1]} L${F[0]-26},${F[1]+48} L${F[0]+26},${F[1]+48} Z" fill="#9aaeb9"/>`+line(F[0]-60,F[1]+48,F[0]+60,F[1]+48,'#607e8d');
   out+=`<line x1="${L[0]}" y1="${L[1]}" x2="${R[0]}" y2="${R[1]}" stroke="#8a5a2b" stroke-width="10" stroke-linecap="round"/>`;
@@ -109,7 +112,7 @@ export function diagram(id,s,r){
   const box=18+s.w1*1.4;out+=line(W[0],W[1],W[0],num(W[1]+46,1),'#436779')+rect(num(W[0]-box/2,1),num(W[1]+46,1),num(box,1),num(box,1),'#607e8d')+text(num(W[0]-22,1),num(W[1]+box+68,1),s.w1+' N',16)+text(num(W[0]-26,1),num(W[1]-14,1),s.d1+' cm',14);
   // 右側施力：作用線（灰虛線）、力箭頭（橘）、有效力臂（紅虛線）與直角記號
   const ext=520;out+=`<line x1="${num(A[0]-dir[0]*ext,1)}" y1="${num(A[1]-dir[1]*ext,1)}" x2="${num(A[0]+dir[0]*ext,1)}" y2="${num(A[1]+dir[1]*ext,1)}" stroke="#9aaeb9" stroke-width="1.5" stroke-dasharray="4 4"/>`;
-  out+=arrow(A[0],A[1],tip[0],tip[1],'#d97b11')+text(num(tip[0]+8,1),num(tip[1]+6,1),s.f2+' N',16)+text(num(A[0]-20,1),num(A[1]-14,1),s.d2+' cm',14);
+  out+=arrow(A[0],A[1],tip[0],tip[1],'#d97b11')+text(num(Math.min(605,tip[0]+8),1),num(tip[1]>320?tip[1]-18:tip[1]+24,1),s.f2+' N',16)+text(num(A[0]-20,1),num(A[1]-14,1),s.d2+' cm',14);
   out+=`<line data-arm x1="${F[0]}" y1="${F[1]}" x2="${foot[0]}" y2="${foot[1]}" stroke="#b54a5b" stroke-width="5" stroke-dasharray="9 5"/>`;
   if(Math.hypot(foot[0]-A[0],foot[1]-A[1])>12){const b=[foot[0]-dir[0]*10,foot[1]-dir[1]*10],n=[F[0]-foot[0],F[1]-foot[1]],nl=Math.hypot(n[0],n[1])||1,c=[b[0]+n[0]/nl*10,b[1]+n[1]/nl*10],e=[foot[0]+n[0]/nl*10,foot[1]+n[1]/nl*10];out+=`<path d="M${num(b[0],1)},${num(b[1],1)} L${num(c[0],1)},${num(c[1],1)} L${num(e[0],1)},${num(e[1],1)}" fill="none" stroke="#b54a5b" stroke-width="1.5"/>`}
   out+=circle(F[0],F[1],5,'#142f46')+text(20,36,'左側力矩 '+num(r.left,2)+' N·m　右側力矩 '+num(r.right,2)+' N·m',18);
@@ -188,15 +191,15 @@ export function diagram(id,s,r){
    out+=text(20,36,r.kind==='tir'?'全反射（進階）：入射角 '+th+'° ＞ 臨界角 '+num(r.critical,2)+'°':'n₁ sinθ₁ ＝ n₂ sinθ₂',18)+text(20,384,'灰色虛線是法線；角度都從法線量起。細虛線是部分反射光。',14);
   }else{
    // 上：一條光線在鏡面反射（法線水平）；下：物與像
-   const MX=380,H=[MX,120],th=s.incident,L=150;
+   const MX=380,H=[MX,120],th=s.incident,L=Math.min(150,85/Math.max(sn(th),1e-9));
    out+=line(MX,56,MX,356,'#436779');for(let y=60;y<=350;y+=14)out+=line(MX,y,MX+10,y-8,'#9aaeb9');
    out+=normal(MX-190,120,MX,120)+ray(H[0]-L*cs(th),H[1]-L*sn(th),H[0],H[1],'#d97b11')+ray(H[0],H[1],H[0]-L*cs(th),H[1]+L*sn(th),'#087b78');
    out+=arc(H,180,180-th,50,'#d97b11')+arc(H,180,180+th,74,'#087b78')+tag(34,100,'入射角 '+th+'°','#d97b11')+tag(34,196,'反射角 '+th+'°','#087b78');
    const sc=5,base=330,top=260,ox=MX-s.dist*sc,ix=MX+s.dist*sc,flag=(x,dir,dash)=>`<path d="M${x},${base} L${x},${top} L${x+dir*22},${top} M${x},${top+22} L${x+dir*15},${top+22}" fill="none" stroke="${dash?'#7c879b':'#142f46'}" stroke-width="4"${dash?' stroke-dasharray="6 4"':''}/>`;
    out+=flag(ox,1,false)+flag(ix,-1,true)+text(ox-8,base+22,'物',15)+text(ix-8,base+22,'像',15);
    const M2=[MX,300];out+=ray(ox,top,MX,top,'#b54a5b',2)+ray(MX,top,ox-40,top,'#b54a5b',2)+ray(MX,top,ix,top,'#b54a5b',2,'5 4');
-   const k=(M2[1]-top)/(MX-ox);out+=ray(ox,top,M2[0],M2[1],'#b54a5b',2)+ray(M2[0],M2[1],M2[0]-160,M2[1]+160*k,'#b54a5b',2)+ray(M2[0],M2[1],ix,top,'#b54a5b',2,'5 4');
-   out+=line(ox,base,ix,base,'#9aaeb9')+text(num((ox+MX)/2-20,1),base+44,s.dist+' cm',14)+text(num((MX+ix)/2-20,1),base+44,s.dist+' cm',14);
+   const k=(M2[1]-top)/(MX-ox),rayRun=Math.min(160,70/k);out+=ray(ox,top,M2[0],M2[1],'#b54a5b',2)+ray(M2[0],M2[1],M2[0]-rayRun,M2[1]+rayRun*k,'#b54a5b',2)+ray(M2[0],M2[1],ix,top,'#b54a5b',2,'5 4');
+   out+=line(ox,base,ix,base,'#9aaeb9')+`<text data-object-distance x="${num(Math.min(MX-32,(ox+MX)/2),1)}" y="${base+44}" text-anchor="middle" font-size="14">${s.dist} cm</text><text data-image-distance x="${num(Math.max(MX+32,(MX+ix)/2),1)}" y="${base+44}" text-anchor="middle" font-size="14">${s.dist} cm</text>`;
    out+=text(20,36,'反射角＝入射角；像距＝物距',18)+text(430,90,'虛線：反向延長線',14);
   }
   break;
diff --git a/scripts/test_science_models.mjs b/scripts/test_science_models.mjs
index cb5624b..764474d 100644
--- a/scripts/test_science_models.mjs
+++ b/scripts/test_science_models.mjs
@@ -166,6 +166,26 @@ test('Lever torque: balanced default / slanted pull / sin symmetry / effective a
   const m=svg.match(/<line data-arm x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/);assert.ok(m,'effective arm line missing');
   assert.ok(Math.abs(Math.hypot(m[3]-m[1],m[4]-m[2])/5.4-q.effective)<0.1,`arm ${angle} ${d2}`);}
 });
+test('Lever force and mirror rays stay inside the 660 by 400 diagram at control extremes',()=>{
+ const check=(id,values,selector)=>{
+  const s={...defaults(id),...values},dom=new JSDOM(diagram(id,s,calculate(id,s)));
+  const rays=[...dom.window.document.querySelectorAll(selector)];assert.ok(rays.length,id+' missing visible ray');
+  for(const ray of rays)for(const end of ['1','2']){
+   const x=Number(ray.getAttribute('x'+end)),y=Number(ray.getAttribute('y'+end));
+   assert.ok(x>=8&&x<=652&&y>=8&&y<=392,`${id} ${JSON.stringify(values)} clipped endpoint (${x},${y})`);
+  }
+  if(id==='reflection-refraction'){
+   const labels=['data-object-distance','data-image-distance'].map(attr=>dom.window.document.querySelector('['+attr+']'));
+   assert.ok(labels.every(Boolean),'distance labels missing');
+   assert.ok(Number(labels[1].getAttribute('x'))-Number(labels[0].getAttribute('x'))>=64,'near-mirror distance labels overlap');
+  }
+  dom.window.close();
+ };
+ for(const angle of [30,90,150])for(const d2 of [5,40,50])for(const f2 of [1,20])for(const w1 of [1,20])
+  check('lever-torque',{angle,d2,f2,w1},'line[stroke="#d97b11"]');
+ for(const incident of [0,30,60,85])for(const dist of [5,20,50])
+  check('reflection-refraction',{mode:'mirror',incident,dist},'line[stroke="#d97b11"],line[stroke="#087b78"],line[stroke="#b54a5b"]');
+});
 test('Motion graphs: reversing / stops exactly at t / rest / area bookkeeping',()=>{
  const r=calc('motion-graphs');close(r.v,-10);close(r.x,0);close(r.path,20);assert.equal(r.kind,'reversing');close(r.turn,2);
  const e=calc('motion-graphs',{t:2});close(e.v,0);close(e.x,10);close(e.path,10);assert.equal(e.kind,'slowing');assert.equal(e.turn,null);
```
