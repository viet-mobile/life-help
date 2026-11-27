import React from "react";

export type KoreanPatternType =
  | "giwa" // 1. 한국 전통 기와무늬 (한글 정원 / 훈민정음)
  | "dancheong" // 2. 단청무늬 (첫인사 항구)
  | "jogakbo" // 3. 한복 조각보/색동무늬 (가족 마을)
  | "bitsal" // 4. 전통 빗살무늬 (일상 마을)
  | "unmun" // 5. 궁중 구름무늬 (시간 정거장)
  | "changsal" // 6. 전통 창살무늬 (서울 거리)
  | "yeohwa" // 7. 연꽃 화훼문 (화법 정원)
  | "cheonghaepa" // 8. 전통 청해파 물결무늬 (예절의 강)
  | "neunghwapan" // 9. 전통 능화판/수묵 격자문 (오피스 타워)
  | "dangcho" // 10. 전통 당초·송림무늬 (문화의 숲)
  | "hanbok-silk" // 11. 한복 비단 자수/금박 마름모무늬 (19대 실전 상황 회화)
  | "hunminjeongeum"; // 12. 훈민정음 혜례본 서문 원문 (한국어 표준어 규정 전체)

interface KoreanTraditionalPatternProps {
  type: KoreanPatternType;
  className?: string;
}

