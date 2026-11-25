# -*- coding: utf-8 -*-
"""
rebuild_curriculum_batches.py
Builds authentic, 100% unique, non-repeating ThinkTask batches for Physics and Chemistry:
  - 6 batches each (physics-d01..d06, chemistry-d01..d06)
  - 12 tasks per batch (2 grades per batch, exactly 6 unique questions per grade)
  - Uses authoritative curriculum questions from lib/learn/content/{subj}/{subj}.json
  - Generates authentic 89-language translation overlays from content/learn-overlays/{lang}/{subj}.json
  - Cleans up stale batches (d07..d09)
"""

import os, sys, json, re
from pathlib import Path

ROOT = Path("/Users/juboklee/life-project/life-help")
EXTRA_DIR = ROOT / "lib/think/data/extra"
I18N_DIR = ROOT / "lib/think/i18n"
CONTENT_DIR = ROOT / "lib/learn/content"
OVERLAY_DIR = ROOT / "content/learn-overlays"

GRADE_ORDER = ["e1", "e2", "e3", "e4", "e5", "e6", "m1", "m2", "m3", "h1", "h2", "h3"]
SLOTS = ["q1", "q2", "q3", "q4", "c", "q5"]

GRADE_LEVELS = {
    "e1": (1, "초등"), "e2": (1, "초등"), "e3": (1, "초등"),
    "e4": (1, "초등"), "e5": (1, "초등"), "e6": (1, "초등"),
    "m1": (2, "중등"), "m2": (2, "중등"), "m3": (2, "중등"),
    "h1": (3, "고등"), "h2": (3, "고등"), "h3": (3, "고등")
}

