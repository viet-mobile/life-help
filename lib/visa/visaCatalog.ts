// Global Visa Translation Catalog & Resolver
// Provides multi-language resolution for visa types, required documents, and official link titles across all destinations.

export interface LocalizedStringDict {
  [key: string]: Record<string, string>;
}

export const COMMON_DOC_TRANSLATIONS: LocalizedStringDict = {
  "Passport": {
    ko: "여권 원본",
    ja: "パスポート原本",
    zh: "护照原件",
    es: "Pasaporte original",
    fr: "Passeport original",
    ru: "Оригинал паспорта",
    ar: "جواز السفر الأصلي",
    tr: "Pasaport aslı",
    vi: "Hộ chiếu gốc",
  },
  "Valid passport": {
    ko: "유효한 여권",
    ja: "有効なパスポート",
    zh: "有效护照",
    es: "Pasaporte válido",
    fr: "Passeport valide",
    ru: "Действующий паспорт",
    ar: "جواز سفر ساري المفعول",
    tr: "Geçerli pasaport",
    vi: "Hộ chiếu còn hạn",
  },
  "Photograph": {
    ko: "여권용 사진",
    ja: "証明写真",
    zh: "证件照片",
    es: "Fotografía tamaño pasaporte",
    fr: "Photo d'identité",
    ru: "Фотография на паспорт",
    ar: "صورة شخصية للشهادة",
    tr: "Vesikalık fotoğraf",
    vi: "Ảnh thẻ làm hộ chiếu",
  },
  "Personal photo": {
    ko: "본인 사진 (여권 규격)",
    ja: "本人写真（パスポート規格）",
    zh: "本人照片（护照规格）",
    es: "Fotografía personal",
    fr: "Photo d'identité personnelle",
    ru: "Личная фотография",
    ar: "صورة شخصية",
    tr: "Kişisel fotoğraf",
    vi: "Ảnh cá nhân",
  },
  "Recent passport-size photo": {
    ko: "최근 6개월 이내 여권용 사진",
    ja: "最近6ヶ月以内に撮影したパスポート写真",
    zh: "近6个月内的护照规格照片",
    es: "Fotografía reciente tamaño pasaporte",
    fr: "Photo d'identité récente format passeport",
    ru: "Недавняя фотография паспортного формата",
    ar: "صورة شخصية حديثة بحجم جواز السفر",
    tr: "Son 6 ay içinde çekilmiş vesikalık fotoğraf",
    vi: "Ảnh thẻ chuẩn hộ chiếu chụp gần đây",
  },
  "Visa application form": {
    ko: "비자 신청서",
    ja: "ビザ申請書",
    zh: "签证申请表",
    es: "Formulario de solicitud de visa",
    fr: "Formulaire de demande de visa",
    ru: "Анкета на получение визы",
    ar: "نموذج طلب التأشيرة",
    tr: "Vize başvuru formu",
    vi: "Đơn xin thị thực",
  },
  "Completed visa application form": {
    ko: "작성 완료된 비자 신청서",
    ja: "記入済みのビザ申請書",
    zh: "填写完整的签证申请表",
    es: "Formulario de solicitud de visa completado",
    fr: "Formulaire de demande de visa rempli",
    ru: "Заполненная визовая анкета",
    ar: "نموذج طلب التأشيرة المكتمل",
    tr: "Doldurulmuş vize başvuru formu",
    vi: "Đơn xin thị thực đã điền đầy đủ",
  },
  "Completed and signed application form": {
    ko: "작성 및 서명 완료된 비자 신청서",
    ja: "記入および署名済みのビザ申請書",
    zh: "已填写并签字的申请表",
    es: "Formulario de solicitud completado y firmado",
    fr: "Formulaire de demande rempli et signé",
    ru: "Заполненная и подписанная анкета",
    ar: "نموذج الطلب مكتمل وموقع",
    tr: "Doldurulmuş ve imzalanmış başvuru formu",
    vi: "Đơn đăng ký đã điền và ký tên",
  },
  "Proof of accommodation": {
    ko: "숙소 예약 증명서 (호텔 바우처 등)",
    ja: "宿泊証明書（ホテル予約確認書等）",
    zh: "住宿证明（酒店预订单等）",
    es: "Comprobante de alojamiento",
    fr: "Preuve d'hébergement",
    ru: "Подтверждение бронирования жилья",
    ar: "إثبات الإقامة (حجز فندق)",
    tr: "Konaklama belgesi (otel rezervasyonu vb.)",
    vi: "Chứng từ đặt phòng / nơi cư trú",
  },
  "Proof of sufficient funds (bank statement, booking, sponsor letter, return ticket)": {
    ko: "재정 능력 입증 서류 (은행 잔고 증명서, 예약 내역, 재정보증서, 왕복 항공권 등)",
    ja: "十分な資金の証明（残高証明書、予約確認、身元保証書、往복航空券）",
    zh: "充足资金证明（银行流水、预订记录、担保信、往返机票）",
    es: "Comprobante de fondos suficientes (extracto bancario, billete de vuelta)",
    fr: "Preuve de ressources financières suffisantes (relevé bancaire, billet aller-retour)",
    ru: "Подтверждение наличия денежных средств (выписка из банка, бронь, обратный билет)",
    ar: "إثبات الأموال الكافية (كشف حساب بنكي، تذكرة عودة)",
    tr: "Yeterli maddi durum belgesi (banka hesap dökümü, dönüş bileti vb.)",
    vi: "Chứng minh tài chính (sao kê ngân hàng, vé máy bay khứ hồi)",
  },
  "Medical/travel insurance covering Ukraine, minimum EUR 30,000": {
    ko: "여행/의료 보험 증명서 (최소 30,000 유로 이상 보장)",
    ja: "医療・旅行保険証明書（最低30,000ユーロ以上補償）",
    zh: "医疗及旅行保险证明（保额至少3万欧元）",
    es: "Seguro médico/de viaje con cobertura mínima de 30.000 EUR",
    fr: "Assurance médicale/voyage d'une couverture minimale de 30 000 EUR",
    ru: "Медицинская страховка с покрытием не менее 30 000 евро",
    ar: "تأمين طبي/سفر بتغطية لا تقل عن 30,000 يورو",
    tr: "En az 30.000 EUR teminatlı seyahat ve sağlık sigortası",
    vi: "Bảo hiểm y tế/du lịch hạn mức tối thiểu 30.000 EUR",
  },
  "Passport valid for at least 3 months after e-Visa validity expires": {
    ko: "전자비자 유효기간 만료 후 최소 3개월 이상 유효한 여권",
    ja: "電子ビザ有効期限満了後、最低3ヶ月以上有効なパスポート",
    zh: "电子签证到期后至少有3个月有效期的护照",
    es: "Pasaporte válido por al menos 3 meses después del vencimiento de la e-Visa",
    fr: "Passeport valide au moins 3 mois après l'expiration de l'e-Visa",
    ru: "Паспорт со сроком действия не менее 3 месяцев после истечения визы",
    ar: "جواز سفر صالح لمدة 3 أشهر على الأقل بعد انتهاء صلاحية التأشيرة",
    tr: "Elektronik vize süresi dolduktan sonra en az 3 ay geçerli pasaport",
    vi: "Hộ chiếu còn hạn ít nhất 3 tháng sau khi e-Visa hết hạn",
  },
  "Valid credit/debit card for electronic consular fee payment": {
    ko: "전자 영사 수수료 결제용 유효 신용/직불카드",
    ja: "電子領事手数料決済用の有効なクレジットカード/デビットカード",
    zh: "用于支付电子领事费用的有效信用卡/借记卡",
    es: "Tarjeta de crédito/débito válida para el pago de la tarifa consular electrónica",
    fr: "Carte de crédit/débit valide pour le paiement des frais consulaires électroniques",
    ru: "Действующая кредитная/дебетовая карта для оплаты электронного сбора",
    ar: "بطاقة ائتمان/خصم صالحة لدفع الرسوم القنصلية الإلكترونية",
    tr: "Elektronik konsolosluk harcı ödemesi için geçerli kredi/banka kartı",
    vi: "Thẻ tín dụng/ghi nợ hợp lệ để thanh toán lệ phí lãnh sự điện tử",
  },
};

