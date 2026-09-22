# Legacy Contract Baseline

Date: 2026-09-22
Source: Express backend (`backend/`), static HTML frontend (`frontend/`), MySQL schema (`database/isp_database.sql`)

This document is the exhaustive inventory of the current system's behavior, derived from source code reading. It serves as the parity target for the Laravel + Next.js migration.

---

## 1. Authentication and Authorization

### 1.1 Auth Mechanism

- **Type**: Bearer JWT (jsonwebtoken) stored client-side in `localStorage`.
- **Token lifetime**: 1 day (`expiresIn: '1d'`).
- **Token payload**: `{ id, username, role }`.
- **Password hashing**: bcryptjs, 10 salt rounds.
- **Secret**: `process.env.JWT_SECRET`. Server refuses login if secret equals the placeholder `'your_super_secret_jwt_key_here'`.
- **Session**: Stateless JWT; no server-side session store.
- **CSRF**: None (stateless API with CORS).
- **Source**: `backend/middleware/auth.js`, `backend/controllers/AdminController.js`, `backend/models/AdminModel.js`.

### 1.2 Auth Routes (Public, No JWT Required)

| Method | Path | Fields | Response | Source |
|--------|------|--------|----------|--------|
| POST | `/api/admin/login` | `username`, `password` | `{ success, message, token, admin: { id, username, role } }` | `AdminController.login` |
| POST | `/api/admin/register` | `username`, `email`, `password`, `nama_lengkap?`, `role?` | `{ success, message, data: { id, username, email, role } }` | `AdminController.register` |

### 1.3 Login Behavior

1. Missing `username` or `password` -> 400.
2. Unknown username -> 401 (`"Username atau password salah"`).
3. `admin.status !== 'aktif'` -> 403 (`"Akun tidak aktif"`).
4. Wrong password -> 401.
5. Success -> updates `tanggal_login_terakhir`, returns JWT + admin subset.

### 1.4 Register Behavior

1. Missing `username`, `email`, or `password` -> 400.
2. `password.length < 6` -> 400.
3. Duplicate username -> 400. Duplicate email -> 400.
4. Role validated against `['super_admin', 'admin', 'operator']`, defaults to `'operator'`.
5. Creates admin with status `'aktif'`.

### 1.5 Roles

Defined in the `admin.role` ENUM: `super_admin`, `admin`, `operator`.

### 1.6 Authorization Middleware

- `backend/middleware/auth.js` verifies Bearer JWT and attaches `req.admin = { id, username, role }`.
- Applied to all `/api/*` routes **except** `/api/admin/login` and `/api/admin/register`.
- **No role-based authorization checks exist on any protected route.** Every authenticated user can access every endpoint regardless of role.

### 1.7 Observed Bugs / Security Issues (Intentionally Fixed in Migration)

| ID | Issue | Current Behavior | Migration Fix |
|----|-------|------------------|---------------|
| SEC-1 | **Public registration** | Anyone can POST `/api/admin/register` to create any role including `super_admin`. No authentication required. | Remove public registration. Only `super_admin` can create admins. |
| SEC-2 | **No role enforcement** | Auth middleware verifies JWT but never checks `req.admin.role`. All authenticated users can perform all operations. | Laravel policies enforce role-based access on every write and sensitive read. |
| SEC-3 | **No rate limiting** | Login and all other endpoints have no rate limiting. | Rate-limit login and integration-heavy endpoints. |
| SEC-4 | **JWT in localStorage** | Token stored in localStorage, vulnerable to XSS. | Sanctum HttpOnly cookie with CSRF protection. |
| SEC-5 | **Error messages leak internals** | Many error responses include `error: error.message` exposing stack details. | Correlation IDs only; no stack traces in production. |

---

## 2. Database Schema

Source: `database/isp_database.sql`

### 2.1 Tables

