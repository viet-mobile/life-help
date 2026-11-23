"use client";

import { useMemo, useState } from "react";
import { useOptionalSite } from "./LearnerProvider";
import type { BuildMeta, Site } from "@/lib/learn/types";

export interface LabBuilderViewProps {
  build?: BuildMeta;
  site: Site;
  locale?: string;
  streak: number;
  bonusPieces: number;
  lessonTitle?: string;
  questionIndex: number;
  totalQuestions: number;
}

// 19대 실생활 상황별 한국어 전통 풍류원 & 영어 세계 비행 항로 매핑
interface SubjectLandmarkInfo {
  nameKo: string;
  nameEn: string;
  icon: string;
  blueprintKo: string;
  blueprintEn: string;
  phaseKo: string[];
  phaseEn: string[];
}

const KOREAN_HERITAGE_MAP: Record<string, SubjectLandmarkInfo> = {
  hospital: {
    nameKo: "혜민서(惠民署) 지혜 약원",
    nameEn: "Hyeminseo Healing Pavilion",
    icon: "🌿",
    blueprintKo: "정성 어린 문진(問診), 약재 처방 간호, 치유의 마루방을 조성합니다.",
    blueprintEn: "Assemble traditional herbal consultation rooms, healing verandas, and pulse diagnostics.",
    phaseKo: ["약초원 기단", "문진 처마", "동의보감 서가", "달임 온돌방", "혜민 완원"],
    phaseEn: ["Herbal Base", "Consultation Eaves", "Medical Library", "Boiling Hearth", "Mastery Clinic"],
  },
  airport: {
    nameKo: "관문(關門) 나루터와 풍류 누각",
    nameEn: "Royal Gate Ferry & Vista Pavilion",
    icon: "⛵",
    blueprintKo: "먼 길 떠나는 나그네의 출입 관문과 탁 트인 풍류 누각을 축조합니다.",
    blueprintEn: "Build international river gateways, customs inspection pavilions, and voyage outlook towers.",
    phaseKo: ["나루터 초석", "출도 관문", "순풍 돛대", "풍류 누각", "천리마루 완공"],
    phaseEn: ["Pier Foundation", "Departure Gate", "Windward Mast", "Scenic Tower", "Skyway Completion"],
  },
  store: {
    nameKo: "육의전(六矣廛) 전통 저잣거리",
    nameEn: "Yug-uijeon Silk & Marketplace",
    icon: "🏮",
    blueprintKo: "정직한 상도의와 흥겨운 나눔이 있는 전통 비단전과 저잣거리를 조성합니다.",
    blueprintEn: "Construct reputable silk bazaars, honest weight scales, and thriving market lanes.",
    phaseKo: ["상전 주춧돌", "비단 진열 서까래", "되·말 계측대", "청사초롱 처마", "저잣거리 대성"],
    phaseEn: ["Bazaar Base", "Silk Display Rafters", "Fair Balance Scales", "Lantern Eaves", "Marketplace Grand Opening"],
  },
  classroom: {
    nameKo: "성균관(成均館) 명륜당 글방",
    nameEn: "Sungkyunkwan Academy Hall",
    icon: "📜",
    blueprintKo: "예악(禮樂)과 문장을 닦는 명륜당 강학당과 장서각 서재를 축조합니다.",
    blueprintEn: "Build traditional lecture halls, academic study chambers, and calligraphic scroll desks.",
    phaseKo: ["학사 기단", "명륜 대들보", "지필묵 서탁", "훈장 강론대", "대성지학 완공"],
    phaseEn: ["Scholar Foundation", "Honor Beams", "Calligraphy Desks", "Lectern Dais", "Hall of Wisdom"],
  },
  amusement_park: {
    nameKo: "남사당패 신명놀이 한마당",
    nameEn: "Namsadang Folk Joy Arena",
    icon: "🎭",
    blueprintKo: "풍물놀이와 줄타기, 버나놀이가 어우러지는 신명 나는 야외 연희장을 조성합니다.",
    blueprintEn: "Build outdoor acrobatic rope rings, traditional mask stages, and festival pavilions.",
    phaseKo: ["놀이마당 다지기", "버나 줄타기 기둥", "탈춤 무대", "오색 차양", "신명놀이 대향연"],
    phaseEn: ["Ground Base", "Tightrope Posts", "Mask Dance Stage", "Five-Color Canopy", "Joy Arena Complete"],
  },
  restaurant: {
    nameKo: "수라간(水剌間) 궁중 미식원",
    nameEn: "Royal Suragan Culinary Hall",
    icon: "🍱",
    blueprintKo: "자연의 제철 식재료와 정갈한 손맛을 담는 전통 가마솥 조리실과 반상 정각을 축조합니다.",
    blueprintEn: "Construct royal banquet kitchens, seasoned earthenware pantries, and court dining verandas.",
    phaseKo: ["가마솥 화덕", "옹기 장독대", "칠첩반상 찬마루", "단청 다이닝홀", "수라 진미각 완공"],
    phaseEn: ["Cast-iron Hearth", "Earthenware Jars", "Banquet Veranda", "Painted Dining Hall", "Royal Feast Chamber"],
  },
  wedding: {
    nameKo: "동심결(同心結) 전통 가례청",
    nameEn: "Dongshimgyeol Grand Nuptial Pavilion",
    icon: "💐",
    blueprintKo: "백년가약(百年佳約)을 맺는 화목한 전통 초례청과 청실홍실 연회 누각을 축조합니다.",
    blueprintEn: "Erect matrimonial ceremonial stages, silk-tied arches, and joyous family reception verandas.",
    phaseKo: ["초례청 기단", "기러기 전안상", "청실홍실 매듭 아치", "백년가약 처마", "화합 가례청 완공"],
    phaseEn: ["Altar Foundation", "Goose Table Dais", "Silk Knot Arch", "Eternal Vow Eaves", "Grand Hall of Unity"],
  },
  hotel: {
    nameKo: "구름 머무는 한옥 고택 별서",
    nameEn: "Cloud-Resting Hanok Villa",
    icon: "🏡",
    blueprintKo: "차경(借景)으로 자연을 품고 온돌과 마루가 어우러진 아늑한 쉼터를 건축합니다.",
    blueprintEn: "Build cozy ondol heated rooms, breezy wooden verandas, and tranquil scenic courtyards.",
    phaseKo: ["다듬돌 초석", "소나무 기둥", "창호지 문살", "툇마루 쉼터", "고택 별서 완공"],
    phaseEn: ["Hewn Plinth", "Pine Columns", "Hanji Lattice", "Veranda Rest Area", "Heritage Villa"],
  },
  transport: {
    nameKo: "역참(驛站) 천리길 모빌리티 허브",
    nameEn: "Royal Relay Station Hub",
    icon: "🐎",
    blueprintKo: "팔도강산을 잇는 마패 환승소와 전령 쉼터, 친환경 운송 나들목을 조성합니다.",
    blueprintEn: "Construct historic express dispatch gates, staging post stables, and road interchanges.",
    phaseKo: ["역로 다지기", "마패 교환처", "나그네 쉼터", "봉수 통신망", "천리길 역참 완공"],
    phaseEn: ["Highway Base", "Dispatch Office", "Traveler Rest Hall", "Signal Fire Hub", "Grand Station"],
  },
  bank: {
    nameKo: "호조(戶曹) 상평통보 신용관",
    nameEn: "Hojo Treasury & Credit Pavilion",
    icon: "🪙",
    blueprintKo: "정직한 신용과 공정한 유통을 지키는 상평통보 금고와 자산 교환루를 건축합니다.",
    blueprintEn: "Build honest coin vaults, financial mint pavilions, and public trust ledgers.",
    phaseKo: ["금고 암반석", "철제 빗장문", "상평 환전대", "공정 장부각", "신용 보물각 완공"],
    phaseEn: ["Bedrock Vault", "Iron Barred Gate", "Mint Exchange Counter", "Trust Ledger Room", "Treasury Complete"],
  },
  post_office: {
    nameKo: "파발(擺撥) 통신 소통소",
    nameEn: "Pabal Express Courier Hall",
    icon: "📬",
    blueprintKo: "먼 곳의 소식과 정성을 신속하게 전하는 파발마 교환소와 서신 보관함을 구축합니다.",
    blueprintEn: "Erect swift courier posts, letter-stamping desks, and parcel dispatch wings.",
    phaseKo: ["우편마루 기단", "서신 분류함", "봉인 날인대", "파발 쾌도", "소통 만리원 완공"],
    phaseEn: ["Courier Floor", "Letter Pigeonholes", "Seal Stamping Dais", "Fast Highway", "Post Hub Complete"],
  },
  housing: {
    nameKo: "배산임수(背山臨水) 안식 사랑채",
    nameEn: "Bae-san-im-su Harmony Residence",
    icon: "🏠",
    blueprintKo: "자연 지형과 조화를 이루며 가족의 평온을 지켜주는 친환경 목조 사랑채를 짓습니다.",
    blueprintEn: "Construct geomantically harmonious timber courtyards, quiet study dens, and living verandas.",
    phaseKo: ["풍수 터다지기", "느티나무 대들보", "단열 황토벽", "마당 연못", "평온 안식채 완공"],
    phaseEn: ["Site Grounding", "Zelkova Main Beam", "Clay Insulation Wall", "Courtyard Pond", "Harmony Residence"],
  },
  public_office: {
    nameKo: "열린 애민(愛民) 목민관 청사",
    nameEn: "Open Civic Governance Hall",
    icon: "🏛️",
    blueprintKo: "주민의 목소리에 귀 기울이고 편리한 행정을 돕는 신문고와 열린 마루청을 건축합니다.",
    blueprintEn: "Build transparent civic councils, open community petition desks, and digital service kiosks.",
    phaseKo: ["공민 기단", "신문고 루각", "열린 민원마루", "공명정대 처마", "애민 청사 완공"],
    phaseEn: ["Civic Plinth", "Petition Drum Tower", "Community Veranda", "Fair Governance Eaves", "Civic Center Complete"],
  },
  workplace: {
    nameKo: "규장각(奎章閣) 집현전 학사관",
    nameEn: "Jiphyeonjeon Innovation Studio",
    icon: "💡",
    blueprintKo: "창의적인 지혜를 모으고 미래 기술을 토론하는 지식 연구실과 협업 서당을 조성합니다.",
    blueprintEn: "Construct collaborative research ateliers, invention display halls, and meeting desks.",
    phaseKo: ["집현 주춧돌", "토론 서원마루", "문헌 열람실", "발명품 전각", "규장각 집현관 완공"],
    phaseEn: ["Invention Plinth", "Discussion Floor", "Document Archives", "Apparatus Wing", "Innovation Academy"],
  },
  salon: {
    nameKo: "단장과 맵시의 미(美) 공방",
    nameEn: "Elegance & Style Craft Atelier",
    icon: "🪞",
    blueprintKo: "자연스러운 멋과 품격을 가꾸는 전통 참빗 경대와 한복 맵시 디자인실을 완성합니다.",
    blueprintEn: "Build grooming vanities, comb-carving workbenches, and traditional style ateliers.",
    phaseKo: ["경대 초석", "동백기름 진열대", "자개 거울실", "비단 옷고름방", "미(美) 공방 완공"],
    phaseEn: ["Vanity Base", "Camellia Oil Shelf", "Mother-of-pearl Mirror", "Silk Ribbon Studio", "Style Atelier"],
  },
  lost_found: {
    nameKo: "안심 신문고 유실물 보호소",
    nameEn: "Peace-of-Mind Care & Found Vault",
    icon: "🔍",
    blueprintKo: "이웃의 소중한 물건을 안전하게 보관하고 따뜻하게 주인에게 돌려주는 안심처를 만듭니다.",
    blueprintEn: "Build secure recovery lockers, identity verification desks, and happy return verandas.",
    phaseKo: ["보호소 기단", "정밀 보관함", "신원 확인창구", "안심 인도대", "상부상조 복원소"],
    phaseEn: ["Vault Foundation", "Secure Lockers", "ID Verification Desk", "Return Dais", "Care Sanctuary"],
  },
  fitness: {
    nameKo: "수박도(手搏圖) 기운생동 무예관",
    nameEn: "Subakdo Martial Arts & Vitality Gym",
    icon: "🥋",
    blueprintKo: "심신을 단련하고 호연지기를 기르는 전통 마루 무예 수련장과 활터 과녁대를 축조합니다.",
    blueprintEn: "Construct timber martial training decks, archery target ranges, and breath-control courts.",
    phaseKo: ["연무장 마루", "목검·궁시 시렁", "단전호흡 좌대", "기백 활터", "기운생동 무예관"],
    phaseEn: ["Training Floor", "Archery & Sword Rack", "Meditation Mat", "Bow Target Field", "Vitality Martial Hall"],
  },
  library_museum: {
    nameKo: "장서각(藏書閣) 국보 문화원",
    nameEn: "Jangseogak Heritage Archive",
    icon: "📚",
    blueprintKo: "오천 년 겨레의 기록 문화 유산과 훈민정음 원본을 보존하는 국보 아카이브를 건축합니다.",
    blueprintEn: "Build fireproof heritage vaults, historical manuscript cases, and exhibition corridors.",
    phaseKo: ["방화(防火) 석축", "오동나무 보관함", "훈민정음 특별실", "디지털 열람루", "장서각 대성"],
    phaseEn: ["Stone Firebreak", "Paulownia Boxes", "Hangul Origin Chamber", "Digital Gallery", "Heritage Archive"],
  },
  car_rental: {
    nameKo: "어사마(御使馬) 친환경 마방",
    nameEn: "Royal Steed Eco Transit Station",
    icon: "🐎",
    blueprintKo: "안전하고 쾌적한 전국 유람을 돕는 친환경 전동 마차와 모빌리티 점검대를 구축합니다.",
    blueprintEn: "Construct green eco-carriage docks, travel route maps, and inspection bays.",
    phaseKo: ["마방 초석", "전동마차 충전소", "여정 지도실", "안전 점검장", "모빌리티 마방 완공"],
    phaseEn: ["Stable Foundation", "EV Carriage Dock", "Route Map Lounge", "Safety Check Bay", "Transit Station"],
  },
};

