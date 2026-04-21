/**
 * Database Connection Configuration
 * File ini mengatur koneksi ke database MySQL
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Buat connection pool untuk performa lebih baik
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isp_management',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test koneksi database
pool.getConnection()
  .then(connection => {
    console.log('✓ Database berhasil terhubung!');
    connection.release();
  })
  .catch(err => {
    console.error('✗ Error koneksi database:', err.message);
  });

module.exports = pool;
