/**
 * Lokasi Model
 * Model untuk operasi database tabel lokasi
 */

const pool = require('../config/database');

class LokasiModel {
  // Get semua lokasi dengan data pelanggan
  static async getAllLokasi() {
    try {
      const [rows] = await pool.execute(
        `SELECT l.*, p.nama_pelanggan, p.no_telepon, p.alamat, p.paket_layanan 
         FROM lokasi l 
         LEFT JOIN pelanggan p ON l.pelanggan_id = p.id 
         ORDER BY l.tanggal_dibuat DESC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get lokasi by ID
  static async getLokasiById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT l.*, p.nama_pelanggan, p.no_telepon, p.alamat 
         FROM lokasi l 
         LEFT JOIN pelanggan p ON l.pelanggan_id = p.id 
         WHERE l.id = ?`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get lokasi by pelanggan ID
  static async getLokasiByPelangganId(pelanggan_id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM lokasi WHERE pelanggan_id = ?',
        [pelanggan_id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Create lokasi (biasanya untuk pelanggan baru)
  static async createLokasi(data) {
    try {
      const { pelanggan_id, latitude, longitude, keterangan_lokasi } = data;

      const [result] = await pool.execute(
        'INSERT INTO lokasi (pelanggan_id, latitude, longitude, keterangan_lokasi) VALUES (?, ?, ?, ?)',
        [pelanggan_id, latitude, longitude, keterangan_lokasi]
      );

      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Update lokasi
  static async updateLokasi(id, data) {
    try {
      const { latitude, longitude, keterangan_lokasi } = data;

      await pool.execute(
        'UPDATE lokasi SET latitude = ?, longitude = ?, keterangan_lokasi = ? WHERE id = ?',
        [latitude, longitude, keterangan_lokasi, id]
      );

      return { id, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Delete lokasi
  static async deleteLokasi(id) {
    try {
      await pool.execute('DELETE FROM lokasi WHERE id = ?', [id]);
      return { success: true, message: 'Lokasi berhasil dihapus' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = LokasiModel;
