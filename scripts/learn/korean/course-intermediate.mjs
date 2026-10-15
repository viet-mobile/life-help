// Korean intermediate courses K7..K10
export const INTERMEDIATE_LEVELS = [
  {
    "level": "K7",
    "emoji": "💬",
    "lessons": [
      {
        "skill": "indirect_state",
        "title": "Indirect statements (-다고 하다)",
        "concept": "Report what someone says or said: verb/adj + -다고 하다.",
        "example": [
          [
            "친구가 온다고 해요.",
            "chinguga ondago haeyo.",
            "friendSaidComing"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "친구가 온다고 해요.",
            "rr": "chinguga ondago haeyo.",
            "g": "friendSaidComing",
            "wrong": [
              "friendSaidGoing",
              "friendAskedCome",
              "friendSaidGood"
            ]
          },
          {
            "k": "meaning",
            "ko": "날씨가 좋다고 해요.",
            "rr": "nalssiga jotdago haeyo.",
            "g": "weatherSaidGood",
            "wrong": [
              "weatherSaidCold",
              "friendSaidComing",
              "rainSaidComing"
            ]
          },
          {
            "k": "toko",
            "ko": "비가 온다고 해요.",
            "rr": "biga ondago haeyo.",
            "g": "rainSaidComing",
            "wrong": [
              "친구가 온다고 해요.",
              "날씨가 좋다고 해요.",
              "밥을 먹는다고 해요."
            ]
          },
          {
            "k": "tf",
            "ko": "친구가 온다고 해요.",
            "rr": "chinguga ondago haeyo.",
            "claim": "friendSaidComing",
            "g": "friendSaidComing"
          },
          {
            "k": "listen",
            "ko": "날씨가 좋다고 해요.",
            "rr": "nalssiga jotdago haeyo.",
            "wrong": [
              "친구가 온다고 해요.",
              "비가 온다고 해요.",
              "맛있다고 해요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "맛있다고 해요.",
            "rr": "masitdago haeyo.",
            "g": "saidDelicious",
            "wrong": [
              "friendSaidComing",
              "weatherSaidGood",
              "rainSaidComing"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "친구가 온다고 해요.",
            "rr": "chinguga ondago haeyo.",
            "g": "friendSaidComing",
            "wrong": [
              "비가 온다고 해요.",
              "맛있다고 해요.",
              "날씨가 좋다고 해요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "indirect_ask",
        "title": "Indirect questions (-냐고 하다)",
        "concept": "Report a question: verb/adj + -냐고 묻다/하다.",
        "example": [
          [
            "어디 가냐고 물었어요.",
            "eodi ganyago mureosseoyo.",
            "askedWhereGoing"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "어디 가냐고 물었어요.",
            "rr": "eodi ganyago mureosseoyo.",
            "g": "askedWhereGoing",
            "wrong": [
              "askedWhatTime",
              "askedWhatEat",
              "askedWhyCome"
            ]
          },
          {
            "k": "meaning",
            "ko": "몇 시냐고 물었어요.",
            "rr": "myeot sinyago mureosseoyo.",
            "g": "askedWhatTime",
            "wrong": [
              "askedWhereGoing",
              "askedWhoIs",
              "askedHowMuch"
            ]
          },
          {
            "k": "toko",
            "ko": "밥 먹었냐고 물었어요.",
            "rr": "bap meogeonnyago mureosseoyo.",
            "g": "askedIfAte",
            "wrong": [
              "어디 가냐고 물었어요.",
              "몇 시냐고 물었어요.",
              "누구냐고 물었어요."
            ]
          },
          {
            "k": "tf",
            "ko": "어디 가냐고 물었어요.",
            "rr": "eodi ganyago mureosseoyo.",
            "claim": "askedWhatTime",
            "g": "askedWhereGoing"
          },
          {
            "k": "listen",
            "ko": "몇 시냐고 물었어요.",
            "rr": "myeot sinyago mureosseoyo.",
            "wrong": [
              "어디 가냐고 물었어요.",
              "밥 먹었냐고 물었어요.",
              "언제 오냐고 물었어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "언제 오냐고 물었어요.",
            "rr": "eonje onyago mureosseoyo.",
            "g": "askedWhenComing",
            "wrong": [
              "askedWhereGoing",
              "askedWhatTime",
              "askedIfAte"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "어디 가냐고 물었어요.",
            "rr": "eodi ganyago mureosseoyo.",
            "g": "askedWhereGoing",
            "wrong": [
              "몇 시냐고 물었어요.",
              "언제 오냐고 물었어요.",
              "밥 먹었냐고 물었어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "indirect_cmd",
        "title": "Indirect commands and suggestions (-라고 / -자고 하다)",
        "concept": "Report an imperative (-라고 하다) or propositive (-자고 하다).",
        "example": [
          [
            "빨리 오라고 했어요.",
            "ppalli orago haesseoyo.",
            "toldToComeFast"
          ],
          [
            "같이 가자고 했어요.",
            "gachi gajago haesseoyo.",
            "suggestedGoTogether"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "빨리 오라고 했어요.",
            "rr": "ppalli orago haesseoyo.",
            "g": "toldToComeFast",
            "wrong": [
              "suggestedGoTogether",
              "toldToBeQuiet",
              "toldToWait"
            ]
          },
          {
            "k": "meaning",
            "ko": "같이 가자고 했어요.",
            "rr": "gachi gajago haesseoyo.",
            "g": "suggestedGoTogether",
            "wrong": [
              "toldToComeFast",
              "toldToBeQuiet",
              "suggestedEatTogether"
            ]
          },
          {
            "k": "toko",
            "ko": "조용히 하라고 했어요.",
            "rr": "joyonghi harago haesseoyo.",
            "g": "toldToBeQuiet",
            "wrong": [
              "빨리 오라고 했어요.",
              "같이 가자고 했어요.",
              "기다리라고 했어요."
            ]
          },
          {
            "k": "tf",
            "ko": "빨리 오라고 했어요.",
            "rr": "ppalli orago haesseoyo.",
            "claim": "toldToComeFast",
            "g": "toldToComeFast"
          },
          {
            "k": "listen",
            "ko": "같이 가자고 했어요.",
            "rr": "gachi gajago haesseoyo.",
            "wrong": [
              "빨리 오라고 했어요.",
              "조용히 하라고 했어요.",
              "밥 먹자고 했어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "밥 먹자고 했어요.",
            "rr": "bap meokjago haesseoyo.",
            "g": "suggestedEatTogether",
            "wrong": [
              "toldToComeFast",
              "suggestedGoTogether",
              "toldToBeQuiet"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "빨리 오라고 했어요.",
            "rr": "ppalli orago haesseoyo.",
            "g": "toldToComeFast",
            "wrong": [
              "같이 가자고 했어요.",
              "조용히 하라고 했어요.",
              "밥 먹자고 했어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "cause_contrast",
        "title": "Complex causes and contrasts (-느라고, -는데도)",
        "concept": "Negative cause or delay (-느라고) and contrast despite circumstances (-는데도).",
        "example": [
          [
            "공부하느라고 바빴어요.",
            "gongbuhaneurago bapasseoyo.",
            "busyStudying"
          ],
          [
            "비가 오는데도 갔어요.",
            "biga oneundedo gasseoyo.",
            "wentDespiteRain"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "공부하느라고 바빴어요.",
            "rr": "gongbuhaneurago bapasseoyo.",
            "g": "busyStudying",
            "wrong": [
              "wentDespiteRain",
              "lateDueToWork",
              "tiredWorking"
            ]
          },
          {
            "k": "meaning",
            "ko": "비가 오는데도 갔어요.",
            "rr": "biga oneundedo gasseoyo.",
            "g": "wentDespiteRain",
            "wrong": [
              "busyStudying",
              "lateDueToWork",
              "ateDespiteFull"
            ]
          },
          {
            "k": "toko",
            "ko": "일하느라고 늦었어요.",
            "rr": "ilhaneurago neujeosseoyo.",
            "g": "lateDueToWork",
            "wrong": [
              "공부하느라고 바빴어요.",
              "비가 오는데도 갔어요.",
              "준비하느라고 바빴어요."
            ]
          },
          {
            "k": "tf",
            "ko": "공부하느라고 바빴어요.",
            "rr": "gongbuhaneurago bapasseoyo.",
            "claim": "wentDespiteRain",
            "g": "busyStudying"
          },
          {
            "k": "listen",
            "ko": "비가 오는데도 갔어요.",
            "rr": "biga oneundedo gasseoyo.",
            "wrong": [
              "공부하느라고 바빴어요.",
              "일하느라고 늦었어요.",
              "피곤한데도 공부했어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "피곤한데도 공부했어요.",
            "rr": "pigonhandedo gongbuhaesseoyo.",
            "g": "studiedDespiteTired",
            "wrong": [
              "busyStudying",
              "wentDespiteRain",
              "lateDueToWork"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "비가 오는데도 갔어요.",
            "rr": "biga oneundedo gasseoyo.",
            "g": "wentDespiteRain",
            "wrong": [
              "공부하느라고 바빴어요.",
              "일하느라고 늦었어요.",
              "피곤한데도 공부했어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "proportion",
        "title": "Proportion and inevitability (-을수록, -기 마련이다)",
        "concept": "The more... the more (-을수록) and natural inevitability (-기 마련이다).",
        "example": [
          [
            "만날수록 좋아요.",
            "mannalsurok joayo.",
            "betterAsWeMeet"
          ],
          [
            "사람은 실수하기 마련이에요.",
            "sarameun silsuhagi maryeonieyo.",
            "boundToMakeMistakes"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "만날수록 좋아요.",
            "rr": "mannalsurok joayo.",
            "g": "betterAsWeMeet",
            "wrong": [
              "boundToMakeMistakes",
              "harderAsItGoes",
              "happierStudying"
            ]
          },
          {
            "k": "meaning",
            "ko": "사람은 실수하기 마련이에요.",
            "rr": "sarameun silsuhagi maryeonieyo.",
            "g": "boundToMakeMistakes",
            "wrong": [
              "betterAsWeMeet",
              "harderAsItGoes",
              "boundToGetTired"
            ]
          },
          {
            "k": "toko",
            "ko": "갈수록 어려워요.",
            "rr": "galsurok eoryeowoyo.",
            "g": "harderAsItGoes",
            "wrong": [
              "만날수록 좋아요.",
              "사람은 실수하기 마련이에요.",
              "시간이 갈수록 편해요."
            ]
          },
          {
            "k": "tf",
            "ko": "만날수록 좋아요.",
            "rr": "mannalsurok joayo.",
            "claim": "betterAsWeMeet",
            "g": "betterAsWeMeet"
          },
          {
            "k": "listen",
            "ko": "갈수록 어려워요.",
            "rr": "galsurok eoryeowoyo.",
            "wrong": [
              "만날수록 좋아요.",
              "사람은 실수하기 마련이에요.",
              "볼수록 예뻐요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "볼수록 예뻐요.",
            "rr": "bolsurok yeppeoyo.",
            "g": "prettierAsLook",
            "wrong": [
              "betterAsWeMeet",
              "boundToMakeMistakes",
              "harderAsItGoes"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "만날수록 좋아요.",
            "rr": "mannalsurok joayo.",
            "g": "betterAsWeMeet",
            "wrong": [
              "갈수록 어려워요.",
              "사람은 실수하기 마련이에요.",
              "볼수록 예뻐요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "appearance",
        "title": "Appearance and inference (-아/어 보이다, -는 모양이다)",
        "concept": "Looks like (-아/어 보이다) and appears to be (-는 모양이다).",
        "example": [
          [
            "행복해 보여요.",
            "haengbokae boyeoyo.",
            "looksHappy"
          ],
          [
            "비가 오는 모양이에요.",
            "biga oneun moyangieyo.",
            "seemsRaining"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "행복해 보여요.",
            "rr": "haengbokae boyeoyo.",
            "g": "looksHappy",
            "wrong": [
              "seemsRaining",
              "looksTired",
              "looksDelicious"
            ]
          },
          {
            "k": "meaning",
            "ko": "비가 오는 모양이에요.",
            "rr": "biga oneun moyangieyo.",
            "g": "seemsRaining",
            "wrong": [
              "looksHappy",
              "seemsBusy",
              "looksDelicious"
            ]
          },
          {
            "k": "toko",
            "ko": "맛있어 보여요.",
            "rr": "masisseo boyeoyo.",
            "g": "looksDelicious",
            "wrong": [
              "행복해 보여요.",
              "비가 오는 모양이에요.",
              "바쁜 모양이에요."
            ]
          },
          {
            "k": "tf",
            "ko": "행복해 보여요.",
            "rr": "haengbokae boyeoyo.",
            "claim": "seemsRaining",
            "g": "looksHappy"
          },
          {
            "k": "listen",
            "ko": "맛있어 보여요.",
            "rr": "masisseo boyeoyo.",
            "wrong": [
              "행복해 보여요.",
              "비가 오는 모양이에요.",
              "피곤해 보여요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "바쁜 모양이에요.",
            "rr": "bappeun moyangieyo.",
            "g": "seemsBusy",
            "wrong": [
              "looksHappy",
              "seemsRaining",
              "looksDelicious"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "행복해 보여요.",
            "rr": "haengbokae boyeoyo.",
            "g": "looksHappy",
            "wrong": [
              "비가 오는 모양이에요.",
              "맛있어 보여요.",
              "바쁜 모양이에요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "pretense",
        "title": "Pretending (-는 척하다)",
        "concept": "Pretend to do or be something: -(으)ㄴ/는 척하다.",
        "example": [
          [
            "아는 척해요.",
            "aneun cheokaeyo.",
            "pretendsToKnow"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "아는 척해요.",
            "rr": "aneun cheokaeyo.",
            "g": "pretendsToKnow",
            "wrong": [
              "pretendedToSleep",
              "pretendsToBeBusy",
              "pretendsNotToHear"
            ]
          },
          {
            "k": "meaning",
            "ko": "자는 척했어요.",
            "rr": "janeun cheokaesseoyo.",
            "g": "pretendedToSleep",
            "wrong": [
              "pretendsToKnow",
              "pretendsToBeBusy",
              "pretendedToEat"
            ]
          },
          {
            "k": "toko",
            "ko": "바쁜 척해요.",
            "rr": "bappeun cheokaeyo.",
            "g": "pretendsToBeBusy",
            "wrong": [
              "아는 척해요.",
              "자는 척했어요.",
              "안 들리는 척해요."
            ]
          },
          {
            "k": "tf",
            "ko": "아는 척해요.",
            "rr": "aneun cheokaeyo.",
            "claim": "pretendsToKnow",
            "g": "pretendsToKnow"
          },
          {
            "k": "listen",
            "ko": "자는 척했어요.",
            "rr": "janeun cheokaesseoyo.",
            "wrong": [
              "아는 척해요.",
              "바쁜 척해요.",
              "모르는 척해요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "모르는 척해요.",
            "rr": "moreuneun cheokaeyo.",
            "g": "pretendsNotToKnow",
            "wrong": [
              "pretendsToKnow",
              "pretendedToSleep",
              "pretendsToBeBusy"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "아는 척해요.",
            "rr": "aneun cheokaeyo.",
            "g": "pretendsToKnow",
            "wrong": [
              "자는 척했어요.",
              "바쁜 척해요.",
              "모르는 척해요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "regret",
        "title": "Regret and counterfactuals (-(으)ㄹ 걸 그랬어요)",
        "concept": "Express regret: 'I should have done...' -(으)ㄹ 걸 그랬어요.",
        "example": [
          [
            "일찍 올 걸 그랬어요.",
            "iljjik ol geol geuraesseoyo.",
            "shouldHaveComeEarly"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "일찍 올 걸 그랬어요.",
            "rr": "iljjik ol geol geuraesseoyo.",
            "g": "shouldHaveComeEarly",
            "wrong": [
              "shouldHaveStudied",
              "shouldHaveBought",
              "shouldHaveEaten"
            ]
          },
          {
            "k": "meaning",
            "ko": "공부할 걸 그랬어요.",
            "rr": "gongbuhal geol geuraesseoyo.",
            "g": "shouldHaveStudied",
            "wrong": [
              "shouldHaveComeEarly",
              "shouldHaveBought",
              "shouldHaveRested"
            ]
          },
          {
            "k": "toko",
            "ko": "살 걸 그랬어요.",
            "rr": "sal geol geuraesseoyo.",
            "g": "shouldHaveBought",
            "wrong": [
              "일찍 올 걸 그랬어요.",
              "공부할 걸 그랬어요.",
              "말할 걸 그랬어요."
            ]
          },
          {
            "k": "tf",
            "ko": "일찍 올 걸 그랬어요.",
            "rr": "iljjik ol geol geuraesseoyo.",
            "claim": "shouldHaveStudied",
            "g": "shouldHaveComeEarly"
          },
          {
            "k": "listen",
            "ko": "공부할 걸 그랬어요.",
            "rr": "gongbuhal geol geuraesseoyo.",
            "wrong": [
              "일찍 올 걸 그랬어요.",
              "살 걸 그랬어요.",
              "쉴 걸 그랬어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "말할 걸 그랬어요.",
            "rr": "malhal geol geuraesseoyo.",
            "g": "shouldHaveTold",
            "wrong": [
              "shouldHaveComeEarly",
              "shouldHaveStudied",
              "shouldHaveBought"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "일찍 올 걸 그랬어요.",
            "rr": "iljjik ol geol geuraesseoyo.",
            "g": "shouldHaveComeEarly",
            "wrong": [
              "공부할 걸 그랬어요.",
              "살 걸 그랬어요.",
              "말할 걸 그랬어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "review_k7",
        "title": "K7 Comprehensive Review",
        "concept": "Review indirect speech, complex connectors and nuanced expressions.",
        "example": [
          [
            "친구가 온다고 했어요.",
            "chinguga ondago haesseoyo.",
            "friendSaidComing"
          ],
          [
            "같이 밥 먹자고 했어요.",
            "gachi bap meokjago haesseoyo.",
            "suggestedEatTogether"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "친구가 온다고 했어요.",
            "rr": "chinguga ondago haesseoyo.",
            "g": "friendSaidComing",
            "wrong": [
              "suggestedEatTogether",
              "toldToComeFast",
              "busyStudying"
            ]
          },
          {
            "k": "meaning",
            "ko": "같이 밥 먹자고 했어요.",
            "rr": "gachi bap meokjago haesseoyo.",
            "g": "suggestedEatTogether",
            "wrong": [
              "friendSaidComing",
              "toldToBeQuiet",
              "wentDespiteRain"
            ]
          },
          {
            "k": "toko",
            "ko": "비가 오는데도 갔어요.",
            "rr": "biga oneundedo gasseoyo.",
            "g": "wentDespiteRain",
            "wrong": [
              "친구가 온다고 했어요.",
              "같이 밥 먹자고 했어요.",
              "일찍 올 걸 그랬어요."
            ]
          },
          {
            "k": "tf",
            "ko": "친구가 온다고 했어요.",
            "rr": "chinguga ondago haesseoyo.",
            "claim": "friendSaidComing",
            "g": "friendSaidComing"
          },
          {
            "k": "listen",
            "ko": "같이 밥 먹자고 했어요.",
            "rr": "gachi bap meokjago haesseoyo.",
            "wrong": [
              "친구가 온다고 했어요.",
              "비가 오는데도 갔어요.",
              "공부할 걸 그랬어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "일찍 올 걸 그랬어요.",
            "rr": "iljjik ol geol geuraesseoyo.",
            "g": "shouldHaveComeEarly",
            "wrong": [
              "friendSaidComing",
              "suggestedEatTogether",
              "wentDespiteRain"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "친구가 온다고 했어요.",
            "rr": "chinguga ondago haesseoyo.",
            "g": "friendSaidComing",
            "wrong": [
              "같이 밥 먹자고 했어요.",
              "비가 오는데도 갔어요.",
              "일찍 올 걸 그랬어요."
            ],
            "variant": true
          }
        ]
      }
    ],
    "diagnostic": [
      {
        "k": "meaning",
        "ko": "친구가 온다고 해요.",
        "rr": "chinguga ondago haeyo.",
        "g": "friendSaidComing",
        "wrong": [
          "weatherSaidGood",
          "askedWhereGoing",
          "toldToComeFast"
        ]
      },
      {
        "k": "meaning",
        "ko": "비가 오는데도 갔어요.",
        "rr": "biga oneundedo gasseoyo.",
        "g": "wentDespiteRain",
        "wrong": [
          "busyStudying",
          "betterAsWeMeet",
          "looksHappy"
        ]
      }
    ]
  },
  {
    "level": "K8",
    "emoji": "🌊",
    "lessons": [
      {
        "skill": "honorific_subj",
        "title": "Honorific vocabulary for subjects",
        "concept": "Special honorific nouns and verbs for revered people: 진지, 주무시다, 편찮으시다.",
        "example": [
          [
            "할머니께서 진지를 드세요.",
            "halmeonikkeseo jinjireul deuseyo.",
            "grandmotherEatsMeal"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "할머니께서 진지를 드세요.",
            "rr": "halmeonikkeseo jinjireul deuseyo.",
            "g": "grandmotherEatsMeal",
            "wrong": [
              "motherSleeps",
              "teacherIsSick",
              "grandmotherGoes"
            ]
          },
          {
            "k": "meaning",
            "ko": "어머니께서 주무세요.",
            "rr": "eomeonikkeseo jumuseyo.",
            "g": "motherSleeps",
            "wrong": [
              "grandmotherEatsMeal",
              "teacherIsSick",
              "fatherSpeaks"
            ]
          },
          {
            "k": "toko",
            "ko": "선생님께서 편찮으세요.",
            "rr": "seonsaengnimkkeseo pyeonchaneuseyo.",
            "g": "teacherIsSick",
            "wrong": [
              "할머니께서 진지를 드세요.",
              "어머니께서 주무세요.",
              "선생님께서 오세요."
            ]
          },
          {
            "k": "tf",
            "ko": "할머니께서 진지를 드세요.",
            "rr": "halmeonikkeseo jinjireul deuseyo.",
            "claim": "motherSleeps",
            "g": "grandmotherEatsMeal"
          },
          {
            "k": "listen",
            "ko": "어머니께서 주무세요.",
            "rr": "eomeonikkeseo jumuseyo.",
            "wrong": [
              "할머니께서 진지를 드세요.",
              "선생님께서 편찮으세요.",
              "할아버지께서 오세요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "선생님께서 편찮으세요.",
            "rr": "seonsaengnimkkeseo pyeonchaneuseyo.",
            "g": "teacherIsSick",
            "wrong": [
              "grandmotherEatsMeal",
              "motherSleeps",
              "fatherSpeaks"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "할머니께서 진지를 드세요.",
            "rr": "halmeonikkeseo jinjireul deuseyo.",
            "g": "grandmotherEatsMeal",
            "wrong": [
              "어머니께서 주무세요.",
              "선생님께서 편찮으세요.",
              "진지를 먹어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "honorific_obj",
        "title": "Object honorific verbs (드리다, 뵙다, 여쭙다)",
        "concept": "Humble/honorific verbs when the action is directed toward an elder: 드리다, 뵙다, 여쭙다.",
        "example": [
          [
            "선물을 드려요.",
            "seonmureul deuryeoyo.",
            "giveGiftHonorific"
          ],
          [
            "내일 봬요.",
            "naeil bwaeyo.",
            "seeTomorrowHonorific"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "선물을 드려요.",
            "rr": "seonmureul deuryeoyo.",
            "g": "giveGiftHonorific",
            "wrong": [
              "seeTomorrowHonorific",
              "askTeacherHonorific",
              "receiveGift"
            ]
          },
          {
            "k": "meaning",
            "ko": "내일 봬요.",
            "rr": "naeil bwaeyo.",
            "g": "seeTomorrowHonorific",
            "wrong": [
              "giveGiftHonorific",
              "askTeacherHonorific",
              "seeYesterday"
            ]
          },
          {
            "k": "toko",
            "ko": "선생님께 여쭤봐요.",
            "rr": "seonsaengnimkke yeojjwobwayo.",
            "g": "askTeacherHonorific",
            "wrong": [
              "선물을 드려요.",
              "내일 봬요.",
              "친구에게 물어봐요."
            ]
          },
          {
            "k": "tf",
            "ko": "선물을 드려요.",
            "rr": "seonmureul deuryeoyo.",
            "claim": "giveGiftHonorific",
            "g": "giveGiftHonorific"
          },
          {
            "k": "listen",
            "ko": "내일 봬요.",
            "rr": "naeil bwaeyo.",
            "wrong": [
              "선물을 드려요.",
              "선생님께 여쭤봐요.",
              "오늘 만나요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "선생님께 여쭤봐요.",
            "rr": "seonsaengnimkke yeojjwobwayo.",
            "g": "askTeacherHonorific",
            "wrong": [
              "giveGiftHonorific",
              "seeTomorrowHonorific",
              "helpTeacher"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "선물을 드려요.",
            "rr": "seonmureul deuryeoyo.",
            "g": "giveGiftHonorific",
            "wrong": [
              "내일 봬요.",
              "선생님께 여쭤봐요.",
              "선물을 받아요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "passive_affix",
        "title": "Affix passives (-이/히/리/기-)",
        "concept": "Passive verbs formed by adding -이/히/리/기-: 보이다, 들리다, 열리다, 닫히다.",
        "example": [
          [
            "문이 열려요.",
            "muni yeollyeoyo.",
            "doorOpens"
          ],
          [
            "창문이 닫혀요.",
            "changmuni dachyeoyo.",
            "windowCloses"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "문이 열려요.",
            "rr": "muni yeollyeoyo.",
            "g": "doorOpens",
            "wrong": [
              "windowCloses",
              "mountainSeen",
              "musicHeard"
            ]
          },
          {
            "k": "meaning",
            "ko": "창문이 닫혀요.",
            "rr": "changmuni dachyeoyo.",
            "g": "windowCloses",
            "wrong": [
              "doorOpens",
              "mountainSeen",
              "doorLocked"
            ]
          },
          {
            "k": "toko",
            "ko": "산이 보여요.",
            "rr": "sani boyeoyo.",
            "g": "mountainSeen",
            "wrong": [
              "문이 열려요.",
              "창문이 닫혀요.",
              "음악이 들려요."
            ]
          },
          {
            "k": "tf",
            "ko": "문이 열려요.",
            "rr": "muni yeollyeoyo.",
            "claim": "windowCloses",
            "g": "doorOpens"
          },
          {
            "k": "listen",
            "ko": "창문이 닫혀요.",
            "rr": "changmuni dachyeoyo.",
            "wrong": [
              "문이 열려요.",
              "산이 보여요.",
              "음악이 들려요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "음악이 들려요.",
            "rr": "eumagi deullyeoyo.",
            "g": "musicHeard",
            "wrong": [
              "doorOpens",
              "windowCloses",
              "mountainSeen"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "문이 열려요.",
            "rr": "muni yeollyeoyo.",
            "g": "doorOpens",
            "wrong": [
              "창문이 닫혀요.",
              "산이 보여요.",
              "음악이 들려요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "passive_compound",
        "title": "Syntactic passives (-어지다, -게 되다)",
        "concept": "Verbs taking spontaneous or resulting passive forms: -아/어지다, -게 되다.",
        "example": [
          [
            "글씨가 써져요.",
            "geulssiga sseojyeoyo.",
            "letterWrittenWell"
          ],
          [
            "알게 되었어요.",
            "alge doeeosseoyo.",
            "cameToKnow"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "글씨가 써져요.",
            "rr": "geulssiga sseojyeoyo.",
            "g": "letterWrittenWell",
            "wrong": [
              "cameToKnow",
              "wentToKorea",
              "forgotName"
            ]
          },
          {
            "k": "meaning",
            "ko": "알게 되었어요.",
            "rr": "alge doeeosseoyo.",
            "g": "cameToKnow",
            "wrong": [
              "letterWrittenWell",
              "wentToKorea",
              "metFriend"
            ]
          },
          {
            "k": "toko",
            "ko": "한국에 가게 되었어요.",
            "rr": "hanguge gage doeeosseoyo.",
            "g": "wentToKoreaResult",
            "wrong": [
              "글씨가 써져요.",
              "알게 되었어요.",
              "서울에 살게 되었어요."
            ]
          },
          {
            "k": "tf",
            "ko": "글씨가 써져요.",
            "rr": "geulssiga sseojyeoyo.",
            "claim": "letterWrittenWell",
            "g": "letterWrittenWell"
          },
          {
            "k": "listen",
            "ko": "알게 되었어요.",
            "rr": "alge doeeosseoyo.",
            "wrong": [
              "글씨가 써져요.",
              "한국에 가게 되었어요.",
              "만나게 되었어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "한국에 가게 되었어요.",
            "rr": "hanguge gage doeeosseoyo.",
            "g": "wentToKoreaResult",
            "wrong": [
              "letterWrittenWell",
              "cameToKnow",
              "studiedKorean"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "알게 되었어요.",
            "rr": "alge doeeosseoyo.",
            "g": "cameToKnow",
            "wrong": [
              "글씨가 써져요.",
              "한국에 가게 되었어요.",
              "잊게 되었어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "causative_affix",
        "title": "Affix causatives (-이/히/리/기/우-)",
        "concept": "Causative verbs that make someone do an action: 보여 주다, 먹이다, 입히다.",
        "example": [
          [
            "사진을 보여 줘요.",
            "sajineul boyeo jwoyo.",
            "showsPhoto"
          ],
          [
            "아기에게 밥을 먹여요.",
            "agiege babeul meogyeoyo.",
            "feedsBaby"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "사진을 보여 줘요.",
            "rr": "sajineul boyeo jwoyo.",
            "g": "showsPhoto",
            "wrong": [
              "feedsBaby",
              "dressesClothes",
              "takesPhoto"
            ]
          },
          {
            "k": "meaning",
            "ko": "아기에게 밥을 먹여요.",
            "rr": "agiege babeul meogyeoyo.",
            "g": "feedsBaby",
            "wrong": [
              "showsPhoto",
              "dressesClothes",
              "eatsMeal"
            ]
          },
          {
            "k": "toko",
            "ko": "동생에게 옷을 입혀요.",
            "rr": "dongsaengege oseul iphyeoyo.",
            "g": "dressesClothes",
            "wrong": [
              "사진을 보여 줘요.",
              "아기에게 밥을 먹여요.",
              "옷을 사 줘요."
            ]
          },
          {
            "k": "tf",
            "ko": "사진을 보여 줘요.",
            "rr": "sajineul boyeo jwoyo.",
            "claim": "feedsBaby",
            "g": "showsPhoto"
          },
          {
            "k": "listen",
            "ko": "아기에게 밥을 먹여요.",
            "rr": "agiege babeul meogyeoyo.",
            "wrong": [
              "사진을 보여 줘요.",
              "동생에게 옷을 입혀요.",
              "밥을 먹어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "동생에게 옷을 입혀요.",
            "rr": "dongsaengege oseul iphyeoyo.",
            "g": "dressesClothes",
            "wrong": [
              "showsPhoto",
              "feedsBaby",
              "wearsClothes"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "사진을 보여 줘요.",
            "rr": "sajineul boyeo jwoyo.",
            "g": "showsPhoto",
            "wrong": [
              "아기에게 밥을 먹여요.",
              "동생에게 옷을 입혀요.",
              "사진을 봐요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "causative_compound",
        "title": "Syntactic causatives (-게 하다)",
        "concept": "Make or cause someone to do something: -게 하다.",
        "example": [
          [
            "웃게 해요.",
            "utge haeyo.",
            "makesLaugh"
          ],
          [
            "기다리게 했어요.",
            "gidarige haesseoyo.",
            "madeWait"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "웃게 해요.",
            "rr": "utge haeyo.",
            "g": "makesLaugh",
            "wrong": [
              "madeWait",
              "makesCry",
              "makesStudy"
            ]
          },
          {
            "k": "meaning",
            "ko": "기다리게 했어요.",
            "rr": "gidarige haesseoyo.",
            "g": "madeWait",
            "wrong": [
              "makesLaugh",
              "makesGo",
              "waitedLong"
            ]
          },
          {
            "k": "toko",
            "ko": "동생을 울게 했어요.",
            "rr": "dongsaengeul ulge haesseoyo.",
            "g": "madeCry",
            "wrong": [
              "웃게 해요.",
              "기다리게 했어요.",
              "동생이 울었어요."
            ]
          },
          {
            "k": "tf",
            "ko": "웃게 해요.",
            "rr": "utge haeyo.",
            "claim": "makesLaugh",
            "g": "makesLaugh"
          },
          {
            "k": "listen",
            "ko": "기다리게 했어요.",
            "rr": "gidarige haesseoyo.",
            "wrong": [
              "웃게 해요.",
              "동생을 울게 했어요.",
              "기다렸어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "동생을 울게 했어요.",
            "rr": "dongsaengeul ulge haesseoyo.",
            "g": "madeCry",
            "wrong": [
              "makesLaugh",
              "madeWait",
              "laughedTogether"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "웃게 해요.",
            "rr": "utge haeyo.",
            "g": "makesLaugh",
            "wrong": [
              "기다리게 했어요.",
              "동생을 울게 했어요.",
              "웃었어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "formal_style",
        "title": "Public formal style (-하십시오)",
        "concept": "High formal deferential style for announcements and ceremonies: -하십시오, -하십시다.",
        "example": [
          [
            "자리에 앉으십시오.",
            "jarie anjeusipsio.",
            "pleaseBeSeated"
          ],
          [
            "출발하십시다.",
            "chulbalhasipsida.",
            "letUsDepart"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "자리에 앉으십시오.",
            "rr": "jarie anjeusipsio.",
            "g": "pleaseBeSeated",
            "wrong": [
              "letUsDepart",
              "pleaseWait",
              "pleaseComeIn"
            ]
          },
          {
            "k": "meaning",
            "ko": "출발하십시다.",
            "rr": "chulbalhasipsida.",
            "g": "letUsDepart",
            "wrong": [
              "pleaseBeSeated",
              "pleaseWait",
              "arrivedNow"
            ]
          },
          {
            "k": "toko",
            "ko": "질문 있으십니까?",
            "rr": "jilmun isseusimnikka?",
            "g": "doYouHaveQuestions",
            "wrong": [
              "자리에 앉으십시오.",
              "출발하십시다.",
              "말씀하십시오."
            ]
          },
          {
            "k": "tf",
            "ko": "자리에 앉으십시오.",
            "rr": "jarie anjeusipsio.",
            "claim": "letUsDepart",
            "g": "pleaseBeSeated"
          },
          {
            "k": "listen",
            "ko": "출발하십시다.",
            "rr": "chulbalhasipsida.",
            "wrong": [
              "자리에 앉으십시오.",
              "질문 있으십니까?",
              "시작하십시다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "질문 있으십니까?",
            "rr": "jilmun isseusimnikka?",
            "g": "doYouHaveQuestions",
            "wrong": [
              "pleaseBeSeated",
              "letUsDepart",
              "haveNoQuestions"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "자리에 앉으십시오.",
            "rr": "jarie anjeusipsio.",
            "g": "pleaseBeSeated",
            "wrong": [
              "출발하십시다.",
              "질문 있으십니까?",
              "앉았어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "modesty",
        "title": "Modest and humble expressions",
        "concept": "Polite speech using humble pronouns and verbs: 저희, 말씀 올리다.",
        "example": [
          [
            "인사 말씀 올립니다.",
            "insa malsseum ollimnida.",
            "offerGreetingWords"
          ],
          [
            "저희 학교입니다.",
            "jeohui hakgyoimnida.",
            "ourSchoolHumble"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "인사 말씀 올립니다.",
            "rr": "insa malsseum ollimnida.",
            "g": "offerGreetingWords",
            "wrong": [
              "ourSchoolHumble",
              "ourCountryHumble",
              "thankYouSincerely"
            ]
          },
          {
            "k": "meaning",
            "ko": "저희 학교입니다.",
            "rr": "jeohui hakgyoimnida.",
            "g": "ourSchoolHumble",
            "wrong": [
              "offerGreetingWords",
              "mySchool",
              "ourHouse"
            ]
          },
          {
            "k": "toko",
            "ko": "감사의 뜻을 전합니다.",
            "rr": "gamsaui tteuseul jeonhamnida.",
            "g": "conveyGratitude",
            "wrong": [
              "인사 말씀 올립니다.",
              "저희 학교입니다.",
              "축하드립니다."
            ]
          },
          {
            "k": "tf",
            "ko": "인사 말씀 올립니다.",
            "rr": "insa malsseum ollimnida.",
            "claim": "offerGreetingWords",
            "g": "offerGreetingWords"
          },
          {
            "k": "listen",
            "ko": "저희 학교입니다.",
            "rr": "jeohui hakgyoimnida.",
            "wrong": [
              "인사 말씀 올립니다.",
              "감사의 뜻을 전합니다.",
              "우리 학교입니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "감사의 뜻을 전합니다.",
            "rr": "gamsaui tteuseul jeonhamnida.",
            "g": "conveyGratitude",
            "wrong": [
              "offerGreetingWords",
              "ourSchoolHumble",
              "apologizeSincerely"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "인사 말씀 올립니다.",
            "rr": "insa malsseum ollimnida.",
            "g": "offerGreetingWords",
            "wrong": [
              "저희 학교입니다.",
              "감사의 뜻을 전합니다.",
              "인사했어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "review_k8",
        "title": "K8 Comprehensive Review",
        "concept": "Review honorifics, passive, causative and formal polite registers.",
        "example": [
          [
            "할머니께 선물을 드렸어요.",
            "halmeonikke seonmureul deuryeosseoyo.",
            "gaveGiftToGrandmother"
          ],
          [
            "문이 저절로 닫혔어요.",
            "muni jeojeollo dachyeosseoyo.",
            "doorClosedByItself"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "할머니께 선물을 드렸어요.",
            "rr": "halmeonikke seonmureul deuryeosseoyo.",
            "g": "gaveGiftToGrandmother",
            "wrong": [
              "doorClosedByItself",
              "pleaseBeSeated",
              "motherSleeps"
            ]
          },
          {
            "k": "meaning",
            "ko": "문이 저절로 닫혔어요.",
            "rr": "muni jeojeollo dachyeosseoyo.",
            "g": "doorClosedByItself",
            "wrong": [
              "gaveGiftToGrandmother",
              "doorOpens",
              "cameToKnow"
            ]
          },
          {
            "k": "toko",
            "ko": "자리에 앉으십시오.",
            "rr": "jarie anjeusipsio.",
            "g": "pleaseBeSeated",
            "wrong": [
              "할머니께 선물을 드렸어요.",
              "문이 저절로 닫혔어요.",
              "선물을 드려요."
            ]
          },
          {
            "k": "tf",
            "ko": "할머니께 선물을 드렸어요.",
            "rr": "halmeonikke seonmureul deuryeosseoyo.",
            "claim": "doorClosedByItself",
            "g": "gaveGiftToGrandmother"
          },
          {
            "k": "listen",
            "ko": "문이 저절로 닫혔어요.",
            "rr": "muni jeojeollo dachyeosseoyo.",
            "wrong": [
              "할머니께 선물을 드렸어요.",
              "자리에 앉으십시오.",
              "문이 열렸어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "자리에 앉으십시오.",
            "rr": "jarie anjeusipsio.",
            "g": "pleaseBeSeated",
            "wrong": [
              "gaveGiftToGrandmother",
              "doorClosedByItself",
              "letUsDepart"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "할머니께 선물을 드렸어요.",
            "rr": "halmeonikke seonmureul deuryeosseoyo.",
            "g": "gaveGiftToGrandmother",
            "wrong": [
              "문이 저절로 닫혔어요.",
              "자리에 앉으십시오.",
              "선물을 받았어요."
            ],
            "variant": true
          }
        ]
      }
    ],
    "diagnostic": [
      {
        "k": "meaning",
        "ko": "선물을 드려요.",
        "rr": "seonmureul deuryeoyo.",
        "g": "giveGiftHonorific",
        "wrong": [
          "grandmotherEatsMeal",
          "doorOpens",
          "showsPhoto"
        ]
      },
      {
        "k": "meaning",
        "ko": "자리에 앉으십시오.",
        "rr": "jarie anjeusipsio.",
        "g": "pleaseBeSeated",
        "wrong": [
          "letterWrittenWell",
          "makesLaugh",
          "ourSchoolHumble"
        ]
      }
    ]
  },
  {
    "level": "K9",
    "emoji": "🏢",
    "lessons": [
      {
        "skill": "biz_email",
        "title": "Business email writing and requests",
        "concept": "Formal business email conventions: -에 관하여, 검토 부탁드립니다.",
        "example": [
          [
            "회의 안건에 관하여 말씀드립니다.",
            "hoeui angeone gwanhayeo malsseumdeurimnida.",
            "regardingMeetingAgenda"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "회의 안건에 관하여 말씀드립니다.",
            "rr": "hoeui angeone gwanhayeo malsseumdeurimnida.",
            "g": "regardingMeetingAgenda",
            "wrong": [
              "pleaseCheckAttachment",
              "pleaseReviewRequest",
              "scheduleChangeRequest"
            ]
          },
          {
            "k": "meaning",
            "ko": "첨부파일을 확인해 주십시오.",
            "rr": "cheombupaireul hwaginhae jusipsio.",
            "g": "pleaseCheckAttachment",
            "wrong": [
              "regardingMeetingAgenda",
              "pleaseReviewRequest",
              "connectingPersonInCharge"
            ]
          },
          {
            "k": "toko",
            "ko": "검토 부탁드립니다.",
            "rr": "geomto butakdeurimnida.",
            "g": "pleaseReviewRequest",
            "wrong": [
              "회의 안건에 관하여 말씀드립니다.",
              "첨부파일을 확인해 주십시오.",
              "통화 가능하신지요."
            ]
          },
          {
            "k": "tf",
            "ko": "회의 안건에 관하여 말씀드립니다.",
            "rr": "hoeui angeone gwanhayeo malsseumdeurimnida.",
            "claim": "regardingMeetingAgenda",
            "g": "regardingMeetingAgenda"
          },
          {
            "k": "listen",
            "ko": "첨부파일을 확인해 주십시오.",
            "rr": "cheombupaireul hwaginhae jusipsio.",
            "wrong": [
              "회의 안건에 관하여 말씀드립니다.",
              "검토 부탁드립니다.",
              "일정을 변경하고자 합니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "검토 부탁드립니다.",
            "rr": "geomto butakdeurimnida.",
            "g": "pleaseReviewRequest",
            "wrong": [
              "regardingMeetingAgenda",
              "pleaseCheckAttachment",
              "availableToSpeakNow"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "회의 안건에 관하여 말씀드립니다.",
            "rr": "hoeui angeone gwanhayeo malsseumdeurimnida.",
            "g": "regardingMeetingAgenda",
            "wrong": [
              "첨부파일을 확인해 주십시오.",
              "검토 부탁드립니다.",
              "안건을 검토합니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "biz_phone",
        "title": "Business telephone etiquette",
        "concept": "Handling calls and messages: 통화 가능하신지요, 연결해 드리겠습니다.",
        "example": [
          [
            "지금 통화 가능하신지요?",
            "jigeum tonghwa ganeunghasinjiyo?",
            "availableToSpeakNow"
          ],
          [
            "담당자를 연결해 드리겠습니다.",
            "damdangjareul yeongyeolhae deurigetseumnida.",
            "connectingPersonInCharge"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "지금 통화 가능하신지요?",
            "rr": "jigeum tonghwa ganeunghasinjiyo?",
            "g": "availableToSpeakNow",
            "wrong": [
              "connectingPersonInCharge",
              "shallITakeMessage",
              "regardingMeetingAgenda"
            ]
          },
          {
            "k": "meaning",
            "ko": "담당자를 연결해 드리겠습니다.",
            "rr": "damdangjareul yeongyeolhae deurigetseumnida.",
            "g": "connectingPersonInCharge",
            "wrong": [
              "availableToSpeakNow",
              "shallITakeMessage",
              "pleaseCheckAttachment"
            ]
          },
          {
            "k": "toko",
            "ko": "메모를 남겨 드릴까요?",
            "rr": "memoreul namgyeo deurilkkayo?",
            "g": "shallITakeMessage",
            "wrong": [
              "지금 통화 가능하신지요?",
              "담당자를 연결해 드리겠습니다.",
              "전화 주십시오."
            ]
          },
          {
            "k": "tf",
            "ko": "지금 통화 가능하신지요?",
            "rr": "jigeum tonghwa ganeunghasinjiyo?",
            "claim": "connectingPersonInCharge",
            "g": "availableToSpeakNow"
          },
          {
            "k": "listen",
            "ko": "담당자를 연결해 드리겠습니다.",
            "rr": "damdangjareul yeongyeolhae deurigetseumnida.",
            "wrong": [
              "지금 통화 가능하신지요?",
              "메모를 남겨 드릴까요?",
              "전화 받았습니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "메모를 남겨 드릴까요?",
            "rr": "memoreul namgyeo deurilkkayo.",
            "g": "shallITakeMessage",
            "wrong": [
              "availableToSpeakNow",
              "connectingPersonInCharge",
              "callAgainLater"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "지금 통화 가능하신지요?",
            "rr": "jigeum tonghwa ganeunghasinjiyo?",
            "g": "availableToSpeakNow",
            "wrong": [
              "담당자를 연결해 드리겠습니다.",
              "메모를 남겨 드릴까요?",
              "전화 통화했습니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "biz_schedule",
        "title": "Scheduling and rescheduling",
        "concept": "Proposing and changing appointment times: 변경하고자 합니다, 양해 부탁드립니다.",
        "example": [
          [
            "일정을 변경하고자 합니다.",
            "iljeongeul byeongyeonghagoja hamnida.",
            "scheduleChangeRequest"
          ],
          [
            "너른 양해 부탁드립니다.",
            "neoreun yanghae butakdeurimnida.",
            "askKindUnderstanding"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "일정을 변경하고자 합니다.",
            "rr": "iljeongeul byeongyeonghagoja hamnida.",
            "g": "scheduleChangeRequest",
            "wrong": [
              "askKindUnderstanding",
              "convenientTimeRequest",
              "meetingCancelled"
            ]
          },
          {
            "k": "meaning",
            "ko": "너른 양해 부탁드립니다.",
            "rr": "neoreun yanghae butakdeurimnida.",
            "g": "askKindUnderstanding",
            "wrong": [
              "scheduleChangeRequest",
              "convenientTimeRequest",
              "thankYouSincerely"
            ]
          },
          {
            "k": "toko",
            "ko": "편하신 시간을 알려 주십시오.",
            "rr": "pyeonhasin siganeul allyeo jusipsio.",
            "g": "convenientTimeRequest",
            "wrong": [
              "일정을 변경하고자 합니다.",
              "너른 양해 부탁드립니다.",
              "시간이 없습니다."
            ]
          },
          {
            "k": "tf",
            "ko": "일정을 변경하고자 합니다.",
            "rr": "iljeongeul byeongyeonghagoja hamnida.",
            "claim": "scheduleChangeRequest",
            "g": "scheduleChangeRequest"
          },
          {
            "k": "listen",
            "ko": "너른 양해 부탁드립니다.",
            "rr": "neoreun yanghae butakdeurimnida.",
            "wrong": [
              "일정을 변경하고자 합니다.",
              "편하신 시간을 알려 주십시오.",
              "약속을 지키겠습니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "편하신 시간을 알려 주십시오.",
            "rr": "pyeonhasin siganeul allyeo jusipsio.",
            "g": "convenientTimeRequest",
            "wrong": [
              "scheduleChangeRequest",
              "askKindUnderstanding",
              "callMeLater"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "일정을 변경하고자 합니다.",
            "rr": "iljeongeul byeongyeonghagoja hamnida.",
            "g": "scheduleChangeRequest",
            "wrong": [
              "너른 양해 부탁드립니다.",
              "편하신 시간을 알려 주십시오.",
              "일정을 확인합니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "biz_meeting",
        "title": "Meeting discussions and opinions",
        "concept": "Expressing views during meetings: 제 생각으로는, 찬성합니다, 추가 검토.",
        "example": [
          [
            "제 생각으로는 이번 안이 좋습니다.",
            "je saenggakeoroneun ibeon ani jotseumnida.",
            "inMyOpinionProposalGood"
          ],
          [
            "적극 찬성합니다.",
            "jeokgeuk chanseonghamnida.",
            "stronglyAgree"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "제 생각으로는 이번 안이 좋습니다.",
            "rr": "je saenggakeoroneun ibeon ani jotseumnida.",
            "g": "inMyOpinionProposalGood",
            "wrong": [
              "stronglyAgree",
              "additionalReviewNeeded",
              "opposeStrongly"
            ]
          },
          {
            "k": "meaning",
            "ko": "적극 찬성합니다.",
            "rr": "jeokgeuk chanseonghamnida.",
            "g": "stronglyAgree",
            "wrong": [
              "inMyOpinionProposalGood",
              "additionalReviewNeeded",
              "suggestAlternative"
            ]
          },
          {
            "k": "toko",
            "ko": "추가 검토가 필요합니다.",
            "rr": "chuga geomtoga piryohamnida.",
            "g": "additionalReviewNeeded",
            "wrong": [
              "제 생각으로는 이번 안이 좋습니다.",
              "적극 찬성합니다.",
              "의견이 없습니다."
            ]
          },
          {
            "k": "tf",
            "ko": "제 생각으로는 이번 안이 좋습니다.",
            "rr": "je saenggakeoroneun ibeon ani jotseumnida.",
            "claim": "stronglyAgree",
            "g": "inMyOpinionProposalGood"
          },
          {
            "k": "listen",
            "ko": "적극 찬성합니다.",
            "rr": "jeokgeuk chanseonghamnida.",
            "wrong": [
              "제 생각으로는 이번 안이 좋습니다.",
              "추가 검토가 필요합니다.",
              "반대합니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "추가 검토가 필요합니다.",
            "rr": "chuga geomtoga piryohamnida.",
            "g": "additionalReviewNeeded",
            "wrong": [
              "inMyOpinionProposalGood",
              "stronglyAgree",
              "approveImmediately"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "제 생각으로는 이번 안이 좋습니다.",
            "rr": "je saenggakeoroneun ibeon ani jotseumnida.",
            "g": "inMyOpinionProposalGood",
            "wrong": [
              "적극 찬성합니다.",
              "추가 검토가 필요합니다.",
              "의견을 냅니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "biz_report",
        "title": "Reporting project progress",
        "concept": "Giving status updates: 진행 상황을 보고합니다, 조치를 완료했습니다.",
        "example": [
          [
            "프로젝트 진행 상황을 보고합니다.",
            "peurojekteu jinhaeng sanghwangeul bogohamnida.",
            "reportingProjectProgress"
          ],
          [
            "조치를 완료했습니다.",
            "jochireul wallyohaesseumnida.",
            "completedAction"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "프로젝트 진행 상황을 보고합니다.",
            "rr": "peurojekteu jinhaeng sanghwangeul bogohamnida.",
            "g": "reportingProjectProgress",
            "wrong": [
              "completedAction",
              "salesIncreased",
              "cooperationHoped"
            ]
          },
          {
            "k": "meaning",
            "ko": "조치를 완료했습니다.",
            "rr": "jochireul wallyohaesseumnida.",
            "g": "completedAction",
            "wrong": [
              "reportingProjectProgress",
              "salesIncreased",
              "projectDelayed"
            ]
          },
          {
            "k": "toko",
            "ko": "결과를 공유해 드립니다.",
            "rr": "gyeolgwareul gongyuhae deurimnida.",
            "g": "sharingResults",
            "wrong": [
              "프로젝트 진행 상황을 보고합니다.",
              "조치를 완료했습니다.",
              "보고서를 받았습니다."
            ]
          },
          {
            "k": "tf",
            "ko": "프로젝트 진행 상황을 보고합니다.",
            "rr": "peurojekteu jinhaeng sanghwangeul bogohamnida.",
            "claim": "reportingProjectProgress",
            "g": "reportingProjectProgress"
          },
          {
            "k": "listen",
            "ko": "조치를 완료했습니다.",
            "rr": "jochireul wallyohaesseumnida.",
            "wrong": [
              "프로젝트 진행 상황을 보고합니다.",
              "결과를 공유해 드립니다.",
              "시작했습니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "결과를 공유해 드립니다.",
            "rr": "gyeolgwareul gongyuhae deurimnida.",
            "g": "sharingResults",
            "wrong": [
              "reportingProjectProgress",
              "completedAction",
              "scheduleDelayed"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "프로젝트 진행 상황을 보고합니다.",
            "rr": "peurojekteu jinhaeng sanghwangeul bogohamnida.",
            "g": "reportingProjectProgress",
            "wrong": [
              "조치를 완료했습니다.",
              "결과를 공유해 드립니다.",
              "보고 완료합니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "biz_stats",
        "title": "Statistical figures and data trends",
        "concept": "Describing trends and numbers: 증가했습니다, 전년 대비.",
        "example": [
          [
            "매출이 증가했습니다.",
            "maechuri jeunggahaesseumnida.",
            "salesIncreased"
          ],
          [
            "전년 대비 상승했습니다.",
            "jeonnyeon daebi sangseunghaesseumnida.",
            "increasedComparedToLastYear"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "매출이 증가했습니다.",
            "rr": "maechuri jeunggahaesseumnida.",
            "g": "salesIncreased",
            "wrong": [
              "increasedComparedToLastYear",
              "hopeMutualCooperation",
              "exchangeBusinessCards"
            ]
          },
          {
            "k": "meaning",
            "ko": "전년 대비 상승했습니다.",
            "rr": "jeonnyeon daebi sangseunghaesseumnida.",
            "g": "increasedComparedToLastYear",
            "wrong": [
              "salesIncreased",
              "hopeMutualCooperation",
              "salesDecreased"
            ]
          },
          {
            "k": "toko",
            "ko": "비용이 감소했습니다.",
            "rr": "biyongi gamsohaesseumnida.",
            "g": "costsDecreased",
            "wrong": [
              "매출이 증가했습니다.",
              "전년 대비 상승했습니다.",
              "가격이 올랐습니다."
            ]
          },
          {
            "k": "tf",
            "ko": "매출이 증가했습니다.",
            "rr": "maechuri jeunggahaesseumnida.",
            "claim": "increasedComparedToLastYear",
            "g": "salesIncreased"
          },
          {
            "k": "listen",
            "ko": "전년 대비 상승했습니다.",
            "rr": "jeonnyeon daebi sangseunghaesseumnida.",
            "wrong": [
              "매출이 증가했습니다.",
              "비용이 감소했습니다.",
              "유지되었습니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "비용이 감소했습니다.",
            "rr": "biyongi gamsohaesseumnida.",
            "g": "costsDecreased",
            "wrong": [
              "salesIncreased",
              "increasedComparedToLastYear",
              "profitsDecreased"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "매출이 증가했습니다.",
            "rr": "maechuri jeunggahaesseumnida.",
            "g": "salesIncreased",
            "wrong": [
              "전년 대비 상승했습니다.",
              "비용이 감소했습니다.",
              "매출이 감소했습니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "biz_negotiate",
        "title": "Business negotiations and partnerships",
        "concept": "Professional collaboration: 상호 협력을 희망합니다, 절충안 제시.",
        "example": [
          [
            "상호 협력을 희망합니다.",
            "sangho hyeomnyeogeul huimanghamnida.",
            "hopeMutualCooperation"
          ],
          [
            "절충안을 제안합니다.",
            "jeolchuganeul jeanhamnida.",
            "proposeCompromise"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "상호 협력을 희망합니다.",
            "rr": "sangho hyeomnyeogeul huimanghamnida.",
            "g": "hopeMutualCooperation",
            "wrong": [
              "proposeCompromise",
              "exchangeBusinessCards",
              "acceptContract"
            ]
          },
          {
            "k": "meaning",
            "ko": "절충안을 제안합니다.",
            "rr": "jeolchuganeul jeanhamnida.",
            "g": "proposeCompromise",
            "wrong": [
              "hopeMutualCooperation",
              "exchangeBusinessCards",
              "refuseProposal"
            ]
          },
          {
            "k": "toko",
            "ko": "계약을 체결했습니다.",
            "rr": "gyeyageul chegyeolhaesseumnida.",
            "g": "signedContract",
            "wrong": [
              "상호 협력을 희망합니다.",
              "절충안을 제안합니다.",
              "협상을 시작합니다."
            ]
          },
          {
            "k": "tf",
            "ko": "상호 협력을 희망합니다.",
            "rr": "sangho hyeomnyeogeul huimanghamnida.",
            "claim": "hopeMutualCooperation",
            "g": "hopeMutualCooperation"
          },
          {
            "k": "listen",
            "ko": "절충안을 제안합니다.",
            "rr": "jeolchuganeul jeanhamnida.",
            "wrong": [
              "상호 협력을 희망합니다.",
              "계약을 체결했습니다.",
              "거절합니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "계약을 체결했습니다.",
            "rr": "gyeyageul chegyeolhaesseumnida.",
            "g": "signedContract",
            "wrong": [
              "hopeMutualCooperation",
              "proposeCompromise",
              "delayedContract"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "상호 협력을 희망합니다.",
            "rr": "sangho hyeomnyeogeul huimanghamnida.",
            "g": "hopeMutualCooperation",
            "wrong": [
              "절충안을 제안합니다.",
              "계약을 체결했습니다.",
              "협력하겠습니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "biz_etiquette",
        "title": "Business cards and professional titles",
        "concept": "Exchanging cards and titles: 처음 뵙겠습니다, 명함 드립니다.",
        "example": [
          [
            "처음 뵙겠습니다, 명함 드립니다.",
            "cheoeum boepgetseumnida, myeongham deurimnida.",
            "pleasedToMeetCard"
          ],
          [
            "김 부장님입니다.",
            "gim bujangnimimnida.",
            "departmentManagerKim"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "처음 뵙겠습니다, 명함 드립니다.",
            "rr": "cheoeum boepgetseumnida, myeongham deurimnida.",
            "g": "pleasedToMeetCard",
            "wrong": [
              "departmentManagerKim",
              "teamLeaderPark",
              "thankYouGreeting"
            ]
          },
          {
            "k": "meaning",
            "ko": "김 부장님입니다.",
            "rr": "gim bujangnimimnida.",
            "g": "departmentManagerKim",
            "wrong": [
              "pleasedToMeetCard",
              "teamLeaderPark",
              "generalManagerLee"
            ]
          },
          {
            "k": "toko",
            "ko": "박 팀장님입니다.",
            "rr": "bak timjangnimimnida.",
            "g": "teamLeaderPark",
            "wrong": [
              "처음 뵙겠습니다, 명함 드립니다.",
              "김 부장님입니다.",
              "이사님입니다."
            ]
          },
          {
            "k": "tf",
            "ko": "처음 뵙겠습니다, 명함 드립니다.",
            "rr": "cheoeum boepgetseumnida, myeongham deurimnida.",
            "claim": "departmentManagerKim",
            "g": "pleasedToMeetCard"
          },
          {
            "k": "listen",
            "ko": "김 부장님입니다.",
            "rr": "gim bujangnimimnida.",
            "wrong": [
              "처음 뵙겠습니다, 명함 드립니다.",
              "박 팀장님입니다.",
              "과장님입니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "박 팀장님입니다.",
            "rr": "bak timjangnimimnida.",
            "g": "teamLeaderPark",
            "wrong": [
              "pleasedToMeetCard",
              "departmentManagerKim",
              "deputyKim"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "처음 뵙겠습니다, 명함 드립니다.",
            "rr": "cheoeum boepgetseumnida, myeongham deurimnida.",
            "g": "pleasedToMeetCard",
            "wrong": [
              "김 부장님입니다.",
              "박 팀장님입니다.",
              "인사 나눕니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "review_k9",
        "title": "K9 Comprehensive Review",
        "concept": "Review professional communications, formal correspondence and meetings.",
        "example": [
          [
            "안건을 검토해 주시기 바랍니다.",
            "angeoneul geomtohae jusigi baramnida.",
            "pleaseReviewAgenda"
          ],
          [
            "회의에서 뵙겠습니다.",
            "hoeuieseo boepgetseumnida.",
            "seeYouAtMeeting"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "안건을 검토해 주시기 바랍니다.",
            "rr": "angeoneul geomtohae jusigi baramnida.",
            "g": "pleaseReviewAgenda",
            "wrong": [
              "seeYouAtMeeting",
              "reportingProjectProgress",
              "signedContract"
            ]
          },
          {
            "k": "meaning",
            "ko": "회의에서 뵙겠습니다.",
            "rr": "hoeuieseo boepgetseumnida.",
            "g": "seeYouAtMeeting",
            "wrong": [
              "pleaseReviewAgenda",
              "salesIncreased",
              "proposeCompromise"
            ]
          },
          {
            "k": "toko",
            "ko": "상호 협력을 희망합니다.",
            "rr": "sangho hyeomnyeogeul huimanghamnida.",
            "g": "hopeMutualCooperation",
            "wrong": [
              "안건을 검토해 주시기 바랍니다.",
              "회의에서 뵙겠습니다.",
              "메모를 남겨 드립니다."
            ]
          },
          {
            "k": "tf",
            "ko": "안건을 검토해 주시기 바랍니다.",
            "rr": "angeoneul geomtohae jusigi baramnida.",
            "claim": "pleaseReviewAgenda",
            "g": "pleaseReviewAgenda"
          },
          {
            "k": "listen",
            "ko": "회의에서 뵙겠습니다.",
            "rr": "hoeuieseo boepgetseumnida.",
            "wrong": [
              "안건을 검토해 주시기 바랍니다.",
              "상호 협력을 희망합니다.",
              "내일 봬요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "상호 협력을 희망합니다.",
            "rr": "sangho hyeomnyeogeul huimanghamnida.",
            "g": "hopeMutualCooperation",
            "wrong": [
              "pleaseReviewAgenda",
              "seeYouAtMeeting",
              "signedContract"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "안건을 검토해 주시기 바랍니다.",
            "rr": "angeoneul geomtohae jusigi baramnida.",
            "g": "pleaseReviewAgenda",
            "wrong": [
              "회의에서 뵙겠습니다.",
              "상호 협력을 희망합니다.",
              "검토했습니다."
            ],
            "variant": true
          }
        ]
      }
    ],
    "diagnostic": [
      {
        "k": "meaning",
        "ko": "검토 부탁드립니다.",
        "rr": "geomto butakdeurimnida.",
        "g": "pleaseReviewRequest",
        "wrong": [
          "connectingPersonInCharge",
          "askKindUnderstanding",
          "completedAction"
        ]
      },
      {
        "k": "meaning",
        "ko": "상호 협력을 희망합니다.",
        "rr": "sangho hyeomnyeogeul huimanghamnida.",
        "g": "hopeMutualCooperation",
        "wrong": [
          "salesIncreased",
          "pleasedToMeetCard",
          "seeYouAtMeeting"
        ]
      }
    ]
  },
  {
    "level": "K10",
    "emoji": "🌲",
    "lessons": [
      {
        "skill": "media_headline",
        "title": "Headlines and compressed style",
        "concept": "News headlines and compressed noun phrases: 물가 안정 대책 발표.",
        "example": [
          [
            "물가 안정 대책을 발표했습니다.",
            "mulga anjeong daechaegeul balpyohaesseumnida.",
            "announcedPriceMeasures"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "물가 안정 대책을 발표했습니다.",
            "rr": "mulga anjeong daechaegeul balpyohaesseumnida.",
            "g": "announcedPriceMeasures",
            "wrong": [
              "recordHighExports",
              "aiDevelopingRapidly",
              "heavyResponsibilityBurden"
            ]
          },
          {
            "k": "meaning",
            "ko": "수출이 사상 최대를 기록했습니다.",
            "rr": "suchuri sasang choedaereul girokhaesseumnida.",
            "g": "recordHighExports",
            "wrong": [
              "announcedPriceMeasures",
              "aiDevelopingRapidly",
              "protectEnvironment"
            ]
          },
          {
            "k": "toko",
            "ko": "인공지능 기술이 발전하고 있습니다.",
            "rr": "ingongjineung gisuri baljeonhago isseumnida.",
            "g": "aiDevelopingRapidly",
            "wrong": [
              "물가 안정 대책을 발표했습니다.",
              "수출이 사상 최대를 기록했습니다.",
              "물가가 안정되었습니다."
            ]
          },
          {
            "k": "tf",
            "ko": "물가 안정 대책을 발표했습니다.",
            "rr": "mulga anjeong daechaegeul balpyohaesseumnida.",
            "claim": "recordHighExports",
            "g": "announcedPriceMeasures"
          },
          {
            "k": "listen",
            "ko": "수출이 사상 최대를 기록했습니다.",
            "rr": "suchuri sasang choedaereul girokhaesseumnida.",
            "wrong": [
              "물가 안정 대책을 발표했습니다.",
              "인공지능 기술이 발전하고 있습니다.",
              "수입이 증가했습니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "인공지능 기술이 발전하고 있습니다.",
            "rr": "ingongjineung gisuri baljeonhago isseumnida.",
            "g": "aiDevelopingRapidly",
            "wrong": [
              "announcedPriceMeasures",
              "recordHighExports",
              "cleanEnergyPopular"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "물가 안정 대책을 발표했습니다.",
            "rr": "mulga anjeong daechaegeul balpyohaesseumnida.",
            "g": "announcedPriceMeasures",
            "wrong": [
              "수출이 사상 최대를 기록했습니다.",
              "인공지능 기술이 발전하고 있습니다.",
              "대책을 세웁니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "media_article",
        "title": "Current affairs and editorials",
        "concept": "Reading short news articles: 친환경 에너지가 주목받고 있습니다.",
        "example": [
          [
            "친환경 에너지가 주목받고 있습니다.",
            "chinhwan-gyeong eneojiga jumokbatgo isseumnida.",
            "cleanEnergyPopular"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "친환경 에너지가 주목받고 있습니다.",
            "rr": "chinhwan-gyeong eneojiga jumokbatgo isseumnida.",
            "g": "cleanEnergyPopular",
            "wrong": [
              "announcedPriceMeasures",
              "hasWideConnections",
              "highStandardsChoose"
            ]
          },
          {
            "k": "meaning",
            "ko": "사회적 관심이 커지고 있습니다.",
            "rr": "sahoejeok gwansimi keojigo isseumnida.",
            "g": "socialInterestGrowing",
            "wrong": [
              "cleanEnergyPopular",
              "announcedPriceMeasures",
              "scientificDebate"
            ]
          },
          {
            "k": "toko",
            "ko": "새로운 기술을 도입했습니다.",
            "rr": "saeroun gisureul doiphaesseumnida.",
            "g": "adoptedNewTech",
            "wrong": [
              "친환경 에너지가 주목받고 있습니다.",
              "사회적 관심이 커지고 있습니다.",
              "기술을 개발합니다."
            ]
          },
          {
            "k": "tf",
            "ko": "친환경 에너지가 주목받고 있습니다.",
            "rr": "chinhwan-gyeong eneojiga jumokbatgo isseumnida.",
            "claim": "cleanEnergyPopular",
            "g": "cleanEnergyPopular"
          },
          {
            "k": "listen",
            "ko": "사회적 관심이 커지고 있습니다.",
            "rr": "sahoejeok gwansimi keojigo isseumnida.",
            "wrong": [
              "친환경 에너지가 주목받고 있습니다.",
              "새로운 기술을 도입했습니다.",
              "관심이 줄어듭니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "새로운 기술을 도입했습니다.",
            "rr": "saeroun gisureul doiphaesseumnida.",
            "g": "adoptedNewTech",
            "wrong": [
              "cleanEnergyPopular",
              "socialInterestGrowing",
              "stoppedNewTech"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "친환경 에너지가 주목받고 있습니다.",
            "rr": "chinhwan-gyeong eneojiga jumokbatgo isseumnida.",
            "g": "cleanEnergyPopular",
            "wrong": [
              "사회적 관심이 커지고 있습니다.",
              "새로운 기술을 도입했습니다.",
              "에너지를 아낍니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "idioms_body",
        "title": "Body-part idioms (발, 눈, 귀, 손)",
        "concept": "Common idioms with body parts: 발이 넓다 (wide network), 눈이 높다 (high standards).",
        "example": [
          [
            "김 대리는 발이 넓어요.",
            "gim daerineun bari neobeoyo.",
            "hasWideConnections"
          ],
          [
            "눈이 높아요.",
            "nuni nopayo.",
            "highStandardsChoose"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "김 대리는 발이 넓어요.",
            "rr": "gim daerineun bari neobeoyo.",
            "g": "hasWideConnections",
            "wrong": [
              "highStandardsChoose",
              "easilyInfluenced",
              "rippedOffPrice"
            ]
          },
          {
            "k": "meaning",
            "ko": "눈이 높아요.",
            "rr": "nuni nopayo.",
            "g": "highStandardsChoose",
            "wrong": [
              "hasWideConnections",
              "easilyInfluenced",
              "heavyResponsibilityBurden"
            ]
          },
          {
            "k": "toko",
            "ko": "귀가 얇아요.",
            "rr": "gwiga yalbayo.",
            "g": "easilyInfluenced",
            "wrong": [
              "김 대리는 발이 넓어요.",
              "눈이 높아요.",
              "손이 커요."
            ]
          },
          {
            "k": "tf",
            "ko": "김 대리는 발이 넓어요.",
            "rr": "gim daerineun bari neobeoyo.",
            "claim": "highStandardsChoose",
            "g": "hasWideConnections"
          },
          {
            "k": "listen",
            "ko": "눈이 높아요.",
            "rr": "nuni nopayo.",
            "wrong": [
              "김 대리는 발이 넓어요.",
              "귀가 얇아요.",
              "발이 커요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "귀가 얇아요.",
            "rr": "gwiga yalbayo.",
            "g": "easilyInfluenced",
            "wrong": [
              "hasWideConnections",
              "highStandardsChoose",
              "earHurt"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "김 대리는 발이 넓어요.",
            "rr": "gim daerineun bari neobeoyo.",
            "g": "hasWideConnections",
            "wrong": [
              "눈이 높아요.",
              "귀가 얇아요.",
              "발이 아파요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "idioms_action",
        "title": "Everyday action idioms (바가지, 어깨)",
        "concept": "Expressions for common situations: 바가지를 쓰다 (ripped off), 어깨가 무겁다 (heavy duty).",
        "example": [
          [
            "바가지를 썼어요.",
            "bagajireul sseosseoyo.",
            "rippedOffPrice"
          ],
          [
            "어깨가 무거워요.",
            "eokkaega mugeowoyo.",
            "heavyResponsibilityBurden"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "바가지를 썼어요.",
            "rr": "bagajireul sseosseoyo.",
            "g": "rippedOffPrice",
            "wrong": [
              "heavyResponsibilityBurden",
              "steppedUpToHelp",
              "boughtCheaply"
            ]
          },
          {
            "k": "meaning",
            "ko": "어깨가 무거워요.",
            "rr": "eokkaega mugeowoyo.",
            "g": "heavyResponsibilityBurden",
            "wrong": [
              "rippedOffPrice",
              "steppedUpToHelp",
              "shoulderAches"
            ]
          },
          {
            "k": "toko",
            "ko": "발 벗고 나섰어요.",
            "rr": "bal beotgo naseosseoyo.",
            "g": "steppedUpToHelp",
            "wrong": [
              "바가지를 썼어요.",
              "어깨가 무거워요.",
              "발을 씻었어요."
            ]
          },
          {
            "k": "tf",
            "ko": "바가지를 썼어요.",
            "rr": "bagajireul sseosseoyo.",
            "claim": "rippedOffPrice",
            "g": "rippedOffPrice"
          },
          {
            "k": "listen",
            "ko": "어깨가 무거워요.",
            "rr": "eokkaega mugeowoyo.",
            "wrong": [
              "바가지를 썼어요.",
              "발 벗고 나섰어요.",
              "마음이 무거워요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "발 벗고 나섰어요.",
            "rr": "bal beotgo naseosseoyo.",
            "g": "steppedUpToHelp",
            "wrong": [
              "rippedOffPrice",
              "heavyResponsibilityBurden",
              "tookOffShoes"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "바가지를 썼어요.",
            "rr": "bagajireul sseosseoyo.",
            "g": "rippedOffPrice",
            "wrong": [
              "어깨가 무거워요.",
              "발 벗고 나섰어요.",
              "그릇을 샀어요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "proverbs_life",
        "title": "Essential Korean proverbs",
        "concept": "Wisdom in proverbs: 소 잃고 외양간 고친다, 쇠뿔도 단김에 빼라.",
        "example": [
          [
            "소 잃고 외양간 고친다.",
            "so ilko oeyanggan gochinda.",
            "mendBarnAfterLosingCow"
          ],
          [
            "쇠뿔도 단김에 빼라.",
            "soeppuldo dangime ppaera.",
            "strikeWhileIronHot"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "소 잃고 외양간 고친다.",
            "rr": "so ilko oeyanggan gochinda.",
            "g": "mendBarnAfterLosingCow",
            "wrong": [
              "strikeWhileIronHot",
              "wordsTravelFarProverb",
              "twoBirdsOneStone"
            ]
          },
          {
            "k": "meaning",
            "ko": "쇠뿔도 단김에 빼라.",
            "rr": "soeppuldo dangime ppaera.",
            "g": "strikeWhileIronHot",
            "wrong": [
              "mendBarnAfterLosingCow",
              "wordsTravelFarProverb",
              "threeDaysResolve"
            ]
          },
          {
            "k": "toko",
            "ko": "발 없는 말이 천 리 간다.",
            "rr": "bal eomneun mari cheon ri ganda.",
            "g": "wordsTravelFarProverb",
            "wrong": [
              "소 잃고 외양간 고친다.",
              "쇠뿔도 단김에 빼라.",
              "말을 잘 탑니다."
            ]
          },
          {
            "k": "tf",
            "ko": "소 잃고 외양간 고친다.",
            "rr": "so ilko oeyanggan gochinda.",
            "claim": "strikeWhileIronHot",
            "g": "mendBarnAfterLosingCow"
          },
          {
            "k": "listen",
            "ko": "쇠뿔도 단김에 빼라.",
            "rr": "soeppuldo dangime ppaera.",
            "wrong": [
              "소 잃고 외양간 고친다.",
              "발 없는 말이 천 리 간다.",
              "천 리 길도 한 걸음부터."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "발 없는 말이 천 리 간다.",
            "rr": "bal eomneun mari cheon ri ganda.",
            "g": "wordsTravelFarProverb",
            "wrong": [
              "mendBarnAfterLosingCow",
              "strikeWhileIronHot",
              "horseRunsFast"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "소 잃고 외양간 고친다.",
            "rr": "so ilko oeyanggan gochinda.",
            "g": "mendBarnAfterLosingCow",
            "wrong": [
              "쇠뿔도 단김에 빼라.",
              "발 없는 말이 천 리 간다.",
              "소를 길러요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "sino_four",
        "title": "Four-character idioms (사자성어)",
        "concept": "Common four-character Chinese-derived idioms: 일석이조, 작심삼일, 다다익선.",
        "example": [
          [
            "일석이조예요.",
            "ilseogijoyeyo.",
            "twoBirdsOneStone"
          ],
          [
            "작심삼일이에요.",
            "jaksimsamirieyo.",
            "threeDaysResolve"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "일석이조예요.",
            "rr": "ilseogijoyeyo.",
            "g": "twoBirdsOneStone",
            "wrong": [
              "threeDaysResolve",
              "theMoreTheBetter",
              "empathyPutInOthersShoes"
            ]
          },
          {
            "k": "meaning",
            "ko": "작심삼일이에요.",
            "rr": "jaksimsamirieyo.",
            "g": "threeDaysResolve",
            "wrong": [
              "twoBirdsOneStone",
              "theMoreTheBetter",
              "effortPaysOff"
            ]
          },
          {
            "k": "toko",
            "ko": "다다익선이에요.",
            "rr": "dadaikseonieyo.",
            "g": "theMoreTheBetter",
            "wrong": [
              "일석이조예요.",
              "작심삼일이에요.",
              "역지사지예요."
            ]
          },
          {
            "k": "tf",
            "ko": "일석이조예요.",
            "rr": "ilseogijoyeyo.",
            "claim": "twoBirdsOneStone",
            "g": "twoBirdsOneStone"
          },
          {
            "k": "listen",
            "ko": "작심삼일이에요.",
            "rr": "jaksimsamirieyo.",
            "wrong": [
              "일석이조예요.",
              "다다익선이에요.",
              "작심했어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "다다익선이에요.",
            "rr": "dadaikseonieyo.",
            "g": "theMoreTheBetter",
            "wrong": [
              "twoBirdsOneStone",
              "threeDaysResolve",
              "goodDeed"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "일석이조예요.",
            "rr": "ilseogijoyeyo.",
            "g": "twoBirdsOneStone",
            "wrong": [
              "작심삼일이에요.",
              "다다익선이에요.",
              "두 마리 토끼."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "logic_debate",
        "title": "Logical connectors and discourse markers",
        "concept": "Formal discourse markers: -에 따르면, 한편, 요컨대, 따라서.",
        "example": [
          [
            "의견에 따르면 그렇습니다.",
            "uigyone ttareumyeon geureotsseumnida.",
            "accordingToOpinion"
          ],
          [
            "한편 다른 측면도 있습니다.",
            "hanpyeon dareun cheungmyeondo isseumnida.",
            "onOtherHandAnotherAspect"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "의견에 따르면 그렇습니다.",
            "rr": "uigyone ttareumyeon geureotsseumnida.",
            "g": "accordingToOpinion",
            "wrong": [
              "onOtherHandAnotherAspect",
              "inShortEssential",
              "thereforeConclude"
            ]
          },
          {
            "k": "meaning",
            "ko": "한편 다른 측면도 있습니다.",
            "rr": "hanpyeon dareun cheungmyeondo isseumnida.",
            "g": "onOtherHandAnotherAspect",
            "wrong": [
              "accordingToOpinion",
              "inShortEssential",
              "agreeEntirely"
            ]
          },
          {
            "k": "toko",
            "ko": "요컨대 본질이 중요합니다.",
            "rr": "yokeondae bonjiri jungyohamnida.",
            "g": "inShortEssential",
            "wrong": [
              "의견에 따르면 그렇습니다.",
              "한편 다른 측면도 있습니다.",
              "따라서 결론입니다."
            ]
          },
          {
            "k": "tf",
            "ko": "의견에 따르면 그렇습니다.",
            "rr": "uigyone ttareumyeon geureotsseumnida.",
            "claim": "onOtherHandAnotherAspect",
            "g": "accordingToOpinion"
          },
          {
            "k": "listen",
            "ko": "한편 다른 측면도 있습니다.",
            "rr": "hanpyeon dareun cheungmyeondo isseumnida.",
            "wrong": [
              "의견에 따르면 그렇습니다.",
              "요컨대 본질이 중요합니다.",
              "반면에 그렇습니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "요컨대 본질이 중요합니다.",
            "rr": "yokeondae bonjiri jungyohamnida.",
            "g": "inShortEssential",
            "wrong": [
              "accordingToOpinion",
              "onOtherHandAnotherAspect",
              "importantDetail"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "의견에 따르면 그렇습니다.",
            "rr": "uigyone ttareumyeon geureotsseumnida.",
            "g": "accordingToOpinion",
            "wrong": [
              "한편 다른 측면도 있습니다.",
              "요컨대 본질이 중요합니다.",
              "따라서 중요합니다."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "culture_deep",
        "title": "Deep Korean cultural values and customs",
        "concept": "Cultural concepts and holiday traditions: 따뜻한 정, 송편을 빚다.",
        "example": [
          [
            "따뜻한 정이 있어요.",
            "ttatteutan jeongi isseoyo.",
            "warmJeongAffection"
          ],
          [
            "송편을 빚어요.",
            "songpyeoneul bijeoyo.",
            "makeSongpyeonChuseok"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "따뜻한 정이 있어요.",
            "rr": "ttatteutan jeongi isseoyo.",
            "g": "warmJeongAffection",
            "wrong": [
              "makeSongpyeonChuseok",
              "shareFoodNeighbors",
              "cleanEnvironment"
            ]
          },
          {
            "k": "meaning",
            "ko": "송편을 빚어요.",
            "rr": "songpyeoneul bijeoyo.",
            "g": "makeSongpyeonChuseok",
            "wrong": [
              "warmJeongAffection",
              "shareFoodNeighbors",
              "eatTteokgukNewYear"
            ]
          },
          {
            "k": "toko",
            "ko": "음식을 나눠 먹어요.",
            "rr": "eumsigeul nanwo meogeoyo.",
            "g": "shareFoodNeighbors",
            "wrong": [
              "따뜻한 정이 있어요.",
              "송편을 빚어요.",
              "음식을 요리해요."
            ]
          },
          {
            "k": "tf",
            "ko": "따뜻한 정이 있어요.",
            "rr": "ttatteutan jeongi isseoyo.",
            "claim": "warmJeongAffection",
            "g": "warmJeongAffection"
          },
          {
            "k": "listen",
            "ko": "송편을 빚어요.",
            "rr": "songpyeoneul bijeoyo.",
            "wrong": [
              "따뜻한 정이 있어요.",
              "음식을 나눠 먹어요.",
              "떡을 샀어요."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "음식을 나눠 먹어요.",
            "rr": "eumsigeul nanwo meogeoyo.",
            "g": "shareFoodNeighbors",
            "wrong": [
              "warmJeongAffection",
              "makeSongpyeonChuseok",
              "eatAlone"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "따뜻한 정이 있어요.",
            "rr": "ttatteutan jeongi isseoyo.",
            "g": "warmJeongAffection",
            "wrong": [
              "송편을 빚어요.",
              "음식을 나눠 먹어요.",
              "정이 많아요."
            ],
            "variant": true
          }
        ]
      },
      {
        "skill": "review_k10",
        "title": "K10 Comprehensive Review",
        "concept": "Mastery of Korean culture, media, idioms and formal debate expressions.",
        "example": [
          [
            "일석이조의 효과를 거두었어요.",
            "ilseogijoui hyogwareul geoduosseoyo.",
            "achievedTwoBirdsEffect"
          ],
          [
            "상호 이해를 바탕으로 협력해요.",
            "sangho ihaereul batangeuro hyeomnyeokaeyo.",
            "cooperateBasedOnMutualUnderstanding"
          ]
        ],
        "items": [
          {
            "k": "meaning",
            "ko": "일석이조의 효과를 거두었어요.",
            "rr": "ilseogijoui hyogwareul geoduosseoyo.",
            "g": "achievedTwoBirdsEffect",
            "wrong": [
              "cooperateBasedOnMutualUnderstanding",
              "announcedPriceMeasures",
              "hasWideConnections"
            ]
          },
          {
            "k": "meaning",
            "ko": "상호 이해를 바탕으로 협력해요.",
            "rr": "sangho ihaereul batangeuro hyeomnyeokaeyo.",
            "g": "cooperateBasedOnMutualUnderstanding",
            "wrong": [
              "achievedTwoBirdsEffect",
              "cleanEnergyPopular",
              "mendBarnAfterLosingCow"
            ]
          },
          {
            "k": "toko",
            "ko": "따뜻한 정이 있어요.",
            "rr": "ttatteutan jeongi isseoyo.",
            "g": "warmJeongAffection",
            "wrong": [
              "일석이조의 효과를 거두었어요.",
              "상호 이해를 바탕으로 협력해요.",
              "효과가 있습니다."
            ]
          },
          {
            "k": "tf",
            "ko": "일석이조의 효과를 거두었어요.",
            "rr": "ilseogijoui hyogwareul geoduosseoyo.",
            "claim": "cooperateBasedOnMutualUnderstanding",
            "g": "achievedTwoBirdsEffect"
          },
          {
            "k": "listen",
            "ko": "상호 이해를 바탕으로 협력해요.",
            "rr": "sangho ihaereul batangeuro hyeomnyeokaeyo.",
            "wrong": [
              "일석이조의 효과를 거두었어요.",
              "따뜻한 정이 있어요.",
              "협력하지 않습니다."
            ],
            "challenge": true
          },
          {
            "k": "meaning",
            "ko": "따뜻한 정이 있어요.",
            "rr": "ttatteutan jeongi isseoyo.",
            "g": "warmJeongAffection",
            "wrong": [
              "achievedTwoBirdsEffect",
              "cooperateBasedOnMutualUnderstanding",
              "relationshipEnded"
            ],
            "variant": true
          },
          {
            "k": "toko",
            "ko": "일석이조의 효과를 거두었어요.",
            "rr": "ilseogijoui hyogwareul geoduosseoyo.",
            "g": "achievedTwoBirdsEffect",
            "wrong": [
              "상호 이해를 바탕으로 협력해요.",
              "따뜻한 정이 있어요.",
              "일석이조입니다."
            ],
            "variant": true
          }
        ]
      }
    ],
    "diagnostic": [
      {
        "k": "meaning",
        "ko": "물가 안정 대책을 발표했습니다.",
        "rr": "mulga anjeong daechaegeul balpyohaesseumnida.",
        "g": "announcedPriceMeasures",
        "wrong": [
          "cleanEnergyPopular",
          "hasWideConnections",
          "mendBarnAfterLosingCow"
        ]
      },
      {
        "k": "meaning",
        "ko": "일석이조예요.",
        "rr": "ilseogijoyeyo.",
        "g": "twoBirdsOneStone",
        "wrong": [
          "rippedOffPrice",
          "accordingToOpinion",
          "warmJeongAffection"
        ]
      }
    ]
  }
];

export const INTERMEDIATE_EXAMPLES = {
  "K7.indirect_state": [
    [
      "친구가 온다고 해요.",
      "chinguga ondago haeyo.",
      "friendSaidComing"
    ]
  ],
  "K7.indirect_ask": [
    [
      "어디 가냐고 물었어요.",
      "eodi ganyago mureosseoyo.",
      "askedWhereGoing"
    ]
  ],
  "K7.indirect_cmd": [
    [
      "빨리 오라고 했어요.",
      "ppalli orago haesseoyo.",
      "toldToComeFast"
    ],
    [
      "같이 가자고 했어요.",
      "gachi gajago haesseoyo.",
      "suggestedGoTogether"
    ]
  ],
  "K7.cause_contrast": [
    [
      "공부하느라고 바빴어요.",
      "gongbuhaneurago bapasseoyo.",
      "busyStudying"
    ],
    [
      "비가 오는데도 갔어요.",
      "biga oneundedo gasseoyo.",
      "wentDespiteRain"
    ]
  ],
  "K7.proportion": [
    [
      "만날수록 좋아요.",
      "mannalsurok joayo.",
      "betterAsWeMeet"
    ],
    [
      "사람은 실수하기 마련이에요.",
      "sarameun silsuhagi maryeonieyo.",
      "boundToMakeMistakes"
    ]
  ],
  "K7.appearance": [
    [
      "행복해 보여요.",
      "haengbokae boyeoyo.",
      "looksHappy"
    ],
    [
      "비가 오는 모양이에요.",
      "biga oneun moyangieyo.",
      "seemsRaining"
    ]
  ],
  "K7.pretense": [
    [
      "아는 척해요.",
      "aneun cheokaeyo.",
      "pretendsToKnow"
    ]
  ],
  "K7.regret": [
    [
      "일찍 올 걸 그랬어요.",
      "iljjik ol geol geuraesseoyo.",
      "shouldHaveComeEarly"
    ]
  ],
  "K7.review_k7": [
    [
      "친구가 온다고 했어요.",
      "chinguga ondago haesseoyo.",
      "friendSaidComing"
    ],
    [
      "같이 밥 먹자고 했어요.",
      "gachi bap meokjago haesseoyo.",
      "suggestedEatTogether"
    ]
  ],
  "K8.honorific_subj": [
    [
      "할머니께서 진지를 드세요.",
      "halmeonikkeseo jinjireul deuseyo.",
      "grandmotherEatsMeal"
    ]
  ],
  "K8.honorific_obj": [
    [
      "선물을 드려요.",
      "seonmureul deuryeoyo.",
      "giveGiftHonorific"
    ],
    [
      "내일 봬요.",
      "naeil bwaeyo.",
      "seeTomorrowHonorific"
    ]
  ],
  "K8.passive_affix": [
    [
      "문이 열려요.",
      "muni yeollyeoyo.",
      "doorOpens"
    ],
    [
      "창문이 닫혀요.",
      "changmuni dachyeoyo.",
      "windowCloses"
    ]
  ],
  "K8.passive_compound": [
    [
      "글씨가 써져요.",
      "geulssiga sseojyeoyo.",
      "letterWrittenWell"
    ],
    [
      "알게 되었어요.",
      "alge doeeosseoyo.",
      "cameToKnow"
    ]
  ],
  "K8.causative_affix": [
    [
      "사진을 보여 줘요.",
      "sajineul boyeo jwoyo.",
      "showsPhoto"
    ],
    [
      "아기에게 밥을 먹여요.",
      "agiege babeul meogyeoyo.",
      "feedsBaby"
    ]
  ],
  "K8.causative_compound": [
    [
      "웃게 해요.",
      "utge haeyo.",
      "makesLaugh"
    ],
    [
      "기다리게 했어요.",
      "gidarige haesseoyo.",
      "madeWait"
    ]
  ],
  "K8.formal_style": [
    [
      "자리에 앉으십시오.",
      "jarie anjeusipsio.",
      "pleaseBeSeated"
    ],
    [
      "출발하십시다.",
      "chulbalhasipsida.",
      "letUsDepart"
    ]
  ],
  "K8.modesty": [
    [
      "인사 말씀 올립니다.",
      "insa malsseum ollimnida.",
      "offerGreetingWords"
    ],
    [
      "저희 학교입니다.",
      "jeohui hakgyoimnida.",
      "ourSchoolHumble"
    ]
  ],
  "K8.review_k8": [
    [
      "할머니께 선물을 드렸어요.",
      "halmeonikke seonmureul deuryeosseoyo.",
      "gaveGiftToGrandmother"
    ],
    [
      "문이 저절로 닫혔어요.",
      "muni jeojeollo dachyeosseoyo.",
      "doorClosedByItself"
    ]
  ],
  "K9.biz_email": [
    [
      "회의 안건에 관하여 말씀드립니다.",
      "hoeui angeone gwanhayeo malsseumdeurimnida.",
      "regardingMeetingAgenda"
    ]
  ],
  "K9.biz_phone": [
    [
      "지금 통화 가능하신지요?",
      "jigeum tonghwa ganeunghasinjiyo?",
      "availableToSpeakNow"
    ],
    [
      "담당자를 연결해 드리겠습니다.",
      "damdangjareul yeongyeolhae deurigetseumnida.",
      "connectingPersonInCharge"
    ]
  ],
  "K9.biz_schedule": [
    [
      "일정을 변경하고자 합니다.",
      "iljeongeul byeongyeonghagoja hamnida.",
      "scheduleChangeRequest"
    ],
    [
      "너른 양해 부탁드립니다.",
      "neoreun yanghae butakdeurimnida.",
      "askKindUnderstanding"
    ]
  ],
  "K9.biz_meeting": [
    [
      "제 생각으로는 이번 안이 좋습니다.",
      "je saenggakeoroneun ibeon ani jotseumnida.",
      "inMyOpinionProposalGood"
    ],
    [
      "적극 찬성합니다.",
      "jeokgeuk chanseonghamnida.",
      "stronglyAgree"
    ]
  ],
  "K9.biz_report": [
    [
      "프로젝트 진행 상황을 보고합니다.",
      "peurojekteu jinhaeng sanghwangeul bogohamnida.",
      "reportingProjectProgress"
    ],
    [
      "조치를 완료했습니다.",
      "jochireul wallyohaesseumnida.",
      "completedAction"
    ]
  ],
  "K9.biz_stats": [
    [
      "매출이 증가했습니다.",
      "maechuri jeunggahaesseumnida.",
      "salesIncreased"
    ],
    [
      "전년 대비 상승했습니다.",
      "jeonnyeon daebi sangseunghaesseumnida.",
      "increasedComparedToLastYear"
    ]
  ],
  "K9.biz_negotiate": [
    [
      "상호 협력을 희망합니다.",
      "sangho hyeomnyeogeul huimanghamnida.",
      "hopeMutualCooperation"
    ],
    [
      "절충안을 제안합니다.",
      "jeolchuganeul jeanhamnida.",
      "proposeCompromise"
    ]
  ],
  "K9.biz_etiquette": [
    [
      "처음 뵙겠습니다, 명함 드립니다.",
      "cheoeum boepgetseumnida, myeongham deurimnida.",
      "pleasedToMeetCard"
    ],
    [
      "김 부장님입니다.",
      "gim bujangnimimnida.",
      "departmentManagerKim"
    ]
  ],
  "K9.review_k9": [
    [
      "안건을 검토해 주시기 바랍니다.",
      "angeoneul geomtohae jusigi baramnida.",
      "pleaseReviewAgenda"
    ],
    [
      "회의에서 뵙겠습니다.",
      "hoeuieseo boepgetseumnida.",
      "seeYouAtMeeting"
    ]
  ],
  "K10.media_headline": [
    [
      "물가 안정 대책을 발표했습니다.",
      "mulga anjeong daechaegeul balpyohaesseumnida.",
      "announcedPriceMeasures"
    ]
  ],
  "K10.media_article": [
    [
      "친환경 에너지가 주목받고 있습니다.",
      "chinhwan-gyeong eneojiga jumokbatgo isseumnida.",
      "cleanEnergyPopular"
    ]
  ],
  "K10.idioms_body": [
    [
      "김 대리는 발이 넓어요.",
      "gim daerineun bari neobeoyo.",
      "hasWideConnections"
    ],
    [
      "눈이 높아요.",
      "nuni nopayo.",
      "highStandardsChoose"
    ]
  ],
  "K10.idioms_action": [
    [
      "바가지를 썼어요.",
      "bagajireul sseosseoyo.",
      "rippedOffPrice"
    ],
    [
      "어깨가 무거워요.",
      "eokkaega mugeowoyo.",
      "heavyResponsibilityBurden"
    ]
  ],
  "K10.proverbs_life": [
    [
      "소 잃고 외양간 고친다.",
      "so ilko oeyanggan gochinda.",
      "mendBarnAfterLosingCow"
    ],
    [
      "쇠뿔도 단김에 빼라.",
      "soeppuldo dangime ppaera.",
      "strikeWhileIronHot"
    ]
  ],
  "K10.sino_four": [
    [
      "일석이조예요.",
      "ilseogijoyeyo.",
      "twoBirdsOneStone"
    ],
    [
      "작심삼일이에요.",
      "jaksimsamirieyo.",
      "threeDaysResolve"
    ]
  ],
  "K10.logic_debate": [
    [
      "의견에 따르면 그렇습니다.",
      "uigyone ttareumyeon geureotsseumnida.",
      "accordingToOpinion"
    ],
    [
      "한편 다른 측면도 있습니다.",
      "hanpyeon dareun cheungmyeondo isseumnida.",
      "onOtherHandAnotherAspect"
    ]
  ],
  "K10.culture_deep": [
    [
      "따뜻한 정이 있어요.",
      "ttatteutan jeongi isseoyo.",
      "warmJeongAffection"
    ],
    [
      "송편을 빚어요.",
      "songpyeoneul bijeoyo.",
      "makeSongpyeonChuseok"
    ]
  ],
  "K10.review_k10": [
    [
      "일석이조의 효과를 거두었어요.",
      "ilseogijoui hyogwareul geoduosseoyo.",
      "achievedTwoBirdsEffect"
    ],
    [
      "상호 이해를 바탕으로 협력해요.",
      "sangho ihaereul batangeuro hyeomnyeokaeyo.",
      "cooperateBasedOnMutualUnderstanding"
    ]
  ]
};
