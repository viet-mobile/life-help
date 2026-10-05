import { T, NAMES, join } from "../util.mjs";
import { F, READ, usd, hm, dateStr, addDays } from "./english-a.mjs";

const SCAN = [T("질문이 묻는 조건이 몇 개인지 세고, 글에서 하나씩 확인해요.", "Đếm xem câu hỏi có bao nhiêu điều kiện rồi kiểm tra từng điều kiện trong văn bản."), T("‘unless, only if, except’ 같은 말은 조건을 뒤집거나 좁혀요.", "Những từ như ‘unless, only if, except’ đảo ngược hoặc thu hẹp điều kiện.")];
const NUM = T("(숫자만 쓰세요)", "(chỉ nhập số)");

/* ------------------------------------------------------------ 4. policies and eligibility */
const SHOPS = ["BrightMart", "Pixel Store", "Greenfield Books", "UrbanWear"];
export const policy = {
  id: "policy-eligibility", short: "pol", cognitive: "ANALYZE", levels: [4, 9], title: T("약관·규정 해석하기", "Hiểu điều khoản và quy định"),
  make(rand, level) {
    const shop = rand.pick(SHOPS), who = rand.pick(NAMES), base = new Date(Date.UTC(2026, rand.int(0, 8), rand.int(1, 18)));
    const sayYes = (why) => `Yes. ${why}`, sayNo = (why) => `No. ${why}`;
    if (level === 4) { const N = rand.pick([14, 30]), k = rand.int(5, N + 15), ok = k <= N; const right = ok ? sayYes(`It is within ${N} days of delivery.`) : sayNo(`It is more than ${N} days after delivery.`); return { type: "multiple_choice", prompt: READ(`${shop} return policy | Items can be returned within ${N} days of delivery.`.concat(` | ${who}'s order was delivered on ${dateStr(base)}. ${who} wants to return it on ${dateStr(addDays(base, k))}.`), `Can ${who} return the item?`), right, wrong: [ok ? sayNo(`It is more than ${N} days after delivery.`) : sayYes(`It is within ${N} days of delivery.`), sayYes("There is no time limit."), sayNo("Items can never be returned.")], hints: [T("배송일부터 반품일까지 며칠인지 먼저 세요.", "Trước hết đếm từ ngày giao đến ngày muốn trả là bao nhiêu ngày."), SCAN[1]], expl: T(`배송 후 ${k}일 → 기준 ${N}일 ${ok ? "이내" : "초과"}`, `${k} ngày sau khi giao → ${ok ? "trong" : "quá"} hạn ${N} ngày`), tags: ["reading", "reasoning"], features: F(2, 0, 2, 0, 0, 2, 1), verify: () => (k <= N) === ok }; }
    const flags = { used: rand.chance(0.35), receipt: rand.chance(0.65), sale: rand.chance(0.4) }, N = 14, k = rand.int(4, 12);
    if (level === 5 || level === 6) {
      const sale = level === 6 && flags.sale;
      const rules = `Items can be returned within ${N} days if they are unused and you have the receipt.${level === 6 ? " Sale items cannot be returned." : ""}`;
      const reasons = [[sale, "It is a sale item."], [flags.used, "The item has been used."], [!flags.receipt, `${who} does not have the receipt.`]];
      const why = reasons.find(([bad]) => bad); const ok = !why;
      const story = `${who} bought ${level === 6 ? `a ${sale ? "sale " : ""}jacket` : "a jacket"}, ${flags.used ? "wore it twice" : "has not worn it"}, ${flags.receipt ? "and has the receipt" : "and lost the receipt"}. It was delivered ${k} days ago.`;
      const right = ok ? sayYes("All the conditions are met.") : sayNo(why[1]);
      const pool = [sayYes("All the conditions are met."), sayNo("It is a sale item."), sayNo("The item has been used."), sayNo(`${who} does not have the receipt.`), sayNo("The deadline has passed.")].filter((x) => x !== right);
      return { type: "multiple_choice", prompt: READ(`${shop} return policy | ${rules} | ${story}`, `Can ${who} return the item now?`), right, wrong: pool.slice(0, 3), hints: [T("조건이 모두 맞아야 반품할 수 있어요(‘and’). 하나씩 표시해 보세요.", "Phải thỏa mãn tất cả điều kiện (‘and’). Hãy đánh dấu từng điều kiện."), SCAN[1]], expl: T(ok ? "세 조건을 모두 만족해요." : `조건 하나가 맞지 않아요: ${why[1]}`, ok ? "Thỏa mãn mọi điều kiện." : `Có một điều kiện không đạt: ${why[1]}`), tags: ["reading", "reasoning"], features: F(3, 1, 3, 1, 0, 3, 1), verify: () => (ok ? !flags.used && flags.receipt && !sale : true) };
    }
    if (level === 7) { const P = rand.pick([40, 60, 80, 100]), days = rand.pick([3, 6, 9, 20, 28, 35]), refund = days <= 7 ? P : days <= 30 ? P / 2 : 0; return { type: "multiple_choice", prompt: READ(`${shop} refund policy | Full refund if you return the item within 7 days. 50% refund from day 8 to day 30. No refund after day 30. | ${who} paid ${usd(P)} and returns the item ${days} days after buying it.`, `How much money does ${who} get back?`), right: usd(refund), wrong: [usd(P), usd(P / 2), usd(0), usd(P + 5)].filter((v) => v !== usd(refund)).slice(0, 3), hints: [T("며칠째인지 먼저 정하고 어느 구간인지 찾아요.", "Xác định là ngày thứ mấy rồi tìm khoảng thời gian tương ứng."), T("50%는 절반이에요.", "50% là một nửa.")], expl: T(`${days}일째 → ${days <= 7 ? "전액" : days <= 30 ? "절반" : "환불 없음"} → ${usd(refund)}`, `Ngày ${days} → ${days <= 7 ? "hoàn toàn bộ" : days <= 30 ? "hoàn một nửa" : "không hoàn"} → ${usd(refund)}`), tags: ["reading", "multistep"], features: F(3, 1, 3, 1, 0, 3, 2), verify: () => true }; }
    if (level === 8) { const opened = rand.chance(0.6), faulty = rand.chance(0.5), days = rand.int(5, 40); const eligible = opened ? faulty : days <= 30; const right = eligible ? sayYes(opened ? "Opened items can be returned because it is faulty." : "It is unopened and within 30 days.") : sayNo(opened ? "Opened items can be returned only if they are faulty." : "It is unopened but more than 30 days have passed."); const alts = [sayYes("Every item can be returned at any time."), sayNo("Opened items can never be returned."), sayYes("It is unopened, so the deadline does not matter."), sayNo("Faulty items cannot be returned."), sayNo("It is more than 30 days."), sayYes("It is within 30 days.")]; return { type: "multiple_choice", prompt: READ(`${shop} return policy | Unopened items can be returned within 30 days. Opened items can be returned only if they are faulty. | ${who} bought a printer ${days} days ago. The box is ${opened ? "opened" : "unopened"}${opened ? ` and the printer is ${faulty ? "faulty" : "working well"}` : ""}.`, `Can ${who} return the printer?`), right, wrong: alts.filter((a) => a !== right).slice(0, 3), hints: SCAN, expl: T(`상자 상태에 따라 규칙이 달라요: ${opened ? "개봉됨 → 불량일 때만 가능" : "미개봉 → 30일 이내"}`, `Quy tắc phụ thuộc vào tình trạng hộp: ${opened ? "đã mở → chỉ trả được nếu bị lỗi" : "chưa mở → trong 30 ngày"}`), tags: ["reading", "reasoning"], features: F(3, 2, 3, 2, 0, 3, 1), verify: () => true }; }
    const order = base, deliver = addDays(base, rand.int(3, 6)), askDay = rand.int(9, 20), ask = addDays(base, askDay), P = rand.pick([60, 80, 120]), ship = rand.pick([4, 6, 8]), opened = rand.chance(0.5);
    const inTime = askDay <= 14, value = inTime ? Math.round((P * (opened ? 0.9 : 1)) * 100) / 100 : 0;
    return { type: "numeric", prompt: READ(`${shop} return policy | Return requests must be made within 14 days of the ORDER date. Opened items have a 10% restocking fee, taken from the item price. The shipping fee is never refunded. | ${who} ordered a speaker on ${dateStr(order)} (item price ${usd(P)}, shipping ${usd(ship)}). It arrived on ${dateStr(deliver)}. The box is ${opened ? "opened" : "unopened"}. ${who} asks for a return on ${dateStr(ask)}.`, `How much money does ${who} get back? (Write 0 if no return is allowed.)`, T("(USD 숫자만)", "(chỉ nhập số USD)")), value, tol: 0.011, hints: [T("기한은 ‘주문일’부터 세요(배송일이 아니에요).", "Hạn được tính từ NGÀY ĐẶT HÀNG (không phải ngày giao)."), T("기한 안이면: 물건 값에서 수수료(개봉 시)를 빼고, 배송비는 돌려받지 못해요.", "Nếu còn hạn: lấy giá hàng trừ phí tái nhập kho (nếu đã mở); phí vận chuyển không được hoàn.")], expl: T(inTime ? `주문 후 ${askDay}일 → 기한 이내. 환불 ${usd(value)}` : `주문 후 ${askDay}일 → 14일 초과, 환불 0`, inTime ? `${askDay} ngày sau khi đặt → còn hạn. Hoàn ${usd(value)}` : `${askDay} ngày sau khi đặt → quá 14 ngày, hoàn 0`), tags: ["reading", "multistep", "reasoning"], features: F(5, 2, 4, 3, 0, 2, 3), verify: () => value <= P };
  },
};

