/**
 * Geocoding Controller
 * Controller untuk menangani request geocoding alamat
 */

const GeocodingService = require('../services/GeocodingService');

class GeocodingController {
  /**
   * POST geocode address
   * @param {string} address - Alamat yang akan di-geocode
   */
  static async geocodeAddress(req, res) {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Alamat harus diisi'
        });
      }

      const result = await GeocodingService.geocodeAddress(address);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Geocoding berhasil',
        data: {
          latitude: result.latitude,
          longitude: result.longitude,
          formatted_address: result.formatted_address,
          place_id: result.place_id
        }
      });
    } catch (error) {
      console.error('Error in geocodeAddress:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal melakukan geocoding',
        error: error.message
      });
    }
  }

  /**
   * POST reverse geocode dari LAT/LNG
   */
  static async reverseGeocode(req, res) {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude dan longitude harus diisi'
        });
      }

      const result = await GeocodingService.reverseGeocode(latitude, longitude);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Reverse geocoding berhasil',
        data: {
          address: result.address
        }
      });
    } catch (error) {
      console.error('Error in reverseGeocode:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal melakukan reverse geocoding',
        error: error.message
      });
    }
  }
}

module.exports = GeocodingController;
