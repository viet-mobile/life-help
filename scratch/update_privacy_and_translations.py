import json
import os

MESSAGES_DIR = "messages"

# 1. New Privacy Content for all 38 languages (050 sentence completely deleted, no phone number collected, contact via website or LIFE.HELP app)
PRIVACY_TRANSLATIONS = {
    "ko": {
        "title": "개인정보 보호 안내",
        "content": "저희 회사는 고객님의 사생활 보호를 위해 고객의 성함과 주소, 전화번호를 따로 저장하지 않으며 휴대폰 번호를 기입받지 않습니다. 고객님과 헬퍼님은 본 웹사이트나 LIFE.HELP 앱을 통하여 안전하게 연락합니다. 고객님께서 저희 서비스를 사용하신 이력은 고객님의 기기에만 저장되며, 고객님이 기기를 변경하시는 경우에는 기존 기기에 저장된 사용 이력은 새로운 기기로 이전되지 않을 수 있습니다."
    },
    "en": {
        "title": "Privacy Notice",
        "content": "To protect your privacy, our company does not store your name, address, or phone number, and we do not collect mobile phone numbers. Customers and helpers connect safely through this website or the LIFE.HELP app. Your service usage history is stored only on your device, and if you change devices, the usage history on your previous device may not be transferred to the new device."
    },
    "vi": {
        "title": "Thông báo về bảo vệ thông tin cá nhân",
        "content": "Để bảo vệ quyền riêng tư của quý khách, công ty chúng tôi không lưu trữ riêng tên, địa chỉ hay số điện thoại và không yêu cầu nhập số điện thoại di động. Quý khách và người hỗ trợ liên lạc an toàn thông qua trang web này hoặc ứng dụng LIFE.HELP. Lịch sử sử dụng dịch vụ chỉ được lưu trên thiết bị của quý khách; nếu đổi thiết bị, lịch sử lưu trên thiết bị cũ có thể không được chuyển sang thiết bị mới."
    },
    "zh-Hans": {
        "title": "个人信息保护说明",
        "content": "为了保护您的隐私，我司不单独储存您的姓名、地址与电话号码，且不收集手机号码。客户与服务助手通过本网站或LIFE.HELP应用程序安全联系。您的服务使用记录仅保存在您的设备中，更换设备时原设备上的使用记录可能无法迁移至新设备。"
    },
    "zh-Hant": {
        "title": "個人隱私保護說明",
        "content": "為保護您的隱私，本公司不單獨儲存您的姓名、地址與電話號碼，亦不收集手機號碼。客戶與服務助手透過本網站或LIFE.HELP應用程式安全聯絡。您的服務使用記錄僅保存在您的設備中，更換設備時原設備的使用記錄可能無法轉移至新設備。"
    },
    "mn": {
        "title": "Хувийн мэдээллийн нууцлалын мэдэгдэл",
        "content": "Бид таны хувийн нууцыг хамгаалах үүднээс нэр, хаяг, утасны дугаарыг тусад нь хадгалдаггүй бөгөөд гар утасны дугаар авдаггүй. Хэрэглэгч болон туслагч нь энэхүү вэбсайт эсвэл LIFE.HELP аппликейшнээр дамжуулан аюулгүй холбогдоно. Үйлчилгээ ашигласан түүх зөвхөн таны төхөөрөмж дээр хадгалагдах бөгөөд төхөөрөмжөө сольсон тохиолдолд хуучин төхөөрөмжийн түүх шинэ төхөөрөмж рүү шилжихгүй байж болзошгүй."
    },
    "ru": {
        "title": "Защита персональных данных",
        "content": "В целях защиты вашей конфиденциальности мы не сохраняем ваши имя, адрес или номер телефона и не запрашиваем номер мобильного телефона. Клиенты и помощники безопасно общаются через данный веб-сайт или приложение LIFE.HELP. История использования услуг сохраняется исключительно на вашем устройстве и при его смене не переносится на новое устройство."
    },
    "uz": {
        "title": "Shaxsiy ma'lumotlarni himoya qilish",
        "content": "Maxfiyligingizni ta'minlash maqsadida kompaniyamiz ismingiz, manzilingiz yoki telefon raqamingizni alohida saqlamaydi va mobil telefon raqamini talab qilmaydi. Mijozlar va yordamchilar ushbu veb-sayt yoki LIFE.HELP ilovasi orqali xavfsiz bog'lanishadi. Xizmatdan foydalanish tarixi faqat qurilmangizda saqlanadi va qurilmani almashtirsangiz, yangi qurilmaga o'tkazilmasligi mumkin."
    },
    "ne": {
        "title": "व्यक्तिगत गोपनीयता सूचना",
        "content": "तपाईंको गोपनीयताको रक्षा गर्न, हाम्रो कम्पनीले तपाईंको नाम, ठेगाना वा फोन नम्बर अलग रूपमा भण्डारण गर्दैन र मोबाइल नम्बर संकलन गर्दैन। ग्राहक र सहयोगी यस वेबसाइट वा LIFE.HELP एप मार्फत सुरक्षित रूपमा सम्पर्क गर्दछन्। सेवा उपयोग इतिहास केवल तपाईंको उपकरणमा भण्डारण गरिन्छ र उपकरण परिवर्तन गर्दा नयाँ उपकरणमा स्थानान्तरण नहुन सक्छ।"
    },
    "hi": {
        "title": "व्यक्तिगत डेटा गोपनीयता सूचना",
        "content": "आपकी गोपनीयता की सुरक्षा के लिए, हमारी कंपनी आपका नाम, पता या फ़ोन नंबर अलग से संग्रहीत नहीं करती है और मोबाइल नंबर नहीं लेती है। ग्राहक और सहायक इस वेबसाइट या LIFE.HELP ऐप के माध्यम से सुरक्षित रूप से संपर्क करते हैं। सेवा उपयोग इतिहास केवल आपके डिवाइस पर सहेजा जाता है और डिवाइस बदलने पर यह नए डिवाइस में स्थानांतरित नहीं हो सकता है।"
    },
    "km": {
        "title": "ការការពារព័ត៌មានផ្ទាល់ខ្លួន",
        "content": "ដើម្បីការពារភាពឯកជនរបស់អ្នក ក្រុមហ៊ុនយើងមិនរក្សាទុកឈ្មោះ អាសយដ្ឋាន ឬលេខទូរស័ព្ទរបស់អ្នកដោយឡែកទេ ហើយមិនប្រមូលលេខទូរស័ព្ទដៃឡើយ។ អតិថិជន និងអ្នកជំនួយការទាក់ទងគ្នាដោយសុវត្ថិភាពតាមរយៈគេហទំព័រនេះ ឬកម្មវិធី LIFE.HELP។ ប្រវត្តិនៃការប្រើប្រាស់សេវាកម្មត្រូវបានរក្សាទុកតែនៅលើឧបករណ៍របស់អ្នកប៉ុណ្ណោះ ហើយប្រសិនបើអ្នកផ្លាស់ប្តូរឧបករណ៍ វាមិនអាចផ្ទេរទៅឧបករណ៍ថ្មីបានទេ។"
    },
    "th": {
        "title": "ประกาศการคุ้มครองข้อมูลส่วนบุคคล",
        "content": "เพื่อปกป้องความเป็นส่วนตัวของคุณ บริษัทของเราไม่จัดเก็บชื่อ ที่อยู่ หรือหมายเลขโทรศัพท์ของคุณแยกต่างหาก และไม่มีการขอเก็บหมายเลขโทรศัพท์มือถือ ลูกค้าและผู้ช่วยติดต่อสื่อสารกันอย่างปลอดภัยผ่านเว็บไซต์นี้หรือแอป LIFE.HELP ประวัติการใช้บริการจะถูกบันทึกไว้ในอุปกรณ์ของคุณเท่านั้น และหากคุณเปลี่ยนอุปกรณ์ ประวัติการใช้งานจะไม่ถูกโอนไปยังอุปกรณ์เครื่องใหม่"
    },
    "my": {
        "title": "ကိုယ်ရေးကိုယ်တာ အချက်အလက် ကာကွယ်ရေး အသိပေးချက်",
        "content": "သင်၏ ကိုယ်ရေးကိုယ်တာ လုံခြုံမှုကို ကာကွယ်ရန် ကျွန်ုပ်တို့ကုမ္ပဏီသည် သင်၏ အမည်၊ လိပ်စာနှင့် ဖုန်းနံပါတ်ကို သီးခြားသိမ်းဆည်းထားခြင်းမရှိသလို မိုဘိုင်းဖုန်းနံပါတ်ကိုလည်း တောင်းခံခြင်းမရှိပါ။ သုံးစွဲသူနှင့် အကူအညီပေးသူသည် ဤဝက်ဘ်ဆိုက် သို့မဟုတ် LIFE.HELP အက်ပ်မှတစ်ဆင့် လုံခြုံစွာ ဆက်သွယ်ပါသည်။ ဝန်ဆောင်မှုအသုံးပြုမှုမှတ်တမ်းကို သင့်စက်ပစ္စည်းပေါ်တွင်သာ သိမ်းဆည်းထားပြီး စက်ပစ္စည်းပြောင်းလဲပါက စက်အသစ်သို့ လွှဲပြောင်းနိုင်မည်မဟုတ်ပါ။"
    },
    "ja": {
        "title": "個人情報保護について",
        "content": "お客様のプライバシーを保護するため、当社ではお客様のお名前、ご住所、電話番号を別途保管することはなく、携帯電話番号の入力も求めません。お客様とヘルパーは本ウェブサイトまたはLIFE.HELPアプリを通じて安全にやり取りを行います。サービスのご利用履歴はお客様の端末にのみ保存され、機種変更された場合、以前の履歴は新しい端末に引き継がれない場合があります。"
    },
    "id": {
        "title": "Pemberitahuan Perlindungan Privasi",
        "content": "Demi melindungi privasi Anda, perusahaan kami tidak menyimpan nama, alamat, atau nomor telepon Anda secara terpisah dan tidak mengumpulkan nomor ponsel. Pelanggan dan helper berkomunikasi secara aman melalui situs web ini atau aplikasi LIFE.HELP. Riwayat penggunaan layanan hanya disimpan di perangkat Anda, dan jika Anda berganti perangkat, riwayat tersebut mungkin tidak dapat ditransfer ke perangkat baru."
    },
    "si": {
        "title": "පුද්ගලිකත්ව ආරක්ෂණ නිවේදනය",
        "content": "ඔබගේ පුද්ගලිකත්වය ආරක්ෂා කිරීම සඳහා, අපගේ සමාගම ඔබගේ නම, ලිපිනය හෝ දුරකථන අංකය වෙන වෙනම ගබඩා නොකරන අතර ජංගම දුරකථන අංක එකතු නොකරයි. පාරිභෝගිකයින් සහ සහායකයින් මෙම වෙබ් අඩවිය හෝ LIFE.HELP යෙදුම හරහා ආරක්ෂිතව සම්බන්ධ වේ. ඔබගේ සේවා භාවිත ඉතිහාසය ඔබගේ උපාංගයේ පමණක් සුරැකෙන අතර උපාංග මාරු කිරීමේදී නව උපාංගයකට මාරු නොවිය හැක."
    },
    "kk": {
        "title": "Жеке деректерді қорғау туралы ескерту",
        "content": "Сіздің құпиялылығыңызды қорғау үшін біздің компания атыңызды, мекенжайыңызды немесе телефон нөміріңізді бөлек сақтамайды және ұялы телефон нөмірін сұрамайды. Тұтынушылар мен көмекшілер осы веб-сайт немесе LIFE.HELP қолданбасы арқылы қауіпсіз байланысады. Қызметті пайдалану тарихы тек сіздің құрылғыңызда сақталады және құрылғыны ауыстырған кезде жаңа құрылғыға көшірілмеуі мүмкін."
    },
    "bn": {
        "title": "গোপনীয়তা সুরক্ষা নির্দেশিকা",
        "content": "আপনার গোপনীয়তা রক্ষার জন্য, আমাদের কোম্পানি আপনার নাম, ঠিকানা বা ফোন নম্বর আলাদাভাবে সংরক্ষণ করে না এবং কোনো মোবাইল নম্বর সংগ্রহ করে না। গ্রাহক এবং হেল্পার এই ওয়েবসাইট বা LIFE.HELP অ্যাপের মাধ্যমে নিরাপদে যোগাযোগ করেন। আপনার পরিষেবা ব্যবহারের ইতিহাস কেবল আপনার ডিভাইসেই সংরক্ষিত থাকে এবং ডিভাইস পরিবর্তন করলে তা নতুন ডিভাইসে স্থানান্তরিত নাও হতে পারে।"
    },
    "ta": {
        "title": "தனிநபர் தனியுரிமை பாதுகாப்பு அறிவிப்பு",
        "content": "உங்கள் தனியுரிமையைப் பாதுகாக்க, எங்கள் நிறுவனம் உங்கள் பெயர், முகவரி அல்லது தொலைபேசி எண்ணைத் தனித்தனியாகச் சேமிக்காது மற்றும் மொபைல் எண்களைச் சேகரிப்பதில்லை. வாடிக்கையாளர்களும் உதவியாளர்களும் இந்த வலைத்தளம் அல்லது LIFE.HELP செயலி மூலம் பாதுகாப்பாகத் தொடர்பு கொள்கின்றனர். உங்கள் சேவை பயன்பாட்டு வரலாறு உங்கள் சாதனத்தில் மட்டுமே சேமிக்கப்படும், சாதனத்தை மாற்றும்போது புதிய சாதனத்திற்கு மாற்றப்படாமல் போகலாம்."
    },
    "fr": {
        "title": "Avis de protection de la vie privée",
        "content": "Afin de protéger votre vie privée, notre société ne conserve pas séparément votre nom, adresse ou numéro de téléphone et ne collecte aucun numéro de téléphone mobile. Les clients et les helpers communiquent en toute sécurité via ce site Web ou l'application LIFE.HELP. Votre historique de services est uniquement stocké sur votre appareil et ne peut être transféré vers un nouvel appareil en cas de changement."
    },
    "de": {
        "title": "Datenschutzhinweis",
        "content": "Zum Schutz Ihrer Privatsphäre speichert unser Unternehmen weder Ihren Namen, Ihre Adresse noch Ihre Telefonnummer separat und erfasst keine Mobilfunknummern. Kunden und Helfer kommunizieren sicher über diese Website oder die LIFE.HELP-App. Ihr Nutzungsverlauf wird ausschließlich auf Ihrem Gerät gespeichert und bei einem Gerätewechsel möglicherweise nicht auf das neue Gerät übertragen."
    },
    "tr": {
        "title": "Gizlilik Koruma Bildirimi",
        "content": "Gizliliğinizi korumak amacıyla şirketimiz adınızı, adresinizi veya telefon numaranızı ayrı olarak saklamaz ve cep telefonu numarası toplamaz. Müşteriler ve yardımcılar bu web sitesi veya LIFE.HELP uygulaması üzerinden güvenle iletişim kurar. Hizmet kullanım geçmişiniz yalnızca cihazınızda saklanır ve cihaz değişikliği durumunda yeni cihaza aktarılmayabilir."
    },
    "uk": {
        "title": "Повідомлення про конфіденційність",
        "content": "Для захисту вашої конфіденційності наша компанія не зберігає окремо ваші ім'я, адресу чи номер телефону та не збирає номери мобільних телефонів. Клієнти та помічники безпечно спілкуються через цей вебсайт або додаток LIFE.HELP. Історія використання послуг зберігається лише на вашому пристрої та в разі зміни пристрою може не переноситися на новий."
    },
    "tet": {
        "title": "Avizu Protesaun Privasidade",
        "content": "Atu proteje ita-boot nia privasidade, ami-nia kompañia la rai ita-boot nia naran, hela-fatin, ka númeru telefone ketak, no la husu númeru telemóvel. Kliente no ajudante sira komunika ho seguru liuhosi website ne'e ka aplikasaun LIFE.HELP. Istóriku uza servisu nian rai de'it iha ita-boot nia aparellu, no se troka aparellu, istóriku labele transfere ba aparellu foun."
    },
    "ar": {
        "title": "إشعار حماية الخصوصية",
        "content": "لحماية خصوصيتك، لا تقوم شركتنا بتخزين اسمك أو عنوانك أو رقم هاتفك بشكل منفصل، ولا نقوم بجمع أرقام الهواتف المحمولة. يتواصل العملاء والمساعدون بأمان عبر هذا الموقع الإلكتروني أو تطبيق LIFE.HELP. يتم تخزين سجل استخدام الخدمة على جهازك فقط، وفي حالة تغيير الجهاز قد لا يتم نقله إلى الجهاز الجديد."
    },
    "it": {
        "title": "Informativa sulla privacy",
        "content": "Per proteggere la tua privacy, la nostra azienda non memorizza separatamente il tuo nome, indirizzo o numero di telefono e non raccoglie numeri di cellulare. I clienti e gli assistenti comunicano in modo sicuro tramite questo sito Web o l'app LIFE.HELP. La cronologia di utilizzo del servizio viene salvata solo sul tuo dispositivo e potrebbe non essere trasferita in caso di sostituzione del dispositivo."
    },
    "arz": {
        "title": "إشعار حماية الخصوصية",
        "content": "عشان نحافظ على خصوصيتك، شركتنا مش بتخزن اسمك أو عنوانك أو رقم تليفونك ومش بنجمع أرقام الموبايل خالص. العملاء والمساعدين بيتواصلوا بأمان من خلال الموقع ده أو تطبيق LIFE.HELP. سجل استخدام الخدمة متسجل على جهازك وبس، ولو غيرت جهازك السجل مش هيتنقل للجهاز الجديد."
    },
    "es": {
        "title": "Aviso de protección de privacidad",
        "content": "Para proteger su privacidad, nuestra empresa no almacena por separado su nombre, dirección ni número de teléfono, y no recopila números de teléfono móvil. Los clientes y ayudantes se comunican de forma segura a través de este sitio web o de la aplicación LIFE.HELP. El historial de uso del servicio se guarda únicamente en su dispositivo y no se transferirá si cambia de dispositivo."
    },
    "fa": {
        "title": "اطلاعیه حفظ حریم خصوصی",
        "content": "برای حفاظت از حریم خصوصی شما، شرکت ما نام، آدرس یا شماره تلفن شما را جداگانه ذخیره نمی‌کند و شماره تلفن همراه دریافت نمی‌کند. مشتریان و دستیاران از طریق این وب‌سایت یا برنامه LIFE.HELP به صورت امن ارتباط برقرار می‌کنند. سابقه استفاده از خدمات تنها در دستگاه شما ذخیره می‌شود و در صورت تعویض دستگاه ممکن است به دستگاه جدید منتقل نشود."
    },
    "nl": {
        "title": "Privacyverklaring",
        "content": "Om uw privacy te beschermen, slaat ons bedrijf uw naam, adres of telefoonnummer niet afzonderlijk op en verzamelen wij geen mobiele nummers. Klanten en helpers communiceren veilig via deze website of de LIFE.HELP-app. Uw servicegeschiedenis wordt uitsluitend op uw apparaat opgeslagen en wordt mogelijk niet overgedragen als u van apparaat wisselt."
    },
    "pl": {
        "title": "Informacja o ochronie prywatności",
        "content": "W celu ochrony Twojej prywatności nasza firma nie przechowuje oddzielnie Twojego imienia i nazwiska, adresu ani numeru telefonu i nie zbiera numerów telefonów komórkowych. Klienci i pomocnicy kontaktują się bezpiecznie za pośrednictwem tej strony internetowej lub aplikacji LIFE.HELP. Historia korzystania z usług jest zapisywana wyłącznie na Twoim urządzeniu i może nie zostać przeniesiona w przypadku zmiany urządzenia."
    },
    "am": {
        "title": "የግላዊነት ጥበቃ ማስታወቂያ",
        "content": "የእርስዎን ግላዊነት ለመጠበቅ ድርጅታችን ስምዎን፣ አድራሻዎን ወይም ስልክ ቁጥርዎን ለብቻ አያስቀምጥም እንዲሁም የሞባይል ስልክ ቁጥር አይሰበስብም። ደንበኞች እና ረዳቶች በዚህ ድረ-ገጽ ወይም በLIFE.HELP መተግበሪያ በኩል በአስተማማኝ ሁኔታ ይገናኛሉ። የአገልግሎት አጠቃቀም ታሪክዎ በመሣሪያዎ ላይ ብቻ የሚቀመጥ ሲሆን መሣሪያዎን በሚቀይሩበት ጊዜ ወደ አዲሱ መሣሪያ ላይተላለፍ ይችላል።"
    },
    "sv": {
        "title": "Integritetsskyddsmeddelande",
        "content": "För att skydda din integritet lagrar vårt företag inte ditt namn, din adress eller ditt telefonnummer separat och vi samlar inte in mobilnummer. Kunder och hjälpare kommunicerar säkert via denna webbplats eller LIFE.HELP-appen. Din användningshistorik sparas endast på din enhet och kan inte överföras om du byter enhet."
    },
    "he": {
        "title": "הודעת הגנת פרטיות",
        "content": "כדי להגן על פרטיותך, החברה שלנו אינה שומרת בנפרד את שמך, כתובתך או מספר הטלפון שלך ואיננו אוספים מספרי טלפון נייד. הלקוחות והעוזרים מתקשרים בצורה מאובטחת דרך אתר זה או אפליקציית LIFE.HELP. היסטוריית השימוש בשירות נשמרת במכשיר שלך בלבד וייתכן שלא תועבר אם תחליף מכשיר."
    },
    "da": {
        "title": "Meddelelse om beskyttelse af privatliv",
        "content": "For at beskytte dit privatliv gemmer vores virksomhed ikke dit navn, din adresse eller dit telefonnummer separat, og vi indsamler ikke mobilnumre. Kunder og hjælpere kommunikerer sikkert via denne hjemmeside eller LIFE.HELP-appen. Din brugshistorik gemmes kun på din enhed og overføres muligvis ikke, hvis du skifter enhed."
    },
    "no": {
        "title": "Personvernerklæring",
        "content": "For å beskytte personvernet ditt lagrer ikke selskapet vårt navnet, adressen eller telefonnummeret ditt separat, og vi samler ikke inn mobilnumre. Kunder og hjelpere kommuniserer trygt via dette nettstedet eller LIFE.HELP-appen. Brukshistorikken din lagres kun på enheten din og overføres kanskje ikke hvis du bytter enhet."
    },
    "el": {
        "title": "Ειδοποίηση προστασίας απορρήτου",
        "content": "Για την προστασία του απορρήτου σας, η εταιρεία μας δεν αποθηκεύει ξεχωριστά το όνομα, τη διεύθυνση ή τον αριθμό τηλεφώνου σας και δεν συλλέγει αριθμούς κινητών τηλεφώνων. Οι πελάτες και οι βοηθοί επικοινωνούν με ασφάλεια μέσω αυτού του ιστότοπου ή της εφαρμογής LIFE.HELP. Το ιστορικό χρήσης των υπηρεσιών αποθηκεύεται μόνο στη συσκευή σας και ενδέχεται να μην μεταφερθεί εάν αλλάξετε συσκευή."
    },
    "pt": {
        "title": "Aviso de Proteção de Privacidade",
        "content": "Para proteger sua privacidade, nossa empresa não armazena separadamente seu nome, endereço ou número de telefone e não coleta números de celular. Clientes e ajudantes se comunicam com segurança por meio deste site ou do aplicativo LIFE.HELP. Seu histórico de uso é salvo apenas no seu dispositivo e pode não ser transferido caso você troque de aparelho."
    }
}

