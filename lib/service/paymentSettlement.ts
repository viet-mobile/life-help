import { calculatePlatformFeeRate, calculatePlatformFeePercent, BASE_FEE_PERCENT } from "@/lib/referral/policy";

/**
 * Service Marketplace Payment & Platform Fee Settlement System
 *
 * Fee Scale Rule (2026-11-17):
 *   - Base fee: 10.00%
 *   - 1 friend invited: Fee drops to 9.99% (-0.01%p)
 *   - Each additional invite reduces fee by 0.01%p
 *   - At 999 invites: Reaches minimum floor of 0.01%
 */

export const SERVICE_BASE_PRICES: Record<string, number> = {
  "boiler": 70000,
  "cleaning": 60000,
  "clog-clearing": 50000,
  "leak-plumbing": 65000,
  "housing": 30000,
  "hospital-help": 40000,
  "bank-help": 30000,
  "job-help": 30000,
  "mobile-help": 20000,
  "insurance-help": 30000,
  "toilet-clog": 50000,
  "sink-clog": 50000,
};

export const DEFAULT_SERVICE_PRICE = 50000;
export const PLATFORM_FEE_RATE = 0.10; // 10% Platform Commission Fee

export type ServicePaymentStatus = "UNPAID" | "PAYMENT_PENDING" | "PAID" | "SETTLED" | "REFUNDED";
export type PaymentMethod = "CARD" | "EASY_PAY" | "TRANSFER";

export interface ServicePaymentRecord {
  requestId: string;
  serviceSlug: string;
  serviceNameKo: string;
  baseAmountKrw: number;
  discountKrw: number;
  totalAmountKrw: number;
  platformFeeKrw: number;     // platform revenue for admin
  helperPayoutKrw: number;    // net payout for helper
  feePercent?: number;        // fee rate percent applied (10.00% ~ 0.01%)
  paymentStatus: ServicePaymentStatus;
  paymentMethod?: PaymentMethod;
  referralCodeApplied?: string;
  paidAt?: string | null;
  settledAt?: string | null;
  helperId?: string | null;
  customerId?: string | null;
}

export interface HelperEarningsSummary {
  totalCompletedJobs: number;
  totalGrossVolumeKrw: number;
  totalPlatformFeesKrw: number;
  totalNetEarningsKrw: number;
  pendingPayoutKrw: number;
  settledPayoutKrw: number;
  records: ServicePaymentRecord[];
}

export interface AdminRevenueSummary {
  totalTransactions: number;
  totalGrossVolumeKrw: number;
  totalPlatformRevenueKrw: number; // 10% Platform fee collected by operator
  totalHelperDisbursementsKrw: number; // 90% to helpers
  pendingSettlementsKrw: number;
  records: ServicePaymentRecord[];
}

// In-memory payment ledger cache attached to globalThis to persist across module reloads
const g = globalThis as unknown as { __paymentStore?: Map<string, ServicePaymentRecord> };
if (!g.__paymentStore) {
  g.__paymentStore = new Map<string, ServicePaymentRecord>();
}
const paymentStore = g.__paymentStore;

const SERVICE_NAME_KO: Record<string, string> = {
  "boiler": "보일러 시공·수리",
  "cleaning": "생활 청소",
  "clog-clearing": "각종 막힘 해결",
  "leak-plumbing": "누수 방지·배관 공사",
  "housing": "원룸·방 구하기",
  "hospital-help": "병원 동행·통역",
  "bank-help": "은행 계좌 개설",
  "job-help": "구인·구직 도움",
  "mobile-help": "휴대폰 개통 도움",
  "insurance-help": "보험 가입 도움",
};

export function getOrCreatePaymentRecord(
  requestId: string,
  serviceSlug: string,
  helperId?: string | null,
  customerId?: string | null,
  invitedCount: number = 0
): ServicePaymentRecord {
  const existing = paymentStore.get(requestId);
  if (existing) {
    if (helperId && !existing.helperId) existing.helperId = helperId;
    if (customerId && !existing.customerId) existing.customerId = customerId;
    return existing;
  }

  const basePrice = SERVICE_BASE_PRICES[serviceSlug] ?? DEFAULT_SERVICE_PRICE;
  const feeRate = calculatePlatformFeeRate(invitedCount);
  const platformFee = Math.max(1, Math.round(basePrice * feeRate));
  const helperPayout = basePrice - platformFee;

  const record: ServicePaymentRecord = {
    requestId,
    serviceSlug,
    serviceNameKo: SERVICE_NAME_KO[serviceSlug] ?? "생활 맞춤 서비스",
    baseAmountKrw: basePrice,
    discountKrw: 0,
    totalAmountKrw: basePrice,
    platformFeeKrw: platformFee,
    helperPayoutKrw: helperPayout,
    feePercent: calculatePlatformFeePercent(invitedCount),
    paymentStatus: "PAYMENT_PENDING",
    paidAt: null,
    settledAt: null,
    helperId: helperId ?? null,
    customerId: customerId ?? null,
  };

  paymentStore.set(requestId, record);
  return record;
}

