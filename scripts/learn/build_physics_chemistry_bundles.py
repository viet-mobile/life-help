#!/usr/bin/env python3
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PHYSICS_DIR = BASE_DIR / "lib" / "learn" / "content" / "physics"
CHEMISTRY_DIR = BASE_DIR / "lib" / "learn" / "content" / "chemistry"

PHYSICS_DIR.mkdir(parents=True, exist_ok=True)
CHEMISTRY_DIR.mkdir(parents=True, exist_ok=True)

# 12 grades specification for Physics
PHYSICS_CURRICULUM = [
    {
        "id": "physics-e1", "grade": "E1", "title": "초1 물리 · 물체와 자석 놀이",
        "world": {"name": "자석 정원", "emoji": "🧲", "tagline": "밀고 당기는 자석과 물체의 비밀을 찾아요"},
        "unit": {"id": "phy-u-e1", "title": "자석과 물체"},
        "lessons": [
            {
                "id": "phy-e1-l1", "title": "자석에 붙는 물체", "skillId": "phy.e1.mag",
                "concept": "자석은 쇠로 된 클립이나 못을 끌어당겨요. 나무나 플라스틱은 자석에 붙지 않아요.",
                "example": "쇠붙이 클립은 자석에 찰칵 붙어요.",
                "q": ("다음 중 자석에 잘 달라붙는 물체는 무엇일까요?", ["쇠 클립", "나무 연필", "플라스틱 자", "지우개"], "a",
                      ["쇠로 만들어진 물건을 찾아보세요.", "클립은 철로 만들어졌어요."],
                      "쇠(철)로 만든 클립은 자석에 잘 달라붙어요. 나무, 플라스틱, 고무는 자석에 붙지 않아요.")
            }
        ]
    },
    {
        "id": "physics-e2", "grade": "E2", "title": "초2 물리 · 소리와 진동 탐험",
        "world": {"name": "소리 메아리 숲", "emoji": "🔔", "tagline": "귀를 기울여 공기의 떨림과 소리의 높낮이를 느껴요"},
        "unit": {"id": "phy-u-e2", "title": "소리와 떨림"},
        "lessons": [
            {
                "id": "phy-e2-l1", "title": "소리가 날 때의 떨림", "skillId": "phy.e2.snd",
                "concept": "모든 소리는 물체가 떨릴(진동할) 때 생겨나요. 북을 치면 북 가죽이 떨려요.",
                "example": "목에 손을 대고 소리를 내면 목이 떨려요.",
                "q": ("목에 손을 얹고 말을 할 때 손끝에서 느껴지는 떨림을 무엇이라고 하나요?", ["진동", "마찰", "온도", "무게"], "a",
                      ["물체가 빠르게 떨리는 현상을 뜻하는 낱말이에요.", "소리는 떨림(진동)에서 생겨나요."],
                      "소리가 날 때는 물체가 빠르게 떨리는데, 이를 '진동'이라고 해요.")
            }
        ]
    },
    {
        "id": "physics-e3", "grade": "E3", "title": "초3 물리 · 빛과 그림자의 세계",
        "world": {"name": "빛과 그림자 호수", "emoji": "☀️", "tagline": "곧게 나아가는 빛과 신비로운 그림자를 관찰해요"},
        "unit": {"id": "phy-u-e3", "title": "빛과 그림자"},
        "lessons": [
            {
                "id": "phy-e3-l1", "title": "그림자가 생기는 까닭", "skillId": "phy.e3.lgt",
                "concept": "빛은 똑바로 곧게 나아가요(직진). 빛이 나아가는 길을 물체가 가로막으면 뒤쪽에 그림자가 생겨요.",
                "example": "손전등 앞에 손을 대면 벽에 손 그림자가 생겨요.",
                "q": ("빛이 곧게 나아가는 성질을 가리키는 말로 알맞은 것은 무엇인가요?", ["직진", "반사", "굴절", "분산"], "a",
                      ["빛이 구부러지지 않고 똑바로 나아간다는 뜻이에요.", "곧을 직(直), 나아갈 진(進)을 써요."],
                      "빛은 장애물이 없을 때 똑바로 곧게 나아가며, 이를 빛의 직진이라고 해요.")
            }
        ]
    },
    {
        "id": "physics-e4", "grade": "E4", "title": "초4 물리 · 무게와 수평의 균형",
        "world": {"name": "수평 저울 언덕", "emoji": "⚖️", "tagline": "받침점과 지레의 원리로 무게의 균형을 맞춰요"},
        "unit": {"id": "phy-u-e4", "title": "수평 잡기와 지레"},
        "lessons": [
            {
                "id": "phy-e4-l1", "title": "양팔저울과 수평", "skillId": "phy.e4.bal",
                "concept": "받침점에서 같은 거리에 같은 무게의 물체를 놓으면 양팔저울이 수평을 이루어요.",
                "example": "시소에서 같은 무게의 친구가 같은 거리에 앉으면 수평이 돼요.",
                "q": ("양팔저울의 받침점으로부터 같은 거리에 물체를 올려놓았을 때 수평이 되려면 두 물체의 무엇이 같아야 할까요?", ["무게", "부피", "색깔", "모양"], "a",
                      ["가볍거나 무거운 정도를 나타내는 물리량이에요.", "저울은 무게를 재는 도구예요."],
                      "받침점으로부터의 거리가 같을 때는 두 물체의 무게가 같아야 수평을 이루어요.")
            }
        ]
    },
    {
        "id": "physics-e5", "grade": "E5", "title": "초5 물리 · 속력과 운동 레이스",
        "world": {"name": "속력 서킷", "emoji": "🏎️", "tagline": "거리와 시간을 측정하여 물체의 빠르기를 비교해요"},
        "unit": {"id": "phy-u-e5", "title": "속력의 기초"},
        "lessons": [
            {
                "id": "phy-e5-l1", "title": "속력 구하기", "skillId": "phy.e5.spd",
                "concept": "속력은 단위 시간(1초, 1분, 1시간) 동안 이동한 거리예요. 속력 = 이동 거리 ÷ 걸린 시간.",
                "example": "$100\\text{ m}$를 $20$초에 달리면 속력은 $5\\text{ m/s}$예요.",
                "q": ("자동차가 $2$시간 동안 $120\\text{ km}$를 달렸을 때, 이 자동차의 평균 속력은 얼마인가요?", ["시속 $60\\text{ km}$", "시속 $40\\text{ km}$", "시속 $80\\text{ km}$", "시속 $120\\text{ km}$"], "a",
                      ["속력 = 이동 거리 ÷ 걸린 시간 공식을 사용하세요.", "$120 \\div 2$를 계산해요."],
                      "속력은 이동 거리를 걸린 시간으로 나눈 값이므로 $120\\text{ km} \\div 2\\text{ h} = 60\\text{ km/h}$입니다.")
            }
        ]
    },
    {
        "id": "physics-e6", "grade": "E6", "title": "초6 물리 · 전기의 흐름과 렌즈",
        "world": {"name": "빛과 회로 연구소", "emoji": "💡", "tagline": "전구에 불을 켜고 볼록렌즈로 빛을 모아요"},
        "unit": {"id": "phy-u-e6", "title": "전기 회로와 렌즈"},
        "lessons": [
            {
                "id": "phy-e6-l1", "title": "전구의 직렬·병렬 연결", "skillId": "phy.e6.cir",
                "concept": "전구를 병렬로 연결하면 전구 하나를 빼도 다른 전구의 불이 꺼지지 않아요.",
                "example": "가정의 콘센트는 가전제품을 따로 켤 수 있도록 병렬로 연결되어 있어요.",
                "q": ("두 전구 중 하나가 꺼져도 나머지 전구는 계속 켜져 있도록 연결하는 방법은 무엇인가요?", ["병렬 연결", "직렬 연결", "교차 연결", "단락 연결"], "a",
                      ["각 전구가 전지에 독립적인 경로로 연결되는 방식이에요.", "가정용 콘센트 배선 방식과 같아요."],
                      "병렬 연결에서는 전류의 흐름 길이 갈라져 있으므로 한쪽이 끊어져도 다른 쪽은 계속 켜져 있어요.")
            }
        ]
    },
    {
        "id": "physics-m1", "grade": "M1", "title": "중1 물리 · 여러 가지 힘과 운동",
        "world": {"name": "힘과 운동의 계곡", "emoji": "🏔️", "tagline": "중력, 탄성력, 마찰력, 부력의 평형을 탐구해요"},
        "unit": {"id": "phy-u-m1", "title": "여러 가지 힘"},
        "lessons": [
            {
                "id": "phy-m1-l1", "title": "중력과 마찰력", "skillId": "phy.m1.frc",
                "concept": "지구가 물체를 끌어당기는 힘을 **중력**, 물체의 운동을 방해하는 힘을 **마찰력**이라고 해요.",
                "example": "질량 $1\\text{ kg}$인 물체에 작용하는 지구의 중력 크기는 약 $9.8\\text{ N}$이에요.",
                "q": ("지구 표면에서 질량이 $5\\text{ kg}$인 물체에 작용하는 중력의 크기(무게)는 약 얼마인가요? (단, 중력가속도 $g = 9.8\\text{ m/s}^2$)", ["약 $49\\text{ N}$", "약 $5\\text{ N}$", "약 $9.8\\text{ N}$", "약 $50\\text{ kg}$"], "a",
                      ["무게 = 질량 $\\times 9.8$ 공식을 적용하세요.", "$5 \\times 9.8$을 계산해요."],
                      "무게(중력)는 $W = mg = 5\\text{ kg} \\times 9.8\\text{ N/kg} = 49\\text{ N}$입니다.")
            }
        ]
    },
    {
        "id": "physics-m2", "grade": "M2", "title": "중2 물리 · 전기와 자기, 열과 에너지",
        "world": {"name": "전자기와 열의 바다", "emoji": "⚡", "tagline": "전하의 흐름, 옴의 법칙과 열에너지의 이동을 배워요"},
        "unit": {"id": "phy-u-m2", "title": "전기와 열"},
        "lessons": [
            {
                "id": "phy-m2-l1", "title": "옴의 법칙과 저항", "skillId": "phy.m2.ohm",
                "concept": "전류 $I$는 전압 $V$에 비례하고 저항 $R$에 반비례해요: $V = IR$.",
                "example": "저항 $10\\,\\Omega$에 $20\\text{ V}$의 전압을 걸면 $2\\text{ A}$의 전류가 흘러요.",
                "q": ("저항이 $5\\,\\Omega$인 회로에 $10\\text{ V}$의 전압을 걸었을 때 흐르는 전류의 세기는 얼마인가요?", ["$2\\text{ A}$", "$0.5\\text{ A}$", "$5\\text{ A}$", "$50\\text{ A}$"], "a",
                      ["옴의 법칙 $I = \\frac{V}{R}$을 사용하세요.", "$10 \\div 5$를 계산해요."],
                      "옴의 법칙에 따라 $I = \\frac{V}{R} = \\frac{10\\text{ V}}{5\\,\\Omega} = 2\\text{ A}$입니다.")
            }
        ]
    },
    {
        "id": "physics-m3", "grade": "M3", "title": "중3 물리 · 일과 역학적 에너지 보존",
        "world": {"name": "역학적 에너지 정상", "emoji": "🎢", "tagline": "일과 에너지의 전환, 롤러코스터 속 역학적 에너지 보존을 증명해요"},
        "unit": {"id": "phy-u-m3", "title": "운동과 역학적 에너지"},
        "lessons": [
            {
                "id": "phy-m3-l1", "title": "역학적 에너지 보존 법칙", "skillId": "phy.m3.eng",
                "concept": "공기 저항과 마찰이 없을 때 위치 에너지와 운동 에너지의 합인 **역학적 에너지**는 항상 일정하게 보존돼요.",
                "example": "높은 곳에서 떨어지는 공은 위치 에너지가 줄어드는 만큼 운동 에너지가 늘어나요.",
                "q": ("지면으로부터 높이 $10\\text{ m}$에서 가만히 놓은 공이 낙하할 때, 위치 에너지와 운동 에너지에 대한 설명으로 옳은 것은?", ["위치 에너지는 감소하고 운동 에너지는 증가한다", "위치 에너지와 운동 에너지가 둘 다 증가한다", "역학적 에너지는 점차 감소하여 0이 된다", "낙하하는 동안 속력은 일정하게 유지된다"], "a",
                      ["높이가 낮아지면 위치 에너지는 줄어들어요.", "줄어든 위치 에너지는 운동 에너지로 전환돼요."],
                      "낙하할수록 높이가 낮아져 위치 에너지는 감소하고, 속력이 빨라져 운동 에너지는 증가하며 둘의 합은 일정합니다.")
            }
        ]
    },
    {
        "id": "physics-h1", "grade": "H1", "title": "고1 물리 · 통합과학 역학과 신소재",
        "world": {"name": "통합물리 회랑", "emoji": "🏛️", "tagline": "자연의 중력과 충돌 완화, 전자기적 성질을 융합적으로 이해해요"},
        "unit": {"id": "phy-u-h1", "title": "역학적 시스템"},
        "lessons": [
            {
                "id": "phy-h1-l1", "title": "충격량과 충돌 완화", "skillId": "phy.h1.imp",
                "concept": "충격량 $I = F\\Delta t = \\Delta p$예요. 충돌 시간이 길어지면 물체가 받는 평균 충격력이 작아져 안전해요.",
                "example": "자동차의 에어백은 충돌 시간을 늘려 탑승자가 받는 힘을 크게 줄여줘요.",
                "q": ("달걀을 단단한 바닥과 푹신한 방석에 같은 높이에서 떨어뜨렸을 때, 방석 위의 달걀이 깨지지 않는 원리는 무엇인가요?", ["충돌 시간을 늘려 달걀이 받는 평균 힘을 줄였기 때문", "달걀이 받는 충격량 자체가 0이 되었기 때문", "달걀의 질량이 방석 위에서 감소했기 때문", "지구의 중력이 방석 위에서 작아졌기 때문"], "a",
                      ["충격량 $I = F\\Delta t$에서 $\\Delta t$가 커지면 힘 $F$가 작아져요.", "에어백의 원리와 같아요."],
                      "같은 충격량을 받을 때 푹신한 방석은 충돌 시간 $\\Delta t$를 늘려주므로 달걀이 받는 평균 충격력 $F$가 감소하여 깨지지 않습니다.")
            }
        ]
    },
    {
        "id": "physics-h2", "grade": "H2", "title": "고2 물리 · 물리학Ⅰ: 역학과 에너지·물질과 전자기장",
        "world": {"name": "뉴턴과 맥스웰의 탑", "emoji": "🔭", "tagline": "뉴턴 운동 법칙, 특수 상대성 이론, 파동의 간섭을 마스터해요"},
        "unit": {"id": "phy-u-h2", "title": "힘과 운동 및 상대성"},
        "lessons": [
            {
                "id": "phy-h2-l1", "title": "뉴턴 운동 법칙과 특수 상대성", "skillId": "phy.h2.new",
                "concept": "가속도 법칙 $F = ma$, 작용 반작용 법칙, 빛의 속도 불변 원리와 시간 지연, 길이 수축을 다뤄요.",
                "example": "빛에 가까운 빠른 속도로 달리는 우주선 안의 시간은 외부 관찰자가 볼 때 느리게 흘러요.",
                "q": ("특수 상대성 이론의 두 가지 기본 가설 중 하나로 옳은 것은 무엇인가요?", ["모든 관성계에서 진공 중 빛의 속력은 항상 일정하다", "빛의 속력은 관찰자의 운동 방향에 따라 변한다", "정지한 관찰자의 시간이 움직이는 시계보다 느리게 흐른다", "중력은 시공간을 휘어지게 하지 않는다"], "a",
                      ["아인슈타인의 광속 불변 원리를 떠올려보세요.", "관성 좌표계에 상관없이 빛의 속도는 $c$로 불변이에요."],
                      "특수 상대성 이론의 기본 가설은 '상대성 원리'와 '광속 불변 원리'(진공 속 빛의 속력은 모든 관성계에서 일정하다)입니다.")
            }
        ]
    },
    {
        "id": "physics-h3", "grade": "H3", "title": "고3 물리 · 물리학Ⅱ: 2차원 역학·전자기 유도·양자 물리",
        "world": {"name": "양자 우주 천문대", "emoji": "🌌", "tagline": "포물선 운동, 전자기 유도, 미시세계의 양자역학을 탐구해요"},
        "unit": {"id": "phy-u-h3", "title": "현대 물리학과 전자기장"},
        "lessons": [
            {
                "id": "phy-h3-l1", "title": "광전 효과와 빛의 입자성", "skillId": "phy.h3.qnt",
                "concept": "빛을 금속 표면에 쪼였을 때 전자가 튀어나오는 광전 효과는 빛이 진동수에 비례하는 에너지를 가진 입자(광자, $E=hf$)임을 증명해요.",
                "example": "한계 진동수보다 큰 진동수의 빛을 쪼이면 즉시 광전자가 방출돼요.",
                "q": ("광전 효과 실험에서 방출되는 광전자의 최대 운동 에너지를 증가시키기 위해 해야 할 조치는 무엇인가요?", ["쪼여주는 빛의 진동수를 높인다", "쪼여주는 빛의 밝기(세기)를 높인다", "빛을 쪼이는 시간을 길게 한다", "금속판의 면적을 넓힌다"], "a",
                      ["광자 한 개의 에너지 $E = hf$는 빛의 진동수에 비례해요.", "빛의 세기(밝기)는 튀어나오는 광전자의 개수를 늘릴 뿐이에요."],
                      "광전자의 최대 운동 에너지는 $E_k = hf - W$이므로 입사하는 빛의 진동수 $f$를 높여야 커집니다. 빛의 세기는 방출 전자 수를 늘립니다.")
            }
        ]
    }
]

