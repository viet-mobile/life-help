// 확률과 통계 (12확통): counting (repeated permutation / combination, binomial theorem), probability, conditional probability and independence,
// discrete distributions, binomial and normal distribution (standard table given in the prompt), sampling and confidence intervals (z given).
import { C, gcd, sg, lin, cf, tfrac } from "../lib.mjs";

const NUMK = "(숫자만 쓰세요)", NUME = "(digits only)";
const FRK = "(소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", FRE = "(a decimal is fine, or a fraction such as 3/4)";
const DECK = "(소수로 쓰세요)", DECE = "(write it as a decimal)";
const DEC4K = "(소수 넷째 자리까지 쓰세요)", DEC4E = "(write it as a decimal with 4 decimal places)";
const TABK = "표준정규분포를 따르는 확률변수 $Z$에 대하여 $P(0\\le Z\\le 0.5)=0.1915$, $P(0\\le Z\\le 1)=0.3413$, $P(0\\le Z\\le 1.5)=0.4332$, $P(0\\le Z\\le 2)=0.4772$, $P(0\\le Z\\le 2.5)=0.4938$, $P(0\\le Z\\le 3)=0.4987$이다.";
const TABE = "For a random variable $Z$ with the standard normal distribution, $P(0\\le Z\\le 0.5)=0.1915$, $P(0\\le Z\\le 1)=0.3413$, $P(0\\le Z\\le 1.5)=0.4332$, $P(0\\le Z\\le 2)=0.4772$, $P(0\\le Z\\le 2.5)=0.4938$, $P(0\\le Z\\le 3)=0.4987$.";

const TAB = { 0.5: 1915, 1: 3413, 1.5: 4332, 2: 4772, 2.5: 4938, 3: 4987 }; // units of 1e-4
const ZS = [0.5, 1, 1.5, 2, 2.5, 3];
const phi0 = (z) => (z === 0 ? 0 : Math.sign(z) * TAB[Math.abs(z)]);
const t4 = (u) => (u / 10000).toFixed(4);
const feq = (n, d) => { const raw = `\\frac{${n}}{${d}}`, red = tfrac(n, d); return raw === red ? raw : `${raw}=${red}`; };
const frac = (n, d) => ({ fr: tfrac(n, d), ans: n / d });
const sq = (n) => Number.isInteger(Math.sqrt(n));
const powi = (a, b) => a ** b;
const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);

