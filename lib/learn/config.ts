/**
 * Tunable numbers for the learning engine. Nothing in domain code hard-codes
 * these, so balancing (XP, levels, mastery, SRS) is a config change only.
 */
export const learnConfig = {
  /** Calendar days (streak, daily quest, daily XP caps) are computed in this zone. */
  timezone: "Asia/Seoul",

  xp: {
    correctBase: 10,
    correctHard: 15, // difficulty >= hardThreshold
    hardThreshold: 4,
    /** Correct only after a wrong first try: rewards persistence/understanding. */
    understoodAfterMistake: 8,
    /** Each hint reduces the reward by this fraction, down to minHintFactor. */
    hintPenalty: 0.25,
    minHintFactor: 0.4,
    lessonFirstCompletion: 50,
    lessonRepeat: 15,
    starBonus: 5, // per star on first completion
    dailyQuest: 100,
    diagnosticComplete: 30,
    reviewCorrect: 12,
    /** Anti-farming. */
    repeatQuestionSameDayFactors: [1, 0.25, 0], // 1st, 2nd, 3rd+ reward of the same question in a day
    tooEasyMasteryThreshold: 90,
    tooEasyMaxDifficulty: 2,
    tooEasyFactor: 0.3,
    dailySoftCap: 600,
    afterSoftCapFactor: 0.25,
    /** Coins granted per XP awarded (floor). */
    coinsPerXp: 0.2,
  },

  /** Level n needs levelXp(n) total XP: base * (growth^(n-1) - 1) / (growth - 1). */
  level: {
    base: 100,
    growth: 1.35,
    max: 50,
    titles: [
      "beginner",
      "explorer",
      "solver",
      "challenger",
      "adventurer",
      "strategist",
      "expert",
      "master",
      "legend",
    ] as const,
  },

  mastery: {
    initial: 0,
    /** Fraction of the remaining gap to 100 gained on a correct answer (before modifiers). */
    learningRate: 0.16,
    maxGainPerAttempt: 22,
    /** Fraction of the current score lost on a wrong answer. */
    wrongPenalty: 0.1,
    /** Multipliers by difficulty 1..5 on gain. */
    difficultyGain: [0.7, 0.85, 1, 1.2, 1.4],
    /** Wrong on an easy question hurts more than on a hard one. */
    difficultyPenalty: [1.4, 1.2, 1, 0.8, 0.6],
    hintFactor: 0.6, // per hint used
    /** Answer took longer than this multiple of expected time => reduced gain. */
    slowFactor: 3,
    slowGainMultiplier: 0.8,
    /** Same question answered again within this many ms counts less (memorising answer). */
    repeatWindowMs: 24 * 3600 * 1000,
    repeatGainMultiplier: 0.3,
    /** A single correct answer can never exceed this until repeated success. */
    softCapFirstEvidence: 60,
    /** Decay of displayed mastery for skills not practiced recently. */
    decayGraceDays: 7,
    decayPerDay: 0.015,
    decayFloor: 0.6,
    labels: { mastered: 90, strong: 75, learning: 50 },
  },

  srs: {
    intervalsDays: [1, 3, 7, 14, 30],
    highMasteryStretch: 1.25,
    lowMasteryShrink: 0.75,
    lowMasteryBelow: 50,
    highMasteryAbove: 85,
  },

  streak: {
    freezeEveryDays: 7,
    maxFreezes: 2,
  },

  session: {
    minQuestions: 3,
    maxQuestions: 6,
    /** Fraction of correct-first-try to earn 3 stars / 2 stars / 1 star. */
    starThresholds: [0.85, 0.6, 0],
    /** Session accuracy needed to count the lesson as complete (else "try again"). */
    minCompletionAccuracy: 0.0,
  },

  quest: {
    solveTarget: 5,
    reviewTarget: 3,
    lessonTarget: 1,
  },

  diagnostic: {
    maxQuestions: 6,
    initialAbilityByGrade: { E1: 1, E2: 1.2, E3: 1.4, E4: 1.6, E5: 1.75, E6: 1.9, M1: 2, M2: 2.5, M3: 3, H1: 3, H2: 3.5, H3: 4 } as const,
    step: 0.7,
    /** Placement: a lesson is "placed out" when all its skills seed at or above this. */
    placeOutSeed: 65,
    seedBase: 32,
    seedPerDifficulty: 12,
    seedMax: 80,
    seedWrong: 12,
  },

  /** Progress from demo/guest mode is stored locally under this key prefix. */
  guestStorageKey: "life_help_learn_v1",
} as const;

export type LearnConfig = typeof learnConfig;
