/**
 * Perangkat Model
 * Model untuk operasi database tabel perangkat (MySQL)
 */

const pool = require('../config/database');

class PerangkatModel {
  // Get semua perangkat dengan pagination + data pelanggan
  static async getAllPerangkat(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT p.*, pel.nama_pelanggan, pel.no_telepon
       FROM perangkat p
       LEFT JOIN pelanggan pel ON p.pelanggan_id = pel.id
       ORDER BY p.tanggal_dibuat DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM perangkat');
    const total = countResult[0].total;

    return {
      data: rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  // Get perangkat by pelanggan ID
  static async getPerangkatByPelangganId(pelanggan_id) {
    const [rows] = await pool.query(
      'SELECT * FROM perangkat WHERE pelanggan_id = ? ORDER BY tanggal_dibuat DESC',
      [pelanggan_id]
    );
    return rows;
  }

  // Get perangkat by ID
  static async getPerangkatById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, pel.nama_pelanggan, pel.no_telepon
       FROM perangkat p
       LEFT JOIN pelanggan pel ON p.pelanggan_id = pel.id
       WHERE p.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Create perangkat
  static async createPerangkat(data) {
    const { pelanggan_id, nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat, tanggal_instalasi } = data;

    const [result] = await pool.query(
      'INSERT INTO perangkat (pelanggan_id, nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat, tanggal_instalasi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        pelanggan_id,
        nama_perangkat,
        tipe_perangkat || 'router',
        ip_address || null,
        mac_address || null,
        serial_number || null,
        status_perangkat || 'aktif',
        tanggal_instalasi || null
      ]
    );

    return this.getPerangkatById(result.insertId);
  }

  // Update perangkat
  static async updatePerangkat(id, data) {
    const { nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat } = data;

    const [result] = await pool.query(
      'UPDATE perangkat SET nama_perangkat = ?, tipe_perangkat = ?, ip_address = ?, mac_address = ?, serial_number = ?, status_perangkat = ? WHERE id = ?',
      [
        nama_perangkat,
        tipe_perangkat || 'router',
        ip_address || null,
        mac_address || null,
        serial_number || null,
        status_perangkat || 'aktif',
        id
      ]
    );

    if (result.affectedRows === 0) return null;
    return this.getPerangkatById(id);
  }

  // Delete perangkat
  static async deletePerangkat(id) {
    const [result] = await pool.query('DELETE FROM perangkat WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = PerangkatModel;
