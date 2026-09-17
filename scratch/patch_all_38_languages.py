import json
import os

MESSAGES_DIR = "messages"

# 1. 38 Language Translations for Trust Metrics, Customer Partner Banner, Privacy Cards, and Category Filter Tabs
COMMON_I18N = {
    "ko": {
        "trustMetrics": {
            "languages": "38개국 언어 실시간 통역",
            "dispatch": "평균 15분 내 헬퍼 배정",
            "safeNumber": "전화번호 수집 제로 · 안심 대화"
        },
        "customer": {
            "allView": "전체 보기",
            "repairView": "긴급 수리",
            "supportView": "생활 지원",
            "partnerTitle": "LIFE.HELP 공식 헬퍼 파트너십",
            "partnerDesc": "100% 자율 일정으로 원하는 지역에서 활동하며 투명한 수익을 창출하세요.",
            "helperRegisterBtn": "헬퍼 등록 신청하기 →",
            "helperMasterBanner": "지역의 숙련된 기술자·전문가 헬퍼님을 모십니다"
        },
        "privacy": {
            "badge": "사생활 보호 안심 시스템",
            "title": "고객님의 개인 전화번호를 절대 수집하거나 저장하지 않습니다",
            "cardZeroPhoneTitle": "전화번호 수집 제로",
            "cardZeroPhoneDesc": "고객님의 실제 휴대폰 번호를 수집·저장하지 않아 스팸 및 유출 걱정이 없습니다.",
            "cardRealtimeChatTitle": "1:1 실시간 모국어 번역 대화",
            "cardRealtimeChatDesc": "모국어로 메시지를 보내면 헬퍼에게 자동 번역되어 막힘없이 소통합니다.",
            "cardVerifiedHelperTitle": "신원 검증된 공식 헬퍼",
            "cardVerifiedHelperDesc": "신원과 기술력이 철저히 검증된 지역 헬퍼만이 방문하여 안전하고 신뢰할 수 있습니다."
        }
    },
    "en": {
        "trustMetrics": {
            "languages": "Real-time Translation in 38 Languages",
            "dispatch": "Avg. 15-Min Helper Dispatch",
            "safeNumber": "Zero Phone Collection · Safe Chat"
        },
        "customer": {
            "allView": "View All",
            "repairView": "Emergency Repair",
            "supportView": "Life Support",
            "partnerTitle": "LIFE.HELP Official Helper Partnership",
            "partnerDesc": "Work flexibly on your own schedule in your preferred areas and earn transparent income.",
            "helperRegisterBtn": "Apply as Helper →",
            "helperMasterBanner": "Calling skilled technicians and expert helpers in the region"
        },
        "privacy": {
            "badge": "Privacy & Safety Protection System",
            "title": "We never collect or store your personal phone number",
            "cardZeroPhoneTitle": "Zero Phone Number Collection",
            "cardZeroPhoneDesc": "Your real phone number is neither collected nor stored, ensuring zero spam or leak risks.",
            "cardRealtimeChatTitle": "1:1 Real-time Native Translated Chat",
            "cardRealtimeChatDesc": "Send messages in your native language, automatically translated to Korean for helpers.",
            "cardVerifiedHelperTitle": "Verified Official Helpers",
            "cardVerifiedHelperDesc": "Only thoroughly vetted local helpers with verified skills visit your location safely."
        }
    },
    "vi": {
        "trustMetrics": {
            "languages": "Thông dịch thời gian thực 38 ngôn ngữ",
            "dispatch": "Điều phối người trợ giúp trung bình 15 phút",
            "safeNumber": "Không thu thập số điện thoại · Trò chuyện an tâm"
        },
        "customer": {
            "allView": "Xem tất cả",
            "repairView": "Sửa chữa khẩn cấp",
            "supportView": "Hỗ trợ đời sống",
            "partnerTitle": "Đối tác Người trợ giúp (Helper) chính thức LIFE.HELP",
            "partnerDesc": "Làm việc linh hoạt 100% theo lịch trình của bạn tại khu vực mong muốn với thu nhập minh bạch.",
            "helperRegisterBtn": "Đăng ký làm Người trợ giúp (Helper) →",
            "helperMasterBanner": "Tuyển dụng thợ lành nghề và chuyên gia trợ giúp tại các khu vực"
        },
        "privacy": {
            "badge": "Hệ thống bảo vệ quyền riêng tư an tâm",
            "title": "Chúng tôi tuyệt đối không thu thập hoặc lưu trữ số điện thoại cá nhân của bạn",
            "cardZeroPhoneTitle": "Không thu thập số điện thoại",
            "cardZeroPhoneDesc": "Không thu thập hay lưu trữ số điện thoại thật, loại bỏ hoàn toàn nỗi lo rò rỉ hay tin nhắn rác.",
            "cardRealtimeChatTitle": "Trò chuyện dịch thuật 1:1 theo thời gian thực",
            "cardRealtimeChatDesc": "Nhắn tin bằng tiếng mẹ đẻ, hệ thống tự động dịch sang tiếng Hàn để thợ tiếp nhận trôi chảy.",
            "cardVerifiedHelperTitle": "Người trợ giúp (Helper) chính thức đã xác minh",
            "cardVerifiedHelperDesc": "Chỉ những người trợ giúp khu vực đã được xác minh danh tính và tay nghề mới đến hỗ trợ bạn an toàn."
        }
    },
    "zh-Hans": {
        "trustMetrics": {
            "languages": "38种语言实时互译",
            "dispatch": "平均15分钟内调度服务助手",
            "safeNumber": "零手机号收集 · 安心沟通"
        },
        "customer": {
            "allView": "查看全部",
            "repairView": "紧急维修",
            "supportView": "生活支援",
            "partnerTitle": "LIFE.HELP 官方服务助手合作伙伴",
            "partnerDesc": "100%自主安排工作日程，在您心仪的地区接单并获得透明收益。",
            "helperRegisterBtn": "申请注册服务助手 →",
            "helperMasterBanner": "诚邀本地区熟练技术人员与专业服务助手加入"
        },
        "privacy": {
            "badge": "隐私安全保障系统",
            "title": "绝不收集或储存您的个人真实手机号码",
            "cardZeroPhoneTitle": "零手机号码收集",
            "cardZeroPhoneDesc": "不收集也不储存您的真实手机号，杜绝垃圾骚扰与信息泄露风险。",
            "cardRealtimeChatTitle": "1:1 母语实时翻译对话",
            "cardRealtimeChatDesc": "您用母语发送信息，助手端将自动翻译为韩语，沟通顺畅无阻。",
            "cardVerifiedHelperTitle": "实名认证官方服务助手",
            "cardVerifiedHelperDesc": "仅派遣经严格身份验证与技能审核的本地助手上门，安全值得信赖。"
        }
    },
    "zh-Hant": {
        "trustMetrics": {
            "languages": "38種語言即時互譯",
            "dispatch": "平均15分鐘內調度服務助手",
            "safeNumber": "零手機號收集 · 安心溝通"
        },
        "customer": {
            "allView": "查看全部",
            "repairView": "緊急維修",
            "supportView": "生活支援",
            "partnerTitle": "LIFE.HELP 官方服務助手合作夥伴",
            "partnerDesc": "100%自主安排工作日程，在您心儀的地區接單並獲得透明收益。",
            "helperRegisterBtn": "申請註冊服務助手 →",
            "helperMasterBanner": "誠邀本地區熟練技術人員與專業服務助手加入"
        },
        "privacy": {
            "badge": "隱私安全保障系統",
            "title": "絕不收集或儲存您的個人真實手機號碼",
            "cardZeroPhoneTitle": "零手機號碼收集",
            "cardZeroPhoneDesc": "不收集亦不儲存您的真實手機號，杜絕垃圾騷擾與資料外洩風險。",
            "cardRealtimeChatTitle": "1:1 母語即時翻譯對話",
            "cardRealtimeChatDesc": "您用母語傳送訊息，助手端將自動翻譯為韓語，溝通順暢無阻。",
            "cardVerifiedHelperTitle": "實名認證官方服務助手",
            "cardVerifiedHelperDesc": "僅派遣經嚴格身分驗證與技能審核的在地助手到府，安全值得信賴。"
        }
    },
    "ja": {
        "trustMetrics": {
            "languages": "38言語リアルタイム通訳",
            "dispatch": "平均15分以内にヘルパー手配",
            "safeNumber": "電話番号収集ゼロ · 安心チャット"
        },
        "customer": {
            "allView": "すべて表示",
            "repairView": "緊急修理",
            "supportView": "生活支援",
            "partnerTitle": "LIFE.HELP 公式ヘルパーパートナーシップ",
            "partnerDesc": "100%自由なスケジュールで希望エリアで活動し、透明性のある収入を得られます。",
            "helperRegisterBtn": "ヘルパー登録申請 →",
            "helperMasterBanner": "地域の熟練技術者・専門家ヘルパーを募集しています"
        },
        "privacy": {
            "badge": "プライバシー安心保護システム",
            "title": "お客様の個人電話番号を収集・保管することは一切ありません",
            "cardZeroPhoneTitle": "電話番号収集ゼロ",
            "cardZeroPhoneDesc": "お客様の実際の電話番号を収集・保存しないため、迷惑電話や流出の心配がありません。",
            "cardRealtimeChatTitle": "1:1 リアルタイム母国語翻訳チャット",
            "cardRealtimeChatDesc": "母国語でメッセージを送ると、ヘルパーには韓国語で自動翻訳されてスムーズに通じます。",
            "cardVerifiedHelperTitle": "身元確認済みの公式ヘルパー",
            "cardVerifiedHelperDesc": "身元と技術力が徹底して確認された地域ヘルパーのみが訪問するため、安全で信頼できます。"
        }
    },
    "ru": {
        "trustMetrics": {
            "languages": "Синхронный перевод на 38 языков",
            "dispatch": "Подбор помощника за 15 минут",
            "safeNumber": "Без сбора номеров · Безопасный чат"
        },
        "customer": {
            "allView": "Все услуги",
            "repairView": "Срочный ремонт",
            "supportView": "Помощь в жизни",
            "partnerTitle": "Официальное партнерство LIFE.HELP",
            "partnerDesc": "Работайте по свободному графику в удобном районе и получайте прозрачный доход.",
            "helperRegisterBtn": "Регистрация помощником →",
            "helperMasterBanner": "Приглашаем квалифицированных мастеров и специалистов региона"
        },
        "privacy": {
            "badge": "Система защиты конфиденциальности",
            "title": "Мы никогда не собираем и не сохраняем ваши личные телефонные номера",
            "cardZeroPhoneTitle": "Без сбора телефонных номеров",
            "cardZeroPhoneDesc": "Ваш реальный номер не собирается и не сохраняется, исключая спам и утечки.",
            "cardRealtimeChatTitle": "1:1 Чат с автопереводом на родной язык",
            "cardRealtimeChatDesc": "Пишите на родном языке — помощник мгновенно увидит сообщение на корейском.",
            "cardVerifiedHelperTitle": "Проверенные официальные помощники",
            "cardVerifiedHelperDesc": "К вам приедут только проверенные специалисты с подтвержденной квалификацией."
        }
    },
    "am": {
        "trustMetrics": {
            "languages": "በ38 ቋንቋዎች የቀጥታ ትርጉም",
            "dispatch": "በ15 ደቂቃ ውስጥ ረዳት ይመደባል",
            "safeNumber": "ስልክ ቁጥር አይሰበሰብም · አስተማማኝ ንግግር"
        },
        "customer": {
            "allView": "ሁሉንም ይመልከቱ",
            "repairView": "አስቸኳይ ጥገና",
            "supportView": "የኑሮ ድጋፍ",
            "partnerTitle": "የLIFE.HELP ይፋዊ ረዳት አጋርነት",
            "partnerDesc": "በራስዎ ምቹ የጊዜ ሰሌዳ በሚፈልጉት አካባቢ በመስራት ግልጽ ገቢ ያግኙ።",
            "helperRegisterBtn": "እንደ ረዳት ይመዝገቡ →",
            "helperMasterBanner": "በአካባቢው ያሉ ባለሙያዎችን እና የሰለጠኑ ረዳቶችን እንጋብዛለን"
        },
        "privacy": {
            "badge": "የግል መረጃ ጥበቃ ስርዓት",
            "title": "የግል ስልክ ቁጥርዎን በጭራሽ አንሰበስብም ወይም አናስቀምጥም",
            "cardZeroPhoneTitle": "ስልክ ቁጥር ፈጽሞ አይሰበሰብም",
            "cardZeroPhoneDesc": "ትክክለኛ ስልክ ቁጥርዎ ስለማይሰበሰብ አላስፈላጊ ጥሪዎች እና የመረጃ መፍሰስ ስጋት የለም።",
            "cardRealtimeChatTitle": "1:1 በቀጥታ የቋንቋ ትርጉም ውይይት",
            "cardRealtimeChatDesc": "በእራስዎ ቋንቋ መልእክት ሲልኩ ለረዳቱ በቀጥታ ወደ ኮሪያኛ ተተርጉሞ ይደርሳል።",
            "cardVerifiedHelperTitle": "ማንነታቸው የተረጋገጠ ይፋዊ ረዳቶች",
            "cardVerifiedHelperDesc": "ማንነታቸው እና ሙያዊ ችሎታቸው የተረጋገጠላቸው የአካባቢ ረዳቶች ብቻ በአስተማማኝ ሁኔታ ያገለግላሉ።"
        }
    },
    "uz": {
        "trustMetrics": {
            "languages": "38 tilda jonli tarjima",
            "dispatch": "O'rtacha 15 daqiqada yordamchi tayinlash",
            "safeNumber": "Telefon raqami yig'ilmaydi · Xavfsiz muloqot"
        },
        "customer": {
            "allView": "Barchasi",
            "repairView": "Tezkor ta'mirlash",
            "supportView": "Hayotiy yordam",
            "partnerTitle": "LIFE.HELP rasmiy yordamchi hamkorligi",
            "partnerDesc": "Ixtiyoriy jadval bo'yicha o'zingiz xohlagan hududda ishlang va shaffof daromad oling.",
            "helperRegisterBtn": "Yordamchi sifatida ro'yxatdan o'tish →",
            "helperMasterBanner": "Hududdagi malakali ustalar va mutaxassislarni taklif qilamiz"
        },
        "privacy": {
            "badge": "Maxfiylikni himoya qilish tizimi",
            "title": "Shaxsiy telefon raqamingiz hech qachon to'planmaydi yoki saqlanmaydi",
            "cardZeroPhoneTitle": "Telefon raqami yig'ilmaydi",
            "cardZeroPhoneDesc": "Haqiqiy telefon raqamingiz saqlanmaydi, spam yoki sizib chiqish xavfi mutlaqo yo'q.",
            "cardRealtimeChatTitle": "Ona tilida 1:1 jonli tarjima suhbati",
            "cardRealtimeChatDesc": "Ona tilingizda yozasiz, yordamchiga esa koreys tilida tushunarli tarjima qilinadi.",
            "cardVerifiedHelperTitle": "Tekshirilgan rasmiy yordamchilar",
            "cardVerifiedHelperDesc": "Faqat shaxsi va mahorati tekshirilgan mahalliy yordamchilar xavfsiz xizmat ko'rsatadi."
        }
    },
    "th": {
        "trustMetrics": {
            "languages": "แปลภาษาแบบเรียลไทม์ 38 ภาษา",
            "dispatch": "จัดหาผู้ช่วยภายในเฉลี่ย 15 นาที",
            "safeNumber": "ไม่เก็บเบอร์โทรศัพท์ · แชทปลอดภัย"
        },
        "customer": {
            "allView": "ดูทั้งหมด",
            "repairView": "ซ่อมแซมฉุกเฉิน",
            "supportView": "ช่วยเหลือการใช้ชีวิต",
            "partnerTitle": "พันธมิตรผู้ช่วยอย่างเป็นทางการ LIFE.HELP",
            "partnerDesc": "ทำงานตามตารางเวลาที่คุณเลือกเองในพื้นที่ที่คุณต้องการ พร้อมรายได้ที่โปร่งใส",
            "helperRegisterBtn": "สมัครเป็นผู้ช่วย →",
            "helperMasterBanner": "เปิดรับช่างผู้เชี่ยวชาญและผู้ช่วยมืออาชีพในพื้นที่"
        },
        "privacy": {
            "badge": "ระบบปกป้องความเป็นส่วนตัวที่ปลอดภัย",
            "title": "เราไม่มีการเก็บหรือบันทึกหมายเลขโทรศัพท์ส่วนตัวของคุณอย่างเด็ดขาด",
            "cardZeroPhoneTitle": "ไม่เก็บหมายเลขโทรศัพท์",
            "cardZeroPhoneDesc": "ไม่มีการเก็บหรือบันทึกเบอร์จริง จึงหมดกังวลเรื่องสแปมหรือข้อมูลรั่วไหล",
            "cardRealtimeChatTitle": "แชทแปลภาษาแบบ 1:1 เรียลไทม์",
            "cardRealtimeChatDesc": "ส่งข้อความด้วยภาษาของคุณ ระบบจะแปลเป็นภาษาเกาหลีให้ผู้ช่วยทันทีเพื่อการสื่อสารที่ราบรื่น",
            "cardVerifiedHelperTitle": "ผู้ช่วยอย่างเป็นทางการที่ผ่านการตรวจสอบ",
            "cardVerifiedHelperDesc": "เฉพาะผู้ช่วยในพื้นที่ที่ผ่านการตรวจสอบประวัติและทักษะอย่างละเอียดเท่านั้นที่จะไปให้บริการคุณอย่างปลอดภัย"
        }
    },
    "mn": {
        "trustMetrics": {
            "languages": "38 хэлний шууд орчуулга",
            "dispatch": "Дунджаар 15 минутад туслагч томилно",
            "safeNumber": "Утасны дугаар авахгүй · Аюулгүй чат"
        },
        "customer": {
            "allView": "Бүгдийг харах",
            "repairView": "Яаралтай засвар",
            "supportView": "Ахуйн туслалцаа",
            "partnerTitle": "LIFE.HELP албан ёсны туслагчийн түншлэл",
            "partnerDesc": "Хүссэн бүсдээ өөрийн чөлөөт цагаар ажиллаж, ил тод орлого олоорой.",
            "helperRegisterBtn": "Туслагчаар бүртгүүлэх →",
            "helperMasterBanner": "Бүс нутгийн чадварлаг засварчин, мэргэжилтнүүдийг урьж байна"
        },
        "privacy": {
            "badge": "Хувийн нууцыг хамгаалах найдвартай систем",
            "title": "Бид таны хувийн утасны дугаарыг огт цуглуулж хадгалахгүй",
            "cardZeroPhoneTitle": "Утасны дугаар авахгүй",
            "cardZeroPhoneDesc": "Бодит утасны дугаар хадгалагддаггүй тул спам болон мэдээлэл алдагдахаас санаа зоволтгүй.",
            "cardRealtimeChatTitle": "1:1 төрөлх хэлний шууд орчуулгатай чат",
            "cardRealtimeChatDesc": "Төрөлх хэлээрээ зурвас илгээхэд туслагчид солонгос хэл рүү автоматаар орчуулагдана.",
            "cardVerifiedHelperTitle": "Баталгаажсан албан ёсны туслагч",
            "cardVerifiedHelperDesc": "Хувийн бичиг баримт, ур чадвар нь сайтар шалгагдсан нутгийн туслагч очих тул найдвартай."
        }
    }
}

