/**
 * ISP Management System - Main Server
 * Backend API untuk Sistem Manajemen Pelanggan WiFi
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const pelangganRoutes = require('./routes/pelangganRoutes');
const perangkatRoutes = require('./routes/perangkatRoutes');
const tagihanRoutes = require('./routes/tagihanRoutes');
const lokasiRoutes = require('./routes/lokasiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const geocodingRoutes = require('./routes/geocodingRoutes');

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// Routes API
app.use('/api/pelanggan', pelangganRoutes);
app.use('/api/perangkat', perangkatRoutes);
app.use('/api/tagihan', tagihanRoutes);
app.use('/api/lokasi', lokasiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/geocoding', geocodingRoutes);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'ISP Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      pelanggan: '/api/pelanggan',
      perangkat: '/api/perangkat',
      tagihan: '/api/tagihan',
      lokasi: '/api/lokasi',
      admin: '/api/admin',
      whatsapp: '/api/whatsapp'
    }
  });
});

// 404 Error Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.path
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║  ISP Management System - API Server  ║`);
  console.log(`║  Running on http://localhost:${PORT}      ║`);
  console.log(`╚═══════════════════════════════════════╝\n`);
});

module.exports = app;
