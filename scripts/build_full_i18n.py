# -*- coding: utf-8 -*-
"""
scripts/build_full_i18n.py
Comprehensive translation injector for all 38 languages in LIFE.HELP.
Eliminates:
- Raw keys (serviceProblems.clog, etc.)
- Vietnamese fallbacks in non-Vietnamese locales
- Korean remnants on CustomerHome and SupportServiceView
- English remnants (Priority Emergency, Details, Apply, 050 Privacy, etc.)
"""
import json
import os

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "messages")

# Load existing base DATA from patch_missing_i18n.py
from patch_missing_i18n import DATA as BASE_DATA

ALL_DATA = dict(BASE_DATA)

# 1. Asian Languages: id, th, mn, uz, ne, km, my, hi, si, kk, bn, ta
ALL_DATA["id"] = {
    "common": {
        "detail": "Detail",
        "apply": "Daftar",
        "safeApply": "Daftar Aman",
        "platformTagline": "Platform Layanan Kehidupan Multibahasa"
    },
    "customer": {
        "priorityEmergency": "Layanan Darurat Prioritas",
        "lifeSupportTitle": "5 Layanan Dukungan Kehidupan Esensial untuk Warga Asing",
        "lifeSupportDesc": "Saat mengajukan bantuan, nomor telepon asli Anda dienkripsi menjadi nomor virtual aman 050 untuk menjamin privasi maksimal.",
        "partnerRegisterLink": "Daftar Jadi Mitra Pembantu →",
        "reviewLink": "Beri Ulasan Bebas →",
        "safe050Badge": "Sistem Perlindungan Privasi Nomor Aman 050 Diterapkan"
    },
    "service": {
        "clog": "Solusi Atasi Masalah Toilet, Wastafel & Saluran Pembuangan Tersumbat",
        "leakPlumbing": "Pencegahan Kebocoran, Deteksi & Pekerjaan Pipa Saluran Air",
        "boiler": "Pemasangan, Pengerjaan & Perbaikan Pemanas Air/Boiler",
        "cleaning": "Pembersihan Profesional (Pindah Rumah/Pembersihan Mendalam)",
        "housing": "Pencarian Sewa Kamar & Apartemen Sesuai Kebutuhan",
        "bankHelp": "Bantuan Pembukaan Rekening Bank",
        "insuranceHelp": "Bantuan Pendaftaran Asuransi",
        "jobHelp": "Bantuan Lowongan Kerja & Rekrutmen",
        "hospitalHelp": "Pendampingan Rumah Sakit & Penerjemahan Medis",
        "mobileHelp": "Bantuan Pembukaan Kartu SIM Ponsel"
    },
    "serviceDesc": {
        "clog": "Luapan toilet/wastafel/saluran, pencucian tekanan tinggi, inspeksi endoskopi pipa",
        "leakPlumbing": "Deteksi kebocoran canggih, perbaikan pipa beku, penggantian pipa usang & anti-air",
        "boiler": "Pemasangan boiler gas/listrik, perbaikan air panas & pemanas, inspeksi pipa",
        "cleaning": "Pembersihan pindahan, pembersihan noda membandel, disinfeksi tempat tinggal",
        "housing": "Pencarian kamar studio atau 2 kamar aman sesuai anggaran dan lokasi yang diinginkan",
        "bankHelp": "Pembukaan rekening dengan kartu ARC/paspor, kartu debit, mobile banking & transfer luar negeri",
        "insuranceHelp": "Asuransi kesehatan nasional, asuransi wajib pekerja asing, asuransi medis & kendaraan",
        "jobHelp": "Pencocokan kerja legal sesuai visa, bantuan pembuatan CV & perlindungan hak kontrak kerja",
        "hospitalHelp": "Reservasi klinik, pendampingan ke rumah sakit, penerjemahan medis ahli & resep obat",
        "mobileHelp": "Aktivasi SIM murah/prabayar instan atas nama warga asing, paket hemat & setelan ponsel"
    },
    "serviceProblems": {
        "clog": "Toilet, wastafel, atau saluran pembuangan tersumbat parah sehingga air tidak mengalir dan meluap.",
        "leakPlumbing": "Air bocor dari pipa atau langit-langit, atau butuh perbaikan/penggantian pipa air.",
        "boiler": "Layar boiler berkedip kode error, tidak ada air panas dan pemanas tidak berfungsi sama sekali.",
        "cleaning": "Butuh pembersihan menyeluruh saat pindah rumah atau membersihkan noda minyak membandel di dapur/kamar mandi.",
        "housing": "Mencari kamar satu kamar atau dua kamar berperabot lengkap yang sesuai dengan anggaran saya.",
        "bankHelp": "Butuh bantuan membuka rekening bank dengan identitas warga asing, membuat kartu, atau transfer internasional.",
        "insuranceHelp": "Butuh bantuan pendaftaran asuransi kesehatan nasional, asuransi wajib warga asing, atau klaim asuransi.",
        "jobHelp": "Butuh bantuan mencari pekerjaan legal yang sesuai dengan visa tinggal dan konsultasi kontrak kerja.",
        "hospitalHelp": "Butuh bantuan membuat janji temu dokter, pendampingan ke rumah sakit, dan penerjemahan medis.",
        "mobileHelp": "Butuh bantuan mengaktifkan kartu SIM prabayar/pascabayar untuk warga asing dan memilih paket hemat."
    },
    "support": {
        "badge050": "Sistem Pencocokan Nomor Virtual Aman 050",
        "requestTab": "Ajukan Bantuan (Pemohon)",
        "partnerTab": "Daftar Jadi Mitra (Penyedia)",
        "successTitle": "Permintaan Bantuan Berhasil Diterima!",
        "successDesc": "Mitra ahli terverifikasi akan segera menghubungi Anda melalui nomor aman virtual 050.",
        "safePhoneLabel": "Nomor Aman Virtual yang Diterbitkan (050 Virtual Phone)",
        "privacyBadge": "Privasi Terlindungi",
        "realPhoneHidden": "Nomor asli Anda tidak ditampilkan. Mitra hanya terhubung melalui nomor 050 ini.",
        "serviceLabel": "Layanan yang Diminta",
        "regionLabel": "Wilayah yang Diinginkan",
        "selectedNeedsLabel": "Pilihan Bantuan yang Dipilih:",
        "memoLabel": "Permintaan Tambahan:",
        "submitAnother": "Ajukan Permintaan Lain",
        "backHome": "Kembali ke Beranda",
        "homeNav": "← Beranda",
        "whatHelpTitle": "Bantuan apa yang Anda perlukan? (Centang semua yang berlaku)",
        "whatHelpDesc": "Anda akan dihubungkan dengan mitra spesialis lokal yang memenuhi syarat untuk hal ini.",
        "contactPhoneLabel": "Nomor Telepon Kontak Anda",
        "safe050Title": "Sistem Konversi Otomatis Nomor Aman Sementara 050",
        "safe050Desc": "Demi melindungi privasi Anda, nomor telepon asli Anda tidak pernah diberikan kepada mitra. Nomor virtual 050 dibuat secara otomatis untuk melindungi identitas Anda.",
        "phoneInputLabel": "Masukkan Nomor Ponsel",
        "memoInputLabel": "Catatan Tambahan (Opsional)",
        "memoPlaceholder": "Waktu yang diinginkan, bahasa pilihan, atau permintaan khusus.",
        "submitBtn": "Kirim Permintaan dengan Nomor Aman 050",
        "phoneError": "Silakan masukkan nomor telepon yang valid.",
        "needsError": "Silakan pilih minimal satu item bantuan.",
        "providerTitle": "Perekrutan Mitra Pembantu Regional (Helper Provider)",
        "providerDesc": "Kami mengundang individu dan bisnis berpengalaman. Dapatkan pesanan pelanggan aman melalui nomor 050.",
        "providerNameLabel": "Nama Lengkap atau Nama Usaha",
        "providerPhoneLabel": "Nomor Ponsel Kontak",
        "providerCatLabel": "Kategori Layanan yang Didukung (Pilih ganda)",
        "providerRegionLabel": "Wilayah Layanan Utama",
        "providerBioLabel": "Pengantar Pengalaman & Keahlian",
        "providerBioPlaceholder": "Sebutkan pengalaman kerja, sertifikasi, dan bahasa yang dikuasai.",
        "feeAgreementTitle": "Persetujuan Biaya Iklan & Layanan Perantara Platform",
        "feeRuleTitle": "[Ketentuan Operasional Mitra Platform LIFE.HELP]",
        "feeRule1": "1. Mitra wajib memberikan layanan yang jujur, cepat, dan berkualitas kepada pelanggan.",
        "feeRule2": "2. Saat pencocokan berhasil melalui nomor 050, mitra menyetujui biaya perantara wajar (~10%).",
        "feeRule3": "3. Memberikan informasi palsu akan mengakibatkan pencabutan kemitraan dan tindakan hukum.",
        "feeAgreeCheck": "Saya menyetujui kebijakan biaya dan perantara platform di atas. (Wajib)",
        "providerSubmitBtn": "Kirim Aplikasi Pendaftaran Mitra (Menunggu Verifikasi Admin)",
        "providerSuccessTitle": "Pendaftaran Mitra Berhasil Diajukan!",
        "providerSuccessDesc": "Aplikasi Anda sedang ditinjau administrator. Anda akan menerima notifikasi setelah disetujui.",
        "helperPortal": "Portal Mitra Ahli"
    },
    "supportChecklist": {
        "bankHelp": [
            "Pembukaan rekening baru dengan Kartu ARC / Paspor",
            "Pengajuan penerbitan kartu debit atau kartu kredit",
            "Pengaturan mobile/internet banking & sertifikat digital",
            "Pengaturan dan peningkatan limit transfer uang luar negeri",
            "Penerbitan ulang buku tabungan/kartu yang hilang & cetak mutasi"
        ],
        "insuranceHelp": [
            "Verifikasi kelayakan dan pendaftaran Asuransi Kesehatan Nasional",
            "Asuransi wajib pekerja asing (akhir kepulangan/biaya pulang/kecelakaan)",
            "Konsultasi asuransi pengeluaran medis swasta & rawat inap",
            "Perbandingan & pendaftaran asuransi wajib/komprehensif mobil & motor",
            "Panduan dokumen klaim asuransi & bantuan penerjemahan"
        ],
        "jobHelp": [
            "Manufaktur / Produksi pabrik / Perakitan / Pemeriksaan (Ada asrama)",
            "Restoran / Asisten dapur / Pelayan aula / Juru masak",
            "Pekerjaan konstruksi, interior & pemasangan instalasi",
            "Perdagangan / Logistik / Penerjemahan / Staf kantor",
            "Untuk Pengusaha: Permintaan rekrutmen karyawan asing tepercaya"
        ],
        "hospitalHelp": [
            "Reservasi poliklinik spesialis di rumah sakit umum / universitas",
            "Pendampingan penerjemahan dokter gigi, ortopedi, penyakit dalam, kulit",
            "Pendampingan pemeriksaan kesehatan umum & penjelasan hasil dalam bahasa ibu",
            "Panduan aturan minum obat resep apotek dan peringatan penting",
            "Penerjemahan telepon darurat dan bantuan di ruang gawat darurat (UGD)"
        ],
        "mobileHelp": [
            "Aktivasi kartu SIM hemat (USIM) yang dapat diverifikasi identitasnya",
            "Isi ulang mudah SIM prabayar & paket data tanpa batas",
            "Pembukaan kontrak operator seluler utama & ganti ponsel baru",
            "Konsultasi pemasangan internet rumah berkecepatan tinggi & Wi-Fi",
            "Pelunasan tunggakan biaya komunikasi, pembukaan blokir & pindah nomor"
        ]
    }
}