const ENGLISH_ODYSSEY_MAP: Record<string, SubjectLandmarkInfo> = {
  hospital: {
    nameKo: "존스홉킨스 글로벌 메디컬 센터",
    nameEn: "Johns Hopkins Global Medical Hub",
    icon: "🏥",
    blueprintKo: "응급 환자 케어 베이, 약국 복약 센터, 첨단 스마트 헬스케어 윙을 구축합니다.",
    blueprintEn: "Erect trauma bays, pharmacy care stations, and cutting-edge wellness clinical wings.",
    phaseKo: ["접수 라운지", "외래 진료실", "스마트 약제실", "집중 케어실", "메디컬 센터 완공"],
    phaseEn: ["Reception Desk", "Outpatient Wing", "Digital Pharmacy", "Intensive Care Bay", "Medical Hub Complete"],
  },
  airport: {
    nameKo: "JFK & 히드로 스카이 인터내셔널",
    nameEn: "JFK & Heathrow Sky Gateway",
    icon: "🛫",
    blueprintKo: "국제선 활주로, 출입국 심사 터미널, 제트기류 순항 관제탑을 축조합니다.",
    blueprintEn: "Construct transcontinental runways, automated passport gates, and flight control towers.",
    phaseKo: ["활주로 기초", "체크인 터미널", "수하물 벨트", "출국 심사 게이트", "국제공항 대완공"],
    phaseEn: ["Runway Base", "Check-in Concourse", "Baggage Loop", "Immigration Gate", "Sky Hub Grand Open"],
  },
  store: {
    nameKo: "5번가 에코 그린 쇼핑 플라자",
    nameEn: "5th Avenue Green Market Plaza",
    icon: "🛍️",
    blueprintKo: "글로벌 브랜드 플래그십 매장, 셀프 계산 키오스크, 친환경 마켓 광장을 조성합니다.",
    blueprintEn: "Build global retail storefronts, contactless payment counters, and customer concourses.",
    phaseKo: ["매장 베이스", "스마트 진열대", "캐셔 결제 데스크", "고객 서비스 광장", "쇼핑 플라자 완공"],
    phaseEn: ["Retail Plinth", "Smart Display Aisles", "Cashier Consoles", "Customer Plaza", "Plaza Complete"],
  },
  classroom: {
    nameKo: "옥스퍼드 & 하버드 글로벌 아카데미",
    nameEn: "Oxford & Harvard Global Academic Hall",
    icon: "🎓",
    blueprintKo: "토론형 세미나 룸, 인터랙티브 스마트 강의실, 월드 디지털 도서관을 건축합니다.",
    blueprintEn: "Construct debate amphitheatres, interactive multimedia classrooms, and digital archives.",
    phaseKo: ["강의실 기초", "스마트 칠판", "세미나 토론대", "학술 자료실", "글로벌 아카데미 완공"],
    phaseEn: ["Foundation Floor", "Interactive Smartboard", "Seminar Dais", "Research Archives", "Academic Hall Complete"],
  },
  amusement_park: {
    nameKo: "올랜도 원더랜드 인터내셔널 파크",
    nameEn: "Orlando Wonderland Theme Park",
    icon: "🎡",
    blueprintKo: "롤러코스터 트랙, 뮤지컬 퍼레이드 대로, 테마파크 컨트롤 센터를 축조합니다.",
    blueprintEn: "Build thrilling loop coasters, grand parade boulevards, and operations command hubs.",
    phaseKo: ["파크 기단", "어트랙션 레일", "퍼레이드 광장", "스마트 발권소", "원더랜드 대개장"],
    phaseEn: ["Park Foundation", "Attraction Rail", "Parade Boulevard", "Express Ticketing", "Wonderland Grand Opening"],
  },
  restaurant: {
    nameKo: "미쉐린 스타 월드 고메이 비스트로",
    nameEn: "Michelin Star World Gourmet Bistro",
    icon: "🍽️",
    blueprintKo: "글로벌 마스터 셰프 오픈 키친, 와인 페어링 라운지, 파인다이닝 홀을 완성합니다.",
    blueprintEn: "Construct open culinary show kitchens, wine pairing lounges, and fine-dining banquets.",
    phaseKo: ["키친 베이스", "셰프 조리대", "주문 키오스크", "다이닝 홀", "비스트로 완성"],
    phaseEn: ["Kitchen Base", "Chef Prep Station", "Order Console", "Dining Hall", "Bistro Complete"],
  },
  wedding: {
    nameKo: "세인트폴 그랜드 채플 & 리셉션",
    nameEn: "St. Paul Grand Nuptial Chapel",
    icon: "💐",
    blueprintKo: "웅장한 파이프 오르간 연회장, 플라워 아치 버진로드, 축하 리셉션 룸을 구축합니다.",
    blueprintEn: "Erect pipe-organ celebration chambers, floral processional aisles, and reception suites.",
    phaseKo: ["채플 초석", "버진로드 아치", "음향 파이프오르간", "축하 피로연장", "그랜드 채플 완공"],
    phaseEn: ["Chapel Base", "Aisle Floral Arch", "Pipe Organ Acoustic", "Banquet Reception", "Chapel Complete"],
  },
  hotel: {
    nameKo: "리츠칼튼 에코 럭셔리 리조트",
    nameEn: "Ritz-Carlton Eco Grand Resort",
    icon: "🏨",
    blueprintKo: "오토 체크인 로비 라운지, 친환경 오션뷰 스위트, 24시간 컨시어지 데스크를 건축합니다.",
    blueprintEn: "Build automated check-in lobbies, sustainable ocean suites, and concierge hospitality bays.",
    phaseKo: ["로비 기단", "스위트 객실 윙", "인피니티 풀", "스카이라운지", "그랜드 리조트 완공"],
    phaseEn: ["Lobby Floor", "Suite Room Wing", "Infinity Pool", "Sky Lounge", "Grand Resort Complete"],
  },
  transport: {
    nameKo: "그랜드 센트럴 메트로 모빌리티 허브",
    nameEn: "Grand Central Metro Transit Hub",
    icon: "🚆",
    blueprintKo: "고속 철도 승강장, 무인 티켓팅 키오스크, 친환경 시티 환승 센터를 축조합니다.",
    blueprintEn: "Construct high-speed rail concourses, smart ticket gates, and multi-modal transit links.",
    phaseKo: ["플랫폼 기초", "레일 선로망", "환승 티켓 게이트", "중앙 대합실", "모빌리티 허브 완공"],
    phaseEn: ["Platform Base", "Rail Network", "Transit Turnstiles", "Grand Concourse", "Transit Hub Complete"],
  },
  bank: {
    nameKo: "월스트리트 핀테크 & 글로벌 뱅크",
    nameEn: "Wall Street FinTech & Global Bank",
    icon: "🏦",
    blueprintKo: "환전 데스크, 양자 암호화 디지털 볼트, 글로벌 자산 포트폴리오 상담실을 구축합니다.",
    blueprintEn: "Erect foreign exchange windows, quantum-encrypted digital vaults, and wealth advisory suites.",
    phaseKo: ["볼트 암반석", "환전 창구", "핀테크 서버실", "프라이빗 상담룸", "월스트리트 타워 완공"],
    phaseEn: ["Vault Bedrock", "Exchange Counter", "FinTech Server Core", "Private Advisory", "Wall St Tower Complete"],
  },
  post_office: {
    nameKo: "유니버설 글로벌 익스프레스 센터",
    nameEn: "Universal Global Express Hub",
    icon: "📦",
    blueprintKo: "대륙 간 항공 물류 분류 벨트, 스마트 라벨 프린팅 부스, 글로벌 택배 센터를 완공합니다.",
    blueprintEn: "Build transoceanic sort conveyor loops, automated postage booths, and parcel handling bays.",
    phaseKo: ["물류 기초", "자동 바코드 리더", "항공 소포 벨트", "고객 인도 데스크", "익스프레스 센터 완공"],
    phaseEn: ["Logistics Base", "Barcode Scanner Line", "Air Mail Conveyor", "Customer Pick-up", "Express Hub Complete"],
  },
  housing: {
    nameKo: "맨해튼 그린 에코 레지던스",
    nameEn: "Manhattan Green Eco Residence",
    icon: "🏢",
    blueprintKo: "스마트 홈 자동화 도어록, 친환경 에너지 절감 모듈, 루프탑 정원 라운지를 건축합니다.",
    blueprintEn: "Construct smart-entry apartments, solar energy grids, and community rooftop gardens.",
    phaseKo: ["주거 기단", "친환경 외벽 패널", "스마트 홈 시스템", "루프탑 가든", "에코 레지던스 완공"],
    phaseEn: ["Residential Base", "Eco Exterior Cladding", "Smart Home Core", "Rooftop Garden", "Residence Complete"],
  },
  public_office: {
    nameKo: "캐피톨 시빅 센터 & 국제 행정청",
    nameEn: "Capitol Civic & International Center",
    icon: "🏛️",
    blueprintKo: "외국인 거주 등록 창구, 공공 증명서 키오스크, 열린 시민 의회 라운지를 축조합니다.",
    blueprintEn: "Build resident visa service counters, self-issuance document kiosks, and civic council halls.",
    phaseKo: ["청사 초석", "민원 신청 창구", "스마트 서류 발급기", "시민 공청 홀", "시빅 센터 완공"],
    phaseEn: ["Civic Plinth", "Service Counters", "Document Kiosk", "Public Council Chamber", "Civic Center Complete"],
  },
  workplace: {
    nameKo: "실리콘밸리 글로벌 테크 타워",
    nameEn: "Silicon Valley Global Tech Tower",
    icon: "💻",
    blueprintKo: "글로벌 텔레컨퍼런스 룸, 애자일 협업 팟, 미래 AI 비즈니스 오피스를 구축합니다.",
    blueprintEn: "Construct video conference studios, agile coworking pods, and modern tech workstations.",
    phaseKo: ["타워 기초", "코워킹 라운지", "화상 회의 스위트", "클라우드 랩", "테크 타워 완공"],
    phaseEn: ["Tower Base", "Coworking Lounge", "Teleconference Suite", "Cloud Innovation Lab", "Tech Tower Complete"],
  },
  salon: {
    nameKo: "본드 스트리트 런던 스타일 스튜디오",
    nameEn: "Bond Street London Style Studio",
    icon: "✂️",
    blueprintKo: "프리미엄 헤어 스타일링 스테이션, 컬러 트리트먼트 바, 웰니스 케어 부스를 완성합니다.",
    blueprintEn: "Erect luxury hair cutting stations, color design bars, and wellness client spas.",
    phaseKo: ["살롱 기단", "스타일링 미러 체어", "샴푸 릴랙스 존", "컬러링 바", "스타일 스튜디오 완공"],
    phaseEn: ["Salon Base", "Styling Mirror Station", "Shampoo Relax Zone", "Color Design Bar", "Studio Complete"],
  },
  lost_found: {
    nameKo: "메트로폴리탄 커뮤니티 케어 센터",
    nameEn: "Metropolitan Care & Found Sanctuary",
    icon: "🏷️",
    blueprintKo: "디지털 소지품 보관 로커, 분실물 등록 데이터베이스, 안전 인도 카운터를 만듭니다.",
    blueprintEn: "Build RFID item recovery lockers, lost-and-found databases, and customer return desks.",
    phaseKo: ["케어 기초", "보안 스마트 락커", "분실 등록 데스크", "안심 인도 라운지", "케어 센터 완공"],
    phaseEn: ["Care Foundation", "Smart Security Lockers", "Registration Desk", "Return Lounge", "Sanctuary Complete"],
  },
  fitness: {
    nameKo: "올림픽 월드 웰니스 스포츠 콤플렉스",
    nameEn: "Olympic World Wellness Sports Complex",
    icon: "🏋️",
    blueprintKo: "실내 트랙 러닝 레인, 웨이트 트레이닝 존, 수영장과 웰빙 샤워 스위트를 건축합니다.",
    blueprintEn: "Construct indoor athletic running tracks, functional strength zones, and lap pools.",
    phaseKo: ["피트니스 기단", "유산소 트랙 레인", "프리웨이트 파워존", "라커 웰니스 스위트", "스포츠 콤플렉스 완공"],
    phaseEn: ["Gym Floor", "Cardio Track Lanes", "Power Weight Area", "Locker Suite", "Sports Complex Complete"],
  },
  library_museum: {
    nameKo: "대영박물관 & 국회도서관 아카이브",
    nameEn: "British Museum & Library Archive",
    icon: "📖",
    blueprintKo: "고대 유물 전시 갤러리, 고문서 복원 연구실, 희귀본 디지털 열람 홀을 구축합니다.",
    blueprintEn: "Build antiquities exhibition galleries, manuscript conservation labs, and rare reading halls.",
    phaseKo: ["박물관 기단", "유물 쇼케이스 룸", "항온항습 문서고", "디지털 리딩 룸", "문화 아카이브 완공"],
    phaseEn: ["Museum Plinth", "Artifact Showcase", "Climate-controlled Vault", "Digital Reading Room", "Archive Complete"],
  },
  car_rental: {
    nameKo: "에코 그린 모빌리티 글로벌 플릿",
    nameEn: "Eco Green Global Mobility Fleet Hub",
    icon: "🚙",
    blueprintKo: "전기차 급속 충전 스테이션, 모바일 스마트 계약 키오스크, 안전 차량 점검 레인을 완공합니다.",
    blueprintEn: "Construct rapid EV charging bays, mobile digital contract kiosks, and vehicle safety lanes.",
    phaseKo: ["플릿 기초", "전기차 충전 도크", "모바일 계약 키오스크", "출고 검사 레인", "모빌리티 허브 완공"],
    phaseEn: ["Fleet Plinth", "EV Charging Docks", "Mobile Contract Kiosk", "Inspection Lane", "Fleet Hub Complete"],
  },
};