/* ------------------------------------------------------------ 5. weather alerts */
const AREAS = ["Harbor City", "Eastside", "Maple Hills", "Lakeview"];
const HAZ = [{ h: "heavy rain", adv: "avoid riverside paths and low roads" }, { h: "strong wind", adv: "stay away from trees and tall signs" }, { h: "extreme heat", adv: "avoid hard exercise outside and drink water" }, { h: "heavy snow", adv: "avoid driving unless it is necessary" }];
export const weather = {
  id: "weather-alert", short: "wx", cognitive: "APPLY", levels: [3, 7], title: T("기상 경보 읽고 행동 정하기", "Đọc cảnh báo thời tiết và quyết định hành động"),
  make(rand, level) {
    const hz = rand.pick(HAZ), lvl = level <= 4 ? "Warning" : rand.pick(["Advisory", "Watch", "Warning"]), areaIn = rand.sample(AREAS, 2), name = rand.pick(NAMES);
    const a = rand.pick([14, 16, 18]) * 60, b = a + rand.pick([4, 5, 6]) * 60;
    const planArea = level <= 4 ? areaIn[0] : rand.pick([...areaIn, ...AREAS.filter((x) => !areaIn.includes(x))]);
    const planTime = level <= 4 ? a + 60 : rand.pick([a - 180, a + 60, b + 60]);
    const A = { go: "Go as planned. The alert does not apply to the plan.", early: "Go, but finish before the alert starts.", care: "Go, but take extra care and follow the advice.", ready: "Do not cancel yet. Check updates and keep a backup plan.", stay: "Do not go. Postpone the plan until the alert ends." };
    const inArea = areaIn.includes(planArea), inTime = planTime >= a && planTime < b;
    const key = !inArea ? "go" : !inTime ? (planTime < a ? "early" : "go") : lvl === "Advisory" ? "care" : lvl === "Watch" ? "ready" : "stay";
    const doc = `Weather alert | Level: ${lvl} | Hazard: ${hz.h} | Area: ${areaIn.join(" and ")} | Time: ${hm(a)} to ${hm(b)} today | Advice: ${hz.adv}${level >= 7 ? " | A Watch means the hazard is possible. A Warning means it is expected or happening. An Advisory means be careful." : ""}`;
    return { type: "multiple_choice", prompt: READ(doc, `${name} plans to be outside in ${planArea} at ${hm(planTime)} today. What is the best choice?`), right: A[key], wrong: Object.keys(A).filter((x) => x !== key).slice(0, 3).map((x) => A[x]), hints: [T("장소, 시각, 경보 단계 세 가지가 모두 맞는지 차례로 확인해요.", "Lần lượt kiểm tra ba điều: địa điểm, thời gian, mức cảnh báo."), T("Watch는 ‘가능성’, Warning은 ‘예상·진행 중’이에요.", "Watch là ‘có khả năng’, Warning là ‘dự kiến hoặc đang xảy ra’.")], expl: T(`장소 ${inArea ? "포함" : "제외"}, 시각 ${inTime ? "경보 시간 안" : "경보 시간 밖"}, 단계 ${lvl} → ${A[key]}`, `Địa điểm ${inArea ? "thuộc khu vực" : "ngoài khu vực"}, thời gian ${inTime ? "nằm trong giờ cảnh báo" : "ngoài giờ cảnh báo"}, mức ${lvl} → ${A[key]}`), tags: ["reading", "reasoning", "context"], features: F(level <= 4 ? 2 : 3, 1, 3, level >= 7 ? 2 : 1, 0, 3, 1), verify: () => key in A };
  },
};

