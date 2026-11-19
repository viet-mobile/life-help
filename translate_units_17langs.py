# -*- coding: utf-8 -*-
import os
import re
import json
import time
import glob
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib import request, error

TARGET_LANGS = {
    "pa": "Punjabi (Gurmukhi script)",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi (Devanagari script)",
    "am": "Amharic (Ge'ez script)",
    "my": "Burmese (Myanmar script)",
    "km": "Khmer",
    "si": "Sinhala",
    "te": "Telugu",
    "bn": "Bengali",
    "gu": "Gujarati",
    "ta": "Tamil",
    "mn": "Mongolian (Cyrillic script)",
    "el": "Greek",
    "ka": "Georgian",
    "fi": "Finnish",
    "uk": "Ukrainian",
}

MARKER_RE = re.compile(r"«\d+»")
HANGUL_RE = re.compile(r"[가-힣ㄱ-ㅎㅏ-ㅣ]")


def check_unit_valid(src: str, dst: str) -> tuple[bool, str]:
    if not isinstance(dst, str) or not dst.strip():
        return False, "empty_translation"
    src_markers = sorted(MARKER_RE.findall(src))
    dst_markers = sorted(MARKER_RE.findall(dst))
    if src_markers != dst_markers:
        return False, f"marker_mismatch: expected {src_markers}, got {dst_markers}"
    if HANGUL_RE.search(dst):
        return False, "hangul_detected"
    if src.count("\n") != dst.count("\n"):
        return False, f"newline_mismatch: expected {src.count(chr(10))}, got {dst.count(chr(10))}"
    return True, "ok"


def call_gemini_batch(api_key: str, model: str, lang_code: str, lang_name: str, batch_items: list[dict]) -> dict[str, str]:
    system_prompt = (
        f"You are a professional educational content translator into {lang_name} (locale: {lang_code}).\n"
        "STRICT RULES:\n"
        f"1. Translate the Korean text into natural, concise, learner-friendly {lang_name}.\n"
        "2. PRESERVE all numbered markers like «1», «2», «3» EXACTLY as they appear (same count and same numbers). "
        "You may move their position to fit target grammar, but NEVER omit, duplicate, or alter any «n» marker.\n"
        "3. DO NOT output any Korean Hangul characters (가-힣, ㄱ-ㅎ, ㅏ-ㅣ) in the translation. "
        "If Korean names, example words, or phonetic brackets appear in the source, transliterate or translate them into "
        f"{lang_name} script.\n"
        "4. PRESERVE the exact number of newline characters (\\n) in each string.\n"
        "5. Do NOT invent gender or number not present in the source. Use gender-neutral phrasing.\n"
        "6. Return ONLY a valid JSON object mapping each unit id (e.g., \"u10000\") to its translated string."
    )

    payload_obj = {item["id"]: item["text"] for item in batch_items}
    user_prompt = (
        f"Translate the following {len(batch_items)} units into {lang_name} ({lang_code}). "
        "Ensure 0 Hangul characters remain, exact «n» markers are preserved, and exact \\n counts match:\n"
        + json.dumps(payload_obj, ensure_ascii=False)
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req_body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }

    data = json.dumps(req_body).encode("utf-8")
    req = request.Request(url, data=data, headers={"Content-Type": "application/json"})

    for attempt in range(4):
        try:
            with request.urlopen(req, timeout=120) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        except Exception as e:
            if attempt == 3:
                raise RuntimeError(f"API call failed after retries: {e}")
            time.sleep(2 ** attempt)
    return {}


def process_chunk_for_lang(api_key: str, model: str, chunk_path: str, out_dir: str, lang_code: str, batch_size: int):
    lang_name = TARGET_LANGS[lang_code]
    with open(chunk_path, "r", encoding="utf-8") as f:
        chunk_data = json.load(f)

    chunk_num = chunk_data["chunk"]
    units = chunk_data["units"]

    lang_out_dir = os.path.join(out_dir, lang_code)
    os.makedirs(lang_out_dir, exist_ok=True)
    out_file = os.path.join(lang_out_dir, f"chunk-{chunk_num:02d}.json")

    existing_translations = {}
    if os.path.exists(out_file):
        try:
            with open(out_file, "r", encoding="utf-8") as f:
                saved = json.load(f)
                existing_translations = saved.get("translations", {})
        except Exception:
            existing_translations = {}

    todo_units = []
    for u in units:
        uid, src = u["id"], u["text"]
        if uid in existing_translations:
            ok, _ = check_unit_valid(src, existing_translations[uid])
            if ok:
                continue
        todo_units.append(u)

    if not todo_units:
        print(f"[{lang_code}] chunk-{chunk_num:02d}: 이미 완료됨 ({len(units)} units)")
        return

    print(f"[{lang_code}] chunk-{chunk_num:02d}: 번역 시작 (남은 단위: {len(todo_units)}/{len(units)})")

    for i in range(0, len(todo_units), batch_size):
        batch = todo_units[i : i + batch_size]
        translated_map = call_gemini_batch(api_key, model, lang_code, lang_name, batch)

        retry_list = []
        for u in batch:
            uid, src = u["id"], u["text"]
            cand = translated_map.get(uid, "")
            ok, _ = check_unit_valid(src, cand)
            if ok:
                existing_translations[uid] = cand
            else:
                retry_list.append(u)

        if retry_list:
            retry_map = call_gemini_batch(api_key, model, lang_code, lang_name, retry_list)
            for u in retry_list:
                uid, src = u["id"], u["text"]
                cand = retry_map.get(uid, "")
                if src.count("\n") == 0 and "\n" in cand:
                    cand = cand.replace("\n", " ")
                ok, _ = check_unit_valid(src, cand)
                if ok:
                    existing_translations[uid] = cand

        out_payload = {
            "lang": lang_code,
            "chunk": chunk_num,
            "status": "AI 번역(미검수)",
            "translations": existing_translations,
        }
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(out_payload, f, ensure_ascii=False, indent=2)

    print(f"[{lang_code}] chunk-{chunk_num:02d}: 저장 완료 -> {out_file}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--units-dir", default="./units", help="chunk-NN.json 입력 폴더")
    parser.add_argument("--out-dir", default="./out", help="출력 폴더")
    parser.add_argument("--langs", default=",".join(TARGET_LANGS.keys()), help="번역할 언어 코드 (쉼표 구분)")
    parser.add_argument("--chunks", default="all", help="번역할 청크 번호 (예: 1,2,3 또는 all)")
    parser.add_argument("--model", default="gemini-2.5-flash", help="사용할 Gemini 모델명")
    parser.add_argument("--batch-size", type=int, default=40, help="배치당 유닛 수")
    parser.add_argument("--workers", type=int, default=4, help="병렬 스레드 수")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("환경변수 GEMINI_API_KEY를 설정해 주세요.")

    langs = [l.strip() for l in args.langs.split(",") if l.strip() in TARGET_LANGS]
    chunk_files = sorted(glob.glob(os.path.join(args.units_dir, "chunk-*.json")))

    if args.chunks != "all":
        wanted = {int(x.strip()) for x in args.chunks.split(",")}
        chunk_files = [
            p for p in chunk_files
            if int(re.search(r"chunk-(\d+)\.json", os.path.basename(p)).group(1)) in wanted
        ]

    tasks = [(lang, cp) for cp in chunk_files for lang in langs]
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [
            pool.submit(process_chunk_for_lang, api_key, args.model, cp, args.out_dir, lang, args.batch_size)
            for lang, cp in tasks
        ]
        for fut in as_completed(futures):
            fut.result()


if __name__ == "__main__":
    main()