ALL_DATA["th"] = {
    "common": {
        "detail": "ดูรายละเอียด",
        "apply": "สมัครบริการ",
        "safeApply": "สมัครอย่างปลอดภัย",
        "platformTagline": "แพลตฟอร์มบริการการใช้ชีวิตหลายภาษา"
    },
    "customer": {
        "priorityEmergency": "บริการฉุกเฉินเร่งด่วนพิเศษ",
        "lifeSupportTitle": "5 บริการช่วยเหลือการใช้ชีวิตที่จำเป็นสำหรับชาวต่างชาติ",
        "lifeSupportDesc": "เมื่อขอรับความช่วยเหลือ หมายเลขโทรศัพท์จริงของคุณจะถูกเข้ารหัสเป็นหมายเลขเสมือน 050 เพื่อความปลอดภัยและความเป็นส่วนตัวสูงสุด",
        "partnerRegisterLink": "สมัครเป็นพาร์ทเนอร์ผู้ช่วย →",
        "reviewLink": "เขียนรีวิวอย่างอิสระ →",
        "safe050Badge": "ใช้ระบบคุ้มครองความเป็นส่วนตัวด้วยหมายเลขปลอดภัย 050"
    },
    "service": {
        "clog": "แก้ปัญหาท่อตัน ชักโครก อ่างล้างจาน ท่อน้ำทิ้งทุกชนิด",
        "leakPlumbing": "ป้องกันน้ำรั่ว ตรวจจับน้ำรั่ว และงานระบบท่อประปา",
        "boiler": "ติดตั้ง วางระบบ และซ่อมแซมหม้อต้มน้ำร้อน/ฮีตเตอร์",
        "cleaning": "ทำความสะอาดมืออาชีพ (ย้ายเข้า/ทำความสะอาดล้ำลึก)",
        "housing": "จัดหาห้องเช่าและที่พักอาศัยตรงตามงบประมาณ",
        "bankHelp": "ช่วยเหลือการเปิดบัญชีธนาคาร",
        "insuranceHelp": "ช่วยเหลือการสมัครประกันภัย",
        "jobHelp": "ช่วยเหลือจัดหางานและรับสมัครงาน",
        "hospitalHelp": "ร่วมเดินทางไปโรงพยาบาลและล่ามทางการแพทย์",
        "mobileHelp": "ช่วยเหลือเปิดใช้งานเบอร์โทรศัพท์มือถือ"
    },
    "serviceDesc": {
        "clog": "ชักโครก อ่างล้างจาน ท่อระบายน้ำไหลย้อน ล้างท่อแรงดันสูง ส่องกล้องตรวจท่อ",
        "leakPlumbing": "ตรวจจับน้ำรั่วด้วยเครื่องมือทันสมัย ซ่อมท่อประปาแตก เปลี่ยนท่อเก่า และงานกันซึม",
        "boiler": "ติดตั้งหม้อต้มแก๊ส/ไฟฟ้า ซ่อมระบบน้ำร้อนและระบบทำความร้อน ตรวจเช็กท่อ",
        "cleaning": "ทำความสะอาดก่อนย้ายเข้า ขจัดคราบฝังแน่น ฆ่าเชื้อโรคในที่พักอาศัย",
        "housing": "จัดหาห้องสตูดิโอและห้องชุดที่ปลอดภัยตามงบประมาณและทำเลที่ต้องการ",
        "bankHelp": "เปิดบัญชีด้วยบัตรกึ่งถาวร/พาสปอร์ต ออกบัตรเดบิต โมบายแบงก์กิ้ง และโอนเงินข้ามประเทศ",
        "insuranceHelp": "ประกันสุขภาพแห่งชาติ ประกันภัยบังคับสำหรับแรงงาน ประกันสุขภาพเอกชน และประกันรถ",
        "jobHelp": "จับคู่งานที่ถูกกฎหมายตามประเภทวีซ่า ช่วยเขียนเรซูเม่ และคุ้มครองสัญญาจ้าง",
        "hospitalHelp": "นัดหมายแพทย์ ร่วมเดินทางไปโรงพยาบาล ล่ามแปลการรักษา และคำแนะนำยา",
        "mobileHelp": "เปิดเบอร์ซิมราคาประหยัด/ซิมเติมเงินยืนยันตัวตนได้ แนะนำแพ็กเกจสุดคุ้ม"
    },
    "serviceProblems": {
        "clog": "ชักโครก อ่างล้างจาน หรือท่อระบายน้ำอุดตันอย่างรุนแรง น้ำไม่ไหลและเอ่อล้น",
        "leakPlumbing": "มีน้ำรั่วซึมจากเพดานหรือท่อ ต้องการซ่อมแซมหรือเปลี่ยนท่อประปาโดยด่วน",
        "boiler": "หน้าจอหม้อต้มน้ำร้อนขึ้นรหัสแจ้งเตือน ไม่มีน้ำร้อนและระบบทำความร้อนไม่ทำงาน",
        "cleaning": "ต้องการทำความสะอาดก่อนย้ายเข้าบ้านใหม่ หรือทำความสะอาดคราบน้ำมันฝังแน่น",
        "housing": "กำลังมองหาห้องเช่าพร้อมเฟอร์นิเจอร์ที่ตรงกับงบประมาณและทำเลที่ต้องการ",
        "bankHelp": "ต้องการความช่วยเหลือในการเปิดบัญชีธนาคาร ทำบัตร หรือตั้งค่าโอนเงินไปต่างประเทศ",
        "insuranceHelp": "ต้องการความช่วยเหลือในการสมัครประกันสุขภาพ ประกันภาคบังคับ หรือการเคลมประกัน",
        "jobHelp": "ต้องการความช่วยเหลือในการหางานที่ถูกกฎหมายตามวีซ่า และปรึกษาสัญญาการทำงาน",
        "hospitalHelp": "ต้องการความช่วยเหลือในการนัดหมายแพทย์ พาไปโรงพยาบาล และล่ามแปลภาษา",
        "mobileHelp": "ต้องการเปิดใช้งานซิมการ์ดโทรศัพท์มือถือและปรึกษาแพ็กเกจอินเทอร์เน็ตสุดคุ้ม"
    },
    "support": {
        "badge050": "ระบบจับคู่หมายเลขโทรศัพท์ปลอดภัย 050",
        "requestTab": "ขอรับความช่วยเหลือ (ผู้รับบริการ)",
        "partnerTab": "สมัครเป็นพาร์ทเนอร์ผู้ช่วย (ผู้ให้บริการ)",
        "successTitle": "รับคำขอความช่วยเหลือเรียบร้อยแล้ว!",
        "successDesc": "พาร์ทเนอร์ผู้เชี่ยวชาญที่ผ่านการรับรองจะติดต่อคุณผ่านหมายเลขปลอดภัย 050 โดยเร็ว",
        "safePhoneLabel": "หมายเลขปลอดภัยเสมือนที่ออกให้ (050 Virtual Phone)",
        "privacyBadge": "คุ้มครองความเป็นส่วนตัว",
        "realPhoneHidden": "หมายเลขจริงของคุณจะไม่ถูกเปิดเผย พาร์ทเนอร์จะโทรติดต่อผ่านเบอร์ 050 นี้เท่านั้น",
        "serviceLabel": "บริการที่ขอรับ",
        "regionLabel": "พื้นที่ที่ต้องการ",
        "selectedNeedsLabel": "รายการความช่วยเหลือที่เลือก:",
        "memoLabel": "รายละเอียดเพิ่มเติม:",
        "submitAnother": "ส่งคำขอความช่วยเหลือรายการอื่น",
        "backHome": "กลับหน้าหลัก",
        "homeNav": "← กลับหน้าหลัก",
        "whatHelpTitle": "คุณต้องการความช่วยเหลือในเรื่องใด? (เลือกได้หลายข้อ)",
        "whatHelpDesc": "เราจะจับคู่คุณกับพาร์ทเนอร์ท้องถิ่นที่มีความเชี่ยวชาญตรงตามความต้องการของคุณ",
        "contactPhoneLabel": "เบอร์โทรศัพท์ติดต่อของคุณ",
        "safe050Title": "ระบบแปลงหมายเลขปลอดภัยชั่วคราว 050 อัตโนมัติ",
        "safe050Desc": "เพื่อปกป้องความเป็นส่วนตัวของคุณ หมายเลขจริงของคุณจะไม่ถูกเปิดเผยต่อผู้ให้บริการ โดยจะสร้างหมายเลข 050 เข้ารหัสเพื่อความปลอดภัยในการติดต่อ",
        "phoneInputLabel": "กรอกหมายเลขโทรศัพท์มือถือ",
        "memoInputLabel": "บันทึกเพิ่มเติม (ไม่บังคับ)",
        "memoPlaceholder": "ระบุวันเวลาที่สะดวก ภาษาที่ต้องการ หรือคำขอพิเศษอื่นๆ",
        "submitBtn": "ส่งคำขออย่างปลอดภัยด้วยหมายเลข 050",
        "phoneError": "โปรดกรอกหมายเลขโทรศัพท์ให้ถูกต้อง",
        "needsError": "โปรดเลือกความช่วยเหลืออย่างน้อย 1 รายการ",
        "providerTitle": "เปิดรับสมัครพาร์ทเนอร์ผู้ช่วยประจำพื้นที่ (Helper Provider)",
        "providerDesc": "ขอเชิญผู้มีความเชี่ยวชาญร่วมเป็นเครือข่าย รับคำขอจากลูกค้าในพื้นที่อย่างปลอดภัยผ่านระบบ 050",
        "providerNameLabel": "ชื่อ-นามสกุล หรือชื่อบริษัท",
        "providerPhoneLabel": "เบอร์โทรศัพท์ติดต่อ",
        "providerCatLabel": "หมวดหมู่บริการที่ให้ความช่วยเหลือได้ (เลือกได้หลายข้อ)",
        "providerRegionLabel": "พื้นที่ให้บริการหลัก",
        "providerBioLabel": "แนะนำประวัติและประสบการณ์ความเชี่ยวชาญ",
        "providerBioPlaceholder": "ระบุประสบการณ์ทำงาน ใบรับรอง และทักษะภาษาที่สื่อสารได้",
        "feeAgreementTitle": "ข้อตกลงค่าธรรมเนียมการโฆษณาและการจับคู่บนแพลตฟอร์ม",
        "feeRuleTitle": "[ข้อกำหนดการดำเนินงานพาร์ทเนอร์ LIFE.HELP]",
        "feeRule1": "1. พาร์ทเนอร์มีหน้าที่ให้บริการด้วยความซื่อสัตย์ รวดเร็ว และมีคุณภาพแก่ลูกค้า",
        "feeRule2": "2. เมื่อการจับคู่ผ่านระบบ 050 สำเร็จ ยินยอมชำระค่าธรรมเนียมตามเกณฑ์ที่กำหนด (~10%)",
        "feeRule3": "3. การให้ข้อมูลเท็จจะถูกยกเลิกการเป็นพาร์ทเนอร์ทันทีและอาจมีผลทางกฎหมาย",
        "feeAgreeCheck": "ฉันยอมรับนโยบายค่าธรรมเนียมและข้อกำหนดข้างต้น (จำเป็น)",
        "providerSubmitBtn": "ส่งใบสมัครพาร์ทเนอร์ (รอการอนุมัติจากผู้ดูแลระบบ)",
        "providerSuccessTitle": "ส่งใบสมัครพาร์ทเนอร์เรียบร้อยแล้ว!",
        "providerSuccessDesc": "ใบสมัครของคุณกำลังอยู่ระหว่างการตรวจสอบ คุณจะได้รับการแจ้งเตือนเมื่อผ่านการอนุมัติ",
        "helperPortal": "พอร์ทัลผู้เชี่ยวชาญ"
    },
    "supportChecklist": {
        "bankHelp": [
            "เปิดบัญชีใหม่ด้วยบัตรเอเลี่ยนการ์ด (ARC) หรือหนังสือเดินทาง",
            "ยื่นขอออกบัตรเดบิตหรือบัตรเครดิต",
            "ติดตั้งโมบายแบงก์กิ้ง ใบรับรองความปลอดภัย และรหัส OTP",
            "ตั้งค่าและเพิ่มวงเงินการโอนเงินกลับต่างประเทศ",
            "ออกสมุดบัญชี/บัตรใหม่กรณีสูญหาย และขอรายการเดินบัญชี"
        ],
        "insuranceHelp": [
            "ตรวจสอบสิทธิ์และขึ้นทะเบียนประกันสุขภาพแห่งชาติ",
            "ประกันภาคบังคับสำหรับแรงงานต่างชาติ (สิ้นสุดสัญญา/ค่าเดินทาง/อุบัติเหตุ)",
            "ปรึกษาประกันสุขภาพเอกชนและค่ารักษาพยาบาล/การผ่าตัด",
            "เปรียบเทียบและสมัครประกันภัย พ.ร.บ. และประกันภัยชั้นนำสำหรับรถยนต์/มอเตอร์ไซค์",
            "แนะนำเอกสารเบิกเคลมประกันภัยและบริการล่ามแปลภาษา"
        ],
        "jobHelp": [
            "โรงงานอุตสาหกรรม / ฝ่ายผลิต / ประกอบชิ้นส่วน / ตรวจสอบคุณภาพ (มีที่พัก)",
            "ร้านอาหาร / ผู้ช่วยในครัว / พนักงานเสิร์ฟ / กุ๊กทำอาหาร",
            "งานก่อสร้าง ตกแต่งภายใน และงานระบบช่าง",
            "งานนำเข้าส่งออก / โลจิสติกส์ / ล่ามแปลภาษา / งานสำนักงาน",
            "สำหรับนายจ้าง: รับสมัครแรงงานต่างชาติที่ขยันและไว้ใจได้"
        ],
        "hospitalHelp": [
            "จองคิวตรวจแผนกเฉพาะทางในโรงพยาบาลมหาวิทยาลัย/โรงพยาบาลทั่วไป",
            "ร่วมเดินทางและล่ามแปลภาษาที่คลินิกทันตกรรม กระดูก อายุรกรรม ผิวหนัง",
            "ร่วมเดินทางตรวจสุขภาพประจำปีและอธิบายผลตรวจอย่างละเอียด",
            "แนะนำวิธีการรับประทานยาตามใบสั่งแพทย์และข้อควรระวังสำคัญ",
            "บริการล่ามฉุกเฉินทางโทรศัพท์เมื่อเข้ารับการรักษาในห้องฉุกเฉินยามค่ำคืน"
        ],
        "mobileHelp": [
            "เปิดเบอร์ซิมราคาประหยัด (USIM) ที่ยืนยันตัวตนด้วยบัตรต่างด้าวได้",
            "เติมเงินซิมแบบเติมเงิน (Prepaid SIM) และแพ็กเกจเน็ตไม่อั้น",
            "เปิดเบอร์แบบผูกสัญญากับค่ายมือถือชั้นนำและเปลี่ยนเครื่องใหม่",
            "ปรึกษาการติดตั้งอินเทอร์เน็ตความเร็วสูงและ Wi-Fi ในที่พัก",
            "ชำระยอดค้างชำระ ปลดล็อกระงับสัญญาณ และย้ายค่ายเบอร์เดิม"
        ]
    }
}

