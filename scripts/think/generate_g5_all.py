# -*- coding: utf-8 -*-
"""
Generates scripts/think/templates_southeast_east_asian.py
Langs: th, my, km, id, ms, tl, ceb, jv, su, tet, yue
"""
import json
from pathlib import Path

ROOT = Path('/Users/juboklee/life-project/life-help')

G5 = {}

# 1. th (Thai)
G5["th"] = {
    "math_Q1": {
        "prompt": "[{grade} การสำรวจทางคณิตศาสตร์] คำถามสำรวจเกี่ยวกับ {title} กำหนดให้จำนวนธรรมชาติ $A$ และ $B$ สอดคล้องกับสมการ $A + 2B = 24$ เมื่อ $A$ มีค่ามากที่สุดเท่าที่จะเป็นไปได้ ค่าของ $B$ จะเป็นเท่าใด?",
        "explain": "ขั้นตอนที่ 1: จัดรูปสมการใหม่ได้ $A = 24 - 2B$\nขั้นตอนที่ 2: เนื่องจาก $A, B \\ge 1$ เป็นจำนวนธรรมชาติ เพื่อให้ $A$ มีค่ามากที่สุด $2B$ ต้องมีค่าน้อยที่สุด\nขั้นตอนที่ 3: จำนวนธรรมชาติน้อยที่สุดคือ $B = 1$\nขั้นตอนที่ 4: ในจุดนี้ $A = 24 - 2(1) = 22$ (สูงสุด) ดังนั้น $B = 1$",
        "hints": ["ค่าจำนวนธรรมชาติน้อยที่สุดสำหรับ $B$ คือ $1$", "เนื่องจาก $A = 24 - 2B$ เมื่อ $B$ น้อยที่สุด $A$ จะมากที่สุด"],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} การสำรวจทางคณิตศาสตร์ (ขั้นสูง)] ปัญหาสำรวจเชิงซ้อนโดยใช้ {title} ผลรวมของจำนวนธรรมชาติเรียงต่อกันสามจำนวนคือ $3S$ และผลคูณของจำนวนที่น้อยที่สุดและมากที่สุดบวกด้วย $1$ มีค่าเท่ากับ $T^2$ เมื่อ $S = 15$ จำนวนที่มากที่สุดในสามจำนวนนี้คือเท่าใด?",
        "explain": "ขั้นตอนที่ 1: กำหนดให้จำนวนทั้งสามคือ $n-1, n, n+1$ ผลรวมคือ $3n = 3S \\Rightarrow n = S = 15$\nขั้นตอนที่ 2: จำนวนทั้งสามคือ $14, 15, 16$\nขั้นตอนที่ 3: จำนวนที่มากที่สุดคือ $16$\nขั้นตอนที่ 4: ตรวจสอบ: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$",
        "hints": ["การกำหนดจำนวนเรียงต่อกันเป็น $n-1, n, n+1$ จะได้ผลรวมเป็น $3n$", "จำนวนตรงกลางคือ $n = S = 15$"],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} การสำรวจทางฟิสิกส์] ปัญหาที่ประยุกต์ใช้หลักการของ {title} บนพื้นผิวราบที่ไม่มีแรงเสียดทาน มีแรงคงที่ $F = 10\\text{ N}$ กระทำต่อวัตถุมวล $m = 2\\text{ kg}$ ในแนวระนาบเป็นระยะทาง $4\\text{ m}$ ข้อความใดอธิบายงาน $W$ ที่ทำและความเร่ง $a$ ได้ถูกต้อง?",
        "explain": "ขั้นตอนที่ 1: จากกฎข้อที่สองของนิวตัน $F = ma$ จะได้ $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$\nขั้นตอนที่ 2: งานที่ทำคือ $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$\nขั้นตอนที่ 3: ดังนั้น ความเร่งคือ $5\\text{ m/s}^2$ และงานคือ $40\\text{ J}$",
        "hints": ["กฎข้อที่สองของนิวตัน: ใช้สูตร $F = ma$", "นิยามของงาน: ใช้สูตร $W = F \\times s$"],
        "options": ["ความเร่งคือ $5\\text{ m/s}^2$ และงานคือ $40\\text{ J}$", "ความเร่งคือ $2\\text{ m/s}^2$ และงานคือ $20\\text{ J}$", "ความเร่งคือ $10\\text{ m/s}^2$ และงานคือ $40\\text{ J}$", "ความเร่งคือ $5\\text{ m/s}^2$ และงานคือ $20\\text{ J}$"]
    },
    "physics_Q2": {
        "prompt": "[{grade} การสำรวจทางฟิสิกส์ (ขั้นสูง)] การวิเคราะห์การเคลื่อนที่ตกอย่างอิสระที่เกี่ยวข้องกับ {title} วัตถุถูกปล่อยจากจุดหยุดนิ่งในสุญญากาศภายใต้แรงโน้มถ่วง $g = 9.8\\text{ m/s}^2$ เมื่อเวลาผ่านไป $t = 3\\text{ s}$ ความเร็ว $v$ และระยะทาง $h$ ที่ตกไปเป็นเท่าใด?",
        "explain": "ขั้นตอนที่ 1: ความเร็ว $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$\nขั้นตอนที่ 2: ระยะทาง $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$\nขั้นตอนที่ 3: ดังนั้น $v = 29.4\\text{ m/s}$ และ $h = 44.1\\text{ m}$",
        "hints": ["ความเร็วในการตกอิสระ: $v = gt$", "ระยะทางการตกอิสระ: $h = \\frac{1}{2}gt^2$"],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} การสำรวจทางเคมี] ปัญหาเกี่ยวกับปริมาตรแก๊สที่เกี่ยวข้องกับ {title} ที่อุณหภูมิ $25^\\circ\\text{C}$ และความดัน $1\\text{ atm}$ ปริมาตรต่อโมลของแก๊สคือ $24.5\\text{ L/mol}$ ภายใต้สภาวะเดียวกัน แก๊สนี้จำนวน $0.2\\text{ mol}$ จะมีปริมาตรกี่ $\\text{L}$?",
        "explain": "ขั้นตอนที่ 1: ตามกฎของอาโวกาโดร ปริมาตร $V = n \\times V_m$\nขั้นตอนที่ 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$\nขั้นตอนที่ 3: คำนวณได้ $V = 4.90\\text{ L}$",
        "hints": ["ปริมาตรแปรผันตรงกับจำนวนโมล", "คำนวณ $V = n \\times V_m$"],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} การสำรวจทางเคมี (ขั้นสูง)] ปัญหาการวิเคราะห์เชิงปริมาณที่เกี่ยวข้องกับ {title} สารละลายกรด $A$ มี $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ และสารละลาย $B$ มี $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$ ความเข้มข้นของไฮโดรเจนไอออนในสารละลาย $A$ มากกว่าสารละลาย $B$ กี่เท่า?",
        "explain": "ขั้นตอนที่ 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$\nขั้นตอนที่ 2: อัตราส่วน $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$\nขั้นตอนที่ 3: สารละลาย $A$ มีความเข้มข้นมากกว่าสารละลาย $B$ ถึง 100 เท่า",
        "hints": ["คำนวณอัตราส่วน $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$", "$10^{-3} / 10^{-5} = 10^2 = 100$"],
        "options": ["$10\\text{ เท่า}$", "$100\\text{ เท่า}$", "$1000\\text{ เท่า}$", "$0.01\\text{ เท่า}$"]
    },
    "thinking1": "การให้เหตุผลเชิงตรรกะและการวิเคราะห์",
    "goal": "ประยุกต์ใช้หลักการของ {title} เพื่อแก้ปัญหาการสำรวจ"
}

