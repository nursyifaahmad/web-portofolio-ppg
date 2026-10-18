import fs from 'node:fs';
import path from 'node:path';

const SRC_ROOT = 'D:\\PPG';
const DEST_ROOT = 'D:\\PPG\\Artefak PPG';

// Ensure clean creation or update of destination
if (fs.existsSync(DEST_ROOT)) {
  fs.rmSync(DEST_ROOT, { recursive: true, force: true });
}
fs.mkdirSync(DEST_ROOT, { recursive: true });

let totalCopiedFiles = 0;
let totalCopiedBytes = 0;
const summaryLog = [];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFileSafe(srcFile, destDir, customFileName = null) {
  if (!fs.existsSync(srcFile)) return false;
  const stat = fs.statSync(srcFile);
  if (!stat.isFile()) return false;

  const fileName = customFileName || path.basename(srcFile);
  const ext = path.extname(fileName).toLowerCase();

  // Skip browser temp files, raw videos, and css/js dumps
  if (['.download', '.tmp', '.css', '.js', '.mp4', '.mov', '.mkv', '.avi'].includes(ext)) {
    return false;
  }

  ensureDir(destDir);
  const destPath = path.join(destDir, fileName);
  fs.copyFileSync(srcFile, destPath);
  totalCopiedFiles++;
  totalCopiedBytes += stat.size;
  return true;
}

function isLecturerOrRawMaterial(fileName) {
  const lower = fileName.toLowerCase();
  const skipPatterns = [
    'sinkron',
    'panduan',
    'rps',
    'pengantar',
    'materi ',
    'materi_',
    '-materi',
    'hakikat kurikulum',
    'komponen kurikulum',
    'sejarah-kurikulum',
    'the art of teaching',
    '1. matrikulasi ppg',
    'jadwal',
    'kriteria kelulusan',
    'virtual bg',
    'buku siswa',
    'informatika_bs_kls',
    '21 - inti - seminar ppg',
    'chatgpt image',
    'capt-1_17-tujuan-sdgs',
    'untitled design',
    'pertanyaan awal',
    'pertanyaan pemahaman',
    'kegiatan kelas',
    'question 1'
  ];
  return skipPatterns.some(p => lower.includes(p));
}

function copyFilteredDirectory(srcDir, destDir, filterFn = null) {
  if (!fs.existsSync(srcDir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullSrc = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.endsWith('_files')) continue; // Skip browser saved html _files folders
      count += copyFilteredDirectory(fullSrc, path.join(destDir, entry.name), filterFn);
    } else if (entry.isFile()) {
      if (isLecturerOrRawMaterial(entry.name)) continue;
      if (filterFn && !filterFn(entry.name, fullSrc)) continue;
      if (copyFileSafe(fullSrc, destDir)) count++;
    }
  }
  return count;
}

function writeVideoLocationNotepad(destFolder, title, videoSourceDirs) {
  ensureDir(destFolder);
  const videoFiles = [];

  function scanVideos(dir) {
    if (!fs.existsSync(dir)) return;
    const stat = fs.statSync(dir);
    if (stat.isFile()) {
      const ext = path.extname(dir).toLowerCase();
      if (['.mp4', '.mov', '.mkv', '.avi'].includes(ext)) {
        videoFiles.push({
          name: path.basename(dir),
          fullPath: dir,
          sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
          mtime: stat.mtime.toISOString().split('T')[0]
        });
      }
      return;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanVideos(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.mp4', '.mov', '.mkv', '.avi'].includes(ext)) {
          const fStat = fs.statSync(fullPath);
          videoFiles.push({
            name: entry.name,
            fullPath,
            sizeMB: (fStat.size / (1024 * 1024)).toFixed(2),
            mtime: fStat.mtime.toISOString().split('T')[0]
          });
        }
      }
    }
  }

  for (const vDir of videoSourceDirs) {
    scanVideos(vDir);
  }

  const totalMB = videoFiles.reduce((acc, v) => acc + parseFloat(v.sizeMB), 0).toFixed(2);
  const lines = [
    '================================================================================',
    `  DAFTAR & LOKASI PENYIMPANAN VIDEO: ${title.toUpperCase()}`,
    '  Disusun oleh: Ahmad Nursyifa, S.Kom. (NIM: 2530712)',
    '  Program Studi PPG Prajabatan Informatika - Universitas Pendidikan Indonesia',
    '================================================================================',
    '',
    'CATATAN:',
    'Untuk menghemat ruang penyimpanan disk, file video berkapasitas besar tidak',
    'disalin ganda ke dalam folder ini. Anda dapat membuka file video asli secara',
    'langsung melalui alamat lokasi penyimpanan (Path) di bawah ini:',
    '',
    `Total File Video : ${videoFiles.length} File`,
    `Total Ukuran     : ${totalMB} MB`,
    '',
    '--------------------------------------------------------------------------------',
    'RINCIAN LOKASI FILE VIDEO:',
    '--------------------------------------------------------------------------------',
    ''
  ];

  videoFiles.forEach((v, idx) => {
    lines.push(`${String(idx + 1).padStart(2, '0')}. Nama File : ${v.name}`);
    lines.push(`    Ukuran    : ${v.sizeMB} MB`);
    lines.push(`    Tanggal   : ${v.mtime}`);
    lines.push(`    Lokasi    : ${v.fullPath}`);
    lines.push('');
  });

  lines.push('================================================================================');

  const txtPath = path.join(destFolder, 'LOKASI_PENYIMPANAN_VIDEO.txt');
  fs.writeFileSync(txtPath, lines.join('\r\n'), 'utf8');
  totalCopiedFiles++;
}