#### `pelanggan`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PK AUTO_INCREMENT |
| `nama_pelanggan` | VARCHAR(100) | NOT NULL |
| `no_telepon` | VARCHAR(15) | NOT NULL UNIQUE |
| `email` | VARCHAR(100) | nullable |
| `alamat` | TEXT | NOT NULL |
| `status` | ENUM('aktif','nonaktif','suspend') | DEFAULT 'aktif' |
| `paket_layanan` | VARCHAR(50) | nullable |
| `harga_bulanan` | DECIMAL(10,2) | nullable |
| `tanggal_langganan` | DATE | NOT NULL |
| `tanggal_dibuat` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `tanggal_diperbarui` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

#### `lokasi`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PK AUTO_INCREMENT |
| `pelanggan_id` | INT | NOT NULL UNIQUE, FK -> pelanggan(id) ON DELETE CASCADE |
| `latitude` | DECIMAL(10,8) | NOT NULL |
| `longitude` | DECIMAL(11,8) | NOT NULL |
| `keterangan_lokasi` | VARCHAR(255) | nullable |
| `tanggal_dibuat` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**Constraint**: One location per customer (`pelanggan_id UNIQUE`).

#### `perangkat`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PK AUTO_INCREMENT |
| `pelanggan_id` | INT | NOT NULL, FK -> pelanggan(id) ON DELETE CASCADE |
| `nama_perangkat` | VARCHAR(100) | NOT NULL |
| `tipe_perangkat` | ENUM('router','modem','mikrotik','other') | DEFAULT 'router' |
| `ip_address` | VARCHAR(50) | nullable |
| `mac_address` | VARCHAR(50) | nullable |
| `serial_number` | VARCHAR(100) | nullable |
| `status_perangkat` | ENUM('aktif','mati','error') | DEFAULT 'aktif' |
| `tanggal_instalasi` | DATE | nullable |
| `tanggal_dibuat` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `tanggal_diperbarui` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

**Constraint**: Multiple devices per customer allowed.

#### `tagihan`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PK AUTO_INCREMENT |
| `pelanggan_id` | INT | NOT NULL, FK -> pelanggan(id) ON DELETE CASCADE |
| `bulan_tagihan` | DATE | NOT NULL |
| `jumlah_tagihan` | DECIMAL(10,2) | NOT NULL |
| `status_pembayaran` | ENUM('lunas','belum_lunas','cicilan') | DEFAULT 'belum_lunas' |
| `tanggal_pembayaran` | DATE | nullable |
| `metode_pembayaran` | VARCHAR(50) | nullable |
| `catatan` | TEXT | nullable |
| `tanggal_dibuat` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `tanggal_diperbarui` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

**No unique constraint on (pelanggan_id, bulan_tagihan).** The scheduler uses application-level idempotency (`findForBillingMonth`) but the database does not enforce it.

| ID | Issue | Migration Fix |
|----|-------|---------------|
| DB-1 | **No unique index on (pelanggan_id, bulan_tagihan)** for billing idempotency. | Add database-level uniqueness constraint per the approved spec. |

#### `admin`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INT | PK AUTO_INCREMENT |
| `username` | VARCHAR(50) | NOT NULL UNIQUE |
| `email` | VARCHAR(100) | NOT NULL UNIQUE |
| `password` | VARCHAR(255) | NOT NULL (bcrypt hash) |
| `nama_lengkap` | VARCHAR(100) | nullable |
| `status` | ENUM('aktif','nonaktif') | DEFAULT 'aktif' |
| `role` | ENUM('super_admin','admin','operator') | DEFAULT 'operator' |
| `tanggal_dibuat` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `tanggal_login_terakhir` | TIMESTAMP | nullable |
| `tanggal_diperbarui` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

### 2.2 Indexes

```sql
idx_pelanggan_status      ON pelanggan(status)
idx_pelanggan_no_telepon  ON pelanggan(no_telepon)
idx_perangkat_pelanggan   ON perangkat(pelanggan_id)
idx_tagihan_pelanggan     ON tagihan(pelanggan_id)
idx_tagihan_status        ON tagihan(status_pembayaran)
idx_tagihan_bulan         ON tagihan(bulan_tagihan)
```

### 2.3 Cascade Behavior