# 2. my (Burmese)
G5["my"] = {
    "math_Q1": {
        "prompt": "[{grade} သင်္ချာဆိုင်ရာစူးစမ်းလေ့လာမှု] {title} နှင့်ပတ်သက်သော စူးစမ်းမေးခွန်း။ $A + 2B = 24$ ညီမျှခြင်းကို ပြေလည်စေသော သဘာဝကိန်းနှစ်ခု $A$ နှင့် $B$ ရှိသည်။ $A$ သည် ဖြစ်နိုင်ချေရှိသော အကြီးဆုံးတန်ဖိုးကို ယူသောအခါ $B$ ၏ တန်ဖိုးသည် မည်မျှဖြစ်သနည်း?",
        "explain": "အဆင့် ၁: ညီမျှခြင်းကို ပြန်လည်စီစဉ်ပါက $A = 24 - 2B$ ရရှိသည်။\nအဆင့် ၂: $A, B \\ge 1$ သဘာဝကိန်းများဖြစ်သောကြောင့် $A$ အများဆုံးဖြစ်ရန် $2B$ အနည်းဆုံးဖြစ်ရမည်။\nအဆင့် ၃: အငယ်ဆုံး သဘာဝကိန်းမှာ $B = 1$ ဖြစ်သည်။\nအဆင့် ၄: ဤအခြေအနေတွင် $A = 24 - 2(1) = 22$ (အများဆုံး) ဖြစ်သောကြောင့် $B = 1$ ဖြစ်သည်။",
        "hints": ["$B$ အတွက် အငယ်ဆုံး သဘာဝကိန်းတန်ဖိုးမှာ $1$ ဖြစ်သည်။", "$A = 24 - 2B$ ဖြစ်သောကြောင့် $B$ အငယ်ဆုံးဖြစ်သောအခါ $A$ သည် အကြီးဆုံးဖြစ်လာသည်။"],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} သင်္ချာဆိုင်ရာစူးစမ်းလေ့လာမှု (အဆင့်မြင့်)] {title} ကို အသုံးပြုထားသော ရှုပ်ထွေးသည့် စူးစမ်းမှုပြဿနာ။ ဆက်တိုက်ဖြစ်သော သဘာဝကိန်းသုံးခု၏ ပေါင်းလဒ်သည် $3S$ ဖြစ်ပြီး အငယ်ဆုံးနှင့် အကြီးဆုံးကိန်းတို့၏ မြှောက်လဒ်တွင် $1$ ပေါင်းပါက $T^2$ နှင့် ညီမျှသည်။ $S = 15$ ဖြစ်လျှင် ဤသုံးခုအနက် အကြီးဆုံးကိန်းမှာ မည်သည်နည်း?",
        "explain": "အဆင့် ၁: ကိန်းများကို $n-1, n, n+1$ ဟုယူဆပါက ပေါင်းလဒ် $3n = 3S \\Rightarrow n = S = 15$ ဖြစ်သည်။\nအဆင့် ၂: ကိန်းသုံးခုမှာ $14, 15, 16$ ဖြစ်သည်။\nအဆင့် ၃: အကြီးဆုံးကိန်းမှာ $16$ ဖြစ်သည်။\nအဆင့် ၄: စစ်ဆေးခြင်း: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$။",
        "hints": ["ဆက်တိုက်ကိန်းများကို $n-1, n, n+1$ ဟုယူဆပါက ပေါင်းလဒ် $3n$ ရရှိသည်။", "အလယ်ကိန်းမှာ $n = S = 15$ ဖြစ်သည်။"],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} ရူပဗေဒစူးစမ်းလေ့လာမှု] {title} သဘောတရားများကို အသုံးချသည့် ပြဿနာ။ ပွတ်တိုက်မှုမရှိသော ပြင်ညီမျက်နှာပြင်ပေါ်တွင် ထုထည် $m = 2\\text{ kg}$ ရှိသော အရာဝတ္ထုတစ်ခုပေါ်သို့ ကိန်းသေအား $F = 10\\text{ N}$ သည် $4\\text{ m}$ အကွာအဝေးအထိ သက်ရောက်သည်။ ပြီးမြောက်သောအလုပ် $W$ နှင့် အရှိန် $a$ အကြောင်း မှန်ကန်သောဖော်ပြချက်မှာ အဘယ်နည်း?",
        "explain": "အဆင့် ၁: နယူတန်၏ ဒုတိယနိယာမ $F = ma$ အရ အရှိန် $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$ ဖြစ်သည်။\nအဆင့် ၂: ပြီးမြောက်သောအလုပ် $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$ ဖြစ်သည်။\nအဆင့် ၃: ထို့ကြောင့် အရှိန်မှာ $5\\text{ m/s}^2$ နှင့် အလုပ်မှာ $40\\text{ J}$ ဖြစ်သည်။",
        "hints": ["နယူတန်၏ ဒုတိယနိယာမ: $F = ma$ ပုံသေနည်းကို အသုံးပြုပါ။", "အလုပ်၏ အဓိပ္ပာယ်ဖွင့်ဆိုချက်: $W = F \\times s$ ပုံသေနည်းကို အသုံးပြုပါ။"],
        "options": ["အရှိန်မှာ $5\\text{ m/s}^2$ နှင့် အလုပ်မှာ $40\\text{ J}$ ဖြစ်သည်။", "အရှိန်မှာ $2\\text{ m/s}^2$ နှင့် အလုပ်မှာ $20\\text{ J}$ ဖြစ်သည်။", "အရှိန်မှာ $10\\text{ m/s}^2$ နှင့် အလုပ်မှာ $40\\text{ J}$ ဖြစ်သည်။", "အရှိန်မှာ $5\\text{ m/s}^2$ နှင့် အလုပ်မှာ $20\\text{ J}$ ဖြစ်သည်။"]
    },
    "physics_Q2": {
        "prompt": "[{grade} ရူပဗေဒစူးစမ်းလေ့လာမှု (အဆင့်မြင့်)] {title} နှင့် သက်ဆိုင်သော လွတ်လပ်စွာကျဆင်းမှု ရွေ့လျားမှုခွဲခြမ်းစိတ်ဖြာခြင်း။ လေဟာနယ်တွင် ကမ္ဘာ့ဆွဲငင်အား $g = 9.8\\text{ m/s}^2$ အောက်၌ အရာဝတ္ထုတစ်ခုကို အနားယူရာမှ လွှတ်ချလိုက်သည်။ အချိန် $t = 3\\text{ s}$ အကြာတွင် ၎င်း၏ အလျင် $v$ နှင့် ကျဆင်းသွားသောအကွာအဝေး $h$ သည် မည်မျှရှိသနည်း?",
        "explain": "အဆင့် ၁: အလျင် $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$။\nအဆင့် ၂: အကွာအဝေး $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$။\nအဆင့် ၃: ထို့ကြောင့် $v = 29.4\\text{ m/s}$ နှင့် $h = 44.1\\text{ m}$ ဖြစ်သည်။",
        "hints": ["လွတ်လပ်စွာကျဆင်းမှု အလျင်: $v = gt$", "လွတ်လပ်စွာကျဆင်းမှု အကွာအဝေး: $h = \\frac{1}{2}gt^2$"],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} ဓာတုဗေဒစူးစမ်းလေ့လာမှု] {title} နှင့် သက်ဆိုင်သော ဓာတ်ငွေ့ထုထည်မေးခွန်း။ $25^\\circ\\text{C}$ နှင့် $1\\text{ atm}$ တွင် ဓာတ်ငွေ့တစ်ခု၏ မိုလာထုထည်မှာ $24.5\\text{ L/mol}$ ဖြစ်သည်။ တူညီသောအခြေအနေများတွင် ဤဓာတ်ငွေ့ $0.2\\text{ mol}$ ၏ ထုထည်သည် မည်မျှ $\\text{L}$ ဖြစ်မည်နည်း?",
        "explain": "အဆင့် ၁: အာဗိုဂါဒရို၏ နိယာမအရ ထုထည် $V = n \\times V_m$ ဖြစ်သည်။\nအဆင့် ၂: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$။\nအဆင့် ၃: တွက်ချက်မှုအရ $V = 4.90\\text{ L}$ ရရှိသည်။",
        "hints": ["ထုထည်သည် မိုလ်အရေအတွက်နှင့် တိုက်ရိုက်အချိုးကျသည်။", "$V = n \\times V_m$ ကို တွက်ချက်ပါ။"],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} ဓာတုဗေဒစူးစမ်းလေ့လာမှု (အဆင့်မြင့်)] {title} နှင့် သက်ဆိုင်သော ပမာဏဆိုင်ရာ ခွဲခြမ်းစိတ်ဖြာမှုပြဿနာ။ အက်ဆစ်ပျော်ရည် $A$ တွင် $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ ရှိပြီး ပျော်ရည် $B$ တွင် $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$ ရှိသည်။ ပျော်ရည် $A$ ရှိ ဟိုက်ဒရိုဂျင်အိုင်းယွန်း ပြင်းအားသည် ပျော်ရည် $B$ ထက် မည်မျှဆ ပိုများသနည်း?",
        "explain": "အဆင့် ၁: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$။\nအဆင့် ၂: အချိုး $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$။\nအဆင့် ၃: ပျော်ရည် $A$ ၏ ပြင်းအားသည် ပျော်ရည် $B$ ထက် အဆ ၁၀၀ ပိုများသည်။",
        "hints": ["အချိုး $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ ကို တွက်ချက်ပါ။", "$10^{-3} / 10^{-5} = 10^2 = 100$"],
        "options": ["$10\\text{ ဆ}$", "$100\\text{ ဆ}$", "$1000\\text{ ဆ}$", "$0.01\\text{ ဆ}$"]
    },
    "thinking1": "ယုတ္တိဗေဒဆိုင်ရာ စဉ်းစားတွေးခေါ်မှုနှင့် ခွဲခြမ်းစိတ်ဖြာမှု",
    "goal": "စူးစမ်းမှုပြဿနာကို ဖြေရှင်းရန် {title} သဘောတရားများကို အသုံးချပါ။"
}

