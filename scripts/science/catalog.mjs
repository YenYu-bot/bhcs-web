// One source of truth for the science directory and first-batch teaching notes.
export const legacy = [
 ['mini-lab/','小小科學實驗室','國小自然','國小中高年級','生活實驗與安全','在成人指導下認識器材與控制變因。','生活觀察','安全操作、記錄變化','15–20'],
 ['microscope-lab.html','虛擬顯微鏡','生物','國中','細胞與觀察','調整物鏡、焦距與載玻片，比較視野和影像方向。','細胞、長度單位','總倍率、視野、反向移動','10–15'],
 ['photosynthesis-factor-lab.html','光合作用因素實驗室','生物','國中','養分與光合作用','控制光照、二氧化碳與溫度，找出限制因子。','植物製造養分','單一變因、限制因子、速率','15–20'],
 ['genetics-simulation-lab.html','遺傳模擬實驗室','生物','國中','遺傳','用龐氏方格和子代抽樣，比較機率與實際次數。','配子、比例','基因型、表現型、隨機抽樣','15–20'],
 ['frog-dissection/','青蛙虛擬解剖實驗室','生物','國中','生物體構造','辨識器官及系統關係；含擬真解剖圖，建議教師陪同。','器官與系統','器官位置、系統功能','20–30'],
 ['lenses.html','凹透鏡與凸透鏡','理化','國中','光學','從透鏡外形、折射到成像，逐步建立光路概念。','光沿直線傳播','焦點、特殊光線','10–15'],
 ['convex-lens-imaging.html','凸透鏡成像','理化','國中','光學','比較物距改變時實像和虛像的大小、方向與位置。','焦點與光路','物距、像距、放大率','10–15'],
 ['eye-lesson.html','眼睛如何看見蝴蝶','理化','國中','光學','比較正常眼、近視、遠視與矯正透鏡。','凸透鏡成像','視網膜、聚焦、視力矯正','10–15'],
 ['color-primaries.html','光與顏料三原色','理化','國中','光學','比較色光相加與顏料混合，不把螢幕顏色視為真實顏料。','顏色觀察','加色、減色','10–15'],
 ['force-motion-lab.html','力與運動實驗室','理化','國中','力學','比較合力、質量、加速度與運動圖表。','速度、方向','控制變因、牛頓第二定律','15–20'],
 ['buoyancy-density-lab.html','浮力與密度實驗室','理化','國中','力學','調整密度、體積和液體，比較浮沉與排開液重。','重量、密度','阿基米德原理、力平衡','15–20'],
 ['particle-reaction-lab.html','粒子與化學反應實驗室','理化','國中','物質與化學','從粒子重排與原子盤點認識反應比例和守恆。','原子、分子','係數、限量反應物、質量守恆','15–20'],
 ['acid-base-indicator-lab.html','酸鹼與指示劑實驗室','理化','國中','物質與化學','比較指示劑與強酸強鹼中和的理想模型。','酸鹼、體積與濃度','指示劑、莫耳數、中和','15–20'],
 ['heat-phase-lab.html','熱與物態實驗室','理化','國中','熱學','沿純水加熱曲線比較溫度、能量與物態。','溫度、質量','比熱、潛熱、熱傳','15–20'],
 ['waves.html','波動實驗室','理化','國中','波與聲','觀察質點、反射、干涉與駐波。','振動、週期','波速、波長、疊加','15–20'],
 ['circuit-lab.html','電路虛擬實驗室','理化','國中','電與磁','直接通電比較串並聯電路的電流和電壓。','電流、電壓','歐姆定律、等效電阻、功率','15–20'],
 ['dc-motor.html','直流馬達的原理','理化','國中','電與磁','比較磁場、電流與換向器如何讓線圈連續轉動。','電磁鐵','磁力、換向器、能量轉換','15–20'],
 ['plate-earthquake-lab.html','板塊與地震實驗室','地科','國中','板塊與地震','觀察板塊剖面，再由測站資料定位震央。','地球構造、距離','板塊邊界、震源、三圓定位','15–20'],
 ['moon-phases/','月相盈虧互動教室','地科','國中','天文','從太空與地球視角比較月相，不把月相誤認為地影。','太陽、地球、月球','光照、相對位置、盈虧','10–15'],
].map(([file,title,subject,grade,unit,description,prior,goals,minutes])=>({file,title,subject,grade,unit,description,prior,goals,minutes,kind:'互動模擬',batch:1}));

