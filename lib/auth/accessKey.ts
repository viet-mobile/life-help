/**
 * 3-Month (90-Day) Security Access Key System
 * Generates and validates long-term authentication keys for Helpers and Counselors,
 * reducing recurring SMS costs and providing 90-day seamless session persistence.
 */

export interface AccessKeyRecord {
  key: string;
  issuedAt: string;
  expiresAt: string;
  phone: string;
}

/**
 * Generates a clean, copy-friendly, high-entropy 32-character access key (2x length).
 * Formatted with hyphens (e.g., LH-9F8A-7B2C-4D1E-93A8-5K2M-8P3W-6R7T-1V9Y) to prevent mobile copy/paste errors.
 */
export function generateAccessKey(prefix: string = "LH"): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // excludes ambiguous characters like 0, O, 1, I
  const randomChunk = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

  return `${prefix}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`;
}

/**
 * Calculates expiration timestamp for 90 days (3 months) from now.
 */
export function calculateAccessKeyExpiry(days: number = 90): string {
  const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return expiryDate.toISOString();
}

/**
 * Checks if the given expiration date has passed.
 */
export function isAccessKeyExpired(expiryIso?: string | null): boolean {
  if (!expiryIso) return true;
  const expiryTime = new Date(expiryIso).getTime();
  if (isNaN(expiryTime)) return true;
  return Date.now() >= expiryTime;
}

/**
 * Calculates remaining days until expiration.
 */
export function getRemainingDays(expiryIso?: string | null): number {
  if (!expiryIso) return 0;
  const expiryTime = new Date(expiryIso).getTime();
  if (isNaN(expiryTime)) return 0;
  const diffMs = expiryTime - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Formats a realistic KakaoTalk Alimtalk / SMS dispatch notification payload.
 */
export function formatAccessKeyNotice({
  phone,
  accessKey,
  expiresAt,
  portalName,
}: {
  phone: string;
  accessKey: string;
  expiresAt: string;
  portalName: string;
}) {
  const expiryFormatted = new Date(expiresAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    phone,
    accessKey,
    expiresAt,
    expiryFormatted,
    channel: "카카오톡 알림톡 / SMS",
    title: `[LIFE.HELP] ${portalName} 3개월 보안 접속 코드 발송`,
    body: `[LIFE.HELP] ${portalName} 전용 보안 접속 코드입니다.\n\n🔑 접속 코드: ${accessKey}\n📅 유효기간: ${expiryFormatted}까지 (발급일로부터 90일간 자동 유지)\n\n위 코드를 복사하여 접속 화면에 입력하시면 3개월 동안 번호 인증 없이 즉시 업무를 시작하실 수 있습니다.`,
  };
}

