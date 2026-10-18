# 🎓 E-Portofolio Interaktif PPG Prajabatan UPI 2026

**Ahmad Nursyifa, S.Kom.** (NIM: 2530712)  
Program Studi Pendidikan Profesi Guru (PPG) Prajabatan Gelombang 1 Tahun 2026  
Bidang Studi Informatika — Kelas INF A  
**Universitas Pendidikan Indonesia (UPI)**  
Sekolah Praktik: **SMAN 15 Bandung**  
Guru Pamong: **Andre Dewantara, S.T., Gr.** | DPL: **Dr. Wahyudin, M.T.**

🌐 **Live URL:** [https://ppg.ahmadnursyifa.my.id](https://ppg.ahmadnursyifa.my.id)

---

## ✨ Fitur Unggulan

- **📱 Desain Responsif Penuh (Mobile-First):** Nyaman dibuka dari smartphone Android & iPhone (Safari iOS safe-area insets, notch, dynamic viewport `100dvh`, bottom app bar, target sentuh ergonomis).
- **💻 Interactive CLI Terminal (Easter Egg):** Terminal command-line interaktif ala Informatika yang dapat dibuka via hotkey (`` ` `` / `Ctrl+K`), tombol navigasi, atau tombol floating `>_` di smartphone dengan dukungan tombol chip perintah cepat.
- **📚 16 Mata Kuliah Lengkap:** Mendokumentasikan perjalanan perkuliahan dari Pra-Semester (Matrikulasi, P2M, Literasi Kesehatan Mental), Semester 1 (Filosofi Pendidikan KHD, Growth Mindset, Pemahaman Siswa, Diferensiasi, PMA I, PPL I), hingga Semester 2 (PSE, Pendidikan Inklusif, PMA Lanjut, PPG-WK, PPL II Kelas X-5, Projek Kepemimpinan SIDAKAN, Seminar PPG).
- **🧭 Model Refleksi Autentik 4F:** Struktur refleksi bermakna (*Facts, Feelings, Findings, Future*) dari Dr. Roger Greenaway berdasarkan dokumen refleksi asli.
- **🖼️ Galeri Dokumentasi PPL:** Dokumentasi visual pengajaran nyata di kelas dan laboratorium komputer SMAN 15 Bandung dengan filter kategori.
- **🌐 Bilingual Support:** Dukungan dwibahasa penuh (Bahasa Indonesia & English) dengan tombol alih instan `ID / EN`.
- **🚀 Self-Hosted Deployment:** Siap di-deploy mandiri ke mini server Ubuntu (`syifaserver`) via Docker Compose + Nginx Alpine dan Cloudflare Zero Trust Tunnel.

---

## 🛠️ Tech Stack

- **Framework:** [Astro 5](https://astro.build/) (Static Site Generation / SSG)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Bahasa:** TypeScript & Node.js 24
- **Ikon:** Lucide Icons
- **Deployment:** Docker & Docker Compose (Nginx Alpine)
- **Akses Publik:** Cloudflare Zero Trust Tunnel (`ppg.ahmadnursyifa.my.id`)

---

## 💻 Menjalankan di Laptop Lokal

```bash
# 1. Masuk ke folder proyek
cd "D:\Antigravity Project\Web Portofolio PPG"

# 2. Pasang dependensi
npm install

# 3. Jalankan development server
npm run dev

# 4. Bangun versi produksi
npm run build

# 5. Uji preview lokal & jaringan Wi-Fi
npm run preview
```

---

## 🚀 Deployment ke Mini Server (`syifaserver`)

Tersedia skrip otomatis 1-klik di `deploy/deploy.ps1`:

```powershell
.\deploy\deploy.ps1
```

Atau manual via Docker Compose:
```bash
docker compose up -d --build
```
Container akan melayani port **`3070`** pada host server.
