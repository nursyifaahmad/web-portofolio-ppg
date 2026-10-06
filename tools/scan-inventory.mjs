import fs from 'node:fs';
import path from 'node:path';

const SOURCE_DIR = 'D:\\PPG';
const OUT_DIR = path.resolve('D:\\Antigravity Project\\Web Portofolio PPG\\content-src');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const IGNORE_PATTERNS = [
  /\.download$/i,
  /\.tmp$/i,
  /\.git/i,
  /node_modules/i,
  /_website/i,
  /Web Portofolio PPG/i,
  /thumbs\.db$/i,
  /desktop\.ini$/i
];

function sanitizeStr(s) {
  return (s || '').replace(/"/g, '""').trim();
}

function classifyCourse(relPath) {
  const norm = relPath.toUpperCase();
  if (norm.includes('MATRIKULASI')) return { cat: 'pra', mkId: 'matrikulasi', mkTitle: 'Matrikulasi' };
  if (norm.includes('P2M')) return { cat: 'pra', mkId: 'p2m', mkTitle: 'Pengabdian Masyarakat (P2M)' };
  if (norm.includes('LITERASI KESEHATAN MENTAL')) return { cat: 'pra', mkId: 'kesehatan-mental', mkTitle: 'Literasi Kesehatan Mental' };

  if (norm.includes('SEMESTER 1')) {
    if (norm.includes('FILOSOFI')) return { cat: 'sem1', mkId: 'filosofi-pendidikan', mkTitle: 'Filosofi Pendidikan dan Pendidikan Nilai' };
    if (norm.includes('GROWTH MINDSET')) return { cat: 'sem1', mkId: 'growth-mindset', mkTitle: 'Growth Mindset dalam Pembelajaran' };
    if (norm.includes('PESERTA DIDIK')) return { cat: 'sem1', mkId: 'pemahaman-peserta-didik', mkTitle: 'Pemahaman tentang Peserta Didik dan Pembelajarannya' };
    if (norm.includes('BERDIFERENSIASI')) return { cat: 'sem1', mkId: 'pembelajaran-berdiferensiasi', mkTitle: 'Prinsip Pengajaran dan Asesmen I (Pembelajaran Berdiferensiasi)' };
    if (norm.includes('PMA')) return { cat: 'sem1', mkId: 'pma-1', mkTitle: 'Pembelajaran Matematika dan Sains/Informatika (PMA I)' };
    if (norm.includes('PPL')) return { cat: 'sem1', mkId: 'ppl-1', mkTitle: 'Praktik Pengalaman Lapangan I (PPL I)' };
    return { cat: 'sem1', mkId: 'lainnya-sem1', mkTitle: 'Semester 1' };
  }

  if (norm.includes('SEMESTER 2')) {
    if (norm.includes('SOSIAL EMOSIONAL')) return { cat: 'sem2', mkId: 'sosial-emosional', mkTitle: 'Pembelajaran Sosial Emosional (PSE)' };
    if (norm.includes('INKLUSIF')) return { cat: 'sem2', mkId: 'pendidikan-inklusif', mkTitle: 'Pendidikan Inklusif' };
    if (norm.includes('PMA LANJUT')) return { cat: 'sem2', mkId: 'pma-2', mkTitle: 'Pembelajaran Masa Depan & PMA Lanjut' };
    if (norm.includes('PPG-WK')) return { cat: 'sem2', mkId: 'ppg-wk', mkTitle: 'PPG Wawasan Kebangsaan & SDGs' };
    if (norm.includes('PROJEK KEPEMIMPINAN')) return { cat: 'sem2', mkId: 'projek-kepemimpinan', mkTitle: 'Projek Kepemimpinan (SIDAKAN)' };
    if (norm.includes('SEMINAR PPG')) return { cat: 'sem2', mkId: 'seminar-ppg', mkTitle: 'Seminar PPG' };
    if (norm.includes('PPL')) return { cat: 'sem2', mkId: 'ppl-2', mkTitle: 'Praktik Pengalaman Lapangan II (PPL II)' };
    return { cat: 'sem2', mkId: 'lainnya-sem2', mkTitle: 'Semester 2' };
  }

  return { cat: 'umum', mkId: 'dokumen-umum', mkTitle: 'Dokumen Umum / Administrasi' };
}

function detectTopic(relPath, fileName) {
  const combined = (relPath + ' ' + fileName).toUpperCase();
  const tMatch = combined.match(/TOPIK\s*(\d+)/i) || combined.match(/DAY\s*(\d+)/i);
  if (tMatch) return `Topik ${tMatch[1]}`;
  if (combined.includes('MICROTEACHING')) return 'Microteaching';
  if (combined.includes('UAS')) return 'UAS';
  if (combined.includes('UTS')) return 'UTS';
  if (combined.includes('E-PORTOFOLIO')) return 'E-Portofolio';
  if (combined.includes('SINEMATOGRAFI')) return 'Sinematografi';
  if (combined.includes('VIDEO PEMBELAJARAN')) return 'Video Pembelajaran';
  if (combined.includes('FOTO')) return 'Galeri Foto';
  if (combined.includes('TUGAS')) return 'Tugas & LK';
  if (combined.includes('ARTEFAK SEMESTER 1')) return 'Artefak Unggulan';
  return 'Umum';
}

function isUserArtifact(fileName, relPath) {
  const norm = (fileName + ' ' + relPath).toLowerCase();
  
  // Strong indicators of lecturer / curriculum / raw guidelines (exclude from student artifacts)
  const lecturerSignals = [
    'sinkron',
    'buku siswa',
    'jadwal lengkap',
    'kalender akademik',
    'pembagian kelas',
    'profil ppg',
    'refisi_rundown',
    'detail kurikulum',
    'jumlah sks',
    'mars ppg',
    'panduan_microteaching',
    'panduan matrikulasi',
    'kriteria kelulusan',
    '1. rps cpd.docx',
    'hakikat kurikulum',
    'komponen kurikulum',
    'sejarah-kurikulum',
    'the art of teaching'
  ];

  for (const signal of lecturerSignals) {
    if (norm.includes(signal)) {
      return false;
    }
  }

  // Strong user signals
  const userSignals = [
    'ahmad',
    'nursyifa',
    'lk ',
    'lk.',
    'lk_',
    'lembar kerja',
    'tugas',
    'kelompok',
    'modul_ajar',
    'modul ajar',
    'rpp',
    'rancangan',
    'refleksi',
    'sertifikat',
    'piagam',
    'identifikasi',
    'visi misi',
    'sidakan',
    'struktur_data',
    'videografi',
    'pengamatan video',
    'studi kasus'
  ];

  for (const signal of userSignals) {
    if (norm.includes(signal)) {
      return true;
    }
  }

  // If inside TUGAS folder or Artefak folder
  if (norm.includes('\\tugas\\') || norm.includes('\\artefak semester 1\\')) {
    return true;
  }

  return false;
}

function scanDir(dir, baseDir = dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (IGNORE_PATTERNS.some(re => re.test(relPath) || re.test(entry.name))) {
      continue;
    }

    if (entry.isDirectory()) {
      results.push(...scanDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const stats = fs.statSync(fullPath);
      const { cat, mkId, mkTitle } = classifyCourse(relPath);
      const topic = detectTopic(relPath, entry.name);
      const isStudentWork = isUserArtifact(entry.name, relPath);
      const isFeatured = relPath.toLowerCase().includes('artefak semester 1') || 
                         entry.name.toLowerCase().includes('visi misi pendidik') ||
                         entry.name.toLowerCase().includes('sidakan');

      results.push({
        name: entry.name,
        ext,
        sizeBytes: stats.size,
        sizeFormatted: stats.size > 1048576 
          ? (stats.size / 1048576).toFixed(1) + ' MB' 
          : (stats.size / 1024).toFixed(0) + ' KB',
        fullPath,
        relPath,
        cat,
        mkId,
        mkTitle,
        topic,
        isStudentWork,
        include: isStudentWork && !['.mp4', '.css', '.download'].includes(ext),
        featured: isFeatured,
        mediaType: ['.mp4'].includes(ext) ? 'video' : ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? 'image' : 'document'
      });
    }
  }

  return results;
}

console.log('Scanning directory:', SOURCE_DIR);
const allFiles = scanDir(SOURCE_DIR);

console.log(`Found ${allFiles.length} total files.`);

// Write JSON
fs.writeFileSync(
  path.join(OUT_DIR, 'inventory.json'),
  JSON.stringify(allFiles, null, 2),
  'utf-8'
);

// Write CSV for user review
const csvHeaders = [
  'ID',
  'INCLUDE',
  'FEATURED',
  'SEMESTER',
  'MATA_KULIAH_ID',
  'MATA_KULIAH_TITLE',
  'TOPIK',
  'FILE_NAME',
  'EXTENSION',
  'SIZE',
  'MEDIA_TYPE',
  'REL_PATH',
  'FULL_PATH'
];

const csvRows = allFiles.map((f, idx) => {
  return [
    idx + 1,
    f.include ? 'TRUE' : 'FALSE',
    f.featured ? 'TRUE' : 'FALSE',
    `"${sanitizeStr(f.cat)}"`,
    `"${sanitizeStr(f.mkId)}"`,
    `"${sanitizeStr(f.mkTitle)}"`,
    `"${sanitizeStr(f.topic)}"`,
    `"${sanitizeStr(f.name)}"`,
    `"${sanitizeStr(f.ext)}"`,
    `"${sanitizeStr(f.sizeFormatted)}"`,
    `"${sanitizeStr(f.mediaType)}"`,
    `"${sanitizeStr(f.relPath)}"`,
    `"${sanitizeStr(f.fullPath)}"`
  ].join(',');
});

fs.writeFileSync(
  path.join(OUT_DIR, 'inventory.csv'),
  [csvHeaders.join(','), ...csvRows].join('\r\n'),
  'utf-8'
);

console.log('Inventory written to:');
console.log(' - ' + path.join(OUT_DIR, 'inventory.json'));
console.log(' - ' + path.join(OUT_DIR, 'inventory.csv'));
