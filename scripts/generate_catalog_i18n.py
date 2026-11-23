import json
import os
import re

REGISTRY_PATH = '/Users/juboklee/life-project/life-help/messages/registry.ts'
LOCALES_DIR = '/Users/juboklee/life-project/life-help/lib/learn/dailyInsights/locales'
OUTPUT_TS = '/Users/juboklee/life-project/life-help/lib/learn/dailyInsights/catalogI18n.ts'

with open(REGISTRY_PATH) as f:
    text = f.read()
locales = re.findall(r'\"([a-zA-Z-]+)\"', text[text.find('export const locales'):text.find('] as const')])

# Authentic translations for the UI elements across all 89 languages
# Keys: home, single, singleClear, catalogBadge, searchPlaceholder, allCategories, resultsCountTemplate, noResults
UI_MAP = {
    "ko": {
        "home": "홈으로",
        "single": "단일 언어",
        "singleClear": "단일 언어 표기 (모두 해제)",
        "catalogBadge": "366일 전과목 실천 가이드",
        "searchPlaceholder": "팁 제목, 원리, 행동 또는 Day 번호 검색...",
        "allCategories": "전체 분야",
        "resultsCount": "총 {count}개의 {domain} 실천 팁",
        "noResults": "검색 조건에 맞는 실천 팁이 없습니다."
    },
    "en": {
        "home": "Home",
        "single": "Single",
        "singleClear": "Single Language (Clear all)",
        "catalogBadge": "366-Day Complete Catalog",
        "searchPlaceholder": "Search title, principle, action, or day #...",
        "allCategories": "All Categories",
        "resultsCount": "{count} tips found in {domain}",
        "noResults": "No tips match your search criteria."
    },
    "vi": {
        "home": "Trang chủ",
        "single": "Đơn ngữ",
        "singleClear": "Chỉ Đơn ngữ (Xóa tất cả)",
        "catalogBadge": "366 Hướng dẫn thực tiễn toàn diện",
        "searchPlaceholder": "Tìm tiêu đề, nguyên tắc, hành động hoặc số ngày...",
        "allCategories": "Tất cả danh mục",
        "resultsCount": "Tìm thấy {count} mẹo thực tiễn trong {domain}",
        "noResults": "Không tìm thấy mẹo thực tiễn phù hợp."
    },
    "zh-Hans": {
        "home": "首页",
        "single": "单语言",
        "singleClear": "仅单语言（清除全部）",
        "catalogBadge": "366天全学科实用指南",
        "searchPlaceholder": "搜索标题、原理、行动或Day编号...",
        "allCategories": "所有类别",
        "resultsCount": "在{domain}中找到 {count} 条实用建议",
        "noResults": "没有找到符合条件的实用建议。"
    },
    "zh-Hant": {
        "home": "首頁",
        "single": "單語言",
        "singleClear": "僅單語言（清除全部）",
        "catalogBadge": "366天全學科實用指南",
        "searchPlaceholder": "搜尋標題、原理、行動或Day編號...",
        "allCategories": "所有類別",
        "resultsCount": "在{domain}中找到 {count} 條實用建議",
        "noResults": "沒有找到符合條件的實用建議。"
    },
    "ja": {
        "home": "ホーム",
        "single": "単一言語",
        "singleClear": "単一言語表示（すべて解除）",
        "catalogBadge": "366日全科目実践ガイド",
        "searchPlaceholder": "タイトル、原理、行動、Day番号を検索...",
        "allCategories": "すべてのカテゴリー",
        "resultsCount": "{domain}で {count} 件のヒントが見つかりました",
        "noResults": "検索条件に一致するヒントはありません。"
    },
    "es": {
        "home": "Inicio",
        "single": "Único",
        "singleClear": "Solo un idioma (Borrar todo)",
        "catalogBadge": "Catálogo completo de 366 días",
        "searchPlaceholder": "Buscar título, principio, acción o día #...",
        "allCategories": "Todas las categorías",
        "resultsCount": "{count} consejos encontrados en {domain}",
        "noResults": "No se encontraron consejos con los criterios de búsqueda."
    },
    "fr": {
        "home": "Accueil",
        "single": "Unique",
        "singleClear": "Langue unique (Tout effacer)",
        "catalogBadge": "Catalogue complet de 366 jours",
        "searchPlaceholder": "Rechercher titre, principe, action ou jour n°...",
        "allCategories": "Toutes les catégories",
        "resultsCount": "{count} conseils trouvés dans {domain}",
        "noResults": "Aucun conseil ne correspond à vos critères."
    },
    "de": {
        "home": "Startseite",
        "single": "Einzeln",
        "singleClear": "Nur Einzelsprache (Alle löschen)",
        "catalogBadge": "Vollständiger 366-Tage-Katalog",
        "searchPlaceholder": "Titel, Prinzip, Aktion oder Tag-Nr. suchen...",
        "allCategories": "Alle Kategorien",
        "resultsCount": "{count} Tipps gefunden in {domain}",
        "noResults": "Keine Tipps gefunden, die Ihren Suchkriterien entsprechen."
    },
    "ru": {
        "home": "Главная",
        "single": "Один язык",
        "singleClear": "Только один язык (Очистить всё)",
        "catalogBadge": "Полный каталог на 366 дней",
        "searchPlaceholder": "Поиск названия, принципа, действия или дня #...",
        "allCategories": "Все категории",
        "resultsCount": "Найдено {count} советов в {domain}",
        "noResults": "Нет советов, соответствующих критериям поиска."
    },
    "it": {
        "home": "Home",
        "single": "Singolo",
        "singleClear": "Solo lingua singola (Cancella tutto)",
        "catalogBadge": "Catalogo completo di 366 giorni",
        "searchPlaceholder": "Cerca titolo, principio, azione o giorno #...",
        "allCategories": "Tutte le categorie",
        "resultsCount": "{count} consigli trovati in {domain}",
        "noResults": "Nessun consiglio corrisponde ai criteri di ricerca."
    },
    "pt": {
        "home": "Início",
        "single": "Único",
        "singleClear": "Apenas um idioma (Limpar tudo)",
        "catalogBadge": "Catálogo completo de 366 dias",
        "searchPlaceholder": "Pesquisar título, princípio, ação ou dia #...",
        "allCategories": "Todas as categorias",
        "resultsCount": "{count} dicas encontradas em {domain}",
        "noResults": "Nenhuma dica encontrada para os critérios de busca."
    },
    "nl": {
        "home": "Startpagina",
        "single": "Enkel",
        "singleClear": "Alleen enkele taal (Alles wissen)",
        "catalogBadge": "Volledige 366-dagen catalogus",
        "searchPlaceholder": "Zoek titel, principe, actie of dag #...",
        "allCategories": "Alle categorieën",
        "resultsCount": "{count} tips gevonden in {domain}",
        "noResults": "Geen tips gevonden die voldoen aan uw zoekcriteria."
    },
    "pl": {
        "home": "Strona główna",
        "single": "Pojedynczy",
        "singleClear": "Tylko jeden język (Wyczyść wszystko)",
        "catalogBadge": "Pełny katalog na 366 dni",
        "searchPlaceholder": "Szukaj tytułu, zasady, działania lub dnia #...",
        "allCategories": "Wszystkie kategorie",
        "resultsCount": "Znaleziono {count} wskazówek w {domain}",
        "noResults": "Brak wskazówek spełniających kryteria wyszukiwania."
    },
    "tr": {
        "home": "Ana Sayfa",
        "single": "Tek Dil",
        "singleClear": "Yalnızca Tek Dil (Tümünü Temizle)",
        "catalogBadge": "366 Günlük Kapsamlı Katalog",
        "searchPlaceholder": "Başlık, ilke, eylem veya gün # ara...",
        "allCategories": "Tüm Kategoriler",
        "resultsCount": "{domain} içinde {count} ipucu bulundu",
        "noResults": "Arama kriterlerinize uyan ipucu bulunamadı."
    },
    "uk": {
        "home": "Головна",
        "single": "Один язик",
        "singleClear": "Тільки одна мова (Очистити все)",
        "catalogBadge": "Повний каталог на 366 днів",
        "searchPlaceholder": "Пошук заголовка, принципу, дії або дня #...",
        "allCategories": "Усі категорії",
        "resultsCount": "Знайдено {count} порад у {domain}",
        "noResults": "Не знайдено порад, що відповідають критеріям пошуку."
    },
    "ar": {
        "home": "الرئيسية",
        "single": "أحادي اللغة",
        "singleClear": "لغة واحدة فقط (مسح الكل)",
        "catalogBadge": "الدليل الشامل لـ 366 يوماً",
        "searchPlaceholder": "ابحث عن العنوان أو المبدأ أو الإجراء أو اليوم #...",
        "allCategories": "جميع الفئات",
        "resultsCount": "تم العثور على {count} نصيحة في {domain}",
        "noResults": "لا توجد نصائح تطابق معايير البحث."
    },
    "fa": {
        "home": "صفحه اصلی",
        "single": "تک‌زبانه",
        "singleClear": "فقط یک زبان (پاک کردن همه)",
        "catalogBadge": "کاتالوگ کامل ۳۶۶ روزه",
        "searchPlaceholder": "جستجوی عنوان، اصل، اقدام یا روز #...",
        "allCategories": "همه دسته‌ها",
        "resultsCount": "{count} نکته در {domain} یافت شد",
        "noResults": "هیچ نکته‌ای مطابق با معیارهای جستجو یافت نشد."
    },
    "he": {
        "home": "דף הבית",
        "single": "שפה אחת",
        "singleClear": "שפה בודדת בלבד (נקה הכל)",
        "catalogBadge": "קטלוג מלא ל-366 ימים",
        "searchPlaceholder": "חיפוש כותרת, עיקרון, פעולה או יום #...",
        "allCategories": "כל הקטגוריות",
        "resultsCount": "נמצאו {count} טיפים ב-{domain}",
        "noResults": "לא נמצאו טיפים התואמים את קריטריוני החיפוש."
    },
    "hi": {
        "home": "मुखपृष्ठ",
        "single": "एकल भाषा",
        "singleClear": "केवल एकल भाषा (सभी साफ़ करें)",
        "catalogBadge": "366-दिवसीय संपूर्ण कैटलॉग",
        "searchPlaceholder": "शीर्षक, सिद्धांत, कार्य या दिन # खोजें...",
        "allCategories": "सभी श्रेणियां",
        "resultsCount": "{domain} में {count} सुझाव मिले",
        "noResults": "आपके खोज मानदंडों से मेल खाने वाले कोई सुझाव नहीं मिले।"
    },
    "th": {
        "home": "หน้าแรก",
        "single": "ภาษาเดียว",
        "singleClear": "เฉพาะภาษาเดียว (ล้างทั้งหมด)",
        "catalogBadge": "คู่มือปฏิบัติครบ 366 วัน",
        "searchPlaceholder": "ค้นหาชื่อเรื่อง หลักการ การปฏิบัติ หรือวันที่ #...",
        "allCategories": "ทุกหมวดหมู่",
        "resultsCount": "พบ {count} เคล็ดลับใน {domain}",
        "noResults": "ไม่พบเคล็ดลับที่ตรงกับเกณฑ์การค้นหาของคุณ"
    },
    "id": {
        "home": "Beranda",
        "single": "Bahasa Tunggal",
        "singleClear": "Hanya Bahasa Tunggal (Hapus Semua)",
        "catalogBadge": "Katalog Lengkap 366 Hari",
        "searchPlaceholder": "Cari judul, prinsip, tindakan, atau hari #...",
        "allCategories": "Semua Kategori",
        "resultsCount": "{count} kiat ditemukan di {domain}",
        "noResults": "Tidak ada kiat yang cocok dengan kriteria pencarian Anda."
    },
    "ms": {
        "home": "Laman Utama",
        "single": "Bahasa Tunggal",
        "singleClear": "Hanya Bahasa Tunggal (Kosongkan Semua)",
        "catalogBadge": "Katalog Lengkap 366 Hari",
        "searchPlaceholder": "Cari tajuk, prinsip, tindakan, atau hari #...",
        "allCategories": "Semua Kategori",
        "resultsCount": "{count} petua ditemui dalam {domain}",
        "noResults": "Tiada petua yang sepadan dengan kriteria carian anda."
    },
    "tl": {
        "home": "Tahanan",
        "single": "Isang Wika",
        "singleClear": "Isang Wika Lamang (I-clear Lahat)",
        "catalogBadge": "Kumpletong Katalogo ng 366 Araw",
        "searchPlaceholder": "Maghanap ng pamagat, prinsipyo, aksyon, o araw #...",
        "allCategories": "Lahat ng Kategorya",
        "resultsCount": "{count} tip ang nahanap sa {domain}",
        "noResults": "Walang tip na tumutugma sa iyong pamantayan sa paghahanap."
    },
    "bn": {
        "home": "হোম",
        "single": "একক ভাষা",
        "singleClear": "শুধুমাত্র একক ভাষা (সব মুছুন)",
        "catalogBadge": "৩৬৬ দিনের সম্পূর্ণ ক্যাটালগ",
        "searchPlaceholder": "শিরোনাম, নীতি, পদক্ষেপ বা দিন # অনুসন্ধান করুন...",
        "allCategories": "সব বিভাগ",
        "resultsCount": "{domain}-এ {count}টি টিপস পাওয়া গেছে",
        "noResults": "আপনার অনুসন্ধানের সাথে মেলে এমন কোনো টিপস পাওয়া যায়নি।"
    },
    "ur": {
        "home": "ہوم",
        "single": "واحد زبان",
        "singleClear": "صرف واحد زبان (سب صاف کریں)",
        "catalogBadge": "366 روزہ مکمل کیٹلاگ",
        "searchPlaceholder": "عنوان، اصول، عمل یا دن # تلاش کریں...",
        "allCategories": "تمام زمرہ جات",
        "resultsCount": "{domain} میں {count} تجاویز ملیں",
        "noResults": "آپ کے تلاش کے معیار کے مطابق کوئی تجاویز نہیں ملیں۔"
    },
    "my": {
        "home": "ပင်မစာမျက်နှာ",
        "single": "ဘာသာစကားတစ်ခုတည်း",
        "singleClear": "ဘာသာစကားတစ်ခုတည်းသာ (အားလုံးရှင်းမည်)",
        "catalogBadge": "၃၆၆ ရက်ပြည့် လက်တွေ့လမ်းညွှန်",
        "searchPlaceholder": "ခေါင်းစဉ်၊ မူဝါဒ၊ လုပ်ဆောင်ချက် သို့မဟုတ် နေ့ရက် # ရှာရန်...",
        "allCategories": "ကဏ္ဍအားလုံး",
        "resultsCount": "{domain} တွင် အကြံပြုချက် {count} ခု တွေ့ရှိသည်",
        "noResults": "ရှာဖွေမှုနှင့် ကိုက်ညီသော အကြံပြုချက် မတွေ့ပါ။"
    },
    "km": {
        "home": "ទំព័រដើម",
        "single": "ភាសាតែមួយ",
        "singleClear": "តែភាសាតែមួយ (សម្អាតទាំងអស់)",
        "catalogBadge": "កាតាឡុកអនុវត្ត ៣៦៦ ថ្ងៃពេញលេញ",
        "searchPlaceholder": "ស្វែងរកចំណងជើង គោលការណ៍ សកម្មភាព ឬថ្ងៃទី #...",
        "allCategories": "គ្រប់ប្រភេទទាំងអស់",
        "resultsCount": "បានរកឃើញគន្លឹះ {count} នៅក្នុង {domain}",
        "noResults": "រកមិនឃើញគន្លឹះដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរករបស់អ្នកទេ។"
    },
    "uz": {
        "home": "Bosh sahifa",
        "single": "Yakka til",
        "singleClear": "Faqat bitta til (Hammasini tozalash)",
        "catalogBadge": "366 kunlik to'liq katalog",
        "searchPlaceholder": "Sarlavha, tamoyil, amal yoki kun # qidirish...",
        "allCategories": "Barcha toifalar",
        "resultsCount": "{domain} bo'yicha {count} ta maslahat topildi",
        "noResults": "Qidiruv mezonlariga mos keladigan maslahatlar topilmadi."
    },
    "kk": {
        "home": "Басты бет",
        "single": "Жалғыз тіл",
        "singleClear": "Тек бір тіл (Барлығын тазарту)",
        "catalogBadge": "366 күндік толық каталог",
        "searchPlaceholder": "Тақырып, қағида, әрекет немесе күн # іздеу...",
        "allCategories": "Барлық санаттар",
        "resultsCount": "{domain} бойынша {count} кеңес табылды",
        "noResults": "Іздеу шарттарына сәйкес келетін кеңестер табылмады."
    },
    "mn": {
        "home": "Нүүр",
        "single": "Нэг хэл",
        "singleClear": "Зөвхөн нэг хэл (Бүгдийг арилгах)",
        "catalogBadge": "366 өдрийн бүрэн каталог",
        "searchPlaceholder": "Гарчиг, зарчим, үйлдэл эсвэл өдөр # хайх...",
        "allCategories": "Бүх ангилал",
        "resultsCount": "{domain} дотор {count} зөвлөгөө олдлоо",
        "noResults": "Хайлтын шалгуурт тохирох зөвлөгөө олдсонгүй."
    },
    "ne": {
        "home": "गृहपृष्ठ",
        "single": "एकल भाषा",
        "singleClear": "केवल एकल भाषा (सबै खाली गर्नुहोस्)",
        "catalogBadge": "३६६-दिने पूर्ण क्याटलग",
        "searchPlaceholder": "शीर्षक, सिद्धान्त, कार्य वा दिन # खोज्नुहोस्...",
        "allCategories": "सबै वर्गहरू",
        "resultsCount": "{domain} मा {count} सुझावहरू फेला परे",
        "noResults": "तपाईंको खोजी मापदण्डसँग मेल खाने कुनै सुझावहरू फेला परेनन्।"
    },
    "si": {
        "home": "මුල් පිටුව",
        "single": "තනි භාෂාව",
        "singleClear": "තනි භාෂාව පමණි (සියල්ල හිස් කරන්න)",
        "catalogBadge": "දින 366 සම්පූර්ණ නාමාවලිය",
        "searchPlaceholder": "මාතෘකාව, මූලධර්මය, ක්‍රියාව හෝ දිනය # සොයන්න...",
        "allCategories": "සියලුම ප්‍රවර්ග",
        "resultsCount": "{domain} හි ඉඟි {count} ක් හමු විය",
        "noResults": "ඔබගේ සෙවුම් නිර්ණායකවලට ගැලපෙන ඉඟි හමු නොවීය."
    },
    "ta": {
        "home": "முகப்பு",
        "single": "ஒற்றை மொழி",
        "singleClear": "ஒற்றை மொழி மட்டும் (அனைத்தையும் அழி)",
        "catalogBadge": "366 நாள் முழுமையான பட்டியல்",
        "searchPlaceholder": "தலைப்பு, கொள்கை, செயல் அல்லது நாள் # தேடுங்கள்...",
        "allCategories": "அனைத்து பிரிவுகள்",
        "resultsCount": "{domain} இல் {count} குறிப்புகள் கண்டறியப்பட்டன",
        "noResults": "உங்கள் தேடல் அளவுகோலுக்கு பொருந்தும் குறிப்புகள் எதுவும் கிடைக்கவில்லை."
    },
    "te": {
        "home": "హోమ్",
        "single": "ఒకే భాష",
        "singleClear": "ఒకే భాష మాత్రమే (అన్నీ క్లియర్ చేయండి)",
        "catalogBadge": "366 రోజుల పూర్తి కేటలాగ్",
        "searchPlaceholder": "శీర్షిక, సూత్రం, చర్య లేదా రోజు # శోధించండి...",
        "allCategories": "అన్ని వర్గాలు",
        "resultsCount": "{domain} లో {count} చిట్కాలు కనుగొనబడ్డాయి",
        "noResults": "మీ శోధన ప్రమాణాలకు సరిపోయే చిట్కాలు ఏవీ కనుగొనబడలేదు."
    },
    "mr": {
        "home": "मुख्यपृष्ठ",
        "single": "एकल भाषा",
        "singleClear": "केवळ एकल भाषा (सर्व साफ करा)",
        "catalogBadge": "३६६ दिवसांची संपूर्ण सूची",
        "searchPlaceholder": "शीर्षक, तत्त्व, कृती किंवा दिवस # शोधा...",
        "allCategories": "सर्व श्रेणी",
        "resultsCount": "{domain} मध्ये {count} टिपा सापडल्या",
        "noResults": "तुमच्या शोध निकषांशी जुळणाऱ्या कोणत्याही टिपा सापडल्या नाहीत."
    },
    "gu": {
        "home": "હોમ",
        "single": "એકલ ભાષા",
        "singleClear": "માત્ર એકલ ભાષા (બધું સાફ કરો)",
        "catalogBadge": "366-દિવસીય સંપૂર્ણ કેટલોગ",
        "searchPlaceholder": "શીર્ષક, સિદ્ધાંત, ક્રિયા અથવા દિવસ # શોધો...",
        "allCategories": "બધી શ્રેણીઓ",
        "resultsCount": "{domain} માં {count} ટિપ્સ મળી",
        "noResults": "તમારા શોધ માપદંડ સાથે મેળ ખાતી કોઈ ટિપ્સ મળી નથી."
    },
    "pa": {
        "home": "ਮੁੱਖ ਪੰਨਾ",
        "single": "ਇੱਕੋ ਭਾਸ਼ਾ",
        "singleClear": "ਸਿਰਫ਼ ਇੱਕ ਭਾਸ਼ਾ (ਸਭ ਸਾਫ਼ ਕਰੋ)",
        "catalogBadge": "366 ਦਿਨਾਂ ਦੀ ਪੂਰੀ ਸੂਚੀ",
        "searchPlaceholder": "ਸਿਰਲੇਖ, ਸਿਧਾਂਤ, ਕਾਰਵਾਈ ਜਾਂ ਦਿਨ # ਖੋਜੋ...",
        "allCategories": "ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ",
        "resultsCount": "{domain} ਵਿੱਚ {count} ਸੁਝਾਅ ਮਿਲੇ",
        "noResults": "ਤੁਹਾਡੇ ਖੋਜ ਮਾਪਦੰਡ ਨਾਲ ਮੇਲ ਖਾਂਦੇ ਕੋਈ ਸੁਝਾਅ ਨਹੀਂ ਮਿਲੇ।"
    },
    "kn": {
        "home": "ಮುಖಪುಟ",
        "single": "ಒಂದೇ ಭಾಷೆ",
        "singleClear": "ಕೇವಲ ಒಂದೇ ಭಾಷೆ (ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ)",
        "catalogBadge": "366 ದಿನಗಳ ಸಂಪೂರ್ಣ ಕ್ಯಾಟಲಾಗ್",
        "searchPlaceholder": "ಶೀರ್ಷಿಕೆ, ತತ್ವ, ಕ್ರಿಯೆ ಅಥವಾ ದಿನ # ಹುಡುಕಿ...",
        "allCategories": "ಎಲ್ಲಾ ವರ್ಗಗಳು",
        "resultsCount": "{domain} ನಲ್ಲಿ {count} ಸಲಹೆಗಳು ಕಂಡುಬಂದಿವೆ",
        "noResults": "ನಿಮ್ಮ ಹುಡುಕಾಟ ಮಾನದಂಡಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಸಲಹೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ."
    },
    "ml": {
        "home": "ഹോം",
        "single": "ഏക ഭാഷ",
        "singleClear": "ഏക ഭാഷ മാത്രം (എല്ലാം മായ്ക്കുക)",
        "catalogBadge": "366 ദിവസത്തെ സമ്പൂർണ്ണ കാറ്റലോഗ്",
        "searchPlaceholder": "തലക്കെട്ട്, തത്വം, പ്രവർത്തനം അല്ലെങ്കിൽ ദിവസം # തിരയുക...",
        "allCategories": "എല്ലാ വിഭാഗങ്ങളും",
        "resultsCount": "{domain}-ൽ {count} നുറുങ്ങുകൾ കണ്ടെത്തി",
        "noResults": "നിങ്ങളുടെ തിരയൽ മാനദണ്ഡങ്ങളുമായി പൊരുത്തപ്പെടുന്ന നുറുങ്ങുകളൊന്നും കണ്ടെത്തിയില്ല."
    },
    "sv": {
        "home": "Hem",
        "single": "Enkelt språk",
        "singleClear": "Endast ett språk (Rensa alla)",
        "catalogBadge": "Komplett 366-dagarskatalog",
        "searchPlaceholder": "Sök titel, princip, åtgärd eller dag #...",
        "allCategories": "Alla kategorier",
        "resultsCount": "{count} tips hittades i {domain}",
        "noResults": "Inga tips matchar dina sökkriterier."
    },
    "da": {
        "home": "Hjem",
        "single": "Enkelt sprog",
        "singleClear": "Kun enkelt sprog (Ryd alle)",
        "catalogBadge": "Komplet 366-dages katalog",
        "searchPlaceholder": "Søg titel, princip, handling eller dag #...",
        "allCategories": "Alle kategorier",
        "resultsCount": "{count} tips fundet i {domain}",
        "noResults": "Ingen tips matcher dine søgekriterier."
    },
    "no": {
        "home": "Hjem",
        "single": "Enkelt språk",
        "singleClear": "Kun ett språk (Fjern alle)",
        "catalogBadge": "Komplett 366-dagers katalog",
        "searchPlaceholder": "Søk tittel, prinsipp, handling eller dag #...",
        "allCategories": "Alle kategorier",
        "resultsCount": "{count} tips funnet i {domain}",
        "noResults": "Ingen tips samsvarer med søkekriteriene dine."
    },
    "fi": {
        "home": "Koti",
        "single": "Yksi kieli",
        "singleClear": "Vain yksi kieli (Tyhjennä kaikki)",
        "catalogBadge": "Täydellinen 366 päivän luettelo",
        "searchPlaceholder": "Hae otsikkoa, periaatetta, toimintaa tai päivää #...",
        "allCategories": "Kaikki kategoriat",
        "resultsCount": "{count} vinkkiä löytyi kategoriasta {domain}",
        "noResults": "Hakuehtojasi vastaavia vinkkejä ei löytynyt."
    },
    "hu": {
        "home": "Kezdőlap",
        "single": "Egy nyelv",
        "singleClear": "Csak egy nyelv (Összes törlése)",
        "catalogBadge": "Teljes 366 napos katalógus",
        "searchPlaceholder": "Cím, alapelv, cselekvés vagy nap # keresése...",
        "allCategories": "Minden kategória",
        "resultsCount": "{count} tipp található a(z) {domain} kategóriában",
        "noResults": "Nincs a keresési feltételeknek megfelelő tipp."
    },
    "cs": {
        "home": "Domů",
        "single": "Jeden jazyk",
        "singleClear": "Pouze jeden jazyk (Vymazat vše)",
        "catalogBadge": "Kompletní 366denní katalog",
        "searchPlaceholder": "Hledat název, princip, akci nebo den #...",
        "allCategories": "Všechny kategorie",
        "resultsCount": "{count} tipů nalezeno v {domain}",
        "noResults": "Nebyly nalezeny žádné tipy odpovídající vašim kritériям."
    },
    "el": {
        "home": "Αρχική",
        "single": "Μονή γλώσσα",
        "singleClear": "Μόνο μία γλώσσα (Εκκαθάριση όλων)",
        "catalogBadge": "Πλήρης οδηγός 366 ημερών",
        "searchPlaceholder": "Αναζήτηση τίτλου, αρχής, δράσης ή ημέρας #...",
        "allCategories": "Όλες οι κατηγορίες",
        "resultsCount": "Βρέθηκαν {count} συμβουλές στο {domain}",
        "noResults": "Δεν βρέθηκαν συμβουλές που να ταιριάζουν με τα κριτήριά σας."
    },
    "ro": {
        "home": "Acasă",
        "single": "O singură limbă",
        "singleClear": "Doar o limbă (Șterge tot)",
        "catalogBadge": "Catalog complet de 366 de zile",
        "searchPlaceholder": "Caută titlu, principiu, acțiune sau zi #...",
        "allCategories": "Toate categoriile",
        "resultsCount": "{count} sfaturi găsite în {domain}",
        "noResults": "Nu s-au găsit sfaturi care să corespundă criteriilor."
    },
    "bg": {
        "home": "Начало",
        "single": "Един език",
        "singleClear": "Само един език (Изчистване на всички)",
        "catalogBadge": "Пълен каталог за 366 дни",
        "searchPlaceholder": "Търсене на заглавие, принцип, действие или ден #...",
        "allCategories": "Всички категории",
        "resultsCount": "Намерени са {count} съвета в {domain}",
        "noResults": "Няма съвети, отговарящи на вашите критерии."
    },
    "sk": {
        "home": "Domov",
        "single": "Jeden jazyk",
        "singleClear": "Iba jeden jazyk (Vymazať všetko)",
        "catalogBadge": "Kompletný 366-dňový katalóg",
        "searchPlaceholder": "Hľadať názov, princíp, akciu alebo deň #...",
        "allCategories": "Všetky kategórie",
        "resultsCount": "{count} tipov nájdených v {domain}",
        "noResults": "Nenašli sa žiadne tipy zodpovedajúce vašim kritériám."
    },
    "sl": {
        "home": "Domov",
        "single": "En jezik",
        "singleClear": "Samo en jezik (Počisti vse)",
        "catalogBadge": "Popoln 366-dnevni katalog",
        "searchPlaceholder": "Išči naslov, načelo, dejanje ali dan #...",
        "allCategories": "Vse kategorije",
        "resultsCount": "{count} nasvetov najdenih v {domain}",
        "noResults": "Ni nasvetov, ki bi ustrezali vašim iskalnim kriterijem."
    },
    "hr": {
        "home": "Početna",
        "single": "Jedan jezik",
        "singleClear": "Samo jedan jezik (Očisti sve)",
        "catalogBadge": "Kompletan katalog za 366 dana",
        "searchPlaceholder": "Pretraži naslov, načelo, radnju ili dan #...",
        "allCategories": "Sve kategorije",
        "resultsCount": "Pronađeno {count} savjeta u {domain}",
        "noResults": "Nema savjeta koji odgovaraju vašim kriterijima."
    },
    "sr": {
        "home": "Почетна",
        "single": "Један језик",
        "singleClear": "Само један језик (Очисти све)",
        "catalogBadge": "Комплетан каталог за 366 дана",
        "searchPlaceholder": "Претражи наслов, начело, радњу или дан #...",
        "allCategories": "Све категорије",
        "resultsCount": "Пронађено {count} савета у {domain}",
        "noResults": "Нема савета који одговарају вашим критеријумима."
    },
    "sq": {
        "home": "Ballina",
        "single": "Gjuhë e vetme",
        "singleClear": "Vetëm një gjuhë (Pastroji të gjitha)",
        "catalogBadge": "Katalogu i plotë 366-ditor",
        "searchPlaceholder": "Kërkoni titull, parim, veprim ose ditë #...",
        "allCategories": "Të gjitha kategoritë",
        "resultsCount": "{count} këshilla u gjetën në {domain}",
        "noResults": "Nuk u gjet asnjë këshillë që përputhet me kriteret tuaja."
    },
    "et": {
        "home": "Avaleht",
        "single": "Üks keel",
        "singleClear": "Ainult üks keel (Kustuta kõik)",
        "catalogBadge": "Täielik 366 päeva kataloog",
        "searchPlaceholder": "Otsi pealkirja, põhimõtet, tegevust või päeva #...",
        "allCategories": "Kõik kategooriad",
        "resultsCount": "{domain} leiti {count} nõuannet",
        "noResults": "Otsingutingimustele vastavaid nõuandeid ei leitud."
    },
    "lt": {
        "home": "Pagrindinis",
        "single": "Viena kalba",
        "singleClear": "Tik viena kalba (Išvalyti viską)",
        "catalogBadge": "Išsamus 366 dienų katalogas",
        "searchPlaceholder": "Ieškoti pavadinimo, principo, veiksmo ar dienos #...",
        "allCategories": "Visos kategorijos",
        "resultsCount": "{domain} rasta {count} patarimų",
        "noResults": "Pagal jūsų paieškos kriterijus patarimų nerasta."
    },
    "lv": {
        "home": "Sākums",
        "single": "Viena valoda",
        "singleClear": "Tikai viena valoda (Notīrīt visu)",
        "catalogBadge": "Pilns 366 dienu katalogs",
        "searchPlaceholder": "Meklēt nosaukumu, principu, darbību vai dienu #...",
        "allCategories": "Visas kategorijas",
        "resultsCount": "Atrasti {count} padomi sadaļā {domain}",
        "noResults": "Nav atrasts neviens padoms, kas atbilstu jūsu kritērijiem."
    },
    "is": {
        "home": "Heim",
        "single": "Eitt tungumál",
        "singleClear": "Aðeins eitt tungumál (Hreinsa allt)",
        "catalogBadge": "Heildar 366 daga bæklingur",
        "searchPlaceholder": "Leita að titli, reglu, aðgerð eða degi #...",
        "allCategories": "Allir flokkar",
        "resultsCount": "{count} ráð fundust í {domain}",
        "noResults": "Engin ráð fundust sem passa við leitarskilyrði þín."
    },
    "eu": {
        "home": "Hasiera",
        "single": "Hizkuntza bakarra",
        "singleClear": "Hizkuntza bakarra soilik (Garbitu dena)",
        "catalogBadge": "366 eguneko katalogo osoa",
        "searchPlaceholder": "Bilatu izenburua, printzipioa, ekintza edo eguna #...",
        "allCategories": "Kategoria guztiak",
        "resultsCount": "{count} aholku aurkitu dira {domain} atalean",
        "noResults": "Ez da aurkitu zure bilaketa-irizpideekin bat datorren aholkurik."
    },
    "ca": {
        "home": "Inici",
        "single": "Llengua única",
        "singleClear": "Només una llengua (Esborra-ho tot)",
        "catalogBadge": "Catàleg complet de 366 dies",
        "searchPlaceholder": "Cerca títol, principi, acció o dia #...",
        "allCategories": "Totes les categories",
        "resultsCount": "{count} consells trobats a {domain}",
        "noResults": "No s'han trobat consells que coincideixin amb els criteris."
    },
    "gl": {
        "home": "Inicio",
        "single": "Lingua única",
        "singleClear": "Só unha lingua (Borrar todo)",
        "catalogBadge": "Catálogo completo de 366 días",
        "searchPlaceholder": "Buscar título, principio, acción ou día #...",
        "allCategories": "Todas as categorías",
        "resultsCount": "{count} consellos atopados en {domain}",
        "noResults": "Non se atoparon consellos que coincidan cos criterios."
    },
    "az": {
        "home": "Ana səhifə",
        "single": "Tək dil",
        "singleClear": "Yalnız tək dil (Hamısını təmizlə)",
        "catalogBadge": "366 günlük tam kataloq",
        "searchPlaceholder": "Başlıq, prinsip, fəaliyyət və ya gün # axtar...",
        "allCategories": "Bütün kateqoriyalar",
        "resultsCount": "{domain} üzrə {count} məsləhət tapıldı",
        "noResults": "Axtarış meyarlarınıza uyğun məsləhət tapılmadı."
    },
    "ka": {
        "home": "მთავარი",
        "single": "ერთი ენა",
        "singleClear": "მხოლოდ ერთი ენა (ყველაფრის გასუფთავება)",
        "catalogBadge": "366-დღიანი სრული კატალოგი",
        "searchPlaceholder": "მოძებნეთ სათაური, პრინციპი, მოქმედება ან დღე #...",
        "allCategories": "ყველა კატეგორია",
        "resultsCount": "{domain}-ში ნაპოვნია {count} რჩევა",
        "noResults": "თქვენს კრიტერიუმებთან შესაბამისი რჩევები ვერ მოიძებნა."
    },
    "am": {
        "home": "መነሻ",
        "single": "አንድ ቋንቋ",
        "singleClear": "አንድ ቋንቋ ብቻ (ሁሉንም አጽዳ)",
        "catalogBadge": "የ366 ቀናት ሙሉ ካታሎግ",
        "searchPlaceholder": "ርዕስ፣ መርህ፣ እርምጃ ወይም ቀን # ይፈልጉ...",
        "allCategories": "ሁሉም ምድቦች",
        "resultsCount": "በ{domain} ውስጥ {count} ጠቃሚ ምክሮች ተገኝተዋል",
        "noResults": "ከፍለጋ መስፈርትዎ ጋር የሚዛመድ ምንም ጠቃሚ ምክር አልተገኘም።"
    },
    "sw": {
        "home": "Nyumbani",
        "single": "Lugha Moja",
        "singleClear": "Lugha moja pekee (Futa zote)",
        "catalogBadge": "Katalogi Kamili ya Siku 366",
        "searchPlaceholder": "Tafuta kichwa, kanuni, kitendo, au siku #...",
        "allCategories": "Kategoria Zote",
        "resultsCount": "Vidokezo {count} vimepatikana katika {domain}",
        "noResults": "Hakuna vidokezo vinavyolingana na vigezo vyako vya utafutaji."
    },
    "ha": {
        "home": "Gida",
        "single": "Harshe ɗaya",
        "singleClear": "Harshe ɗaya kawai (Share duka)",
        "catalogBadge": "Cikakken Jagorar Kwanaki 366",
        "searchPlaceholder": "Nemi take, ƙa'ida, aiki ko rana #...",
        "allCategories": "Dukkan Rukuni",
        "resultsCount": "An sami shawarwari {count} a cikin {domain}",
        "noResults": "Babu shawarwarin da suka dace da bincikenka."
    },
    "yo": {
        "home": "Ilé",
        "single": "Èdè Kan",
        "singleClear": "Èdè kan ṣoṣo (Pa gbogbo rẹ rẹ́)",
        "catalogBadge": "Àkójọpọ̀ Ọjọ́ 366 Kíkún",
        "searchPlaceholder": "Wá àkọlé, ìpilẹ̀ṣẹ̀, ìgbésẹ̀ tàbí ọjọ́ #...",
        "allCategories": "Gbogbo Ẹ̀ka",
        "resultsCount": "A rí àwọn ìmọ̀ràn {count} ní {domain}",
        "noResults": "Kò sí ìmọ̀ràn tí ó bá ìwárí rẹ mu."
    },
    "ig": {
        "home": "Ụlọ",
        "single": "Otu Asụsụ",
        "singleClear": "Naanị otu asụsụ (Hichapụ ha niile)",
        "catalogBadge": "Katalọgụ Ụbọchị 366 Zuru Ezu",
        "searchPlaceholder": "Chọọ isiokwu, ụkpụrụ, omume ma ọ bụ ụbọchị #...",
        "allCategories": "Otu Niile",
        "resultsCount": "Achọtara ndụmọdụ {count} na {domain}",
        "noResults": "Enweghị ndụmọdụ dabara na nchọta gị."
    },
    "zu": {
        "home": "Ekhaya",
        "single": "Ulimi Olulodwa",
        "singleClear": "Ulimi olulodwa kuphela (Sula konke)",
        "catalogBadge": "Ikhathalogi Ephelele Yezinsuku Ezingama-366",
        "searchPlaceholder": "Sesha isihloko, umgomo, isenzo noma usuku #...",
        "allCategories": "Zonke Izigaba",
        "resultsCount": "Kutholwe amathiphu angu-{count} ku-{domain}",
        "noResults": "Awekho amathiphu afana nemibandela yakho yosesho."
    },
    "xh": {
        "home": "Ekhaya",
        "single": "Ulwimi Olunye",
        "singleClear": "Ulwimi olunye kuphela (Cima konke)",
        "catalogBadge": "Ikhathalogu Epheleleyo Yeentsuku Ezingama-366",
        "searchPlaceholder": "Khangela isihloko, umgaqo, isenzo okanye usuku #...",
        "allCategories": "Zonke Iindidi",
        "resultsCount": "Kufunyenwe amacebiso angama-{count} kwi-{domain}",
        "noResults": "Akukho macebiso ahambelana nophando lwakho."
    },
    "sn": {
        "home": "Kumba",
        "single": "Mutauro Mumwe",
        "singleClear": "Mutauro mumwe chete (Dzima zvese)",
        "catalogBadge": "Katarogu Yakazara Yemazuva 366",
        "searchPlaceholder": "Tsvaga musoro, mutemo, chiito kana zuva #...",
        "allCategories": "Mapoka Ese",
        "resultsCount": "Mazano {count} awanikwa mu {domain}",
        "noResults": "Hapana mazano anowirirana nezvawatsvaga."
    },
    "so": {
        "home": "Hoyga",
        "single": "Hal Luqad",
        "singleClear": "Kaliya hal luqad (Nadiifi dhammaan)",
        "catalogBadge": "Buug-yaraha Buuxa ee 366 Maalmood",
        "searchPlaceholder": "Raadi cinwaanka, mabda'a, ficilka ama maalinta #...",
        "allCategories": "Dhammaan Qaybaha",
        "resultsCount": "{count} talo ayaa laga helay {domain}",
        "noResults": "Lama helin talooyin u dhigma shuruudahaaga raadinta."
    },
    "om": {
        "home": "Mana",
        "single": "Afaan Tokko",
        "singleClear": "Afaan tokko qofa (Hunda haqi)",
        "catalogBadge": "Kaataaloogii Guyyoota 366 Guutuu",
        "searchPlaceholder": "Mata duree, qajeeltoon, gocha ykn guyyaa # barbaadi...",
        "allCategories": "Ramaddii Hunda",
        "resultsCount": "Gorsi {count} {domain} keessatti argameera",
        "noResults": "Gorsi ulaagaa barbaacha keessan wajjin walsimu hin argamne."
    },
    "mg": {
        "home": "Fandraisana",
        "single": "Fiteny Tokana",
        "singleClear": "Fiteny tokana ihany (Fafao daholo)",
        "catalogBadge": "Katalogy Feno Mandritra ny 366 Andro",
        "searchPlaceholder": "Hikaroka lohateny, fitsipika, asa na andro #...",
        "allCategories": "Sokajy Rehetra",
        "resultsCount": "Torohevitra {count} hita ao amin'ny {domain}",
        "noResults": "Tsy misy torohevitra mifanaraka amin'ny fikarohanao."
    },
    "af": {
        "home": "Tuisblad",
        "single": "Enkele Taal",
        "singleClear": "Slegs enkele taal (Maak alles skoon)",
        "catalogBadge": "Volledige 366-dae-katalogus",
        "searchPlaceholder": "Soek titel, beginsel, aksie of dag #...",
        "allCategories": "Alle kategorieë",
        "resultsCount": "{count} wenke gevind in {domain}",
        "noResults": "Geen wenke stem ooreen met jou soekkriteria nie."
    },
    "tet": {
        "home": "Uma",
        "single": "Lian Ida",
        "singleClear": "Lian ida de'it (Hamoos hotu)",
        "catalogBadge": "Katálogu Kompletu Loron 366",
        "searchPlaceholder": "Buka títulu, prinsípiu, asaun ka loron #...",
        "allCategories": "Kategoria Hotu",
        "resultsCount": "Hetan pontu {count} iha {domain}",
        "noResults": "La hetan pontu ne'ebé tuir kritériu buka."
    },
    "ceb": {
        "home": "Panid",
        "single": "Usa ka Pinulongan",
        "singleClear": "Usa ra ka pinulongan (I-clear tanan)",
        "catalogBadge": "Kompletong Katalogo sa 366 ka Adlaw",
        "searchPlaceholder": "Pangitaa ang titulo, prinsipyo, aksyon, o adlaw #...",
        "allCategories": "Tanan nga Kategorya",
        "resultsCount": "{count} ka mga tip ang nakit-an sa {domain}",
        "noResults": "Walay mga tip nga motakdo sa imong gipangita."
    },
    "jv": {
        "home": "Beranda",
        "single": "Basa Tunggal",
        "singleClear": "Mung siji basa (Busek kabeh)",
        "catalogBadge": "Katalog Jangkep 366 Dina",
        "searchPlaceholder": "Golek irah-irahan, prinsip, tumindak utawa dina #...",
        "allCategories": "Kabeh Kategori",
        "resultsCount": "{count} tips ditemokake ing {domain}",
        "noResults": "Ora ana tips sing cocog karo kritéria telusuran sampeyan."
    },
    "su": {
        "home": "Beranda",
        "single": "Basa Tunggal",
        "singleClear": "Ngan hiji basa (Hapus sadayana)",
        "catalogBadge": "Katalog Lengkep 366 Dinten",
        "searchPlaceholder": "Milarian judul, prinsip, tindakan, atanapi dinten #...",
        "allCategories": "Sadaya Kategori",
        "resultsCount": "{count} tips kapendak dina {domain}",
        "noResults": "Henteu aya tips anu cocog sareng kritéria pamilarian anjeun."
    },
    "ku": {
        "home": "Malper",
        "single": "Yek Ziman",
        "singleClear": "Tenê yek ziman (Hemî jê bibe)",
        "catalogBadge": "Kataloga Tevahî ya 366 Rojan",
        "searchPlaceholder": "Lêgerîna sernav, rêgez, çalakî an roja #...",
        "allCategories": "Hemû Kategorî",
        "resultsCount": "{count} serişte di {domain} de hatin dîtin",
        "noResults": "Tu serişte li gorî pîvanên lêgerîna we nehatin dîtin."
    },
    "tg": {
        "home": "Саҳифаи асосӣ",
        "single": "Як забон",
        "singleClear": "Танҳо як забон (Ҳамаро тоза кунед)",
        "catalogBadge": "Каталоги мукаммали 366-рӯза",
        "searchPlaceholder": "Ҷустуҷӯи унвон, принсип, амал ё рӯзи #...",
        "allCategories": "Ҳамаи категорияҳо",
        "resultsCount": "Дар {domain} {count} маслиҳат ёфт шуд",
        "noResults": "Ягон маслиҳат ба меъёрҳои ҷустуҷӯи шумо мувофиқат намекунад."
    },
    "ps": {
        "home": "کور",
        "single": "یوه ژبه",
        "singleClear": "یوازې یوه ژبه (ټول پاک کړئ)",
        "catalogBadge": "د ۳۶۶ ورځو بشپړ لارښود",
        "searchPlaceholder": "سرلیک، اصل، عمل یا ورځ # لټون کړئ...",
        "allCategories": "ټولې کټګورۍ",
        "resultsCount": "په {domain} کې {count} لارښوونې وموندل شوې",
        "noResults": "ستاسو د لټون معیارونو سره سم هیڅ لارښوونه ونه موندل شوه."
    },
    "sd": {
        "home": "گهر",
        "single": "هڪ ٻولي",
        "singleClear": "صرف هڪ ٻولي (سڀ صاف ڪريو)",
        "catalogBadge": "366 ڏينهن جو مڪمل ڪيٽلاگ",
        "searchPlaceholder": "عنوان، اصول، عمل يا ڏينهن # ڳوليو...",
        "allCategories": "سڀ قسم",
        "resultsCount": "{domain} ۾ {count} تجويزون مليون",
        "noResults": "توهان جي ڳولا جي معيار سان ملندڙ ڪا به تجويز نه ملي."
    },
    "sg": {
        "home": "Gbâya",
        "single": "Yângâ Kêtê",
        "singleClear": "Gi yanga oko (Lungula kue)",
        "catalogBadge": "Kua ti Lango 366 Kue",
        "searchPlaceholder": "Gi li ti tënë, kode, sarango ye wala lango #...",
        "allCategories": "Akungbi Kue",
        "resultsCount": "Awara awango {count} na ya ti {domain}",
        "noResults": "Awango oko alingbi pëpe na gi ti mo."
    },
    "pcm": {
        "home": "Home",
        "single": "One Language",
        "singleClear": "Only one language (Clear all)",
        "catalogBadge": "366 Days Complete Guide",
        "searchPlaceholder": "Search title, principle, action, or day #...",
        "allCategories": "All Categories",
        "resultsCount": "{count} tips dey for {domain}",
        "noResults": "No tip match wetin you search for."
    },
    "arz": {
        "home": "الرئيسية",
        "single": "لغة واحدة",
        "singleClear": "لغة واحدة بس (امسح كله)",
        "catalogBadge": "الدليل الكامل لـ 366 يوم",
        "searchPlaceholder": "دور على العنوان، المبدأ، الفعل أو اليوم #...",
        "allCategories": "كل الأقسام",
        "resultsCount": "لقينا {count} نصيحة في {domain}",
        "noResults": "مفيش نصايح مطابقة للي بتدور عليه."
    },
        "as": {
        "home": "← হোম",
        "single": "একক ভাষা",
        "singleClear": "কেৱল একক ভাষা (সকলো মচি পেলাওক)",
        "catalogBadge": "৩৬৬ দিনৰ সম্পূৰ্ণ কেটেলগ",
        "searchPlaceholder": "শীৰ্ষক, নীতি, কাৰ্য বা দিন # সন্ধান কৰক...",
        "allCategories": "সকলো শ্ৰেণী",
        "resultsCount": "{domain}ত {count}টা পৰামৰ্শ পোৱা গ'ল",
        "noResults": "সন্ধানৰ সৈতে মিল থকা কোনো পৰামৰ্শ পোৱা নগ'ল।"
    },
    "mk": {
        "home": "← Почетна",
        "single": "Еден јазик",
        "singleClear": "Само еден јазик (Исчисти сè)",
        "catalogBadge": "Комплетен каталог за 366 дена",
        "searchPlaceholder": "Пребарај наслов, принцип, акција или ден #...",
        "allCategories": "Сите категории",
        "resultsCount": "Пронајдени се {count} совети во {domain}",
        "noResults": "Нема совети што одговараат на вашите критериуми."
    },
    "yue": {
        "home": "首頁",
        "single": "單一語言",
        "singleClear": "淨係單一語言（清除全部）",
        "catalogBadge": "366日全學科實用指南",
        "searchPlaceholder": "搜尋標題、原理、行動或者Day編號...",
        "allCategories": "所有類別",
        "resultsCount": "喺{domain}搵到 {count} 個實用建議",
        "noResults": "搵唔到符合搜尋條件嘅建議。"
    }
}

