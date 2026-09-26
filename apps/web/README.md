# Citra NET Web

Next.js 16 operations console untuk Laravel API Citra NET.

## Environment

```env
LARAVEL_API_ORIGIN=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Citra NET
```

`LARAVEL_API_ORIGIN` hanya dipakai server Next.js untuk rewrite `/api/*` dan `/sanctum/*`. Browser tidak mengakses origin Laravel secara langsung.

## Commands

```bash
npm ci
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm start
```

## Browser E2E

```bash
npx playwright install chromium
npm run test:e2e
```

E2E membangun production bundle, membuat SQLite test baru, menjalankan Laravel di `127.0.0.1:8100`, menjalankan Next.js di `127.0.0.1:3100`, lalu menguji login/logout, role, CRUD pelanggan, perangkat, tagihan, antrean reminder, peta, admin, dan navigasi mobile.
