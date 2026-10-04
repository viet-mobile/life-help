import { T, NAMES } from "../util.mjs";
import { F, READ, hm, dateStr, addDays } from "./english-a.mjs";

/**
 * Four English generators for practical online information use: judging search results, checking a web form, following help documentation,
 * and turning a notice into a note you can act on. Target text is English everywhere; only instructions / hints / explanations are Korean / Vietnamese.
 * Documents use " | " as line separator, "USD" for money, no double quotes (READ wraps the document in quotes).
 * All sites below are fictional (.example) on purpose.
 */

/** rubric features that make the rubric level equal the requested level 2..9 (reading load, number of conditions, plausible traps) */
const LAD = { 2: F(1, 0, 1, 0, 0, 1, 0), 3: F(1, 0, 2, 1, 0, 1, 0), 4: F(2, 0, 3, 1, 0, 1, 0), 5: F(3, 0, 3, 1, 0, 2, 0), 6: F(3, 0, 3, 2, 0, 2, 0), 7: F(4, 0, 4, 2, 0, 3, 0), 8: F(4, 0, 4, 3, 0, 3, 0), 9: F(5, 1, 4, 3, 0, 3, 0) };
const NOW = 2026;
const unique = (list) => [...new Set(list)];

/* ------------------------------------------------------------ 14. search results: which one should you open? */
const SITES = [
  { domain: "greenfield-library.example", typo: "greenfield-libary.example", name: "Greenfield Library", need: "renew your library card online", pageT: "Renew your library card", pageS: "Log in with your card number and press Renew. It takes about two minutes.", others: [["Opening hours", "See branch opening hours and holiday closing dates."], ["Book a study room", "Reserve a quiet study room for up to two hours."], ["Story time for children", "Weekly story sessions for ages three to six."]] },
  { domain: "riverside-pool.example", typo: "riversidepool.example", name: "Riverside Pool", need: "find the opening hours of the city swimming pool", pageT: "Opening hours", pageS: "Open every day. Weekday hours and school holiday hours are listed here.", others: [["Swimming lessons", "Lessons for beginners start every month."], ["Ticket prices", "Single entry and family passes."], ["Lost property", "Items left at the pool are kept for 30 days."]] },
  { domain: "hillview-centre.example", typo: "hilview-centre.example", name: "Hillview Community Centre", need: "register for the weekend language class", pageT: "Register for weekend language classes", pageS: "Choose a language and a time, then press Register. Places are limited.", others: [["Room hire", "Hire a hall for events and meetings."], ["Volunteer with us", "Join our team of volunteers."], ["Contact the office", "Phone and e-mail details for the front desk."]] },
  { domain: "maple-museum.example", typo: "maple-musuem.example", name: "Maple Museum", need: "book a ticket for the weekend exhibition", pageT: "Book exhibition tickets", pageS: "Pick a date and a time slot, then press Book. Tickets are free for children.", others: [["Visiting with a group", "Group visits need a booking one week ahead."], ["Museum shop", "Books, posters and gifts."], ["Accessibility", "Step-free entrance and quiet hours."]] },
  { domain: "lakeside-clinic.example", typo: "lakeside-clinik.example", name: "Lakeside Clinic", need: "change the time of your appointment", pageT: "Change or cancel an appointment", pageS: "Enter your booking code to move your visit. Please change it 24 hours before.", others: [["Opening hours", "Reception hours and holiday closing dates."], ["Parking", "Where to park and how long you can stay."], ["Test results", "How to collect your results."]] },
  { domain: "eastside-transit.example", typo: "eastside-transitt.example", name: "Eastside Transit", need: "check the timetable of bus 12", pageT: "Bus 12 timetable", pageS: "Weekday and weekend departure times from the first stop.", others: [["Fares and passes", "Single tickets and monthly passes."], ["Lost and found", "What to do if you left something on a bus."], ["Service alerts", "Delays and route changes today."]] },
];
const renderResults = (rs) => rs.map((r, i) => `[${i + 1}] ${r.title} (${r.domain}, updated ${r.year}${r.ad ? ", sponsored" : ""}) - ${r.snippet}`).join(" | ");

