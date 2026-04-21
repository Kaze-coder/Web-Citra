/**
 * Geocoding Routes
 * Routes untuk endpoint geocoding
 */

const express = require('express');
const router = express.Router();
const GeocodingController = require('../controllers/GeocodingController');

// POST routes
router.post('/geocode', GeocodingController.geocodeAddress);
router.post('/reverse', GeocodingController.reverseGeocode);

module.exports = router;