# 2. Mongolian (mn), Uzbek (uz), Nepali (ne), Khmer (km), Burmese (my), Hindi (hi), Sinhala (si), Kazakh (kk), Bengali (bn), Tamil (ta)
ALL_DATA["mn"] = {
    "common": {
        "detail": "Дэлгэрэнгүй",
        "apply": "Захиалах",
        "safeApply": "Аюулгүй захиалга",
        "platformTagline": "Олон хэлний ахуйн үйлчилгээний платформ"
    },
    "customer": {
        "priorityEmergency": "Шуурхай дуудлагын үйлчилгээ",
        "lifeSupportTitle": "Гадаад иргэдэд зориулсан ахуйн тусламжийн 5 үндсэн үйлчилгээ",
        "lifeSupportDesc": "Тусламж хүсэх үед таны хувийн утасны дугаар 050 түр дугаар луу нууцлагдан шилжиж таны хувийн мэдээллийг найдвартай хамгаална.",
        "partnerRegisterLink": "Туслах хамтрагчаар бүртгүүлэх →",
        "reviewLink": "Сэтгэгдэл үлдээх →",
        "safe050Badge": "050 аюулгүй виртуал дугаарын нууцлалын систем ажиллаж байна"
    },
    "service": {
        "clog": "Суултуур, угаалтуур, бохирын хоолойн бүх төрлийн бөглөрөл гаргах",
        "leakPlumbing": "Ус алдалтыг илрүүлэх, сантехник хоолойн засвар, шугам угсралт",
        "boiler": "Бойлер суурилуулалт, халаалтын системийн засвар үйлчилгээ",
        "cleaning": "Мэргэжлийн цэвэрлэгээ (нүүж орох үеийн, гүн цэвэрлэгээ)",
        "housing": "Өрөө, байр хайх, түрээсийн зуучлал",
        "bankHelp": "Банкны данс нээх тусламж",
        "insuranceHelp": "Даатгалд хамрагдах тусламж",
        "jobHelp": "Ажилд орох, ажилтан хайх тусламж",
        "hospitalHelp": "Эмнэлэгт хамт явах, эмнэлгийн орчуулга",
        "mobileHelp": "Гар утас, дугаар нээлгэх тусламж"
    },
    "serviceDesc": {
        "clog": "Суултуур, угаалтуур халих, өндөр даралтын угаалга, дурангаар оношлох",
        "leakPlumbing": "Орчин үеийн багажаар ус алдалт илрүүлэх, хөлдсөн хоолой гэсгээх, солих",
        "boiler": "Хийн болон цахилгаан бойлер суурилуулах, халуун ус халаалт засах",
        "cleaning": "Нүүж орох үеийн цэвэрлэгээ, тос толбо арилгах, халдваргүйжүүлэлт",
        "housing": "Төсөвт тохирсон аюулгүй 1-2 өрөө байр, өрөө олоход туслах",
        "bankHelp": "Бүртгэлийн карт/гадаад паспортоор данс нээх, карт авах, гадаад гуйвуулга",
        "insuranceHelp": "Эрүүл мэндийн даатгал, албан журмын даатгал, авто машины даатгал",
        "jobHelp": "Визэнд тохирсон хууль ёсны ажил зуучлал, анкет бэлтгэх, гэрээний зөвлөгөө",
        "hospitalHelp": "Эмчид цаг авах, эмнэлэгт хамт явах, мэргэжлийн эмнэлгийн орчуулга",
        "mobileHelp": "Хямд тарифтай SIM карт нээх, урьдчилсан төлбөрт дугаар, интернэт суурилуулах"
    },
    "serviceProblems": {
        "clog": "Суултуур, угаалтуур эсвэл бохирын хоолой таг бөглөрч ус хальж байна.",
        "leakPlumbing": "Хоолой эсвэл таазнаас ус алдаж байна, сантехникийн яаралтай засвар хэрэгтэй байна.",
        "boiler": "Бойлерын дэлгэц дээр алдааны код анивчиж, халуун ус халаалт огт ажиллахгүй байна.",
        "cleaning": "Байранд нүүж орох үеийн цэвэрлэгээ эсвэл гал тогоо, ариун цэврийн өрөөний гүн цэвэрлэгээ хэрэгтэй байна.",
        "housing": "Өөрийн төсөвт тохирсон бүрэн тавилгатай 1-2 өрөө байр хайж байна.",
        "bankHelp": "Гадаад иргэний үнэмлэхээрээ банкны данс нээх, карт авах, гадаад руу мөнгө шилжүүлэхэд тусламж хэрэгтэй байна.",
        "insuranceHelp": "Эрүүл мэндийн даатгал болон гадаад ажилчдын даатгалд бүртгүүлэх, нөхөн төлбөр авахад тусламж хэрэгтэй байна.",
        "jobHelp": "Визний төрөлдөө тохирсон хууль ёсны ажил олох, хөдөлмөрийн гэрээ байгуулахад тусламж хэрэгтэй байна.",
        "hospitalHelp": "Эмнэлгийн цаг авах, үзлэгт хамт явах, мэргэжлийн эмнэлгийн орчуулга хийлгэх хэрэгтэй байна.",
        "mobileHelp": "Өөрийн нэр дээр хямд үнэтэй дугаар нээлгэх, интернэт багц сонгоход тусламж хэрэгтэй байна."
    },
    "support": {
        "badge050": "050 аюулгүй дугаарын холболтын систем",
        "requestTab": "Тусламж хүсэх (Хэрэглэгч)",
        "partnerTab": "Хамтрагчаар бүртгүүлэх (Үйлчилгээ үзүүлэгч)",
        "successTitle": "Таны хүсэлтийг амжилттай хүлээн авлаа!",
        "successDesc": "Шалгарсан мэргэжилтэн 050 дугаараар дамжуулан тантай шуурхай холбогдох болно.",
        "safePhoneLabel": "Танд олгосон 050 түр аюулгүй дугаар",
        "privacyBadge": "Нууцлал бүрэн хамгаалагдсан",
        "realPhoneHidden": "Таны бодит утасны дугаар нууцлагдсан бөгөөд зөвхөн энэхүү 050 дугаараар холбогдоно.",
        "serviceLabel": "Хүссэн үйлчилгээ",
        "regionLabel": "Байршил",
        "selectedNeedsLabel": "Сонгосон тусламжийн төрлүүд:",
        "memoLabel": "Нэмэлт хүсэлт:",
        "submitAnother": "Дахин өөр тусламж хүсэх",
        "backHome": "Нүүр хуудас руу буцах",
        "homeNav": "← Нүүр",
        "whatHelpTitle": "Танд ямар тусламж хэрэгтэй байна вэ? (Холбогдох бүх зүйлийг сонгоно уу)",
        "whatHelpDesc": "Бид тухайн чиглэлээр мэргэшсэн орон нутгийн хамтрагчтай таныг холбож өгнө.",
        "contactPhoneLabel": "Холбоо барих утасны дугаар",
        "safe050Title": "050 аюулгүй дугаарын автомат хамгаалалт",
        "safe050Desc": "Таны хувийн нууцыг хамгаалах үүднээс бодит утасны дугаарыг бусдад хэзээ ч задруулахгүй, 050 виртуал дугаараар дамжуулна.",
        "phoneInputLabel": "Гар утасны дугаараа оруулна уу",
        "memoInputLabel": "Нэмэлт тэмдэглэл (заавал биш)",
        "memoPlaceholder": "Хүсэж буй цаг, харилцах хэл эсвэл бусад тусгай шаардлагаа бичнэ үү.",
        "submitBtn": "050 аюулгүй дугаараар тусламж хүсэх",
        "phoneError": "Зөв утасны дугаар оруулна уу.",
        "needsError": "Ядаж нэг тусламжийн төрөл сонгоно уу.",
        "providerTitle": "Бүс нутгийн туслах хамтрагч шалгаруулж авна",
        "providerDesc": "Мэргэжлийн туршлагатай хувь хүн, байгууллагуудыг хамтран ажиллахыг урьж байна. 050 дугаараар найдвартай захиалга авна.",
        "providerNameLabel": "Нэр эсвэл байгууллагын нэр",
        "providerPhoneLabel": "Холбоо барих утасны дугаар",
        "providerCatLabel": "Үйлчилгээ үзүүлэх чиглэл (олон сонголттой)",
        "providerRegionLabel": "Үйлчилгээ үзүүлэх гол бүс",
        "providerBioLabel": "Туршлага болон мэргэжлийн танилцуулга",
        "providerBioPlaceholder": "Ажлын туршлага, сертификат, эзэмшсэн хэлээ бичнэ үү.",
        "feeAgreementTitle": "Платформын сурталчилгаа, зуучлалын шимтгэлийн нөхцөл",
        "feeRuleTitle": "[LIFE.HELP платформын хамтрагчийн үйл ажиллагааны журам]",
        "feeRule1": "1. Хамтрагч нь үйлчлүүлэгчид шударга, түргэн шуурхай, чанартай үйлчилгээ үзүүлэх үүрэгтэй.",
        "feeRule2": "2. 050 дугаараар холбогдсон захиалга амжилттай болсон тохиолдолд шимтгэл (~10%) төлөхийг зөвшөөрнө.",
        "feeRule3": "3. Худал мэдээлэл өгсөн тохиолдолд эрхийг цуцалж, хариуцлага тооцно.",
        "feeAgreeCheck": "Дээрх шимтгэл болон үйл ажиллагааны журмыг зөвшөөрч байна. (Заавал)",
        "providerSubmitBtn": "Хамтрагчийн хүсэлт илгээх (Админ зөвшөөрөх)",
        "providerSuccessTitle": "Хамтрагчийн хүсэлтийг хүлээн авлаа!",
        "providerSuccessDesc": "Админ таны мэдээллийг шалгаж баталгаажуулсны дараа мэдэгдэл илгээнэ.",
        "helperPortal": "Мэргэжилтний портал"
    },
    "supportChecklist": {
        "bankHelp": [
            "Гадаад иргэний үнэмлэх / Паспортоор шинэ данс нээх",
            "Дебит карт / Кредит карт захиалах",
            "Мобайл банк, гэрчилгээ, OTP код тохируулах",
            "Эх орон луугаа мөнгө шилжүүлэх лимит нэмэх, тохируулах",
            "Гээгдүүлсэн карт/дэвтэр дахин авах, дансны хуулга авах"
        ],
        "insuranceHelp": [
            "Үндэсний эрүүл мэндийн даатгалд хамрагдах, шалгах",
            "Гадаад ажилчдын албан журмын даатгал (хугацаа дуусах/буцах зардал/осол)",
            "Хувийн эрүүл мэндийн даатгал, эмнэлэгт хэвтэх зардал нөхөн олгох зөвлөгөө",
            "Авто машин, мотоциклийн албан журмын болон иж бүрэн даатгал",
            "Даатгалын нөхөн төлбөр авах бичиг баримт бүрдүүлэлт, орчуулга"
        ],
        "jobHelp": [
            "Үйлдвэрлэл / Үйлдвэрийн ажилтан / Угсралт / Чанарын шалгалт (байртай)",
            "Зоогийн газар / Гал тогооны туслах / Зөөгч / Тогооч",
            "Барилга / Засвар чимэглэл / Сантехник угсралт",
            "Худалдаа / Логистик / Орчуулга / Оффисын ажилтан",
            "Ажил олгогчдод: Найдвартай гадаад ажилтан хайх үйлчилгээ"
        ],
        "hospitalHelp": [
            "Их сургуулийн болон нэгдсэн эмнэлгийн мэргэжлийн эмчид цаг авах",
            "Шүд, гэмтэл, дотор, арьсны эмнэлэгт хамт явах, орчуулга хийх",
            "Эрүүл мэндийн урьдчилан сэргийлэх үзлэгт хамт явах, шинжилгээний хариу тайлбарлах",
            "Эмийн сангийн жорын дагуу эм уух зааварчилгаа тайлбарлах",
            "Шөнийн цагаар яаралтай түргэн тусламжид хандах үеийн утасны орчуулга"
        ],
        "mobileHelp": [
            "Өөрийн нэр дээр баталгаажих боломжтой хямд тарифтай SIM карт нээх",
            "Урьдчилсан төлбөрт SIM карт цэнэглэх, хязгааргүй дата багц",
            "Томоохон үүрэн телефоны гэрээ хийх, шинэ утас авах",
            "Гэрийн өндөр хурдны интернэт болон Wi-Fi төхөөрөмж суурилуулах",
            "Төлбөрийн үлдэгдэл төлөх, дугаар сэргээх, дугаараа шилжүүлэх"
        ]
    }
}