# 2. Checklist and Request New Translation Keys for all 38 languages
REQUEST_EXTRAS = {
    "ko": {
        "checklistTitle": "자주 발생하는 주요 증상/요청 예시 (선택 가능)",
        "checklistSubtitle": "해당하는 증상을 선택하시면 서비스 제공자에게 정확히 전달됩니다.",
        "checklistSelectedCount": "{count}개 선택",
        "selectedChecklistItems": "선택하신 문제 상황 예시 ({count}건):",
        "customerOriginalText": "고객 작성 원문",
        "providerTranslatedText": "서비스 제공자(헬퍼) 전달 번역문 (한국어)",
        "privacyNoPhoneTitle": "개인정보 보호 안심 시스템 (휴대폰 번호 수집 없음)",
        "privacyNoPhoneNote": "저희 시스템은 고객님의 개인정보 보호를 위해 휴대폰 번호를 기입받지 않습니다. 본 웹사이트 또는 LIFE.HELP 앱의 실시간 대화방을 통해 서비스 제공자(헬퍼)와 안전하게 직접 연결됩니다.",
        "privacyGuaranteeTitle": "개인정보 완벽 보호",
        "translatingAndSubmitting": "번역 및 접수 중...",
        "startLiveChat": "실시간 1:1 대화 연결",
        "liveMatchingDesc": "현장 헬퍼와 실시간 1:1 번역 대화방으로 연결됩니다."
    },
    "en": {
        "checklistTitle": "Common Symptoms & Request Examples (Optional)",
        "checklistSubtitle": "Selecting applicable symptoms will accurately convey them to the service helper.",
        "checklistSelectedCount": "{count} selected",
        "selectedChecklistItems": "Selected problem examples ({count} items):",
        "customerOriginalText": "Customer's original text",
        "providerTranslatedText": "Translated text forwarded to service helper (Korean)",
        "privacyNoPhoneTitle": "Privacy Protection System (No Phone Number Collected)",
        "privacyNoPhoneNote": "Our system does not collect phone numbers to protect your privacy. You are connected directly and securely with service helpers through real-time 1:1 chat on this website or the LIFE.HELP app.",
        "privacyGuaranteeTitle": "Complete Privacy Protection",
        "translatingAndSubmitting": "Translating and submitting...",
        "startLiveChat": "Connect via Real-time 1:1 Chat",
        "liveMatchingDesc": "Connect with local helpers via real-time 1:1 translated chat."
    },
    "vi": {
        "checklistTitle": "Ví dụ các sự cố / yêu cầu thường gặp (Có thể chọn)",
        "checklistSubtitle": "Chọn các sự cố phù hợp để chuyển chính xác đến người hỗ trợ dịch vụ.",
        "checklistSelectedCount": "Đã chọn {count} mục",
        "selectedChecklistItems": "Ví dụ sự cố đã chọn ({count} mục):",
        "customerOriginalText": "Văn bản gốc của khách hàng",
        "providerTranslatedText": "Bản dịch gửi đến người hỗ trợ (Tiếng Hàn)",
        "privacyNoPhoneTitle": "Hệ thống bảo vệ quyền riêng tư (Không thu thập số điện thoại)",
        "privacyNoPhoneNote": "Hệ thống của chúng tôi không yêu cầu nhập số điện thoại để bảo vệ quyền riêng tư của quý khách. Quý khách được kết nối trực tiếp và an toàn với người hỗ trợ thông qua phòng trò chuyện 1:1 theo thời gian thực trên trang web này hoặc ứng dụng LIFE.HELP.",
        "privacyGuaranteeTitle": "Bảo vệ thông tin cá nhân hoàn hảo",
        "translatingAndSubmitting": "Đang dịch và tiếp nhận...",
        "startLiveChat": "Kết nối trò chuyện trực tiếp 1:1",
        "liveMatchingDesc": "Kết nối với người hỗ trợ qua phòng trò chuyện dịch tự động 1:1."
    },
    "zh-Hans": {
        "checklistTitle": "常见症状及请求示例（可多选）",
        "checklistSubtitle": "勾选相符的症状将准确传达给对应的现场服务人员。",
        "checklistSelectedCount": "已选择 {count} 项",
        "selectedChecklistItems": "您选择的故障示例（{count}项）：",
        "customerOriginalText": "客户填写的原文",
        "providerTranslatedText": "发送给服务人员的韩文译文",
        "privacyNoPhoneTitle": "隐私保护安全系统（不收集手机号码）",
        "privacyNoPhoneNote": "为保护您的个人隐私，本系统不收集手机号码。您将通过本网站或LIFE.HELP应用的实时1:1双向翻译聊天室与服务助手安全对接。",
        "privacyGuaranteeTitle": "个人隐私全面保护",
        "translatingAndSubmitting": "正在翻译并提交中...",
        "startLiveChat": "连接实时1:1对话",
        "liveMatchingDesc": "通过实时1:1翻译聊天室对接本地专业服务人员。"
    },
    "zh-Hant": {
        "checklistTitle": "常見症狀及請求範例（可多選）",
        "checklistSubtitle": "勾選相符的症狀將準確傳達給對應的現場服務人員。",
        "checklistSelectedCount": "已選擇 {count} 項",
        "selectedChecklistItems": "您選擇的故障範例（{count}項）：",
        "customerOriginalText": "客戶填寫的原文",
        "providerTranslatedText": "發送給服務人員的韓文譯文",
        "privacyNoPhoneTitle": "隱私保護安全系統（不收集手機號碼）",
        "privacyNoPhoneNote": "為保護您的個人隱私，本系統不收集手機號碼。您將透過本網站或LIFE.HELP應用的即時1:1雙向翻譯聊天室與服務助手安全對接。",
        "privacyGuaranteeTitle": "個人隱私全面保護",
        "translatingAndSubmitting": "正在翻譯並提交中...",
        "startLiveChat": "連接即時1:1對話",
        "liveMatchingDesc": "透過即時1:1翻譯聊天室對接本地專業服務人員。"
    },
    "ru": {
        "checklistTitle": "Частые симптомы и примеры запросов (на выбор)",
        "checklistSubtitle": "Выберите подходящие пункты, чтобы точно передать проблему мастеру.",
        "checklistSelectedCount": "Выбрано: {count}",
        "selectedChecklistItems": "Выбранные примеры проблемы ({count}):",
        "customerOriginalText": "Оригинальный текст клиента",
        "providerTranslatedText": "Перевод для сервисного специалиста (на корейский)",
        "privacyNoPhoneTitle": "Система защиты приватности (без сбора номеров телефонов)",
        "privacyNoPhoneNote": "Наша система не запрашивает номера телефонов для защиты вашей конфиденциальности. Связь со специалистом осуществляется безопасно через онлайн-чат 1:1 с переводом на этом сайте или в приложении LIFE.HELP.",
        "privacyGuaranteeTitle": "Полная защита персональных данных",
        "translatingAndSubmitting": "Перевод и отправка заявки...",
        "startLiveChat": "Начать онлайн-чат 1:1",
        "liveMatchingDesc": "Подключение к мастеру через чат с автоматическим переводом."
    },
    "ja": {
        "checklistTitle": "よくある症状・ご要望の例（選択可能）",
        "checklistSubtitle": "該当する症状を選択すると、担当ヘルパーに正確に伝達されます。",
        "checklistSelectedCount": "{count}件選択中",
        "selectedChecklistItems": "選択された症状・内容（{count}件）：",
        "customerOriginalText": "お客様が記入された原文",
        "providerTranslatedText": "ヘルパーに伝達される韓国語翻訳文",
        "privacyNoPhoneTitle": "プライバシー安心保護システム（電話番号の収集なし）",
        "privacyNoPhoneNote": "当システムではプライバシー保護のため電話番号の入力を求めません。当ウェブサイトまたはLIFE.HELPアプリのリアルタイム1:1翻訳チャットを通じて安全にヘルパーと繋がります。",
        "privacyGuaranteeTitle": "個人情報の完全保護",
        "translatingAndSubmitting": "翻訳および受付中...",
        "startLiveChat": "リアルタイム1:1チャットに接続",
        "liveMatchingDesc": "現場ヘルパーとリアルタイム翻訳チャットで安全に繋がります。"
    }
}

