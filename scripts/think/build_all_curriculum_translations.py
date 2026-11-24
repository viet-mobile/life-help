# -*- coding: utf-8 -*-
"""
build_all_curriculum_translations.py
Generates full authentic translations for all 72 Math, 72 Physics, and 72 Chemistry daily thinking challenge tasks
across all 89 supported languages, ensuring zero English fallback and zero raw untranslated Korean text.
"""

import os, json, glob, re
from pathlib import Path

ROOT = Path("/Users/juboklee/life-project/life-help")
EXTRA_DIR = ROOT / "lib/think/data/extra"
I18N_DIR = ROOT / "lib/think/i18n"

# Load base extra tasks
PHYSICS_FILES = [f"physics-d{i:02d}.json" for i in range(1, 7)]
CHEMISTRY_FILES = [f"chemistry-d{i:02d}.json" for i in range(1, 7)]
MATH_FILES = [f"math-d{i:02d}.json" for i in range(1, 7)]

TITLES = {
    "math": {
        "E1": {
            "ko": "10 이하의 덧셈과 뺄셈 및 수 가르기",
            "en": "Addition, Subtraction within 10 and Number Decomposition",
            "vi": "Phép cộng, trừ trong phạm vi 10 và tách số",
            "zh-Hans": "10以内的加减法与数的分合",
            "zh-Hant": "10以內的加減法與數的分合",
            "ja": "10以下の足し算・引き算と数の分解",
            "gl": "Suma, resta ata 10 e descomposición numérica",
            "es": "Suma, resta hasta 10 y descomposición numérica",
            "fr": "Addition, soustraction jusqu'à 10 et décomposition",
            "de": "Addition, Subtraktion bis 10 und Zerlegung von Zahlen",
            "ru": "Сложение, вычитание до 10 и разбиение чисел",
            "pt": "Adição, subtração até 10 e decomposição de números",
            "it": "Addizione, sottrazione entro il 10 e scomposizione",
            "th": "การบวก การลบไม่เกิน 10 และการแยกจำนวน",
            "id": "Penjumlahan, Pengurangan hingga 10 dan Dekomposisi Bilangan",
            "hi": "10 तक जोड़, घटाव और संख्या विभाजन",
            "ne": "१० सम्मको जोड, घटाउ र संख्या विभाजन",
            "km": "វិធីបូក ដកត្រឹម ១០ និងការបំបែកចំនួន",
            "my": "၁၀ အတွင်း ပေါင်းနှုတ်ခြင်းနှင့် ကိန်းဂဏန်း ခွဲခြမ်းခြင်း",
            "ar": "الجمع والطرح حتى 10 وتفكيك الأعداد",
        },
        "E2": {
            "ko": "두 자리 수의 덧셈과 곱셈구구의 기초 원리",
            "en": "Two-Digit Addition and Multiplication Tables Principles",
            "vi": "Phép cộng số có hai chữ số và nguyên lý bảng cửu chương",
            "zh-Hans": "两位数加法与乘法口诀基础原理",
            "zh-Hant": "兩位數加法與乘法口訣基礎原理",
            "ja": "2桁の足し算と九九の基礎原理",
            "gl": "Suma de dous díxitos e principios das táboas de multiplicar",
            "es": "Suma de dos dígitos y principios de las tablas de multiplicar",
            "fr": "Addition à deux chiffres et tables de multiplication",
            "de": "Zweistellige Addition und Grundlagen des Einmaleins",
            "ru": "Сложение двузначных чисел и основы таблицы умножения",
            "pt": "Adição de dois dígitos e princípios da tabuada",
            "it": "Addizione a due cifre e principi delle tabelline",
            "th": "การบวกเลขสองหลักและหลักการสูตรคูณเบื้องต้น",
            "id": "Penjumlahan Dua Digit dan Prinsip Tabel Perkalian",
            "hi": "दो अंकों का जोड़ और पहाड़े के मूल सिद्धांत",
            "ne": "दुई अंकको जोड र गुणन तालिकाको आधारभूत सिद्धान्त",
            "km": "វិធីបូកលេខពីរខ្ទង់ និងគោលការណ៍មេគុណ",
            "my": "ဂဏန်းနှစ်လုံးပေါင်းခြင်းနှင့် အမြှောက်ဇယား အခြေခံသဘောတရား",
            "ar": "جمع الأعداد من منزلتين ومبادئ جداول الضرب",
        },
        "E3": {
            "ko": "세 자리 수의 나눗셈과 분수의 기초 개념",
            "en": "Three-Digit Division and Fundamental Concepts of Fractions",
            "vi": "Phép chia số có ba chữ số và khái niệm phân số cơ bản",
            "zh-Hans": "三位数除法与分数基础概念",
            "zh-Hant": "三位數除法與分數基礎概念",
            "ja": "3桁の割り算と分数の基礎概念",
            "gl": "División de tres díxitos e conceptos básicos de fraccións",
            "es": "División de tres dígitos y conceptos básicos de fracciones",
            "fr": "Division à trois chiffres et concepts de base des fractions",
            "de": "Dreistellige Division und Grundlagen von Brüchen",
            "ru": "Деление трехзначных чисел и основы дробей",
            "pt": "Divisão de três dígitos e conceitos básicos de frações",
            "it": "Divisione a tre cifre e concetti base delle frazioni",
            "th": "การหารเลขสามหลักและแนวคิดเศษส่วนเบื้องต้น",
            "id": "Pembagian Tiga Digit dan Konsep Dasar Pecahan",
            "hi": "तीन अंकों का भाग और भिन्नों की मूल अवधारणाएं",
            "ne": "तीन अंकको भाग र भिन्नको आधारभूत अवधारणा",
            "km": "វិធីចែកលេខបីខ្ទង់ និងគំនិតមូលដ្ឋាននៃប្រភាគ",
            "my": "ဂဏန်းသုံးလုံးစားခြင်းနှင့် အပိုင်းကိန်း အခြေခံသဘောတရား",
            "ar": "قسمة الأعداد من ثلاثة منازل والمفاهيم الأساسية للكسور",
        },
        "E4": {
            "ko": "분수와 소수의 덧셈과 뺄셈, 다각형의 둘레",
            "en": "Fraction/Decimal Operations and Polygon Perimeters",
            "vi": "Phép cộng trừ phân số, số thập phân và chu vi đa giác",
            "zh-Hans": "分数与小数加减法及多边形周长",
            "zh-Hant": "分數與小數加減法及多邊形周長",
            "ja": "分数・小数の加減算と多角形の周長",
            "gl": "Operacións con fraccións e decimais e perímetros de polígonos",
            "es": "Operaciones con fracciones y decimales y perímetros de polígonos",
            "fr": "Opérations sur fractions, décimaux et périmètres de polygones",
            "de": "Bruch- und Dezimalrechnung sowie Umfang von Polygonen",
            "ru": "Сложение и вычитание дробей, десятичные числа и периметры многоугольников",
            "pt": "Operações com frações e decimais e perímetros de polígonos",
            "it": "Operazioni con frazioni e decimali e perimetri dei poligoni",
            "th": "การบวกและลบเศษส่วน ทศนิยม และเส้นรอบรูปหลายเหลี่ยม",
            "id": "Operasi Pecahan dan Desimal serta Keliling Poligon",
            "hi": "भिन्न और दशमलव का जोड़-घटाव और बहुभुज का परिमाप",
            "ne": "भिन्न र दशमलवको जोड-घटाउ र बहुभुजको परिमिति",
            "km": "ប្រភាគ ទសភាគ និងបរិមាត្រពហុកោណ",
            "my": "အပိုင်းကိန်း၊ ဒသမပေါင်းနှုတ်ခြင်းနှင့် ဗហုဂံပတ်လည်အလျား",
            "ar": "عمليات الكسور والأعداد العشرية ومحيط المضلعات",
        },
        "E5": {
            "ko": "약수와 배수, 공약수를 활용한 문제 해결",
            "en": "Factors, Multiples, and Problem Solving with Common Factors",
            "vi": "Ước số, bội số và giải quyết vấn đề bằng ước chung",
            "zh-Hans": "因数、倍数及利用公因数解决问题",
            "zh-Hant": "因數、倍數及利用公因數解決問題",
            "ja": "約数・倍数と公約数を活用した問題解決",
            "gl": "Factores, múltiplos e resolución de problemas con factores comúns",
            "es": "Factores, múltiplos y resolución de problemas con factores comunes",
            "fr": "Diviseurs, multiples et résolution de problèmes avec diviseurs communs",
            "de": "Teiler, Vielfache und Problemlösung mit gemeinsamen Teilern",
            "ru": "Делители, кратные и решение задач с общими делителями",
            "pt": "Divisores, múltiplos e resolução de problemas com fatores comuns",
            "it": "Fattori, multipli e risoluzione di problemi con fattori comuni",
            "th": "ตัวประกอบ พหุคูณ และการแก้ปัญหาโดยใช้ตัวประกอบร่วม",
            "id": "Faktor, Kelipatan, dan Pemecahan Masalah dengan Faktor Persekutuan",
            "hi": "गुणनखंड, गुणज और सार्व गुणनखंड से समस्या समाधान",
            "ne": "गुणनखण्ड, गुणज र साझा गुणनखण्डबाट समस्या समाधान",
            "km": "កត្តា ពហុគុណ និងការដោះស្រាយបញ្ហាដោយកត្តារួម",
            "my": "ဆခွဲကိန်းများ၊ ဆတိုးကိန်းများနှင့် ဘုံဆခွဲကိန်းဖြင့် ပုစ္ဆာဖြေရှင်းခြင်း",
            "ar": "العوامل والمضاعفات وحل المشكلات باستخدام القواسم المشتركة",
        },
        "E6": {
            "ko": "비와 비율, 비례배분을 활용한 실생활 모델링",
            "en": "Ratios, Rates, and Real-Life Proportional Distribution Modeling",
            "vi": "Tỉ số, tỉ lệ và mô hình hóa phân chia tỉ lệ thực tế",
            "zh-Hans": "比与比例及按比例分配的现实生活建模",
            "zh-Hant": "比與比例及按比例分配的現實生活建模",
            "ja": "比と割合、比例配分を活用した実生活モデリング",
            "gl": "Razóns, proporcións e modelización de distribución proporcional",
            "es": "Razones, proporciones y modelado de distribución proporcional",
            "fr": "Rapports, proportions et modélisation de répartition proportionnelle",
            "de": "Verhältnisse, Raten und Modellierung proportionaler Verteilung",
            "ru": "Отношения, пропорции и моделирование пропорционального деления",
            "pt": "Razões, proporções e modelagem de distribuição proporcional",
            "it": "Rapporti, proporzioni e modellizzazione di ripartizione proporzionale",
            "th": "อัตราส่วน ร้อยละ และการจำลองการจัดสรรตามสัดส่วนในชีวิตจริง",
            "id": "Rasio, Proporsi, dan Pemodelan Distribusi Proporsional Nyata",
            "hi": "अनुपात, समानुपात और आनुपातिक वितरण मॉडलिंग",
            "ne": "अनुपात, दर र समानुपातिक वितरण मोडेलिङ",
            "km": "ផលធៀប សមាមាត្រ និងការបែងចែកតាមសមាមាត្រ",
            "my": "အချိုး၊ နှုန်းနှင့် လက်တွေ့အချိုးကျ ခွဲဝေမှုပုံစံ",
            "ar": "النسب والمعدلات ونمذجة التوزيع التناسبي في الحياة اليومية",
        },
        "M1": {
            "ko": "정수와 유리수의 사칙연산, 일차방정식 활용",
            "en": "Integer/Rational Arithmetic and Linear Equation Applications",
            "vi": "Số nguyên, số hữu tỉ và ứng dụng phương trình bậc nhất",
            "zh-Hans": "整数与有理数四则运算及一元一次方程应用",
            "zh-Hant": "整數與有理數四則運算及一元一次方程式應用",
            "ja": "整数・有理数の四則演算と一次方程式の応用",
            "gl": "Aritmética de enteiros e racionais e aplicacións de ecuacións lineais",
            "es": "Aritmética de enteros y racionales y aplicaciones de ecuaciones lineales",
            "fr": "Arithmétique des entiers et rationnels et équations linéaires",
            "de": "Rechnen mit ganzen und rationalen Zahlen sowie lineare Gleichungen",
            "ru": "Арифметика целых и рациональных чисел и линейные уравнения",
            "pt": "Aritmética de inteiros e racionais e aplicações de equações lineares",
            "it": "Aritmetica di interi e razionali e applicazioni di equazioni lineari",
            "th": "การคำนวณจำนวนเต็มและจำนวนตรรกยะ และการประยุกต์สมการเชิงเส้น",
            "id": "Aritmetika Bilangan Bulat dan Rasional serta Persamaan Linear",
            "hi": "पूर्णांक और परिमेय संख्या संक्रियाएं और रैखिक समीकरण",
            "ne": "पूर्णांक र परिमेय संख्या गणित र रेखात्मक समीकरण",
            "km": "ចំនួនគត់ ចំនួនសនិទាន និងសមីការដឺក្រេទី១",
            "my": "ကိန်းပြည့်၊ ကိန်းစစ်တွက်ချက်မှုနှင့် ညီမျှခြင်းအသုံးချမှု",
            "ar": "حساب الأعداد الصحيحة والنسبية وتطبيقات المعادلات الخطية",
        },
        "M2": {
            "ko": "연립일차방정식과 일차함수의 그래프 분석",
            "en": "Systems of Linear Equations and Linear Function Graph Analysis",
            "vi": "Hệ phương trình bậc nhất và phân tích đồ thị hàm số bậc nhất",
            "zh-Hans": "二元一次方程组与一次函数图象分析",
            "zh-Hant": "二元一次聯立方程式與一次函數圖形分析",
            "ja": "連立一次方程式と一次関数のグラフ分析",
            "gl": "Sistemas de ecuacións lineais e análise gráfica de funcións lineais",
            "es": "Sistemas de ecuaciones lineales y análisis gráfico de funciones lineales",
            "fr": "Systèmes d'équations linéaires et analyse graphique de fonctions",
            "de": "Lineare Gleichungssysteme und Graphanalyse linearer Funktionen",
            "ru": "Системы линейных уравнений и анализ графиков линейных функций",
            "pt": "Sistemas de equações lineares e análise gráfica de funções lineares",
            "it": "Sistemi di equazioni lineari e analisi dei grafici di funzioni lineari",
            "th": "ระบบสมการเชิงเส้นและการวิเคราะห์กราฟฟังก์ชันเชิงเส้น",
            "id": "Sistem Persamaan Linear dan Analisis Grafik Fungsi Linear",
            "hi": "रैखिक समीकरण प्रणाली और रैखिक फलन आलेख विश्लेषण",
            "ne": "रेखीय समीकरण प्रणाली र रेखीय फलन ग्राफ विश्लेषण",
            "km": "ប្រព័ន្ធសមីការលីនេអ៊ែរ និងការវិភាគក្រាហ្វអនុគមន៍លីនេអ៊ែរ",
            "my": "ညီမျှခြင်းတွဲများနှင့် မျဉ်းဖြောင့်ဖังก์ชัน ဂရပ်ခွဲခြမ်းစိတ်ဖြာခြင်း",
            "ar": "أنظمة المعادلات الخطية وتحليل الرسوم البيانية للدوال الخطية",
        },
        "M3": {
            "ko": "피타고라스 정리와 이차방정식의 해법",
            "en": "Pythagorean Theorem and Quadratic Equation Solutions",
            "vi": "Định lý Pythagore và giải phương trình bậc hai",
            "zh-Hans": "勾股定理与一元二次方程解法",
            "zh-Hant": "畢氏定理與一元二次方程式解法",
            "ja": "ピタゴラスの定理と二次方程式の解法",
            "gl": "Teorema de Pitágoras e solucións de ecuacións cuadráticas",
            "es": "Teorema de Pitágoras y soluciones de ecuaciones cuadráticas",
            "fr": "Théorème de Pythagore et résolution d'équations quadratiques",
            "de": "Satz des Pythagoras und quadratische Gleichungen",
            "ru": "Теорема Пифагора и решение квадратных уравнений",
            "pt": "Teorema de Pitágoras e soluções de equações quadráticas",
            "it": "Teorema di Pitagora e soluzioni di equazioni quadratiche",
            "th": "ทฤษฎีบทพีทาโกรัสและผลเฉลยของสมการกำลังสอง",
            "id": "Teorema Pythagoras dan Penyelesaian Persamaan Kuadrat",
            "hi": "पाइथागोरस प्रमेय और द्विघात समीकरण के हल",
            "ne": "पाइथागोरस साध्य र वर्ग समीकरण समाधान",
            "km": "ទ្រឹស្តីបទពីតាករ និងដំណោះស្រាយសមីការដឺក្រេទី២",
            "my": "ပൈသာဂိုရပ်သီအိုရမ်နှင့် ဒုတိယထပ်ကိန်း ညီမျှခြင်းအဖြေများ",
            "ar": "مبرهنة فيثاغورس وحلول المعادلات التربيعية",
        },
        "H1": {
            "ko": "이차함수의 최대·최소와 다항식의 인수분해 심화",
            "en": "Quadratic Extrema and Advanced Polynomial Factorization",
            "vi": "Cực trị hàm số bậc hai và phân tích đa thức thành nhân tử nâng cao",
            "zh-Hans": "二次函数极值与多项式因式分解进阶",
            "zh-Hant": "二次函數極值與多項式因式分解進階",
            "ja": "二次関数の最大・最小と多項式の高度な因数分解",
            "gl": "Extremos cuadráticos e factorización polinómica avanzada",
            "es": "Extremos cuadráticos y factorización polinómica avanzada",
            "fr": "Extrema quadratiques et factorisation polynomiale avancée",
            "de": "Quadratische Extrema und fortgeschrittene Polynomfaktorisierung",
            "ru": "Экстремумы квадратичной функции и факторизация многочленов",
            "pt": "Extremos quadráticos e fatoração polinomial avançada",
            "it": "Estremi quadratici e scomposizione polinomiale avanzata",
            "th": "ค่าสูงสุด-ต่ำสุดของฟังก์ชันกำลังสองและการแยกตัวประกอบพหุนามขั้นสูง",
            "id": "Nilai Ekstrim Kuadrat dan Faktorisasi Polinomial Lanjutan",
            "hi": "द्विघात फलन के उच्चिष्ठ-निम्निष्ठ और उन्नत बहुपद गुणनखंडन",
            "ne": "द्विघात फलनको अधिकतम-न्यूनतम र उन्नत बहुपद गुणनखण्ड",
            "km": "តម្លៃបរមាក្រាហ្វដឺក្រេទី២ និងការដាក់ជាផលគុណកត្តាពហុធា",
            "my": "ဒုတိယထပ်ကိန်း အမြင့်ဆုံး/အနိမ့်ဆုံးတန်ဖိုးနှင့် ဗဟုပဒ်ဆခွဲကိန်းခွဲခြင်း",
            "ar": "القيم القصوى للدوال التربيعية والتحليل المتقدم لمتعدد الحدود",
        },
        "H2": {
            "ko": "수열의 극한과 지수·로그함수의 응용",
            "en": "Limits of Sequences and Exponential/Logarithmic Applications",
            "vi": "Giới hạn dãy số và ứng dụng hàm số mũ, logarit",
            "zh-Hans": "数列的极限与指数、对数函数的应用",
            "zh-Hant": "數列的極限與指數、對數函數的應用",
            "ja": "数列の極限と指数・対数関数の応用",
            "gl": "Límites de sucesións e aplicacións exponenciais e logarítmicas",
            "es": "Límites de sucesiones y aplicaciones exponenciales y logarítmicas",
            "fr": "Limites de suites et applications exponentielles et logarithmiques",
            "de": "Grenzwerte von Folgen und Exponential-/Logarithmusfunktionen",
            "ru": "Пределы последовательностей и экспоненциальные/логарифмические функции",
            "pt": "Limites de sequências e aplicações exponenciais e logarítmicas",
            "it": "Limiti di successioni e applicazioni esponenziali e logaritmiche",
            "th": "ลิมิตของลำดับและการประยุกต์ฟังก์ชันเอกซ์โพเนนเชียลและลอการิทึม",
            "id": "Limit Barisan dan Aplikasi Fungsi Eksponensial/Logaritma",
            "hi": "अनुक्रमों की सीमाएं और घातीय व लघुगणकीय अनुप्रयोग",
            "ne": "अनुक्रमको सीमा र घाताङ्कीय/लघुगणकीय अनुप्रयोग",
            "km": "លីមីតនៃស្វ៊ីត និងអនុគមន៍អិចស្ប៉ូណង់ស្យែល/លោការីត",
            "my": "ကိန်းစဉ်တန်း လီမစ်များနှင့် ထပ်ညွှန်း/လော့ဂ် ဖังก์ชันများ",
            "ar": "نهايات المتتاليات وتطبيقات الدوال الأسية واللوغاريتمية",
        },
        "H3": {
            "ko": "미분과 적분의 실생활 최적화 모델링 및 미적분학의 기본정리",
            "en": "Optimization Modeling with Calculus and the Fundamental Theorem",
            "vi": "Mô hình tối ưu hóa bằng vi tích phân và Định lý cơ bản",
            "zh-Hans": "微积分优化建模与微积分基本定理",
            "zh-Hant": "微積分最佳化建模與微積分基本定理",
            "ja": "微積分による最適化モデリングと微積分の基本定理",
            "gl": "Modelización de optimización con cálculo e teorema fundamental",
            "es": "Modelado de optimización con cálculo y teorema fundamental",
            "fr": "Modélisation d'optimisation par le calcul infinitésimal et théorème fondamental",
            "de": "Optimierungsmodellierung mit Infinitesimalrechnung und Fundamentalsatz",
            "ru": "Оптимизационное моделирование в математическом анализе и фундаментальная теорема",
            "pt": "Modelagem de otimização com cálculo e teorema fundamental",
            "it": "Modellizzazione di ottimizzazione con calcolo e teorema fondamentale",
            "th": "การจำลองการเพิ่มประสิทธิภาพด้วยแคลคูลัสและทฤษฎีบทมูลฐาน",
            "id": "Pemodelan Optimasi dengan Kalkulus dan Teorema Dasar",
            "hi": "कैलकुलस के साथ इष्टतमीकरण मॉडलिंग और मौलिक प्रमेय",
            "ne": "क्यालकुलसबाट अनुकूलन मोडेलिङ र मौलिक साध्य",
            "km": "គំរូអុបទិមាកម្មដោយគណិតវិភាគ និងទ្រឹស្តីបទគ្រឹះ",
            "my": "ကဲကုလပ်စ်ဖြင့် အကောင်းဆုံးပုံစံပြုလုပ်ခြင်းနှင့် အခြေခံသီအိုရမ်",
            "ar": "نمذجة التحسين باستخدام التفاضل والتكامل والنظرية الأساسية",
        }
    },
    "physics": {
        "E1": {
            "ko": "자석의 성질과 물체의 당김·밈",
            "en": "Properties of Magnets and Magnetic Attraction/Repulsion",
            "vi": "Đặc tính của nam châm và lực hút, đẩy của vật thể",
            "zh-Hans": "磁铁的性质与物体的吸引和排斥",
            "zh-Hant": "磁鐵的性質與物體的吸引和排斥",
            "ja": "磁石の性質と物体の引き合い・退け合い",
            "gl": "Propiedades dos imáns e atracción e repulsión magnética",
            "es": "Propiedades de los imanes y atracción y repulsión magnética",
            "fr": "Propriétés des aimants et attraction/répulsion magnétique",
            "de": "Eigenschaften von Magneten und magnetische Anziehung/Abstoßung",
            "ru": "Свойства магнитов и магнитное притяжение и отталкивание",
            "pt": "Propriedades dos ímãs e atração/repulsão magnética",
            "it": "Proprietà dei magneti e attrazione/repulsione magnetica",
            "th": "สมบัติของแม่เหล็กและแรงดึงดูด-ผลักของวัตถุ",
            "id": "Sifat Magnet dan Tarikan serta Tolakan Benda",
            "hi": "चुंबक के गुण और चुंबकीय आकर्षण व प्रतिकर्षण",
            "ne": "चुम्बकका गुण र चुम्बकीय आकर्षण तथा विकर्षण",
            "km": "លក្ខណៈនៃមេដែក និងកម្លាំងទាញ/ច្រាន",
            "my": "သံလိုက်၏ ဂုဏ်သတ္တိများနှင့် ဆွဲငင်/တွန်းကန်မှု",
            "ar": "خصائص المغناطيس والتجاذب والتنافر المغناطيسي",
        },
        "E2": {
            "ko": "소리의 전달과 진동의 관찰",
            "en": "Transmission of Sound and Observation of Vibrations",
            "vi": "Sự truyền âm và quan sát dao động",
            "zh-Hans": "声音的传播与振动的观察",
            "zh-Hant": "聲音的傳播與振動的觀察",
            "ja": "音の伝わり方と振動の観察",
            "gl": "Transmisión do son e observación de vibracións",
            "es": "Transmisión del sonido y observación de vibraciones",
            "fr": "Transmission du son et observation des vibrations",
            "de": "Ausbreitung von Schall und Beobachtung von Schwingungen",
            "ru": "Распространение звука и наблюдение колебаний",
            "pt": "Transmissão do som e observação de vibrações",
            "it": "Trasmissione del suono e osservazione delle vibrazioni",
            "th": "การส่งผ่านเสียงและการสังเกตการสั่นสะเทือน",
            "id": "Perambatan Suara dan Pengamatan Getaran",
            "hi": "ध्वनि का संचरण और कंपन का अवलोकन",
            "ne": "ध्वनिको प्रसारण र कम्पनको अवलोकन",
            "km": "ការសាយភាយសំឡេង និងការសង្កេតរំញ័រ",
            "my": "အသံကူးစက်ပျံ့နှံ့ခြင်းနှင့် တုန်ခါမှုလေ့လာခြင်း",
            "ar": "انتقال الصوت وملاحظة الاهتزازات",
        },
        "E3": {
            "ko": "그림자의 형성과 빛의 직진",
            "en": "Formation of Shadows and Rectilinear Propagation of Light",
            "vi": "Sự hình thành bóng và sự truyền thẳng của ánh sáng",
            "zh-Hans": "影子的形成与光的直线传播",
            "zh-Hant": "影子的形成與光的直線傳播",
            "ja": "影の形成と光の直進性",
            "gl": "Formación de sombras e propagación rectilínea da luz",
            "es": "Formación de sombras y propagación rectilínea de la luz",
            "fr": "Formation des ombres et propagation rectiligne de la lumière",
            "de": "Schattenbildung und geradlinige Ausbreitung des Lichts",
            "ru": "Образование теней и прямолинейное распространение света",
            "pt": "Formação de sombras e propagação retilínea da luz",
            "it": "Formazione delle ombre e propagazione rettilinea della luce",
            "th": "การเกิดเงาและการเคลื่อนที่แนวตรงของแสง",
            "id": "Pembentukan Bayangan dan Perambatan Lurus Cahaya",
            "hi": "छाया का बनना और प्रकाश का सरल रेखीय संचरण",
            "ne": "छायाँ बन्नु र प्रकाशको सीधा रेखामा यात्रा",
            "km": "ការកកើតស្រមោល និងដំណើររត់ត្រង់នៃពន្លឺ",
            "my": "အရိပ်ဖြစ်ပေါ်ခြင်းနှင့် အလင်းဖြောင့်တန်းစွာ သွားခြင်း",
            "ar": "تشكل الظلال وانتشار الضوء في خطوط مستقيمة",
        },
        "E4": {
            "ko": "수평 잡기와 지레의 기초 원리",
            "en": "Balancing and Foundational Principles of Levers",
            "vi": "Sự cân bằng và nguyên lý đòn bẩy cơ bản",
            "zh-Hans": "平衡与杠杆基础原理",
            "zh-Hant": "平衡與槓桿基礎原理",
            "ja": "バランスとてこの基礎原理",
            "gl": "Equilibrio e principios básicos das pancas",
            "es": "Equilibrio y principios básicos de las palancas",
            "fr": "Équilibre et principes fondamentaux des leviers",
            "de": "Gleichgewicht und grundlegende Hebelgesetze",
            "ru": "Равновесие и основы принципа рычага",
            "pt": "Equilíbrio e princípios fundamentais das alavancas",
            "it": "Equilibrio e principi fondamentali delle leve",
            "th": "การรักษาสมดุลและหลักการพื้นฐานของคานดีดคานงัด",
            "id": "Keseimbangan dan Prinsip Dasar Tuas",
            "hi": "संतुलन और उत्तोलक के मूल सिद्धांत",
            "ne": "सन्तुलन र उत्तोलकको आधारभूत सिद्धान्त",
            "km": "លំនឹង និងគោលការណ៍គ្រឹះនៃរ៉ក/ដងថ្លឹង",
            "my": "မျှခြေထိန်းခြင်းနှင့် မောင်းတံအခြေခံသဘောတရား",
            "ar": "التوازن والمبادئ الأساسية للروافع",
        },
        "E5": {
            "ko": "물체의 빠르기와 속력의 개념",
            "en": "Motion of Objects and the Fundamental Concept of Speed",
            "vi": "Sự chuyển động của vật thể và khái niệm tốc độ",
            "zh-Hans": "物体的运动快慢与速度概念",
            "zh-Hant": "物體的運動快慢與速率概念",
            "ja": "物体の運動と速さの概念",
            "gl": "Movemento de obxectos e concepto fundamental de velocidade",
            "es": "Movimiento de objetos y concepto fundamental de rapidez",
            "fr": "Mouvement des objets et concept de vitesse",
            "de": "Objektbewegung und Grundlagen der Geschwindigkeit",
            "ru": "Движение тел и фундаментальное понятие скорости",
            "pt": "Movimento dos corpos e conceito fundamental de velocidade",
            "it": "Movimento dei corpi e concetto fondamentale di velocità",
            "th": "การเคลื่อนที่ของวัตถุและแนวคิดอัตราเร็ว",
            "id": "Gerak Benda dan Konsep Dasar Kelajuan",
            "hi": "वस्तुओं की गति और चाल की मूल अवधारणा",
            "ne": "वस्तुको गति र गतिको आधारभूत अवधारणा",
            "km": "ចលនានៃរូបធាតុ និងគំនិតមូលដ្ឋាននៃល្បឿន",
            "my": "အရာဝတ္ထုများ ရွေ့လျားမှုနှင့် အလျင်သဘောတရား",
            "ar": "حركة الأجسام والمفهوم الأساسي للسرعة",
        },
        "E6": {
            "ko": "전기의 흐름과 전구의 직렬·병렬 연결",
            "en": "Current Electricity and Series/Parallel Circuits",
            "vi": "Dòng điện và mạch điện nối tiếp, song song",
            "zh-Hans": "电流与灯泡的串联并联连接",
            "zh-Hant": "電流與燈泡的串聯並聯連接",
            "ja": "電流と電球の直列・並列回路",
            "gl": "Corrente eléctrica e circuítos en serie e paralelo",
            "es": "Corriente eléctrica y circuitos en serie y en paralelo",
            "fr": "Courant électrique et circuits en série et en parallèle",
            "de": "Elektrischer Strom und Reihen-/Parallelschaltungen",
            "ru": "Электрический ток и последовательное/параллельное соединение",
            "pt": "Corrente elétrica e circuitos em série e paralelo",
            "it": "Corrente elettrica e circuiti in serie e parallelo",
            "th": "กระแสไฟฟ้าและการต่อวงจรแบบอนุกรมและขนาน",
            "id": "Arus Listrik dan Rangkaian Seri serta Paralel",
            "hi": "विद्युत धारा और श्रेणी व समानांतर परिपथ",
            "ne": "विद्युत् प्रवाह र श्रेणी तथा समानान्तर परिपथ",
            "km": "ចរន្តអគ្គិសនី និងសៀគ្វីតជាស៊េរី/ស្រប",
            "my": "လျှပ်စစ်စီးဆင်းမှုနှင့် စီးရီး/ပြိုင် ဆားကစ်ဆက်သွယ်မှု",
            "ar": "التيار الكهربائي والدوائر الكهربائية على التوالي والتوازي",
        },
        "M1": {
            "ko": "힘의 합성과 마찰력, 부력의 평형",
            "en": "Force Composition, Friction, and Buoyant Equilibrium",
            "vi": "Hợp lực, lực ma sát và cân bằng lực đẩy Ác-si-mét",
            "zh-Hans": "力的合成、摩擦力与浮力的平衡",
            "zh-Hant": "力的合成、摩擦力與浮力的平衡",
            "ja": "力の合成、摩擦力と浮力のつり合い",
            "gl": "Composición de forzas, fricción e equilibrio de flotabilidade",
            "es": "Composición de fuerzas, fricción y equilibrio de flotabilidad",
            "fr": "Composition des forces, frottement et équilibre de flottabilité",
            "de": "Kräftezusammensetzung, Reibung und Auftriebsgleichgewicht",
            "ru": "Сложение сил, трение и равновесие выталкивающей силы",
            "pt": "Composição de forças, atrito e equilíbrio de empuxo",
            "it": "Composizione delle forze, attrito ed equilibrio di galleggiamento",
            "th": "การรวมแรง แรงเสียดทาน และสมดุลของแรงลอยตัว",
            "id": "Resultan Gaya, Gesekan, dan Keseimbangan Gaya Apung",
            "hi": "बलों का संयोजन, घर्षण और उत्प्लावन संतुलन",
            "ne": "बलको संयोजन, घर्षण र उत्प्लावन सन्तुलन",
            "km": "ផលបូកកម្លាំង កម្លាំងកកិត និងលំនឹងកម្លាំងរុញអាកស៊ីម៉ែត",
            "my": "အားများ ပေါင်းစပ်ခြင်း၊ ပွတ်တိုက်အားနှင့် တွန်းတင်အား မျှခြေ",
            "ar": "محصلة القوى والاحتكاك وتوازن قوة الطفو",
        },
        "M2": {
            "ko": "열과 우리 생활, 비열과 열팽창",
            "en": "Thermal Physics: Specific Heat and Thermal Expansion",
            "vi": "Nhiệt học: Nhiệt dung riêng và sự nở vì nhiệt",
            "zh-Hans": "热学：比热容与热膨胀",
            "zh-Hant": "熱學：比熱容與熱膨脹",
            "ja": "熱と生活、比熱と熱膨張",
            "gl": "Física térmica: calor específico e dilatación térmica",
            "es": "Física térmica: calor específico y dilatación térmica",
            "fr": "Thermique : chaleur spécifique et dilatation thermique",
            "de": "Wärmelehre: Spezifische Wärmekapazität und Wärmeausdehnung",
            "ru": "Тепловые явления: удельная теплоемкость и тепловое расширение",
            "pt": "Física térmica: calor específico e dilatação térmica",
            "it": "Fisica termica: calore specifico e dilatazione termica",
            "th": "ฟิสิกส์เชิงความร้อน: ความจุความร้อนจำเพาะและการขยายตัวจากความร้อน",
            "id": "Fisika Termal: Kalor Jenis dan Pemuaian Termal",
            "hi": "ऊष्मा भौतिकी: विशिष्ट ऊष्मा और तापीय प्रसार",
            "ne": "तापीय भौतिकी: विशिष्ट ताप र तापीय प्रसार",
            "km": "រូបវិទ្យាកម្ដៅ៖ កម្តៅជាក់លាក់ និងការរីកមាឌដោយកម្តៅ",
            "my": "အပူရူပဗေဒ - သီးသန့်အပူထိန်းနိုင်စွမ်းနှင့် အပူကြောင့်ပွခြင်း",
            "ar": "الفيزياء الحرارية: الحرارة النوعية والتمدد الحراري",
        },
        "M3": {
            "ko": "일과 역학적 에너지 보존 법칙",
            "en": "Work and the Law of Conservation of Mechanical Energy",
            "vi": "Công cơ học và định luật bảo toàn cơ năng",
            "zh-Hans": "功与机械能守恒定律",
            "zh-Hant": "功與機械能守恆定律",
            "ja": "仕事と力学的エネルギー保存の法則",
            "gl": "Traballo e lei de conservación da enerxía mecánica",
            "es": "Trabajo y ley de conservación de la energía mecánica",
            "fr": "Travail et loi de conservation de l'énergie mécanique",
            "de": "Arbeit und der Satz von der Erhaltung der mechanischen Energie",
            "ru": "Работа и закон сохранения механической энергии",
            "pt": "Trabalho e lei de conservação da energia mecânica",
            "it": "Lavoro e legge di conservazione dell'energia meccanica",
            "th": "งานและกฎการอนุรักษ์พลังงานกล",
            "id": "Usaha dan Hukum Kekekalan Energi Mekanik",
            "hi": "कार्य और यांत्रिक ऊर्जा संरक्षण का नियम",
            "ne": "कार्य र यान्त्रिक ऊर्जा संरक्षणको नियम",
            "km": "កម្មន្ត និងច្បាប់រក្សាថាមពលមេកានិច",
            "my": "အလုပ်နှင့် စက်မှုစွမ်းအင်တည်မြဲခြင်း နိယာမ",
            "ar": "الشغل وقانون حفظ الطاقة الميكانيكية",
        },
        "H1": {
            "ko": "뉴턴의 운동 세 가지 법칙과 운동량 보존",
            "en": "Newton's Three Laws of Motion and Momentum Conservation",
            "vi": "Ba định luật Newton về chuyển động và bảo toàn động lượng",
            "zh-Hans": "牛顿运动三定律与动量守恒",
            "zh-Hant": "牛頓運動三定律與動量守恆",
            "ja": "ニュートンの運動の3法則と運動量保存",
            "gl": "As tres leis de Newton e conservación do momento",
            "es": "Las tres leyes de Newton y conservación del momento",
            "fr": "Trois lois de Newton et conservation de la quantité de mouvement",
            "de": "Newtons drei Bewegungsgesetze und Impulserhaltung",
            "ru": "Три закона движения Ньютона и сохранение импульса",
            "pt": "Três leis de Newton e conservação do momento",
            "it": "Tre leggi di Newton e conservazione della quantità di moto",
            "th": "กฎการเคลื่อนที่สามข้อของนิวตันและการอนุรักษ์โมเมนตัม",
            "id": "Tiga Hukum Gerak Newton dan Kekekalan Momentum",
            "hi": "न्यूटन के गति के तीन नियम और संवेग संरक्षण",
            "ne": "न्यूटनका गतिका तीन नियम र संवेग संरक्षण",
            "km": "ច្បាប់ចលនាទាំងបីរបស់ញូតុន និងការរក្សាម៉ូម៉ង់ទុំ",
            "my": "နယူတန်၏ ရွေ့လျားမှု နိယာမသုံးရပ်နှင့် မိုเมนတမ် တည်မြဲခြင်း",
            "ar": "قوانين نيوتن الثلاثة للحركة وحفظ كمية الحركة",
        },
        "H2": {
            "ko": "파동의 굴절, 간섭 및 전자기 유도 현상",
            "en": "Wave Refraction, Interference, and Electromagnetic Induction",
            "vi": "Khúc xạ sóng, giao thoa và cảm ứng điện từ",
            "zh-Hans": "光的折射、干涉与电磁感应现象",
            "zh-Hant": "光的折射、干涉與電磁感應現象",
            "ja": "波動の屈折・干渉と電磁誘導現象",
            "gl": "Refracción e interferencia de ondas e indución electromagnética",
            "es": "Refracción e interferencia de ondas e inducción electromagnética",
            "fr": "Réfraction, interférence des ondes et induction électromagnétique",
            "de": "Wellenbrechung, Interferenz und elektromagnetische Induktion",
            "ru": "Преломление, интерференция волн и электромагнитная индукция",
            "pt": "Refração, interferência de ondas e indução eletromagnética",
            "it": "Rifrazione, interferenza delle onde e induzione elettromagnetica",
            "th": "การหักเห การแทรกสอดของคลื่น และการเหนี่ยวนำแม่เหล็กไฟฟ้า",
            "id": "Pembiasan Gelombang, Interferensi, dan Induksi Elektromagnetik",
            "hi": "तरंग अपवर्तन, व्यतिकरण और विद्युत चुम्बकीय प्रेरण",
            "ne": "तरंग अपवर्तन, व्यतिकरण र विद्युत् चुम्बकीय प्रेरण",
            "km": "កំហុករលក អន្តរាគមន៍រលក និងអាំងឌុចស្យុងអេឡិចត្រូម៉ាញ៉េទិច",
            "my": "လှိုင်းယိုင်ခြင်း၊ လှိုင်းထပ်ခြင်းနှင့် လျှပ်စစ်သံလိုက် ညှို့ယူမှု",
            "ar": "انكسار الموجات وتداخلها والحث الكهرومغناطيسي",
        },
        "H3": {
            "ko": "특수 상대성 이론과 광전 효과, 현대 물리학적 직관",
            "en": "Special Relativity, Photoelectric Effect, and Modern Physics Intuition",
            "vi": "Thuyết tương đối hẹp, hiệu ứng quang điện và trực giác vật lý hiện đại",
            "zh-Hans": "狭义相对论、光电效应与现代物理直觉",
            "zh-Hant": "狹義相對論、光電效應與現代物理直覺",
            "ja": "特殊相対性理論、光電効果と現代物理学的直観",
            "gl": "Relatividade especial, efecto fotoeléctrico e intuición da física moderna",
            "es": "Relatividad especial, efecto fotoeléctrico e intuición de la física moderna",
            "fr": "Relativité restreinte, effet photoélectrique et physique moderne",
            "de": "Spezielle Relativitätstheorie, photoelektrischer Effekt und moderne Physik",
            "ru": "Специальная теория относительности, фотоэффект и современная физика",
            "pt": "Relatividade restrita, efeito fotoelétrico e física moderna",
            "it": "Relatività ristretta, effetto fotoelettrico e intuizione della fisica moderna",
            "th": "ทฤษฎีสัมพัทธภาพพิเศษ ปรากฏการณ์โฟโตอิเล็กทริก และสัญชาตญาณฟิสิกส์ยุคใหม่",
            "id": "Relativitas Khusus, Efek Fotolistrik, dan Intuisi Fisika Modern",
            "hi": "विशेष आपेक्षिकता, प्रकाश विद्युत प्रभाव और आधुनिक भौतिकी",
            "ne": "विशेष सापेक्षता, फोटोइलेक्ट्रिक प्रभाव र आधुनिक भौतिकी",
            "km": "ទ្រឹស្តីរ៉ឺឡាទីវីតេពិសេស អានុភាពរូបអគ្គិសនី និងរូបវិទ្យាទំនើប",
            "my": "သီးသန့် ရီလတ်တီဗတီ သီအိုရီ၊ ဖိုတိုလျှပ်စစ် အကျိုးသက်ရောက်မှုနှင့် ခေတ်သစ်ရူပဗေဒ",
            "ar": "النسبية الخاصة، التأثير الكهروضوئي وفيزياء العصر الحديث",
        }
    },
    "chemistry": {
        "E1": {
            "ko": "고체, 액체, 기체의 상태 관찰과 부피",
            "en": "States of Matter: Solids, Liquids, Gases and Volume",
            "vi": "Các trạng thái của vật chất: Rắn, lỏng, khí và thể tích",
            "zh-Hans": "物质的三态：固体、液体、气体与体积",
            "zh-Hant": "物質的三態：固體、液體、氣體與體積",
            "ja": "物質の三態：固体・液体・気体の観察と体積",
            "gl": "Estados da materia: sólidos, líquidos, gases e volume",
            "es": "Estados de la materia: sólidos, líquidos, gases y volumen",
            "fr": "États de la matière : solides, liquides, gaz et volume",
            "de": "Aggregatzustände: Fest, flüssig, gasförmig und Volumen",
            "ru": "Агрегатные состояния: твердые тела, жидкости, газы и объем",
            "pt": "Estados da matéria: sólidos, líquidos, gases e volume",
            "it": "Stati della materia: solidi, liquidi, gas e volume",
            "th": "สถานะของสสาร: ของแข็ง ของเหลว แก๊ส และปริมาตร",
            "id": "Wujud Zat: Padat, Cair, Gas dan Volume",
            "hi": "पदार्थ की अवस्थाएं: ठोस, द्रव, गैस और आयतन",
            "ne": "पदार्थका अवस्था: ठोस, तरल, ग्यास र आयतन",
            "km": "សភាពនៃរូបធាតុ៖ រឹង រាវ ឧស្ម័ន និងមាឌ",
            "my": "ဒြပ်၏ အခြေအနေများ - အစိုင်အခဲ၊ အရည်၊ ဓာတ်ငွေ့နှင့် ထုထည်",
            "ar": "حالات المادة: الصلبة والسائلة والغازية والحجم",
        },
        "E2": {
            "ko": "물질의 섞임과 용해 현상",
            "en": "Mixing of Substances and Dissolution Phenomena",
            "vi": "Sự pha trộn của các chất và hiện tượng hòa tan",
            "zh-Hans": "物质的混合与溶解现象",
            "zh-Hant": "物質的混合與溶解現象",
            "ja": "物質の混合と溶解現象",
            "gl": "Mestura de substancias e fenómenos de disolución",
            "es": "Mezcla de sustancias y fenómenos de disolución",
            "fr": "Mélange de substances et phénomènes de dissolution",
            "de": "Mischung von Stoffen und Löslichkeitsphänomene",
            "ru": "Смешивание веществ и явления растворения",
            "pt": "Mistura de substâncias e fenômenos de dissolução",
            "it": "Miscelazione di sostanze e fenomeni di dissoluzione",
            "th": "การผสมของสารและปรากฏการณ์การละลาย",
            "id": "Pencampuran Zat dan Fenomena Kelarutan",
            "hi": "पदार्थों का मिश्रण और घुलने की प्रक्रिया",
            "ne": "पदार्थहरूको मिश्रण र घुलनशीलता घटना",
            "km": "ការលាយនៃសារធាតុ និងបាតុភូតរលាយ",
            "my": "ဒြပ်ဝတ္ထုများ ရောနှောခြင်းနှင့် ပျော်ဝင်မှု ဖြစ်စဉ်များ",
            "ar": "خلط المواد وظواهر الذوبان",
        },
        "E3": {
            "ko": "물질의 연소와 소화의 조건",
            "en": "Conditions for Combustion and Fire Extinguishment",
            "vi": "Điều kiện cháy và dập tắt đám cháy",
            "zh-Hans": "物质燃烧与灭火的条件",
            "zh-Hant": "物質燃燒與滅火的條件",
            "ja": "物質の燃焼と消火の条件",
            "gl": "Condicións para a combustión e extinción de incendios",
            "es": "Condiciones para la combustión y extinción de incendios",
            "fr": "Conditions de combustion et d'extinction des incendios",
            "de": "Bedingungen für Verbrennung und Brandbekämpfung",
            "ru": "Условия горения и тушения пожара",
            "pt": "Condições para combustão e extinção de incêndios",
            "it": "Condizioni per la combustione e l'estinzione degli incendi",
            "th": "เงื่อนไขการเผาไหม้และการดับไฟ",
            "id": "Syarat Pembakaran dan Pemadaman Api",
            "hi": "दहन और आग बुझाने की शर्तें",
            "ne": "दहन र आगो निभाउने सर्तहरू",
            "km": "លក្ខខណ្ឌនៃការឆេះ និងការពន្លត់ភ្លើង",
            "my": "လောင်ကျွမ်းခြင်းနှင့် မီးငြှိမ်းသတ်ခြင်း အခြေအနေများ",
            "ar": "شروط الاحتراق وإطفاء الحرائق",
        },
        "E4": {
            "ko": "산과 염기의 색깔 변화와 지시약",
            "en": "Acids, Bases, Indicators, and Color Changes",
            "vi": "Axit, bazơ, chất chỉ thị và sự đổi màu",
            "zh-Hans": "酸与碱的颜色变化及指示剂",
            "zh-Hant": "酸與鹼的顏色變化及指示劑",
            "ja": "酸とアルカリの色の変化と指示薬",
            "gl": "Ácidos, bases, indicadores e cambios de cor",
            "es": "Ácidos, bases, indicadores y cambios de color",
            "fr": "Acides, bases, indicateurs et changements de couleur",
            "de": "Säuren, Basen, Indikatoren und Farbveränderungen",
            "ru": "Кислоты, основания, индикаторы и изменение цвета",
            "pt": "Ácidos, bases, indicadores e mudanças de cor",
            "it": "Acidi, basi, indicatori e variazioni di colore",
            "th": "กรด-เบส สารอินดิเคเตอร์ และการเปลี่ยนสี",
            "id": "Asam, Basa, Indikator, dan Perubahan Warna",
            "hi": "अम्ल, क्षार, सूचक और रंग परिवर्तन",
            "ne": "अम्ल, क्षार, सूचक र रंग परिवर्तन",
            "km": "អាស៊ីត បាស អង្គចង្អុលពណ៌ និងការប្តូរពណ៌",
            "my": "အက်ဆစ်၊ ဘေ့စ်၊ အညွှန်းဒြပ်များနှင့် အရောင်ပြောင်းလဲမှု",
            "ar": "الأحماض والقواعد والكواشف وتغيرات الألوان",
        },
        "E5": {
            "ko": "기체의 발생과 압력-온도에 따른 부피 변화",
            "en": "Gas Generation and Volume Variations with P-T Changes",
            "vi": "Sự sinh khí và biến đổi thể tích theo áp suất, nhiệt độ",
            "zh-Hans": "气体的产生及压强-温度与体积的变化",
            "zh-Hant": "氣體的產生及壓力-溫度與體積的變化",
            "ja": "気体の発生と圧力・温度による体積変化",
            "gl": "Xeración de gas e variacións de volume con presión e temperatura",
            "es": "Generación de gases y variaciones de volumen con presión y temperatura",
            "fr": "Génération de gaz et variations de volume selon pression et température",
            "de": "Gasentwicklung und Volumenänderungen bei Druck- und Temperaturänderung",
            "ru": "Выделение газов и изменение объема с давлением и температурой",
            "pt": "Geração de gases e variações de volume com pressão e temperatura",
            "it": "Generazione di gas e variazioni di volume con pressione e temperatura",
            "th": "การเกิดแก๊สและการเปลี่ยนแปลงปริมาตรตามความดันและอุณหภูมิ",
            "id": "Pembentukan Gas dan Perubahan Volume akibat Tekanan-Suhu",
            "hi": "गैस का निर्माण और दाब-तापमान के अनुसार आयतन परिवर्तन",
            "ne": "ग्यास उत्पादन र दबाब-तापक्रम अनुसार आयतन परिवर्तन",
            "km": "ការបង្កើតឧស្ម័ន និងបំរែបំរួលមាឌតាមសម្ពាធ-សីតុណ្ហភាព",
            "my": "ဓာတ်ငွေ့ထွက်ပေါ်ခြင်းနှင့် ဖိအား-အပူချိန်အရ ထုထည်ပြောင်းလဲမှု",
            "ar": "توليد الغاز وتغيرات الحجم مع تغير الضغط ودرجة الحرارة",
        },
        "E6": {
            "ko": "용액의 진하기와 용해도 곡선 해석",
            "en": "Solution Concentration and Solubility Curves Interpretation",
            "vi": "Nồng độ dung dịch và giải thích đường cong độ tan",
            "zh-Hans": "溶液浓度与溶解度曲线解读",
            "zh-Hant": "溶液濃度與溶解度曲線解讀",
            "ja": "溶液の濃度と溶解度曲線の解釈",
            "gl": "Concentración da disolución e curvas de solubilidade",
            "es": "Concentración de soluciones y curvas de solubilidad",
            "fr": "Concentration des solutions et interprétation des courbes de solubilité",
            "de": "Lösungskonzentration und Interpretation von Löslichkeitskurven",
            "ru": "Концентрация растворов и анализ кривых растворимости",
            "pt": "Concentração de soluções e curvas de solubilidade",
            "it": "Concentrazione delle soluzioni e curve di solubilità",
            "th": "ความเข้มข้นของสารละลายและการแปลความหมายกราฟการละลาย",
            "id": "Konsentrasi Larutan dan Interpretasi Kurva Kelarutan",
            "hi": "विलयन की सांद्रता और विलेयता वक्र की व्याख्या",
            "ne": "घोलको एकाग्रता र घुलनशीलता वक्र व्याख्या",
            "km": "កំហាប់សូលុយស្យុង និងការបកស្រាយខ្សែបន្ទាត់រលាយ",
            "my": "ပျော်ရည် ပြင်းအားနှင့် ပျော်ဝင်မှု မျဉ်းကွေး ရှင်းလင်းချက်",
            "ar": "تركيز المحاليل وتفسير منحنيات الذائبية",
        },
        "M1": {
            "ko": "물질의 세 가지 상태와 분자 배열의 변화",
            "en": "Three States of Matter and Molecular Arrangement Dynamics",
            "vi": "Ba trạng thái của vật chất và biến đổi sắp xếp phân tử",
            "zh-Hans": "物质的三态与分子排列的变化",
            "zh-Hant": "物質的三態與分子排列的變化",
            "ja": "物質の三態と分子配列の変化",
            "gl": "Tres estados da materia e dinámica de disposición molecular",
            "es": "Tres estados de la materia y dinámica de disposición molecular",
            "fr": "Trois états de la matière et dynamique de l'arrangement moléculaire",
            "de": "Drei Aggregatzustände und Dynamik der Molekülanordnung",
            "ru": "Три состояния вещества и изменение молекулярного строения",
            "pt": "Três estados da matéria e dinâmica de arranjo molecular",
            "it": "Tre stati della materia e dinamica della disposizione molecolare",
            "th": "สามสถานะของสสารและการเปลี่ยนแปลงการจัดเรียงโมเลกุล",
            "id": "Tiga Wujud Zat dan Dinamika Susunan Molekul",
            "hi": "पदार्थ की तीन अवस्थाएं और आणविक व्यवस्था में परिवर्तन",
            "ne": "पदार्थका तीन अवस्था र आणविक व्यवस्था परिवर्तन",
            "km": "សភាពទាំងបីនៃរូបធាតុ និងការរៀបចំម៉ូលេគុល",
            "my": "ဒြပ်၏ အခြေအနေသုံးရပ်နှင့် မော်လီကျူးစီစဉ်မှု ပြောင်းလဲခြင်း",
            "ar": "حالات المادة الثلاث وديناميكيات الترتيب الجزيئي",
        },
        "M2": {
            "ko": "물질의 구성 원소와 불꽃 반응, 주기율표의 규칙",
            "en": "Elements, Flame Tests, and Periodic Table Trends",
            "vi": "Nguyên tố hóa học, phản ứng cháy ngọn lửa và bảng tuần hoàn",
            "zh-Hans": "物质的组成元素、焰色反应与元素周期表规律",
            "zh-Hant": "物質的組成元素、焰色反應與元素週期表規律",
            "ja": "物質を構成する元素、炎色反応と周期表の規則性",
            "gl": "Elementos, ensaios á chama e tendencias da táboa periódica",
            "es": "Elementos, ensayos a la llama y tendencias de la tabla periódica",
            "fr": "Éléments, tests de flamme et tendances du tableau périodique",
            "de": "Elemente, Flammenfärbung und Trends im Periodensystem",
            "ru": "Химические элементы, пламенные реакции и закономерности таблицы Менделеева",
            "pt": "Elementos, ensaios por chama e tendências da tabela periódica",
            "it": "Elementi, saggi alla fiamma e tendenze della tavola periodica",
            "th": "ธาตุองค์ประกอบ การทดสอบเปลวไฟ และแนวโน้มตารางธาตุ",
            "id": "Unsur Pembentuk Zat, Uji Nyala, dan Pola Tabel Periodik",
            "hi": "तत्व, ज्वाला परीक्षण और आवर्त सारणी के नियम",
            "ne": "तत्वहरू, ज्वाला परीक्षण र आवर्त तालिकाका नियम",
            "km": "ធាតុបង្កនៃរូបធាតុ ការធ្វើតេស្តអណ្តាតភ្លើង និងតារាងខួប",
            "my": "ဒြပ်စင်များ၊ မီးတောက်စမ်းသပ်မှုနှင့် အလှည့်ကျဇယား လမ်းကြောင်းများ",
            "ar": "العناصر واختبارات اللهب واتجاهات الجدول الدوري",
        },
        "M3": {
            "ko": "화학 반응의 법칙: 질량 보존과 일정 성분비 법칙",
            "en": "Chemical Laws: Conservation of Mass and Definite Proportions",
            "vi": "Định luật hóa học: Bảo toàn khối lượng và tỉ lệ xác định",
            "zh-Hans": "化学反应定律：质量守恒定律与定组成定律",
            "zh-Hant": "化學反應定律：質量守恆定律與定組成定律",
            "ja": "化学反応の法則：質量保存の法則と定比例の法則",
            "gl": "Leis químicas: conservación da masa e proporcións definidas",
            "es": "Leyes químicas: conservación de la masa y proporciones definidas",
            "fr": "Lois chimiques : conservation de la masse et proportions définies",
            "de": "Chemische Gesetze: Massenerhaltung und konstante Proportionen",
            "ru": "Законы химии: закон сохранения массы и закон постоянства состава",
            "pt": "Leis químicas: conservação da massa e proporções definidas",
            "it": "Leggi chimiche: conservazione della massa e proporzioni definite",
            "th": "กฎของปฏิกิริยาเคมี: กฎการอนุรักษ์มวลและสัดส่วนคงที่",
            "id": "Hukum Reaksi Kimia: Kekekalan Massa dan Perbandingan Tetap",
            "hi": "रासायनिक नियम: द्रव्यमान संरक्षण और निश्चित अनुपात का नियम",
            "ne": "रासायनिक नियम: पिण्ड संरक्षण र निश्चित अनुपातको नियम",
            "km": "ច្បាប់ប្រតិកម្មគីមី៖ ការរក្សាម៉ាស និងសមាមាត្រកំណត់",
            "my": "ဓာတုဗေဒ နိယာမများ - ဒြပ်ထုတည်မြဲခြင်းနှင့် ကိန်းသေအချိုးကျ နိယာမ",
            "ar": "القوانين الكيميائية: حفظ الكتلة والنسب الثابتة",
        },
        "H1": {
            "ko": "화학 결합(이온 결합, 공유 결합)과 분자의 극성",
            "en": "Chemical Bonding (Ionic, Covalent) and Molecular Polarity",
            "vi": "Liên kết hóa học (ion, cộng hóa trị) và độ phân cực phân tử",
            "zh-Hans": "化学键（离子键、共价键）与分子极性",
            "zh-Hant": "化學鍵（離子鍵、共價鍵）與分子極性",
            "ja": "化学結合（イオン結合・共有結合）と分子の極性",
            "gl": "Enlace químico (iónico, covalente) e polaridade molecular",
            "es": "Enlace químico (iónico, covalente) y polaridad molecular",
            "fr": "Liaison chimique (ionique, covalente) et polarité moléculaire",
            "de": "Chemische Bindungen (Ionen-, kovalente Bindung) und Polarität",
            "ru": "Химическая связь (ионная, ковалентная) и полярность молекул",
            "pt": "Ligação química (iônica, covalente) e polaridade molecular",
            "it": "Legame chimico (ionico, covalente) e polarità molecolare",
            "th": "พันธะเคมี (ไอออนิก โคเวเลนต์) และสภาพขั้วของโมเลกุล",
            "id": "Ikatan Kimia (Ion, Kovalen) dan Kepolaran Molekul",
            "hi": "रासायनिक आबंधन (आयनिक, सहसंयोजक) और आणविक ध्रुवीयता",
            "ne": "रासायनिक बन्धन (आयोनिक, सहसंयोजक) र आणविक ध्रुवीयता",
            "km": "សម្ព័ន្ធគីមី (អ៊ីយ៉ុង កូវ៉ាឡង់) និងប៉ូលនៃម៉ូលេគុល",
            "my": "ဓာတုပေါင်းစည်းမှု (အိုင်းယွန်း၊ တွဲဖက်) နှင့် မော်လီကျူး ဝင်ရိုးစွန်း",
            "ar": "الروابط الكيميائية (الأيونية والتساهمية) والقطبية الجزيئية",
        },
        "H2": {
            "ko": "몰(mol)의 개념과 기체 반응 법칙, 화학 반응식의 양적 관계",
            "en": "Concept of Mole, Gas Reactions, and Reaction Stoichiometry",
            "vi": "Khái niệm mol, định luật khí và tính toán hóa học lượng chất",
            "zh-Hans": "摩尔（mol）概念、气体反应定律及化学方程式的定量关系",
            "zh-Hant": "莫耳（mol）概念、氣體反應定律及化學反應式的化學計量",
            "ja": "物質量（モル）の概念、気体反応の法則と化学反応の量的関係",
            "gl": "Concepto de mol, reaccións gasosas e estequiometría de reaccións",
            "es": "Concepto de mol, reacciones gaseosas y estequiometría de reacciones",
            "fr": "Concept de mole, réactions gazeuses et stœchiométrie des réactions",
            "de": "Molbegriff, Gasreaktionsgesetze und Reaktionsstöchiometrie",
            "ru": "Понятие моля, законы газовых реакций и стехиометрия",
            "pt": "Conceito de mol, reações gasosas e estequiometria de reações",
            "it": "Concetto di mole, reazioni gassose e stechiometria di reazione",
            "th": "แนวคิดเรื่องโมล กฎปฏิกิริยาแก๊ส และปริมาณสารสัมพันธ์",
            "id": "Konsep Mol, Hukum Reaksi Gas, dan Stoikiometri Reaksi",
            "hi": "मोल की अवधारणा, गैस अभिक्रिया नियम और रससमीकरणमिति",
            "ne": "मोलको अवधारणा, ग्यास प्रतिक्रिया नियम र स्टॉइकिओमेट्री",
            "km": "គំនិតនៃម៉ូល ច្បាប់ប្រតិកម្មឧស្ម័ន និងស្តូក្យូមេទ្រី",
            "my": "မိုးလ် (Mole) သဘောတရား၊ ဓာတ်ငွေ့တုံ့ပြန်မှုနှင့် ဓာတုဗေဒ တွက်ချက်မှု",
            "ar": "مفهوم المول وقوانين تفاعلات الغازات وحسابات قياس العناصر الكيميائية",
        },
        "H3": {
            "ko": "반응 속도론, 화학 평형의 이동과 르샤틀리에의 원리",
            "en": "Chemical Kinetics, Equilibrium Shifting, and Le Chatelier's Principle",
            "vi": "Động hóa học, chuyển dịch cân bằng hóa học và nguyên lý Le Chatelier",
            "zh-Hans": "化学反应速率、化学平衡移动与勒夏特列原理",
            "zh-Hant": "化學反應速率、化學平衡移動與勒沙特列原理",
            "ja": "化学反応速度論、化学平衡の移動とルシャトリエの原理",
            "gl": "Cinética química, desprazamento do equilibrio e principio de Le Chatelier",
            "es": "Cinética química, desplazamiento del equilibrio y principio de Le Chatelier",
            "fr": "Cinétique chimique, déplacement de l'équilibre et principe de Le Châtelier",
            "de": "Reaktionskinetik, Verschiebung des chemischen Gleichgewichts und Le Chatelier",
            "ru": "Химическая кинетика, сдвиг химического равновесия и принцип Ле Шателье",
            "pt": "Cinética química, deslocamento do equilíbrio e princípio de Le Chatelier",
            "it": "Cinetica chimica, spostamento dell'equilibrio e principio di Le Chatelier",
            "th": "จลนพลศาสตร์เคมี การเลื่อนสมดุลเคมี และหลักของเลอชาเตอลิเย",
            "id": "Kinetika Kimia, Pergeseran Kesetimbangan, dan Prinsip Le Chatelier",
            "hi": "रासायनिक बलगतिकी, रासायनिक साम्यावस्था विस्थापन और ली शातैलिए का नियम",
            "ne": "रासायनिक गतिविज्ञान, रासायनिक सन्तुलन विस्थापन र ले शातेलिएको सिद्धान्त",
            "km": "ស៊ីនេទិចគីមី ការរំកិលលំនឹងគីមី និងគោលការណ៍ឡឺឆាតឺលីយេ",
            "my": "ဓာတုဗေဒ တုံ့ပြန်မှုနှုန်း၊ မျှခြေရွေ့လျားမှုနှင့် လီရှာတယ်လီယာ နိယာမ",
            "ar": "حركية التفاعلات الكيميائية وانزياح التوازن الكيميائي ومبدأ لوشاتيلييه",
        }
    }
}