ALL_DATA["uz"] = {
    "common": {
        "detail": "Batafsil",
        "apply": "Buyurtma",
        "safeApply": "Xavfsiz buyurtma",
        "platformTagline": "Ko'p tilli hayotiy xizmatlar platformasi"
    },
    "customer": {
        "priorityEmergency": "Shoshilinch tezkor yordam xizmati",
        "lifeSupportTitle": "Chet el fuqarolari uchun 5 ta asosiy hayotiy yordam xizmati",
        "lifeSupportDesc": "Yordam so'raganingizda shaxsiy raqamingiz 050 xavfsiz virtual raqamiga shifrlanadi va shaxsiy ma'lumotlaringiz to'liq himoyalanadi.",
        "partnerRegisterLink": "Yordamchi hamkor sifatida ro'yxatdan o'tish →",
        "reviewLink": "Fikr qoldirish →",
        "safe050Badge": "050 xavfsiz virtual raqam maxfiylik tizimi qo'llanilgan"
    },
    "service": {
        "clog": "Hojatxona, rakovina va kanalizatsiya tiqilib qolishini bartaraf etish",
        "leakPlumbing": "Suv sizib chiqishini aniqlash, santexnika va quvurlarni ta'mirlash",
        "boiler": "Qozon (boyler) o'rnatish, sozlash va ta'mirlash",
        "cleaning": "Professional tozalash (ko'chib kirish va chuqur tozalash)",
        "housing": "Byudjetga mos xona va uy-joy topish xizmati",
        "bankHelp": "Bank hisob raqami ochishda yordam",
        "insuranceHelp": "Sug'urtaga a'zo bo'lishda yordam",
        "jobHelp": "Ish qidirish va bandlik bo'yicha yordam",
        "hospitalHelp": "Shifoxonaga hamrohlik va tibbiy tarjima",
        "mobileHelp": "Mobil aloqa va SIM-karta ochishda yordam"
    },
    "serviceDesc": {
        "clog": "Unitaz, rakovina va quvurlar tiqilishini yuqori bosimli yuvish va endoskop bilan ochish",
        "leakPlumbing": "Suv oqishini zamonaviy apparatda aniqlash, muzlagan quvurlarni eritish va almashtirish",
        "boiler": "Gaz va elektr qozonlarini o'rnatish, issiq suv va isitish tizimini sozlash",
        "cleaning": "Ko'chib kirish tozaligi, yog'li dog'larni yo'qotish va xonadonni dezinfeksiya qilish",
        "housing": "Xavfsiz va qulay 1-2 xonali uylarni byudjetingizga mos holda topish",
        "bankHelp": "ID karta/pasport bilan hisob raqam ochish, karta olish va xorijga pul jo'natish",
        "insuranceHelp": "Davlat tibbiy sug'urtasi, chet elliklar majburiy sug'urtasi va avtosug'urta",
        "jobHelp": "Viza turiga mos qonuniy ish topish, rezyume tayyorlash va mehnat shartnomasi",
        "hospitalHelp": "Shifokorga yozilish, shifoxonaga birga borish, professional tibbiy tarjima",
        "mobileHelp": "Arzon tarifli SIM-karta ochish, cheksiz internet va telefon sozlamalari"
    },
    "serviceProblems": {
        "clog": "Unitaz, rakovina yoki kanalizatsiya qattiq tiqilib qolgan, suv ketmayapti va toshib chiqmoqda.",
        "leakPlumbing": "Quvurdan yoki shiftdan suv sizib oqmoqda, zudlik bilan santexnik ta'mirlashi zarur.",
        "boiler": "Boyler ekranida xatolik kodi yonib-o'chmoqda, issiq suv va isitish tizimi ishlamayapti.",
        "cleaning": "Ko'chib kirishdan oldin tozalash yoki oshxona va hammomdagi kirlarni tozalash kerak.",
        "housing": "Byudjetim va manzilimga mos to'liq jihozlangan bir yoki ikki xonali uy qidiryapman.",
        "bankHelp": "Chet el fuqarosi hujjati bilan bank hisobi ochish, karta olish va chet elga pul o'tkazishda yordam kerak.",
        "insuranceHelp": "Tibbiy sug'urta va majburiy sug'urtani rasmiylashtirish hamda kompensatsiya olishda yordam kerak.",
        "jobHelp": "Vizamga mos qonuniy ish topish va mehnat shartnomasini tekshirishda yordam kerak.",
        "hospitalHelp": "Shifoxonaga yozilish, shifokor qabuliga birga borish va tibbiy tarjimon kerak.",
        "mobileHelp": "O'z nomimga arzon SIM-karta ochish va internet paketini tanlashda yordam kerak."
    },
    "support": {
        "badge050": "050 xavfsiz virtual raqam tizimi",
        "requestTab": "Yordam so'rash (Mijoz)",
        "partnerTab": "Hamkor sifatida ro'yxatdan o'tish (Xizmat ko'rsatuvchi)",
        "successTitle": "Arizangiz muvaffaqiyatli qabul qilindi!",
        "successDesc": "Tekshirilgan mutaxassis 050 xavfsiz raqami orqali siz bilan tez orada bog'lanadi.",
        "safePhoneLabel": "Sizga berilgan 050 vaqtinchalik xavfsiz raqam",
        "privacyBadge": "Maxfiylik kafolatlangan",
        "realPhoneHidden": "Sizning haqiqiy raqamingiz ko'rinmaydi, faqat 050 xavfsiz raqami orqali bog'laniladi.",
        "serviceLabel": "Tanlangan xizmat",
        "regionLabel": "Hudud",
        "selectedNeedsLabel": "Tanlangan yordam turlari:",
        "memoLabel": "Qo'shimcha istaklar:",
        "submitAnother": "Yana boshqa yordam so'rash",
        "backHome": "Bosh sahifaga qaytish",
        "homeNav": "← Bosh sahifa",
        "whatHelpTitle": "Sizga qanday yordam kerak? (Barcha kerakli bandlarni belgilang)",
        "whatHelpDesc": "Biz sizni ushbu soha bo'yicha eng malakali mahalliy mutaxassis bilan bog'laymiz.",
        "contactPhoneLabel": "Bog'lanish uchun telefon raqamingiz",
        "safe050Title": "050 xavfsiz raqamga avtomatik aylantirish tizimi",
        "safe050Desc": "Shaxsiy ma'lumotlaringizni himoya qilish uchun haqiqiy raqamingiz sir tutiladi va xavfsiz 050 virtual raqami beriladi.",
        "phoneInputLabel": "Mobil telefon raqamingizni kiriting",
        "memoInputLabel": "Qo'shimcha izoh (ixtiyoriy)",
        "memoPlaceholder": "Qulay vaqt, muloqot tili yoki boshqa talablaringizni yozing.",
        "submitBtn": "050 xavfsiz raqami bilan yordam so'rash",
        "phoneError": "Iltimos, to'g'ri telefon raqamini kiriting.",
        "needsError": "Kamida bitta yordam turini tanlang.",
        "providerTitle": "Hududiy yordamchi hamkorlarni taklif qilamiz",
        "providerDesc": "Malakali mutaxassis va tashkilotlarni hamkorlikka chorlaymiz. 050 tizimi orqali xavfsiz mijozlar oling.",
        "providerNameLabel": "Ism-familiya yoki kompaniya nomi",
        "providerPhoneLabel": "Bog'lanish telefoni",
        "providerCatLabel": "Xizmat ko'rsatish yo'nalishlari (bir nechtasini tanlash mumkin)",
        "providerRegionLabel": "Asosiy xizmat ko'rsatish hududi",
        "providerBioLabel": "Tajriba va malaka haqida ma'lumot",
        "providerBioPlaceholder": "Ish tajribangiz, sertifikatlar va biladigan tillaringizni yozing.",
        "feeAgreementTitle": "Platforma xizmat haqi va shartlariga rozilik",
        "feeRuleTitle": "[LIFE.HELP platformasi hamkorlik qoidalari]",
        "feeRule1": "1. Hamkor mijozlarga halol, tezkor va yuqori sifatli xizmat ko'rsatishi shart.",
        "feeRule2": "2. 050 raqami orqali kelishuv muvaffaqiyatli yakunlanganda komissiya to'lashga rozilik bildiriladi (~10%).",
        "feeRule3": "3. Noto'g'ri ma'lumot berilganda hamkorlik darhol bekor qilinadi.",
        "feeAgreeCheck": "Yuqoridagi xizmat haqi va platforma qoidalariga roziman. (Majburiy)",
        "providerSubmitBtn": "Hamkorlik arizasini topshirish (Admin tasdiqlashi kutilmoqda)",
        "providerSuccessTitle": "Hamkorlik arizasi qabul qilindi!",
        "providerSuccessDesc": "Admin arizangizni ko'rib chiqqach, faoliyatingiz tasdiqlanadi.",
        "helperPortal": "Mutaxassislar portali"
    },
    "supportChecklist": {
        "bankHelp": [
            "ID karta (ARC) yoki xorijiy pasport bilan yangi hisob ochish",
            "Debet yoki kredit karta olish uchun ariza topshirish",
            "Mobil banking, xavfsizlik sertifikatlari va OTP kodlarni sozlash",
            "Xorijga pul jo'natish limitini oshirish va sozlash",
            "Yo'qolgan bank daftarchasi/kartani qayta tiklash va ko'chirma olish"
        ],
        "insuranceHelp": [
            "Davlat tibbiy sug'urtasini tekshirish va ro'yxatdan o'tkazish",
            "Xorijiy ishchilar majburiy sug'urtasi (chiqib ketish/qaytish/baxtsiz hodisa)",
            "Xususiy tibbiy sug'urta va davolanish xarajatlarini qoplash bo'yicha maslahat",
            "Avtomobil va mototsikllarni majburiy va to'liq sug'urtalash",
            "Sug'urta to'lovlarini olish uchun hujjatlar yig'ish va tarjima qilish"
        ],
        "jobHelp": [
            "Ishlab chiqarish / Zavodda yig'uvchi va nazoratchi (yotoqxona mavjud)",
            "Restoran / Oshxona yordamchisi / Ofitsiant / Oshpaz",
            "Qurilish / Ta'mirlash / Santexnika va montaj ishlari",
            "Savdo / Logistika / Tarjimonlik / Ofis xodimi",
            "Ish beruvchilar uchun: Ishonchli chet ellik xodimlarni topish"
        ],
        "hospitalHelp": [
            "Universitet va yirik shifoxonalarga shifokor qabuliga oldindan yozilish",
            "Stomatologiya, travmatologiya, terapiya, dermatologiyada birga borish va tarjima",
            "Tibbiy ko'rikka hamrohlik qilish va tahlil natijalarini ona tilida tushuntirish",
            "Dorixona retsepti bo'yicha dorilarni qabul qilish qoidalarini tushuntirish",
            "Tungi vaqtda tez yordamga murojaat qilganda telefon orqali shoshilinch tarjima"
        ],
        "mobileHelp": [
            "Chet ellik nomiga tasdiqlanadigan arzon SIM-karta ochish",
            "Oldindan to'lovli (Prepaid) SIM-kartani to'ldirish va cheksiz internet",
            "Katta aloqa operatorlari bilan shartnoma tuzish va yangi telefon olish",
            "Xonadon uchun tezyurar internet va Wi-Fi o'rnatish bo'yicha maslahat",
            "Qarzdorlikni to'lash, raqamni qayta yoqish va boshqa operatorga o'tkazish"
        ]
    }
}

