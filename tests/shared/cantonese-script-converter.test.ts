import { describe, it, expect } from "vitest";
import {
  isDualScriptLocale,
  DUAL_SCRIPT_LANGUAGES,
  convertScript,
} from "@/lib/i18n/scriptConverter";
import { convertTradToSimp } from "@/lib/i18n/chineseConverter";

describe("Cantonese Dual Script (Traditional / Simplified) Engine", () => {
  it("recognizes yue as a dual script locale", () => {
    expect(isDualScriptLocale("yue")).toBe(true);
    const meta = DUAL_SCRIPT_LANGUAGES["yue"];
    expect(meta).toBeDefined();
    expect(meta.defaultScript).toBe("hant");
    expect(meta.script1).toBe("hant");
    expect(meta.script2).toBe("hans");
    expect(meta.script1Icon).toBe("繁");
    expect(meta.script2Icon).toBe("簡");
    expect(meta.script1Label).toBe("");
    expect(meta.script2Label).toBe("");
    expect(meta.script1Name).toContain("Traditional");
    expect(meta.script2Name).toContain("Simplified");
  });

  it("keeps original text when targetScript is hant (Traditional)", () => {
    const original = "讓生活更有幫助的生活資訊，歡迎諮詢我們的專業顧問。";
    const result = convertScript(original, "yue", "hant");
    expect(result).toBe(original);
  });

  it("converts Cantonese text to Simplified Chinese when targetScript is hans", () => {
    const testCases: [string, string][] = [
      ["點擊切換", "点击切换"],
      ["服務", "服务"],
      ["廣東話", "广东话"],
      ["馬桶堵塞", "马桶堵塞"],
      ["韓國居住", "韩国居住"],
      ["簽證文件指南", "签证文件指南"],
      ["讓生活更有幫助的生活資訊", "让生活更有帮助的生活资讯"],
      ["即將推出", "即将推出"],
      ["查看詳情", "查看详情"],
      ["立即申請緊急幫助", "立即申请紧急帮助"],
    ];

    for (const [trad, expectedSimp] of testCases) {
      const converted = convertScript(trad, "yue", "hans");
      expect(converted).toBe(expectedSimp);
    }
  });

  it("directly tests convertTradToSimp with phrases and characters", () => {
    expect(convertTradToSimp("香港以及廣東話")).toBe("香港以及广东话");
    expect(convertTradToSimp("")).toBe("");
  });

  it("ensures existing Cyrillic/Latin dual script languages still function without regression", () => {
    expect(isDualScriptLocale("uz")).toBe(true);
    expect(isDualScriptLocale("sr")).toBe(true);
    expect(isDualScriptLocale("kk")).toBe(true);
    expect(isDualScriptLocale("tg")).toBe(true);
    expect(isDualScriptLocale("az")).toBe(true);
    expect(isDualScriptLocale("mn")).toBe(true);

    // Serbian Cyrillic to Latin
    const srCyr = "Српски језик";
    const srLat = convertScript(srCyr, "sr", "latn");
    expect(srLat).toBe("Srpski jezik");
  });
});
