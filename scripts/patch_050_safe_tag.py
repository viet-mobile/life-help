# -*- coding: utf-8 -*-
import json
import os

BASE_DIR = r"c:\Users\leetr\Documents\life-project\life-help"
MESSAGES_DIR = os.path.join(BASE_DIR, "messages")

TAGS = {
    "ko": "050 안심",
    "en": "050 Safe",
    "vi": "050 An tâm",
    "zh-Hans": "050 安心",
    "zh-Hant": "050 安心",
    "ja": "050 あんしん",
    "ru": "050 Защита",
    "mn": "050 Аюулгүй",
    "uz": "050 Xavfsiz",
    "ne": "050 सुरक्षित",
    "hi": "050 सुरक्षित",
    "km": "050 សុវត្ថិភាព",
    "th": "050 ปลอดภัย",
    "my": "050 စိတ်ချရ",
    "id": "050 Aman",
    "si": "050 ආරක්ෂිත",
    "kk": "050 Қауіпсіз",
    "bn": "050 নিরাপদ",
    "ta": "050 பாதுகாப்பானது",
    "fr": "050 Sécurisé",
    "de": "050 Sicher",
    "tr": "050 Güvenli",
    "uk": "050 Безпечно",
    "tet": "050 Seguru",
    "ar": "050 آمن",
    "it": "050 Sicuro",
    "arz": "050 آمن",
    "es": "050 Seguro",
    "fa": "050 امن",
    "nl": "050 Veilig",
    "pl": "050 Bezpieczny",
    "am": "050 ደህንነቱ የተጠበቀ",
    "sv": "050 Säkert",
    "he": "050 מאובטח",
    "da": "050 Sikkert",
    "no": "050 Trygt",
    "el": "050 Ασφαλές",
    "pt": "050 Seguro"
}

import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def main():
    print(f"Patching 050 safe tag across all {len(TAGS)} languages...")
    for loc, tag in TAGS.items():
        fpath = os.path.join(MESSAGES_DIR, f"{loc}.json")
        if not os.path.exists(fpath):
            print(f"File not found: {fpath}")
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)

        if "customer" not in data:
            data["customer"] = {}
        data["customer"]["safe050Tag"] = tag

        if "support" not in data:
            data["support"] = {}
        data["support"]["safe050Tag"] = tag

        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    print("All 38 language files updated successfully with safe050Tag!")

if __name__ == "__main__":
    main()
