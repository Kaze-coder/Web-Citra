/**
 * Perangkat Routes
 * Routes untuk endpoint perangkat
 */

const express = require('express');
const router = express.Router();
const PerangkatController = require('../controllers/PerangkatController');
const { validatePerangkat } = require('../middleware/validateInput');

// GET routes
router.get('/', PerangkatController.getAllPerangkat);
router.get('/pelanggan/:pelanggan_id', PerangkatController.getPerangkatByPelangganId);
router.get('/:id', PerangkatController.getPerangkatById);

// POST route
router.post('/', validatePerangkat, PerangkatController.createPerangkat);

// PUT route
router.put('/:id', PerangkatController.updatePerangkat);

// DELETE route
router.delete('/:id', PerangkatController.deletePerangkat);

module.exports = router;