# 3. km (Khmer)
G5["km"] = {
    "math_Q1": {
        "prompt": "[{grade} ការស្រាវជ្រាវគណិតវិទ្យា] សំណួរស្រាវជ្រាវទាក់ទងនឹង {title}។ ដោយដឹងថាចំនួនធម្មជាតិពីរ $A$ និង $B$ ផ្ទៀងផ្ទាត់សមីការ $A + 2B = 24$។ នៅពេល $A$ ទទួលបានតម្លៃធំបំផុត តើតម្លៃនៃ $B$ ស្មើនឹងប៉ុន្មាន?",
        "explain": "ជំហានទី ១: រៀបចំសមីការឡើងវិញបាន $A = 24 - 2B$\nជំហានទី ២: ដោយសារ $A, B \\ge 1$ ជាចំនួនធម្មជាតិ ដើម្បីឱ្យ $A$ ធំបំផុត $2B$ ត្រូវតែតូចបំផុត\nជំហានទី ៣: ចំនួនធម្មជាติตូចបំផុតគឺ $B = 1$\nជំហានទី ៤: នៅត្រង់នេះ $A = 24 - 2(1) = 22$ (ធំបំផុត) ដូច្នេះ $B = 1$",
        "hints": ["តម្លៃចំនួនធម្មជាติตូចបំផុតសម្រាប់ $B$ គឺ $1$", "ដោយសារ $A = 24 - 2B$ កាលណា $B$ តូចបំផុត $A$ នឹងធំបំផុត"],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} ការស្រាវជ្រាវគណិតវិទ្យា (កម្រិតខ្ពស់)] បញ្ហាស្រាវជ្រាវស្មុគស្មាញដោយប្រើ {title}។ ផលបូកនៃចំនួនធម្មជាตិតាមលំដាប់បីជាប់គ្នាគឺ $3S$ ហើយផលគុណរវាងចំនួនតូចបំផុតនិងធំបំផុតបូកនឹង $1$ ស្មើនឹង $T^2$។ ប្រសិនបើ $S = 15$ តើចំនួនធំបំផុតក្នុងចំណោមចំនួនទាំងបីនេះគឺជាអ្វី?",
        "explain": "ជំហានទី ១: តាងចំនួនទាំងបីដោយ $n-1, n, n+1$ ផលបូកគឺ $3n = 3S \\Rightarrow n = S = 15$\nជំហានទី ២: ចំនួនទាំងបីនោះគឺ $14, 15, 16$\nជំហានទី ៣: ចំនួនធំបំផុតគឺ $16$\nជំហានទី ៤: ផ្ទៀងផ្ទាត់: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$",
        "hints": ["ការតាងចំនួនជាប់គ្នាដោយ $n-1, n, n+1$ នាំឱ្យផលបូកស្មើ $3n$", "ចំនួនកណ្តាលគឺ $n = S = 15$"],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} ការស្រាវជ្រាវរូបវិទ្យា] បញ្ហាអនុវត្តគោលការណ៍នៃ {title}។ នៅលើផ្ទៃផ្តេកដែលគ្មានកកិត កម្លាំងថេរ $F = 10\\text{ N}$ មួយមានអំពើលើវត្ថុដែលមានម៉ាស $m = 2\\text{ kg}$ ក្នុងចម្ងាយ $4\\text{ m}$។ តើការបញ្ជាក់មួយណាពិពណ៌នាត្រឹមត្រូវអំពីការងារ $W$ និងសំទុះ $a$?",
        "explain": "ជំហានទី ១: តាមច្បាប់ទីពីរញូតុន $F = ma$ សំទុះ $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$\nជំហានទី ២: ការងារដែលបានធ្វើគឺ $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$\nជំហានទី ៣: ដូច្នេះ សំទុះគឺ $5\\text{ m/s}^2$ ហើយការងារគឺ $40\\text{ J}$",
        "hints": ["ច្បាប់ទីពីរញូតុន: ប្រើរូបមន្ត $F = ma$", "និយមន័យនៃការងារ: ប្រើរូបមន្ត $W = F \\times s$"],
        "options": ["សំទុះគឺ $5\\text{ m/s}^2$ និងការងារគឺ $40\\text{ J}$", "សំទុះគឺ $2\\text{ m/s}^2$ និងការងារគឺ $20\\text{ J}$", "សំទុះគឺ $10\\text{ m/s}^2$ និងការងារគឺ $40\\text{ J}$", "សំទុះគឺ $5\\text{ m/s}^2$ និងការងារគឺ $20\\text{ J}$"]
    },
    "physics_Q2": {
        "prompt": "[{grade} ការស្រាវជ្រាវរូបវិទ្យា (កម្រិតខ្ពស់)] ការវិភាគចលនាធ្លាក់សេរីទាក់ទងនឹង {title}។ វត្ថុមួយត្រូវបានទម្លាក់ពីភាពនៅស្ងៀមក្នុងសុញ្ញាកាសក្រោមទំនាញដី $g = 9.8\\text{ m/s}^2$។ នៅពេល $t = 3\\text{ s}$ តើល្បឿន $v$ និងចម្ងាយធ្លាក់ $h$ ស្មើនឹងប៉ុន្មាន?",
        "explain": "ជំហានទី ១: ល្បឿន $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$\nជំហានទី ២: ចម្ងាយ $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$\nជំហានទី ៣: ដូច្នេះ $v = 29.4\\text{ m/s}$ និង $h = 44.1\\text{ m}$",
        "hints": ["ល្បឿនធ្លាក់សេរី: $v = gt$", "ចម្ងាយធ្លាក់សេរី: $h = \\frac{1}{2}gt^2$"],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} ការស្រាវជ្រាវគីមីវិទ្យា] បញ្ហាមាឌឧស្ម័នទាក់ទងនឹង {title}។ នៅសីតុណ្ហភាព $25^\\circ\\text{C}$ និងសម្ពាធ $1\\text{ atm}$ មាឌម៉ូលនៃឧស្ម័នគឺ $24.5\\text{ L/mol}$។ ក្រោមលក្ខខណ្ឌដូចគ្នានេះ តើឧស្ម័នចំនួន $0.2\\text{ mol}$ មានមាឌប៉ុន្មាន $\\text{L}$?",
        "explain": "ជំហានទី ១: តាមច្បាប់អាវ៉ូហ្គាដ្រូ មាឌ $V = n \\times V_m$\nជំហានទី ២: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$\nជំហានទី ៣: ការគណនាបង្ហាញថា $V = 4.90\\text{ L}$",
        "hints": ["មាឌសមាមាត្រផ្ទាល់ទៅនឹងចំនួនម៉ូល", "គណនា $V = n \\times V_m$"],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} ការស្រាវជ្រាវគីមីវិទ្យា (កម្រិតខ្ពស់)] បញ្ហាវិភាគបរិមាណទាក់ទងនឹង {title}។ សូលុយស្យុងអាស៊ីត $A$ មាន $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ និងសូលុយស្យុង $B$ មាន $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$។ តើកំហាប់អ៊ីយ៉ុងអ៊ីដ្រូសែនក្នុងសូលុយស្យុង $A$ ធំជាងសូលុយស្យុង $B$ ប៉ុន្មានដង?",
        "explain": "ជំហានទី ១: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$\nជំហានទី ២: ផលធៀប $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$\nជំហានទី ៣: កំហាប់ក្នុងសូលុយស្យុង $A$ ធំជាង $B$ ចំនួន 100 ដង",
        "hints": ["គណនាផលធៀប $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$", "$10^{-3} / 10^{-5} = 10^2 = 100$"],
        "options": ["$10\\text{ ដង}$", "$100\\text{ ដង}$", "$1000\\text{ ដង}$", "$0.01\\text{ ដង}$"]
    },
    "thinking1": "ការវែកញែកសមហេតុផលនិងការវិភាគ",
    "goal": "អនុវត្តគោលការណ៍នៃ {title} ដើម្បីដោះស្រាយបញ្ហាស្រាវជ្រាវ។"
}