All child tables (`lokasi`, `perangkat`, `tagihan`) use `ON DELETE CASCADE` on `pelanggan_id`. Deleting a customer deletes all related locations, devices, and invoices.

### 2.4 Database Connection

MySQL via `mysql2/promise` connection pool. `dateStrings: true` returns DATE/TIMESTAMP as strings. Source: `backend/config/database.js`.

---

## 3. API Routes (Protected, JWT Required)

### 3.1 Pelanggan (Customers)

Source: `backend/routes/pelangganRoutes.js`, `backend/controllers/PelangganController.js`, `backend/models/PelangganModel.js`

| Method | Path | Query/Body | Response Shape | DB Side Effects |
|--------|------|-----------|----------------|-----------------|
| GET | `/api/pelanggan` | `?page=1&limit=10&search=` | `{ success, message, data: [...], pagination: { page, limit, total, pages } }` | None. LEFT JOINs lokasi for lat/lng. Search on `nama_pelanggan`, `no_telepon`, `alamat`. |
| GET | `/api/pelanggan/statistik` | - | `{ success, message, data: { total, aktif, tagihanBelum, totalPemasukan } }` | None. Combines `PelangganModel.getStatistik()` + `TagihanModel.getStatistikTagihan()`. |
| GET | `/api/pelanggan/peta/coordinates` | - | `{ success, message, data: [{ id, nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, latitude, longitude, keterangan_lokasi }] }` | None. Reads all lokasi with joined pelanggan. Filters out entries without `pelanggan_id` or `nama_pelanggan`. On error, returns `{ success: true, data: [] }` (swallows error). |
| GET | `/api/pelanggan/:id` | - | `{ success, message, data: { ...pelanggan, latitude, longitude } }` | None. Fetches pelanggan + lokasi separately, merges lat/lng (defaults to 0 if no lokasi). |
| POST | `/api/pelanggan` | `nama_pelanggan`, `no_telepon`, `alamat`, `email?`, `status?`, `paket_layanan?`, `harga_bulanan?`, `tanggal_langganan?`, `latitude?`, `longitude?` | `{ success, message, data: pelanggan }` | INSERTs pelanggan. If lat/lng provided, INSERTs lokasi. Otherwise auto-geocodes from `alamat` and INSERTs lokasi on success. |
| POST | `/api/pelanggan/geocode/auto-all` | - | `{ success, message, geocoded, failed }` | For each pelanggan without lokasi: geocodes address, upserts lokasi. 1s delay between requests (Nominatim rate limit). |
| POST | `/api/pelanggan/import/excel` | multipart `file` (.xlsx/.xls) | `{ success, message, data: { imported, skipped, errors: [...] } }` | Parses Excel rows. Creates pelanggan + auto-geocodes each. Skips duplicate `no_telepon`. Row-level error reporting. |
| PUT | `/api/pelanggan/:id` | `nama_pelanggan`, `no_telepon`, `alamat`, `email?`, `status?`, `paket_layanan?`, `harga_bulanan?`, `latitude?`, `longitude?` | `{ success, message, data: pelanggan }` | UPDATEs pelanggan fields. If lat/lng provided, upserts lokasi. |
| DELETE | `/api/pelanggan/:id` | - | `{ success, message }` | DELETEs pelanggan. CASCADE deletes lokasi, perangkat, tagihan. |

**Validation** (middleware `validatePelanggan`, applied to POST and PUT):
- `nama_pelanggan` required, non-empty.
- `no_telepon` required, regex `/^(\+62|0)[0-9]{9,12}$/` after stripping `[-\s]`.
- `alamat` required, non-empty.
- `paket_layanan` and `harga_bulanan` are **not validated** by middleware (optional).

**Excel Import Headers** (case-insensitive, special chars stripped):
- Required: `namapelanggan`/`nama`, `notelepon`/`telepon`/`nohp`, `alamat`.
- Optional: `email`, `paketlayanan`/`paket`, `hargabulanan`/`harga`, `tanggallangganan`.
- Uses ExcelJS. Accepts `.xlsx` and `.xls` by MIME or extension.

### 3.2 Perangkat (Devices)