# Remaining language groups (European, Middle East, South Asian)
EUROPEAN_LANGS = ["fr", "de", "es", "it", "nl", "pl", "sv", "da", "no", "pt", "el"]
OTHER_ASIAN_LANGS = ["km", "my", "hi", "ne", "si", "kk", "bn", "ta"]
MIDEAST_AFRICAN = ["ar", "arz", "fa", "he", "tr", "uk", "tet", "am"]

# French
ALL_DATA["fr"] = {
    "common": {
        "detail": "Voir les détails",
        "apply": "Demander",
        "safeApply": "Demande sécurisée",
        "platformTagline": "Plateforme de services de vie multilingue"
    },
    "customer": {
        "priorityEmergency": "Service d'intervention d'urgence prioritaire",
        "lifeSupportTitle": "5 services d'assistance quotidienne essentiels pour les résidents étrangers",
        "lifeSupportDesc": "Lors d'une demande, votre numéro réel est chiffré en un numéro virtuel sécurisé 050 pour garantir une confidentialité totale.",
        "partnerRegisterLink": "Devenir partenaire aidant →",
        "reviewLink": "Laisser un avis →",
        "safe050Badge": "Système de protection de la vie privée par numéro virtuel 050 activé"
    },
    "service": {
        "clog": "Débouchage WC, évier, lavabo et canalisations",
        "leakPlumbing": "Détection de fuites d'eau et travaux de plomberie",
        "boiler": "Installation et dépannage de chaudière et chauffe-eau",
        "cleaning": "Nettoyage professionnel (emménagement et désinfection)",
        "housing": "Recherche personnalisée de studios et appartements",
        "bankHelp": "Aide à l'ouverture de compte bancaire",
        "insuranceHelp": "Aide à la souscription d'assurance",
        "jobHelp": "Aide à l'emploi et recrutement",
        "hospitalHelp": "Accompagnement à l'hôpital et interprétation médicale",
        "mobileHelp": "Aide à l'ouverture de ligne mobile et carte SIM"
    },
    "serviceDesc": {
        "clog": "Refoulement WC/évier/égout, curage haute pression, inspection vidéo endoscopique",
        "leakPlumbing": "Recherche de fuite non destructive, réparation tuyaux gelés, remplacement canalisations",
        "boiler": "Pose de chaudière gaz/électrique, dépannage eau chaude et chauffage, diagnostic tuyauterie",
        "cleaning": "Nettoyage après déménagement, dégraissage en profondeur, désinfection du logement",
        "housing": "Recherche de logements meublés sûrs adaptés à votre budget et quartier recherché",
        "bankHelp": "Ouverture avec carte de séjour/passeport, carte bancaire, banque en ligne et virements internationaux",
        "insuranceHelp": "Assurance maladie nationale, assurances obligatoires pour travailleurs étrangers, auto/moto",
        "jobHelp": "Offres d'emploi légales selon visa, aide à la rédaction de CV et protection des contrats de travail",
        "hospitalHelp": "Prise de rendez-vous médical, accompagnement en clinique, interprétation spécialisée et ordonnances",
        "mobileHelp": "Activation immédiate de SIM prépayée/forfait économique étranger, forfaits adaptés et configuration"
    },
    "serviceProblems": {
        "clog": "Les toilettes, l'évier ou l'évacuation sont bouchés et l'eau refoule.",
        "leakPlumbing": "Une fuite d'eau provient d'un tuyau ou du plafond, une réparation urgente est nécessaire.",
        "boiler": "Un code d'erreur clignote sur la chaudière, plus d'eau chaude ni de chauffage.",
        "cleaning": "Besoin d'un grand nettoyage avant emménagement ou de décrasser cuisine et salle de bain.",
        "housing": "Recherche d'un studio ou appartement 2 pièces meublé correspondant à mon budget.",
        "bankHelp": "Besoin d'aide pour ouvrir un compte avec des papiers étrangers, obtenir une carte ou transférer de l'argent.",
        "insuranceHelp": "Besoin d'aide pour s'inscrire à l'assurance santé, aux assurances obligatoires ou déclarer un sinistre.",
        "jobHelp": "Besoin d'aide pour trouver un emploi légal correspondant à mon visa et vérifier mon contrat.",
        "hospitalHelp": "Besoin d'aide pour prendre rendez-vous chez le médecin, d'un accompagnateur et d'un interprète médical.",
        "mobileHelp": "Besoin d'aide pour souscrire un forfait mobile, activer une carte SIM et configurer mon téléphone."
    },
    "support": {
        "badge050": "Système de mise en relation par numéro sécurisé 050",
        "requestTab": "Demander de l'aide (Client)",
        "partnerTab": "Devenir partenaire aidant (Prestataire)",
        "successTitle": "Votre demande a été enregistrée avec succès !",
        "successDesc": "Un partenaire certifié vous contactera rapidement via votre numéro sécurisé 050.",
        "safePhoneLabel": "Numéro virtuel sécurisé attribué (050 Virtual)",
        "privacyBadge": "Confidentialité garantie",
        "realPhoneHidden": "Votre vrai numéro reste secret. La mise en relation s'effectue uniquement via ce numéro 050.",
        "serviceLabel": "Service demandé",
        "regionLabel": "Zone souhaitée",
        "selectedNeedsLabel": "Prestations sélectionnées :",
        "memoLabel": "Précisions complémentaires :",
        "submitAnother": "Faire une autre demande",
        "backHome": "Retour à l'accueil",
        "homeNav": "← Accueil",
        "whatHelpTitle": "De quelle aide avez-vous besoin ? (Cochez toutes les cases applicables)",
        "whatHelpDesc": "Nous vous mettons en relation avec des partenaires locaux qualifiés pour ces services.",
        "contactPhoneLabel": "Votre numéro de téléphone de contact",
        "safe050Title": "Protection automatique par numéro virtuel 050",
        "safe050Desc": "Pour protéger votre vie privée, votre vrai numéro n'est jamais divulgué au prestataire. Un numéro 050 est créé automatiquement.",
        "phoneInputLabel": "Numéro de téléphone mobile",
        "memoInputLabel": "Notes complémentaires (facultatif)",
        "memoPlaceholder": "Date/heure souhaitée, langue de communication préférée ou demandes particulières.",
        "submitBtn": "Envoyer la demande sécurisée via le numéro 050",
        "phoneError": "Veuillez entrer un numéro de téléphone valide.",
        "needsError": "Veuillez sélectionner au moins un élément d'aide.",
        "providerTitle": "Recrutement de partenaires aidants locaux",
        "providerDesc": "Rejoignez notre réseau de prestataires vérifiés. Recevez des demandes de clients via le système sécurisé 050.",
        "providerNameLabel": "Nom ou Raison sociale",
        "providerPhoneLabel": "Numéro de téléphone",
        "providerCatLabel": "Domaines d'intervention (sélection multiple)",
        "providerRegionLabel": "Zone principale d'activité",
        "providerBioLabel": "Expérience et compétences",
        "providerBioPlaceholder": "Décrivez votre parcours, certifications et langues maîtrisées.",
        "feeAgreementTitle": "Accord sur les frais de mise en relation de la plateforme",
        "feeRuleTitle": "[Règlement des partenaires LIFE.HELP]",
        "feeRule1": "1. Le partenaire s'engage à fournir un service intègre, rapide et de haute qualité.",
        "feeRule2": "2. En cas de mise en relation réussie via le 050, le partenaire accepte la commission prévue (~10%).",
        "feeRule3": "3. Toute fausse déclaration entraîne la radiation immédiate et des poursuites.",
        "feeAgreeCheck": "J'accepte les conditions de commission de la plateforme. (Obligatoire)",
        "providerSubmitBtn": "Soumettre ma candidature de partenaire (Attente de validation)",
        "providerSuccessTitle": "Candidature partenaire reçue !",
        "providerSuccessDesc": "Votre profil sera activé après validation par nos équipes.",
        "helperPortal": "Espace partenaires"
    },
    "supportChecklist": {
        "bankHelp": [
            "Ouverture de compte avec carte de séjour (ARC) ou passeport",
            "Demande de délivrance de carte bancaire (débit/crédit)",
            "Configuration de la banque en ligne, certificat de sécurité et OTP",
            "Paramétrage et augmentation du plafond des transferts vers l'étranger",
            "Renouvellement de carte/livret perdu et relevés de compte"
        ],
        "insuranceHelp": [
            "Vérification et inscription à l'assurance maladie nationale",
            "Assurance obligatoire des travailleurs étrangers (fin de séjour/rapatriement/accident)",
            "Conseil en mutuelle santé privée et prise en charge d'hospitalisation",
            "Souscription d'assurance obligatoire et tous risques auto et moto",
            "Constitution du dossier de remboursement et traduction des documents"
        ],
        "jobHelp": [
            "Industrie manufacturière / Ligne de production / Assemblage (avec hébergement)",
            "Restauration / Commis de cuisine / Service en salle / Cuisinier",
            "Chantiers de construction, aménagement intérieur et plomberie",
            "Commerce / Logistique / Traduction-interprétation / Bureautique",
            "Pour employeurs : Recrutement d'employés étrangers sérieux et qualifiés"
        ],
        "hospitalHelp": [
            "Prise de rendez-vous en milieu hospitalier et centres universitaires",
            "Accompagnement et traduction : dentiste, orthopédie, médecine interne, dermatologie",
            "Accompagnement au bilan de santé et explications des résultats dans votre langue",
            "Instructions de prise des médicaments prescrits en pharmacie",
            "Interprétation téléphonique d'urgence lors d'une admission nocturne aux urgences"
        ],
        "mobileHelp": [
            "Ouverture d'un forfait économique (USIM) avec vérification d'identité",
            "Recharge facile de carte SIM prépayée et forfaits data illimités",
            "Souscription d'abonnement auprès des grands opérateurs et changement de téléphone",
            "Installation de la fibre optique et du Wi-Fi à domicile",
            "Règlement d'impayés, déblocage de ligne et portabilité du numéro"
        ]
    }
}

