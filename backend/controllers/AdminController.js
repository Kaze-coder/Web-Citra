/**
 * Admin Controller
 * Authentication: login & register (JWT + bcrypt)
 */

const jwt = require('jsonwebtoken');
const AdminModel = require('../models/AdminModel');
require('dotenv').config();

class AdminController {
  // POST /api/admin/login
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password harus diisi'
        });
      }

      const admin = await AdminModel.findByUsername(username);
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }

      if (admin.status !== 'aktif') {
        return res.status(403).json({
          success: false,
          message: 'Akun tidak aktif. Hubungi administrator.'
        });
      }

      const isMatch = await AdminModel.comparePassword(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret || secret === 'your_super_secret_jwt_key_here') {
        return res.status(500).json({
          success: false,
          message: 'JWT_SECRET belum dikonfigurasi di file .env'
        });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role },
        secret,
        { expiresIn: '1d' }
      );

      await AdminModel.updateLastLogin(admin.id);

      res.json({
        success: true,
        message: 'Login berhasil',
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Error login:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal melakukan login',
        error: error.message
      });
    }
  }

  // POST /api/admin/register
  static async register(req, res) {
    try {
      const { username, email, password, nama_lengkap, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, dan password harus diisi'
        });
      }

      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter'
        });
      }

      const existingUsername = await AdminModel.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah terdaftar'
        });
      }

      const existingEmail = await AdminModel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }

      const admin = await AdminModel.create({
        username,
        email,
        password,
        nama_lengkap,
        role: ['super_admin', 'admin', 'operator'].includes(role) ? role : 'operator'
      });

      res.status(201).json({
        success: true,
        message: 'Registrasi admin berhasil',
        data: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Error register:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Username atau email sudah terdaftar',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Gagal melakukan registrasi',
        error: error.message
      });
    }
  }
}

module.exports = AdminController;
