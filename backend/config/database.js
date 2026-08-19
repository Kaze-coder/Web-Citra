/**
 * Database Configuration - MySQL (mysql2/promise)
 * Koneksi ke MySQL lokal (Laragon/phpMyAdmin)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isp_management',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Kembalikan DATE/DATETIME sebagai string agar konsisten di JSON
});

// Cek koneksi awal (non-blocking: server tetap jalan walau DB belum siap)
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✓ MySQL Connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'isp_management'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`✗ Error koneksi MySQL: ${error.message}`);
    return false;
  }
};

// PENTING: jangan set `module.exports.pool = pool` — itu menimpa properti internal
// `this.pool` milik mysql2 PromisePool dan menyebabkan rekursi tak terbatas di query().
pool.testConnection = testConnection;

module.exports = pool;
