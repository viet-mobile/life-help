import { T, tex, lin, fracTex, makeMathKit, ONE, WHICH_WRONG } from "./math-kit.mjs";

const P = T;

/** Middle 2: laws of exponents and polynomials, simultaneous equations, linear inequalities, linear functions, probability. */
export function m2(b) {
  const S = { exp: "m.m2.exp", sys: "m.m2.sys", ineq: "m.m2.ineq", func: "m.m2.func", prob: "m.m2.prob" };
  b.skill(S.exp, T("지수법칙과 다항식의 계산", "Quy tắc lũy thừa và tính toán đa thức"));
  b.skill(S.sys, T("연립일차방정식", "Hệ phương trình bậc nhất"), S.exp);
  b.skill(S.ineq, T("일차부등식", "Bất phương trình bậc nhất"), S.sys);
  b.skill(S.func, T("일차함수와 그래프", "Hàm số bậc nhất và đồ thị"), S.ineq);
  b.skill(S.prob, T("경우의 수와 확률", "Số trường hợp và xác suất"), S.func);
  const K = makeMathKit(b, "m2", S);
  const { numeric, choice, truefalse } = K;

  /* ------------------------------ 1. exponents & polynomials ------------------------------ */
  const addExp = (n, role, d, a, c) => numeric({ k: "exp", n, role, d, fam: "exp-add", prompt: P(`${tex(`x^{${a}} \\times x^{${c}} = x^{\\square}`)} 에서 $\\square$ 안에 알맞은 수는? ${ONE.ko}`, `Trong ${tex(`x^{${a}} \\times x^{${c}} = x^{\\square}`)}, số thích hợp trong ô $\\square$ là bao nhiêu? ${ONE.vi}`), value: a + c,
    hints: [P("밑이 같은 곱셈은 지수끼리 더해요.", "Nhân hai lũy thừa cùng cơ số thì cộng số mũ."), P(`${a}+${c}를 계산해요.`, `Hãy tính ${a}+${c}.`)], expl: P(`${tex(`x^{${a}} \\times x^{${c}} = x^{${a}+${c}} = x^{${a + c}}`)}.`, `${tex(`x^{${a}} \\times x^{${c}} = x^{${a}+${c}} = x^{${a + c}}`)}.`) });
  const area = (n, role, d, w, a, h, e) => numeric({ k: "exp", n, role, d, fam: "exp-area", tags: ["context", "multistep"],
    prompt: P(`가로가 ${tex(`${w}x^{${a}}`)}, 세로가 ${tex(`${h}x^{${e}}`)}인 직사각형의 넓이를 ${tex("cx^{k}")} 꼴로 나타낼 때, $c+k$의 값은? ${ONE.ko}`, `Hình chữ nhật có chiều dài ${tex(`${w}x^{${a}}`)} và chiều rộng ${tex(`${h}x^{${e}}`)}. Diện tích viết dưới dạng ${tex("cx^{k}")} thì $c+k$ bằng bao nhiêu? ${ONE.vi}`), value: w * h + a + e,
    hints: [P("넓이 = 가로 × 세로. 계수끼리, 문자는 지수끼리 처리해요.", "Diện tích = dài × rộng. Nhân hệ số với hệ số, cộng số mũ của biến."), P(`계수: ${w}×${h}, 지수: ${a}+${e}`, `Hệ số: ${w}×${h}, số mũ: ${a}+${e}`)],
    expl: P(`넓이는 ${tex(`${w * h}x^{${a + e}}`)} 이므로 $c+k=${w * h}+${a + e}=${w * h + a + e}$.`, `Diện tích là ${tex(`${w * h}x^{${a + e}}`)} nên $c+k=${w * h}+${a + e}=${w * h + a + e}$.`) });
  const wrongLaw = (n, role, d, a, c, f) => {
    const truths = [`x^{${a}}\\times x^{${c}}=x^{${a + c}}`, `(x^{${a}})^{${c}}=x^{${a * c}}`, `x^{${a + c}}\\div x^{${c}}=x^{${a}}`, `(xy)^{${a}}=x^{${a}}y^{${a}}`];
    const falses = [`x^{${a}}\\times x^{${c}}=x^{${a * c}}`, `(x^{${a}})^{${c}}=x^{${a + c}}`, `x^{${a + c}}\\div x^{${c}}=x^{${a + 2 * c}}`, `(xy)^{${a}}=xy^{${a}}`];
    const rest = truths.filter((_, i) => i !== f).map((s) => tex(s));
    return choice({ k: "exp", n, role, d, fam: "exp-wrong", tags: ["reasoning"], prompt: WHICH_WRONG, right: tex(falses[f]), wrong: rest,
      hints: [P("네 식을 하나씩 지수법칙으로 확인해 보세요.", "Hãy kiểm tra từng đẳng thức bằng quy tắc lũy thừa."), P("곱은 지수의 합, 거듭제곱의 거듭제곱은 지수의 곱이에요.", "Tích: cộng số mũ; lũy thừa của lũy thừa: nhân số mũ.")],
      expl: P(`틀린 식은 ${tex(falses[f])} 이에요. 올바른 식은 ${tex(truths[f])} 입니다.`, `Đẳng thức sai là ${tex(falses[f])}. Đẳng thức đúng phải là ${tex(truths[f])}.`) });
  };
  const subPoly = (n, role, d, a, bb, c, dd) => {
    const right = lin(a - c, bb - dd);
    return choice({ k: "exp", n, role, d, fam: "exp-poly", tags: ["multistep"], prompt: P(`${tex(`(${lin(a, bb)}) - (${lin(c, dd)})`)} 을 간단히 하면?`, `Rút gọn ${tex(`(${lin(a, bb)}) - (${lin(c, dd)})`)}.`),
      right: tex(right), wrong: [tex(lin(a - c, bb + dd)), tex(lin(a + c, bb - dd)), tex(lin(a - c, dd - bb)), tex(lin(c - a, bb - dd))].filter((s) => s !== tex(right)),
      hints: [P("괄호 앞의 −는 괄호 안의 모든 항의 부호를 바꿔요.", "Dấu − trước ngoặc đổi dấu mọi hạng tử trong ngoặc."), P("문자 항끼리, 상수항끼리 계산해요.", "Tính riêng các hạng tử chứa x và các hằng số.")],
      expl: P(`${tex(`${lin(a, bb)} ${lin(-c, -dd).startsWith("-") ? "" : "+"}${lin(-c, -dd)} = ${right}`)}.`, `${tex(`${lin(a, bb)} ${lin(-c, -dd).startsWith("-") ? "" : "+"}${lin(-c, -dd)} = ${right}`)}.`) });
  };
  const monoSum = (n, role, d, p, a, bq, m, r, c, e) => {
    const co = p ** m * r, ex = a * m + c, ey = bq * m + e;
    return numeric({ k: "exp", n, role, d, fam: "exp-mono", tags: ["multistep"],
      prompt: P(`${tex(`(${p === 1 ? "" : p}x^{${a}}y^{${bq}})^{${m}} \\times ${r}x^{${c}}y^{${e}} = ax^{p}y^{q}`)} 일 때 $a+p+q$의 값은? ${ONE.ko}`, `Nếu ${tex(`(${p === 1 ? "" : p}x^{${a}}y^{${bq}})^{${m}} \\times ${r}x^{${c}}y^{${e}} = ax^{p}y^{q}`)} thì $a+p+q$ bằng bao nhiêu? ${ONE.vi}`), value: co + ex + ey,
      hints: [P("먼저 괄호의 거듭제곱을 계수와 각 문자에 나누어 적용해요.", "Trước hết khai triển lũy thừa của tích: áp dụng cho hệ số và từng biến."), P("그다음 같은 문자끼리 지수를 더해요.", "Sau đó cộng số mũ của các biến giống nhau.")],
      expl: P(`${tex(`${co}x^{${ex}}y^{${ey}}`)} 이므로 $a+p+q=${co}+${ex}+${ey}=${co + ex + ey}$.`, `Kết quả là ${tex(`${co}x^{${ex}}y^{${ey}}`)} nên $a+p+q=${co}+${ex}+${ey}=${co + ex + ey}$.`) });
  };
  const l1 = [addExp(1, "core", 1, 3, 4), area(2, "core", 2, 2, 2, 3, 3), wrongLaw(3, "core", 2, 2, 3, 1), subPoly(4, "core", 3, 4, 3, 2, -5), monoSum(5, "core", 3, 2, 3, 1, 2, 3, 1, 2)];
  addExp("v1", "variant", 1, 5, 2); wrongLaw("v2", "variant", 2, 3, 4, 0); area("v3", "variant", 2, 4, 1, 2, 4); subPoly("v4", "variant", 2, 5, 1, 3, 4);
  addExp("d1", "diagnostic", 1, 6, 3); wrongLaw("d2", "diagnostic", 3, 2, 5, 2);

  /* ------------------------------ 2. simultaneous equations ------------------------------ */
  const xt = (c) => (c === 1 ? "x" : c === -1 ? "-x" : `${c}x`);
  const yt = (c) => (c === 1 ? "+y" : c === -1 ? "-y" : c > 0 ? `+${c}y` : `${c}y`);
  const sysTxt = (a1, b1, c1, a2, b2, c2) => `\\begin{cases} ${xt(a1)}${yt(b1)}=${c1} \\\\ ${xt(a2)}${yt(b2)}=${c2} \\end{cases}`;
  const solveX = (n, role, d, x, y, a1, b1, a2, b2) => numeric({ k: "sys", n, role, d, fam: "sys-solve", prompt: P(`연립방정식 ${tex(sysTxt(a1, b1, a1 * x + b1 * y, a2, b2, a2 * x + b2 * y))} 의 해를 $(x,\\,y)$ 라 할 때, $x$의 값은? ${ONE.ko}`, `Nghiệm của hệ ${tex(sysTxt(a1, b1, a1 * x + b1 * y, a2, b2, a2 * x + b2 * y))} là $(x,\\,y)$. Giá trị của $x$ là bao nhiêu? ${ONE.vi}`), value: x,
    hints: [P("한 문자를 없애도록 두 식을 더하거나 빼요(가감법).", "Cộng hoặc trừ hai phương trình để khử một ẩn (phương pháp cộng đại số)."), P("필요하면 한 식에 수를 곱해 계수를 맞춰요.", "Nếu cần, nhân một phương trình với một số để hệ số bằng nhau.")],
    expl: P(`두 식을 풀면 $x=${x}$, $y=${y}$ 이에요.`, `Giải hệ ta được $x=${x}$, $y=${y}$.`) });
  const subst = (n, role, d, m, kk, s) => { // y = m x + kk and x + y = s
    const x = (s - kk) / (m + 1); return numeric({ k: "sys", n, role, d, fam: "sys-subst", prompt: P(`연립방정식 ${tex(`\\begin{cases} y=${lin(m, kk)} \\\\ x+y=${s} \\end{cases}`)} 에서 $x$의 값은? ${ONE.ko}`, `Trong hệ ${tex(`\\begin{cases} y=${lin(m, kk)} \\\\ x+y=${s} \\end{cases}`)}, giá trị của $x$ là bao nhiêu? ${ONE.vi}`), value: x,
      hints: [P("첫째 식의 y를 둘째 식에 대입해요(대입법).", "Thế y ở phương trình thứ nhất vào phương trình thứ hai (phương pháp thế)."), P(`x+(${lin(m, kk)})=${s}`, `x+(${lin(m, kk)})=${s}`)], expl: P(`$x+${lin(m, kk)}=${s}$ 이므로 $${lin(m + 1, kk)}=${s}$, $x=${x}$.`, `$x+${lin(m, kk)}=${s}$ nên $${lin(m + 1, kk)}=${s}$, suy ra $x=${x}$.`) });
  };
  const tickets = (n, role, d, pa, pc, total, na) => { const nc = total - na; const money = pa * na + pc * nc;
    return numeric({ k: "sys", n, role, d, fam: "sys-ticket", tags: ["context", "multistep"], prompt: P(`어른 입장료는 ${pa}원, 어린이 입장료는 ${pc}원입니다. 모두 ${total}명이 입장하여 ${money}원을 냈다면 어른은 몇 명일까요? ${ONE.ko}`, `Vé người lớn ${pa} đồng, vé trẻ em ${pc} đồng. Tổng cộng ${total} người vào cổng và trả ${money} đồng. Có bao nhiêu người lớn? ${ONE.vi}`), value: na,
      hints: [P("어른을 x명, 어린이를 y명으로 놓고 인원수와 금액으로 식을 두 개 세워요.", "Gọi x là số người lớn, y là số trẻ em; lập hai phương trình về số người và số tiền."), P(`x+y=${total}, ${pa}x+${pc}y=${money}`, `x+y=${total}, ${pa}x+${pc}y=${money}`)],
      expl: P(`연립방정식을 풀면 $x=${na}$, $y=${nc}$ 이므로 어른은 ${na}명이에요.`, `Giải hệ ta được $x=${na}$, $y=${nc}$ nên có ${na} người lớn.`) }); };
  const which = (n, role, d, x, y) => { const sys = (c1, c2) => tex(sysTxt(1, 1, c1, 1, -1, c2));
    return choice({ k: "sys", n, role, d, fam: "sys-which", tags: ["reasoning"], prompt: P(`$(x,\\,y)=(${x},\\,${y})$ 를 해로 갖는 연립방정식은?`, `Hệ phương trình nào nhận $(x,\\,y)=(${x},\\,${y})$ làm nghiệm?`), right: sys(x + y, x - y),
      wrong: [sys(x + y + 1, x - y), sys(x + y, x - y + 2), sys(x + y - 1, x - y - 1)],
      hints: [P("각 연립방정식에 x, y의 값을 대입해 두 식이 모두 성립하는지 확인해요.", "Thay x, y vào từng hệ và kiểm tra cả hai phương trình đều đúng."), P("한 식만 맞는 것은 해가 아니에요.", "Chỉ đúng một phương trình thì chưa phải nghiệm của hệ.")],
      expl: P(`${tex(`${x}+${y}=${x + y}`)}, ${tex(`${x}-${y}=${x - y}`)} 이 모두 성립하는 연립방정식이 답이에요.`, `Hệ cần chọn là hệ mà cả ${tex(`${x}+${y}=${x + y}`)} và ${tex(`${x}-${y}=${x - y}`)} đều đúng.`) }); };
  const ages = (n, role, d, dif, sum) => { const a = (sum + dif) / 2; return numeric({ k: "sys", n, role, d, fam: "sys-age", tags: ["context", "multistep"], prompt: P(`아버지는 아들보다 ${dif}살 많고, 두 사람의 나이의 합은 ${sum}살입니다. 아버지의 나이는? ${ONE.ko}`, `Bố hơn con ${dif} tuổi và tổng số tuổi của hai người là ${sum}. Bố bao nhiêu tuổi? ${ONE.vi}`), value: a,
    hints: [P("아버지를 x살, 아들을 y살로 놓아요.", "Gọi tuổi bố là x, tuổi con là y."), P(`x−y=${dif}, x+y=${sum} 을 더해 보세요.`, `Cộng hai phương trình x−y=${dif} và x+y=${sum}.`)], expl: P(`두 식을 더하면 $2x=${sum + dif}$, $x=${a}$ 이므로 아버지는 ${a}살이에요.`, `Cộng hai phương trình: $2x=${sum + dif}$, $x=${a}$ nên bố ${a} tuổi.`) }); };
  const infinite = (n, role, d, truth) => truefalse({ k: "sys", n, role, d, fam: "sys-count", tags: ["reasoning"], truth,
    prompt: truth ? P(`연립방정식 ${tex("\\begin{cases} 2x+4y=6 \\\\ x+2y=3 \\end{cases}")} 의 해는 무수히 많다.`, `Hệ ${tex("\\begin{cases} 2x+4y=6 \\\\ x+2y=3 \\end{cases}")} có vô số nghiệm.`) : P(`연립방정식 ${tex("\\begin{cases} 2x+4y=6 \\\\ x+2y=5 \\end{cases}")} 의 해는 무수히 많다.`, `Hệ ${tex("\\begin{cases} 2x+4y=6 \\\\ x+2y=5 \\end{cases}")} có vô số nghiệm.`),
    hints: [P("한 식에 적당한 수를 곱해 다른 식과 비교해 보세요.", "Nhân một phương trình với số thích hợp rồi so sánh với phương trình còn lại."), P("x, y의 계수가 같고 상수항도 같으면 해가 무수히 많아요.", "Hệ số của x, y và vế phải đều tỉ lệ thì có vô số nghiệm.")],
    expl: truth ? P("둘째 식에 2를 곱하면 $2x+4y=6$ 으로 첫째 식과 같아요. 같은 식이므로 해가 무수히 많아요.", "Nhân phương trình thứ hai với 2 ta được $2x+4y=6$, trùng với phương trình thứ nhất nên có vô số nghiệm.") : P("둘째 식에 2를 곱하면 $2x+4y=10$ 이라 첫째 식과 모순이에요. 해가 없어요.", "Nhân phương trình thứ hai với 2 ta được $2x+4y=10$, mâu thuẫn với phương trình thứ nhất nên vô nghiệm.") });
  const l2 = [subst(1, "core", 1, 2, 1, 7), tickets(2, "core", 2, 3000, 2000, 10, 4), which(3, "core", 2, 4, 1), solveX(4, "core", 2, 3, 2, 2, 1, 1, -1), ages(5, "core", 3, 28, 52)];
  subst("v1", "variant", 1, 3, 2, 10); tickets("v2", "variant", 2, 5000, 3000, 8, 3); which("v3", "variant", 2, 5, 2); solveX("v4", "variant", 2, 2, 1, 1, 2, 3, -1);
  solveX("d1", "diagnostic", 2, 1, 3, 1, 1, 2, -1); infinite("d2", "diagnostic", 3, false);

  /* ------------------------------ 3. linear inequalities ------------------------------ */
  const largest = (n, role, d, a, c, rhs) => { const strict = (rhs - c) % a === 0; // ax + c < rhs
    const lim = (rhs - c) / a; const ans = strict ? lim - 1 : Math.floor(lim);
    return numeric({ k: "ineq", n, role, d, fam: "ineq-int", prompt: P(`부등식 ${tex(`${lin(a, c)} < ${rhs}`)} 을 만족하는 가장 큰 정수 $x$의 값은? ${ONE.ko}`, `Số nguyên $x$ lớn nhất thỏa mãn bất phương trình ${tex(`${lin(a, c)} < ${rhs}`)} là bao nhiêu? ${ONE.vi}`), value: ans,
      hints: [P("등식처럼 x가 한쪽에만 남도록 정리해요.", "Biến đổi như phương trình để x ở một vế."), P("'<' 이므로 경계값은 포함되지 않아요.", "Dấu '<' nên không lấy giá trị biên.")],
      expl: P(`$${a}x<${rhs - c}$, $x<${fracTex(rhs - c, a)}$ 이므로 가장 큰 정수는 ${ans} 이에요.`, `$${a}x<${rhs - c}$, $x<${fracTex(rhs - c, a)}$ nên số nguyên lớn nhất là ${ans}.`) }); };
  const flip = (n, role, d, a, c, rhs) => { // -a x + c > rhs  ->  x < (c - rhs)/a
    const lim = (c - rhs) / a; return choice({ k: "ineq", n, role, d, fam: "ineq-flip", tags: ["reasoning"], prompt: P(`부등식 ${tex(`-${a}x+${c} > ${rhs}`)} 의 해는?`, `Nghiệm của bất phương trình ${tex(`-${a}x+${c} > ${rhs}`)} là?`), right: tex(`x<${lim}`),
      wrong: [tex(`x>${lim}`), tex(`x<${-lim}`), tex(`x>${-lim}`)],
      hints: [P("양변에서 상수항을 옮긴 뒤 x의 계수로 나눠요.", "Chuyển hằng số sang vế phải rồi chia cho hệ số của x."), P("음수로 나누면 부등호의 방향이 바뀌어요.", "Chia cho số âm thì đổi chiều bất đẳng thức.")],
      expl: P(`$-${a}x>${rhs - c}$ 의 양변을 $-${a}$ 로 나누면 부등호가 바뀌어 $x<${lim}$ 이에요.`, `$-${a}x>${rhs - c}$; chia hai vế cho $-${a}$ và đổi chiều ta được $x<${lim}$.`) }); };
  const budget = (n, role, d, snack, drink, cnt, money) => { const maxS = Math.floor((money - drink * cnt) / snack);
    return numeric({ k: "ineq", n, role, d, fam: "ineq-budget", tags: ["context", "multistep"], prompt: P(`과자는 한 봉지에 ${snack}원, 음료는 한 병에 ${drink}원입니다. 음료 ${cnt}병을 사고 ${money}원 이하로 쓰려면 과자는 최대 몇 봉지까지 살 수 있을까요? ${ONE.ko}`, `Một gói bánh giá ${snack} đồng, một chai nước giá ${drink} đồng. Mua ${cnt} chai nước và chi không quá ${money} đồng thì mua được tối đa bao nhiêu gói bánh? ${ONE.vi}`), value: maxS,
      hints: [P(`과자를 x봉지로 놓고 ${snack}x+${drink * cnt} ≤ ${money} 을 세워요.`, `Gọi x là số gói bánh, lập ${snack}x+${drink * cnt} ≤ ${money}.`), P("x는 자연수이므로 풀고 나서 알맞은 정수만 고르세요.", "x là số tự nhiên nên sau khi giải hãy chọn số nguyên phù hợp.")],
      expl: P(`$${snack}x\\le ${money - drink * cnt}$, $x\\le ${((money - drink * cnt) / snack).toFixed(2)}$ 이므로 최대 ${maxS}봉지예요.`, `$${snack}x\\le ${money - drink * cnt}$, $x\\le ${((money - drink * cnt) / snack).toFixed(2)}$ nên tối đa ${maxS} gói.`) }); };
  const countInt = (n, role, d, lo, a, c, hi) => { // lo < a x + c <= hi
    let cnt = 0; for (let x = -50; x <= 50; x++) { const v = a * x + c; if (v > lo && v <= hi) cnt++; }
    return numeric({ k: "ineq", n, role, d, fam: "ineq-compound", tags: ["multistep"], prompt: P(`연립부등식 ${tex(`${lo} < ${lin(a, c)} \\le ${hi}`)} 을 만족하는 정수 $x$는 모두 몇 개일까요? ${ONE.ko}`, `Có bao nhiêu số nguyên $x$ thỏa mãn ${tex(`${lo} < ${lin(a, c)} \\le ${hi}`)}? ${ONE.vi}`), value: cnt,
      hints: [P("세 부분에서 같은 수를 빼고 나누어 x만 남겨요.", "Trừ rồi chia cả ba phần để chỉ còn x ở giữa."), P("등호가 있는 쪽의 경계값은 포함돼요.", "Giá trị biên ở phía có dấu bằng được tính.")],
      expl: P(`부등식을 풀어 해당하는 정수를 세면 ${cnt}개예요.`, `Giải bất phương trình rồi đếm các số nguyên thỏa mãn, được ${cnt} số.`) }); };
  const flipTf = (n, role, d, truth) => truefalse({ k: "ineq", n, role, d, fam: "ineq-rule", tags: ["reasoning"], truth,
    prompt: truth ? P("$a<b$ 이면 $-2a>-2b$ 이다.", "Nếu $a<b$ thì $-2a>-2b$.") : P("$a<b$ 이면 $-2a<-2b$ 이다.", "Nếu $a<b$ thì $-2a<-2b$."),
    hints: [P("$a=1,\\ b=2$ 처럼 구체적인 수를 넣어 보세요.", "Hãy thử với số cụ thể như $a=1,\\ b=2$."), P("음수를 곱하면 부등호의 방향이 바뀌어요.", "Nhân với số âm thì đổi chiều bất đẳng thức.")],
    expl: P("양변에 음수를 곱하면 부등호의 방향이 바뀌므로 $-2a>-2b$ 가 맞아요.", "Nhân hai vế với số âm thì đổi chiều nên $-2a>-2b$ mới đúng.") });
  const l3 = [largest(1, "core", 1, 1, 2, 7), budget(2, "core", 2, 1200, 800, 3, 9000), flip(3, "core", 2, 2, 3, 9), countInt(4, "core", 3, -3, 2, -1, 9), flipTf(5, "core", 3, false)];
  largest("v1", "variant", 1, 2, 1, 11); flip("v2", "variant", 2, 3, 5, 20); budget("v3", "variant", 2, 500, 1500, 2, 6000); countInt("v4", "variant", 3, -2, 3, 1, 13);
  largest("d1", "diagnostic", 1, 3, 2, 14); flip("d2", "diagnostic", 3, 4, 1, 13);

  /* ------------------------------ 4. linear functions ------------------------------ */
  const slope = (n, role, d, x1, y1, x2, y2) => numeric({ k: "func", n, role, d, fam: "func-slope", prompt: P(`두 점 $(${x1},\\,${y1})$, $(${x2},\\,${y2})$ 를 지나는 직선의 기울기는? ${ONE.ko}`, `Hệ số góc của đường thẳng đi qua hai điểm $(${x1},\\,${y1})$ và $(${x2},\\,${y2})$ là bao nhiêu? ${ONE.vi}`), value: (y2 - y1) / (x2 - x1),
    hints: [P("기울기 = (y의 증가량) ÷ (x의 증가량)", "Hệ số góc = (độ tăng của y) ÷ (độ tăng của x)."), P(`(${y2}−${y1}) ÷ (${x2}−${x1})`, `(${y2}−${y1}) ÷ (${x2}−${x1})`)], expl: P(`기울기는 $\\frac{${y2}-${y1}}{${x2}-${x1}}=${(y2 - y1) / (x2 - x1)}$ 이에요.`, `Hệ số góc là $\\frac{${y2}-${y1}}{${x2}-${x1}}=${(y2 - y1) / (x2 - x1)}$.`) });
  const taxi = (n, role, d, base, per, pay) => { const k = (pay - base) / per; return numeric({ k: "func", n, role, d, fam: "func-taxi", tags: ["context", "multistep"], prompt: P(`택시 요금은 기본요금 ${base}원에 1 km마다 ${per}원이 더해집니다. 요금이 ${pay}원이었다면 달린 거리는 몇 km일까요? (1 km당 요금은 일정합니다) ${ONE.ko}`, `Cước taxi gồm ${base} đồng mở cửa cộng ${per} đồng cho mỗi 1 km. Nếu cước là ${pay} đồng thì đã đi bao nhiêu km? (Giá mỗi 1 km không đổi) ${ONE.vi}`), value: k,
    hints: [P(`요금 y원과 거리 x km 사이의 관계식: y=${per}x+${base}`, `Quan hệ giữa cước y và số km x: y=${per}x+${base}.`), P(`y=${pay}를 대입해 x를 구해요.`, `Thay y=${pay} rồi giải tìm x.`)], expl: P(`$${per}x+${base}=${pay}$ 에서 $x=${k}$ 이므로 ${k} km예요.`, `Từ $${per}x+${base}=${pay}$ ta có $x=${k}$ nên đã đi ${k} km.`) }); };
  const quad = (n, role, d, sa, sb) => { const q = { "+,+": "제1·2·3", "-,+": "제1·2·4", "+,-": "제1·3·4", "-,-": "제2·3·4" }; const missing = { "+,+": 4, "-,+": 3, "+,-": 2, "-,-": 1 };
    const key = `${sa > 0 ? "+" : "-"},${sb > 0 ? "+" : "-"}`; const names = [T("제1사분면", "góc phần tư thứ 1"), T("제2사분면", "góc phần tư thứ 2"), T("제3사분면", "góc phần tư thứ 3"), T("제4사분면", "góc phần tư thứ 4")];
    const mi = missing[key] - 1; const others = [0, 1, 2, 3].filter((i) => i !== mi);
    return choice({ k: "func", n, role, d, fam: "func-quad", tags: ["reasoning"], prompt: P(`일차함수 $y=ax+b$ 에서 $a${sa > 0 ? ">" : "<"}0,\\ b${sb > 0 ? ">" : "<"}0$ 일 때, 그래프가 지나지 않는 사분면은?`, `Với hàm số $y=ax+b$ có $a${sa > 0 ? ">" : "<"}0,\\ b${sb > 0 ? ">" : "<"}0$, đồ thị không đi qua góc phần tư nào?`), right: names[mi], wrong: others.map((i) => names[i]),
      hints: [P("y절편 b의 부호로 y축과 만나는 위치를, 기울기 a의 부호로 오르내림을 알 수 있어요.", "Dấu của b cho biết giao điểm với trục y, dấu của a cho biết đồ thị đi lên hay đi xuống."), P("a, b에 구체적인 수를 넣어 그려 보세요.", "Hãy chọn a, b cụ thể rồi vẽ đồ thị.")],
      expl: P(`${q[key]}사분면을 지나고, 지나지 않는 것은 ${names[mi].ko}이에요.`, `Đồ thị đi qua các góc phần tư ${q[key].replaceAll("제", "").replaceAll("·", ", ")} và không đi qua ${names[mi].vi}.`) }); };
  const atX = (n, role, d, m, kk, x) => numeric({ k: "func", n, role, d, fam: "func-eval", prompt: P(`일차함수 $y=${lin(m, kk)}$ 에서 $x=${x}$ 일 때 $y$의 값은? ${ONE.ko}`, `Với hàm số $y=${lin(m, kk)}$, khi $x=${x}$ thì $y$ bằng bao nhiêu? ${ONE.vi}`), value: m * x + kk,
    hints: [P("x에 값을 그대로 대입해요.", "Thay giá trị của x vào biểu thức."), P("곱셈을 먼저, 덧셈·뺄셈은 나중에 계산해요.", "Tính nhân trước, rồi mới cộng trừ.")], expl: P(`$y=${m}\\times(${x})${kk >= 0 ? "+" : ""}${kk}=${m * x + kk}$.`, `$y=${m}\\times(${x})${kk >= 0 ? "+" : ""}${kk}=${m * x + kk}$.`) });
  const parallel = (n, role, d, m, kk, px, py) => numeric({ k: "func", n, role, d, fam: "func-parallel", tags: ["multistep", "reasoning"], prompt: P(`직선 $y=${lin(m, kk)}$ 에 평행하고 점 $(${px},\\,${py})$ 를 지나는 직선의 $y$절편은? ${ONE.ko}`, `Đường thẳng song song với $y=${lin(m, kk)}$ và đi qua điểm $(${px},\\,${py})$ cắt trục y tại điểm có tung độ bao nhiêu? ${ONE.vi}`), value: py - m * px,
    hints: [P("평행한 두 직선은 기울기가 같아요.", "Hai đường thẳng song song có cùng hệ số góc."), P(`y=${m}x+b 에 점의 좌표를 대입해 b를 구해요.`, `Thay tọa độ điểm vào y=${m}x+b để tìm b.`)], expl: P(`기울기가 ${m}이므로 $y=${m}x+b$ 에 $(${px},\\,${py})$ 를 넣으면 $b=${py}-${m * px}=${py - m * px}$.`, `Hệ số góc là ${m}; thay $(${px},\\,${py})$ vào $y=${m}x+b$ được $b=${py}-${m * px}=${py - m * px}$.`) });
  const l4 = [slope(1, "core", 1, 1, 2, 3, 8), taxi(2, "core", 2, 3800, 800, 9400), quad(3, "core", 2, -1, 1), atX(4, "core", 2, -3, 5, 4), parallel(5, "core", 3, 3, 1, 2, 5)];
  slope("v1", "variant", 1, 0, 1, 4, 9); quad("v2", "variant", 2, 1, -1); taxi("v3", "variant", 2, 4000, 1000, 12000); atX("v4", "variant", 2, 2, -3, 6);
  slope("d1", "diagnostic", 2, -2, 5, 3, -5); parallel("d2", "diagnostic", 3, -2, 4, 3, -1);

  /* ------------------------------ 5. counting and probability ------------------------------ */
  const coins = (n, role, d, c) => numeric({ k: "prob", n, role, d, fam: "prob-count", prompt: P(`동전 ${c}개를 동시에 던질 때 나오는 모든 경우의 수는? ${ONE.ko}`, `Tung đồng thời ${c} đồng xu thì có tất cả bao nhiêu trường hợp? ${ONE.vi}`), value: 2 ** c,
    hints: [P("동전 한 개는 앞면, 뒷면 두 가지예요.", "Mỗi đồng xu có hai khả năng: sấp hoặc ngửa."), P("곱의 법칙: 동전 수만큼 2를 곱해요.", "Quy tắc nhân: nhân 2 với chính nó theo số đồng xu.")], expl: P(`$2^{${c}}=${2 ** c}$ (가지).`, `$2^{${c}}=${2 ** c}$ (trường hợp).`) });
  const diceSum = (n, role, d, s) => { let c = 0; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === s) c++;
    return numeric({ k: "prob", n, role, d, fam: "prob-dice", prompt: P(`서로 다른 두 주사위를 던질 때 눈의 합이 ${s}인 경우의 수는? ${ONE.ko}`, `Tung hai con xúc xắc khác nhau, số trường hợp để tổng số chấm bằng ${s} là bao nhiêu? ${ONE.vi}`), value: c,
      hints: [P("(첫째 눈, 둘째 눈) 순서쌍으로 하나씩 써 보세요.", "Hãy liệt kê các cặp (mặt thứ nhất, mặt thứ hai)."), P(`합이 ${s}인 순서쌍을 빠짐없이 세요.`, `Đếm đủ các cặp có tổng bằng ${s}.`)], expl: P(`합이 ${s}인 순서쌍은 ${c}개예요.`, `Có ${c} cặp có tổng bằng ${s}.`) }); };
  const balls = (n, role, d, red, blue, wantRed) => { const tot = red + blue; const num_ = wantRed ? red : blue; const [p, q] = [num_, tot];
    return choice({ k: "prob", n, role, d, fam: "prob-ball", prompt: P(`빨간 공 ${red}개와 파란 공 ${blue}개가 들어 있는 주머니에서 공 한 개를 꺼낼 때, ${wantRed ? "빨간" : "파란"} 공일 확률은?`, `Trong túi có ${red} quả bóng đỏ và ${blue} quả bóng xanh. Lấy ngẫu nhiên một quả, xác suất lấy được quả bóng ${wantRed ? "đỏ" : "xanh"} là?`), right: tex(fracTex(p, q)), wrong: [tex(fracTex(tot - p, q)), tex(fracTex(p, tot - p)), tex(fracTex(q, p))].filter((v, i, a) => a.indexOf(v) === i && v !== tex(fracTex(p, q))),
      hints: [P("확률 = (일어나는 경우의 수) ÷ (모든 경우의 수)", "Xác suất = (số trường hợp thuận lợi) ÷ (tổng số trường hợp)."), P(`모든 경우의 수는 ${tot}가지예요.`, `Tổng số trường hợp là ${tot}.`)], expl: P(`${tex(`\\frac{${num_}}{${tot}}${frac2(num_, tot)}`)}.`, `${tex(`\\frac{${num_}}{${tot}}${frac2(num_, tot)}`)}.`) }); };
  const atLeast = (n, role, d, c) => choice({ k: "prob", n, role, d, fam: "prob-compl", tags: ["multistep", "reasoning"], prompt: P(`동전 ${c}개를 동시에 던질 때, 적어도 한 개는 앞면이 나올 확률은?`, `Tung đồng thời ${c} đồng xu, xác suất để có ít nhất một đồng ngửa là?`), right: tex(fracTex(2 ** c - 1, 2 ** c)),
    wrong: [tex(fracTex(1, 2 ** c)), tex(fracTex(c, 2 ** c)), tex(fracTex(2 ** c - 2, 2 ** c))],
    hints: [P("'적어도 한 개'는 여사건(모두 뒷면)을 이용하면 편해요.", "Với 'ít nhất một', hãy dùng biến cố đối (tất cả đều sấp)."), P("1 − (모두 뒷면일 확률)", "1 − (xác suất tất cả đều sấp).")], expl: P(`모두 뒷면일 확률은 ${tex(fracTex(1, 2 ** c))} 이므로 구하는 확률은 $1-${tex(fracTex(1, 2 ** c)).replaceAll("$", "")}=${tex(fracTex(2 ** c - 1, 2 ** c)).replaceAll("$", "")}$.`, `Xác suất tất cả sấp là ${tex(fracTex(1, 2 ** c))} nên đáp số là $1-${tex(fracTex(1, 2 ** c)).replaceAll("$", "")}=${tex(fracTex(2 ** c - 1, 2 ** c)).replaceAll("$", "")}$.`) });
  const range = (n, role, d, truth) => truefalse({ k: "prob", n, role, d, fam: "prob-rule", tags: ["reasoning"], truth,
    prompt: truth ? P("어떤 사건이 일어날 확률이 $p$ 이면, 그 사건이 일어나지 않을 확률은 $1-p$ 이다.", "Nếu xác suất của một biến cố là $p$ thì xác suất biến cố đó không xảy ra là $1-p$.") : P("어떤 사건이 일어날 확률이 $1.2$ 일 수 있다.", "Xác suất của một biến cố có thể bằng $1{,}2$."),
    hints: [P("확률의 범위를 떠올려 보세요.", "Hãy nhớ lại khoảng giá trị của xác suất."), P("확률은 0 이상 1 이하의 수예요.", "Xác suất là số từ 0 đến 1.")], expl: truth ? P("사건 A와 그 여사건의 확률을 더하면 1이에요.", "Xác suất của biến cố và biến cố đối cộng lại bằng 1.") : P("확률은 0 이상 1 이하이므로 1.2는 될 수 없어요.", "Xác suất nằm trong đoạn [0; 1] nên không thể là 1,2.") });
  const twice = (n, role, d, p1, q1, p2, q2) => choice({ k: "prob", n, role, d, fam: "prob-both", tags: ["context", "multistep"], prompt: P(`민수가 문제 A를 맞힐 확률은 ${tex(fracTex(p1, q1))}, 문제 B를 맞힐 확률은 ${tex(fracTex(p2, q2))} 입니다. 두 문제를 모두 맞힐 확률은? (두 문제는 서로 영향을 주지 않습니다)`, `Xác suất Minsu làm đúng bài A là ${tex(fracTex(p1, q1))} và làm đúng bài B là ${tex(fracTex(p2, q2))}. Xác suất làm đúng cả hai bài là? (Hai bài độc lập với nhau)`), right: tex(fracTex(p1 * p2, q1 * q2)),
    wrong: [tex(fracTex(p1 * q2 + p2 * q1, q1 * q2)), tex(fracTex(p1 + p2, q1 + q2)), tex(fracTex(p1 * q2, q1 * p2))].filter((v, i, a) => a.indexOf(v) === i && v !== tex(fracTex(p1 * p2, q1 * q2))),
    hints: [P("두 사건이 동시에 일어날 확률은 곱해요.", "Xác suất hai biến cố đồng thời xảy ra là tích hai xác suất."), P("분자는 분자끼리, 분모는 분모끼리 곱해요.", "Nhân tử số với tử số, mẫu số với mẫu số.")], expl: P(`${tex(`${fracTex(p1, q1)} \\times ${fracTex(p2, q2)} = ${fracTex(p1 * p2, q1 * q2)}`)}.`, `${tex(`${fracTex(p1, q1)} \\times ${fracTex(p2, q2)} = ${fracTex(p1 * p2, q1 * q2)}`)}.`) });
  const l5 = [coins(1, "core", 1, 3), balls(2, "core", 2, 3, 5, true), twice(3, "core", 2, 2, 3, 3, 4), atLeast(4, "core", 3, 3), diceSum(5, "core", 3, 8)];
  coins("v1", "variant", 1, 4); balls("v2", "variant", 2, 4, 6, false); range("v3", "variant", 2, true); atLeast("v4", "variant", 3, 4);
  balls("d1", "diagnostic", 1, 2, 3, true); range("d2", "diagnostic", 2, false); diceSum("d3", "diagnostic", 4, 9);

  K.course({
    slug: "functions-probability", title: T("중2 수학: 식과 함수, 확률 탐험", "Toán lớp 8: Đa thức, hàm số và xác suất"),
    world: { name: T("함수의 숲", "Khu rừng hàm số"), emoji: "🌲", tagline: T("식을 다루고 그래프를 읽고 확률로 예측해요.", "Làm chủ biểu thức, đọc đồ thị và dự đoán bằng xác suất.") }, unitTitle: T("중2 수학", "Toán lớp 8"),
    lessons: [
      K.lesson(1, "exp", T("지수법칙과 다항식", "Lũy thừa và đa thức"), T("밑이 같은 곱은 지수를 더하고, 거듭제곱의 거듭제곱은 지수를 곱해요. 다항식은 같은 문자 항끼리 모아 계산해요.", "Nhân cùng cơ số thì cộng số mũ, lũy thừa của lũy thừa thì nhân số mũ. Đa thức được rút gọn bằng cách gộp các hạng tử đồng dạng."), T("$x^2\\times x^3=x^5$, $(x^2)^3=x^6$", "$x^2\\times x^3=x^5$, $(x^2)^3=x^6$"), l1),
      K.lesson(2, "sys", T("연립일차방정식", "Hệ phương trình bậc nhất"), T("두 식에서 한 문자를 없애 해를 구해요. 가감법과 대입법을 상황에 맞게 골라요.", "Khử một ẩn để tìm nghiệm của hai phương trình. Chọn phương pháp cộng hoặc thế cho phù hợp."), T("$x+y=5,\\ x-y=1 \\Rightarrow x=3,\\ y=2$", "$x+y=5,\\ x-y=1 \\Rightarrow x=3,\\ y=2$"), l2),
      K.lesson(3, "ineq", T("일차부등식", "Bất phương trình bậc nhất"), T("등식의 성질과 비슷하게 풀되, 음수를 곱하거나 나누면 부등호의 방향이 바뀌어요.", "Giải tương tự phương trình nhưng khi nhân hoặc chia cho số âm phải đổi chiều bất đẳng thức."), T("$-2x>6 \\Rightarrow x<-3$", "$-2x>6 \\Rightarrow x<-3$"), l3),
      K.lesson(4, "func", T("일차함수와 그래프", "Hàm số bậc nhất và đồ thị"), T("$y=ax+b$ 에서 $a$는 기울기, $b$는 $y$절편이에요. 평행한 직선은 기울기가 같아요.", "Trong $y=ax+b$, $a$ là hệ số góc và $b$ là tung độ gốc. Hai đường thẳng song song có cùng hệ số góc."), T("기울기 $=\\dfrac{y\\text{의 증가량} }{x\\text{의 증가량} }$", "Hệ số góc $=\\dfrac{\\text{độ tăng của }y}{\\text{độ tăng của }x}$"), l4),
      K.lesson(5, "prob", T("경우의 수와 확률", "Số trường hợp và xác suất"), T("확률은 (일어나는 경우의 수)÷(모든 경우의 수)예요. 동시에 일어나는 독립 사건은 곱하고, '적어도'는 여사건을 써요.", "Xác suất = (số trường hợp thuận lợi) ÷ (tổng số trường hợp). Biến cố độc lập đồng thời thì nhân xác suất; với 'ít nhất' hãy dùng biến cố đối."), T("$P(A)=1-P(A^c)$", "$P(A)=1-P(A^c)$"), l5),
    ],
  });
}

/** " = 3/8" style tail for explanations when the fraction reduces. */
function frac2(n, d) { const g = gcdI(n, d); return g === 1 ? "" : ` = ${fracTex(n, d)}`; }
function gcdI(a, c) { return c === 0 ? a : gcdI(c, a % c); }