# 4. id (Indonesian)
G5["id"] = {
    "math_Q1": {
        "prompt": "[{grade} Penyelidikan Matematika] Pertanyaan penyelidikan tentang {title}. Diberikan dua bilangan asli $A$ dan $B$ yang memenuhi persamaan $A + 2B = 24$. Ketika $A$ mencapai nilai maksimum yang mungkin, berapakah nilai $B$?",
        "explain": "Langkah 1: Menyusun ulang persamaan menghasilkan $A = 24 - 2B$.\nLangkah 2: Karena $A, B \\ge 1$ adalah bilangan asli, $2B$ harus diminimalkan agar $A$ maksimal.\nLangkah 3: Bilangan asli terkecil adalah $B = 1$.\nLangkah 4: Pada titik ini, $A = 24 - 2(1) = 22$ (maksimum), sehingga $B = 1$.",
        "hints": ["Nilai bilangan asli minimum untuk $B$ adalah $1$.", "Karena $A = 24 - 2B$, $A$ maksimal ketika $B$ minimal."],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} Penyelidikan Matematika (Lanjutan)] Masalah penyelidikan kompleks menggunakan {title}. Jumlah tiga bilangan asli berurutan adalah $3S$, dan hasil kali bilangan terkecil dan terbesar ditambah $1$ sama dengan $T^2$. Jika $S = 15$, berapakah bilangan terbesar dari ketiga bilangan tersebut?",
        "explain": "Langkah 1: Memisalkan ketiga bilangan sebagai $n-1, n, n+1$, jumlahnya $3n = 3S \\Rightarrow n = S = 15$.\nLangkah 2: Ketiga bilangan tersebut adalah $14, 15, 16$.\nLangkah 3: Bilangan terbesar adalah $16$.\nLangkah 4: Verifikasi: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
        "hints": ["Memisalkan bilangan berurutan sebagai $n-1, n, n+1$ menghasilkan jumlah $3n$.", "Bilangan tengah adalah $n = S = 15$."],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} Penyelidikan Fisika] Masalah yang menerapkan prinsip {title}. Pada permukaan horizontal tanpa gesekan, gaya horizontal konstan $F = 10\\text{ N}$ bekerja pada benda bermassa $m = 2\\text{ kg}$ sejauh $4\\text{ m}$. Pernyataan mana yang menjelaskan usaha $W$ dan percepatan $a$ dengan benar?",
        "explain": "Langkah 1: Dari hukum II Newton $F = ma$, percepatan $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nLangkah 2: Usaha yang dilakukan adalah $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nLangkah 3: Oleh karena itu, percepatan adalah $5\\text{ m/s}^2$ dan usaha adalah $40\\text{ J}$.",
        "hints": ["Hukum II Newton: gunakan rumus $F = ma$.", "Definisi usaha: gunakan rumus $W = F \\times s$."],
        "options": ["Percepatan $5\\text{ m/s}^2$ dan usaha $40\\text{ J}$.", "Percepatan $2\\text{ m/s}^2$ dan usaha $20\\text{ J}$.", "Percepatan $10\\text{ m/s}^2$ dan usaha $40\\text{ J}$.", "Percepatan $5\\text{ m/s}^2$ dan usaha $20\\text{ J}$."]
    },
    "physics_Q2": {
        "prompt": "[{grade} Penyelidikan Fisika (Lanjutan)] Analisis gerak jatuh bebas terkait {title}. Benda dijatuhkan dari keadaan diam dalam ruang hampa di bawah gravitasi $g = 9.8\\text{ m/s}^2$. Berapakah kecepatan $v$ dan jarak jatuh $h$ setelah $t = 3\\text{ s}$?",
        "explain": "Langkah 1: Kecepatan $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$.\nLangkah 2: Jarak $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$.\nLangkah 3: Jadi $v = 29.4\\text{ m/s}$ dan $h = 44.1\\text{ m}$.",
        "hints": ["Kecepatan jatuh bebas: $v = gt$.", "Jarak jatuh bebas: $h = \\frac{1}{2}gt^2$."],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} Penyelidikan Kimia] Masalah volume gas terkait {title}. Pada $25^\\circ\\text{C}$ dan $1\\text{ atm}$, volume molar gas adalah $24.5\\text{ L/mol}$. Dalam kondisi yang sama, berapakah volume dalam $\\text{L}$ dari $0.2\\text{ mol}$ gas ini?",
        "explain": "Langkah 1: Berdasarkan hukum Avogadro, volume $V = n \\times V_m$.\nLangkah 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nLangkah 3: Perhitungan menghasilkan $V = 4.90\\text{ L}$.",
        "hints": ["Volume berbanding lurus dengan jumlah mol.", "Hitung $V = n \\times V_m$."],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} Penyelidikan Kimia (Lanjutan)] Masalah analisis kuantitatif terkait {title}. Larutan asam $A$ memiliki $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ dan larutan $B$ memiliki $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Berapa kali lipat konsentrasi ion hidrogen larutan $A$ lebih besar daripada larutan $B$?",
        "explain": "Langkah 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nLangkah 2: Rasio $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$.\nLangkah 3: Konsentrasi larutan $A$ adalah 100 kali lebih besar daripada larutan $B$.",
        "hints": ["Hitung rasio $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "$10^{-3} / 10^{-5} = 10^2 = 100$."],
        "options": ["$10\\text{ kali}$", "$100\\text{ kali}$", "$1000\\text{ kali}$", "$0.01\\text{ kali}$"]
    },
    "thinking1": "Penalaran logis dan analisis",
    "goal": "Terapkan prinsip-prinsip {title} untuk menyelesaikan masalah penyelidikan."
}

# 5. ms (Malay)
G5["ms"] = {
    "math_Q1": {
        "prompt": "[{grade} Siasatan Matematik] Soalan siasatan mengenai {title}. Diberi dua nombor asli $A$ dan $B$ yang memuaskan persamaan $A + 2B = 24$. Apabila $A$ mengambil nilai maksimum yang mungkin, apakah nilai $B$?",
        "explain": "Langkah 1: Menyusun semula persamaan memberikan $A = 24 - 2B$.\nLangkah 2: Oleh kerana $A, B \\ge 1$ adalah nombor asli, $2B$ mesti diminimumkan supaya $A$ maksimum.\nLangkah 3: Nombor asli terkecil ialah $B = 1$.\nLangkah 4: Pada ketika ini, $A = 24 - 2(1) = 22$ (maksimum), jadi $B = 1$.",
        "hints": ["Nilai nombor asli minimum untuk $B$ ialah $1$.", "Kerana $A = 24 - 2B$, $A$ dimaksimumkan apabila $B$ diminimumkan."],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} Siasatan Matematik (Lanjutan)] Masalah siasatan kompleks menggunakan {title}. Jumlah tiga nombor asli berturutan ialah $3S$, dan hasil darab nombor terkecil dan terbesar ditambah $1$ adalah sama dengan $T^2$. Jika $S = 15$, apakah nombor terbesar antara ketiga-tiga nombor tersebut?",
        "explain": "Langkah 1: Menganggap nombor sebagai $n-1, n, n+1$, jumlahnya ialah $3n = 3S \\Rightarrow n = S = 15$.\nLangkah 2: Tiga nombor tersebut ialah $14, 15, 16$.\nLangkah 3: Nombor terbesar ialah $16$.\nLangkah 4: Pengesahan: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
        "hints": ["Menganggap nombor berturutan sebagai $n-1, n, n+1$ menghasilkan jumlah $3n$.", "Nombor tengah ialah $n = S = 15$."],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} Siasatan Fizik] Masalah mengaplikasikan prinsip {title}. Pada permukaan mendatar tanpa geseran, daya mendatar malar $F = 10\\text{ N}$ bertindak ke atas objek berjisim $m = 2\\text{ kg}$ sejauh $4\\text{ m}$. Pernyataan manakah yang menerangkan kerja $W$ yang dilakukan dan pecutan $a$ dengan betul?",
        "explain": "Langkah 1: Dari hukum kedua Newton $F = ma$, pecutan $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nLangkah 2: Kerja yang dilakukan ialah $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nLangkah 3: Oleh itu, pecutan ialah $5\\text{ m/s}^2$ dan kerja ialah $40\\text{ J}$.",
        "hints": ["Hukum kedua Newton: gunakan formula $F = ma$.", "Definisi kerja: gunakan formula $W = F \\times s$."],
        "options": ["Pecutan ialah $5\\text{ m/s}^2$ dan kerja ialah $40\\text{ J}$.", "Pecutan ialah $2\\text{ m/s}^2$ dan kerja ialah $20\\text{ J}$.", "Pecutan ialah $10\\text{ m/s}^2$ dan kerja ialah $40\\text{ J}$.", "Pecutan ialah $5\\text{ m/s}^2$ dan kerja ialah $20\\text{ J}$."]
    },
    "physics_Q2": {
        "prompt": "[{grade} Siasatan Fizik (Lanjutan)] Analisis gerakan jatuh bebas berkaitan {title}. Objek dijatuhkan dari keadaan pegun dalam vakum di bawah graviti $g = 9.8\\text{ m/s}^2$. Apakah halaju $v$ dan jarak jatuh $h$ selepas $t = 3\\text{ s}$?",
        "explain": "Langkah 1: Halaju $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$.\nLangkah 2: Jarak $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$.\nLangkah 3: Oleh itu $v = 29.4\\text{ m/s}$ dan $h = 44.1\\text{ m}$.",
        "hints": ["Halaju jatuh bebas: $v = gt$.", "Jarak jatuh bebas: $h = \\frac{1}{2}gt^2$."],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} Siasatan Kimia] Masalah isi padu gas berkaitan {title}. Pada $25^\\circ\\text{C}$ dan $1\\text{ atm}$, isi padu molar gas ialah $24.5\\text{ L/mol}$. Di bawah keadaan yang sama, apakah isi padu dalam $\\text{L}$ bagi $0.2\\text{ mol}$ gas ini?",
        "explain": "Langkah 1: Mengikut hukum Avogadro, isi padu $V = n \\times V_m$.\nLangkah 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nLangkah 3: Pengiraan memberikan $V = 4.90\\text{ L}$.",
        "hints": ["Isi padu berkadar terus dengan bilangan mol.", "Kira $V = n \\times V_m$."],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} Siasatan Kimia (Lanjutan)] Masalah analisis kuantitatif berkaitan {title}. Larutan berasid $A$ mempunyai $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ dan larutan $B$ mempunyai $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Berapa kali gandakah kepekatan ion hidrogen larutan $A$ lebih besar daripada larutan $B$?",
        "explain": "Langkah 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nLangkah 2: Nisbah $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$.\nLangkah 3: Kepekatan larutan $A$ adalah 100 kali lebih besar daripada larutan $B$.",
        "hints": ["Kira nisbah $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "$10^{-3} / 10^{-5} = 10^2 = 100$."],
        "options": ["$10\\text{ kali}$", "$100\\text{ kali}$", "$1000\\text{ kali}$", "$0.01\\text{ kali}$"]
    },
    "thinking1": "Penaakulan logik dan analisis",
    "goal": "Gunakan prinsip {title} untuk menyelesaikan masalah siasatan."
}

