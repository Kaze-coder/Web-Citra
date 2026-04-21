/**
 * Lokasi Controller
 * Controller untuk menangani request lokasi pelanggan
 */

const LokasiModel = require('../models/LokasiModel');
const PelangganModel = require('../models/PelangganModel');

class LokasiController {
  // GET all lokasi
  static async getAllLokasi(req, res) {
    try {
      const result = await LokasiModel.getAllLokasi();

      res.json({
        success: true,
        message: 'Data lokasi berhasil diambil',
        data: result
      });
    } catch (error) {
      console.error('Error getting lokasi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data lokasi',
        error: error.message
      });
    }
  }

  // GET lokasi by pelanggan ID
  static async getLokasiByPelangganId(req, res) {
    try {
      const { pelanggan_id } = req.params;

      // Check if pelanggan exists
      const pelanggan = await PelangganModel.getPelangganById(pelanggan_id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      const lokasi = await LokasiModel.getLokasiByPelangganId(pelanggan_id);

      res.json({
        success: true,
        message: 'Data lokasi pelanggan berhasil diambil',
        data: lokasi
      });
    } catch (error) {
      console.error('Error getting lokasi by pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data lokasi',
        error: error.message
      });
    }
  }

  // POST create lokasi
  static async createLokasi(req, res) {
    try {
      const { pelanggan_id, latitude, longitude, keterangan_lokasi } = req.body;

      // Validasi data
      if (!pelanggan_id || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Data lokasi tidak lengkap'
        });
      }

      // Check if pelanggan exists
      const pelanggan = await PelangganModel.getPelangganById(pelanggan_id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      // Create lokasi
      const lokasi = await LokasiModel.createLokasi({
        pelanggan_id,
        latitude,
        longitude,
        keterangan_lokasi: keterangan_lokasi || 'Lokasi Pelanggan'
      });

      res.status(201).json({
        success: true,
        message: 'Lokasi baru berhasil ditambahkan',
        data: lokasi
      });
    } catch (error) {
      console.error('Error creating lokasi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan lokasi',
        error: error.message
      });
    }
  }

  // PUT update lokasi
  static async updateLokasi(req, res) {
    try {
      const { id } = req.params;
      const { latitude, longitude, keterangan_lokasi } = req.body;

      // Check if lokasi exists
      const lokasi = await LokasiModel.getLokasiById(id);
      if (!lokasi) {
        return res.status(404).json({
          success: false,
          message: 'Lokasi tidak ditemukan'
        });
      }

      // Update lokasi
      const updated = await LokasiModel.updateLokasi(id, {
        latitude,
        longitude,
        keterangan_lokasi
      });

      res.json({
        success: true,
        message: 'Lokasi berhasil diperbarui',
        data: updated
      });
    } catch (error) {
      console.error('Error updating lokasi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui lokasi',
        error: error.message
      });
    }
  }

  // DELETE lokasi
  static async deleteLokasi(req, res) {
    try {
      const { id } = req.params;

      // Check if lokasi exists
      const lokasi = await LokasiModel.getLokasiById(id);
      if (!lokasi) {
        return res.status(404).json({
          success: false,
          message: 'Lokasi tidak ditemukan'
        });
      }

      // Delete lokasi
      await LokasiModel.deleteLokasi(id);

      res.json({
        success: true,
        message: 'Lokasi berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting lokasi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus lokasi',
        error: error.message
      });
    }
  }
}

module.exports = LokasiController;
