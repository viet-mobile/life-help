"use client";

/**
 * LIFE.HELP Support Store & 050 Safe Virtual Number System
 * 
 * Supports 5 Life Assistance Services:
 * 1. 은행 계좌 개설 도움 (bank-help)
 * 2. 보험 가입 도움 (insurance-help)
 * 3. 구인/구직 도움 (job-help)
 * 4. 병원 동행, 통역 도움 (hospital-help)
 * 5. 이동전화 개통 도움 (mobile-help)
 * 
 * Features:
 * - Seeker: Questionnaire selection + Customer phone converted to 050 temporary safe virtual number.
 * - Helper (헬퍼): Region & Category registration, platform fee agreement, admin approval.
 * - Admin: Provider approval/management + 050 dispatch matching log tracking.
 */

export interface SupportCategoryMeta {
  slug: string;
  key: string;
  icon: string;
  nameKo: string;
  nameEn: string;
  nameVi: string;
  descriptionKo: string;
  descriptionEn: string;
  descriptionVi: string;
  checklistOptionsKo: string[];
  checklistOptionsEn: string[];
  checklistOptionsVi: string[];
}

export const SUPPORT_CATEGORIES: Record<string, SupportCategoryMeta> = {
  "bank-help": {
    slug: "bank-help",
    key: "bankHelp",
    icon: "🏦",
    nameKo: "은행 계좌 개설 도움",
    nameEn: "Bank Account Opening Assistance",
    nameVi: "Hỗ trợ mở tài khoản ngân hàng",
    descriptionKo: "외국인 신분증 계좌 개설, 체크/신용카드 발급, 모바일 뱅킹 및 해외 송금 신청을 모국어로 친절하게 돕습니다.",
    descriptionEn: "Assistance with foreigner bank accounts, debit/credit cards, mobile banking, and international remittances.",
    descriptionVi: "Hỗ trợ mở tài khoản bằng giấy tờ người nước ngoài, phát hành thẻ ngân hàng, đăng ký chuyển tiền quốc tế.",
    checklistOptionsKo: [
      "외국인등록증/여권 소지 계좌 신규 개설",
      "체크카드 / 신용카드 발급 신청",
      "모바일 인터넷 뱅킹 및 공인인증서/OTP 발급",
      "본국 해외 송금(Remittance) 한도 증액 및 설정",
      "통장/카드 분실 재발급 및 거래내역 발급",
    ],
    checklistOptionsEn: [
      "New account opening with Alien Card / Passport",
      "Debit or Credit card issuance application",
      "Mobile / Internet banking & Certificate setup",
      "International remittance setup & limit increase",
      "Re-issuance of lost passbook/card & statements",
    ],
    checklistOptionsVi: [
      "Mở tài khoản mới bằng thẻ ARC / Hộ chiếu",
      "Đăng ký phát hành thẻ Check/Credit",
      "Cài đặt Internet Banking & Chứng chỉ xác thực",
      "Cài đặt hạn mức và hỗ trợ chuyển tiền quốc tế",
      "Cấp lại sổ/thẻ bị mất và in sao kê giao dịch",
    ],
  },
  "insurance-help": {
    slug: "insurance-help",
    key: "insuranceHelp",
    icon: "📑",
    nameKo: "보험 가입 도움",
    nameEn: "Insurance Registration Assistance",
    nameVi: "Hỗ trợ đăng ký bảo hiểm",
    descriptionKo: "국민건강보험 외국인 가입, 출국만기/상해보험, 민간 실손의료비, 자동차/오토바이 보험 가입을 지원합니다.",
    descriptionEn: "Assistance with National Health Insurance, departure guarantee/accident insurance, medical indemnity, and auto/moto insurance.",
    descriptionVi: "Hỗ trợ đăng ký bảo hiểm y tế quốc dân, bảo hiểm mãn hạn xuất cảnh, viện phí tai nạn, bảo hiểm xe máy/ô tô.",
    checklistOptionsKo: [
      "국민건강보험(외국인 직장/지역가입) 자격 확인 및 등록",
      "체류자격별 외국인 전용 의무보험(출국만기/귀국비용/상해보험)",
      "민간 실손의료비 보험 및 수술비/입원비 보장 상담",
      "자동차/이륜차(오토바이) 의무보험 및 종합보험 비교 가입",
      "보험금 청구 서류 안내 및 모국어 번역 지원",
    ],
    checklistOptionsEn: [
      "National Health Insurance verification & registration",
      "Foreign worker mandatory insurance (departure/accident)",
      "Private medical indemnity & hospitalization insurance",
      "Car / Motorcycle compulsory & comprehensive insurance",
      "Insurance claim filing guidance & document interpretation",
    ],
    checklistOptionsVi: [
      "Xác nhận & đăng ký Bảo hiểm Y tế Quốc dân cho người nước ngoài",
      "Bảo hiểm bắt buộc theo visa (Mãn hạn xuất cảnh / Tai nạn)",
      "Bảo hiểm y tế tư nhân, hỗ trợ viện phí & phẫu thuật",
      "Bảo hiểm bắt buộc & toàn diện cho xe máy / ô tô",
      "Hướng dẫn hồ sơ đòi bồi thường bảo hiểm & thông dịch",
    ],
  },
  "job-help": {
    slug: "job-help",
    key: "jobHelp",
    icon: "💼",
    nameKo: "구인/구직 도움",
    nameEn: "Job Search & Recruitment Assistance",
    nameVi: "Hỗ trợ tìm việc làm & tuyển dụng",
    descriptionKo: "합법 체류 비자별 맞춤 취업처 매칭, 이력서 작성 지원, 또는 외국인 직원을 필요로 하는 사업주의 구인 공고를 연결합니다.",
    descriptionEn: "Matching legal visa holders with suitable workplaces, resume assistance, and connecting employers seeking international staff.",
    descriptionVi: "Kết nối việc làm phù hợp theo visa cư trú hợp pháp, hỗ trợ viết CV và kết nối chủ doanh nghiệp tuyển dụng.",
    checklistOptionsKo: [
      "제조업 / 공장 생산직 / 조립 / 검사 (숙식 제공 가능)",
      "음식점 / 식당 주방 보조 / 홀서빙 / 조리사",
      "건설 / 인테리어 현장 및 설비 작업",
      "무역 / 물류 / 통번역 / 사무직 / 전문직",
      "사업주: 신뢰할 수 있는 성실한 외국인 직원 채용 의뢰",
    ],
    checklistOptionsEn: [
      "Manufacturing / Factory production & assembly (Dormitory)",
      "Restaurant kitchen assistant / Hall serving / Cook",
      "Construction / Interior site & equipment work",
      "Trade / Logistics / Interpretation / Office professional",
      "Employer: Hiring qualified & diligent international staff",
    ],
    checklistOptionsVi: [
      "Sản xuất / Công xưởng / Lắp ráp linh kiện (Có KTX)",
      "Nhà hàng / Phụ bếp / Phục vụ bàn / Đầu bếp",
      "Xây dựng / Nội thất công trình / Kỹ thuật hiện trường",
      "Thương mại / Logistics / Thông phiên dịch / Văn phòng",
      "Dành cho chủ doanh nghiệp: Yêu cầu tuyển dụng lao động",
    ],
  },
  "hospital-help": {
    slug: "hospital-help",
    key: "hospitalHelp",
    icon: "🏥",
    nameKo: "병원 동행, 통역 도움",
    nameEn: "Hospital Escort & Medical Interpretation",
    nameVi: "Đồng hành bệnh viện & thông dịch y tế",
    descriptionKo: "병원 진료 예약, 접수, 진료실 동행 통역, 약국 복약지도까지 낯선 의료 환경을 안심하고 이용할 수 있도록 지원합니다.",
    descriptionEn: "Escort and interpretation for hospital bookings, receptionist desk, doctor consultations, and pharmacy prescription guidance.",
    descriptionVi: "Đặt lịch khám bệnh, hỗ trợ tiếp đón, thông dịch trong phòng khám của bác sĩ và hướng dẫn mua thuốc an tâm.",
    checklistOptionsKo: [
      "대학병원 / 종합병원 전문과 진료 예약 및 사전 접수",
      "치과 / 정형외과 / 내과 / 피부과 진료 시 의사 소통 동행 통역",
      "외국인 건강검진 동행 및 종합 결과표 모국어 설명",
      "약국 처방전 약 복약 방법 및 주의사항 안내",
      "야간 / 응급실 방문 시 긴급 전화 통역 및 현장 지원",
    ],
    checklistOptionsEn: [
      "General hospital / University medical center appointments",
      "Dental / Orthopedic / Internal / Dermatology doctor escort & translation",
      "Health checkup escort & translated medical report explanation",
      "Pharmacy prescription dosing instructions & warnings",
      "Night / Emergency room urgent telephone translation & assistance",
    ],
    checklistOptionsVi: [
      "Đặt lịch khám chuyên khoa tại Bệnh viện Đa khoa / Đại học",
      "Đồng hành thông dịch tại Nha khoa / Chấn thương chỉnh hình / Nội khoa",
      "Đi cùng khám sức khỏe định kỳ & giải thích kết quả",
      "Hướng dẫn sử dụng thuốc theo đơn và lưu ý quan trọng",
      "Hỗ trợ thông dịch khẩn cấp qua điện thoại khi vào phòng cấp cứu",
    ],
  },
  "mobile-help": {
    slug: "mobile-help",
    key: "mobileHelp",
    icon: "📱",
    nameKo: "이동전화 개통 도움",
    nameEn: "Mobile Phone Activation Assistance",
    nameVi: "Hỗ trợ đăng ký mở mạng di động",
    descriptionKo: "외국인 명의 알뜰폰(USIM) 선불/후불 개통, 본인인증 가능 유심, 최신 단말기 구매, 가정용 인터넷/와이파이 설치를 돕습니다.",
    descriptionEn: "Foreigner USIM card postpaid/prepaid activation with ID authentication, new phone devices, and home internet/Wi-Fi setup.",
    descriptionVi: "Đăng ký mở mạng SIM trả trước/trả sau đứng tên người nước ngoài, SIM xác thực danh tính, điện thoại mới & Wi-Fi gia đình.",
    checklistOptionsKo: [
      "외국인등록증/여권으로 본인 인증 가능한 알뜰폰(USIM) 개통",
      "선불 유심(Prepaid SIM) 간편 충전 및 데이터 무제한 요금제",
      "통신 3사(SKT/KT/LGU+) 약정 신규 개통 및 단말기 기기변경",
      "원룸/가정용 초고속 인터넷 및 기가 와이파이(Wi-Fi) 설치 상담",
      "통신비 미납/정지 해제 및 번호이동 안내",
    ],
    checklistOptionsEn: [
      "Affordable USIM activation with identity authentication support",
      "Prepaid SIM easy recharge & unlimited data plans",
      "Major telecom carrier contract activation & phone upgrade",
      "High-speed home internet & Giga Wi-Fi installation",
      "Unpaid bill clearance, phone reactivation & number transfer",
    ],
    checklistOptionsVi: [
      "Kích hoạt SIM giá rẻ (USIM) có xác thực danh tính cho người nước ngoài",
      "Nạp tiền SIM trả trước & gói cước data không giới hạn",
      "Mở mạng cam kết tại các nhà mạng lớn & đổi máy mới",
      "Tư vấn lắp đặt Internet tốc độ cao & Wi-Fi gia đình",
      "Xử lý nợ cước viễn thông, mở khóa sim & chuyển mạng giữ số",
    ],
  },
  "clog-clearing": {
    slug: "clog-clearing",
    key: "clog",
    icon: "🚽",
    nameKo: "변기, 싱크대, 하수구 등 각종 막힘 해결",
    nameEn: "Toilet, Sink, Sewer & Drain Unclogging Solutions",
    nameVi: "Thông tắc bồn cầu, bồn rửa, cống rãnh các loại",
    descriptionKo: "변기 역류, 싱크대 막힘, 욕실 배수구 및 하수관 막힘을 특수 전동 스프링 및 고압 세척 장비로 24시간 신속하게 뚫어드립니다.",
    descriptionEn: "Emergency clearing of clogged toilets, blocked sinks, floor drains, and sewer pipes using specialized electric augers and high-pressure jetting.",
    descriptionVi: "Xử lý thông tắc khẩn cấp bồn cầu trào ngược, bồn rửa bát, cống sàn nhà tắm bằng thiết bị máy lò xo chuyên dụng và máy thông áp lực cao.",
    checklistOptionsKo: [
      "변기 물이 전혀 내려가지 않고 역류하여 차오름",
      "변기에 물티슈, 칫솔, 뚜껑 등 이물질이 빠짐",
      "싱크대 배수구에서 썩은 냄새가 나고 물이 고임",
      "싱크대 하부 호스 또는 바닥 배관에서 물이 넘침",
      "욕실/화장실 바닥 하수구 머리카락 막힘 및 역류",
    ],
    checklistOptionsEn: [
      "Toilet water is not draining at all and overflowing",
      "Foreign object (wet wipe, toothbrush, cap) fell into toilet",
      "Kitchen sink has bad odor and water is pooling",
      "Water is overflowing from under-sink pipe or floor drain",
      "Bathroom floor drain clogged with hair and overflowing",
    ],
    checklistOptionsVi: [
      "Nước bồn cầu hoàn toàn không thoát được và bị trào ngược",
      "Vật thể lạ (khăn ướt, bàn chải, nắp lọ) rơi vào bồn cầu",
      "Bồn rửa bát có mùi hôi thối và nước bị đọng ứ",
      "Nước tràn ra từ ống dưới bồn rửa hoặc đường ống sàn",
      "Cống sàn nhà tắm bị tắc do tóc và trào ngược",
    ],
  },
  "leak-plumbing": {
    slug: "leak-plumbing",
    key: "leakPlumbing",
    icon: "💧",
    nameKo: "누수 방지, 누수 탐지, 수도 배관 공사 등",
    nameEn: "Water Leak Prevention, Detection & Plumbing Works",
    nameVi: "Chống rò rỉ, dò tìm rò rỉ, thi công đường ống nước",
    descriptionKo: "정밀 청음식·가스식 누수 탐지기로 미세 누수를 정확하게 찾아내고, 노후 수도관 교체 및 방수 공사를 전문 시공합니다.",
    descriptionEn: "Precision leak detection using acoustic and tracer gas equipment, water pipe replacement, and waterproofing construction.",
    descriptionVi: "Dò tìm rò rỉ nước chính xác bằng máy dò khí và siêu âm, sửa chữa đường ống nước cũ hỏng và thi công chống thấm chuyên nghiệp.",
    checklistOptionsKo: [
      "천장 또는 벽면에서 물이 뚝뚝 떨어져 벽지가 젖음",
      "수도 요금이 비정상적으로 많이 나오고 아랫집에서 누수 항의",
      "수도꼭지(수전)가 완전히 잠기지 않고 녹물이 나오거나 누수",
      "싱크대 하부 배관 파손으로 바닥에 물이 흥건함",
    ],
    checklistOptionsEn: [
      "Water dripping from ceiling or wall, wetting wallpaper",
      "Water bill is abnormally high and downstairs neighbor reports leak",
      "Faucet does not close completely or dispenses rusty water",
      "Broken pipe under sink causing water pooling on the floor",
    ],
    checklistOptionsVi: [
      "Nước nhỏ giọt từ trần nhà hoặc tường làm ướt giấy dán tường",
      "Hóa đơn tiền nước tăng bất thường và hàng xóm phản ánh bị rò rỉ",
      "Vòi nước không khóa chặt được hoặc chảy ra nước gỉ sét",
      "Đường ống dưới bồn rửa bị hỏng và rò rỉ nước ra sàn",
    ],
  },
  "boiler": {
    slug: "boiler",
    key: "boiler",
    icon: "♨️",
    nameKo: "보일러 설치, 시공, 수리",
    nameEn: "Boiler Installation, Construction & Heating Repair",
    nameVi: "Lắp đặt, thi công, sửa chữa bình nóng lạnh / nồi hơi",
    descriptionKo: "친환경 콘덴싱 가스보일러 교체, 온수 불량 및 난방 배관 청소, 온도조절기 에러코드 고장을 신속하게 점검 수리합니다.",
    descriptionEn: "Condensing boiler installation, hot water failure repair, heating pipe flushing, and thermostat troubleshooting.",
    descriptionVi: "Lắp đặt và sửa chữa bình nóng lạnh, nồi hơi sưởi ấm sàn nhà, súc rửa đường ống nước nóng và khắc phục mã lỗi bảng điều khiển.",
    checklistOptionsKo: [
      "보일러 실내온도조절기에 에러코드가 깜빡이며 온수/난방 불가",
      "보일러 가동 시 굉음이 발생하거나 이상 가스 냄새 발생",
      "온수 배관 순환 불량으로 방 일부만 차갑고 난방이 안 됨",
    ],
    checklistOptionsEn: [
      "Boiler thermostat blinks error code; no hot water or heating",
      "Boiler makes loud noise or unusual gas odor when operating",
      "Uneven floor heating circulation causing cold spots in room",
    ],
    checklistOptionsVi: [
      "Bình nóng lạnh/nồi hơi báo mã lỗi nhấp nháy, không có nước nóng",
      "Có tiếng ồn lớn hoặc mùi gas bất thường khi bật bình nóng lạnh",
      "Bảng điều khiển nhiệt độ không hoạt động hoặc không chỉnh được",
    ],
  },
  "cleaning": {
    slug: "cleaning",
    key: "cleaning",
    icon: "🧹",
    nameKo: "전문 청소 · 입주·특수·청결",
    nameEn: "Professional Cleaning · Move-in & Deep Clean",
    nameVi: "Vệ sinh chuyên nghiệp · Dọn nhà & Khử khuẩn sâu",
    descriptionKo: "원룸/오피스텔 이사·입주 청소, 곰팡이 및 기름때 고온 스팀 살균, 에어컨 분해 세척 등 전문 위생 관리를 제공합니다.",
    descriptionEn: "Move-in cleaning for studios and apartments, mold and grease high-temperature steam sterilization, and AC deep cleaning.",
    descriptionVi: "Dọn dẹp nhà chuyển vào ở mới cho căn hộ/phòng trọ, khử khuẩn nấm mốc và vết dầu mỡ bằng hơi nước nóng, vệ sinh máy lạnh.",
    checklistOptionsKo: [
      "원룸/오피스텔 이사 전 입주 청소 및 묵은 때 살균 세척",
      "욕실 타일 줄눈 곰팡이 및 창틀 찌든 먼지 고온 스팀 청소",
      "주방 가스레인지 기름때 및 싱크대 배수구 고온 살균 세척",
    ],
    checklistOptionsEn: [
      "Move-in deep cleaning and sterilization for studio/apartment",
      "Steam cleaning for bathroom mold, grime, and window tracks",
      "Kitchen stove grease removal and sink drain steam sanitation",
    ],
    checklistOptionsVi: [
      "Cần dọn dẹp vệ sinh tổng thể trước khi chuyển vào nhà mới",
      "Tẩy nấm mốc và vết ố bẩn lâu ngày trong phòng tắm, khe cửa sổ",
      "Vệ sinh vết dầu mỡ nhà bếp và khử khuẩn bồn rửa",
    ],
  },
  "housing": {
    slug: "housing",
    key: "housing",
    icon: "🏠",
    nameKo: "원룸/투룸 맞춤 방 구하기",
    nameEn: "Room Finding & Safe Housing Rental Assistance",
    nameVi: "Tìm phòng trọ & Hỗ trợ thuê nhà an toàn",
    descriptionKo: "외국인 입주 가능한 풀옵션 원룸/투룸 매물 추천, 보증금 안심 임대차 계약서 검토 및 전입신고·확정일자를 모국어로 안내합니다.",
    descriptionEn: "Foreigner-friendly furnished studio/apartment search, safe lease agreement review, deposit protection, and move-in registration.",
    descriptionVi: "Giới thiệu phòng trọ/căn hộ đầy đủ tiện nghi cho người nước ngoài, kiểm tra hợp đồng thuê bảo toàn tiền cọc và hỗ trợ khai báo cư trú.",
    checklistOptionsKo: [
      "외국인 계약 가능한 풀옵션 원룸/투룸 맞춤 방 찾기",
      "보증금 안심 임대차 계약서 검토 및 전입신고·확정일자 지원",
      "임대인과의 의사소통 및 관리비/공과금 정산 안내",
    ],
    checklistOptionsEn: [
      "Finding furnished studio or 1-bedroom apartment for foreigners",
      "Safe lease contract review and deposit protection verification",
      "Landlord communication and utility bill settlement assistance",
    ],
    checklistOptionsVi: [
      "Tìm phòng trọ, căn hộ một/hai phòng đầy đủ đồ đạc tiện nghi",
      "Tư vấn hợp đồng thuê an toàn cho người nước ngoài, bảo vệ tiền cọc",
      "Hỗ trợ đăng ký chuyển vào cư trú và công chứng hợp đồng",
    ],
  },
};

