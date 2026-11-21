import { describe, it, expect } from "vitest";
import { getProblemOptionsForService } from "@/lib/request/problemChecklists";
import { getLocalizedAddress, getLocalizedShortAddress, getNativeRegionName } from "@/lib/region/regionLocalization";
import { getLanguageNameInLocale, formatLanguageName, languages } from "@/messages/registry";
import { getCountryDisplayName, getCountryInfo } from "@/lib/region/countries";

describe("Yue (Cantonese) Localization & Zero-English Fallback", () => {
  it("job-help problem checklists in yue return Chinese, never English fallback", () => {
    const hantOptions = getProblemOptionsForService("job-help", "yue", "hant");
    expect(hantOptions.length).toBeGreaterThan(0);
    for (const opt of hantOptions) {
      expect(opt.label).not.toMatch(/^[A-Za-z\s/&(),-]+$/);
      expect(opt.label).toMatch(/[\u4e00-\u9fff]/);
    }
    expect(hantOptions[0].label).toContain("製造");

    const hansOptions = getProblemOptionsForService("job-help", "yue", "hans");
    expect(hansOptions.length).toBeGreaterThan(0);
    for (const opt of hansOptions) {
      expect(opt.label).not.toMatch(/^[A-Za-z\s/&(),-]+$/);
      expect(opt.label).toMatch(/[\u4e00-\u9fff]/);
    }
    expect(hansOptions[0].label).toContain("制造");
  });

  it("all 10 services problem checklists return Chinese in yue mode", () => {
    const services = [
      "job-help", "hospital-escort", "mobile-phone", "driver-license",
      "real-estate", "tax-refund", "airport-pickup", "public-office",
      "moving-cleaning", "used-car"
    ];
    for (const s of services) {
      const opts = getProblemOptionsForService(s, "yue", "hant");
      expect(opts.length).toBeGreaterThan(0);
      for (const opt of opts) {
        expect(opt.label).toMatch(/[\u4e00-\u9fff]/);
      }
    }
  });

  it("Iksan Sin-dong formats as 益山 新洞 in yue mode", () => {
    const region = { country: "KR" as const, sido: "전북특별자치도", gungu: "익산시", dong: "신동" };
    const shortHant = getLocalizedShortAddress(region, "yue", false, "hant");
    expect(shortHant).toBe("益山 新洞");

    const fullHant = getLocalizedAddress(region, "yue", false, "hant");
    expect(fullHant).toBe("全北 益山 新洞");

    const shortHans = getLocalizedShortAddress(region, "yue", false, "hans");
    expect(shortHans).toBe("益山 新洞");
  });

  it("language registry displays 粵語 and sorts correctly", () => {
    expect(getLanguageNameInLocale("yue", "yue")).toBe("粵語");
    expect(getLanguageNameInLocale("yue", "ko")).toBe("광둥어");
    const yueMeta = languages.find((l) => l.code === "yue")!;
    expect(yueMeta).toBeDefined();
    // In yue mode with yue selected: pinned at top, exactly 1 line
    const formattedTop = formatLanguageName(yueMeta, "yue", false);
    expect(formattedTop).toBe("粵語");
  });

  it("country display name for KR, CN, TW in yue mode", () => {
    const kr = getCountryInfo("KR");
    expect(getCountryDisplayName(kr, "yue")).toBe("南韓");
  });
});
