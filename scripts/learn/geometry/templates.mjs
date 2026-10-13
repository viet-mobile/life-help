// Presentation templates of the geometry lessons: Korean (canonical) and English (the reference kit every other locale translates).
// {name} style variables are replaced by build-geometry.mjs; "@key" values name an entry of WORDS. Math is written as $...$ (KaTeX).
// Template layout: key: { ko: [prompt, [hint1, hint2], explanation], en: [...] }
export const WORDS = {
  tri: ["triangle", "삼각형"], quad: ["quadrilateral", "사각형"], circ: ["circle", "원"], pent: ["pentagon", "오각형"], hex: ["hexagon", "육각형"],
  rect: ["rectangle", "직사각형"], square: ["square", "정사각형"], trap: ["trapezoid", "사다리꼴"], para: ["parallelogram", "평행사변형"], rhom: ["rhombus", "마름모"],
  cube: ["cube", "정육면체"], cuboid: ["cuboid (box shape)", "직육면체"], cyl: ["cylinder", "원기둥"], sph: ["sphere", "구"], cone: ["cone", "원뿔"],
  acute: ["acute angle", "예각"], right: ["right angle", "직각"], obtuse: ["obtuse angle", "둔각"],
  faces: ["faces", "면"], edges: ["edges", "모서리"], vertices: ["vertices", "꼭짓점"],
  triP: ["triangles", "삼각형"], squareP: ["squares", "사각형"], circP: ["circles", "원"],
  iso: ["isosceles triangle", "이등변삼각형"], equi: ["equilateral triangle", "정삼각형"], rtri: ["right triangle", "직각삼각형"],
  sss: ["Three pairs of sides are equal (SSS)", "세 변의 길이가 각각 같다 (SSS 합동)"], sas: ["Two sides and the angle between them are equal (SAS)", "두 변의 길이와 그 끼인각의 크기가 각각 같다 (SAS 합동)"], asa: ["One side and the two angles at its ends are equal (ASA)", "한 변의 길이와 그 양 끝 각의 크기가 각각 같다 (ASA 합동)"],
  yes: ["Yes, it is a right triangle", "네, 직각삼각형이에요"], no: ["No, it is not a right triangle", "아니요, 직각삼각형이 아니에요"],
};

