/**
 * Tagihan Routes
 * Routes untuk endpoint tagihan
 */

const express = require('express');
const router = express.Router();
const TagihanController = require('../controllers/TagihanController');
const { validateTagihan } = require('../middleware/validateInput');

// GET routes
router.get('/', TagihanController.getAllTagihan);
router.get('/statistik', TagihanController.getStatistikTagihan);
router.get('/belum-bayar', TagihanController.getTagihanBelumBayar);
router.get('/pelanggan/:pelanggan_id', TagihanController.getTagihanByPelangganId);

// POST route
router.post('/', validateTagihan, TagihanController.createTagihan);

// PUT route
router.put('/:id', TagihanController.updateTagihan);

// DELETE route
router.delete('/:id', TagihanController.deleteTagihan);

module.exports = router;