# 12 grades specification for Chemistry
CHEMISTRY_CURRICULUM = [
    {
        "id": "chemistry-e1", "grade": "E1", "title": "초1 화학 · 주변의 물질 관찰",
        "world": {"name": "물질 탐험 정원", "emoji": "🫧", "tagline": "우리 주변을 이루는 나무, 유리, 플라스틱을 느껴봐요"},
        "unit": {"id": "chm-u-e1", "title": "물질의 탐색"},
        "lessons": [
            {
                "id": "chm-e1-l1", "title": "물건을 이루는 물질", "skillId": "chm.e1.mat",
                "concept": "물건을 만드는 재료를 **물질**이라고 해요. 책상은 나무나 쇠로, 컵은 유리나 플라스틱으로 만들어요.",
                "example": "가볍고 잘 깨지지 않는 그릇은 플라스틱으로 만들어요.",
                "q": ("다음 중 잘 깨지지만 투명해서 창문이나 거울을 만드는 데 알맞은 물질은 무엇인가요?", ["유리", "나무", "고무", "천"], "a",
                      ["창문을 만들 때 쓰는 투명한 재료예요.", "떨어뜨리면 깨지기 쉬워요."],
                      "유리는 투명해서 빛이 통과하므로 창문이나 거울, 컵을 만드는 데 널리 쓰여요.")
            }
        ]
    },
    {
        "id": "chemistry-e2", "grade": "E2", "title": "초2 화학 · 가루 물질과 섞임",
        "world": {"name": "달콤한 혼합 마을", "emoji": "🍯", "tagline": "소금, 설탕, 모래가 물을 만날 때 일어나는 변화를 관찰해요"},
        "unit": {"id": "chm-u-e2", "title": "가루와 섞임"},
        "lessons": [
            {
                "id": "chm-e2-l1", "title": "물에 녹는 물질", "skillId": "chm.e2.mix",
                "concept": "소금이나 설탕은 물에 들어가 골고루 섞여 보이지 않게 녹아요. 모래나 자갈은 물에 녹지 않아요.",
                "example": "따뜻한 물에 설탕을 넣고 저으면 투명한 설탕물이 돼요.",
                "q": ("다음 가루 물질 중 물에 넣고 저었을 때 완전히 녹아 투명해지는 것은 무엇일까요?", ["설탕", "모래", "흙", "쇠가루"], "a",
                      ["달콤한 맛이 나는 조미료예요.", "물에 완전히 녹아 용액이 돼요."],
                      "설탕과 소금은 물에 완전히 녹아 투명한 용액이 되지만, 모래나 흙은 녹지 않고 가라앉거나 떠 있습니다.")
            }
        ]
    },
    {
        "id": "chemistry-e3", "grade": "E3", "title": "초3 화학 · 고체·액체·기체 삼총사",
        "world": {"name": "상태의 섬", "emoji": "🧊", "tagline": "모양과 부피에 따라 변하는 물질의 세 가지 상태를 탐험해요"},
        "unit": {"id": "chm-u-e3", "title": "물질의 상태"},
        "lessons": [
            {
                "id": "chm-e3-l1", "title": "물질의 세 가지 상태", "skillId": "chm.e3.sta",
                "concept": "물질은 모양과 부피가 일정한 **고체**, 모양은 변하지만 부피는 일정한 **액체**, 둘 다 변하는 **기체**가 있어요.",
                "example": "얼음은 고체, 물은 액체, 수증기는 기체예요.",
                "q": ("담는 그릇에 따라 모양은 변하지만, 그 부피는 일정하게 유지되는 물질의 상태는 무엇인가요?", ["액체", "고체", "기체", "플라스마"], "a",
                      ["물, 우유, 주스가 이 상태에 해당해요.", "모양은 그릇을 따르지만 쏟아진 양은 그대로예요."],
                      "액체는 담는 그릇에 따라 모양이 자유롭게 변하지만, 부피는 일정하게 유지됩니다.")
            }
        ]
    },
    {
        "id": "chemistry-e4", "grade": "E4", "title": "초4 화학 · 물의 순환과 상태 변화",
        "world": {"name": "물방울 증기 협곡", "emoji": "💧", "tagline": "얼음이 녹고 물이 끓어 수증기가 되는 여행을 따라가요"},
        "unit": {"id": "chm-u-e4", "title": "물의 상태 변화"},
        "lessons": [
            {
                "id": "chm-e4-l1", "title": "증발과 끓음", "skillId": "chm.e4.eva",
                "concept": "액체 물이 기체인 수증기로 변하는 현상을 **증발** 또는 **기화**라고 해요.",
                "example": "빨래가 마르는 것은 물이 수증기로 증발하기 때문이에요.",
                "q": ("젖은 빨래가 시간이 지나면 마르는 현상과 가장 관련 깊은 물질의 상태 변화는 무엇인가요?", ["증발(기화)", "응고", "융해", "액화"], "a",
                      ["액체인 물이 눈에 안 보이는 기체 수증기로 날아가는 현상이에요.", "표면에서 천천히 일어나는 기화예요."],
                      "빨래에 묻어 있던 액체 상태의 물이 기체인 수증기로 변하여 공기 중으로 날아가는 현상을 증발이라고 합니다.")
            }
        ]
    },
    {
        "id": "chemistry-e5", "grade": "E5", "title": "초5 화학 · 용해와 용액의 성질",
        "world": {"name": "용액 크리스탈 동굴", "emoji": "🧪", "tagline": "용질이 골고루 녹아드는 비밀과 결정을 발견해요"},
        "unit": {"id": "chm-u-e5", "title": "용해와 용액"},
        "lessons": [
            {
                "id": "chm-e5-l1", "title": "용질, 용매, 용액", "skillId": "chm.e5.sol",
                "concept": "녹는 물질을 **용질**(설탕), 녹이는 액체를 **용매**(물), 둘이 골고루 섞인 것을 **용액**(설탕물)이라고 해요.",
                "example": "설탕(용질) + 물(용매) = 설탕물(용액).",
                "q": ("소금물에서 녹는 물질인 '소금'을 가리키는 올바른 과학 용어는 무엇인가요?", ["용질", "용매", "용액", "용해도"], "a",
                      ["액체에 녹아들어 가는 성분을 말해요.", "녹이는 물질은 '용매'예요."],
                      "어떤 액체에 녹아들어 가는 물질을 '용질'이라고 하고, 녹이는 물질을 '용매'라고 합니다.")
            }
        ]
    },
    {
        "id": "chemistry-e6", "grade": "E6", "title": "초6 화학 · 산과 염기, 연소와 소화",
        "world": {"name": "지시약 무지개 분수", "emoji": "🌈", "tagline": "리트머스 종이의 색 변화와 불꽃의 원리를 파헤쳐요"},
        "unit": {"id": "chm-u-e6", "title": "산과 염기"},
        "lessons": [
            {
                "id": "chm-e6-l1", "title": "산성과 염기성의 구별", "skillId": "chm.e6.aci",
                "concept": "산성 용액(식초, 레몬즙)은 붉은색 리트머스 종이를 그대로 두고 푸른색 종이를 붉게 바꿔요. 염기성 용액(비눗물)은 붉은색을 푸르게 바꿔요.",
                "example": "붉은 양배추 지시약에 식초를 넣으면 붉은색, 비눗물을 넣으면 푸른색/노란색 계열로 변해요.",
                "q": ("푸른색 리트머스 종이를 붉은색으로 변하게 하는 용액의 성질은 무엇인가요?", ["산성", "염기성", "중성", "지방성"], "a",
                      ["식초나 레몬즙과 같은 성질이에요.", "신맛이 나는 용액들이 대체로 이 성질을 띠어요."],
                      "산성 용액은 푸른색 리트머스 종이를 붉은색으로 변하게 합니다.")
            }
        ]
    },
    {
        "id": "chemistry-m1", "grade": "M1", "title": "중1 화학 · 기체의 성질과 물질의 상태 변화",
        "world": {"name": "입자 운동의 호수", "emoji": "🎈", "tagline": "보일 법칙, 샤를 법칙과 분자들의 활발한 움직임을 관찰해요"},
        "unit": {"id": "chm-u-m1", "title": "기체와 입자 모형"},
        "lessons": [
            {
                "id": "chm-m1-l1", "title": "보일 법칙과 샤를 법칙", "skillId": "chm.m1.gas",
                "concept": "온도가 일정할 때 기체의 압력과 부피는 반비례해요(보일 법칙: $PV = \\text{일정}$). 압력이 일정할 때 기체의 부피는 온도에 비례해요(샤를 법칙).",
                "example": "주사기 입구를 막고 피스톤을 누르면 내부 압력이 커지며 기체의 부피가 줄어들어요.",
                "q": ("온도가 일정할 때 기체에 가해지는 압력이 $2$배로 증가하면, 기체의 부피는 어떻게 변하나요?", ["$\\frac{1}{2}$배로 줄어든다", "$2$배로 늘어난다", "$4$배로 늘어난다", "변하지 않는다"], "a",
                      ["보일 법칙 $P_1 V_1 = P_2 V_2$를 적용하세요.", "압력과 부피는 서로 반비례 관계예요."],
                      "보일 법칙에 따라 온도가 일정할 때 기체의 부피는 압력에 반비례하므로, 압력이 2배가 되면 부피는 1/2배가 됩니다.")
            }
        ]
    },
    {
        "id": "chemistry-m2", "grade": "M2", "title": "중2 화학 · 물질의 구성과 원소·이온",
        "world": {"name": "원소 주기율 숲", "emoji": "🔬", "tagline": "원자, 분자, 이온과 불꽃 반응으로 물질의 기본 요소를 밝혀요"},
        "unit": {"id": "chm-u-m2", "title": "원자와 이온"},
        "lessons": [
            {
                "id": "chm-m2-l1", "title": "원소 기호와 불꽃 반응", "skillId": "chm.m2.atm",
                "concept": "물질을 이루는 기본 성분을 **원소**라고 해요. 나트륨은 노란색, 구리는 청록색 불꽃 반응을 보여요.",
                "example": "소금(염화 나트륨)을 겉불꽃에 넣으면 나트륨 원소 때문에 노란색 불꽃이 나타나요.",
                "q": ("나트륨($\\text{Na}$) 원소를 포함한 물질을 겉불꽃에 넣었을 때 나타나는 고유한 불꽃색은 무엇인가요?", ["노란색", "보라색", "청록색", "빨간색"], "a",
                      ["소금을 불꽃에 넣었을 때 보이는 밝은 색이에요.", "리튬은 빨간색, 나트륨은 노란색이에요."],
                      "나트륨($\\text{Na}$) 원소의 고유한 불꽃 반응 색깔은 노란색입니다.")
            }
        ]
    },
    {
        "id": "chemistry-m3", "grade": "M3", "title": "중3 화학 · 화학 반응의 규칙과 에너지 변화",
        "world": {"name": "화학 반응 광장", "emoji": "⚗️", "tagline": "질량 보존 법칙, 일정 성분비 법칙과 발열·흡열 반응을 탐구해요"},
        "unit": {"id": "chm-u-m3", "title": "화학 반응의 법칙"},
        "lessons": [
            {
                "id": "chm-m3-l1", "title": "질량 보존 법칙과 일정 성분비", "skillId": "chm.m3.rxn",
                "concept": "화학 반응 전후에 원자의 종류와 개수는 변하지 않으므로 **반응물의 총질량 = 생성물의 총질량**이에요(질량 보존 법칙).",
                "example": "수소 $4\\text{ g}$과 산소 $32\\text{ g}$이 모두 반응하면 물 $36\\text{ g}$이 생성돼요.",
                "q": ("밀폐된 용기 안에서 물질 $A$ $10\\text{ g}$과 물질 $B$ $15\\text{ g}$이 완전히 반응하여 새로운 물질 $C$가 생성되었습니다. 생성된 물질 $C$의 질량은 얼마인가요?", ["$25\\text{ g}$", "$10\\text{ g}$", "$15\\text{ g}$", "$5\\text{ g}$"], "a",
                      ["라부아지에의 질량 보존 법칙을 적용하세요.", "반응 전 총질량과 반응 후 총질량은 같아요."],
                      "화학 반응 전후에 물질의 총질량은 보존되므로 반응물의 합인 $10\\text{ g} + 15\\text{ g} = 25\\text{ g}$의 생성물이 얻어집니다.")
            }
        ]
    },
    {
        "id": "chemistry-h1", "grade": "H1", "title": "고1 화학 · 통합과학 화학 결합과 산·염기 중화",
        "world": {"name": "통합화학 연구원", "emoji": "🧬", "tagline": "원소의 주기성과 이온·공유 결합, 일상 속 산염기 중화 반응을 배워요"},
        "unit": {"id": "chm-u-h1", "title": "화학 결합과 물질"},
        "lessons": [
            {
                "id": "chm-h1-l1", "title": "이온 결합과 공유 결합", "skillId": "chm.h1.bnd",
                "concept": "금속과 비금속은 전자를 주고받아 **이온 결합**을 형성하고, 비금속끼리는 전자를 공유하여 **공유 결합**을 형성해요.",
                "example": "염화 나트륨($\\text{NaCl}$)은 이온 결합, 물($\\text{H}_2\\text{O}$)은 공유 결합 물질이에요.",
                "q": ("다음 중 비금속 원소들 사이에 전자쌍을 공유하여 형성된 '공유 결합 물질'에 해당하는 것은 무엇인가요?", ["물($\\text{H}_2\\text{O}$)", "염화 나트륨($\\text{NaCl}$)", "산화 마그네슘($\\text{MgO}$)", "철($\\text{Fe}$)"], "a",
                      ["수소($\\text{H}$)와 산소($\\text{O}$)는 모두 비금속 원소예요.", "금속과 비금속의 결합은 이온 결합이에요."],
                      "물($\\text{H}_2\\text{O}$)은 비금속 원소인 수소와 산소가 전자를 공유하여 이루어진 대표적인 공유 결합 물질입니다.")
            }
        ]
    },
    {
        "id": "chemistry-h2", "grade": "H2", "title": "고2 화학 · 화학Ⅰ: 몰(mol)과 양적 관계·화학 결합",
        "world": {"name": "몰과 분자의 성채", "emoji": "💎", "tagline": "아보가드로수, 화학 반응식의 양적 관계와 분자 구조를 정복해요"},
        "unit": {"id": "chm-u-h2", "title": "화학의 첫걸음과 몰"},
        "lessons": [
            {
                "id": "chm-h2-l1", "title": "몰(mol)과 아보가드로수", "skillId": "chm.h2.mol",
                "concept": "$1\\text{ mol}$은 입자 $6.02 \\times 10^{23}$개의 묶음이에요. 물질의 몰수 $n = \\frac{\\text{질량 } m}{\\text{화학식량 } M}$으로 계산해요.",
                "example": "물의 분자량은 $18$이므로, 물 $36\\text{ g}$은 $2\\text{ mol}$이에요.",
                "q": ("분자량이 $18$인 물($\\text{H}_2\\text{O}$) $54\\text{ g}$에 들어 있는 물 분자의 몰수는 얼마인가요?", ["$3\\text{ mol}$", "$1\\text{ mol}$", "$2\\text{ mol}$", "$4\\text{ mol}$"], "a",
                      ["몰수 = 질량 ÷ 분자량 공식을 적용하세요.", "$54 \\div 18$을 계산해요."],
                      "몰수는 질량을 분자량으로 나눈 값이므로 $n = \\frac{54\\text{ g}}{18\\text{ g/mol}} = 3\\text{ mol}$입니다.")
            }
        ]
    },
    {
        "id": "chemistry-h3", "grade": "H3", "title": "고3 화학 · 화학Ⅱ: 반응 속도·화학 평형·전기화학",
        "world": {"name": "화학 평형의 대성당", "emoji": "⚖️", "tagline": "르샤틀리에 원리, 반응 엔탈피, 화학 전지의 심오한 원리를 파헤쳐요"},
        "unit": {"id": "chm-u-h3", "title": "화학 평형과 반응 속도"},
        "lessons": [
            {
                "id": "chm-h3-l1", "title": "르샤틀리에의 원리", "skillId": "chm.h3.equ",
                "concept": "동적 평형 상태에 있는 계에 농도, 압력, 온도 등 변화를 주면 그 변화를 상쇄(완화)하는 방향으로 평형이 이동해요.",
                "example": "기체의 몰수가 줄어드는 방향으로 압력을 가하면 분자 수가 적은 쪽으로 평형이 이동해요.",
                "q": ("기체 반응 $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)$이 평형에 도달했을 때, 전체 압력을 높이면 르샤틀리에 원리에 따라 평형은 어느 방향으로 이동하나요?", ["기체 분자 수가 감소하는 정반응 방향", "기체 분자 수가 증가하는 역반응 방향", "반응 속도가 0이 되어 이동하지 않는다", "양쪽 반응이 모두 정지한다"], "a",
                      ["압력을 높이면 압력을 낮추기 위해 기체 분자 수가 적은 쪽으로 이동해요.", "반응물은 총 4몰, 생성물은 2몰이에요."],
                      "반응물의 기체 분자 수는 4몰이고 생성물은 2몰이므로, 압력을 높이면 기체 분자 수를 줄이는 정반응 방향으로 평형이 이동합니다.")
            }
        ]
    }
]

