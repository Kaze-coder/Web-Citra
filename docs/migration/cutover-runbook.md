# Cutover Runbook

Runbook ini memindahkan trafik dari Express/static frontend ke Laravel/Next.js tanpa menjalankan dua billing scheduler secara bersamaan.

## 1. Preflight

1. Catat commit release dan pastikan worktree deployment bersih.
2. Jalankan seluruh verification suite dari root `README.md`.
3. Pastikan environment produksi tersedia dan bukan nilai contoh:
   - Laravel: `APP_KEY`, `APP_URL`, `DB_*`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `FONNTE_TOKEN`, `EARTH_ENGINE_TOKEN`.
   - Next.js: `LARAVEL_API_ORIGIN`.
   - Earth Engine: `INTERNAL_TOKEN`, `GEE_SERVICE_ACCOUNT_KEY`.
4. Pastikan origin HTTPS produksi tercantum tepat di `FRONTEND_URL` dan host-nya di `SANCTUM_STATEFUL_DOMAINS`.
5. Periksa duplikasi sebelum migration:

   ```sql
   SELECT pelanggan_id, bulan_tagihan, COUNT(*) AS jumlah
   FROM tagihan
   GROUP BY pelanggan_id, bulan_tagihan
   HAVING COUNT(*) > 1;
   ```

   Hasil wajib kosong. Jangan menghapus atau menggabungkan tagihan tanpa keputusan pemilik data.

6. Ambil baseline read-only:

   ```sql
   SELECT COUNT(*) FROM admin;
   SELECT COUNT(*) FROM pelanggan;
   SELECT COUNT(*) FROM perangkat;
   SELECT COUNT(*) FROM lokasi;
   SELECT COUNT(*) FROM tagihan;
   SELECT status_pembayaran, COUNT(*), COALESCE(SUM(jumlah_tagihan), 0)
   FROM tagihan GROUP BY status_pembayaran;
   SELECT COUNT(*) FROM perangkat p LEFT JOIN pelanggan c ON c.id = p.pelanggan_id WHERE c.id IS NULL;
   SELECT COUNT(*) FROM lokasi l LEFT JOIN pelanggan c ON c.id = l.pelanggan_id WHERE c.id IS NULL;
   SELECT COUNT(*) FROM tagihan t LEFT JOIN pelanggan c ON c.id = t.pelanggan_id WHERE c.id IS NULL;
   ```

## 2. Backup dan Rehearsal

Backup sebelum migration:

```bash
mysqldump --single-transaction --routines --triggers --hex-blob -u USER -p isp_management > isp_management-pre-cutover.sql
```

Validasi backup dengan mengimpor ke database rehearsal yang terpisah. Arahkan salinan `.env` Laravel ke database rehearsal, lalu jalankan:

```bash
php artisan migrate --force
php artisan migrate:status
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

Ulangi query baseline dan pastikan seluruh hitungan bisnis serta total tagihan tidak berubah. Tabel framework baru boleh bertambah; tabel bisnis tidak boleh kehilangan baris.

## 3. Build Release

```bash
cd apps/api
composer install --no-dev --prefer-dist --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan event:cache

cd ../web
npm ci
npm run build

cd ../../services/earth-engine
npm ci --omit=dev
```

Build Next.js harus dilakukan dengan `LARAVEL_API_ORIGIN` produksi karena rewrite dibentuk saat build.

## 4. Cutover

1. Aktifkan maintenance window dan hentikan write traffic legacy.
2. Hentikan proses Express. Konfirmasi `node-cron` legacy sudah tidak berjalan.
3. Ambil backup final dengan perintah pada bagian 2.
4. Jalankan migration Laravel:

   ```bash
   cd apps/api
   php artisan migrate --force
   php artisan migrate:status
   ```

5. Jalankan API Laravel, worker queue, Next.js, dan Earth Engine melalui process manager pilihan server.
6. Aktifkan tepat satu scheduler:
   - Linux cron: `* * * * * cd /path/apps/api && php artisan schedule:run >> /dev/null 2>&1`
   - Windows Task Scheduler: ulangi setiap 1 menit, program `php`, argumen `artisan schedule:run`, working directory `apps/api`.
7. Arahkan reverse proxy ke Next.js; Laravel dan Earth Engine tetap private.

## 5. Smoke Test

1. `GET /api/v1/health` melalui origin web mengembalikan `200`.
2. Login dan logout berhasil untuk akun aktif.
3. Operator tidak melihat tombol mutasi atau menu administrator.
4. Daftar pelanggan, perangkat, tagihan, dan peta memuat data produksi yang benar.
5. Buat satu pelanggan uji, edit, lalu hapus kembali.
6. Kirim satu reminder WhatsApp ke nomor uji yang disetujui dan periksa `notification_dispatches` serta log worker.
7. Jalankan `php artisan schedule:list`; pastikan hanya Laravel scheduler yang aktif.
8. Ulangi baseline SQL dan bandingkan dengan hasil sebelum cutover.

## 6. Observability

- Pantau `apps/api/storage/logs`, process manager, dan reverse proxy.
- Pantau `jobs`, `failed_jobs`, dan `notification_dispatches`.
- Restart worker setelah deploy: `php artisan queue:restart`.
- Jangan mencetak token Fonnte, service-account JSON, `APP_KEY`, atau internal token ke log.

## 7. Rollback

1. Hentikan Laravel scheduler terlebih dahulu.
2. Hentikan worker Laravel agar tidak ada write tertunda.
3. Alihkan trafik kembali ke aplikasi legacy.
4. Aktifkan scheduler legacy hanya setelah memastikan Laravel scheduler benar-benar berhenti.
5. Restore backup hanya bila release baru melakukan perubahan data yang tidak kompatibel. Jangan restore hanya karena masalah UI atau routing.
6. Earth Engine dapat di-rollback terpisah selama kontrak `/api/v1/earth-engine/*` tidak berubah.

Simpan aplikasi legacy selama periode stabilisasi. Penghapusannya adalah pekerjaan terpisah setelah data, queue, scheduler, dan integrasi eksternal stabil.
