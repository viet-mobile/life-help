import type { Difficulty, Grade, Question, Site } from "@/lib/learn/types";

export type SituationCategory =
  | "hospital"
  | "airport"
  | "store"
  | "classroom"
  | "amusement_park"
  | "restaurant"
  | "wedding"
  | "hotel"
  | "transport"
  | "bank"
  | "post_office"
  | "housing"
  | "public_office"
  | "workplace"
  | "salon"
  | "lost_found"
  | "fitness"
  | "library_museum"
  | "car_rental";

export interface DialogueTurn {
  speaker: "A" | "B";
  speakerRole?: string;
  text: string;
  translation: string;
  audioHint?: string;
}

export interface KeyExpression {
  target: string;
  meaning: string;
  explanation?: string;
}

export interface SituationalDialogue {
  id: string;
  category: SituationCategory;
  site: Site;
  titleKo: string;
  titleEn: string;
  difficulty: Difficulty;
  gradeScope: Grade;
  semester: 0 | 1 | 2;
  locationKo: string;
  locationEn: string;
  imageUrl?: string;
  turns: DialogueTurn[];
  keyExpressions: KeyExpression[];
  questions: Question[];
}

export const SITUATION_CATEGORIES: readonly SituationCategory[] = [
  "hospital",
  "airport",
  "store",
  "classroom",
  "amusement_park",
  "restaurant",
  "wedding",
  "hotel",
  "transport",
  "bank",
  "post_office",
  "housing",
  "public_office",
  "workplace",
  "salon",
  "lost_found",
  "fitness",
  "library_museum",
  "car_rental",
] as const;

export interface CategoryInfo {
  id: SituationCategory;
  emoji: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  imageUrl?: string;
}

