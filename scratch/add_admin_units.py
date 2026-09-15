import json
import glob
import os

translations = {
    "ko": {"unitDays": "일", "autoCycle": "자동 갱신 주기"},
    "en": {"unitDays": " Days", "autoCycle": "Auto Renewal Cycle"},
    "vi": {"unitDays": " ngày", "autoCycle": "Chu kỳ tự động gia hạn"},
    "zh-Hans": {"unitDays": "天", "autoCycle": "自动更新周期"},
    "zh-Hant": {"unitDays": "天", "autoCycle": "自動更新週期"},
    "ja": {"unitDays": "日", "autoCycle": "自動更新サイクル"},
    "ru": {"unitDays": " дн.", "autoCycle": "Цикл автообновления"},
    "uz": {"unitDays": " kun", "autoCycle": "Avtomatik yangilanish davri"},
    "th": {"unitDays": " วัน", "autoCycle": "รอบการต่ออายุอัตโนมัติ"},
    "mn": {"unitDays": " хоног", "autoCycle": "Автомат шинэчлэх мөчлөг"},
    "ne": {"unitDays": " दिन", "autoCycle": "स्वचालित नवीकरण चक्र"},
    "hi": {"unitDays": " दिन", "autoCycle": "स्वचालित नवीनीकरण चक्र"},
    "km": {"unitDays": " ថ្ងៃ", "autoCycle": "វដ្តបន្តដោយស្វ័យប្រវត្តិ"},
    "my": {"unitDays": " ရက်", "autoCycle": "အလိုအလျောက် သက်တမ်းတိုးစက်ဝန်း"},
    "id": {"unitDays": " hari", "autoCycle": "Siklus pembaruan otomatis"},
    "si": {"unitDays": " දින", "autoCycle": "ස්වයංක්‍රීය අලුත් කිරීමේ චක්‍රය"},
    "kk": {"unitDays": " күн", "autoCycle": "Автоматты жаңарту циклі"},
    "bn": {"unitDays": " দিন", "autoCycle": "স্বয়ংক্রিয় পুনর্নবীকরণ চক্র"},
    "ta": {"unitDays": " நாட்கள்", "autoCycle": "தானியங்கி புதுப்பித்தல் சுழற்சி"},
    "fr": {"unitDays": " jours", "autoCycle": "Cycle de renouvellement auto"},
    "de": {"unitDays": " Tage", "autoCycle": "Automatischer Erneuerungszyklus"},
    "tr": {"unitDays": " gün", "autoCycle": "Otomatik yenileme döngüsü"},
    "uk": {"unitDays": " дн.", "autoCycle": "Цикл автооновлення"},
    "tet": {"unitDays": " loron", "autoCycle": "Siklu renovasaun automátiku"},
    "ar": {"unitDays": " يوم", "autoCycle": "دورة التجديد التلقائي"},
    "it": {"unitDays": " giorni", "autoCycle": "Ciclo di rinnovo automatico"},
    "arz": {"unitDays": " يوم", "autoCycle": "دورة التجديد التلقائي"},
    "es": {"unitDays": " días", "autoCycle": "Ciclo de renovación automática"},
    "fa": {"unitDays": " روز", "autoCycle": "چرخه تمدید خودکار"},
    "nl": {"unitDays": " dagen", "autoCycle": "Automatische vernieuwingscyclus"},
    "pl": {"unitDays": " dni", "autoCycle": "Cykl automatycznego odnawiania"},
    "am": {"unitDays": " ቀናት", "autoCycle": "ራስ-ሰር የእድሳት ዑደት"},
    "sv": {"unitDays": " dagar", "autoCycle": "Automatisk förnyelsecykel"},
    "he": {"unitDays": " ימים", "autoCycle": "מחזור חידוש אוטומטי"},
    "da": {"unitDays": " dage", "autoCycle": "Automatisk fornyelsescyklus"},
    "no": {"unitDays": " dager", "autoCycle": "Automatisk fornyelsessyklus"},
    "el": {"unitDays": " ημέρες", "autoCycle": "Κύκλος αυτόματης ανανέωσης"},
    "pt": {"unitDays": " dias", "autoCycle": "Ciclo de renovação automática"},
}

files = glob.glob('messages/*.json')
updated_count = 0
for fpath in files:
    loc = os.path.splitext(os.path.basename(fpath))[0]
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'admin' not in data:
        data['admin'] = {}
    
    unit = translations.get(loc, {}).get("unitDays", " Days")
    cycle = translations.get(loc, {}).get("autoCycle", "Auto Renewal Cycle")
    
    data['admin']['unitDays'] = unit
    data['admin']['autoCycle'] = cycle
    
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    updated_count += 1

print(f"Successfully updated unitDays & autoCycle in {updated_count} message files!")