# 6. tl (Tagalog)
G5["tl"] = {
    "math_Q1": {
        "prompt": "[{grade} Pagsisiyasat sa Matematika] Tanong sa pagsisiyasat tungkol sa {title}. Dalawang likas na bilang $A$ at $B$ ang sumasapat sa $A + 2B = 24$. Kapag nakuha ni $A$ ang pinakamataas na posibleng halaga, ano ang halaga ng $B$?",
        "explain": "Hakbang 1: Ayusin ang equation upang maging $A = 24 - 2B$.\nHakbang 2: Dahil ang $A, B \\ge 1$ ay mga likas na bilang, dapat paliitin ang $2B$ upang lumaki ang $A$.\nHakbang 3: Ang pinakamaliit na likas na bilang ay $B = 1$.\nHakbang 4: Sa puntong ito, $A = 24 - 2(1) = 22$ (sukdulan), kaya $B = 1$.",
        "hints": ["Ang pinakamaliit na likas na bilang para sa $B$ ay $1$.", "Dahil $A = 24 - 2B$, lumalaki ang $A$ kapag pinaliit ang $B$."],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} Pagsisiyasat sa Matematika (Mas Malalim)] Masalimuot na suliranin gamit ang {title}. Ang kabuuan ng tatlong magkasunod na likas na bilang ay $3S$, at ang bunga ng pinakamaliit at pinakamalaki kasama ang $1$ ay katumbas ng $T^2$. Kung ang $S = 15$, ano ang pinakamalaking bilang?",
        "explain": "Hakbang 1: Ipalagay ang mga bilang bilang $n-1, n, n+1$, kabuuan ay $3n = 3S \\Rightarrow n = S = 15$.\nHakbang 2: Ang tatlong bilang ay $14, 15, 16$.\nHakbang 3: Ang pinakamalaking bilang ay $16$.\nHakbang 4: Pagsusuri: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
        "hints": ["Ang pagpapalagay ng magkakasunod bilang $n-1, n, n+1$ ay nagbibigay ng $3n$.", "Ang gitnang bilang ay $n = S = 15$."],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} Pagsisiyasat sa Pisika] Suliraning naglalapat ng mga prinsipyo ng {title}. Sa isang pahalang na lapag na walang friction, ang puwersang $F = 10\\text{ N}$ ay kumikilos sa bagay na may mass $m = 2\\text{ kg}$ sa layong $4\\text{ m}$. Aling pahayag ang tumpak na naglalarawan sa gawa $W$ at acceleration $a$?",
        "explain": "Hakbang 1: Mula sa ikalawang batas ni Newton $F = ma$, acceleration $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nHakbang 2: Ang gawa ay $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nHakbang 3: Kaya ang acceleration ay $5\\text{ m/s}^2$ at ang gawa ay $40\\text{ J}$.",
        "hints": ["Ikalawang batas ni Newton: gamitin ang $F = ma$.", "Kahulugan ng gawa: gamitin ang $W = F \\times s$."],
        "options": ["Acceleration ay $5\\text{ m/s}^2$ at gawa ay $40\\text{ J}$.", "Acceleration ay $2\\text{ m/s}^2$ at gawa ay $20\\text{ J}$.", "Acceleration ay $10\\text{ m/s}^2$ at gawa ay $40\\text{ J}$.", "Acceleration ay $5\\text{ m/s}^2$ at gawa ay $20\\text{ J}$."]
    },
    "physics_Q2": {
        "prompt": "[{grade} Pagsisiyasat sa Pisika (Mas Malalim)] Pagsusuri sa free fall na may kinalaman sa {title}. Ang isang bagay ay ibinagsak mula sa pamamahinga sa vacuum sa ilalim ng gravity $g = 9.8\\text{ m/s}^2$. Ano ang tulin $v$ at distansyang $h$ pagkatapos ng $t = 3\\text{ s}$?",
        "explain": "Hakbang 1: Tulin $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$.\nHakbang 2: Distansya $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$.\nHakbang 3: Kaya $v = 29.4\\text{ m/s}$ at $h = 44.1\\text{ m}$.",
        "hints": ["Tulin ng free fall: $v = gt$.", "Distansya ng free fall: $h = \\frac{1}{2}gt^2$."],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} Pagsisiyasat sa Kimika] Suliranin sa dami ng gas kaugnay ng {title}. Sa $25^\\circ\\text{C}$ at $1\\text{ atm}$, ang molar volume ng gas ay $24.5\\text{ L/mol}$. Sa parehong kondisyon, ano ang volume sa $\\text{L}$ ng $0.2\\text{ mol}$ ng gas na ito?",
        "explain": "Hakbang 1: Ayon sa batas ni Avogadro, ang volume $V = n \\times V_m$.\nHakbang 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nHakbang 3: Ang kalkulasyon ay nagbibigay ng $V = 4.90\\text{ L}$.",
        "hints": ["Ang volume ay direktang proporsyonal sa bilang ng moles.", "Kalkulahin ang $V = n \\times V_m$."],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} Pagsisiyasat sa Kimika (Mas Malalim)] Pagsusuring dami kaugnay ng {title}. Ang acidic solution $A$ ay may $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ at ang solution $B$ ay may $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Ilang beses na mas malaki ang konsentrasyon ng hydrogen ion sa $A$ kumpara sa $B$?",
        "explain": "Hakbang 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nHakbang 2: Ratio $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$.\nHakbang 3: Ang konsentrasyon ng $A$ ay 100 beses na mas malaki kaysa sa $B$.",
        "hints": ["Kalkulahin ang ratio $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "$10^{-3} / 10^{-5} = 10^2 = 100$."],
        "options": ["$10\\text{ beses}$", "$100\\text{ beses}$", "$1000\\text{ beses}$", "$0.01\\text{ beses}$"]
    },
    "thinking1": "Lohikal na pangangatwiran at pagsusuri",
    "goal": "Ilapat ang mga prinsipyo ng {title} upang lutasin ang suliranin sa pagsisiyasat."
}

