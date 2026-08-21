/**
 * Pelanggan Model
 * Model untuk operasi database tabel pelanggan (MySQL)
 */

const pool = require('../config/database');

class PelangganModel {
  // Get semua pelanggan dengan pagination + search
  static async getAllPelanggan(page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let where = '';
    const params = [];

    if (search) {
      where = ' WHERE nama_pelanggan LIKE ? OR no_telepon LIKE ? OR alamat LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // JOIN lokasi agar setiap baris membawa latitude/longitude (untuk peta/KML/Earth)
    const whereJoined = where.replace(/\bnama_pelanggan\b/g, 'p.nama_pelanggan')
      .replace(/\bno_telepon\b/g, 'p.no_telepon')
      .replace(/\balamat\b/g, 'p.alamat');
    const [rows] = await pool.query(
      `SELECT p.*, l.latitude, l.longitude FROM pelanggan p
       LEFT JOIN lokasi l ON l.pelanggan_id = p.id${whereJoined}
       ORDER BY p.tanggal_dibuat DESC, p.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM pelanggan${where}`,
      params
    );

    const total = countResult[0].total;
    return {
      data: rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  // Get semua pelanggan aktif (untuk scheduler/billing)
  static async getPelangganAktif() {
    const [rows] = await pool.query(
      "SELECT * FROM pelanggan WHERE status = 'aktif' ORDER BY nama_pelanggan ASC"
    );
    return rows;
  }

  // Get semua pelanggan (untuk auto-geocode)
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM pelanggan ORDER BY id ASC');
    return rows;
  }

  // Get pelanggan by ID
  static async getPelangganById(id) {
    const [rows] = await pool.query('SELECT * FROM pelanggan WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Get statistik pelanggan
  static async getStatistik() {
    const [total] = await pool.query('SELECT COUNT(*) as count FROM pelanggan');
    const [aktif] = await pool.query("SELECT COUNT(*) as count FROM pelanggan WHERE status = 'aktif'");
    const [nonaktif] = await pool.query("SELECT COUNT(*) as count FROM pelanggan WHERE status = 'nonaktif'");
    const [suspend] = await pool.query("SELECT COUNT(*) as count FROM pelanggan WHERE status = 'suspend'");

    return {
      total: total[0].count,
      aktif: aktif[0].count,
      nonaktif: nonaktif[0].count,
      suspend: suspend[0].count
    };
  }

  // Create pelanggan baru
  static async createPelanggan(data) {
    const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, tanggal_langganan } = data;

    const [result] = await pool.query(
      'INSERT INTO pelanggan (nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, tanggal_langganan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nama_pelanggan, no_telepon, email || null, alamat, status || 'aktif', paket_layanan || null, harga_bulanan || null, tanggal_langganan]
    );

    return this.getPelangganById(result.insertId);
  }

  // Update pelanggan
  static async updatePelanggan(id, data) {
    const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan } = data;

    const [result] = await pool.query(
      'UPDATE pelanggan SET nama_pelanggan = ?, no_telepon = ?, email = ?, alamat = ?, status = ?, paket_layanan = ?, harga_bulanan = ? WHERE id = ?',
      [nama_pelanggan, no_telepon, email || null, alamat, status || 'aktif', paket_layanan || null, harga_bulanan || null, id]
    );

    if (result.affectedRows === 0) return null;
    return this.getPelangganById(id);
  }

  // Delete pelanggan (FK ON DELETE CASCADE menghapus lokasi/perangkat/tagihan terkait)
  static async deletePelanggan(id) {
    const [result] = await pool.query('DELETE FROM pelanggan WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = PelangganModel;
