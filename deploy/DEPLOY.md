# 🚀 Panduan Deployment E-Portofolio PPG ke Mini Server (syifaserver)

Website e-portofolio interaktif **Ahmad Nursyifa, S.Kom.** siap di-deploy secara mandiri (*self-hosted*) menggunakan Docker Compose pada mini server Ubuntu Anda (`syifaserver` via Tailscale).

---

## 📋 Ringkasan Konfigurasi

| Parameter | Nilai |
|---|---|
| **Server** | `syifaserver` (Ubuntu) via Tailscale `100.98.183.112` |
| **User** | `ahmad` |
| **Path Server** | `/mnt/storage2/eportfolio/` (partisi yang sama dengan Wedding Tracker) |
| **Port Internal** | `80` (Nginx Alpine) |
| **Port Eksternal (Host)** | `3070` (bebas bentrok dengan Immich 2283/3001 & Wedding Tracker 3050) |
| **Domain Publik** | `https://ppg.ahmadnursyifa.my.id` |
| **Routing / Tunnel** | Cloudflare Zero Trust Hostname → `localhost:3070` |

---

## ⚡ Langkah Cepat (Deployment via PowerShell dari Laptop)

Cukup jalankan script otomatis dari folder proyek di laptop:

```powershell
.\deploy\deploy.ps1
```

Script tersebut akan secara otomatis:
1. Menjalankan `npm run build` lokal untuk memastikan tidak ada kesalahan kompilasi.
2. Mengirim file proyek ke server via `rsync`/`scp` ke `ahmad@100.98.183.112:/mnt/storage2/eportfolio/`.
3. Menjalankan `docker compose up -d --build` di server.

---

## 🛠️ Langkah Manual (Step-by-Step)

### 1. Masuk ke Server via Tailscale SSH
```bash
ssh ahmad@100.98.183.112
```

### 2. Siapkan Folder di `/mnt/storage2`
```bash
sudo mkdir -p /mnt/storage2/eportfolio
sudo chown -R $USER:$USER /mnt/storage2/eportfolio
cd /mnt/storage2/eportfolio
```

### 3. Salin File Proyek dari Laptop
Dari PowerShell laptop di folder `D:\Antigravity Project\Web Portofolio PPG`:
```powershell
scp -r * ahmad@100.98.183.112:/mnt/storage2/eportfolio/
```
*(atau gunakan Git clone jika repo di-push ke GitHub privat).*

### 4. Jalankan Docker Compose di Server
Di terminal SSH server:
```bash
cd /mnt/storage2/eportfolio
docker compose up -d --build
```

Periksa status container:
```bash
docker compose ps
```
Aplikasi akan aktif dan melayani permintaan di `http://localhost:3070`.

---

## 🌐 Menghubungkan Subdomain di Cloudflare Zero Trust

Karena tunnel `syifaserver` sudah aktif di host Anda:

1. Buka [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Masuk ke **Networks** > **Tunnels** > Pilih tunnel Anda (`syifaserver`).
3. Klik **Configure** > Tab **Public Hostnames** > Klik **Add a public hostname**.
4. Masukkan data:
   - **Subdomain**: `ppg`
   - **Domain**: `ahmadnursyifa.my.id`
   - **Type**: `HTTP`
   - **URL**: `localhost:3070`
5. Klik **Save hostname**.

Selesai! Website Anda langsung aktif dengan SSL/HTTPS otomatis di:
👉 **`https://ppg.ahmadnursyifa.my.id`**
