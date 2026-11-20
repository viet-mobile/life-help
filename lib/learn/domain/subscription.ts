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

/**
 * LIFE.HELP Curriculum Subscription & Referral Monetization Specification (Updated 2026-11-20)
 *
 * 1. Subscription Pricing:
 *    - Free Tier: 90 general + 10 thinking problems per semester free trial.
 *    - Basic Plan:
 *        - Monthly: ₩1,000 / month (~$0.75)
 *        - Annual:  ₩10,000 / year (approx 17% savings)
 *        - Daily quota: 9 general + 1 thinking problem (10 problems/day).
 *    - Pro Unlimited Plan:
 *        - Monthly: ₩10,000 / month (~$7.50)
 *        - Annual:  ₩100,000 / year (approx 17% savings)
 *        - Unlimited access to all grades/semesters.
 *
 * 2. Referral Discount Architecture (100% Free Policy permanently abolished):
 *    - Subscription fee is treated as platform commission fee.
 *    - 0 referrals: 0% discount (full price).
 *    - Each valid referral: 0.1%p discount.
 *    - At 999 referrals: Reaches maximum 99.9% discount (floor price: 0.1%).
 *        - Basic Monthly: ₩1,000 -> ₩1
 *        - Basic Annual:  ₩10,000 -> ₩10
 *        - Pro Monthly:   ₩10,000 -> ₩10
 *        - Pro Annual:    ₩100,000 -> ₩100
 *
 * 3. Qualified Referral Criteria:
 *    - Web marketplace: Referee completes paid service >= ₩100,000.
 *    - Learn App: Referee completes paid subscription >= ₩10,000.
 *    - Integrated unified referral count across web & app.
 */

export type SubscriptionPlanId = "free" | "basic" | "pro";
export type BillingCycle = "monthly" | "annual";

export interface PlanPricing {
  monthlyPriceKrw: number;
  annualPriceKrw: number;
}

export interface PlanConfig {
  id: SubscriptionPlanId;
  name: string;
  nameKo: string;
  monthlyPriceKrw: number;
  annualPriceKrw: number;
  appleMonthlyProductId: string;
  appleAnnualProductId: string;
  googleMonthlyProductId: string;
  googleAnnualProductId: string;
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
    monthlyPriceKrw: 0,
    annualPriceKrw: 0,
    appleMonthlyProductId: "",
    appleAnnualProductId: "",
    googleMonthlyProductId: "",
    googleAnnualProductId: "",
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
    monthlyPriceKrw: 1000,
    annualPriceKrw: 10000,
    appleMonthlyProductId: "help.life.study.basic.monthly",
    appleAnnualProductId: "help.life.study.basic.annual",
    googleMonthlyProductId: "help.life.study.basic.monthly",
    googleAnnualProductId: "help.life.study.basic.annual",
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
    monthlyPriceKrw: 10000,
    annualPriceKrw: 100000,
    appleMonthlyProductId: "help.life.study.pro.monthly",
    appleAnnualProductId: "help.life.study.pro.annual",
    googleMonthlyProductId: "help.life.study.pro.monthly",
    googleAnnualProductId: "help.life.study.pro.annual",
    dailyGeneralLimit: Infinity,
    dailyThinkingLimit: Infinity,
    dailyTotalLimit: Infinity,
    gradeSwitchLimitPerDay: Infinity,
    freeGeneralPerSemester: 90,
    freeThinkingPerSemester: 10,
  },
};

export const LEARN_REFERRAL_POLICY = {
  discountPercentPerReferral: 0.1, // 0.1%p discount per referral
  maxReferralGoal: 999,            // 999 referrals reaches max discount
  maxDiscountPercent: 99.9,        // 99.9% max discount (0.1% floor payment)
  qualifiedLearnMinPaymentKrw: 10000, // Referee must pay >= ₩10,000 in learn app
  qualifiedWebMinPaymentKrw: 100000,  // Referee must pay >= ₩100,000 on main web
};

export interface LearnReferralSummary {
  referralCode: string;
  totalQualifiedReferrals: number;
  discountPercent: number; // 0.0% ~ 99.9%
  isMaxDiscountReached: boolean; // 999 referrals reached
  overGoalReferralCount: number; // count beyond 999 for ambassador rewards
}

/** Compute learning subscription price with 0.1%p discount per referral up to 99.9% */
export function calculateEffectiveSubscription(
  planId: SubscriptionPlanId,
  cycle: BillingCycle = "monthly",
  totalUnifiedReferrals: number = 0
): {
  basePriceKrw: number;
  discountPercent: number;
  finalPriceKrw: number;
  referralSummary: LearnReferralSummary;
} {
  const plan = SUBSCRIPTION_PLANS[planId];
  const basePrice = cycle === "annual" ? plan.annualPriceKrw : plan.monthlyPriceKrw;

  if (planId === "free" || basePrice <= 0) {
    return {
      basePriceKrw: 0,
      discountPercent: 0,
      finalPriceKrw: 0,
      referralSummary: {
        referralCode: "GUEST",
        totalQualifiedReferrals: 0,
        discountPercent: 0,
        isMaxDiscountReached: false,
        overGoalReferralCount: 0,
      },
    };
  }

  const validReferrals = Math.max(0, Math.floor(totalUnifiedReferrals));
  const cappedReferrals = Math.min(LEARN_REFERRAL_POLICY.maxReferralGoal, validReferrals);
  const discountPercent = Math.min(
    LEARN_REFERRAL_POLICY.maxDiscountPercent,
    Math.round(cappedReferrals * LEARN_REFERRAL_POLICY.discountPercentPerReferral * 10) / 10
  );

  const discountAmount = Math.floor(basePrice * (discountPercent / 100));
  // Ensure minimum floor of 0.1% of base price (or at least 1 KRW)
  const finalPriceKrw = Math.max(1, basePrice - discountAmount);
  const overGoalReferralCount = Math.max(0, validReferrals - LEARN_REFERRAL_POLICY.maxReferralGoal);

  return {
    basePriceKrw: basePrice,
    discountPercent,
    finalPriceKrw,
    referralSummary: {
      referralCode: "REF-INTEGRATED",
      totalQualifiedReferrals: validReferrals,
      discountPercent,
      isMaxDiscountReached: cappedReferrals >= LEARN_REFERRAL_POLICY.maxReferralGoal,
      overGoalReferralCount,
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

