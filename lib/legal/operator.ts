/**
 * Operator facts printed in the Privacy Policy and Terms of Service.
 * Fill these in before launch (scripts/ops/launch-check.mjs lists what is still empty). Empty values are not printed.
 */
export const OPERATOR = {
  /** 상호 / legal name of the operator */
  name: "",
  /** 대표자 */
  representative: "",
  /** 사업자등록번호 */
  businessNo: "",
  /** 통신판매업 신고번호 */
  mailOrderNo: "",
  /** 주소 */
  address: "",
  /** 개인정보 보호책임자 (성명 / 직책) */
  privacyOfficer: "",
  /** 개인정보 문의 이메일 */
  privacyEmail: "contact@life.help",
  /** 일반 문의 이메일 */
  contactEmail: "contact@life.help",
  /** 시행일 (YYYY-MM-DD). Empty = draft, printed as "시행 예정 / to take effect at launch". */
  effectiveDate: "",
  /** Supabase 프로젝트 리전 (예: "Seoul (ap-northeast-2)") */
  dbRegion: "",
} as const;

/** Bump when the text of a document changes in a way users must be told about; stored with each account's consent. */
export const LEGAL_VERSION = "2026-10-12-draft";