export const COMMON_VISA_TYPE_TRANSLATIONS: LocalizedStringDict = {
  "Tourist Visa": {
    ko: "관광 비자",
    ja: "観光ビザ",
    zh: "旅游签证",
    es: "Visa de turista",
    fr: "Visa de tourisme",
    ru: "Туристическая виза",
    ar: "تأشيرة سياحية",
    tr: "Turistik Vize",
    vi: "Thị thực du lịch",
  },
  "Business Visa": {
    ko: "상용(비즈니스) 비자",
    ja: "商用（ビジネス）ビザ",
    zh: "商务签证",
    es: "Visa de negocios",
    fr: "Visa d'affaires",
    ru: "Деловая виза",
    ar: "تأشيرة أعمال",
    tr: "Ticari Vize",
    vi: "Thị thực thương mại",
  },
  "Transit Visa": {
    ko: "경유(트랜짓) 비자",
    ja: "通過（トランジット）ビザ",
    zh: "过境签证",
    es: "Visa de tránsito",
    fr: "Visa de transit",
    ru: "Транзитная виза",
    ar: "تأشيرة عبور",
    tr: "Transit Vize",
    vi: "Thị thực quá cảnh",
  },
  "ASAN e-Visa (Standard / Urgent Single Entry)": {
    ko: "ASAN 전자비자 (일반 / 긴급 단수 입국)",
    ja: "ASAN 電子ビザ (通常 / 緊急 シングル)",
    zh: "ASAN 电子签证（常规 / 紧急 单次入境）",
    es: "Visa electrónica ASAN (estándar / urgente entrada única)",
    fr: "e-Visa ASAN (standard / urgent entrée unique)",
    ru: "Электронная виза ASAN (стандартная / срочная однократная)",
    ar: "تأشيرة أسان الإلكترونية (عادية / عاجلة دخول لمرة واحدة)",
    tr: "ASAN e-Vize (Standart / Acil Tek Giriş)",
    vi: "e-Visa ASAN (Nhập cảnh một lần tiêu chuẩn / khẩn cấp)",
  },
  "EU Blue Card": {
    ko: "EU 블루카드 (고숙련 전문직 취업 비자)",
    ja: "EUブルーカード（高度専門職就労ビザ）",
    zh: "欧盟蓝卡（高技能工作签证）",
    es: "Tarjeta Azul de la UE",
    fr: "Carte bleue européenne",
    ru: "Голубая карта ЕС",
    ar: "البطاقة الزرقاء للاتحاد الأوروبي",
    tr: "AB Mavi Kart",
    vi: "Thẻ xanh EU",
  },
};

