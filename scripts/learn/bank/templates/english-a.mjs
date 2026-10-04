import { T, join } from "../util.mjs";

/**
 * English generators: decoding information people meet online (notices, product pages, schedules, policies, alerts, e-mails).
 * The TARGET text is English in every locale; only instructions, hints and explanations are Korean / Vietnamese.
 * Documents use " | " as a line separator (the lesson renderer shows one line of text) and "USD" instead of a dollar sign (the renderer reads $...$ as math).
 */
export const F = (steps, abstraction, context, novelty, recall, distractor, numberSize) => ({ steps, abstraction, context, novelty, recall, distractor, numberSize });
export const hm = (m) => { const h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am", h12 = ((h + 11) % 12) + 1; return mm ? `${h12}:${String(mm).padStart(2, "0")} ${ap}` : `${h12} ${ap}`; };
export const hm24 = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const READ = (doc, q) => T(`글을 읽고 답하세요. "${doc}" 질문: ${q}`, `Đọc văn bản rồi trả lời. "${doc}" Câu hỏi: ${q}`);
export const usd = (x) => `${Number(x).toFixed(2)} USD`;
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const dateStr = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
export const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const HINT_SCAN = [T("먼저 질문이 묻는 정보(시간, 요일, 값)가 무엇인지 정하고, 글에서 그 단어를 찾아요.", "Trước hết xác định thông tin câu hỏi cần (giờ, thứ, giá trị) rồi tìm từ đó trong văn bản."), T("비슷해 보이는 다른 숫자(다른 요일, 다른 시간)에 속지 않았는지 다시 확인해요.", "Kiểm tra lại để không bị đánh lừa bởi các con số tương tự (thứ khác, giờ khác).")];

/* ------------------------------------------------------------ 1. signs and notices */
const VENUES = ["City Library", "Sunrise Pool", "Green Market", "Science Museum", "Riverside Gym", "Harbor Cinema", "Maple Bakery", "Town Post Office", "Hilltop Zoo", "Lakeside Cafe", "Central Pharmacy", "Youth Center"];
export const notice = {
  id: "sign-notice", short: "sign", cognitive: "PROCEDURE", levels: [1, 4], title: T("안내문에서 정보 찾기", "Tìm thông tin trên thông báo"),
  make(rand, level) {
    const venue = rand.pick(VENUES), open = rand.int(7, 10) * 60, close = rand.int(16, 20) * 60, satOpen = open + 60, satClose = close - 120;
    const times = (base, n = 3) => [...new Set([base, base - 60, base + 60, base - 120, base + 120, base - 30])].slice(0, n + 3).filter((x) => x !== base).slice(0, 3).map(hm);
    if (level === 1) { const askOpen = rand.chance(0.5), target = askOpen ? open : close; return { type: "multiple_choice", prompt: READ(`${venue} | Open: ${hm(open)} to ${hm(close)}`, askOpen ? "What time does it open?" : "What time does it close?"), right: hm(target), wrong: times(target), hints: HINT_SCAN, expl: T(askOpen ? `'to' 앞의 시각이 여는 시간이에요: ${hm(open)}.` : `'to' 뒤의 시각이 닫는 시간이에요: ${hm(close)}.`, askOpen ? `Giờ trước 'to' là giờ mở cửa: ${hm(open)}.` : `Giờ sau 'to' là giờ đóng cửa: ${hm(close)}.`), tags: ["reading"], features: F(1, 0, 0, 0, 0, 1, 0), verify: () => close > open }; }
    if (level === 2) return { type: "multiple_choice", prompt: READ(`${venue} | Monday to Friday: ${hm(open)} to ${hm(close)} | Saturday: ${hm(satOpen)} to ${hm(satClose)} | Sunday: closed`, "When can you visit on Saturday?"), right: `${hm(satOpen)} to ${hm(satClose)}`, wrong: [`${hm(open)} to ${hm(close)}`, `${hm(satOpen)} to ${hm(close)}`, "It is closed on Saturday."], hints: HINT_SCAN, expl: T(`토요일 줄을 찾아요: ${hm(satOpen)}–${hm(satClose)}.`, `Tìm dòng thứ Bảy: ${hm(satOpen)}–${hm(satClose)}.`), tags: ["reading"], features: F(1, 0, 2, 0, 0, 2, 0), verify: () => true };
    if (level === 3) return { type: "multiple_choice", prompt: READ(`${venue} | Monday to Saturday: ${hm(open)} to ${hm(close)} | Closed on Sundays and public holidays`, "Next Wednesday is a public holiday. Can you visit that day?"), right: "No. It is closed on public holidays.", wrong: [`Yes, from ${hm(open)} to ${hm(close)}.`, `Yes, but only until ${hm(close - 120)}.`, "Yes, it is open every day."], hints: HINT_SCAN, expl: T("공휴일에는 문을 닫는다고 적혀 있어요.", "Văn bản nói đóng cửa vào ngày lễ."), tags: ["reading", "reasoning"], features: F(2, 0, 2, 1, 0, 2, 0), verify: () => true };
    const mins = rand.pick([30, 45]), last = close - mins;
    return { type: "multiple_choice", prompt: READ(`${venue} | Monday to Saturday: ${hm(open)} to ${hm(close)} | Last entry: ${mins} minutes before closing | Closed on Sundays`, "What is the last time you can enter on Monday?"), right: hm(last), wrong: [hm(close), hm(close - 60), hm(close - mins + 15)], hints: [T("'closing'은 닫는 시각이에요. 그 시각에서 얼마나 앞인지 계산해요.", "‘closing’ là giờ đóng cửa. Hãy tính sớm hơn bao nhiêu phút."), HINT_SCAN[1]], expl: T(`${hm(close)} − ${mins}분 = ${hm(last)}`, `${hm(close)} − ${mins} phút = ${hm(last)}`), tags: ["reading", "multistep"], features: F(2, 0, 2, 1, 0, 3, 1), verify: () => last < close };
  },
};

/* ------------------------------------------------------------ 2. comparing products */
const ITEMS = ["headphones", "water bottle", "backpack", "desk lamp", "keyboard", "speaker"];
const BRANDS = ["Nova", "Orbit", "Pixel", "Zen", "Lumo", "Kite"];
export const product = {
  id: "product-compare", short: "prod", cognitive: "ANALYZE", levels: [2, 8], title: T("상품 정보 비교하기", "So sánh thông tin sản phẩm"),
  make(rand, level) {
    const noun = rand.pick(ITEMS), names = rand.sample(BRANDS, level <= 3 ? 2 : 4);
    const mk = () => ({ price: rand.int(15, 60) + rand.pick([0, 0.5, 0.99]), ship: rand.pick([0, 2.5, 4.5, 6]), rating: rand.pick([3.6, 3.9, 4.1, 4.3, 4.6, 4.8]), days: rand.int(1, 7) });
    const ps = names.map(mk);
    const coupon = level >= 7 ? rand.pick([10, 15, 20]) : 0, freeOver = level >= 8 ? rand.pick([50, 60]) : 0, minRating = level >= 5 ? 4.0 : 0, maxDays = level >= 6 ? 4 : 99;
    const total = (p) => { const item = p.price * (1 - coupon / 100); const ship = freeOver && item >= freeOver ? 0 : p.ship; return Math.round((item + ship) * 100) / 100; };
    const ok = ps.map((p) => p.rating >= minRating && p.days <= maxDays);
    const doc = `${noun} | ` + ps.map((p, i) => `${names[i]}: ${usd(p.price)}, shipping ${p.ship ? usd(p.ship) : "free"}, rating ${p.rating}, delivery ${p.days} day${p.days > 1 ? "s" : ""}`).join(" | ") + (coupon ? ` | Code SAVE${coupon} takes ${coupon}% off the item price (not shipping)` : "") + (freeOver ? ` | Shipping is free when the item price after discount is ${freeOver} USD or more` : "");
    if (level === 2) { const cheap = ps[0].price <= ps[1].price ? 0 : 1; if (ps[0].price === ps[1].price) return product.make(rand, level); return { type: "multiple_choice", prompt: READ(doc, "Which one has the lower item price?"), right: names[cheap], wrong: [names[1 - cheap], "They cost the same.", "The text does not say."], hints: HINT_SCAN, expl: T(`${names[cheap]}의 가격이 더 낮아요.`, `Giá của ${names[cheap]} thấp hơn.`), tags: ["reading"], features: F(1, 0, 2, 0, 0, 2, 1), verify: () => true }; }
    if (level === 3) { const i = rand.int(0, 1), t = Math.round((ps[i].price + ps[i].ship) * 100) / 100; return { type: "multiple_choice", prompt: READ(doc, `What is the total cost of the ${names[i]} with shipping?`), right: usd(t), wrong: [...new Set([usd(ps[i].price), usd(ps[i].price + ps[1 - i].ship), usd(t + 2), usd(t + 1), usd(t - 1), usd(t + 4)])].filter((v) => v !== usd(t)).slice(0, 3), hints: [T("총액 = 물건 값 + 배송비. 배송비가 ‘free’이면 0이에요.", "Tổng = giá hàng + phí vận chuyển. ‘free’ nghĩa là 0."), HINT_SCAN[1]], expl: T(`${usd(ps[i].price)} + ${ps[i].ship ? usd(ps[i].ship) : "0"} = ${usd(t)}`, `${usd(ps[i].price)} + ${ps[i].ship ? usd(ps[i].ship) : "0"} = ${usd(t)}`), tags: ["reading", "multistep"], features: F(2, 0, 2, 0, 0, 2, 2), verify: () => t >= ps[i].price }; }
    const pool = ps.map((p, i) => ({ i, t: total(p) })).filter((x) => ok[x.i]);
    if (pool.length < 2) return product.make(rand, level);
    pool.sort((a, b) => a.t - b.t);
    if (pool[0].t === pool[1].t) return product.make(rand, level);
    const best = pool[0], ask = level >= 8 ? "num" : "name";
    const rule = [minRating ? `rating at least ${minRating}` : "", maxDays < 99 ? `delivery within ${maxDays} days` : ""].filter(Boolean).join(" and ");
    const q = `${rule ? `You need ${rule}. ` : ""}${ask === "name" ? "Which one gives the lowest total cost (including shipping)?" : "How much do you pay in total for the cheapest one that meets your needs?"}`;
    const steps = 2 + (minRating ? 1 : 0) + (maxDays < 99 ? 1 : 0) + (coupon ? 1 : 0) + (freeOver ? 1 : 0);
    const common = { hints: [T("조건에 맞지 않는 상품을 먼저 지우고, 남은 것만 총액을 계산해요.", "Loại các sản phẩm không đạt điều kiện trước, rồi chỉ tính tổng cho những cái còn lại."), T(`${coupon ? "할인은 물건 값에만 적용돼요. " : ""}${freeOver ? "할인 후 가격이 기준 이상이면 배송비가 0이에요." : "배송비를 꼭 더해요."}`, `${coupon ? "Giảm giá chỉ áp dụng cho giá hàng. " : ""}${freeOver ? "Nếu giá sau giảm đạt mức quy định thì phí vận chuyển bằng 0." : "Đừng quên cộng phí vận chuyển."}`)], expl: T(`조건을 만족하는 상품만 비교하면 ${names[best.i]}가 가장 싸요(총 ${usd(best.t)}).`, `Chỉ so sánh các sản phẩm đạt điều kiện thì ${names[best.i]} rẻ nhất (tổng ${usd(best.t)}).`), tags: ["reading", "multistep", "reasoning"], features: F(Math.min(6, steps), 1, 3, level >= 6 ? 2 : 1, 0, 2, level >= 7 ? 3 : 2), verify: () => pool.every((x) => x.t >= best.t) };
    if (ask === "name") return { type: "multiple_choice", prompt: READ(doc, q), right: names[best.i], wrong: names.filter((_, i) => i !== best.i), ...common };
    return { type: "numeric", prompt: join(READ(doc, q), T("(USD 숫자만, 소수 둘째 자리까지)", "(chỉ nhập số USD, đến hai chữ số thập phân)")), value: best.t, tol: 0.011, ...common };
  },
};

/* ------------------------------------------------------------ 3. schedules and time */
const SESS = ["Robotics", "Poster fair", "Lunch talk", "Coding lab", "Art studio", "Science show", "Career panel", "Music workshop"];
const dur = (m) => `${Math.floor(m / 60) ? `${Math.floor(m / 60)} hour${Math.floor(m / 60) > 1 ? "s" : ""}` : ""}${Math.floor(m / 60) && m % 60 ? " " : ""}${m % 60 ? `${m % 60} minutes` : ""}`;
export const schedule = {
  id: "schedule-constraints", short: "sch", cognitive: "ANALYZE", levels: [3, 8], title: T("일정표 읽고 계획 세우기", "Đọc lịch và lập kế hoạch"),
  make(rand, level) {
    const n = level >= 6 ? 5 : 4, names = rand.sample(SESS, n); let t = rand.pick([9, 10]) * 60; const s = [];
    for (let i = 0; i < n; i++) { const d = rand.pick([45, 60, 75, 90]); const gap = rand.pick([0, 5, 10, 15, 30]); s.push({ name: names[i], a: t, b: t + d }); t += d + gap - (level >= 5 && rand.chance(0.35) ? 30 : 0); }
    const fmt = level >= 7 ? hm24 : hm, doc = "Open day schedule | " + s.map((x) => `${x.name} ${fmt(x.a)}-${fmt(x.b)}`).join(" | ");
    const overlap = (x, y) => x.a < y.b && y.a < x.b;
    const hints = [T("시각을 계산하기 전에 시작·끝 시각을 표처럼 정리해요.", "Hãy ghi giờ bắt đầu và kết thúc thành bảng trước khi tính."), T("겹치는지는 ‘앞 행사가 끝난 시각 ≤ 뒤 행사가 시작한 시각’인지로 판단해요.", "Hai hoạt động không chồng nhau khi hoạt động trước kết thúc trước hoặc đúng lúc hoạt động sau bắt đầu.")];
    if (level === 3) { const x = rand.pick(s); return { type: "multiple_choice", prompt: READ(doc, `What time does ${x.name} start?`), right: fmt(x.a), wrong: [fmt(x.b), ...s.filter((y) => y !== x).slice(0, 2).map((y) => fmt(y.a))], hints, expl: T(`${x.name}은(는) ${fmt(x.a)}에 시작해요.`, `${x.name} bắt đầu lúc ${fmt(x.a)}.`), tags: ["reading"], features: F(1, 0, 2, 0, 0, 2, 1), verify: () => true }; }
    if (level === 4) { const x = rand.pick(s), d = x.b - x.a; return { type: "multiple_choice", prompt: READ(doc, `How long is ${x.name}?`), right: dur(d), wrong: [dur(d + 15), dur(d - 15), dur(d + 30)].filter((v) => v), hints, expl: T(`${fmt(x.b)} − ${fmt(x.a)} = ${dur(d)}`, `${fmt(x.b)} − ${fmt(x.a)} = ${dur(d)}`), tags: ["reading", "multistep"], features: F(2, 0, 2, 0, 0, 2, 1), verify: () => d > 0 }; }
    const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (overlap(s[i], s[j])) pairs.push([i, j]);
    if (level === 5) { if (pairs.length !== 1) return schedule.make(rand, level); const [i, j] = pairs[0], all = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) all.push([a, b]); const wrong = all.filter(([a, b]) => !(a === i && b === j)).slice(0, 3); return { type: "multiple_choice", prompt: READ(doc, "Which two activities overlap in time?"), right: `${s[i].name} and ${s[j].name}`, wrong: wrong.map(([a, b]) => `${s[a].name} and ${s[b].name}`), hints, expl: T(`${s[i].name}이(가) 끝나기 전에 ${s[j].name}이(가) 시작해요.`, `${s[j].name} bắt đầu trước khi ${s[i].name} kết thúc.`), tags: ["reading", "reasoning"], features: F(3, 1, 2, 1, 0, 3, 1), verify: () => overlap(s[i], s[j]) }; }
    const walk = 15; // minutes needed to get from one room to the next
    const reach = (x, y) => y.a >= x.b + walk;
    if (level === 6) { const i = rand.int(0, n - 2), x = s[i], can = s.filter((y) => y !== x && reach(x, y)), first = can.sort((p, q) => p.a - q.a)[0]; if (!first) return schedule.make(rand, level); const wrong = s.filter((y) => y !== x && y !== first).slice(0, 3); if (wrong.length < 3) return schedule.make(rand, level); return { type: "multiple_choice", prompt: READ(doc, `It takes ${walk} minutes to walk between rooms. After ${x.name}, which is the first activity you can still attend from the start?`), right: first.name, wrong: wrong.map((y) => y.name), hints: [T("끝나는 시각에 이동 시간을 더한 시각 이후에 시작하는 행사만 가능해요.", "Chỉ tham dự được hoạt động bắt đầu sau (giờ kết thúc + thời gian đi lại)."), hints[0]], expl: T(`${x.name}이(가) ${fmt(x.b)}에 끝나고 ${walk}분을 걸어야 하니 ${fmt(x.b + walk)} 이후에 시작하는 첫 행사는 ${first.name}`, `${x.name} kết thúc lúc ${fmt(x.b)}, đi lại ${walk} phút nên hoạt động đầu tiên bắt đầu từ ${fmt(x.b + walk)} trở đi là ${first.name}`), tags: ["reading", "multistep", "reasoning"], features: F(3, 1, 3, 2, 0, 3, 1), verify: () => reach(x, first) }; }
    if (level === 7) { const x = rand.pick(s), off = 9, utcStart = x.a - off * 60; const wrapOk = utcStart >= 0; if (!wrapOk) return schedule.make(rand, level); return { type: "multiple_choice", prompt: READ(`Online event | ${x.name} starts at ${hm24(utcStart)} UTC`, "Korea time is UTC+9. What time does it start in Korea?"), right: hm24(x.a), wrong: [...new Set([hm24(utcStart), hm24(((utcStart - off * 60) % 1440 + 1440) % 1440), hm24(x.a + 60), hm24(x.a - 60), hm24(x.a + 120)])].filter((v) => v !== hm24(x.a)).slice(0, 3), hints: [T("UTC+9는 UTC보다 9시간 빠르다는 뜻이에요.", "UTC+9 nghĩa là sớm hơn UTC 9 giờ."), T("더하기인지 빼기인지 헷갈리면 ‘한국이 더 일찍 해가 뜬다’를 떠올려요.", "Nếu nhầm cộng hay trừ, hãy nhớ Hàn Quốc ở phía đông nên giờ muộn hơn UTC.")], expl: T(`${hm24(utcStart)} + 9시간 = ${hm24(x.a)}`, `${hm24(utcStart)} + 9 giờ = ${hm24(x.a)}`), tags: ["reading", "multistep"], features: F(2, 1, 2, 2, 0, 3, 2), verify: () => utcStart + off * 60 === x.a }; }
    // level 8: how many activities can you attend if you always need `walk` minutes to move
    const order = [...s].sort((p, q) => p.b - q.b); let last = -Infinity, count = 0; for (const y of order) if (y.a >= last + (count ? walk : 0)) { count++; last = y.b; }
    return { type: "numeric", prompt: join(READ(doc, `You want to attend as many activities as possible. You need ${walk} minutes to move between rooms. How many activities can you attend?`), T("(숫자만 쓰세요)", "(chỉ nhập số)")), value: count, hints: [T("끝나는 시각이 이른 행사부터 고르면 더 많이 들어갈 수 있어요.", "Chọn hoạt động kết thúc sớm trước thì xếp được nhiều hơn."), T("고른 행사 사이에는 항상 이동 시간을 확보해야 해요.", "Giữa các hoạt động đã chọn luôn phải chừa thời gian đi lại.")], expl: T(`끝나는 시각 순으로 이동 시간을 지키며 고르면 최대 ${count}개`, `Chọn theo thứ tự giờ kết thúc và giữ thời gian đi lại, tối đa ${count} hoạt động`), tags: ["reasoning", "multistep"], features: F(5, 2, 3, 4, 0, 1, 2), verify: () => count >= 1 };
  },
};

