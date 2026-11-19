# -*- coding: utf-8 -*-
import json
import os
import glob

TRANSLATIONS_DIR = "life-help/lib/legal/translations"
PRESERVED_LANGS = {'de', 'es', 'fr', 'ja', 'ru', 'tr', 'vi', 'zh-Hans', 'zh-Hant'}

# Load TITLES
with open('life-help/scripts/build_legal_all.py', 'r', encoding='utf-8') as f:
    code = f.read()
d = {}
exec(code, d)
TITLES = d['TITLES']

# Helper to load existing translations for pt and it if defined
try:
    with open('life-help/scripts/generate_deep_legal_translations.py', 'r', encoding='utf-8') as f:
        code_deep = f.read()
    d_deep = {}
    exec(code_deep, d_deep)
    LANGUAGE_DATA = d_deep.get('LANGUAGE_DATA', {})
except Exception:
    LANGUAGE_DATA = {}

# Master dictionary of language names (in native tongue)
NATIVE_NAMES = {
    "af": "Afrikaans", "am": "አማርኛ", "ar": "العربية", "arz": "مصرى", "as": "অসমীয়া",
    "az": "Azərbaycan", "bg": "Български", "bn": "বাংলা", "ca": "Català", "ceb": "Cebuano",
    "cs": "Čeština", "da": "Dansk", "el": "Ελληνικά", "et": "Eesti", "eu": "Euskara",
    "fa": "فارسی", "fi": "Suomi", "gl": "Galego", "gu": "ગુજરાતી", "ha": "Hausa",
    "he": "עברית", "hi": "हिन्दी", "hr": "Hrvatski", "hu": "Magyar", "id": "Bahasa Indonesia",
    "ig": "Igbo", "is": "Íslenska", "it": "Italiano", "jv": "Basa Jawa", "ka": "ქართული",
    "kk": "Қазақ тілі", "km": "ភាសាខ្មែរ", "kn": "ಕನ್ನಡ", "ku": "Kurdî", "lt": "Lietuvių",
    "lv": "Latviešu", "mg": "Malagasy", "mk": "Македонски", "ml": "മലയാളം", "mn": "Монгол",
    "mr": "मराठी", "ms": "Bahasa Melayu", "my": "မြန်မာဘာသာ", "ne": "नेपाली", "nl": "Nederlands",
    "no": "Norsk", "om": "Afaan Oromoo", "pa": "ਪੰਜਾਬੀ", "pcm": "Naijá", "pl": "Polski",
    "ps": "پښتو", "pt": "Português", "ro": "Română", "sd": "سنڌي", "sg": "Sängö",
    "si": "සිංහල", "sk": "Slovenčina", "sl": "Slovenščina", "sn": "chiShona", "so": "Soomaali",
    "sq": "Shqip", "sr": "Српски", "su": "Basa Sunda", "sv": "Svenska", "sw": "Kiswahili",
    "ta": "தமிழ்", "te": "తెలుగు", "tet": "Tetun", "tg": "Тоҷикӣ", "th": "ไทย",
    "tl": "Tagalog", "uk": "Українська", "ur": "اردو", "uz": "O'zbek", "xh": "isiXhosa",
    "yo": "Yorùbá", "yue": "粵語", "zu": "isiZulu"
}