export const COMMON_LINK_TRANSLATIONS: LocalizedStringDict = {
  "Apply for ASAN Electronic Visa": {
    ko: "ASAN 전자비자 신청",
    ja: "ASAN 電子ビザ申請",
    zh: "申请 ASAN 电子签证",
    es: "Solicitar Visa Electrónica ASAN",
    fr: "Demander un visa électronique ASAN",
    ru: "Подать заявку на электронную визу ASAN",
    ar: "التقديم للحصول على تأشيرة أسان الإلكترونية",
    tr: "ASAN Elektronik Vize Başvurusu",
    vi: "Nộp đơn xin e-Visa ASAN",
  },
  "ASAN Visa Official Electronic Visa Portal of Azerbaijan": {
    ko: "아제르바이잔 ASAN 전자비자 공식 포털",
    ja: "アゼルバイジャン ASAN 電子ビザ公式ポータル",
    zh: "阿塞拜疆 ASAN 电子签证官方门户",
    es: "Portal Oficial de Visa Electrónica ASAN de Azerbaiyán",
    fr: "Portail officiel de visa électronique ASAN d'Azerbaïdjan",
    ru: "Официальный портал электронной визы ASAN Азербайджана",
    ar: "بوابة التأشيرة الإلكترونية الرسمية لآسان في أذربيجان",
    tr: "Azerbaycan ASAN Elektronik Vize Resmi Portalı",
    vi: "Cổng thông tin e-Visa chính thức ASAN của Azerbaijan",
  },
  "State Migration Service of the Republic of Azerbaijan": {
    ko: "아제르바이잔 공화국 국가이민국",
    ja: "アゼルバイジャン共和国 国家移民局",
    zh: "阿塞拜疆共和国国家移民局",
    es: "Servicio Estatal de Migración de la República de Azerbaiyán",
    fr: "Service national des migrations de la République d'Azerbaïdjan",
    ru: "Государственная миграционная служба Азербайджанской Республики",
    ar: "دائرة الهجرة الحكومية لجمهورية أذربيجان",
    tr: "Azerbaycan Cumhuriyeti Devlet Göç Hizmeti",
    vi: "Cơ quan Di trú Nhà nước Cộng hòa Azerbaijan",
  },
};

