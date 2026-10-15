// 경제 수학 (12경수): exchange, tax, interest / present value / annuity, demand-supply and tax effects, utility, inequality regions,
// matrices (Leontief, inverse), derivative / elasticity / optimisation. Only parts with a numeric answer (see SPEC.md).
import { Q, gcd, tfrac } from "../lib.mjs";

const qpow = (x, n) => { let r = new Q(1); for (let i = 0; i < n; i++) r = r.mul(x); return r; };
const floorQ = (x) => Number(x.p / x.q); // x >= 0
const trunc2 = (x) => (Number((x.p * 100n) / x.q) / 100).toFixed(2); // x >= 0, truncated to 2 places (for explanations)
const fmt = (n) => String(n);

export const TEMPLATES = {
  econ_exchangeCross: {
    ko: ["환율이 1달러 $={d}$원, 1유로 $={e}$원입니다. 수수료 없이 ${n}$유로를 달러로 바꾸면 몇 달러인가요? (숫자만 쓰세요)", ["먼저 ${n}$유로가 원화로 얼마인지 구해요.", "그 원화 금액을 1달러의 값 ${d}$원으로 나눠요."], "${n}$유로는 ${n}\\times{e}={won}$원이고, ${won}\\div{d}={ans}$달러입니다."],
    en: ["The exchange rates are 1 dollar $={d}$ won and 1 euro $={e}$ won. Without any fee, how many dollars do you get for ${n}$ euros? (digits only)", ["First find what ${n}$ euros are worth in won.", "Then divide that amount of won by the price of one dollar, ${d}$ won."], "${n}$ euros are ${n}\\times{e}={won}$ won, and ${won}\\div{d}={ans}$ dollars."],
  },
  econ_taxBracket: {
    ko: ["어떤 나라의 소득세는 과세표준을 구간으로 나누어 구간마다 다른 세율을 적용합니다. ${b1}$만 원 이하의 부분에는 ${r1}$%, ${b1}$만 원 초과 ${b2}$만 원 이하의 부분에는 ${r2}$%, ${b2}$만 원을 넘는 부분에는 ${r3}$%를 적용합니다. 과세표준이 ${x1}$만 원일 때 내야 할 세금은 몇 만 원인가요? (숫자만 쓰세요)", ["세율은 그 구간에 들어 있는 금액에만 적용돼요. 구간마다 들어 있는 금액부터 구해요.", "(구간별 금액)×(세율)을 모두 더해요."], "구간별 금액은 ${s1}$, ${s2}$, ${s3}$만 원이므로 세금은 ${s1}\\times\\frac{{r1}}{100}+{s2}\\times\\frac{{r2}}{100}+{s3}\\times\\frac{{r3}}{100}={ans}$만 원입니다."],
    en: ["An income tax splits the taxable income into brackets with different rates: ${r1}$% on the part up to ${b1}$ (ten-thousand won), ${r2}$% on the part above ${b1}$ up to ${b2}$, and ${r3}$% on the part above ${b2}$. For a taxable income of ${x1}$ (ten-thousand won), how much tax is due, in ten-thousand won? (digits only)", ["Each rate applies only to the amount lying inside its bracket. Find the amount in each bracket first.", "Add (amount in the bracket)×(rate) over all brackets."], "The amounts in the brackets are ${s1}$, ${s2}$ and ${s3}$, so the tax is ${s1}\\times\\frac{{r1}}{100}+{s2}\\times\\frac{{r2}}{100}+{s3}\\times\\frac{{r3}}{100}={ans}$ (ten-thousand won)."],
  },
  econ_compoundFV: {
    ko: ["연이율 ${r}$%, 1년에 ${m}$번 이자를 원금에 더하는 복리 예금에 ${P}$원을 ${n}$년 동안 맡깁니다. 한 번 계산할 때의 이율은 연이율을 ${m}$으로 나눈 값이고, 중간에 돈을 찾지 않습니다. ${n}$년 뒤의 원리합계는 몇 원인가요? (원 단위 미만은 버립니다. 숫자만 쓰세요)", ["이자를 계산하는 횟수는 모두 (1년의 횟수)×(햇수)번이에요.", "한 번 계산할 때의 이율 ${rp}$%를 쓰면 원리합계는 $(1+\\frac{{rp}}{100})$를 계산 횟수만큼 곱한 값에 원금을 곱한 거예요."], "계산 횟수는 ${m}\\times{n}={k}$번, 한 번의 이율은 ${rp}$%이므로 원리합계는 ${P}\\times(1+\\frac{{rp}}{100})^{{k}}\\approx{ex}$원이고, 원 단위 미만을 버리면 ${ans}$원입니다."],
    en: ["${P}$ won is deposited for ${n}$ years in an account with annual rate ${r}$% that adds interest to the principal ${m}$ times a year. The rate for one compounding period is the annual rate divided by ${m}$, and nothing is withdrawn. What is the total amount (principal plus interest) after ${n}$ years, in won? (Drop any fraction of a won. Digits only.)", ["The number of compounding periods is (times per year)×(number of years).", "With the per-period rate ${rp}$%, the total is the principal times $(1+\\frac{{rp}}{100})$ multiplied once per period."], "There are ${m}\\times{n}={k}$ periods at ${rp}$% each, so the total is ${P}\\times(1+\\frac{{rp}}{100})^{{k}}\\approx{ex}$ won; dropping the fraction gives ${ans}$ won."],
  },
  econ_presentValue: {
    ko: ["연이율 ${r}$%로 1년마다 복리로 계산합니다. ${n}$년 뒤에 받을 ${F}$원의 현재가치는 몇 원인가요? (원 단위 미만은 버립니다. 숫자만 쓰세요)", ["현재가치 $P$는 $P$를 ${n}$년 동안 복리로 불린 금액이 ${F}$원이 되는 값이에요.", "$P=F\\div(1+\\frac{{r}}{100})^{{n}}$을 계산해요."], "$P={F}\\div(1+\\frac{{r}}{100})^{{n}}\\approx{ex}$원이고, 원 단위 미만을 버리면 ${ans}$원입니다."],
    en: ["Interest is compounded once a year at an annual rate of ${r}$%. What is the present value of ${F}$ won to be received ${n}$ years from now, in won? (Drop any fraction of a won. Digits only.)", ["The present value $P$ is the amount that grows to ${F}$ won in ${n}$ years with compound interest.", "Compute $P=F\\div(1+\\frac{{r}}{100})^{{n}}$."], "$P={F}\\div(1+\\frac{{r}}{100})^{{n}}\\approx{ex}$ won; dropping the fraction gives ${ans}$ won."],
  },
  econ_annuityPV: {
    ko: ["매년 말 ${A}$원씩 ${n}$년 동안 받는 연금이 있습니다(첫 번째 지급은 1년 뒤, 마지막 지급은 ${n}$년 뒤). 연이율 ${r}$%, 1년마다 복리로 계산할 때 이 연금의 현재가치는 몇 원인가요? (원 단위 미만은 버립니다. 숫자만 쓰세요)", ["각 지급액을 지급 시기만큼 할인해서 현재 가치로 바꾼 뒤 모두 더하는 거예요.", "이율 $i=\\frac{{r}}{100}$일 때 현재가치는 $A\\times\\frac{1-(1+i)^{-{n}}}{i}$예요."], "$i={r}/100$이므로 현재가치는 ${A}\\times\\frac{1-(1+i)^{-{n}}}{i}\\approx{ex}$원이고, 원 단위 미만을 버리면 ${ans}$원입니다."],
    en: ["An annuity pays ${A}$ won at the end of each year for ${n}$ years (the first payment in 1 year, the last in ${n}$ years). With an annual rate of ${r}$% compounded yearly, what is the present value of the annuity, in won? (Drop any fraction of a won. Digits only.)", ["Discount each payment back to today for as many years as it is delayed, then add them.", "With $i=\\frac{{r}}{100}$ the present value is $A\\times\\frac{1-(1+i)^{-{n}}}{i}$."], "With $i={r}/100$ the present value is ${A}\\times\\frac{1-(1+i)^{-{n}}}{i}\\approx{ex}$ won; dropping the fraction gives ${ans}$ won."],
  },
  econ_taxEquilibrium: {
    ko: ["어떤 상품의 수요 곡선은 $p={a}-{b}q$, 공급 곡선은 $p={c}+{d}q$입니다. 여기서 $p$는 가격(원), $q$는 수량(개)입니다. 정부가 공급자에게 상품 1개를 팔 때마다 ${t}$원의 세금을 부과하면, 공급자는 소비자가 낸 가격에서 세금을 뺀 금액을 받습니다. 세금을 부과한 뒤의 균형에서 소비자가 내는 가격은 몇 원인가요? (숫자만 쓰세요)", ["공급자가 실제로 받는 가격은 $p-{t}$예요.", "공급 곡선의 $p$ 자리에 $p-{t}$를 넣고, 수요 곡선 $p={a}-{b}q$를 대입해 $q$를 구해요."], "공급자가 받는 가격은 $p-{t}$이므로 $({a}-{b}q)-{t}={c}+{d}q$입니다. 이를 풀면 $q={qn}$이고, 소비자가 내는 가격은 $p={a}-{b}\\times{qn}={ans}$원입니다."],
    en: ["The demand curve of a good is $p={a}-{b}q$ and its supply curve is $p={c}+{d}q$, where $p$ is the price (won) and $q$ the quantity. The government charges the seller a tax of ${t}$ won for every unit sold, so the seller receives the price paid by the consumer minus the tax. At the new equilibrium after the tax, what price does the consumer pay, in won? (digits only)", ["The price the seller actually receives is $p-{t}$.", "Put $p-{t}$ in place of $p$ in the supply curve and substitute $p={a}-{b}q$ to find $q$."], "The seller receives $p-{t}$, so $({a}-{b}q)-{t}={c}+{d}q$. Solving gives $q={qn}$, and the consumer pays $p={a}-{b}\\times{qn}={ans}$ won."],
  },
  econ_equilibriumTable: {
    ko: ["어떤 상품의 수요량은 가격이 ${p1}$원일 때 ${qd1}$개, ${p2}$원일 때 ${qd2}$개이고, 공급량은 가격이 ${p3}$원일 때 ${qs1}$개, ${p4}$원일 때 ${qs2}$개입니다. 수요량과 공급량이 모두 가격의 일차함수일 때, 수요량과 공급량이 같아지는 균형가격은 몇 원인가요? (숫자만 쓰세요)", ["두 점을 지나는 직선의 기울기로 수요량과 공급량이 가격에 따라 얼마나 변하는지 구해요.", "수요량을 $Q_d$, 공급량을 $Q_s$로 두고 $Q_d=Q_s$인 가격을 구해요."], "수요량의 변화율은 $\\frac{{qd2}-{qd1}}{{p2}-{p1}}={md}$이므로 $Q_d={qd1}{md}(p-{p1})$, 공급량의 변화율은 ${ns}$이므로 $Q_s={qs1}+{ns}(p-{p3})$입니다. $Q_d=Q_s$를 풀면 $p={ans}$원입니다."],
    en: ["The quantity demanded of a good is ${qd1}$ when the price is ${p1}$ won and ${qd2}$ when it is ${p2}$ won; the quantity supplied is ${qs1}$ when the price is ${p3}$ won and ${qs2}$ when it is ${p4}$ won. If both quantities are linear functions of the price, what is the equilibrium price at which they are equal, in won? (digits only)", ["Use the slope of the line through two points to see how each quantity changes with price.", "Call the quantities $Q_d$ and $Q_s$ and find the price where $Q_d=Q_s$."], "The demand changes at the rate $\\frac{{qd2}-{qd1}}{{p2}-{p1}}={md}$, so $Q_d={qd1}{md}(p-{p1})$; supply changes at the rate ${ns}$, so $Q_s={qs1}+{ns}(p-{p3})$. Setting $Q_d=Q_s$ gives $p={ans}$ won."],
  },
  econ_utilityBundle: {
    ko: ["x재는 1개에 ${a}$원, y재는 1개에 ${b}$원입니다. 예산 ${I}$원을 남김없이 모두 써서 x재 $x$개, y재 $y$개를 사려고 합니다($x$, $y$는 0 이상의 정수). 효용이 $U={U}$로 주어질 때, 효용의 최댓값은? (숫자만 쓰세요)", ["예산식 ${a}x+{b}y={I}$를 만족하는 0 이상의 정수 $(x, y)$를 모두 찾아요.", "찾은 $(x, y)$마다 $U$의 값을 계산해서 비교해요."], "예산식을 만족하는 $(x, y)$는 ${pairs}$입니다. 이 중 $U$가 가장 큰 것은 $(x, y)=({bx}, {by})$이고, 그때 $U={ans}$입니다."],
    en: ["Good x costs ${a}$ won per unit and good y costs ${b}$ won per unit. You spend the whole budget of ${I}$ won exactly on $x$ units of good x and $y$ units of good y ($x$, $y$ are integers at least 0). If the utility is $U={U}$, what is the maximum utility? (digits only)", ["Find all integer pairs $(x, y)$ with $x,y\\ge0$ satisfying the budget equation ${a}x+{b}y={I}$.", "Compute $U$ for each pair and compare."], "The pairs satisfying the budget equation are ${pairs}$. The largest $U$ occurs at $(x, y)=({bx}, {by})$, where $U={ans}$."],
  },
  econ_regionLP: {
    ko: ["제품 A를 $x$개, 제품 B를 $y$개 만드는 공장이 있습니다($x$, $y$는 0 이상의 정수). 1개를 만드는 데 필요한 재료와 작업 시간은 제품 A가 ${a1}$ kg, ${t1}$시간이고 제품 B가 ${b1}$ kg, ${t2}$시간입니다. 하루에 쓸 수 있는 재료는 ${M}$ kg 이하, 작업 시간은 ${T}$시간 이하이고, 이익은 제품 A가 1개에 ${pa}$만 원, 제품 B가 1개에 ${pb}$만 원입니다. 하루 최대 이익은 몇 만 원인가요? (숫자만 쓰세요)", ["조건을 부등식으로 쓰고 $x\\ge0$, $y\\ge0$와 함께 좌표평면에 영역으로 나타내요.", "이익 ${pa}x+{pb}y$는 영역의 꼭짓점 중 한 곳에서 최대가 돼요. 두 경계선의 교점부터 확인해요."], "부등식은 ${a1}x+{b1}y\\le{M}$, ${t1}x+{t2}y\\le{T}$, $x\\ge0$, $y\\ge0$입니다. 이익이 최대인 꼭짓점은 두 경계선의 교점 $({x0}, {y0})$이고, 이 점은 정수점이므로 최대 이익은 ${pa}\\times{x0}+{pb}\\times{y0}={ans}$만 원입니다."],
    en: ["A factory makes $x$ units of product A and $y$ units of product B ($x$, $y$ are integers at least 0). One unit needs ${a1}$ kg of material and ${t1}$ hours of work for product A, and ${b1}$ kg and ${t2}$ hours for product B. At most ${M}$ kg of material and ${T}$ hours of work are available per day. The profit is ${pa}$ (ten-thousand won) per unit of A and ${pb}$ per unit of B. What is the maximum daily profit, in ten-thousand won? (digits only)", ["Write the conditions as inequalities, together with $x\\ge0$ and $y\\ge0$, and draw the region in the plane.", "The profit ${pa}x+{pb}y$ is largest at a vertex of the region. Check the intersection of the two boundary lines first."], "The inequalities are ${a1}x+{b1}y\\le{M}$, ${t1}x+{t2}y\\le{T}$, $x\\ge0$, $y\\ge0$. The profit is largest at the vertex where the two boundary lines meet, $({x0}, {y0})$, which is a lattice point, so the maximum profit is ${pa}\\times{x0}+{pb}\\times{y0}={ans}$."],
  },
  econ_leontief: {
    ko: ["두 산업 1, 2의 투입계수행렬이 $A={M}$입니다($A$의 $(i, j)$ 성분은 산업 $j$가 1단위를 생산할 때 필요한 산업 $i$의 생산물의 양). 두 산업의 총생산량을 각각 $x_1$, $x_2$(단위: 억 원), 최종수요를 $d_1={d1}$, $d_2={d2}$라 하면 ${XV}=A{XV}+{DV}$이 성립합니다. $x_1$은 얼마인가요? (숫자만 쓰세요)", ["식을 $(I-A){XV}={DV}$로 바꿔요.", "$I-A$의 역행렬을 구해 ${DV}$에 곱해요. $2\\times2$ 행렬의 역행렬은 $\\frac{1}{ad-bc}$에 성분을 재배열한 행렬을 곱한 꼴이에요."], "$(I-A)\\mathbf{x}=\\mathbf{d}$이므로 $\\mathbf{x}=(I-A)^{-1}\\mathbf{d}$입니다. $I-A$의 행렬식은 ${D}$이므로 $x_1=\\frac{{c22}\\times{d1}+{a12}\\times{d2}}{{D}}={ans}$입니다."],
    en: ["Two industries 1 and 2 have the input coefficient matrix $A={M}$ (the $(i, j)$ entry is the amount of industry $i$'s product needed to make one unit of industry $j$'s product). Let the total outputs be $x_1$, $x_2$ (unit: 100 million won) and the final demands $d_1={d1}$, $d_2={d2}$; then ${XV}=A{XV}+{DV}$. What is $x_1$? (digits only)", ["Rewrite the equation as $(I-A){XV}={DV}$.", "Find the inverse of $I-A$ and multiply it by ${DV}$. The inverse of a $2\\times2$ matrix is $\\frac{1}{ad-bc}$ times a rearranged matrix."], "From $(I-A)\\mathbf{x}=\\mathbf{d}$ we get $\\mathbf{x}=(I-A)^{-1}\\mathbf{d}$. The determinant of $I-A$ is ${D}$, so $x_1=\\frac{{c22}\\times{d1}+{a12}\\times{d2}}{{D}}={ans}$."],
  },
  econ_inverseEntry: {
    ko: ["행렬 $A={M}$의 역행렬 $A^{-1}$의 $({i}, {j})$ 성분은? ($(i, j)$ 성분은 $i$행 $j$열의 성분입니다.) (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["행렬 ${G}$의 행렬식은 $ad-bc$예요. 0이 아니면 역행렬이 있어요.", "역행렬은 ${H}$예요."], "행렬식은 ${a}\\times{d}-({b})\\times({c})={det}$이고, $A^{-1}$의 $({i}, {j})$ 성분은 $\\frac{{num}}{{det}}$, 곧 ${fr}$입니다."],
    en: ["What is the $({i}, {j})$ entry of the inverse $A^{-1}$ of the matrix $A={M}$? (The $(i, j)$ entry is in row $i$, column $j$.) (a decimal or a fraction like 3/4 is fine)", ["The determinant of ${G}$ is $ad-bc$; the inverse exists if it is not 0.", "The inverse is ${H}$."], "The determinant is ${a}\\times{d}-({b})\\times({c})={det}$, and the $({i}, {j})$ entry of $A^{-1}$ is $\\frac{{num}}{{det}}$, that is ${fr}$."],
  },
  econ_marginalRevenue: {
    ko: ["어떤 상품의 수요 곡선이 $p={a}-{b}q$입니다($p$는 가격(원), $q$는 판매량(개)). 총수입은 $R(q)=pq$이고, 한계수입은 $R(q)$를 $q$에 대해 미분한 $R'(q)$입니다. 한계수입이 ${m}$원이 되는 판매량 $q$는 몇 개인가요? (숫자만 쓰세요)", ["$p={a}-{b}q$를 $R(q)=pq$에 대입해 $R(q)$를 $q$의 식으로 나타내요.", "$R(q)$를 미분한 식이 ${m}$이 되게 하는 $q$를 구해요."], "$R(q)=({a}-{b}q)q={a}q-{b}q^2$이므로 $R'(q)={a}-{twob}q$입니다. $R'(q)={m}$에서 $q={ans}$입니다."],
    en: ["The demand curve of a good is $p={a}-{b}q$ ($p$ is the price in won, $q$ the quantity sold). Total revenue is $R(q)=pq$ and marginal revenue is the derivative $R'(q)$. For what quantity $q$ is the marginal revenue equal to ${m}$ won? (digits only)", ["Substitute $p={a}-{b}q$ into $R(q)=pq$ to write $R(q)$ in terms of $q$.", "Differentiate $R(q)$ and find $q$ so that the derivative equals ${m}$."], "$R(q)=({a}-{b}q)q={a}q-{b}q^2$, so $R'(q)={a}-{twob}q$. Setting $R'(q)={m}$ gives $q={ans}$."],
  },
  econ_elasticityPoint: {
    ko: ["수요함수가 $q={D}$입니다($p$는 가격, $q$는 수요량). 가격이 $p={p0}$일 때 수요의 가격탄력성 $e=\\left|q'(p)\\times\\frac{p}{q}\\right|$의 값은? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["먼저 $q'(p)$를 구해서 $p={p0}$를 넣어요.", "$p={p0}$일 때의 수요량 $q$도 구해서 $e$의 식에 넣어요."], "$q'(p)$의 $p={p0}$에서의 값은 ${dqv}$, 수요량은 $q={qv}$이므로 $e=\\frac{{adq}\\times{p0}}{{qv}}={fr}$입니다."],
    en: ["The demand function is $q={D}$ ($p$ is the price, $q$ the quantity demanded). What is the price elasticity of demand $e=\\left|q'(p)\\times\\frac{p}{q}\\right|$ at the price $p={p0}$? (a decimal or a fraction like 3/4 is fine)", ["First find $q'(p)$ and evaluate it at $p={p0}$.", "Also find the quantity $q$ at $p={p0}$ and put both into the formula for $e$."], "At $p={p0}$, $q'(p)={dqv}$ and $q={qv}$, so $e=\\frac{{adq}\\times{p0}}{{qv}}={fr}$."],
  },
  econ_elasticityUnit: {
    ko: ["수요함수 $q={D}$에서 가격탄력성 $e=\\left|q'(p)\\times\\frac{p}{q}\\right|$이 1이 되는 가격 $p$는 얼마인가요? ($p>0$이고 수요량 $q>0$인 범위에서 생각합니다.) (숫자만 쓰세요)", ["$q'(p)$를 구한 뒤 $\\left|q'(p)\\times\\frac{p}{q}\\right|=1$을 $p$에 대한 방정식으로 써요.", "$q>0$인 범위에서는 $q'(p)<0$이므로 절댓값을 벗기면 $-q'(p)\\times p=q$예요."], "$q'(p)={dq}$이므로 $-q'(p)\\times p=q$에서 ${eqn}$이고, $p>0$인 해는 $p={ans}$입니다."],
    en: ["For the demand function $q={D}$, at what price $p$ is the price elasticity $e=\\left|q'(p)\\times\\frac{p}{q}\\right|$ equal to 1? (Consider only $p>0$ with quantity $q>0$.) (digits only)", ["Find $q'(p)$ and write $\\left|q'(p)\\times\\frac{p}{q}\\right|=1$ as an equation in $p$.", "For $q>0$ we have $q'(p)<0$, so removing the absolute value gives $-q'(p)\\times p=q$."], "$q'(p)={dq}$, so $-q'(p)\\times p=q$ gives ${eqn}$, and the solution with $p>0$ is $p={ans}$."],
  },
  econ_profitCubic: {
    ko: ["어떤 제품을 $q$개 생산하는 데 드는 총비용이 $C(q)=q^3-{b}q^2+{c}q+{f}$(원)이고, 판매 가격은 1개에 ${p}$원으로 일정합니다. 생산한 제품이 모두 팔린다고 할 때, 이익(총수입에서 총비용을 뺀 값)의 최댓값은 몇 원인가요? ($q$는 0 이상의 실수입니다.) (숫자만 쓰세요)", ["이익은 $\\pi(q)={p}q-C(q)$예요. 미분해서 $\\pi'(q)=0$인 $q$를 찾아요.", "$\\pi'(q)=-3q^2+{twob}q+{pc}=0$의 양수인 근에서 $\\pi'(q)$의 부호가 +에서 -로 바뀌어요."], "$\\pi(q)={p}q-C(q)$이므로 $\\pi'(q)=-3q^2+{twob}q+{pc}=-3(q-{q0})(q+{s})$입니다. $q\\ge0$에서 $\\pi'$은 $q={q0}$ 앞에서 양수, 뒤에서 음수이므로 $q={q0}$에서 최대이고 $\\pi({q0})={ans}$원입니다."],
    en: ["Producing $q$ units of a product costs $C(q)=q^3-{b}q^2+{c}q+{f}$ won in total, and the selling price is a constant ${p}$ won per unit. If everything produced is sold, what is the maximum profit (total revenue minus total cost), in won? ($q$ is a real number at least 0.) (digits only)", ["The profit is $\\pi(q)={p}q-C(q)$. Differentiate and find $q$ with $\\pi'(q)=0$.", "At the positive root of $\\pi'(q)=-3q^2+{twob}q+{pc}=0$, the sign of $\\pi'(q)$ changes from + to -."], "$\\pi(q)={p}q-C(q)$ gives $\\pi'(q)=-3q^2+{twob}q+{pc}=-3(q-{q0})(q+{s})$. For $q\\ge0$, $\\pi'$ is positive before $q={q0}$ and negative after, so the maximum is at $q={q0}$: $\\pi({q0})={ans}$ won."],
  },
};

// ---------------------------------------------------------------- generators
const UF = { xy: (x, y) => x * y, "x^{2}y": (x, y) => x * x * y, "xy^{2}": (x, y) => x * y * y, "(x+2)y": (x, y) => (x + 2) * y, "x(y+3)": (x, y) => x * (y + 3) };

const cmpQ = (a, b) => { const d = a.sub(b); return d.p === 0n ? 0 : d.p > 0n ? 1 : -1; };
const meet = (l1, l2) => { // A x + B y = C
  const det = l1[0] * l2[1] - l2[0] * l1[1];
  if (det === 0) return null;
  return [new Q(l1[2] * l2[1] - l2[2] * l1[1], det), new Q(l1[0] * l2[2] - l2[0] * l1[2], det)];
};

export const GEN = {
  econ_exchangeCross: (r) => {
    for (let g = 0; g < 500; g++) {
      const d = r.pick([1000, 1200, 1250, 1280, 1300, 1320, 1350, 1400]), e = r.pick([1380, 1450, 1480, 1500, 1520, 1550, 1580, 1600, 1650]);
      const n = r.int(8, 200) * 10;
      const val = new Q(n * e, d);
      if (!val.terminates(3) || val.isInt && r.next() < 0.5) continue;
      return { v: { d, e, n, won: n * e }, ans: val.toNumber() };
    }
    throw new Error("exchangeCross");
  },
  econ_taxBracket: (r) => {
    const b1 = 100 * r.int(8, 20), b2 = b1 + 100 * r.int(20, 50);
    const r1 = r.int(5, 8), r2 = r1 + r.int(6, 10), r3 = r2 + r.int(5, 10);
    const x1 = r.next() < 0.45 ? 100 * r.int(b1 / 100 + 1, b2 / 100) : b2 + 100 * r.int(1, 40);
    const s1 = Math.min(x1, b1), s2 = Math.max(0, Math.min(x1, b2) - b1), s3 = Math.max(0, x1 - b2);
    return { v: { b1, b2, r1, r2, r3, x1, s1, s2, s3 }, ans: (s1 * r1 + s2 * r2 + s3 * r3) / 100 };
  },
  econ_compoundFV: (r) => {
    const m = r.pick([1, 1, 2, 4]), rate = r.pick([2, 3, 4, 5, 6, 8, 10, 12]), n = r.int(2, 5), P = r.int(10, 300) * 10000;
    const k = m * n, rp = rate / m;
    const fv = new Q(P).mul(qpow(new Q(100 * m + rate, 100 * m), k));
    return { v: { r: rate, m, n, P, rp, k, ex: trunc2(fv) }, ans: floorQ(fv) };
  },
  econ_presentValue: (r) => {
    const rate = r.pick([2, 3, 4, 5, 6, 7, 8, 10, 12]), n = r.int(2, 10), F = r.int(10, 500) * 10000;
    const pv = new Q(F).div(qpow(new Q(100 + rate, 100), n));
    return { v: { r: rate, n, F, ex: trunc2(pv) }, ans: floorQ(pv) };
  },
  econ_annuityPV: (r) => {
    const rate = r.pick([2, 3, 4, 5, 6, 8, 10]), n = r.int(2, 10), A = r.int(5, 100) * 10000;
    const i = new Q(rate, 100);
    const pv = new Q(A).mul(new Q(1).sub(new Q(1).div(qpow(new Q(1).add(i), n)))).div(i);
    return { v: { A, n, r: rate, ex: trunc2(pv) }, ans: floorQ(pv) };
  },
  econ_taxEquilibrium: (r) => {
    const b = 10 * r.int(1, 6), d = 10 * r.int(1, 6), qn = r.int(4, 25), t = 10 * r.int(2, 12), c = 10 * r.int(5, 40);
    const a = c + t + (b + d) * qn;
    return { v: { a, b, c, d, t, qn }, ans: a - b * qn };
  },
  econ_equilibriumTable: (r) => {
    for (let g = 0; g < 500; g++) {
      const ps = 100 * r.int(5, 20), qs = 100 * r.int(10, 30), m = r.int(1, 4), n = r.int(1, 4);
      const offs = [-400, -300, -200, -100, 100, 200, 300, 400];
      const two = () => { let a = r.pick(offs), b = r.pick(offs); while (b === a) b = r.pick(offs); return a < b ? [a, b] : [b, a]; };
      const [o1, o2] = two(), [o3, o4] = two();
      const qd = (o) => qs - m * o, qsu = (o) => qs + n * o;
      if ([qd(o1), qd(o2), qsu(o3), qsu(o4)].some((q) => q <= 0)) continue;
      return { v: { p1: ps + o1, qd1: qd(o1), p2: ps + o2, qd2: qd(o2), p3: ps + o3, qs1: qsu(o3), p4: ps + o4, qs2: qsu(o4), md: String(-m), ns: String(n) }, ans: ps };
    }
    throw new Error("equilibriumTable");
  },
  econ_utilityBundle: (r) => {
    for (let g = 0; g < 2000; g++) {
      const a = 100 * r.int(1, 6), b = 100 * r.int(1, 6);
      if (a === b) continue;
      const I = 100 * r.int(8, 40);
      const U = r.pick(Object.keys(UF));
      const pairs = [];
      for (let x = 0; a * x <= I; x++) { const rest = I - a * x; if (rest % b === 0) pairs.push([x, rest / b]); }
      if (pairs.length < 3 || pairs.length > 8) continue;
      let best = pairs[0];
      for (const p of pairs) if (UF[U](p[0], p[1]) > UF[U](best[0], best[1])) best = p;
      const val = UF[U](best[0], best[1]);
      if (pairs.filter((p) => UF[U](p[0], p[1]) === val).length > 1 && r.next() < 0.7) continue;
      return { v: { a, b, I, U, pairs: pairs.map((p) => `(${p[0]}, ${p[1]})`).join(", "), bx: best[0], by: best[1] }, ans: val };
    }
    throw new Error("utilityBundle");
  },
  econ_regionLP: (r) => {
    for (let g = 0; g < 5000; g++) {
      const a1 = r.int(1, 6), b1 = r.int(1, 6), t1 = r.int(1, 6), t2 = r.int(1, 6), x0 = r.int(3, 20), y0 = r.int(3, 20), pa = r.int(1, 9), pb = r.int(1, 9);
      if (a1 * t2 === b1 * t1) continue;
      const M = a1 * x0 + b1 * y0, T = t1 * x0 + t2 * y0;
      const L = [[a1, b1, M], [t1, t2, T], [1, 0, 0], [0, 1, 0]];
      let best = null, ties = 0;
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        const pt = meet(L[i], L[j]);
        if (!pt) continue;
        const [x, y] = pt;
        if (cmpQ(x, new Q(0)) < 0 || cmpQ(y, new Q(0)) < 0) continue;
        if (cmpQ(x.mul(a1).add(y.mul(b1)), new Q(M)) > 0 || cmpQ(x.mul(t1).add(y.mul(t2)), new Q(T)) > 0) continue;
        const val = x.mul(pa).add(y.mul(pb));
        if (!best || cmpQ(val, best.val) > 0) { best = { val, x, y }; ties = 1; } else if (cmpQ(val, best.val) === 0) ties++;
      }
      if (!best || ties !== 1 || !(best.x.isInt && best.y.isInt) || Number(best.x.p) !== x0 || Number(best.y.p) !== y0) continue;
      return { v: { a1, b1, t1, t2, M, T, pa, pb, x0, y0 }, ans: pa * x0 + pb * y0 };
    }
    throw new Error("regionLP");
  },
  econ_leontief: (r) => {
    const a11 = r.int(1, 4), a12 = r.int(1, 4), a21 = r.int(1, 4), a22 = r.int(1, 4);
    const x1 = 10 * r.int(5, 30), x2 = 10 * r.int(5, 30);
    const d1 = x1 - (a11 * x1 + a12 * x2) / 10, d2 = x2 - (a21 * x1 + a22 * x2) / 10;
    const D100 = (10 - a11) * (10 - a22) - a12 * a21;
    return { v: { XV: "\\begin{pmatrix}x_1\\\\x_2\\end{pmatrix}", M: `\\begin{pmatrix}0.${a11}&0.${a12}\\\\0.${a21}&0.${a22}\\end{pmatrix}`, d1, d2, DV: "\\begin{pmatrix}d_1\\\\d_2\\end{pmatrix}", a12: `0.${a12}`, c22: String((10 - a22) / 10), D: String(D100 / 100) }, ans: x1 };
  },
  econ_inverseEntry: (r) => {
    for (let g = 0; g < 500; g++) {
      const a = r.int(-5, 9), b = r.int(-5, 9), c = r.int(-5, 9), d = r.int(-5, 9);
      const det = a * d - b * c;
      if (!det || Math.abs(det) > 6 || Math.abs(det) === 3) continue;
      const i = r.int(1, 2), j = r.int(1, 2);
      const num = [[d, -b], [-c, a]][i - 1][j - 1];
      if (num === 0) continue;
      const M = `\\begin{pmatrix}${a}&${b}\\\\${c}&${d}\\end{pmatrix}`;
      return { v: { M, G: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}", H: "\\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}", i, j, a, b, c, d, det, num, fr: tfrac(num, det) }, ans: num / det };
    }
    throw new Error("inverseEntry");
  },
  econ_marginalRevenue: (r) => {
    const b = r.int(2, 8), q0 = r.int(3, 30), m = r.int(0, 9) * 10 + r.int(0, 3) * 5;
    const a = m + 2 * b * q0;
    return { v: { a, b, m, twob: 2 * b }, ans: q0 };
  },
  econ_elasticityPoint: (r) => {
    for (let g = 0; g < 2000; g++) {
      const quad = r.next() < 0.4;
      const a = quad ? 10 * r.int(10, 50) : 10 * r.int(6, 30), b = quad ? r.int(1, 5) : r.int(2, 9), p0 = quad ? r.int(2, 9) : r.int(3, 40);
      const qv = quad ? a - b * p0 * p0 : a - b * p0;
      if (qv <= 0) continue;
      const adq = quad ? 2 * b * p0 : b;
      const gg = gcd(adq * p0, qv), den = qv / gg;
      if (den > 20) continue;
      const D = quad ? `${a}-${b === 1 ? "" : b}p^{2}` : `${a}-${b === 1 ? "" : b}p`;
      return { v: { D, p0, dqv: `-${adq}`, adq, qv, fr: tfrac(adq * p0, qv) }, ans: (adq * p0) / qv };
    }
    throw new Error("elasticityPoint");
  },
  econ_elasticityUnit: (r) => {
    const quad = r.next() < 0.45, b = r.int(1, 6), k = quad ? r.int(2, 9) : r.int(3, 30);
    const a = quad ? 3 * b * k * k : 2 * b * k, bs = b === 1 ? "" : String(b);
    const D = quad ? `${a}-${bs}p^{2}` : `${a}-${bs}p`;
    const dq = quad ? `-${2 * b}p` : `-${b}`;
    const eqn = quad ? `${2 * b}p^2=${a}-${bs}p^2` : `${b}p=${a}-${bs}p`;
    return { v: { D, dq, eqn }, ans: k };
  },
  econ_profitCubic: (r) => {
    for (let g = 0; g < 500; g++) {
    const s = r.int(1, 8), q0 = s + 2 * r.int(1, 4), b = (3 * (q0 - s)) / 2, c = r.int(5, 40), f = r.int(5, 60) * 10;
    const pc = 3 * q0 * s, p = c + pc;
    const profit = p * q0 - (q0 ** 3 - b * q0 * q0 + c * q0 + f);
    if (profit <= 0) continue;
    return { v: { b, c, f, p, twob: 2 * b, pc, q0, s }, ans: profit };
    }
    throw new Error("profitCubic");
  },
};

export const PLAN = [
  { skill: "m.el.econ1", template: "econ_exchangeCross", levels: [1], count: 16, d: 2, standards: ["12경수01-02"], strategy: "cross-rate-chaining", evidence: "application" },
  { skill: "m.el.econ1", template: "econ_taxBracket", levels: [1], count: 14, d: 3, standards: ["12경수01-03"], strategy: "progressive-brackets", evidence: "application" },
  { skill: "m.el.econ1", template: "econ_compoundFV", levels: [1], count: 14, d: 3, standards: ["12경수01-04"], strategy: "compound-periods", evidence: "calc" },
  { skill: "m.el.econ1", template: "econ_presentValue", levels: [1], count: 14, d: 3, standards: ["12경수01-04"], strategy: "discounting", evidence: "calc" },
  { skill: "m.el.econ1", template: "econ_annuityPV", levels: [1], count: 14, d: 4, standards: ["12경수01-05"], strategy: "annuity-discount-sum", evidence: "calc" },
  { skill: "m.el.econ2", template: "econ_taxEquilibrium", levels: [1], count: 14, d: 4, standards: ["12경수02-05", "12경수02-04"], strategy: "supply-shift-by-tax", evidence: "application" },
  { skill: "m.el.econ2", template: "econ_equilibriumTable", levels: [1], count: 14, d: 3, standards: ["12경수02-02", "12경수02-04"], strategy: "table-to-linear-function", evidence: "representation" },
  { skill: "m.el.econ2", template: "econ_utilityBundle", levels: [1], count: 14, d: 3, standards: ["12경수02-03"], strategy: "budget-lattice-search", evidence: "concept" },
  { skill: "m.el.econ2", template: "econ_regionLP", levels: [1], count: 14, d: 4, standards: ["12경수02-06"], strategy: "inequality-region-vertex", evidence: "application" },
  { skill: "m.el.econ2", template: "econ_leontief", levels: [1], count: 14, d: 4, standards: ["12경수03-03"], strategy: "matrix-inverse-model", evidence: "application" },
  { skill: "m.el.econ2", template: "econ_inverseEntry", levels: [1], count: 16, d: 2, standards: ["12경수03-02"], strategy: "adjugate-formula", evidence: "calc" },
  { skill: "m.el.econ2", template: "econ_marginalRevenue", levels: [1], count: 16, d: 3, standards: ["12경수04-01"], strategy: "derivative-reverse", evidence: "reverse" },
  { skill: "m.el.econ2", template: "econ_elasticityPoint", levels: [1], count: 14, d: 3, standards: ["12경수04-03"], strategy: "point-elasticity", evidence: "calc" },
  { skill: "m.el.econ2", template: "econ_elasticityUnit", levels: [1], count: 16, d: 4, standards: ["12경수04-03"], strategy: "unit-elasticity-price", evidence: "reverse" },
  { skill: "m.el.econ2", template: "econ_profitCubic", levels: [1], count: 16, d: 5, standards: ["12경수04-04"], strategy: "derivative-sign-change-max", evidence: "application" },
];
