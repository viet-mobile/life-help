# -*- coding: utf-8 -*-
import json
import os
import re

ROOT = '/Users/juboklee/life-project/life-help'

PHYSICS_TOPICS = {
    'g01': {
        'ko': '자석의 성질과 물체의 당김·밈',
        'en': 'Properties of Magnets and Magnetic Attraction and Repulsion',
        'gl': 'Propiedades dos imáns e atracción e repulsión magnética',
        'es': 'Propiedades de los imanes y atracción y repulsión magnética',
        'vi': 'Tính chất của nam châm và lực hút đẩy từ tính',
        'zh-Hans': '磁铁的性质与物体的吸引和排斥',
        'zh-Hant': '磁鐵的性質與物體的吸引和排斥',
        'ja': '磁石の性質と物体の引きつけ・退け合い'
    },
    'g02': {
        'ko': '소리의 전달과 진동의 관찰',
        'en': 'Transmission of Sound and Observation of Vibration',
        'gl': 'Transmisión do son e observación da vibración',
        'es': 'Transmisión del sonido y observación de la vibración',
        'vi': 'Sự truyền âm và quan sát dao động',
        'zh-Hans': '声音的传播与振动的观察',
        'zh-Hant': '聲音的傳播與振動的觀察',
        'ja': '音の伝播と振動の観察'
    },
    'g03': {
        'ko': '그림자의 형성과 빛의 직진',
        'en': 'Formation of Shadows and Straight Propagation of Light',
        'gl': 'Formación de sombras e propagación rectilínea da luz',
        'es': 'Formación de sombras y propagación rectilínea de la luz',
        'vi': 'Sự tạo bóng và sự truyền thẳng của ánh sáng',
        'zh-Hans': '影子的形成与光的直线传播',
        'zh-Hant': '影子的形成與光的直線傳播',
        'ja': '影の形成と光の直進'
    },
    'g04': {
        'ko': '수평 잡기와 지레의 기초 원리',
        'en': 'Balancing and Fundamental Principles of Levers',
        'gl': 'Equilibrio e principios fundamentais da panca',
        'es': 'Equilibrio y principios fundamentales de la palanca',
        'vi': 'Cân bằng và các nguyên lý cơ bản của đòn bẩy',
        'zh-Hans': '平衡调节与杠杆的基本原理',
        'zh-Hant': '平衡調節與槓桿的基本原理',
        'ja': '水平の保持とてこの基本原理'
    },
    'g05': {
        'ko': '물체의 빠르기와 속력의 개념',
        'en': 'Motion of Objects and the Concept of Speed',
        'gl': 'Movemento dos obxectos e concepto de velocidade',
        'es': 'Movimiento de los objetos y concepto de rapidez',
        'vi': 'Chuyển động của vật thể và khái niệm tốc độ',
        'zh-Hans': '物体的运动快慢与速度概念',
        'zh-Hant': '物體的運動快慢與速度概念',
        'ja': '物体の速さと速度の概念'
    },
    'g06': {
        'ko': '전기의 흐름과 전구의 직렬·병렬 연결',
        'en': 'Flow of Electricity and Series and Parallel Bulb Circuits',
        'gl': 'Fluxo de electricidade e circuítos de lámpadas en serie e paralelo',
        'es': 'Flujo de electricidad y circuitos de bombillas en serie y paralelo',
        'vi': 'Dòng điện và mạch bóng đèn nối tiếp, song song',
        'zh-Hans': '电流与灯泡的串联和并联',
        'zh-Hant': '電流與燈泡的串聯和並聯',
        'ja': '電流の流れと電球の直列・並列接続'
    },
    'g07': {
        'ko': '힘의 합성과 마찰력, 부력의 평형',
        'en': 'Force Composition, Friction, and Buoyancy Equilibrium',
        'gl': 'Composición de forzas, rozamento e equilibrio de flotabilidade',
        'es': 'Composición de fuerzas, fricción y equilibrio de flotabilidad',
        'vi': 'Tổng hợp lực, lực ma sát và cân bằng lực đẩy Ác-si-mét',
        'zh-Hans': '力的合成、摩擦力与浮力的平衡',
        'zh-Hant': '力的合成、摩擦力與浮力的平衡',
        'ja': '力の合成、摩擦力と浮力の平衡'
    },
    'g08': {
        'ko': '열과 우리 생활, 비열과 열팽창',
        'en': 'Heat in Everyday Life: Specific Heat and Thermal Expansion',
        'gl': 'A calor na nosa vida: calor específica e dilatación térmica',
        'es': 'El calor en nuestra vida: calor específico y dilatación térmica',
        'vi': 'Nhiệt và đời sống: Nhiệt dung riêng và sự nở vì nhiệt',
        'zh-Hans': '热与日常生活：比热容与热膨胀',
        'zh-Hant': '熱與日常生活：比熱容與熱膨脹',
        'ja': '熱と生活：比熱と熱膨張'
    },
    'g09': {
        'ko': '일과 역학적 에너지 보존 법칙',
        'en': 'Work and Law of Conservation of Mechanical Energy',
        'gl': 'Traballo e lei de conservación da enerxía mecánica',
        'es': 'Trabajo y ley de conservación de la energía mecánica',
        'vi': 'Công và định luật bảo toàn cơ năng',
        'zh-Hans': '功与机械能守恒定律',
        'zh-Hant': '功與機械能守恆定律',
        'ja': '仕事と力学的エネルギー保存の法則'
    },
    'g10': {
        'ko': '뉴턴의 운동 세 가지 법칙과 운동량 보존',
        'en': 'Newton Three Laws of Motion and Momentum Conservation',
        'gl': 'As tres leis do movemento de Newton e conservación do momento',
        'es': 'Las tres leyes del movimiento de Newton y conservación del momento',
        'vi': 'Ba định luật chuyển động của Newton và bảo toàn động lượng',
        'zh-Hans': '牛顿三大运动定律与动量守恒',
        'zh-Hant': '牛頓三大運動定律與動量守恆',
        'ja': 'ニュートンの三法則と運動量保存'
    },
    'g11': {
        'ko': '파동의 굴절, 간섭 및 전자기 유도 현상',
        'en': 'Wave Refraction, Interference, and Electromagnetic Induction',
        'gl': 'Refracción e interferencia de ondas e indución electromagnética',
        'es': 'Refracción e interferencia de ondas e inducción electromagnética',
        'vi': 'Khúc xạ, giao thoa sóng và hiện tượng cảm ứng điện từ',
        'zh-Hans': '波的折射、干涉与电磁感应现象',
        'zh-Hant': '波的折射、干涉與電磁感應現象',
        'ja': '波の屈折・干渉および電磁誘導現象'
    },
    'g12': {
        'ko': '특수 상대성 이론과 광전 효과, 현대 물리학적 직관',
        'en': 'Special Relativity, Photoelectric Effect, and Modern Physics Intuition',
        'gl': 'Relatividade especial, efecto fotoeléctrico e intuición da física moderna',
        'es': 'Relatividad especial, efecto fotoeléctrico e intuición de la física moderna',
        'vi': 'Thuyết tương đối hẹp, hiệu ứng quang điện và trực giác vật lý hiện đại',
        'zh-Hans': '狭义相对论、光电效应与现代物理直觉',
        'zh-Hant': '狹義相對論、光電效應與現代物理直覺',
        'ja': '特殊相対性理論、光電効果と現代物理学的直観'
    }
}

