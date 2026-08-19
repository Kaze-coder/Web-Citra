/**
 * Earth Engine Controller
 * Controller untuk endpoint Google Earth Engine tile layers
 */

const EarthEngineService = require('../services/EarthEngineService');

class EarthEngineController {
  /**
   * GET /api/earth-engine/tiles
   * Ambil semua tile layer URLs dari GEE
   */
  static async getTileLayers(req, res) {
    try {
      if (!EarthEngineService.isInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Earth Engine belum ter-inisialisasi. Pastikan service account sudah dikonfigurasi.',
          fallback: true
        });
      }

      const tileLayers = await EarthEngineService.getTileLayers();

      if (!tileLayers || tileLayers.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Gagal generate tile layers dari Earth Engine',
          fallback: true
        });
      }

      res.json({
        success: true,
        message: `${tileLayers.length} tile layers berhasil di-generate`,
        data: tileLayers
      });
    } catch (error) {
      console.error('Error getting GEE tile layers:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil tile layers dari Earth Engine',
        error: error.message,
        fallback: true
      });
    }
  }

  /**
   * GET /api/earth-engine/status
   * Cek status koneksi Earth Engine
   */
  static async getStatus(req, res) {
    try {
      const status = EarthEngineService.getStatus();

      res.json({
        success: true,
        message: 'Earth Engine status',
        data: status
      });
    } catch (error) {
      console.error('Error getting GEE status:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil status Earth Engine',
        error: error.message
      });
    }
  }

  /**
   * POST /api/earth-engine/clear-cache
   * Clear tile cache
   */
  static async clearCache(req, res) {
    try {
      EarthEngineService.clearCache();

      res.json({
        success: true,
        message: 'Cache Earth Engine berhasil dibersihkan'
      });
    } catch (error) {
      console.error('Error clearing GEE cache:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membersihkan cache',
        error: error.message
      });
    }
  }
}

module.exports = EarthEngineController;