Source: `backend/routes/perangkatRoutes.js`, `backend/controllers/PerangkatController.js`, `backend/models/PerangkatModel.js`

| Method | Path | Query/Body | Response Shape | DB Side Effects |
|--------|------|-----------|----------------|-----------------|
| GET | `/api/perangkat` | `?page=1&limit=10` | `{ success, message, data: [...], pagination }` | None. LEFT JOINs pelanggan for `nama_pelanggan`, `no_telepon`. No search filter. |
| GET | `/api/perangkat/pelanggan/:pelanggan_id` | - | `{ success, message, data: [...] }` | None. |
| GET | `/api/perangkat/:id` | - | `{ success, message, data: { ...perangkat, nama_pelanggan, no_telepon } }` | None. |
| POST | `/api/perangkat` | `pelanggan_id`, `nama_perangkat`, `tipe_perangkat?`, `ip_address?`, `mac_address?`, `serial_number?`, `status_perangkat?`, `tanggal_instalasi?` | `{ success, message, data: perangkat }` | Validates pelanggan exists (404 if not). INSERTs perangkat. |
| PUT | `/api/perangkat/:id` | `nama_perangkat`, `tipe_perangkat?`, `ip_address?`, `mac_address?`, `serial_number?`, `status_perangkat?` | `{ success, message, data: perangkat }` | UPDATEs perangkat. |
| DELETE | `/api/perangkat/:id` | - | `{ success, message }` | DELETEs perangkat. |

**Validation** (middleware `validatePerangkat`, applied to POST only):
- `pelanggan_id` required.
- `nama_perangkat` required, non-empty.
- PUT does **not** use validation middleware.

### 3.3 Tagihan (Invoices)

Source: `backend/routes/tagihanRoutes.js`, `backend/controllers/TagihanController.js`, `backend/models/TagihanModel.js`

| Method | Path | Query/Body | Response Shape | DB Side Effects |
|--------|------|-----------|----------------|-----------------|
| GET | `/api/tagihan` | `?page=1&limit=10&status=` | `{ success, message, data: [...], pagination }` | None. LEFT JOINs pelanggan. Filter by `status_pembayaran`. |
| GET | `/api/tagihan/statistik` | - | `{ success, message, data: { total, lunas, belum_lunas, cicilan, totalPemasukan } }` | None. `totalPemasukan` = SUM of `jumlah_tagihan` where `status = 'lunas'`. |
| GET | `/api/tagihan/belum-bayar` | - | `{ success, message, data: [...] }` | None. All `belum_lunas` tagihan with pelanggan data, ordered by `bulan_tagihan ASC`. |
| GET | `/api/tagihan/:id` | - | `{ success, message, data: tagihan }` | None. |
| GET | `/api/tagihan/pelanggan/:pelanggan_id` | - | `{ success, message, data: [...] }` | None. |
| POST | `/api/tagihan` | `pelanggan_id`, `bulan_tagihan`, `jumlah_tagihan`, `status_pembayaran?`, `tanggal_pembayaran?`, `metode_pembayaran?`, `catatan?` | `{ success, message, data: tagihan }` | Validates pelanggan exists. INSERTs tagihan. |
| PUT | `/api/tagihan/:id` | `bulan_tagihan`, `jumlah_tagihan`, `status_pembayaran`, `tanggal_pembayaran?`, `metode_pembayaran?`, `catatan?` | `{ success, message, data: tagihan }` | UPDATEs tagihan. |
| DELETE | `/api/tagihan/:id` | - | `{ success, message }` | DELETEs tagihan. |

**Validation** (middleware `validateTagihan`, applied to POST only):
- `pelanggan_id` required.
- `bulan_tagihan` required.
- `jumlah_tagihan` required, > 0.
- PUT does **not** use validation middleware.

**Route ordering note**: `/api/tagihan/belum-bayar` and `/api/tagihan/statistik` are defined before `/:id`, so they are not captured by the `:id` param. However, `/api/tagihan/pelanggan/:pelanggan_id` is defined **after** `/:id`. A request to `/api/tagihan/pelanggan/5` would match `/:id` with `id='pelanggan'` first, causing a 404 or error. In practice this likely works because Express still matches the longer literal path `/pelanggan/` before the param `:id` — but this depends on Express internals and is fragile.