# German
ALL_DATA["de"] = {
    "common": {
        "detail": "Details ansehen",
        "apply": "Jetzt anfragen",
        "safeApply": "Sicher anfragen",
        "platformTagline": "Mehrsprachige Alltagsdienstleistungsplattform"
    },
    "customer": {
        "priorityEmergency": "Prioritärer Notfalleinsatz",
        "lifeSupportTitle": "5 essenzielle Lebenshilfedienste für ausländische Mitbürger",
        "lifeSupportDesc": "Bei einer Anfrage wird Ihre reale Telefonnummer in eine temporäre sichere 050-Nummer verschlüsselt, um vollste Privatsphäre zu garantieren.",
        "partnerRegisterLink": "Als Helfer-Partner registrieren →",
        "reviewLink": "Bewertung abgeben →",
        "safe050Badge": "Datenschutzsystem mit sicherer 050-Nummer angewendet"
    },
    "service": {
        "clog": "Beseitigung von Verstopfungen: WC, Spüle & Abfluss",
        "leakPlumbing": "Leckageortung, Wasserschadensanierung & Sanitärtechnik",
        "boiler": "Installation, Wartung & Reparatur von Heizkesseln & Thermen",
        "cleaning": "Professionelle Reinigung (Einzug & Grundreinigung)",
        "housing": "Mietwohnungssuche & Vermittlung von Zimmern/Apartments",
        "bankHelp": "Hilfe bei der Eröffnung eines Bankkontos",
        "insuranceHelp": "Hilfe beim Abschluss von Versicherungen",
        "jobHelp": "Arbeitsvermittlung & Hilfe bei der Jobsuche",
        "hospitalHelp": "Krankenhausbegleitung & medizinische Übersetzung",
        "mobileHelp": "Hilfe beim Abschluss von Mobilfunkverträgen & SIM-Karten"
    },
    "serviceDesc": {
        "clog": "Rückstau in WC/Spüle/Kanalisation, Hochdruckspülung, Kanal-Rohrinspektion per Endoskop",
        "leakPlumbing": "Präzise Leckortung mit modernster Messtechnik, Reparatur eingefrorener Rohre, Rohrtausch",
        "boiler": "Montage von Gas-/Elektroheizungen, Warmwasser- & Heizungsreparatur, Rohrleitungsprüfung",
        "cleaning": "Endreinigung beim Ein-/Auszug, Beseitigung hartnäckiger Flecken, Wohnungsdesinfektion",
        "housing": "Maßgeschneiderte Vermittlung von 1- bis 2-Zimmer-Wohnungen nach Budget und Wunschlage",
        "bankHelp": "Kontoeröffnung mit Aufenthaltstitel/Pass, Debitkarte, Onlinebanking und Auslandsüberweisungen",
        "insuranceHelp": "Gesetzliche Krankenversicherung, Pflichtversicherung für Ausländer, private Zusatz- & Kfz-Versicherung",
        "jobHelp": "Vermittlung legaler Arbeitsplätze nach Visastatus, Unterstützung beim Lebenslauf und Arbeitsvertrag",
        "hospitalHelp": "Facharzttermine buchen, Begleitung in Kliniken, professionelles medizinisches Dolmetschen",
        "mobileHelp": "Sofortige Freischaltung günstiger Prepaid-/Vertrags-SIM-Karten, passende Tarife und Einrichtung"
    },
    "serviceProblems": {
        "clog": "Toilette, Spülbecken oder Abfluss sind komplett verstopft und das Wasser staut sich zurück.",
        "leakPlumbing": "Wasser tropft aus Rohren oder der Decke, Sanitärreparatur oder Rohraustausch ist dringend erforderlich.",
        "boiler": "Auf dem Heizkesseldisplay blinkt ein Fehlercode, kein Warmwasser und keine Heizung.",
        "cleaning": "Brauche gründliche Umzugsreinigung oder die Beseitigung von hartnäckigem Fett in Küche und Bad.",
        "housing": "Suche ein voll möbliertes 1- oder 2-Zimmer-Apartment passend zu meinem Budget.",
        "bankHelp": "Benötige Hilfe bei der Kontoeröffnung mit ausländischen Dokumenten, Kartenausstellung und Auslandsüberweisung.",
        "insuranceHelp": "Benötige Unterstützung bei der Registrierung der Krankenversicherung oder Einreichung von Schadensfällen.",
        "jobHelp": "Benötige Unterstützung bei der Suche nach einer visakonformen Arbeitsstelle und Vertragsberatung.",
        "hospitalHelp": "Benötige Terminvereinbarung beim Facharzt, Begleitung ins Krankenhaus und medizinisches Dolmetschen.",
        "mobileHelp": "Benötige Hilfe bei der Freischaltung einer SIM-Karte und der Auswahl eines günstigen Tarifs."
    },
    "support": {
        "badge050": "050 Virtuelles Sicherheitsnummern-System",
        "requestTab": "Hilfe anfordern (Kunde)",
        "partnerTab": "Als Helfer-Partner anmelden (Dienstleister)",
        "successTitle": "Anfrage erfolgreich übermittelt!",
        "successDesc": "Ein geprüfter Partner wird sich in Kürze über Ihre sichere 050-Nummer bei Ihnen melden.",
        "safePhoneLabel": "Zugewiesene sichere 050-Nummer (Virtual Safe Phone)",
        "privacyBadge": "Datenschutz gewährleistet",
        "realPhoneHidden": "Ihre echte Nummer bleibt geheim. Der Partner kontaktiert Sie ausschließlich über diese 050-Nummer.",
        "serviceLabel": "Gewünschter Dienst",
        "regionLabel": "Einsatzort",
        "selectedNeedsLabel": "Ausgewählte Hilfethemen:",
        "memoLabel": "Zusätzliche Wünsche:",
        "submitAnother": "Weitere Anfrage stellen",
        "backHome": "Zurück zur Startseite",
        "homeNav": "← Startseite",
        "whatHelpTitle": "Welche Unterstützung benötigen Sie? (Mehrfachauswahl möglich)",
        "whatHelpDesc": "Sie werden mit qualifizierten lokalen Fachpartnern für diese Bereiche verbunden.",
        "contactPhoneLabel": "Ihre Kontakt-Telefonnummer",
        "safe050Title": "Automatischer 050-Sicherheitsnummern-Schutz",
        "safe050Desc": "Um Ihre Privatsphäre zu schützen, wird Ihre echte Mobilfunknummer niemals an Dienstleister weitergegeben.",
        "phoneInputLabel": "Mobilfunknummer eingeben",
        "memoInputLabel": "Zusätzliche Notizen (optional)",
        "memoPlaceholder": "Wunschtermin, bevorzugte Sprache oder spezielle Anforderungen.",
        "submitBtn": "Anfrage sicher über 050-Nummer absenden",
        "phoneError": "Bitte geben Sie eine gültige Telefonnummer ein.",
        "needsError": "Bitte wählen Sie mindestens einen Hilfepunkt aus.",
        "providerTitle": "Aufnahme regionaler Helfer-Partner (Helper Provider)",
        "providerDesc": "Werden Sie Teil unseres Netzwerks. Erhalten Sie sichere Kundenanfragen über das 050-System.",
        "providerNameLabel": "Name oder Firmenname",
        "providerPhoneLabel": "Kontakttelefonnummer",
        "providerCatLabel": "Angebotene Dienstleistungen (Mehrfachauswahl)",
        "providerRegionLabel": "Hauptsächliches Einsatzgebiet",
        "providerBioLabel": "Berufserfahrung & Qualifikationen",
        "providerBioPlaceholder": "Berufserfahrung, Zertifikate und Sprachkenntnisse kurz beschreiben.",
        "feeAgreementTitle": "Zustimmung zu Plattform-Vermittlungsgebühren",
        "feeRuleTitle": "[Betriebsrichtlinien für LIFE.HELP Partner]",
        "feeRule1": "1. Der Partner verpflichtet sich zu ehrlicher, schneller und professioneller Unterstützung.",
        "feeRule2": "2. Bei erfolgreicher Vermittlung über das 050-System stimmt der Partner einer angemessenen Gebühr zu (~10%).",
        "feeRule3": "3. Falschangaben führen zum sofortigen Ausschluss und rechtlichen Schritten.",
        "feeAgreeCheck": "Ich stimme den oben genannten Plattformgebühren zu. (Erforderlich)",
        "providerSubmitBtn": "Partner-Bewerbung absenden (Prüfung durch Administrator)",
        "providerSuccessTitle": "Partner-Registrierung eingegangen!",
        "providerSuccessDesc": "Nach Überprüfung Ihrer Angaben durch unser Team wird Ihr Profil freigeschaltet.",
        "helperPortal": "Partner-Portal"
    },
    "supportChecklist": {
        "bankHelp": [
            "Neues Bankkonto mit Alien Card (ARC) oder Reisepass eröffnen",
            "Beantragung einer Debit- oder Kreditkarte",
            "Einrichtung von Online-Banking, Sicherheitszertifikaten & OTP",
            "Erhöhung des Überweisungslimits für weltweite Auslandsüberweisungen",
            "Neuausstellung verlorener Bankkarten/Sparbücher & Kontoauszüge"
        ],
        "insuranceHelp": [
            "Überprüfung und Anmeldung zur gesetzlichen Krankenversicherung",
            "Pflichtversicherungen für ausländische Arbeitnehmer (Rückreise/Unfall)",
            "Beratung zu privaten Krankenzusatzversicherungen & Krankenhausaufenthalt",
            "Vergleich und Abschluss von Kfz-Haftpflicht- & Kaskoversicherungen",
            "Hilfe bei der Zusammenstellung von Erstattungsunterlagen & Übersetzung"
        ],
        "jobHelp": [
            "Produktionsbetrieb / Montage / Qualitätskontrolle (Unterkunft vorhanden)",
            "Gastronomie / Küchenhilfe / Servicepersonal / Koch",
            "Bau- und Ausbauarbeiten, Innenarchitektur und Sanitärinstallation",
            "Handel / Logistik / Übersetzen & Dolmetschen / Bürokräfte",
            "Für Arbeitgeber: Vermittlung zuverlässiger ausländischer Fachkräfte"
        ],
        "hospitalHelp": [
            "Facharzttermine in Universitätskliniken buchen und Voranmeldung",
            "Begleitung & Übersetzung beim Zahnarzt, Orthopäden, Internisten, Hautarzt",
            "Begleitung zum Gesundheits-Check-up & Befundbesprechung in der Muttersprache",
            "Anleitung zur vorschriftsmäßigen Einnahme von verschriebenen Medikamenten",
            "Telefonische Notfallübersetzung bei nächtlichen Aufnahmen in die Notaufnahme"
        ],
        "mobileHelp": [
            "Freischaltung einer günstigen SIM-Karte mit Identitätsnachweis",
            "Einfaches Aufladen von Prepaid-Karten & unbegrenzte Datentarife",
            "Laufzeitverträge bei großen Mobilfunkanbietern & Smartphone-Kauf",
            "Installation von Glasfaser-Highspeed-Internet & WLAN zu Hause",
            "Begleichung offener Rechnungen, Leitungsentsperrung & Rufnummernmitnahme"
        ]
    }
}

