/**
 * Tagihan Routes
 */

const express = require('express');
const router = express.Router();
const TagihanController = require('../controllers/TagihanController');
const { validateTagihan } = require('../middleware/validateInput');

// Endpoint GET
router.get('/', TagihanController.getAllTagihan);
router.get('/statistik', TagihanController.getStatistikTagihan);
router.get('/belum-bayar', TagihanController.getTagihanBelumBayar);
router.get('/:id', TagihanController.getTagihanById);
router.get('/pelanggan/:pelanggan_id', TagihanController.getTagihanByPelangganId);

// Endpoint POST
router.post('/', validateTagihan, TagihanController.createTagihan);

// Endpoint PUT
router.put('/:id', TagihanController.updateTagihan);

// Endpoint DELETE
router.delete('/:id', TagihanController.deleteTagihan);

module.exports = router;
