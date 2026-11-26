import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { getLocalizedSidoList, getLocalizedGunguList } from "@/lib/region/regionLocalization";

describe("Helper Registration & 89 Languages Verification", () => {
  it("SupportServiceView directly calls HelperAuthCard and does not display unwanted notice", () => {
    const src = readFileSync(join(process.cwd(), "components/support/SupportServiceView.tsx"), "utf-8");
    expect(src).toContain("<HelperAuthCard");
    expect(src).not.toContain("support.providerNoticeTitle");
    expect(src).not.toContain("support.providerNoticeDesc");
    expect(src).toContain("initialServices={normalizeServiceSlug(slug)");
  });

  it("HelperAuthCard supports initialServices and localized region selection", () => {
    const src = readFileSync(join(process.cwd(), "components/tech/HelperAuthCard.tsx"), "utf-8");
    expect(src).toContain("initialServices?: string[]");
    expect(src).toContain("getLocalizedSidoList");
    expect(src).toContain("getLocalizedGunguList");
  });

  it("All 89 official languages have 100% populated svc.auth and service keys", () => {
    const messagesDir = join(process.cwd(), "messages");
    const files = readdirSync(messagesDir).filter((f) => f.endsWith(".json") && f !== "languageNames.json");
    
    expect(files.length).toBeGreaterThanOrEqual(89);

    const authKeys = [
      "tabRegister", "tabLogin", "registerTitle", "registerDesc",
      "loginTitle", "loginDesc", "name", "email", "services",
      "region", "wholeProvince", "registerSubmit", "working",
      "loginSubmit", "loginLabel", "codeTitle", "codeWarn",
      "codeCopy", "codeCopied", "codeContinue", "pendingNote",
      "errInput", "errRate", "errUnavailable", "errCode", "errGeneric"
    ];

    const serviceKeys = [
      "clog", "leakPlumbing", "boiler", "cleaning", "housing",
      "bankHelp", "insuranceHelp", "jobHelp", "hospitalHelp", "mobileHelp"
    ];

    for (const file of files) {
      const raw = readFileSync(join(messagesDir, file), "utf-8");
      const data = JSON.parse(raw);
      const lang = file.replace(".json", "");

      // Check svc.auth keys
      const svcAuth = data.svc?.auth;
      expect(svcAuth, `Missing svc.auth in ${lang}`).toBeDefined();
      for (const k of authKeys) {
        expect(svcAuth[k], `Missing svc.auth.${k} in ${lang}`).toBeTruthy();
      }

      // Check canonical service keys
      const service = data.service;
      expect(service, `Missing service in ${lang}`).toBeDefined();
      for (const k of serviceKeys) {
        expect(service[k], `Missing service.${k} in ${lang}`).toBeTruthy();
      }
    }
  });

  it("Region localization functions execute cleanly for key languages across all regions", () => {
    const testLocales = ["ko", "en", "vi", "zh-Hant", "ne", "uz", "km", "ru", "th", "ja"];
    for (const loc of testLocales) {
      const sidos = getLocalizedSidoList(loc, true);
      expect(sidos.length).toBeGreaterThanOrEqual(17);
      expect(sidos[0].display).toBeTruthy();

      const gungus = getLocalizedGunguList(sidos[0].ko, loc, true);
      expect(gungus.length).toBeGreaterThan(0);
      expect(gungus[0].display).toBeTruthy();
    }
  });
});