# 7. ceb (Cebuano)
G5["ceb"] = {
    "math_Q1": {
        "prompt": "[{grade} Pagsusi sa Matematika] Pangutana sa pagsusi bahin sa {title}. Duha ka natural nga numero $A$ ug $B$ ang nagtagbaw sa $A + 2B = 24$. Kung makuha ni $A$ ang kinadak-ang posibleng bili, unsa ang bili sa $B$?",
        "explain": "Lakang 1: Paghan-ay pag-usab sa equation naghatag og $A = 24 - 2B$.\nLakang 2: Tungod kay ang $A, B \\ge 1$ mga natural nga numero, kinahanglan gamayon ang $2B$ aron modako si $A$.\nLakang 3: Ang kinagamyan nga natural nga numero mao ang $B = 1$.\nLakang 4: Niining puntoha, $A = 24 - 2(1) = 22$ (kinadak-an), busa $B = 1$.",
        "hints": ["Ang kinagamyan nga natural nga numero alang sa $B$ mao ang $1$.", "Tungod kay $A = 24 - 2B$, modako si $A$ kung gamay si $B$."],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} Pagsusi sa Matematika (Abante)] Komplikado nga problema gamit ang {title}. Ang suma sa tulo ka sunod-sunod nga natural nga numero mao ang $3S$, ug ang produkto sa kinagamyan ug kinadak-an dugangan og $1$ pareho sa $T^2$. Kung $S = 15$, unsa ang kinadak-ang numero?",
        "explain": "Lakang 1: Ibutang ang mga numero isip $n-1, n, n+1$, ang suma mao ang $3n = 3S \\Rightarrow n = S = 15$.\nLakang 2: Ang tulo ka numero mao ang $14, 15, 16$.\nLakang 3: Ang kinadak-ang numero mao ang $16$.\nLakang 4: Pagpamatuod: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
        "hints": ["Ang pagbutang sa sunod-sunod nga numero isip $n-1, n, n+1$ naghatag og $3n$.", "Ang tunga nga numero mao ang $n = S = 15$."],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} Pagsusi sa Pisika] Problema nga nagpadapat sa mga prinsipyo sa {title}. Sa usa ka pinahigda nga lugar nga walay friction, ang puwersa nga $F = 10\\text{ N}$ naglihok sa butang nga may mass $m = 2\\text{ kg}$ sa gilay-on nga $4\\text{ m}$. Unsang pamahayag ang husto nga naghulagway sa trabaho $W$ ug acceleration $a$?",
        "explain": "Lakang 1: Gikan sa ikaduhang balaod ni Newton $F = ma$, acceleration $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nLakang 2: Ang nahimong trabaho mao ang $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nLakang 3: Busa ang acceleration mao ang $5\\text{ m/s}^2$ ug ang trabaho $40\\text{ J}$.",
        "hints": ["Ikaduhang balaod ni Newton: gamita ang $F = ma$.", "Kahubitan sa trabaho: gamita ang $W = F \\times s$."],
        "options": ["Acceleration $5\\text{ m/s}^2$ ug trabaho $40\\text{ J}$.", "Acceleration $2\\text{ m/s}^2$ ug trabaho $20\\text{ J}$.", "Acceleration $10\\text{ m/s}^2$ ug trabaho $40\\text{ J}$.", "Acceleration $5\\text{ m/s}^2$ ug trabaho $20\\text{ J}$."]
    },
    "physics_Q2": {
        "prompt": "[{grade} Pagsusi sa Pisika (Abante)] Pag-analisar sa free fall kalabot sa {title}. Ang usa ka butang gihulog gikan sa paghunong sa vacuum ilalom sa gravity $g = 9.8\\text{ m/s}^2$. Unsa ang velocity $v$ ug gilay-on $h$ pagkahuman sa $t = 3\\text{ s}$?",
        "explain": "Lakang 1: Velocity $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$.\nLakang 2: Gilay-on $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$.\nLakang 3: Busa $v = 29.4\\text{ m/s}$ ug $h = 44.1\\text{ m}$.",
        "hints": ["Velocity sa free fall: $v = gt$.", "Gilay-on sa free fall: $h = \\frac{1}{2}gt^2$."],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} Pagsusi sa Kemika] Problema sa gidaghanon sa gas kalabot sa {title}. Sa $25^\\circ\\text{C}$ ug $1\\text{ atm}$, ang molar volume sa gas mao ang $24.5\\text{ L/mol}$. Sa samang kahimtang, unsa ang volume sa $\\text{L}$ sa $0.2\\text{ mol}$ niini nga gas?",
        "explain": "Lakang 1: Sumala sa balaod ni Avogadro, ang volume $V = n \\times V_m$.\nLakang 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nLakang 3: Ang kalkulasyon naghatag og $V = 4.90\\text{ L}$.",
        "hints": ["Ang volume direkta nga proporsyonal sa gidaghanon sa moles.", "Kalkulahin ang $V = n \\times V_m$."],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} Pagsusi sa Kemika (Abante)] Pag-analisar sa gidaghanon kalabot sa {title}. Ang acidic solution $A$ adunay $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ ug ang solution $B$ adunay $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Pila ka pilo nga mas dako ang konsentrasyon sa hydrogen ion sa $A$ kaysa $B$?",
        "explain": "Lakang 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nLakang 2: Ratio $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$.\nLakang 3: Ang konsentrasyon sa $A$ 100 ka pilo nga mas dako kaysa $B$.",
        "hints": ["Kalkulahin ang ratio $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "$10^{-3} / 10^{-5} = 10^2 = 100$."],
        "options": ["$10\\text{ ka pilo}$", "$100\\text{ ka pilo}$", "$1000\\text{ ka pilo}$", "$0.01\\text{ ka pilo}$"]
    },
    "thinking1": "Lohikal nga pangatarungan ug pagtuki",
    "goal": "Ipadapat ang mga prinsipyo sa {title} aron masulbad ang problema sa pagsusi."
}

# 8. jv (Javanese)
G5["jv"] = {
    "math_Q1": {
        "prompt": "[{grade} Panaliten Matematika] Pitakon panaliten babagan {title}. Rong wilangan asli $A$ lan $B$ nyukupi $A + 2B = 24$. Nalika $A$ nggayuh angka paling gedhe, pira regane $B$?",
        "explain": "Langkah 1: Ngatur persamaan ngasilake $A = 24 - 2B$.\nLangkah 2: Amarga $A, B \\ge 1$ wilangan asli, $2B$ kudu paling cilik supaya $A$ maksimal.\nLangkah 3: Wilangan asli paling cilik yaiku $B = 1$.\nLangkah 4: Ing titik iki, $A = 24 - 2(1) = 22$ (maksimal), mula $B = 1$.",
        "hints": ["Nilai wilangan asli paling cilik kanggo $B$ yaiku $1$.", "Amarga $A = 24 - 2B$, $A$ paling gedhe nalika $B$ paling cilik."],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} Panaliten Matematika (Lanjutan)] Masalah panaliten kompleks nggunakake {title}. Gunggung telung wilangan asli urut yaiku $3S$, lan asil ping wilangan paling cilik lan paling gedhe ditambah $1$ padha karo $T^2$. Yen $S = 15$, pira wilangan paling gedhe?",
        "explain": "Langkah 1: Upamane wilangan $n-1, n, n+1$, gunggunge $3n = 3S \\Rightarrow n = S = 15$.\nLangkah 2: Telung wilangan kasebut yaiku $14, 15, 16$.\nLangkah 3: Wilangan paling gedhe yaiku $16$.\nLangkah 4: Pamriksa: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
        "hints": ["Wilangan urut minangka $n-1, n, n+1$ ngasilake gunggung $3n$.", "Wilangan tengah yaiku $n = S = 15$."],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} Panaliten Fisika] Masalah ngetrapake prinsip {title}. Ing lumah rata tanpa gesekan, gaya $F = 10\\text{ N}$ tumindak ing benda kanthi massa $m = 2\\text{ kg}$ kanthi jarak $4\\text{ m}$. Pratelan endi sing bener nerangake gaweyan $W$ lan percepatan $a$?",
        "explain": "Langkah 1: Saka hukum Newton II $F = ma$, percepatan $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nLangkah 2: Gaweyan yaiku $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nLangkah 3: Mula percepatan yaiku $5\\text{ m/s}^2$ lan gaweyan $40\\text{ J}$.",
        "hints": ["Hukum Newton II: gunakake rumus $F = ma$.", "Definisi gaweyan: gunakake rumus $W = F \\times s$."],
        "options": ["Percepatan $5\\text{ m/s}^2$ lan gaweyan $40\\text{ J}$.", "Percepatan $2\\text{ m/s}^2$ lan gaweyan $20\\text{ J}$.", "Percepatan $10\\text{ m/s}^2$ lan gaweyan $40\\text{ J}$.", "Percepatan $5\\text{ m/s}^2$ lan gaweyan $20\\text{ J}$."]
    },
    "physics_Q2": {
        "prompt": "[{grade} Panaliten Fisika (Lanjutan)] Analisis obah tibo bebas gegandhengan karo {title}. Benda ditibakake saka kahanan meneng ing vakum ing gravitasi $g = 9.8\\text{ m/s}^2$. Pira kacepatan $v$ lan jarak tibo $h$ sawise $t = 3\\text{ s}$?",
        "explain": "Langkah 1: Kacepatan $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$.\nLangkah 2: Jarak $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$.\nLangkah 3: Dadi $v = 29.4\\text{ m/s}$ lan $h = 44.1\\text{ m}$.",
        "hints": ["Kacepatan tibo bebas: $v = gt$.", "Jarak tibo bebas: $h = \\frac{1}{2}gt^2$."],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} Panaliten Kimia] Masalah volume gas gegandhengan karo {title}. Ing $25^\\circ\\text{C}$ lan $1\\text{ atm}$, volume molar gas yaiku $24.5\\text{ L/mol}$. Ing kahanan sing padha, pira volume ing $\\text{L}$ saka $0.2\\text{ mol}$ gas iki?",
        "explain": "Langkah 1: Miturut hukum Avogadro, volume $V = n \\times V_m$.\nLangkah 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nLangkah 3: Petungan ngasilake $V = 4.90\\text{ L}$.",
        "hints": ["Volume sebanding langsung karo cacahe mol.", "Petung $V = n \\times V_m$."],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} Panaliten Kimia (Lanjutan)] Masalah analisis kuantitatif gegandhengan karo {title}. Larutan asam $A$ nduweni $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ lan larutan $B$ nduweni $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Pira tikel luwih gedhe konsentrasi ion hidrogen ing $A$ tinimbang $B$?",
        "explain": "Langkah 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nLangkah 2: Rasio $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$.\nLangkah 3: Konsentrasi ing $A$ yaiku 100 tikel luwih gedhe tinimbang $B$.",
        "hints": ["Petung rasio $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "$10^{-3} / 10^{-5} = 10^2 = 100$."],
        "options": ["$10\\text{ tikel}$", "$100\\text{ tikel}$", "$1000\\text{ tikel}$", "$0.01\\text{ tikel}$"]
    },
    "thinking1": "Naluri logis lan analisis",
    "goal": "Trapake prinsip {title} kanggo ngrampungake masalah panaliten."
}