export const search = {
  id: "search-results", short: "srch", cognitive: "ANALYZE", levels: [3, 9], title: T("검색 결과 중 믿을 만한 것 고르기", "Chọn kết quả tìm kiếm đáng tin"),
  make(rand, level) {
    const s = rand.pick(SITES), others = rand.shuffle(s.others);
    const right = { title: s.pageT, domain: s.domain, year: NOW, snippet: s.pageS, ad: false };
    const offTopic = (k) => ({ title: others[k][0], domain: s.domain, year: NOW, snippet: others[k][1], ad: false });
    const forum = { title: `Anyone know about ${others[2][0].toLowerCase()}?`, domain: "ask-anything-forum.example", year: NOW - 6, snippet: "I tried it years ago and I am not sure it still works. Please reply.", ad: false };
    const ad = { title: `${s.pageT} in 5 minutes - fast service`, domain: "quickfix-deals.example", year: NOW, snippet: "Pay a small fee and we will do it for you. Limited offer.", ad: true };
    const old = { title: s.pageT, domain: s.domain, year: NOW - rand.int(4, 8), snippet: s.pageS, ad: false };
    const lookalike = { title: s.pageT, domain: s.typo, year: NOW, snippet: s.pageS, ad: false };
    let list, rule, need;
    if (level <= 4) { list = level === 3 ? [right, offTopic(0), offTopic(1), offTopic(2)] : [right, offTopic(0), offTopic(1), forum]; rule = "matches what you need"; need = `You want to ${s.need}.`; }
    else if (level <= 6) { list = [right, ad, old, level === 5 ? { ...forum, title: `Anyone know how to ${s.need}?` } : offTopic(0)]; rule = "is not an advertisement, is current and matches what you need"; need = `You want to ${s.need}. Today is in ${NOW}.`; }
    else if (level <= 8) { list = [right, lookalike, old, ad]; rule = "has the exact official web address, is current and matches what you need"; need = `You want to ${s.need}. The official web address of ${s.name} is ${s.domain}. Today is in ${NOW}.`; }
    else { list = [right, lookalike, ...rand.sample([old, ad, offTopic(0)], 2)]; rule = "has the exact official web address, is current, is not an advertisement and matches what you need"; need = `You want to ${s.need}. The official web address of ${s.name} is ${s.domain}. Today is in ${NOW}.`; }
    // independent check of the rule on the data: exactly one result satisfies every condition
    const matches = (r) => (level <= 4 ? r.title === s.pageT && r.domain === s.domain : r.title === s.pageT && r.domain === s.domain && r.year >= NOW - 1 && !r.ad);
    const order = rand.shuffle(list);
    const at = order.findIndex((r) => r === right);
    return {
      type: "choice_fixed", items: order.map((_, i) => `Result ${i + 1}`), correct: at,
      prompt: READ(`${need} | Search results | ${renderResults(order)}`, `Which result should you open? It is the one that ${rule}.`),
      hints: [T("결과마다 주소(도메인), 갱신 연도, 광고 표시, 제목을 차례로 확인해요.", "Với mỗi kết quả, kiểm tra lần lượt địa chỉ (tên miền), năm cập nhật, dấu quảng cáo và tiêu đề."), T("조건을 모두 만족하는 결과는 하나뿐이에요. 하나라도 어긋나면 지워요.", "Chỉ có một kết quả thỏa mọi điều kiện. Chỉ cần sai một điều kiện là loại.")],
      expl: T(`기준(${level <= 4 ? "내용이 맞는 것" : "정확한 공식 주소 · 최신 · 광고 아님 · 내용 일치"})을 모두 만족하는 결과는 ${at + 1}번입니다.`, `Chỉ kết quả ${at + 1} thỏa mọi tiêu chí.`),
      tags: ["context", "reasoning"], features: LAD[level],
      verify: () => order.filter(matches).length === 1 && matches(order[at]),
    };
  },
};