// ============================================================================
// 00. PROFIL DAN IDENTITAS PENDIDIK
// ============================================================================
const profilDest = path.join(DEST_ROOT, '00_Profil_dan_Identitas_Pendidik');
copyFileSafe(path.join(SRC_ROOT, 'Pas Foto jas BIRU 4x6.jpg'), profilDest);
copyFileSafe(path.join(SRC_ROOT, 'bukti absen pra orientasi.png'), profilDest);
const semPpgSrc = path.join(SRC_ROOT, 'SEMESTER 2', 'SEMINAR PPG');
[
  'VISI MISI HIDUP.pdf',
  'VISI MISI HIDUP.png',
  'VISI MISI PENDIDIK.pdf',
  'VISI MISI PENDIDIK.png',
  'VISI MISI.docx',
  'Presentasi_LK1_Identifikasi_Diri.pptx',
  'LEMBAR KERJA 1 (LK 1).pdf',
  'LEMBAR KERJA 1 (LK 1).docx'
].forEach(f => copyFileSafe(path.join(semPpgSrc, f), profilDest));

// ============================================================================
// 01. MATRIKULASI (Langsung di dalam Artefak PPG)
// ============================================================================
const matrikSrc = path.join(SRC_ROOT, 'MATRIKULASI');
const matrikDest = path.join(DEST_ROOT, '01_Matrikulasi');

// 00 Artefak Unggulan Matrikulasi
copyFileSafe(
  path.join(matrikSrc, 'TUGAS', 'LK 2.4  Rancangan pembelajaran dan asesmen sederhana sesuai bidang studi - Ahmad Nursyifa.pdf'),
  path.join(matrikDest, '00_Artefak_Unggulan')
);
copyFileSafe(
  path.join(matrikSrc, 'TUGAS', 'LK. 3.1 Identifikasi Keberagaman murid-Ahmad Nursyifa.pdf'),
  path.join(matrikDest, '00_Artefak_Unggulan')
);
copyFileSafe(
  path.join(matrikSrc, 'TUGAS', 'LK. 3.2 Identifikasi Kebutuhan Belajar Murid-Ahmad Nursyifa.pdf'),
  path.join(matrikDest, '00_Artefak_Unggulan')
);

// 01 Tugas & Catatan Harian Day 1 - 9
for (let d = 1; d <= 9; d++) {
  const daySrc = path.join(matrikSrc, `DAY ${d}`);
  const dayDest = path.join(matrikDest, '01_Tugas_dan_Dokumentasi_Harian', `Day_${d}`);
  copyFilteredDirectory(daySrc, dayDest);
}

// 02 Lembar Kerja Matrikulasi (Folder TUGAS)
copyFilteredDirectory(
  path.join(matrikSrc, 'TUGAS'),
  path.join(matrikDest, '02_Lembar_Kerja_Matrikulasi')
);

// ============================================================================
// 02. LITERASI KESEHATAN MENTAL (Langsung di dalam Artefak PPG)
// ============================================================================
const lkmSrc = path.join(SRC_ROOT, 'LITERASI KESEHATAN MENTAL');
const lkmDest = path.join(DEST_ROOT, '02_Literasi_Kesehatan_Mental');