# 9. su (Sundanese)
G5["su"] = {
    "math_Q1": {
        "prompt": "[{grade} Panalungtikan Matematika] Patarosan panalungtikan ngeunaan {title}. Dua wilangan asli $A$ jeung $B$ nyumponan $A + 2B = 24$. Nalika $A$ ngahontal nilai panggedéna, sabaraha nilai $B$?",
        "explain": "Léngkah 1: Ngarobih persamaan ngahasilkeun $A = 24 - 2B$.\nLéngkah 2: Kusabab $A, B \\ge 1$ wilangan asli, $2B$ kedah pangleutikna supados $A$ maksimal.\nLéngkah 3: Wilangan asli pangleutikna nyaéta $B = 1$.\nLéngkah 4: Dina titik ieu, $A = 24 - 2(1) = 22$ (maksimal), janten $B = 1$.",
        "hints": ["Nilai wilangan asli pangleutikna pikeun $B$ nyaéta $1$.", "Kusabab $A = 24 - 2B$, $A$ maksimal nalika $B$ pangleutikna."],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} Panalungtikan Matematika (Lanjutan)] Masalah panalungtikan kompléks ngagunakeun {title}. Jumlah tilu wilangan asli runtut nyaéta $3S$, sarta hasil kali wilangan pangleutikna jeung panggedéna ditambah $1$ sarua jeung $T^2$. Upami $S = 15$, sabaraha wilangan panggedéna?",
        "explain": "Léngkah 1: Upami wilangan $n-1, n, n+1$, jumlahna $3n = 3S \\Rightarrow n = S = 15$.\nLéngkah 2: Tilu wilangan éta nyaéta $14, 15, 16$.\nLéngkah 3: Wilangan panggedéna nyaéta $16$.\nLéngkah 4: Pamariksaan: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
        "hints": ["Wilangan runtut salaku $n-1, n, n+1$ ngahasilkeun jumlah $3n$.", "Wilangan tengah nyaéta $n = S = 15$."],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} Panalungtikan Fisika] Masalah nerapkeun prinsip {title}. Dina permukaan datar tanpa gesekan, gaya $F = 10\\text{ N}$ mangaruhan objék bermassa $m = 2\\text{ kg}$ sajauh $4\\text{ m}$. Pernyataan mana anu leres ngajelaskeun usaha $W$ sareng percepatan $a$?",
        "explain": "Léngkah 1: Tina hukum II Newton $F = ma$, percepatan $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nLéngkah 2: Usaha anu dilakukeun nyaéta $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nLéngkah 3: Ku kituna percepatan nyaéta $5\\text{ m/s}^2$ sareng usaha $40\\text{ J}$.",
        "hints": ["Hukum II Newton: anggo rumus $F = ma$.", "Wangenan usaha: anggo rumus $W = F \\times s$."],
        "options": ["Percepatan $5\\text{ m/s}^2$ sareng usaha $40\\text{ J}$.", "Percepatan $2\\text{ m/s}^2$ sareng usaha $20\\text{ J}$.", "Percepatan $10\\text{ m/s}^2$ sareng usaha $40\\text{ J}$.", "Percepatan $5\\text{ m/s}^2$ sareng usaha $20\\text{ J}$."]
    },
    "physics_Q2": {
        "prompt": "[{grade} Panalungtikan Fisika (Lanjutan)] Analisis gerak ragrag bébas patali {title}. Objék ragrag ti kaayaan cicing dina rohangan hampa handapeun gravitasi $g = 9.8\\text{ m/s}^2$. Sabaraha laju $v$ sareng jarak ragrag $h$ sanggeus $t = 3\\text{ s}$?",
        "explain": "Léngkah 1: Laju $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$.\nLéngkah 2: Jarak $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$.\nLéngkah 3: Janten $v = 29.4\\text{ m/s}$ sareng $h = 44.1\\text{ m}$.",
        "hints": ["Laju ragrag bébas: $v = gt$.", "Jarak ragrag bébas: $h = \\frac{1}{2}gt^2$."],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} Panalungtikan Kimia] Masalah volume gas patali {title}. Dina $25^\\circ\\text{C}$ sareng $1\\text{ atm}$, volume molar gas nyaéta $24.5\\text{ L/mol}$. Dina kaayaan anu sami, sabaraha volume dina $\\text{L}$ tina $0.2\\text{ mol}$ gas ieu?",
        "explain": "Léngkah 1: Numutkeun hukum Avogadro, volume $V = n \\times V_m$.\nLéngkah 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nLéngkah 3: Itungan ngahasilkeun $V = 4.90\\text{ L}$.",
        "hints": ["Volume sabanding langsung sareng jumlah mol.", "Itung $V = n \\times V_m$."],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} Panalungtikan Kimia (Lanjutan)] Masalah analisis kuantitatif patali {title}. Larutan asam $A$ mibanda $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ sareng larutan $B$ mibanda $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Sabaraha kali lipet konsentrasi ion hidrogén dina $A$ langkung ageung tibatan $B$?",
        "explain": "Léngkah 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nLéngkah 2: Babandingan $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$.\nLéngkah 3: Konsentrasi $A$ nyaéta 100 kali lipet langkung ageung tibatan $B$.",
        "hints": ["Itung babandingan $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "$10^{-3} / 10^{-5} = 10^2 = 100$."],
        "options": ["$10\\text{ kali}$", "$100\\text{ kali}$", "$1000\\text{ kali}$", "$0.01\\text{ kali}$"]
    },
    "thinking1": "Pamikiran logis sareng analisis",
    "goal": "Larapkeun prinsip {title} pikeun ngaréngsékeun masalah panalungtikan."
}

# 10. tet (Tetum)
G5["tet"] = {
    "math_Q1": {
        "prompt": "[{grade} Investigasaun Matemátika] Pergunta investigasaun kona-ba {title}. Númeru naturál rua $A$ no $B$ kumpre $A + 2B = 24$. Bainhira $A$ hetan valór másimu posivel, valór $B$ nian hira?",
        "explain": "Pasu 1: Rearranja ekwasaun fó $A = 24 - 2B$.\nPasu 2: Tanba $A, B \\ge 1$ númeru naturál, $2B$ tenke mínimu atu $A$ másimu.\nPasu 3: Númeru naturál ki'ik liu mak $B = 1$.\nPasu 4: Iha pontu ne'e, $A = 24 - 2(1) = 22$ (másimu), tan ne'e $B = 1$.",
        "hints": ["Valór naturál mínimu ba $B$ mak $1$.", "Tanba $A = 24 - 2B$, $A$ másimu bainhira $B$ mínimu."],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} Investigasaun Matemátika (Avansadu)] Problema investigasaun kompleksu uza {title}. Soma husi númeru naturál tuir malu tolu mak $3S$, no rezultadu husi ki'ik liu no boot liu aumenta $1$ hanesan $T^2$. Bainhira $S = 15$, númeru boot liu mak ida-ne'ebé?",
        "explain": "Pasu 1: Konsidera númeru sira mak $n-1, n, n+1$, soma mak $3n = 3S \\Rightarrow n = S = 15$.\nPasu 2: Númeru tolu ne'e mak $14, 15, 16$.\nPasu 3: Númeru boot liu mak $16$.\nPasu 4: Verifikasaun: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
        "hints": ["Númeru tuir malu $n-1, n, n+1$ fó soma $3n$.", "Númeru klaran mak $n = S = 15$."],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} Investigasaun Fízika] Problema ne'ebé aplika prinsípiu husi {title}. Iha superfísie orizontál lahó atritu, forsa orizontál konstante $F = 10\\text{ N}$ atua iha masa $m = 2\\text{ kg}$ durante $4\\text{ m}$. Deklarasaun ida-ne'ebé mak loos kona-ba serbisu $W$ no acelerasaun $a$?",
        "explain": "Pasu 1: Husi lei daruak Newton $F = ma$, acelerasaun $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nPasu 2: Serbisu mak $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nPasu 3: Tan ne'e acelerasaun mak $5\\text{ m/s}^2$ no serbisu mak $40\\text{ J}$.",
        "hints": ["Lei daruak Newton: uza fórmula $F = ma$.", "Definisaun serbisu: uza fórmula $W = F \\times s$."],
        "options": ["Acelerasaun $5\\text{ m/s}^2$ no serbisu $40\\text{ J}$.", "Acelerasaun $2\\text{ m/s}^2$ no serbisu $20\\text{ J}$.", "Acelerasaun $10\\text{ m/s}^2$ no serbisu $40\\text{ J}$.", "Acelerasaun $5\\text{ m/s}^2$ no serbisu $20\\text{ J}$."]
    },
    "physics_Q2": {
        "prompt": "[{grade} Investigasaun Fízika (Avansadu)] Análize movimentu monu livre kona-ba {title}. Objetu monu husi deskansu iha vakuu okos gravidade $g = 9.8\\text{ m/s}^2$. Velosidade $v$ no distánsia $h$ hira depois $t = 3\\text{ s}$?",
        "explain": "Pasu 1: Velosidade $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$.\nPasu 2: Distánsia $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$.\nPasu 3: Tan ne'e $v = 29.4\\text{ m/s}$ no $h = 44.1\\text{ m}$.",
        "hints": ["Velosidade monu livre: $v = gt$.", "Distánsia monu livre: $h = \\frac{1}{2}gt^2$."],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} Investigasaun Kímika] Problema volume gás kona-ba {title}. Iha $25^\\circ\\text{C}$ no $1\\text{ atm}$, volume molár gás mak $24.5\\text{ L/mol}$. Iha kondisaun hanesan, volume iha $\\text{L}$ husi $0.2\\text{ mol}$ gás ne'e hira?",
        "explain": "Pasu 1: Tuir lei Avogadro, volume $V = n \\times V_m$.\nPasu 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nPasu 3: Kálkulu fó $V = 4.90\\text{ L}$.",
        "hints": ["Volume proporsionál diretu ba númeru mol.", "Kalkula $V = n \\times V_m$."],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} Investigasaun Kímika (Avansadu)] Problema análize kuantitativu kona-ba {title}. Solusaun ásida $A$ iha $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ no solusaun $B$ iha $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Konsentrasaun iñaun idrojéniu iha $A$ boot liu fali iha $B$ dala hira?",
        "explain": "Pasu 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nPasu 2: Rásiu $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$.\nPasu 3: Konsentrasaun $A$ boot liu $B$ dala 100.",
        "hints": ["Kalkula rásiu $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "$10^{-3} / 10^{-5} = 10^2 = 100$."],
        "options": ["$10\\text{ dala}$", "$100\\text{ dala}$", "$1000\\text{ dala}$", "$0.01\\text{ dala}$"]
    },
    "thinking1": "Rasiosíniu lójiku no análize",
    "goal": "Aplica prinsipiu sira {title} nian hodi rezolve problema investigasaun."
}

