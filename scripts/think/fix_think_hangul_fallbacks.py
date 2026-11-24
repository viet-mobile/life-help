# -*- coding: utf-8 -*-
"""
Scans and cleans all residual Hangul letters, student names, and untranslated lines
from non-Korean thinking challenge overlays.
"""
import os, glob, json, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
I18N_DIR = os.path.join(ROOT, "lib", "think", "i18n")

NAME_REPLACEMENTS = {
    "vi": {
        "하린": "Ha-rin",
        "아린": "A-rin",
        "민재": "Min-jae",
        "서윤": "Seo-yeon",
        "민서": "Min-seo",
        "준호": "Jun-ho",
        "도윤": "Do-yoon",
        "지우": "Ji-woo",
        "하은": "Ha-eun",
        "시우": "Si-woo",
        "예준": "Ye-jun",
        "수아": "Su-a",
        "유준": "Yu-jun",
        "주원": "Ju-won",
        "채원": "Chae-won",
        "소율": "So-yul",
        "우진": "Woo-jin",
        "현우": "Hyun-woo",
        "영호": "Young-ho",
        "보람": "Bo-ram",
        "Cốc 가": "Cốc A",
        "Cốc 나": "Cốc B",
        "Cốc 다": "Cốc C",
        "cốc 가": "cốc A",
        "cốc 나": "cốc B",
        "cốc 다": "cốc C",
        "가 컵": "Cốc A",
        "나 컵": "Cốc B",
        "다 컵": "Cốc C",
        "가, 나": "A, B",
        "가": "A",
        "나": "B",
    },
    "en": {
        "하린": "Ha-rin",
        "아린": "A-rin",
        "민재": "Min-jae",
        "서윤": "Seo-yoon",
        "민서": "Min-seo",
        "준호": "Jun-ho",
        "도윤": "Do-yoon",
        "지우": "Ji-woo",
        "하은": "Ha-eun",
        "시우": "Si-woo",
        "예준": "Ye-jun",
        "수아": "Su-a",
        "유준": "Yu-jun",
        "주원": "Ju-won",
        "채원": "Chae-won",
        "소율": "So-yul",
        "우진": "Woo-jin",
        "현우": "Hyun-woo",
        "영호": "Young-ho",
        "보람": "Bo-ram",
        "Cup 가": "Cup A",
        "cup 가": "cup A",
        "Cup 나": "Cup B",
        "cup 나": "cup B",
        "Cup 다": "Cup C",
        "cup 다": "cup C",
        "가, 나": "A, B",
        "가": "A",
        "나": "B",
    },
    "zh-Hans": {
        "하린": "夏琳",
        "아린": "雅琳",
        "민재": "敏在",
        "서윤": "舒润",
        "민서": "敏瑞",
        "준호": "俊浩",
        "도윤": "道润",
        "지우": "智友",
        "하은": "夏恩",
        "시우": "时宇",
        "예준": "艺俊",
        "수아": "秀雅",
        "유준": "有俊",
        "주원": "周元",
        "채원": "彩媛",
        "소율": "素律",
        "우진": "宇振",
        "현우": "贤宇",
        "영호": "永浩",
        "보람": "宝蓝",
        "가 杯": "A杯",
        "나 杯": "B杯",
        "다 杯": "C杯",
        "가杯": "A杯",
        "나杯": "B杯",
        "다杯": "C杯",
        "图形 가": "图形 A",
        "图形 나": "图形 B",
        "图形 다": "图形 C",
        "가": "A",
        "나": "B",
    },
    "zh-Hant": {
        "하린": "夏琳",
        "아린": "雅琳",
        "민재": "敏在",
        "서윤": "舒潤",
        "민서": "敏瑞",
        "준호": "俊浩",
        "도윤": "道潤",
        "지우": "智友",
        "하은": "夏恩",
        "시우": "時宇",
        "예준": "藝俊",
        "수아": "秀雅",
        "유준": "有俊",
        "주원": "周元",
        "채원": "彩媛",
        "소율": "素律",
        "우진": "宇振",
        "현우": "賢宇",
        "영호": "永浩",
        "보람": "寶藍",
        "가 杯": "A杯",
        "나 杯": "B杯",
        "다 杯": "C杯",
        "가杯": "A杯",
        "나杯": "B杯",
        "다杯": "C杯",
        "圖形 가": "圖形 A",
        "圖形 나": "圖形 B",
        "圖形 다": "圖形 C",
        "가": "A",
        "나": "B",
    },
    "ja": {
        "하린": "ハリン",
        "아린": "アリン",
        "민재": "ミンジェ",
        "서윤": "ソユン",
        "민서": "ミンソ",
        "준호": "ジュノ",
        "도윤": "ドユン",
        "지우": "ジウ",
        "하은": "ハウン",
        "시우": "シウ",
        "예준": "イェジュン",
        "수아": "スア",
        "유준": "ユジュン",
        "주원": "ジュウォン",
        "채원": "チェウォン",
        "소율": "ソユル",
        "우진": "ウジン",
        "현우": "ヒョヌ",
        "영호": "ヨンホ",
        "보람": "ボラム",
        "가のコップ": "Aのコップ",
        "나のコップ": "Bのコップ",
        "다のコップ": "Cのコップ",
        "コップ가": "コップA",
        "コップ나": "コップB",
        "コップ다": "コップC",
        "図形가": "図形A",
        "図形나": "図形B",
        "図形다": "図形C",
        "가": "A",
        "나": "B",
    }
}

