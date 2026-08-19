/**
 * Admin Routes
 * Routes untuk endpoint admin authentication
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');

// POST /api/admin/login
router.post('/login', AdminController.login);

// POST /api/admin/register
router.post('/register', AdminController.register);

module.exports = router;
