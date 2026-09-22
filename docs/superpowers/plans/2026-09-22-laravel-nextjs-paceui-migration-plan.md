# Laravel + Next.js + PaceUI Migration Plan

Date: 2026-09-22
Status: Active
Approved spec: `docs/superpowers/specs/2026-09-22-laravel-nextjs-paceui-migration-design.md`
Legacy baseline: `docs/migration/legacy-contract-baseline.md`

---

## Prerequisites

| Item | Required | Status |
|------|----------|--------|
| PHP | 8.2.x | 8.2.12 installed |
| Composer | 2.x | Required |
| Laravel | 12.x | Matches PHP 8.2 (spec corrected from 13) |
| Node.js | 20+ LTS | Required for Next.js and Earth Engine service |
| MySQL | 5.7+ / 8.x | Existing Laragon MySQL |
| npm/pnpm | Latest | Required |

---

## Phase 0: Foundation (Days 1-2)

### 0.1 Create Laravel Application

**Owner**: `apps/api/`
**Dependency**: None

```bash
composer create-project laravel/laravel apps/api
```

- Configure `.env` to point to existing `isp_management` database.
- Verify `php artisan migrate:status` shows no pending migrations.
- Set `APP_KEY`, database credentials, `APP_URL=http://localhost:8000`.

**Validation**:
```bash
cd apps/api && php artisan about
# Expect: Laravel 12.x, PHP 8.2.12, MySQL connected
```

### 0.2 Create Next.js Application

**Owner**: `apps/web/`
**Dependency**: None

```bash
npx create-next-app@latest apps/web --typescript --tailwind --app --src-dir
```

- Install shadcn/ui: `npx shadcn@latest init`
- Install PaceUI registry item via shadcn CLI.
- Remove demo routes and placeholder content.
- Install Lucide React as the single icon system.
- Install Recharts for dashboard charts.

**Validation**:
```bash
cd apps/web && npm run build
# Expect: Build succeeds with no errors
```

### 0.3 Configure Next.js API Proxy

**Owner**: `apps/web/next.config.ts`
**Dependency**: 0.1

Add `rewrites()` to proxy `/api/*` to the Laravel backend at `http://localhost:8000`.

**Validation**: `curl http://localhost:3000/api/v1/health` returns Laravel response.

---

## Phase 1: Laravel Auth + Models (Days 3-5)

### 1.1 Eloquent Models

**Owner**: `apps/api/app/Models/`
**Dependency**: 0.1

Create models for existing tables with explicit `$table` and `$primaryKey` where Laravel conventions differ:

| Model | Table | Key Notes |
|-------|-------|-----------|
| `Admin` | `admin` | `$table = 'admin'`, timestamps: `tanggal_dibuat`/`tanggal_diperbarui` |
| `Pelanggan` | `pelanggan` | Relationships: hasOne Lokasi, hasMany Perangkat, hasMany Tagihan |
| `Lokasi` | `lokasi` | belongsTo Pelanggan. `pelanggan_id` UNIQUE. |
| `Perangkat` | `perangkat` | belongsTo Pelanggan |
| `Tagihan` | `tagihan` | belongsTo Pelanggan |

- Set `const CREATED_AT = 'tanggal_dibuat'` and `const UPDATED_AT = 'tanggal_diperbarui'` on all models.
- Define `$casts` for DECIMAL fields, ENUM fields, and DATE fields.
- Do **not** run `php artisan migrate` against the production schema. Use `--pretend` or a copy.

**Validation**:
```bash
php artisan tinker --execute "App\Models\Pelanggan::count()"
# Expect: Returns existing row count
```

### 1.2 Laravel Sanctum Setup

**Owner**: `apps/api/config/sanctum.php`, `apps/api/config/cors.php`
**Dependency**: 1.1

- Install Sanctum (bundled with Laravel 12).
- Configure stateful SPA authentication via `SANCTUM_STATEFUL_DOMAINS`.
- Set session driver to `database` (create `sessions` table migration).
- Configure `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS` for the Next.js origin.
- Enable CSRF protection via `EnsureFrontendRequestsAreStateful`.
- Set cookie to `HttpOnly`, `Secure` in production, `SameSite=Lax`.

**Validation**:
```bash
php artisan test --filter=AuthTest
# Expect: Login/logout/CSRF tests pass
```

### 1.3 Auth Controllers + Routes

**Owner**: `apps/api/app/Http/Controllers/Auth/`, `apps/api/routes/api.php`
**Dependency**: 1.2

