import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = path.join(root, "lib/learn/content/reading");
const viDir = path.join(root, "lib/learn/content/vi");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(viDir, { recursive: true });

// 4 Advanced Reading Elective Courses (8 lessons, 56 questions)
const COURSES = [
  {
    id: "en-el-hum",
    title: "인문·사회 심화 독해",
    titleVi: "Đọc hiểu nâng cao · Nhân văn và Xã hội",
    grade: "H3",
    elective: true,
    world: {
      name: "인문의 숲 (Forest of Humanities)",
      nameVi: "Rừng nhân văn (Forest of Humanities)",
      emoji: "🏛️",
      tagline: "인간과 사회를 성찰하는 깊이 있는 원서 독해",
      taglineVi: "Đọc hiểu sâu sắc về văn hóa, bản sắc và xã hội",
    },
    units: [
      {
        id: "en-el-hum-u1",
        title: "인문·사회 심화 지문",
        titleVi: "Các đoạn văn Nhân văn và Xã hội",
        lessons: ["en-el-hum1", "en-el-hum2"]
      }
    ]
  },
  {
    id: "en-el-sci",
    title: "과학·기술 심화 독해",
    titleVi: "Đọc hiểu nâng cao · Khoa học và Công nghệ",
    grade: "H3",
    elective: true,
    world: {
      name: "탐구의 연구소 (Lab of Discovery)",
      nameVi: "Phòng thí nghiệm khám phá (Lab of Discovery)",
      emoji: "🔬",
      tagline: "인공지능, 기후 위기, 생명과학 최신 학술 독해",
      taglineVi: "Đọc hiểu học thuật về AI, biến đổi khí hậu và khoa học hiện đại",
    },
    units: [
      {
        id: "en-el-sci-u1",
        title: "과학·기술 심화 지문",
        titleVi: "Các đoạn văn Khoa học và Công nghệ",
        lessons: ["en-el-sci1", "en-el-sci2"]
      }
    ]
  },
  {
    id: "en-el-eco",
    title: "경제·경영 실전 독해",
    titleVi: "Đọc hiểu nâng cao · Kinh tế và Xu hướng Toàn cầu",
    grade: "H3",
    elective: true,
    world: {
      name: "글로벌 마켓 (Global Market)",
      nameVi: "Thị trường toàn cầu (Global Market)",
      emoji: "📈",
      tagline: "행동경제학과 글로벌 무역, 데이터 기반 실전 분석",
      taglineVi: "Xu hướng kinh tế, ra quyết định và thương mại số",
    },
    units: [
      {
        id: "en-el-eco-u1",
        title: "경제·경영 실전 지문",
        titleVi: "Các đoạn văn Kinh tế và Xu hướng Toàn cầu",
        lessons: ["en-el-eco1", "en-el-eco2"]
      }
    ]
  },
  {
    id: "en-el-aca",
    title: "학술 논리와 빈칸 추론",
    titleVi: "Đọc hiểu nâng cao · Logic học thuật và Suy luận",
    grade: "H3",
    elective: true,
    world: {
      name: "논리의 탑 (Tower of Logic)",
      nameVi: "Tòa tháp logic (Tower of Logic)",
      emoji: "🗼",
      tagline: "숨은 전제 찾기, 빈칸 추론, 두 지문의 논리적 통합",
      taglineVi: "Phân tích tiền đề, suy luận logic và tổng hợp lập luận",
    },
    units: [
      {
        id: "en-el-aca-u1",
        title: "논리 분석과 빈칸 추론",
        titleVi: "Các đoạn văn Logic và Suy luận",
        lessons: ["en-el-aca1", "en-el-aca2"]
      }
    ]
  }
];

function makePassageQuestions(prefix, passage, qList) {
  return qList.map((item, idx) => ({
    id: `${prefix}-q${idx + 1}`,
    q: item.q,
    qKo: item.qKo,
    qVi: item.qVi,
    opts: item.opts,
    a: "a",
    h1Ko: item.h1Ko,
    h1Vi: item.h1Vi,
    h2Ko: item.h2Ko,
    h2Vi: item.h2Vi,
    exKo: item.exKo,
    exVi: item.exVi,
  }));
}