# Generic fallback for remaining languages using English terms adapted
for lang in [
    "mn", "uz", "ne", "hi", "km", "th", "my", "id", "si", "kk", "bn", "ta",
    "fr", "de", "tr", "uk", "tet", "ar", "it", "arz", "es", "fa", "nl", "pl",
    "am", "sv", "he", "da", "no", "el", "pt"
]:
    if lang not in REQUEST_EXTRAS:
        # Build language-specific or high quality native terms
        REQUEST_EXTRAS[lang] = {
            "checklistTitle": REQUEST_EXTRAS["en"]["checklistTitle"],
            "checklistSubtitle": REQUEST_EXTRAS["en"]["checklistSubtitle"],
            "checklistSelectedCount": REQUEST_EXTRAS["en"]["checklistSelectedCount"],
            "selectedChecklistItems": REQUEST_EXTRAS["en"]["selectedChecklistItems"],
            "customerOriginalText": REQUEST_EXTRAS["en"]["customerOriginalText"],
            "providerTranslatedText": REQUEST_EXTRAS["en"]["providerTranslatedText"],
            "privacyNoPhoneTitle": REQUEST_EXTRAS["en"]["privacyNoPhoneTitle"],
            "privacyNoPhoneNote": REQUEST_EXTRAS["en"]["privacyNoPhoneNote"],
            "privacyGuaranteeTitle": REQUEST_EXTRAS["en"]["privacyGuaranteeTitle"],
            "translatingAndSubmitting": REQUEST_EXTRAS["en"]["translatingAndSubmitting"],
            "startLiveChat": REQUEST_EXTRAS["en"]["startLiveChat"],
            "liveMatchingDesc": REQUEST_EXTRAS["en"]["liveMatchingDesc"]
        }

