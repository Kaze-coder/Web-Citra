/**
 * Perangkat Controller
 * Controller untuk menangani request perangkat
 */

const PerangkatModel = require('../models/PerangkatModel');
const PelangganModel = require('../models/PelangganModel');

class PerangkatController {
  // GET all perangkat
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

  // GET perangkat by pelanggan ID
  static async getPerangkatByPelangganId(req, res) {
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

  // GET perangkat by ID
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

  // POST create perangkat baru
  static async createPerangkat(req, res) {
    try {
      const { pelanggan_id, nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat, tanggal_instalasi } = req.body;

      // Validasi data
      if (!pelanggan_id || !nama_perangkat) {
        return res.status(400).json({
          success: false,
          message: 'Data perangkat tidak lengkap'
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

      // Create perangkat
      const perangkat = await PerangkatModel.createPerangkat({
        pelanggan_id,
        nama_perangkat,
        tipe_perangkat,
        ip_address,
        mac_address,
        serial_number,
        status_perangkat,
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

  // PUT update perangkat
  static async updatePerangkat(req, res) {
    try {
      const { id } = req.params;
      const { nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat } = req.body;

      // Check if perangkat exists
      const perangkat = await PerangkatModel.getPerangkatById(id);
      if (!perangkat) {
        return res.status(404).json({
          success: false,
          message: 'Perangkat tidak ditemukan'
        });
      }

      // Update perangkat
      const updated = await PerangkatModel.updatePerangkat(id, {
        nama_perangkat,
        tipe_perangkat,
        ip_address,
        mac_address,
        serial_number,
        status_perangkat
      });

      res.json({
        success: true,
        message: 'Perangkat berhasil diperbarui',
        data: updated
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

  // DELETE perangkat
  static async deletePerangkat(req, res) {
    try {
      const { id } = req.params;

      // Check if perangkat exists
      const perangkat = await PerangkatModel.getPerangkatById(id);
      if (!perangkat) {
        return res.status(404).json({
          success: false,
          message: 'Perangkat tidak ditemukan'
        });
      }

      // Delete perangkat
      await PerangkatModel.deletePerangkat(id);

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
