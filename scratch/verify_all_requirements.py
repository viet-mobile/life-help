import json
import glob
import os
import sys
import urllib.request

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def check_json_files():
    files = glob.glob("messages/*.json")
    print(f"Checking {len(files)} language files...")
    assert len(files) == 38, f"Expected 38 files, found {len(files)}"

    required_top_keys = ["customer", "service", "serviceDesc", "trustMetrics", "privacy", "support", "supportChecklist"]
    
    for fpath in files:
        lang = os.path.basename(fpath).replace(".json", "")
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        for k in required_top_keys:
            assert k in data, f"Missing top-level key '{k}' in {lang}.json"
            
        # Check trustMetrics
        tm = data["trustMetrics"]
        for tmk in ["languages", "dispatch", "safeNumber"]:
            assert tmk in tm, f"Missing trustMetrics.{tmk} in {lang}.json"
            
        # Check privacy
        pr = data["privacy"]
        for prk in ["badge", "title", "cardZeroPhoneTitle", "cardZeroPhoneDesc", "cardRealtimeChatTitle", "cardRealtimeChatDesc", "cardVerifiedHelperTitle", "cardVerifiedHelperDesc"]:
            assert prk in pr, f"Missing privacy.{prk} in {lang}.json"
            
        # Check customer filter buttons
        cust = data["customer"]
        for ck in ["allView", "repairView", "supportView"]:
            assert ck in cust, f"Missing customer.{ck} in {lang}.json"
            
    print("All 38 language files have all required keys!")

def check_amharic_vietnamese():
    # Verify Amharic
    with open("messages/am.json", "r", encoding="utf-8") as f:
        am = json.load(f)
    print("Amharic jobHelp service name:", am["service"].get("jobHelp"))
    assert am["service"].get("jobHelp") != "Job Search & Employment Assistance", "Amharic jobHelp still English!"
    print("Amharic jobHelp checklist:", am["supportChecklist"].get("jobHelp"))

    # Verify Vietnamese
    with open("messages/vi.json", "r", encoding="utf-8") as f:
        vi = json.load(f)
    print("Vietnamese trustMetrics:", vi["trustMetrics"])
    print("Vietnamese privacy card:", vi["privacy"]["cardZeroPhoneTitle"])
    assert "전화번호 수집 제로" not in vi["privacy"]["cardZeroPhoneTitle"], "Vietnamese privacy card still Korean!"

def check_no_parens_in_korean():
    with open("messages/ko.json", "r", encoding="utf-8") as f:
        content = f.read()
    assert "(" not in content and ")" not in content, "Parentheses found in ko.json!"
    print("Verified 0 parentheses in ko.json!")

def check_server_endpoints():
    endpoints = [
        "http://localhost:3000/",
        "http://localhost:3000/services/job-help",
        "http://localhost:3000/services/clog-clearing",
        "http://localhost:3000/services/leak-plumbing",
        "http://localhost:3000/services/boiler",
        "http://localhost:3000/services/cleaning",
        "http://localhost:3000/services/housing",
        "http://localhost:3000/services/job-help?tab=provider",
        "http://localhost:3000/tech",
        "http://localhost:3000/tech/register",
    ]
    print("\nTesting HTTP endpoints on dev server...")
    for url in endpoints:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "VerificationScript/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.getcode()
                print(f"[{status}] {url}")
                assert status == 200, f"Expected 200, got {status} for {url}"
        except Exception as e:
            print(f"[FAIL] {url} -> {e}")
            raise e
    print("All endpoints returned 200 OK!")

if __name__ == "__main__":
    check_json_files()
    check_amharic_vietnamese()
    check_no_parens_in_korean()
    check_server_endpoints()
    print("\n==========================================")
    print("ALL VERIFICATION CHECKS PASSED (100%)!")
    print("==========================================")