copyFilteredDirectory(
  lkmSrc,
  path.join(lkmDest, '01_Lembar_Kerja_LK_1.1_sd_1.5'),
  (name) => name.toLowerCase().startsWith('lk ')
);
copyFilteredDirectory(
  lkmSrc,
  path.join(lkmDest, '02_Dokumentasi_dan_Orientasi'),
  (name) => !name.toLowerCase().startsWith('lk ')
);

// ============================================================================
// 03. P2M (Langsung di dalam Artefak PPG)
// ============================================================================
const p2mSrc = path.join(SRC_ROOT, 'P2M');
const p2mDest = path.join(DEST_ROOT, '03_P2M');
copyFilteredDirectory(p2mSrc, p2mDest);

// ============================================================================
// 04. SEMESTER 1
// ============================================================================
const sem1Src = path.join(SRC_ROOT, 'SEMESTER 1');
const sem1Dest = path.join(DEST_ROOT, '04_Semester_1');
const artefakUnggulanSem1Src = path.join(SRC_ROOT, 'SEMESTER 2', 'SEMINAR PPG', 'Artefak Semester 1');

// 4.1 Filosofi Pendidikan dan Pendidikan Nilai
const filSrc = path.join(sem1Src, 'FILOSOFI PENDIDIKAN DAN PENDIDIKAN NILAI');
const filDest = path.join(sem1Dest, '01_Filosofi_Pendidikan_dan_Pendidikan_Nilai');
fs.readdirSync(artefakUnggulanSem1Src).forEach(f => {
  if (f.toLowerCase().includes('filosofi pendidikan')) {
    copyFileSafe(path.join(artefakUnggulanSem1Src, f), path.join(filDest, '00_Artefak_Unggulan'));
  }
});
for (let t = 1; t <= 4; t++) {
  copyFilteredDirectory(path.join(filSrc, `TOPIK ${t}`), path.join(filDest, `0${t}_Topik_${t}`));
}

// 4.2 Growth Mindset dalam Pembelajaran
const gmSrc = path.join(sem1Src, 'GROWTH MINDSET DALAM PEMBELAJARAN');
const gmDest = path.join(sem1Dest, '02_Growth_Mindset_dalam_Pembelajaran');
copyFileSafe(
  path.join(artefakUnggulanSem1Src, 'Growth Mindset-Ahmad Nursyifa_SMAN 15 Bandung_Tugas Asynchronous.pdf'),
  path.join(gmDest, '00_Artefak_Unggulan')
);
for (let t = 1; t <= 4; t++) {
  copyFilteredDirectory(path.join(gmSrc, `TOPIK ${t}`), path.join(gmDest, `0${t}_Topik_${t}`));
}
// Root files in Growth Mindset
fs.readdirSync(gmSrc, { withFileTypes: true }).forEach(e => {
  if (e.isFile() && !isLecturerOrRawMaterial(e.name)) {
    copyFileSafe(path.join(gmSrc, e.name), path.join(gmDest, '05_Tugas_dan_Refleksi_Tambahan'));
  }
});

// 4.3 Pemahaman tentang Peserta Didik dan Pembelajarannya
const ppdpSrc = path.join(sem1Src, 'PEMAHAMAN TENTANG PESERTA DIDIK DAN PEMBELAJARAN');
const ppdpDest = path.join(sem1Dest, '03_Pemahaman_Peserta_Didik_dan_Pembelajarannya');
fs.readdirSync(artefakUnggulanSem1Src).forEach(f => {
  if (f.toLowerCase().includes('pemahaman peserta didik')) {
    copyFileSafe(path.join(artefakUnggulanSem1Src, f), path.join(ppdpDest, '00_Artefak_Unggulan'));
  }
});
for (let t = 1; t <= 4; t++) {
  copyFilteredDirectory(path.join(ppdpSrc, `TOPIK ${t}`), path.join(ppdpDest, `0${t}_Topik_${t}`));
}
copyFilteredDirectory(path.join(ppdpSrc, 'UAS'), path.join(ppdpDest, '05_UAS'));
fs.readdirSync(ppdpSrc, { withFileTypes: true }).forEach(e => {
  if (e.isFile() && !isLecturerOrRawMaterial(e.name)) {
    copyFileSafe(path.join(ppdpSrc, e.name), path.join(ppdpDest, '06_Dokumen_Lainnya'));
  }
});