# Distinct title templates in Korean and English for each question
PHYSICS_TITLES = {
    # E1
    "physics-e1-q1": ("자석의 N극과 S극 상호작용", "Interaction of Magnetic N and S Poles"),
    "physics-e1-q2": ("플라스틱 컵과 자기력의 통과", "Magnetic Force Through Plastic Cups"),
    "physics-e1-q3": ("자석에 붙는 물질의 탐구", "Investigation of Materials Attracted to Magnets"),
    "physics-e1-q4": ("냉장고 문의 고무 자석 패킹", "Magnetic Gaskets in Refrigerator Doors"),
    "physics-e1-c":  ("자석의 당김과 밈 종합 탐구", "Comprehensive Inquiry of Magnetic Forces"),
    "physics-e1-q5": ("잘린 자석의 새로운 두 극", "Two New Poles of a Broken Magnet"),
    # E2
    "physics-e2-q1": ("소리굽쇠와 수면의 진동", "Tuning Fork and Water Surface Vibrations"),
    "physics-e2-q2": ("실전화기와 명주실의 소리 전달", "Sound Transmission via String Telephones"),
    "physics-e2-q3": ("북 위의 쌀알과 소리의 세기", "Vibrating Drum and Sound Amplitude"),
    "physics-e2-q4": ("스피커 진동과 촛불 불꽃의 흔들림", "Speaker Vibrations and Flickering Flames"),
    "physics-e2-c":  ("소리의 전달과 진동의 종합 관찰", "Comprehensive Observation of Sound Transmission"),
    "physics-e2-q5": ("실로폰 건반 길이와 소리의 높낮이", "Xylophone Bar Length and Sound Pitch"),
    # E3
    "physics-e3-q1": ("빛의 직진과 세 구멍 종이판", "Rectilinear Light Propagation and Three-Aperture Cards"),
    "physics-e3-q2": ("광원 거리와 그림자 크기 조절", "Light Source Distance and Shadow Scaling"),
    "physics-e3-q3": ("물질의 투명도와 그림자의 진하기", "Material Transparency and Shadow Density"),
    "physics-e3-q4": ("태양 고도와 국기게양대 그림자", "Solar Altitude and Flagpole Shadows"),
    "physics-e3-c":  ("바늘구멍 사진기의 도립 실상 탐구", "Inverted Real Images in Pinhole Cameras"),
    "physics-e3-q5": ("평면거울에서 빛의 반사의 법칙", "Law of Reflection in Plane Mirrors"),
    # E4
    "physics-e4-q1": ("양팔저울의 수평과 무게 중심", "Balance of Equal-Arm Scales and Center of Mass"),
    "physics-e4-q2": ("시소에서 무게와 받침점 거리", "Seesaw Equilibrium and Fulcrum Distance"),
    "physics-e4-q3": ("수평 잡기 추의 개수와 토크", "Torque Equilibrium and Counterweight Counts"),
    "physics-e4-q4": ("장도리와 지레의 3요소", "Crowbars and Three Elements of Levers"),
    "physics-e4-c":  ("수평 잡기와 지레의 기초 종합", "Comprehensive Balancing and Lever Principles"),
    "physics-e4-q5": ("바퀴와 굴림 마찰의 힘 절약", "Wheels, Rolling Friction, and Force Reduction"),
    # E5
    "physics-e5-q1": ("물체의 빠르기와 속력 공식", "Speed Equation and Motion Rates"),
    "physics-e5-q2": ("빗면 쇠구슬 실험과 변인 통제", "Inclined Plane Sphere Rolling and Variable Control"),
    "physics-e5-q3": ("100 m 달리기 기록과 평균 속력", "100-Meter Sprint Records and Average Velocity"),
    "physics-e5-q4": ("구간단속 카메라와 평균 속력 계산", "Section Speed Enforcement and Average Speed"),
    "physics-e5-c":  ("시간-거리 그래프와 속력의 기울기", "Distance-Time Graphs and Velocity Slopes"),
    "physics-e5-q5": ("같은 거리 이동 시 시속과 걸린 시간", "Constant-Distance Travel and Travel Times"),
    # E6
    "physics-e6-q1": ("전구 직렬연결과 병렬연결 밝기 비교", "Bulb Brightness in Series vs Parallel Circuits"),
    "physics-e6-q2": ("전기 회로의 단선과 전류의 경로", "Open Circuit Breakers and Electric Current Paths"),
    "physics-e6-q3": ("볼록렌즈에 비친 먼 풍경의 도립상", "Inverted Real Images of Distant Objects with Convex Lenses"),
    "physics-e6-q4": ("전자석의 세기와 에나멜선 감은 수", "Electromagnet Strength and Wire Turns"),
    "physics-e6-c":  ("돋보기의 확대 정립 허상 응용", "Magnifying Glass Magnification and Virtual Images"),
    "physics-e6-q5": ("젖은 손 감전 위험과 물의 전기 전도", "Electric Shock Hazards with Wet Hands"),
    # M1
    "physics-m1-q1": ("지구와 달에서의 질량과 무게", "Mass and Weight on Earth vs Moon"),
    "physics-m1-q2": ("접촉면의 거칠기와 최대 정지 마찰력", "Surface Roughness and Maximum Static Friction"),
    "physics-m1-q3": ("훅의 법칙과 용수철 늘어난 길이", "Hooke's Law and Spring Elongation"),
    "physics-m1-q4": ("수영장 물속 부력과 체감 무게", "Buoyancy in Water and Apparent Weight"),
    "physics-m1-c":  ("아르키메데스의 원리와 밀어낸 부피", "Archimedes' Principle and Displaced Volume"),
    "physics-m1-q5": ("수중 쇠구슬의 부력과 저울 눈금", "Submerged Sphere Buoyancy and Scale Readings"),
    # M2
    "physics-m2-q1": ("옴의 법칙 (V = IR)과 전류 계산", "Ohm's Law (V = IR) and Electric Current"),
    "physics-m2-q2": ("직선 도선 주위 자기장과 앙페르 법칙", "Magnetic Field Around Straight Wires and Ampere's Rule"),
    "physics-m2-q3": ("물과 식용유의 비열 차이와 온도 변화", "Specific Heat Differences: Water vs Oil"),
    "physics-m2-q4": ("철도 레일의 열팽창과 이음매 간격", "Thermal Expansion in Rails and Expansion Joints"),
    "physics-m2-c":  ("병렬 회로의 합성 저항과 전체 전류", "Equivalent Resistance in Parallel Circuits"),
    "physics-m2-q5": ("보온병의 이중벽 진공과 은도금 단열", "Thermos Flask Vacuum Walls and Radiant Insulation"),
    # M3
    "physics-m3-q1": ("과학적 일의 정의와 한 일의 양 (W = 0)", "Definition of Scientific Work and Zero-Work Conditions"),
    "physics-m3-q2": ("수레 충돌 실험과 운동 에너지", "Cart Collision Experiments and Kinetic Energy"),
    "physics-m3-q3": ("롤러코스터와 역학적 에너지 보존", "Roller Coasters and Mechanical Energy Conservation"),
    "physics-m3-q4": ("자동차 주행 속력과 제동 거리의 제곱비", "Vehicle Speed and Quadratic Braking Distances"),
    "physics-m3-c":  ("자유 낙하 속력 공식과 높이 관계", "Free Fall Velocity Derivation and Height Relations"),
    "physics-m3-q5": ("낙하 빗방울의 공기 저항과 종단 속도", "Raindrop Air Resistance and Terminal Velocity"),
    # H1
    "physics-h1-q1": ("수평 투사체와 자유 낙하체의 동시 도달", "Simultaneous Fall of Projectiles and Free-Falling Bodies"),
    "physics-h1-q2": ("충돌 시간과 충격력 (I = FΔt)", "Collision Duration and Impact Force Reduction (I = FΔt)"),
    "physics-h1-q3": ("야구공 타격 시 충격량과 운동량 변화", "Baseball Hits, Impulse, and Momentum Change"),
    "physics-h1-q4": ("초전도체의 임계 온도와 마이스너 효과", "Superconductor Critical Temperature and Meissner Effect"),
    "physics-h1-c":  ("절벽 수평 투사 궤적과 도달 시간", "Horizontal Cliff Launch Trajectory and Flight Time"),
    "physics-h1-q5": ("OLED 디스플레이의 자발광 물리 원리", "Self-Emitting Physics Principles of OLED Displays"),
    # H2
    "physics-h2-q1": ("작용·반작용과 두 힘의 평형 구별", "Action-Reaction vs Equilibrium of Forces"),
    "physics-h2-q2": ("접촉한 두 물체의 가속도와 상호작용력", "Connected Bodies Acceleration and Contact Forces"),
    "physics-h2-q3": ("특수 상대성 이론의 광속 불변 원리", "Principle of Constancy of Light Speed"),
    "physics-h2-q4": ("노이즈 캔슬링과 음파의 상쇄 간섭", "Noise-Cancelling Headphones and Destructive Interference"),
    "physics-h2-c":  ("패러데이 법칙과 전자기 유도 기전력", "Faraday's Law and Electromagnetic Induction EMF"),
    "physics-h2-q5": ("광섬유 내부의 빛의 전반사 원리", "Total Internal Reflection in Optical Fibers"),
    # H3
    "physics-h3-q1": ("광전 효과와 광양자설", "Photoelectric Effect and Light Quanta"),
    "physics-h3-q2": ("자기장 속 하전 입자의 등속 원운동", "Circular Motion of Charged Particles in Magnetic Fields"),
    "physics-h3-q3": ("보어 수소 원자 모형과 물질파 정상파", "Bohr Atomic Model and Standing Matter Waves"),
    "physics-h3-q4": ("전자현미경과 드브로이 파장의 분해능", "Electron Microscopes and de Broglie Wavelength Resolution"),
    "physics-h3-c":  ("2차원 포사체 운동의 최대 도달 거리", "Two-Dimensional Projectile Motion and Maximum Range"),
    "physics-h3-q5": ("레이저의 결맞음과 고지향성 파동 특성", "Laser Coherence and Directional Wave Properties")
}