export function applyCustomerPayment(
  requestId: string,
  serviceSlug: string,
  method: PaymentMethod,
  referralCode?: string,
  helperId?: string | null,
  customerId?: string | null,
  invitedCount: number = 0
): ServicePaymentRecord {
  const record = getOrCreatePaymentRecord(requestId, serviceSlug, helperId, customerId, invitedCount);

  let discount = 0;
  if (referralCode && referralCode.trim()) {
    // 10% referral discount for referred customer
    discount = Math.round(record.baseAmountKrw * 0.10);
    record.referralCodeApplied = referralCode.trim().toUpperCase();
  }

  const totalAmount = Math.max(0, record.baseAmountKrw - discount);
  const feeRate = calculatePlatformFeeRate(invitedCount);
  const platformFee = Math.max(1, Math.round(totalAmount * feeRate));
  const helperPayout = totalAmount - platformFee;

  record.discountKrw = discount;
  record.totalAmountKrw = totalAmount;
  record.platformFeeKrw = platformFee;
  record.helperPayoutKrw = helperPayout;
  record.feePercent = calculatePlatformFeePercent(invitedCount);
  record.paymentMethod = method;
  record.paymentStatus = "PAID";
  record.paidAt = new Date().toISOString();

  paymentStore.set(requestId, record);
  return record;
}

export function confirmCustomerCompletion(requestId: string): ServicePaymentRecord | null {
  const record = paymentStore.get(requestId);
  if (!record) return null;

  record.paymentStatus = "SETTLED";
  record.settledAt = new Date().toISOString();
  paymentStore.set(requestId, record);
  return record;
}

export function getPaymentSummaryForHelper(helperId?: string | null): HelperEarningsSummary {
  const allRecords = Array.from(paymentStore.values());
  const helperRecords = helperId ? allRecords.filter((r) => r.helperId === helperId) : allRecords;

  const completed = helperRecords.filter((r) => r.paymentStatus === "PAID" || r.paymentStatus === "SETTLED");
  const totalGross = completed.reduce((sum, r) => sum + r.totalAmountKrw, 0);
  const totalFees = completed.reduce((sum, r) => sum + r.platformFeeKrw, 0);
  const totalNet = completed.reduce((sum, r) => sum + r.helperPayoutKrw, 0);

  const settledPayout = helperRecords
    .filter((r) => r.paymentStatus === "SETTLED")
    .reduce((sum, r) => sum + r.helperPayoutKrw, 0);

  const pendingPayout = helperRecords
    .filter((r) => r.paymentStatus === "PAID")
    .reduce((sum, r) => sum + r.helperPayoutKrw, 0);

  return {
    totalCompletedJobs: completed.length,
    totalGrossVolumeKrw: totalGross,
    totalPlatformFeesKrw: totalFees,
    totalNetEarningsKrw: totalNet,
    pendingPayoutKrw: pendingPayout,
    settledPayoutKrw: settledPayout,
    records: helperRecords.sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || "")),
  };
}

export function getAdminRevenueSummary(): AdminRevenueSummary {
  const allRecords = Array.from(paymentStore.values());
  const activeRecords = allRecords.filter((r) => r.paymentStatus === "PAID" || r.paymentStatus === "SETTLED");

  const totalGross = activeRecords.reduce((sum, r) => sum + r.totalAmountKrw, 0);
  const totalFees = activeRecords.reduce((sum, r) => sum + r.platformFeeKrw, 0);
  const totalHelper = activeRecords.reduce((sum, r) => sum + r.helperPayoutKrw, 0);

  const pending = allRecords
    .filter((r) => r.paymentStatus === "PAYMENT_PENDING")
    .reduce((sum, r) => sum + r.totalAmountKrw, 0);

  return {
    totalTransactions: activeRecords.length,
    totalGrossVolumeKrw: totalGross,
    totalPlatformRevenueKrw: totalFees, // 10% platform commission fee
    totalHelperDisbursementsKrw: totalHelper,
    pendingSettlementsKrw: pending,
    records: allRecords.sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || "")),
  };
}
