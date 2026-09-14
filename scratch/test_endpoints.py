import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

urls = [
    "http://localhost:3000",
    "http://localhost:3000/services/clog-clearing",
    "http://localhost:3000/services/leak-plumbing",
    "http://localhost:3000/services/administrative-legal",
    "http://localhost:3000/services/medical-hospital",
    "http://localhost:3000/services/finance-banking",
]

all_ok = True
for url in urls:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            print(f"[{res.status}] {url}")
    except Exception as e:
        print(f"[FAIL] {url}: {e}")
        all_ok = False

# Also test host headers for some countries
host_tests = [
    ("us.life.help", "United States"),
    ("korea.life.help", "Korea"),
    ("vietnam.life.help", "Vietnam"),
    ("france.life.help", "France"),
    ("russia.life.help", "Russia"),
    ("singapore.life.help", "Singapore"),
]

for host, name in host_tests:
    try:
        req = urllib.request.Request("http://localhost:3000", headers={"Host": host, "User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            print(f"[{res.status}] Host: {host} ({name})")
    except Exception as e:
        print(f"[FAIL] Host: {host}: {e}")
        all_ok = False

print(f"\nAll tests passed: {all_ok}")