// 4.4 Pembelajaran Berdiferensiasi
const pbSrc = path.join(sem1Src, 'PEMBELAJARAN BERDIFERENSIASI');
const pbDest = path.join(sem1Dest, '04_Pembelajaran_Berdiferensiasi');
copyFileSafe(
  path.join(artefakUnggulanSem1Src, 'PB-4D_KELOMPOK 1 SMAN 15 BANDUNG.docx.pdf'),
  path.join(pbDest, '00_Artefak_Unggulan')
);
for (let t = 1; t <= 4; t++) {
  copyFilteredDirectory(path.join(pbSrc, `TOPIK ${t}`), path.join(pbDest, `0${t}_Topik_${t}`));
}
copyFilteredDirectory(path.join(pbSrc, 'UTS'), path.join(pbDest, '05_UTS'));
fs.readdirSync(pbSrc, { withFileTypes: true }).forEach(e => {
  if (e.isFile() && !isLecturerOrRawMaterial(e.name)) {
    copyFileSafe(path.join(pbSrc, e.name), path.join(pbDest, '06_Dokumen_Lainnya'));
  }
});

// 4.5 PMA I & Microteaching
const pma1Src = path.join(sem1Src, 'PMA');
const pma1Dest = path.join(sem1Dest, '05_PMA_1_dan_Microteaching');
copyFileSafe(
  path.join(artefakUnggulanSem1Src, 'PMA_Materi_Struktur_Data.pptx'),
  path.join(pma1Dest, '00_Artefak_Unggulan')
);
for (let t = 1; t <= 5; t++) {
  copyFilteredDirectory(path.join(pma1Src, `TOPIK ${t}`), path.join(pma1Dest, `0${t}_Topik_${t}`));
}
copyFilteredDirectory(path.join(pma1Src, 'MICROTEACHING'), path.join(pma1Dest, '06_Microteaching'));
copyFilteredDirectory(path.join(pma1Src, 'TUGAS BUAT SOAL'), path.join(pma1Dest, '07_Tugas_Buat_Soal'));
copyFilteredDirectory(path.join(pma1Src, 'UTS'), path.join(pma1Dest, '08_UTS'));
copyFilteredDirectory(path.join(pma1Src, 'UAS'), path.join(pma1Dest, '09_UAS'));
fs.readdirSync(pma1Src, { withFileTypes: true }).forEach(e => {
  if (e.isFile() && !isLecturerOrRawMaterial(e.name)) {
    copyFileSafe(path.join(pma1Src, e.name), path.join(pma1Dest, '10_Dokumen_Lainnya'));
  }
});

// 4.6 PPL I SMAN 15 Bandung
const ppl1Src = path.join(sem1Src, 'PPL');
const ppl1Dest = path.join(sem1Dest, '06_PPL_1_SMAN_15_Bandung');
copyFileSafe(
  path.join(artefakUnggulanSem1Src, 'PPL-Modul_Ajar_Informatika_XI 5_Videografi.pdf'),
  path.join(ppl1Dest, '00_Artefak_Unggulan')
);
copyFilteredDirectory(path.join(ppl1Src, 'LMS'), path.join(ppl1Dest, '01_Tugas_LMS_dan_Observasi'));
copyFilteredDirectory(path.join(ppl1Src, 'SIPPP'), path.join(ppl1Dest, '01_Tugas_LMS_dan_Observasi', 'SIPPP'));
copyFilteredDirectory(path.join(ppl1Src, 'NILAI PSAJ'), path.join(ppl1Dest, '01_Tugas_LMS_dan_Observasi', 'Nilai_PSAJ'));
copyFilteredDirectory(path.join(ppl1Src, 'SINEMATOGRAFI'), path.join(ppl1Dest, '02_Perangkat_Sinematografi_dan_Naskah'));
copyFilteredDirectory(path.join(ppl1Src, 'E-PORTOFOLIO'), path.join(ppl1Dest, '03_E_Portofolio_dan_UAS'));
copyFilteredDirectory(path.join(ppl1Src, 'Foto'), path.join(ppl1Dest, '04_Galeri_Foto_Kegiatan'));
fs.readdirSync(ppl1Src, { withFileTypes: true }).forEach(e => {
  if (e.isFile() && !isLecturerOrRawMaterial(e.name)) {
    copyFileSafe(path.join(ppl1Src, e.name), path.join(ppl1Dest, '01_Tugas_LMS_dan_Observasi'));
  }
});
writeVideoLocationNotepad(
  path.join(ppl1Dest, '05_Video_Pembelajaran'),
  'PPL I SMAN 15 Bandung & Materi Sinematografi',
  [
    path.join(ppl1Src, 'VIDEO PEMBELAJARAN'),
    path.join(ppl1Src, 'SINEMATOGRAFI')
  ]
);

