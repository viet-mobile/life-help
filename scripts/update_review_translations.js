const fs = require('fs');
const path = require('path');

const reviewTranslations = {
  ko: {
    reviewLink: "자유 리뷰 남기기 →",
    title: "자유 고객 리뷰",
    subtitle: "개인정보 입력 없이 솔직하고 자유로운 이용 후기를 남겨주세요. 작성하신 리뷰는 관리자 이메일(contact@life.help)로 직접 전달됩니다.",
    anonymousBadge: "🔒 개인정보 입력 불필요 (100% 익명 보장)",
    ratingLabel: "서비스 만족도",
    categoryLabel: "이용하신 서비스 (선택)",
    contentLabel: "리뷰 내용",
    contentPlaceholder: "서비스 이용 경험이나 헬퍼/상담원에 대한 솔직한 후기를 자유롭게 적어주세요. (이름, 전화번호 등 개인정보 입력 없이 자유롭게 작성하실 수 있습니다.)",
    emailNotice: "📧 본 리뷰는 시스템 관리자 이메일 contact@life.help 로 안전하게 전달됩니다.",
    submitBtn: "리뷰 제출하기 (contact@life.help로 전송)",
    submittingBtn: "전송 중...",
    successTitle: "리뷰가 성공적으로 전달되었습니다!",
    successDesc: "작성해주신 소중한 리뷰가 관리자 이메일 contact@life.help 로 안전하게 전달되었습니다. 서비스 개선에 큰 힘이 됩니다. 감사합니다!",
    writeAnotherBtn: "새 리뷰 작성하기",
    homeBtn: "메인 홈으로 돌아가기",
    allServices: "전체 서비스",
    emptyContentAlert: "리뷰 내용을 입력해 주세요."
  },
  en: {
    reviewLink: "Leave a Review →",
    title: "Free Customer Review",
    subtitle: "Please leave your honest feedback without entering any personal information. Your review will be delivered directly to the manager at contact@life.help.",
    anonymousBadge: "🔒 No Personal Info Required (100% Anonymous)",
    ratingLabel: "Service Rating",
    categoryLabel: "Service Used (Optional)",
    contentLabel: "Review Content",
    contentPlaceholder: "Feel free to share your experience with our services, helpers, or counselors. (No name, phone number, or personal info required.)",
    emailNotice: "📧 This review will be securely delivered to the administrator email contact@life.help.",
    submitBtn: "Submit Review (Send to contact@life.help)",
    submittingBtn: "Sending...",
    successTitle: "Review Successfully Sent!",
    successDesc: "Your valuable feedback has been delivered to the administrator email contact@life.help. Thank you for helping us improve our services!",
    writeAnotherBtn: "Write Another Review",
    homeBtn: "Return to Home",
    allServices: "All Services",
    emptyContentAlert: "Please enter your review content."
  },
  vi: {
    reviewLink: "Viết đánh giá tự do →",
    title: "Đánh Giá Khách Hàng Tự Do",
    subtitle: "Vui lòng để lại cảm nhận chân thành mà không cần nhập thông tin cá nhân. Đánh giá của bạn sẽ được chuyển trực tiếp đến email quản trị viên contact@life.help.",
    anonymousBadge: "🔒 Không Cần Thông Tin Cá Nhân (Ẩn Danh 100%)",
    ratingLabel: "Mức độ hài lòng",
    categoryLabel: "Dịch vụ đã sử dụng (Tùy chọn)",
    contentLabel: "Nội dung đánh giá",
    contentPlaceholder: "Hãy thoải mái chia sẻ trải nghiệm của bạn về dịch vụ, thợ hỗ trợ hoặc tư vấn viên. (Hoàn toàn không yêu cầu tên, số điện thoại hay thông tin cá nhân.)",
    emailNotice: "📧 Đánh giá này sẽ được chuyển an toàn đến email quản trị viên contact@life.help.",
    submitBtn: "Gửi Đánh Giá (Tới contact@life.help)",
    submittingBtn: "Đang gửi...",
    successTitle: "Đã gửi đánh giá thành công!",
    successDesc: "Ý kiến quý báu của bạn đã được chuyển đến email quản trị viên contact@life.help. Xin chân thành cảm ơn bạn!",
    writeAnotherBtn: "Viết đánh giá khác",
    homeBtn: "Về trang chủ",
    allServices: "Tất cả dịch vụ",
    emptyContentAlert: "Vui lòng nhập nội dung đánh giá."
  },
  "zh-Hans": {
    reviewLink: "发表匿名评价 →",
    title: "客户自由评价",
    subtitle: "无需填写任何个人信息，畅所欲言发表您的使用体验。您的评价将直接发送至管理员邮箱 contact@life.help。",
    anonymousBadge: "🔒 无需个人信息（100% 匿名保障）",
    ratingLabel: "服务满意度",
    categoryLabel: "所用服务（可选）",
    contentLabel: "评价内容",
    contentPlaceholder: "请自由分享您对服务、便民师傅或客服咨询员的真实感受。（无需提供姓名、电话等任何个人隐私信息。）",
    emailNotice: "📧 本评价将安全发送至系统管理员邮箱 contact@life.help。",
    submitBtn: "提交评价（发送至 contact@life.help）",
    submittingBtn: "正在发送...",
    successTitle: "评价已成功送达！",
    successDesc: "您宝贵的评价已安全发送至管理员邮箱 contact@life.help。感谢您帮助我们不断改进服务！",
    writeAnotherBtn: "再写一条评价",
    homeBtn: "返回首页",
    allServices: "全部服务",
    emptyContentAlert: "请输入评价内容。"
  },
  "zh-Hant": {
    reviewLink: "發表匿名評價 →",
    title: "客戶自由評價",
    subtitle: "無需填寫任何個人資訊，暢所欲言發表您的使用體驗。您的評價將直接發送至管理員信箱 contact@life.help。",
    anonymousBadge: "🔒 無需個人資訊（100% 匿名保障）",
    ratingLabel: "服務滿意度",
    categoryLabel: "所用服務（可選）",
    contentLabel: "評價內容",
    contentPlaceholder: "請自由分享您對服務、便民師傅或客服諮詢員的真實感受。（無需提供姓名、電話等任何個人隱私資訊。）",
    emailNotice: "📧 本評價將安全發送至系統管理員信箱 contact@life.help。",
    submitBtn: "提交評價（發送至 contact@life.help）",
    submittingBtn: "正在發送...",
    successTitle: "評價已成功送達！",
    successDesc: "您寶貴的評價已安全發送至管理員信箱 contact@life.help。感謝您協助我們持續改善服務！",
    writeAnotherBtn: "再寫一則評價",
    homeBtn: "返回首頁",
    allServices: "全部服務",
    emptyContentAlert: "請輸入評價內容。"
  },
  ja: {
    reviewLink: "レビューを投稿する →",
    title: "お客様レビュー（匿名）",
    subtitle: "個人情報の入力は一切不要です。率直なご感想をお気軽にお寄せください。いただいたレビューは管理者メール（contact@life.help）へ直接送信されます。",
    anonymousBadge: "🔒 個人情報の入力不要（100% 匿名保証）",
    ratingLabel: "サービスの満足度",
    categoryLabel: "ご利用いただいたサービス（任意）",
    contentLabel: "レビュー内容",
    contentPlaceholder: "ヘルパーや相談員の対応など、サービスのご感想をご自由にお書きください。（氏名や電話番号などの個人情報は一切不要です。）",
    emailNotice: "📧 投稿されたレビューはシステム管理者メール contact@life.help へ安全に送信されます。",
    submitBtn: "レビューを送信する（contact@life.help へ送信）",
    submittingBtn: "送信中...",
    successTitle: "レビューが正常に送信されました！",
    successDesc: "貴重なご意見が管理者メール contact@life.help へ安全に届きました。サービス向上の参考にさせていただきます。誠にありがとうございました！",
    writeAnotherBtn: "別のレビューを書く",
    homeBtn: "ホームに戻る",
    allServices: "すべてのサービス",
    emptyContentAlert: "レビュー内容を入力してください。"
  },
  ru: {
    reviewLink: "Оставить отзыв →",
    title: "Свободный отзыв клиента",
    subtitle: "Оставьте свой честный отзыв без ввода персональных данных. Ваш отзыв будет отправлен администратору на contact@life.help.",
    anonymousBadge: "🔒 Без личных данных (100% анонимно)",
    ratingLabel: "Оценка качества",
    categoryLabel: "Услуга (необязательно)",
    contentLabel: "Текст отзыва",
    contentPlaceholder: "Поделитесь впечатлениями о сервисе, мастере или консультанте. (Имя, номер телефона и личные данные не требуются.)",
    emailNotice: "📧 Этот отзыв будет безопасно отправлен администратору на contact@life.help.",
    submitBtn: "Отправить отзыв (на contact@life.help)",
    submittingBtn: "Отправка...",
    successTitle: "Отзыв успешно отправлен!",
    successDesc: "Ваш отзыв благополучно доставлен администратору на contact@life.help. Спасибо за помощь в улучшении сервиса!",
    writeAnotherBtn: "Написать еще один отзыв",
    homeBtn: "На главную",
    allServices: "Все услуги",
    emptyContentAlert: "Пожалуйста, введите текст отзыва."
  },
  uz: {
    reviewLink: "Fikr qoldirish →",
    title: "Mijozning erkin fikri",
    subtitle: "Shaxsiy ma'lumotlarni kiritmasdan o'z fikringizni erkin qoldiring. Sharhingiz to'g'ridan-to'g'ri administrator elektron pochtasiga (contact@life.help) yuboriladi.",
    anonymousBadge: "🔒 Shaxsiy ma'lumotlar talab etilmaydi (100% anonim)",
    ratingLabel: "Xizmatdan qoniqish",
    categoryLabel: "Foydalanilgan xizmat (ixtiyoriy)",
    contentLabel: "Fikr matni",
    contentPlaceholder: "Xizmat, usta yoki maslahatchi haqidagi taassurotlaringiz bilan erkin bo'lishing. (Ism, telefon raqami kiritish shart emas.)",
    emailNotice: "📧 Ushbu sharh administrator elektron pochtasiga (contact@life.help) xavfsiz yetkaziladi.",
    submitBtn: "Fikrni yuborish (contact@life.help ga)",
    submittingBtn: "Yuborilmoqda...",
    successTitle: "Fikringiz muvaffaqiyatli yuborildi!",
    successDesc: "Qimmatli fikringiz administrator pochtasiga (contact@life.help) yetkazildi. Rahmat!",
    writeAnotherBtn: "Yana sharh yozish",
    homeBtn: "Bosh sahifaga qaytish",
    allServices: "Barcha xizmatlar",
    emptyContentAlert: "Iltimos, sharh matnini kiriting."
  },
  th: {
    reviewLink: "เขียนรีวิวอย่างอิสระ →",
    title: "รีวิวจากลูกค้าแบบอิสระ",
    subtitle: "โปรดแบ่งปันความประทับใจของท่านโดยไม่ต้องกรอกข้อมูลส่วนบุคคลใดๆ ข้อความจะถูกส่งตรงถึงผู้ดูแลระบบที่ contact@life.help",
    anonymousBadge: "🔒 ไม่ต้องระบุข้อมูลส่วนตัว (ไม่เปิดเผยตัวตน 100%)",
    ratingLabel: "ความพึงพอใจในการบริการ",
    categoryLabel: "บริการที่ท่านใช้ (ไม่บังคับ)",
    contentLabel: "ข้อความรีวิว",
    contentPlaceholder: "แบ่งปันความคิดเห็นหรือข้อเสนอแนะเกี่ยวกับบริการ ผู้เชี่ยวชาญ หรือที่ปรึกษาได้อย่างอิสระ (ไม่ต้องระบุชื่อหรือเบอร์โทรศัพท์)",
    emailNotice: "📧 รีวิวนี้จะถูกส่งไปยังอีเมลผู้ดูแลระบบ contact@life.help อย่างปลอดภัย",
    submitBtn: "ส่งรีวิว (ไปยัง contact@life.help)",
    submittingBtn: "กำลังส่ง...",
    successTitle: "ส่งรีวิวเรียบร้อยแล้ว!",
    successDesc: "ข้อเสนอแนะอันมีค่าของท่านถูกส่งไปยังอีเมล contact@life.help เรียบร้อยแล้ว ขอขอบพระคุณเป็นอย่างยิ่ง!",
    writeAnotherBtn: "เขียนรีวิวใหม่อีกครั้ง",
    homeBtn: "กลับสู่หน้าหลัก",
    allServices: "บริการทั้งหมด",
    emptyContentAlert: "กรุณาระบุข้อความรีวิว"
  },
  km: {
    reviewLink: "សរសេរការវាយតម្លៃដោយសេរី →",
    title: "ការវាយតម្លៃរបស់អតិថិជន",
    subtitle: "សូមបញ្ចេញមតិយោបល់ដោយស្មោះត្រង់ដោយមិនចាំបាច់បញ្ចូលព័ត៌មានផ្ទាល់ខ្លួនឡើយ។ មតិរបស់អ្នកនឹងផ្ញើទៅកាន់អ៊ីមែលអ្នកគ្រប់គ្រង contact@life.help ដោយផ្ទាល់។",
    anonymousBadge: "🔒 មិនទាមទារព័ត៌មានផ្ទាល់ខ្លួន (អនាមិក 100%)",
    ratingLabel: "កម្រិតការពេញចិត្ត",
    categoryLabel: "សេវាកម្មដែលបានប្រើ (ជម្រើស)",
    contentLabel: "ខ្លឹមសារវាយតម្លៃ",
    contentPlaceholder: "សូមចែករំលែកបទពិសោធន៍របស់អ្នកអំពីសេវាកម្ម ឬជាងជំនាញដោយសេរី។ (មិនបាច់បញ្ចូលឈ្មោះ ឬលេខទូរស័ព្ទឡើយ)",
    emailNotice: "📧 ការវាយតម្លៃនេះនឹងត្រូវបញ្ជូនទៅកាន់អ៊ីមែល contact@life.help ដោយសុវត្ថិភាព។",
    submitBtn: "បញ្ជូនការវាយតម្លៃ (ផ្ញើទៅកាន់ contact@life.help)",
    submittingBtn: "កំពុងបញ្ជូន...",
    successTitle: "ការវាយតម្លៃត្រូវបានបញ្ជូនដោយជោគជ័យ!",
    successDesc: "មតិយោបល់ដ៏មានតម្លៃរបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់អ៊ីមែល contact@life.help រួចរាល់ហើយ។ សូមអរគុណ!",
    writeAnotherBtn: "សរសេរការវាយតម្លៃថ្មី",
    homeBtn: "ត្រឡប់ទៅទំព័រដើម",
    allServices: "សេវាកម្មទាំងអស់",
    emptyContentAlert: "សូមបញ្ចូលខ្លឹមសារវាយតម្លៃ។"
  },
  my: {
    reviewLink: "လွတ်လပ်စွာ သုံးသပ်ချက်ပေးရန် →",
    title: "သုံးစွဲသူများ၏ လွတ်လပ်သော သုံးသပ်ချက်",
    subtitle: "ကိုယ်ရေးအချက်အလက် ထည့်သွင်းရန်မလိုဘဲ ပွင့်လင်းစွာ သုံးသပ်ချက်ပေးပို့နိုင်ပါသည်။ သင်၏သုံးသပ်ချက်ကို စီမံခန့်ခွဲသူ contact@life.help သို့ တိုက်ရိုက်ပေးပို့ပါမည်။",
    anonymousBadge: "🔒 ကိုယ်ရေးအချက်အလက် ပေးရန်မလိုပါ (၁၀၀% လျှို့ဝှက်အမည်မဖော်ပြ)",
    ratingLabel: "ကျေနပ်မှုအဆင့်",
    categoryLabel: "အသုံးပြုခဲ့သော ဝန်ဆောင်မှု (စိတ်ကြိုက်)",
    contentLabel: "သုံးသပ်ချက်အကြောင်းအရာ",
    contentPlaceholder: "ဝန်ဆောင်မှု၊ ကျွမ်းကျင်သူ သို့မဟုတ် အကြံပေးနှင့် ပတ်သက်သည့် အတွေ့အကြုံများကို လွတ်လပ်စွာ ရေးသားနိုင်ပါသည်။ (အမည်၊ ဖုန်းနံပါတ် စသည် မလိုပါ)",
    emailNotice: "📧 ဤသုံးသပ်ချက်ကို စီမံခန့်ခွဲသူ အီးမေးလ် contact@life.help သို့ လုံခြုံစွာ ပေးပို့ပါမည်။",
    submitBtn: "သုံးသပ်ချက် ပေးပို့ရန် (contact@life.help သို့)",
    submittingBtn: "ပေးပို့နေပါသည်...",
    successTitle: "သုံးသပ်ချက် အောင်မြင်စွာ ပေးပို့ပြီးပါပြီ။",
    successDesc: "သင်၏ အဖိုးတန်သော အကြံပြုချက်များကို contact@life.help သို့ ပေးပို့လိုက်ပါပြီ။ ကျေးဇူးတင်ရှိပါသည်။",
    writeAnotherBtn: "နောက်ထပ် သုံးသပ်ချက် ရေးရန်",
    homeBtn: "ပင်မစာမျက်နှာသို့ ပြန်သွားရန်",
    allServices: "ဝန်ဆောင်မှုအားလုံး",
    emptyContentAlert: "သုံးသပ်ချက် အကြောင်းအရာကို ထည့်သွင်းပေးပါ။"
  },
  mn: {
    reviewLink: "Сэтгэгдэл үлдээх →",
    title: "Хэрэглэгчийн чөлөөт сэтгэгдэл",
    subtitle: "Хувийн мэдээллээ оруулахгүйгээр сэтгэгдлээ чөлөөтэй үлдээнэ үү. Таны сэтгэгдэл админы contact@life.help и-мэйл рүү шууд илгээгдэнэ.",
    anonymousBadge: "🔒 Хувийн мэдээлэл шаардлагагүй (100% нууцлалтай)",
    ratingLabel: "Үйлчилгээний үнэлгээ",
    categoryLabel: "Авсан үйлчилгээ (Сонгох)",
    contentLabel: "Сэтгэгдлийн агуулга",
    contentPlaceholder: "Үйлчилгээ, туслах ажилтан, зөвлөхийн талаарх сэтгэгдлээ чөлөөтэй хуваалцана уу. (Нэр, утасны дугаар оруулах шаардлагагүй)",
    emailNotice: "📧 Энэхүү сэтгэгдэл нь админы contact@life.help хаяг руу аюулгүй илгээгдэнэ.",
    submitBtn: "Сэтгэгдэл илгээх (contact@life.help рүү)",
    submittingBtn: "Илгээж байна...",
    successTitle: "Сэтгэгдэл амжилттай илгээгдлээ!",
    successDesc: "Таны үнэтэй санал хүсэлт contact@life.help хаягт хүрлээ. Танд баярлалаа!",
    writeAnotherBtn: "Шинэ сэтгэгдэл бичих",
    homeBtn: "Нүүр хуудас руу буцах",
    allServices: "Бүх үйлчилгээ",
    emptyContentAlert: "Сэтгэгдлийн агуулгыг оруулна уу."
  },
  id: {
    reviewLink: "Beri Ulasan Bebas →",
    title: "Ulasan Pelanggan Bebas",
    subtitle: "Silakan berikan ulasan jujur Anda tanpa memasukkan informasi pribadi. Ulasan Anda akan dikirimkan langsung ke email admin di contact@life.help.",
    anonymousBadge: "🔒 Tanpa Data Pribadi (100% Anonim)",
    ratingLabel: "Tingkat Kepuasan",
    categoryLabel: "Layanan yang Digunakan (Opsional)",
    contentLabel: "Isi Ulasan",
    contentPlaceholder: "Bagikan pengalaman Anda mengenai layanan, teknisi, atau konselor kami. (Nama, nomor telepon, dan data pribadi tidak diperlukan.)",
    emailNotice: "📧 Ulasan ini akan dikirimkan dengan aman ke email admin di contact@life.help.",
    submitBtn: "Kirim Ulasan (ke contact@life.help)",
    submittingBtn: "Mengirimkan...",
    successTitle: "Ulasan Berhasil Dikirim!",
    successDesc: "Ulasan berharga Anda telah terkirim ke email admin di contact@life.help. Terima kasih atas masukan Anda!",
    writeAnotherBtn: "Tulis Ulasan Baru",
    homeBtn: "Kembali ke Beranda",
    allServices: "Semua Layanan",
    emptyContentAlert: "Silakan masukkan isi ulasan Anda."
  }
};