// Aliases for backward compatibility
SUPPORT_CATEGORIES["toilet-clog"] = SUPPORT_CATEGORIES["clog-clearing"];
SUPPORT_CATEGORIES["sink-clog"] = SUPPORT_CATEGORIES["clog-clearing"];
SUPPORT_CATEGORIES["drain-clog"] = SUPPORT_CATEGORIES["clog-clearing"];
SUPPORT_CATEGORIES["water-leak"] = SUPPORT_CATEGORIES["leak-plumbing"];
SUPPORT_CATEGORIES["leak-detection"] = SUPPORT_CATEGORIES["leak-plumbing"];
SUPPORT_CATEGORIES["water"] = SUPPORT_CATEGORIES["leak-plumbing"];
SUPPORT_CATEGORIES["plumbing"] = SUPPORT_CATEGORIES["leak-plumbing"];


/**
 * Customer Direct Phone Contact (050 virtual number retracted per user request)
 */
export function generate050SafeNumber(phone?: string): string {
  return phone || "직접 연락";
}

export interface SupportRequest {
  id: string;
  category: string;
  country: string;
  sido: string;
  gungu: string;
  dong: string;
  customerRealPhone: string;
  customerSafePhone?: string; // Kept as optional for UI backward compatibility
  selectedNeeds: string[];
  memo?: string;
  status: "pending" | "matched" | "completed";
  createdAt: string;
  matchedPartnerName?: string;
  matchedPartnerPhone?: string;
}

