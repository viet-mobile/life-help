import { describe, it, expect } from "vitest";
import {
  getLocalizedCountryName,
  getLocalizedSiteDescription,
  getSiteMetadata,
  SITE_METADATA,
} from "@/lib/i18n/siteMetadata";
import { getDomainShortcutDetails } from "@/lib/shortcut/desktopShortcut";

describe("Top Banner & Site Metadata Dynamic Description", () => {
  describe("getLocalizedCountryName", () => {
    it("returns Korea in native script for default or korea slug", () => {
      expect(getLocalizedCountryName("korea", "ko")).toBe("한국");
      expect(getLocalizedCountryName(null, "ko")).toBe("한국");
      expect(getLocalizedCountryName("korea", "en")).toBe("Korea");
      expect(getLocalizedCountryName("korea", "ja")).toBe("韓国");
      expect(getLocalizedCountryName("korea", "zh-Hans")).toBe("韩国");
      expect(getLocalizedCountryName("korea", "zh-Hant")).toBe("韓國");
      expect(getLocalizedCountryName("korea", "vi")).toBe("Hàn Quốc");
    });

    it("returns localized country names for specific country domains", () => {
      expect(getLocalizedCountryName("japan", "ko")).toBe("일본");
      expect(getLocalizedCountryName("japan", "en")).toBe("Japan");
      expect(getLocalizedCountryName("vietnam", "ko")).toBe("베트남");
      expect(getLocalizedCountryName("vietnam", "en")).toBe("Vietnam");
      expect(getLocalizedCountryName("us", "ko")).toBe("미국");
      expect(getLocalizedCountryName("us", "en")).toBe("the United States");
      expect(getLocalizedCountryName("china", "ko")).toBe("중국");
      expect(getLocalizedCountryName("taiwan", "ko")).toBe("대만");
    });
  });

  describe("getLocalizedSiteDescription", () => {
    it("renders '한국에 사는 모든 사람' for Korean default", () => {
      const desc = getLocalizedSiteDescription("ko", "korea");
      expect(desc).toBe(
        "한국에 사는 모든 사람을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다."
      );
      // Ensure old phrase is completely eliminated
      expect(desc).not.toContain("한국 거주 외국인");
    });

    it("dynamically swaps country name when country domain changes in Korean", () => {
      expect(getLocalizedSiteDescription("ko", "japan")).toContain("일본에 사는 모든 사람을 위한 생활서비스 플랫폼");
      expect(getLocalizedSiteDescription("ko", "vietnam")).toContain("베트남에 사는 모든 사람을 위한 생활서비스 플랫폼");
      expect(getLocalizedSiteDescription("ko", "us")).toContain("미국에 사는 모든 사람을 위한 생활서비스 플랫폼");
      expect(getLocalizedSiteDescription("ko", "china")).toContain("중국에 사는 모든 사람을 위한 생활서비스 플랫폼");
    });

    it("renders localized descriptions in English for different country domains", () => {
      expect(getLocalizedSiteDescription("en", "korea")).toContain(
        "Living services platform for all people living in Korea"
      );
      expect(getLocalizedSiteDescription("en", "japan")).toContain(
        "Living services platform for all people living in Japan"
      );
      expect(getLocalizedSiteDescription("en", "us")).toContain(
        "Living services platform for all people living in the United States"
      );
      expect(getLocalizedSiteDescription("en", "vietnam")).toContain(
        "Living services platform for all people living in Vietnam"
      );
    });

    it("renders localized descriptions in Japanese, Vietnamese and Chinese", () => {
      expect(getLocalizedSiteDescription("ja", "japan")).toContain(
        "日本に住むすべての人のための生活支援プラットフォーム"
      );
      expect(getLocalizedSiteDescription("vi", "vietnam")).toContain(
        "Nền tảng dịch vụ sinh hoạt cho tất cả mọi người sinh sống tại Việt Nam"
      );
      expect(getLocalizedSiteDescription("zh-Hans", "china")).toContain(
        "面向所有在中国居民的生活服务平台"
      );
      expect(getLocalizedSiteDescription("zh-Hant", "taiwan")).toContain(
        "專為在台灣所有居民打造的生活服務平臺"
      );
    });
  });

  describe("getDomainShortcutDetails integration", () => {
    it("provides the banner description matching the host country domain", () => {
      const koreaDetails = getDomainShortcutDetails({ host: "korea.life.help", pathname: "/" });
      expect(koreaDetails.description).toBe(
        "한국에 사는 모든 사람을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다."
      );

      const japanDetailsDefault = getDomainShortcutDetails({ host: "japan.life.help", pathname: "/" });
      // When visiting japan.life.help without locale override, language defaults to ja
      expect(japanDetailsDefault.description).toContain("日本に住むすべての人のための生活支援プラットフォーム");

      // When Korean user visits japan.life.help (localeOverride: 'ko')
      const japanDetailsKo = getDomainShortcutDetails({
        host: "japan.life.help",
        pathname: "/",
        localeOverride: "ko",
      });
      expect(japanDetailsKo.description).toContain("일본에 사는 모든 사람을 위한 생활서비스 플랫폼");

      // When visiting vietnam.life.help without locale override, language defaults to vi
      const vietnamDetailsDefault = getDomainShortcutDetails({ host: "vietnam.life.help", pathname: "/" });
      expect(vietnamDetailsDefault.description).toContain("Nền tảng dịch vụ sinh hoạt cho tất cả mọi người sinh sống tại Việt Nam");

      // When Korean user visits vietnam.life.help (localeOverride: 'ko')
      const vietnamDetailsKo = getDomainShortcutDetails({
        host: "vietnam.life.help",
        pathname: "/",
        localeOverride: "ko",
      });
      expect(vietnamDetailsKo.description).toContain("베트남에 사는 모든 사람을 위한 생활서비스 플랫폼");

      const usDetailsEn = getDomainShortcutDetails({
        host: "us.life.help",
        pathname: "/",
        localeOverride: "en",
      });
      expect(usDetailsEn.description).toContain(
        "Living services platform for all people living in the United States"
      );

      const japanDetailsJa = getDomainShortcutDetails({
        host: "japan.life.help",
        pathname: "/",
        localeOverride: "ja",
      });
      expect(japanDetailsJa.description).toContain(
        "日本に住むすべての人のための生活支援プラットフォーム"
      );
    });
  });

  describe("getSiteMetadata dynamic social tags", () => {
    it("dynamically returns description according to country parameter", () => {
      const koKorea = getSiteMetadata("ko", "korea");
      expect(koKorea.description).toBe(
        "한국에 사는 모든 사람을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다."
      );

      const koJapan = getSiteMetadata("ko", "japan");
      expect(koJapan.description).toContain("일본에 사는 모든 사람을 위한 생활서비스 플랫폼");

      const enUS = getSiteMetadata("en", "us");
      expect(enUS.description).toContain("Living services platform for all people living in the United States");
    });

    it("verifies SITE_METADATA base descriptions do not contain old Korean resident wording", () => {
      expect(SITE_METADATA["ko"].description).toBe(
        "한국에 사는 모든 사람을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다."
      );
      expect(SITE_METADATA["en"].description).toContain(
        "Living services platform for all people living in Korea"
      );
    });
  });
});