/* ------------------------------------------------------------ 15. web form: which entry will be rejected? */
const pad2 = (n) => String(n).padStart(2, "0");
const digits = (rand, n) => Array.from({ length: n }, (_, i) => (i === 0 ? rand.int(1, 9) : rand.int(0, 9))).join("");
const FIELDS = {
  phone: { label: "Phone", rule: "exactly 10 digits, with no spaces or dashes", ok: (v) => /^\d{10}$/.test(v), good: (r) => `0${digits(r, 9)}`, bad: (r, hard) => (hard ? `0${digits(r, 8)}` : `${digits(r, 3)}-${digits(r, 6)}`) },
  postcode: { label: "Postcode", rule: "exactly 5 digits", ok: (v) => /^\d{5}$/.test(v), good: (r) => digits(r, 5), bad: (r, hard) => (hard ? `${digits(r, 4)}A` : digits(r, 4)) },
  tickets: { label: "Tickets", rule: "a whole number from 1 to 6", ok: (v) => /^[1-6]$/.test(v), good: (r) => String(r.int(1, 6)), bad: (r, hard) => (hard ? "2.5" : String(r.pick([0, 7, 8]))) },
  username: { label: "Username", rule: "4 to 12 letters or numbers, with no spaces", ok: (v) => /^[A-Za-z0-9]{4,12}$/.test(v), good: (r) => `${r.pick(["mina", "junho", "linh", "sora"])}${r.int(10, 99)}`, bad: (r, hard) => (hard ? "mina lee" : "abc") },
  password: { label: "Password", rule: "at least 8 characters and at least one number", ok: (v) => v.length >= 8 && /\d/.test(v), good: (r) => `${r.pick(["maple", "river", "stone"])}tree${r.int(1, 99)}`, bad: (r, hard) => (hard ? `abc${r.int(1, 9)}xy` : "maplestone") },
  email: { label: "Email", rule: "exactly one @ sign and at least one dot after it", ok: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), good: (r) => `${r.pick(["mina", "jun", "lan"])}@mail.example`, bad: (r, hard) => (hard ? "mina@mailexample" : "mina.mail.example") },
  date: { label: "Date", rule: "DD/MM/YYYY, and the date must exist", ok: (v) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v); if (!m) return false; const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])); return d.getUTCDate() === +m[1] && d.getUTCMonth() === +m[2] - 1; }, good: (r) => `${pad2(r.int(1, 28))}/${pad2(r.int(1, 12))}/2026`, bad: (r, hard) => (hard ? `31/${pad2(r.pick([2, 4, 6, 9]))}/2026` : `2026/${pad2(r.int(1, 12))}/${pad2(r.int(1, 28))}`) },
};
const POOL = { 2: ["phone", "postcode", "tickets", "username", "email"], 3: ["phone", "postcode", "tickets", "username", "email"], 4: ["phone", "postcode", "tickets", "username", "password", "email"], 5: ["phone", "postcode", "tickets", "username", "password", "email"], 6: ["phone", "tickets", "username", "password", "email", "date"], 7: ["phone", "tickets", "username", "password", "email", "date"] };

export const form = {
  id: "form-check", short: "form", cognitive: "APPLY", levels: [2, 8], title: T("입력 양식 규칙 확인하기", "Kiểm tra quy tắc của biểu mẫu"),
  make(rand, level) {
    const cross = level >= 8, hard = level >= 5;
    for (let attempt = 0; attempt < 30; attempt++) {
      const keys = cross ? ["username", "password", ...rand.sample(["phone", "postcode", "email", "date", "tickets"], 2)] : rand.sample(POOL[level], 4);
      const bad = rand.pick(keys);
      const entries = keys.map((k) => ({ k, v: k === bad && !cross ? FIELDS[k].bad(rand, hard) : FIELDS[k].good(rand) }));
      const user = entries.find((e) => e.k === "username")?.v ?? "";
      // the cross-field rule: a long password with a number that contains the username breaks ONLY that rule
      if (cross) entries.find((e) => e.k === "password").v = `${user}${rand.int(100, 999)}!x`;
      const okEntry = (e) => (cross && e.k === "password" ? e.v.length >= 10 && /\d/.test(e.v) && !e.v.toLowerCase().includes(user.toLowerCase()) : FIELDS[e.k].ok(e.v));
      const rejected = entries.filter((e) => !okEntry(e));
      if (rejected.length !== 1) continue;
      const rules = keys.map((k) => (cross && k === "password" ? "Password: at least 10 characters, at least one number, and it must not contain your username." : `${FIELDS[k].label}: ${FIELDS[k].rule}.`));
      const label = (e) => `${FIELDS[e.k].label}: ${e.v}`;
      const right = label(rejected[0]);
      const wrong = rand.shuffle(entries.filter((e) => e !== rejected[0])).map(label);
      return {
        type: "multiple_choice",
        prompt: READ(`Sign-up form rules | ${rules.join(" | ")}${cross ? ` | Your username is ${user}.` : ""}`, `Mina typed four entries. Which entry will the form reject?${cross ? " Read every rule: one rule compares two fields." : ""}`),
        right, wrong,
        hints: [T("각 항목의 규칙을 하나씩 읽고 입력값에 대 보세요. 길이, 문자 종류, 형식을 확인해요.", "Đọc quy tắc từng mục rồi đối chiếu với giá trị đã nhập: độ dài, loại ký tự, định dạng."), T("거부되는 항목은 하나뿐이에요. 규칙을 하나라도 어기면 거부돼요.", "Chỉ có một mục bị từ chối. Vi phạm dù chỉ một quy tắc là bị từ chối.")],
        expl: T(`${right} 만 규칙을 어겼어요.`, `Chỉ mục “${right}” vi phạm quy tắc.`),
        tags: ["context", "reasoning"], features: LAD[level],
        verify: () => entries.filter((e) => !okEntry(e)).length === 1 && !okEntry(rejected[0]) && wrong.length === 3 && !wrong.includes(right),
      };
    }
    throw new Error("form-check: could not build a form with exactly one rejected entry");
  },
};

