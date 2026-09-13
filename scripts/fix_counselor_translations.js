const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

// Targeted translations for counselor, admin chat, online status, and duty
const onlineTranslations = {
  ko: "실시간 온라인",
  en: "ONLINE",
  vi: "ĐANG TRỰC TUYẾN",
  "zh-Hans": "在线",
  "zh-Hant": "線上",
  ja: "オンライン",
  ru: "В СЕТИ",
  es: "EN LÍNEA",
  fr: "EN LIGNE",
  de: "ONLINE",
  id: "ONLINE",
  th: "ออนไลน์",
  ar: "متصل",
  arz: "متصل",
  am: "ኦንላይን",
  bn: "অনলাইন",
  da: "ONLINE",
  fa: "آنلاین",
  he: "מחובר",
  hi: "ऑनलाइन",
  it: "ONLINE",
  kk: "ОНЛАЙН",
  km: "អនឡាញ",
  mn: "ОНЛАЙН",
  my: "အွန်လိုင်း",
  ne: "अनलाइन",
  nl: "ONLINE",
  no: "ONLINE",
  pl: "ONLINE",
  si: "මාර්ගගතව",
  sv: "ONLINE",
  ta: "ஆன்லைன்",
  tet: "ONLINE",
  tr: "ÇEVRİMİÇİ",
  uk: "ОНЛАЙН",
  uz: "ONLAYN"
};

const counselorRoleTranslations = {
  ko: "상담원",
  en: "Counselor",
  vi: "Tư vấn viên",
  "zh-Hans": "咨询员",
  "zh-Hant": "諮詢員",
  ja: "相談員",
  ru: "Консультант",
  es: "Consejero",
  fr: "Conseiller",
  de: "Berater",
  id: "Konselor",
  th: "ที่ปรึกษา",
  ar: "مستشار",
  arz: "مستشار",
  am: "አማካሪ",
  bn: "পরামর্শদাতা",
  da: "Rådgiver",
  fa: "مشاور",
  he: "יועץ",
  hi: "सलाहकार",
  it: "Consulente",
  kk: "Кеңесші",
  km: "ទីប្រឹក្សា",
  mn: "Зөвлөх",
  my: "အကြံပေး",
  ne: "परामर्शदाता",
  nl: "Adviseur",
  no: "Rådgiver",
  pl: "Doradca",
  si: "උපදේශක",
  sv: "Rådgivare",
  ta: "ஆலோசகர்",
  tet: "Konsellór",
  tr: "Danışman",
  uk: "Консультант",
  uz: "Maslahatchi"
};

const recipientCounselorTranslations = {
  ko: "수신자: 상담원",
  en: "Recipient: Counselor",
  vi: "Người nhận: Tư vấn viên",
  "zh-Hans": "接收人: 咨询员",
  "zh-Hant": "接收人: 諮詢員",
  ja: "受信者: 相談員",
  ru: "Получатель: Консультант",
  es: "Destinatario: Consejero",
  fr: "Destinataire: Conseiller",
  de: "Empfänger: Berater",
  id: "Penerima: Konselor",
  th: "ผู้รับ: ที่ปรึกษา",
  ar: "المستلم: مستشار",
  arz: "المستلم: مستشار",
  am: "ተቀባይ: አማካሪ",
  bn: "প্রাপক: পরামর্শদাতা",
  da: "Modtager: Rådgiver",
  fa: "گیرنده: مشاور",
  he: "נמען: יועץ",
  hi: "प्राप्तकर्ता: सलाहकार",
  it: "Destinatario: Consulente",
  kk: "Алушы: Кеңесші",
  km: "អ្នកទទួល: ទីប្រឹក្សា",
  mn: "Хүлээн авагч: Зөвлөх",
  my: "လက်ခံသူ: အကြံပေး",
  ne: "प्राप्तकर्ता: परामर्शदाता",
  nl: "Ontvanger: Adviseur",
  no: "Mottaker: Rådgiver",
  pl: "Odbiorca: Doradca",
  si: "ලබන්නා: උපදේශක",
  sv: "Mottagare: Rådgivare",
  ta: "பெறுநர்: ஆலோசகர்",
  tet: "Simu-na'in: Konsellór",
  tr: "Alıcı: Danışman",
  uk: "Одержувач: Консультант",
  uz: "Qabul qiluvchi: Maslahatchi"
};