export function KoreanTraditionalPattern({ type, className = "" }: KoreanTraditionalPatternProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none transition-opacity duration-300 ${className}`}
      aria-hidden="true"
    >
      {type === "giwa" && (
        /* 1. 기와무늬: 한옥 처마 암키와·수키와의 겹침 곡선 */
        <svg className="w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-giwa" width="60" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0,20 Q15,4 30,20 Q45,36 60,20 M-15,40 Q0,24 15,40 Q30,56 45,40 Q60,24 75,40 M-15,0 Q0,-16 15,0 Q30,16 45,0 Q60,-16 75,0"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M15,20 A15,10 0 0,0 45,20"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-giwa)" />
        </svg>
      )}

      {type === "dancheong" && (
        /* 2. 단청무늬: 고궁·사찰의 연화 머리초 및 꽃살 문양 */
        <svg className="w-full h-full opacity-16" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-dancheong" width="64" height="64" patternUnits="userSpaceOnUse">
              <circle cx="32" cy="32" r="16" fill="none" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="32" cy="32" r="8" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" />
              <path
                d="M32,16 Q40,24 48,32 Q40,40 32,48 Q24,40 16,32 Q24,24 32,16 Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
              <path
                d="M32,4 L32,60 M4,32 L60,32 M12,12 L52,52 M12,52 L52,12"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeDasharray="2,4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-dancheong)" />
        </svg>
      )}

      {type === "jogakbo" && (
        /* 3. 한복 조각보/색동무늬: 조선 여인의 정성과 지혜가 담긴 기하학 분할선 */
        <svg className="w-full h-full opacity-14" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-jogakbo" width="70" height="70" patternUnits="userSpaceOnUse">
              <line x1="0" y1="24" x2="70" y2="24" stroke="#ffffff" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="28" y1="0" x2="28" y2="70" stroke="#ffffff" strokeWidth="1" strokeDasharray="3,3" />
              <rect x="28" y="24" width="42" height="46" fill="#ffffff" fillOpacity="0.06" />
              <rect x="0" y="0" width="28" height="24" fill="#ffffff" fillOpacity="0.08" />
              <line x1="0" y1="0" x2="28" y2="24" stroke="#ffffff" strokeWidth="0.8" />
              <line x1="28" y1="70" x2="70" y2="24" stroke="#ffffff" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-jogakbo)" />
        </svg>
      )}

      {type === "bitsal" && (
        /* 4. 빗살무늬: 전통 토기 및 대나무 살의 단아한 결 */
        <svg className="w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-bitsal" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0,20 L20,0 L40,20 L20,40 Z M10,10 L30,30 M10,30 L30,10"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-bitsal)" />
        </svg>
      )}

      {type === "unmun" && (
        /* 5. 궁중 구름무늬 (운문): 십장생도에 흐르는 상서로운 여의두문 구름 */
        <svg className="w-full h-full opacity-18" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-unmun" width="80" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M10,25 C10,18 20,15 28,20 C34,14 46,14 52,20 C60,15 70,18 70,25 C70,32 58,35 50,30 C44,36 32,36 26,30 C18,35 10,32 10,25 Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.3"
              />
              <path
                d="M50,30 C60,30 68,36 72,44 M26,30 C16,30 8,36 4,44"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-unmun)" />
        </svg>
      )}

      {type === "changsal" && (
        /* 6. 전통 창살무늬: 한옥의 아자창(亞字窓)과 완자살의 정갈한 선 */
        <svg className="w-full h-full opacity-16" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-changsal" width="48" height="48" patternUnits="userSpaceOnUse">
              <rect x="4" y="4" width="40" height="40" fill="none" stroke="#ffffff" strokeWidth="1" />
              <path
                d="M16,4 L16,44 M32,4 L32,44 M4,16 L44,16 M4,32 L44,32"
                stroke="#ffffff"
                strokeWidth="0.8"
              />
              <rect x="16" y="16" width="16" height="16" fill="#ffffff" fillOpacity="0.08" stroke="#ffffff" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-changsal)" />
        </svg>
      )}

      {type === "yeohwa" && (
        /* 7. 연꽃 화훼문: 순백과 단아함을 상징하는 전통 연화문 */
        <svg className="w-full h-full opacity-16" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-yeohwa" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="5" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeWidth="1" />
              <path
                d="M30,12 C34,20 34,22 30,25 C26,22 26,20 30,12 Z
                   M30,48 C34,40 34,38 30,35 C26,38 26,40 30,48 Z
                   M12,30 C20,34 22,34 25,30 C22,26 20,26 12,30 Z
                   M48,30 C40,34 38,34 35,30 C38,26 40,26 48,30 Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
              <circle cx="30" cy="30" r="22" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3,3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-yeohwa)" />
        </svg>
      )}

      {type === "cheonghaepa" && (
        /* 8. 청해파 물결무늬: 한강과 동해의 굽이치는 파도와 영원성 */
        <svg className="w-full h-full opacity-16" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-cheonghaepa" width="50" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M0,15 A12,12 0 0,1 24,15 A12,12 0 0,1 48,15 M-12,30 A12,12 0 0,1 12,30 A12,12 0 0,1 36,30 A12,12 0 0,1 60,30 M-12,0 A12,12 0 0,1 12,0 A12,12 0 0,1 36,0 A12,12 0 0,1 60,0"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
              <path
                d="M0,15 A6,6 0 0,1 12,15 M24,15 A6,6 0 0,1 36,15"
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeDasharray="2,2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-cheonghaepa)" />
        </svg>
      )}

      {type === "neunghwapan" && (
        /* 9. 능화판 무늬: 고서 표지에 음각으로 찍어내던 조선의 기하학 마름모문 */
        <svg className="w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-neunghwa" width="44" height="44" patternUnits="userSpaceOnUse">
              <polygon points="22,2 42,22 22,42 2,22" fill="none" stroke="#ffffff" strokeWidth="1.2" />
              <polygon points="22,10 34,22 22,34 10,22" fill="#ffffff" fillOpacity="0.08" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="22" cy="22" r="3" fill="#ffffff" fillOpacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-neunghwa)" />
        </svg>
      )}

      {type === "dangcho" && (
        /* 10. 전통 당초무늬: 끈기 있게 뻗어나가는 인동덩굴의 우아한 곡선 */
        <svg className="w-full h-full opacity-17" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-dangcho" width="70" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M0,25 C15,5 25,45 40,25 C55,5 65,45 80,25"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.3"
              />
              <path
                d="M15,18 C22,10 26,16 20,22 C14,28 8,24 15,18 Z
                   M45,32 C52,40 56,34 50,28 C44,22 38,26 45,32 Z"
                fill="#ffffff"
                fillOpacity="0.1"
                stroke="#ffffff"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-dangcho)" />
        </svg>
      )}

      {type === "hanbok-silk" && (
        /* 11. 한복 비단 무늬: 전통 비단 옷감의 고운 화문단(花紋緞) 금박 문양 */
        <svg className="w-full h-full opacity-16" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-hanbok" width="56" height="56" patternUnits="userSpaceOnUse">
              <rect x="8" y="8" width="40" height="40" rx="4" transform="rotate(45 28 28)" fill="none" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="28" cy="28" r="8" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeWidth="1" />
              <circle cx="28" cy="28" r="3" fill="#ffffff" fillOpacity="0.3" />
              <path
                d="M0,28 L14,28 M42,28 L56,28 M28,0 L28,14 M28,42 L28,56"
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="2,3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-hanbok)" />
        </svg>
      )}

      {type === "hunminjeongeum" && (
        /* 12. 훈민정음 혜례본 서문 원문 무늬: 세종대왕 어제 훈민정음 원문 캘리그래피 워터마크 */
        <div className="absolute inset-0 flex items-center justify-end pr-2 overflow-hidden pointer-events-none opacity-20">
          <div
            className="text-right text-[13px] sm:text-[14px] leading-[1.65] font-serif text-white tracking-widest whitespace-pre-line select-none [writing-mode:vertical-rl] max-h-full py-2"
            style={{
              fontFamily: '"Nanum Myeongjo", "Batang", "Noto Serif KR", serif',
              textShadow: "0 0 1px rgba(255,255,255,0.4)",
            }}
          >
            {`나랏말ᄊᆞ미 듕귁에 달아
문ᄍᆞ와로 서ᄅᆞ ᄉᆞᄆᆞᆺ디 아니ᄒᆞᆯᄊᆡ
이런 젼ᄎᆞ로 어린 백셔ᇰ이 니르고져 호ᇙ 배 이셔도
ᄆᆞᄎᆞᆷ내 제 ᄠᅳ들 시러 펴디 못ᄒᆞᇙ 노미 하니라
내 이ᄅᆞᆯ 위ᄒᆞ야 어엿비 너겨 새로 스믈여듧 자ᄅᆞᆯ ᄆᆡᇰᄀᆞ노니
사람마다 ᄒᆡᅇᅧ 수ᄫᅵ 니겨 날로 ᄡᅮ메 뼤안킈 ᄒᆞ고자 ᄒᆞᇙ ᄯᆞᄅᆞᄆᆡ니라`}
          </div>
        </div>
      )}
    </div>
  );
}