| ID | Issue | Migration Fix |
|----|-------|---------------|
| BUG-1 | **Tagihan route `/pelanggan/:pelanggan_id` defined after `/:id`** — ambiguous routing. | Laravel route definitions are explicit; define named routes before wildcard `{id}`. |

### 3.4 Lokasi (Locations)

Source: `backend/routes/lokasiRoutes.js`, `backend/controllers/LokasiController.js`, `backend/models/LokasiModel.js`

| Method | Path | Query/Body | Response Shape | DB Side Effects |
|--------|------|-----------|----------------|-----------------|
| GET | `/api/lokasi` | - | `{ success, message, data: [...] }` | None. All lokasi with joined pelanggan data. No pagination. |
| GET | `/api/lokasi/pelanggan/:pelanggan_id` | - | `{ success, message, data: lokasi_or_null }` | None. |
| POST | `/api/lokasi` | `pelanggan_id`, `latitude`, `longitude`, `keterangan_lokasi?` | `{ success, message, data: lokasi }` | Validates pelanggan exists. INSERTs lokasi. Duplicate `pelanggan_id` -> 400. |
| PUT | `/api/lokasi/:id` | `latitude`, `longitude`, `keterangan_lokasi?` | `{ success, message, data: lokasi }` | UPDATEs lokasi. |
| DELETE | `/api/lokasi/:id` | - | `{ success, message }` | DELETEs lokasi. |

**No validation middleware.** No input validation beyond pelanggan existence check.

### 3.5 WhatsApp

Source: `backend/routes/whatsappRoutes.js`, `backend/controllers/WhatsAppController.js`, `backend/services/WhatsAppService.js`

| Method | Path | Body | Response Shape | Side Effects |
|--------|------|------|----------------|--------------|
| POST | `/api/whatsapp/send` | `phone`, `message` | `{ success, message, data? }` | Sends arbitrary message via Fonnte API. |
| POST | `/api/whatsapp/send-reminder-h3` | - | `{ success, message, data: { sent, failed } }` | Fetches all `belum_lunas` tagihan. For each where `daysUntilDue === 3`, sends reminder via Fonnte. |
| POST | `/api/whatsapp/send-manual` | `pelanggan_id`, `tagihan_id` | `{ success, message, data? }` | Sends manual reminder to specific customer. |
| POST | `/api/whatsapp/send-reminder` | (same as send-manual) | Legacy alias for `send-manual`. | Same. |
| POST | `/api/whatsapp/send-confirmation` | `pelanggan_id` | `{ success, message }` | Sends payment confirmation. Uses `pelanggan.harga_bulanan` as amount (not a specific tagihan). |

**WhatsApp Service details** (`WhatsAppService.js`):
- Fonnte API: POST to `https://api.fonnte.com/send` with `Authorization` header (API key).
- Payload: `{ target, message, countryCode: '62' }`.
- Phone formatting: strips spaces/dashes, converts leading `0` to `62`.
- Methods: `sendMessage`, `sendBillingReminder`, `sendPaymentConfirmation`, `sendSuspensionWarning`.
- **No timeout configuration.** Uses default axios timeout (infinite).
- **No retry logic.** Single attempt per message.
- **No duplicate-send protection.** Same message can be sent multiple times.

| ID | Issue | Migration Fix |
|----|-------|---------------|
| WA-1 | No timeout on Fonnte HTTP calls | Laravel adapter enforces timeouts. |
| WA-2 | No retry or duplicate protection | Queued jobs with bounded retries and dedup. |
| WA-3 | `send-confirmation` uses `harga_bulanan` not actual tagihan amount | Use actual tagihan amount. |

### 3.6 Geocoding

Source: `backend/routes/geocodingRoutes.js`, `backend/controllers/GeocodingController.js`, `backend/services/GeocodingService.js`

