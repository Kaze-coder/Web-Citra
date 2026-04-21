/**
 * Perangkat Model
 * Model untuk operasi database tabel perangkat
 */

const pool = require('../config/database');

class PerangkatModel {
  // Get semua perangkat
  static async getAllPerangkat(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const [rows] = await pool.execute(
        `SELECT p.*, pel.nama_pelanggan 
         FROM perangkat p 
         LEFT JOIN pelanggan pel ON p.pelanggan_id = pel.id 
         ORDER BY p.tanggal_dibuat DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM perangkat');

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

  // Get perangkat by pelanggan ID
  static async getPerangkatByPelangganId(pelanggan_id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM perangkat WHERE pelanggan_id = ? ORDER BY tanggal_dibuat DESC',
        [pelanggan_id]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get perangkat by ID
  static async getPerangkatById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM perangkat WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Create perangkat
  static async createPerangkat(data) {
    try {
      const { pelanggan_id, nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat, tanggal_instalasi } = data;

      const [result] = await pool.execute(
        'INSERT INTO perangkat (pelanggan_id, nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat, tanggal_instalasi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        axios.get('/perangkat?page=1').then(r => {
          console.log('Field tipe:', r.data.data[0].tipe_perangkat);
          console.log('Whole object:', r.data.data[0]);
        })        [
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

      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Update perangkat
  static async updatePerangkat(id, data) {
    try {
      const { nama_perangkat, tipe_perangkat, ip_address, mac_address, serial_number, status_perangkat } = data;

      await pool.execute(
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

      return { id, ...data };
    } catch (error) {
      throw error;
    }
  }

  // Delete perangkat
  static async deletePerangkat(id) {
    try {
      await pool.execute('DELETE FROM perangkat WHERE id = ?', [id]);
      return { success: true, message: 'Perangkat berhasil dihapus' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PerangkatModel;
