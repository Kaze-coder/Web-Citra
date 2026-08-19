/**
 * Citra NET Manager - Main Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const pelangganRoutes = require('./routes/pelangganRoutes');
const perangkatRoutes = require('./routes/perangkatRoutes');
const tagihanRoutes = require('./routes/tagihanRoutes');
const lokasiRoutes = require('./routes/lokasiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const geocodingRoutes = require('./routes/geocodingRoutes');
const billingSchedulerRoutes = require('./routes/billingSchedulerRoutes');
const billingScheduleRoutes = require('./routes/billingScheduleRoutes');
const earthEngineRoutes = require('./routes/earthEngineRoutes');

// Load services
const BillingScheduler = require('./services/BillingScheduler');
const EarthEngineService = require('./services/EarthEngineService');

// Initialize Express App
const app = express();

// CORS: origin yang diizinkan dibaca dari env FRONTEND_ORIGIN (default lokal)
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa header Origin (same-origin/static, curl, dsb)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File statis frontend (publik, tanpa auth)
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging request
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint (publik)
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
      whatsapp: '/api/whatsapp',
      billing: '/api/billing',
      earthEngine: '/api/earth-engine'
    }
  });
});

// Routes API publik: auth admin (login & register)
app.use('/api/admin', adminRoutes);

// Middleware auth: lindungi SEMUA route /api lainnya dengan Bearer JWT
app.use('/api', auth);

// Routes API (protected)
app.use('/api/pelanggan', pelangganRoutes);
app.use('/api/perangkat', perangkatRoutes);
app.use('/api/tagihan', tagihanRoutes);
app.use('/api/lokasi', lokasiRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/billing', billingSchedulerRoutes);
app.use('/api/billing-schedule', billingScheduleRoutes);
app.use('/api/earth-engine', earthEngineRoutes);

// Tangani 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.path
  });
});

// Error Handler (final)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
testConnection(); // Cek koneksi MySQL (non-blocking)

app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║  Citra NET Manager - Server Aktif     ║`);
  console.log(`║  Akses: http://localhost:${PORT}           ║`);
  console.log(`╚═══════════════════════════════════════╝`);

  // Jalankan scheduler
  BillingScheduler.start();

  // Initialize Google Earth Engine (non-blocking)
  EarthEngineService.initialize().catch(err => {
    console.error('⚠️ Earth Engine init gagal (peta akan fallback ke OSM):', err.message);
  });
});

module.exports = app;