| Method | Path | Body | Response Shape |
|--------|------|------|----------------|
| POST | `/api/geocoding/geocode` | `address` | `{ success, message, data: { latitude, longitude, formatted_address, place_id } }` |
| POST | `/api/geocoding/reverse` | `latitude`, `longitude` | `{ success, message, data: { address } }` |

**Geocoding Service details**:
- Uses Nominatim (OpenStreetMap) API. No API key.
- User-Agent: `ISP-Management-System/1.0`.
- Forward geocoding tries up to 12 address variations (full -> kampung+city+province -> city -> province).
- Extracts kampung (`Kp.`, `Desa`, `Kelurahan`), city (kecamatan-first), and province from Indonesian addresses.
- Reverse geocoding: single call to Nominatim reverse endpoint.
- **No application-level rate limiting** (relies on 1s delay only in batch geocode-all).

### 3.7 Billing Scheduler

Source: `backend/routes/billingSchedulerRoutes.js`, `backend/services/BillingScheduler.js`

| Method | Path | Response Shape |
|--------|------|----------------|
| GET | `/api/billing/scheduler/status` | `{ success, message, data: { isRunning, nextRun } }` |
| POST | `/api/billing/scheduler/check-now` | `{ success, message, timestamp }` |

**Scheduler details** (`BillingScheduler.js`):
- Uses `node-cron`. Runs daily at `00:00` (`'0 0 * * *'`).
- **Startup behavior**: Only runs on boot if `BILLING_RUN_ON_BOOT=true` (default OFF).
- **Manual check**: `check-now` fires async without waiting (fire-and-forget to avoid HTTP timeout).
- **Billing logic** (`checkAndCreateBilling`):
  1. Gets all active customers (`status='aktif'`).
  2. For each, finds last tagihan and calculates next billing date (`lastBilling.bulan_tagihan + 1 month`, or `tanggal_langganan + 1 month` if no prior tagihan).
  3. If `nextBillingDate <= today`, checks if tagihan already exists for that month range using `findForBillingMonth(pelanggan_id, monthStart, monthEnd)`.
  4. If not exists, creates tagihan with `jumlah_tagihan = pelanggan.harga_bulanan`, `status = 'belum_lunas'`, then sends WhatsApp notification.
- **Idempotency**: Application-level only (month-range check). No DB unique constraint.
- **No overlap prevention**: If two billing checks run simultaneously, they could create duplicate tagihan (race condition).
- Exported as singleton instance.

### 3.8 Billing Schedule (Delivery Schedules View)

Source: `backend/routes/billingScheduleRoutes.js`, `backend/controllers/BillingScheduleController.js`, `backend/services/BillingScheduleService.js`

| Method | Path | Response Shape |
|--------|------|----------------|
| GET | `/api/billing-schedule` | `{ success, message, data: [...schedules], total }` |
| GET | `/api/billing-schedule/pelanggan/:pelanggan_id` | `{ success, message, data: schedule }` |

**Schedule object shape**:
```json
{
  "id": 1,
  "nama_pelanggan": "...",
  "no_telepon": "...",
  "paket_layanan": "...",
  "harga_bulanan": 500000,
  "tanggal_langganan": "...",
  "tagihan_belum_lunas": 2,
  "next_billing_date": "...",
  "next_billing_formatted": "Rabu, 1 Oktober 2026",
  "days_until_billing": 9,
  "status": "normal|soon|overdue",
  "message_preview": "..."
}
```

- `status`: `"overdue"` if `daysUntilBilling <= 0`, `"soon"` if `<= 3`, else `"normal"`.
- `next_billing_date`: Calculated from `tanggal_langganan` day-of-month applied to current/next month.
- `message_preview`: Pre-rendered WhatsApp message template.

### 3.9 Earth Engine

Source: `backend/routes/earthEngineRoutes.js`, `backend/controllers/EarthEngineController.js`, `backend/services/EarthEngineService.js`

