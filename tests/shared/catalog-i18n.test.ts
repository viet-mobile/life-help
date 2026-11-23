import { describe, it, expect } from "vitest";
import { getCatalogI18n } from "@/lib/learn/dailyInsights/catalogI18n";
import { locales } from "@/messages/registry";

describe("366-Day Complete Catalog & Multilingual Selector 89-Language I18n", () => {
  it("covers all 89 registered languages without any missing fields", () => {
    expect(locales.length).toBe(89);

    for (const loc of locales) {
      const i18n = getCatalogI18n(loc);
      expect(i18n.home, `home missing in ${loc}`).toBeTruthy();
      expect(i18n.single, `single missing in ${loc}`).toBeTruthy();
      expect(i18n.singleClear, `singleClear missing in ${loc}`).toBeTruthy();
      expect(i18n.catalogBadge, `catalogBadge missing in ${loc}`).toBeTruthy();
      expect(i18n.searchPlaceholder, `searchPlaceholder missing in ${loc}`).toBeTruthy();
      expect(i18n.allCategories, `allCategories missing in ${loc}`).toBeTruthy();
      expect(i18n.corePrinciple, `corePrinciple missing in ${loc}`).toBeTruthy();
      expect(i18n.actionItem, `actionItem missing in ${loc}`).toBeTruthy();
      expect(i18n.share, `share missing in ${loc}`).toBeTruthy();
      expect(i18n.copied, `copied missing in ${loc}`).toBeTruthy();
      expect(i18n.noResults, `noResults missing in ${loc}`).toBeTruthy();

      // Check all 6 core categories
      expect(i18n.categories.wealth, `category wealth missing in ${loc}`).toBeTruthy();
      expect(i18n.categories.saving, `category saving missing in ${loc}`).toBeTruthy();
      expect(i18n.categories.career, `category career missing in ${loc}`).toBeTruthy();
      expect(i18n.categories.health, `category health missing in ${loc}`).toBeTruthy();
      expect(i18n.categories.travel, `category travel missing in ${loc}`).toBeTruthy();
      expect(i18n.categories.problem, `category problem missing in ${loc}`).toBeTruthy();

      // Check formatted results count
      const countStr = i18n.formatTipsFound(366, "Korean");
      expect(countStr).toContain("366");
      expect(countStr).toContain("Korean");
    }
  });

  it("verifies authentic translations for Vietnamese (vi)", () => {
    const vi = getCatalogI18n("vi");
    expect(vi.home).toBe("Trang chủ");
    expect(vi.single).toBe("Đơn ngữ");
    expect(vi.singleClear).toContain("Đơn ngữ");
    expect(vi.catalogBadge).toContain("366");
    expect(vi.allCategories).toBe("Tất cả danh mục");
    expect(vi.categories.wealth).toBe("Tích lũy tài sản");
    expect(vi.categories.saving).toBe("Tiết kiệm thông minh");
    expect(vi.categories.career).toBe("Nghề nghiệp và việc làm");
    expect(vi.categories.health).toBe("Sức khỏe và an sinh");
    expect(vi.categories.travel).toBe("Mẹo du lịch");
    expect(vi.categories.problem).toBe("Giải quyết vấn đề thường ngày");
    expect(vi.corePrinciple).toBe("Nguyên tắc cốt lõi");
    expect(vi.actionItem).toBe("Một việc làm hôm nay");
  });

  it("verifies authentic translations for Korean (ko)", () => {
    const ko = getCatalogI18n("ko");
    expect(ko.home).toBe("홈으로");
    expect(ko.single).toBe("단일 언어");
    expect(ko.singleClear).toBe("단일 언어 표기 (모두 해제)");
    expect(ko.catalogBadge).toBe("366일 전과목 실천 가이드");
    expect(ko.allCategories).toBe("전체 분야");
    expect(ko.categories.wealth).toBe("재산 증식");
    expect(ko.categories.saving).toBe("비용 절약");
    expect(ko.categories.career).toBe("경력·구직");
    expect(ko.categories.health).toBe("건강");
    expect(ko.categories.travel).toBe("여행");
    expect(ko.categories.problem).toBe("생활 문제 해결");
  });

  it("verifies authentic translations for Japanese (ja) & Chinese (zh-Hans, zh-Hant)", () => {
    const ja = getCatalogI18n("ja");
    expect(ja.home).toBe("ホーム");
    expect(ja.single).toBe("単一言語");
    expect(ja.categories.wealth).toBe("資産形成");

    const zhHans = getCatalogI18n("zh-Hans");
    expect(zhHans.home).toBe("首页");
    expect(zhHans.single).toBe("单语言");
    expect(zhHans.categories.wealth).toBe("财富积累");

    const zhHant = getCatalogI18n("zh-Hant");
    expect(zhHant.home).toBe("首頁");
    expect(zhHant.single).toBe("單語言");
  });

  it("verifies authentic translations for Spanish (es) & French (fr)", () => {
    const es = getCatalogI18n("es");
    expect(es.home).toBe("Inicio");
    expect(es.single).toBe("Único");
    expect(es.categories.health).toBe("Salud y bienestar");

    const fr = getCatalogI18n("fr");
    expect(fr.home).toBe("Accueil");
    expect(fr.single).toBe("Unique");
    expect(fr.categories.health).toBe("Santé et bien-être");
  });
});
