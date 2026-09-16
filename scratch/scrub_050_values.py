import json
import os
import re

MESSAGES_DIR = "messages"

def clean_050(text, lang_code):
    if not isinstance(text, str):
        return text
    if "050" not in text:
        return text

    # Handle language-specific replacements
    if lang_code == "ko":
        text = text.replace("050 안심번호", "실시간 1:1 번역 대화")
        text = text.replace("050 가상번호", "실시간 1:1 대화")
        text = text.replace("050 안심", "안심 대화")
        text = text.replace("050 번호", "실시간 대화")
        text = re.sub(r'050[^\s,.]*', '실시간 1:1 대화', text)
    elif lang_code == "vi":
        text = text.replace("số an toàn 050", "trò chuyện 1:1 theo thời gian thực")
        text = text.replace("số ảo 050", "trò chuyện trực tiếp 1:1")
        text = text.replace("050 An toàn", "Bảo mật 1:1")
        text = re.sub(r'050[^\s,.]*', 'trò chuyện 1:1', text)
    else:
        text = text.replace("050 safe virtual number", "real-time 1:1 chat")
        text = text.replace("050 safe number", "real-time 1:1 chat")
        text = text.replace("050 virtual number", "real-time 1:1 chat")
        text = text.replace("050 Virtual", "Real-time Chat")
        text = text.replace("050 Safe", "Safe Chat")
        text = text.replace("050-Nummer", "Echtzeit-Chat")
        text = text.replace("número seguro 050", "chat en tiempo real")
        text = re.sub(r'050[^\s,.]*', 'real-time chat', text)

    return text

def walk_and_clean(obj, lang_code):
    if isinstance(obj, dict):
        return {k: walk_and_clean(v, lang_code) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [walk_and_clean(elem, lang_code) for elem in obj]
    elif isinstance(obj, str):
        return clean_050(obj, lang_code)
    return obj

def main():
    files = [f for f in os.listdir(MESSAGES_DIR) if f.endswith(".json")]
    for f in files:
        lang_code = f[:-5]
        path = os.path.join(MESSAGES_DIR, f)
        with open(path, "r", encoding="utf-8") as file:
            data = json.load(file)
        cleaned = walk_and_clean(data, lang_code)
        with open(path, "w", encoding="utf-8") as file:
            json.dump(cleaned, file, ensure_ascii=False, indent=2)
            file.write("\n")
        print(f"Scrubbed 050 values in {f}")

if __name__ == "__main__":
    main()