/** Pattern-based fallback translator for generic visa requirement strings */
function patternTranslate(text: string, locale: string): string | null {
  const normLocale = locale.startsWith("zh") ? "zh" : locale;

  // Passport valid for at least X months
  const mMonth = text.match(/Passport valid (?:for )?at least (\d+) months/i);
  if (mMonth) {
    const num = mMonth[1];
    if (locale === "ko") return `최소 ${num}개월 이상 유효한 여권`;
    if (locale === "ja") return `少なくとも${num}ヶ月以上有効なパスポート`;
    if (normLocale === "zh") return `至少有${num}个月有效期的护照`;
    if (locale === "es") return `Pasaporte válido por al menos ${num} meses`;
    if (locale === "fr") return `Passeport valide au moins ${num} mois`;
    if (locale === "ru") return `Паспорт со сроком действия не менее ${num} месяцев`;
    if (locale === "tr") return `En az ${num} ay geçerli pasaport`;
    if (locale === "vi") return `Hộ chiếu còn hạn ít nhất ${num} tháng`;
    if (locale === "ar") return `جواز سفر صالح لمدة ${num} أشهر على الأقل`;
  }

  // Passport valid for at least X days
  const mDays = text.match(/Passport valid (?:for )?at least (\d+) days/i);
  if (mDays) {
    const num = mDays[1];
    if (locale === "ko") return `최소 ${num}일 이상 유효한 여권`;
    if (locale === "ja") return `少なくとも${num}日以上有効なパスポート`;
    if (normLocale === "zh") return `至少有${num}天有效期的护照`;
    if (locale === "es") return `Pasaporte válido por al menos ${num} días`;
    if (locale === "fr") return `Passeport valide au moins ${num} jours`;
    if (locale === "tr") return `En az ${num} gün geçerli pasaport`;
  }

  // Official eVisa website for X / Official Website of X Electronic Visa
  const mEvisa = text.match(/(?:The )?Official (?:eVisa|Electronic Visa) website (?:for|of) (.+)/i);
  if (mEvisa) {
    const target = mEvisa[1].trim();
    if (locale === "ko") return `${target} 공식 전자비자(e-Visa) 웹사이트`;
    if (locale === "ja") return `${target} 公式電子ビザ（e-Visa）ウェブサイト`;
    if (normLocale === "zh") return `${target} 官方电子签证网站`;
    if (locale === "es") return `Sitio web oficial de visa electrónica para ${target}`;
    if (locale === "fr") return `Site officiel de visa électronique pour ${target}`;
  }

  // Apply for X
  const mApply = text.match(/^Apply (?:for )?(.+)$/i);
  if (mApply) {
    const target = mApply[1].trim();
    if (locale === "ko") return `${target} 신청`;
    if (locale === "ja") return `${target}の申請`;
    if (normLocale === "zh") return `申请 ${target}`;
    if (locale === "es") return `Solicitar ${target}`;
    if (locale === "fr") return `Postuler pour ${target}`;
  }

  return null;
}

export function resolveVisaDocText(
  doc: { text: string; textKo?: string; texts?: Record<string, string> },
  locale: string
): string {
  // 1. Check embedded texts
  if (doc.texts?.[locale]) return doc.texts[locale];
  const langPrefix = locale.split("-")[0];
  if (doc.texts?.[langPrefix]) return doc.texts[langPrefix];

  // 2. Korean fallback
  if (locale === "ko" && doc.textKo) return doc.textKo;

  // 3. Catalog dictionary
  const inCatalog = COMMON_DOC_TRANSLATIONS[doc.text];
  if (inCatalog) {
    if (inCatalog[locale]) return inCatalog[locale];
    if (inCatalog[langPrefix]) return inCatalog[langPrefix];
    if (locale === "ko" && inCatalog.ko) return inCatalog.ko;
  }

  // 4. Pattern matching
  const patterned = patternTranslate(doc.text, locale);
  if (patterned) return patterned;

  // 5. If ko exists and user is in non-English locale, display bilingual
  if (locale === "ko" && doc.textKo) return doc.textKo;
  if (doc.textKo && doc.text && locale !== "en" && locale !== "ko") {
    return `${doc.text} (${doc.textKo})`;
  }

  return doc.text;
}

export function resolveVisaLinkTitle(
  link: { title: string; titleKo?: string; titles?: Record<string, string> },
  locale: string
): string {
  if (link.titles?.[locale]) return link.titles[locale];
  const langPrefix = locale.split("-")[0];
  if (link.titles?.[langPrefix]) return link.titles[langPrefix];
  if (locale === "ko" && link.titleKo) return link.titleKo;

  const inCatalog = COMMON_LINK_TRANSLATIONS[link.title];
  if (inCatalog) {
    if (inCatalog[locale]) return inCatalog[locale];
    if (inCatalog[langPrefix]) return inCatalog[langPrefix];
    if (locale === "ko" && inCatalog.ko) return inCatalog.ko;
  }

  const patterned = patternTranslate(link.title, locale);
  if (patterned) return patterned;

  if (locale === "ko" && link.titleKo) return link.titleKo;
  return link.title;
}

export function resolveVisaTypeName(
  vt: string,
  locale: string,
  extraTranslations?: Record<string, Record<string, string>>
): string {
  if (extraTranslations?.[vt]?.[locale]) return extraTranslations[vt][locale];
  const langPrefix = locale.split("-")[0];
  if (extraTranslations?.[vt]?.[langPrefix]) return extraTranslations[vt][langPrefix];

  const inCatalog = COMMON_VISA_TYPE_TRANSLATIONS[vt];
  if (inCatalog) {
    if (inCatalog[locale]) return inCatalog[locale];
    if (inCatalog[langPrefix]) return inCatalog[langPrefix];
    if (locale === "ko" && inCatalog.ko) return inCatalog.ko;
  }

  return vt;
}
