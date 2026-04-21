/**
 * Tagihan Controller
 * Controller untuk menangani request tagihan
 */

const TagihanModel = require('../models/TagihanModel');
const PelangganModel = require('../models/PelangganModel');

class TagihanController {
  // GET all tagihan
  static async getAllTagihan(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status || null;

      const result = await TagihanModel.getAllTagihan(page, limit, status);

      res.json({
        success: true,
        message: 'Data tagihan berhasil diambil',
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error) {
      console.error('Error getting tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tagihan',
        error: error.message
      });
    }
  }

  // GET tagihan belum dibayar (untuk reminder whatsapp)
  static async getTagihanBelumBayar(req, res) {
    try {
      const result = await TagihanModel.getTagihanBelumBayar();

      res.json({
        success: true,
        message: 'Data tagihan belum dibayar berhasil diambil',
        data: result
      });
    } catch (error) {
      console.error('Error getting tagihan belum bayar:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tagihan belum dibayar',
        error: error.message
      });
    }
  }

  // GET statistik tagihan
  static async getStatistikTagihan(req, res) {
    try {
      const result = await TagihanModel.getStatistikTagihan();

      res.json({
        success: true,
        message: 'Statistik tagihan berhasil diambil',
        data: result
      });
    } catch (error) {
      console.error('Error getting statistik tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik tagihan',
        error: error.message
      });
    }
  }

  // GET tagihan by pelanggan ID
  static async getTagihanByPelangganId(req, res) {
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

      const tagihan = await TagihanModel.getTagihanByPelangganId(pelanggan_id);

      res.json({
        success: true,
        message: 'Data tagihan pelanggan berhasil diambil',
        data: tagihan
      });
    } catch (error) {
      console.error('Error getting tagihan by pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tagihan pelanggan',
        error: error.message
      });
    }
  }

  // POST create tagihan baru
  static async createTagihan(req, res) {
    try {
      const { pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, metode_pembayaran, catatan } = req.body;

      // Validasi data
      if (!pelanggan_id || !bulan_tagihan || !jumlah_tagihan) {
        return res.status(400).json({
          success: false,
          message: 'Data tagihan tidak lengkap'
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

      // Create tagihan
      const tagihan = await TagihanModel.createTagihan({
        pelanggan_id,
        bulan_tagihan,
        jumlah_tagihan,
        status_pembayaran,
        metode_pembayaran,
        catatan
      });

      res.status(201).json({
        success: true,
        message: 'Tagihan baru berhasil dibuat',
        data: tagihan
      });
    } catch (error) {
      console.error('Error creating tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat tagihan baru',
        error: error.message
      });
    }
  }

  // PUT update tagihan
  static async updateTagihan(req, res) {
    try {
      const { id } = req.params;
      const { jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan } = req.body;

      // Check if tagihan exists
      const [rows] = await TagihanModel.pool.query('SELECT * FROM tagihan WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan'
        });
      }

      // Update tagihan
      const updated = await TagihanModel.updateTagihan(id, {
        jumlah_tagihan,
        status_pembayaran,
        tanggal_pembayaran,
        metode_pembayaran,
        catatan
      });

      res.json({
        success: true,
        message: 'Tagihan berhasil diperbarui',
        data: updated
      });
    } catch (error) {
      console.error('Error updating tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui tagihan',
        error: error.message
      });
    }
  }

  // DELETE tagihan
  static async deleteTagihan(req, res) {
    try {
      const { id } = req.params;

      // Delete tagihan
      await TagihanModel.deleteTagihan(id);

      res.json({
        success: true,
        message: 'Tagihan berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus tagihan',
        error: error.message
      });
    }
  }
}

module.exports = TagihanController;