# 2. Amharic comprehensive translations for services, service descriptions, and support form
AM_DATA = {
    "service": {
        "toilet": "የመጸዳጃ ቤት መዘጋት",
        "sink": "የእጅ መታጠቢያ መዘጋት",
        "drain": "የፍሳሽ ማስወገጃ ቱቦ መዘጋት",
        "leak": "የውሃ መፍሰስ",
        "detection": "የውሃ መፍሰስን መለየት",
        "water": "የውሃ አቅርቦት መስመር",
        "plumbing": "የቧንቧ ጥገና",
        "boiler": "ቦይለር እና ማሞቂያ ጥገና",
        "cleaning": "ልዩ ባለሙያ ጽዳት",
        "housing": "ቤት/ክፍል መፈለግ",
        "clog": "የመጸዳጃ ቤት፣ የእጅ መታጠቢያና የፍሳሽ ቱቦ መዘጋት መፍታት",
        "leakPlumbing": "የውሃ መፍሰስ መከላከል፣ መፈለግና የቧንቧ ስራዎች",
        "bankHelp": "የባንክ ሂሳብ መክፈት እርዳታ",
        "insuranceHelp": "የኢንሹራንስ ምዝገባ እርዳታ",
        "jobHelp": "የሥራ ፍለጋ እና ቅጥር እርዳታ",
        "hospitalHelp": "የሆስፒታል አጃቢ እና የህክምና ትርጉም",
        "mobileHelp": "የሞባይል ስልክ ሲም ካርድ መክፈት እርዳታ"
    },
    "serviceDesc": {
        "clog": "የመጸዳጃ ቤት፣ የእጅ መታጠቢያ እና የፍሳሽ ማስወገጃ ቱቦዎች መዘጋትን በልዩ መሳሪያዎች በ24 ሰዓት ውስጥ በፍጥነት እንፈታለን።",
        "leakPlumbing": "የውሃ መፍሰስን በዘመናዊ መመርመሪያ መሳሪያዎች እንለያለን፣ አሮጌ ቧንቧዎችን እንቀይራለን እንዲሁም የውሃ መከላከያ ስራ እንሰራለን።",
        "boiler": "የጋዝ ቦይለር መቀየር፣ የሞቀ ውሃ እና የማሞቂያ ቱቦዎች ጽዳት እንዲሁም የሙቀት መቆጣጠሪያ ስህተቶችን እንጠግናለን።",
        "cleaning": "የቤት መግቢያና መውጫ ጽዳት፣ ሻጋታ እና ቆሻሻን በእንፋሎት ማጽዳት እንዲሁም የአየር ማቀዝቀዣ ጥልቅ ጽዳት እንሰጣለን።",
        "housing": "ለውጭ ዜጎች ምቹ የሆኑ ስቱዲዮ እና አፓርታማዎችን እንፈልጋለን፣ የኪራይ ውልን እንመረምራለን እና ተቀማጭ ገንዘብዎን እናስጠብቃለን።",
        "jobHelp": "በህጋዊ ቪዛ ላይ የተመሰረተ ተስማሚ የስራ ቦታዎችን እናገናኛለን፣ ሲቪ እንጽፋለን እንዲሁም ከቀጣሪዎች ጋር እናገናኛለን።",
        "mobileHelp": "ለውጭ ዜጎች በስማቸው የሚሆን የቅድመ/ድህረ ክፍያ ሲም ካርድ፣ ያልተገደበ ዳታ እና የቤት ውስጥ ዋይፋይ እናመቻቻለን።",
        "hospitalHelp": "የሆስፒታል ቀጠሮ መያዝ፣ አብሮ መሄድ፣ ከዶክተር ጋር የህክምና ትርጉም እና የመድሃኒት መመሪያዎችን በቋንቋዎ እንተረጉማለን።",
        "bankHelp": "በውጭ ዜጋ መታወቂያ የባንክ ሂሳብ መክፈት፣ የቼክ/ክሬዲት ካርድ ማውጣት እና ወደ ሀገር ቤት ገንዘብ መላክን እናመቻቻለን።",
        "insuranceHelp": "የብሄራዊ ጤና ኢንሹራንስ ምዝገባ፣ የግዴታ የውጭ ዜጎች ኢንሹራንስ እና የካሳ ጥያቄ ሰነዶችን በቋንቋዎ እንረዳለን።"
    },
    "support": {
        "badge050": "🔒 የተጠበቀ የግል መረጃ · 1:1 የቀጥታ ውይይት",
        "requestTab": "💡 እርዳታ ይጠይቁ (ተጠቃሚ)",
        "partnerTab": "🤝 እንደ ረዳት ይመዝገቡ",
        "successTitle": "የአገልግሎት ጥያቄዎ በተሳካ ሁኔታ ተልኳል!",
        "successDesc": "የተጠየቀው አገልግሎት በአቅራቢያዎ ለሚገኝ የLIFE.HELP ረዳት ወዲያውኑ ተልኳል።",
        "safePhoneLabel": "📞 የአመልካች ስልክ ቁጥር",
        "privacyBadge": "ምዝገባ ተጠናቋል",
        "realPhoneHidden": "ስልክ ቁጥርዎ በደህና ሁኔታ ተመዝግቧል። የተመደበው ረዳት በ1:1 ውይይት ወዲያውኑ ይገናኝዎታል።",
        "serviceLabel": "የተመረጠ አገልግሎት",
        "regionLabel": "አገልግሎት የሚሰጥበት አካባቢ",
        "selectedNeedsLabel": "የተመረጡ የችግር ዝርዝሮች",
        "memoLabel": "ተጨማሪ ማስታወሻ",
        "submitAnother": "ሌላ አገልግሎት ይጠይቁ",
        "backHome": "ወደ መነሻ ገጽ ይመለሱ",
        "homeNav": "መነሻ",
        "whatHelpTitle": "ምን ዓይነት እርዳታ ይፈልጋሉ?",
        "whatHelpDesc": "የሚያስፈልጉዎትን ዝርዝሮች ይምረጡ (ከአንድ በላይ መምረጥ ይችላሉ)።",
        "contactPhoneLabel": "የእርስዎ ስልክ ቁጥር",
        "safe050Title": "የግል መረጃ ጥበቃ",
        "safe050Desc": "ስልክ ቁጥርዎ ደህንነቱ በተጠበቀ መልኩ የተጠበቀ ሲሆን ለተመደበው ረዳት ብቻ ለግንኙነት ይተላለፋል።",
        "phoneInputLabel": "የስልክ ቁጥርዎን ያስገቡ",
        "memoInputLabel": "ተጨማሪ ማብራሪያ ወይም ጥያቄ (አማራጭ)",
        "memoPlaceholder": "ለምሳሌ፡ አስቸኳይ ነው፣ ቅዳሜ ከሰዓት በኋላ ቢሆን ይመረጣል...",
        "submitBtn": "🤝 እርዳታ አሁን ይጠይቁ",
        "phoneError": "እባክዎ ትክክለኛ የስልክ ቁጥር ያስገቡ (ቢያንስ 9 ድጂት)።",
        "needsError": "እባክዎ ቢያንስ አንድ የችግር ዝርዝር ይምረጡ።",
        "providerTitle": "የLIFE.HELP ረዳት ምዝገባ ማመልከቻ",
        "providerDesc": "በሚኖሩበት አካባቢ የውጭ ዜጎችን በሙያዎ በመርዳት አስተማማኝና ግልጽ ገቢ ያግኙ።",
        "providerNameLabel": "የስራ ስም ወይም የድርጅት ስም *",
        "providerPhoneLabel": "የእርስዎ የስልክ ቁጥር *",
        "providerCatLabel": "ሊረዱባቸው የሚችሉ የአገልግሎት ዘርፎች (ከአንድ በላይ ይቻላል) *",
        "providerRegionLabel": "የስራ አካባቢ",
        "providerBioLabel": "የስራ ልምድ ወይም አጭር ማስተዋወቂያ",
        "providerBioPlaceholder": "ለምሳሌ፡ የ5 ዓመት የቧንቧ ስራ ልምድ አለኝ፣ እንግሊዝኛ እና ኮሪያኛ እናገራለሁ...",
        "feeAgreementTitle": "የመድረክ አጠቃቀም እና የአገልግሎት ውል ስምምነት",
        "feeRuleTitle": "የአገልግሎት ውል መመሪያዎች:",
        "feeRule1": "1. ረዳቱ የደንበኛውን ጥያቄ በታማኝነት እና በሰዓቱ የማስተናገድ ግዴታ አለበት።",
        "feeRule2": "2. ለደንበኞች የሚሰጠው አገልግሎት ጥራት እና ደህንነት የተረጋገጠ መሆን አለበት።",
        "feeRule3": "3. በውሉ መሰረት የሚከናወኑ ስራዎች ግልጽ በሆነ የአሰራር ስርዓት የሚመሩ ናቸው።",
        "feeAgreeCheck": "የመድረኩን የአገልግሎት ደንብ እና መመሪያዎችን አንብቤ ተስማምቻለሁ።",
        "providerSubmitBtn": "🎖️ እንደ ረዳት ይመዝገቡ",
        "providerSuccessTitle": "የረዳት ምዝገባ ማመልከቻዎ ደርሶናል!",
        "providerSuccessDesc": "ማመልከቻዎ በተሳካ ሁኔታ ተመዝግቧል። የስራ ፍቃድዎ ሲረጋገጥ ወዲያውኑ ስራ መጀመር ይችላሉ።",
        "helperPortal": "የረዳት ፖርታልን ይክፈቱ",
        "safe050Tag": "🔒 ደህንነቱ የተጠበቀ ግንኙነት"
    }
}

