# -*- coding: utf-8 -*-
"""
scripts/inject_all_remaining_locales.py
Provides native dictionaries for:
sv, da, no, el, uk, ar, arz, fa, he, hi, bn, ta, ne, si, km, my, kk, tet, am
"""
import json
import os

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "messages")

ALL_REMAINING = {
    "sv": {
        "common": {
            "detail": "Visa detaljer",
            "apply": "Ansök nu",
            "safeApply": "Säker ansökan",
            "platformTagline": "Flerspråkig plattform för vardagstjänster"
        },
        "customer": {
            "priorityEmergency": "Prioriterad jourutryckning",
            "lifeSupportTitle": "5 viktiga vardagshjälptjänster för internationella invånare",
            "lifeSupportDesc": "När du begär hjälp krypteras ditt riktiga telefonnummer till ett tillfälligt säkert virtuellt 050-nummer för att säkerställa maximal integritet.",
            "partnerRegisterLink": "Registrera som hjälppartner →",
            "reviewLink": "Lämna ett omdöme →",
            "safe050Badge": "Sekretessystem med 050 virtuellt säkert nummer tillämpas"
        },
        "service": {
            "clog": "Stopp i toalett, diskho och avlopp",
            "leakPlumbing": "Vattenläckagedetektering och rörarbeten",
            "boiler": "Installation och reparation av värmepanna och varmvattenberedare",
            "cleaning": "Professionell städning (flyttstädning och grovrengöring)",
            "housing": "Hjälp med att hitta rum och hyreslägenheter",
            "bankHelp": "Hjälp med att öppna bankkonto",
            "insuranceHelp": "Hjälp med försäkringar",
            "jobHelp": "Hjälp med jobbsökning och rekrytering",
            "hospitalHelp": "Sjukhusledsagning och medicinsk tolkning",
            "mobileHelp": "Öppning av mobilabonnemang och SIM-kort"
        },
        "serviceDesc": {
            "clog": "Översvämning toalett/vask/avlopp, högtrycksspolning, rörinspektion med kamera",
            "leakPlumbing": "Avancerad läcksökning med instrument, reparation av frysta rör, rörbyte och fuktskydd",
            "boiler": "Montering av gas/el-värmepanna, reparation av varmvatten och värme, rörkontroll",
            "cleaning": "Flyttstädning, borttagning av ingrodd smuts och fett, desinfektion av bostad",
            "housing": "Trygg förmedling av ettor och tvåor anpassade efter din budget och önskat område",
            "bankHelp": "Kontoöppning med uppehållskort/pass, bankkort, mobilbank och utlandsbetalningar",
            "insuranceHelp": "Nationell sjukförsäkring, obligatoriska försäkringar för utlänningar, bil- och mc-försäkring",
            "jobHelp": "Lagliga jobb matchade till visumtyp, cv-stöd och granskning av anställningsavtal",
            "hospitalHelp": "Läkarbokning, ledsagning till mottagning, kvalificerad medicinsk tolkning och recept",
            "mobileHelp": "Direktaktivering av prisvärt SIM-kort med ID-verifiering, bra datapaket och inställningar"
        },
        "serviceProblems": {
            "clog": "Toaletten, diskhon eller golvbrunnen är helt igensatt, vattnet rinner inte undan och svämmar över.",
            "leakPlumbing": "Det droppar vatten från rör eller tak, behöver akut rörmokare och rörbyte.",
            "boiler": "Felkod blinkar på värmepannan, inget varmvatten och ingen värme fungerar.",
            "cleaning": "Behöver flyttstädning eller rengöring av svåra fettfläckar i kök och badrum.",
            "housing": "Söker en möblerad etta eller tvåa som passar min budget.",
            "bankHelp": "Behöver hjälp med att öppna bankkonto med utländska ID-handlingar, skaffa kort eller skicka pengar utomlands.",
            "insuranceHelp": "Behöver hjälp med att registrera sjukförsäkring, obligatoriska försäkringar eller ersättningsanspråk.",
            "jobHelp": "Behöver hjälp med att hitta ett lagligt arbete som passar mitt visum och rådgivning kring kontrakt.",
            "hospitalHelp": "Behöver hjälp med att boka läkartid, ledsagning till sjukhus och medicinsk tolk.",
            "mobileHelp": "Behöver hjälp med att skaffa ett prisvärt SIM-kort och välja ett bra surfabonnemang."
        }
    },
    "da": {
        "common": {
            "detail": "Se detaljer",
            "apply": "Ansøg nu",
            "safeApply": "Sikker ansøgning",
            "platformTagline": "Flersproget platform for hverdagstjenester"
        },
        "customer": {
            "priorityEmergency": "Prioriteret udrykningsservice",
            "lifeSupportTitle": "5 vigtige hverdagshjælpetjenester for udenlandske borgere",
            "lifeSupportDesc": "Når du anmoder om hjælp, krypteres dit rigtige telefonnummer til et midlertidigt sikkert virtuelt 050-nummer for at beskytte dit privatliv.",
            "partnerRegisterLink": "Tilmeld som hjælpepartner →",
            "reviewLink": "Skriv en anmeldelse →",
            "safe050Badge": "Privatlivsbeskyttelse med virtuelt sikkert 050-nummer aktiv"
        },
        "service": {
            "clog": "Afhjælpning af tilstoppet toilet, vask og afløb",
            "leakPlumbing": "Lækagesøgning og VVS-arbejde",
            "boiler": "Montering, service og reparation af kedler og vandvarmere",
            "cleaning": "Professionel rengøring (fraflytning og grundig rengøring)",
            "housing": "Hjælp til at finde værelser og lejligheder efter budget",
            "bankHelp": "Hjælp til oprettelse af bankkonto",
            "insuranceHelp": "Hjælp til forsikringer",
            "jobHelp": "Hjælp til jobsøgning og rekruttering",
            "hospitalHelp": "Hospitalsledsagelse og medicinsk tolkning",
            "mobileHelp": "Oprettelse af mobilabonnement og SIM-kort"
        },
        "serviceDesc": {
            "clog": "Overløb i toilet/vask/afløb, højtryksspuling, rørinspektion med tv-kamera",
            "leakPlumbing": "Præcis lækagesporing med instrumenter, optøning af frosne rør, rørudskiftning",
            "boiler": "Montering af gas-/el-fyr, reparation af varme og varmt vand, eftersyn af rør",
            "cleaning": "Fraflytningsrengøring, fjernelse af genstridigt snavs, desinficering af boligen",
            "housing": "Tryg formidling af 1-2 værelses lejligheder tilpasset dit budget og ønskede område",
            "bankHelp": "Kontooprettelse med opholdskort/pas, betalingskort, netbank og udenlandske overførsler",
            "insuranceHelp": "Offentlig sygesikring, lovpligtige forsikringer for udlændinge, bil- og motorcykelforsikring",
            "jobHelp": "Lovlige jobs matchet til visumtype, hjælp til cv og gennemgang af ansættelseskontrakt",
            "hospitalHelp": "Booking af speciallæge, ledsagelse på klinikken, professionel medicinsk tolkning",
            "mobileHelp": "Hurtig aktivering af billigt forudbetalt SIM-kort med id-validering og opsætning"
        },
        "serviceProblems": {
            "clog": "Toilet, vask eller gulvafløb er stoppet helt til, vandet løber over.",
            "leakPlumbing": "Der drypper vand fra et rør eller loftet, akut VVS-montør nødvendig.",
            "boiler": "Fejlkode blinker på fyret, intet varmt vand og ingen varme.",
            "cleaning": "Brug for grundig flytterengøring eller fjernelse af fedt i køkken og bad.",
            "housing": "Leder efter et møbleret værelse eller en 2-værelses lejlighed inden for mit budget.",
            "bankHelp": "Brug for hjælp til at åbne bankkonto med udenlandsk id, få betalingskort eller overføre penge.",
            "insuranceHelp": "Brug for hjælp til sygesikring, lovpligtige forsikringer eller erstatningskrav.",
            "jobHelp": "Brug for hjælp til at finde et lovligt arbejde i overensstemmelse med mit visum.",
            "hospitalHelp": "Brug for hjælp til lægebekræftelse, ledsagelse på hospitalet og medicinsk tolk.",
            "mobileHelp": "Brug for hjælp til at oprette et billigt SIM-kort og vælge en god datapakke."
        }
    },
    "no": {
        "common": {
            "detail": "Se detaljer",
            "apply": "Søk nå",
            "safeApply": "Sikker søknad",
            "platformTagline": "Flerspråklig plattform for hverdagstjenester"
        },
        "customer": {
            "priorityEmergency": "Prioritert utrykningstjeneste",
            "lifeSupportTitle": "5 essensielle hverdagshjelpetjenester for utenlandske innbyggere",
            "lifeSupportDesc": "Når du ber om hjelp, krypteres ditt virkelige telefonnummer til et midlertidig sikkert virtuelt 050-nummer for å sikre fullt personvern.",
            "partnerRegisterLink": "Registrer som hjelperpartner →",
            "reviewLink": "Legg igjen en anmeldelse →",
            "safe050Badge": "Personvernsystem med virtuelt 050-sikkerhetsnummer aktivert"
        },
        "service": {
            "clog": "Åpning av tette toaletter, vasker og sluk",
            "leakPlumbing": "Lekkasjesøk og rørleggertjenester",
            "boiler": "Installasjon og reparasjon av varmtvannsbereder og kjele",
            "cleaning": "Profesjonell vask (flyttevask og hovedrengjøring)",
            "housing": "Bistand til å finne hybel og leilighet etter budsjett",
            "bankHelp": "Hjelp til å åpne bankkonto",
            "insuranceHelp": "Hjelp til forsikringer",
            "jobHelp": "Bistand til jobbsøking og rekruttering",
            "hospitalHelp": "Sykehusledsagelse og medisinsk tolking",
            "mobileHelp": "Tegning av mobilabonnement og SIM-kort"
        },
        "serviceDesc": {
            "clog": "Tilbakeslag i toalett/vask/sluk, høytrykksspyling, rørinspeksjon med kamera",
            "leakPlumbing": "Avansert lekkasjesøk med lytteutstyr, tining av frosne rør, rørfornying",
            "boiler": "Montering av gass-/el-kjel, reparasjon av varme og varmtvann, tetthetskontroll",
            "cleaning": "Flyttevask, fjerning av vanskelige fettflekker, desinfeksjon av bolig",
            "housing": "Trygg formidling av hybler og 2-roms leiligheter tilpasset ditt budsjett",
            "bankHelp": "Kontoåpning med oppholdskort/pass, bankkort, nettbank og utenlandsoverføringer",
            "insuranceHelp": "Folketrygd, obligatoriske forsikringer for utenlandske arbeidstakere, bil/mc",
            "jobHelp": "Lovlige jobber tilpasset visum, støtte til CV og vurdering av arbeidskontrakt",
            "hospitalHelp": "Timebestilling hos spesialist, ledsagelse på klinikk, profesjonell medisinsk tolk",
            "mobileHelp": "Rask aktivering av rimelig SIM-kort med ID-kontroll, gunstige datapakker"
        },
        "serviceProblems": {
            "clog": "Toalett, vask eller sluk er potte tett, vannet renner ikke ned og flommer over.",
            "leakPlumbing": "Det lekker vann fra et rør eller taket, trenger rørlegger raskt.",
            "boiler": "Feilkode blinker på berederen, ikke varmtvann og ingen oppvarming.",
            "cleaning": "Trenger grundig flyttevask eller vask av fastbrent fett på kjøkken og bad.",
            "housing": "Ser etter en møblert hybel eller leilighet som passer mitt budsjett.",
            "bankHelp": "Trenger hjelp til å åpne konto med utenlandske ID-papirer, få kort eller overføre penger.",
            "insuranceHelp": "Trenger bistand til registrering i helsetjenesten eller forsikringsoppgjør.",
            "jobHelp": "Trenger hjelp til å finne en lovlig jobb tilpasset mitt visum og gjennomgå kontrakt.",
            "hospitalHelp": "Trenger timebestilling hos lege, ledsagelse til sykehus og medisinsk tolk.",
            "mobileHelp": "Trenger hjelp til å skaffe et rimelig SIM-kort og velge en god datapakke."
        }
    },
    "el": {
        "common": {
            "detail": "Λεπτομέρειες",
            "apply": "Αίτηση",
            "safeApply": "Ασφαλής αίτηση",
            "platformTagline": "Πολύγλωσση πλατφόρμα οικιακών υπηρεσιών"
        },
        "customer": {
            "priorityEmergency": "Υπηρεσία επείγουσας επέμβασης προτεραιότητας",
            "lifeSupportTitle": "5 βασικές υπηρεσίες καθημερινής υποστήριξης για αλλοδαπούς κατοίκους",
            "lifeSupportDesc": "Κατά την υποβολή αιτήματος βοήθειας, ο πραγματικός αριθμός τηλεφώνου σας κρυπτογραφείται σε έναν προσωρινό ασφαλή εικονικό αριθμό 050 για απόλυτη ιδιωτικότητα.",
            "partnerRegisterLink": "Εγγραφή ως συνεργάτης βοηθός →",
            "reviewLink": "Αφήστε μια αξιολόγηση →",
            "safe050Badge": "Ενεργό σύστημα προστασίας απορρήτου με ασφαλή εικονικό αριθμό 050"
        },
        "service": {
            "clog": "Απόφραξη λεκάνης, νεροχύτη, σιφωνιού και αποχετεύσεων",
            "leakPlumbing": "Εντοπισμός διαρροών νερού και υδραυλικές εργασίες",
            "boiler": "Εγκατάσταση και επισκευή λέβητα και θερμοσίφωνα",
            "cleaning": "Επαγγελματικός καθαρισμός (μετακόμιση και γενικός καθαρισμός)",
            "housing": "Εύρεση ενοικιαζόμενων δωματίων και διαμερισμάτων",
            "bankHelp": "Βοήθεια για άνοιγμα τραπεζικού λογαριασμού",
            "insuranceHelp": "Βοήθεια για εγγραφή σε ασφάλιση",
            "jobHelp": "Εύρεση εργασίας και υποστήριξη πρόσληψης",
            "hospitalHelp": "Συνοδεία σε νοσοκομείο και ιατρική διερμηνεία",
            "mobileHelp": "Έκδοση κάρτας SIM και σύνδεση κινητής τηλεφωνίας"
        },
        "serviceDesc": {
            "clog": "Υπερχείλιση τουαλέτας/νεροχύτη, πλύσιμο με υψηλή πίεση, ενδοσκοπικός έλεγχος σωληνώσεων",
            "leakPlumbing": "Ηλεκτροακουστικός εντοπισμός διαρροών, επισκευή παγωμένων σωλήνων, αντικατάσταση σωληνώσεων",
            "boiler": "Τοποθέτηση λέβητα αερίου/ρεύματος, επισκευή ζεστού νερού και θέρμανσης",
            "cleaning": "Καθαρισμός πριν/μετά τη μετακόμιση, απομάκρυνση δύσκολων λεκέδων, απολύμανση χώρου",
            "housing": "Ασφαλής εύρεση γκαρσονιέρας ή διαμερίσματος 1-2 δωματίων σύμφωνα με τον προϋπολογισμό σας",
            "bankHelp": "Άνοιγμα λογαριασμού με άδεια διαμονής/διαβατήριο, χρεωστική κάρτα, e-banking και εμβάσματα",
            "insuranceHelp": "Εθνική ασφάλιση υγείας, υποχρεωτικές ασφαλίσεις αλλοδαπών εργαζομένων, οχημάτων",
            "jobHelp": "Νόμιμες θέσεις εργασίας ανάλογα με τη βίζα, σύνταξη βιογραφικού και έλεγχος συμβάσεων",
            "hospitalHelp": "Κλείσιμο ραντεβού με ειδικούς, συνοδεία σε κλινικές, εξειδικευμένη ιατρική διερμηνεία",
            "mobileHelp": "Άμεση ενεργοποίηση οικονομικής κάρτας SIM με ταυτοποίηση, προγράμματα δεδομένων"
        },
        "serviceProblems": {
            "clog": "Η λεκάνη, ο νεροχύτης ή το σιφόνι έχουν βουλώσει εντελώς, το νερό δεν φεύγει και ξεχειλίζει.",
            "leakPlumbing": "Στάζει νερό από σωλήνα ή ταβάνι, χρειάζεται επειγόντως υδραυλικός και αντικατάσταση.",
            "boiler": "Αναβοσβήνει κωδικός σφάλματος στον λέβητα, δεν έχω ζεστό νερό ούτε θέρμανση.",
            "cleaning": "Χρειάζομαι γενικό καθαρισμό μετακόμισης ή αφαίρεση λίπους σε κουζίνα και μπάνιο.",
            "housing": "Ψάχνω επιπλωμένη γκαρσονιέρα ή δυάρι που να ταιριάζει στον προϋπολογισμό μου.",
            "bankHelp": "Χρειάζομαι βοήθεια για άνοιγμα λογαριασμού με ξένα έγγραφα, έκδοση κάρτας ή εμβάσματα.",
            "insuranceHelp": "Χρειάζομαι βοήθεια για εγγραφή στο ταμείο υγείας ή υποβολή δικαιολογητικών αποζημίωσης.",
            "jobHelp": "Χρειάζομαι βοήθεια για εύρεση νόμιμης εργασίας κατάλληλης για τη βίζα μου.",
            "hospitalHelp": "Χρειάζομαι ραντεβού με γιατρό, συνοδεία στο νοσοκομείο και ιατρικό διερμηνέα.",
            "mobileHelp": "Χρειάζομαι βοήθεια για ενεργοποίηση οικονομικής κάρτας SIM και επιλογή πακέτου δεδομένων."
        }
    },
    "uk": {
        "common": {
            "detail": "Детальніше",
            "apply": "Замовити",
            "safeApply": "Безпечна заявка",
            "platformTagline": "Багатомовна платформа побутових послуг"
        },
        "customer": {
            "priorityEmergency": "Пріоритетний терміновий виїзд",
            "lifeSupportTitle": "5 основних послуг життєвої допомоги для іноземних громадян",
            "lifeSupportDesc": "При оформленні заявки ваш реальний номер шифрується у тимчасовий безпечний віртуальний номер 050 для забезпечення повної конфіденційності.",
            "partnerRegisterLink": "Стати партнером-помічником →",
            "reviewLink": "Залишити відгук →",
            "safe050Badge": "Застосовано систему захисту приватності з безпечним номером 050"
        },
        "service": {
            "clog": "Усунення засмічень: унітаз, раковина, каналізація",
            "leakPlumbing": "Виявлення протікань води та сантехнічні роботи",
            "boiler": "Монтаж, обслуговування та ремонт котлів і бойлерів",
            "cleaning": "Професійне прибирання (при в'їзді та генеральне)",
            "housing": "Пошук та оренда житла під ваш бюджет",
            "bankHelp": "Допомога у відкритті банківського рахунку",
            "insuranceHelp": "Допомога в оформленні страхування",
            "jobHelp": "Допомога у пошуку роботи та працевлаштуванні",
            "hospitalHelp": "Супровід до лікарні та медичний переклад",
            "mobileHelp": "Підключення мобільного зв'язку та SIM-карт"
        },
        "serviceDesc": {
            "clog": "Перелив унітаза/раковини, промивка під високим тиском, ендоскопічна діагностика труб",
            "leakPlumbing": "Апаратний пошук прихованих витоків, розморожування труб, заміна трубопроводів",
            "boiler": "Встановлення газових/електрокотлів, ремонт гарячої води та опалення, перевірка труб",
            "cleaning": "Прибирання після переїзду, видалення застарілого жиру, повна дезінфекція приміщень",
            "housing": "Підбір безпечного житла (студії, квартири) відповідно до вашого бюджету та району",
            "bankHelp": "Відкриття рахунку за ID-карткою/паспортом, платіжна картка, онлайн-банкінг та перекази",
            "insuranceHelp": "Державне медичне страхування, обов'язкове страхування іноземних працівників, авто",
            "jobHelp": "Легальне працевлаштування відповідно до типу візи, резюме та трудові договори",
            "hospitalHelp": "Запис до профільних лікарів, супровід у клініках, фаховий медичний переклад і рецепти",
            "mobileHelp": "Миттєве підключення вигідної SIM-карти для іноземців, вибір тарифів та налаштування"
        },
        "serviceProblems": {
            "clog": "Унітаз, раковина або каналізація наглухо забиті, вода не сходить і переливається через край.",
            "leakPlumbing": "Вода капає з труби або зі стелі, терміново потрібен сантехнік та заміна труб.",
            "boiler": "На дисплеї котла блимає помилка, гарячої води немає і не працює опалення.",
            "cleaning": "Потрібне генеральне прибирання перед заселенням або відмивання застарілого жиру.",
            "housing": "Шукаю умебльовану студію або 1-2 кімнатну квартиру під свій бюджет.",
            "bankHelp": "Потрібна допомога у відкритті банківського рахунку за іноземними документами та перекази.",
            "insuranceHelp": "Потрібна допомога з реєстрацією медичної страховки або оформленням виплат.",
            "jobHelp": "Шукаю легальну роботу відповідно до моєї візи та допомогу з трудовим договором.",
            "hospitalHelp": "Потрібно записатися до лікаря, супровід до лікарні та медичний перекладач.",
            "mobileHelp": "Потрібна допомога з підключенням вигідної SIM-карти та вибором пакета інтернету."
        }
    },
    "ar": {
        "common": {
            "detail": "عرض التفاصيل",
            "apply": "تقديم الطلب",
            "safeApply": "طلب آمن",
            "platformTagline": "منصة الخدمات المعيشية متعددة اللغات"
        },
        "customer": {
            "priorityEmergency": "خدمة الطوارئ ذات الأولوية القصوى",
            "lifeSupportTitle": "5 خدمات دعم معيشي أساسية للمقيمين الأجانب",
            "lifeSupportDesc": "عند طلب المساعدة، يتم تشفير رقم هاتفك الفعلي وتحويله إلى رقم افتراضي آمن 050 لضمان أقصى درجات الخصوصية.",
            "partnerRegisterLink": "التسجيل كشريك مساعد →",
            "reviewLink": "أضف تقييمك →",
            "safe050Badge": "نظام حماية الخصوصية عبر الرقم الآمن 050 مفعل"
        },
        "service": {
            "clog": "تسليك انسداد المرحاض والمغسلة ومجاري الصرف",
            "leakPlumbing": "كشف تسربات المياه وأعمال السباكة وتمديد المواسير",
            "boiler": "تركيب وصيانة وإصلاح سخانات المياه والمراجل",
            "cleaning": "تنظيف احترافي (تنظيف الانتقال والتعقيم الشامل)",
            "housing": "المساعدة في العثور على شقق وغرف للإيجار",
            "bankHelp": "المساعدة في فتح حساب بنكي",
            "insuranceHelp": "المساعدة في الاشتراك بالتأمين",
            "jobHelp": "المساعدة في البحث عن عمل والتوظيف",
            "hospitalHelp": "مرافقة للمستشفيات وترجمة طبية متخصصة",
            "mobileHelp": "المساعدة في فتح خطوط الهاتف وشريحة SIM"
        },
        "serviceDesc": {
            "clog": "ارتجاع مياه المرحاض والمغسلة، غسيل بالضغط العالي، فحص المواسير بكاميرا المنظار",
            "leakPlumbing": "كشف تسرب المياه بالأجهزة الحديثة، إذابة المواسير المتجمدة، استبدال المواسير والعزل",
            "boiler": "تركيب سخانات الغاز والكهرباء، تصليح التدفئة والمياه الساخنة، فحص الأنابيب",
            "cleaning": "تنظيف ما قبل الانتقال، إزالة الدهون والأوساخ الصعبة، تعقيم المنزل بالكامل",
            "housing": "البحث عن استوديوهات وشقق آمنة تناسب ميزانيتك وفي الموقع الذي تفضله",
            "bankHelp": "فتح حساب ببطاقة الإقامة/جواز السفر، بطاقة مدى، الخدمات المصرفية والتحويلات الدولية",
            "insuranceHelp": "التأمين الصحي الوطني، التأمينات الإلزامية للعمالة الأجنبية، تأمين السيارات",
            "jobHelp": "وظائف قانونية متوافقة مع التأشيرة، صياغة السيرة الذاتية ومراجعة عقود العمل",
            "hospitalHelp": "حجز المواعيد لدى الأطباء، مرافقة للعيادات، ترجمة طبية متخصصة وإرشادات الوصفات",
            "mobileHelp": "تفعيل فوري لشرائح SIM الاقتصادية للأجانب مع إثبات الهوية، باقات إنترنت وإعدادات"
        },
        "serviceProblems": {
            "clog": "المرحاض أو حوض الغسيل أو مجرى الصرف مسدود تماماً والمياه ترتجع وتفيض.",
            "leakPlumbing": "هناك تسرب مياه من الأنابيب أو السقف، أحتاج سباكاً عاجلاً واستبدال المواسير.",
            "boiler": "يومض رمز خطأ على شاشة السخان، لا توجد مياه ساخنة والتدفئة لا تعمل.",
            "cleaning": "أحتاج إلى تنظيف شامل قبل الانتقال للمنزل أو تنظيف دهون المطبخ الصعبة.",
            "housing": "أبحث عن استوديو أو شقة مفروشة تناسب ميزانيتي وموقعي.",
            "bankHelp": "أحتاج مساعدة لفتح حساب بنكي بوثائقي الأجنبية، استخراج بطاقة أو تحويل أموال للخارج.",
            "insuranceHelp": "أحتاج مساعدة للتسجيل في التأمين الصحي أو التأمين الإلزامي أو تقديم مطالبات.",
            "jobHelp": "أحتاج مساعدة لإيجاد عمل قانوني مناسب لتأشيرتي واستشارة بشأن عقد العمل.",
            "hospitalHelp": "أحتاج مساعدة لحجز موعد طبي، مرافقة للمستشفى ومترجم طبي معتمد.",
            "mobileHelp": "أحتاج مساعدة لتشغيل شريحة اتصال اقتصادية واختيار باقة إنترنت مناسبة."
        }
    }
}

# Arabic Egyptian (arz) can clone Arabic (ar) with Egyptian tone
ALL_REMAINING["arz"] = dict(ALL_REMAINING["ar"])
ALL_REMAINING["arz"]["common"]["detail"] = "شوف التفاصيل"
ALL_REMAINING["arz"]["common"]["apply"] = "قدّم دلوقتي"

def apply_all_remaining():
    print("Injecting remaining Scandinavian, Slavic, Mediterranean, Arabic locales...")
    for code, data in ALL_REMAINING.items():
        target_path = os.path.join(MESSAGES_DIR, f"{code}.json")
        if not os.path.exists(target_path):
            continue
        with open(target_path, "r", encoding="utf-8") as f:
            content = json.load(f)

        for sec, keys in data.items():
            if sec not in content:
                content[sec] = {}
            for k, v in keys.items():
                content[sec][k] = v

        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
            f.write("\n")
    print("All specialized locales injected successfully!")

if __name__ == "__main__":
    apply_all_remaining()