function detectCategory(lessonTitle?: string, buildDevice?: string): string | null {
  const text = `${lessonTitle || ""} ${buildDevice || ""}`.toLowerCase();
  if (text.includes("약국") || text.includes("병원") || text.includes("hospital") || text.includes("clinic") || text.includes("pharmacy")) return "hospital";
  if (text.includes("공항") || text.includes("비행기") || text.includes("airport") || text.includes("flight") || text.includes("gate")) return "airport";
  if (text.includes("상점") || text.includes("마트") || text.includes("가게") || text.includes("store") || text.includes("market") || text.includes("shop")) return "store";
  if (text.includes("학교") || text.includes("강의실") || text.includes("교실") || text.includes("class") || text.includes("school")) return "classroom";
  if (text.includes("놀이공원") || text.includes("테마파크") || text.includes("amusement") || text.includes("park")) return "amusement_park";
  if (text.includes("식당") || text.includes("레스토랑") || text.includes("음식점") || text.includes("restaurant") || text.includes("dining")) return "restaurant";
  if (text.includes("결혼식") || text.includes("웨딩") || text.includes("wedding")) return "wedding";
  if (text.includes("호텔") || text.includes("숙소") || text.includes("hotel") || text.includes("resort")) return "hotel";
  if (text.includes("대중교통") || text.includes("지하철") || text.includes("버스") || text.includes("transport") || text.includes("transit") || text.includes("subway")) return "transport";
  if (text.includes("은행") || text.includes("환전") || text.includes("bank") || text.includes("atm")) return "bank";
  if (text.includes("우체국") || text.includes("택배") || text.includes("post") || text.includes("mail") || text.includes("parcel")) return "post_office";
  if (text.includes("부동산") || text.includes("원룸") || text.includes("집") || text.includes("housing") || text.includes("apartment")) return "housing";
  if (text.includes("주민센터") || text.includes("관공서") || text.includes("청사") || text.includes("public") || text.includes("civic")) return "public_office";
  if (text.includes("직장") || text.includes("사무실") || text.includes("회의") || text.includes("workplace") || text.includes("office")) return "workplace";
  if (text.includes("미용실") || text.includes("헤어") || text.includes("이발") || text.includes("salon") || text.includes("barber")) return "salon";
  if (text.includes("분실물") || text.includes("유실물") || text.includes("lost") || text.includes("found")) return "lost_found";
  if (text.includes("헬스장") || text.includes("운동") || text.includes("체육") || text.includes("fitness") || text.includes("gym")) return "fitness";
  if (text.includes("도서관") || text.includes("박물관") || text.includes("전시") || text.includes("library") || text.includes("museum")) return "library_museum";
  if (text.includes("렌터카") || text.includes("렌트") || text.includes("rental") || text.includes("car")) return "car_rental";
  return null;
}

