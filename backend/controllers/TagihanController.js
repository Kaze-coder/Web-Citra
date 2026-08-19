/**
 * Tagihan Controller
 */

const TagihanModel = require('../models/TagihanModel');
const PelangganModel = require('../models/PelangganModel');

class TagihanController {
  // Ambil semua tagihan
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

  // Ambil tagihan yang belum lunas
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

  // Ambil statistik tagihan (satu-satunya implementasi)
  static async getStatistikTagihan(req, res) {
    try {
      const statistik = await TagihanModel.getStatistikTagihan();

      res.json({
        success: true,
        message: 'Statistik tagihan berhasil diambil',
        data: {
          total: statistik.total,
          lunas: statistik.lunas,
          belum_lunas: statistik.belum_lunas,
          cicilan: statistik.cicilan,
          totalPemasukan: statistik.totalPemasukan
        }
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

  // Ambil tagihan berdasarkan ID pelanggan
  static async getTagihanByPelangganId(req, res) {
    try {
      const { pelanggan_id } = req.params;

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

  // Ambil tagihan berdasarkan ID
  static async getTagihanById(req, res) {
    try {
      const { id } = req.params;

      const tagihan = await TagihanModel.getTagihanById(id);
      if (!tagihan) {
        return res.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Data tagihan berhasil diambil',
        data: tagihan
      });
    } catch (error) {
      console.error('Error getting tagihan by id:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tagihan',
        error: error.message
      });
    }
  }

  // Buat tagihan baru
  static async createTagihan(req, res) {
    try {
      const { pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan } = req.body;

      // Validasi pelanggan ada
      const pelanggan = await PelangganModel.getPelangganById(pelanggan_id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      const tagihan = await TagihanModel.createTagihan({
        pelanggan_id,
        bulan_tagihan,
        jumlah_tagihan,
        status_pembayaran: status_pembayaran || 'belum_lunas',
        tanggal_pembayaran,
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

  // Perbarui data tagihan
  static async updateTagihan(req, res) {
    try {
      const { id } = req.params;
      const { bulan_tagihan, jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan } = req.body;

      const tagihan = await TagihanModel.updateTagihan(id, {
        bulan_tagihan,
        jumlah_tagihan,
        status_pembayaran,
        tanggal_pembayaran,
        metode_pembayaran,
        catatan
      });

      if (!tagihan) {
        return res.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Tagihan berhasil diperbarui',
        data: tagihan
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

  // Hapus tagihan
  static async deleteTagihan(req, res) {
    try {
      const { id } = req.params;

      const deleted = await TagihanModel.deleteTagihan(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan'
        });
      }

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
