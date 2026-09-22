const fs = require('node:fs/promises');

class ServiceUnavailableError extends Error {}

class EarthEngineService {
  constructor({ ee, keyPath, projectId, cacheTtlMs = 7_200_000 }) {
    this.ee = ee;
    this.keyPath = keyPath;
    this.projectId = projectId;
    this.cacheTtlMs = cacheTtlMs;
    this.initialized = false;
    this.initializing = false;
    this.cache = new Map();
  }

  async initialize() {
    if (this.initialized) return true;
    if (this.initializing) return false;
    this.initializing = true;

    try {
      const credentials = JSON.parse(await fs.readFile(this.keyPath, 'utf8'));
      await new Promise((resolve, reject) => {
        this.ee.data.authenticateViaPrivateKey(credentials, resolve, reject);
      });
      await new Promise((resolve, reject) => {
        this.ee.initialize(null, null, resolve, reject, null, this.projectId || credentials.project_id);
      });
      this.initialized = true;
      return true;
    } finally {
      this.initializing = false;
    }
  }

  status() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      cacheSize: this.cache.size,
      cacheEntries: [...this.cache.keys()],
    };
  }

  clearCache() {
    this.cache.clear();
  }

  async tiles() {
    if (!this.initialized) {
      throw new ServiceUnavailableError('Earth Engine is not initialized.');
    }

    const cached = this.cache.get('tile-layers');
    if (cached && Date.now() - cached.createdAt < this.cacheTtlMs) return cached.data;

    const configurations = this.layerConfigurations();
    const settled = await Promise.allSettled(configurations.map((configuration) => this.tile(configuration)));
    const data = settled.filter((result) => result.status === 'fulfilled').map((result) => result.value);

    if (data.length === 0) throw new ServiceUnavailableError('No Earth Engine tiles are available.');
    this.cache.set('tile-layers', { data, createdAt: Date.now() });

    return data;
  }

  layerConfigurations() {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const end = now.toISOString().slice(0, 10);

    return [
      {
        image: this.ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterDate(threeMonthsAgo.toISOString().slice(0, 10), end)
          .filter(this.ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
          .select(['B4', 'B3', 'B2'])
          .median(),
        visualization: { bands: ['B4', 'B3', 'B2'], min: 0, max: 3000, gamma: 1.4 },
        name: 'Sentinel-2 Satelit',
        attribution: '&copy; Copernicus Sentinel-2 via Google Earth Engine',
      },
      {
        image: this.ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
          .filterDate(sixMonthsAgo.toISOString().slice(0, 10), end)
          .filter(this.ee.Filter.lt('CLOUD_COVER', 20))
          .map((image) => image.multiply(0.0000275).add(-0.2))
          .select(['SR_B4', 'SR_B3', 'SR_B2'])
          .median(),
        visualization: { bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0, max: 0.3, gamma: 1.4 },
        name: 'Landsat 9 Satelit',
        attribution: '&copy; USGS Landsat 9 via Google Earth Engine',
      },
      {
        image: this.ee.Image('USGS/SRTMGL1_003'),
        visualization: {
          min: 0,
          max: 3000,
          palette: ['006633', 'E5FFCC', '662A00', 'D8D8D8', 'F5F5F5'],
        },
        name: 'Elevasi Terrain (SRTM)',
        attribution: '&copy; USGS SRTM via Google Earth Engine',
      },
    ];
  }

  tile(configuration) {
    return new Promise((resolve, reject) => {
      configuration.image.getMap(configuration.visualization, (map) => {
        if (!map?.urlFormat) {
          reject(new ServiceUnavailableError(`No URL generated for ${configuration.name}.`));
          return;
        }
        resolve({ name: configuration.name, url: map.urlFormat, attribution: configuration.attribution });
      }, reject);
    });
  }
}

module.exports = { EarthEngineService, ServiceUnavailableError };