// ============================================================================
// 05. SEMESTER 2
// ============================================================================
const sem2Src = path.join(SRC_ROOT, 'SEMESTER 2');
const sem2Dest = path.join(DEST_ROOT, '05_Semester_2');

// 5.1 Pembelajaran Sosial Emosional (PSE)
const pseSrc = path.join(sem2Src, 'PEMBELAJARAN SOSIAL EMOSIONAL');
const pseDest = path.join(sem2Dest, '01_Pembelajaran_Sosial_Emosional_PSE');
if (fs.existsSync(pseSrc)) {
  const pseFiles = fs.readdirSync(pseSrc, { withFileTypes: true });
  for (const e of pseFiles) {
    if (!e.isFile() || isLecturerOrRawMaterial(e.name)) continue;
    const n = e.name.toUpperCase();
    const full = path.join(pseSrc, e.name);

    // Artefak Unggulan PSE
    if (n.includes('T3.E.') && n.includes('AHMAD NURSYIFA') || n.includes('UAS_PSE_AHMADNURSYIFA')) {
      copyFileSafe(full, path.join(pseDest, '00_Artefak_Unggulan'));
    }

    if (n.startsWith('1') || n.includes('LK 1.') || n.includes('LK.1.') || n.includes('LEMBAR KERJA 1')) {
      copyFileSafe(full, path.join(pseDest, '01_Topik_1_Komponen_CASEL'));
    } else if (n.startsWith('2') || n.startsWith('TP2') || n.includes('LK 2.') || n.includes('LK.2.') || n.includes('LEMBAR KERJA 2') || n.includes('AKTIVITAS 2')) {
      copyFileSafe(full, path.join(pseDest, '02_Topik_2_Guru_Sebagai_Teladan'));
    } else if (n.startsWith('T3') || n.startsWith('T 3') || n.includes('LK 3')) {
      copyFileSafe(full, path.join(pseDest, '03_Topik_3_Experiential_Learning'));
    } else if (n.startsWith('4') || n.startsWith('TOPIK 4') || n.includes('LEMBAR KERJA 4')) {
      copyFileSafe(full, path.join(pseDest, '04_Topik_4_School_Well_Being'));
    } else if (n.includes('UTS') || n.includes('UJIAN TENGAH')) {
      copyFileSafe(full, path.join(pseDest, '05_UTS'));
    } else if (n.includes('UAS') || n.includes('UJIAN AKHIR')) {
      copyFileSafe(full, path.join(pseDest, '06_UAS'));
    } else {
      copyFileSafe(full, path.join(pseDest, '07_Presentasi_dan_Catatan'));
    }
  }
}

// 5.2 Pendidikan Inklusif
const piSrc = path.join(sem2Src, 'PENDIDIKAN INKLUSIF');
const piDest = path.join(sem2Dest, '02_Pendidikan_Inklusif');
if (fs.existsSync(piSrc)) {
  const piFiles = fs.readdirSync(piSrc, { withFileTypes: true });
  for (const e of piFiles) {
    if (!e.isFile() || isLecturerOrRawMaterial(e.name)) continue;
    const n = e.name.toUpperCase();
    const full = path.join(piSrc, e.name);

    if (n.includes('T2.1.4') && n.endsWith('.PDF')) {
      copyFileSafe(full, path.join(piDest, '00_Artefak_Unggulan'));
    }

    if (n.includes('T1.') || n.includes('AKTIVITAS 3')) {
      copyFileSafe(full, path.join(piDest, '01_Topik_1_Memahami_dan_Memetakan_Keragaman'));
    } else if (n.includes('T2.')) {
      copyFileSafe(full, path.join(piDest, '02_Topik_2_Menjadi_Guru_Inklusif'));
    } else if (n.includes('T3.')) {
      copyFileSafe(full, path.join(piDest, '03_Topik_3_Merancang_Ulang_Kelas_Inklusif'));
    } else if (n.includes('T4.')) {
      copyFileSafe(full, path.join(piDest, '04_Topik_4_Asesmen_dan_Strategi_Inklusif'));
    } else {
      copyFileSafe(full, path.join(piDest, '05_Dokumen_Lainnya'));
    }
  }
}

