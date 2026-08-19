/**
 * Tagihan Model
 * Model untuk operasi database tabel tagihan (MySQL)
 */

const pool = require('../config/database');

class TagihanModel {
  // Get semua tagihan dengan join pelanggan + pagination + filter status
  static async getAllTagihan(page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;
    let where = '';
    const params = [];

    if (status) {
      where = ' WHERE t.status_pembayaran = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT t.*, p.nama_pelanggan, p.no_telepon
       FROM tagihan t
       LEFT JOIN pelanggan p ON t.pelanggan_id = p.id${where}
       ORDER BY t.bulan_tagihan DESC, t.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tagihan t${where}`,
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

  // Get tagihan by pelanggan ID
  static async getTagihanByPelangganId(pelanggan_id) {
    const [rows] = await pool.query(
      'SELECT * FROM tagihan WHERE pelanggan_id = ? ORDER BY bulan_tagihan DESC',
      [pelanggan_id]
    );
    return rows;
  }

  // Get tagihan by ID (dengan join pelanggan)
  static async getTagihanById(id) {
    const [rows] = await pool.query(
      `SELECT t.*, p.nama_pelanggan, p.no_telepon
       FROM tagihan t
       LEFT JOIN pelanggan p ON t.pelanggan_id = p.id
       WHERE t.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Get tagihan belum dibayar (dengan join pelanggan)
  static async getTagihanBelumBayar() {
    const [rows] = await pool.query(
      `SELECT t.*, p.nama_pelanggan, p.no_telepon
       FROM tagihan t
       LEFT JOIN pelanggan p ON t.pelanggan_id = p.id
       WHERE t.status_pembayaran = 'belum_lunas'
       ORDER BY t.bulan_tagihan ASC`
    );
    return rows;
  }

  // Get statistik tagihan: total/lunas/belum_lunas/cicilan + totalPemasukan
  static async getStatistikTagihan() {
    const [total] = await pool.query('SELECT COUNT(*) as count FROM tagihan');
    const [lunas] = await pool.query("SELECT COUNT(*) as count FROM tagihan WHERE status_pembayaran = 'lunas'");
    const [belumLunas] = await pool.query("SELECT COUNT(*) as count FROM tagihan WHERE status_pembayaran = 'belum_lunas'");
    const [cicilan] = await pool.query("SELECT COUNT(*) as count FROM tagihan WHERE status_pembayaran = 'cicilan'");
    const [pemasukan] = await pool.query("SELECT COALESCE(SUM(jumlah_tagihan), 0) as total FROM tagihan WHERE status_pembayaran = 'lunas'");

    return {
      total: total[0].count,
      lunas: lunas[0].count,
      belum_lunas: belumLunas[0].count,
      cicilan: cicilan[0].count,
      totalPemasukan: Number(pemasukan[0].total) || 0
    };
  }

  // Hitung tagihan belum lunas milik satu pelanggan
  static async countBelumLunasByPelanggan(pelanggan_id) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM tagihan WHERE pelanggan_id = ? AND status_pembayaran = 'belum_lunas'",
      [pelanggan_id]
    );
    return rows[0].count;
  }

  // Tagihan terakhir pelanggan (untuk scheduler)
  static async getLastBilling(pelanggan_id) {
    const [rows] = await pool.query(
      'SELECT * FROM tagihan WHERE pelanggan_id = ? ORDER BY bulan_tagihan DESC LIMIT 1',
      [pelanggan_id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Cek tagihan pada rentang bulan tertentu (untuk scheduler)
  static async findForBillingMonth(pelanggan_id, monthStart, monthEnd) {
    const [rows] = await pool.query(
      'SELECT * FROM tagihan WHERE pelanggan_id = ? AND bulan_tagihan >= ? AND bulan_tagihan < ? LIMIT 1',
      [pelanggan_id, monthStart, monthEnd]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Create tagihan
  static async createTagihan(data) {
    const { pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan } = data;

    const [result] = await pool.query(
      'INSERT INTO tagihan (pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran || 'belum_lunas', tanggal_pembayaran || null, metode_pembayaran || null, catatan || null]
    );

    return this.getTagihanById(result.insertId);
  }

  // Update tagihan
  static async updateTagihan(id, data) {
    const { bulan_tagihan, jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan } = data;

    const [result] = await pool.query(
      'UPDATE tagihan SET bulan_tagihan = ?, jumlah_tagihan = ?, status_pembayaran = ?, tanggal_pembayaran = ?, metode_pembayaran = ?, catatan = ? WHERE id = ?',
      [bulan_tagihan, jumlah_tagihan, status_pembayaran, tanggal_pembayaran || null, metode_pembayaran || null, catatan || null, id]
    );

    if (result.affectedRows === 0) return null;
    return this.getTagihanById(id);
  }

  // Delete tagihan
  static async deleteTagihan(id) {
    const [result] = await pool.query('DELETE FROM tagihan WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = TagihanModel;