export const firstBatch = ['circuit-lab.html','force-motion-lab.html','particle-reaction-lab.html','microscope-lab.html','plate-earthquake-lab.html','heat-phase-lab.html','buoyancy-density-lab.html','acid-base-indicator-lab.html','photosynthesis-factor-lab.html','genetics-simulation-lab.html'];


export const firstMisconceptions={
 'circuit-lab.html':'電流不是流過第一顆燈泡後被用掉；串聯各處電流相同，並聯的支路才會分流。',
 'force-motion-lab.html':'向右移動不代表合力向右；合力決定加速度，與當下速度要分開判讀。',
 'particle-reaction-lab.html':'反應後分子種類或數量可以改變，各元素的原子總數仍要守恆。',
 'microscope-lab.html':'高倍讓影像變大，能看見的範圍反而變小；影像偏左時玻片也向左移。',
 'plate-earthquake-lab.html':'震源在地下，震央是其上方地表位置；單一測站只能給出距離範圍。',
 'heat-phase-lab.html':'吸收熱量不一定升溫；相變期間能量用在改變物態。',
 'buoyancy-density-lab.html':'重的物體不一定下沉；先比較物體與液體密度，沉底還要考慮支持力。',
 'acid-base-indicator-lab.html':'酸鹼體積相等不保證中和；要連同濃度比較可反應的量。',
 'photosynthesis-factor-lab.html':'增加光照不一定持續提高速率，另一個條件可能成為限制因子。',
 'genetics-simulation-lab.html':'25% 是每個子代的機率，不代表每四個子代一定有一個符合。'
};

// Owner-approved public Guided Lab, offered alongside the original simulator.
export const guidedPublic = Object.freeze([Object.freeze({
 file:'science/circuit-guided.html',title:'電路接線與電流實驗室',subject:'理化',grade:'國中',unit:'電與磁',
 description:'親手接線、操作開關及電表，以五次量測比較不同接法的電流、電壓與燈泡亮度。',
 prior:'開關與完整通路',goals:'電流表與電壓表接法、單一路徑與雙路徑電流比較',
 minutes:'25–35',kind:'引導實驗',batch:3
})]);

// Standalone applications are discoverable, but never receive the legacy research shell.
export const standalonePublic = Object.freeze([Object.freeze({
 file:'microscope-3d/',title:'3D顯微鏡操作與比較',subject:'生物',grade:'國中',unit:'觀察工具',
 description:'在獨立3D實驗桌調焦、移動玻片與調整照明，比較複式與解剖顯微鏡。筆記僅存本頁記憶體，重新整理即消失，可匯出CSV。',
 prior:'細胞、倍率與觀察方向',goals:'調焦、倍率比較、複式反向與解剖正立影像、照明限制',
 minutes:'15–25',kind:'互動模擬'
}),Object.freeze({
 file:'lens-25d/',title:'凸透鏡五種成像實驗',subject:'理化',grade:'國中',unit:'光與成像',
 description:'移動物體與光屏，記錄五種成像條件，再用實際證據完成模型比較與概念檢核。觀察與答案只保留在本頁記憶體，重新整理即消失。',
 prior:'光的直進、凸透鏡與焦距',goals:'五種物距成像、有限光屏搜尋的限制、實際觀察與理論像距比較',
 minutes:'20–30',kind:'互動模擬'
}),Object.freeze({
 file:'lab/buoyancy/',title:'浮力實驗桌',subject:'理化',grade:'國中',unit:'浮力與排液量測',
 description:'把鋁塊慢慢放進清水和濃鹽水，用彈簧秤量出浮力和排開液體的重量；再調整密封盒的質量，找出浮與沉的規律。',
 prior:'重量、質量與單位換算',goals:'量測順序、浮力與排液重比較、浮沉與密度',
 minutes:'20–30',kind:'引導實驗桌'
}),Object.freeze({
 file:'lab/lever/',title:'槓桿實驗桌',subject:'理化',grade:'國中',unit:'力矩與槓桿平衡',
 description:'移動、加掛砝碼，看槓桿往哪邊倒，比較兩邊力矩，找出讓兩邊平衡的規律。',
 prior:'力、距離與單位換算',goals:'力矩比較、槓桿平衡、依原始觀察比較與解釋',
 minutes:'20–30',kind:'引導實驗桌'
}),Object.freeze({
 file:'lab/pulley/',title:'滑輪實驗桌',subject:'理化',grade:'國中',unit:'滑輪、拉力與功',
 description:'用定滑輪、動滑輪和滑輪組把同一個木箱升高 20 cm，比較拉力、拉繩距離、施力方向和功。',
 prior:'力、距離與單位換算',goals:'理想滑輪的力與距離交換、功的計算、依原始觀察比較與解釋',
 minutes:'20–30',kind:'引導實驗桌'
}),Object.freeze({
 file:'lab/incline/',title:'斜面實驗桌',subject:'理化',grade:'國中',unit:'斜面、拉力與功',
 description:'沿不同長度、高度的斜面把同一個木箱拉上去，比較怎樣最省力、功有沒有改變，以及摩擦的影響。',
 prior:'力、距離與單位換算',goals:'沿坡距離與垂直升高、理想斜面省力不省功、摩擦的影響',
 minutes:'20–30',kind:'引導實驗桌'
}),Object.freeze({
 file:'lab/friction-efficiency/',title:'摩擦與機械效率實驗桌',subject:'理化',grade:'國中',unit:'摩擦、功與機械效率',
 description:'同一個木箱、同一個斜面，只換光滑、粗糙、砂紙三種坡面，看拉力做的功有多少變成位能、多少被摩擦變成熱，算出機械效率。',
 prior:'力、距離、功與單位換算',goals:'公平比較、輸入功與有效功、摩擦轉為熱、機械效率的計算',
 minutes:'15–20',kind:'引導實驗桌'
}),Object.freeze({
 file:'motion-graphs-desk/',title:'小車運動圖實驗桌',subject:'理化',grade:'國中',unit:'位置、速度與運動圖',
 description:'先觀察小車、讀位置並自己作圖，再以五個案例判讀 x–t、v–t 圖、等加速度、折返及位移與路程。入門與進階紀錄分開保存在目前瀏覽器與網站；私人原型站紀錄不會自動移入官網。',
 prior:'位置、時間、正負數與座標圖',goals:'圖的斜率與方向、速度與加速度符號、折返、帶正負號面積與路程',
 minutes:'30–45',kind:'互動模擬'
})]);