export function LabBuilderView({
  build,
  site,
  locale = "ko",
  streak,
  bonusPieces,
  lessonTitle,
  questionIndex,
  totalQuestions,
}: LabBuilderViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const siteCtx = useOptionalSite();
  const t = siteCtx?.t;
  const activeLocale = siteCtx?.locale || locale;
  const isEn = activeLocale.startsWith("en");
  const isNonKorean = activeLocale !== "ko";

  const netViewText = t ? t("lab.netView") : (isNonKorean ? "Net View" : "전개도");
  const collapseText = t ? t("lab.collapse") : (isNonKorean ? "Collapse" : "접기");
  const netViewAriaText = t ? t("lab.netViewAria") : (isNonKorean ? "View Net Diagram" : "전개도 보기");
  const collapseAriaText = t ? t("lab.collapseAria") : (isNonKorean ? "Collapse Details" : "상세 접기");
  // Subject distinction
  const isScience = site === "physics" || site === "chemistry";
  const isMath = site === "math";
  const isEnglish = site === "english";
  const isKorean = site === "korean";

  const drawerButtonLabel = isScience ? (t ? t("lab.calibration" as never) : (isNonKorean ? "Apparatus Calibration" : "양자·분자 정밀 계측도 (Apparatus Calibration)")) : netViewText;

  // Category detection for situational dialogues
  const matchedCat = useMemo(() => {
    return detectCategory(lessonTitle, build?.device || build?.device_ko);
  }, [lessonTitle, build]);

  // Determine Subject Character & Naming
  const landmarkInfo = useMemo(() => {
    if (isKorean) {
      if (matchedCat && KOREAN_HERITAGE_MAP[matchedCat]) {
        return KOREAN_HERITAGE_MAP[matchedCat];
      }
      return {
        nameKo: "한글 훈민 소통원(訓民 疎通院)",
        nameEn: "Hangul Cultural Agora",
        icon: "🏛️",
        blueprintKo: "배흘림기둥과 곡선 처마, 오색 단청이 어우러지는 전통 한옥 소통 누각을 축조합니다.",
        blueprintEn: "Construct traditional Hanok columns, curved eaves, and colorful Dancheong verandas.",
        phaseKo: ["초석 다지기", "배흘림기둥", "서까래 결구", "오색 단청 채색", "풍류 누각 완공"],
        phaseEn: ["Stone Base", "Pine Columns", "Rafter Interlock", "Dancheong Painting", "Pavilion Complete"],
      };
    }

    if (isEnglish) {
      if (matchedCat && ENGLISH_ODYSSEY_MAP[matchedCat]) {
        return ENGLISH_ODYSSEY_MAP[matchedCat];
      }
      return {
        nameKo: "글로벌 오디세이 30,000피트 순항 항로",
        nameEn: "Global Odyssey 30,000ft Flight",
        icon: "🧭",
        blueprintKo: "전 세계를 잇는 글로벌 항공망입니다. 유창하고 정확한 소통으로 제트기류를 타고 비행 고도를 높입니다.",
        blueprintEn: "Transcontinental air routes connecting world cities with fluent communication and jetstream thrust.",
        phaseKo: ["이륙 활주", "상승 기류", "제트기류 진입", "순항 고도 도달", "정상 궤도 안착"],
        phaseEn: ["Takeoff Roll", "Climbing Altitude", "Jetstream Entry", "Cruising Height", "Orbit Achieved"],
      };
    }

    if (isScience) {
      return {
        nameKo: build?.device_ko || "친환경 첨단 과학 탐구 랩",
        nameEn: build?.device_en || "Precision Science & Quantum Lab",
        icon: "🔬",
        blueprintKo: "고정밀 분자 센서와 입자 반응기를 교정하여 과학적 원리를 100% 공명 캘리브레이션합니다.",
        blueprintEn: "Calibrate high-precision molecular sensors and particle reactors to achieve 100% resonance.",
        phaseKo: ["센서 초기화", "파장 정렬", "분자 결합 보정", "양자 공명 튜닝", "정밀 캘리브레이션 완결"],
        phaseEn: ["Sensor Reset", "Wavelength Align", "Molecular Calibrate", "Quantum Tuning", "Full Calibration"],
      };
    }

    // Default Math
    return {
      nameKo: build?.device_ko || "스마트 친환경 내진 건축 타워",
      nameEn: build?.device_en || "Smart Seismic Architecture Tower",
      icon: "📐",
      blueprintKo: "지오데식 돔과 내진 댐퍼를 결합한 모듈식 건축으로 구조 안전율을 100% 달성합니다.",
      blueprintEn: "Assemble geodesic modular components and seismic dampers to achieve 100% structural safety.",
      phaseKo: ["지반 보강", "내진 코어 조립", "외벽 프레임 가설", "지오데식 돔 탑재", "친환경 타워 완공"],
      phaseEn: ["Ground Reinforce", "Seismic Core", "Façade Framework", "Geodesic Dome", "Tower Complete"],
    };
  }, [isKorean, isEnglish, isScience, matchedCat, build]);

  // Total pieces & current piece
  const totalPieces = build?.total_pieces || (totalQuestions > 0 ? totalQuestions : 30);
  const currentPieceRaw = build?.piece ?? (questionIndex + 1);
  const currentPiece = Math.min(totalPieces, Math.max(1, currentPieceRaw));
  const effectivePieces = Math.min(totalPieces, currentPiece - 1 + bonusPieces);
  const progressPct = build?.progress_pct ?? Math.round((effectivePieces / totalPieces) * 100);

  // Harmony flow status
  const maxStreak = build?.harmony_bonus?.streak ?? 3;
  const currentStreak = Math.min(maxStreak, streak);
  const isHarmonyActive = streak >= maxStreak;

  // Assembly visual blocks
  const displayBlockCount = Math.min(24, Math.max(10, totalPieces));
  const blocks = useMemo(() => {
    return Array.from({ length: displayBlockCount }, (_, idx) => {
      const pieceIdx = Math.floor((idx / displayBlockCount) * totalPieces);
      const isAssembled = pieceIdx < effectivePieces;
      const isCurrent = pieceIdx === effectivePieces;
      return { idx, isAssembled, isCurrent };
    });
  }, [displayBlockCount, totalPieces, effectivePieces]);

  // Subject Visual Styling
  const themeStyles = useMemo(() => {
    if (isKorean) {
      return {
        badgeText: isNonKorean ? "K-HERITAGE" : "전통 한옥 풍류원",
        badgeBg: "rgba(16, 185, 129, 0.25)",
        badgeColor: "#34d399",
        iconBg: "linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)",
        accentColor: "#34d399",
        blockGradient: "linear-gradient(180deg, #34d399 0%, #059669 100%)",
        streakTitle: isNonKorean ? "Pungnyu Rhythm:" : "풍류와 흥(興) 가락:",
        streakHint: isNonKorean ? "3 in a row for +1 Dancheong piece" : "3연속 정답 시 오색 단청 조각 채색",
        streakBonusText: isNonKorean ? "Pungnyu Harmony Active!" : "풍류 가락 신명 하모니 발동!",
        currentProgressLabel: isNonKorean ? `Dancheong & Roof Eaves: ${effectivePieces}/${totalPieces}` : `오색 단청과 처마 결구: ${effectivePieces}/${totalPieces}`,
        cardBorder: "1px solid rgba(16, 185, 129, 0.3)",
        containerBg: "linear-gradient(135deg, #091a18 0%, #11221f 50%, #162c28 100%)",
      };
    }
    if (isEnglish) {
      return {
        badgeText: isNonKorean ? "GLOBAL ODYSSEY" : "세계 비행 항로",
        badgeBg: "rgba(99, 102, 241, 0.25)",
        badgeColor: "#818cf8",
        iconBg: "linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #312e81 100%)",
        accentColor: "#818cf8",
        blockGradient: "linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)",
        streakTitle: isNonKorean ? "Jetstream Flow:" : "제트기류 순항 하모니:",
        streakHint: isNonKorean ? "3 in a row for +1 cruising altitude" : "3연속 정답 시 비행 순항 고도 급상승",
        streakBonusText: isNonKorean ? "Jetstream Boost Active!" : "제트기류 부스터 가동!",
        currentProgressLabel: isNonKorean ? `Cruising Altitude: ${effectivePieces * 1000} ft` : `비행 순항 고도: ${effectivePieces * 1000} ft`,
        cardBorder: "1px solid rgba(99, 102, 241, 0.3)",
        containerBg: "linear-gradient(135deg, #111428 0%, #181c3a 50%, #1f254e 100%)",
      };
    }
    if (isScience) {
      return {
        badgeText: isNonKorean ? "SCIENCE LAB" : "과학 랩 장비",
        badgeBg: "rgba(14, 165, 233, 0.25)",
        badgeColor: "#38bdf8",
        iconBg: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        accentColor: "#38bdf8",
        blockGradient: "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)",
        streakTitle: isNonKorean ? "Resonance Flow:" : "정밀 실험 공명 하모니:",
        streakHint: isNonKorean ? "3 in a row for +1 sensor piece" : "3연속 정답 시 보너스 센서 교정",
        streakBonusText: isNonKorean ? "Resonance Tuning Active!" : "양자 공명 튜닝 발동!",
        currentProgressLabel: isNonKorean ? `Sensor Calibration: ${effectivePieces}/${totalPieces}` : `센서 캘리브레이션: ${effectivePieces}/${totalPieces}`,
        cardBorder: "1px solid rgba(14, 165, 233, 0.3)",
        containerBg: "linear-gradient(135deg, #0b1526 0%, #0f2038 50%, #132b4d 100%)",
      };
    }
    // Math default
    return {
      badgeText: isNonKorean ? "SMART BUILDER" : "스마트 건축",
      badgeBg: "rgba(245, 158, 11, 0.25)",
      badgeColor: "#fbbf24",
      iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      accentColor: "#fbbf24",
      blockGradient: "linear-gradient(180deg, #fbbf24 0%, #d97706 100%)",
      streakTitle: isNonKorean ? "Harmony Flow:" : "무결점 계산 하모니:",
      streakHint: isNonKorean ? "3 in a row for +1 structural piece" : "3연속 정답 시 보너스 내진 조각 축조",
      streakBonusText: isNonKorean ? "Harmony Combo Active!" : "하모니 콤보 발동!",
      currentProgressLabel: isNonKorean ? `Structural Safety: ${effectivePieces}/${totalPieces}` : `구조 안전율: ${effectivePieces}/${totalPieces}`,
      cardBorder: "1px solid rgba(245, 158, 11, 0.3)",
      containerBg: "linear-gradient(135deg, #1b160d 0%, #261e12 50%, #332817 100%)",
    };
  }, [isKorean, isEnglish, isScience, isNonKorean, effectivePieces, totalPieces]);

  const displayName = isNonKorean ? landmarkInfo.nameEn : landmarkInfo.nameKo;

  return (
    <section
      aria-label={themeStyles.badgeText}
      style={{
        borderRadius: 16,
        background: themeStyles.containerBg,
        color: "#f8fafc",
        border: themeStyles.cardBorder,
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
        marginBottom: 14,
        transition: "all 0.25s ease-in-out",
      }}
    >
      {/* Top Bar: Icon, Title, Progress Pill, Drawer Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "clamp(8px, 1.8vw, 14px) clamp(10px, 2.2vw, 18px)",
          gap: 10,
          borderBottom: isExpanded ? "1px solid rgba(148, 163, 184, 0.15)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: "clamp(30px, 5.5vw, 40px)",
              height: "clamp(30px, 5.5vw, 40px)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
              background: themeStyles.iconBg,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          >
            {landmarkInfo.icon}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "1px 7px",
                  borderRadius: 4,
                  background: themeStyles.badgeBg,
                  color: themeStyles.badgeColor,
                }}
              >
                {themeStyles.badgeText}
              </span>
              {lessonTitle && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lessonTitle}
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: "clamp(0.82rem, 1.9vw, 1rem)",
                fontWeight: 700,
                color: "#f1f5f9",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={displayName}
            >
              {displayName}
            </div>
          </div>
        </div>

        {/* Piece count & toggle button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              textAlign: "right",
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: themeStyles.accentColor }}>
              {effectivePieces}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}> / {totalPieces}</span>
            <span
              style={{
                marginLeft: 6,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: progressPct >= 100 ? "#4ade80" : "#cbd5e1",
              }}
            >
              {progressPct}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "rgba(51, 65, 85, 0.5)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              color: "#cbd5e1",
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? collapseAriaText : (isScience ? (t ? t("lab.calibration" as never) : (isNonKorean ? "View Apparatus Calibration" : "정밀 계측도 보기")) : netViewAriaText)}
          >
            {isExpanded ? `▲ ${collapseText}` : `▼ ${drawerButtonLabel}`}
          </button>
        </div>
      </div>

      {/* Assembly Progress Track & Blocks */}
      <div style={{ padding: "clamp(6px, 1.5vw, 10px) clamp(10px, 2.2vw, 18px) clamp(8px, 1.8vw, 14px)" }}>
        {/* Assembly Blocks Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${displayBlockCount}, 1fr)`,
            gap: 3,
            marginBottom: 6,
          }}
        >
          {blocks.map(({ idx, isAssembled, isCurrent }) => (
            <div
              key={idx}
              style={{
                height: 10,
                borderRadius: 2,
                transition: "all 0.3s ease",
                background: isAssembled
                  ? themeStyles.blockGradient
                  : isCurrent
                    ? "#f43f5e"
                    : "rgba(51, 65, 85, 0.4)",
                boxShadow: isAssembled
                  ? `0 0 6px ${themeStyles.accentColor}66`
                  : isCurrent
                    ? "0 0 8px rgba(244, 63, 94, 0.8)"
                    : "none",
                transform: isCurrent ? "scaleY(1.3)" : "none",
              }}
              title={isNonKorean ? `Phase ${idx + 1}` : `공정 ${idx + 1}`}
            />
          ))}
        </div>

        {/* Harmony Streak & Combo Meter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>
              {themeStyles.streakTitle}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: maxStreak }, (_, i) => {
                const filled = i < currentStreak;
                return (
                  <span
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      background: filled
                        ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                        : "rgba(51, 65, 85, 0.5)",
                      boxShadow: filled ? "0 0 6px rgba(245, 158, 11, 0.6)" : "none",
                      color: filled ? "#fff" : "#475569",
                      fontWeight: 800,
                    }}
                  >
                    {filled ? "⚡" : "○"}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Bonus Toast Pill */}
          {bonusPieces > 0 ? (
            <span
              style={{
                color: "#4ade80",
                fontWeight: 700,
                fontSize: "0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              🎉 +{bonusPieces} {isNonKorean ? "Bonus Piece Active" : "보너스 조각 축조"}
            </span>
          ) : isHarmonyActive ? (
            <span style={{ color: themeStyles.accentColor, fontWeight: 700 }}>
              ⚡ {themeStyles.streakBonusText}
            </span>
          ) : (
            <span style={{ color: "#64748b" }}>
              {currentStreak > 0
                ? isEn
                  ? `${maxStreak - currentStreak} more in a row`
                  : isNonKorean
                    ? `${maxStreak - currentStreak} more in a row`
                    : isNonKorean ? `${maxStreak - currentStreak} more in a row` : `${maxStreak - currentStreak}연속 추가 정답 시 보너스`
                : themeStyles.streakHint}
            </span>
          )}
        </div>
      </div>

      {/* Expandable Blueprint Drawer */}
      {isExpanded && (
        <div
          style={{
            padding: "12px 14px",
            background: "rgba(15, 23, 42, 0.8)",
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            fontSize: "0.82rem",
            color: "#cbd5e1",
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: themeStyles.accentColor }}>
              {isKorean
                ? (t ? t("lab.blueprint.korean") : "📜 훈민정음 서화 두루마리와 한옥 결구도")
                : isEnglish
                  ? (t ? t("lab.blueprint.english") : (isNonKorean ? "🗺️ World Flight Route & Boarding Pass" : "🗺️ 글로벌 항로 & 보딩패스 (World Flight Route)"))
                  : isScience
                    ? (t ? t("lab.calibration") : (isNonKorean ? "🔬 Apparatus Calibration (Quantum & Molecular)" : "🔬 양자·분자 정밀 계측도 (Apparatus Calibration)"))
                    : (t ? t("lab.blueprint.math") : (isNonKorean ? "📐 Structural Blueprint (Dynamics & Geometry)" : "📐 구조 역학 청사진 (Structural Blueprint)"))}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              {themeStyles.currentProgressLabel}
            </span>
          </div>

          <p style={{ margin: "0 0 10px 0", fontSize: "0.78rem", color: "#94a3b8" }}>
            {isNonKorean ? landmarkInfo.blueprintEn : landmarkInfo.blueprintKo}
          </p>

          {/* Phase Steps Indicator */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "clamp(2px, 1vw, 6px)",
              padding: "clamp(4px, 1.2vw, 8px) clamp(5px, 1.5vw, 10px)",
              backgroundColor: "rgba(30, 41, 59, 0.6)",
              borderRadius: 8,
              border: "1px solid rgba(148, 163, 184, 0.1)",
            }}
          >
            {(isNonKorean ? landmarkInfo.phaseEn : landmarkInfo.phaseKo).map((phase, pIdx) => {
              const phaseThreshold = ((pIdx + 1) / 5) * 100;
              const isPhaseDone = progressPct >= phaseThreshold;
              const isPhaseCurrent = !isPhaseDone && progressPct >= ((pIdx) / 5) * 100;
              return (
                <div
                  key={pIdx}
                  style={{
                    textAlign: "center",
                    padding: "3px 2px",
                    borderRadius: 4,
                    backgroundColor: isPhaseDone
                      ? "rgba(16, 185, 129, 0.2)"
                      : isPhaseCurrent
                        ? "rgba(59, 130, 246, 0.2)"
                        : "transparent",
                    color: isPhaseDone ? "#4ade80" : isPhaseCurrent ? "#60a5fa" : "#64748b",
                    fontSize: "clamp(0.62rem, 1.5vw, 0.78rem)",
                    fontWeight: isPhaseDone || isPhaseCurrent ? 700 : 400,
                  }}
                >
                  <div style={{ fontSize: "0.65rem", marginBottom: 1 }}>
                    {isPhaseDone ? "✓" : isPhaseCurrent ? "▶" : `${pIdx + 1}`}
                  </div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {phase}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