const SIGNS = [
  { l: 1, s: "EXIT", m: "the way out", ko: "‘나가는 곳’이라는 뜻이에요.", vi: "Nghĩa là ‘lối ra’." }, { l: 1, s: "PUSH", m: "move the door away from you", ko: "문을 ‘미세요’라는 뜻이에요.", vi: "Nghĩa là ‘đẩy cửa’." },
  { l: 1, s: "PULL", m: "bring the door toward you", ko: "문을 ‘당기세요’라는 뜻이에요.", vi: "Nghĩa là ‘kéo cửa’." }, { l: 1, s: "CLOSED", m: "not open now", ko: "지금은 ‘닫았다’는 뜻이에요.", vi: "Nghĩa là ‘hiện đang đóng cửa’." },
  { l: 2, s: "WET FLOOR", m: "the floor is slippery", ko: "바닥이 ‘젖어 미끄럽다’는 뜻이에요.", vi: "Nghĩa là ‘sàn ướt, trơn’." }, { l: 2, s: "NO ENTRY", m: "you may not go in", ko: "‘들어가면 안 된다’는 뜻이에요.", vi: "Nghĩa là ‘cấm vào’." },
  { l: 2, s: "KEEP RIGHT", m: "stay on the right side", ko: "‘오른쪽으로 가세요’라는 뜻이에요.", vi: "Nghĩa là ‘đi bên phải’." }, { l: 2, s: "FRAGILE", m: "it can break easily", ko: "‘깨지기 쉬워요’라는 뜻이에요.", vi: "Nghĩa là ‘dễ vỡ’." },
  { l: 3, s: "NO PARKING", m: "you may not leave a car here", ko: "‘주차 금지’라는 뜻이에요.", vi: "Nghĩa là ‘cấm đỗ xe’." }, { l: 3, s: "OUT OF ORDER", m: "it is broken and cannot be used", ko: "‘고장 나서 쓸 수 없다’는 뜻이에요.", vi: "Nghĩa là ‘hỏng, không dùng được’." },
  { l: 3, s: "KEEP OFF THE GRASS", m: "do not walk on the grass", ko: "‘잔디를 밟지 마세요’라는 뜻이에요.", vi: "Nghĩa là ‘không giẫm lên cỏ’." }, { l: 3, s: "EMERGENCY EXIT ONLY", m: "use this door only in danger", ko: "‘위급할 때만 쓰는 출구’라는 뜻이에요.", vi: "Nghĩa là ‘chỉ dùng khi khẩn cấp’." },
];
export const signs = {
  id: "sign-words", short: "word", cognitive: "MEMORIZE", levels: [1, 3], title: T("자주 보는 표지 영어", "Từ vựng trên biển báo thường gặp"),
  make(rand, level) {
    const pool = SIGNS.filter((x) => x.l <= level), x = rand.pick(pool.filter((p) => p.l === level).length ? pool.filter((p) => p.l === level) : pool);
    return { type: "multiple_choice", prompt: READ(x.s, "What does this sign mean?"), right: x.m, wrong: rand.sample(SIGNS.filter((y) => y.m !== x.m), 3).map((y) => y.m), hints: [T("자주 보는 표지 영어는 뜻을 그대로 기억해 두면 바로 알 수 있어요.", "Từ vựng biển báo quen thuộc nên nhớ nguyên nghĩa để nhận ra ngay."), T("모르면 단어를 하나씩 나누어 뜻을 짐작해 보세요.", "Nếu chưa biết, hãy tách từng từ để đoán nghĩa.")], expl: T(`${x.s}: ${x.ko}`, `${x.s}: ${x.vi}`), tags: ["vocab", "reading"], features: F(1, 0, 0, 0, level === 3 ? 3 : 4, 1, 0), verify: () => !!x.m };
  },
};

export const ENGLISH_A = [signs, notice, product, schedule];
