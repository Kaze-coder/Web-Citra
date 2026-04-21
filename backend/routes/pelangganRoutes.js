/**
 * Pelanggan Routes
 * Routes untuk endpoint pelanggan
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const PelangganController = require('../controllers/PelangganController');
const { validatePelanggan } = require('../middleware/validateInput');

// Setup multer untuk file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept Excel files dengan berbagai MIME types
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/x-excel',
      'application/x-msexcel'
    ];
    
    // Juga cek dari filename extension
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExt = require('path').extname(file.originalname).toLowerCase();
    
    const mimeOk = allowedMimes.includes(file.mimetype);
    const extOk = allowedExtensions.includes(fileExt);
    
    if (mimeOk || extOk) {
      cb(null, true);
    } else {
      cb(new Error(`Format file tidak sesuai. File: ${file.originalname}, MIME: ${file.mimetype}, Ext: ${fileExt}`));
    }
  }
});

// GET routes
router.get('/', PelangganController.getAllPelanggan);
router.get('/statistik', PelangganController.getStatistik);
router.get('/peta/coordinates', PelangganController.getPelangganWithCoordinates);
router.get('/:id', PelangganController.getPelangganById);

// POST route
router.post('/', validatePelanggan, PelangganController.createPelanggan);

// IMPORT route
router.post('/import/excel', upload.single('file'), PelangganController.importFromExcel);

// PUT route
router.put('/:id', validatePelanggan, PelangganController.updatePelanggan);

// DELETE route
router.delete('/:id', PelangganController.deletePelanggan);

module.exports = router;