const adminChatTranslations = {
  ko: "본사 관리자 연락",
  en: "HQ Admin Chat",
  vi: "Liên hệ Quản trị viên",
  "zh-Hans": "联系总部管理员",
  "zh-Hant": "聯繫總部管理員",
  ja: "本部管理者へ連絡",
  ru: "Связь с администрацией",
  es: "Contacto Administración",
  fr: "Contacter Administration",
  de: "Kontakt Administration",
  id: "Kontak Admin Pusat",
  th: "ติดต่อผู้ดูแลระบบ",
  ar: "التواصل مع الإدارة",
  arz: "التواصل مع الإدارة",
  am: "ዋና አስተዳዳሪን ያነጋግሩ",
  bn: "প্রশাসনের সাথে যোগাযোগ",
  da: "Kontakt Administration",
  fa: "تماس با مدیر ارشد",
  he: "צ\'אט עם ההנהלה",
  hi: "प्रशासन से संपर्क",
  it: "Contatta Amministrazione",
  kk: "Әкімшілікпен байланыс",
  km: "ទាក់ទងអ្នកគ្រប់គ្រង",
  mn: "Төв захиргаатай холбогдох",
  my: "ရုံးချုပ် စီမံခန့်ခွဲသူနှင့် ဆက်သွယ်ရန်",
  ne: "प्रशासकसँग सम्पर्क",
  nl: "Contact Beheerder",
  no: "Kontakt Administrasjon",
  pl: "Kontakt z Centralą",
  si: "පරිපාලක අමතන්න",
  sv: "Kontakta Administration",
  ta: "நிர்வாகியிடம் தொடர்பு",
  tet: "Kontaktu Administrasaun",
  tr: "Yönetici ile İletişim",
  uk: "Зв\'язок з адміністрацією",
  uz: "Boshqaruvchi bilan aloqa"
};

const adminChatTitleTranslations = {
  ko: "본사 관리자 1:1 온라인 연락",
  en: "HQ Admin 1:1 Online Chat",
  vi: "Liên hệ trực tuyến 1:1 với Quản trị viên",
  "zh-Hans": "总部管理员 1:1 在线联系",
  "zh-Hant": "總部管理員 1:1 線上聯繫",
  ja: "本部管理者 1:1 オンライン連絡",
  ru: "Онлайн-чат 1:1 с администрацией",
  es: "Chat 1:1 con la Administración",
  fr: "Chat en direct 1:1 avec l\'Administration",
  de: "1:1 Online-Chat mit der Administration",
  id: "Obrolan Online 1:1 dengan Admin Pusat",
  th: "แชทออนไลน์ 1:1 กับผู้ดูแลระบบ",
  ar: "محادثة مباشرة 1:1 مع إدارة المقر",
  arz: "محادثة مباشرة 1:1 مع إدارة المقر",
  am: "ከዋና አስተዳዳሪ ጋር 1:1 የቀጥታ ውይይት",
  bn: "সদর দপ্তর প্রশাসকের সাথে ১:১ অনলাইন চ্যাট",
  da: "1:1 Online Chat med Administrationen",
  fa: "گفتگوی آنلاین ۱:۱ با مدیریت دفتر مرکزی",
  he: "צ\'אט מקוון 1:1 עם הנהלת המטה",
  hi: "मुख्यालय प्रशासक के साथ 1:1 ऑनलाइन चैट",
  it: "Chat online 1:1 con l\'Amministrazione",
  kk: "Бас кеңсе әкімшісімен 1:1 онлайн чат",
  km: "ការជជែកផ្ទាល់ 1:1 ជាមួយអ្នកគ្រប់គ្រងទីស្នាក់ការ",
  mn: "Төв оффисын админтай хийх 1:1 онлайн чат",
  my: "ရုံးချုပ် စီမံခန့်ခွဲသူနှင့် 1:1 အွန်လိုင်း စကားပြောဆိုခြင်း",
  ne: "मुख्यालय प्रशासकसँग 1:1 अनलाइन च्याट",
  nl: "1:1 Online Chat met Hoofdkantoorbeheerder",
  no: "1:1 Online Chat med Hovedkontoradministrasjon",
  pl: "Czat online 1:1 z Centralą",
  si: "ප්‍රධාන කාර්යාල පරිපාලක සමඟ 1:1 මාර්ගගත සංවාදය",
  sv: "1:1 Onlinechatt med Huvudkontorsadministrationen",
  ta: "தலைமையக நிர்வாகியுடன் 1:1 ஆன்லைன் உரையாடல்",
  tet: "Xate Online 1:1 ho Administrasaun Sede",
  tr: "Genel Merkez Yöneticisi ile 1:1 Çevrimiçi Sohbet",
  uk: "Онлайн-чат 1:1 з адміністрацією головного офісу",
  uz: "Bosh ofis administratori bilan 1:1 onlayn muloqot"
};