export const TEMPLATES = {
  pst_repPermCond: {
    ko: ["숫자 $0,\\ 1,\\ 2,\\ \\ldots,\\ {m}$ 중에서 중복을 허락하여 만든 ${k}$자리 자연수(맨 앞자리는 $0$이 아니다) 가운데 숫자 ${t}$이(가) 한 번 이상 쓰인 수는 모두 몇 개인가요? " + NUMK,
      ["'한 번 이상 쓰인'은 여사건('하나도 쓰이지 않은')을 이용하면 편해요. 맨 앞자리는 0이 올 수 없어요.", "전체 ${k}$자리 자연수의 개수는 ${tot}$개예요."],
      "전체 ${k}$자리 자연수는 ${tot}$개이고, 숫자 ${t}$이(가) 하나도 쓰이지 않은 수는 ${noExpr}={no}$개입니다. 따라서 ${tot}-{no}={ans}$개입니다."],
    en: ["Using digits $0,\\ 1,\\ 2,\\ \\ldots,\\ {m}$ with repetition allowed, we form ${k}$-digit natural numbers (the first digit is not $0$). How many of them contain the digit ${t}$ at least once? " + NUME,
      ["'At least once' is easier through the complement (the digit is never used). The first digit cannot be 0.", "There are ${tot}$ ${k}$-digit natural numbers in all."],
      "There are ${tot}$ such ${k}$-digit numbers in all, and ${noExpr}={no}$ of them never use the digit ${t}$. So ${tot}-{no}={ans}$."],
  },
  pst_latticePath: {
    ko: ["좌표평면 위의 점 $(0,\\ 0)$에서 점 $({m},\\ {n})$까지 오른쪽 또는 위쪽으로 한 칸씩만 움직여 가는 최단 경로 중에서, 점 $\\mathrm{P}({p},\\ {q})$를 지나지 않는 경로는 모두 몇 가지인가요? " + NUMK,
      ["같은 것이 있는 순열을 이용해 전체 경로 수를 세요. 지나지 않는 경로 = 전체 - 지나는 경로.", "점 $\\mathrm{P}$를 지나는 경로는 (출발점에서 $\\mathrm{P}$까지)×($\\mathrm{P}$에서 도착점까지)로 세요."],
      "전체 경로는 ${tot}$가지입니다. 출발점에서 $\\mathrm{P}$까지는 ${via1}$가지, $\\mathrm{P}$에서 도착점까지는 ${via2}$가지이므로 $\\mathrm{P}$를 지나는 경로는 ${via1}\\times{via2}={via}$가지입니다. 따라서 ${tot}-{via}={ans}$가지입니다."],
    en: ["On the coordinate plane, we move from $(0,\\ 0)$ to $({m},\\ {n})$ using only unit steps to the right or upward. How many shortest paths avoid the point $\\mathrm{P}({p},\\ {q})$? " + NUME,
      ["Count all paths with permutations of repeated items. Avoiding = all - passing through.", "Paths through $\\mathrm{P}$ = (paths from the start to $\\mathrm{P}$) × (paths from $\\mathrm{P}$ to the end)."],
      "All paths: ${tot}$. There are ${via1}$ paths from the start to $\\mathrm{P}$ and ${via2}$ from $\\mathrm{P}$ to the end, so ${via1}\\times{via2}={via}$ paths go through $\\mathrm{P}$. So ${tot}-{via}={ans}$."],
  },
  pst_repCombEq: {
    ko: ["음이 아닌 정수 $x,\\ y,\\ z,\\ w$에 대하여 $x+y+z+w={n}$이고 ${cond}$인 순서쌍 $(x,\\ y,\\ z,\\ w)$의 개수를 구하세요. " + NUMK,
      ["하한이 $0$보다 큰 변수는 하한만큼 빼서 $0$ 이상이 되도록 바꿔 보세요.", "바뀐 방정식은 $x'+y'+z'+w'={m2}$ 꼴이에요."],
      "새 변수를 다음과 같이 정합니다. ${subs}$. (하한이 $0$인 변수가 있으면 그대로 $x'=x$로 봅니다.) 그러면 $x'+y'+z'+w'={m2}$이고 각 변수는 $0$ 이상의 정수입니다. 중복조합 ${}_{4}\\mathrm{H}_{{m2}}=\\binom{{m3}}{{m2}}={ans}$입니다."],
    en: ["For non-negative integers $x,\\ y,\\ z,\\ w$ with $x+y+z+w={n}$ and ${cond}$, count the ordered quadruples $(x,\\ y,\\ z,\\ w)$. " + NUME,
      ["Subtract the lower bound from every variable whose bound is above $0$ so that all variables are at least $0$.", "The new equation has the form $x'+y'+z'+w'={m2}$."],
      "Define new variables: ${subs}$. (A variable with lower bound $0$, if any, is kept as it is: $x'=x$.) Then $x'+y'+z'+w'={m2}$ with non-negative integers. Combinations with repetition: ${}_{4}\\mathrm{H}_{{m2}}=\\binom{{m3}}{{m2}}={ans}$."],
  },
  pst_monotoneSeq: {
    ko: ["집합 $\\{1,\\ 2,\\ \\ldots,\\ {m}\\}$의 원소 $a,\\ b,\\ c,\\ d$에 대하여 $a{r1}b{r2}c{r3}d$를 만족시키는 순서쌍 $(a,\\ b,\\ c,\\ d)$의 개수를 구하세요. " + NUMK,
      ["부등호가 $<$인 곳은 두 수가 반드시 달라야 해요. 그만큼 고를 수 있는 수의 범위를 줄여 보세요.", "$\\le$만 있는 경우 네 수를 고르는 것은 중복조합과 같아요."],
      "$a<b$는 $a+1\\le b$와 같으므로, $<$ 하나마다 뒤의 수에서 $1$씩 빼면 그 부등호가 $\\le$로 바뀝니다. 이 문제에서 부등호 $<$는 ${s}$개이므로 모든 부등호가 $\\le$가 되고 수의 범위는 $1$부터 ${ms}$까지가 됩니다. 이 범위에서 중복을 허락하여 $4$개를 고르는 방법의 수이므로 ${}_{{ms}}\\mathrm{H}_{4}=\\binom{{top}}{4}={ans}$입니다."],
    en: ["For elements $a,\\ b,\\ c,\\ d$ of the set $\\{1,\\ 2,\\ \\ldots,\\ {m}\\}$, how many ordered quadruples $(a,\\ b,\\ c,\\ d)$ satisfy $a{r1}b{r2}c{r3}d$? " + NUME,
      ["Wherever the sign is $<$ the two numbers must differ; shrink the range of available values accordingly.", "With only $\\le$ signs, choosing the four numbers is a combination with repetition."],
      "$a<b$ is the same as $a+1\\le b$, so subtracting $1$ from the later numbers turns each $<$ into $\\le$. Here there are ${s}$ signs $<$, so all signs become $\\le$ and the range becomes $1$ to ${ms}$. Choosing $4$ numbers with repetition from it gives ${}_{{ms}}\\mathrm{H}_{4}=\\binom{{top}}{4}={ans}$."],
  },
  pst_binomCoef2: {
    ko: ["$({ax}{bs})^{{n}}$의 전개식에서 $x^{{k}}$의 계수를 구하세요. " + NUMK,
      ["이항정리의 일반항은 $\\binom{N}{j}A^{N-j}B^{j}$ 꼴이에요.", "$x$가 ${k}$번 곱해지는 항을 찾아요."],
      "$x$를 ${k}$번 택하고 상수항을 ${nk}$번 택하는 항이므로 계수는 $\\binom{{n}}{{k}}\\cdot{a}^{{k}}\\cdot({b})^{{nk}}={ans}$입니다."],
    en: ["Find the coefficient of $x^{{k}}$ in the expansion of $({ax}{bs})^{{n}}$. " + NUME,
      ["The general term of the binomial theorem has the form $\\binom{N}{j}A^{N-j}B^{j}$.", "Find the term in which $x$ is picked exactly ${k}$ times."],
      "The term picks the $x$-part ${k}$ times and the constant ${nk}$ times, so the coefficient is $\\binom{{n}}{{k}}\\cdot{a}^{{k}}\\cdot({b})^{{nk}}={ans}$."],
  },
  pst_binomSumId: {
    ko: ["다음 값을 구하세요. $$\\sum_{k=0}^{{n}}\\binom{{n}}{k}\\,{at}^{k}$$ " + NUMK,
      ["이항정리 $(1+x)^{N}=\\sum_{k=0}^{N}\\binom{N}{k}x^{k}$에서 $x$에 알맞은 수를 넣어 보세요.", "$(1+x)^{N}$이 합과 같아지도록 $x$의 값을 정해 보세요."],
      "이항정리에 $x={a}$를 대입하면 $\\sum_{k=0}^{{n}}\\binom{{n}}{k}{at}^{k}=(1+{at})^{{n}}=({base})^{{n}}={ans}$입니다."],
    en: ["Evaluate $$\\sum_{k=0}^{{n}}\\binom{{n}}{k}\\,{at}^{k}$$ " + NUME,
      ["In $(1+x)^{N}=\\sum_{k=0}^{N}\\binom{N}{k}x^{k}$ substitute a suitable value for $x$.", "Choose $x$ so that the sum becomes $(1+x)^{N}$."],
      "Putting $x={a}$ in the binomial theorem: $\\sum_{k=0}^{{n}}\\binom{{n}}{k}{at}^{k}=(1+{at})^{{n}}=({base})^{{n}}={ans}$."],
  },
  pst_binomUnknown: {
    ko: ["$(x+a)^{{n}}$의 전개식에서 $x^{{k}}$의 계수가 ${V}$일 때, 양수 $a$의 값을 구하세요. " + NUMK,
      ["$x^{{k}}$의 계수를 $a$를 써서 나타내어 보세요.", "$\\binom{{n}}{{k}}={C}$이므로 $a^{{nk}}$의 값을 먼저 구해요."],
      "$x^{{k}}$의 계수는 $\\binom{{n}}{{k}}a^{{nk}}={C}a^{{nk}}$이므로 ${C}a^{{nk}}={V}$, 곧 $a^{{nk}}={q}$입니다. $a>0$이므로 $a={ans}$입니다."],
    en: ["The coefficient of $x^{{k}}$ in the expansion of $(x+a)^{{n}}$ is ${V}$. Find the positive number $a$. " + NUME,
      ["Write the coefficient of $x^{{k}}$ in terms of $a$.", "Since $\\binom{{n}}{{k}}={C}$, first find $a^{{nk}}$."],
      "The coefficient of $x^{{k}}$ is $\\binom{{n}}{{k}}a^{{nk}}={C}a^{{nk}}$, so ${C}a^{{nk}}={V}$ and $a^{{nk}}={q}$. As $a>0$, $a={ans}$."],
  },
  pst_diceSum: {
    ko: ["$1$부터 ${s}$까지의 눈이 하나씩 있는 공정한 주사위 두 개를 동시에 던져 나온 눈의 수를 각각 $a,\\ b$라 할 때, $a+b{rel}{t}$일 확률을 구하세요. " + FRK,
      ["두 주사위를 구별하면 모든 경우의 수는 ${s}\\times{s}$가지예요.", "$a$를 $1$부터 ${s}$까지 바꿔 가며 조건에 맞는 $b$의 개수를 세어 더해요."],
      "모든 경우는 ${tot}$가지이고 조건을 만족시키는 $(a,\\ b)$는 ${cnt}$가지입니다. 따라서 확률은 ${fe}$입니다."],
    en: ["Two fair dice, each with faces $1$ to ${s}$, are thrown together and show $a$ and $b$. Find the probability that $a+b{rel}{t}$. " + FRE,
      ["Treating the dice as distinguishable, there are ${s}\\times{s}$ equally likely outcomes.", "For each $a$ from $1$ to ${s}$ count the values of $b$ that work, then add."],
      "There are ${tot}$ outcomes and ${cnt}$ of them satisfy the condition, so the probability is ${fe}$."],
  },
  pst_diceQuad: {
    ko: ["$1$부터 ${s}$까지의 눈이 하나씩 있는 공정한 주사위를 두 번 던져 나온 눈의 수를 차례로 $a,\\ b$라 할 때, 이차방정식 $x^{2}-{pa}x+{qb}=0$이 서로 다른 두 실근을 가질 확률을 구하세요. " + FRK,
      ["서로 다른 두 실근을 가질 조건은 판별식 $D>0$이에요.", "$D={d1}-4\\times{qb}$이고, $a$를 하나씩 정하며 조건에 맞는 $b$를 세어요."],
      "판별식 $D={d1}-4\\times{qb}>0$을 만족시키는 $(a,\\ b)$는 ${cnt}$가지이고 전체는 ${tot}$가지이므로 확률은 ${fe}$입니다."],
    en: ["A fair die with faces $1$ to ${s}$ is thrown twice, giving $a$ then $b$. Find the probability that the quadratic equation $x^{2}-{pa}x+{qb}=0$ has two distinct real roots. " + FRE,
      ["Two distinct real roots means the discriminant $D>0$.", "$D={d1}-4\\times{qb}$; fix $a$ and count the values of $b$ that work."],
      "The pairs $(a,\\ b)$ with $D={d1}-4\\times{qb}>0$ number ${cnt}$ out of ${tot}$, so the probability is ${fe}$."],
  },
  pst_atLeast: {
    ko: ["흰 공 ${w}$개와 검은 공 ${bk}$개가 들어 있는 주머니에서 ${k}$개의 공을 동시에 꺼낼 때, 흰 공이 ${r}$개 이상 나올 확률을 구하세요. " + FRK,
      ["'${r}$개 이상'의 여사건은 흰 공의 개수가 ${zs}$인 경우예요.", "꺼내는 방법의 전체 수는 $\\binom{{nn}}{{k}}={tot}$이에요."],
      "여사건은 흰 공의 개수가 ${zs}$인 경우이고 그 경우의 수는 ${bx}={bad}$입니다. 전체는 $\\binom{{nn}}{{k}}={tot}$이므로 구하는 확률은 $1-\\frac{{bad}}{{tot}}={fr}$입니다."],
    en: ["A bag holds ${w}$ white balls and ${bk}$ black balls. When ${k}$ balls are drawn at the same time, find the probability that at least ${r}$ of them are white. " + FRE,
      ["The complement of 'at least ${r}$ white' is 'the number of white balls is ${zs}$'.", "The total number of ways to draw is $\\binom{{nn}}{{k}}={tot}$."],
      "The complement is 'the number of white balls is ${zs}$', which has ${bx}={bad}$ ways. The total is $\\binom{{nn}}{{k}}={tot}$, so the probability is $1-\\frac{{bad}}{{tot}}={fr}$."],
  },
  pst_lineUp: {
    ko: ["남학생 ${m}$명과 여학생 ${w}$명이 일렬로 설 때, 여학생끼리는 어느 두 명도 서로 이웃하지 않을 확률을 구하세요. " + FRK,
      ["같은 성별끼리는 구별하지 않고 성별의 배열만 생각해도 확률은 같아요. 남학생을 먼저 세워 두고, 그 사이사이와 양 끝에 여학생이 서는 경우를 생각해요.", "여학생이 설 수 있는 자리는 ${m1}$곳이에요."],
      "성별 배열의 전체 수는 $\\binom{{nn}}{{w}}={tot}$입니다. 남학생 사이와 양 끝의 ${m1}$곳 중 ${w}$곳을 골라 여학생을 세우면 이웃하지 않으므로 $\\binom{{m1}}{{w}}={good}$가지입니다. 확률은 ${fe}$입니다."],
    en: ["${m}$ boys and ${w}$ girls stand in a line. Find the probability that no two girls stand next to each other. " + FRE,
      ["Counting only the pattern of genders (not who is who) gives the same probability. Place the boys first; the girls go into the gaps between them or at the ends.", "There are ${m1}$ possible places for the girls."],
      "The total number of gender patterns is $\\binom{{nn}}{{w}}={tot}$. Choosing ${w}$ of the ${m1}$ gaps (between boys or at the ends) keeps girls apart: $\\binom{{m1}}{{w}}={good}$. Probability ${fe}$."],
  },
  pst_multiplesUnion: {
    ko: ["$1$부터 ${N}$까지의 자연수가 하나씩 적힌 ${N}$장의 카드 중에서 한 장을 임의로 뽑을 때, 카드에 적힌 수가 ${p}$의 배수이거나 ${q}$의 배수일 확률을 구하세요. " + FRK,
      ["${p}$의 배수의 개수와 ${q}$의 배수의 개수를 먼저 구해요. 둘 다의 배수는 두 수의 최소공배수의 배수예요.", "합집합의 원소의 개수 = (합) - (교집합)."],
      "${p}$의 배수는 ${np}$개, ${q}$의 배수는 ${nq}$개, 최소공배수 ${l}$의 배수는 ${nl}$개입니다. 따라서 ${np}+{nq}-{nl}={cnt}$이고 확률은 ${fe}$입니다."],
    en: ["One card is drawn at random from ${N}$ cards numbered $1$ to ${N}$. Find the probability that the number is a multiple of ${p}$ or a multiple of ${q}$. " + FRE,
      ["Count the multiples of ${p}$ and of ${q}$ first. Multiples of both are multiples of the least common multiple.", "|union| = (sum) - |intersection|."],
      "There are ${np}$ multiples of ${p}$, ${nq}$ of ${q}$ and ${nl}$ multiples of the lcm ${l}$. So ${np}+{nq}-{nl}={cnt}$ and the probability is ${fe}$."],
  },
  pst_deMorgan: {
    ko: ["두 사건 $A,\\ B$에 대하여 ${gv}$일 때, $P({ev})$의 값을 구하세요. " + DECK,
      ["벤 다이어그램을 그려 $A\\cap B$, $A\\cap B^{c}$, $A^{c}\\cap B$, $A^{c}\\cap B^{c}$ 네 영역으로 나누어요.", "$P(A\\cap B^{c})=P(A)-P(A\\cap B)$, $P(A^{c}\\cap B)=P(B)-P(A\\cap B)$예요. 드모르간 법칙 $(A\\cup B)^{c}=A^{c}\\cap B^{c}$, $(A\\cap B)^{c}=A^{c}\\cup B^{c}$과 $P(E^{c})=1-P(E)$를 써도 돼요."],
      "$P(A\\cap B)$는 ${der}$입니다. 네 영역의 확률은 $P(A\\cap B)={pab}$, $P(A\\cap B^{c})={ao}$, $P(A^{c}\\cap B)={bo}$, $P(A^{c}\\cap B^{c})={ne}$이고 합은 $1$입니다. $P({ev})$는 해당하는 영역의 합이므로 ${sumx}$입니다."],
    en: ["For events $A,\\ B$ with ${gv}$, find $P({ev})$. " + DECE,
      ["Draw a Venn diagram and split it into the four regions $A\\cap B$, $A\\cap B^{c}$, $A^{c}\\cap B$, $A^{c}\\cap B^{c}$.", "$P(A\\cap B^{c})=P(A)-P(A\\cap B)$ and $P(A^{c}\\cap B)=P(B)-P(A\\cap B)$. You may also use De Morgan's laws $(A\\cup B)^{c}=A^{c}\\cap B^{c}$, $(A\\cap B)^{c}=A^{c}\\cup B^{c}$ and $P(E^{c})=1-P(E)$."],
      "$P(A\\cap B)$ is ${der}$. The four regions have probabilities $P(A\\cap B)={pab}$, $P(A\\cap B^{c})={ao}$, $P(A^{c}\\cap B)={bo}$, $P(A^{c}\\cap B^{c})={ne}$, adding up to $1$. $P({ev})$ is the sum of the regions it contains: ${sumx}$."],
  },
  pst_condTable: {
    ko: ["어느 동아리의 학생 ${N}$명 중 남학생은 ${m}$명이고, 안경을 쓴 학생은 ${g}$명이며, 안경을 쓴 남학생은 ${x}$명입니다. 이 동아리에서 임의로 뽑은 한 명이 안경을 쓰지 않았을 때, 그 학생이 여학생일 확률을 구하세요. " + FRK,
      ["표를 만들어 남/여, 안경 씀/안 씀의 네 칸 인원을 채워 보세요.", "조건부확률 $P(B\\mid A)=\\frac{n(A\\cap B)}{n(A)}$에서 $A$는 '안경을 쓰지 않음'이에요."],
      "여학생은 ${f}$명이고 안경을 쓴 여학생은 ${g}-{x}={gy}$명이므로 안경을 쓰지 않은 여학생은 ${f}-{gy}={fn}$명입니다. 안경을 쓰지 않은 학생은 ${N}-{g}={ng}$명이므로 확률은 ${fe}$입니다."],
    en: ["A club has ${N}$ students: ${m}$ boys, ${g}$ students wearing glasses, and ${x}$ boys wearing glasses. A student chosen at random is found not to wear glasses. Find the probability that this student is a girl. " + FRE,
      ["Make a 2×2 table of boy/girl and glasses/no glasses and fill in all four cells.", "In $P(B\\mid A)=\\frac{n(A\\cap B)}{n(A)}$ the condition $A$ is 'no glasses'."],
      "There are ${f}$ girls, of whom ${g}-{x}={gy}$ wear glasses, so ${f}-{gy}={fn}$ girls do not. Students without glasses: ${N}-{g}={ng}$. The probability is ${fe}$."],
  },
  pst_condDice: {
    ko: ["서로 구별되는 공정한 주사위 두 개를 동시에 던져 나온 눈의 수를 각각 $a,\\ b$라 하자. 사건 $A$를 '$a+b{rel}{t}$', 사건 $B$를 '$a{relb}b$'라 할 때, 조건부확률 $P(B\\mid A)$를 구하세요. " + FRK,
      ["사건 $A$에 속하는 경우를 먼저 모두 찾으세요.", "$P(B\\mid A)=\\frac{n(A\\cap B)}{n(A)}$예요."],
      "사건 $A$의 경우의 수는 ${nA}$, $A\\cap B$의 경우의 수는 ${nAB}$입니다. 따라서 $P(B\\mid A)={fe}$입니다."],
    en: ["Two distinguishable fair dice are thrown together, showing $a$ and $b$. Let $A$ be the event '$a+b{rel}{t}$' and $B$ the event '$a{relb}b$'. Find the conditional probability $P(B\\mid A)$. " + FRE,
      ["First list all outcomes belonging to $A$.", "$P(B\\mid A)=\\frac{n(A\\cap B)}{n(A)}$."],
      "$n(A)={nA}$ and $n(A\\cap B)={nAB}$, so $P(B\\mid A)={fe}$."],
  },
  pst_indepUnknown: {
    ko: ["두 사건 $A,\\ B$가 서로 독립이고 $P(A)={fa}$, $P(A\\cup B)={fu}$일 때, $P(B)$의 값을 구하세요. " + FRK,
      ["독립이면 $P(A\\cap B)=P(A)P(B)$예요.", "덧셈정리 $P(A\\cup B)=P(A)+P(B)-P(A)P(B)$를 $P(B)$에 대한 식으로 정리해요."],
      "독립이므로 $P(A\\cup B)=P(A)+P(B)-P(A)P(B)$, 곧 $P(B)\\{1-P(A)\\}=P(A\\cup B)-P(A)$입니다. $1-{fa}={d1}$, ${fu}-{fa}={d2}$이므로 $P(B)={d2}\\div{d1}={fr}$입니다."],
    en: ["Events $A$ and $B$ are independent, with $P(A)={fa}$ and $P(A\\cup B)={fu}$. Find $P(B)$. " + FRE,
      ["Independence means $P(A\\cap B)=P(A)P(B)$.", "Rewrite the addition rule $P(A\\cup B)=P(A)+P(B)-P(A)P(B)$ as an equation for $P(B)$."],
      "By independence $P(A\\cup B)=P(A)+P(B)-P(A)P(B)$, i.e. $P(B)\\{1-P(A)\\}=P(A\\cup B)-P(A)$. Here $1-{fa}={d1}$ and ${fu}-{fa}={d2}$, so $P(B)={d2}\\div{d1}={fr}$."],
  },
  pst_indepFindN: {
    ko: ["$1$부터 $n$까지의 자연수가 하나씩 적힌 $n$장의 카드에서 한 장을 임의로 뽑을 때, 사건 $A$를 '카드의 수가 ${p}$의 배수', 사건 $B$를 '카드의 수가 ${q}$의 배수'라 하자. $2\\le n\\le {M}$인 자연수 $n$ 중에서 두 사건 $A,\\ B$가 서로 독립이 되도록 하는 가장 큰 $n$의 값을 구하세요. " + NUMK,
      ["독립이면 $P(A\\cap B)=P(A)P(B)$이고, $A\\cap B$는 ${l}$의 배수예요. ${p}$의 배수가 $a$개, ${q}$의 배수가 $b$개, ${l}$의 배수가 $c$개이면 독립일 조건은 $ab=cn$이에요.", "$n$이 ${l}$의 배수이면 어떻게 되는지 확인해 보세요."],
      "$n={l}t$ ($t$는 자연수)이면 $P(A)=\\frac{1}{{p}}$, $P(B)=\\frac{1}{{q}}$, $P(A\\cap B)=\\frac{1}{{l}}$이므로 독립입니다. ${M}$ 이하에서 ${l}$의 배수 중 가장 큰 수는 ${ans}$입니다. 이보다 큰 $n$은 ${p}$의 배수가 $a$개, ${q}$의 배수가 $b$개, ${l}$의 배수가 $c$개일 때 독립 조건 $\\frac{c}{n}=\\frac{a}{n}\\cdot\\frac{b}{n}$, 곧 $ab=cn$이 성립하는지 확인합니다. ${chk}$이므로 독립이 아닙니다. 따라서 ${ans}$입니다."],
    en: ["One card is drawn at random from $n$ cards numbered $1$ to $n$. Let $A$ be 'the number is a multiple of ${p}$' and $B$ 'the number is a multiple of ${q}$'. Among the integers $n$ with $2\\le n\\le {M}$, find the largest $n$ for which $A$ and $B$ are independent. " + NUME,
      ["Independence means $P(A\\cap B)=P(A)P(B)$, and $A\\cap B$ is the set of multiples of ${l}$. If there are $a$ multiples of ${p}$, $b$ of ${q}$ and $c$ of ${l}$, independence means $ab=cn$.", "Check what happens when $n$ is a multiple of ${l}$."],
      "If $n={l}t$ ($t$ a positive integer) then $P(A)=\\frac{1}{{p}}$, $P(B)=\\frac{1}{{q}}$, $P(A\\cap B)=\\frac{1}{{l}}$, so they are independent. The largest multiple of ${l}$ up to ${M}$ is ${ans}$. For the larger $n$, let $a,\\ b,\\ c$ be the numbers of multiples of ${p}$, ${q}$, ${l}$; independence needs $\\frac{c}{n}=\\frac{a}{n}\\cdot\\frac{b}{n}$, i.e. $ab=cn$. Checking: ${chk}$, so they are not independent. The answer is ${ans}$."],
  },
  pst_urnChain: {
    ko: ["흰 공 ${w}$개와 검은 공 ${bk}$개가 들어 있는 주머니에서 공을 한 개씩 차례로 꺼내고, 꺼낸 공은 다시 넣지 않는다. 처음 ${r}$번은 연속하여 흰 공이 나오고 ${r1}$번째에 검은 공이 나올 확률을 구하세요. " + FRK,
      ["확률의 곱셈정리: 각 단계에서 남은 공의 수가 바뀌어요.", "첫 번째에 흰 공일 확률은 $\\frac{{w}}{{nn}}$이에요."],
      "각 단계의 (조건부) 확률을 곱하면 ${prod}={fe}$입니다."],
    en: ["A bag holds ${w}$ white and ${bk}$ black balls. Balls are drawn one at a time without replacement. Find the probability that the first ${r}$ draws are all white and draw number ${r1}$ is black. " + FRE,
      ["Multiplication rule: the number of balls left changes at every step.", "The probability that the first ball is white is $\\frac{{w}}{{nn}}$."],
      "Multiplying the conditional probabilities of each step: ${prod}={fe}$."],
  },
  pst_totalProb: {
    ko: ["공정한 주사위를 한 번 던져 ${t}$ 이하의 눈이 나오면 상자 A에서, 그렇지 않으면 상자 B에서 공 한 개를 꺼낸다. 상자 A에는 흰 공 ${w1}$개와 검은 공 ${b1}$개, 상자 B에는 흰 공 ${w2}$개와 검은 공 ${b2}$개가 들어 있다. 꺼낸 공이 흰 공일 확률을 구하세요. " + FRK,
      ["꺼낸 공이 흰 공이 되는 경우는 'A에서 흰 공' 또는 'B에서 흰 공'으로 나뉘어요.", "각각 (상자를 고를 확률)×(그 상자에서 흰 공일 확률)로 구해요."],
      "A에서 흰 공: $\\frac{{t}}{6}\\times{pw1}={tA}$, B에서 흰 공: $\\frac{{t6c}}{6}\\times{pw2}={tB}$ (여기서 $\\frac{{t6c}}{6}$는 B를 고를 확률). 두 값을 더한 $\\frac{{t}}{6}\\times{pw1}+\\frac{{t6c}}{6}\\times{pw2}={fr}$입니다."],
    en: ["A fair die is thrown once. If the result is at most ${t}$, a ball is drawn from box A, otherwise from box B. Box A holds ${w1}$ white and ${b1}$ black balls; box B holds ${w2}$ white and ${b2}$ black balls. Find the probability that the ball drawn is white. " + FRE,
      ["A white ball comes either from A or from B.", "Each part is (probability of choosing the box) × (probability of white in that box)."],
      "White from A: $\\frac{{t}}{6}\\times{pw1}={tA}$; white from B: $\\frac{{t6c}}{6}\\times{pw2}={tB}$ (where $\\frac{{t6c}}{6}$ is the probability of choosing B). The sum is ${fr}$."],
  },
  pst_bayes: {
    ko: ["공정한 주사위를 한 번 던져 ${t}$ 이하의 눈이 나오면 상자 A에서, 그렇지 않으면 상자 B에서 공 한 개를 꺼낸다. 상자 A에는 흰 공 ${w1}$개와 검은 공 ${b1}$개, 상자 B에는 흰 공 ${w2}$개와 검은 공 ${b2}$개가 들어 있다. 꺼낸 공이 흰 공이었을 때, 그 공이 상자 A에서 나왔을 확률을 구하세요. " + FRK,
      ["$P(A\\mid \\text{흰 공})=\\frac{P(A\\cap \\text{흰 공})}{P(\\text{흰 공})}$예요.", "분모는 A에서 흰 공일 확률과 B에서 흰 공일 확률의 합이에요."],
      "A에서 흰 공일 확률은 ${tA}$, B에서 흰 공일 확률은 ${tB}$이므로 구하는 확률은 $\\frac{{tA}}{{tA}+{tB}}={fr}$입니다."],
    en: ["A fair die is thrown once. If the result is at most ${t}$, a ball is drawn from box A, otherwise from box B. Box A holds ${w1}$ white and ${b1}$ black balls; box B holds ${w2}$ white and ${b2}$ black balls. Given that the ball drawn is white, find the probability that it came from box A. " + FRE,
      ["$P(A\\mid \\text{white ball})=\\frac{P(A\\cap \\text{white ball})}{P(\\text{white ball})}$.", "The denominator is P(white from A) + P(white from B)."],
      "P(white from A) = ${tA}$ and P(white from B) = ${tB}$, so the probability is $\\frac{{tA}}{{tA}+{tB}}={fr}$."],
  },
  pst_expectTable: {
    ko: ["확률변수 $X$가 가질 수 있는 값은 $1,\\ 2,\\ \\ldots,\\ {n}$이고 $P(X=x)=k(x+{c})$ ($x=1,\\ 2,\\ \\ldots,\\ {n}$)일 때, $X$의 평균 $E(X)$의 값을 구하세요. (단, $k$는 상수이다.) " + FRK,
      ["확률의 총합이 $1$이라는 조건으로 $k$를 먼저 구해요.", "$E(X)=\\sum x\\,P(X=x)$예요."],
      "확률의 총합이 $1$이므로 $k({t1})={S1}k=1$, 곧 $k=\\frac{1}{{S1}}$입니다. $E(X)=\\frac{1}{{S1}}({t2})=\\frac{1}{{S1}}\\times{S2}={fe}$입니다."],
    en: ["A random variable $X$ takes the values $1,\\ 2,\\ \\ldots,\\ {n}$ with $P(X=x)=k(x+{c})$ for $x=1,\\ 2,\\ \\ldots,\\ {n}$ ($k$ is a constant). Find the mean $E(X)$. " + FRE,
      ["Use the fact that the probabilities add up to $1$ to find $k$ first.", "$E(X)=\\sum x\\,P(X=x)$."],
      "The probabilities sum to $1$: $k({t1})={S1}k=1$, so $k=\\frac{1}{{S1}}$. Then $E(X)=\\frac{1}{{S1}}({t2})=\\frac{1}{{S1}}\\times{S2}={fe}$."],
  },
  pst_varTable: {
    ko: ["확률변수 $X$의 확률분포가 $P(X={x1})=\\frac{{a1}}{{d}}$, $P(X={x2})=\\frac{{a2}}{{d}}$, $P(X={x3})=\\frac{{a3}}{{d}}$일 때, 분산 $V(X)$의 값을 구하세요. " + FRK,
      ["먼저 $E(X)$와 $E(X^{2})$를 구해요.", "$V(X)=E(X^{2})-\\{E(X)\\}^{2}$예요."],
      "$E(X)={fE}$, $E(X^{2})={f2}$이므로 $V(X)=E(X^{2})-\\{E(X)\\}^{2}={fr}$입니다."],
    en: ["A random variable $X$ has $P(X={x1})=\\frac{{a1}}{{d}}$, $P(X={x2})=\\frac{{a2}}{{d}}$, $P(X={x3})=\\frac{{a3}}{{d}}$. Find the variance $V(X)$. " + FRE,
      ["First find $E(X)$ and $E(X^{2})$.", "$V(X)=E(X^{2})-\\{E(X)\\}^{2}$."],
      "$E(X)={fE}$ and $E(X^{2})={f2}$, so $V(X)=E(X^{2})-\\{E(X)\\}^{2}={fr}$."],
  },
  pst_linTransform: {
    ko: ["확률변수 $X$의 평균이 ${m}$, 표준편차가 ${s}$일 때, 확률변수 $Y={ya}$에 대하여 $E(Y^{2})$의 값을 구하세요. " + NUMK,
      ["$E(Y)=aE(X)+b$, $V(Y)=a^{2}V(X)$를 이용해요.", "$E(Y^{2})=V(Y)+\\{E(Y)\\}^{2}$예요."],
      "$E(Y)={eE}={em}$, $V(Y)=({a})^{2}\\times{s}^{2}={vy}$입니다. 따라서 $E(Y^{2})=V(Y)+\\{E(Y)\\}^{2}={vy}+({em})^{2}={ans}$입니다."],
    en: ["A random variable $X$ has mean ${m}$ and standard deviation ${s}$. For $Y={ya}$, find $E(Y^{2})$. " + NUME,
      ["Use $E(Y)=aE(X)+b$ and $V(Y)=a^{2}V(X)$.", "$E(Y^{2})=V(Y)+\\{E(Y)\\}^{2}$."],
      "$E(Y)={eE}={em}$ and $V(Y)=({a})^{2}\\times{s}^{2}={vy}$. Hence $E(Y^{2})=V(Y)+\\{E(Y)\\}^{2}={vy}+({em})^{2}={ans}$."],
  },
  pst_binomFindN: {
    ko: ["확률변수 $X$가 이항분포 $B(n,\\ p)$를 따르고 $E(X)={mu}$, $V(X)={vr}$일 때, $n$의 값을 구하세요. " + NUMK,
      ["$E(X)=np$, $V(X)=np(1-p)$예요.", "$V(X)$를 $E(X)$로 나누면 $1-p$를 얻어요."],
      "$\\frac{V(X)}{E(X)}=1-p$이므로 $1-p={q}$, 곧 $p={pp}$입니다. $np={mu}$에서 $n={ans}$입니다."],
    en: ["A random variable $X$ follows the binomial distribution $B(n,\\ p)$ with $E(X)={mu}$ and $V(X)={vr}$. Find $n$. " + NUME,
      ["$E(X)=np$ and $V(X)=np(1-p)$.", "Dividing $V(X)$ by $E(X)$ gives $1-p$."],
      "$\\frac{V(X)}{E(X)}=1-p$, so $1-p={q}$ and $p={pp}$. From $np={mu}$ we get $n={ans}$."],
  },
  pst_binomTail: {
    ko: ["확률변수 $X$가 이항분포 $B({n},\\ {pf})$를 따를 때, $P(X{rel}{t})$의 값을 구하세요. " + FRK,
      ["$P(X=j)=\\binom{N}{j}p^{j}(1-p)^{N-j}$ ($N$은 시행 횟수)예요. 더할 항이 많으면 여사건을 생각해 보세요.", "$j=$ ${js}$인 항을 더하면 돼요."],
      "$P(X=j)=\\binom{{n}}{j}\\left({pf}\\right)^{j}\\left(1-{pf}\\right)^{{n}-j}$이고, 구하는 확률은 $j={js}$일 때의 값을 모두 더한 $\\frac{{tm}}{{D}}=\\frac{{num}}{{D}}={fe}$입니다."],
    en: ["A random variable $X$ follows the binomial distribution $B({n},\\ {pf})$. Find $P(X{rel}{t})$. " + FRE,
      ["$P(X=j)=\\binom{N}{j}p^{j}(1-p)^{N-j}$ ($N$ = number of trials). If there are many terms to add, think of the complement.", "Add the terms for $j=$ ${js}$."],
      "$P(X=j)=\\binom{{n}}{j}\\left({pf}\\right)^{j}\\left(1-{pf}\\right)^{{n}-j}$, and the required probability is the sum of these for $j={js}$, namely $\\frac{{tm}}{{D}}=\\frac{{num}}{{D}}={fe}$."],
  },
  pst_binomPmfEq: {
    ko: ["확률변수 $X$가 이항분포 $B({n},\\ p)$를 따르고 $P(X={r})=P(X={r1})$일 때, $p$의 값을 구하세요. (단, $0<p<1$) " + FRK,
      ["두 확률을 $\\binom{N}{j}p^{j}(1-p)^{N-j}$ 꼴로 쓰고 양변을 공통인수로 나누어요.", "정리하면 $\\frac{p}{1-p}$의 값을 얻어요."],
      "$\\binom{{n}}{{r}}p^{{r}}(1-p)^{{nr}}=\\binom{{n}}{{r1}}p^{{r1}}(1-p)^{{nr1}}$에서 $\\binom{{n}}{{r}}(1-p)=\\binom{{n}}{{r1}}p$, 곧 $\\frac{p}{1-p}=\\frac{{r1}}{{nr}}$입니다. 따라서 $p={fe}$입니다."],
    en: ["A random variable $X$ follows $B({n},\\ p)$ and $P(X={r})=P(X={r1})$. Find $p$ (with $0<p<1$). " + FRE,
      ["Write both probabilities as $\\binom{N}{j}p^{j}(1-p)^{N-j}$ and cancel the common factors.", "You obtain the value of $\\frac{p}{1-p}$."],
      "From $\\binom{{n}}{{r}}p^{{r}}(1-p)^{{nr}}=\\binom{{n}}{{r1}}p^{{r1}}(1-p)^{{nr1}}$ we get $\\binom{{n}}{{r}}(1-p)=\\binom{{n}}{{r1}}p$, i.e. $\\frac{p}{1-p}=\\frac{{r1}}{{nr}}$. Hence $p={fe}$."],
  },
  pst_bestOf: {
    ko: ["두 팀 A, B가 경기를 하여 먼저 ${w}$승을 거두는 팀이 우승한다. 각 경기에서 A팀이 이길 확률은 ${fp}$이고, 각 경기는 서로 독립이며 비기는 경기는 없다. A팀이 우승할 확률을 구하세요. " + FRK,
      ["A팀이 ${w}$번째 승리를 거두는 경기가 몇 번째인지로 나누어 생각해요.", "${w}+j$번째 경기에서 우승하려면 그 전 ${wm1}+j$경기 중 ${wm1}$승 $j$패여야 해요."],
      "A팀이 ${w}+j$번째 경기($j={jr}$)에서 우승할 확률은 $\\binom{{wm1}+j}{j}\\left({fp}\\right)^{{w}}\\left(1-{fp}\\right)^{j}$입니다. 이 값은 차례로 ${tm}$이므로 모두 더하면 ${fr}$입니다."],
    en: ["Teams A and B play until one of them has won ${w}$ games, and that team is the champion. A wins each game with probability ${fp}$, games are independent and there are no draws. Find the probability that A becomes champion. " + FRE,
      ["Split by the game in which A gets its ${w}$-th win.", "To win in game ${w}+j$, A must have ${wm1}$ wins and $j$ losses in the previous ${wm1}+j$ games."],
      "A wins the series in game ${w}+j$ ($j={jr}$) with probability $\\binom{{wm1}+j}{j}\\left({fp}\\right)^{{w}}\\left(1-{fp}\\right)^{j}$. These are, in order, ${tm}$, and their sum is ${fr}$."],
  },
  pst_normalBetween: {
    ko: ["확률변수 $X$가 정규분포 $N({m},\\ {s}^{2})$을 따를 때, $P({a}\\le X\\le {b})$의 값을 구하세요. " + TABK + " " + DEC4K,
      ["$Z=\\frac{X-m}{\\sigma}$로 표준화해서 $P(z_1\\le Z\\le z_2)$ 꼴로 바꾸어요.", "표준정규분포의 그래프는 $Z=0$에 대하여 대칭이에요."],
      "$Z=\\frac{X-{m}}{{s}}$로 표준화하면 $\\frac{{a}-{m}}{{s}}={z1}$, $\\frac{{b}-{m}}{{s}}={z2}$이므로 $P({z1}\\le Z\\le {z2})={expr}$입니다."],
    en: ["A random variable $X$ follows the normal distribution $N({m},\\ {s}^{2})$. Find $P({a}\\le X\\le {b})$. " + TABE + " " + DEC4E,
      ["Standardize with $Z=\\frac{X-m}{\\sigma}$ to get $P(z_1\\le Z\\le z_2)$.", "The standard normal curve is symmetric about $Z=0$."],
      "Standardizing with $Z=\\frac{X-{m}}{{s}}$: $\\frac{{a}-{m}}{{s}}={z1}$ and $\\frac{{b}-{m}}{{s}}={z2}$, so $P({z1}\\le Z\\le {z2})={expr}$."],
  },
  pst_normalFindParam: {
    ko: ["확률변수 $X$가 정규분포 $N(m,\\ {s}^{2})$을 따르고 $P(X\\ge {c})={pv}$일 때, 상수 $m$의 값을 구하세요. " + TABK + " " + NUMK,
      ["$P(X\\ge {c})$를 $Z$에 대한 확률로 바꾸고 $0.5$와 비교해 보세요.", "표에서 $P(0\\le Z\\le z_0)$의 값에 해당하는 $z_0$를 찾아요."],
      "$P(X\\ge {c})=P\\left(Z\\ge \\frac{{c}-m}{{s}}\\right)={pv}$입니다. 표에서 $P(0\\le Z\\le |z_0|)=|{pv}-0.5|={tv}$이므로 $|z_0|={az}$입니다. ${cmp}$이므로 ${zsg}$이고, $\\frac{{c}-m}{{s}}={zz}$입니다. 따라서 $m={ans}$입니다."],
    en: ["A random variable $X$ follows the normal distribution $N(m,\\ {s}^{2})$ and $P(X\\ge {c})={pv}$. Find the constant $m$. " + TABE + " " + NUME,
      ["Turn $P(X\\ge {c})$ into a probability for $Z$ and compare it with $0.5$.", "Find $z_0$ from the table value of $P(0\\le Z\\le z_0)$."],
      "$P(X\\ge {c})=P\\left(Z\\ge \\frac{{c}-m}{{s}}\\right)={pv}$. From the table $P(0\\le Z\\le |z_0|)=|{pv}-0.5|={tv}$, so $|z_0|={az}$. Since ${cmp}$, ${zsg}$, so $\\frac{{c}-m}{{s}}={zz}$. Hence $m={ans}$."],
  },
  pst_normalSymmetric: {
    ko: ["확률변수 $X$가 정규분포 $N({m},\\ {s}^{2})$을 따르고 $P(X\\le {L})=P(X\\ge {R})$일 때, 상수 $k$의 값을 구하세요. " + NUMK,
      ["정규분포 곡선은 평균 $m$에 대하여 대칭이에요.", "두 값이 평균에서 같은 거리만큼 반대쪽에 있어요. 즉 두 값의 합이 $2m$이에요."],
      "정규분포 곡선이 $x={m}$에 대하여 대칭이므로 $({L})+({R})=2\\times{m}$입니다. 정리하면 ${A}k+({BD})={m2}$이므로 $k={ans}$입니다."],
    en: ["A random variable $X$ follows $N({m},\\ {s}^{2})$ and $P(X\\le {L})=P(X\\ge {R})$. Find the constant $k$. " + NUME,
      ["The normal curve is symmetric about the mean $m$.", "The two values lie at equal distances on opposite sides of the mean, so they add up to $2m$."],
      "The curve is symmetric about $x={m}$, so $({L})+({R})=2\\times{m}$. This simplifies to ${A}k+({BD})={m2}$, giving $k={ans}$."],
  },
  pst_binomNormal: {
    ko: ["확률변수 $X$가 이항분포 $B({n},\\ {pf})$를 따른다. $X$를 정규분포로 근사하여(연속성 보정은 하지 않는다) $P({ev})$의 값을 구하세요. " + TABK + " " + DEC4K,
      ["이항분포 $B(n,\\ p)$는 $n$이 클 때 $N(np,\\ np(1-p))$로 근사할 수 있어요.", "(평균, 표준편차)=$({mu},\\ {sg})$로 표준화해요."],
      "$E(X)={mu}$, $\\sigma(X)=\\sqrt{{vr}}={sg}$이므로 $X$는 근사적으로 $N({mu},\\ {sg}^{2})$을 따릅니다. $Z=\\frac{X-{mu}}{{sg}}$로 표준화하면 ${zs}$이므로 $P({ev})\\approx P({zev})={expr}$입니다."],
    en: ["A random variable $X$ follows the binomial distribution $B({n},\\ {pf})$. Approximate $X$ by a normal distribution (no continuity correction) and find $P({ev})$. " + TABE + " " + DEC4E,
      ["For large $n$, $B(n,\\ p)$ is approximated by $N(np,\\ np(1-p))$.", "Standardize using the mean ${mu}$ and standard deviation ${sg}$."],
      "$E(X)={mu}$ and $\\sigma(X)=\\sqrt{{vr}}={sg}$, so $X$ is approximately $N({mu},\\ {sg}^{2})$. With $Z=\\frac{X-{mu}}{{sg}}$ we get ${zs}$, so $P({ev})\\approx P({zev})={expr}$."],
  },
  pst_sampleSd: {
    ko: ["모평균이 ${m}$, 모분산이 ${v}$인 모집단에서 크기가 ${n}$인 표본을 임의추출하여 구한 표본평균을 $\\overline{X}$라 할 때, $E(\\overline{X}^{2})$의 값을 구하세요. " + DECK,
      ["표본평균의 평균은 $E(\\overline{X})=m$, 분산은 $V(\\overline{X})=\\frac{\\sigma^{2}}{{n}}$이에요.", "$E(\\overline{X}^{2})=V(\\overline{X})+\\{E(\\overline{X})\\}^{2}$예요."],
      "$E(\\overline{X})={m}$, $V(\\overline{X})=\\frac{{v}}{{n}}={vx}$이므로 $E(\\overline{X}^{2})={vx}+{m}^{2}={ans}$입니다."],
    en: ["A population has mean ${m}$ and variance ${v}$. A random sample of size ${n}$ is taken and its sample mean is $\\overline{X}$. Find $E(\\overline{X}^{2})$. " + DECE,
      ["$E(\\overline{X})=m$ and $V(\\overline{X})=\\frac{\\sigma^{2}}{{n}}$.", "$E(\\overline{X}^{2})=V(\\overline{X})+\\{E(\\overline{X})\\}^{2}$."],
      "$E(\\overline{X})={m}$ and $V(\\overline{X})=\\frac{{v}}{{n}}={vx}$, so $E(\\overline{X}^{2})={vx}+{m}^{2}={ans}$."],
  },
  pst_sampleMeanNormal: {
    ko: ["모평균이 ${m}$, 모표준편차가 ${s}$인 정규분포를 따르는 모집단에서 크기가 ${n}$인 표본을 임의추출하여 구한 표본평균을 $\\overline{X}$라 할 때, $P({ev})$의 값을 구하세요. " + TABK + " " + DEC4K,
      ["표본평균 $\\overline{X}$는 정규분포 $N\\left(m,\\ \\left(\\frac{\\sigma}{\\sqrt{{n}}}\\right)^{2}\\right)$을 따라요.", "표준화에 쓸 표준편차는 다음과 같이 구해요. $\\frac{\\sigma}{\\sqrt{{n}}}={h}$"],
      "$\\overline{X}$는 정규분포 $N({m},\\ {h}^{2})$을 따릅니다 ($\\frac{{s}}{\\sqrt{{n}}}={h}$). $Z=\\frac{\\overline{X}-{m}}{{h}}$로 표준화하면 ${zs}$이므로 $P({ev})=P({zev})={expr}$입니다."],
    en: ["A normal population has mean ${m}$ and standard deviation ${s}$. A random sample of size ${n}$ is taken, with sample mean $\\overline{X}$. Find $P({ev})$. " + TABE + " " + DEC4E,
      ["$\\overline{X}$ follows $N\\left(m,\\ \\left(\\frac{\\sigma}{\\sqrt{{n}}}\\right)^{2}\\right)$.", "Standardize using the standard deviation $\\frac{\\sigma}{\\sqrt{{n}}}={h}$."],
      "$\\overline{X}$ follows $N({m},\\ {h}^{2})$ (since $\\frac{{s}}{\\sqrt{{n}}}={h}$). With $Z=\\frac{\\overline{X}-{m}}{{h}}$: ${zs}$, so $P({ev})=P({zev})={expr}$."],
  },
  pst_sampleMeanDist: {
    ko: ["주머니에 공이 3개 들어 있고, 공에 적힌 수는 각각 ${lst}$이다. 이 주머니에서 공을 한 개 꺼내 숫자를 확인하고 다시 넣는 시행을 ${nt}$번 반복한다. 확인한 ${nt}$개의 수의 평균을 $\\overline{X}$라 할 때, $P(\\overline{X}\\ge {t})$를 구하세요. " + FRK,
      ["복원추출이므로 나올 수 있는 순서쌍은 모두 같은 확률이에요.", "순서쌍의 평균이 ${t}$ 이상인 것을 모두 세어요."],
      "순서를 구별한 경우의 수는 모두 ${tot}$가지이고, 평균이 ${t}$ 이상인 경우는 ${cnt}$가지입니다. 따라서 확률은 ${fe}$입니다."],
    en: ["A bag holds 3 balls, numbered ${lst}$ respectively. A ball is drawn, its number is noted and it is put back; this is done ${nt}$ times. Let $\\overline{X}$ be the mean of the ${nt}$ noted numbers. Find $P(\\overline{X}\\ge {t})$. " + FRE,
      ["Because the balls are replaced, all ordered outcomes are equally likely.", "Count the ordered outcomes whose mean is at least ${t}$."],
      "There are ${tot}$ equally likely ordered outcomes, and ${cnt}$ of them have mean at least ${t}$. The probability is ${fe}$."],
  },
  pst_stratified: {
    ko: ["어느 지역의 주민이 A, B, C 세 집단으로 나뉘며 인원은 각각 ${na}$명, ${nb}$명, ${nc}$명이다. 각 집단의 인원에 비례하도록 표본의 크기를 정하는 비례배분 층화추출로 표본을 뽑았더니 A 집단에서 ${sa}$명이 뽑혔다. 이때 C 집단에서 뽑힌 사람은 몇 명인가요? " + NUMK,
      ["비례배분이면 각 집단에서 뽑힌 비율(표본 수 ÷ 집단 인원)이 같아요.", "A 집단의 비율을 먼저 구해 보세요."],
      "A 집단에서 뽑힌 비율은 $\\frac{{sa}}{{na}}$입니다. 모든 집단에서 이 비율이 같으므로 C 집단에서는 ${nc}\\times\\frac{{sa}}{{na}}={ans}$명입니다."],
    en: ["The residents of a region form three groups A, B, C of ${na}$, ${nb}$ and ${nc}$ people. A sample is drawn by proportional stratified sampling (each group is sampled in proportion to its size), and ${sa}$ people are chosen from group A. How many people are chosen from group C? " + NUME,
      ["With proportional allocation, the sampling fraction (sample ÷ group size) is the same in every group.", "Find the fraction for group A first."],
      "The sampling fraction in A is $\\frac{{sa}}{{na}}$. It is the same in every group, so group C contributes ${nc}\\times\\frac{{sa}}{{na}}={ans}$ people."],
  },
  pst_ciBounds: {
    ko: ["모표준편차가 ${s}$인 정규분포를 따르는 모집단에서 크기가 ${n}$인 표본을 임의추출하였더니 표본평균이 ${xb}$였다. 신뢰도 ${cl}\\%$로 모평균 $m$을 추정한 신뢰구간을 $a\\le m\\le b$라 할 때, $b$의 값을 구하세요. (단, 신뢰도 ${cl}\\%$에 대응하는 값은 $z={z}$이다.) " + DECK,
      ["신뢰구간은 $\\overline{x}-z\\frac{\\sigma}{\\sqrt{{n}}}\\le m\\le \\overline{x}+z\\frac{\\sigma}{\\sqrt{{n}}}$예요.", "$\\sqrt{{n}}={rt}$이므로 $\\frac{\\sigma}{\\sqrt{{n}}}$을 먼저 구해요."],
      "$z\\frac{\\sigma}{\\sqrt{{n}}}={z}\\times\\frac{{s}}{{rt}}={err}$이므로 $b={xb}+{err}={ans}$입니다."],
    en: ["A random sample of size ${n}$ from a normal population with standard deviation ${s}$ has sample mean ${xb}$. The ${cl}\\%$ confidence interval for the population mean $m$ is $a\\le m\\le b$. Find $b$. (Use $z={z}$ for the ${cl}\\%$ level.) " + DECE,
      ["The interval is $\\overline{x}-z\\frac{\\sigma}{\\sqrt{{n}}}\\le m\\le \\overline{x}+z\\frac{\\sigma}{\\sqrt{{n}}}$.", "Since $\\sqrt{{n}}={rt}$, first compute $\\frac{\\sigma}{\\sqrt{{n}}}$."],
      "$z\\frac{\\sigma}{\\sqrt{{n}}}={z}\\times\\frac{{s}}{{rt}}={err}$, so $b={xb}+{err}={ans}$."],
  },
  pst_ciSampleSize: {
    ko: ["모표준편차가 ${s}$인 정규분포를 따르는 모집단에서 표본을 임의추출하여 신뢰도 ${cl}\\%$로 모평균을 추정할 때, 신뢰구간의 길이가 ${L}$ 이하가 되도록 하는 표본의 크기 $n$의 최솟값을 구하세요. (단, 신뢰도 ${cl}\\%$에 대응하는 값은 $z={z}$이고, $n$은 자연수이다.) " + NUMK,
      ["신뢰구간의 길이는 $2z\\frac{\\sigma}{\\sqrt{n}}$예요.", "다음 부등식을 $\\sqrt{n}$에 대하여 풀고 양변을 제곱해요. $2z\\frac{\\sigma}{\\sqrt{n}}\\le {L}$"],
      "신뢰구간의 길이는 $2\\times{z}\\times\\frac{{s}}{\\sqrt{n}}\\le {L}$이므로 $\\sqrt{n}\\ge\\frac{2\\times{z}\\times{s}}{{L}}$, 곧 $n\\ge\\left(\\frac{2\\times{z}\\times{s}}{{L}}\\right)^{2}{eq}{nq}$입니다. 이를 만족시키는 가장 작은 자연수는 ${ans}$입니다."],
    en: ["A random sample is taken from a normal population with standard deviation ${s}$ to estimate the mean at the ${cl}\\%$ confidence level. Find the smallest sample size $n$ for which the length of the confidence interval is at most ${L}$. (Use $z={z}$ for the ${cl}\\%$ level; $n$ is a positive integer.) " + NUME,
      ["The length of the interval is $2z\\frac{\\sigma}{\\sqrt{n}}$.", "Solve $2z\\frac{\\sigma}{\\sqrt{n}}\\le {L}$ for $\\sqrt{n}$, then square."],
      "The length $2\\times{z}\\times\\frac{{s}}{\\sqrt{n}}\\le {L}$ gives $\\sqrt{n}\\ge\\frac{2\\times{z}\\times{s}}{{L}}$, so $n\\ge\\left(\\frac{2\\times{z}\\times{s}}{{L}}\\right)^{2}{eq}{nq}$. The smallest positive integer is ${ans}$."],
  },
};

