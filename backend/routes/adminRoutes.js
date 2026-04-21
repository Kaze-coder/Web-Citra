/**
 * Admin Routes (placeholder)
 * Routes untuk endpoint admin authentication
 */

const express = require('express');
const router = express.Router();

// Placeholder untuk admin login/register
router.post('/login', (req, res) => {
  res.json({
    success: false,
    message: 'Authentication not implemented yet'
  });
});

router.post('/register', (req, res) => {
  res.json({
    success: false,
    message: 'Registration not implemented yet'
  });
});

module.exports = router;
