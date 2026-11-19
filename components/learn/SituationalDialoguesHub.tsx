"use client";

import { useState } from "react";
import Link from "next/link";
import { useLearner } from "./LearnerProvider";
import {
  CATEGORY_INFO,
  getAllSituationalDialogues,
  getCategoryList,
  type SituationCategory,
  type SituationalDialogue,
} from "@/lib/learn/content/dialogues";

// 19대 실생활 상황별 한국어 전통 풍류원 전각 명칭
const KOREAN_LANDMARK_NAMES: Record<SituationCategory, { name: string; phase: string[] }> = {
  hospital: { name: "혜민서(惠民署) 지혜 약원", phase: ["초석 다지기", "문진 처마", "동의보감 서가", "달임 온돌방", "혜민 완원"] },
  airport: { name: "관문(關門) 나루터와 풍류 누각", phase: ["나루터 초석", "출도 관문", "순풍 돛대", "풍류 누각", "천리마루 완공"] },
  store: { name: "육의전(六矣廛) 전통 저잣거리", phase: ["상전 주춧돌", "비단 서까래", "되·말 계측대", "청사초롱 처마", "저잣거리 대성"] },
  classroom: { name: "성균관(成均館) 명륜당 글방", phase: ["학사 기단", "명륜 대들보", "지필묵 서탁", "훈장 강론대", "대성지학 완공"] },
  amusement_park: { name: "남사당패 신명놀이 한마당", phase: ["놀이마당 다지기", "버나 줄타기 기둥", "탈춤 무대", "오색 차양", "신명놀이 대향연"] },
  restaurant: { name: "수라간(水剌間) 궁중 미식원", phase: ["가마솥 화덕", "옹기 장독대", "칠첩반상 찬마루", "단청 다이닝홀", "수라 진미각 완공"] },
  wedding: { name: "동심결(同心結) 전통 가례청", phase: ["초례청 기단", "기러기 전안상", "청실홍실 아치", "백년가약 처마", "화합 가례청 완공"] },
  hotel: { name: "구름 머무는 한옥 고택 별서", phase: ["다듬돌 초석", "소나무 기둥", "창호지 문살", "툇마루 쉼터", "고택 별서 완공"] },
  transport: { name: "역참(驛站) 천리길 모빌리티 허브", phase: ["역로 다지기", "마패 교환처", "나그네 쉼터", "봉수 통신망", "천리길 역참 완공"] },
  bank: { name: "호조(戶曹) 상평통보 신용관", phase: ["금고 암반석", "철제 빗장문", "상평 환전대", "공정 장부각", "신용 보물각 완공"] },
  post_office: { name: "파발(擺撥) 통신 소통소", phase: ["우편마루 기단", "서신 분류함", "봉인 날인대", "파발 쾌도", "소통 만리원 완공"] },
  housing: { name: "배산임수(背山臨水) 안식 사랑채", phase: ["풍수 터다지기", "느티나무 대들보", "단열 황토벽", "마당 연못", "평온 안식채 완공"] },
  public_office: { name: "열린 애민(愛民) 목민관 청사", phase: ["공민 기단", "신문고 루각", "열린 민원마루", "공명정대 처마", "애민 청사 완공"] },
  workplace: { name: "규장각(奎章閣) 집현전 학사관", phase: ["집현 주춧돌", "토론 서원마루", "문헌 열람실", "발명품 전각", "규장각 집현관 완공"] },
  salon: { name: "단장과 맵시의 미(美) 공방", phase: ["경대 초석", "동백기름 진열대", "자개 거울실", "비단 옷고름방", "미(美) 공방 완공"] },
  lost_found: { name: "안심 신문고 유실물 보호소", phase: ["보호소 기단", "정밀 보관함", "신원 확인창구", "안심 인도대", "상부상조 복원소"] },
  fitness: { name: "수박도(手搏圖) 기운생동 무예관", phase: ["연무장 마루", "목검·궁시 시렁", "단전호흡 좌대", "기백 활터", "기운생동 무예관"] },
  library_museum: { name: "장서각(藏書閣) 국보 문화원", phase: ["방화 석축", "오동나무 보관함", "훈민정음 특별실", "디지털 열람루", "장서각 대성"] },
  car_rental: { name: "어사마(御使馬) 친환경 마방", phase: ["마방 초석", "전동마차 충전소", "여정 지도실", "안전 점검장", "모빌리티 마방 완공"] },
};

