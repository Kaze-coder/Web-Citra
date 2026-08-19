# Citra NET Manager — Sistem Manajemen ISP

Sistem manajemen pelanggan WiFi/ISP berbasis web. Kelola pelanggan, perangkat, tagihan, lokasi, dan reminder WhatsApp otomatis.

---

## Fitur Utama

- Dashboard — statistik real-time, chart pembayaran/paket/revenue
- Manajemen Pelanggan — CRUD + pencarian + auto-geocoding alamat
- Manajemen Perangkat — pelacakan router/modem/mikrotik per pelanggan
- Tagihan Otomatis — billing scheduler harian (node-cron), auto-create + kirim WA
- Integrasi WhatsApp — reminder tagihan via Fonnte API
- Peta Lokasi — visualisasi sebaran pelanggan (Leaflet + ESRI/OSM/Carto)
- Peta Satelit — Google Earth Engine tiles (opsional, butuh service account)
- Export Data — CSV pelanggan/tagihan, import Excel pelanggan
- Login & Auth — JWT Bearer token, role-based (super_admin/admin/operator)
- Desain Responsif — Bootstrap 5.3, mobile-friendly

---

## Teknologi

| Layer | Stack |
|---|---|
| Backend | Node.js + Express 4 |
| Database | **MySQL** (mysql2/promise) — Laragon/phpMyAdmin lokal |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Frontend | HTML5 + Vanilla JS + Bootstrap 5.3 + Leaflet.js + Chart.js |
| Otomasi | node-cron (billing scheduler harian 00:00) |
| Notifikasi | Fonnte API (WhatsApp) |
| Geocoding | Nominatim/OpenStreetMap |
| Opsional | Google Earth Engine (@google/earthengine) |

---

## Struktur Folder

```
website-citra/
├── backend/
│   ├── config/              # Konfigurasi database MySQL (mysql2 pool)
│   ├── controllers/         # Logika bisnis (8 controller)
│   ├── models/              # Data access layer MySQL (*Model.js)
│   ├── routes/              # Endpoint API (10 route files)
│   ├── services/            # WhatsApp, BillingScheduler, Geocoding, EarthEngine
│   └── middleware/          # Auth JWT, validasi input, error handler
├── frontend/
│   ├── assets/              # CSS, JS, logo
│   ├── pages/               # Login, Pelanggan, Perangkat, Tagihan, Peta, Jadwal
│   └── index.html           # Dashboard
├── database/
│   ├── isp_database.sql     # Schema + seed data (5 tabel)
│   └── fix-auth.sql         # Reset password MySQL root (Laragon)
└── README.md
```

---

## Instalasi

### Prasyarat
- Node.js v16+
- MySQL 8.x (Laragon sudah include)
- Browser modern

### Langkah

1. **Clone & install**
   ```bash
   git clone https://github.com/madawwardana-netizen/website-citra.git
   cd website-citra/backend
   npm install
   ```

2. **Import database**
   ```bash
   mysql -u root < ../database/isp_database.sql
   ```
   Ini membuat database `isp_management` dengan 5 tabel + seed data (6 pelanggan, 2 admin).

3. **Konfigurasi environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` — isi `WHATSAPP_API_KEY` (dari Fonnte), `JWT_SECRET` (random string panjang). MySQL default Laragon (root tanpa password) sudah preset.

4. **Jalankan server**
   ```bash
   npm start
   ```
   Server berjalan di `http://localhost:5000`

5. **Login**
   Buka `http://localhost:5000` → redirect ke halaman login.
   - **Admin**: `admin` / `admin123`
   - **Operator**: `operator` / `operator123`

---

## Billing Scheduler

- Cron harian pukul **00:00** — cek pelanggan aktif, buat tagihan jika jatuh tempo, kirim WA.
- Run-on-boot **dimatikan default** (set `BILLING_RUN_ON_BOOT=true` di `.env` jika diinginkan).
- Manual: tombol "Check Billing Sekarang" di halaman Tagihan.

---

## API Endpoints (semua butuh Bearer JWT kecuali login)

| Endpoint | Keterangan |
|---|---|
| `POST /api/admin/login` | Login (public) |
| `POST /api/admin/register` | Register admin (public) |
| `GET /api/pelanggan` | List pelanggan (pagination, search) |
| `GET /api/pelanggan/statistik` | Statistik + totalPemasukan |
| `GET /api/pelanggan/peta/coordinates` | Koordinat untuk peta |
| `GET/POST/PUT/DELETE /api/perangkat` | CRUD perangkat |
| `GET/POST/PUT/DELETE /api/tagihan` | CRUD tagihan |
| `GET /api/tagihan/statistik` | Statistik tagihan |
| `POST /api/whatsapp/send` | Kirim WA manual |
| `GET /api/billing/scheduler/status` | Status scheduler |
| `GET /api/earth-engine/status` | Status GEE (opsional) |

---

## Catatan Keamanan

- Ganti `JWT_SECRET` di `.env` dengan string acak yang panjang.
- Jangan commit file `.env` (sudah di `.gitignore`).
- Ganti password admin default setelah deploy.
- `POST /api/admin/register` sebaiknya dibatasi/dihapus di production.

---

**Versi**: 3.0.0 (MySQL + Auth)
**Status**: Aktif & Operasional
