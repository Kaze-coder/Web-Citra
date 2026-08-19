/**
 * Earth Engine Service
 * Service untuk autentikasi dan generate tile URLs dari Google Earth Engine
 */

const ee = require('@google/earthengine');
const path = require('path');
require('dotenv').config();

class EarthEngineService {
  constructor() {
    this.isInitialized = false;
    this.isInitializing = false;
    this.tileCache = new Map();
    this.CACHE_TTL = 2 * 60 * 60 * 1000; // 2 jam dalam ms
  }

  /**
   * Initialize Earth Engine dengan service account
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Earth Engine sudah ter-inisialisasi');
      return true;
    }

    if (this.isInitializing) {
      console.log('⏳ Earth Engine sedang dalam proses inisialisasi...');
      return false;
    }

    this.isInitializing = true;

    try {
      const keyPath = process.env.GEE_SERVICE_ACCOUNT_KEY || './config/gee-service-account.json';
      const absoluteKeyPath = path.resolve(__dirname, '..', keyPath);

      let privateKey;
      try {
        privateKey = require(absoluteKeyPath);
      } catch (err) {
        console.error('✗ File service account GEE tidak ditemukan:', absoluteKeyPath);
        console.error('  → Pastikan file gee-service-account.json ada di backend/config/');
        console.error('  → Download dari Google Cloud Console → IAM → Service Accounts → Keys');
        this.isInitializing = false;
        return false;
      }

      // Authenticate via private key
      await new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(privateKey, () => {
          resolve();
        }, (err) => {
          reject(new Error('GEE Authentication failed: ' + err));
        });
      });

      // Initialize Earth Engine
      const projectId = process.env.GEE_PROJECT_ID || privateKey.project_id;
      await new Promise((resolve, reject) => {
        ee.initialize(null, null, () => {
          resolve();
        }, (err) => {
          reject(new Error('GEE Initialization failed: ' + err));
        }, null, projectId);
      });

      this.isInitialized = true;
      this.isInitializing = false;
      console.log('✅ Earth Engine initialized successfully');
      console.log(`   Project: ${projectId}`);
      return true;

    } catch (error) {
      this.isInitializing = false;
      console.error('✗ Earth Engine initialization error:', error.message);
      return false;
    }
  }

  /**
   * Generate tile URL untuk Sentinel-2 True Color
   * Resolusi 10m, composite cloud-free terbaru
   */
  _getSentinel2TrueColor() {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const startDate = threeMonthsAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
      .select(['B4', 'B3', 'B2'])
      .median();

    return {
      image: collection,
      visParams: {
        bands: ['B4', 'B3', 'B2'],
        min: 0,
        max: 3000,
        gamma: 1.4
      },
      name: 'Sentinel-2 Satelit',
      attribution: '&copy; Copernicus Sentinel-2 via Google Earth Engine'
    };
  }

  /**
   * Generate tile URL untuk Landsat 9 True Color
   * Resolusi 30m, composite cloud-free terbaru
   */
  _getLandsat9TrueColor() {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const startDate = sixMonthsAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUD_COVER', 20))
      .map((image) => {
        return image.multiply(0.0000275).add(-0.2);
      })
      .select(['SR_B4', 'SR_B3', 'SR_B2'])
      .median();

    return {
      image: collection,
      visParams: {
        bands: ['SR_B4', 'SR_B3', 'SR_B2'],
        min: 0,
        max: 0.3,
        gamma: 1.4
      },
      name: 'Landsat 9 Satelit',
      attribution: '&copy; USGS Landsat 9 via Google Earth Engine'
    };
  }

  /**
   * Generate tile URL untuk SRTM Elevation (terrain)
   */
  _getSRTMElevation() {
    const image = ee.Image('USGS/SRTMGL1_003');

    return {
      image: image,
      visParams: {
        min: 0,
        max: 3000,
        palette: ['006633', 'E5FFCC', '662A00', 'D8D8D8', 'F5F5F5']
      },
      name: 'Elevasi Terrain (SRTM)',
      attribution: '&copy; USGS SRTM via Google Earth Engine'
    };
  }

  /**
   * Generate map tile URL dari ee.Image
   * @param {Object} layerConfig - { image, visParams, name, attribution }
   * @returns {Promise<Object>} - { name, url, attribution }
   */
  async _generateTileUrl(layerConfig) {
    return new Promise((resolve, reject) => {
      layerConfig.image.getMap(layerConfig.visParams, (mapInfo) => {
        if (!mapInfo || !mapInfo.urlFormat) {
          reject(new Error(`Gagal generate tile untuk ${layerConfig.name}`));
          return;
        }
        resolve({
          name: layerConfig.name,
          url: mapInfo.urlFormat,
          attribution: layerConfig.attribution
        });
      }, (err) => {
        reject(new Error(`Error generating tile for ${layerConfig.name}: ${err}`));
      });
    });
  }

  /**
   * Get semua tile layers (dengan caching)
   * @returns {Promise<Array>} - Array of { name, url, attribution }
   */
  async getTileLayers() {
    if (!this.isInitialized) {
      throw new Error('Earth Engine belum ter-inisialisasi');
    }

    // Check cache
    const cacheKey = 'tile_layers';
    const cached = this.tileCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      console.log('📦 Returning cached GEE tile URLs');
      return cached.data;
    }

    console.log('🌍 Generating fresh GEE tile URLs...');

    // Define semua layer datasets
    const layerConfigs = [
      this._getSentinel2TrueColor(),
      this._getLandsat9TrueColor(),
      this._getSRTMElevation()
    ];

    // Generate tile URLs secara parallel
    const results = await Promise.allSettled(
      layerConfigs.map(config => this._generateTileUrl(config))
    );

    const tileLayers = [];
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        tileLayers.push(result.value);
        console.log(`  ✅ ${result.value.name}: tile URL generated`);
      } else {
        console.error(`  ❌ ${layerConfigs[i].name}: ${result.reason.message}`);
      }
    });

    // Cache hasil
    if (tileLayers.length > 0) {
      this.tileCache.set(cacheKey, {
        data: tileLayers,
        timestamp: Date.now()
      });
    }

    return tileLayers;
  }

  /**
   * Get status koneksi GEE
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      initializing: this.isInitializing,
      cacheSize: this.tileCache.size,
      cacheEntries: Array.from(this.tileCache.keys())
    };
  }

  /**
   * Clear tile cache
   */
  clearCache() {
    this.tileCache.clear();
    console.log('🗑️ GEE tile cache cleared');
  }
}

module.exports = new EarthEngineService();
