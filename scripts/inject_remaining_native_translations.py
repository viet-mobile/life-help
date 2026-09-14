# -*- coding: utf-8 -*-
"""
Inject native translations for remaining languages:
tr, ar, arz, pl, nl, fa, he, uk, sv, da, no, el, hi, bn, ta, ne, si, km, my, kk, am, tet
"""
import json
import os

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "messages")

NATIVE_DICTS = {
    "tr": {
        "common": {
            "detail": "Ayrıntıları gör",
            "apply": "Başvur",
            "safeApply": "Güvenli Başvuru",
            "platformTagline": "Çok Dilli Yaşam Hizmetleri Platformu"
        },
        "customer": {
            "priorityEmergency": "Öncelikli Acil Müdahale Hizmeti",
            "lifeSupportTitle": "Yabancı Sakinler İçin 5 Temel Yaşam Destek Hizmeti",
            "lifeSupportDesc": "Yardım talebinde bulunduğunuzda, gizliliğinizi korumak için gerçek telefon numaranız geçici 050 güvenli sanal numaraya dönüştürülür.",
            "partnerRegisterLink": "Yardımcı Ortak Olarak Kaydol →",
            "reviewLink": "Değerlendirme Bırakın →",
            "safe050Badge": "050 Güvenli Sanal Numara Gizlilik Koruma Sistemi Uygulandı"
        },
        "service": {
            "clog": "Tuvalet, Lavabo, Gider ve Kanalizasyon Tıkanıklığı Açma",
            "leakPlumbing": "Su Kaçağı Tespiti, Önleme ve Sıhhi Tesisat İşleri",
            "boiler": "Kombi, Kazan ve Şofben Kurulum, Bakım ve Onarımı",
            "cleaning": "Profesyonel Temizlik (Taşınma ve Detaylı Temizlik)",
            "housing": "Özel Oda ve Kiralık Daire Bulma Desteği",
            "bankHelp": "Banka Hesabı Açma Desteği",
            "insuranceHelp": "Sigorta Başvuru ve Kayıt Desteği",
            "jobHelp": "İş Arama ve İşe Alım Desteği",
            "hospitalHelp": "Hastane Refakati ve Tıbbi Tercümanlık",
            "mobileHelp": "Cep Telefonu Hattı ve SIM Kart Açma Desteği"
        },
        "serviceDesc": {
            "clog": "Tuvalet/lavabo taşması, yüksek basınçlı yıkama, kameralı boru içi endoskopik görüntüleme",
            "leakPlumbing": "Cihazla su kaçağı tespiti, donmuş boru tamiri, eski boru değişimi ve su yalıtımı",
            "boiler": "Gazlı/elektrikli kombi montajı, sıcak su ve petek tamiri, tesisat kontrolü",
            "cleaning": "Taşınma öncesi/sonrası temizlik, inatçı yağ lekesi çıkarma, konut dezenfeksiyonu",
            "housing": "Bütçenize ve istediğiniz konuma uygun güvenli 1-2 odalı ev bulma",
            "bankHelp": "Yabancı kimlik/pasaportla hesap açma, banka kartı alma, mobil bankacılık ve yurtdışı para transferi",
            "insuranceHelp": "Genel sağlık sigortası, yabancı çalışan zorunlu sigortaları, özel sağlık ve araç sigortası",
            "jobHelp": "Vizeye uygun yasal iş eşleştirme, özgeçmiş hazırlama ve iş sözleşmesi hak koruması",
            "hospitalHelp": "Randevu alma, kliniğe eşlik etme, uzman tıbbi tercüme ve reçete açıklamaları",
            "mobileHelp": "Yabancı adına uygun fiyatlı/ön ödemeli SIM kart açma, ekonomik tarifeler ve telefon kurulumu"
        },
        "serviceProblems": {
            "clog": "Tuvalet, lavabo veya zemin gideri tamamen tıkandı, su gitmiyor ve geri taşıyor.",
            "leakPlumbing": "Borudan veya tavandan su damlıyor, acil su tesisatçısı ve boru değişimi gerekiyor.",
            "boiler": "Kombi ekranında arıza kodu yanıp sönüyor, sıcak su gelmiyor ve petekler ısınmıyor.",
            "cleaning": "Taşınma temizliği veya mutfak/banyodaki ağır kirlerin derinlemesine temizliği gerekiyor.",
            "housing": "Bütçeme uygun, eşyalı 1 veya 2 odalı kiralık daire arıyorum.",
            "bankHelp": "Yabancı kimlik belgelerimle banka hesabı açmak, kart almak ve yurtdışına para göndermek için yardım gerekiyor.",
            "insuranceHelp": "Sağlık sigortası kaydı, zorunlu sigortalar ve tazminat talepleri için destek gerekiyor.",
            "jobHelp": "Vize durumuma uygun yasal bir iş bulma ve iş sözleşmesi danışmanlığına ihtiyacım var.",
            "hospitalHelp": "Hastaneden randevu alma, doktora eşlik etme ve tıbbi tercüman desteğine ihtiyacım var.",
            "mobileHelp": "Yabancı adıma uygun fiyatlı SIM kart çıkartmak ve internet paketi seçmek istiyorum."
        },
        "support": {
            "badge050": "050 Güvenli Numara Eşleştirme Sistemi",
            "requestTab": "Yardım İste (Hizmet Alan)",
            "partnerTab": "Yardımcı Olarak Kaydol (Hizmet Veren)",
            "successTitle": "Talebiniz Başarıyla Alındı!",
            "successDesc": "Doğrulanmış uzman ortak, tahsis edilen 050 güvenli numaranız üzerinden kısa sürede sizinle iletişime geçecektir.",
            "safePhoneLabel": "Tanımlanan 050 Güvenli Sanal Numaranız",
            "privacyBadge": "Gizlilik Koruma Altında",
            "realPhoneHidden": "Gerçek numaranız gizlenir. Ortak yalnızca bu 050 güvenli numara üzerinden arayabilir.",
            "serviceLabel": "Talep Edilen Hizmet",
            "regionLabel": "Hizmet Bölgesi",
            "selectedNeedsLabel": "Seçilen Yardım Maddeleri:",
            "memoLabel": "Ek Talepler:",
            "submitAnother": "Başka Bir Hizmet Talep Et",
            "backHome": "Ana Sayfaya Dön",
            "homeNav": "← Ana Sayfa",
            "whatHelpTitle": "Hangi konularda yardıma ihtiyacınız var? (Tüm uygun olanları işaretleyin)",
            "whatHelpDesc": "Bu konularda yetkin, bölgenizdeki doğrulanmış yerel ortaklarla eşleştirileceksiniz.",
            "contactPhoneLabel": "İletişim Telefon Numaranız",
            "safe050Title": "Otomatik 050 Güvenli Numara Dönüşüm Sistemi",
            "safe050Desc": "Kişisel gizliliğinizi korumak amacıyla gerçek telefon numaranız asla hizmet verenlere aktarılmaz.",
            "phoneInputLabel": "Cep Telefonu Numarasını Girin",
            "memoInputLabel": "Ek Bilgiler (İsteğe Bağlı)",
            "memoPlaceholder": "Tercih ettiğiniz tarih/saat, konuşmak istediğiniz dil veya özel talepleriniz.",
            "submitBtn": "050 Güvenli Numara ile Başvur",
            "phoneError": "Lütfen geçerli bir telefon numarası giriniz.",
            "needsError": "Lütfen en az bir yardım maddesi seçiniz.",
            "providerTitle": "Bölgesel Yardımcı Ortak Başvurusu (Helper Provider)",
            "providerDesc": "Uzman kişi ve işletmeleri ağımıza davet ediyoruz. 050 sistemiyle güvenli müşteri yönlendirmesi alın.",
            "providerNameLabel": "Ad Soyad veya Firma Adı",
            "providerPhoneLabel": "İletişim Telefon Numarası",
            "providerCatLabel": "Destek Verilebilecek Alanlar (Çoklu seçim)",
            "providerRegionLabel": "Ana Hizmet Bölgesi",
            "providerBioLabel": "Deneyim ve Uzmanlık Tanıtımı",
            "providerBioPlaceholder": "Mesleki deneyiminiz, sertifikalarınız ve bildiğiniz dilleri yazınız.",
            "feeAgreementTitle": "Platform İlan ve Eşleştirme Komisyon Sözleşmesi",
            "feeRuleTitle": "[LIFE.HELP Ortak Çalışma Kuralları]",
            "feeRule1": "1. Ortak, müşterilere dürüst, hızlı ve yüksek kaliteli hizmet sunmakla yükümlüdür.",
            "feeRule2": "2. 050 üzerinden gerçekleşen başarılı eşleştirmelerde makul komisyon oranını (~%10) kabul eder.",
            "feeRule3": "3. Yanıltıcı bilgi verenlerin ortaklığı derhal feshedilir ve yasal işlem başlatılabilir.",
            "feeAgreeCheck": "Yukarıdaki komisyon ve platform kurallarını kabul ediyorum. (Zorunlu)",
            "providerSubmitBtn": "Ortaklık Başvurusunu Gönder (Yönetici Onayı Bekleniyor)",
            "providerSuccessTitle": "Ortaklık Başvurusu Alındı!",
            "providerSuccessDesc": "Yönetici incelemesinin ardından onaylandığında tarafınıza bilgilendirme yapılacaktır.",
            "helperPortal": "Uzman Portalı"
        },
        "supportChecklist": {
            "bankHelp": [
                "Yabancı kimlik kartı (ARC) veya pasaport ile yeni banka hesabı açma",
                "Banka kartı (Debit) veya kredi kartı çıkarma başvurusu",
                "Mobil bankacılık, güvenlik sertifikası ve OTP kurulumu",
                "Yurtdışı para transferi limitini artırma ve ayarları yapma",
                "Kayıp kart/cüzdan yenileme ve hesap hareketleri dökümü alma"
            ],
            "insuranceHelp": [
                "Genel Sağlık Sigortası (GSS) tescil kontrolü ve kayıt işlemleri",
                "Yabancı işçi zorunlu sigortaları (dönüş/tazminat/kaza)",
                "Özel tamamlayıcı sağlık sigortası ve ameliyat/yatarak tedavi teminatı",
                "Araç ve motosikletler için zorunlu trafik ve kasko sigortası",
                "Sigorta tazminat başvuru evraklarının hazırlanması ve tercümesi"
            ],
            "jobHelp": [
                "İmalat / Fabrika üretim / Montaj / Kalite kontrol (Lojmanlı)",
                "Restoran / Mutfak yardımcısı / Garson / Aşçı",
                "İnşaat / İç dekorasyon / Sıhhi tesisat ve montaj işleri",
                "Dış ticaret / Lojistik / Tercümanlık / Ofis personeli",
                "İşverenler İçin: Güvenilir ve çalışkan yabancı personel temini"
            ],
            "hospitalHelp": [
                "Üniversite ve büyük hastanelerden uzman doktor randevusu alma",
                "Diş, ortopedi, dahiliye, cildiye muayenelerine refakat ve tercümanlık",
                "Genel sağlık taramasına eşlik etme ve sonuçların anadilde açıklanması",
                "Reçeteli ilaçların eczaneden alınması ve kullanım tarifinin anlatılması",
                "Gece acil servise başvurulduğunda telefonla acil tıbbi tercüme"
            ],
            "mobileHelp": [
                "Yabancı adına kimlik doğrulamalı uygun fiyatlı SIM kart açma",
                "Ön ödemeli (Prepaid) hat yükleme ve sınırsız internet paketleri",
                "Büyük operatörlerden taahhütlü hat açma ve yeni telefon alımı",
                "Ev için yüksek hızlı fiber internet ve Wi-Fi kurulum danışmanlığı",
                "Borçtan kapanan hattı açma ve numara taşıma işlemleri"
            ]
        }
    },
    "pl": {
        "common": {
            "detail": "Zobacz szczegóły",
            "apply": "Złóż wniosek",
            "safeApply": "Bezpieczne zgłoszenie",
            "platformTagline": "Wielojęzyczna platforma usług codziennych"
        },
        "customer": {
            "priorityEmergency": "Priorytetowe pogotowie awaryjne",
            "lifeSupportTitle": "5 kluczowych usług wsparcia życiowego dla obcokrajowców",
            "lifeSupportDesc": "Podczas zgłoszenia Twój prawdziwy numer telefonu jest szyfrowany na bezpieczny numer wirtualny 050 w celu ochrony prywatności.",
            "partnerRegisterLink": "Zarejestruj się jako partner-pomocnik →",
            "reviewLink": "Zostaw opinię →",
            "safe050Badge": "System ochrony prywatności z bezpiecznym numerem 050 aktywny"
        },
        "service": {
            "clog": "Udrażnianie toalet, zlewów, odpływów i kanalizacji",
            "leakPlumbing": "Wykrywanie wycieków wody i usługi hydrauliczne",
            "boiler": "Montaż, serwis i naprawa pieców i kotłów grzewczych",
            "cleaning": "Profesjonalne sprzątanie (przeprowadzki i doczyszczanie)",
            "housing": "Pomoc w wynajmie pokoi i mieszkań dopasowanych do budżetu",
            "bankHelp": "Pomoc w otwarciu konta bankowego",
            "insuranceHelp": "Pomoc w ubezpieczeniach",
            "jobHelp": "Pomoc w znalezieniu pracy i rekrutacja",
            "hospitalHelp": "Asysta w szpitalu i tłumaczenie medyczne",
            "mobileHelp": "Aktywacja karty SIM i telefonu"
        },
        "serviceDesc": {
            "clog": "Cofanie wody w WC/zlewie/kratce, czyszczenie hydrodynamiczne pod wysokim ciśnieniem, inspekcja wideo",
            "leakPlumbing": "Lokalizacja wycieków nowoczesnym sprzętem, naprawa zamarzniętych rur, wymiana instalacji wodnej",
            "boiler": "Montaż kotłów gazowych/elektrycznych, naprawa ciepłej wody i ogrzewania, kontrola szczelności",
            "cleaning": "Sprzątanie po przeprowadzce, usuwanie trudnych zabrudzeń, dezynfekcja lokalu",
            "housing": "Dobór bezpiecznych kawalerek i mieszkań 1-2 pokojowych zgodnie z budżetem i lokalizacją",
            "bankHelp": "Otwarcie konta na kartę pobytu/paszport, wydanie karty, bankowość mobilna i przelewy zagraniczne",
            "insuranceHelp": "Ubezpieczenie zdrowotne NFZ, obowiązkowe polisy dla cudzoziemców, ubezpieczenia komunikacyjne",
            "jobHelp": "Legalne oferty pracy pod dany typ wizy, pomoc z CV i weryfikacja umów o pracę",
            "hospitalHelp": "Umawianie wizyt u lekarzy specjalistów, asysta w klinice, profesjonalny tłumacz medyczny",
            "mobileHelp": "Tanie karty SIM na kartę i abonament dla obcokrajowców, pakiety internetowe i konfiguracja"
        },
        "serviceProblems": {
            "clog": "Toaleta, zlew lub kratka ściekowa są całkowicie zapchane, woda nie spływa i wylewa się.",
            "leakPlumbing": "Woda kapie z rury lub sufitu, pilnie potrzebny hydraulik i wymiana instalacji.",
            "boiler": "Na piecu miga kod błędu, nie ma ciepłej wody ani ogrzewania.",
            "cleaning": "Potrzebuję dokładnego sprzątania przed wprowadzeniem lub doczyszczenia tłuszczu w kuchni.",
            "housing": "Szukam umeblowanej kawalerki lub mieszkania 2-pokojowego w moim budżecie.",
            "bankHelp": "Potrzebuję pomocy w otwarciu konta na zagraniczne dokumenty, wyrobieniu karty i przelewach za granicę.",
            "insuranceHelp": "Potrzebuję pomocy w rejestracji do ubezpieczenia zdrowotnego lub zgłoszeniu szkody.",
            "jobHelp": "Szukam legalnej pracy odpowiedniej do mojej wizy oraz wsparcia przy umowie.",
            "hospitalHelp": "Potrzebuję umówić wizytę u specjalisty, asysty w szpitalu i tłumacza medycznego.",
            "mobileHelp": "Chcę zarejestrować tanią kartę SIM na swoje nazwisko i dobrać pakiet internetu."
        },
        "support": {
            "badge050": "System bezpiecznych numerów wirtualnych 050",
            "requestTab": "Poproś o pomoc (Klient)",
            "partnerTab": "Zarejestruj się jako pomocnik (Wykonawca)",
            "successTitle": "Zgłoszenie zostało pomyślnie przyjęte!",
            "successDesc": "Zweryfikowany specjalista skontaktuje się z Tobą wkrótce pod bezpiecznym numerem 050.",
            "safePhoneLabel": "Przyznany bezpieczny numer wirtualny 050",
            "privacyBadge": "Pełna ochrona prywatności",
            "realPhoneHidden": "Twój prawdziwy numer jest ukryty. Kontakt odbywa się wyłącznie przez numer 050.",
            "serviceLabel": "Wybrana usługa",
            "regionLabel": "Lokalizacja",
            "selectedNeedsLabel": "Wybrane rodzaje pomocy:",
            "memoLabel": "Dodatkowe uwagi:",
            "submitAnother": "Wyślij kolejne zgłoszenie",
            "backHome": "Powrót do strony głównej",
            "homeNav": "← Strona główna",
            "whatHelpTitle": "Jakiej pomocy potrzebujesz? (Zaznacz wszystkie pasujące opcje)",
            "whatHelpDesc": "Połączymy Cię ze zweryfikowanymi lokalnymi partnerami wyspecjalizowanymi w tych dziedzinach.",
            "contactPhoneLabel": "Twój numer telefonu kontaktowego",
            "safe050Title": "Automatyczna ochrona bezpiecznym numerem 050",
            "safe050Desc": "W celu ochrony prywatności Twój prawdziwy numer telefonu nigdy nie jest przekazywany wykonawcom.",
            "phoneInputLabel": "Wpisz numer telefonu komórkowego",
            "memoInputLabel": "Dodatkowe informacje (opcjonalnie)",
            "memoPlaceholder": "Preferowana data, język kontaktu lub szczególne życzenia.",
            "submitBtn": "Wyślij bezpieczne zgłoszenie z numerem 050",
            "phoneError": "Proszę podać poprawny numer telefonu.",
            "needsError": "Wybierz przynajmniej jedną opcję pomocy.",
            "providerTitle": "Nabór lokalnych partnerów-pomocników (Helper Provider)",
            "providerDesc": "Dołącz do naszej sieci profesjonalistów. Otrzymuj bezpieczne zlecenia przez system 050.",
            "providerNameLabel": "Imię i nazwisko lub nazwa firmy",
            "providerPhoneLabel": "Numer telefonu",
            "providerCatLabel": "Kategorie świadczonych usług (wybór wielokrotny)",
            "providerRegionLabel": "Główny rejon działania",
            "providerBioLabel": "Doświadczenie i kwalifikacje",
            "providerBioPlaceholder": "Opisz doświadczenie zawodowe, certyfikaty i języki, którymi się posługujesz.",
            "feeAgreementTitle": "Akceptacja prowizji platformy",
            "feeRuleTitle": "[Regulamin partnerów platformy LIFE.HELP]",
            "feeRule1": "1. Partner zobowiązuje się do rzetelnej, szybkiej i profesjonalnej obsługi klientów.",
            "feeRule2": "2. W przypadku udanego połączenia przez 050 partner akceptuje standardową prowizję (~10%).",
            "feeRule3": "3. Podanie fałszywych danych skutkuje natychmiastowym zablokowaniem konta.",
            "feeAgreeCheck": "Akceptuję powyższe warunki i prowizje platformy. (Wymagane)",
            "providerSubmitBtn": "Wyślij zgłoszenie partnerskie (Do akceptacji przez administratora)",
            "providerSuccessTitle": "Zgłoszenie partnerskie wysłane!",
            "providerSuccessDesc": "Twój profil zostanie aktywowany po weryfikacji przez zespół platformy.",
            "helperPortal": "Strefa specjalistów"
        },
        "supportChecklist": {
            "bankHelp": [
                "Otwarcie konta bankowego na kartę pobytu (ARC) lub paszport",
                "Wydanie karty debetowej lub karty kredytowej",
                "Konfiguracja aplikacji bankowej, certyfikatów i kodów OTP",
                "Zwiększenie i konfiguracja limitu przelewów międzynarodowych",
                "Duplikat utraconej karty/książeczki oraz wyciągi z konta"
            ],
            "insuranceHelp": [
                "Sprawdzenie i rejestracja w publicznym ubezpieczeniu zdrowotnym",
                "Obowiązkowe polisy dla pracowników zagranicznych (wyjazd/wypadek)",
                "Konsultacje w zakresie prywatnych ubezpieczeń medycznych i hospitalizacji",
                "Porównanie i zakup ubezpieczenia OC i AC dla pojazdów",
                "Pomoc przy dokumentacji do wypłaty odszkodowań i tłumaczenia"
            ],
            "jobHelp": [
                "Przemysł / Produkcja fabryczna / Montaż / Kontrola jakości (z zakwaterowaniem)",
                "Gastronomia / Pomoc kuchenna / Kelner / Kucharz",
                "Budownictwo, wykończenia wnętrz i prace instalacyjne",
                "Handel / Logistyka / Tłumaczenia / Prace biurowe",
                "Dla pracodawców: Rekrutacja rzetelnych i sprawdzonych pracowników zagranicznych"
            ],
            "hospitalHelp": [
                "Umawianie wizyt u specjalistów w szpitalach klinicznych i przychodniach",
                "Asysta i tłumaczenie medyczne: stomatologia, ortopedia, interna, dermatologia",
                "Towarzyszenie podczas badań okresowych i wyjaśnienie wyników w języku ojczystym",
                "Instrukcje dawkowania leków na receptę z apteki",
                "Pilne tłumaczenie telefoniczne w przypadku wizyty na nocnym SOR"
            ],
            "mobileHelp": [
                "Rejestracja taniej karty SIM (USIM) z weryfikacją tożsamości",
                "Doładowania kart prepaid i nielimitowane pakiety danych",
                "Abonamenty u głównych operatorów i zakup nowego smartfona",
                "Instalacja szybkiego światłowodu i Wi-Fi w mieszkaniu",
                "Spłata zaległości, odblokowanie numeru i przeniesienie do innej sieci"
            ]
        }
    },
    "nl": {
        "common": {
            "detail": "Bekijk details",
            "apply": "Aanvragen",
            "safeApply": "Veilig aanvragen",
            "platformTagline": "Meertalig platform voor levensondersteuning"
        },
        "customer": {
            "priorityEmergency": "Prioritaire nooddienst",
            "lifeSupportTitle": "5 essentiële levenshulpdiensten voor internationale bewoners",
            "lifeSupportDesc": "Bij het aanvragen van hulp wordt uw echte telefoonnummer gecodeerd naar een veilig virtueel 050-nummer voor maximale privacy.",
            "partnerRegisterLink": "Aanmelden als helper-partner →",
            "reviewLink": "Schrijf een beoordeling →",
            "safe050Badge": "Beveiligingssysteem met virtueel 050-nummer actief"
        },
        "service": {
            "clog": "Ontstoppen van toilet, gootsteen en afvoer",
            "leakPlumbing": "Lekkagedetectie en loodgieterswerkzaamheden",
            "boiler": "Installatie en reparatie van cv-ketel en boiler",
            "cleaning": "Professionele schoonmaak (verhuizing en dieptereiniging)",
            "housing": "Hulp bij het vinden van geschikte kamers en huurwoningen",
            "bankHelp": "Hulp bij het openen van een bankrekening",
            "insuranceHelp": "Hulp bij verzekeringen",
            "jobHelp": "Hulp bij werk zoeken en werving",
            "hospitalHelp": "Ziekenhuisbegeleiding en medische vertaling",
            "mobileHelp": "Aanvragen van mobiele telefoon en simkaart"
        },
        "serviceDesc": {
            "clog": "Overstroming toilet/gootsteen, hogedrukreiniging, rioolinspectie met camera",
            "leakPlumbing": "Nauwkeurige lekdetectie met apparatuur, bevroren leidingen ontdooien, leidingvervanging",
            "boiler": "Plaatsing gas-/elektrische ketel, reparatie warm water en verwarming, leidinginspectie",
            "cleaning": "Schoonmaak bij oplevering, hardnekkig vuil verwijderen, desinfectie van de woning",
            "housing": "Veilige studio's en appartementen vinden passend bij uw budget en gewenste locatie",
            "bankHelp": "Rekening openen met verblijfskaart/paspoort, pinpas, internetbankieren en internationale overboekingen",
            "insuranceHelp": "Basisverzekering, verplichte verzekeringen voor buitenlandse werknemers, auto en motor",
            "jobHelp": "Legale banen passend bij uw visum, cv-hulp en controle van arbeidscontracten",
            "hospitalHelp": "Afspraken bij specialisten, begeleiding naar kliniek, medisch tolk en uitleg van recepten",
            "mobileHelp": "Directe activatie van voordelige prepaid/abonnement simkaarten voor buitenlanders en instellen"
        },
        "serviceProblems": {
            "clog": "Toilet, gootsteen of afvoer is compleet verstopt en het water stroomt over.",
            "leakPlumbing": "Er lekt water uit een leiding of plafond, met spoed loodgieter of vervanging nodig.",
            "boiler": "Foutcode knippert op de ketel, geen warm water en geen verwarming.",
            "cleaning": "Grondige eindschoonmaak nodig voor verhuizing of hardnekkig vet in keuken/badkamer.",
            "housing": "Op zoek naar een gemeubileerde studio of appartement binnen mijn budget.",
            "bankHelp": "Hulp nodig bij het openen van een bankrekening met buitenlandse documenten en overboekingen.",
            "insuranceHelp": "Hulp nodig bij inschrijving voor de zorgverzekering of indienen van declaraties.",
            "jobHelp": "Hulp nodig bij het vinden van legaal werk volgens mijn visum en contractadvies.",
            "hospitalHelp": "Afspraak maken bij een arts, begeleiding naar het ziekenhuis en een medische tolk nodig.",
            "mobileHelp": "Hulp nodig bij het aansluiten van een voordelige simkaart en kiezen van een databundel."
        },
        "support": {
            "badge050": "050 Veilig Virtueel Nummersysteem",
            "requestTab": "Hulp aanvragen (Klant)",
            "partnerTab": "Aanmelden als helper (Dienstverlener)",
            "successTitle": "Aanvraag succesvol ontvangen!",
            "successDesc": "Een geverifieerde partner neemt spoedig contact met u op via uw veilige 050-nummer.",
            "safePhoneLabel": "Toegewezen veilig 050-nummer (050 Virtual)",
            "privacyBadge": "Privacy gewaarborgd",
            "realPhoneHidden": "Uw echte nummer blijft privé. Er wordt uitsluitend via dit 050-nummer gecommuniceerd.",
            "serviceLabel": "Gevraagde dienst",
            "regionLabel": "Gewenste regio",
            "selectedNeedsLabel": "Geselecteerde hulponderwerpen:",
            "memoLabel": "Aanvullende wensen:",
            "submitAnother": "Nog een aanvraag indienen",
            "backHome": "Terug naar startpagina",
            "homeNav": "← Startpagina",
            "whatHelpTitle": "Waar heeft u hulp bij nodig? (Vink alle toepasselijke opties aan)",
            "whatHelpDesc": "Wij koppelen u aan lokale specialisten die gecertificeerd zijn voor deze diensten.",
            "contactPhoneLabel": "Uw contacttelefoonnummer",
            "safe050Title": "Automatische bescherming met 050-nummer",
            "safe050Desc": "Om uw privacy te beschermen, wordt uw echte telefoonnummer nooit gedeeld met de dienstverleners.",
            "phoneInputLabel": "Mobiel telefoonnummer invoeren",
            "memoInputLabel": "Extra opmerkingen (optioneel)",
            "memoPlaceholder": "Gewenste tijd, voorkeurstaal of speciale instructies.",
            "submitBtn": "Aanvraag veilig versturen met 050-nummer",
            "phoneError": "Voer een geldig telefoonnummer in.",
            "needsError": "Selecteer ten minste één hulpoptie.",
            "providerTitle": "Werving van lokale helper-partners (Helper Provider)",
            "providerDesc": "Sluit u aan bij ons netwerk van specialisten. Ontvang veilige klantaanvragen via het 050-systeem.",
            "providerNameLabel": "Naam of Bedrijfsnaam",
            "providerPhoneLabel": "Telefoonnummer",
            "providerCatLabel": "Dienstcategorieën (meerdere opties mogelijk)",
            "providerRegionLabel": "Belangrijkste werkregio",
            "providerBioLabel": "Werkervaring en introductie",
            "providerBioPlaceholder": "Beschrijf uw ervaring, certificeringen en talenkennis.",
            "feeAgreementTitle": "Akkoord met bemiddelingskosten van het platform",
            "feeRuleTitle": "[Bedrijfsvoorschriften voor LIFE.HELP partners]",
            "feeRule1": "1. De partner verplicht zich tot eerlijke, snelle en hoogwaardige dienstverlening.",
            "feeRule2": "2. Bij een succesvolle koppeling via het 050-systeem gaat de partner akkoord met de commissie (~10%).",
            "feeRule3": "3. Onjuiste gegevens leiden tot directe uitschakeling en mogelijke juridische stappen.",
            "feeAgreeCheck": "Ik ga akkoord met de bemiddelingskosten en voorwaarden. (Verplicht)",
            "providerSubmitBtn": "Partneraanmelding versturen (In afwachting van goedkeuring)",
            "providerSuccessTitle": "Aanmelding partner ontvangen!",
            "providerSuccessDesc": "Uw profiel wordt geactiveerd zodra het administratieve team uw gegevens heeft gecontroleerd.",
            "helperPortal": "Specialistenportaal"
        },
        "supportChecklist": {
            "bankHelp": [
                "Nieuwe bankrekening openen met verblijfskaart (ARC) of paspoort",
                "Aanvragen en uitgeven van pinpas of creditcard",
                "Instellen van internetbankieren, digitale beveiliging en OTP",
                "Verhogen van de limiet voor buitenlandse overboekingen",
                "Duplicaat van verloren bankpas/rekeningoverzichten opvragen"
            ],
            "insuranceHelp": [
                "Controle en inschrijving voor de nationale zorgverzekering",
                "Verplichte verzekeringen voor buitenlandse werknemers (terugkeer/ongeval)",
                "Advies over aanvullende zorgverzekeringen en ziekenhuisdekking",
                "Vergelijken en afsluiten van WA- en cascoverzekeringen voor auto/motor",
                "Hulp bij schadeclaims, declaraties en vertaling van documenten"
            ],
            "jobHelp": [
                "Fabriekswerk / Assemblage / Kwaliteitscontrole (inclusief woonruimte)",
                "Horeca / Keukenhulp / Bediening / Kok",
                "Bouw, interieurafwerking en technische installaties",
                "Handel / Logistiek / Vertalen en tolken / Administratief personeel",
                "Voor werkgevers: Werving van betrouwbare buitenlandse medewerkers"
            ],
            "hospitalHelp": [
                "Afspraken maken bij specialisten in academische en algemene ziekenhuizen",
                "Begeleiding en medische vertaling bij tandarts, orthopedie, interne geneeskunde",
                "Begeleiding bij gezondheidschecks en uitleg van medische uitslagen in eigen taal",
                "Uitleg over dosering en gebruik van voorgeschreven medicijnen",
                "Telefonische noodvertaling bij nachtelijke spoedeisende hulp"
            ],
            "mobileHelp": [
                "Voordelige simkaart (USIM) afsluiten met identiteitscontrole",
                "Prepaid simkaarten opwaarderen en onbeperkte databundels",
                "Abonnementen bij grote providers en aankoop van smartphones",
                "Installatie van supersnel glasvezelinternet en Wi-Fi in huis",
                "Betaling van achterstallige rekeningen, sim deblokkeren en nummerbehoud"
            ]
        }
    }
}

def update_remaining():
    print("Updating native dictionaries for TR, PL, NL...")
    for code, data in NATIVE_DICTS.items():
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
    print("TR, PL, NL patched successfully.")

if __name__ == "__main__":
    update_remaining()

