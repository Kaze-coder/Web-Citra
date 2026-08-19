/**
 * Lokasi Model
 * Model untuk operasi database tabel lokasi (MySQL)
 */

const pool = require('../config/database');

class LokasiModel {
  // Get semua lokasi dengan data pelanggan
  static async getAllLokasi() {
    const [rows] = await pool.query(
      `SELECT l.*, p.nama_pelanggan, p.no_telepon, p.email, p.alamat, p.status, p.paket_layanan, p.harga_bulanan
       FROM lokasi l
       LEFT JOIN pelanggan p ON l.pelanggan_id = p.id
       ORDER BY l.tanggal_dibuat DESC`
    );
    return rows;
  }

  // Get lokasi by ID
  static async getLokasiById(id) {
    const [rows] = await pool.query(
      `SELECT l.*, p.nama_pelanggan, p.no_telepon, p.alamat
       FROM lokasi l
       LEFT JOIN pelanggan p ON l.pelanggan_id = p.id
       WHERE l.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Get lokasi by pelanggan ID
  static async getLokasiByPelangganId(pelanggan_id) {
    const [rows] = await pool.query(
      'SELECT * FROM lokasi WHERE pelanggan_id = ?',
      [pelanggan_id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Create lokasi (biasanya untuk pelanggan baru)
  static async createLokasi(data) {
    const { pelanggan_id, latitude, longitude, keterangan_lokasi } = data;

    const [result] = await pool.query(
      'INSERT INTO lokasi (pelanggan_id, latitude, longitude, keterangan_lokasi) VALUES (?, ?, ?, ?)',
      [pelanggan_id, latitude, longitude, keterangan_lokasi || 'Lokasi Pelanggan']
    );

    return this.getLokasiById(result.insertId);
  }

  // Upsert lokasi per pelanggan (pelanggan_id UNIQUE)
  static async upsertLokasiByPelanggan(pelanggan_id, data) {
    const { latitude, longitude, keterangan_lokasi } = data;

    await pool.query(
      `INSERT INTO lokasi (pelanggan_id, latitude, longitude, keterangan_lokasi)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), keterangan_lokasi = VALUES(keterangan_lokasi)`,
      [pelanggan_id, latitude, longitude, keterangan_lokasi || null]
    );

    return this.getLokasiByPelangganId(pelanggan_id);
  }

  // Update lokasi
  static async updateLokasi(id, data) {
    const { latitude, longitude, keterangan_lokasi } = data;

    const [result] = await pool.query(
      'UPDATE lokasi SET latitude = ?, longitude = ?, keterangan_lokasi = ? WHERE id = ?',
      [latitude, longitude, keterangan_lokasi || null, id]
    );

    if (result.affectedRows === 0) return null;
    return this.getLokasiById(id);
  }

  // Delete lokasi
  static async deleteLokasi(id) {
    const [result] = await pool.query('DELETE FROM lokasi WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = LokasiModel;