export const TEMPLATES = {
  nameShape: {
    ko: ["이 도형의 이름은 무엇일까요?", ["변과 꼭짓점의 수를 세어 보세요.", "곧은 변이 있는지, 둥근지 살펴보세요."], "이 도형의 이름은 {name}입니다."],
    en: ["What is the name of this shape?", ["Count the sides and the corners.", "Check whether it has straight sides or is round."], "This shape is called a {name}."],
  },
  nameSolid: {
    ko: ["이 입체도형의 이름은 무엇일까요?", ["어느 방향에서 봐도 둥근지 살펴보세요.", "평평한 면이 몇 개인지 세어 보세요."], "이 입체도형은 {name}입니다."],
    en: ["What is the name of this solid shape?", ["Is it round from every side?", "Count the flat faces."], "This solid shape is a {name}."],
  },
  countOf: {
    ko: ["그림에서 {shape}은 모두 몇 개일까요?", ["모양별로 하나씩 표시하며 세어 보세요.", "같은 도형을 두 번 세지 않도록 조심하세요."], "{shape}은 모두 {ans}개입니다."],
    en: ["How many {shape} are there in the picture?", ["Mark each one as you count it.", "Be careful not to count the same shape twice."], "There are {ans} {shape}."],
  },
  countVertices: {
    ko: ["이 도형의 꼭짓점은 몇 개일까요?", ["꼭짓점은 두 변이 만나는 뾰족한 점이에요.", "뾰족한 곳을 하나씩 세어 보세요."], "꼭짓점은 {ans}개입니다."],
    en: ["How many vertices (corners) does this shape have?", ["A vertex is a point where two sides meet.", "Count the pointed corners one by one."], "It has {ans} vertices."],
  },
  countSides: {
    ko: ["이 도형의 변은 몇 개일까요?", ["변은 도형을 이루는 곧은 선이에요.", "한 바퀴 돌며 변을 하나씩 세어 보세요."], "변은 {ans}개입니다."],
    en: ["How many sides does this shape have?", ["A side is a straight edge of the shape.", "Go around the shape and count the sides."], "It has {ans} sides."],
  },
  rulerRead: {
    ko: ["자를 보고 선의 길이를 구하세요. (cm)", ["선이 시작하는 눈금과 끝나는 눈금을 찾아보세요.", "끝 눈금에서 시작 눈금을 빼 보세요."], "선은 {from}에서 {to}까지이므로 길이는 {ans} cm입니다."],
    en: ["Use the ruler to find the length of the line. (cm)", ["Find where the line starts and where it ends.", "Subtract the starting mark from the ending mark."], "The line goes from {from} to {to}, so its length is {ans} cm."],
  },
  lengthDiff: {
    ko: ["위쪽 선은 아래쪽 선보다 몇 cm 더 길까요? (cm)", ["두 선의 길이를 먼저 읽어 보세요.", "긴 길이에서 짧은 길이를 빼 보세요."], "{a}-{b}={ans}이므로 {ans} cm 더 깁니다."],
    en: ["How many cm longer is the upper line than the lower line? (cm)", ["Read both lengths first.", "Subtract the shorter length from the longer one."], "{a}-{b}={ans}, so it is {ans} cm longer."],
  },
  rightAngles: {
    ko: ["이 도형에서 직각은 모두 몇 개일까요?", ["직각은 네모 모양 표시가 있는 'ㄴ' 모양의 각이에요.", "각 꼭짓점을 하나씩 살펴보세요."], "직각은 {ans}개입니다."],
    en: ["How many right angles does this shape have?", ["A right angle looks like the corner of a square.", "Check each corner one at a time."], "It has {ans} right angles."],
  },
  clockMinutes: {
    ko: ["시계가 {h}시 몇 분을 가리키고 있나요? 몇 분인지 쓰세요. (분)", ["긴바늘이 가리키는 숫자에 5를 곱해요.", "긴바늘이 6을 가리키면 30분이에요."], "긴바늘이 {n}을 가리키므로 ${n}\\times5={ans}$분입니다."],
    en: ["The clock shows {h} o'clock and some minutes. How many minutes? (min)", ["Multiply the number the long hand points to by 5.", "If the long hand points to 6 it is 30 minutes."], "The long hand points to {n}, so ${n}\\times5={ans}$ minutes."],
  },
  mToCm: {
    ko: ["{m} m {c} cm는 몇 cm일까요? (cm)", ["1 m는 100 cm예요.", "m를 cm로 바꾼 뒤 남은 cm를 더해요."], "${m}\\times100+{c}={ans}$이므로 {ans} cm입니다."],
    en: ["How many cm is {m} m {c} cm? (cm)", ["1 m is 100 cm.", "Change the m to cm, then add the remaining cm."], "${m}\\times100+{c}={ans}$, so it is {ans} cm."],
  },
  triType: {
    ko: ["변의 길이가 그림과 같은 삼각형은 어떤 삼각형일까요?", ["세 변의 길이를 비교해 보세요.", "두 변이 같으면 이등변삼각형, 세 변이 모두 같으면 정삼각형이에요."], "이 삼각형은 {name}입니다."],
    en: ["What kind of triangle has the side lengths shown?", ["Compare the three side lengths.", "Two equal sides: isosceles. Three equal sides: equilateral."], "This triangle is an {name}."],
  },
  congruentCond: {
    ko: ["두 삼각형은 합동입니다. 어떤 합동 조건을 이용하면 될까요?", ["두 삼각형에서 길이가 같은 변과 크기가 같은 각이 무엇인지 찾아보세요.", "변만 같으면 SSS, 두 변과 끼인각이면 SAS, 한 변과 양 끝 각이면 ASA예요."], "그림에서 같은 것은 {cond}이므로 이 조건을 이용합니다."],
    en: ["The two triangles are congruent. Which congruence condition applies?", ["Find which sides are equal and which angles are equal.", "Only sides: SSS. Two sides and the included angle: SAS. One side and the two angles at its ends: ASA."], "The equal parts in the picture are: {cond}. So this is the condition used."],
  },
  circleDiameter: {
    ko: ["원의 반지름이 {r} cm일 때, 지름은 몇 cm일까요? (cm)", ["지름은 원의 중심을 지나는 가장 긴 선분이에요.", "지름은 반지름의 2배예요."], "{r}×2={ans}이므로 지름은 {ans} cm입니다."],
    en: ["The radius of a circle is {r} cm. What is the diameter? (cm)", ["The diameter is the longest segment through the centre.", "The diameter is twice the radius."], "{r}×2={ans}, so the diameter is {ans} cm."],
  },
  circleRadius: {
    ko: ["원의 지름이 {d} cm일 때, 반지름은 몇 cm일까요? (cm)", ["반지름은 중심에서 원 위의 한 점까지의 길이예요.", "반지름은 지름의 반이에요."], "{d}÷2={ans}이므로 반지름은 {ans} cm입니다."],
    en: ["The diameter of a circle is {d} cm. What is the radius? (cm)", ["The radius goes from the centre to the circle.", "The radius is half of the diameter."], "{d}÷2={ans}, so the radius is {ans} cm."],
  },
  angleType: {
    ko: ["${a}^\\circ$인 각은 어떤 각일까요?", ["직각은 $90^\\circ$예요.", "$90^\\circ$보다 작으면 예각, 크면 둔각이에요."], "${a}^\\circ$는 {name}입니다."],
    en: ["What kind of angle is ${a}^\\circ$?", ["A right angle is $90^\\circ$.", "Smaller than $90^\\circ$ is acute; larger is obtuse."], "${a}^\\circ$ is called an {name}."],
  },
  angleThird: {
    ko: ["삼각형의 두 각이 ${a}^\\circ$, ${b}^\\circ$일 때, 나머지 한 각은 몇 도일까요? (도)", ["삼각형의 세 각의 합은 $180^\\circ$예요.", "$180$에서 아는 두 각을 빼 보세요."], "$180-{a}-{b}={ans}$이므로 나머지 각은 ${ans}^\\circ$입니다."],
    en: ["Two angles of a triangle are ${a}^\\circ$ and ${b}^\\circ$. What is the third angle? (degrees)", ["The three angles of a triangle add up to $180^\\circ$.", "Subtract the two known angles from $180$."], "$180-{a}-{b}={ans}$, so the third angle is ${ans}^\\circ$."],
  },
  angleQuad: {
    ko: ["사각형의 세 각이 ${a}^\\circ$, ${b}^\\circ$, ${c}^\\circ$일 때, 나머지 한 각은 몇 도일까요? (도)", ["사각형의 네 각의 합은 $360^\\circ$예요.", "$360$에서 아는 세 각을 빼 보세요."], "$360-{a}-{b}-{c}={ans}$이므로 나머지 각은 ${ans}^\\circ$입니다."],
    en: ["Three angles of a quadrilateral are ${a}^\\circ$, ${b}^\\circ$ and ${c}^\\circ$. What is the fourth angle? (degrees)", ["The four angles of a quadrilateral add up to $360^\\circ$.", "Subtract the three known angles from $360$."], "$360-{a}-{b}-{c}={ans}$, so the fourth angle is ${ans}^\\circ$."],
  },
  quadName: {
    ko: ["이 사각형의 이름은 무엇일까요?", ["마주 보는 변이 평행한지 살펴보세요.", "네 변의 길이와 각이 모두 같은지도 확인해 보세요."], "이 사각형의 이름은 {name}입니다."],
    en: ["What is the name of this quadrilateral?", ["Check whether opposite sides are parallel.", "Also check whether all sides and angles are equal."], "This quadrilateral is a {name}."],
  },
  diagonals: {
    ko: ["이 도형의 대각선은 모두 몇 개일까요?", ["대각선은 이웃하지 않는 두 꼭짓점을 잇는 선분이에요.", "한 꼭짓점에서 그을 수 있는 대각선을 먼저 세어 보세요."], "대각선은 모두 {ans}개입니다."],
    en: ["How many diagonals does this shape have?", ["A diagonal joins two vertices that are not next to each other.", "First count the diagonals from one vertex."], "It has {ans} diagonals."],
  },
  perimeterRect: {
    ko: ["직사각형의 둘레는 몇 cm일까요? (cm)", ["둘레는 도형의 바깥 테두리 길이예요.", "가로와 세로를 더한 뒤 2배 해요."], "$({w}+{h})\\times2={ans}$이므로 둘레는 {ans} cm입니다."],
    en: ["What is the perimeter of the rectangle? (cm)", ["The perimeter is the distance around the shape.", "Add the width and the height, then double it."], "$({w}+{h})\\times2={ans}$, so the perimeter is {ans} cm."],
  },
  areaRect: {
    ko: ["직사각형의 넓이는 몇 cm²일까요? (cm²)", ["직사각형의 넓이는 가로×세로예요.", "그림에 적힌 두 길이를 곱해 보세요."], "${w}\\times{h}={ans}$이므로 넓이는 {ans} cm²입니다."],
    en: ["What is the area of the rectangle? (cm²)", ["The area of a rectangle is width × height.", "Multiply the two lengths shown."], "${w}\\times{h}={ans}$, so the area is {ans} cm²."],
  },
  areaSquare: {
    ko: ["한 변이 {s} cm인 정사각형의 넓이는 몇 cm²일까요? (cm²)", ["정사각형은 네 변의 길이가 같아요.", "한 변의 길이를 두 번 곱해요."], "${s}\\times{s}={ans}$이므로 넓이는 {ans} cm²입니다."],
    en: ["A square has sides of {s} cm. What is its area? (cm²)", ["All four sides of a square are equal.", "Multiply the side length by itself."], "${s}\\times{s}={ans}$, so the area is {ans} cm²."],
  },
  areaTriangle: {
    ko: ["밑변이 {b} cm, 높이가 {h} cm인 삼각형의 넓이는 몇 cm²일까요? (cm²)", ["삼각형의 넓이는 (밑변)×(높이)÷2예요.", "높이는 밑변에 수직으로 잰 길이예요."], "${b}\\times{h}\\div2={ans}$이므로 넓이는 {ans} cm²입니다."],
    en: ["A triangle has base {b} cm and height {h} cm. What is its area? (cm²)", ["The area of a triangle is base × height ÷ 2.", "The height is measured at a right angle to the base."], "${b}\\times{h}\\div2={ans}$, so the area is {ans} cm²."],
  },
  areaParallelogram: {
    ko: ["밑변이 {b} cm, 높이가 {h} cm인 평행사변형의 넓이는 몇 cm²일까요? (cm²)", ["평행사변형의 넓이는 (밑변)×(높이)예요.", "비스듬한 변의 길이가 아니라 높이를 곱해요."], "${b}\\times{h}={ans}$이므로 넓이는 {ans} cm²입니다."],
    en: ["A parallelogram has base {b} cm and height {h} cm. What is its area? (cm²)", ["The area of a parallelogram is base × height.", "Use the height, not the slanted side."], "${b}\\times{h}={ans}$, so the area is {ans} cm²."],
  },
  areaTrapezoid: {
    ko: ["윗변이 {a} cm, 아랫변이 {b} cm, 높이가 {h} cm인 사다리꼴의 넓이는 몇 cm²일까요? (cm²)", ["사다리꼴의 넓이는 (윗변+아랫변)×(높이)÷2예요.", "먼저 윗변과 아랫변을 더해 보세요."], "$({a}+{b})\\times{h}\\div2={ans}$이므로 넓이는 {ans} cm²입니다."],
    en: ["A trapezoid has top {a} cm, bottom {b} cm and height {h} cm. What is its area? (cm²)", ["The area of a trapezoid is (top + bottom) × height ÷ 2.", "First add the top and the bottom."], "$({a}+{b})\\times{h}\\div2={ans}$, so the area is {ans} cm²."],
  },
  areaRhombus: {
    ko: ["두 대각선의 길이가 {d1} cm, {d2} cm인 마름모의 넓이는 몇 cm²일까요? (cm²)", ["마름모의 넓이는 (한 대각선)×(다른 대각선)÷2예요.", "두 대각선의 길이를 곱한 뒤 2로 나눠요."], "${d1}\\times{d2}\\div2={ans}$이므로 넓이는 {ans} cm²입니다."],
    en: ["The diagonals of a rhombus are {d1} cm and {d2} cm. What is its area? (cm²)", ["The area of a rhombus is one diagonal × the other diagonal ÷ 2.", "Multiply the diagonals, then divide by 2."], "${d1}\\times{d2}\\div2={ans}$, so the area is {ans} cm²."],
  },
  symmetryLines: {
    ko: ["이 도형의 대칭축은 모두 몇 개일까요?", ["대칭축은 접었을 때 두 부분이 겹치는 선이에요.", "가로, 세로, 대각선으로 접어 보세요."], "대칭축은 {ans}개입니다."],
    en: ["How many lines of symmetry does this shape have?", ["A line of symmetry folds the shape into two matching halves.", "Try folding horizontally, vertically and diagonally."], "It has {ans} lines of symmetry."],
  },
  congruentSide: {
    ko: ["두 삼각형은 합동입니다. 변 $x$의 길이는 몇 cm일까요? (cm)", ["합동인 도형은 모양과 크기가 같아요.", "서로 대응하는 변의 길이는 같아요."], "대응하는 변의 길이는 같으므로 $x={ans}$입니다."],
    en: ["The two triangles are congruent. What is the length of side $x$? (cm)", ["Congruent shapes have the same shape and size.", "Corresponding sides have equal lengths."], "Corresponding sides are equal, so $x={ans}$."],
  },
  solidCount: {
    ko: ["직육면체의 {item}은 모두 몇 개일까요?", ["상자 모양의 입체도형을 떠올려 보세요.", "위, 아래, 앞, 뒤, 양옆을 하나씩 살펴보세요."], "직육면체의 {item}은 {ans}개입니다."],
    en: ["How many {item} does a cuboid have?", ["Picture a box.", "Look at the top, bottom, front, back and both sides."], "A cuboid has {ans} {item}."],
  },
  cuboidVolume: {
    ko: ["가로 {l} cm, 세로 {w} cm, 높이 {h} cm인 직육면체의 부피는 몇 cm³일까요? (cm³)", ["직육면체의 부피는 가로×세로×높이예요.", "세 길이를 차례로 곱해 보세요."], "${l}\\times{w}\\times{h}={ans}$이므로 부피는 {ans} cm³입니다."],
    en: ["A cuboid is {l} cm long, {w} cm wide and {h} cm high. What is its volume? (cm³)", ["The volume of a cuboid is length × width × height.", "Multiply the three lengths."], "${l}\\times{w}\\times{h}={ans}$, so the volume is {ans} cm³."],
  },
  cubeVolume: {
    ko: ["한 모서리가 {e} cm인 정육면체의 부피는 몇 cm³일까요? (cm³)", ["정육면체는 모든 모서리의 길이가 같아요.", "한 모서리의 길이를 세 번 곱해요."], "${e}\\times{e}\\times{e}={ans}$이므로 부피는 {ans} cm³입니다."],
    en: ["A cube has edges of {e} cm. What is its volume? (cm³)", ["All edges of a cube are equal.", "Multiply the edge length by itself three times."], "${e}\\times{e}\\times{e}={ans}$, so the volume is {ans} cm³."],
  },
  cuboidSurface: {
    ko: ["가로 {l} cm, 세로 {w} cm, 높이 {h} cm인 직육면체의 겉넓이는 몇 cm²일까요? (cm²)", ["겉넓이는 여섯 면의 넓이의 합이에요.", "마주 보는 면은 넓이가 같아요. (가로×세로+세로×높이+가로×높이)×2"], "$({l}\\times{w}+{w}\\times{h}+{l}\\times{h})\\times2={ans}$이므로 겉넓이는 {ans} cm²입니다."],
    en: ["A cuboid is {l} cm long, {w} cm wide and {h} cm high. What is its surface area? (cm²)", ["The surface area is the sum of the six faces.", "Opposite faces are equal: (lw + wh + lh) × 2."], "$({l}\\times{w}+{w}\\times{h}+{l}\\times{h})\\times2={ans}$, so the surface area is {ans} cm²."],
  },
  edgeSum: {
    ko: ["가로 {l} cm, 세로 {w} cm, 높이 {h} cm인 직육면체의 모든 모서리의 길이의 합은 몇 cm일까요? (cm)", ["직육면체의 모서리는 12개예요.", "가로, 세로, 높이 모서리가 각각 4개씩 있어요."], "$({l}+{w}+{h})\\times4={ans}$이므로 {ans} cm입니다."],
    en: ["A cuboid is {l} cm long, {w} cm wide and {h} cm high. What is the total length of all its edges? (cm)", ["A cuboid has 12 edges.", "There are 4 edges each of length, width and height."], "$({l}+{w}+{h})\\times4={ans}$, so the total is {ans} cm."],
  },
  circumference: {
    ko: ["반지름이 {r} cm인 원의 둘레는 몇 cm일까요? (원주율 $3.14$) (cm)", ["원의 둘레=(지름)×(원주율)이에요.", "지름은 반지름의 2배예요."], "${r}\\times2\\times3.14={ans}$이므로 둘레는 {ans} cm입니다."],
    en: ["A circle has radius {r} cm. What is its circumference? (use $\\pi=3.14$) (cm)", ["Circumference = diameter × π.", "The diameter is twice the radius."], "${r}\\times2\\times3.14={ans}$, so the circumference is {ans} cm."],
  },
  circleArea: {
    ko: ["반지름이 {r} cm인 원의 넓이는 몇 cm²일까요? (원주율 $3.14$) (cm²)", ["원의 넓이=(반지름)×(반지름)×(원주율)이에요.", "반지름을 두 번 곱한 뒤 3.14를 곱해요."], "${r}\\times{r}\\times3.14={ans}$이므로 넓이는 {ans} cm²입니다."],
    en: ["A circle has radius {r} cm. What is its area? (use $\\pi=3.14$) (cm²)", ["Area = radius × radius × π.", "Multiply the radius by itself, then by 3.14."], "${r}\\times{r}\\times3.14={ans}$, so the area is {ans} cm²."],
  },
  prismFaces: {
    ko: ["밑면이 {n}각형인 각기둥의 면은 모두 몇 개일까요?", ["각기둥에는 밑면 2개와 옆면이 있어요.", "옆면의 수는 밑면의 변의 수와 같아요."], "옆면 {n}개와 밑면 2개를 합해 {ans}개입니다."],
    en: ["How many faces does a prism with a {n}-sided base have?", ["A prism has 2 bases and some side faces.", "The number of side faces equals the number of sides of the base."], "{n} side faces plus 2 bases is {ans} faces."],
  },
  adjacentAngle: {
    ko: ["직선 위에서 한 각이 ${a}^\\circ$일 때, 이웃한 각은 몇 도일까요? (도)", ["일직선이 이루는 각은 $180^\\circ$예요.", "$180$에서 아는 각을 빼 보세요."], "$180-{a}={ans}$이므로 ${ans}^\\circ$입니다."],
    en: ["On a straight line one angle is ${a}^\\circ$. What is the adjacent angle? (degrees)", ["Angles on a straight line add up to $180^\\circ$.", "Subtract the known angle from $180$."], "$180-{a}={ans}$, so it is ${ans}^\\circ$."],
  },
  verticalAngle: {
    ko: ["두 직선이 만날 때 한 각이 ${a}^\\circ$입니다. 그 맞꼭지각은 몇 도일까요? (도)", ["맞꼭지각은 마주 보는 각이에요.", "맞꼭지각의 크기는 서로 같아요."], "맞꼭지각은 크기가 같으므로 ${ans}^\\circ$입니다."],
    en: ["Two lines cross and one angle is ${a}^\\circ$. What is the vertically opposite angle? (degrees)", ["Vertically opposite angles face each other.", "They are equal in size."], "Vertically opposite angles are equal, so it is ${ans}^\\circ$."],
  },
  parallelAngle: {
    ko: ["평행한 두 직선 $l$, $m$과 한 직선이 만납니다. 한 각이 ${a}^\\circ$일 때 $x$의 크기는 몇 도일까요? (도)", ["평행선에서 동위각의 크기는 같아요.", "엇각의 크기도 같아요."], "평행선에서 동위각(엇각)은 같으므로 $x={ans}$입니다."],
    en: ["Two parallel lines $l$ and $m$ are cut by a transversal. One angle is ${a}^\\circ$. What is $x$? (degrees)", ["Corresponding angles on parallel lines are equal.", "Alternate angles are equal as well."], "Corresponding (alternate) angles on parallel lines are equal, so $x={ans}$."],
  },
  polygonSum: {
    ko: ["변이 {n}개인 다각형의 내각의 크기의 합은 몇 도일까요? (도)", ["변이 {n}개인 다각형은 삼각형 {m}개로 나눌 수 있어요.", "삼각형 하나의 내각의 합은 $180^\\circ$예요."], "$180\\times{m}={ans}$이므로 ${ans}^\\circ$입니다."],
    en: ["What is the sum of the interior angles of a polygon with {n} sides? (degrees)", ["A polygon with {n} sides splits into {m} triangles.", "Each triangle has angle sum $180^\\circ$."], "$180\\times{m}={ans}$, so the sum is ${ans}^\\circ$."],
  },
  regularAngle: {
    ko: ["변이 {n}개인 정다각형의 한 내각의 크기는 몇 도일까요? (도)", ["먼저 내각의 합을 구해요: $180\\times({n}-2)$.", "합을 변의 수 {n}로 나눠요."], "$180\\times({n}-2)\\div{n}={ans}$이므로 ${ans}^\\circ$입니다."],
    en: ["What is one interior angle of a regular polygon with {n} sides? (degrees)", ["First find the sum: $180\\times({n}-2)$.", "Divide the sum by the number of sides {n}."], "$180\\times({n}-2)\\div{n}={ans}$, so each angle is ${ans}^\\circ$."],
  },
  arcLength: {
    ko: ["반지름이 {r} cm이고 중심각이 ${a}^\\circ$인 부채꼴의 호의 길이는 $k\\pi$ cm입니다. $k$의 값은?", ["호의 길이는 $2\\pi r\\times\\frac{a}{360}$이에요.", "중심각이 원 전체의 몇 분의 몇인지 먼저 구해요."], "$2\\times{r}\\times\\frac{{a}}{360}={ans}$이므로 $k={ans}$입니다."],
    en: ["A sector has radius {r} cm and central angle ${a}^\\circ$. Its arc length is $k\\pi$ cm. What is $k$?", ["Arc length is $2\\pi r\\times\\frac{a}{360}$.", "First find what fraction of the whole circle the angle is."], "$2\\times{r}\\times\\frac{{a}}{360}={ans}$, so $k={ans}$."],
  },
  sectorArea: {
    ko: ["반지름이 {r} cm이고 중심각이 ${a}^\\circ$인 부채꼴의 넓이는 $k\\pi$ cm²입니다. $k$의 값은?", ["부채꼴의 넓이는 $\\pi r^2\\times\\frac{a}{360}$이에요.", "원의 넓이에 중심각의 비율을 곱해요."], "${r}^2\\times\\frac{{a}}{360}={ans}$이므로 $k={ans}$입니다."],
    en: ["A sector has radius {r} cm and central angle ${a}^\\circ$. Its area is $k\\pi$ cm². What is $k$?", ["Sector area is $\\pi r^2\\times\\frac{a}{360}$.", "Multiply the circle's area by the fraction of the angle."], "${r}^2\\times\\frac{{a}}{360}={ans}$, so $k={ans}$."],
  },
  cylinderVolume: {
    ko: ["밑면의 반지름이 {r} cm, 높이가 {h} cm인 원기둥의 부피는 $k\\pi$ cm³입니다. $k$의 값은?", ["원기둥의 부피는 (밑면의 넓이)×(높이)예요.", "밑면의 넓이는 $\\pi r^2$이에요."], "${r}^2\\times{h}={ans}$이므로 $k={ans}$입니다."],
    en: ["A cylinder has base radius {r} cm and height {h} cm. Its volume is $k\\pi$ cm³. What is $k$?", ["Volume = base area × height.", "The base area is $\\pi r^2$."], "${r}^2\\times{h}={ans}$, so $k={ans}$."],
  },
  coneVolume: {
    ko: ["밑면의 반지름이 {r} cm, 높이가 {h} cm인 원뿔의 부피는 $k\\pi$ cm³입니다. $k$의 값은?", ["원뿔의 부피는 (밑면의 넓이)×(높이)÷3이에요.", "밑면의 넓이는 $\\pi r^2$이에요."], "${r}^2\\times{h}\\div3={ans}$이므로 $k={ans}$입니다."],
    en: ["A cone has base radius {r} cm and height {h} cm. Its volume is $k\\pi$ cm³. What is $k$?", ["Volume = base area × height ÷ 3.", "The base area is $\\pi r^2$."], "${r}^2\\times{h}\\div3={ans}$, so $k={ans}$."],
  },
  sphereVolume: {
    ko: ["반지름이 {r} cm인 구의 부피는 $k\\pi$ cm³입니다. $k$의 값은?", ["구의 부피는 $\\frac{4}{3}\\pi r^3$이에요.", "반지름을 세 번 곱한 뒤 $\\frac{4}{3}$를 곱해요."], "$\\frac{4}{3}\\times{r}^3={ans}$이므로 $k={ans}$입니다."],
    en: ["A sphere has radius {r} cm. Its volume is $k\\pi$ cm³. What is $k$?", ["The volume of a sphere is $\\frac{4}{3}\\pi r^3$.", "Cube the radius, then multiply by $\\frac{4}{3}$."], "$\\frac{4}{3}\\times{r}^3={ans}$, so $k={ans}$."],
  },
  sphereSurface: {
    ko: ["반지름이 {r} cm인 구의 겉넓이는 $k\\pi$ cm²입니다. $k$의 값은?", ["구의 겉넓이는 $4\\pi r^2$이에요.", "반지름을 제곱한 뒤 4를 곱해요."], "$4\\times{r}^2={ans}$이므로 $k={ans}$입니다."],
    en: ["A sphere has radius {r} cm. Its surface area is $k\\pi$ cm². What is $k$?", ["The surface area of a sphere is $4\\pi r^2$.", "Square the radius, then multiply by 4."], "$4\\times{r}^2={ans}$, so $k={ans}$."],
  },
  cylinderSurface: {
    ko: ["밑면의 반지름이 {r} cm, 높이가 {h} cm인 원기둥의 겉넓이는 $k\\pi$ cm²입니다. $k$의 값은?", ["겉넓이=(밑넓이)×2+(옆넓이)예요.", "옆넓이는 (밑면의 둘레)×(높이)=$2\\pi r\\times h$예요."], "$2\\times{r}^2+2\\times{r}\\times{h}={ans}$이므로 $k={ans}$입니다."],
    en: ["A cylinder has base radius {r} cm and height {h} cm. Its surface area is $k\\pi$ cm². What is $k$?", ["Surface area = 2 × base area + lateral area.", "The lateral area is (circumference) × height $=2\\pi r\\times h$."], "$2\\times{r}^2+2\\times{r}\\times{h}={ans}$, so $k={ans}$."],
  },
  isoscelesApex: {
    ko: ["이등변삼각형의 한 밑각이 ${b}^\\circ$일 때, 꼭지각은 몇 도일까요? (도)", ["이등변삼각형의 두 밑각은 크기가 같아요.", "세 각의 합 $180^\\circ$에서 밑각 두 개를 빼요."], "$180-{b}\\times2={ans}$이므로 꼭지각은 ${ans}^\\circ$입니다."],
    en: ["A base angle of an isosceles triangle is ${b}^\\circ$. What is the apex angle? (degrees)", ["The two base angles of an isosceles triangle are equal.", "Subtract both base angles from $180^\\circ$."], "$180-{b}\\times2={ans}$, so the apex angle is ${ans}^\\circ$."],
  },
  parallelogramAngle: {
    ko: ["평행사변형 ABCD에서 $\\angle A={a}^\\circ$일 때, $\\angle B$는 몇 도일까요? (도)", ["평행사변형에서 이웃한 두 각의 합은 $180^\\circ$예요.", "$180$에서 $\\angle A$를 빼요."], "$180-{a}={ans}$이므로 $\\angle B={ans}^\\circ$입니다."],
    en: ["In parallelogram ABCD, $\\angle A={a}^\\circ$. What is $\\angle B$? (degrees)", ["Adjacent angles of a parallelogram add up to $180^\\circ$.", "Subtract $\\angle A$ from $180$."], "$180-{a}={ans}$, so $\\angle B={ans}^\\circ$."],
  },
  midSegment: {
    ko: ["삼각형의 두 변의 중점을 이은 선분 $x$는 나머지 한 변 {s} cm와 평행합니다. $x$의 길이는 몇 cm일까요? (cm)", ["두 변의 중점을 이은 선분의 길이는 나머지 변의 길이의 절반이에요.", "{s}를 2로 나눠 보세요."], "${s}\\div2={ans}$이므로 $x={ans}$ cm입니다."],
    en: ["In a triangle, segment $x$ joins the midpoints of two sides and is parallel to the third side, which is {s} cm. What is $x$? (cm)", ["The segment joining two midpoints is half of the third side.", "Divide {s} by 2."], "${s}\\div2={ans}$, so $x={ans}$ cm."],
  },
  similarSide: {
    ko: ["두 삼각형은 닮음입니다. 변 $x$의 길이는 몇 cm일까요? (cm)", ["닮은 도형에서 대응하는 변의 길이의 비는 같아요.", "닮음비를 먼저 구해 보세요."], "닮음비가 ${p}:{q}$이므로 $x={ans}$입니다."],
    en: ["The two triangles are similar. What is the length of side $x$? (cm)", ["In similar figures the ratios of corresponding sides are equal.", "Find the scale factor first."], "The ratio is ${p}:{q}$, so $x={ans}$."],
  },
  similarArea: {
    ko: ["닮음비가 ${p}:{q}$인 두 도형이 있습니다. 작은 도형의 넓이가 {s} cm²일 때 큰 도형의 넓이는 몇 cm²일까요? (cm²)", ["넓이의 비는 닮음비의 제곱이에요.", "작은 도형의 넓이에 $({q}/{p})^2$을 곱해요."], "넓이의 비는 ${p2}:{q2}$이므로 ${s}\\times\\frac{{q2}}{{p2}}={ans}$입니다."],
    en: ["Two similar figures have scale factor ${p}:{q}$. The smaller has area {s} cm². What is the area of the larger one? (cm²)", ["The ratio of areas is the square of the scale factor.", "Multiply the smaller area by $({q}/{p})^2$."], "The area ratio is ${p2}:{q2}$, so ${s}\\times\\frac{{q2}}{{p2}}={ans}$."],
  },
  pythagHyp: {
    ko: ["직각삼각형의 직각을 낀 두 변이 {a} cm, {b} cm일 때, 가장 긴 변 $x$는 몇 cm일까요? (cm)", ["피타고라스 정리: $a^2+b^2=c^2$.", "두 변을 각각 제곱해서 더한 뒤 제곱근을 구해요."], "${a}^2+{b}^2={c2}$이므로 $x={ans}$입니다."],
    en: ["The two shorter sides of a right triangle are {a} cm and {b} cm. What is the longest side $x$? (cm)", ["Pythagorean theorem: $a^2+b^2=c^2$.", "Square both sides, add them, then take the square root."], "${a}^2+{b}^2={c2}$, so $x={ans}$."],
  },
  pythagLeg: {
    ko: ["직각삼각형의 빗변이 {c} cm이고 한 변이 {a} cm일 때, 나머지 한 변 $x$는 몇 cm일까요? (cm)", ["$a^2+x^2=c^2$에서 $x^2=c^2-a^2$이에요.", "$c^2-a^2$의 제곱근을 구해요."], "${c}^2-{a}^2={x2}$이므로 $x={ans}$입니다."],
    en: ["A right triangle has hypotenuse {c} cm and one leg {a} cm. What is the other leg $x$? (cm)", ["From $a^2+x^2=c^2$, $x^2=c^2-a^2$.", "Take the square root of $c^2-a^2$."], "${c}^2-{a}^2={x2}$, so $x={ans}$."],
  },
  pythagCheck: {
    ko: ["세 변의 길이가 {a} cm, {b} cm, {c} cm인 삼각형은 직각삼각형일까요?", ["가장 긴 변을 빗변으로 놓고 $a^2+b^2$과 $c^2$을 비교해요.", "두 값이 같으면 직각삼각형이에요."], "${a}^2+{b}^2={s1}$, ${c}^2={s2}$이므로 {verdict}."],
    en: ["A triangle has sides {a} cm, {b} cm and {c} cm. Is it a right triangle?", ["Take the longest side as the hypotenuse and compare $a^2+b^2$ with $c^2$.", "If they are equal, it is a right triangle."], "${a}^2+{b}^2={s1}$ and ${c}^2={s2}$, so {verdict}."],
  },
  trigRatio: {
    ko: ["그림의 직각삼각형에서 $\\{fn} A$의 값은? (소수로 쓰세요)", ["$\\sin A$는 (높이)÷(빗변), $\\cos A$는 (밑변)÷(빗변), $\\tan A$는 (높이)÷(밑변)이에요.", "각 $A$를 기준으로 높이(마주 보는 변)와 밑변을 구분해요."], "$\\{fn} A=\\frac{{num}}{{den}}={ans}$입니다."],
    en: ["In the right triangle, what is $\\{fn} A$? (write a decimal)", ["$\\sin A$ = opposite ÷ hypotenuse, $\\cos A$ = adjacent ÷ hypotenuse, $\\tan A$ = opposite ÷ adjacent.", "Tell the opposite and adjacent sides apart from angle $A$."], "$\\{fn} A=\\frac{{num}}{{den}}={ans}$."],
  },
  specialAngle: {
    ko: ["$\\{fn}\\ {a}^\\circ$의 값은? (소수로 쓰세요)", ["$30^\\circ$, $45^\\circ$, $60^\\circ$의 삼각비 값을 떠올려 보세요.", "$\\sin30^\\circ=\\frac12$, $\\cos60^\\circ=\\frac12$, $\\tan45^\\circ=1$."], "$\\{fn}\\ {a}^\\circ={ans}$입니다."],
    en: ["What is $\\{fn}\\ {a}^\\circ$? (write a decimal)", ["Recall the values for $30^\\circ$, $45^\\circ$ and $60^\\circ$.", "$\\sin30^\\circ=\\frac12$, $\\cos60^\\circ=\\frac12$, $\\tan45^\\circ=1$."], "$\\{fn}\\ {a}^\\circ={ans}$."],
  },
  trigSide: {
    ko: ["직각삼각형에서 $\\tan A={t}$이고 밑변의 길이가 {adj}일 때, 높이 $x$는?", ["$\\tan A$는 (높이)÷(밑변)이에요.", "높이=$\\tan A\\times$(밑변)."], "$x={t}\\times{adj}={ans}$입니다."],
    en: ["In a right triangle $\\tan A={t}$ and the adjacent side is {adj}. What is the opposite side $x$?", ["$\\tan A$ = opposite ÷ adjacent.", "Opposite $=\\tan A\\times$ adjacent."], "$x={t}\\times{adj}={ans}$."],
  },
  inscribedAngle: {
    ko: ["호 AB에 대한 중심각이 ${c}^\\circ$일 때, 같은 호에 대한 원주각은 몇 도일까요? (도)", ["한 호에 대한 원주각의 크기는 중심각의 절반이에요.", "중심각을 2로 나눠요."], "${c}\\div2={ans}$이므로 원주각은 ${ans}^\\circ$입니다."],
    en: ["The central angle on arc AB is ${c}^\\circ$. What is the inscribed angle on the same arc? (degrees)", ["An inscribed angle is half the central angle on the same arc.", "Divide the central angle by 2."], "${c}\\div2={ans}$, so the inscribed angle is ${ans}^\\circ$."],
  },
  tangentLength: {
    ko: ["원 O 밖의 점 P에서 원에 그은 접선의 접점을 A라 합니다. $PO={po}$, 반지름이 {r}일 때 $PA$의 길이는?", ["접선은 반지름과 수직이에요. 삼각형 OAP는 직각삼각형이에요.", "피타고라스 정리로 $PA^2=PO^2-r^2$을 구해요."], "${po}^2-{r}^2={pa2}$이므로 $PA={ans}$입니다."],
    en: ["From a point P outside circle O a tangent touches the circle at A. $PO={po}$ and the radius is {r}. What is $PA$?", ["A tangent is perpendicular to the radius, so triangle OAP is right-angled.", "Use $PA^2=PO^2-r^2$."], "${po}^2-{r}^2={pa2}$, so $PA={ans}$."],
  },
  chordHalf: {
    ko: ["반지름이 {r}인 원에서 중심에서 현까지의 거리가 {d}일 때, 현의 길이는?", ["중심에서 현에 내린 수선은 현을 이등분해요.", "반 현의 길이는 $\\sqrt{r^2-d^2}$예요."], "반 현은 $\\sqrt{{r}^2-{d}^2}={half}$이므로 현의 길이는 ${ans}$입니다."],
    en: ["A circle has radius {r}. A chord is at distance {d} from the centre. What is the length of the chord?", ["The perpendicular from the centre bisects the chord.", "Half the chord is $\\sqrt{r^2-d^2}$."], "Half the chord is $\\sqrt{{r}^2-{d}^2}={half}$, so the chord is ${ans}$."],
  },
  cyclicAngle: {
    ko: ["원에 내접하는 사각형에서 한 각이 ${a}^\\circ$일 때, 그 대각(마주 보는 각)은 몇 도일까요? (도)", ["원에 내접하는 사각형의 대각의 합은 $180^\\circ$예요.", "$180$에서 주어진 각을 빼요."], "$180-{a}={ans}$이므로 ${ans}^\\circ$입니다."],
    en: ["A quadrilateral is inscribed in a circle and one angle is ${a}^\\circ$. What is the opposite angle? (degrees)", ["Opposite angles of a cyclic quadrilateral add up to $180^\\circ$.", "Subtract the given angle from $180$."], "$180-{a}={ans}$, so it is ${ans}^\\circ$."],
  },
  distance: {
    ko: ["좌표평면 위의 두 점 A({x1}, {y1}), B({x2}, {y2}) 사이의 거리는?", ["두 점 사이의 거리는 $\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$예요.", "가로 차이와 세로 차이를 각각 제곱해 더해요."], "$\\sqrt{{dx}^2+{dy}^2}=\\sqrt{{s}}={ans}$입니다."],
    en: ["What is the distance between the points A({x1}, {y1}) and B({x2}, {y2}) on the coordinate plane?", ["The distance is $\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$.", "Square the horizontal and vertical differences and add them."], "$\\sqrt{{dx}^2+{dy}^2}=\\sqrt{{s}}={ans}$."],
  },
  midpoint: {
    ko: ["두 점 A({x1}, {y1}), B({x2}, {y2})를 잇는 선분 AB의 중점의 ${axis}$좌표는?", ["중점의 좌표는 두 점의 좌표의 평균이에요.", "같은 좌표끼리 더해 2로 나눠요."], "$({u}+{v})\\div2={ans}$입니다."],
    en: ["What is the ${axis}$-coordinate of the midpoint of segment AB with A({x1}, {y1}) and B({x2}, {y2})?", ["The midpoint is the average of the coordinates.", "Add the matching coordinates and divide by 2."], "$({u}+{v})\\div2={ans}$."],
  },
  slope: {
    ko: ["두 점 A({x1}, {y1}), B({x2}, {y2})를 지나는 직선의 기울기는?", ["기울기는 ($y$의 변화량)÷($x$의 변화량)이에요.", "$\\frac{y_2-y_1}{x_2-x_1}$을 계산해요."], "$\\frac{{dy}}{{dx}}={ans}$입니다."],
    en: ["What is the slope of the line through A({x1}, {y1}) and B({x2}, {y2})?", ["Slope = (change in $y$) ÷ (change in $x$).", "Compute $\\frac{y_2-y_1}{x_2-x_1}$."], "$\\frac{{dy}}{{dx}}={ans}$."],
  },
  circleEqRadius: {
    ko: ["원 $(x-{a})^2+(y-{b})^2={r2}$의 반지름의 길이는?", ["원의 방정식 $(x-a)^2+(y-b)^2=r^2$에서 오른쪽 값이 $r^2$이에요.", "{r2}의 제곱근을 구해요."], "$r^2={r2}$이므로 $r={ans}$입니다."],
    en: ["What is the radius of the circle $(x-{a})^2+(y-{b})^2={r2}$?", ["In $(x-a)^2+(y-b)^2=r^2$ the right-hand side is $r^2$.", "Take the square root of {r2}."], "$r^2={r2}$, so $r={ans}$."],
  },
  circleEqCenter: {
    ko: ["원 $(x-{a})^2+(y-{b})^2={r2}$의 중심의 좌표를 $(p, q)$라 할 때, $p+q$의 값은?", ["중심의 좌표는 $(p, q)$예요.", "괄호 안의 $x-p$, $y-q$에서 $p$, $q$를 읽어요."], "$p+q={a}+{b}={ans}$입니다."],
    en: ["The circle $(x-{a})^2+(y-{b})^2={r2}$ has centre $(p, q)$. What is $p+q$?", ["The centre is $(p, q)$.", "Read $p$ and $q$ from $x-p$ and $y-q$."], "$p+q={a}+{b}={ans}$."],
  },
  pointLineDist: {
    ko: ["원점에서 직선 ${A}x+{B}y-{C}=0$까지의 거리는?", ["점과 직선 사이의 거리는 $\\frac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$예요.", "원점이면 $x_0=y_0=0$이에요."], "$\\frac{{C}}{\\sqrt{{A}^2+{B}^2}}=\\frac{{C}}{{ab}}={ans}$입니다."],
    en: ["What is the distance from the origin to the line ${A}x+{B}y-{C}=0$?", ["The distance from a point to a line is $\\frac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$.", "For the origin $x_0=y_0=0$."], "$\\frac{{C}}{\\sqrt{{A}^2+{B}^2}}=\\frac{{C}}{{ab}}={ans}$."],
  },
  lawSinesR: {
    ko: ["삼각형 ABC에서 $a={a}$, $\\angle A={A}^\\circ$일 때, 외접원의 반지름 $R$은?", ["사인법칙: $\\frac{a}{\\sin A}=2R$.", "$\\sin {A}^\\circ$의 값을 이용해 $R$을 구해요."], "$R=\\frac{a}{2\\sin A}=\\frac{{a}}{2\\times{sinA}}={ans}$입니다."],
    en: ["In triangle ABC, $a={a}$ and $\\angle A={A}^\\circ$. What is the circumradius $R$?", ["Law of sines: $\\frac{a}{\\sin A}=2R$.", "Use the value of $\\sin {A}^\\circ$ to find $R$."], "$R=\\frac{a}{2\\sin A}=\\frac{{a}}{2\\times{sinA}}={ans}$."],
  },
  lawCosines: {
    ko: ["삼각형 ABC에서 $a={a}$, $b={b}$, $\\angle C={C}^\\circ$일 때, $c$의 길이는?", ["코사인법칙: $c^2=a^2+b^2-2ab\\cos C$.", "$\\cos {C}^\\circ$의 값을 대입해요."], "$c^2={a}^2+{b}^2-2\\times{a}\\times{b}\\times{cosC}={c2}$이므로 $c={ans}$입니다."],
    en: ["In triangle ABC, $a={a}$, $b={b}$ and $\\angle C={C}^\\circ$. What is $c$?", ["Law of cosines: $c^2=a^2+b^2-2ab\\cos C$.", "Substitute the value of $\\cos {C}^\\circ$."], "$c^2={a}^2+{b}^2-2\\times{a}\\times{b}\\times{cosC}={c2}$, so $c={ans}$."],
  },
  areaSin: {
    ko: ["삼각형 ABC에서 $a={a}$, $b={b}$, $\\angle C={C}^\\circ$일 때, 넓이는?", ["넓이 $=\\frac12ab\\sin C$.", "$\\sin {C}^\\circ$의 값을 대입해요."], "$\\frac12\\times{a}\\times{b}\\times{sinC}={ans}$입니다."],
    en: ["In triangle ABC, $a={a}$, $b={b}$ and $\\angle C={C}^\\circ$. What is its area?", ["Area $=\\frac12ab\\sin C$.", "Substitute the value of $\\sin {C}^\\circ$."], "$\\frac12\\times{a}\\times{b}\\times{sinC}={ans}$."],
  },
  radianD: {
    ko: ["${a}^\\circ$를 라디안으로 나타내면 $\\frac{\\pi}{d}$입니다. $d$의 값은?", ["$180^\\circ=\\pi$ 라디안이에요.", "$\\frac{{a}}{180}\\pi$를 약분해 보세요."], "$\\frac{{a}}{180}\\pi=\\frac{\\pi}{{ans}}$이므로 $d={ans}$입니다."],
    en: ["${a}^\\circ$ equals $\\frac{\\pi}{d}$ radians. What is $d$?", ["$180^\\circ=\\pi$ radians.", "Simplify $\\frac{{a}}{180}\\pi$."], "$\\frac{{a}}{180}\\pi=\\frac{\\pi}{{ans}}$, so $d={ans}$."],
  },
  arcRad: {
    ko: ["반지름이 {r}, 중심각이 $\\frac{\\pi}{{d}}$인 부채꼴의 호의 길이는 $k\\pi$입니다. $k$의 값은?", ["호의 길이는 $l=r\\theta$예요.", "$r$에 $\\theta=\\frac{\\pi}{{d}}$를 곱해요."], "$l={r}\\times\\frac{\\pi}{{d}}={ans}\\pi$이므로 $k={ans}$입니다."],
    en: ["A sector has radius {r} and central angle $\\frac{\\pi}{{d}}$. Its arc length is $k\\pi$. What is $k$?", ["Arc length is $l=r\\theta$.", "Multiply $r$ by $\\theta=\\frac{\\pi}{{d}}$."], "$l={r}\\times\\frac{\\pi}{{d}}={ans}\\pi$, so $k={ans}$."],
  },
  sectorRad: {
    ko: ["반지름이 {r}, 중심각이 $\\frac{\\pi}{{d}}$인 부채꼴의 넓이는 $k\\pi$입니다. $k$의 값은?", ["부채꼴의 넓이는 $S=\\frac12r^2\\theta$예요.", "$r^2$에 $\\theta$를 곱하고 $\\frac12$을 곱해요."], "$S=\\frac12\\times{r}^2\\times\\frac{\\pi}{{d}}={ans}\\pi$이므로 $k={ans}$입니다."],
    en: ["A sector has radius {r} and central angle $\\frac{\\pi}{{d}}$. Its area is $k\\pi$. What is $k$?", ["Sector area is $S=\\frac12r^2\\theta$.", "Multiply $r^2$ by $\\theta$, then by $\\frac12$."], "$S=\\frac12\\times{r}^2\\times\\frac{\\pi}{{d}}={ans}\\pi$, so $k={ans}$."],
  },
  parabolaFocus: {
    ko: ["포물선 $y^2={k}x$의 초점의 $x$좌표는?", ["$y^2=4px$의 초점은 $(p, 0)$이에요.", "$4p={k}$에서 $p$를 구해요."], "$4p={k}$이므로 $p={ans}$입니다."],
    en: ["What is the $x$-coordinate of the focus of the parabola $y^2={k}x$?", ["The focus of $y^2=4px$ is $(p, 0)$.", "Solve $4p={k}$ for $p$."], "$4p={k}$, so $p={ans}$."],
  },
  ellipseFocal: {
    ko: ["타원 $\\frac{x^2}{{a2}}+\\frac{y^2}{{b2}}=1$의 두 초점은 $(\\pm c, 0)$입니다. $c$의 값은?", ["타원에서 $c^2=a^2-b^2$이에요.", "{a2}에서 {b2}를 빼고 제곱근을 구해요."], "$c^2={a2}-{b2}={c2}$이므로 $c={ans}$입니다."],
    en: ["The ellipse $\\frac{x^2}{{a2}}+\\frac{y^2}{{b2}}=1$ has foci $(\\pm c, 0)$. What is $c$?", ["For an ellipse $c^2=a^2-b^2$.", "Subtract {b2} from {a2} and take the square root."], "$c^2={a2}-{b2}={c2}$, so $c={ans}$."],
  },
  hyperbolaFocal: {
    ko: ["쌍곡선 $\\frac{x^2}{{a2}}-\\frac{y^2}{{b2}}=1$의 두 초점은 $(\\pm c, 0)$입니다. $c$의 값은?", ["쌍곡선에서 $c^2=a^2+b^2$이에요.", "{a2}와 {b2}를 더하고 제곱근을 구해요."], "$c^2={a2}+{b2}={c2}$이므로 $c={ans}$입니다."],
    en: ["The hyperbola $\\frac{x^2}{{a2}}-\\frac{y^2}{{b2}}=1$ has foci $(\\pm c, 0)$. What is $c$?", ["For a hyperbola $c^2=a^2+b^2$.", "Add {a2} and {b2} and take the square root."], "$c^2={a2}+{b2}={c2}$, so $c={ans}$."],
  },
  vectorMag: {
    ko: ["벡터 $\\vec{a}=({x}, {y})$의 크기 $|\\vec{a}|$는?", ["$|\\vec{a}|=\\sqrt{x^2+y^2}$.", "성분을 각각 제곱해 더한 뒤 제곱근을 구해요."], "$\\sqrt{{x}^2+{y}^2}=\\sqrt{{s}}={ans}$입니다."],
    en: ["What is the magnitude $|\\vec{a}|$ of the vector $\\vec{a}=({x}, {y})$?", ["$|\\vec{a}|=\\sqrt{x^2+y^2}$.", "Square each component, add, and take the square root."], "$\\sqrt{{x}^2+{y}^2}=\\sqrt{{s}}={ans}$."],
  },
  dotProduct: {
    ko: ["벡터 $\\vec{a}=({x1}, {y1})$, $\\vec{b}=({x2}, {y2})$의 내적 $\\vec{a}\\cdot\\vec{b}$는?", ["내적은 $x_1x_2+y_1y_2$예요.", "같은 위치의 성분끼리 곱해 더해요."], "${x1}\\times{x2}+{y1}\\times{y2}={ans}$입니다."],
    en: ["What is the dot product $\\vec{a}\\cdot\\vec{b}$ of $\\vec{a}=({x1}, {y1})$ and $\\vec{b}=({x2}, {y2})$?", ["The dot product is $x_1x_2+y_1y_2$.", "Multiply matching components and add."], "${x1}\\times{x2}+{y1}\\times{y2}={ans}$."],
  },
  vectorPerp: {
    ko: ["벡터 $\\vec{a}=({x1}, k)$와 $\\vec{b}=({x2}, {y2})$가 서로 수직일 때, $k$의 값은?", ["두 벡터가 수직이면 내적이 $0$이에요.", "$x_1x_2+ky_2=0$을 풀어요."], "${x1}\\times{x2}+k\\times({y2})=0$이므로 $k={ans}$입니다."],
    en: ["The vectors $\\vec{a}=({x1}, k)$ and $\\vec{b}=({x2}, {y2})$ are perpendicular. What is $k$?", ["Perpendicular vectors have dot product $0$.", "Solve $x_1x_2+ky_2=0$."], "${x1}\\times{x2}+k\\times({y2})=0$, so $k={ans}$."],
  },
};