| Method | Path | Response Shape |
|--------|------|----------------|
| GET | `/api/earth-engine/tiles` | `{ success, message, data: [{ name, url, attribution }] }` |
| GET | `/api/earth-engine/status` | `{ success, message, data: { initialized, initializing, cacheSize, cacheEntries } }` |
| POST | `/api/earth-engine/clear-cache` | `{ success, message }` |

**Earth Engine Service details**:
- Uses `@google/earthengine` npm package with service account authentication.
- Service account key from `GEE_SERVICE_ACCOUNT_KEY` env var (default `./config/gee-service-account.json`).
- **Tile layers** (3 datasets):
  1. **Sentinel-2 True Color**: 3-month window, `CLOUDY_PIXEL_PERCENTAGE < 20`, bands B4/B3/B2, median composite.
  2. **Landsat 9 True Color**: 6-month window, `CLOUD_COVER < 20`, surface reflectance scaling, bands SR_B4/SR_B3/SR_B2, median.
  3. **SRTM Elevation**: Static `USGS/SRTMGL1_003`, palette-based visualization.
- **Caching**: In-memory `Map` with 2-hour TTL. `clearCache()` empties it.
- **Initialization**: Non-blocking at server startup. If it fails, tiles endpoint returns 503 with `fallback: true`.
- Tile URLs generated via `ee.Image.getMap()` -> `urlFormat` (XYZ tile pattern).

### 3.10 Root/Utility Endpoints

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api` | Public | `{ message, version: '1.0.0', status: 'running', endpoints: {...} }` |
| ANY | (unmatched) | - | 404 `{ success: false, message: 'Endpoint tidak ditemukan', path }` |

---

## 4. Response Envelope

The current API uses `{ success: boolean, message: string, data?, pagination?, error? }`. There is no `meta` wrapper. The migration spec changes this to `{ data, message, meta }`.

---

## 5. Frontend Pages

Source: `frontend/` directory. All pages are static HTML with vanilla JS.

| File | URL Path | Features | Backend Dependencies |
|------|----------|----------|---------------------|
| `landing.html` | `/landing.html` | Marketing page. Paket pricing, coverage map, about section, contact/WhatsApp CTA. No auth. | None |
| `pages/login.html` | `/pages/login.html` | Login form. Stores JWT in localStorage. | `POST /api/admin/login` |
| `index.html` | `/index.html` | Dashboard. Customer count, active count, unpaid invoices, revenue. Charts (likely Chart.js). Sidebar navigation. | `GET /api/pelanggan/statistik` |
| `pages/pelanggan.html` | `/pages/pelanggan.html` | Customer table with search/pagination. Create/edit/delete modals. Excel import. | Full pelanggan CRUD + import |
| `pages/perangkat.html` | `/pages/perangkat.html` | Device table with pagination. Create/edit/delete. | Full perangkat CRUD |
| `pages/tagihan.html` | `/pages/tagihan.html` | Invoice table with status filter. Create/edit/delete. Payment updates. WhatsApp reminders. | Full tagihan CRUD + WhatsApp |
| `pages/peta.html` | `/pages/peta.html` | Leaflet map. Customer markers. Google Maps links. KML download. Earth Engine overlay layers. Sidebar with customer list. | `GET /api/pelanggan/peta/coordinates`, Earth Engine tiles |
| `pages/jadwal-pengiriman.html` | `/pages/jadwal-pengiriman.html` | Billing schedule timeline. Days-until-billing. Message preview. Manual trigger. | `GET /api/billing-schedule`, `POST /api/billing/scheduler/check-now`, `GET /api/billing/scheduler/status` |

**JS files** (in `frontend/assets/js/`): `main.js` (shared auth check, sidebar, theme), `dashboard.js`, `pelanggan.js`, `perangkat.js`, `tagihan.js`, `peta.js`, `jadwal-pengiriman.js`, `login.js`, `landing.js`.

**CSS**: `style.css` (app), `landing.css` (marketing page).

**Libraries** (loaded via CDN): Bootstrap 5.3, Leaflet 1.9.4, Font Awesome 6.4, Material Icons, Notyf 3, Space Grotesk + IBM Plex Sans + IBM Plex Mono fonts.

**No admin management page exists in the current frontend.** The `/api/admin/register` endpoint is available but there is no UI for managing administrators.

---

## 6. Scheduler Rules

| Rule | Current Behavior | Source |
|------|-----------------|--------|
| Schedule | Daily at midnight (`0 0 * * *`) via `node-cron` | `BillingScheduler.start()` |
| Startup | Runs on boot only if `BILLING_RUN_ON_BOOT=true` | `BillingScheduler.start()` |
| Target | All customers with `status='aktif'` | `PelangganModel.getPelangganAktif()` |
| Next date calc | `lastBilling.bulan_tagihan + 1 month` or `tanggal_langganan + 1 month` | `calculateNextBillingDate()` |
| Idempotency | Application: `findForBillingMonth(id, monthStart, monthEnd)` | `checkAndCreateBilling()` |
| Invoice amount | `pelanggan.harga_bulanan` | `checkAndCreateBilling()` |
| Notification | WhatsApp via Fonnte immediately after invoice creation | `sendBillingNotification()` |
| Error handling | Per-customer try/catch; logs error, increments `failed` counter, continues | `checkAndCreateBilling()` |
| Overlap prevention | None | - |

---

## 7. External Integration Behavior

### 7.1 Fonnte (WhatsApp)

- **API**: `POST https://api.fonnte.com/send`
- **Auth**: `Authorization` header with API key from `WHATSAPP_API_KEY` env.
- **Payload**: `{ target, message, countryCode: '62' }`.
- **Phone formatting**: Leading `0` -> `62`, strip spaces/dashes.
- **No timeout, no retries, no dedup.**