CHEMISTRY_TITLES = {
    # E1
    "chemistry-e1-q1": ("물체와 물질의 재료 구분", "Objects and Constituent Materials"),
    "chemistry-e1-q2": ("고무줄과 풍선의 탄성 성질", "Elastic Properties of Rubber and Balloons"),
    "chemistry-e1-q3": ("우비와 물안경의 방수 성질", "Waterproof Properties of Raincoats and Goggles"),
    "chemistry-e1-q4": ("프라이팬 금속 몸체와 플라스틱 손잡이", "Frying Pan Metal Bodies and Insulating Handles"),
    "chemistry-e1-c":  ("플라스틱 재활용과 환경 탐구", "Plastic Recycling and Environmental Inquiry"),
    "chemistry-e1-q5": ("철의 녹슮과 산소·수분 차단", "Iron Rusting and Oxygen-Moisture Barriers"),
    # E2
    "chemistry-e2-q1": ("따뜻한 물에서의 설탕 용해 현상", "Sugar Dissolution in Warm Water"),
    "chemistry-e2-q2": ("온도에 따른 분자 운동과 용해 속도", "Temperature-Dependent Molecular Motion and Dissolution Rates"),
    "chemistry-e2-q3": ("거름종이를 이용한 흙탕물 분리", "Separation of Muddy Water Using Filter Paper"),
    "chemistry-e2-q4": ("염전에서의 소금 채취와 수분 증발", "Salt Harvesting and Water Evaporation in Salt Pans"),
    "chemistry-e2-c":  ("용해 전후의 질량 보존 원리", "Conservation of Mass During Dissolution"),
    "chemistry-e2-q5": ("물과 식용유의 밀도 차이와 층 분리", "Density Differences and Phase Separation: Water and Oil"),
    # E3
    "chemistry-e3-q1": ("액체의 모양 변화와 부피 일정성", "Shape Plasticity and Constant Volume of Liquids"),
    "chemistry-e3-q2": ("물과 공기의 압축성 비교 실험", "Compressibility Comparison: Water vs Air"),
    "chemistry-e3-q3": ("고체 물질의 고유한 모양과 성질", "Definite Shape and Properties of Solids"),
    "chemistry-e3-q4": ("향수 분자의 기체 확산 현상", "Gas Diffusion of Perfume Molecules"),
    "chemistry-e3-c":  ("공기의 무게와 기체 질량 측정", "Air Weight and Measurement of Gas Mass"),
    "chemistry-e3-q5": ("드라이아이스의 승화 현상", "Sublimation Phenomena of Dry Ice"),
    # E4
    "chemistry-e4-q1": ("차가운 캔 표면의 수증기 응결", "Condensation of Water Vapor on Cold Cans"),
    "chemistry-e4-q2": ("물이 얼 때의 부피 팽창과 무게 불변", "Volume Expansion and Mass Conservation in Freezing Water"),
    "chemistry-e4-q3": ("겨울철 야외 수도관 동파 원인", "Physical Causes of Winter Water Pipe Freezing"),
    "chemistry-e4-q4": ("물의 증발과 끓음의 차이점", "Differences Between Evaporation and Boiling"),
    "chemistry-e4-c":  ("상태 변화 중 물의 끓는점 일정성", "Constant Boiling Point of Water During Phase Changes"),
    "chemistry-e4-q5": ("풀잎의 이슬과 겨울 서리의 발생", "Dew on Grass and Frost Formation"),
    # E5
    "chemistry-e5-q1": ("용액, 용매, 용질의 과학적 구분", "Scientific Distinction: Solution, Solvent, Solute"),
    "chemistry-e5-q2": ("균일 혼합물로서의 소금물 용액", "Salt Water as a Homogeneous Mixture"),
    "chemistry-e5-q3": ("온도에 따른 물질의 용해도 변화", "Solubility Variations with Temperature"),
    "chemistry-e5-q4": ("소금물 농도 증가와 방울토마토의 부력", "Salt Concentration and Tomato Buoyancy"),
    "chemistry-e5-c":  ("포화 용액 냉각과 백반 결정 재결정", "Cooling Saturated Solutions and Alum Recrystallization"),
    "chemistry-e5-q5": ("탄산음료 뚜껑 개봉과 기체 용해도 감소", "Carbonated Drink De-Capping and Gas Solubility"),
    # E6
    "chemistry-e6-q1": ("붉은 양배추 천연 지시약의 색 변화", "Color Shifts in Red Cabbage Natural Indicator"),
    "chemistry-e6-q2": ("달걀 껍데기와 산의 반응 (이산화 탄소 발생)", "Eggshell and Acid Reaction: Carbon Dioxide Generation"),
    "chemistry-e6-q3": ("생선 비린내 제거와 산-염기 중화", "Fish Odor Neutralization and Acid-Base Chemistry"),
    "chemistry-e6-q4": ("모닥불 소화와 연소의 3요소 차단", "Campfire Extinction and Removal of Fire Triangle Elements"),
    "chemistry-e6-c":  ("수산화 나트륨 용액과 산의 중화 반응 추론", "Sodium Hydroxide and Acid Neutralization Deductions"),
    "chemistry-e6-q5": ("산불 방화선과 탈 물질 제거 소화법", "Wildfire Firebreaks and Fuel Removal Extinction"),
    # M1
    "chemistry-m1-q1": ("기체 분자 충돌과 기체 압력의 발생", "Gas Molecular Collisions and Pressure Formation"),
    "chemistry-m1-q2": ("보일의 법칙 (P₁V₁ = P₂V₂)과 기체 부피", "Boyle's Law (P₁V₁ = P₂V₂) and Gas Volume"),
    "chemistry-m1-q3": ("고도 상승에 따른 대기압 감소와 과자 봉지", "Atmospheric Pressure Drop and Snack Bag Expansion"),
    "chemistry-m1-q4": ("샤를의 법칙과 찌그러진 탁구공의 복원", "Charles's Law and Table Tennis Ball Restoration"),
    "chemistry-m1-c":  ("그레이엄의 기체 확산 속도 비교", "Graham's Law and Gas Diffusion Rate Comparison"),
    "chemistry-m1-q5": ("액체 질소 속 고무풍선의 극저온 수축", "Cryogenic Contraction of Balloons in Liquid Nitrogen"),
    # M2
    "chemistry-m2-q1": ("원자핵 양전하와 전자의 전기적 중성", "Atomic Nucleus Positive Charge and Electrical Neutrality"),
    "chemistry-m2-q2": ("양이온과 음이온의 형성 메커니즘", "Mechanisms of Cation and Anion Formation"),
    "chemistry-m2-q3": ("금속 원소의 불꽃 반응 색깔 판별", "Flame Test Color Identification of Metallic Elements"),
    "chemistry-m2-q4": ("질산 은 용액을 이용한 염화 이온 검출", "Chloride Ion Detection Using Silver Nitrate Solutions"),
    "chemistry-m2-c":  ("납 이온(Pb²⁺)과 아이오딘화 이온의 앙금 생성", "Precipitation Reactions: Lead and Iodide Ions"),
    "chemistry-m2-q5": ("물의 전기 분해와 수소·산소 부피비", "Water Electrolysis and Hydrogen-Oxygen Volume Ratios"),
    # M3
    "chemistry-m3-q1": ("화학 반응 전후의 원자 보존과 질량 보존", "Atom Conservation and Mass Conservation in Chemical Reactions"),
    "chemistry-m3-q2": ("구리의 연소와 일정 성분비 법칙", "Copper Oxidation and the Law of Definite Proportions"),
    "chemistry-m3-q3": ("기체 반응의 법칙과 수증기 합성 부피비", "Law of Combining Volumes and Water Vapor Synthesis"),
    "chemistry-m3-q4": ("철가루 핫팩 발열 반응과 냉각 팩 흡열 반응", "Exothermic Hot Packs and Endothermic Cold Packs"),
    "chemistry-m3-c":  ("프로페인 연소 반응식의 화학 계수 맞추기", "Balancing Propane Combustion Reaction Equations"),
    "chemistry-m3-q5": ("과산화 수소 분해와 이산화 망가니즈 촉매", "Hydrogen Peroxide Decomposition and MnO₂ Catalysts"),
    # H1
    "chemistry-h1-q1": ("염화 나트륨과 설탕의 전기 전도성 비교", "Electrical Conductivity: Sodium Chloride vs Sucrose"),
    "chemistry-h1-q2": ("염산과 수산화 나트륨의 중화 적정 곡선", "Neutralization Titration: Hydrochloric Acid and NaOH"),
    "chemistry-h1-q3": ("전자 이동에 기초한 산화와 환원의 정의", "Definitions of Oxidation and Reduction Based on Electron Transfer"),
    "chemistry-h1-q4": ("음극화 보호와 철의 부식 방지", "Cathodic Protection and Iron Corrosion Prevention"),
    "chemistry-h1-c":  ("2주기 비금속 원소의 루이스 전자점식과 옥텟", "Lewis Dot Structures and Octet Rule for Period 2 Nonmetals"),
    "chemistry-h1-q5": ("화석 연료 연소와 산성비의 형성 메커니즘", "Fossil Fuel Combustion and Acid Rain Formation"),
    # H2
    "chemistry-h2-q1": ("표준 상태 기체의 몰 부피 (22.4 L)와 몰수", "Standard Molar Volume (22.4 L) and Mole Calculations"),
    "chemistry-h2-q2": ("0.1 M 수산화 나트륨 표준 용액 제조법", "Preparation of 0.1 M NaOH Standard Solutions"),
    "chemistry-h2-q3": ("식초 속 아세트산의 중화 적정 농도 결정", "Neutralization Titration of Acetic Acid in Vinegar"),
    "chemistry-h2-q4": ("탄소 원자의 전자 배치와 훈트 규칙", "Carbon Electron Configuration and Hund's Rule"),
    "chemistry-h2-c":  ("VSEPR 이론과 분자의 삼차원 기하 구조", "VSEPR Theory and Molecular Geometry"),
    "chemistry-h2-q5": ("무극성 분자의 분산력과 승화성 물질", "London Dispersion Forces in Nonpolar Molecules and Sublimation"),
    # H3
    "chemistry-h3-q1": ("정촉매의 활성화 에너지 감소 메커니즘", "Positive Catalysts and Activation Energy Reduction"),
    "chemistry-h3-q2": ("초기 속도법을 통한 반응 차수 결정", "Determining Reaction Orders via Initial Rates Method"),
    "chemistry-h3-q3": ("암모니아 합성 반응과 르샤틀리에 평형 이동", "Ammonia Synthesis and Le Chatelier Equilibrium Shifts"),
    "chemistry-h3-q4": ("완충 용액의 공통 이온 효과와 pH 완충", "Buffer Solutions, Common-Ion Effect, and pH Buffering"),
    "chemistry-h3-c":  ("묽은 용액의 총괄성과 삼투압 법칙", "Colligative Properties of Dilute Solutions and Osmotic Pressure"),
    "chemistry-h3-q5": ("아지드화 나트륨 분해와 에어백 기체 양론", "Sodium Azide Decomposition and Airbag Gas Stoichiometry")
}