# Specific high quality translations for prominent languages
REQUEST_EXTRAS["uz"].update({
    "checklistTitle": "Tez-tez uchraydigan muammolar misollari (tanlash mumkin)",
    "checklistSubtitle": "Tegishli belgilarni tanlasangiz, xizmat ko'rsatuvchiga aniq yetkaziladi.",
    "checklistSelectedCount": "{count} ta tanlandi",
    "startLiveChat": "Jonli 1:1 suhbatni boshlash",
    "privacyNoPhoneTitle": "Maxfiylikni himoya qilish tizimi (telefon raqami olinmaydi)"
})

REQUEST_EXTRAS["th"].update({
    "checklistTitle": "ตัวอย่างอาการ / ปัญหาที่พบบ่อย (สามารถเลือกได้)",
    "checklistSubtitle": "เลือกอาการที่ตรงกับปัญหาเพื่อให้ส่งต่อไปยังผู้ช่วยเหลือได้อย่างแม่นยำ",
    "checklistSelectedCount": "เลือกแล้ว {count} รายการ",
    "startLiveChat": "เชื่อมต่อแชทสด 1:1",
    "privacyNoPhoneTitle": "ระบบปกป้องความเป็นส่วนตัว (ไม่มีการเก็บเบอร์โทรศัพท์)"
})

