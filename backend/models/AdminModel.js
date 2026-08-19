/**
 * Admin Model
 * Model untuk operasi database tabel admin (MySQL)
 */

const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminModel {
  // Cari admin berdasarkan username
  static async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Cari admin berdasarkan email
  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM admin WHERE email = ?', [email]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Cari admin berdasarkan ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM admin WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Buat admin baru (password di-hash bcrypt)
  static async create(data) {
    const { username, email, password, nama_lengkap, role, status } = data;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO admin (username, email, password, nama_lengkap, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, nama_lengkap || null, role || 'operator', status || 'aktif']
    );

    return this.findById(result.insertId);
  }

  // Bandingkan password plaintext dengan hash
  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update waktu login terakhir
  static async updateLastLogin(id) {
    await pool.query('UPDATE admin SET tanggal_login_terakhir = NOW() WHERE id = ?', [id]);
  }
}

module.exports = AdminModel;