// Fill any other languages with localized or English defaults
const defaultEn = reviewTranslations.en;

const messagesDir = path.join(__dirname, '..', 'messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

let updatedCount = 0;

for (const file of files) {
  const lang = path.basename(file, '.json');
  const filePath = path.join(messagesDir, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);

    const trans = reviewTranslations[lang] || defaultEn;

    // Ensure customer.reviewLink
    if (!json.customer) json.customer = {};
    json.customer.reviewLink = trans.reviewLink;

    // Ensure review section
    json.review = {
      title: trans.title,
      subtitle: trans.subtitle,
      anonymousBadge: trans.anonymousBadge,
      ratingLabel: trans.ratingLabel,
      categoryLabel: trans.categoryLabel,
      contentLabel: trans.contentLabel,
      contentPlaceholder: trans.contentPlaceholder,
      emailNotice: trans.emailNotice,
      submitBtn: trans.submitBtn,
      submittingBtn: trans.submittingBtn,
      successTitle: trans.successTitle,
      successDesc: trans.successDesc,
      writeAnotherBtn: trans.writeAnotherBtn,
      homeBtn: trans.homeBtn,
      allServices: trans.allServices,
      emptyContentAlert: trans.emptyContentAlert
    };

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    updatedCount++;
    console.log(`Updated ${file} with review translations.`);
  } catch (err) {
    console.error(`Error updating ${file}:`, err);
  }
}

console.log(`Successfully updated ${updatedCount} message files.`);