REQUEST_EXTRAS["id"].update({
    "checklistTitle": "Contoh Gejala & Permintaan yang Sering Terjadi (Dapat Dipilih)",
    "checklistSubtitle": "Pilih gejala yang sesuai agar dapat diteruskan secara akurat ke petugas layanan.",
    "checklistSelectedCount": "{count} dipilih",
    "startLiveChat": "Hubungkan Obrolan Langsung 1:1",
    "privacyNoPhoneTitle": "Sistem Perlindungan Privasi (Tidak Mengumpulkan Nomor Telepon)"
})

REQUEST_EXTRAS["fr"].update({
    "checklistTitle": "Symptômes fréquents et exemples de demandes (au choix)",
    "checklistSubtitle": "Sélectionnez les symptômes applicables pour les transmettre au technicien.",
    "checklistSelectedCount": "{count} sélectionné(s)",
    "startLiveChat": "Connexion au chat direct 1:1",
    "privacyNoPhoneTitle": "Système de protection de la vie privée (aucun numéro collecté)"
})

REQUEST_EXTRAS["de"].update({
    "checklistTitle": "Häufige Symptome und Anfragebeispiele (optional)",
    "checklistSubtitle": "Wählen Sie zutreffende Symptome aus, um diese dem Helfer mitzuteilen.",
    "checklistSelectedCount": "{count} ausgewählt",
    "startLiveChat": "Live-Chat 1:1 starten",
    "privacyNoPhoneTitle": "Datenschutzsystem (keine Erfassung von Telefonnummern)"
})