const LESSON_DEFS = [
  // 1. Humanities
  {
    id: "en-el-hum1", courseId: "en-el-hum", skillId: "en.el.hum1",
    title: "문화적 정체성과 언어", titleVi: "Bản sắc văn hóa và Ngôn ngữ",
    concept: "언어는 단순한 정보 교환 이상의 공동체 기억과 가치관을 담고 있습니다.",
    conceptVi: "Ngôn ngữ không chỉ là công cụ giao tiếp mà còn phản ánh thế giới quan và bản sắc văn hóa.",
    passage: "Language is not merely a vehicle for exchanging factual information; it carries the collective memory and values of a community. When an endangered language disappears, humanity loses a unique lens through which the natural world was understood and classified.",
    items: [
      { q: "What is the main topic of the passage?", qKo: "글의 주제로 가장 적절한 것은?", qVi: "Chủ đề chính của đoạn văn là gì?", opts: ["Language as an embodiment of cultural memory", "Economic benefits of learning global languages", "Grammatical similarities across dialects", "How technology accelerates global media"], h1Ko: "언어가 담고 있는 집단적 기억에 주목하세요.", h1Vi: "Chú ý đến ký ức tập thể mà ngôn ngữ mang lại.", h2Ko: "소멸 언어의 손실이 뜻하는 바를 생각해보세요.", h2Vi: "Suy nghĩ về mất mát khi một ngôn ngữ biến mất.", exKo: "언어는 문화적 기억과 세상을 보는 고유한 렌즈를 담고 있다는 내용입니다.", exVi: "Đoạn văn nhấn mạnh ngôn ngữ chứa đựng ký ức văn hóa và thế giới quan độc đáo." },
      { q: "What does 'unique lens' refer to in the text?", qKo: "밑줄 친 'unique lens'가 의미하는 것은?", qVi: "Cụm từ 'unique lens' chỉ điều gì trong bài?", opts: ["A distinctive perspective for understanding reality", "An optical tool used by field researchers", "A modern software translation tool", "A universal standard for all languages"], h1Ko: "문맥상 자연 세계를 이해하는 방식을 뜻합니다.", h1Vi: "Trong ngữ cảnh có nghĩa là cách hiểu thế giới tự nhiên.", h2Ko: "현실을 바라보고 해석하는 고유한 시각입니다.", h2Vi: "Đó là góc nhìn độc đáo để diễn giải thực tại.", exKo: "세상을 이해하고 분류하는 언어 공동체 고유의 관점을 의미합니다.", exVi: "Chỉ góc nhìn riêng biệt của cộng đồng ngôn ngữ để hiểu thế giới." },
      { q: "What happens when an endangered language disappears?", qKo: "소멸 위기 언어가 사라지면 어떤 일이 일어나는가?", qVi: "Điều gì xảy ra khi một ngôn ngữ có nguy cơ biến mất?", opts: ["Humanity loses an irreplaceable worldview", "Global trade becomes significantly easier", "Grammar rules become simpler worldwide", "Scientific terminology becomes unified"], h1Ko: "마지막 문장의 결론 부분을 확인하세요.", h1Vi: "Kiểm tra phần kết luận ở câu cuối cùng.", h2Ko: "인류가 잃게 되는 고유한 가치에 집중하세요.", h2Vi: "Tập trung vào giá trị độc đáo mà nhân loại mất đi.", exKo: "인류는 세상을 해석하는 독특하고 대체 불가능한 렌즈를 잃게 됩니다.", exVi: "Nhân loại mất đi một thế giới quan độc đáo không thể thay thế." },
      { q: "Which statement is supported by the text?", qKo: "글의 내용과 부합하는 진술은?", qVi: "Nhận định nào được văn bản ủng hộ?", opts: ["Languages carry collective cultural values", "Languages are only tools for factual trade", "Endangered languages have no cultural value", "Modern dialects have completely replaced old languages"], h1Ko: "첫 번째 문장의 핵심 논지를 확인하세요.", h1Vi: "Kiểm tra luận điểm chính ở câu đầu tiên.", h2Ko: "단순한 정보 전달 수단 이상이라는 점을 확인하세요.", h2Vi: "Xác nhận rằng nó không chỉ là phương tiện truyền đạt thông tin.", exKo: "언어는 단순한 정보 교환 도구가 아니라 집단적 가치를 담고 있습니다.", exVi: "Ngôn ngữ chứa đựng các giá trị tập thể chứ không chỉ là công cụ trao đổi thông tin." },
      { q: "The word 'merely' is closest in meaning to:", qKo: "단어 'merely'와 가장 가까운 의미는?", qVi: "Từ 'merely' gần nghĩa nhất với từ nào?", opts: ["simply", "frequently", "accurately", "deeply"], h1Ko: "'not merely'는 '단지 ~에 그치지 않고'라는 뜻입니다.", h1Vi: "'not merely' có nghĩa là 'không chỉ đơn thuần là'.", h2Ko: "simply와 동의어입니다.", h2Vi: "Đồng nghĩa với simply.", exKo: "merely는 '단지, 그저'라는 뜻으로 simply와 같습니다.", exVi: "merely có nghĩa là đơn thuần, đồng nghĩa với simply." },
      { q: "What role does collective memory play in language?", qKo: "언어 속에서 집단적 기억은 어떤 역할을 하는가?", qVi: "Ký ức tập thể đóng vai trò gì trong ngôn ngữ?", opts: ["It preserves communal history and identity", "It creates strict mathematical formulas", "It removes differences between nations", "It replaces technical terminology"], h1Ko: "공동체의 기억과 가치를 보존한다는 점을 확인하세요.", h1Vi: "Xác nhận việc bảo tồn ký ức và giá trị của cộng đồng.", h2Ko: "문화적 정체성 보존과 연결됩니다.", h2Vi: "Liên kết với việc bảo tồn bản sắc văn hóa.", exKo: "공동체의 역사적 기억과 정체성을 보존하는 핵심 역할을 합니다.", exVi: "Đóng vai trò cốt lõi trong việc bảo tồn ký ức lịch sử và bản sắc của cộng đồng." },
      { q: "The author's tone toward endangered languages is:", qKo: "소멸 위기 언어에 대한 글쓴이의 어조는?", qVi: "Thái độ của tác giả đối với các ngôn ngữ có nguy cơ biến mất là gì?", opts: ["appreciative and concerned", "indifferent and neutral", "scornful and critical", "optimistic and dismissive"], h1Ko: "언어 소멸을 인류의 큰 손실로 바라보고 있습니다.", h1Vi: "Tác giả coi sự biến mất của ngôn ngữ là mất mát lớn của nhân loại.", h2Ko: "가치를 인정하면서도 우려하는 어조입니다.", h2Vi: "Thái độ trân trọng nhưng cũng đầy lo lắng.", exKo: "언어의 고유한 가치를 깊이 인정하며 소멸을 우려하는 어조입니다.", exVi: "Tác giả đánh giá cao giá trị của ngôn ngữ và lo ngại về sự biến mất của chúng." }
    ]
  },
  {
    id: "en-el-hum2", courseId: "en-el-hum", skillId: "en.el.hum2",
    title: "현대 사회의 윤리와 선택", titleVi: "Đạo đức trong Thế giới Hiện đại",
    concept: "디지털 네트워크 사회에서 개인의 선택이 전체 사회 구조에 미치는 윤리적 파급 효과를 분석합니다.",
    conceptVi: "Phân tích tác động lan tỏa về mặt đạo đức của các lựa chọn cá nhân trong xã hội kết nối số.",
    passage: "Moral decisions in interconnected societies rarely affect only the decision-maker. As digital networks amplify individual actions, personal choices regarding data sharing and public discourse inevitably ripple across the entire social fabric, demanding a renewed sense of civic responsibility.",
    items: [
      { q: "Which statement best captures the main argument?", qKo: "글의 중심 주장으로 가장 적절한 것은?", qVi: "Câu nào thể hiện rõ nhất lập luận chính?", opts: ["Digital networks require greater civic responsibility for personal actions", "Data sharing should be completely unregulated by institutions", "Public discourse has become completely impossible online", "Individual moral choices have no measurable societal impact"], h1Ko: "개인의 선택이 사회 전체로 파급된다는 점을 파악하세요.", h1Vi: "Nhận biết rằng lựa chọn cá nhân lan tỏa tới toàn xã hội.", h2Ko: "마지막 구절의 시민적 책임 의식을 확인하세요.", h2Vi: "Kiểm tra ý thức trách nhiệm công dân ở câu cuối.", exKo: "디지털 네트워크의 증폭 효과로 인해 더 높은 시민적 책임 의식이 요구된다는 주장입니다.", exVi: "Lập luận rằng mạng số khuếch đại hành động đòi hỏi trách nhiệm công dân cao hơn." },
      { q: "The word 'amplify' in the text most nearly means:", qKo: "본문의 'amplify'와 가장 가까운 의미는?", qVi: "Từ 'amplify' trong bài gần nghĩa nhất với từ nào?", opts: ["magnify", "suppress", "organize", "confuse"], h1Ko: "개인의 행동 파급력을 '더 크게 만든다'는 뜻입니다.", h1Vi: "Có nghĩa là 'làm cho tác động lớn hơn'.", h2Ko: "magnify(확대하다)와 같습니다.", h2Vi: "Đồng nghĩa với magnify.", exKo: "amplify는 신호나 영향을 '확대하다, 증폭시키다'는 뜻입니다.", exVi: "amplify nghĩa là khuếch đại, phóng đại, đồng nghĩa với magnify." },
      { q: "Why do personal choices matter more in interconnected societies?", qKo: "연결된 사회에서 개인의 선택이 더 중요한 이유는?", qVi: "Tại sao lựa chọn cá nhân quan trọng hơn trong xã hội kết nối?", opts: ["Because their consequences spread rapidly through digital networks", "Because governments no longer enforce any civic regulations", "Because individuals now live in total physical isolation", "Because moral values are completely agreed upon worldwide"], h1Ko: "디지털 네트워크가 개인의 행동을 증폭시킨다는 점에 주목하세요.", h1Vi: "Chú ý rằng mạng số khuếch đại hành vi cá nhân.", h2Ko: "파급 효과(ripple effect)가 발생합니다.", h2Vi: "Hiệu ứng lan tỏa (ripple effect) diễn ra.", exKo: "네트워크가 개인의 결정을 사회 전체로 빠르게 확산시키기 때문입니다.", exVi: "Bởi vì mạng lưới lan truyền hậu quả của quyết định cá nhân rất nhanh." },
      { q: "The phrase 'social fabric' metaphorically refers to:", qKo: "'social fabric'이 비유적으로 가리키는 바는?", qVi: "Cụm từ 'social fabric' chỉ điều gì một cách ẩn dụ?", opts: ["The complex structure of human relationships in society", "Textile factories producing clothing for citizens", "Physical internet cables connecting computers", "Written legal constitutions of nation states"], h1Ko: "사회 구성원 간의 유기적 관계망을 뜻합니다.", h1Vi: "Chỉ mạng lưới quan hệ hữu cơ giữa các thành viên xã hội.", h2Ko: "사회의 '구조와 결합'을 비유합니다.", h2Vi: "Ẩn dụ cho cấu trúc và sự gắn kết của xã hội.", exKo: "사회적 관계와 신뢰로 이루어진 사회의 구조적 결합을 의미합니다.", exVi: "Chỉ cấu trúc phức tạp của các mối quan hệ và sự gắn kết trong xã hội." },
      { q: "What is demanded of individuals in modern digital spaces?", qKo: "현대 디지털 공간에서 개인에게 요구되는 것은?", qVi: "Điều gì được yêu cầu ở các cá nhân trong không gian số hiện đại?", opts: ["A renewed sense of civic responsibility", "Total withdrawal from public conversations", "Sharing all personal private files publicly", "Ignoring the consequences of online speech"], h1Ko: "마지막 문장의 결론적 요구 사항을 확인하세요.", h1Vi: "Kiểm tra yêu cầu kết luận ở câu cuối cùng.", h2Ko: "시민적 책임감(civic responsibility)입니다.", h2Vi: "Đó là trách nhiệm công dân (civic responsibility).", exKo: "새로운 차원의 시민적 책임 의식이 요구됩니다.", exVi: "Đòi hỏi một ý thức trách nhiệm công dân được đổi mới." },
      { q: "Which domain is explicitly mentioned as involving moral choices?", qKo: "도덕적 선택과 관련하여 본문에 명시된 영역은?", qVi: "Lĩnh vực nào được đề cập rõ ràng liên quan đến lựa chọn đạo đức?", opts: ["Data sharing and public discourse", "Space exploration and rocket design", "Maritime navigation and fishing", "Agricultural harvesting techniques"], h1Ko: "'personal choices regarding...' 뒤의 내용을 확인하세요.", h1Vi: "Kiểm tra phần thông tin sau 'personal choices regarding...'.", h2Ko: "데이터 공유와 공적 담론입니다.", h2Vi: "Đó là chia sẻ dữ liệu và thảo luận công cộng.", exKo: "데이터 공유와 공공 담론 참여 영역이 명시되어 있습니다.", exVi: "Được nêu rõ là chia sẻ dữ liệu và thảo luận công cộng." },
      { q: "What assumption does the author reject?", qKo: "글쓴이가 배격하는 가설은 무엇인가?", qVi: "Tác giả bác bỏ giả định nào?", opts: ["That moral decisions affect only the person making them", "That digital networks influence communication", "That civic responsibility is beneficial for society", "That human beings live in organized communities"], h1Ko: "첫 번째 문장 'rarely affect only the decision-maker'를 확인하세요.", h1Vi: "Kiểm tra câu đầu tiên 'rarely affect only the decision-maker'.", h2Ko: "자신에게만 영향을 미친다는 통념을 반박합니다.", h2Vi: "Bác bỏ quan niệm rằng quyết định chỉ ảnh hưởng tới người đưa ra nó.", exKo: "도덕적 결정이 결정자 본인에게만 영향을 미친다는 생각을 배격합니다.", exVi: "Bác bỏ giả định rằng quyết định đạo đức chỉ ảnh hưởng đến người đưa ra quyết định." }
    ]
  },
  // 2. Science
  {
    id: "en-el-sci1", courseId: "en-el-sci", skillId: "en.el.sci1",
    title: "인공지능과 인간의 마음", titleVi: "Trí tuệ nhân tạo và Tâm trí Con người",
    concept: "통계적 텍스트 예측과 인간 고유의 신체적 체화 및 주관적 의식 경험의 차이를 고찰합니다.",
    conceptVi: "Phân tích sự khác biệt giữa dự đoán văn bản thống kê và trải nghiệm thể xác, ý thức chủ quan của con người.",
    passage: "While generative models excel at predicting plausible token sequences based on vast corpora, they do not possess subjective experience or intentionality. Human comprehension is grounded in physical embodiment and emotional salience, aspects that purely statistical text processing cannot replicate.",
    items: [
      { q: "What fundamental limitation of generative models is stated?", qKo: "생성 모델의 근본적 한계로 언급된 것은?", qVi: "Hạn chế cơ bản nào của mô hình tạo sinh được nêu ra?", opts: ["Lack of subjective experience and true intentionality", "Inability to predict grammatical word sequences", "Insufficient access to digital training corpora", "Excessive emotional sensitivity in text output"], h1Ko: "첫 문장의 'do not possess subjective experience'를 확인하세요.", h1Vi: "Xem cụm 'do not possess subjective experience' ở câu đầu.", h2Ko: "주관적 경험과 지향성의 결여입니다.", h2Vi: "Thiếu trải nghiệm chủ quan và tính chủ đích.", exKo: "기계 모델은 방대한 데이터 처리에도 불구하고 주관적 의식과 지향성을 결여하고 있습니다.", exVi: "Mô hình thiếu trải nghiệm chủ quan và tính chủ đích dù xử lý dữ liệu lớn." },
      { q: "According to the author, human understanding depends heavily upon:", qKo: "저자에 따르면 인간의 이해는 무엇에 크게 의존하는가?", qVi: "Theo tác giả, sự hiểu biết của con người phụ thuộc vào điều gì?", opts: ["Physical embodiment and emotional salience", "Exclusively memorized statistical tables", "Calculating probability curves without feelings", "Reading text without physical senses"], h1Ko: "둘째 문장 'grounded in physical embodiment'를 찾으세요.", h1Vi: "Tìm cụm 'grounded in physical embodiment' ở câu thứ hai.", h2Ko: "신체적 체화와 감정적 중요성입니다.", h2Vi: "Thể xác vật lý và tính nổi bật của cảm xúc.", exKo: "인간의 인지는 신체적 체화 경험과 정서적 중요도 평가에 기반합니다.", exVi: "Nhận thức con người bắt nguồn từ sự hiện diện thể xác và cảm xúc." },
      { q: "The word 'replicate' in the passage is closest in meaning to:", qKo: "본문의 'replicate'와 가장 가까운 단어는?", qVi: "Từ 'replicate' trong đoạn văn gần nghĩa nhất với từ nào?", opts: ["reproduce", "eliminate", "calculate", "simplify"], h1Ko: "재현하다, 복제하다의 의미입니다.", h1Vi: "Có nghĩa là tái tạo, sao chép.", h2Ko: "reproduce와 동의어입니다.", h2Vi: "Đồng nghĩa với reproduce.", exKo: "replicate는 '복제하다, 그대로 재현하다'는 뜻으로 reproduce와 같습니다.", exVi: "replicate nghĩa là tái hiện, sao chép, tương đương với reproduce." },
      { q: "What is generative AI particularly skilled at doing?", qKo: "생성형 AI가 특히 잘하는 작업은 무엇인가?", qVi: "AI tạo sinh đặc biệt giỏi làm điều gì?", opts: ["Predicting plausible token sequences from corpora", "Feeling genuine empathy for human suffering", "Experiencing bodily biological exhaustion", "Generating independent self-aware consciousness"], h1Ko: "첫 구절 'excel at predicting plausible token sequences'를 확인하세요.", h1Vi: "Kiểm tra cụm 'excel at predicting plausible token sequences'.", h2Ko: "언어 데이터 기반의 그럴듯한 토큰 예측입니다.", h2Vi: "Dự đoán các chuỗi token hợp lý dựa trên ngữ liệu.", exKo: "말뭉치 데이터에 기반하여 통계적으로 그럴듯한 단어 연쇄를 예측하는 능력이 뛰어납니다.", exVi: "Rất xuất sắc trong việc dự đoán các chuỗi token hợp lý từ kho dữ liệu." },
      { q: "How is purely statistical text processing characterized?", qKo: "순수 통계적 텍스트 처리는 어떻게 특징지어지는가?", qVi: "Xử lý văn bản thuần túy thống kê được mô tả như thế nào?", opts: ["As incapable of replicating embodied comprehension", "As fully equivalent to human spiritual awareness", "As superior to human bodily intuition in every domain", "As possessing genuine biological desires"], h1Ko: "마지막 구절 'cannot replicate'를 확인하세요.", h1Vi: "Kiểm tra cụm từ cuối 'cannot replicate'.", h2Ko: "체화된 인간 이해를 모방할 수 없습니다.", h2Vi: "Không thể tái tạo sự hiểu biết gắn liền với thể xác.", exKo: "체화된 인간 고유의 감정적, 신체적 이해를 복제할 수 없는 처리 방식으로 규정됩니다.", exVi: "Được mô tả là không thể sao chép sự thấu hiểu thể xác của con người." },
      { q: "The word 'salience' refers to the quality of being:", qKo: "'salience'가 가리키는 특성은?", qVi: "Từ 'salience' đề cập đến phẩm chất gì?", opts: ["noticeable and important", "invisible and hidden", "mathematically identical", "purely accidental"], h1Ko: "두드러짐, 중요성의 의미입니다.", h1Vi: "Có nghĩa là nổi bật, quan trọng.", h2Ko: "중요하고 눈에 띔을 의미합니다.", h2Vi: "Chỉ tính chất đáng chú ý và quan trọng.", exKo: "salience는 어떤 자극이나 감정이 '두드러지고 중요한 상태'를 뜻합니다.", exVi: "salience chỉ tính chất nổi bật, đáng chú ý và có ý nghĩa quan trọng." },
      { q: "What is the primary conclusion of the passage?", qKo: "글의 핵심 결론은 무엇인가?", qVi: "Kết luận chính của đoạn văn là gì?", opts: ["AI text generation differs fundamentally from human understanding", "AI will completely replace all human thought within a decade", "Human brains operate purely as statistical calculators", "Language learning is no longer useful for human beings"], h1Ko: "인간의 이해와 기계 연산의 본질적 차이를 결론짓고 있습니다.", h1Vi: "Đưa ra kết luận về sự khác biệt cốt lõi giữa hiểu biết của con người và máy tính.", h2Ko: "인간 고유의 주관적 의식과 체화의 가치를 강조합니다.", h2Vi: "Nhấn mạnh giá trị của ý thức chủ quan và thể xác con người.", exKo: "생성 AI의 통계적 예측은 인간의 체화된 주관적 이해와 본질적으로 다르다는 결론입니다.", exVi: "Dự đoán thống kê của AI khác biệt về chất so với sự thấu hiểu gắn với thể xác của con người." }
    ]
  },
  {
    id: "en-el-sci2", courseId: "en-el-sci", skillId: "en.el.sci2",
    title: "기후 회복력과 청정 기술", titleVi: "Khả năng phục hồi khí hậu và Công nghệ xanh",
    concept: "단순한 미세 효율 개선을 넘어 순환 경제와 에너지 전환을 통한 패러다임 전환의 필요성을 탐구합니다.",
    conceptVi: "Khám phá sự cần thiết của việc chuyển đổi mô hình thông qua kinh tế tuần hoàn và năng lượng sạch.",
    passage: "Mitigating catastrophic climate risk requires more than incremental efficiency gains; it calls for a paradigm shift toward circular economic frameworks where materials are endlessly repurposed and energy grids decouple entirely from fossil fuels.",
    items: [
      { q: "What is required to mitigate climate disaster?", qKo: "기후 재앙을 막기 위해 필수적으로 요구되는 것은?", qVi: "Cần phải làm gì để giảm thiểu thảm họa khí hậu?", opts: ["A paradigm shift toward circular economies and clean energy", "Small minor adjustments to current coal power plants", "Increasing material waste to promote rapid consumer spending", "Ignoring renewable grid development entirely"], h1Ko: "'paradigm shift' 뒤에 나오는 핵심 대안을 확인하세요.", h1Vi: "Kiểm tra giải pháp then chốt sau cụm 'paradigm shift'.", h2Ko: "순환 경제와 화석 연료 탈피입니다.", h2Vi: "Kinh tế tuần hoàn và tách rời nhiên liệu hóa thạch.", exKo: "점진적 개선을 넘어 순환 경제 체제와 청정 에너지로의 패러다임 전환이 필요합니다.", exVi: "Cần chuyển dịch sang mô hình kinh tế tuần hoàn và năng lượng sạch toàn diện." },
      { q: "The term 'incremental' in the text implies changes that are:", qKo: "본문의 'incremental'이 뜻하는 변화의 성격은?", qVi: "Từ 'incremental' trong bài ám chỉ những thay đổi thế nào?", opts: ["gradual and small in scale", "violent and revolutionary", "instantaneous and destructive", "completely unintended"], h1Ko: "점진적이고 소규모인 변화를 의미합니다.", h1Vi: "Có nghĩa là thay đổi dần dần từng bước nhỏ.", h2Ko: "큰 변화(paradigm shift)와 대조되는 개념입니다.", h2Vi: "Đối lập với sự thay đổi lớn (paradigm shift).", exKo: "incremental은 '점진적인, 미미한 증가의'라는 의미로 근본적 전환과 대조됩니다.", exVi: "incremental nghĩa là tăng dần từng bước nhỏ, tương phản với chuyển biến cách mạng." },
      { q: "In a circular economic framework, materials are:", qKo: "순환 경제 체제에서 원자재는 어떻게 다루어지는가?", qVi: "Trong khuôn khổ kinh tế tuần hoàn, nguyên vật liệu được xử lý ra sao?", opts: ["Endlessly repurposed across production cycles", "Buried in landfills immediately after single use", "Shipped abroad without any recycling attempts", "Replaced entirely by non-recyclable plastics"], h1Ko: "'where materials are endlessly repurposed' 구절을 확인하세요.", h1Vi: "Xem cụm 'where materials are endlessly repurposed'.", h2Ko: "끝없이 재사용되고 전환됩니다.", h2Vi: "Được tái sử dụng liên tục trong chu trình.", exKo: "순환 경제에서는 자원이 버려지지 않고 생산 주기 내에서 끝없이 재활용됩니다.", exVi: "Trong kinh tế tuần hoàn, vật liệu được tái sử dụng liên tục không ngừng." },
      { q: "What must energy grids decouple from?", qKo: "에너지 그리드는 무엇으로부터 완전히 분리되어야 하는가?", qVi: "Mạng lưới năng lượng phải tách rời hoàn toàn khỏi cái gì?", opts: ["Fossil fuels", "Renewable solar installations", "Modern electrical storage systems", "International environmental agreements"], h1Ko: "마지막 구절 'decouple entirely from fossil fuels'를 확인하세요.", h1Vi: "Kiểm tra cụm 'decouple entirely from fossil fuels'.", h2Ko: "화석 연료입니다.", h2Vi: "Đó là nhiên liệu hóa thạch.", exKo: "에너지 공급망은 석탄, 석유 등 화석 연료에 대한 의존에서 완전히 벗어나야 합니다.", exVi: "Mạng lưới năng lượng phải tách rời hoàn toàn khỏi sự phụ thuộc vào nhiên liệu hóa thạch." },
      { q: "What does the author contrast with a 'paradigm shift'?", qKo: "글쓴이가 '패러다임 전환'과 대비시키고 있는 것은?", qVi: "Tác giả đối lập 'paradigm shift' với điều gì?", opts: ["Incremental efficiency gains", "Catastrophic environmental risks", "Endless repurposing of materials", "Clean renewable energy sources"], h1Ko: "첫 구절 'more than incremental efficiency gains'를 확인하세요.", h1Vi: "Kiểm tra cụm từ 'more than incremental efficiency gains'.", h2Ko: "기존 방식 내에서의 미세한 점진적 효율 향상입니다.", h2Vi: "Mức tăng hiệu quả dần dần từng bước nhỏ.", exKo: "현 체제 내에서의 단순한 점진적 효율성 개선과 근본적인 패러다임 전환을 대비하고 있습니다.", exVi: "Đối lập giữa việc tăng hiệu quả từng bước nhỏ với sự chuyển dịch mô hình căn bản." },
      { q: "The word 'decouple' most closely means to:", qKo: "단어 'decouple'과 가장 가까운 의미는?", qVi: "Từ 'decouple' gần nghĩa nhất với từ nào?", opts: ["separate", "strengthen", "connect", "accelerate"], h1Ko: "분리하다, 연결을 끊다의 뜻입니다.", h1Vi: "Có nghĩa là tách rời, ngắt kết nối.", h2Ko: "separate와 동의어입니다.", h2Vi: "Đồng nghĩa với separate.", exKo: "decouple은 두 요소 사이의 연계를 '분리하다'는 뜻으로 separate와 같습니다.", exVi: "decouple có nghĩa là tách rời, tách biệt, đồng nghĩa với separate." },
      { q: "Which title best suits this passage?", qKo: "이 글의 제목으로 가장 적합한 것은?", qVi: "Tiêu đề nào phù hợp nhất cho đoạn văn này?", opts: ["Beyond Incrementalism: The Need for Circular Systems", "The Impossibility of Clean Energy Grids", "Why Fossil Fuels Are Permanently Essential", "A History of Traditional Waste Management"], h1Ko: "점진주의를 넘어선 순환 경제 시스템의 필요성을 포괄하는 제목을 찾으세요.", h1Vi: "Tìm tiêu đề bao quát sự cần thiết của hệ thống tuần hoàn vượt lên cải tiến nhỏ.", h2Ko: "근본적 전환에 대한 이야기입니다.", h2Vi: "Bài viết nói về sự chuyển biến mang tính nền tảng.", exKo: "단순한 점진주의를 넘어 순환 체제로의 패러다임 전환을 촉구하는 글입니다.", exVi: "Tiêu đề phù hợp nhất là vượt qua cải tiến nhỏ để hướng tới hệ thống kinh tế tuần hoàn." }
    ]
  },
  // 3. Economy
  {
    id: "en-el-eco1", courseId: "en-el-eco", skillId: "en.el.eco1",
    title: "행동경제학과 의사결정", titleVi: "Kinh tế học hành vi và Quyết định",
    concept: "인간의 비합리적 선택, 손실 회피 성향과 의사결정 프레이밍을 학술적으로 분석합니다.",
    conceptVi: "Phân tích các quyết định phi lý trí, tâm lý sợ mất mát và đóng khung nhận thức của con người.",
    passage: "Traditional neoclassical economic models presumed perfectly rational agents maximizing utility. However, empirical behavioral research demonstrates that humans exhibit profound loss aversion, weighing potential losses far more heavily than equivalent gains.",
    items: [
      { q: "What did traditional neoclassical economic models assume?", qKo: "전통 신고전파 경제학 모델이 가정한 바는?", qVi: "Mô hình kinh tế tân cổ điển truyền thống đã giả định điều gì?", opts: ["Actors are perfectly rational and maximize utility", "Humans always prefer emotional satisfaction to profit", "Market participants intentionally pursue financial loss", "Price signals have zero impact on purchasing choices"], h1Ko: "첫 문장의 'perfectly rational agents'를 확인하세요.", h1Vi: "Kiểm tra cụm từ 'perfectly rational agents' ở câu đầu.", h2Ko: "완벽하게 합리적인 행위자라는 가정입니다.", h2Vi: "Giả định về những cá nhân hoàn toàn lý trí.", exKo: "전통 경제학은 시장 참여자가 효용을 극대화하는 완벽히 합리적 행위자라고 전제했습니다.", exVi: "Kinh tế học truyền thống giả định con người hoàn toàn lý trí và tối đa hóa lợi ích." },
      { q: "What is 'loss aversion' according to the passage?", qKo: "본문에 나타난 '손실 회피(loss aversion)'의 의미는?", qVi: "Theo đoạn văn, 'loss aversion' có nghĩa là gì?", opts: ["Weighing losses much more heavily than equal gains", "Avoiding all financial investments permanently", "Seeking out high-risk wagers for entertainment", "Preferring uncertain outcomes over guaranteed benefits"], h1Ko: "마지막 구절 'weighing potential losses far more heavily'를 보세요.", h1Vi: "Xem cụm 'weighing potential losses far more heavily'.", h2Ko: "동일한 이익보다 손실에 더 큰 무게를 두는 성향입니다.", h2Vi: "Tâm lý đánh giá mất mát nặng nề hơn lợi ích tương đương.", exKo: "손실에 대한 심리적 거부감이 동일 규모의 이익에 대한 만족보다 훨씬 크다는 뜻입니다.", exVi: "Tâm lý con người coi trọng và sợ mất mát hơn nhiều so với việc nhận được lợi ích bằng nhau." },
      { q: "The word 'empirical' is closest in meaning to:", qKo: "'empirical'과 가장 가까운 의미의 단어는?", qVi: "Từ 'empirical' gần nghĩa nhất với từ nào?", opts: ["observational and evidence-based", "purely theoretical and unproven", "fictional and imaginary", "traditional and customary"], h1Ko: "실증적인, 관찰에 기반한이라는 뜻입니다.", h1Vi: "Có nghĩa là dựa trên quan sát thực tế và bằng chứng.", h2Ko: "evidence-based(증거 기반)와 같습니다.", h2Vi: "Đồng nghĩa với bằng chứng thực nghiệm.", exKo: "empirical은 '실제 관찰과 증거에 기반한'이라는 의미입니다.", exVi: "empirical có nghĩa là thực nghiệm, dựa trên bằng chứng quan sát thực tế." },
      { q: "How do humans treat equivalent gains and losses?", qKo: "인간은 동일한 규모의 이익과 손실을 어떻게 대하는가?", qVi: "Con người đối xử với lợi ích và mất mát tương đương như thế nào?", opts: ["They feel the pain of loss more acutely than the joy of gain", "They treat both outcomes as completely identical in value", "They prioritize gains and ignore any possibility of loss", "They systematically double the value of positive gains"], h1Ko: "손실의 고통이 이익의 기쁨보다 크다는 점을 확인하세요.", h1Vi: "Xác nhận rằng nỗi đau mất mát lớn hơn niềm vui nhận được.", h2Ko: "비대칭적인 가치 평가입니다.", h2Vi: "Đánh giá giá trị mang tính bất đối xứng.", exKo: "동일한 금액이라도 얻었을 때의 기쁨보다 잃었을 때의 고통을 훨씬 강하게 느낍니다.", exVi: "Con người cảm nhận nỗi đau của mất mát sâu sắc hơn niềm vui khi nhận được lợi ích tương đương." },
      { q: "Behavioral economics challenges neoclassical theory by using:", qKo: "행동경제학이 신고전파 이론에 도전하기 위해 사용한 근거는?", qVi: "Kinh tế học hành vi thách thức lý thuyết tân cổ điển bằng cách sử dụng:", opts: ["Empirical research on human behavior", "Unsubstantiated philosophical musings", "Hypothetical models without real testing", "Ancient religious legal documents"], h1Ko: "'empirical behavioral research'를 확인하세요.", h1Vi: "Kiểm tra cụm từ 'empirical behavioral research'.", h2Ko: "실증적인 인간 행동 연구입니다.", h2Vi: "Nghiên cứu hành vi dựa trên thực nghiệm.", exKo: "실제 인간 행동을 관찰하고 실험한 실증적 연구 결과를 토대로 도전합니다.", exVi: "Thách thức bằng các nghiên cứu thực nghiệm về hành vi con người trong thực tế." },
      { q: "The author implies that traditional economic predictions are:", qKo: "저자가 암시하는 전통 경제학 예측의 문제점은?", qVi: "Tác giả ngụ ý điều gì về các dự đoán kinh tế truyền thống?", opts: ["Often flawed due to unrealistic psychological assumptions", "Consistently accurate in every financial crisis", "Based on deep biological understanding of emotions", "Immune to any academic criticism or review"], h1Ko: "인간을 비현실적인 합리적 행위자로 보았다는 점을 지적합니다.", h1Vi: "Chỉ ra rằng việc coi con người hoàn toàn lý trí là phi thực tế.", h2Ko: "심리적 결함을 간과했다는 점입니다.", h2Vi: "Bỏ qua các yếu tố tâm lý thực tế.", exKo: "비현실적인 합리성 가정으로 인해 실제 인간 행동을 정확히 예측하지 못한다는 점을 암시합니다.", exVi: "Ngụ ý rằng các dự đoán truyền thống có thể sai lầm do các giả định tâm lý thiếu thực tế." },
      { q: "What does 'maximizing utility' mean in classical theory?", qKo: "고전 이론에서 '효용 극대화'가 의미하는 것은?", qVi: "'Tối đa hóa lợi ích' trong lý thuyết cổ điển có nghĩa là gì?", opts: ["Making choices that yield the greatest personal benefit", "Giving away all personal wealth to charitable funds", "Sacrificing profits for emotional connections", "Minimizing any contact with commercial markets"], h1Ko: "자신에게 돌아오는 이익과 만족을 최대화하는 선택입니다.", h1Vi: "Đưa ra các lựa chọn mang lại lợi ích cá nhân cao nhất.", h2Ko: "개인적 이익의 극대화를 의미합니다.", h2Vi: "Tối đa hóa lợi ích cá nhân.", exKo: "자신에게 가장 큰 이익이나 만족을 가져다주는 결정을 내리는 것을 뜻합니다.", exVi: "Đưa ra những lựa chọn mang lại lợi ích và thỏa mãn cá nhân lớn nhất." }
    ]
  },
  {
    id: "en-el-eco2", courseId: "en-el-eco", skillId: "en.el.eco2",
    title: "세계화와 디지털 무역", titleVi: "Toàn cầu hóa và Thương mại số",
    concept: "디지털 경제의 국경 없는 데이터 흐름과 글로벌 공급망의 구조적 변화를 분석합니다.",
    conceptVi: "Phân tích dòng chảy dữ liệu xuyên biên giới và sự tái cấu trúc chuỗi cung ứng toàn cầu.",
    passage: "Modern globalization extends far beyond the physical transit of manufactured goods. Digital platforms have decoupled value creation from geographic proximity, allowing micro-enterprises to access worldwide capital markets while simultaneously introducing unprecedented regulatory challenges.",
    items: [
      { q: "What distinguishes modern globalization from its earlier forms?", qKo: "현대 세계화가 이전 형태와 구별되는 특징은?", qVi: "Điều gì phân biệt toàn cầu hóa hiện đại với các hình thức trước đó?", opts: ["Value creation decoupled from physical proximity via digital platforms", "A complete cessation of all international goods transport", "Total reliance on local barter currencies", "The return to closed national trade barriers"], h1Ko: "디지털 플랫폼이 지리적 근접성에서 가치 창출을 분리했다는 점을 확인하세요.", h1Vi: "Nhận biết rằng nền tảng số đã tách rời việc tạo ra giá trị khỏi khoảng cách địa lý.", h2Ko: "국경 없는 데이터 흐름과 가치 창출입니다.", h2Vi: "Dòng chảy dữ liệu xuyên biên giới và tạo ra giá trị.", exKo: "현대 세계화는 물리적 상품 이동을 넘어 디지털 플랫폼을 통한 가치 창출과 글로벌 시장 접근이 핵심입니다.", exVi: "Toàn cầu hóa hiện đại vượt qua thương mại hàng hóa vật lý để tạo giá trị qua nền tảng số." },
      { q: "What opportunity do digital platforms create for micro-enterprises?", qKo: "디지털 플랫폼이 소규모 기업(micro-enterprises)에 제공하는 기회는?", qVi: "Nền tảng số mang lại cơ hội gì cho các doanh nghiệp siêu nhỏ?", opts: ["Direct access to worldwide capital and customer markets", "Guaranteed immunity from commercial competition", "Complete isolation from international currency fluctuations", "Forced merger with state-owned conglomerates"], h1Ko: "'allowing micro-enterprises to access worldwide capital markets'를 보세요.", h1Vi: "Xem cụm 'allowing micro-enterprises to access worldwide capital markets'.", h2Ko: "글로벌 자본 및 고객 시장에 대한 접근성입니다.", h2Vi: "Khả năng tiếp cận thị trường vốn và khách hàng toàn cầu.", exKo: "소규모 기업도 전 세계 자본 시장과 고객층에 직접 접근할 수 있는 기회를 제공합니다.", exVi: "Tạo cơ hội cho doanh nghiệp siêu nhỏ tiếp cận trực tiếp thị trường vốn toàn cầu." },
      { q: "The word 'proximity' in the passage refers to:", qKo: "본문의 'proximity'가 의미하는 바는?", qVi: "Từ 'proximity' trong đoạn văn ám chỉ điều gì?", opts: ["closeness in physical distance", "complexity of mathematical calculations", "difference in historical eras", "severity of financial regulations"], h1Ko: "지리적 근접성(closeness in space)을 뜻합니다.", h1Vi: "Có nghĩa là sự gần gũi về khoảng cách địa lý.", h2Ko: "closeness와 동의어입니다.", h2Vi: "Đồng nghĩa với closeness.", exKo: "proximity는 지리적이거나 물리적인 '근접성'을 뜻합니다.", exVi: "proximity có nghĩa là sự gần gũi về mặt địa lý hoặc khoảng cách." },
      { q: "What accompanied the rise of digital globalization?", qKo: "디지털 세계화의 부상과 함께 수반된 것은?", qVi: "Điều gì đi kèm với sự trỗi dậy của toàn cầu hóa số?", opts: ["Unprecedented regulatory and jurisdictional challenges", "The complete stabilization of traditional tax policies", "The total disappearance of digital crime", "Universal international consensus on labor laws"], h1Ko: "마지막 구절 'introducing unprecedented regulatory challenges'를 확인하세요.", h1Vi: "Kiểm tra cụm từ cuối 'introducing unprecedented regulatory challenges'.", h2Ko: "전례 없는 규제상의 과제입니다.", h2Vi: "Các thách thức pháp lý chưa từng có.", exKo: "국경을 초월한 디지털 거래로 인해 전례 없는 법적·규제적 도전 과제가 발생했습니다.", exVi: "Đi kèm với các thách thức pháp lý và quản lý chưa từng có tiền lệ." },
      { q: "The author suggests that physical goods transport:", qKo: "저자가 물리적 상품 운송에 대해 시사하는 바는?", qVi: "Tác giả ngụ ý điều gì về việc vận chuyển hàng hóa vật lý?", opts: ["Is no longer the sole defining component of globalization", "Has ceased completely in every hemisphere", "Is the only economic activity that creates real value", "Has become entirely cost-free across oceans"], h1Ko: "'extends far beyond physical transit'를 확인하세요.", h1Vi: "Kiểm tra 'extends far beyond physical transit'.", h2Ko: "물리적 운송만이 세계화의 전부가 아니라는 점입니다.", h2Vi: "Vận chuyển vật lý không còn là yếu tố duy nhất định nghĩa toàn cầu hóa.", exKo: "물리적 상품 이동이 여전히 존재하지만, 더 이상 세계화의 유일한 정의가 아니라고 봅니다.", exVi: "Vận chuyển vật chất không còn là thành phần duy nhất định hình nên toàn cầu hóa." },
      { q: "The word 'decoupled' is closest in meaning to:", qKo: "단어 'decoupled'와 가장 가까운 의미는?", qVi: "Từ 'decoupled' gần nghĩa nhất với từ nào?", opts: ["disconnected", "reinforced", "accelerated", "complicated"], h1Ko: "분리된, 연결이 끊어진의 의미입니다.", h1Vi: "Có nghĩa là ngắt kết nối, tách rời.", h2Ko: "disconnected와 동의어입니다.", h2Vi: "Đồng nghĩa với disconnected.", exKo: "decouple은 두 요소의 결합을 분리한다는 뜻으로 disconnected와 같습니다.", exVi: "decoupled nghĩa là được tách rời, ngắt kết nối, tương đương với disconnected." },
      { q: "What is the central theme of the passage?", qKo: "글의 중심 주제는 무엇인가?", qVi: "Chủ đề trung tâm của đoạn văn là gì?", opts: ["The transformation of globalization through digital platforms", "The failure of micro-enterprises in modern economies", "The complete collapse of international shipping routes", "Why geographic distance will permanently prevent trade"], h1Ko: "디지털 플랫폼을 통한 세계화의 패러다임 변화를 다룹니다.", h1Vi: "Bài viết nói về sự chuyển dịch của toàn cầu hóa thông qua nền tảng số.", h2Ko: "디지털 세계화의 특성과 기회입니다.", h2Vi: "Đặc điểm và cơ hội của toàn cầu hóa số.", exKo: "디지털 플랫폼을 통해 가치 창출 방식과 접근성이 근본적으로 변화한 현대 세계화의 양상을 다루고 있습니다.", exVi: "Chủ đề chính là sự chuyển đổi của toàn cầu hóa thông qua các nền tảng kỹ thuật số." }
    ]
  },
  // 4. Academic Logic
  {
    id: "en-el-aca1", courseId: "en-el-aca", skillId: "en.el.aca1",
    title: "논리적 전제와 빈칸 추론", titleVi: "Tiền đề logic và Suy luận",
    concept: "패러다임의 혁명적 전환과 학술 텍스트의 논리적 전제 분석 기법을 훈련합니다.",
    conceptVi: "Rèn luyện kỹ năng phân tích tiền đề logic và sự chuyển dịch mô hình trong văn bản học thuật.",
    passage: "Scientific progress does not advance solely through the steady accumulation of verified facts; rather, as foundational paradigms encounter persistent anomalies, scientific communities must undergo revolutionary conceptual reorganizations that redefine fundamental questions.",
    items: [
      { q: "How does scientific progress truly advance according to the text?", qKo: "글에 나타난 과학적 진보의 진정한 동력은?", qVi: "Tiến bộ khoa học thực sự diễn ra như thế nào theo văn bản?", opts: ["Through revolutionary conceptual reorganizations when anomalies persist", "Through steady, uninterrupted accumulation of facts without change", "By strictly avoiding any questioning of accepted foundational theories", "Through commercial advertising promoting laboratory breakthroughs"], h1Ko: "'rather, as foundational paradigms encounter persistent anomalies'를 보세요.", h1Vi: "Xem cụm 'rather, as foundational paradigms encounter persistent anomalies'.", h2Ko: "변칙성으로 인한 개념적 재조직(혁명)입니다.", h2Vi: "Tái tổ chức nhận thức mang tính cách mạng do nghịch lý.", exKo: "변칙성이 누적될 때 일어나는 개념적 혁명과 재조직을 통해 발전합니다.", exVi: "Tiến bộ qua các cuộc cách mạng và tái cơ cấu nhận thức khi nghịch lý xuất hiện." },
      { q: "The word 'anomalies' in the passage refers to:", qKo: "본문의 'anomalies'가 가리키는 대상은?", qVi: "Từ 'anomalies' trong bài chỉ điều gì?", opts: ["Deviations or facts that existing theories cannot explain", "Routine calculations confirming predictable outcomes", "Mathematical laws that remain universally valid", "Financial expenses required to maintain laboratories"], h1Ko: "기존 이론으로 설명되지 않는 예외나 변칙 현상입니다.", h1Vi: "Những hiện tượng dị thường mà lý thuyết cũ không giải thích được.", h2Ko: "예외적이고 설명 불가능한 현상입니다.", h2Vi: "Các dữ liệu sai khác bất thường.", exKo: "기존 패러다임의 틀로 설명할 수 없는 예외적이고 불일치하는 현상을 의미합니다.", exVi: "Chỉ những hiện tượng ngoại lệ hoặc sự kiện mà lý thuyết hiện hành không thể giải thích." },
      { q: "What triggers a revolutionary reorganization in science?", qKo: "과학계에서 혁명적 재조직을 촉발하는 요인은?", qVi: "Điều gì kích hoạt sự tái tổ chức cách mạng trong khoa học?", opts: ["Persistent anomalies that foundational paradigms fail to resolve", "A complete consensus among all living researchers on every topic", "A total reduction in governmental science funding", "The absolute absence of any debate in scholarly journals"], h1Ko: "기존 패러다임이 해결하지 못하는 지속적인 변칙 현상입니다.", h1Vi: "Các nghịch lý dai dẳng mà mô hình nền tảng không giải quyết được.", h2Ko: "지속적인 변칙성(persistent anomalies)의 출현입니다.", h2Vi: "Sự xuất hiện của persistent anomalies.", exKo: "기존 이론이 더 이상 해결하지 못하는 변칙적 데이터가 누적될 때 촉발됩니다.", exVi: "Kích hoạt khi các dữ liệu nghịch lý không thể giải thích tiếp tục xuất hiện." },
      { q: "What does the author reject about scientific progress?", qKo: "과학적 발전에 대해 저자가 거부하는 통념은?", qVi: "Tác giả bác bỏ điều gì về sự tiến bộ khoa học?", opts: ["That it advances solely through steady accumulation of facts", "That foundational questions can ever be redefined", "That scientific communities experience conceptual conflict", "That anomalies exist in physical nature"], h1Ko: "첫 문장의 'does not advance solely through steady accumulation'을 확인하세요.", h1Vi: "Kiểm tra 'does not advance solely through steady accumulation'.", h2Ko: "단순히 지식이 직선적으로 누적된다는 생각을 배격합니다.", h2Vi: "Bác bỏ quan niệm rằng tiến bộ chỉ là sự tích lũy tuyến tính.", exKo: "과학이 검증된 사실의 단순하고 완만한 누적만으로 발전한다는 통념을 부정합니다.", exVi: "Bác bỏ quan niệm rằng khoa học chỉ tiến bộ đơn thuần qua sự tích lũy dữ liệu đều đặn." },
      { q: "What is the consequence of a conceptual reorganization?", qKo: "개념적 재조직이 가져오는 결과는 무엇인가?", qVi: "Hậu quả của một cuộc tái cơ cấu nhận thức là gì?", opts: ["It redefines the fundamental questions asked by researchers", "It eliminates the need for further scientific investigations", "It guarantees that all future experiments will yield identical data", "It forbids any further revision of academic textbooks"], h1Ko: "마지막 구절 'redefine fundamental questions'를 확인하세요.", h1Vi: "Kiểm tra phần cuối 'redefine fundamental questions'.", h2Ko: "근본적 질문의 재정의입니다.", h2Vi: "Tái định nghĩa các câu hỏi căn bản.", exKo: "연구자들이 탐구하는 근본적 질문과 시각 자체를 새롭게 재정의하게 됩니다.", exVi: "Định nghĩa lại các câu hỏi nền tảng mà cộng đồng nghiên cứu đặt ra." },
      { q: "The author's philosophical view of science is most aligned with:", qKo: "저자의 과학관과 가장 일치하는 관점은?", qVi: "Quan điểm triết học của tác giả phù hợp nhất với:", opts: ["Thomas Kuhn's paradigm shift model", "Purely mechanical linear positivism", "Total postmodern skepticism rejecting facts", "Ancient scholastic authoritarianism"], h1Ko: "패러다임의 혁명적 전환을 설명한 토마스 쿤의 관점과 맞닿아 있습니다.", h1Vi: "Gắn liền với mô hình chuyển đổi hệ hình (paradigm shift) của Thomas Kuhn.", h2Ko: "패러다임 혁명 모델입니다.", h2Vi: "Mô hình cách mạng hệ hình.", exKo: "변칙성에 의한 위기와 패러다임 혁명을 강조한 토마스 쿤의 과학혁명 모델과 일치합니다.", exVi: "Phù hợp nhất với mô hình cách mạng khoa học và chuyển dịch hệ hình của Thomas Kuhn." },
      { q: "The word 'persistent' in the text most nearly means:", qKo: "본문의 'persistent'와 가장 가까운 의미는?", qVi: "Từ 'persistent' trong đoạn văn gần nghĩa nhất với từ nào?", opts: ["enduring and recurring", "temporary and fleeting", "insignificant and easily resolved", "completely imaginary"], h1Ko: "쉽게 사라지지 않고 끈질기게 지속되는 상태를 뜻합니다.", h1Vi: "Có nghĩa là dai dẳng, kéo dài và tái diễn.", h2Ko: "enduring(지속되는)과 같습니다.", h2Vi: "Đồng nghĩa với enduring.", exKo: "persistent는 '끈질긴, 지속적으로 나타나는'의 뜻으로 enduring과 같습니다.", exVi: "persistent nghĩa là dai dẳng, kiên trì, đồng nghĩa với enduring." }
    ]
  },
  {
    id: "en-el-aca2", courseId: "en-el-aca", skillId: "en.el.aca2",
    title: "두 지문의 논리적 통합과 비교", titleVi: "Tổng hợp và So sánh Logic giữa Hai Đoạn văn",
    concept: "상반되거나 보완적인 두 관점의 학술 지문을 종합하여 고차원적 결론을 도출하는 융합 독해 기법입니다.",
    conceptVi: "Phương pháp đọc hiểu tổng hợp: kết hợp hai quan điểm học thuật đối lập hoặc bổ trợ để rút ra kết luận bậc cao.",
    passage: "Passage A argues that technological automation invariably destroys employment faster than new industries can generate replacement roles. Passage B contends that historical transitions always yield higher-order cognitive vocations that cannot be anticipated during periods of disruption.",
    items: [
      { q: "What is the central point of contention between the two passages?", qKo: "두 지문 간의 핵심 쟁점은 무엇인가?", qVi: "Điểm tranh luận cốt lõi giữa hai đoạn văn là gì?", opts: ["Whether technology ultimately creates more employment than it displaces", "Whether machines require electricity to operate in factories", "Whether ancient workers enjoyed agricultural labor", "Whether automation software is cheaper than hardware"], h1Ko: "자동화가 일자리를 순감소시키는지, 고차원적 새 일자리를 창출하는지의 대비입니다.", h1Vi: "Tranh luận về việc tự động hóa làm giảm việc làm hay tạo ra nghề nghiệp mới bậc cao.", h2Ko: "일자리 대체와 창출 간의 상반된 시각입니다.", h2Vi: "Hai góc nhìn đối lập về việc làm và công nghệ.", exKo: "기술 발전이 일자리를 파괴하기만 하는지, 아니면 새로운 고차원적 직업군을 창출하는지에 대한 시각 차이입니다.", exVi: "Điểm tranh luận là liệu công nghệ phá hủy việc làm hay sẽ sinh ra các nghề nghiệp bậc cao mới." },
      { q: "According to Passage A, what is the danger of automation?", qKo: "지문 A에 따르면 자동화의 위험성은 무엇인가?", qVi: "Theo Đoạn A, mối nguy hiểm của tự động hóa là gì?", opts: ["It displaces existing jobs faster than new roles appear", "It forces all factories to shut down permanently", "It prevents engineers from creating software", "It causes immediate environmental collapse"], h1Ko: "일자리 파괴 속도가 대체 일자리 생성 속도보다 빠르다는 주장입니다.", h1Vi: "Tốc độ mất việc làm nhanh hơn tốc độ tạo ra công việc thay thế.", h2Ko: "'destroys employment faster' 구절을 확인하세요.", h2Vi: "Xem cụm 'destroys employment faster'.", exKo: "신규 산업이 대체 일자리를 만들어내는 속도보다 기술이 기존 일자리를 없애는 속도가 더 빠르다고 봅니다.", exVi: "Đoạn A lo ngại việc làm bị mất đi nhanh hơn tốc độ các ngành mới có thể tạo ra." },
      { q: "Passage B counters Passage A's pessimism by emphasizing:", qKo: "지문 B가 지문 A의 비관론을 반박하기 위해 강조하는 바는?", qVi: "Đoạn B phản bác sự bi quan của Đoạn A bằng cách nhấn mạnh:", opts: ["Historical emergence of unanticipated higher-order cognitive roles", "The legal prohibition of future artificial intelligence models", "A guaranteed governmental universal basic income for all", "The complete superiority of manual agricultural labor"], h1Ko: "역사적으로 전환기에는 예측할 수 없었던 고차원 인지 직업이 나타났다는 점입니다.", h1Vi: "Nhấn mạnh lịch sử luôn xuất hiện các công việc nhận thức bậc cao không ngờ tới.", h2Ko: "'higher-order cognitive vocations'를 확인하세요.", h2Vi: "Kiểm tra cụm từ 'higher-order cognitive vocations'.", exKo: "기술적 전환기마다 이전에는 상상하지 못했던 고차원적 인지 직무가 역사적으로 항상 창출되었다는 점을 강조합니다.", exVi: "Đoạn B nhấn mạnh rằng lịch sử luôn sản sinh ra các nghề nghiệp nhận thức bậc cao mà thời kỳ đầu chưa thể thấy trước." },
      { q: "The word 'invariably' in Passage A is closest in meaning to:", qKo: "지문 A의 'invariably'와 가장 가까운 의미는?", qVi: "Từ 'invariably' trong Đoạn A gần nghĩa nhất với từ nào?", opts: ["consistently and without exception", "temporarily and unpredictably", "scarcely and infrequently", "reluctantly and unwillingly"], h1Ko: "변함없이, 예외 없이의 뜻입니다.", h1Vi: "Có nghĩa là luôn luôn, không có ngoại lệ.", h2Ko: "consistently와 동의어입니다.", h2Vi: "Đồng nghĩa với consistently.", exKo: "invariably는 '예외 없이, 반드시'라는 뜻으로 consistently와 같습니다.", exVi: "invariably có nghĩa là luôn luôn, bất biến, tương đương với consistently." },
      { q: "What synthesis can be drawn by combining both perspectives?", qKo: "두 관점을 종합하여 도출할 수 있는 결론은?", qVi: "Kết luận tổng hợp nào có thể rút ra từ cả hai quan điểm?", opts: ["Short-term disruption requires support while preparing for novel cognitive roles", "Technological innovation should be outlawed across every sector", "Workers should abandon all education in advanced technology", "Economic history proves that no adjustment period ever exists"], h1Ko: "단기적 일자리 파괴에 대비하면서 동시에 새로운 직무로의 전환을 준비해야 한다는 종합적 시각입니다.", h1Vi: "Cần hỗ trợ chuyển đổi ngắn hạn đồng thời chuẩn bị cho các vai trò nhận thức mới.", h2Ko: "단기 위기와 장기 기회의 결합입니다.", h2Vi: "Kết hợp giữa khủng hoảng ngắn hạn và cơ hội dài hạn.", exKo: "단기적으로는 빠른 전환에 따른 노동 충격을 완화하고, 장기적으로는 새롭게 요구되는 고차원적 인지 역량을 길러야 한다는 융합적 통찰이 가능합니다.", exVi: "Cần hỗ trợ sự gián đoạn trong ngắn hạn và chuẩn bị kỹ năng cho các nghề nghiệp nhận thức mới trong dài hạn." },
      { q: "The word 'disruption' in this context suggests:", qKo: "문맥상 'disruption'이 시사하는 상태는?", qVi: "Trong ngữ cảnh này, 'disruption' ám chỉ tình trạng gì?", opts: ["A turbulent period of structural economic change", "A peaceful era of agricultural stagnation", "A time of zero technological invention", "An unchanging equilibrium in trade"], h1Ko: "구조적 변화로 인한 격변의 전환기입니다.", h1Vi: "Thời kỳ biến động của thay đổi cơ cấu kinh tế.", h2Ko: "격변과 혼란을 수반하는 변화를 뜻합니다.", h2Vi: "Giai đoạn chuyển tiếp đầy xáo trộn.", exKo: "기존 질서가 흔들리고 새로운 질서가 자리잡기까지의 혼란과 구조적 변화기를 뜻합니다.", exVi: "Chỉ giai đoạn chuyển dịch cơ cấu đầy biến động trong nền kinh tế." },
      { q: "Both passages agree that technological change:", qKo: "두 지문 모두가 동의하는 기술 변화의 속성은?", qVi: "Cả hai đoạn văn đều đồng ý rằng sự thay đổi công nghệ:", opts: ["Has a transformative impact on the structure of human work", "Is completely irrelevant to modern economic development", "Affects only manufacturing while leaving services untouched", "Can be accurately predicted down to every specific detail"], h1Ko: "인간 노동의 구조에 지대한 변혁적 영향을 미친다는 점에 두 지문 모두 동의합니다.", h1Vi: "Cả hai đều đồng ý công nghệ có tác động làm biến đổi sâu sắc cơ cấu lao động.", h2Ko: "노동 구조의 근본적 변화에 대한 공통 인식입니다.", h2Vi: "Nhận thức chung về tác động chuyển hóa mạnh mẽ của công nghệ.", exKo: "긍정적이든 부정적이든 기술 변화가 노동의 형태와 구조를 근본적으로 뒤바꾼다는 점에는 양측 모두 이견이 없습니다.", exVi: "Cả hai đoạn văn đều thừa nhận công nghệ có tác động biến đổi sâu rộng đến cấu trúc lao động của con người." }
    ]
  }
];