# 3. Vietnamese comprehensive descriptions and support form keys
VI_DATA = {
    "serviceDesc": {
        "clog": "Xử lý thông tắc khẩn cấp bồn cầu trào ngược, bồn rửa bát, cống sàn bằng thiết bị chuyên dụng và áp lực cao 24/7.",
        "leakPlumbing": "Dò tìm rò rỉ nước chính xác bằng máy siêu âm, sửa chữa đường ống nước cũ hỏng và thi công chống thấm chuyên nghiệp.",
        "boiler": "Lắp đặt và sửa chữa bình nóng lạnh, nồi hơi sưởi ấm sàn nhà, súc rửa đường ống nước nóng và khắc phục mã lỗi.",
        "cleaning": "Dọn dẹp nhà chuyển vào ở mới cho căn hộ/phòng trọ, khử khuẩn nấm mốc bằng hơi nước nóng, vệ sinh máy lạnh.",
        "housing": "Giới thiệu phòng trọ/căn hộ đầy đủ tiện nghi cho người nước ngoài, kiểm tra hợp đồng thuê bảo toàn tiền cọc.",
        "jobHelp": "Kết nối việc làm phù hợp theo visa cư trú hợp pháp, hỗ trợ viết CV và kết nối chủ doanh nghiệp uy tín.",
        "mobileHelp": "Đăng ký mở mạng SIM trả trước/trả sau đứng tên người nước ngoài, SIM xác thực danh tính và Wi-Fi gia đình.",
        "hospitalHelp": "Đặt lịch khám chuyên khoa, đồng hành thông dịch y tế tại bệnh viện và hướng dẫn sử dụng thuốc an tâm.",
        "bankHelp": "Hỗ trợ mở tài khoản ngân hàng bằng thẻ ARC/Hộ chiếu, phát hành thẻ ngân hàng và chuyển tiền quốc tế.",
        "insuranceHelp": "Xác nhận & đăng ký Bảo hiểm Y tế Quốc dân, bảo hiểm bắt buộc theo visa và hướng dẫn hồ sơ bồi thường."
    },
    "support": {
        "badge050": "🔒 Bảo mật quyền riêng tư · Trò chuyện trực tiếp 1:1",
        "requestTab": "💡 Yêu cầu trợ giúp (Khách hàng)",
        "partnerTab": "🤝 Đăng ký Người trợ giúp (Helper)",
        "successTitle": "Yêu cầu dịch vụ đã được gửi thành công!",
        "successDesc": "Nội dung yêu cầu đã được chuyển ngay đến Người trợ giúp (Helper) phụ trách tại khu vực của bạn.",
        "safePhoneLabel": "📞 Số điện thoại người đăng ký",
        "privacyBadge": "Tiếp nhận hoàn tất",
        "realPhoneHidden": "Số điện thoại của bạn được bảo vệ an toàn và Người trợ giúp sẽ liên hệ hỗ trợ ngay qua trò chuyện 1:1.",
        "serviceLabel": "Dịch vụ đã chọn",
        "regionLabel": "Khu vực áp dụng",
        "selectedNeedsLabel": "Nội dung vấn đề đã chọn",
        "memoLabel": "Ghi chú thêm",
        "submitAnother": "Yêu cầu dịch vụ khác",
        "backHome": "Quay lại trang chủ",
        "homeNav": "Trang chủ",
        "whatHelpTitle": "Bạn cần hỗ trợ điều gì cụ thể?",
        "whatHelpDesc": "Vui lòng chọn các mục bạn cần hỗ trợ (có thể chọn nhiều mục).",
        "contactPhoneLabel": "Số điện thoại liên hệ",
        "safe050Title": "Bảo vệ thông tin cá nhân",
        "safe050Desc": "Số điện thoại của bạn được mã hóa an toàn và chỉ cung cấp cho Người trợ giúp phụ trách công việc.",
        "phoneInputLabel": "Nhập số điện thoại của bạn",
        "memoInputLabel": "Chi tiết vấn đề hoặc yêu cầu thêm (Tùy chọn)",
        "memoPlaceholder": "VD: Cần hỗ trợ gấp trong ngày, ưu tiên buổi chiều...",
        "submitBtn": "🤝 Yêu cầu trợ giúp ngay",
        "phoneError": "Vui lòng nhập số điện thoại hợp lệ (ít nhất 9 chữ số).",
        "needsError": "Vui lòng chọn ít nhất một nội dung cần hỗ trợ.",
        "providerTitle": "Đơn đăng ký Người trợ giúp (Helper) LIFE.HELP",
        "providerDesc": "Hãy tận dụng kỹ năng chuyên môn của bạn để hỗ trợ cộng đồng và tạo nguồn thu nhập minh bạch.",
        "providerNameLabel": "Tên hoặc tên công ty/đơn vị *",
        "providerPhoneLabel": "Số điện thoại liên hệ *",
        "providerCatLabel": "Lĩnh vực có thể hỗ trợ (Chọn nhiều mục) *",
        "providerRegionLabel": "Khu vực hoạt động",
        "providerBioLabel": "Kinh nghiệm hoặc giới thiệu bản thân",
        "providerBioPlaceholder": "VD: Có 5 năm kinh nghiệm sửa chữa điện nước, giao tiếp tốt tiếng Hàn và tiếng Việt...",
        "feeAgreementTitle": "Quy định dịch vụ & Cam kết hoạt động",
        "feeRuleTitle": "Điều khoản hoạt động:",
        "feeRule1": "1. Người trợ giúp cam kết hỗ trợ khách hàng tận tâm, trung thực và đúng hẹn.",
        "feeRule2": "2. Đảm bảo an toàn kỹ thuật và chất lượng dịch vụ khi đến hiện trường.",
        "feeRule3": "3. Đồng ý với chính sách kết nối và phí dịch vụ minh bạch của nền tảng.",
        "feeAgreeCheck": "Tôi đã đọc và đồng ý với các điều khoản hoạt động của LIFE.HELP.",
        "providerSubmitBtn": "🎖️ Đăng ký làm Người trợ giúp",
        "providerSuccessTitle": "Đã tiếp nhận đăng ký Người trợ giúp!",
        "providerSuccessDesc": "Hồ sơ của bạn đã được ghi nhận. Bạn có thể bắt đầu nhận việc ngay khi tài khoản được kích hoạt.",
        "helperPortal": "Mở cổng thông tin Người trợ giúp",
        "safe050Tag": "🔒 Kết nối an toàn"
    }
}