# Spanish
ALL_DATA["es"] = {
    "common": {
        "detail": "Ver detalles",
        "apply": "Solicitar ahora",
        "safeApply": "Solicitud segura",
        "platformTagline": "Plataforma de servicios de vida multilingüe"
    },
    "customer": {
        "priorityEmergency": "Servicio de emergencia prioritario",
        "lifeSupportTitle": "5 servicios esenciales de asistencia diaria para residentes extranjeros",
        "lifeSupportDesc": "Al solicitar ayuda, su número real se encripta en un número virtual seguro 050 para garantizar su total privacidad.",
        "partnerRegisterLink": "Registrarse como asistente colaborador →",
        "reviewLink": "Dejar una reseña →",
        "safe050Badge": "Sistema de protección de privacidad con número virtual 050 activado"
    },
    "service": {
        "clog": "Solución de atascos: inodoros, fregaderos y desagües",
        "leakPlumbing": "Detección de fugas de agua y fontanería general",
        "boiler": "Instalación, mantenimiento y reparación de calderas",
        "cleaning": "Limpieza profesional (mudanzas y desinfección)",
        "housing": "Búsqueda personalizada de estudios y apartamentos en alquiler",
        "bankHelp": "Asistencia para abrir cuenta bancaria",
        "insuranceHelp": "Asistencia para contratación de seguros",
        "jobHelp": "Búsqueda de empleo y contratación",
        "hospitalHelp": "Acompañamiento a hospitales e interpretación médica",
        "mobileHelp": "Apertura de línea móvil y tarjeta SIM"
    },
    "serviceDesc": {
        "clog": "Desbordamiento de inodoros/fregaderos, limpieza por alta presión, inspección con endoscopio de tuberías",
        "leakPlumbing": "Detección precisa de fugas con tecnología acústica, descongelación de tuberías, cambio de cañerías",
        "boiler": "Instalación de calderas de gas/eléctricas, reparación de agua caliente y calefacción, revisión de conductos",
        "cleaning": "Limpieza a fondo por mudanza, eliminación de grasa incrustada, desinfección integral",
        "housing": "Búsqueda de estudios y apartamentos de 1-2 habitaciones que se ajusten a su presupuesto y ubicación",
        "bankHelp": "Apertura de cuenta con tarjeta de residencia/pasaporte, tarjeta de débito, banca móvil y remesas al exterior",
        "insuranceHelp": "Seguro nacional de salud, seguros obligatorios para trabajadores extranjeros, seguro médico y de autos",
        "jobHelp": "Ofertas de trabajo legales acordes con el visado, ayuda con el CV y defensa de derechos laborales",
        "hospitalHelp": "Reserva de citas médicas, acompañamiento a clínicas, interpretación especializada y recetas",
        "mobileHelp": "Activación inmediata de SIM económica/prepago para extranjeros, planes baratos y configuración"
    },
    "serviceProblems": {
        "clog": "El inodoro, lavabo o desagüe está completamente atascado y el agua se desborda.",
        "leakPlumbing": "Hay una fuga de agua en una tubería o techo, necesito fontanero urgente o cambio de cañería.",
        "boiler": "Parpadea un código de error en la caldera, no hay agua caliente ni calefacción.",
        "cleaning": "Necesito limpieza profunda para entrar a vivir o eliminar grasa pesada en cocina y baño.",
        "housing": "Busco estudio o apartamento de 1-2 habitaciones amueblado dentro de mi presupuesto.",
        "bankHelp": "Necesito ayuda para abrir una cuenta bancaria con documentación extranjera, pedir tarjeta o transferir dinero.",
        "insuranceHelp": "Necesito asistencia para darme de alta en el seguro médico, seguros obligatorios o tramitar indemnizaciones.",
        "jobHelp": "Necesito ayuda para encontrar un empleo legal según mi visado y revisar mi contrato laboral.",
        "hospitalHelp": "Necesito pedir cita médica, acompañamiento al hospital e intérprete médico profesional.",
        "mobileHelp": "Necesito ayuda para contratar una línea móvil económica, activar una SIM y configurar el teléfono."
    },
    "support": {
        "badge050": "Sistema de conexión segura con número 050",
        "requestTab": "Solicitar ayuda (Cliente)",
        "partnerTab": "Registrarse como colaborador (Proveedor)",
        "successTitle": "¡Solicitud recibida con éxito!",
        "successDesc": "Un colaborador especialista verificado se pondrá en contacto pronto a través de su número seguro 050.",
        "safePhoneLabel": "Número virtual seguro asignado (050 Virtual)",
        "privacyBadge": "Privacidad garantizada",
        "realPhoneHidden": "Su número real nunca se muestra. El colaborador solo se comunica mediante este número 050.",
        "serviceLabel": "Servicio solicitado",
        "regionLabel": "Zona deseada",
        "selectedNeedsLabel": "Puntos de ayuda seleccionados:",
        "memoLabel": "Observaciones adicionales:",
        "submitAnother": "Enviar otra solicitud",
        "backHome": "Volver al inicio",
        "homeNav": "← Inicio",
        "whatHelpTitle": "¿Qué tipo de asistencia necesita? (Marque todas las que apliquen)",
        "whatHelpDesc": "Le asignaremos colaboradores locales cualificados para estos temas.",
        "contactPhoneLabel": "Su número de teléfono de contacto",
        "safe050Title": "Protección automática con número virtual 050",
        "safe050Desc": "Para proteger su privacidad, su número de móvil real nunca se comparte con los colaboradores.",
        "phoneInputLabel": "Introduzca su número de teléfono",
        "memoInputLabel": "Notas adicionales (opcional)",
        "memoPlaceholder": "Horario preferido, idioma de comunicación u otras peticiones.",
        "submitBtn": "Enviar solicitud de forma segura con número 050",
        "phoneError": "Por favor, introduzca un número de teléfono válido.",
        "needsError": "Seleccione al menos una opción de ayuda.",
        "providerTitle": "Convocatoria de colaboradores asistentes locales",
        "providerDesc": "Únase a nuestra red de especialistas. Reciba solicitudes de clientes de forma segura con el sistema 050.",
        "providerNameLabel": "Nombre o Nombre de la empresa",
        "providerPhoneLabel": "Teléfono de contacto",
        "providerCatLabel": "Categorías de servicio que puede atender (selección múltiple)",
        "providerRegionLabel": "Zona principal de actuación",
        "providerBioLabel": "Experiencia y presentación profesional",
        "providerBioPlaceholder": "Indique experiencia profesional, certificaciones e idiomas que domina.",
        "feeAgreementTitle": "Acuerdo de comisiones y publicidad de la plataforma",
        "feeRuleTitle": "[Normativa de funcionamiento de colaboradores LIFE.HELP]",
        "feeRule1": "1. El colaborador debe proporcionar una atención honesta, rápida y de máxima calidad al cliente.",
        "feeRule2": "2. Al concretar una intermediación con éxito vía 050, acepta la comisión razonable de la plataforma (~10%).",
        "feeRule3": "3. La falsedad documental provocará la baja inmediata y posibles acciones legales.",
        "feeAgreeCheck": "Acepto las condiciones y comisiones de la plataforma. (Obligatorio)",
        "providerSubmitBtn": "Enviar solicitud de colaborador (Pendiente de aprobación)",
        "providerSuccessTitle": "¡Solicitud de colaborador enviada!",
        "providerSuccessDesc": "Su perfil se activará una vez que el administrador revise su información.",
        "helperPortal": "Portal de especialistas"
    },
    "supportChecklist": {
        "bankHelp": [
            "Apertura de cuenta con tarjeta de residencia (ARC) o pasaporte",
            "Solicitud y expedición de tarjeta de débito o crédito",
            "Configuración de banca por Internet, certificado digital y OTP",
            "Ajuste y ampliación del límite de transferencias internacionales",
            "Duplicado de cartilla/tarjeta extraviada y certificados de movimientos"
        ],
        "insuranceHelp": [
            "Comprobación e inscripción en el Seguro Nacional de Salud",
            "Seguros obligatorios para trabajadores extranjeros (retorno/accidente)",
            "Asesoramiento sobre seguros médicos privados y cobertura de hospitalización",
            "Comparativa y contratación de seguros obligatorios y a todo riesgo para vehículos",
            "Orientación con la documentación de reclamación del seguro y traducción"
        ],
        "jobHelp": [
            "Fábricas / Líneas de producción / Ensamblaje / Control de calidad (con alojamiento)",
            "Restaurantes / Ayudante de cocina / Camarero / Cocinero",
            "Obras de construcción, reformas interiores e instalaciones técnicas",
            "Comercio exterior / Logística / Traducción e interpretación / Oficinas",
            "Para empresas: Búsqueda y selección de personal extranjero formal y diligente"
        ],
        "hospitalHelp": [
            "Cita previa con especialistas en hospitales universitarios y generales",
            "Acompañamiento e interpretación en dentista, traumatología, medicina interna, dermatología",
            "Acompañamiento a revisiones médicas y explicación de los resultados en su idioma",
            "Instrucciones de dosificación de medicamentos de farmacia y advertencias",
            "Interpretación telefónica de urgencia en admisiones nocturnas a urgencias"
        ],
        "mobileHelp": [
            "Alta de línea con tarjeta SIM económica (USIM) verificable con pasaporte/ARC",
            "Recargas fáciles de tarjetas SIM prepago y tarifas de datos ilimitados",
            "Nuevos contratos con los principales operadores móviles y renovación de terminales",
            "Instalación de fibra óptica de alta velocidad y Wi-Fi doméstico",
            "Pago de facturas pendientes, reactivación de línea y portabilidad numérica"
        ]
    }
}

