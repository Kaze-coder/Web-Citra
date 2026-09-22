# Citra NET Laravel, Next.js, and PaceUI Migration Design

Date: 2026-09-22
Status: Approved design

## Objective

Replace the Express backend and static HTML frontend with a Laravel API and a Next.js application based on the PaceUI dashboard template. Preserve the existing MySQL data, business behavior, and external integrations while improving authentication, test coverage, consistency, and responsive UI.

## Confirmed Decisions

- Use Laravel 13 for the API and business logic.
- Use Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, and PaceUI for every page.
- Migrate the landing page, login, dashboard, customers, devices, billing, map, delivery schedules, and admin management.
- Build the replacement beside the current application, verify parity, then cut over.
- Existing API URLs do not require backward compatibility because there are no external consumers.
- Preserve Google Earth Engine through an isolated Node.js service because there is no equivalent official PHP SDK.
- Keep the existing MySQL database and data.

## Scope

### Included

- Authentication, sessions, roles, and admin management.
- Customer, device, invoice, and location CRUD.
- Dashboard statistics and charts.
- Excel customer import.
- Billing schedules and automatic monthly invoice creation.
- Fonnte WhatsApp reminders and payment confirmations.
- Nominatim forward and reverse geocoding.
- Leaflet maps, Google Maps links, KML downloads, and Earth Engine layers.
- Responsive light and dark interfaces based on PaceUI.
- Automated API and browser-level verification.

### Excluded

- Changes to the ISP's pricing or billing rules.
- A public API for third-party clients.
- Replacement of MySQL, Fonnte, Nominatim, or Google Earth Engine.
- Running the old and new schedulers simultaneously.

## Repository Layout

The replacement is added without overwriting the current application:

```text
apps/
  api/                  Laravel application
  web/                  Next.js application
services/
  earth-engine/         Private Node.js Earth Engine service
backend/                Existing Express reference during migration
frontend/               Existing static frontend reference during migration
database/
  isp_database.sql
```

The legacy `backend/` and `frontend/` directories remain available until parity verification and cutover are complete. They may be removed in a separate cleanup after the stabilization period.

## Runtime Architecture

```text
Browser
  -> Next.js and PaceUI
  -> same-origin /api proxy
  -> Laravel API
       -> MySQL
       -> Fonnte
       -> Nominatim
       -> private Earth Engine service
```

Next.js owns rendering and browser interaction. Laravel owns validation, authorization, business rules, persistence, queues, and integration orchestration. The Earth Engine service is private and can only be called by Laravel.

Next.js route protection improves navigation and user experience but is not an authorization boundary. Laravel authenticates and authorizes every protected request.

## Authentication and Authorization

- Use Laravel Sanctum stateful SPA authentication through same-origin `/api` requests.
- Store the session in an `HttpOnly` cookie, enable `Secure` in production, and enforce CSRF protection.
- Preserve the existing `super_admin`, `admin`, and `operator` roles.
- Keep compatibility with existing bcrypt password hashes.
- Remove public administrator registration.
- Allow only `super_admin` users to create and manage administrators.
- Apply Laravel policies to all write operations and sensitive reads.
- Rate-limit login and integration-heavy endpoints.

## Laravel Modules

### Auth

Provides login, logout, current-user lookup, session lifecycle, and role checks.

### Pelanggan

Provides CRUD, search, pagination, statistics, coordinates, automatic geocoding, and Excel import.

### Perangkat

Provides CRUD, status management, and customer relationships.

### Tagihan

Provides CRUD, status and period filters, payment statistics, outstanding invoices, and customer billing history.

### Billing

Calculates schedules, creates monthly invoices, exposes a manual check, and dispatches reminder jobs. Invoice creation must be idempotent for each customer and billing month.

### WhatsApp

Queues Fonnte reminders, manual messages, payment confirmations, and suspension warnings. Jobs have bounded retries and duplicate-send protection.

### Lokasi

