const path = require('node:path');
const dotenv = require('dotenv');
const ee = require('@google/earthengine');
const { createApp } = require('./app');
const { EarthEngineService } = require('./earth-engine-service');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 5000);
const keyPath = path.resolve(__dirname, '..', process.env.GEE_SERVICE_ACCOUNT_KEY || './config/gee-service-account.json');
const service = new EarthEngineService({
  ee,
  keyPath,
  projectId: process.env.GEE_PROJECT_ID,
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 7_200_000),
});
const app = createApp({ service, token: process.env.INTERNAL_TOKEN });
const server = app.listen(port, host, () => {
  console.log(`Earth Engine service listening on http://${host}:${port}`);
  service.initialize()
    .then(() => console.log('Earth Engine initialized.'))
    .catch((error) => console.error('Earth Engine initialization failed.', { name: error.name }));
});

function shutdown() {
  server.close((error) => process.exit(error ? 1 : 0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