/* ------------------------------------------------------------ 6. reading e-mails */
const INTENTS = ["To ask for more time", "To change a meeting time", "To ask for information", "To decline an invitation", "To report a problem"];
export const email = {
  id: "email-intent", short: "mail", cognitive: "ANALYZE", levels: [4, 8], title: T("이메일의 목적과 요청 파악하기", "Nắm mục đích và yêu cầu của email"),
  make(rand, level) {
    const me = rand.pick(NAMES), boss = rand.pick(["Mr. Park", "Ms. Kim", "Dr. Lee", "Ms. Tran"]), d = new Date(Date.UTC(2026, rand.int(2, 9), rand.int(3, 20)));
    const old = dateStr(d), neu = dateStr(addDays(d, rand.int(2, 4))), replyBy = dateStr(addDays(d, -2)), other = dateStr(addDays(d, 10));
    const kind = rand.int(0, 4), hedge = level >= 6;
    const body = [
      hedge ? `I was wondering whether there might be any chance of handing in my science report a little later, perhaps on ${neu} instead of ${old}.` : `I am writing to ask for more time. I would like to hand in my science report on ${neu} instead of ${old}.`,
      hedge ? `Would it be possible to move our meeting from ${old} to ${neu}? I completely understand if that is difficult.` : `I am writing to change our meeting. Can we move it from ${old} to ${neu}?`,
      hedge ? `I hope you do not mind me asking, but could you tell me what time the workshop starts and whether I should bring anything?` : `I am writing to ask what time the workshop starts and what I should bring.`,
      hedge ? `Thank you so much for the invitation. Unfortunately, I am afraid I will not be able to join the picnic on ${old}.` : `Thank you for the invitation. I cannot come to the picnic on ${old}.`,
      hedge ? `I am sorry to bother you, but the headphones I ordered arrived with a cracked cable, so I would be grateful for a replacement.` : `The headphones I ordered arrived with a cracked cable. I would like a replacement.`,
    ][kind];
    const extra = level >= 5 ? ` I have been ill since the ${rand.int(1, 9)}th.` : "";
    const ask = level === 5 ? ` Please let me know by ${replyBy}.` : "";
    const demand = level === 7 && rand.chance(0.5);
    const doc = `Dear ${boss}, | ${demand ? `Fix this immediately! I am very unhappy and I will not wait. ${body}` : body}${extra}${ask} | Best regards, ${me}`;
    if (level === 5) return { type: "multiple_choice", prompt: READ(doc.replace(/ \| Best/, " | Best"), "By what date does the writer want an answer?"), right: replyBy, wrong: [old, neu, other], hints: [T("‘by’ 뒤에 나오는 날짜가 답을 달라는 기한이에요.", "Ngày đứng sau ‘by’ là hạn muốn nhận câu trả lời."), T("글 속의 다른 날짜(원래 날짜, 바꾸려는 날짜)와 헷갈리지 않게 해요.", "Đừng nhầm với các ngày khác trong thư (ngày cũ, ngày muốn đổi).")], expl: T(`‘Please let me know by’ 뒤: ${replyBy}`, `Sau ‘Please let me know by’: ${replyBy}`), tags: ["reading"], features: F(2, 0, 3, 0, 0, 3, 1), verify: () => !!ask };
    if (level === 7) { const right = demand ? "Demanding and unhappy" : "Polite and careful"; return { type: "multiple_choice", prompt: READ(doc, "Which phrase best describes the writer's tone?"), right, wrong: ["Polite and careful", "Demanding and unhappy", "Excited and playful", "Bored and careless"].filter((x) => x !== right), hints: [T("‘immediately, I will not wait’처럼 강한 표현이 있는지, ‘I was wondering’처럼 조심스러운지 봐요.", "Xem có từ mạnh như ‘immediately, I will not wait’ hay cách nói thận trọng như ‘I was wondering’."), T("인사말과 맺음말도 어조의 단서예요.", "Lời chào và lời kết cũng là manh mối về giọng điệu.")], expl: T(demand ? "강한 명령과 불만 표현이 있어요." : "‘I was wondering, would it be possible’ 같은 조심스러운 표현이 많아요.", demand ? "Có lời yêu cầu mạnh và bày tỏ sự không hài lòng." : "Có nhiều cách nói thận trọng như ‘I was wondering, would it be possible’."), tags: ["reading", "reasoning"], features: F(2, 2, 3, 2, 0, 3, 0), verify: () => true }; }
    if (level === 8) { const alt = ["help at the stall on Sunday morning", "come on Monday evening", "send a gift", "call you next week"]; const doc8 = `Dear ${boss}, | Thank you so much for inviting me to the charity picnic on ${old}. Unfortunately, I am afraid I cannot come that day because of a family event. I would be glad to ${alt[0]} instead, if that would help. | Best regards, ${me}`; return { type: "multiple_choice", prompt: READ(doc8, "What does the writer offer instead of coming to the picnic?"), right: `To ${alt[0]}`, wrong: alt.slice(1).map((x) => `To ${x}`), hints: [T("거절한 뒤에 ‘instead(대신)’가 나오는 문장을 찾아요.", "Tìm câu có ‘instead’ (thay vào đó) sau lời từ chối."), T("‘would be glad to’ 뒤에 제안이 와요.", "Lời đề nghị đứng sau ‘would be glad to’.")], expl: T(`‘I would be glad to ${alt[0]} instead’`, `‘I would be glad to ${alt[0]} instead’`), tags: ["reading", "reasoning"], features: F(3, 2, 3, 2, 0, 3, 0), verify: () => true }; }
    return { type: "multiple_choice", prompt: READ(doc, "What is the main purpose of this e-mail?"), right: INTENTS[kind], wrong: INTENTS.filter((_, i) => i !== kind), hints: [T("글쓴이가 읽는 사람에게 무엇을 원하는지 한 문장으로 말해 보세요.", "Hãy nói bằng một câu: người viết muốn người đọc làm gì."), T(hedge ? "‘I was wondering, would it be possible’ 같은 조심스러운 말도 요청이에요." : "‘I am writing to’ 바로 뒤에 목적이 나와요.", hedge ? "Cách nói lịch sự như ‘I was wondering, would it be possible’ cũng là một lời đề nghị." : "Mục đích thường đứng ngay sau ‘I am writing to’.")], expl: T(`요청의 핵심: ${INTENTS[kind]}`, `Trọng tâm của thư: ${INTENTS[kind]}`), tags: ["reading", "reasoning"], features: F(2, 1, 3, hedge ? 2 : 1, 0, 3, 0), verify: () => true };
  },
};

