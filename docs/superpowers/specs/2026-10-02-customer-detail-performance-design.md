# Customer Detail and Performance Design

## Goal

Make customer details operationally complete and make repeat navigation and data loading feel faster without changing business behavior or adding a data-fetching dependency.

## Customer Detail

The customer dialog uses the customer record already loaded for the table. Opening it must not issue another request.

Content is grouped into four scan-friendly sections:

- Identity: customer name, customer ID, and status.
- Contact: phone number, email, and full address. Phone and email use `tel:` and `mailto:` links when present.
- Service: package, monthly price, and subscription start date.
- Location: location note, latitude, longitude, and the existing Google Maps, Google Earth, and KML actions.

Missing optional values render as `-`. Missing coordinates render the existing geocoding guidance instead of location actions. The dialog remains keyboard accessible and responsive, with a wider two-column layout on desktop and one column on mobile.

## Performance

### Request Cache

Add a small client-side GET cache beside the existing API client. It will:

- Key entries by the complete request URL, including query parameters.
- Reuse fresh responses for 30 seconds.
- Deduplicate concurrent requests for the same URL.
- Keep at most 50 resolved entries.
- Never cache non-GET requests, failed responses, CSRF calls, or authentication requests.
- Expose targeted invalidation by API path after successful mutations.
- Clear all entries during logout so data cannot cross authenticated sessions.

Pages continue to refresh in the background after cached data is shown. A failed background refresh keeps valid cached content visible and uses the existing notification path where appropriate.

### Customer Search

Replace `useDeferredValue` as the network throttle with a 250 ms debounced query. Abort superseded list requests so stale responses cannot overwrite a newer search or page selection.

### Navigation

Keep the route transition but remove `AnimatePresence` wait behavior. The incoming route renders immediately while using a shorter, non-blocking opacity/translation transition. Reduced-motion behavior remains unchanged.

### Backend Boundary

Do not change database queries speculatively. The customer endpoint already paginates and eager-loads location in bounded queries. Backend indexes or response projections are only changed if production-mode measurements identify that endpoint as a bottleneck.

## Data Integrity

Successful create, update, delete, and import operations invalidate customer list, customer statistics, map-customer, and dependent selector entries before reloading. Billing, device, and administrator mutations invalidate only their related paths.

Cached data is an acceleration layer, not a source of truth. Mutation responses and explicit reloads bypass stale cache entries.

## Evidence Path

Before and after measurements use a production build with the same local database and authenticated account.

Evidence must establish:

- Opening customer detail creates no network request and shows all available fields.
- Repeated navigation to a previously loaded page renders cached data without a duplicate GET inside the 30-second freshness window.
- Concurrent identical GETs produce one network request.
- Customer search sends one request after the debounce window and ignores superseded responses.
- Mutations show fresh data immediately after completion.
- Logout clears cached authenticated data.
- Route changes are no longer delayed by an exiting page.

Verification includes targeted cache tests, lint, TypeScript, production build, existing Playwright E2E, and one desktop/mobile inspection of the customer dialog.

## Out of Scope

- Server-side rendering migration.
- TanStack Query, SWR, or another fetching dependency.
- Database schema changes without measured evidence.
- Changes to legacy `frontend/` or `backend/` applications.
