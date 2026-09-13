# scripts/patch_remaining_ws.py
import json
import os
import sys

# Ensure UTF-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MESSAGES_DIR = os.path.join(ROOT_DIR, "messages")

EXTRA_WS = {
  "bn": {
    "removeRegionTitle": "অঞ্চল অপসারণ",
    "setHours": "নির্ধারিত সময়",
    "contractName": "পূর্ণ নাম",
    "contractPhone": "মোবাইল নম্বর",
    "contractResidentId": "পরিচয়পত্র নম্বর (গোপনীয়)",
    "contractSignedAt": "চুক্তির তারিখ ও সময়",
    "contractClauseTitle": "বাধ্যবাধকতা ও বিজ্ঞপ্তি ধারা",
    "contractClauseDesc": "সহায়তাকারী কাজ করতে অক্ষম হলে বা অঞ্চল পরিবর্তিত হলে সাথে সাথে জানানোর প্রতিশ্রুতি দিয়েছেন।",
    "contractSignature": "ইলেকট্রনিক স্বাক্ষর নিশ্চিত হয়েছে",
    "close": "বন্ধ করুন",
    "minServiceAlert": "কমপক্ষে একটি সেবা বজায় রাখতে হবে।",
    "serviceRemoved": "সেবা বিভাগটি সরানো হয়েছে।",
    "serviceAdded": "নতুন সেবা সফলভাবে যোগ হয়েছে।",
    "regionAdded": "অঞ্চল যুক্ত হয়েছে।",
    "minRegionAlert": "কমপক্ষে একটি অঞ্চল থাকতে হবে।",
    "regionRemoved": "অঞ্চলটি সরানো হয়েছে।",
    "minDayAlert": "কমপক্ষে একটি দিন নির্বাচন করুন।",
    "daysUpdated": "কর্মদিবস আপডেট হয়েছে।",
    "logoutConfirm": "আপনি কি নিশ্চিতভাবে লগআউট করতে চান?"
  },
  "fa": {
    "removeRegionTitle": "حذف منطقه",
    "setHours": "ساعات تعیین‌شده",
    "contractName": "نام و نام خانوادگی",
    "contractPhone": "شماره تلفن همراه",
    "contractResidentId": "شماره شناسایی (پوشانده شده)",
    "contractSignedAt": "تاریخ و زمان امضا",
    "contractClauseTitle": "بند تعهدات و اطلاع‌رسانی",
    "contractClauseDesc": "متخصص متعهد می‌شود در صورت عدم امکان حضور یا تغییر منطقه فوراً اطلاع دهد.",
    "contractSignature": "امضای الکترونیکی تأیید شد",
    "close": "بستن",
    "minServiceAlert": "حداقل یک حوزه خدمت باید فعال باشد.",
    "serviceRemoved": "حوزه خدمت حذف شد.",
    "serviceAdded": "حوزه خدمت جدید اضافه شد.",
    "regionAdded": "منطقه به محدوده خدمات اضافه شد.",
    "minRegionAlert": "حداقل یک منطقه باید تعیین شود.",
    "regionRemoved": "منطقه از محدوده حذف شد.",
    "minDayAlert": "حداقل یک روز باید انتخاب شود.",
    "daysUpdated": "روزهای کاری به‌روزرسانی شد.",
    "logoutConfirm": "آیا مطمئن هستید که می‌خواهید خارج شوید؟"
  },
  "he": {
    "removeRegionTitle": "הסרת אזור",
    "setHours": "שעות מוגדרות",
    "contractName": "שם מלא",
    "contractPhone": "מספר נייד",
    "contractResidentId": "מספר ת.ז. (מוסתר)",
    "contractSignedAt": "מועד החתימה",
    "contractClauseTitle": "סעיף התחייבות והודעה על שינויים",
    "contractClauseDesc": "המומחה מתחייב להודיע באופן מיידי על חוסر זמינות או שינוי באזור הפעילות.",
    "contractSignature": "חתימה אלקטרונית מאושרת",
    "close": "סגור",
    "minServiceAlert": "יש לשמור לפחות על תחום שירות פעיל אחד.",
    "serviceRemoved": "תחום השירות הוסר בהצלחה.",
    "serviceAdded": "תחום שירות חדש נוסף בהצלחה.",
    "regionAdded": "האזור נוסף לאזורי השירות.",
    "minRegionAlert": "יש להגדיר לפחות אזור פעילות אחד.",
    "regionRemoved": "האזור הוסר מאזורי השירות.",
    "minDayAlert": "יש לבחור לפחות יום פעילות אחד.",
    "daysUpdated": "ימי הפעילות עודכנו.",
    "logoutConfirm": "האם אתה בטוח שברצונך להתנתק ממרחב העבודה?"
  },
  "kk": {
    "removeRegionTitle": "Аймақты жою",
    "setHours": "Бекітілген жұмыс уақыты",
    "contractName": "Толық аты-жөні",
    "contractPhone": "Ұялы телефон нөмірі",
    "contractResidentId": "ЖСН (жасырын)",
    "contractSignedAt": "Қол қойылған уақыты",
    "contractClauseTitle": "Міндеттемелер мен хабарлау талаптары",
    "contractClauseDesc": "Маман қызмет көрсете алмаған жағдайда немесе аймақ өзгергенде дереу хабарлауға міндеттенеді.",
    "contractSignature": "Электрондық қолтаңба расталды",
    "close": "Жабу",
    "minServiceAlert": "Кемінде бір қызмет түрі белсенді болуы керек.",
    "serviceRemoved": "Қызмет түрі алынып тасталды.",
    "serviceAdded": "Жаңа қызмет түрі қосылды.",
    "regionAdded": "Аймақ қызмет көрсету аумағына қосылды.",
    "minRegionAlert": "Кемінде бір аймақ таңдалуы тиіс.",
    "regionRemoved": "Аймақ аумақтан алынып тасталды.",
    "minDayAlert": "Кемінде бір жұмыс күнін таңдаңыз.",
    "daysUpdated": "Жұмыс күндері жаңартылды.",
    "logoutConfirm": "Жұмыс кабинетінен шыққыңыз келетініне сенімдісіз бе?"
  },
  "km": {
    "removeRegionTitle": "លុបតំបន់",
    "serviceRemoved": "ប្រភេទសេវាកម្មត្រូវបានលុបចេញ។",
    "serviceAdded": "បានបន្ថែមប្រភេទសេវាកម្មថ្មីដោយជោគជ័យ។",
    "regionAdded": "បានបន្ថែមតំបន់ទៅក្នុងដែនកំណត់សេវាកម្ម។",
    "minRegionAlert": "ត្រូវតែកំណត់យ៉ាងហោចណាស់តំបន់មួយ។",
    "regionRemoved": "តំបន់ត្រូវបានដកចេញពីដែនកំណត់សេវាកម្ម។",
    "minDayAlert": "សូមជ្រើសរើសយ៉ាងហោចណាស់មួយថ្ងៃ។",
    "daysUpdated": "បានធ្វើបច្ចុប្បន្នភាពថ្ងៃធ្វើការ។"
  },
  "my": {
    "removeRegionTitle": "နယ်မြေဖယ်ရှားရန်",
    "serviceRemoved": "ဝန်ဆောင်မှုအမျိုးအစားကို ဖယ်ရှားပြီးပါပြီ။",
    "serviceAdded": "ဝန်ဆောင်မှုအသစ်ကို အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။",
    "regionAdded": "ဝန်ဆောင်မှုနယ်မြေကို ထည့်သွင်းပြီးပါပြီ။",
    "minRegionAlert": "အနည်းဆုံး နယ်မြေတစ်ခု သတ်မှတ်ရပါမည်။",
    "regionRemoved": "ဝန်ဆောင်မှုနယ်မြေကို ဖယ်ရှားပြီးပါပြီ။",
    "minDayAlert": "အနည်းဆုံး တစ်ရက် ရွေးချယ်ရပါမည်။",
    "daysUpdated": "အလုပ်လုပ်မည့်ရက်များကို အပ်ဒိတ်လုပ်ပြီးပါပြီ။"
  },
  "si": {
    "removeRegionTitle": "ප්‍රදේශය ඉවත් කරන්න",
    "serviceRemoved": "සේවා කාණ්ඩය ඉවත් කරන ලදී.",
    "serviceAdded": "නව සේවා කාණ්ඩය සාර්ථකව එකතු කරන ලදී.",
    "regionAdded": "ප්‍රදේශය සේවා කලාපයට එකතු කරන ලදී.",
    "minRegionAlert": "අවම වශයෙන් එක් ප්‍රදේශයක් තිබිය යුතුය.",
    "regionRemoved": "ප්‍රදේශය ඉවත් කරන ලදී.",
    "minDayAlert": "අවම වශයෙන් එක් දිනයක් තෝරන්න.",
    "daysUpdated": "වැඩ කරන දින යාවත්කාලීන කරන ලදී."
  },
  "ta": {
    "removeRegionTitle": "பகுதியை நீக்கு",
    "setHours": "நிர்ணயிக்கப்பட்ட நேரம்",
    "contractName": "முழுப் பெயர்",
    "contractPhone": "மொபைல் எண்",
    "contractResidentId": "அடையாள எண் (மறைக்கப்பட்டது)",
    "contractSignedAt": "ஒப்பந்த நேரம்",
    "contractClauseTitle": "கடமைகள் மற்றும் அறிவிப்பு விதிமுறை",
    "contractClauseDesc": "பணியாளர் தற்காலிகமாகப் பணியாற்ற இயலாவிட்டால் அல்லது பகுதி மாறினால் உடனடியாகத் தெரிவிக்க உறுதியளிக்கிறார்.",
    "contractSignature": "மின்னணு கையொப்பம் சரிபார்க்கப்பட்டது",
    "close": "மூடு",
    "minServiceAlert": "குறைந்தது ஒரு சேவை செயலில் இருக்க வேண்டும்.",
    "serviceRemoved": "சேவை நீக்கப்பட்டது.",
    "serviceAdded": "புதிய சேவை வெற்றிகரமாகச் சேர்க்கப்பட்டது.",
    "regionAdded": "பகுதி சேர்க்கப்பட்டது.",
    "minRegionAlert": "குறைந்தது ஒரு பகுதி அமைக்கப்பட்டிருக்க வேண்டும்.",
    "regionRemoved": "பகுதி நீக்கப்பட்டது.",
    "minDayAlert": "குறைந்தது ஒரு நாள் தேர்ந்தெடுக்கப்பட வேண்டும்.",
    "daysUpdated": "பணி நாட்கள் புதுப்பிக்கப்பட்டன.",
    "logoutConfirm": "பணிப்பகுதியிலிருந்து வெளியேற விரும்புகிறீர்களா?"
  },
  "tet": {
    "removeRegionTitle": "Hasai Área",
    "setHours": "Oras ne'ebé determina ona",
    "contractName": "Naran Kompletu",
    "contractPhone": "Númeru Telemóvel",
    "contractResidentId": "Númeru Identidade (subar)",
    "contractSignedAt": "Data no Oras Asina nian",
    "contractClauseTitle": "Klauzula Obrigasaun no Notifikasaun",
    "contractClauseDesc": "Tékniku promete atu fó hatene kedas se la bele servisu ka troka área.",
    "contractSignature": "Asinatura Eletrónika Konfirma ona",
    "close": "Taka",
    "minServiceAlert": "Pelumenus kategoria servisu ida tenke ativu hela.",
    "serviceRemoved": "Kategoria servisu hasai ona.",
    "serviceAdded": "Kategoria servisu foun aumenta ona.",
    "regionAdded": "Área aumenta ona ba kobertura.",
    "minRegionAlert": "Tenke konfigura pelumenus área ida.",
    "regionRemoved": "Área hasai ona.",
    "minDayAlert": "Hili pelumenus loron ida.",
    "daysUpdated": "Loron servisu nian atualiza ona.",
    "logoutConfirm": "Ita-boot hakarak duni atu sai husi espasu servisu?"
  },
  "am": {
    "removeRegionTitle": "አካባቢን አስወግድ",
    "setHours": "የተወሰኑ ሰዓታት",
    "contractName": "ሙሉ ስም",
    "contractPhone": "የሞባይል ስልክ ቁጥር",
    "contractResidentId": "መታወቂያ ቁጥር (የተደበቀ)",
    "contractSignedAt": "የተፈረመበት ቀንና ሰዓት",
    "contractClauseTitle": "የግዴታ እና የማሳወቂያ አንቀጽ",
    "contractClauseDesc": "ባለሙያው መስራት ካልቻለ ወይም አካባቢ ከተቀየረ ወዲያውኑ የማሳወቅ ግዴታ አለበት።",
    "contractSignature": "የኤሌክትሮኒክ ፊርማ ተረጋግጧል",
    "close": "ዝጋ",
    "minServiceAlert": "ቢያንስ አንድ አገልግሎት መመረጥ አለበት።",
    "serviceRemoved": "አገልግሎቱ ተወግዷል።",
    "serviceAdded": "አዲስ አገልግሎት ተጨምሯል።",
    "regionAdded": "አካባቢ ተጨምሯል።",
    "minRegionAlert": "ቢያንስ አንድ አካባቢ መኖር አለበት።",
    "regionRemoved": "አካባቢው ተወግዷል።",
    "minDayAlert": "ቢያንስ አንድ ቀን ይምረጡ።",
    "daysUpdated": "የስራ ቀናት ተዘምነዋል።",
    "logoutConfirm": "ከመለያዎ መውጣት ይፈልጋሉ?"
  }
}

for loc, kvs in EXTRA_WS.items():
    filepath = os.path.join(MESSAGES_DIR, f"{loc}.json")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            d = json.load(f)
        d.setdefault("workspace", {}).update(kvs)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Patched {loc}.json with extra workspace keys.")

# Also ensure ko.json has adminChatRecipient
ko_path = os.path.join(MESSAGES_DIR, "ko.json")
with open(ko_path, "r", encoding="utf-8") as f:
    ko_data = json.load(f)
ko_data.setdefault("workspace", {})["adminChatRecipient"] = "수신자: 헬퍼"
with open(ko_path, "w", encoding="utf-8") as f:
    json.dump(ko_data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("Patched ko.json with adminChatRecipient.")