# 4. Korean base support data
KO_SUPPORT = {
    "badge050": "🔒 사생활 보호 안심 대화 · 1:1 실시간 연결",
    "requestTab": "💡 도움 신청하기 (수요자)",
    "partnerTab": "🤝 헬퍼 등록 (전문가)",
    "successTitle": "서비스 신청이 정상 접수되었습니다!",
    "successDesc": "고객님의 요청 사항이 인근 지역의 검증된 전문 헬퍼님께 즉시 안전하게 전달되었습니다.",
    "safePhoneLabel": "📞 신청자 연락처",
    "privacyBadge": "접수 완료",
    "realPhoneHidden": "고객님의 연락처가 안전하게 전달되었으며, 배정된 헬퍼님이 1:1 대화로 즉시 안내해 드립니다.",
    "serviceLabel": "선택 서비스",
    "regionLabel": "활동/신청 지역",
    "selectedNeedsLabel": "선택하신 요청 사항",
    "memoLabel": "추가 전달 사항",
    "submitAnother": "다른 서비스 추가 신청",
    "backHome": "홈으로 돌아가기",
    "homeNav": "홈",
    "whatHelpTitle": "어떤 도움이 필요하신가요?",
    "whatHelpDesc": "해당하는 항목을 모두 선택해 주세요 (복수 선택 가능).",
    "contactPhoneLabel": "신청자 연락처",
    "safe050Title": "개인정보 안심 보호",
    "safe050Desc": "고객님의 연락처는 스팸 방지를 위해 안전하게 보호되며 배정된 전담 헬퍼에게만 연결됩니다.",
    "phoneInputLabel": "연락받으실 전화번호 입력",
    "memoInputLabel": "추가 설명 또는 요청사항 (선택사항)",
    "memoPlaceholder": "예: 평일 오후 방문 희망, 계단 작업 필요 등 구체적인 상황을 적어주세요.",
    "submitBtn": "🤝 도움 신청하기",
    "phoneError": "올바른 연락처 번호를 입력해 주세요 (9자리 이상).",
    "needsError": "필요하신 요청 사항을 1개 이상 선택해 주세요.",
    "providerTitle": "LIFE.HELP 공식 헬퍼 등록 신청",
    "providerDesc": "내가 가진 기술과 언어 능력으로 거주 지역에서 자유롭게 활동하며 투명한 수익을 창출하세요.",
    "providerNameLabel": "헬퍼 성함 또는 업체명 *",
    "providerPhoneLabel": "헬퍼 연락처 번호 *",
    "providerCatLabel": "활동 가능한 전문 분야 (복수 선택 가능) *",
    "providerRegionLabel": "활동 희망 지역",
    "providerBioLabel": "주요 경력 및 간단 소개",
    "providerBioPlaceholder": "예: 누수탐지 10년 경력, 한국어·베트남어 소통 가능, 공휴일 출동 가능 등",
    "feeAgreementTitle": "플랫폼 운영 및 파트너십 규정 동의",
    "feeRuleTitle": "활동 규정 안내:",
    "feeRule1": "1. 헬퍼는 고객의 요청에 성실하고 친절하게 응대하며 신속한 서비스를 제공합니다.",
    "feeRule2": "2. 현장 방문 시 안전 수칙을 준수하고 투명한 견적과 정직한 시공을 약속합니다.",
    "feeRule3": "3. 플랫폼 연결 알선 수수료 및 운영 정책을 준수합니다.",
    "feeAgreeCheck": "LIFE.HELP 헬퍼 활동 규정 및 수수료 정책을 확인하였으며 이에 동의합니다.",
    "providerSubmitBtn": "🎖️ 공식 헬퍼 등록 신청",
    "providerSuccessTitle": "헬퍼 등록 신청이 완료되었습니다!",
    "providerSuccessDesc": "작성하신 헬퍼 정보가 등록되었습니다. 워크스페이스에서 활동 상태와 일정을 관리하실 수 있습니다.",
    "helperPortal": "헬퍼 포털 바로가기",
    "safe050Tag": "🔒 안심 연결"
}

