import json
from pathlib import Path

ROOT = Path('/Users/juboklee/life-project/life-help')
MASTER_PATH = ROOT / 'lib/think/data/science_titles_master.json'
master = json.load(open(MASTER_PATH, 'r', encoding='utf-8'))

# Curated 48 distinct titles across key languages
DISTINCT_48 = {
    '20261119-physics-g01-1': {
        'ko': '자석의 극성과 인력·척력',
        'en': 'Magnetic Polarity: Attraction and Repulsion',
        'ne': 'चुम्बकीय ध्रुवीयता: आकर्षण र विकर्षणीयता',
        'vi': 'Cực từ của nam châm: Lực hút và lực đẩy',
        'zh-Hant': '磁鐵的極性：吸引與排斥',
        'ja': '磁石の極性と引力・斥力',
        'es': 'Polaridad magnética: Atracción y repulsión',
        'fr': 'Polarité magnétique : Attraction et répulsion',
        'hi': 'चुंबकीय ध्रुवता: आकर्षण और प्रतिकर्षण'
    },
    '20261119-physics-g01-2': {
        'ko': '물질을 통과하는 자기력과 클립 이동',
        'en': 'Magnetic Force Transmission Through Materials',
        'ne': 'पदार्थ पार गर्ने चुम्बकीय बल र क्लिपको गति',
        'vi': 'Lực từ xuyên qua vật thể và chuyển động của kẹp sắt',
        'zh-Hant': '穿透物質的磁力與迴紋針運動',
        'ja': '物質を通過する磁力とクリップの移動',
        'es': 'Transmisión de fuerza magnética a través de materiales',
        'fr': 'Transmission de force magnétique à travers les matériaux',
        'hi': 'पदार्थों के पार चुंबकीय बल संचरण'
    },
    '20261119-physics-g02-1': {
        'ko': '북 가죽의 진동과 소리 발생 원리',
        'en': 'Vibration of Drumheads and Sound Production',
        'ne': 'ड्रमको छाला कम्पन र ध्वनि उत्पादन',
        'vi': 'Sự rung của mặt trống và nguyên lý phát ra âm thanh',
        'zh-Hant': '鼓面振動與聲音產生原理',
        'ja': '太鼓の膜の振動と音の発生原理',
        'es': 'Vibración de parches de tambor y producción de sonido',
        'fr': 'Vibration de la membrane du tambour et émission sonore',
        'hi': 'ड्रम के पर्दे का कंपन और ध्वनि उत्पादन'
    },
    '20261119-physics-g02-2': {
        'ko': '성대 진동과 사람 목소리의 생성',
        'en': 'Vocal Cord Vibration and Voice Generation',
        'ne': 'भोकल कर्ड कम्पन र आवाज उत्पादन',
        'vi': 'Rung dây thanh quản và sự tạo thành giọng nói',
        'zh-Hant': '聲帶振動與人聲發出',
        'ja': '声帯の振動と人の声の発生',
        'es': 'Vibración de cuerdas vocales y generación de voz',
        'fr': 'Vibration des cordes vocales et production de la voix',
        'hi': 'स्वर रज्जु का कंपन और आवाज का निर्माण'
    },
    '20261119-physics-g03-1': {
        'ko': '빛의 직진과 햇빛 아래 그림자 형성',
        'en': 'Rectilinear Light Propagation and Shadow Formation',
        'ne': 'प्रकाशको सीधा मार्ग र छाया निर्माण',
        'vi': 'Sự truyền thẳng của ánh sáng và sự tạo thành bóng râm',
        'zh-Hant': '光沿直線傳播與影子形成',
        'ja': '光の直進と日光下の影の形成',
        'es': 'Propagación rectilínea de la luz y formación de sombras',
        'fr': 'Propagation rectiligne de la lumière et formation dombre',
        'hi': 'प्रकाश का सीधा संचरण और छाया निर्माण'
    },
    '20261119-physics-g03-2': {
        'ko': '바늘구멍 사진기 스크린의 상과 도립 현상',
        'en': 'Pinhole Camera Inverted Image Formation',
        'ne': 'पिनहोल क्यामेरामा उल्टो प्रतिबिम्ब निर्माण',
        'vi': 'Sự tạo ảnh ngược trong máy ảnh lỗ kim',
        'zh-Hant': '針孔照相機的倒立成像現象',
        'ja': '針穴写真機の倒立像形成',
        'es': 'Formación de imagen invertida en cámara estenopeica',
        'fr': 'Formation d image inversée dans un sténopé',
        'hi': 'पिनहोल कैमरे में उल्टी छवि का निर्माण'
    },
    '20261119-physics-g04-1': {
        'ko': '시소의 수평 평형 조건과 거리의 반비례',
        'en': 'Seesaw Balance Conditions and Distance Inversion',
        'ne': 'सीस सन्तुलन सर्त र दूरीको सम्बन्ध',
        'vi': 'Điều kiện cân bằng bập bênh và tỉ lệ nghịch khoảng cách',
        'zh-Hant': '蹺蹺板平衡條件與距離反比',
        'ja': 'シーソーの水平平衡条件と距離の反比例',
        'es': 'Condiciones de equilibrio en balancín y relación de distancia',
        'fr': 'Conditions d équilibre de la balançoire et distance',
        'hi': 'सी-सॉ संतुलन की शर्तें और दूरी का संबंध'
    },
    '20261119-physics-g04-2': {
        'ko': '병따개의 지레 원리와 힘점·받침점 분석',
        'en': 'Lever Mechanics in Bottle Openers: Effort and Fulcrum',
        'ne': 'बोतल ओपनरमा लिभरको सिद्धान्त र बल बिन्दु',
        'vi': 'Nguyên lý đòn bẩy ở dụng cụ mở nắp chai và điểm tác dụng lực',
        'zh-Hant': '開瓶器的槓桿原理與施力點、支點分析',
        'ja': '栓抜きのてこ原理と力点・支点分析',
        'es': 'Mecánica de palanca en abrebotellas: Punto de apoyo y fuerza',
        'fr': 'Mécanique du levier dans un ouvre-bouteille : Point d appui',
        'hi': 'बोतल ओपनर में लीवर सिद्धांत और बल बिंदु'
    },
    '20261119-physics-g05-1': {
        'ko': '100m 달리기 기록과 평균 속력 비교',
        'en': '100m Dash Times and Average Speed Comparison',
        'ne': '१०० मिटर दौड समय र औसत गतिको तुलना',
        'vi': 'So sánh thời gian chạy 100m và tốc độ trung bình',
        'zh-Hant': '百米賽跑時間與平均速率比較',
        'ja': '100m走の記録と平均速度の比較',
        'es': 'Tiempos en carrera de 100m y comparación de velocidad media',
        'fr': 'Chronométrage sur 100m et comparaison de vitesse moyenne',
        'hi': '100 मीटर दौड़ समय और औसत गति की तुलना'
    },
    '20261119-physics-g05-2': {
        'ko': '자동차 이동 거리와 시간 기반 평균 속력 계산',
        'en': 'Automobile Travel Distance and Average Speed Calculation',
        'ne': 'दूरी र समयका आधारमा सवारी साधनको औसत गति गणना',
        'vi': 'Tính toán tốc độ trung bình theo quãng đường và thời gian',
        'zh-Hant': '依行駛距離與時間計算汽車平均速率',
        'ja': '走行距離と時間に基づく自動車の平均速度計算',
        'es': 'Cálculo de velocidad media a partir de distancia y tiempo',
        'fr': 'Calcul de vitesse moyenne d après distance et durée',
        'hi': 'दूरी और समय के आधार पर औसत गति की गणना'
    },
    '20261119-physics-g06-1': {
        'ko': '병렬연결 회로에서 전구의 밝기와 전압',
        'en': 'Bulb Brightness and Voltage in Parallel Circuits',
        'ne': 'समानान्तर सर्किटमा चिमको चमक र भोल्टेज',
        'vi': 'Độ sáng bóng đèn và điện áp trong mạch song song',
        'zh-Hant': '並聯電路中燈泡亮度與電壓',
        'ja': '並列回路における豆電球の明るさと電圧',
        'es': 'Brillo de bombillas y voltaje en circuitos paralelos',
        'fr': 'Luminosité des ampoules et tension en circuit parallèle',
        'hi': 'समानांतर सर्किट में बल्ब की चमक और वोल्टेज'
    },
    '20261119-physics-g06-2': {
        'ko': '직렬연결 회로에서 단선 시 전류 차단 현상',
        'en': 'Circuit Interruption in Series Connections',
        'ne': 'शृङ्खला सर्किटमा विच्छेद हुँदा विद्युत् प्रवाह अवरोध',
        'vi': 'Hiện tượng ngắt dòng khi đứt mạch nối tiếp',
        'zh-Hant': '串聯電路中斷路時的電流中斷現象',
        'ja': '直列回路における断線時の電流遮断現象',
        'es': 'Interrupción de corriente en circuitos en serie',
        'fr': 'Rupture de courant dans un circuit en série',
        'hi': 'श्रेणी सर्किट में टूटने पर धारा का रुकना'
    },
    '20261119-physics-g07-1': {
        'ko': '반대 방향으로 작용하는 두 힘의 알짜힘 합성',
        'en': 'Net Force Synthesis of Collinear Opposing Forces',
        'ne': 'विपरीत दिशामा लाग्ने दुई बलको कुल बल संश्लेषण',
        'vi': 'Tổng hợp hợp lực của hai lực ngược chiều cùng phương',
        'zh-Hant': '反方向兩力的合力合成',
        'ja': '反対方向に作用する2力の合力合成',
        'es': 'Síntesis de fuerza neta para fuerzas colineales opuestas',
        'fr': 'Résultante de deux forces colinéaires opposées',
        'hi': 'विपरीत दिशा में लगने वाले बलों का परिणामी बल'
    },
    '20261119-physics-g07-2': {
        'ko': '아르키메데스의 원리와 유체 속 부력의 크기',
        'en': 'Archimedes Principle and Buoyant Force Magnitude',
        'ne': 'आर्किमिडीजको सिद्धान्त र तरल पदार्थमा उत्प्लावन बल',
        'vi': 'Nguyên lý Archimedes và độ lớn của lực đẩy nổi',
        'zh-Hant': '阿基米德原理與流體中的浮力大小',
        'ja': 'アルキメデスの原理と流体中の浮力の大きさ',
        'es': 'Principio de Arquímedes y magnitud de fuerza de flotación',
        'fr': 'Principe d Archimède et intensité de la poussée',
        'hi': 'आर्किमिडीज का सिद्धांत और उत्प्लावन बल'
    },
    '20261119-physics-g08-1': {
        'ko': '물질의 비열 차이와 뚝배기의 보온 원리',
        'en': 'Specific Heat Capacity Differences and Thermal Retention',
        'ne': 'विशिष्ट ताप धारण क्षमता भिन्नता र ताप संरक्षण',
        'vi': 'Sự khác biệt về nhiệt dung riêng và khả năng giữ nhiệt',
        'zh-Hant': '物質比熱差異與陶鍋保溫原理',
        'ja': '物質の比熱差と土鍋の保温原理',
        'es': 'Diferencias de calor específico y retención térmica',
        'fr': 'Capacité thermique massique et rétention de chaleur',
        'hi': 'विशिष्ट ऊष्मा धारिता में अंतर और ऊष्मा प्रतिधारण'
    },
    '20261119-physics-g08-2': {
        'ko': '보온병의 열전달(전도·대류·복사) 3대 차단 구조',
        'en': 'Vacuum Flask Insulation: Blocking Conduction, Convection, and Radiation',
        'ne': 'थर्मस फ्लास्कमा ताप स्थानान्तरणका ३ विधि अवरोध',
        'vi': 'Cấu trúc ngăn chặn 3 hình thức truyền nhiệt của phích giữ nhiệt',
        'zh-Hant': '保溫瓶阻斷熱傳導、對流與輻射的三大構造',
        'ja': '魔法瓶の熱移動（伝導・対流・放射）3大遮断構造',
        'es': 'Aislamiento de termo: Bloqueo de conducción, convección y radiación',
        'fr': 'Isolation d une bouteille isotherme : Conduction, convection, rayonnement',
        'hi': 'थर्मस बोतल में चालन, संवहन और विकिरण का अवरोध'
    },
    '20261119-physics-g09-1': {
        'ko': '힘과 이동 방향의 직교에 따른 과학적 일 0인 상황',
        'en': 'Zero Scientific Work Condition with Perpendicular Force and Displacement',
        'ne': 'बल र विस्थापन लम्बवत हुँदा शून्य वैज्ञानिक कार्य',
        'vi': 'Công cơ học bằng 0 khi lực vuông góc với hướng dịch chuyển',
        'zh-Hant': '力與位移垂直時科學作功為零的情況',
        'ja': '力と移動方向の直交による科学적仕事がゼロの状況',
        'es': 'Trabajo mecánico nulo por fuerza perpendicular al desplazamiento',
        'fr': 'Travail nul avec force perpendiculaire au déplacement',
        'hi': 'बल और विस्थापन लंबवत होने पर शून्य वैज्ञानिक कार्य'
    },
    '20261119-physics-g09-2': {
        'ko': '낙하하는 물체의 위치 에너지와 운동 에너지 상호 변환',
        'en': 'Mechanical Energy Conservation: Gravitational Potential and Kinetic Energy',
        'ne': 'खस्ने वस्तुको स्थितिज ऊर्जा र गतिज ऊर्जा रूपान्तरण',
        'vi': 'Bảo toàn cơ năng: Chuyển hóa thế năng và động năng khi rơi',
        'zh-Hant': '下落重物的位能與動能相互轉換',
        'ja': '落下する物体の位置エネルギーと運動エネルギーの相互変換',
        'es': 'Conservación de energía mecánica: Potencial y cinética',
        'fr': 'Conservation d énergie mécanique : Potentielle et cinétique',
        'hi': 'यांत्रिक ऊर्जा संरक्षण: स्थितिज और गतिज ऊर्जा का रूपांतरण'
    },
    '20261119-physics-g10-1': {
        'ko': '관성의 법칙과 자동차 급정거 시 안전띠의 역할',
        'en': 'Newtons First Law of Motion and Seatbelt Inertia Protection',
        'ne': 'न्युटनको पहिलो नियम र सिटबेल्टको जडता सुरक्षा',
        'vi': 'Định luật quán tính Newton và vai trò của dây an toàn khi phanh gấp',
        'zh-Hant': '慣性定律與汽車急煞時安全帶的保護作用',
        'ja': '慣性の法則と急ブレーキ時のシートベルトの役割',
        'es': 'Primera ley de Newton y protección inercial del cinturón',
        'fr': 'Première loi de Newton et protection par ceinture de sécurité',
        'hi': 'न्यूटन का पहला नियम और सीटबेल्ट की जड़ता सुरक्षा'
    },
    '20261119-physics-g10-2': {
        'ko': '뉴턴 운동 제2법칙(F=ma)을 통한 물체의 가속도 계산',
        'en': 'Newtons Second Law (F=ma) and Acceleration Calculation',
        'ne': 'न्युटनको दोस्रो नियम (F=ma) र प्रवेग गणना',
        'vi': 'Định luật II Newton (F=ma) và tính toán gia tốc vật thể',
        'zh-Hant': '利用牛頓第二運動定律 (F=ma) 計算加速度',
        'ja': 'ニュートン運動第2法則（F=ma）による物体の加速度計算',
        'es': 'Segunda ley de Newton (F=ma) y cálculo de aceleración',
        'fr': 'Deuxième loi de Newton (F=ma) et calcul d accélération',
        'hi': 'न्यूटन का दूसरा नियम (F=ma) और त्वरण की गणना'
    },
    '20261119-physics-g11-1': {
        'ko': '매질의 경계면에서 빛의 굴절과 꺾임 법칙',
        'en': 'Light Refraction and Wave Bending at Media Interfaces',
        'ne': 'माध्यमको सीमामा प्रकाशको अपवर्तन र झुकाव नियम',
        'vi': 'Hiện tượng khúc xạ ánh sáng và định luật bẻ cong tại mặt phân cách',
        'zh-Hant': '光在介質交界面的折射與偏折規律',
        'ja': '媒質の界面における光の屈折と曲がり方の法則',
        'es': 'Refracción de la luz y flexión en interfaces ópticas',
        'fr': 'Réfraction de la lumière et déviation aux interfaces',
        'hi': 'माध्यम सीमा पर प्रकाश का अपवर्तन और विक्षेपण'
    },
    '20261119-physics-g11-2': {
        'ko': '패러데이 전자기 유도 법칙과 자석 이동 유도 전류',
        'en': 'Faradays Law of Electromagnetic Induction and Induced Current',
        'ne': 'फ्याराडेको विद्युत चुम्बकीय प्रेरण नियम र प्रेरित धारा',
        'vi': 'Định luật cảm ứng điện từ Faraday và dòng điện cảm ứng',
        'zh-Hant': '法拉第電磁感應定律與磁鐵移動感應電流',
        'ja': 'ファラデーの電磁誘導の法則と磁石移動による誘導電流',
        'es': 'Ley de inducción electromagnética de Faraday y corriente inducida',
        'fr': 'Loi d induction électromagnétique de Faraday et courant induit',
        'hi': 'फैराडे का विद्युत चुंबकीय प्रेरण नियम और प्रेरित धारा'
    },
    '20261119-physics-g12-1': {
        'ko': '특수 상대성 이론의 두 가지 가설과 광속 불변의 원리',
        'en': 'Special Relativity Postulates and the Constancy of Light Speed',
        'ne': 'विशेष सापेक्षता सिद्धान्त र प्रकाशको गति स्थिरता',
        'vi': 'Các tiên đề của thuyết tương đối hẹp và nguyên lý tốc độ ánh sáng bất biến',
        'zh-Hant': '狹義相對論假設與光速不變原理',
        'ja': '特殊相対性理論の公理と光速度不変の原理',
        'es': 'Postulados de la relatividad especial y constancia de la velocidad de la luz',
        'fr': 'Postulats de la relativité restreinte et invariance de la vitesse de la lumière',
        'hi': 'विशेष सापेक्षता सिद्धांत और प्रकाश की गति की स्थिरता'
    },
    '20261119-physics-g12-2': {
        'ko': '광전 효과의 한계 진동수와 아인슈타인 광양자설',
        'en': 'Photoelectric Threshold Frequency and Einstein Photon Hypothesis',
        'ne': 'फोटोइलेक्ट्रिक थ्रेसहोल्ड आवृत्ति र फोटोन सिद्धान्त',
        'vi': 'Tần số ngưỡng quang điện và giả thuyết photon của Einstein',
        'zh-Hant': '光電效應的底限頻率與愛因斯坦光量子假說',
        'ja': '光電効果の限界振動数とアインシュタインの光量子仮説',
        'es': 'Frecuencia umbral fotoeléctrica e hipótesis de fotones de Einstein',
        'fr': 'Fréquence de seuil photoélectrique et hypothèse photonique d Einstein',
        'hi': 'प्रकाश विद्युत देहली आवृत्ति और आइंस्टीन का फोटॉन सिद्धांत'
    },

    # Chemistry G01..G12
    '20261119-chemistry-g01-1': {
        'ko': '그릇에 따라 변하지 않는 고체의 모양과 부피',
        'en': 'Fixed Shape and Definite Volume Characteristics of Solids',
        'ne': 'भाँडो अनुसार नबदलिने ठोसको आकार र आयतन',
        'vi': 'Hình dạng và thể tích cố định không đổi của chất rắn',
        'zh-Hant': '不隨容器改變的固體形狀與體積特性',
        'ja': '容器によって変化しない固体の形と体積',
        'es': 'Forma fija y volumen definido en sólidos',
        'fr': 'Forme et volume définis des solides',
        'hi': 'बर्तन बदलने पर भी न बदलने वाला ठोस का आकार और आयतन'
    },
    '20261119-chemistry-g01-2': {
        'ko': '풍선 속 공기 주입과 사방으로 퍼지는 기체의 성질',
        'en': 'Expansion of Injected Air in Balloons and Gas Dispersion',
        'ne': 'बेलुन फुलाउँदा हावा चारैतिर फैलिने ग्यासको गुण',
        'vi': 'Khí bơm vào bóng bay và tính chất khuếch tán mọi hướng của chất khí',
        'zh-Hant': '吹氣球與氣體向四面八方擴散的性質',
        'ja': '風船への空気注入と全方位に広がる気体の性質',
        'es': 'Expansión del aire en globos y dispersión de gases',
        'fr': 'Expansion de l air dans un ballon et diffusion des gaz',
        'hi': 'गुब्बारे में हवा भरने पर चारों ओर फैलने का गैस गुण'
    },
    '20261119-chemistry-g02-1': {
        'ko': '설탕물의 제조와 용해 전후의 질량 보존',
        'en': 'Sugar Dissolution and Conservation of Mass in Solution',
        'ne': 'चिनी घुल्ने प्रक्रिया र घोलमा पिण्ड संरक्षण',
        'vi': 'Sự hòa tan của đường và sự bảo toàn khối lượng dung dịch',
        'zh-Hant': '糖水調製與溶解前後的質量守恆',
        'ja': '砂糖水の調製と溶解前後の質量保存',
        'es': 'Disolución de azúcar y conservación de masa en soluciones',
        'fr': 'Dissolution du sucre et conservation de la masse en solution',
        'hi': 'चीनी का घुलना और विलयन में द्रव्यमान संरक्षण'
    },
    '20261119-chemistry-g02-2': {
        'ko': '물 온도 상승에 따른 설탕의 용해 속도와 분자 운동',
        'en': 'Water Temperature Effects on Dissolution Rates and Molecular Motion',
        'ne': 'पानीको तापक्रम अनुसार चिनी घुल्ने गति र आणविक चाल',
        'vi': 'Ảnh hưởng của nhiệt độ nước đến tốc độ hòa tan và chuyển động phân tử',
        'zh-Hant': '水溫升高對糖溶解速率與分子運動的影響',
        'ja': '水温上昇に伴う砂糖の溶解速度と分子運動',
        'es': 'Efectos de temperatura en tasas de disolución y movimiento molecular',
        'fr': 'Effet de la température sur la vitesse de dissolution et l agitation',
        'hi': 'पानी के तापमान के अनुसार चीनी घुलने की गति और आणविक गति'
    },
    '20261119-chemistry-g03-1': {
        'ko': '연소 반응이 일어나기 위한 세 가지 필수 조건',
        'en': 'Three Essential Conditions for Combustion Reactions',
        'ne': 'दहन प्रतिक्रियाका लागि आवश्यक ३ सर्तहरू',
        'vi': 'Ba điều kiện bắt buộc để phản ứng cháy xảy ra',
        'zh-Hant': '燃燒反應發生所必需的三大要素',
        'ja': '燃焼反応が起こるための3大必須条件',
        'es': 'Tres condiciones esenciales para reacciones de combustión',
        'fr': 'Trois conditions essentielles pour les réactions de combustion',
        'hi': 'दहन अभिक्रिया के लिए तीन आवश्यक शर्तें'
    },
    '20261119-chemistry-g03-2': {
        'ko': '비커 덮개를 통한 산소 차단과 촛불 소화 메커니즘',
        'en': 'Oxygen Deprivation via Beaker Covering and Flame Extinction',
        'ne': 'बिकरले छोपेर अक्सिजन बन्द गरी मैनबत्ती निभाउने विधि',
        'vi': 'Ngăn chặn oxy bằng cốc thủy tinh và cơ chế dập tắt nến',
        'zh-Hant': '以燒杯覆蓋阻絕氧氣與蠟燭熄滅機制',
        'ja': 'ビーカーによる酸素遮断とろうそくの消火メカニズム',
        'es': 'Extinción de llama por privación de oxígeno con vaso de precipitados',
        'fr': 'Extinction de flamme par privation d oxygène sous bécher',
        'hi': 'बीकर से ढककर ऑक्सीजन रोककर मोमबत्ती बुझाने की क्रिया'
    },
    '20261119-chemistry-g04-1': {
        'ko': '붉은 양배추 천연 지시약의 액성별 색깔 변화',
        'en': 'Red Cabbage Natural Indicator Color Changes Across pH Levels',
        'ne': 'रातो बन्दाको प्राकृतिक सूचकको रंग परिवर्तन',
        'vi': 'Sự đổi màu theo độ pH của chất chỉ thị tự nhiên bắp cải tím',
        'zh-Hant': '紫高麗菜天然指示劑在不同酸鹼性下的顏色變化',
        'ja': '赤キャベツ天然指示薬の液性別変色反応',
        'es': 'Cambios de color del indicador natural de col lombarda según pH',
        'fr': 'Virage de couleur de l indicateur naturel au chou rouge selon le pH',
        'hi': 'लाल पत्तागोभी के प्राकृतिक सूचक का रंग परिवर्तन'
    },
    '20261119-chemistry-g04-2': {
        'ko': '레몬즙과 비눗물의 산성·염기성 성질 구별',
        'en': 'Distinguishing Acidic and Basic Properties: Lemon Juice vs Soap Water',
        'ne': 'कागतीको रस र साबुन पानीको अम्ल-क्षार पहिचान',
        'vi': 'Phân biệt tính axit và bazơ giữa nước chanh và nước xà phòng',
        'zh-Hant': '檸檬汁與肥皂水的酸鹼性本質區分',
        'ja': 'レモン汁と石けん水の酸性・アルカリ性の性質識別',
        'es': 'Diferenciación de propiedades ácidas y básicas: Zumo de limón vs jabón',
        'fr': 'Différenciation acide-base : Jus de citron contre eau savonneuse',
        'hi': 'नींबू रस और साबुन पानी के अम्लीय व क्षारीय गुण'
    },
    '20261119-chemistry-g05-1': {
        'ko': '주사기 속 공기 압축과 보일 법칙(압력-부피 반비례)',
        'en': 'Syringe Air Compression and Boyles Law: Pressure and Volume',
        'ne': 'सिरिन्जमा हावाको चाप र बोयलको नियम (चाप-आयतन सम्बन्ध)',
        'vi': 'Nén khí trong ống tiêm và định luật Boyle: Áp suất và thể tích',
        'zh-Hant': '針筒空氣壓縮與波以耳定律（壓力與體積反比）',
        'ja': '注射器内の空気圧縮とボイルの法則（圧力と体積の反比例）',
        'es': 'Compresión de aire en jeringa y ley de Boyle: Presión y volumen',
        'fr': 'Compression d air dans une seringue et loi de Boyle : Pression et volume',
        'hi': 'सिरिंज में हवा का संपीड़न और बॉयल का नियम'
    },
    '20261119-chemistry-g05-2': {
        'ko': '여름철 밀폐 차 안 페트병 팽창과 샤를 법칙',
        'en': 'Thermal Bottle Expansion in Vehicles and Charles Law',
        'ne': 'गर्मीमा गाडीभित्र बोतल फुल्ने र चार्ल्सको नियम',
        'vi': 'Hiện tượng phồng chai nhựa trong xe mùa hè và định luật Charles',
        'zh-Hant': '夏季高溫車內寶特瓶膨脹與查理定律',
        'ja': '夏場の車内におけるペットボトル膨張とシャルルの法則',
        'es': 'Expansión de botellas plásticas en vehículos y ley de Charles',
        'fr': 'Dilatation d une bouteille en véhicule chaud et loi de Charles',
        'hi': 'गर्मी में बंद वाहन में बोतल का फूलना और चार्ल्स का नियम'
    },
    '20261119-chemistry-g06-1': {
        'ko': '소금과 물의 질량비를 통한 퍼센트 농도 계산',
        'en': 'Percent Mass Concentration Calculations in Salt Solutions',
        'ne': 'नुन र पानीको तौल अनुपातबाट प्रतिशत सान्द्रता गणना',
        'vi': 'Tính nồng độ phần trăm theo khối lượng trong dung dịch muối',
        'zh-Hant': '利用鹽與水質量比計算重量百分率濃度',
        'ja': '食塩と水の質量比による質量パーセント濃度計算',
        'es': 'Cálculo de concentración porcentual en masa de soluciones salinas',
        'fr': 'Calcul de concentration massique en pourcentage de solutions salines',
        'hi': 'नमक और पानी के द्रव्यमान से प्रतिशत सांद्रता की गणना'
    },
    '20261119-chemistry-g06-2': {
        'ko': '포화 용액의 냉각과 용해도 곡선 기반 결정 석출량',
        'en': 'Cooling Saturated Solutions and Solubility Curve Crystal Precipitation',
        'ne': 'संतृप्त घोल चिस्याउँदा घुलनशीलता अनुसार क्रिस्टल प्राप्त हुने मात्रा',
        'vi': 'Làm lạnh dung dịch bão hòa và lượng kết tinh theo đường cong độ tan',
        'zh-Hant': '飽和溶液冷卻與依溶解度曲線計算結晶析出量',
        'ja': '飽和溶液の冷却と溶解度曲線に基づく結晶析出量計算',
        'es': 'Enfriamiento de soluciones saturadas y precipitación según curva de solubilidad',
        'fr': 'Refroidissement de solution saturée et précipitation par courbe de solubilité',
        'hi': 'संतृप्त विलयन को ठंडा करने पर विलेयता वक्र से क्रिस्टलीकरण मात्रा'
    },
    '20261119-chemistry-g07-1': {
        'ko': '얼음-물-수증기 상태 변화 시 분자 배열과 보존',
        'en': 'Molecular Arrangement and Identity Retention Across State Changes',
        'ne': 'बरफ-पानी-बाफ अवस्था परिवर्तनमा अणुहरूको व्यवस्था र संरक्षण',
        'vi': 'Sắp xếp phân tử và sự bảo toàn bản chất qua các trạng thái rắn-lỏng-khí',
        'zh-Hant': '冰-水-水蒸氣三態變化中的分子排列與本質守恆',
        'ja': '氷・水・水蒸気の状態変化における分子配列と同一性保持',
        'es': 'Disposición molecular y conservación de identidad en cambios de estado',
        'fr': 'Arrangement moléculaire et conservation de la matière lors des changements d état',
        'hi': 'बर्फ-पानी-वाष्प अवस्था परिवर्तन में आणविक व्यवस्था'
    },
    '20261119-chemistry-g07-2': {
        'ko': '마당의 물 뿌리기와 기화열 흡수에 의한 냉각 현상',
        'en': 'Water Spray Evaporative Cooling and Heat of Vaporization',
        'ne': 'आँगनमा पानी छर्किँदा वाष्पीकरण ताप शोषणद्वारा शीतलता',
        'vi': 'Tưới nước sân vườn và hiệu ứng làm mát do thu nhiệt bay hơi',
        'zh-Hant': '庭院灑水與吸收汽化熱帶來的降溫現象',
        'ja': '打ち水と蒸発熱（気化熱）吸収による冷却現象',
        'es': 'Enfriamiento evaporativo por riego de agua y calor de vaporización',
        'fr': 'Refroidissement évaporatif par arrosage et chaleur de vaporisation',
        'hi': 'पानी छिड़कने पर वाष्पीकरण ऊष्मा अवशोषण से ठंडक'
    },
    '20261119-chemistry-g08-1': {
        'ko': '염화 나트륨의 불꽃 반응과 나트륨 고유 노란색 불꽃',
        'en': 'Sodium Flame Test and Characteristic Yellow Emission',
        'ne': 'सोडियम क्लोराइडको ज्वाला परीक्षण र पहेंलो ज्वाला',
        'vi': 'Thử màu ngọn lửa của natri clorua và ngọn lửa vàng đặc trưng',
        'zh-Hant': '氯化鈉的焰色反應與鈉元素特有黃色火焰',
        'ja': '塩化ナトリウムの炎色反応とナトリウム特有の黄色炎',
        'es': 'Ensayo a la llama de cloruro de sodio y emisión amarilla característica',
        'fr': 'Test de flamme du chlorure de sodium et émission jaune caractéristique',
        'hi': 'सोडियम क्लोराइड का ज्वाला परीक्षण और विशिष्ट पीली लौ'
    },
    '20261119-chemistry-g08-2': {
        'ko': '주기율표 같은 족 원소의 원자가 전자수와 화학적 유사성',
        'en': 'Periodic Group Trends: Valence Electrons and Chemical Similarity',
        'ne': 'आवर्त तालिकाको एउटै समूहका तत्त्वको भ्यालेन्स इलेक्ट्रोन र समानता',
        'vi': 'Xu hướng nhóm tuần hoàn: Số electron hóa trị và tính chất tương đồng',
        'zh-Hant': '元素週期表同族元素的最外層價電子數與化學性質相似性',
        'ja': '周期表同族元素の最外殻価電子数と化学的類似性',
        'es': 'Tendencias de grupos periódicos: Electrones de valencia y similitud química',
        'fr': 'Tendances des groupes du tableau périodique : Électrons de valence et similarités',
        'hi': 'आवर्त सारणी के एक ही समूह के संयोजी इलेक्ट्रॉन और रासायनिक समानता'
    },
    '20261119-chemistry-g09-1': {
        'ko': '밀폐 강철 용기에서 탄소와 산소의 질량 보존 법칙',
        'en': 'Law of Conservation of Mass in Sealed Carbon Combustion',
        'ne': 'बन्द भाँडोमा कार्बन र अक्सिजनको पिण्ड संरक्षण नियम',
        'vi': 'Định luật bảo toàn khối lượng khi đốt carbon trong bình kín',
        'zh-Hant': '密閉容器中碳與氧反應的質量守恆定律',
        'ja': '密閉鋼鉄容器における炭素と酸素の質量保存の法則',
        'es': 'Ley de conservación de la masa en combustión de carbono en recipiente sellado',
        'fr': 'Loi de conservation de la masse lors de la combustion du carbone en vase clos',
        'hi': 'बंद पात्र में कार्बन और ऑक्सीजन का द्रव्यमान संरक्षण नियम'
    },
    '20261119-chemistry-g09-2': {
        'ko': '물의 수소-산소 1:8 질량비와 일정 성분비 법칙',
        'en': 'Law of Definite Proportions: 1:8 Hydrogen-Oxygen Mass Ratio in Water',
        'ne': 'पानीमा हाइड्रोजन-अक्सिजन १:८ पिण्ड अनुपात र निश्चित अनुपात नियम',
        'vi': 'Định luật thành phần không đổi: Tỉ lệ khối lượng 1:8 của H và O trong nước',
        'zh-Hant': '定比定律：水中氫與氧 1:8 的質量比',
        'ja': '定比例の法則：水における水素と酸素の1:8質量比',
        'es': 'Ley de proporciones definidas: Relación de masa 1:8 de hidrógeno-oxígeno en agua',
        'fr': 'Loi des proportions définies : Rapport massique hydrogène-oxygène 1:8 dans l eau',
        'hi': 'निश्चित अनुपात का नियम: जल में हाइड्रोजन-ऑक्सीजन 1:8 द्रव्यमान अनुपात'
    },
    '20261119-chemistry-g10-1': {
        'ko': '염화 나트륨의 고체 및 수용액 상태별 전기 전도성 비교',
        'en': 'Electrical Conductivity of Ionic Compounds: Solid vs Aqueous NaCl',
        'ne': 'सोडियम क्लोराइडको ठोस र घोल अवस्थामा विद्युत चालकता',
        'vi': 'Độ dẫn điện của hợp chất ion: So sánh NaCl thể rắn và dung dịch',
        'zh-Hant': '氯化鈉在固體與水溶液狀態下的導電性比較',
        'ja': '塩化ナトリウムの固体および水溶液状態における電気伝導性比較',
        'es': 'Conductividad eléctrica de compuestos iónicos: NaCl sólido vs acuoso',
        'fr': 'Conductivité électrique des composés ioniques : NaCl solide contre aqueux',
        'hi': 'ठोस और जलीय NaCl की विद्युत चालकता की तुलना'
    },
    '20261119-chemistry-g10-2': {
        'ko': '분자 구조 대칭성에 따른 물의 극성과 메테인의 무극성',
        'en': 'Molecular Geometry and Polarity: Polar Water vs Nonpolar Methane',
        'ne': 'आणविक संरचना अनुसार पानीको ध्रुवीयता र मिथेनको अध्रुवीयता',
        'vi': 'Cấu trúc hình học phân tử: Nước phân cực và metan không phân cực',
        'zh-Hant': '依分子對稱性分析水的極性與甲烷的非極性',
        'ja': '分子構造の対称性による水の極性とメタンの無極性',
        'es': 'Geometría molecular y polaridad: Agua polar vs metano no polar',
        'fr': 'Géométrie moléculaire et polarité : Eau polaire contre méthane apolaire',
        'hi': 'आणविक संरचना और ध्रुवता: ध्रुवीय जल और अध्रुवीय मीथेन'
    },
    '20261119-chemistry-g11-1': {
        'ko': '수소 기체 질량 기반 분자 몰수와 아보가드로수 계산',
        'en': 'Molar Calculations and Avogadros Number from Gas Mass',
        'ne': 'ग्यासको तौलबाट मोल र एभोगाद्रो संख्या गणना',
        'vi': 'Tính số mol phân tử và số Avogadro từ khối lượng khí hydro',
        'zh-Hant': '依氣體質量計算分子莫耳數與亞佛加厥數',
        'ja': '気体質量に基づく分子モル数とアボガドロ数の計算',
        'es': 'Cálculo de moles y número de Avogadro a partir de masa gaseosa',
        'fr': 'Calcul de moles et nombre d Avogadro à partir de la masse gazeuse',
        'hi': 'गैस द्रव्यमान से मोल और आवोगाद्रो संख्या की गणना'
    },
    '20261119-chemistry-g11-2': {
        'ko': '기체 반응 법칙과 암모니아 합성 반응의 부피비 양론',
        'en': 'Gay-Lussacs Law of Combining Volumes in Ammonia Synthesis',
        'ne': 'ग्यास प्रतिक्रिया नियम र अमोनिया संश्लेषणमा आयतन अनुपात',
        'vi': 'Định luật tỉ lệ thể tích khí và lượng khí amoniac tạo thành',
        'zh-Hant': '氣體反應體積定律與氨氣合成反應體積計量',
        'ja': '気体反応の法則とアンモニア合成反応の気体体積比計算',
        'es': 'Ley de volúmenes de combinación en síntesis de amoníaco',
        'fr': 'Loi des volumes de combinaison dans la synthèse de l ammoniac',
        'hi': 'गैस आयतन संयोजन नियम और अमोनिया संश्लेषण में आयतन गणना'
    },
    '20261119-chemistry-g12-1': {
        'ko': '온도·촉매에 따른 유효 충돌 빈도와 반응 속도 증가 원리',
        'en': 'Temperature, Catalysts, Effective Collision Frequency, and Reaction Rates',
        'ne': 'तापक्रम, उत्प्रेरक र प्रभावकारी टक्कर अनुसार प्रतिक्रिया गति',
        'vi': 'Tần số va chạm hiệu quả và tốc độ phản ứng theo nhiệt độ và chất xúc tác',
        'zh-Hant': '溫度、催化劑對有效碰撞頻率與反應速率的影響機制',
        'ja': '温度・触媒による有効衝突頻度と反応速度増加の原理',
        'es': 'Temperatura, catalizadores, frecuencia de colisión efectiva y velocidad',
        'fr': 'Température, catalyseurs, fréquence des chocs efficaces et vitesse',
        'hi': 'तापमान, उत्प्रेरक, प्रभावी टक्कर आवृत्ति और अभिक्रिया दर'
    },
    '20261119-chemistry-g12-2': {
        'ko': '암모니아 발열 평형에서 르샤틀리에 원리와 최적 수득률 조건',
        'en': 'Le Chateliers Principle and Yield Optimization in Ammonia Synthesis',
        'ne': 'अमोनिया संश्लेषणमा ले शातेलिएको नियम र अधिकतम उत्पादन सर्त',
        'vi': 'Nguyên lý Le Chatelier và điều kiện tối ưu hiệu suất tổng hợp amoniac',
        'zh-Hant': '勒沙特列原理與氨氣合成反應的最佳產率條件',
        'ja': 'アンモニア合成平衡におけるルシャトリエの原理と最適収率条件',
        'es': 'Principio de Le Chatelier y optimización del rendimiento en amoníaco',
        'fr': 'Principe de Le Chatelier et optimisation du rendement de synthèse d ammoniac',
        'hi': 'अमोनिया संश्लेषण में ले शातेलिए का नियम और अधिकतम उत्पादन शर्तें'
    }
}

# 1. Update master with DISTINCT_48
all_langs = list(master[list(master.keys())[0]].keys())
for qid, lang_dict in DISTINCT_48.items():
    if qid not in master:
        master[qid] = {}
    for lang in all_langs:
        if lang in lang_dict:
            master[qid][lang] = lang_dict[lang]
        elif lang == 'zh-Hans':
            # convert or fallback to zh-Hant / en
            master[qid][lang] = lang_dict.get('zh-Hant', lang_dict.get('en'))
        else:
            # fallback to existing or en
            master[qid][lang] = lang_dict.get('en', master[qid].get(lang, ''))

with open(MASTER_PATH, 'w', encoding='utf-8') as f:
    json.dump(master, f, ensure_ascii=False, indent=2)

print('Updated science_titles_master.json with 48 distinct titles!')