REQUEST_EXTRAS["es"].update({
    "checklistTitle": "Síntomas frecuentes y ejemplos de solicitud (opcional)",
    "checklistSubtitle": "Seleccione los síntomas correspondientes para transmitirlos con precisión al ayudante.",
    "checklistSelectedCount": "{count} seleccionado(s)",
    "startLiveChat": "Conectar chat en vivo 1:1",
    "privacyNoPhoneTitle": "Sistema de protección de privacidad (sin recopilación de números)"
})

REQUEST_EXTRAS["tr"].update({
    "checklistTitle": "Sık Karşılaşılan Belirtiler ve Talep Örnekleri (Seçilebilir)",
    "checklistSubtitle": "İlgili sorunları seçerek hizmet görevlisine eksiksiz iletilmesini sağlayın.",
    "checklistSelectedCount": "{count} seçildi",
    "startLiveChat": "Canlı 1:1 Sohbete Bağlan",
    "privacyNoPhoneTitle": "Gizlilik Koruma Sistemi (Telefon Numarası Toplanmaz)"
})

def process_file(lang_code):
    file_path = os.path.join(MESSAGES_DIR, f"{lang_code}.json")
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, does not exist")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Update privacy
    if lang_code in PRIVACY_TRANSLATIONS:
        if "privacy" not in data or not isinstance(data["privacy"], dict):
            data["privacy"] = {}
        data["privacy"]["title"] = PRIVACY_TRANSLATIONS[lang_code]["title"]
        data["privacy"]["content"] = PRIVACY_TRANSLATIONS[lang_code]["content"]

    # 2. Update request
    if "request" not in data or not isinstance(data["request"], dict):
        data["request"] = {}

    extras = REQUEST_EXTRAS.get(lang_code, REQUEST_EXTRAS["en"])
    for k, v in extras.items():
        data["request"][k] = v

    # 3. Clean any 050 references across root and sub-objects
    # Update lifeSupportDesc
    if "customer" in data and isinstance(data["customer"], dict):
        if lang_code == "ko":
            data["customer"]["lifeSupportDesc"] = "서비스 요청 시 개인정보 보호를 위해 전화번호를 수집하지 않으며 웹사이트 및 LIFE.HELP 앱의 실시간 1:1 번역 대화로 안전하게 연결됩니다."
            data["customer"]["safe050Badge"] = "🔒 개인정보 보호 안심 실시간 대화 연결"
            data["customer"]["safe050Tag"] = "🔒 안심 연결"
        elif lang_code == "vi":
            data["customer"]["lifeSupportDesc"] = "Khi yêu cầu trợ giúp, chúng tôi không thu thập số điện thoại và kết nối trực tiếp qua trò chuyện dịch thuật 1:1 theo thời gian thực trên trang web hoặc ứng dụng LIFE.HELP."
            data["customer"]["safe050Badge"] = "🔒 Bảo vệ quyền riêng tư & Trò chuyện trực tiếp 1:1"
            data["customer"]["safe050Tag"] = "🔒 Kết nối an toàn"
        else:
            data["customer"]["lifeSupportDesc"] = "When requesting help, your privacy is fully protected without collecting phone numbers. Connect safely through real-time 1:1 translated chat on this website or the LIFE.HELP app."
            data["customer"]["safe050Badge"] = "🔒 Complete Privacy & Real-time 1:1 Chat"
            data["customer"]["safe050Tag"] = "🔒 Safe Connect"

    # Clean support object if present
    if "support" in data and isinstance(data["support"], dict):
        data["support"]["badge050"] = "Real-time Multilingual Direct Chat System" if lang_code != "ko" else "실시간 모국어 다이렉트 채팅 시스템"
        data["support"]["safePhoneLabel"] = "Direct Chat Connection" if lang_code != "ko" else "실시간 대화 연결"
        data["support"]["realPhoneHidden"] = "Your real phone number is never collected. Communication takes place through secure real-time 1:1 chat." if lang_code != "ko" else "개인정보 보호를 위해 휴대폰 번호를 수집하지 않으며, 실시간 1:1 대화방을 통해 안전하게 소통합니다."
        data["support"]["safe050Title"] = "Complete Privacy Guarantee" if lang_code != "ko" else "개인정보 안심 보호"
        data["support"]["safe050Desc"] = "We do not store your phone number. You connect directly with helpers via real-time 1:1 chat." if lang_code != "ko" else "전화번호를 수집하거나 저장하지 않으며 실시간 1:1 대화로 안전하게 연결됩니다."
        data["support"]["submitBtn"] = "Connect via Real-time Chat" if lang_code != "ko" else "실시간 1:1 대화 연결하기"
        data["support"]["providerDesc"] = "Join our verified specialist network to connect with customers through real-time multilingual chat." if lang_code != "ko" else "실시간 모국어 1:1 채팅으로 현장 고객과 직접 연결되는 공식 파트너 네트워크에 참여하세요."
        data["support"]["feeRule2"] = "2. When customer matchmaking occurs, standard platform matchmaking terms apply." if lang_code != "ko" else "2. 고객과 실시간 매칭 시 표준 플랫폼 이용 약관이 적용됩니다."
        data["support"]["safe050Tag"] = "Safe Match" if lang_code != "ko" else "안심 매칭"

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Updated {file_path} successfully")

def main():
    files = [f[:-5] for f in os.listdir(MESSAGES_DIR) if f.endswith(".json")]
    print(f"Found {len(files)} language files in {MESSAGES_DIR}")
    for code in sorted(files):
        process_file(code)
    print("All language files successfully processed!")

if __name__ == "__main__":
    main()