export interface SupportPartner {
  id: string;
  name: string;
  phone: string;
  categories: string[];
  country: string;
  regions: string[];
  agreedToFee: boolean; // 플랫폼 광고/알선 수수료 동의 (예: 10% 또는 건당 수수료)
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  bio?: string;
  rating?: number;
  completedCases?: number;
}

const STORAGE_REQUESTS_KEY = "life_help_support_requests_v1";
const STORAGE_PARTNERS_KEY = "life_help_support_partners_v1";

// Initial seed mock data for partners so the admin page is functional out of the box
const DEFAULT_PARTNERS: SupportPartner[] = [
  {
    id: "sp-1",
    name: "글로벌 비자·행정 지원센터 (김도현 팀장)",
    phone: "010-3849-1928",
    categories: ["bank-help", "insurance-help"],
    country: "KR",
    regions: ["서울특별시 영등포구 대림동", "서울특별시 구로구 구로동"],
    agreedToFee: true,
    status: "approved",
    createdAt: "2026-09-01T10:30:00Z",
    bio: "외국인 고객 전문 10년 경력. 은행 계좌 개설 및 4대보험, 출국만기보험 전문 상담",
    rating: 4.9,
    completedCases: 38,
  },
  {
    id: "sp-2",
    name: "하노이 메디컬 통역 케어 (응우옌 티 마이)",
    phone: "010-8274-9912",
    categories: ["hospital-help"],
    country: "KR",
    regions: ["경기도 안산시 단원구 원곡동", "경기도 시흥시 정왕동"],
    agreedToFee: true,
    status: "approved",
    createdAt: "2026-09-05T14:15:00Z",
    bio: "베트남어-한국어 의료 전문 통역사 1급 자격 보유. 대학병원 종합검진 및 진료 동행 500건 이상",
    rating: 5.0,
    completedCases: 64,
  },
  {
    id: "sp-3",
    name: "월드 모바일 & 알뜰폰 통신센터",
    phone: "010-5621-3344",
    categories: ["mobile-help"],
    country: "KR",
    regions: ["서울특별시", "경기도", "인천광역시"],
    agreedToFee: true,
    status: "approved",
    createdAt: "2026-09-08T09:00:00Z",
    bio: "외국인 명의 선불/후불 유심 당일 즉시 개통, 신분증 인증 지원",
    rating: 4.8,
    completedCases: 92,
  },
  {
    id: "sp-4",
    name: "동남아 취업 & 일자리 네트워크 (박준호 대표)",
    phone: "010-7712-4589",
    categories: ["job-help"],
    country: "KR",
    regions: ["충청남도 천안시", "충청북도 청주시", "경기도 화성시"],
    agreedToFee: true,
    status: "pending",
    createdAt: "2026-09-14T11:20:00Z",
    bio: "합법 비자 소지 외국인 근로자 제조업/물류/서비스 채용 연계 전문",
    rating: 0,
    completedCases: 0,
  },
  {
    id: "sp-5",
    name: "아시안 라이프 파트너스 (첸 웨이)",
    phone: "010-4491-8823",
    categories: ["bank-help", "job-help", "mobile-help"],
    country: "KR",
    regions: ["부산광역시 사상구", "김해시"],
    agreedToFee: true,
    status: "pending",
    createdAt: "2026-09-14T16:45:00Z",
    bio: "중국어/베트남어 다국어 상담원 상주. 외국인 생활 정착 One-stop 지원",
    rating: 0,
    completedCases: 0,
  },
];