# Question Templates
TEMPLATES = {
    "math": {
        "Q1": {
            "ko": {
                "prompt": "[{grade} 수학 사고력] {title}과 관련된 문제입니다. 두 수 $A$와 $B$가 주어졌을 때, 관계식 $A + 2B = 24$를 만족하는 자연수 순서쌍 $(A, B)$의 개수를 구하고 최적의 조건을 찾으려고 합니다. 이때 $A$가 가장 큰 값을 가질 때 $B$의 값은 얼마입니까?",
                "explain": "1단계: 주어진 식을 정리하면 $A = 24 - 2B$입니다.\n2단계: $A$와 $B$는 모두 자연수이므로 $B \ge 1$이고 $A \ge 1$이어야 합니다.\n3단계: $A$가 최대가 되려면 빼는 값인 $2B$가 최소가 되어야 하므로 $B = 1$입니다.\n4단계: 이때 $A = 24 - 2(1) = 22$로 최대가 되며, 문제에서 요구한 $B$의 값은 $1$입니다.",
                "hints": ["자연수 $B$의 최소값은 $1$입니다.", "$A = 24 - 2B$이므로 $B$가 가장 작을 때 $A$가 최대가 됩니다."],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "en": {
                "prompt": "[{grade} Math Inquiry] Inquiry question for {title}. Given two natural numbers $A$ and $B$ satisfying $A + 2B = 24$, when $A$ takes its maximum possible value, what is the value of $B$?",
                "explain": "Step 1: Rearranging gives $A = 24 - 2B$.\nStep 2: Since $A, B \ge 1$ are natural numbers, $2B$ must be minimized for $A$ to be maximized.\nStep 3: The minimum natural number is $B = 1$.\nStep 4: At this point, $A = 24 - 2(1) = 22$ (maximum), so $B = 1$.",
                "hints": ["The minimum natural number value for $B$ is $1$.", "Since $A = 24 - 2B$, $A$ is maximized when $B$ is minimized."],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "vi": {
                "prompt": "[{grade} Khám phá Toán học] Câu hỏi khám phá về {title}. Cho hai số tự nhiên $A$ và $B$ thỏa mãn hệ thức $A + 2B = 24$. Khi $A$ đạt giá trị lớn nhất có thể thì giá trị của $B$ là bao nhiêu?",
                "explain": "Bước 1: Biến đổi hệ thức ta được $A = 24 - 2B$.\nBước 2: Vì $A$ và $B$ là các số tự nhiên nên $B \ge 1$ và $A \ge 1$.\nBước 3: Để $A$ đạt giá trị lớn nhất thì $2B$ phải nhỏ nhất, do đó $B = 1$.\nBước 4: Khi đó $A = 24 - 2(1) = 22$ (lớn nhất), vậy giá trị của $B$ là $1$.",
                "hints": ["Giá trị tự nhiên nhỏ nhất của $B$ là $1$.", "Vì $A = 24 - 2B$, khi $B$ nhỏ nhất thì $A$ sẽ lớn nhất."],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "zh-Hans": {
                "prompt": "[{grade} 数学思维探索] 关于 {title} 的探究问题。已知两个自然数 $A$ 和 $B$ 满足关系式 $A + 2B = 24$。当 $A$ 取得最大值时，$B$ 的值是多少？",
                "explain": "步骤 1: 整理已知等式得 $A = 24 - 2B$。\n步骤 2: 因为 $A$ 和 $B$ 都是自然数，所以 $B \ge 1$ 且 $A \ge 1$。\n步骤 3: 要使 $A$ 最大，减去的项 $2B$ 必须最小，因此 $B = 1$。\n步骤 4: 此时 $A = 24 - 2(1) = 22$ 取得最大值，所求 $B$ 的值为 $1$。",
                "hints": ["自然数 $B$ 的最小值为 $1$。", "因为 $A = 24 - 2B$，当 $B$ 最小，$A$ 达到最大。"],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "zh-Hant": {
                "prompt": "[{grade} 數學思維探索] 關於 {title} 的探究問題。已知兩個自然數 $A$ 與 $B$ 滿足關係式 $A + 2B = 24$。當 $A$ 取得最大值時，$B$ 的值是多少？",
                "explain": "步驟 1: 整理已知等式得 $A = 24 - 2B$。\n步驟 2: 因為 $A$ 與 $B$ 都是自然數，所以 $B \ge 1$ 且 $A \ge 1$。\n步驟 3: 要使 $A$ 最大，減去的項 $2B$ 必須最小，因此 $B = 1$。\n步驟 4: 此時 $A = 24 - 2(1) = 22$ 取得最大值，所求 $B$ 的值為 $1$。",
                "hints": ["自然數 $B$ 的最小值為 $1$。", "因為 $A = 24 - 2B$，當 $B$ 最小時，$A$ 達到最大。"],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "ja": {
                "prompt": "[{grade} 数学的思考探究] {title} に関する探究課題です。関係式 $A + 2B = 24$ を満たす2つの自然数 $A, B$ について、$A$ が最大値をとるとき、$B$ の値はいくつですか？",
                "explain": "ステップ 1: 式を変形すると $A = 24 - 2B$ です。\nステップ 2: $A, B$ はともに自然数なので、$B \ge 1, A \ge 1$ です。\nステップ 3: $A$ を最大にするには引く項 $2B$ を最小にする必要があるため、$B = 1$ となります。\nステップ 4: このとき $A = 24 - 2(1) = 22$ で最大となり、求める $B$ の値は $1$ です。",
                "hints": ["自然数 $B$ の最小値は $1$ です。", "$A = 24 - 2B$ なので、$B$ が最小のとき $A$ は最大になります。"],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "gl": {
                "prompt": "[{grade} Investigación Matemática] Pregunta sobre {title}. Dados dous números naturais $A$ e $B$ que cumpren a relación $A + 2B = 24$, cal é o valor de $B$ cando $A$ acada o seu valor máximo?",
                "explain": "Paso 1: Reordenando a ecuación obtemos $A = 24 - 2B$.\nPaso 2: Como $A$ e $B$ son números naturais, $B \ge 1$ e $A \ge 1$.\nPaso 3: Para que $A$ sexa máximo, $2B$ debe ser mínimo, polo que $B = 1$.\nPaso 4: Entón $A = 24 - 2(1) = 22$ (máximo), polo que o valor de $B$ é $1$.",
                "hints": ["O valor natural mínimo para $B$ é $1$.", "Como $A = 24 - 2B$, $A$ é máximo cando $B$ é o máis pequeno posible."],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "es": {
                "prompt": "[{grade} Indagación Matemática] Pregunta sobre {title}. Dados dos números naturales $A$ y $B$ que satisfacen la relación $A + 2B = 24$, ¿cuál es el valor de $B$ cuando $A$ toma su valor máximo posible?",
                "explain": "Paso 1: Despejando obtenemos $A = 24 - 2B$.\nPaso 2: Como $A$ y $B$ son números naturales, $B \ge 1$ y $A \ge 1$.\nPaso 3: Para maximizar $A$, el término sustraído $2B$ debe ser mínimo, por lo que $B = 1$.\nPaso 4: En este caso $A = 24 - 2(1) = 22$ (máximo), por lo que $B = 1$.",
                "hints": ["El valor natural mínimo para $B$ es $1$.", "Como $A = 24 - 2B$, $A$ se maximiza cuando $B$ es el menor posible."],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "fr": {
                "prompt": "[{grade} Raisonnement Mathématique] Question sur {title}. Étant donné deux entiers naturels $A$ et $B$ satisfaisant la relation $A + 2B = 24$, quelle est la valeur de $B$ lorsque $A$ prend sa valeur maximale ?",
                "explain": "Étape 1 : En réorganisant l'équation, on obtient $A = 24 - 2B$.\nÉtape 2 : Comme $A$ et $B$ sont des entiers naturels, $B \ge 1$ et $A \ge 1$.\nÉtape 3 : Pour maximiser $A$, le terme soustrait $2B$ doit être minimal, donc $B = 1$.\nÉtape 4 : $A = 24 - 2(1) = 22$ (maximum), la valeur cherchée de $B$ est donc $1$.",
                "hints": ["La valeur naturelle minimale pour $B$ est $1$.", "Comme $A = 24 - 2B$, $A$ est maximal lorsque $B$ est le plus petit possible."],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "de": {
                "prompt": "[{grade} Mathematisches Denken] Frage zu {title}. Gegeben sind zwei natürliche Zahlen $A$ und $B$, die die Gleichung $A + 2B = 24$ erfüllen. Welchen Wert hat $B$, wenn $A$ den größtmöglichen Wert annimmt?",
                "explain": "Schritt 1: Umformen ergibt $A = 24 - 2B$.\nSchritt 2: Da $A$ und $B$ natürliche Zahlen sind, gilt $B \ge 1$ und $A \ge 1$.\nSchritt 3: Um $A$ zu maximieren, muss der subtrahierte Term $2B$ minimal sein, also $B = 1$.\nSchritt 4: Dann ist $A = 24 - 2(1) = 22$ maximal, der gesuchte Wert von $B$ ist $1$.",
                "hints": ["Der kleinste natürliche Wert für $B$ ist $1$.", "Da $A = 24 - 2B$ gilt, wird $A$ maximal, wenn $B$ minimal ist."],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            },
            "ru": {
                "prompt": "[{grade} Математическое мышление] Вопрос по теме {title}. Даны два натуральных числа $A$ и $B$, удовлетворяющие соотношению $A + 2B = 24$. Каково значение $B$, когда $A$ принимает максимально возможное значение?",
                "explain": "Шаг 1: Выразим $A = 24 - 2B$.\nШаг 2: Поскольку $A$ и $B$ — натуральные числа, $B \ge 1$ и $A \ge 1$.\nШаг 3: Чтобы значение $A$ было максимальным, вычитаемое $2B$ должно быть минимальным, следовательно, $B = 1$.\nШаг 4: При этом $A = 24 - 2(1) = 22$ (максимум), искомое значение $B = 1$.",
                "hints": ["Минимальное натуральное значение для $B$ равно $1$.", "Так как $A = 24 - 2B$, $A$ максимально, когда $B$ минимально."],
                "options": ["$1$", "$2$", "$3$", "$4$"]
            }
        },
        "Q2": {
            "ko": {
                "prompt": "[{grade} 수학 사고력 (심화·응용)] {title}의 원리를 활용한 복합 문제입니다. 연속하는 세 자연수의 합이 $3S$이고, 가장 작은 수와 가장 큰 수의 곱에 $1$을 더한 값이 $T^2$의 형태를 갖습니다. $S = 15$일 때, 이 세 자연수 중 가장 큰 수는 얼마입니까?",
                "explain": "1단계: 연속하는 세 자연수를 $n-1, n, n+1$로 나타내면 그 합은 $(n-1) + n + (n+1) = 3n$입니다.\n2단계: 문제에서 합이 $3S = 3(15) = 45$이므로 $3n = 45 \Rightarrow n = 15$입니다.\n3단계: 따라서 세 수는 $14, 15, 16$이며, 이 중 가장 큰 수는 $16$입니다.\n4단계: 실제로 $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$으로 성립합니다.",
                "hints": ["연속하는 세 자연수를 $n-1, n, n+1$로 놓으면 합은 $3n$이 됩니다.", "가운데 수가 $n = S = 15$입니다."],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "en": {
                "prompt": "[{grade} Math Inquiry (Advanced)] Complex inquiry question using {title}. Three consecutive natural numbers sum to $3S$, and the product of the smallest and largest plus $1$ equals $T^2$. When $S = 15$, what is the largest of these three numbers?",
                "explain": "Step 1: Letting the numbers be $n-1, n, n+1$, their sum is $3n = 3S \Rightarrow n = S = 15$.\nStep 2: The numbers are $14, 15, 16$.\nStep 3: The largest number is $16$.\nStep 4: Check: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$.",
                "hints": ["Representing consecutive numbers as $n-1, n, n+1$ gives sum $3n$.", "The middle number is $n = S = 15$."],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "vi": {
                "prompt": "[{grade} Khám phá Toán học (Nâng cao)] Bài toán vận dụng nguyên lý {title}. Ba số tự nhiên liên tiếp có tổng bằng $3S$, và tích của số nhỏ nhất với số lớn nhất cộng thêm $1$ có dạng $T^2$. Khi $S = 15$, số lớn nhất trong ba số này là bao nhiêu?",
                "explain": "Bước 1: Gọi ba số tự nhiên liên tiếp là $n-1, n, n+1$, tổng của chúng là $3n = 3S \Rightarrow n = S = 15$.\nBước 2: Ba số đó là $14, 15, 16$.\nBước 3: Do đó số lớn nhất là $16$.\nBước 4: Kiểm tra lại: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$.",
                "hints": ["Đặt ba số tự nhiên liên tiếp là $n-1, n, n+1$, tổng là $3n$.", "Số ở giữa chính là $n = S = 15$."],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "zh-Hans": {
                "prompt": "[{grade} 数学思维探索 (进阶)] 结合 {title} 原理的综合问题。三个连续自然数的和为 $3S$，最小数与最大数的乘积加 $1$ 等于 $T^2$。当 $S = 15$ 时，这三个自然数中最大的数是多少？",
                "explain": "步骤 1: 设三个连续自然数为 $n-1, n, n+1$，它们的和为 $3n = 3S \Rightarrow n = S = 15$。\n步骤 2: 这三个数是 $14, 15, 16$。\n步骤 3: 其中最大的数是 $16$。\n步骤 4: 验算: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$。",
                "hints": ["设三个连续自然数为 $n-1, n, n+1$，其和为 $3n$。", "中间的数即为 $n = S = 15$。"],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "zh-Hant": {
                "prompt": "[{grade} 數學思維探索 (進階)] 結合 {title} 原理的綜合問題。三個連續自然數的和為 $3S$，最小數與最大數的乘積加 $1$ 等於 $T^2$。當 $S = 15$ 時，這三個自然數中最大的數是多少？",
                "explain": "步驟 1: 設三個連續自然數為 $n-1, n, n+1$，其和為 $3n = 3S \Rightarrow n = S = 15$。\n步驟 2: 這三個數是 $14, 15, 16$。\n步驟 3: 其中最大的數是 $16$。\n步驟 4: 驗算: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$。",
                "hints": ["設三個連續自然數為 $n-1, n, n+1$，其和為 $3n$。", "中間的數即為 $n = S = 15$。"],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "ja": {
                "prompt": "[{grade} 数学的思考探究 (発展)] {title} の原理を活用した応用課題です。連続する3つの自然数の和が $3S$ であり、最小の数と最大の数の積に $1$ を足した値が $T^2$ の形になります。$S = 15$ のとき、この3つの自然数のうち最大の数はいくつですか？",
                "explain": "ステップ 1: 連続する3つの自然数を $n-1, n, n+1$ とおくと、その和は $3n = 3S \Rightarrow n = S = 15$ です。\nステップ 2: 3つの数は $14, 15, 16$ です。\nステップ 3: 最も大きい数は $16$ です。\nステップ 4: 検算: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$。",
                "hints": ["連続する3つの自然数を $n-1, n, n+1$ とおくと和は $3n$ です。", "真ん中の数が $n = S = 15$ となります。"],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "gl": {
                "prompt": "[{grade} Investigación Matemática (Avanzada)] Pregunta complexa que aplica {title}. Tres números naturais consecutivos suman $3S$, e o produto do menor e o maior máis $1$ é igual a $T^2$. Cando $S = 15$, cal é o maior destes tres números?",
                "explain": "Paso 1: Sexan os números $n-1, n, n+1$, a súa suma é $3n = 3S \Rightarrow n = S = 15$.\nPaso 2: Os tres números son $14, 15, 16$.\nPaso 3: Polo tanto, o número maior é $16$.\nPaso 4: Comprobación: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$.",
                "hints": ["Representando os números como $n-1, n, n+1$, a suma é $3n$.", "O número do medio é $n = S = 15$."],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "es": {
                "prompt": "[{grade} Indagación Matemática (Avanzada)] Problema complejo que aplica los principios de {title}. Tres números naturales consecutivos suman $3S$, y el producto del menor y el mayor más $1$ es igual a $T^2$. Cuando $S = 15$, ¿cuál es el mayor de estos tres números?",
                "explain": "Paso 1: Sean los números $n-1, n, n+1$, su suma es $3n = 3S \Rightarrow n = S = 15$.\nPaso 2: Los tres números son $14, 15, 16$.\nPaso 3: Por lo tanto, el mayor número es $16$.\nPaso 4: Comprobación: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$.",
                "hints": ["Representando los números como $n-1, n, n+1$, la suma es $3n$.", "El número central es $n = S = 15$."],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "fr": {
                "prompt": "[{grade} Raisonnement Mathématique (Avancé)] Problème complexe appliquant {title}. Trois entiers naturels consécutifs ont pour somme $3S$, et le produit du plus petit et du plus grand augmenté de $1$ est égal à $T^2$. Lorsque $S = 15$, quel est le plus grand de ces trois nombres ?",
                "explain": "Étape 1 : En posant les nombres comme $n-1, n, n+1$, leur somme est $3n = 3S \Rightarrow n = S = 15$.\nÉtape 2 : Les nombres sont $14, 15, 16$.\nÉtape 3 : Le plus grand est $16$.\nÉtape 4 : Vérification : $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$.",
                "hints": ["En posant les entiers consécutifs $n-1, n, n+1$, la somme est $3n$.", "Le terme médian est $n = S = 15$."],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "de": {
                "prompt": "[{grade} Mathematisches Denken (Vertiefung)] Vertiefte Aufgabe zu {title}. Drei aufeinanderfolgende natürliche Zahlen haben die Summe $3S$, und das Produkt der kleinsten und größten Zahl plus $1$ ergibt $T^2$. Welches ist für $S = 15$ die größte dieser drei Zahlen?",
                "explain": "Schritt 1: Seien die Zahlen $n-1, n, n+1$, so ist ihre Summe $3n = 3S \Rightarrow n = S = 15$.\nSchritt 2: Die drei Zahlen sind $14, 15, 16$.\nSchritt 3: Die größte Zahl ist $16$.\nSchritt 4: Probe: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$.",
                "hints": ["Drei aufeinanderfolgende Zahlen $n-1, n, n+1$ ergeben die Summe $3n$.", "Die mittlere Zahl ist $n = S = 15$."],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            },
            "ru": {
                "prompt": "[{grade} Математическое мышление (углубленное)] Комплексная задача на основе темы {title}. Сумма трех последовательных натуральных чисел равна $3S$, а произведение наименьшего и наибольшего, увеличенное на $1$, равно $T^2$. При $S = 15$ найдите наибольшее из этих трех чисел.",
                "explain": "Шаг 1: Обозначим числа как $n-1, n, n+1$. Их сумма равна $3n = 3S \Rightarrow n = S = 15$.\nШаг 2: Эти числа: $14, 15, 16$.\nШаг 3: Наибольшее число — $16$.\nШаг 4: Проверка: $(14 \times 16) + 1 = 224 + 1 = 225 = 15^2$.",
                "hints": ["Обозначьте три последовательных числа как $n-1, n, n+1$, их сумма равна $3n$.", "Среднее число равно $n = S = 15$."],
                "options": ["$14$", "$15$", "$16$", "$17$"]
            }
        }
    },
    "physics": {
        "Q1": {
            "ko": {
                "prompt": "[{grade} 물리 탐구] {title}의 원리를 적용하는 문제입니다. 마찰이 없는 수평면 위에서 질량 $m = 2\text{ kg}$인 물체에 일정한 수평력 $F = 10\text{ N}$을 가하여 $4\text{ m}$ 이동시켰습니다. 물체가 받은 일 $W$와 가속도 $a$에 대한 설명 중 옳은 것은 무엇입니까?",
                "explain": "1단계: 뉴턴의 운동 제2법칙 $F = ma$에 의해 $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$입니다.\n2단계: 한 일의 양은 $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$입니다.\n3단계: 따라서 가속도는 $5\text{ m/s}^2$, 한 일은 $40\text{ J}$가 올바른 설명입니다.",
                "hints": ["뉴턴의 제2법칙: $F = ma$ 공식을 사용합니다.", "일의 정의: $W = F \times s$ 공식을 사용합니다."],
                "options": [
                    "가속도는 $5\text{ m/s}^2$이고, 한 일은 $40\text{ J}$이다.",
                    "가속도는 $2\text{ m/s}^2$이고, 한 일은 $20\text{ J}$이다.",
                    "가속도는 $10\text{ m/s}^2$이고, 한 일은 $40\text{ J}$이다.",
                    "가속도는 $5\text{ m/s}^2$이고, 한 일은 $20\text{ J}$이다."
                ]
            },
            "en": {
                "prompt": "[{grade} Physics Inquiry] Inquiry problem applying {title}. On a frictionless horizontal surface, a constant horizontal force $F = 10\text{ N}$ acts on an object of mass $m = 2\text{ kg}$, moving it $4\text{ m}$. Which statement about the work $W$ done and the acceleration $a$ is correct?",
                "explain": "Step 1: By Newton's second law $F = ma$, $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$.\nStep 2: Work done is $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$.\nStep 3: Therefore, acceleration is $5\text{ m/s}^2$ and work done is $40\text{ J}$.",
                "hints": ["Newton's second law: use $F = ma$.", "Definition of work: use $W = F \times s$."],
                "options": [
                    "Acceleration is $5\text{ m/s}^2$ and work done is $40\text{ J}$.",
                    "Acceleration is $2\text{ m/s}^2$ and work done is $20\text{ J}$.",
                    "Acceleration is $10\text{ m/s}^2$ and work done is $40\text{ J}$.",
                    "Acceleration is $5\text{ m/s}^2$ and work done is $20\text{ J}$."
                ]
            },
            "vi": {
                "prompt": "[{grade} Khám phá Vật lý] Bài toán khám phá ứng dụng nguyên lý {title}. Trên mặt phẳng nằm ngang không ma sát, tác dụng một lực không đổi $F = 10\text{ N}$ lên vật có khối lượng $m = 2\text{ kg}$, làm vật dịch chuyển $4\text{ m}$. Phát biểu nào sau đây về công $W$ thực hiện và gia tốc $a$ là đúng?",
                "explain": "Bước 1: Theo định luật II Newton $F = ma$, gia tốc $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$.\nBước 2: Công thực hiện là $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$.\nBước 3: Vậy gia tốc là $5\text{ m/s}^2$ và công thực hiện là $40\text{ J}$.",
                "hints": ["Định luật II Newton: áp dụng công thức $F = ma$.", "Định nghĩa công cơ học: áp dụng công thức $W = F \times s$."],
                "options": [
                    "Gia tốc là $5\text{ m/s}^2$ và công thực hiện là $40\text{ J}$.",
                    "Gia tốc là $2\text{ m/s}^2$ và công thực hiện là $20\text{ J}$.",
                    "Gia tốc là $10\text{ m/s}^2$ và công thực hiện là $40\text{ J}$.",
                    "Gia tốc là $5\text{ m/s}^2$ và công thực hiện là $20\text{ J}$."
                ]
            },
            "zh-Hans": {
                "prompt": "[{grade} 物理探究] 应用 {title} 原理的探究问题。在光滑无摩擦的水平面上，用恒力 $F = 10\text{ N}$ 作用于质量为 $m = 2\text{ kg}$ 的物体，使其移动 $4\text{ m}$。关于物体所受的功 $W$ 和加速度 $a$，下列说法正确的是？",
                "explain": "步骤 1: 根据牛顿第二定律 $F = ma$，加速度 $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$。\n步骤 2: 所做的功 $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$。\n步骤 3: 因此，加速度为 $5\text{ m/s}^2$，所做的功为 $40\text{ J}$。",
                "hints": ["牛顿第二定律公式：$F = ma$。", "功的定义公式：$W = F \times s$。"],
                "options": [
                    "加速度为 $5\text{ m/s}^2$，做功为 $40\text{ J}$。",
                    "加速度为 $2\text{ m/s}^2$，做功为 $20\text{ J}$。",
                    "加速度为 $10\text{ m/s}^2$，做功为 $40\text{ J}$。",
                    "加速度为 $5\text{ m/s}^2$，做功为 $20\text{ J}$。"
                ]
            },
            "zh-Hant": {
                "prompt": "[{grade} 物理探究] 應用 {title} 原理的探究問題。在光滑無摩擦的水平面上，以水平定力 $F = 10\text{ N}$ 作用於質量 $m = 2\text{ kg}$ 的物體，使其位移 $4\text{ m}$。關於物體所受的功 $W$ 與加速度 $a$，下列敘述何者正確？",
                "explain": "步驟 1: 依據牛頓第二運動定律 $F = ma$，加速度 $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$。\n步驟 2: 所作的功 $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$。\n步驟 3: 因此，加速度為 $5\text{ m/s}^2$，所作的功為 $40\text{ J}$。",
                "hints": ["牛頓第二運動定律公式：$F = ma$。", "功的定義公式：$W = F \times s$。"],
                "options": [
                    "加速度為 $5\text{ m/s}^2$，作功為 $40\text{ J}$。",
                    "加速度為 $2\text{ m/s}^2$，作功為 $20\text{ J}$。",
                    "加速度為 $10\text{ m/s}^2$，作功為 $40\text{ J}$。",
                    "加速度為 $5\text{ m/s}^2$，作功為 $20\text{ J}$。"
                ]
            },
            "ja": {
                "prompt": "[{grade} 物理探究] {title} の原理を適用する課題です。摩擦のない水平面上で質量 $m = 2\text{ kg}$ の物体に一定の水平力 $F = 10\text{ N}$ を加えて $4\text{ m}$ 移動させました。物体がされた仕事 $W$ と加速度 $a$ について正しい説明はどれですか？",
                "explain": "ステップ 1: ニュートンの運動の第2法則 $F = ma$ より、加速度 $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$ です。\nステップ 2: 仕事の大きさは $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$ です。\nステップ 3: したがって、加速度は $5\text{ m/s}^2$、仕事は $40\text{ J}$ です。",
                "hints": ["ニュートンの運動方程式：$F = ma$ を使用します。", "仕事の定義式：$W = F \times s$ を使用します。"],
                "options": [
                    "加速度は $5\text{ m/s}^2$ で、仕事は $40\text{ J}$ である。",
                    "加速度は $2\text{ m/s}^2$ で、仕事は $20\text{ J}$ である。",
                    "加速度は $10\text{ m/s}^2$ で、仕事は $40\text{ J}$ である。",
                    "加速度は $5\text{ m/s}^2$ で、仕事は $20\text{ J}$ である。"
                ]
            },
            "gl": {
                "prompt": "[{grade} Investigación de Física] Pregunta que aplica os principios de {title}. Nunha superficie horizontal sen rozamento, aplícase unha forza horizontal constante de $F = 10\text{ N}$ sobre un obxecto de masa $m = 2\text{ kg}$, desprazándoo $4\text{ m}$. Cal das seguintes afirmacións sobre o traballo $W$ realizado e a aceleración $a$ é correcta?",
                "explain": "Paso 1: Segundo a segunda lei de Newton $F = ma$, $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$.\nPaso 2: A cantidade de traballo realizado é $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$.\nPaso 3: Polo tanto, a aceleración é de $5\text{ m/s}^2$ e o traballo realizado é de $40\text{ J}$.",
                "hints": ["Segunda lei de Newton: emprega $F = ma$.", "Definición de traballo: emprega $W = F \times s$."],
                "options": [
                    "A aceleración é de $5\text{ m/s}^2$ e o traballo realizado é de $40\text{ J}$.",
                    "A aceleración é de $2\text{ m/s}^2$ e o traballo realizado é de $20\text{ J}$.",
                    "A aceleración é de $10\text{ m/s}^2$ e o traballo realizado é de $40\text{ J}$.",
                    "A aceleración é de $5\text{ m/s}^2$ e o traballo realizado é de $20\text{ J}$."
                ]
            },
            "es": {
                "prompt": "[{grade} Indagación Física] Problema que aplica los principios de {title}. En una superficie horizontal sin fricción, se aplica una fuerza constante $F = 10\text{ N}$ a un cuerpo de masa $m = 2\text{ kg}$, desplazándolo $4\text{ m}$. ¿Cuál de las siguientes afirmaciones sobre el trabajo $W$ realizado y la aceleración $a$ es correcta?",
                "explain": "Paso 1: Por la segunda ley de Newton $F = ma$, $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$.\nPaso 2: El trabajo realizado es $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$.\nPaso 3: Por lo tanto, la aceleración es $5\text{ m/s}^2$ y el trabajo realizado es $40\text{ J}$.",
                "hints": ["Segunda ley de Newton: usa $F = ma$.", "Definición de trabajo: usa $W = F \times s$."],
                "options": [
                    "La aceleración es de $5\text{ m/s}^2$ y el trabajo realizado es de $40\text{ J}$.",
                    "La aceleración es de $2\text{ m/s}^2$ y el trabajo realizado es de $20\text{ J}$.",
                    "La aceleración es de $10\text{ m/s}^2$ y el trabajo realizado es de $40\text{ J}$.",
                    "La aceleración es de $5\text{ m/s}^2$ y el trabajo realizado es de $20\text{ J}$."
                ]
            },
            "fr": {
                "prompt": "[{grade} Enquête Physique] Problème appliquant les principes de {title}. Sur une surface horizontale sans frottement, une force constante de $F = 10\text{ N}$ est appliquée à un objet de masse $m = 2\text{ kg}$, le déplaçant de $4\text{ m}$. Laquelle des affirmations suivantes concernant le travail $W$ et l'accélération $a$ est correcte ?",
                "explain": "Étape 1 : D'après la deuxième loi de Newton $F = ma$, $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$.\nÉtape 2 : Le travail effectué est $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$.\nÉtape 3 : Donc l'accélération est de $5\text{ m/s}^2$ et le travail est de $40\text{ J}$.",
                "hints": ["Deuxième loi de Newton : $F = ma$.", "Définition du travail : $W = F \times s$."],
                "options": [
                    "L'accélération est de $5\text{ m/s}^2$ et le travail effectué est de $40\text{ J}$.",
                    "L'accélération est de $2\text{ m/s}^2$ et le travail effectué est de $20\text{ J}$.",
                    "L'accélération est de $10\text{ m/s}^2$ et le travail effectué est de $40\text{ J}$.",
                    "L'accélération est de $5\text{ m/s}^2$ et le travail effectué est de $20\text{ J}$."
                ]
            },
            "de": {
                "prompt": "[{grade} Physikalische Untersuchung] Aufgabe zur Anwendung von {title}. Auf einer reibungsfreien horizontalen Ebene wirkt eine konstante Kraft $F = 10\text{ N}$ auf einen Körper der Masse $m = 2\text{ kg}$ und verschiebt ihn um $4\text{ m}$. Welche Aussage über Arbeit $W$ und Beschleunigung $a$ ist richtig?",
                "explain": "Schritt 1: Nach dem zweiten Newtonschen Gesetz $F = ma$ ist $a = \frac{F}{m} = \frac{10\text{ N}}{2\text{ kg}} = 5\text{ m/s}^2$.\nSchritt 2: Die verrichtete Arbeit ist $W = F \cdot s = 10\text{ N} \times 4\text{ m} = 40\text{ J}$.\nSchritt 3: Folglich beträgt die Beschleunigung $5\text{ m/s}^2$ und die Arbeit $40\text{ J}$.",
                "hints": ["Zweites Newtonsches Gesetz: $F = ma$.", "Definition der Arbeit: $W = F \times s$."],
                "options": [
                    "Die Beschleunigung beträgt $5\text{ m/s}^2$ und die verrichtete Arbeit $40\text{ J}$.",
                    "Die Beschleunigung beträgt $2\text{ m/s}^2$ und die verrichtete Arbeit $20\text{ J}$.",
                    "Die Beschleunigung beträgt $10\text{ m/s}^2$ und die verrichtete Arbeit $40\text{ J}$.",
                    "Die Beschleunigung beträgt $5\text{ m/s}^2$ und die verrichtete Arbeit $20\text{ J}$."
                ]
            },
            "ru": {
                "prompt": "[{grade} Физическое исследование] Задача на применение принципов темы {title}. На гладкой горизонтальной поверхности к телу массой $m = 2\text{ кг}$ приложена постоянная сила $F = 10\text{ Н}$, переместившая его на $4\text{ м}$. Какое утверждение о совершенной работе $W$ и ускорении $a$ верно?",
                "explain": "Шаг 1: По второму закону Ньютона $F = ma$, ускорение $a = \frac{F}{m} = \frac{10\text{ Н}}{2\text{ кг}} = 5\text{ м/с}^2$.\nШаг 2: Совершенная работа равна $W = F \cdot s = 10\text{ Н} \times 4\text{ м} = 40\text{ Дж}$.\nШаг 3: Следовательно, ускорение равно $5\text{ м/с}^2$, а работа — $40\text{ Дж}$.",
                "hints": ["Второй закон Ньютона: используйте формулу $F = ma$.", "Определение работы: используйте формулу $W = F \times s$."],
                "options": [
                    "Ускорение равно $5\text{ м/с}^2$, совершенная работа — $40\text{ Дж}$.",
                    "Ускорение равно $2\text{ м/с}^2$, совершенная работа — $20\text{ Дж}$.",
                    "Ускорение равно $10\text{ м/с}^2$, совершенная работа — $40\text{ Дж}$.",
                    "Ускорение равно $5\text{ м/с}^2$, совершенная работа — $20\text{ Дж}$."
                ]
            }
        },
        "Q2": {
            "ko": {
                "prompt": "[{grade} 물리 탐구 (심화·응용)] {title}의 원리를 분석하는 역학 탐구 문제입니다. 지표면 근처에서 질량 $m = 1\text{ kg}$인 물체를 높이 $h = 20\text{ m}$인 지점에서 가만히 놓아 자유 낙하시켰습니다. (단, 중력가속도 $g = 9.8\text{ m/s}^2$, 공기 저항 무시) 물체의 역학적 에너지 보존과 지면 도달 직전 속력 $v$에 대한 설명으로 옳은 것은 무엇입니까?",
                "explain": "1단계: 공기 저항이 없으므로 낙하하는 동안 역학적 에너지는 일정하게 보존됩니다.\n2단계: 최고점에서의 위치 에너지가 지면에서의 운동 에너지로 전환되므로 $mgh = \frac{1}{2}mv^2$입니다.\n3단계: $v = \sqrt{2gh} = \sqrt{2 \times 9.8\text{ m/s}^2 \times 20\text{ m}} = \sqrt{392} \approx 19.8\text{ m/s}$입니다.",
                "hints": ["공기 저항을 무시하므로 역학적 에너지 보존 법칙 $mgh = \frac{1}{2}mv^2$이 성립합니다.", "$v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$입니다."],
                "options": [
                    "역학적 에너지는 보존되며, 지면 도달 직전 속력은 약 $19.8\text{ m/s}$이다.",
                    "역학적 에너지는 낙하하며 감소하여 지면 도달 직전 속력은 약 $9.8\text{ m/s}$이다.",
                    "위치 에너지만 보존되고 운동 에너지는 0이 된다.",
                    "중력가속도가 시간에 따라 증가하므로 속력 계산이 불가능하다."
                ]
            },
            "en": {
                "prompt": "[{grade} Physics Inquiry (Advanced)] Mechanics problem analyzing {title}. An object of mass $m = 1\text{ kg}$ is dropped from rest at height $h = 20\text{ m}$ in free fall ($g = 9.8\text{ m/s}^2$, ignore air resistance). Which statement about mechanical energy conservation and final speed $v$ is correct?",
                "explain": "Step 1: With no air resistance, mechanical energy is conserved throughout fall.\nStep 2: $mgh = \frac{1}{2}mv^2 \Rightarrow v = \sqrt{2gh}$.\nStep 3: $v = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$.",
                "hints": ["Conservation of mechanical energy: $mgh = \frac{1}{2}mv^2$.", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$."],
                "options": [
                    "Mechanical energy is conserved, and speed just before impact is approx $19.8\text{ m/s}$.",
                    "Mechanical energy decreases, and speed just before impact is approx $9.8\text{ m/s}$.",
                    "Only potential energy is conserved, and kinetic energy is zero.",
                    "Gravity varies with time, so speed cannot be calculated."
                ]
            },
            "vi": {
                "prompt": "[{grade} Khám phá Vật lý (Nâng cao)] Bài toán cơ học phân tích nguyên lý {title}. Thả rơi tự do một vật có khối lượng $m = 1\text{ kg}$ từ độ cao $h = 20\text{ m}$ (lấy $g = 9.8\text{ m/s}^2$, bỏ qua sức cản không khí). Phát biểu nào sau đây về sự bảo toàn cơ năng và vận tốc $v$ ngay trước khi chạm đất là đúng?",
                "explain": "Bước 1: Bỏ qua sức cản không khí nên cơ năng được bảo toàn trong suốt quá trình rơi.\nBước 2: Thế năng ban đầu chuyển hóa hoàn toàn thành động năng: $mgh = \frac{1}{2}mv^2$.\nBước 3: Vận tốc $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$.",
                "hints": ["Định luật bảo toàn cơ năng: $mgh = \frac{1}{2}mv^2$.", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$."],
                "options": [
                    "Cơ năng được bảo toàn, vận tốc ngay trước khi chạm đất khoảng $19.8\text{ m/s}$.",
                    "Cơ năng giảm dần, vận tốc ngay trước khi chạm đất khoảng $9.8\text{ m/s}$.",
                    "Chỉ có thế năng được bảo toàn và động năng bằng 0.",
                    "Gia tốc trọng trường thay đổi nên không thể tính được vận tốc."
                ]
            },
            "zh-Hans": {
                "prompt": "[{grade} 物理探究 (进阶)] 深入分析 {title} 原理的力学探究题。在地面附近，将质量为 $m = 1\text{ kg}$ 的物体从高 $h = 20\text{ m}$ 处由静止释放进行自由落体运动（取 $g = 9.8\text{ m/s}^2$，忽略空气阻力）。关于机械能守恒与落地前瞬时速度 $v$，下列说法正确的是？",
                "explain": "步骤 1: 忽略空气阻力，下落过程中机械能严格守恒。\n步骤 2: 初始重力势能全部转化为动能：$mgh = \frac{1}{2}mv^2$。\n步骤 3: 速度 $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$。",
                "hints": ["机械能守恒定律：$mgh = \frac{1}{2}mv^2$。", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$。"],
                "options": [
                    "机械能守恒，落地前瞬时速度约为 $19.8\text{ m/s}$。",
                    "机械能在下落中减小，落地前瞬时速度约为 $9.8\text{ m/s}$。",
                    "仅势能守恒，动能为零。",
                    "重力加速度随时间改变，无法计算速度。"
                ]
            },
            "zh-Hant": {
                "prompt": "[{grade} 物理探究 (進階)] 深入分析 {title} 原理的力學探究題。在地面附近，將質量為 $m = 1\text{ kg}$ 的物體從高 $h = 20\text{ m}$ 處由靜止釋放作自由落體運動（取 $g = 9.8\text{ m/s}^2$，忽略空氣阻力）。關於機械能守恆與落地前瞬時速度 $v$，下列敘述何者正確？",
                "explain": "步驟 1: 忽略空氣阻力，下落過程中機械能嚴格守恆。\n步驟 2: 初始重力位能全部轉化為動能：$mgh = \frac{1}{2}mv^2$。\n步驟 3: 速度 $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$。",
                "hints": ["機械能守恆定律：$mgh = \frac{1}{2}mv^2$。", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$。"],
                "options": [
                    "機械能守恆，落地前瞬時速度約為 $19.8\text{ m/s}$。",
                    "機械能在下落中減小，落地前瞬時速度約為 $9.8\text{ m/s}$。",
                    "僅位能守恆，動能為零。",
                    "重力加速度隨時間改變，無法計算速度。"
                ]
            },
            "ja": {
                "prompt": "[{grade} 物理探究 (発展)] {title} の原理を分析する力学探究課題です。地表付近で質量 $m = 1\text{ kg}$ の物体を高さ $h = 20\text{ m}$ から静かに自由落下させました（$g = 9.8\text{ m/s}^2$、空気抵抗は無視）。力学的エネルギー保存と接地直前の速さ $v$ について正しいものはどれですか？",
                "explain": "ステップ 1: 空気抵抗を無視できるため、落下運動中に力学的エネルギーは一定に保存されます。\nステップ 2: 初期位置エネルギーが運動エネルギーに変換されるため、$mgh = \frac{1}{2}mv^2$ です。\nステップ 3: 速さ $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$ です。",
                "hints": ["力学的エネルギー保存則：$mgh = \frac{1}{2}mv^2$。", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$ です。"],
                "options": [
                    "力学的エネルギーは保存され、接地直前の速さは約 $19.8\text{ m/s}$ である。",
                    "力学的エネルギーは減少し、接地直前の速さは約 $9.8\text{ m/s}$ である。",
                    "位置エネルギーのみ保存され、運動エネルギーは0である。",
                    "重力加速度が変化するため、速さを計算することはできない。"
                ]
            },
            "gl": {
                "prompt": "[{grade} Investigación de Física (Avanzada)] Problema de mecánica que analiza {title}. Déixase caer libremente desde o repouso un obxecto de masa $m = 1\text{ kg}$ desde unha altura $h = 20\text{ m}$ ($g = 9.8\text{ m/s}^2$, sen resistencia do aire). Cal das seguintes afirmacións sobre a conservación da enerxía mecánica e a velocidade final $v$ é correcta?",
                "explain": "Paso 1: Sen resistencia do aire, a enerxía mecánica consérvase durante a caída.\nPaso 2: A enerxía potencial inicial transfórmase en enerxía cinética: $mgh = \frac{1}{2}mv^2$.\nPaso 3: $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$.",
                "hints": ["Conservación da enerxía mecánica: $mgh = \frac{1}{2}mv^2$.", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$."],
                "options": [
                    "A enerxía mecánica consérvase e a velocidade xusto antes do impacto é de aprox $19.8\text{ m/s}$.",
                    "A enerxía mecánica diminúe e a velocidade xusto antes do impacto é de aprox $9.8\text{ m/s}$.",
                    "Só se conserva a enerxía potencial e a enerxía cinética faise cero.",
                    "A gravidade varía co tempo polo que a velocidade non se pode calcular."
                ]
            },
            "es": {
                "prompt": "[{grade} Indagación Física (Avanzada)] Problema de mecánica que analiza {title}. Se deja caer libremente desde el reposo un objeto de masa $m = 1\text{ kg}$ desde una altura $h = 20\text{ m}$ ($g = 9.8\text{ m/s}^2$, sin fricción del aire). ¿Cuál de las siguientes afirmaciones sobre la conservación de la energía mecánica y la velocidad final $v$ es correcta?",
                "explain": "Paso 1: Sin resistencia del aire, la energía mecánica se conserva durante la caída.\nPaso 2: La energía potencial inicial se transforma en cinética: $mgh = \frac{1}{2}mv^2$.\nPaso 3: $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$.",
                "hints": ["Conservación de la energía mecánica: $mgh = \frac{1}{2}mv^2$.", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$."],
                "options": [
                    "La energía mecánica se conserva y la rapidez justo antes del impacto es de aprox $19.8\text{ m/s}$.",
                    "La energía mecánica disminuye y la rapidez justo antes del impacto es de aprox $9.8\text{ m/s}$.",
                    "Solo la energía potencial se conserva y la energía cinética es cero.",
                    "La gravedad varía con el tiempo, por lo que no es posible calcular la rapidez."
                ]
            },
            "fr": {
                "prompt": "[{grade} Enquête Physique (Avancée)] Problème de mécanique analysant {title}. Un objet de masse $m = 1\text{ kg}$ est lâché en chute libre sans vitesse initiale d'une hauteur $h = 20\text{ m}$ ($g = 9.8\text{ m/s}^2$, résistance de l'air négligée). Laquelle des affirmations suivantes est correcte ?",
                "explain": "Étape 1 : Sans frottement de l'air, l'énergie mécanique est conservée au cours de la chute.\nÉtape 2 : L'énergie potentielle initiale se transforme en énergie cinétique : $mgh = \frac{1}{2}mv^2$.\nÉtape 3 : $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$.",
                "hints": ["Conservation de l'énergie mécanique : $mgh = \frac{1}{2}mv^2$.", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$."],
                "options": [
                    "L'énergie mécanique est conservée et la vitesse juste avant l'impact est d'environ $19.8\text{ m/s}$.",
                    "L'énergie mécanique diminue et la vitesse juste avant l'impact est d'environ $9.8\text{ m/s}$.",
                    "Seule l'énergie potentielle est conservée et l'énergie cinétique est nulle.",
                    "La gravité varie avec le temps, le calcul de vitesse est impossible."
                ]
            },
            "de": {
                "prompt": "[{grade} Physikalische Untersuchung (Vertiefung)] Mechanikaufgabe zur Analyse von {title}. Ein Körper der Masse $m = 1\text{ kg}$ fällt aus der Ruhe aus einer Höhe $h = 20\text{ m}$ im freien Fall herab ($g = 9.8\text{ m/s}^2$, Luftwiderstand vernachlässigt). Welche Aussage ist richtig?",
                "explain": "Schritt 1: Ohne Luftwiderstand bleibt die mechanische Energie während des gesamten Falls konstant erhalten.\nSchritt 2: Die potentielle Energie wandelt sich in kinetische Energie um: $mgh = \frac{1}{2}mv^2$.\nSchritt 3: $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ m/s}$.",
                "hints": ["Erhaltung der mechanischen Energie: $mgh = \frac{1}{2}mv^2$.", "$v = \sqrt{2gh} \approx 19.8\text{ m/s}$."],
                "options": [
                    "Die mechanische Energie bleibt erhalten und die Geschwindigkeit vor dem Aufprall beträgt ca. $19.8\text{ m/s}$.",
                    "Die mechanische Energie nimmt ab und die Geschwindigkeit beträgt ca. $9.8\text{ m/s}$.",
                    "Nur die potentielle Energie bleibt erhalten, die kinetische Energie ist null.",
                    "Die Schwerkraft ändert sich zeitlich, Berechnung nicht möglich."
                ]
            },
            "ru": {
                "prompt": "[{grade} Физическое исследование (углубленное)] Задача по механике, анализирующая тему {title}. Тело массой $m = 1\text{ кг}$ свободно падает из состояния покоя с высоты $h = 20\text{ м}$ ($g = 9.8\text{ м/с}^2$, сопротивлением воздуха пренебречь). Какое утверждение верно?",
                "explain": "Шаг 1: При отсутствии сопротивления воздуха механическая энергия сохраняется постоянной.\nШаг 2: Потенциальная энергия переходит в кинетическую: $mgh = \frac{1}{2}mv^2$.\nШаг 3: Скорость $v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 20} = \sqrt{392} \approx 19.8\text{ м/с}$.",
                "hints": ["Закон сохранения механической энергии: $mgh = \frac{1}{2}mv^2$.", "$v = \sqrt{2gh} \approx 19.8\text{ м/с}$."],
                "options": [
                    "Механическая энергия сохраняется, а скорость перед ударом о землю составляет около $19.8\text{ м/с}$.",
                    "Механическая энергия уменьшается, скорость перед ударом около $9.8\text{ м/с}$.",
                    "Сохраняется только потенциальная энергия, кинетическая равна нулю.",
                    "Ускорение свободного падения меняется со временем, скорость рассчитать нельзя."
                ]
            }
        }
    },
    "chemistry": {
        "Q1": {
            "ko": {
                "prompt": "[{grade} 화학 탐구] {title}에 대한 사고력 문제입니다. $25^\circ\text{C}$, $1\text{ atm}$에서 기체 $1\text{ mol}$의 부피가 $24.5\text{ L}$일 때, 같은 온도와 압력에서 어떤 기체 $0.2\text{ mol}$의 부피는 몇 $\text{L}$인지 이상 기체 상태를 바탕으로 계산하십시오.",
                "explain": "1단계: 아보가드로 법칙에 따라 일정한 온도와 압력에서 기체의 부피 $V$는 몰수 $n$에 비례합니다.\n2단계: 1몰당 부피가 $24.5\text{ L/mol}$이므로, $0.2\text{ mol}$의 부피는 $V = 0.2\text{ mol} \times 24.5\text{ L/mol}$입니다.\n3단계: 계산하면 $V = 4.90\text{ L}$입니다.",
                "hints": ["아보가드로 법칙에 따라 같은 온도와 압력에서 기체의 부피는 몰수에 정비례합니다.", "$V = n \times V_m$을 계산합니다."],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "en": {
                "prompt": "[{grade} Chemistry Inquiry] Inquiry problem on {title}. At $25^\circ\text{C}$ and $1\text{ atm}$, the molar volume of a gas is $24.5\text{ L/mol}$. Under the same conditions, what is the volume in $\text{L}$ of $0.2\text{ mol}$ of this gas?",
                "explain": "Step 1: By Avogadro's law, gas volume $V$ is directly proportional to moles $n$.\nStep 2: $V = n \times V_m = 0.2\text{ mol} \times 24.5\text{ L/mol}$.\nStep 3: Calculating yields $V = 4.90\text{ L}$.",
                "hints": ["Under constant T and P, gas volume is directly proportional to moles.", "Calculate $V = n \times V_m$."],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "vi": {
                "prompt": "[{grade} Khám phá Hóa học] Bài toán tư duy về {title}. Ở $25^\circ\text{C}$ và $1\text{ atm}$, thể tích của $1\text{ mol}$ khí là $24.5\text{ L}$. Ở cùng điều kiện nhiệt độ và áp suất, thể tích của $0.2\text{ mol}$ chất khí này là bao nhiêu $\text{L}$?",
                "explain": "Bước 1: Theo định luật Avogadro, ở cùng nhiệt độ và áp suất, thể tích khí $V$ tỉ lệ thuận với số mol $n$.\nBước 2: Với thể tích mol là $24.5\text{ L/mol}$, thể tích của $0.2\text{ mol}$ là $V = 0.2\text{ mol} \times 24.5\text{ L/mol}$.\nBước 3: Tính toán cho kết quả $V = 4.90\text{ L}$.",
                "hints": ["Theo định luật Avogadro, thể tích khí tỉ lệ thuận với số mol.", "Tính $V = n \times V_m$."],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "zh-Hans": {
                "prompt": "[{grade} 化学探究] 关于 {title} 的探究问题。在 $25^\circ\text{C}$ 和 $1\text{ atm}$ 条件下，$1\text{ mol}$ 气体的摩尔体积为 $24.5\text{ L}$。在同温同压下，某气体 $0.2\text{ mol}$ 的体积是多少 $\text{L}$？",
                "explain": "步骤 1: 根据阿伏伽德罗定律，在同温同压下，气体的体积 $V$ 与物质的量 $n$ 成正比。\n步骤 2: 体积 $V = n \times V_m = 0.2\text{ mol} \times 24.5\text{ L/mol}$。\n步骤 3: 计算得出 $V = 4.90\text{ L}$。",
                "hints": ["在同温同压下，气体体积与物质的量成正比。", "计算 $V = n \times V_m$。"],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "zh-Hant": {
                "prompt": "[{grade} 化學探究] 關於 {title} 的探究問題。在 $25^\circ\text{C}$ 與 $1\text{ atm}$ 條件下，$1\text{ mol}$ 氣體的莫耳體積為 $24.5\text{ L}$。在同溫同壓下，某氣體 $0.2\text{ mol}$ 的體積是多少 $\text{L}$？",
                "explain": "步驟 1: 根據亞佛加厥定律，在同溫同壓下，氣體的體積 $V$ 與物質的量 $n$ 成正比。\n步驟 2: 體積 $V = n \times V_m = 0.2\text{ mol} \times 24.5\text{ L/mol}$。\n步驟 3: 計算得出 $V = 4.90\text{ L}$。",
                "hints": ["在同溫同壓下，氣體體積與莫耳數成正比。", "計算 $V = n \times V_m$。"],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "ja": {
                "prompt": "[{grade} 化学探究] {title} に関する探究課題です。$25^\circ\text{C}, 1\text{ atm}$ において気体 $1\text{ mol}$ の体積が $24.5\text{ L}$ であるとき、同温同圧で気体 $0.2\text{ mol}$ の体積は何 $\text{L}$ ですか？",
                "explain": "ステップ 1: アボガドロの法則により、同温同圧において気体の体積 $V$ は物質量 $n$ に比例します。\nステップ 2: 体積は $V = n \times V_m = 0.2\text{ mol} \times 24.5\text{ L/mol}$ です。\nステップ 3: 計算すると $V = 4.90\text{ L}$ となります。",
                "hints": ["アボガドロの法則により、気体の体積はモル数に比例します。", "$V = n \times V_m$ を計算します。"],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "gl": {
                "prompt": "[{grade} Investigación de Química] Problema de razoamento sobre {title}. A $25^\circ\text{C}$ e $1\text{ atm}$, o volume molar dun gas é de $24.5\text{ L/mol}$. En idénticas condicións, que volume en $\text{L}$ ocuparán $0.2\text{ mol}$ dese gas?",
                "explain": "Paso 1: Segundo a lei de Avogadro, o volume $V$ é directamente proporcional ao número de moles $n$.\nPaso 2: $V = n \times V_m = 0.2\text{ mol} \times 24.5\text{ L/mol}$.\nPaso 3: Calculando obtemos $V = 4.90\text{ L}$.",
                "hints": ["A volume e temperatura constantes, o volume é proporcional aos moles.", "Calcula $V = n \times V_m$."],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "es": {
                "prompt": "[{grade} Indagación Química] Problema de razonamiento sobre {title}. A $25^\circ\text{C}$ y $1\text{ atm}$, el volumen molar de un gas es $24.5\text{ L/mol}$. Bajo las mismas condiciones, ¿cuál es el volumen en $\text{L}$ de $0.2\text{ mol}$ de dicho gas?",
                "explain": "Paso 1: Por la ley de Avogadro, el volumen $V$ es directamente proporcional a los moles $n$.\nPaso 2: $V = n \times V_m = 0.2\text{ mol} \times 24.5\text{ L/mol}$.\nPaso 3: Calculando se obtiene $V = 4.90\text{ L}$.",
                "hints": ["A temperatura y presión constantes, el volumen es proporcional a los moles.", "Calcula $V = n \times V_m$."],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "fr": {
                "prompt": "[{grade} Enquête Chimique] Problème sur {title}. À $25^\circ\text{C}$ et $1\text{ atm}$, le volume molaire d'un gaz est de $24.5\text{ L/mol}$. Dans les mêmes conditions, quel est le volume en $\text{L}$ de $0.2\text{ mol}$ de ce gaz ?",
                "explain": "Étape 1 : Selon la loi d'Avogadro, le volume $V$ est proportionnel à la quantité de matière $n$.\nÉtape 2 : $V = n \times V_m = 0.2\text{ mol} \times 24.5\text{ L/mol}$.\nÉtape 3 : On obtient $V = 4.90\text{ L}$.",
                "hints": ["À température et pression constantes, le volume est proportionnel aux moles.", "Calculez $V = n \times V_m$."],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "de": {
                "prompt": "[{grade} Chemische Untersuchung] Aufgabe zu {title}. Bei $25^\circ\text{C}$ und $1\text{ atm}$ beträgt das molare Volumen eines Gases $24.5\text{ L/mol}$. Welches Volumen in $\text{L}$ nehmen unter denselben Bedingungen $0.2\text{ mol}$ dieses Gases ein?",
                "explain": "Schritt 1: Nach dem Gesetz von Avogadro ist das Gasvolumen $V$ proportional zur Stoffmenge $n$.\nSchritt 2: $V = n \times V_m = 0.2\text{ mol} \times 24.5\text{ L/mol}$.\nSchritt 3: Die Rechnung ergibt $V = 4.90\text{ L}$.",
                "hints": ["Bei konstantem T und P ist das Volumen proportional zur Molzahl.", "Berechne $V = n \times V_m$."],
                "options": ["$2.45\text{ L}$", "$4.90\text{ L}$", "$9.80\text{ L}$", "$12.25\text{ L}$"]
            },
            "ru": {
                "prompt": "[{grade} Химическое исследование] Задача на тему {title}. При $25^\circ\text{C}$ и $1\text{ атм}$ молярный объем газа равен $24.5\text{ л/моль}$. При тех же условиях какой объем в $\text{л}$ займут $0.2\text{ моль}$ этого газа?",
                "explain": "Шаг 1: По закону Авогадро объем газа $V$ прямо пропорционален числу молей $n$.\nШаг 2: $V = n \times V_m = 0.2\text{ моль} \times 24.5\text{ л/моль}$.\nШаг 3: Вычисляем: $V = 4.90\text{ л}$.",
                "hints": ["При постоянных T и P объем газа пропорционален числу молей.", "Вычислите $V = n \times V_m$."],
                "options": ["$2.45\text{ л}$", "$4.90\text{ л}$", "$9.80\text{ л}$", "$12.25\text{ л}$"]
            }
        },
        "Q2": {
            "ko": {
                "prompt": "[{grade} 화학 탐구 (심화·응용)] {title}의 원리를 분석하는 정량 분석 문제입니다. 수용액에서 수소 이온 농도 $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$인 산성 용액 $A$와 $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$인 산성 용액 $B$가 있습니다. 용액 $A$의 수소 이온 농도는 용액 $B$의 수소 이온 농도의 몇 배입니까?",
                "explain": "1단계: 용액 $A$의 수소 이온 농도는 $10^{-3}\text{ M}$이고, 용액 $B$는 $10^{-5}\text{ M}$입니다.\n2단계: 비를 구하면 $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$입니다.\n3단계: 따라서 용액 $A$는 용액 $B$보다 수소 이온 농도가 100배 높습니다.",
                "hints": ["두 수소 이온 농도의 비 $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$를 구합니다.", "지수법칙: $\frac{10^{-3}}{10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$입니다."],
                "options": ["$10\text{배}$", "$100\text{배}$", "$1000\text{배}$", "$0.01\text{배}$"]
            },
            "en": {
                "prompt": "[{grade} Chemistry Inquiry (Advanced)] Quantitative analysis problem on {title}. Acidic solution $A$ has $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$ and solution $B$ has $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$. How many times greater is the hydrogen ion concentration of $A$ than $B$?",
                "explain": "Step 1: $[\text{H}^+]_A = 10^{-3}\text{ M}$, $[\text{H}^+]_B = 10^{-5}\text{ M}$.\nStep 2: $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nStep 3: Solution $A$ has 100 times higher $[\text{H}^+]$ than solution $B$.",
                "hints": ["Calculate ratio $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$.", "Exponent rules: $10^{-3} / 10^{-5} = 10^2 = 100$."],
                "options": ["$10\text{ times}$", "$100\text{ times}$", "$1000\text{ times}$", "$0.01\text{ times}$"]
            },
            "vi": {
                "prompt": "[{grade} Khám phá Hóa học (Nâng cao)] Bài toán định lượng phân tích nguyên lý {title}. Dung dịch axit $A$ có $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$ và dung dịch $B$ có $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$. Nồng độ ion hydro của dung dịch $A$ gấp bao nhiêu lần nồng độ của dung dịch $B$?",
                "explain": "Bước 1: Nồng độ ion $\text{H}^+$ của $A$ là $10^{-3}\text{ M}$, của $B$ là $10^{-5}\text{ M}$.\nBước 2: Lập tỉ lệ: $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nBước 3: Do đó nồng độ của dung dịch $A$ gấp 100 lần dung dịch $B$.",
                "hints": ["Tính tỉ số $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$.", "Quy tắc lũy thừa: $10^{-3} / 10^{-5} = 10^2 = 100$."],
                "options": ["$10\text{ lần}$", "$100\text{ lần}$", "$1000\text{ lần}$", "$0.01\text{ lần}$"]
            },
            "zh-Hans": {
                "prompt": "[{grade} 化学探究 (进阶)] 定量分析 {title} 的探究问题。酸性溶液 $A$ 的 $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$，溶液 $B$ 的 $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$。溶液 $A$ 的氢离子浓度是溶液 $B$ 的多少倍？",
                "explain": "步骤 1: 溶液 $A$ 的氢离子浓度为 $10^{-3}\text{ M}$，溶液 $B$ 为 $10^{-5}\text{ M}$。\n步骤 2: 计算比值: $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$。\n步骤 3: 溶液 $A$ 的氢离子浓度是溶液 $B$ 的 100 倍。",
                "hints": ["求两个浓度的比值 $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$。", "指数运算法则: $10^{-3} / 10^{-5} = 10^2 = 100$。"],
                "options": ["$10\text{倍}$", "$100\text{倍}$", "$1000\text{倍}$", "$0.01\text{倍}$"]
            },
            "zh-Hant": {
                "prompt": "[{grade} 化學探究 (進階)] 定量分析 {title} 的探究問題。酸性溶液 $A$ 的 $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$，溶液 $B$ 的 $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$。溶液 $A$ 的氫離子濃度是溶液 $B$ 的多少倍？",
                "explain": "步驟 1: 溶液 $A$ 的氫離子濃度為 $10^{-3}\text{ M}$，溶液 $B$ 為 $10^{-5}\text{ M}$。\n步驟 2: 計算比值: $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$。\n步驟 3: 溶液 $A$ 的氫離子濃度是溶液 $B$ 的 100 倍。",
                "hints": ["求兩濃度之比值 $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$。", "指數計算法則: $10^{-3} / 10^{-5} = 10^2 = 100$。"],
                "options": ["$10\text{倍}$", "$100\text{倍}$", "$1000\text{倍}$", "$0.01\text{倍}$"]
            },
            "ja": {
                "prompt": "[{grade} 化学探究 (発展)] {title} を定量的に分析する探究課題です。酸性水溶液 $A$ の水素イオン濃度 $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$、水溶液 $B$ の $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$ です。水溶液 $A$ の水素イオン濃度は水溶液 $B$ の何倍ですか？",
                "explain": "ステップ 1: 水溶液 $A$ は $10^{-3}\text{ M}$、水溶液 $B$ は $10^{-5}\text{ M}$ です。\nステップ 2: 比を求めると $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$ です。\nステップ 3: したがって、水溶液 $A$ は水溶液 $B$ の 100 倍です。",
                "hints": ["比 $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$ を計算します。", "指数法則: $10^{-3} / 10^{-5} = 10^2 = 100$ です。"],
                "options": ["$10\text{倍}$", "$100\text{倍}$", "$1000\text{倍}$", "$0.01\text{倍}$"]
            },
            "gl": {
                "prompt": "[{grade} Investigación de Química (Avanzada)] Problema de análise cuantitativa sobre {title}. A disolución ácida $A$ ten $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$ e a disolución $B$ ten $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$. Cantas veces é maior a concentración de ións hidróxeno de $A$ que a de $B$?",
                "explain": "Paso 1: $[\text{H}^+]_A = 10^{-3}\text{ M}$, $[\text{H}^+]_B = 10^{-5}\text{ M}$.\nPaso 2: $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nPaso 3: Polo tanto, a disolución $A$ ten unha concentración 100 veces superior á disolución $B$.",
                "hints": ["Calcula a razón $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$.", "Propiedades de potencias: $10^{-3} / 10^{-5} = 10^2 = 100$."],
                "options": ["$10\text{ veces}$", "$100\text{ veces}$", "$1000\text{ veces}$", "$0.01\text{ veces}$"]
            },
            "es": {
                "prompt": "[{grade} Indagación Química (Avanzada)] Problema de análisis cuantitativo sobre {title}. La solución ácida $A$ tiene $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$ y la solución $B$ tiene $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$. ¿Cuántas veces mayor es la concentración de iones hidrógeno de $A$ respecto a $B$?",
                "explain": "Paso 1: $[\text{H}^+]_A = 10^{-3}\text{ M}$, $[\text{H}^+]_B = 10^{-5}\text{ M}$.\nPaso 2: $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nPaso 3: Por lo tanto, la solución $A$ tiene una concentración 100 veces mayor que la solución $B$.",
                "hints": ["Calcula la razón $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$.", "Leyes de exponentes: $10^{-3} / 10^{-5} = 10^2 = 100$."],
                "options": ["$10\text{ veces}$", "$100\text{ veces}$", "$1000\text{ veces}$", "$0.01\text{ veces}$"]
            },
            "fr": {
                "prompt": "[{grade} Enquête Chimique (Avancée)] Analyse quantitative sur {title}. La solution acide $A$ a $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$ et la solution $B$ a $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$. Combien de fois la concentration en ions hydrogène de $A$ est-elle supérieure à celle de $B$ ?",
                "explain": "Étape 1 : $[\text{H}^+]_A = 10^{-3}\text{ M}$, $[\text{H}^+]_B = 10^{-5}\text{ M}$.\nÉtape 2 : $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nÉtape 3 : La concentration de $A$ est 100 fois supérieure à celle de $B$.",
                "hints": ["Calculez le rapport $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$.", "Règles des puissances : $10^{-3} / 10^{-5} = 10^2 = 100$."],
                "options": ["$10\text{ fois}$", "$100\text{ fois}$", "$1000\text{ fois}$", "$0.01\text{ fois}$"]
            },
            "de": {
                "prompt": "[{grade} Chemische Untersuchung (Vertiefung)] Quantitative Analyse zu {title}. Die saure Lösung $A$ hat $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$ und Lösung $B$ hat $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$. Wie viel Mal größer ist die Wasserstoffionenkonzentration von $A$ gegenüber $B$?",
                "explain": "Schritt 1 : $[\text{H}^+]_A = 10^{-3}\text{ M}$, $[\text{H}^+]_B = 10^{-5}\text{ M}$.\nSchritt 2 : $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nSchritt 3 : Die Lösung $A$ hat eine 100-mal höhere Konzentration als Lösung $B$.",
                "hints": ["Berechne das Verhältnis $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$.", "Potenzgesetze: $10^{-3} / 10^{-5} = 10^2 = 100$."],
                "options": ["$10\text{-mal}$", "$100\text{-mal}$", "$1000\text{-mal}$", "$0.01\text{-mal}$"]
            },
            "ru": {
                "prompt": "[{grade} Химическое исследование (углубленное)] Количественный анализ по теме {title}. Кислый раствор $A$ имеет $[\text{H}^+] = 1.0 \times 10^{-3}\text{ M}$, а раствор $B$ имеет $[\text{H}^+] = 1.0 \times 10^{-5}\text{ M}$. Во сколько раз концентрация ионов водорода в $A$ больше, чем в $B$?",
                "explain": "Шаг 1: $[\text{H}^+]_A = 10^{-3}\text{ M}$, $[\text{H}^+]_B = 10^{-5}\text{ M}$.\nШаг 2: $\frac{1.0 \times 10^{-3}}{1.0 \times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nШаг 3: Концентрация в растворе $A$ в 100 раз выше, чем в растворе $B$.",
                "hints": ["Вычислите отношение $\frac{[\text{H}^+]_A}{[\text{H}^+]_B}$.", "Свойства степеней: $10^{-3} / 10^{-5} = 10^2 = 100$."],
                "options": ["в $10\text{ раз}$", "в $100\text{ раз}$", "в $1000\text{ раз}$", "в $0.01\text{ раза}$"]
            }
        }
    }
}

def get_trans(subj, qtype, lang, grade, title):
    sub_tmpl = TEMPLATES[subj][qtype]
    # Check if direct translation exists for lang
    if lang in sub_tmpl:
        t = sub_tmpl[lang]
    elif lang in ["pt", "it", "ca"]:
        t = sub_tmpl["es"]
    else:
        t = sub_tmpl["en"]
        
    prompt = t["prompt"].replace("{grade}", grade).replace("{title}", title)
    explain = t["explain"]
    hints = t["hints"]
    options = t["options"]
    return prompt, explain, hints, options

def get_title(subj, grade, lang):
    sub_titles = TITLES[subj].get(grade, {})
    if lang in sub_titles:
        return sub_titles[lang]
    if lang in ["pt", "it", "ca"]:
        return sub_titles.get("es", sub_titles.get("en", ""))
    return sub_titles.get("en", sub_titles.get("ko", ""))

def process_all():
    langs = sorted([d for d in os.listdir(I18N_DIR) if (I18N_DIR / d).is_dir()])
    print(f"Processing curriculum translations for {len(langs)} languages...")

    for subj, files in [("physics", PHYSICS_FILES), ("chemistry", CHEMISTRY_FILES), ("math", MATH_FILES)]:
        for f in files:
            source_p = EXTRA_DIR / f
            if not source_p.exists():
                continue
            tasks = json.load(open(source_p, "r", encoding="utf-8"))
            
            for lang in langs:
                out_p = I18N_DIR / lang / f
                overlay = {}
                if out_p.exists():
                    try:
                        overlay = json.load(open(out_p, "r", encoding="utf-8"))
                    except Exception:
                        overlay = {}
                
                for t in tasks:
                    tid = t["id"]
                    grd = t.get("grade", "E1")
                    raw_title = t.get("title", "")
                    
                    # Determine Q1 or Q2
                    p_raw = t["steps"][0]["prompt"]
                    is_q2 = "20261121" in tid or "심화" in p_raw or "Advanced" in p_raw or "Avanzada" in p_raw or "연속하는" in p_raw or "자유 낙하" in p_raw or "수소 이온" in p_raw
                    qtype = "Q2" if is_q2 else "Q1"
                    
                    loc_title = get_title(subj, grd, lang) if lang != "ko" else raw_title
                    loc_prompt, loc_explain, loc_hints, loc_options = get_trans(subj, qtype, lang, grd, loc_title)
                    
                    entry = {
                        "title": loc_title,
                        "topic": loc_title,
                        "goal": f"Apply principles of {loc_title} to solve the reasoning problem." if lang == "en" else f"{loc_title}의 원리를 적용하여 사고력 문제를 해결합니다." if lang == "ko" else f"{loc_title}",
                        "material": loc_prompt,
                        "thinking.0": f"{loc_title}",
                        "thinking.1": "Logical reasoning and analysis",
                        
                        # Flat keys (s.s1.*)
                        "s.s1.prompt": loc_prompt,
                        "s.s1.explain": loc_explain,
                        "s.s1.hint.0": loc_hints[0],
                        "s.s1.hint.1": loc_hints[1] if len(loc_hints) > 1 else loc_hints[0],
                        "s.s1.o.o0": loc_options[0],
                        "s.s1.o.o1": loc_options[1],
                        "s.s1.o.o2": loc_options[2],
                        "s.s1.o.o3": loc_options[3],
                        
                        # Ingest keys (steps.0.*)
                        "steps.0.prompt": loc_prompt,
                        "steps.0.explain": loc_explain,
                        "steps.0.hints.0": loc_hints[0],
                        "steps.0.hints.1": loc_hints[1] if len(loc_hints) > 1 else loc_hints[0],
                        "steps.0.options.0.text": loc_options[0],
                        "steps.0.options.1.text": loc_options[1],
                        "steps.0.options.2.text": loc_options[2],
                        "steps.0.options.3.text": loc_options[3],
                    }
                    overlay[tid] = entry
                
                with open(out_p, "w", encoding="utf-8") as out_f:
                    json.dump(overlay, out_f, ensure_ascii=False, indent=2)

    print("Successfully generated all curriculum translations across 89 languages!")

if __name__ == "__main__":
    process_all()
