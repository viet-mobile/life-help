/**
 * Referral Policy & Fee Scale
 *
 * Rule (2026-11-17):
 * - Base platform fee: 10.00%
 * - When 1 friend is invited: Fee drops to 9.99%
 * - Each additional invite reduces fee by 0.01%p
 * - At 999 invites: Reaches the minimum floor of 0.01%
 */

export const BASE_FEE_PERCENT = 10.0;
export const MIN_FEE_PERCENT = 0.01;
export const FEE_DISCOUNT_PER_INVITE = 0.01;
export const MAX_INVITE_GOAL = 999;

export function calculatePlatformFeePercent(invitedCount: number): number {
  if (!Number.isFinite(invitedCount) || invitedCount <= 0) return BASE_FEE_PERCENT;
  const discount = invitedCount * FEE_DISCOUNT_PER_INVITE;
  const current = BASE_FEE_PERCENT - discount;
  return Math.max(MIN_FEE_PERCENT, Math.round(current * 100) / 100);
}

export function calculatePlatformFeeRate(invitedCount: number): number {
  return calculatePlatformFeePercent(invitedCount) / 100;
}

export type ReferralTier = "WLH" | "CLH" | "GLH";

export interface ReferralTierInfo {
  tier: ReferralTier;
  minSettledServices: number;
  rewardAmountKrw: number;
  titleKo: string;
  badgeKo: string;
}

export const REFERRAL_TIERS: ReadonlyArray<ReferralTierInfo> = [
  {
    tier: "GLH",
    minSettledServices: 5,
    rewardAmountKrw: 10000,
    titleKo: "골드 리퍼럴 (GLH)",
    badgeKo: "🥇 골드 파트너",
  },
  {
    tier: "CLH",
    minSettledServices: 1,
    rewardAmountKrw: 5000,
    titleKo: "클래식 리퍼럴 (CLH)",
    badgeKo: "🥈 실버 파트너",
  },
  {
    tier: "WLH",
    minSettledServices: 0,
    rewardAmountKrw: 1000,
    titleKo: "웰컴 리퍼럴 (WLH)",
    badgeKo: "🥉 스타터 파트너",
  },
];

export function tierForSettledServices(settledCount: number): ReferralTierInfo {
  const count = Number.isFinite(settledCount) && settledCount > 0 ? Math.floor(settledCount) : 0;
  return REFERRAL_TIERS.find((t) => count >= t.minSettledServices) ?? REFERRAL_TIERS[REFERRAL_TIERS.length - 1];
}

export const REFERRAL_ID_PATTERN = /^[A-Z0-9-]{4,20}$/;
