# -*- coding: utf-8 -*-
"""
Curriculum templates for Slavic, Baltic, and Uralic languages:
pl, cs, sk, uk, bg, hr, sr, sl, mk, lt, lv, et, fi, hu
"""

TEMPLATES_GROUP_2 = {
    "pl": {
        "math_Q1": {
            "prompt": "[{grade} Badanie Matematyczne] Pytanie badawcze dotyczące {title}. Dla danych dwóch liczb naturalnych $A$ i $B$ spełniających równanie $A + 2B = 24$, gdy $A$ przyjmuje największą możliwą wartość, ile wynosi $B$?",
            "explain": "Krok 1: Przekształcając równanie, otrzymujemy $A = 24 - 2B$.\nKrok 2: Ponieważ $A, B \\ge 1$ są liczbami naturalnymi, $2B$ musi być zminimalizowane, aby $A$ było zmaksymalizowane.\nKrok 3: Najmniejszą liczbą naturalną jest $B = 1$.\nKrok 4: Wtedy $A = 24 - 2(1) = 22$ (maksimum), więc $B = 1$.",
            "hints": ["Minimalna wartość liczby naturalnej dla $B$ to $1$.", "Ponieważ $A = 24 - 2B$, $A$ jest największe, gdy $B$ jest najmniejsze."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Badanie Matematyczne (Zaawansowane)] Złożone zadanie badawcze wykorzystujące {title}. Suma trzech kolejnych liczb naturalnych wynosi $3S$, a iloczyn najmniejszej i największej plus $1$ równa się $T^2$. Gdy $S = 15$, jaka jest największa z tych trzech liczb?",
            "explain": "Krok 1: Oznaczając liczby jako $n-1, n, n+1$, ich suma to $3n = 3S \\Rightarrow n = S = 15$.\nKrok 2: Liczby to $14, 15, 16$.\nKrok 3: Największa liczba to $16$.\nKrok 4: Sprawdzenie: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Zapis kolejnych liczb jako $n-1, n, n+1$ daje sumę $3n$.", "Środkowa liczba to $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Badanie Fizyczne] Zadanie badawcze stosujące zasady z {title}. Na poziomej powierzchni bez tarcia stała siła pozioma $F = 10\\text{ N}$ działa na ciało o masie $m = 2\\text{ kg}$ na drodze $4\\text{ m}$. Które stwierdzenie poprawnie opisuje wykonaną pracę $W$ i przyspieszenie $a$?",
            "explain": "Krok 1: Z drugiej zasady dynamiki Newtona $F = ma$ mamy $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nKrok 2: Wykonana praca wynosi $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nKrok 3: Zatem przyspieszenie wynosi $5\\text{ m/s}^2$, a wykonana praca to $40\\text{ J}$.",
            "hints": ["Druga zasada dynamiki Newtona: użyj wzoru $F = ma$.", "Definicja pracy: użyj wzoru $W = F \\times s$."],
            "options": [
                "Przyspieszenie wynosi $5\\text{ m/s}^2$, a wykonana praca to $40\\text{ J}$.",
                "Przyspieszenie wynosi $2\\text{ m/s}^2$, a wykonana praca to $20\\text{ J}$.",
                "Przyspieszenie wynosi $10\\text{ m/s}^2$, a wykonana praca to $40\\text{ J}$.",
                "Przyspieszenie wynosi $5\\text{ m/s}^2$, a wykonana praca to $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Badanie Fizyczne (Zaawansowane)] Zadanie z mechaniki analizujące {title}. Ciało o masie $m = 1\\text{ kg}$ upuszczono swobodnie z wysokości $h = 20\\text{ m}$ z prędkością początkową zero ($g = 9.8\\text{ m/s}^2$, pomijając opór powietrza). Które stwierdzenie dotyczące zachowania energii mechanicznej i prędkości końcowej $v$ jest poprawne?",
            "explain": "Krok 1: Przy braku oporu powietrza energia mechaniczna jest zachowana podczas całego spadku.\nKrok 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nKrok 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Zasada zachowania energii mechanicznej: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Energia mechaniczna jest zachowana, a prędkość tuż przed uderzeniem wynosi ok. $19.8\\text{ m/s}$.",
                "Energia mechaniczna maleje, a prędkość tuż przed uderzeniem wynosi ok. $9.8\\text{ m/s}$.",
                "Tylko energia potencjalna jest zachowana, a energia kinetyczna wynosi zero.",
                "Przyspieszenie grawitacyjne zmienia się w czasie, więc prędkości nie można obliczyć."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Badanie Chemiczne] Zadanie badawcze dotyczące {title}. W temperaturze $25^\\circ\\text{C}$ i ciśnieniu $1\\text{ atm}$ objętość molowa gazu wynosi $24.5\\text{ L/mol}$. Jaka jest objętość w $\\text{L}$ dla $0.2\\text{ mol}$ tego gazu w tych samych warunkach?",
            "explain": "Krok 1: Zgodnie z prawem Avogadra objętość gazu $V$ jest wprost proporcjonalna do liczby moli $n$.\nKrok 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nKrok 3: Obliczenie daje $V = 4.90\\text{ L}$.",
            "hints": ["Przy stałej T i P objętość jest wprost proporcjonalna do liczby moli.", "Oblicz $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Badanie Chemiczne (Zaawansowane)] Analiza ilościowa dotycząca {title}. Roztwór kwasowy $A$ ma stężenie $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, a roztwór $B$ ma $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Ile razy stężenie jonów wodorowych w $A$ jest większe niż w $B$?",
            "explain": "Krok 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nKrok 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nKrok 3: Roztwór $A$ ma 100 razy wyższe stężenie $[\\text{H}^+]$ niż roztwór $B$.",
            "hints": ["Oblicz stosunek $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Zasady potęgowania: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ razy}$", "$100\\text{ razy}$", "$1000\\text{ razy}$", "$0.01\\text{ raza}$"]
        },
        "thinking1": "Logiczne rozumowanie i analiza",
        "goal": "Zastosuj zasady {title}, aby rozwiązać problem badawczy."
    },
    "cs": {
        "math_Q1": {
            "prompt": "[{grade} Matematický Výzkum] Výzkumná otázka k tématu {title}. Jsou dána dvě přirozená čísla $A$ a $B$ splňující vztah $A + 2B = 24$. Jaká je hodnota $B$, když $A$ nabývá své maximální možné hodnoty?",
            "explain": "Krok 1: Úpravou rovnice dostáváme $A = 24 - 2B$.\nKrok 2: Protože $A, B \\ge 1$ jsou přirozená čísla, pro maximalizaci $A$ musí být $2B$ minimální.\nKrok 3: Nejmenší přirozené číslo je $B = 1$.\nKrok 4: V tomto bodě je $A = 24 - 2(1) = 22$ (maximum), tedy $B = 1$.",
            "hints": ["Minimální přirozená hodnota pro $B$ je $1$.", "Protože $A = 24 - 2B$, $A$ je maximální, když je $B$ minimální."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematický Výzkum (Pokročilý)] Komplexní výzkumná úloha s využitím tématu {title}. Součet tří po sobě jdoucích přirozených čísel je $3S$ a součin nejmenšího a největšího plus $1$ se rovná $T^2$. Je-li $S = 15$, jaké je největší z těchto tří čísel?",
            "explain": "Krok 1: Vyjádříme-li čísla jako $n-1, n, n+1$, jejich součet je $3n = 3S \\Rightarrow n = S = 15$.\nKrok 2: Čísla jsou $14, 15, 16$.\nKrok 3: Největší číslo je $16$.\nKrok 4: Kontrola: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Vyjádření po sobě jdoucích čísel jako $n-1, n, n+1$ dává součet $3n$.", "Prostřední číslo je $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fyzikální Výzkum] Výzkumná úloha aplikující principy z tématu {title}. Na vodorovném povrchu bez tření působí na těleso o hmotnosti $m = 2\\text{ kg}$ stálá vodorovná síla $F = 10\\text{ N}$ po dráze $4\\text{ m}$. Které tvrzení správně popisuje vykonanou práci $W$ a zrychlení $a$?",
            "explain": "Krok 1: Z druhého Newtonova zákona $F = ma$ plyne $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nKrok 2: Vykonaná práce je $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nKrok 3: Zrychlení je tedy $5\\text{ m/s}^2$ a vykonaná práce je $40\\text{ J}$.",
            "hints": ["Druhý Newtonův zákon: použijte vzorec $F = ma$.", "Definice práce: použijte vzorec $W = F \\times s$."],
            "options": [
                "Zrychlení je $5\\text{ m/s}^2$ a vykonaná práce je $40\\text{ J}$.",
                "Zrychlení je $2\\text{ m/s}^2$ a vykonaná práce je $20\\text{ J}$.",
                "Zrychlení je $10\\text{ m/s}^2$ a vykonaná práce je $40\\text{ J}$.",
                "Zrychlení je $5\\text{ m/s}^2$ a vykonaná práce je $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fyzikální Výzkum (Pokročilý)] Mechanická úloha analyzující {title}. Těleso o hmotnosti $m = 1\\text{ kg}$ je volně spuštěno z klidu z výšky $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, odpor vzduchu zanedbejte). Které tvrzení o zachování mechanické energie a konečné rychlosti $v$ je správné?",
            "explain": "Krok 1: Bez odporu vzduchu se mechanická energie během pádu zachovává.\nKrok 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nKrok 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Zachování mechanické energie: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mechanická energie se zachovává a rychlost těsně před dopadem je přibližně $19.8\\text{ m/s}$.",
                "Mechanická energie klesá a rychlost těsně před dopadem je přibližně $9.8\\text{ m/s}$.",
                "Zachovává se pouze potenciální energie a kinetická energie je nulová.",
                "Tíhové zrychlení se mění s časem, takže rychlost nelze vypočítat."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Chemický Výzkum] Výzkumná úloha k tématu {title}. Při $25^\\circ\\text{C}$ a $1\\text{ atm}$ je molární objem plynu $24.5\\text{ L/mol}$. Jaký objem v $\\text{L}$ zaujímá za stejných podmínek $0.2\\text{ mol}$ tohoto plynu?",
            "explain": "Krok 1: Podle Avogadrova zákona je objem plynu $V$ přímo úměrný látkovému množství $n$.\nKrok 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nKrok 3: Výpočet dává $V = 4.90\\text{ L}$.",
            "hints": ["Při konstantní T a P je objem úměrný látkovému množství.", "Vypočítejte $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Chemický Výzkum (Pokročilý)] Kvantitativní analýza k tématu {title}. Kyselý roztok $A$ má $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ a roztok $B$ má $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Kolikrát je koncentrace vodíkových iontů v $A$ vyšší než v $B$?",
            "explain": "Krok 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nKrok 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nKrok 3: Roztok $A$ má 100krát vyšší koncentraci $[\\text{H}^+]$ než roztok $B$.",
            "hints": ["Vypočítejte poměr $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Pravidla pro mocniny: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{krát}$", "$100\\text{krát}$", "$1000\\text{krát}$", "$0.01\\text{krát}$"]
        },
        "thinking1": "Logické uvažování a analýza",
        "goal": "Aplikujte principy tématu {title} k vyřešení výzkumné úlohy."
    },
    "sk": {
        "math_Q1": {
            "prompt": "[{grade} Matematický Výskum] Výskumná otázka k téme {title}. Dané sú dve prirodzené čísla $A$ a $B$ spĺňajúce vzťah $A + 2B = 24$. Aká je hodnota $B$, keď $A$ nadobúda svoju maximálnu možnú hodnotu?",
            "explain": "Krok 1: Úpravou rovnice dostávame $A = 24 - 2B$.\nKrok 2: Pretože $A, B \\ge 1$ sú prirodzené čísla, na maximalizáciu $A$ musí byť $2B$ minimálne.\nKrok 3: Najmenšie prirodzené číslo je $B = 1$.\nKrok 4: V tomto bode je $A = 24 - 2(1) = 22$ (maximum), teda $B = 1$.",
            "hints": ["Minimálna prirodzená hodnota pre $B$ je $1$.", "Pretože $A = 24 - 2B$, $A$ je maximálne, keď je $B$ minimálne."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematický Výskum (Pokročilý)] Komplexná výskumná úloha s využitím témy {title}. Súčet troch po sebe idúcich prirodzených čísel je $3S$ a súčin najmenšieho a najväčšieho plus $1$ sa rovná $T^2$. Ak je $S = 15$, aké je najväčšie z týchto troch čísel?",
            "explain": "Krok 1: Ak čísla vyjadríme ako $n-1, n, n+1$, ich súčet je $3n = 3S \\Rightarrow n = S = 15$.\nKrok 2: Čísla sú $14, 15, 16$.\nKrok 3: Najväčšie číslo je $16$.\nKrok 4: Kontrola: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Označenie po sebe idúcich čísel ako $n-1, n, n+1$ dáva súčet $3n$.", "Prostredné číslo je $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fyzikálny Výskum] Výskumná úloha aplikujúca princípy témy {title}. Na vodorovnom povrchu bez trenia pôsobí na teleso s hmotnosťou $m = 2\\text{ kg}$ stála vodorovná sila $F = 10\\text{ N}$ po dráhe $4\\text{ m}$. Ktoré tvrdenie správne popisuje vykonanú prácu $W$ a zrýchlenie $a$?",
            "explain": "Krok 1: Podľa druhého Newtonovho zákona $F = ma$ platí $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nKrok 2: Vykonaná práca je $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nKrok 3: Preto je zrýchlenie $5\\text{ m/s}^2$ a vykonaná práca $40\\text{ J}$.",
            "hints": ["Druhý Newtonov zákon: použite vzorec $F = ma$.", "Definícia práce: použite vzorec $W = F \\times s$."],
            "options": [
                "Zrýchlenie je $5\\text{ m/s}^2$ a vykonaná práca je $40\\text{ J}$.",
                "Zrýchlenie je $2\\text{ m/s}^2$ a vykonaná práca je $20\\text{ J}$.",
                "Zrýchlenie je $10\\text{ m/s}^2$ a vykonaná práca je $40\\text{ J}$.",
                "Zrýchlenie je $5\\text{ m/s}^2$ a vykonaná práca je $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fyzikálny Výskum (Pokročilý)] Mechanická úloha analyzujúca {title}. Teleso s hmotnosťou $m = 1\\text{ kg}$ je voľne spustené z pokoja z výšky $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, odpor vzduchu zanedbajte). Ktoré tvrdenie o zachovaní mechanickej energie a konečnej rýchlosti $v$ je správne?",
            "explain": "Krok 1: Bez odporu vzduchu sa mechanická energia počas pádu zachováva.\nKrok 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nKrok 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Zachovanie mechanickej energie: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mechanická energia sa zachováva a rýchlosť tesne pred dopadom je približne $19.8\\text{ m/s}$.",
                "Mechanická energia klesá a rýchlosť tesne pred dopadom je približne $9.8\\text{ m/s}$.",
                "Zachováva sa iba potenciálna energia a kinetická energia je nulová.",
                "Tiažové zrýchlenie sa mení s časom, takže rýchlosť nemožno vypočítať."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Chemický Výskum] Výskumná úloha k téme {title}. Pri $25^\\circ\\text{C}$ a $1\\text{ atm}$ je molárny objem plynu $24.5\\text{ L/mol}$. Aký objem v $\\text{L}$ zaberá za rovnakých podmienok $0.2\\text{ mol}$ tohto plynu?",
            "explain": "Krok 1: Podľa Avogadrovho zákona je objem plynu $V$ priamo úmerný látkovému množstvu $n$.\nKrok 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nKrok 3: Výpočet dáva $V = 4.90\\text{ L}$.",
            "hints": ["Pri konštantnej T a P je objem úmerný látkovému množstvu.", "Vypočítajte $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Chemický Výskum (Pokročilý)] Kvantitatívna analýza k téme {title}. Kyslý roztok $A$ má $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ a roztok $B$ má $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Koľkokrát je koncentrácia vodíkových iónov v $A$ vyššia ako v $B$?",
            "explain": "Krok 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nKrok 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nKrok 3: Roztok $A$ má 100-krát vyššiu koncentráciu $[\\text{H}^+]$ než roztok $B$.",
            "hints": ["Vypočítajte pomer $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Pravidlá pre mocniny: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{-krát}$", "$100\\text{-krát}$", "$1000\\text{-krát}$", "$0.01\\text{-krát}$"]
        },
        "thinking1": "Logické uvažovanie a analýza",
        "goal": "Aplikujte princípy témy {title} na vyriešenie výskumnej úlohy."
    },
    "uk": {
        "math_Q1": {
            "prompt": "[{grade} Математичне Дослідження] Дослідницьке запитання за темою {title}. Дано два натуральних числа $A$ і $B$, що задовольняють співвідношення $A + 2B = 24$. Яким є значення $B$, коли $A$ набуває максимально можливого значення?",
            "explain": "Крок 1: Перетворюючи рівняння, маємо $A = 24 - 2B$.\nКрок 2: Оскільки $A, B \\ge 1$ — натуральні числа, для максимізації $A$ доданок $2B$ має бути мінімальним.\nКрок 3: Найменше натуральне число — це $B = 1$.\nКрок 4: Тоді $A = 24 - 2(1) = 22$ (максимум), отже $B = 1$.",
            "hints": ["Мінімальне значення натурального числа для $B$ дорівнює $1$.", "Оскільки $A = 24 - 2B$, $A$ максимальне тоді, коли $B$ мінімальне."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Математичне Дослідження (Поглиблене)] Складне дослідницьке завдання за темою {title}. Сума трьох послідовних натуральних чисел дорівнює $3S$, а добуток найменшого і найбільшого плюс $1$ дорівнює $T^2$. Якщо $S = 15$, яке з цих трьох чисел є найбільшим?",
            "explain": "Крок 1: Позначивши числа як $n-1, n, n+1$, їхня сума $3n = 3S \\Rightarrow n = S = 15$.\nКрок 2: Числами є $14, 15, 16$.\nКрок 3: Найбільше число — $16$.\nКрок 4: Перевірка: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Позначення послідовних чисел як $n-1, n, n+1$ дає суму $3n$.", "Середнє число $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Фізичне Дослідження] Дослідницьке завдання на застосування принципів {title}. На горизонтальній поверхні без тертя на тіло масою $m = 2\\text{ кг}$ діє постійна горизонтальна сила $F = 10\\text{ Н}$, переміщуючи його на $4\\text{ м}$. Яке твердження правильно описує виконану роботу $W$ та прискорення $a$?",
            "explain": "Крок 1: За другим законом Ньютона $F = ma$, прискорення $a = \\frac{F}{m} = \\frac{10\\text{ Н}}{2\\text{ кг}} = 5\\text{ м/с}^2$.\nКрок 2: Виконана робота $W = F \\cdot s = 10\\text{ Н} \\times 4\\text{ м} = 40\\text{ Дж}$.\nКрок 3: Отже, прискорення становить $5\\text{ м/с}^2$, а виконана робота — $40\\text{ Дж}$.",
            "hints": ["Другий закон Ньютона: використовуйте формулу $F = ma$.", "Визначення роботи: використовуйте формулу $W = F \\times s$."],
            "options": [
                "Прискорення становить $5\\text{ м/с}^2$, а виконана робота — $40\\text{ Дж}$.",
                "Прискорення становить $2\\text{ м/с}^2$, а виконана робота — $20\\text{ Дж}$.",
                "Прискорення становить $10\\text{ м/с}^2$, а виконана робота — $40\\text{ Дж}$.",
                "Прискорення становить $5\\text{ м/с}^2$, а виконана робота — $20\\text{ Дж}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Фізичне Дослідження (Поглиблене)] Завдання з механіки для аналізу {title}. Тіло масою $m = 1\\text{ кг}$ вільно падає без початкової швидкості з висоти $h = 20\\text{ м}$ ($g = 9.8\\text{ м/с}^2$, опором повітря знехтувати). Яке твердження про збереження механічної енергії та кінцеву швидкість $v$ є правильним?",
            "explain": "Крок 1: За відсутності опору повітря механічна енергія зберігається протягом усього падіння.\nКрок 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nКрок 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ м/с}$.",
            "hints": ["Закон збереження механічної енергії: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ м/с}$."],
            "options": [
                "Механічна енергія зберігається, а швидкість перед ударом становить прибл. $19.8\\text{ м/с}$.",
                "Механічна енергія зменшується, а швидкість перед ударом становить прибл. $9.8\\text{ м/с}$.",
                "Зберігається тільки потенціальна енергія, а кінетична енергія дорівнює нулю.",
                "Прискорення вільного падіння змінюється з часом, тому швидкість обчислити неможливо."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Хімічне Дослідження] Дослідницьке завдання за темою {title}. За температури $25^\\circ\\text{C}$ і тиску $1\\text{ атм}$ молярний об'єм газу становить $24.5\\text{ л/моль}$. Який об'єм у $\\text{л}$ займає за таких самих умов $0.2\\text{ моль}$ цього газу?",
            "explain": "Крок 1: За законом Авогадро об'єм газу $V$ прямо пропорційний кількості речовини $n$.\nКрок 2: $V = n \\times V_m = 0.2\\text{ моль} \\times 24.5\\text{ л/моль}$.\nКрок 3: Обчислення дає $V = 4.90\\text{ л}$.",
            "hints": ["За постійних T і P об'єм прямо пропорційний кількості моль.", "Обчисліть $V = n \\times V_m$."],
            "options": ["$2.45\\text{ л}$", "$4.90\\text{ л}$", "$9.80\\text{ л}$", "$12.25\\text{ л}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Хімічне Дослідження (Поглиблене)] Кількісний аналіз за темою {title}. Кислий розчин $A$ має $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ М}$, а розчин $B$ має $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ М}$. У скільки разів концентрація йонів гідрогену в $A$ більша, ніж у $B$?",
            "explain": "Крок 1: $[\\text{H}^+]_A = 10^{-3}\\text{ М}$, $[\\text{H}^+]_B = 10^{-5}\\text{ М}$.\nКрок 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nКрок 3: Розчин $A$ має у 100 разів вищу концентрацію $[\\text{H}^+]$, ніж розчин $B$.",
            "hints": ["Обчисліть відношення $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Властивості степенів: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["у $10\\text{ разів}$", "у $100\\text{ разів}$", "у $1000\\text{ разів}$", "у $0.01\\text{ раза}$"]
        },
        "thinking1": "Логічне міркування та аналіз",
        "goal": "Застосуйте принципи теми {title} для розв'язання дослідницької задачі."
    },
    "bg": {
        "math_Q1": {
            "prompt": "[{grade} Математическо Изследване] Изследователски въпрос относно {title}. За две естествени числа $A$ и $B$, изпълняващи $A + 2B = 24$, когато $A$ приема своята максимална стойност, каква е стойността на $B$?",
            "explain": "Стъпка 1: Преобразуването дава $A = 24 - 2B$.\nСтъпка 2: Тъй като $A, B \\ge 1$ са естествени числа, $2B$ трябва да бъде минимизирано, за да бъде $A$ максимизирано.\nСтъпка 3: Най-малкото естествено число е $B = 1$.\nСтъпка 4: В тази точка $A = 24 - 2(1) = 22$ (максимум), следователно $B = 1$.",
            "hints": ["Минималната стойност за естественото число $B$ е $1$.", "Тъй като $A = 24 - 2B$, $A$ е максимално, когато $B$ е минимално."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Математическо Изследване (За напреднали)] Комплексна изследователска задача с използване на {title}. Сумата на три последователни естествени числа е $3S$, а произведението на най-малкото и най-голямото плюс $1$ е равно на $T^2$. Когато $S = 15$, кое е най-голямото от тези три числа?",
            "explain": "Стъпка 1: Означавайки числата като $n-1, n, n+1$, тяхната сума е $3n = 3S \\Rightarrow n = S = 15$.\nСтъпка 2: Числата са $14, 15, 16$.\nСтъпка 3: Най-голямото число е $16$.\nСтъпка 4: Проверка: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Представянето на последователни числа като $n-1, n, n+1$ дава сума $3n$.", "Средното число е $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Физическо Изследване] Изследователски проблем, прилагащ принципите на {title}. Върху хоризонтална повърхност без триене постоянна хоризонтална сила $F = 10\\text{ N}$ действа на тяло с маса $m = 2\\text{ kg}$ на разстояние $4\\text{ m}$. Кое твърдение описва правилно извършената работа $W$ и ускорението $a$?",
            "explain": "Стъпка 1: От втория закон на Нютон $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nСтъпка 2: Извършената работа е $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nСтъпка 3: Следователно ускорението е $5\\text{ m/s}^2$, а извършената работа е $40\\text{ J}$.",
            "hints": ["Втори закон на Нютон: използвайте формулата $F = ma$.", "Определение за работа: използвайте формулата $W = F \\times s$."],
            "options": [
                "Ускорението е $5\\text{ m/s}^2$, а извършената работа е $40\\text{ J}$.",
                "Ускорението е $2\\text{ m/s}^2$, а извършената работа е $20\\text{ J}$.",
                "Ускорението е $10\\text{ m/s}^2$, а извършената работа е $40\\text{ J}$.",
                "Ускорението е $5\\text{ m/s}^2$, а извършената работа е $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Физическо Изследване (За напреднали)] Механичен проблем, анализиращ {title}. Тяло с маса $m = 1\\text{ kg}$ пада свободно от покой от височина $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, пренебрегвайки съпротивлението на въздуха). Кое твърдение за запазването на механичната енергия и крайната скорост $v$ е вярно?",
            "explain": "Стъпка 1: Без съпротивление на въздуха механичната енергия се запазва по време на падането.\nСтъпка 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nСтъпка 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Закон за запазване на механичната енергия: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Механичната енергия се запазва, а скоростта преди удара е прибл. $19.8\\text{ m/s}$.",
                "Механичната енергия намалява, а скоростта преди удара е прибл. $9.8\\text{ m/s}$.",
                "Само потенциалната енергия се запазва, а кинетичната енергия е нула.",
                "Земното ускорение се променя с времето, така че скоростта не може да се изчисли."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Химическо Изследване] Изследователски въпрос относно {title}. При $25^\\circ\\text{C}$ и $1\\text{ atm}$ моларният обем на газ е $24.5\\text{ L/mol}$. Какъв е обемът в $\\text{L}$ на $0.2\\text{ mol}$ от този газ при същите условия?",
            "explain": "Стъпка 1: Според закона на Авогадро обемът на газа $V$ е правопропорционален на количеството вещество $n$.\nСтъпка 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nСтъпка 3: Изчислението дава $V = 4.90\\text{ L}$.",
            "hints": ["При постоянни T и P обемът е пропорционален на моловете.", "Изчислете $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Химическо Изследване (За напреднали)] Количествен анализ за {title}. Киселинен разтвор $A$ има $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, а разтвор $B$ има $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Колко пъти концентрацията на водородни йони в $A$ е по-голяма от тази в $B$?",
            "explain": "Стъпка 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nСтъпка 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nСтъпка 3: Разтвор $A$ има 100 пъти по-висока концентрация $[\\text{H}^+]$ от разтвор $B$.",
            "hints": ["Изчислете съотношението $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Правила за степени: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ пъти}$", "$100\\text{ пъти}$", "$1000\\text{ пъти}$", "$0.01\\text{ пъти}$"]
        },
        "thinking1": "Логическо мислене и анализ",
        "goal": "Приложете принципите на {title}, за да решите изследователския проблем."
    },
    "hr": {
        "math_Q1": {
            "prompt": "[{grade} Matematičko Istraživanje] Istraživačko pitanje o temi {title}. Za dva prirodna broja $A$ i $B$ koja zadovoljavaju $A + 2B = 24$, kada $A$ poprima svoju najveću moguću vrijednost, kolika je vrijednost $B$?",
            "explain": "1. korak: Preuređivanjem jednadžbe dobivamo $A = 24 - 2B$.\n2. korak: Budući da su $A, B \\ge 1$ prirodni brojevi, $2B$ mora biti minimalan kako bi $A$ bio maksimalan.\n3. korak: Najmanji prirodni broj je $B = 1$.\n4. korak: U toj točki $A = 24 - 2(1) = 22$ (maksimum), dakle $B = 1$.",
            "hints": ["Najmanja prirodna vrijednost za $B$ je $1$.", "Budući da je $A = 24 - 2B$, $A$ je maksimalan kada je $B$ minimalan."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematičko Istraživanje (Napredno)] Složen istraživački zadatak pomoću {title}. Zbroj tri uzastopna prirodna broja je $3S$, a umnožak najmanjeg i najvećeg uvećan za $1$ jednak je $T^2$. Kada je $S = 15$, koji je najveći od ta tri broja?",
            "explain": "1. korak: Ako brojeve označimo kao $n-1, n, n+1$, njihov zbroj je $3n = 3S \\Rightarrow n = S = 15$.\n2. korak: Brojevi su $14, 15, 16$.\n3. korak: Najveći broj je $16$.\n4. korak: Provjera: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Prikazivanje uzastopnih brojeva kao $n-1, n, n+1$ daje zbroj $3n$.", "Srednji broj je $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fizikalno Istraživanje] Istraživački problem koji primjenjuje načela {title}. Na vodoravnoj površini bez trenja stalna vodoravna sila $F = 10\\text{ N}$ djeluje na tijelo mase $m = 2\\text{ kg}$ na putu od $4\\text{ m}$. Koja tvrdnja točno opisuje obavljeni rad $W$ i ubrzanje $a$?",
            "explain": "1. korak: Prema drugom Newtonovom zakonu $F = ma$ vrijedi $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\n2. korak: Obavljeni rad je $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\n3. korak: Stoga je ubrzanje $5\\text{ m/s}^2$, a obavljeni rad $40\\text{ J}$.",
            "hints": ["Drugi Newtonov zakon: upotrijebite formulu $F = ma$.", "Definicija rada: upotrijebite formulu $W = F \\times s$."],
            "options": [
                "Ubrzanje je $5\\text{ m/s}^2$, a obavljeni rad je $40\\text{ J}$.",
                "Ubrzanje je $2\\text{ m/s}^2$, a obavljeni rad je $20\\text{ J}$.",
                "Ubrzanje je $10\\text{ m/s}^2$, a obavljeni rad je $40\\text{ J}$.",
                "Ubrzanje je $5\\text{ m/s}^2$, a obavljeni rad je $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fizikalno Istraživanje (Napredno)] Problem iz mehanike koji analizira {title}. Tijelo mase $m = 1\\text{ kg}$ slobodno pada iz mirovanja s visine $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, zanemarite otpor zraka). Koja je tvrdnja o očuvanju mehaničke energije i konačnoj brzini $v$ točna?",
            "explain": "1. korak: Bez otpora zraka mehanička energija je očuvana tijekom cijelog pada.\n2. korak: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3. korak: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Očuvanje mehaničke energije: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mehanička energija je očuvana, a brzina neposredno prije udara je oko $19.8\\text{ m/s}$.",
                "Mehanička energija se smanjuje, a brzina neposredno prije udara je oko $9.8\\text{ m/s}$.",
                "Samo se potencijalna energija očuva, a kinetička energija je nula.",
                "Gravitacija se mijenja s vremenom, stoga se brzina ne može izračunati."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kemijsko Istraživanje] Istraživački problem o temi {title}. Pri $25^\\circ\\text{C}$ i $1\\text{ atm}$ molarni volumen plina iznosi $24.5\\text{ L/mol}$. Koliki je volumen u $\\text{L}$ za $0.2\\text{ mol}$ tog plina pod istim uvjetima?",
            "explain": "1. korak: Prema Avogadrovu zakonu volumen plina $V$ izravno je proporcionalan količini tvari $n$.\n2. korak: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n3. korak: Izračun daje $V = 4.90\\text{ L}$.",
            "hints": ["Pri stalnoj T i P volumen je razmjeran količini molova.", "Izračunajte $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kemijsko Istraživanje (Napredno)] Kvantitativna analiza o temi {title}. Kisela otopina $A$ ima $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, a otopina $B$ ima $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Koliko je puta koncentracija vodikovih iona u $A$ veća nego u $B$?",
            "explain": "1. korak: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2. korak: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3. korak: Otopina $A$ ima 100 puta veću koncentraciju $[\\text{H}^+]$ od otopine $B$.",
            "hints": ["Izračunajte omjer $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Pravila potenciranja: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ puta}$", "$100\\text{ puta}$", "$1000\\text{ puta}$", "$0.01\\text{ puta}$"]
        },
        "thinking1": "Logičko zaključivanje i analiza",
        "goal": "Primijenite načela teme {title} za rješavanje istraživačkog zadatka."
    },
    "sr": {
        "math_Q1": {
            "prompt": "[{grade} Математичко Истраживање] Истраживачко питање о теми {title}. За два природна броја $A$ и $B$ која задовољавају $A + 2B = 24$, када $A$ узима своју највећу могућу вредност, колика је вредност $B$?",
            "explain": "Корак 1: Преуређивањем једначине добијамо $A = 24 - 2B$.\nКорак 2: Пошто су $A, B \\ge 1$ природни бројеви, $2B$ мора бити минимално да би $A$ било максимално.\nКорак 3: Најмањи природан број је $B = 1$.\nКорак 4: У овој тачки је $A = 24 - 2(1) = 22$ (максимум), дакле $B = 1$.",
            "hints": ["Најмања природна вредност за $B$ је $1$.", "Пошто је $A = 24 - 2B$, $A$ је максимално када је $B$ минимално."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Математичко Истраживање (Напредно)] Сложен истраживачки задатак коришћењем {title}. Збир три узастопна природна броја је $3S$, а производ најмањег и највећег плус $1$ једнак је $T^2$. Када је $S = 15$, који је највећи од ова три броја?",
            "explain": "Корак 1: Означавајући бројеве као $n-1, n, n+1$, њихов збир је $3n = 3S \\Rightarrow n = S = 15$.\nКорак 2: Бројеви су $14, 15, 16$.\nКорак 3: Највећи број је $16$.\nКорак 4: Провера: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Представљање узастопних бројева као $n-1, n, n+1$ даје збир $3n$.", "Средњи број је $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Физичко Истраживање] Истраживачки задатак који примењује принципе из {title}. На хоризонталној површини без трења стална хоризонтална сила $F = 10\\text{ N}$ делује на тело масе $m = 2\\text{ kg}$ на путу од $4\\text{ m}$. Која тврдња тачно описује извршени рад $W$ и убрзање $a$?",
            "explain": "Корак 1: Према другом Њутновом закону $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nКорак 2: Извршени рад је $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nКорак 3: Према томе, убрзање је $5\\text{ m/s}^2$, а извршени рад $40\\text{ J}$.",
            "hints": ["Други Њутнов закон: користите формулу $F = ma$.", "Дефиниција рада: користите формулу $W = F \\times s$."],
            "options": [
                "Убрзање је $5\\text{ m/s}^2$, а извршени рад је $40\\text{ J}$.",
                "Убрзање је $2\\text{ m/s}^2$, а извршени рад је $20\\text{ J}$.",
                "Убрзање је $10\\text{ m/s}^2$, а извршени рад је $40\\text{ J}$.",
                "Убрзање је $5\\text{ m/s}^2$, а извршени рад је $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Физичко Истраживање (Напредно)] Задатак из механике који анализира {title}. Тело масе $m = 1\\text{ kg}$ испуштено је из мировања са висине $h = 20\\text{ m}$ у слободном паду ($g = 9.8\\text{ m/s}^2$, занемарите отпор ваздуха). Која тврдња о очувању механичке енергије и крајњој брзини $v$ је тачна?",
            "explain": "Корак 1: Без отпора ваздуха механичка енергија се одржава током читавог пада.\nКорак 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nКорак 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Закон одржања механичке енергије: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Механичка енергија се одржава, а брзина непосредно пре удара је око $19.8\\text{ m/s}$.",
                "Механичка енергија опада, а брзина непосредно пре удара је око $9.8\\text{ m/s}$.",
                "Само се потенцијална енергија одржава, а кинетичка енергија је нула.",
                "Гравитација се мења с временом, па се брзина не може израчунати."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Хемијско Истраживање] Истраживачки проблем о теми {title}. На $25^\\circ\\text{C}$ и $1\\text{ atm}$ моларна запремина гаса износи $24.5\\text{ L/mol}$. Колика је запремина у $\\text{L}$ за $0.2\\text{ mol}$ овог гаса под истим условима?",
            "explain": "Корак 1: Према Авогадровом закону запремина гаса $V$ директно је пропорционална количини супстанце $n$.\nКорак 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nКорак 3: Прорачун даје $V = 4.90\\text{ L}$.",
            "hints": ["При константној T и P запремина је сразмерна молима.", "Израчунајте $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Хемијско Истраживање (Напредно)] Квантитативна анализа за {title}. Кисели раствор $A$ има $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, а раствор $B$ има $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Колико је пута концентрација водоникових јона у $A$ већа него у $B$?",
            "explain": "Корак 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nКорак 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nКорак 3: Раствор $A$ има 100 пута већу концентрацију $[\\text{H}^+]$ од раствора $B$.",
            "hints": ["Израчунајте однос $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Правила степеновања: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ пута}$", "$100\\text{ пута}$", "$1000\\text{ пута}$", "$0.01\\text{ пута}$"]
        },
        "thinking1": "Логичко закључивање и анализа",
        "goal": "Примените принципе теме {title} да решите истраживачки проблем."
    },
    "sl": {
        "math_Q1": {
            "prompt": "[{grade} Matematično Raziskovanje] Raziskovalno vprašanje o temi {title}. Za dve naravni števili $A$ in $B$, ki izpolnjujeta $A + 2B = 24$, kolikšna je vrednost $B$, ko $A$ zavzame svojo največjo možno vrednost?",
            "explain": "1. korak: S preureditvijo dobimo $A = 24 - 2B$.\n2. korak: Ker sta $A, B \\ge 1$ naravni števili, mora biti $2B$ minimalen, da je $A$ maksimalen.\n3. korak: Najmanjše naravno število je $B = 1$.\n4. korak: Pri tem je $A = 24 - 2(1) = 22$ (maksimum), torej je $B = 1$.",
            "hints": ["Najmanjša naravna vrednost za $B$ je $1$.", "Ker je $A = 24 - 2B$, je $A$ maksimalen, ko je $B$ minimalen."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematično Raziskovanje (Nadaljevalno)] Zahtevna raziskovalna naloga z uporabo {title}. Vsota treh zaporednih naravnih števil je $3S$, zmnožek najmanjšega in največjega plus $1$ pa je enak $T^2$. Ko je $S = 15$, katero je največje od teh treh števil?",
            "explain": "1. korak: Če števila označimo z $n-1, n, n+1$, je vsota $3n = 3S \\Rightarrow n = S = 15$.\n2. korak: Števila so $14, 15, 16$.\n3. korak: Največje število je $16$.\n4. korak: Preizkus: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Zapis zaporednih števil kot $n-1, n, n+1$ daje vsoto $3n$.", "Srednje število je $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fizikalno Raziskovanje] Raziskovalni problem z uporabo načel {title}. Na vodoravni površini brez trenja stalna vodoravna sila $F = 10\\text{ N}$ deluje na telo z maso $m = 2\\text{ kg}$ na razdalji $4\\text{ m}$. Katera trditev pravilno opisuje opravljeno delo $W$ in pospešek $a$?",
            "explain": "1. korak: Po drugem Newtonovem zakonu $F = ma$ velja $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\n2. korak: Opravljeno delo je $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\n3. korak: Zato je pospešek $5\\text{ m/s}^2$, opravljeno delo pa $40\\text{ J}$.",
            "hints": ["Drugi Newtonov zakon: uporabite formulo $F = ma$.", "Definicija dela: uporabite formulo $W = F \\times s$."],
            "options": [
                "Pospešek je $5\\text{ m/s}^2$, opravljeno delo pa $40\\text{ J}$.",
                "Pospešek je $2\\text{ m/s}^2$, opravljeno delo pa $20\\text{ J}$.",
                "Pospešek je $10\\text{ m/s}^2$, opravljeno delo pa $40\\text{ J}$.",
                "Pospešek je $5\\text{ m/s}^2$, opravljeno delo pa $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fizikalno Raziskovanje (Nadaljevalno)] Mehanski problem, ki analizira {title}. Telo z maso $m = 1\\text{ kg}$ prosto pada iz mirovanja z višine $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, zračni upor zanemarite). Katera trditev o ohranitvi mehanske energije in končni hitrosti $v$ je pravilna?",
            "explain": "1. korak: Brez zračnega upora se mehanska energija med celotnim padanjem ohranja.\n2. korak: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3. korak: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Ohranitev mehanske energije: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mehanska energija se ohranja, hitrost tik pred trkom pa je približno $19.8\\text{ m/s}$.",
                "Mehanska energija se zmanjšuje, hitrost tik pred trkom pa je približno $9.8\\text{ m/s}$.",
                "Ohranja se le potencialna energija, kinetična energija pa je nič.",
                "Gravitacijski pospešek se spreminja s časom, zato hitrosti ni mogoče izračunati."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kemijsko Raziskovanje] Raziskovalni problem o temi {title}. Pri $25^\\circ\\text{C}$ in $1\\text{ atm}$ je molarna prostornina plina $24.5\\text{ L/mol}$. Kolikšna je prostornina v $\\text{L}$ za $0.2\\text{ mol}$ tega plina pri enakih pogojih?",
            "explain": "1. korak: Po Avogadrovem zakonu je prostornina plina $V$ premo sorazmerna z množino snovi $n$.\n2. korak: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n3. korak: Izračun da $V = 4.90\\text{ L}$.",
            "hints": ["Pri stalni T in P je prostornina premo sorazmerna z množino molov.", "Izračunajte $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kemijsko Raziskovanje (Nadaljevalno)] Kvantitativna analiza o temi {title}. Kisla raztopina $A$ ima $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, raztopina $B$ pa $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Kolikokrat je koncentracija vodikovih ionov v $A$ večja kot v $B$?",
            "explain": "1. korak: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2. korak: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3. korak: Raztopina $A$ ima 100-krat večjo koncentracijo $[\\text{H}^+]$ kot raztopina $B$.",
            "hints": ["Izračunajte razmerje $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Pravila za potence: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{-krat}$", "$100\\text{-krat}$", "$1000\\text{-krat}$", "$0.01\\text{-krat}$"]
        },
        "thinking1": "Logično sklepanje in analiza",
        "goal": "Uporabite načela teme {title} za rešitev raziskovalnega problema."
    },
    "mk": {
        "math_Q1": {
            "prompt": "[{grade} Математичко Истражување] Истражувачко прашање за темата {title}. Дадени се два природни броја $A$ и $B$ кои го задоволуваат $A + 2B = 24$. Која е вредноста на $B$ кога $A$ ја зема својата најголема можна вредност?",
            "explain": "Чекор 1: Со преуредување добиваме $A = 24 - 2B$.\nЧекор 2: Бидејќи $A, B \\ge 1$ се природни броеви, $2B$ мора да биде минимално за $A$ да биде максимално.\nЧекор 3: Најмалиот природен број е $B = 1$.\nЧекор 4: Во оваа точка $A = 24 - 2(1) = 22$ (максимум), па $B = 1$.",
            "hints": ["Минималната природна вредност за $B$ е $1$.", "Бидејќи $A = 24 - 2B$, $A$ е максимално кога $B$ е минимално."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Математичко Истражување (Напредно)] Сложена истражувачка задача користејќи {title}. Збирот на три последователни природни броја е $3S$, а производот на најмалиот и најголемиот плус $1$ е еднаков на $T^2$. Кога $S = 15$, кој е најголемиот од овие три броја?",
            "explain": "Чекор 1: Означувајќи ги броевите како $n-1, n, n+1$, нивниот збир е $3n = 3S \\Rightarrow n = S = 15$.\nЧекор 2: Броевите се $14, 15, 16$.\nЧекор 3: Најголемиот број е $16$.\nЧекор 4: Проверка: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Означувањето на последователни броеви како $n-1, n, n+1$ дава збир $3n$.", "Средниот број е $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Физичко Истражување] Истражувачки проблем што ги применува принципите на {title}. На хоризонтална површина без триење постојана хоризонтална сила $F = 10\\text{ N}$ дејствува на тело со маса $m = 2\\text{ kg}$ на растојание од $4\\text{ m}$. Кое тврдење правилно ја опишува извршената работа $W$ и забрзувањето $a$?",
            "explain": "Чекор 1: Според вториот Њутнов закон $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nЧекор 2: Извршената работа е $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nЧекор 3: Затоа, забрзувањето е $5\\text{ m/s}^2$, а извршената работа е $40\\text{ J}$.",
            "hints": ["Втор Њутнов закон: користете ја формулата $F = ma$.", "Дефиниција за работа: користете ја формулата $W = F \\times s$."],
            "options": [
                "Забрзувањето е $5\\text{ m/s}^2$, а извршената работа е $40\\text{ J}$.",
                "Забрзувањето е $2\\text{ m/s}^2$, а извршената работа е $20\\text{ J}$.",
                "Забрзувањето е $10\\text{ m/s}^2$, а извршената работа е $40\\text{ J}$.",
                "Забрзувањето е $5\\text{ m/s}^2$, а извршената работа е $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Физичко Истражување (Напредно)] Проблем од механика што анализира {title}. Тело со маса $m = 1\\text{ kg}$ слободно паѓа од мирување од висина $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, занемарете го отпорот на воздухот). Кое тврдење за зачувување на механичката енергија и крајната брзина $v$ е точно?",
            "explain": "Чекор 1: Без отпор на воздухот механичката енергија се зачувува за време на падот.\nЧекор 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nЧекор 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Закон за зачувување на механичката енергија: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Механичката енергија се зачувува, а брзината пред ударот е околу $19.8\\text{ m/s}$.",
                "Механичката енергија се намалува, а брзината пред ударот е околу $9.8\\text{ m/s}$.",
                "Само потенцијалната енергија се зачувува, а кинетичката енергија е нула.",
                "Гравитацијата се менува со времето, па брзината не може да се пресмета."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Хемиско Истражување] Истражувачки проблем за темата {title}. На $25^\\circ\\text{C}$ и $1\\text{ atm}$ моларниот волумен на гас изнесува $24.5\\text{ L/mol}$. Колкав е волуменот во $\\text{L}$ за $0.2\\text{ mol}$ од овој гас при исти услови?",
            "explain": "Чекор 1: Според Авогадровиот закон волуменот на гасот $V$ е правопропорционален на количеството супстанција $n$.\nЧекор 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nЧекор 3: Пресметката дава $V = 4.90\\text{ L}$.",
            "hints": ["При константни T и P волуменот е правопропорционален на моловите.", "Пресметајте $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Хемиско Истражување (Напредно)] Квантитативна анализа за темата {title}. Киселиот раствор $A$ има $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, а растворот $B$ има $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Колку пати концентрацијата на водородни јони во $A$ е поголема од онаа во $B$?",
            "explain": "Чекор 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nЧекор 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nЧекор 3: Растворот $A$ има 100 пати поголема концентрација $[\\text{H}^+]$ од растворот $B$.",
            "hints": ["Пресметајте го односот $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Правила за степени: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ пати}$", "$100\\text{ пати}$", "$1000\\text{ пати}$", "$0.01\\text{ пати}$"]
        },
        "thinking1": "Логичко расудување и анализа",
        "goal": "Применете ги принципите на {title} за решавање на истражувачкиот проблем."
    },
    "lt": {
        "math_Q1": {
            "prompt": "[{grade} Matematinis Tyrimas] Tyrimo klausimas apie {title}. Duoti du natūralieji skaičiai $A$ ir $B$, tenkinantys lygtį $A + 2B = 24$. Kokia yra $B$ reikšmė, kai $A$ įgyja didžiausią įmanomą reikšmę?",
            "explain": "1 žingsnis: Pertvarkę lygtį gauname $A = 24 - 2B$.\n2 žingsnis: Kadangi $A, B \\ge 1$ yra natūralieji skaičiai, $2B$ turi būti mažiausias, kad $A$ būtų didžiausias.\n3 žingsnis: Mažiausias natūralusis skaičius yra $B = 1$.\n4 žingsnis: Tuomet $A = 24 - 2(1) = 22$ (didžiausia reikšmė), todėl $B = 1$.",
            "hints": ["Mažiausia natūraliojo skaičiaus reikšmė $B$ yra $1$.", "Kadangi $A = 24 - 2B$, $A$ yra didžiausias, kai $B$ yra mažiausias."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematinis Tyrimas (Išplėstinis)] Kompleksinė tyrimo užduotis taikant temą {title}. Trijų iš eilės einančių natūraliųjų skaičių suma yra $3S$, o mažiausio ir didžiausio skaičiaus sandauga plius $1$ lygi $T^2$. Kai $S = 15$, koks yra didžiausias iš šių trijų skaičių?",
            "explain": "1 žingsnis: Pažymėję skaičius $n-1, n, n+1$, gauname sumą $3n = 3S \\Rightarrow n = S = 15$.\n2 žingsnis: Skaičiai yra $14, 15, 16$.\n3 žingsnis: Didžiausias skaičius yra $16$.\n4 žingsnis: Patikrinimas: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Iš eilės einančius skaičius pažymėjus $n-1, n, n+1$, suma yra $3n$.", "Vidurinis skaičius yra $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fizikinis Tyrimas] Tyrimo užduotis, taikanti {title} principus. Horizontaliu paviršiumi be trinties $m = 2\\text{ kg}$ masės kūną veikia pastovi horizontali jėga $F = 10\\text{ N}$ $4\\text{ m}$ atstumu. Kuris teiginys teisingai apibūdina atliktą darbą $W$ ir pagreitį $a$?",
            "explain": "1 žingsnis: Pagal antrąjį Niutono dėsnį $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\n2 žingsnis: Atliktas darbas yra $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\n3 žingsnis: Vadinasi, pagreitis yra $5\\text{ m/s}^2$, o atliktas darbas – $40\\text{ J}$.",
            "hints": ["Antrasis Niutono dėsnis: naudokite formulę $F = ma$.", "Darbo apibrėžimas: naudokite formulę $W = F \\times s$."],
            "options": [
                "Pagreitis yra $5\\text{ m/s}^2$, o atliktas darbas yra $40\\text{ J}$.",
                "Pagreitis yra $2\\text{ m/s}^2$, o atliktas darbas yra $20\\text{ J}$.",
                "Pagreitis yra $10\\text{ m/s}^2$, o atliktas darbas yra $40\\text{ J}$.",
                "Pagreitis yra $5\\text{ m/s}^2$, o atliktas darbas yra $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fizikinis Tyrimas (Išplėstinis)] Mechanikos užduotis, analizuojanti {title}. Kūnas, kurio masė $m = 1\\text{ kg}$, paleidžiamas laisvai kristi iš ramybės būsenos iš $h = 20\\text{ m}$ aukščio ($g = 9.8\\text{ m/s}^2$, oro pasipriešinimo nepaisyti). Kuris teiginys apie mechaninės energijos tvermę ir galutinį greitį $v$ yra teisingas?",
            "explain": "1 žingsnis: Nesant oro pasipriešinimo, mechaninė energija kritimo metu išlieka pastovi.\n2 žingsnis: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3 žingsnis: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Mechaninės energijos tvermės dėsnis: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mechaninė energija išlieka pastovi, o greitis prieš pat smūgį yra apie $19.8\\text{ m/s}$.",
                "Mechaninė energija mažėja, o greitis prieš pat smūgį yra apie $9.8\\text{ m/s}$.",
                "Išlieka tik potencinė energija, o kinetinė energija lygi nuliui.",
                "Laisvojo kritimo pagreitis kinta laikui bėgant, todėl greičio apskaičiuoti neįmanoma."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Cheminis Tyrimas] Tyrimo užduotis apie {title}. Esant $25^\\circ\\text{C}$ ir $1\\text{ atm}$, dujų molinis tūris yra $24.5\\text{ L/mol}$. Koks tūris $\\text{L}$ tenka $0.2\\text{ mol}$ šių dujų tokiomis pačiomis sąlygomis?",
            "explain": "1 žingsnis: Pagal Avogadro dėsnį dujų tūris $V$ yra tiesiogiai proporcingas medžiagos kiekiui $n$.\n2 žingsnis: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n3 žingsnis: Apskaičiuota reikšmė $V = 4.90\\text{ L}$.",
            "hints": ["Esant pastoviai T ir P, tūris yra proporcingas molių skaičiui.", "Apskaičiuokite $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Cheminis Tyrimas (Išplėstinis)] Kiekybinė analizė apie {title}. Rūgštinio tirpalo $A$ vandenilio jonų koncentracija $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, o tirpalo $B$ – $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Kiek kartų tirpalo $A$ vandenilio jonų koncentracija didesnė už tirpalo $B$?",
            "explain": "1 žingsnis: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2 žingsnis: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3 žingsnis: Tirpalo $A$ koncentracija yra 100 kartų didesnė nei tirpalo $B$.",
            "hints": ["Apskaičiuokite santykį $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Laipsnių taisyklės: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ kartų}$", "$100\\text{ kartų}$", "$1000\\text{ kartų}$", "$0.01\\text{ karto}$"]
        },
        "thinking1": "Loginis samprotavimas ir analizė",
        "goal": "Taikykite {title} principus tyrimo problemai išspręsti."
    },
    "lv": {
        "math_Q1": {
            "prompt": "[{grade} Matemātiskā Izpēte] Izpētes jautājums par tēmu {title}. Doti divi naturāli skaitļi $A$ un $B$, kas apmierina sakarību $A + 2B = 24$. Kāda ir $B$ vērtība, kad $A$ pieņem savu lielāko iespējamo vērtību?",
            "explain": "1. solis: Pārveidojot vienādojumu, iegūstam $A = 24 - 2B$.\n2. solis: Tā kā $A, B \\ge 1$ ir naturāli skaitļi, $2B$ ir jāsamazina līdz minimumam, lai $A$ būtu maksimāls.\n3. solis: Mazākais naturālais skaitlis ir $B = 1$.\n4. solis: Šajā punktā $A = 24 - 2(1) = 22$ (maksimums), tātad $B = 1$.",
            "hints": ["Mazākā naturālā skaitļa vērtība $B$ ir $1$.", "Tā kā $A = 24 - 2B$, $A$ ir maksimāls, kad $B$ ir minimāls."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matemātiskā Izpēte (Padziļināta)] Sarežģīts izpētes uzdevums, izmantojot {title}. Trīs pēc kārtas esošu naturālu skaitļu summa ir $3S$, un mazākā un lielākā skaitļa reizinājums plus $1$ ir vienāds ar $T^2$. Ja $S = 15$, kurš ir lielākais no šiem trim skaitļiem?",
            "explain": "1. solis: Apzīmējot skaitļus kā $n-1, n, n+1$, to summa ir $3n = 3S \\Rightarrow n = S = 15$.\n2. solis: Skaitļi ir $14, 15, 16$.\n3. solis: Lielākais skaitlis ir $16$.\n4. solis: Pārbaude: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Pēc kārtas esošu skaitļu apzīmēšana ar $n-1, n, n+1$ dod summu $3n$.", "Vidējais skaitlis ir $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fizikas Izpēte] Izpētes uzdevums, lietojot {title} principus. Uz horizontālas virsmas bez berzes nemainīgs horizontāls spēks $F = 10\\text{ N}$ iedarbojas uz ķermeni ar masu $m = 2\\text{ kg}$ $4\\text{ m}$ ceļā. Kurš apgalvojums pareizi raksturo veikto darbu $W$ un paātrinājumu $a$?",
            "explain": "1. solis: Pēc Ņūtona otrā likuma $F = ma$ paātrinājums $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\n2. solis: Veiktais darbs ir $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\n3. solis: Tātad paātrinājums ir $5\\text{ m/s}^2$ un veiktais darbs ir $40\\text{ J}$.",
            "hints": ["Ņūtona otrais likums: izmantojiet formulu $F = ma$.", "Darba definīcija: izmantojiet formulu $W = F \\times s$."],
            "options": [
                "Paātrinājums ir $5\\text{ m/s}^2$, un veiktais darbs ir $40\\text{ J}$.",
                "Paātrinājums ir $2\\text{ m/s}^2$, un veiktais darbs ir $20\\text{ J}$.",
                "Paātrinājums ir $10\\text{ m/s}^2$, un veiktais darbs ir $40\\text{ J}$.",
                "Paātrinājums ir $5\\text{ m/s}^2$, un veiktais darbs ir $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fizikas Izpēte (Padziļināta)] Mehānikas uzdevums, analizējot {title}. Ķermenis ar masu $m = 1\\text{ kg}$ brīvi krīt no miera stāvokļa no augstuma $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, gaisa pretestību neievērot). Kurš apgalvojums par mehāniskās enerģijas saglabāšanos un beigu ātrumu $v$ ir pareizs?",
            "explain": "1. solis: Bez gaisa pretestības mehāniskā enerģija saglabājas visā kritiena laikā.\n2. solis: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3. solis: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Mehāniskās enerģijas saglabāšanās likums: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mehāniskā enerģija saglabājas, un ātrums pirms trieciena ir aptuveni $19.8\\text{ m/s}$.",
                "Mehāniskā enerģija samazinās, un ātrums pirms trieciena ir aptuveni $9.8\\text{ m/s}$.",
                "Saglabājas tikai potenciālā enerģija, un kinētiskā enerģija ir nulle.",
                "Smaguma paātrinājums mainās laikā, tāpēc ātrumu nevar aprēķināt."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Ķīmijas Izpēte] Izpētes uzdevums par tēmu {title}. $25^\\circ\\text{C}$ temperatūrā un $1\\text{ atm}$ spiedienā gāzes molārais tilpums ir $24.5\\text{ L/mol}$. Kāds tilpums $\\text{L}$ ir $0.2\\text{ mol}$ šīs gāzes tādos pašos apstākļos?",
            "explain": "1. solis: Saskaņā ar Avogadro likumu gāzes tilpums $V$ ir tieši proporcionāls vielas daudzumam $n$.\n2. solis: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n3. solis: Aprēķins dod $V = 4.90\\text{ L}$.",
            "hints": ["Pie nemainīgas T un P tilpums ir proporcionāls molu skaitam.", "Aprēķiniet $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Ķīmijas Izpēte (Padziļināta)] Kvantitatīvā analīze par tēmu {title}. Skābā šķīdumā $A$ ūdeņraža jonu koncentrācija ir $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, bet šķīdumā $B$ tā ir $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Cik reižu ūdeņraža jonu koncentrācija šķīdumā $A$ ir lielāka nekā šķīdumā $B$?",
            "explain": "1. solis: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2. solis: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3. solis: Šķīdumā $A$ ūdeņraža jonu koncentrācija ir 100 reizes lielāka nekā šķīdumā $B$.",
            "hints": ["Aprēķiniet attiecību $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Pakāpju īpašības: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ reizes}$", "$100\\text{ reizes}$", "$1000\\text{ reizes}$", "$0.01\\text{ reizes}$"]
        },
        "thinking1": "Loģiskā spriešana un analīze",
        "goal": "Lietojiet {title} principus, lai atrisinātu izpētes uzdevumu."
    },
    "et": {
        "math_Q1": {
            "prompt": "[{grade} Matemaatiline Uurimus] Uurimisküsimus teemal {title}. On antud kaks naturaalarvu $A$ ja $B$, mis rahuldavad võrrandit $A + 2B = 24$. Mis on $B$ väärtus, kui $A$ saavutab oma suurima võimaliku väärtuse?",
            "explain": "1. samm: Võrrandi ümberkorraldamisel saame $A = 24 - 2B$.\n2. samm: Kuna $A, B \\ge 1$ on naturaalarvud, peab $2B$ olema minimaalne, et $A$ oleks maksimaalne.\n3. samm: Väikseim naturaalarv on $B = 1$.\n4. samm: Selles punktis on $A = 24 - 2(1) = 22$ (maksimum), seega $B = 1$.",
            "hints": ["Minimaalne naturaalarvu väärtus $B$ jaoks on $1$.", "Kuna $A = 24 - 2B$, on $A$ maksimaalne siis, kui $B$ on minimaalne."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matemaatiline Uurimus (Süvendatud)] Kompleksne uurimisülesanne teemal {title}. Kolme järjestikuse naturaalarvu summa on $3S$ ning vähima ja suurima arvu korrutis pluss $1$ võrdub $T^2$. Kui $S = 15$, mis on neist kolmest arvust suurim?",
            "explain": "1. samm: Tähistades arvud kui $n-1, n, n+1$, on nende summa $3n = 3S \\Rightarrow n = S = 15$.\n2. samm: Arvud on $14, 15, 16$.\n3. samm: Suurim arv on $16$.\n4. samm: Kontroll: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Järjestikuste arvude tähistamine kujul $n-1, n, n+1$ annab summaks $3n$.", "Keskmine arv on $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Füüsikaline Uurimus] Uurimisülesanne, mis rakendab teema {title} põhimõtteid. Hõõrdevabal horisontaalsel pinnal mõjub kehale massiga $m = 2\\text{ kg}$ püsiv horisontaalne jõud $F = 10\\text{ N}$ teepikkusel $4\\text{ m}$. Milline väide kirjeldab tehtud tööd $W$ ja kiirendust $a$ õigesti?",
            "explain": "1. samm: Newtoni teisest seadusest $F = ma$ saame $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\n2. samm: Tehtud töö on $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\n3. samm: Seega on kiirendus $5\\text{ m/s}^2$ ja tehtud töö $40\\text{ J}$.",
            "hints": ["Newtoni teine seadus: kasuta valemit $F = ma$.", "Töö definitsioon: kasuta valemit $W = F \\times s$."],
            "options": [
                "Kiirendus on $5\\text{ m/s}^2$ ja tehtud töö on $40\\text{ J}$.",
                "Kiirendus on $2\\text{ m/s}^2$ ja tehtud töö on $20\\text{ J}$.",
                "Kiirendus on $10\\text{ m/s}^2$ ja tehtud töö on $40\\text{ J}$.",
                "Kiirendus on $5\\text{ m/s}^2$ ja tehtud töö on $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Füüsikaline Uurimus (Süvendatud)] Mehaanikaülesanne, mis analüüsib teemat {title}. Keha massiga $m = 1\\text{ kg}$ kukub vabalt paigalseisust kõrguselt $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, õhutakistust mitte arvestada). Milline väide mehaanilise energia jäävuse ja lõppkiiruse $v$ kohta on õige?",
            "explain": "1. samm: Ilma õhutakistuseta on mehaaniline energia kogu langemise vältel jääv.\n2. samm: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3. samm: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Mehaanilise energia jäävuse seadus: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mehaaniline energia on jääv ja kiirus vahetult enne maapinnale jõudmist on u $19.8\\text{ m/s}$.",
                "Mehaaniline energia väheneb ja kiirus vahetult enne maapinnale jõudmist on u $9.8\\text{ m/s}$.",
                "Ainult potentsiaalne energia säilib ja kineetiline energia on null.",
                "Raskuskiirendus muutub ajas, mistõttu kiirust ei saa arvutada."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Keemiline Uurimus] Uurimisülesanne teemal {title}. Temperatuuril $25^\\circ\\text{C}$ ja rõhul $1\\text{ atm}$ on gaasi molaarruumala $24.5\\text{ L/mol}$. Kui suur on ruumala ühikutes $\\text{L}$ $0.2\\text{ mol}$ selle gaasi jaoks samadel tingimustel?",
            "explain": "1. samm: Avogadro seaduse kohaselt on gaasi ruumala $V$ võrdeline ainehulgaga $n$.\n2. samm: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n3. samm: Arvutus annab $V = 4.90\\text{ L}$.",
            "hints": ["Püsival T ja P on ruumala võrdeline moolide arvuga.", "Arvuta $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Keemiline Uurimus (Süvendatud)] Kvantitatiivne analüüs teemal {title}. Happelise lahuse $A$ vesinikioonide kontsentratsioon on $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ ja lahuse $B$ oma $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Mitu korda on lahuse $A$ vesinikioonide kontsentratsioon suurem kui lahuses $B$?",
            "explain": "1. samm: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2. samm: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3. samm: Lahuses $A$ on 100 korda suurem vesinikioonide kontsentratsioon kui lahuses $B$.",
            "hints": ["Arvuta suhe $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Astmereeglid: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ korda}$", "$100\\text{ korda}$", "$1000\\text{ korda}$", "$0.01\\text{ korda}$"]
        },
        "thinking1": "Loogiline arutlemine ja analüüs",
        "goal": "Rakenda teema {title} põhimõtteid uurimisülesande lahendamiseks."
    },
    "fi": {
        "math_Q1": {
            "prompt": "[{grade} Matemaattinen Tutkimus] Tutkimustehtävä aiheesta {title}. Olkoon kaksi luonnollista lukua $A$ ja $B$, jotka toteuttavat yhtälön $A + 2B = 24$. Mikä on $B$:n arvo, kun $A$ saa suurimman mahdollisen arvonsa?",
            "explain": "Vaihe 1: Muokkaamalla yhtälöä saadaan $A = 24 - 2B$.\nVaihe 2: Koska $A, B \\ge 1$ ovat luonnollisia lukuja, arvon $2B$ on oltava mahdollisimman pieni, jotta $A$ on suurin mahdollinen.\nVaihe 3: Pienin luonnollinen luku on $B = 1$.\nVaihe 4: Tällöin $A = 24 - 2(1) = 22$ (maksimi), joten $B = 1$.",
            "hints": ["Pienin luonnollinen luku $B$:lle on $1$.", "Koska $A = 24 - 2B$, $A$ on suurin silloin, kun $B$ on pienin."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matemaattinen Tutkimus (Syventävä)] Vaativa tutkimustehtävä aiheesta {title}. Kolmen peräkkäisen luonnollisen luvun summa on $3S$, ja pienimmän ja suurimman luvun tulo plus $1$ on yhtä suuri kuin $T^2$. Kun $S = 15$, mikä on näistä kolmesta luvusta suurin?",
            "explain": "Vaihe 1: Merkitään lukuja $n-1, n, n+1$, jolloin summa on $3n = 3S \\Rightarrow n = S = 15$.\nVaihe 2: Luvut ovat $14, 15, 16$.\nVaihe 3: Suurin luku on $16$.\nVaihe 4: Tarkistus: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Peräkkäisten lukujen merkitseminen muodossa $n-1, n, n+1$ antaa summaksi $3n$.", "Keskimmäinen luku on $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fysiikan Tutkimus] Tutkimustehtävä, jossa sovelletaan aihetta {title}. Kitkattomalla vaakasuoralla pinnalla kappaleeseen, jonka massa on $m = 2\\text{ kg}$, vaikuttaa vakio vaakasuora voima $F = 10\\text{ N}$ $4\\text{ m}$:n matkalla. Mikä väitteistä kuvaa tehtyä työtä $W$ ja kiihtyvyyttä $a$ oikein?",
            "explain": "Vaihe 1: Newtonin toisen lain $F = ma$ mukaan $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nVaihe 2: Tehty työ on $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nVaihe 3: Kiihtyvyys on siis $5\\text{ m/s}^2$ ja tehty työ $40\\text{ J}$.",
            "hints": ["Newtonin toinen laki: käytä kaavaa $F = ma$.", "Työn määritelmä: käytä kaavaa $W = F \\times s$."],
            "options": [
                "Kiihtyvyys on $5\\text{ m/s}^2$ ja tehty työ on $40\\text{ J}$.",
                "Kiihtyvyys on $2\\text{ m/s}^2$ ja tehty työ on $20\\text{ J}$.",
                "Kiihtyvyys on $10\\text{ m/s}^2$ ja tehty työ on $40\\text{ J}$.",
                "Kiihtyvyys on $5\\text{ m/s}^2$ ja tehty työ on $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fysiikan Tutkimus (Syventävä)] Mekaniikan tutkimustehtävä aiheesta {title}. Kappale, jonka massa on $m = 1\\text{ kg}$, pudotetaan levosta vapaassa pudotuksessa korkeudelta $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, ilmanvastus jätetään huomiotta). Mikä mekaanisen energian säilymistä ja loppunopeutta $v$ koskeva väite on oikea?",
            "explain": "Vaihe 1: Ilman ilmanvastusta mekaaninen energia säilyy koko pudotuksen ajan.\nVaihe 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nVaihe 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Mekaanisen energian säilymislaki: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mekaaninen energia säilyy ja nopeus juuri ennen maahan osumista on noin $19.8\\text{ m/s}$.",
                "Mekaaninen energia pienenee ja nopeus juuri ennen maahan osumista on noin $9.8\\text{ m/s}$.",
                "Vain potentiaalienergia säilyy ja liike-energia on nolla.",
                "Putoamiskiihtyvyys muuttuu ajan myötä, joten nopeutta ei voi laskea."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kemian Tutkimus] Tutkimustehtävä aiheesta {title}. Lämpötilassa $25^\\circ\\text{C}$ ja paineessa $1\\text{ atm}$ kaasun moolitilavuus on $24.5\\text{ L/mol}$. Mikä on tilavuus litroina ($\\text{L}$) $0.2\\text{ mol}$:lle tätä kaasua samoissa olosuhteissa?",
            "explain": "Vaihe 1: Avogadron lain mukaan kaasun tilavuus $V$ on suoraan verrannollinen ainemäärään $n$.\nVaihe 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nVaihe 3: Laskutoimitus antaa $V = 4.90\\text{ L}$.",
            "hints": ["Vakiolämpötilassa ja -paineessa tilavuus on suoraan verrannollinen moolimäärään.", "Laske $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kemian Tutkimus (Syventävä)] Kvantitatiivinen analyysi aiheesta {title}. Happaman liuoksen $A$ vetyionipitoisuus on $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ ja liuoksen $B$ on $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Kuinka monta kertaa suurempi on liuoksen $A$ vetyionipitoisuus kuin liuoksen $B$?",
            "explain": "Vaihe 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nVaihe 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nVaihe 3: Liuoksen $A$ vetyionipitoisuus on 100 kertaa suurempi kuin liuoksen $B$.",
            "hints": ["Laske suhde $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Potenssien laskusäännöt: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ kertaa}$", "$100\\text{ kertaa}$", "$1000\\text{ kertaa}$", "$0.01\\text{ kertaa}$"]
        },
        "thinking1": "Looginen päättely ja analyysi",
        "goal": "Sovella aiheen {title} periaatteita tutkimustehtävän ratkaisemiseksi."
    },
    "hu": {
        "math_Q1": {
            "prompt": "[{grade} Matematikai Vizsgálat] Kutatási feladat a(z) {title} témakörben. Adott két természetes szám, $A$ és $B$, amelyekre teljesül az $A + 2B = 24$ egyenlet. Mennyi $B$ értéke, amikor $A$ a lehető legnagyobb értéket veszi fel?",
            "explain": "1. lépés: Az egyenlet átrendezésével $A = 24 - 2B$.\n2. lépés: Mivel $A, B \\ge 1$ természetes számok, $2B$-nek minimálisnak kell lennie, hogy $A$ maximális legyen.\n3. lépés: A legkisebb természetes szám a $B = 1$.\n4. lépés: Ekkor $A = 24 - 2(1) = 22$ (maximum), így $B = 1$.",
            "hints": ["A legkisebb természetes szám $B$ esetén $1$.", "Mivel $A = 24 - 2B$, $A$ akkor maximális, ha $B$ minimális."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematikai Vizsgálat (Haladó)] Összetett vizsgálati feladat a(z) {title} témakörben. Három egymást követő természetes szám összege $3S$, és a legkisebb és legnagyobb szorzata plusz $1$ egyenlő $T^2$-tel. Ha $S = 15$, mennyi a legnagyobb e három szám közül?",
            "explain": "1. lépés: A számokat $n-1, n, n+1$ alakban felírva az összegük $3n = 3S \\Rightarrow n = S = 15$.\n2. lépés: A számok: $14, 15, 16$.\n3. lépés: A legnagyobb szám a $16$.\n4. lépés: Ellenőrzés: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Az egymást követő számok felírása $n-1, n, n+1$ alakban $3n$ összeget ad.", "A középső szám $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fizikai Vizsgálat] Vizsgálati feladat a(z) {title} elveinek alkalmazására. Súrlódásmentes vízszintes felületen egy állandó $F = 10\\text{ N}$ vízszintes erő hat egy $m = 2\\text{ kg}$ tömegű testre $4\\text{ m}$ elmozdulás során. Melyik állítás írja le helyesen az elvégzett $W$ munkát és az $a$ gyorsulást?",
            "explain": "1. lépés: Newton második törvénye alapján ($F = ma$): $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\n2. lépés: Az elvégzett munka $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\n3. lépés: Ezért a gyorsulás $5\\text{ m/s}^2$, az elvégzett munka pedig $40\\text{ J}$.",
            "hints": ["Newton második törvénye: használd az $F = ma$ képletet.", "A munka definíciója: használd a $W = F \\times s$ képletet."],
            "options": [
                "A gyorsulás $5\\text{ m/s}^2$, az elvégzett munka pedig $40\\text{ J}$.",
                "A gyorsulás $2\\text{ m/s}^2$, az elvégzett munka pedig $20\\text{ J}$.",
                "A gyorsulás $10\\text{ m/s}^2$, az elvégzett munka pedig $40\\text{ J}$.",
                "A gyorsulás $5\\text{ m/s}^2$, az elvégzett munka pedig $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fizikai Vizsgálat (Haladó)] Mechanikai feladat a(z) {title} elemzésére. Egy $m = 1\\text{ kg}$ tömegű test nyugalomból szabadon esik $h = 20\\text{ m}$ magasságból ($g = 9.8\\text{ m/s}^2$, a közegellenállást elhanyagoljuk). Melyik állítás helyes a mechanikai energia megmaradásáról és a $v$ végsebességről?",
            "explain": "1. lépés: Közegellenállás hiányában a mechanikai energia az esés során végig megmarad.\n2. lépés: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\n3. lépés: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["A mechanikai energia megmaradásának törvénye: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "A mechanikai energia megmarad, és a becsapódás előtti sebesség kb. $19.8\\text{ m/s}$.",
                "A mechanikai energia csökken, és a becsapódás előtti sebesség kb. $9.8\\text{ m/s}$.",
                "Csak a helyzeti energia marad meg, a mozgási energia nulla.",
                "A nehézségi gyorsulás változik az idővel, így a sebesség nem számítható ki."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kémiai Vizsgálat] Vizsgálati feladat a(z) {title} témakörben. $25^\\circ\\text{C}$-on és $1\\text{ atm}$ nyomáson egy gáz moláris térfogata $24.5\\text{ L/mol}$. Mekkora térfogatot foglal el $\\text{L}$-ben $0.2\\text{ mol}$ ebből a gázból azonos körülmények között?",
            "explain": "1. lépés: Avogadro törvénye szerint a gáz térfogata ($V$) egyenesen arányos az anyagmennyiséggel ($n$).\n2. lépés: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\n3. lépés: A számítás eredménye $V = 4.90\\text{ L}$.",
            "hints": ["Állandó T és P esetén a térfogat arányos az anyagmennyiséggel.", "Számítsd ki: $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kémiai Vizsgálat (Haladó)] Kvantitatív elemzés a(z) {title} témakörben. Az $A$ savas oldat hidrogénion-koncentrációja $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, a $B$ oldaté pedig $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Hányszor nagyobb az $A$ oldat hidrogénion-koncentrációja, mint a $B$ oldaté?",
            "explain": "1. lépés: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\n2. lépés: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\n3. lépés: Az $A$ oldat hidrogénion-koncentrációja 100-szor nagyobb, mint a $B$ oldaté.",
            "hints": ["Számítsd ki a $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$ arányt.", "Hatványozás azonosságai: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{-szer}$", "$100\\text{-szor}$", "$1000\\text{-szer}$", "$0.01\\text{-szer}$"]
        },
        "thinking1": "Logikus gondolkodás és elemzés",
        "goal": "Alkalmazd a(z) {title} elveit a vizsgálati probléma megoldásához."
    }
}
