/**
 * Earth Engine Routes
 * Routes untuk endpoint Google Earth Engine
 */

const express = require('express');
const router = express.Router();
const EarthEngineController = require('../controllers/EarthEngineController');

// GET tile layer URLs
router.get('/tiles', EarthEngineController.getTileLayers);

// GET status koneksi GEE
router.get('/status', EarthEngineController.getStatus);

// POST clear tile cache
router.post('/clear-cache', EarthEngineController.clearCache);

module.exports = router;