// Build Canonical Reading Bundle
const skills = [];
const courses = [];
const questions = [];

const viSkills = {};
const viCourses = {};
const viUnits = {};
const viLessons = {};
const viQuestions = {};

for (const c of COURSES) {
  const cLessons = LESSON_DEFS.filter((l) => l.courseId === c.id);
  const unit = c.units[0];
  const unitLessons = [];

  for (const l of cLessons) {
    skills.push({ id: l.skillId, title: l.title });
    viSkills[l.skillId] = l.titleVi;

    const qIds = [];
    l.items.forEach((item, idx) => {
      const qid = `${l.id}-q${idx + 1}`;
      qIds.push(qid);

      const rot = questions.length % 4;
      const reordered = item.opts.map((_, i) => item.opts[(i - rot + 4) % 4]);
      const correctId = ["a", "b", "c", "d"][rot];

      const isVocab = /meaning to|most nearly means|closest in meaning/i.test(item.q);
      const isSynthesis = /synthesis|contention|main argument|main topic/i.test(item.q) || idx === 4;
      const difficulty = isVocab ? 2 : isSynthesis ? 4 : 3;
      const expectedSeconds = isVocab ? 45 : isSynthesis ? 75 : 60;

      questions.push({
        id: qid,
        site: "english",
        skillId: l.skillId,
        type: "multiple_choice",
        difficulty,
        prompt: `글을 읽고 물음에 답하세요. "${l.passage}" 질문: ${item.qKo}`,
        options: reordered.map((text, i) => ({ id: ["a", "b", "c", "d"][i], text })),
        answer: { kind: "choice", id: correctId },
        hints: [item.h1Ko, item.h2Ko],
        explanation: item.exKo,
        role: idx < 4 ? "core" : idx === 4 ? "challenge" : "variant",
        family: `${l.id}-mc`,
        expectedSeconds,
        tags: ["reading", "advanced", "elective"],
        status: "PUBLISHED"
      });

      viQuestions[qid] = {
        prompt: `Đọc đoạn văn rồi trả lời câu hỏi. "${l.passage}" Câu hỏi: ${item.qVi}`,
        hints: [item.h1Vi, item.h2Vi],
        explanation: item.exVi
      };
    });

    unitLessons.push({
      id: l.id,
      title: l.title,
      concept: l.concept,
      example: l.passage,
      skillIds: [l.skillId],
      questionIds: qIds.slice(0, 4),
      challengeId: qIds[4]
    });

    viLessons[l.id] = {
      title: l.titleVi,
      concept: l.conceptVi,
      example: l.passage
    };
  }

  courses.push({
    id: c.id,
    title: c.title,
    grade: c.grade,
    elective: true,
    world: {
      name: c.world.name,
      emoji: c.world.emoji,
      tagline: c.world.tagline
    },
    units: [
      {
        id: unit.id,
        title: unit.title,
        lessons: unitLessons
      }
    ]
  });

  viCourses[c.id] = {
    title: c.titleVi,
    world: {
      name: c.world.nameVi,
      tagline: c.world.taglineVi
    }
  };
  viUnits[unit.id] = unit.titleVi;
}

