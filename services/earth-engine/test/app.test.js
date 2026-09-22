const assert = require('node:assert/strict');
const test = require('node:test');
const { createApp } = require('../src/app');
const { EarthEngineService, ServiceUnavailableError } = require('../src/earth-engine-service');

const token = 'test-token-with-at-least-thirty-two-characters';

async function serve(service, run) {
  const app = createApp({ service, token, logger: { error() {} } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('protects private routes and serves the Earth Engine contract', async () => {
  let cleared = false;
  const service = {
    status: () => ({ initialized: true, initializing: false, cacheSize: 0, cacheEntries: [] }),
    tiles: async () => [{ name: 'Sentinel-2', url: 'https://tiles.example/{z}/{x}/{y}', attribution: 'Copernicus' }],
    clearCache: () => { cleared = true; },
  };

  await serve(service, async (origin) => {
    assert.equal((await fetch(`${origin}/v1/status`)).status, 401);

    const headers = { 'X-Internal-Token': token };
    const status = await fetch(`${origin}/v1/status`, { headers });
    assert.equal(status.status, 200);
    assert.equal((await status.json()).data.initialized, true);

    const tiles = await fetch(`${origin}/v1/tiles`, { headers });
    assert.equal(tiles.status, 200);
    assert.equal((await tiles.json()).data[0].name, 'Sentinel-2');

    const cache = await fetch(`${origin}/v1/cache`, { method: 'DELETE', headers });
    assert.equal(cache.status, 200);
    assert.equal(cleared, true);
  });
});

test('returns a sanitized unavailable response', async () => {
  const service = {
    status: () => ({ initialized: false }),
    tiles: async () => { throw new ServiceUnavailableError('credential path must stay private'); },
    clearCache() {},
  };

  await serve(service, async (origin) => {
    const response = await fetch(`${origin}/v1/tiles`, { headers: { 'X-Internal-Token': token } });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.message, 'Earth Engine is unavailable.');
    assert.equal(JSON.stringify(body).includes('credential path'), false);
  });
});

test('caches generated tiles until the cache is cleared', async () => {
  const service = new EarthEngineService({ ee: {}, keyPath: 'unused' });
  service.initialized = true;
  service.layerConfigurations = () => [{ name: 'test' }];
  let generations = 0;
  service.tile = async () => {
    generations += 1;
    return { name: 'test', url: 'https://tiles.example', attribution: 'test' };
  };

  await service.tiles();
  await service.tiles();
  assert.equal(generations, 1);
  service.clearCache();
  await service.tiles();
  assert.equal(generations, 2);
});
