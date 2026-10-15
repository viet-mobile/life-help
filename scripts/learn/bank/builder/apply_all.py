import json
from build_elementary import get_elementary
from build_middle import get_middle
from build_high import get_high

def generate_full_bank():
    elem = get_elementary()
    mid = get_middle()
    high = get_high()
    all_qs = elem + mid + high
    
    bank_data = {
        "format": "discrete-bank-v1",
        "site": "english",
        "count": len(all_qs),
        "grades": {
            "E1": 555,
            "E2": 555,
            "E3": 555,
            "E4": 555,
            "E5": 555,
            "E6": 555,
            "M1": 555,
            "M2": 555,
            "M3": 555,
            "H1": 555,
            "H2": 555,
            "H3": 555
        },
        "questions": all_qs
    }
    return bank_data

if __name__ == "__main__":
    data = generate_full_bank()
    out_path = "lib/learn/content/bank/english.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(data['questions'])} questions to {out_path}")