// Initial seed mock requests
const DEFAULT_REQUESTS: SupportRequest[] = [
  {
    id: "sr-1001",
    category: "bank-help",
    country: "KR",
    sido: "서울특별시",
    gungu: "영등포구",
    dong: "대림동",
    customerRealPhone: "010-9123-4567",
    customerSafePhone: "050-7182-9341",
    selectedNeeds: ["외국인등록증/여권 소지 계좌 신규 개설", "체크카드 / 신용카드 발급 신청"],
    memo: "한국어 소통이 서툴러 베트남어 가능한 헬퍼를 희망합니다.",
    status: "matched",
    createdAt: "2026-09-14T13:10:00Z",
    matchedPartnerName: "글로벌 비자·행정 지원센터 (김도현 팀장)",
    matchedPartnerPhone: "010-3849-1928",
  },
  {
    id: "sr-1002",
    category: "hospital-help",
    country: "KR",
    sido: "경기도",
    gungu: "안산시 단원구",
    dong: "원곡동",
    customerRealPhone: "010-8877-6655",
    customerSafePhone: "050-8823-1109",
    selectedNeeds: ["대학병원 / 종합병원 전문과 진료 예약 및 사전 접수", "치과 / 정형외과 / 내과 / 피부과 진료 시 의사 소통 동행 통역"],
    memo: "무릎 통증으로 정형외과 진료 예약 동행이 필요합니다.",
    status: "matched",
    createdAt: "2026-09-14T15:30:00Z",
    matchedPartnerName: "하노이 메디컬 통역 케어 (응우옌 티 마이)",
    matchedPartnerPhone: "010-8274-9912",
  },
  {
    id: "sr-1003",
    category: "mobile-help",
    country: "KR",
    sido: "서울특별시",
    gungu: "구로구",
    dong: "구로동",
    customerRealPhone: "010-3344-7788",
    customerSafePhone: "050-4491-6205",
    selectedNeeds: ["외국인등록증/여권으로 본인 인증 가능한 알뜰폰(USIM) 개통", "선불 유심(Prepaid SIM) 간편 충전 및 데이터 무제한 요금제"],
    memo: "본인인증 가능한 알뜰폰 유심 즉시 수령 원함",
    status: "pending",
    createdAt: "2026-09-14T17:00:00Z",
  },
];

