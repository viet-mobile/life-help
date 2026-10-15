// 인공지능 수학 (12인수): text data as sets / vectors, images as matrices, trend lines, loss functions and gradient descent.
// Class X standards (concept, history, explaining, inquiry: 12인수01-*, 05-*) and the explaining-only 02-03 / 03-03 get no items.
import { Q, gcd, lin, poly, tfrac } from "../lib.mjs";

const mat = (rows) => `\\begin{pmatrix}${rows.map((r) => r.join("&")).join("\\\\")}\\end{pmatrix}`;
const vec = (xs) => `(${xs.join(", ")})`;
const fix = (q) => q.toNumber();
const paren = (x) => (x < 0 ? `(${x})` : String(x));
const randRows = (r, m, n, lo, hi) => Array.from({ length: m }, () => Array.from({ length: n }, () => r.int(lo, hi)));

// vectors with non-negative integer entries and an integer length, built once per dimension
const normPool = (d, maxLen2) => {
  const out = [];
  const rec = (pre) => {
    if (pre.length === d) {
      const s = pre.reduce((a, x) => a + x * x, 0);
      const nz = pre.filter((x) => x > 0).length;
      if (nz >= 2 && s <= maxLen2 && Number.isInteger(Math.sqrt(s))) out.push(pre);
      return;
    }
    for (let x = 0; x <= 12; x++) rec([...pre, x]);
  };
  rec([]);
  return out;
};
const POOL = { 2: normPool(2, 225), 3: normPool(3, 225), 4: normPool(4, 169) };

