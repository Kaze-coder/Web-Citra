# Citra NET Laravel API

Laravel 12 API untuk Citra NET Manager. Kontrak publik berada di `/api/v1`; autentikasi SPA menggunakan Laravel Sanctum.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Gunakan schema MySQL Citra NET yang sudah ada. Migration menambahkan tabel framework, dispatch notifikasi, dan unique constraint tagihan. Migration unique constraint berhenti aman jika menemukan data duplikat.

## Proses Produksi

```bash
php artisan queue:work --sleep=3 --tries=3 --max-time=3600
php artisan schedule:run
```

Jalankan `schedule:run` setiap menit melalui cron atau Windows Task Scheduler. Hanya satu scheduler billing boleh aktif.

## Verifikasi

```bash
php artisan test
vendor/bin/pint --test
composer validate --strict
composer audit
php artisan route:list --path=api/v1
php artisan schedule:list
```

Test memakai SQLite in-memory. E2E browser memakai SQLite file terisolasi yang dibangun oleh `tests/E2E/bootstrap.php`.
