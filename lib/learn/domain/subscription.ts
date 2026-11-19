/**
 * LIFE.HELP Curriculum Subscription & Referral Monetization Specification
 *
 * 1. Free Tier:
 *    - Math: 24 semesters (Grades 1-12 x 2)
 *    - English: 24 semesters (Grades 1-12 x 2)
 *    - Korean: 12 semesters (Levels 1-6 x 2)
 *    - Free quota: 90 general problems + 10 thinking problems per semester (100 problems/semester).
 *
 * 2. Basic Plan:
 *    - ₩2,000 / month (~$1.49 - $1.99)
 *    - Daily quota: 9 general problems + 1 thinking problem (10 problems/day).
 *    - Grade/semester switch: 1 switch per day.
 *
 * 3. Pro Unlimited Plan:
 *    - ₩20,000 / month (~$14.99)
 *    - Unlimited access: No daily problem limit, unlimited grade/semester switches.
 *
 * 4. Referral Program:
 *    - Subscribed students receive a unique referral code.
 *    - New student using the code gets 10% discount on both plans for 6 months.
 *    - Referring student gets 10% discount on their own plan for 6 months per referee.
 *    - Stackable: 1 referral = 10%, up to 10 referrals = 100% discount (100% free subscription).
 *    - Maximum cap: 10 referrals (prevents app store MLM/cash-reward regulatory issues).
 */

export type SubscriptionPlanId = "free" | "basic" | "pro";

export interface PlanConfig {
  id: SubscriptionPlanId;
  name: string;
  nameKo: string;
  priceKrw: number;
  appleProductId: string;
  googleProductId: string;
  dailyGeneralLimit: number;
  dailyThinkingLimit: number;
  dailyTotalLimit: number;
  gradeSwitchLimitPerDay: number;
  freeGeneralPerSemester: number;
  freeThinkingPerSemester: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free Trial",
    nameKo: "무료 개방",
    priceKrw: 0,
    appleProductId: "",
    googleProductId: "",
    dailyGeneralLimit: 0,
    dailyThinkingLimit: 0,
    dailyTotalLimit: 0,
    gradeSwitchLimitPerDay: 0,
    freeGeneralPerSemester: 90,
    freeThinkingPerSemester: 10,
  },
  basic: {
    id: "basic",
    name: "Basic Daily Study",
    nameKo: "베이직 플랜 (매일 10제)",
    priceKrw: 2000,
    appleProductId: "help.life.study.basic.monthly",
    googleProductId: "help.life.study.basic.monthly",
    dailyGeneralLimit: 9,
    dailyThinkingLimit: 1,
    dailyTotalLimit: 10,
    gradeSwitchLimitPerDay: 1,
    freeGeneralPerSemester: 90,
    freeThinkingPerSemester: 10,
  },
  pro: {
    id: "pro",
    name: "Pro Unlimited Study",
    nameKo: "프로 무제한 플랜",
    priceKrw: 20000,
    appleProductId: "help.life.study.pro.monthly",
    googleProductId: "help.life.study.pro.monthly",
    dailyGeneralLimit: Infinity,
    dailyThinkingLimit: Infinity,
    dailyTotalLimit: Infinity,
    gradeSwitchLimitPerDay: Infinity,
    freeGeneralPerSemester: 90,
    freeThinkingPerSemester: 10,
  },
};

export const REFERRAL_SETTINGS = {
  discountRatePerReferral: 0.1, // 10%
  discountDurationMonths: 6,
  maxDiscountCap: 1.0, // 10 referrals = 100% free
  maxReferralsAllowed: 10, // Capped at 10 to ensure 100% app store compliance (no cash reward in-app)
};

export interface ReferralSummary {
  referralCode: string;
  activeReferralCount: number;
  discountPercent: number; // e.g. 30 -> 30%
  isFreeSubscription: boolean;
  maxCapReached: boolean;
}

/** Compute subscription price and referral benefits */
export function calculateEffectiveSubscription(
  planId: SubscriptionPlanId,
  activeReferrals: number,
  referredByCode?: string
): {
  basePriceKrw: number;
  discountRate: number;
  finalPriceKrw: number;
  referralSummary: ReferralSummary;
} {
  const cappedReferrals = Math.min(REFERRAL_SETTINGS.maxReferralsAllowed, Math.max(0, activeReferrals));
  const plan = SUBSCRIPTION_PLANS[planId];
  if (planId === "free") {
    return {
      basePriceKrw: 0,
      discountRate: 0,
      finalPriceKrw: 0,
      referralSummary: {
        referralCode: "GUEST",
        activeReferralCount: 0,
        discountPercent: 0,
        isFreeSubscription: true,
        maxCapReached: false,
      },
    };
  }

  // Base referee discount (if user signed up with someone's referral code: 10% off for 6 months)
  let refereeDiscount = referredByCode ? REFERRAL_SETTINGS.discountRatePerReferral : 0;

  // Stacking referral discount (10% per referee up to 10 friends = 100%)
  const stackedDiscount = cappedReferrals * REFERRAL_SETTINGS.discountRatePerReferral;
  const totalDiscountRate = Math.min(1.0, refereeDiscount + stackedDiscount);
  const finalPriceKrw = Math.max(0, Math.round(plan.priceKrw * (1 - totalDiscountRate)));

  return {
    basePriceKrw: plan.priceKrw,
    discountRate: totalDiscountRate,
    finalPriceKrw,
    referralSummary: {
      referralCode: "REF-PENDING",
      activeReferralCount: cappedReferrals,
      discountPercent: Math.round(totalDiscountRate * 100),
      isFreeSubscription: totalDiscountRate >= 1.0,
      maxCapReached: cappedReferrals >= REFERRAL_SETTINGS.maxReferralsAllowed,
    },
  };
}

/** Check whether user can access a specific problem within their semester/daily quota */
export function checkProblemAccess(
  planId: SubscriptionPlanId,
  isThinking: boolean,
  currentSemesterSolvedGeneral: number,
  currentSemesterSolvedThinking: number,
  todaySolvedGeneral: number,
  todaySolvedThinking: number
): { allowed: boolean; reason?: "free_semester_limit_reached" | "daily_limit_reached" | "upgrade_required" } {
  const plan = SUBSCRIPTION_PLANS[planId];

  // 1. Check free semester quota (90 general, 10 thinking per semester)
  if (isThinking) {
    if (currentSemesterSolvedThinking < plan.freeThinkingPerSemester) {
      return { allowed: true };
    }
  } else {
    if (currentSemesterSolvedGeneral < plan.freeGeneralPerSemester) {
      return { allowed: true };
    }
  }

  // 2. Beyond free quota: Free tier users are blocked
  if (planId === "free") {
    return { allowed: false, reason: "free_semester_limit_reached" };
  }

  // 3. Pro tier has unlimited access
  if (planId === "pro") {
    return { allowed: true };
  }

  // 4. Basic tier (9 general + 1 thinking per day)
  if (isThinking) {
    if (todaySolvedThinking >= plan.dailyThinkingLimit) {
      return { allowed: false, reason: "daily_limit_reached" };
    }
  } else {
    if (todaySolvedGeneral >= plan.dailyGeneralLimit) {
      return { allowed: false, reason: "daily_limit_reached" };
    }
  }

  return { allowed: true };
}

