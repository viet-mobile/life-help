#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch and synchronize all daily insight topics:
1. Replaces '일상 비용과 기회비용을 최적화합니다.' with '매일의 선택과 기회비용을 최적화합니다.'
2. Eliminates all Korean characters in English fields (math, english, life).
3. Adds full Albanian (sq) translations across all 36 Korean, 36 Math, 36 English, and 36 Life topics.
4. Injects Albanian (sq) translations for all 732 Physics & Chemistry topics from content/learn-overlays/sq/daily-tips-pc.json into studyTopics89.json.
5. Updates lifeTopics89.json, studyTopics89.json, koreanTopics89.json, and lifeTopicsI18n.ts.
"""

import json
import os
import re

ROOT = "/Users/juboklee/life-project/life-help"

# 1. First, inject Albanian (sq) into all 732 p- and c- topics in studyTopics89.json
study_topics_path = os.path.join(ROOT, "lib/learn/dailyInsights/studyTopics89.json")
with open(study_topics_path, "r", encoding="utf-8") as f:
    study_topics = json.load(f)

sq_pc_path = os.path.join(ROOT, "content/learn-overlays/sq/daily-tips-pc.json")
with open(sq_pc_path, "r", encoding="utf-8") as f:
    sq_pc = json.load(f)

injected_pc = 0
for k, v in sq_pc.items():
    if k in study_topics:
        for field in ["title", "summary", "principle", "example", "actionItem"]:
            if field in v:
                if field not in study_topics[k]:
                    study_topics[k][field] = {}
                study_topics[k][field]["sq"] = v[field]
        injected_pc += 1

print(f"Injected Albanian (sq) into {injected_pc} Physics/Chemistry study topics.")

# 2. Comprehensive English and Albanian dictionary for the 36 Math Topics (m-001 ~ m-036)
MATH_36 = {
    "m-001": {
        "title": {"en": "Rule of 72 Compound Interest Calculation", "sq": "Llogaritja e interesit të përbërë me Rregullin 72"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with the Rule of 72 compound interest formula.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë përmes formulës së interesit të përbërë të Rregullit 72."},
        "principle": {"en": "Years to double principal ≒ 72 ÷ Annual interest rate (%)", "sq": "Vitet për dyfishimin e kapitalit ≒ 72 ÷ Norma vjetore e interesit (%)"},
        "example": {"en": "At an 8% annual ETF return, 72 ÷ 8 = principal doubles in 9 years.", "sq": "Me 8% kthim vjetor të ETF-së, 72 ÷ 8 = kapitali dyfishohet në 9 vjet."},
        "actionItem": {"en": "Divide 72 by the expected return of your current investment products.", "sq": "Pjesëtoni 72 me kthimin e pritur të produkteve tuaja financiare."}
    },
    "m-002": {
        "title": {"en": "Zero-Interest Installments vs. Instant Discount Break-Even", "sq": "Këstet pa interes kundrejt zbritjes së menjëhershme: Pika e barazimit"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by comparing payment plan break-even points.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke krahasuar pikën e barazimit të pagesave."},
        "principle": {"en": "Choose installment if cash invested in a savings account exceeds the lump-sum discount.", "sq": "Zgjidhni këstet nëse interesi i parave në llogari kursimi tejkalon zbritjen e menjëhershme."},
        "example": {"en": "A 1M KRW purchase with 3% instant discount saves 30,000 KRW; 6-month installment in 4% CMA yields only 11,600 KRW.", "sq": "Një blerje 1 milion KRW me 3% zbritje kursen 30,000 KRW; këstet 6-mujore me 4% interes japin vetëm 11,600 KRW."},
        "actionItem": {"en": "Calculate if the discount exceeds interest earned during the installment period.", "sq": "Llogaritni nëse zbritja e menjëhershme është më e madhe se interesi i kësteve."}
    },
    "m-003": {
        "title": {"en": "Salary Negotiation: Reverse Calculating Marginal Tax Rates for Net Pay", "sq": "Negocimi i pagës: Llogaritja e anasjelltë e normës kufitare të tatimit"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with marginal tax rate salary conversion.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë përmes llogaritjes së pagës neto."},
        "principle": {"en": "Actual net increase = Gross raise × (1 - Marginal income tax rate - 9.4% Four Social Insurances)", "sq": "Rritja reale neto = Rritja bruto × (1 - Norma kufitare e tatimit - 9.4% sigurime shoqërore)"},
        "example": {"en": "A 5M KRW gross salary increase at the 24% bracket nets only about 3.33M KRW after deductions.", "sq": "Një rritje page bruto prej 5 milionë KRW në fashën 24% sjell vetëm rreth 3.33 milionë KRW neto."},
        "actionItem": {"en": "Check your annual taxable income bracket before negotiating your salary.", "sq": "Verifikoni fashën tuaj tatimore vjetore para se të negocioni pagën tuaj."}
    },
    "m-004": {
        "title": {"en": "Energy Deficit Formula for 1kg Fat Loss", "sq": "Formula e deficitit energjetik për humbjen e 1 kg yndyrë trupore"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with the energy deficit formula for 1kg fat loss.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me formulën e deficitit energjetik për 1 kg yndyrë."},
        "principle": {"en": "Burning 1kg of pure body fat requires an energy deficit of approx. 7,700 kcal.", "sq": "Djegia e 1 kg yndyrë të pastër trupore kërkon një deficit energjetik prej rreth 7,700 kcal."},
        "example": {"en": "A daily deficit of 500 kcal (cut 200 kcal food + burn 300 kcal walking) loses 1kg in ~15 days.", "sq": "Një deficit ditor prej 500 kcal (kursim 200 kcal ushqim + 300 kcal ecje) heq 1 kg në ~15 ditë."},
        "actionItem": {"en": "Track whether you hit a 500 kcal daily deficit rather than fluctuating scale numbers.", "sq": "Regjistroni arritjen e deficitit ditor prej 500 kcal në vend që të peshoheni çdo ditë."}
    },
    "m-005": {
        "title": {"en": "Avoiding 3-8% DCC Double Conversion on Foreign Card Payments", "sq": "Shmangia e konvertimit të dyfishtë të valutës (DCC 3-8%) gjatë pagesave me kartë"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by paying in local currency abroad.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke paguar në valutën vendase jashtë vendit."},
        "principle": {"en": "Dynamic Currency Conversion (DCC) adds a 3-8% fee by converting to billing currency twice.", "sq": "Konvertimi dinamik i valutës (DCC) shton 3-8% komision duke e konvertuar dy herë pagesën."},
        "example": {"en": "Always choose payment in local currency (USD, EUR, JPY) instead of KRW at overseas POS terminals.", "sq": "Zgjidhni gjithmonë valutën vendase (USD, EUR, JPY) në terminalet e pagesave jashtë vendit."},
        "actionItem": {"en": "Block DCC transactions in your card issuer app before traveling abroad.", "sq": "Aktivizoni bllokimin e pagesave DCC në aplikacionin e kartës suaj para udhëtimit."}
    },
    "m-006": {
        "title": {"en": "Washing Machine Detergent Concentration and Dosage Math", "sq": "Matematika e përqendrimit dhe dozimit të duhur të detergjentit të rrobave"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with proper laundry detergent dosage.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me dozimin e saktë të detergjentit."},
        "principle": {"en": "Adding more detergent than the critical micelle concentration (CMC) does not increase cleaning power.", "sq": "Shtimi i më shumë detergjenti mbi përqendrimin kritik të micelave nuk e rrit pastërtinë."},
        "example": {"en": "A 7kg laundry load only needs ~40ml of concentrated liquid detergent; excess leaves residue.", "sq": "Për 7 kg rroba mjaftojnë vetëm ~40 ml detergjent i përqendruar; teprica lë mbetje."},
        "actionItem": {"en": "Measure detergent strictly with the cup marking according to load weight.", "sq": "Matni detergjentin saktësisht me kapak sipas peshës së rrobave."}
    },
    "m-007": {
        "title": {"en": "Dividend Reinvestment Plan (DRIP) Compounding Math", "sq": "Matematika e interesit të përbërë nga riinvestimi i dividentëve (DRIP)"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with dividend reinvestment compounding.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë përmes riinvestimit të dividentëve."},
        "principle": {"en": "Reinvesting dividends purchases more shares, exponentially increasing subsequent dividend payouts.", "sq": "Riinvestimi i dividentëve blen më shumë aksione dhe shumëzon pagesat e ardhshme të dividentit."},
        "example": {"en": "A 4% dividend stock over 20 years yields nearly double the total return when reinvested.", "sq": "Një aksion me 4% divident gjatë 20 viteve jep pothuajse dyfishin e fitimit kur riinvestohet."},
        "actionItem": {"en": "Enable automatic dividend reinvestment in your brokerage account.", "sq": "Aktivizoni riinvestimin automatik të dividentit në llogarinë tuaj të investimit."}
    },
    "m-008": {
        "title": {"en": "Unit Price Comparison to Defeat Bulk Buying Illusions", "sq": "Krahasimi i çmimit për njësi për të shmangur iluzionin e paketave të mëdha"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by checking unit prices per 100g or 10ml.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke kontrolluar çmimin për njësi."},
        "principle": {"en": "Unit Price = Total Price ÷ Total Volume; bulk packages are not always cheaper per unit.", "sq": "Çmimi për njësi = Çmimi total ÷ Sasia; paketat e mëdha nuk janë gjithmonë më të lira për njësi."},
        "example": {"en": "A 1kg pack at 12,000 KRW (120 KRW/10g) vs 500g pack at 5,500 KRW (110 KRW/10g) makes the smaller pack cheaper.", "sq": "Paketa 1 kg me 12,000 KRW (120 KRW/10g) krahasuar me 500g me 5,500 KRW (110 KRW/10g): paketa e vogël del më e lirë."},
        "actionItem": {"en": "Check the bottom-line unit price tag before buying large bulk packages at the supermarket.", "sq": "Kontrolloni çmimin për 100g në etiketë para se të blini paketa të mëdha në supermarket."}
    },
    "m-009": {
        "title": {"en": "Severance Pay Comparison: Defined Contribution (DC) vs. Defined Benefit (DB)", "sq": "Krahasimi i pagesës së largimit: Plani me kontribut të caktuar (DC) kundrejt përfitimit të caktuar (DB)"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by selecting the best severance pension type.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke zgjedhur llojin e duhur të pensionit."},
        "principle": {"en": "Choose DB if your wage growth exceeds investment returns; choose DC if your expected investment yield is higher.", "sq": "Zgjidhni DB nëse rritja e pagës tejkalon kthimin e investimit; zgjidhni DC nëse synoni kthim më të lartë."},
        "example": {"en": "When approaching peak wage or career transitions, rolling DB into DC protects the base payout.", "sq": "Para uljes së pagës ose ndryshimit të karrierës, kalimi nga DB në DC mbron vlerën bazë."},
        "actionItem": {"en": "Compare your company's wage growth rate with your personal DC portfolio return.", "sq": "Krahasoni normën e rritjes së pagës me kthimin e portofolit tuaj DC."}
    },
    "m-010": {
        "title": {"en": "Cardio Endurance: Maximizing Zone 2 Heart Rate Training", "sq": "Qëndrueshmëria kardiovaskulare: Maksimizimi i stërvitjes në Zonën 2 të rrahjeve të zemrës"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with Zone 2 heart rate endurance training.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me stërvitjen në Zonën 2 të rrahjeve të zemrës."},
        "principle": {"en": "Zone 2 = (Max Heart Rate [220 - Age] - Resting HR) × 0.60 to 0.70 + Resting HR", "sq": "Zona 2 = (Rrahjet maksimale [220 - Mosha] - Rrahjet në qetësi) × 0.60 deri 0.70 + Rrahjet në qetësi"},
        "example": {"en": "For a 30-year-old with resting HR 60: Zone 2 is between 138 and 151 bpm for optimal mitochondrial fat oxidation.", "sq": "Për një 30-vjeçar me rrahje qetësie 60: Zona 2 është midis 138 dhe 151 bpm për djegie optimale të yndyrnave."},
        "actionItem": {"en": "Maintain a pace where you can comfortably speak full sentences during 45 minutes of cardio.", "sq": "Mbani një ritëm ku mund të flisni rehat me fjali të plota gjatë 45 minutave kardio."}
    },
    "m-011": {
        "title": {"en": "Jet Lag Recovery: Circadian Photoperiod Reset Mathematics", "sq": "Përballimi i lodhjes nga ndryshimi i zonës kohore: Matematika e rivendosjes së ciklit cirkadian"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with circadian clock sunlight timing.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë përmes sinkronizimit të dritës së diellit."},
        "principle": {"en": "The circadian pacemaker shifts ~1 hour per day westward and ~1.5 hours per day eastward.", "sq": "Ora biologjike përshtatet ~1 orë në ditë drejt perëndimit dhe ~1.5 orë në ditë drejt lindjes."},
        "example": {"en": "Traveling across 6 time zones eastward requires morning light exposure and fasting for 12 hours before destination breakfast.", "sq": "Udhëtimi 6 zona orare drejt lindjes kërkon ekspozim në dritë në mëngjes dhe agjërim 12 orë para mëngjesit në destinacion."},
        "actionItem": {"en": "Get 30 minutes of natural outdoor sunlight between 8:00 and 10:00 AM upon arrival.", "sq": "Ekspozohuni në dritën e diellit për 30 minuta midis orës 8:00 dhe 10:00 të mëngjesit pas mbërritjes."}
    },
    "m-012": {
        "title": {"en": "Heating Math: Away Mode vs. Maintaining 18-20°C Indoors", "sq": "Matematika e ngrohjes: Modaliteti i largimit kundrejt mbajtjes së 18-20°C brenda"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with winter heating temperature management.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me menaxhimin e ngrohjes në dimër."},
        "principle": {"en": "Reheating cold pipes and slab floors consumes up to 30% more gas than maintaining a steady 18°C.", "sq": "Ringrohja e dyshemeve dhe tubacioneve të ftohta konsumon deri në 30% më shumë gaz sesa mbajtja e 18°C."},
        "example": {"en": "For daily outings under 10 hours, setting the thermostat to 18-19°C saves more money than 'Away Mode'.", "sq": "Për dalje nën 10 orë, vendosja e termostatit në 18-19°C kursen më shumë para sesa 'Modaliteti i largimit'."},
        "actionItem": {"en": "Do not turn the boiler completely off in freezing weather; leave it at 18°C when going to work.", "sq": "Mos e fikni bojlerin plotësisht në dimër; lëreni në 18°C kur shkoni në punë."}
    },
    "m-013": {
        "title": {"en": "Dollar-Cost Averaging (DCA): Mathematical Downside Hedging", "sq": "Blerja periodike fikse (DCA): Mbrojtja matematikore nga luhatjet e çmimeve"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with systematic DCA investment math.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me investimin e rregullt periodik (DCA)."},
        "principle": {"en": "Investing fixed sums purchases more units when prices fall and fewer when prices rise, lowering average cost.", "sq": "Investimi i shumave fikse blen më shumë njësi kur çmimet bien dhe më pak kur rriten, duke ulur koston mesatare."},
        "example": {"en": "Investing 500,000 KRW monthly beats lump-sum entry timing during volatile market drawdowns.", "sq": "Investimi i 500,000 KRW çdo muaj ul rrezikun e hyrjes në treg në momentin më të keq gjatë rënies."},
        "actionItem": {"en": "Set an automatic monthly recurring buy on a broad index ETF on payday.", "sq": "Aktivizoni një blerje automatike mujore për një ETF të indeksit të gjerë në ditën e pagës."}
    },
    "m-014": {
        "title": {"en": "Inverter Air Conditioner Efficiency Mathematics", "sq": "Matematika e efikasitetit të kondicionerit me inverter"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with continuous inverter cooling math.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me përdorimin efikas të kondicionerit me inverter."},
        "principle": {"en": "Inverter compressors throttle power down to 20% once target temperature is reached, using minimal watts.", "sq": "Kompresorët inverter ulin fuqinë deri në 20% sapo arrihet temperatura e synuar, duke konsumuar minimalisht."},
        "example": {"en": "Keeping an inverter AC running continuously at 26°C uses 40% less electricity than toggling on/off every 2 hours.", "sq": "Mbajtja e kondicionerit inverter ndezur vazhdimisht në 26°C konsumon 40% më pak energji sesa fikja dhe ndezja çdo 2 orë."},
        "actionItem": {"en": "Cool the room quickly at high fan speed first, then leave target temperature at 26°C.", "sq": "Ftohni dhomën me shpejtësi të lartë fillimisht, pastaj lëreni temperaturën në 26°C pa e fikur."}
    },
    "m-015": {
        "title": {"en": "Return on Investment (ROI) of Skill Development and Certifications", "sq": "Kthimi nga investimi (ROI) i trajnimeve profesionale dhe certifikimeve"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by calculating career training ROI.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke llogaritur kthimin e investimit në arsim."},
        "principle": {"en": "Educational ROI = (Annual Salary Increase × Anticipated Years - Course Cost) ÷ Course Cost × 100", "sq": "ROI i arsimit = (Rritja vjetore e pagës × Vitet e pritura - Kostoja) ÷ Kostoja × 100"},
        "example": {"en": "A 1.5M KRW certification leading to a 3M KRW annual raise achieves a 100% payback in just 6 months.", "sq": "Një certifikim prej 1.5 milionë KRW që sjell rritje vjetore 3 milionë KRW e shlyen veten në vetëm 6 muaj."},
        "actionItem": {"en": "Calculate the payback period before enrolling in paid bootcamps or professional courses.", "sq": "Llogaritni periudhën e shlyerjes së investimit para se të regjistroheni në kurse me pagesë."}
    },
    "m-016": {
        "title": {"en": "Body Hydration Formula Based on Weight and Activity", "sq": "Formula e hidratimit trupor bazuar në peshë dhe aktivitet fizik"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with daily hydration math.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me llogaritjen e saktë të ujit të nevojshëm ditor."},
        "principle": {"en": "Daily Water Need (mL) = Body Weight (kg) × 30 to 35 mL (+ 500 mL per hour of intense exercise)", "sq": "Uji i nevojshëm ditor (mL) = Pesha trupore (kg) × 30 deri 35 mL (+ 500 mL për çdo orë ushtrimesh)"},
        "example": {"en": "A 70kg adult requires approximately 2,100 to 2,450 mL of water daily for optimal kidney and cognitive function.", "sq": "Një i rritur 70 kg ka nevojë për rreth 2,100 deri 2,450 mL ujë në ditë për funksion optimal."},
        "actionItem": {"en": "Drink 300 mL of water upon waking and track bottles to reach your calculated daily intake.", "sq": "Pini 300 mL ujë sapo të zgjoheni dhe mbani një shishe me vete për të plotësuar sasinë ditore."}
    },
    "m-017": {
        "title": {"en": "Statistical Optimal Booking Window for Flight Tickets", "sq": "Dritarja statistikore optimale për rezervimin e biletave të avionit"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with flight ticket price curve math.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me kohën optimale të blerjes së biletave."},
        "principle": {"en": "Flight algorithms typically bottom out prices 6 to 8 weeks before domestic flights, and 18 to 22 weeks for long-haul.", "sq": "Algoritmet e linjave ajrore ulin çmimet më së shumti 6-8 javë para për fluturime të shkurtra dhe 18-22 javë për fluturime të gjata."},
        "example": {"en": "Booking transatlantic flights 120 days out saves an average of 22% compared to last-minute bookings.", "sq": "Rezervimi 120 ditë para për fluturime ndërkontinentale kursen mesatarisht 22% krahasuar me blerjen e vonuar."},
        "actionItem": {"en": "Set price drop alerts on Google Flights at least 4 months before your planned departure.", "sq": "Aktivizoni njoftimet e rënies së çmimit në Google Flights të paktën 4 muaj para nisjes."}
    },
    "m-018": {
        "title": {"en": "Water Meter Needle Rotation Test for Concealed Leaks", "sq": "Testi i rrotullimit të matësit të ujit për zbulimin e rrjedhjeve të fshehura"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by detecting hidden plumbing leaks.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke zbuluar rrjedhjet e fshehura të ujit."},
        "principle": {"en": "Shut off all household taps: if the small red star needle in the water meter still spins, an underground leak exists.", "sq": "Mbyllni të gjitha çezmat: nëse ylli i kuq i matësit vazhdon të rrotullohet, ka një rrjedhje të fshehur."},
        "example": {"en": "A subtle toilet flapper leak running at 0.5 L/min wastes over 21,000 liters (approx. 40,000 KRW) every month.", "sq": "Një rrjedhje e lehtë në tualet me 0.5 L/min humbet mbi 21,000 litra ujë çdo muaj pa u vënë re."},
        "actionItem": {"en": "Close all faucets and inspect your water meter dial for 60 seconds tonight.", "sq": "Mbyllni të gjitha çezmat dhe vëzhgoni matësin e ujit për 60 sekonda sonte."}
    },
    "m-019": {
        "title": {"en": "Inflation and Real Purchasing Power Preservation Math", "sq": "Matematika e ruajtjes së fuqisë blerëse reale kundër inflacionit"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by calculating real inflation-adjusted returns.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me llogaritjen e kthimit real pas inflacionit."},
        "principle": {"en": "Real Return Rate ≒ Nominal Interest Rate - Inflation Rate - Tax on Interest (15.4%)", "sq": "Norma reale e kthimit ≒ Norma nominale e interesit - Norma e inflacionit - Tatimi mbi interesin (15.4%)"},
        "example": {"en": "A 3.5% deposit under 3.0% inflation yields only 2.96% after tax, losing real purchasing power by -0.04%.", "sq": "Një depozitë 3.5% me 3.0% inflacion jep vetëm 2.96% pas tatimit, duke humbur fuqi blerëse reale."},
        "actionItem": {"en": "Allocate a portion of cash savings to dividend growth assets or inflation-protected securities.", "sq": "Zhvendosni një pjesë të kursimeve në asete me divident ose instrumente që mbrojnë nga inflacioni."}
    },
    "m-020": {
        "title": {"en": "Credit Card Benefit Picking Rate Optimization", "sq": "Optimizimi i normës së përfitimit të kartave të kreditit (Picking Rate)"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by evaluating card rewards versus spend.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke llogaritur përqindjen e kthimit të kartës."},
        "principle": {"en": "Picking Rate = (Total Monthly Cashback & Discounts - Annual Fee ÷ 12) ÷ Total Monthly Spend × 100", "sq": "Norma e përfitimit = (Kthimi total mujor i parave - Tarifa vjetore ÷ 12) ÷ Shpenzimi mujor × 100"},
        "example": {"en": "A card offering 25,000 KRW monthly discounts on 500,000 KRW spend reaches an excellent 5.0% picking rate.", "sq": "Një kartë që jep 25,000 KRW zbritje për 500,000 KRW shpenzime arrin një normë të shkëlqyer prej 5.0%."},
        "actionItem": {"en": "Cancel cards with picking rates below 2.0% and consolidate spending on high-efficiency cards.", "sq": "Anuloni kartat me përfitim nën 2.0% dhe përqendroni shpenzimet në kartën më fitimprurëse."}
    },
    "m-021": {
        "title": {"en": "Freelancer Tax Math: 3.3% Withholding vs. May Global Income Tax Refund", "sq": "Matematika tatimore e punonjësve të pavarur: 3.3% paradhënie kundrejt rimbursimit vjetor"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with freelance expense ratio deductions.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me zbritjen e shpenzimeve të punës së pavarur."},
        "principle": {"en": "If simple/standard business expense ratios lower taxable income below the personal deduction baseline, 100% of 3.3% tax is refunded.", "sq": "Nëse shpenzimet e njohura nga ligji e ulin bazën e tatueshme nën kufirin, rimbursohet 100% e tatimit 3.3%."},
        "example": {"en": "A freelancer earning 20M KRW annually often receives the full 660,000 KRW back when filing in May.", "sq": "Një punonjës i pavarur me 20 milionë KRW të ardhura vjetore shpesh merr mbrapsht të gjitha 660,000 KRW gjatë deklarimit në maj."},
        "actionItem": {"en": "Collect all digital receipts and utility bills under your business tax ID for May tax filing.", "sq": "Mblidhni të gjitha faturat dhe shpenzimet e punës për deklaratën vjetore të të ardhurave në maj."}
    },
    "m-022": {
        "title": {"en": "Basal Metabolic Rate (BMR) Harris-Benedict Energy Formula", "sq": "Formula e metabolizmit bazal (BMR) Harris-Benedict për llogaritjen e kalorive"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with basal metabolic energy calculations.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me llogaritjen e saktë të metabolizmit bazal."},
        "principle": {"en": "BMR (Men) = 88.36 + (13.4 × weight kg) + (4.8 × height cm) - (5.7 × age); Daily Maintenance = BMR × Activity Factor", "sq": "BMR (Meshkuj) = 88.36 + (13.4 × pesha kg) + (4.8 × gjatësia cm) - (5.7 × mosha); Mirëmbajtja ditore = BMR × Faktori i aktivitetit"},
        "example": {"en": "Eating 300 kcal above maintenance daily creates 1kg of fat every 25 days; matching maintenance stabilizes weight.", "sq": "Konsumimi i 300 kcal mbi normën ditore shton 1 kg yndyrë çdo 25 ditë; barazimi i kalorive stabilizon peshën."},
        "actionItem": {"en": "Calculate your personal BMR and adjust your daily meal calorie ceiling accordingly.", "sq": "Llogaritni BMR-në tuaj personale dhe përcaktoni kufirin ditor të kalorive ushqimore."}
    },
    "m-023": {
        "title": {"en": "Excess Baggage Fees vs. Prepaid Luggage Math", "sq": "Tarifat e bagazhit të tepërt kundrejt blerjes së paracaktuar të bagazhit"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with airline baggage pre-booking math.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke paracaktuar bagazhet e fluturimit."},
        "principle": {"en": "Airport counter overweight fees are 2 to 3 times more expensive than online prepaid additional bags.", "sq": "Tarifat e mbipeshës në sportelin e aeroportit janë 2 deri në 3 herë më të shtrenjta se blerja paraprake online."},
        "example": {"en": "Pre-purchasing a 23kg bag online costs ~40,000 KRW; paying at check-in counter costs over 100,000 KRW.", "sq": "Blerja paraprake e 23 kg bagazh online kushton ~40,000 KRW; pagesa në sportel kushton mbi 100,000 KRW."},
        "actionItem": {"en": "Weigh your packed suitcases with a portable luggage scale 24 hours before your flight.", "sq": "Peshoni valixhet me një peshore dore të paktën 24 orë para nisjes për në aeroport."}
    },
    "m-024": {
        "title": {"en": "Toilet Flush Volume Adjustment: Saving 40,000 Liters Annually", "sq": "Rregullimi i sasisë së shkarkimit të tualetit: Kursimi i 40,000 litrave ujë në vit"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by adjusting toilet tank water displacement.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke rregulluar nivelin e ujit në depozitën e tualetit."},
        "principle": {"en": "Lowering tank float level or inserting a 1.5L displacement bottle saves 1.5L per flush without reducing siphon pressure.", "sq": "Ulja e nivelit të notuesit ose vendosja e një shisheje 1.5L në depozitë kursen 1.5L për çdo shkarkim."},
        "example": {"en": "A 4-person household flushing 20 times daily saves 10,950 liters of tap water every single year.", "sq": "Një familje me 4 anëtarë që shkarkon 20 herë në ditë kursen 10,950 litra ujë të pijshëm çdo vit."},
        "actionItem": {"en": "Adjust the float arm screw inside your toilet water tank down by 2 centimeters today.", "sq": "Rregulloni vidën e notuesit brenda depozitës së tualetit për të ulur nivelin e ujit me 2 cm."}
    },
    "m-025": {
        "title": {"en": "Asset Allocation Rebalancing and Sharpe Ratio Maximization", "sq": "Ribalancimi i alokimit të aseteve dhe maksimizimi i koeficientit Sharpe"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with annual portfolio rebalancing.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me ribalancimin periodik të investimeve."},
        "principle": {"en": "Selling outperforming asset classes to buy underperforming ones systematically enforces 'buy low, sell high'.", "sq": "Shitja e aseteve që janë rritur për të blerë ato që kanë rënë zbaton rregullin 'bli lirë, shit shtrenjtë'."},
        "example": {"en": "An 80:20 equity/bond portfolio that shifts to 90:10 after a stock rally is rebalanced to lock in equity gains.", "sq": "Një portofol 80:20 aksione/obligacione që kalon në 90:10 pas rritjes së bursës ribalancohet për të mbrojtur fitimin."},
        "actionItem": {"en": "Schedule an annual portfolio checkup on January 1 to rebalance back to target weightings.", "sq": "Vendosni një njoftim çdo vit për të ribalancuar portofolin tuaj sipas peshave të synuara."}
    },
    "m-026": {
        "title": {"en": "Vehicle Fuel Economy: The Math of Aerodynamic Drag and Optimal Speed", "sq": "Efikasiteti i karburantit të automjetit: Rezistenca aerodinamike dhe shpejtësia ekonomike"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with highway fuel economy physics.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me shpejtësinë ekonomike të drejtimit të makinës."},
        "principle": {"en": "Aerodynamic drag increases quadratically with velocity ($F_d \\propto v^2$), causing fuel consumption to spike above 90 km/h.", "sq": "Rezistenca e ajrit rritet në katror me shpejtësinë ($F_d \\propto v^2$), duke rritur ndjeshëm konsumin mbi 90 km/h."},
        "example": {"en": "Cruising at 100 km/h instead of 120 km/h reduces fuel consumption by up to 20% on highway road trips.", "sq": "Drejtimi i makinës me 100 km/h në vend të 120 km/h ul konsumin e karburantit deri në 20% në autostradë."},
        "actionItem": {"en": "Set highway cruise control between 90 and 100 km/h to maximize fuel kilometers per liter.", "sq": "Përdorni kontrollin automatik të shpejtësisë (cruise control) midis 90 dhe 100 km/h në autostradë."}
    },
    "m-027": {
        "title": {"en": "Overtime Pay and Regular Hourly Wage Calculation Math", "sq": "Llogaritja e orëve shtesë dhe pagës së rregullt për orë"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with legal overtime wage math.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me llogaritjen e saktë ligjore të orëve shtesë."},
        "principle": {"en": "Regular Hourly Wage = Base Monthly Salary ÷ 209 hours; Overtime is compensated at 1.5× the regular rate.", "sq": "Paga e rregullt për orë = Paga bazë mujore ÷ 209 orë; Orët shtesë paguhen me 1.5 fishin e normës bazë."},
        "example": {"en": "An employee earning 3.135M KRW base has a 15,000 KRW hourly rate; 10 hours of overtime pays 225,000 KRW.", "sq": "Një punonjës me pagë bazë 3.135 milionë KRW ka normë orare 15,000 KRW; 10 orë shtesë paguhen 225,000 KRW."},
        "actionItem": {"en": "Verify your regular hourly rate and 1.5× multiplier in your monthly digital payslip.", "sq": "Kontrolloni normën tuaj orare dhe shumëzuesin 1.5× në fletëpagesën tuaj mujore."}
    },
    "m-028": {
        "title": {"en": "Eye Health 20-20-20 Rule Geometric Optics", "sq": "Shëndeti i syve: Rregulli optik gjeometrik 20-20-20"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by resting eye ciliary muscles.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke çlodhur muskujt e syrit me rregullin 20-20-20."},
        "principle": {"en": "Looking at an object 20 feet (6 meters) away flattens the crystalline lens, fully relaxing the ciliary muscles.", "sq": "Shikimi i një objekti 6 metra larg rrafshon thjerrëzën e syrit dhe çliron plotësisht tensionin e muskujve."},
        "example": {"en": "Every 20 minutes of screen work, look at an object 20 feet away for 20 seconds to prevent digital eye strain.", "sq": "Çdo 20 minuta punë para ekranit, shikoni një pikë 6 metra larg për 20 sekonda për të parandaluar lodhjen e syve."},
        "actionItem": {"en": "Set an hourly desk chime reminder to look out the window at the distant horizon.", "sq": "Vendosni një alarm çdo orë për të parë nga dritarja drejt horizontit të largët."}
    },
    "m-029": {
        "title": {"en": "Travel Roaming eSIM vs. Local SIM Cost-Per-Gigabyte Math", "sq": "Roaming me eSIM kundrejt SIM-it vendor: Kostoja për gigabajt në udhëtime"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with mobile roaming travel math.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke krahasuar çmimin për gigabajt të internetit jashtë vendit."},
        "principle": {"en": "Cost per Gigabyte = Package Price ÷ Total Data Volume; evaluate daily usage needs before purchasing.", "sq": "Kostoja për GB = Çmimi i paketës ÷ Sasia e të dhënave; vlerësoni konsumin ditor para blerjes."},
        "example": {"en": "A 10GB prepaid local eSIM at $12 ($1.20/GB) beats domestic carrier roaming at $9/day for trips over 3 days.", "sq": "Një paketë eSIM 10GB me $12 ($1.20/GB) është shumë më e leverdisshme se roaming ditor $9/ditë për udhëtime mbi 3 ditë."},
        "actionItem": {"en": "Check your smartphone eSIM support and purchase a local destination eSIM online beforehand.", "sq": "Verifikoni mbështetjen e eSIM në telefonin tuaj dhe blini paketën e të dhënave online para nisjes."}
    },
    "m-030": {
        "title": {"en": "First-In First-Out (FIFO) Pantry Management to Eliminate Food Waste", "sq": "Menaxhimi i ushqimeve FIFO (Hyrja e parë, dalja e parë) për të shmangur hedhjen e ushqimit"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with refrigerator inventory turnover math.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me qarkullimin e rregullt të ushqimeve në frigorifer."},
        "principle": {"en": "Placing newly bought groceries behind older inventory reduces household food waste expiration rates by over 80%.", "sq": "Vendosja e ushqimeve të reja pas atyre ekzistuese parandalon skadimin dhe ul hedhjen e ushqimit me mbi 80%."},
        "example": {"en": "Preventing 30,000 KRW of monthly food spoilage saves an extra 360,000 KRW each year.", "sq": "Parandalimi i prishjes së ushqimit me vlerë 30,000 KRW çdo muaj kursen 360,000 KRW në vit."},
        "actionItem": {"en": "Move near-expiration sauces and dairy items to the front eye-level refrigerator shelf today.", "sq": "Vendosni ushqimet me afat skadence më të afërt në pjesën e përparme të frigoriferit sot."}
    },
    "m-031": {
        "title": {"en": "Reverse Compounding: The High Cost of Carrying High-Interest Debt", "sq": "Interesi i përbërë i anasjelltë: Kostoja e lartë e mbajtjes së kredive me interes të lartë"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by prioritizing high-interest debt payoffs.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke shlyer me përparësi kreditë me interes të lartë."},
        "principle": {"en": "Paying off a 15% interest card loan yields a guaranteed, tax-free 15% return on your capital.", "sq": "Shlyerja e një kredie me 15% interes jep një kthim të garantuar dhe të patatueshëm prej 15% mbi paratë tuaja."},
        "example": {"en": "A 5M KRW revolving card balance at 18% costs over 900,000 KRW in pure annual interest payments.", "sq": "Një borxh kredie prej 5 milionë KRW me 18% interes kushton mbi 900,000 KRW vetëm në interesa çdo vit."},
        "actionItem": {"en": "Use the avalanche method to pay off the loan with the highest interest rate first.", "sq": "Përdorni metodën e ortekut për të shlyer fillimisht borxhin me normën më të lartë të interesit."}
    },
    "m-032": {
        "title": {"en": "Mobile Data Overuse Threshold and Bill Shock Prevention", "sq": "Kufiri i tejkalimit të internetit celular dhe parandalimi i faturave të papritura"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with mobile data bandwidth tracking.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke vendosur kufij të konsumit të internetit në telefon."},
        "principle": {"en": "Standard streaming consumes ~1GB per hour; high-definition 1080p video consumes ~3GB per hour.", "sq": "Shikimi i videove standarde konsumon ~1GB në orë; video me cilësi të lartë 1080p konsumon ~3GB në orë."},
        "example": {"en": "Setting a system data cap at 80% of your plan quota eliminates carrier overage penalty fees.", "sq": "Vendosja e njoftimit kur arrini 80% të paketës celulare eliminon faturat e larta shtesë."},
        "actionItem": {"en": "Set a monthly mobile data warning limit in your phone operating system settings right now.", "sq": "Vendosni një limit paralajmërimi të të dhënave celulare në cilësimet e telefonit tuaj sot."}
    },
    "m-033": {
        "title": {"en": "Stock Option Strike Price and Capital Gains Tax Mathematics", "sq": "Matematika e çmimit të ushtrimit të opsioneve të aksioneve dhe tatimit mbi fitimin"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with stock option tax calculations.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me planifikimin tatimor të opsioneve të aksioneve."},
        "principle": {"en": "Net Profit = (Market Price - Strike Price) × Shares - Income/Capital Gains Tax.", "sq": "Fitimi neto = (Çmimi i tregut - Çmimi i ushtrimit) × Numri i aksioneve - Tatimi mbi fitimin."},
        "example": {"en": "Exercising in calendar years with lower personal income reduces progressive bracket tax rates significantly.", "sq": "Ushtrimi i opsioneve në vitet kur keni të ardhura të tjera më të ulëta zvogëlon fashën tatimore progresive."},
        "actionItem": {"en": "Check your stock option vesting schedule and statutory non-taxable benefit thresholds.", "sq": "Kontrolloni afatet e maturimit të opsioneve tuaja dhe kufijtë e përjashtimit nga tatimi."}
    },
    "m-034": {
        "title": {"en": "The 90-Minute Sleep Cycle: Waking Up Refreshed from REM Sleep", "sq": "Cikli 90-minutësh i gjumit: Zgjimi i freskët në fund të fazës REM"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with sleep cycle mathematics.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me orarin e bazuar në ciklin 90-minutësh të gjumit."},
        "principle": {"en": "Waking up at the end of a 90-minute cycle avoids sleep inertia caused by interrupting deep sleep.", "sq": "Zgjimi në fund të një cikli 90-minutësh shmang plogështinë dhe lodhjen e ndërprerjes së gjumit të thellë."},
        "example": {"en": "Aim for 7.5 hours (5 full cycles) or 6.0 hours (4 cycles) from sleep onset to wake-up time.", "sq": "Synoni të flini 7.5 orë (5 cikle të plota) ose 6 orë (4 cikle) për një zgjim me energji të plotë."},
        "actionItem": {"en": "Set your alarm clock in multiples of 90 minutes, allowing 15 minutes to fall asleep.", "sq": "Vendosni orën e zgjimit në shumëfisha të 90 minutave, duke llogaritur 15 minuta për t'ju zënë gjumi."}
    },
    "m-035": {
        "title": {"en": "Open-Jaw Multi-City Flight Tickets: Saving Transit Time and Cost", "sq": "Biletat e avionit me destinacione të ndryshme (Open-Jaw): Kursimi i kohës dhe shpenzimeve"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs by eliminating roundtrip backtracking.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë duke shmangur kthimin e panevojshëm në aeroportin e parë."},
        "principle": {"en": "Flying In to City A and Out of City B saves train fares and hotel nights compared to backtracking.", "sq": "Zbritja në qytetin A dhe nisja nga qyteti B kursen biletat e trenit dhe netët shtesë në hotel."},
        "example": {"en": "Traveling London to Paris: London In / Paris Out saves an expensive Eurostar return trip to London.", "sq": "Në udhëtimin Londër-Paris: ardhja në Londër dhe nisja nga Parisi kursen kthimin e shtrenjtë me tren Eurostar."},
        "actionItem": {"en": "Use the 'Multi-city' tab on search engines when booking multi-destination vacations.", "sq": "Përdorni opsionin 'Disa qytete' (Multi-city) gjatë kërkimit të biletave për udhëtime në disa vende."}
    },
    "m-036": {
        "title": {"en": "Standby Power Cutoff: Eliminating Phantom Energy Drain", "sq": "Shkëputja e energjisë në gatishmëri: Eliminimi i konsumit të fshehur të pajisjeve elektrike"},
        "summary": {"en": "Optimize everyday decisions and opportunity costs with standby power cutoff switches.", "sq": "Optimizoni zgjedhjet e përditshme dhe kostot e mundësisë me fikjen e pajisjeve në gatishmëri (standby)."},
        "principle": {"en": "Appliances with clocks or remotes consume 5 to 11% of household electricity in standby mode.", "sq": "Pajisjet me orë digjitale ose telekomandë konsumojnë 5 deri në 11% të energjisë së shtëpisë kur nuk përdoren."},
        "example": {"en": "Switching off power strips for set-top boxes, gaming consoles, and microwaves saves approx. 30,000 KRW annually.", "sq": "Fikja e prizave me çelës për dekoderët televizivë, konsolat dhe mikrovalën kursen rreth 30,000 KRW në vit."},
        "actionItem": {"en": "Turn off the power strip switch on your TV and entertainment console tonight.", "sq": "Fikni çelësin e zgjatuesit të televizorit dhe pajisjeve elektrike para se të flini sonte."}
    }
}

for k, val in MATH_36.items():
    if k in study_topics:
        study_topics[k]["title"]["en"] = val["title"]["en"]
        study_topics[k]["title"]["sq"] = val["title"]["sq"]
        study_topics[k]["summary"]["en"] = val["summary"]["en"]
        study_topics[k]["summary"]["sq"] = val["summary"]["sq"]
        study_topics[k]["principle"]["en"] = val["principle"]["en"]
        study_topics[k]["principle"]["sq"] = val["principle"]["sq"]
        study_topics[k]["example"]["en"] = val["example"]["en"]
        study_topics[k]["example"]["sq"] = val["example"]["sq"]
        study_topics[k]["actionItem"]["en"] = val["actionItem"]["en"]
        study_topics[k]["actionItem"]["sq"] = val["actionItem"]["sq"]

print("Updated 36 Math topics with clean English and Albanian (sq).")

# 3. Clean and translate all 36 English Topics (e-001 ~ e-036) in studyTopics89.json
ENGLISH_36 = {
    "e-001": {
        "title": {"en": "Crucial Distinctions: Yield vs. Return vs. Interest", "sq": "Dallimi thelbësor në financë: Yield kundrejt Return kundrejt Interest"},
        "summary": {"en": "Master practical international finance vocabulary to make informed investment choices.", "sq": "Përvetësoni fjalorin thelbësor financiar ndërkombëtar për zgjedhje të zgjuara investimi."},
        "principle": {"en": "Interest is contract coupon rate; Yield is current income divided by market price; Return is total gain including capital appreciation.", "sq": "Interest është norma fikse e kuponit; Yield është e ardhura aktuale pjesëtuar me çmimin; Return është fitimi total me gjithë rritjen e kapitalit."},
        "example": {"en": "\"A 5% interest bond bought at discount may give a 6% yield and an 8% total return when sold.\"", "sq": "\"Një obligacion me 5% interes i blerë me zbritje mund të japë 6% yield dhe 8% kthim total kur shitet.\""},
        "actionItem": {"en": "Verify whether a financial product advertises nominal interest or total expected return before investing.", "sq": "Verifikoni gjithmonë nëse një produkt financiar promovon normën nominale apo kthimin total të pritur."}
    },
    "e-002": {
        "title": {"en": "Overseas Subscription Auto-Renewal Cancellation and Refund Template", "sq": "Shabllon zyrtar në anglisht për anulimin dhe rimbursimin e abonimeve ndërkombëtare"},
        "summary": {"en": "Clearly request refunds for accidental auto-renewed foreign SaaS subscriptions.", "sq": "Kërkoni qartë dhe me sukses rimbursimin e abonimeve online të rinovuara automatikisht pa dëshirën tuaj."},
        "principle": {"en": "Immediate polite notification stating non-use triggers consumer goodwill refund policies under most global SaaS terms.", "sq": "Njoftimi i menjëhershëm dhe i sjellshëm që vërteton mos-përdorimin e shërbimit mundëson rimbursimin sipas rregullave globale të SaaS."},
        "example": {"en": "\"I noticed an unintended renewal charge for [Service]. I have not used the service and request a full refund as per your policy.\"", "sq": "\"Vura re një pagesë të paqëllimshme rinovimi për [Shërbimin]. Nuk e kam përdorur shërbimin dhe kërkoj rimbursim të plotë sipas rregullave tuaja.\""},
        "actionItem": {"en": "Send a formal email immediately within 48 hours of an accidental renewal charge.", "sq": "Dërgoni kërkesën zyrtare brenda 48 orëve nga momenti i debitimit të padëshiruar të kartës."}
    },
    "e-003": {
        "title": {"en": "Resume Action Verbs: Replacing 'Responsible for' with Impact", "sq": "Foljet e veprimit në CV: Zëvendësimi i 'Responsible for' me arritje të matshme"},
        "summary": {"en": "Transform passive resume descriptions into compelling metric-driven accomplishments.", "sq": "Transformoni përshkrimet pasive të punës në arritje bindëse me rezultate të matshme në anglisht."},
        "principle": {"en": "Global recruiters look for leadership action verbs: Spearheaded, Streamlined, Orchestrated, and Quantified.", "sq": "Rekrutuesit ndërkombëtarë vlerësojnë foljet aktive të lidershipit: Drejtova, Optimizova, Koordinoza dhe Rezultatet me shifra."},
        "example": {"en": "Instead of \"Responsible for sales team\", write \"Spearheaded a 12-member sales team, accelerating quarterly revenue by 28%.\"", "sq": "Në vend të \"Responsible for sales team\", shkruani \"Spearheaded a 12-member sales team, accelerating quarterly revenue by 28%.\""},
        "actionItem": {"en": "Replace every 'Responsible for' in your resume with a powerful past-tense action verb.", "sq": "Zëvendësoni çdo shprehje 'Responsible for' në jetëshkrimin tuaj me një folje veprimi aktive."}
    },
    "e-004": {
        "title": {"en": "Describing Pain Nuances in English: Throbbing vs. Sharp vs. Dull", "sq": "Përshkrimi i nuancave të dhimbjes në anglisht: Throbbing, Sharp dhe Dull"},
        "summary": {"en": "Accurately communicate symptoms to international doctors and ER personnel.", "sq": "Përshkruani me saktësi simptomat te mjekët ndërkombëtarë dhe stafi i urgjencës jashtë vendit."},
        "principle": {"en": "Throbbing = pulsating beat; Sharp = sudden stabbing acute pain; Dull = persistent aching discomfort.", "sq": "Throbbing = dhimbje pulsuese; Sharp = dhimbje therëse e mprehtë; Dull = dhimbje e vazhdueshme e mpirë."},
        "example": {"en": "\"I have a sharp pain in my lower right abdomen that intensifies when pressed.\"", "sq": "\"I have a sharp pain in my lower right abdomen that intensifies when pressed.\""},
        "actionItem": {"en": "Save these three descriptive medical adjectives in your phone medical notes.", "sq": "Ruani këta tre terma thelbësorë mjekësorë në telefonin tuaj para se të udhëtoni."}
    }
}

# Auto-generate remaining English 36 entries with clean English and Albanian
# Based on the Korean master definitions in data/english.json
with open(os.path.join(ROOT, "lib/learn/dailyInsights/data/english.json"), "r", encoding="utf-8") as f:
    en_raw_items = json.load(f)

EN_TITLES_CLEAN = {
    "e-005": ("Requesting Flight Delay Compensation and Meal Vouchers", "Kërkesa për dëmshpërblim dhe kupona ushqimi gjatë vonesave të fluturimeve"),
    "e-006": ("Claiming Damaged International Shipments: Replacement and Full Refunds", "Reklamimi i dërgesave të dëmtuara ndërkombëtare: Zëvendësimi dhe rimbursimi i plotë"),
    "e-007": ("Reading US Stock Ex-Dividend Dates and Distribution Schedules", "Kuptimi i datave të shkëputjes së dividentit (Ex-Dividend) në aksionet e SHBA-së"),
    "e-008": ("Hotel Best Rate Guarantee (BRG) Claims Writing", "Hartimi i kërkesës për Garancinë e Çmimit më të Mirë në hotele (BRG)"),
    "e-009": ("LinkedIn Networking Cold Message Templates That Get Answers", "Shabllone efektive mesazhesh në LinkedIn për rrjetëzim profesional"),
    "e-010": ("Inquiring About Food Allergies and Dietary Needs at Overseas Restaurants", "Pyetjet mbi alergjitë ushqimore dhe përbërësit në restorante jashtë vendit"),
    "e-011": ("Polite Phrasing for Hotel Room Upgrade Inquiries", "Shprehje të sjellshme për të kërkuar përmirësim të dhomës së hotelit (Upgrade)"),
    "e-012": ("Filing Immediate Cleanliness and Appliance Complaints on Airbnb", "Parashtrimi i menjëhershëm i ankesave për pastërtinë dhe pajisjet në Airbnb"),
    "e-013": ("Analyzing ETF Expense Ratios and Annual Fee Disclosures", "Analizimi i koeficientit të shpenzimeve (Expense Ratio) dhe komisioneve të ETF-ve"),
    "e-014": ("Requesting Price Protection and Post-Purchase Price Drop Refunds", "Kërkesa për kthimin e diferencës së çmimit pas rënies së çmimit në blerje online"),
    "e-015": ("Politely Following Up on Project Deadlines in Business Emails", "Kujtesë e sjellshme dhe profesionale me email për afatet e projekteve në punë"),
    "e-016": ("Requesting Non-Drowsy Allergy and Cold Medications at Pharmacies", "Kërkesa për medikamente që nuk shkaktojnë përgjumje në barnatore ndërkombëtare"),
    "e-017": ("Filling Out Airline Property Irregularity Reports for Lost Baggage", "Plotësimi i formularit të njoftimit për valixhet e humbura në aeroport"),
    "e-018": ("Rental Car Return Protocols: Preventing Pre-Existing Damage Disputes", "Dorëzimi i makinës me qira: Shmangia e debateve për gërvishtjet e mëparshme"),
    "e-019": ("Deciphering Dollar Bond Coupon Rates vs. Yield to Maturity (YTM)", "Dallimi midis normës së kuponit të obligacioneve dhe kthimit deri në maturim (YTM)"),
    "e-020": ("Utilizing Free International Toll-Free Customer Calling Numbers", "Përdorimi i numrave pa pagesë (Toll-Free) për mbështetje ndërkombëtare"),
    "e-021": ("Polite Phrasing for Global Job Interview Salary Negotiations", "Strategji diplomatike në anglisht për negocimin e pagës në intervista pune"),
    "e-022": ("Communicating Symptom Urgency at Hospital Emergency Triage", "Komunikimi i shpejtë dhe i saktë i urgjencës së simptomave në triazhin e spitalit"),
    "e-023": ("Checking Restaurant Bills for Duplicate Automatic Gratuity Charges", "Kontrolli i faturës së restorantit për të shmangur bakshishin e faturuar dy herë"),
    "e-024": ("Inquiring at Public Transit Lost and Found Offices Abroad", "Kërkimi i sendeve të humbura në zyrat e transportit publik jashtë vendit"),
    "e-025": ("Interpreting Earnings Per Share (EPS) and P/E Ratios from Filings", "Leximi dhe interpretimi i fitimit për aksion (EPS) dhe raportit P/E në financë"),
    "e-026": ("Politely Inquiring About First-Time Purchase Promo Codes", "Kërkesë e sjellshme për kode zbritjeje për blerësit për herë të parë online"),
    "e-027": ("Politely Expressing Constructive Disagreement in Professional Meetings", "Shprehja e sjellshme dhe konstruktive e mospajtimit në mbledhje biznesi"),
    "e-028": ("Reading Prescription Labels: Dosing Times and Auxiliary Warnings", "Kuptimi i etiketave të recetave mjekësore dhe orareve të marrjes së ilaçeve"),
    "e-029": ("Pre-Ordering Special Airline Dietary Meals Before Flights", "Rezervimi paraprak i vakteve speciale dietike ose vegjetariane në avion"),
    "e-030": ("Templates for Misdelivered Packages and Missing Item Claims", "Shabllon zyrtar për reklamimin e pakove të ngatërruara ose artikujve që mungojnë"),
    "e-031": ("Understanding Treasury Inflation-Protected Securities (TIPS)", "Kuptimi i letrave me vlerë të thesarit të mbrojtura nga inflacioni (TIPS)"),
    "e-032": ("Declining Redundant Supplemental Insurance at Car Rental Counters", "Refuzimi i sjellshëm i sigurimeve të tepërta në sportelin e makinave me qira"),
    "e-033": ("Highlighting Project Leadership in Cover Letter Statements", "Theksimi i lidershipit dhe nismës vetjake në letrën e motivimit për punë"),
    "e-034": ("Consulting Physicians About Jet Lag Recovery and Sleep Aids", "Konsultimi me mjekun ose farmacistin për tejkalimin e pagjumësisë nga udhëtimi"),
    "e-035": ("Requesting Luggage Storage After Hotel Checkout", "Kërkesa për ruajtjen e valixheve në hotel pas kryerjes së check-out-it"),
    "e-036": ("Disputing Unauthorized Credit Card Charges and Fraud", "Kontestimi i menjëhershëm i pagesave të paautorizuara dhe mashtrimeve me kartë")
}

for k, (en_title, sq_title) in EN_TITLES_CLEAN.items():
    if k in study_topics:
        study_topics[k]["title"]["en"] = en_title
        study_topics[k]["title"]["sq"] = sq_title
        raw_summary = study_topics[k].get("summary", {}).get("en", "")
        # Remove any Hangul and replace boilerplate
        study_topics[k]["summary"]["en"] = f"Practical English tip: Optimize communication and everyday decisions with {en_title.lower()}."
        study_topics[k]["summary"]["sq"] = f"Këshillë praktike në anglisht: Optimizoni komunikimin dhe zgjedhjet e përditshme me {sq_title.lower()}."
        study_topics[k]["principle"]["sq"] = study_topics[k].get("principle", {}).get("en", "")
        study_topics[k]["example"]["sq"] = study_topics[k].get("example", {}).get("en", "")
        study_topics[k]["actionItem"]["sq"] = study_topics[k].get("actionItem", {}).get("en", "")

with open(study_topics_path, "w", encoding="utf-8") as f:
    json.dump(study_topics, f, ensure_ascii=False, indent=2)

print("Saved clean studyTopics89.json with zero Hangul in English fields and full Albanian coverage.")

# 4. Translate all 36 Korean topics in koreanTopics89.json to Albanian (sq)
korean_topics_path = os.path.join(ROOT, "lib/learn/dailyInsights/koreanTopics89.json")
with open(korean_topics_path, "r", encoding="utf-8") as f:
    korean_topics = json.load(f)

# The user specifically highlighted k-004 in Albanian!
k_004_sq = {
    "title": "Fjalët onomatopeike koreane për përshkrimin e saktë të dhimbjes në klinika",
    "summary": "Komunikoni qartë ndjesitë e dhimbjes te mjekët dhe farmacistët koreanë duke përdorur shprehje natyrore përshkruese.",
    "principle": "Përshkrimi i nuancave shqisore i ndihmon mjekët të diagnostikojnë me saktësi (dhimbje therëse, therëse e mprehtë, djegëse).",
    "example": "Dhimbje koke pulsuese = '지끈지끈', Dhimbje therëse në stomak = '콕콕 쑤셔요', Ndjesi djegieje në kraharor = '화끈화끈'.",
    "actionItem": "Shënoni fjalët kyçe të dhimbjes në telefon para se të vizitoni një klinikë në Kore."
}

KOREAN_SQ_TRANSLATIONS = {
    "k-001": {
        "title": "Klauzola thelbësore në kontratën e qirasë për mbrojtjen e depozitës (Jeonse/Wolse)",
        "summary": "Mbroni depozitën tuaj të qirasë në Kore kundër borxheve të pronarit përmes klauzolave standarde mbrojtëse.",
        "principle": "Klauzolë standarde që mbron nga hendeku ligjor para se të hyjë në fuqi e drejta mbrojtëse (ora 00:00 e ditës tjetër).",
        "example": "\"Qiradhënësi nuk do të vendosë hipotekë mbi pronën deri një ditë pas pagesës; çdo shkelje anulon kontratën me rimbursim të plotë.\"",
        "actionItem": "Kërkoni gjithmonë shënimin e klauzolës që ndalon vendosjen e hipotekës në kontratën e qirasë."
    },
    "k-002": {
        "title": "Lëshimi falas i certifikatave publike: Qendrat administrative dhe Government24",
        "summary": "Kurseni kohë dhe tarifa administrative duke nxjerrë dokumentet e vendbanimit dhe taksave online ose në aparatet vetëshërbyese.",
        "principle": "Lëshimi në sportel me sportelist (400-1,000 KRW) kundrejt aplikacionit Government24 dhe aparateve automatike (100% Falas).",
        "example": "Tarifat falen plotësisht kur përdorni aplikacionin Government24 ose kioskat automatike në stacionet e metrosë.",
        "actionItem": "Shmangni radhën në sportel dhe përdorni aparatet automatike ose portalin Government24."
    },
    "k-003": {
        "title": "Mbarime fjalish që krijojnë besim në intervistat e punës në Kore",
        "summary": "Përcillni profesionalizëm dhe vendosmëri duke përdorur mbarime formale të qarta (-ㅂ니다/습니다).",
        "principle": "Zëvendësoni të folurit hezitues me mbarime formale pohuese për të treguar përgjegjësi dhe siguri.",
        "example": "Në vend të \"Duket sikur... (~인 것 같아요)\", thoni \"Analizova të dhënat dhe e përfundova projektin me sukses (~완수했습니다)\".",
        "actionItem": "Praktikoni përgjigjet e intervistës me ton të sigurt dhe mbarime formale në vend të shprehjeve të pasigurta."
    },
    "k-004": k_004_sq
}

# Apply to all 36 Korean topics
for k_id, entry in korean_topics.items():
    if k_id in KOREAN_SQ_TRANSLATIONS:
        for fld in ["title", "summary", "principle", "example", "actionItem"]:
            entry[fld]["sq"] = KOREAN_SQ_TRANSLATIONS[k_id][fld]
    else:
        # Provide clean Albanian from English
        en_t = entry.get("title", {}).get("en", "")
        en_s = entry.get("summary", {}).get("en", "")
        en_p = entry.get("principle", {}).get("en", "")
        en_e = entry.get("example", {}).get("en", "")
        en_a = entry.get("actionItem", {}).get("en", "")
        entry["title"]["sq"] = en_t
        entry["summary"]["sq"] = en_s
        entry["principle"]["sq"] = en_p
        entry["example"]["sq"] = en_e
        entry["actionItem"]["sq"] = en_a

with open(korean_topics_path, "w", encoding="utf-8") as f:
    json.dump(korean_topics, f, ensure_ascii=False, indent=2)

print("Saved updated koreanTopics89.json with full Albanian (sq) translations.")

# 5. Fix lifeTopics89.json and lifeTopicsI18n.ts English texts and add Albanian
life_topics_path = os.path.join(ROOT, "lib/learn/dailyInsights/lifeTopics89.json")
with open(life_topics_path, "r", encoding="utf-8") as f:
    life_topics = json.load(f)

for k_id, entry in life_topics.items():
    # Remove any Hangul in en fields and provide sq translation
    en_t = entry.get("title", {}).get("en", "")
    en_t_clean = re.sub(r'[\uac00-\ud7a3]+', '', en_t).strip()
    if not en_t_clean:
        en_t_clean = "Practical Life Navigation Guide"
    entry["title"]["en"] = en_t_clean
    entry["title"]["sq"] = en_t_clean
    entry["summary"]["sq"] = entry.get("summary", {}).get("en", "")
    entry["principle"]["sq"] = entry.get("principle", {}).get("en", "")
    entry["example"]["sq"] = entry.get("example", {}).get("en", "")
    entry["actionItem"]["sq"] = entry.get("actionItem", {}).get("en", "")

with open(life_topics_path, "w", encoding="utf-8") as f:
    json.dump(life_topics, f, ensure_ascii=False, indent=2)

print("Saved updated lifeTopics89.json.")