// ---------------------------------------------------------------- generators
const FRACS1 = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]];
const FRACS2 = [[1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], ...FRACS1];
const DEMORGAN = {
  1: [["A^{c}\\cap B^{c}", ["ne"]], ["(A\\cup B)^{c}", ["ne"]], ["A^{c}\\cup B^{c}", ["ao", "bo", "ne"]], ["(A\\cap B)^{c}", ["ao", "bo", "ne"]], ["A^{c}", ["bo", "ne"]], ["B^{c}", ["ao", "ne"]], ["(A^{c}\\cup B)^{c}", ["ao"]]],
  2: [["A\\cap B^{c}", ["ao"]], ["A^{c}\\cap B", ["bo"]], ["A^{c}\\cup B", ["ab", "bo", "ne"]], ["A\\cup B^{c}", ["ab", "ao", "ne"]], ["(A\\cap B^{c})\\cup(A^{c}\\cap B)", ["ao", "bo"]]],
};
const BINOM_P = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5]];
const NORMAL_BN = [[100, 1, 2], [64, 1, 2], [144, 1, 2], [196, 1, 2], [400, 1, 2], [100, 1, 5], [225, 1, 5], [400, 1, 5], [625, 1, 5], [900, 1, 10], [100, 4, 5], [400, 4, 5], [225, 4, 5], [36, 1, 2], [900, 1, 5], [900, 9, 10]];