/* ------------------------------------------------------------ 7. judging reviews */
const SPECIFIC = [["The strap broke after three weeks, but support sent a new one in two days.", 3], ["Battery lasts about six hours, and the case feels solid.", 4], ["Setup took ten minutes. The app crashed once on my old phone.", 4], ["Sound is clear, but the left ear cup is a bit tight.", 4], ["Stopped charging after a month. Returned it for a refund.", 2]];
const GENERIC = ["Great product! Love it! Best ever! Buy now!!!", "Amazing!!! Perfect!!! Five stars!!!", "Best purchase of my life. Everyone must buy this."];
export const reviews = {
  id: "review-reliability", short: "rev", cognitive: "ANALYZE", levels: [5, 10], title: T("후기의 신뢰도 판단하기", "Đánh giá độ tin cậy của đánh giá sản phẩm"),
  make(rand, level) {
    const noun = rand.pick(["wireless earbuds", "backpack", "desk lamp", "water bottle"]);
    const spec = rand.sample(SPECIFIC, 3).map(([t, s]) => ({ text: t, stars: s, verified: rand.chance(0.85), generic: false }));
    const gen = rand.sample(GENERIC, 3).map((t) => ({ text: t, stars: 5, verified: rand.chance(0.25), generic: true }));
    const all = rand.shuffle([...spec, ...gen]);
    const doc = `Reviews: ${noun} | ` + all.map((r, i) => `R${i + 1} (${r.stars} stars${r.verified ? ", verified purchase" : ""}): ${r.text}`).join(" | ");
    const hints = [T("‘구체적인 사실’이 있는지, 같은 말만 반복하는지 살펴요.", "Xem có chi tiết cụ thể không hay chỉ lặp lại lời khen chung chung."), T("‘verified purchase’는 실제 구매자라는 표시예요.", "‘verified purchase’ nghĩa là người mua thật.")];
    if (level === 5) { const useful = all.filter((r) => !r.generic); const pick = rand.pick(useful); const idx = all.indexOf(pick); return { type: "multiple_choice", prompt: READ(doc, "Which review gives the most useful information about how the product works?"), right: `R${idx + 1}`, wrong: all.map((_, i) => `R${i + 1}`).filter((x, i) => i !== idx && all[i].generic).slice(0, 3), hints, expl: T("구체적인 사용 경험(시간, 상태)이 적힌 후기가 유용해요.", "Đánh giá có trải nghiệm cụ thể (thời gian, tình trạng) mới hữu ích."), tags: ["reading", "reasoning"], features: F(2, 1, 3, 1, 0, 3, 1), verify: () => !pick.generic }; }
    if (level === 6 || level === 7) { const sus = all.filter((r) => r.generic && !r.verified); if (!sus.length) return reviews.make(rand, level); const pick = sus[0], idx = all.indexOf(pick); return { type: "multiple_choice", prompt: READ(doc, "Which review is the LEAST trustworthy?"), right: `R${idx + 1}`, wrong: all.map((_, i) => `R${i + 1}`).filter((x, i) => i !== idx).slice(0, 3), hints: [T("가짜 후기는 대개 구체적이지 않고, 느낌표가 많고, 구매 확인 표시가 없어요.", "Đánh giá giả thường chung chung, nhiều dấu chấm than và không có dấu xác nhận mua hàng."), hints[1]], expl: T("일반적인 칭찬뿐이고 구매 확인이 없는 후기가 가장 믿기 어려워요.", "Đánh giá chỉ khen chung chung và không xác nhận mua hàng là đáng ngờ nhất."), tags: ["reading", "reasoning"], features: F(3, 2, 3, 2, 0, 3, 1), verify: () => pick.generic && !pick.verified }; }
    const rule = level === 8 ? "Ignore reviews that are not verified purchases." : level === 9 ? "Ignore reviews that are not verified purchases AND reviews that only give general praise." : "Ignore reviews that are not verified purchases. Ignore reviews that only give general praise. Then count the rating of the remaining reviews with the lowest star rating twice.";
    let kept = all.filter((r) => r.verified);
    if (level >= 9) kept = kept.filter((r) => !r.generic);
    if (kept.length < 2) return reviews.make(rand, level);
    let sum = kept.reduce((a, r) => a + r.stars, 0), n = kept.length;
    if (level === 10) { const m = Math.min(...kept.map((r) => r.stars)); sum += m; n += 1; }
    const value = Math.round((sum / n) * 10) / 10;
    return { type: "numeric", prompt: READ(doc, `${rule} What is the average star rating of the reviews that are counted? (round to one decimal)`, T("(소수 첫째 자리까지)", "(làm tròn đến một chữ số thập phân)")), value, tol: 0.051, hints: [T("규칙에 맞는 후기만 골라 번호를 적어요. 그다음 별 수의 합 ÷ 개수.", "Chọn các đánh giá phù hợp quy tắc và ghi số thứ tự. Sau đó lấy tổng sao ÷ số lượng."), T(level === 10 ? "별점이 가장 낮은 것은 두 번 센다는 규칙도 적용해요." : "빠진 후기는 평균에 넣지 않아요.", level === 10 ? "Áp dụng cả quy tắc đếm đánh giá có số sao thấp nhất hai lần." : "Đánh giá bị loại không tính vào trung bình.")], expl: T(`선택된 후기의 별 합 ${sum} ÷ ${n} = ${value}`, `Tổng số sao của các đánh giá được chọn ${sum} ÷ ${n} = ${value}`), tags: ["reading", "multistep", "reasoning"], features: F(level === 10 ? 5 : 4, 2, 4, level === 10 ? 3 : 2, 0, 1, 2), verify: () => n >= 2 };
  },
};