# 1. Specific fix for vi/math-e1-n1.json task n-m-e1-s1-01
vi_e1_path = os.path.join(I18N_DIR, "vi", "math-e1-n1.json")
if os.path.exists(vi_e1_path):
    with open(vi_e1_path, "r", encoding="utf-8") as f:
        vi_data = json.load(f)
    if "n-m-e1-s1-01" in vi_data:
        t = vi_data["n-m-e1-s1-01"]
        t["s.s1.line.0"] = "Cốc A thì hẹp và cao, còn cốc B thì rộng và thấp."
        t["s.s1.line.1"] = "Nước ở cốc A dâng cao hơn nước ở cốc B."
        t["s.s1.line.2"] = "Vì vậy cốc A có nhiều nước hơn."
        t["s.s1.line.3"] = "Dù hình dạng cốc khác nhau, hễ nước dâng cao hơn là có nhiều nước hơn."
        t["material"] = "Trước mặt Min-jae có hai cái cốc. Cốc A hẹp và cao. Cốc B rộng và thấp. Cả hai cốc đều có nước, và nước ở cốc A dâng cao hơn. Min-jae muốn tìm xem cốc nào có nhiều nước hơn."
        t["s.s3.prompt"] = "Khi múc bằng cái đĩa nhỏ, nước ở cốc A được a lần, nước ở cốc B được b lần. Hãy đổi a và b để tạo ba trường hợp khác nhau trong đó nước ở cốc A dâng cao hơn nhưng nước ở cốc B lại nhiều hơn. a và b là các số từ 1 đến 9."
        t["s.s3.var.a"] = "Nước ở cốc A (đĩa nhỏ mấy lần) a"
        t["s.s3.var.b"] = "Nước ở cốc B (đĩa nhỏ mấy lần) b"
        t["s.s3.ok.c3"] = "Nước ở cốc B nhiều hơn (số lần múc b lớn hơn a)."
        t["s.s3.fail.c3"] = "Nước ở cốc B phải nhiều hơn (b phải lớn hơn a)."
    with open(vi_e1_path, "w", encoding="utf-8") as f:
        json.dump(vi_data, f, ensure_ascii=False, indent=2)
    print("Fixed vi/math-e1-n1.json specific task.")

# 2. General replacement across all files
fixed_files = 0
for lang, mapping in NAME_REPLACEMENTS.items():
    lang_dir = os.path.join(I18N_DIR, lang)
    if not os.path.isdir(lang_dir):
        continue
    for fname in os.listdir(lang_dir):
        if not fname.endswith(".json") or "korean" in fname:
            continue
        fpath = os.path.join(lang_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        orig = content
        for k, v in mapping.items():
            if k in content:
                content = content.replace(k, v)
        if content != orig:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            fixed_files += 1

print(f"Cleaned Hangul artifacts across {fixed_files} files.")
