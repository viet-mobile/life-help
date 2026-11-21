#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Q2 Physics Daily Insights Generator (Days 92 - 182, 91 Items)
Author: LIFE.HELP Content Team
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = BASE_DIR / "lib" / "learn" / "dailyInsights" / "data" / "q2"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CAT_MAP = {
    "saving": ("비용 절약", "💸"),
    "problem": ("생활 문제 해결", "🛠️"),
    "health": ("건강 및 웰니스", "🌿"),
    "travel": ("여행 및 이동", "🚗"),
    "shopping": ("쇼핑·소비", "🛒"),
    "energy": ("에너지 절약", "⚡")
}

def get_md(doy):
    days = [31, 29, 31, 30, 31, 30]
    m = 1
    rem = doy
    for dim in days:
        if rem <= dim:
            return m, rem
        rem -= dim
        m += 1
    return m, rem

# 91 items definition
RAW_PHYSICS = [
    # 4월 1일 ~ 4월 30일 (Days 92 - 121)
    {
        "doy": 92, "cat": "energy",
        "ko": {
            "title": "맞바람 환기의 힘, 압력차로 실내 공기 3분 만에 교체하기",
            "summary": "마주 보는 두 창문을 동시에 열면 베르누이 압력차로 기류가 형성되어 환기 시간이 1/5로 단축됩니다.",
            "principle": "베르누이 방정식과 연속 방정식 $Q = A v$. 바람이 불어오는 쪽(정압)과 빠져나가는 쪽(부압)의 압력차 $\Delta P = \frac{1}{2}\rho (v_2^2 - v_1^2)$가 자연 대류를 유도합니다.",
            "example": "창문 하나만 열면 공기 교체에 20분 이상 걸리지만, 마주 보는 창문을 열면 3분 만에 실내 공기의 90% 이상이 교체됩니다.",
            "actionItem": "오늘 아침 환기할 때는 바람이 들어오는 창문과 반대편 창문을 함께 열어 바람길을 만드세요."
        },
        "en": {
            "title": "The Power of Cross-Ventilation: Refreshing Indoor Air in 3 Minutes via Pressure Difference",
            "summary": "Opening two opposite windows simultaneously creates a Bernoulli pressure gradient, cutting ventilation time to one-fifth.",
            "principle": "Bernoulli's principle and continuity equation $Q = A v$. The pressure gradient $\Delta P = \frac{1}{2}\rho (v_2^2 - v_1^2)$ between windward and leeward sides drives strong natural airflow.",
            "example": "A single open window takes over 20 minutes to exchange air, while cross-ventilation exchanges over 90% in just 3 minutes.",
            "actionItem": "When ventilating this morning, open windows on opposite sides of your home to create an open air pathway."
        },
        "vi": {
            "title": "Sức mạnh của thông gió đối lưu: Thay mới không khí trong nhà chỉ 3 phút nhờ chênh lệch áp suất",
            "summary": "Mở đồng thời hai cửa sổ đối diện nhau tạo ra độ chênh áp suất Bernoulli, rút ngắn thời gian thông gió xuống còn 1/5.",
            "principle": "Nguyên lý Bernoulli và phương trình liên tục $Q = A v$. Độ chênh lệch áp suất $\Delta P = \frac{1}{2}\rho (v_2^2 - v_1^2)$ giữa hướng đón gió và khuất gió thúc đẩy lưu thông tự nhiên.",
            "example": "Mở một cửa sổ mất hơn 20 phút để đổi khí, trong khi mở hai cửa đối diện thay mới hơn 90% không khí chỉ trong 3 phút.",
            "actionItem": "Sáng nay khi thông gió, hãy mở đồng thời cửa đón gió và cửa đối diện để tạo luồng khí lưu thông xuyên suốt."
        }
    },
    {
        "doy": 93, "cat": "travel",
        "ko": {
            "title": "봄철 자전거 타이어 적정 공기압과 구름 저항 최소화",
            "summary": "기온이 오를 때 타이어 공기압을 적정 수준으로 맞추면 구름 마찰력이 줄어 페달링 힘이 20% 절약됩니다.",
            "principle": "구름 저항력 $F_r = C_{rr} N$. 공기압이 낮으면 타이어 접지면의 변형 손실(히스테리시스)이 커져 저항 계수 $C_{rr}$이 급증합니다.",
            "example": "공기압이 30% 부족하면 평지 주행 시 필요한 파워가 15~20W 더 소모되어 10km 주행 시 피로도가 크게 증가합니다.",
            "actionItem": "자전거 주행 전 타이어 옆면에 표기된 적정 공기압(PSI) 범위의 85~90% 수준으로 펌핑하세요."
        },
        "en": {
            "title": "Optimizing Bicycle Tire Pressure for Spring to Minimize Rolling Resistance",
            "summary": "Adjusting tire pressure as temperatures rise reduces rolling friction, saving up to 20% of pedaling energy.",
            "principle": "Rolling resistance $F_r = C_{rr} N$. Under-inflated tires suffer from excessive contact deformation (hysteresis), sharply increasing $C_{rr}$.",
            "example": "A 30% drop in pressure demands 15-20W of extra power, noticeably increasing fatigue over a 10 km commute.",
            "actionItem": "Before riding, inflate tires to 85-90% of the maximum PSI indicated on the tire sidewall."
        },
        "vi": {
            "title": "Áp suất lốp xe đạp mùa xuân và tối thiểu hóa lực cản lăn",
            "summary": "Bơm lốp xe đạp đúng áp suất khi thời tiết ấm lên giúp giảm lực cản lăn, tiết kiệm 20% sức đạp xe.",
            "principle": "Lực cản lăn $F_r = C_{rr} N$. Khi lốp non hơi, biến dạng tiếp xúc lớn làm tăng tổn hao trễ, khiến hệ số $C_{rr}$ tăng vọt.",
            "example": "Lốp thiếu 30% áp suất đòi hỏi thêm 15-20W lực đạp trên đường bằng, làm tăng đáng kể sự mệt mỏi sau 10 km.",
            "actionItem": "Trước khi đạp xe, hãy kiểm tra và bơm lốp đạt mức 85-90% chỉ số PSI ghi trên thành lốp."
        }
    },
    {
        "doy": 94, "cat": "health",
        "ko": {
            "title": "황사·미세먼지 차단 마스크의 정전기 집진과 쿨롱의 법칙",
            "summary": "KF94 마스크의 핵심은 단순 섬유 틈새가 아닌 정전기 유도 인력으로 0.4µm 초미세 입자를 94% 이상 포집하는 것입니다.",
            "principle": "쿨롱의 정전기력 $F = k_e \frac{|q_1 q_2|}{r^2}$. 마스크 멜트블로운(MB) 부직포에 대전된 고전하가 무극성 미세먼지에 유도 분극을 일으켜 끌어당깁니다.",
            "example": "물에 젖거나 알코올이 닿으면 정전기가 방전되어 포집 효율이 94%에서 40% 이하로 급격히 떨어집니다.",
            "actionItem": "마스크는 물로 세척하거나 소독제를 뿌리지 말고 일회용 규격대로 건조하게 사용하세요."
        },
        "en": {
            "title": "Electrostatic Dust Collection in Particulate Masks and Coulomb's Law",
            "summary": "The secret of high-efficiency masks is electrostatic induction that traps 0.4 µm micro-particles with over 94% efficiency.",
            "principle": "Coulomb's electrostatic force $F = k_e \frac{|q_1 q_2|}{r^2}$. Pre-charged melt-blown electret fibers polarize and capture airborne particles.",
            "example": "Wetting the mask or applying alcohol discharges the static field, crashing filtration efficiency from 94% to below 40%.",
            "actionItem": "Never spray alcohol or wash your particulate respirator mask; keep it dry and replace when expired."
        },
        "vi": {
            "title": "Khẩu trang lọc bụi tĩnh điện và định luật Coulomb",
            "summary": "Chìa khóa của khẩu trang KF94/N95 là lực hút tĩnh điện giúp bắt giữ hơn 94% hạt bụi siêu mịn 0.4 µm thay vì chỉ dựa vào lưới cơ học.",
            "principle": "Lực tĩnh điện Coulomb $F = k_e \frac{|q_1 q_2|}{r^2}$. Sợi vải không dệt tích điện tạo phân cực cảm ứng hút các hạt bụi lơ lửng.",
            "example": "Khi bị ướt hoặc xịt cồn, điện tích bị triệt tiêu khiến hiệu suất lọc rơi từ 94% xuống dưới 40%.",
            "actionItem": "Không giặt bằng nước hoặc xịt cồn khử trùng lên khẩu trang lọc bụi; luôn giữ khô ráo."
        }
    },
    {
        "doy": 95, "cat": "problem",
        "ko": {
            "title": "봄비 내릴 때 차량 와이퍼 소음과 흑연 코팅 마찰 역학",
            "summary": "와이퍼가 '드르륵' 떨리는 소음은 스틱-슬립(Stick-Slip) 현상이며, 유리 유막 제거와 흑연 고무 관리가 해결책입니다.",
            "principle": "정지 마찰계수 $\mu_s$와 운동 마찰계수 $\mu_k$의 차이로 인해 고무 블레이드가 유리에 달라붙었다 미끄러지는 자려진동이 발생합니다.",
            "example": "유리에 유막이 끼면 $\mu_s - \mu_k$ 차이가 2배 이상 벌어져 소음이 심해지고 블레이드 수명이 절반으로 단축됩니다.",
            "actionItem": "와이퍼 소음이 날 때는 블레이드 날을 알코올 티슈로 닦아내고 앞유리의 유막을 제거하세요."
        },
        "en": {
            "title": "Car Wiper Chattering in Spring Rain and Graphite Friction Mechanics",
            "summary": "Wiper judder is caused by the stick-slip effect; cleaning road grime and maintaining the graphite coating solves it.",
            "principle": "The disparity between static friction $\mu_s$ and kinetic friction $\mu_k$ causes self-excited vibration as the rubber sticks and slips.",
            "example": "An oily film on glass doubles $\mu_s - \mu_k$, causing severe squeaking and cutting blade lifespan by half.",
            "actionItem": "When wipers chatter, wipe the rubber blade edges with an alcohol swab and remove oil films from the windshield."
        },
        "vi": {
            "title": "Hiện tượng gạt mưa ô tô kêu cót két và cơ học ma sát than chì",
            "summary": "Tiếng kêu rung giật của gạt mưa là do hiệu ứng dính-trượt (stick-slip); làm sạch váng dầu và duy trì lớp phủ than chì sẽ giải quyết triệt để.",
            "principle": "Chênh lệch giữa hệ số ma sát nghỉ $\mu_s$ và ma sát trượt $\mu_k$ tạo dao động tự kích khi lưỡi cao su dính rồi trượt liên tục.",
            "example": "Váng dầu bám trên kính làm chênh lệch $\mu_s - \mu_k$ tăng gấp đôi, gây tiếng ồn khó chịu và giảm tuổi thọ lưỡi gạt.",
            "actionItem": "Lau sạch cạnh lưỡi cao su bằng khăn tẩm cồn và tẩy sạch màng dầu trên kính chắn gió."
        }
    },
    {
        "doy": 96, "cat": "health",
        "ko": {
            "title": "꽃가루 알레르기 계절 공기청정기 흡입 기류와 유선형 배치",
            "summary": "공기청정기를 벽면이나 가구에 너무 붙이지 않고 30cm 띄워야 흡입구 유체 저항이 줄어 정화 효율이 극대화됩니다.",
            "principle": "유체 연속 방정식과 베르누이 유선(Streamline). 흡입구 주변 장애물은 유속 저하와 압력 손실 $\Delta P = \frac{1}{2}\rho v^2 K_L$을 유발합니다.",
            "example": "벽면에 밀착된 공기청정기는 유효 청정 면적(CADR)이 약 25~30% 감소하여 전력 소비 대비 공기 순환이 저하됩니다.",
            "actionItem": "공기청정기는 벽면과 가구로부터 최소 30cm 이상 거리를 띄워 사방에서 공기가 유입되도록 하세요."
        },
        "en": {
            "title": "Air Purifier Placement for Pollen Season: Fluid Intake and Streamline Airflow",
            "summary": "Keeping air purifiers at least 30 cm away from walls reduces intake flow resistance, maximizing pollen filtration.",
            "principle": "Fluid continuity and streamline flow. Obstacles near intake grilles introduce localized pressure loss $\Delta P = \frac{1}{2}\rho v^2 K_L$.",
            "example": "A purifier flush against a wall loses 25-30% of its Clean Air Delivery Rate (CADR), wasting electrical energy.",
            "actionItem": "Move your air purifier at least 30 cm away from walls and large furniture to allow 360-degree intake."
        },
        "vi": {
            "title": "Bố trí máy lọc không khí mùa hoa nở: Dòng khí nạp và lưu tuyến khí động",
            "summary": "Đặt máy lọc không khí cách tường ít nhất 30 cm giúp giảm lực cản nạp khí, tối đa hóa hiệu suất lọc phấn hoa.",
            "principle": "Phương trình liên tục và lưu tuyến chất lưu. Chướng ngại vật sát cửa hút gây giảm vận tốc và tổn thất áp suất $\Delta P = \frac{1}{2}\rho v^2 K_L$.",
            "example": "Máy lọc kê sát tường bị giảm 25-30% lưu lượng không khí sạch (CADR), gây lãng phí điện năng tiêu thụ.",
            "actionItem": "Kéo máy lọc không khí cách tường và đồ đạc ít nhất 30 cm để luồng khí hút vào thông thoáng."
        }
    }
]

print(f"Loaded {len(RAW_PHYSICS)} base items.")
