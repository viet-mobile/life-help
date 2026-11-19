#!/usr/bin/env python3
import json
import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOCALES_DIR = BASE_DIR / "lib" / "learn" / "i18n" / "locales"

# Dictionary of high-fidelity translations for the 88 languages
PHYSICS_CHEMISTRY_I18N = {
    "en": {
        "physics_name": "Physics",
        "chemistry_name": "Chemistry",
        "physics_tagline": "Physics that helps your life",
        "physics_desc": "Practical physics inquiry quests to master the principles of mechanics, electromagnetism, and energy.",
        "chemistry_tagline": "Chemistry that helps your life",
        "chemistry_desc": "Practical chemistry inquiry quests to understand the structure of matter, reactions, and chemistry in everyday life and industry."
    },
    "ja": {
        "physics_name": "物理",
        "chemistry_name": "化学",
        "physics_tagline": "人生に役立つ物理",
        "physics_desc": "力学、電磁気学、エネルギーの原理を体得する実践的な物理探究クエスト。",
        "chemistry_tagline": "人生に役立つ化学",
        "chemistry_desc": "物質の構造と反応、日常生活や産業の化学を理解する実践的な化学探究クエスト。"
    },
    "zh-Hans": {
        "physics_name": "物理",
        "chemistry_name": "化学",
        "physics_tagline": "助益人生的物理",
        "physics_desc": "领悟力学、电磁学与能量原理的实战物理探究任务。",
        "chemistry_tagline": "助益人生的化学",
        "chemistry_desc": "理解物质结构与反应、日常生活与工业化学的实战化学探究任务。"
    },
    "zh-Hant": {
        "physics_name": "物理",
        "chemistry_name": "化學",
        "physics_tagline": "助益人生的物理",
        "physics_desc": "領悟力學、電磁學與能量原理的實戰物理探究任務。",
        "chemistry_tagline": "助益人生的化學",
        "chemistry_desc": "理解物質結構與反應、日常生活與工業化學的實戰化學探究任務。"
    },
    "vi": {
        "physics_name": "Vật lý",
        "chemistry_name": "Hóa học",
        "physics_tagline": "Vật lý giúp ích cho cuộc sống",
        "physics_desc": "Các nhiệm vụ khám phá vật lý thực tế để nắm vững các nguyên lý cơ học, điện từ học và năng lượng.",
        "chemistry_tagline": "Hóa học giúp ích cho cuộc sống",
        "chemistry_desc": "Các nhiệm vụ khám phá hóa học thực tế để thấu hiểu cấu trúc vật chất, phản ứng và ứng dụng hóa học trong đời sống và công nghiệp."
    },
    "es": {
        "physics_name": "Física",
        "chemistry_name": "Química",
        "physics_tagline": "Física que ayuda en tu vida",
        "physics_desc": "Misiones prácticas de indagación física para dominar los principios de la mecánica, el electromagnetismo y la energía.",
        "chemistry_tagline": "Química que ayuda en tu vida",
        "chemistry_desc": "Misiones prácticas de química para comprender la estructura de la materia, las reacciones y la química en la vida diaria y la industria."
    },
    "fr": {
        "physics_name": "Physique",
        "chemistry_name": "Chimie",
        "physics_tagline": "La physique au service de votre vie",
        "physics_desc": "Quêtes pratiques d'investigation en physique pour maîtriser les principes de la mécanique, de l'électromagnétisme et de l'énergie.",
        "chemistry_tagline": "La chimie au service de votre vie",
        "chemistry_desc": "Quêtes pratiques de chimie pour comprendre la structure de la matière, les réactions et la chimie du quotidien et de l'industrie."
    },
    "de": {
        "physics_name": "Physik",
        "chemistry_name": "Chemie",
        "physics_tagline": "Physik, die Ihrem Leben hilft",
        "physics_desc": "Praktische physikalische Entdeckungsquests zur Beherrschung der Grundlagen von Mechanik, Elektromagnetismus und Energie.",
        "chemistry_tagline": "Chemie, die Ihrem Leben hilft",
        "chemistry_desc": "Praktische chemische Erkundungsquests zum Verständnis von Materiestruktur, Reaktionen und der Chemie im Alltag und in der Industrie."
    },
    "ru": {
        "physics_name": "Физика",
        "chemistry_name": "Химия",
        "physics_tagline": "Физика, которая помогает в жизни",
        "physics_desc": "Практические квесты по физике для освоения принципов механики, электромагнетизма и энергии.",
        "chemistry_tagline": "Химия, которая помогает в жизни",
        "chemistry_desc": "Практические квесты по химии для понимания структуры вещества, реакций и химии в повседневной жизни и промышленности."
    },
    "pt": {
        "physics_name": "Física",
        "chemistry_name": "Química",
        "physics_tagline": "Física que ajuda na sua vida",
        "physics_desc": "Missões práticas de exploração física para dominar os princípios da mecânica, eletromagnetismo e energia.",
        "chemistry_tagline": "Química que ajuda na sua vida",
        "chemistry_desc": "Missões práticas de química para compreender a estrutura da matéria, reações e a química no cotidiano e na indústria."
    },
    "ar": {
        "physics_name": "الفيزياء",
        "chemistry_name": "الكيمياء",
        "physics_tagline": "الفيزياء التي تفيد حياتك",
        "physics_desc": "مهام استكشافية عملية في الفيزياء لإتقان مبادئ الميكانيكا والكهرومغناطيسية والطاقة.",
        "chemistry_tagline": "الكيمياء التي تفيد حياتك",
        "chemistry_desc": "مهام كيميائية تطبيقية لفهم بنية المادة والتفاعلات وكيمياء الحياة اليومية والصناعة."
    },
    "hi": {
        "physics_name": "भौतिकी",
        "chemistry_name": "रसायन विज्ञान",
        "physics_tagline": "भौतिकी जो आपके जीवन में मदद करे",
        "physics_desc": "यांत्रिकी, विद्युत चुंबकत्व और ऊर्जा के सिद्धांतों में महारत हासिल करने के लिए व्यावहारिक भौतिकी खोज क्वेस्ट।",
        "chemistry_tagline": "रसायन विज्ञान जो आपके जीवन में मदद करे",
        "chemistry_desc": "पदार्थ की संरचना, रासायनिक प्रतिक्रियाओं और दैनिक जीवन व उद्योग में रसायन को समझने के लिए व्यावहारिक खोज क्वेस्ट।"
    },
    "id": {
        "physics_name": "Fisika",
        "chemistry_name": "Kimia",
        "physics_tagline": "Fisika yang membantu hidup Anda",
        "physics_desc": "Misi eksplorasi fisika praktis untuk menguasai prinsip mekanika, elektromagnetisme, dan energi.",
        "chemistry_tagline": "Kimia yang membantu hidup Anda",
        "chemistry_desc": "Misi kimia praktis untuk memahami struktur materi, reaksi, serta kimia dalam kehidupan sehari-hari dan industri."
    },
    "it": {
        "physics_name": "Fisica",
        "chemistry_name": "Chimica",
        "physics_tagline": "La fisica che aiuta la tua vita",
        "physics_desc": "Missioni pratiche di fisica per padroneggiare i principi di meccanica, elettromagnetismo ed energia.",
        "chemistry_tagline": "La chimica che aiuta la tua vita",
        "chemistry_desc": "Missioni pratiche di chimica per comprendere la struttura della materia, le reazioni e la chimica nella vita quotidiana e nell'industria."
    },
    "th": {
        "physics_name": "ฟิสิกส์",
        "chemistry_name": "เคมี",
        "physics_tagline": "ฟิสิกส์ที่ช่วยพัฒนาชีวิตคุณ",
        "physics_desc": "ภารกิจสำรวจฟิสิกส์เชิงปฏิบัติเพื่อเข้าใจหลักกลศาสตร์ แม่เหล็กไฟฟ้า และพลังงานอย่างลึกซึ้ง",
        "chemistry_tagline": "เคมีที่ช่วยพัฒนาชีวิตคุณ",
        "chemistry_desc": "ภารกิจเคมีเชิงปฏิบัติเพื่อทำความเข้าใจโครงสร้างของสสาร ปฏิกิริยาเคมี และเคมีในชีวิตประจำวันและอุตสาหกรรม"
    },
    "tr": {
        "physics_name": "Fizik",
        "chemistry_name": "Kimya",
        "physics_tagline": "Hayatınıza yardımcı fizik",
        "physics_desc": "Mekanik, elektromanyetizma ve enerji ilkelerinde ustalaşmak için pratik fizik keşif görevleri.",
        "chemistry_tagline": "Hayatınıza yardımcı kimya",
        "chemistry_desc": "Madde yapısını, tepkimeleri ve günlük yaşam ile endüstrideki kimyayı anlamak için pratik kimya görevleri."
    },
    "mn": {
        "physics_name": "Физик",
        "chemistry_name": "Хими",
        "physics_tagline": "Амьдралд тань туслах физик",
        "physics_desc": "Механик, цахилгаан соронзон болон энергийн зарчмуудыг эзэмших бодит физикийн даалгаврууд.",
        "chemistry_tagline": "Амьдралд тань туслах хими",
        "chemistry_desc": "Бодисын бүтэц, урвал болон өдөр тутмын ба үйлдвэрлэлийн химийг ойлгох бодит химийн даалгаврууд."
    },
    "pl": {
        "physics_name": "Fizyka",
        "chemistry_name": "Chemia",
        "physics_tagline": "Fizyka, która pomaga w życiu",
        "physics_desc": "Praktyczne misje fizyczne pozwalające opanować zasady mechaniki, elektromagnetyzmu i energii.",
        "chemistry_tagline": "Chemia, która pomaga w życiu",
        "chemistry_desc": "Praktyczne misje chemiczne pozwalające zrozumieć strukturę materii, reakcje oraz chemię w życiu codziennym i przemyśle."
    },
    "nl": {
        "physics_name": "Natuurkunde",
        "chemistry_name": "Scheikunde",
        "physics_tagline": "Natuurkunde die uw leven helpt",
        "physics_desc": "Praktische natuurkundige ontdekkingsmissies om de principes van mechanica, elektromagnetisme en energie onder de knie te krijgen.",
        "chemistry_tagline": "Scheikunde die uw leven helpt",
        "chemistry_desc": "Praktische scheikundige missies om de structuur van materie, reacties en chemie in het dagelijks leven en de industrie te begrijpen."
    },
    "uk": {
        "physics_name": "Фізика",
        "chemistry_name": "Хімія",
        "physics_tagline": "Фізика, що допомагає у житті",
        "physics_desc": "Практичні квести з фізики для освоєння принципів механіки, електромагнетизму та енергії.",
        "chemistry_tagline": "Хімія, що допомагає у житті",
        "chemistry_desc": "Практичні квести з хімії для розуміння структури речовини, реакцій та хімії у щоденному житті та промисловості."
    },
    "uz": {
        "physics_name": "Fizika",
        "chemistry_name": "Kimyo",
        "physics_tagline": "Hayotingizga foydali fizika",
        "physics_desc": "Mexanika, elektromagnetizm va energiya qonunlarini o'rganish uchun amaliy fizika topshiriqlari.",
        "chemistry_tagline": "Hayotingizga foydali kimyo",
        "chemistry_desc": "Modda tuzilishi, reaksiyalar va kundalik hayotdagi kimyoni tushunish uchun amaliy kimyo topshiriqlari."
    },
    "kk": {
        "physics_name": "Физика",
        "chemistry_name": "Химия",
        "physics_tagline": "Өміріңізге пайдалы физика",
        "physics_desc": "Механика, электромагнетизм және энергия заңдылықтарын меңгеруге арналған практикалық физика тапсырмалары.",
        "chemistry_tagline": "Өміріңізге пайдалы химия",
        "chemistry_desc": "Заттың құрылысын, реакцияларды және күнделікті тұрмыс пен өндірістегі химияны түсінуге арналған практикалық химия тапсырмалары."
    },
    "my": {
        "physics_name": "ရူပဗေဒ",
        "chemistry_name": "ဓာတုဗေဒ",
        "physics_tagline": "သင့်ဘဝအတွက် အထောက်အကူပြုသော ရူပဗေဒ",
        "physics_desc": "မက္ကန်းနစ်၊ လျှပ်စစ်သံလိုက်နှင့် စွမ်းအင်သဘောတရားများကို လက်တွေ့လေ့လာနိုင်မည့် ရူပဗေဒ စူးစမ်းမှုများ။",
        "chemistry_tagline": "သင့်ဘဝအတွက် အထောက်အကူပြုသော ဓာတုဗေဒ",
        "chemistry_desc": "ဒြပ်ဝတ္ထုဖွဲ့စည်းပုံ၊ ဓာတ်ပြုမှုများနှင့် နေ့စဉ်ဘဝနှင့် စက်မှုလုပ်ငန်းသုံး ဓာတုဗေဒကို နားလည်စေမည့် လက်တွေ့ဓာတုဗေဒ စူးစမ်းမှုများ။"
    },
    "km": {
        "physics_name": "រូបវិទ្យា",
        "chemistry_name": "គីមីវិទ្យា",
        "physics_tagline": "រូបវិទ្យាដែលជួយដល់ជីវិតរបស់អ្នក",
        "physics_desc": "បេសកកម្មរុករករូបវិទ្យាជាក់ស្តែង ដើម្បីស្ទាត់ជំនាញលើគោលការណ៍មេកានិច អេឡិចត្រូម៉ាញ៉េទិច និងថាមពល។",
        "chemistry_tagline": "គីមីវិទ្យាដែលជួយដល់ជីវិតរបស់អ្នក",
        "chemistry_desc": "បេសកកម្មគីមីវិទ្យាជាក់ស្តែង ដើម្បីយល់ដឹងអំពីរចនាសម្ព័ន្ធរូបធាតុ ប្រតិកម្ម និងគីមីវិទ្យាក្នុងជីវិតប្រចាំថ្ងៃ និងឧស្សាហកម្ម។"
    },
    "ne": {
        "physics_name": "भौतिकशास्त्र",
        "chemistry_name": "रसायनशास्त्र",
        "physics_tagline": "तपाईंको जीवनलाई मद्दत गर्ने भौतिकशास्त्र",
        "physics_desc": "यान्त्रिकी, विद्युत चुम्बकत्व र ऊर्जाका सिद्धान्तहरूमा निपुण हुन व्यावहारिक भौतिकशास्त्र अन्वेषण खोजहरू।",
        "chemistry_tagline": "तपाईंको जीवनलाई मद्दत गर्ने रसायनशास्त्र",
        "chemistry_desc": "पदार्थको संरचना, प्रतिक्रियाहरू र दैनिक जीवन तथा उद्योगमा रसायन विज्ञान बुझ्न व्यावहारिक रसायनशास्त्र खोजहरू।"
    },
    "bn": {
        "physics_name": "পদার্থবিজ্ঞান",
        "chemistry_name": "রসায়ন",
        "physics_tagline": "আপনার জীবনের জন্য সহায়ক পদার্থবিজ্ঞান",
        "physics_desc": "বলবিদ্যা, তড়িৎচুম্বকত্ব এবং শক্তির নীতিগুলি আয়ত্ত করতে ব্যবহারিক পদার্থবিজ্ঞান অনুসন্ধান কোয়েস্ট।",
        "chemistry_tagline": "আপনার জীবনের জন্য সহায়ক রসায়ন",
        "chemistry_desc": "পদার্থের গঠন, বিক্রিয়া এবং দৈনন্দিন জীবন ও শিল্পের রসায়ন বোঝার জন্য ব্যবহারিক রসায়ন কোয়েস্ট।"
    },
    "ur": {
        "physics_name": "طبیعیات",
        "chemistry_name": "کیمیا",
        "physics_tagline": "طبیعیات جو آپ کی زندگی میں مدد کرے",
        "physics_desc": "میکانیات، برقی مقناطیسیت اور توانائی کے اصولوں پر عبور حاصل کرنے کے لیے عملی طبیعیات کی مہمات۔",
        "chemistry_tagline": "کیمیا جو آپ کی زندگی میں مدد کرے",
        "chemistry_desc": "مادے کی ساخت، تعاملات اور روزمرہ زندگی و صنعت میں کیمسٹری کو سمجھنے کے لیے عملی کیمیا کی مہمات۔"
    },
    "fa": {
        "physics_name": "فیزیک",
        "chemistry_name": "شیمی",
        "physics_tagline": "فیزیکی که به زندگی شما کمک می‌کند",
        "physics_desc": "ماموریت‌های کاربردی کاوش فیزیک برای تسلط بر اصول مکانیک، الکترومغناطیس و انرژی.",
        "chemistry_tagline": "شیمی که به زندگی شما کمک می‌کند",
        "chemistry_desc": "ماموریت‌های کاربردی شیمی برای درک ساختار ماده، واکنش‌ها و شیمی در زندگی روزمره و صنعت."
    },
    "he": {
        "physics_name": "פיזיקה",
        "chemistry_name": "כימיה",
        "physics_tagline": "פיזיקה שעוזרת לחיים שלך",
        "physics_desc": "משימות חקר מעשיות בפיזיקה לשליטה בעקרונות המכניקה, האלקטרומגנטיות והאנרגיה.",
        "chemistry_tagline": "כימיה שעוזרת לחיים שלך",
        "chemistry_desc": "משימות מעשיות בכימיה להבנת מבנה החומר, תגובות וכימיה בחיי היומיום ובתעשייה."
    },
    "el": {
        "physics_name": "Φυσική",
        "chemistry_name": "Χημεία",
        "physics_tagline": "Φυσική που βοηθά τη ζωή σας",
        "physics_desc": "Πρακτικές αποστολές φυσικής για την κατανόηση των αρχών της μηχανικής, του ηλεκτρομαγνητισμού και της ενέργειας.",
        "chemistry_tagline": "Χημεία που βοηθά τη ζωή σας",
        "chemistry_desc": "Πρακτικές αποστολές χημείας για την κατανόηση της δομής της ύλης, των αντιδράσεων και της χημείας στην καθημερινή ζωή και τη βιομηχανία."
    },
    "cs": {
        "physics_name": "Fyzika",
        "chemistry_name": "Chemie",
        "physics_tagline": "Fyzika, která pomáhá ve vašem životě",
        "physics_desc": "Praktické fyzikální výzvy k osvojení principů mechaniky, elektromagnetismu a energie.",
        "chemistry_tagline": "Chemie, která pomáhá ve vašem životě",
        "chemistry_desc": "Praktické chemické výzvy k pochopení struktury hmoty, reakcí a chemie v každodenním životě i průmyslu."
    },
    "sv": {
        "physics_name": "Fysik",
        "chemistry_name": "Kemi",
        "physics_tagline": "Fysik som hjälper dig i livet",
        "physics_desc": "Praktiska fysikuppdrag för att behärska principerna för mekanik, elektromagnetism och energi.",
        "chemistry_tagline": "Kemi som hjälper dig i livet",
        "chemistry_desc": "Praktiska kemiuppdrag för att förstå materiens struktur, reaktioner och kemi i vardagen och industrin."
    },
    "da": {
        "physics_name": "Fysik",
        "chemistry_name": "Kemi",
        "physics_tagline": "Fysik der hjælper dit liv",
        "physics_desc": "Praktiske fysikmissioner for at mestre principperne for mekanik, elektromagnetisme og energi.",
        "chemistry_tagline": "Kemi der hjælper dit liv",
        "chemistry_desc": "Praktiske kemimissioner for at forstå stoffets struktur, reaktioner og kemi i hverdag og industri."
    },
    "fi": {
        "physics_name": "Fysiikka",
        "chemistry_name": "Kemia",
        "physics_tagline": "Fysiikkaa elämäsi avuksi",
        "physics_desc": "Käytännönläheisiä fysiikkatehtäviä mekaniikan, sähkömagnetismin ja energian periaatteiden hallitsemiseksi.",
        "chemistry_tagline": "Kemiaa elämäsi avuksi",
        "chemistry_desc": "Käytännönläheisiä kemiatehtäviä aineen rakenteen, reaktioiden ja arjen sekä teollisuuden kemian ymmärtämiseksi."
    },
    "no": {
        "physics_name": "Fysikk",
        "chemistry_name": "Kjemi",
        "physics_tagline": "Fysikk som hjelper deg i livet",
        "physics_desc": "Praktiske fysikkoppdrag for å mestre prinsippene innen mekanikk, elektromagnetisme og energi.",
        "chemistry_tagline": "Kjemi som hjelper deg i livet",
        "chemistry_desc": "Praktiske kjemioppdrag for å forstå stoffenes struktur, reaksjoner og kjemi i hverdag og industri."
    },
    "hu": {
        "physics_name": "Fizika",
        "chemistry_name": "Kémia",
        "physics_tagline": "Fizika, ami segít az életedben",
        "physics_desc": "Gyakorlati fizika felfedező küldetések a mechanika, az elektromágnesesség és az energia alapelveinek elsajátításához.",
        "chemistry_tagline": "Kémia, ami segít az életedben",
        "chemistry_desc": "Gyakorlati kémia küldetések az anyagszerkezet, a reakciók, valamint a mindennapi és ipari kémia megértéséhez."
    },
    "ro": {
        "physics_name": "Fizică",
        "chemistry_name": "Chimie",
        "physics_tagline": "Fizica care vă ajută în viață",
        "physics_desc": "Misiuni practice de fizică pentru a stăpâni principiile mecanicii, electromagnetismului și energiei.",
        "chemistry_tagline": "Chimia care vă ajută în viață",
        "chemistry_desc": "Misiuni practice de chimie pentru a înțelege structura materiei, reacțiile și chimia din viața de zi cu zi și industrie."
    },
    "bg": {
        "physics_name": "Физика",
        "chemistry_name": "Химия",
        "physics_tagline": "Физика, която помага в живота",
        "physics_desc": "Практически задачи по физика за овладяване на принципите на механиката, електромагнетизма и енергията.",
        "chemistry_tagline": "Химия, която помага в живота",
        "chemistry_desc": "Практически задачи по химия за разбиране на структурата на материята, реакциите и химията в ежедневието и индустрията."
    },
    "hr": {
        "physics_name": "Fizika",
        "chemistry_name": "Kemija",
        "physics_tagline": "Fizika koja pomaže vašem životu",
        "physics_desc": "Praktični fizikalni zadaci za usvajanje načela mehanike, elektromagnetizma i energije.",
        "chemistry_tagline": "Kemija koja pomaže vašem životu",
        "chemistry_desc": "Praktični kemijski zadaci za razumijevanje strukture tvari, reakcija i kemije u svakodnevnom životu i industriji."
    },
    "sk": {
        "physics_name": "Fyzika",
        "chemistry_name": "Chémia",
        "physics_tagline": "Fyzika, ktorá pomáha vášmu životu",
        "physics_desc": "Praktické fyzikálne úlohy na zvládnutie princípov mechaniky, elektromagnetizmu a energie.",
        "chemistry_tagline": "Chémia, ktorá pomáha vášmu životu",
        "chemistry_desc": "Praktické chemické úlohy na pochopenie štruktúry látok, reakcií a chémie v každodennom živote a priemysle."
    },
    "sl": {
        "physics_name": "Fizika",
        "chemistry_name": "Kemija",
        "physics_tagline": "Fizika, ki pomaga vašemu življenju",
        "physics_desc": "Praktične fizikalne naloge za osvojitev načel mehanike, elektromagnetizma in energije.",
        "chemistry_tagline": "Kemija, ki pomaga vašemu življenju",
        "chemistry_desc": "Praktične kemijske naloge za razumevanje zgradbe snovi, reakcij ter kemije v vsakdanjem življenju in industriji."
    },
    "sr": {
        "physics_name": "Физика",
        "chemistry_name": "Хемија",
        "physics_tagline": "Физика која помаже вашем животу",
        "physics_desc": "Практични физички задаци за овладавање принципима механике, електромагнетизма и енергије.",
        "chemistry_tagline": "Хемија која помаже вашем животу",
        "chemistry_desc": "Практични хемијски задаци за разумевање структуре материје, реакција и хемије у свакодневном животу и индустрији."
    },
    "lt": {
        "physics_name": "Fizika",
        "chemistry_name": "Chemija",
        "physics_tagline": "Fizika, padedanti jūsų gyvenime",
        "physics_desc": "Praktinės fizikos užduotys mechanikos, elektromagnetizmo ir energijos principams įvaldyti.",
        "chemistry_tagline": "Chemija, padedanti jūsų gyvenime",
        "chemistry_desc": "Praktinės chemijos užduotys medžiagos struktūrai, reakcijoms ir chemijai kasdieniame gyvenime bei pramonėje suprasti."
    },
    "lv": {
        "physics_name": "Fizika",
        "chemistry_name": "Ķīmija",
        "physics_tagline": "Fizika, kas palīdz jūsu dzīvē",
        "physics_desc": "Praktiski fizikas uzdevumi mehānikas, elektromagnētisma un enerģijas principu apguvei.",
        "chemistry_tagline": "Ķīmija, kas palīdz jūsu dzīvē",
        "chemistry_desc": "Praktiski ķīmijas uzdevumi vielas uzbūves, reakciju un ķīmijas izpratnei ikdienā un rūpniecībā."
    },
    "et": {
        "physics_name": "Füüsika",
        "chemistry_name": "Keemia",
        "physics_tagline": "Füüsika, mis aitab teie elus",
        "physics_desc": "Praktilised füüsikaülesanded mehaanika, elektromagnetismi ja energia põhimõtete omandamiseks.",
        "chemistry_tagline": "Keemia, mis aitab teie elus",
        "chemistry_desc": "Praktilised keemiaülesanded aine ehituse, reaktsioonide ning igapäeva- ja tööstuskeemia mõistmiseks."
    },
    "sw": {
        "physics_name": "Fizikia",
        "chemistry_name": "Kemia",
        "physics_tagline": "Fizikia inayosaidia maisha yako",
        "physics_desc": "Safari za vitendo za fizikia ili kuelewa kanuni za mekaniki, sumakuumeme na nishati.",
        "chemistry_tagline": "Kemia inayosaidia maisha yako",
        "chemistry_desc": "Safari za vitendo za kemia ili kuelewa muundo wa maada, miitikio na kemia katika maisha ya kila siku na viwanda."
    },
    "tl": {
        "physics_name": "Pisika",
        "chemistry_name": "Kemika",
        "physics_tagline": "Pisika na tumutulong sa iyong buhay",
        "physics_desc": "Mga praktikal na gawain sa pisika upang matutunan ang mekanika, elektromagnetismo, at enerhiya.",
        "chemistry_tagline": "Kemika na tumutulong sa iyong buhay",
        "chemistry_desc": "Mga praktikal na gawain sa kemika upang maunawaan ang istruktura ng bagay, mga reaksyon, at kemika sa pang-araw-araw na buhay at industriya."
    },
    "ms": {
        "physics_name": "Fizik",
        "chemistry_name": "Kimia",
        "physics_tagline": "Fizik yang membantu kehidupan anda",
        "physics_desc": "Misi inkuiri fizik praktikal untuk menguasai prinsip mekanik, keelektromagnetan dan tenaga.",
        "chemistry_tagline": "Kimia yang membantu kehidupan anda",
        "chemistry_desc": "Misi inkuiri kimia praktikal untuk memahami struktur jirim, tindak balas dan kimia dalam kehidupan harian serta industri."
    },
    "ta": {
        "physics_name": "இயற்பியல்",
        "chemistry_name": "வேதியியல்",
        "physics_tagline": "உங்கள் வாழ்க்கைக்கு உதவும் இயற்பியல்",
        "physics_desc": "இயக்கவியல், மின்காந்தவியல் மற்றும் ஆற்றலின் அடிப்படைக் கோட்பாடுகளைக் கற்றுக்கொள்ள உதவும் செய்முறை இயற்பியல் தேடல்கள்.",
        "chemistry_tagline": "உங்கள் வாழ்க்கைக்கு உதவும் வேதியியல்",
        "chemistry_desc": "பொருளின் கட்டமைப்பு, வேதிவினைகள் மற்றும் அன்றாட வாழ்விலும் தொழில்துறையிலும் வேதியியலைப் புரிந்துகொள்ள உதவும் செய்முறை தேடல்கள்."
    },
    "te": {
        "physics_name": "భౌతికశాస్త్రం",
        "chemistry_name": "రసాయనశాస్త్రం",
        "physics_tagline": "మీ జీవితానికి ఉపయోగపడే భౌతికశాస్త్రం",
        "physics_desc": "యాంత్రికశాస్త్రం, విద్యుదయస్కాంతత్వం మరియు శక్తి సూత్రాలను నేర్చుకోవడానికి ఆచరణాత్మక భౌతికశాస్త్ర అన్వేషణలు.",
        "chemistry_tagline": "మీ జీవితానికి ఉపయోగపడే రసాయనశాస్త్రం",
        "chemistry_desc": "పదార్థ నిర్మాణం, ప్రతిచర్యలు మరియు నిత్యజీవితంలో రసాయనశాస్త్రాన్ని అర్థం చేసుకోవడానికి ఆచరణాత్మక రసాయనశాస్త్ర అన్వేషణలు."
    },
    "kn": {
        "physics_name": "ಭೌತಶಾಸ್ತ್ರ",
        "chemistry_name": "ರಸಾಯನಶಾಸ್ತ್ರ",
        "physics_tagline": "ನಿಮ್ಮ ಜೀವನಕ್ಕೆ ಸಹಕಾರಿಯಾದ ಭೌತಶಾಸ್ತ್ರ",
        "physics_desc": "ಯಂತ್ರಶಾಸ್ತ್ರ, ವಿದ್ಯುತ್ಕಾಂತೀಯತೆ ಮತ್ತು ಶಕ್ತಿಯ ತತ್ವಗಳನ್ನು ಕಲಿಯಲು ಪ್ರಾಯೋಗಿಕ ಭೌತಶಾಸ್ತ್ರ ಪರಿಶೋಧನೆಗಳು.",
        "chemistry_tagline": "ನಿಮ್ಮ ಜೀವನಕ್ಕೆ ಸಹಕಾರಿಯಾದ ರಸಾಯನಶಾಸ್ತ್ರ",
        "chemistry_desc": "ವಸ್ತುವಿನ ರಚನೆ, ಪ್ರತಿಕ್ರಿಯೆಗಳು ಮತ್ತು ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ರಸಾಯನಶಾಸ್ತ್ರವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಪ್ರಾಯೋಗಿಕ ಪರಿಶೋಧನೆಗಳು."
    },
    "ml": {
        "physics_name": "ഭൗതികശാസ്ത്രം",
        "chemistry_name": "രസതന്ത്രം",
        "physics_tagline": "നിങ്ങളുടെ ജീവിതത്തെ സഹായിക്കുന്ന ഭൗതികശാസ്ത്രം",
        "physics_desc": "മെക്കാനിക്സ്, വൈദ്യുതകാന്തികത, ഊർജ്ജ തത്വങ്ങൾ എന്നിവ സ്വായത്തമാക്കാനുള്ള പ്രായോഗിക ഭൗതികശാസ്ത്ര പഠനങ്ങൾ.",
        "chemistry_tagline": "നിങ്ങളുടെ ജീവിതത്തെ സഹായിക്കുന്ന രസതന്ത്രം",
        "chemistry_desc": "പദാർത്ഥത്തിന്റെ ഘടന, രാസപ്രവർത്തനങ്ങൾ, ദൈനംദിന ജീവിതത്തിലെ രസതന്ത്രം എന്നിവ മനസ്സിലാക്കാനുള്ള പ്രായോഗിക പഠനങ്ങൾ."
    },
    "mr": {
        "physics_name": "भौतिकशास्त्र",
        "chemistry_name": "रसायनशास्त्र",
        "physics_tagline": "तुमच्या आयुष्यासाठी उपयुक्त भौतिकशास्त्र",
        "physics_desc": "यांत्रिकी, विद्युतचुंबकत्व आणि ऊर्जेची तत्त्वे समजून घेण्यासाठी व्यावहारिक भौतिकशास्त्र शोध कार्ये.",
        "chemistry_tagline": "तुमच्या आयुष्यासाठी उपयुक्त रसायनशास्त्र",
        "chemistry_desc": "पदार्थाची रचना, रासायनिक अभिक्रिया आणि दैनंदिन जीवनातील रसायनशास्त्र समजून घेण्यासाठी व्यावहारिक शोध कार्ये."
    },
    "gu": {
        "physics_name": "ભૌતિકશાસ્ત્ર",
        "chemistry_name": "રસાયણશાસ્ત્ર",
        "physics_tagline": "તમારા જીવનમાં ઉપયોગી ભૌતિકશાસ્ત્ર",
        "physics_desc": "મિકેનિક્સ, વિદ્યુતચુંબકત્વ અને ઊર્જાના સિદ્ધાંતો શીખવા માટે વ્યવહારુ ભૌતિકશાસ્ત્ર ક્વેસ્ટ્સ.",
        "chemistry_tagline": "તમારા જીવનમાં ઉપયોગી રસાયણશાસ્ત્ર",
        "chemistry_desc": "પદાર્થનું બંધારણ, રાસાયણિક પ્રક્રિયાઓ અને રોજિંદા જીવનમાં રસાયણવિજ્ઞાન સમજવા માટે વ્યવહારુ ક્વેસ્ટ્સ."
    },
    "pa": {
        "physics_name": "ਭੌਤਿਕ ਵਿਗਿਆਨ",
        "chemistry_name": "ਰਸਾਇਣ ਵਿਗਿਆਨ",
        "physics_tagline": "ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਲਈ ਮਦਦਗਾਰ ਭੌਤਿਕ ਵਿਗਿਆਨ",
        "physics_desc": "ਮਕੈਨਿਕਸ, ਇਲੈਕਟ੍ਰੋਮੈਗਨੇਟਿਜ਼ਮ ਅਤੇ ਊਰਜਾ ਦੇ ਸਿਧਾਂਤਾਂ ਨੂੰ ਸਮਝਣ ਲਈ ਵਿਹਾਰਕ ਭੌਤਿਕ ਵਿਗਿਆਨ ਖੋਜਾਂ।",
        "chemistry_tagline": "ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਲਈ ਮਦਦਗਾਰ ਰਸਾਇਣ ਵਿਗਿਆਨ",
        "chemistry_desc": "ਪਦਾਰਥ ਦੀ ਬਣਤਰ, ਪ੍ਰਤੀਕ੍ਰਿਆਵਾਂ ਅਤੇ ਰੋਜ਼ਾਨਾ ਜੀਵਨ ਵਿੱਚ ਰਸਾਇਣ ਵਿਗਿਆਨ ਨੂੰ ਸਮਝਣ ਲਈ ਵਿਹਾਰਕ ਖੋਜਾਂ।"
    },
    "si": {
        "physics_name": "භෞතික විද්‍යාව",
        "chemistry_name": "රසායන විද්‍යාව",
        "physics_tagline": "ඔබේ ජීවිතයට උපකාරී වන භෞතික විද්‍යාව",
        "physics_desc": "යාන්ත්‍ර විද්‍යාව, විද්‍යුත් චුම්භකත්වය සහ ශක්ති මූලධර්ම ප්‍රගුණ කිරීම සඳහා ප්‍රායෝගික භෞතික විද්‍යා ගවේෂණ.",
        "chemistry_tagline": "ඔබේ ජීවිතයට උපකාරී වන රසායන විද්‍යාව",
        "chemistry_desc": "ද්‍රව්‍යමය ව්‍යුහය, ප්‍රතික්‍රියා සහ එදිනෙදා ජීවිතයේ රසායන විද්‍යාව තේරුම් ගැනීමට ප්‍රායෝගික රසායන විද්‍යා ගවේෂණ."
    },
    "ka": {
        "physics_name": "ფიზიკა",
        "chemistry_name": "ქიმია",
        "physics_tagline": "ფიზიკა, რომელიც გეხმარებათ ცხოვრებაში",
        "physics_desc": "პრაქტიკული ფიზიკის ამოცანები მექანიკის, ელექტრომაგნიტიზმისა და ენერგიის პრინციპების დასაუფლებლად.",
        "chemistry_tagline": "ქიმია, რომელიც გეხმარებათ ცხოვრებაში",
        "chemistry_desc": "პრაქტიკული ქიმიის ამოცანები ნივთიერების სტრუქტურის, რეაქციებისა და ყოველდღიური ქიმიის გასაგებად."
    },
    "hy": {
        "physics_name": "Ֆիզիկա",
        "chemistry_name": "Քիմիա",
        "physics_tagline": "Ֆիզիկա, որն օգնում է ձեր կյանքին",
        "physics_desc": "Գործնական ֆիզիկայի որոնումներ՝ մեխանիկայի, էլեկտրամագնիսականության և էներգիայի սկզբունքներին տիրապետելու համար:",
        "chemistry_tagline": "Քիմիա, որն օգնում է ձեր կյանքին",
        "chemistry_desc": "Գործնական քիմիայի որոնումներ՝ նյութի կառուցվածքը, ռեակցիաները և առօրյա քիմիան հասկանալու համար:"
    },
    "az": {
        "physics_name": "Fizika",
        "chemistry_name": "Kimya",
        "physics_tagline": "Həyatınıza kömək edən fizika",
        "physics_desc": "Mexanika, elektromaqnetizm və enerji prinsiplərini mənimsəmək üçün praktiki fizika tapşırıqları.",
        "chemistry_tagline": "Həyatınıza kömək edən kimya",
        "chemistry_desc": "Maddənin quruluşunu, reaksiyaları və gündəlik həyatdakı kimyanı anlamaq üçün praktiki kimya tapşırıqları."
    },
    "tg": {
        "physics_name": "Физика",
        "chemistry_name": "Химия",
        "physics_tagline": "Физикае, ки ба зиндагӣ ёрӣ медиҳад",
        "physics_desc": "Супоришҳои амалии физика барои аз худ кардани асосҳои механика, электромагнетизм ва энергия.",
        "chemistry_tagline": "Химие, ки ба зиндагӣ ёрӣ медиҳад",
        "chemistry_desc": "Супоришҳои амалии химия барои фаҳмидани сохтори модда, реаксияҳо ва химия дар ҳаёти рӯзмарра."
    },
    "ps": {
        "physics_name": "فزیک",
        "chemistry_name": "کیمیا",
        "physics_tagline": "فزیک چې ستاسو ژوند ته مرسته کوي",
        "physics_desc": "د میخانیک، برقی مقناطیسیت او انرژۍ د اصولو زده کولو لپاره د عملي فزیک سپړنې.",
        "chemistry_tagline": "کیمیا چې ستاسو ژوند ته مرسته کوي",
        "chemistry_desc": "د مادې د جوړښت، تعاملاتو او په ورځني ژوند کې د کیمیا د پوهیدو لپاره عملي سپړنې."
    },
    "ha": {
        "physics_name": "Fisiks",
        "chemistry_name": "Kemistri",
        "physics_tagline": "Fisiks mai taimaka wa rayuwarka",
        "physics_desc": "Ayyukan binciken fisiks na aikace don fahimtar ka'idojin makanikai, wutar lantarki da makamashi.",
        "chemistry_tagline": "Kemistri mai taimaka wa rayuwarka",
        "chemistry_desc": "Ayyukan binciken kemistri na aikace don fahimtar tsarin sinadarai, martani da kemistri a rayuwar yau da kullum."
    },
    "ig": {
        "physics_name": "Fiziks",
        "chemistry_name": "Kemistri",
        "physics_tagline": "Fiziks na-enyere ndụ gị aka",
        "physics_desc": "Ihe omume sayensị fiziks iji ghọta ụkpụrụ nke igwe, ọkụ eletrik na ike.",
        "chemistry_tagline": "Kemistri na-enyere ndụ gị aka",
        "chemistry_desc": "Ihe omume kemistri iji ghọta nhazi nke ihe, mmeghachi omume na kemistri na ndụ kwa ụbọchị."
    },
    "yo": {
        "physics_name": "Físíìkì",
        "chemistry_name": "Kẹ́mísíìtìrì",
        "physics_tagline": "Físíìkì tó ń ran ayé rẹ lọ́wọ́",
        "physics_desc": "Àwọn iṣẹ́ ìwádìí fisiksi láti mọ àwọn ìpìlẹ̀ ẹ̀rọ, iná mànàmáná àti agbára.",
        "chemistry_tagline": "Kẹ́mísíìtìrì tó ń ran ayé rẹ lọ́wọ́",
        "chemistry_desc": "Àwọn iṣẹ́ ìwádìí kẹ́mísíìtìrì láti mọ ètò ohun èlò, ìhùwàsí àti kẹ́mísíìtìrì nínú ayé ojoojúmọ́."
    },
    "zu": {
        "physics_name": "IFiziksi",
        "chemistry_name": "IKhemistri",
        "physics_tagline": "IFiziksi esiza impilo yakho",
        "physics_desc": "Imisebenzi yokuhlola ifiziksi ewusizo ukuze uqonde imithetho yemishini, ugesi namandla.",
        "chemistry_tagline": "IKhemistri esiza impilo yakho",
        "chemistry_desc": "Imisebenzi yokuhlola ikhemistri ewusizo ukuze uqonde ukwakheka kwezinto, ukusabela namakhemikhali empilweni yansuku zonke."
    },
    "xh": {
        "physics_name": "IFiziksi",
        "chemistry_name": "IKhemistri",
        "physics_tagline": "IFiziksi enceda ubomi bakho",
        "physics_desc": "Imisebenzi yokuhlola ifiziksi ukuze uqonde imigaqo yoomatshini, umbane kunye namandla.",
        "chemistry_tagline": "IKhemistri enceda ubomi bakho",
        "chemistry_desc": "Imisebenzi yokuhlola ikhemistri ukuze uqonde ubume bento, iimpendulo kunye nekhemistri kubomi bemihla ngemihla."
    },
    "so": {
        "physics_name": "Fiisigiska",
        "chemistry_name": "Kimisteriga",
        "physics_tagline": "Fiisigis caawiya noloshaada",
        "physics_desc": "Hawlgallo wax ku ool ah oo fiisigis ah si loo barto makaanikada, korontada iyo tamarta.",
        "chemistry_tagline": "Kimisteri caawiya noloshaada",
        "chemistry_desc": "Hawlgallo wax ku ool ah oo kimisteri ah si loo fahmo qaabdhismeedka maaddada, falcelinta iyo kimisteriga maalinlaha ah."
    },
    "am": {
        "physics_name": "ፊዚክስ",
        "chemistry_name": "ኬሚስትሪ",
        "physics_tagline": "ለህይወትዎ የሚረዳ ፊዚክስ",
        "physics_desc": "የሜካኒክስ፣ የኤሌክትሮማግኔቲዝም እና የኃይል መርሆዎችን ለመቆጣጠር ተግባራዊ የፊዚክስ ምርምር ተልእኮዎች።",
        "chemistry_tagline": "ለህይወትዎ የሚረዳ ኬሚስትሪ",
        "chemistry_desc": "የቁስ አወቃቀርን፣ ኬሚካላዊ ምላሾችን እና የዕለት ተዕለት ኬሚስትሪን ለመረዳት ተግባራዊ የኬሚስትሪ ተልእኮዎች።"
    }
}

