import json
import os

MESSAGES_DIR = "messages"

SERVICE_BADGES = {
    "ko": {
        "jobHelp": "구인·구직",
        "mobileHelp": "휴대폰 개통",
        "boiler": "난방·온수",
        "housing": "방 구하기",
        "cleaning": "정밀 청소",
        "hospitalHelp": "병원·통역",
        "clog": "긴급 출동",
        "leakPlumbing": "누수 탐지",
        "bankHelp": "계좌 개설",
        "insuranceHelp": "보험·체류"
    },
    "en": {
        "jobHelp": "Jobs & Work",
        "mobileHelp": "Mobile SIM",
        "boiler": "Heating & Water",
        "housing": "Find Rooms",
        "cleaning": "Deep Cleaning",
        "hospitalHelp": "Hospital & Care",
        "clog": "Emergency Dispatch",
        "leakPlumbing": "Leak Detection",
        "bankHelp": "Bank Account",
        "insuranceHelp": "Insurance & Visa"
    },
    "vi": {
        "jobHelp": "Việc làm",
        "mobileHelp": "Mở mạng SIM",
        "boiler": "Sưởi ấm · Nước nóng",
        "housing": "Thuê phòng",
        "cleaning": "Vệ sinh chuyên sâu",
        "hospitalHelp": "Bệnh viện · Thông dịch",
        "clog": "Cứu hộ khẩn cấp",
        "leakPlumbing": "Dò tìm rò rỉ",
        "bankHelp": "Mở tài khoản",
        "insuranceHelp": "Bảo hiểm · Cư trú"
    },
    "zh-Hans": {
        "jobHelp": "求职招聘",
        "mobileHelp": "手机开通",
        "boiler": "地暖·热水",
        "housing": "租房找房",
        "cleaning": "深度保洁",
        "hospitalHelp": "就医陪诊",
        "clog": "紧急出动",
        "leakPlumbing": "漏水检测",
        "bankHelp": "开立账户",
        "insuranceHelp": "保险·居留"
    },
    "zh-Hant": {
        "jobHelp": "求職招聘",
        "mobileHelp": "手機開通",
        "boiler": "地暖·熱水",
        "housing": "租房找房",
        "cleaning": "深度保潔",
        "hospitalHelp": "就醫陪診",
        "clog": "緊急出動",
        "leakPlumbing": "漏水檢測",
        "bankHelp": "開立帳戶",
        "insuranceHelp": "保險·居留"
    },
    "ja": {
        "jobHelp": "求人・就職",
        "mobileHelp": "携帯開通",
        "boiler": "暖房・給湯",
        "housing": "お部屋探し",
        "cleaning": "専門清掃",
        "hospitalHelp": "病院・通訳",
        "clog": "緊急出動",
        "leakPlumbing": "漏水探知",
        "bankHelp": "口座開設",
        "insuranceHelp": "保険・在留"
    },
    "ru": {
        "jobHelp": "Вакансии",
        "mobileHelp": "Связь и SIM",
        "boiler": "Отопление",
        "housing": "Аренда жилья",
        "cleaning": "Клининг",
        "hospitalHelp": "Больница",
        "clog": "Срочный выезд",
        "leakPlumbing": "Поиск утечек",
        "bankHelp": "Счет в банке",
        "insuranceHelp": "Страховка"
    },
    "mn": {
        "jobHelp": "Ажил хайлт",
        "mobileHelp": "Сим карт",
        "boiler": "Халаалт",
        "housing": "Байр хайх",
        "cleaning": "Цэвэрлэгээ",
        "hospitalHelp": "Эмнэлэг",
        "clog": "Яаралтай тусламж",
        "leakPlumbing": "Шүүрэлтийн оношилгоо",
        "bankHelp": "Данс нээх",
        "insuranceHelp": "Даатгал"
    },
    "uz": {
        "jobHelp": "Ish o'rinlari",
        "mobileHelp": "Mobil aloqa",
        "boiler": "Isitish tizimi",
        "housing": "Uy-joy topish",
        "cleaning": "Tozalash",
        "hospitalHelp": "Shifoxona",
        "clog": "Tezkor chiqish",
        "leakPlumbing": "Oqishni aniqlash",
        "bankHelp": "Hisob ochish",
        "insuranceHelp": "Sug'urta"
    },
    "th": {
        "jobHelp": "หางาน",
        "mobileHelp": "เปิดเบอร์มือถือ",
        "boiler": "ระบบทำความร้อน",
        "housing": "หาห้องพัก",
        "cleaning": "ทำความสะอาด",
        "hospitalHelp": "โรงพยาบาล",
        "clog": "ออกเหตุฉุกเฉิน",
        "leakPlumbing": "ตรวจหารอยรั่ว",
        "bankHelp": "เปิดบัญชี",
        "insuranceHelp": "ประกันภัย"
    },
    "km": {
        "jobHelp": "ស្វែងរកការងារ",
        "mobileHelp": "បើកស៊ីមកាត",
        "boiler": "ប្រព័ន្ធកម្តៅ",
        "housing": "ស្វែងរកបន្ទប់",
        "cleaning": "សម្អាតបន្ទប់",
        "hospitalHelp": "មន្ទីរពេទ្យ",
        "clog": "ចេញជួយបន្ទាន់",
        "leakPlumbing": "ពិនិត្យលេចធ្លាយ",
        "bankHelp": "បើកគណនី",
        "insuranceHelp": "ការធានារ៉ាប់រង"
    },
    "id": {
        "jobHelp": "Lowongan Kerja",
        "mobileHelp": "Aktivasi SIM",
        "boiler": "Pemanas & Air",
        "housing": "Cari Kamar",
        "cleaning": "Pembersihan Ahli",
        "hospitalHelp": "Rumah Sakit",
        "clog": "Darurat Kilat",
        "leakPlumbing": "Deteksi Bocor",
        "bankHelp": "Buka Rekening",
        "insuranceHelp": "Asuransi & Visa"
    },
    "es": {
        "jobHelp": "Empleo",
        "mobileHelp": "Activación SIM",
        "boiler": "Calefacción",
        "housing": "Buscar Alojamiento",
        "cleaning": "Limpieza a Fondo",
        "hospitalHelp": "Hospital y Salud",
        "clog": "Salida de Emergencia",
        "leakPlumbing": "Detección de Fugas",
        "bankHelp": "Cuenta Bancaria",
        "insuranceHelp": "Seguro y Visado"
    },
    "fr": {
        "jobHelp": "Emploi & Travail",
        "mobileHelp": "Activation SIM",
        "boiler": "Chauffage & Eau",
        "housing": "Logement",
        "cleaning": "Nettoyage Pro",
        "hospitalHelp": "Hôpital & Soins",
        "clog": "Intervention Urgente",
        "leakPlumbing": "Détection de Fuite",
        "bankHelp": "Compte Bancaire",
        "insuranceHelp": "Assurance & Séjour"
    },
    "de": {
        "jobHelp": "Jobs & Arbeit",
        "mobileHelp": "SIM-Aktivierung",
        "boiler": "Heizung & Wasser",
        "housing": "Wohnungssuche",
        "cleaning": "Grundreinigung",
        "hospitalHelp": "Krankenhaus",
        "clog": "Notdienst",
        "leakPlumbing": "Leckortung",
        "bankHelp": "Kontoeröffnung",
        "insuranceHelp": "Versicherung"
    },
    "ne": {
        "jobHelp": "रोजगारी",
        "mobileHelp": "मोबाइल सिम",
        "boiler": "तातो पानी र हिटिङ",
        "housing": "कोठा खोज्ने",
        "cleaning": "विशेष सरसफाइ",
        "hospitalHelp": "अस्पताल सहयोग",
        "clog": "आपतकालीन सेवा",
        "leakPlumbing": "चुहावट पत्ता",
        "bankHelp": "खाता खोल्ने",
        "insuranceHelp": "बीमा र बसाइ"
    },
    "hi": {
        "jobHelp": "रोजगार",
        "mobileHelp": "मोबाइल सिम",
        "boiler": "हीटिंग और पानी",
        "housing": "कमरा खोजें",
        "cleaning": "गहरी सफाई",
        "hospitalHelp": "अस्पताल सहायता",
        "clog": "आपातकालीन सेवा",
        "leakPlumbing": "रिसाव का पता",
        "bankHelp": "खाता खोलना",
        "insuranceHelp": "बीमा और वीजा"
    },
    "my": {
        "jobHelp": "အလုပ်အကိုင်",
        "mobileHelp": "ဆင်းမ်ကတ်ဖွင့်ခြင်း",
        "boiler": "ရေပူနှင့်အပူပေးစနစ်",
        "housing": "အခန်းရှာဖွေခြင်း",
        "cleaning": "အထူးသန့်ရှင်းရေး",
        "hospitalHelp": "ဆေးရုံအဖော်",
        "clog": "အရေးပေါ်အကူအညီ",
        "leakPlumbing": "ရေယိုစိမ့်မှုရှာဖွေခြင်း",
        "bankHelp": "ဘဏ်အကောင့်ဖွင့်ခြင်း",
        "insuranceHelp": "အာမခံနှင့်ဗီဇာ"
    },
    "si": {
        "jobHelp": "රැකියා",
        "mobileHelp": "සිම් සක්‍රිය කිරීම",
        "boiler": "තාපන පද්ධති",
        "housing": "කාමර සෙවීම",
        "cleaning": "පිරිසිදු කිරීම",
        "hospitalHelp": "රෝහල් සහාය",
        "clog": "හදිසි සේවා",
        "leakPlumbing": "කාන්දු හඳුනාගැනීම",
        "bankHelp": "ගිණුම් විවෘත කිරීම",
        "insuranceHelp": "රක්ෂණ"
    },
    "bn": {
        "jobHelp": "চাকরি ও কাজ",
        "mobileHelp": "মোবাইল সিম",
        "boiler": "হিটিং ও গরম পানি",
        "housing": "ঘর খোঁজা",
        "cleaning": "বিশেষ পরিচ্ছন্নতা",
        "hospitalHelp": "হাসপাতাল ও অনুবাদ",
        "clog": "জরুরি সেবা",
        "leakPlumbing": "লিক শনাক্তকরণ",
        "bankHelp": "অ্যাকাউন্ট খোলা",
        "insuranceHelp": "বীমা ও ভিসা"
    },
    "ta": {
        "jobHelp": "வேலைவாய்ப்பு",
        "mobileHelp": "மொபைல் சிம்",
        "boiler": "வெப்பமூட்டி",
        "housing": "அறை தேடுதல்",
        "cleaning": "சிறப்பு சுத்தம்",
        "hospitalHelp": "மருத்துவமனை",
        "clog": "அவசர சேவை",
        "leakPlumbing": "கசிவு கண்டறிதல்",
        "bankHelp": "வங்கி கணக்கு",
        "insuranceHelp": "காப்பீடு"
    },
    "kk": {
        "jobHelp": "Жұмыс орындары",
        "mobileHelp": "SIM белсендіру",
        "boiler": "Жылыту жүйесі",
        "housing": "Баспана іздеу",
        "cleaning": "Тазалау",
        "hospitalHelp": "Аурухана",
        "clog": "Шұғыл көмек",
        "leakPlumbing": "Ағуды анықтау",
        "bankHelp": "Шот ашу",
        "insuranceHelp": "Сақтандыру"
    },
    "tr": {
        "jobHelp": "İş İlanları",
        "mobileHelp": "SIM Aktivasyonu",
        "boiler": "Isıtma & Sıcak Su",
        "housing": "Oda / Ev Bulma",
        "cleaning": "Detaylı Temizlik",
        "hospitalHelp": "Hastane & Çeviri",
        "clog": "Acil Müdahale",
        "leakPlumbing": "Kaçak Tespiti",
        "bankHelp": "Hesap Açma",
        "insuranceHelp": "Sigorta"
    },
    "uk": {
        "jobHelp": "Вакансії та робота",
        "mobileHelp": "Зв'язок та SIM",
        "boiler": "Опалення та вода",
        "housing": "Пошук житла",
        "cleaning": "Клінінг",
        "hospitalHelp": "Лікарня",
        "clog": "Терміновий виїзд",
        "leakPlumbing": "Пошук витоків",
        "bankHelp": "Відкриття рахунку",
        "insuranceHelp": "Страхування"
    },
    "tet": {
        "jobHelp": "Buka Servisu",
        "mobileHelp": "Ativa SIM",
        "boiler": "Añesidu & Bee Manas",
        "housing": "Buka Kuaertu",
        "cleaning": "Hamoos Jerál",
        "hospitalHelp": "Ospitál",
        "clog": "Emerjénsia",
        "leakPlumbing": "Diresaun Sulin",
        "bankHelp": "Loke Konta",
        "insuranceHelp": "Seguru"
    },
    "ar": {
        "jobHelp": "فرص عمل",
        "mobileHelp": "تفعيل شريحة SIM",
        "boiler": "تدفئة ومياه ساخنة",
        "housing": "بحث عن سكن",
        "cleaning": "تنظيف شامل",
        "hospitalHelp": "مرافقة للمستشفى",
        "clog": "طوارئ فورية",
        "leakPlumbing": "كشف التسربات",
        "bankHelp": "فتح حساب بنكي",
        "insuranceHelp": "تأمين وإقامة"
    },
    "arz": {
        "jobHelp": "شغل وظايف",
        "mobileHelp": "تشغيل خط SIM",
        "boiler": "تدفئة ومية سخنة",
        "housing": "تدوير على سكن",
        "cleaning": "تنضيف متخصص",
        "hospitalHelp": "مستشفى ومترجم",
        "clog": "طوارئ سريعة",
        "leakPlumbing": "كشف تسريب مية",
        "bankHelp": "فتح حساب بنك",
        "insuranceHelp": "تأمين وإقامة"
    },
    "fa": {
        "jobHelp": "فرصت‌های شغلی",
        "mobileHelp": "فعالسازی سیم‌کارت",
        "boiler": "گرمایش و آب گرم",
        "housing": "یافتن مسکن",
        "cleaning": "نظافت تخصصی",
        "hospitalHelp": "بیمارستان و ترجمه",
        "clog": "اعزام فوری",
        "leakPlumbing": "تشخیص نشتی",
        "bankHelp": "افتتاح حساب",
        "insuranceHelp": "بیمه و اقامت"
    },
    "it": {
        "jobHelp": "Lavoro e Impiego",
        "mobileHelp": "Attivazione SIM",
        "boiler": "Riscaldamento",
        "housing": "Cerca Alloggio",
        "cleaning": "Pulizia Profonda",
        "hospitalHelp": "Ospedale e Cure",
        "clog": "Pronto Intervento",
        "leakPlumbing": "Rilevamento Perdite",
        "bankHelp": "Apertura Conto",
        "insuranceHelp": "Assicurazione"
    },
    "nl": {
        "jobHelp": "Werk & Banen",
        "mobileHelp": "SIM-activatie",
        "boiler": "Verwarming & Water",
        "housing": "Kamer Zoeken",
        "cleaning": "Dieptereiniging",
        "hospitalHelp": "Ziekenhuis",
        "clog": "Spoeddienst",
        "leakPlumbing": "Lekdetectie",
        "bankHelp": "Bankrekening",
        "insuranceHelp": "Verzekering"
    },
    "pl": {
        "jobHelp": "Praca i Zatrudnienie",
        "mobileHelp": "Aktywacja SIM",
        "boiler": "Ogrzewanie i Woda",
        "housing": "Szukanie Pokoju",
        "cleaning": "Sprzątanie Specjalistyczne",
        "hospitalHelp": "Szpital i Opieka",
        "clog": "Pogotowie Awaryjne",
        "leakPlumbing": "Wykrywanie Nieszczelności",
        "bankHelp": "Otwarcie Konta",
        "insuranceHelp": "Ubezpieczenie"
    },
    "am": {
        "jobHelp": "የሥራ ዕድሎች",
        "mobileHelp": "ሲም ካርድ መክፈት",
        "boiler": "ማሞቂያ እና ሙቅ ውሃ",
        "housing": "ቤት ፍለጋ",
        "cleaning": "ጥልቅ ጽዳት",
        "hospitalHelp": "ሆስፒታል እርዳታ",
        "clog": "አስቸኳይ ድጋፍ",
        "leakPlumbing": "የውሃ ፍሳሽ ፍለጋ",
        "bankHelp": "የባንክ ሒሳብ",
        "insuranceHelp": "ኢንሹራንስ"
    },
    "sv": {
        "jobHelp": "Jobb & Arbete",
        "mobileHelp": "SIM-aktivering",
        "boiler": "Värme & Vatten",
        "housing": "Hitta Rum",
        "cleaning": "Djuprengöring",
        "hospitalHelp": "Sjukhus & Vård",
        "clog": "Akututryckning",
        "leakPlumbing": "Läckagesökning",
        "bankHelp": "Bankkonto",
        "insuranceHelp": "Försäkring"
    },
    "he": {
        "jobHelp": "דרושים ועבודה",
        "mobileHelp": "הפעלת SIM",
        "boiler": "חימום ומים חמים",
        "housing": "חיפוש דירה",
        "cleaning": "ניקיון יסודי",
        "hospitalHelp": "בית חולים ורפואה",
        "clog": "קריאת חירום",
        "leakPlumbing": "איתור נזילות",
        "bankHelp": "פתיחת חשבון",
        "insuranceHelp": "ביטוח ושהייה"
    },
    "da": {
        "jobHelp": "Jobs & Arbejde",
        "mobileHelp": "SIM-aktivering",
        "boiler": "Varme & Vand",
        "housing": "Find Værelse",
        "cleaning": "Dybderengøring",
        "hospitalHelp": "Hospital & Læge",
        "clog": "Akut Udrykning",
        "leakPlumbing": "Lækagesøgning",
        "bankHelp": "Bankkonto",
        "insuranceHelp": "Forsikring"
    },
    "no": {
        "jobHelp": "Jobb & Arbeid",
        "mobileHelp": "SIM-aktivering",
        "boiler": "Oppvarming & Vann",
        "housing": "Finn Rom",
        "cleaning": "Hovedrengjøring",
        "hospitalHelp": "Sykehus & Helse",
        "clog": "Utrykning",
        "leakPlumbing": "Lekkasjesøk",
        "bankHelp": "Bankkonto",
        "insuranceHelp": "Forsikring"
    },
    "el": {
        "jobHelp": "Εργασία & Θέσεις",
        "mobileHelp": "Ενεργοποίηση SIM",
        "boiler": "Θέρμανση & Νερό",
        "housing": "Εύρεση Κατοικίας",
        "cleaning": "Βαθύς Καθαρισμός",
        "hospitalHelp": "Νοσοκομείο",
        "clog": "Άμεση Επέμβαση",
        "leakPlumbing": "Εντοπισμός Διαρροής",
        "bankHelp": "Άνοιγμα Λογαριασμού",
        "insuranceHelp": "Ασφάλιση"
    },
    "pt": {
        "jobHelp": "Vagas & Emprego",
        "mobileHelp": "Ativação de SIM",
        "boiler": "Aquecimento & Água",
        "housing": "Buscar Quarto",
        "cleaning": "Limpeza Profunda",
        "hospitalHelp": "Hospital & Saúde",
        "clog": "Socorro Urgente",
        "leakPlumbing": "Deteção de Fugas",
        "bankHelp": "Abertura de Conta",
        "insuranceHelp": "Seguro & Visto"
    }
}

count = 0
for filename in os.listdir(MESSAGES_DIR):
    if not filename.endswith(".json"):
        continue
    locale_code = filename[:-5]
    filepath = os.path.join(MESSAGES_DIR, filename)

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Use locale badge data or fallback to English
    badges = SERVICE_BADGES.get(locale_code, SERVICE_BADGES["en"])
    data["serviceBadge"] = badges

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    count += 1
    print(f"Updated {filename} with serviceBadge")

print(f"Total updated files: {count}")

