const fs = require('fs');
const path = require('path');

const HOME_TRANSLATIONS = {
  ko: "홈",
  en: "Home",
  vi: "Trang chủ",
  pl: "Strona główna",
  zh: "首页",
  "zh-Hans": "首页",
  "zh-Hant": "首頁",
  ja: "ホーム",
  de: "Startseite",
  fr: "Accueil",
  es: "Inicio",
  pt: "Página Inicial",
  it: "Home",
  ru: "Главная",
  uk: "Головна",
  tr: "Ana Sayfa",
  id: "Beranda",
  th: "หน้าแรก",
  nl: "Startpagina",
  sv: "Startsida",
  da: "Forside",
  no: "Forside",
  el: "Αρχική",
  ar: "الرئيسية",
  arz: "الرئيسية",
  fa: "صفحه اصلی",
  he: "דף הבית",
  hi: "होम",
  bn: "হোম",
  ta: "முகப்பு",
  si: "මුල් පිටුව",
  ne: "गृहपृष्ठ",
  my: "ပင်မစာမျက်နှာ",
  km: "ទំព័រដើម",
  mn: "Нүүр хуудас",
  kk: "Басты бет",
  uz: "Bosh sahifa",
  tet: "Pájina Prinsipál",
  am: "ዋና ገጽ",
};

const messagesDir = path.join(__dirname, '..', 'messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

let updatedCount = 0;

for (const file of files) {
  const code = file.replace('.json', '');
  const filePath = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const homeText = HOME_TRANSLATIONS[code] || "Home";

  if (!data.common) {
    data.common = {};
  }

  data.common.home = homeText;
  data.common.mainHome = homeText;

  if (data.admin) {
    data.admin.mainHome = homeText;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  updatedCount++;
}

console.log(`Successfully updated home translations in ${updatedCount} language files.`);