// 5.3 PMA Lanjut
const pmalSrc = path.join(sem2Src, 'PMA LANJUT');
const pmalDest = path.join(sem2Dest, '03_PMA_Lanjut');
if (fs.existsSync(pmalSrc)) {
  const pmalFiles = fs.readdirSync(pmalSrc, { withFileTypes: true });
  for (const e of pmalFiles) {
    if (!e.isFile() || isLecturerOrRawMaterial(e.name)) continue;
    const n = e.name.toUpperCase();
    const full = path.join(pmalSrc, e.name);

    if (n.includes('UAS_PMAL_SMK_AHMAD_NURSYIFA_FINAL.PDF') || n.includes('UTS_PMAL_AHMAD_NURSYIFA_2530712.PDF')) {
      copyFileSafe(full, path.join(pmalDest, '00_Artefak_Unggulan'));
    }

    if (n.startsWith('1.') || n.startsWith('LK 1.') || n.startsWith('T1-') || n.startsWith('TP1') || n.includes('TOPIK 1') || n.includes('TOPIK1')) {
      copyFileSafe(full, path.join(pmalDest, '01_Topik_1_Asesmen_Awal_Berbasis_DUP'));
    } else if (n.startsWith('LK 2.') || n.startsWith('T2-') || n.startsWith('TP2') || n.includes('PMA 2.') || n.includes('AKTIVITAS_2') || n.includes('TOPIK2')) {
      copyFileSafe(full, path.join(pmalDest, '02_Topik_2_Pembelajaran_Mendalam'));
    } else if (n.startsWith('LK3.') || n.startsWith('LK.3.') || n.startsWith('T3') || n.startsWith('TP3') || n.includes('TOPIK3')) {
      copyFileSafe(full, path.join(pmalDest, '03_Topik_3_Strategi_Asesmen_Vokasional'));
    } else if (n.startsWith('4.') || n.startsWith('T4') || n.startsWith('TOPIK 4') || n.includes('LEMBAR KERJA 4')) {
      copyFileSafe(full, path.join(pmalDest, '04_Topik_4_Implementasi_TaRL_dan_CRT'));
    } else if (n.startsWith('5.') || n.startsWith('TOPIK 5') || n.includes('LEMBAR KERJA 5') || n.includes('LK. 5')) {
      copyFileSafe(full, path.join(pmalDest, '05_Topik_5_Evaluasi_dan_Sintesis_Data_Asesmen'));
    } else if (n.startsWith('UTS')) {
      copyFileSafe(full, path.join(pmalDest, '06_UTS'));
    } else if (n.startsWith('UAS')) {
      copyFileSafe(full, path.join(pmalDest, '07_UAS'));
    } else {
      copyFileSafe(full, path.join(pmalDest, '08_Peta_Konsep_dan_Catatan'));
    }
  }
}

// 5.4 PPG-WK (Wawasan Kebangsaan, CPD & SDGs)
const wkSrc = path.join(sem2Src, 'PPG-WK');
const wkDest = path.join(sem2Dest, '04_PPG_Wawasan_Kebangsaan_dan_SDGs');
if (fs.existsSync(wkSrc)) {
  const wkFiles = fs.readdirSync(wkSrc, { withFileTypes: true });
  for (const e of wkFiles) {
    if (!e.isFile() || isLecturerOrRawMaterial(e.name)) continue;
    const n = e.name.toUpperCase();
    const full = path.join(wkSrc, e.name);

    if (n.includes('PORTOFOLIO_PROFESIONAL_GURU_BERDAMPAK_SDGS_AHMAD_NURSYIFA_FINAL.PDF') || n.includes('LK 4.E AHMAD NURSYIFA.PDF')) {
      copyFileSafe(full, path.join(wkDest, '00_Artefak_Unggulan'));
    }

    if (n.startsWith('1') || n.startsWith('LK1')) {
      copyFileSafe(full, path.join(wkDest, '01_Topik_1_Audit_CPD_dan_Guru_Pembelajar'));
    } else if (n.startsWith('T2') || n.startsWith('LK2')) {
      copyFileSafe(full, path.join(wkDest, '02_Topik_2_Rancangan_IDP_dan_Komunitas_Belajar'));
    } else if (n.startsWith('3') || n.startsWith('LK 3') || n.startsWith('TOPIK 3')) {
      copyFileSafe(full, path.join(wkDest, '03_Topik_3_Rencana_Pembelajaran_Berbasis_4C'));
    } else if (n.startsWith('4') || n.startsWith('LK 4') || n.startsWith('PORTOFOLIO_PROFESIONAL')) {
      copyFileSafe(full, path.join(wkDest, '04_Topik_4_Budaya_Sekolah_SDGs_dan_ESD'));
    } else {
      copyFileSafe(full, path.join(wkDest, '05_Dokumen_Lainnya'));
    }
  }
}