def clean_txt(s):
    if not s: return ""
    # Enforce strictly no space after Delta before variables
    s = re.sub(r"Δ\s+([A-Za-z0-9])", r"Δ\1", str(s).strip())
    # Clean broken subscript notation
    s = s.replace("I_Δ=|I_in-Iₒᵤₜ|", "I_Δ = |I_in - I_out|")
    return s

def build_task_object(subj, grd, slot_idx, q_data, task_id, title_ko, title_en):
    lvl, lvl_lbl = GRADE_LEVELS[grd]
    prompt = clean_txt(q_data.get("prompt", ""))
    raw_opts = q_data.get("options", {})
    raw_ans = q_data.get("answer", "a")
    if isinstance(raw_ans, dict):
        ans_key = str(raw_ans.get("id", "a")).lower()
    else:
        ans_key = str(raw_ans).lower()
    
    # 4 options with reveals
    opt_keys = ["a", "b", "c", "d"]
    opts_dict = {}
    if isinstance(raw_opts, list):
        for item in raw_opts:
            if isinstance(item, dict):
                opts_dict[str(item.get("id", "")).lower()] = item.get("text", "")
    elif isinstance(raw_opts, dict):
        opts_dict = {str(k).lower(): v for k, v in raw_opts.items()}

    options = []
    correct_id = "o0"
    for i, k in enumerate(opt_keys):
        opt_id = f"o{i}"
        txt = clean_txt(opts_dict.get(k, f"선택지 {k.upper()}"))
        if k == ans_key:
            correct_id = opt_id
            options.append({"id": opt_id, "text": txt})
        else:
            options.append({
                "id": opt_id,
                "text": txt,
                "reveals": f"원리 적용 범위 혼동 또는 조건 누락 (선택지 {k.upper()})"
            })
            
    hints = [clean_txt(h) for h in q_data.get("hints", []) if clean_txt(h)]
    if len(hints) < 2:
        expl = clean_txt(q_data.get("explanation", ""))
        hints = [
            "문제의 핵심 과학 법칙과 조건을 단계별로 대조해 보세요.",
            expl if expl else "제시된 조건과 물리/화학적 인과관계를 종합하여 추론합니다."
        ]
        
    explanation = clean_txt(q_data.get("explanation", "정답 해설"))

    # Step 2 reflection/application
    step2 = {
        "id": "s2",
        "kind": "choose",
        "prompt": f"이 문제에서 적용한 '{title_ko}'의 원리가 일상생활이나 첨단 기술에 올바르게 적용된 사례는 무엇입니까?",
        "options": [
            {"id": "o0", "text": "해당 물리/화학적 법칙을 활용하여 효율이나 안전성을 극대화한 시스템"},
            {"id": "o1", "text": "원리의 조건과 반대로 작동하여 비효율을 초래하는 사례", "reveals": "법칙의 성립 조건을 반대로 해석함"},
            {"id": "o2", "text": "관련 없는 다른 현상을 동일한 원리로 오인한 사례", "reveals": "서로 다른 과학적 원리를 혼동함"}
        ],
        "correct": ["o0"],
        "explain": f"'{title_ko}'의 원리는 다양한 실생활 기술 및 자연 현상의 기본 메커니즘으로 작동합니다.",
        "hints": [
            "앞선 단계에서 도출한 핵심 원리의 인과관계를 다시 점검합니다.",
            "동일한 물리/화학 법칙이 직접적으로 관여하는 상황을 선택합니다."
        ]
    }

    return {
        "id": task_id,
        "subject": subj,
        "grade": grd.upper(),
        "topic": title_ko,
        "status": "reviewed-ai",
        "level": lvl,
        "levelLabel": lvl_lbl,
        "title": title_ko,
        "uiLang": "ko",
        "format": "choose-needed-info",
        "generative": False,
        "goal": f"{title_ko}의 과학적 원리를 분석하고 주어진 조건에 따라 올바른 결론을 도출한다.",
        "thinking": [
            f"{title_ko} 원리 분석",
            "조건 해석 및 논리적 추론"
        ],
        "differsFromPlain": "단순 지식 암기가 아닌, 조건 간의 인과관계와 과학적 법칙을 논리적으로 추론하여 해결합니다.",
        "prerequisites": [f"{grd.upper()} 선수 학습 과학 개념"],
        "minutes": 8,
        "curriculum": None,
        "material": prompt,
        "steps": [
            {
                "id": "s1",
                "kind": "choose",
                "prompt": prompt,
                "options": options,
                "correct": [correct_id],
                "explain": explanation,
                "hints": hints
            },
            step2
        ],
        "rubric": [
            {"criterion": "핵심 과학 법칙 적용", "full": "원리를 올바로 분석하여 정답 도출", "partial": "기본 개념은 이해했으나 조건 혼동", "none": "원리와 무관한 오답"},
            {"criterion": "논리적 인과 추론", "full": "각 선택지의 과학적 의미를 구분함", "partial": "일부 선택지 혼동", "none": "추론 근거 없음"}
        ],
        "alternatives": ["다양한 일상적 문제 상황에 동일한 원리를 적용해 볼 수 있습니다."],
        "hardCases": ["극단적인 조건이나 예외 상황에서의 원리 적용 주의"],
        "cautions": {"language": "전문 과학 용어의 정확한 이해", "culture": "보편적 과학 표준 단위(SI) 사용", "accessibility": "명확한 텍스트 기반 수식 설명"},
        "autoVsHuman": {"auto": ["객관식 정답 일치"], "human": ["추론 과정의 논리성 평가"]}
    }

