// One source of truth for the science directory. The first-batch researcher stations were replaced by lab desks on 2026-11-21.
export const legacy = [
 ['mini-lab/','小小科學實驗室','國小自然','國小中高年級','生活實驗與安全','在成人指導下認識器材與控制變因。','生活觀察','安全操作、記錄變化','15–20'],
 ['frog-dissection/','青蛙虛擬解剖實驗室','生物','國中','生物體構造','辨識器官及系統關係；含擬真解剖圖，建議教師陪同。','器官與系統','器官位置、系統功能','20–30'],
].map(([file,title,subject,grade,unit,description,prior,goals,minutes])=>({file,title,subject,grade,unit,description,prior,goals,minutes,kind:'互動模擬',batch:1}));

export const guidedPublic = Object.freeze([Object.freeze({
 file:'science/circuit-guided.html',title:'電路接線與電流實驗室',subject:'理化',grade:'國中',unit:'電與磁',
 description:'親手接線、操作開關及電表，以五次量測比較不同接法的電流、電壓與燈泡亮度。',
 prior:'開關與完整通路',goals:'電流表與電壓表接法、單一路徑與雙路徑電流比較',
 minutes:'25–35',kind:'引導實驗',batch:3
})]);

// Standalone applications are discoverable, but never receive the legacy research shell.
export const standalonePublic = Object.freeze([Object.freeze({
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
 {id:'eye-desk',file:'lab/eye/',title:'眼睛與視力矯正實驗桌',unit:'光學',minutes:'10–15',description:'看光線在眼球裡成像的位置，比較正常眼、近視與遠視，再選對鏡片把像移回視網膜。'},
 {id:'microscope-desk',file:'lab/microscope/',title:'顯微鏡實驗桌',subject:'生物',unit:'細胞與觀察',minutes:'20–30',description:'比較玻片和視野裡的像，用粗、細調節輪對焦，轉換物鏡看倍率與視野，調整光圈，觀察洋蔥表皮和水蘊草，再比較複式與解剖顯微鏡。'},
 {id:'photosynthesis-desk',file:'lab/photosynthesis/',title:'光合作用實驗桌',subject:'生物',unit:'養分與光合作用',minutes:'10–15',description:'改變光照、二氧化碳和水溫，數水蘊草冒出的氧氣泡，找出是哪個條件限制了光合作用。'},
 {id:'genetics-desk',file:'lab/genetics/',title:'遺傳實驗桌',subject:'生物',unit:'遺傳',minutes:'15–20',description:'用棋盤方格排出豌豆高莖與矮莖的子代基因型，做試交，再比較理論機率和實際抽樣。'},
 {id:'earthquake-desk',file:'lab/earthquake/',title:'板塊與地震實驗桌',subject:'地科',unit:'板塊與地震',minutes:'15–20',description:'比較三種板塊邊界的震源深淺，用 P 波與 S 波的時間差推算距離，再用三個測站找出震央。'},
 {id:'wave-desk',file:'lab/wave/',title:'波的疊加與駐波實驗桌',unit:'波與聲',minutes:'15–20',description:'看繩波前進時質點怎麼動，比較固定端與自由端的反射，讓兩個脈波相遇疊加，再數駐波的節點、算波長。'},
 {id:'motor-desk',file:'lab/motor/',title:'直流馬達實驗桌',unit:'電與磁',minutes:'10–15',description:'看通電線圈在磁場中兩邊導線的受力，改變電流與磁場方向，比較有沒有換向器，找出馬達持續轉動的原因。'}
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