// 19대 실생활 상황별 영어 글로벌 오디세이 게이트웨이 명칭
const ENGLISH_GATEWAY_NAMES: Record<SituationCategory, { name: string; phase: string[] }> = {
  hospital: { name: "Johns Hopkins Global Medical Hub", phase: ["Reception Desk", "Outpatient Wing", "Digital Pharmacy", "Intensive Care Bay", "Medical Hub Complete"] },
  airport: { name: "JFK & Heathrow Sky Gateway", phase: ["Runway Base", "Check-in Concourse", "Baggage Loop", "Immigration Gate", "Sky Hub Grand Open"] },
  store: { name: "5th Avenue Green Market Plaza", phase: ["Retail Plinth", "Smart Display Aisles", "Cashier Consoles", "Customer Plaza", "Plaza Complete"] },
  classroom: { name: "Oxford & Harvard Academic Hall", phase: ["Foundation Floor", "Interactive Smartboard", "Seminar Dais", "Research Archives", "Academic Hall Complete"] },
  amusement_park: { name: "Orlando Wonderland Theme Park", phase: ["Park Foundation", "Attraction Rail", "Parade Boulevard", "Express Ticketing", "Wonderland Grand Opening"] },
  restaurant: { name: "Michelin Star World Gourmet Bistro", phase: ["Kitchen Base", "Chef Prep Station", "Order Console", "Dining Hall", "Bistro Complete"] },
  wedding: { name: "St. Paul Grand Nuptial Chapel", phase: ["Chapel Base", "Aisle Floral Arch", "Pipe Organ Acoustic", "Banquet Reception", "Chapel Complete"] },
  hotel: { name: "Ritz-Carlton Eco Grand Resort", phase: ["Lobby Floor", "Suite Room Wing", "Infinity Pool", "Sky Lounge", "Grand Resort Complete"] },
  transport: { name: "Grand Central Metro Transit Hub", phase: ["Platform Base", "Rail Network", "Transit Turnstiles", "Grand Concourse", "Transit Hub Complete"] },
  bank: { name: "Wall Street FinTech & Global Bank", phase: ["Vault Bedrock", "Exchange Counter", "FinTech Server Core", "Private Advisory", "Wall St Tower Complete"] },
  post_office: { name: "Universal Global Express Hub", phase: ["Logistics Base", "Barcode Scanner Line", "Air Mail Conveyor", "Customer Pick-up", "Express Hub Complete"] },
  housing: { name: "Manhattan Green Eco Residence", phase: ["Residential Base", "Eco Exterior Cladding", "Smart Home Core", "Rooftop Garden", "Residence Complete"] },
  public_office: { name: "Capitol Civic & International Center", phase: ["Civic Plinth", "Service Counters", "Document Kiosk", "Public Council Chamber", "Civic Center Complete"] },
  workplace: { name: "Silicon Valley Global Tech Tower", phase: ["Tower Base", "Coworking Lounge", "Teleconference Suite", "Cloud Innovation Lab", "Tech Tower Complete"] },
  salon: { name: "Bond Street London Style Studio", phase: ["Salon Base", "Styling Mirror Station", "Shampoo Relax Zone", "Color Design Bar", "Studio Complete"] },
  lost_found: { name: "Metropolitan Care & Found Sanctuary", phase: ["Care Foundation", "Smart Security Lockers", "Registration Desk", "Return Lounge", "Sanctuary Complete"] },
  fitness: { name: "Olympic World Wellness Complex", phase: ["Gym Floor", "Cardio Track Lanes", "Power Weight Area", "Locker Suite", "Sports Complex Complete"] },
  library_museum: { name: "British Museum & Library Archive", phase: ["Museum Plinth", "Artifact Showcase", "Climate Vault", "Digital Reading Room", "Archive Complete"] },
  car_rental: { name: "Eco Green Global Mobility Fleet", phase: ["Fleet Plinth", "EV Charging Docks", "Mobile Contract Kiosk", "Inspection Lane", "Fleet Hub Complete"] },
};

