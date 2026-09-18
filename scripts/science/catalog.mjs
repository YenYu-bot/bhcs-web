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
 ['circuit-lab.html','電路虛擬實驗室','理化','國中','電與磁','先預測串並聯電路，再通電比較電流和電壓。','電流、電壓','歐姆定律、等效電阻、功率','15–20'],
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