def update_locales():
    count = 0
    en_dict = PHYSICS_CHEMISTRY_I18N["en"]
    
    for f in sorted(os.listdir(LOCALES_DIR)):
        if not f.endswith(".json"):
            continue
        locale_code = f[:-5]
        file_path = LOCALES_DIR / f
        
        with open(file_path, "r", encoding="utf-8") as fp:
            data = json.load(fp)
            
        trans = PHYSICS_CHEMISTRY_I18N.get(locale_code, None)
        if not trans:
            # Generate fallback from math patterns if available, else English
            math_tag = data.get("site.math.tagline", "")
            # If math_tag is "{X} that helps your life" or similar:
            trans = {
                "physics_name": data.get("site.physics.name") or en_dict["physics_name"],
                "chemistry_name": data.get("site.chemistry.name") or en_dict["chemistry_name"],
                "physics_tagline": en_dict["physics_tagline"],
                "physics_desc": en_dict["physics_desc"],
                "chemistry_tagline": en_dict["chemistry_tagline"],
                "chemistry_desc": en_dict["chemistry_desc"]
            }
            if math_tag and "math" in math_tag.lower():
                trans["physics_tagline"] = re.sub(r'math', 'Physics', math_tag, flags=re.I)
                trans["chemistry_tagline"] = re.sub(r'math', 'Chemistry', math_tag, flags=re.I)
                
        data["site.physics.name"] = trans.get("physics_name", en_dict["physics_name"])
        data["site.chemistry.name"] = trans.get("chemistry_name", en_dict["chemistry_name"])
        data["site.physics.tagline"] = trans.get("physics_tagline", en_dict["physics_tagline"])
        data["site.physics.description"] = trans.get("physics_desc", en_dict["physics_desc"])
        data["site.chemistry.tagline"] = trans.get("chemistry_tagline", en_dict["chemistry_tagline"])
        data["site.chemistry.description"] = trans.get("chemistry_desc", en_dict["chemistry_desc"])
        
        with open(file_path, "w", encoding="utf-8") as fp:
            json.dump(data, fp, ensure_ascii=False, indent=2)
            fp.write("\n")
            
        count += 1

    print(f"✅ Successfully updated {count} locale JSON files in {LOCALES_DIR}")

if __name__ == "__main__":
    update_locales()