# 11. yue (Cantonese)
G5["yue"] = {
    "math_Q1": {
        "prompt": "[{grade} 數學思維探索] 關於 {title} 嘅探究問題。已知兩個自然數 $A$ 同 $B$ 滿足關係式 $A + 2B = 24$。當 $A$ 攞到最大值嘅時候，$B$ 嘅值係幾多？",
        "explain": "步驟 1: 整理等式得出 $A = 24 - 2B$。\n步驟 2: 因為 $A$ 同 $B$ 都係自然數，所以 $B \\ge 1$ 同埋 $A \\ge 1$。\n步驟 3: 要令 $A$ 最大，減去嘅項 $2B$ 必須最小，因此 $B = 1$。\n步驟 4: 此時 $A = 24 - 2(1) = 22$ 攞到最大值，所求嘅 $B$ 值係 $1$。",
        "hints": ["自然數 $B$ 嘅最小值係 $1$。", "因為 $A = 24 - 2B$，當 $B$ 最小嗰陣，$A$ 達到最大。"],
        "options": ["$1$", "$2$", "$3$", "$4$"]
    },
    "math_Q2": {
        "prompt": "[{grade} 數學思維探索 (進階)] 關於 {title} 嘅複雜探究問題。三個連續自然數嘅總和係 $3S$，而最小同最大嗰兩個數嘅乘積加 $1$ 等於 $T^2$。如果 $S = 15$，呢三個數入面最大嘅係幾多？",
        "explain": "步驟 1: 設呢三個數為 $n-1, n, n+1$，總和係 $3n = 3S \\Rightarrow n = S = 15$。\n步驟 2: 呢三個數係 $14, 15, 16$。\n步驟 3: 最大嘅數係 $16$。\n步驟 4: 驗算: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$。",
        "hints": ["設連續數為 $n-1, n, n+1$ 總和就係 $3n$。", "中間數係 $n = S = 15$。"],
        "options": ["$14$", "$15$", "$16$", "$17$"]
    },
    "physics_Q1": {
        "prompt": "[{grade} 物理思維探索] 應用 {title} 原理嘅問題。喺光滑水平面上，一個質量 $m = 2\\text{ kg}$ 嘅物體受到一個恆定水平力 $F = 10\\text{ N}$ 作用行咗 $4\\text{ m}$。邊個陳述正確描述所做嘅功 $W$ 同加速度 $a$？",
        "explain": "步驟 1: 根據牛頓第二定律 $F = ma$，加速度 $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$。\n步驟 2: 所做嘅功係 $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$。\n步驟 3: 所以加速度係 $5\\text{ m/s}^2$，所做嘅功係 $40\\text{ J}$。",
        "hints": ["牛頓第二定律: 用公式 $F = ma$。", "功嘅定義: 用公式 $W = F \\times s$。"],
        "options": ["加速度係 $5\\text{ m/s}^2$，功係 $40\\text{ J}$。", "加速度係 $2\\text{ m/s}^2$，功係 $20\\text{ J}$。", "加速度係 $10\\text{ m/s}^2$，功係 $40\\text{ J}$。", "加速度係 $5\\text{ m/s}^2$，功係 $20\\text{ J}$。"]
    },
    "physics_Q2": {
        "prompt": "[{grade} 物理思維探索 (進階)] 同 {title} 相關嘅自由落體運動分析。一個物體喺真空中由靜止開始喺重力 $g = 9.8\\text{ m/s}^2$ 下落下。喺 $t = 3\\text{ s}$ 之後，佢嘅速度 $v$ 同落下距離 $h$ 係幾多？",
        "explain": "步驟 1: 速度 $v = gt = 9.8 \\times 3 = 29.4\\text{ m/s}$。\n步驟 2: 落下距離 $h = \\frac{1}{2}gt^2 = 0.5 \\times 9.8 \\times 9 = 44.1\\text{ m}$。\n步驟 3: 所以 $v = 29.4\\text{ m/s}$，$h = 44.1\\text{ m}$。",
        "hints": ["自由落體速度: $v = gt$。", "自由落體距離: $h = \\frac{1}{2}gt^2$。"],
        "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
    },
    "chemistry_Q1": {
        "prompt": "[{grade} 化學思維探索] 關於 {title} 嘅氣體體積探究問題。喺 $25^\\circ\\text{C}$ 同 $1\\text{ atm}$ 下，氣體嘅摩爾體積係 $24.5\\text{ L/mol}$。喺相同條件下，呢種氣體 $0.2\\text{ mol}$ 嘅體積係幾多 $\\text{L}$？",
        "explain": "步驟 1: 根據阿伏伽德羅定律，體積 $V = n \\times V_m$。\n步驟 2: $V = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$。\n步驟 3: 計算得出 $V = 4.90\\text{ L}$。",
        "hints": ["體積同摩爾數成正比。", "計算 $V = n \\times V_m$。"],
        "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
    },
    "chemistry_Q2": {
        "prompt": "[{grade} 化學思維探索 (進階)] 關於 {title} 嘅定量分析問題。酸性溶液 $A$ 嘅 $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$，而溶液 $B$ 嘅 $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$。溶液 $A$ 嘅氫離子濃度係溶液 $B$ 嘅幾多倍？",
        "explain": "步驟 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$，$[\\text{H}^+]_B = 10^{-5}\\text{ M}$。\n步驟 2: 比例 $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^2 = 100$。\n步驟 3: 溶液 $A$ 嘅濃度係溶液 $B$ 嘅 100 倍。",
        "hints": ["計算比例 $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$。", "$10^{-3} / 10^{-5} = 10^2 = 100$。"],
        "options": ["$10\\text{ 倍}$", "$100\\text{ 倍}$", "$1000\\text{ 倍}$", "$0.01\\text{ 倍}$"]
    },
    "thinking1": "邏輯思維與分析",
    "goal": "應用 {title} 嘅原理嚟解決思維探究問題。"
}

out_p = ROOT / 'scripts/think/templates_southeast_east_asian.py'
with open(out_p, 'w', encoding='utf-8') as f:
    f.write('# -*- coding: utf-8 -*-\n"""\nTemplates for Southeast and East Asian languages:\nth, my, km, id, ms, tl, ceb, jv, su, tet, yue\n"""\n\n')
    f.write('TEMPLATES_GROUP_5 = ' + repr(G5) + '\n')

print(f"Generated {out_p} with {len(G5)} languages.")