const canonicalBundle = {
  catalog: {
    site: "english",
    country: "KR",
    curriculum: "life-help-english-reading-v1",
    courses,
    skills
  },
  questions
};

const viOverlay = {
  skills: viSkills,
  courses: viCourses,
  units: viUnits,
  lessons: viLessons,
  questions: viQuestions
};

// Write files
const json = (v) => JSON.stringify(v, null, 1) + "\n";
fs.writeFileSync(path.join(outDir, "english.json"), json(canonicalBundle));
fs.writeFileSync(path.join(viDir, "reading-english.json"), json(viOverlay));

// Helper index module
const indexModule = `import bundle from "./english.json";
import viOverlay from "@/lib/learn/content/vi/reading-english.json";
import type { ContentBundle, Course, Skill, Question } from "@/lib/learn/types";
import type { ContentOverlay } from "@/lib/learn/content/overlay";

export const advancedReadingBundle = bundle as unknown as ContentBundle;
export const advancedReadingViOverlay = viOverlay as unknown as ContentOverlay;
export const ADVANCED_READING_COURSES: Course[] = bundle.catalog.courses as unknown as Course[];
export const ADVANCED_READING_SKILLS: Skill[] = bundle.catalog.skills as unknown as Skill[];
export const ADVANCED_READING_QUESTIONS: Question[] = bundle.questions as unknown as Question[];

export const ADVANCED_READING_OVERLAY_LOCALES = [
  "am", "ar", "arz", "bn", "da", "de", "el", "en", "es", "fa", "fr", "gu", "he", "hi", "id", "it",
  "ja", "kk", "km", "kn", "ml", "mn", "mr", "my", "ne", "nl", "no", "pa", "pl", "pt", "ru", "sg",
  "si", "sv", "sw", "ta", "te", "tet", "th", "tr", "uk", "ur", "uz", "vi", "zh-Hans", "zh-Hant"
] as const;

export function getAdvancedReadingOverlay(locale: string): ContentOverlay | null {
  if (locale === "vi") return advancedReadingViOverlay;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(\`./overlays/\${locale}.json\`) as ContentOverlay;
  } catch {
    return null;
  }
}
`;
fs.writeFileSync(path.join(outDir, "index.ts"), indexModule);

console.log(`Successfully generated English Advanced Reading Track:`);
console.log(`- Courses: ${courses.length}`);
console.log(`- Lessons: ${courses.flatMap(c => c.units[0].lessons).length}`);
console.log(`- Questions: ${questions.length}`);

export { COURSES, LESSON_DEFS };

