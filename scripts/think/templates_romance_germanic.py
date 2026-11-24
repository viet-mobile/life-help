# -*- coding: utf-8 -*-
"""
Curriculum templates for Romance and Germanic languages:
pt, it, ca, ro, nl, da, sv, no, is, af
"""

TEMPLATES_GROUP_1 = {
    "pt": {
        "math_Q1": {
            "prompt": "[{grade} Investigação Matemática] Questão de investigação sobre {title}. Dados dois números naturais $A$ e $B$ satisfazendo a relação $A + 2B = 24$, quando $A$ assume seu valor máximo possível, qual é o valor de $B$?",
            "explain": "Passo 1: Reorganizando a equação obtemos $A = 24 - 2B$.\nPasso 2: Como $A$ e $B$ são números naturais, $B \\ge 1$ e $A \\ge 1$.\nPasso 3: Para que $A$ seja máximo, $2B$ deve ser minimizado, logo $B = 1$.\nPasso 4: Nesse ponto, $A = 24 - 2(1) = 22$ (máximo), portanto $B = 1$.",
            "hints": ["O valor natural mínimo para $B$ é $1$.", "Como $A = 24 - 2B$, $A$ é maximizado quando $B$ é minimizado."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Investigação Matemática (Avançada)] Problema investigativo complexo utilizando {title}. A soma de três números naturais consecutivos é $3S$, e o produto do menor e do maior mais $1$ é igual a $T^2$. Quando $S = 15$, qual é o maior desses três números?",
            "explain": "Passo 1: Representando os números como $n-1, n, n+1$, a soma é $3n = 3S \\Rightarrow n = S = 15$.\nPasso 2: Os números são $14, 15, 16$.\nPasso 3: O maior número é $16$.\nPasso 4: Verificação: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Representar números consecutivos como $n-1, n, n+1$ resulta na soma $3n$.", "O número do meio é $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Investigação de Física] Problema aplicando princípios de {title}. Em uma superfície horizontal sem atrito, uma força horizontal constante $F = 10\\text{ N}$ atua sobre um objeto de massa $m = 2\\text{ kg}$ ao longo de $4\\text{ m}$. Qual afirmação descreve corretamente o trabalho $W$ realizado e a aceleração $a$?",
            "explain": "Passo 1: Pela segunda lei de Newton $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nPasso 2: O trabalho realizado é $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nPasso 3: Portanto, a aceleração é $5\\text{ m/s}^2$ e o trabalho é $40\\text{ J}$.",
            "hints": ["Segunda lei de Newton: use a fórmula $F = ma$.", "Definição de trabalho: use a fórmula $W = F \\times s$."],
            "options": [
                "A aceleração é $5\\text{ m/s}^2$ e o trabalho realizado é $40\\text{ J}$.",
                "A aceleração é $2\\text{ m/s}^2$ e o trabalho realizado é $20\\text{ J}$.",
                "A aceleração é $10\\text{ m/s}^2$ e o trabalho realizado é $40\\text{ J}$.",
                "A aceleração é $5\\text{ m/s}^2$ e o trabalho realizado é $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Investigação de Física (Avançada)] Problema de mecânica analisando {title}. Um objeto de massa $m = 1\\text{ kg}$ é solto do repouso a uma altura $h = 20\\text{ m}$ em queda livre ($g = 9.8\\text{ m/s}^2$, desconsidere a resistência do ar). Qual afirmação sobre a conservação da energia mecânica e a velocidade final $v$ está correta?",
            "explain": "Passo 1: Sem resistência do ar, a energia mecânica é conservada durante a queda.\nPasso 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nPasso 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Conservação da energia mecânica: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "A energia mecânica é conservada e a velocidade antes do impacto é de aprox. $19.8\\text{ m/s}$.",
                "A energia mecânica diminui e a velocidade antes do impacto é de aprox. $9.8\\text{ m/s}$.",
                "Apenas a energia potencial é conservada e a energia cinética é zero.",
                "A gravidade varia com o tempo, logo a velocidade não pode ser calculada."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Investigação de Química] Problema de indagação sobre {title}. A $25^\\circ\\text{C}$ e $1\\text{ atm}$, o volume molar de um gás é $24.5\\text{ L/mol}$. Nas mesmas condições, qual é o volume em $\\text{L}$ de $0.2\\text{ mol}$ desse gás?",
            "explain": "Passo 1: Pela lei de Avogadro, o volume $V$ é diretamente proporcional aos mols $n$.\nPasso 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nPasso 3: O cálculo resulta em $V = 4.90\\text{ L}$.",
            "hints": ["Sob temperatura e pressão constantes, o volume é proporcional aos mols.", "Calcule $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Investigação de Química (Avançada)] Análise quantitativa sobre {title}. A solução ácida $A$ tem $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ e a solução $B$ tem $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Quantas vezes a concentração de íons de hidrogênio de $A$ é maior que a de $B$?",
            "explain": "Passo 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nPasso 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nPasso 3: A solução $A$ tem concentração de $[\\text{H}^+]$ 100 vezes maior que a solução $B$.",
            "hints": ["Calcule a razão $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Regra dos expoentes: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ vezes}$", "$100\\text{ vezes}$", "$1000\\text{ vezes}$", "$0.01\\text{ vezes}$"]
        },
        "thinking1": "Raciocínio lógico e análise",
        "goal": "Aplica os princípios de {title} para resolver o problema de raciocínio."
    },
    "it": {
        "math_Q1": {
            "prompt": "[{grade} Indagine Matematica] Domanda di indagine su {title}. Dati due numeri naturali $A$ e $B$ che soddisfano $A + 2B = 24$, quando $A$ assume il valore massimo possibile, qual è il valore di $B$?",
            "explain": "Passo 1: Riorganizzando l'equazione otteniamo $A = 24 - 2B$.\nPasso 2: Poiché $A$ e $B$ sono numeri naturali, $B \\ge 1$ e $A \\ge 1$.\nPasso 3: Affinché $A$ sia massimo, $2B$ deve essere minimizzato, quindi $B = 1$.\nPasso 4: In questo punto, $A = 24 - 2(1) = 22$ (massimo), quindi $B = 1$.",
            "hints": ["Il valore naturale minimo per $B$ è $1$.", "Dato che $A = 24 - 2B$, $A$ è massimo quando $B$ è minimo."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Indagine Matematica (Avanzata)] Problema di indagine complesso utilizzando {title}. La somma di tre numeri naturali consecutivi è $3S$, e il prodotto del minore e del maggiore più $1$ è uguale a $T^2$. Quando $S = 15$, qual è il maggiore tra questi tre numeri?",
            "explain": "Passo 1: Esprimendo i numeri come $n-1, n, n+1$, la loro somma è $3n = 3S \\Rightarrow n = S = 15$.\nPasso 2: I numeri sono $14, 15, 16$.\nPasso 3: Il numero maggiore è $16$.\nPasso 4: Verifica: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Rappresentare i numeri consecutivi come $n-1, n, n+1$ dà somma $3n$.", "Il numero centrale è $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Indagine Fisica] Problema applicativo sui principi di {title}. Su una superficie orizzontale priva di attrito, una forza costante $F = 10\\text{ N}$ agisce su un oggetto di massa $m = 2\\text{ kg}$ per uno spostamento di $4\\text{ m}$. Quale affermazione descrive correttamente il lavoro $W$ compiuto e l'accelerazione $a$?",
            "explain": "Passo 1: Dalla seconda legge di Newton $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nPasso 2: Il lavoro compiuto è $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nPasso 3: Pertanto, l'accelerazione è $5\\text{ m/s}^2$ e il lavoro compiuto è $40\\text{ J}$.",
            "hints": ["Seconda legge di Newton: usa la formula $F = ma$.", "Definizione di lavoro: usa la formula $W = F \\times s$."],
            "options": [
                "L'accelerazione è $5\\text{ m/s}^2$ e il lavoro compiuto è $40\\text{ J}$.",
                "L'accelerazione è $2\\text{ m/s}^2$ e il lavoro compiuto è $20\\text{ J}$.",
                "L'accelerazione è $10\\text{ m/s}^2$ e il lavoro compiuto è $40\\text{ J}$.",
                "L'accelerazione è $5\\text{ m/s}^2$ e il lavoro compiuto è $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Indagine Fisica (Avanzata)] Problema di meccanica che analizza {title}. Un oggetto di massa $m = 1\\text{ kg}$ viene lasciato cadere da fermo da un'altezza $h = 20\\text{ m}$ in caduta libera ($g = 9.8\\text{ m/s}^2$, trascurare la resistenza dell'aria). Quale affermazione sulla conservazione dell'energia meccanica e la velocità finale $v$ è corretta?",
            "explain": "Passo 1: Senza resistenza dell'aria, l'energia meccanica si conserva durante la caduta.\nPasso 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nPasso 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Conservazione dell'energia meccanica: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "L'energia meccanica si conserva e la velocità prima dell'impatto è di circa $19.8\\text{ m/s}$.",
                "L'energia meccanica diminuisce e la velocità prima dell'impatto è di circa $9.8\\text{ m/s}$.",
                "Solo l'energia potenziale si conserva e l'energia cinetica è zero.",
                "La gravità varia con il tempo, quindi la velocità non può essere calcolata."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Indagine Chimica] Problema di indagine su {title}. A $25^\\circ\\text{C}$ e $1\\text{ atm}$, il volume molare di un gas è $24.5\\text{ L/mol}$. Nelle stesse condizioni, qual è il volume in $\\text{L}$ di $0.2\\text{ mol}$ di questo gas?",
            "explain": "Passo 1: Per la legge di Avogadro, il volume $V$ è direttamente proporzionale alle moli $n$.\nPasso 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nPasso 3: Il calcolo dà $V = 4.90\\text{ L}$.",
            "hints": ["A temperatura e pressione costanti, il volume è proporzionale alle moli.", "Calcola $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Indagine Chimica (Avanzata)] Analisi quantitativa su {title}. La soluzione acida $A$ ha $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ e la soluzione $B$ ha $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Di quante volte la concentrazione di ioni idrogeno di $A$ è maggiore di quella di $B$?",
            "explain": "Passo 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nPasso 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nPasso 3: La soluzione $A$ ha una concentrazione 100 volte superiore rispetto alla soluzione $B$.",
            "hints": ["Calcola il rapporto $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Regola degli esponenti: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ volte}$", "$100\\text{ volte}$", "$1000\\text{ volte}$", "$0.01\\text{ volte}$"]
        },
        "thinking1": "Ragionamento logico e analisi",
        "goal": "Applica i principi di {title} per risolvere il problema di ragionamento."
    },
    "ca": {
        "math_Q1": {
            "prompt": "[{grade} Investigació Matemàtica] Pregunta d'investigació sobre {title}. Donats dos nombres naturals $A$ i $B$ que compleixen la relació $A + 2B = 24$, quan $A$ pren el seu valor màxim possible, quin és el valor de $B$?",
            "explain": "Pas 1: Reordenant l'equació tenim $A = 24 - 2B$.\nPas 2: Com que $A$ i $B$ són nombres naturals, $B \\ge 1$ i $A \\ge 1$.\nPas 3: Perquè $A$ sigui màxim, $2B$ ha de ser mínim, per tant $B = 1$.\nPas 4: En aquest punt, $A = 24 - 2(1) = 22$ (màxim), per tant $B = 1$.",
            "hints": ["El valor natural mínim per a $B$ és $1$.", "Com que $A = 24 - 2B$, $A$ es maximitza quan $B$ és mínim."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Investigació Matemàtica (Avançada)] Problema d'investigació complex utilitzant {title}. La suma de tres nombres naturals consecutius és $3S$, i el producte del més petit i el més gran més $1$ és igual a $T^2$. Quan $S = 15$, quin és el més gran d'aquests tres nombres?",
            "explain": "Pas 1: Representant els nombres com a $n-1, n, n+1$, la seva suma és $3n = 3S \\Rightarrow n = S = 15$.\nPas 2: Els nombres són $14, 15, 16$.\nPas 3: El nombre més gran és $16$.\nPas 4: Comprovació: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Representar nombres consecutius com a $n-1, n, n+1$ dóna una suma $3n$.", "El nombre del mig és $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Investigació de Física] Problema aplicant els principis de {title}. En una superfície horitzontal sense fricció, una força constant $F = 10\\text{ N}$ actua sobre un objecte de massa $m = 2\\text{ kg}$ al llarg de $4\\text{ m}$. Quina afirmació descriu correctament el treball $W$ realitzat i l'acceleració $a$?",
            "explain": "Pas 1: Per la segona llei de Newton $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nPas 2: El treball realitzat és $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nPas 3: Per tant, l'acceleració és $5\\text{ m/s}^2$ i el treball és $40\\text{ J}$.",
            "hints": ["Segona llei de Newton: fes servir la fórmula $F = ma$.", "Definició de treball: fes servir la fórmula $W = F \\times s$."],
            "options": [
                "L'acceleració és $5\\text{ m/s}^2$ i el treball realitzat és $40\\text{ J}$.",
                "L'acceleració és $2\\text{ m/s}^2$ i el treball realitzat és $20\\text{ J}$.",
                "L'acceleració és $10\\text{ m/s}^2$ i el treball realitzat és $40\\text{ J}$.",
                "L'acceleració és $5\\text{ m/s}^2$ i el treball realitzat és $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Investigació de Física (Avançada)] Problema de mecànica que analitza {title}. Un objecte de massa $m = 1\\text{ kg}$ es deixa caure des del repòs a una alçada $h = 20\\text{ m}$ en caiguda lliure ($g = 9.8\\text{ m/s}^2$, ignora la resistència de l'aire). Quina afirmació sobre la conservació de l'energia mecànica i la velocitat final $v$ és correcta?",
            "explain": "Pas 1: Sense resistència de l'aire, l'energia mecànica es conserva durant la caiguda.\nPas 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nPas 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Conservació de l'energia mecànica: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "L'energia mecànica es conserva i la velocitat abans de l'impacte és d'aprox. $19.8\\text{ m/s}$.",
                "L'energia mecànica disminueix i la velocitat abans de l'impacte és d'aprox. $9.8\\text{ m/s}$.",
                "Només es conserva l'energia potencial i l'energia cinètica és zero.",
                "La gravetat varia amb el temps, per la qual cosa no es pot calcular la velocitat."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Investigació de Química] Problema d'indagació sobre {title}. A $25^\\circ\\text{C}$ i $1\\text{ atm}$, el volum molar d'un gas és $24.5\\text{ L/mol}$. En les mateixes condicions, quin és el volum en $\\text{L}$ de $0.2\\text{ mol}$ d'aquest gas?",
            "explain": "Pas 1: Per la llei d'Avogadro, el volum $V$ és directament proporcional als mols $n$.\nPas 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nPas 3: El càlcul dóna $V = 4.90\\text{ L}$.",
            "hints": ["A temperatura i pressió constants, el volum és proporcional als mols.", "Calcula $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Investigació de Química (Avançada)] Anàlisi quantitativa sobre {title}. La dissolució àcida $A$ té $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ i la dissolució $B$ té $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Quantes vegades és més gran la concentració d'ions hidrogen d'$A$ que la de $B$?",
            "explain": "Pas 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nPas 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nPas 3: La dissolució $A$ té una concentració 100 vegades superior a la de la dissolució $B$.",
            "hints": ["Calcula la raó $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Regla de les potències: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ vegades}$", "$100\\text{ vegades}$", "$1000\\text{ vegades}$", "$0.01\\text{ vegades}$"]
        },
        "thinking1": "Raoament lògic i anàlisi",
        "goal": "Aplica els principis de {title} per resoldre el problema de raonament."
    },
    "ro": {
        "math_Q1": {
            "prompt": "[{grade} Explorare Matematică] Întrebare de investigație despre {title}. Fiind date două numere naturale $A$ și $B$ care satisfac relația $A + 2B = 24$, când $A$ are valoarea maximă posibilă, care este valoarea lui $B$?",
            "explain": "Pasul 1: Reorganizând ecuația obținem $A = 24 - 2B$.\nPasul 2: Deoarece $A$ și $B$ sunt numere naturale, $B \\ge 1$ și $A \\ge 1$.\nPasul 3: Pentru ca $A$ să fie maxim, $2B$ trebuie minimizat, deci $B = 1$.\nPasul 4: În acest punct, $A = 24 - 2(1) = 22$ (maxim), deci $B = 1$.",
            "hints": ["Cea mai mică valoare naturală pentru $B$ este $1$.", "Deoarece $A = 24 - 2B$, $A$ este maxim când $B$ este minim."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Explorare Matematică (Avansată)] Problemă complexă de investigație utilizând {title}. Suma a trei numere naturale consecutive este $3S$, iar produsul dintre cel mai mic și cel mai mare plus $1$ este egal cu $T^2$. Când $S = 15$, care este cel mai mare dintre aceste trei numere?",
            "explain": "Pasul 1: Notând numerele cu $n-1, n, n+1$, suma lor este $3n = 3S \\Rightarrow n = S = 15$.\nPasul 2: Numerele sunt $14, 15, 16$.\nPasul 3: Cel mai mare număr este $16$.\nPasul 4: Verificare: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Reprezentarea numerelor consecutive ca $n-1, n, n+1$ dă suma $3n$.", "Numărul din mijloc este $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Explorare Fizică] Problemă de investigație aplicând principiile din {title}. Pe o suprafață orizontală fără frecare, o forță constantă $F = 10\\text{ N}$ acționează asupra unui obiect de masă $m = 2\\text{ kg}$ pe o distanță de $4\\text{ m}$. Care afirmație descrie corect lucrul mecanic $W$ efectuat și accelerația $a$?",
            "explain": "Pasul 1: Conform legii a doua a lui Newton $F = ma$, $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nPasul 2: Lucrul mecanic efectuat este $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nPasul 3: Prin urmare, accelerația este $5\\text{ m/s}^2$ și lucrul mecanic este $40\\text{ J}$.",
            "hints": ["Legea a doua a lui Newton: folosiți formula $F = ma$.", "Definiția lucrului mecanic: folosiți $W = F \\times s$."],
            "options": [
                "Accelerația este $5\\text{ m/s}^2$ și lucrul mecanic efectuat este $40\\text{ J}$.",
                "Accelerația este $2\\text{ m/s}^2$ și lucrul mecanic efectuat este $20\\text{ J}$.",
                "Accelerația este $10\\text{ m/s}^2$ și lucrul mecanic efectuat este $40\\text{ J}$.",
                "Accelerația este $5\\text{ m/s}^2$ și lucrul mecanic efectuat este $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Explorare Fizică (Avansată)] Problemă de mecanică analizând {title}. Un obiect de masă $m = 1\\text{ kg}$ este lăsat să cadă liber din repaus de la înălțimea $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, se ignoră rezistența aerului). Care afirmație despre conservarea energiei mecanice și viteza finală $v$ este corectă?",
            "explain": "Pasul 1: Fără rezistența aerului, energia mecanică se conservă în timpul căderii.\nPasul 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nPasul 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Conservarea energiei mecanice: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Energia mecanică se conservă, iar viteza chiar înainte de impact este de aprox. $19.8\\text{ m/s}$.",
                "Energia mecanică scade, iar viteza chiar înainte de impact este de aprox. $9.8\\text{ m/s}$.",
                "Doar energia potențială se conservă, iar energia cinetică este zero.",
                "Gravitația variază în timp, prin urmare viteza nu poate fi calculată."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Explorare Chimică] Problemă de investigație despre {title}. La $25^\\circ\\text{C}$ și $1\\text{ atm}$, volumul molar al unui gaz este $24.5\\text{ L/mol}$. În aceleași condiții, care este volumul în $\\text{L}$ ocupat de $0.2\\text{ mol}$ din acest gaz?",
            "explain": "Pasul 1: Conform legii lui Avogadro, volumul gazului $V$ este direct proporțional cu numărul de moli $n$.\nPasul 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nPasul 3: Calculul dă $V = 4.90\\text{ L}$.",
            "hints": ["La temperatură și presiune constante, volumul este proporțional cu numărul de moli.", "Calculați $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Explorare Chimică (Avansată)] Problemă de analiză cantitativă despre {title}. Soluția acidă $A$ are $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, iar soluția $B$ are $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. De câte ori este mai mare concentrația ionilor de hidrogen din $A$ față de $B$?",
            "explain": "Pasul 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nPasul 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nPasul 3: Soluția $A$ are o concentrație de ioni de hidrogen de 100 de ori mai mare decât soluția $B$.",
            "hints": ["Calculați raportul $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Regula exponenților: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["de $10\\text{ ori}$", "de $100\\text{ ori}$", "de $1000\\text{ ori}$", "de $0.01\\text{ ori}$"]
        },
        "thinking1": "Raționament logic și analiză",
        "goal": "Aplică principiile din {title} pentru a rezolva problema de raționament."
    },
    "nl": {
        "math_Q1": {
            "prompt": "[{grade} Wiskundig Onderzoek] Onderzoeksvraag over {title}. Gegeven twee natuurlijke getallen $A$ en $B$ die voldoen aan $A + 2B = 24$, wat is de waarde van $B$ wanneer $A$ de maximaal mogelijke waarde aanneemt?",
            "explain": "Stap 1: Herschikken geeft $A = 24 - 2B$.\nStap 2: Aangezien $A, B \\ge 1$ natuurlijke getallen zijn, moet $2B$ geminimaliseerd worden om $A$ te maximaliseren.\nStap 3: Het kleinste natuurlijke getal is $B = 1$.\nStap 4: Op dit punt is $A = 24 - 2(1) = 22$ (maximum), dus $B = 1$.",
            "hints": ["De minimale waarde voor het natuurlijke getal $B$ is $1$.", "Omdat $A = 24 - 2B$, is $A$ maximaal wanneer $B$ minimaal is."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Wiskundig Onderzoek (Gevorderd)] Complexe onderzoeksvraag met behulp van {title}. De som van drie opeenvolgende natuurlijke getallen is $3S$, en het product van de kleinste en grootste plus $1$ is gelijk aan $T^2$. Wanneer $S = 15$, wat is het grootste van deze drie getallen?",
            "explain": "Stap 1: Laten we de getallen $n-1, n, n+1$ noemen, hun som is $3n = 3S \\Rightarrow n = S = 15$.\nStap 2: De getallen zijn $14, 15, 16$.\nStap 3: Het grootste getal is $16$.\nStap 4: Controle: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Opeenvolgende getallen weergeven als $n-1, n, n+1$ levert de som $3n$ op.", "Het middelste getal is $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Natuurkundig Onderzoek] Onderzoeksvraag waarin principes van {title} worden toegepast. Op een wrijvingsloos horizontaal oppervlak werkt een constante horizontale kracht $F = 10\\text{ N}$ op een voorwerp met massa $m = 2\\text{ kg}$ over een afstand van $4\\text{ m}$. Welke uitspraak beschrijft de verrichte arbeid $W$ en de versnelling $a$ juist?",
            "explain": "Stap 1: Volgens de tweede wet van Newton $F = ma$ is $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nStap 2: De verrichte arbeid is $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nStap 3: Daarom is de versnelling $5\\text{ m/s}^2$ en de verrichte arbeid $40\\text{ J}$.",
            "hints": ["Tweede wet van Newton: gebruik de formule $F = ma$.", "Definitie van arbeid: gebruik de formule $W = F \\times s$."],
            "options": [
                "De versnelling is $5\\text{ m/s}^2$ en de verrichte arbeid is $40\\text{ J}$.",
                "De versnelling is $2\\text{ m/s}^2$ en de verrichte arbeid is $20\\text{ J}$.",
                "De versnelling is $10\\text{ m/s}^2$ en de verrichte arbeid is $40\\text{ J}$.",
                "De versnelling is $5\\text{ m/s}^2$ en de verrichte arbeid is $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Natuurkundig Onderzoek (Gevorderd)] Mechanica-vraagstuk over {title}. Een voorwerp met massa $m = 1\\text{ kg}$ valt vanuit stilstand in vrije val vanaf een hoogte $h = 20\\text{ m}$ ($g = 9.8\\text{ m/s}^2$, verwaarloos luchtweerstand). Welke uitspraak over het behoud van mechanische energie en de eindsnelheid $v$ is juist?",
            "explain": "Stap 1: Zonder luchtweerstand blijft de mechanische energie tijdens de val behouden.\nStap 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nStap 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Behoud van mechanische energie: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mechanische energie blijft behouden en de snelheid vlak voor de botsing is ca. $19.8\\text{ m/s}$.",
                "Mechanische energie neemt af en de snelheid vlak voor de botsing is ca. $9.8\\text{ m/s}$.",
                "Alleen potentiële energie blijft behouden en kinetische energie is nul.",
                "De zwaartekracht varieert met de tijd, waardoor de snelheid niet kan worden berekend."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Scheikundig Onderzoek] Onderzoeksvraag over {title}. Bij $25^\\circ\\text{C}$ en $1\\text{ atm}$ is het molaire volume van een gas $24.5\\text{ L/mol}$. Wat is onder dezelfde omstandigheden het volume in $\\text{L}$ van $0.2\\text{ mol}$ van dit gas?",
            "explain": "Stap 1: Volgens de wet van Avogadro is het gasvolume $V$ recht evenredig met het aantal mol $n$.\nStap 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nStap 3: Berekening levert $V = 4.90\\text{ L}$ op.",
            "hints": ["Bij constante T en P is het volume recht evenredig met de stofhoeveelheid in mol.", "Bereken $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Scheikundig Onderzoek (Gevorderd)] Kwantitatieve analyse over {title}. Zure oplossing $A$ heeft $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ en oplossing $B$ heeft $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Hoeveel keer groter is de waterstofionenconcentratie van $A$ dan die van $B$?",
            "explain": "Stap 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nStap 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nStap 3: Oplossing $A$ heeft een 100 keer hogere $[\\text{H}^+]$ dan oplossing $B$.",
            "hints": ["Bereken de verhouding $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Machtsregels: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ keer}$", "$100\\text{ keer}$", "$1000\\text{ keer}$", "$0.01\\text{ keer}$"]
        },
        "thinking1": "Logisch redeneren en analyse",
        "goal": "Pas de principes van {title} toe om het redeneervraagstuk op te lossen."
    },
    "da": {
        "math_Q1": {
            "prompt": "[{grade} Matematisk Undersøgelse] Undersøgelsesspørgsmål om {title}. Givet to naturlige tal $A$ og $B$, som opfylder $A + 2B = 24$, hvad er værdien af $B$, når $A$ antager sin størst mulige værdi?",
            "explain": "Trin 1: Omsætning af ligningen giver $A = 24 - 2B$.\nTrin 2: Da $A, B \\ge 1$ er naturlige tal, skal $2B$ minimeres for at maksimere $A$.\nTrin 3: Det mindste naturlige tal er $B = 1$.\nTrin 4: På dette punkt er $A = 24 - 2(1) = 22$ (maksimum), så $B = 1$.",
            "hints": ["Den mindste naturlige talværdi for $B$ er $1$.", "Da $A = 24 - 2B$, maksimeres $A$, når $B$ minimeres."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematisk Undersøgelse (Avanceret)] Komplekst undersøgelsesspørgsmål ved hjælp af {title}. Summen af tre på hinanden følgende naturlige tal er $3S$, og produktet af det mindste og største plus $1$ er lig med $T^2$. Når $S = 15$, hvad er så det største af disse tre tal?",
            "explain": "Trin 1: Hvis tallene betegnes $n-1, n, n+1$, er deres sum $3n = 3S \\Rightarrow n = S = 15$.\nTrin 2: Tallene er $14, 15, 16$.\nTrin 3: Det største tal er $16$.\nTrin 4: Kontrol: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["At udtrykke på hinanden følgende tal som $n-1, n, n+1$ giver summen $3n$.", "Det midterste tal er $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fysikundersøgelse] Undersøgelsesproblem, der anvender principperne for {title}. På en friktionsfri vandret overflade virker en konstant vandret kraft $F = 10\\text{ N}$ på et objekt med massen $m = 2\\text{ kg}$ over en strækning på $4\\text{ m}$. Hvilket udsagn beskriver det udførte arbejde $W$ og accelerationen $a$ korrekt?",
            "explain": "Trin 1: Ud fra Newtons anden lov $F = ma$ fås $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nTrin 2: Det udførte arbejde er $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nTrin 3: Derfor er accelerationen $5\\text{ m/s}^2$, og det udførte arbejde er $40\\text{ J}$.",
            "hints": ["Newtons anden lov: brug formlen $F = ma$.", "Definition af arbejde: brug formlen $W = F \\times s$."],
            "options": [
                "Accelerationen er $5\\text{ m/s}^2$, og det udførte arbejde er $40\\text{ J}$.",
                "Accelerationen er $2\\text{ m/s}^2$, og det udførte arbejde er $20\\text{ J}$.",
                "Accelerationen er $10\\text{ m/s}^2$, og det udførte arbejde er $40\\text{ J}$.",
                "Accelerationen er $5\\text{ m/s}^2$, og det udførte arbejde er $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fysikundersøgelse (Avanceret)] Mekanikproblem, der analyserer {title}. Et objekt med massen $m = 1\\text{ kg}$ slippes fra hvile i højden $h = 20\\text{ m}$ i frit fald ($g = 9.8\\text{ m/s}^2$, se bort fra luftmodstand). Hvilket udsagn om bevarelse af mekanisk energi og sluthastigheden $v$ er korrekt?",
            "explain": "Trin 1: Uden luftmodstand bevares den mekaniske energi under hele faldet.\nTrin 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nTrin 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Bevarelse af mekanisk energi: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Den mekaniske energi bevares, og hastigheden lige før nedslaget er ca. $19.8\\text{ m/s}$.",
                "Den mekaniske energi aftager, og hastigheden lige før nedslaget er ca. $9.8\\text{ m/s}$.",
                "Kun potentiel energi bevares, og kinetisk energi er nul.",
                "Tyngdeaccelerationen varierer med tiden, så hastigheden kan ikke beregnes."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kemiundersøgelse] Undersøgelsesproblem om {title}. Ved $25^\\circ\\text{C}$ og $1\\text{ atm}$ er det molære volumen for en gas $24.5\\text{ L/mol}$. Hvad er volumenet i $\\text{L}$ af $0.2\\text{ mol}$ af denne gas under samme betingelser?",
            "explain": "Trin 1: Ifølge Avogadros lov er gasvolumenet $V$ direkte proportionalt med stofmængden $n$.\nTrin 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nTrin 3: Beregningen giver $V = 4.90\\text{ L}$.",
            "hints": ["Ved konstant T og P er volumenet ligefrem proportionalt med stofmængden.", "Beregn $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kemiundersøgelse (Avanceret)] Kvantitativ analyse om {title}. Den sure opløsning $A$ har $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$, og opløsning $B$ har $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Hvor mange gange større er hydrogenionkoncentrationen i $A$ end i $B$?",
            "explain": "Trin 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nTrin 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nTrin 3: Opløsning $A$ har 100 gange højere $[\\text{H}^+]$ end opløsning $B$.",
            "hints": ["Beregn forholdet $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Potensregler: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ gange}$", "$100\\text{ gange}$", "$1000\\text{ gange}$", "$0.01\\text{ gange}$"]
        },
        "thinking1": "Logisk ræsonnement og analyse",
        "goal": "Anvend principperne i {title} til at løse undersøgelsesproblemet."
    },
    "sv": {
        "math_Q1": {
            "prompt": "[{grade} Matematisk Undersökning] Undersökningsfråga om {title}. Givet två naturliga tal $A$ och $B$ som uppfyller $A + 2B = 24$, vad är värdet på $B$ när $A$ antar sitt största möjliga värde?",
            "explain": "Steg 1: Omformulering ger $A = 24 - 2B$.\nSteg 2: Eftersom $A, B \\ge 1$ är naturliga tal måste $2B$ minimeras för att $A$ ska maximeras.\nSteg 3: Det minsta naturliga talet är $B = 1$.\nSteg 4: Vid denna punkt är $A = 24 - 2(1) = 22$ (maximum), så $B = 1$.",
            "hints": ["Det minsta naturliga talvärdet för $B$ är $1$.", "Eftersom $A = 24 - 2B$ maximeras $A$ när $B$ minimeras."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematisk Undersökning (Avancerad)] Komplex undersökningsfråga med hjälp av {title}. Summan av tre på varandra följande naturliga tal är $3S$, och produkten av det minsta och största plus $1$ är lika med $T^2$. När $S = 15$, vad är det största av dessa tre tal?",
            "explain": "Steg 1: Om talen betecknas $n-1, n, n+1$ är summan $3n = 3S \\Rightarrow n = S = 15$.\nSteg 2: Talen är $14, 15, 16$.\nSteg 3: Det största talet är $16$.\nSteg 4: Kontroll: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Att skriva på varandra följande tal som $n-1, n, n+1$ ger summan $3n$.", "Mellantalet är $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fysikalisk Undersökning] Undersökningsuppgift som tillämpar principerna för {title}. På en friktionsfri horisontell yta verkar en konstant horisontell kraft $F = 10\\text{ N}$ på ett föremål med massan $m = 2\\text{ kg}$ över en sträcka på $4\\text{ m}$. Vilket påstående beskriver det uträttade arbetet $W$ och accelerationen $a$ korrekt?",
            "explain": "Steg 1: Enligt Newtons andra lag $F = ma$ är $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nSteg 2: Det uträttade arbetet är $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nSteg 3: Därför är accelerationen $5\\text{ m/s}^2$ och det uträttade arbetet $40\\text{ J}$.",
            "hints": ["Newtons andra lag: använd formeln $F = ma$.", "Definition av arbete: använd formeln $W = F \\times s$."],
            "options": [
                "Accelerationen är $5\\text{ m/s}^2$ och det uträttade arbetet är $40\\text{ J}$.",
                "Accelerationen är $2\\text{ m/s}^2$ och det uträttade arbetet är $20\\text{ J}$.",
                "Accelerationen är $10\\text{ m/s}^2$ och det uträttade arbetet är $40\\text{ J}$.",
                "Accelerationen är $5\\text{ m/s}^2$ och det uträttade arbetet är $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fysikalisk Undersökning (Avancerad)] Mekanikproblem som analyserar {title}. Ett föremål med massan $m = 1\\text{ kg}$ släpps från vila från höjden $h = 20\\text{ m}$ i fritt fall ($g = 9.8\\text{ m/s}^2$, bortse från luftmotstånd). Vilket påstående om bevarande av mekanisk energi och sluthastigheten $v$ är korrekt?",
            "explain": "Steg 1: Utan luftmotstånd bevaras den mekaniska energin under hela fallet.\nSteg 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nSteg 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Bevarande av mekanisk energi: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mekanisk energi bevaras och hastigheten strax före nedslaget är ca $19.8\\text{ m/s}$.",
                "Mekanisk energi minskar och hastigheten strax före nedslaget är ca $9.8\\text{ m/s}$.",
                "Endast potentiell energi bevaras och rörelseenergin är noll.",
                "Tyngdaccelerationen varierar med tiden, så hastigheten kan inte beräknas."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kemisk Undersökning] Undersökningsuppgift om {title}. Vid $25^\\circ\\text{C}$ och $1\\text{ atm}$ är molvolymen för en gas $24.5\\text{ L/mol}$. Vad är volymen i $\\text{L}$ för $0.2\\text{ mol}$ av denna gas under samma förhållanden?",
            "explain": "Steg 1: Enligt Avogadros lag är gasvolymen $V$ direkt proportionell mot substansmängden $n$.\nSteg 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nSteg 3: Beräkningen ger $V = 4.90\\text{ L}$.",
            "hints": ["Vid konstant T och P är volymen proportionell mot substansmängden.", "Beräkna $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kemisk Undersökning (Avancerad)] Kvantitativ analys om {title}. Sur lösning $A$ har $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ och lösning $B$ har $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Hur många gånger högre är vätejonkoncentrationen i $A$ jämfört med $B$?",
            "explain": "Steg 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nSteg 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nSteg 3: Lösning $A$ har 100 gånger högre $[\\text{H}^+]$ än lösning $B$.",
            "hints": ["Beräkna förhållandet $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Potensregler: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ gånger}$", "$100\\text{ gånger}$", "$1000\\text{ gånger}$", "$0.01\\text{ gånger}$"]
        },
        "thinking1": "Logiskt resonemang och analys",
        "goal": "Tillämpa principerna för {title} för att lösa undersökningsproblemet."
    },
    "no": {
        "math_Q1": {
            "prompt": "[{grade} Matematisk Utforsking] Utforskingsspørsmål om {title}. Gitt to naturlige tall $A$ og $B$ som oppfyller $A + 2B = 24$, hva er verdien av $B$ når $A$ har sin størst mulige verdi?",
            "explain": "Trinn 1: Omsortering gir $A = 24 - 2B$.\nTrinn 2: Siden $A, B \\ge 1$ er naturlige tall, må $2B$ minimeres for at $A$ skal maksimeres.\nTrinn 3: Det minste naturlige tallet er $B = 1$.\nTrinn 4: På dette punktet er $A = 24 - 2(1) = 22$ (maksimum), så $B = 1$.",
            "hints": ["Den minste naturlige tallverdien for $B$ er $1$.", "Siden $A = 24 - 2B$, maksimeres $A$ når $B$ minimeres."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Matematisk Utforsking (Videregående)] Komplekst utforskingsspørsmål ved hjelp av {title}. Summen av tre påfølgende naturlige tall er $3S$, og produktet av det minste og største pluss $1$ er lik $T^2$. Når $S = 15$, hva er det største av disse tre tallene?",
            "explain": "Trinn 1: Ved å angi tallene som $n-1, n, n+1$ er summen $3n = 3S \\Rightarrow n = S = 15$.\nTrinn 2: Tallene er $14, 15, 16$.\nTrinn 3: Det største tallet er $16$.\nTrinn 4: Sjekk: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Å representere påfølgende tall som $n-1, n, n+1$ gir summen $3n$.", "Det midterste tallet er $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fysikkutforsking] Utforskingsproblem som anvender prinsipper fra {title}. På en friksjonsfri horisontal flate virker en konstant horisontal kraft $F = 10\\text{ N}$ på en gjenstand med masse $m = 2\\text{ kg}$ over en strekning på $4\\text{ m}$. Hvilken påstand beskriver utført arbeid $W$ og akselerasjon $a$ riktig?",
            "explain": "Trinn 1: Fra Newtons andre lov $F = ma$ er $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nTrinn 2: Utført arbeid er $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nTrinn 3: Derfor er akselerasjonen $5\\text{ m/s}^2$ og utført arbeid $40\\text{ J}$.",
            "hints": ["Newtons andre lov: bruk formelen $F = ma$.", "Definisjon av arbeid: bruk formelen $W = F \\times s$."],
            "options": [
                "Akselerasjonen er $5\\text{ m/s}^2$ og utført arbeid er $40\\text{ J}$.",
                "Akselerasjonen er $2\\text{ m/s}^2$ og utført arbeid er $20\\text{ J}$.",
                "Akselerasjonen er $10\\text{ m/s}^2$ og utført arbeid er $40\\text{ J}$.",
                "Akselerasjonen er $5\\text{ m/s}^2$ og utført arbeid er $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fysikkutforsking (Videregående)] Mekanikkproblem som analyserer {title}. En gjenstand med masse $m = 1\\text{ kg}$ slippes fra ro i høyden $h = 20\\text{ m}$ i fritt fall ($g = 9.8\\text{ m/s}^2$, se bort fra luftmotstand). Hvilken påstand om bevaring av mekanisk energi og slutthastighet $v$ er riktig?",
            "explain": "Trinn 1: Uten luftmotstand er mekanisk energi bevart gjennom hele fallet.\nTrinn 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nTrinn 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Bevaring av mekanisk energi: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Mekanisk energi er bevart, og farten like før landing er ca. $19.8\\text{ m/s}$.",
                "Mekanisk energi minker, og farten like før landing er ca. $9.8\\text{ m/s}$.",
                "Bare potensiell energi er bevart, og kinetisk energi er null.",
                "Tyngdeakselerasjonen varierer med tiden, så farten kan ikke beregnes."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Kjemiutforsking] Utforskingsproblem om {title}. Ved $25^\\circ\\text{C}$ og $1\\text{ atm}$ er det molare volumet til en gass $24.5\\text{ L/mol}$. Hva er volumet i $\\text{L}$ til $0.2\\text{ mol}$ av denne gassen under samme forhold?",
            "explain": "Trinn 1: Ifølge Avogadros lov er gassvolumet $V$ direkte proporsjonalt med stoffmengden $n$.\nTrinn 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nTrinn 3: Beregningen gir $V = 4.90\\text{ L}$.",
            "hints": ["Ved konstant T og P er volum proporsjonalt med stoffmengde.", "Beregn $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Kjemiutforsking (Videregående)] Kvantitativ analyse om {title}. Sur løsning $A$ har $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ og løsning $B$ har $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Hvor mange ganger større er hydrogenionkonsentrasjonen i $A$ enn i $B$?",
            "explain": "Trinn 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nTrinn 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nTrinn 3: Løsning $A$ har 100 ganger høyere $[\\text{H}^+]$ enn løsning $B$.",
            "hints": ["Beregn forholdet $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Potensregler: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ ganger}$", "$100\\text{ ganger}$", "$1000\\text{ ganger}$", "$0.01\\text{ ganger}$"]
        },
        "thinking1": "Logisk resonnement og analyse",
        "goal": "Bruk prinsippene i {title} for å løse utforskingsproblemet."
    },
    "is": {
        "math_Q1": {
            "prompt": "[{grade} Stærðfræðileg Rannsókn] Rannsóknarspurning um {title}. Gefnar eru tvær náttúrulegar tölur $A$ og $B$ sem uppfylla $A + 2B = 24$. Hvert er gildi $B$ þegar $A$ tekur stærsta mögulega gildi sitt?",
            "explain": "Skref 1: Umröðun gefur $A = 24 - 2B$.\nSkref 2: Þar sem $A, B \\ge 1$ eru náttúrulegar tölur verður að lágmarka $2B$ til að hámarka $A$.\nSkref 3: Minnsta náttúrulega talan er $B = 1$.\nSkref 4: Á þessum tímapunkti er $A = 24 - 2(1) = 22$ (hámark), svo $B = 1$.",
            "hints": ["Minnsta náttúrulega talnagildið fyrir $B$ er $1$.", "Þar sem $A = 24 - 2B$ er $A$ í hámarki þegar $B$ er í lágmarki."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Stærðfræðileg Rannsókn (Framhald)] Flókin rannsóknarspurning sem notar {title}. Summa þriggja samfelldra náttúrulegra talna er $3S$, og margfeldi þeirrar minnstu og stærstu plús $1$ jafngildir $T^2$. Þegar $S = 15$, hver er stærsta talan af þessum þremur?",
            "explain": "Skref 1: Ef tölurnar eru táknaðar sem $n-1, n, n+1$ er summan $3n = 3S \\Rightarrow n = S = 15$.\nSkref 2: Tölurnar eru $14, 15, 16$.\nSkref 3: Stærsta talan er $16$.\nSkref 4: Athugun: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Að tákna samfelldar tölur sem $n-1, n, n+1$ gefur summu $3n$.", "Miðtalan er $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Eðlisfræðileg Rannsókn] Rannsóknardæmi sem beitir lögmálum {title}. Á núningslausu láréttu yfirborði verkar stöðugur láréttur kraftur $F = 10\\text{ N}$ á hlut með massa $m = 2\\text{ kg}$ yfir vegalengdina $4\\text{ m}$. Hvaða staðhæfing lýsir vinnunni $W$ og hröðuninni $a$ rétt?",
            "explain": "Skref 1: Samkvæmt öðru lögmáli Newtons $F = ma$ er $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nSkref 2: Unnin vinna er $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nSkref 3: Því er hröðunin $5\\text{ m/s}^2$ og unnin vinna $40\\text{ J}$.",
            "hints": ["Annað lögmál Newtons: notaðu formúluna $F = ma$.", "Skilgreining á vinnu: notaðu formúluna $W = F \\times s$."],
            "options": [
                "Hröðunin er $5\\text{ m/s}^2$ og unnin vinna er $40\\text{ J}$.",
                "Hröðunin er $2\\text{ m/s}^2$ og unnin vinna er $20\\text{ J}$.",
                "Hröðunin er $10\\text{ m/s}^2$ og unnin vinna er $40\\text{ J}$.",
                "Hröðunin er $5\\text{ m/s}^2$ og unnin vinna er $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Eðlisfræðileg Rannsókn (Framhald)] Aflfræðidæmi sem greinir {title}. Hlutur með massa $m = 1\\text{ kg}$ er látinn falla úr kyrrstöðu úr hæðinni $h = 20\\text{ m}$ í frjálsu falli ($g = 9.8\\text{ m/s}^2$, sleppið loftmótstöðu). Hvaða staðhæfing um varðveislu vélrænnar orku og lokahraða $v$ er rétt?",
            "explain": "Skref 1: Án loftmótstöðu varðveitist vélræn orka í gegnum fallið.\nSkref 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nSkref 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Varðveisla vélrænnar orku: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Vélræn orka varðveitist og hraðinn rétt fyrir lendingu er u.þ.b. $19.8\\text{ m/s}$.",
                "Vélræn orka minnkar og hraðinn rétt fyrir lendingu er u.þ.b. $9.8\\text{ m/s}$.",
                "Aðeins stöðuorka varðveitist og hreyfiorka er núll.",
                "Þyngdarhröðun breytist með tíma, svo ekki er hægt að reikna hraða."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Efnafræðileg Rannsókn] Rannsóknardæmi um {title}. Við $25^\\circ\\text{C}$ og $1\\text{ atm}$ er mólrúmmál gass $24.5\\text{ L/mól}$. Hvert er rúmmál í $\\text{L}$ fyrir $0.2\\text{ mól}$ af þessu gasi við sömu skilyrði?",
            "explain": "Skref 1: Samkvæmt lögmáli Avogadros er rúmmál gass $V$ í réttu hlutfalli við mólfjölda $n$.\nSkref 2: $V = n \\times V_m = 0.2\\text{ mól} \\times 24.5\\text{ L/mól}$.\nSkref 3: Útreikningur gefur $V = 4.90\\text{ L}$.",
            "hints": ["Við fast hitastig og þrýsting er rúmmál í réttu hlutfalli við mólfjölda.", "Reiknaðu $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Efnafræðileg Rannsókn (Framhald)] Megindleg greining á {title}. Súr lausn $A$ hefur $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ og lausn $B$ hefur $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Hve mörgum sinnum meiri er vetnisjónastyrkur $A$ en $B$?",
            "explain": "Skref 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nSkref 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nSkref 3: Lausn $A$ hefur 100 sinnum hærri $[\\text{H}^+]$ en lausn $B$.",
            "hints": ["Reiknaðu hlutfallið $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Veldisreglur: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ sinnum}$", "$100\\text{ sinnum}$", "$1000\\text{ sinnum}$", "$0.01\\text{ sinnum}$"]
        },
        "thinking1": "Rökrétt hugsun og greining",
        "goal": "Beittu lögmálum {title} til að leysa rannsóknarverkefnið."
    },
    "af": {
        "math_Q1": {
            "prompt": "[{grade} Wiskundige Ondersoek] Ondersoekvraag oor {title}. Gegee twee natuurlike getalle $A$ en $B$ wat voldoen aan $A + 2B = 24$, wat is die waarde van $B$ wanneer $A$ sy maksimum moontlike waarde aanneem?",
            "explain": "Stap 1: Herrangskikking gee $A = 24 - 2B$.\nStap 2: Aangesien $A, B \\ge 1$ natuurlike getalle is, moet $2B$ geminimeer word sodat $A$ gemaksimeer kan word.\nStap 3: Die kleinste natuurlike getal is $B = 1$.\nStap 4: Op hierdie punt is $A = 24 - 2(1) = 22$ (maksimum), dus $B = 1$.",
            "hints": ["Die minimum natuurlike getalwaarde vir $B$ is $1$.", "Aangesien $A = 24 - 2B$, word $A$ gemaksimeer wanneer $B$ geminimeer word."],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": "[{grade} Wiskundige Ondersoek (Gevorderd)] Komplekse ondersoekvraag met behulp van {title}. Drie opeenvolgende natuurlike getalle tel op tot $3S$, en die produk van die kleinste en grootste plus $1$ is gelyk aan $T^2$. Wanneer $S = 15$, wat is die grootste van hierdie drie getalle?",
            "explain": "Stap 1: As die getalle voorgestel word as $n-1, n, n+1$, is hul som $3n = 3S \\Rightarrow n = S = 15$.\nStap 2: Die getalle is $14, 15, 16$.\nStap 3: Die grootste getal is $16$.\nStap 4: Toets: $(14 \\times 16) + 1 = 224 + 1 = 225 = 15^2$.",
            "hints": ["Om opeenvolgende getalle as $n-1, n, n+1$ voor te stel gee die som $3n$.", "Die middelste getal is $n = S = 15$."],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": "[{grade} Fisika-ondersoek] Ondersoekprobleem wat beginsels van {title} toepas. Op 'n wrywinglose horisontale oppervlak werk 'n konstante horisontale krag $F = 10\\text{ N}$ op 'n voorwerp met massa $m = 2\\text{ kg}$ oor 'n verplasing van $4\\text{ m}$. Watter stelling beskryf die arbeid $W$ verrig en die versnelling $a$ korrek?",
            "explain": "Stap 1: Volgens Newton se tweede wet $F = ma$ is $a = \\frac{F}{m} = \\frac{10\\text{ N}}{2\\text{ kg}} = 5\\text{ m/s}^2$.\nStap 2: Die arbeid verrig is $W = F \\cdot s = 10\\text{ N} \\times 4\\text{ m} = 40\\text{ J}$.\nStap 3: Daarom is die versnelling $5\\text{ m/s}^2$ en arbeid verrig is $40\\text{ J}$.",
            "hints": ["Newton se tweede wet: gebruik die formule $F = ma$.", "Definisie van arbeid: gebruik die formule $W = F \\times s$."],
            "options": [
                "Versnelling is $5\\text{ m/s}^2$ en arbeid verrig is $40\\text{ J}$.",
                "Versnelling is $2\\text{ m/s}^2$ en arbeid verrig is $20\\text{ J}$.",
                "Versnelling is $10\\text{ m/s}^2$ en arbeid verrig is $40\\text{ J}$.",
                "Versnelling is $5\\text{ m/s}^2$ en arbeid verrig is $20\\text{ J}$."
            ]
        },
        "physics_Q2": {
            "prompt": "[{grade} Fisika-ondersoek (Gevorderd)] Meganikaprobleem wat {title} ontleed. 'n Voorwerp met massa $m = 1\\text{ kg}$ word vanuit rus laat val op 'n hoogte van $h = 20\\text{ m}$ in vryval ($g = 9.8\\text{ m/s}^2$, ignoreer lugweerstand). Watter stelling oor behoud van meganiese energie en eindsnelheid $v$ is korrek?",
            "explain": "Stap 1: Sonder lugweerstand bly meganiese energie behoue tydens die val.\nStap 2: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$.\nStap 3: $v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8\\text{ m/s}$.",
            "hints": ["Behoud van meganiese energie: $mgh = \\frac{1}{2}mv^2$.", "$v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$."],
            "options": [
                "Meganiese energie bly behoue en spoed net voor impak is ongeveer $19.8\\text{ m/s}$.",
                "Meganiese energie neem af en spoed net voor impak is ongeveer $9.8\\text{ m/s}$.",
                "Slegs potensiële energie bly behoue en kinetiese energie is nul.",
                "Swaartekrag wissel met tyd, dus kan spoed nie bereken word nie."
            ]
        },
        "chemistry_Q1": {
            "prompt": "[{grade} Chemie-ondersoek] Ondersoekprobleem oor {title}. By $25^\\circ\\text{C}$ en $1\\text{ atm}$ is die molêre volume van 'n gas $24.5\\text{ L/mol}$. Onder dieselfde toestande, wat is die volume in $\\text{L}$ van $0.2\\text{ mol}$ van hierdie gas?",
            "explain": "Stap 1: Volgens Avogadro se wet is gasvolume $V$ direk eweredig aan mol $n$.\nStap 2: $V = n \\times V_m = 0.2\\text{ mol} \\times 24.5\\text{ L/mol}$.\nStap 3: Berekening lewer $V = 4.90\\text{ L}$.",
            "hints": ["Onder konstante T en P is volume eweredig aan mol.", "Bereken $V = n \\times V_m$."],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": "[{grade} Chemie-ondersoek (Gevorderd)] Kwantitatiewe analise oor {title}. Suuroplossing $A$ het $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$ en oplossing $B$ het $[\\text{H}^+] = 1.0 \\times 10^{-5}\\text{ M}$. Hoeveel keer groter is die waterstofioonkonsentrasie van $A$ as $B$?",
            "explain": "Stap 1: $[\\text{H}^+]_A = 10^{-3}\\text{ M}$, $[\\text{H}^+]_B = 10^{-5}\\text{ M}$.\nStap 2: $\\frac{1.0 \\times 10^{-3}}{1.0 \\times 10^{-5}} = 10^{-3 - (-5)} = 10^2 = 100$.\nStap 3: Oplossing $A$ het 'n 100 keer hoër $[\\text{H}^+]$ as oplossing $B$.",
            "hints": ["Bereken die verhouding $\\frac{[\\text{H}^+]_A}{[\\text{H}^+]_B}$.", "Eksponentreëls: $10^{-3} / 10^{-5} = 10^2 = 100$."],
            "options": ["$10\\text{ keer}$", "$100\\text{ keer}$", "$1000\\text{ keer}$", "$0.01\\text{ keer}$"]
        },
        "thinking1": "Logiese beredenering en analise",
        "goal": "Pas die beginsels van {title} toe om die redenasieprobleem op te los."
    }
}