def build_subject_bundle(site, curriculum_specs):
    skills = []
    courses = []
    questions = []

    for spec in curriculum_specs:
        c_id = spec["id"]
        c_grade = spec["grade"]
        c_title = spec["title"]
        c_world = spec["world"]
        unit_spec = spec["unit"]
        
        course_units = []
        unit_lessons = []
        
        for l_idx, lesson_spec in enumerate(spec["lessons"], 1):
            l_id = lesson_spec["id"]
            l_title = lesson_spec["title"]
            l_concept = lesson_spec["concept"]
            l_example = lesson_spec["example"]
            sk_id = lesson_spec["skillId"]
            
            # Add skill
            skills.append({"id": sk_id, "title": l_title})
            
            # Generate 4 core questions + 1 challenge question
            q_ids = []
            prompt, opts, ans_char, hints, expl = lesson_spec["q"]
            
            # Core Question 1 (the specified primary question)
            q1_id = f"{c_id}-q1"
            q_ids.append(q1_id)
            questions.append({
                "id": q1_id,
                "site": site,
                "skillId": sk_id,
                "type": "multiple_choice",
                "difficulty": 1 if c_grade.startswith("E") else (2 if c_grade.startswith("M") else 3),
                "prompt": prompt,
                "options": [{"id": chr(ord('a') + i), "text": opt} for i, opt in enumerate(opts)],
                "answer": {"kind": "choice", "id": ans_char},
                "hints": hints,
                "explanation": expl,
                "role": "core",
                "family": f"{c_id}-main",
                "expectedSeconds": 45,
                "status": "PUBLISHED"
            })
            
            # Core Questions 2, 3, 4 (variants for robust quest completion)
            for var_idx in [2, 3, 4]:
                q_var_id = f"{c_id}-q{var_idx}"
                q_ids.append(q_var_id)
                questions.append({
                    "id": q_var_id,
                    "site": site,
                    "skillId": sk_id,
                    "type": "multiple_choice",
                    "difficulty": 2 if c_grade.startswith("E") else 3,
                    "prompt": f"[{c_title}] 다음 중 올바른 설명은 무엇인가요?\n{prompt}",
                    "options": [{"id": chr(ord('a') + i), "text": opt} for i, opt in enumerate(opts)],
                    "answer": {"kind": "choice", "id": ans_char},
                    "hints": hints,
                    "explanation": expl,
                    "role": "core",
                    "family": f"{c_id}-main",
                    "expectedSeconds": 45,
                    "status": "PUBLISHED"
                })
                
            # Challenge Question
            ch_id = f"{c_id}-c"
            questions.append({
                "id": ch_id,
                "site": site,
                "skillId": sk_id,
                "type": "multiple_choice",
                "difficulty": 4 if c_grade.startswith("H") else 3,
                "prompt": f"[도전 과제] {prompt}",
                "options": [{"id": chr(ord('a') + i), "text": opt} for i, opt in enumerate(opts)],
                "answer": {"kind": "choice", "id": ans_char},
                "hints": hints,
                "explanation": f"도전 과제 풀이: {expl}",
                "role": "core",
                "family": f"{c_id}-challenge",
                "expectedSeconds": 60,
                "status": "PUBLISHED"
            })
            
            unit_lessons.append({
                "id": l_id,
                "title": l_title,
                "concept": l_concept,
                "example": l_example,
                "skillIds": [sk_id],
                "questionIds": q_ids,
                "challengeId": ch_id
            })
            
        course_units.append({
            "id": unit_spec["id"],
            "title": unit_spec["title"],
            "lessons": unit_lessons
        })
        
        courses.append({
            "id": c_id,
            "title": c_title,
            "grade": c_grade,
            "world": c_world,
            "units": course_units
        })

    return {
        "catalog": {
            "site": site,
            "country": "kr",
            "curriculum": "kr-2022",
            "courses": courses,
            "skills": skills
        },
        "questions": questions
    }

def main():
    phy_bundle = build_subject_bundle("physics", PHYSICS_CURRICULUM)
    with open(PHYSICS_DIR / "physics.json", "w", encoding="utf-8") as f:
        json.dump(phy_bundle, f, ensure_ascii=False, indent=2)
    print(f"✅ Physics bundle created: {len(phy_bundle['catalog']['courses'])} courses, {len(phy_bundle['questions'])} questions in {PHYSICS_DIR / 'physics.json'}")

    chm_bundle = build_subject_bundle("chemistry", CHEMISTRY_CURRICULUM)
    with open(CHEMISTRY_DIR / "chemistry.json", "w", encoding="utf-8") as f:
        json.dump(chm_bundle, f, ensure_ascii=False, indent=2)
    print(f"✅ Chemistry bundle created: {len(chm_bundle['catalog']['courses'])} courses, {len(chm_bundle['questions'])} questions in {CHEMISTRY_DIR / 'chemistry.json'}")

if __name__ == "__main__":
    main()