// P(event) for X ~ N(mu, sd^2) from the six-entry table: a one-sided event (level 1) or an interval (level 2).
// returns the event, the standardised bounds, the matching Z event, and the table calculation (all in units of 1e-4).
function stdEvent(r, lvl, mu, sd, xv, needInt) {
  const ZZ = [...ZS, ...ZS.map((x) => -x), 0];
  for (;;) {
    const bnd = (z) => mu + z * sd, fr = (z) => `\\frac{${bnd(z)}-${mu}}{${sd}}=${z}`;
    const T = (z) => t4(TAB[Math.abs(z)]);
    if (lvl === 1) {
      const z = r.pick(ZS), zz = r.pick([z, -z]), rel = r.pick(["\\le", "\\ge"]);
      if (needInt && (zz * sd) % 1 !== 0) continue;
      const u = rel === "\\le" ? 5000 + phi0(zz) : 5000 - phi0(zz);
      const e = rel === "\\le" ? (zz > 0 ? `0.5+${T(z)}` : `0.5-${T(z)}`) : (zz > 0 ? `0.5-${T(z)}` : `0.5+${T(z)}`);
      return { ev: `${xv}${rel}${bnd(zz)}`, zs: fr(zz), zev: `Z${rel}${zz}`, expr: `${e}=${t4(u)}`, u };
    }
    const z1 = r.pick(ZZ), z2 = r.pick(ZZ);
    if (!(z1 < z2)) continue;
    if (needInt && ((z1 * sd) % 1 !== 0 || (z2 * sd) % 1 !== 0)) continue;
    let e;
    if (z1 < 0 && z2 > 0) e = `${T(z1)}+${T(z2)}`;
    else if (z1 >= 0) e = z1 === 0 ? T(z2) : `${T(z2)}-${T(z1)}`;
    else e = z2 === 0 ? T(z1) : `${T(z1)}-${T(z2)}`;
    const u = phi0(z2) - phi0(z1);
    return { ev: `${bnd(z1)}\\le ${xv}\\le ${bnd(z2)}`, zs: `${fr(z1)},\\ ${fr(z2)}`, zev: `${z1}\\le Z\\le ${z2}`, expr: /[+-]/.test(e) ? `${e}=${t4(u)}` : e, u };
  }
}

