import { OPERATOR } from "./operator";

export type LegalBlock = string | { list: string[] };
export interface LegalSection { id: string; title: string; body: LegalBlock[] }
export interface LegalDoc { title: string; intro: string; sections: LegalSection[] }
export type LegalLang = "ko" | "en";
export type LegalKind = "privacy" | "terms";

const op = OPERATOR;
const operatorLine = {
  ko: () => [op.name && `상호: ${op.name}`, op.representative && `대표자: ${op.representative}`, op.businessNo && `사업자등록번호: ${op.businessNo}`, op.mailOrderNo && `통신판매업 신고번호: ${op.mailOrderNo}`, op.address && `주소: ${op.address}`, `문의: ${op.contactEmail}`].filter(Boolean) as string[],
  en: () => [op.name && `Operator: ${op.name}`, op.representative && `Representative: ${op.representative}`, op.businessNo && `Business registration no.: ${op.businessNo}`, op.mailOrderNo && `Mail-order business no.: ${op.mailOrderNo}`, op.address && `Address: ${op.address}`, `Contact: ${op.contactEmail}`].filter(Boolean) as string[],
};
const officer = {
  ko: () => [op.privacyOfficer ? `개인정보 보호책임자: ${op.privacyOfficer}` : "개인정보 보호책임자: 운영자 대표(아래 이메일로 문의)", `이메일: ${op.privacyEmail}`],
  en: () => [op.privacyOfficer ? `Data protection officer: ${op.privacyOfficer}` : "Data protection officer: the operator's representative (use the email below)", `Email: ${op.privacyEmail}`],
};