export function SituationalDialoguesHub() {
  const { site, href } = useLearner();
  const [selectedCat, setSelectedCat] = useState<SituationCategory | "all">("all");

  if (site !== "english" && site !== "korean") return null;

  const isKorean = site === "korean";
  const categories = getCategoryList();
  const allDialogues = getAllSituationalDialogues(site);

  const filtered =
    selectedCat === "all"
      ? allDialogues
      : allDialogues.filter((d) => d.category === selectedCat);

  return (
    <section
      className="l-card l-stack"
      style={{
        marginTop: "1.5rem",
        marginBottom: "1.5rem",
        background: isKorean
          ? "linear-gradient(135deg, rgba(236, 253, 245, 0.85) 0%, rgba(240, 253, 250, 0.85) 100%)"
          : "linear-gradient(135deg, rgba(238, 242, 255, 0.85) 0%, rgba(245, 243, 255, 0.85) 100%)",
        border: isKorean ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(99, 102, 241, 0.4)",
        borderRadius: "18px",
        padding: "1.5rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
      }}
      aria-labelledby="situational-dialogues-title"
    >
      {/* Subject Distinct Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: isKorean ? "rgba(5, 150, 105, 0.15)" : "rgba(79, 70, 229, 0.15)",
                color: isKorean ? "#059669" : "#4f46e5",
              }}
            >
              {isKorean ? "K-HERITAGE SYSTEM" : "GLOBAL ODYSSEY SYSTEM"}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              {isKorean ? "19대 전각 · 57편 에피소드" : "19 Gateways · 57 Episodes"}
            </span>
          </div>

          <h2 id="situational-dialogues-title" className="l-h2" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{isKorean ? "🏛️" : "🧭"}</span>
            <span>
              {isKorean
                ? "아름다운 우리말 19대 한옥 풍류원 & 훈민 서화 두루마리"
                : "Global Odyssey 19 World Flight Gateways & Boarding Pass"}
            </span>
          </h2>
          <p className="l-muted" style={{ margin: "0.35rem 0 0 0", fontSize: "0.92rem", lineHeight: 1.5 }}>
            {isKorean
              ? "전통 한옥의 기단 다지기부터 오색 단청 채색까지, 19대 실생활 상황별로 품격 있는 우리말을 익히고 문화의 미학을 완성하세요."
              : "Navigate 19 world metropolises from takeoff to 30,000ft cruising altitude. Master fluent situational communication across global gateways."}
          </p>
        </div>
      </div>

      {/* 4 Unique Gameplay Pillars Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          margin: "1rem 0",
          padding: "1rem",
          backgroundColor: isKorean ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.8)",
          borderRadius: "12px",
          border: isKorean ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(99, 102, 241, 0.25)",
        }}
      >
        {isKorean ? (
          <>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>🏛️</span>
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#065f46" }}>전통 한옥 결구</strong>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                  초석 다지기부터 오색 단청 채색까지 5단계 건축
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>🪕</span>
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#065f46" }}>풍류와 흥(興) 가락</strong>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                  3연속 정답 시 가야금·대금 하모니 & 단청 보너스
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>📜</span>
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#065f46" }}>훈민 비단 두루마리</strong>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                  핵심 격식·존댓말 표현을 서화 도감에 평생 소장
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>🎖️</span>
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#065f46" }}>어사화 옥인장</strong>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                  19대 전각 완공 시 수여되는 우리말 최고 명인 배지
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>🛫</span>
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#3730a3" }}>Transcontinental Flight</strong>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                  Advance from takeoff roll to 30,000ft cruising orbit
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>⚡</span>
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#3730a3" }}>Jetstream Boost</strong>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                  3 accurate answers trigger jetstream tailwind altitude
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>🎫</span>
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#3730a3" }}>World Boarding Pass</strong>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                  Collect native spoken expressions into travel codex
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>🎖️</span>
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#3730a3" }}>Global Captain Wings</strong>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                  Complete all 19 gateways for international certification
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "0.5rem 0 1rem 0" }}>
        <button
          type="button"
          onClick={() => setSelectedCat("all")}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: "20px",
            border: selectedCat === "all"
              ? isKorean ? "1.5px solid #059669" : "1.5px solid #4f46e5"
              : "1px solid #cbd5e1",
            backgroundColor: selectedCat === "all"
              ? isKorean ? "#059669" : "#4f46e5"
              : "#ffffff",
            color: selectedCat === "all" ? "#ffffff" : "#334155",
            fontWeight: selectedCat === "all" ? 600 : 400,
            cursor: "pointer",
            fontSize: "0.85rem",
            transition: "all 0.15s ease",
          }}
        >
          {isKorean ? `전체 전각 보기 (${allDialogues.length})` : `All Gateways (${allDialogues.length})`}
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "20px",
                border: isSelected
                  ? isKorean ? "1.5px solid #059669" : "1.5px solid #4f46e5"
                  : "1px solid #cbd5e1",
                backgroundColor: isSelected
                  ? isKorean ? "#059669" : "#4f46e5"
                  : "#ffffff",
                color: isSelected ? "#ffffff" : "#334155",
                fontWeight: isSelected ? 600 : 400,
                cursor: "pointer",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "all 0.15s ease",
              }}
            >
              <span>{cat.emoji}</span>
              <span>{isKorean ? cat.nameKo : cat.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* Dialogue Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: "1.1rem",
        }}
      >
        {filtered.map((dlg) => (
          <DialogueCard key={dlg.id} dlg={dlg} href={href} site={site} isKorean={isKorean} />
        ))}
      </div>
    </section>
  );
}

function DialogueCard({
  dlg,
  href,
  site,
  isKorean,
}: {
  dlg: SituationalDialogue;
  href: (path: string) => string;
  site: string;
  isKorean: boolean;
}) {
  const lessonPath = href(`/lesson/lesson-${dlg.id}`);
  const catInfo = CATEGORY_INFO[dlg.category];
  const displayImage = dlg.imageUrl || catInfo?.imageUrl;

  const koreanLandmark = KOREAN_LANDMARK_NAMES[dlg.category];
  const englishGateway = ENGLISH_GATEWAY_NAMES[dlg.category];

  const phaseStep = Math.min(5, Math.max(1, dlg.difficulty));
  const phaseName = isKorean
    ? koreanLandmark?.phase[phaseStep - 1] || "기단 다지기"
    : englishGateway?.phase[phaseStep - 1] || "Takeoff Roll";

  const progressPct = phaseStep * 20;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: isKorean ? "1px solid #d1fae5" : "1px solid #e0e7ff",
        borderRadius: "14px",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div>
        {displayImage && (
          <div
            style={{
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "0.75rem",
              height: "140px",
              backgroundColor: isKorean ? "#f0fdf4" : "#f5f3ff",
              position: "relative",
            }}
          >
            <img
              src={displayImage}
              alt={isKorean ? dlg.titleKo : dlg.titleEn}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
            />
            {/* Subject Heritage Badge Overlay */}
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(4px)",
                color: isKorean ? "#34d399" : "#818cf8",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{isKorean ? "🏛️" : "🛫"}</span>
              <span>
                {isKorean
                  ? koreanLandmark?.name || dlg.locationKo
                  : englishGateway?.name || dlg.locationEn}
              </span>
            </div>
          </div>
        )}

        {/* Phase & Grade Scope */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.2rem 0.55rem",
              borderRadius: "6px",
              backgroundColor: isKorean ? "rgba(16, 185, 129, 0.12)" : "rgba(99, 102, 241, 0.12)",
              color: isKorean ? "#047857" : "#4338ca",
            }}
          >
            {isKorean ? `제${phaseStep}공정: ${phaseName}` : `Phase ${phaseStep}: ${phaseName}`}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
            {dlg.gradeScope}
          </span>
        </div>

        {/* Mini Progress Bar */}
        <div style={{ marginBottom: "0.75rem" }}>
          <div
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: "#f1f5f9",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: isKorean
                  ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)",
                borderRadius: 3,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
          {isKorean ? dlg.titleKo : dlg.titleEn}
        </h3>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>
          {isKorean ? dlg.titleEn : dlg.titleKo}
        </p>

        {/* Preview of first turn */}
        {dlg.turns[0] && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: isKorean ? "#f0fdf4" : "#f8fafc",
              borderRadius: "8px",
              fontSize: "0.82rem",
              color: "#334155",
              border: isKorean ? "1px solid #d1fae5" : "1px solid #e2e8f0",
            }}
          >
            <strong style={{ color: isKorean ? "#065f46" : "#312e81" }}>
              {dlg.turns[0].speakerRole ?? dlg.turns[0].speaker}:
            </strong>{" "}
            “{dlg.turns[0].text}”
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
          {isKorean ? "📜 서화 두루마리 소장" : "🎫 Boarding Pass Stamp"}
        </span>
        <Link
          href={lessonPath}
          style={{
            display: "inline-block",
            padding: "0.45rem 1rem",
            backgroundColor: isKorean ? "#059669" : "#4f46e5",
            color: "#ffffff",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 700,
            textAlign: "center",
            boxShadow: isKorean ? "0 2px 6px rgba(5, 150, 105, 0.25)" : "0 2px 6px rgba(79, 70, 229, 0.25)",
          }}
        >
          {isKorean ? "대화 학습 & 전각 축조 →" : "Start Flight Dialogue →"}
        </Link>
      </div>
    </div>
  );
}