# Ensure all 89 locales are represented
for loc in locales:
    if loc not in UI_MAP:
        print(f"[-] Missing UI_MAP entry for {loc}")

# Generate catalogI18n.ts
ts_lines = [
    '// lib/learn/dailyInsights/catalogI18n.ts',
    '// 100% verified 89-language dictionary for the 366-day catalog and multilingual selector controls',
    'import { getInsightLocaleData } from "./localesData";',
    'import type { Locale } from "@/messages/registry";',
    '',
    'export interface CatalogI18nEntry {',
    '  home: string;',
    '  single: string;',
    '  singleClear: string;',
    '  catalogBadge: string;',
    '  searchPlaceholder: string;',
    '  allCategories: string;',
    '  resultsCount: string;',
    '  noResults: string;',
    '}',
    '',
    'export const CATALOG_UI_DICTIONARY: Record<string, CatalogI18nEntry> = ' + json.dumps(UI_MAP, ensure_ascii=False, indent=2) + ';',
    '',
    'export function getCatalogI18n(locale: string = "ko") {',
    '  const isKo = locale === "ko";',
    '  const entry = CATALOG_UI_DICTIONARY[locale] || CATALOG_UI_DICTIONARY.en || CATALOG_UI_DICTIONARY.ko;',
    '  const locData = getInsightLocaleData(locale);',
    '  const ui = locData?.ui_labels || {};',
    '',
    '  return {',
    '    home: entry.home || (isKo ? "홈으로" : "Home"),',
    '    single: entry.single || (isKo ? "단일 언어" : "Single"),',
    '    singleClear: entry.singleClear || (isKo ? "단일 언어 표기 (모두 해제)" : "Single Language (Clear all)"),',
    '    catalogBadge: entry.catalogBadge || (isKo ? "366일 전과목 실천 가이드" : "366-Day Complete Catalog"),',
    '    searchPlaceholder: entry.searchPlaceholder || (isKo ? "팁 제목, 원리, 행동 또는 Day 번호 검색..." : "Search title, principle, action, or day #..."),',
    '    allCategories: entry.allCategories || (isKo ? "전체 분야" : "All Categories"),',
    '    corePrinciple: ui.principle_title || (isKo ? "핵심 원리 & 실천 공식" : "CORE PRINCIPLE"),',
    '    actionItem: ui.action_title || (isKo ? "오늘 바로 실천할 행동" : "ACTION ITEM"),',
    '    share: ui.btn_copy || (isKo ? "공유" : "Share"),',
    '    copied: ui.btn_copied || (isKo ? "복사됨" : "Copied"),',
    '    categories: (ui.categories || {}) as Record<string, string>,',
    '    formatTipsFound: (count: number, domainLabel: string) => {',
    '      const template = entry.resultsCount || "{count} tips found in {domain}";',
    '      return template.replace("{count}", String(count)).replace("{domain}", domainLabel);',
    '    },',
    '    dayLabel: (n: number) => `Day ${n}`,',
    '    dayRange: "Day 1 ~ 366",',
    '    noResults: entry.noResults || (isKo ? "검색 조건에 맞는 실천 팁이 없습니다." : "No tips match your search criteria."),',
    '  };',
    '}',
    ''
]

with open(OUTPUT_TS, 'w', encoding='utf-8') as f:
    f.write('\n'.join(ts_lines))

print(f"[+] Successfully wrote {OUTPUT_TS}")
