/**
 * Error Handler Middleware
 * Menangani semua error di aplikasi
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validasi error
  if (err.statusCode === 400 || err.message.includes('validation')) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Validasi data gagal'
    });
  }

  // Database error
  if (err.code && (err.code.includes('ER_') || err.code.includes('PROTOCOL'))) {
    return res.status(500).json({
      success: false,
      message: 'Database error. Hubungi administrator'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
