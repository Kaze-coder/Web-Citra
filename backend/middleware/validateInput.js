/**
 * Input Validation Middleware
 * Validasi data yang dikirim dari frontend
 */

// Validasi data pelanggan
const validatePelanggan = (req, res, next) => {
  const { nama_pelanggan, no_telepon, alamat, paket_layanan, harga_bulanan } = req.body;

  if (!nama_pelanggan || nama_pelanggan.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Nama pelanggan harus diisi'
    });
  }

  if (!no_telepon || !/^(\+62|0)[0-9]{9,12}$/.test(no_telepon.replace(/[-\s]/g, ''))) {
    return res.status(400).json({
      success: false,
      message: 'Nomor telepon harus valid (62xxx atau 0xxx)'
    });
  }

  if (!alamat || alamat.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Alamat harus diisi'
    });
  }

  next();
};

// Validasi data perangkat
const validatePerangkat = (req, res, next) => {
  const { pelanggan_id, nama_perangkat, tipe_perangkat } = req.body;

  if (!pelanggan_id) {
    return res.status(400).json({
      success: false,
      message: 'ID pelanggan harus diisi'
    });
  }

  if (!nama_perangkat || nama_perangkat.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Nama perangkat harus diisi'
    });
  }

  next();
};

// Validasi data tagihan
const validateTagihan = (req, res, next) => {
  const { pelanggan_id, bulan_tagihan, jumlah_tagihan } = req.body;

  if (!pelanggan_id) {
    return res.status(400).json({
      success: false,
      message: 'ID pelanggan harus diisi'
    });
  }

  if (!bulan_tagihan) {
    return res.status(400).json({
      success: false,
      message: 'Bulan tagihan harus diisi'
    });
  }

  if (!jumlah_tagihan || jumlah_tagihan <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Jumlah tagihan harus lebih dari 0'
    });
  }

  next();
};

module.exports = {
  validatePelanggan,
  validatePerangkat,
  validateTagihan
};
