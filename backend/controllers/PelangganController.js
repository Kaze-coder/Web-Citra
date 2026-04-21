/**
 * Pelanggan Controller
 * Controller untuk menangani request pelanggan
 */

const PelangganModel = require('../models/PelangganModel');
const LokasiModel = require('../models/LokasiModel');

class PelangganController {
  // GET all pelanggan
  static async getAllPelanggan(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';

      const result = await PelangganModel.getAllPelanggan(page, limit, search);

      res.json({
        success: true,
        message: 'Data pelanggan berhasil diambil',
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error) {
      console.error('Error getting pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pelanggan',
        error: error.message
      });
    }
  }

  // GET statistik pelanggan
  static async getStatistik(req, res) {
    try {
      const result = await PelangganModel.getStatistik();

      res.json({
        success: true,
        message: 'Statistik pelanggan berhasil diambil',
        data: result
      });
    } catch (error) {
      console.error('Error getting statistik:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik pelanggan',
        error: error.message
      });
    }
  }

  // GET pelanggan by ID
  static async getPelangganById(req, res) {
    try {
      const { id } = req.params;
      const pelanggan = await PelangganModel.getPelangganById(id);

      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Data pelanggan berhasil diambil',
        data: pelanggan
      });
    } catch (error) {
      console.error('Error getting pelanggan by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pelanggan',
        error: error.message
      });
    }
  }

  // POST create pelanggan baru
  static async createPelanggan(req, res) {
    try {
      const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, tanggal_langganan, latitude, longitude } = req.body;

      // Validasi data
      if (!nama_pelanggan || !no_telepon || !alamat || !tanggal_langganan) {
        return res.status(400).json({
          success: false,
          message: 'Data pelanggan tidak lengkap'
        });
      }

      // Create pelanggan
      const pelanggan = await PelangganModel.createPelanggan({
        nama_pelanggan,
        no_telepon,
        email,
        alamat,
        status,
        paket_layanan,
        harga_bulanan,
        tanggal_langganan
      });

      // Create lokasi jika ada koordinat
      if (latitude && longitude) {
        await LokasiModel.createLokasi({
          pelanggan_id: pelanggan.id,
          latitude,
          longitude,
          keterangan_lokasi: alamat
        });
      }

      res.status(201).json({
        success: true,
        message: 'Pelanggan baru berhasil ditambahkan',
        data: pelanggan
      });
    } catch (error) {
      console.error('Error creating pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan pelanggan baru',
        error: error.message
      });
    }
  }

  // PUT update pelanggan
  static async updatePelanggan(req, res) {
    try {
      const { id } = req.params;
      const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, latitude, longitude } = req.body;

      // Check if pelanggan exists
      const pelanggan = await PelangganModel.getPelangganById(id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      // Update pelanggan
      const updated = await PelangganModel.updatePelanggan(id, {
        nama_pelanggan,
        no_telepon,
        email,
        alamat,
        status,
        paket_layanan,
        harga_bulanan
      });

      // Update lokasi jika ada koordinat baru
      if (latitude && longitude) {
        const existingLokasi = await LokasiModel.getLokasiByPelangganId(id);
        
        if (existingLokasi) {
          // Update existing lokasi
          await LokasiModel.updateLokasi(existingLokasi.id, {
            latitude,
            longitude,
            keterangan_lokasi: alamat
          });
        } else {
          // Create new lokasi
          await LokasiModel.createLokasi({
            pelanggan_id: id,
            latitude,
            longitude,
            keterangan_lokasi: alamat
          });
        }
      }

      res.json({
        success: true,
        message: 'Pelanggan berhasil diperbarui',
        data: updated
      });
    } catch (error) {
      console.error('Error updating pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pelanggan',
        error: error.message
      });
    }
  }

  // DELETE pelanggan
  static async deletePelanggan(req, res) {
    try {
      const { id } = req.params;

      // Check if pelanggan exists
      const pelanggan = await PelangganModel.getPelangganById(id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      // Delete pelanggan (cascade delete akan menghapus data terkait)
      await PelangganModel.deletePelanggan(id);

      res.json({
        success: true,
        message: 'Pelanggan berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus pelanggan',
        error: error.message
      });
    }
  }

  // GET pelanggan with coordinates untuk peta
  static async getPelangganWithCoordinates(req, res) {
    try {
      const pool = require('../config/database');
      
      const query = `
        SELECT 
          p.id,
          p.nama_pelanggan,
          p.no_telepon,
          p.email,
          p.alamat,
          p.status,
          p.paket_layanan,
          p.harga_bulanan,
          COALESCE(l.latitude, 0) as latitude,
          COALESCE(l.longitude, 0) as longitude,
          COALESCE(l.keterangan_lokasi, '') as keterangan_lokasi
        FROM pelanggan p
        LEFT JOIN lokasi l ON p.id = l.pelanggan_id
        WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL AND l.latitude != 0 AND l.longitude != 0
        ORDER BY p.nama_pelanggan ASC
      `;

      const [rows] = await pool.execute(query);

      console.log(`✓ GetPelangganWithCoordinates: Found ${rows.length} locations`);

      res.json({
        success: true,
        message: 'Data pelanggan dengan koordinat berhasil diambil',
        data: rows || []
      });
    } catch (error) {
      console.error('Error getting pelanggan with coordinates:', error.message);
      res.json({
        success: true,
        message: 'Data pelanggan dengan koordinat berhasil diambil (kosong)',
        data: []
      });
    }
  }

  // IMPORT pelanggan from Excel
  static async importFromExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File tidak ditemukan'
        });
      }

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      
      const worksheet = workbook.getWorksheet(1);
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Skip header row
      worksheet.eachRow(async (row, rowNumber) => {
        if (rowNumber === 1) return;

        try {
          // Get values from Excel columns
          const nama_pelanggan = row.getCell(1).value;
          const no_telepon = row.getCell(2).value;
          const email = row.getCell(3).value;
          const alamat = row.getCell(4).value;
          const paket_layanan = row.getCell(5).value;
          const harga_bulanan = row.getCell(6).value;
          const status = row.getCell(7).value || 'aktif';
          const tanggal_langganan = row.getCell(8).value;
          const latitude = row.getCell(9).value;
          const longitude = row.getCell(10).value;

          // Validasi required fields
          if (!nama_pelanggan || !no_telepon || !alamat) {
            errorCount++;
            errors.push(`Baris ${rowNumber}: Data tidak lengkap (nama, telepon, alamat wajib diisi)`);
            return;
          }

          // Create pelanggan
          const pelanggan = await PelangganModel.createPelanggan({
            nama_pelanggan: String(nama_pelanggan).trim(),
            no_telepon: String(no_telepon).trim(),
            email: email ? String(email).trim() : null,
            alamat: String(alamat).trim(),
            status: String(status).toLowerCase(),
            paket_layanan: paket_layanan ? String(paket_layanan).trim() : null,
            harga_bulanan: harga_bulanan ? parseFloat(harga_bulanan) : 0,
            tanggal_langganan: tanggal_langganan || new Date().toISOString().split('T')[0]
          });

          // Create lokasi jika ada koordinat
          if (latitude && longitude) {
            await LokasiModel.createLokasi({
              pelanggan_id: pelanggan.id,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              keterangan_lokasi: alamat
            });
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Baris ${rowNumber}: ${error.message}`);
        }
      });

      res.json({
        success: true,
        message: `Import berhasil: ${successCount} data ditambahkan, ${errorCount} error`,
        data: {
          successCount,
          errorCount,
          errors: errors
        }
      });
    } catch (error) {
      console.error('Error importing Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal import file Excel',
        error: error.message
      });
    }
  }
}

module.exports = PelangganController;
