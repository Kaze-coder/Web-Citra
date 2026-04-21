/**
 * Pelanggan Model
 * Model untuk operasi database tabel pelanggan
 */

const pool = require('../config/database');

class PelangganModel {
  // Get semua pelanggan dengan pagination
  static async getAllPelanggan(page = 1, limit = 10, search = '') {
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM pelanggan';
      let countQuery = 'SELECT COUNT(*) as total FROM pelanggan';

      if (search) {
        const searchTerm = `%${search}%`;
        query += ` WHERE nama_pelanggan LIKE ? OR no_telepon LIKE ? OR alamat LIKE ?`;
        countQuery += ` WHERE nama_pelanggan LIKE ? OR no_telepon LIKE ? OR alamat LIKE ?`;
      }

      query += ` ORDER BY tanggal_dibuat DESC LIMIT ? OFFSET ?`;

      const [rows] = await pool.query(query, search ? [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset] : [limit, offset]);
      const [countResult] = await pool.query(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);

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

  // Get pelanggan by ID
  static async getPelangganById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM pelanggan WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get statistik pelanggan
  static async getStatistik() {
    try {
      const [total] = await pool.query('SELECT COUNT(*) as count FROM pelanggan');
      const [aktif] = await pool.query('SELECT COUNT(*) as count FROM pelanggan WHERE status = "aktif"');
      const [nonaktif] = await pool.query('SELECT COUNT(*) as count FROM pelanggan WHERE status = "nonaktif"');
      const [suspend] = await pool.query('SELECT COUNT(*) as count FROM pelanggan WHERE status = "suspend"');

      return {
        total: total[0].count,
        aktif: aktif[0].count,
        nonaktif: nonaktif[0].count,
        suspend: suspend[0].count
      };
    } catch (error) {
      throw error;
    }
  }

  // Create pelanggan baru
  static async createPelanggan(data) {
    try {
      const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, tanggal_langganan } = data;

      const [result] = await pool.query(
        'INSERT INTO pelanggan (nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, tanggal_langganan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nama_pelanggan, no_telepon, email, alamat, status || 'aktif', paket_layanan, harga_bulanan, tanggal_langganan]
      );

      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Update pelanggan
  static async updatePelanggan(id, data) {
    try {
      const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan } = data;

      await pool.query(
        'UPDATE pelanggan SET nama_pelanggan = ?, no_telepon = ?, email = ?, alamat = ?, status = ?, paket_layanan = ?, harga_bulanan = ? WHERE id = ?',
        [nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, id]
      );

      return { id, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Delete pelanggan
  static async deletePelanggan(id) {
    try {
      // CASCADE delete akan menghapus data terkait di tabel lain
      await pool.query('DELETE FROM pelanggan WHERE id = ?', [id]);
      return { success: true, message: 'Pelanggan berhasil dihapus' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PelangganModel;
