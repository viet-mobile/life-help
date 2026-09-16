import json
import re

# Comprehensive translations for 58 items
TRANSLATIONS = {
  # Clog items
  "clog-1": {
    "ru": "Вода в унитазе совсем не уходит и переливается через край",
    "ja": "便所の水が全く流れず逆流して溢れそう",
    "th": "น้ำในโถส้วมไม่ไหลเลยและเอ่อล้นย้อนขึ้นมา",
    "uz": "Hojatxona suvi umuman ketmayapti va to'lib toshmoqda",
    "mn": "Суултуурын ус огт урсахгүй буцаж хальж байна",
    "id": "Air toilet tidak mengalir sama sekali dan meluap",
    "fr": "L'eau des toilettes ne s'évacue pas du tout et déborde",
    "de": "Toilettenwasser läuft überhaupt nicht ab und läuft über",
    "es": "El agua del inodoro no baja en absoluto y se desborda",
    "tr": "Klozet suyu kesinlikle gitmiyor ve geri taşıyor"
  },
  "clog-2": {
    "ru": "В унитаз упал посторонний предмет (влажная салфетка, щетка, крышка)",
    "ja": "便器にウェットティッシュや歯ブラシなどの異物が落ちた",
    "th": "มีสิ่งแปลกปลอม (ทิชชู่เปียก แปรงสีฟัน ฝา) ตกลงไปในโถส้วม",
    "uz": "Hojatxonaga begona narsa (nam salfetka, tish cho'tkasi, qopqoq) tushib ketdi",
    "mn": "Суултуур руу нойтон сальфетка, сойз гэх мэт гадны биет унасан",
    "id": "Benda asing (tisu basah, sikat gigi, tutup botol) jatuh ke toilet",
    "fr": "Un objet étranger (lingette, brosse, bouchon) est tombé dans les toilettes",
    "de": "Fremdkörper (Feuchttuch, Zahnbürste, Verschluss) in die Toilette gefallen",
    "es": "Un objeto extraño (toallita húmeda, cepillo, tapa) cayó en el inodoro",
    "tr": "Klozete yabancı bir cisim (ıslak mendil, fırça, kapak) düştü"
  },
  "clog-3": {
    "ru": "Из раковины на кухне идет тухлый запах и застаивается вода",
    "ja": "キッチンの流し台から悪臭がして水が溜まる",
    "th": "ท่อระบายน้ำอ่างล้างจานมีกลิ่นเหม็นเน่าและมีน้ำขัง",
    "uz": "Oshxona rakovinasidan sassiq hid kelyapti va suv to'planib qolgan",
    "mn": "Гал тогооны угаалтуурын хоолойноос өмхий үнэртэж ус тогтож байна",
    "id": "Wastafel dapur berbau busuk dan air menggenang",
    "fr": "Mauvaise odeur et eau stagnante dans l'évier de la cuisine",
    "de": "Küchenspüle stinkt faulig und das Wasser staut sich",
    "es": "El fregadero de la cocina tiene mal olor y el agua se estanca",
    "tr": "Mutfak lavabosundan kötü koku geliyor ve su birikiyor"
  },
  "clog-4": {
    "ru": "Вода переливается из шланга под раковиной или напольного слива",
    "ja": "流し台の下のホースまたは床の配管から水が溢れ出る",
    "th": "น้ำล้นออกจากสายยางใต้อ่างล้างจานหรือท่อระบายน้ำที่พื้น",
    "uz": "Rakovina ostidagi shlangdan yoki poldagi trubadan suv toshyapti",
    "mn": "Угаалтуурын доод хоолой эсвэл шалны хоолойноос ус хальж байна",
    "id": "Air meluap dari selang bawah wastafel atau saluran pembuangan lantai",
    "fr": "L'eau déborde du tuyau sous l'évier ou du siphon de sol",
    "de": "Wasser tritt aus dem Schlauch unter der Spüle oder dem Bodenablauf aus",
    "es": "El agua se desborda por la manguera debajo del fregadero o desagüe",
    "tr": "Lavabonun altındaki hortumdan veya yer giderinden su taşıyor"
  },
  "clog-5": {
    "ru": "Слив в полу ванной засорился волосами и вода поднимается",
    "ja": "浴室の床排水口が髪の毛で詰まり水が逆流する",
    "th": "ท่อระบายน้ำที่พื้นห้องน้ำอุดตันด้วยเส้นผมและน้ำเอ่อล้น",
    "uz": "Vanna polidagi drenaj sochlar tufayli tiqilib qolgan va suv ko'tarilyapti",
    "mn": "Угаалгын өрөөний шалны хоолой үснээс болж бөглөрөн ус буцаж байна",
    "id": "Saluran pembuangan kamar mandi tersumbat rambut dan air meluap",
    "fr": "Le siphon de sol de la salle de bain est bouché par des cheveux",
    "de": "Badezimmer-Bodenablauf durch Haare verstopft und Wasser steigt",
    "es": "El desagüe del piso del baño está atascado con pelo y rebosa",
    "tr": "Banyo yer gideri saçlardan tıkanmış ve su geri basıyor"
  },
  "clog-6": {
    "ru": "Из слива в прачечной или на балконе идет пена и вода",
    "ja": "洗濯室やベランダの排水管から泡と水が逆流する",
    "th": "มีฟองและน้ำเอ่อล้นออกมาจากท่อระบายน้ำในห้องซักผ้าหรือระเบียง",
    "uz": "Kir yuvish xonasi yoki balkondagi trubadan ko'pik va suv qaytib chiqyapti",
    "mn": "Угаалгын өрөө болон тагтны хоолойноос хөөс, ус буцаж байна",
    "id": "Busa dan air keluar dari saluran pembuangan ruang cuci atau balkon",
    "fr": "Mousse et eau refluent du tuyau de la buanderie ou du balcon",
    "de": "Aus dem Waschküchen- oder Balkonablauf treten Schaum und Wasser aus",
    "es": "Sale espuma y agua del desagüe del lavadero o balcón",
    "tr": "Çamaşır odası veya balkon giderinden köpük ve su taşıyor"
  },
  "clog-7": {
    "ru": "Засорилась главная канализационная труба здания или колодец",
    "ja": "建物全体のメイン汚水管または排水枡が詰まっている",
    "th": "ท่อระบายน้ำเสียหลักของอาคารหรือบ่อพักอุดตัน",
    "uz": "Bino yoki uyning asosiy kanalizatsiya trubasi tiqilib qolgan",
    "mn": "Байшингийн ерөнхий бохирын шугам эсвэл худгийн бөглөрөл",
    "id": "Saluran pembuangan limbah utama gedung atau manhole tersumbat",
    "fr": "La canalisation d'égout principale du bâtiment est bouchée",
    "de": "Hauptabwasserrohr des Gebäudes oder Abwasserschacht verstopft",
    "es": "La tubería principal de aguas residuales del edificio está bloqueada",
    "tr": "Binanın ana kanalizasyon hattı veya rögarda tıkanıklık var"
  },
  "clog-8": {
    "ru": "Требуется осмотр трубы эндоскопической камерой",
    "ja": "配管内視鏡カメラによる精密検査を希望",
    "th": "ต้องการการตรวจเช็คท่ออย่างละเอียดด้วยกล้องเอนโดสโคป",
    "uz": "Trubalarni maxsus endoskopik kamera bilan tekshirish kerak",
    "mn": "Хоолойн дурангийн камераар нарийн үзлэг хийлгэх хүсэлт",
    "id": "Pemeriksaan presisi dengan kamera endoskopik pipa diperlukan",
    "fr": "Inspection précise de la canalisation par caméra endoscopique demandée",
    "de": "Präzisionsprüfung mit Rohrendoskopkamera gewünscht",
    "es": "Se solicita inspección de tuberías con cámara endoscópica",
    "tr": "Boru içi endoskopik kamera ile detaylı inceleme talep ediliyor"
  },
  "clog-9": {
    "ru": "Необходима гидродинамическая промывка труб высоким давлением",
    "ja": "高圧洗浄機による配管洗浄・開通が必要",
    "th": "ต้องการล้างทำความสะอาดท่อด้วยเครื่องฉีดน้ำแรงดันสูง",
    "uz": "Yuqori bosimli suv yordamida trubalarni tozalash zarur",
    "mn": "Өндөр даралтын төхөөрөмжөөр хоолой цэвэрлэх шаардлагатай",
    "id": "Pembersihan kerak pipa menggunakan semprotan air bertekanan tinggi",
    "fr": "Débouchage et nettoyage haute pression des canalisations nécessaires",
    "de": "Rohrreinigung und Spülung mit Hochdruckreiniger erforderlich",
    "es": "Limpieza y desatasco de tuberías con agua a alta presión necesario",
    "tr": "Yüksek basınçlı su ile boru temizliği ve tıkanıklık açma gerekiyor"
  },
  "clog-10": {
    "ru": "Проблемы с трубой септика и обратный подпор",
    "ja": "浄化槽の接続配管のトラブルと逆流現象",
    "th": "ปัญหาเกี่ยวกับท่อเชื่อมต่อถังบำบัดน้ำเสียและน้ำเอ่อล้น",
    "uz": "Septik bakka ulanadigan trubada nosozlik va qaytish holati",
    "mn": "Септик бохирын савны холболт болон буцах үзэгдэл",
    "id": "Masalah pada pipa sambungan tangki septik dan air meluap balik",
    "fr": "Problème de raccordement à la fosse septique et refoulement",
    "de": "Probleme mit der Klärgruben-Verbindungsleitung und Rückstau",
    "es": "Problema con la tubería de la fosa séptica y reflujo",
    "tr": "Foseptik bağlantı borusu sorunu ve geri taşma durumu"
  },
  "clog-11": {
    "ru": "Засор трубы под измельчителем отходов жировыми отложениями",
    "ja": "生ゴミ粉砕機（ディスポーザー）配管の油汚れ固着詰まり",
    "th": "ท่อเครื่องบดเศษอาหารอุดตันด้วยไขมันเกาะแข็ง",
    "uz": "Chiqindi maydalagichga ulangan trubada yog' qotib qolishi",
    "mn": "Хоолны үлдэгдэл бутлагчийн хоолойн тосон бөглөрөл",
    "id": "Penyumbatan lemak mengeras pada pipa pembuangan sampah makanan",
    "fr": "Bouchon de graisse dans la canalisation du broyeur d'évier",
    "de": "Fettverstopfung im Abflussrohr des Mühlenzerkleinerers",
    "es": "Obstrucción por grasa en la tubería del triturador de desperdicios",
    "tr": "Çöp öğütücü bağlantı borusunda yağ donması ve tıkanıklık"
  },
  "clog-12": {
    "ru": "Очистка жироуловителя ресторана и прочистка труб",
    "ja": "飲食店・厨房のグリストラップ清掃および配管開通",
    "th": "ทำความสะอาดบ่อดักไขมันในร้านอาหารและลอกท่อระบายน้ำ",
    "uz": "Restoran va oshxona yog' tutqichlarini tozalash hamda trubalarni ochish",
    "mn": "Зоогийн газрын тос тунгаагуур цэвэрлэх ба хоолой нээх",
    "id": "Pembersihan perangkap lemak restoran dan pelancaran pipa",
    "fr": "Nettoyage du bac à graisse de restaurant et débouchage",
    "de": "Reinigung des Fettabscheiders im Restaurant und Rohrbefreiung",
    "es": "Limpieza de trampa de grasa de restaurante y desatasco de tuberías",
    "tr": "Restoran yağ tutucu temizliği ve boru tıkanıklığı açma"
  }
}

print("Loaded translations dictionary")

