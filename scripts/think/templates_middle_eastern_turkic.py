# -*- coding: utf-8 -*-
"""
Curriculum templates for Middle Eastern and Turkic/Central Asian languages:
ar, arz, fa, he, tr, az, uz, kk, tg, mn, ps, ku
"""

TEMPLATES_GROUP_3 = {
    "tr": {
        "math_Q1": {
            "prompt": "[{grade} Matematiksel Araştırma] {title} ile ilgili araştırma sorusu. $A + 2B = 24$ eşitliğini sağlayan iki doğal sayı $A$ ve $B$ verildiğinde, $A$ mümkün olan en büyük değerini aldığında $B$'nin değeri kaçtır?",
            "explain": "1. Adım: Denklemi düzenlersek $A = 24 - 2B$ olur.\n2. Adım: $A, B \\ge 1$ doğal sayılar olduğundan, $A$'nın en büyük olması için $2B$ en küçük olmalıdır.\n3. Adım: En küçük doğal sayı $B = 1$'dir.\n4. Adım: Bu durumda $A = 24 - 2(1) = 22$ (maksimum) olur, dolayısıyla $B = 1$'dir.",
            "hints": ["$B$ için en küçük doğal sayı değeri $1$'dir.", "$A = 24 - 2B$ olduğundan, $B$ en küçük olduğunda $A$ en büyük olur."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematiksel Araştırma (İleri Düzey)] {title} konusunu kullanan kapsamlı araştırma sorusu. Ardışık üç doğal sayının toplamı $3S$'dir ve en küçük ile en büyük sayının çarpımının $1$ fazlası $T^2$'ye eşittir. $S = 15$ olduğunda, bu üç sayıdan en büyüğü kaçtır?",
            "explain": "1. Adım: Sayıları $n-1, n, n+1$ olarak yazarsak toplamları $3n = 3S \\Rightarrow n = S = 15$ olur.\n2. Adım: Sayılar $14, 15, 16$'dır.\n3. Adım: En büyük sayı $16$'dır.\n4. Adım: Kontrol: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Ardışık sayıları $n-1, n, n+1$ olarak göstermek toplamı $3n$ yapar.", "Ortadaki sayı $n = S = 15$'tir."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fiziksel Araştırma] {title} ilkelerini uygulayan araştırma problemi. Sürtünmesiz yatay bir düzlemde, kütlesi $m = 2\\text{ kg}$ olan bir cisme sabit $F = 10\\text{ N}$'luk yatay bir kuvvet $4\\text{ m}$ boyunca uygulanıyor. Yapılan iş $W$ ve ivme $a$ hakkında hangi ifade doğrudur?",
            "explain": "1. Adım: Newton'un ikinci yasası $F = ma$ gereğince $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$'dir.\n2. Adım: Yapılan iş $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$'dür.\n3. Adım: Dolayısıyla ivme $5\\text{ m/s}^2$ ve yapılan iş $40\\text{ J}$'dür.",
            "hints": ["Newton'un ikinci yasası: $F = ma$ formülünü kullanın.", "İşin tanımı: $W = F \\times s$ formülünü kullanın."],
            "options": [
                "İvme $5\\text{ m/s}^2$ ve yapılan iş $40\\text{ J}$'dür.",
                "İvme $2\\text{ m/s}^2$ ve yapılan iş $20\\text{ J}$'dür.",
                "İvme $10\\text{ m/s}^2$ ve yapılan iş $40\\text{ J}$'dür.",
                "İvme $5\\text{ m/s}^2$ ve yapılan iş $20\\text{ J}$'dür."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fiziksel Araştırma (İleri Düzey)] {title} konusunu analiz eden mekanik problemi. Kütlesi $m = 1\\text{ kg}$ olan bir cisim $h = 20\\text{ m}$ yükseklikten serbest düşmeye bırakılıyor ($g = 9.8\\text{ m/s}^2$, hava direncini ihmal ediniz). Mekanik enerjinin korunumu ve son hız $v$ hakkında hangi ifade doğrudur?",
            "explain": "1. Adım: Hava direnci olmadığından düşüş boyunca mekanik enerji korunur.\n2. Adım: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3. Adım: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Mekanik enerjinin korunumu: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mekanik enerji korunur ve çarpmadan hemen önceki hız yaklaşık $19.8\\text{ m/s}$'dir.",
                "Mekanik enerji azalır ve çarpmadan hemen önceki hız yaklaşık $9.8\\text{ m/s}$'dir.",
                "Yalnızca potansiyel enerji korunur ve kinetik enerji sıfırdır.",
                "Yerçekimi ivmesi zamanla değiştiğinden hız hesaplanamaz."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kimyasal Araştırma] {title} ile ilgili araştırma problemi. $25^\\circ\\text{C}$ ve $1\\text{ atm}$ koşullarında bir gazın molar hacmi $24.5\\text{ L/mol}$'dür. Aynı koşullarda bu gazın $0.2\\text{ mol}$'ünün hacmi kaç $\\text{L}$'dir?",
            "explain": "1. Adım: Avogadro yasasına göre gaz hacmi $V$, mol sayısı $n$ ile doğru orantılıdır.\n2. Adım: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n3. Adım: Hesaplama $V = 4.90\\text{ L}$ verir.",
            "hints": ["Sabit T ve P'de hacim mol sayısı ile doğru orantılıdır.", "$V = n \\times V_m$ formülünü hesaplayın."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kimyasal Araştırma (İleri Düzey)] {title} üzerine nicel analiz problemi. Asidik çözelti $A$'nın hidrojen iyonu derişimi $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ ve çözelti $B$'ninki $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$'dir. $A$'nın hidrojen iyonu derişimi $B$'ninkinden kaç kat fazladır?",
            "explain": "1. Adım: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2. Adım: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3. Adım: Çözelti $A$, çözelti $B$'den 100 kat daha yüksek $[\\text{H}^+]$ derişimine sahiptir.",
            "hints": ["$\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ oranını hesaplayın.", "Üs kuralları: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ kat}$", "$100\\text{ kat}$", "$1000\\text{ kat}$", "$0.01\\text{ kat}$"]
        },
        "thinking1": "Mantıksal akıl yürütme ve analiz",
        "goal": "Araştırma problemini çözmek için {title} ilkelerini uygulayın."
    },
    "az": {
        "math_Q1": {
            "prompt": "[{grade} Riyazi Araşdırma] {title} mövzusuna aid araşdırma sualı. $A + 2B = 24$ bərabərliyini ödəyən iki natural ədəd $A$ və $B$ verildikdə, $A$ mümkün olan ən böyük qiymətini aldıqda $B$-nin qiyməti neçə olar?",
            "explain": "Addım 1: Tənliyi çevirsək, $A = 24 - 2B$ alarıq.\nAddım 2: $A, B \\ge 1$ natural ədədlər olduğundan, $A$-nın maksimum olması üçün $2B$ minimum olmalıdır.\nAddım 3: Ən kiçik natural ədəd $B = 1$-dir.\nAddım 4: Bu halda $A = 24 - 2(1) = 22$ (maksimum), deməli $B = 1$-dir.",
            "hints": ["$B$ üçün ən kiçik natural ədəd $1$-dir.", "$A = 24 - 2B$ olduğuna görə, $B$ ən kiçik olduqda $A$ ən böyük olur."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Riyazi Araşdırma (Dərinləşdirilmiş)] {title} mövzusundan istifadə edən mürəkkəb araşdırma tapşırığı. Üç ardıcıl natural ədədin cəmi $3S$-dir, ən kiçiyi ilə ən böyüyünün hasilinin $1$ artığı isə $T^2$-na bərabərdir. $S = 15$ olduqda, bu üç ədədin ən böyüyü neçədir?",
            "explain": "Addım 1: Ədədləri $n-1, n, n+1$ kimi göstərsək, onların cəmi $3n = 3S \\Rightarrow n = S = 15$ olar.\nAddım 2: Ədədlər $14, 15, 16$-dır.\nAddım 3: Ən böyük ədəd $16$-dır.\nAddım 4: Yoxlama: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Ardıcıl ədədləri $n-1, n, n+1$ kimi qəbul etmək $3n$ cəmini verir.", "Orta ədəd $n = S = 15$-dir."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fiziki Araşdırma] {title} prinsiplərini tətbiq edən araşdırma məsələsi. Sürtünməsiz üfüqi səthdə kütləsi $m = 2\\text{ kq}$ olan cismə $4\\text{ m}$ məsafədə sabit $F = 10\\text{ N}$ üfüqi qüvvə təsir edir. Görülən iş $W$ və təcil $a$ haqqında hansı fikir doğrudur?",
            "explain": "Addım 1: Nyutonun ikinci qanununa görə $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kq}} = 5\\text{ m/s}^2$.\nAddım 2: Görülən iş $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ C}$.\nAddım 3: Beləliklə, təcil $5\\text{ m/s}^2$, görülən iş isə $40\\text{ C}$-dur.",
            "hints": ["Nyutonun ikinci qanunu: $F = ma$ düsturundan istifadə edin.", "İşin tərifi: $W = F \\times s$ düsturundan istifadə edin."],
            "options": [
                "Təcil $5\\text{ m/s}^2$, görülən iş $40\\text{ C}$-dur.",
                "Təcil $2\\text{ m/s}^2$, görülən iş $20\\text{ C}$-dur.",
                "Təcil $10\\text{ m/s}^2$, görülən iş $40\\text{ C}$-dur.",
                "Təcil $5\\text{ m/s}^2$, görülən iş $20\\text{ C}$-dur."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fiziki Araşdırma (Dərinləşdirilmiş)] {title} mövzusunu təhlil edən mexanika məsələsi. Kütləsi $m = 1\\text{ kq}$ olan cisim $h = 20\\text{ m}$ hündürlükdən sərbəst düşür ($g = 9.8\\text{ m/s}^2$, hava müqavimətini nəzərə almayın). Mexaniki enerjinin saxlanması və son sürət $v$ haqqında hansı fikir doğrudur?",
            "explain": "Addım 1: Hava müqaviməti olmadıqda mexaniki enerji düşmə boyu saxlanılır.\nAddım 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nAddım 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Mexaniki enerjinin saxlanması qanunu: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mexaniki enerji saxlanılır və yerə dəymə anındakı sürət təxminən $19.8\\text{ m/s}$-dir.",
                "Mexaniki enerji azalır və yerə dəymə anındakı sürət təxminən $9.8\\text{ m/s}$-dir.",
                "Yalnız potensial enerji saxlanılır, kinetik enerji isə sıfırdır.",
                "Qravitasiya təcili zamanla dəyişdiyi üçün sürəti hesablamaq mümkün deyil."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kimyəvi Araşdırma] {title} mövzusuna aid araşdırma məsələsi. $25^\\circ\\text{C}$ və $1\\text{ atm}$ şəraitində qazın molyar həcmi $24.5\\text{ L/mol}$-dur. Eyni şəraitdə bu qazın $0.2\\text{ mol}$-unun həcmi neçə $\\text{L}$-dir?",
            "explain": "Addım 1: Avoqadro qanununa görə qazın həcmi $V$ maddə miqdarı $n$ ilə düz mütənasibdir.\nAddım 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nAddım 3: Hesablama $V = 4.90\\text{ L}$ verir.",
            "hints": ["Sabit T və P şəraitində həcm mol miqdarı ilə düz mütənasibdir.", "$V = n \\times V_m$ düsturunu hesablayın."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kimyəvi Araşdırma (Dərinləşdirilmiş)] {title} üzrə kəmiyyət təhlili məsələsi. Turş məhlul $A$-nın hidrogen ionu qatılığı $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, məhlul $B$-ninki isə $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$-dir. $A$-nın hidrogen ionu qatılığı $B$-dən neçə dəfə çoxdur?",
            "explain": "Addım 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nAddım 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nAddım 3: $A$ məhlulunun qatılığı $B$ məhlulundan 100 dəfə yüksəkdir.",
            "hints": ["$\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ nisbətini hesablayın.", "Qüvvət qaydaları: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ dəfə}$", "$100\\text{ dəfə}$", "$1000\\text{ dəfə}$", "$0.01\\text{ dəfə}$"]
        },
        "thinking1": "Məntiqi mühakimə və təhlil",
        "goal": "Araşdırma məsələsini həll etmək üçün {title} prinsiplərini tətbiq edin."
    },
    "uz": {
        "math_Q1": {
            "prompt": "[{grade} Matematik Tadqiqot] {title} bo'yicha tadqiqot savoli. $A + 2B = 24$ tenglamasini qanoatlantiruvchi ikkita natural son $A$ va $B$ berilgan bo'lsin. $A$ eng katta mumkin bo'lgan qiymatni qabul qilganda, $B$ ning qiymati nechaga teng bo'ladi?",
            "explain": "1-qadam: Tenglamani o'zgartirsak, $A = 24 - 2B$ bo'ladi.\n2-qadam: $A, B \\ge 1$ natural sonlar bo'lgani uchun, $A$ maksimal bo'lishi uchun $2B$ minimal bo'lishi kerak.\n3-qadam: Eng kichik natural son $B = 1$.\n4-qadam: Bu nuqtada $A = 24 - 2(1) = 22$ (maksimal), demak $B = 1$.",
            "hints": ["$B$ uchun eng kichik natural son qiymati $1$.", "$A = 24 - 2B$ bo'lganligi sababli, $B$ eng kichik bo'lganda $A$ eng katta bo'ladi."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematik Tadqiqot (Kengaytirilgan)] {title} mavzusidan foydalangan holda murakkab tadqiqot masalasi. Uchta ketma-ket natural sonning yig'indisi $3S$, eng kichigi va eng kattasining ko'paytmasiga $1$ qo'shilganda $T^2$ ga teng. $S = 15$ bo'lsa, bu uch sondan eng kattasi nechaga teng?",
            "explain": "1-qadam: Sonlarni $n-1, n, n+1$ deb belgilasak, ularning yig'indisi $3n = 3S \\Rightarrow n = S = 15$.\n2-qadam: Sonlar $14, 15, 16$.\n3-qadam: Eng katta son $16$.\n4-qadam: Tekshirish: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Ketma-ket sonlarni $n-1, n, n+1$ deb ifodalash yig'indini $3n$ qiladi.", "O'rtadagi son $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fizik Tadqiqot] {title} tamoyillarini qo'llovchi tadqiqot masalasi. Ishqalanishsiz gorizontal sirtda massasi $m = 2\\text{ kg}$ bo'lgan jismga $4\\text{ m}$ masofada o'zgarmas $F = 10\\text{ N}$ gorizontal kuch ta'sir qiladi. Bajarilgan ish $W$ va tezlanish $a$ haqida qaysi fikr to'g'ri?",
            "explain": "1-qadam: Nyutonning ikkinchi qonuniga ko'ra $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\n2-qadam: Bajarilgan ish $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\n3-qadam: Shunday qilib, tezlanish $5\\text{ m/s}^2$ va bajarilgan ish $40\\text{ J}$.",
            "hints": ["Nyutonning ikkinchi qonuni: $F = ma$ formulasidan foydalaning.", "Ish ta'rifi: $W = F \\times s$ formulasidan foydalaning."],
            "options": [
                "Tezlanish $5\\text{ m/s}^2$ va bajarilgan ish $40\\text{ J}$.",
                "Tezlanish $2\\text{ m/s}^2$ va bajarilgan ish $20\\text{ J}$.",
                "Tezlanish $10\\text{ m/s}^2$ va bajarilgan ish $40\\text{ J}$.",
                "Tezlanish $5\\text{ m/s}^2$ va bajarilgan ish $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fizik Tadqiqot (Kengaytirilgan)] {title} tahliliga oid mexanika masalasi. Massasi $m = 1\\text{ kg}$ bo'lgan jism $h = 20\\text{ m}$ balandlikdan boshlang'ich tezliksiz erkin tushmoqda ($g = 9.8\\text{ m/s}^2$, havo qarshiligini hisobga olmang). Mexanik energiyaning saqlanishi va oxirgi tezlik $v$ haqida qaysi fikr to'g'ri?",
            "explain": "1-qadam: Havo qarshiligi bo'lmaganda mexanik energiya tushish davomida saqlanadi.\n2-qadam: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3-qadam: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Mexanik energiyaning saqlanish qonuni: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mexanik energiya saqlanadi va urilishdan oldingi tezlik taxminan $19.8\\text{ m/s}$.",
                "Mexanik energiya kamayadi va urilishdan oldingi tezlik taxminan $9.8\\text{ m/s}$.",
                "Faqat potensial energiya saqlanadi, kinetik energiya nolga teng.",
                "Erkin tushish tezlanishi vaqt o'tishi bilan o'zgaradi, shuning uchun tezlikni hisoblab bo'lmaydi."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kimyoviy Tadqiqot] {title} bo'yicha tadqiqot masalasi. $25^\\circ\\text{C}$ va $1\\text{ atm}$ sharoitda gazning molyar hajmi $24.5\\text{ L/mol}$. Xuddi shu sharoitda bu gazning $0.2\\text{ mol}$ qismi necha $\\text{L}$ hajm egallaydi?",
            "explain": "1-qadam: Avogadro qonuniga ko'ra gaz hajmi $V$ modda miqdori $n$ ga to'g'ri mutanosib.\n2-qadam: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n3-qadam: Hisoblash $V = 4.90\\text{ L}$ natijasini beradi.",
            "hints": ["O'zgarmas T va P da hajm modda miqdoriga to'g'ri mutanosib.", "$V = n \\times V_m$ formulasini hisoblang."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kimyoviy Tadqiqot (Kengaytirilgan)] {title} bo'yicha miqdoriy tahlil masalasi. Kislotali eritma $A$ ning vodorod ionlari konsentratsiyasi $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, eritma $B$ niki esa $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. $A$ eritmasidagi vodorod ionlari konsentratsiyasi $B$ eritmasidagidan necha marta ko'p?",
            "explain": "1-qadam: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2-qadam: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3-qadam: $A$ eritmasidagi konsentratsiya $B$ eritmasidagiga qaraganda 100 marta yuqori.",
            "hints": ["$\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ nisbatini hisoblang.", "Daraja qoidalari: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ marta}$", "$100\\text{ marta}$", "$1000\\text{ marta}$", "$0.01\\text{ marta}$"]
        },
        "thinking1": "Mantiqiy fikrlash va tahlil",
        "goal": "Tadqiqot masalasini yechish uchun {title} tamoyillarini qo'llang."
    },
    "kk": {
        "math_Q1": {
            "prompt": "[{grade} Математикалық Зерттеу] {title} тақырыбы бойынша зерттеу сұрағы. $A + 2B = 24$ теңдеуін қанағаттандыратын екі натурал $A$ және $B$ саны берілгенде, $A$ өзінің ең үлкен мәнін қабылдаған кезде $B$-нің мәні қандай болады?",
            "explain": "1-қадам: Теңдеуді өрнектесек: $A = 24 - 2B$.\n2-қадам: $A, B \\ge 1$ натурал сандар болғандықтан, $A$ максимал болуы үшін $2B$ минимал болуы керек.\n3-қадам: Ең кіші натурал сан $B = 1$.\n4-қадам: Осы нүктеде $A = 24 - 2(1) = 22$ (максимум), сондықтан $B = 1$.",
            "hints": ["$B$ үшін ең кіші натурал мән $1$-ге тең.", "$A = 24 - 2B$ болғандықтан, $B$ ең кіші болғанда $A$ ең үлкен болады."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Математикалық Зерттеу (Тереңдетілген)] {title} тақырыбын қолданатын кешенді зерттеу есебі. Үш тізбектес натурал санның қосындысы $3S$, ал ең кішісі мен ең үлкенінің көбейтіндісіне $1$-ді қосқанда $T^2$-қа тең болады. Егер $S = 15$ болса, осы үш санның ең үлкені нешеге тең?",
            "explain": "1-қадам: Сандарды $n-1, n, n+1$ деп белгілесек, олардың қосындысы $3n = 3S \\Rightarrow n = S = 15$.\n2-қадам: Сандар: $14, 15, 16$.\n3-қадам: Ең үлкен сан — $16$.\n4-қадам: Тексеру: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Тізбектес сандарды $n-1, n, n+1$ ретінде жазу $3n$ қосындысын береді.", "Ортаңғы сан $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Физикалық Зерттеу] {title} қағидаларын қолданатын зерттеу есебі. Үйкеліссіз көлденең бетте массасы $m = 2\\text{ кг}$ денеге $4\\text{ м}$ арақашықтықта тұрақты $F = 10\\text{ Н}$ көлденең күш әсер етеді. Атқарылған жұмыс $W$ және үдеу $a$ туралы қай тұжырым дұрыс?",
            "explain": "1-қадам: Ньютонның екінші заңы бойынша $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ Н}}{2\\text{ кг}} = 5\\text{ м/с}^2$.\n2-қадам: Атқарылған жұмыс $W = F \\cdot s = 10\\text{ Н} \\times 4\\text{ м} = 40\\text{ Дж}$.\n3-қадам: Демек, үдеу $5\\text{ м/с}^2$, ал атқарылған жұмыс $40\\text{ Дж}$.",
            "hints": ["Ньютонның екінші заңы: $F = ma$ формуласын қолданыңыз.", "Жұмыс анықтамасы: $W = F \\times s$ формуласын қолданыңыз."],
            "options": [
                "Үдеу $5\\text{ м/с}^2$, ал атқарылған жұмыс $40\\text{ Дж}$.",
                "Үдеу $2\\text{ м/с}^2$, ал атқарылған жұмыс $20\\text{ Дж}$.",
                "Үдеу $10\\text{ м/с}^2$, ал атқарылған жұмыс $40\\text{ Дж}$.",
                "Үдеу $5\\text{ м/с}^2$, ал атқарылған жұмыс $20\\text{ Дж}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Физикалық Зерттеу (Тереңдетілген)] {title} талдауына арналған механика есебі. Массасы $m = 1\\text{ кг}$ дене $h = 20\\text{ м}$ биіктіктен бастапқы жылдамдықсыз еркін құлайды ($g = 9.8\\text{ м/с}^2$, ауа кедергісі ескерілмейді). Механикалық энергияның сақталуы және соңғы жылдамдық $v$ туралы қай тұжырым дұрыс?",
            "explain": "1-қадам: Ауа кедергісі болмаған кезде құлау барысында механикалық энергия сақталады.\n2-қадам: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3-қадам: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ м/с}$.",
            "hints": ["Механикалық энергияның сақталу заңы: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ м/с}$."],
            "options": [
                "Механикалық энергия сақталады және жерге жетер алдындағы жылдамдық шамамен $19.8\\text{ м/с}$.",
                "Механикалық энергия азаяды және жерге жетер алдындағы жылдамдық шамамен $9.8\\text{ м/с}$.",
                "Тек потенциалдық энергия сақталады, кинетикалық энергия нөлге тең.",
                "Еркін түсу үдеуі уақыт бойынша өзгеретіндіктен, жылдамдықты есептеу мүмкін емес."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Химиялық Зерттеу] {title} тақырыбы бойынша зерттеу есебі. $25^\\circ\\text{C}$ температура мен $1\\text{ атм}$ қысымда газдың молярлық көлемі $24.5\\text{ л/моль}$ құрайды. Осы жағдайда осы газдың $0.2\\text{ моль}$ мөлшері қанша $\\text{л}$ көлем алады?",
            "explain": "1-қадам: Авогадро заңы бойынша газ көлемі $V$ зат мөлшері $n$-ге тура пропорционал.\n2-қадам: $V = n \\times V_m = 0.2\\text{ моль} \\times 24.5\\text{ л/моль}$.\n3-қадам: Есептеу нәтижесі $V = 4.90\\text{ л}$.",
            "hints": ["Тұрақты T мен P кезінде көлем моль санына пропорционал.", "$V = n \\times V_m$ формуласын есептеңіз."],
            "options": ["$2.45\\text{ л}$", "$4.90\\text{ л}$", "$9.80\\text{ л}$", "$12.25\\text{ л}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Химиялық Зерттеу (Тереңдетілген)] {title} бойынша сандық талдау есебі. Қышқылды ерітінді $A$-ның сутек иондары концентрациясы $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, ал ерітінді $B$-нікі $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. $A$ ерітіндісіндегі сутек иондары концентрациясы $B$-ге қарағанда неше есе жоғары?",
            "explain": "1-қадам: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2-қадам: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3-қадам: $A$ ерітіндісінің концентрациясы $B$ ерітіндісінен 100 есе жоғары.",
            "hints": ["$\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ қатынасын есептеңіз.", "Дәреже ережелері: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ есе}$", "$100\\text{ есе}$", "$1000\\text{ есе}$", "$0.01\\text{ есе}$"]
        },
        "thinking1": "Логикалық пайымдау және талдау",
        "goal": "Зерттеу есебін шешу үшін {title} қағидаларын қолданыңыз."
    },
    "tg": {
        "math_Q1": {
            "prompt": "[{grade} Таҳқиқоти Риёзӣ] Саволи таҳқиқотӣ оид ба мавзӯи {title}. Агар барои ду адади натуралии $A$ ва $B$ баробарии $A + 2B = 24$ иҷро шавад, вақте ки $A$ қимати калонтарини имконпазирро мегирад, қимати $B$ ба чанд баробар аст?",
            "explain": "Қадами 1: Муодиларо табдил медиҳем: $A = 24 - 2B$.\nҚадами 2: Азбаски $A, B \\ge 1$ ададҳои натуралӣ мебошанд, барои максималӣ шудани $A$ бояд $2B$ минималӣ бошад.\nҚадами 3: Хурдтарин адади натуралӣ $B = 1$ аст.\nҚадами 4: Дар ин нуқта $A = 24 - 2(1) = 22$ (максимум), бинобар ин $B = 1$.",
            "hints": ["Хурдтарин қимати адади натуралӣ барои $B$ ин $1$ мебошад.", "Азбаски $A = 24 - 2B$, вақте ки $B$ хурдтарин бошад, $A$ калонтарин мешавад."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Таҳқиқоти Риёзӣ (Пешрафта)] Масъалаи мураккаби таҳқиқотӣ бо истифодаи мавзӯи {title}. Ҳосили ҷамъи се адади натуралии пайдарпай ба $3S$ ва ҳосили зарби хурдтарин ва калонтаринашон ҷамъи $1$ ба $T^2$ баробар аст. Агар $S = 15$ бошад, калонтарини ин се адад чанд аст?",
            "explain": "Қадами 1: Ададҳоро $n-1, n, n+1$ ифода кунем, ҳосили ҷамъашон $3n = 3S \\Rightarrow n = S = 15$.\nҚадами 2: Ададҳо $14, 15, 16$ мебошанд.\nҚадами 3: Калонтарин адад $16$ мебошад.\nҚадами 4: Санҷиш: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Ифодаи ададҳои пайдарпай ҳамчун $n-1, n, n+1$ ҷамъи $3n$-ро медиҳад.", "Адади мобайнӣ $n = S = 15$ мебошад."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Таҳқиқоти Физикӣ] Масъалаи таҳқиқотӣ бо татбиқи принсипҳои {title}. Дар сатҳи уфуқии бе соиш ба ҷисми массааш $m = 2\\text{ кг}$ қувваи доимии уфуқии $F = 10\\text{ Н}$ дар масофаи $4\\text{ м}$ таъсир мекунад. Кадом фикр кори иҷрошудаи $W$ ва шитоби $a$-ро дуруст тавсиф мекунад?",
            "explain": "Қадами 1: Аз рӯи қонуни дуюми Нютон $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ Н}}{2\\text{ кг}} = 5\\text{ м/с}^2$.\nҚадами 2: Кори иҷрошуда $W = F \\cdot s = 10\\text{ Н} \\times 4\\text{ м} = 40\\text{ Ҷ}$.\nҚадами 3: Бинобар ин, шитоб $5\\text{ м/с}^2$ ва кори иҷрошуда $40\\text{ Ҷ}$ мебошад.",
            "hints": ["Қонуни дуюми Нютон: формулаи $F = ma$-ро истифода баред.", "Таърифи кор: формулаи $W = F \\times s$-ро истифода баред."],
            "options": [
                "Шитоб $5\\text{ м/с}^2$ ва кори иҷрошуда $40\\text{ Ҷ}$ аст.",
                "Шитоб $2\\text{ м/с}^2$ ва кори иҷрошуда $20\\text{ Ҷ}$ аст.",
                "Шитоб $10\\text{ м/с}^2$ ва кори иҷрошуда $40\\text{ Ҷ}$ аст.",
                "Шитоб $5\\text{ м/с}^2$ ва кори иҷрошуда $20\\text{ Ҷ}$ аст."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Таҳқиқоти Физикӣ (Пешрафта)] Масъалаи механикӣ барои таҳлили {title}. Ҷисми массааш $m = 1\\text{ кг}$ аз ҳолати оромӣ аз баландии $h = 20\\text{ м}$ озодона меафтад ($g = 9.8\\text{ м/с}^2$, муқовимати ҳаво ба назар гирифта нашавад). Кадом фикр дар бораи нигоҳдории энергияи механикӣ ва суръати ниҳоӣ $v$ дуруст аст?",
            "explain": "Қадами 1: Бе муқовимати ҳаво энергияи механикӣ дар давоми афтиш нигоҳ дошта мешавад.\nҚадами 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nҚадами 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ м/с}$.",
            "hints": ["Қонуни нигоҳдории энергияи механикӣ: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ м/с}$."],
            "options": [
                "Энергияи механикӣ нигоҳ дошта мешавад ва суръат пеш аз бархӯрд тақрибан $19.8\\text{ м/с}$ аст.",
                "Энергияи механикӣ кам мешавад ва суръат пеш аз бархӯрд тақрибан $9.8\\text{ м/с}$ аст.",
                "Танҳо энергияи потенсиалӣ нигоҳ дошта мешавад ва энергияи кинетикӣ ба сифр баробар аст.",
                "Шитоби афтиши озод бо мурури замон тағйир меёбад, бинобар ин суръатро ҳисоб кардан мумкин нест."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Таҳқиқоти Химиявӣ] Масъалаи таҳқиқотӣ оид ба мавзӯи {title}. Дар ҳарорати $25^\\circ\\text{C}$ ва фишори $1\\text{ атм}$ ҳаҷми молярии газ $24.5\\text{ л/мол}$ аст. Дар чунин шароит ҳаҷми $0.2\\text{ мол}$ аз ин газ ба чанд $\\text{л}$ баробар аст?",
            "explain": "Қадами 1: Мувофиқи қонуни Авогадро ҳаҷми газ $V$ ба миқдори модда $n$ мутаносиби рост аст.\nҚадами 2: $V = n \\times V_m = 0.2\\text{ мол} \\times 24.5\\text{ л/мол}$.\nҚадами 3: Ҳисобкунӣ $V = 4.90\\text{ л}$-ро медиҳад.",
            "hints": ["Дар T ва P доимӣ ҳаҷм ба миқдори молҳо мутаносиби рост аст.", "$V = n \\times V_m$-ро ҳисоб кунед."],
            "options": ["$2.45\\text{ л}$", "$4.90\\text{ л}$", "$9.80\\text{ л}$", "$12.25\\text{ л}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Таҳқиқоти Химиявӣ (Пешрафта)] Таҳлили миқдорӣ оид ба мавзӯи {title}. Маҳлули турши $A$ консентратсияи ионҳои гидроген $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ ва маҳлули $B$ $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$ дорад. Консентратсияи ионҳои гидроген дар маҳлули $A$ нисбат ба $B$ чанд маротиба зиёдтар аст?",
            "explain": "Қадами 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nҚадами 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nҚадами 3: Консентратсия дар маҳлули $A$ назар ба маҳлули $B$ 100 маротиба баландтар аст.",
            "hints": ["Таносуби $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$-ро ҳисоб кунед.", "Қоидаҳои дараҷаҳо: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ маротиба}$", "$100\\text{ маротиба}$", "$1000\\text{ маротиба}$", "$0.01\\text{ маротиба}$"]
        },
        "thinking1": "Мулоҳизаи мантиқӣ ва таҳлил",
        "goal": "Барои ҳалли масъалаи таҳқиқотӣ принсипҳои мавзӯи {title}-ро татбиқ кунед."
    },
    "mn": {
        "math_Q1": {
            "prompt": "[{grade} Математик Судалгаа] {title} сэдвийн судалгааны асуулт. $A + 2B = 24$ тэгшитгэлийг хангах натурал хоёр тоо $A$ ба $B$ өгөгдсөн үед $A$ хамгийн их утгаа авах үеийн $B$-ийн утга хэд вэ?",
            "explain": "1-р алхам: Тэгшитгэлийг хувиргавал $A = 24 - 2B$ болно.\n2-р алхам: $A, B \\ge 1$ нь натурал тоонууд тул $A$-г хамгийн их байлгахын тулд $2B$ хамгийн бага байх ёстой.\n3-р алхам: Хамгийн бага натурал тоо нь $B = 1$.\n4-р алхам: Энэ үед $A = 24 - 2(1) = 22$ (хамгийн их), иймд $B = 1$.",
            "hints": ["$B$-ийн хамгийн бага натурал утга нь $1$.", "$A = 24 - 2B$ тул $B$ хамгийн бага үед $A$ хамгийн их байна."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Математик Судалгаа (Гүнзгийрүүлсэн)] {title} сэдвийг ашигласан судалгааны бодлого. Дараалсан гурван натурал тооны нийлбэр $3S$ ба хамгийн бага болон хамгийн их тооны үржвэр дээр $1$-ийг нэмэхэд $T^2$-тай тэнцүү. $S = 15$ үед эдгээр гурван тооны хамгийн их нь хэд вэ?",
            "explain": "1-р алхам: Тоонуудыг $n-1, n, n+1$ гэж үзвэл нийлбэр нь $3n = 3S \\Rightarrow n = S = 15$.\n2-р алхам: Тоонууд нь $14, 15, 16$ болно.\n3-р алхам: Хамгийн их тоо нь $16$.\n4-р алхам: Шалгах: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Дараалсан тоонуудыг $n-1, n, n+1$ гэж тэмдэглэх нь нийлбэрийг $3n$ болгоно.", "Дундын тоо нь $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Физик Судалгаа] {title} сэдвийн зарчмыг хэрэглэх судалгааны бодлого. Үрэлтгүй хэвтээ гадаргуу дээр $m = 2\\text{ кг}$ масстай биед тогтмол $F = 10\\text{ Н}$ хэвтээ хүч $4\\text{ м}$ зайд үйлчилнэ. Гүйцэтгэсэн ажил $W$ ба хурдатгал $a$-ийн талаарх аль тодорхойлолт зөв бэ?",
            "explain": "1-р алхам: Ньютоны хоёрдугаар хуулиар $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ Н}}{2\\text{ кг}} = 5\\text{ м/с}^2$.\n2-р алхам: Гүйцэтгэсэн ажил $W = F \\cdot s = 10\\text{ Н} \\times 4\\text{ м} = 40\\text{ Ж}$.\n3-р алхам: Иймд хурдатгал нь $5\\text{ м/с}^2$, ажил нь $40\\text{ Ж}$ байна.",
            "hints": ["Ньютоны хоёрдугаар хууль: $F = ma$ томьёог ашиглана уу.", "Ажлын тодорхойлолт: $W = F \\times s$ томьёог ашиглана уу."],
            "options": [
                "Хурдатгал нь $5\\text{ м/с}^2$, ажил нь $40\\text{ Ж}$.",
                "Хурдатгал нь $2\\text{ м/с}^2$, ажил нь $20\\text{ Ж}$.",
                "Хурдатгал нь $10\\text{ м/с}^2$, ажил нь $40\\text{ Ж}$.",
                "Хурдатгал нь $5\\text{ м/с}^2$, ажил нь $20\\text{ Ж}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Физик Судалгаа (Гүнзгийрүүлсэн)] {title} сэдвийг шинжлэх механикийн бодлого. $m = 1\\text{ кг}$ масстай бие тайван байдлаас $h = 20\\text{ м}$ өндрөөс чөлөөтэй унана ($g = 9.8\\text{ м/с}^2$, агаарын эсэргүүцлийг тооцохгүй). Механик энерги хадгалагдах хууль болон эцсийн хурд $v$-ийн талаар аль нь зөв бэ?",
            "explain": "1-р алхам: Агаарын эсэргүүцэлгүй тул унах туршид механик энерги хадгалагдана.\n2-р алхам: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3-р алхам: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ м/с}$.",
            "hints": ["Механик энерги хадгалагдах хууль: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ м/с}$."],
            "options": [
                "Механик энерги хадгалагдах ба гадаргад хүрэхийн өмнөх хурд ойролцоогоор $19.8\\text{ м/с}$ байна.",
                "Механик энерги буурах ба гадаргад хүрэхийн өмнөх хурд ойролцоогоор $9.8\\text{ м/с}$ байна.",
                "Зөвхөн потенциал энерги хадгалагдаж, кинетик энерги тэг болно.",
                "Хүндийн хүчний хурдатгал хугацаанаас хамаарч өөрчлөгдөх тул хурдыг тооцоолох боломжгүй."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Химийн Судалгаа] {title} сэдвийн судалгааны бодлого. $25^\\circ\\text{C}$ ба $1\\text{ атм}$ нөхцөлд хийн молийн эзлэхүүн $24.5\\text{ л/моль}$ байдаг. Ижил нөхцөлд уг хийн $0.2\\text{ моль}$ нь хэдэн $\\text{л}$ эзлэхүүн эзлэх вэ?",
            "explain": "1-р алхам: Авогадрогийн хуулиар хийн эзлэхүүн $V$ нь бодисын тоо хэмжээ $n$-тэй шууд пропорционал.\n2-р алхам: $V = n \\times V_m = 0.2\\text{ моль} \\times 24.5\\text{ л/моль}$.\n3-р алхам: Тооцооллоор $V = 4.90\\text{ л}$ гарна.",
            "hints": ["Тогтмол T ба P үед эзлэхүүн нь молийн хэмжээнд шууд хамаарна.", "$V = n \\times V_m$-ийг тооцоол."],
            "options": ["$2.45\\text{ л}$", "$4.90\\text{ л}$", "$9.80\\text{ л}$", "$12.25\\text{ л}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Химийн Судалгаа (Гүнзгийрүүлсэн)] {title} сэдвийн тоон шинжилгээний бодлого. Хүчиллэг уусмал $A$-ийн устөрөгчийн ионы концентраци $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, уусмал $B$-ийнх $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$ байна. $A$ уусмал дахь концентраци $B$-ээс хэд дахин их вэ?",
            "explain": "1-р алхам: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2-р алхам: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3-р алхам: $A$ уусмалын концентраци $B$ уусмалаас 100 дахин өндөр байна.",
            "hints": ["$\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ харьцааг тооцоол.", "Зэргийн дүрэм: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ дахин}$", "$100\\text{ дахин}$", "$1000\\text{ дахин}$", "$0.01\\text{ дахин}$"]
        },
        "thinking1": "Логик дүгнэлт ба шинжилгээ",
        "goal": "Судалгааны бодлогыг бодохдоо {title} сэдвийн зарчмыг хэрэглэнэ."
    },
    "ar": {
        "math_Q1": {
            "prompt": "[{grade} استقصاء الرياضيات] سؤال استقصائي حول {title}. بالنظر إلى عددين طبيعيين $A$ و $B$ يحققان العلاقة $A + 2B = 24$، عندما يأخذ $A$ أكبر قيمة ممكنة له، ما هي قيمة $B$؟",
            "explain": "الخطوة 1: بإعادة ترتيب المعادلة نحصل على $A = 24 - 2B$.\nالخطوة 2: بما أن $A, B \\ge 1$ عددان طبيعيان، يجب تصغير $2B$ إلى أدنى حد لتعظيم $A$.\nالخطوة 3: أصغر عدد طبيعي هو $B = 1$.\nالخطوة 4: عند هذه النقطة، $A = 24 - 2(1) = 22$ (الحد الأقصى)، إذن $B = 1$.",
            "hints": ["أصغر قيمة لعدد طبيعي للمتغير $B$ هي $1$.", "بما أن $A = 24 - 2B$، فإن $A$ يبلغ أقصاه عندما يكون $B$ في أدنى قيمة له."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} استقصاء الرياضيات (متقدم)] مسألة استقصائية مركبة باستخدام {title}. مجموع ثلاثة أعداد طبيعية متتالية هو $3S$، وحاصل ضرب الأصغر والأكبر زائد $1$ يساوي $T^2$. عندما $S = 15$، ما هو أكبر هذه الأعداد الثلاثة؟",
            "explain": "الخطوة 1: بتمثيل الأعداد بالشكل $n-1, n, n+1$، يكون مجموعها $3n = 3S \\Rightarrow n = S = 15$.\nالخطوة 2: الأعداد هي $14, 15, 16$.\nالخطوة 3: أكبر عدد هو $16$.\nالخطوة 4: التحقق: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["تمثيل الأعداد المتتالية كـ $n-1, n, n+1$ يعطي المجموع $3n$.", "العدد الأوسط هو $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} استقصاء الفيزياء] مسألة استقصائية تطبق مبادئ {title}. على سطح أفقي عديم الاحتكاك، تؤثر قوة أفقية ثابتة مقدارها $F = 10\\text{ N}$ على جسم كتلته $m = 2\\text{ kg}$ لمسافة $4\\text{ m}$. أي عبارة تصف الشغل المبذول $W$ والتسارع $a$ بشكل صحيح؟",
            "explain": "الخطوة 1: من قانون نيوتن الثاني $F = ma$، التسارع $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nالخطوة 2: الشغل المبذول هو $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nالخطوة 3: لذلك، التسارع هو $5\\text{ m/s}^2$ والشغل المبذول هو $40\\text{ J}$.",
            "hints": ["قانون نيوتن الثاني: استخدم الصيغة $F = ma$.", "تعريف الشغل: استخدم الصيغة $W = F \\times s$."],
            "options": [
                "التسارع هو $5\\text{ m/s}^2$ والشغل المبذول هو $40\\text{ J}$.",
                "التسارع هو $2\\text{ m/s}^2$ والشغل المبذول هو $20\\text{ J}$.",
                "التسارع هو $10\\text{ m/s}^2$ والشغل المبذول هو $40\\text{ J}$.",
                "التسارع هو $5\\text{ m/s}^2$ والشغل المبذول هو $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} استقصاء الفيزياء (متقدم)] مسألة ميكانيكا تحلل {title}. يسقط جسم كتلته $m = 1\\text{ kg}$ سقوطاً حراً من السكون من ارتفاع $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$، مع إهمال مقاومة الهواء). أي عبارة حول حفظ الطاقة الميكانيكية والسرعة النهائية $v$ صحيحة؟",
            "explain": "الخطوة 1: بدون مقاومة الهواء، تُحفظ الطاقة الميكانيكية طوال السقوط.\nالخطوة 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nالخطوة 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["حفظ الطاقة الميكانيكية: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "الطاقة الميكانيكية محفوظة، والسرعة قبل الاصطدام مباشرة حوالي $19.8\\text{ m/s}$.",
                "الطاقة الميكانيكية تتناقص، والسرعة قبل الاصطدام مباشرة حوالي $9.8\\text{ m/s}$.",
                "تُحفظ طاقة الوضع فقط، وتكون طاقة الحركة صفراً.",
                "تسارع الجاذبية يتغير مع الوقت، لذا لا يمكن حساب السرعة."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} استقصاء الكيمياء] مسألة استقصائية حول {title}. عند $25^\\circ\\text{C}$ وضغط $1\\text{ atm}$، يبلغ الحجم المولي للغاز $24.5\\text{ L/mol}$. ما هو الحجم بوحدة $\\text{L}$ لـ $0.2\\text{ mol}$ من هذا الغاز تحت نفس الظروف؟",
            "explain": "الخطوة 1: وفقاً لقانون أفوغادرو، يتناسب حجم الغاز $V$ طردياً مع عدد المولات $n$.\nالخطوة 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nالخطوة 3: الحساب يعطي $V = 4.90\\text{ L}$.",
            "hints": ["عند ثبوت درجة الحرارة والضغط، يتناسب الحجم طردياً مع المولات.", "احسب $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} استقصاء الكيمياء (متقدم)] مسألة تحليل كمي حول {title}. محلول حمضي $A$ تركيز أيونات الهيدروجين فيه $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ والمحلول $B$ تركيزه $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. كم مرة يزيد تركيز أيونات الهيدروجين في $A$ مقارنة بـ $B$؟",
            "explain": "الخطوة 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$، $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nالخطوة 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nالخطوة 3: تركيز المحلول $A$ أعلى بـ 100 مرة من تركيز المحلول $B$.",
            "hints": ["احسب النسبة $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "قواعد الأسس: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ مرات}$", "$100\\text{ مرة}$", "$1000\\text{ مرة}$", "$0.01\\text{ مرة}$"]
        },
        "thinking1": "الاستدلال المنطقي والتحليل",
        "goal": "تطبيق مبادئ {title} لحل مسألة الاستقصاء والتفكير."
    },
    "arz": {
        "math_Q1": {
            "prompt": "[{grade} استقصاء الرياضيات] سؤال استقصائي عن {title}. لما يكون عندنا عددين طبيعيين $A$ و $B$ بيحققوا $A + 2B = 24$، ولما $A$ تاخد أكبر قيمة ممكنة، قيمة $B$ هتكون كام؟",
            "explain": "خطوة 1: نرتب المعادلة تبقى $A = 24 - 2B$.\nخطوة 2: بما إن $A, B \\ge 1$ أعداد طبيعية، لازم $2B$ تكون أقل ما يمكن عشان $A$ تبقى أكبر ما يمكن.\nخطوة 3: أصغر عدد طبيعي هو $B = 1$.\nخطوة 4: عند النقطة دي $A = 24 - 2(1) = 22$ (الحد الأقصى)، يبقى $B = 1$.",
            "hints": ["أصغر قيمة طبيعية لـ $B$ هي $1$.", "بما إن $A = 24 - 2B$، يبقى $A$ في أقصاها لما $B$ تكون في أقل قيمة."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} استقصاء الرياضيات (متقدم)] مسألة استقصائية مركبة باستخدام {title}. مجموع 3 أعداد طبيعية متتالية هو $3S$، وحاصل ضرب الأصغر والأكبر زائد $1$ بيساوي $T^2$. لما $S = 15$، أكبر عدد في التلاتة كام؟",
            "explain": "خطوة 1: نكتب الأعداد $n-1, n, n+1$، مجموعهم $3n = 3S \\Rightarrow n = S = 15$.\nخطوة 2: الأعداد هي $14, 15, 16$.\nخطوة 3: أكبر عدد هو $16$.\nخطوة 4: التأكيد: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["كتابة الأعداد المتتالية بالشكل $n-1, n, n+1$ يدي مجموع $3n$.", "العدد اللي في النص هو $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} استقصاء الفيزياء] مسألة استقصائية بتطبق مبادئ {title}. على سطح أفقي أملس بدون احتكاك، قوة أفقية ثابتة $F = 10\\text{ N}$ بتأثر على جسم كتلته $m = 2\\text{ kg}$ لمسافة $4\\text{ m}$. أنهي جملة بتوصف الشغل المبذول $W$ والعجلة $a$ صح؟",
            "explain": "خطوة 1: من قانون نيوتن التاني $F = ma$، العجلة $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nخطوة 2: الشغل المبذول هو $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nخطوة 3: يبقى العجلة $5\\text{ m/s}^2$ والشغل المبذول $40\\text{ J}$.",
            "hints": ["قانون نيوتن التاني: استخدم $F = ma$.", "تعريف الشغل: استخدم $W = F \\times s$."],
            "options": [
                "العجلة $5\\text{ m/s}^2$ والشغل المبذول $40\\text{ J}$.",
                "العجلة $2\\text{ m/s}^2$ والشغل المبذول $20\\text{ J}$.",
                "العجلة $10\\text{ m/s}^2$ والشغل المبذول $40\\text{ J}$.",
                "العجلة $5\\text{ m/s}^2$ والشغل المبذول $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} استقصاء الفيزياء (متقدم)] مسألة ميكانيكا بتحلل {title}. جسم كتلته $m = 1\\text{ kg}$ بيسقط سقوط حر من السكون من ارتفاع $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$، مع إهمال مقاومة الهواء). أنهي جملة عن بقاء الطاقة الميكانيكية والسرعة النهائية $v$ صح؟",
            "explain": "خطوة 1: من غير مقاومة هواء، الطاقة الميكانيكية بتفضل محفوظة طول السقوط.\nخطوة 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nخطوة 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["بقاء الطاقة الميكانيكية: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "الطاقة الميكانيكية محفوظة، والسرعة قبل الاصطدام علطول حوالي $19.8\\text{ m/s}$.",
                "الطاقة الميكانيكية بتقل، والسرعة قبل الاصطدام حوالي $9.8\\text{ m/s}$.",
                "طاقة الوضع بس هي اللي بتفضل وطاقة الحركة بصفر.",
                "عجلة الجاذبية بتتغير مع الوقت ومينفعش نحسب السرعة."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} استقصاء الكيمياء] مسألة استقصائية عن {title}. عند $25^\\circ\\text{C}$ وضغط $1\\text{ atm}$، الحجم المولي للغاز $24.5\\text{ L/mol}$. يا ترى الحجم بوحدة $\\text{L}$ لـ $0.2\\text{ mol}$ من الغاز ده كام في نفس الظروف؟",
            "explain": "خطوة 1: حسب قانون أفوكادرو، حجم الغاز $V$ بيتناسب طردياً مع عدد المولات $n$.\nخطوة 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nخطوة 3: الحساب يدي $V = 4.90\\text{ L}$.",
            "hints": ["مع ثبات الحرارة والضغط، الحجم بيتناسب طردياً مع المولات.", "احسب $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} استقصاء الكيمياء (متقدم)] مسألة تحليل كمي عن {title}. محلول حمضي $A$ فيه $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ ومحلول $B$ فيه $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. تركيز أيونات الهيدروجين في $A$ أكبر من $B$ بكام مرة؟",
            "explain": "خطوة 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$، $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nخطوة 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nخطوة 3: المحلول $A$ تركيزه أعلى بـ 100 مرة من المحلول $B$.",
            "hints": ["احسب النسبة $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "قوانين الأسس: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ مرات}$", "$100\\text{ مرة}$", "$1000\\text{ مرة}$", "$0.01\\text{ مرة}$"]
        },
        "thinking1": "التفكير المنطقي والتحليل",
        "goal": "تطبيق مبادئ {title} لحل مسألة التفكير والاستقصاء."
    },
    "fa": {
        "math_Q1": {
            "prompt": "[{grade} کاوش ریاضی] پرسش کاوشی درباره {title}. با فرض دو عدد طبیعی $A$ و $B$ که در رابطه $A + 2B = 24$ صدق می‌کنند، هنگامی که $A$ بیشترین مقدار ممکن را می‌گیرد، مقدار $B$ چند است؟",
            "explain": "گام ۱: با بازآرایی معادله داریم $A = 24 - 2B$.\nگام ۲: از آنجا که $A, B \\ge 1$ اعداد طبیعی هستند، برای بیشینه شدن $A$ باید $2B$ کمینه شود.\nگام ۳: کوچک‌ترین عدد طبیعی $B = 1$ است.\nگام ۴: در این حالت $A = 24 - 2(1) = 22$ (بیشینه)، بنابراین $B = 1$ است.",
            "hints": ["کمترین مقدار طبیعی برای $B$ برابر $1$ است.", "چون $A = 24 - 2B$، وقتی $B$ کمترین است $A$ بیشترین خواهد بود."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} کاوش ریاضی (پیشرفته)] مسئله کاوشی ترکیبی با استفاده از {title}. مجموع سه عدد طبیعی متوالی $3S$ است و حاصل‌ضرب کوچک‌ترین و بزرگ‌ترین به علاوه $1$ برابر با $T^2$ است. وقتی $S = 15$، بزرگ‌ترین این سه عدد چند است؟",
            "explain": "گام ۱: با نمایش اعداد به صورت $n-1, n, n+1$، مجموع آن‌ها $3n = 3S \\Rightarrow n = S = 15$ است.\nگام ۲: اعداد برابرند با $14, 15, 16$.\nگام ۳: بزرگ‌ترین عدد $16$ است.\nگام ۴: بررسی: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["نمایش اعداد متوالی به صورت $n-1, n, n+1$ مجموع $3n$ را به دست می‌دهد.", "عدد میانی $n = S = 15$ است."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} کاوش فیزیک] مسئله کاوشی با به کارگیری اصول {title}. روی یک سطح افقی بدون اصطکاک، نیروی افقی ثابت $F = 10\\text{ N}$ به جسمی با جرم $m = 2\\text{ kg}$ در مسافت $4\\text{ m}$ وارد می‌شود. کدام گزاره کار انجام شده $W$ و شتاب $a$ را به درستی بیان می‌کند؟",
            "explain": "گام ۱: طبق قانون دوم نیوتن $F = ma$، شتاب $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$ است.\nگام ۲: کار انجام شده $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$ است.\nگام ۳: بنابراین شتاب $5\\text{ m/s}^2$ و کار انجام شده $40\\text{ J}$ است.",
            "hints": ["قانون دوم نیوتن: از رابطه $F = ma$ استفاده کنید.", "تعریف کار: از رابطه $W = F \\times s$ استفاده کنید."],
            "options": [
                "شتاب $5\\text{ m/s}^2$ و کار انجام شده $40\\text{ J}$ است.",
                "شتاب $2\\text{ m/s}^2$ و کار انجام شده $20\\text{ J}$ است.",
                "شتاب $10\\text{ m/s}^2$ and کار انجام شده $40\\text{ J}$ است.",
                "شتاب $5\\text{ m/s}^2$ and کار انجام شده $20\\text{ J}$ است."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} کاوش فیزیک (پیشرفته)] مسئله مکانیک در تحلیل {title}. جسمی با جرم $m = 1\\text{ kg}$ از حالت سکون از ارتفاع $h = 20\\text{ m}$ در سقوط آزاد رها می‌شود ($g = 9.8\\text{ m/s}^2$، مقاومت هوا ناچیز است). کدام گزاره در مورد پایستگی انرژی مکانیکی و تندی نهایی $v$ درست است؟",
            "explain": "گام ۱: بدون مقاومت هوا، انرژی مکانیکی در طول سقوط پایسته می‌ماند.\nگام ۲: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nگام ۳: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["پایستگی انرژی مکانیکی: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "انرژی مکانیکی پایسته می‌ماند و تندی درست پیش از برخورد حدود $19.8\\text{ m/s}$ است.",
                "انرژی مکانیکی کاهش می‌یابد و تندی درست پیش از برخورد حدود $9.8\\text{ m/s}$ است.",
                "فقط انرژی پتانسیل پایسته می‌ماند و انرژی جنبشی صفر است.",
                "شتاب گرانش با زمان تغییر می‌کند، بنابراین تندی قابل محاسبه نیست."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} کاوش شیمی] مسئله کاوشی درباره {title}. در دمای $25^\\circ\\text{C}$ و فشار $1\\text{ atm}$، حجم مولی یک گاز $24.5\\text{ L/mol}$ است. در شرایط یکسان، حجم $0.2\\text{ mol}$ از این گاز بر حسب $\\text{L}$ چقدر است؟",
            "explain": "گام ۱: طبق قانون آووگادرو، حجم گاز $V$ با مقدار مول $n$ نسبت مستقیم دارد.\nگام ۲: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nگام ۳: محاسبه مقدار $V = 4.90\\text{ L}$ را به دست می‌دهد.",
            "hints": ["در دما و فشار ثابت، حجم با تعداد مول متناسب است.", "$V = n \\times V_m$ را محاسبه کنید."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} کاوش شیمی (پیشرفته)] تحلیل کمی درباره {title}. محلول اسیدی $A$ دارای غلظت یون هیدروژن $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ و محلول $B$ دارای $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$ است. غلظت یون هیدروژن در $A$ چند برابر $B$ است؟",
            "explain": "گام ۱: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$ و $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nگام ۲: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nگام ۳: غلظت محلول $A$ صد برابر غلظت محلول $B$ است.",
            "hints": ["نسبت $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ را حساب کنید.", "قوانین توان: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ برابر}$", "$100\\text{ برابر}$", "$1000\\text{ برابر}$", "$0.01\\text{ برابر}$"]
        },
        "thinking1": "استدلال منطقی و تحلیل",
        "goal": "به کارگیری اصول {title} برای حل مسئله کاوش و استدلال."
    },
    "he": {
        "math_Q1": {
            "prompt": "[{grade} חקירה מתמטית] שאלת חקירה בנושא {title}. בהינתן שני מספרים טבעיים $A$ ו-$B$ המקיימים $A + 2B = 24$, כאשר $A$ מקבל את ערכו המרבי האפשרי, מהו הערך של $B$?",
            "explain": "שלב 1: סידור מחדש של המשוואה נותן $A = 24 - 2B$.\nשלב 2: מכיוון ש-$A, B \\ge 1$ הם מספרים טבעיים, יש למזער את $2B$ כדי למקסם את $A$.\nשלב 3: המספר הטבעי הקטן ביותר הוא $B = 1$.\nשלב 4: בנקודה זו $A = 24 - 2(1) = 22$ (מקסימום), לכן $B = 1$.",
            "hints": ["הערך הטבעי המינימלי עבור $B$ הוא $1$.", "מכיוון ש-$A = 24 - 2B$, $A$ מקסימלי כאשר $B$ מינימלי."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} חקירה מתמטית (מתקדם)] שאלת חקירה מורכבת באמצעות {title}. סכומם של שלושה מספרים טבעיים עוקבים הוא $3S$, ומכפלת הקטן והגדול ביותר ועוד $1$ שווה ל-$T^2$. כאשר $S = 15$, מהו המספר הגדול מבין שלושת המספרים?",
            "explain": "שלב 1: אם נסמן את המספרים כ-$n-1, n, n+1$, סכומם הוא $3n = 3S \\Rightarrow n = S = 15$.\nשלב 2: המספרים הם $14, 15, 16$.\nשלב 3: המספר הגדול ביותר הוא $16$.\nשלב 4: בדיקה: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["ייצוג מספרים עוקבים כ-$n-1, n, n+1$ נותן סכום של $3n$.", "המספר האמצעי הוא $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} חקירה פיזיקלית] שאלת חקירה המיישמת את עקרונות {title}. על משטח אופקי ללא חיכוך, כוח אופקי קבוע של $F = 10\\text{ N}$ פועל על גוף בעל מסה $m = 2\\text{ kg}$ לאורך העתק של $4\\text{ m}$. איזו טענה מתארת נכון את העבודה $W$ שנעשתה ואת התאוצה $a$?",
            "explain": "שלב 1: לפי החוק השני של ניוטון $F = ma$, התאוצה היא $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nשלב 2: העבודה שנעשתה היא $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nשלב 3: לכן התאוצה היא $5\\text{ m/s}^2$ והעבודה היא $40\\text{ J}$.",
            "hints": ["החוק השני של ניוטון: השתמש בנוסחה $F = ma$.", "הגדרת עבודה: השתמש בנוסחה $W = F \\times s$."],
            "options": [
                "התאוצה היא $5\\text{ m/s}^2$ והעבודה שנעשתה היא $40\\text{ J}$.",
                "התאוצה היא $2\\text{ m/s}^2$ והעבודה שנעשתה היא $20\\text{ J}$.",
                "התאוצה היא $10\\text{ m/s}^2$ והעבודה שנעשתה היא $40\\text{ J}$.",
                "התאוצה היא $5\\text{ m/s}^2$ והעבודה שנעשתה היא $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} חקירה פיזיקלית (מתקדם)] שאלת מכניקה המנתחת את {title}. גוף בעל מסה $m = 1\\text{ kg}$ נשמט ממנוחה מגובה $h = 20\\text{ m}$ בנפילה חופשית ($g = 9.8\\text{ m/s}^2$, התעלם מהתנגדות האוויר). איזו טענה לגבי שימור אנרגיה מכנית ומהירות סופית $v$ נכונה?",
            "explain": "שלב 1: ללא התנגדות אוויר, האנרגיה המכנית נשמרת לאורך כל הנפילה.\nשלב 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nשלב 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["חוק שימור אנרגיה מכנית: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "האנרגיה המכנית נשמרת, והמהירות ממש לפני הפגיעה היא כ-$19.8\\text{ m/s}$.",
                "האנרגיה המכנית פוחתת, והמהירות ממש לפני הפגיעה היא כ-$9.8\\text{ m/s}$.",
                "רק אנרגיית הגובה נשמרת, והאנרגיה הקינטית היא אפס.",
                "תאוצת הכובד משתנה עם הזמן, ולכן לא ניתן לחשב את המהירות."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} חקירה כימית] שאלת חקירה בנושא {title}. בטמפרטורה של $25^\\circ\\text{C}$ ובלחץ של $1\\text{ atm}$, הנפח המולרי של גז הוא $24.5\\text{ L/mol}$. מהו הנפח ב-$\\text{L}$ של $0.2\\text{ mol}$ מגז זה באותם תנאים?",
            "explain": "שלב 1: לפי חוק אבוגדרו, נפח הגז $V$ עומד ביחס ישר למספר המולים $n$.\nשלב 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nשלב 3: החישוב מניב $V = 4.90\\text{ L}$.",
            "hints": ["בטמפרטורה ובלחץ קבועים הנפח עומד ביחס ישר למולים.", "חשב $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} חקירה כימית (מתקדם)] ניתוח כמותי בנושא {title}. לתמיסה חומצית $A$ יש ריכוז יוני מימן של $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ ולתמיסה $B$ יש $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. פי כמה גדול ריכוז יוני המימן ב-$A$ לעומת $B$?",
            "explain": "שלב 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nשלב 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nשלב 3: לתמיסה $A$ יש ריכוז יוני מימן הגדול פי 100 מזה של תמיסה $B$.",
            "hints": ["חשב את היחס $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "חוקי חזקות: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["פי $10$", "פי $100$", "פי $1000$", "פי $0.01$"]
        },
        "thinking1": "הסקה לוגית וניתוח",
        "goal": "יישום עקרונות {title} לפתרון בעיית החקירה."
    },
    "ps": {
        "math_Q1": {
            "prompt": "[{grade} د ریاضي پلټنه] د {title} په اړه د پلټنې پوښتنه. که دوه طبیعي عددونه $A$ او $B$ د $A + 2B = 24$ رابطه صدق کړي، کله چې $A$ خپل تر ټولو لوړ ممکن ارزښت ولري، نو د $B$ ارزښت به څومره وي؟",
            "explain": "۱ پړاو: د معادلې له بیا ترتیبولو لرو $A = 24 - 2B$.\n۲ پړاو: څرنګه چې $A, B \\ge 1$ طبیعي عددونه دي، د $A$ د اعظمي کولو لپاره باید $2B$ اصغري شي.\n۳ پړاو: تر ټولو کوچنی طبیعي عدد $B = 1$ دی.\n۴ پړاو: په دې حالت کې $A = 24 - 2(1) = 22$ (اعظمي)، نو $B = 1$ دی.",
            "hints": ["د $B$ لپاره تر ټولو کوچنی طبیعي ارزښت $1$ دی.", "څرنګه چې $A = 24 - 2B$، نو کله چې $B$ تر ټولو کوچنی وي $A$ اعظمي کیږي."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} د ریاضي پلټنه (پرمختللې)] د {title} په مرسته پېچلې پلټنیزه پوښتنه. د درې پرله پسې طبیعي عددونو مجموعه $3S$ ده، او د تر ټولو کوچني او تر ټولو لوی ضرب جمع $1$ مساوي له $T^2$ سره دی. کله چې $S = 15$ وي، د دې درېیو عددونو تر ټولو لوی عدد څو دی؟",
            "explain": "۱ پړاو: که عددونه د $n-1, n, n+1$ په توګه وښیو، مجموعه یې $3n = 3S \\Rightarrow n = S = 15$ ده.\n۲ پړاو: عددونه $14, 15, 16$ دي.\n۳ پړاو: تر ټولو لوی عدد $16$ دی.\n۴ پړاو: ازموینه: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["د پرله پسې عددونو ښودل د $n-1, n, n+1$ په بڼه مجموعه $3n$ ورکوي.", "منځنی عدد $n = S = 15$ دی."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} د فزیک پلټنه] د {title} اصولو پلي کولو پلټنیزه مسئله. په یوه افقي سطح باندې پرته له مښلو، یوه ثابته افقي قوه $F = 10\\text{ N}$ د $m = 2\\text{ kg}$ کتلې لرونکي جسم باندې د $4\\text{ m}$ واټن لپاره عمل کوي. کومه جمله ترسره شوی کار $W$ او تعجیل $a$ په سمه توګه بیانوي؟",
            "explain": "۱ پړاو: د نیوټن د دویم قانون له مخې $F = ma$، تعجیل $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$ دی.\n۲ پړاو: ترسره شوی کار $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$ دی.\n۳ پړاو: له همدې امله تعجیل $5\\text{ m/s}^2$ او ترسره شوی کار $40\\text{ J}$ دی.",
            "hints": ["د نیوټن دویم قانون: له $F = ma$ فورمول څخه کار واخلئ.", "د کار تعریف: له $W = F \\times s$ فورمول څخه کار واخلئ."],
            "options": [
                "تعجیل $5\\text{ m/s}^2$ او ترسره شوی کار $40\\text{ J}$ دی.",
                "تعجیل $2\\text{ m/s}^2$ او ترسره شوی کار $20\\text{ J}$ دی.",
                "تعجیل $10\\text{ m/s}^2$ او ترسره شوی کار $40\\text{ J}$ دی.",
                "تعجیل $5\\text{ m/s}^2$ او ترسره شوی کار $20\\text{ J}$ دی."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} د فزیک پلټنه (پرمختللې)] د {title} تحلیلي میخانیکي مسئله. یو جسم چې کتله یې $m = 1\\text{ kg}$ ده له سکون حالت څخه د $h = 20\\text{ m}$ لوړوالي څخه په ازاد ډول راپریوځي ($g = 9.8\\text{ m/s}^2$، د هوا مقاومت په پام کې مه نیسئ). د میخانیکي انرژۍ ساتنې او وروستي سرعت $v$ په اړه کومه جمله سمه ده؟",
            "explain": "۱ پړاو: د هوا د مقاومت پرته، میخانیکي انرژي د سقوط په اوږدو کې ساتل کیږي.\n۲ پړاو: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n۳ پړاو: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["د میخانیکي انرژۍ د بقا قانون: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "میخانیکي انرژي ساتل کیږي او د ټکر څخه لږ وړاندې سرعت نږدې $19.8\\text{ m/s}$ دی.",
                "میخانیکي انرژي کمیږي او د ټکر څخه لږ وړاندې سرعت نږدې $9.8\\text{ m/s}$ دی.",
                "یوازې پوتانشیل انرژي ساتل کیږي او حرکي انرژي صفر ده.",
                "د جاذبې تعجیل د وخت سره بدلیږي، نو سرعت نشي محاسبه کیدی."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} د کیمیا پلټنه] د {title} په اړه پلټنیزه مسئله. په $25^\\circ\\text{C}$ تودوخه او $1\\text{ atm}$ فشار کې، د ګاز مولر حجم $24.5\\text{ L/mol}$ دی. په ورته شرایطو کې د دې ګاز د $0.2\\text{ mol}$ حجم په $\\text{L}$ کې څومره دی؟",
            "explain": "۱ پړاو: د ایوګاډرو د قانون له مخې د ګاز حجم $V$ د ماليکولونو له شمېر $n$ سره مستقیم تناسب لري.\n۲ پړاو: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n۳ پړاو: محاسبه پایله $V = 4.90\\text{ L}$ ورکوي.",
            "hints": ["په ثابت T او P کې، حجم له مولونو سره مستقیم متناسب دی.", "$V = n \\times V_m$ محاسبه کړئ."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} د کیمیا پلټنه (پرمختللې)] د {title} کمیتي تحلیل مسئله. تیزابي محلول $A$ د هایدروجن آیون غلظت $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ لري او محلول $B$ بیا $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$ لري. په $A$ کې د هایدروجن آیون غلظت د $B$ په پرتله څو چنده زیات دی؟",
            "explain": "۱ پړاو: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$، $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n۲ پړاو: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n۳ پړاو: محلول $A$ د محلول $B$ په پرتله 100 برابره لوړ غلظت لري.",
            "hints": ["د $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ نسبت حساب کړئ.", "د طاقتونو قواعد: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ چنده}$", "$100\\text{ چنده}$", "$1000\\text{ چنده}$", "$0.01\\text{ چنده}$"]
        },
        "thinking1": "منطقي استدلال او تحلیل",
        "goal": "د پلټنې مسئلې د حل لپاره د {title} اصول پلي کړئ."
    },
    "ku": {
        "math_Q1": {
            "prompt": "[{grade} Lêkolîna Matematîkî] Pirsa lêkolînê li ser {title}. Ji bo du hejmarên xwerû $A$ û $B$ ku hevkêşeya $A + 2B = 24$ pêk tînin, gava ku $A$ nirxa herî mezin a gengaz digire, nirxa $B$ çi ye?",
            "explain": "Gava 1: Bi vesazkirina hevkêşeyê em $A = 24 - 2B$ bi dest dixin.\nGava 2: Ji ber ku $A, B \\ge 1$ hejmarên xwerû ne, ji bo ku $A$ herî zêde bibe divê $2B$ herî kêm bibe.\nGava 3: Hejmara xwerû ya herî piçûk $B = 1$ e.\nGava 4: Di vê xalê de $A = 24 - 2(1) = 22$ (herî zêde), lewma $B = 1$ e.",
            "hints": ["Nirxa xwerû ya herî piçûk ji bo $B$ $1$ e.", "Ji ber ku $A = 24 - 2B$, gava ku $B$ herî kêm be $A$ herî zêde dibe."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Lêkolîna Matematîkî (Pêşketî)] Pirsgirêka lêkolînê ya tevlihev bi karanîna {title}. Koma sê hejmarên xwerû yên li pey hev $3S$ e, û carandina ya herî piçûk û ya herî mezin plus $1$ wekhevî $T^2$ ye. Gava $S = 15$ be, hejmara herî mezin ji van sê hejmaran çi ye?",
            "explain": "Gava 1: Heke em hejmaran wek $n-1, n, n+1$ nîşan bidin, koma wan $3n = 3S \\Rightarrow n = S = 15$ e.\nGava 2: Hejmar $14, 15, 16$ ne.\nGava 3: Hejmara herî mezin $16$ e.\nGava 4: Kontrol: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Nîşandana hejmarên li pey hev wek $n-1, n, n+1$ koma $3n$ dide.", "Hejmara navîn $n = S = 15$ e."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Lêkolîna Fîzîkî] Pirsgirêka lêkolînê ya ku rêgezên {title} bi kar tîne. Li ser rûyekî asoyî yê bê lêkewtin, hêzeke asoyî ya domdar $F = 10\\text{ N}$ li ser heyberek bi giraniya $m = 2\\text{ kg}$ li ser mesafeya $4\\text{ m}$ bandor dike. Kîjan hevok xebata hatî kirin $W$ û lezkirinê $a$ rast rave dike?",
            "explain": "Gava 1: Li gorî zagona duyemîn a Newton $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$ e.\nGava 2: Xebata hatî kirin $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$ e.\nGava 3: Ji ber vê yekê, lezkirin $5\\text{ m/s}^2$ û xebat $40\\text{ J}$ e.",
            "hints": ["Zagona duyemîn a Newton: formula $F = ma$ bi kar bînin.", "Pênaseya xebatê: formula $W = F \\times s$ bi kar bînin."],
            "options": [
                "Lezkirin $5\\text{ m/s}^2$ e û xebata hatî kirin $40\\text{ J}$ e.",
                "Lezkirin $2\\text{ m/s}^2$ e û xebata hatî kirin $20\\text{ J}$ e.",
                "Lezkirin $10\\text{ m/s}^2$ e û xebata hatî kirin $40\\text{ J}$ e.",
                "Lezkirin $5\\text{ m/s}^2$ e û xebata hatî kirin $20\\text{ J}$ e."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Lêkolîna Fîzîkî (Pêşketî)] Pirsgirêka mekanîkê ya analîzkirina {title}. Heyberek bi giraniya $m = 1\\text{ kg}$ ji rawestanê ji bilindahiya $h = 20\\text{ m}$ bi awayekî azad dikeve ($g = 9.8\\text{ m/s}^2$, berxwedana hewayê paşguh bikin). Kîjan daxuyanî der barê parastina enerjiya mekanîkî û leza dawî $v$ de rast e?",
            "explain": "Gava 1: Bêyî berxwedana hewayê, enerjiya mekanîkî di dema ketinê de tê parastin.\nGava 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nGava 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Parastina enerjiya mekanîkî: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Enerjiya mekanîkî tê parastin û leza berî lihevkirinê nêzîkî $19.8\\text{ m/s}$ e.",
                "Enerjiya mekanîkî kêm dibe û leza berî lihevkirinê nêzîkî $9.8\\text{ m/s}$ e.",
                "Tenê enerjiya potansiyel tê parastin û enerjiya kînetîk sifir e.",
                "Lezkirina erdkêşiyê bi demê re diguhere, lewma lez nayê hejmartin."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Lêkolîna Kîmyewî] Pirsgirêka lêkolînê li ser {title}. Di $25^\\circ\\text{C}$ û $1\\text{ atm}$ de qebareya molar a gazekê $24.5\\text{ L/mol}$ e. Di bin heman şert û mercan de qebareya bi $\\text{L}$ ji bo $0.2\\text{ mol}$ ji vê gazê çi ye?",
            "explain": "Gava 1: Li gorî zagona Avogadro, qebareya gazê $V$ bi hejmara molan $n$ re rasterast têkildar e.\nGava 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nGava 3: Hesabkirin $V = 4.90\\text{ L}$ dide.",
            "hints": ["Di bin T û P ên sabît de, qebare bi molan re rasterast têkildar e.", "$V = n \\times V_m$ hesab bikin."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Lêkolîna Kîmyewî (Pêşketî)] Analîza mîqdarî li ser {title}. Çareseriya asîdî ya $A$ xwedî $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ e û çareseriya $B$ xwedî $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$ e. Xestiya îyonên hîdrojenê ya $A$ çend caran ji ya $B$ mezintir e?",
            "explain": "Gava 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nGava 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nGava 3: Çareseriya $A$ xwedî xestiyeke 100 carî ji ya çareseriya $B$ bilindtir e.",
            "hints": ["Rêjeya $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ hesab bikin.", "Rêgezên hêzan: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ caran}$", "$100\\text{ caran}$", "$1000\\text{ caran}$", "$0.01\\text{ caran}$"]
        },
        "thinking1": "Raman û analîza mantiqî",
        "goal": "Ji bo çareserkirina pirsgirêka lêkolînê rêgezên {title} bi kar bînin."
    }
}
