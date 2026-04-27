/**
 * Tagihan Model
 * Model untuk operasi database tabel tagihan
 */

const pool = require('../config/database');

class TagihanModel {
  // Get semua tagihan dengan join pelanggan
  static async getAllTagihan(page = 1, limit = 10, status = null) {
    try {
      const offset = (page - 1) * limit;
      let query = `SELECT t.*, p.nama_pelanggan, p.no_telepon 
                   FROM tagihan t 
                   LEFT JOIN pelanggan p ON t.pelanggan_id = p.id`;
      let countQuery = 'SELECT COUNT(*) as total FROM tagihan';

      if (status) {
        query += ` WHERE t.status_pembayaran = ?`;
        countQuery += ` WHERE status_pembayaran = ?`;
      }

      query += ` ORDER BY t.bulan_tagihan DESC LIMIT ? OFFSET ?`;

      const params = status ? [status, limit, offset] : [limit, offset];
      const countParams = status ? [status] : [];

      const [rows] = await pool.query(query, params);
      const [countResult] = await pool.query(countQuery, countParams);

      return {
        data: rows,
        total: countResult[0].total,
        page,
        limit,
        pages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // Get tagihan by ID
  static async getTagihanById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT t.*, p.nama_pelanggan, p.no_telepon 
         FROM tagihan t 
         LEFT JOIN pelanggan p ON t.pelanggan_id = p.id 
         WHERE t.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get tagihan by pelanggan ID
  static async getTagihanByPelangganId(pelanggan_id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM tagihan WHERE pelanggan_id = ? ORDER BY bulan_tagihan DESC',
        [pelanggan_id]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get tagihan belum dibayar
  static async getTagihanBelumBayar() {
    try {
      const [rows] = await pool.query(
        `SELECT t.*, p.nama_pelanggan, p.no_telepon 
         FROM tagihan t 
         LEFT JOIN pelanggan p ON t.pelanggan_id = p.id 
         WHERE t.status_pembayaran = 'belum_lunas' 
         ORDER BY t.bulan_tagihan ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get statistik tagihan
  static async getStatistikTagihan() {
    try {
      const [lunas] = await pool.query('SELECT COUNT(*) as count FROM tagihan WHERE status_pembayaran = "lunas"');
      const [belumLunas] = await pool.query('SELECT COUNT(*) as count FROM tagihan WHERE status_pembayaran = "belum_lunas"');
      const [cicilan] = await pool.query('SELECT COUNT(*) as count FROM tagihan WHERE status_pembayaran = "cicilan"');
      const [totalNilai] = await pool.query('SELECT SUM(jumlah_tagihan) as total FROM tagihan');

      return {
        lunas: lunas[0].count,
        belumLunas: belumLunas[0].count,
        cicilan: cicilan[0].count,
        totalNilai: totalNilai[0].total || 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Create tagihan
  static async createTagihan(data) {
    try {
      const { pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, metode_pembayaran, catatan } = data;

      const [result] = await pool.query(
        'INSERT INTO tagihan (pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, metode_pembayaran, catatan) VALUES (?, ?, ?, ?, ?, ?)',
        [pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran || 'belum_lunas', metode_pembayaran, catatan]
      );

      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Update tagihan
  static async updateTagihan(id, data) {
    try {
      const { jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan } = data;

      await pool.query(
        'UPDATE tagihan SET jumlah_tagihan = ?, status_pembayaran = ?, tanggal_pembayaran = ?, metode_pembayaran = ?, catatan = ? WHERE id = ?',
        [jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan, id]
      );

      return { id, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Delete tagihan
  static async deleteTagihan(id) {
    try {
      await pool.query('DELETE FROM tagihan WHERE id = ?', [id]);
      return { success: true, message: 'Tagihan berhasil dihapus' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TagihanModel;