const PRIVACY_KO: LegalDoc = {
  title: "개인정보처리방침",
  intro: "LIFE.HELP(이하 “서비스”)는 이용자의 개인정보를 소중히 다루며 「개인정보 보호법」 등 관련 법령을 준수합니다. 이 방침은 서비스(life.help 및 하위 도메인, math.life.help, english.life.help, korean.life.help)에서 어떤 정보를 수집하고 어떻게 이용·보관·파기하는지 설명합니다.",
  sections: [
    { id: "items", title: "1. 수집하는 개인정보 항목과 방법", body: [
      "서비스는 이용자가 직접 입력하거나 서비스 이용 과정에서 생성되는 정보만 수집하며, 필요한 최소한의 항목으로 제한합니다.",
      { list: [
        "생활서비스 요청(고객): 요청 서비스 종류, 문제 상황 설명, 방문·서비스 장소의 주소(시·도, 시·군·구, 상세 주소), 사용 언어, 요청 상태, 채팅 메시지와 그 기계 번역문. 고객은 회원가입 없이 익명으로 이용하며 이름·전화번호를 수집하지 않습니다. 요청 접근용 비밀 링크/세션은 암호화된 해시로만 저장합니다.",
        "헬퍼(서비스 제공자): 표시 이름, 사용 언어, 활동 지역, 제공 가능 서비스, 연락용 이메일(선택).",
        "학습 서비스(게스트): 닉네임, 학년/단계, 학습 목표, 아바타, 학습 진행 기록. 게스트 정보는 이용자의 기기(브라우저 저장소)에만 저장되며 서버로 전송되지 않습니다.",
        "학습 서비스(회원): 이메일, 비밀번호(해시), 닉네임, 학년/단계, 학습 목표, 아바타, 풀이 기록·숙련도·경험치·연속 학습 기록, 이용권 내역.",
        "후기: 별점, 후기 내용(익명).",
        "자동 수집: 접속 IP 주소와 요청 일시(보안·부정 이용 방지·속도 제한 목적, Cloudflare 및 서버 로그), 브라우저·기기 정보, 쿠키.",
      ] },
      "결제는 계좌이체 방식으로 안내하며, 서비스는 카드번호 등 결제수단 정보를 수집하지 않습니다.",
    ] },
    { id: "purpose", title: "2. 개인정보의 이용 목적", body: [
      { list: [
        "생활서비스 요청의 접수, 헬퍼 연결, 상담·채팅 및 통역(기계 번역) 제공",
        "학습 콘텐츠 제공, 학습 진행·성취 기록 저장, 이용권(프리미엄) 확인",
        "회원 식별 및 인증, 부정 이용 방지, 서비스 안정성·보안 확보",
        "문의·민원 처리, 법령상 의무 이행",
      ] },
      "수집한 정보는 위 목적 외로 이용하지 않으며, 광고·마케팅 목적으로 이용하거나 판매하지 않습니다.",
    ] },
    { id: "retention", title: "3. 보유 및 이용 기간", body: [
      { list: [
        "생활서비스 요청 및 채팅: 요청 완료·취소 후 1년 보관 후 파기합니다. 이용자가 요청 접근을 철회(링크·세션 폐기)하면 이후 접근은 즉시 차단됩니다.",
        "헬퍼 정보: 헬퍼 활동 종료 또는 삭제 요청 시까지.",
        "학습 회원 정보·학습 기록: 회원 탈퇴 또는 삭제 요청 시 지체 없이 파기합니다.",
        "게스트 학습 정보: 이용자의 브라우저에만 있으며 이용자가 브라우저 데이터를 지우면 삭제됩니다.",
        "관련 법령에 따라 보관이 필요한 정보(예: 계약 또는 청약철회 기록 5년, 대금결제 및 재화 공급 기록 5년, 소비자 불만 및 분쟁처리 기록 3년)는 해당 기간 동안 분리하여 보관합니다.",
      ] },
    ] },
    { id: "third", title: "4. 제3자 제공", body: [
      "서비스는 이용자의 동의가 있거나 법령에 근거가 있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다. 생활서비스 요청의 내용(서비스 종류, 상황 설명, 주소, 채팅)은 요청을 수락한 헬퍼에게 서비스 제공을 위해 공개됩니다.",
    ] },
    { id: "processors", title: "5. 개인정보 처리위탁 및 국외 이전", body: [
      "서비스 운영을 위해 아래 업체에 처리를 위탁하며, 일부는 국외에서 처리될 수 있습니다.",
      { list: [
        `Supabase Inc. — 데이터베이스·회원 인증 (저장 정보: 위 1항의 서버 저장 항목${op.dbRegion ? `, 서버 위치: ${op.dbRegion}` : ""})`,
        "Cloudflare, Inc. — 웹 호스팅·CDN·보안 (접속 IP, 요청 정보)",
        "MyMemory (Translated S.r.l.) — 채팅 메시지의 기계 번역 (번역 대상 문장이 번역 제공자에게 전송됩니다)",
      ] },
      "국외 이전을 원하지 않는 경우 기계 번역 기능 사용을 중단하거나 서비스 이용을 중단하실 수 있으며, 개인정보 보호책임자에게 문의하실 수 있습니다.",
    ] },
    { id: "destroy", title: "6. 파기 절차 및 방법", body: [
      "보유 기간이 지나거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는 방법으로 삭제합니다. 법령에 따라 보관해야 하는 정보는 별도로 분리 보관한 뒤 기간이 지나면 파기합니다.",
    ] },
    { id: "rights", title: "7. 이용자와 법정대리인의 권리", body: [
      "이용자(만 14세 미만 아동의 경우 법정대리인)는 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지, 동의 철회를 요구할 수 있습니다. 개인정보 보호책임자 이메일로 요청하시면 지체 없이(10일 이내) 조치하고 결과를 알려 드립니다. 이용자는 요청 접근 링크·세션 폐기, 로그아웃, 브라우저 데이터 삭제를 통해 직접 접근을 중단할 수도 있습니다.",
    ] },
    { id: "children", title: "8. 만 14세 미만 아동의 개인정보", body: [
      { list: [
        "서비스는 게스트 학습 모드(서버에 개인정보를 보내지 않는 모드)를 제공하며, 만 14세 미만 아동은 이 모드를 이용할 수 있습니다.",
        "만 14세 미만 아동의 회원가입(이메일 계정)은 법정대리인이 직접 하거나 법정대리인의 동의를 받아야 합니다. 가입 화면에서 이를 확인하며, 가입 시 동의 일시·약관 버전·가입 근거(14세 이상 / 법정대리인)를 기록합니다.",
        "법정대리인은 아동의 개인정보에 대한 열람·정정·삭제·처리정지를 언제든지 요구할 수 있으며, 동의를 철회하면 계정과 학습 기록을 삭제합니다.",
        "아동의 가입 사실이 확인되었으나 법정대리인의 동의가 없는 경우 해당 계정과 정보를 지체 없이 삭제합니다.",
      ] },
    ] },
    { id: "cookies", title: "9. 쿠키 및 브라우저 저장소", body: [
      { list: [
        "언어 설정 쿠키(learn_lang 등): 선택한 언어를 기억합니다.",
        "인증·세션 쿠키: 로그인 상태, 요청 접근 세션(lh_c, lh_rt_*), 관리자 세션(HttpOnly, Secure).",
        "브라우저 저장소(localStorage): 게스트 학습 기록, 화면 설정 등 이용자 기기 내부 정보.",
      ] },
      "브라우저 설정에서 쿠키와 저장소를 삭제하거나 차단할 수 있으나, 일부 기능이 제한될 수 있습니다. 서비스는 광고·추적 목적의 쿠키를 사용하지 않습니다.",
    ] },
    { id: "security", title: "10. 안전성 확보 조치", body: [
      { list: [
        "전송 구간 암호화(HTTPS), 비밀번호·접근 자격증명의 해시 저장",
        "데이터베이스 접근 통제(행 수준 보안, 내부 함수 권한 분리) 및 관리자 권한 최소화",
        "요청 속도 제한, 접근 로그 점검, 취약점 점검 및 패키지 보안 업데이트",
      ] },
    ] },
    { id: "officer", title: "11. 개인정보 보호책임자 및 문의", body: [{ list: [...officer.ko(), ...operatorLine.ko()] }] },
    { id: "remedy", title: "12. 권익침해 구제 방법", body: [
      "개인정보 침해에 대한 신고·상담은 아래 기관에 문의하실 수 있습니다.",
      { list: ["개인정보침해신고센터: privacy.kisa.or.kr / 국번 없이 118", "개인정보분쟁조정위원회: kopico.go.kr / 1833-6972", "대검찰청: spo.go.kr / 국번 없이 1301", "경찰청 사이버수사국: ecrm.police.go.kr / 국번 없이 182"] },
    ] },
    { id: "changes", title: "13. 방침의 변경", body: ["이 방침이 변경되는 경우 시행일 7일 전(중요한 변경은 30일 전)부터 서비스 화면에 공지합니다."] },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: "Privacy Policy",
  intro: "LIFE.HELP (the “Service”) handles personal information with care and complies with the Korean Personal Information Protection Act. This policy explains what we collect on life.help and its subdomains (math.life.help, english.life.help, korean.life.help), and how it is used, kept and deleted. The Korean text governs if the two differ.",
  sections: [
    { id: "items", title: "1. Information we collect", body: [
      "We collect only what you enter or what is produced by using the Service, limited to the minimum needed.",
      { list: [
        "Life-service requests (customers): service type, description of the problem, the address where the service is needed (province, district, detailed address), language, request status, chat messages and their machine translations. Customers use the Service anonymously; we do not collect names or phone numbers. Secret request links/sessions are stored only as hashes.",
        "Helpers: display name, languages, regions, services offered, optional contact email.",
        "Learning (guest): nickname, grade/level, goal, avatar and progress. Guest data stays in your browser storage and is not sent to our servers.",
        "Learning (account): email, password (hashed), nickname, grade/level, goal, avatar, answers, mastery, XP, streaks and entitlement history.",
        "Reviews: star rating and review text (anonymous).",
        "Automatic: IP address and request time (security, abuse prevention and rate limiting; Cloudflare and server logs), browser/device information and cookies.",
      ] },
      "Payment is by bank transfer; we do not collect card or other payment-method data.",
    ] },
    { id: "purpose", title: "2. How we use it", body: [
      { list: [
        "To receive requests, connect helpers, and provide chat and machine translation",
        "To deliver learning content, store progress and check Premium entitlement",
        "To identify and authenticate members, prevent abuse and keep the Service secure and stable",
        "To handle inquiries and meet legal obligations",
      ] },
      "We do not use the information for advertising or marketing, and we do not sell it.",
    ] },
    { id: "retention", title: "3. Retention", body: [
      { list: [
        "Service requests and chat: kept for 1 year after completion or cancellation, then deleted. Revoking access (link/session) blocks further access immediately.",
        "Helper information: until the helper ends activity or asks for deletion.",
        "Learning account and records: deleted without delay when you close the account or ask for deletion.",
        "Guest learning data: only in your browser; it is removed when you clear browser data.",
        "Records we must keep by law (e.g. contract/withdrawal records 5 years, payment and supply records 5 years, consumer complaint/dispute records 3 years) are kept separately for that period.",
      ] },
    ] },
    { id: "third", title: "4. Disclosure to third parties", body: [
      "We do not provide personal information to third parties except with your consent or as required by law. The content of a service request (type, description, address, chat) is shown to the helper who accepts it, in order to provide the service.",
    ] },
    { id: "processors", title: "5. Processors and overseas transfers", body: [
      "We use the following processors; some process data outside Korea.",
      { list: [
        `Supabase Inc. — database and member authentication (server-stored items in section 1${op.dbRegion ? `; location: ${op.dbRegion}` : ""})`,
        "Cloudflare, Inc. — web hosting, CDN and security (IP address, request data)",
        "MyMemory (Translated S.r.l.) — machine translation of chat messages (the text to translate is sent to the translation provider)",
      ] },
      "If you do not want overseas transfer, stop using machine translation or the Service; you may also contact the data protection officer.",
    ] },
    { id: "destroy", title: "6. Deletion", body: ["When the retention period ends or the purpose is achieved, we delete the data without delay and in a way that cannot be restored. Data we must keep by law is kept separately and deleted afterwards."] },
    { id: "rights", title: "7. Your rights (and your legal guardian's)", body: [
      "You (or the legal guardian of a child under 14) may at any time request access, correction, deletion, suspension of processing, or withdrawal of consent. Email the data protection officer and we will act without delay (within 10 days) and tell you the result. You can also stop access yourself by revoking a request link/session, signing out or clearing browser data.",
    ] },
    { id: "children", title: "8. Children under 14", body: [
      { list: [
        "The Service offers a guest learning mode that sends no personal information to our servers; children under 14 may use it.",
        "An email account for a child under 14 must be created by, or with the consent of, the legal guardian. The sign-up screen asks for this confirmation and records the time, document version and basis (14 or older / legal guardian).",
        "A legal guardian may request access, correction, deletion or suspension for the child's data at any time; if consent is withdrawn we delete the account and learning records.",
        "If we learn that an account was created for a child under 14 without guardian consent, we delete the account and data without delay.",
      ] },
    ] },
    { id: "cookies", title: "9. Cookies and browser storage", body: [
      { list: [
        "Language cookie (learn_lang etc.): remembers the language you chose.",
        "Authentication/session cookies: sign-in state, request access sessions (lh_c, lh_rt_*), admin session (HttpOnly, Secure).",
        "Browser storage (localStorage): guest learning data and display settings on your device.",
      ] },
      "You can delete or block cookies and storage in your browser, but some features may stop working. We do not use advertising or tracking cookies.",
    ] },
    { id: "security", title: "10. Security measures", body: [
      { list: [
        "Encryption in transit (HTTPS); passwords and access credentials stored as hashes",
        "Database access control (row-level security, separated internal functions) and least-privilege administration",
        "Rate limiting, access-log review, vulnerability checks and dependency security updates",
      ] },
    ] },
    { id: "officer", title: "11. Data protection officer and contact", body: [{ list: [...officer.en(), ...operatorLine.en()] }] },
    { id: "remedy", title: "12. Remedies", body: [
      "You may contact the following bodies about personal-information infringement:",
      { list: ["Personal Information Infringement Report Center: privacy.kisa.or.kr / 118", "Personal Information Dispute Mediation Committee: kopico.go.kr / 1833-6972", "Supreme Prosecutors' Office: spo.go.kr / 1301", "National Police Agency Cyber Bureau: ecrm.police.go.kr / 182"] },
    ] },
    { id: "changes", title: "13. Changes", body: ["If this policy changes, we will announce it in the Service at least 7 days before it takes effect (30 days for material changes)."] },
  ],
};

const TERMS_KO: LegalDoc = {
  title: "이용약관",
  intro: "이 약관은 LIFE.HELP(이하 “서비스”)가 제공하는 외국인 생활서비스 연결 및 학습 서비스의 이용 조건과 절차, 운영자와 이용자의 권리·의무를 정합니다.",
  sections: [
    { id: "scope", title: "제1조 (목적과 효력)", body: [
      "이 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 이용자가 서비스를 이용하면 이 약관과 개인정보처리방침에 동의한 것으로 봅니다. 운영자는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행일 7일 전(이용자에게 불리한 변경은 30일 전)부터 공지합니다.",
    ] },
    { id: "service", title: "제2조 (서비스의 내용)", body: [
      { list: [
        "생활서비스 연결: 고객이 요청을 등록하면 해당 요청을 수행할 수 있는 헬퍼와 연결하고, 채팅과 기계 번역을 통해 의사소통을 지원합니다.",
        "학습 서비스: 수학·영어·한국어 학습 콘텐츠와 학습 기록, 무료 및 유료(프리미엄) 이용권을 제공합니다.",
        "운영자는 서비스의 일부를 변경하거나 중단할 수 있으며, 중요한 변경은 사전에 공지합니다.",
      ] },
      "기계 번역은 참고용이며 정확성을 보증하지 않습니다. 중요한 내용은 반드시 상대방과 직접 확인하시기 바랍니다.",
    ] },
    { id: "users", title: "제3조 (이용자의 의무)", body: [
      { list: [
        "타인의 정보를 도용하거나 허위 정보를 입력하지 않습니다.",
        "법령, 공서양속 및 이 약관을 위반하는 요청·메시지·후기를 작성하지 않습니다.",
        "서비스의 정상 운영을 방해하거나 보안을 우회하려는 행위를 하지 않습니다.",
        "요청 접근 링크와 계정 정보를 안전하게 관리합니다.",
      ] },
    ] },
    { id: "accounts", title: "제4조 (계정과 만 14세 미만 이용자)", body: [
      "학습 서비스의 회원 계정은 만 14세 이상인 사람이 만들 수 있습니다. 만 14세 미만 아동은 법정대리인이 직접 가입하거나 법정대리인의 동의를 받아 가입해야 하며, 동의 없이 가입한 계정은 삭제될 수 있습니다. 만 14세 미만 아동은 개인정보를 서버로 보내지 않는 게스트 모드를 이용할 수 있습니다. 회원은 언제든지 탈퇴(삭제 요청)할 수 있습니다.",
    ] },
    { id: "helpers", title: "제5조 (헬퍼)", body: [
      "헬퍼는 자신이 제공하는 서비스의 내용과 품질에 대해 책임을 지며, 서비스 이용 시 법령과 운영자의 안내를 준수해야 합니다. 운영자는 헬퍼의 승인·제한·해지를 할 수 있습니다.",
    ] },
    { id: "payment", title: "제6조 (요금, 결제 및 환불)", body: [
      { list: [
        "서비스 이용 요금과 결제 방법(계좌이체 등)은 결제 안내 화면에 표시합니다.",
        "유료 이용권은 결제 확인 후 지정된 범위와 기간 동안 이용할 수 있습니다.",
        "청약철회 및 환불은 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령과 운영자의 환불 기준에 따릅니다. 환불 문의는 이메일로 접수합니다.",
      ] },
    ] },
    { id: "ip", title: "제7조 (지식재산권)", body: ["서비스의 콘텐츠(문제, 해설, 디자인, 소프트웨어)에 대한 권리는 운영자 또는 정당한 권리자에게 있으며, 이용자는 개인적·비상업적 학습 목적 범위에서만 이용할 수 있습니다."] },
    { id: "disclaimer", title: "제8조 (책임의 제한)", body: [
      "운영자는 천재지변, 불가항력, 이용자의 귀책사유로 인한 서비스 장애에 대해 책임을 지지 않습니다. 헬퍼와 고객 사이의 서비스 수행 결과에 대한 책임은 일차적으로 해당 당사자에게 있으며, 운영자는 분쟁 해결을 위해 합리적으로 협조합니다. 학습 서비스는 학습 성과나 시험 결과를 보장하지 않습니다. 법령상 제한되지 않는 범위에서 운영자의 책임은 직접 손해에 한정됩니다.",
    ] },
    { id: "law", title: "제9조 (준거법과 분쟁 해결)", body: ["이 약관은 대한민국 법령에 따라 해석되며, 서비스와 관련한 분쟁은 민사소송법상 관할 법원에서 해결합니다."] },
    { id: "operator", title: "운영자 정보", body: [{ list: operatorLine.ko() }] },
  ],
};

const TERMS_EN: LegalDoc = {
  title: "Terms of Service",
  intro: "These terms set the conditions and procedures for using the life-service matching and learning services provided by LIFE.HELP (the “Service”), and the rights and duties of the operator and users. The Korean text governs if the two differ.",
  sections: [
    { id: "scope", title: "Article 1 (Purpose and effect)", body: [
      "These terms take effect when posted in the Service. By using the Service you agree to these terms and the Privacy Policy. The operator may change the terms within the law and will announce changes at least 7 days before they take effect (30 days if they are unfavourable to users).",
    ] },
    { id: "service", title: "Article 2 (The Service)", body: [
      { list: [
        "Life-service matching: when a customer registers a request, we connect it with a helper who can carry it out and support communication through chat and machine translation.",
        "Learning: math, English and Korean learning content, learning records, and free and paid (Premium) access.",
        "The operator may change or stop part of the Service and will announce material changes in advance.",
      ] },
      "Machine translation is a reference only and its accuracy is not guaranteed. Please confirm important matters directly with the other person.",
    ] },
    { id: "users", title: "Article 3 (User duties)", body: [
      { list: [
        "Do not use another person's information or enter false information.",
        "Do not post requests, messages or reviews that violate the law, public order or these terms.",
        "Do not disrupt the Service or try to bypass its security.",
        "Keep request links and account credentials safe.",
      ] },
    ] },
    { id: "accounts", title: "Article 4 (Accounts and users under 14)", body: [
      "A learning account may be created by a person aged 14 or older. A child under 14 must sign up through, or with the consent of, a legal guardian; accounts created without consent may be deleted. Children under 14 may use guest mode, which sends no personal information to our servers. A member may close the account (request deletion) at any time.",
    ] },
    { id: "helpers", title: "Article 5 (Helpers)", body: ["Helpers are responsible for the content and quality of the services they provide and must follow the law and the operator's guidance. The operator may approve, restrict or terminate a helper."] },
    { id: "payment", title: "Article 6 (Fees, payment and refunds)", body: [
      { list: [
        "Fees and payment methods (e.g. bank transfer) are shown on the payment page.",
        "Paid access is available for the stated scope and period after payment is confirmed.",
        "Withdrawal and refunds follow the Act on the Consumer Protection in Electronic Commerce and the operator's refund rules. Send refund inquiries by email.",
      ] },
    ] },
    { id: "ip", title: "Article 7 (Intellectual property)", body: ["Rights in the Service's content (questions, explanations, design, software) belong to the operator or the rightful owner. Users may use it only for personal, non-commercial learning."] },
    { id: "disclaimer", title: "Article 8 (Limitation of liability)", body: [
      "The operator is not liable for outages caused by natural disaster, force majeure or the user's fault. Responsibility for how a service is performed between a helper and a customer lies first with those parties; the operator will cooperate reasonably to resolve disputes. The learning Service does not guarantee learning results or exam outcomes. To the extent permitted by law, the operator's liability is limited to direct damages.",
    ] },
    { id: "law", title: "Article 9 (Governing law and disputes)", body: ["These terms are governed by the laws of the Republic of Korea, and disputes are resolved by the competent court under the Civil Procedure Act."] },
    { id: "operator", title: "Operator", body: [{ list: operatorLine.en() }] },
  ],
};

export const LEGAL_DOCS: Record<LegalKind, Record<LegalLang, LegalDoc>> = {
  privacy: { ko: PRIVACY_KO, en: PRIVACY_EN },
  terms: { ko: TERMS_KO, en: TERMS_EN },
};
