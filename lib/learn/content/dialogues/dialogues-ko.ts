import type { SituationalDialogue } from "./types";

export const KOREAN_SITUATIONAL_DIALOGUES: readonly SituationalDialogue[] = [
  // 1. Hospital (병원·약국)
  {
    id: "ko-dlg-hosp-1",
    category: "hospital",
    site: "korean",
    titleKo: "약국에서 감기약 구매하기",
    titleEn: "Buying Cold Medicine at a Pharmacy",
    difficulty: 2,
    gradeScope: "K4",
    semester: 1,
    locationKo: "동네 약국 카운터",
    locationEn: "Neighborhood pharmacy counter",
    turns: [
      { speaker: "A", speakerRole: "약사", text: "어디가 불편해서 오셨어요?", translation: "How can I help you today?" },
      { speaker: "B", speakerRole: "손님", text: "어제부터 열이 나고 목이 많이 아파요.", translation: "I have had a fever and a bad sore throat since yesterday." },
      { speaker: "A", speakerRole: "약사", text: "기침이나 콧물도 나시나요?", translation: "Do you also have a cough or a runny nose?" },
      { speaker: "B", speakerRole: "손님", text: "네, 기침도 조금 나요. 먹기 편한 종합 감기약으로 주세요.", translation: "Yes, I cough a little too. Please give me an easy-to-take comprehensive cold medicine." },
      { speaker: "A", speakerRole: "약사", text: "이 약은 하루 세 번, 식후 30분에 한 알씩 드세요.", translation: "Take this medicine one tablet three times a day, 30 minutes after meals." }
    ],
    keyExpressions: [
      { target: "열이 나다", meaning: "to have a fever", explanation: "체온이 정상보다 높아질 때 쓰는 기초 증상 표현입니다." },
      { target: "목이 아프다", meaning: "to have a sore throat", explanation: "인후통을 설명할 때 사용합니다." },
      { target: "식후 30분", meaning: "30 minutes after meals", explanation: "약 복용 시점을 나타내는 대표적 표현입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-hosp-1-q1",
        site: "korean",
        skillId: "dlg.ko.hosp",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "대화에서 손님이 호소한 증상이 아닌 것은 무엇인가요?",
        options: [
          { id: "a", text: "열이 난다" },
          { id: "b", text: "목이 아프다" },
          { id: "c", text: "기침이 조금 난다" },
          { id: "d", text: "눈이 충혈되었다" }
        ],
        answer: { kind: "choice", id: "d" },
        hints: ["손님은 열, 목 통증, 기침을 언급했습니다.", "눈에 대한 언급은 대화에 없습니다."],
        explanation: "손님은 열이 나고 목이 아프며 기침이 조금 난다고 말했으나, 눈 충혈은 언급하지 않았습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-hosp-2",
    category: "hospital",
    site: "korean",
    titleKo: "내과 병원 접수와 진료 상담",
    titleEn: "Clinic Reception & Doctor Consultation",
    difficulty: 3,
    gradeScope: "K6",
    semester: 2,
    locationKo: "내과 병원 진료실",
    locationEn: "Internal medicine clinic doctor room",
    turns: [
      { speaker: "A", speakerRole: "의사", text: "환자분, 오늘 어디가 가장 불편하신가요?", translation: "Patient, what is bothering you the most today?" },
      { speaker: "B", speakerRole: "환자", text: "어젯밤부터 배가 찌르듯이 아프고 소화가 잘 안 돼요.", translation: "My stomach has been stinging since last night and I feel indigestion." },
      { speaker: "A", speakerRole: "의사", text: "매운 음식이나 기름진 야식을 드셨나요?", translation: "Did you have spicy food or greasy late-night snacks?" },
      { speaker: "B", speakerRole: "환자", text: "어제 늦게 매운 라면을 먹고 바로 잤어요.", translation: "I had spicy instant noodles late yesterday and went right to bed." },
      { speaker: "A", speakerRole: "의사", text: "급성 위염 증상입니다. 위 보호제와 소화제를 처방해 드릴게요.", translation: "It is acute gastritis. I will prescribe stomach protectants and digestive medicine." }
    ],
    keyExpressions: [
      { target: "소화가 안 되다", meaning: "to have indigestion", explanation: "음식물 소화가 원활하지 않을 때 씁니다." },
      { target: "처방해 드리다", meaning: "to prescribe (honorific)", explanation: "의사가 환자에게 약 처방을 안내할 때 씁니다." }
    ],
    questions: [
      {
        id: "ko-dlg-hosp-2-q1",
        site: "korean",
        skillId: "dlg.ko.hosp",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "의사가 진단한 환자의 병명은 무엇인가요?",
        options: [
          { id: "a", text: "급성 위염" },
          { id: "b", text: "감기 몸살" },
          { id: "c", text: "발목 염좌" },
          { id: "d", text: "만성 비염" }
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["의사의 마지막 말을 확인하세요.", "급성 위염 증상이라고 했습니다."],
        explanation: "의사는 매운 야식 후 발생한 복통과 소화불량을 '급성 위염'으로 진단했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-hosp-3",
    category: "hospital",
    site: "korean",
    titleKo: "처방전 복약 상담과 주의사항",
    titleEn: "Prescription Counseling & Precautions",
    difficulty: 4,
    gradeScope: "K8",
    semester: 1,
    locationKo: "약국 복약지도 상담실",
    locationEn: "Pharmacy medication counseling room",
    turns: [
      { speaker: "A", speakerRole: "약사", text: "조제 완료되었습니다. 복용법 설명해 드릴게요.", translation: "Your prescription is ready. Let me explain the dosage instructions." },
      { speaker: "B", speakerRole: "환자", text: "네, 항생제도 포함되어 있나요?", translation: "Yes, does it include antibiotics?" },
      { speaker: "A", speakerRole: "약사", text: "네, 3일분 항생제가 들어 있으니 증상이 나아져도 끝까지 다 드셔야 합니다.", translation: "Yes, it has a 3-day supply of antibiotics, so you must finish all of it even if symptoms improve." },
      { speaker: "B", speakerRole: "환자", text: "약을 먹고 운전해도 문제없을까요?", translation: "Is it fine to drive after taking this medicine?" },
      { speaker: "A", speakerRole: "약사", text: "졸림을 유발할 수 있는 성분이 있으니 장거리 운전은 피하시는 게 좋습니다.", translation: "It contains ingredients that may cause drowsiness, so it is best to avoid long-distance driving." }
    ],
    keyExpressions: [
      { target: "복용법", meaning: "dosage / administration instructions", explanation: "약 먹는 방법과 주의사항을 의미합니다." },
      { target: "졸림을 유발하다", meaning: "to induce drowsiness", explanation: "약의 부작용 안내 시 자주 등장하는 어휘입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-hosp-3-q1",
        site: "korean",
        skillId: "dlg.ko.hosp",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "약사가 당부한 주의사항으로 알맞은 것은 무엇인가요?",
        options: [
          { id: "a", text: "항생제는 증상이 나아지면 바로 중단해야 한다." },
          { id: "b", text: "졸릴 수 있으므로 장거리 운전은 피하는 것이 좋다." },
          { id: "c", text: "약은 공복에 물 없이 씹어서 복용해야 한다." },
          { id: "d", text: "하루에 다섯 번 이상 복용해야 효과가 있다." }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["약의 부작용과 운전 관련 내용을 확인하세요."],
        explanation: "약사는 졸림을 유발할 수 있어 장거리 운전을 피하는 것이 좋다고 당부했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 2. Airport (공항·입국)
  {
    id: "ko-dlg-airp-1",
    category: "airport",
    site: "korean",
    titleKo: "공항철도 이용과 소요 시간 문의",
    titleEn: "Airport Railroad & Travel Time Inquiry",
    difficulty: 2,
    gradeScope: "K4",
    semester: 2,
    locationKo: "서울역 공항철도 안내소",
    locationEn: "Seoul Station Airport Railroad Info Desk",
    turns: [
      { speaker: "A", speakerRole: "승객", text: "실례합니다. 인천공항 제1여객터미널까지 가려는데 어떤 열차를 타야 하나요?", translation: "Excuse me. I want to go to Incheon Airport Terminal 1, which train should I take?" },
      { speaker: "B", speakerRole: "직원", text: "직통열차와 일반열차가 있습니다. 직통열차를 타시면 논스톱으로 43분 걸립니다.", translation: "There are express trains and all-stop trains. The express train takes 43 minutes non-stop." },
      { speaker: "A", speakerRole: "승객", text: "비행기 출발 시간이 얼마 안 남아서 직통열차 승차권으로 한 장 주세요.", translation: "My flight departure time is coming up soon, so please give me one ticket for the express train." },
      { speaker: "B", speakerRole: "직원", text: "네, 4번 승강장으로 내려가시면 바로 탑승하실 수 있습니다.", translation: "Sure, if you go down to Platform 4, you can board right away." }
    ],
    keyExpressions: [
      { target: "제1여객터미널", meaning: "Terminal 1", explanation: "공항의 여객 터미널 구분 명칭입니다." },
      { target: "소요 시간", meaning: "travel / required time", explanation: "이동에 걸리는 시간을 묻고 답할 때 씁니다." }
    ],
    questions: [
      {
        id: "ko-dlg-airp-1-q1",
        site: "korean",
        skillId: "dlg.ko.airp",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "승객이 직통열차를 선택한 주된 이유는 무엇인가요?",
        options: [
          { id: "a", text: "열차 요금이 무료여서" },
          { id: "b", text: "비행기 출발 시간이 얼마 남지 않아서" },
          { id: "c", text: "일반열차가 운행을 중단해서" },
          { id: "d", text: "승강장이 지상 1층에 있어서" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["승객의 대화 내용 중 비행기 시간에 주목하세요."],
        explanation: "승객은 비행기 출발 시간이 촉박하여 더 빠른 직통열차를 선택했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-airp-2",
    category: "airport",
    site: "korean",
    titleKo: "항공사 체크인 카운터와 수하물 위탁",
    titleEn: "Airline Check-in Counter & Baggage Drop",
    difficulty: 3,
    gradeScope: "K6",
    semester: 1,
    locationKo: "인천국제공항 3층 출국장 카운터",
    locationEn: "Incheon Airport 3F Departure Hall Counter",
    turns: [
      { speaker: "A", speakerRole: "지상직원", text: "안녕하세요. 여권과 전자 항공권 확인해 드리겠습니다.", translation: "Hello. May I check your passport and e-ticket please?" },
      { speaker: "B", speakerRole: "승객", text: "여기 있습니다. 혹시 창가 쪽 좌석으로 배정 가능한가요?", translation: "Here they are. Could I possibly get a window seat assigned?" },
      { speaker: "A", speakerRole: "지상직원", text: "네, 앞쪽 창가 좌석으로 배정해 드렸습니다. 부치실 짐을 저울 위에 올려주세요.", translation: "Yes, I have assigned a front window seat. Please place your checked bags on the scale." },
      { speaker: "B", speakerRole: "승객", text: "캐리어 하나입니다. 기내 반입 금지 물품은 모두 뺐어요.", translation: "Just one suitcase. I took out all prohibited cabin items." },
      { speaker: "A", speakerRole: "지상직원", text: "무게는 18kg으로 정상입니다. 24번 탑승구로 14시 20분까지 가시면 됩니다.", translation: "The weight is 18 kg, within the allowance. Please be at Gate 24 by 14:20." }
    ],
    keyExpressions: [
      { target: "창가 쪽 좌석", meaning: "window seat", explanation: "비행기 좌석 선택 시 복도 쪽(aisle seat)과 구분하여 씁니다." },
      { target: "수하물", meaning: "baggage / luggage", explanation: "기내 수하물과 위탁 수하물을 통칭합니다." }
    ],
    questions: [
      {
        id: "ko-dlg-airp-2-q1",
        site: "korean",
        skillId: "dlg.ko.airp",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "승객이 가야 할 탑승구 번호와 탑승 시간은 언제인가요?",
        options: [
          { id: "a", text: "18번 탑승구 / 14시 정각" },
          { id: "b", text: "24번 탑승구 / 14시 20분" },
          { id: "c", text: "3층 안내소 / 15시 20분" },
          { id: "d", text: "43번 탑승구 / 14시 40분" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["지상직원의 마지막 안내를 확인하세요."],
        explanation: "직원은 24번 탑승구로 14시 20분까지 가라고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-airp-3",
    category: "airport",
    site: "korean",
    titleKo: "입국심사와 체류 목적 질의응답",
    titleEn: "Immigration Interview & Stay Purpose",
    difficulty: 4,
    gradeScope: "K8",
    semester: 2,
    locationKo: "인천국제공항 입국심사대",
    locationEn: "Incheon Airport Immigration Counter",
    turns: [
      { speaker: "A", speakerRole: "심사관", text: "여권과 입국신고서 제출해 주십시오. 한국 방문 목적이 무엇입니까?", translation: "Please submit your passport and arrival card. What is the purpose of your visit to Korea?" },
      { speaker: "B", speakerRole: "입국자", text: "한국 대학교에서 한 학기 동안 어학연수를 하기 위해 D-4 비자로 입국했습니다.", translation: "I entered on a D-4 visa to attend a language study program at a Korean university for one semester." },
      { speaker: "A", speakerRole: "심사관", text: "입학허가서와 체류 예정지 주소를 확인할 수 있을까요?", translation: "May I check your admission certificate and intended accommodation address?" },
      { speaker: "B", speakerRole: "입국자", text: "여기 대학교 기숙사 거주 증명서와 표준입학허가서 원본입니다.", translation: "Here are the original certificate of admission and university dormitory proof." },
      { speaker: "A", speakerRole: "심사관", text: "확인되었습니다. 지문 인식기에 양손 검지 손가락을 올려주세요. 입국 심사가 완료되었습니다.", translation: "Verified. Please place your index fingers on the scanner. Immigration clearance is complete." }
    ],
    keyExpressions: [
      { target: "방문 목적", meaning: "purpose of visit", explanation: "입국 심사 시 첫 번째로 묻는 공식 질문입니다." },
      { target: "체류 예정지", meaning: "intended place of stay / address in Korea", explanation: "입국신고서 및 비자 심사 시 필수 기재 항목입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-airp-3-q1",
        site: "korean",
        skillId: "dlg.ko.airp",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "입국자가 한국에 온 목적과 소지한 비자의 종류는 무엇인가요?",
        options: [
          { id: "a", text: "관광 여행 / C-3 비자" },
          { id: "b", text: "어학연수 / D-4 비자" },
          { id: "c", text: "취업 근무 / E-9 비자" },
          { id: "d", text: "영주 거주 / F-5 비자" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["입국자의 첫 답변에서 D-4 비자와 어학연수를 언급했습니다."],
        explanation: "입국자는 대학교 어학연수를 목적으로 D-4 비자를 받아 입국했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 3. Store (상점·쇼핑)
  {
    id: "ko-dlg-stor-1",
    category: "store",
    site: "korean",
    titleKo: "편의점에서 간단한 음료와 간식 구매",
    titleEn: "Buying Snacks & Drinks at a Convenience Store",
    difficulty: 1,
    gradeScope: "K2",
    semester: 1,
    locationKo: "편의점 계산대",
    locationEn: "Convenience store checkout",
    turns: [
      { speaker: "A", speakerRole: "손님", text: "이 생수랑 삼각김밥 얼마예요?", translation: "How much are this bottled water and triangle kimbap?" },
      { speaker: "B", speakerRole: "직원", text: "생수는 1,000원이고 삼각김밥은 1,300원이라 총 2,300원입니다.", translation: "The water is 1,000 won and the kimbap is 1,300 won, totaling 2,300 won." },
      { speaker: "A", speakerRole: "손님", text: "교통카드로 결제할 수 있나요?", translation: "Can I pay with a transit card?" },
      { speaker: "B", speakerRole: "직원", text: "네, 단말기 위에 올려주세요. 봉투 필요하세요?", translation: "Yes, please place it on the terminal. Do you need a bag?" },
      { speaker: "A", speakerRole: "손님", text: "아니요, 가방에 넣을게요. 영수증은 버려주세요.", translation: "No, I will put them in my bag. Please discard the receipt." }
    ],
    keyExpressions: [
      { target: "얼마예요?", meaning: "How much is it?", explanation: "가격 문의 시 가장 널리 쓰이는 기본 질문입니다." },
      { target: "결제하다", meaning: "to make a payment", explanation: "카드, 현금, 간편결제 등의 지불 행위를 뜻합니다." }
    ],
    questions: [
      {
        id: "ko-dlg-stor-1-q1",
        site: "korean",
        skillId: "dlg.ko.stor",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "손님이 결제 수단으로 사용한 것은 무엇인가요?",
        options: [
          { id: "a", text: "현금 만 원권" },
          { id: "b", text: "교통카드" },
          { id: "c", text: "백화점 상품권" },
          { id: "d", text: "신용카드 할부" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["손님이 직원에게 물어본 결제 수단을 확인하세요."],
        explanation: "손님은 교통카드로 결제할 수 있는지 물어보고 교통카드로 결제했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-stor-2",
    category: "store",
    site: "korean",
    titleKo: "의류 매장에서 사이즈와 피팅룸 이용",
    titleEn: "Trying Sizes in a Clothing Store",
    difficulty: 2,
    gradeScope: "K4",
    semester: 1,
    locationKo: "의류 브랜드 매장",
    locationEn: "Clothing brand shop floor",
    turns: [
      { speaker: "A", speakerRole: "손님", text: "저기요, 이 셔츠 M 사이즈로 입어볼 수 있나요?", translation: "Excuse me, can I try this shirt in size M?" },
      { speaker: "B", speakerRole: "직원", text: "네, 고객님. M 사이즈 준비해 드리겠습니다. 피팅룸은 왼쪽 안쪽에 있어요.", translation: "Yes, customer. I will prepare size M. The fitting room is on the left inside." },
      { speaker: "A", speakerRole: "손님", text: "입어봤는데 소매가 조금 길어요. 혹시 S 사이즈도 있나요?", translation: "I tried it on, but the sleeves are a bit long. Do you have a size S as well?" },
      { speaker: "B", speakerRole: "직원", text: "네, 흰색과 하늘색 모두 S 사이즈 재고가 있습니다.", translation: "Yes, we have size S in stock for both white and light blue." },
      { speaker: "A", speakerRole: "손님", text: "하늘색 S 사이즈가 마음에 드네요. 이걸로 계산해 주세요.", translation: "I like the light blue in size S. I will take this one." }
    ],
    keyExpressions: [
      { target: "입어보다", meaning: "to try on clothes", explanation: "옷을 구매하기 전 착용해볼 때 쓰는 표현입니다." },
      { target: "피팅룸", meaning: "fitting room", explanation: "탈의실을 가리키는 일반적 외래어입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-stor-2-q1",
        site: "korean",
        skillId: "dlg.ko.stor",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "손님이 최종적으로 구매하기로 결정한 옷은 무엇인가요?",
        options: [
          { id: "a", text: "흰색 M 사이즈 셔츠" },
          { id: "b", text: "하늘색 S 사이즈 셔츠" },
          { id: "c", text: "검정색 L 사이즈 재킷" },
          { id: "d", text: "노란색 프리사이즈 니트" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["손님의 마지막 대사에서 색상과 사이즈를 확인하세요."],
        explanation: "손님은 소매가 맞는 하늘색 S 사이즈 셔츠를 최종 선택했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-stor-3",
    category: "store",
    site: "korean",
    titleKo: "영수증 지참 후 제품 교환 및 환불",
    titleEn: "Product Exchange & Refund with Receipt",
    difficulty: 3,
    gradeScope: "K6",
    semester: 2,
    locationKo: "백화점 고객만족센터",
    locationEn: "Department store customer service desk",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "그제 산 가방인데요, 집에 가서 보니 지퍼에 흠집이 있어서 교환하고 싶어요.", translation: "I bought this bag the day before yesterday, and saw a scratch on the zipper at home. I would like an exchange." },
      { speaker: "B", speakerRole: "안내원", text: "불편을 드려 죄송합니다. 결제하셨던 결제 카드와 구매 영수증을 보여주시겠어요?", translation: "We apologize for the inconvenience. May I see your payment card and purchase receipt?" },
      { speaker: "A", speakerRole: "고객", text: "여기 카드와 영수증입니다. 같은 제품으로 바로 교환 가능한가요?", translation: "Here are the card and receipt. Is a direct exchange for the same item possible?" },
      { speaker: "B", speakerRole: "안내원", text: "확인해 보니 동일 색상 재고가 전 매장에서 품절이라 전액 환불로 도와드려도 될까요?", translation: "Upon checking, the same color is sold out across all stores. May we assist you with a full refund?" },
      { speaker: "A", speakerRole: "고객", text: "네, 그럼 결제 취소 환불로 진행해 주세요.", translation: "Yes, please proceed with the card payment cancellation and refund." }
    ],
    keyExpressions: [
      { target: "흠집이 있다", meaning: "to have a scratch/flaw", explanation: "제품 하자 사유를 설명할 때 씁니다." },
      { target: "전액 환불", meaning: "full refund", explanation: "결제 금액 전체를 돌려받을 때 사용합니다." }
    ],
    questions: [
      {
        id: "ko-dlg-stor-3-q1",
        site: "korean",
        skillId: "dlg.ko.stor",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "매장에서 교환 대신 환불로 처리하게 된 이유는 무엇인가요?",
        options: [
          { id: "a", text: "구매 영수증을 분실해서" },
          { id: "b", text: "환불 가능 기간인 3일이 지나서" },
          { id: "c", text: "동일 색상 재고가 전 매장에서 품절되어서" },
          { id: "d", text: "고객이 현금 결제를 요구해서" }
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["안내원의 대화 중 품절 언급을 확인하세요."],
        explanation: "동일한 색상의 가방 재고가 모든 매장에서 품절되어 전액 환불로 처리되었습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 4. Classroom (교실·학교)
  {
    id: "ko-dlg-cls-1",
    category: "classroom",
    site: "korean",
    titleKo: "교실에서 짝꿍과 학용품 나누기",
    titleEn: "Sharing School Supplies with a Desk Partner",
    difficulty: 1,
    gradeScope: "K2",
    semester: 2,
    locationKo: "초등학교 교실 짝꿍 자리",
    locationEn: "Elementary classroom desk partner seats",
    turns: [
      { speaker: "A", speakerRole: "지우", text: "민수야, 필통을 집에 두고 와서 그런데 연필 한 자루만 빌려줄 수 있어?", translation: "Minsu, I left my pencil case at home. Could you lend me a pencil?" },
      { speaker: "B", speakerRole: "민수", text: "응, 필통에 깎아둔 연필 세 자루 있어. 지우개도 필요해?", translation: "Sure, I have three sharpened pencils in my pencil case. Do you need an eraser too?" },
      { speaker: "A", speakerRole: "지우", text: "고마워! 수업 끝나고 깨끗이 돌려줄게.", translation: "Thank you! I will return it cleanly after class." },
      { speaker: "B", speakerRole: "민수", text: "천만에. 다음 시간 미술 준비물 가위도 같이 쓰자.", translation: "You are welcome. Let us share the scissors for art class next period too." }
    ],
    keyExpressions: [
      { target: "빌려주다", meaning: "to lend", explanation: "남에게 물건을 빌려줄 때 씁니다." },
      { target: "돌려주다", meaning: "to return a borrowed item", explanation: "빌린 물건을 되돌려줄 때 사용합니다." }
    ],
    questions: [
      {
        id: "ko-dlg-cls-1-q1",
        site: "korean",
        skillId: "dlg.ko.cls",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "지우가 민수에게 빌린 학용품은 무엇인가요?",
        options: [
          { id: "a", text: "연필" },
          { id: "b", text: "자" },
          { id: "c", text: "도화지" },
          { id: "d", text: "색연필 세트" }
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["지우의 첫 번째 대사를 확인하세요."],
        explanation: "지우는 필통을 두고 와서 연필 한 자루를 빌렸습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-cls-2",
    category: "classroom",
    site: "korean",
    titleKo: "선생님께 문제 질문과 숙제 기한 확인",
    titleEn: "Asking the Teacher Questions & Homework Deadline",
    difficulty: 2,
    gradeScope: "K5",
    semester: 1,
    locationKo: "교실 교탁 앞",
    locationEn: "In front of teacher podium in classroom",
    turns: [
      { speaker: "A", speakerRole: "학생", text: "선생님, 교과서 52쪽 3번 문제 풀이 과정이 잘 이해되지 않아요.", translation: "Teacher, I do not quite understand the solution steps for problem 3 on page 52." },
      { speaker: "B", speakerRole: "선생님", text: "여기 괄호 안의 식을 먼저 계산한 뒤에 나눗셈을 적용해야 한단다.", translation: "You need to calculate the expression inside the parentheses first before applying division." },
      { speaker: "A", speakerRole: "학생", text: "아, 순서를 헷갈렸네요! 이번 단원 수학 숙제는 언제까지 제출인가요?", translation: "Ah, I confused the order! By when should we submit this unit math homework?" },
      { speaker: "B", speakerRole: "선생님", text: "금요일 1교시 시작 전까지 반장에게 제출하도록 하세요.", translation: "Please submit it to the class president before the first period on Friday." }
    ],
    keyExpressions: [
      { target: "이해되지 않다", meaning: "to not understand", explanation: "개념이나 설명이 납득되지 않을 때 정중하게 씁니다." },
      { target: "제출하다", meaning: "to submit / turn in", explanation: "과제나 서류를 낼 때 사용하는 표준 어휘입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-cls-2-q1",
        site: "korean",
        skillId: "dlg.ko.cls",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "수학 숙제 제출 기한은 언제인가요?",
        options: [
          { id: "a", text: "오늘 방과 후" },
          { id: "b", text: "내일 아침 조회 시간" },
          { id: "c", text: "금요일 1교시 시작 전" },
          { id: "d", text: "다음 주 월요일" }
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["선생님의 마지막 제출 안내를 확인하세요."],
        explanation: "선생님은 금요일 1교시 시작 전까지 제출하라고 지시했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-cls-3",
    category: "classroom",
    site: "korean",
    titleKo: "조별 과제 역할 분담과 모임 일정 조율",
    titleEn: "Group Project Role Division & Meeting Schedule",
    difficulty: 3,
    gradeScope: "K7",
    semester: 2,
    locationKo: "교실 뒤 모둠 테이블",
    locationEn: "Group study table in back of classroom",
    turns: [
      { speaker: "A", speakerRole: "조장", text: "우리 사회 탐구 조별 발표 주제를 환경 보호로 확정했으니 역할을 나누자.", translation: "Since we confirmed our social studies group presentation topic as environmental protection, let us divide roles." },
      { speaker: "B", speakerRole: "조원", text: "내가 재활용 사례 자료 조사를 맡을게. 발표 슬라이드는 누가 만들래?", translation: "I will handle research on recycling case studies. Who wants to make the presentation slides?" },
      { speaker: "A", speakerRole: "조장", text: "내가 슬라이드 디자인하고 발표 대본 정리할게. 내일 방과 후에 도서관에서 만나서 취합하자.", translation: "I will design the slides and organize the script. Let us meet in the library after school tomorrow to assemble." },
      { speaker: "B", speakerRole: "조원", text: "좋아. 4시 반까지 2층 디지털 자료실로 자료 정리해서 갈게.", translation: "Sounds good. I will organize materials and come to the 2nd floor media lab by 4:30." }
    ],
    keyExpressions: [
      { target: "역할을 나누다", meaning: "to divide roles", explanation: "협동 과제에서 업무 분담 시 씁니다." },
      { target: "자료를 취합하다", meaning: "to collect and assemble materials", explanation: "각자 조사한 내용을 하나로 모을 때 씁니다." }
    ],
    questions: [
      {
        id: "ko-dlg-cls-3-q1",
        site: "korean",
        skillId: "dlg.ko.cls",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "조장 A가 맡기로 한 역할은 무엇인가요?",
        options: [
          { id: "a", text: "재활용 사례 자료 조사" },
          { id: "b", text: "슬라이드 디자인과 발표 대본 정리" },
          { id: "c", text: "도서관 스터디룸 예약 및 간식 준비" },
          { id: "d", text: "발표 영상 촬영 및 편집" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["조장 A의 두 번째 발언을 확인하세요."],
        explanation: "조장 A는 슬라이드 디자인과 발표 대본 정리를 맡았습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 5. Amusement Park (놀이공원)
  {
    id: "ko-dlg-park-1",
    category: "amusement_park",
    site: "korean",
    titleKo: "매표소 자유이용권 예매와 할인 안내",
    titleEn: "Ticket Counter & All-Day Pass Discount",
    difficulty: 2,
    gradeScope: "K4",
    semester: 2,
    locationKo: "테마파크 정문 매표소",
    locationEn: "Theme park main gate ticket counter",
    turns: [
      { speaker: "A", speakerRole: "손님", text: "안녕하세요. 성인 종일 자유이용권 2장 주세요.", translation: "Hello. Two adult all-day passes please." },
      { speaker: "B", speakerRole: "매표원", text: "혹시 제휴 신용카드나 통신사 멤버십 할인 카드 있으신가요?", translation: "Do you happen to have a partnership credit card or telecom membership discount card?" },
      { speaker: "A", speakerRole: "손님", text: "네, 이 통신사 앱 바코드로 할인받을 수 있나요?", translation: "Yes, can I get a discount with this telecom app barcode?" },
      { speaker: "B", speakerRole: "매표원", text: "네, 본인 40%, 동반 1인 30% 할인 적용되어 총 74,000원입니다.", translation: "Yes, with 40% off for yourself and 30% for one guest, the total is 74,000 won." },
      { speaker: "A", speakerRole: "손님", text: "모바일 팔찌 티켓으로 바로 게이트 통과하면 되죠?", translation: "I can go straight through the gate with this mobile wristband ticket, right?" }
    ],
    keyExpressions: [
      { target: "자유이용권", meaning: "all-day ride pass", explanation: "놀이공원의 모든 놀이기구를 탈 수 있는 종합 이용권입니다." },
      { target: "제휴 할인", meaning: "partnership discount", explanation: "신용카드나 멤버십 혜택으로 요금을 깎아줄 때 씁니다." }
    ],
    questions: [
      {
        id: "ko-dlg-park-1-q1",
        site: "korean",
        skillId: "dlg.ko.park",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "손님이 할인을 받기 위해 제시한 것은 무엇인가요?",
        options: [
          { id: "a", text: "생일 축하 쿠폰" },
          { id: "b", text: "통신사 앱 바코드" },
          { id: "c", text: "헌혈 증서" },
          { id: "d", text: "놀이공원 연간 회원증" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["손님의 대사에서 통신사 앱 바코드를 확인하세요."],
        explanation: "손님은 통신사 멤버십 앱 바코드를 제시하여 할인을 적용받았습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-park-2",
    category: "amusement_park",
    site: "korean",
    titleKo: "인기 롤러코스터 대기 시간과 탑승 안전 수칙",
    titleEn: "Roller Coaster Wait Time & Boarding Safety Rules",
    difficulty: 3,
    gradeScope: "K5",
    semester: 1,
    locationKo: "롤러코스터 어트랙션 대기선",
    locationEn: "Roller coaster attraction queue line",
    turns: [
      { speaker: "A", speakerRole: "이용객", text: "안내원님, 지금 줄 서면 탑승까지 얼마나 걸리나요?", translation: "Staff, how long will it take to board if we queue now?" },
      { speaker: "B", speakerRole: "진행요원", text: "현재 일반 대기 시간은 약 50분입니다. 모바일 매직패스를 예약하셨나요?", translation: "Currently, the general wait time is about 50 minutes. Did you reserve a mobile Magic Pass?" },
      { speaker: "A", speakerRole: "이용객", text: "아니요, 그냥 기다릴게요. 가방은 메고 탈 수 있나요?", translation: "No, we will just wait in line. Can I wear my backpack on the ride?" },
      { speaker: "B", speakerRole: "진행요원", text: "안전을 위해 안경, 모자, 가방 등 소지품은 승강장 사물함에 보관하셔야 합니다.", translation: "For safety, loose items such as glasses, hats, and bags must be stored in the platform lockers." },
      { speaker: "A", speakerRole: "이용객", text: "알겠습니다. 키 제한 130cm 이상이면 아이도 탈 수 있죠?", translation: "Got it. As long as the height is over 130 cm, a child can ride, right?" }
    ],
    keyExpressions: [
      { target: "대기 시간", meaning: "wait time / queuing duration", explanation: "어트랙션 탑승까지 기다리는 시간입니다." },
      { target: "소지품 보관함", meaning: "locker for personal belongings", explanation: "탑승 중 떨어질 위험이 있는 소지품을 넣는 곳입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-park-2-q1",
        site: "korean",
        skillId: "dlg.ko.park",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "놀이기구 탑승 시 소지품에 대한 안전 수칙으로 올바른 것은?",
        options: [
          { id: "a", text: "가방은 가슴에 꼭 안고 탑승해야 한다." },
          { id: "b", text: "안경과 모자 등은 승강장 사물함에 보관해야 한다." },
          { id: "c", text: "주머니에 스마트폰을 넣고 타도 안전하다." },
          { id: "d", text: "음료수를 손에 들고 마시며 탑승한다." }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["진행요원의 안전 안내를 확인하세요."],
        explanation: "진행요원은 안전을 위해 안경, 모자, 가방을 사물함에 보관하도록 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-park-3",
    category: "amusement_park",
    site: "korean",
    titleKo: "테마파크 내부 편의시설과 식음료 위치 안내",
    titleEn: "Theme Park Amenities & Food Court Navigation",
    difficulty: 3,
    gradeScope: "K6",
    semester: 2,
    locationKo: "중앙 분수대 종합안내소",
    locationEn: "Central fountain guest information center",
    turns: [
      { speaker: "A", speakerRole: "관람객", text: "실례합니다. 가까운 식당가와 유모차 대여소가 어디에 있나요?", translation: "Excuse me. Where are the nearest food court and stroller rental center?" },
      { speaker: "B", speakerRole: "안내원", text: "회전목마를 지나 왼쪽 시계탑 쪽으로 가시면 패밀리 레스토랑이 모여 있습니다.", translation: "If you pass the carousel and head toward the left clock tower, family restaurants are grouped there." },
      { speaker: "A", speakerRole: "관람객", text: "유모차는 정문까지 다시 가야 빌릴 수 있나요?", translation: "Do we have to walk all the way back to the main gate to rent a stroller?" },
      { speaker: "B", speakerRole: "안내원", text: "아닙니다. 분수대 바로 뒤편 편의 서비스 센터에서도 즉시 대여 가능합니다.", translation: "No. You can rent one immediately at the guest service center right behind the fountain." }
    ],
    keyExpressions: [
      { target: "종합안내소", meaning: "guest information center", explanation: "시설물 위치, 미아 보호, 분실물 등을 담당하는 곳입니다." },
      { target: "대여소", meaning: "rental desk/center", explanation: "유모차, 휠체어 등을 빌려주는 장소입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-park-3-q1",
        site: "korean",
        skillId: "dlg.ko.park",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "관람객이 유모차를 즉시 대여할 수 있는 장소는 어디인가요?",
        options: [
          { id: "a", text: "정문 매표소 바깥" },
          { id: "b", text: "분수대 바로 뒤편 편의 서비스 센터" },
          { id: "c", text: "롤러코스터 승강장 출구" },
          { id: "d", text: "회전목마 기념품 가게 안" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["안내원의 마지막 답변을 확인하세요."],
        explanation: "안내원은 분수대 바로 뒤편 편의 서비스 센터에서 즉시 대여 가능하다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 6. Restaurant (식당·주문)
  {
    id: "ko-dlg-rest-1",
    category: "restaurant",
    site: "korean",
    titleKo: "한식 분식점에서 기본 메뉴 주문하기",
    titleEn: "Ordering Snacks at a Korean Diner",
    difficulty: 1,
    gradeScope: "K2",
    semester: 1,
    locationKo: "분식점 테이블",
    locationEn: "Korean snack diner table",
    turns: [
      { speaker: "A", speakerRole: "손님", text: "여기요, 주문할게요. 떡볶이 1인분하고 참치김밥 한 줄 주세요.", translation: "Over here please, we are ready to order. One serving of tteokbokki and one tuna kimbap please." },
      { speaker: "B", speakerRole: "직원", text: "떡볶이가 조금 매운데 보통 맛으로 해드릴까요?", translation: "The tteokbokki is a bit spicy, would you like the standard mild spice level?" },
      { speaker: "A", speakerRole: "손님", text: "네, 덜 맵게 해주세요. 시원한 물도 한 통 주시겠어요?", translation: "Yes, please make it less spicy. Could you also give us a bottle of cold water?" },
      { speaker: "B", speakerRole: "직원", text: "물과 단무지는 주방 앞 셀프 코너에서 편하게 가져다 드시면 됩니다.", translation: "Water and pickled radish are self-serve right in front of the kitchen." }
    ],
    keyExpressions: [
      { target: "1인분", meaning: "one serving / portion", explanation: "식당에서 음식 양을 주문할 때 쓰는 단위입니다." },
      { target: "셀프 코너", meaning: "self-service station", explanation: "물이나 추가 반찬을 직접 가져다 먹는 코너입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-rest-1-q1",
        site: "korean",
        skillId: "dlg.ko.rest",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "손님이 물과 단무지를 얻을 수 있는 방법은 무엇인가요?",
        options: [
          { id: "a", text: "직원이 직접 가져다줄 때까지 기다린다." },
          { id: "b", text: "주방 앞 셀프 코너에서 직접 가져온다." },
          { id: "c", text: "편의점에 가서 따로 사 와야 한다." },
          { id: "d", text: "식사를 마친 후 계산대에서 요청한다." }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["직원의 안내 중 '셀프 코너'를 확인하세요."],
        explanation: "직원은 물과 단무지를 셀프 코너에서 편하게 직접 가져다 먹으면 된다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-rest-2",
    category: "restaurant",
    site: "korean",
    titleKo: "대표 메뉴 추천과 추가 반찬 요청",
    titleEn: "Menu Recommendation & Extra Side Dishes",
    difficulty: 2,
    gradeScope: "K4",
    semester: 2,
    locationKo: "전통 한정식 식당",
    locationEn: "Traditional Korean restaurant table",
    turns: [
      { speaker: "A", speakerRole: "손님", text: "사장님, 저희가 한국 전통 음식이 처음인데 어떤 메뉴가 제일 맛있나요?", translation: "Owner, this is our first time with traditional Korean food, which menu is the best?" },
      { speaker: "B", speakerRole: "사장", text: "처음이시면 달콤 짭조름한 소불고기 전골 정식을 가장 추천합니다.", translation: "If it is your first time, I most recommend the sweet and savory beef bulgogi hot pot set." },
      { speaker: "A", speakerRole: "손님", text: "좋네요, 불고기 정식 2인분으로 주세요. 공깃밥도 포함인가요?", translation: "Sounds great, two servings of bulgogi set please. Does it include steamed rice?" },
      { speaker: "B", speakerRole: "사장", text: "네, 갓 지은 밥과 10가지 제철 나물 반찬, 된장찌개가 함께 나옵니다.", translation: "Yes, freshly cooked rice, 10 seasonal namul side dishes, and soybean paste stew come together." },
      { speaker: "A", speakerRole: "손님", text: "김치가 참 시원하고 맛있네요. 김치 좀 더 주실 수 있나요?", translation: "The kimchi is really refreshing and delicious. Could we get some more kimchi please?" },
      { speaker: "B", speakerRole: "사장", text: "얼마든지 더 드립니다. 맛있게 드세요!", translation: "As much as you like! Enjoy your meal!" }
    ],
    keyExpressions: [
      { target: "추천하다", meaning: "to recommend", explanation: "대표 메뉴나 베스트 메뉴를 제안할 때 씁니다." },
      { target: "공깃밥", meaning: "bowl of steamed rice", explanation: "식당에서 밥 한 그릇을 주문할 때 부르는 표준 표현입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-rest-2-q1",
        site: "korean",
        skillId: "dlg.ko.rest",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "식당 사장님이 손님에게 가장 추천한 메뉴는 무엇인가요?",
        options: [
          { id: "a", text: "매운 낙지볶음" },
          { id: "b", text: "소불고기 전골 정식" },
          { id: "c", text: "생선회 정식" },
          { id: "d", text: "냉면과 만두 세트" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["사장님의 첫 번째 추천 대사를 확인하세요."],
        explanation: "사장님은 처음 온 손님에게 달콤 짭조름한 소불고기 전골 정식을 추천했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-rest-3",
    category: "restaurant",
    site: "korean",
    titleKo: "식사 후 개별 분할 결제와 영수증 발급",
    titleEn: "Split Bill Payment & Receipt Issuance",
    difficulty: 3,
    gradeScope: "K6",
    semester: 1,
    locationKo: "이탈리안 레스토랑 계산대",
    locationEn: "Italian restaurant cash register counter",
    turns: [
      { speaker: "A", speakerRole: "손님", text: "저희 3번 테이블 식사 마쳤습니다. 각자 카드로 따로 계산할 수 있을까요?", translation: "We finished our meal at Table 3. Could we pay separately with our individual cards?" },
      { speaker: "B", speakerRole: "캐셔", text: "네, 가능합니다. 총 48,000원이니 두 분 각각 24,000원씩 결제해 드릴까요?", translation: "Yes, sure. The total is 48,000 won, so shall I charge 24,000 won to each of your two cards?" },
      { speaker: "A", speakerRole: "손님", text: "네, 정확히 반반 결제해 주세요. 여기 제 카드입니다.", translation: "Yes, please split it exactly half and half. Here is my card." },
      { speaker: "B", speakerRole: "캐셔", text: "결제 완료되었습니다. 각자 영수증 챙겨드릴까요?", translation: "Payments are complete. Shall I print separate receipts for each of you?" },
      { speaker: "A", speakerRole: "손님", text: "네, 종이 영수증 두 장 모두 출력해 주세요. 맛있게 잘 먹었습니다.", translation: "Yes, please print both paper receipts. Thank you for the delicious meal." }
    ],
    keyExpressions: [
      { target: "따로 계산하다", meaning: "to split the bill / pay separately", explanation: "일행끼리 각자 나눠 결제할 때 쓰는 자연스러운 한국어입니다." },
      { target: "반반 결제", meaning: "50-50 split payment", explanation: "금액을 균등하게 나눌 때 씁니다." }
    ],
    questions: [
      {
        id: "ko-dlg-rest-3-q1",
        site: "korean",
        skillId: "dlg.ko.rest",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "두 손님이 각자 카드로 결제한 금액은 얼마인가요?",
        options: [
          { id: "a", text: "12,000원" },
          { id: "b", text: "24,000원" },
          { id: "c", text: "48,000원" },
          { id: "d", text: "30,000원" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["총 48,000원을 둘이서 반반씩 결제했습니다."],
        explanation: "총 금액 48,000원을 반으로 나누어 각각 24,000원씩 결제했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 7. Wedding (결혼식·예절)
  {
    id: "ko-dlg-wed-1",
    category: "wedding",
    site: "korean",
    titleKo: "청첩장 전달과 결혼식 참석 약속",
    titleEn: "Handing Wedding Invitation & RSVP",
    difficulty: 3,
    gradeScope: "K6",
    semester: 2,
    locationKo: "회사 휴게실",
    locationEn: "Company break room",
    turns: [
      { speaker: "A", speakerRole: "동료(예비신랑)", text: "수진 씨, 다음 달 첫째 주 토요일에 제가 결혼을 하게 되었어요.", translation: "Sujin, I am getting married on the first Saturday of next month." },
      { speaker: "B", speakerRole: "동료(하객)", text: "와, 정말 축하드려요! 좋은 소식이네요. 예식장이 어디인가요?", translation: "Wow, congratulations! That is great news. Where is the wedding hall?" },
      { speaker: "A", speakerRole: "동료(예비신랑)", text: "강남역 근처 웨딩홀이에요. 여기 모바일 청첩장 링크와 종이 청첩장 전해드려요.", translation: "It is a wedding hall near Gangnam Station. Here are the mobile invitation link and paper invitation." },
      { speaker: "B", speakerRole: "동료(하객)", text: "꼭 참석해서 축하해 드릴게요. 시간 비워둘게요!", translation: "I will definitely attend to congratulate you. I will keep that time clear!" }
    ],
    keyExpressions: [
      { target: "결혼을 하게 되다", meaning: "to get married", explanation: "결혼 소식을 주변에 알릴 때 쓰는 표준 표현입니다." },
      { target: "청첩장", meaning: "wedding invitation card", explanation: "하객에게 예식 일시와 장소를 알리는 초대장입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-wed-1-q1",
        site: "korean",
        skillId: "dlg.ko.wed",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "예비 신랑 A가 동료 B에게 청첩장을 전하며 안내한 예식 일시는 언제인가요?",
        options: [
          { id: "a", text: "이번 주 일요일 저녁" },
          { id: "b", text: "다음 달 첫째 주 토요일" },
          { id: "c", text: "올해 크리스마스이브" },
          { id: "d", text: "다음 주 수요일 점심" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["A의 첫 번째 대사를 확인하세요."],
        explanation: "예비 신랑 A는 다음 달 첫째 주 토요일에 결혼식을 올린다고 알렸습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-wed-2",
    category: "wedding",
    site: "korean",
    titleKo: "예식장 축의금 전달과 식권 수령 예절",
    titleEn: "Congratulatory Gift Envelope & Meal Ticket Etiquette",
    difficulty: 4,
    gradeScope: "K8",
    semester: 1,
    locationKo: "웨딩홀 로비 축의금 접수대 앞",
    locationEn: "Front of wedding gift reception desk in lobby",
    turns: [
      { speaker: "A", speakerRole: "하객", text: "안녕하세요. 신랑 측 축의금 접수처가 이쪽이 맞나요?", translation: "Hello. Is this side the groom gift reception desk?" },
      { speaker: "B", speakerRole: "접수원", text: "네, 맞습니다. 방명록에 성함 적어주시고 봉투 건네주시면 됩니다.", translation: "Yes, that is correct. Please sign the guestbook and hand in the envelope." },
      { speaker: "A", speakerRole: "하객", text: "여기 축의금 봉투입니다. 뒷면에 제 이름과 소속 적어두었습니다.", translation: "Here is the gift envelope. I wrote my name and affiliation on the back." },
      { speaker: "B", speakerRole: "접수원", text: "감사합니다. 연회장에서 식사하실 수 있는 식권 챙겨드리겠습니다.", translation: "Thank you. Here is the banquet meal ticket for dining." },
      { speaker: "A", speakerRole: "하객", text: "신부 대기실은 어느 쪽으로 가면 되나요? 사진 촬영하고 싶어서요.", translation: "Which way is the bride waiting room? I would like to take a commemorative photo." },
      { speaker: "B", speakerRole: "접수원", text: "예식홀 문 오른편 복도를 따라가시면 바로 나옵니다.", translation: "Follow the hallway to the right of the main hall doors and you will find it right away." }
    ],
    keyExpressions: [
      { target: "축의금", meaning: "congratulatory money gift", explanation: "결혼식 등 경사에 축하의 뜻으로 내는 돈입니다." },
      { target: "방명록", meaning: "guestbook", explanation: "예식장을 방문한 하객이 이름을 남기는 책입니다." }
    ],
    questions: [
      {
        id: "ko-dlg-wed-2-q1",
        site: "korean",
        skillId: "dlg.ko.wed",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "한국 결혼식에서 축의금 봉투를 전달할 때 봉투 뒷면에 적어야 하는 정보는 무엇인가요?",
        options: [
          { id: "a", text: "본인의 혈액형과 취미" },
          { id: "b", text: "본인의 이름과 소속(직장 또는 관계)" },
          { id: "c", text: "선호하는 피로연 식사 메뉴" },
          { id: "d", text: "하객의 자택 도로명 주소" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["하객의 대사 중 봉투 뒷면에 적은 내용을 확인하세요."],
        explanation: "한국 결혼식에서는 축의금 접수자가 하객을 명확히 파악할 수 있도록 봉투 뒷면에 이름과 소속(관계)을 적는 것이 예의입니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-wed-3",
    category: "wedding",
    site: "korean",
    titleKo: "신랑·신부와 덕담 나누기 및 하객 인사",
    titleEn: "Warm Wishes to Newlyweds & Guest Greeting",
    difficulty: 5,
    gradeScope: "K10",
    semester: 2,
    locationKo: "예식홀 앞 포토존 및 로비",
    locationEn: "Photo zone and lobby in front of wedding hall",
    turns: [
      { speaker: "A", speakerRole: "하객", text: "오늘 두 분 모습이 정말 눈부시게 아름답습니다. 결혼 진심으로 축하드립니다.", translation: "Both of you look so dazzlingly beautiful today. Sincere congratulations on your wedding." },
      { speaker: "B", speakerRole: "신랑·신부", text: "바쁘신 주말에 귀한 시간 내어 참석해 주셔서 진심으로 감사드립니다.", translation: "Thank you so very much for taking valuable time on a busy weekend to attend." },
      { speaker: "A", speakerRole: "하객", text: "서로를 아끼고 존중하며 늘 웃음과 평화가 가득한 가정을 꾸리시길 기원합니다.", translation: "I wish you build a family filled with care, mutual respect, laughter and peace." },
      { speaker: "B", speakerRole: "신랑·신부", text: "따뜻한 덕담 마음에 새겨 행복하게 잘 살겠습니다. 피로연 식사 편안히 즐겨주세요.", translation: "We will engrave your warm words in our hearts and live happily. Please enjoy the reception banquet comfortably." }
    ],
    keyExpressions: [
      { target: "덕담", meaning: "words of blessing / well-wishing remarks", explanation: "상대방의 앞날이 잘되기를 바라는 따뜻한 격려의 말입니다." },
      { target: "가정을 꾸리다", meaning: "to start/build a family", explanation: "결혼하여 새로운 보금자리를 만드는 것을 뜻합니다." }
    ],
    questions: [
      {
        id: "ko-dlg-wed-3-q1",
        site: "korean",
        skillId: "dlg.ko.wed",
        type: "multiple_choice",
        difficulty: 5,
        prompt: "하객 A가 신랑·신부에게 전한 가장 적절한 덕담의 핵심은 무엇인가요?",
        options: [
          { id: "a", text: "시험에서 만점을 받으라는 당부" },
          { id: "b", text: "서로를 존중하며 웃음과 평화가 가득한 가정을 이루라는 기원" },
          { id: "c", text: "해외 장기 출장을 서두르라는 조언" },
          { id: "d", text: "신혼여행 경비를 절약하라는 권유" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["하객 A의 축하 덕담 내용을 확인하세요."],
        explanation: "하객 A는 서로 아끼고 존중하며 평화롭고 행복한 가정을 꾸리기를 기원했습니다.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "ko-dlg-hot-1",
    category: "hotel",
    site: "korean",
    titleKo: "호텔 체크인과 객실 카드키 수령",
    titleEn: "Hotel Check-in & Room Key Card",
    difficulty: 2,
    gradeScope: "K3",
    semester: 1,
    locationKo: "호텔 프런트 데스크",
    locationEn: "Hotel front desk",
    turns: [
      { speaker: "A", speakerRole: "프런트 직원", text: "어서 오세요. 체크인 도와드리겠습니다. 예약자분 성함이 어떻게 되시나요?", translation: "Welcome. I will assist you with check-in. What is the reservation name?" },
      { speaker: "B", speakerRole: "투숙객", text: "박민우로 예약했습니다. 여기 예약 확인서와 여권입니다.", translation: "I reserved under Minwoo Park. Here are my reservation confirmation and passport." },
      { speaker: "A", speakerRole: "프런트 직원", text: "확인되었습니다. 12층 1204호 디럭스 룸이며, 엘리베이터는 우측입니다. 조식은 2층에서 아침 7시부터 이용 가능합니다.", translation: "Confirmed. You are in Deluxe Room 1204 on the 12th floor, and elevators are to the right. Breakfast is available on the 2nd floor from 7 AM." },
      { speaker: "B", speakerRole: "투숙객", text: "체크아웃 시간은 언제인가요? 짐을 체크아웃 후에 맡길 수 있나요?", translation: "When is checkout time? Can we leave our luggage after checkout?" },
      { speaker: "A", speakerRole: "프런트 직원", text: "체크아웃은 오전 11시이며, 컨시어지 데스크에 무료로 짐을 맡기실 수 있습니다.", translation: "Checkout is at 11 AM, and you can store your bags at the concierge desk free of charge." },
    ],
    keyExpressions: [
      { target: "체크인", meaning: "hotel check-in", explanation: "호텔에 도착해 입실 수속을 밟는 절차입니다." },
      { target: "짐을 맡기다", meaning: "to store luggage", explanation: "체크인 전이나 체크아웃 후 짐을 프런트에 보관할 때 씁니다." },
    ],
    questions: [
      {
        id: "ko-dlg-hot-1-q1",
        site: "korean",
        skillId: "dlg.ko.hot",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "호텔 체크아웃 시간은 몇 시인가요?",
        options: [
          { id: "a", text: "오전 9시" },
          { id: "b", text: "오전 11시" },
          { id: "c", text: "오후 1시" },
          { id: "d", text: "오후 3시" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["직원의 마지막 답변을 확인하세요."],
        explanation: "직원은 체크아웃 시간이 오전 11시라고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-hot-2",
    category: "hotel",
    site: "korean",
    titleKo: "객실 편의용품 추가 요청과 레이트 체크아웃",
    titleEn: "Requesting Extra Amenities & Late Checkout",
    difficulty: 3,
    gradeScope: "K5",
    semester: 2,
    locationKo: "객실 전화 통화",
    locationEn: "In-room telephone call",
    turns: [
      { speaker: "A", speakerRole: "투숙객", text: "여보세요, 프런트인가요? 1204호인데 수건 2장과 생수 2병만 더 가져다주실 수 있나요?", translation: "Hello, is this the front desk? I am in room 1204. Could you bring two extra towels and two bottles of water?" },
      { speaker: "B", speakerRole: "프런트 직원", text: "네, 룸서비스 직원을 통해 바로 올려보내 드리겠습니다. 다른 필요하신 점 있으신가요?", translation: "Yes, I will send them up immediately via room service. Is there anything else you need?" },
      { speaker: "A", speakerRole: "투숙객", text: "혹시 내일 체크아웃을 오후 1시로 연장할 수 있을까요?", translation: "Could we possibly extend checkout tomorrow until 1 PM?" },
      { speaker: "B", speakerRole: "프런트 직원", text: "내일 객실 사정에 여유가 있어 오후 1시까지 무료 레이트 체크아웃 적용해 드리겠습니다.", translation: "We have availability tomorrow, so we will apply complimentary late checkout until 1 PM." },
    ],
    keyExpressions: [
      { target: "편의용품 (어메니티)", meaning: "amenities", explanation: "호텔 객실 내에 비치된 수건, 칫솔, 샴푸 등의 소모품입니다." },
      { target: "레이트 체크아웃", meaning: "late checkout", explanation: "정규 퇴실 시간보다 늦게 퇴실하는 서비스입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-hot-2-q1",
        site: "korean",
        skillId: "dlg.ko.hot",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "투숙객이 요청하여 직원이 승인한 레이트 체크아웃 시간은 언제인가요?",
        options: [
          { id: "a", text: "낮 12시 정오" },
          { id: "b", text: "오후 1시" },
          { id: "c", text: "오후 3시" },
          { id: "d", text: "오후 6시" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["프런트 직원의 마지막 승인 대화를 확인하세요."],
        explanation: "직원은 오후 1시까지 무료 레이트 체크아웃을 적용해 드리겠다고 확답했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-hot-3",
    category: "hotel",
    site: "korean",
    titleKo: "미니바 정산과 공항 셔틀버스 예약",
    titleEn: "Mini-bar Settlement & Airport Shuttle Booking",
    difficulty: 4,
    gradeScope: "K7",
    semester: 1,
    locationKo: "호텔 프런트 데스크",
    locationEn: "Hotel front desk",
    turns: [
      { speaker: "A", speakerRole: "투숙객", text: "안녕하세요, 체크아웃 부탁드립니다. 805호입니다.", translation: "Hello, I would like to check out, please. Room 805." },
      { speaker: "B", speakerRole: "프런트 직원", text: "객실 카드키 확인했습니다. 냉장고 미니바에서 이용하신 음료나 스낵이 있으신가요?", translation: "Key card received. Did you use any drinks or snacks from the mini-bar?" },
      { speaker: "A", speakerRole: "투숙객", text: "탄산수 한 병 마셨습니다. 이 카드와 함께 정산해 주세요. 그리고 인천공항행 셔틀버스를 탈 수 있나요?", translation: "I had one sparkling water. Please charge it to this card. Also, can I take the Incheon Airport shuttle bus?" },
      { speaker: "B", speakerRole: "프런트 직원", text: "미니바 음료 3,000원 결제 완료되었습니다. 공항 셔틀은 30분 뒤인 정각에 로비 정문에서 출발합니다.", translation: "Mini-bar beverage charged at 3,000 KRW. The airport shuttle departs from the lobby front door on the hour in 30 minutes." },
    ],
    keyExpressions: [
      { target: "미니바 정산", meaning: "mini-bar settlement", explanation: "객실 냉장고 유료 식음료 사용 내역을 체크아웃 때 지불하는 것입니다." },
      { target: "공항 셔틀버스", meaning: "airport shuttle bus", explanation: "호텔과 공항 사이를 정기 운행하는 리무진 버스입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-hot-3-q1",
        site: "korean",
        skillId: "dlg.ko.hot",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "인천공항행 호텔 셔틀버스는 언제 출발하나요?",
        options: [
          { id: "a", text: "즉시 바로 출발" },
          { id: "b", text: "30분 뒤 정각에 정문 출발" },
          { id: "c", text: "오후 5시에 1대만 운행" },
          { id: "d", text: "내일 아침 첫차 출발" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["직원의 마지막 셔틀버스 출발 안내를 확인하세요."],
        explanation: "직원은 공항 셔틀이 30분 뒤 정각에 로비 정문에서 출발한다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-tr-1",
    category: "transport",
    site: "korean",
    titleKo: "지하철 교통카드 충전과 출구 찾기",
    titleEn: "Recharging Transit Card & Finding Subway Exit",
    difficulty: 1,
    gradeScope: "K2",
    semester: 1,
    locationKo: "지하철역 개찰구 앞",
    locationEn: "In front of subway turnstiles",
    turns: [
      { speaker: "A", speakerRole: "승객", text: "실례합니다, 교통카드를 충전하고 싶은데 기계가 어디에 있나요?", translation: "Excuse me, I want to recharge my transit card. Where is the machine?" },
      { speaker: "B", speakerRole: "역무원", text: "개찰구 바로 왼쪽에 1회용 발매기 겸 교통카드 충전기가 있습니다.", translation: "There is a ticket vending and card recharge machine right to the left of the turnstiles." },
      { speaker: "A", speakerRole: "승객", text: "감사합니다! 시청 광장으로 나가려면 몇 번 출구로 가야 하나요?", translation: "Thank you! Which exit should I take to go to City Hall Plaza?" },
      { speaker: "B", speakerRole: "역무원", text: "5번 출구로 나가시면 광장 바로 앞으로 연결됩니다.", translation: "If you go out through Exit 5, it leads directly to the plaza front." },
    ],
    keyExpressions: [
      { target: "교통카드 충전", meaning: "recharging transit card", explanation: "지하철과 버스에서 쓰는 카드의 잔액을 충전하는 것입니다." },
      { target: "몇 번 출구", meaning: "which exit number", explanation: "목적지와 가장 가까운 출구 번호를 물어볼 때 사용합니다." },
    ],
    questions: [
      {
        id: "ko-dlg-tr-1-q1",
        site: "korean",
        skillId: "dlg.ko.tr",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "시청 광장으로 가려면 몇 번 출구로 나가야 하나요?",
        options: [
          { id: "a", text: "1번 출구" },
          { id: "b", text: "3번 출구" },
          { id: "c", text: "5번 출구" },
          { id: "d", text: "8번 출구" },
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["역무원의 마지막 안내를 확인하세요."],
        explanation: "역무원은 5번 출구로 나가면 광장 바로 앞으로 연결된다고 설명했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-tr-2",
    category: "transport",
    site: "korean",
    titleKo: "택시 탑승과 목적지 및 결제 안내",
    titleEn: "Taking a Taxi, Giving Directions & Payment",
    difficulty: 2,
    gradeScope: "K4",
    semester: 1,
    locationKo: "택시 안",
    locationEn: "Inside a taxi",
    turns: [
      { speaker: "A", speakerRole: "승객", text: "기사님, 안녕하세요. 강남역 11번 출구 쪽으로 가주세요.", translation: "Hello driver. Please take me toward Gangnam Station Exit 11." },
      { speaker: "B", speakerRole: "택시 기사", text: "네, 출발합니다. 올림픽대로가 조금 막히는데 한남대교 쪽으로 돌아갈까요?", translation: "Yes, departing. Olympic highway is a bit congested; shall we detour via Hannam Bridge?" },
      { speaker: "A", speakerRole: "승객", text: "네, 가장 빠른 길로 부탁드립니다.", translation: "Yes, please take the fastest route." },
      { speaker: "B", speakerRole: "택시 기사", text: "도착했습니다. 요금은 13,500원입니다.", translation: "We have arrived. The fare is 13,500 KRW." },
      { speaker: "A", speakerRole: "승객", text: "신용카드로 결제하고 영수증도 한 장 출력해 주세요.", translation: "I will pay with credit card, and please print a receipt as well." },
    ],
    keyExpressions: [
      { target: "~(으)로 가주세요", meaning: "please take me to ~", explanation: "택시에서 기사님께 목적지를 말하는 정중한 표현입니다." },
      { target: "영수증 출력", meaning: "printing receipt", explanation: "경비 처리나 분실물 확인을 위해 영수증을 요청할 때 씁니다." },
    ],
    questions: [
      {
        id: "ko-dlg-tr-2-q1",
        site: "korean",
        skillId: "dlg.ko.tr",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "승객이 택시에서 요청한 결제 방식과 추가 서류는 무엇인가요?",
        options: [
          { id: "a", text: "현금 결제와 거스름돈" },
          { id: "b", text: "신용카드 결제와 영수증" },
          { id: "c", text: "모바일 간편결제와 쿠폰" },
          { id: "d", text: "교통카드와 승차권" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["승객의 마지막 대사를 확인하세요."],
        explanation: "승객은 신용카드로 결제하겠다고 밝히고 영수증 출력을 요청했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-tr-3",
    category: "transport",
    site: "korean",
    titleKo: "고속철도 KTX 환승과 열차표 변경",
    titleEn: "KTX High-Speed Rail Transfer & Ticket Modification",
    difficulty: 3,
    gradeScope: "K6",
    semester: 2,
    locationKo: "기차역 고객만족센터 매표창구",
    locationEn: "Train station customer service ticket counter",
    turns: [
      { speaker: "A", speakerRole: "승객", text: "안녕하세요, 오후 3시 부산행 KTX 205호 표를 예매했는데, 1시간 빠른 열차로 변경할 수 있나요?", translation: "Hello, I booked a ticket for KTX 205 to Busan at 3 PM. Can I change it to a train one hour earlier?" },
      { speaker: "B", speakerRole: "역무원", text: "오후 2시 10분 KTX 201호 일반실에 취소된 창측 좌석이 한 자리 있습니다.", translation: "There is one cancelled window seat in standard class on KTX 201 at 2:10 PM." },
      { speaker: "A", speakerRole: "승객", text: "네, 그 좌석으로 변경해 주세요. 수수료가 발생하나요?", translation: "Yes, please switch to that seat. Is there a change fee?" },
      { speaker: "B", speakerRole: "역무원", text: "출발 3시간 전이라 수수료 없이 무료로 변경해 드렸습니다. 4번 승강장으로 이동하세요.", translation: "Since it is more than 3 hours before departure, we changed it free of charge. Please proceed to Platform 4." },
    ],
    keyExpressions: [
      { target: "열차표 변경", meaning: "train ticket modification", explanation: "예매한 기차 시간을 앞당기거나 늦추는 절차입니다." },
      { target: "창측 좌석", meaning: "window seat", explanation: "창문 쪽 좌석으로, 통로 쪽(통로측)과 대비됩니다." },
    ],
    questions: [
      {
        id: "ko-dlg-tr-3-q1",
        site: "korean",
        skillId: "dlg.ko.tr",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "승객이 열차표를 변경할 때 수수료가 면제된 이유는 무엇인가요?",
        options: [
          { id: "a", text: "역무원의 친척이었기 때문" },
          { id: "b", text: "출발 3시간 전이라 무료 규정이 적용되었기 때문" },
          { id: "c", text: "열차가 연착되었기 때문" },
          { id: "d", text: "특실로 업그레이드했기 때문" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["역무원의 수수료 면제 사유 설명을 확인하세요."],
        explanation: "역무원은 출발 3시간 전 변경이라 규정에 따라 수수료 없이 무료로 변경해 드렸다고 설명했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-bnk-1",
    category: "bank",
    site: "korean",
    titleKo: "은행 창구 외화 환전과 환율 우대",
    titleEn: "Currency Exchange & Preferred Exchange Rate",
    difficulty: 2,
    gradeScope: "K3",
    semester: 2,
    locationKo: "은행 외환 창구",
    locationEn: "Bank foreign exchange counter",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "안녕하세요, 미국 달러 500달러를 한국 원화로 환전하고 싶습니다.", translation: "Hello, I would like to exchange 500 US dollars into Korean won." },
      { speaker: "B", speakerRole: "은행원", text: "네, 신분증이나 여권 제시해 주시겠습니까? 오늘 매입 환율은 1달러당 1,350원입니다.", translation: "Yes, could you present your ID or passport? Today's buying exchange rate is 1,350 KRW per dollar." },
      { speaker: "A", speakerRole: "고객", text: "여기 여권입니다. 은행 모바일 앱에 80% 환율 우대 쿠폰이 있는데 적용 가능한가요?", translation: "Here is my passport. I have an 80% preferred exchange rate coupon in the mobile app; can it be applied?" },
      { speaker: "B", speakerRole: "은행원", text: "네, 우대 쿠폰 적용되어 수수료가 감면되었습니다. 원화 67만 5천 원과 영수증입니다.", translation: "Yes, preferred coupon applied, reducing fees. Here is 675,000 KRW and your receipt." },
    ],
    keyExpressions: [
      { target: "외화 환전", meaning: "currency exchange", explanation: "외국 통화를 자국 통화로 바꾸는 금융 거래입니다." },
      { target: "환율 우대", meaning: "preferential exchange rate / fee discount", explanation: "환전 수수료를 할인해 주는 혜택입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-bnk-1-q1",
        site: "korean",
        skillId: "dlg.ko.bnk",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "환전 시 고객이 수수료 감면을 받기 위해 제시한 것은 무엇인가요?",
        options: [
          { id: "a", text: "학생증" },
          { id: "b", text: "모바일 앱 80% 환율 우대 쿠폰" },
          { id: "c", text: "신용카드 포인트" },
          { id: "d", text: "항공 마일리지 바우처" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["고객이 환율 수수료 할인을 위해 언급한 것을 확인하세요."],
        explanation: "고객은 모바일 앱의 80% 환율 우대 쿠폰을 제시하여 수수료 감면을 받았습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-bnk-2",
    category: "bank",
    site: "korean",
    titleKo: "외국인등록증으로 입출금 통장과 체크카드 개설",
    titleEn: "Opening Checking Account & Debit Card with Alien Card",
    difficulty: 3,
    gradeScope: "K5",
    semester: 1,
    locationKo: "은행 예금 창구",
    locationEn: "Bank deposit & accounts counter",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "안녕하세요, 월급을 수령하고 일상 결제를 할 입출금 통장과 체크카드를 만들러 왔습니다.", translation: "Hello, I am here to open a checking account and debit card to receive my salary and make daily payments." },
      { speaker: "B", speakerRole: "은행원", text: "외국인 고객님의 경우 유효한 외국인등록증과 재직증명서(또는 근로계약서)가 필요합니다.", translation: "For international customers, a valid Alien Registration Card and employment certificate (or contract) are required." },
      { speaker: "A", speakerRole: "고객", text: "여기 외국인등록증과 회사 재직증명서 원본입니다.", translation: "Here is my Alien Registration Card and the original employment certificate from my company." },
      { speaker: "B", speakerRole: "은행원", text: "서류가 완비되었습니다. 전자금융 모바일 뱅킹 신청서와 체크카드 약관에 서명해 주세요.", translation: "Documents are complete. Please sign the mobile banking application and debit card terms." },
    ],
    keyExpressions: [
      { target: "입출금 통장", meaning: "checking/deposit account", explanation: "자유롭게 돈을 넣고 뺄 수 있는 기본 보통예금 계좌입니다." },
      { target: "체크카드", meaning: "debit card", explanation: "계좌 잔액 범위 내에서 즉시 결제되는 카드입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-bnk-2-q1",
        site: "korean",
        skillId: "dlg.ko.bnk",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "외국인 고객이 통장 개설을 위해 창구에 제출한 서류는 무엇인가요?",
        options: [
          { id: "a", text: "운전면허증과 주민등록등본" },
          { id: "b", text: "외국인등록증과 재직증명서 원본" },
          { id: "c", text: "대학교 졸업증명서" },
          { id: "d", text: "비행기 왕복 탑승권" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["은행원이 요구하고 고객이 제출한 서류를 확인하세요."],
        explanation: "고객은 계좌 개설 목적 증빙을 위해 외국인등록증과 회사 재직증명서를 제출했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-bnk-3",
    category: "bank",
    site: "korean",
    titleKo: "해외 송금 신청과 SWIFT 코드 확인",
    titleEn: "International Wire Transfer & SWIFT Code Verification",
    difficulty: 4,
    gradeScope: "K7",
    semester: 2,
    locationKo: "은행 외환 창구",
    locationEn: "Bank foreign exchange counter",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "모국의 가족에게 생활비를 해외 송금하려고 합니다. 어떤 정보가 필요한가요?", translation: "I would like to wire living expenses abroad to my family. What information is needed?" },
      { speaker: "B", speakerRole: "은행원", text: "수취인의 영문 성명, 수취 은행명, 은행의 SWIFT 코드(식별코드), 계좌번호(IBAN)가 필요합니다.", translation: "You need the recipient's English name, bank name, bank's SWIFT code, and account number (IBAN)." },
      { speaker: "A", speakerRole: "고객", text: "여기 메모지에 적어왔습니다. 송금액은 2,000달러 상당입니다.", translation: "I have written them down on this note. The transfer amount is equivalent to 2,000 USD." },
      { speaker: "B", speakerRole: "은행원", text: "SWIFT 코드 전산 조회가 일치합니다. 전신료와 중개수수료 확인 후 송금 처리 완료되었습니다.", translation: "SWIFT code lookup matched. After confirming cable and intermediary fees, the transfer is complete." },
    ],
    keyExpressions: [
      { target: "해외 송금", meaning: "international wire transfer", explanation: "국내 계좌에서 해외 금융기관으로 자금을 송금하는 것입니다." },
      { target: "SWIFT 코드", meaning: "SWIFT / BIC code", explanation: "국제 은행 간 송금 시 전 세계 금융기관을 식별하는 고유 코드입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-bnk-3-q1",
        site: "korean",
        skillId: "dlg.ko.bnk",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "해외 송금 시 해외 수취 은행을 식별하기 위해 필수적으로 확인하는 고유 코드는 무엇인가요?",
        options: [
          { id: "a", text: "우편번호 (Zip Code)" },
          { id: "b", text: "SWIFT 코드 (Bank Identifier Code)" },
          { id: "c", text: "비행기 편명 (Flight Code)" },
          { id: "d", text: "여권 번호 (Passport Number)" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["은행 간 국제 거래에서 쓰는 고유 식별코드를 확인하세요."],
        explanation: "해외 송금 시 수취 은행을 정확히 지정하기 위해 SWIFT 코드가 필수적입니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-post-1",
    category: "post_office",
    site: "korean",
    titleKo: "우체국 우표 구매와 등기 우편 접수",
    titleEn: "Buying Stamps & Domestic Registered Mail",
    difficulty: 1,
    gradeScope: "K2",
    semester: 2,
    locationKo: "우체국 우편 창구",
    locationEn: "Post office mail counter",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "안녕하세요, 이 편지를 서울 종로구로 등기 우편으로 부치고 싶습니다.", translation: "Hello, I would like to send this letter to Jongno-gu, Seoul by registered mail." },
      { speaker: "B", speakerRole: "우체국 직원", text: "저울 위에 편지 봉투를 올려주세요. 규격 봉투 25그램으로 일반등기 요금은 2,680원입니다.", translation: "Please place the envelope on the scale. Standard envelope 25g, regular registered mail fee is 2,680 KRW." },
      { speaker: "A", speakerRole: "고객", text: "배송 기간은 며칠 정도 걸리나요?", translation: "How many days will delivery take?" },
      { speaker: "B", speakerRole: "우체국 직원", text: "영업일 기준 이틀 뒤 배달되며, 영수증의 등기번호로 배송 조회가 가능합니다.", translation: "It will be delivered in two business days, and you can track delivery with the tracking number on the receipt." },
    ],
    keyExpressions: [
      { target: "등기 우편", meaning: "registered mail", explanation: "배달 과정을 기록하여 분실 위험 없이 안전하게 전달하는 우편 방식입니다." },
      { target: "배송 조회", meaning: "delivery tracking", explanation: "운송장(등기) 번호로 물품의 이동 상황을 추적하는 서비스입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-post-1-q1",
        site: "korean",
        skillId: "dlg.ko.post",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "등기 우편의 배송 상황을 추적하기 위해 필요한 것은 무엇인가요?",
        options: [
          { id: "a", text: "신용카드 번호" },
          { id: "b", text: "영수증에 적힌 등기번호" },
          { id: "c", text: "집주인의 서명" },
          { id: "d", text: "우표의 그림" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["우체국 직원의 마지막 안내를 확인하세요."],
        explanation: "우체국 직원은 영수증에 인쇄된 등기번호로 배송 조회가 가능하다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-post-2",
    category: "post_office",
    site: "korean",
    titleKo: "택배 상자 포장과 완충재 사용",
    titleEn: "Packing Parcel Box & Counter Weighing",
    difficulty: 2,
    gradeScope: "K4",
    semester: 2,
    locationKo: "우체국 자율 포장대",
    locationEn: "Post office self-packing station",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "직원분, 머그컵 세트를 지방으로 보내려는데 몇 호 상자가 적당할까요?", translation: "Excuse me, I want to send a mug set to another province; which size box would be appropriate?" },
      { speaker: "B", speakerRole: "우체국 직원", text: "2호 상자가 적당하며, 도자기 제품이니 에어캡(뾱뾱이) 완충재를 꼼꼼히 감싸주셔야 파손을 막을 수 있습니다.", translation: "Box size 2 is suitable, and since it is ceramic, please wrap it securely with bubble wrap cushioning to prevent breakage." },
      { speaker: "A", speakerRole: "고객", text: "포장대에 있는 테이프와 완충재를 무료로 사용해도 되나요?", translation: "May I use the tape and cushioning on the self-packing counter free of charge?" },
      { speaker: "B", speakerRole: "우체국 직원", text: "네, 포장 완료 후 상자에 '파손주의' 스티커를 붙이고 접수 창구로 가져오시면 됩니다.", translation: "Yes, once packed, attach a 'Fragile / Handle with Care' sticker and bring it to the counter." },
    ],
    keyExpressions: [
      { target: "완충재 (에어캡)", meaning: "cushioning material / bubble wrap", explanation: "깨지기 쉬운 물건이 충격을 받지 않도록 보호하는 포장재입니다." },
      { target: "파손주의 스티커", meaning: "fragile sticker", explanation: "운송 중 주의해서 취급하도록 부착하는 경고 표시입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-post-2-q1",
        site: "korean",
        skillId: "dlg.ko.post",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "도자기 머그컵 포장 후 상자에 붙여야 하는 스티커는 무엇인가요?",
        options: [
          { id: "a", text: "반품 요청 스티커" },
          { id: "b", text: "파손주의 스티커" },
          { id: "c", text: "할인 쿠폰 스티커" },
          { id: "d", text: "개봉 금지 스티커" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["직원의 마지막 포장 안내를 확인하세요."],
        explanation: "직원은 도자기 제품의 안전한 배송을 위해 '파손주의' 스티커를 부착하라고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-post-3",
    category: "post_office",
    site: "korean",
    titleKo: "국제특송 EMS 세관 신고서 작성과 발송",
    titleEn: "International Express EMS Customs Declaration",
    difficulty: 3,
    gradeScope: "K6",
    semester: 2,
    locationKo: "우체국 국제우편 창구",
    locationEn: "Post office international mail counter",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "해외에 있는 친구에게 의류와 한국 과자를 국제특송(EMS)으로 보내고 싶습니다.", translation: "I want to send clothes and Korean snacks to a friend abroad via international express EMS." },
      { speaker: "B", speakerRole: "우체국 직원", text: "국제우편물은 모바일이나 창구에서 세관 신고서(기표지)를 영문으로 작성하셔야 합니다.", translation: "For international shipments, you must fill out the customs declaration in English either on mobile or at the counter." },
      { speaker: "A", speakerRole: "고객", text: "품목에 'Clothes'와 'Snacks'로 적고 예상 가격을 적으면 되나요?", translation: "Should I write 'Clothes' and 'Snacks' under items along with the estimated value?" },
      { speaker: "B", speakerRole: "우체국 직원", text: "네, 맞습니다. 배터리나 가연성 스프레이 같은 항공 금지 품목은 포함되지 않았는지 최종 확인해 주세요.", translation: "Yes, correct. Please verify that prohibited air transport items such as batteries or flammable sprays are not included." },
    ],
    keyExpressions: [
      { target: "국제특송 (EMS)", meaning: "Express Mail Service (EMS)", explanation: "전 세계 우정당국 간 협력으로 가장 빠르고 안전하게 배송하는 국제 우편입니다." },
      { target: "세관 신고서", meaning: "customs declaration form", explanation: "국경을 넘는 물품의 내용물과 가격을 기재하여 통관을 진행하는 서류입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-post-3-q1",
        site: "korean",
        skillId: "dlg.ko.post",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "국제우편 EMS 발송 시 상자에 절대 포함되어서는 안 되는 항공 금지 품목의 예는 무엇인가요?",
        options: [
          { id: "a", text: "일반 티셔츠" },
          { id: "b", text: "배터리나 가연성 스프레이" },
          { id: "c", text: "영어 소설책" },
          { id: "d", text: "한국 전통 과자" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["직원의 마지막 항공 안전 주의사항을 확인하세요."],
        explanation: "항공 운송 규정상 배터리, 가연성 스프레이 등은 폭발 및 화재 위험으로 금지 품목에 해당합니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-hsg-1",
    category: "housing",
    site: "korean",
    titleKo: "부동산 중개업소 원룸 월세 문의",
    titleEn: "Real Estate Studio Rental Inquiry & Terms",
    difficulty: 3,
    gradeScope: "K5",
    semester: 1,
    locationKo: "공인중개사 사무소",
    locationEn: "Real estate agency office",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "안녕하세요, 대학교 인근에 보증금 500만 원에 월세 50만 원 선에서 원룸을 찾고 있습니다.", translation: "Hello, I am looking for a studio apartment near the university with 5 million won deposit and around 500,000 won monthly rent." },
      { speaker: "B", speakerRole: "공인중개사", text: "역에서 도보 5분 거리에 풀옵션 원룸이 하나 있습니다. 세탁기, 냉장고, 에어컨이 모두 구비되어 있습니다.", translation: "There is a fully furnished studio 5 minutes walk from the station. Washer, fridge, and AC are all equipped." },
      { speaker: "A", speakerRole: "고객", text: "월 관리비는 얼마이고 관리비에 인터넷과 수도 요금이 포함되나요?", translation: "How much is monthly maintenance, and does it include internet and water bills?" },
      { speaker: "B", speakerRole: "공인중개사", text: "관리비는 월 7만 원이며 인터넷과 수도세가 포함되고 전기와 난방 가스비만 개별 고지됩니다.", translation: "Maintenance is 70,000 won/month including internet and water; only electricity and heating gas are billed individually." },
    ],
    keyExpressions: [
      { target: "보증금과 월세", meaning: "deposit & monthly rent", explanation: "한국의 주거 임대차 계약에서 계약 시 맡기는 보증금과 매월 내는 차임입니다." },
      { target: "풀옵션", meaning: "fully furnished", explanation: "기본 가전(냉장고, 세탁기, 에어컨 등)이 갖추어진 주거 형태입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-hsg-1-q1",
        site: "korean",
        skillId: "dlg.ko.hsg",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "중개사가 소개한 원룸의 월 관리비에 기본 포함되어 있는 항목은 무엇인가요?",
        options: [
          { id: "a", text: "전기세와 가스비" },
          { id: "b", text: "인터넷과 수도 요금" },
          { id: "c", text: "매일 청소 서비스" },
          { id: "d", text: "조식 식사 제공" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["공인중개사의 마지막 관리비 포함 항목 설명을 확인하세요."],
        explanation: "관리비 7만 원에는 인터넷과 수도 요금이 포함되며, 전기와 가스는 별도 납부합니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-hsg-2",
    category: "housing",
    site: "korean",
    titleKo: "보일러 온수 고장과 집주인 수리 요청",
    titleEn: "Boiler Heating Malfunction & Landlord Repair Request",
    difficulty: 4,
    gradeScope: "K7",
    semester: 2,
    locationKo: "전화 통화",
    locationEn: "Telephone conversation",
    turns: [
      { speaker: "A", speakerRole: "세입자", text: "집주인님 안녕하세요, 302호 세입자입니다. 어제 저녁부터 보일러에 오류 코드가 뜨면서 온수가 전혀 나오지 않아서 연락드렸습니다.", translation: "Hello landlord, this is the tenant in Room 302. I am calling because an error code showed on the boiler since yesterday and no hot water comes out." },
      { speaker: "B", speakerRole: "집주인", text: "날씨가 추운데 온수가 안 나와서 고생하셨겠네요. 전원 플러그를 뺐다가 다시 꽂아보셨나요?", translation: "It is cold, you must have had a hard time without hot water. Did you try unplugging and reconnecting the power cord?" },
      { speaker: "A", speakerRole: "세입자", text: "네, 재부팅을 해봤는데도 점화 불량이 계속 깜빡입니다.", translation: "Yes, I tried rebooting, but the ignition failure light keeps blinking." },
      { speaker: "B", speakerRole: "집주인", text: "보일러 서비스 센터에 AS 기사님을 예약해 드릴 테니 수리비는 걱정 마세요. 임대인인 제가 전액 부담하겠습니다.", translation: "I will schedule a service technician from the boiler center, so do not worry about repair costs. As landlord, I will cover the full expense." },
    ],
    keyExpressions: [
      { target: "온수가 안 나오다", meaning: "no hot water comes out", explanation: "난방 또는 급탕 설비 고장 시 핵심 증상 설명입니다." },
      { target: "수리비를 부담하다", meaning: "to cover repair costs", explanation: "임대차 시설물 하자 시 임대인이 비용을 낼 때 씁니다." },
    ],
    questions: [
      {
        id: "ko-dlg-hsg-2-q1",
        site: "korean",
        skillId: "dlg.ko.hsg",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "보일러 고장 수리비는 누가 부담하기로 합의되었나요?",
        options: [
          { id: "a", text: "세입자가 전액 현금 납부" },
          { id: "b", text: "집주인이 전액 부담" },
          { id: "c", text: "관리실과 세입자가 반반 분담" },
          { id: "d", text: "부동산 중개업소가 부담" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["집주인의 마지막 답변을 확인하세요."],
        explanation: "집주인은 임대인의 기본 시설물 유지 의무에 따라 수리비를 전액 부담하겠다고 확약했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-hsg-3",
    category: "housing",
    site: "korean",
    titleKo: "전세계약 만료와 보증금 반환 합의",
    titleEn: "Lease Expiration & Deposit Refund Agreement",
    difficulty: 5,
    gradeScope: "K9",
    semester: 1,
    locationKo: "임대인 자택 대면 상담",
    locationEn: "In-person meeting at landlord home",
    turns: [
      { speaker: "A", speakerRole: "임차인", text: "임대인님, 계약 만료 3개월 전이라 미리 말씀드립니다. 회사 이직으로 인하여 이번 만기일에 맞추어 이사를 나가고자 합니다.", translation: "Landlord, I am informing you 3 months prior to lease expiration. Due to a job change, I plan to move out on the maturity date." },
      { speaker: "B", speakerRole: "임대인", text: "통보 기간에 맞추어 미리 알려주셔서 감사합니다. 만기일에 다음 세입자 유무와 관계없이 보증금을 즉시 반환해 드리겠습니다.", translation: "Thank you for notifying me within the advance notice period. I will refund your deposit immediately on maturity date regardless of the next tenant." },
      { speaker: "A", speakerRole: "임차인", text: "이사 당일 오전에 공과금 정산 영수증을 확인해 드리고 짐이 빠진 후 집 상태를 함께 점검하겠습니다.", translation: "On moving day morning, I will provide utility bills settlement receipts and inspect the apartment condition together after move-out." },
      { speaker: "B", speakerRole: "임대인", text: "좋습니다. 장기수선충당금 적립금도 이사 당일 관리사무소 내역을 받아 정산해 드리겠습니다.", translation: "Sounds good. I will also reimburse your accumulated long-term maintenance reserve fund based on office records on moving day." },
    ],
    keyExpressions: [
      { target: "계약 만료 통보", meaning: "lease expiration notice", explanation: "임대차 계약 종료 의사를 법정 사전 고지 기간 내에 상대방에게 알리는 절차입니다." },
      { target: "장기수선충당금 정산", meaning: "settlement of building reserve fund", explanation: "세입자가 관리비에 포함하여 대신 납부했던 수선충당금을 퇴거 시 소유자에게 돌려받는 것입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-hsg-3-q1",
        site: "korean",
        skillId: "dlg.ko.hsg",
        type: "multiple_choice",
        difficulty: 5,
        prompt: "이사 당일 임대인이 세입자에게 별도로 정산하여 돌려주기로 한 관리비 항목은 무엇인가요?",
        options: [
          { id: "a", text: "인터넷 사용료" },
          { id: "b", text: "장기수선충당금" },
          { id: "c", text: "음식물 쓰레기 스티커 비용" },
          { id: "d", text: "엘리베이터 이용 수수료" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["임대인의 마지막 대화에 언급된 충당금 항목을 확인하세요."],
        explanation: "장기수선충당금은 원래 집주인이 부담해야 하는 항목이므로, 퇴거 시 임차인이 관리사무소 내역을 받아 임대인으로부터 반환받습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-pub-1",
    category: "public_office",
    site: "korean",
    titleKo: "주민센터 전입신고와 체류지 변경 접수",
    titleEn: "Reporting Address Change at Community Center",
    difficulty: 2,
    gradeScope: "K4",
    semester: 1,
    locationKo: "동 주민센터 민원실",
    locationEn: "Neighborhood community center civil service office",
    turns: [
      { speaker: "A", speakerRole: "민원인", text: "안녕하세요, 지난주에 이 동네로 이사를 와서 체류지 변경 신고를 하러 왔습니다.", translation: "Hello, I moved into this neighborhood last week and came to report a change of residence." },
      { speaker: "B", speakerRole: "공무원", text: "외국인 체류지 변경은 이사일로부터 15일 이내에 신고하셔야 합니다. 외국인등록증과 임대차 계약서를 제출해 주세요.", translation: "Foreign resident address changes must be reported within 15 days of moving. Please submit your Alien Registration Card and lease contract." },
      { speaker: "A", speakerRole: "민원인", text: "여기 제 등록증과 부동산 계약서 원본입니다. 신고 서식 작성도 완료했습니다.", translation: "Here is my registration card and original lease contract. I also completed the form." },
      { speaker: "B", speakerRole: "공무원", text: "전산 등록 완료되었습니다. 외국인등록증 뒷면에 새 주소를 출력해 드렸습니다.", translation: "System registration complete. I printed the new address on the back of your registration card." },
    ],
    keyExpressions: [
      { target: "체류지 변경 신고", meaning: "report of change in place of stay", explanation: "거주지를 옮긴 외국인이 15일 이내에 관할 주민센터나 출입국관리소에 주소를 신고하는 법적 의무입니다." },
      { target: "외국인등록증 뒷면 인쇄", meaning: "printing address on back of alien card", explanation: "새 주소가 공적으로 인증되어 카드 뒷면에 기록되는 절차입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-pub-1-q1",
        site: "korean",
        skillId: "dlg.ko.pub",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "외국인이 한국에서 이사한 후 관할 관공서에 체류지 변경을 신고해야 하는 법정 기한은 며칠 이내인가요?",
        options: [
          { id: "a", text: "이사일로부터 3일 이내" },
          { id: "b", text: "이사일로부터 15일 이내" },
          { id: "c", text: "이사일로부터 60일 이내" },
          { id: "d", text: "1년 이내" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["공무원의 첫 번째 법정 기한 설명을 확인하세요."],
        explanation: "출입국관리법령상 체류지 변경은 전입일(이사일)로부터 15일 이내에 반드시 신고하여야 합니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-pub-2",
    category: "public_office",
    site: "korean",
    titleKo: "출입국외국인청 체류 기간 연장 신청",
    titleEn: "Immigration Office: Extension of Stay Application",
    difficulty: 4,
    gradeScope: "K7",
    semester: 1,
    locationKo: "출입국외국인청 체류관리과 창구",
    locationEn: "Immigration office stay management division counter",
    turns: [
      { speaker: "A", speakerRole: "신청인", text: "안녕하세요, 유학 비자(D-2) 체류 기간 만료가 한 달 남아 연장 신청을 하러 왔습니다.", translation: "Hello, my study visa (D-2) expires in one month, so I am here to apply for an extension of stay." },
      { speaker: "B", speakerRole: "출입국 공무원", text: "하이코리아 방문 예약증, 신청서, 여권, 외국인등록증, 재학증명서, 성적증명서를 확인하겠습니다.", translation: "I will check your HiKorea reservation ticket, application, passport, Alien Registration Card, enrollment certificate, and transcript." },
      { speaker: "A", speakerRole: "신청인", text: "모든 서류와 수수료 영수증을 여기에 준비했습니다.", translation: "I have prepared all documents and fee payment receipts right here." },
      { speaker: "B", speakerRole: "출입국 공무원", text: "심사 요건을 충족하여 1년 연장 허가되었습니다. 등록증에 만료일이 갱신되었습니다.", translation: "Screening criteria met; 1-year extension approved. The expiration date has been updated on your card." },
    ],
    keyExpressions: [
      { target: "체류 기간 연장", meaning: "extension of stay", explanation: "체류 만료일 전에 허가를 받아 합법적으로 체류 기간을 늘리는 절차입니다." },
      { target: "방문 예약증", meaning: "visit reservation receipt", explanation: "출입국외국인청 창구 상담을 위해 온라인으로 사전 예약한 확인서입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-pub-2-q1",
        site: "korean",
        skillId: "dlg.ko.pub",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "출입국청 심사 결과 신청인은 체류 기간을 얼마 동안 연장 허가받았나요?",
        options: [
          { id: "a", text: "1개월" },
          { id: "b", text: "6개월" },
          { id: "c", text: "1년" },
          { id: "d", text: "5년" },
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["출입국 공무원의 마지막 심사 승인 내용을 확인하세요."],
        explanation: "공무원은 심사 요건 충족으로 1년 연장 허가가 났다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-pub-3",
    category: "public_office",
    site: "korean",
    titleKo: "무인민원발급기 서류 발급과 본인인증",
    titleEn: "Civil Certificate Kiosk & Identity Verification",
    difficulty: 4,
    gradeScope: "K8",
    semester: 1,
    locationKo: "구청 로비 무인민원발급기 앞",
    locationEn: "In front of civil service kiosk in district office lobby",
    turns: [
      { speaker: "A", speakerRole: "시민", text: "안내 도우미님, 은행에 제출할 소득금액증명원을 여기서 바로 발급받을 수 있나요?", translation: "Civil guide, can I directly print an income certificate to submit to the bank from this kiosk?" },
      { speaker: "B", speakerRole: "안내 도우미", text: "네, 화면에서 '국세증명' 메뉴를 누르신 후 주민등록번호를 입력하고 오른쪽 센서에 지문을 대주세요.", translation: "Yes, tap 'National Tax Certificates' on screen, enter your registration number, and place your fingerprint on the right sensor." },
      { speaker: "A", speakerRole: "시민", text: "지문 인식이 성공했습니다. 제출용 무료 발급 버튼을 누르면 되나요?", translation: "Fingerprint authentication succeeded. Should I press the free issuance button for submission?" },
      { speaker: "B", speakerRole: "안내 도우미", text: "네, 인쇄 버튼을 누르시면 하단 배출구에서 관인이 날인된 공적 증명서가 출력됩니다.", translation: "Yes, press print and an officially sealed civil certificate will be discharged from the bottom slot." },
    ],
    keyExpressions: [
      { target: "무인민원발급기", meaning: "automated civil document kiosk", explanation: "관공서 창구 대기 없이 각종 공적 서류를 즉시 발급하는 무인 기기입니다." },
      { target: "지문 인식 본인인증", meaning: "biometric fingerprint authentication", explanation: "신분증 없이 등록된 지문으로 본인 여부를 증명하는 보안 인증 절차입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-pub-3-q1",
        site: "korean",
        skillId: "dlg.ko.pub",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "무인민원발급기에서 본인 확인을 위해 사용된 생체 인증 방식은 무엇인가요?",
        options: [
          { id: "a", text: "홍채 스캔" },
          { id: "b", text: "우측 센서 지문 인식" },
          { id: "c", text: "음성 인식" },
          { id: "d", text: "얼굴 표정 인식" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["안내 도우미가 설명한 센서 위치와 인식 수단을 확인하세요."],
        explanation: "기기 화면 메뉴 입력 후 오른쪽 지문 센서에 손가락을 대어 지문 인식을 진행했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-wrk-1",
    category: "workplace",
    site: "korean",
    titleKo: "신입사원 첫 출근 팀 소개와 오리엔테이션",
    titleEn: "New Team Member Introduction & Office Tour",
    difficulty: 2,
    gradeScope: "K4",
    semester: 2,
    locationKo: "회사 사무실 개발팀 공간",
    locationEn: "Company office development team area",
    turns: [
      { speaker: "A", speakerRole: "팀장", text: "팀원 여러분, 오늘부터 글로벌 마케팅팀에 새로 합류하신 줄리앙 씨를 소개합니다.", translation: "Team members, let me introduce Julien, who is joining our Global Marketing Team starting today." },
      { speaker: "B", speakerRole: "신입사원", text: "처음 뵙겠습니다. 줄리앙이라고 합니다. 팀에 기여할 수 있도록 성실히 배우고 최선을 다하겠습니다.", translation: "Nice to meet you all. I am Julien. I will learn diligently and do my best to contribute to the team." },
      { speaker: "A", speakerRole: "팀장", text: "환영합니다. 이쪽이 줄리앙 씨 전용 자리이며, 업무용 노트북과 사원증이 준비되어 있습니다.", translation: "Welcome! Here is your desk, where your work laptop and employee ID card are prepared." },
      { speaker: "B", speakerRole: "신입사원", text: "세심한 준비 감사드립니다. 사내 메신저와 메일 계정에 바로 로그인해 보겠습니다.", translation: "Thank you for the thoughtful preparation. I will log in to the company messenger and email account right away." },
    ],
    keyExpressions: [
      { target: "처음 뵙겠습니다", meaning: "How do you do? / Nice to meet you", explanation: "격식 있는 비즈니스 자리에서 처음 만난 사람에게 건네는 첫인사입니다." },
      { target: "최선을 다하겠습니다", meaning: "I will do my best", explanation: "업무나 프로젝트에 임할 때 책임감을 다짐하는 대표적인 표현입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-wrk-1-q1",
        site: "korean",
        skillId: "dlg.ko.wrk",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "신입사원이 첫인사를 건네며 밝힌 다짐의 핵심은 무엇인가요?",
        options: [
          { id: "a", text: "야근을 거부하겠다는 의사 표시" },
          { id: "b", text: "성실히 배우고 최선을 다해 팀에 기여하겠다는 다짐" },
          { id: "c", text: "부서 이동을 서두르겠다는 요구" },
          { id: "d", text: "조기 퇴근을 원한다는 희망" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["신입사원 줄리앙의 자기소개 발언을 확인하세요."],
        explanation: "신입사원은 성실히 배우며 팀에 기여하기 위해 최선을 다하겠다고 예의 바르게 포부를 밝혔습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-wrk-2",
    category: "workplace",
    site: "korean",
    titleKo: "주간 스프린트 회의와 프로젝트 진척 보고",
    titleEn: "Weekly Sprint Meeting & Progress Report",
    difficulty: 4,
    gradeScope: "K8",
    semester: 2,
    locationKo: "사내 회의실",
    locationEn: "Company conference room",
    turns: [
      { speaker: "A", speakerRole: "프로젝트 매니저", text: "이번 주 다국어 번역 배포 진척도를 점검하겠습니다. 프론트엔드 팀 상황은 어떤가요?", translation: "Let us review this week's multilingual translation deployment progress. How is the front-end team doing?" },
      { speaker: "B", speakerRole: "담당 엔지니어", text: "88개 언어 UI 사전 연동은 테스트를 마쳤으며, 현재 로딩 속도 최적화 작업을 진행 중입니다.", translation: "Testing for 88 language UI dictionary integration is completed, and we are currently optimizing loading speeds." },
      { speaker: "A", speakerRole: "프로젝트 매니저", text: "출시 일정에 차질은 없나요? 병목 현상이 생기면 다른 부서의 지원을 요청할 수 있습니다.", translation: "Is the release schedule on track? If bottlenecks arise, we can request support from other teams." },
      { speaker: "B", speakerRole: "담당 엔지니어", text: "목요일 최종 QA 검증까지 예정대로 완료될 예정이므로 금요일 정식 배포에 문제없습니다.", translation: "Final QA verification will finish as scheduled by Thursday, so Friday's official release has no issues." },
    ],
    keyExpressions: [
      { target: "진척도를 점검하다", meaning: "to check progress", explanation: "프로젝트의 진행 상황과 완성도를 검토하는 비즈니스 실무 표현입니다." },
      { target: "병목 현상", meaning: "bottleneck", explanation: "전체 작업 흐름 중 지연이나 정체가 발생하는 특정 지점을 가리킵니다." },
    ],
    questions: [
      {
        id: "ko-dlg-wrk-2-q1",
        site: "korean",
        skillId: "dlg.ko.wrk",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "담당 엔지니어가 보고한 최종 정식 배포 예정 요일은 언제인가요?",
        options: [
          { id: "a", text: "화요일" },
          { id: "b", text: "수요일" },
          { id: "c", text: "목요일" },
          { id: "d", text: "금요일" },
        ],
        answer: { kind: "choice", id: "d" },
        hints: ["엔지니어의 마지막 대답을 확인하세요."],
        explanation: "담당 엔지니어는 목요일 QA를 마치고 금요일에 정식 배포를 진행할 예정이라고 보고했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-wrk-3",
    category: "workplace",
    site: "korean",
    titleKo: "부서 간 협업 일정 조율과 업무 협조 요청",
    titleEn: "Cross-Department Collaboration & Schedule Negotiation",
    difficulty: 5,
    gradeScope: "K10",
    semester: 1,
    locationKo: "임원 회의실 화상 회의",
    locationEn: "Executive boardroom video conference",
    turns: [
      { speaker: "A", speakerRole: "기획팀장", text: "데이터 분석팀과의 협업으로 3분기 사용자 유입 보고서 작성을 15일까지 마무리해야 합니다.", translation: "In collaboration with the Data Analytics team, we need to finalize the Q3 user traffic report by the 15th." },
      { speaker: "B", speakerRole: "데이터팀장", text: "현재 인프라 마이그레이션 일정과 겹쳐 리소스가 다소 빠듯합니다. 18일로 사흘만 연기해 주실 수 있나요?", translation: "It currently overlaps with infrastructure migration, so resources are tight. Could we extend it by 3 days until the 18th?" },
      { speaker: "A", speakerRole: "기획팀장", text: "경영진 정기 이사회 보고가 20일이므로 18일 오전까지 1차 분석본을 공유해 주시면 수용하겠습니다.", translation: "Since the board of directors meeting is on the 20th, we can accept the 18th if you share the primary analysis by that morning." },
      { speaker: "B", speakerRole: "데이터팀장", text: "일정을 배려해 주셔서 감사합니다. 18일 오전까지 핵심 지표 요약본을 우선 공유하겠습니다.", translation: "Thank you for accommodating our schedule. We will share the key metrics summary first by the morning of the 18th." },
    ],
    keyExpressions: [
      { target: "일정을 조율하다", meaning: "to negotiate/coordinate a schedule", explanation: "서로 다른 부서 간의 작업 마감 기한을 합리적으로 타협하여 맞추는 것입니다." },
      { target: "핵심 지표 요약본", meaning: "executive summary of key metrics", explanation: "방대한 데이터 중 의사결정에 직결되는 중요 수치만 추려낸 요약 문서입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-wrk-3-q1",
        site: "korean",
        skillId: "dlg.ko.wrk",
        type: "multiple_choice",
        difficulty: 5,
        prompt: "두 부서장이 협의하여 최종 확정한 1차 분석본 공유 마감 시점은 언제인가요?",
        options: [
          { id: "a", text: "15일 자정" },
          { id: "b", text: "18일 오전" },
          { id: "c", text: "20일 오후" },
          { id: "d", text: "다음 달 초" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["기획팀장이 수용 조건으로 제시하고 합의한 시점을 확인하세요."],
        explanation: "이사회 보고 일정(20일)을 감안하여 18일 오전까지 1차 분석본을 전달하기로 원만하게 조율되었습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-sal-1",
    category: "salon",
    site: "korean",
    titleKo: "헤어 스타일 사진 상담과 기장 조정",
    titleEn: "Hairstyle Photo Consultation & Length Adjustment",
    difficulty: 2,
    gradeScope: "K3",
    semester: 1,
    locationKo: "미용실 경대 의자",
    locationEn: "Hair salon mirror chair",
    turns: [
      { speaker: "A", speakerRole: "헤어 디자이너", text: "안녕하세요, 오늘 어떤 스타일로 변신하고 싶으신가요?", translation: "Hello, what kind of style change are you looking for today?" },
      { speaker: "B", speakerRole: "고객", text: "휴대폰에 저장해 온 이 사진처럼 깔끔한 댄디 컷으로 잘라주세요.", translation: "Please cut it into a clean dandy cut like this photo saved on my phone." },
      { speaker: "A", speakerRole: "헤어 디자이너", text: "사진 스타일이 잘 어울리실 것 같네요. 앞머리는 눈썹에 닿을 정도로 해드릴까요?", translation: "That style looks like a great match. Shall I keep the bangs touching your eyebrows?" },
      { speaker: "B", speakerRole: "고객", text: "네, 눈을 가리지 않게 눈썹 바로 위까지만 다듬어 주시고 옆머리는 귀가 보이게 정돈해 주세요.", translation: "Yes, please trim just above eyebrows without covering eyes, and neat side hair to show ears." },
    ],
    keyExpressions: [
      { target: "기장을 다듬다", meaning: "to trim length", explanation: "머리카락 길이를 정돈하여 자르는 미용 표현입니다." },
      { target: "앞머리와 옆머리", meaning: "bangs & side hair", explanation: "헤어스타일의 세부 부위를 구체적으로 요청할 때 사용합니다." },
    ],
    questions: [
      {
        id: "ko-dlg-sal-1-q1",
        site: "korean",
        skillId: "dlg.ko.sal",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "고객이 요청한 앞머리의 적절한 길이는 어느 부위인가요?",
        options: [
          { id: "a", text: "이마를 완전히 드러내는 삭발" },
          { id: "b", text: "눈을 가릴 정도로 길게" },
          { id: "c", text: "눈을 가리지 않게 눈썹 바로 위까지" },
          { id: "d", text: "턱선까지 내려오는 길이" },
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["고객의 마지막 요청 발언을 확인하세요."],
        explanation: "고객은 눈을 가리지 않게 눈썹 바로 위까지만 앞머리를 다듬어 달라고 명확히 요청했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-sal-2",
    category: "salon",
    site: "korean",
    titleKo: "샴푸실 수온 확인과 두피 마사지",
    titleEn: "Shampoo Water Temperature & Scalp Massage",
    difficulty: 2,
    gradeScope: "K4",
    semester: 1,
    locationKo: "미용실 샴푸실 세면대",
    locationEn: "Hair salon shampoo room wash basin",
    turns: [
      { speaker: "A", speakerRole: "미용 스태프", text: "샴푸실로 안내해 드리겠습니다. 의자에 편히 기대어 누워주세요.", translation: "I will guide you to the shampoo room. Please lean back and lie comfortably on the chair." },
      { speaker: "B", speakerRole: "고객", text: "네, 감사합니다.", translation: "Yes, thank you." },
      { speaker: "A", speakerRole: "미용 스태프", text: "물 온도 어떠신가요? 너무 뜨겁거나 차갑지 않으세요?", translation: "How is the water temperature? Is it too hot or cold?" },
      { speaker: "B", speakerRole: "고객", text: "따뜻하고 아주 좋습니다. 뒷목 쪽을 조금 더 헹궈주실 수 있나요?", translation: "It is warm and very nice. Could you rinse around the back of my neck a bit more?" },
      { speaker: "A", speakerRole: "미용 스태프", text: "네, 구석구석 헹궈드리고 두피 지압 마사지도 가볍게 해드리겠습니다.", translation: "Yes, I will rinse thoroughly everywhere and give you a light scalp acupressure massage." },
    ],
    keyExpressions: [
      { target: "물 온도 확인", meaning: "checking water temperature", explanation: "미용실 샴푸 시 손님의 편안함을 위해 수온을 배려하는 기본 질문입니다." },
      { target: "두피 지압 마사지", meaning: "scalp acupressure massage", explanation: "샴푸 후 머리의 혈액순환과 피로 해소를 위해 손가락으로 두피를 지압해 주는 서비스입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-sal-2-q1",
        site: "korean",
        skillId: "dlg.ko.sal",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "고객이 샴푸 중 추가로 더 헹궈달라고 부탁한 부위는 어디인가요?",
        options: [
          { id: "a", text: "앞이마 라인" },
          { id: "b", text: "뒷목 쪽" },
          { id: "c", text: "양쪽 귀 안쪽" },
          { id: "d", text: "어깨 라인" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["고객이 더 헹궈달라고 지정한 위치를 확인하세요."],
        explanation: "고객은 물 온도가 적당하다고 답하면서 뒷목 쪽을 조금 더 헹궈달라고 요청했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-sal-3",
    category: "salon",
    site: "korean",
    titleKo: "자연스러운 염색 컬러 상담과 홈케어 안내",
    titleEn: "Natural Hair Dye Consultation & Home Care",
    difficulty: 3,
    gradeScope: "K6",
    semester: 1,
    locationKo: "미용실 상담 카운터",
    locationEn: "Hair salon consultation counter",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "너무 밝지 않으면서 실내 조명 아래서 은은하게 도는 브라운 톤으로 염색하고 싶어요.", translation: "I want to dye my hair a soft brown tone that is not too bright but subtle under indoor lighting." },
      { speaker: "B", speakerRole: "원장", text: "차분한 초코 브라운 색상표를 추천드립니다. 붉은 기를 줄여 피부톤이 훨씬 화사해 보입니다.", translation: "I recommend this calm chocolate brown swatch. It reduces reddish tones and makes your skin tone look much brighter." },
      { speaker: "A", speakerRole: "고객", text: "모발이 많이 손상되지는 않을까요? 관리법도 알려주세요.", translation: "Will it damage hair a lot? Please also share home maintenance tips." },
      { speaker: "B", speakerRole: "원장", text: "영양 단백질 앰플을 함께 도포해 드리며, 시술 후 이틀간은 미온수로 샴푸하셔야 색이 오래 유지됩니다.", translation: "We apply nutritional protein ampoules together, and shampooing with lukewarm water for two days helps color last." },
    ],
    keyExpressions: [
      { target: "초코 브라운", meaning: "chocolate brown hair color", explanation: "자연스럽고 차분한 대표적인 갈색 계열 염색 색상입니다." },
      { target: "미온수로 샴푸하다", meaning: "to shampoo with lukewarm water", explanation: "염색 모발의 탈색과 건조를 막기 위해 미지근한 물을 사용하는 관리법입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-sal-3-q1",
        site: "korean",
        skillId: "dlg.ko.sal",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "염색 시술 후 색상을 오래 유지하기 위해 원장이 권장한 샴푸 방식은 무엇인가요?",
        options: [
          { id: "a", text: "뜨거운 물로 하루 3번 샴푸" },
          { id: "b", text: "이틀 동안 미온수로 샴푸" },
          { id: "c", text: "찬물 얼음물로만 세척" },
          { id: "d", text: "일주일간 전혀 머리를 감지 않기" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["원장의 마지막 홈케어 샴푸 권장사항을 확인하세요."],
        explanation: "원장은 염색 모발의 색소 유지와 손상 방지를 위해 시술 후 이틀 동안 미온수로 감을 것을 권장했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-lost-1",
    category: "lost_found",
    site: "korean",
    titleKo: "지하철 분실물 센터 우산 습득 문의",
    titleEn: "Inquiring Lost Umbrella at Subway Customer Center",
    difficulty: 1,
    gradeScope: "K2",
    semester: 1,
    locationKo: "지하철 유실물 센터",
    locationEn: "Subway lost and found center",
    turns: [
      { speaker: "A", speakerRole: "시민", text: "실례합니다, 오늘 오전 2호선 열차 선반 위에 검은색 장우산을 두고 내렸습니다.", translation: "Excuse me, I left a long black umbrella on the overhead rack of a Line 2 train this morning." },
      { speaker: "B", speakerRole: "센터 직원", text: "하차하신 역과 시간, 열차 칸 번호를 기억하시나요?", translation: "Do you remember the station and time you got off, and the train carriage number?" },
      { speaker: "A", speakerRole: "시민", text: "오전 9시 20분경 강남역에서 내렸고 4번째 칸이었습니다. 우산 손잡이에 파란색 끈이 묶여 있습니다.", translation: "I got off at Gangnam Station around 9:20 AM in carriage 4. The handle has a blue string tied to it." },
      { speaker: "B", speakerRole: "센터 직원", text: "종점 차량기지에서 수거된 습득물 중에 일치하는 우산이 등록되어 있습니다. 본인 서명 후 찾아가세요.", translation: "An umbrella matching that description was registered from the terminal depot. Please sign and retrieve it." },
    ],
    keyExpressions: [
      { target: "두고 내리다", meaning: "to leave behind (on a vehicle)", explanation: "대중교통에 물건을 깜빡 잊고 내렸을 때 쓰는 핵심 동사구입니다." },
      { target: "유실물 센터", meaning: "lost and found center", explanation: "분실된 물건을 보관하고 주인을 찾아주는 공공 센터입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-lost-1-q1",
        site: "korean",
        skillId: "dlg.ko.lost",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "분실물 센터 직원이 확인한 우산의 특징과 일치하는 파란 끈은 어디에 묶여 있었나요?",
        options: [
          { id: "a", text: "우산 꼭대기" },
          { id: "b", text: "우산 손잡이" },
          { id: "c", text: "우산 안쪽 살" },
          { id: "d", text: "비닐 커버" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["시민이 설명한 우산의 구체적 외관 특징을 확인하세요."],
        explanation: "시민은 우산 손잡이에 파란색 끈이 묶여 있다고 구체적인 식별 특징을 설명했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-lost-2",
    category: "lost_found",
    site: "korean",
    titleKo: "관광지 안내소 지갑 분실 신고서 작성",
    titleEn: "Filing Lost Wallet Report at Tourist Info Center",
    difficulty: 3,
    gradeScope: "K5",
    semester: 2,
    locationKo: "국립공원 관광안내소 민원 창구",
    locationEn: "National park tourist information counter",
    turns: [
      { speaker: "A", speakerRole: "관광객", text: "도와주세요! 산책로 벤치에서 갈색 가죽 지갑을 잃어버린 것 같습니다.", translation: "Please help! I think I lost my brown leather wallet on a trail bench." },
      { speaker: "B", speakerRole: "안내소 직원", text: "침착하시고 분실 신고서를 작성해 주세요. 지갑 안에 어떤 소지품이 들어있었나요?", translation: "Please stay calm and fill out this lost item report. What items were inside the wallet?" },
      { speaker: "A", speakerRole: "관광객", text: "신분증, 외국인등록증, 교통카드 겸용 신용카드 1장이 들어있었습니다.", translation: "It contained my ID, Alien Registration Card, and one transit credit card." },
      { speaker: "B", speakerRole: "안내소 직원", text: "카드는 즉시 분실 정지 신청을 하시고, 습득 즉시 기재하신 연락처로 전화드리겠습니다.", translation: "Please report card loss immediately, and we will call your contact number as soon as it is handed in." },
    ],
    keyExpressions: [
      { target: "분실 신고서", meaning: "lost property report", explanation: "잃어버린 물품의 인적 사항과 특징을 공식 접수하는 서류입니다." },
      { target: "분실 정지 신청", meaning: "requesting loss card suspension", explanation: "도난이나 부정 사용을 방지하기 위해 금융기관에 카드를 정지시키는 긴급 조치입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-lost-2-q1",
        site: "korean",
        skillId: "dlg.ko.lost",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "지갑을 분실했을 때 2차 부정 사용 피해를 방지하기 위해 가장 먼저 취해야 할 금융 조치는 무엇인가요?",
        options: [
          { id: "a", text: "새 지갑을 즉시 구매하기" },
          { id: "b", text: "카드사에 즉시 분실 정지 신청하기" },
          { id: "c", text: "산책로 전체를 혼자 밤새 수색하기" },
          { id: "d", text: "계좌의 전액을 다른 사람에게 송금하기" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["안내소 직원의 긴급 대응 조언을 확인하세요."],
        explanation: "직원은 부정 결제를 막기 위해 신용카드 분실 정지 신청을 즉각 진행하라고 조언했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-lost-3",
    category: "lost_found",
    site: "korean",
    titleKo: "습득물 신원 확인과 물품 수령 서명",
    titleEn: "Verifying Identity & Claiming Found Property",
    difficulty: 4,
    gradeScope: "K7",
    semester: 1,
    locationKo: "경찰서 유실물 보관 창구",
    locationEn: "Police station lost & found custody counter",
    turns: [
      { speaker: "A", speakerRole: "민원인", text: "안녕하세요, 어제 유실물 종합포털(LOST112)에서 제 태블릿 PC가 보관 중이라는 연락을 받고 왔습니다.", translation: "Hello, I came after receiving notice that my tablet PC is held here via the LOST112 portal." },
      { speaker: "B", speakerRole: "담당 경찰관", text: "접수 번호 7401번 확인했습니다. 본인 확인을 위해 신분증을 제시해 주시고 잠금 화면 해제를 요청드립니다.", translation: "Confirmation for case #7401. Please present your ID and unlock the screen for ownership verification." },
      { speaker: "A", speakerRole: "민원인", text: "여기 제 신분증과 잠금 비밀번호를 풀어 화면 배경의 제 가족사진을 보여드립니다.", translation: "Here is my ID, and I unlocked the password to show my family photo on the background." },
      { speaker: "B", speakerRole: "담당 경찰관", text: "본인 소유가 명확히 입증되었습니다. 습득물 인수증에 성명과 연락처 서명 후 기기를 수령하세요.", translation: "Ownership clearly verified. Please sign the receipt with your name and contact number, then take your device." },
    ],
    keyExpressions: [
      { target: "LOST112 (유실물 종합포털)", meaning: "national police lost & found portal", explanation: "경찰청에서 운영하는 전국 분실물 통합 검색 및 관리 전산망입니다." },
      { target: "소유권 입증", meaning: "proof of ownership", explanation: "잠금 해제, 시리얼 번호, 신분증 등으로 해당 물품의 진정한 주인임을 밝히는 절차입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-lost-3-q1",
        site: "korean",
        skillId: "dlg.ko.lost",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "전자 기기(태블릿 PC) 습득물 반환 시 본인 소유임을 증명하기 위해 수행한 결정적 행동은 무엇인가요?",
        options: [
          { id: "a", text: "기기의 무게를 저울로 달아보기" },
          { id: "b", text: "비밀번호를 입력하여 잠금 화면을 직접 해제하기" },
          { id: "c", text: "새 충전기를 구매해 연결하기" },
          { id: "d", text: "기기 제조사 서비스센터에 방문하기" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["경찰관이 요청하고 민원인이 수행한 검증 절차를 확인하세요."],
        explanation: "화면 잠금 비밀번호를 직접 해제하여 가족사진 배경화면을 확인함으로써 정당한 소유자임이 즉시 입증되었습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-fit-1",
    category: "fitness",
    site: "korean",
    titleKo: "헬스장 3개월 회원권 등록과 라커 이용",
    titleEn: "Gym Membership Registration & Locker Rental",
    difficulty: 2,
    gradeScope: "K3",
    semester: 2,
    locationKo: "피트니스 센터 안내 데스크",
    locationEn: "Fitness center front desk",
    turns: [
      { speaker: "A", speakerRole: "고객", text: "안녕하세요, 직장 퇴근 후 운동을 하려고 3개월 헬스 회원권을 등록하고 싶습니다.", translation: "Hello, I want to register for a 3-month gym membership to exercise after work." },
      { speaker: "B", speakerRole: "매니저", text: "환영합니다! 평일 오전 6시부터 밤 11시까지, 주말은 저녁 8시까지 자유롭게 이용 가능합니다.", translation: "Welcome! You can use facilities freely from 6 AM to 11 PM on weekdays, and until 8 PM on weekends." },
      { speaker: "A", speakerRole: "고객", text: "운동복과 개인 라커도 함께 대여할 수 있나요?", translation: "Can I also rent workout clothes and a personal locker?" },
      { speaker: "B", speakerRole: "매니저", text: "네, 3개월 패키지로 하시면 운동복과 수건은 무료 제공되며 개인 라커는 월 1만 원입니다.", translation: "Yes, with the 3-month package, workout clothes and towels are complimentary, and a private locker is 10,000 KRW/month." },
    ],
    keyExpressions: [
      { target: "회원권 등록", meaning: "membership registration", explanation: "체육 시설을 정기적으로 이용하기 위해 회원으로 가입하는 절차입니다." },
      { target: "개인 라커", meaning: "personal locker", explanation: "운동화나 세면도구를 체육관에 두고 다니기 위해 대여하는 보관함입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-fit-1-q1",
        site: "korean",
        skillId: "dlg.ko.fit",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "피트니스 센터 3개월 패키지 등록 시 무료로 제공되는 품목은 무엇인가요?",
        options: [
          { id: "a", text: "전용 러닝화와 보충제" },
          { id: "b", text: "운동복과 수건" },
          { id: "c", text: "개인 라커 전액 면제" },
          { id: "d", text: "매일 1대1 개인 PT" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["매니저의 마지막 패키지 혜택 설명을 확인하세요."],
        explanation: "매니저는 3개월 패키지 이용 시 운동복과 수건이 무료로 제공된다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-fit-2",
    category: "fitness",
    site: "korean",
    titleKo: "러닝머신 기구 사용법과 안전 정지 버튼",
    titleEn: "Treadmill Usage & Emergency Stop Button",
    difficulty: 2,
    gradeScope: "K4",
    semester: 2,
    locationKo: "체육관 유산소 존",
    locationEn: "Gym cardio exercise zone",
    turns: [
      { speaker: "A", speakerRole: "회원", text: "트레이너님, 이 러닝머신 경사도 조절과 심박수 측정은 어떻게 하나요?", translation: "Trainer, how do I adjust incline and measure heart rate on this treadmill?" },
      { speaker: "B", speakerRole: "트레이너", text: "손잡이의 금속 센서를 잡으시면 화면에 심박수가 표시되며, 좌측 화살표로 경사도를 올릴 수 있습니다.", translation: "Gripping the metal sensors on handles displays heart rate on screen, and left arrows increase incline." },
      { speaker: "A", speakerRole: "회원", text: "달리다가 갑자기 어지러우면 어떻게 멈춰야 하나요?", translation: "If I feel dizzy while running, how should I stop it immediately?" },
      { speaker: "B", speakerRole: "트레이너", text: "가운데 빨간색 '긴급 정지' 버튼을 누르거나 옷에 집게로 연결된 안전핀을 당기시면 벨트가 즉시 정지합니다.", translation: "Press the red 'Emergency Stop' button in the center or pull the safety clip on your shirt to stop immediately." },
    ],
    keyExpressions: [
      { target: "경사도 조절", meaning: "incline adjustment", explanation: "러닝머신 발판의 기울기를 조절하여 언덕 오르기 운동 효과를 내는 기능입니다." },
      { target: "긴급 정지 버튼", meaning: "emergency stop button", explanation: "위급 상황 시 러닝 벨트를 즉시 멈추게 하는 빨간색 안전장치입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-fit-2-q1",
        site: "korean",
        skillId: "dlg.ko.fit",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "러닝머신 이용 중 어지럼증 등 비상 상황 발생 시 기계를 즉시 멈추는 가장 확실한 안전장치는 무엇인가요?",
        options: [
          { id: "a", text: "속도 증가 버튼 누르기" },
          { id: "b", text: "화면 전원 케이블을 강제로 뽑기" },
          { id: "c", text: "중앙의 빨간색 긴급 정지 버튼 누르기" },
          { id: "d", text: "달리면서 바닥으로 뛰어내리기" },
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["트레이너가 강조한 빨간색 안전 버튼을 확인하세요."],
        explanation: "러닝머신 중앙의 빨간색 긴급 정지 버튼이나 옷에 연결된 안전핀을 당기면 벨트가 즉시 멈춥니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-fit-3",
    category: "fitness",
    site: "korean",
    titleKo: "그룹 필라테스 수업 예약과 수업 일정 변경",
    titleEn: "Group Pilates Class Booking & Schedule Reschedule",
    difficulty: 3,
    gradeScope: "K6",
    semester: 1,
    locationKo: "GX 스튜디오 안내 데스크",
    locationEn: "Group exercise studio desk",
    turns: [
      { speaker: "A", speakerRole: "회원", text: "안녕하세요, 화요일 저녁 7시 기구 필라테스 초급반으로 수업을 예약하고 싶습니다.", translation: "Hello, I want to book the Tuesday 7 PM beginner reformer Pilates class." },
      { speaker: "B", speakerRole: "안내 직원", text: "모바일 예약 앱에서 매주 일요일 자정에 해당 주차 수업이 열리며, 최대 정원은 6명입니다.", translation: "Classes open every Sunday midnight in the mobile booking app, with a maximum capacity of 6 people." },
      { speaker: "A", speakerRole: "회원", text: "만약 야근이나 출장으로 수업에 참석하지 못하면 어떻게 해야 하나요?", translation: "What should I do if I cannot attend due to overtime work or business trips?" },
      { speaker: "B", speakerRole: "안내 직원", text: "수업 시작 4시간 전까지 앱에서 취소하시면 횟수 차감 없이 다른 요일로 변경 예약하실 수 있습니다.", translation: "If you cancel on the app at least 4 hours before class, you can rebook another day without deduction." },
    ],
    keyExpressions: [
      { target: "최대 정원", meaning: "maximum capacity", explanation: "그룹 수업에서 안전과 밀착 지도를 위해 정해진 수강 인원 한도입니다." },
      { target: "수업 횟수 차감", meaning: "deduction of class credit", explanation: "예약 후 무단 불참(노쇼) 시 수강 횟수가 소진되는 규칙입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-fit-3-q1",
        site: "korean",
        skillId: "dlg.ko.fit",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "필라테스 수업 참석이 어려울 때 수강 횟수 차감 없이 취소할 수 있는 기준 시간은 언제인가요?",
        options: [
          { id: "a", text: "수업 시작 10분 전" },
          { id: "b", text: "수업 시작 4시간 전까지" },
          { id: "c", text: "수업 시작 다음 날" },
          { id: "d", text: "취소는 언제든 불가능함" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["안내 직원의 마지막 취소 규정 설명을 확인하세요."],
        explanation: "직원은 수업 시작 4시간 전까지 취소하면 횟수 차감 없이 다른 요일로 변경할 수 있다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-lib-1",
    category: "library_museum",
    site: "korean",
    titleKo: "시립도서관 회원증 발급과 도서 대출",
    titleEn: "Issuing Library Card & Borrowing Books",
    difficulty: 2,
    gradeScope: "K3",
    semester: 1,
    locationKo: "시립도서관 안내 데스크",
    locationEn: "City library information counter",
    turns: [
      { speaker: "A", speakerRole: "시민", text: "안녕하세요, 도서관 회원증을 발급받아 책을 빌리고 싶습니다. 외국인도 가능한가요?", translation: "Hello, I want to get a library card and borrow books. Can international residents also apply?" },
      { speaker: "B", speakerRole: "사서", text: "네, 관내 거주 외국인등록증이나 재학증명서를 보여주시면 즉시 모바일 회원증을 발급해 드립니다.", translation: "Yes, if you show your local Alien Registration Card or school certificate, we issue a mobile membership card immediately." },
      { speaker: "A", speakerRole: "시민", text: "한 번에 몇 권까지 빌릴 수 있고 대출 기간은 며칠인가요?", translation: "How many books can I borrow at once, and how long is the loan period?" },
      { speaker: "B", speakerRole: "사서", text: "1인당 최대 5권까지 14일 동안 대출 가능하며, 예약자가 없으면 7일 연장이 가능합니다.", translation: "Up to 5 books per person for 14 days, and you can extend 7 days if there are no reservations." },
    ],
    keyExpressions: [
      { target: "도서관 회원증", meaning: "library card", explanation: "공공도서관에서 도서를 대출하거나 좌석을 이용하기 위한 등록증입니다." },
      { target: "대출 기간 연장", meaning: "loan period extension", explanation: "반납 기한 전에 대출 기간을 추가로 늘리는 제도입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-lib-1-q1",
        site: "korean",
        skillId: "dlg.ko.lib",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "도서관 회원이 한 번에 빌릴 수 있는 최대 권수와 기본 대출 기간은 얼마인가요?",
        options: [
          { id: "a", text: "1권, 3일" },
          { id: "b", text: "5권, 14일" },
          { id: "c", text: "10권, 30일" },
          { id: "d", text: "권수 무제한, 1년" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["사서의 마지막 규정 안내를 확인하세요."],
        explanation: "사서는 1인당 최대 5권까지 14일간 대출 가능하다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-lib-2",
    category: "library_museum",
    site: "korean",
    titleKo: "국립박물관 오디오 가이드 대여와 관람 순서",
    titleEn: "Museum Audio Guide Rental & Exhibition Route",
    difficulty: 2,
    gradeScope: "K4",
    semester: 1,
    locationKo: "국립박물관 로비 안내 데스크",
    locationEn: "National museum lobby info desk",
    turns: [
      { speaker: "A", speakerRole: "관람객", text: "안녕하세요, 상설전시실 관람용 다국어 오디오 가이드 기기를 대여할 수 있나요?", translation: "Hello, can I rent a multilingual audio guide device for permanent exhibition halls?" },
      { speaker: "B", speakerRole: "안내원", text: "네, 한국어, 영어, 일본어, 중국어 등 지원 기기가 준비되어 있으며 대여료는 3,000원입니다.", translation: "Yes, devices supporting Korean, English, Japanese, and Chinese are ready; rental fee is 3,000 KRW." },
      { speaker: "A", speakerRole: "관람객", text: "선사시대부터 조선시대까지 순서대로 보려면 어디서 출발해야 하나요?", translation: "Where should I start to view chronologically from prehistory to Joseon dynasty?" },
      { speaker: "B", speakerRole: "안내원", text: "1층 동관 선사고대관 입구부터 관람 동선 화살표를 따라 이동하시면 시대순으로 관람하실 수 있습니다.", translation: "Follow the exhibition flow arrows starting at the 1st floor East Wing Prehistory Hall to view chronologically." },
    ],
    keyExpressions: [
      { target: "오디오 가이드", meaning: "audio guide", explanation: "유물 번호를 입력하거나 근접 센서로 전시물 설명을 들려주는 휴대용 해설 기기입니다." },
      { target: "관람 동선", meaning: "exhibition viewing flow / route", explanation: "전시실을 체계적으로 감상하도록 유도하는 권장 이동 경로입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-lib-2-q1",
        site: "korean",
        skillId: "dlg.ko.lib",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "박물관 유물을 선사시대부터 시대순으로 올바르게 관람하기 위한 출발 지점은 어디인가요?",
        options: [
          { id: "a", text: "3층 아시아 도자관" },
          { id: "b", text: "1층 동관 선사고대관 입구" },
          { id: "c", text: "지하 1층 뮤지엄 숍" },
          { id: "d", text: "야외 정원 석탑 마당" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["안내원의 마지막 동선 안내를 확인하세요."],
        explanation: "안내원은 1층 동관 선사고대관 입구부터 관람 동선을 따라 이동해야 시대순으로 관람할 수 있다고 설명했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-lib-3",
    category: "library_museum",
    site: "korean",
    titleKo: "특별 기획전 사진 촬영 규정과 관람 에티켓",
    titleEn: "Special Exhibition Photography Policy & Etiquette",
    difficulty: 3,
    gradeScope: "K6",
    semester: 2,
    locationKo: "미술관 기획전시실 입구",
    locationEn: "Art museum special exhibition entrance",
    turns: [
      { speaker: "A", speakerRole: "관람객", text: "실례합니다, 전시실 내부에서 휴대폰으로 회화 작품 사진 촬영이 가능한가요?", translation: "Excuse me, is it permissible to take photos of paintings with a mobile phone inside the gallery?" },
      { speaker: "B", speakerRole: "전시 안내원", text: "플래시와 삼각대 없이 무음 모드로 촬영하는 것은 허용되나, 일부 대여 유물은 촬영 금지 표시가 있습니다.", translation: "Photography in silent mode without flash or tripod is permitted, but some loaned relics have no-photo signs." },
      { speaker: "A", speakerRole: "관람객", text: "가방이 큰데 전시실 안에 들고 들어가도 괜찮은가요?", translation: "My backpack is large; is it okay to carry it inside the exhibition hall?" },
      { speaker: "B", speakerRole: "전시 안내원", text: "작품 훼손 방지를 위해 배낭은 입구 맞은편 무료 물품보관함에 보관해 주시기 바랍니다.", translation: "To prevent accidental damage to artworks, please store large backpacks in the free lockers across the entrance." },
    ],
    keyExpressions: [
      { target: "플래시 금지", meaning: "no flash photography", explanation: "강한 빛으로 인한 미술품 변색과 손상을 방지하기 위한 필수 에티켓입니다." },
      { target: "물품보관함 이용", meaning: "using free storage lockers", explanation: "쾌적한 관람과 유물 보호를 위해 큰 짐을 보관하는 서비스입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-lib-3-q1",
        site: "korean",
        skillId: "dlg.ko.lib",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "미술관 전시실 내 사진 촬영 시 작품 보호를 위해 절대 사용해서는 안 되는 것은 무엇인가요?",
        options: [
          { id: "a", text: "무음 촬영 앱" },
          { id: "b", text: "플래시 및 삼각대" },
          { id: "c", text: "휴대폰 카메라" },
          { id: "d", text: "도슨트 이어폰" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["안내원의 첫 번째 사진 규정 답변을 확인하세요."],
        explanation: "작품 보호와 타인의 관람 방해를 막기 위해 플래시와 삼각대 사용은 엄격히 금지됩니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-car-1",
    category: "car_rental",
    site: "korean",
    titleKo: "렌터카 차량 인수와 완전 자차 보험",
    titleEn: "Car Rental Pickup & Full Damage Insurance",
    difficulty: 3,
    gradeScope: "K5",
    semester: 1,
    locationKo: "공항 렌터카 지점 데스크",
    locationEn: "Airport car rental service desk",
    turns: [
      { speaker: "A", speakerRole: "렌터카 직원", text: "예약 확인 도와드리겠습니다. 운전면허증과 결제용 신용카드 보여주시겠습니까?", translation: "I will assist with your reservation. May I see your driver license and payment credit card?" },
      { speaker: "B", speakerRole: "고객", text: "여기 한국 운전면허증입니다. 준중형 승용차로 예약했습니다.", translation: "Here is my Korean driver license. I booked a compact sedan." },
      { speaker: "A", speakerRole: "렌터카 직원", text: "완전 자차 종합보험이 포함되어 있어 사고 시 자기부담금이 전혀 발생하지 않습니다. 주차장 3번 구역에서 차량 외관 점검 후 출발하시면 됩니다.", translation: "Full damage waiver insurance is included, so there is zero deductible in an accident. Please inspect the exterior at zone 3 before departing." },
      { speaker: "B", speakerRole: "고객", text: "반납할 때 연료는 어떻게 채워와야 하나요?", translation: "How should we fill up fuel when returning the car?" },
      { speaker: "A", speakerRole: "렌터카 직원", text: "현재 가득 채워져 있으니, 반납하실 때도 인근 주유소에서 가득 주유하여 반납해 주시면 됩니다.", translation: "It is currently full, so please refuel it completely at a nearby gas station before return." },
    ],
    keyExpressions: [
      { target: "완전 자차 보험", meaning: "full collision damage waiver (CDW)", explanation: "사고 발생 시 운전자 부담금을 면제해 주는 렌터카 보험입니다." },
      { target: "가득 주유하다", meaning: "to fill up the fuel tank completely", explanation: "연료를 가득 채울 때 쓰는 일상 표현입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-car-1-q1",
        site: "korean",
        skillId: "dlg.ko.car",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "차량 반납 시 연료 충전 규정으로 알맞은 것은 무엇인가요?",
        options: [
          { id: "a", text: "연료를 완전히 비워서 반납한다." },
          { id: "b", text: "인수 때와 마찬가지로 가득 주유하여 반납한다." },
          { id: "c", text: "연료비는 별도로 현금 정산하지 않는다." },
          { id: "d", text: "전기차 충전기로만 충전해야 한다." },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["직원의 마지막 연료 반납 안내를 확인하세요."],
        explanation: "직원은 차량 인수 시 가득 차 있었으므로 반납 시에도 가득 주유하여 반납해야 한다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-car-2",
    category: "car_rental",
    site: "korean",
    titleKo: "주유소 휘발유 가득 주유와 보너스 카드",
    titleEn: "Refueling Gasoline at Gas Station & Points Card",
    difficulty: 2,
    gradeScope: "K4",
    semester: 1,
    locationKo: "일반 주유소 주유기 앞",
    locationEn: "Gas station fuel pump",
    turns: [
      { speaker: "A", speakerRole: "주유원", text: "어서 오세요! 어떤 유종으로 얼마나 넣어드릴까요?", translation: "Welcome! What fuel type and how much shall I pump?" },
      { speaker: "B", speakerRole: "운전자", text: "휘발유(가솔린)로 가득 채워주시고 주유구는 차량 왼쪽에 있습니다.", translation: "Please fill up with regular unleaded gasoline; fuel door is on the left side of the vehicle." },
      { speaker: "A", speakerRole: "주유원", text: "네, 노란색 노즐 휘발유 가득 주유 시작합니다. 주유 포인트 적립 카드 있으신가요?", translation: "Yes, starting full pump with yellow nozzle gasoline. Do you have a fuel points card?" },
      { speaker: "B", speakerRole: "운전자", text: "여기 신용카드와 모바일 멤버십 바코드입니다. 결제와 적립 같이 부탁드립니다.", translation: "Here is my credit card and mobile membership barcode. Please process payment and point accumulation together." },
    ],
    keyExpressions: [
      { target: "휘발유 가득", meaning: "fill up with gasoline", explanation: "주유소에서 휘발유를 만탱크로 채워달라고 요청하는 표준적인 말입니다." },
      { target: "포인트 적립", meaning: "earning membership points", explanation: "주유 금액의 일정 비율을 회원 포인트로 누적하는 것입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-car-2-q1",
        site: "korean",
        skillId: "dlg.ko.car",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "운전자가 요청한 주유 유종과 수량은 무엇인가요?",
        options: [
          { id: "a", text: "경유(디젤) 3만 원어치" },
          { id: "b", text: "휘발유(가솔린) 가득" },
          { id: "c", text: "LPG 가스 20리터" },
          { id: "d", text: "전기차 급속 충전 50%" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["운전자의 첫 번째 주문 내용을 확인하세요."],
        explanation: "운전자는 휘발유(가솔린)로 가득 채워달라고 명확히 요청했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "ko-dlg-car-3",
    category: "car_rental",
    site: "korean",
    titleKo: "차량 반납 검사와 주행거리 최종 영수증",
    titleEn: "Vehicle Return Inspection & Mileage Final Receipt",
    difficulty: 3,
    gradeScope: "K6",
    semester: 2,
    locationKo: "렌터카 반납 구역",
    locationEn: "Car rental vehicle return lot",
    turns: [
      { speaker: "A", speakerRole: "운전자", text: "차량 반납하러 왔습니다. 차 키는 운전석 대시보드 위에 두었습니다.", translation: "I am here to return the car. I left the key on the driver dashboard." },
      { speaker: "B", speakerRole: "반납 검사원", text: "차량 외관 스크래치와 타이어 상태를 점검하겠습니다. 연료 게이지도 가득 차 있는 것 확인되었습니다.", translation: "I will inspect exterior scratches and tire condition. Fuel gauge verified full as well." },
      { speaker: "A", speakerRole: "운전자", text: "차 안에 두고 내린 개인 물건이 없는지 트렁크도 확인했습니다.", translation: "I also checked the trunk to make sure no personal belongings were left behind." },
      { speaker: "B", speakerRole: "반납 검사원", text: "하이패스 유료도로 톨게이트 이용료 2,400원만 추가 결제하시면 반납 절차가 모두 완료됩니다.", translation: "You only need to settle the 2,400 KRW Hi-Pass toll fee, and the return process will be fully completed." },
    ],
    keyExpressions: [
      { target: "하이패스 요금 정산", meaning: "Hi-Pass highway toll settlement", explanation: "전자 통행료 징수 장치를 통해 이용한 고속도로 요금을 반납 시 후불 정산하는 것입니다." },
      { target: "반납 검사", meaning: "return vehicle inspection", explanation: "차량 파손, 연료 잔량, 분실물 등을 최종 점검하는 절차입니다." },
    ],
    questions: [
      {
        id: "ko-dlg-car-3-q1",
        site: "korean",
        skillId: "dlg.ko.car",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "렌터카 최종 반납 시 추가로 정산된 비용 항목은 무엇인가요?",
        options: [
          { id: "a", text: "연료 부족 벌금" },
          { id: "b", text: "하이패스 유료도로 통행료" },
          { id: "c", text: "차량 청소 비용" },
          { id: "d", text: "주차 위반 과태료" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["반납 검사원의 마지막 정산 안내를 확인하세요."],
        explanation: "반납 검사원은 연료와 외관 점검에 이상이 없으며 하이패스 통행료 2,400원만 정산하면 완료된다고 안내했습니다.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  }
];