/* ------------------------------------------------------------ 8. headline versus evidence */
const TOPICS = [
  { x: "sleeping eight hours a night", y: "higher test scores", pop: "high school students", head: "Sleep makes teens smarter" },
  { x: "using phones before bed", y: "worse sleep", pop: "teenagers", head: "Phones ruin teen sleep" },
  { x: "walking to school", y: "a better mood in class", pop: "primary school children", head: "Walking to school makes kids happy" },
  { x: "eating breakfast", y: "better focus in the morning", pop: "office workers", head: "Breakfast boosts work focus" },
];
export const headline = {
  id: "headline-claim", short: "head", cognitive: "ANALYZE", levels: [6, 10], title: T("기사 제목과 근거 비교하기", "So sánh tiêu đề với bằng chứng"),
  make(rand, level) {
    const t = rand.pick(TOPICS), rct = level >= 8 && rand.chance(0.5), n = level >= 8 && rand.chance(0.5) ? rand.pick([24, 30, 40]) : rand.pick([1200, 2400, 3500]), small = n < 100, funded = level >= 9;
    const design = rct ? `Researchers randomly assigned ${n} ${t.pop} to either do or not do this: ${t.x}. After a month, the group that did it reported ${t.y}.` : `Researchers surveyed ${n} ${t.pop}. Those who reported ${t.x} also reported ${t.y}.`;
    const fund = funded ? ` The study was paid for by a company that sells products related to ${t.x}.` : "";
    const doc = `Headline: ${t.head} | Article: ${design}${small ? " The group was small." : ""}${fund}`;
    const right = funded ? "The result is interesting, but the small group and the company funding mean independent studies should check it." : rct ? (small ? "In this small experiment, the group that did it did better, so the result should be checked with a larger group." : `In this experiment, doing this led to ${t.y} for these participants.`) : `${t.pop[0].toUpperCase()}${t.pop.slice(1)} who reported ${t.x} also tended to report ${t.y}, but the survey cannot show a cause.`;
    const wrong = [`${t.x[0].toUpperCase()}${t.x.slice(1)} causes ${t.y} in everyone.`, `All people will get ${t.y} if they do this.`, `The study proves that ${t.x} has no effect.`];
    const fixed = funded ? [wrong[0], wrong[1], "The study is worthless because a company paid for it."] : wrong;
    return { type: "multiple_choice", prompt: READ(doc, "Which statement is best supported by the article?"), right, wrong: fixed, hints: [T("기사가 실제로 한 일(설문인지, 무작위 실험인지)과 몇 명인지부터 확인해요.", "Trước hết xem nghiên cứu thực sự đã làm gì (khảo sát hay thí nghiệm ngẫu nhiên) và có bao nhiêu người."), T("‘함께 나타난다’와 ‘원인이다’는 달라요. ‘모든 사람’도 근거 없는 일반화예요.", "‘Đi cùng nhau’ khác với ‘là nguyên nhân’. ‘Mọi người’ cũng là khái quát hóa thiếu căn cứ.")], expl: T(rct ? "무작위 실험이라 이 참가자들에게는 인과를 말할 수 있지만 범위와 표본의 한계가 있어요." : "설문은 관련성만 보여 주고 원인은 증명하지 못해요.", rct ? "Thí nghiệm ngẫu nhiên cho phép nói về nhân quả với những người tham gia này nhưng có giới hạn về phạm vi và cỡ mẫu." : "Khảo sát chỉ cho thấy mối liên hệ, không chứng minh nguyên nhân."), tags: ["reading", "reasoning"], features: F(3 + (funded ? 1 : 0), 3, 3, 3, 0, 3, 1), verify: () => true };
  },
};