export const CATEGORY_INFO: Record<SituationCategory, CategoryInfo> = {
  hospital: {
    id: "hospital",
    emoji: "🏥",
    nameKo: "병원·약국",
    nameEn: "Hospital & Pharmacy",
    descriptionKo: "증상 설명, 외래 진료 접수, 약국 복약 안내 (일반 외래 중심)",
    descriptionEn: "Describing symptoms, clinic reception, and pharmacy consultations",
    imageUrl: "/images/dialogues/hospital_1.png",
  },
  airport: {
    id: "airport",
    emoji: "✈️",
    nameKo: "공항·입국",
    nameEn: "Airport & Immigration",
    descriptionKo: "탑승 수속, 보안검색, 입국심사 문답, 수하물 수령 및 교통편",
    descriptionEn: "Flight check-in, security, immigration interviews, and baggage claim",
    imageUrl: "/images/dialogues/airport_1.png",
  },
  store: {
    id: "store",
    emoji: "🛒",
    nameKo: "상점·쇼핑",
    nameEn: "Store & Shopping",
    descriptionKo: "가격 문의, 사이즈 및 색상 요청, 결제(카드/현금), 교환 및 환불",
    descriptionEn: "Inquiring prices, requesting sizes, payments, and product returns",
    imageUrl: "/images/dialogues/store_1.png",
  },
  classroom: {
    id: "classroom",
    emoji: "🏫",
    nameKo: "교실·학교",
    nameEn: "Classroom & School",
    descriptionKo: "수업 참여 및 지시문, 질문하기, 과제 제출, 급우와의 대화",
    descriptionEn: "Class participation, instructions, asking questions, and school life",
    imageUrl: "/images/dialogues/classroom_1.png",
  },
  amusement_park: {
    id: "amusement_park",
    emoji: "🎡",
    nameKo: "놀이공원",
    nameEn: "Amusement Park",
    descriptionKo: "매표소 발권, 놀이기구 대기 및 탑승 안내, 테마파크 시설 길찾기",
    descriptionEn: "Ticket counter, ride waiting & safety, and park navigation",
    imageUrl: "/images/dialogues/amusement_park_1.png",
  },
  restaurant: {
    id: "restaurant",
    emoji: "🍽️",
    nameKo: "식당·주문",
    nameEn: "Restaurant & Dining",
    descriptionKo: "인원 안내, 메뉴 추천 및 주문, 추가 반찬 요청, 계산서 요청",
    descriptionEn: "Table seating, menu ordering, requests, and bill settlements",
    imageUrl: "/images/dialogues/restaurant_1.png",
  },
  wedding: {
    id: "wedding",
    emoji: "💒",
    nameKo: "결혼식·예절",
    nameEn: "Wedding & Etiquette",
    descriptionKo: "축하 인사, 축의금 접수 예절, 예식장 위치 안내, 하객 대화",
    descriptionEn: "Congratulations, gift envelope etiquette, ceremony hall directions",
    imageUrl: "/images/dialogues/wedding_1.png",
  },
  hotel: {
    id: "hotel",
    emoji: "🏨",
    nameKo: "호텔·숙박",
    nameEn: "Hotel & Lodging",
    descriptionKo: "체크인/체크아웃, 객실 편의용품 요청, 짐 보관, 조식 안내",
    descriptionEn: "Check-in/out, room amenities, luggage storage, and breakfast",
    imageUrl: "/images/dialogues/hotel_1.png",
  },
  transport: {
    id: "transport",
    emoji: "🚌",
    nameKo: "교통·길찾기",
    nameEn: "Transit & Directions",
    descriptionKo: "지하철·버스 탑승, 택시 목적지 안내, 길 묻기, 환승 노선 확인",
    descriptionEn: "Subway & bus transit, taking a taxi, asking directions & transfers",
    imageUrl: "/images/dialogues/transport_1.png",
  },
  bank: {
    id: "bank",
    emoji: "🏦",
    nameKo: "은행·금융",
    nameEn: "Bank & Finance",
    descriptionKo: "계좌 개설, 외화 환전, ATM 기기 이용, 해외 송금 및 체크카드 재발급",
    descriptionEn: "Opening an account, currency exchange, ATM usage & wire transfer",
    imageUrl: "/images/dialogues/bank_1.png",
  },
  post_office: {
    id: "post_office",
    emoji: "📦",
    nameKo: "우체국·택배",
    nameEn: "Post Office & Parcel",
    descriptionKo: "국제특송(EMS) 접수, 국내 택배 포장 규격, 우표 구매 및 배송 조회",
    descriptionEn: "International EMS shipping, parcel packaging, and tracking",
    imageUrl: "/images/dialogues/post_office_1.png",
  },
  housing: {
    id: "housing",
    emoji: "🏠",
    nameKo: "부동산·주거",
    nameEn: "Housing & Rentals",
    descriptionKo: "원룸/월세 계약 문의, 시설 고장 수리 요청(난방/누수), 집주인 소통",
    descriptionEn: "Apartment rentals, reporting maintenance repairs & landlord talk",
    imageUrl: "/images/dialogues/housing_1.png",
  },
  public_office: {
    id: "public_office",
    emoji: "🏢",
    nameKo: "관공서·이민행정",
    nameEn: "Public & Immigration",
    descriptionKo: "외국인등록증 발급, 체류지 변경 신고, 체류 기간 연장, 서류 발급",
    descriptionEn: "Residence card issuance, address change, visa extension & forms",
    imageUrl: "/images/dialogues/public_office_1.png",
  },
  workplace: {
    id: "workplace",
    emoji: "💼",
    nameKo: "직장·비즈니스",
    nameEn: "Workplace & Office",
    descriptionKo: "입사 면접, 직장 예절, 업무 협조 요청, 회의 발언 및 업무 메일",
    descriptionEn: "Job interviews, workplace etiquette, team collaboration & meetings",
    imageUrl: "/images/dialogues/workplace_1.png",
  },
  salon: {
    id: "salon",
    emoji: "💇",
    nameKo: "미용실·헤어",
    nameEn: "Hair Salon & Styling",
    descriptionKo: "헤어스타일 요청, 기장 다듬기, 샴푸 및 결제, 예약 확인",
    descriptionEn: "Haircut requests, trimming lengths, shampooing & appointments",
    imageUrl: "/images/dialogues/salon_1.png",
  },
  lost_found: {
    id: "lost_found",
    emoji: "🚨",
    nameKo: "분실물·도움요청",
    nameEn: "Lost & Found",
    descriptionKo: "지갑/여권 분실 신고, 습득물 확인, 긴급 민원 안내 (비폭력·안전 중심)",
    descriptionEn: "Lost passport/wallet reports, finding lost items & safe assistance",
    imageUrl: "/images/dialogues/lost_found_1.png",
  },
  fitness: {
    id: "fitness",
    emoji: "🏋️",
    nameKo: "체육관·피트니스",
    nameEn: "Gym & Fitness",
    descriptionKo: "헬스장 회원권 등록, 운동 기구 사용법 문의, GX 프로그램 수강",
    descriptionEn: "Gym membership signup, fitness equipment usage & group classes",
    imageUrl: "/images/dialogues/fitness_1.png",
  },
  library_museum: {
    id: "library_museum",
    emoji: "🎭",
    nameKo: "도서관·박물관",
    nameEn: "Library & Museum",
    descriptionKo: "회원증 발급, 도서 대출/반납, 박물관 오디오 가이드 대여, 관람 예절",
    descriptionEn: "Borrowing library books, museum audio guides & exhibition viewing",
    imageUrl: "/images/dialogues/library_museum_1.png",
  },
  car_rental: {
    id: "car_rental",
    emoji: "🚗",
    nameKo: "렌터카·주유소",
    nameEn: "Car Rental & Gas",
    descriptionKo: "렌터카 예약/인수, 주유소 주유 요청, 내비게이션 조작 및 반납",
    descriptionEn: "Vehicle rental pickup, refueling at gas stations & car return",
    imageUrl: "/images/dialogues/car_rental_1.png",
  },
};
