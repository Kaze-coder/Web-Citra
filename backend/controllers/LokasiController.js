/**
 * Lokasi Controller
 * Controller untuk menangani request lokasi pelanggan (MySQL)
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

      // Validasi pelanggan ada
      const pelanggan = await PelangganModel.getPelangganById(pelanggan_id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

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

      // pelanggan_id UNIQUE: satu pelanggan satu lokasi
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Pelanggan ini sudah memiliki lokasi. Gunakan update (PUT) untuk mengubah.',
          error: error.message
        });
      }

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

      const lokasi = await LokasiModel.updateLokasi(id, {
        latitude,
        longitude,
        keterangan_lokasi
      });

      if (!lokasi) {
        return res.status(404).json({
          success: false,
          message: 'Lokasi tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Lokasi berhasil diperbarui',
        data: lokasi
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

      const deleted = await LokasiModel.deleteLokasi(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Lokasi tidak ditemukan'
        });
      }

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
