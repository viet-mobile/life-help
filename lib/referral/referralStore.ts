import {
  calculatePlatformFeePercent,
  calculatePlatformFeeRate,
  BASE_FEE_PERCENT,
  MIN_FEE_PERCENT,
  MAX_INVITE_GOAL,
  tierForSettledServices,
  type ReferralTier,
} from "./policy";

export interface ReferralUser {
  referralId: string;
  deviceHash: string;
  invitedCount: number;
  settledServicesCount: number;
  totalEarnedKrw: number;
  referredBy?: string;
  createdAt: string;
}

export interface ReferralRewardItem {
  id: string;
  referralId: string;
  referredId: string;
  tier: ReferralTier;
  amountKrw: number;
  status: "QUALIFIED" | "APPROVED" | "PAID";
  createdAt: string;
}

// In-memory persistent map attached to globalThis to persist across Next.js dev server module reloads
interface GlobalReferralStore {
  usersByReferralId: Map<string, ReferralUser>;
  usersByDeviceHash: Map<string, ReferralUser>;
  rewardsList: ReferralRewardItem[];
}

const g = globalThis as unknown as { __referralStore?: GlobalReferralStore };
if (!g.__referralStore) {
  g.__referralStore = {
    usersByReferralId: new Map(),
    usersByDeviceHash: new Map(),
    rewardsList: [],
  };
}

const { usersByReferralId, usersByDeviceHash, rewardsList } = g.__referralStore;

// Deterministic short referral ID generation (e.g. LIFE7788 or LIFE + 4 uppercase chars)
function generateReferralCode(deviceHash: string): string {
  let hash = 0;
  for (let i = 0; i < deviceHash.length; i++) {
    hash = (hash << 5) - hash + deviceHash.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = (Math.abs(hash) % 9000) + 1000;
  return `LIFE-${codeNum}`;
}

export function getOrCreateReferralUser(
  deviceHash: string,
  optionalReferredBy?: string | null
): { user: ReferralUser; attributionOutcome?: string } {
  let user = usersByDeviceHash.get(deviceHash);
  let outcome: string | undefined = undefined;

  if (!user) {
    const referralId = generateReferralCode(deviceHash);
    user = {
      referralId,
      deviceHash,
      invitedCount: 0,
      settledServicesCount: 0,
      totalEarnedKrw: 0,
      createdAt: new Date().toISOString(),
    };
    if (usersByDeviceHash.size >= 5000) {
      const firstKey = usersByDeviceHash.keys().next().value;
      if (firstKey) {
        const oldUser = usersByDeviceHash.get(firstKey);
        usersByDeviceHash.delete(firstKey);
        if (oldUser) usersByReferralId.delete(oldUser.referralId);
      }
    }
    usersByDeviceHash.set(deviceHash, user);
    usersByReferralId.set(referralId, user);
  }

  // Handle attribution if referred by someone else
  if (optionalReferredBy) {
    const cleanRef = optionalReferredBy.trim().toUpperCase();
    if (cleanRef === user.referralId) {
      outcome = "SELF_REFERRAL";
    } else if (user.referredBy) {
      outcome = "EXISTING_REFERRER_KEPT";
    } else {
      const referrer = usersByReferralId.get(cleanRef);
      if (referrer) {
        user.referredBy = cleanRef;
        referrer.invitedCount += 1;
        outcome = "ATTRIBUTED";
      } else {
        // Register soft attribution even if referrer registered in another session
        user.referredBy = cleanRef;
        outcome = "ATTRIBUTED";
      }
    }
  }

  return { user, attributionOutcome: outcome };
}

export function recordReferralServiceSettlement(
  referredReferralCode: string,
  serviceAmountKrw: number
): ReferralRewardItem | null {
  const user = usersByReferralId.get(referredReferralCode);
  if (!user || !user.referredBy) return null;

  const referrer = usersByReferralId.get(user.referredBy);
  if (!referrer) return null;

  referrer.settledServicesCount += 1;
  const tierInfo = tierForSettledServices(referrer.settledServicesCount);
  const rewardAmount = tierInfo.rewardAmountKrw;
  referrer.totalEarnedKrw += rewardAmount;

  const reward: ReferralRewardItem = {
    id: `rew-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    referralId: referrer.referralId,
    referredId: user.referralId,
    tier: tierInfo.tier,
    amountKrw: rewardAmount,
    status: "PAID",
    createdAt: new Date().toISOString(),
  };

  rewardsList.push(reward);
  if (rewardsList.length > 5000) rewardsList.splice(0, rewardsList.length - 5000);
  return reward;
}

export function getReferralStats(referralId: string) {
  const user = usersByReferralId.get(referralId);
  const invitedCount = user ? user.invitedCount : 0;
  const settledCount = user ? user.settledServicesCount : 0;
  const totalEarned = user ? user.totalEarnedKrw : 0;
  const tierInfo = tierForSettledServices(settledCount);

  const currentFeePercent = calculatePlatformFeePercent(invitedCount);
  const currentFeeRate = calculatePlatformFeeRate(invitedCount);
  const discountPercent = Math.round((BASE_FEE_PERCENT - currentFeePercent) * 100) / 100;
  const isMinFeeReached = currentFeePercent <= MIN_FEE_PERCENT;

  const myRewards = rewardsList.filter((r) => r.referralId === referralId);

  return {
    referralId,
    invitedCount,
    inviteGoal: MAX_INVITE_GOAL,
    baseFeePercent: BASE_FEE_PERCENT,
    currentFeePercent,
    currentFeeRate,
    minFeePercent: MIN_FEE_PERCENT,
    discountPercent,
    isMinFeeReached,
    settledServicesCount: settledCount,
    tier: tierInfo.tier,
    tierTitle: tierInfo.titleKo,
    tierBadge: tierInfo.badgeKo,
    nextRewardKrw: tierInfo.rewardAmountKrw,
    totalEarnedKrw: totalEarned,
    rewards: myRewards,
  };
}