/* ------------------------------------------------------------ 9. putting instructions in order */
const TASKS = [
  { task: "reset your password", steps: ["Open the login page.", "Click Forgot password.", "Enter your email address.", "Open the link in the e-mail we send you.", "Type a new password.", "Log in with the new password."] },
  { task: "install a new app", steps: ["Open the app store.", "Search for the app name.", "Tap Install.", "Wait until the download finishes.", "Open the app.", "Create your account."] },
  { task: "borrow a library book online", steps: ["Search the library catalogue.", "Check that the book is available.", "Reserve the book online.", "Wait for the pickup message.", "Show your library card at the desk.", "Take the book home."] },
  { task: "send a parcel", steps: ["Pack the item in a box.", "Write the address on the box.", "Go to the post office.", "Choose the delivery speed.", "Pay the fee.", "Keep the receipt."] },
];
export const instructions = {
  id: "instructions-order", short: "ord", cognitive: "PROCEDURE", levels: [2, 7], title: T("설명서 순서 이해하기", "Hiểu thứ tự các bước hướng dẫn"),
  make(rand, level) {
    const t = rand.pick(TASKS), n = level <= 3 ? 4 : level <= 5 ? 5 : 6;
    const marks = ["First,", "Then,", "After that,", "Finally,"];
    const lines = t.steps.slice(0, n);
    const items = level <= 3 ? lines.map((s, i) => `${marks[i]} ${s[0].toLowerCase()}${s.slice(1)}`) : lines;
    return { type: "ordering", prompt: T(`다음 단계를 일이 진행되는 순서대로 눌러 배열하세요. 과제: ${t.task}`, `Bấm các bước theo đúng thứ tự thực hiện. Nhiệm vụ: ${t.task}`), items, hints: [T(level <= 3 ? "First, Then, After that, Finally 같은 순서 표지를 찾아요." : "각 단계가 앞 단계의 결과를 필요로 하는지 생각해요(예: 열려면 먼저 내려받아야 해요).", level <= 3 ? "Tìm các từ chỉ thứ tự như First, Then, After that, Finally." : "Hãy nghĩ xem bước nào cần kết quả của bước trước (ví dụ phải tải xong mới mở được)."), T("처음과 마지막에 올 단계부터 정하면 쉬워요.", "Dễ hơn nếu xác định trước bước đầu tiên và bước cuối cùng.")], expl: T(`순서: ${lines.join(" → ")}`, `Thứ tự: ${lines.join(" → ")}`), tags: ["reading", "reasoning"], features: F(Math.min(5, n - 1), 1, 2, level >= 6 ? 2 : 0, 0, 1, 0), verify: () => items.length === n };
  },
};

/* ------------------------------------------------------------ 10. error messages and logs */
const ERR = [
  { msg: "Error 403: Access denied. Your account does not have permission to open this page.", cause: "Your account lacks permission for this page.", fix: "Ask the administrator to give your account permission." },
  { msg: "Error 404: Page not found. The address may be wrong or the page has moved.", cause: "The web address is wrong or the page moved.", fix: "Check the web address for typing mistakes." },
  { msg: "Cannot save the file. Your storage is full.", cause: "There is no free space left.", fix: "Delete files you no longer need, then try again." },
  { msg: "The server took too long to respond. Check your connection and try again.", cause: "The network connection is weak or down.", fix: "Check your internet connection and try again." },
  { msg: "Your password has expired. Choose a new password to continue.", cause: "The password is too old.", fix: "Reset your password." },
];
export const errors = {
  id: "error-message", short: "err", cognitive: "APPLY", levels: [4, 8], title: T("오류 메시지 읽고 해결하기", "Đọc thông báo lỗi và khắc phục"),
  make(rand, level) {
    const i = rand.int(0, ERR.length - 1), e = ERR[i], others = ERR.filter((_, k) => k !== i);
    if (level <= 5) return { type: "multiple_choice", prompt: READ(e.msg, "What should you do first?"), right: e.fix, wrong: others.slice(0, 3).map((o) => o.fix), hints: [T("오류 메시지의 ‘원인’ 문장과 ‘해결’ 문장을 구분해요.", "Phân biệt câu nêu NGUYÊN NHÂN và câu nêu cách KHẮC PHỤC."), T("원인에 맞는 해결 방법만 고르세요.", "Chỉ chọn cách khắc phục khớp với nguyên nhân.")], expl: T(`메시지가 알려 주는 원인에 맞는 해결: ${e.fix}`, `Cách khắc phục khớp nguyên nhân thông báo nêu: ${e.fix}`), tags: ["reading", "context"], features: F(2, 0, 3, 0, 0, 3, 0), verify: () => true };
    if (level <= 6) { const guest = i === 0; const doc = `${e.msg.split(":")[0]} | Signed in as: ${guest ? "guest" : "admin"} | ${guest ? "This page is for members only." : "Network: unstable"}`; const cause = i === 0 ? ERR[0].cause : ERR[3].cause; return { type: "multiple_choice", prompt: READ(doc, "What is the most likely cause?"), right: cause, wrong: [ERR[2].cause, ERR[4].cause, i === 0 ? ERR[3].cause : ERR[0].cause].filter((x) => x !== cause), hints: [T("오류 번호만으로는 부족해요. 함께 적힌 로그인 상태와 다른 줄이 단서예요.", "Mã lỗi thôi chưa đủ; trạng thái đăng nhập và các dòng khác là manh mối."), T("‘members only’, ‘unstable’ 같은 단어가 원인을 알려 줘요.", "Các từ như ‘members only’, ‘unstable’ cho biết nguyên nhân.")], expl: T(`단서: ${guest ? "손님 계정, 회원 전용 페이지" : "불안정한 네트워크"} → ${cause}`, `Manh mối: ${guest ? "tài khoản khách, trang chỉ dành cho thành viên" : "mạng không ổn định"} → ${cause}`), tags: ["reading", "reasoning", "context"], features: F(3, 1, 3, 2, 0, 3, 0), verify: () => true }; }
    const warn = rand.pick(["Battery low: 15%", "Update available", "Printer ink is low"]), real = ERR[rand.pick([2, 3, 1])];
    const log = `09:01 INFO Connected | 09:02 WARN ${warn} | 09:03 ERROR ${real.msg.replace(/^Error \d+: /, "")} | 09:03 INFO Retry failed`;
    const warnFix = warn.startsWith("Battery") ? "Plug in the charger." : warn.startsWith("Update") ? "Install the update later." : "Replace the ink cartridge soon.";
    return { type: "multiple_choice", prompt: READ(log, "Which action is needed to solve the ERROR in this log?"), right: real.fix, wrong: [warnFix, ...ERR.filter((x) => x !== real).slice(0, 2).map((x) => x.fix)], hints: [T("INFO, WARN, ERROR는 심각도가 달라요. 문제를 일으킨 것은 ERROR 줄이에요.", "INFO, WARN, ERROR có mức nghiêm trọng khác nhau; dòng gây sự cố là ERROR."), T("WARN 줄의 해결책은 이번 오류와 상관없을 수 있어요.", "Cách xử lý ở dòng WARN có thể không liên quan đến lỗi này.")], expl: T(`ERROR 줄의 원인에 맞는 해결: ${real.fix}`, `Cách khắc phục khớp nguyên nhân ở dòng ERROR: ${real.fix}`), tags: ["reading", "reasoning", "multistep"], features: F(4, 2, 4, 3, 0, 3, 1), verify: () => true };
  },
};

