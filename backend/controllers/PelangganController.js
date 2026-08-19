/**
 * Pelanggan Controller
 */

const PelangganModel = require('../models/PelangganModel');
const LokasiModel = require('../models/LokasiModel');
const TagihanModel = require('../models/TagihanModel');
const geocoding = require('../services/GeocodingService');

class PelangganController {
  // Ambil semua pelanggan
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

  // Ambil statistik pelanggan
  static async getStatistik(req, res) {
    try {
      const statistik = await PelangganModel.getStatistik();
      const statistikTagihan = await TagihanModel.getStatistikTagihan();

      res.json({
        success: true,
        message: 'Statistik pelanggan berhasil diambil',
        data: {
          total: statistik.total,
          aktif: statistik.aktif,
          tagihanBelum: statistikTagihan.belum_lunas,
          totalPemasukan: statistikTagihan.totalPemasukan
        }
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

  // Ambil pelanggan berdasarkan ID
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

      // Ambil lokasi jika ada
      const lokasi = await LokasiModel.getLokasiByPelangganId(id);

      res.json({
        success: true,
        message: 'Data pelanggan berhasil diambil',
        data: {
          ...pelanggan,
          latitude: lokasi ? Number(lokasi.latitude) : 0,
          longitude: lokasi ? Number(lokasi.longitude) : 0
        }
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

  // Buat pelanggan baru
  static async createPelanggan(req, res) {
    try {
      const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, tanggal_langganan, latitude, longitude } = req.body;

      // Create pelanggan
      const pelanggan = await PelangganModel.createPelanggan({
        nama_pelanggan,
        no_telepon,
        email,
        alamat,
        status: status || 'aktif',
        paket_layanan,
        harga_bulanan,
        tanggal_langganan: tanggal_langganan || new Date()
      });

      // Create lokasi jika ada koordinat
      if (latitude && longitude) {
        await LokasiModel.createLokasi({
          pelanggan_id: pelanggan.id,
          latitude,
          longitude,
          keterangan_lokasi: `Lokasi ${nama_pelanggan}`
        });
      } else {
        // Auto geocode dari alamat
        const geoResult = await geocoding.geocodeAddress(alamat);

        if (geoResult.success) {
          await LokasiModel.createLokasi({
            pelanggan_id: pelanggan.id,
            latitude: geoResult.latitude,
            longitude: geoResult.longitude,
            keterangan_lokasi: `Auto-generated dari alamat: ${alamat}`
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Pelanggan baru berhasil ditambahkan',
        data: pelanggan
      });
    } catch (error) {
      console.error('Error creating pelanggan:', error);

      // Duplicate no_telepon (UNIQUE)
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Nomor telepon sudah terdaftar',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan pelanggan baru',
        error: error.message
      });
    }
  }

  // Perbarui data pelanggan
  static async updatePelanggan(req, res) {
    try {
      const { id } = req.params;
      const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, latitude, longitude } = req.body;

      const pelanggan = await PelangganModel.updatePelanggan(id, {
        nama_pelanggan,
        no_telepon,
        email,
        alamat,
        status,
        paket_layanan,
        harga_bulanan
      });

      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      // Update/Create lokasi
      if (latitude && longitude) {
        await LokasiModel.upsertLokasiByPelanggan(id, {
          latitude,
          longitude,
          keterangan_lokasi: alamat
        });
      }

      res.json({
        success: true,
        message: 'Pelanggan berhasil diperbarui',
        data: pelanggan
      });
    } catch (error) {
      console.error('Error updating pelanggan:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Nomor telepon sudah terdaftar',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pelanggan',
        error: error.message
      });
    }
  }

  // Hapus pelanggan
  static async deletePelanggan(req, res) {
    try {
      const { id } = req.params;

      // FK ON DELETE CASCADE ikut menghapus lokasi, perangkat, dan tagihan terkait
      const deleted = await PelangganModel.deletePelanggan(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

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

  // Ambil data untuk peta
  static async getPelangganWithCoordinates(req, res) {
    try {
      const lokasiList = await LokasiModel.getAllLokasi();

      const data = lokasiList
        .filter(l => l.pelanggan_id && l.nama_pelanggan)
        .map(l => ({
          id: l.pelanggan_id,
          nama_pelanggan: l.nama_pelanggan,
          no_telepon: l.no_telepon,
          email: l.email,
          alamat: l.alamat,
          status: l.status,
          paket_layanan: l.paket_layanan,
          harga_bulanan: Number(l.harga_bulanan) || 0,
          latitude: Number(l.latitude),
          longitude: Number(l.longitude),
          keterangan_lokasi: l.keterangan_lokasi
        }));

      res.json({
        success: true,
        message: 'Data pelanggan dengan koordinat berhasil diambil',
        data
      });
    } catch (error) {
      console.error('Error getting pelanggan with coordinates:', error);
      res.json({
        success: true,
        message: 'Data pelanggan dengan koordinat berhasil diambil (kosong)',
        data: []
      });
    }
  }

  // Auto-geocode alamat pelanggan
  static async geocodeAllPelanggan(req, res) {
    try {
      const pelangganList = await PelangganModel.getAll();
      let geocoded = 0;
      let failed = 0;

      for (const p of pelangganList) {
        const hasLokasi = await LokasiModel.getLokasiByPelangganId(p.id);
        if (!hasLokasi || !hasLokasi.latitude) {
          const result = await geocoding.geocodeAddress(p.alamat);
          if (result.success) {
            await LokasiModel.upsertLokasiByPelanggan(p.id, {
              latitude: result.latitude,
              longitude: result.longitude,
              keterangan_lokasi: p.alamat
            });
            geocoded++;
          } else {
            failed++;
          }
          // Simple delay (rate limit Nominatim)
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      res.json({
        success: true,
        message: `Geocoding selesai: ${geocoded} berhasil, ${failed} gagal`,
        geocoded,
        failed
      });
    } catch (error) {
      console.error('Error in geocodeAllPelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal melakukan auto-geocode',
        error: error.message
      });
    }
  }

  // Import pelanggan dari Excel
  static async importFromExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
      }

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return res.status(400).json({ success: false, message: 'Sheet pertama tidak ditemukan' });
      }

      // Baris 1 = header, cari kolom berdasarkan nama header
      const headerMap = {};
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        const header = String(cell.value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        headerMap[header] = colNumber;
      });

      const col = (name) => headerMap[name] || null;
      const colNama = col('namapelanggan') || col('nama');
      const colTelepon = col('notelepon') || col('telepon') || col('nohp');
      const colEmail = col('email');
      const colAlamat = col('alamat');
      const colPaket = col('paketlayanan') || col('paket');
      const colHarga = col('hargabulanan') || col('harga');
      const colTanggal = col('tanggallangganan');

      if (!colNama || !colTelepon || !colAlamat) {
        return res.status(400).json({
          success: false,
          message: 'Kolom wajib tidak ditemukan. Header harus memuat: nama_pelanggan, no_telepon, alamat'
        });
      }

      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const nama_pelanggan = String(row.getCell(colNama).value || '').trim();
        const no_telepon = String(row.getCell(colTelepon).value || '').trim();
        const alamat = String(row.getCell(colAlamat).value || '').trim();

        if (!nama_pelanggan || !no_telepon || !alamat) {
          skipped++;
          continue;
        }

        const email = colEmail ? String(row.getCell(colEmail).value || '').trim() : null;
        const paket_layanan = colPaket ? String(row.getCell(colPaket).value || '').trim() : null;
        const harga_bulanan = colHarga ? Number(row.getCell(colHarga).value) || null : null;

        let tanggal_langganan = null;
        if (colTanggal) {
          const raw = row.getCell(colTanggal).value;
          const parsed = raw instanceof Date ? raw : new Date(raw);
          if (!isNaN(parsed.getTime())) tanggal_langganan = parsed;
        }
        if (!tanggal_langganan) tanggal_langganan = new Date();

        try {
          const pelanggan = await PelangganModel.createPelanggan({
            nama_pelanggan,
            no_telepon,
            email,
            alamat,
            status: 'aktif',
            paket_layanan,
            harga_bulanan,
            tanggal_langganan
          });

          // Auto geocode dari alamat (best effort)
          const geoResult = await geocoding.geocodeAddress(alamat);
          if (geoResult.success) {
            await LokasiModel.createLokasi({
              pelanggan_id: pelanggan.id,
              latitude: geoResult.latitude,
              longitude: geoResult.longitude,
              keterangan_lokasi: `Auto-generated dari alamat: ${alamat}`
            });
          }

          imported++;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            skipped++;
          } else {
            errors.push(`Baris ${i}: ${err.message}`);
          }
        }
      }

      res.json({
        success: true,
        message: `Import selesai: ${imported} berhasil, ${skipped} dilewati${errors.length > 0 ? `, ${errors.length} error` : ''}`,
        data: { imported, skipped, errors }
      });
    } catch (error) {
      console.error('Error importing from Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengimpor data dari Excel',
        error: error.message
      });
    }
  }
}

module.exports = PelangganController;