const adminNoticeBannerTranslations = {
  ko: "[본사 관리자 메시지]",
  en: "[HQ Admin Message]",
  vi: "[Tin nhắn từ Quản trị viên]",
  "zh-Hans": "[总部管理员消息]",
  "zh-Hant": "[總部管理員訊息]",
  ja: "[本部管理者メッセージ]",
  ru: "[Сообщение от администрации]",
  es: "[Mensaje de la Administración]",
  fr: "[Message de l\'Administration]",
  de: "[Nachricht der Administration]",
  id: "[Pesan dari Admin Pusat]",
  th: "[ข้อความจากผู้ดูแลระบบ]",
  ar: "[رسالة من إدارة المقر]",
  arz: "[رسالة من إدارة المقر]",
  am: "[የዋና አስተዳዳሪ መልእክት]",
  bn: "[সদর দপ্তর প্রশাসকের বার্তা]",
  da: "[Besked fra Administrationen]",
  fa: "[پیام از مدیریت دفتر مرکزی]",
  he: "[הודעה מהנהלת המטה]",
  hi: "[मुख्यालय प्रशासक का संदेश]",
  it: "[Messaggio dall\'Amministrazione]",
  kk: "[Бас кеңсе әкімшісінің хабарламасы]",
  km: "[សារពីអ្នកគ្រប់គ្រងទីស្នាក់ការ]",
  mn: "[Төв оффисын админы зурвас]",
  my: "[ရုံးချုပ် စီမံခန့်ခွဲသူထံမှ မက်ဆေ့ခ်ျ]",
  ne: "[मुख्यालय प्रशासकको सन्देश]",
  nl: "[Bericht van Hoofdkantoorbeheerder]",
  no: "[Melding fra Hovedkontoradministrasjonen]",
  pl: "[Wiadomość z Centrali]",
  si: "[ප්‍රධාන කාර්යාල පරිපාලකගෙන් පණිවිඩය]",
  sv: "[Meddelande från Huvudkontorsadministrationen]",
  ta: "[தலைமையக நிர்வாகியிடமிருந்து செய்தி]",
  tet: "[Mensajen husi Administrasaun Sede]",
  tr: "[Genel Merkez Yöneticisinden Mesaj]",
  uk: "[Повідомлення від адміністрації головного офісу]",
  uz: "[Bosh ofis administratoridan xabar]"
};

const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 1. Clean chat.duty: remove " (Duty)"
  if (data.chat && data.chat.duty) {
    data.chat.duty = data.chat.duty.replace(/\s*\(Duty\)/gi, '').trim();
  }
  // 2. Clean chat.breakStatus: remove " (Break)"
  if (data.chat && data.chat.breakStatus) {
    data.chat.breakStatus = data.chat.breakStatus.replace(/\s*\(Break\)/gi, '').trim();
  }

  // 3. Add chat.counselorRole
  if (!data.chat) data.chat = {};
  data.chat.counselorRole = counselorRoleTranslations[lang] || counselorRoleTranslations['en'] || "Counselor";

  // 4. Add workspace.adminChatRecipientCounselor
  if (!data.workspace) data.workspace = {};
  data.workspace.adminChatRecipientCounselor = recipientCounselorTranslations[lang] || recipientCounselorTranslations['en'];

  // 5. Update workspace.adminChatOnline
  data.workspace.adminChatOnline = onlineTranslations[lang] || onlineTranslations['en'];

  // 6. Update workspace.adminChat
  if (adminChatTranslations[lang]) {
    data.workspace.adminChat = adminChatTranslations[lang];
  }

  // 7. Update workspace.adminChatTitle (strip sys.life.help)
  if (adminChatTitleTranslations[lang]) {
    data.workspace.adminChatTitle = adminChatTitleTranslations[lang];
  } else if (data.workspace.adminChatTitle) {
    data.workspace.adminChatTitle = data.workspace.adminChatTitle.replace(/sys\.life\.help\s*/gi, '').trim();
  }

  // 8. Add workspace.adminNoticeBanner
  data.workspace.adminNoticeBanner = adminNoticeBannerTranslations[lang] || adminNoticeBannerTranslations['en'];

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${file}`);
});

console.log('All message files successfully updated.');