Endpoints under `/api/v1/auth/`:

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/sanctum/csrf-cookie` | CSRF cookie (framework-provided) |
| POST | `/api/v1/auth/login` | Username + password. Check status. Update `tanggal_login_terakhir`. Return user. |
| POST | `/api/v1/auth/logout` | Invalidate session. |
| GET | `/api/v1/auth/user` | Return authenticated admin with role. |

- Bcrypt compatibility verified (existing hashes work with `Hash::check`).
- Remove public registration. Admin creation is a separate super_admin-only endpoint (Phase 3).
- Rate-limit login: `throttle:5,1` (5 attempts per minute).

**Validation**:
```bash
# Feature test: login with existing admin credentials
# Feature test: login with wrong password -> 401
# Feature test: login with inactive account -> 403
# Feature test: unauthenticated request -> 401
```

### 1.4 Authorization Policies

**Owner**: `apps/api/app/Policies/`
**Dependency**: 1.3

| Policy | Rules |
|--------|-------|
| `AdminPolicy` | Only `super_admin` can create/update/delete admins |
| `PelangganPolicy` | All authenticated users can read. `admin`/`super_admin` can write. |
| `PerangkatPolicy` | Same as Pelanggan |
| `TagihanPolicy` | Same as Pelanggan |
| `LokasiPolicy` | Same as Pelanggan |
| `BillingPolicy` | Only `admin`/`super_admin` can trigger manual billing |
| `WhatsAppPolicy` | Only `admin`/`super_admin` can send messages |

Register policies in `AuthServiceProvider`.

**Validation**:
```bash
php artisan test --filter=PolicyTest
# Expect: Operator cannot create pelanggan, super_admin can create admin, etc.
```

---

## Phase 2: Domain API Modules (Days 6-12)

### 2.1 Pelanggan Module

**Owner**: `apps/api/app/Http/Controllers/Api/V1/PelangganController.php`
**Dependency**: 1.4

Implement all endpoints from the legacy baseline (Section 3.1):
- `GET /api/v1/pelanggan` — paginated, searchable, with lokasi join.
- `POST /api/v1/pelanggan` — validation via FormRequest, auto-geocode.
- `GET /api/v1/pelanggan/{id}` — with lokasi merge.
- `PATCH /api/v1/pelanggan/{id}` — partial update (PATCH not PUT per spec).
- `DELETE /api/v1/pelanggan/{id}` — cascade handled by DB.
- `GET /api/v1/pelanggan/statistik` — combined pelanggan + tagihan stats.
- `GET /api/v1/pelanggan/peta/coordinates` — map data.
- `POST /api/v1/pelanggan/geocode/auto-all` — batch geocode.
- `POST /api/v1/pelanggan/import/excel` — Excel import via Laravel Excel or PhpSpreadsheet.

FormRequest validation rules (match legacy + strengthen):
- `nama_pelanggan`: required, string, max:100.
- `no_telepon`: required, regex matching Indonesian format, unique:pelanggan.
- `email`: nullable, email, max:100.
- `alamat`: required, string.
- `status`: nullable, in:aktif,nonaktif,suspend.
- `paket_layanan`: nullable, string, max:50.
- `harga_bulanan`: nullable, numeric, min:0.
- `tanggal_langganan`: nullable, date.

**Validation**:
```bash
php artisan test --filter=PelangganTest
# Cover: list, search, create, update, delete, statistik, coordinates, import, geocode-all
# Parity: compare response shapes with legacy baseline
```

### 2.2 Perangkat Module

**Owner**: `apps/api/app/Http/Controllers/Api/V1/PerangkatController.php`
**Dependency**: 1.4

Endpoints: CRUD + by-pelanggan lookup. Match legacy Section 3.2.

**Validation**: Feature tests covering CRUD, pelanggan validation, pagination.

### 2.3 Tagihan Module

**Owner**: `apps/api/app/Http/Controllers/Api/V1/TagihanController.php`
**Dependency**: 1.4

Endpoints: CRUD + statistik + belum-bayar + by-pelanggan. Match legacy Section 3.3.

**Migration**: Add unique index on `(pelanggan_id, bulan_tagihan)` — see DB-1 in baseline.

```php
Schema::table('tagihan', function (Blueprint $table) {
    $table->unique(['pelanggan_id', 'bulan_tagihan'], 'uq_tagihan_pelanggan_bulan');
});
```

**Validation**: Feature tests. Verify idempotency with unique constraint.

### 2.4 Lokasi Module

**Owner**: `apps/api/app/Http/Controllers/Api/V1/LokasiController.php`
**Dependency**: 1.4

Endpoints: CRUD + by-pelanggan. Match legacy Section 3.4.

**Validation**: Feature tests.

### 2.5 Geocoding Adapter

**Owner**: `apps/api/app/Services/GeocodingService.php`
**Dependency**: 1.1

- Port the multi-variation forward geocoding logic from `backend/services/GeocodingService.js`.
- Use Laravel's HTTP client with timeout (10s), `User-Agent: Citra-NET/2.0`.
- Respect Nominatim rate limits (application-level throttle: 1 req/s).
- Reverse geocoding.
- Automated tests use Http::fake(), never call Nominatim.

Endpoints:
- `POST /api/v1/geocoding/geocode`
- `POST /api/v1/geocoding/reverse`

**Validation**: Feature tests with faked HTTP responses.

### 2.6 WhatsApp Module

**Owner**: `apps/api/app/Services/WhatsAppService.php`, `apps/api/app/Jobs/`
**Dependency**: 1.4

- Port Fonnte integration with Laravel's HTTP client.
- **Queued jobs**: `SendBillingReminder`, `SendPaymentConfirmation`, `SendSuspensionWarning`, `SendManualMessage`.
- **Timeouts**: 30s per request.
- **Retry**: 3 attempts with exponential backoff.
- **Duplicate protection**: Check `failed_jobs` + a sent-message log (or cache key) before sending.
- Phone formatting logic ported from legacy.

Endpoints:
- `POST /api/v1/whatsapp/send` — general message (queued).
- `POST /api/v1/whatsapp/reminders` — trigger H-3 reminders (queued).
- `POST /api/v1/whatsapp/send-manual` — manual reminder (queued).
- `POST /api/v1/whatsapp/send-confirmation` — payment confirmation (queued).

**Validation**: Feature tests with Http::fake(). Verify job dispatch. Verify dedup.

### 2.7 Billing Module

**Owner**: `apps/api/app/Services/BillingService.php`, `apps/api/app/Console/Commands/`
**Dependency**: 2.3, 2.6

- Port billing logic from `BillingScheduler.js` and `BillingScheduleService.js`.
- **Laravel Scheduler**: `Schedule::command('billing:run')->dailyAt('00:00')->withoutOverlapping()`.
- **Manual trigger**: `POST /api/v1/billing/run` dispatches the command.
- **Idempotency**: DB unique constraint (Phase 2.3) + application check.
- **Schedule view**: `GET /api/v1/billing/schedules` returns the same shape as legacy (next_billing_date, days_until_billing, status, message_preview).
- `GET /api/v1/billing/schedules/{pelanggan_id}` for per-customer view.
- `GET /api/v1/billing/scheduler/status` for scheduler state.

**Validation**:
```bash
php artisan test --filter=BillingTest
# Cover: idempotency, schedule calculation, overlap prevention, WhatsApp dispatch
```

---

## Phase 3: Admin Management + Earth Engine (Days 13-15)

### 3.1 Admin CRUD (Super Admin Only)

**Owner**: `apps/api/app/Http/Controllers/Api/V1/AdminController.php`
**Dependency**: 1.4

New endpoints (no legacy equivalent — the current system has only public register):
- `GET /api/v1/admin` — list admins (super_admin only).
- `POST /api/v1/admin` — create admin (super_admin only).
- `PATCH /api/v1/admin/{id}` — update admin (super_admin only).
- `DELETE /api/v1/admin/{id}` — deactivate admin (super_admin only).

**Validation**: Feature tests enforcing policy.

### 3.2 Earth Engine Service

**Owner**: `services/earth-engine/`
**Dependency**: None (parallel)

- Extract the Earth Engine logic into a standalone Node.js service.
- Express or Fastify server with minimal private endpoints:
  - `GET /tiles` — returns tile layer URLs.
  - `GET /status` — initialization and cache status.
  - `POST /clear-cache` — clears tile cache.
- Service account authentication (same key file).
- Private: only callable from Laravel (service-to-service auth via shared secret or network isolation).
- Port the 3 datasets: Sentinel-2, Landsat 9, SRTM.
- Port the 2-hour caching logic.

### 3.3 Earth Engine Laravel Adapter

**Owner**: `apps/api/app/Services/EarthEngineService.php`
**Dependency**: 3.2

- Laravel HTTP client calls the private Earth Engine service.
- Translates errors into the API contract (502 for service unavailable).
- Endpoints:
  - `GET /api/v1/earth-engine/tiles`
  - `GET /api/v1/earth-engine/status`
  - `POST /api/v1/earth-engine/clear-cache`

**Validation**: Feature tests with Http::fake() mocking the Earth Engine service.

---

## Phase 4: Next.js Application (Days 16-25)

### 4.1 Layout + Auth

**Owner**: `apps/web/src/app/`
**Dependency**: 1.3

- Configure route groups: `(public)`, `(auth)`, `(dashboard)`.
- Implement Sanctum CSRF flow: `GET /sanctum/csrf-cookie` -> `POST /api/v1/auth/login`.
- Auth context/provider storing user state.
- Middleware checking auth state on `(dashboard)` routes.
- Login page at `/login`.
- Sidebar, header from PaceUI. Citra NET branding.
- Light/dark theme support.

**Validation**: `npm run build` succeeds. Login flow works in browser.

### 4.2 Dashboard Page

**Owner**: `apps/web/src/app/(dashboard)/dashboard/`
**Dependency**: 2.1, 2.3

- `/dashboard`: Stats cards (total customers, active, unpaid invoices, revenue).
- Recharts for trend charts.
- Recent activity summary.

### 4.3 Pelanggan Pages

**Owner**: `apps/web/src/app/(dashboard)/pelanggan/`
**Dependency**: 2.1

- Searchable, filterable table with pagination.
- Customer detail view with lokasi, devices, billing history.
- Create/edit via dialog/drawer.
- Delete with confirmation.
- Excel import dialog.

### 4.4 Perangkat Page

**Owner**: `apps/web/src/app/(dashboard)/perangkat/`
**Dependency**: 2.2

- Device inventory table with pagination.
- Create/edit/delete.

### 4.5 Tagihan Page

**Owner**: `apps/web/src/app/(dashboard)/tagihan/`
**Dependency**: 2.3, 2.6

- Invoice table with period and status filters.
- Payment updates.
- WhatsApp reminder/confirmation buttons.

### 4.6 Peta (Map) Page

**Owner**: `apps/web/src/app/(dashboard)/peta/`
**Dependency**: 2.4, 3.3

- Leaflet map with customer markers.
- Customer detail popups.
- Google Maps links.
- KML download.
- Earth Engine layer toggles (Sentinel-2, Landsat 9, SRTM).
- Graceful fallback when Earth Engine is unavailable.

### 4.7 Jadwal Pengiriman Page

**Owner**: `apps/web/src/app/(dashboard)/jadwal-pengiriman/`
**Dependency**: 2.7

- Reminder timeline.
- Queue state display.
- Message preview.
- Manual trigger button.
- Scheduler status indicator.

### 4.8 Admin Management Page

**Owner**: `apps/web/src/app/(dashboard)/admin/`
**Dependency**: 3.1

- Admin list (super_admin only).
- Create/edit/deactivate admins.
- Role assignment.
- Visible only to super_admin in navigation.

### 4.9 Landing Page

**Owner**: `apps/web/src/app/(public)/page.tsx`
**Dependency**: None

- Port `frontend/landing.html` to Next.js.
- Citra NET marketing content.
- Pricing plans, coverage, about, contact.
- No dashboard chrome.

### 4.10 Error + Loading States

**Owner**: `apps/web/src/app/`
**Dependency**: 4.1

- Skeleton loading for all data pages.
- Empty states.
- Error boundaries with recovery actions.
- 404 page.
- Unauthorized (403) redirect.
- Mobile sidebar as sheet.

**Validation**:
```bash
cd apps/web && npm run build
# Expect: All pages build successfully
```

---

## Phase 5: Integration Testing + Parity Verification (Days 26-30)

### 5.1 API Parity Tests

**Owner**: Test files
**Dependency**: Phase 2 complete

- Run equivalent read/write scenarios against legacy Express and new Laravel.
- Compare: HTTP status, response field names, pagination shape, validation outcomes, database effects.
- Use a fixed seed dataset (from `database/isp_database.sql`).

### 5.2 Playwright Browser Tests

**Owner**: `apps/web/e2e/`
**Dependency**: Phase 4 complete

Core journeys:
1. Login / logout.
2. Role-appropriate navigation (operator vs admin vs super_admin).
3. Customer create / edit / delete.
4. Device and invoice operations.
5. WhatsApp reminder submission.
6. Map customer selection and layer toggle.
7. Admin management (super_admin).
8. Mobile navigation.

### 5.3 Data Verification

Compare row counts, relationships, nullability, unique values, and financial totals before and after any migration.

**Validation**:
```bash
php artisan test
npx playwright test
```

---

## Phase 6: Cutover (Day 31-32)

### 6.1 Pre-Cutover Checklist

- [ ] All Laravel feature tests pass.
- [ ] All Playwright journeys pass.
- [ ] API parity confirmed for all endpoints.
- [ ] Rehearsal cutover on a database copy succeeds.
- [ ] Production builds succeed: `php artisan config:cache`, `npm run build`.
- [ ] Environment variables configured for production.
- [ ] Backup of live database taken.

### 6.2 Cutover Sequence

1. **Backup** the live MySQL database.
2. **Disable** the Express `node-cron` scheduler (stop Express process or set `BILLING_RUN_ON_BOOT=false` and stop).
3. **Run** the Laravel tagihan unique constraint migration: `php artisan migrate`.
4. **Deploy** Laravel API, Next.js, and Earth Engine service.
5. **Enable** Laravel Scheduler (`crontab -e` or Windows Task Scheduler: `php artisan schedule:run`).
6. **Run smoke tests** against the new deployment.
7. **Verify** only one billing scheduler is active.

### 6.3 Post-Cutover Verification

- Login/logout works.
- Customer list loads with correct data.
- Creating a customer succeeds.
- Map loads with markers.
- Billing scheduler status shows running.
- WhatsApp test message sends successfully.

### 6.4 Rollback Plan

If cutover verification fails:
1. Stop Laravel Scheduler.
2. Route users back to the Express application.
3. Restore pre-cutover database backup **only if** the failed release changed data incompatibly.
4. Do **not** restart the Express scheduler until confirming the Laravel scheduler is fully stopped.
5. Earth Engine service can be rolled back independently.

---

## Phase 7: Stabilization (Days 33-40)

- Keep `backend/` and `frontend/` directories as reference.
- Monitor `failed_jobs` table for queue issues.
- Monitor error logs for integration failures.
- Address any parity gaps found in production.
- After stabilization period, remove legacy directories in a separate cleanup PR.

---

## Dependency Graph

```
Phase 0 (Foundation)
  ├── 0.1 Laravel App
  │     └── 0.3 API Proxy config
  └── 0.2 Next.js App