/* ------------------------------------------------------------ 11. two sources that disagree */
export const sources = {
  id: "multi-source", short: "src", cognitive: "CREATE", levels: [7, 10], title: T("출처가 다른 두 글 비교하기", "So sánh hai nguồn thông tin khác nhau"),
  make(rand, level) {
    const d = new Date(Date.UTC(2026, rand.int(8, 10), rand.int(10, 24))), h = level === 7 ? rand.int(1, 13) : rand.int(15, 22), ext = level === 10 ? 36 : 0;
    const total = h * 60 + 9 * 60 + ext * 60, dayShift = Math.floor(total / 1440), local = total % 1440, ldate = addDays(d, dayShift);
    const fmt = (dt, m) => `${dateStr(dt)}, ${hm(m)}`;
    const right = fmt(ldate, local);
    const wrong = [fmt(d, (h * 60 + 9 * 60) % 1440), fmt(d, h * 60), fmt(addDays(d, 4), (h * 60 + 9 * 60) % 1440)];
    const official = `Official notice (Ministry) | Applications close on ${dateStr(d)} at ${String(h).padStart(2, "0")}:00 UTC.${level === 10 ? " Correction: the closing time has been extended by 36 hours." : ""}`;
    const forum = `Forum post by a user | I think applications close on the ${d.getUTCDate() + 4}th. My friend told me, so I will apply next week.`;
    return { type: "multiple_choice", prompt: READ(`${official} | ${forum}`, "Korea time is UTC+9. Which source should you trust, and when exactly do applications close in Korea?"), right: `${right} (Korea time), from the official notice`, wrong: wrong.map((w, i) => `${w}${i === 2 ? " (Korea time), from the forum post" : " (Korea time), from the official notice"}`), hints: [T("공식 기관의 안내와 개인이 전해 들은 이야기 중 어느 쪽이 더 믿을 만한지 먼저 정해요.", "Trước hết quyết định nguồn nào đáng tin hơn: thông báo của cơ quan chính thức hay lời đồn của một cá nhân."), T(`UTC+9는 UTC보다 9시간 빨라요${level >= 9 ? "(날짜가 바뀔 수 있어요)" : ""}${level === 10 ? ". 정정 공지의 36시간 연장도 더해요." : "."}`, `UTC+9 sớm hơn UTC 9 giờ${level >= 9 ? " (ngày có thể thay đổi)" : ""}${level === 10 ? ". Cộng thêm 36 giờ gia hạn trong thông báo đính chính." : "."}`)], expl: T(`${String(h).padStart(2, "0")}:00 UTC + 9시간${ext ? " + 36시간" : ""} = ${right}`, `${String(h).padStart(2, "0")}:00 UTC + 9 giờ${ext ? " + 36 giờ" : ""} = ${right}`), tags: ["reading", "reasoning", "multistep"], features: F(4 + (level === 10 ? 1 : 0), 2, 4, 4, 0, 3, 3), verify: () => right !== wrong[0] };
  },
};

