import fs from 'node:fs';
import path from 'node:path';

const inventoryPath = 'D:/Antigravity Project/Web Portofolio PPG/content-src/inventory.json';
const coursesPath = 'D:/Antigravity Project/Web Portofolio PPG/src/data/courses.json';
const outPath = 'D:/Antigravity Project/Web Portofolio PPG/src/data/course-details.json';

const inv = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

// Curated 4F reflections map
const reflectionsMap = {
  'matrikulasi': {
    facts: 'Mengikuti 9 hari perkuliahan matrikulasi intensif meliputi hakikat kurikulum, sejarah kurikulum Indonesia (1984, 1994, KBK, K13, Kurikulum Merdeka), dan telaah The Art of Teaching.',
    feelings: 'Awalnya merasa overwhelmed dengan padatnya materi teori kurikulum, namun termotivasi saat melihat kesinambungan evolusi pendidikan di Indonesia.',
    findings: 'Kurikulum bukanlah dokumen statis, melainkan instrumen dinamis yang wajib beradaptasi dengan perubahan zaman dan kebutuhan peserta didik.',
    future: 'Mengimplementasikan Kurikulum Merdeka secara fleksibel dan berpusat pada murid di kelas informatika dengan rancangan asesmen autentik.'
  },
  'p2m': {
    facts: 'Melaksanakan program Pengabdian kepada Masyarakat (P2M) di sekolah mitra, berkolaborasi dengan rekan sejawat mahasiswa PPG dan tenaga pendidik setempat.',
    feelings: 'Tumbuh rasa empati dan kepuasan batin yang mendalam ketika dapat memberikan kontribusi nyata di luar ruang kelas formal.',
    findings: 'Kompetensi guru tidak hanya diuji di depan papan tulis, melainkan bagaimana kehadirannya membawa dampak positif bagi ekosistem masyarakat sekitar.',
    future: 'Secara berkesinambungan aktif dalam kegiatan sosial edukatif dan pengabdian berbasis pemanfaatan teknologi tepat guna.'
  },
  'kesehatan-mental': {
    facts: 'Mempelajari manajemen stres pendidik, resiliensi psikologis, serta mengerjakan LK 1.5 mengenai identifikasi faktor burnout dan self-care guru.',
    feelings: 'Menyadari betapa pentingnya kesehatan mental guru yang selama ini sering terabaikan di tengah tuntutan administrasi dan beban mengajar.',
    findings: 'Guru yang sejahtera secara psikologis (well-being tinggi) mampu menghadirkan ruang belajar yang jauh lebih ramah, kreatif, dan inspiratif bagi siswa.',
    future: 'Membiasakan praktik mindfulness harian, menjaga keseimbangan hidup-kerja, dan peka terhadap kondisi emosional murid di kelas.'
  },
  'filosofi-pendidikan': {
    facts: 'Mengkaji pemikiran filosofis Ki Hadjar Dewantara, sistem among, pendidikan humanis, dan menyelesaikan LK 1.4 Mendidik Sesuai Kodrat Alam dan Zaman.',
    feelings: 'Tergugah dan tersadarkan bahwa mendidik informatika bukan sekadar mengajarkan coding atau logika biner, melainkan menuntun budi pekerti luhur.',
    findings: 'Pendidikan harus memerdekakan murid. Guru berperan sebagai petani yang merawat benih; tidak bisa mengubah padi menjadi jagung, melainkan memaksimalkan kualitas padi tersebut.',
    future: 'Menempatkan teknologi sebagai sarana pemanusiaan manusia, mengajarkan etika kecerdasan artifisial, dan menuntun murid dengan penuh kesabaran.'
  },
  'growth-mindset': {
    facts: 'Menganalisis konsep pola pikir bertumbuh (Carol Dweck), merancang afirmasi positif, dan mengerjakan tugas asynchronous strategi penguatan daya tahan belajar di SMAN 15 Bandung.',
    feelings: 'Sangat terinspirasi ketika melihat bagaimana respon guru terhadap kegagalan murid dapat mengubah motivasi belajar mereka secara dramatis.',
    findings: 'Dalam bidang informatika di mana error koding adalah keniscayaan, growth mindset adalah fondasi krusial agar murid tidak mudah putus asa.',
    future: 'Membudayakan istilah "Belum Bisa" bukan "Tidak Bisa", serta merayakan proses pemecahan masalah (debugging) daripada sekadar hasil akhir yang instan.'
  },
  'pemahaman-peserta-didik': {
    facts: 'Melakukan profiling karakteristik peserta didik SMA, observasi tahapan perkembangan kognitif Piaget dan sosioemosional Erikson, serta merancang Klinik Transformasi Pedagogis.',
    feelings: 'Merasa tertantang menghadapi keragaman latar belakang siswa, namun tertolong dengan instrumen profiling yang sistematis.',
    findings: 'Setiap anak memiliki modalitas belajar dan kecepatan pemahaman yang unik; generalisasi kelas tanpa data asesmen awal sering memicu kegagalan belajar.',
    future: 'Rutin mengadakan pemetaan awal (gaya belajar, minat, kesiapan kognitif) sebelum merancang strategi pengajaran bab baru.'
  },
  'pembelajaran-berdiferensiasi': {
    facts: 'Menyusun Modul Ajar PB-4D Informatika SMAN 15 Bandung, merancang diferensiasi konten/proses/produk, asesmen 3 level kesiapan (Basic, Intermediate, Advanced), dan Kartu BANTU scaffolding.',
    feelings: 'Awalnya mengira diferensiasi berarti menyiapkan 3 materi terpisah yang merepotkan. Namun saat dipraktikkan, merasa sangat puas melihat seluruh murid aktif terlibat.',
    findings: 'Sama belum tentu adil. Keadilan pedagogis berarti memberikan dukungan sesuai kapasitas masing-masing murid agar bersama-sama mampu mencapai target kompetensi.',
    future: 'Menerapkan diferensiasi proses melalui Kartu BANTU, pertanyaan penuntun bertingkat, dan opsi produk penugasan (infografis visual, simulasi, atau karya kode).'
  },
  'pma-1': {
    facts: 'Melaksanakan praktik microteaching mandiri dan kelompok, merancang slide interaktif Struktur Data Array, modul algoritma pemrograman, dan tugas kisi-kisi soal HOTS.',
    feelings: 'Sempat gugup saat simulasi microteaching peer-teaching, namun masukan dari dosen pembimbing dan rekan sejawat sangat membangun rasa percaya diri.',
    findings: 'Konsep komputasional yang abstrak wajib dihubungkan dengan analogi kontekstual sehari-hari sebelum diperkenalkan sintaks teknis pemrograman.',
    future: 'Mengembangkan media visual interaktif dan strategi live coding partisipatif di laboratorium komputer.'
  },
  'ppl-1': {
    facts: 'Praktik Pengalaman Lapangan I di SMAN 15 Bandung, mendampingi kelas XI-5 pada materi Videografi dan Informatika, menyusun modul ajar, dan mengelola portofolio siklus 1.',
    feelings: 'Sangat antusias merasakan atmosfer nyata sekolah, berinteraksi dengan siswa generasi Alpha, dan dibimbing langsung oleh Guru Pamong Andre Dewantara, S.T., Gr.',
    findings: 'Penguasaan materi informatika hanya separuh dari keberhasilan mengajar; separuh lainnya adalah seni komunikasi pedagogis dan manajemen kelas yang kondusif.',
    future: 'Menjadikan refleksi harian setelah jam pelajaran sebagai rutinitas untuk terus memperbaiki teknik instruksional.'
  },
  'sosial-emosional': {
    facts: 'Mengintegrasikan 5 Kompetensi Sosial Emosional (KSE: kesadaran diri, manajemen diri, kesadaran sosial, keterampilan relasi, pengambilan keputusan bertanggung jawab) dan teknik STOP mindfulness ke RPP.',
    feelings: 'Merasakan suasana kelas menjadi jauh lebih tenang, kondusif, dan terkoneksi ketika latihan pernapasan mindfulness diterapkan sebelum koding.',
    findings: 'Kecemasan teknologi (computer anxiety) dan frustrasi saat koding dapat diatasi secara signifikan melalui penguatan regulasi emosional.',
    future: 'Menyisipkan refleksi emosi dan ice-breaking mindful di setiap awal dan akhir pembelajaran informatika.'
  },
  'pendidikan-inklusif': {
    facts: 'Mengkaji prinsip Universal Design for Learning (UDL), identifikasi hambatan belajar peserta didik berkebutuhan khusus, dan perancangan aksesibilitas modul komputasional.',
    feelings: 'Membuka mata dan nurani bahwa dunia digital harus dapat diakses secara merata oleh semua orang tanpa terkecuali.',
    findings: 'Aksesibilitas dalam materi informatika (kontras warna modul, pembaca layar, alternatif teks) bukan sekadar fitur tambahan, melainkan hak asasi setiap murid.',
    future: 'Memastikan seluruh bahan ajar digital, presentasi, dan aplikasi yang digunakan di kelas memenuhi standar aksesibilitas universal.'
  },
  'pma-2': {
    facts: 'Merancang pembelajaran masa depan mengintegrasikan kecerdasan artifisial, Internet of Things (IoT), dan etika teknologi tingkat lanjut dalam silabus informatika SMA.',
    feelings: 'Sangat bersemangat mengeksplorasi integrasi materi mutakhir yang sangat dinanti oleh peserta didik generasi masa kini.',
    findings: 'Guru informatika tidak boleh ketinggalan oleh muridnya; pendidik harus menjadi pemandu etis dalam pemanfaatan generative AI dan otomasi.',
    future: 'Membimbing murid memanfaatkan AI sebagai mitra berpikir kritis (co-pilot) sembari melarang plagiarisme mentah.'
  },
  'ppg-wk': {
    facts: 'Menyelesaikan modul PPG Wawasan Kebangsaan, CPD (Continuous Professional Development), dan LK 4.E Membangun Budaya Sekolah Berkelanjutan melalui SDGs dan ESD.',
    feelings: 'Menyadari posisi strategis guru sebagai agen perubahan kebangsaan dan pembangunan berkelanjutan dunia.',
    findings: 'Informatika adalah akselerator utama pencapaian SDGs (pendidikan berkualitas, inovasi industri, kota berkelanjutan, aksi iklim).',
    future: 'Menyelaraskan tugas proyek murid dengan pemecahan masalah lingkungan dan sosial di lingkungan sekitar sekolah.'
  },
  'ppl-2': {
    facts: 'Mengemban tanggung jawab mengajar mandiri di kelas X-5 SMAN 15 Bandung, menerapkan asesmen diagnostik profil belajar, menyusun modul ajar, dan memfasilitasi proyek kelompok.',
    feelings: 'Merasa mandiri dan percaya diri memegang kendali penuh pembelajaran selama berminggu-minggu di sekolah mitra.',
    findings: 'Konsistensi aturan kelas yang disepakati bersama (kontrak belajar) menciptakan rasa aman dan disiplin positif tanpa perlu ancaman hukuman.',
    future: 'Menerapkan kontrak belajar partisipatif dan rubrik asesmen autentik yang transparan kepada seluruh murid.'
  },
  'projek-kepemimpinan': {
    facts: 'Memimpin riset dan rekayasa inovasi perangkat smart IoT SIDAKAN (Sistem Cerdas Berkelanjutan) lengkap dengan kode firmware mikrokontroler dan laporan akuntabilitas projek.',
    feelings: 'Bangga dan tertantang memadukan keahlian teknik informatika murni dengan kepemimpinan tim dan dampak sosial nyata.',
    findings: 'Kepemimpinan guru dibuktikan dengan kemampuan menggerakkan sumber daya untuk melahirkan karya inovatif yang solutif.',
    future: 'Mendirikan klub inovasi teknologi dan pembinaan lomba karya ilmiah remaja/robotika di sekolah tempat bertugas.'
  },
  'seminar-ppg': {
    facts: 'Menyelesaikan LK 1 Identifikasi Diri, merumuskan Visi Pendidik PANDAI & Visi Hidup TAAT, menyusun LK 2 Refleksi Bermakna Perjalanan PPG, dan merancang e-portofolio digital interaktif.',
    feelings: 'Merasa haru dan bangga menyaksikan transformasi diri dari seorang sarjana komputer menjadi pendidik profesional yang memiliki integritas dan visi mulia.',
    findings: 'Portofolio bukanlah sekadar tumpukan sertifikat atau file tugas, melainkan cermin jiwa profesionalisme dan komitmen seumur hidup seorang guru.',
    future: 'Terus belajar sepanjang hayat (lifelong learner), berkarya, dan menginspirasi murid-murid di seluruh penjuru Indonesia.'
  }
};