/* ------------------------------------------------------------ 16. help documentation: what should you do next? */
const GUIDES = [
  (m) => ({ device: "router", light: "The router light", states: [
    { s: "red", doc: "Red: unplug the router for 30 seconds, then plug it in again.", act: "Unplug the router for 30 seconds, then plug it in again." },
    { s: "off", doc: "Off: check the power cable first.", act: "Check the power cable first." },
    { s: "solid green", doc: "Solid green: the router works, so restart your computer instead.", act: "Restart your computer." },
    { s: "blinking green", doc: `Blinking green: wait ${m} minutes. If it is still blinking after that, call support.`, act: `Wait ${m} minutes.`, wait: m, then: "Call support." },
    { s: "blinking orange", doc: `Blinking orange: the update is running, so wait ${m} minutes. If it is still orange after that, reset the router with the pin button.`, act: `Wait ${m} minutes.`, wait: m, then: "Reset the router with the pin button." },
  ] }),
  (m) => ({ device: "printer", light: "The printer screen", states: [
    { s: "a flashing paper icon", doc: "Flashing paper icon: open the tray and load paper.", act: "Open the tray and load paper." },
    { s: "a red ink icon", doc: "Red ink icon: replace the ink cartridge.", act: "Replace the ink cartridge." },
    { s: "a spinning wheel", doc: "Spinning wheel: the printer is busy, so do nothing.", act: "Do nothing and let the printer finish." },
    { s: "a flashing error code", doc: `Flashing error code: turn the printer off and on. If the code returns after ${m} minutes, contact the shop.`, act: "Turn the printer off and on.", wait: m, then: "Contact the shop." },
    { s: "a paper jam icon", doc: `Paper jam icon: switch the printer off, pull out the stuck paper and wait ${m} minutes. If the icon stays, call the repair line.`, act: `Switch the printer off and pull out the stuck paper, then wait ${m} minutes.`, wait: m, then: "Call the repair line." },
  ] }),
  (m) => ({ device: "door lock", light: "The door lock keypad", states: [
    { s: "a red light", doc: "Red light: replace the four batteries.", act: "Replace the four batteries." },
    { s: "a green light", doc: "Green light: the lock is open, so push the door.", act: "Push the door." },
    { s: "a blue light", doc: "Blue light: the lock is paired with your phone, so use the app to open it.", act: "Use the app to open it." },
    { s: "three short beeps", doc: `Three short beeps: the wrong code was entered too many times, so wait ${m} minutes. If it still beeps after that, use the spare key.`, act: `Wait ${m} minutes.`, wait: m, then: "Use the spare key." },
    { s: "a flashing white light", doc: `Flashing white light: the lock is restarting, so wait ${m} minutes. If it keeps flashing, contact the building manager.`, act: `Wait ${m} minutes.`, wait: m, then: "Contact the building manager." },
  ] }),
  (m) => ({ device: "washing machine", light: "The washing machine display", states: [
    { s: "code E1", doc: "Code E1: the door is open, so close it and press Start.", act: "Close the door and press Start." },
    { s: "code E3", doc: "Code E3: the filter is blocked, so clean the filter.", act: "Clean the filter." },
    { s: "code E5", doc: `Code E5: too much soap, so run a rinse cycle and wait ${m} minutes. If the code stays, call the service centre.`, act: `Run a rinse cycle and wait ${m} minutes.`, wait: m, then: "Call the service centre." },
    { s: "code E7", doc: `Code E7: the water supply is low, so check the tap and wait ${m} minutes. If the code stays, contact the water company.`, act: `Check the tap and wait ${m} minutes.`, wait: m, then: "Contact the water company." },
    { s: "a steady light", doc: "Steady light: the cycle is finished, so take out the clothes.", act: "Take out the clothes." },
  ] }),
];
export const docs = {
  id: "help-docs", short: "help", cognitive: "ANALYZE", levels: [4, 9], title: T("도움말 문서로 문제 해결하기", "Xử lý sự cố theo tài liệu hướng dẫn"),
  make(rand, level) {
    const m = rand.pick([3, 5, 6, 10, 15]), who = rand.pick(NAMES), still = rand.pick(["The problem is still there.", "Nothing has changed.", "It looks the same."]);
    const g = rand.pick(GUIDES)(m), st = rand.pick(g.states.filter((x) => (level >= 6 ? x.then : true)));
    const doc = `Help guide | ${g.states.map((x) => x.doc).join(" | ")}`;
    const pool = unique(g.states.flatMap((x) => [x.act, x.then].filter(Boolean)));
    const fee = rand.pick([15, 20, 25]), months = rand.pick([3, 6, 8, 14, 18, 26]);
    const intro = `${who} has a problem with the ${g.device}.`;
    const withFee = (a) => `${a.replace(/\.$/, "")} and expect a fee of ${fee} USD.`;
    let right, situation, extraDoc = "", wrong;
    if (level <= 5) { right = st.act; situation = `${intro} ${g.light} shows ${st.s}.`; wrong = rand.shuffle(pool.filter((a) => a !== right)).slice(0, 3); }
    else if (level === 6) {
      right = st.then; situation = `${intro} ${g.light} shows ${st.s}. You did what the guide says and ${st.wait} minutes have passed. ${still}`;
      wrong = unique([st.act, ...rand.shuffle(pool.filter((a) => a !== right && a !== st.act))]).slice(0, 3);
    } else if (level === 7) {
      const w = rand.int(1, st.wait - 1), left = st.wait - w; // waiting time given as a minute count
      right = `Wait ${left} more minutes.`; situation = `${intro} ${g.light} shows ${st.s}. It started ${w} ${w === 1 ? "minute" : "minutes"} ago. ${still}`;
      const ns = unique([st.wait, w, st.wait + w, left + 1, left + 2].filter((n) => n !== left && n > 0));
      wrong = [st.then, ...ns.slice(0, 2).map((n) => `Wait ${n} more minutes.`)];
    } else {
      extraDoc = ` | Support is free for 12 months after purchase. After that, a fee of ${fee} USD applies.`;
      const free = months <= 12;
      right = free ? st.then : withFee(st.then);
      situation = `${intro} ${g.light} shows ${st.s}. You waited the full ${st.wait} minutes. ${still} You bought the ${g.device} ${months} months ago.`;
      const filler = rand.pick(pool.filter((a) => a !== st.then && a !== st.act));
      wrong = free ? [withFee(st.then), st.act, filler] : [st.then, st.act, filler];
    }
    const expected = level <= 5 ? st.act : level === 6 ? st.then : level === 7 ? right : months <= 12 ? st.then : withFee(st.then);
    return {
      type: "multiple_choice", prompt: READ(`${doc}${extraDoc} | Situation: ${situation}`, "What should you do now?"), right, wrong,
      hints: [T("먼저 지금 상태가 안내문의 어느 줄에 해당하는지 찾아요.", "Trước hết tìm xem tình trạng hiện tại ứng với dòng nào trong hướng dẫn."), T(level >= 6 ? "이미 한 일, 지난 시간, 조건(예: 기간)을 안내문과 비교해요." : "그 줄이 알려 주는 행동만 고르세요.", level >= 6 ? "So sánh việc đã làm, thời gian đã qua và điều kiện (ví dụ thời hạn) với hướng dẫn." : "Chỉ chọn hành động mà dòng đó chỉ dẫn.")],
      expl: T(`안내문과 지금 상황을 맞춰 보면 해야 할 일은: ${right}`, `Đối chiếu hướng dẫn với tình huống hiện tại, việc cần làm là: ${right}`),
      tags: ["context", "reasoning"], features: LAD[level],
      verify: () => right === expected && wrong.length === 3 && !wrong.includes(right) && new Set(wrong).size === 3,
    };
  },
};

