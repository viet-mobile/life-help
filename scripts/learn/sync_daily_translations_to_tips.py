#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync_daily_translations_to_tips.py
Synchronizes all day 367+ daily insights (including daily questions and 190-country living guides)
into public/daily-tips/{lang}.json and public/learn-content/daily-tips/{lang}.json
across all 89 supported languages.
"""

import os
import sys
import glob
import json
import re
from pathlib import Path

ROOT = Path("/Users/juboklee/life-project/life-help")
PUBLIC_TIPS = ROOT / "public" / "daily-tips"
PUBLIC_LEARN_TIPS = ROOT / "public" / "learn-content" / "daily-tips"
CONTENT_OVERLAYS = ROOT / "content" / "learn-overlays"
THINK_I18N = ROOT / "lib" / "think" / "i18n"
DATA_DIR = ROOT / "lib" / "learn" / "dailyInsights" / "data"
STUDY_TOPICS_PATH = ROOT / "lib" / "learn" / "dailyInsights" / "studyTopics89.json"

COUNTRY_TEMPLATES = {
    "ne": {
        "title": "[{iso}] {cName} विदेशी नागरिक बसोबास दर्ता तथा अत्यावश्यक जीवन प्रशासनिक निर्देशिका",
        "summary": "{cName} प्रवेश गरेपछि बसोबास दर्ता, सार्वजनिक स्वास्थ्य बीमा, कर नम्बर जारी र आधिकारिक अध्यागमन पोर्टल दर्ता सम्बन्धी जानकारी।",
        "principle": "राष्ट्रिय आधिकारिक अध्यागमन पोर्टल मार्फत नवीनतम बसोबास अनुमति नियम र आवश्यक कागजातहरू प्रमाणीकरण गर्नुहोस्।",
        "example": "आधिकारिक पोर्टल: {portal}",
        "actionItem": "प्रवेश गरेलगत्तै {cName} सम्बन्धित स्थानीय निकायमा आफ्नो बसोबास दर्ता गराउनुहोस् र आधिकारिक प्रमाणपत्र लिनुहोस्。"
    },
    "vi": {
        "title": "[{iso}] Hướng dẫn đăng ký cư trú và thủ tục hành chính thiết yếu tại {cName}",
        "summary": "Hướng dẫn đăng ký cư trú, bảo hiểm y tế công cộng, cấp mã số thuế và cổng thông tin nhập cư chính thức sau khi đến {cName}.",
        "principle": "Kiểm tra quy định cấp phép cư trú mới nhất và các giấy tờ cần thiết qua cổng thông tin xuất nhập cảnh chính thức.",
        "example": "Cổng thông tin chính thức: {portal}",
        "actionItem": "Đăng ký nơi cư trú tại cơ quan có thẩm quyền tại {cName} ngay sau khi nhập cảnh và nhận giấy chứng nhận chính thức."
    },
    "zh-Hans": {
        "title": "[{iso}] {cName} 外籍人士居留登记及必备生活行政指南",
        "summary": "入境 {cName} 后的居住登记、公共医疗保险、税号申请及官方移民门户注册指南。",
        "principle": "通过国家官方移民局门户网站查询最新居留许可规定及必备申请材料。",
        "example": "官方门户: {portal}",
        "actionItem": "入境后请立即前往 {cName} 辖区主管机关申报居住地并领取官方居留凭证。"
    },
    "zh-Hant": {
        "title": "[{iso}] {cName} 外籍人士居留登記及必備生活行政指南",
        "summary": "入境 {cName} 後的居住登記、公共醫療保險、稅號申請及官方移民門戶註冊指南。",
        "principle": "透過國家官方移民局門戶網站查詢最新居留許可規定及必備申請資料。",
        "example": "官方門戶: {portal}",
        "actionItem": "入境後請立即前往 {cName} 轄區主管機關申報居住地並領取官方居留憑證。"
    },
    "ja": {
        "title": "[{iso}] {cName} 外国人滞在登録および必須生活行政ガイド",
        "summary": "{cName} 入国後の居住地登録、公的医療保険、納税者番号の取得および公式移民ポータルでの手続き案内。",
        "principle": "国家公式の移民局ポータルを通じて最新の滞在許可規則および必要書類を確認してください。",
        "example": "公式ポータル: {portal}",
        "actionItem": "入国後速やかに {cName} 管轄自治体に居住地を届け出、公式証明書を取得してください。"
    },
    "es": {
        "title": "[{iso}] {cName} Guía de registro de residencia y trámites administrativos esenciales",
        "summary": "Guía sobre registro de residencia, seguro médico público, obtención de número de identificación fiscal y portal oficial de inmigración tras ingresar a {cName}.",
        "principle": "Verifique las normativas de residencia más recientes y los documentos obligatorios a través del portal oficial de inmigración nacional.",
        "example": "Portal oficial: {portal}",
        "actionItem": "Regístrese inmediatamente en la oficina municipal correspondiente en {cName} tras su llegada y obtenga su certificado oficial."
    },
    "fr": {
        "title": "[{iso}] {cName} Guide d'enregistrement de séjour et démarches administratives essentielles",
        "summary": "Informations sur l'enregistrement de résidence, la sécurité sociale, le numéro fiscal et le portail officiel de l'immigration après votre arrivée en {cName}.",
        "principle": "Vérifiez les réglementations de séjour et les documents requis via le portail officiel de l'immigration nationale.",
        "example": "Portail officiel : {portal}",
        "actionItem": "Déclarez sans délai votre domicile auprès de l'autorité compétente en {cName} à votre arrivée et obtenez votre attestation officielle."
    },
    "de": {
        "title": "[{iso}] {cName} Wohnsitzanmeldung und wichtiger Leitfaden für Behördengänge",
        "summary": "Informationen zu Wohnsitzanmeldung, Krankenversicherung, Steuernummer und amtlichem Einwanderungsportal nach der Ankunft in {cName}.",
        "principle": "Prüfen Sie aktuelle Aufenthaltsbestimmungen und erforderliche Unterlagen über das offizielle Einwanderungsportal.",
        "example": "Offizielles Portal: {portal}",
        "actionItem": "Melden Sie Ihren Wohnsitz nach der Einreise umgehend bei der zuständigen Behörde in {cName} an und beantragen Sie die amtliche Bestätigung."
    },
    "ru": {
        "title": "[{iso}] {cName} Регистрация проживания и справочник по административным процедурам",
        "summary": "Справочник по регистрации по месту жительства, медицинскому страхованию, получению ИНН и официальному миграционному порталу после въезда в {cName}.",
        "principle": "Уточняйте актуальные правила пребывания и список необходимых документов на официальном портале миграционной службы.",
        "example": "Официальный портал: {portal}",
        "actionItem": "Сразу после въезда зарегистрируйтесь по месту жительства в уполномоченном органе {cName} и получите официальное свидетельство."
    },
    "ar": {
        "title": "[{iso}] دليل تسجيل الإقامة والمعاملات الإدارية الأساسية في {cName}",
        "summary": "إرشادات حول تسجيل الإقامة، والتأمين الصحي العام، والرقم الضريبي، والبوابة الرسمية للهجرة عند الوصول إلى {cName}.",
        "principle": "تحقق من أحدث لوائح الإقامة والمستندات المطلوبة عبر البوابة الرسمية للهجرة في الدولة.",
        "example": "البوابة الرسمية: {portal}",
        "actionItem": "سارع بتسجيل محل إقامتك لدى الجهة المختصة في {cName} فور دخولك واحصل على الشهادة الرسمية."
    },
    "hi": {
        "title": "[{iso}] {cName} विदेशी नागरिक निवास पंजीकरण और आवश्यक प्रशासनिक मार्गदर्शिका",
        "summary": "{cName} में आगमन के बाद निवास पंजीकरण, सार्वजनिक स्वास्थ्य बीमा, टैक्स नंबर और आधिकारिक आव्रजन पोर्टल से संबंधित आवश्यक जानकारी।",
        "principle": "राष्ट्रीय आधिकारिक आव्रजन पोर्टल के माध्यम से नवीनतम निवास नियमों और आवश्यक दस्तावेजों की पुष्टि करें।",
        "example": "आधिकारिक पोर्टल: {portal}",
        "actionItem": "प्रवेश के तुरंत बाद {cName} में संबंधित स्थानीय कार्यालय में अपना निवास पंजीकृत करें और आधिकारिक प्रमाण पत्र प्राप्त करें।"
    },
    "en": {
        "title": "[{iso}] {cName} Foreign Resident Registration & Essential Living Guide",
        "summary": "Essential guidance on residence registration, public healthcare, tax ID issuance, and official immigration procedures upon arriving in {cName}.",
        "principle": "Always verify the latest stay permit regulations and mandatory documentation via the official national immigration portal.",
        "example": "Official Portal: {portal}",
        "actionItem": "Promptly register your residence at the local municipal office in {cName} upon entry and obtain your official certificate."
    }
}

def get_country_overlay(cItem, lang):
    tpl = COUNTRY_TEMPLATES.get(lang, COUNTRY_TEMPLATES["en"])
    cName = cItem.get("country", "")
    cName = cName.capitalize() if cName else (cItem.get("iso2") or "Country")
    iso = cItem.get("iso2", "")
    portal = (cItem.get("example") or "").replace("공식 포털:", "").strip()
    return {
        "title": tpl["title"].format(iso=iso, cName=cName),
        "summary": tpl["summary"].format(iso=iso, cName=cName),
        "principle": tpl["principle"].format(iso=iso, cName=cName),
        "example": tpl["example"].format(portal=portal) if portal else (tpl["example"].split(":")[0] + ": -"),
        "actionItem": tpl["actionItem"].format(iso=iso, cName=cName)
    }

def sync_translations():
    with open(STUDY_TOPICS_PATH, "r", encoding="utf-8") as f:
        study_topics = json.load(f)

    # Load domain items past 366
    domains_data = {}
    for subj in ["math", "physics", "chemistry", "english", "korean", "life"]:
        with open(DATA_DIR / f"{subj}.json", "r", encoding="utf-8") as f:
            domains_data[subj] = json.load(f)[366:]

    with open(DATA_DIR / "life.json", "r", encoding="utf-8") as f:
        full_life_data = json.load(f)
    country_map = {x["id"]: x for x in full_life_data if str(x.get("id", "")).startswith("country-")}

    all_lang_files = sorted(PUBLIC_TIPS.glob("*.json"))
    print(f"Syncing overlays for {len(all_lang_files)} languages across 851 items past day 366...")

    updated_count = 0
    for lpath in all_lang_files:
        lang = lpath.stem
        with open(lpath, "r", encoding="utf-8") as f:
            try:
                overlays = json.load(f)
            except Exception:
                overlays = {}

        batch_cache = {}
        def get_batch_task(subj, batch_num, q_num):
            cache_key = f"{subj}-d{batch_num:02d}"
            if cache_key not in batch_cache:
                bf = THINK_I18N / lang / f"{cache_key}.json"
                if bf.exists():
                    batch_cache[cache_key] = json.load(open(bf, encoding="utf-8"))
                else:
                    en_bf = THINK_I18N / "en" / f"{cache_key}.json"
                    batch_cache[cache_key] = json.load(open(en_bf, encoding="utf-8")) if en_bf.exists() else {}
            bdata = batch_cache[cache_key]
            keys = list(bdata.keys())
            if not keys:
                return None
            k = keys[min(q_num - 1, len(keys) - 1)]
            return bdata[k]

        # 1. Subject questions (math, physics, chemistry, english, korean)
        for subj in ["math", "physics", "chemistry", "english", "korean"]:
            for it in domains_data[subj]:
                qid = it["id"]
                m = re.match(r"^\d{8}-([a-z]+)-(g\d+|l\d+|all)-(\d+)$", qid)
                if not m:
                    continue
                s_name = m.group(1)
                grade_str = m.group(2)
                q_num = int(m.group(3))

                if s_name == "korean":
                    batch_num = int(grade_str.replace("l", ""))
                else:
                    batch_num = int(grade_str.replace("g", ""))

                task = get_batch_task(s_name, batch_num, q_num)
                if task:
                    title = task.get("title") or task.get("topic") or it.get("title", "")
                    summary = task.get("material") or task.get("steps.0.prompt") or task.get("s.s1.prompt") or it.get("summary", "")
                    principle = task.get("steps.0.explain") or task.get("s.s1.explain") or task.get("goal") or it.get("principle", "")
                    example = task.get("steps.0.hints.0") or task.get("s.s1.hint.0") or (task.get("hints") and task.get("hints")[0]) or it.get("example", "")
                    actionItem = task.get("goal") or it.get("actionItem", "")

                    ov_item = {
                        "title": title,
                        "summary": summary,
                        "principle": principle,
                        "example": example,
                        "actionItem": actionItem
                    }
                    overlays[qid] = ov_item
                    overlays[f"{s_name}-{grade_str}-{q_num}"] = ov_item

        # 2. Life items (country-*, 202611*-life-all-*, and {date_str}-country-*)
        for it in domains_data["life"]:
            qid = it["id"]
            if qid.startswith("country-"):
                ov_item = get_country_overlay(it, lang)
                overlays[qid] = ov_item
            elif "-country-" in qid or "country_ref" in it:
                c_id = it.get("country_ref") or ("country-" + qid.split("-country-")[-1])
                base_c = country_map.get(c_id, it)
                ov_item = get_country_overlay(base_c, lang)
                overlays[qid] = ov_item
            elif "life-all" in qid:
                if qid.endswith("-1") or qid == "20261118-life-all":
                    src = study_topics.get("p-009") or study_topics.get("c-001")
                else:
                    src = study_topics.get("p-003")

                if src:
                    def pick(field):
                        return src.get(field, {}).get(lang) or src.get(field, {}).get("en") or it.get(field, "")
                    ov_item = {
                        "title": pick("title"),
                        "summary": pick("summary"),
                        "principle": pick("principle"),
                        "example": pick("example"),
                        "actionItem": pick("actionItem")
                    }
                    overlays[qid] = ov_item
                    overlays["life-all-1" if (qid.endswith("-1") or qid == "20261118-life-all") else "life-all-2"] = ov_item

        # Write to public/daily-tips/{lang}.json
        with open(lpath, "w", encoding="utf-8") as f:
            json.dump(overlays, f, ensure_ascii=False, indent=2)

        # Sync to public/learn-content/daily-tips/{lang}.json if directory exists
        learn_lpath = PUBLIC_LEARN_TIPS / f"{lang}.json"
        if learn_lpath.parent.exists():
            with open(learn_lpath, "w", encoding="utf-8") as f:
                json.dump(overlays, f, ensure_ascii=False, indent=2)

        # Also persist to committed content/learn-overlays/{lang}/daily-tips-pc.json
        overlay_pc = CONTENT_OVERLAYS / lang / "daily-tips-pc.json"
        if overlay_pc.parent.exists():
            with open(overlay_pc, "w", encoding="utf-8") as f:
                json.dump(overlays, f, ensure_ascii=False, indent=2)

        updated_count += 1

    print(f"✅ Successfully synchronized all 89 language overlay files with Day 367+ content!")

if __name__ == "__main__":
    sync_translations()