# 5. English base support data
EN_SUPPORT = {
    "badge050": "🔒 Complete Privacy · 1:1 Real-time Chat",
    "requestTab": "💡 Request Help (Seeker)",
    "partnerTab": "🤝 Register as Helper (Provider)",
    "successTitle": "Your service request has been received!",
    "successDesc": "Your request has been safely dispatched to a verified local helper in your area.",
    "safePhoneLabel": "📞 Applicant Contact",
    "privacyBadge": "Request Received",
    "realPhoneHidden": "Your contact information is safely secured and the assigned helper will connect via 1:1 chat immediately.",
    "serviceLabel": "Selected Service",
    "regionLabel": "Service Area",
    "selectedNeedsLabel": "Selected Request Items",
    "memoLabel": "Additional Memo",
    "submitAnother": "Request Another Service",
    "backHome": "Back to Home",
    "homeNav": "Home",
    "whatHelpTitle": "What specific assistance do you need?",
    "whatHelpDesc": "Select all items you need help with (multiple selections allowed).",
    "contactPhoneLabel": "Your Contact Number",
    "safe050Title": "Privacy Protection",
    "safe050Desc": "Your phone number is securely protected and shared only with your assigned helper.",
    "phoneInputLabel": "Enter your phone number",
    "memoInputLabel": "Additional Details or Requests (Optional)",
    "memoPlaceholder": "e.g., Urgent visit needed, preferred in the afternoon, elevator available...",
    "submitBtn": "🤝 Request Assistance Now",
    "phoneError": "Please enter a valid phone number (at least 9 digits).",
    "needsError": "Please select at least one assistance item.",
    "providerTitle": "LIFE.HELP Official Helper Application",
    "providerDesc": "Use your skills and expertise to assist international residents in your area and earn transparent income.",
    "providerNameLabel": "Name or Business Name *",
    "providerPhoneLabel": "Helper Phone Number *",
    "providerCatLabel": "Available Service Categories (Select all that apply) *",
    "providerRegionLabel": "Active Operating Region",
    "providerBioLabel": "Experience & Brief Introduction",
    "providerBioPlaceholder": "e.g., 10 years experience in plumbing, fluent in English & Korean, available weekends...",
    "feeAgreementTitle": "Platform Terms & Partnership Agreement",
    "feeRuleTitle": "Operating Guidelines:",
    "feeRule1": "1. Helpers agree to respond faithfully and politely to customer requests with punctual service.",
    "feeRule2": "2. Maintain safety standards and provide transparent pricing and honest quality work.",
    "feeRule3": "3. Comply with the platform's matchmaking policy and transparent fee structure.",
    "feeAgreeCheck": "I have read and agree to the LIFE.HELP Helper Operating Guidelines and Fee Policy.",
    "providerSubmitBtn": "🎖️ Apply as Official Helper",
    "providerSuccessTitle": "Helper application submitted successfully!",
    "providerSuccessDesc": "Your profile has been registered. You can manage your availability and schedule in the workspace.",
    "helperPortal": "Open Helper Portal",
    "safe050Tag": "🔒 Safe Connect"
}