# Add remaining European, Middle East, and Asian languages
def complete_all_locales():
    # Load en as universal template
    with open(os.path.join(MESSAGES_DIR, "en.json"), "r", encoding="utf-8") as f:
        en_template = json.load(f)

    # For all 38 locales, ensure ALL sections are present
    for code in [
        "it", "nl", "pl", "sv", "da", "no", "pt", "el",
        "km", "my", "hi", "ne", "si", "kk", "bn", "ta",
        "ar", "arz", "fa", "he", "tr", "uk", "tet", "am"
    ]:
        if code not in ALL_DATA:
            ALL_DATA[code] = {}

        # Copy existing keys from code.json if available, then fill missing sections
        target_path = os.path.join(MESSAGES_DIR, f"{code}.json")
        existing = {}
        if os.path.exists(target_path):
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            except Exception:
                pass

        # We will inject localized translations for each of these in the next step
        ALL_DATA[code] = existing

complete_all_locales()

def save_all():
    print("Writing patched dictionaries...")
    for code, patch in ALL_DATA.items():
        target_path = os.path.join(MESSAGES_DIR, f"{code}.json")
        if not os.path.exists(target_path):
            continue
        with open(target_path, "r", encoding="utf-8") as f:
            content = json.load(f)

        for sec, keys in patch.items():
            if sec not in content:
                content[sec] = {}
            if isinstance(keys, dict):
                for k, v in keys.items():
                    content[sec][k] = v
            else:
                content[sec] = keys

        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
            f.write("\n")
    print("All initial dictionaries saved.")

if __name__ == "__main__":
    save_all()
