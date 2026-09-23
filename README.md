# Citra NET Manager

Platform operasional ISP untuk pelanggan, perangkat, tagihan, lokasi, WhatsApp, dan pemetaan jaringan.

## Arsitektur

| Komponen | Lokasi | Teknologi |
|---|---|---|
| Web | `apps/web` | Next.js 16, React 19, TypeScript, Tailwind 4, PaceUI |
| API | `apps/api` | Laravel 12, Sanctum, queue, scheduler |
| Pemetaan | `services/earth-engine` | Node.js, Google Earth Engine |
| Database | MySQL | Schema legacy dipertahankan, migration hanya untuk kebutuhan framework dan constraint |

`backend/` dan `frontend/` adalah aplikasi legacy yang tetap tersedia selama masa stabilisasi. Jangan menjalankan scheduler legacy dan Laravel secara bersamaan.

## Prasyarat

- PHP 8.2 dengan PDO MySQL dan PDO SQLite
- Composer 2
- Node.js 20 atau lebih baru
- MySQL 8
- Chromium untuk E2E: `cd apps/web && npx playwright install chromium`

## Pengembangan Lokal

1. Siapkan API:

   ```bash
   cd apps/api
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan serve --host=127.0.0.1 --port=8000
   ```

2. Siapkan web:

   ```bash
   cd apps/web
   npm ci
   cp .env.example .env.local
   npm run dev -- --webpack
   ```

3. Buka `http://localhost:3000`. API diproksikan oleh Next.js sehingga cookie Sanctum tetap same-origin.

4. Jalankan worker dan scheduler Laravel pada terminal terpisah bila menguji antrean:

   ```bash
   php artisan queue:work
   php artisan schedule:work
   ```

## Verifikasi

```bash
cd apps/api
php artisan test
vendor/bin/pint --test
composer validate --strict
composer audit

cd ../web
npm run lint
npx tsc --noEmit
npm run test:e2e
npm audit --audit-level=moderate

cd ../../services/earth-engine
npm test
npm audit --audit-level=moderate
```

E2E menggunakan SQLite terisolasi di `apps/api/storage/framework/testing/e2e.sqlite`. Bootstrap menolak database non-SQLite dan tidak menyentuh MySQL operasional.

## Akses dan Keamanan

- Auth memakai cookie session Laravel Sanctum dan CSRF, bukan token di browser.
- Role `operator` bersifat read-only.
- Role `admin` dapat mengelola operasi.
- Hanya `super_admin` yang dapat mengelola akun administrator.
- Tidak ada registrasi publik.
- Earth Engine hanya boleh bind ke loopback dan wajib memakai `X-Internal-Token`.
- Rahasia Fonnte, Earth Engine, database, dan `APP_KEY` hanya disimpan di environment server.

## Deployment

Ikuti `docs/migration/cutover-runbook.md`. Runbook mencakup backup, pemeriksaan duplikasi tagihan, migration, cache produksi, worker, scheduler, smoke test, dan rollback.