// 5.5 PPL II Mandiri SMAN 15 Bandung
const ppl2Src = path.join(sem2Src, 'PPL');
const ppl2Dest = path.join(sem2Dest, '05_PPL_2_Mandiri_SMAN_15_Bandung');
if (fs.existsSync(ppl2Src)) {
  // Kelas X-5 Perangkat & Pertemuan
  copyFilteredDirectory(
    path.join(ppl2Src, 'X-5', 'PERTEMUAN 1'),
    path.join(ppl2Dest, '01_Perangkat_Ajar_Kelas_X5', 'Pertemuan_1')
  );
  fs.readdirSync(path.join(ppl2Src, 'X-5'), { withFileTypes: true }).forEach(e => {
    if (e.isFile() && !isLecturerOrRawMaterial(e.name)) {
      copyFileSafe(path.join(ppl2Src, 'X-5', e.name), path.join(ppl2Dest, '01_Perangkat_Ajar_Kelas_X5'));
    }
  });
  // PTK
  copyFilteredDirectory(
    path.join(ppl2Src, 'X-5', 'PTK'),
    path.join(ppl2Dest, '02_Penelitian_Tindakan_Kelas_PTK')
  );
  // Tugas LMS & Pemetaan Siswa
  copyFilteredDirectory(
    path.join(ppl2Src, 'TUGAS LMS'),
    path.join(ppl2Dest, '03_Tugas_LMS_dan_Pemetaan_Siswa')
  );
  // Laporan Akhir & Administrasi Guru
  copyFilteredDirectory(
    path.join(ppl2Src, 'LAPORAN AKHIR'),
    path.join(ppl2Dest, '04_Laporan_Akhir_dan_Jurnal_Harian')
  );
  fs.readdirSync(ppl2Src, { withFileTypes: true }).forEach(e => {
    if (e.isFile() && !isLecturerOrRawMaterial(e.name)) {
      copyFileSafe(path.join(ppl2Src, e.name), path.join(ppl2Dest, '04_Laporan_Akhir_dan_Jurnal_Harian'));
    }
  });
  // Galeri Foto PPL 2
  copyFilteredDirectory(
    path.join(ppl2Src, 'FOTO'),
    path.join(ppl2Dest, '05_Galeri_Foto_PPL_2')
  );
  // Video Pembelajaran PPL 2 -> Notepad
  writeVideoLocationNotepad(
    path.join(ppl2Dest, '06_Video_Pembelajaran'),
    'PPL II Mandiri Kelas X-5 SMAN 15 Bandung',
    [path.join(ppl2Src, 'X-5', 'Video Pembelajaran')]
  );
}

// 5.6 Projek Kepemimpinan (SIDAKAN)
const pkSrc = path.join(sem2Src, 'PROJEK KEPEMIMPINAN');
const pkDest = path.join(sem2Dest, '06_Projek_Kepemimpinan_SIDAKAN');
if (fs.existsSync(pkSrc)) {
  // Firmware folder
  copyFilteredDirectory(
    path.join(pkSrc, 'SIDAKAN_Firmware'),
    path.join(pkDest, '03_SIDAKAN_Firmware_Code')
  );

  const pkFiles = fs.readdirSync(pkSrc, { withFileTypes: true });
  for (const e of pkFiles) {
    if (!e.isFile() || isLecturerOrRawMaterial(e.name)) continue;
    const n = e.name.toUpperCase();
    const ext = path.extname(e.name).toLowerCase();
    const full = path.join(pkSrc, e.name);

    if (['.mp4', '.mkv', '.mov'].includes(ext)) continue;

    if (n.includes('PROPOSAL SIDAKAN PK A1 FINAL.PDF') || n.includes('SIDAKAN_PANDUAN_PERAKITAN_DAN_PEMBUATAN_KOMPREHENSIF.DOCX')) {
      copyFileSafe(full, path.join(pkDest, '00_Artefak_Unggulan_Proposal_Final'));
    }

    if (n.startsWith('LK ') || n.startsWith('TP1') || n.startsWith('TUGAS') || n.includes('EVALUASI')) {
      copyFileSafe(full, path.join(pkDest, '01_Lembar_Kerja_dan_Refleksi'));
    } else if (n.includes('PROPOSAL') || n.includes('PANDUAN_PERAKITAN') || n.includes('RAB_') || n.includes('IDE PROKEP')) {
      copyFileSafe(full, path.join(pkDest, '02_Proposal_Panduan_Perakitan_dan_RAB'));
    } else if (n.includes('UTS') || n.endsWith('.PPTX') || n.includes('COVER')) {
      copyFileSafe(full, path.join(pkDest, '04_UTS_dan_Presentasi'));
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      copyFileSafe(full, path.join(pkDest, '05_Dokumentasi_Foto_dan_Poster'));
    } else {
      copyFileSafe(full, path.join(pkDest, '01_Lembar_Kerja_dan_Refleksi'));
    }
  }

  writeVideoLocationNotepad(
    path.join(pkDest, '06_Video_Presentasi'),
    'Projek Kepemimpinan (SIDAKAN & Smart Water Monitor)',
    [pkSrc]
  );
}