function binomProb(n, pn, pd, test) { let num = 0; for (let j = 0; j <= n; j++) if (test(j)) num += C(n, j) * pn ** j * (pd - pn) ** (n - j); return [num, pd ** n]; }

export const GEN = {
  pst_repPermCond: (r, lvl) => {
    const m = lvl === 1 ? r.int(4, 6) : r.int(5, 7), k = lvl === 1 ? r.int(3, 4) : r.int(4, 5);
    const t = lvl === 1 ? r.int(1, m) : r.int(0, m);
    const tot = m * (m + 1) ** (k - 1), no = t === 0 ? m ** k : (m - 1) * m ** (k - 1);
    const noExpr = t === 0 ? `${m}^{${k}}` : `${m - 1}\\times${m}^{${k - 1}}`;
    return { v: { m, k, t, tot, no, noExpr }, ans: tot - no };
  },
  pst_latticePath: (r, lvl) => {
    const m = lvl === 1 ? r.int(4, 6) : r.int(6, 9), n = lvl === 1 ? r.int(3, 5) : r.int(5, 7);
    const p = r.int(1, m - 1), q = r.int(1, n - 1);
    const tot = C(m + n, m), via1 = C(p + q, p), via2 = C(m + n - p - q, m - p), via = via1 * via2;
    return { v: { m, n, p, q, tot, via1, via2, via }, ans: tot - via };
  },
  pst_repCombEq: (r, lvl) => {
    for (;;) {
      const hi = lvl === 1 ? 2 : 4, a = r.int(0, hi), b = r.int(0, hi), c = r.int(0, hi), d = r.int(0, hi);
      if (a + b + c + d === 0) continue;
      const m2 = lvl === 1 ? r.int(3, 8) : r.int(8, 15), n = a + b + c + d + m2;
      const nm = ["x", "y", "z", "w"], lo = [a, b, c, d], on = nm.map((x, i) => [x, lo[i]]).filter((p) => p[1] > 0);
      const cond = on.map(([x, l]) => `${x}\\ge ${l}`).join("$, $"), subs = on.map(([x, l]) => `${x}'=${x}-${l}`).join("$, $");
      return { v: { n, a, b, c, d, cond, subs, m2, m3: m2 + 3 }, ans: C(m2 + 3, 3) };
    }
  },
  pst_monotoneSeq: (r, lvl) => {
    for (;;) {
      const sgn = ["<", "\\le "], r1 = r.pick(sgn), r2 = r.pick(sgn), r3 = r.pick(sgn);
      const s = [r1, r2, r3].filter((x) => x === "<").length;
      if (s === 0) continue;
      const m = lvl === 1 ? r.int(5, 7) : r.int(7, 10), ms = m - s;
      return { v: { m, r1, r2, r3, s, ms, top: ms + 3 }, ans: C(ms + 3, 4) };
    }
  },
  pst_binomCoef2: (r, lvl) => {
    const a = r.int(1, 3), b = r.pick([-3, -2, -1, 1, 2, 3, 4]), n = lvl === 1 ? r.int(4, 6) : r.int(6, 8), k = r.int(2, n), nk = n - k;
    return { v: { a, ax: `${cf(a)}x`, b, bs: sg(b), n, k, nk }, ans: C(n, k) * a ** k * b ** nk };
  },
  pst_binomSumId: (r, lvl) => {
    const a = lvl === 1 ? r.int(2, 4) : -r.int(2, 5), n = lvl === 1 ? r.int(3, 7) : r.int(4, 8);
    return { v: { a, at: a > 0 ? String(a) : `(${a})`, n, base: 1 + a }, ans: (1 + a) ** n };
  },
  pst_binomUnknown: (r) => {
    for (;;) {
      const a = r.int(2, 6), n = r.int(5, 8), nk = r.int(2, 4), k = n - nk;
      if (k < 2) continue;
      const Cn = C(n, k), q = a ** nk;
      if (Cn * q > 30000) continue;
      return { v: { n, k, V: Cn * q, nk, C: Cn, q }, ans: a };
    }
  },
  pst_diceSum: (r, lvl) => {
    for (;;) {
      const s = lvl === 1 ? 6 : r.pick([8, 10, 12]), rel = r.pick(["=", "\\ge", "\\le"]), t = r.int(2, 2 * s);
      let cnt = 0;
      for (let a = 1; a <= s; a++) for (let b = 1; b <= s; b++) { const x = a + b; if (rel === "=" ? x === t : rel === "\\ge" ? x >= t : x <= t) cnt++; }
      const tot = s * s;
      if (cnt === 0 || cnt === tot) continue;
      return { v: { s, rel, t, tot, cnt, fr: tfrac(cnt, tot), fe: feq(cnt, tot) }, ans: cnt / tot };
    }
  },
  pst_diceQuad: (r, lvl) => {
    for (;;) {
      const s = lvl === 1 ? 6 : r.pick([8, 10]), p = r.int(1, 4), q = r.int(1, 6);
      let cnt = 0;
      for (let a = 1; a <= s; a++) for (let b = 1; b <= s; b++) if (p * p * a * a - 4 * q * b > 0) cnt++;
      const tot = s * s;
      if (cnt === 0 || cnt === tot) continue;
      return { v: { s, p, q, pa: `${cf(p)}a`, qb: `${cf(q)}b`, d1: p === 1 ? "a^{2}" : `(${p}a)^{2}`, tot, cnt, fr: tfrac(cnt, tot), fe: feq(cnt, tot) }, ans: cnt / tot };
    }
  },
  pst_atLeast: (r, lvl) => {
    for (;;) {
      const w = r.int(3, 6), bk = r.int(3, 6), k = lvl === 1 ? r.int(2, 3) : r.int(3, 4), rr = lvl === 1 ? 1 : 2;
      if (k > bk) continue;
      const nn = w + bk, tot = C(nn, k);
      let bad = 0; const bxs = [], zl = [];
      for (let j = 0; j < rr; j++) { bad += C(w, j) * C(bk, k - j); bxs.push(`\\binom{${w}}{${j}}\\binom{${bk}}{${k - j}}`); zl.push(j); }
      return { v: { w, bk, k, r: rr, rm1: rr - 1, nn, tot, bad, zs: zl.join(",\\ "), bx: bxs.join("+"), fr: tfrac(tot - bad, tot) }, ans: (tot - bad) / tot };
    }
  },
  pst_lineUp: (r, lvl) => {
    const m = lvl === 1 ? r.int(3, 8) : r.int(5, 10), w = lvl === 1 ? r.int(2, 3) : r.int(3, 5);
    const nn = m + w, tot = C(nn, w), good = C(m + 1, w);
    return { v: { m, w, nn, m1: m + 1, tot, good, fr: tfrac(good, tot), fe: feq(good, tot) }, ans: good / tot };
  },
  pst_multiplesUnion: (r) => {
    for (;;) {
      const N = r.int(20, 100), p = r.int(2, 9), q = r.int(2, 9);
      if (p === q || p % q === 0 || q % p === 0) continue;
      const l = (p * q) / gcd(p, q), np = Math.floor(N / p), nq = Math.floor(N / q), nl = Math.floor(N / l), cnt = np + nq - nl;
      return { v: { N, p, q, np, nq, l, nl, cnt, fr: tfrac(cnt, N), fe: feq(cnt, N) }, ans: cnt / N };
    }
  },
  pst_deMorgan: (r, lvl) => {
    for (;;) {
      const pa = r.int(30, 80), pb = r.int(30, 80), pab = r.int(10, Math.min(pa, pb) - 5);
      const reg = { ab: pab, ao: pa - pab, bo: pb - pab, ne: 100 - pa - pb + pab };
      if (reg.ne < 5) continue;
      const [ev, parts] = r.pick(DEMORGAN[lvl === 1 ? 1 : 2]);
      const sum = parts.reduce((s, x) => s + reg[x], 0);
      const d2 = (x) => (x / 100).toFixed(2);
      const useU = lvl === 2 && r.int(0, 1) === 1, pu = pa + pb - pab;
      const gv = useU ? `P(A)=${d2(pa)},\\ P(B)=${d2(pb)},\\ P(A\\cup B)=${d2(pu)}` : `P(A)=${d2(pa)},\\ P(B)=${d2(pb)},\\ P(A\\cap B)=${d2(pab)}`;
      const der = useU ? `P(A)+P(B)-P(A\\cup B)=${d2(pa)}+${d2(pb)}-${d2(pu)}=${d2(pab)}` : d2(pab);
      return { v: { pa: d2(pa), pb: d2(pb), pab: d2(pab), gv, der, ev, ao: d2(reg.ao), bo: d2(reg.bo), ne: d2(reg.ne), sumx: parts.length > 1 ? `${parts.map((x) => d2(reg[x])).join("+")}=${d2(sum)}` : d2(sum) }, ans: sum / 100 };
    }
  },
  pst_condTable: (r) => {
    for (;;) {
      const N = r.int(30, 80), m = r.int(10, N - 10), g = r.int(10, N - 8), x = r.int(1, Math.min(m, g));
      const f = N - m, gy = g - x, fn = f - gy, ng = N - g;
      if (gy < 0 || gy > f || fn < 1 || ng < 2) continue;
      return { v: { N, m, g, x, f, gy, fn, ng, fr: tfrac(fn, ng), fe: feq(fn, ng) }, ans: fn / ng };
    }
  },
  pst_condDice: (r, lvl) => {
    for (;;) {
      const rel = lvl === 1 ? "=" : r.pick(["\\ge", "\\le"]), t = r.int(3, 11), relb = r.pick([">", "=", "\\ge "]);
      let nA = 0, nAB = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
        const x = a + b; const inA = rel === "=" ? x === t : rel === "\\ge" ? x >= t : x <= t;
        if (!inA) continue; nA++;
        if (relb === ">" ? a > b : relb === "=" ? a === b : a >= b) nAB++;
      }
      if (nA < 2 || nAB === 0) continue;
      return { v: { rel, t, relb, nA, nAB, fr: tfrac(nAB, nA), fe: feq(nAB, nA) }, ans: nAB / nA };
    }
  },
  pst_indepUnknown: (r, lvl) => {
    for (;;) {
      const set = lvl === 1 ? FRACS1 : FRACS2, [an, ad] = r.pick(set), [bn, bd] = r.pick(set);
      const un = an * bd + bn * ad - an * bn, ud = ad * bd; // P(A)+P(B)-P(A)P(B)
      const g = gcd(un, ud), U = [un / g, ud / g];
      if (ad === bd && an === bn) continue;
      const d1n = ad - an, d2n = U[0] * ad - an * U[1], d2d = U[1] * ad; // 1-P(A), P(AuB)-P(A)
      return { v: { fa: tfrac(an, ad), fu: tfrac(U[0], U[1]), d1: tfrac(d1n, ad), d2: tfrac(d2n, d2d), an, ad, un: U[0], ud: U[1], fr: tfrac(bn, bd) }, ans: bn / bd };
    }
  },
  pst_indepFindN: (r) => {
    for (;;) {
      const p = r.int(2, 9), q = r.int(2, 9);
      if (p === q || gcd(p, q) !== 1) continue;
      const l = p * q, t = r.int(1, Math.max(1, Math.floor(130 / l))), M = l * t + r.int(1, 3);
      let best = 0;
      for (let n = 2; n <= M; n++) { const a = Math.floor(n / p), b = Math.floor(n / q), c = Math.floor(n / l); if (c * n === a * b) best = n; }
      if (best !== l * t) continue;
      const chk = [];
      for (let n = l * t + 1; n <= M; n++) { const a = Math.floor(n / p), b = Math.floor(n / q), c = Math.floor(n / l); chk.push(`n=${n}:\\ ab=${a}\\times${b}=${a * b}\\ne cn=${c}\\times${n}=${c * n}`); }
      return { v: { p, q, M, l, chk: chk.join(",\\quad ") }, ans: best };
    }
  },
  pst_urnChain: (r) => {
    for (;;) {
      const w = r.int(3, 7), bk = r.int(2, 4), rr = r.int(1, 3), nn = w + bk;
      if (rr > w || nn > 10) continue;
      let num = 1, den = 1; const fs = [];
      for (let i = 0; i < rr; i++) { num *= w - i; den *= nn - i; fs.push(tfrac(w - i, nn - i)); }
      num *= bk; den *= nn - rr; fs.push(tfrac(bk, nn - rr));
      return { v: { w, bk, r: rr, r1: rr + 1, nn, prod: fs.join("\\times"), fe: feq(num, den) }, ans: num / den };
    }
  },
  pst_totalProb: (r) => {
    for (;;) {
      const t = r.int(1, 5), w1 = r.int(1, 5), b1 = r.int(1, 5), w2 = r.int(1, 5), b2 = r.int(1, 5), n1 = w1 + b1, n2 = w2 + b2;
      if (w1 * n2 === w2 * n1) continue;
      const num = t * w1 * n2 + (6 - t) * w2 * n1, den = 6 * n1 * n2;
      return { v: { t, w1, b1, w2, b2, t6c: 6 - t, pw1: tfrac(w1, n1), pw2: tfrac(w2, n2), tA: tfrac(t * w1, 6 * n1), tB: tfrac((6 - t) * w2, 6 * n2), fr: tfrac(num, den) }, ans: num / den };
    }
  },
  pst_bayes: (r) => {
    for (;;) {
      const t = r.int(1, 5), w1 = r.int(1, 5), b1 = r.int(1, 5), w2 = r.int(1, 5), b2 = r.int(1, 5), n1 = w1 + b1, n2 = w2 + b2;
      if (w1 * n2 === w2 * n1) continue;
      const X = t * w1 * n2, Y = (6 - t) * w2 * n1;
      return { v: { t, w1, b1, w2, b2, tA: tfrac(t * w1, 6 * n1), tB: tfrac((6 - t) * w2, 6 * n2), fr: tfrac(X, X + Y) }, ans: X / (X + Y) };
    }
  },
  pst_expectTable: (r, lvl) => {
    const n = lvl === 1 ? r.int(3, 6) : r.int(6, 9), c = lvl === 1 ? r.int(1, 4) : r.int(3, 8);
    let S1 = 0, S2 = 0; const a1 = [], a2 = [];
    for (let x = 1; x <= n; x++) { S1 += x + c; S2 += x * (x + c); a1.push(x + c); a2.push(`${x}\\times${x + c}`); }
    return { v: { n, c, S1, S2, t1: a1.join("+"), t2: a2.join("+"), fe: feq(S2, S1) }, ans: S2 / S1 };
  },
  pst_varTable: (r) => {
    for (;;) {
      const d = r.int(4, 10), xs = [r.int(-3, 6), r.int(-3, 6), r.int(-3, 6)];
      if (new Set(xs).size < 3) continue;
      xs.sort((a, b) => a - b);
      const a1 = r.int(1, d - 2), a2 = r.int(1, d - a1 - 1), a3 = d - a1 - a2;
      if (a3 < 1) continue;
      const as = [a1, a2, a3];
      const eN = as.reduce((s, a, i) => s + a * xs[i], 0), e2 = as.reduce((s, a, i) => s + a * xs[i] * xs[i], 0);
      const vn = d * e2 - eN * eN;
      if (vn <= 0) continue;
      return { v: { x1: xs[0], x2: xs[1], x3: xs[2], a1, a2, a3, d, fE: tfrac(eN, d), f2: tfrac(e2, d), fr: tfrac(vn, d * d) }, ans: vn / (d * d) };
    }
  },
  pst_linTransform: (r) => {
    const m = r.int(-3, 8), s = r.int(1, 6), a = r.pick([-4, -3, -2, 2, 3, 4, 5]), b = r.nonzero(-5, 6);
    const em = a * m + b, vy = a * a * s * s;
    const P_ = (x) => (x < 0 ? `(${x})` : String(x));
    return { v: { m, s, a, b, ya: lin(a, b, "X"), em, vy, eE: `${P_(a)}\\times${P_(m)}+${P_(b)}` }, ans: vy + em * em };
  },
  pst_binomFindN: (r) => {
    const [pn, pd] = r.pick(BINOM_P), n = pd * r.int(1, Math.floor(60 / pd)), mu = (n * pn) / pd, qn = pd - pn;
    const vN = n * pn * qn, vD = pd * pd;
    return { v: { mu: String(mu), vr: tfrac(vN, vD), q: tfrac(qn, pd), pp: tfrac(pn, pd) }, ans: n };
  },
  pst_binomTail: (r) => {
    for (;;) {
      const [pn, pd] = r.pick(BINOM_P), n = r.int(4, 7), rel = r.pick(["\\le", "\\ge"]), t = rel === "\\le" ? r.int(0, 2) : r.pick([1, 2, n - 2, n - 1]);
      if (t < 0 || t > n) continue;
      const js = []; for (let j = 0; j <= n; j++) if (rel === "\\le" ? j <= t : j >= t) js.push(j);
      const [num, den] = binomProb(n, pn, pd, (j) => (rel === "\\le" ? j <= t : j >= t));
      const g = gcd(num, den);
      if (den / g > 2200 || num === 0) continue;
      const qn = pd - pn, pw = (b, e) => (b === 1 || e === 0 ? "" : e === 1 ? `\\cdot${b}` : `\\cdot${b}^{${e}}`);
      const tm = js.map((j) => `\\binom{${n}}{${j}}${pw(pn, j)}${pw(qn, n - j)}`).join("+");
      return { v: { n, pf: tfrac(pn, pd), rel, t, js: js.join(", "), tm, D: den, num, fr: tfrac(num, den), fe: feq(num, den) }, ans: num / den };
    }
  },
  pst_binomPmfEq: (r) => {
    const n = r.int(5, 14), rr = r.int(0, n - 2);
    return { v: { n, r: rr, r1: rr + 1, nr: n - rr, nr1: n - rr - 1, n1: n + 1, fr: tfrac(rr + 1, n + 1), fe: feq(rr + 1, n + 1) }, ans: (rr + 1) / (n + 1) };
  },
  pst_bestOf: (r) => {
    for (;;) {
      const w = r.int(2, 4), [pn, pd] = r.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]);
      let num = 0; const den = pd ** (2 * w - 1), tms = [], jl = [];
      for (let j = 0; j < w; j++) {
        num += C(w - 1 + j, j) * pn ** w * (pd - pn) ** j * pd ** (w - 1 - j);
        tms.push(tfrac(C(w - 1 + j, j) * pn ** w * (pd - pn) ** j, pd ** (w + j))); jl.push(j);
      }
      const g = gcd(num, den);
      if (den / g > 20000) continue;
      return { v: { w, wm1: w - 1, fp: tfrac(pn, pd), pn, pd, jr: jl.join(",\\ "), tm: tms.join(",\\ "), fr: tfrac(num, den) }, ans: num / den };
    }
  },
  pst_normalBetween: (r, lvl) => {
    for (;;) {
      const s = r.pick([2, 4, 5, 6, 8, 10]), m = r.int(20, 90);
      let z1, z2;
      if (lvl === 1) { z2 = r.pick(ZS); z1 = r.pick([-z2, 0]); } else { z1 = r.pick([...ZS, ...ZS.map((x) => -x), 0]); z2 = r.pick([...ZS, ...ZS.map((x) => -x), 0]); if (!(z1 < z2)) continue; }
      if ((z1 * s) % 1 !== 0 || (z2 * s) % 1 !== 0) continue;
      const a = m + z1 * s, b = m + z2 * s;
      const T = (z) => t4(TAB[Math.abs(z)]);
      let expr;
      if (z1 < 0 && z2 > 0) expr = `${T(z1)}+${T(z2)}`;
      else if (z1 >= 0) expr = z1 === 0 ? T(z2) : `${T(z2)}-${T(z1)}`;
      else expr = z2 === 0 ? T(z1) : `${T(z1)}-${T(z2)}`;
      const u = phi0(z2) - phi0(z1);
      return { v: { m, s, a, b, z1: String(z1), z2: String(z2), expr: /[+-]/.test(expr) ? `${expr}=${t4(u)}` : expr }, ans: u / 10000 };
    }
  },
  pst_normalFindParam: (r, lvl) => {
    for (;;) {
      const s = r.pick([2, 4, 5, 6, 8, 10]), z = r.pick(ZS) * (lvl === 1 ? 1 : r.pick([1, -1]));
      if ((z * s) % 1 !== 0) continue;
      const m = r.int(20, 90), c = m + z * s, pu = z > 0 ? 5000 - TAB[z] : 5000 + TAB[-z];
      return { v: { s, c, pv: t4(pu), tv: t4(TAB[Math.abs(z)]), az: String(Math.abs(z)), zz: String(z), cmp: z > 0 ? `${t4(pu)}<0.5` : `${t4(pu)}>0.5`, zsg: z > 0 ? "z_0>0" : "z_0<0" }, ans: m };
    }
  },
  pst_normalSymmetric: (r) => {
    for (;;) {
      const m = r.int(20, 60), s = r.int(2, 10), k = r.int(3, 25), a = r.int(1, 3), c = r.int(1, 3), b = r.int(-10, 10);
      const d = 2 * m - b - (a + c) * k;
      if (Math.abs(d) > 40 || a * k + b === c * k + d) continue;
      return { v: { m, s, L: lin(a, b, "k"), R: lin(c, d, "k"), A: a + c, BD: b + d, m2: 2 * m }, ans: k };
    }
  },
  pst_binomNormal: (r, lvl) => {
    const [n, pn, pd] = r.pick(NORMAL_BN), mu = (n * pn) / pd, vr = (n * pn * (pd - pn)) / (pd * pd), sgv = Math.sqrt(vr);
    const e = stdEvent(r, lvl, mu, sgv, "X", true);
    return { v: { n, pf: tfrac(pn, pd), mu, vr, sg: sgv, ev: e.ev, zs: e.zs, zev: e.zev, expr: e.expr }, ans: e.u / 10000 };
  },
  pst_sampleSd: (r) => {
    for (;;) {
      const m = r.int(5, 60), n = r.pick([4, 5, 8, 10, 16, 20, 25, 40, 50]), v = r.int(4, 90);
      if ((v * 1000) % n !== 0) continue;
      const vx = v / n;
      return { v: { m, v, n, vx: String(vx) }, ans: (m * m * n + v) / n };
    }
  },
  pst_sampleMeanNormal: (r, lvl) => {
    const n = r.pick([4, 9, 16, 25, 36, 49, 64, 100]), rt = Math.sqrt(n), h = r.int(1, 6), s = h * rt, m = r.int(20, 90);
    const e = stdEvent(r, lvl, m, h, "\\overline{X}", false);
    return { v: { m, s, n, h, ev: e.ev, zs: e.zs, zev: e.zev, expr: e.expr }, ans: e.u / 10000 };
  },
  pst_sampleMeanDist: (r, lvl) => {
    for (;;) {
      const k = 3, nt = lvl === 1 ? 2 : 3, vals = new Set();
      while (vals.size < k) vals.add(r.int(1, 9));
      const xs = [...vals].sort((a, b) => a - b);
      const t = nt === 2 ? r.int(2, 17) / 2 : r.int(2, 9);
      let cnt = 0, tot = 0;
      const rec = (depth, sum) => { if (depth === nt) { tot++; if (sum >= t * nt) cnt++; return; } for (const x of xs) rec(depth + 1, sum + x); };
      rec(0, 0);
      if (cnt / tot < 0.2 || cnt / tot > 0.8) continue;
      return { v: { lst: xs.join(",\\ "), nt, t: String(t), tot, cnt, fr: tfrac(cnt, tot), fe: feq(cnt, tot) }, ans: cnt / tot };
    }
  },
  pst_stratified: (r) => {
    for (;;) {
      const k = r.int(3, 12), sa = r.int(2, 9), sb = r.int(2, 9), sc = r.int(2, 9);
      if (new Set([sa, sb, sc]).size < 3) continue;
      return { v: { na: k * sa, nb: k * sb, nc: k * sc, sa }, ans: sc };
    }
  },
  pst_ciBounds: (r) => {
    for (;;) {
      const n = r.pick([16, 25, 36, 49, 64, 100, 144, 196, 225, 400]), rt = Math.sqrt(n), s = r.int(2, 24);
      const [cl, z, zi] = r.pick([[95, "1.96", 1960], [99, "2.58", 2580], [90, "1.645", 1645]]);
      if ((zi * s) % rt !== 0) continue;
      const errK = (zi * s) / rt; // units of 1e-3
      const xbK = r.int(2000, 20000) * 10; // 20.00 .. 200.00, so the lower bound stays positive
      const f3 = (k) => String(Number((k / 1000).toFixed(3)));
      return { v: { s, n, xb: f3(xbK), cl, z, rt, err: f3(errK) }, ans: (xbK + errK) / 1000 };
    }
  },
  pst_ciSampleSize: (r) => {
    for (;;) {
      const s = r.int(3, 25), [cl, z, zi] = r.pick([[95, "1.96", 1960], [99, "2.58", 2580], [90, "1.645", 1645]]), Li = r.pick([5, 10, 20, 25, 40, 50]); // L = Li/10
      const Nn = (2 * zi * s * 10) ** 2, D = (1000 * Li) ** 2;
      const n = ceilDiv(Nn, D);
      if (n < 5 || n > 900) continue;
      const exact = (BigInt(Nn) * 10000n) % BigInt(D) === 0n;
      return { v: { s, cl, z, L: String(Li / 10), nq: String(Number((Nn / D).toFixed(4))), eq: exact ? "=" : "\\approx " }, ans: n };
    }
  },
};