### 7.2 Nominatim (Geocoding)

- **Forward**: `GET https://nominatim.openstreetmap.org/search?q=...&format=json&limit=1&language=id`
- **Reverse**: `GET https://nominatim.openstreetmap.org/reverse?lat=...&lon=...&format=json&language=id`
- **User-Agent**: `ISP-Management-System/1.0`
- **Rate limiting**: Only in batch geocode-all (1s `setTimeout` between requests). Individual calls have no rate limit.
- **No timeout configuration.**

### 7.3 Google Earth Engine

- **SDK**: `@google/earthengine` npm package (runs inside Express process).
- **Auth**: Service account private key JSON file.
- **Datasets**: Sentinel-2 SR Harmonized, Landsat 9 L2, SRTM.
- **Caching**: In-memory Map, 2-hour TTL.
- **Initialization**: Async at server startup, non-blocking.

---

## 8. CORS Configuration

Source: `backend/server.js`

- Origins from `FRONTEND_ORIGIN` env (comma-separated), defaults to `http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000`.
- Requests without `Origin` header are allowed (same-origin, curl).
- Non-matching origins are silently rejected (`callback(null, false)`).

---

## 9. Error Handling

Source: `backend/middleware/errorHandler.js`

- Validation errors (statusCode 400 or message includes 'validation') -> 400.
- Database errors (code starting with `ER_` or `PROTOCOL`) -> 500 with generic message.
- All others -> status from error or 500.
- Most controllers have their own try/catch that returns `{ success: false, message, error: error.message }` before reaching the global handler.

---

## 10. Route Prefix Summary

| Prefix | Auth | Source File |
|--------|------|-------------|
| `/api/admin` | Public | `adminRoutes.js` |
| `/api/pelanggan` | JWT | `pelangganRoutes.js` |
| `/api/perangkat` | JWT | `perangkatRoutes.js` |
| `/api/tagihan` | JWT | `tagihanRoutes.js` |
| `/api/lokasi` | JWT | `lokasiRoutes.js` |
| `/api/whatsapp` | JWT | `whatsappRoutes.js` |
| `/api/geocoding` | JWT | `geocodingRoutes.js` |
| `/api/billing` | JWT | `billingSchedulerRoutes.js` |
| `/api/billing-schedule` | JWT | `billingScheduleRoutes.js` |
| `/api/earth-engine` | JWT | `earthEngineRoutes.js` |

**Total distinct API endpoints: 37** (2 public auth + 1 root + 34 protected).
