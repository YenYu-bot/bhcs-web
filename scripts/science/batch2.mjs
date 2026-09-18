const range=(key,label,min,max,step,value,unit='')=>({key,label,min,max,step,value,unit});
const select=(key,label,options,value)=>({key,label,options,value});
const quiz=(question,options,answer,tip)=>({question,options,answer,tip});
const task=(title,values,prompt)=>({title,values,prompt});
export const batch2 = [
 {
 id:'optics',title:'光學與透鏡成像實驗室',subject:'理化',grade:'國中',unit:'光學',minutes:'15–20',prior:'直線傳播、焦點、比例',
 description:'調整凸凹透鏡與物距，從兩條光線和像距讀值判斷實像、虛像與焦點奇異情況。',
 goals:['辨認實像與虛像的不同','比較物距、像距與放大率','說明物體在焦點時為何無法在有限距離成像'],
 controls:[select('kind','透鏡種類',[['convex','凸透鏡'],['concave','凹透鏡']],'convex'),range('f','焦距大小',5,30,1,10,'cm'),range('u','物距',2,100,1,30,'cm')],
 prediction:'依目前條件，會形成哪一類像？',choices:[['real','倒立實像'],['virtual','正立虛像'],['focus','沒有有限像距']],
 tasks:[task('① 物體在兩倍焦距外',{kind:'convex',f:10,u:30},'固定焦距10cm，比較物距30和40cm。像的位置與大小怎麼變？'),task('② 物體移到焦點內',{kind:'convex',f:10,u:5},'先猜像的方向與是否能投影，再和物距10cm比較。'),task('③ 換成凹透鏡',{kind:'concave',f:10,u:30},'保持物距，換成凹透鏡，觀察光線或反向延長線在哪裡相交。')],
 formula:'1/f = 1/u + 1/v；m = −v/u。凸透鏡 f>0，凹透鏡 f<0；實物 u>0。',
 limits:'理想薄透鏡、近軸光線；不計色差、球差及鏡片厚度。光線圖會等比例縮放以納入像的位置；焦點附近的極遠像可能讓物體顯得很小。虛線為反向延長線，不是真正反向行進的光。',
 misconception:'看得到虛像，不代表光線真的在虛像位置會合；實像是否清楚投在屏幕上，還要把屏幕放在像的位置。',
 safety:'不要用透鏡看太陽或聚焦陽光，本頁只提供安全模擬。',
 source:['OpenStax：透鏡成像','https://openstax.org/books/college-physics-2e/pages/25-6-image-formation-by-lenses'],related:[['../lenses.html','透鏡基礎教室'],['../convex-lens-imaging.html','凸透鏡成像演示']],
 quiz:[quiz('凸透鏡的物體位於焦點內時，形成？',['倒立實像','正立虛像','必定沒有像'],1,'將物距設為焦距的一半，觀察虛線交點。'),quiz('物體恰在凸透鏡焦點上，出射近軸光線？',['平行，無有限像距','在兩倍焦距相交','全部反射'],0,'平行光線不在有限距離交會。'),quiz('凹透鏡對實物形成的像通常？',['倒立放大','正立縮小','倒立等大'],1,'比較凹透鏡下的 v 正負與 |m|。')]
 },
 {
 id:'wave-sound',title:'波動、聲音與共振實驗室',subject:'理化',grade:'國中',unit:'波與聲',minutes:'15–20',prior:'頻率、週期與長度',
 description:'從波速、頻率與波長出發，比較開管與閉管的共振條件；不把音高和音量混為一談。',
 goals:['使用 v=fλ 解釋波長','比較開管與閉管的共振頻率','辨識位移的波節與波腹'],
 controls:[select('mode','觀察模型',[['travel','行進聲波'],['open','兩端開管'],['closed','一端閉管']],'travel'),range('f','驅動頻率',20,1000,1,340,'Hz'),range('v','聲速',300,360,1,340,'m/s'),range('length','管長／顯示長度',0.2,2,0.05,1,'m')],
 prediction:'目前條件的模型狀態是？',choices:[['travel','行進波比較'],['resonant','接近共振'],['off','偏離共振']],
 tasks:[task('① 頻率與波長',{mode:'travel',f:340,v:340,length:1},'只把頻率加倍，比較波長；注意聲速維持不變。'),task('② 開管基頻',{mode:'open',f:170,v:340,length:1},'固定長度1m，先預測170Hz的狀態，再比較250Hz。'),task('③ 閉管與開管',{mode:'closed',f:85,v:340,length:1},'比較85、170、255Hz，不要假設所有整數倍都能共振。')],
 formula:'λ=v/f。兩端開管 fₙ=nv/(2L)；一端閉管 fₙ=(2n−1)v/(4L)。',
 limits:'理想一維空氣柱，不計管徑、端點修正及損耗。差距不超過最近模態頻率3%時標記「接近共振」，3%是介面教學容差，不是真實共振峰寬。曲線是空氣質點的縱向位移以橫向曲線表示，不是粒子沿曲線跑。開口是位移波腹，閉口是位移波節；壓力分布相反。',
 misconception:'頻率關聯音高，振幅關聯音量；共振不表示聲速突然增加。',safety:'本頁不播放聲音，避免教室突然出現大音量。',
 source:['OpenStax：空氣柱共振','https://openstax.org/books/college-physics-2e/pages/17-5-sound-interference-and-resonance-standing-waves-in-air-columns'],related:[['../waves.html','波動基礎教室']],
 quiz:[quiz('同一介質中頻率加倍，波長？',['加倍','不變','減半'],2,'保持聲速，以 λ=v/f 比較。'),quiz('一端閉管相對基頻具有哪些理想共振頻率？',['只有偶數倍','奇數倍','所有頻率'],1,'基頻、3倍、5倍符合一端波節一端波腹。'),quiz('開管端點的位移與壓力？',['位移波腹、壓力波節','兩者都是波節','兩者都是波腹'],0,'位移曲線和壓力曲線不要混用。')]
 },
 {
 id:'electromagnetism',title:'電磁鐵、馬達與發電機實驗室',subject:'理化',grade:'國中',unit:'電與磁',minutes:'20–25',prior:'電流、磁場、能量',
 description:'比較電流產生磁場、線圈受到轉矩，以及轉動線圈產生感應電壓三種方向不同的關係。',
 goals:['比較匝數與電流對磁場的影響','判斷線圈角度與轉矩','用磁通量變化解釋發電'],
 controls:[select('mode','裝置',[['magnet','空心電磁鐵'],['motor','線圈轉矩'],['generator','交流發電機']],'magnet'),range('turns','線圈匝數',10,200,10,100,'匝'),range('current','電流（電磁鐵／轉矩）',-2,2,0.1,1,'A'),range('field','外加磁場（轉矩／發電）',-0.5,0.5,0.05,0.2,'T'),range('angle','法線相對向右基準軸角度（轉矩／發電）',0,360,5,90,'°'),range('rpm','轉速（發電）',0,600,10,60,'rpm')],
 prediction:'主要輸出（磁場／轉矩／感應電壓）的正負為何？',choices:[['positive','正方向'],['zero','零'],['negative','負方向']],
 tasks:[task('① 電流反向',{mode:'magnet',turns:100,current:1},'比較+1A與−1A；匝數不變時磁場方向與大小怎麼變？'),task('② 線圈轉矩',{mode:'motor',angle:0,current:1,field:0.2,turns:100},'保持磁場為正，比較法線相對向右基準軸角度0°、90°、180°。'),task('③ 停止轉動',{mode:'generator',angle:90,field:0.2,rpm:0,turns:100},'從靜止到60rpm；再把磁場反向，比較感應電壓。')],
 formula:'空心長螺線管 B=μ₀NI/ℓ（ℓ=0.20m）；τ=NBIA sinθ；ε=NBAω sinθ，ω=2π rpm/60，A=0.01m²。',
 limits:'電磁鐵採長螺線管近似；不計漏磁、鐵芯、電阻、發熱與反電動勢。馬達頁顯示當下轉矩而非自行推算轉速；發電機的轉速由外力維持。θ由固定向右基準軸量起；外加磁場B為有號分量，B<0代表向左，B=0時沒有磁場方向。轉矩正向取本圖順時針。正負只是固定繞線及法線約定，不是所有實際馬達的絕對方向。各模式只使用標示適用的控制。',
 misconception:'磁通量大不一定感應電壓大：電壓取決於磁通量改變的快慢。',safety:'不得短接電池或連接家用電源；真實線圈可能發熱。',
 source:['OpenStax：發電機','https://openstax.org/books/college-physics-2e/pages/23-5-electric-generators'],related:[['../dc-motor.html','直流馬達與換向器'],['../circuit-lab.html','電路實驗室']],
 quiz:[quiz('空心線圈電流反向，磁場？',['消失','方向反向','大小必定加倍'],1,'比較+I和−I。'),quiz('線圈法線平行磁場時轉矩？',['最大','無限大','零'],2,'此時 θ=0，sinθ=0。'),quiz('磁場固定，線圈完全停止且無其他變化時？',['沒有感應電壓','仍持續最大電壓','電壓隨時間增加'],0,'發電需要磁通量隨時間改變。')]
 },
 {
 id:'pressure-fluid',title:'氣壓、水壓與流體實驗室',subject:'理化',grade:'國中',unit:'壓力與流體',minutes:'15–20',prior:'力、面積、體積、密度',
 description:'分開觀察水深與液壓、密閉氣體的壓縮，以及水平管中截面、流速和壓力的關係。',
 goals:['分辨表壓和絕對壓力','在定溫條件下比較氣體壓縮','知道伯努力定律的使用限制'],
 controls:[select('mode','實驗',[['water','靜水壓'],['gas','定溫密閉氣體'],['flow','水平管內理想流動']],'water'),range('depth','深度（靜水）',0,10,0.5,2,'m'),range('density','液體密度（水壓／流動）',800,1200,50,1000,'kg/m³'),range('volume','氣體體積（氣體）',0.25,2,0.05,1,'L'),range('ratio','出口／入口面積比（流動）',0.4,2,0.1,1,''),range('speed','入口流速（流動）',0,4,0.5,2,'m/s')],
 prediction:'相對參考壓力101.3kPa，觀察位置的絕對壓力？',choices:[['higher','較高'],['same','相同'],['lower','較低']],
 tasks:[task('① 零深度與水下',{mode:'water',depth:0,density:1000},'比較0m和2m。表壓為零，是否代表完全沒有壓力？'),task('② 氣體壓縮一半',{mode:'gas',volume:0.5},'本模型維持溫度和氣體量不變；比較0.5L和1L。'),task('③ 窄管與流速',{mode:'flow',ratio:0.5,speed:2,density:1000},'只改變截面比，觀察出口流速和壓力；不要用此模型解釋所有風流。')],
 formula:'水壓 P=P₀+ρgh，g=9.8m/s²；定溫氣體 PV=P₀V₀，V₀=1L；水平流 A₁v₁=A₂v₂，P₂=P₁+ρ(v₁²−v₂²)/2。',
 limits:'氣體模型定溫、定量；流動模型為穩態、不可壓縮、無黏性、同高的同一流線，入口壓力固定101.3kPa；不計水泵與摩擦，不適用高速氣流或汽化。截面圖是截面積示意，不是精確管徑比例。',
 misconception:'「流速大、壓力小」需符合條件；不能拿不同高度或不同流線任意比較。',safety:'不要自行加壓密閉容器；實驗用壓力設備需教師指導。',
 source:['OpenStax：伯努力方程式','https://openstax.org/books/college-physics-2e/pages/12-2-bernoullis-equation'],related:[['../buoyancy-density-lab.html','浮力與密度']],
 quiz:[quiz('水面表壓0kPa代表？',['沒有大氣壓','與參考大氣壓相同','絕對壓力為零'],1,'表壓是扣除外界參考壓力後的差值。'),quiz('定溫定量氣體體積減半，絕對壓力？',['減半','不變','加倍'],2,'由 PV=常數判斷。'),quiz('本水平理想流動模型中出口面積減半，出口流速？',['加倍','減半','變零'],0,'體積流率 A×v 保持一致。')]
 },
 {
 id:'solubility',title:'溶解度與濃度實驗室',subject:'理化',grade:'國中',unit:'物質與溶液',minutes:'15–20',prior:'溶質、溶劑、質量百分率',
 description:'用明確標示的教學溶解度曲線，分辨已溶解質量、未溶固體與溶液濃度。',
 goals:['正確使用每100g水的溶解度','分辨飽和、未飽和與剩餘固體','計算質量百分濃度並比較冷卻析出'],
 controls:[select('solute','教學溶質模型',[['a','模型A：溫度敏感'],['b','模型B：變化較小']],'a'),range('temperature','溫度',0,80,5,20,'°C'),range('water','水的質量',50,200,10,100,'g'),range('soluteMass','加入溶質質量',0,150,5,50,'g')],
 prediction:'達到平衡後，是否有未溶固體？',choices:[['none','沒有，未飽和'],['edge','沒有，恰好飽和'],['solid','有剩餘固體']],
 tasks:[task('① 飽和與剩餘固體',{solute:'a',temperature:20,water:100,soluteMass:50},'先預測剩餘固體，再只增加水量。'),task('② 加熱與冷卻',{solute:'a',temperature:60,water:100,soluteMass:50},'記錄60°C的已溶解量，再降到20°C。兩筆相差多少？'),task('③ 濃度不是加入量除以水量',{solute:'b',temperature:20,water:100,soluteMass:100},'比較加入溶質與真正溶解的質量，算濃度時分母是哪一個？')],
 formula:'模型A：S=20+0.5T；模型B：S=35+0.025T（g/100g水）。容量=S×水量/100；已溶解=min(加入量,容量)；濃度=已溶解/(水+已溶解)×100%。',
 limits:'A、B是虛構的線性教學溶質，絕非硝酸鉀或食鹽的實測曲線。假設立即達平衡、不蒸發、不形成過飽和；只適用所示0–80°C範圍。真實溶解度需查該物質的實測資料。',
 misconception:'未溶解的固體不計入溶液質量百分濃度的分子或分母；攪拌通常改變速率，不等於改變平衡溶解度。',safety:'不提供可飲用或可混合的化學配方；本頁只做虛擬操作。',
 source:['NIST：實測溶解度資料庫','https://srdata.nist.gov/solubility/'],related:[['../particle-reaction-lab.html','粒子與化學反應']],
 quiz:[quiz('溶解度40g/100g水，50g水最多溶解？',['80g','40g','20g'],2,'水量減半，容量也減半。'),quiz('20g溶質完全溶於80g水，質量百分濃度？',['25%','20%','80%'],1,'分母為溶液總質量100g。'),quiz('本頁模型A能直接當作硝酸鉀實測資料嗎？',['可以','不可以，這是教學模型','只要改標題就可以'],1,'模型限制明確寫出A、B皆為虛構線性曲線。')]
 }
 ,{
 id:'energy',title:'能量轉換與守恆實驗室',subject:'理化',grade:'國中',unit:'力學與能量',minutes:'15–20',prior:'高度、速度、功與焦耳',
 description:'沿斜坡改變位置，追蹤重力位能、動能與摩擦產生的內能，檢查總能量帳。',
 goals:['比較位能下降與動能上升','把摩擦轉出的內能納入守恆','區分機械能守恆與總能量守恆'],
 controls:[range('mass','質量',0.5,5,0.5,1,'kg'),range('height','起始垂直高度',0.5,5,0.5,2,'m'),range('progress','沿斜坡下降比例',0,100,5,50,'%'),range('loss','位能減少量轉成內能的比例',0,100,5,0,'%')],
 prediction:'目前動能相對起點是？',choices:[['positive','大於零'],['zero','仍為零']],
 tasks:[task('① 無摩擦下坡',{mass:1,height:2,progress:50,loss:0},'記錄中點和坡底，檢查位能加動能。'),task('② 能量是否消失？',{mass:1,height:2,progress:100,loss:30},'和無摩擦比較，少掉的動能去了哪裡？'),task('③ 增加質量',{mass:2,height:2,progress:100,loss:0},'高度與損耗比例固定，質量加倍時能量和速度各如何改變？')],
 formula:'E₀=mgH；位能=mgH(1−s)；內能=mgHsη；動能=mgHs(1−η)；v=√(2gh下降(1−η))。g=9.8m/s²。',
 limits:'物體由靜止出發。以固定比例η描述沿程損耗，不是摩擦係數μ，也不是完整接觸力模型。η=100%僅表示指定位置的準靜態能量極限，不能解讀為物體會自行滑到該位置；位置由使用者指定，沒有求運動時間。',
 misconception:'有摩擦時機械能可以減少，但把系統內能納入後，總能量仍相同。',safety:'只用模擬觀察；不要用高處重物示範。',
 source:['OpenStax：能量守恆','https://openstax.org/books/college-physics-2e/pages/7-6-conservation-of-energy'],related:[['../force-motion-lab.html','力與運動'],['../heat-phase-lab.html','熱與物態']],
 quiz:[quiz('摩擦使動能比理想值少，能量主要轉為？',['消失','內能','質量'],1,'把物體、斜面與熱一起看作系統。'),quiz('無摩擦、相同高度由靜止滑下，質量加倍，底部速度？',['相同','加倍','減半'],0,'mgh=mv²/2 中的 m 可約去。'),quiz('η=100%時，本頁的位置滑桿代表？',['證明物體自行滑下','指定位置的極限能量帳，不是運動解','永動機'],1,'本模型沒有積分時間或求接觸力。')]
 },
 {
 id:'moon-eclipse',title:'月相、日食與月食實驗室',subject:'地科',grade:'國中',unit:'天文',minutes:'15–20',prior:'日月地相對位置與光影',
 description:'分開調整月球相位角與交點方向，理解為何每月有朔望，卻不會每月都有日月食。',
 goals:['連結月相與日月地位置','區分月相和地球陰影','說明交點附近才可能發生日月食'],
 controls:[range('phase','月球相位角（0°朔／180°望）',0,360,5,90,'°'),range('node','升交點相對太陽方向',0,360,5,90,'°'),range('inclination','軌道傾角',0,10,0.5,5,'°')],
 prediction:'以本頁對齊門檻判斷，目前是哪一種情況？',choices:[['solar','日食候選位置'],['lunar','月食候選位置'],['none','不在食的對齊範圍']],
 tasks:[task('① 朔不一定日食',{phase:0,node:90,inclination:5},'保持朔，把交點方向從90°改成0°，比較軌道偏離。'),task('② 望與月食',{phase:180,node:0,inclination:5},'先預測，再把相位角改為90°。'),task('③ 沒有傾角的假想世界',{phase:0,node:90,inclination:0},'比較傾角0°和5°。為什麼現實不會每個朔望都發生食？')],
 formula:'可見亮面比例 k=(1−cosα)/2；軌道黃緯 β=asin(sin i × sin(α−Ω))。',
 limits:'圓軌道教學幾何；相位角近似黃經差，並非精密星曆。以離朔／望≤5°且|β|≤1°標記「食候選」，門檻只作教學，不能預測日期、食分、全食環食或地面可見地區。軌道俯視圖刻意放大天體，垂直偏離以讀值呈現。',
 misconception:'月相是看見月球被太陽照亮部分的比例，不是地球影子遮住月球。',safety:'不可直視太陽；本頁不是觀測日食的安全指引，也不是預報。',
 source:['NASA：月食與月球軌道','https://svs.gsfc.nasa.gov/4158/'],related:[['../moon-phases/','月相盈虧基礎教室']],
 quiz:[quiz('滿月時為何不一定發生月食？',['月球沒有被照亮','月球軌道傾斜，可能離開地影','地球停止公轉'],1,'固定望，改變交點方向看黃緯。'),quiz('上弦月通常可見亮面比例約？',['0%','50%','100%'],1,'相位角90°時 k=1/2。'),quiz('「日食候選」可以當作精確預報嗎？',['可以','不可以，僅是簡化對齊模型','可以預報所有城市'],1,'模型沒有星曆與地面觀測位置。')]
 },
 {
 id:'seasons',title:'四季與太陽高度角實驗室',subject:'地科',grade:'國中',unit:'天文',minutes:'15–20',prior:'緯度、地軸、角度',
 description:'改變緯度、地軸傾角與季節位置，比較正午太陽高度、日長及極晝極夜。',
 goals:['用地軸傾斜解釋季節','比較不同緯度的正午太陽高度','辨識極晝極夜與邊界'],
 controls:[range('latitude','緯度（北正南負）',-90,90,1,24,'°'),range('season','軌道位置（0°北半球春分）',0,360,5,90,'°'),range('tilt','地軸傾角',0,30,0.5,23.5,'°')],
 prediction:'此地今日的理想日長？',choices:[['long','長於12小時'],['equal','約12小時或地平線邊界'],['short','短於12小時']],
 tasks:[task('① 臺中夏冬比較',{latitude:24,season:90,tilt:23.5},'記錄北半球夏至，再把位置改到270°，比較正午高度與日長。'),task('② 南北半球',{latitude:-24,season:90,tilt:23.5},'同一公轉位置，緯度正負交換；季節相同嗎？'),task('③ 極圈與地軸',{latitude:70,season:90,tilt:23.5},'觀察70°N的日長，再把傾角調到0°。')],
 formula:'δ=asin(sinε sinλ)；正午高度 h=90°−|φ−δ|；日長=24 arccos(−tanφ tanδ)/π。極點需另外判斷。',
 limits:'理想圓軌道；不計折射、太陽視半徑、地形和近日點速度差，因此日長不是實際日出日落預報。極點且δ=0時太陽中心整日貼地平線，介面以邊界狀態代替一般日長。',
 misconception:'地軸方向與傾斜造成日照差異；不能用地球離太陽近或遠解釋南北半球相反的季節。',safety:'不可直接凝視太陽量測角度。',
 source:['NASA：四季成因','https://spaceplace.nasa.gov/seasons/en/'],related:[['moon-eclipse.html','月相、日食與月食']],
 quiz:[quiz('北半球夏至時南半球通常？',['同樣夏季','冬季','沒有季節'],1,'南北緯度交換後比較日長。'),quiz('地軸不傾斜的理想模型，大部分緯度的日長？',['每天24小時','每天0小時','全年約12小時'],2,'δ=0；極點是地平線特殊邊界。'),quiz('極夜時正午太陽高度可能？',['小於0°','一定90°','一定45°'],0,'太陽中心在地平線下。')]
 },
 {
 id:'plant-exchange',title:'呼吸作用、蒸散與氣孔實驗室',subject:'生物',grade:'國中',unit:'植物生理',minutes:'15–20',prior:'光合作用、呼吸作用、水分運輸',
 description:'用相對量比較植物白天與黑暗中的淨氣體交換，另看濕度和氣孔開度如何影響蒸散。',
 goals:['區分總光合作用與淨交換','說明植物在黑暗仍可呼吸','比較氣孔開度、濕度與水分散失'],
 controls:[range('light','相對光照',0,100,5,60,'%'),range('temperature','溫度',10,35,1,25,'°C'),range('humidity','相對濕度',0,100,5,50,'%'),range('stomata','氣孔開度（控制設定）',0,100,5,60,'%')],
 prediction:'此模型的淨氧氣交換方向？',choices:[['release','淨釋出氧氣'],['balanced','淨交換接近零'],['consume','淨消耗氧氣']],
 tasks:[task('① 白天和黑暗',{light:60,temperature:25,humidity:50,stomata:60},'保持氣孔與溫度，記錄有光與光照0%的淨氧氣交換。'),task('② 乾燥與潮濕',{light:60,temperature:25,humidity:20,stomata:60},'只改濕度20%→80%，比較蒸散指標，不把不同變因一起改。'),task('③ 氣孔關閉',{light:60,temperature:25,humidity:50,stomata:0},'觀察蒸散與氣體交換；模型中的呼吸是否仍存在？')],
 formula:'教學指標：總光合P=12[L/(L+30)]·s·exp(−((T−25)/15)²)；呼吸R=2·2^((T−25)/10)；淨氧=P−R；蒸散E=s(1−RH)·2^((T−25)/10)。s與RH為0–1比例。',
 limits:'所有速率是無單位的相對教學指標，非特定植物實測值；不推算生物產量。氣孔開度由學生固定，不模擬乾旱關孔回饋、風、葉面積與邊界層。溫度公式限10–35°C，不可外推。呼吸與蒸散是不同過程；氣孔全閉時仍保留呼吸代謝簡化項。',
 misconception:'植物不只在晚上呼吸；白天也同時呼吸，只是淨交換可能由光合作用主導。',safety:'不要把模型數值當作栽培處方，也不需密閉或加熱活體植物。',
 source:['OpenStax：水分運輸','https://openstax.org/books/biology-2e/pages/30-5-transport-of-water-and-solutes-in-plants'],related:[['../photosynthesis-factor-lab.html','光合作用限制因子']],
 quiz:[quiz('黑暗中植物通常仍會？',['只做光合作用','進行呼吸作用','不進行任何代謝'],1,'光照0%時總光合為0，呼吸項仍在。'),quiz('其他條件相同、氣孔開度固定，空氣濕度越高，蒸散指標？',['較低','較高','一定不變'],0,'比較水氣差異，而不是把蒸散和呼吸當成一件事。'),quiz('本頁的氣孔開度與蒸散值屬於？',['植物實測資料','所有植物通用常數','簡化教學設定與相對指標'],2,'真實植物還有水分壓力與氣孔回饋。')]
 },
 {
 id:'ecosystem',title:'生態系、食物網與族群實驗室',subject:'生物',grade:'國中',unit:'生態',minutes:'20–25',prior:'生產者、消費者、能量',
 description:'先讀懂食物網箭頭，再比較營養階層能量與單一族群的承載量模型。',
 goals:['辨認食物網箭頭代表能量由食物到取食者','比較階層能量傳遞','區分單族群邏輯斯成長與完整食物網動態'],
 controls:[range('energy','生產者可用能量',1000,10000,500,10000,'kJ／指定期間'),range('efficiency','每階層傳遞比例',5,25,1,10,'%'),range('initial','單一草食族群初始數量',10,300,10,50,'隻'),range('capacity','環境承載量K',50,500,25,200,'隻'),range('rate','內在成長率r',0,0.5,0.05,0.2,'／時間單位'),range('time','經過時間',0,30,1,10,'時間單位')],
 prediction:'此族群在指定時間的數量，相對初始值？',choices:[['grow','增加'],['steady','不變'],['decline','減少']],
 tasks:[task('① 能量不是循環',{energy:10000,efficiency:10},'記錄每階層能量，再把傳遞比例調到20%；不要改成100%定律。'),task('② 接近承載量',{initial:50,capacity:200,rate:0.2,time:10},'記錄時間10和30，觀察族群曲線是否一直同速增加。'),task('③ 超出承載量',{initial:300,capacity:100,rate:0.2,time:10},'觀察N₀>K的結果。這是否能預測整個食物網的真實變化？')],
 formula:'每階層能量Eₙ=E₀ηⁿ；N(t)=K/[1+(K/N₀−1)e^(−rt)]。r=0或t=0時N=N₀。',
 limits:'食物網為關係圖，不是與族群曲線耦合的多物種模型。能量圖是簡化鏈，不把同一能量重複分給各分支；傳遞效率由學生指定，10%不是定律。族群模型假設K、r固定，無遷移、年齡結構、季節、掠食與隨機災害；數值是連續期望量。',
 misconception:'物質可循環，能量沿食物網流動並逐步以熱散失；生物彼此連結不代表所有族群必定同時增加。',safety:'不以抓捕、釋放或傷害生物來驗證本模型。',
 source:['OpenStax：環境限制與族群成長','https://openstax.org/books/biology-2e/pages/45-3-environmental-limits-to-population-growth'],related:[['../photosynthesis-factor-lab.html','光合作用'],['plant-exchange.html','植物交換']],
 quiz:[quiz('食物網中草→兔表示？',['草吃兔','能量由草傳給兔','兔一定增加'],1,'箭頭從被吃者指向取食者。'),quiz('當N=K且環境不變，邏輯斯模型的成長率？',['零','無限大','一定為負'],0,'dN/dt=rN(1−N/K)。'),quiz('10%營養階層傳遞效率是？',['每個生態系的精確定律','可用的教學近似，實際會變','代表其餘90%不存在'],1,'其餘能量可能呼吸成熱、未被取食或進入碎屑途徑。')]
 }
];
