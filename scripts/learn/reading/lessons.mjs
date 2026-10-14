/**
 * English Advanced Reading Track (고등 심화 독해 트랙):
 * 4 elective courses for H2/H3 learners covering authentic academic, humanities, science and economic texts (CEFR B1-B2).
 */

export const COURSES = {
  "en-el-hum": {
    id: "en-el-hum",
    title: { ko: "인문·사회 심화 독해", en: "Advanced Reading · Humanities and Society", vi: "Đọc hiểu nâng cao · Nhân văn và Xã hội" },
    world: {
      name: { ko: "인문의 숲 (Forest of Humanities)", en: "Forest of Humanities", vi: "Rừng nhân văn (Forest of Humanities)" },
      emoji: "🏛️",
      tagline: { ko: "인간과 사회를 성찰하는 깊이 있는 원서 독해", en: "Deep critical reading on human culture, identity and society", vi: "Đọc hiểu sâu sắc về văn hóa, bản sắc và xã hội" }
    },
    unitTitle: { ko: "인문·사회 심화 지문", en: "Humanities and Society Passages", vi: "Các đoạn văn Nhân văn và Xã hội" }
  },
  "en-el-sci": {
    id: "en-el-sci",
    title: { ko: "과학·기술 심화 독해", en: "Advanced Reading · Science and Technology", vi: "Đọc hiểu nâng cao · Khoa học và Công nghệ" },
    world: {
      name: { ko: "탐구의 연구소 (Lab of Discovery)", en: "Lab of Discovery", vi: "Phòng thí nghiệm khám phá (Lab of Discovery)" },
      emoji: "🔬",
      tagline: { ko: "인공지능, 기후 위기, 생명과학 최신 학술 독해", en: "Academic reading on AI, climate resilience and modern science", vi: "Đọc hiểu học thuật về AI, biến đổi khí hậu và khoa học hiện đại" }
    },
    unitTitle: { ko: "과학·기술 심화 지문", en: "Science and Technology Passages", vi: "Các đoạn văn Khoa học và Công nghệ" }
  },
  "en-el-eco": {
    id: "en-el-eco",
    title: { ko: "경제·경영 실전 독해", en: "Advanced Reading · Economics and Global Trends", vi: "Đọc hiểu nâng cao · Kinh tế và Xu hướng Toàn cầu" },
    world: {
      name: { ko: "글로벌 마켓 (Global Market)", en: "Global Market", vi: "Thị trường toàn cầu (Global Market)" },
      emoji: "📈",
      tagline: { ko: "행동경제학과 글로벌 무역, 데이터 기반 실전 분석", en: "Critical economic trends, decision-making and digital commerce", vi: "Xu hướng kinh tế, ra quyết định và thương mại số" }
    },
    unitTitle: { ko: "경제·경영 실전 지문", en: "Economics and Global Trends Passages", vi: "Các đoạn văn Kinh tế và Xu hướng Toàn cầu" }
  },
  "en-el-aca": {
    id: "en-el-aca",
    title: { ko: "학술 논리와 빈칸 추론", en: "Advanced Reading · Academic Logic and Synthesis", vi: "Đọc hiểu nâng cao · Logic học thuật và Suy luận" },
    world: {
      name: { ko: "논리의 탑 (Tower of Logic)", en: "Tower of Logic", vi: "Tòa tháp logic (Tower of Logic)" },
      emoji: "🗼",
      tagline: { ko: "숨은 전제 찾기, 빈칸 추론, 두 지문의 논리적 통합", en: "Premise analysis, inferencing and synthesis of complex arguments", vi: "Phân tích tiền đề, suy luận logic và tổng hợp lập luận" }
    },
    unitTitle: { ko: "논리 분석과 빈칸 추론", en: "Logic and Inference Passages", vi: "Các đoạn văn Logic và Suy luận" }
  }
};