const fullCourseDetails = courses.map(course => {
  // Find related artifacts from inventory
  const courseArtifacts = inv.filter(item => item.mkId === course.id && item.include);
  
  // Group artifacts by topic
  const topicsMap = {};
  for (const art of courseArtifacts) {
    const t = art.topic || 'Umum';
    if (!topicsMap[t]) topicsMap[t] = [];
    topicsMap[t].push({
      name: art.name,
      ext: art.ext,
      size: art.sizeFormatted,
      fullPath: art.fullPath,
      relPath: art.relPath,
      featured: art.featured,
      mediaType: art.mediaType
    });
  }

  const topicsList = Object.keys(topicsMap).map(topikName => ({
    nama: topikName,
    artefak: topicsMap[topikName]
  }));

  const refleksi = reflectionsMap[course.id] || {
    facts: `Melaksanakan seluruh rangkaian pembelajaran pada mata kuliah ${course.title} secara komprehensif.`,
    feelings: `Menemukan pengalaman belajar yang bermakna dan memotivasi peningkatan kompetensi keguruan.`,
    findings: `Menguasai konsep esensial dan metodologi pengajaran yang adaptif sesuai tuntutan zaman.`,
    future: `Menerapkan wawasan yang didapatkan ke dalam praktik nyata di kelas Informatika.`
  };

  return {
    ...course,
    totalArtefakCount: courseArtifacts.length,
    topikList: topicsList,
    refleksi
  };
});

fs.writeFileSync(outPath, JSON.stringify(fullCourseDetails, null, 2), 'utf8');
console.log('Successfully generated full course details for', fullCourseDetails.length, 'courses to', outPath);