CHEMISTRY_TOPICS = {
    'g01': {
        'ko': '고체, 액체, 기체의 상태 관찰과 부피',
        'en': 'States of Matter: Solids, Liquids, Gases and Volume',
        'gl': 'Estados da materia: sólidos, líquidos, gases e volume',
        'es': 'Estados de la materia: sólidos, líquidos, gases y volumen',
        'vi': 'Các trạng thái của vật chất: Rắn, lỏng, khí và thể tích',
        'zh-Hans': '固体、液体、气体的状态观察与体积',
        'zh-Hant': '固體、液體、氣體的狀態觀察與體積',
        'ja': '固体・液体・気体の状態観察と体積'
    },
    'g02': {
        'ko': '물질의 섞임과 용해 현상',
        'en': 'Mixtures of Substances and Dissolution Phenomena',
        'gl': 'Mesturas de substancias e fenómenos de disolución',
        'es': 'Mezclas de sustancias y fenómenos de disolución',
        'vi': 'Sự trộn lẫn của các chất và hiện tượng hòa tan',
        'zh-Hans': '物质的混合与溶解现象',
        'zh-Hant': '物質的混合與溶解現象',
        'ja': '物質の混合と溶解現象'
    },
    'g03': {
        'ko': '물질의 연소와 소화의 조건',
        'en': 'Combustion of Substances and Conditions for Extinguishing',
        'gl': 'Combustión de substancias e condicións de extinción',
        'es': 'Combustión de sustancias y condiciones de extinción',
        'vi': 'Sự cháy của các chất và điều kiện dập tắt',
        'zh-Hans': '物质的燃烧与灭火条件',
        'zh-Hant': '物質的燃燒與滅火條件',
        'ja': '物質の燃焼と消火の条件'
    },
    'g04': {
        'ko': '산과 염기의 색깔 변화와 지시약',
        'en': 'Color Changes in Acids and Bases and Chemical Indicators',
        'gl': 'Cambios de cor en ácidos e bases e indicadores químicos',
        'es': 'Cambios de color en ácidos y bases e indicadores químicos',
        'vi': 'Sự đổi màu của axit, bazơ và chất chỉ thị màu',
        'zh-Hans': '酸和碱的颜色变化与指示剂',
        'zh-Hant': '酸和鹼的顏色變化與指示劑',
        'ja': '酸と塩基の色の変化と指示薬'
    },
    'g05': {
        'ko': '기체의 발생과 압력-온도에 따른 부피 변화',
        'en': 'Gas Generation and Volume Variations with Pressure and Temperature',
        'gl': 'Xeración de gases e variacións de volume con presión e temperatura',
        'es': 'Generación de gases y variaciones de volumen con presión y temperatura',
        'vi': 'Sự tạo thành chất khí và biến thiên thể tích theo áp suất, nhiệt độ',
        'zh-Hans': '气体的产生及随压力和温度的体积变化',
        'zh-Hant': '氣體的產生及隨壓力和溫度的體積變化',
        'ja': '気体の発生と圧力・温度による体積変化'
    },
    'g06': {
        'ko': '용액의 진하기와 용해도 곡선 해석',
        'en': 'Solution Concentration and Solubility Curve Interpretation',
        'gl': 'Concentración de disolucións e interpretación de curvas de solubilidade',
        'es': 'Concentración de disoluciones e interpretación de curvas de solubilidad',
        'vi': 'Nồng độ dung dịch và phân tích đường cong độ tan',
        'zh-Hans': '溶液浓度与溶解度曲线解读',
        'zh-Hant': '溶液濃度與溶解度曲線解讀',
        'ja': '溶液の濃さと溶解度曲線の解釈'
    },
    'g07': {
        'ko': '물질의 세 가지 상태와 분자 배열의 변화',
        'en': 'Three States of Matter and Molecular Arrangement Changes',
        'gl': 'Tres estados da materia e cambios na disposición molecular',
        'es': 'Tres estados de la materia y cambios en la disposición molecular',
        'vi': 'Ba trạng thái của vật chất và sự thay đổi sắp xếp phân tử',
        'zh-Hans': '物质的三态与分子排列变化',
        'zh-Hant': '物質的三態與分子排列變化',
        'ja': '物質の三態と分子配列の変化'
    },
    'g08': {
        'ko': '물질의 구성 원소와 불꽃 반응, 주기율표의 규칙',
        'en': 'Constituent Elements, Flame Tests, and Periodic Table Trends',
        'gl': 'Elementos constituíntes, ensaios á chama e tendencias da táboa periódica',
        'es': 'Elementos constituyentes, ensayos a la llama y tendencias de la tabla periódica',
        'vi': 'Nguyên tố cấu thành, phản ứng cháy tạo màu và quy luật bảng tuần hoàn',
        'zh-Hans': '物质的构成元素、焰色反应与元素周期表规律',
        'zh-Hant': '物質的構成元素、焰色反應與元素週期表規律',
        'ja': '物質の構成元素と炎色反応、周期表の規則性'
    },
    'g09': {
        'ko': '화학 반응의 법칙: 질량 보존과 일정 성분비 법칙',
        'en': 'Laws of Chemical Change: Mass Conservation and Definite Proportions',
        'gl': 'Leis do cambio químico: conservación da masa e proporcións definidas',
        'es': 'Leyes del cambio químico: conservación de la masa y proporciones definidas',
        'vi': 'Định luật hóa học: Bảo toàn khối lượng và thành phần không đổi',
        'zh-Hans': '化学反应定律：质量守恒定律与定组成定律',
        'zh-Hant': '化學反應定律：質量守恆定律與定組成定律',
        'ja': '化学反応の法則：質量保存と定比例の法則'
    },
    'g10': {
        'ko': '화학 결합(이온 결합, 공유 결합)과 분자의 극성',
        'en': 'Chemical Bonding (Ionic, Covalent) and Molecular Polarity',
        'gl': 'Enlace químico (iónico, covalente) e polaridade molecular',
        'es': 'Enlace químico (iónico, covalente) y polaridad molecular',
        'vi': 'Liên kết hóa học (liên kết ion, liên kết cộng hóa trị) và độ phân cực phân tử',
        'zh-Hans': '化学键（离子键、共价键）与分子极性',
        'zh-Hant': '化學鍵（離子鍵、共價鍵）與分子極性',
        'ja': '化学結合（イオン結合、共有結合）と分子の極性'
    },
    'g11': {
        'ko': '몰(mol)의 개념과 기체 반응 법칙, 화학 반응식의 양적 관계',
        'en': 'Concept of Mole, Gas Reactions, and Chemical Reaction Stoichiometry',
        'gl': 'Concepto de mol, reaccións gasosas e estequiometría de reaccións químicas',
        'es': 'Concepto de mol, reacciones gaseosas y estequiometría de reacciones químicas',
        'vi': 'Khái niệm mol, định luật thể tích khí và mối quan hệ định lượng trong phương trình hóa học',
        'zh-Hans': '摩尔（mol）概念、气体反应定律与化学方程式定量关系',
        'zh-Hant': '莫耳（mol）概念、氣體反應定律與化學方程式定量關係',
        'ja': 'モル（mol）の概念と気体反応の法則、化学反応式の量的関係'
    },
    'g12': {
        'ko': '반응 속도론, 화학 평형의 이동과 르샤틀리에의 원리',
        'en': 'Reaction Kinetics, Equilibrium Shifts, and Le Chatelier Principle',
        'gl': 'Cinética química, desprazamentos de equilibrio e principio de Le Chatelier',
        'es': 'Cinética química, desplazamientos de equilibrio y principio de Le Chatelier',
        'vi': 'Tốc độ phản ứng, chuyển dịch cân bằng hóa học và nguyên lý Le Chatelier',
        'zh-Hans': '反应动力学、化学平衡移动与勒夏特列原理',
        'zh-Hant': '反應動力學、化學平衡移動與勒夏特列原理',
        'ja': '反応速度論、化学平衡の移動とルシャトリエの原理'
    }
}

print('Dictionaries loaded successfully.')