export const TEMPLATES = {
  ai_cosine: {
    ko: ["두 문서 A, B에서 사전의 단어가 나타난 횟수를 사전 순서대로 적은 빈도수 벡터가 $\\vec{a}={va}$, $\\vec{b}={vb}$입니다. 두 문서의 코사인 유사도 $\\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$의 값은? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["먼저 내적 $\\vec{a}\\cdot\\vec{b}$를 성분끼리 곱해서 더해 구해요.", "두 벡터의 크기 $|\\vec{a}|$, $|\\vec{b}|$는 각 성분의 제곱의 합에 제곱근을 씌운 값이에요. 둘 다 자연수예요."], "$\\vec{a}\\cdot\\vec{b}={dot}$, $|\\vec{a}|={na}$, $|\\vec{b}|={nb}$이므로 코사인 유사도는 $\\frac{{dot}}{{na}\\times{nb}}={fr}$입니다."],
    en: ["The word-frequency vectors of documents A and B (counts of the dictionary words, in dictionary order) are $\\vec{a}={va}$ and $\\vec{b}={vb}$. What is their cosine similarity $\\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$? (a decimal or a fraction such as 3/4 is fine)", ["First compute the dot product by multiplying matching entries and adding.", "A length is the square root of the sum of squared entries; both lengths are whole numbers."], "$\\vec{a}\\cdot\\vec{b}={dot}$, $|\\vec{a}|={na}$, $|\\vec{b}|={nb}$, so the cosine similarity is $\\frac{{dot}}{{na}\\times{nb}}={fr}$."],
  },
  ai_jaccard: {
    ko: ["사전의 단어에 $1$번부터 $12$번까지 번호를 붙였습니다. 문서 A에 나타나는 단어의 번호 집합은 $A=\\{{sa}\\}$, 문서 B는 $B=\\{{sb}\\}$입니다. 두 문서의 자카드 유사도 $\\dfrac{n(A\\cap B)}{n(A\\cup B)}$의 값은? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["$A\\cap B$는 두 문서에 모두 나타나는 단어의 번호 집합이에요.", "$n(A\\cup B)=n(A)+n(B)-n(A\\cap B)$예요."], "$n(A\\cap B)={ni}$, $n(A\\cup B)={nu}$이므로 $\\frac{{ni}}{{nu}}={fr}$입니다."],
    en: ["The dictionary words are numbered $1$ to $12$. The word numbers appearing in document A form the set $A=\\{{sa}\\}$ and in document B the set $B=\\{{sb}\\}$. What is the Jaccard similarity $\\dfrac{n(A\\cap B)}{n(A\\cup B)}$ of the two documents? (a decimal or a fraction such as 3/4 is fine)", ["$A\\cap B$ is the set of word numbers appearing in both documents.", "$n(A\\cup B)=n(A)+n(B)-n(A\\cap B)$."], "$n(A\\cap B)={ni}$ and $n(A\\cup B)={nu}$, so the similarity is $\\frac{{ni}}{{nu}}={fr}$."],
  },
  ai_jaccardRev: {
    ko: ["문서 A에는 서로 다른 단어가 ${na}$개, 문서 B에는 ${nb}$개 나타납니다. 두 문서의 단어 집합을 $A$, $B$라 할 때 자카드 유사도 $\\dfrac{n(A\\cap B)}{n(A\\cup B)}$가 $\\dfrac{{jp}}{{jq}}$입니다. 두 문서에 모두 나타나는 서로 다른 단어는 몇 개인가요? (숫자만 쓰세요)", ["공통 단어의 수를 $x$라 하면 $n(A\\cup B)=n(A)+n(B)-x$예요.", "$\\dfrac{x}{{na}+{nb}-x}=\\dfrac{{jp}}{{jq}}$를 $x$에 대한 방정식으로 풀어요."], "$n(A\\cup B)={na}+{nb}-x$이므로 $\\frac{x}{{na}+{nb}-x}=\\frac{{jp}}{{jq}}$, 이를 풀면 $x={ans}$입니다."],
    en: ["Document A contains ${na}$ distinct words and document B contains ${nb}$. For their word sets $A$ and $B$ the Jaccard similarity $\\dfrac{n(A\\cap B)}{n(A\\cup B)}$ equals $\\dfrac{{jp}}{{jq}}$. How many distinct words appear in both documents? (digits only)", ["Let $x$ be the number of common words; then $n(A\\cup B)=n(A)+n(B)-x$.", "Solve $\\dfrac{x}{{na}+{nb}-x}=\\dfrac{{jp}}{{jq}}$ for $x$."], "Since $n(A\\cup B)={na}+{nb}-x$, we need $\\frac{x}{{na}+{nb}-x}=\\frac{{jp}}{{jq}}$, which gives $x={ans}$."],
  },
  ai_pixelBright: {
    ko: ["흑백 이미지의 화소 밝기(0~255)를 행렬 $A={mat}$로 나타냈습니다. 이미지를 밝게 하려고 모든 화소의 밝기 $p$를 $\\min(255,\\ {a}p+{b})$로 바꿉니다. (255를 넘는 값은 255가 됩니다.) 바뀐 이미지 행렬의 모든 성분의 합은? (숫자만 쓰세요)", ["성분마다 ${a}p+{b}$를 먼저 계산하고, 255보다 크면 255로 바꿔요.", "새 행렬을 모두 쓴 뒤 성분을 전부 더해요."], "새 행렬은 $B={res}$이고, 모든 성분의 합은 ${ans}$입니다."],
    en: ["The brightness values (0-255) of the pixels of a grayscale image form the matrix $A={mat}$. To brighten the image every pixel value $p$ is replaced by $\\min(255,\\ {a}p+{b})$ (values above 255 become 255). What is the sum of all entries of the new matrix? (digits only)", ["Compute ${a}p+{b}$ for each entry first, then cap it at 255.", "Write the whole new matrix, then add all its entries."], "The new matrix is $B={res}$ and the sum of all its entries is ${ans}$."],
  },
  ai_flipTranspose: {
    ko: ["$3\\times4$ 이미지의 밝기를 행렬 $A={mat}$로 나타냈습니다. 각 행의 성분 순서를 거꾸로 하여 좌우를 뒤집은 이미지의 행렬을 $B$라 하고, $B$의 전치행렬을 $C$라 합니다. $C$의 {i}행 {j}열 성분은? (숫자만 쓰세요)", ["먼저 $A$의 각 행을 거꾸로 써서 $B$를 만들어요.", "전치행렬은 행과 열을 바꾼 행렬이라 $C$는 $4\\times3$ 행렬이에요."], "$B={bm}$, $C={cm}$이므로 {i}행 {j}열 성분은 ${ans}$입니다."],
    en: ["The brightness values of a $3\\times4$ image form the matrix $A={mat}$. Reversing the order of the entries in every row (a left-right flip) gives the matrix $B$, and the transpose of $B$ is $C$. What is the entry of $C$ in row {i}, column {j}? (digits only)", ["First write each row of $A$ backwards to get $B$.", "The transpose swaps rows and columns, so $C$ is a $4\\times3$ matrix."], "$B={bm}$ and $C={cm}$, so the entry in row {i}, column {j} is ${ans}$."],
  },
  ai_convolve: {
    ko: ["이미지 $I={img}$에 필터 $K={ker}$를 한 칸씩 옮겨 가며 적용합니다. 각 위치에서 필터와 겹치는 성분끼리 곱하여 모두 더한 값을 모아 만든 행렬(특성 지도)의 모든 성분의 합은? (숫자만 쓰세요)", ["필터를 이미지의 왼쪽 위에 놓고 겹친 성분끼리 곱해 더한 값이 특성 지도의 첫 성분이에요.", "필터를 한 칸씩 오른쪽, 아래쪽으로 옮기며 같은 계산을 반복해요."], "특성 지도는 ${out}$이고, 모든 성분의 합은 ${ans}$입니다."],
    en: ["A filter $K={ker}$ is applied to the image $I={img}$ by sliding it one cell at a time. At each position the overlapping entries are multiplied and added, and these values form a feature map. What is the sum of all entries of the feature map? (digits only)", ["With the filter on the top-left corner, multiply overlapping entries and add: that is the first entry of the map.", "Move the filter one cell right or down and repeat."], "The feature map is ${out}$ and the sum of its entries is ${ans}$."],
  },
  ai_bayesSpam: {
    ko: ["받은 메일 중 ${s}\\%$가 스팸입니다. 스팸 메일의 ${p}\\%$는 어떤 낱말을 포함하고, 스팸이 아닌 메일의 ${q}\\%$도 그 낱말을 포함합니다. 이 낱말을 포함한 메일을 한 통 골랐을 때, 그 메일이 스팸일 확률은? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["메일 $100$통(또는 $10000$통)이 있다고 보고 각 경우의 수를 세어 봐요.", "(낱말을 포함한 스팸 수) ÷ (낱말을 포함한 메일 전체 수)예요."], "메일 $10000$통 중 스팸은 ${s2}$통이고 그중 낱말을 포함한 것은 ${a}$통, 스팸이 아닌 메일 ${h2}$통 중 낱말을 포함한 것은 ${b}$통입니다. 따라서 $\\frac{{a}}{{a}+{b}}={fr}$입니다."],
    en: ["${s}\\%$ of the received e-mails are spam. ${p}\\%$ of the spam e-mails contain a certain word, and ${q}\\%$ of the non-spam e-mails contain it too. An e-mail containing this word is chosen. What is the probability that it is spam? (a decimal or a fraction such as 3/4 is fine)", ["Imagine $100$ (or $10000$) e-mails and count each case.", "It is (spam containing the word) divided by (all e-mails containing the word)."], "Out of $10000$ e-mails, ${s2}$ are spam and ${a}$ of them contain the word; of the ${h2}$ non-spam e-mails, ${b}$ contain it. So the probability is $\\frac{{a}}{{a}+{b}}={fr}$."],
  },
  ai_trendPredict: {
    ko: ["다음 자료의 추세선을 최소제곱법으로 구하여 $y=ax+b$라 합니다. $x={x0}$일 때 추세선이 예측하는 $y$의 값은? (숫자만 쓰세요)\n$x$: {xs}\n$y$: {ys}", ["$x$의 평균 $\\bar{x}$와 $y$의 평균 $\\bar{y}$를 구해요. 추세선은 점 $(\\bar{x},\\bar{y})$를 지나요.", "기울기 $a=\\dfrac{\\sum(x_i-\\bar{x})(y_i-\\bar{y})}{\\sum(x_i-\\bar{x})^2}$예요."], "$\\bar{x}={mx}$, $\\bar{y}={my}$, $\\sum(x_i-\\bar{x})(y_i-\\bar{y})={sxy}$, $\\sum(x_i-\\bar{x})^2={sxx}$이므로 $a={sl}$입니다. $y-{my}={sl}(x-{mx})$에서 $x={x0}$일 때 $y={ans}$입니다."],
    en: ["The least-squares trend line of the data below is $y=ax+b$. What value of $y$ does the trend line predict at $x={x0}$? (digits only)\n$x$: {xs}\n$y$: {ys}", ["Find the means $\\bar{x}$ and $\\bar{y}$. The trend line passes through $(\\bar{x},\\bar{y})$.", "The slope is $a=\\dfrac{\\sum(x_i-\\bar{x})(y_i-\\bar{y})}{\\sum(x_i-\\bar{x})^2}$."], "$\\bar{x}={mx}$, $\\bar{y}={my}$, $\\sum(x_i-\\bar{x})(y_i-\\bar{y})={sxy}$, $\\sum(x_i-\\bar{x})^2={sxx}$, so $a={sl}$. In $y-{my}={sl}(x-{mx})$, $x={x0}$ gives $y={ans}$."],
  },
  ai_mseLoss: {
    ko: ["점 {pts}에 대해 직선 모형 $\\hat{y}={model}$의 평균제곱오차(MSE) $\\dfrac{1}{n}\\sum(y_i-\\hat{y}_i)^2$의 값은? (숫자만 쓰세요)", ["각 점에서 오차 $y_i-\\hat{y}_i$를 먼저 구해요.", "오차를 제곱해서 모두 더한 뒤 점의 개수 $n={np}$으로 나눠요."], "오차는 ${res}$이고 제곱의 합은 ${sq}$이므로 MSE는 $\\frac{{tot}}{{np}}={ans}$입니다."],
    en: ["For the points {pts}, what is the mean squared error (MSE) $\\dfrac{1}{n}\\sum(y_i-\\hat{y}_i)^2$ of the line model $\\hat{y}={model}$? (digits only)", ["First find the error $y_i-\\hat{y}_i$ at every point.", "Square the errors, add them and divide by the number of points $n={np}$."], "The errors are ${res}$ and the sum of squares is ${sq}$, so the MSE is $\\frac{{tot}}{{np}}={ans}$."],
  },
  ai_gradStep: {
    ko: ["손실함수 $L(w)={lw}$를 경사하강법으로 줄이려 합니다. $w_{n+1}=w_n-\\eta L'(w_n)$, 학습률 $\\eta={eta}$, 처음 값 $w_0={w0}$일 때 {t}번 갱신한 $w_{{t}}$의 값은? (숫자만 쓰세요)", ["먼저 $L'(w)$를 구해요.", "$w_0$부터 차례로 $w_1$, $w_2$, ...를 계산해요."], "$L'(w)={dl}$입니다. 따라서 {steps}이고, $w_{{t}}={ans}$입니다."],
    en: ["The loss function $L(w)={lw}$ is reduced by gradient descent: $w_{n+1}=w_n-\\eta L'(w_n)$ with learning rate $\\eta={eta}$ and starting value $w_0={w0}$. What is $w_{{t}}$ after {t} updates? (digits only)", ["First find $L'(w)$.", "Compute $w_1$, $w_2$, ... in turn starting from $w_0$."], "$L'(w)={dl}$. so {steps}, and $w_{{t}}={ans}$."],
  },
  ai_gradMse: {
    ko: ["모형 $\\hat{y}=wx$로 점 {pts}을 예측합니다. 손실함수는 $L(w)=\\dfrac{1}{n}\\sum(wx_i-y_i)^2$($n$은 점의 개수)입니다. $w_0={w0}$에서 학습률 $\\eta={eta}$로 경사하강법을 한 번 적용한 $w_1=w_0-\\eta L'(w_0)$의 값은? (숫자만 쓰세요)", ["$L'(w)=\\dfrac{2}{n}\\sum x_i(wx_i-y_i)$예요.", "$w=w_0$를 넣어 기울기 $L'(w_0)$를 먼저 구해요."], "$L'({w0})=\\frac{2}{{np}}\\times({g})={grad}$이므로 $w_1={w0}-{eta}\\times({grad})={ans}$입니다."],
    en: ["The model $\\hat{y}=wx$ predicts the points {pts}. The loss is $L(w)=\\dfrac{1}{n}\\sum(wx_i-y_i)^2$ ($n$ is the number of points). Starting at $w_0={w0}$ with learning rate $\\eta={eta}$, apply one gradient-descent step $w_1=w_0-\\eta L'(w_0)$. What is $w_1$? (digits only)", ["$L'(w)=\\dfrac{2}{n}\\sum x_i(wx_i-y_i)$.", "Put in $w=w_0$ to get the slope $L'(w_0)$ first."], "$L'({w0})=\\frac{2}{{np}}\\times({g})={grad}$, so $w_1={w0}-{eta}\\times({grad})={ans}$."],
  },
};

const fracOf = (num, den) => { const g = gcd(num, den) || 1; return [num / g, den / g]; };

export const GEN = {
  ai_cosine: (r, lvl) => {
    const pool = lvl === 1 ? POOL[2] : POOL[r.pick([3, 3, 4])];
    for (;;) {
      const a = r.pick(pool), b = r.pick(pool);
      if (a.join() === b.join()) continue;
      const dot = a.reduce((s, x, i) => s + x * b[i], 0);
      const na = Math.round(Math.sqrt(a.reduce((s, x) => s + x * x, 0))), nb = Math.round(Math.sqrt(b.reduce((s, x) => s + x * x, 0)));
      const [p, q] = fracOf(dot, na * nb);
      if (dot === 0 || p >= q || q > 150) continue;
      return { v: { va: vec(a), vb: vec(b), dot, na, nb, fr: tfrac(p, q) }, ans: dot / (na * nb) };
    }
  },
  ai_jaccard: (r) => {
    for (;;) {
      const pickSet = (k) => { const s = new Set(); while (s.size < k) s.add(r.int(1, 12)); return [...s].sort((x, y) => x - y); };
      const A = pickSet(r.int(3, 7)), B = pickSet(r.int(3, 7));
      const ni = A.filter((x) => B.includes(x)).length;
      const nu = A.length + B.length - ni;
      if (ni === 0 || ni === nu) continue;
      const [p, q] = fracOf(ni, nu);
      return { v: { sa: A.join(", "), sb: B.join(", "), ni, nu, fr: tfrac(p, q) }, ans: ni / nu };
    }
  },
  ai_jaccardRev: (r) => {
    for (;;) {
      const na = r.int(4, 12), nb = r.int(4, 12), x = r.int(1, Math.min(na, nb) - 1);
      const [jp, jq] = fracOf(x, na + nb - x);
      if (jq > 30) continue;
      return { v: { na, nb, jp, jq }, ans: x };
    }
  },
  ai_pixelBright: (r) => {
    for (;;) {
      const a = r.pick([2, 3]), b = r.int(1, 60);
      const A = randRows(r, r.pick([2, 3]), 3, 20, 200);
      const B = A.map((row) => row.map((p) => Math.min(255, a * p + b)));
      const clipped = B.flat().filter((x) => x === 255).length;
      if (clipped < 1 || clipped > 5) continue;
      return { v: { mat: mat(A), a, b, res: mat(B) }, ans: B.flat().reduce((s, x) => s + x, 0) };
    }
  },
  ai_flipTranspose: (r) => {
    const A = randRows(r, 3, 4, 10, 99);
    const B = A.map((row) => [...row].reverse());
    const Ct = [0, 1, 2, 3].map((j) => B.map((row) => row[j]));
    const i = r.int(1, 4), j = r.int(1, 3);
    return { v: { mat: mat(A), i, j, bm: mat(B), cm: mat(Ct) }, ans: Ct[i - 1][j - 1] };
  },
  ai_convolve: (r, lvl) => {
    const [n, k] = lvl === 1 ? [3, 2] : [4, 3];
    for (;;) {
      const I = randRows(r, n, n, 0, 9), K = randRows(r, k, k, -1, lvl === 1 ? 3 : 2);
      if (K.flat().every((x) => x === 0) || K.flat().every((x) => x >= 0) && lvl === 2) continue;
      const m = n - k + 1;
      const O = Array.from({ length: m }, (_, a) => Array.from({ length: m }, (_, b) => { let s = 0; for (let x = 0; x < k; x++) for (let y = 0; y < k; y++) s += I[a + x][b + y] * K[x][y]; return s; }));
      return { v: { img: mat(I), ker: mat(K), out: mat(O) }, ans: O.flat().reduce((s, x) => s + x, 0) };
    }
  },
  ai_bayesSpam: (r) => {
    for (;;) {
      const s = r.int(2, 12) * 5, p = r.int(4, 18) * 5, q = r.int(1, 12) * 5;
      if (p <= q || s > 60) continue;
      const a = s * p, b = (100 - s) * q;
      const [n, d] = fracOf(a, a + b);
      if (d > 40 || d === 1) continue;
      return { v: { s, p, q, s2: s * 100, h2: (100 - s) * 100, a: a, b: b, fr: tfrac(n, d) }, ans: a / (a + b) };
    }
  },
  ai_trendPredict: (r, lvl) => {
    for (;;) {
      const n = lvl === 1 ? 4 : 5, d = lvl === 1 ? 1 : r.pick([1, 2]), x1 = lvl === 1 ? 1 : r.int(0, 6);
      const xs = Array.from({ length: n }, (_, i) => x1 + d * i);
      const a0 = r.int(-3, 6), b0 = r.int(8, 30);
      const ys = xs.map((x) => a0 * x + b0 + r.int(-3, 3));
      if (ys.some((y) => y < 1)) continue;
      const x0 = xs[n - 1] + d * r.int(1, 2);
      const mx = new Q(xs.reduce((s, x) => s + x, 0), n), my = new Q(ys.reduce((s, y) => s + y, 0), n);
      let sxy = new Q(0), sxx = new Q(0);
      xs.forEach((x, i) => { const dx = Q.of(x).sub(mx); sxy = sxy.add(dx.mul(Q.of(ys[i]).sub(my))); sxx = sxx.add(dx.mul(dx)); });
      const sl = sxy.div(sxx), pred = my.add(sl.mul(Q.of(x0).sub(mx)));
      if (!pred.terminates(3) || !sl.terminates(3) || !mx.terminates(3) || !my.terminates(3) || pred.toNumber() < 0) continue;
      return { v: { x0, xs: xs.join(", "), ys: ys.join(", "), mx: String(fix(mx)), my: String(fix(my)), sxy: String(fix(sxy)), sxx: String(fix(sxx)), sl: String(fix(sl)) }, ans: fix(pred) };
    }
  },
  ai_mseLoss: (r) => {
    const n = r.pick([4, 5, 8]), a = r.nonzero(-2, 4), b = r.int(-3, 8);
    const xs = Array.from({ length: n }, (_, i) => i + 1);
    const ys = xs.map((x) => a * x + b + r.int(-4, 4));
    const res = ys.map((y, i) => y - (a * xs[i] + b));
    const tot = res.reduce((s, e) => s + e * e, 0);
    return { v: { pts: `$${xs.map((x, i) => `(${x}, ${ys[i]})`).join(", ")}$`, model: lin(a, b), np: n, res: res.join(", "), sq: `${res.map((e) => e * e).join("+")}=${tot}`, tot }, ans: tot / n };
  },
  ai_gradStep: (r, lvl) => {
    for (;;) {
      const a = r.int(1, 3), eta = r.pick([[1, 10], [1, 20], [1, 5], [1, 4], [1, 2], [3, 20]]);
      const m = r.int(-5, 5), c0 = r.int(0, 9), w0 = r.int(-9, 9), t = lvl === 1 ? r.int(1, 2) : r.int(2, 3);
      const b = lvl === 1 ? -2 * a * m : r.int(-14, 14);
      if (b === 0 || w0 === Math.round(-b / (2 * a))) continue;
      let w = new Q(w0);
      const parts = [];
      for (let k = 0; k < t; k++) {
        const g = w.mul(2 * a).add(b), prev = fix(w);
        w = w.sub(g.mul(new Q(eta[0], eta[1])));
        parts.push(`w_{${k + 1}}=${paren(prev)}-${eta[0] / eta[1]}\\times(${fix(g)})=${fix(w)}`);
      }
      if (!w.terminates(3)) continue;
      return { v: { lw: poly([a, b, c0], "w"), dl: poly([2 * a, b], "w"), eta: String(eta[0] / eta[1]), w0, t, steps: `$${parts.join(",\\ ")}$` }, ans: fix(w) };
    }
  },
  ai_gradMse: (r) => {
    for (;;) {
      const n = r.pick([2, 3]), w0 = r.int(0, 4);
      const xs = Array.from({ length: n }, (_, i) => i + 1 + (n === 2 ? r.int(0, 1) : 0));
      if (new Set(xs).size < n) continue;
      const ys = xs.map((x) => x * r.int(1, 4) + r.int(-1, 2));
      const eta = r.pick([[1, 100], [1, 50], [1, 20], [1, 10], [1, 25]]);
      const g = xs.reduce((s, x, i) => s + x * (w0 * x - ys[i]), 0);
      const grad = new Q(2 * g, n);
      const w1 = new Q(w0).sub(grad.mul(new Q(eta[0], eta[1])));
      if (g === 0 || !grad.terminates(3) || !w1.terminates(3)) continue;
      return { v: { pts: `$${xs.map((x, i) => `(${x}, ${ys[i]})`).join(", ")}$`, w0, eta: String(eta[0] / eta[1]), np: n, g: xs.map((x, i) => `${x}\\times(${w0 * x}-${ys[i]})`).join("+"), grad: String(fix(grad)) }, ans: fix(w1) };
    }
  },
};

const P = (skill, template, levels, count, d, standards, strategy, evidence) => ({ skill, template, levels, count, d, standards, strategy, evidence });
export const PLAN = [
  P("m.el.ai1", "ai_cosine", [1, 2], 12, 3, ["12인수02-02"], "dot-and-norm", "calc"),
  P("m.el.ai1", "ai_jaccard", [1], 16, 2, ["12인수02-01"], "set-overlap", "representation"),
  P("m.el.ai1", "ai_jaccardRev", [1], 14, 4, ["12인수02-01"], "solve-for-intersection", "reverse"),
  P("m.el.ai1", "ai_pixelBright", [1], 16, 2, ["12인수03-02"], "entrywise-clamp", "application"),
  P("m.el.ai1", "ai_flipTranspose", [1], 12, 3, ["12인수03-01", "12인수03-02"], "matrix-transform-chain", "representation"),
  P("m.el.ai1", "ai_convolve", [1, 2], 12, 3, ["12인수03-02"], "sliding-filter", "calc"),
  P("m.el.ai2", "ai_bayesSpam", [1], 16, 4, ["12인수04-01"], "conditional-from-rates", "application"),
  P("m.el.ai2", "ai_trendPredict", [1, 2], 12, 3, ["12인수04-02"], "least-squares-line", "application"),
  P("m.el.ai2", "ai_mseLoss", [1], 14, 2, ["12인수04-03"], "mean-squared-error", "calc"),
  P("m.el.ai2", "ai_gradStep", [1, 2], 12, 3, ["12인수04-04"], "iterate-descent", "calc"),
  P("m.el.ai2", "ai_gradMse", [1], 12, 4, ["12인수04-04", "12인수04-03"], "gradient-of-mse", "application"),
];
