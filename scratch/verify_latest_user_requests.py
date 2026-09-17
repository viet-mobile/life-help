import sys
import re

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def test_vietnam_districts():
    with open("lib/region/vietnamRegions.ts", "r", encoding="utf-8") as f:
        content = f.read()
    assert '"name": "Quận 2"' in content, "Missing Quận 2!"
    assert '"name": "Quận 6"' in content, "Missing Quận 6!"
    assert '"name": "Quận 8"' in content, "Missing Quận 8!"
    assert '"name": "Quận 9"' in content, "Missing Quận 9!"
    print("PASS: Vietnam Ho Chi Minh City includes Quận 2, 6, 8, 9!")

def test_main_service_buttons():
    with open("components/customer/CustomerHome.tsx", "r", encoding="utf-8") as f:
        content = f.read()
    # Check that in displayedServices.map, there is no '신청'
    grid_match = re.search(r'displayedServices\.map\(\(svc\)\s*=>\s*\((.*?)\)\)', content, re.DOTALL)
    assert grid_match, "Could not find displayedServices.map"
    card_code = grid_match.group(1)
    assert "신청" not in card_code, "Found '신청' in service card button!"
    assert "text-2xl sm:text-3xl" in card_code, "Icon font not enlarged!"
    assert "text-[15px] sm:text-[17px]" in card_code, "Title font not enlarged!"
    print("PASS: Main service buttons have '신청' removed and enlarged icon/text!")

def test_support_service_view():
    with open("components/support/SupportServiceView.tsx", "r", encoding="utf-8") as f:
        content = f.read()
    # Check Zero Phone Collection: no customer phone input
    assert 'type="tel"' not in content, "Found type=tel in SupportServiceView!"
    assert 'customerPhone' not in content, "Found customerPhone state in SupportServiceView!"
    assert 'providerPhone' not in content, "Found providerPhone in SupportServiceView!"
    assert 'providerName' not in content, "Found providerName in SupportServiceView!"
    print("PASS: Zero phone and zero name collection implemented in SupportServiceView!")

    # Check '서비스 받을 곳'
    assert "서비스 받을 곳" in content, "Missing '서비스 받을 곳' in SupportServiceView!"
    assert "내 거주 지역" not in content, "Still found '내 거주 지역' in SupportServiceView!"
    print("PASS: '서비스 받을 곳' correctly replaced '내 거주 지역'!")

    # Check Color Codes
    assert "SERVICE_THEMES" in content, "Missing SERVICE_THEMES in SupportServiceView!"
    assert "from-fuchsia-950" in content, "Missing fuchsia theme!"
    assert "from-pink-950" in content, "Missing pink theme!"
    assert "from-orange-950" in content, "Missing orange theme!"
    assert "from-amber-950" in content, "Missing amber theme!"
    assert "from-lime-950" in content, "Missing lime theme!"
    assert "from-teal-950" in content, "Missing teal theme!"
    assert "from-sky-950" in content, "Missing sky theme!"
    assert "from-blue-950" in content, "Missing blue theme!"
    assert "from-indigo-950" in content, "Missing indigo theme!"
    assert "from-purple-950" in content, "Missing purple theme!"
    print("PASS: All 10 service color codes applied to SupportServiceView!")

    # Check Multi-region for helpers
    assert "selectedRegions" in content, "Missing selectedRegions in SupportServiceView!"
    assert "toggleDistrictRegion" in content, "Missing toggleDistrictRegion!"
    print("PASS: Multi-region selection implemented for helpers!")

if __name__ == "__main__":
    test_vietnam_districts()
    test_main_service_buttons()
    test_support_service_view()
    print("\nALL LATEST USER REQUESTS VALIDATED (100% PASS)!")

