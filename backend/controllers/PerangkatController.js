/**
 * Perangkat Controller
 */

const PerangkatModel = require('../models/PerangkatModel');
const PelangganModel = require('../models/PelangganModel');

class PerangkatController {
  // Ambil semua perangkat
  static async getAllPerangkat(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await PerangkatModel.getAllPerangkat(page, limit);

      res.json({
        success: true,
        message: 'Data perangkat berhasil diambil',
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error) {
      console.error('Error getting perangkat:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data perangkat',
        error: error.message
      });
    }
  }

  // Ambil perangkat berdasarkan ID pelanggan
  static async getPerangkatByPelangganId(req, res) {
    try {
      const { pelanggan_id } = req.params;

      const perangkat = await PerangkatModel.getPerangkatByPelangganId(pelanggan_id);

      res.json({
        success: true,
        message: 'Data perangkat pelanggan berhasil diambil',
        data: perangkat
      });
    } catch (error) {
      console.error('Error getting perangkat by pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data perangkat',
        error: error.message
      });
    }
  }

  // Ambil perangkat berdasarkan ID
  static async getPerangkatById(req, res) {
    try {
      const { id } = req.params;
      const perangkat = await PerangkatModel.getPerangkatById(id);

      if (!perangkat) {
        return res.status(404).json({
          success: false,
          message: 'Perangkat tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Data perangkat berhasil diambil',
        data: perangkat
      });
    } catch (error) {
      console.error('Error getting perangkat by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data perangkat',
        error: error.message
      });
    }
  }

  // Buat perangkat baru
  static async createPerangkat(req, res) {
    try {
      const { pelanggan_id, nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat, tanggal_instalasi } = req.body;

      // Validasi pelanggan ada
      const pelanggan = await PelangganModel.getPelangganById(pelanggan_id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      const perangkat = await PerangkatModel.createPerangkat({
        pelanggan_id,
        nama_perangkat,
        tipe_perangkat,
        ip_address,
        mac_address,
        serial_number,
        status_perangkat: status_perangkat || 'aktif',
        tanggal_instalasi
      });

      res.status(201).json({
        success: true,
        message: 'Perangkat baru berhasil ditambahkan',
        data: perangkat
      });
    } catch (error) {
      console.error('Error creating perangkat:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan perangkat baru',
        error: error.message
      });
    }
  }

  // Perbarui data perangkat
  static async updatePerangkat(req, res) {
    try {
      const { id } = req.params;
      const { nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat } = req.body;

      const perangkat = await PerangkatModel.updatePerangkat(id, {
        nama_perangkat,
        tipe_perangkat,
        ip_address,
        mac_address,
        serial_number,
        status_perangkat
      });

      if (!perangkat) {
        return res.status(404).json({
          success: false,
          message: 'Perangkat tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Perangkat berhasil diperbarui',
        data: perangkat
      });
    } catch (error) {
      console.error('Error updating perangkat:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui perangkat',
        error: error.message
      });
    }
  }

  // Hapus perangkat
  static async deletePerangkat(req, res) {
    try {
      const { id } = req.params;

      const deleted = await PerangkatModel.deletePerangkat(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Perangkat tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Perangkat berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting perangkat:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus perangkat',
        error: error.message
      });
    }
  }
}

module.exports = PerangkatController;