Phase 1 (Auth + Models) ← 0.1
  ├── 1.1 Eloquent Models
  ├── 1.2 Sanctum Setup ← 1.1
  ├── 1.3 Auth Controllers ← 1.2
  └── 1.4 Policies ← 1.3

Phase 2 (Domain Modules) ← 1.4
  ├── 2.1 Pelanggan
  ├── 2.2 Perangkat
  ├── 2.3 Tagihan (+ DB migration)
  ├── 2.4 Lokasi
  ├── 2.5 Geocoding Adapter
  ├── 2.6 WhatsApp Module
  └── 2.7 Billing Module ← 2.3, 2.6

Phase 3 (Admin + Earth Engine) ← 1.4
  ├── 3.1 Admin CRUD
  ├── 3.2 Earth Engine Service (parallel)
  └── 3.3 Earth Engine Adapter ← 3.2

Phase 4 (Next.js Pages) ← Phase 1-3
  ├── 4.1 Layout + Auth ← 1.3
  ├── 4.2-4.9 Pages ← respective API modules
  └── 4.10 Error States

Phase 5 (Testing) ← Phase 2, 4
Phase 6 (Cutover) ← Phase 5
Phase 7 (Stabilization) ← Phase 6
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing bcrypt hashes incompatible with Laravel | Auth broken | Verify in Phase 1.2: Laravel's `Hash::check` uses `password_verify()` which handles `$2a$` hashes. Test with actual DB records. |
| Billing unique constraint migration fails on existing duplicates | Migration blocked | Run `SELECT pelanggan_id, bulan_tagihan, COUNT(*) FROM tagihan GROUP BY pelanggan_id, bulan_tagihan HAVING COUNT(*) > 1` before migrating. Resolve duplicates manually. |
| Earth Engine service isolation breaks tile generation | Map degraded | Earth Engine service can be developed and tested independently (Phase 3.2). Fallback to OSM-only already exists in frontend. |
| Nominatim geocoding behavior differs between axios and Laravel HTTP client | Geocoding results differ | Use identical query params, User-Agent, and address variation logic. Feature tests with recorded responses. |
| Scheduler overlap during cutover | Duplicate invoices | Explicit cutover sequence: stop Express first, then start Laravel. Never run both. |
| `tanggal_dibuat`/`tanggal_diperbarui` timestamp conventions | Eloquent inserts wrong columns | Override `CREATED_AT`/`UPDATED_AT` constants on every model. Verify in Phase 1.1. |
| PHP 8.2 used instead of 8.3 | Laravel 13 incompatible | Corrected: use Laravel 12 which supports PHP 8.2. |
