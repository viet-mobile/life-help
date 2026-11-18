# Korean hard-codes on non-Korean pages: triage (i18n-12)

Generated 2026-10-21 from `node scripts/i18n/scan_hardcoded.mjs --json` (heuristic AST scan of `app/`, `components/`, `lib/`; Korean literals only). Total Korean literals: **3512** in **76** files. Counts are literals, not distinct user-visible strings.

## Summary

| Class | Literals | Files |
|---|---:|---:|
| Customer-facing (review each) | 544 | 22 |
| Staff / helper / admin / reviewer only (not translated by design) | 531 | 26 |
| Legal documents (translation needs legal sign-off; skipped) | 108 | 7 |
| Canonical Korean data, per-locale tables and target-language content (legitimate) | 2329 | 21 |

## How to read the customer-facing list

A large share of the `customer` hits are intentional bilingual pairs: the service shows the visitor's language with Korean beside it (`formatBilingual(t(key), "한국어")`, `tKo(...)`, `*Ko` / `colorName` / `badgeLabelKo` fields). Those render Korean only in bilingual display mode and are not leaks. The real leaks are literals shown regardless of locale or binary `isKorean ? ko : en` choices that give every non-Korean, non-English visitor English.

Fixed in this pass (moved to `messages/{en,ko}.json`; other locales fall back to English through `translate()`):

- `components/shared/DesktopShortcutButton.tsx` (7 strings) and `components/pwa/TopPwaBar.tsx` (6 strings): new `shortcut.*` keys.
- `components/customer/PrivacyNotice.tsx` (privacy / terms footer links): new `customer.privacyLink`, `customer.termsLink`.
- `app/review/page.tsx` (admin e-mail footer): new `review.adminEmail`.

Still open (customer-facing, needs translations beyond en/ko): the `stepsKo`/`stepsEn` install steps in `lib/pwa/pwaHelper.ts` and `lib/shortcut/desktopShortcut.ts`; `isKorean` branches in `app/request/page.tsx`; bilingual-only sentences in `components/customer/ServiceDetailView.tsx`; `lib/services.ts` Korean descriptions (ko field of a per-language record, acceptable).

Gate: after the open items are closed, run `python3 scripts/verify_i18n_completeness.py --hardcoded-gate` scoped to customer paths. Do not turn it on for the whole tree: the `canonical`/`staff` classes are legitimate and would need allowlist entries first.

## Counts by file

### Customer-facing (review each)

| Literals | File |
|---:|---|
| 111 | `lib/support/supportStore.ts` |
| 98 | `lib/request/problemChecklists.ts` |
| 76 | `lib/shortcut/desktopShortcut.ts` |
| 54 | `components/customer/CustomerHome.tsx` |
| 52 | `app/request/page.tsx` |
| 29 | `components/support/SupportServiceView.tsx` |
| 29 | `lib/chat/ChatContext.tsx` |
| 25 | `lib/pwa/pwaHelper.ts` |
| 17 | `lib/services.ts` |
| 14 | `components/customer/ServiceDetailView.tsx` |
| 9 | `lib/chat/counselorFormat.ts` |
| 8 | `components/customer/PrivacyNotice.tsx` |
| 7 | `app/login/LoginForm.tsx` |
| 4 | `components/think/ThinkPilot.tsx` |
| 3 | `components/think/ThinkHub.tsx` |
| 2 | `components/shared/LanguageSwitcher.tsx` |
| 1 | `app/payment/page.tsx` |
| 1 | `app/study/[site]/(public)/reset-password/page.tsx` |
| 1 | `components/learn/JournalSender.tsx` |
| 1 | `components/learn/TtsSettings.tsx` |
| 1 | `components/shared/Footer.tsx` |
| 1 | `lib/review/reviewStore.ts` |

### Staff / helper / admin / reviewer only (not translated by design)

| Literals | File |
|---:|---|
| 121 | `app/admin/AdminDashboardClient.tsx` |
| 81 | `app/tech/contract/page.tsx` |
| 51 | `app/tech/workspace/page.tsx` |
| 35 | `app/tech/page.tsx` |
| 35 | `components/tech/WorkHoursPicker.tsx` |
| 31 | `components/tech/HelperCalendar.tsx` |
| 28 | `components/jiu/Journal.tsx` |
| 26 | `components/learn/review/ReviewList.tsx` |
| 14 | `app/study/[site]/(review)/review/page.tsx` |
| 14 | `lib/jiu/journal.ts` |
| 13 | `components/learn/ReviewPasswordReset.tsx` |
| 12 | `app/jiu/admin/page.tsx` |
| 9 | `lib/helper/helperFormat.ts` |
| 8 | `components/learn/review/ReviewFrame.tsx` |
| 7 | `components/jiu/JournalMailSync.tsx` |
| 7 | `lib/admin/adminMessage.ts` |
| 7 | `lib/helper/HelperContext.tsx` |
| 6 | `lib/jiu/mailReport.ts` |
| 5 | `app/study/[site]/(review)/review/[level]/page.tsx` |
| 5 | `app/tech/login/page.tsx` |
| 5 | `lib/auth/deviceAuth.ts` |
| 4 | `lib/auth/accessKey.ts` |
| 2 | `app/jiu/page.tsx` |
| 2 | `lib/id/userIdentifier.ts` |
| 2 | `lib/jiu/brand.ts` |
| 1 | `app/auth/actions.ts` |

### Legal documents (translation needs legal sign-off; skipped)

| Literals | File |
|---:|---|
| 97 | `lib/legal/documents.ts` |
| 2 | `app/privacy/page.tsx` |
| 2 | `app/study/[site]/(public)/privacy/page.tsx` |
| 2 | `app/study/[site]/(public)/terms/page.tsx` |
| 2 | `app/terms/page.tsx` |
| 2 | `components/legal/LegalDocument.tsx` |
| 1 | `components/legal/LegalPage.tsx` |

### Canonical Korean data, per-locale tables and target-language content (legitimate)

| Literals | File |
|---:|---|
| 671 | `lib/region/regions.ts` |
| 658 | `lib/region/regionUITexts.ts` |
| 431 | `lib/learn/i18n/ko.ts` |
| 199 | `lib/learn/content/listening/passages-ko.ts` |
| 112 | `lib/learn/content/listening/examples-ko.ts` |
| 71 | `lib/region/countries.ts` |
| 62 | `components/think/labels.ts` |
| 30 | `lib/region/regionLocalization.ts` |
| 26 | `lib/learn/pron.ts` |
| 16 | `lib/think/areas.ts` |
| 8 | `lib/i18n/siteMetadata.ts` |
| 8 | `lib/think/bosses.ts` |
| 6 | `components/think/flowLabels.ts` |
| 6 | `components/think/hubLabels.ts` |
| 6 | `lib/think/korean-levels.ts` |
| 5 | `lib/learn/hintGate.ts` |
| 4 | `lib/learn/content/english-bank.ts` |
| 4 | `lib/learn/content/korean-bank.ts` |
| 3 | `lib/think/grades.ts` |
| 2 | `lib/think/cadence.ts` |
| 1 | `lib/think/lang.ts` |