/* ------------------------------------------------------------ 17. summarising a notice into a note you can act on */
const EVENTS = [
  { what: "free coding workshop", places: ["Room 204", "Room 118", "the library hall"], items: ["your student ID", "a laptop", "a water bottle"] },
  { what: "community clean-up day", places: ["the north gate", "the park office", "Hall B"], items: ["gloves", "a hat", "a reusable bag"] },
  { what: "health check session", places: ["Clinic Room 3", "the sports hall", "Room 12"], items: ["your health card", "a list of medicines", "your glasses"] },
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const note = {
  id: "notice-to-note", short: "note", cognitive: "APPLY", levels: [3, 8], title: T("안내문을 할 일 메모로 정리하기", "Tóm tắt thông báo thành ghi chú hành động"),
  make(rand, level) {
    const ev = rand.pick(EVENTS), who = rand.pick(NAMES);
    const d0 = new Date(Date.UTC(2026, rand.int(2, 9), rand.int(2, 20)));
    const start = rand.pick([14, 15, 16]) * 60 + rand.pick([0, 30]);
    const truth = { day: `${DAYS[d0.getUTCDay()]} ${dateStr(d0)}`, time: hm(start), place: rand.pick(ev.places), item: rand.pick(ev.items) };
    const stale = { ...truth };
    let text = `The ${ev.what} is on ${truth.day} at ${truth.time} in ${truth.place}. Please bring ${truth.item}.`;
    if (level >= 5) text += ` The office opens at ${hm(540)} and doors open ${level >= 7 ? "30 minutes" : "an hour"} before the start. Reply by ${dateStr(addDays(d0, -4))} if you cannot come.`;
    if (level >= 7) {
      const newPlace = rand.pick(ev.places.filter((p) => p !== truth.place)), shift = rand.pick([30, 60]);
      truth.place = newPlace; truth.time = hm(start + shift);
      text += ` Update: the ${ev.what} has moved to ${truth.place} and now starts ${shift === 60 ? "one hour" : "30 minutes"} later.`;
    }
    const noteOf = (f) => `${f.day}, ${f.time}, ${f.place}, bring ${f.item}`;
    const right = noteOf(truth);
    const alt = {
      day: `${DAYS[(d0.getUTCDay() + 1) % 7]} ${dateStr(addDays(d0, 1))}`,
      time: hm(start + 60),
      place: ev.places.find((p) => p !== truth.place && p !== stale.place) ?? ev.places[0],
      item: rand.pick(ev.items.filter((i) => i !== truth.item)),
    };
    const variants = [
      { ...truth, day: alt.day },
      { ...truth, item: alt.item },
      level >= 7 ? { ...truth, place: stale.place, time: stale.time } : { ...truth, time: alt.time },
      { ...truth, place: alt.place },
    ].map(noteOf).filter((v) => v !== right);
    const wrong = unique(variants).slice(0, 3);
    return {
      type: "multiple_choice", prompt: READ(`Notice to residents | ${text}`, `${who} wants one short note to put in the calendar. Which note is correct and complete?`), right, wrong,
      hints: [T("메모에 꼭 필요한 정보(날짜·시간·장소·준비물)를 먼저 정해요. 안내문의 ‘변경’ 내용이 있으면 그것이 최신이에요.", "Xác định thông tin cần có trong ghi chú (ngày, giờ, địa điểm, đồ mang theo). Nếu có phần cập nhật thì đó là thông tin mới nhất."), T("선택지를 하나씩 안내문과 비교해 어긋나는 한 가지를 찾아요.", "So từng phương án với thông báo để tìm điểm sai duy nhất.")],
      expl: T(`${level >= 7 ? "변경된 최신 정보를 반영한 메모: " : "안내문의 정보를 모두 담은 메모: "}${right}`, `${level >= 7 ? "Ghi chú theo thông tin đã cập nhật: " : "Ghi chú có đủ thông tin trong thông báo: "}${right}`),
      tags: ["context", "reasoning"], features: LAD[level],
      verify: () => wrong.length === 3 && wrong.every((w) => w !== right) && [truth.day, truth.time, truth.place, truth.item].every((x) => right.includes(x)) && text.includes(truth.place) && text.includes(truth.item),
    };
  },
};

/* ------------------------------------------------------------ 18. two documents that should agree: which detail does NOT match? */
const BOOK = [
  { what: "dentist appointment", places: ["Room 5", "Room 8", "Room 12", "Room 3"], fee: [30, 35, 45, 50] },
  { what: "driving theory class", places: ["Hall A", "Hall C", "Room 21", "Room 7"], fee: [20, 25, 40, 60] },
  { what: "photo ID session", places: ["Desk 4", "Desk 9", "Window 2", "Window 6"], fee: [10, 15, 18, 22] },
];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FIELD_NAMES = ["The date", "The time", "The place", "The fee", "The booking code"];
export const mismatch = {
  id: "inconsistency-check", short: "mis", cognitive: "ANALYZE", levels: [4, 9], title: T("두 문서에서 서로 다른 정보 찾기", "Tìm thông tin không khớp giữa hai văn bản"),
  make(rand, level) {
    const b = rand.pick(BOOK), who = rand.pick(NAMES);
    const d0 = new Date(Date.UTC(2026, rand.int(2, 9), rand.int(2, 25))), min = rand.pick([9, 10, 11, 14, 15, 16]) * 60 + rand.pick([0, 30]);
    const truth = { date: d0, time: min, place: rand.pick(b.places), fee: rand.pick(b.fee), code: "K" + rand.int(1, 9) + rand.pick(["M", "R", "T", "W"]) + rand.int(1, 9) };
    const nFields = level >= 8 ? 5 : 4;
    const differ = rand.int(0, nFields - 1);
    const shown = { ...truth };
    if (differ === 0) shown.date = addDays(d0, rand.pick([1, 2, 7]));
    if (differ === 1) shown.time = min + rand.pick([30, 60, -30]);
    if (differ === 2) shown.place = rand.pick(b.places.filter((p) => p !== truth.place));
    if (differ === 3) shown.fee = truth.fee + rand.pick([5, 10, -5]);
    if (differ === 4) shown.code = truth.code.slice(0, 3) + (truth.code[3] === "9" ? "8" : String(+truth.code[3] + 1));
    const dow = (d) => DAYS[d.getUTCDay()];
    const longDate = (d) => dow(d) + " " + dateStr(d);
    const fmtDate = (d) => (level >= 6 && rand.chance(0.5) ? SHORT[d.getUTCDay()] + ", " + dateStr(d) : longDate(d));
    const fmtTime = (t) => (level >= 6 && rand.chance(0.5) ? String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0") : hm(t));
    const fmtFee = (x) => (level >= 6 && rand.chance(0.5) ? "USD " + x : x + " USD");
    const conf = "Booking confirmation | Name: " + who + " | Service: " + b.what + " | Date: " + longDate(truth.date) + " | Time: " + hm(truth.time) + " | Place: " + truth.place + " | Fee: " + truth.fee + " USD" + (nFields === 5 ? " | Booking code: " + truth.code : "");
    const rem = "Reminder e-mail | Hello " + who + ", this is a reminder about your " + b.what + " on " + fmtDate(shown.date) + ". Please arrive by " + fmtTime(shown.time) + " at " + shown.place + ". The fee is " + fmtFee(shown.fee) + "." + (nFields === 5 ? " Quote the booking code " + shown.code + " at the desk." : "");
    const canon = { date: [truth.date.getTime(), shown.date.getTime()], time: [truth.time, shown.time], place: [truth.place, shown.place], fee: [truth.fee, shown.fee], code: [truth.code, shown.code] };
    const keys = ["date", "time", "place", "fee", "code"].slice(0, nFields);
    const diff = keys.filter((k) => canon[k][0] !== canon[k][1]);
    return {
      type: "choice_fixed", items: FIELD_NAMES.slice(0, 4), correct: Math.min(differ, 3),
      prompt: READ(conf + " | " + rem, "Which detail in the reminder does NOT match the confirmation?" + (nFields === 5 ? " (If it is the booking code, choose the last option.)" : "")),
      hints: [T("두 문서의 같은 항목을 하나씩 짝지어 비교해요. 표현이 달라도 뜻이 같으면 ‘같은 정보’예요(예: 3 pm = 15:00).", "Ghép từng mục giống nhau của hai văn bản để so sánh. Cách viết khác nhưng cùng nghĩa vẫn là cùng thông tin (ví dụ 3 pm = 15:00)."), T("딱 하나만 다릅니다. 날짜·시간·장소·요금 순서로 확인해요.", "Chỉ có đúng một chi tiết khác. Kiểm tra lần lượt ngày, giờ, địa điểm, phí.")],
      expl: T(keys[differ] === "code" ? "예약 번호가 서로 달라요." : FIELD_NAMES[differ] + " 항목이 서로 달라요.", keys[differ] === "code" ? "Mã đặt chỗ không khớp." : "Mục “" + FIELD_NAMES[differ] + "” không khớp."),
      tags: ["context", "reasoning"], features: LAD[level],
      verify: () => diff.length === 1 && keys.indexOf(diff[0]) === differ,
    };
  },
};

/* ------------------------------------------------------------ 19. choosing the best option under constraints */
export const bestOption = {
  id: "best-option", short: "opt", cognitive: "CREATE", levels: [5, 9], title: T("조건에 맞는 최선의 선택하기", "Chọn phương án tốt nhất theo điều kiện"),
  make(rand, level) {
    const who = rand.pick(NAMES), months = rand.pick([6, 8, 9, 10]), needGb = rand.pick([10, 20, 30]);
    for (let attempt = 0; attempt < 3000; attempt++) {
      const plans = ["A", "B", "C", "D"].map((n) => ({ n, m: rand.int(8, 30), gb: rand.pick([5, 10, 20, 30, 40, 50]), term: rand.pick([0, 12, 24]), setup: level >= 6 ? rand.pick([0, 0, 10, 20, 30]) : 0, free: level >= 8 ? rand.pick([0, 0, 1, 2, 3]) : 0, cancel: level >= 7 ? rand.pick([20, 40, 60]) : 0 }));
      const total = (p) => p.m * (months - p.free) + p.setup + (level >= 7 && p.term > months ? p.cancel : 0);
      const score = (p) => (level === 5 ? p.m : total(p));
      const ok = plans.filter((p) => p.gb >= needGb);
      if (ok.length < 2 || ok.length === 4) continue;
      const sorted = [...ok].sort((x, y) => score(x) - score(y));
      if (score(sorted[0]) === score(sorted[1])) continue;
      const best = sorted[0];
      const allSorted = [...plans].sort((x, y) => score(x) - score(y));
      if (allSorted[0] === best || score(allSorted[0]) === score(best)) continue; // a cheaper plan must exist that fails the data need
      const cheapestMonthly = [...ok].sort((x, y) => x.m - y.m)[0];
      if (level >= 6 && attempt < 1500 && cheapestMonthly === best) continue; // the lowest monthly price must not be the answer once extra costs matter
      const show = (p) => "Plan " + p.n + ": " + p.m + " USD per month, " + p.gb + " GB" + (level === 5 ? ", " + (p.term ? p.term + "-month contract" : "no contract") : "") + (level >= 6 ? ", setup fee " + p.setup + " USD" : "") + (level >= 8 && p.free ? ", first " + p.free + (p.free === 1 ? " month free" : " months free") : "") + (level >= 7 ? ", " + (p.term ? p.term + "-month contract, cancel early for " + p.cancel + " USD" : "no contract") : "");
      const goal = level === 5 ? "the lowest monthly price" : "the lowest total cost for the whole " + months + " months (monthly fees plus setup" + (level >= 7 ? " plus any early-cancellation fee, because " + who + " will leave after " + months + " months" : "") + (level >= 8 ? ", and free months are not charged" : "") + ")";
      return {
        type: "choice_fixed", items: plans.map((p) => "Plan " + p.n), correct: plans.indexOf(best),
        prompt: READ("Mobile plans | " + plans.map(show).join(" | "), who + " needs at least " + needGb + " GB per month and wants " + goal + ". Which plan should " + who + " choose?"),
        hints: [T("먼저 필요한 데이터 조건을 만족하지 않는 요금제를 지워요.", "Trước hết loại các gói không đủ dung lượng dữ liệu cần thiết."), T(level === 5 ? "남은 요금제 중 월 요금이 가장 낮은 것을 고르세요." : "남은 요금제마다 전체 비용(월 요금 × 개월 수 + 추가 비용)을 계산해 비교해요.", level === 5 ? "Trong các gói còn lại, chọn gói có phí hàng tháng thấp nhất." : "Với mỗi gói còn lại, tính tổng chi phí (phí tháng × số tháng + chi phí phát sinh) rồi so sánh.")],
        expl: T("조건에 맞는 요금제 중 " + (level === 5 ? "월 요금이 가장 낮은" : "전체 비용이 가장 낮은") + " 것은 Plan " + best.n + "입니다.", "Trong các gói thỏa điều kiện, gói " + (level === 5 ? "có phí tháng thấp nhất" : "có tổng chi phí thấp nhất") + " là Plan " + best.n + "."),
        tags: ["context", "multistep", "reasoning"], features: LAD[level],
        verify: () => best.gb >= needGb && plans.filter((p) => p.gb >= needGb && p !== best).every((p) => score(p) > score(best)),
      };
    }
    throw new Error("best-option: could not build a decisive set of plans");
  },
};

export const ENGLISH_C = [search, form, docs, note, mismatch, bestOption];
