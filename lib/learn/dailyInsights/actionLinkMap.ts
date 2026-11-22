import { DailyInsight } from "./types";

/**
 * Maps daily insight topics or action items to verified official authoritative websites
 * (e.g. South Korea central government portals, official agencies, statutory public bodies).
 */
export function resolveActionLink(insight: DailyInsight | null | undefined): string | null {
  if (!insight) return null;

  const id = insight.id || "";
  const title = (insight.title || "").toLowerCase();
  const action = (insight.actionItem || "").toLowerCase();
  const example = (insight.example || "").toLowerCase();
  const combined = `${title} ${action} ${example}`;

  // 1. Explicit domain / URL mention in text
  const urlMatch = combined.match(/https?:\/\/[^\s)\]]+|(?:[a-z0-9-]+\.)*(?:work24\.go\.kr|hometax\.go\.kr|gov\.kr|bokjiro\.go\.kr|korea-pass\.kr|pay\.tmoney\.co\.kr|k-gascashback\.or\.kr|cardpoint\.or\.kr|kinfa\.or\.kr|nhis\.or\.kr|csa\.nps\.or\.kr|iros\.go\.kr|ecfs\.scourt\.go\.kr|klac\.or\.kr|consumer\.go\.kr|airport\.kr|passport\.go\.kr|ei\.go\.kr|donotcall\.go\.kr|floor\.noiseinfo\.or\.kr|cpoint\.or\.kr|e-gen\.or\.kr|15440997\.or\.kr|cyber\.kepco\.co\.kr|efine\.go\.kr|safetyreport\.go\.kr|kosaf\.go\.kr|q-net\.or\.kr|payinfo\.or\.kr)/i);
  if (urlMatch) {
    const raw = urlMatch[0];
    if (raw.startsWith("http")) return raw;
    return `https://${raw}`;
  }

  // 2. High-precision canonical topic ID mapping
  // Employment 24 / Worknet / National Employment Support Program / Vocational training
  if (
    /^(?:l-(?:003|039|075|111|147|183|219|255|291|327|363)|l-(?:009|045|081|117|153|189|225|261|297|333)|k-(?:027|063|099|135|171|207|243|279|315|351))$/.test(id)
  ) {
    return "https://www.work24.go.kr";
  }

  // National Tax Service (Hometax) / Year-End Tax Settlement / Withholding Receipt / ISA / IRP
  if (
    /^(?:l-(?:001|037|073|109|145|181|217|253|289|325|361)|l-(?:015|051|087|123|159|195|231|267|303|339))$/.test(id)
  ) {
    return "https://www.hometax.go.kr";
  }

  // Government 24 / Bojogum 24
  if (
    /^(?:l-(?:026|062|098|134|170|206|242|278|314|350))$/.test(id)
  ) {
    return "https://www.gov.kr";
  }

  // K-Pass / Climate Card
  if (
    /^(?:l-(?:005|041|077|113|149|185|221|257|293|329|365))$/.test(id)
  ) {
    return "https://korea-pass.kr";
  }

  // Leasehold Registration / Court Registry (IROS)
  if (
    /^(?:l-(?:006|042|078|114|150|186|222|258|294|330|366))$/.test(id)
  ) {
    return "http://www.iros.go.kr";
  }

  // Korea Inclusive Finance Agency (Youth Leap Account)
  if (
    /^(?:l-(?:007|043|079|115|151|187|223|259|295|331))$/.test(id)
  ) {
    return "https://www.kinfa.or.kr";
  }

  // City Gas Cashback (K-Gas)
  if (
    /^(?:l-(?:008|044|080|116|152|188|224|260|296|332))$/.test(id)
  ) {
    return "https://k-gascashback.or.kr";
  }

  // Incheon Airport SmartPass
  if (
    /^(?:l-(?:011|047|083|119|155|191|227|263|299|335))$/.test(id)
  ) {
    return "https://www.airport.kr";
  }

  // Consumer 24 (1372 Consumer Counseling Center)
  if (
    /^(?:l-(?:012|048|084|120|156|192|228|264|300|336))$/.test(id)
  ) {
    return "https://www.consumer.go.kr";
  }

  // Ministry of Foreign Affairs - Passport Portal
  if (
    /^(?:l-(?:023|059|095|131|167|203|239|275|311|347))$/.test(id)
  ) {
    return "https://www.passport.go.kr";
  }

  // Unemployment Benefit / Employment Insurance (EI)
  if (
    /^(?:l-(?:027|063|099|135|171|207|243|279|315|351))$/.test(id)
  ) {
    return "https://www.ei.go.kr";
  }

  // Card Point Integrated Cash-in (CREFIA)
  if (
    /^(?:l-(?:032|068|104|140|176|212|248|284|320|356))$/.test(id)
  ) {
    return "https://www.cardpoint.or.kr";
  }

  // KEPCO Energy Cashback (Smart KEPCO)
  if (
    /^(?:l-(?:018|054|090|126|162|198|234|270|306|342))$/.test(id)
  ) {
    return "https://cyber.kepco.co.kr";
  }

  // Do Not Call (Anti-Spam)
  if (
    /^(?:l-(?:019|055|091|127|163|199|235|271|307|343))$/.test(id)
  ) {
    return "https://www.donotcall.go.kr";
  }

  // Inter-floor Noise Center
  if (
    /^(?:l-(?:034|070|106|142|178|214|250|286|322|358))$/.test(id)
  ) {
    return "https://floor.noiseinfo.or.kr";
  }

  // 3. Keyword-based authoritative fallback mapping
  if (combined.includes("고용24") || combined.includes("워크넷") || combined.includes("worknet") || combined.includes("employment24") || combined.includes("취업지원제도") || combined.includes("내일배움카드")) {
    return "https://www.work24.go.kr";
  }
  if (combined.includes("홈택스") || combined.includes("hometax") || combined.includes("연말정산") || combined.includes("근로소득원천징수영수증")) {
    return "https://www.hometax.go.kr";
  }
  if (combined.includes("정부24") || combined.includes("보조금24")) {
    return "https://www.gov.kr";
  }
  if (combined.includes("복지로") || combined.includes("bokjiro")) {
    return "https://www.bokjiro.go.kr";
  }
  if (combined.includes("k-패스") || combined.includes("k-pass") || combined.includes("케이패스")) {
    return "https://korea-pass.kr";
  }
  if (combined.includes("기후동행카드") || combined.includes("티머니")) {
    return "https://pay.tmoney.co.kr";
  }
  if (combined.includes("도시가스 캐시백") || combined.includes("가스캐시백")) {
    return "https://k-gascashback.or.kr";
  }
  if (combined.includes("카드포인트") || combined.includes("cardpoint")) {
    return "https://www.cardpoint.or.kr";
  }
  if (combined.includes("서민금융진흥원") || combined.includes("청년도약계좌")) {
    return "https://www.kinfa.or.kr";
  }
  if (combined.includes("임차권등기") || combined.includes("인터넷등기소")) {
    return "http://www.iros.go.kr";
  }
  if (combined.includes("스마트패스") || combined.includes("인천공항")) {
    return "https://www.airport.kr";
  }
  if (combined.includes("1372") || combined.includes("소비자상담") || combined.includes("소비자24")) {
    return "https://www.consumer.go.kr";
  }
  if (combined.includes("여권") && (combined.includes("갱신") || combined.includes("발급") || combined.includes("만료"))) {
    return "https://www.passport.go.kr";
  }
  if (combined.includes("실업급여") || combined.includes("고용보험")) {
    return "https://www.ei.go.kr";
  }
  if (combined.includes("국민연금") || combined.includes("내연금")) {
    return "https://csa.nps.or.kr";
  }
  if (combined.includes("건강보험") || combined.includes("본인부담상한제")) {
    return "https://www.nhis.or.kr";
  }
  if (combined.includes("전자소송")) {
    return "https://ecfs.scourt.go.kr";
  }
  if (combined.includes("법률구조공단")) {
    return "https://www.klac.or.kr";
  }
  if (combined.includes("응급의료") || combined.includes("e-gen")) {
    return "https://www.e-gen.or.kr";
  }
  if (combined.includes("장사정보") || combined.includes("e-하늘")) {
    return "https://www.15440997.or.kr";
  }
  if (combined.includes("탄소중립포인트")) {
    return "https://cpoint.or.kr";
  }

  return null;
}