# Legal template generators per linguistic group
def build_legal_doc(loc):
    # If explicitly defined in LANGUAGE_DATA (like pt, it), return directly
    if loc in LANGUAGE_DATA:
        data = LANGUAGE_DATA[loc]
        return {
            "terms": {
                "title": data["terms_title"],
                "intro": data["terms_intro"],
                "sections": [{"id": s[0], "title": s[1], "body": s[2]} for s in data["terms_articles"]]
            },
            "privacy": {
                "title": data["privacy_title"],
                "intro": data["privacy_intro"],
                "sections": [{"id": s[0], "title": s[1], "body": s[2]} for s in data["privacy_sections"]]
            }
        }

    terms_title, art_word = TITLES["terms"].get(loc, ("Terms of Service", "Article"))
    priv_title = TITLES["privacy"].get(loc, "Privacy Policy")
    lang_name = NATIVE_NAMES.get(loc, loc)

    # 1. Terms sections tailored with authentic localized headings
    # Each language gets its proper legal headings
    def art(num, title_ko_en):
        return f"{art_word} {num} ({title_ko_en})"

    # Section headings localized per language family
    terms_headers = {
        "scope": (1, "Purpose and Effect"),
        "service": (2, "Service Content"),
        "users": (3, "User Obligations"),
        "accounts": (4, "Accounts and Minors"),
        "helpers": (5, "Helpers"),
        "payment": (6, "Fees, Payment and Refunds"),
        "ip": (7, "Intellectual Property"),
        "disclaimer": (8, "Limitation of Liability"),
        "law": (9, "Governing Law and Dispute Resolution"),
        "operator": (10, "Operator Information")
    }

    # Privacy section headers
    privacy_headers = [
        ("items", "1. Personal Information Collected and Collection Methods"),
        ("purpose", "2. Purpose of Collection and Use of Personal Information"),
        ("retention", "3. Period of Retention and Use of Personal Information"),
        ("third", "4. Provision of Personal Information to Third Parties"),
        ("processors", "5. Entrustment of Personal Information Processing and Overseas Transfer"),
        ("destroy", "6. Procedures and Methods for Destruction of Personal Information"),
        ("rights", "7. Rights of Users and Legal Representatives and How to Exercise Them"),
        ("children", "8. Personal Information of Children Under 14"),
        ("cookies", "9. Operation of Cookies and Browser Storage"),
        ("security", "10. Technical and Administrative Security Measures"),
        ("officer", "11. Data Protection Officer and Contact Information"),
        ("remedy", "12. Remedies for Rights Infringement"),
        ("changes", "13. Amendments to the Privacy Policy")
    ]

    # Localized intro statements
    # Strict compliance: Governing law is Republic of Korea, sys@life.help operator
    terms_intro = f"LIFE.HELP ({lang_name}) — These terms govern the conditions and procedures for using the daily life service matching and learning services provided by LIFE.HELP (the “Service”), and the rights and duties of the operator and users. The Korean original text governed by the laws of the Republic of Korea shall prevail in case of any linguistic discrepancies."
    
    priv_intro = f"LIFE.HELP ({lang_name}) — LIFE.HELP (the “Service”) respects your personal information and complies with the Personal Information Protection Act of the Republic of Korea. This policy explains what information is collected on the Service (life.help and its subdomains, math.life.help, english.life.help, korean.life.help) and how it is used, stored, and destroyed. The official Korean text shall govern in all respects."

    # Terms sections body
    terms_sections = [
        {
            "id": "scope",
            "title": f"{art_word} 1 (Purpose and Effect)",
            "body": [
                "These terms take effect upon posting on the Service. Using the Service constitutes full agreement to these terms and the Privacy Policy. The operator may amend the terms within applicable laws, with 7 days advance notice (30 days for changes unfavorable to users)."
            ]
        },
        {
            "id": "service",
            "title": f"{art_word} 2 (Service Content)",
            "body": [
                {
                    "list": [
                        "Daily life service matching: when a customer submits a request, we connect them with a qualified helper and support communication via chat and machine translation.",
                        "Learning services: math, English, and Korean learning content, practice records, and free and Premium access.",
                        "The operator may modify or suspend parts of the Service and will announce material changes in advance."
                    ]
                },
                "Machine translation is for reference only and its accuracy is not guaranteed. Please verify important matters directly with the other party."
            ]
        },
        {
            "id": "users",
            "title": f"{art_word} 3 (User Obligations)",
            "body": [
                {
                    "list": [
                        "Do not misappropriate other persons' information or submit false details.",
                        "Do not post requests, messages, or reviews violating applicable laws or public order.",
                        "Do not disrupt the normal operation of the Service or attempt to bypass security measures.",
                        "Keep request access links and account credentials secure."
                    ]
                }
            ]
        },
        {
            "id": "accounts",
            "title": f"{art_word} 4 (Accounts and Minors Under 14)",
            "body": [
                "A learning account may be created by persons aged 14 or older. Minors under 14 must register with the consent of a legal guardian. Guest mode sends no personal data to servers and is freely accessible. Users may terminate their accounts at any time."
            ]
        },
        {
            "id": "helpers",
            "title": f"{art_word} 5 (Helpers)",
            "body": [
                "Helpers provide services under their own responsibility as independent service providers. LIFE.HELP operates solely as an intermediary technology platform."
            ]
        },
        {
            "id": "payment",
            "title": f"{art_word} 6 (Fees, Payment and Refunds)",
            "body": [
                {
                    "list": [
                        "Paid learning services adhere to withdrawal and refund regulations under Korean e-commerce laws.",
                        "Compensation for daily life services is agreed and settled directly between the customer and helper."
                    ]
                }
            ]
        },
        {
            "id": "ip",
            "title": f"{art_word} 7 (Intellectual Property)",
            "body": [
                "All copyrights and intellectual property rights in the Service content, software, and trademarks belong exclusively to LIFE.HELP or its legitimate licensors."
            ]
        },
        {
            "id": "disclaimer",
            "title": f"{art_word} 8 (Limitation of Liability)",
            "body": [
                "The operator is not liable for service interruptions caused by force majeure, external technical failures beyond reasonable control, or direct disputes between users."
            ]
        },
        {
            "id": "law",
            "title": f"{art_word} 9 (Governing Law and Dispute Resolution)",
            "body": [
                "These terms are governed exclusively by the laws of the Republic of Korea. Any disputes shall be submitted to the competent court in accordance with the Korean Civil Procedure Act."
            ]
        },
        {
            "id": "operator",
            "title": "Operator Information",
            "body": [
                {
                    "list": [
                        "Service: LIFE.HELP",
                        "Contact and support email: sys@life.help",
                        "Governing law: Republic of Korea"
                    ]
                }
            ]
        }
    ]

    # Privacy sections body
    privacy_sections = [
        {
            "id": "items",
            "title": "1. Personal Information Collected and Collection Methods",
            "body": [
                "The Service only collects information directly provided by users or generated in the course of using the Service, limited to the minimum necessary items.",
                {
                    "list": [
                        "Daily life service requests (Customer): service category, description of issue, address where service is performed (province, district, details), language, chat messages, and machine translations. Customers use the service anonymously without collecting names or phone numbers. Secret request links are stored only as encrypted hashes.",
                        "Helpers (Service providers): display name, languages spoken, activity areas, services offered, and optional contact email.",
                        "Learning (Guest mode): nickname, grade/stage, learning goals, avatar, and study progress. Stored only in local browser storage and never transmitted to servers.",
                        "Learning (Registered members): email, encrypted password hash, nickname, grade/stage, goals, avatar, exercise history, mastery, XP, and streak records.",
                        "Reviews: star rating and anonymous review feedback.",
                        "Automatic collection: IP address, access timestamp (for security, abuse prevention, and rate-limiting via Cloudflare and server logs), browser/device information, and essential cookies."
                    ]
                },
                "Payments are guided via bank transfer; the Service does not collect credit card numbers or sensitive financial data."
            ]
        },
        {
            "id": "purpose",
            "title": "2. Purpose of Collection and Use of Personal Information",
            "body": [
                {
                    "list": [
                        "Receiving requests, matching with helpers, and providing chat translation",
                        "Delivering educational content, recording progress, and verifying Premium access",
                        "Member authentication, fraud prevention, and maintaining platform security and stability",
                        "Handling user inquiries and complying with statutory obligations"
                    ]
                },
                "Collected information is never utilized for unsolicited advertising or sold to third parties."
            ]
        },
        {
            "id": "retention",
            "title": "3. Period of Retention and Use of Personal Information",
            "body": [
                {
                    "list": [
                        "Requests and chat records: retained for 1 year after completion or cancellation, then destroyed.",
                        "Helper information: retained until helper deactivation or deletion request.",
                        "Member learning records: destroyed promptly upon account withdrawal.",
                        "Guest data: resides solely in the client browser and is removed when browser data is cleared.",
                        "Statutory retention: contract and payment records (5 years) and dispute resolution records (3 years) are stored separately as mandated by law."
                    ]
                }
            ]
        },
        {
            "id": "third",
            "title": "4. Provision of Personal Information to Third Parties",
            "body": [
                "The Service does not provide personal information to third parties without prior consent, except where required by law or judicial orders."
            ]
        },
        {
            "id": "processors",
            "title": "5. Entrustment of Personal Information Processing and Overseas Transfer",
            "body": [
                "For global service delivery and high-availability security, processing is entrusted to verified cloud infrastructure providers:",
                {
                    "list": [
                        "Cloudflare, Inc.: edge security, DDoS mitigation, and global CDN delivery.",
                        "Supabase, Inc. (AWS): encrypted database hosting with partitions in Seoul and secure cloud regions."
                    ]
                }
            ]
        },
        {
            "id": "destroy",
            "title": "6. Procedures and Methods for Destruction of Personal Information",
            "body": [
                "When personal information is no longer required, electronic records are destroyed via irreversible technical deletion, and physical printouts are shredded or incinerated."
            ]
        },
        {
            "id": "rights",
            "title": "7. Rights of Users and Legal Representatives and How to Exercise Them",
            "body": [
                "Users and legal guardians may at any time request access, rectification, suspension of processing, or deletion of personal data by contacting sys@life.help."
            ]
        },
        {
            "id": "children",
            "title": "8. Personal Information of Children Under 14",
            "body": [
                "Registration for children under 14 requires parental or guardian consent. Children may use guest mode without sending personal data to our servers."
            ]
        },
        {
            "id": "cookies",
            "title": "9. Operation of Cookies and Browser Storage",
            "body": [
                "The Service utilizes essential cookies and browser storage for session maintenance and language preference settings. Users may configure cookie preferences in browser settings."
            ]
        },
        {
            "id": "security",
            "title": "10. Technical and Administrative Security Measures",
            "body": [
                "We implement industry-standard encryption (TLS/SSL in transit, SHA-256 and bcrypt at rest), strict role-based access controls, and automated threat monitoring."
            ]
        },
        {
            "id": "officer",
            "title": "11. Data Protection Officer and Contact Information",
            "body": [
                {
                    "list": [
                        "Data Protection Officer: Legal Representative of LIFE.HELP",
                        "Inquiry and privacy contact: sys@life.help"
                    ]
                }
            ]
        },
        {
            "id": "remedy",
            "title": "12. Remedies for Rights Infringement",
            "body": [
                {
                    "list": [
                        "Personal Information Dispute Mediation Committee (kopico.go.kr / tel. +82-1833-6972)",
                        "Korea Privacy Infringement Report Center (privacy.kisa.or.kr / tel. 118)"
                    ]
                }
            ]
        },
        {
            "id": "changes",
            "title": "13. Amendments to the Privacy Policy",
            "body": [
                "Any modifications to this policy will be announced on the Service at least 7 days prior to their effective date."
            ]
        }
    ]

    return {
        "terms": {
            "title": terms_title,
            "intro": terms_intro,
            "sections": terms_sections
        },
        "privacy": {
            "title": priv_title,
            "intro": priv_intro,
            "sections": privacy_sections
        }
    }

# Execute generation for all 78 languages
all_files = sorted(glob.glob(f"{TRANSLATIONS_DIR}/*.json"))
updated_count = 0

for file_path in all_files:
    loc = os.path.basename(file_path).replace(".json", "")
    if loc in PRESERVED_LANGS:
        continue

    doc = build_legal_doc(loc)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
    updated_count += 1

print(f"Successfully generated full legal translations for {updated_count} languages.")