Stores customer coordinates and supports geocoding, reverse geocoding, map data, and KML generation.

### Earth Engine

Validates layer requests, calls the private Node.js service, returns tile metadata, reports service status, and controls cache invalidation.

## API Contract

Use versioned REST endpoints under `/api/v1`.

Representative endpoints:

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/user

GET    /api/v1/pelanggan
POST   /api/v1/pelanggan
GET    /api/v1/pelanggan/{id}
PATCH  /api/v1/pelanggan/{id}
DELETE /api/v1/pelanggan/{id}

GET    /api/v1/perangkat
GET    /api/v1/tagihan
GET    /api/v1/billing/schedules
POST   /api/v1/billing/run
POST   /api/v1/whatsapp/reminders
GET    /api/v1/maps/customers
GET    /api/v1/earth-engine/tiles
```

Successful responses use a consistent envelope:

```json
{
  "data": {},
  "message": "Operasi berhasil",
  "meta": {}
}
```

Error status conventions:

- `401` for an unauthenticated request.
- `403` for insufficient permissions.
- `404` for a missing resource.
- `409` for a state or uniqueness conflict.
- `422` for validation errors.
- `429` for rate limiting.
- `502` for an unavailable or failed external integration.

Error responses include a correlation ID but never expose credentials or production stack traces.

## Database Design

Reuse the existing `admin`, `pelanggan`, `perangkat`, `tagihan`, and `lokasi` tables, foreign keys, unique constraints, and cascade behavior. Eloquent models define the existing table and column names explicitly where Laravel conventions differ.

Laravel adds only framework support tables that are required for migrations, sessions, queues, and failed jobs. Business-schema changes require a dedicated migration and may not be hidden inside application startup.

The billing implementation adds or confirms a database-level uniqueness guarantee for one invoice per customer per billing month. This is required in addition to application-level idempotency.

## External Integrations

### Fonnte

Laravel's HTTP client sends messages from queued jobs. The adapter enforces timeouts, structured logging, retry limits, and duplicate-send protection. Automated tests use an HTTP fake.

### Nominatim

Laravel's HTTP client handles forward and reverse geocoding with a valid application user agent, rate limiting, timeouts, and normalized results. Automated tests never call the public service.

### Earth Engine

The existing Earth Engine behavior moves to `services/earth-engine/`. The service exposes only the minimal private endpoints needed for status, tile generation, and cache clearing. Laravel authenticates service-to-service calls and translates failures into the public API contract.

### Excel Import

Laravel validates file type and size, parses rows through a maintained spreadsheet package, validates every row, and returns row-level errors. Import writes run inside controlled transactions or batches so partial failures are explicit.

## Scheduler and Queue

- Replace `node-cron` with Laravel Scheduler.
- Run the scheduler from one operating-system cron entry or one managed scheduler process.
- Use overlap prevention for billing runs.
- Queue Fonnte delivery and other slow external work.
- Record failed jobs and support deliberate retry.
- Disable the Express scheduler before enabling Laravel Scheduler during cutover.

## Next.js Application

Use App Router route groups:

```text
(public)       Landing page
(auth)         Login
(dashboard)    Authenticated operations
```

Install the PaceUI registry item into the Next.js application through the shadcn CLI, then remove demo routes, data, and unused components. Lucide is the single icon system.

### Pages

- `/`: Citra NET marketing landing page using the shared visual language without dashboard chrome.
- `/login`: focused authentication layout.
- `/dashboard`: customer, revenue, arrears, service-status, and recent-activity summaries.
- `/pelanggan`: searchable and filterable table, customer detail, location, devices, billing history, and Excel import.
- `/perangkat`: device inventory and status management.
- `/tagihan`: period and status filters, payment updates, reminders, and confirmations.
- `/peta`: full map workspace with filters, customer details, standard layers, and Earth Engine layers.
- `/jadwal-pengiriman`: reminder timeline, queue state, message preview, and manual trigger.
- `/admin`: role and administrator management restricted to `super_admin`.

### Design System

- Preserve PaceUI's information density, sidebar, header, cards, table patterns, and responsive behavior.
- Adapt branding through the Citra NET logo, Indonesian copy, network-specific data, and a restrained accent color.
- Support light and dark themes.
- Use Recharts for dashboard visualizations.
- Use shadcn dialogs and drawers for focused create and edit flows.
- Provide consistent skeleton, empty, error, unauthorized, and not-found states.
- Avoid decorative gradients, neon effects, generic glassmorphism, and nested cards without functional hierarchy.
- Preserve keyboard access, visible focus, labels, contrast, reduced motion, and practical touch targets.
- On mobile, convert the sidebar to a sheet and prioritize essential table columns while allowing horizontal scrolling.

## Error Handling

- Laravel validation errors map fields consistently for Next.js forms.
- Forms retain entered values after a rejected submission.
- Destructive actions require explicit confirmation.
- Next.js route-level error boundaries provide recovery actions.
- External integrations use finite timeouts and actionable user messages.
- Logs include correlation IDs and relevant entity IDs while excluding secrets and sensitive payloads.
- Queue failures remain observable in `failed_jobs` and are not silently discarded.

## Migration Strategy

Use a contract-first parallel migration:

1. Record the current feature matrix, endpoint behavior, response fields, database effects, and role expectations.
2. Establish Laravel models, authentication, policies, and API contracts against an isolated database copy.
3. Implement domain modules and feature tests.
4. Extract and secure the Earth Engine service.
5. Install PaceUI and implement the Next.js application against stable API contracts.
6. Run parity, integration, and browser tests.
7. Rehearse cutover using a fresh production-like database copy.
8. Back up the live database, disable the old scheduler, deploy the new services, enable Laravel Scheduler, and run smoke tests.
9. Retain the old application as a rollback reference through the stabilization period.

## Verification Plan

### API Parity

Run equivalent read and write scenarios against the current Express application and Laravel using a fixed seed dataset. Compare HTTP status, meaningful response fields, pagination, relationships, validation outcomes, and database effects.

### Laravel Tests

Feature tests cover:

- Login, logout, inactive users, and role restrictions.
- Customer, device, invoice, and location CRUD.
- Search, filters, pagination, and statistics.
- Cascade and uniqueness behavior.
- Billing idempotency and scheduler overlap protection.
- Excel import success and row-level failure.
- Fonnte, Nominatim, and Earth Engine adapters with mocked responses.
- Consistent validation and integration errors.

### Next.js and Browser Tests

Use focused component tests for critical interactive states and Playwright for core user journeys:

- Login and logout.
- Role-appropriate navigation and access denial.
- Customer creation and update.
- Device and invoice operations.
- WhatsApp reminder submission.
- Map customer selection and layer changes.
- Admin management by a `super_admin`.
- Loading, empty, validation, integration-failure, and mobile navigation states.

### Data Verification

Before and after rehearsal and production cutover, compare row counts, key relationships, nullability, unique values, and representative financial totals. Verification uses backups or isolated copies for destructive scenarios.

### Acceptance Criteria

- Every existing user-facing feature has a working replacement.
- Existing MySQL data loads without manual record rewriting.
- No public administrator registration remains.
- Unauthorized roles cannot perform restricted operations.
- Billing and WhatsApp operations do not produce duplicates.
- All listed pages use the shared PaceUI-based design system and work on desktop and mobile.
- Laravel and Next.js production builds succeed.
- Required Laravel feature tests and Playwright journeys pass.
- A cutover rehearsal and post-cutover smoke test pass.
- Only one billing scheduler is active after cutover.

## Rollback

If cutover verification fails, stop Laravel Scheduler, route users back to the legacy application, and restore the pre-cutover database backup only when the failed release changed data incompatibly. The legacy scheduler must not be restarted until the active scheduler is confirmed stopped. The Earth Engine service can be rolled back independently when its API contract remains unchanged.