// Completed guided desks sit beside their original exploration topic in both directories.
export const completedDeskPublic=Object.freeze([
].map(Object.freeze));

// Public lab desks, in directory order. The earlier 新探究 pages they replaced were removed.
export const primaryLabDesks=Object.freeze([
 {id:'optics',file:'lab/lens/',title:'透鏡成像實驗桌',unit:'光學與透鏡成像',minutes:'15–25',description:'分別移動物體和光屏，比較凸透鏡、凹透鏡的實像與虛像，觀察對焦與成像倍率。'},
 {id:'wave-sound',file:'lab/wave-sound/',title:'波動與聲音實驗桌',unit:'波與聲',minutes:'15–20',description:'用喇叭和空氣柱比較頻率與波長，找出兩端開口與一端封閉的管各在哪些頻率共振，再換管長比較基頻。'},
 {id:'electromagnetism',file:'lab/electromagnetism/',title:'電磁實驗桌',unit:'電與磁',minutes:'15–20',description:'通電線圈變成電磁鐵：改變匝數與電流比較吸起的迴紋針，電流反向磁極也反向；再把磁鐵插進線圈，看感應電流。'},
 {id:'pressure-fluid',file:'lab/pressure/',title:'水壓與氣壓實驗桌',unit:'壓力與流體',minutes:'15–20',description:'先操作托里切利水銀氣壓計，再移動水下探頭比較表壓與絕對壓力，最後推拉密閉針筒觀察氣體壓縮。'},
 {id:'solubility',file:'lab/solubility/',title:'溶解度實驗桌',unit:'物質與溶液',minutes:'15–20',description:'一匙一匙把教學溶質加進水裡，看杯底何時留下固體；再升溫、降溫、加水，分清溶解度、飽和與濃度。'},
 {id:'energy',file:'lab/energy/',title:'能量轉換實驗桌',unit:'力學與能量',minutes:'15–20',description:'推車從斜坡滑下，看位能、動能和摩擦生熱怎麼交換；有摩擦時能量沒有消失，位能＋動能＋熱一直不變。'},
 {id:'moon-eclipse',file:'lab/moon/',title:'月相與日月食實驗桌',subject:'地科',unit:'天文',minutes:'10–15',description:'讓月球繞地球走一圈，看月相怎麼變；再比較交點位置，找出日食與月食的條件。'},
 {id:'seasons',file:'lab/seasons/',title:'四季實驗桌',subject:'地科',unit:'天文',minutes:'15–20',description:'比較夏至、冬至與春分的正午太陽高度和白天長度，換緯度、把地軸扶正，找出四季的原因。'},
 {id:'plant-exchange',file:'lab/plant-exchange/',title:'植物氣體交換實驗桌',subject:'生物',unit:'植物生理',minutes:'15–20',description:'改變光照、氣孔開度與濕度，比較葉子的光合作用、呼吸作用、淨氧氣交換與蒸散。'},
 {id:'ecosystem',file:'lab/ecosystem/',title:'生態系實驗桌',subject:'生物',unit:'生態',minutes:'15–20',description:'看能量沿食物鏈每往上一層剩多少，再看兔子族群如何增加到環境承載量。'},
 {id:'reaction-rate',file:'lab/reaction-rate/',title:'反應速率實驗桌',unit:'反應速率與表面積',minutes:'10–15',description:'只改變同質量大理石的顆粒大小，比較大塊、顆粒和粉末的模擬反應。模擬時間未經實驗校準。'},
 {id:'reflection-refraction',file:'lab/reflection-refraction/',title:'光的反射與折射實驗桌',unit:'光學',minutes:'15–20',description:'用法線量角，比較光在介面上反射與折射的方向，再觀察光從玻璃射入空氣時的臨界角與全反射。'},
 {id:'atom-builder',file:'lab/atom/',title:'原子結構實驗桌',subject:'理化',unit:'原子結構',minutes:'10–15',description:'用質子、中子、電子組出原子：質子數決定元素，電子多少決定離子電荷，中子數不同是同位素。'},
 {id:'stoichiometry',file:'lab/stoichiometry/',title:'化學計量實驗桌',subject:'理化',unit:'化學計量',minutes:'15–20',description:'把反應物的質量換成莫耳數，看係數比、誰先用完，以及反應前後總質量不變。'},
 {id:'weather-systems',file:'lab/weather/',title:'天氣系統實驗桌',subject:'地科',unit:'天氣與氣候',minutes:'15–20',description:'比較高低氣壓的風向與上升下沉氣流，南北半球的差別，以及冷鋒、暖鋒、滯留鋒的雲雨。'},
 {id:'circulation',file:'lab/circulation/',title:'血液循環實驗桌',subject:'生物',unit:'運輸作用',minutes:'15–20',description:'沿著血液走一圈：分辨肺循環與體循環、動脈與靜脈，再比較運動時的心跳與心輸出量。'},
 {id:'nerve-reflex',file:'lab/nerve-reflex/',title:'神經反射實驗桌',subject:'生物',unit:'協調作用',minutes:'15–20',description:'比較膝跳反射、縮手反射與接球的神經路線，看中樞在脊髓還是大腦，再用接尺實驗量反應時間。'},
 {id:'homeostasis',file:'lab/homeostasis/',title:'體內恆定實驗桌',subject:'生物',unit:'恆定性',minutes:'15–20',description:'天氣冷熱時身體怎麼維持 37 °C，飯後、胰島素不足與運動時血糖怎麼被拉回正常。'},
 {id:'spring-friction',file:'lab/spring-friction/',title:'彈簧與摩擦實驗桌',unit:'力的測量',minutes:'15–20',description:'掛砝碼量伸長，觀察靜摩擦到滑動的臨界點，再比較正向力與接觸面積。'},
 {id:'electric-power',file:'lab/electric-power/',title:'電流熱效應實驗桌',unit:'電流熱效應',minutes:'15–20',description:'用電表與加熱實驗，比較固定電壓、固定電流時的電功率、電能及水溫。'},
 {id:'electrostatics',file:'lab/electrostatics/',title:'靜電感應實驗桌',unit:'靜電',minutes:'10–15',description:'帶電棒靠近金屬球，看電子怎麼移動；比較只靠近、接地、兩種移開順序與接觸起電。'},
 {id:'equilibrium',file:'lab/equilibrium/',title:'化學平衡實驗桌',subject:'理化',unit:'可逆反應',minutes:'10–15',description:'密閉燒瓶裡的可逆反應：從哪一邊開始都到同一個平衡，改變溫度或加入反應物，平衡會移動。'},
 {id:'metal-activity',file:'lab/metal/',title:'金屬活性實驗桌',unit:'氧化還原',minutes:'15–20',description:'把鋅片、鐵片、銅片放進硫酸銅、硫酸亞鐵與稀鹽酸，觀察析出物與氣泡，用證據排出金屬的活性大小。'},
 {id:'cell-electrolysis',file:'lab/electrolysis/',title:'電池與電解實驗桌',subject:'理化',unit:'電流的化學效應',minutes:'15–20',description:'鋅銅電池的電子怎麼流、電解水產生的氫和氧、電解硫酸銅析出銅與電鍍。'},
 {id:'specific-heat',file:'lab/heat/',title:'比熱實驗桌',unit:'熱量與比熱',minutes:'15–20',description:'用同一個電熱板加熱水和鐵，看溫度計和溫度–時間圖比較誰升溫快；再只改質量，分清熱量、溫升與比熱。'},
 {id:'neutralization',file:'lab/neutralization/',title:'酸鹼中和實驗桌',unit:'酸鹼中和',minutes:'15–20',description:'用虛擬滴定管比較中和點與酚酞變色，觀察濃度及酸鹼反應比例和滴定體積的關係。'},
 {id:'cell-division',file:'lab/cell-division/',title:'細胞分裂實驗桌',subject:'生物',unit:'細胞分裂與生殖',minutes:'15–20',description:'一步一步看有絲分裂和減數分裂：細胞數、染色體數和 DNA 量怎麼變，同源染色體什麼時候分開。'},
 {id:'enzyme',file:'lab/enzyme/',title:'酵素實驗桌',subject:'生物',unit:'酵素',minutes:'15–20',description:'把唾液澱粉酶放進不同溫度與 pH，用碘液看澱粉有沒有被分解；高溫變性後冷卻也回不來。'},
 {id:'tides',file:'lab/tides/',title:'潮汐實驗桌',subject:'地科',unit:'潮汐',minutes:'10–15',description:'看一天兩次的漲退潮，再比較新月、上弦與滿月時的大潮和小潮。'},
 {id:'circuit-desk',file:'lab/circuit/',title:'電路實驗桌',unit:'電與磁',minutes:'15–20',description:'接通開關，比較電池數、串聯與並聯時每顆燈泡的電流、電壓與亮度。'},
 {id:'phase-desk',file:'lab/phase/',title:'熱與物態實驗桌',unit:'熱學',minutes:'15–20',description:'持續加熱一塊冰，看溫度曲線在熔化與沸騰時為什麼變平，再比較質量加倍的結果。'},
 {id:'balance-desk',file:'lab/balance/',title:'化學反應式平衡實驗桌',unit:'物質與化學',minutes:'15–20',description:'調整係數，數一數兩邊每種原子的個數，把氫氣燃燒、合成氨與甲烷燃燒的反應式平衡。'},
 {id:'indicator-desk',file:'lab/indicator/',title:'酸鹼指示劑實驗桌',unit:'物質與化學',minutes:'10–15',description:'把石蕊、酚酞和廣用指示劑滴進五種溶液，用顏色判斷酸鹼性與強弱。'},
 {id:'newton-desk',file:'lab/newton/',title:'力與運動實驗桌',unit:'力學',minutes:'15–20',description:'改變拉力、質量與摩擦力，看小車每秒的位置，找出合力、質量與加速度的關係。'},
 {id:'color-desk',file:'lab/color/',title:'色光與顏料實驗桌',unit:'光學',minutes:'10–15',description:'疊合紅綠藍三種色光和青、洋紅、黃三種顏料，再用不同色光照物體，比較相加與相減混色。'},
 {id:'eye-desk',file:'lab/eye/',title:'眼睛與視力矯正實驗桌',unit:'光學',minutes:'10–15',description:'看光線在眼球裡成像的位置，比較正常眼、近視與遠視，再選對鏡片把像移回視網膜。'}
].map(t=>Object.freeze({subject:'理化',grade:'國中',kind:'引導實驗桌',...t})));

export const mirrorLabDesk=Object.freeze({
 file:'lab/mirror/',title:'面鏡成像實驗桌',subject:'理化',grade:'國中',unit:'光學與面鏡成像',
 description:'比較平面鏡、凸面鏡與凹面鏡。切換凹面鏡的五種物距，比較焦點內外，並用光屏檢查能否接到實像。',
 minutes:'15–25',kind:'引導實驗桌'
});


export const motionLabDesk=Object.freeze({
 file:'lab/motion/',title:'小車運動圖實驗桌',subject:'理化',grade:'國中',unit:'位置、速度與運動圖',
 description:'操作小車並比對位置與速度圖，練習讀圖與累積觀察證據。',
 minutes:'20–30',kind:'引導實驗桌',previousFile:'motion-graphs-desk/',previousLabel:'舊版小車運動圖實驗桌（入門與原紀錄）',
 additionalPreviousFile:'motion-graphs-desk/v2/',additionalPreviousLabel:'舊版進階五案例與原紀錄'
});
