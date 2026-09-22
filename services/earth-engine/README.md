# Citra Earth Engine Service

Private Node.js adapter for Google Earth Engine. It binds to `127.0.0.1` by default and requires `X-Internal-Token` on every `/v1/*` request.

1. Copy `.env.example` to `.env` and set a random token of at least 32 characters.
2. Place the Google service-account JSON outside version control and set `GEE_SERVICE_ACCOUNT_KEY`.
3. Run `npm install`, `npm test`, then `npm start`.

Laravel must use the same token through `EARTH_ENGINE_TOKEN`. Never expose this service or its token to the browser.