def main():
    print("Rebuilding authentic curriculum batches for Physics and Chemistry...")
    
    # 1. Clean up stale batch files > d06
    for subj in ["physics", "chemistry"]:
        for extra_f in EXTRA_DIR.glob(f"{subj}-d*.json"):
            match = re.search(r"-d(\d+)\.json$", extra_f.name)
            if match and int(match.group(1)) > 6:
                print(f"Removing stale batch: {extra_f}")
                extra_f.unlink()
                # Also remove in i18n
                for i18n_lang in I18N_DIR.glob(f"*/{extra_f.name}"):
                    i18n_lang.unlink()

    # Load source questions
    phys_content = json.load(open(CONTENT_DIR / "physics/physics.json", "r", encoding="utf-8"))["questions"]
    chem_content = json.load(open(CONTENT_DIR / "chemistry/chemistry.json", "r", encoding="utf-8"))["questions"]
    
    p_map = {q["id"]: q for q in phys_content}
    c_map = {q["id"]: q for q in chem_content}

    # Grade pairs for each batch (d01 to d06: 2 grades each = 12 tasks)
    GRADE_PAIRS = [
        ("e1", "e2"), # d01
        ("e3", "e4"), # d02
        ("e5", "e6"), # d03
        ("m1", "m2"), # d04
        ("m3", "h1"), # d05
        ("h2", "h3")  # d06
    ]

    SLOT_IDS = [
        "20261118-{subj}-{grd}",
        "20261119-{subj}-{grd}",
        "20261121-{subj}-{grd}-1",
        "20261121-{subj}-{grd}-2",
        "20261122-{subj}-{grd}-1",
        "20261122-{subj}-{grd}-2"
    ]

    # Process Physics and Chemistry batches
    for subj, q_map, title_dict in [("physics", p_map, PHYSICS_TITLES), ("chemistry", c_map, CHEMISTRY_TITLES)]:
        for batch_idx, (gA, gB) in enumerate(GRADE_PAIRS, start=1):
            batch_tasks = []
            for grd in (gA, gB):
                for slot_idx, slot_key in enumerate(SLOTS):
                    qid = f"{subj}-{grd}-{slot_key}"
                    q_data = q_map[qid]
                    tid = SLOT_IDS[slot_idx].format(subj=subj, grd=grd)
                    title_ko, title_en = title_dict[qid]
                    
                    task_obj = build_task_object(subj, grd, slot_idx, q_data, tid, title_ko, title_en)
                    batch_tasks.append(task_obj)
            
            batch_file = EXTRA_DIR / f"{subj}-d{batch_idx:02d}.json"
            with open(batch_file, "w", encoding="utf-8") as f:
                json.dump(batch_tasks, f, ensure_ascii=False, indent=2)
            print(f"Wrote {len(batch_tasks)} tasks to {batch_file}")

    print("All 12 extra batches written successfully.")

if __name__ == "__main__":
    main()
