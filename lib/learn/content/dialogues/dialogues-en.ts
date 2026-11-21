import type { SituationalDialogue } from "./types";

export const ENGLISH_SITUATIONAL_DIALOGUES: readonly SituationalDialogue[] = [
  // 1. Hospital (병원·약국)
  {
    id: "en-dlg-hosp-1",
    category: "hospital",
    site: "english",
    titleKo: "약국에서 감기약 구매하기",
    titleEn: "Buying Cold Medicine at a Pharmacy",
    difficulty: 2,
    gradeScope: "E4",
    semester: 1,
    locationKo: "동네 약국 카운터",
    locationEn: "Neighborhood pharmacy counter",
    turns: [
      { speaker: "A", speakerRole: "Pharmacist", text: "Hello, how can I help you today?", translation: "안녕하세요, 오늘 어떻게 도와드릴까요?" },
      { speaker: "B", speakerRole: "Customer", text: "I have had a runny nose and a sore throat since yesterday morning.", translation: "어제 아침부터 콧물이 나고 목이 아파요." },
      { speaker: "A", speakerRole: "Pharmacist", text: "Do you also have a fever or a headache?", translation: "열이나 두통도 있으신가요?" },
      { speaker: "B", speakerRole: "Customer", text: "Just a slight fever. Could you give me something gentle for a cold?", translation: "약간의 미열만 있어요. 순한 감기약으로 주시겠어요?" },
      { speaker: "A", speakerRole: "Pharmacist", text: "Take two tablets with warm water three times a day after meals.", translation: "따뜻한 물과 함께 식후 하루 세 번, 두 알씩 복용하세요." }
    ],
    keyExpressions: [
      { target: "runny nose", meaning: "콧물", explanation: "감기 증상으로 콧물이 흐를 때 쓰는 필수 표현입니다." },
      { target: "sore throat", meaning: "목 통증(인후통)", explanation: "목이 따갑고 아플 때 사용합니다." },
      { target: "after meals", meaning: "식후에", explanation: "약 복용 타이밍을 가리키는 표현입니다." }
    ],
    questions: [
      {
        id: "en-dlg-hosp-1-q1",
        site: "english",
        skillId: "dlg.en.hosp",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What symptom did the customer mention to the pharmacist?",
        options: [
          { id: "a", text: "A sprained ankle" },
          { id: "b", text: "A runny nose and a sore throat" },
          { id: "c", text: "A severe toothache" },
          { id: "d", text: "A high fever with chills" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the customer's first line about their throat.", "Review the key statements in the dialogue carefully."],
        explanation: "The customer explicitly said: 'I have had a runny nose and a sore throat since yesterday morning.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-hosp-2",
    category: "hospital",
    site: "english",
    titleKo: "내과 병원 진료와 증상 설명",
    titleEn: "Clinic Doctor Consultation on Stomach Pain",
    difficulty: 3,
    gradeScope: "M1",
    semester: 2,
    locationKo: "내과 진료실",
    locationEn: "Internal medicine clinic doctor room",
    turns: [
      { speaker: "A", speakerRole: "Doctor", text: "Good morning. Please tell me what seems to be the problem.", translation: "좋은 아침입니다. 어디가 불편하신지 말씀해 주세요." },
      { speaker: "B", speakerRole: "Patient", text: "I've had a sharp stomachache and nausea since last night.", translation: "어젯밤부터 위가 콕콕 쑤시고 메스꺼워요." },
      { speaker: "A", speakerRole: "Doctor", text: "Did you eat anything unusual or very spicy for dinner?", translation: "어제 저녁으로 특이한 음식이나 매운 음식을 드셨나요?" },
      { speaker: "B", speakerRole: "Patient", text: "I had oily takeout pizza right before going to sleep.", translation: "자기 직전에 기름진 배달 피자를 먹었어요." },
      { speaker: "A", speakerRole: "Doctor", text: "It appears to be acute indigestion. I will write a prescription for an antacid.", translation: "급성 소화불량으로 보입니다. 제산제 처방전을 써 드릴게요." }
    ],
    keyExpressions: [
      { target: "nausea", meaning: "메스꺼움, 구역질", explanation: "속이 울렁거릴 때 쓰는 의학/일반 표현입니다." },
      { target: "write a prescription", meaning: "처방전을 작성하다", explanation: "의사가 환자에게 약 처방을 발행할 때 씁니다." }
    ],
    questions: [
      {
        id: "en-dlg-hosp-2-q1",
        site: "english",
        skillId: "dlg.en.hosp",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What medication did the doctor decide to prescribe for the patient?",
        options: [
          { id: "a", text: "Sleeping pills" },
          { id: "b", text: "An antacid for indigestion" },
          { id: "c", text: "Eyedrops" },
          { id: "d", text: "Antibiotic ointment" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the doctor's final diagnosis and treatment.", "Review the key statements in the dialogue carefully."],
        explanation: "The doctor diagnosed acute indigestion and prescribed an antacid.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-hosp-3",
    category: "hospital",
    site: "english",
    titleKo: "처방약 복약 주의사항 상담",
    titleEn: "Prescription Counseling & Drowsiness Warning",
    difficulty: 4,
    gradeScope: "H1",
    semester: 1,
    locationKo: "약국 복약 상담 코너",
    locationEn: "Pharmacy medication counseling counter",
    turns: [
      { speaker: "A", speakerRole: "Pharmacist", text: "Here is your prescribed medicine. Let me go over the important precautions.", translation: "처방된 약 나왔습니다. 중요한 주의사항을 짚어 드릴게요." },
      { speaker: "B", speakerRole: "Patient", text: "Thank you. Are there any specific side effects I should watch out for?", translation: "감사합니다. 특별히 주의해야 할 부작용이 있나요?" },
      { speaker: "A", speakerRole: "Pharmacist", text: "This tablet can cause significant drowsiness, so do not drive or operate machinery.", translation: "이 약은 심한 졸림을 유발할 수 있으므로 운전이나 기계 조작을 피하세요." },
      { speaker: "B", speakerRole: "Patient", text: "Understood. Should I finish the entire course even if I feel better?", translation: "알겠습니다. 몸이 나아져도 처방된 약을 끝까지 다 먹어야 하나요?" },
      { speaker: "A", speakerRole: "Pharmacist", text: "Yes, please complete all five days to prevent symptoms from returning.", translation: "네, 증상 재발을 막기 위해 5일 치를 반드시 모두 복용해 주세요." }
    ],
    keyExpressions: [
      { target: "cause drowsiness", meaning: "졸림을 유발하다", explanation: "약의 주요 부작용 설명 시 핵심 표현입니다." },
      { target: "complete the course", meaning: "(처방약을) 끝까지 다 복용하다", explanation: "처방된 복약 기간을 완전히 채울 때 씁니다." }
    ],
    questions: [
      {
        id: "en-dlg-hosp-3-q1",
        site: "english",
        skillId: "dlg.en.hosp",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "Why did the pharmacist advise the patient against driving?",
        options: [
          { id: "a", text: "Because the medicine costs too much" },
          { id: "b", text: "Because the medicine can cause significant drowsiness" },
          { id: "c", text: "Because driving makes stomachaches worse" },
          { id: "d", text: "Because the patient needs to rest for a whole month" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Find the word 'drowsiness' in the dialogue.", "Review the key statements in the dialogue carefully."],
        explanation: "The pharmacist explicitly warned that the medicine causes drowsiness, which makes driving unsafe.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 2. Airport (공항·입국)
  {
    id: "en-dlg-airp-1",
    category: "airport",
    site: "english",
    titleKo: "공항 터미널 길 찾기와 급행열차 문의",
    titleEn: "Airport Express Train & Terminal Directions",
    difficulty: 2,
    gradeScope: "E5",
    semester: 2,
    locationKo: "중앙역 공항철도 안내 데스크",
    locationEn: "Central station airport express information desk",
    turns: [
      { speaker: "A", speakerRole: "Passenger", text: "Excuse me, which platform does the express train to Terminal 2 depart from?", translation: "실례합니다, 제2터미널로 가는 급행열차는 몇 번 승강장에서 출발하나요?" },
      { speaker: "B", speakerRole: "Agent", text: "The airport express departs from Platform 3 every twenty minutes.", translation: "공항 급행열차는 3번 승강장에서 20분 간격으로 출발합니다." },
      { speaker: "A", speakerRole: "Passenger", text: "How long will the journey take to the international departures hall?", translation: "국제선 출국장까지 이동하는 데 얼마나 걸릴까요?" },
      { speaker: "B", speakerRole: "Agent", text: "It takes exactly thirty-five minutes non-stop. Here is your boarding pass.", translation: "논스톱으로 정확히 35분 걸립니다. 여기 탑승권입니다." }
    ],
    keyExpressions: [
      { target: "express train", meaning: "급행열차", explanation: "중간 정차 없이 빠르게 이동하는 열차입니다." },
      { target: "depart from", meaning: "~에서 출발하다", explanation: "교통수단의 출발 승강장이나 장소를 표현합니다." }
    ],
    questions: [
      {
        id: "en-dlg-airp-1-q1",
        site: "english",
        skillId: "dlg.en.airp",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "From which platform does the airport express train depart?",
        options: [
          { id: "a", text: "Platform 1" },
          { id: "b", text: "Platform 2" },
          { id: "c", text: "Platform 3" },
          { id: "d", text: "Platform 5" }
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["Look at the agent's first reply.", "Review the key statements in the dialogue carefully."],
        explanation: "The agent said: 'The airport express departs from Platform 3 every twenty minutes.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-airp-2",
    category: "airport",
    site: "english",
    titleKo: "항공사 체크인과 위탁 수하물 부치기",
    titleEn: "Flight Check-in & Checked Baggage Drop",
    difficulty: 3,
    gradeScope: "M2",
    semester: 1,
    locationKo: "국제공항 항공사 체크인 카운터",
    locationEn: "International airport airline check-in counter",
    turns: [
      { speaker: "A", speakerRole: "Airline Agent", text: "Good morning! May I see your passport and flight confirmation?", translation: "좋은 아침입니다! 여권과 비행기 예약 확인서를 보여주시겠어요?" },
      { speaker: "B", speakerRole: "Traveler", text: "Here you go. Could I please request an aisle seat near the front?", translation: "여기 있습니다. 앞쪽 복도 좌석으로 요청할 수 있을까요?" },
      { speaker: "A", speakerRole: "Airline Agent", text: "Certainly, row 12 aisle is available. How many bags are you checking in today?", translation: "네, 12열 복도 좌석 가능합니다. 오늘 부치실 가방은 몇 개인가요?" },
      { speaker: "B", speakerRole: "Traveler", text: "Just this one large suitcase. It weighs under twenty kilograms.", translation: "이 큰 여행 가방 하나입니다. 무게는 20kg 미만이에요." },
      { speaker: "A", speakerRole: "Airline Agent", text: "Great, your gate is B18. Boarding starts at 10:15 sharp.", translation: "좋습니다, 게이트는 B18번입니다. 탑승은 10시 15분 정각에 시작됩니다." }
    ],
    keyExpressions: [
      { target: "aisle seat", meaning: "복도 쪽 좌석", explanation: "창가 쪽(window seat)과 대비되는 통로 좌석입니다." },
      { target: "check in bags", meaning: "수하물을 부치다", explanation: "비행기 화물칸에 짐을 위탁할 때 쓰는 표준 표현입니다." }
    ],
    questions: [
      {
        id: "en-dlg-airp-2-q1",
        site: "english",
        skillId: "dlg.en.airp",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What type of seat did the traveler request at the counter?",
        options: [
          { id: "a", text: "An exit row window seat" },
          { id: "b", text: "An aisle seat near the front" },
          { id: "c", text: "The very back middle seat" },
          { id: "d", text: "First class bed seat" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the traveler's question about their seat preference.", "Review the key statements in the dialogue carefully."],
        explanation: "The traveler asked: 'Could I please request an aisle seat near the front?'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-airp-3",
    category: "airport",
    site: "english",
    titleKo: "입국심사 인터뷰와 체류 목적 답변",
    titleEn: "Immigration Interview & Purpose of Visit",
    difficulty: 4,
    gradeScope: "H2",
    semester: 2,
    locationKo: "국제공항 입국심사대",
    locationEn: "Airport immigration border control desk",
    turns: [
      { speaker: "A", speakerRole: "Officer", text: "Passport please. What is the primary purpose of your trip?", translation: "여권 주세요. 이번 여행의 주된 목적이 무엇입니까?" },
      { speaker: "B", speakerRole: "Visitor", text: "I am here as an exchange student for one academic semester at the university.", translation: "저는 대학교에서 한 학기 동안 교환학생으로 수학하기 위해 왔습니다." },
      { speaker: "A", speakerRole: "Officer", text: "Do you have documentation showing your university enrollment and lodging?", translation: "대학교 등록 서류와 숙소 증명서를 소지하고 계신가요?" },
      { speaker: "B", speakerRole: "Visitor", text: "Yes, here are my acceptance letter and campus dormitory booking confirmation.", translation: "네, 여기 입학허가서와 캠퍼스 기숙사 예약 확인증입니다." },
      { speaker: "A", speakerRole: "Officer", text: "Everything looks in order. Look into the camera for facial verification. Welcome!", translation: "모두 정상입니다. 안면 인증을 위해 카메라를 응시해 주세요. 입국을 환영합니다!" }
    ],
    keyExpressions: [
      { target: "primary purpose", meaning: "주된 목적", explanation: "입국심사관이 방문 사유를 물을 때 핵심적으로 씁니다." },
      { target: "acceptance letter", meaning: "입학허가서", explanation: "해외 유학이나 연수 시 입국심사 필수 제출 서류입니다." }
    ],
    questions: [
      {
        id: "en-dlg-airp-3-q1",
        site: "english",
        skillId: "dlg.en.airp",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "What was the visitor's purpose of entering the country?",
        options: [
          { id: "a", text: "Attending a friend's birthday party" },
          { id: "b", text: "Studying as an exchange student for one semester" },
          { id: "c", text: "Purchasing commercial real estate" },
          { id: "d", text: "Working at a construction site" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the visitor's first answer about 'exchange student'.", "Review the key statements in the dialogue carefully."],
        explanation: "The visitor stated they are an exchange student studying at the university for one semester.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 3. Store (상점·쇼핑)
  {
    id: "en-dlg-stor-1",
    category: "store",
    site: "english",
    titleKo: "편의점에서 음료수 구매와 결제",
    titleEn: "Buying a Drink at a Convenience Store",
    difficulty: 1,
    gradeScope: "E2",
    semester: 1,
    locationKo: "편의점 계산대",
    locationEn: "Corner convenience store checkout counter",
    turns: [
      { speaker: "A", speakerRole: "Customer", text: "Excuse me, how much is this sparkling water?", translation: "실례합니다, 이 탄산수 얼마인가요?" },
      { speaker: "B", speakerRole: "Cashier", text: "It's two dollars and fifty cents. Will that be all for today?", translation: "2달러 50센트입니다. 오늘 구매하실 건 이게 전부인가요?" },
      { speaker: "A", speakerRole: "Customer", text: "Yes, can I pay by contactless debit card?", translation: "네, 비접촉식 체크카드로 결제할 수 있나요?" },
      { speaker: "B", speakerRole: "Cashier", text: "Sure, just tap your card right here on the terminal. Would you like your receipt?", translation: "그럼요, 단말기 여기에 카드를 대주세요. 영수증 필요하세요?" },
      { speaker: "A", speakerRole: "Customer", text: "No receipt needed, thank you. Have a nice day!", translation: "영수증은 안 주셔도 돼요, 감사합니다. 좋은 하루 보내세요!" }
    ],
    keyExpressions: [
      { target: "how much is...", meaning: "~은 얼마인가요?", explanation: "가격 문의 시 가장 널리 쓰이는 기본 영어 표현입니다." },
      { target: "tap your card", meaning: "카드를 (단말기에) 대다", explanation: "비접촉식 카드 결제 시 쓰는 표현입니다." }
    ],
    questions: [
      {
        id: "en-dlg-stor-1-q1",
        site: "english",
        skillId: "dlg.en.stor",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "How much did the sparkling water cost?",
        options: [
          { id: "a", text: "One dollar" },
          { id: "b", text: "Two dollars and fifty cents" },
          { id: "c", text: "Five dollars" },
          { id: "d", text: "Ten dollars" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the cashier's reply to the customer's question.", "Review the key statements in the dialogue carefully."],
        explanation: "The cashier stated: 'It's two dollars and fifty cents.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-stor-2",
    category: "store",
    site: "english",
    titleKo: "옷가게에서 사이즈 확인과 피팅룸 착용",
    titleEn: "Trying Sizes in a Clothing Store",
    difficulty: 2,
    gradeScope: "E4",
    semester: 1,
    locationKo: "캐주얼 의류 매장",
    locationEn: "Casual apparel store sales floor",
    turns: [
      { speaker: "A", speakerRole: "Shopper", text: "Hi! Do you have this navy hoodie in a medium size?", translation: "안녕하세요! 이 네이비 후드티 M 사이즈 있나요?" },
      { speaker: "B", speakerRole: "Associate", text: "Let me check our stock room. Yes, here is a medium for you!", translation: "창고 재고를 확인해 볼게요. 네, 여기 M 사이즈 있습니다!" },
      { speaker: "A", speakerRole: "Shopper", text: "Thank you. Where can I try this on?", translation: "감사합니다. 어디서 입어볼 수 있나요?" },
      { speaker: "B", speakerRole: "Associate", text: "The fitting rooms are located straight ahead around the corner.", translation: "피팅룸은 모퉁이를 돌아 직진하시면 있습니다." },
      { speaker: "A", speakerRole: "Shopper", text: "It fits perfectly. I will take it!", translation: "딱 맞네요. 이걸로 살게요!" }
    ],
    keyExpressions: [
      { target: "try this on", meaning: "이것을 입어보다", explanation: "구매 전에 옷이나 신발을 착용해볼 때 씁니다." },
      { target: "fits perfectly", meaning: "사이즈가 딱 맞다", explanation: "옷의 품이나 길이가 몸에 잘 어울릴 때 씁니다." }
    ],
    questions: [
      {
        id: "en-dlg-stor-2-q1",
        site: "english",
        skillId: "dlg.en.stor",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What item and size did the shopper want to try on?",
        options: [
          { id: "a", text: "A green sweater in size large" },
          { id: "b", text: "A navy hoodie in size medium" },
          { id: "c", text: "A white pair of jeans in size small" },
          { id: "d", text: "A leather jacket in size XL" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the shopper's opening question.", "Review the key statements in the dialogue carefully."],
        explanation: "The shopper asked for a navy hoodie in a medium size.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-stor-3",
    category: "store",
    site: "english",
    titleKo: "영수증 지참 후 제품 교환 및 환불 요청",
    titleEn: "Product Exchange & Refund at Customer Service",
    difficulty: 3,
    gradeScope: "M1",
    semester: 2,
    locationKo: "백화점 고객 서비스 데스크",
    locationEn: "Department store customer service counter",
    turns: [
      { speaker: "A", speakerRole: "Customer", text: "Hello, I purchased this backpack two days ago, but the strap is defective.", translation: "안녕하세요, 이틀 전에 이 백팩을 샀는데 어깨끈에 결함이 있어요." },
      { speaker: "B", speakerRole: "Representative", text: "I am so sorry about that. Do you have the original store receipt with you?", translation: "불편을 드려 죄송합니다. 매장 원본 영수증을 가지고 계신가요?" },
      { speaker: "A", speakerRole: "Customer", text: "Yes, here is the printed receipt and the tag is still attached.", translation: "네, 여기 종이 영수증이 있고 태그도 그대로 붙어 있습니다." },
      { speaker: "B", speakerRole: "Representative", text: "Would you prefer a brand new replacement or a full refund back to your card?", translation: "새 제품으로 교환해 드릴까요, 아니면 카드로 전액 환불을 원하시나요?" },
      { speaker: "A", speakerRole: "Customer", text: "I'd prefer a full refund to my card, please.", translation: "카드로 전액 환불해 주시면 좋겠습니다." }
    ],
    keyExpressions: [
      { target: "tag is attached", meaning: "가격표/라벨이 붙어 있다", explanation: "미사용 제품 환불/교환 시 필수 조건입니다." },
      { target: "full refund", meaning: "전액 환불", explanation: "결제 금액 100%를 돌려받을 때 씁니다." }
    ],
    questions: [
      {
        id: "en-dlg-stor-3-q1",
        site: "english",
        skillId: "dlg.en.stor",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What did the customer choose between an exchange and a refund?",
        options: [
          { id: "a", text: "A store credit coupon" },
          { id: "b", text: "A full refund to their card" },
          { id: "c", text: "A brand new replacement bag" },
          { id: "d", text: "A free repair service" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the customer's final sentence.", "Review the key statements in the dialogue carefully."],
        explanation: "The customer said: 'I'd prefer a full refund to my card, please.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 4. Classroom (교실·학교)
  {
    id: "en-dlg-cls-1",
    category: "classroom",
    site: "english",
    titleKo: "교실에서 짝꿍과 학용품 빌리기",
    titleEn: "Borrowing Stationery from a Desk Partner",
    difficulty: 1,
    gradeScope: "E1",
    semester: 2,
    locationKo: "초등학교 교실 자리",
    locationEn: "Elementary school desk partner seats",
    turns: [
      { speaker: "A", speakerRole: "Emma", text: "Hi Leo, could I borrow an extra pencil? Mine broke.", translation: "안녕 레오야, 연필 한 자루만 빌려줄 수 있어? 내 것이 부러졌어." },
      { speaker: "B", speakerRole: "Leo", text: "Sure! I have two sharpened yellow pencils in my case.", translation: "물론이지! 내 필통에 깎아둔 노란 연필 두 자루 있어." },
      { speaker: "A", speakerRole: "Emma", text: "Thanks so much! Do you also have a ruler for math class?", translation: "정말 고마워! 수학 시간에 쓸 자도 혹시 있니?" },
      { speaker: "B", speakerRole: "Leo", text: "Yes, we can put the ruler between our desks and share it.", translation: "응, 우리 책상 사이에 두고 같이 쓰자." }
    ],
    keyExpressions: [
      { target: "borrow", meaning: "빌리다", explanation: "남의 물건을 잠시 빌려 쓸 때 쓰는 기본 동사입니다." },
      { target: "share", meaning: "공유하다, 함께 쓰다", explanation: "함께 물건을 나누어 쓸 때 씁니다." }
    ],
    questions: [
      {
        id: "en-dlg-cls-1-q1",
        site: "english",
        skillId: "dlg.en.cls",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "Why did Emma need to borrow a pencil from Leo?",
        options: [
          { id: "a", text: "Because hers broke" },
          { id: "b", text: "Because she left her bag on the bus" },
          { id: "c", text: "Because she wanted a red pen" },
          { id: "d", text: "Because the teacher collected all pencils" }
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Check Emma's first sentence.", "Review the key statements in the dialogue carefully."],
        explanation: "Emma explained: 'could I borrow an extra pencil? Mine broke.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-cls-2",
    category: "classroom",
    site: "english",
    titleKo: "선생님께 문제 질문과 에세이 제출일 확인",
    titleEn: "Asking the Teacher Questions & Essay Deadline",
    difficulty: 2,
    gradeScope: "E3",
    semester: 1,
    locationKo: "교실 교탁 앞",
    locationEn: "In front of the teacher desk in classroom",
    turns: [
      { speaker: "A", speakerRole: "Student", text: "Excuse me, Ms. Davis. Could you please clarify step 3 on the science worksheet?", translation: "선생님 실례합니다. 과학 학습지 3번 단계를 다시 설명해 주실 수 있나요?" },
      { speaker: "B", speakerRole: "Teacher", text: "Of course! You need to measure the plant's height in centimeters before watering it.", translation: "물론이지! 물을 주기 전에 식물의 키를 센티미터 단위로 먼저 측정해야 한단다." },
      { speaker: "A", speakerRole: "Student", text: "I see now! And when is our final project report due?", translation: "이제 이해했어요! 그리고 최종 프로젝트 보고서 마감일은 언제인가요?" },
      { speaker: "B", speakerRole: "Teacher", text: "It is due this coming Friday by 3 PM in the classroom dropbox.", translation: "이번 주 금요일 오후 3시까지 교실 제출함에 넣으면 된단다." }
    ],
    keyExpressions: [
      { target: "clarify", meaning: "명확히 설명해주다", explanation: "이해하기 어렵거나 모호한 점을 다시 묻고 답할 때 씁니다." },
      { target: "is due", meaning: "마감이다, 제출해야 한다", explanation: "과제나 보고서의 마감 기한을 가리키는 필수 표현입니다." }
    ],
    questions: [
      {
        id: "en-dlg-cls-2-q1",
        site: "english",
        skillId: "dlg.en.cls",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "When is the final science project report due?",
        options: [
          { id: "a", text: "Today before noon" },
          { id: "b", text: "Tomorrow morning at 9 AM" },
          { id: "c", text: "This coming Friday by 3 PM" },
          { id: "d", text: "Next month after vacation" }
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["Look at the teacher's final statement.", "Review the key statements in the dialogue carefully."],
        explanation: "The teacher said: 'It is due this coming Friday by 3 PM in the classroom dropbox.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-cls-3",
    category: "classroom",
    site: "english",
    titleKo: "조별 과제 발표 준비와 역할 분담",
    titleEn: "Group Project Coordination & Role Division",
    difficulty: 3,
    gradeScope: "M2",
    semester: 2,
    locationKo: "학교 도서관 스터디 테이블",
    locationEn: "School library collaboration study table",
    turns: [
      { speaker: "A", speakerRole: "Team Leader", text: "Our history presentation on ancient trade routes is next Tuesday. Let's assign sections.", translation: "고대 무역로에 관한 역사 발표가 다음 주 화요일이야. 역할을 나누자." },
      { speaker: "B", speakerRole: "Team Member", text: "I can collect maps and research the Silk Road trading goods.", translation: "내가 지도를 수집하고 실크로드 무역 품목 자료를 조사할게." },
      { speaker: "A", speakerRole: "Team Leader", text: "Awesome. I will build the digital slide deck and draft the speaking outline.", translation: "좋아. 내가 디지털 슬라이드를 제작하고 발표 개요 초안을 작성할게." },
      { speaker: "B", speakerRole: "Team Member", text: "Let's do a rehearsal in the study room on Monday afternoon.", translation: "월요일 오후에 스터디룸에서 리허설 한번 해보자." }
    ],
    keyExpressions: [
      { target: "assign sections", meaning: "역할/구간을 분담하다", explanation: "팀 프로젝트에서 업무를 배정할 때 씁니다." },
      { target: "speaking outline", meaning: "발표 개요 대본", explanation: "발표 순서와 핵심 내용을 정리한 대본입니다." }
    ],
    questions: [
      {
        id: "en-dlg-cls-3-q1",
        site: "english",
        skillId: "dlg.en.cls",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What task did team member B volunteer to take on?",
        options: [
          { id: "a", text: "Designing the presentation slides" },
          { id: "b", text: "Researching maps and Silk Road trading goods" },
          { id: "c", text: "Introducing the teacher to the audience" },
          { id: "d", text: "Grading other student essays" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at B's reply to assigning sections.", "Review the key statements in the dialogue carefully."],
        explanation: "Team member B said: 'I can collect maps and research the Silk Road trading goods.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 5. Amusement Park (놀이공원)
  {
    id: "en-dlg-park-1",
    category: "amusement_park",
    site: "english",
    titleKo: "놀이공원 매표소에서 자유이용권 발권",
    titleEn: "Ticket Booth & All-Day Ride Passes",
    difficulty: 2,
    gradeScope: "E4",
    semester: 2,
    locationKo: "테마파크 정문 매표소",
    locationEn: "Theme park front entrance ticket booth",
    turns: [
      { speaker: "A", speakerRole: "Visitor", text: "Good morning! We'd like two general admission all-day ride passes, please.", translation: "좋은 아침입니다! 성인 종일 자유이용권 2장 부탁드립니다." },
      { speaker: "B", speakerRole: "Cashier", text: "Welcome to Adventure Island! Do you have any student ID or member discount vouchers?", translation: "어드벤처 아일랜드에 오신 것을 환영합니다! 학생증이나 회원 할인 쿠폰이 있으신가요?" },
      { speaker: "A", speakerRole: "Visitor", text: "Yes, here are our two school student identification cards.", translation: "네, 여기 저희 학생증 2장 있습니다." },
      { speaker: "B", speakerRole: "Cashier", text: "That qualifies you for our 25% youth discount. Here are your wristband tickets!", translation: "25% 청소년 할인이 적용됩니다. 여기 손목 밴드 티켓입니다!" }
    ],
    keyExpressions: [
      { target: "all-day ride pass", meaning: "종일 자유이용권", explanation: "놀이공원 어트랙션을 무제한 탑승할 수 있는 티켓입니다." },
      { target: "wristband ticket", meaning: "손목 밴드 티켓", explanation: "입장 및 탑승 확인용 손목 팔찌입니다." }
    ],
    questions: [
      {
        id: "en-dlg-park-1-q1",
        site: "english",
        skillId: "dlg.en.park",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What discount did the visitors receive by showing student IDs?",
        options: [
          { id: "a", text: "Free admission for one year" },
          { id: "b", text: "A 25% youth discount on ride passes" },
          { id: "c", text: "A birthday gift voucher" },
          { id: "d", text: "Free cotton candy coupon" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the cashier's last sentence.", "Review the key statements in the dialogue carefully."],
        explanation: "The cashier stated: 'That qualifies you for our 25% youth discount.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-park-2",
    category: "amusement_park",
    site: "english",
    titleKo: "롤러코스터 대기 시간과 탑승 안전 수칙",
    titleEn: "Roller Coaster Wait Time & Boarding Safety",
    difficulty: 3,
    gradeScope: "E6",
    semester: 1,
    locationKo: "롤러코스터 탑승 대기선 입구",
    locationEn: "Roller coaster ride entrance queue",
    turns: [
      { speaker: "A", speakerRole: "Guest", text: "Excuse me, how long is the estimated standby wait time for this coaster?", translation: "실례합니다, 이 롤러코스터의 예상 대기 시간이 얼마나 되나요?" },
      { speaker: "B", speakerRole: "Ride Attendant", text: "The regular line is currently forty minutes. Fast lane passes enter through the blue gate.", translation: "일반 대기줄은 현재 40분입니다. 패스트 레인 이용객은 파란 문으로 입장합니다." },
      { speaker: "A", speakerRole: "Guest", text: "Are glasses and loose hats permitted on the ride?", translation: "안경이나 모자를 착용하고 탑승할 수 있나요?" },
      { speaker: "B", speakerRole: "Ride Attendant", text: "No, all loose articles must be deposited in the complimentary platform lockers.", translation: "아닙니다, 모든 소지품은 승강장 무료 사물함에 보관하셔야 합니다." },
      { speaker: "A", speakerRole: "Guest", text: "Understood, we will secure our belongings before boarding.", translation: "알겠습니다, 탑승 전에 짐을 안전하게 보관할게요." }
    ],
    keyExpressions: [
      { target: "standby wait time", meaning: "일반 대기 시간", explanation: "예약 없이 줄을 서서 기다리는 시간을 말합니다." },
      { target: "loose articles", meaning: "떨어지기 쉬운 소지품(모자, 안경 등)", explanation: "놀이기구 탑승 시 낙하 위험이 있는 물품을 뜻합니다." }
    ],
    questions: [
      {
        id: "en-dlg-park-2-q1",
        site: "english",
        skillId: "dlg.en.park",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What must guests do with loose hats and glasses before boarding?",
        options: [
          { id: "a", text: "Hold them firmly in their hands" },
          { id: "b", text: "Deposit them in platform lockers" },
          { id: "c", text: "Throw them away in the trash bin" },
          { id: "d", text: "Mail them home via express post" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the attendant's instructions about loose articles.", "Review the key statements in the dialogue carefully."],
        explanation: "The ride attendant stated that all loose articles must be deposited in complimentary lockers for safety.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-park-3",
    category: "amusement_park",
    site: "english",
    titleKo: "테마파크 지도와 식음료 및 편의시설 안내",
    titleEn: "Theme Park Map & Food Court Amenities",
    difficulty: 3,
    gradeScope: "M1",
    semester: 2,
    locationKo: "테마파크 중앙 광장 안내 센터",
    locationEn: "Theme park central plaza information kiosk",
    turns: [
      { speaker: "A", speakerRole: "Visitor", text: "Pardon me, where can we find the nearest dining pavilion and water refilling station?", translation: "실례합니다, 가장 가까운 식당가와 식수대가 어디에 있나요?" },
      { speaker: "B", speakerRole: "Guide", text: "Head straight toward the windmill, turn right past the carousel, and the food hall is on your left.", translation: "풍차 쪽으로 직진하시다가 회전목마를 지나 우회전하시면 왼쪽에 푸드홀이 있습니다." },
      { speaker: "A", speakerRole: "Visitor", text: "Do they have vegetarian and allergy-friendly meal choices there?", translation: "그곳에 채식주의자용 및 알레르기 배려 식단도 준비되어 있나요?" },
      { speaker: "B", speakerRole: "Guide", text: "Yes, stalls 3 and 4 specialize in fresh salads and nut-free sandwiches.", translation: "네, 3번과 4번 매장이 신선한 샐러드와 견과류 무첨가 샌드위치 전문입니다." }
    ],
    keyExpressions: [
      { target: "dining pavilion", meaning: "식당가 / 푸드홀", explanation: "테마파크 내 음식점들이 모여 있는 구역입니다." },
      { target: "refilling station", meaning: "식수 보충대 / 음수대", explanation: "텀블러나 물병에 물을 담을 수 있는 장소입니다." }
    ],
    questions: [
      {
        id: "en-dlg-park-3-q1",
        site: "english",
        skillId: "dlg.en.park",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "Where can visitors find fresh salads and nut-free food choices in the park?",
        options: [
          { id: "a", text: "At the entrance ticket counter" },
          { id: "b", text: "At stalls 3 and 4 in the dining pavilion" },
          { id: "c", text: "Inside the roller coaster locker room" },
          { id: "d", text: "Outside the park subway station" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the guide's final sentence about stalls 3 and 4.", "Review the key statements in the dialogue carefully."],
        explanation: "The park guide explained that stalls 3 and 4 in the food hall specialize in salads and nut-free sandwiches.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 6. Restaurant (식당·주문)
  {
    id: "en-dlg-rest-1",
    category: "restaurant",
    site: "english",
    titleKo: "캐주얼 레스토랑에서 2인 식사 주문",
    titleEn: "Ordering Lunch for Two at a Casual Diner",
    difficulty: 1,
    gradeScope: "E2",
    semester: 1,
    locationKo: "패밀리 레스토랑 부스 테이블",
    locationEn: "Family diner booth table",
    turns: [
      { speaker: "A", speakerRole: "Server", text: "Hi there! Are you ready to order, or do you need another minute?", translation: "안녕하세요! 주문하시겠어요, 아니면 조금 더 시간이 필요하신가요?" },
      { speaker: "B", speakerRole: "Diner", text: "We are ready. We would like a grilled chicken salad and a tomato pasta, please.", translation: "주문할게요. 그릴드 치킨 샐러드 하나와 토마토 파스타 하나 주세요." },
      { speaker: "A", speakerRole: "Server", text: "Sounds great! Would you like still water or iced water to drink?", translation: "좋습니다! 음료로는 상온 생수와 얼음물 중 어떤 것으로 드릴까요?" },
      { speaker: "B", speakerRole: "Diner", text: "Two glasses of iced water with lemon slices, please.", translation: "레몬 조각을 넣은 얼음물 두 잔 부탁드립니다." }
    ],
    keyExpressions: [
      { target: "ready to order", meaning: "주문할 준비가 되다", explanation: "웨이터가 주문을 받을 때 묻는 대표적 표현입니다." },
      { target: "iced water", meaning: "얼음물", explanation: "얼음이 들어간 시원한 물을 주문할 때 씁니다." }
    ],
    questions: [
      {
        id: "en-dlg-rest-1-q1",
        site: "english",
        skillId: "dlg.en.rest",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "What two main dishes did the diner order?",
        options: [
          { id: "a", text: "A hamburger and French fries" },
          { id: "b", text: "A grilled chicken salad and a tomato pasta" },
          { id: "c", text: "Steak and mashed potatoes" },
          { id: "d", text: "Seafood soup and fried rice" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the diner's first reply.", "Review the key statements in the dialogue carefully."],
        explanation: "The diner ordered: 'a grilled chicken salad and a tomato pasta, please.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-rest-2",
    category: "restaurant",
    site: "english",
    titleKo: "추천 메뉴 문의와 식단 맞춤 요청",
    titleEn: "Menu Recommendations & Custom Dietary Requests",
    difficulty: 2,
    gradeScope: "E4",
    semester: 2,
    locationKo: "이탈리안 비스트로 테이블",
    locationEn: "Italian bistro dining table",
    turns: [
      { speaker: "A", speakerRole: "Guest", text: "What is the chef's special recommendation for pasta this evening?", translation: "오늘 저녁 주방장 특선 추천 파스타는 무엇인가요?" },
      { speaker: "B", speakerRole: "Server", text: "Our handmade mushroom ravioli in garlic olive oil is the house favorite.", translation: "마늘 올리브 오일 소스의 수제 버섯 라비올리가 대표 인기 메뉴입니다." },
      { speaker: "A", speakerRole: "Guest", text: "That sounds wonderful. Could we get the sauce with less salt and extra basil?", translation: "훌륭하네요. 소스에 소금을 조금 덜 넣고 바질을 더 넣어주실 수 있나요?" },
      { speaker: "B", speakerRole: "Server", text: "Absolutely, I will inform the kitchen right away. Bread rolls are on the way.", translation: "물론입니다, 주방에 바로 전달하겠습니다. 식전 빵이 곧 나옵니다." }
    ],
    keyExpressions: [
      { target: "special recommendation", meaning: "특선 추천 요리", explanation: "식당의 주력 메뉴나 오늘의 요리를 물을 때 씁니다." },
      { target: "less salt", meaning: "소금을 적게, 싱겁게", explanation: "간을 조절해 달라고 요청할 때 쓰는 실전 표현입니다." }
    ],
    questions: [
      {
        id: "en-dlg-rest-2-q1",
        site: "english",
        skillId: "dlg.en.rest",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "How did the guest customize their pasta sauce?",
        options: [
          { id: "a", text: "With extra cheese and hot chili oil" },
          { id: "b", text: "With less salt and extra basil" },
          { id: "c", text: "Without any olive oil" },
          { id: "d", text: "With sweetened whipped cream" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the guest's second request to the server.", "Review the key statements in the dialogue carefully."],
        explanation: "The guest asked: 'Could we get the sauce with less salt and extra basil?'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-rest-3",
    category: "restaurant",
    site: "english",
    titleKo: "계산서 요청과 카드 분할 결제",
    titleEn: "Requesting the Bill & Split Card Payment",
    difficulty: 3,
    gradeScope: "M3",
    semester: 1,
    locationKo: "레스토랑 테이블 계산",
    locationEn: "Restaurant dining table check settlement",
    turns: [
      { speaker: "A", speakerRole: "Diner", text: "Could we please have the bill whenever you have a chance?", translation: "여유 되실 때 계산서 좀 가져다주시겠어요?" },
      { speaker: "B", speakerRole: "Server", text: "Here is your bill. Take your time, whenever you are ready.", translation: "여기 계산서입니다. 편하실 때 말씀해 주세요." },
      { speaker: "A", speakerRole: "Diner", text: "Can we split the total evenly between two credit cards?", translation: "총금액을 신용카드 두 장으로 반반 결제할 수 있을까요?" },
      { speaker: "B", speakerRole: "Server", text: "Certainly. The total is sixty dollars, so that will be thirty dollars each.", translation: "물론입니다. 총 60달러이니 각각 30달러씩 결제하겠습니다." },
      { speaker: "A", speakerRole: "Diner", text: "Here are the cards. Thank you for the wonderful service and meal!", translation: "여기 카드 있습니다. 훌륭한 서비스와 음식 감사드립니다!" }
    ],
    keyExpressions: [
      { target: "have the bill", meaning: "계산서를 받다", explanation: "식사를 마친 후 계산서를 요청할 때 쓰는 정중한 표현입니다." },
      { target: "split the total evenly", meaning: "총금액을 균등하게 분할하다", explanation: "비용을 정확히 n분의 1로 나눌 때 씁니다." }
    ],
    questions: [
      {
        id: "en-dlg-rest-3-q1",
        site: "english",
        skillId: "dlg.en.rest",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "How much was charged to each card when the bill was split evenly?",
        options: [
          { id: "a", text: "Twenty dollars" },
          { id: "b", text: "Thirty dollars" },
          { id: "c", text: "Sixty dollars" },
          { id: "d", text: "Forty-five dollars" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Divide the total  by two.", "Review the key statements in the dialogue carefully."],
        explanation: "The server stated: 'The total is sixty dollars, so that will be thirty dollars each.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },

  // 7. Wedding (결혼식·예절)
  {
    id: "en-dlg-wed-1",
    category: "wedding",
    site: "english",
    titleKo: "결혼식 청첩장 전달과 축하 인사",
    titleEn: "Delivering Wedding Invitation & RSVP Reply",
    difficulty: 3,
    gradeScope: "M2",
    semester: 2,
    locationKo: "직장 카페테리아 라운지",
    locationEn: "Workplace cafeteria lounge",
    turns: [
      { speaker: "A", speakerRole: "Groom-to-be", text: "Rachel, my fiancé and I are getting married next month on Saturday the 14th.", translation: "레이첼, 제 약혼자와 제가 다음 달 14일 토요일에 결혼식을 올립니다." },
      { speaker: "B", speakerRole: "Colleague", text: "What fantastic news! Congratulations to both of you! Where will the ceremony be held?", translation: "정말 환상적인 소식이네요! 두 분 모두 진심으로 축하해요! 예식은 어디서 열리나요?" },
      { speaker: "A", speakerRole: "Groom-to-be", text: "At the Grand Botanical Pavilion. Here is your invitation with the map and RSVP card.", translation: "그랜드 보태니컬 파빌리온입니다. 지도와 회신 카드가 동봉된 청첩장 전해드려요." },
      { speaker: "B", speakerRole: "Colleague", text: "I would not miss it for the world. I will send my RSVP confirmation this evening!", translation: "무슨 일이 있어도 꼭 갈게요. 오늘 저녁에 바로 참석 회신 보낼게요!" }
    ],
    keyExpressions: [
      { target: "getting married", meaning: "결혼식을 올리다", explanation: "결혼 소식을 전할 때 가장 자연스러운 회화 표현입니다." },
      { target: "RSVP", meaning: "참석 여부 회신", explanation: "프랑스어 répondez s'il vous plaît에서 유래한 초대에 대한 회신 요청입니다." }
    ],
    questions: [
      {
        id: "en-dlg-wed-1-q1",
        site: "english",
        skillId: "dlg.en.wed",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What was colleague B's reaction to the wedding invitation?",
        options: [
          { id: "a", text: "Politely declining due to an overseas business trip" },
          { id: "b", text: "Joyfully congratulating and promising to attend" },
          { id: "c", text: "Asking to reschedule the ceremony date" },
          { id: "d", text: "Ignoring the invitation card entirely" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at colleague B's reply: 'I would not miss it for the world.'", "Review the key statements in the dialogue carefully."],
        explanation: "Colleague B enthusiastically congratulated the groom and promised not to miss the celebration.",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-wed-2",
    category: "wedding",
    site: "english",
    titleKo: "예식장 안내 데스크와 축하 선물 전달",
    titleEn: "Wedding Welcome Desk & Gift Table Etiquette",
    difficulty: 4,
    gradeScope: "H1",
    semester: 1,
    locationKo: "웨딩홀 로비 웰컴 데스크",
    locationEn: "Wedding hall lobby welcome reception desk",
    turns: [
      { speaker: "A", speakerRole: "Guest", text: "Hello! Is this the reception table where guests sign the commemorative book?", translation: "안녕하세요! 하객 기념 방명록을 서명하는 접수대가 이곳이 맞나요?" },
      { speaker: "B", speakerRole: "Usher", text: "Yes, welcome! Please sign your name and leave your message card for the couple.", translation: "네, 어서 오세요! 성함을 서명하시고 신랑 신부를 위한 축하 카드도 남겨주세요." },
      { speaker: "A", speakerRole: "Guest", text: "Here is our congratulatory envelope. Which direction is the photo backdrop?", translation: "여기 저희 축하 봉투입니다. 포토존은 어느 방향으로 가면 되나요?" },
      { speaker: "B", speakerRole: "Usher", text: "Right through those glass doors. The ceremony begins in twenty minutes.", translation: "저 유리문 통과하시면 바로 나옵니다. 예식은 20분 후에 시작됩니다." }
    ],
    keyExpressions: [
      { target: "commemorative book", meaning: "기념 방명록", explanation: "하객들이 이름을 서명하고 축하 인사를 남기는 책입니다." },
      { target: "congratulatory envelope", meaning: "축하 봉투 / 축의금 봉투", explanation: "결혼을 축하하며 마음을 전하는 봉투입니다." }
    ],
    questions: [
      {
        id: "en-dlg-wed-2-q1",
        site: "english",
        skillId: "dlg.en.wed",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "How much time remains before the wedding ceremony begins?",
        options: [
          { id: "a", text: "Five minutes" },
          { id: "b", text: "Twenty minutes" },
          { id: "c", text: "One hour" },
          { id: "d", text: "Two hours" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the usher's final sentence.", "Review the key statements in the dialogue carefully."],
        explanation: "The usher stated: 'The ceremony begins in twenty minutes.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-wed-3",
    category: "wedding",
    site: "english",
    titleKo: "신랑·신부에게 전하는 정중한 축하 덕담",
    titleEn: "Warm Wishes & Sincere Congratulations to Newlyweds",
    difficulty: 5,
    gradeScope: "H3",
    semester: 2,
    locationKo: "연회장 신랑·신부 테이블 앞",
    locationEn: "In front of the newlyweds banquet table",
    turns: [
      { speaker: "A", speakerRole: "Guest", text: "Congratulations to you both! The ceremony was genuinely touching and beautiful.", translation: "두 분 모두 축하드립니다! 예식이 정말 감동적이고 아름다웠어요." },
      { speaker: "B", speakerRole: "Couple", text: "Thank you so much for traveling this long distance to celebrate with us today.", translation: "오늘 저희와 함께 축하해 주시기 위해 먼 길 와주셔서 진심으로 감사드립니다." },
      { speaker: "A", speakerRole: "Guest", text: "May your marriage be blessed with lifelong companionship, mutual respect, and abundant joy.", translation: "두 분의 결혼 생활이 평생의 우정, 상호 존중, 그리고 풍성한 기쁨으로 가득하기를 기원합니다." },
      { speaker: "B", speakerRole: "Couple", text: "Your kind words mean the world to us. Please enjoy the evening banquet!", translation: "전해주신 따뜻한 말씀이 저희에게 큰 힘이 됩니다. 저녁 피로연 편안히 즐겨주세요!" }
    ],
    keyExpressions: [
      { target: "lifelong companionship", meaning: "평생의 동반자 관계/우정", explanation: "결혼식 축하 덕담에서 부부의 오랜 동행을 기원할 때 쓰는 품격 있는 표현입니다." },
      { target: "mutual respect", meaning: "상호 존중", explanation: "부부 관계의 기본 가치를 덕담할 때 핵심적으로 쓰입니다." }
    ],
    questions: [
      {
        id: "en-dlg-wed-3-q1",
        site: "english",
        skillId: "dlg.en.wed",
        type: "multiple_choice",
        difficulty: 5,
        prompt: "What was the core blessing expressed by guest A to the newlyweds?",
        options: [
          { id: "a", text: "Winning an international lottery jackpot" },
          { id: "b", text: "Lifelong companionship, mutual respect, and abundant joy" },
          { id: "c", text: "Purchasing an expensive sports car immediately" },
          { id: "d", text: "Moving to a different foreign country next week" }
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check guest A's heartfelt wishes in the third turn.", "Review the key statements in the dialogue carefully."],
        explanation: "Guest A wished: 'May your marriage be blessed with lifelong companionship, mutual respect, and abundant joy.'",
        role: "core",
        status: "PUBLISHED"
      }
    ]
  },
  {
    id: "en-dlg-hot-1",
    category: "hotel",
    site: "english",
    titleKo: "호텔 체크인과 객실 카드키 수령",
    titleEn: "Hotel Check-in & Room Key Card",
    difficulty: 2,
    gradeScope: "E4",
    semester: 1,
    locationKo: "호텔 프런트 데스크",
    locationEn: "Hotel front desk",
    turns: [
      { speaker: "A", speakerRole: "Front Desk Agent", text: "Good afternoon! Welcome to Grand Horizon Hotel. How may I assist you today?", translation: "좋은 오후입니다! 그랜드 호라이즌 호텔에 오신 것을 환영합니다. 오늘 어떻게 도와드릴까요?" },
      { speaker: "B", speakerRole: "Guest", text: "Hi, I have a reservation for three nights under the name of Sarah Miller.", translation: "안녕하세요, 사라 밀러라는 이름으로 3박 예약했습니다." },
      { speaker: "A", speakerRole: "Front Desk Agent", text: "Thank you, Ms. Miller. May I see your passport and a credit card for the incidental deposit?", translation: "감사합니다, 밀러 고객님. 여권과 부대비용 보증금용 신용카드를 보여주시겠어요?" },
      { speaker: "B", speakerRole: "Guest", text: "Sure, here they are. What time is breakfast served in the morning?", translation: "물론이죠, 여기 있습니다. 아침 조식은 몇 시에 제공되나요?" },
      { speaker: "A", speakerRole: "Front Desk Agent", text: "Breakfast buffet is served on the second floor from 6:30 to 10:00 AM. Here is your key card for room 814.", translation: "조식 뷔페는 2층에서 오전 6시 30분부터 10시까지 제공됩니다. 814호 카드키 여기 있습니다." },
    ],
    keyExpressions: [
      { target: "incidental deposit", meaning: "부대비용 보증금", explanation: "객실 미니바나 룸서비스 등을 이용할 경우를 대비해 체크인 시 보증용으로 결제 승인을 걸어두는 금액입니다." },
      { target: "buffet is served", meaning: "뷔페가 제공되다", explanation: "식사 시간과 장소를 안내할 때 쓰이는 격식 표현입니다." },
    ],
    questions: [
      {
        id: "en-dlg-hot-1-q1",
        site: "english",
        skillId: "dlg.en.hot",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What time is breakfast served at the hotel?",
        options: [
          { id: "a", text: "5:00 to 8:00 AM" },
          { id: "b", text: "6:30 to 10:00 AM" },
          { id: "c", text: "7:00 to 11:30 AM" },
          { id: "d", text: "Only at noon" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the front desk agent's last line about the morning buffet.", "Review the key statements in the dialogue carefully."],
        explanation: "The front desk agent stated that breakfast buffet is served on the second floor from 6:30 to 10:00 AM.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-hot-2",
    category: "hotel",
    site: "english",
    titleKo: "객실 편의용품 추가 요청과 레이트 체크아웃",
    titleEn: "Requesting Extra Amenities & Late Checkout",
    difficulty: 3,
    gradeScope: "M1",
    semester: 2,
    locationKo: "객실 전화 통화",
    locationEn: "In-room telephone call",
    turns: [
      { speaker: "A", speakerRole: "Guest", text: "Hello, front desk? This is room 814. Could we please request two extra bath towels and a bottle of mineral water?", translation: "여보세요, 프런트인가요? 814호인데요. 목욕 수건 2장과 생수 한 병을 추가로 요청할 수 있을까요?" },
      { speaker: "B", speakerRole: "Front Desk Agent", text: "Certainly, Ms. Miller. Housekeeping will deliver them to your room within ten minutes.", translation: "물론입니다, 밀러 고객님. 하우스키핑 직원이 10분 이내로 객실로 가져다드리겠습니다." },
      { speaker: "A", speakerRole: "Guest", text: "Wonderful. Also, is it possible to get a complimentary late checkout tomorrow around 1 PM?", translation: "좋네요. 그리고 혹시 내일 오후 1시경으로 무료 레이트 체크아웃이 가능한가요?" },
      { speaker: "B", speakerRole: "Front Desk Agent", text: "Let me check room availability. Yes, we can extend your checkout until 1 PM without additional charge.", translation: "객실 현황을 확인해 보겠습니다. 네, 추가 요금 없이 오후 1시까지 체크아웃을 연장해 드릴 수 있습니다." },
    ],
    keyExpressions: [
      { target: "complimentary late checkout", meaning: "무료 퇴실 연장", explanation: "호텔 정규 퇴실 시간 이후까지 추가 비용 없이 머무는 혜택입니다." },
      { target: "housekeeping will deliver", meaning: "객실 관리팀에서 배달해 드립니다", explanation: "수건, 어메니티 등 객실 비품을 전달할 때 쓰는 호텔 표현입니다." },
    ],
    questions: [
      {
        id: "en-dlg-hot-2-q1",
        site: "english",
        skillId: "dlg.en.hot",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What did the front desk agent confirm regarding late checkout?",
        options: [
          { id: "a", text: "Late checkout was denied due to full occupancy." },
          { id: "b", text: "It was approved until 1 PM without extra charge." },
          { id: "c", text: "An extra night fee was automatically billed." },
          { id: "d", text: "Checkout must be completed before 10 AM." },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the agent's confirmation in the final response.", "Review the key statements in the dialogue carefully."],
        explanation: "The front desk agent confirmed that checkout could be extended until 1 PM without additional charge.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-hot-3",
    category: "hotel",
    site: "english",
    titleKo: "미니바 정산과 공항 셔틀 예약",
    titleEn: "Mini-bar Settlement & Airport Shuttle Booking",
    difficulty: 4,
    gradeScope: "M3",
    semester: 1,
    locationKo: "호텔 프런트 데스크",
    locationEn: "Hotel front desk",
    turns: [
      { speaker: "A", speakerRole: "Guest", text: "Good morning. I would like to check out of room 814, please.", translation: "좋은 아침입니다. 814호 체크아웃 부탁드립니다." },
      { speaker: "B", speakerRole: "Front Desk Agent", text: "Certainly. Did you consume any refreshments from the mini-bar during your stay?", translation: "알겠습니다. 머무시는 동안 미니바에서 음료나 다과를 이용하셨나요?" },
      { speaker: "A", speakerRole: "Guest", text: "Yes, I had one sparkling water and a bag of roasted almonds. Please charge it to my credit card on file.", translation: "네, 탄산수 한 병과 볶은 아몬드 한 봉지를 먹었습니다. 등록된 신용카드로 청구해 주세요." },
      { speaker: "B", speakerRole: "Front Desk Agent", text: "The total is $8. Here is your finalized folio. Our airport express shuttle will arrive at the main entrance in 15 minutes.", translation: "총 8달러입니다. 정산 영수증 여기 있습니다. 공항 직행 셔틀버스는 15분 후 정문으로 도착합니다." },
    ],
    keyExpressions: [
      { target: "finalized folio", meaning: "최종 정산 내역서", explanation: "호텔 숙박료 및 부대 이용 내역이 명시된 공식 영수증입니다." },
      { target: "on file", meaning: "시스템에 등록/보관된", explanation: "체크인 시 등록해 둔 신용카드로 결제할 때 자주 쓰는 표현입니다." },
    ],
    questions: [
      {
        id: "en-dlg-hot-3-q1",
        site: "english",
        skillId: "dlg.en.hot",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "When will the airport express shuttle arrive at the main entrance?",
        options: [
          { id: "a", text: "In 15 minutes" },
          { id: "b", text: "In two hours" },
          { id: "c", text: "Tomorrow morning" },
          { id: "d", text: "It has already left" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the agent's final sentence about the shuttle.", "Review the key statements in the dialogue carefully."],
        explanation: "The front desk agent informed the guest that the airport express shuttle would arrive in 15 minutes.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-tr-1",
    category: "transport",
    site: "english",
    titleKo: "지하철 교통카드 충전과 출구 찾기",
    titleEn: "Buying Transit Card & Finding Subway Exit",
    difficulty: 1,
    gradeScope: "E2",
    semester: 1,
    locationKo: "지하철역 개찰구 앞",
    locationEn: "Subway station turnstiles",
    turns: [
      { speaker: "A", speakerRole: "Passenger", text: "Excuse me, where can I buy and top up a rechargeable transit card?", translation: "실례합니다, 충전식 교통카드를 어디서 구매하고 충전할 수 있나요?" },
      { speaker: "B", speakerRole: "Station Attendant", text: "Right over there by the blue ticket vending machines next to the fare gates.", translation: "개찰구 옆에 있는 파란색 자동 발매기에서 하실 수 있습니다." },
      { speaker: "A", speakerRole: "Passenger", text: "Thank you! Which exit should I take for Central Park?", translation: "감사합니다! 센트럴 파크로 가려면 몇 번 출구로 나가야 하나요?" },
      { speaker: "B", speakerRole: "Station Attendant", text: "Take Exit 4 on your right. It leads straight up to the park entrance.", translation: "오른쪽에 있는 4번 출구로 나가세요. 공원 입구로 바로 연결됩니다." },
    ],
    keyExpressions: [
      { target: "top up a transit card", meaning: "교통카드를 충전하다", explanation: "대중교통 카드 잔액을 채우는 가장 보편적인 영미권 표현입니다." },
      { target: "ticket vending machine", meaning: "승차권 자동 발매기", explanation: "지하철역 승차권을 사거나 교통카드를 충전하는 기기입니다." },
    ],
    questions: [
      {
        id: "en-dlg-tr-1-q1",
        site: "english",
        skillId: "dlg.en.tr",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "Which exit leads straight to the Central Park entrance?",
        options: [
          { id: "a", text: "Exit 1" },
          { id: "b", text: "Exit 2" },
          { id: "c", text: "Exit 4" },
          { id: "d", text: "Exit 9" },
        ],
        answer: { kind: "choice", id: "c" },
        hints: ["Look at the attendant's directions in the last turn.", "Review the key statements in the dialogue carefully."],
        explanation: "The station attendant explicitly advised taking Exit 4 on the right.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-tr-2",
    category: "transport",
    site: "english",
    titleKo: "택시 탑승과 목적지 및 결제 안내",
    titleEn: "Taking a Taxi, Giving Directions & Payment",
    difficulty: 2,
    gradeScope: "E5",
    semester: 1,
    locationKo: "택시 안",
    locationEn: "Inside a taxi",
    turns: [
      { speaker: "A", speakerRole: "Passenger", text: "Good afternoon. Could you take me to the City Convention Center, please?", translation: "좋은 오후입니다. 시립 컨벤션 센터로 가주시겠어요?" },
      { speaker: "B", speakerRole: "Taxi Driver", text: "Sure thing. Highway traffic looks heavy, so I will take Broadway avenue to avoid delay.", translation: "물론입니다. 고속도로 교통이 혼잡해 보여서 지체를 피하기 위해 브로드웨이 대로로 가겠습니다." },
      { speaker: "A", speakerRole: "Passenger", text: "That sounds great, thank you. Can I pay with a contactless credit card?", translation: "좋습니다, 감사합니다. 비접촉식(컨택리스) 신용카드로 결제할 수 있나요?" },
      { speaker: "B", speakerRole: "Taxi Driver", text: "Yes, tap your card on the payment terminal behind the seat. Here is your receipt.", translation: "네, 좌석 뒤에 있는 결제 단말기에 카드를 대주세요. 영수증 여기 있습니다." },
    ],
    keyExpressions: [
      { target: "contactless credit card", meaning: "비접촉식 신용카드", explanation: "카드를 긁거나 꽂지 않고 단말기에 탭하여 결제하는 방식입니다." },
      { target: "tap your card", meaning: "카드를 단말기에 대다(탭하다)", explanation: "현대 교통수단 및 상점에서 결제 시 일상적으로 쓰는 표현입니다." },
    ],
    questions: [
      {
        id: "en-dlg-tr-2-q1",
        site: "english",
        skillId: "dlg.en.tr",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "Why did the taxi driver decide to take Broadway avenue?",
        options: [
          { id: "a", text: "To stop by a gas station" },
          { id: "b", text: "To avoid heavy highway traffic" },
          { id: "c", text: "Because Broadway has no traffic lights" },
          { id: "d", text: "To pick up another passenger" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Review the driver's response about traffic conditions.", "Review the key statements in the dialogue carefully."],
        explanation: "The taxi driver explained that highway traffic was heavy, so taking Broadway would avoid delay.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-tr-3",
    category: "transport",
    site: "english",
    titleKo: "고속철도 환승과 좌석 변경",
    titleEn: "High-Speed Train Transfer & Seat Change",
    difficulty: 3,
    gradeScope: "M2",
    semester: 2,
    locationKo: "기차역 고객센터 매표창구",
    locationEn: "Railway station ticket office",
    turns: [
      { speaker: "A", speakerRole: "Passenger", text: "Hello, my connecting flight arrived early. Can I exchange my 4 PM express train ticket to an earlier departure?", translation: "안녕하세요, 연결 항공편이 일찍 도착했습니다. 오후 4시 특급열차 표를 더 이른 출발 편으로 변경할 수 있을까요?" },
      { speaker: "B", speakerRole: "Ticket Agent", text: "Let me see. There is an express departing at 2:30 PM with an available forward-facing window seat.", translation: "확인해 보겠습니다. 오후 2시 30분에 출발하는 열차에 순방향 창측 좌석이 하나 있습니다." },
      { speaker: "A", speakerRole: "Passenger", text: "That is perfect! Does this change involve any cancellation or rebooking fee?", translation: "완벽하네요! 이 변경에 취소 수수료나 재예약 수수료가 발생하나요?" },
      { speaker: "B", speakerRole: "Ticket Agent", text: "Since you have a flexible fare ticket, modifications are completely complimentary. Your train boards at Platform 7.", translation: "유연 요금제 티켓이시라 변경은 완전 무료입니다. 열차는 7번 플랫폼에서 탑승합니다." },
    ],
    keyExpressions: [
      { target: "forward-facing window seat", meaning: "순방향 창가 좌석", explanation: "열차 진행 방향을 바라보는 창문 쪽 좌석입니다." },
      { target: "flexible fare ticket", meaning: "자유 변경 가능 요금제 표", explanation: "수수료 없이 일정과 좌석을 유연하게 변경할 수 있는 티켓 등급입니다." },
    ],
    questions: [
      {
        id: "en-dlg-tr-3-q1",
        site: "english",
        skillId: "dlg.en.tr",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "Why was the passenger's train ticket modified without any fee?",
        options: [
          { id: "a", text: "The passenger held a flexible fare ticket." },
          { id: "b", text: "The previous train had broken down." },
          { id: "c", text: "The station offered a holiday promotion." },
          { id: "d", text: "The passenger volunteered to travel in cargo." },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Check the ticket agent's explanation about ticket type.", "Review the key statements in the dialogue carefully."],
        explanation: "The ticket agent stated that because of the flexible fare ticket, modifications were completely complimentary.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-bnk-1",
    category: "bank",
    site: "english",
    titleKo: "은행 창구 외화 환전과 환율 우대",
    titleEn: "Currency Exchange at Bank Counter",
    difficulty: 2,
    gradeScope: "E4",
    semester: 2,
    locationKo: "은행 외환 창구",
    locationEn: "Bank foreign exchange desk",
    turns: [
      { speaker: "A", speakerRole: "Customer", text: "Good morning. I would like to exchange 600 Euros into US dollars.", translation: "좋은 아침입니다. 600유로를 미국 달러로 환전하고 싶습니다." },
      { speaker: "B", speakerRole: "Bank Teller", text: "Certainly. Please provide your passport and tell me how you prefer the denominations.", translation: "알겠습니다. 여권을 제시해 주시고 원하시는 지폐 권종을 말씀해 주세요." },
      { speaker: "A", speakerRole: "Customer", text: "Could I have mostly fifty-dollar bills and some smaller twenties and tens for tipping?", translation: "50달러 지폐 위주로 주시고, 팁용으로 20달러와 10달러 소액권도 조금 섞어주시겠어요?" },
      { speaker: "B", speakerRole: "Bank Teller", text: "Of course. Today's rate gives you 648 dollars. Here are twelve fifties, two twenties, and eight bills of one dollar.", translation: "물론입니다. 오늘 환율로 648달러입니다. 50달러 12장, 20달러 2장, 1달러 8장입니다." },
    ],
    keyExpressions: [
      { target: "denominations", meaning: "지폐 액면가(권종)", explanation: "환전 시 100달러, 50달러, 10달러 등 지폐 단위를 구분해 달라고 할 때 쓰는 금융 용어입니다." },
      { target: "exchange rate", meaning: "환율", explanation: "통화 간 교환 비율을 뜻합니다." },
    ],
    questions: [
      {
        id: "en-dlg-bnk-1-q1",
        site: "english",
        skillId: "dlg.en.bnk",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "Why did the customer ask for smaller bills like twenties and tens?",
        options: [
          { id: "a", text: "For framing as souvenirs" },
          { id: "b", text: "For tipping and everyday small expenses" },
          { id: "c", text: "To deposit into an ATM immediately" },
          { id: "d", text: "Because high bills are forbidden" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the customer's explanation for requesting smaller twenties and tens.", "Review the key statements in the dialogue carefully."],
        explanation: "The customer requested smaller twenties and tens specifically for tipping and small daily payments.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-bnk-2",
    category: "bank",
    site: "english",
    titleKo: "입출금 통장과 체크카드 개설",
    titleEn: "Opening Checking Account & Debit Card",
    difficulty: 3,
    gradeScope: "M1",
    semester: 1,
    locationKo: "은행 신규 계좌 창구",
    locationEn: "Bank new accounts desk",
    turns: [
      { speaker: "A", speakerRole: "Customer", text: "Hello, I recently moved here for work and would like to open a checking account with a debit card.", translation: "안녕하세요, 최근 직장 때문에 이곳으로 이사 왔는데 체크카드가 포함된 입출금 당좌계좌를 개설하고 싶습니다." },
      { speaker: "B", speakerRole: "Personal Banker", text: "Welcome! We will need two forms of identification, such as your passport and employment contract, plus proof of address.", translation: "환영합니다! 여권과 근로계약서 등 두 가지 신분증과 주소 증명 서류가 필요합니다." },
      { speaker: "A", speakerRole: "Customer", text: "I brought my passport, employment letter, and utility bill showing my new apartment address.", translation: "여권, 재직증명 서한, 그리고 새 아파트 주소가 적힌 공과금 고지서를 가져왔습니다." },
      { speaker: "B", speakerRole: "Personal Banker", text: "Everything is in order. We will set up your online mobile banking right now, and your debit card will be ready instantly.", translation: "모든 것이 잘 갖춰졌습니다. 지금 바로 모바일 뱅킹을 설정해 드리고 체크카드도 즉시 발급해 드리겠습니다." },
    ],
    keyExpressions: [
      { target: "proof of address", meaning: "거주지 주소 증명", explanation: "은행 계좌 개설 시 본인 거주지를 증명하는 공과금 영수증이나 임대차 계약서입니다." },
      { target: "checking account", meaning: "당좌/입출금 보통예금 계좌", explanation: "체크카드 결제나 수표 발행, 급여 입금에 쓰이는 기본 금융 계좌입니다." },
    ],
    questions: [
      {
        id: "en-dlg-bnk-2-q1",
        site: "english",
        skillId: "dlg.en.bnk",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What documents did the customer bring to verify their address?",
        options: [
          { id: "a", text: "A utility bill showing the apartment address" },
          { id: "b", text: "A handwritten postcard from a friend" },
          { id: "c", text: "A hotel brochure" },
          { id: "d", text: "A gym membership receipt" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Check the customer's response listing the three documents brought.", "Review the key statements in the dialogue carefully."],
        explanation: "The customer specifically brought a utility bill displaying the apartment address as proof of address.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-bnk-3",
    category: "bank",
    site: "english",
    titleKo: "해외 송금 신청과 SWIFT 코드 확인",
    titleEn: "International Wire Transfer & SWIFT Code",
    difficulty: 4,
    gradeScope: "M3",
    semester: 2,
    locationKo: "은행 외환 송금 창구",
    locationEn: "Bank wire transfers department",
    turns: [
      { speaker: "A", speakerRole: "Customer", text: "Hello, I need to wire $3,000 to an educational institution in Germany for university tuition.", translation: "안녕하세요, 대학교 등록금 납부를 위해 독일의 교육 기관에 3,000달러를 해외 송금해야 합니다." },
      { speaker: "B", speakerRole: "Wire Specialist", text: "Please provide the recipient institution name, IBAN account number, and the German bank's 8 or 11 character SWIFT/BIC code.", translation: "수취 기관명, IBAN 계좌번호, 그리고 독일 은행의 8자리 또는 11자리 SWIFT/BIC 코드를 제시해 주세요." },
      { speaker: "A", speakerRole: "Customer", text: "Here is the official tuition invoice containing the university's complete banking credentials.", translation: "대학교의 완전한 은행 정보가 적힌 공식 등록금 청구서가 여기 있습니다." },
      { speaker: "B", speakerRole: "Wire Specialist", text: "The SWIFT code has been verified on our network. The funds should credit to the university account within two business days.", translation: "전산망에서 SWIFT 코드가 확인되었습니다. 송금액은 영업일 기준 이틀 이내에 대학교 계좌로 입금될 것입니다." },
    ],
    keyExpressions: [
      { target: "wire transfer", meaning: "전신 해외 송금", explanation: "은행 간 전산망을 통해 신속하고 안전하게 자금을 국가 간 송금하는 서비스입니다." },
      { target: "SWIFT/BIC code", meaning: "국제 은행 식별 코드", explanation: "해외 송금 시 각 금융기관을 전 세계적으로 식별하는 고유 코드입니다." },
    ],
    questions: [
      {
        id: "en-dlg-bnk-3-q1",
        site: "english",
        skillId: "dlg.en.bnk",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "How long will it take for the tuition wire transfer to credit the university account?",
        options: [
          { id: "a", text: "Within two business days" },
          { id: "b", text: "Over one month" },
          { id: "c", text: "Immediately in ten seconds" },
          { id: "d", text: "At the end of the semester" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Review the wire specialist's final confirmation.", "Review the key statements in the dialogue carefully."],
        explanation: "The wire specialist stated that funds should credit to the university account within two business days.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-post-1",
    category: "post_office",
    site: "english",
    titleKo: "우체국 우표 구매와 등기 우편 접수",
    titleEn: "Buying Postage Stamps & Sending Registered Letter",
    difficulty: 1,
    gradeScope: "E3",
    semester: 2,
    locationKo: "우체국 우편 카운터",
    locationEn: "Post office mail counter",
    turns: [
      { speaker: "A", speakerRole: "Customer", text: "Good morning. I would like to send this legal contract by certified registered mail.", translation: "좋은 아침입니다. 이 법적 계약서를 배달증명 등기 우편으로 부치고 싶습니다." },
      { speaker: "B", speakerRole: "Postal Clerk", text: "Please place the envelope on the scale. Would you like a signature confirmation upon delivery?", translation: "봉투를 저울 위에 올려주세요. 배달 시 서명 수령 확인 서비스도 포함하시겠습니까?" },
      { speaker: "A", speakerRole: "Customer", text: "Yes, please. I need formal proof that the recipient has signed for it.", translation: "네, 수취인이 서명하여 받았다는 공식 증빙이 필요합니다." },
      { speaker: "B", speakerRole: "Postal Clerk", text: "Total postage is $4.85. Your tracking number is printed right here on the customer receipt.", translation: "총 우편요금은 4.85달러입니다. 배송 조회 번호는 고객 영수증 바로 여기에 인쇄되어 있습니다." },
    ],
    keyExpressions: [
      { target: "certified registered mail", meaning: "배달증명 등기 우편", explanation: "발송과 배달의 전 과정을 기록하고 법적 증빙을 남기는 우편 서비스입니다." },
      { target: "signature confirmation", meaning: "서명 수령 확인", explanation: "수취인이 직접 서명하고 물품을 인수했음을 확인해 주는 서비스입니다." },
    ],
    questions: [
      {
        id: "en-dlg-post-1-q1",
        site: "english",
        skillId: "dlg.en.post",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "Where can the customer find their mail tracking number?",
        options: [
          { id: "a", text: "Printed on the customer receipt" },
          { id: "b", text: "On the wall billboard" },
          { id: "c", text: "In the daily newspaper" },
          { id: "d", text: "Behind the stamp" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the clerk's final sentence about the receipt.", "Review the key statements in the dialogue carefully."],
        explanation: "The postal clerk explained that the tracking number is printed right on the customer receipt.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-post-2",
    category: "post_office",
    site: "english",
    titleKo: "택배 상자 포장과 완충재 사용",
    titleEn: "Packaging Parcel Box & Fragile Sticker",
    difficulty: 2,
    gradeScope: "E5",
    semester: 2,
    locationKo: "우체국 포장대",
    locationEn: "Post office packing counter",
    turns: [
      { speaker: "A", speakerRole: "Customer", text: "Excuse me, which box size would you recommend for shipping porcelain tableware?", translation: "실례합니다, 도자기 식기를 배송하려면 어떤 상자 크기를 추천하시나요?" },
      { speaker: "B", speakerRole: "Postal Clerk", text: "Medium Box 3 will allow plenty of room for heavy bubble wrap on all sides.", translation: "중형 3호 상자가 사방에 두꺼운 뾱뾱이 완충재를 넉넉히 넣을 공간을 제공합니다." },
      { speaker: "A", speakerRole: "Customer", text: "May I use the heavy-duty packing tape and scissors at this station?", translation: "이 포장대에 있는 강력 포장용 테이프와 가위를 사용해도 되나요?" },
      { speaker: "B", speakerRole: "Postal Clerk", text: "Certainly. Be sure to seal all box seams in an 'H' pattern and stick this bright red 'FRAGILE' label on top.", translation: "물론입니다. 상자의 모든 이음매를 H자 패턴으로 테이핑하시고 상단에 이 밝은 빨간색 '취급주의(FRAGILE)' 라벨을 붙여주세요." },
    ],
    keyExpressions: [
      { target: "bubble wrap", meaning: "에어캡(뾱뾱이 완충재)", explanation: "충격으로부터 깨지기 쉬운 물건을 보호하기 위해 기포가 들어간 비닐 완충재입니다." },
      { target: "FRAGILE label", meaning: "파손주의 스티커", explanation: "운송 담당자에게 섬세하게 다뤄달라고 요청하는 국제 표준 표기입니다." },
    ],
    questions: [
      {
        id: "en-dlg-post-2-q1",
        site: "english",
        skillId: "dlg.en.post",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What label should be attached to the box containing porcelain tableware?",
        options: [
          { id: "a", text: "Keep Frozen" },
          { id: "b", text: "FRAGILE (Handle with Care)" },
          { id: "c", text: "Do Not Open" },
          { id: "d", text: "Return to Sender" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the clerk's instruction about protecting fragile ceramic goods.", "Review the key statements in the dialogue carefully."],
        explanation: "The clerk instructed the customer to stick a bright red 'FRAGILE' label on top of the box.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-post-3",
    category: "post_office",
    site: "english",
    titleKo: "국제특송 세관 신고서 작성과 발송",
    titleEn: "International Express Shipping & Customs Declaration",
    difficulty: 3,
    gradeScope: "M2",
    semester: 2,
    locationKo: "우체국 국제우편 카운터",
    locationEn: "Post office international dispatch desk",
    turns: [
      { speaker: "A", speakerRole: "Customer", text: "Hello, I want to dispatch an international priority parcel to Tokyo, Japan.", translation: "안녕하세요, 일본 도쿄로 국제 우선특송 소포를 발송하고 싶습니다." },
      { speaker: "B", speakerRole: "Postal Clerk", text: "Please complete this digital customs declaration. You must detail each item's description, quantity, and market value.", translation: "이 디지털 세관 신고서를 작성해 주세요. 각 품목의 설명, 수량, 시장 가치를 상세히 기재하셔야 합니다." },
      { speaker: "A", speakerRole: "Customer", text: "The box contains two cotton shirts and packaged snacks. Are lithium batteries permitted?", translation: "상자에는 면 셔츠 두 장과 포장된 과자가 들어있습니다. 리튬 배터리도 허용되나요?" },
      { speaker: "B", speakerRole: "Postal Clerk", text: "No, loose lithium batteries and aerosols are strictly restricted on cargo aircraft. Everything else in your box is approved.", translation: "아니요, 분리형 리튬 배터리와 스프레이는 화물 항공기 운송이 엄격히 제한됩니다. 상자 안의 다른 모든 것은 발송 가능합니다." },
    ],
    keyExpressions: [
      { target: "customs declaration", meaning: "세관 신고서", explanation: "해외로 반출되는 물품의 종류와 가격을 국경 통관 당국에 보고하는 양식입니다." },
      { target: "strictly restricted", meaning: "엄격히 제한/금지된", explanation: "항공 안전 법령상 운송이 금지되는 품목에 대해 쓰는 공식 표현입니다." },
    ],
    questions: [
      {
        id: "en-dlg-post-3-q1",
        site: "english",
        skillId: "dlg.en.post",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "Which items are strictly restricted on international cargo aircraft according to the clerk?",
        options: [
          { id: "a", text: "Cotton shirts and books" },
          { id: "b", text: "Loose lithium batteries and aerosols" },
          { id: "c", text: "Packaged cookies and candies" },
          { id: "d", text: "Plastic pencil cases" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the clerk's warning regarding aviation prohibited items.", "Review the key statements in the dialogue carefully."],
        explanation: "The clerk explicitly warned that loose lithium batteries and aerosols are strictly restricted on cargo aircraft.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-hsg-1",
    category: "housing",
    site: "english",
    titleKo: "부동산 중개업소 원룸 월세 문의",
    titleEn: "Studio Apartment Rental & Maintenance Fee Inquiry",
    difficulty: 3,
    gradeScope: "M1",
    semester: 1,
    locationKo: "부동산 중개 사무소",
    locationEn: "Real estate leasing agency office",
    turns: [
      { speaker: "A", speakerRole: "Prospective Tenant", text: "Hello, I am looking for a furnished studio apartment within walking distance of the subway station for around $1,200 a month.", translation: "안녕하세요, 지하철역에서 도보 거리 내에 월 1,200달러 선으로 가구가 구비된 원룸 아파트를 찾고 있습니다." },
      { speaker: "B", speakerRole: "Leasing Agent", text: "We have a bright unit on Elm Street that is newly renovated with in-unit laundry and high-speed internet included.", translation: "엘름 스트리트에 최근 리모델링되어 실내 세탁기와 초고속 인터넷이 포함된 채광 좋은 매물이 있습니다." },
      { speaker: "A", speakerRole: "Prospective Tenant", text: "What are the lease term and security deposit requirements?", translation: "임대차 계약 기간과 보증금 조건은 어떻게 되나요?" },
      { speaker: "B", speakerRole: "Leasing Agent", text: "It requires a standard 12-month lease with one month of security deposit and a clean credit background check.", translation: "표준 12개월 계약에 한 달 치 보증금과 결격 사유 없는 신용 조회가 요구됩니다." },
    ],
    keyExpressions: [
      { target: "security deposit", meaning: "임대 보증금", explanation: "임대차 계약 시 파손이나 미납에 대비해 집주인에게 맡기는 보증금입니다." },
      { target: "in-unit laundry", meaning: "세대 내 전용 세탁 시설", explanation: "공용 세탁실이 아닌 아파트 내부 실내에 세탁기와 건조기가 설치되어 있음을 뜻합니다." },
    ],
    questions: [
      {
        id: "en-dlg-hsg-1-q1",
        site: "english",
        skillId: "dlg.en.hsg",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What security deposit is required for the Elm Street studio apartment?",
        options: [
          { id: "a", text: "Ten months of rent upfront" },
          { id: "b", text: "One month of security deposit" },
          { id: "c", text: "No deposit is required at all" },
          { id: "d", text: "Full purchase price of the apartment" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Review the leasing agent's explanation of terms.", "Review the key statements in the dialogue carefully."],
        explanation: "The leasing agent stated that the apartment requires a standard 12-month lease with one month of security deposit.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-hsg-2",
    category: "housing",
    site: "english",
    titleKo: "보일러 온수 고장과 집주인 수리 요청",
    titleEn: "Heating Boiler Malfunction & Landlord Repair Request",
    difficulty: 4,
    gradeScope: "M2",
    semester: 2,
    locationKo: "전화 통화",
    locationEn: "Telephone conversation",
    turns: [
      { speaker: "A", speakerRole: "Tenant", text: "Hello Mr. Davis, this is Alex from apartment 4B. The water heater boiler suddenly shut down yesterday evening and is showing an error warning.", translation: "안녕하세요 데이비스 씨, 4B호 알렉스입니다. 어제 저녁 보일러 온수기가 갑자기 꺼지며 오류 경고등이 뜹니다." },
      { speaker: "B", speakerRole: "Landlord", text: "I am so sorry to hear that during such cold weather. Have you tried resetting the circuit breaker?", translation: "추운 날씨에 고생하셨겠네요. 두꺼비집 누전 차단기를 재설정해 보셨나요?" },
      { speaker: "A", speakerRole: "Tenant", text: "Yes, I reset the breaker, but the pilot burner fails to ignite.", translation: "네, 차단기를 내렸다가 올렸는데도 점화 버너에 불이 붙지 않습니다." },
      { speaker: "B", speakerRole: "Landlord", text: "I will dispatch a licensed plumbing technician at 10 AM this morning. As landlord, I will cover all repair expenses.", translation: "오늘 오전 10시에 면허를 가진 배관 전문 기사님을 보내겠습니다. 임대인인 제가 모든 수리 비용을 부담하겠습니다." },
    ],
    keyExpressions: [
      { target: "licensed technician", meaning: "공인 면허 자격 기술자", explanation: "설비 수리를 안전하고 적법하게 수행할 수 있는 자격을 갖춘 기사입니다." },
      { target: "cover all repair expenses", meaning: "모든 수리비를 부담하다", explanation: "주택 기본 설비 고장 시 임대인이 비용을 지불한다는 법적 약속입니다." },
    ],
    questions: [
      {
        id: "en-dlg-hsg-2-q1",
        site: "english",
        skillId: "dlg.en.hsg",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "Who will cover the boiler repair expenses according to the landlord?",
        options: [
          { id: "a", text: "The tenant must pay in cash" },
          { id: "b", text: "The landlord will cover all expenses" },
          { id: "c", text: "The local city council" },
          { id: "d", text: "The neighbors upstairs" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the landlord's closing commitment.", "Review the key statements in the dialogue carefully."],
        explanation: "The landlord confirmed: 'As landlord, I will cover all repair expenses.'",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-hsg-3",
    category: "housing",
    site: "english",
    titleKo: "임대차 계약 만료와 보증금 반환 합의",
    titleEn: "Lease Expiration Notice & Security Deposit Settlement",
    difficulty: 5,
    gradeScope: "H2",
    semester: 1,
    locationKo: "아파트 퇴거 전 대면 점검",
    locationEn: "Move-out walk-through inspection",
    turns: [
      { speaker: "A", speakerRole: "Tenant", text: "Good morning. As per our 60-day written notice, my lease concludes at the end of this month and I have completed professional deep cleaning.", translation: "좋은 아침입니다. 60일 전 서면 통지에 따라 제 임대차 계약이 이달 말로 종료되며 전문 정밀 청소를 완료했습니다." },
      { speaker: "B", speakerRole: "Property Manager", text: "Thank you for the immaculate upkeep. Let us review the move-out inspection checklist together, including walls, appliances, and plumbing fixtures.", translation: "완벽하게 관리해 주셔서 감사합니다. 벽면, 가전, 배관 설비를 포함한 퇴거 점검 체크리스트를 함께 검토하시죠." },
      { speaker: "A", speakerRole: "Tenant", text: "Here are all sets of keys, mailbox fobs, and the final zero-balance utility statements.", translation: "모든 열쇠 꾸러미와 우편함 스마트키, 그리고 미납액이 0원인 최종 공과금 납부 확인서입니다." },
      { speaker: "B", speakerRole: "Property Manager", text: "Zero deductions noted. Your complete security deposit of $1,500 will be refunded by direct wire transfer within 72 hours.", translation: "차감 내역이 전혀 없습니다. 보증금 전액 1,500달러는 72시간 이내에 계좌 직통 송금으로 환급될 것입니다." },
    ],
    keyExpressions: [
      { target: "walk-through inspection", meaning: "퇴거 대면 시설 점검", explanation: "세입자가 퇴거할 때 관리인과 함께 집 상태를 직접 둘러보며 파손 여부를 확인하는 절차입니다." },
      { target: "zero-balance utility statements", meaning: "공과금 완납 확인서", explanation: "전기, 수도, 가스 등 모든 공과금이 남김없이 정산되었음을 증명하는 서류입니다." },
    ],
    questions: [
      {
        id: "en-dlg-hsg-3-q1",
        site: "english",
        skillId: "dlg.en.hsg",
        type: "multiple_choice",
        difficulty: 5,
        prompt: "How will the security deposit be refunded to the tenant?",
        options: [
          { id: "a", text: "In cash hidden in the mailbox" },
          { id: "b", text: "By direct wire transfer within 72 hours" },
          { id: "c", text: "As store gift cards" },
          { id: "d", text: "It will be withheld permanently" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Review the property manager's final statement regarding deposit payment.", "Review the key statements in the dialogue carefully."],
        explanation: "The property manager stated that the complete security deposit will be refunded by direct wire transfer within 72 hours.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-pub-1",
    category: "public_office",
    site: "english",
    titleKo: "주민센터 전입신고와 체류지 변경 접수",
    titleEn: "Submitting Address Change Report at Local Center",
    difficulty: 2,
    gradeScope: "E5",
    semester: 1,
    locationKo: "시민 민원 지원 센터",
    locationEn: "City civic services center",
    turns: [
      { speaker: "A", speakerRole: "Resident", text: "Hello, I recently relocated to this municipal district and need to update my official residential address.", translation: "안녕하세요, 최근 이 지자체 관할 구역으로 이주하여 공식 거주지 주소를 갱신하러 왔습니다." },
      { speaker: "B", speakerRole: "Civil Clerk", text: "Welcome to our city. Please provide your government photo ID and your new signed residential tenancy agreement.", translation: "우리 시에 오신 것을 환영합니다. 정부 발행 사진 신분증과 서명된 새 거주지 임대차 계약서를 제출해 주세요." },
      { speaker: "A", speakerRole: "Resident", text: "Here is my driver license and my apartment lease agreement.", translation: "여기 운전면허증과 아파트 임대차 계약서입니다." },
      { speaker: "B", speakerRole: "Civil Clerk", text: "Your new address is officially recorded in the civic registry. Here is your updated confirmation certificate.", translation: "새 주소가 주민 등록부에 공식 등록되었습니다. 갱신 확인서 여기 있습니다." },
    ],
    keyExpressions: [
      { target: "residential address update", meaning: "거주지 주소 갱신(전입신고)", explanation: "이사 후 관할 지자체 주민등록 시스템에 새 주소를 등록하는 절차입니다." },
      { target: "tenancy agreement", meaning: "임대차 계약서", explanation: "새 거주지에 합법적으로 살고 있음을 증명하는 서류입니다." },
    ],
    questions: [
      {
        id: "en-dlg-pub-1-q1",
        site: "english",
        skillId: "dlg.en.pub",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What document did the resident submit alongside their photo ID to prove their new address?",
        options: [
          { id: "a", text: "An apartment lease agreement" },
          { id: "b", text: "A subway receipt" },
          { id: "c", text: "A business card" },
          { id: "d", text: "A gym brochure" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Check the resident's response handing over documents.", "Review the key statements in the dialogue carefully."],
        explanation: "The resident provided a driver license and an apartment lease agreement to verify their new address.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-pub-2",
    category: "public_office",
    site: "english",
    titleKo: "출입국외국인청 체류 기간 연장 신청",
    titleEn: "Immigration Office: Visa & Resident Card Extension",
    difficulty: 4,
    gradeScope: "M3",
    semester: 1,
    locationKo: "출입국 이민 행정 창구",
    locationEn: "Immigration services interview window",
    turns: [
      { speaker: "A", speakerRole: "Applicant", text: "Good afternoon, officer. I am here for my scheduled appointment to apply for an extension of my work visa and residence permit.", translation: "좋은 오후입니다, 담당관님. 취업 비자와 거주 허가증 연장 신청을 위한 사전 예약 일정으로 방문했습니다." },
      { speaker: "B", speakerRole: "Immigration Officer", text: "Please present your passport, existing biometric residence permit, certificate of employment, and tax clearance documentation.", translation: "여권, 기존 생체인식 거주허가증, 재직증명서, 그리고 납세 완납 증명 서류를 제출해 주세요." },
      { speaker: "A", speakerRole: "Applicant", text: "Here is the compiled binder with all certified copies and fee transaction receipts.", translation: "공증 사본과 수수료 납부 영수증이 모두 포함된 서류철이 여기 있습니다." },
      { speaker: "B", speakerRole: "Immigration Officer", text: "All criteria and financial thresholds are satisfied. Your extension is granted for three additional years, and your new biometric card will be dispatched by post.", translation: "모든 요건과 재정 기준이 충족되었습니다. 3년 추가 연장이 승인되었으며 새 생체인식 카드가 우편으로 발송될 것입니다." },
    ],
    keyExpressions: [
      { target: "biometric residence permit", meaning: "생체인식 거주 허가증", explanation: "지문과 안면 정보가 내장된 외국인 공식 체류 신분증입니다." },
      { target: "tax clearance documentation", meaning: "납세 완납 증명서", explanation: "세금 체납이 없음을 공적으로 증명하는 서류로 비자 연장 시 필수 제출 항목입니다." },
    ],
    questions: [
      {
        id: "en-dlg-pub-2-q1",
        site: "english",
        skillId: "dlg.en.pub",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "For how many additional years was the applicant's visa extension approved?",
        options: [
          { id: "a", text: "One month" },
          { id: "b", text: "Three additional years" },
          { id: "c", text: "Ten years" },
          { id: "d", text: "It was rejected completely" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Check the immigration officer's final decision.", "Review the key statements in the dialogue carefully."],
        explanation: "The immigration officer explicitly announced that the extension is granted for three additional years.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-pub-3",
    category: "public_office",
    site: "english",
    titleKo: "무인민원발급기 서류 발급과 본인인증",
    titleEn: "Self-Service Civil Kiosk & Official Certificate Issuance",
    difficulty: 4,
    gradeScope: "H1",
    semester: 1,
    locationKo: "구청 로비 무인민원기 앞",
    locationEn: "District hall lobby automated civil kiosk",
    turns: [
      { speaker: "A", speakerRole: "Citizen", text: "Pardon me, guide. Can I obtain a certified tax contribution certificate for my mortgage application from this self-service kiosk?", translation: "실례합니다, 안내원님. 주택담보대출 신청에 필요한 공인 납세 증명서를 이 무인 발급기에서 뽑을 수 있나요?" },
      { speaker: "B", speakerRole: "Civic Assistant", text: "Yes, absolutely. Select 'Revenue Services' on the touchscreen, insert your national ID, and verify your identity on the fingerprint scanner.", translation: "네, 물론입니다. 터치스크린에서 '세무 증명'을 누르고 주민등록 신분증을 넣은 뒤 지문 스캐너에서 본인 확인을 진행하세요." },
      { speaker: "A", speakerRole: "Citizen", text: "Biometric verification verified. Should I choose the watermarked official seal version?", translation: "생체 인증이 완료되었습니다. 워터마크 관인이 포함된 공식 발급본을 선택하면 되나요?" },
      { speaker: "B", speakerRole: "Civic Assistant", text: "Yes, financial lenders require the digitally stamped watermark seal. It will print immediately from the secure tray below.", translation: "네, 금융 대출기관은 디지털 직인이 찍힌 워터마크 문서를 요구합니다. 하단 보안 트레이에서 즉시 인쇄됩니다." },
    ],
    keyExpressions: [
      { target: "watermarked official seal", meaning: "워터마크 위변조 방지 공식 관인", explanation: "위변조를 막기 위해 특수 인쇄되는 공적 문서 인증 표식입니다." },
      { target: "biometric verification", meaning: "생체인식 본인 확인", explanation: "지문이나 안면 등으로 본인임을 증명하는 전자적 보안 절차입니다." },
    ],
    questions: [
      {
        id: "en-dlg-pub-3-q1",
        site: "english",
        skillId: "dlg.en.pub",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "Why did the civic assistant recommend selecting the watermarked official seal version?",
        options: [
          { id: "a", text: "Because financial lenders require an authentic stamped seal" },
          { id: "b", text: "Because it prints in bright rainbow colors" },
          { id: "c", text: "Because it comes with a lottery ticket" },
          { id: "d", text: "Because it is the only option in Spanish" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the civic assistant's reasoning regarding financial lenders.", "Review the key statements in the dialogue carefully."],
        explanation: "The assistant explained that financial lenders require the digitally stamped watermark seal for official validation.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-wrk-1",
    category: "workplace",
    site: "english",
    titleKo: "신입사원 첫 출근 팀 소개와 오리엔테이션",
    titleEn: "Welcoming New Teammate & Workspace Setup",
    difficulty: 2,
    gradeScope: "E6",
    semester: 2,
    locationKo: "사무실 마케팅팀 공간",
    locationEn: "Office open workspace area",
    turns: [
      { speaker: "A", speakerRole: "Team Lead", text: "Good morning team! Please give a warm welcome to Marcus, who is joining us today as our new product designer.", translation: "좋은 아침입니다 팀원 여러분! 오늘 우리 팀에 새 프로덕트 디자이너로 합류한 마커스를 따뜻하게 환영해 주세요." },
      { speaker: "B", speakerRole: "New Employee", text: "Thank you, everyone. I am thrilled to join such an innovative group and look forward to collaborating with all of you.", translation: "감사합니다, 여러분. 혁신적인 팀에 합류하게 되어 기쁘며 여러분 모두와 함께 협력하기를 기대합니다." },
      { speaker: "A", speakerRole: "Team Lead", text: "Here is your designated workstation, along with your secure corporate laptop, dual monitors, and employee building badge.", translation: "여기가 지정된 자리이며 업무용 보안 노트북과 듀얼 모니터, 사원 출입증이 준비되어 있습니다." },
      { speaker: "B", speakerRole: "New Employee", text: "Everything looks wonderful. I will log in to the company portal and review our design system repository.", translation: "모든 것이 훌륭하네요. 회사 포털에 로그인하여 디자인 시스템 저장소를 검토해 보겠습니다." },
    ],
    keyExpressions: [
      { target: "look forward to collaborating", meaning: "함께 협업하기를 기대하다", explanation: "새 직장이나 프로젝트에 합류하여 협력 의지를 밝히는 정중한 비즈니스 표현입니다." },
      { target: "workstation", meaning: "업무용 전용 좌석/책상", explanation: "사무실에서 컴퓨터와 모니터가 갖추어진 개인 업무 공간입니다." },
    ],
    questions: [
      {
        id: "en-dlg-wrk-1-q1",
        site: "english",
        skillId: "dlg.en.wrk",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What role is Marcus taking on at the company?",
        options: [
          { id: "a", text: "Product designer" },
          { id: "b", text: "Security guard" },
          { id: "c", text: "Delivery driver" },
          { id: "d", text: "Cafeteria chef" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the team lead's opening introduction sentence.", "Review the key statements in the dialogue carefully."],
        explanation: "The team lead introduced Marcus as the new product designer.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-wrk-2",
    category: "workplace",
    site: "english",
    titleKo: "주간 스프린트 회의와 프로젝트 진척 보고",
    titleEn: "Weekly Sprint Status Meeting & QA Milestone",
    difficulty: 4,
    gradeScope: "M3",
    semester: 2,
    locationKo: "사내 회의실",
    locationEn: "Company conference room",
    turns: [
      { speaker: "A", speakerRole: "Scrum Master", text: "Let us check our deliverables for the international localization release sprint. How is engineering progressing?", translation: "국제 현지화 배포 스프린트의 산출물을 점검해 보겠습니다. 개발팀 진행 상황은 어떤가요?" },
      { speaker: "B", speakerRole: "Lead Engineer", text: "All 88 language string tables have passed initial automated unit tests, and memory cache tuning is on track.", translation: "88개 언어 문자열 테이블이 모두 초기 자동화 단위 테스트를 통과했으며 메모리 캐시 최적화도 순조롭게 진행 중입니다." },
      { speaker: "A", speakerRole: "Scrum Master", text: "Are there any blockers preventing us from handing over the build to quality assurance on Thursday?", translation: "목요일에 품질보증(QA) 팀에 빌드를 넘기는 데 방해가 되는 장애물(블로커)이 있나요?" },
      { speaker: "B", speakerRole: "Lead Engineer", text: "No blockers identified. We will lock code freeze by Wednesday midnight for Friday's global production launch.", translation: "확인된 장애물은 없습니다. 금요일 글로벌 실서버 배포를 위해 수요일 자정까지 코드 동결(코드 프리즈)을 완료할 예정입니다." },
    ],
    keyExpressions: [
      { target: "code freeze", meaning: "코드 동결", explanation: "새로운 기능 추가를 중단하고 안정성 검증과 버그 수정만 진행하는 출시 직전 단계입니다." },
      { target: "blockers", meaning: "진행 장애 요소", explanation: "프로젝트 진척을 방해하는 기술적 또는 운영상의 핵심 걸림돌입니다." },
    ],
    questions: [
      {
        id: "en-dlg-wrk-2-q1",
        site: "english",
        skillId: "dlg.en.wrk",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "When will the engineering team enact code freeze ahead of Friday's launch?",
        options: [
          { id: "a", text: "Wednesday midnight" },
          { id: "b", text: "Saturday noon" },
          { id: "c", text: "Next month" },
          { id: "d", text: "Immediately this morning" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the lead engineer's final sentence about the schedule.", "Review the key statements in the dialogue carefully."],
        explanation: "The lead engineer confirmed that code freeze will be locked by Wednesday midnight.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-wrk-3",
    category: "workplace",
    site: "english",
    titleKo: "부서 간 협업 일정 조율과 업무 협조 요청",
    titleEn: "Cross-Team Roadmap Coordination & Resource Negotiation",
    difficulty: 5,
    gradeScope: "H3",
    semester: 1,
    locationKo: "임원 회의실 화상 회의",
    locationEn: "Executive boardroom hybrid meeting",
    turns: [
      { speaker: "A", speakerRole: "Director of Product", text: "To align with enterprise client expectations, we must deliver the compliance audit dashboard by the 15th of next month.", translation: "기업 고객들의 기대에 부응하기 위해 다음 달 15일까지 컴플라이언스 감사 대시보드를 출시해야 합니다." },
      { speaker: "B", speakerRole: "Director of Infrastructure", text: "Our cloud database re-indexing overlaps with that window. If we commit two senior backend developers to your sprint, can we target the 18th instead?", translation: "저희 클라우드 데이터베이스 재색인 작업과 일정이 겹칩니다. 시니어 백엔드 개발자 2명을 귀 팀 스프린트에 투입한다면 18일로 조율 가능할까요?" },
      { speaker: "A", speakerRole: "Director of Product", text: "With two dedicated senior engineers, we can absorb the integration tests and comfortably present to the board on the 20th.", translation: "전담 시니어 엔지니어 2명이 함께한다면 연동 테스트를 소화하고 20일 이사회 발표를 원활히 준비할 수 있습니다." },
      { speaker: "B", speakerRole: "Director of Infrastructure", text: "Agreed. I will sign off on the resource reallocation memo immediately so we kick off cross-team synchronization tomorrow.", translation: "동의합니다. 내일부터 부서 간 동기화 킥오프를 진행할 수 있도록 자원 재배치 합의서에 즉시 서명하겠습니다." },
    ],
    keyExpressions: [
      { target: "resource reallocation", meaning: "인력 및 자원 재배치", explanation: "긴급하고 중요한 프로젝트를 위해 다른 팀의 개발자나 예산을 유연하게 조정하는 비즈니스 절차입니다." },
      { target: "sign off on", meaning: "~을 공식 승인/결재하다", explanation: "합의안이나 계획서에 최종 서명하여 효력을 발생시킬 때 씁니다." },
    ],
    questions: [
      {
        id: "en-dlg-wrk-3-q1",
        site: "english",
        skillId: "dlg.en.wrk",
        type: "multiple_choice",
        difficulty: 5,
        prompt: "What solution did the Director of Infrastructure propose to adjust the delivery date to the 18th?",
        options: [
          { id: "a", text: "Cancelling the enterprise project entirely" },
          { id: "b", text: "Committing two senior backend developers to the sprint" },
          { id: "c", text: "Outsourcing all engineering overseas" },
          { id: "d", text: "Extending the deadline by six months" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Review the Director of Infrastructure's negotiation offer.", "Review the key statements in the dialogue carefully."],
        explanation: "The Director offered to commit two senior backend developers to assist the sprint in exchange for adjusting the date to the 18th.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-sal-1",
    category: "salon",
    site: "english",
    titleKo: "헤어 스타일 사진 상담과 기장 조정",
    titleEn: "Haircut Consultation with Reference Photo",
    difficulty: 2,
    gradeScope: "E4",
    semester: 1,
    locationKo: "헤어 살롱 미용 의자",
    locationEn: "Hair salon styling chair",
    turns: [
      { speaker: "A", speakerRole: "Stylist", text: "Good afternoon! How would you like to style your hair today?", translation: "좋은 오후입니다! 오늘 어떤 스타일로 연출해 드릴까요?" },
      { speaker: "B", speakerRole: "Client", text: "I brought this reference picture on my smartphone. I would like a layered bob cut just above my shoulders.", translation: "스마트폰에 참고 사진을 가져왔어요. 어깨 바로 위까지 오는 레이어드 단발(밥 컷)로 자르고 싶습니다." },
      { speaker: "A", speakerRole: "Stylist", text: "This textured cut will frame your face beautifully. Should we thin out the ends to give it more natural movement?", translation: "질감을 살린 이 컷은 고객님 얼굴형을 예쁘게 감싸줄 것 같네요. 더 자연스러운 볼륨감을 위해 숱을 조금 쳐드릴까요?" },
      { speaker: "B", speakerRole: "Client", text: "Yes, please lighten up the ends, but keep the front bangs long enough to tuck behind my ears.", translation: "네, 끝부분 숱을 가볍게 쳐주시고, 앞머리는 귀 뒤로 넘길 수 있을 만큼의 길이를 유지해 주세요." },
    ],
    keyExpressions: [
      { target: "layered bob cut", meaning: "층을 낸 단발(레이어드 밥) 컷", explanation: "층을 주어 가볍고 자연스러운 볼륨을 만드는 인기 있는 단발 헤어스타일입니다." },
      { target: "tuck behind my ears", meaning: "귀 뒤로 꽂아 넘기다", explanation: "앞머리나 옆머리 기장을 설명할 때 일상적으로 쓰는 유용한 표현입니다." },
    ],
    questions: [
      {
        id: "en-dlg-sal-1-q1",
        site: "english",
        skillId: "dlg.en.sal",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "How did the client want their front bangs styled?",
        options: [
          { id: "a", text: "Shaved off completely" },
          { id: "b", text: "Long enough to tuck behind their ears" },
          { id: "c", text: "Cut very short above the forehead" },
          { id: "d", text: "Dyed bright green" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the client's final instruction regarding front bangs.", "Review the key statements in the dialogue carefully."],
        explanation: "The client requested to keep the front bangs long enough to tuck behind the ears.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-sal-2",
    category: "salon",
    site: "english",
    titleKo: "샴푸실 수온 확인과 두피 마사지",
    titleEn: "Trimming Bangs & Checking Shampoo Water Temperature",
    difficulty: 2,
    gradeScope: "E5",
    semester: 1,
    locationKo: "샴푸실 세발 의자",
    locationEn: "Hair salon wash basin station",
    turns: [
      { speaker: "A", speakerRole: "Salon Assistant", text: "Please lean back and rest your head comfortably against the neck rest.", translation: "뒤로 기대어 목 받침대에 머리를 편안하게 기대주세요." },
      { speaker: "B", speakerRole: "Client", text: "Thank you. The chair position is very comfortable.", translation: "감사합니다. 의자 위치가 아주 편안하네요." },
      { speaker: "A", speakerRole: "Salon Assistant", text: "How is the water temperature? Is it comfortably warm, or would you like it cooler?", translation: "물 온도는 어떠신가요? 편안하게 따뜻한가요, 아니면 더 시원하게 해드릴까요?" },
      { speaker: "B", speakerRole: "Client", text: "The warmth is perfect. Could you massage around the temples a little firmer, please?", translation: "온도가 딱 좋습니다. 관자놀이 주변을 조금만 더 시원하게 지압 마사지해 주실 수 있나요?" },
      { speaker: "A", speakerRole: "Salon Assistant", text: "Certainly. We will also apply a clarifying herbal conditioner to nourish your scalp.", translation: "물론입니다. 두피에 영양을 공급하기 위해 두피 진정 허브 컨디셔너도 함께 도포해 드리겠습니다." },
    ],
    keyExpressions: [
      { target: "neck rest", meaning: "샴푸 의자 목 받침대", explanation: "샴푸할 때 목이 편안하도록 지지해 주는 세면대 쿠션 부위입니다." },
      { target: "temples", meaning: "관자놀이", explanation: "이마 양옆 눈꼬리 뒤편 부위로, 두피 마사지 시 피로를 푸는 대표적인 지압점입니다." },
    ],
    questions: [
      {
        id: "en-dlg-sal-2-q1",
        site: "english",
        skillId: "dlg.en.sal",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "Where did the client request a firmer massage during the wash?",
        options: [
          { id: "a", text: "Around the temples" },
          { id: "b", text: "On their feet" },
          { id: "c", text: "Across the shoulders only" },
          { id: "d", text: "Behind the knees" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the client's request regarding head acupressure.", "Review the key statements in the dialogue carefully."],
        explanation: "The client specifically asked to massage around the temples a little firmer.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-sal-3",
    category: "salon",
    site: "english",
    titleKo: "자연스러운 염색 컬러 상담과 홈케어 안내",
    titleEn: "Hair Coloring Consultation & Post-Color Care Tips",
    difficulty: 3,
    gradeScope: "M1",
    semester: 1,
    locationKo: "살롱 상담 데스크",
    locationEn: "Hair salon consultation desk",
    turns: [
      { speaker: "A", speakerRole: "Colorist", text: "Looking at your swatch sample, an ash chestnut tone will complement your olive complexion without turning brassy.", translation: "가져오신 색상표를 보니 애쉬 체스넛 톤이 붉은 기 없이 올리브빛 피부톤을 아주 잘 돋보이게 해줄 것입니다." },
      { speaker: "B", speakerRole: "Client", text: "That sounds great. I swim twice a week; how can I prevent chlorine from fading the color?", translation: "좋네요. 제가 일주일에 두 번 수영을 하는데요, 염소가 색을 바래게 하는 것을 어떻게 막을 수 있나요?" },
      { speaker: "A", speakerRole: "Colorist", text: "Rinse your hair with tap water before entering the pool, and use a sulfate-free color-protecting shampoo with lukewarm water.", translation: "수영장에 들어가기 전 수돗물로 머리를 먼저 적셔주시고, 미온수로 설페이트 프리 색상 보호 샴푸를 사용하세요." },
      { speaker: "B", speakerRole: "Client", text: "Understood. Let us proceed with the ash chestnut dye and deep conditioning treatment.", translation: "이해했습니다. 애쉬 체스넛 염색과 딥 컨디셔닝 영양 트리트먼트로 진행해 주세요." },
    ],
    keyExpressions: [
      { target: "sulfate-free shampoo", meaning: "설페이트 무첨가(순한) 샴푸", explanation: "염색 모발의 색소 탈락을 막고 모발을 보호하는 전용 샴푸입니다." },
      { target: "without turning brassy", meaning: "붉거나 노랗게 뜨지 않고", explanation: "염색 후 원치 않게 붉은 기나 노란 기가 도는 현상을 방지할 때 쓰는 미용 전문 표현입니다." },
    ],
    questions: [
      {
        id: "en-dlg-sal-3-q1",
        site: "english",
        skillId: "dlg.en.sal",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What did the colorist recommend doing before entering the swimming pool to protect dyed hair?",
        options: [
          { id: "a", text: "Rinse hair with tap water beforehand" },
          { id: "b", text: "Apply hair bleach directly" },
          { id: "c", text: "Blow dry hair on high heat for an hour" },
          { id: "d", text: "Shave the head bald" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Review the colorist's advice for swimmers.", "Review the key statements in the dialogue carefully."],
        explanation: "The colorist advised rinsing hair with fresh tap water before entering the pool so strands absorb clean water first.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-lost-1",
    category: "lost_found",
    site: "english",
    titleKo: "지하철 분실물 센터 우산 습득 문의",
    titleEn: "Reporting Lost Umbrella at Subway Station Customer Center",
    difficulty: 1,
    gradeScope: "E3",
    semester: 1,
    locationKo: "지하철 고객 서비스 센터",
    locationEn: "Subway customer service lost & found window",
    turns: [
      { speaker: "A", speakerRole: "Commuter", text: "Pardon me, I left a navy blue folding umbrella under my seat on the Uptown train this morning.", translation: "실례합니다, 오늘 아침 업타운행 열차 좌석 밑에 남색 접이식 우산을 두고 내렸습니다." },
      { speaker: "B", speakerRole: "Transit Agent", text: "Do you recall approximately what time and which car number you were riding in?", translation: "대략 몇 시경이었는지, 몇 번 칸 열차에 타셨는지 기억하시나요?" },
      { speaker: "A", speakerRole: "Commuter", text: "It was around 8:45 AM near car 304. The wooden handle has a silver keychain attached.", translation: "오전 8시 45분경 304호 칸 근처였습니다. 원목 손잡이에 은색 열쇠고리가 달려 있습니다." },
      { speaker: "B", speakerRole: "Transit Agent", text: "Car cleaners turned in an umbrella matching that description at the terminal. Please sign this logbook to retrieve it.", translation: "차량 청소원분들이 종점에서 그 설명과 일치하는 우산을 맡겨두셨습니다. 찾아가실 수 있도록 이 대장에 서명해 주세요." },
    ],
    keyExpressions: [
      { target: "left under my seat", meaning: "좌석 밑에 두고 내리다", explanation: "대중교통에 소지품을 깜빡 놓고 내렸을 때 쓰는 일상 구문입니다." },
      { target: "turned in", meaning: "(습득물을) 접수/제출하다", explanation: "주운 물건을 분실물 센터에 공식 인계했을 때 쓰는 표현입니다." },
    ],
    questions: [
      {
        id: "en-dlg-lost-1-q1",
        site: "english",
        skillId: "dlg.en.lost",
        type: "multiple_choice",
        difficulty: 1,
        prompt: "What unique feature helped identify the commuter's lost umbrella?",
        options: [
          { id: "a", text: "A silver keychain on the wooden handle" },
          { id: "b", text: "Flashing neon lights" },
          { id: "c", text: "A built-in radio" },
          { id: "d", text: "A golden diamond ring" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the commuter's description of the umbrella handle.", "Review the key statements in the dialogue carefully."],
        explanation: "The commuter described a wooden handle with a silver keychain attached.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-lost-2",
    category: "lost_found",
    site: "english",
    titleKo: "관광지 안내소 지갑 분실 신고서 작성",
    titleEn: "Reporting Lost Wallet & Cancelling Bank Cards",
    difficulty: 3,
    gradeScope: "M1",
    semester: 2,
    locationKo: "관광 안내 센터 민원 창구",
    locationEn: "Tourist information center assistance desk",
    turns: [
      { speaker: "A", speakerRole: "Visitor", text: "Excuse me, I desperately need help. I believe I misplaced my black leather wallet near the observation terrace.", translation: "실례합니다, 도움이 절실합니다. 전망대 테라스 근처에서 검은색 가죽 지갑을 분실한 것 같습니다." },
      { speaker: "B", speakerRole: "Information Officer", text: "Take a deep breath; let us file an official lost property incident report immediately. What contents were inside?", translation: "심호흡을 하시고 침착하세요. 즉시 공식 분실물 접수 보고서를 작성합시다. 안에 어떤 물품들이 들어있었나요?" },
      { speaker: "A", speakerRole: "Visitor", text: "My national driver license, my hotel room key, and two international payment cards.", translation: "국내 운전면허증과 호텔 객실 카드키, 그리고 해외 결제 카드 2장이 들어있었습니다." },
      { speaker: "B", speakerRole: "Information Officer", text: "Please use our hotline telephone right now to temporarily freeze those bank cards to protect against fraud.", translation: "부정 결제 방지를 위해 지금 바로 저희 직통 전화를 사용하여 해당 은행 카드들을 일시 정지시키세요." },
    ],
    keyExpressions: [
      { target: "incident report", meaning: "분실 사건 접수 보고서", explanation: "분실이나 사고 발생 시 경위와 세부 사항을 공적으로 기록하는 양식입니다." },
      { target: "temporarily freeze bank cards", meaning: "은행 카드를 일시 정지시키다", explanation: "지갑 분실 시 도난 결제를 방지하기 위해 금융기관에 즉각 요청하는 긴급 안전 조치입니다." },
    ],
    questions: [
      {
        id: "en-dlg-lost-2-q1",
        site: "english",
        skillId: "dlg.en.lost",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What urgent action did the officer instruct the visitor to take regarding their payment cards?",
        options: [
          { id: "a", text: "Temporarily freeze the cards immediately" },
          { id: "b", text: "Order new online purchases right away" },
          { id: "c", text: "Post credit card numbers on social media" },
          { id: "d", text: "Ignore the cards completely" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Review the officer's advice to protect against fraud.", "Review the key statements in the dialogue carefully."],
        explanation: "The information officer instructed the visitor to use the hotline telephone to freeze those bank cards immediately.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-lost-3",
    category: "lost_found",
    site: "english",
    titleKo: "습득물 신원 확인과 물품 수령 서명",
    titleEn: "Proving Ownership & Claiming Stored Electronic Device",
    difficulty: 4,
    gradeScope: "M2",
    semester: 1,
    locationKo: "공항 경찰 유실물 센터",
    locationEn: "Airport police lost property office",
    turns: [
      { speaker: "A", speakerRole: "Passenger", text: "Good afternoon. I received an automated alert stating that a silver tablet computer registered under reference #509 was recovered here.", translation: "좋은 오후입니다. 접수번호 509번으로 등록된 은색 태블릿 컴퓨터가 이곳에 보관 중이라는 알림을 받고 방문했습니다." },
      { speaker: "B", speakerRole: "Security Officer", text: "Welcome. To prove ownership of the electronic device, please unlock the screen passcode in my presence and show your government ID.", translation: "환영합니다. 전자기기의 소유권을 입증하기 위해 제가 보는 앞에서 화면 비밀번호를 해제하고 정부 신분증을 보여주세요." },
      { speaker: "A", speakerRole: "Passenger", text: "Here is my passport, and I have entered the PIN to unlock the home screen displaying my personal contact details.", translation: "여기 제 여권이 있으며, 제 개인 연락처가 표시된 홈 화면 잠금을 PIN 번호로 풀었습니다." },
      { speaker: "B", speakerRole: "Security Officer", text: "Verification is conclusive. Please sign this official custody release voucher and safely take your tablet.", translation: "검증이 확실하게 완료되었습니다. 이 공식 보관 해제 인수증에 서명하시고 태블릿을 안전하게 수령하세요." },
    ],
    keyExpressions: [
      { target: "unlock the screen passcode in my presence", meaning: "담당자 입회하에 화면 비밀번호를 해제하다", explanation: "스마트폰이나 태블릿 등 전자기기의 실제 주인임을 즉시 검증하는 보안 확인 절차입니다." },
      { target: "custody release voucher", meaning: "보관 물품 인수증", explanation: "경찰이나 공공기관에서 보관 중이던 습득물을 인계받았음을 증명하는 서명 서류입니다." },
    ],
    questions: [
      {
        id: "en-dlg-lost-3-q1",
        site: "english",
        skillId: "dlg.en.lost",
        type: "multiple_choice",
        difficulty: 4,
        prompt: "How did the passenger conclusively prove ownership of the silver tablet?",
        options: [
          { id: "a", text: "By correctly entering the passcode and showing a matching ID" },
          { id: "b", text: "By guessing the weight of the tablet" },
          { id: "c", text: "By purchasing a new charger at the gift shop" },
          { id: "d", text: "By paying a large cash reward" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Check the verification steps performed by the passenger.", "Review the key statements in the dialogue carefully."],
        explanation: "The passenger entered the correct PIN to unlock the device and presented a government passport matching the details.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-fit-1",
    category: "fitness",
    site: "english",
    titleKo: "헬스장 3개월 회원권 등록과 라커 이용",
    titleEn: "Gym 3-Month Membership & Locker Inquiry",
    difficulty: 2,
    gradeScope: "E4",
    semester: 2,
    locationKo: "피트니스 센터 안내 데스크",
    locationEn: "Fitness gym reception counter",
    turns: [
      { speaker: "A", speakerRole: "Prospective Member", text: "Hi there! I would like to sign up for a three-month gym membership to stay active after work hours.", translation: "안녕하세요! 퇴근 후 꾸준히 운동하기 위해 3개월 헬스 회원권에 가입하고 싶습니다." },
      { speaker: "B", speakerRole: "Gym Manager", text: "Great decision! Our facility is open weekdays from 6:00 AM to 11:00 PM, and weekends until 8:00 PM with keycard access.", translation: "멋진 결정입니다! 저희 시설은 평일 오전 6시부터 밤 11시까지, 주말은 저녁 8시까지 카드키로 자유롭게 이용 가능합니다." },
      { speaker: "A", speakerRole: "Prospective Member", text: "Do memberships include access to shower facilities and personal storage lockers?", translation: "회원권에 샤워 시설과 개인 보관 라커 이용도 포함되어 있나요?" },
      { speaker: "B", speakerRole: "Gym Manager", text: "Daily lockers and showers are free of charge. A dedicated private overnight locker is an optional $15 per month.", translation: "일일 라커와 샤워실은 무료입니다. 신발 등을 보관하는 전용 개인 라커는 월 15달러의 선택 옵션입니다." },
    ],
    keyExpressions: [
      { target: "keycard access", meaning: "카드키 출입", explanation: "회원 전용 전자 카드로 출입문을 통과하여 헬스장을 이용하는 시스템입니다." },
      { target: "dedicated overnight locker", meaning: "전용 개인 사물함(월 라커)", explanation: "운동복과 운동화를 체육관에 두고 다닐 수 있도록 배정받는 유료 개인 라커입니다." },
    ],
    questions: [
      {
        id: "en-dlg-fit-1-q1",
        site: "english",
        skillId: "dlg.en.fit",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What gym amenities are provided free of charge with the membership?",
        options: [
          { id: "a", text: "Daily lockers and shower facilities" },
          { id: "b", text: "Unlimited sports massage therapists" },
          { id: "c", text: "Free meals at the cafe" },
          { id: "d", text: "Complimentary running shoes" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the gym manager's response about amenities.", "Review the key statements in the dialogue carefully."],
        explanation: "The gym manager clarified that daily lockers and showers are free of charge.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-fit-2",
    category: "fitness",
    site: "english",
    titleKo: "러닝머신 기구 사용법과 안전 정지 버튼",
    titleEn: "Treadmill Incline & Emergency Stop Safety Clip",
    difficulty: 2,
    gradeScope: "E5",
    semester: 2,
    locationKo: "체육관 유산소 존",
    locationEn: "Gym cardio training deck",
    turns: [
      { speaker: "A", speakerRole: "Gym Member", text: "Excuse me coach, could you show me how to adjust the elevation incline on this commercial treadmill?", translation: "코치님 실례합니다, 이 상업용 러닝머신의 경사도를 어떻게 조절하는지 알려주실 수 있나요?" },
      { speaker: "B", speakerRole: "Fitness Coach", text: "Certainly! Press the incline up arrows on the left handlebar to raise the deck grade by half-percent increments.", translation: "물론입니다! 좌측 핸들바에 있는 경사도 화살표를 누르시면 0.5% 단위로 발판 높낮이를 올릴 수 있습니다." },
      { speaker: "A", speakerRole: "Gym Member", text: "If I ever lose balance or feel lightheaded, what is the safest way to disengage the belt?", translation: "만약 중심을 잃거나 어지러우면 벨트를 정지시키는 가장 안전한 방법은 무엇인가요?" },
      { speaker: "B", speakerRole: "Fitness Coach", text: "Always clip this red safety lanyard to your waistband. If you slip, the magnetic cord disconnects and halts the motor instantly.", translation: "항상 이 빨간색 안전 줄 집게를 허리춤에 고정하세요. 미끄러지면 자석 줄이 분리되며 모터가 즉각 정지합니다." },
    ],
    keyExpressions: [
      { target: "safety lanyard clip", meaning: "안전핀 집게 줄", explanation: "러닝머신 이용 중 넘어짐이나 미끄러짐 발생 시 기계를 즉각 멈추게 하는 필수 착용 안전장치입니다." },
      { target: "incline elevation", meaning: "경사도 높낮이", explanation: "경사를 높여 오르막 걷기 운동 효과를 극대화하는 기능입니다." },
    ],
    questions: [
      {
        id: "en-dlg-fit-2-q1",
        site: "english",
        skillId: "dlg.en.fit",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "How does the red safety lanyard protect the runner on the treadmill?",
        options: [
          { id: "a", text: "It disconnects magnetically and halts the motor instantly if the runner slips" },
          { id: "b", text: "It speeds up the belt to maximum pace" },
          { id: "c", text: "It plays loud emergency music" },
          { id: "d", text: "It calls an international flight" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Review the coach's safety explanation regarding the magnetic cord.", "Review the key statements in the dialogue carefully."],
        explanation: "The coach explained that if the runner slips, the magnetic safety cord disconnects and halts the motor immediately.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-fit-3",
    category: "fitness",
    site: "english",
    titleKo: "그룹 필라테스 수업 예약과 수업 일정 변경",
    titleEn: "Booking Group Pilates Class & Cancellation Policy",
    difficulty: 3,
    gradeScope: "M1",
    semester: 1,
    locationKo: "필라테스 스튜디오 카운터",
    locationEn: "Pilates studio front desk",
    turns: [
      { speaker: "A", speakerRole: "Studio Member", text: "Hello, I would like to reserve a spot in the Thursday 6:30 PM reformer Pilates core session.", translation: "안녕하세요, 목요일 저녁 6시 30분 리포머 필라테스 코어 수업 자리를 예약하고 싶습니다." },
      { speaker: "B", speakerRole: "Class Coordinator", text: "You are booked! Our reformer studio maintains an intimate cap of six participants for hands-on form correction.", translation: "예약되셨습니다! 저희 리포머 스튜디오는 밀착 자세 교정을 위해 최대 6명의 소수 정원제를 유지합니다." },
      { speaker: "A", speakerRole: "Studio Member", text: "What happens if a work conflict arises and I am unable to make it?", translation: "만약 회사 업무로 일정이 겹쳐 참석하지 못하게 되면 어떻게 되나요?" },
      { speaker: "B", speakerRole: "Class Coordinator", text: "You can cancel without losing your class credit as long as you notify us in the mobile app at least four hours prior to class start.", translation: "수업 시작 최소 4시간 전까지 모바일 앱에서 취소하시면 수강 횟수 차감 없이 다른 시간으로 변경하실 수 있습니다." },
    ],
    keyExpressions: [
      { target: "reformer Pilates", meaning: "기구 리포머 필라테스", explanation: "스프링 저항 기구(리포머)를 활용하여 코어 근육과 유연성을 기르는 운동입니다." },
      { target: "four hours prior", meaning: "수업 시작 4시간 전까지", explanation: "수수료나 이용권 차감 없이 예약을 취소할 수 있는 규정 시점입니다." },
    ],
    questions: [
      {
        id: "en-dlg-fit-3-q1",
        site: "english",
        skillId: "dlg.en.fit",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "By when must a member cancel a Pilates reservation to avoid losing their class credit?",
        options: [
          { id: "a", text: "At least four hours prior to class start" },
          { id: "b", text: "Five minutes after the class finishes" },
          { id: "c", text: "Three weeks in advance only" },
          { id: "d", text: "Cancellations are never allowed" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Check the coordinator's cancellation timeframe requirement.", "Review the key statements in the dialogue carefully."],
        explanation: "The coordinator stated that members can cancel without losing credit as long as it is done at least four hours prior to class start.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-lib-1",
    category: "library_museum",
    site: "english",
    titleKo: "시립도서관 회원증 발급과 도서 대출",
    titleEn: "Registering for Library Card & Borrowing Books",
    difficulty: 2,
    gradeScope: "E4",
    semester: 1,
    locationKo: "시립 도서관 안내 창구",
    locationEn: "Public library circulation desk",
    turns: [
      { speaker: "A", speakerRole: "Patron", text: "Hello, I am a foreign resident living in this borough and would love to register for a library card.", translation: "안녕하세요, 이 자치구에 거주하는 외국인 주민인데 도서관 대출증을 발급받고 싶습니다." },
      { speaker: "B", speakerRole: "Librarian", text: "Welcome! We will happily set up your account. Please present any proof of local residency such as your lease or student ID.", translation: "환영합니다! 기쁜 마음으로 계정을 만들어 드리겠습니다. 임대차 계약서나 학생증 등 관내 거주 증빙을 보여주세요." },
      { speaker: "A", speakerRole: "Patron", text: "Here is my university ID and housing confirmation letter. How many books may I borrow?", translation: "여기 대학교 학생증과 거주 확인서입니다. 책은 몇 권까지 대출할 수 있나요?" },
      { speaker: "B", speakerRole: "Librarian", text: "You can borrow up to ten books for a three-week loan period, renewable online if there are no existing holds.", translation: "최대 10권까지 3주간 대출하실 수 있으며, 예약자가 없으면 온라인으로 연장이 가능합니다." },
    ],
    keyExpressions: [
      { target: "circulation desk", meaning: "도서 대출 및 반납 창구", explanation: "도서관 입구에서 책을 빌리고 반납하며 회원증을 발급하는 메인 카운터입니다." },
      { target: "three-week loan period", meaning: "3주 대출 기간", explanation: "도서를 대여하여 읽을 수 있는 공식 대출 기한입니다." },
    ],
    questions: [
      {
        id: "en-dlg-lib-1-q1",
        site: "english",
        skillId: "dlg.en.lib",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What is the standard loan period for borrowed library books?",
        options: [
          { id: "a", text: "Two days only" },
          { id: "b", text: "Three weeks" },
          { id: "c", text: "Six months" },
          { id: "d", text: "Ten years" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Look at the librarian's explanation of borrowing terms.", "Review the key statements in the dialogue carefully."],
        explanation: "The librarian explicitly stated that patrons can borrow books for a three-week loan period.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-lib-2",
    category: "library_museum",
    site: "english",
    titleKo: "국립박물관 오디오 가이드 대여와 관람 순서",
    titleEn: "Museum Audio Guide Rental & Chronological Viewing Route",
    difficulty: 2,
    gradeScope: "E5",
    semester: 1,
    locationKo: "국립 역사 박물관 로비",
    locationEn: "National museum ticketing and audio guide booth",
    turns: [
      { speaker: "A", speakerRole: "Visitor", text: "Good morning. We would like two general admission tickets and a handheld multilingual audio guide, please.", translation: "좋은 아침입니다. 일반 입장권 2장과 다국어 휴대용 오디오 가이드 한 대를 대여하고 싶습니다." },
      { speaker: "B", speakerRole: "Museum Docent", text: "Certainly. The audio guide is preloaded with English narration and historical background for all highlighted galleries.", translation: "알겠습니다. 오디오 가이드에는 주요 전시관에 대한 영어 해설과 역사적 배경이 담겨 있습니다." },
      { speaker: "A", speakerRole: "Visitor", text: "Which gallery should we begin in to experience artifacts in historical chronological order?", translation: "유물들을 시대적 연대순으로 관람하려면 어느 전시실부터 시작해야 하나요?" },
      { speaker: "B", speakerRole: "Museum Docent", text: "Head up to Gallery A on the second floor for the Ancient World, then follow the numbered floor markers through modern times.", translation: "2층의 A 전시실인 고대 세계관으로 올라가신 후 바닥의 번호 표식을 따라 현대관까지 이동하시면 됩니다." },
    ],
    keyExpressions: [
      { target: "chronological order", meaning: "역사적 연대순(시간순)", explanation: "역사나 전시물을 시대 순서대로 관람하거나 설명할 때 쓰는 표현입니다." },
      { target: "audio guide narration", meaning: "오디오 가이드 음성 해설", explanation: "유물 번호를 입력하여 전문적인 작품 해설을 들을 수 있는 기기입니다." },
    ],
    questions: [
      {
        id: "en-dlg-lib-2-q1",
        site: "english",
        skillId: "dlg.en.lib",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "Where should the visitors begin their tour to view artifacts in chronological order?",
        options: [
          { id: "a", text: "Gallery A on the second floor (Ancient World)" },
          { id: "b", text: "The gift shop on the rooftop" },
          { id: "c", text: "The underground parking garage" },
          { id: "d", text: "The outdoor cafeteria" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the museum docent's directions for starting the tour.", "Review the key statements in the dialogue carefully."],
        explanation: "The docent advised heading up to Gallery A on the second floor (Ancient World) to begin the chronological tour.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-lib-3",
    category: "library_museum",
    site: "english",
    titleKo: "특별 기획전 사진 촬영 규정과 관람 에티켓",
    titleEn: "Art Gallery Photo Etiquette & Using Free Lockers",
    difficulty: 3,
    gradeScope: "M2",
    semester: 2,
    locationKo: "기획 미술관 전시장 입구",
    locationEn: "Fine art gallery exhibition hall portal",
    turns: [
      { speaker: "A", speakerRole: "Gallery Visitor", text: "Excuse me, are visitors allowed to photograph the impressionist oil paintings inside this special wing?", translation: "실례합니다, 이 특별 전시관 내부의 인상파 유화 작품들을 사진 촬영할 수 있나요?" },
      { speaker: "B", speakerRole: "Gallery Attendant", text: "Non-flash personal photography is welcomed, but tripods, selfie sticks, and flash equipment are strictly forbidden.", translation: "플래시 없는 개인 사진 촬영은 환영하지만 삼각대, 셀카봉, 플래시 장비는 엄격히 금지됩니다." },
      { speaker: "A", speakerRole: "Gallery Visitor", text: "Understood. My tote bag is quite bulky; is it permitted to carry it inside?", translation: "이해했습니다. 제 토트백이 꽤 큰데 안으로 들고 들어가도 괜찮은가요?" },
      { speaker: "B", speakerRole: "Gallery Attendant", text: "To safeguard delicate artwork from accidental bumps, all large backpacks and bags must be deposited in our free cloakroom lockers.", translation: "작품이 실수로 부딪혀 손상되는 것을 방지하기 위해 모든 큰 가방과 배낭은 무료 보관소 라커에 보관해 주셔야 합니다." },
    ],
    keyExpressions: [
      { target: "non-flash photography", meaning: "노플래시(플래시 없는) 사진 촬영", explanation: "강한 빛으로 인한 미술품 변색과 손상을 방지하기 위한 미술관 기본 에티켓입니다." },
      { target: "cloakroom lockers", meaning: "물품 보관소 사물함", explanation: "외투나 큰 가방을 관람 전 맡겨두는 무료 보관 시설입니다." },
    ],
    questions: [
      {
        id: "en-dlg-lib-3-q1",
        site: "english",
        skillId: "dlg.en.lib",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "Why must bulky bags and backpacks be stored in cloakroom lockers?",
        options: [
          { id: "a", text: "To safeguard delicate artwork from accidental bumps" },
          { id: "b", text: "Because bags are sold at auction" },
          { id: "c", text: "To weigh the bags for shipping fees" },
          { id: "d", text: "To hide paintings inside" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Review the gallery attendant's explanation on protecting artwork.", "Review the key statements in the dialogue carefully."],
        explanation: "The gallery attendant explained that storing bulky bags safeguards delicate artwork from accidental bumps and contact.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-car-1",
    category: "car_rental",
    site: "english",
    titleKo: "렌터카 차량 인수와 완전 자차 보험",
    titleEn: "Rental Car Pickup & Collision Damage Waiver Insurance",
    difficulty: 3,
    gradeScope: "M1",
    semester: 1,
    locationKo: "공항 렌터카 서비스 카운터",
    locationEn: "Airport car rental customer service counter",
    turns: [
      { speaker: "A", speakerRole: "Rental Agent", text: "Good afternoon! How can I help you today?", translation: "좋은 오후입니다! 오늘 어떻게 도와드릴까요?" },
      { speaker: "B", speakerRole: "Renter", text: "Hello, I have a confirmed reservation for a compact SUV under the name David Chen.", translation: "안녕하세요, 데이비드 첸이라는 이름으로 소형 SUV 예약이 확정되어 있습니다." },
      { speaker: "A", speakerRole: "Rental Agent", text: "I see your booking. May I inspect your valid driver license, passport, and payment credit card?", translation: "예약이 확인되었습니다. 유효한 운전면허증과 여권, 결제용 신용카드를 확인해도 될까요?" },
      { speaker: "B", speakerRole: "Renter", text: "Here are my credentials. Does my rental agreement include a full Collision Damage Waiver (CDW)?", translation: "여기 제 서류들입니다. 제 임대 계약에 완전 자차 종합보험(CDW)이 포함되어 있나요?" },
      { speaker: "A", speakerRole: "Rental Agent", text: "Yes, zero-deductible CDW and roadside assistance are fully bundled. Your vehicle is parked in stall B-12.", translation: "네, 자기부담금 0원의 완전 자차보험과 긴급출동 서비스가 포함되어 있습니다. 차량은 B-12 구역에 주차되어 있습니다." },
    ],
    keyExpressions: [
      { target: "Collision Damage Waiver (CDW)", meaning: "차량 손해 면책 제도(자차 보험)", explanation: "사고나 파손 시 운전자의 배상 책임을 면제해 주는 렌터카 종합보험입니다." },
      { target: "zero-deductible", meaning: "자기부담금 0원(전액 보장)", explanation: "사고 시 고객이 지불해야 하는 공제 면책금이 전혀 없음을 의미합니다." },
    ],
    questions: [
      {
        id: "en-dlg-car-1-q1",
        site: "english",
        skillId: "dlg.en.car",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What level of insurance coverage was confirmed for David Chen's car rental?",
        options: [
          { id: "a", text: "Zero-deductible Collision Damage Waiver (CDW)" },
          { id: "b", text: "No insurance coverage whatsoever" },
          { id: "c", text: "Bicycle collision only" },
          { id: "d", text: "Life insurance for pets only" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the rental agent's confirmation about insurance deductible.", "Review the key statements in the dialogue carefully."],
        explanation: "The rental agent confirmed that zero-deductible CDW and roadside assistance are fully bundled into the booking.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-car-2",
    category: "car_rental",
    site: "english",
    titleKo: "주유소 휘발유 가득 주유와 보너스 카드",
    titleEn: "Gas Station Refueling: Fill It Up with Unleaded",
    difficulty: 2,
    gradeScope: "E4",
    semester: 1,
    locationKo: "주유소 주유 펌프 앞",
    locationEn: "Full-service gas station pump island",
    turns: [
      { speaker: "A", speakerRole: "Gas Attendant", text: "Hello sir! What grade of fuel can I pump for you today?", translation: "안녕하세요 손님! 오늘 어떤 유종으로 주유해 드릴까요?" },
      { speaker: "B", speakerRole: "Driver", text: "Please fill it up with regular unleaded 87 octane.", translation: "일반 무연 휘발유 87 옥탄가로 가득 채워주세요." },
      { speaker: "A", speakerRole: "Gas Attendant", text: "Full tank of regular unleaded, coming right up. Would you like me to wash your front windshield while it pumps?", translation: "일반 무연 가득 주유 시작합니다. 주유되는 동안 앞 유리창을 닦아드릴까요?" },
      { speaker: "B", speakerRole: "Driver", text: "That would be fantastic, thank you! Please also charge this rewards points card with my payment.", translation: "그렇게 해주시면 정말 감사하죠! 결제할 때 이 리워드 포인트 카드도 함께 적립해 주세요." },
    ],
    keyExpressions: [
      { target: "fill it up", meaning: "(연료를) 가득 채워주세요", explanation: "주유소에서 만탱크로 주유해 달라고 할 때 쓰는 가장 표준적인 영어 표현입니다." },
      { target: "regular unleaded", meaning: "일반 무연 휘발유", explanation: "대부분의 가솔린 승용차에 주유하는 표준 등급의 휘발유입니다." },
    ],
    questions: [
      {
        id: "en-dlg-car-2-q1",
        site: "english",
        skillId: "dlg.en.car",
        type: "multiple_choice",
        difficulty: 2,
        prompt: "What fuel grade did the driver request at the gas station?",
        options: [
          { id: "a", text: "Diesel for heavy trucks" },
          { id: "b", text: "Regular unleaded 87 octane (fill it up)" },
          { id: "c", text: "Aviation jet fuel" },
          { id: "d", text: "Kerosene heater oil" },
        ],
        answer: { kind: "choice", id: "b" },
        hints: ["Review the driver's response specifying fuel type.", "Review the key statements in the dialogue carefully."],
        explanation: "The driver explicitly asked to 'fill it up with regular unleaded 87 octane.'",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  },
  {
    id: "en-dlg-car-3",
    category: "car_rental",
    site: "english",
    titleKo: "차량 반납 검사와 주행거리 최종 영수증",
    titleEn: "Car Return Inspection & Highway Toll Settlement",
    difficulty: 3,
    gradeScope: "M2",
    semester: 2,
    locationKo: "렌터카 공항 반납 차고",
    locationEn: "Car rental airport return lane",
    turns: [
      { speaker: "A", speakerRole: "Driver", text: "Good afternoon, I am returning the compact SUV. The fuel tank has been refilled to full.", translation: "좋은 오후입니다, 소형 SUV를 반납하러 왔습니다. 연료 탱크는 가득 채워두었습니다." },
      { speaker: "B", speakerRole: "Return Inspector", text: "I will scan your dashboard odometer and conduct a quick perimeter check for scratches or dents.", translation: "계기판 주행거리계를 스캔하고 차량 외관에 긁힘이나 찌그러짐이 없는지 둘러보겠습니다." },
      { speaker: "A", speakerRole: "Driver", text: "Everything was pristine, and we double-checked the glove compartment for personal items.", translation: "차량은 아주 깨끗하며, 개인 물품을 두고 내리지 않도록 다시방(글로브 박스)도 확인했습니다." },
      { speaker: "B", speakerRole: "Return Inspector", text: "Vehicle condition is flawless and fuel is full. Your automated toll transponder logged $6.50 in highway tolls, which closes out your final receipt.", translation: "차량 상태 완벽하고 연료도 가득 차 있습니다. 전자 통행료 결제기에서 고속도로 톨게이트 비용 6.50달러가 기록되어 최종 영수증이 마감되었습니다." },
    ],
    keyExpressions: [
      { target: "toll transponder", meaning: "전자 통행료 감지 단말기(하이패스)", explanation: "유료 도로 통행 시 멈추지 않고 요금을 자동 결제하는 렌터카 내장 기기입니다." },
      { target: "odometer", meaning: "주행거리계", explanation: "차량이 달린 총 마일(킬로미터) 수를 표시하는 계기판 장치입니다." },
    ],
    questions: [
      {
        id: "en-dlg-car-3-q1",
        site: "english",
        skillId: "dlg.en.car",
        type: "multiple_choice",
        difficulty: 3,
        prompt: "What final charge was added to the car rental return receipt?",
        options: [
          { id: "a", text: "$6.50 in electronic highway tolls" },
          { id: "b", text: "$500 scratch damage penalty" },
          { id: "c", text: "Refueling penalty fee" },
          { id: "d", text: "Airport parking ticket" },
        ],
        answer: { kind: "choice", id: "a" },
        hints: ["Look at the return inspector's final settlement explanation.", "Review the key statements in the dialogue carefully."],
        explanation: "The inspector noted that vehicle condition was flawless and only $6.50 in automated highway tolls was billed on the final receipt.",
        role: "core",
        status: "PUBLISHED"
      },
    ]
  }
];