// ---------------------------------------------------------------- plan
const P = (skill, template, levels, count, d, standards, strategy, evidence) => ({ skill, template, levels, count, d, standards, strategy, evidence });
export const PLAN = [
  P("m.h3.cnt1", "pst_repPermCond", [1, 2], 12, 2, ["12확통01-01"], "complement-repeated-permutation", "counting"),
  P("m.h3.cnt1", "pst_latticePath", [1, 2], 12, 3, ["12확통01-01"], "lattice-path-complement", "counting"),
  P("m.h3.cnt1", "pst_repCombEq", [1, 2], 12, 3, ["12확통01-02"], "shift-to-nonnegative-solutions", "counting"),
  P("m.h3.cnt1", "pst_monotoneSeq", [1, 2], 12, 3, ["12확통01-02"], "monotone-tuples-as-combination-with-repetition", "representation"),
  P("m.h3.cnt1", "pst_binomCoef2", [1, 2], 12, 2, ["12확통01-03"], "general-term-coefficient", "calc"),
  P("m.h3.cnt1", "pst_binomSumId", [1, 2], 12, 2, ["12확통01-03"], "binomial-sum-substitution", "concept"),
  P("m.h3.cnt1", "pst_binomUnknown", [1], 18, 3, ["12확통01-03"], "coefficient-equation-unknown-base", "reverse"),
  P("m.h3.pro1", "pst_diceSum", [1, 2], 12, 2, ["12확통02-01"], "sample-space-enumeration", "counting"),
  P("m.h3.pro1", "pst_diceQuad", [1, 2], 12, 3, ["12확통02-01"], "discriminant-condition-on-dice", "representation"),
  P("m.h3.pro1", "pst_atLeast", [1, 2], 12, 3, ["12확통02-03"], "complement-at-least", "application"),
  P("m.h3.pro1", "pst_lineUp", [1, 2], 12, 4, ["12확통01-01", "12확통02-01"], "gap-method-probability", "counting"),
  P("m.h3.pro1", "pst_multiplesUnion", [1], 18, 2, ["12확통02-02"], "addition-rule-multiples", "counting"),
  P("m.h3.pro1", "pst_deMorgan", [1, 2], 12, 3, ["12확통02-02", "12확통02-03"], "venn-regions", "representation"),
  P("m.h3.cond", "pst_condTable", [1], 18, 2, ["12확통02-04"], "two-way-table-conditional", "application"),
  P("m.h3.cond", "pst_condDice", [1, 2], 12, 3, ["12확통02-04"], "conditional-by-enumeration", "counting"),
  P("m.h3.cond", "pst_indepUnknown", [1, 2], 12, 3, ["12확통02-05", "12확통02-02"], "independence-solve-unknown", "reverse"),
  P("m.h3.cond", "pst_indepFindN", [1], 18, 4, ["12확통02-05"], "independence-condition-search", "concept"),
  P("m.h3.cond", "pst_urnChain", [1], 18, 3, ["12확통02-06"], "multiplication-rule-chain", "calc"),
  P("m.h3.cond", "pst_totalProb", [1], 18, 4, ["12확통02-06", "12확통02-04"], "total-probability", "application"),
  P("m.h3.cond", "pst_bayes", [1], 18, 5, ["12확통02-04", "12확통02-06"], "reverse-conditional", "application"),
  P("m.h3.norm", "pst_expectTable", [1, 2], 12, 3, ["12확통03-01", "12확통03-02"], "normalize-then-expectation", "calc"),
  P("m.h3.norm", "pst_varTable", [1], 18, 3, ["12확통03-02"], "variance-from-table", "calc"),
  P("m.h3.norm", "pst_linTransform", [1], 18, 3, ["12확통03-02"], "linear-transform-second-moment", "calc"),
  P("m.h3.norm", "pst_binomFindN", [1], 18, 3, ["12확통03-03"], "mean-variance-to-parameters", "reverse"),
  P("m.h3.norm", "pst_binomTail", [1], 18, 3, ["12확통03-03"], "binomial-tail-probability", "calc"),
  P("m.h3.norm", "pst_binomPmfEq", [1], 18, 4, ["12확통03-03"], "pmf-ratio-equation", "reverse"),
  P("m.h3.norm", "pst_bestOf", [1], 18, 5, ["12확통02-05", "12확통02-06"], "series-win-probability", "application"),
  P("m.h3.norm", "pst_normalBetween", [1, 2], 12, 2, ["12확통03-04"], "standardize-two-bounds", "calc"),
  P("m.h3.norm", "pst_normalFindParam", [1, 2], 12, 4, ["12확통03-04"], "inverse-table-lookup", "reverse"),
  P("m.h3.norm", "pst_normalSymmetric", [1], 18, 4, ["12확통03-04"], "symmetry-about-mean", "concept"),
  P("m.h3.norm", "pst_binomNormal", [1, 2], 12, 4, ["12확통03-04"], "binomial-normal-approximation", "application"),
  P("m.h3.norm", "pst_sampleSd", [1], 18, 3, ["12확통03-06"], "sample-mean-moments", "concept"),
  P("m.h3.norm", "pst_sampleMeanNormal", [1, 2], 12, 4, ["12확통03-06", "12확통03-04"], "sample-mean-standardize", "application"),
  P("m.el.sta1", "pst_sampleMeanDist", [1, 2], 12, 3, ["12확통03-05"], "sampling-distribution-enumeration", "counting"),
  P("m.el.sta1", "pst_stratified", [1], 18, 2, ["12확통03-05"], "proportional-allocation", "calc"),
  P("m.el.sta2", "pst_ciBounds", [1], 18, 3, ["12확통03-07"], "confidence-interval-endpoint", "calc"),
  P("m.el.sta2", "pst_ciSampleSize", [1], 18, 4, ["12확통03-07"], "interval-length-sample-size", "reverse"),
];