def update_messages():
    count = 0
    for filename in os.listdir(MESSAGES_DIR):
        if not filename.endswith(".json"):
            continue
        locale_code = filename[:-5]
        filepath = os.path.join(MESSAGES_DIR, filename)

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Inject Trust Metrics & Privacy & Customer Buttons
        common = COMMON_I18N.get(locale_code, COMMON_I18N["en"])
        
        # trustMetrics
        if "trustMetrics" not in data:
            data["trustMetrics"] = {}
        data["trustMetrics"].update(common.get("trustMetrics", COMMON_I18N["en"]["trustMetrics"]))

        # customer
        if "customer" not in data:
            data["customer"] = {}
        data["customer"].update(common.get("customer", COMMON_I18N["en"]["customer"]))

        # privacy
        if "privacy" not in data:
            data["privacy"] = {}
        data["privacy"].update(common.get("privacy", COMMON_I18N["en"]["privacy"]))

        # 2. Locale specific updates
        if locale_code == "ko":
            if "support" not in data:
                data["support"] = {}
            data["support"].update(KO_SUPPORT)
        elif locale_code == "am":
            if "service" not in data:
                data["service"] = {}
            data["service"].update(AM_DATA["service"])
            if "serviceDesc" not in data:
                data["serviceDesc"] = {}
            data["serviceDesc"].update(AM_DATA["serviceDesc"])
            if "support" not in data:
                data["support"] = {}
            data["support"].update(AM_DATA["support"])
        elif locale_code == "vi":
            if "serviceDesc" not in data:
                data["serviceDesc"] = {}
            data["serviceDesc"].update(VI_DATA["serviceDesc"])
            if "support" not in data:
                data["support"] = {}
            data["support"].update(VI_DATA["support"])
        else:
            # For other locales, ensure support has full fallback keys so no raw keys display
            if "support" not in data:
                data["support"] = {}
            for k, v in EN_SUPPORT.items():
                if k not in data["support"] or data["support"][k] == f"support.{k}":
                    data["support"][k] = v

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        count += 1
        print(f"Patched {filename}")

    print(f"Total files updated: {count}")

if __name__ == "__main__":
    update_messages()

