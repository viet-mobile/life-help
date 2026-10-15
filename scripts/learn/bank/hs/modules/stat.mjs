// 실용 통계 (12실통): summaries of data, interval estimation, test statistics (every table value is given in the prompt) and sampling.
// Class X standards (12실통01-01/02, 04-*) and the purely descriptive 02-01..03 get no items.
import { Q, lin, gcd } from "../lib.mjs";

const num = (q) => q.toNumber();
const SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 144, 196, 225, 400];
const isq = (n) => Math.round(Math.sqrt(n));
const shuffle = (r, xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = r.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const medianOf = (a) => { const n = a.length; return n % 2 ? new Q(a[(n - 1) / 2]) : new Q(a[n / 2 - 1] + a[n / 2], 2); };
// confidence levels with their given z values
const ZS = [[90, "1.645", 1645], [95, "1.96", 196], [99, "2.58", 258]];
const zq = (z) => new Q(z[2], z[0] === 95 || z[0] === 99 ? 100 : 1000);

export const TEMPLATES = {
  stat_quartileIqr: {
    ko: ["자료 {data}를 크기순으로 나열한 뒤, 중앙값을 기준으로 아래쪽 절반의 중앙값을 제1사분위수 $Q_1$, 위쪽 절반의 중앙값을 제3사분위수 $Q_3$이라 합니다. (자료의 개수가 홀수이면 중앙값 자신은 어느 쪽 절반에도 넣지 않습니다.) 사분위수 범위 $Q_3-Q_1$의 값은? (숫자만 쓰세요)", ["먼저 자료를 작은 값부터 크기순으로 다시 써요.", "전체의 중앙값으로 자료를 아래쪽과 위쪽 절반으로 나눈 뒤, 각 절반의 중앙값을 구해요."], "크기순: {sorted}. $Q_1={q1}$, $Q_3={q3}$이므로 $Q_3-Q_1={ans}$입니다."],
    en: ["Arrange the data {data} in increasing order. The median of the lower half is the first quartile $Q_1$ and the median of the upper half is the third quartile $Q_3$. (If the number of data is odd, the median itself belongs to neither half.) What is the interquartile range $Q_3-Q_1$? (digits only)", ["First rewrite the data from smallest to largest.", "Split the data at the overall median into a lower and an upper half and find the median of each half."], "In order: {sorted}. $Q_1={q1}$ and $Q_3={q3}$, so $Q_3-Q_1={ans}$."],
  },
  stat_sdFreq: {
    ko: ["변량 $x$의 값이 {xs}이고, 각 값의 도수가 차례로 {fs}인 도수분포표가 있습니다. 이 자료를 모집단 전체로 보고(분산의 분모는 도수의 총합), 표준편차를 구하면? (숫자만 쓰세요)", ["도수의 총합 $N$과 평균 $m=\\dfrac{\\sum f x}{N}$를 먼저 구해요.", "분산 $=\\dfrac{\\sum f x^2}{N}-m^2$이고, 표준편차는 그 양의 제곱근이에요."], "$N={tot}$, 평균 $m={mean}$, $\\dfrac{\\sum f x^2}{N}={msq}$이므로 분산은 ${var}$이고, 표준편차는 ${ans}$입니다."],
    en: ["A frequency table has values {xs} of the variable $x$ with frequencies {fs} in that order. Treat the data as the whole population (the denominator of the variance is the total frequency). What is the standard deviation? (digits only)", ["First find the total frequency $N$ and the mean $m=\\dfrac{\\sum f x}{N}$.", "The variance is $\\dfrac{\\sum f x^2}{N}-m^2$ and the standard deviation is its positive square root."], "$N={tot}$, mean $m={mean}$, $\\dfrac{\\sum f x^2}{N}={msq}$, so the variance is ${var}$ and the standard deviation is ${ans}$."],
  },
  stat_linTransform: {
    ko: ["변량 $x$의 평균이 ${m}$, 분산이 ${vx}$입니다. 새 변량 $y$가 $y={eq}$일 때, $y$의 평균과 $y$의 분산의 합은? (숫자만 쓰세요)", ["$y=ax+b$이면 평균은 $a\\bar{x}+b$예요.", "분산은 $a^2$배가 되고, 더해지는 상수 $b$는 분산에 영향을 주지 않아요."], "$y$의 평균은 ${my}$, 분산은 ${vy}$이므로 합은 ${ans}$입니다."],
    en: ["The variable $x$ has mean ${m}$ and variance ${vx}$. A new variable $y$ is given by $y={eq}$. What is the sum of the mean of $y$ and the variance of $y$? (digits only)", ["If $y=ax+b$, the mean is $a\\bar{x}+b$.", "The variance is multiplied by $a^2$ and the added constant $b$ does not change it."], "The mean of $y$ is ${my}$ and its variance is ${vy}$, so the sum is ${ans}$."],
  },
  stat_ciMean: {
    ko: ["정규분포를 따르는 모집단에서 {cnt}개를 임의추출했습니다. 표본평균은 $\\bar{x}={xbar}$이고 모표준편차는 $\\sigma={sig}$입니다. 모평균에 대한 신뢰도 ${cl}\\%$의 신뢰구간은 $\\bar{x}-z\\dfrac{\\sigma}{\\sqrt{n}}\\le m\\le\\bar{x}+z\\dfrac{\\sigma}{\\sqrt{n}}$이고, 이때 $z={z}$를 씁니다. 이 신뢰구간의 위쪽 끝 값(상한)은? (숫자만 쓰세요)", ["먼저 표준오차 $\\dfrac{\\sigma}{\\sqrt{n}}$를 구해요. $n$이 제곱수라서 나누어떨어져요.", "오차 한계는 $z\\times$(표준오차)이고, 상한은 $\\bar{x}$에 이것을 더한 값이에요."], "표준오차는 $\\frac{{sig}}{\\sqrt{{cnt}}}={se}$, 오차 한계는 ${z}\\times{se}={moe}$이므로 상한은 ${xbar}+{moe}={ans}$입니다."],
    en: ["A sample of {cnt} is drawn at random from a normally distributed population; the sample mean is $\\bar{x}={xbar}$ and the population standard deviation is $\\sigma={sig}$. The ${cl}\\%$ confidence interval for the population mean is $\\bar{x}-z\\dfrac{\\sigma}{\\sqrt{n}}\\le m\\le\\bar{x}+z\\dfrac{\\sigma}{\\sqrt{n}}$ with $z={z}$. What is the upper end of this interval? (digits only)", ["First find the standard error $\\dfrac{\\sigma}{\\sqrt{n}}$; $n$ is a perfect square so it divides evenly.", "The margin of error is $z\\times$(standard error); add it to $\\bar{x}$ for the upper end."], "The standard error is $\\frac{{sig}}{\\sqrt{{cnt}}}={se}$, the margin of error is ${z}\\times{se}={moe}$, so the upper end is ${xbar}+{moe}={ans}$."],
  },
  stat_tCiLower: {
    ko: ["정규분포를 따르는 모집단에서 {cnt}개를 임의추출했습니다. 표본평균은 $\\bar{x}={xbar}$, 표본표준편차는 $s={sd}$입니다. 모표준편차를 모르므로 $t$분포를 쓰며, 자유도 ${df}$인 $t$분포표에서 $P(T\\le {t0})=0.975$입니다. 모평균 $m$의 신뢰도 $95\\%$ 신뢰구간 $\\bar{x}-t_0\\dfrac{s}{\\sqrt{n}}\\le m\\le\\bar{x}+t_0\\dfrac{s}{\\sqrt{n}}$ ($t_0={t0}$)의 아래쪽 끝 값(하한)은? (숫자만 쓰세요)", ["자유도는 $n-1$이고, 표준오차는 $\\dfrac{s}{\\sqrt{n}}$이에요.", "하한은 $\\bar{x}-t_0\\times$(표준오차)예요."], "표준오차는 $\\frac{{sd}}{\\sqrt{{cnt}}}={se}$, 오차 한계는 ${t0}\\times{se}={moe}$이므로 하한은 ${xbar}-{moe}={ans}$입니다."],
    en: ["A sample of {cnt} from a normally distributed population has mean $\\bar{x}={xbar}$ and sample standard deviation $s={sd}$. The population standard deviation is unknown, so the $t$ distribution is used; in the $t$ table for ${df}$ degrees of freedom, $P(T\\le {t0})=0.975$. What is the lower end of the $95\\%$ confidence interval $\\bar{x}-t_0\\dfrac{s}{\\sqrt{n}}\\le m\\le\\bar{x}+t_0\\dfrac{s}{\\sqrt{n}}$ ($t_0={t0}$) for the population mean $m$? (digits only)", ["The degrees of freedom are $n-1$ and the standard error is $\\dfrac{s}{\\sqrt{n}}$.", "The lower end is $\\bar{x}-t_0\\times$(standard error)."], "The standard error is $\\frac{{sd}}{\\sqrt{{cnt}}}={se}$, the margin of error is ${t0}\\times{se}={moe}$, so the lower end is ${xbar}-{moe}={ans}$."],
  },
  stat_ciProp: {
    ko: ["어떤 정책에 대해 {cnt}명을 임의추출하여 조사했더니 {ag}명이 찬성했습니다. 표본비율을 $\\hat{p}$이라 할 때 모비율의 신뢰도 ${cl}\\%$ 신뢰구간은 $\\hat{p}-z\\sqrt{\\dfrac{\\hat{p}(1-\\hat{p})}{n}}\\le p\\le\\hat{p}+z\\sqrt{\\dfrac{\\hat{p}(1-\\hat{p})}{n}}$이고, 이때 $z={z}$를 씁니다. 이 신뢰구간의 상한을 퍼센트(%) 단위의 수로 구하면? (숫자만 쓰세요)", ["표본비율 $\\hat{p}=\\dfrac{{ag}}{{cnt}}$을 먼저 구해요.", "$\\sqrt{\\dfrac{\\hat{p}(1-\\hat{p})}{n}}$는 유리수로 딱 떨어져요. 퍼센트로 바꿔서 계산하면 편해요."], "$\\hat{p}={ph}\\%$, $\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{{cnt}}}={sdp}\\%$이므로 오차 한계는 ${z}\\times{sdp}={moe}$(%)이고, 상한은 ${ph}+{moe}={ans}$(%)입니다."],
    en: ["{cnt} people are chosen at random and asked about a policy; {ag} of them agree. With sample proportion $\\hat{p}$, the ${cl}\\%$ confidence interval for the population proportion is $\\hat{p}-z\\sqrt{\\dfrac{\\hat{p}(1-\\hat{p})}{n}}\\le p\\le\\hat{p}+z\\sqrt{\\dfrac{\\hat{p}(1-\\hat{p})}{n}}$ with $z={z}$. What is the upper end of this interval, as a number of percent? (digits only)", ["First find the sample proportion $\\hat{p}=\\dfrac{{ag}}{{cnt}}$.", "$\\sqrt{\\dfrac{\\hat{p}(1-\\hat{p})}{n}}$ comes out rational. It is easier to work in percent."], "$\\hat{p}={ph}\\%$ and $\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{{cnt}}}={sdp}\\%$, so the margin of error is ${z}\\times{sdp}={moe}$ (%) and the upper end is ${ph}+{moe}={ans}$ (%)."],
  },
  stat_zStat: {
    ko: ["어떤 제품의 평균 수명은 ${mu0}$시간이라고 알려져 있습니다. 새 공정으로 만든 제품 {cnt}개를 임의추출하여 조사했더니 평균 수명이 $\\bar{x}={xbar}$시간이었습니다. 수명이 정규분포를 따르고 모표준편차 $\\sigma={sig}$시간은 변하지 않았다고 할 때, 귀무가설 $H_0: m={mu0}$에 대한 검정통계량 $Z=\\dfrac{\\bar{x}-{mu0}}{\\sigma/\\sqrt{n}}$의 값은? (숫자만 쓰세요)", ["$\\dfrac{\\sigma}{\\sqrt{n}}$를 먼저 계산해요.", "표본평균과 ${mu0}$의 차를 그 값으로 나눠요. 음수가 될 수도 있어요."], "$\\dfrac{\\sigma}{\\sqrt{{cnt}}}={se}$이므로 $Z=\\dfrac{{xbar}-{mu0}}{{se}}={ans}$입니다."],
    en: ["The mean lifetime of a product is known to be ${mu0}$ hours. {cnt} items made by a new process are chosen at random and their mean lifetime is $\\bar{x}={xbar}$ hours. Assuming normally distributed lifetimes and an unchanged population standard deviation $\\sigma={sig}$ hours, what is the value of the test statistic $Z=\\dfrac{\\bar{x}-{mu0}}{\\sigma/\\sqrt{n}}$ for the null hypothesis $H_0: m={mu0}$? (digits only)", ["Compute $\\dfrac{\\sigma}{\\sqrt{n}}$ first.", "Divide the difference between the sample mean and ${mu0}$ by that value; it can be negative."], "$\\dfrac{\\sigma}{\\sqrt{{cnt}}}={se}$, so $Z=\\dfrac{{xbar}-{mu0}}{{se}}={ans}$."],
  },
  stat_rejectN: {
    ko: ["다음 가설을 검정합니다. $H_0: m={mu0}$, $H_1: m>{mu0}$. 모표준편차는 $\\sigma={sig}$이고 표본평균은 $\\bar{x}={xbar}$라고 가정합니다. 검정통계량 $Z=\\dfrac{\\bar{x}-{mu0}}{\\sigma/\\sqrt{n}}$가 ${crit}$보다 크면 귀무가설을 기각합니다. 같은 표본평균이 나온다고 할 때 귀무가설을 기각하게 되는 가장 작은 표본의 크기 $n$은? (자연수, 숫자만 쓰세요)", ["$Z>{crit}$를 $\\sqrt{n}$에 대한 부등식으로 바꿔요.", "양변을 제곱해서 $n$의 범위를 구하고, 조건을 만족하는 가장 작은 자연수를 찾아요. 등호는 기각이 아니에요."], "$Z=\\dfrac{{xbar}-{mu0}}{{sig}}\\sqrt{n}>{crit}$에서 $\\sqrt{n}>{rt}$, 즉 $n>{lim}$(소수 둘째 자리까지 나타낸 값)입니다. 이를 만족하는 가장 작은 자연수는 ${ans}$입니다."],
    en: ["The hypotheses $H_0: m={mu0}$ and $H_1: m>{mu0}$ are tested. The population standard deviation is $\\sigma={sig}$ and the sample mean is assumed to be $\\bar{x}={xbar}$. The null hypothesis is rejected when the test statistic $Z=\\dfrac{\\bar{x}-{mu0}}{\\sigma/\\sqrt{n}}$ is greater than ${crit}$. If the same sample mean is obtained, what is the smallest sample size $n$ (a positive integer) for which the null hypothesis is rejected? (digits only)", ["Turn $Z>{crit}$ into an inequality for $\\sqrt{n}$.", "Square both sides to get the range of $n$ and take the smallest positive integer in it. Equality does not reject."], "From $Z=\\dfrac{{xbar}-{mu0}}{{sig}}\\sqrt{n}>{crit}$ we get $\\sqrt{n}>{rt}$, that is $n>{lim}$ (rounded to two decimals). The smallest positive integer satisfying this is ${ans}$."],
  },
  stat_stratified: {
    ko: ["학생 수가 각각 {n1}명, {n2}명, {n3}명인 세 학년에서 모두 {ns}명을 층화추출하려 합니다. 각 학년(층)에서 전체 학생 수에 대한 그 학년의 비율에 맞게 비례배분할 때, 두 번째 학년에서 뽑는 학생 수는? (숫자만 쓰세요)", ["전체 학생 수 $N$을 먼저 구해요.", "두 번째 학년에서 뽑는 수는 (뽑는 전체 학생 수)$\\times\\dfrac{{n2}}{N}$예요."], "전체 학생 수는 ${pop}$명이므로 ${ns}\\times\\dfrac{{n2}}{{pop}}={ans}$명입니다."],
    en: ["A total of {ns} students are to be chosen by stratified sampling from three grades with {n1}, {n2} and {n3} students. If the sample is allocated in proportion to the size of each grade (stratum) relative to all students, how many students are chosen from the second grade? (digits only)", ["Find the total number of students $N$ first.", "The number chosen from the second grade is (total sample size)$\\times\\dfrac{{n2}}{N}$."], "The total is ${pop}$ students, so ${ns}\\times\\dfrac{{n2}}{{pop}}={ans}$ students."],
  },
};

export const GEN = {
  stat_quartileIqr: (r, lvl) => {
    for (;;) {
      const n = lvl === 1 ? r.pick([8, 10, 12]) : r.pick([7, 9, 11, 13]);
      const data = Array.from({ length: n }, () => r.int(1, 60));
      const sorted = [...data].sort((a, b) => a - b);
      const h = Math.floor(n / 2);
      const q1 = medianOf(sorted.slice(0, h)), q3 = medianOf(sorted.slice(n - h));
      if (q3.sub(q1).toNumber() < 4) continue;
      return { v: { data: data.join(", "), sorted: sorted.join(", "), q1: String(num(q1)), q3: String(num(q3)) }, ans: num(q3.sub(q1)) };
    }
  },
  stat_sdFreq: (r) => {
    for (;;) {
      const k = r.int(3, 5);
      const base = r.int(1, 12), step = r.pick([1, 2, 3]);
      const xs = Array.from({ length: k }, (_, i) => base + step * i);
      const fs = Array.from({ length: k }, () => r.int(1, 7));
      const N = fs.reduce((a, b) => a + b, 0);
      if (N < 8 || N > 40) continue;
      const mean = new Q(xs.reduce((s, x, i) => s + x * fs[i], 0), N);
      const msq = new Q(xs.reduce((s, x, i) => s + x * x * fs[i], 0), N);
      const vr = msq.sub(mean.mul(mean));
      const p = Number(vr.p), q = Number(vr.q);
      if (p <= 0 || isq(p) ** 2 !== p || isq(q) ** 2 !== q) continue;
      const sd = new Q(isq(p), isq(q));
      if (!sd.terminates(3)) continue;
      return { v: { xs: xs.join(", "), fs: fs.join(", "), tot: N, mean: String(num(mean)), msq: String(num(msq)), var: String(num(vr)) }, ans: num(sd) };
    }
  },
  stat_linTransform: (r) => {
    const a = r.pick([-4, -3, -2, 2, 3, 4, 5]), b = r.nonzero(-12, 12), m = r.int(2, 30), vx = r.pick([1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 16]);
    const my = a * m + b, vy = a * a * vx;
    return { v: { m, vx, eq: lin(a, b), my, vy }, ans: my + vy };
  },
  stat_ciMean: (r) => {
    for (;;) {
      const n = r.pick(SQUARES), root = isq(n), sig = r.int(2, 40);
      const z = r.pick(ZS), xbar = new Q(r.int(100, 1500), 10);
      const se = new Q(sig, root), moe = zq(z).mul(se), up = xbar.add(moe);
      if (!se.terminates(2) || !moe.terminates(3) || !up.terminates(3) || num(se) < 0.4) continue;
      return { v: { cnt: n, xbar: String(num(xbar)), sig, cl: z[0], z: z[1], se: String(num(se)), moe: String(num(moe)) }, ans: num(up) };
    }
  },
  stat_tCiLower: (r) => {
    const T = [[4, 3, "3.182"], [9, 8, "2.306"], [16, 15, "2.131"], [25, 24, "2.064"], [36, 35, "2.030"], [49, 48, "2.011"], [64, 63, "1.998"], [100, 99, "1.984"]];
    const [n, df, t0] = r.pick(T), root = isq(n), k = r.int(1, 6), s = k * root, xbar = new Q(r.int(200, 2000), 10);
    const moe = new Q(Math.round(Number(t0) * 1000) * k, 1000), low = xbar.sub(moe);
    return { v: { cnt: n, xbar: String(num(xbar)), sd: s, df, t0, se: String(k), moe: String(num(moe)) }, ans: num(low) };
  },
  stat_ciProp: (r) => {
    const pool = [];
    for (const n of [25, 36, 49, 64, 100, 144, 225, 400, 900]) for (let x = 1; x < n; x++) { const pr = x * (n - x); if (isq(pr) ** 2 === pr) pool.push([n, x]); }
    for (;;) {
      const [n, x] = r.pick(pool), z = r.pick(ZS), root = isq(n);
      const sdp = new Q(isq(x * (n - x)) * 100, root ** 3), ph = new Q(100 * x, n);
      const moe = zq(z).mul(sdp), up = ph.add(moe);
      if (!ph.terminates(3) || !sdp.terminates(3) || !moe.terminates(3) || !up.terminates(3) || num(ph) + num(moe) >= 100 || num(ph) - num(moe) <= 0) continue;
      return { v: { cnt: n, ag: x, cl: z[0], z: z[1], ph: String(num(ph)), sdp: String(num(sdp)), moe: String(num(moe)) }, ans: num(up) };
    }
  },
  stat_zStat: (r) => {
    for (;;) {
      const n = r.pick([4, 9, 16, 25, 36, 64, 100]), root = isq(n), sig = r.int(2, 30);
      const se = new Q(sig, root), zt = new Q(r.nonzero(-9, 9), 2), mu0 = r.int(20, 200);
      const xbar = Q.of(mu0).add(zt.mul(se));
      if (!xbar.terminates(1) || !se.terminates(2) || num(se) < 0.5) continue;
      return { v: { mu0, cnt: n, xbar: String(num(xbar)), sig, se: String(num(se)) }, ans: num(zt) };
    }
  },
  stat_rejectN: (r) => {
    for (;;) {
      const mu0 = r.int(20, 200), sig = r.int(2, 30), crit = r.pick([["1.645", 1645], ["1.96", 1960], ["2.33", 2330], ["2.58", 2580]]);
      const d = new Q(r.pick([5, 8, 10, 16, 20, 25, 40]), 10), xbar = Q.of(mu0).add(d);
      const numer = new Q(crit[1] * sig, 1000), lim = numer.div(d).mul(numer.div(d));    // n > lim
      const limN = num(lim), frac = limN - Math.floor(limN);
      if (limN < 3 || limN > 600 || frac < 0.02 || frac > 0.98) continue;
      return { v: { mu0, sig, xbar: String(num(xbar)), crit: crit[0], rt: `\\frac{${num(numer)}}{${num(d)}}`, lim: limN.toFixed(2) }, ans: Math.floor(limN) + 1 };
    }
  },
  stat_stratified: (r) => {
    const k = r.pick([5, 10, 20, 25, 30, 40, 50]);
    const s1 = r.int(2, 14), s2 = r.int(2, 14), s3 = r.int(2, 14);
    const n1 = k * s1, n2 = k * s2, n3 = k * s3, N = n1 + n2 + n3, n = s1 + s2 + s3;
    return { v: { n1, n2, n3, ns: n, pop: N }, ans: s2 };
  },
};

const P = (skill, template, levels, count, d, standards, strategy, evidence) => ({ skill, template, levels, count, d, standards, strategy, evidence });
export const PLAN = [
  P("m.el.sta1", "stat_quartileIqr", [1, 2], 12, 2, ["12실통02-04"], "halves-medians", "calc"),
  P("m.el.sta1", "stat_sdFreq", [1], 18, 3, ["12실통02-04"], "frequency-table-sd", "calc"),
  P("m.el.sta1", "stat_linTransform", [1], 14, 3, ["12실통02-04"], "linear-change-of-variable", "concept"),
  P("m.el.sta1", "stat_stratified", [1], 12, 2, ["12실통01-03"], "proportional-allocation", "application"),
  P("m.el.sta2", "stat_ciMean", [1], 20, 3, ["12실통03-02"], "z-interval-endpoint", "application"),
  P("m.el.sta2", "stat_tCiLower", [1], 16, 3, ["12실통03-02", "12실통03-01"], "t-interval-endpoint", "application"),
  P("m.el.sta2", "stat_ciProp", [1], 20, 4, ["12실통03-03"], "proportion-interval", "application"),
  P("m.el.sta2", "stat_zStat", [1], 16, 3, ["12실통03-04"], "test-statistic", "calc"),
  P("m.el.sta2", "stat_rejectN", [1], 16, 5, ["12실통03-04"], "critical-value-inequality", "reverse"),
];