/* ------------------------------------------------------------ 12. numbers inside English text */
export const dataText = {
  id: "data-text", short: "dat", cognitive: "ANALYZE", levels: [5, 10], title: T("영어 글 속 수치 읽기", "Đọc số liệu trong văn bản tiếng Anh"),
  make(rand, level) {
    const N = rand.mult(200, 800, 20), P = rand.mult(30, 70, 5), Q = rand.mult(15, P - 5, 5);
    if (level <= 5) return { type: "numeric", prompt: READ(`In a survey of ${N} students, ${P}% said they watch video lessons every week.`, "How many students said they watch video lessons every week?", NUM), value: (N * P) / 100, hints: [T("퍼센트는 ‘100명 중 몇 명’이라는 뜻이에요.", "Phần trăm nghĩa là ‘trên 100 thì có bao nhiêu’."), T("전체 수 × 퍼센트 ÷ 100", "Tổng số × phần trăm ÷ 100")], expl: T(`${N} × ${P} ÷ 100 = ${(N * P) / 100}`, `${N} × ${P} ÷ 100 = ${(N * P) / 100}`), tags: ["reading"], features: F(2, 1, 2, 0, 0, 0, 2), verify: () => Number.isInteger((N * P) / 100) };
    if (level === 6) { const R2 = rand.mult(10, P - 5, 5); return { type: "numeric", prompt: READ(`A survey of ${N} students found that ${P}% use a tablet for study and ${R2}% use only paper books.`, "How many MORE students use a tablet than use only paper books?", NUM), value: (N * (P - R2)) / 100, hints: [T("두 집단의 인원을 각각 구해 빼거나, 퍼센트 차이에 전체를 곱해요.", "Tính số học sinh của từng nhóm rồi trừ, hoặc nhân hiệu hai tỉ lệ với tổng số."), T("‘more than’은 차이를 묻는 말이에요.", "‘more than’ hỏi về chênh lệch.")], expl: T(`${N} × (${P} − ${R2}) ÷ 100 = ${(N * (P - R2)) / 100}`, `${N} × (${P} − ${R2}) ÷ 100 = ${(N * (P - R2)) / 100}`), tags: ["reading", "multistep"], features: F(3, 1, 3, 1, 0, 1, 2), verify: () => true }; }
    if (level === 7) return { type: "numeric", prompt: READ(`Last year ${Q}% of students used an online library. This year the figure is ${P}%.`, "By how many percentage points did the figure rise?", NUM), value: P - Q, hints: [T("퍼센트포인트는 두 비율의 단순한 차이예요.", "Điểm phần trăm là hiệu đơn giản giữa hai tỉ lệ."), T("‘%’가 아니라 ‘percentage points’를 물었어요.", "Câu hỏi là ‘percentage points’ chứ không phải ‘%’.")], expl: T(`${P} − ${Q} = ${P - Q} 퍼센트포인트`, `${P} − ${Q} = ${P - Q} điểm phần trăm`), tags: ["reading", "reasoning"], features: F(2, 2, 2, 2, 0, 1, 1), verify: () => P > Q };
    if (level === 8) { const rel = Math.round(((P - Q) / Q) * 1000) / 10; return { type: "numeric", prompt: READ(`Last year ${Q}% of students used an online library. This year the figure is ${P}%.`, "By what percent did the share of users increase compared with last year? (one decimal)", T("(소수 첫째 자리까지)", "(đến một chữ số thập phân)")), value: rel, tol: 0.06, hints: [T("‘작년에 비해 몇 % 늘었나’는 (증가량 ÷ 작년 값)이에요.", "‘Tăng bao nhiêu % so với năm ngoái’ là (lượng tăng ÷ giá trị năm ngoái)."), T("퍼센트포인트가 아니라 상대적 증가율이에요.", "Đây là tỉ lệ tăng tương đối chứ không phải điểm phần trăm.")], expl: T(`(${P} − ${Q}) ÷ ${Q} × 100 = ${rel}%`, `(${P} − ${Q}) ÷ ${Q} × 100 = ${rel}%`), tags: ["reading", "multistep", "reasoning"], features: F(3, 3, 2, 2, 0, 1, 2), verify: () => Q > 0 }; }
    if (level === 9) { const rel = Math.round(((P - Q) / Q) * 100); if (rel === P - Q) return dataText.make(rand, level); const right = `The share rose by ${P - Q} percentage points.`; return { type: "multiple_choice", prompt: READ(`Last year ${Q}% of students used an online library. This year ${P}% do.`, "Which summary is accurate?"), right, wrong: [`The share rose by ${P - Q}%.`, `The number of students rose by ${P - Q}%.`, `The share more than doubled.`.replace("more than doubled", P >= 2 * Q ? "doubled" : "tripled")], hints: [T("퍼센트와 퍼센트포인트를 구분해요.", "Phân biệt phần trăm và điểm phần trăm."), T("비율의 변화를 ‘몇 %’라고 쓰면 기준이 바뀌어 틀릴 수 있어요.", "Viết sự thay đổi của một tỉ lệ là ‘bao nhiêu %’ có thể sai vì thay đổi cơ sở.")], expl: T(`${Q}% → ${P}%는 ${P - Q}퍼센트포인트 상승(상대적으로는 약 ${rel}% 증가)`, `${Q}% → ${P}% là tăng ${P - Q} điểm phần trăm (tương đối khoảng ${rel}%)`), tags: ["reading", "reasoning"], features: F(3, 3, 2, 3, 0, 3, 1), verify: () => rel !== P - Q }; }
    const n1 = rand.mult(100, 400, 50), n2 = rand.mult(100, 400, 50), p1 = rand.mult(20, 80, 5), p2 = rand.mult(20, 80, 5), value = Math.round(((n1 * p1 + n2 * p2) / (n1 + n2)) * 10) / 10;
    return { type: "numeric", prompt: READ(`School A has ${n1} students and ${p1}% of them use the app. School B has ${n2} students and ${p2}% of them use it.`, "What percent of all students from both schools use the app? (one decimal)", T("(소수 첫째 자리까지)", "(đến một chữ số thập phân)")), value, tol: 0.06, hints: [T("두 퍼센트를 그냥 평균 내면 안 돼요. 학교 크기가 달라요.", "Không lấy trung bình hai tỉ lệ vì quy mô hai trường khác nhau."), T("각 학교의 사용 학생 수를 구해 더한 뒤 전체 학생 수로 나눠요.", "Tính số học sinh dùng ở mỗi trường, cộng lại rồi chia cho tổng số học sinh.")], expl: T(`(${n1}×${p1}% + ${n2}×${p2}%) ÷ ${n1 + n2} = ${value}%`, `(${n1}×${p1}% + ${n2}×${p2}%) ÷ ${n1 + n2} = ${value}%`), tags: ["reading", "multistep", "reasoning"], features: F(4, 3, 3, 3, 0, 1, 3), verify: () => n1 + n2 > 0 };
  },
};

export const ENGLISH_B = [policy, weather, email, reviews, headline, instructions, errors, sources, dataText];
