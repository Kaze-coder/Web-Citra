/**
 * Lokasi Routes
 * Routes untuk endpoint lokasi
 */

const express = require('express');
const router = express.Router();
const LokasiController = require('../controllers/LokasiController');

// GET routes
router.get('/', LokasiController.getAllLokasi);
router.get('/pelanggan/:pelanggan_id', LokasiController.getLokasiByPelangganId);

// POST route
router.post('/', LokasiController.createLokasi);

// PUT route
router.put('/:id', LokasiController.updateLokasi);

// DELETE route
router.delete('/:id', LokasiController.deleteLokasi);

module.exports = router;