export const READING_LESSONS = [
  // 1. Humanities
  {
    courseId: "en-el-hum",
    skillId: "en.el.hum1",
    skillTitle: { ko: "문화적 정체성과 언어", en: "Cultural Identity and Language", vi: "Bản sắc văn hóa và Ngôn ngữ" },
    id: "en-el-hum1",
    title: { ko: "문화적 정체성과 언어", en: "Cultural Identity and Language", vi: "Bản sắc văn hóa và Ngôn ngữ" },
    concept: {
      ko: "언어는 단순한 의사소통 수단을 넘어 사용자의 사고방식과 세계관을 반영합니다. 문화적 정체성이 언어 사용에 미치는 영향을 파악합니다.",
      en: "Language is more than a tool for communication; it shapes our worldview and embodies cultural memory. Analyze how identity influences linguistic choices.",
      vi: "Ngôn ngữ không chỉ là công cụ giao tiếp mà còn phản ánh thế giới quan và bản sắc văn hóa. Phân tích tác động của bản sắc lên ngôn ngữ."
    },
    passage: "Language is not merely a vehicle for exchanging factual information; it carries the collective memory and values of a community. When an endangered language disappears, humanity loses a unique lens through which the natural world was understood and classified.",
    questions: [
      {
        id: "en-el-hum1-q1",
        type: "multiple_choice",
        prompt: { ko: "글의 주제로 가장 적절한 것은?", en: "What is the main topic of the passage?", vi: "Chủ đề chính của đoạn văn là gì?" },
        options: [
          { id: "a", text: "Language as an embodiment of cultural memory and worldview" },
          { id: "b", text: "The economic necessity of learning global languages" },
          { id: "c", text: "Grammatical similarities across modern dialects" },
          { id: "d", text: "How technology accelerates the spread of major languages" }
        ],
        answer: "a",
        hints: [
          { ko: "언어가 단순한 정보 교환 이상의 것(집단적 기억과 가치)을 담고 있다는 점에 주목하세요.", en: "Notice that language carries collective memory and community values." },
          { ko: "마지막 문장의 'unique lens'가 상징하는 바를 생각해보세요.", en: "Consider what the 'unique lens' in the final sentence symbolizes." }
        ],
        explanation: {
          ko: "글쓴이는 언어가 공동체의 집단적 기억과 가치를 담고 있으며, 언어 소멸 시 세상을 이해하는 독특한 시각을 잃게 된다고 강조하고 있습니다.",
          en: "The author emphasizes that language carries cultural memory and worldview, and its loss deprives humanity of a unique perspective.",
          vi: "Tác giả nhấn mạnh ngôn ngữ chứa đựng ký ức văn hóa và thế giới quan độc đáo của cộng đồng."
        }
      },
      {
        id: "en-el-hum1-q2",
        type: "multiple_choice",
        prompt: { ko: "밑줄 친 'unique lens'가 의미하는 바로 가장 알맞은 것은?", en: "What does the phrase 'unique lens' most likely refer to?", vi: "Cụm từ 'unique lens' chỉ điều gì?" },
        options: [
          { id: "a", text: "A distinctive perspective for understanding reality" },
          { id: "b", text: "A physical instrument used by anthropologists" },
          { id: "c", text: "An artificial translation algorithm" },
          { id: "d", text: "A common standard for global grammar" }
        ],
        answer: "a",
        hints: [
          { ko: "문맥상 'through which the natural world was understood'를 수식하고 있습니다.", en: "In context, it modifies 'through which the natural world was understood'." },
          { ko: "세상을 바라보고 분류하는 독특한 관점을 가리킵니다.", en: "It refers to a distinctive way of perceiving and categorizing the world." }
        ],
        explanation: {
          ko: "'unique lens'는 자연과 세상을 이해하고 분류하는 언어 공동체 고유의 독특한 관점(perspective)을 뜻합니다.",
          en: "'Unique lens' signifies a distinctive perspective through which reality was interpreted and categorized.",
          vi: "'Unique lens' biểu thị một góc nhìn riêng biệt để hiểu và phân loại thế giới xung quanh."
        }
      }
    ]
  },
  {
    courseId: "en-el-hum",
    skillId: "en.el.hum2",
    skillTitle: { ko: "현대 사회의 윤리와 선택", en: "Ethics in the Modern World", vi: "Đạo đức trong Thế giới Hiện đại" },
    id: "en-el-hum2",
    title: { ko: "현대 사회의 윤리와 선택", en: "Ethics in the Modern World", vi: "Đạo đức trong Thế giới Hiện đại" },
    concept: {
      ko: "급변하는 디지털 사회에서 개인의 선택과 공동체의 공공선 사이의 윤리적 딜레마를 분석합니다.",
      en: "Examine moral dilemmas between individual autonomy and collective well-being in highly connected modern societies.",
      vi: "Phân tích các tình huống tiến thoái lưỡng nan về đạo đức giữa quyền tự do cá nhân và lợi ích tập thể."
    },
    passage: "Moral decisions in interconnected societies rarely affect only the decision-maker. As digital networks amplify individual actions, personal choices regarding data sharing and public discourse inevitably ripple across the entire social fabric, demanding a renewed sense of civic responsibility.",
    questions: [
      {
        id: "en-el-hum2-q1",
        type: "multiple_choice",
        prompt: { ko: "글의 요지로 가장 적절한 것은?", en: "Which statement best summarizes the passage?", vi: "Câu nào tóm tắt tốt nhất nội dung đoạn văn?" },
        options: [
          { id: "a", text: "Interconnected networks require greater civic awareness of individual choices" },
          { id: "b", text: "Individual privacy should be protected without any restriction" },
          { id: "c", text: "Digital communication weakens personal accountability" },
          { id: "d", text: "Traditional ethics are entirely obsolete in the internet age" }
        ],
        answer: "a",
        hints: [
          { ko: "개인의 선택이 전체 사회 구조에 파급 효과를 미친다는 점을 확인하세요.", en: "Notice that individual actions ripple across the whole social fabric." },
          { ko: "마지막 구절의 'renewed sense of civic responsibility'가 핵심입니다.", en: "Focus on the concluding call for 'a renewed sense of civic responsibility'." }
        ],
        explanation: {
          ko: "디지털 네트워크로 인해 개인의 선택이 사회 전체로 증폭되므로 더 높은 시민적 책임 의식이 요구된다는 요지입니다.",
          en: "Because individual choices ripple across digital networks, a heightened sense of civic responsibility is essential.",
          vi: "Vì các lựa chọn cá nhân lan tỏa trong mạng xã hội số, ý thức trách nhiệm công dân cần được nâng cao."
        }
      }
    ]
  },
  // 2. Science
  {
    courseId: "en-el-sci",
    skillId: "en.el.sci1",
    skillTitle: { ko: "인공지능과 인간의 마음", en: "AI and the Human Mind", vi: "Trí tuệ nhân tạo và Tâm trí Con người" },
    id: "en-el-sci1",
    title: { ko: "인공지능과 인간의 마음", en: "AI and the Human Mind", vi: "Trí tuệ nhân tạo và Tâm trí Con người" },
    concept: {
      ko: "대규모 언어 모델의 연산 능력과 인간 고유의 직관, 감정, 맥락 추론의 차이점을 학술적으로 분석합니다.",
      en: "Contrast the computational pattern recognition of machine learning models with human intuition, context reasoning, and consciousness.",
      vi: "So sánh khả năng nhận diện mẫu của máy học với trực giác và suy luận bối cảnh của con người."
    },
    passage: "While generative models excel at predicting plausible token sequences based on vast corpora, they do not possess subjective experience or intentionality. Human comprehension is grounded in physical embodiment and emotional salience, aspects that purely statistical text processing cannot replicate.",
    questions: [
      {
        id: "en-el-sci1-q1",
        type: "multiple_choice",
        prompt: { ko: "글에 드러난 기계 모델과 인간 이해의 본질적 차이는?", en: "What fundamental distinction between AI and human comprehension is emphasized?", vi: "Điểm khác biệt cốt lõi giữa AI và sự hiểu của con người là gì?" },
        options: [
          { id: "a", text: "Human understanding is rooted in embodied and subjective experience" },
          { id: "b", text: "AI models have greater capacity for emotional sensitivity" },
          { id: "c", text: "Human cognition relies entirely on statistical token prediction" },
          { id: "d", text: "Generative models can synthesize physical biological feelings" }
        ],
        answer: "a",
        hints: [
          { ko: "글의 둘째 문장 'grounded in physical embodiment and emotional salience'를 확인하세요.", en: "Look at the second sentence noting human comprehension is 'grounded in physical embodiment'." },
          { ko: "통계적 처리(statistical processing)와 체화된 경험(embodiment)의 대비입니다.", en: "Contrast statistical calculation with embodied subjective experience." }
        ],
        explanation: {
          ko: "인간의 이해는 신체적 체화와 주관적 감정 경험에 바탕을 두고 있으며, 통계적 언어 모델은 이를 복제할 수 없다는 내용입니다.",
          en: "Human cognition is grounded in embodied subjective experience, which cannot be reduced to statistical text prediction.",
          vi: "Nhận thức của con người bắt nguồn từ trải nghiệm thể xác và cảm xúc chủ quan, điều mà tính toán thống kê không thể sao chép."
        }
      }
    ]
  },
  {
    courseId: "en-el-sci",
    skillId: "en.el.sci2",
    skillTitle: { ko: "기후 회복력과 청정 기술", en: "Climate Resilience and Green Tech", vi: "Khả năng phục hồi khí hậu và Công nghệ xanh" },
    id: "en-el-sci2",
    title: { ko: "기후 회복력과 청정 기술", en: "Climate Resilience and Green Tech", vi: "Khả năng phục hồi khí hậu và Công nghệ xanh" },
    concept: {
      ko: "재생 에너지 전환과 생태계 보존의 상호작용 및 기후 위기 극복을 위한 시스템적 접근을 다룹니다.",
      en: "Analyze systemic transitions to renewable energy grids and ecosystem resilience in mitigating global climate risks.",
      vi: "Phân tích chuyển đổi sang năng lượng tái tạo và bảo tồn hệ sinh thái nhằm ứng phó biến đổi khí hậu."
    },
    passage: "Mitigating catastrophic climate risk requires more than incremental efficiency gains; it calls for a paradigm shift toward circular economic frameworks where materials are endlessly repurposed and energy grids decouple entirely from fossil fuels.",
    questions: [
      {
        id: "en-el-sci2-q1",
        type: "multiple_choice",
        prompt: { ko: "글쓴이가 주장하는 기후 위험 극복의 핵심 방안은?", en: "According to the author, what is essential to mitigate climate risk?", vi: "Theo tác giả, điều gì là cốt lõi để giảm thiểu rủi ro khí hậu?" },
        options: [
          { id: "a", text: "Adopting circular economic frameworks and clean energy grids" },
          { id: "b", text: "Relying on minor incremental improvements in existing machinery" },
          { id: "c", text: "Increasing reliance on fossil fuels during economic downturns" },
          { id: "d", text: "Halting all industrial production permanently" }
        ],
        answer: "a",
        hints: [
          { ko: "점진적 효율성 개선 이상의 것('paradigm shift')을 요구하고 있습니다.", en: "The author calls for a paradigm shift toward circular economic frameworks." },
          { ko: "순환 경제와 화석 연료 탈피가 핵심입니다.", en: "Key concepts: circular economy and complete decoupling from fossil fuels." }
        ],
        explanation: {
          ko: "기후 위기 완화를 위해서는 미세한 효율 개선을 넘어 순환 경제 체제로의 전환과 청정 에너지 전환이 필수적이라는 주장입니다.",
          en: "The author stresses the necessity of a paradigm shift toward circular economy and renewable energy decoupling.",
          vi: "Cần chuyển dịch sang mô hình kinh tế tuần hoàn và tách rời hoàn toàn khỏi nhiên liệu hóa thạch."
        }
      }
    ]
  },
  // 3. Economy
  {
    courseId: "en-el-eco",
    skillId: "en.el.eco1",
    skillTitle: { ko: "행동경제학과 의사결정", en: "Behavioral Economics and Choice", vi: "Kinh tế học hành vi và Quyết định" },
    id: "en-el-eco1",
    title: { ko: "행동경제학과 의사결정", en: "Behavioral Economics and Choice", vi: "Kinh tế học hành vi và Quyết định" },
    concept: {
      ko: "전통 경제학의 합리적 인간 가설을 넘어, 인지적 편향과 프레이밍 효과가 경제적 선택에 미치는 영향을 탐구합니다.",
      en: "Investigate cognitive biases, loss aversion, and choice architecture that challenge traditional assumptions of rational market actors.",
      vi: "Khám phá các thiên kiến nhận thức và tâm lý mất mát thách thức giả định về con người lý trí truyền thống."
    },
    passage: "Traditional neoclassical economic models presumed perfectly rational agents maximizing utility. However, empirical behavioral research demonstrates that humans exhibit profound loss aversion, weighing potential losses far more heavily than equivalent gains.",
    questions: [
      {
        id: "en-el-eco1-q1",
        type: "multiple_choice",
        prompt: { ko: "행동경제학 연구가 밝혀낸 인간 의사결정의 특징은?", en: "What characteristic of human choice does behavioral research highlight?", vi: "Nghiên cứu kinh tế học hành vi chỉ ra đặc điểm gì của quyết định con người?" },
        options: [
          { id: "a", text: "People fear potential losses more intensely than they value equal gains" },
          { id: "b", text: "Consumers consistently calculate mathematical utility flawlessly" },
          { id: "c", text: "Market actors are entirely immune to emotional framing" },
          { id: "d", text: "Losses and gains of the same amount produce identical satisfaction" }
        ],
        answer: "a",
        hints: [
          { ko: "'loss aversion'(손실 회피)의 정의에 주목하세요.", en: "Focus on the definition of 'loss aversion' in the final sentence." },
          { ko: "손실에 더 민감하게 반응한다는 내용입니다.", en: "Humans weigh losses much more heavily than equivalent gains." }
        ],
        explanation: {
          ko: "행동경제학은 사람들이 동일한 규모의 이익보다 손실에 대해 훨씬 더 큰 심리적 부담을 느끼는 '손실 회피(loss aversion)' 성향을 보여준다고 설명합니다.",
          en: "Behavioral economics shows that people suffer more psychological disutility from losses than pleasure from equal gains.",
          vi: "Kinh tế học hành vi chứng minh con người sợ mất mát hơn nhiều so với việc trân trọng lợi ích tương đương."
        }
      }
    ]
  },
  // 4. Academic Logic
  {
    courseId: "en-el-aca",
    skillId: "en.el.aca1",
    skillTitle: { ko: "논리적 전제와 빈칸 추론", en: "Logical Premises and Inference", vi: "Tiền đề logic và Suy luận" },
    id: "en-el-aca1",
    title: { ko: "논리적 전제와 빈칸 추론", en: "Logical Premises and Inference", vi: "Tiền đề logic và Suy luận" },
    concept: {
      ko: "학술 텍스트에서 명시되지 않은 암묵적 전제를 식별하고, 논리적 결론을 도출하는 고난도 빈칸 추론 기법을 익힙니다.",
      en: "Identify unstated assumptions in academic argumentation and infer logically necessary conclusions to fill conceptual gaps.",
      vi: "Xác định các giả định ngầm trong văn bản học thuật và suy luận kết luận logic cần thiết."
    },
    passage: "Scientific progress does not advance solely through the steady accumulation of verified facts; rather, as foundational paradigms encounter persistent anomalies, scientific communities must undergo revolutionary conceptual reorganizations that redefine fundamental questions.",
    questions: [
      {
        id: "en-el-aca1-q1",
        type: "multiple_choice",
        prompt: { ko: "글에서 강조하는 과학적 진보의 메커니즘은?", en: "According to the passage, how does scientific progress truly advance?", vi: "Theo đoạn văn, tiến bộ khoa học thực sự diễn ra như thế nào?" },
        options: [
          { id: "a", text: "Through conceptual revolutions triggered by unresolved anomalies" },
          { id: "b", text: "Strictly through uninterrupted linear accumulation of data" },
          { id: "c", text: "By permanently suppressing dissenting experimental findings" },
          { id: "d", text: "Through governmental decrees regulating laboratory practices" }
        ],
        answer: "a",
        hints: [
          { ko: "'not advance solely through steady accumulation' 뒤의 역접에 주목하세요.", en: "Notice the contrast: 'not solely through accumulation... rather, through revolutionary conceptual reorganizations'." },
          { ko: "지속적인 변칙성(anomalies)이 패러다임 혁명을 촉발합니다.", en: "Anomalies provoke revolutionary conceptual reorganizations." }
        ],
        explanation: {
          ko: "과학적 발전은 단순한 사실의 축적뿐만 아니라, 기존 패러다임이 설명하지 못하는 변칙성이 누적될 때 일어나는 개념적 혁명(conceptual revolution)을 통해 이루어진다는 내용입니다.",
          en: "The author explains that scientific progress unfolds through revolutionary paradigm shifts when persistent anomalies arise.",
          vi: "Tiến bộ khoa học diễn ra qua các cuộc cách mạng nhận thức mang tính đột phá khi các nghịch lý tích tụ."
        }
      }
    ]
  }
];