export function getStoredSupportRequests(): SupportRequest[] {
  if (typeof window === "undefined") return DEFAULT_REQUESTS;
  try {
    const raw = localStorage.getItem(STORAGE_REQUESTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(DEFAULT_REQUESTS));
      return DEFAULT_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REQUESTS;
  }
}

export function saveSupportRequest(req: Omit<SupportRequest, "id" | "customerSafePhone" | "status" | "createdAt">): SupportRequest {
  const current = getStoredSupportRequests();
  const newReq: SupportRequest = {
    ...req,
    id: `sr-${Date.now().toString().slice(-6)}`,
    customerSafePhone: req.customerRealPhone,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const updated = [newReq, ...current];
  try {
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("support_requests_changed"));
  } catch {
    // ignore
  }
  return newReq;
}

export function updateSupportRequestStatus(
  id: string,
  status: SupportRequest["status"],
  matchedPartnerName?: string,
  matchedPartnerPhone?: string
) {
  const current = getStoredSupportRequests();
  const updated = current.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        status,
        matchedPartnerName: matchedPartnerName || r.matchedPartnerName,
        matchedPartnerPhone: matchedPartnerPhone || r.matchedPartnerPhone,
      };
    }
    return r;
  });
  try {
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("support_requests_changed"));
  } catch {
    // ignore
  }
}

export function getStoredSupportPartners(): SupportPartner[] {
  if (typeof window === "undefined") return DEFAULT_PARTNERS;
  try {
    const raw = localStorage.getItem(STORAGE_PARTNERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(DEFAULT_PARTNERS));
      return DEFAULT_PARTNERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PARTNERS;
  }
}

export function registerSupportPartner(
  partner: Omit<SupportPartner, "id" | "status" | "createdAt">
): SupportPartner {
  const current = getStoredSupportPartners();
  const newPartner: SupportPartner = {
    ...partner,
    id: `sp-${Date.now().toString().slice(-6)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedCases: 0,
    rating: 5.0,
  };

  const updated = [newPartner, ...current];
  try {
    localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("support_partners_changed"));
  } catch {
    // ignore
  }
  return newPartner;
}

export function updateSupportPartnerStatus(
  id: string,
  status: SupportPartner["status"]
) {
  const current = getStoredSupportPartners();
  const updated = current.map((p) => (p.id === id ? { ...p, status } : p));
  try {
    localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("support_partners_changed"));
  } catch {
    // ignore
  }
}