// 5.7 Seminar PPG
const semDest = path.join(sem2Dest, '07_Seminar_PPG');
if (fs.existsSync(semPpgSrc)) {
  [
    'LEMBAR KERJA 1 (LK 1).docx',
    'LEMBAR KERJA 1 (LK 1).pdf',
    'Presentasi_LK1_Identifikasi_Diri.pptx',
    'VISI MISI HIDUP.pdf',
    'VISI MISI HIDUP.png',
    'VISI MISI PENDIDIK.pdf',
    'VISI MISI PENDIDIK.png',
    'VISI MISI.docx'
  ].forEach(f => copyFileSafe(path.join(semPpgSrc, f), path.join(semDest, '01_LK_1_Identifikasi_Diri_dan_Visi_Misi')));

  [
    'LEMBAR KERJA 2 (LK 2).docx',
    'LEMBAR KERJA 2 (LK 2).pdf',
    'COVER TUGAS SEMINAR PROFESI GURU.docx',
    'Note Perkuliahan.docx'
  ].forEach(f => copyFileSafe(path.join(semPpgSrc, f), path.join(semDest, '02_LK_2_Refleksi_Komprehensif')));

  copyFilteredDirectory(
    path.join(semPpgSrc, 'Artefak Semester 1'),
    path.join(semDest, '03_Koleksi_Artefak_Unggulan_Semester_1')
  );
}

// ============================================================================
// GENERATE MASTER INDEX FILE
// ============================================================================
function buildTreeSummary(dir, prefix = '') {
  const lines = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const dirs = entries.filter(e => e.isDirectory());
  const files = entries.filter(e => e.isFile());

  dirs.forEach((d, idx) => {
    const isLast = idx === dirs.length - 1 && files.length === 0;
    const branch = isLast ? '└── ' : '├── ';
    const subFull = path.join(dir, d.name);
    const fileCount = countFilesRecursive(subFull);
    lines.push(`${prefix}${branch}📁 ${d.name} (${fileCount} file)`);
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    lines.push(...buildTreeSummary(subFull, nextPrefix));
  });

  return lines;
}

function countFilesRecursive(dir) {
  let c = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) c += countFilesRecursive(full);
    else c++;
  }
  return c;
}

const treeLines = buildTreeSummary(DEST_ROOT);
const totalMBFormatted = (totalCopiedBytes / (1024 * 1024)).toFixed(2);

const masterIndexContent = [
  '================================================================================',
  '  INDEKS LENGKAP ARTEFAK PERKULIAHAN PPG PRAJABATAN TAHUN 2026',
  '================================================================================',
  'Nama Mahasiswa : Ahmad Nursyifa, S.Kom.',
  'NIM            : 2530712',
  'Bidang Studi   : Informatika (Kelas INF A)',
  'LPTK           : Universitas Pendidikan Indonesia (UPI)',
  'Sekolah Mitra  : SMAN 15 Bandung',
  'Guru Pamong    : Andre Dewantara, S.T., Gr.',
  'Dosen (DPL)    : Dr. Wahyudin, M.T.',
  'Website        : https://ppg.ahmadnursyifa.my.id',
  '================================================================================',
  '',
  `Total Artefak Tersusun : ${totalCopiedFiles} File`,
  `Total Ukuran Folder    : ${totalMBFormatted} MB`,
  '',
  'STRUKTUR DIREKTORI ARTEFAK PPG:',
  'D:\\PPG\\Artefak PPG\\',
  ...treeLines,
  '',
  '================================================================================'
];

fs.writeFileSync(
  path.join(DEST_ROOT, '00_INDEKS_LENGKAP_ARTEFAK_PPG.txt'),
  masterIndexContent.join('\r\n'),
  'utf8'
);

console.log(`SUCCESS! Copied ${totalCopiedFiles} files (${totalMBFormatted} MB) to ${DEST_ROOT}`);
